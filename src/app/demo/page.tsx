import Link from "next/link";
import { BrandLockup } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { WhatsAppSimulator } from "@/components/WhatsAppSimulator";
import { prisma } from "@/lib/db";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const lang = await getLang();
  const businesses = await prisma.business.findMany({
    where: { status: { not: "suspended" } },
    select: { slug: true, name: true, neighborhood: true, category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <Link href="/">
          <BrandLockup className="h-9 sm:h-11 max-w-[180px] sm:max-w-[220px]" />
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle lang={lang} />
          <Link href="/login" className="btn btn-ghost">
            {t(lang, "dashPatron")}
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <h1 className="text-3xl font-bold text-navy mb-2">{t(lang, "simTitle")}</h1>
        <p className="text-muted mb-8 max-w-2xl">{t(lang, "simHelp")}</p>
        {businesses.length === 0 ? (
          <p className="text-muted">
            Base vide. Lancez <code>npm run db:reset</code>.
          </p>
        ) : (
          <WhatsAppSimulator initialBusinesses={businesses} />
        )}
      </main>
    </div>
  );
}
