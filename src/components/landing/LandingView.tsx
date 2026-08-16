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
  IconLock,
  IconPhone,
  IconQuote,
  IconShield,
} from "@/components/Icons";
import { PLANS } from "@/lib/plans";
import { formatFcfa } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";

export function LandingView({ lang, supportWa }: { lang: Lang; supportWa?: string }) {
  const steps = [
    [t(lang, "how1t"), t(lang, "how1d"), IconChat],
    [t(lang, "how2t"), t(lang, "how2d"), IconBot],
    [t(lang, "how3t"), t(lang, "how3d"), IconCalendar],
    [t(lang, "how4t"), t(lang, "how4d"), IconPhone],
  ] as const;

  const benefits: [string, string, (props: { className?: string }) => ReactNode][] = [
    [t(lang, "ben1t"), t(lang, "ben1d"), IconClock],
    [t(lang, "ben2t"), t(lang, "ben2d"), IconCalendar],
    [t(lang, "ben3t"), t(lang, "ben3d"), IconBell],
    [t(lang, "ben4t"), t(lang, "ben4d"), IconBot],
  ];

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

  const trusts = [
    [t(lang, "trust1t"), t(lang, "trust1d"), IconLock],
    [t(lang, "trust2t"), t(lang, "trust2d"), IconShield],
    [t(lang, "trust3t"), t(lang, "trust3d"), IconCheck],
  ] as const;

  const faqs = [
    [t(lang, "faq1q"), t(lang, "faq1a")],
    [t(lang, "faq2q"), t(lang, "faq2a")],
    [t(lang, "faq3q"), t(lang, "faq3a")],
    [t(lang, "faq4q"), t(lang, "faq4a")],
    [t(lang, "faq5q"), t(lang, "faq5a")],
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
            <a href="#fonctions" className="min-h-12 inline-flex items-center hover:opacity-80">
              {t(lang, "navFeatures")}
            </a>
            <a href="#comment" className="min-h-12 inline-flex items-center hover:opacity-80">
              {t(lang, "navHow")}
            </a>
            <a href="#offres" className="min-h-12 inline-flex items-center hover:opacity-80">
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
            <Link href="/inscription" className="btn btn-gold">
              {t(lang, "startFree")}
            </Link>
          </div>
        </div>
      </header>

      <main id="contenu">
        <section className="max-w-6xl mx-auto px-4 pt-12 sm:pt-20 pb-16 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-sm font-bold tracking-wide uppercase text-muted">
              {t(lang, "heroEyebrow")}
            </p>
            <h1 className="mt-4 text-[2.6rem] sm:text-6xl lg:text-[4.25rem] font-bold leading-[0.98] tracking-tight">
              <span className="block">{t(lang, "heroL1")}</span>
              <span className="block">{t(lang, "heroL2")}</span>
              <span className="block">
                <span className="bg-gold text-navy px-1">{t(lang, "heroAccent")}</span>
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed max-w-xl text-muted">{t(lang, "heroSub")}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/inscription" className="btn btn-gold">
                {t(lang, "startFree")}
              </Link>
              <Link href="/demo" className="btn btn-ghost">
                {t(lang, "trySim")}
              </Link>
            </div>
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-muted">
              <li className="inline-flex items-center gap-1.5">
                <IconCheck className="h-4 w-4 text-gold" />
                {t(lang, "noCommit")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <IconCheck className="h-4 w-4 text-gold" />
                {t(lang, "noCard")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <IconCheck className="h-4 w-4 text-gold" />
                {t(lang, "trial7")}
              </li>
            </ul>
          </div>

          <div className="rounded-[1.75rem] border border-line bg-soft p-4 sm:p-6">
            <LandingChatPreview lang={lang} />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-bold">
              <div className="rounded-xl bg-white border border-line px-2 py-3">24h/24</div>
              <div className="rounded-xl bg-white border border-line px-2 py-3">FR + WO</div>
              <div className="rounded-xl bg-white border border-line px-2 py-3">{t(lang, "fromPrice").replace("Dès ", "")}</div>
            </div>
          </div>
        </section>

        <section className="bg-soft border-y border-line">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl leading-tight">
              {t(lang, "benefitsTitle")}
            </h2>
            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              {benefits.map(([title, d, Icon]) => (
                <div key={title} className="card p-6">
                  <span className="h-12 w-12 rounded-xl bg-navy text-white flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-bold text-xl">{title}</h3>
                  <p className="mt-2 text-muted">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="comment" className="max-w-6xl mx-auto px-4 py-16 scroll-mt-20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-10">{t(lang, "how")}</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map(([title, d, Icon], i) => (
              <li key={title} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-12 w-12 rounded-full bg-gold text-navy font-bold flex items-center justify-center text-lg">
                    {i + 1}
                  </span>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="mt-2 text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <Link href="/demo" className="btn btn-gold mt-8">
            {t(lang, "trySim")}
          </Link>
        </section>

        <section id="fonctions" className="bg-soft border-y border-line scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold">{t(lang, "what")}</h2>
              <ul className="mt-8 space-y-5">
                {features.map(([title, d, Icon]) => (
                  <li key={title} className="flex gap-4">
                    <span className="h-12 w-12 rounded-xl bg-white border border-line flex items-center justify-center shrink-0">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="font-bold text-lg">{title}</h3>
                      <p className="text-muted">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.75rem] border border-line bg-white p-4 sm:p-6">
              <LandingChatPreview lang={lang} />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold">{t(lang, "trustTitle")}</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {trusts.map(([title, d, Icon]) => (
              <div key={title} className="card p-6">
                <Icon className="h-7 w-7 mb-4" />
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="mt-2 text-muted">{d}</p>
              </div>
            ))}
          </div>
          <Link
            href="/legal/confidentialite"
            className="inline-flex min-h-12 items-center mt-4 font-semibold underline"
          >
            {t(lang, "legalPrivacy")}
          </Link>
        </section>

        <section id="offres" className="bg-soft border-y border-line scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl sm:text-4xl font-bold">{t(lang, "plans")}</h2>
            <p className="text-muted mt-2 mb-10">{t(lang, "plansSub")}</p>
            <div className="grid md:grid-cols-3 gap-4 items-stretch">
              {Object.values(PLANS).map((p) => {
                const featured = p.id === "standard";
                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl p-6 flex flex-col ${
                      featured ? "bg-navy text-white" : "bg-white border border-line"
                    }`}
                  >
                    {featured && (
                      <div className="text-xs font-bold uppercase tracking-wide text-gold mb-2">
                        {t(lang, "popular")}
                      </div>
                    )}
                    <div className={featured ? "text-white/75" : "text-muted"}>{p.target}</div>
                    <div className="text-2xl font-bold mt-1">{p.name}</div>
                    <div className="mt-3 text-3xl font-bold">
                      {formatFcfa(p.priceFcfa)}
                      <span className={`text-base font-semibold ${featured ? "text-white/75" : "text-muted"}`}>
                        {" "}
                        / mois
                      </span>
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
                    <Link href="/inscription" className={`btn mt-6 ${featured ? "btn-gold" : "btn-ghost"}`}>
                      {t(lang, "choose")}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">{t(lang, "faqTitle")}</h2>
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
          <div className="max-w-6xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">{t(lang, "ctaReady")}</h2>
            <p className="text-white/80 mt-4 max-w-xl mx-auto">
              {t(lang, "noCommit")} · {t(lang, "noCard")} · {t(lang, "trial7")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/inscription" className="btn btn-gold">
                {t(lang, "startFree")}
              </Link>
              <Link href="/login" className="btn border-2 border-white text-white bg-transparent">
                {t(lang, "openPro")}
              </Link>
            </div>
            <p className="text-white/70 text-sm mt-8">
              {t(lang, "demoAccounts")}
              <br />
              Salon Awa Braids · 77 111 11 11 · PIN 1234
              <br />
              Garage Touba Auto · 77 222 22 22 · PIN 1234
            </p>
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
