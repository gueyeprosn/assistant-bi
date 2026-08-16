import { splitWhatsAppChunks, type WhatsAppAdapter } from "./types";

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function postCloud(to: string, body: string, token: string, phoneId: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body, preview_url: false },
    }),
  });
  if (!res.ok) {
    throw new Error(`whatsapp ${res.status}`);
  }
}

export const cloudAdapter: WhatsAppAdapter = {
  name: "cloud",
  async sendText(toPhone, text) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneId) {
      console.warn("[whatsapp-cloud] tokens manquants, message non envoyé");
      return;
    }
    const to = toPhone.replace(/^\+/, "");
    for (const body of splitWhatsAppChunks(text)) {
      let last: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await postCloud(to, body, token, phoneId);
          last = null;
          break;
        } catch (e) {
          last = e;
          await sleep(500 * 2 ** attempt);
        }
      }
      if (last) throw last instanceof Error ? last : new Error("whatsapp send failed");
    }
  },
};

export function getWhatsAppAdapter(): WhatsAppAdapter {
  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return cloudAdapter;
  }
  return {
    name: "simulator",
    async sendText() {},
  };
}
