import { supportWhatsApp } from "@/lib/metrics";
import { prisma } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const wa = supportWhatsApp();
  const stale = await prisma.subscriptionPayment.findMany({
    where: {
      status: "pending",
      createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });
  const href = wa ? `https://wa.me/${wa.replace(/\D/g, "")}` : "";

  return (
    <div className="space-y-6">
      <PageHeader title="Support" help="File d’attente opérateur : paiements bloqués et canal équipe." />
      <div className="card p-4 space-y-2 bg-white">
        <p className="font-bold">Canal équipe</p>
        {href ? (
          <a href={href} className="btn btn-primary inline-flex" target="_blank" rel="noreferrer">
            Écrire au {wa}
          </a>
        ) : (
          <p className="text-muted">Renseignez SUPPORT_WHATSAPP dans .env</p>
        )}
      </div>
      <section>
        <h2 className="text-xl font-bold text-navy mb-3">Paiements en attente &gt; 24 h</h2>
        <ul className="card divide-y divide-line bg-white">
          {stale.length === 0 && <li className="px-4 py-6 text-muted">Aucun.</li>}
          {stale.map((p) => (
            <li key={p.id} className="px-4 py-3">
              {p.business.name} · {formatFcfa(p.amountFcfa)} · {formatDateTime(p.createdAt)}
            </li>
          ))}
        </ul>
        <Link href="/admin/paiements" className="font-bold text-navy underline min-h-12 inline-flex items-center mt-2">
          Ouvrir tous les paiements
        </Link>
      </section>
    </div>
  );
}
