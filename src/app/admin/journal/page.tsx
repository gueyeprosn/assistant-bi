import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminJournalPage() {
  const audits = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { business: { select: { name: true } }, actor: { select: { name: true, role: true } } },
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Journal" help="Actions opérateur et connexions sur toute la plateforme." />
      <ul className="card divide-y divide-line bg-white">
        {audits.length === 0 && <li className="px-4 py-6 text-muted">Aucune action encore.</li>}
        {audits.map((a) => (
          <li key={a.id} className="px-4 py-3 text-sm">
            <span className="font-bold">{a.action}</span>
            {a.business?.name ? <span className="text-muted"> · {a.business.name}</span> : null}
            {a.actor?.name ? <span className="text-muted"> · {a.actor.name}</span> : null}
            <span className="text-muted"> · {formatDateTime(a.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
