import { describe, expect, it } from "vitest";
import { isLocked, nextLockState } from "@/lib/auth/pin";

describe("pin lockout", () => {
  it("verrouille après 5 échecs", () => {
    let attempts = 0;
    let last = nextLockState(attempts);
    for (let i = 0; i < 5; i++) {
      last = nextLockState(attempts);
      attempts = last.failedPinAttempts;
    }
    expect(last.locked).toBe(true);
    expect(isLocked(last.lockedUntil)).toBe(true);
  });

  it("ne verrouille pas au 1er essai", () => {
    const last = nextLockState(0);
    expect(last.locked).toBe(false);
  });

  it("impose un délai dès le 3e échec", () => {
    const last = nextLockState(2);
    expect(last.locked).toBe(true);
    expect(last.lockedUntil).toBeTruthy();
    const span = last.lockedUntil!.getTime() - Date.now();
    expect(span).toBeGreaterThan(10_000);
    expect(span).toBeLessThan(60_000);
  });
});
