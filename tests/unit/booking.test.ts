import { beforeAll, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { prisma } from "@/lib/db";
import { bookSlot } from "@/server/services/booking";

describe("booking overlap", () => {
  beforeAll(() => {
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  });

  it("refuse un second RDV sur le même créneau", async () => {
    await prisma.appointment.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.business.deleteMany();
    const biz = await prisma.business.create({
      data: {
        name: "Test",
        slug: `t-${Date.now()}`,
        category: "salon",
        neighborhood: "Médina",
        address: "x",
        hoursJson: "{}",
        greetingFr: "Bonjour ici le salon de test pour Assistant Bi.",
        greetingWo: "Asalaam aleekum salon test Assistant Bi la.",
        ownerPhone: "+221771000000",
      },
    });
    const customer = await prisma.customer.create({
      data: { businessId: biz.id, phone: "+221771000001" },
    });
    const start = new Date("2030-01-15T10:00:00");
    const end = new Date("2030-01-15T11:00:00");
    const first = await bookSlot({
      businessId: biz.id,
      customerId: customer.id,
      startsAt: start,
      endsAt: end,
    });
    expect(first.ok).toBe(true);
    const second = await bookSlot({
      businessId: biz.id,
      customerId: customer.id,
      startsAt: start,
      endsAt: end,
    });
    expect(second.ok).toBe(false);
  });

  it("refuse un RDV si le plafond journalier est atteint", async () => {
    await prisma.appointment.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.business.deleteMany();
    const biz = await prisma.business.create({
      data: {
        name: "Test",
        slug: `d-${Date.now()}`,
        category: "salon",
        neighborhood: "Médina",
        address: "x",
        hoursJson: "{}",
        greetingFr: "Bonjour ici le salon de test pour Assistant Bi.",
        greetingWo: "Asalaam aleekum salon test Assistant Bi la.",
        ownerPhone: "+221771000010",
        maxAppointmentsPerDay: 1,
      },
    });
    const customer = await prisma.customer.create({
      data: { businessId: biz.id, phone: "+221771000011" },
    });
    const first = await bookSlot({
      businessId: biz.id,
      customerId: customer.id,
      startsAt: new Date("2030-01-16T10:00:00"),
      endsAt: new Date("2030-01-16T11:00:00"),
    });
    expect(first.ok).toBe(true);
    const second = await bookSlot({
      businessId: biz.id,
      customerId: customer.id,
      startsAt: new Date("2030-01-16T14:00:00"),
      endsAt: new Date("2030-01-16T15:00:00"),
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.code).toBe("APPOINTMENT_DAY_FULL");
  });
});
