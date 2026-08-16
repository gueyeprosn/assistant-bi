import { prisma } from "@/lib/db";
import { formatDateTime, formatFcfa, planLabel, statusLabel } from "@/lib/format";
import { controlTowerMetrics } from "@/lib/metrics";
import Link from "next/link";
import {
  confirmPayment,
  extendTrial,
  impersonateBusiness,
  rejectPayment,
  resetOwnerPin,
  setBusinessStatus,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { MiniBars } from "@/components/ui/MiniBars";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [payments, audits, m] = await Promise.all([
    prisma.subscriptionPayment.findMany({
      where: { status: "pending" },
      include: { business: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { business: { select: { name: true } } },
    }),
    controlTowerMetrics(),
  ]);

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const alerts: string[] = [];
  if (!m.healthOk) alerts.push("La base ne répond pas.");
  if (m.stalePayments > 0) {
    alerts.push(`${m.stalePayments} paiement${m.stalePayments > 1 ? "s" : ""} en attente depuis plus de 24 h.`);
  }
  if (m.handoffsNow > 0) {
    alerts.push(`${m.handoffsNow} conversation${m.handoffsNow > 1 ? "s" : ""} en attente d’un humain.`);
  }
  if (m.failedToday > 0) {
    alerts.push(`${m.failedToday} message${m.failedToday > 1 ? "s" : ""} WhatsApp non délivré${m.failedToday > 1 ? "s" : ""} aujourd’hui.`);
  }
  if (m.trialsEndingSoon.length > 0) {
    alerts.push(
      `${m.trialsEndingSoon.length} essai${m.trialsEndingSoon.length > 1 ? "s" : ""} se termine${m.trialsEndingSoon.length > 1 ? "nt" : ""} dans 3 jours : ${m.trialsEndingSoon.map((t) => t.name).join(", ")}.`,
    );
  }
  if (m.pastDue > 0) alerts.push(`${m.pastDue} commerce${m.pastDue > 1 ? "s" : ""} impayé${m.pastDue > 1 ? "s" : ""}.`);
  if (m.lockoutToday > 0) alerts.push(`${m.lockoutToday} compte${m.lockoutToday > 1 ? "s" : ""} verrouillé${m.lockoutToday > 1 ? "s" : ""} aujourd’hui.`);
  if (m.webhookFail > 0) alerts.push(`${m.webhookFail} événement${m.webhookFail > 1 ? "s" : ""} WhatsApp non traité${m.webhookFail > 1 ? "s" : ""} (24 h).`);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Pilotage Assistant Bi"
          help="Tout ce qui se passe sur la plateforme, en direct. Rafraîchissez la page pour actualiser."
        />
        <span
          className={`inline-flex items-center min-h-12 px-4 rounded-xl font-bold ${
            m.healthOk ? "bg-soft text-navy" : "bg-gold text-navy"
          }`}
        >
          {m.healthOk ? "Système OK" : "Système en panne"}
        </span>
      </div>

      {alerts.length > 0 && (
        <section className="rounded-2xl border-2 border-gold bg-gold/15 p-4 space-y-2">
          <h2 className="font-bold text-navy">À traiter maintenant</h2>
          <ul className="space-y-1">
            {alerts.map((a) => (
              <li key={a} className="font-medium">
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Aujourd’hui</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard value={String(m.signupsToday)} label="Nouveaux commerces" detail="Inscriptions depuis minuit" />
          <KpiCard value={String(m.inboundToday)} label="Messages reçus" detail={`${m.outboundToday} réponses envoyées`} />
          <KpiCard value={String(m.apptsToday)} label="Rendez-vous du jour" detail="Tous commerces, hors annulés" />
          <KpiCard
            value={String(m.handoffsNow)}
            label="En attente d’un humain"
            detail="Conversations que le bot a transférées"
            warn={m.handoffsNow > 0}
          />
          <KpiCard
            value={String(m.failedToday)}
            label="Messages non délivrés"
            detail={`${m.failedWeek} sur 7 jours`}
            warn={m.failedToday > 0}
          />
          <KpiCard
            value={`${m.loginFailPct} %`}
            label="Échecs de connexion"
            detail={`${m.loginFailToday} refus · ${m.loginOkToday} OK · ${m.lockoutToday} verrouillages`}
            warn={m.lockoutToday > 0}
          />
          <KpiCard value={String(m.webhookDay)} label="Événements WhatsApp 24 h" detail={`${m.webhookFail} non traités`} />
          <KpiCard value={String(m.reminderDue)} label="Rappels encore à envoyer" detail={`${m.reminderPct} % déjà envoyés`} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Argent</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard value={formatFcfa(m.mrr)} label="Revenu mensuel théorique" detail="Somme des formules actives" />
          <KpiCard
            value={formatFcfa(m.pendingAmount)}
            label="En attente de confirmation"
            detail={`${m.pendingCount} paiement${m.pendingCount > 1 ? "s" : ""} Wave / Orange Money`}
            warn={m.stalePayments > 0}
          />
          <KpiCard
            value={formatFcfa(m.confirmedMonthAmount)}
            label="Encaissé ce mois"
            detail={`${m.confirmedMonth} paiement${m.confirmedMonth > 1 ? "s" : ""} confirmé${m.confirmedMonth > 1 ? "s" : ""}`}
          />
          <KpiCard value={String(m.stalePayments)} label="Paiements > 24 h" detail="À confirmer ou refuser" warn={m.stalePayments > 0} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Portefeuille commerces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard value={String(m.businesses)} label="Commerces" detail={`${m.trial} essai · ${m.active} payants`} />
          <KpiCard value={`${m.readyPct} %`} label="Fiches prêtes (≥ 80 %)" detail={`${m.readyCount} sur ${m.businesses}`} />
          <KpiCard value={`${m.conversionPct} %`} label="Essai → payant" detail="Parmi essai + payant + résiliés" />
          <KpiCard value={String(m.churnMonth)} label="Résiliés ce mois" />
          <KpiCard value={String(m.pastDue)} label="Impayés" warn={m.pastDue > 0} />
          <KpiCard value={String(m.suspended)} label="Suspendus" warn={m.suspended > 0} />
          <KpiCard
            value={`${m.waConfigured} / ${m.businesses}`}
            label="WhatsApp branché"
            detail="Clé + code numéro enregistrés"
          />
          <KpiCard value={String(m.cancelled)} label="Résiliés (total)" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Qualité bot & agenda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard value={`${m.handoffPct} %`} label="Taux de transfert humain" detail={`${m.handoffsNow} en cours · ${m.convBot} gérés par le bot`} />
          <KpiCard value={String(m.convResolved)} label="Conversations clôturées" />
          <KpiCard
            value={`${m.noShowRate} %`}
            label="Absents ce mois"
            detail={`${m.monthNoShow} absents · ${m.monthDone} faits · ${m.monthBooked} encore prévus`}
          />
          <KpiCard
            value={formatFcfa(m.quotesAmount)}
            label="Devis ce mois"
            detail={`${m.quotesMonth} devis texte WhatsApp`}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <MiniBars title="Messages reçus, 7 jours" items={m.seriesInbound} caption="Source : base locale · fuseau Dakar" />
        <MiniBars title="Rendez-vous, 7 jours" items={m.seriesAppts} caption="Hors annulés · date du rendez-vous" />
        <MiniBars title="Inscriptions, 7 jours" items={m.seriesSignups} caption="Nouveaux commerces créés" />
      </div>
      <p className="text-sm text-muted">
        7 jours : {m.inboundWeek} messages reçus · {m.apptsWeek} rendez-vous.
      </p>

      {payments.length > 0 && (
        <section className="space-y-3" id="paiements">
          <h2 className="text-xl font-bold text-navy">Paiements à confirmer</h2>
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-gold/15 border border-gold rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between"
            >
              <div>
                <div className="font-medium">{p.business.name}</div>
                <div className="text-sm text-muted">
                  {formatFcfa(p.amountFcfa)} · {p.channel === "orange_money" ? "Orange Money" : "Wave"} ·{" "}
                  {p.proof || "sans preuve"} · {formatDateTime(p.createdAt)}
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

      <section className="space-y-3" id="commerces">
        <h2 className="text-xl font-bold text-navy">Chaque commerce</h2>
        <ul className="space-y-3">
          {m.tenants.map((b) => (
            <li key={b.id} className="card p-4 space-y-3">
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
              {b.phones[0] && (
                <form action={resetOwnerPin} className="flex flex-wrap gap-2 items-end">
                  <input type="hidden" name="phone" value={b.phones[0]} />
                  <input name="pin" required minLength={4} placeholder="Nouveau PIN" className="field max-w-[140px]" />
                  <button className="btn btn-ghost text-sm">Réinitialiser le PIN</button>
                </form>
              )}
              <div className="flex flex-wrap gap-2">
                {(["active", "past_due", "suspended", "trial"] as const).map((s) => (
                  <form key={s} action={setBusinessStatus}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="status" value={s} />
                    <button className="btn btn-ghost text-sm">{statusLabel(s)}</button>
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
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Journal</h2>
        <ul className="card divide-y divide-line">
          {audits.length === 0 && <li className="px-4 py-6 text-muted">Aucune action encore.</li>}
          {audits.map((a) => (
            <li key={a.id} className="px-4 py-3 text-sm">
              <span className="font-bold">{a.action}</span>
              {a.business?.name ? <span className="text-muted"> · {a.business.name}</span> : null}
              <span className="text-muted"> · {formatDateTime(a.createdAt)}</span>
            </li>
          ))}
        </ul>
        <p>
          <Link href="/admin/support" className="font-bold text-navy underline min-h-12 inline-flex items-center">
            Ouvrir le support
          </Link>
        </p>
      </section>
    </div>
  );
}
