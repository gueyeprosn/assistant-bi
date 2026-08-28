---
name: assistant-bi-ux
description: "Master UX/UI ruleset for Assistant Bi (WhatsApp secretary SaaS for Dakar professionals). Use when designing, building, reviewing, or fixing any screen, component, flow, or copy in this product — dashboard, conversations, agenda, onboarding, pricing, business profile. Encodes product philosophy, mobile-first rules, design tokens, component library, states (empty/error/loading), accessibility, FR/WO i18n, and the final design test before shipping."
argument-hint: "[screen or component]"
metadata:
  author: assistant-bi
  version: "1.0.0"
---

# Assistant Bi — Master UX/UI Skill

## Rôle

Lead Product Designer + UX Researcher + UI Designer + Frontend Design Engineer du SaaS **Assistant Bi**.

Assistant Bi est une secrétaire IA destinée aux professionnels qui utilisent WhatsApp pour communiquer avec leurs clients. Le produit permet notamment :

- répondre automatiquement aux clients
- communiquer en français et wolof
- donner horaires, tarifs et informations
- prendre des rendez-vous
- proposer des créneaux alternatifs
- envoyer des rappels
- générer des devis texte
- permettre au professionnel de reprendre la conversation
- consulter les conversations
- consulter l'agenda
- gérer les informations de son commerce

Le produit est **mobile-first**. Le professionnel doit pouvoir gérer son activité depuis son téléphone sans installer d'application.

## 1. Philosophie produit

Assistant Bi doit donner cette impression :

> « Je regarde mon téléphone et je comprends immédiatement ce qui se passe dans mon commerce. »

Le produit ne doit jamais ressembler à un logiciel complexe destiné à des analystes. Il doit être :

simple · rapide · rassurant · professionnel · accessible · local · humain · intelligent

Ne jamais sacrifier la simplicité pour ajouter des fonctionnalités.

## 2. Principle Zero

Avant de modifier une interface : **DO NOT CODE FIRST**. Toujours suivre :

```
USER PROBLEM
  ↓
USER GOAL
  ↓
USER FLOW
  ↓
INFORMATION ARCHITECTURE
  ↓
WIREFRAME
  ↓
UI
  ↓
STATES
  ↓
RESPONSIVE
  ↓
ACCESSIBILITY
  ↓
CODE
  ↓
UX AUDIT
```

## 3. Mobile first

La priorité est :

1. téléphone
2. tablette
3. desktop

Le dashboard doit être parfaitement utilisable avec un pouce. Les actions principales doivent être facilement accessibles.

Éviter :

- petites zones tactiles
- tableaux impossibles à lire
- menus complexes
- informations trop denses
- boutons trop proches

## 4. Information architecture

La navigation principale doit rester simple. Structure cible :

- Accueil
- Conversations
- Agenda
- Clients
- Activité / statistiques
- Paramètres

Selon le plan utilisateur, certaines fonctionnalités peuvent être masquées. Ne jamais montrer des fonctionnalités auxquelles l'utilisateur n'a pas accès sans expliquer pourquoi.

## 5. Dashboard

Le dashboard doit répondre en moins de 5 secondes à :

> « Comment va mon activité aujourd'hui ? »

Hiérarchie recommandée :

**Header** — salutation, nom du commerce, statut de l'assistant.

```
Bonjour Awa 👋
Assistant actif ●
```

**KPI principaux** — afficher uniquement les informations utiles :

- rendez-vous aujourd'hui
- conversations à traiter
- nouveaux clients

Éviter les dashboards remplis de chiffres.

**Alertes** — exemples :

- « 2 conversations nécessitent votre réponse »
- « Votre assistant est déconnecté »
- « 3 rendez-vous demain »

**Prochain rendez-vous** — afficher heure, client, service, statut.

**Activité récente** — afficher uniquement les événements utiles.

## 6. Assistant status

Le statut de l'assistant doit toujours être visible. États : `ACTIVE`, `PAUSED`, `DISCONNECTED`, `ERROR`.

```
🟢 Assistant actif
🔴 Assistant déconnecté
```

Chaque statut doit expliquer clairement ce qu'il implique.

## 7. WhatsApp experience

L'expérience doit être inspirée des habitudes WhatsApp sans copier aveuglément WhatsApp.

Une conversation doit afficher : client, numéro, statut, messages, heure, langue détectée, rendez-vous éventuel.

**Message IA** — identifier clairement lorsqu'un message est généré par Assistant Bi.

```
Assistant Bi
« Bonjour, comment puis-je vous aider ? »
```

**Reprise par le professionnel** — action très visible :

```
[Reprendre la conversation]
```

Après activation : « Vous avez repris la conversation. » L'assistant ne doit plus répondre automatiquement tant que le professionnel garde la main.

## 8. Conversation states

Prévoir : nouveau message, réponse IA, IA en réflexion, réponse envoyée, attente utilisateur, intervention nécessaire, conversation transférée, erreur, conversation terminée.

Ne jamais afficher une conversation vide sans explication.

## 9. Agenda

L'agenda doit être conçu pour une personne qui travaille réellement avec ses clients.

Priorité : **Aujourd'hui** → **Demain** → **Semaine**.

Chaque rendez-vous doit afficher : heure, client, service, durée, statut.

Actions : confirmer, déplacer, annuler, contacter.

Éviter les calendriers complexes de type logiciel d'entreprise.

## 10. Rendez-vous

Lorsqu'un rendez-vous est créé, afficher une confirmation claire :

```
✓ Rendez-vous confirmé
Fatou Ndiaye
Braids longues
Aujourd'hui · 15:30 · 3 heures
```

Prévoir les états : confirmé, en attente, annulé, déplacé, absent.

## 11. Onboarding

L'onboarding doit être extrêmement court. Objectif : mettre le professionnel en capacité de tester Assistant Bi le plus rapidement possible.

```
Créer le compte
  ↓
Nom du commerce
  ↓
Type d'activité
  ↓
Services
  ↓
Prix
  ↓
Horaires
  ↓
Informations de contact
  ↓
Connexion WhatsApp
  ↓
Tester l'assistant
  ↓
Activer
```

Ne pas demander des informations inutiles. Afficher une progression (ex. « Étape 3 sur 6 »).

## 12. Business profile

Le professionnel doit pouvoir modifier facilement : nom, activité, adresse, téléphone, horaires, services, prix, durée, informations complémentaires, langue, comportement de l'assistant.

Utiliser des sections simples.

## 13. IA

L'IA ne doit jamais être mystérieuse. Toujours expliquer : ce qu'elle fait, ce qu'elle sait, ce qu'elle ne sait pas, quand elle laisse la main.

Assistant Bi doit être présenté comme **« votre secrétaire »**, et non comme **« un modèle d'intelligence artificielle complexe »**.

## 14. Trust

Le produit traite des conversations et données clients. L'UX doit donc communiquer : sécurité, confidentialité, contrôle, transparence.

Le professionnel doit toujours comprendre :

- Qu'est-ce que l'assistant peut faire ?
- Qu'est-ce que l'assistant ne peut pas faire ?
- Quand est-ce que je reprends la main ?

## 15. Pricing

Les offres doivent être compréhensibles immédiatement. Ne jamais comparer 20 fonctionnalités. Comparer les différences importantes : nombre de rendez-vous, devis, statistiques, fonctionnalités avancées.

Le CTA doit être évident.

## 16. Design language

Direction visuelle : **Modern African SaaS** — sans tomber dans les clichés visuels.

Le design doit être : premium, chaleureux, moderne, sobre, professionnel.

Éviter : gradients excessifs, glassmorphism généralisé, néons, animations inutiles, interfaces futuristes artificielles.

## 17. Design system

Créer des tokens centralisés. Exemple :

```css
--color-background
--color-surface
--color-surface-muted
--color-border
--color-text
--color-text-muted
--color-primary
--color-success
--color-warning
--color-error

--radius-sm
--radius-md
--radius-lg

--space-1
--space-2
--space-3
--space-4
--space-6
--space-8
```

Ne jamais inventer une couleur directement dans un composant si un token existe.

## 18. Typography

La typographie doit privilégier : lisibilité, caractères accentués, français, wolof, chiffres, données.

Limiter le nombre de styles.

## 19. Components

Créer une bibliothèque cohérente :

Button, IconButton, Input, Select, Textarea, Search, Tabs, Card, Badge, Avatar, Toast, Alert, Modal, Drawer, Dropdown, Tooltip, Sidebar, BottomNavigation, Header, KPI, ConversationItem, MessageBubble, AppointmentCard, ClientCard, EmptyState, ErrorState, LoadingState, Skeleton.

## 20. Responsive

- **Desktop** : sidebar + contenu.
- **Tablet** : sidebar réduite ou drawer.
- **Mobile** : header compact + bottom navigation.

Les écrans complexes doivent être transformés en workflows simples sur mobile.

## 21. Accessibility

Respecter WCAG. Vérifier : contraste, focus, clavier, labels, aria, taille tactile, messages d'erreur, navigation logique.

Minimum recommandé pour les zones tactiles : **44 × 44 px**.

## 22. Empty states

Chaque section doit avoir un état vide. Exemple :

```
Aucun rendez-vous aujourd'hui
« Votre agenda est libre pour le moment. »
[Voir cette semaine]
```

## 23. Error states

Les erreurs doivent être humaines.

Mauvais : `ERROR 500`

Bon :

```
« Impossible de charger vos conversations. »
[Réessayer]
```

## 24. Loading

Toujours utiliser : skeleton, progress indicator, feedback. Ne jamais afficher une page blanche.

## 25. Microinteractions

Animations rapides : 100–300ms. Utiliser les animations pour : confirmer une action, montrer un changement d'état, guider l'attention, indiquer un chargement. Pas pour décorer.

## 26. UX copy

Le langage doit être : simple, direct, humain, rassurant. Éviter le jargon technique.

Ne pas écrire : « Synchronisation du webhook WhatsApp en cours. »
Préférer : « Connexion à WhatsApp en cours… »

## 27. French + Wolof

Prévoir l'internationalisation dès la conception. Les interfaces doivent supporter les variations de longueur de texte. Ne jamais coder des textes directement dans les composants lorsqu'un système i18n existe.

## 28. UX audit

Après chaque modification importante, vérifier :

- **UX** — Le parcours est-il évident ?
- **UI** — Les éléments sont-ils alignés ?
- **Mobile** — Peut-on utiliser l'écran avec une seule main ?
- **Accessibility** — Tout est-il lisible et accessible ?
- **Performance** — L'interface reste-t-elle rapide ?
- **Consistency** — La nouvelle interface respecte-t-elle le Design System ?

Audit complet (first impression, user flow, states, AI UX, scoring /10) : voir [references/ux-audit.md](references/ux-audit.md). À exécuter avant **et** après toute modification importante de l'interface.

## 29. No blind redesign

Ne jamais refaire une interface simplement parce qu'elle pourrait être « plus jolie ». Identifier d'abord : problème, cause, impact, solution. Conserver ce qui fonctionne.

## 30. Product principle

Chaque écran doit avoir **UNE** priorité. Chaque bouton doit avoir **UNE** intention. Chaque information doit avoir **UNE** raison d'être. Chaque interaction doit avoir un feedback.

## 31. Final design test

Avant de considérer une interface terminée, poser :

1. Un nouveau professionnel comprend-il cette page ?
2. Peut-il effectuer l'action principale sans réfléchir ?
3. Peut-il comprendre ce qui vient de se passer ?
4. Peut-il récupérer d'une erreur ?
5. L'interface fonctionne-t-elle parfaitement sur téléphone ?
6. L'interface reste-t-elle cohérente avec Assistant Bi ?
7. Le produit paraît-il suffisamment fiable pour gérer les clients d'un commerce ?

Si une réponse est **NON** : ne pas considérer l'interface comme terminée.

## Master rule

Assistant Bi doit toujours privilégier :

**CLARTÉ · SIMPLICITÉ · CONFIANCE · RAPIDITÉ · BEAUTÉ**

Le design doit aider le professionnel à gérer son activité. Pas lui donner l'impression d'utiliser un logiciel complexe.
