# Brancher WhatsApp Business (phase 1b)

Le MVP tourne d’abord avec le **simulateur** (`/demo`). Le moteur de conversation ne change pas : seul l’adaptateur d’envoi change.

## Ce que le prospect doit comprendre

- WhatsApp **personnel** (icône verte) ne peut pas coexister avec l’API.
- Il faut l’app **WhatsApp Business** (icône bleue), version ≥ 2.24.17.
- Meta propose la **coexistence** : le même numéro reste dans l’app du téléphone **et** répond via l’API. Le patron peut encore taper lui-même.
- Il faut ouvrir l’app au moins une fois tous les 14 jours.

## Compte technique

1. Créer un compte **Meta Business** + devenir *Tech Provider* (ou passer par un BSP : 360dialog, Infobip, etc.).
2. Embedded Signup : option « ce numéro est déjà utilisé dans WhatsApp Business ».
3. Webhook public HTTPS : `https://VOTRE_DOMAINE/api/webhooks/whatsapp`
4. Variables d’environnement :

```
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=
```

5. Vérification GET : Meta envoie `hub.mode`, `hub.verify_token`, `hub.challenge`.
6. POST : messages texte → `handleInbound` → `cloudAdapter.sendText`.

## Mapping numéro → commerce

Aujourd’hui le webhook cherche un `Business` dont `ownerPhone` correspond au numéro affiché. Pour plusieurs clients en prod, ajouter un champ `waPhoneNumberId` (à prévoir).

## Rappels J-1

Les templates Meta (messages hors fenêtre 24 h) seront nécessaires en production. Le cron `GET /api/cron/reminders?secret=CRON_SECRET` (18:00 UTC via `vercel.json`) écrit déjà le message en base et appelle l’adaptateur.

## Alternative BSP Afrique

Si le compte Tech Provider Meta est trop long : 360dialog / Infobip. L’interface `WhatsAppAdapter` (`src/lib/whatsapp/types.ts`) reste la même.

## Modèles (templates) — messages hors fenêtre de 24h

Meta n’autorise le texte libre que dans les 24h suivant le dernier message reçu du destinataire. Passé ce délai (cas quasi systématique du **rappel J-1** et fréquent des **notifications patron**), seul un modèle pré-approuvé peut être envoyé — sinon Meta rejette l’appel.

1. Faire approuver les modèles dans Meta Business Manager (un par usage, variables en paramètres positionnels du corps du message) :
   - `reminder_j1` — variables : nom du commerce, date, heure, prestation
   - `new_appointment` — variables : nom du commerce, nom du client, date/heure
   - `handoff` — variables : nom du commerce, nom du client, dernier message
   - `cancelled` — variables : nom du commerce, nom du client, date/heure
2. Renseigner le nom exact et la langue de chaque modèle depuis `/app/parametres` (le commerce) ou `/admin/commerces/[id]` (l’opérateur).
3. Le système calcule la fenêtre de 24h à chaque envoi (`src/lib/whatsapp/window.ts`) et choisit automatiquement texte libre (fenêtre ouverte), modèle (fenêtre fermée + modèle configuré), ou aucun envoi + log (fenêtre fermée + modèle manquant).

Voir `specs/002-whatsapp-templates/` pour la spécification complète.
