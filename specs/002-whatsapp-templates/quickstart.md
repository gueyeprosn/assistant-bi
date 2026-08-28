# Quickstart: Modèles WhatsApp hors fenêtre 24h

## Prérequis

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

Aucun token Meta réel n'est nécessaire pour valider la logique (les tests unitaires n'appellent pas Graph API). Un token réel n'est requis que pour valider un envoi bout en bout en environnement de test Meta.

## Scénario 1 — Fenêtre fermée → modèle utilisé (rappel J-1)

1. Seed : créer un rendez-vous demain pour un client dont le dernier message date de plus de 24h (ou aucun message).
2. Configurer, sur ce commerce, `whatsappTemplatesJson` avec une entrée `reminder_j1` (`npx prisma studio` ou via `/admin/commerces/[id]`).
3. Exécuter `sendJ1Reminders()` (ou `GET /api/cron/reminders?secret=...` en local).
4. **Attendu** : `resolveSendMode` renvoie `{ mode: "template" }` ; `cloudAdapter.sendTemplate` est appelé (vérifiable via mock en test unitaire) et non `sendText`.

## Scénario 2 — Fenêtre ouverte → texte libre inchangé

1. Même rendez-vous, mais le client a envoyé un message il y a moins de 24h.
2. Exécuter `sendJ1Reminders()`.
3. **Attendu** : `resolveSendMode` renvoie `{ mode: "session" }` ; `sendText` est appelé comme aujourd'hui, aucun changement de comportement observable.

## Scénario 3 — Pas de modèle configuré → aucun envoi tenté

1. Rendez-vous demain, fenêtre fermée, `whatsappTemplatesJson` sans entrée `reminder_j1`.
2. Exécuter `sendJ1Reminders()`.
3. **Attendu** : ni `sendText` ni `sendTemplate` appelés ; un avertissement est journalisé ; le rendez-vous reste éligible pour reprise (pas de faux "rappel envoyé").

## Scénario 4 — Notification patron hors fenêtre

1. Commerce avec `whatsappTemplatesJson.new_appointment` configuré, patron sans message sortant vers Assistant Bi depuis 24h.
2. Créer un rendez-vous via `/demo`.
3. **Attendu** : `notifyOwnerNewAppointment` utilise le modèle `new_appointment`, pas de texte libre.

## Validation automatisée

```bash
npm test -- whatsapp-templates
```

Couvre : calcul de fenêtre (message récent vs ancien vs absent), les 3 branches de `resolveSendMode`, non-régression du chemin texte libre existant (`bot-facts.test.ts`, `reminders.test.ts` doivent rester verts).

## Non couvert par ce quickstart

- Approbation réelle d'un modèle dans Meta Business Manager (hors produit, cf. spec.md § Assumptions).
- Envoi réel vers un numéro Meta de test (nécessite des credentials externes, hors CI).
