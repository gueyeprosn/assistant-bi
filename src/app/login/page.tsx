import Link from "next/link";
import { AuthFrame } from "@/components/AuthFrame";
import { loginAction } from "@/app/actions/auth";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; vue?: string }>;
}) {
  const { error, vue } = await searchParams;
  const lang = await getLang();
  const adminVue = vue === "admin";
  return (
    <AuthFrame lang={lang}>
      <form action={loginAction} className="w-full max-w-md card p-6 sm:p-8 space-y-4">
        <h1 className="text-2xl font-bold text-navy">
          {adminVue ? "Console SaaS" : t(lang, "loginTitle")}
        </h1>
        <p className="text-muted">
          {adminVue
            ? "Réservé à l’opérateur Assistant Bi. Ce n’est pas l’espace d’un commerce."
            : t(lang, "loginHelp")}
        </p>
        {error && <p className="alert-error">{error}</p>}
        <label className="block font-bold">
          {t(lang, "phone")}
          <input
            name="phone"
            required
            placeholder={adminVue ? "77 000 00 00" : "77 111 11 11"}
            className="field mt-1"
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
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
            autoComplete="current-password"
          />
        </label>
        <button className="btn btn-primary w-full">{t(lang, "enter")}</button>
        {adminVue ? null : (
          <p className="text-center">
            <Link href="/inscription" className="font-bold text-navy underline min-h-12 inline-flex items-center">
              {t(lang, "noAccount")} {t(lang, "signup")}
            </Link>
          </p>
        )}
        <p className="text-center text-sm">
          {adminVue ? (
            <Link href="/login" className="text-muted underline min-h-12 inline-flex items-center">
              Espace professionnel (client)
            </Link>
          ) : (
            <Link href="/login?vue=admin" className="text-muted underline min-h-12 inline-flex items-center">
              Console SaaS (opérateur)
            </Link>
          )}
        </p>
      </form>
    </AuthFrame>
  );
}
