import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { assertSameBusiness, ForbiddenError } from "@/server/policies";
import { prisma } from "@/lib/db";

describe("isolation tenant", () => {
  it("refuse un commerce différent de la session", () => {
    expect(() => assertSameBusiness("biz-a", "biz-b")).toThrow(ForbiddenError);
  });

  it("accepte le même commerce", () => {
    expect(() => assertSameBusiness("biz-a", "biz-a")).not.toThrow();
  });

  it("ne laisse pas le garage lire un client du salon", async () => {
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
    const stamp = Date.now();
    const salon = await prisma.business.create({
      data: {
        name: "Salon iso",
        slug: `iso-s-${stamp}`,
        category: "salon",
        neighborhood: "Médina",
        address: "x",
        hoursJson: "{}",
        greetingFr: "Bonjour ici le salon de test pour Assistant Bi.",
        greetingWo: "Asalaam aleekum salon test Assistant Bi la.",
        ownerPhone: "+221771009001",
      },
    });
    const garage = await prisma.business.create({
      data: {
        name: "Garage iso",
        slug: `iso-g-${stamp}`,
        category: "garage",
        neighborhood: "Pikine",
        address: "y",
        hoursJson: "{}",
        greetingFr: "Bonjour ici le garage de test pour Assistant Bi.",
        greetingWo: "Asalaam aleekum garage test Assistant Bi la.",
        ownerPhone: "+221771009002",
      },
    });
    const client = await prisma.customer.create({
      data: { businessId: salon.id, phone: "+221771009010", name: "Fatou" },
    });
    expect(() => assertSameBusiness(garage.id, salon.id)).toThrow(ForbiddenError);
    const leaked = await prisma.customer.findFirst({
      where: { id: client.id, businessId: garage.id },
    });
    expect(leaked).toBeNull();
    const owned = await prisma.customer.findFirst({
      where: { id: client.id, businessId: salon.id },
    });
    expect(owned?.name).toBe("Fatou");
  });
});
