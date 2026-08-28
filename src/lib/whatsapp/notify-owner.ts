import { prisma } from "../db";
import { formatDate, formatFcfa, formatTime } from "../format";
import { cloudAdapter, getWhatsAppAdapter } from "./cloud";
import { resolveSendMode } from "./templates";

export async function notifyOwnerNewAppointment(opts: {
  businessId: string;
  customerName?: string | null;
  customerPhone: string;
  serviceName?: string | null;
  priceFcfa?: number | null;
  startsAt: Date;
}) {
  try {
    const biz = await prisma.business.findUnique({
      where: { id: opts.businessId },
      select: { id: true, name: true, ownerPhone: true, defaultLang: true, whatsappTemplatesJson: true },
    });
    if (!biz?.ownerPhone) return;

    const name = opts.customerName ? `${opts.customerName} (${opts.customerPhone})` : opts.customerPhone;
    const svc = opts.serviceName ? ` • ${opts.serviceName}` : "";
    const price = opts.priceFcfa ? ` (${formatFcfa(opts.priceFcfa)})` : "";
    const when = `${formatDate(opts.startsAt)} à ${formatTime(opts.startsAt)}`;

    const text =
      biz.defaultLang === "wo"
        ? `🔔 *Nouveau RDV — ${biz.name}*\n\n👤 Client : ${name}\n🗓️ Waxtu : ${when}\n✂️ Prestation : ${svc}${price}\n\nAccédez à votre agenda : /app/calendrier`
        : `🔔 *Nouveau RDV — ${biz.name}*\n\n👤 Client : ${name}\n🗓️ Date : ${when}\n✂️ Prestation : ${svc}${price}\n\nConsultez votre agenda : /app/calendrier`;

    const sendMode = await resolveSendMode(biz.id, biz.ownerPhone, "new_appointment", biz.whatsappTemplatesJson);
    if (sendMode.mode === "skip") {
      console.warn(`[notify-owner] modèle "new_appointment" manquant pour ${biz.id}, notification non envoyée`);
      return;
    }
    if (sendMode.mode === "template") {
      await cloudAdapter.sendTemplate(
        biz.ownerPhone,
        { name: sendMode.template.name, lang: sendMode.template.lang, params: [biz.name, name, when, opts.serviceName ?? ""] },
        biz.id,
      );
      return;
    }
    const adapter = getWhatsAppAdapter();
    await adapter.sendText(biz.ownerPhone, text, biz.id);
  } catch (err) {
    console.warn("[notify-owner] Echec notification nouveau RDV :", err);
  }
}

export async function notifyOwnerHandoff(opts: {
  businessId: string;
  customerName?: string | null;
  customerPhone: string;
  lastMessage: string;
}) {
  try {
    const biz = await prisma.business.findUnique({
      where: { id: opts.businessId },
      select: { id: true, name: true, ownerPhone: true, defaultLang: true, whatsappTemplatesJson: true },
    });
    if (!biz?.ownerPhone) return;

    const name = opts.customerName ? `${opts.customerName} (${opts.customerPhone})` : opts.customerPhone;

    const text =
      biz.defaultLang === "wo"
        ? `💬 *Client en attente — ${biz.name}*\n\n👤 ${name} dafa laaj wax ak patron bi.\n📝 Dernier message : « ${opts.lastMessage} »\n\nRépondez au client depuis le tableau de bord : /app/messages`
        : `💬 *Client en attente — ${biz.name}*\n\n👤 ${name} souhaite vous parler.\n📝 Dernier message : « ${opts.lastMessage} »\n\nRépondez au client depuis le tableau de bord : /app/messages`;

    const sendMode = await resolveSendMode(biz.id, biz.ownerPhone, "handoff", biz.whatsappTemplatesJson);
    if (sendMode.mode === "skip") {
      console.warn(`[notify-owner] modèle "handoff" manquant pour ${biz.id}, notification non envoyée`);
      return;
    }
    if (sendMode.mode === "template") {
      await cloudAdapter.sendTemplate(
        biz.ownerPhone,
        { name: sendMode.template.name, lang: sendMode.template.lang, params: [biz.name, name, opts.lastMessage] },
        biz.id,
      );
      return;
    }
    const adapter = getWhatsAppAdapter();
    await adapter.sendText(biz.ownerPhone, text, biz.id);
  } catch (err) {
    console.warn("[notify-owner] Echec notification handoff :", err);
  }
}

export async function notifyOwnerAppointmentCancelled(opts: {
  businessId: string;
  customerName?: string | null;
  customerPhone: string;
  startsAt: Date;
}) {
  try {
    const biz = await prisma.business.findUnique({
      where: { id: opts.businessId },
      select: { id: true, name: true, ownerPhone: true, defaultLang: true, whatsappTemplatesJson: true },
    });
    if (!biz?.ownerPhone) return;

    const name = opts.customerName ? `${opts.customerName} (${opts.customerPhone})` : opts.customerPhone;
    const when = `${formatDate(opts.startsAt)} à ${formatTime(opts.startsAt)}`;

    const text =
      biz.defaultLang === "wo"
        ? `⚠️ *RDV Annulé — ${biz.name}*\n\n👤 Client : ${name}\n🗓️ Date : ${when}\n\nLe créneau est à nouveau disponible pour d'autres clients.`
        : `⚠️ *RDV Annulé — ${biz.name}*\n\n👤 Client : ${name}\n🗓️ Date : ${when}\n\nLe créneau est automatiquement libéré.`;

    const sendMode = await resolveSendMode(biz.id, biz.ownerPhone, "cancelled", biz.whatsappTemplatesJson);
    if (sendMode.mode === "skip") {
      console.warn(`[notify-owner] modèle "cancelled" manquant pour ${biz.id}, notification non envoyée`);
      return;
    }
    if (sendMode.mode === "template") {
      await cloudAdapter.sendTemplate(
        biz.ownerPhone,
        { name: sendMode.template.name, lang: sendMode.template.lang, params: [biz.name, name, when] },
        biz.id,
      );
      return;
    }
    const adapter = getWhatsAppAdapter();
    await adapter.sendText(biz.ownerPhone, text, biz.id);
  } catch (err) {
    console.warn("[notify-owner] Echec notification annulation RDV :", err);
  }
}
