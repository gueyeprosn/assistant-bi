import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatFcfa } from "@/lib/format";
import { controlTowerMetrics } from "@/lib/metrics";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { MiniBars } from "@/components/ui/MiniBars";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [pendingCount, m] = await Promise.all([
    prisma.subscriptionPayment.count({ where: { status: "pending" } }),
    controlTowerMetrics(),
  ]);

  const alerts: { href: string; text: string }[] = [];
  if (!m.healthOk) alerts.push({ href: "/admin/systeme", text: "La base ne répond pas." });
  if (m.stalePayments > 0) {
    alerts.push({
      href: "/admin/paiements",
      text: `${m.stalePayments} paiement${m.stalePayments > 1 ? "s" : ""} en attente depuis plus de 24 h.`,
    });
  }
  if (m.handoffsNow > 0) {
    alerts.push({
      href: "/admin/activite",
      text: `${m.handoffsNow} conversation${m.handoffsNow > 1 ? "s" : ""} en attente d’un humain.`,
    });
  }
  if (m.failedToday > 0) {
    alerts.push({
      href: "/admin/activite",
      text: `${m.failedToday} message${m.failedToday > 1 ? "s" : ""} WhatsApp non délivré${m.failedToday > 1 ? "s" : ""} aujourd’hui.`,
    });
  }
  if (m.trialsEndingSoon.length > 0) {
    alerts.push({
      href: "/admin/commerces",
      text: `${m.trialsEndingSoon.length} essai${m.trialsEndingSoon.length > 1 ? "s" : ""} finissent dans 3 jours : ${m.trialsEndingSoon.map((t) => t.name).join(", ")}.`,
    });
  }
  if (m.pastDue > 0) {
    alerts.push({ href: "/admin/commerces", text: `${m.pastDue} commerce${m.pastDue > 1 ? "s" : ""} impayé${m.pastDue > 1 ? "s" : ""}.` });
  }
  if (m.lockoutToday > 0) {
    alerts.push({ href: "/admin/journal", text: `${m.lockoutToday} compte${m.lockoutToday > 1 ? "s" : ""} verrouillé${m.lockoutToday > 1 ? "s" : ""} aujourd’hui.` });
  }
  if (m.webhookFail > 0) {
    alerts.push({ href: "/admin/systeme", text: `${m.webhookFail} événement${m.webhookFail > 1 ? "s" : ""} WhatsApp non traité${m.webhookFail > 1 ? "s" : ""} (24 h).` });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Contrôle de la plateforme"
          help="Chiffres de tout le SaaS : tous les commerces, tous les messages, tous les paiements."
        />
        <span className={`inline-flex items-center min-h-12 px-4 rounded-xl font-bold ${m.healthOk ? "bg-white text-navy" : "bg-gold text-navy"}`}>
          {m.healthOk ? "Système OK" : "Système en panne"}
        </span>
      </div>

      {alerts.length > 0 && (
        <section className="rounded-2xl border-2 border-gold bg-gold/15 p-4 space-y-2">
          <h2 className="font-bold text-navy">À traiter maintenant</h2>
          <ul className="space-y-1">
            {alerts.map((a) => (
              <li key={a.text}>
                <Link href={a.href} className="font-medium underline min-h-12 inline-flex items-center">
                  {a.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Aujourd’hui (toute la plateforme)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard value={String(m.signupsToday)} label="Nouveaux commerces" href="/admin/commerces" />
          <KpiCard value={String(m.inboundToday)} label="Messages reçus" detail={`${m.outboundToday} envoyés`} href="/admin/activite" />
          <KpiCard value={String(m.apptsToday)} label="Rendez-vous" detail="Tous commerces, hors annulés" />
          <KpiCard value={String(m.handoffsNow)} label="Transferts humains" warn={m.handoffsNow > 0} href="/admin/activite" />
          <KpiCard value={String(m.failedToday)} label="Messages non délivrés" detail={`${m.failedWeek} / 7 j`} warn={m.failedToday > 0} href="/admin/activite" />
          <KpiCard
            value={`${m.loginFailPct} %`}
            label="Échecs de connexion"
            detail={`${m.loginFailToday} refus · ${m.lockoutToday} verrouillages`}
            warn={m.lockoutToday > 0}
            href="/admin/journal"
          />
          <KpiCard value={String(m.webhookDay)} label="Webhooks WhatsApp 24 h" detail={`${m.webhookFail} non traités`} href="/admin/systeme" />
          <KpiCard value={String(m.reminderDue)} label="Rappels encore à envoyer" detail={`${m.reminderPct} % déjà envoyés`} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-navy">Argent</h2>
          <Link href="/admin/paiements" className="font-bold text-navy underline min-h-12 inline-flex items-center">
            Tous les paiements
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard value={formatFcfa(m.mrr)} label="Revenu mensuel théorique" detail="Formules actives" />
          <KpiCard value={formatFcfa(m.pendingAmount)} label="À confirmer" detail={`${pendingCount} Wave / Orange Money`} warn={m.stalePayments > 0} href="/admin/paiements" />
          <KpiCard value={formatFcfa(m.confirmedMonthAmount)} label="Encaissé ce mois" detail={`${m.confirmedMonth} confirmé${m.confirmedMonth > 1 ? "s" : ""}`} />
          <KpiCard value={String(m.stalePayments)} label="Paiements > 24 h" warn={m.stalePayments > 0} href="/admin/paiements" />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-navy">Portefeuille</h2>
          <Link href="/admin/commerces" className="font-bold text-navy underline min-h-12 inline-flex items-center">
            Gérer les commerces
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard value={String(m.businesses)} label="Commerces" detail={`${m.trial} essai · ${m.active} payants`} href="/admin/commerces" />
          <KpiCard value={`${m.readyPct} %`} label="Fiches prêtes (≥ 80 %)" detail={`${m.readyCount} / ${m.businesses}`} />
          <KpiCard value={`${m.conversionPct} %`} label="Essai → payant" />
          <KpiCard value={String(m.churnMonth)} label="Résiliés ce mois" />
          <KpiCard value={String(m.pastDue)} label="Impayés" warn={m.pastDue > 0} href="/admin/commerces" />
          <KpiCard value={String(m.suspended)} label="Suspendus" warn={m.suspended > 0} href="/admin/commerces" />
          <KpiCard value={`${m.waConfigured} / ${m.businesses}`} label="WhatsApp branché" />
          <KpiCard value={String(m.cancelled)} label="Résiliés (total)" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Qualité globale</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard value={`${m.handoffPct} %`} label="Taux de transfert humain" detail={`${m.convBot} gérés par le bot`} href="/admin/activite" />
          <KpiCard value={String(m.convResolved)} label="Conversations clôturées" />
          <KpiCard value={`${m.noShowRate} %`} label="Absents ce mois" detail={`${m.monthNoShow} absents · ${m.monthDone} faits`} />
          <KpiCard value={formatFcfa(m.quotesAmount)} label="Devis ce mois" detail={`${m.quotesMonth} devis`} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <MiniBars title="Messages reçus, 7 jours" items={m.seriesInbound} caption="Toute la plateforme" />
        <MiniBars title="Rendez-vous, 7 jours" items={m.seriesAppts} caption="Hors annulés" />
        <MiniBars title="Inscriptions, 7 jours" items={m.seriesSignups} caption="Nouveaux commerces" />
      </div>
    </div>
  );
}
