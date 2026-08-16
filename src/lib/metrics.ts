import { prisma } from "./db";
import { ficheCompleteness } from "./fiche";
import { addDays, startOfDayDakar, toYmd } from "./format";
import { checkHealth } from "./health";
import { PLANS } from "./plans";

export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function mrrFcfa(plan: string, status: string): number {
  if (status !== "active") return 0;
  if (plan === "micro" || plan === "standard" || plan === "pro") {
    return PLANS[plan].priceFcfa;
  }
  return 0;
}

export function series7Days(weekStart: Date, dates: Date[]): { label: string; value: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const key = toYmd(day);
    const value = dates.filter((d) => toYmd(d) === key).length;
    const label = new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      timeZone: "Africa/Dakar",
    })
      .format(day)
      .replace(".", "");
    return { label, value };
  });
}

export async function controlTowerMetrics() {
  const now = new Date();
  const startToday = startOfDayDakar(now);
  const endToday = addDays(startToday, 1);
  const weekStart = addDays(startToday, -6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const in3Days = addDays(startToday, 3);

  const [
    health,
    businesses,
    inboundToday,
    outboundToday,
    failedToday,
    failedWeek,
    inboundWeekRows,
    apptWeekRows,
    convBot,
    convHandoff,
    convResolved,
    apptsToday,
    monthDone,
    monthNoShow,
    monthBooked,
    quotesMonth,
    quoteSum,
    pendingPays,
    confirmedMonth,
    confirmedMonthSum,
    stalePay,
    signupsToday,
    loginFailToday,
    loginOkToday,
    lockoutToday,
    webhookDay,
    webhookFail,
    reminderDue,
    reminderSent,
    inboundWeek,
    apptsWeek,
    signupsWeek,
  ] = await Promise.all([
    checkHealth().catch(() => ({ ok: false as const, service: "assistant-bi" })),
    prisma.business.findMany({
      include: {
        _count: { select: { appointments: true, customers: true, services: true } },
        users: { select: { phone: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.message.count({
      where: { direction: "inbound", createdAt: { gte: startToday, lt: endToday } },
    }),
    prisma.message.count({
      where: { direction: "outbound", createdAt: { gte: startToday, lt: endToday } },
    }),
    prisma.message.count({
      where: { deliveryStatus: "failed", createdAt: { gte: startToday, lt: endToday } },
    }),
    prisma.message.count({
      where: { deliveryStatus: "failed", createdAt: { gte: weekStart } },
    }),
    prisma.message.findMany({
      where: { direction: "inbound", createdAt: { gte: weekStart } },
      select: { createdAt: true },
    }),
    prisma.appointment.findMany({
      where: { startsAt: { gte: weekStart, lt: endToday }, status: { not: "cancelled" } },
      select: { startsAt: true, createdAt: true },
    }),
    prisma.conversation.count({ where: { status: "bot" } }),
    prisma.conversation.count({ where: { status: "handoff" } }),
    prisma.conversation.count({ where: { status: "resolved" } }),
    prisma.appointment.count({
      where: { startsAt: { gte: startToday, lt: endToday }, status: { not: "cancelled" } },
    }),
    prisma.appointment.count({
      where: { status: "done", startsAt: { gte: monthStart } },
    }),
    prisma.appointment.count({
      where: { status: "no_show", startsAt: { gte: monthStart } },
    }),
    prisma.appointment.count({
      where: { status: { in: ["booked", "reminded"] }, startsAt: { gte: monthStart } },
    }),
    prisma.quote.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.quote.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { totalFcfa: true },
    }),
    prisma.subscriptionPayment.aggregate({
      where: { status: "pending" },
      _sum: { amountFcfa: true },
      _count: true,
    }),
    prisma.subscriptionPayment.count({
      where: { status: "confirmed", confirmedAt: { gte: monthStart } },
    }),
    prisma.subscriptionPayment.aggregate({
      where: { status: "confirmed", confirmedAt: { gte: monthStart } },
      _sum: { amountFcfa: true },
    }),
    prisma.subscriptionPayment.count({
      where: { status: "pending", createdAt: { lt: dayAgo } },
    }),
    prisma.business.count({ where: { createdAt: { gte: startToday, lt: endToday } } }),
    prisma.auditLog.count({
      where: { action: "login_fail", createdAt: { gte: startToday, lt: endToday } },
    }),
    prisma.auditLog.count({
      where: { action: "login_ok", createdAt: { gte: startToday, lt: endToday } },
    }),
    prisma.auditLog.count({
      where: { action: "lockout", createdAt: { gte: startToday, lt: endToday } },
    }),
    prisma.webhookEvent.count({ where: { receivedAt: { gte: dayAgo } } }),
    prisma.webhookEvent.count({
      where: { receivedAt: { gte: dayAgo }, status: { not: "processed" } },
    }),
    prisma.appointment.count({
      where: {
        status: { in: ["booked", "reminded"] },
        startsAt: { gte: now },
        reminderSentAt: null,
      },
    }),
    prisma.appointment.count({
      where: {
        status: { in: ["booked", "reminded"] },
        startsAt: { gte: now },
        reminderSentAt: { not: null },
      },
    }),
    prisma.message.count({
      where: { direction: "inbound", createdAt: { gte: weekStart } },
    }),
    prisma.appointment.count({
      where: { startsAt: { gte: weekStart, lt: endToday }, status: { not: "cancelled" } },
    }),
    prisma.business.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { createdAt: true },
    }),
  ]);

  const handoffsByBiz = await prisma.conversation.groupBy({
    by: ["businessId"],
    where: { status: "handoff" },
    _count: { _all: true },
  });
  const handoffMap = new Map(handoffsByBiz.map((h) => [h.businessId, h._count._all]));

  const trial = businesses.filter((b) => b.status === "trial").length;
  const active = businesses.filter((b) => b.status === "active").length;
  const pastDue = businesses.filter((b) => b.status === "past_due").length;
  const suspended = businesses.filter((b) => b.status === "suspended").length;
  const cancelled = businesses.filter((b) => b.status === "cancelled").length;
  const readyRows = businesses.filter((b) => {
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
  });
  const denom = active + trial + cancelled;
  const noShowDenom = monthDone + monthNoShow;
  const reminderTotal = reminderDue + reminderSent;
  const trialsEndingSoon = businesses.filter(
    (b) => b.status === "trial" && b.trialEndsAt && b.trialEndsAt <= in3Days && b.trialEndsAt >= now,
  );
  const mrr = businesses.reduce((s, b) => s + mrrFcfa(b.plan, b.status), 0);
  const waConfigured = businesses.filter((b) => Boolean(b.whatsappToken && b.whatsappPhoneNumberId)).length;
  const convTotal = convBot + convHandoff + convResolved;

  return {
    healthOk: health.ok,
    trial,
    active,
    pastDue,
    suspended,
    cancelled,
    businesses: businesses.length,
    readyCount: readyRows.length,
    readyPct: pct(readyRows.length, businesses.length),
    conversionPct: pct(active, denom),
    churnMonth: businesses.filter(
      (b) => b.status === "cancelled" && b.cancelledAt && b.cancelledAt >= monthStart,
    ).length,
    handoffPct: pct(convHandoff, convTotal),
    stalePayments: stalePay,
    mrr,
    pendingCount: pendingPays._count,
    pendingAmount: pendingPays._sum.amountFcfa || 0,
    confirmedMonth,
    confirmedMonthAmount: confirmedMonthSum._sum.amountFcfa || 0,
    signupsToday,
    inboundToday,
    outboundToday,
    failedToday,
    failedWeek,
    apptsToday,
    handoffsNow: convHandoff,
    convBot,
    convResolved,
    loginFailToday,
    loginOkToday,
    lockoutToday,
    loginFailPct: pct(loginFailToday, loginOkToday + loginFailToday),
    webhookDay,
    webhookFail,
    noShowRate: pct(monthNoShow, noShowDenom),
    monthDone,
    monthNoShow,
    monthBooked,
    quotesMonth,
    quotesAmount: quoteSum._sum.totalFcfa || 0,
    reminderDue,
    reminderSent,
    reminderPct: pct(reminderSent, reminderTotal),
    inboundWeek,
    apptsWeek,
    waConfigured,
    trialsEndingSoon: trialsEndingSoon.map((b) => ({
      id: b.id,
      name: b.name,
      trialEndsAt: b.trialEndsAt,
    })),
    seriesInbound: series7Days(
      weekStart,
      inboundWeekRows.map((r) => r.createdAt),
    ),
    seriesAppts: series7Days(
      weekStart,
      apptWeekRows.map((r) => r.startsAt),
    ),
    seriesSignups: series7Days(
      weekStart,
      signupsWeek.map((r) => r.createdAt),
    ),
    tenants: businesses.map((b) => {
      const fiche = ficheCompleteness({
        name: b.name,
        category: b.category,
        address: b.address,
        neighborhood: b.neighborhood,
        hoursJson: b.hoursJson,
        greetingFr: b.greetingFr,
        greetingWo: b.greetingWo,
        serviceCount: b._count.services,
      });
      return {
        id: b.id,
        name: b.name,
        neighborhood: b.neighborhood,
        category: b.category,
        plan: b.plan,
        status: b.status,
        trialEndsAt: b.trialEndsAt,
        customers: b._count.customers,
        appointments: b._count.appointments,
        services: b._count.services,
        phones: b.users.map((u) => u.phone),
        fichePct: fiche.percent,
        handoffs: handoffMap.get(b.id) || 0,
        whatsapp: Boolean(b.whatsappToken && b.whatsappPhoneNumberId),
        updatedAt: b.updatedAt,
      };
    }),
  };
}

export async function adminProductMetrics() {
  const m = await controlTowerMetrics();
  return {
    businesses: m.businesses,
    readyPct: m.readyPct,
    conversionPct: m.conversionPct,
    churnMonth: m.churnMonth,
    handoffPct: m.handoffPct,
    stalePayments: m.stalePayments,
    trial: m.trial,
    active: m.active,
  };
}

export function supportWhatsApp() {
  return process.env.SUPPORT_WHATSAPP?.trim() || "";
}
