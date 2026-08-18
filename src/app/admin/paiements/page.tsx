import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime, formatFcfa, planLabel } from "@/lib/format";
import { confirmPayment, rejectPayment } from "@/app/actions/admin";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminPaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s = "" } = await searchParams;

  const payments = await prisma.subscriptionPayment.findMany({
    where: s ? { status: s } : {},
    include: {
      business: { select: { id: true, name: true, ownerPhone: true } },
      confirmedBy: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [confirmedMonthSum, pendingSum, pendingCount, allCount] = await Promise.all([
    prisma.subscriptionPayment.aggregate({
      _sum: { amountFcfa: true },
      where: { status: "confirmed", createdAt: { gte: startOfMonth } },
    }),
    prisma.subscriptionPayment.aggregate({
      _sum: { amountFcfa: true },
      where: { status: "pending" },
    }),
    prisma.subscriptionPayment.count({ where: { status: "pending" } }),
    prisma.subscriptionPayment.count(),
  ]);

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pendingPayments = payments.filter((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Paiements & Abonnements"
          help="Gestion des transactions Wave et Orange Money. Confirmez pour activer ou renouveler automatiquement le compte d'un commerce."
        />

        <a
          href="/api/admin/export-payments"
          download
          className="btn btn-ghost text-xs min-h-10 px-4 inline-flex items-center gap-2"
        >
          📥 Exporter en CSV (Excel)
        </a>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="card p-4 bg-white border-l-4 border-l-emerald-500">
          <div className="text-2xl font-black text-navy">
            {formatFcfa(confirmedMonthSum._sum.amountFcfa || 0)}
          </div>
          <div className="text-xs font-bold text-muted uppercase mt-1">
            Encaissé ce mois-ci
          </div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-gold">
          <div className="text-2xl font-black text-navy">
            {formatFcfa(pendingSum._sum.amountFcfa || 0)}
          </div>
          <div className="text-xs font-bold text-muted uppercase mt-1">
            En attente ({pendingCount} paiements)
          </div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-navy">
          <div className="text-2xl font-black text-navy">{allCount}</div>
          <div className="text-xs font-bold text-muted uppercase mt-1">
            Total transactions enregistrées
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-2">
        {[
          { key: "", label: `Tous (${allCount})` },
          { key: "pending", label: `En attente (${pendingCount})` },
          { key: "confirmed", label: "Confirmés" },
          { key: "rejected", label: "Refusés" },
        ].map((tab) => {
          const active = s === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/paiements${tab.key ? `?s=${tab.key}` : ""}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white text-muted hover:text-navy border border-line"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Pending section if any and not filtered away */}
      {(!s || s === "pending") && pendingPayments.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold animate-ping" />
            Transactions à valider en priorité ({pendingPayments.length})
          </h2>

          <div className="space-y-3">
            {pendingPayments.map((p) => {
              const isLate = p.createdAt < dayAgo;
              const cleanPhone = (p.business.ownerPhone || "").replace(/\D/g, "");
              const waUrl = cleanPhone
                ? `https://wa.me/${cleanPhone}?text=Bonjour%20${encodeURIComponent(
                    p.business.name
                  )},%20concernant%20votre%20paiement%20Assistant%20Bi%20de%20${p.amountFcfa}%20FCFA...`
                : "";

              return (
                <div
                  key={p.id}
                  className={`card p-4.5 bg-white border-2 flex flex-wrap gap-4 items-center justify-between transition-all ${
                    isLate
                      ? "border-amber-400 bg-amber-50/20"
                      : "border-gold/60 bg-gold/5"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/commerces/${p.business.id}`}
                        className="font-black text-navy text-base hover:underline"
                      >
                        {p.business.name}
                      </Link>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-navy text-white">
                        {planLabel(p.planId)}
                      </span>
                      {isLate && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-800">
                          En attente &gt; 24h
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted font-medium">
                      Montant : <span className="font-bold text-navy">{formatFcfa(p.amountFcfa)}</span> ·
                      Opérateur :{" "}
                      <span className="font-bold">
                        {p.channel === "orange_money" ? "Orange Money" : "Wave"}
                      </span>{" "}
                      · Réf :{" "}
                      <span className="font-mono bg-soft px-1.5 py-0.5 rounded">
                        {p.reference || p.proof || "Sans référence"}
                      </span>
                    </div>

                    <div className="text-xs text-muted">
                      Soumis le {formatDateTime(p.createdAt)} · Contact patron : {p.business.ownerPhone}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn bg-[#25D366] hover:bg-[#128C7E] text-white text-xs min-h-9 px-3"
                      >
                        Contacter WhatsApp
                      </a>
                    )}
                    <form action={confirmPayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn btn-primary text-xs min-h-9 px-4">
                        ✓ Confirmer le paiement
                      </button>
                    </form>
                    <form action={rejectPayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn btn-ghost text-xs min-h-9 px-3 text-destructive border-destructive/40">
                        ✕ Refuser
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* History table */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-navy">Historique des transactions</h2>
        <div className="card overflow-hidden bg-white border border-line">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-soft border-b border-line text-muted font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Commerce</th>
                  <th className="p-3">Formule</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Canal</th>
                  <th className="p-3">Référence</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Validé par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted">
                      Aucune transaction trouvée pour ce filtre.
                    </td>
                  </tr>
                )}
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-soft/50">
                    <td className="p-3 text-muted">{formatDateTime(p.createdAt)}</td>
                    <td className="p-3 font-bold text-navy">
                      <Link href={`/admin/commerces/${p.business.id}`} className="hover:underline">
                        {p.business.name}
                      </Link>
                    </td>
                    <td className="p-3 font-medium">{planLabel(p.planId)}</td>
                    <td className="p-3 font-bold text-navy">{formatFcfa(p.amountFcfa)}</td>
                    <td className="p-3">
                      <span className="font-semibold">
                        {p.channel === "orange_money" ? "Orange Money" : "Wave"}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-muted">{p.reference || p.proof || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "pending"
                              ? "bg-gold/20 text-navy border border-gold/50"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {p.status === "confirmed"
                          ? "Confirmé"
                          : p.status === "pending"
                            ? "En attente"
                            : "Refusé"}
                      </span>
                    </td>
                    <td className="p-3 text-muted">
                      {p.confirmedBy?.name || p.confirmedBy?.phone || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
