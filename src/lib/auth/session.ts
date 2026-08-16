import { cookies } from "next/headers";
import { prisma } from "../db";
import { cookieLooksSigned } from "./cookie-format";
import {
  sessionCookieName,
  signSessionPayload,
  verifySessionToken,
  type SessionPayload,
} from "./cookie";

export type { SessionPayload };
export { cookieLooksSigned, verifySessionToken };

const MAX_AGE = 60 * 60 * 24 * 14;
export const IMPERSONATE_TTL = 60 * 60;

export async function createDbSession(opts: {
  userId: string;
  role: string;
  businessId: string | null;
  impersonationId?: string;
  ttlSeconds?: number;
}) {
  const ttl = opts.ttlSeconds ?? MAX_AGE;
  const expiresAt = new Date(Date.now() + ttl * 1000);
  return prisma.session.create({
    data: {
      userId: opts.userId,
      role: opts.role,
      businessId: opts.businessId,
      impersonationId: opts.impersonationId,
      expiresAt,
    },
  });
}

export async function setSessionCookie(payload: SessionPayload, maxAge = MAX_AGE) {
  const store = await cookies();
  store.set(sessionCookieName(), signSessionPayload(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(sessionCookieName());
}

export async function readCookiePayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(sessionCookieName())?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function revokeSession(sessionId: string) {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function loadLiveSession(sessionId: string) {
  return prisma.session.findFirst({
    where: {
      id: sessionId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}
