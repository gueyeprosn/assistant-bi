import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAdmin();
  if (!ctx) redirect("/login?vue=admin");
  if (ctx.session.impersonating) redirect("/app");
  return (
    <div className="min-h-screen bg-soft">
      <header className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/admin" className="min-w-0">
            <span className="block text-xs font-bold tracking-wide text-gold uppercase">Console SaaS</span>
            <span className="block text-lg font-bold leading-tight truncate">Assistant Bi — opérateur</span>
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn border-2 border-white text-white bg-transparent min-h-12">
              Quitter
            </button>
          </form>
        </div>
      </header>
      <p className="bg-gold text-navy text-center font-semibold px-4 py-2">
        Espace interne. Ce n’est pas le tableau de bord d’un client.
      </p>
      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
        <AdminNav />
        <main className="px-4 py-6 pb-16">{children}</main>
      </div>
    </div>
  );
}
