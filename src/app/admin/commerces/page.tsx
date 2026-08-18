import Link from "next/link";
import { controlTowerMetrics } from "@/lib/metrics";
import { formatDateTime, planLabel, statusLabel } from "@/lib/format";
import {
  extendTrial,
  impersonateBusiness,
  resetOwnerPin,
  setBusinessStatus,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminCommercesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; s?: string; p?: string }>;
}) {
  const { q = "", s = "", p = "" } = await searchParams;
  const m = await controlTowerMetrics();
  const query = q.trim().toLowerCase();

  const tenants = m.tenants.filter((b) => {
    if (s && b.status !== s) return false;
    if (p && b.plan !== p) return false;
    if (!query) return true;
    return (
      b.name.toLowerCase().includes(query) ||
      b.category.toLowerCase().includes(query) ||
      b.neighborhood.toLowerCase().includes(query) ||
      b.phones.some((phone) => phone.includes(query.replace(/\s/g, "")))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <PageHeader
          title="Commerces & Portefeuille"
          help="Gestion globale des commerces inscrits. Cliquez sur un commerce pour accéder à sa fiche technique détaillée."
        />
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-line text-xs font-bold">
          <span className="text-navy">{tenants.length} affichés</span>
          <span className="text-muted">/ {m.tenants.length} total</span>
        </div>
      </div>

      {/* Filter bar */}
      <form className="card p-3.5 bg-white grid grid-cols-1 sm:grid-cols-[1fr_160px_160px_auto] gap-2.5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher (nom, quartier, 77...)"
          className="field text-sm"
        />
        <select name="s" defaultValue={s} className="field text-sm">
          <option value="">Tous les statuts</option>
          <option value="trial">Essai</option>
          <option value="active">Actif</option>
          <option value="past_due">Impayé</option>
          <option value="suspended">Suspendu</option>
          <option value="cancelled">Résilié</option>
        </select>
        <select name="p" defaultValue={p} className="field text-sm">
          <option value="">Toutes les formules</option>
          <option value="trial">Essai</option>
          <option value="micro">Micro (1 500 F)</option>
          <option value="standard">Standard (3 000 F)</option>
          <option value="pro">Pro (6 000 F)</option>
        </select>
        <button className="btn btn-primary text-sm px-5">Filtrer</button>
      </form>

      {/* Tenants list */}
      <ul className="space-y-3.5">
        {tenants.length === 0 && (
          <li className="card p-8 bg-white text-center text-muted">
            Aucun commerce ne correspond à vos critères de recherche.
          </li>
        )}

        {tenants.map((b) => {
          const mainPhone = b.phones[0] ? b.phones[0].replace(/\D/g, "") : "";
          const waUrl = mainPhone ? `https://wa.me/${mainPhone}` : "";

          return (
            <li key={b.id} className="card p-5 space-y-4 bg-white hover:border-navy/30 transition-all">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Link
                      href={`/admin/commerces/${b.id}`}
                      className="text-lg font-black text-navy hover:underline flex items-center gap-1.5"
                    >
                      {b.name}
                      <span className="text-xs text-muted font-normal">↗</span>
                    </Link>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${
                        b.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.status === "trial"
                            ? "bg-gold/20 text-navy border border-gold/40"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {statusLabel(b.status)}
                    </span>

                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-navy text-white">
                      {planLabel(b.plan)}
                    </span>
                  </div>

                  <div className="text-xs text-muted font-medium">
                    {b.category} · {b.neighborhood || "Quartier —"} · Modifié le {formatDateTime(b.updatedAt)}
                  </div>

                  {/* Badges metrics */}
                  <div className="pt-1 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="bg-soft border border-line rounded-lg px-2.5 py-1 text-navy">
                      📊 {b.fichePct} % fiche
                    </span>
                    <span className="bg-soft border border-line rounded-lg px-2.5 py-1 text-navy">
                      👥 {b.customers} clients
                    </span>
                    <span className="bg-soft border border-line rounded-lg px-2.5 py-1 text-navy">
                      🗓️ {b.appointments} RDV
                    </span>
                    <span className="bg-soft border border-line rounded-lg px-2.5 py-1 text-navy">
                      ✂️ {b.services} prestations
                    </span>
                    {b.handoffs > 0 && (
                      <span className="bg-amber-100 border border-amber-300 text-amber-900 rounded-lg px-2.5 py-1">
                        ⚠️ {b.handoffs} transfert(s)
                      </span>
                    )}
                    <span
                      className={`rounded-lg px-2.5 py-1 ${
                        b.whatsapp
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {b.whatsapp ? "✓ WhatsApp configuré" : "⚡ WhatsApp par défaut"}
                    </span>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/commerces/${b.id}`}
                      className="btn btn-ghost text-xs min-h-9 px-3.5"
                    >
                      Fiche complète
                    </Link>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn bg-[#25D366] hover:bg-[#128C7E] text-white text-xs min-h-9 px-3.5 inline-flex items-center gap-1.5"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                  </div>

                  <form action={impersonateBusiness} className="flex gap-1.5">
                    <input type="hidden" name="businessId" value={b.id} />
                    <input
                      name="reason"
                      required
                      minLength={8}
                      placeholder="Motif d'accès..."
                      className="field text-xs min-h-9 max-w-[150px] py-1"
                    />
                    <button className="btn btn-primary text-xs min-h-9 px-3">
                      Prendre la main
                    </button>
                  </form>
                </div>
              </div>

              {/* Bottom Quick Bar */}
              <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-muted font-medium">
                  Numéros : {b.phones.join(" · ") || "Pas de numéro"}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(["active", "past_due", "suspended", "trial"] as const).map((st) => (
                    <form key={st} action={setBusinessStatus}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="status" value={st} />
                      <button
                        className={`btn text-[11px] min-h-7 px-2 rounded-lg ${
                          b.status === st ? "bg-navy text-white" : "btn-ghost"
                        }`}
                      >
                        {statusLabel(st)}
                      </button>
                    </form>
                  ))}

                  <form action={extendTrial}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="btn btn-gold text-[11px] min-h-7 px-2.5 rounded-lg">
                      +7j essai
                    </button>
                  </form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
