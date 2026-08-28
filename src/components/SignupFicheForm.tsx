"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { HoursEditor } from "@/components/HoursEditor";
import { FaqListEditor } from "@/components/FaqListEditor";
import { signupAction } from "@/app/actions/auth";
import { DEFAULT_WEEK_HOURS } from "@/lib/hours";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { t, type Lang } from "@/lib/i18n";

type ServiceRow = { name: string; price: string; duration: string };

const emptyService = (): ServiceRow => ({ name: "", price: "", duration: "60" });

const TOTAL_STEPS = 9;

function validateStep(container: HTMLElement | null): boolean {
  if (!container) return true;
  const fields = container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select",
  );
  for (const field of Array.from(fields)) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  return true;
}

export function SignupFicheForm({ lang, error }: { lang: Lang; error?: string }) {
  const [services, setServices] = useState<ServiceRow[]>([emptyService(), emptyService()]);
  const [holidayPolicy, setHolidayPolicy] = useState<"closed" | "special">("closed");
  const [step, setStep] = useState(0);

  const stepContainers = useRef<(HTMLDivElement | null)[]>([]);

  function goNext() {
    if (!validateStep(stepContainers.current[step])) return;
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const stepClass = (i: number) => (i === step ? "card p-5 sm:p-7 space-y-4" : "hidden");

  return (
    <form action={signupAction} className="w-full max-w-xl space-y-5">
      <div className="sticky top-0 bg-soft/95 backdrop-blur-sm pt-1 pb-3 -mx-4 px-4 z-10">
        <p className="text-sm font-bold text-navy mb-2">
          {t(lang, "stepLabel")} {step + 1} {t(lang, "stepOf")} {TOTAL_STEPS}
        </p>
        <div className="h-2 rounded-full bg-white overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-300"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div ref={(el) => { stepContainers.current[0] = el; }} className={step === 0 ? "card p-5 sm:p-7 space-y-3" : "hidden"}>
        <h1 className="text-2xl font-bold text-navy">{t(lang, "signupTitle")}</h1>
        <p className="text-muted">{t(lang, "signupHelp")}</p>
        {error ? <p className="alert-error">{error}</p> : null}
        <label className="block font-bold">
          {t(lang, "shopName")}
          <input name="businessName" required minLength={2} className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "category")}
          <input
            name="category"
            required
            minLength={2}
            maxLength={48}
            list="metiers-suggestions"
            placeholder={t(lang, "categoryPlaceholder")}
            className="field mt-1"
            autoComplete="off"
          />
          <datalist id="metiers-suggestions">
            <option value="Coiffure / salon" />
            <option value="Garage" />
            <option value="Boutique / vente en ligne" />
            <option value="Artisan bâtiment" />
            <option value="Infirmier / infirmière" />
          </datalist>
          <span className="block mt-1 font-normal text-muted">{t(lang, "categoryHelp")}</span>
        </label>
        <label className="block font-bold">
          {t(lang, "waBotNumber")}
          <span className="mt-1 flex gap-2 items-stretch">
            <span className="inline-flex w-[5.5rem] shrink-0 items-center justify-center rounded-xl border-2 border-line bg-soft font-bold">
              +221
            </span>
            <input
              name="phone"
              required
              placeholder="77 111 11 11"
              className="field min-w-0 flex-1"
              inputMode="tel"
              autoComplete="tel"
            />
          </span>
        </label>
        <fieldset>
          <legend className="font-bold mb-2">{t(lang, "defaultReplyLang")}</legend>
          <div className="grid gap-2">
            {[
              ["fr", t(lang, "french")],
              ["wo", t(lang, "wolof")],
              ["both", t(lang, "langBoth")],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-3 min-h-12 font-bold">
                <input type="radio" name="defaultLang" value={value} defaultChecked={value === "fr"} className="h-5 w-5" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div ref={(el) => { stepContainers.current[1] = el; }} className={stepClass(1)}>
        <h2 className="text-xl font-bold text-navy">{t(lang, "sectionHours")}</h2>
        <HoursEditor
          initial={DEFAULT_WEEK_HOURS}
          label={t(lang, "hours")}
          closedLabel={t(lang, "closed")}
          help={t(lang, "hoursGmtHelp")}
          openLabel={t(lang, "hoursOpen")}
          closeLabel={t(lang, "hoursClose")}
        />
        <fieldset>
          <legend className="font-bold mb-2">{t(lang, "holidays")}</legend>
          <label className="flex items-center gap-3 min-h-12 font-bold">
            <input
              type="radio"
              name="holidayPolicy"
              value="closed"
              checked={holidayPolicy === "closed"}
              onChange={() => setHolidayPolicy("closed")}
              className="h-5 w-5"
            />
            {t(lang, "holidaysClosed")}
          </label>
          <label className="flex items-center gap-3 min-h-12 font-bold">
            <input
              type="radio"
              name="holidayPolicy"
              value="special"
              checked={holidayPolicy === "special"}
              onChange={() => setHolidayPolicy("special")}
              className="h-5 w-5"
            />
            {t(lang, "holidaysSpecial")}
          </label>
          {holidayPolicy === "special" ? (
            <input name="holidayHoursNote" className="field mt-2" placeholder={t(lang, "holidaysSpecial")} />
          ) : null}
        </fieldset>
      </div>

      <div ref={(el) => { stepContainers.current[2] = el; }} className={stepClass(2)}>
        <h2 className="text-xl font-bold text-navy">{t(lang, "sectionContact")}</h2>
        <label className="block font-bold">
          {t(lang, "fullAddress")}
          <input name="address" required className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "neighborhood")}
          <input name="neighborhood" className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "secondaryPhone")}
          <input name="secondaryPhone" className="field mt-1" inputMode="tel" placeholder="77 222 22 22" />
        </label>
      </div>

      <div ref={(el) => { stepContainers.current[3] = el; }} className={stepClass(3)}>
        <h2 className="text-xl font-bold text-navy">{t(lang, "sectionServices")}</h2>
        <p className="text-muted">{t(lang, "servicesNote")}</p>
        {services.map((row, i) => (
          <div key={i} className="rounded-xl border border-line p-3 space-y-2">
            <label className="block font-bold">
              {t(lang, "serviceName")}
              <input
                name="serviceName"
                value={row.name}
                required={i === 0}
                onChange={(e) =>
                  setServices((rows) => rows.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)))
                }
                placeholder={i === 0 ? "Ex : Braids simple" : undefined}
                className="field mt-1"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block font-bold">
                {t(lang, "price")}
                <input
                  name="servicePriceFcfa"
                  type="number"
                  min={0}
                  required={i === 0}
                  value={row.price}
                  onChange={(e) =>
                    setServices((rows) => rows.map((r, idx) => (idx === i ? { ...r, price: e.target.value } : r)))
                  }
                  placeholder="8000"
                  className="field mt-1"
                />
              </label>
              <label className="block font-bold">
                {t(lang, "durationEst")}
                <input
                  name="serviceDurationMin"
                  type="number"
                  min={15}
                  value={row.duration}
                  onChange={(e) =>
                    setServices((rows) => rows.map((r, idx) => (idx === i ? { ...r, duration: e.target.value } : r)))
                  }
                  className="field mt-1"
                />
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost w-full"
          onClick={() => setServices((rows) => [...rows, emptyService()])}
        >
          {t(lang, "addService")}
        </button>
      </div>

      <div ref={(el) => { stepContainers.current[4] = el; }} className={stepClass(4)}>
        <h2 className="text-xl font-bold text-navy">{t(lang, "sectionFaq")}</h2>
        <p className="text-muted">{t(lang, "faqHelp")}</p>
        <FaqListEditor lang={lang} />
      </div>

      <div ref={(el) => { stepContainers.current[5] = el; }} className={stepClass(5)}>
        <h2 className="text-xl font-bold text-navy">{t(lang, "sectionBooking")}</h2>
        <label className="block font-bold">
          {t(lang, "slotMin")}
          <input name="slotStepMin" type="number" min={15} defaultValue={30} className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "minNoticeHours")}
          <input name="minimumNoticeHours" type="number" min={0} defaultValue={1} className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "maxPerDay")}
          <input name="maxAppointmentsPerDay" type="number" min={0} defaultValue={0} className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "confirmMsg")}
          <textarea name="confirmationMessage" rows={2} className="field mt-1 min-h-20" />
        </label>
      </div>

      <div ref={(el) => { stepContainers.current[6] = el; }} className={stepClass(6)}>
        <h2 className="text-xl font-bold text-navy">{t(lang, "sectionReminders")}</h2>
        <fieldset>
          <legend className="font-bold mb-2">{t(lang, "reminderJ1")}</legend>
          <label className="flex items-center gap-3 min-h-12 font-bold">
            <input type="radio" name="reminderEnabled" value="yes" defaultChecked className="h-5 w-5" />
            {t(lang, "yes")}
          </label>
          <label className="flex items-center gap-3 min-h-12 font-bold">
            <input type="radio" name="reminderEnabled" value="no" className="h-5 w-5" />
            {t(lang, "no")}
          </label>
        </fieldset>
        <label className="block font-bold">
          {t(lang, "reminderHour")}
          <input name="reminderHour" type="number" min={0} max={23} defaultValue={9} className="field mt-1" />
        </label>
      </div>

      <div ref={(el) => { stepContainers.current[7] = el; }} className={stepClass(7)}>
        <h2 className="text-xl font-bold text-navy">{t(lang, "takeHuman")}</h2>
        <p className="text-muted">{t(lang, "handoffRule")}</p>
      </div>

      <div ref={(el) => { stepContainers.current[8] = el; }} className={stepClass(8)}>
        <h2 className="text-xl font-bold text-navy">{t(lang, "accessPin")}</h2>
        <p className="text-muted">{t(lang, "pinHelp")}</p>
        <label className="block font-bold">
          {t(lang, "pin")}
          <input
            name="pin"
            required
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            className="field mt-1"
            autoComplete="new-password"
          />
        </label>
        <label className="block font-bold">
          {t(lang, "pinConfirm")}
          <input
            name="pinConfirm"
            required
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            className="field mt-1"
            autoComplete="new-password"
          />
        </label>
        <p className="text-muted">{t(lang, "signupReady")}</p>
      </div>

      <div className="flex gap-3">
        {step > 0 ? (
          <button type="button" onClick={goBack} className="btn btn-ghost flex-1">
            {t(lang, "wizardBack")}
          </button>
        ) : null}
        {step < TOTAL_STEPS - 1 ? (
          <button type="button" onClick={goNext} className="btn btn-primary flex-1">
            {t(lang, "wizardNext")}
          </button>
        ) : (
          <SubmitButton className="btn btn-primary flex-1">{t(lang, "signup")}</SubmitButton>
        )}
      </div>
      {step === TOTAL_STEPS - 1 ? (
        <p className="text-center">
          <Link href="/login" className="font-bold text-navy underline min-h-12 inline-flex items-center">
            {t(lang, "haveAccount")}
          </Link>
        </p>
      ) : null}
    </form>
  );
}
