import Link from "next/link";
import { prisma } from "@/lib/db";
import { displayPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminActivitePage() {
  const [handoffs, failed, recent, totalMessagesToday, failedCountToday] = await Promise.all([
    prisma.conversation.findMany({
      where: { status: "handoff" },
      include: {
        business: { select: { id: true, name: true, ownerPhone: true } },
        customer: true,
        messages: { orderBy: { createdAt: "desc" }, take: 2 },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.message.findMany({
      where: { deliveryStatus: "failed" },
      include: {
        conversation: {
          include: {
            business: { select: { id: true, name: true, ownerPhone: true } },
            customer: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.message.findMany({
      where: { direction: "inbound" },
      include: {
        conversation: {
          include: {
            business: { select: { id: true, name: true, ownerPhone: true } },
            customer: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.message.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.message.count({
      where: {
        deliveryStatus: "failed",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervision Live de l'Activité"
        help="Surveillance en temps réel des messages WhatsApp échangés, des transferts humains et des erreurs de distribution."
      />

      {/* KPI Activity Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className={`card p-4 bg-white ${handoffs.length > 0 ? "border-l-4 border-l-gold" : ""}`}>
          <div className="text-2xl font-black text-navy">{handoffs.length}</div>
          <div className="text-xs font-bold text-muted uppercase mt-1">Handoffs en attente</div>
        </div>

        <div className={`card p-4 bg-white ${failedCountToday > 0 ? "border-l-4 border-l-red-500" : ""}`}>
          <div className="text-2xl font-black text-navy">{failedCountToday}</div>
          <div className="text-xs font-bold text-muted uppercase mt-1">Échecs d'envoi (24h)</div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-navy">
          <div className="text-2xl font-black text-navy">{totalMessagesToday}</div>
          <div className="text-xs font-bold text-muted uppercase mt-1">Messages traités aujourd'hui</div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-emerald-500">
          <div className="text-2xl font-black text-navy">
            {totalMessagesToday > 0
              ? `${Math.round(((totalMessagesToday - failedCountToday) / totalMessagesToday) * 100)} %`
              : "100 %"}
          </div>
          <div className="text-xs font-bold text-muted uppercase mt-1">Taux de délivrabilité</div>
        </div>
      </div>

      {/* Handoffs queue */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <span>🚨</span>
            Conversations en attente d’un humain ({handoffs.length})
          </h2>
        </div>

        <div className="space-y-2.5">
          {handoffs.length === 0 && (
            <div className="card p-6 bg-white text-center text-muted text-sm">
              ✓ Aucun transfert vers un humain en attente. Le bot gère toutes les conversations courantes.
            </div>
          )}

          {handoffs.map((c) => {
            const cleanPhone = (c.business.ownerPhone || "").replace(/\D/g, "");
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "";

            return (
              <div
                key={c.id}
                className="card p-4 bg-white border-l-4 border-l-gold flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/admin/commerces/${c.business.id}`}
                      className="font-bold text-navy text-sm hover:underline"
                    >
                      {c.business.name}
                    </Link>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-soft text-muted">
                      Client : {c.customer.name || displayPhone(c.customer.phone)}
                    </span>
                    <span className="text-xs text-muted">
                      Modifié le {formatDateTime(c.updatedAt)}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-ink bg-soft/60 px-3 py-2 rounded-lg border border-line">
                    « {c.messages[0]?.text || "Demande de contact"} »
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn bg-[#25D366] hover:bg-[#128C7E] text-white text-xs min-h-9 px-3.5 inline-flex items-center gap-1.5"
                    >
                      Alerter patron
                    </a>
                  )}
                  <Link
                    href={`/admin/commerces/${c.business.id}`}
                    className="btn btn-ghost text-xs min-h-9 px-3"
                  >
                    Voir fiche
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Failed Messages */}
      {failed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-destructive flex items-center gap-2">
            <span>⚠️</span>
            Derniers messages non délivrés ({failed.length})
          </h2>

          <div className="card overflow-hidden bg-white border border-red-200">
            <ul className="divide-y divide-line text-xs">
              {failed.map((msg) => (
                <li key={msg.id} className="p-3.5 hover:bg-red-50/30 flex flex-wrap justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-bold text-navy">
                      {msg.conversation.business.name} → {displayPhone(msg.conversation.customer.phone)}
                    </span>
                    <p className="text-muted text-sm">« {msg.text} »</p>
                  </div>
                  <div className="text-right text-muted shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold mb-1">
                      Échec Meta API
                    </span>
                    <div>{formatDateTime(msg.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Live Stream */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-navy">Flux des derniers messages clients entrants</h2>
        <div className="card overflow-hidden bg-white border border-line">
          <ul className="divide-y divide-line text-xs">
            {recent.length === 0 && (
              <li className="p-6 text-center text-muted">Aucun message reçu.</li>
            )}
            {recent.map((msg) => (
              <li key={msg.id} className="p-3.5 hover:bg-soft/50 flex flex-wrap justify-between items-center gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/admin/commerces/${msg.conversation.business.id}`}
                      className="font-bold text-navy hover:underline"
                    >
                      {msg.conversation.business.name}
                    </Link>
                    <span className="text-muted">
                      de {msg.conversation.customer.name || displayPhone(msg.conversation.customer.phone)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-soft text-[10px] font-bold uppercase text-muted">
                      {msg.language || "fr"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-ink">« {msg.text} »</p>
                </div>
                <span className="text-muted shrink-0">{formatDateTime(msg.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
