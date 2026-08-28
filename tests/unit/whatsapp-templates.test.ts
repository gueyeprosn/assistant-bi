import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { prisma } from "@/lib/db";
import { getServiceWindow } from "@/lib/whatsapp/window";
import { parseTemplateMapping, resolveSendMode, serializeTemplateMapping } from "@/lib/whatsapp/templates";
import { sendJ1Reminders } from "@/lib/reminders";

async function makeBusiness(templatesJson = "{}") {
  return prisma.business.create({
    data: {
      name: "Salon Test",
      slug: `wt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      category: "salon",
      neighborhood: "Médina",
      address: "x",
      hoursJson: "{}",
      greetingFr: "Bonjour ici le salon de test.",
      greetingWo: "Asalaam aleekum salon test la.",
      ownerPhone: "+221771000009",
      whatsappTemplatesJson: templatesJson,
    },
  });
}

async function makeCustomerWithInbound(businessId: string, phone: string, inboundAt: Date | null) {
  const customer = await prisma.customer.create({ data: { businessId, phone } });
  const conversation = await prisma.conversation.create({
    data: { businessId, customerId: customer.id, status: "bot" },
  });
  if (inboundAt) {
    await prisma.message.create({
      data: { conversationId: conversation.id, direction: "inbound", text: "salut", createdAt: inboundAt },
    });
  }
  return customer;
}

describe("whatsapp templates", () => {
  beforeAll(() => {
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  });

  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.business.deleteMany();
  });

  describe("parseTemplateMapping", () => {
    it("ignore les entrées incomplètes ou invalides", () => {
      expect(parseTemplateMapping("")).toEqual({});
      expect(parseTemplateMapping("not json")).toEqual({});
      expect(parseTemplateMapping(JSON.stringify({ reminder_j1: { name: "" } }))).toEqual({});
      expect(parseTemplateMapping(JSON.stringify({ unknown_usage: { name: "x", lang: "fr" } }))).toEqual({});
    });

    it("garde les entrées valides et round-trip via serializeTemplateMapping", () => {
      const mapping = { reminder_j1: { name: "rappel_rdv", lang: "fr" } };
      const json = serializeTemplateMapping(mapping);
      expect(parseTemplateMapping(json)).toEqual(mapping);
    });
  });

  describe("getServiceWindow", () => {
    it("fenêtre fermée quand le client n'a jamais écrit", async () => {
      const biz = await makeBusiness();
      const customer = await makeCustomerWithInbound(biz.id, "+221771111111", null);
      const window = await getServiceWindow(biz.id, customer.phone);
      expect(window.isOpen).toBe(false);
      expect(window.lastInboundAt).toBeNull();
    });

    it("fenêtre ouverte quand le dernier message entrant date de moins de 24h", async () => {
      const biz = await makeBusiness();
      const customer = await makeCustomerWithInbound(biz.id, "+221772222222", new Date(Date.now() - 60_000));
      const window = await getServiceWindow(biz.id, customer.phone);
      expect(window.isOpen).toBe(true);
    });

    it("fenêtre fermée quand le dernier message entrant date de plus de 24h", async () => {
      const biz = await makeBusiness();
      const customer = await makeCustomerWithInbound(
        biz.id,
        "+221773333333",
        new Date(Date.now() - 25 * 60 * 60 * 1000),
      );
      const window = await getServiceWindow(biz.id, customer.phone);
      expect(window.isOpen).toBe(false);
    });
  });

  describe("resolveSendMode", () => {
    it("session quand la fenêtre est ouverte, même sans modèle configuré", async () => {
      const biz = await makeBusiness("{}");
      const customer = await makeCustomerWithInbound(biz.id, "+221774444444", new Date());
      const mode = await resolveSendMode(biz.id, customer.phone, "reminder_j1", biz.whatsappTemplatesJson);
      expect(mode).toEqual({ mode: "session" });
    });

    it("template quand la fenêtre est fermée et qu'un modèle est configuré", async () => {
      const templatesJson = serializeTemplateMapping({ reminder_j1: { name: "rappel_rdv", lang: "fr" } });
      const biz = await makeBusiness(templatesJson);
      const customer = await makeCustomerWithInbound(biz.id, "+221775555555", null);
      const mode = await resolveSendMode(biz.id, customer.phone, "reminder_j1", biz.whatsappTemplatesJson);
      expect(mode).toEqual({ mode: "template", template: { name: "rappel_rdv", lang: "fr" } });
    });

    it("skip quand la fenêtre est fermée et qu'aucun modèle n'est configuré", async () => {
      const biz = await makeBusiness("{}");
      const customer = await makeCustomerWithInbound(biz.id, "+221776666666", null);
      const mode = await resolveSendMode(biz.id, customer.phone, "reminder_j1", biz.whatsappTemplatesJson);
      expect(mode).toEqual({ mode: "skip", reason: "no_template_configured" });
    });
  });

  describe("sendJ1Reminders hors fenêtre sans modèle", () => {
    it("ne marque pas le rappel comme envoyé (reprise possible)", async () => {
      const biz = await makeBusiness("{}");
      const customer = await makeCustomerWithInbound(biz.id, "+221777777777", null);
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const startsAt = new Date(start.getTime() + 25 * 60 * 60 * 1000);
      const appt = await prisma.appointment.create({
        data: {
          businessId: biz.id,
          customerId: customer.id,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
          status: "booked",
        },
      });

      const result = await sendJ1Reminders();
      expect(result.sent).toBe(0);

      const reloaded = await prisma.appointment.findUnique({ where: { id: appt.id } });
      expect(reloaded?.reminderSentAt).toBeNull();
      expect(reloaded?.status).toBe("booked");
    });
  });
});
