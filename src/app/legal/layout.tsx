import Link from "next/link";
import { BrandLockup } from "@/components/Logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-navy">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="min-h-12 inline-flex items-center">
            <BrandLockup className="h-9 max-w-[200px]" />
          </Link>
          <Link href="/" className="font-bold min-h-12 inline-flex items-center">
            Accueil
          </Link>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-4 py-10 prose-legal space-y-4">{children}</article>
    </div>
  );
}
