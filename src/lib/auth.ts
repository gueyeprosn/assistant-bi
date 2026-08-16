import { prisma } from "./db";
import { normalizeSnPhone, isValidSnPhone } from "./phone";
import { writeAudit } from "@/server/services/audit";
import { checkPin, hashPin, isLocked, lockoutMessage, nextLockState } from "./auth/pin";
import {
  clearSessionCookie,
  createDbSession,
  loadLiveSession,
  readCookiePayload,
  revokeAllSessions,
  revokeSession,
  setSessionCookie,
  type SessionPayload,
} from "./auth/session";
import { DEFAULT_WEEK_HOURS } from "./hours";
import { isFourDigitPin, isSignupCategory, slugFromName } from "./signup";

export type { SessionPayload };
export { hashPin, checkPin };

export async function setSession(payload: Omit<SessionPayload, "sessionId"> & { sessionId?: string; impersonationId?: string }) {
  const row =
    payload.sessionId && (await loadLiveSession(payload.sessionId))
      ? { id: payload.sessionId }
      : await createDbSession({
          userId: payload.userId,
          role: payload.role,
          businessId: payload.businessId,
          impersonationId: payload.impersonationId,
        });
  await setSessionCookie({
    sessionId: row.id,
    userId: payload.userId,
    role: payload.role,
    businessId: payload.businessId,
    impersonating: payload.impersonating,
  });
}

export async function clearSession() {
  const payload = await readCookiePayload();
  if (payload?.sessionId) await revokeSession(payload.sessionId);
  await clearSessionCookie();
}

export async function logoutEverywhere() {
  const payload = await readCookiePayload();
  if (payload?.userId) {
    await revokeAllSessions(payload.userId);
    await writeAudit({ action: "logout_all", actorUserId: payload.userId });
  }
  await clearSessionCookie();
}

export async function getSession(): Promise<SessionPayload | null> {
  const payload = await readCookiePayload();
  if (!payload?.sessionId) return null;
  const live = await loadLiveSession(payload.sessionId);
  if (!live) return null;
  return {
    sessionId: live.id,
    userId: live.userId,
    role: live.role,
    businessId: live.businessId,
    impersonating: Boolean(live.impersonationId || payload.impersonating),
  };
}

export async function requireUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { business: true },
  });
  if (!user) return null;
  return { session, user };
}

export async function getCurrentUser() {
  return requireUser();
}

export async function getCurrentBusiness() {
  const ctx = await requireOwner();
  return ctx?.business ?? null;
}

export async function requireOwner() {
  const ctx = await requireUser();
  if (!ctx) return null;
  if (ctx.session.role === "admin" && ctx.session.businessId) {
    const business = await prisma.business.findUnique({
      where: { id: ctx.session.businessId },
    });
    if (!business) return null;
    return { ...ctx, business };
  }
  if (!ctx.user.business) return null;
  return { ...ctx, business: ctx.user.business };
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (!ctx || ctx.user.role !== "admin") return null;
  if (ctx.session.impersonating) return null;
  return ctx;
}

export async function registerOwner(input: {
  phoneRaw: string;
  pin: string;
  pinConfirm: string;
  businessName: string;
  ownerName: string;
  category: string;
  neighborhood: string;
}) {
  const businessName = input.businessName.trim();
  const ownerName = input.ownerName.trim();
  const neighborhood = input.neighborhood.trim();
  const pin = input.pin.trim();
  const pinConfirm = input.pinConfirm.trim();

  if (!businessName || businessName.length < 2) {
    return { error: "Indiquez le nom de votre activité." };
  }
  if (!ownerName || ownerName.length < 2) {
    return { error: "Indiquez votre nom." };
  }
  if (!isSignupCategory(input.category)) {
    return { error: "Choisissez votre métier." };
  }
  if (!isValidSnPhone(input.phoneRaw)) {
    return { error: "Numéro sénégalais invalide. Exemple : 77 111 11 11." };
  }
  if (!isFourDigitPin(pin)) {
    return { error: "Le code PIN doit avoir 4 chiffres." };
  }
  if (pin !== pinConfirm) {
    return { error: "Les deux codes PIN ne sont pas identiques." };
  }

  const phone = normalizeSnPhone(input.phoneRaw);
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return { error: "Ce numéro a déjà un compte. Connectez-vous." };
  }

  let slug = slugFromName(businessName, phone);
  let n = 0;
  while (await prisma.business.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${slugFromName(businessName, phone)}-${n}`;
  }

  const hashed = await hashPin(pin);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  await prisma.business.create({
    data: {
      name: businessName,
      slug,
      category: input.category,
      neighborhood,
      address: neighborhood,
      hoursJson: JSON.stringify(DEFAULT_WEEK_HOURS),
      greetingFr: `Bonjour, ici ${businessName}. Je suis Assistant Bi. Je peux vous donner les horaires, les tarifs ou prendre rendez-vous.`,
      greetingWo: `Asalaam aleekum, ${businessName} la. Man Assistant Bi laa. Mën naa la wax ci waxtu, tarif, walla jëlal rendez-vous.`,
      defaultLang: "fr",
      plan: "trial",
      status: "trial",
      trialEndsAt,
      ownerPhone: phone,
      users: {
        create: {
          phone,
          pinHash: hashed.hash,
          pinAlgo: hashed.algo,
          name: ownerName,
          role: "owner",
        },
      },
    },
  });

  await writeAudit({ action: "signup_ok", metadata: { phone, slug } });
  return loginWithPhonePin(phone, pin);
}

export async function loginWithPhonePin(phoneRaw: string, pin: string) {
  const phone = normalizeSnPhone(phoneRaw);
  const user = await prisma.user.findUnique({
    where: { phone },
    include: { business: true },
  });
  const fail = { error: "Numéro ou code PIN incorrect." as const };
  if (!user) {
    await writeAudit({ action: "login_fail", metadata: { phone } });
    return fail;
  }
  if (isLocked(user.lockedUntil)) {
    await writeAudit({ action: "lockout", actorUserId: user.id, businessId: user.businessId });
    return { error: lockoutMessage(user.lockedUntil) };
  }
  const ok = await checkPin(pin, user.pinHash, user.pinAlgo);
  if (!ok) {
    const lock = nextLockState(user.failedPinAttempts);
    await prisma.user.update({
      where: { id: user.id },
      data: { failedPinAttempts: lock.failedPinAttempts, lockedUntil: lock.lockedUntil },
    });
    await writeAudit({
      action: lock.locked ? "lockout" : "login_fail",
      actorUserId: user.id,
      businessId: user.businessId,
    });
    if (lock.locked) return { error: lockoutMessage(lock.lockedUntil) };
    return fail;
  }

  if (user.pinAlgo !== "argon2id") {
    const upgraded = await hashPin(pin);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pinHash: upgraded.hash,
        pinAlgo: upgraded.algo,
        failedPinAttempts: 0,
        lockedUntil: null,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedPinAttempts: 0, lockedUntil: null },
    });
  }

  const row = await createDbSession({
    userId: user.id,
    role: user.role,
    businessId: user.businessId,
  });
  await setSessionCookie({
    sessionId: row.id,
    userId: user.id,
    role: user.role,
    businessId: user.businessId,
  });
  await writeAudit({ action: "login_ok", actorUserId: user.id, businessId: user.businessId });
  return { user };
}
