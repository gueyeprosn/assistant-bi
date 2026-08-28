import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseHours } from "@/lib/hours";
import { formatFcfa } from "@/lib/format";
import { saveFiche, saveService, toggleService } from "@/app/actions/business";
import { HoursEditor } from "@/components/HoursEditor";
import { FaqListEditor } from "@/components/FaqListEditor";
import { getLang } from "@/lib/lang";
import { ficheCompleteness } from "@/lib/fiche";
import { parseFaq } from "@/lib/faq";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function FichePage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const services = await prisma.service.findMany({
    where: { businessId: ctx.business.id },
    orderBy: { sortOrder: "asc" },
  });
  const hours = parseHours(ctx.business.hoursJson);
  const faqs = parseFaq(ctx.business.faqJson);
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
      <PageHeader title={t(lang, "bot")} help={t(lang, "botHelp")} />
      <div>
        <p className="font-bold text-navy">
          {t(lang, "readyPct")} {ready.percent} %
        </p>
        <div className="mt-2 h-3 rounded-full bg-soft overflow-hidden">
          <div className="h-full bg-gold" style={{ width: `${ready.percent}%` }} />
        </div>
      </div>
      <form action={saveFiche} className="space-y-5">
        <section className="card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-navy">{t(lang, "tabIdentity")}</h2>
          <label className="block font-bold">
            {t(lang, "name")}
            <input name="name" defaultValue={ctx.business.name} className="field mt-1" />
          </label>
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
            {t(lang, "secondaryPhone")}
            <input name="secondaryPhone" defaultValue={ctx.business.secondaryPhone} className="field mt-1" inputMode="tel" />
          </label>
          <fieldset>
            <legend className="font-bold mb-2">{t(lang, "defaultReplyLang")}</legend>
            <label className="flex items-center gap-3 min-h-12 font-bold">
              <input type="radio" name="defaultLang" value="fr" defaultChecked={ctx.business.defaultLang === "fr"} className="h-5 w-5" />
              {t(lang, "french")}
            </label>
            <label className="flex items-center gap-3 min-h-12 font-bold">
              <input type="radio" name="defaultLang" value="wo" defaultChecked={ctx.business.defaultLang === "wo"} className="h-5 w-5" />
              {t(lang, "wolof")}
            </label>
            <label className="flex items-center gap-3 min-h-12 font-bold">
              <input type="radio" name="defaultLang" value="both" defaultChecked={ctx.business.defaultLang === "both"} className="h-5 w-5" />
              {t(lang, "langBoth")}
            </label>
          </fieldset>
        </section>

        <section className="card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-navy">{t(lang, "tabGreeting")}</h2>
          <label className="block font-bold">
            {t(lang, "greetFr")}
            <textarea name="greetingFr" rows={3} defaultValue={ctx.business.greetingFr} className="field mt-1 min-h-24" />
          </label>
          <label className="block font-bold">
            {t(lang, "greetWo")}
            <textarea name="greetingWo" rows={3} defaultValue={ctx.business.greetingWo} className="field mt-1 min-h-24" />
          </label>
        </section>

        <section className="card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-navy">{t(lang, "tabHours")}</h2>
          <HoursEditor
            initial={hours}
            label={t(lang, "hours")}
            closedLabel={t(lang, "closed")}
            help={t(lang, "hoursGmtHelp")}
            openLabel={t(lang, "hoursOpen")}
            closeLabel={t(lang, "hoursClose")}
          />
          <fieldset>
            <legend className="font-bold mb-2">{t(lang, "holidays")}</legend>
            <label className="flex items-center gap-3 min-h-12 font-bold">
              <input type="radio" name="holidayPolicy" value="closed" defaultChecked={ctx.business.holidayPolicy !== "special"} className="h-5 w-5" />
              {t(lang, "holidaysClosed")}
            </label>
            <label className="flex items-center gap-3 min-h-12 font-bold">
              <input type="radio" name="holidayPolicy" value="special" defaultChecked={ctx.business.holidayPolicy === "special"} className="h-5 w-5" />
              {t(lang, "holidaysSpecial")}
            </label>
            <input name="holidayHoursNote" defaultValue={ctx.business.holidayHoursNote} className="field mt-2" />
          </fieldset>
        </section>

        <section className="card p-4 sm:p-6 space-y-3">
          <h2 className="text-lg font-bold text-navy">{t(lang, "tabFaq")}</h2>
          <p className="text-muted">{t(lang, "faqHelp")}</p>
          <FaqListEditor lang={lang} initial={faqs} />
        </section>

        <section className="card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-navy">{t(lang, "tabBooking")}</h2>
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
            {t(lang, "minNoticeHours")}
            <input
              name="minimumNoticeHours"
              type="number"
              min={0}
              defaultValue={Math.round(ctx.business.minimumNoticeMin / 60)}
              className="field mt-1"
            />
          </label>
          <label className="block font-bold">
            {t(lang, "slotMin")}
            <input name="slotStepMin" type="number" min={15} defaultValue={ctx.business.slotStepMin} className="field mt-1" />
          </label>
          <label className="block font-bold">
            {t(lang, "maxPerDay")}
            <input name="maxAppointmentsPerDay" type="number" min={0} defaultValue={ctx.business.maxAppointmentsPerDay} className="field mt-1" />
          </label>
          <label className="block font-bold">
            {t(lang, "confirmMsg")}
            <textarea name="confirmationMessage" rows={2} defaultValue={ctx.business.confirmationMessage} className="field mt-1 min-h-20" />
          </label>
        </section>

        <section className="card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-navy">{t(lang, "tabReminders")}</h2>
          <fieldset>
            <legend className="font-bold mb-2">{t(lang, "reminderJ1")}</legend>
            <label className="flex items-center gap-3 min-h-12 font-bold">
              <input type="radio" name="reminderEnabled" value="yes" defaultChecked={ctx.business.reminderEnabled} className="h-5 w-5" />
              {t(lang, "yes")}
            </label>
            <label className="flex items-center gap-3 min-h-12 font-bold">
              <input type="radio" name="reminderEnabled" value="no" defaultChecked={!ctx.business.reminderEnabled} className="h-5 w-5" />
              {t(lang, "no")}
            </label>
          </fieldset>
          <label className="block font-bold">
            {t(lang, "reminderHour")}
            <input name="reminderHour" type="number" min={0} max={23} defaultValue={ctx.business.reminderHour} className="field mt-1" />
          </label>
        </section>

        <SubmitButton>{t(lang, "save")}</SubmitButton>
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
                  <input name="priceFcfa" type="number" defaultValue={s.priceFcfa} className="field" aria-label={t(lang, "price")} />
                  <input name="durationMin" type="number" defaultValue={s.durationMin} className="field" aria-label={t(lang, "minutes")} />
                </div>
                <input
                  name="keywords"
                  defaultValue={JSON.parse(s.keywordsJson || "[]").join(", ")}
                  className="field"
                />
                <SubmitButton>{t(lang, "save")}</SubmitButton>
              </form>
              <div className="flex justify-between items-center mt-3">
                <span className="text-muted">
                  {formatFcfa(s.priceFcfa)} · {s.durationMin} min
                </span>
                <form action={toggleService}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="active" value={s.active ? "true" : "false"} />
                  <SubmitButton className="font-bold text-navy min-h-12 bg-transparent">
                    {s.active ? t(lang, "hide") : t(lang, "show")}
                  </SubmitButton>
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
          <SubmitButton className="btn btn-gold w-full">{t(lang, "add")}</SubmitButton>
        </form>
      </section>
    </div>
  );
}
