# Contracts: Modèles WhatsApp hors fenêtre 24h

Interfaces internes (pas d'API publique nouvelle — aucune route HTTP ajoutée).

## `src/lib/whatsapp/window.ts` (nouveau)

```ts
export type ServiceWindow = { isOpen: boolean; lastInboundAt: Date | null };

/** Fenêtre de service Meta (24h) pour un couple commerce + numéro destinataire. */
export async function getServiceWindow(businessId: string, recipientPhone: string): Promise<ServiceWindow>;
```

- Ne lance jamais d'exception : en cas d'erreur de requête, retourne `{ isOpen: false, lastInboundAt: null }` (fail-safe côté "exige un modèle", jamais fail-open vers du texte libre potentiellement rejeté).

## `src/lib/whatsapp/templates.ts` (nouveau)

```ts
export type WhatsAppTemplateUsage = "reminder_j1" | "new_appointment" | "handoff" | "cancelled";

export type SendMode =
  | { mode: "session" }
  | { mode: "template"; template: { name: string; lang: string } }
  | { mode: "skip"; reason: "no_template_configured" };

/** Décide session vs template vs skip pour un envoi donné. */
export async function resolveSendMode(
  businessId: string,
  recipientPhone: string,
  usage: WhatsAppTemplateUsage,
): Promise<SendMode>;

export function parseTemplateMapping(json: string): Partial<Record<WhatsAppTemplateUsage, { name: string; lang: string }>>;
```

## `src/lib/whatsapp/cloud.ts` (étendu)

```ts
export const cloudAdapter: WhatsAppAdapter & {
  sendTemplate(
    toPhone: string,
    template: { name: string; lang: string; params: string[] },
    businessId: string,
  ): Promise<void>;
};
```

- Même mécanique de retry/backoff que `sendText` (3 tentatives, backoff exponentiel `500ms * 2^n`).
- `params` : valeurs déjà formatées (date, heure, prix…) — substitution positionnelle dans le composant `body` du modèle Graph API. Jamais de valeur devinée (Constitution III) : si une donnée requise manque, l'appelant ne doit pas invoquer `sendTemplate`.

## Appelants modifiés

### `src/lib/reminders.ts` → `sendJ1Reminders()`

Avant l'envoi (texte libre actuel), appeler `resolveSendMode(businessId, customerPhone, "reminder_j1")` :
- `session` → comportement actuel inchangé (`adapter.sendText`).
- `template` → `cloudAdapter.sendTemplate(...)` avec les mêmes variables (date, heure, prestation, nom du commerce) déjà calculées pour le texte libre.
- `skip` → ne pas appeler Graph API, journaliser (`console.warn`), **ne pas** marquer `reminderSentAt` (laisser le rendez-vous éligible à une reprise/alerte admin plutôt que silencieusement "rappelé" sans envoi réel).

### `src/lib/whatsapp/notify-owner.ts` → 3 fonctions (`notifyOwnerNewAppointment`, `notifyOwnerHandoff`, `notifyOwnerAppointmentCancelled`)

Même logique, `usage` = `"new_appointment" | "handoff" | "cancelled"`, destinataire = `biz.ownerPhone`. `skip` → `console.warn`, la fonction retourne silencieusement (comportement déjà `try/catch`-protégé aujourd'hui, non bloquant pour le flux appelant).

## Écrans étendus (formulaires existants, pas de nouvelle route)

- `src/app/app/parametres/page.tsx` : 4 paires de champs (nom modèle, langue) sous la section WhatsApp existante.
- `src/app/admin/commerces/[id]/page.tsx` : mêmes champs côté admin.
- `src/app/actions/business.ts` / `src/app/actions/admin.ts` : parsent et persistent `whatsappTemplatesJson` (valider via `parseTemplateMapping`/sérialisation, même garde que les autres champs JSON existants comme `hoursJson`).
