import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime, toYmd } from "@/lib/format";
import { blockSlot, deleteBlockedSlot } from "@/app/actions/business";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { AppointmentCard } from "@/components/AppointmentCard";

export default async function CalendarPage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const now = new Date();
  const [appointments, blocked] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        businessId: ctx.business.id,
        startsAt: { gte: new Date(now.getTime() - 86400000) },
      },
      include: { customer: true, service: true },
      orderBy: { startsAt: "asc" },
      take: 60,
    }),
    prisma.blockedSlot.findMany({
      where: { businessId: ctx.business.id, endsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const groups = new Map<string, typeof appointments>();
  for (const a of appointments) {
    const key = toYmd(a.startsAt);
    const list = groups.get(key) || [];
    list.push(a);
    groups.set(key, list);
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t(lang, "agenda")} help={t(lang, "agendaHelp")} />

      {groups.size === 0 ? (
        <EmptyState title={t(lang, "emptyAgendaTitle")} description={t(lang, "noUpcoming")} />
      ) : (
        <div className="space-y-4">
          {[...groups.entries()].map(([day, list]) => (
            <section key={day} className="card overflow-hidden">
              <h2 className="px-4 py-3 border-b border-line font-bold text-navy">{formatDate(list[0].startsAt)}</h2>
              <ul className="divide-y divide-line">
                {list.map((a) => (
                  <li key={a.id} className="px-4 py-4">
                    <AppointmentCard appt={a} lang={lang} redirectTo="/app/calendrier" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {blocked.length > 0 && (
        <ul className="space-y-2">
          {blocked.map((b) => (
            <li key={b.id} className="card px-4 py-3 flex items-center justify-between gap-3">
              <span className="min-w-0">
                {b.reason} · {formatDateTime(b.startsAt)}
              </span>
              <form action={deleteBlockedSlot}>
                <input type="hidden" name="id" value={b.id} />
                <SubmitButton className="btn btn-ghost min-h-12">{t(lang, "release")}</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}

      <details className="card p-4">
        <summary className="font-bold cursor-pointer">{t(lang, "blockSlot")}</summary>
        <form action={blockSlot} className="space-y-3 mt-3">
          <label className="block font-semibold">
            {t(lang, "date")}
            <input type="date" name="date" required className="field mt-1" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block font-semibold">
              {t(lang, "start")}
              <input type="time" name="start" defaultValue="09:00" className="field mt-1" />
            </label>
            <label className="block font-semibold">
              {t(lang, "end")}
              <input type="time" name="end" defaultValue="19:00" className="field mt-1" />
            </label>
          </div>
          <label className="block font-semibold">
            {t(lang, "reason")}
            <input name="reason" className="field mt-1" />
          </label>
          <SubmitButton>{t(lang, "block")}</SubmitButton>
        </form>
      </details>
    </div>
  );
}
