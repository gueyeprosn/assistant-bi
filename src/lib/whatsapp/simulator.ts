import { prisma } from "../db";
import { splitWhatsAppChunks, type WhatsAppAdapter } from "./types";

/** En démo, les messages sont déjà en base via le moteur. Cet adaptateur est un no-op d'envoi. */
export const simulatorAdapter: WhatsAppAdapter = {
  name: "simulator",
  async sendText(_toPhone, text, businessId) {
    void text;
    void businessId;
  },
};

export async function persistOutbound(opts: {
  conversationId: string;
  text: string;
  language?: string;
}) {
  const chunks = splitWhatsAppChunks(opts.text);
  for (const text of chunks) {
    await prisma.message.create({
      data: {
        conversationId: opts.conversationId,
        direction: "outbound",
        text,
        language: opts.language,
      },
    });
  }
}
