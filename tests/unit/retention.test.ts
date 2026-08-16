import { beforeAll, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { prisma } from "@/lib/db";
import { archiveOldConversations, purgeDueBusinesses } from "@/lib/retention";

describe("rétention des données", () => {
  beforeAll(() => {
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  });

  it("archive les conversations de plus de 12 mois et masque le texte", async () => {
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.subscriptionPayment.deleteMany();
    await prisma.business.deleteMany();

    const biz = await prisma.business.create({
      data: {
        name: "Salon archive",
        slug: `arch-${Date.now()}`,
        category: "salon",
        neighborhood: "Médina",
        address: "x",
        hoursJson: "{}",
        greetingFr: "Bonjour ici le salon de test pour Assistant Bi.",
        greetingWo: "Asalaam aleekum salon test Assistant Bi la.",
        ownerPhone: "+221771000010",
      },
    });
    const customer = await prisma.customer.create({
      data: { businessId: biz.id, phone: "+221771000011" },
    });
    const old = await prisma.conversation.create({
      data: {
        businessId: biz.id,
        customerId: customer.id,
        status: "bot",
        createdAt: new Date("2024-01-01T10:00:00Z"),
      },
    });
    await prisma.message.create({
      data: {
        conversationId: old.id,
        direction: "inbound",
        text: "Prix tresses ?",
      },
    });
    const recent = await prisma.conversation.create({
      data: {
        businessId: biz.id,
        customerId: customer.id,
        status: "bot",
      },
    });

    const n = await archiveOldConversations(new Date("2026-08-16T12:00:00Z"));
    expect(n).toBe(1);

    const archived = await prisma.conversation.findUnique({ where: { id: old.id } });
    const kept = await prisma.conversation.findUnique({ where: { id: recent.id } });
    const msg = await prisma.message.findFirst({ where: { conversationId: old.id } });
    expect(archived?.status).toBe("archived");
    expect(kept?.status).toBe("bot");
    expect(msg?.text).toBe("[archivé]");
  });

  it("purge un commerce après 30 jours sans toucher aux paiements", async () => {
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.subscriptionPayment.deleteMany();
    await prisma.user.deleteMany({ where: { phone: { startsWith: "+22177100002" } } });
    await prisma.business.deleteMany({ where: { slug: { startsWith: "purge-" } } });

    const now = new Date("2026-08-16T12:00:00Z");
    const biz = await prisma.business.create({
      data: {
        name: "Garage à purger",
        slug: `purge-${Date.now()}`,
        category: "garage",
        neighborhood: "Pikine",
        address: "y",
        hoursJson: "{}",
        greetingFr: "Bonjour ici le garage de test pour Assistant Bi.",
        greetingWo: "Asalaam aleekum garage test Assistant Bi la.",
        ownerPhone: "+221771000020",
        status: "cancelled",
        cancelledAt: new Date("2026-07-01T12:00:00Z"),
        purgeAfter: new Date("2026-07-31T12:00:00Z"),
      },
    });
    await prisma.user.create({
      data: {
        phone: "+221771000021",
        pinHash: "x",
        name: "Patron",
        businessId: biz.id,
      },
    });
    const customer = await prisma.customer.create({
      data: { businessId: biz.id, phone: "+221771000022", name: "Client" },
    });
    await prisma.conversation.create({
      data: { businessId: biz.id, customerId: customer.id, status: "bot" },
    });
    const pay = await prisma.subscriptionPayment.create({
      data: {
        businessId: biz.id,
        amountFcfa: 3000,
        channel: "wave",
        provider: "wave",
        planId: "standard",
        status: "confirmed",
        periodStart: new Date("2026-07-01"),
        periodEnd: new Date("2026-08-01"),
        confirmedAt: new Date("2026-07-02"),
      },
    });

    const n = await purgeDueBusinesses(now);
    expect(n).toBeGreaterThanOrEqual(1);

    const after = await prisma.business.findUnique({ where: { id: biz.id } });
    const customers = await prisma.customer.count({ where: { businessId: biz.id } });
    const payment = await prisma.subscriptionPayment.findUnique({ where: { id: pay.id } });
    expect(after?.purgedAt).not.toBeNull();
    expect(after?.name).toBe("Compte supprimé");
    expect(customers).toBe(0);
    expect(payment?.status).toBe("confirmed");
    expect(payment?.amountFcfa).toBe(3000);
  });

  it("ne purge pas avant la date de grâce", async () => {
    const biz = await prisma.business.create({
      data: {
        name: "Encore en grâce",
        slug: `grace-${Date.now()}`,
        category: "salon",
        neighborhood: "Almadies",
        address: "z",
        hoursJson: "{}",
        greetingFr: "Bonjour ici le salon de test pour Assistant Bi.",
        greetingWo: "Asalaam aleekum salon test Assistant Bi la.",
        ownerPhone: "+221771000030",
        status: "cancelled",
        cancelledAt: new Date("2026-08-10T12:00:00Z"),
        purgeAfter: new Date("2026-09-09T12:00:00Z"),
      },
    });
    await purgeDueBusinesses(new Date("2026-08-16T12:00:00Z"));
    const after = await prisma.business.findUnique({ where: { id: biz.id } });
    expect(after?.purgedAt).toBeNull();
    expect(after?.name).toBe("Encore en grâce");
  });
});
