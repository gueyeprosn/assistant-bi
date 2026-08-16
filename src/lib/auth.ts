import { prisma } from "./db";
import { isValidSnPhone, normalizeSnPhone } from "./phone";
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
import { slugFromName, type SignupFiche } from "./signup";

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

export async function registerOwner(input: SignupFiche) {
  const phone = normalizeSnPhone(input.phoneRaw);
  if (!isValidSnPhone(input.phoneRaw)) {
    return { error: "Numéro WhatsApp sénégalais invalide. Exemple : 77 111 11 11." };
  }
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return { error: "Ce numéro a déjà un compte. Connectez-vous." };
  }

  let slug = slugFromName(input.businessName, phone);
  let n = 0;
  while (await prisma.business.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${slugFromName(input.businessName, phone)}-${n}`;
  }

  const hashed = await hashPin(input.pin);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);
  const secondaryPhone = input.secondaryPhoneRaw ? normalizeSnPhone(input.secondaryPhoneRaw) : "";
  const firstDuration = input.services[0]?.durationMin ?? 60;

  await prisma.business.create({
    data: {
      name: input.businessName,
      slug,
      category: input.category,
      neighborhood: input.neighborhood,
      address: input.address,
      hoursJson: input.hoursJson,
      greetingFr: `Bonjour, ici ${input.businessName}. Je suis Assistant Bi. Je peux vous donner les horaires, les tarifs ou prendre rendez-vous.`,
      greetingWo: `Asalaam aleekum, ${input.businessName} la. Man Assistant Bi laa. Mën naa la wax ci waxtu, tarif, walla jëlal rendez-vous.`,
      defaultLang: input.defaultLang,
      plan: "trial",
      status: "trial",
      trialEndsAt,
      ownerPhone: phone,
      secondaryPhone,
      holidayPolicy: input.holidayPolicy,
      holidayHoursNote: input.holidayHoursNote,
      faqJson: JSON.stringify(input.faqs),
      slotStepMin: input.slotStepMin,
      defaultDurationMin: firstDuration,
      minimumNoticeMin: input.minimumNoticeMin,
      maxAppointmentsPerDay: input.maxAppointmentsPerDay,
      confirmationMessage: input.confirmationMessage,
      reminderEnabled: input.reminderEnabled,
      reminderHour: input.reminderHour,
      users: {
        create: {
          phone,
          pinHash: hashed.hash,
          pinAlgo: hashed.algo,
          name: input.ownerName,
          role: "owner",
        },
      },
      services: {
        create: input.services.map((s, i) => ({
          name: s.name,
          priceFcfa: s.priceFcfa,
          durationMin: s.durationMin,
          sortOrder: i + 1,
        })),
      },
    },
  });

  await writeAudit({ action: "signup_ok", metadata: { phone, slug } });
  return loginWithPhonePin(phone, input.pin);
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
    try {
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
    } catch (error) {
      console.error("[login] upgrade pin", error);
      await prisma.user.update({
        where: { id: user.id },
        data: { failedPinAttempts: 0, lockedUntil: null },
      });
    }
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
