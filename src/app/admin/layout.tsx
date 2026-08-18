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
    <div className="min-h-screen bg-[#f8fafc] text-ink">
      <header className="bg-navy text-white sticky top-0 z-30 shadow-md border-b border-navy-2">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin" className="flex items-center gap-2.5 min-w-0 group">
              <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold flex items-center justify-center text-gold font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
                AB
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-gold">Console SaaS</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <span className="block text-base font-bold leading-tight truncate">
                  Assistant Bi — Opérateur
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{ctx.user.name || "Administrateur"}</span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="btn border border-white/20 hover:border-white text-white/90 hover:text-white bg-white/5 hover:bg-white/10 text-xs min-h-9 px-3.5 rounded-xl transition-all"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-4 py-1.5 text-xs text-center font-bold flex items-center justify-center gap-2">
        <span>🔒 Espace d'administration centralisé</span>
        <span className="hidden sm:inline">· Toutes les modifications impactent directement la plateforme en production</span>
      </div>

      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-[240px_minmax(0,1fr)] min-h-[calc(100vh-5rem)]">
        <AdminNav />
        <main className="p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}

