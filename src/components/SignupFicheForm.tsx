"use client";

import { useState } from "react";
import Link from "next/link";
import { HoursEditor } from "@/components/HoursEditor";
import { signupAction } from "@/app/actions/auth";
import { DEFAULT_WEEK_HOURS } from "@/lib/hours";
import { t, type Lang } from "@/lib/i18n";

type ServiceRow = { name: string; price: string; duration: string };
type FaqRow = { q: string; r: string };

const emptyService = (): ServiceRow => ({ name: "", price: "", duration: "60" });
const emptyFaq = (): FaqRow => ({ q: "", r: "" });

export function SignupFicheForm({ lang, error }: { lang: Lang; error?: string }) {
  const [services, setServices] = useState<ServiceRow[]>([emptyService(), emptyService()]);
  const [faqs, setFaqs] = useState<FaqRow[]>([emptyFaq(), emptyFaq(), emptyFaq()]);
  const [holidayPolicy, setHolidayPolicy] = useState<"closed" | "special">("closed");

  return (
    <form action={signupAction} className="w-full max-w-xl space-y-5">
      <div className="card p-5 sm:p-7 space-y-3">
        <h1 className="text-2xl font-bold text-navy">{t(lang, "signupTitle")}</h1>
        <p className="text-muted">{t(lang, "signupHelp")}</p>
        {error ? <p className="alert-error">{error}</p> : null}
        <label className="block font-bold">
          {t(lang, "shopName")}
          <input name="businessName" required minLength={2} className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "category")}
          <select name="category" required className="field mt-1">
            <option value="salon">{t(lang, "catSalon")}</option>
            <option value="garage">{t(lang, "catGarage")}</option>
            <option value="boutique">{t(lang, "catShop")}</option>
            <option value="artisan">{t(lang, "catArtisan")}</option>
            <option value="infirmier">{t(lang, "catNurse")}</option>
            <option value="autre">{t(lang, "catOther")}</option>
          </select>
        </label>
        <label className="block font-bold">
          {t(lang, "waBotNumber")}
          <span className="mt-1 flex gap-2">
            <span className="field w-24 flex items-center justify-center font-bold shrink-0">+221</span>
            <input
              name="phone"
              required
              placeholder="77 111 11 11"
              className="field"
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

      <section className="card p-5 sm:p-7 space-y-4">
        <h2 className="text-xl font-bold text-navy">
          <span className="text-gold">1.</span> {t(lang, "sectionHours")}
        </h2>
        <HoursEditor initial={DEFAULT_WEEK_HOURS} label={t(lang, "hours")} closedLabel={t(lang, "closed")} />
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
      </section>

      <section className="card p-5 sm:p-7 space-y-4">
        <h2 className="text-xl font-bold text-navy">
          <span className="text-gold">2.</span> {t(lang, "sectionContact")}
        </h2>
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
      </section>

      <section className="card p-5 sm:p-7 space-y-4">
        <h2 className="text-xl font-bold text-navy">
          <span className="text-gold">3.</span> {t(lang, "sectionServices")}
        </h2>
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
      </section>

      <section className="card p-5 sm:p-7 space-y-4">
        <h2 className="text-xl font-bold text-navy">
          <span className="text-gold">4.</span> {t(lang, "sectionFaq")}
        </h2>
        <p className="text-muted">{t(lang, "faqHelp")}</p>
        {faqs.map((row, i) => (
          <div key={i} className="rounded-xl border border-line p-3 space-y-2">
            <label className="block font-bold">
              {t(lang, "question")} {i + 1}
              <input
                name="faqQ"
                value={row.q}
                onChange={(e) => setFaqs((rows) => rows.map((r, idx) => (idx === i ? { ...r, q: e.target.value } : r)))}
                className="field mt-1"
              />
            </label>
            <label className="block font-bold">
              {t(lang, "answer")} {i + 1}
              <textarea
                name="faqR"
                rows={3}
                value={row.r}
                onChange={(e) => setFaqs((rows) => rows.map((r, idx) => (idx === i ? { ...r, r: e.target.value } : r)))}
                className="field mt-1 min-h-24"
              />
            </label>
          </div>
        ))}
      </section>

      <section className="card p-5 sm:p-7 space-y-4">
        <h2 className="text-xl font-bold text-navy">
          <span className="text-gold">5.</span> {t(lang, "sectionBooking")}
        </h2>
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
      </section>

      <section className="card p-5 sm:p-7 space-y-4">
        <h2 className="text-xl font-bold text-navy">
          <span className="text-gold">6.</span> {t(lang, "sectionReminders")}
        </h2>
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
      </section>

      <section className="card p-5 sm:p-7 space-y-4">
        <h2 className="text-xl font-bold text-navy">
          <span className="text-gold">7.</span> {t(lang, "takeHuman")}
        </h2>
        <p className="text-muted">{t(lang, "handoffRule")}</p>
      </section>

      <section className="card p-5 sm:p-7 space-y-4">
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
        <button type="submit" className="btn btn-primary w-full">
          {t(lang, "signup")}
        </button>
        <p className="text-center">
          <Link href="/login" className="font-bold text-navy underline min-h-12 inline-flex items-center">
            {t(lang, "haveAccount")}
          </Link>
        </p>
      </section>
    </form>
  );
}
