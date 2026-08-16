import bcrypt from "bcryptjs";

const LOCK_AFTER = 5;
const LOCK_MS = 30 * 60 * 1000;
const DELAY_MS: Record<number, number> = {
  3: 30_000,
  4: 2 * 60_000,
};

type PinAlgo = "argon2id" | "bcrypt";

async function tryArgon2() {
  try {
    return await import("@node-rs/argon2");
  } catch {
    return null;
  }
}

export async function hashPin(pin: string): Promise<{ hash: string; algo: PinAlgo }> {
  const argon2 = await tryArgon2();
  if (argon2) {
    try {
      const pinHash = await argon2.hash(pin, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });
      return { hash: pinHash, algo: "argon2id" };
    } catch (error) {
      console.error("[pin] argon2 indisponible, repli bcrypt", error);
    }
  }
  return { hash: await bcrypt.hash(pin, 10), algo: "bcrypt" };
}

export async function checkPin(pin: string, storedHash: string, algo = "bcrypt"): Promise<boolean> {
  if (algo === "argon2id" || storedHash.startsWith("$argon2")) {
    const argon2 = await tryArgon2();
    if (!argon2) return false;
    try {
      return await argon2.verify(storedHash, pin);
    } catch {
      return false;
    }
  }
  return bcrypt.compare(pin, storedHash);
}

export function nextLockState(failedAttempts: number, now = new Date()) {
  const attempts = failedAttempts + 1;
  if (attempts >= LOCK_AFTER) {
    return {
      failedPinAttempts: attempts,
      lockedUntil: new Date(now.getTime() + LOCK_MS),
      locked: true as const,
    };
  }
  const delay = DELAY_MS[attempts] ?? 0;
  if (delay) {
    return {
      failedPinAttempts: attempts,
      lockedUntil: new Date(now.getTime() + delay),
      locked: true as const,
    };
  }
  return { failedPinAttempts: attempts, lockedUntil: null as Date | null, locked: false as const };
}

export function lockoutMessage(lockedUntil: Date | null | undefined, now = new Date()) {
  if (!lockedUntil) return "Trop d’essais. Réessayez plus tard.";
  const min = Math.max(1, Math.ceil((lockedUntil.getTime() - now.getTime()) / 60_000));
  return min >= 10
    ? "Trop d’essais. Réessayez dans 30 minutes."
    : `Trop d’essais. Réessayez dans ${min} min.`;
}

export function isLocked(lockedUntil: Date | null | undefined, now = new Date()) {
  return Boolean(lockedUntil && lockedUntil.getTime() > now.getTime());
}
