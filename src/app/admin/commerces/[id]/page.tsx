import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime, formatFcfa, planLabel, statusLabel } from "@/lib/format";
import { displayPhone } from "@/lib/phone";
import {
  extendTrial,
  impersonateBusiness,
  resetOwnerPin,
  setBusinessStatus,
  updateBusinessPlan,
  updateBusinessWhatsAppConfig,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminCommerceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      users: true,
      services: { orderBy: { sortOrder: "asc" } },
      appointments: {
        include: { customer: true, service: true },
        orderBy: { startsAt: "desc" },
        take: 10,
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          customers: true,
          appointments: true,
          conversations: true,
          quotes: true,
        },
      },
    },
  });

  if (!business) notFound();

  const owner = business.users.find((u) => u.role === "owner") || business.users[0];
  const cleanPhone = (business.ownerPhone || owner?.phone || "").replace(/\D/g, "");
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "";

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2">
          <Link
            href="/admin/commerces"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-navy"
          >
            ← Retour à la liste des commerces
          </Link>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader
            title={business.name}
            help={`${business.category} · ${business.neighborhood || "Dakar"} · Créé le ${formatDate(business.createdAt)}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-xl font-bold text-sm ${
                business.status === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : business.status === "trial"
                    ? "bg-gold/20 text-navy border border-gold"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {statusLabel(business.status)}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl font-bold text-sm bg-navy text-white">
              {planLabel(business.plan)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 bg-white">
          <div className="text-2xl font-black text-navy">{business._count.customers}</div>
          <div className="text-xs font-bold text-muted uppercase mt-1">Clients uniques</div>
        </div>
        <div className="card p-4 bg-white">
          <div className="text-2xl font-black text-navy">{business._count.appointments}</div>
          <div className="text-xs font-bold text-muted uppercase mt-1">Rendez-vous</div>
        </div>
        <div className="card p-4 bg-white">
          <div className="text-2xl font-black text-navy">{business.services.length}</div>
          <div className="text-xs font-bold text-muted uppercase mt-1">Prestations</div>
        </div>
        <div className="card p-4 bg-white">
          <div className="text-2xl font-black text-navy">{business._count.quotes}</div>
          <div className="text-xs font-bold text-muted uppercase mt-1">Devis générés</div>
        </div>
      </div>

      {/* Owner & Impersonation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 bg-white space-y-4">
          <h2 className="text-lg font-bold text-navy border-b border-line pb-2">
            👤 Propriétaire & Contact
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Nom patron :</span>
              <span className="font-bold">{owner?.name || "Non renseigné"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Téléphone WhatsApp :</span>
              <span className="font-bold">{displayPhone(business.ownerPhone)}</span>
            </div>
            {business.secondaryPhone && (
              <div className="flex justify-between">
                <span className="text-muted">Numéro secondaire :</span>
                <span className="font-bold">{displayPhone(business.secondaryPhone)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Adresse :</span>
              <span className="font-bold">{business.address || "—"}, {business.neighborhood}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Langue par défaut :</span>
              <span className="font-bold uppercase">{business.defaultLang}</span>
            </div>
            {business.trialEndsAt && (
              <div className="flex justify-between">
                <span className="text-muted">Fin de l'essai :</span>
                <span className="font-bold text-amber-700">{formatDateTime(business.trialEndsAt)}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="btn bg-[#25D366] hover:bg-[#128C7E] text-white text-xs min-h-10 px-4 rounded-xl inline-flex items-center gap-2"
              >
                💬 Ouvrir WhatsApp ({business.ownerPhone})
              </a>
            )}
            {owner && (
              <form action={resetOwnerPin} className="flex gap-2 items-center">
                <input type="hidden" name="phone" value={owner.phone} />
                <input
                  name="pin"
                  required
                  minLength={4}
                  placeholder="Nouveau PIN"
                  className="field max-w-[120px] text-xs min-h-10 py-1"
                />
                <button className="btn btn-ghost text-xs min-h-10 px-3">Changer PIN</button>
              </form>
            )}
          </div>
        </div>

        {/* Impersonation and Status Control */}
        <div className="card p-5 bg-white space-y-4">
          <h2 className="text-lg font-bold text-navy border-b border-line pb-2">
            ⚙️ Actions & Statut SaaS
          </h2>

          <form action={impersonateBusiness} className="space-y-2 bg-soft p-3.5 rounded-xl border border-line">
            <input type="hidden" name="businessId" value={business.id} />
            <label className="block text-xs font-bold text-navy">
              Connexion comme le client (Impersonation)
            </label>
            <div className="flex gap-2">
              <input
                name="reason"
                required
                minLength={8}
                placeholder="Motif d'intervention (ex: Assistance devis)"
                className="field text-sm min-h-10"
              />
              <button className="btn btn-primary text-xs min-h-10 shrink-0 px-4">
                Prendre la main
              </button>
            </div>
          </form>

          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-muted">Changer la formule :</span>
              <form action={updateBusinessPlan} className="flex gap-2">
                <input type="hidden" name="id" value={business.id} />
                <select name="plan" defaultValue={business.plan} className="field text-xs min-h-9 py-1 max-w-[150px]">
                  <option value="trial">Essai 7j</option>
                  <option value="micro">Micro (1 500 F)</option>
                  <option value="standard">Standard (3 000 F)</option>
                  <option value="pro">Pro (6 000 F)</option>
                </select>
                <button className="btn btn-ghost text-xs min-h-9 px-3">Valider</button>
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-muted">Statut du compte :</span>
              <div className="flex flex-wrap gap-1.5">
                {(["active", "trial", "past_due", "suspended"] as const).map((st) => (
                  <form key={st} action={setBusinessStatus}>
                    <input type="hidden" name="id" value={business.id} />
                    <input type="hidden" name="status" value={st} />
                    <button
                      className={`btn text-xs min-h-8 px-2.5 rounded-lg ${
                        business.status === st ? "bg-navy text-white" : "btn-ghost"
                      }`}
                    >
                      {statusLabel(st)}
                    </button>
                  </form>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <form action={extendTrial}>
                <input type="hidden" name="id" value={business.id} />
                <button className="btn btn-gold text-xs min-h-9 px-4">
                  +7 jours d'essai gratuit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Dedicated Credentials */}
      <div className="card p-5 bg-white space-y-4">
        <h2 className="text-lg font-bold text-navy border-b border-line pb-2">
          📱 Configuration WhatsApp Cloud API Dédiée
        </h2>
        <p className="text-xs text-muted">
          Si ce commerce dispose d'un numéro WhatsApp Business dédié (WABA), renseignez ses identifiants ici. Laissez vide pour utiliser le compte global serveur.
        </p>

        <form action={updateBusinessWhatsAppConfig} className="grid sm:grid-cols-2 gap-4">
          <input type="hidden" name="id" value={business.id} />
          <div className="space-y-1">
            <label className="block text-xs font-bold text-navy">WhatsApp Phone Number ID</label>
            <input
              name="whatsappPhoneNumberId"
              defaultValue={business.whatsappPhoneNumberId}
              placeholder="Ex: 109823471928374"
              className="field text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-navy">WhatsApp Access Token (optionnel)</label>
            <input
              type="password"
              name="whatsappToken"
              defaultValue={business.whatsappToken}
              placeholder="Jeton Meta permanent (EAA...)"
              className="field text-sm"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button className="btn btn-primary text-xs min-h-10 px-5">
              Enregistrer la configuration WhatsApp
            </button>
          </div>
        </form>
      </div>

      {/* Services and Recent Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 bg-white space-y-3">
          <h2 className="text-lg font-bold text-navy border-b border-line pb-2">
            ✂️ Prestations ({business.services.length})
          </h2>
          <ul className="divide-y divide-line text-sm">
            {business.services.length === 0 && (
              <li className="py-4 text-muted">Aucune prestation configurée.</li>
            )}
            {business.services.map((s) => (
              <li key={s.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold">{s.name}</span>
                  <span className="text-xs text-muted block">{s.durationMin} min</span>
                </div>
                <span className="font-bold text-navy">{formatFcfa(s.priceFcfa)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5 bg-white space-y-3">
          <h2 className="text-lg font-bold text-navy border-b border-line pb-2">
            🗓️ Derniers Rendez-vous
          </h2>
          <ul className="divide-y divide-line text-sm">
            {business.appointments.length === 0 && (
              <li className="py-4 text-muted">Aucun rendez-vous récent.</li>
            )}
            {business.appointments.map((a) => (
              <li key={a.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-bold">
                    {a.customer.name || displayPhone(a.customer.phone)}
                  </div>
                  <div className="text-xs text-muted">
                    {a.service?.name || "Prestation"} · {formatDateTime(a.startsAt)}
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-soft rounded-lg">
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
