"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { getWhatsAppAdapter } from "@/lib/whatsapp/cloud";
import { serializeTemplateMapping, templateMappingFromFormEntries } from "@/lib/whatsapp/templates";
import { isValidSnPhone, normalizeSnPhone } from "@/lib/phone";
import { buildQuoteText, parseQuoteDraft, type QuoteLine } from "@/lib/quotes";
import { addDays } from "@/lib/format";
import { canUseQuotes } from "@/lib/plans";
import { writeAudit } from "@/server/services/audit";

export async function replyHandoff(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const conversationId = String(formData.get("conversationId") || "");
  const text = String(formData.get("text") || "").trim();
  if (!text) return;

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, businessId: ctx.business.id },
    include: { customer: true },
  });
  if (!conv) return;

  const row = await prisma.message.create({
    data: {
      conversationId: conv.id,
      direction: "outbound",
      text,
      language: conv.customer.language,
      deliveryStatus: "pending",
    },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { status: "handoff" },
  });
  try {
    await getWhatsAppAdapter().sendText(conv.customer.phone, text, ctx.business.id);
    await prisma.message.update({ where: { id: row.id }, data: { deliveryStatus: "sent" } });
  } catch {
    await prisma.message.update({ where: { id: row.id }, data: { deliveryStatus: "failed" } });
  }
  revalidatePath("/app/messages");
}

export async function takeHandoff(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const conversationId = String(formData.get("conversationId") || "");
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, businessId: ctx.business.id },
  });
  if (!conv) return;
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { status: "handoff" },
  });
  await writeAudit({
    action: "handoff_take",
    actorUserId: ctx.user.id,
    businessId: ctx.business.id,
    metadata: { conversationId },
  });
  revalidatePath("/app/messages");
  revalidatePath("/app");
}

export async function resumeBot(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const conversationId = String(formData.get("conversationId") || "");
  await prisma.conversation.updateMany({
    where: { id: conversationId, businessId: ctx.business.id },
    data: { status: "bot", stateJson: JSON.stringify({ mode: "idle" }) },
  });
  revalidatePath("/app/messages");
}

export async function resolveConversation(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const conversationId = String(formData.get("conversationId") || "");
  await prisma.conversation.updateMany({
    where: { id: conversationId, businessId: ctx.business.id },
    data: { status: "resolved", stateJson: JSON.stringify({ mode: "idle" }) },
  });
  revalidatePath("/app/messages");
}

export async function updateAppointmentStatus(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!["done", "no_show", "cancelled", "booked"].includes(status)) return;
  const extra =
    status === "cancelled"
      ? { cancelledAt: new Date(), cancelReason: "owner" }
      : status === "done"
        ? { confirmedAt: new Date() }
        : {};
  await prisma.appointment.updateMany({
    where: { id, businessId: ctx.business.id },
    data: { status, ...extra },
  });
  revalidatePath("/app");
  revalidatePath("/app/calendrier");
}

export async function blockSlot(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const date = String(formData.get("date") || "");
  const start = String(formData.get("start") || "09:00");
  const end = String(formData.get("end") || "18:00");
  const reason = String(formData.get("reason") || "Indisponible");
  if (!date) return;
  const startsAt = new Date(`${date}T${start}:00`);
  const endsAt = new Date(`${date}T${end}:00`);
  await prisma.blockedSlot.create({
    data: {
      businessId: ctx.business.id,
      startsAt,
      endsAt,
      reason,
    },
  });
  revalidatePath("/app/calendrier");
}

export async function deleteBlockedSlot(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const id = String(formData.get("id") || "");
  await prisma.blockedSlot.deleteMany({
    where: { id, businessId: ctx.business.id },
  });
  revalidatePath("/app/calendrier");
}

export async function saveFiche(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const name = String(formData.get("name") || "").trim() || ctx.business.name;
  const greetingFr = String(formData.get("greetingFr") || "");
  const greetingWo = String(formData.get("greetingWo") || "");
  const address = String(formData.get("address") || "");
  const neighborhood = String(formData.get("neighborhood") || "");
  const hoursJson = String(formData.get("hoursJson") || ctx.business.hoursJson);
  const latePolicy = String(formData.get("latePolicy") || "");
  const cancellationPolicy = String(formData.get("cancellationPolicy") || "");
  const minimumNoticeHours = parseInt(String(formData.get("minimumNoticeHours") || ""), 10);
  const minimumNoticeMinRaw = parseInt(String(formData.get("minimumNoticeMin") || "60"), 10);
  const minimumNoticeMin = Number.isFinite(minimumNoticeHours)
    ? Math.max(0, minimumNoticeHours) * 60
    : Number.isFinite(minimumNoticeMinRaw)
      ? minimumNoticeMinRaw
      : 60;
  const slotStepMin = parseInt(String(formData.get("slotStepMin") || String(ctx.business.slotStepMin)), 10);
  const maxAppointmentsPerDay = parseInt(String(formData.get("maxAppointmentsPerDay") || "0"), 10);
  const confirmationMessage = String(formData.get("confirmationMessage") || "");
  const reminderEnabled = String(formData.get("reminderEnabled") || "yes") !== "no";
  const reminderHour = parseInt(String(formData.get("reminderHour") || "9"), 10);
  const defaultLang = String(formData.get("defaultLang") || ctx.business.defaultLang);
  const holidayPolicy = String(formData.get("holidayPolicy") || ctx.business.holidayPolicy);
  const holidayHoursNote = String(formData.get("holidayHoursNote") || "");
  const secondaryPhone = String(formData.get("secondaryPhone") || "").trim();
  const faqQ = formData.getAll("faqQ").map(String);
  const faqR = formData.getAll("faqR").map(String);
  const faqs = faqQ
    .map((q, i) => ({ q: q.trim(), r: String(faqR[i] || "").trim() }))
    .filter((item) => item.q.length >= 3 && item.r.length >= 3)
    .slice(0, 20);
  await prisma.business.update({
    where: { id: ctx.business.id },
    data: {
      name,
      greetingFr,
      greetingWo,
      address,
      neighborhood,
      hoursJson,
      latePolicy,
      cancellationPolicy,
      minimumNoticeMin,
      slotStepMin: Number.isFinite(slotStepMin) ? slotStepMin : ctx.business.slotStepMin,
      maxAppointmentsPerDay: Number.isFinite(maxAppointmentsPerDay) ? maxAppointmentsPerDay : 0,
      confirmationMessage,
      reminderEnabled,
      reminderHour: Number.isFinite(reminderHour) ? Math.min(23, Math.max(0, reminderHour)) : 9,
      defaultLang: defaultLang === "wo" || defaultLang === "both" ? defaultLang : "fr",
      holidayPolicy: holidayPolicy === "special" ? "special" : "closed",
      holidayHoursNote,
      secondaryPhone,
      faqJson: JSON.stringify(faqs),
    },
  });
  revalidatePath("/app/fiche");
}

export async function saveWhatsAppSettings(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const token = String(formData.get("whatsappToken") || "").trim();
  const phoneId = String(formData.get("whatsappPhoneNumberId") || "").trim();
  const templates = templateMappingFromFormEntries((key) => formData.get(key) as string | null);
  await prisma.business.update({
    where: { id: ctx.business.id },
    data: {
      whatsappPhoneNumberId: phoneId,
      whatsappTemplatesJson: serializeTemplateMapping(templates),
      ...(token ? { whatsappToken: token } : {}),
    },
  });
  await writeAudit({
    action: "whatsapp_settings",
    actorUserId: ctx.user.id,
    businessId: ctx.business.id,
    metadata: { hasToken: Boolean(token || ctx.business.whatsappToken), hasPhoneId: Boolean(phoneId) },
  });
  revalidatePath("/app/parametres");
}

export async function saveService(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const priceFcfa = parseInt(String(formData.get("priceFcfa") || "0"), 10);
  const durationMin = parseInt(String(formData.get("durationMin") || "60"), 10);
  const keywords = String(formData.get("keywords") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!name) return;
  if (id) {
    await prisma.service.updateMany({
      where: { id, businessId: ctx.business.id },
      data: {
        name,
        priceFcfa,
        durationMin,
        keywordsJson: JSON.stringify(keywords),
      },
    });
  } else {
    await prisma.service.create({
      data: {
        businessId: ctx.business.id,
        name,
        priceFcfa,
        durationMin,
        keywordsJson: JSON.stringify(keywords),
      },
    });
  }
  revalidatePath("/app/fiche");
}

export async function toggleService(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "true") === "true";
  await prisma.service.updateMany({
    where: { id, businessId: ctx.business.id },
    data: { active: !active },
  });
  revalidatePath("/app/fiche");
}

export async function requestManualPayment(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const channel = String(formData.get("channel") || "wave");
  const provider = channel === "orange_money" ? "om" : "wave";
  const plan = String(formData.get("plan") || ctx.business.plan);
  const amount = plan === "micro" ? 1500 : plan === "pro" ? 6000 : 3000;
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  await prisma.subscriptionPayment.create({
    data: {
      businessId: ctx.business.id,
      amountFcfa: amount,
      channel,
      provider,
      planId: plan === "micro" || plan === "pro" || plan === "standard" ? plan : "standard",
      reference: String(formData.get("proof") || ""),
      periodStart: now,
      periodEnd: end,
      status: "pending",
      proof: String(formData.get("proof") || ""),
    },
  });
  revalidatePath("/app/abonnement");
}

export async function createManualQuote(formData: FormData): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  if (!canUseQuotes(ctx.business.plan, ctx.business.status)) {
    redirect("/app/abonnement");
  }
  const phone = String(formData.get("phone") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const note = String(formData.get("note") || "").trim();
  if (!isValidSnPhone(phone)) {
    redirect("/app/devis?error=bad_phone");
  }
  const parsed = parseQuoteDraft(String(formData.get("linesJson") || "[]"));
  if (!parsed.ok) {
    redirect("/app/devis?error=need_line");
  }

  const catalog = await prisma.service.findMany({
    where: { businessId: ctx.business.id },
    select: { id: true, name: true, priceFcfa: true, durationMin: true, sortOrder: true },
  });
  const byId = new Map(catalog.map((s) => [s.id, s]));
  const lines: QuoteLine[] = [];
  const toSave: { name: string; priceFcfa: number }[] = [];

  for (const draft of parsed.lines) {
    if (draft.serviceId) {
      const service = byId.get(draft.serviceId);
      if (!service) {
        redirect("/app/devis?error=bad_service");
      }
      lines.push({ name: service.name, qty: draft.qty, priceFcfa: service.priceFcfa });
      continue;
    }
    lines.push({ name: draft.name, qty: draft.qty, priceFcfa: draft.priceFcfa });
    if (draft.saveService) toSave.push({ name: draft.name, priceFcfa: draft.priceFcfa });
  }
  if (!lines.length) redirect("/app/devis?error=need_line");

  if (toSave.length) {
    let sortOrder = catalog.reduce((m, s) => Math.max(m, s.sortOrder), 0);
    const known = new Set(catalog.map((s) => s.name.toLowerCase()));
    for (const item of toSave) {
      const key = item.name.toLowerCase();
      if (known.has(key)) continue;
      known.add(key);
      sortOrder += 1;
      await prisma.service.create({
        data: {
          businessId: ctx.business.id,
          name: item.name,
          priceFcfa: item.priceFcfa,
          durationMin: ctx.business.defaultDurationMin || 60,
          sortOrder,
        },
      });
    }
    revalidatePath("/app/fiche");
  }

  const customerPhone = normalizeSnPhone(phone);
  const customer = await prisma.customer.upsert({
    where: { businessId_phone: { businessId: ctx.business.id, phone: customerPhone } },
    create: { businessId: ctx.business.id, phone: customerPhone, name: name || null },
    update: name ? { name } : {},
  });
  const { text, total } = buildQuoteText({
    businessName: ctx.business.name,
    customerName: customer.name,
    lines,
    lang: ctx.business.defaultLang === "wo" ? "wo" : "fr",
    note,
  });
  const expiresAt = addDays(new Date(), 7);
  await prisma.quote.create({
    data: {
      businessId: ctx.business.id,
      customerId: customer.id,
      linesJson: JSON.stringify(lines),
      totalFcfa: total,
      note,
      expiresAt,
      status: "sent",
      textBody: text,
    },
  });
  revalidatePath("/app/devis");
}

export async function requestAccountDeletion(): Promise<void> {
  const ctx = await requireOwner();
  if (!ctx) return;
  const purgeAfter = addDays(new Date(), 30);
  await prisma.business.update({
    where: { id: ctx.business.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      purgeAfter,
    },
  });
  await prisma.session.updateMany({
    where: { businessId: ctx.business.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await prisma.session.updateMany({
    where: { userId: ctx.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await writeAudit({
    action: "account_delete_requested",
    actorUserId: ctx.user.id,
    businessId: ctx.business.id,
    metadata: { purgeAfter: purgeAfter.toISOString() },
  });
  revalidatePath("/app/abonnement");
}
