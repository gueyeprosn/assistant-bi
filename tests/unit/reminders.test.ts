import { beforeAll, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { prisma } from "@/lib/db";
import { claimJ1Reminder } from "@/lib/reminders";

describe("reminders idempotent", () => {
  beforeAll(() => {
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  });

  it("ne revendique qu'une fois le même RDV", async () => {
    await prisma.appointment.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.business.deleteMany();
    const biz = await prisma.business.create({
      data: {
        name: "Test",
        slug: `r-${Date.now()}`,
        category: "salon",
        neighborhood: "Médina",
        address: "x",
        hoursJson: "{}",
        greetingFr: "Bonjour ici le salon de test pour Assistant Bi.",
        greetingWo: "Asalaam aleekum salon test Assistant Bi la.",
        ownerPhone: "+221771000002",
      },
    });
    const customer = await prisma.customer.create({
      data: { businessId: biz.id, phone: "+221771000003" },
    });
    const appt = await prisma.appointment.create({
      data: {
        businessId: biz.id,
        customerId: customer.id,
        startsAt: new Date("2030-02-01T10:00:00"),
        endsAt: new Date("2030-02-01T11:00:00"),
        status: "booked",
      },
    });
    expect(await claimJ1Reminder(appt.id)).toBe(true);
    expect(await claimJ1Reminder(appt.id)).toBe(false);
  });
});
