import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, formatFcfa, planLabel, startOfDayDakar, statusLabel, toYmd } from "@/lib/format";
import { rdvLimit } from "@/lib/plans";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import { ficheCompleteness } from "@/lib/fiche";
import { displayPhone } from "@/lib/phone";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { MiniBars } from "@/components/ui/MiniBars";
import { EmptyState } from "@/components/ui/EmptyState";
import { AppointmentCard } from "@/components/AppointmentCard";

export default async function TodayPage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const biz = ctx.business;
  const start = startOfDayDakar(new Date());
  const end = addDays(start, 1);
  const weekStart = addDays(start, -6);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const firstName = ctx.user.name.split(/\s+/)[0] || ctx.user.name;

  const [todayAppts, handoffs, monthCount, pendingPay, inboundToday, serviceCount, waiting, weekAppts, monthDone, monthNoShow] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          businessId: biz.id,
          startsAt: { gte: start, lt: end },
          status: { not: "cancelled" },
        },
        include: { customer: true, service: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.conversation.count({
        where: { businessId: biz.id, status: "handoff" },
      }),
      prisma.appointment.count({
        where: {
          businessId: biz.id,
          status: { not: "cancelled" },
          createdAt: {
            gte: monthStart,
          },
        },
      }),
      prisma.subscriptionPayment.findFirst({
        where: { businessId: biz.id, status: "pending" },
      }),
      prisma.message.count({
        where: {
          direction: "inbound",
          createdAt: { gte: start, lt: end },
          conversation: { businessId: biz.id },
        },
      }),
      prisma.service.count({ where: { businessId: biz.id, active: true } }),
      prisma.conversation.findMany({
        where: { businessId: biz.id, status: "handoff" },
        include: {
          customer: true,
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.appointment.findMany({
        where: {
          businessId: biz.id,
          startsAt: { gte: weekStart, lt: end },
          status: { not: "cancelled" },
        },
        select: { startsAt: true },
      }),
      prisma.appointment.count({
        where: { businessId: biz.id, status: "done", startsAt: { gte: monthStart } },
      }),
      prisma.appointment.count({
        where: { businessId: biz.id, status: "no_show", startsAt: { gte: monthStart } },
      }),
    ]);

  const ready = ficheCompleteness({
    name: biz.name,
    category: biz.category,
    address: biz.address,
    neighborhood: biz.neighborhood,
    hoursJson: biz.hoursJson,
    greetingFr: biz.greetingFr,
    greetingWo: biz.greetingWo,
    serviceCount,
  });
  const limit = rdvLimit(biz.plan, biz.status);
  const trialLeft = biz.trialEndsAt
    ? Math.max(0, Math.ceil((biz.trialEndsAt.getTime() - Date.now()) / 86400000))
    : null;
  const absentDenom = monthDone + monthNoShow;
  const absentPct = absentDenom ? `${Math.round((monthNoShow / absentDenom) * 100)} %` : "—";

  const weekItems = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const key = toYmd(day);
    const value = weekAppts.filter((a) => toYmd(a.startsAt) === key).length;
    const label = new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      timeZone: "Africa/Dakar",
    })
      .format(day)
      .replace(".", "");
    return { label, value };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${t(lang, "hello")} ${firstName}`}
        help={`${planLabel(biz.plan)} · ${statusLabel(biz.status)}${
          trialLeft !== null && biz.status === "trial" ? ` · ${trialLeft} ${t(lang, "trialDays")}` : ""
        }`}
      />

      {ready.percent < 80 && (
        <Link
          href="/app/fiche"
          className="card px-4 py-4 bg-info-bg border-info block min-h-12"
        >
          <div className="font-bold text-info">
            {t(lang, "readyPct")} {ready.percent} %
          </div>
          <div className="mt-2 h-3 rounded-full bg-white overflow-hidden">
            <div className="h-full bg-info" style={{ width: `${ready.percent}%` }} />
          </div>
          <div className="mt-2 font-semibold text-info underline">{t(lang, "completeFiche")}</div>
        </Link>
      )}

      {limit && monthCount >= limit && (
        <div className="card px-4 py-3 border-warning bg-warning-bg text-warning font-medium">
          {t(lang, "capHit")}
        </div>
      )}
      {pendingPay && (
        <div className="card px-4 py-3 bg-money-bg text-money font-medium">
          {t(lang, "payPending")} · {formatFcfa(pendingPay.amountFcfa)}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <KpiCard value={String(todayAppts.length)} label={t(lang, "apptsToday")} href="/app/calendrier" />
        <KpiCard value={String(inboundToday)} label={t(lang, "messagesToday")} href="/app/messages" />
        <KpiCard value={absentPct} label={t(lang, "absentRate")} />
      </div>

      <MiniBars title={t(lang, "weekChart")} items={weekItems} />

      {waiting.length > 0 && (
        <section className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex justify-between items-center">
            <h2 className="text-lg font-bold text-navy">{t(lang, "actionNeeded")}</h2>
            <Link
              href="/app/messages?f=handoff"
              className="font-semibold text-navy min-h-12 inline-flex items-center"
            >
              {t(lang, "seeAll")}
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {waiting.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="font-bold">
                  {c.customer.name || displayPhone(c.customer.phone)}
                </div>
                <p className="text-muted line-clamp-2">{c.messages[0]?.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex justify-between items-center">
          <h2 className="text-lg font-bold text-navy">{t(lang, "todayAgenda")}</h2>
          <Link href="/app/calendrier" className="font-semibold text-navy min-h-12 inline-flex items-center">
            {t(lang, "seeAll")}
          </Link>
        </div>
        {todayAppts.length === 0 ? (
          <EmptyState
            title={t(lang, "emptyTodayTitle")}
            description={t(lang, "noneToday")}
            ctaLabel={t(lang, "viewWeek")}
            ctaHref="/app/calendrier"
          />
        ) : (
          <ul className="divide-y divide-line">
            {todayAppts.map((a) => (
              <li key={a.id} className="px-4 py-4">
                <AppointmentCard appt={a} lang={lang} redirectTo="/app" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
