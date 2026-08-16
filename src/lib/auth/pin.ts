import { hash, verify } from "@node-rs/argon2";
import bcrypt from "bcryptjs";

const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;
const DELAY_MS: Record<number, number> = {
  3: 30_000,
  4: 2 * 60_000,
};

export async function hashPin(pin: string): Promise<{ hash: string; algo: "argon2id" }> {
  const pinHash = await hash(pin, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
  return { hash: pinHash, algo: "argon2id" };
}

export async function checkPin(pin: string, storedHash: string, algo = "bcrypt"): Promise<boolean> {
  if (algo === "argon2id" || storedHash.startsWith("$argon2")) {
    try {
      return await verify(storedHash, pin);
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
    ? "Trop d’essais. Réessayez dans 15 minutes."
    : `Trop d’essais. Réessayez dans ${min} min.`;
}

export function isLocked(lockedUntil: Date | null | undefined, now = new Date()) {
  return Boolean(lockedUntil && lockedUntil.getTime() > now.getTime());
}
