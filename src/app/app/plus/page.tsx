import Link from "next/link";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";
import { logoutAction, logoutEverywhereAction } from "@/app/actions/auth";
import { IconBell, IconBot, IconCard, IconChart, IconQuote } from "@/components/Icons";
import { supportWhatsApp } from "@/lib/metrics";

export default async function PlusPage() {
  const lang = await getLang();
  const wa = supportWhatsApp();
  const items = [
    { href: "/app/fiche", label: t(lang, "bot"), Icon: IconBot },
    { href: "/app/devis", label: t(lang, "quotes"), Icon: IconQuote },
    { href: "/app/relances", label: t(lang, "reminders"), Icon: IconBell },
    { href: "/app/abonnement", label: t(lang, "billing"), Icon: IconCard },
    { href: "/app/stats", label: t(lang, "stats"), Icon: IconChart },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-navy">{t(lang, "moreTitle")}</h1>
        <p className="text-muted mt-1">{t(lang, "moreHelp")}</p>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card flex items-center gap-4 p-4 min-h-16"
          >
            <span className="h-12 w-12 rounded-xl bg-soft text-navy flex items-center justify-center shrink-0">
              <item.Icon />
            </span>
            <span className="text-lg font-bold text-navy">{item.label}</span>
          </Link>
        ))}
        <form action={logoutAction}>
          <button className="btn btn-ghost w-full">{t(lang, "quit")}</button>
        </form>
        <form action={logoutEverywhereAction}>
          <button className="btn btn-ghost w-full">{t(lang, "quitAll")}</button>
        </form>
        <div className="flex flex-wrap gap-3 text-sm text-muted px-1">
          <Link href="/legal/confidentialite" className="underline min-h-12 inline-flex items-center">
            {t(lang, "legalPrivacy")}
          </Link>
          <Link href="/legal/cgu" className="underline min-h-12 inline-flex items-center">
            {t(lang, "legalCgu")}
          </Link>
          <Link href="/legal/cgv" className="underline min-h-12 inline-flex items-center">
            {t(lang, "legalCgv")}
          </Link>
          {wa ? (
            <a
              href={`https://wa.me/${wa.replace(/\D/g, "")}`}
              className="underline min-h-12 inline-flex items-center"
              target="_blank"
              rel="noreferrer"
            >
              {t(lang, "supportWa")}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
