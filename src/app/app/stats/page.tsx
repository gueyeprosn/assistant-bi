import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canUseStats } from "@/lib/plans";
import { formatFcfa } from "@/lib/format";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";

export default async function StatsPage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const allowed = canUseStats(ctx.business.plan, ctx.business.status);
  if (!allowed) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-navy">{t(lang, "stats")}</h1>
        <div className="card p-5">
          <p className="text-muted">{t(lang, "statsLocked")}</p>
          <Link href="/app/abonnement" className="btn btn-primary mt-4 inline-flex">
            {t(lang, "goPro")}
          </Link>
        </div>
      </div>
    );
  }

  const from = new Date();
  from.setDate(from.getDate() - 30);

  const [messages, appointments, quotes] = await Promise.all([
    prisma.message.count({
      where: {
        conversation: { businessId: ctx.business.id },
        direction: "inbound",
        createdAt: { gte: from },
      },
    }),
    prisma.appointment.findMany({
      where: { businessId: ctx.business.id, createdAt: { gte: from } },
      include: { service: true },
    }),
    prisma.quote.findMany({
      where: { businessId: ctx.business.id, createdAt: { gte: from } },
    }),
  ]);

  const noShow = appointments.filter((a) => a.status === "no_show").length;
  const done = appointments.filter((a) =>
    ["done", "booked", "reminded"].includes(a.status),
  ).length;
  const denom = noShow + done;
  const rate = denom ? Math.round((noShow / denom) * 100) : 0;

  const byService: Record<string, number> = {};
  for (const a of appointments) {
    const name = a.service?.name || "—";
    byService[name] = (byService[name] || 0) + 1;
  }
  const top = Object.entries(byService).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-navy">{t(lang, "stats")}</h1>
        <p className="text-muted">{t(lang, "last30")}</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card n={String(messages)} label={t(lang, "clientMessages")} />
        <Card n={`${rate} %`} label={t(lang, "noShowRate")} />
        <Card n={String(quotes.length)} label={t(lang, "quotesSent")} />
      </div>
      <Card n={formatFcfa(quotes.reduce((s, q) => s + q.totalFcfa, 0))} label={t(lang, "quotes")} />
      <section className="card p-4">
        <h2 className="text-lg font-bold text-navy mb-3">{t(lang, "services")}</h2>
        {top.length === 0 ? (
          <p className="text-muted">—</p>
        ) : (
          <ul className="space-y-2">
            {top.map(([name, n]) => (
              <li key={name} className="flex justify-between font-semibold">
                <span>{name}</span>
                <span className="text-muted">{n}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ n, label }: { n: string; label: string }) {
  return (
    <div className="card p-4">
      <div className="text-3xl font-bold text-navy">{n}</div>
      <div className="text-muted mt-1">{label}</div>
    </div>
  );
}
