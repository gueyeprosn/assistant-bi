import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLockup, Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { LandingChatPreview } from "@/components/LandingChatPreview";
import {
  IconBell,
  IconBot,
  IconCalendar,
  IconChat,
  IconCheck,
  IconClock,
  IconPhone,
  IconQuote,
} from "@/components/Icons";
import { PLANS } from "@/lib/plans";
import { formatFcfa } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";

export function LandingView({ lang, supportWa }: { lang: Lang; supportWa?: string }) {
  const steps = [
    [t(lang, "how1t"), t(lang, "how1d"), IconChat],
    [t(lang, "how2t"), t(lang, "how2d"), IconBot],
    [t(lang, "how3t"), t(lang, "how3d"), IconCalendar],
  ] as const;

  const features: [string, string, (props: { className?: string }) => ReactNode][] =
    lang === "wo"
      ? [
          ["Tontu 24h/24", "Waxtu, adresse, prijs — français walla wolof.", IconClock],
          ["Rendez-vous", "Su créneau bi amul, bot bi wax 2–3 yu des.", IconCalendar],
          ["Fàttali J-1", "Baat bés bu njëkk. Su dindi, créneau bi ubbeeku.", IconBell],
          ["Devis", "Baat bu leer. PDF amul.", IconQuote],
          ["Joxal patron", "Su jafe, patron bi moo tontu.", IconBot],
          ["Agenda telefon", "Navigateur telefon, app bu bees soxlawul.", IconPhone],
        ]
      : [
          ["Réponses 24h/24", "Horaires, adresse, tarifs — français ou wolof.", IconClock],
          ["Rendez-vous", "Si l’heure est prise, le bot propose 2 ou 3 autres.", IconCalendar],
          ["Rappel la veille", "Message WhatsApp. S’il annule, le créneau se libère.", IconBell],
          ["Devis texte", "Un message clair. Pas de PDF.", IconQuote],
          ["Le patron reprend", "Dès que c’est compliqué, vous répondez.", IconBot],
          ["Sur le téléphone", "Navigateur seulement. Pas d’application à installer.", IconPhone],
        ];

  const proofs = [
    [t(lang, "proofHours"), IconClock],
    [t(lang, "proofLangs"), IconChat],
    [t(lang, "proofPay"), IconCheck],
  ] as const;

  const faqs = [
    [t(lang, "faq1q"), t(lang, "faq1a")],
    [t(lang, "faq2q"), t(lang, "faq2a")],
    [t(lang, "faq3q"), t(lang, "faq3a")],
  ] as const;

  return (
    <div className="landing min-h-screen bg-white text-navy">
      <div className="h-1 bg-gold" aria-hidden />

      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-gold focus:px-4 focus:py-3 focus:text-navy focus:font-bold"
      >
        Aller au contenu
      </a>

      <header className="sticky top-0 z-50 bg-white border-b border-line">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="min-h-12 inline-flex items-center shrink-0">
            <BrandLockup priority className="h-8 sm:h-9 max-w-[150px] sm:max-w-[200px]" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 font-semibold">
            <a href="#comment" className="min-h-12 inline-flex items-center hover:text-navy-2">
              {t(lang, "navHow")}
            </a>
            <a href="#offres" className="min-h-12 inline-flex items-center hover:text-navy-2">
              {t(lang, "navPlans")}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle lang={lang} />
            <Link
              href="/login"
              className="hidden sm:inline-flex font-semibold min-h-12 px-3 items-center"
            >
              {t(lang, "space")}
            </Link>
            <Link href="/demo" className="btn btn-gold">
              {t(lang, "demo")}
            </Link>
          </div>
        </div>
      </header>

      <main id="contenu">
        <section className="max-w-6xl mx-auto px-4 pt-10 sm:pt-16 pb-14 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="inline-flex items-center rounded-full border border-line bg-soft px-3 py-1.5 text-sm font-bold text-navy">
              Français + Wolof · WhatsApp
            </p>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.12] text-navy">
              {t(lang, "hero")}
            </h1>
            <p className="mt-5 text-lg leading-relaxed max-w-xl text-muted">{t(lang, "heroSub")}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/demo" className="btn btn-gold">
                {t(lang, "trySim")}
              </Link>
              <Link href="/login" className="btn btn-ghost">
                {t(lang, "trial7")}
              </Link>
            </div>
            <p className="mt-4 text-muted">{t(lang, "fromPrice")} · Wave / Orange Money</p>
          </div>

          <div className="rounded-[1.75rem] border border-line bg-soft p-4 sm:p-5">
            <LandingChatPreview lang={lang} />
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1.5 text-sm font-bold">
                <IconClock className="h-4 w-4" />
                24h/24
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1.5 text-sm font-bold">
                <IconChat className="h-4 w-4" />
                FR + WO
              </span>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-soft">
          <div className="max-w-6xl mx-auto px-4 py-8 grid sm:grid-cols-3 gap-4">
            {proofs.map(([label, Icon]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="h-12 w-12 rounded-xl bg-white border border-line text-navy flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="comment" className="max-w-6xl mx-auto px-4 py-16 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-8">{t(lang, "how")}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map(([title, d, Icon], i) => (
              <div key={title} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-navy text-white font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <Icon className="h-6 w-6 text-navy" />
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="mt-2 text-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-soft border-y border-line">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold mb-8">{t(lang, "what")}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(([title, d, Icon]) => (
                <div key={title} className="card p-6">
                  <span className="h-12 w-12 rounded-xl bg-soft text-navy flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-bold text-lg">{title}</h3>
                  <p className="mt-2 text-muted">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="card p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
            <Logo className="h-14 w-14 shrink-0" alt="" />
            <div>
              <div className="font-bold text-navy mb-2">{t(lang, "pitchTitle")}</div>
              <blockquote className="text-lg leading-relaxed">« {t(lang, "pitch")} »</blockquote>
            </div>
          </div>
        </section>

        <section id="offres" className="bg-soft border-y border-line scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold">{t(lang, "plans")}</h2>
            <p className="text-muted mb-8">{t(lang, "plansSub")}</p>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.values(PLANS).map((p) => {
                const featured = p.id === "standard";
                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl p-6 flex flex-col bg-white ${
                      featured ? "border-2 border-navy" : "border border-line"
                    }`}
                  >
                    {featured && (
                      <div className="text-xs font-bold uppercase tracking-wide text-navy mb-2">
                        {t(lang, "popular")}
                      </div>
                    )}
                    <div className="text-muted">{p.target}</div>
                    <div className="text-2xl font-bold mt-1">{p.name}</div>
                    <div className="mt-3 text-3xl font-bold">
                      {formatFcfa(p.priceFcfa)}
                      <span className="text-base font-semibold text-muted"> / mois</span>
                    </div>
                    <ul className="mt-4 space-y-2 flex-1">
                      <li className="flex gap-2">
                        <IconCheck className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                        {p.rdvPerMonth
                          ? `Max ${p.rdvPerMonth} rendez-vous / mois`
                          : "Rendez-vous sans limite"}
                      </li>
                      <li className="flex gap-2">
                        <IconCheck className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                        {p.quotes ? "Devis inclus" : "Sans devis auto"}
                      </li>
                      <li className="flex gap-2">
                        <IconCheck className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                        {p.stats ? "Chiffres du mois" : "Écran simple"}
                      </li>
                    </ul>
                    <Link href="/login" className={`btn mt-6 ${featured ? "btn-gold" : "btn-ghost"}`}>
                      {t(lang, "choose")}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8">{t(lang, "faqTitle")}</h2>
          <div className="space-y-3">
            {faqs.map(([q, a]) => (
              <details key={q} className="card px-5 py-2">
                <summary className="min-h-12 flex items-center font-bold cursor-pointer">
                  {q}
                </summary>
                <p className="pb-4 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-navy text-white">
          <div className="max-w-6xl mx-auto px-4 py-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold">{t(lang, "ctaReady")}</h2>
              <p className="text-white/80 mt-2">
                {t(lang, "demoAccounts")}
                <br />
                Salon Awa Braids · 77 111 11 11 · PIN 1234
                <br />
                Garage Touba Auto · 77 222 22 22 · PIN 1234
              </p>
            </div>
            <Link href="/login" className="btn btn-gold shrink-0">
              {t(lang, "openPro")}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3 text-muted">
          <Logo className="h-10 w-10" alt="Assistant Bi" />
          <p>Assistant Bi · WhatsApp · B2B</p>
          <nav className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/legal/confidentialite" className="underline min-h-12 inline-flex items-center">
              {t(lang, "legalPrivacy")}
            </Link>
            <Link href="/legal/cgu" className="underline min-h-12 inline-flex items-center">
              {t(lang, "legalCgu")}
            </Link>
            <Link href="/legal/cgv" className="underline min-h-12 inline-flex items-center">
              {t(lang, "legalCgv")}
            </Link>
            {supportWa ? (
              <a
                href={`https://wa.me/${supportWa.replace(/\D/g, "")}`}
                className="underline min-h-12 inline-flex items-center"
                target="_blank"
                rel="noreferrer"
              >
                {t(lang, "supportWa")}
              </a>
            ) : null}
          </nav>
        </div>
      </footer>
    </div>
  );
}
