import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";

export default async function RelancesPage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const now = new Date();

  const [upcoming, missed] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        businessId: ctx.business.id,
        startsAt: { gte: now },
        status: { in: ["booked", "reminded"] },
      },
      include: { customer: true, service: true },
      orderBy: { startsAt: "asc" },
      take: 40,
    }),
    prisma.appointment.findMany({
      where: {
        businessId: ctx.business.id,
        status: "no_show",
      },
      include: { customer: true, service: true },
      orderBy: { startsAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy">{t(lang, "remindersTitle")}</h1>
        <p className="text-muted mt-2">{t(lang, "remindersHelp")}</p>
      </div>

      <section className="card overflow-hidden">
        {upcoming.length === 0 ? (
          <p className="px-4 py-8 text-muted">{t(lang, "reminderNone")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((a) => (
              <li key={a.id} className="px-4 py-4">
                <div className="font-bold">{a.customer.name || a.customer.phone}</div>
                <div className="text-muted">
                  {formatDateTime(a.startsAt)}
                  {a.service ? ` · ${a.service.name}` : ""}
                </div>
                <div className="mt-2 inline-block text-sm font-semibold rounded-lg px-2 py-1 bg-soft text-navy">
                  {a.reminderSentAt ? t(lang, "reminderSent") : t(lang, "reminderSoon")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-navy mb-3">{t(lang, "followMissed")}</h2>
        {missed.length === 0 ? (
          <p className="text-muted">{t(lang, "noMissed")}</p>
        ) : (
          <ul className="card divide-y divide-line">
            {missed.map((a) => (
              <li key={a.id} className="px-4 py-4">
                <div className="font-bold">{a.customer.name || a.customer.phone}</div>
                <div className="text-muted">{formatDateTime(a.startsAt)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
