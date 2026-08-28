"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { addDays } from "@/lib/format";
import { confirmManualPayment, recordSubscriptionEvent } from "@/server/services/billing";
import { writeAudit } from "@/server/services/audit";
import { createDbSession, revokeSession, setSessionCookie, IMPERSONATE_TTL } from "@/lib/auth/session";
import { hashPin } from "@/lib/auth/pin";
import { normalizeSnPhone } from "@/lib/phone";
import { serializeTemplateMapping, templateMappingFromFormEntries } from "@/lib/whatsapp/templates";

export async function confirmPayment(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id") || "");
  await confirmManualPayment({ paymentId: id, adminUserId: admin.user.id });
  revalidatePath("/admin", "layout");
}

export async function rejectPayment(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id") || "");
  const payment = await prisma.subscriptionPayment.findUnique({ where: { id } });
  await prisma.subscriptionPayment.updateMany({
    where: { id, status: "pending" },
    data: { status: "rejected", rejectedAt: new Date() },
  });
  if (payment) {
    await writeAudit({
      action: "payment_reject",
      actorUserId: admin.user.id,
      businessId: payment.businessId,
      metadata: { paymentId: id },
    });
  }
  revalidatePath("/admin", "layout");
}

export async function setBusinessStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!["trial", "active", "past_due", "suspended", "cancelled"].includes(status)) return;
  await prisma.business.update({ where: { id }, data: { status } });
  if (status === "suspended") {
    await writeAudit({ action: "suspend", actorUserId: admin.user.id, businessId: id });
    await recordSubscriptionEvent({
      businessId: id,
      type: "suspended",
      actorUserId: admin.user.id,
    });
  }
  revalidatePath("/admin", "layout");
}

export async function impersonateBusiness(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;
  const businessId = String(formData.get("businessId") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (reason.length < 8) return;
  const row = await prisma.impersonationSession.create({
    data: {
      adminUserId: admin.user.id,
      businessId,
      reason,
    },
  });
  const session = await createDbSession({
    userId: admin.user.id,
    role: "admin",
    businessId,
    impersonationId: row.id,
    ttlSeconds: IMPERSONATE_TTL,
  });
  await prisma.impersonationSession.update({
    where: { id: row.id },
    data: { sessionId: session.id },
  });
  await setSessionCookie(
    {
      sessionId: session.id,
      userId: admin.user.id,
      role: "admin",
      businessId,
      impersonating: true,
    },
    IMPERSONATE_TTL,
  );
  await writeAudit({
    action: "impersonate_start",
    actorUserId: admin.user.id,
    businessId,
    metadata: { reason, impersonationId: row.id },
  });
  redirect("/app");
}

export async function endImpersonation(): Promise<void> {
  const ctx = await requireUser();
  if (!ctx || ctx.user.role !== "admin") return;
  const live = ctx.session;
  if (live.sessionId) await revokeSession(live.sessionId);
  if (live.businessId) {
    await prisma.impersonationSession.updateMany({
      where: { adminUserId: ctx.user.id, businessId: live.businessId, endedAt: null },
      data: { endedAt: new Date() },
    });
    await writeAudit({
      action: "impersonate_end",
      actorUserId: ctx.user.id,
      businessId: live.businessId,
    });
  }
  const session = await createDbSession({
    userId: ctx.user.id,
    role: "admin",
    businessId: null,
  });
  await setSessionCookie({
    sessionId: session.id,
    userId: ctx.user.id,
    role: "admin",
    businessId: null,
  });
  redirect("/admin");
}

export async function extendTrial(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id") || "");
  await prisma.business.update({
    where: { id },
    data: { status: "trial", plan: "trial", trialEndsAt: addDays(new Date(), 7) },
  });
  await recordSubscriptionEvent({
    businessId: id,
    type: "trial_extend",
    actorUserId: admin.user.id,
  });
  revalidatePath("/admin", "layout");
}

export async function resetOwnerPin(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;
  const phone = normalizeSnPhone(String(formData.get("phone") || ""));
  const pin = String(formData.get("pin") || "").trim();
  if (!phone || pin.length < 4) return;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || user.role === "admin") return;
  const hashed = await hashPin(pin);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      pinHash: hashed.hash,
      pinAlgo: hashed.algo,
      failedPinAttempts: 0,
      lockedUntil: null,
    },
  });
  await prisma.session.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await writeAudit({
    action: "pin_reset",
    actorUserId: admin.user.id,
    businessId: user.businessId,
    metadata: { phone },
  });
  revalidatePath("/admin", "layout");
}

export async function updateBusinessPlan(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id") || "");
  const plan = String(formData.get("plan") || "");
  if (!["trial", "micro", "standard", "pro"].includes(plan)) return;

  await prisma.business.update({
    where: { id },
    data: { plan, status: plan === "trial" ? "trial" : "active" },
  });
  await writeAudit({
    action: "plan_update",
    actorUserId: admin.user.id,
    businessId: id,
    metadata: { plan },
  });
  revalidatePath("/admin", "layout");
}

export async function updateBusinessWhatsAppConfig(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id") || "");
  const whatsappPhoneNumberId = String(formData.get("whatsappPhoneNumberId") || "").trim();
  const whatsappToken = String(formData.get("whatsappToken") || "").trim();
  const templates = templateMappingFromFormEntries((key) => formData.get(key) as string | null);

  await prisma.business.update({
    where: { id },
    data: {
      whatsappPhoneNumberId,
      whatsappTemplatesJson: serializeTemplateMapping(templates),
      ...(whatsappToken ? { whatsappToken } : {}),
    },
  });
  await writeAudit({
    action: "whatsapp_config_update",
    actorUserId: admin.user.id,
    businessId: id,
    metadata: { whatsappPhoneNumberId, hasToken: Boolean(whatsappToken) },
  });
  revalidatePath("/admin", "layout");
}

