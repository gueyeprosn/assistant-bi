# Server actions contracts

Toutes les actions : Zod parse → `requireUser` / `requireOwner` / `requireAdmin` → service.  
`businessId` **jamais** lu depuis le formulaire pour un owner (sauf admin : `impersonateBusiness`, `extendTrial`, `setBusinessStatus`).

Erreurs : `redirect` avec message déjà le pattern ; progressivement retourner `{ error }` pour éviter la perte de saisie. Cette vague : garder redirect pour login ; actions admin restent no-op si non admin (préférer redirect `/login`).

## Auth

| Action | Entrée | Effet |
|---|---|---|
| `loginAction` | phone, pin | Session DB + cookie `sessionId`. Lockout si trop d’échecs. Audit. |
| `logoutAction` | — | Révoque **cette** session |
| `logoutEverywhereAction` *(nouveau)* | — | Révoque toutes les sessions du user |

## Patron (`requireOwner`)

| Action | Notes |
|---|---|
| `replyHandoff` | conversationId doit appartenir au commerce session |
| `resumeBot` | idem |
| `updateAppointmentStatus` | statuts autorisés seulement |
| `blockSlot` / `deleteBlockedSlot` | dates valides |
| `saveFiche` / `saveService` / `toggleService` | pas de jargon IA |
| `requestManualPayment` | crée Payment pending + planId |
| `createManualQuote` | texte, pas PDF |

## Admin (`requireAdmin`, user.role === admin, ignore impersonation)

| Action | Notes |
|---|---|
| `confirmPayment` | status confirmed + `plan` business + `confirmedByUserId` + Audit + SubscriptionEvent |
| `rejectPayment` | rejected + audit |
| `setBusinessStatus` | enum contrôlé |
| `extendTrial` | +7 j serveur, audit |
| `impersonateBusiness` | **reason** required ≥ 8 chars, crée ImpersonationSession |
| `endImpersonation` *(nouveau)* | endedAt, restaure session admin |

## Lecture

Helpers (pas des actions) : `getCurrentUser()`, `getCurrentBusiness()`, `requirePermission(perm)`, `getSubscriptionStatus(business)`.
