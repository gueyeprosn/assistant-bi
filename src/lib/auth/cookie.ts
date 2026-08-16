import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "ab_session";

export type SessionPayload = {
  sessionId: string;
  userId: string;
  role: string;
  businessId: string | null;
  impersonating?: boolean;
};

export function sessionCookieName() {
  return COOKIE;
}

export function sessionSecret() {
  const s = process.env.SESSION_SECRET?.trim();
  if (!s || s === "changez-moi-en-production") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET manquant");
    }
    return "dev-only-not-for-production";
  }
  return s;
}

export function signSessionPayload(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}
