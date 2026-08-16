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

export function LandingView({ lang }: { lang: Lang }) {
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

  return (
    <div className="landing-root relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="landing-orbs absolute inset-0" />
        <div className="landing-blob landing-blob-gold" />
        <div className="landing-blob landing-blob-light" />
        <div className="landing-grid absolute inset-0" />
      </div>

      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-gold focus:px-4 focus:py-3 focus:text-navy focus:font-bold"
      >
        Aller au contenu
      </a>

      <div className="relative z-10">
        <header className="sticky top-3 z-50 mx-auto max-w-6xl px-3">
          <div className="glass glass-shine flex items-center justify-between gap-3 rounded-2xl px-3 py-2 sm:px-4">
            <Link href="/" className="min-h-12 inline-flex items-center shrink-0">
              <BrandLockup
                light
                priority
                className="h-8 sm:h-10 max-w-[160px] sm:max-w-[210px]"
              />
            </Link>
            <div className="flex items-center gap-2">
              <LangToggle lang={lang} variant="glass" />
              <Link
                href="/login"
                className="hidden sm:inline-flex font-semibold min-h-12 px-3 items-center text-white/90 hover:text-white transition-colors duration-200"
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
          <section className="max-w-6xl mx-auto px-4 pt-10 pb-16 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-gold font-bold text-sm">
                Dakar · Français + Wolof · WhatsApp
              </p>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.35rem] font-bold leading-[1.12] text-white">
                {t(lang, "hero")}
              </h1>
              <p className="mt-5 text-lg leading-relaxed max-w-xl text-[#d5deea]">
                {t(lang, "heroSub")}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/demo" className="btn btn-gold">
                  {t(lang, "trySim")}
                </Link>
                <Link href="/login" className="btn btn-glass">
                  {t(lang, "trial7")}
                </Link>
              </div>
              <p className="mt-4 text-[#c5d0de]">{t(lang, "fromPrice")} · Wave / Orange Money</p>
            </div>

            <div className="relative">
              <div className="glass glass-shine rounded-[2.25rem] p-4 sm:p-5">
                <div className="landing-float">
                  <LandingChatPreview lang={lang} />
                </div>
              </div>
              <div className="absolute -left-2 top-10 hidden sm:flex glass rounded-full px-3 py-2 text-sm font-bold items-center gap-2">
                <IconClock className="h-4 w-4 text-gold" />
                24h/24
              </div>
              <div className="absolute -right-1 bottom-16 hidden sm:flex glass-gold rounded-full px-3 py-2 text-sm font-bold text-white items-center gap-2">
                <IconChat className="h-4 w-4" />
                FR + WO
              </div>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 pb-16">
            <div className="grid sm:grid-cols-3 gap-3">
              {proofs.map(([label, Icon]) => (
                <div
                  key={label}
                  className="glass rounded-2xl px-5 py-4 flex items-center gap-3 transition-colors duration-200"
                >
                  <span className="h-11 w-11 rounded-xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="font-semibold text-white">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 pb-16">
            <h2 className="text-3xl font-bold text-white mb-6">{t(lang, "how")}</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {steps.map(([title, d, Icon], i) => (
                <div
                  key={title}
                  className="glass glass-shine rounded-2xl p-5 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 rounded-xl bg-gold text-navy font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <Icon className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="font-bold text-lg text-white">{title}</h3>
                  <p className="mt-2 text-[#c5d0de]">{d}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 pb-16">
            <h2 className="text-3xl font-bold text-white mb-6">{t(lang, "what")}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {features.map(([title, d, Icon]) => (
                <div
                  key={title}
                  className="glass rounded-2xl p-5 transition-colors duration-200"
                >
                  <span className="h-11 w-11 rounded-xl bg-white/10 text-gold flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-bold text-lg text-white">{title}</h3>
                  <p className="mt-2 text-[#c5d0de]">{d}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 pb-16">
            <div className="glass-strong glass-shine rounded-3xl p-6 sm:p-8 grid md:grid-cols-[auto_1fr] gap-5 items-start">
              <Logo className="h-14 w-14" alt="" />
              <div>
                <div className="font-bold text-gold mb-2">{t(lang, "pitchTitle")}</div>
                <blockquote className="text-lg leading-relaxed text-white">
                  « {t(lang, "pitch")} »
                </blockquote>
              </div>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 pb-16">
            <h2 className="text-3xl font-bold text-white">{t(lang, "plans")}</h2>
            <p className="text-[#c5d0de] mb-6">{t(lang, "plansSub")}</p>
            <div className="grid md:grid-cols-3 gap-3">
              {Object.values(PLANS).map((p) => {
                const featured = p.id === "standard";
                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl p-6 flex flex-col transition-colors duration-200 ${
                      featured ? "glass-gold" : "glass"
                    }`}
                  >
                    {featured && (
                      <div className="text-xs font-bold uppercase tracking-wide text-gold mb-2">
                        {t(lang, "popular")}
                      </div>
                    )}
                    <div className="text-white/75">{p.target}</div>
                    <div className="text-2xl font-bold mt-1 text-white">{p.name}</div>
                    <div className="mt-3 text-3xl font-bold text-white">
                      {formatFcfa(p.priceFcfa)}
                      <span className="text-base font-semibold text-white/75"> / mois</span>
                    </div>
                    <ul className="mt-4 space-y-2 flex-1 text-white/90">
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
                    <Link
                      href="/login"
                      className={`btn mt-6 ${featured ? "btn-gold" : "btn-glass"}`}
                    >
                      {t(lang, "choose")}
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 pb-16">
            <div className="glass-strong glass-shine rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{t(lang, "ctaReady")}</h2>
                <p className="text-[#c5d0de] mt-2">
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

        <footer className="max-w-6xl mx-auto px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
          <div className="glass rounded-2xl py-8 flex flex-col items-center gap-3 text-[#c5d0de]">
            <Logo className="h-10 w-10" alt="Assistant Bi" />
            <p>Assistant Bi · Dakar · B2B</p>
            <nav className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/legal/confidentialite" className="underline min-h-12 inline-flex items-center">
                Confidentialité
              </Link>
              <Link href="/legal/cgu" className="underline min-h-12 inline-flex items-center">
                CGU
              </Link>
              <Link href="/legal/cgv" className="underline min-h-12 inline-flex items-center">
                CGV
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
