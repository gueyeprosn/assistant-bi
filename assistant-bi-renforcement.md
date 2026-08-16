# ASSISTANT BI — DOCUMENT DE RENFORCEMENT

Ce document complète `project.md` (le mega-prompt existant). Il ne le remplace pas : il comble les angles morts qu'un audit de mise en production professionnelle ferait remonter. À intégrer comme sections 77+ ou en annexe.

---

## POURQUOI CE RENFORCEMENT

Le mega-prompt actuel couvre très bien : produit, UX, architecture applicative, RBAC, moteur conversationnel, design system, roadmap.

Il ne couvre pas encore, ou insuffisamment :

1. Conformité légale sénégalaise (protection des données)
2. Catalogue d'erreurs standardisé et exhaustif
3. Résilience opérationnelle (panne LLM, panne WhatsApp, panne DB)
4. Politique de rétention et de suppression des données
5. Coûts d'exploitation et garde-fous budgétaires (LLM, hosting)
6. Support client et métriques de succès produit
7. Plan de sortie MVP / checklist de lancement commercial
8. Sécurité applicative détaillée (au-delà des principes déjà posés)
9. Continuité de service (backups, disaster recovery)

Chaque section ci-dessous est écrite dans le même style que le document original (directives à un agent), pour pouvoir être copiée-collée telle quelle.

---

# 77. CONFORMITÉ LÉGALE SÉNÉGAL

Assistant Bi traite des données personnelles de clients finaux (téléphones, noms, rendez-vous) pour le compte de professionnels sénégalais. Cela relève de la loi n°2008-12 sur la protection des données à caractère personnel, sous supervision de la **CDP** (Commission de protection des Données personnelles).

Obligations minimales à respecter dès le MVP :

```text
- Déclaration/autorisation CDP avant collecte de données à grande échelle
- Politique de confidentialité accessible depuis la landing et le dashboard
- Conditions Générales d'Utilisation (CGU) et Conditions Générales de Vente (CGV)
- Finalité de collecte clairement définie (gestion de rendez-vous, pas de revente de données)
- Droit d'accès, de rectification et de suppression pour le client final
- Consentement implicite via l'usage de WhatsApp documenté dans les CGU
```

Ne pas confondre avec le RGPD européen : la base légale et l'autorité de contrôle sont différentes, mais les bonnes pratiques (minimisation, finalité, sécurité) restent les mêmes et doivent être appliquées par défaut.

Créer :

```text
docs/legal/politique-confidentialite.md
docs/legal/cgu.md
docs/legal/cgv.md
```

---

# 78. RÉTENTION ET SUPPRESSION DES DONNÉES

Définir une politique claire de cycle de vie des données.

```text
Conversations      → conservées 12 mois glissants, puis archivées
Messages           → liés au cycle de la conversation
Clients (Customer) → conservés tant que le Business est actif
Payments           → conservés 5 ans (obligation comptable)
AuditLogs          → conservés 24 mois minimum
```

Prévoir une fonctionnalité, même simple pour le MVP :

```text
requestAccountDeletion()
```

Lorsqu'un `Business` résilie :

```text
- accès suspendu immédiatement
- données conservées 30 jours (période de grâce / réactivation)
- purge définitive après 30 jours, sauf obligations légales (paiements)
```

Ne jamais supprimer un `Payment` confirmé, même après suppression du compte.

---

# 79. CATALOGUE D'ERREURS STANDARDISÉ

Le document original définit le format d'erreur (section 62) mais pas le catalogue. Le créer explicitement pour éviter des codes ad hoc incohérents entre les développeurs.

```text
AUTH_INVALID_CREDENTIALS
AUTH_ACCOUNT_LOCKED
AUTH_SESSION_EXPIRED
AUTH_PERMISSION_DENIED

BUSINESS_NOT_FOUND
BUSINESS_SUSPENDED

APPOINTMENT_SLOT_UNAVAILABLE
APPOINTMENT_NOT_FOUND
APPOINTMENT_ALREADY_CANCELLED
APPOINTMENT_OUTSIDE_HOURS

QUOTE_EXPIRED
QUOTE_NOT_FOUND

SUBSCRIPTION_TRIAL_EXPIRED
SUBSCRIPTION_PAST_DUE
SUBSCRIPTION_SUSPENDED

PAYMENT_ALREADY_CONFIRMED
PAYMENT_INVALID_REFERENCE

WEBHOOK_INVALID_SIGNATURE
WEBHOOK_DUPLICATE_EVENT

VALIDATION_ERROR
RATE_LIMITED
INTERNAL_ERROR
```

Règle : chaque code d'erreur doit être documenté dans `docs/api-reference.md` avec le message utilisateur FR et WO correspondant. Le bot conversationnel ne doit jamais exposer un code d'erreur technique au client final — uniquement une reformulation humaine ou un `TRANSFER_TO_HUMAN`.

---

# 80. RÉSILIENCE ET DÉGRADATION GRACIEUSE

Le mega-prompt prévoit l'architecture (providers abstraits) mais pas le comportement en cas de panne. Définir explicitement :

## Panne LLM (niveau 3 de l'IA)

```text
Si le LLM est indisponible ou trop lent (timeout > 3s) :
→ fallback automatique sur les réponses de niveau 1 (règles déterministes)
→ si aucune règle ne correspond : TRANSFER_TO_HUMAN
→ ne jamais faire attendre le client sans réponse
```

## Panne WhatsApp Cloud API

```text
Si l'envoi échoue :
→ retry avec backoff exponentiel (3 tentatives max)
→ au-delà : marquer le message FAILED et alerter le dashboard
→ le professionnel doit voir "message non délivré" clairement
```

## Panne base de données

```text
→ page de statut simple ("Assistant Bi est temporairement indisponible")
→ ne jamais laisser une requête échouer silencieusement côté bot
→ le bot doit pouvoir répondre "Je rencontre un problème technique, réessayez dans un instant" plutôt que de planter
```

## Budget LLM

```text
Définir un plafond de dépense mensuel par Business et global.
Si le plafond global est atteint :
→ dégrader automatiquement vers le niveau 1/2 (règles) pour tous les Business
→ alerter l'admin avant d'atteindre le plafond (à 80 %)
```

---

# 81. SÉCURITÉ APPLICATIVE — DÉTAIL OPÉRATIONNEL

En complément de la section 36 du document original, préciser les seuils concrets.

```text
Rate limiting :
- API publique (webhook) : 60 req/min par IP
- Login : 5 tentatives / 15 min par numéro, puis verrouillage 30 min
- API dashboard : 120 req/min par session

Headers de sécurité obligatoires :
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security

Dépendances :
- audit automatique des packages (npm audit / Dependabot) à chaque PR
- pas de dépendance non maintenue depuis plus de 2 ans sans justification

Secrets :
- rotation de SESSION_SECRET documentée
- aucun secret dans les logs, même en cas d'erreur
```

Checklist OWASP à valider avant chaque mise en production majeure :

```text
✓ Injection (Prisma paramétré, pas de requêtes brutes non échappées)
✓ Broken authentication (Argon2id, verrouillage, sessions sécurisées)
✓ Broken access control (RBAC vérifié côté serveur, jamais côté client)
✓ Security misconfiguration (headers, CORS strict)
✓ Vulnerable dependencies (audit régulier)
✓ Insufficient logging (audit log couvre les actions sensibles)
```

---

# 82. CONTINUITÉ DE SERVICE

```text
Backups PostgreSQL : quotidiens, rétention 30 jours minimum
Test de restauration : au moins une fois avant le lancement commercial, puis trimestriel
RTO (temps de reprise cible) : 4 heures
RPO (perte de données maximale acceptable) : 24 heures
```

Documenter dans `docs/deployment.md` la procédure de restauration pas à pas, pour qu'elle ne dépende pas d'une seule personne.

---

# 83. SUPPORT CLIENT ET MÉTRIQUES DE SUCCÈS

Le document définit très bien le produit, peu la mesure de sa réussite commerciale.

## Canal de support

```text
Support MVP : WhatsApp direct vers l'équipe Assistant Bi (numéro dédié)
Page /admin/support : liste des demandes entrantes, statut, réponse
```

## Métriques produit à suivre dès le MVP

```text
Activation      : % de Business ayant terminé l'onboarding en < 24h
Configuration   : % de Business à plus de 80 % de configuration (indicateur déjà prévu section 19)
Rétention essai : % d'essais convertis en abonnement payant
Churn mensuel   : % d'abonnements résiliés / annulés
Taux de handoff : % de conversations transférées à un humain (doit baisser dans le temps)
Taux de complétion de réservation : messages BOOK_APPOINTMENT → BOOKED
```

Ces métriques doivent apparaître dans `/admin` (au moins en lecture simple), pas seulement dans un outil analytique externe.

---

# 84. GO-LIVE CHECKLIST — LANCEMENT COMMERCIAL DAKAR

Avant le premier client payant réel, valider :

```text
✓ PIN jamais en clair, testé sur environnement de prod
✓ Isolation multi-tenant testée avec 2 Business réels en parallèle
✓ Paiement manuel Wave/Orange Money confirmé de bout en bout
✓ Politique de confidentialité et CGU publiées et liées depuis la landing
✓ Numéro de support WhatsApp opérationnel et surveillé
✓ Sauvegarde PostgreSQL testée et restaurable
✓ Alerting minimal en place (erreurs serveur, paiements en attente > 24h)
✓ Un scénario de panne LLM testé manuellement (le bot dégrade sans planter)
✓ Formation ou guide simple envoyé aux 3-5 premiers professionnels pilotes
```

Recommandation : lancer avec un nombre restreint de professionnels pilotes (3 à 5) à Dakar avant ouverture large, pour valider en conditions réelles la fiabilité du moteur conversationnel FR/Wolof.

---

# 85. DOCUMENTS À AJOUTER À LA LISTE DES LIVRABLES

En complément de la section 72 du document original :

```text
docs/legal/politique-confidentialite.md
docs/legal/cgu.md
docs/legal/cgv.md
docs/error-catalog.md
docs/resilience.md
docs/support-and-metrics.md
docs/go-live-checklist.md
```

---

## RÉSUMÉ DES AJOUTS

| Domaine | Ce que le document original couvre | Ce que ce renforcement ajoute |
|---|---|---|
| Sécurité | Principes généraux (36, 37) | Seuils concrets, checklist OWASP |
| Données | RBAC, isolation multi-tenant | Rétention, suppression, conformité CDP Sénégal |
| Erreurs | Format JSON (62) | Catalogue de codes exhaustif |
| Fiabilité | Providers abstraits (34, 35) | Comportement explicite en cas de panne |
| Continuité | — | Backups, RTO/RPO, procédure de restauration |
| Business | Plans, essai, paiement | Métriques de succès, support client, checklist de lancement |

Priorité d'intégration suggérée : sections 79 (erreurs) et 80 (résilience) dès la Phase 2 (Fondations) du plan original, car elles conditionnent la fiabilité perçue par l'utilisateur final dès les premiers tests. Les sections légales (77, 78) doivent être traitées avant tout lancement commercial réel, pas en fin de projet.
