import { updateAppointmentStatus } from "@/app/actions/business";
import { formatDateTime } from "@/lib/format";
import { displayPhone } from "@/lib/phone";
import { t, type Lang } from "@/lib/i18n";
import { Badge } from "./ui/Badge";
import { SubmitButton } from "./ui/SubmitButton";

type Appt = {
  id: string;
  startsAt: Date;
  status: string;
  customer: { name: string | null; phone: string };
  service?: { name: string } | null;
};

function statusBadge(status: string, lang: Lang) {
  switch (status) {
    case "done":
      return { tone: "success" as const, label: t(lang, "statusDone") };
    case "no_show":
      return { tone: "warning" as const, label: t(lang, "statusNoShow") };
    case "cancelled":
      return { tone: "danger" as const, label: t(lang, "statusCancelled") };
    case "reminded":
      return { tone: "info" as const, label: t(lang, "statusReminded") };
    default:
      return { tone: "info" as const, label: t(lang, "statusBooked") };
  }
}

export function AppointmentCard({
  appt,
  lang,
  redirectTo,
}: {
  appt: Appt;
  lang: Lang;
  redirectTo: string;
}) {
  const badge = statusBadge(appt.status, lang);
  const waHref = `https://wa.me/${appt.customer.phone.replace(/\D/g, "")}`;
  const actionable = appt.status !== "cancelled" && appt.status !== "done";

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-lg truncate">{appt.customer.name || displayPhone(appt.customer.phone)}</div>
          <div className="text-muted">
            {formatDateTime(appt.startsAt)}
            {appt.service ? ` · ${appt.service.name}` : ""}
          </div>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <a
        href={waHref}
        target="_blank"
        rel="noreferrer"
        className="btn btn-ghost w-full text-sm min-h-12"
      >
        {t(lang, "contactWa")}
      </a>
      {actionable && (
        <div className="grid grid-cols-3 gap-2">
          <form action={updateAppointmentStatus}>
            <input type="hidden" name="id" value={appt.id} />
            <input type="hidden" name="status" value="done" />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <SubmitButton className="btn btn-ghost w-full text-sm px-2">{t(lang, "done")}</SubmitButton>
          </form>
          <form action={updateAppointmentStatus}>
            <input type="hidden" name="id" value={appt.id} />
            <input type="hidden" name="status" value="no_show" />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <SubmitButton className="btn btn-ghost w-full text-sm px-2">{t(lang, "absent")}</SubmitButton>
          </form>
          <form action={updateAppointmentStatus}>
            <input type="hidden" name="id" value={appt.id} />
            <input type="hidden" name="status" value="cancelled" />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <SubmitButton className="btn btn-ghost w-full text-sm px-2">{t(lang, "cancel")}</SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
