import Link from "next/link";
import { BrandLockup } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { loginAction } from "@/app/actions/auth";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const lang = await getLang();
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-4 py-5 max-w-md mx-auto w-full flex items-center justify-between">
        <Link href="/">
          <BrandLockup className="h-9 max-w-[180px]" />
        </Link>
        <LangToggle lang={lang} />
      </header>
      <main className="flex-1 flex items-start justify-center px-4">
        <form action={loginAction} className="w-full max-w-md card p-6 sm:p-8 space-y-4">
          <h1 className="text-2xl font-bold text-navy">{t(lang, "loginTitle")}</h1>
          <p className="text-muted">{t(lang, "loginHelp")}</p>
          {error && <p className="alert-error">{error}</p>}
          <label className="block font-bold">
            {t(lang, "phone")}
            <input
              name="phone"
              required
              placeholder="77 111 11 11"
              className="field mt-1"
              inputMode="tel"
            />
          </label>
          <label className="block font-bold">
            {t(lang, "pin")}
            <input
              name="pin"
              required
              type="password"
              inputMode="numeric"
              placeholder="••••"
              className="field mt-1"
            />
          </label>
          <button className="btn btn-primary w-full">{t(lang, "enter")}</button>
          <p className="text-sm text-muted">
            77 111 11 11 / 1234 · 77 222 22 22 / 1234
          </p>
        </form>
      </main>
    </div>
  );
}
