import Link from "next/link";
import { AuthFrame } from "@/components/AuthFrame";
import { signupAction } from "@/app/actions/auth";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const lang = await getLang();
  return (
    <AuthFrame lang={lang}>
      <form action={signupAction} className="w-full max-w-md card p-6 sm:p-8 space-y-4">
        <h1 className="text-2xl font-bold text-navy">{t(lang, "signupTitle")}</h1>
        <p className="text-muted">{t(lang, "signupHelp")}</p>
        {error && <p className="alert-error">{error}</p>}
        <label className="block font-bold">
          {t(lang, "shopName")}
          <input name="businessName" required minLength={2} className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "yourName")}
          <input name="ownerName" required minLength={2} className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "category")}
          <select name="category" required className="field mt-1">
            <option value="salon">{t(lang, "catSalon")}</option>
            <option value="garage">{t(lang, "catGarage")}</option>
            <option value="artisan">{t(lang, "catArtisan")}</option>
            <option value="infirmier">{t(lang, "catNurse")}</option>
            <option value="autre">{t(lang, "catOther")}</option>
          </select>
        </label>
        <label className="block font-bold">
          {t(lang, "neighborhood")}
          <input name="neighborhood" className="field mt-1" />
        </label>
        <label className="block font-bold">
          {t(lang, "phone")}
          <input
            name="phone"
            required
            placeholder="77 111 11 11"
            className="field mt-1"
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
        <label className="block font-bold">
          {t(lang, "pin")}
          <span className="block font-normal text-muted text-base">{t(lang, "pinHelp")}</span>
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
        <button className="btn btn-primary w-full">{t(lang, "signup")}</button>
        <p className="text-center">
          <Link href="/login" className="font-bold text-navy underline min-h-12 inline-flex items-center">
            {t(lang, "haveAccount")}
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
