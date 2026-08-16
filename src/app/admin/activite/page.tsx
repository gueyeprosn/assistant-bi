import { prisma } from "@/lib/db";
import { displayPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminActivitePage() {
  const [handoffs, failed, recent] = await Promise.all([
    prisma.conversation.findMany({
      where: { status: "handoff" },
      include: {
        business: { select: { name: true } },
        customer: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.message.findMany({
      where: { deliveryStatus: "failed" },
      include: { conversation: { include: { business: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.message.findMany({
      where: { direction: "inbound" },
      include: { conversation: { include: { business: { select: { name: true } }, customer: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activité"
        help="Messages et transferts de tous les commerces, en un seul écran."
      />
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">En attente d’un humain ({handoffs.length})</h2>
        <ul className="card divide-y divide-line bg-white">
          {handoffs.length === 0 && <li className="px-4 py-6 text-muted">Aucun transfert en cours.</li>}
          {handoffs.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="font-bold text-navy">{c.business.name}</div>
              <div className="text-muted">
                {c.customer.name || displayPhone(c.customer.phone)} · {formatDateTime(c.updatedAt)}
              </div>
              <p className="mt-1">{c.messages[0]?.text}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Messages non délivrés</h2>
        <ul className="card divide-y divide-line bg-white">
          {failed.length === 0 && <li className="px-4 py-6 text-muted">Aucun échec récent.</li>}
          {failed.map((msg) => (
            <li key={msg.id} className="px-4 py-3">
              <div className="font-bold">{msg.conversation.business.name}</div>
              <p className="text-muted">{msg.text}</p>
              <div className="text-sm text-muted">{formatDateTime(msg.createdAt)}</div>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Derniers messages clients</h2>
        <ul className="card divide-y divide-line bg-white">
          {recent.length === 0 && <li className="px-4 py-6 text-muted">Aucun message.</li>}
          {recent.map((msg) => (
            <li key={msg.id} className="px-4 py-3">
              <div className="font-bold">{msg.conversation.business.name}</div>
              <div className="text-muted">
                {msg.conversation.customer.name || displayPhone(msg.conversation.customer.phone)}
              </div>
              <p>{msg.text}</p>
              <div className="text-sm text-muted">{formatDateTime(msg.createdAt)}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
