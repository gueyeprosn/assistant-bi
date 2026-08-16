# Résilience — Assistant Bi

Comportement en cas de panne. Détail produit : `assistant-bi-renforcement.md` §80.

## LLM (niveau 3)

Timeout **3 secondes**. Si indisponible, trop lent, ou plafond budget atteint :

1. Réponses par règles (fiche, horaires, tarifs) uniquement.
2. Si aucune règle : transfert au patron (« Je vais transmettre… »).
3. Jamais d’attente silencieuse.

Plafond : `LLM_MONTHLY_LIMIT_USD` (global). À 80 % : log d’alerte. Au-delà : règles seulement.

## WhatsApp Cloud

Envoi : **3 tentatives**, backoff 0,5 s → 1 s → 2 s.  
Échec : message marqué `failed` dans le fil, visible « non délivré » pour le patron. Rappels : le marquage J-1 est annulé si l’envoi échoue.

## Base de données

Page `/statut`. Le bot répond : « Je rencontre un problème technique, réessayez dans un instant. » Pas de stack trace.

## Rétention

Cron quotidien 03:00 UTC : conversations > 12 mois archivées (texte masqué) ; comptes résiliés purgés après 30 jours ; paiements jamais effacés.

## Budget LLM

Estimé ~0,002 USD / appel gpt-4o-mini. Compteur mensuel en mémoire processus (MVP) ; en prod viser un compteur persistant.
