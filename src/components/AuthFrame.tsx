import Link from "next/link";
import { BrandLockup } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import type { Lang } from "@/lib/i18n";

export function AuthFrame({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-soft flex flex-col">
      <header className="px-4 py-5 max-w-md mx-auto w-full flex items-center justify-between">
        <Link href="/">
          <BrandLockup className="h-9 max-w-[180px]" />
        </Link>
        <LangToggle lang={lang} />
      </header>
      <main className="flex-1 flex items-start justify-center px-4 pb-10">{children}</main>
    </div>
  );
}
