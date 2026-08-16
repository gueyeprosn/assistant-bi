import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseHours } from "@/lib/hours";
import { formatFcfa } from "@/lib/format";
import { saveFiche, saveService, toggleService } from "@/app/actions/business";
import { HoursEditor } from "@/components/HoursEditor";
import { getLang } from "@/app/actions/lang";
import { ficheCompleteness } from "@/lib/fiche";
import { t } from "@/lib/i18n";

export default async function FichePage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const services = await prisma.service.findMany({
    where: { businessId: ctx.business.id },
    orderBy: { sortOrder: "asc" },
  });
  const hours = parseHours(ctx.business.hoursJson);
  const ready = ficheCompleteness({
    name: ctx.business.name,
    category: ctx.business.category,
    address: ctx.business.address,
    neighborhood: ctx.business.neighborhood,
    hoursJson: ctx.business.hoursJson,
    greetingFr: ctx.business.greetingFr,
    greetingWo: ctx.business.greetingWo,
    serviceCount: services.filter((s) => s.active).length,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy">{t(lang, "bot")}</h1>
        <p className="text-muted mt-2">
          {t(lang, "readyPct")} {ready.percent} %
        </p>
        <div className="mt-2 h-3 rounded-full bg-soft overflow-hidden">
          <div className="h-full bg-gold" style={{ width: `${ready.percent}%` }} />
        </div>
      </div>
      <form action={saveFiche} className="card p-4 space-y-4">
        <label className="block font-bold">
          {t(lang, "address")}
          <input name="address" defaultValue={ctx.business.address} className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "neighborhood")}
          <input
            name="neighborhood"
            defaultValue={ctx.business.neighborhood}
            className="field mt-1"
          />
        </label>
        <label className="block font-bold">
          {t(lang, "greetFr")}
          <textarea name="greetingFr" rows={3} defaultValue={ctx.business.greetingFr} className="field mt-1 min-h-24" />
        </label>
        <label className="block font-bold">
          {t(lang, "greetWo")}
          <textarea name="greetingWo" rows={3} defaultValue={ctx.business.greetingWo} className="field mt-1 min-h-24" />
        </label>
        <HoursEditor initial={hours} />
        <label className="block font-bold">
          {t(lang, "latePolicy")}
          <textarea
            name="latePolicy"
            rows={2}
            defaultValue={ctx.business.latePolicy}
            className="field mt-1 min-h-20"
          />
        </label>
        <label className="block font-bold">
          {t(lang, "cancelPolicy")}
          <textarea
            name="cancellationPolicy"
            rows={2}
            defaultValue={ctx.business.cancellationPolicy}
            className="field mt-1 min-h-20"
          />
        </label>
        <label className="block font-bold">
          {t(lang, "minNotice")}
          <input
            name="minimumNoticeMin"
            type="number"
            min={0}
            defaultValue={ctx.business.minimumNoticeMin}
            className="field mt-1"
          />
        </label>
        <button className="btn btn-primary w-full">{t(lang, "save")}</button>
      </form>

      <section>
        <h2 className="text-xl font-bold text-navy mb-3">{t(lang, "services")}</h2>
        <ul className="space-y-3">
          {services.map((s) => (
            <li key={s.id} className="card p-4">
              <form action={saveService} className="space-y-2">
                <input type="hidden" name="id" value={s.id} />
                <input name="name" defaultValue={s.name} className="field" />
                <div className="grid grid-cols-2 gap-2">
                  <input name="priceFcfa" type="number" defaultValue={s.priceFcfa} className="field" />
                  <input name="durationMin" type="number" defaultValue={s.durationMin} className="field" />
                </div>
                <input
                  name="keywords"
                  defaultValue={JSON.parse(s.keywordsJson || "[]").join(", ")}
                  className="field"
                />
                <button className="btn btn-primary w-full">{t(lang, "save")}</button>
              </form>
              <div className="flex justify-between items-center mt-3">
                <span className="text-muted">
                  {formatFcfa(s.priceFcfa)} · {s.durationMin} min
                </span>
                <form action={toggleService}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="active" value={s.active ? "true" : "false"} />
                  <button className="font-bold text-navy min-h-11">
                    {s.active ? t(lang, "hide") : t(lang, "show")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        <form action={saveService} className="mt-4 card p-4 space-y-2 border-dashed">
          <input name="name" placeholder={t(lang, "newService")} required className="field" />
          <div className="grid grid-cols-2 gap-2">
            <input name="priceFcfa" type="number" placeholder={t(lang, "price")} required className="field" />
            <input name="durationMin" type="number" placeholder={t(lang, "minutes")} defaultValue={60} className="field" />
          </div>
          <button className="btn btn-gold w-full">{t(lang, "add")}</button>
        </form>
      </section>
    </div>
  );
}
