# Feature Specification: Modèles WhatsApp hors fenêtre 24h

**Feature Branch**: `002-whatsapp-templates`

**Created**: 2026-08-28

**Status**: Draft

**Input**: User description: "WhatsApp Cloud API (V2) — l'adaptateur d'envoi, le webhook signé, la déduplication et la configuration token/phoneId par commerce existent déjà (`src/lib/whatsapp/cloud.ts`, `src/app/api/webhooks/whatsapp/route.ts`). Le chaînon manquant pour une messagerie de production fiable : les modèles (templates) Meta approuvés pour les messages envoyés hors de la fenêtre de service de 24h — notamment les rappels J-1 et les notifications au patron — que l'adaptateur actuel envoie toujours en texte libre et que Meta rejettera en production réelle."

## Contexte

Meta WhatsApp Cloud API n'autorise l'envoi de **texte libre** ("session message") que dans les **24 heures** suivant le dernier message reçu du destinataire. Passé ce délai, seul un **modèle (template) pré-approuvé** par Meta peut être envoyé. Aujourd'hui, `cloudAdapter.sendText` (`src/lib/whatsapp/cloud.ts`) envoie systématiquement du texte libre, sans jamais vérifier ni respecter cette fenêtre. Tant qu'aucun token Meta réel n'est configuré (`.env` vide), ce n'est pas visible : le simulateur `/demo` n'appelle jamais cet adaptateur. Dès qu'un commerce connecte un vrai numéro Meta (`whatsappToken` + `whatsappPhoneNumberId`, déjà configurables dans `/app/parametres` et `/admin/commerces/[id]`), les envois suivants échoueront silencieusement :

- Rappel de rendez-vous J-1 (`src/lib/reminders.ts`) — envoyé le lendemain de la dernière conversation, donc quasi toujours hors fenêtre.
- Notification au patron (`src/lib/whatsapp/notify-owner.ts`) : nouveau RDV, transfert (handoff), annulation — envoyées au numéro du patron, qui n'a pas forcément écrit au numéro Assistant Bi dans les 24h précédentes.

Cette spec couvre uniquement l'ajout du support des modèles pour ces envois hors fenêtre. Elle ne touche pas : le moteur conversationnel dans la fenêtre (texte libre inchangé), l'Embedded Signup Meta, la coexistence, ni un nouveau fournisseur de paiement.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Le rappel J-1 arrive vraiment chez la cliente (Priority: P1)

Une cliente a pris rendez-vous chez Awa il y a 5 jours et n'a plus écrit depuis. La veille du rendez-vous, Assistant Bi doit lui envoyer un rappel. Comme la cliente n'a rien écrit dans les dernières 24h, l'envoi doit se faire via un modèle Meta approuvé (variables : nom du commerce, date, heure, prestation), pas en texte libre.

**Why this priority**: Le rappel J-1 est une promesse produit centrale (moins de rendez-vous oubliés). S'il échoue silencieusement en prod, la confiance commerciale s'effondre sans qu'Awa le sache.

**Independent Test**: Configurer un modèle "reminder_j1" sur un commerce de test, créer un rendez-vous demain sans message récent du client, déclencher le cron rappel, vérifier que l'appel Graph API envoyé est de type `template` (pas `text`) avec les bonnes variables.

**Acceptance Scenarios**:

1. **Given** un rendez-vous demain et aucun message client dans les 24h, **When** le cron de rappel s'exécute, **Then** le message part en tant que modèle approuvé avec les variables réelles (date, heure, prestation, nom du commerce), sans texte inventé.
2. **Given** un rendez-vous demain et un message client il y a moins de 24h, **When** le cron s'exécute, **Then** le message part en texte libre comme aujourd'hui (fenêtre ouverte, pas besoin de modèle).
3. **Given** un commerce sans modèle "reminder_j1" configuré et hors fenêtre, **When** le cron s'exécute, **Then** l'envoi est journalisé comme non tenté (pas d'exception, pas de tentative de texte libre vouée à l'échec) et le rendez-vous reste marqué comme non rappelé pour reprise ultérieure.

---

### User Story 2 - Le patron est notifié même s'il n'a pas ouvert WhatsApp depuis 2 jours (Priority: P1)

Le patron reçoit une notification (nouveau RDV, client en attente, annulation) sur son propre numéro WhatsApp, qui est aussi le numéro professionnel connecté à l'API. S'il n'a pas lui-même écrit au numéro Assistant Bi récemment, il doit quand même recevoir ces alertes via un modèle approuvé.

**Why this priority**: Sans ces notifications fiables, le patron perd le principal bénéfice du dashboard : être alerté en temps réel.

**Independent Test**: Simuler une nouvelle réservation sur un commerce dont le patron n'a pas de message sortant du bot depuis 24h, vérifier que l'appel sortant est un modèle.

**Acceptance Scenarios**:

1. **Given** un patron sans message envoyé au numéro Assistant Bi depuis 24h, **When** un nouveau rendez-vous est créé, **Then** la notification part via le modèle "new_appointment" configuré.
2. **Given** un patron ayant écrit au numéro Assistant Bi il y a 10 minutes, **When** un client demande un transfert (handoff), **Then** la notification part en texte libre (fenêtre ouverte).

---

### User Story 3 - L'opérateur configure les modèles sans déploiement (Priority: P2)

Après avoir fait approuver ses modèles dans Meta Business Manager, l'opérateur (ou le patron) doit pouvoir renseigner le nom exact et la langue de chaque modèle pour son commerce, depuis l'interface existante (`/app/parametres` ou `/admin/commerces/[id]`), sans intervention développeur.

**Why this priority**: Les noms de modèles sont propres à chaque compte Meta approuvé ; coder ces valeurs en dur bloquerait tout nouveau commerce.

**Independent Test**: Depuis `/admin/commerces/[id]`, saisir un nom de modèle pour "reminder_j1", sauvegarder, déclencher un envoi hors fenêtre et vérifier que ce nom est bien celui utilisé dans l'appel Graph API.

**Acceptance Scenarios**:

1. **Given** un commerce avec un token WhatsApp valide, **When** l'opérateur renseigne les 4 noms de modèles (rappel J-1, nouveau RDV, transfert, annulation), **Then** ces noms sont utilisés pour les envois correspondants hors fenêtre.
2. **Given** un commerce sans modèle configuré pour un type de message donné, **When** un envoi hors fenêtre de ce type est requis, **Then** le système ne tente pas d'envoi et journalise le manque (visible dans `/admin`), sans faire planter le flux (réservation, cron).

---

### Edge Cases

- Le client répond entre la création du rendez-vous et l'exécution du cron J-1 : la fenêtre se rouvre, le rappel doit repasser en texte libre (le calcul se fait au moment de l'envoi, pas à la réservation).
- `WHATSAPP_ACCESS_TOKEN` absent (simulateur uniquement) : aucun changement de comportement, le calcul de fenêtre/modèle ne s'applique pas.
- Modèle configuré mais rejeté par Meta (nom inexistant, langue non approuvée, variables incorrectes) : l'échec est traité comme les échecs d'envoi actuels (rétablissement de `reminderSentAt: null` pour reprise, pas de perte silencieuse).
- Un commerce change de langue par défaut (FR ↔ WO) : les modèles doivent pouvoir être configurés par langue si Meta exige des modèles distincts par langue.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système MUST déterminer, avant tout envoi WhatsApp Cloud API hors moteur conversationnel synchrone, si le destinataire (client ou patron) a envoyé un message entrant à ce commerce dans les 24 heures précédentes.
- **FR-002**: Le système MUST envoyer un modèle (template) Meta approuvé — jamais du texte libre — pour tout envoi (rappel J-1, notification nouveau RDV, notification transfert, notification annulation) déclenché hors de cette fenêtre de 24h.
- **FR-003**: Le système MUST continuer à envoyer en texte libre, comme aujourd'hui, tout message déclenché dans la fenêtre de 24h (comportement du moteur conversationnel `handleInbound` inchangé).
- **FR-004**: Chaque commerce MUST pouvoir configurer, depuis son espace (`/app/parametres`) ou depuis l'admin (`/admin/commerces/[id]`), le nom et la langue du modèle Meta approuvé pour chacun des 4 usages : rappel J-1, nouveau rendez-vous, transfert (handoff), annulation.
- **FR-005**: Le système MUST substituer les variables du modèle (nom du commerce, date, heure, prestation, nom du client) avec les données réelles de l'événement, sans jamais inventer de valeur (Constitution III).
- **FR-006**: Si aucun modèle n'est configuré pour un usage requis hors fenêtre, le système MUST renoncer à l'envoi sans lever d'exception ni bloquer le flux appelant (cron, réservation), et MUST journaliser ce manque pour l'opérateur.
- **FR-007**: L'adaptateur `cloudAdapter` MUST exposer une capacité d'envoi de modèle (type `template` de l'API Graph, avec composants/paramètres), en plus de l'envoi de texte libre existant.
- **FR-008**: Un échec d'envoi de modèle (rejet Meta) MUST être traité par le même mécanisme de reprise que les échecs actuels (ex. `reminderSentAt` remis à `null` pour le rappel J-1).
- **FR-009**: Ce comportement MUST rester un no-op total quand `WHATSAPP_ACCESS_TOKEN` n'est pas configuré (simulateur `/demo` inchangé).

### Key Entities

- **WhatsApp Template Mapping** : association par commerce entre un usage (rappel J-1, nouveau RDV, transfert, annulation) et un modèle Meta approuvé (nom, langue). Porté par le `Business` existant (nouveau champ JSON, sur le modèle de `hoursJson`), pas une nouvelle table — un seul mapping actif par usage et par commerce suffit au périmètre actuel.
- **Fenêtre de service (24h)** : dérivée du dernier `Message` entrant (`direction: "inbound"`) de la `Conversation` du destinataire ; pas une entité stockée séparément.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des rappels J-1 envoyés hors fenêtre de 24h utilisent un modèle approuvé (aucun appel Graph API de type `text` hors fenêtre en production).
- **SC-002**: 100% des notifications patron (nouveau RDV, transfert, annulation) envoyées hors fenêtre utilisent un modèle approuvé.
- **SC-003**: Un opérateur peut configurer les 4 modèles d'un commerce en moins de 3 minutes, sans déploiement de code.
- **SC-004**: Aucune tentative d'envoi hors fenêtre sans modèle configuré ne provoque d'erreur non gérée dans le cron de rappel ou le flux de réservation (0 exception non catchée en usage normal).

## Assumptions

- Les modèles Meta sont approuvés manuellement par l'opérateur dans Meta Business Manager, en dehors du produit ; Assistant Bi ne gère pas la soumission de modèles à Meta (hors périmètre, cohérent avec le paiement manuel Wave/OM).
- Un seul modèle actif par usage et par commerce à la fois (pas de versioning ni de rotation de modèles dans ce périmètre).
- Le nombre et l'ordre des variables de chaque modèle sont de la responsabilité de l'opérateur au moment de la configuration (le système ne valide pas la structure côté Meta avant envoi).
- Les 4 usages couverts (rappel J-1, nouveau RDV, transfert, annulation) sont ceux déjà notifiés en texte libre aujourd'hui ; aucun nouvel usage n'est ajouté.
