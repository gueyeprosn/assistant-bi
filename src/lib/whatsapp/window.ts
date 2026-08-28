import { prisma } from "../db";
import { normalizeSnPhone } from "../phone";

export type ServiceWindow = { isOpen: boolean; lastInboundAt: Date | null };

const WINDOW_MS = 24 * 60 * 60 * 1000;

/** Fenêtre de service Meta (24h) pour un couple commerce + numéro destinataire. */
export async function getServiceWindow(businessId: string, recipientPhone: string): Promise<ServiceWindow> {
  try {
    const phone = normalizeSnPhone(recipientPhone);
    const lastInbound = await prisma.message.findFirst({
      where: {
        direction: "inbound",
        conversation: { businessId, customer: { phone } },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (!lastInbound) return { isOpen: false, lastInboundAt: null };
    const isOpen = Date.now() - lastInbound.createdAt.getTime() < WINDOW_MS;
    return { isOpen, lastInboundAt: lastInbound.createdAt };
  } catch {
    return { isOpen: false, lastInboundAt: null };
  }
}
