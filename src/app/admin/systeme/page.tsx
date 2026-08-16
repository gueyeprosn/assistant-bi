import { checkHealth } from "@/lib/health";
import { saasFlags } from "@/lib/saas-flags";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`card p-4 bg-white ${ok ? "" : "border-gold bg-gold/10"}`}>
      <div className="text-2xl font-bold text-navy">{ok ? "OK" : "Manque"}</div>
      <div className="text-muted mt-1 font-semibold">{label}</div>
    </div>
  );
}

export default async function AdminSystemePage() {
  const [health, flags, lastWebhook, lastPayment] = await Promise.all([
    checkHealth().catch(() => ({ ok: false as const, service: "assistant-bi" })),
    Promise.resolve(saasFlags()),
    prisma.webhookEvent.findFirst({ orderBy: { receivedAt: "desc" } }),
    prisma.subscriptionPayment.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Système"
        help="Santé technique du SaaS. Les clés secrètes ne s’affichent jamais, seulement si elles sont présentes."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Flag ok={health.ok} label="Base de données" />
        <Flag ok={flags.database} label="DATABASE_URL" />
        <Flag ok={flags.whatsappToken} label="Clé WhatsApp (serveur)" />
        <Flag ok={flags.whatsappPhone} label="Code numéro WhatsApp (serveur)" />
        <Flag ok={flags.whatsappVerify} label="Jeton de vérification webhook" />
        <Flag ok={flags.cronSecret} label="Secret des tâches auto" />
        <Flag ok={flags.supportWhatsApp} label="WhatsApp support équipe" />
      </div>
      <div className="card p-4 bg-white space-y-2">
        <p className="font-bold">Adresse de l’app</p>
        <p className="break-all">{flags.appUrl}</p>
        <p className="text-muted text-sm">Webhook à coller : {flags.appUrl}/api/webhooks/whatsapp</p>
      </div>
      <ul className="card divide-y divide-line bg-white">
        <li className="px-4 py-3">
          Dernier webhook : {lastWebhook ? `${lastWebhook.status} · ${formatDateTime(lastWebhook.receivedAt)}` : "aucun"}
        </li>
        <li className="px-4 py-3">
          Dernier paiement : {lastPayment ? `${lastPayment.status} · ${formatDateTime(lastPayment.createdAt)}` : "aucun"}
        </li>
      </ul>
    </div>
  );
}
