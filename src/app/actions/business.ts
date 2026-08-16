"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { getWhatsAppAdapter } from "@/lib/whatsapp/cloud";
import { normalizeSnPhone } from "@/lib/phone";
import { buildQuoteText } from "@/lib/quotes";
import { addDays } from "@/lib/format";

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

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      direction: "outbound",
      text,
      language: conv.customer.language,
    },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { status: "handoff" },
  });
  await getWhatsAppAdapter().sendText(conv.customer.phone, text, ctx.business.id);
  revalidatePath("/app/messages");
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
  const greetingFr = String(formData.get("greetingFr") || "");
  const greetingWo = String(formData.get("greetingWo") || "");
  const address = String(formData.get("address") || "");
  const neighborhood = String(formData.get("neighborhood") || "");
  const hoursJson = String(formData.get("hoursJson") || ctx.business.hoursJson);
  const latePolicy = String(formData.get("latePolicy") || "");
  const cancellationPolicy = String(formData.get("cancellationPolicy") || "");
  const minimumNoticeMin = parseInt(String(formData.get("minimumNoticeMin") || "60"), 10);
  await prisma.business.update({
    where: { id: ctx.business.id },
    data: {
      greetingFr,
      greetingWo,
      address,
      neighborhood,
      hoursJson,
      latePolicy,
      cancellationPolicy,
      minimumNoticeMin: Number.isFinite(minimumNoticeMin) ? minimumNoticeMin : 60,
    },
  });
  revalidatePath("/app/fiche");
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
  const serviceId = String(formData.get("serviceId") || "");
  const phone = String(formData.get("phone") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!serviceId || !phone) return;
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: ctx.business.id },
  });
  if (!service) return;
  const customerPhone = normalizeSnPhone(phone);
  const customer = await prisma.customer.upsert({
    where: { businessId_phone: { businessId: ctx.business.id, phone: customerPhone } },
    create: { businessId: ctx.business.id, phone: customerPhone, name: name || null },
    update: name ? { name } : {},
  });
  const lines = [{ name: service.name, qty: 1, priceFcfa: service.priceFcfa }];
  const { text, total } = buildQuoteText({
    businessName: ctx.business.name,
    customerName: customer.name,
    lines,
    lang: "fr",
  });
  const note = String(formData.get("note") || "").trim();
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
