import { prisma } from "@/lib/db";
import { formatDateTime, formatFcfa, planLabel, statusLabel } from "@/lib/format";
import { adminProductMetrics } from "@/lib/metrics";
import {
  confirmPayment,
  extendTrial,
  impersonateBusiness,
  rejectPayment,
  resetOwnerPin,
  setBusinessStatus,
} from "@/app/actions/admin";

export default async function AdminHome() {
  const [businesses, payments, audits, metrics] = await Promise.all([
    prisma.business.findMany({
      include: {
        _count: { select: { appointments: true, customers: true } },
        users: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscriptionPayment.findMany({
      where: { status: "pending" },
      include: { business: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    adminProductMetrics(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-navy">Commerces</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-3">
          <div className="text-2xl font-bold">{metrics.businesses}</div>
          <div className="text-muted text-sm">Commerces</div>
        </div>
        <div className="card p-3">
          <div className="text-2xl font-bold">{metrics.readyPct} %</div>
          <div className="text-muted text-sm">Fiches ≥ 80 %</div>
        </div>
        <div className="card p-3">
          <div className="text-2xl font-bold">{metrics.conversionPct} %</div>
          <div className="text-muted text-sm">Essai → payant</div>
        </div>
        <div className="card p-3">
          <div className="text-2xl font-bold">{metrics.handoffPct} %</div>
          <div className="text-muted text-sm">Transferts humain</div>
        </div>
        <div className="card p-3">
          <div className="text-2xl font-bold">{metrics.churnMonth}</div>
          <div className="text-muted text-sm">Résiliés ce mois</div>
        </div>
        <div className="card p-3">
          <div className="text-2xl font-bold">{metrics.stalePayments}</div>
          <div className="text-muted text-sm">Paiements &gt; 24 h</div>
        </div>
      </div>

      {payments.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-navy">Paiements à confirmer</h2>
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-gold/15 border border-gold rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between"
            >
              <div>
                <div className="font-medium">{p.business.name}</div>
                <div className="text-sm text-muted">
                  {formatFcfa(p.amountFcfa)} · {p.channel} · {p.proof || "sans preuve"} ·{" "}
                  {formatDateTime(p.createdAt)}
                </div>
              </div>
              <div className="flex gap-2">
                <form action={confirmPayment}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn btn-primary">
                    Confirmer
                  </button>
                </form>
                <form action={rejectPayment}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn btn-ghost">
                    Refuser
                  </button>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      <ul className="space-y-3">
        {businesses.map((b) => (
          <li key={b.id} className="card p-4 space-y-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <div className="text-lg font-bold text-navy">{b.name}</div>
                <div className="text-sm text-muted">
                  {b.neighborhood} · {planLabel(b.plan)} · {statusLabel(b.status)} ·{" "}
                  {b._count.customers} clients · {b._count.appointments} RDV
                </div>
                <div className="text-xs text-muted mt-1">
                  {b.users.map((u) => u.phone).join(" · ")}
                </div>
              </div>
              <form action={impersonateBusiness} className="flex flex-col gap-2 min-w-[220px]">
                <input type="hidden" name="businessId" value={b.id} />
                <input
                  name="reason"
                  required
                  minLength={8}
                  placeholder="Motif (min. 8 caractères)"
                  className="field"
                />
                <button className="btn btn-ghost">Ouvrir le dashboard</button>
              </form>
            </div>
            {b.users[0] && (
              <form action={resetOwnerPin} className="flex flex-wrap gap-2 items-end">
                <input type="hidden" name="phone" value={b.users[0].phone} />
                <input
                  name="pin"
                  required
                  minLength={4}
                  placeholder="Nouveau PIN"
                  className="field max-w-[140px]"
                />
                <button className="btn btn-ghost text-sm">Réinitialiser le PIN</button>
              </form>
            )}
            <div className="flex flex-wrap gap-2">
              {(["active", "past_due", "suspended", "trial"] as const).map((s) => (
                <form key={s} action={setBusinessStatus}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value={s} />
                  <button className="btn btn-ghost text-sm">
                    {statusLabel(s)}
                  </button>
                </form>
              ))}
              <form action={extendTrial}>
                <input type="hidden" name="id" value={b.id} />
                <button className="btn btn-gold text-sm">
                  +7 j essai
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Journal</h2>
        <ul className="card divide-y divide-line">
          {audits.length === 0 && <li className="px-4 py-6 text-muted">Aucune action encore.</li>}
          {audits.map((a) => (
            <li key={a.id} className="px-4 py-3 text-sm">
              <span className="font-bold">{a.action}</span>
              <span className="text-muted"> · {formatDateTime(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
