# Déploiement et continuité

SQLite en local. Production visée : PostgreSQL (Neon ou équivalent) + hébergeur Node (Vercel).

## Objectifs

| | Cible |
|---|---|
| RTO | 4 heures |
| RPO | 24 heures |
| Backup PG | Quotidien, rétention 30 jours |
| Test restauration | Une fois avant go-live, puis trimestriel |

## Sauvegarde PostgreSQL (prod)

1. Activer les backups automatiques du fournisseur (PITR si disponible).
2. Export manuel de contrôle : `pg_dump "$DATABASE_URL" -Fc -f backup.dump`
3. Stocker hors de la machine d’appli (object storage, autre région).

## Restauration

1. Créer une instance PG vide.
2. `pg_restore -d "$DATABASE_URL" backup.dump` (ou PITR fournisseur).
3. `npx prisma migrate deploy` si le schéma a avancé.
4. Vérifier login salon + un RDV du seed/prod.
5. Pointer `DATABASE_URL` de l’hébergeur, redéployer.

Ne pas restaurer par-dessus une prod encore saine sans copie.

## Secrets

Rotation de `SESSION_SECRET` : générer une nouvelle valeur, redéployer — **toutes les sessions sont invalidées** (les lignes `Session` en base restent mais le cookie HMAC ne vérifie plus). Prévenir les professionnels (reconnectez-vous).

Aucun secret dans les logs. `.env` n’est pas git.

## Alerting minimal MVP

- Vue `/admin` : bandeau si paiements pending > 24 h (détail `/admin/support`)
- Logs hébergeur : 5xx
- Support WhatsApp humain pour le reste

## Rétention (cron 03:00 UTC)

`GET /api/cron/retention?secret=CRON_SECRET`

- Conversations de plus de 12 mois : statut `archived`, texte masqué
- Comptes `cancelled` dont `purgeAfter` est dépassé : PII effacée, **paiements conservés**
- Journaux d’audit : non supprimés (24 mois minimum)

## SQLite local (dev)

Fichier `dev.db` (gitignoré). Copie : fermer l’app, copier le fichier. Pas un plan de prod.

## Passage PostgreSQL (sans casser le local)

Le schéma Prisma n’utilise **pas** de SQL SQLite spécifique (`SELECT 1` marche des deux côtés). Pour un premier client payant :

1. Créer une base Neon (ou équivalent) en `Africa` / Europe proche.
2. Dans l’hébergeur uniquement : `DATABASE_URL=postgresql://...` et `APP_URL=https://...`
3. Dans `prisma/schema.prisma`, changer `provider = "sqlite"` → `provider = "postgresql"` **sur la branche / le projet de prod** (garder SQLite en local).
4. `npx prisma migrate deploy` (ou `db push` une fois sur l’instance vide).
5. Seed uniquement en démo, jamais sur une prod déjà peuplée.
6. Vérifier `GET /api/health` → `{ "ok": true }`.

Deux fichiers schéma séparés sont possibles plus tard ; jusqu’au premier pilote, un changement de `provider` au déploiement suffit.
