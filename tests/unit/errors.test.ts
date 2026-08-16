import { describe, expect, it } from "vitest";
import { ERRORS } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

describe("error catalog", () => {
  it("a un message FR et WO pour chaque code", () => {
    for (const spec of Object.values(ERRORS)) {
      expect(spec.fr.length).toBeGreaterThan(3);
      expect(spec.wo.length).toBeGreaterThan(3);
    }
  });
});

describe("rate limit", () => {
  it("bloque au-delà du plafond", () => {
    const key = `t-${Date.now()}`;
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(false);
  });
});
