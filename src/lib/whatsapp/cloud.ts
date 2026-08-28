import { prisma } from "../db";
import { splitWhatsAppChunks, type WhatsAppAdapter } from "./types";

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function resolveCreds(businessId: string) {
  const envToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
  const envPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  if (envToken && envPhoneId) return { token: envToken, phoneId: envPhoneId };
  if (!businessId) return null;
  const biz = await prisma.business.findUnique({
    where: { id: businessId },
    select: { whatsappToken: true, whatsappPhoneNumberId: true },
  });
  if (biz?.whatsappToken && biz.whatsappPhoneNumberId) {
    return { token: biz.whatsappToken, phoneId: biz.whatsappPhoneNumberId };
  }
  return null;
}

async function postCloud(to: string, payload: Record<string, unknown>, token: string, phoneId: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", to, ...payload }),
  });
  if (!res.ok) {
    throw new Error(`whatsapp ${res.status}`);
  }
}

async function postWithRetry(to: string, payload: Record<string, unknown>, token: string, phoneId: string) {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await postCloud(to, payload, token, phoneId);
      return;
    } catch (e) {
      last = e;
      await sleep(500 * 2 ** attempt);
    }
  }
  throw last instanceof Error ? last : new Error("whatsapp send failed");
}

export const cloudAdapter: WhatsAppAdapter & {
  sendTemplate(
    toPhone: string,
    template: { name: string; lang: string; params: string[] },
    businessId: string,
  ): Promise<void>;
} = {
  name: "cloud",
  async sendText(toPhone, text, businessId) {
    const creds = await resolveCreds(businessId);
    if (!creds) {
      console.warn("[whatsapp-cloud] tokens manquants, message non envoyé");
      return;
    }
    const to = toPhone.replace(/^\+/, "");
    for (const body of splitWhatsAppChunks(text)) {
      await postWithRetry(to, { type: "text", text: { body, preview_url: false } }, creds.token, creds.phoneId);
    }
  },
  async sendTemplate(toPhone, template, businessId) {
    const creds = await resolveCreds(businessId);
    if (!creds) {
      console.warn("[whatsapp-cloud] tokens manquants, modèle non envoyé");
      return;
    }
    const to = toPhone.replace(/^\+/, "");
    await postWithRetry(
      to,
      {
        type: "template",
        template: {
          name: template.name,
          language: { code: template.lang },
          components: template.params.length
            ? [{ type: "body", parameters: template.params.map((text) => ({ type: "text", text })) }]
            : undefined,
        },
      },
      creds.token,
      creds.phoneId,
    );
  },
};

export function getWhatsAppAdapter(): WhatsAppAdapter {
  return cloudAdapter;
}
