import { beforeAll, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { checkHealth } from "@/lib/health";

describe("santé du service", () => {
  beforeAll(() => {
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  });

  it("répond ok si la base répond", async () => {
    await expect(checkHealth()).resolves.toEqual({ ok: true, service: "assistant-bi" });
  });
});
