import { getLang } from "@/app/actions/lang";
import { LandingView } from "@/components/landing/LandingView";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const lang = await getLang();
  return <LandingView lang={lang} />;
}
