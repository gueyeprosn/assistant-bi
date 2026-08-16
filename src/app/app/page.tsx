import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, formatDateTime, formatFcfa, planLabel, startOfDayDakar, statusLabel } from "@/lib/format";
import { rdvLimit } from "@/lib/plans";
import { updateAppointmentStatus } from "@/app/actions/business";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";
import { ficheCompleteness } from "@/lib/fiche";
import { displayPhone } from "@/lib/phone";

export default async function TodayPage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const biz = ctx.business;
  const start = startOfDayDakar(new Date());
  const end = addDays(start, 1);
  const firstName = ctx.user.name.split(/\s+/)[0] || ctx.user.name;

  const [todayAppts, handoffs, monthCount, pendingPay, inboundToday, serviceCount, waiting] =
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
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-navy">
          {t(lang, "hello")} {firstName}
        </h1>
        <p className="text-muted mt-1">
          {planLabel(biz.plan)} · {statusLabel(biz.status)}
          {trialLeft !== null && biz.status === "trial"
            ? ` · ${trialLeft} ${t(lang, "trialDays")}`
            : ""}
        </p>
      </div>

      {ready.percent < 80 && (
        <Link
          href="/app/fiche"
          className="card px-4 py-4 bg-gold/15 border-gold block min-h-12"
        >
          <div className="font-bold text-navy">
            {t(lang, "readyPct")} {ready.percent} %
          </div>
          <div className="mt-2 h-3 rounded-full bg-white overflow-hidden">
            <div className="h-full bg-gold" style={{ width: `${ready.percent}%` }} />
          </div>
          <div className="mt-2 font-semibold text-navy underline">{t(lang, "completeFiche")}</div>
        </Link>
      )}

      {limit && monthCount >= limit && (
        <div className="card px-4 py-3 border-gold bg-gold/15 font-medium">{t(lang, "capHit")}</div>
      )}
      {pendingPay && (
        <div className="card px-4 py-3 bg-gold/15 font-medium">
          {t(lang, "payPending")} · {formatFcfa(pendingPay.amountFcfa)}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat n={inboundToday} label={t(lang, "messagesToday")} />
        <Stat n={todayAppts.length} label={t(lang, "apptsToday")} />
        <Stat n={handoffs} label={t(lang, "missed")} href="/app/messages?f=handoff" />
      </div>

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
          <p className="px-4 py-8 text-muted">{t(lang, "noneToday")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {todayAppts.map((a) => (
              <li key={a.id} className="px-4 py-4 space-y-3">
                <div>
                  <div className="font-bold text-lg">{a.customer.name || a.customer.phone}</div>
                  <div className="text-muted">
                    {formatDateTime(a.startsAt)}
                    {a.service ? ` · ${a.service.name}` : ""}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <StatusBtn id={a.id} status="done" label={t(lang, "done")} />
                  <StatusBtn id={a.id} status="no_show" label={t(lang, "absent")} />
                  <StatusBtn id={a.id} status="cancelled" label={t(lang, "cancel")} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ n, label, href }: { n: number; label: string; href?: string }) {
  const inner = (
    <div className="card p-4">
      <div className="text-4xl font-bold text-navy">{n}</div>
      <div className="text-muted mt-1">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function StatusBtn({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={updateAppointmentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className="btn btn-ghost w-full text-sm px-2">{label}</button>
    </form>
  );
}
