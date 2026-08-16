import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { blockSlot, deleteBlockedSlot, updateAppointmentStatus } from "@/app/actions/business";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";

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

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold text-navy">{t(lang, "agenda")}</h1>

      <form action={blockSlot} className="card p-4 space-y-3">
        <p className="font-bold">{t(lang, "blockSlot")}</p>
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
          <input name="reason" placeholder="Tabaski" className="field mt-1" />
        </label>
        <button className="btn btn-primary w-full">{t(lang, "block")}</button>
      </form>

      {blocked.length > 0 && (
        <ul className="space-y-2">
          {blocked.map((b) => (
            <li key={b.id} className="card px-4 py-3 flex items-center justify-between gap-3">
              <span>
                {b.reason} · {formatDateTime(b.startsAt)}
              </span>
              <form action={deleteBlockedSlot}>
                <input type="hidden" name="id" value={b.id} />
                <button className="btn btn-ghost min-h-11">{t(lang, "release")}</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <ul className="card divide-y divide-line">
        {appointments.length === 0 && (
          <li className="px-4 py-8 text-muted">{t(lang, "noUpcoming")}</li>
        )}
        {appointments.map((a) => (
          <li key={a.id} className="px-4 py-4 flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg">{a.customer.name || a.customer.phone}</div>
              <div className="text-muted">
                {formatDateTime(a.startsAt)} · {a.service?.name || "—"}
              </div>
            </div>
            {a.status !== "cancelled" && (
              <form action={updateAppointmentStatus}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="status" value="cancelled" />
                <button className="btn btn-ghost">{t(lang, "cancel")}</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
