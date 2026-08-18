import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatFcfa } from "@/lib/format";
import { controlTowerMetrics } from "@/lib/metrics";
import { llmSpendSnapshot } from "@/lib/llm/budget";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { MiniBars } from "@/components/ui/MiniBars";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [pendingCount, m] = await Promise.all([
    prisma.subscriptionPayment.count({ where: { status: "pending" } }),
    controlTowerMetrics(),
  ]);

  const llm = llmSpendSnapshot();

  const alerts: { href: string; text: string; level: "urgent" | "warning" }[] = [];
  if (!m.healthOk) {
    alerts.push({ href: "/admin/systeme", text: "🚨 La base de données ne répond pas.", level: "urgent" });
  }
  if (m.stalePayments > 0) {
    alerts.push({
      href: "/admin/paiements",
      text: `💳 ${m.stalePayments} paiement(s) en attente depuis plus de 24h.`,
      level: "urgent",
    });
  }
  if (m.handoffsNow > 0) {
    alerts.push({
      href: "/admin/activite",
      text: `💬 ${m.handoffsNow} conversation(s) en attente d’un contact humain.`,
      level: "warning",
    });
  }
  if (m.failedToday > 0) {
    alerts.push({
      href: "/admin/activite",
      text: `⚠️ ${m.failedToday} message(s) WhatsApp non délivré(s) aujourd’hui.`,
      level: "warning",
    });
  }
  if (m.trialsEndingSoon.length > 0) {
    alerts.push({
      href: "/admin/commerces",
      text: `⏳ ${m.trialsEndingSoon.length} période(s) d’essai se terminent dans 3 jours : ${m.trialsEndingSoon.map((t) => t.name).join(", ")}.`,
      level: "warning",
    });
  }
  if (m.pastDue > 0) {
    alerts.push({
      href: "/admin/commerces?s=past_due",
      text: `🔴 ${m.pastDue} commerce(s) en situation d'impayé.`,
      level: "warning",
    });
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Tour de Contrôle SaaS"
          help="Vue globale et pilotage en temps réel de tous les commerces, messages WhatsApp et flux financiers."
        />

        <div className="flex items-center gap-3">
          <div className="card px-3.5 py-1.5 bg-white border border-line flex items-center gap-2 text-xs font-bold">
            <span className={`w-2.5 h-2.5 rounded-full ${m.healthOk ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span>{m.healthOk ? "Système Opérationnel" : "Incident Système"}</span>
          </div>

          <Link
            href="/admin/commerces"
            className="btn btn-primary text-xs min-h-9 px-4 rounded-xl"
          >
            + Gérer commerces
          </Link>
        </div>
      </div>

      {/* Actionable Alerts Banner */}
      {alerts.length > 0 && (
        <section className="card p-4.5 bg-amber-500/10 border-2 border-amber-500/40 space-y-2.5 rounded-2xl">
          <div className="flex items-center gap-2 font-black text-navy text-sm">
            <span>⚡</span>
            <span>Actions prioritaires requises ({alerts.length})</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs">
            {alerts.map((a) => (
              <li key={a.text}>
                <Link
                  href={a.href}
                  className="p-2.5 rounded-xl bg-white border border-amber-300 hover:border-navy font-bold text-navy flex items-center justify-between transition-colors group"
                >
                  <span className="truncate pr-2">{a.text}</span>
                  <span className="text-muted group-hover:text-navy shrink-0">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Financial Overview */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-black text-navy uppercase tracking-wider text-xs">
            💰 Revenus & Flux Financiers (FCFA)
          </h2>
          <div className="flex items-center gap-3">
            <a
              href="/api/admin/export-payments"
              download
              className="text-xs font-bold text-navy hover:underline"
            >
              📥 Export CSV
            </a>
            <Link href="/admin/paiements" className="text-xs font-bold text-navy underline">
              Voir tous les paiements →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard
            value={formatFcfa(m.mrr)}
            label="MRR (Revenu mensuel récurrent)"
            detail="Sur les formules actives"
          />
          <KpiCard
            value={formatFcfa(m.confirmedMonthAmount)}
            label="Encaissé ce mois-ci"
            detail={`${m.confirmedMonth} paiements validés`}
          />
          <KpiCard
            value={formatFcfa(m.pendingAmount)}
            label="À confirmer (Wave / OM)"
            detail={`${pendingCount} en attente`}
            warn={m.stalePayments > 0}
            href="/admin/paiements"
          />
          <KpiCard
            value={formatFcfa(m.quotesAmount)}
            label="Volume Devis ce mois"
            detail={`${m.quotesMonth} devis émis`}
          />
        </div>
      </section>

      {/* Portfolio & Growth */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-black text-navy uppercase tracking-wider text-xs">
            🏢 Portefeuille Clients & Conversion
          </h2>
          <Link href="/admin/commerces" className="text-xs font-bold text-navy underline">
            Tous les commerces ({m.businesses}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard
            value={String(m.businesses)}
            label="Total Commerces"
            detail={`${m.active} payants · ${m.trial} en essai`}
            href="/admin/commerces"
          />
          <KpiCard
            value={`${m.conversionPct} %`}
            label="Taux de conversion essai"
            detail="Conversion vers formule payante"
          />
          <KpiCard
            value={`${m.readyPct} %`}
            label="Fiches prêtes (≥ 80%)"
            detail={`${m.readyCount} / ${m.businesses} commerces`}
            href="/admin/support"
          />
          <KpiCard
            value={`$${llm.spentUsd.toFixed(2)}`}
            label="Coût IA ce mois (USD)"
            detail={`Sur plafond de $${llm.limitUsd}`}
            href="/admin/systeme"
          />
        </div>
      </section>

      {/* Live Operations & Quality */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-black text-navy uppercase tracking-wider text-xs">
            📊 Activité & Qualité Aujourd’hui
          </h2>
          <Link href="/admin/activite" className="text-xs font-bold text-navy underline">
            Supervision live →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard
            value={String(m.inboundToday)}
            label="Messages reçus aujourd'hui"
            detail={`${m.outboundToday} réponses envoyées`}
            href="/admin/activite"
          />
          <KpiCard
            value={String(m.apptsToday)}
            label="RDV confirmés aujourd'hui"
            detail="Tous commerces confondus"
          />
          <KpiCard
            value={`${m.handoffPct} %`}
            label="Taux de transfert humain"
            detail={`${m.convBot} gérés à 100% par le bot`}
            warn={m.handoffsNow > 0}
            href="/admin/activite"
          />
          <KpiCard
            value={String(m.failedToday)}
            label="Erreurs d'envoi WhatsApp"
            detail={`${m.failedWeek} sur 7 jours`}
            warn={m.failedToday > 0}
            href="/admin/activite"
          />
        </div>
      </section>

      {/* 7 Days Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <MiniBars title="Messages reçus (7 jours)" items={m.seriesInbound} caption="Toute la plateforme" />
        <MiniBars title="Rendez-vous créés (7 jours)" items={m.seriesAppts} caption="Hors annulations" />
        <MiniBars title="Nouveaux commerces (7 jours)" items={m.seriesSignups} caption="Inscriptions" />
      </div>
    </div>
  );
}
