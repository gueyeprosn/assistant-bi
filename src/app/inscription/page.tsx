import { AuthFrame } from "@/components/AuthFrame";
import { SignupFicheForm } from "@/components/SignupFicheForm";
import { getLang } from "@/lib/lang";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const lang = await getLang();
  return (
    <AuthFrame lang={lang} wide>
      <SignupFicheForm lang={lang} error={error} />
    </AuthFrame>
  );
}
