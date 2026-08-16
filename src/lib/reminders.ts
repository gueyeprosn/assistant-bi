import { prisma } from "./db";
import { addDays, formatDate, formatTime } from "./format";
import { getWhatsAppAdapter } from "./whatsapp/cloud";
import { handleInbound } from "./bot/engine";

export async function sendJ1Reminders() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const from = addDays(start, 1);
  const to = addDays(from, 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "booked",
      reminderSentAt: null,
      startsAt: { gte: from, lt: to },
      business: { status: { in: ["trial", "active"] }, reminderEnabled: true },
    },
    include: {
      customer: true,
      business: true,
      service: true,
    },
  });

  const adapter = getWhatsAppAdapter();
  let sent = 0;

  for (const appt of appointments) {
    const svc = appt.service?.name ? ` (${appt.service.name})` : "";
    const lang = appt.customer.language === "wo" ? "wo" : "fr";
    const text =
      lang === "wo"
        ? `Fàttali : rendez-vous bi ëpp na suba ${formatTime(appt.startsAt)}${svc} ci ${appt.business.name}.\nSu nga mënul ñëw, tegal « j'annule ».`
        : `Rappel : rendez-vous demain ${formatDate(appt.startsAt)} à ${formatTime(appt.startsAt)}${svc} chez ${appt.business.name}.\nSi vous ne pouvez plus venir, répondez « j'annule ».`;

    const conv = await prisma.conversation.findFirst({
      where: {
        businessId: appt.businessId,
        customerId: appt.customerId,
      },
      orderBy: { updatedAt: "desc" },
    });
    const conversation =
      conv ??
      (await prisma.conversation.create({
        data: {
          businessId: appt.businessId,
          customerId: appt.customerId,
          status: "bot",
        },
      }));

    const claimed = await claimJ1Reminder(appt.id);
    if (!claimed) continue;

    try {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "outbound",
          text,
          language: lang,
        },
      });
      await adapter.sendText(appt.customer.phone, text, appt.businessId);
      sent += 1;
    } catch {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSentAt: null, status: "booked" },
      });
    }
  }

  return { sent, checked: appointments.length };
}

export async function claimJ1Reminder(appointmentId: string) {
  const marked = await prisma.appointment.updateMany({
    where: { id: appointmentId, reminderSentAt: null },
    data: { reminderSentAt: new Date(), status: "reminded" },
  });
  return marked.count === 1;
}

/** Utilisé si un client répond « j'annule » — déjà géré par le moteur. Export pour tests. */
export async function cancelViaMessage(
  businessId: string,
  phone: string,
  text: string,
) {
  return handleInbound({ businessId, customerPhone: phone, text });
}
