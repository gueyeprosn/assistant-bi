import { supportWhatsApp } from "@/lib/metrics";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

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
      <h1 className="text-3xl font-bold text-navy">Support</h1>
      <div className="card p-4 space-y-2">
        <p className="font-bold">Canal MVP : WhatsApp équipe</p>
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
        <ul className="card divide-y divide-line">
          {stale.length === 0 && <li className="px-4 py-6 text-muted">Aucun.</li>}
          {stale.map((p) => (
            <li key={p.id} className="px-4 py-3">
              {p.business.name} · {formatDateTime(p.createdAt)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
