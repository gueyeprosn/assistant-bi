import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { supportWhatsApp, controlTowerMetrics } from "@/lib/metrics";
import { displayPhone } from "@/lib/phone";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const wa = supportWhatsApp();
  const m = await controlTowerMetrics();

  const [stalePayments, incompleteTenants] = await Promise.all([
    prisma.subscriptionPayment.findMany({
      where: {
        status: "pending",
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: { business: { select: { id: true, name: true, ownerPhone: true } } },
      orderBy: { createdAt: "asc" },
    }),
    Promise.resolve(m.tenants.filter((t) => t.fichePct < 80)),
  ]);

  const supportHref = wa ? `https://wa.me/${wa.replace(/\D/g, "")}` : "";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Console Support & Accompagnement"
        help="Outils d'assistance pour aider les commerçants à configurer leur secrétaire virtuelle et relancer les paiements."
      />

      {/* Support channel bar */}
      <div className="card p-4.5 bg-white border border-line flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="font-bold text-navy text-sm">Canal WhatsApp Équipe Opérateur</div>
          <div className="text-xs text-muted">
            Numéro officiel de support Assistant Bi : {wa ? displayPhone(wa) : "Non configuré"}
          </div>
        </div>
        {supportHref ? (
          <a
            href={supportHref}
            target="_blank"
            rel="noreferrer"
            className="btn bg-[#25D366] hover:bg-[#128C7E] text-white text-xs min-h-9 px-4 inline-flex items-center gap-2"
          >
            💬 Ouvrir WhatsApp Support
          </a>
        ) : (
          <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded">
            Renseignez SUPPORT_WHATSAPP dans .env
          </span>
        )}
      </div>

      {/* Quick WhatsApp Templates */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-navy">Modèles de Messages d'Accompagnement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="card p-4 bg-white border border-line space-y-2 text-xs">
            <span className="font-bold text-navy block text-sm">🚀 Bienvenue & Démarrage</span>
            <p className="text-muted bg-soft p-2.5 rounded-lg">
              « Bonjour [Nom], félicitations pour votre inscription sur Assistant Bi ! Avez-vous besoin d'aide pour ajouter vos tarifs et horaires ? »
            </p>
          </div>

          <div className="card p-4 bg-white border border-line space-y-2 text-xs">
            <span className="font-bold text-navy block text-sm">💳 Relance Paiement Wave</span>
            <p className="text-muted bg-soft p-2.5 rounded-lg">
              « Bonjour [Nom], votre période d'essai Assistant Bi touche à sa fin. Pour continuer à recevoir vos RDV sans interruption, envoyez votre règlement Wave au [Numéro]. »
            </p>
          </div>

          <div className="card p-4 bg-white border border-line space-y-2 text-xs">
            <span className="font-bold text-navy block text-sm">🇸🇳 Message en Wolof</span>
            <p className="text-muted bg-soft p-2.5 rounded-lg">
              « Nanga def [Nom], man la Assistant Bi. Ndax soxla nga dimbali ci sa fiche walla sa waxtu ? Dama nekk fii ngir jàppale la. »
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incomplete Onboardings */}
        <div className="card p-5 bg-white space-y-3">
          <div className="flex justify-between items-center border-b border-line pb-2">
            <h2 className="text-base font-bold text-navy">
              Fiches Incomplètes (&lt; 80%) ({incompleteTenants.length})
            </h2>
            <span className="text-xs text-muted">À contacter pour onboarding</span>
          </div>

          <ul className="divide-y divide-line text-xs">
            {incompleteTenants.length === 0 && (
              <li className="py-4 text-center text-muted">
                Tous les commerces ont une fiche bien complétée (≥ 80%).
              </li>
            )}
            {incompleteTenants.map((t) => {
              const cleanPhone = t.phones[0]?.replace(/\D/g, "") || "";
              const waUrl = cleanPhone
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Bonjour ${t.name}, je suis de l'équipe Assistant Bi. Avez-vous besoin d'aide pour compléter les informations de votre commerce ?`
                  )}`
                : "";

              return (
                <li key={t.id} className="py-3 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <Link href={`/admin/commerces/${t.id}`} className="font-bold text-navy hover:underline">
                      {t.name}
                    </Link>
                    <div className="text-muted text-[11px]">
                      Score fiche : <span className="font-bold text-amber-700">{t.fichePct}%</span> · {t.category}
                    </div>
                  </div>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn bg-[#25D366] text-white text-[11px] min-h-7 px-2.5 rounded-lg"
                    >
                      Aider sur WhatsApp
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Stale Payments */}
        <div className="card p-5 bg-white space-y-3">
          <div className="flex justify-between items-center border-b border-line pb-2">
            <h2 className="text-base font-bold text-navy">
              Paiements en attente &gt; 24h ({stalePayments.length})
            </h2>
            <Link href="/admin/paiements" className="text-xs font-bold text-navy underline">
              Voir tous
            </Link>
          </div>

          <ul className="divide-y divide-line text-xs">
            {stalePayments.length === 0 && (
              <li className="py-4 text-center text-muted">
                Aucun paiement bloqué ou en retard de confirmation.
              </li>
            )}
            {stalePayments.map((p) => {
              const cleanPhone = (p.business.ownerPhone || "").replace(/\D/g, "");
              const waUrl = cleanPhone
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Bonjour ${p.business.name}, nous vérifions votre règlement de ${p.amountFcfa} FCFA sur Assistant Bi. Avez-vous le reçu de transfert ?`
                  )}`
                : "";

              return (
                <li key={p.id} className="py-3 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <Link href={`/admin/commerces/${p.business.id}`} className="font-bold text-navy hover:underline">
                      {p.business.name}
                    </Link>
                    <div className="text-muted text-[11px]">
                      {formatFcfa(p.amountFcfa)} · Soumis le {formatDateTime(p.createdAt)}
                    </div>
                  </div>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost text-[11px] min-h-7 px-2.5 rounded-lg"
                    >
                      Demander preuve
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
