"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { endImpersonation } from "@/app/actions/admin";
import { Logo } from "./Logo";
import { LangToggle } from "./LangToggle";
import { IconCalendar, IconChat, IconHome, IconMore } from "./Icons";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { AssistantConnectionStatus } from "@/lib/whatsapp/status";
import { Toast } from "./ui/Toast";

export function AppShell({
  children,
  businessName,
  impersonating,
  lang,
  waStatus,
}: {
  children: React.ReactNode;
  businessName: string;
  impersonating?: boolean;
  lang: Lang;
  waStatus?: AssistantConnectionStatus;
}) {
  const path = usePathname();
  const tabs = [
    { href: "/app", label: t(lang, "home"), Icon: IconHome },
    { href: "/app/calendrier", label: t(lang, "agenda"), Icon: IconCalendar },
    { href: "/app/messages", label: t(lang, "messages"), Icon: IconChat },
    { href: "/app/plus", label: t(lang, "more"), Icon: IconMore },
  ];

  return (
    <div className="min-h-screen bg-white">
      {impersonating && (
        <div className="bg-gold text-navy text-center text-sm py-2 px-3 font-semibold">
          <form action={endImpersonation}>
            <button type="submit" className="underline min-h-12">
              {t(lang, "impersonate")}
            </button>
          </form>
        </div>
      )}
      <header className="border-b border-line bg-white sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/app" className="flex items-center gap-2 min-w-0">
            <Logo className="h-8 w-8 shrink-0" />
            <span className="truncate">
              <span className="block text-sm font-bold leading-tight text-navy">Assistant Bi</span>
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-muted truncate">{businessName}</span>
                {waStatus ? (
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      waStatus === "connected" ? "bg-success" : "bg-muted"
                    }`}
                    aria-hidden
                  />
                ) : null}
              </span>
            </span>
          </Link>
          {waStatus ? (
            <span
              className={`badge shrink-0 hidden sm:inline-flex ${
                waStatus === "connected" ? "bg-success-bg text-success" : "bg-soft text-muted"
              }`}
            >
              {waStatus === "connected" ? t(lang, "waStatusActive") : t(lang, "waStatusDemo")}
            </span>
          ) : null}
          <div className="flex items-center gap-2">
            <LangToggle lang={lang} />
            <form action={logoutAction} className="hidden sm:block">
              <button className="text-sm font-semibold text-muted min-h-12 px-2 cursor-pointer">
                {t(lang, "quit")}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-5 pb-28">{children}</main>
      <Suspense fallback={null}>
        <Toast lang={lang} />
      </Suspense>
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-line z-20">
        <div className="max-w-3xl mx-auto grid grid-cols-4">
          {tabs.map((l) => {
            const plusActive = [
              "/app/plus",
              "/app/fiche",
              "/app/devis",
              "/app/relances",
              "/app/abonnement",
              "/app/stats",
              "/app/parametres",
            ].some((p) => path === p || path.startsWith(`${p}/`));
            const active =
              l.href === "/app"
                ? path === "/app"
                : l.href === "/app/plus"
                  ? plusActive
                  : path === l.href || path.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex flex-col items-center justify-center min-h-16 gap-0.5 text-[12px] font-bold ${
                  active ? "text-navy" : "text-muted"
                }`}
              >
                <l.Icon className="h-6 w-6" />
                <span>{l.label}</span>
                {active && <span className="h-1 w-8 rounded-full bg-gold" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
