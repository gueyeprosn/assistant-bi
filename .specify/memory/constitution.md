<!--
Sync Impact Report
- Version change: 0.0.0 (template) → 1.0.0
- Modified principles: placeholders → I–V Assistant Bi
- Added sections: Identité et périmètre ; Qualité et Definition of Done
- Removed sections: none (template placeholders replaced)
- Follow-up TODOs: none
-->

# Assistant Bi Constitution

## Core Principles

### I. Produit avant technologie
Assistant Bi est une secrétaire virtuelle sur WhatsApp pour petits
professionnels sénégalais, d’abord à Dakar. Le nom commercial MUST
être exclusivement **Assistant Bi**. Il est INTERDIT d’utiliser
SecrétAIRE Local, Assistant AI, Assistant Local, AI Secretary, ou
toute autre variante. L’expérience MUST rester simple, fiable, rapide
et humaine pour un smartphone Android entrée de gamme et un réseau 3G.
Chaque décision technique MUST répondre à : cela rend-il le produit
plus fiable pour ce professionnel ? Si elle ajoute de la complexité
sans bénéfice utilisateur réel, elle MUST être rejetée.

Priorité absolue : produit > fiabilité > sécurité > UX > performance
> maintenabilité > IA > effets visuels.

### II. Isolation des données (NON NÉGOCIABLE)
Chaque professionnel appartient à un commerce. Aucune donnée d’un
commerce MUST NEVER être lisible ou modifiable par un autre. Le
commerce actif MUST être déterminé depuis la session côté serveur.
Il est INTERDIT de faire confiance à un identifiant de commerce fourni
par le client. Toute page ou action sensible MUST être autorisée côté
serveur ; l’interface seule n’est jamais une preuve d’accès.

### III. Vérité métier avant intelligence artificielle
Le bot MUST s’appuyer d’abord sur les règles et la fiche métier
(horaires, tarifs, services, disponibilités, adresse). L’IA MUST
servir à reformuler ou à démêler une demande ambiguë, jamais à
inventer un prix, un créneau, un service ou une condition. Si
l’information manque, le système MUST transférer au patron ou
demander une précision. Le vocabulaire produit MUST rester métier
(réponses, horaires, règles) — jamais prompt, token, modèle.

### IV. Source de vérité côté serveur
Authentification (téléphone sénégalais + PIN), essai 7 jours,
abonnement, paiements et permissions MUST être décidés côté serveur.
Les PIN MUST être stockés de façon irrécupérable. Les sessions MUST
être HttpOnly, Secure, SameSite=Lax. Les rappels MUST être
idempotents. Les paiements Wave / Orange Money manuels MUST être
auditables. Le simulateur WhatsApp MUST continuer à fonctionner sans
compte Meta ; le moteur de conversation MUST parler à un canal de
messagerie, jamais directement à un fournisseur.

### V. Améliorer l’existant
Le travail part du code actuel. Préférer améliorer à remplacer, sauf
si l’architecture rend une évolution propre impossible. Toute
suppression importante MUST être justifiée. Ne PAS tout réécrire
simultanément. L’ordre obligatoire est : audit → fondations (auth,
isolation, sécurité) → domaine métier → expérience → intégrations
WhatsApp / paiements automatisés.

## Identité et périmètre

**Promesse** : Votre secrétaire, déjà sur WhatsApp. Moins d’appels
manqués, moins de rendez-vous oubliés, plus de clients servis.

**Cible** : salons, garages, infirmiers, artisans, indépendants ;
français et wolof natifs ; usage quotidien dans le navigateur mobile.

**Stack à conserver** sauf nécessité démontrée : Next.js 16 (App
Router), React 19, TypeScript, Prisma 6, SQLite en local, Tailwind 4.
Production visée : PostgreSQL + hébergement web + WhatsApp Cloud API.
Le passage PostgreSQL MUST rester compatible avec SQLite en
développement.

**Charte UI** : navy `#0B1F3A`, or `#C9A84C`, blanc. Landing marketing
peut utiliser le verre dépoli. Le dashboard MUST rester fond clair,
boutons ≥ 48 px, FR | WO jamais mélangés dans un même libellé.

**Hors MVP (INTERDIT d’implémenter maintenant)** : voix sortante,
acomptes clients, PDF, SMS, comptabilité, multi-sites, fonctions
enterprise, WhatsApp Cloud réel tant que les identifiants manquent.
L’architecture MAY préparer ces évolutions.

## Qualité et Definition of Done

Une fonctionnalité n’est terminée que si elle couvre : UI mobile, FR,
WO, chargement, vide, erreur, validation, autorisation, responsive,
accessibilité, tests, journalisation, documentation. Les actions
sensibles MUST aussi avoir un journal d’audit.

TypeScript strict ; pas de `any` inutile ; logique métier hors des
écrans ; validation centralisée. Aucun secret dans le dépôt.
Corriger plutôt que contourner. Tests critiques MUST exister avant
commercialisation : isolation des commerces, auth, agenda, handoff,
rappels, abonnement, admin.

## Governance

Cette constitution prime sur les habitudes de code, les prompts
ponctuels et les effets visuels. `project.md` est le cahier des
charges produit ; en cas de conflit d’exécution, la constitution
décide du *comment gouverner*, la spec active du *quoi livrer*.

Amendements : toute modification de principe MUST incrémenter la
version (MAJOR si rupture, MINOR si ajout, PATCH si clarification),
mettre à jour la date d’amendement, et être reflétée dans
`.specify/memory/constitution.md`. Les revues de code et les commandes
Spec Kit (`/speckit-specify`, `/speckit-plan`, `/speckit-implement`)
MUST vérifier la conformité avant d’ajouter une capacité hors MVP ou
de changer la stack.

Le critère de réussite commerciale est un SaaS simple à utiliser,
robuste en interne, prêt à passer du simulateur à WhatsApp, sans
démonstration technologique.

**Version**: 1.0.0 | **Ratified**: 2026-08-16 | **Last Amended**: 2026-08-16
