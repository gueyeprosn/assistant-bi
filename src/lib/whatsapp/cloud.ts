import { splitWhatsAppChunks, type WhatsAppAdapter } from "./types";

/**
 * Adaptateur Meta Cloud API.
 * Renseigner WHATSAPP_ACCESS_TOKEN et WHATSAPP_PHONE_NUMBER_ID.
 * Voir docs/whatsapp-coexistence.md
 */
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
        const err = await res.text();
        throw new Error(`[whatsapp-cloud] ${res.status} ${err}`);
      }
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
