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
  searchParams: Promise<{ q?: string; s?: string }>;
}) {
  const { q = "", s = "" } = await searchParams;
  const m = await controlTowerMetrics();
  const query = q.trim().toLowerCase();
  const tenants = m.tenants.filter((b) => {
    if (s && b.status !== s) return false;
    if (!query) return true;
    return (
      b.name.toLowerCase().includes(query) ||
      b.category.toLowerCase().includes(query) ||
      b.neighborhood.toLowerCase().includes(query) ||
      b.phones.some((p) => p.includes(query.replace(/\s/g, "")))
    );
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Commerces"
        help="Tous les comptes clients du SaaS. Ici vous activez, suspendez, prolongez l’essai. « Voir comme le client » ouvre leur espace, pas cette console."
      />
      <form className="grid sm:grid-cols-[1fr_160px_auto] gap-2">
        <input name="q" defaultValue={q} placeholder="Nom, métier, numéro" className="field" />
        <select name="s" defaultValue={s} className="field">
          <option value="">Tous les statuts</option>
          <option value="trial">Essai</option>
          <option value="active">Actif</option>
          <option value="past_due">Impayé</option>
          <option value="suspended">Suspendu</option>
          <option value="cancelled">Résilié</option>
        </select>
        <button className="btn btn-primary">Filtrer</button>
      </form>
      <p className="text-muted">{tenants.length} commerce{tenants.length > 1 ? "s" : ""}</p>
      <ul className="space-y-3">
        {tenants.map((b) => (
          <li key={b.id} className="card p-4 space-y-3 bg-white">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <div className="text-lg font-bold text-navy">{b.name}</div>
                <div className="text-muted">
                  {b.category} · {b.neighborhood || "quartier —"} · {planLabel(b.plan)} · {statusLabel(b.status)}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
                  <span className="bg-soft rounded-lg px-2 py-1">{b.fichePct} % fiche</span>
                  <span className="bg-soft rounded-lg px-2 py-1">{b.customers} clients</span>
                  <span className="bg-soft rounded-lg px-2 py-1">{b.appointments} RDV</span>
                  <span className="bg-soft rounded-lg px-2 py-1">{b.services} prestations</span>
                  <span className={`rounded-lg px-2 py-1 ${b.handoffs ? "bg-gold text-navy" : "bg-soft"}`}>
                    {b.handoffs} à reprendre
                  </span>
                  <span className={`rounded-lg px-2 py-1 ${b.whatsapp ? "bg-soft" : "bg-gold/20"}`}>
                    {b.whatsapp ? "WhatsApp OK" : "WhatsApp à brancher"}
                  </span>
                </div>
                <div className="text-sm text-muted mt-1">
                  {b.phones.join(" · ") || "pas de numéro"} · maj {formatDateTime(b.updatedAt)}
                </div>
              </div>
              <form action={impersonateBusiness} className="flex flex-col gap-2 min-w-[220px]">
                <input type="hidden" name="businessId" value={b.id} />
                <input name="reason" required minLength={8} placeholder="Motif (min. 8 caractères)" className="field" />
                <button className="btn btn-ghost">Voir comme le client</button>
              </form>
            </div>
            {b.phones[0] && (
              <form action={resetOwnerPin} className="flex flex-wrap gap-2 items-end">
                <input type="hidden" name="phone" value={b.phones[0]} />
                <input name="pin" required minLength={4} placeholder="Nouveau PIN" className="field max-w-[140px]" />
                <button className="btn btn-ghost text-sm">Réinitialiser le PIN</button>
              </form>
            )}
            <div className="flex flex-wrap gap-2">
              {(["active", "past_due", "suspended", "trial"] as const).map((st) => (
                <form key={st} action={setBusinessStatus}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value={st} />
                  <button className="btn btn-ghost text-sm">{statusLabel(st)}</button>
                </form>
              ))}
              <form action={extendTrial}>
                <input type="hidden" name="id" value={b.id} />
                <button className="btn btn-gold text-sm">+7 j essai</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
