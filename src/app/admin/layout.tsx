import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { BrandLockup } from "@/components/Logo";
import { logoutAction } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAdmin();
  if (!ctx) redirect("/login");
  if (ctx.session.impersonating) redirect("/app");
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin">
            <BrandLockup className="h-9 max-w-[200px]" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold text-navy min-h-12 inline-flex items-center">
              Pilotage
            </Link>
            <Link href="/admin/support" className="font-semibold text-navy min-h-12 inline-flex items-center">
              Support
            </Link>
            <form action={logoutAction}>
              <button className="btn btn-ghost min-h-12">Quitter</button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
