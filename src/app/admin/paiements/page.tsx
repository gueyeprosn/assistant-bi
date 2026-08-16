import { prisma } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { confirmPayment, rejectPayment } from "@/app/actions/admin";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminPaiementsPage() {
  const payments = await prisma.subscriptionPayment.findMany({
    include: { business: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pending = payments.filter((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paiements"
        help="Wave et Orange Money de tous les commerces. Confirmez pour activer l’abonnement."
      />
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-navy">À confirmer ({pending.length})</h2>
          {pending.map((p) => (
            <div
              key={p.id}
              className="bg-gold/15 border border-gold rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between"
            >
              <div>
                <div className="font-medium">{p.business.name}</div>
                <div className="text-sm text-muted">
                  {formatFcfa(p.amountFcfa)} · {p.channel === "orange_money" ? "Orange Money" : "Wave"} ·{" "}
                  {p.planId} · {p.proof || "sans preuve"} · {formatDateTime(p.createdAt)}
                  {p.createdAt < dayAgo ? " · en retard (> 24 h)" : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <form action={confirmPayment}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn btn-primary">Confirmer</button>
                </form>
                <form action={rejectPayment}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn btn-ghost">Refuser</button>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}
      <section>
        <h2 className="text-xl font-bold text-navy mb-3">Historique</h2>
        <ul className="card divide-y divide-line bg-white">
          {payments.length === 0 && <li className="px-4 py-6 text-muted">Aucun paiement.</li>}
          {payments.map((p) => (
            <li key={p.id} className="px-4 py-3 flex flex-wrap justify-between gap-2">
              <span className="font-semibold">
                {p.business.name} · {formatFcfa(p.amountFcfa)} · {p.status}
              </span>
              <span className="text-muted">{formatDateTime(p.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
