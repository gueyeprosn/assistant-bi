import { prisma } from "./db";
import { ficheCompleteness } from "./fiche";

export async function adminProductMetrics() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [businesses, convTotal, convHandoff, cancelledMonth, stalePay] = await Promise.all([
    prisma.business.findMany({
      include: { _count: { select: { services: true } } },
    }),
    prisma.conversation.count(),
    prisma.conversation.count({ where: { status: "handoff" } }),
    prisma.business.count({
      where: { status: "cancelled", cancelledAt: { gte: monthStart } },
    }),
    prisma.subscriptionPayment.count({
      where: { status: "pending", createdAt: { lt: dayAgo } },
    }),
  ]);

  const ready = businesses.filter((b) => {
    const c = ficheCompleteness({
      name: b.name,
      category: b.category,
      address: b.address,
      neighborhood: b.neighborhood,
      hoursJson: b.hoursJson,
      greetingFr: b.greetingFr,
      greetingWo: b.greetingWo,
      serviceCount: b._count.services,
    });
    return c.percent >= 80;
  }).length;

  const active = businesses.filter((b) => b.status === "active").length;
  const trial = businesses.filter((b) => b.status === "trial").length;
  const denom = active + trial + businesses.filter((b) => b.status === "cancelled").length;

  return {
    businesses: businesses.length,
    readyPct: businesses.length ? Math.round((ready / businesses.length) * 100) : 0,
    conversionPct: denom ? Math.round((active / denom) * 100) : 0,
    churnMonth: cancelledMonth,
    handoffPct: convTotal ? Math.round((convHandoff / convTotal) * 100) : 0,
    stalePayments: stalePay,
    trial,
    active,
  };
}

export function supportWhatsApp() {
  return process.env.SUPPORT_WHATSAPP?.trim() || "";
}
