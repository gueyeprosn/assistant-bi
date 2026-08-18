import { checkHealth } from "@/lib/health";
import { saasFlags } from "@/lib/saas-flags";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { llmSpendSnapshot } from "@/lib/llm/budget";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

function FlagCard({ ok, label, desc }: { ok: boolean; label: string; desc?: string }) {
  return (
    <div
      className={`card p-4 bg-white border-l-4 transition-all ${
        ok ? "border-l-emerald-500" : "border-l-amber-500 bg-amber-50/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted uppercase">{label}</span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
            ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {ok ? "✓ Opérationnel" : "⚠️ Non configuré"}
        </span>
      </div>
      {desc && <div className="text-xs text-muted mt-1.5">{desc}</div>}
    </div>
  );
}

export default async function AdminSystemePage() {
  const [health, flags, lastWebhook, lastPayment, llmEventsCount] = await Promise.all([
    checkHealth().catch(() => ({ ok: false as const, service: "assistant-bi" })),
    Promise.resolve(saasFlags()),
    prisma.webhookEvent.findFirst({ orderBy: { receivedAt: "desc" } }),
    prisma.subscriptionPayment.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.auditLog.count({ where: { action: "llm_call" } }),
  ]);

  const llm = llmSpendSnapshot();
  const pct = Math.min(100, Math.round((llm.spentUsd / llm.limitUsd) * 100));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Système & Monitoring IA"
        help="Surveillance des composants techniques, de la santé de la base de données, des webhooks Meta et de la consommation du budget IA."
      />

      {/* LLM Budget Card */}
      <div className="card p-5 bg-white space-y-4 border border-line">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h2 className="text-lg font-black text-navy flex items-center gap-2">
              <span>🤖</span>
              Budget & Consommation OpenAI (gpt-4o-mini & whisper)
            </h2>
            <p className="text-xs text-muted">
              Plafond mensuel de sécurité défini dans LLM_MONTHLY_LIMIT_USD.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-navy">
              ${llm.spentUsd.toFixed(3)}{" "}
              <span className="text-sm font-normal text-muted">/ ${llm.limitUsd} USD</span>
            </div>
            <div className="text-xs font-bold text-muted">
              Mois : {llm.monthKey} · {llmEventsCount} appels tracés
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-soft rounded-full h-3.5 overflow-hidden border border-line p-0.5">
            <div
              className={`h-full rounded-full transition-all ${
                pct > 80
                  ? "bg-red-500"
                  : pct > 50
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-muted">
            <span>{pct}% utilisé</span>
            <span>Reste ${(llm.limitUsd - llm.spentUsd).toFixed(3)} USD</span>
          </div>
        </div>
      </div>

      {/* Services Health Matrix */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-navy">Indicateurs de Santé des Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <FlagCard ok={health.ok} label="Base de données (Prisma)" desc="Lecture / écriture des tables" />
          <FlagCard ok={flags.whatsappToken} label="WhatsApp Cloud Token" desc="Jeton d'envoi Meta Graph API" />
          <FlagCard ok={flags.whatsappPhone} label="WhatsApp Phone Number ID" desc="Identifiant WABA principal" />
          <FlagCard ok={flags.whatsappVerify} label="Webhook Verify Token" desc="Jeton de souscription hub" />
          <FlagCard ok={flags.cronSecret} label="CRON_SECRET" desc="Protection des tâches d'arrière-plan" />
          <FlagCard ok={flags.supportWhatsApp} label="WhatsApp Équipe Support" desc="Numéro de contact opérateur" />
        </div>
      </section>

      {/* Crons & Webhooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 bg-white space-y-3">
          <h2 className="text-base font-bold text-navy border-b border-line pb-2">
            ⏰ Tâches Automatisées (Cron Jobs)
          </h2>
          <div className="space-y-3 text-xs">
            <div className="bg-soft p-3 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-navy">
                <span>Rappels J-1 de Rendez-vous</span>
                <span>18:00 UTC (quotidien)</span>
              </div>
              <p className="text-muted">Route : /api/cron/reminders?secret=...</p>
            </div>

            <div className="bg-soft p-3 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-navy">
                <span>Purge & Rétention RGPD/CDP</span>
                <span>03:00 UTC (quotidien)</span>
              </div>
              <p className="text-muted">Route : /api/cron/retention?secret=...</p>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-white space-y-3">
          <h2 className="text-base font-bold text-navy border-b border-line pb-2">
            🔗 Configuration Webhook Meta
          </h2>
          <div className="space-y-2 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-muted">URL Webhook à renseigner sur Meta Developers :</span>
              <div className="bg-soft p-2.5 rounded-xl font-mono text-navy break-all border border-line">
                {flags.appUrl}/api/webhooks/whatsapp
              </div>
            </div>

            <div className="pt-2 text-muted space-y-1">
              <div>Dernier événement webhook reçu : {lastWebhook ? `${lastWebhook.status} (${formatDateTime(lastWebhook.receivedAt)})` : "Aucun"}</div>
              <div>Dernier paiement enregistré : {lastPayment ? `${lastPayment.status} (${formatDateTime(lastPayment.createdAt)})` : "Aucun"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
