# Feature Specification: Fondations SaaS commercialisable

**Feature Branch**: `001-saas-foundations`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Transformer le MVP Assistant Bi (project.md) en SaaS B2B professionnel, robuste et commercialisable à Dakar, à partir du produit existant, sans repartir de zéro et sans fonctionnalités hors MVP."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Le patron se connecte sans se tromper de commerce (Priority: P1)

Awa, coiffeuse à la Médina, ouvre l’espace pro sur son téléphone, entre son numéro sénégalais et son PIN. Elle ne voit que **son** salon : messages, agenda, clients, devis. Un autre professionnel connecté au même produit ne peut ni voir ni modifier les données d’Awa. Si elle se trompe de PIN plusieurs fois, l’accès se bloque un moment. Elle peut se déconnecter de tous les appareils.

**Why this priority**: Sans isolation et auth fiables, le produit n’est pas vendable.

**Independent Test**: Deux comptes démo (salon et garage). Se connecter à chacun et vérifier qu’aucune donnée de l’autre n’apparaît. Tester PIN faux, verrouillage, déconnexion.

**Acceptance Scenarios**:

1. **Given** un patron avec un PIN valide, **When** il se connecte, **Then** il n’accède qu’au commerce lié à son compte.
2. **Given** un PIN incorrect répété, **When** le seuil est atteint, **Then** la connexion est temporairement refusée et l’événement est journalisé.
3. **Given** une session ouverte, **When** le patron se déconnecte partout, **Then** les autres sessions cessent d’accéder à l’espace pro.

---

### User Story 2 - La cliente est reçue sur WhatsApp, 24h/24 (Priority: P1)

Une cliente écrit comme d’habitude (français ou wolof) : horaires, prix, rendez-vous, devis. La secrétaire répond avec les **vraies** infos du commerce. Si elle ne sait pas, elle transmet au patron au lieu d’inventer. Le patron voit « action requise », peut répondre, puis rend la main à la secrétaire. Le simulateur de démo continue de servir sans compte WhatsApp Business.

**Why this priority**: C’est la promesse commerciale : « Votre secrétaire, déjà sur WhatsApp. »

**Independent Test**: Dans `/demo`, enchaîner horaires, un rendez-vous, une question inconnue (handoff), en FR puis en WO.

**Acceptance Scenarios**:

1. **Given** une fiche métier complète, **When** la cliente demande un tarif connu, **Then** la réponse reprend le prix enregistré, sans invention.
2. **Given** une demande hors fiche, **When** la secrétaire ne peut pas répondre, **Then** le client est informé du transfert et le patron voit la conversation à reprendre.
3. **Given** un patron qui a repris la main, **When** il clôture ou rend la main, **Then** la secrétaire reprend ou la conversation est close, selon son choix.

---

### User Story 3 - Les rendez-vous ne se marchent pas dessus (Priority: P1)

La cliente réserve un créneau. Si l’heure est prise, on propose 2 ou 3 autres. La veille, un rappel part **une seule fois**. Si elle annule, le créneau se libère. Le patron voit le jour, peut marquer fait / absent / annulé, et fermer un jour (congé).

**Why this priority**: Un double booking détruit la confiance dès le premier salon.

**Independent Test**: Réserver un créneau, retenter le même, vérifier le refus + alternatives ; déclencher le rappel deux fois et constater un seul envoi.

**Acceptance Scenarios**:

1. **Given** un créneau déjà confirmé, **When** une autre cliente le demande, **Then** il est refusé et des alternatives sont proposées.
2. **Given** un rendez-vous confirmé, **When** le rappel de la veille s’exécute deux fois, **Then** un seul message est envoyé.
3. **Given** une annulation, **When** le créneau est libéré, **Then** une autre cliente peut le prendre.

---

### User Story 4 - L’essai et l’abonnement sont honnêtes (Priority: P2)

Un nouveau patron a 7 jours d’essai, calculés par le produit, pas par le téléphone. Il choisit Micro / Standard / Pro (1 500 / 3 000 / 6 000 F). Il paie par Wave ou Orange Money, signale le paiement, et n’est activé que lorsqu’un opérateur confirme. S’il est en retard ou suspendu, l’accès métier se coupe côté serveur. Il peut arrêter quand il veut.

**Why this priority**: C’est le revenu ; un essai truqué ou un accès non coupé ruine le modèle.

**Independent Test**: Compte en essai expiré → accès refusé ; paiement en attente → pas d’activation ; confirmation opérateur → accès au plan choisi.

**Acceptance Scenarios**:

1. **Given** un essai en cours, **When** la date de fin serveur est dépassée, **Then** le patron n’accède plus aux fonctions payantes, même s’il a modifié l’heure de son téléphone.
2. **Given** un paiement déclaré, **When** l’opérateur ne l’a pas confirmé, **Then** le plan ne change pas.
3. **Given** un compte suspendu, **When** le patron ouvre l’espace, **Then** il voit un message clair, sans données d’un autre commerce.

---

### User Story 5 - Le quotidien tient dans le téléphone (Priority: P2)

Le matin, Awa ouvre l’accueil : messages du jour, rendez-vous, demandes en attente, transferts. Quatre onglets suffisent (Accueil, Agenda, Messages, Plus). Elle configure activité, services, horaires, règles et réponses dans un langage non technique, avec un indicateur « Assistant Bi est prêt à X % ». Tout est en français ou en wolof, au choix, jamais les deux sur le même bouton.

**Why this priority**: Le produit se vend en démo terrain ; l’écran doit rester compréhensible en 30 secondes.

**Independent Test**: Parcourir l’espace pro sur une largeur 375 px, basculer FR/WO, remplir la fiche jusqu’à un pourcentage visible.

**Acceptance Scenarios**:

1. **Given** un patron connecté, **When** il ouvre l’accueil, **Then** il voit aujourd’hui (messages, RDV, files d’attente) sans tableau de bord analytique complexe.
2. **Given** une fiche incomplète, **When** il ouvre la configuration, **Then** un pourcentage de préparation s’affiche et le vocabulaire reste métier.
3. **Given** la langue wolof, **When** il navigue, **Then** les libellés sont en wolof, sans mélange FR+WO sur un même bouton.

---

### User Story 6 - L’opérateur gère les comptes sans se faire passer pour n’importe qui (Priority: P2)

L’équipe Assistant Bi voit les essais, abonnements, paiements à valider et comptes suspendus. Elle peut prolonger un essai, confirmer un paiement, suspendre, et « voir comme le patron » uniquement avec un motif journalisé, une durée limitée, et un retour clair vers l’admin.

**Why this priority**: Le commercial Dakar a besoin d’un back-office ; l’impersonation non cadrée est un risque légal.

**Independent Test**: Compte admin : confirmer un paiement, impersonner avec motif, vérifier le bandeau « vue démo », revenir, consulter le journal.

**Acceptance Scenarios**:

1. **Given** un paiement en attente, **When** l’opérateur le confirme, **Then** le commerce passe au plan payé et l’action est tracée.
2. **Given** une impersonation, **When** elle démarre, **Then** un motif est enregistré et le patron n’est pas confondu avec l’admin à l’écran.
3. **Given** un compte non admin, **When** il tente une URL admin, **Then** l’accès est refusé.

---

### Edge Cases

- Que se passe-t-il si deux clientes confirment le même créneau au même instant ?
- Comment le système réagit si le réseau 3G coupe pendant l’envoi d’un rappel ?
- Que voit le patron si sa fiche n’a ni horaires ni services ?
- Que se passe-t-il si un essai expire pendant qu’une cliente est en conversation ?
- Comment gérer un PIN oublié sans e-mail (le produit n’utilise pas l’e-mail) ?
- Que se passe-t-il si l’opérateur impersonne puis ferme l’onglet sans clôturer la session ?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système MUST n’afficher et n’agir que sur le commerce de la session, jamais sur un identifiant fourni par l’appareil.
- **FR-002**: Les utilisateurs MUST se connecter avec un numéro de téléphone sénégalais et un PIN, sans e-mail.
- **FR-003**: Les PIN MUST être stockés de façon irrécupérable ; les sessions MUST être protégées contre le vol via le navigateur (cookie non lisible en script, connexion sécurisée).
- **FR-004**: Le système MUST limiter les tentatives de PIN, appliquer un délai progressif, journaliser, et permettre une déconnexion globale.
- **FR-005**: Chaque action métier MUST vérifier le rôle (patron, personnel futur, super-admin) côté serveur.
- **FR-006**: La secrétaire MUST détecter la langue (FR/WO), l’intention (accueil, horaires, lieu, prix, réservation, report, annulation, devis, transfert, inconnu) et extraire date, heure, service, nom quand c’est possible.
- **FR-007**: La secrétaire MUST suivre des états de conversation contrôlés (nouvelle, collecte, confirmation, terminée, humain, annulée) sans sauter au hasard.
- **FR-008**: La secrétaire MUST NEVER inventer prix, horaires, services, disponibilités, adresse ou conditions.
- **FR-009**: Le système MUST proposer un transfert humain avec message clair au client et file « action requise » pour le patron (répondre, prendre la main, clôturer, rendre la main).
- **FR-010**: Une fonction unique de disponibilité MUST s’appliquer à toutes les prises de rendez-vous (horaires, fermetures, durée, conflits).
- **FR-011**: Les rendez-vous MUST avoir des statuts clairs (en attente, confirmé, fait, annulé, absent) et des dates d’annulation / confirmation.
- **FR-012**: Les rappels de la veille MUST partir au plus une fois par rendez-vous.
- **FR-013**: Les devis MVP MUST être du texte structuré (lignes, total, note, expiration), sans document PDF.
- **FR-014**: L’essai de 7 jours et le statut d’abonnement (essai, actif, impayé, suspendu, résilié, expiré) MUST être calculés côté serveur.
- **FR-015**: Les plans Micro, Standard et Pro MUST rester à 1 500 / 3 000 / 6 000 F pour ce périmètre.
- **FR-016**: Un paiement manuel MUST enregistrer opérateur (Wave / OM), montant, référence, statuts (en attente, confirmé, rejeté) et l’identité de qui a confirmé.
- **FR-017**: Le simulateur de démo MUST fonctionner sans WhatsApp Business ; le même métier MUST pouvoir plus tard recevoir les vrais messages sans changer la logique secrétaire.
- **FR-018**: L’accueil MUST montrer le quotidien (messages, RDV, files), pas un tableau analytique complexe.
- **FR-019**: La configuration « apprendre à Assistant Bi » MUST couvrir activité, services, horaires, prix, règles, réponses, avec un pourcentage de préparation, sans jargon d’IA.
- **FR-020**: L’interface MUST être utilisable en français ou en wolof, boutons ≥ 48 px, lisible sur Android entrée de gamme.
- **FR-021**: Le back-office MUST permettre de voir essais, abonnements, paiements à valider, suspensions, et d’agir (confirmer, suspendre, +7 jours).
- **FR-022**: L’impersonation MUST être limitée, motivée, journalisée (qui, quel commerce, début, fin, motif).
- **FR-023**: Le nom affiché partout MUST être Assistant Bi.
- **FR-024**: Les événements sensibles (connexion, paiement, suspension, impersonation, handoff) MUST être traçables.

### Key Entities

- **Commerce** : activité d’un professionnel (identité, quartier, horaires, langue, ton, règles).
- **Utilisateur** : personne qui se connecte (patron, personnel, super-admin) liée à au plus un commerce, sauf super-admin.
- **Client** : personne qui écrit sur WhatsApp / simulateur.
- **Conversation / Message** : fil et contenus, langue, intention, statut (ouvert, en attente, résolu, humain).
- **Prestation** : nom, prix, durée, disponibilité.
- **Rendez-vous** : créneau, service, statuts, rappel associé.
- **Devis** : lignes, total, statut, expiration.
- **Abonnement** : plan, essai, période, statut.
- **Paiement** : moyen, montant, référence, confirmation humaine.
- **Événement d’audit** : qui a fait quoi, sur quel commerce, quand.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un commercial peut faire une démo complète (message → RDV visible dans l’agenda) en moins de 5 minutes sur un téléphone.
- **SC-002**: 100 % des écrans testés à 375 px de large restent utilisables sans défilement horizontal.
- **SC-003**: Un patron d’un commerce A ne peut obtenir aucune information du commerce B, y compris en changeant l’adresse dans le navigateur.
- **SC-004**: Sur 10 demandes dont la réponse est dans la fiche, 10 réponses restent fidèles à la fiche (0 invention de prix ou d’horaire).
- **SC-005**: Un créneau ne peut pas être confirmé deux fois pour des réservations incompatibles.
- **SC-006**: Relancer le rappel de la veille n’envoie pas un second message au client.
- **SC-007**: Un essai expiré coupe l’accès métier même si l’horloge de l’appareil est fausse.
- **SC-008**: Un patron peu à l’aise avec le numérique comprend l’accueil et la config sans formation (test terrain : consigne orale seule, tâche « voir les RDV du jour » réussie du premier coup).
- **SC-009**: Chaque paiement confirmé et chaque impersonation laisse une trace consultable dans le back-office.

## Assumptions

- Le MVP actuel (landing, `/demo`, `/app`, `/login`, `/admin`, seed salon / garage) est le point de départ ; on n’écrit pas un second produit.
- Wave et Orange Money restent manuels jusqu’à NINEA/RCCM ; l’automatisation est préparée, pas branchée.
- WhatsApp Cloud n’est pas exigé pour valider cette spec ; le simulateur suffit, le branchement réel vient après les identifiants.
- Hors périmètre : voix sortante, acomptes, PDF, SMS, compta, multi-sites, personnel multiple avancé (les rôles peuvent exister, l’UI staff n’est pas prioritaire).
- Un PIN oublié se gère pour l’instant via l’opérateur (pas d’e-mail) ; un parcours self-service OTP est futur.
- La landing glassmorphism déjà livrée est conservée ; le dashboard reste simple et clair.
- `project.md` reste le cahier détaillé ; cette spec est le contrat de livraison de la vague « commercialisable ».
