# STATE — famille-website

> Derniere MAJ : 2026-09-27 (mise en pause du projet)

## Position actuelle
**EN PAUSE depuis le 2026-09-27.** `SITE_PAUSED=true` sur Vercel (production) : toutes les pages de `www.mafamillelandry.ca` affichent la page statique « La maison fait la sieste » (`public/en-pause/index.html`, FR/EN) et `/api/*` repond 503 (PR #9). Cron `email-digest` retire de `vercel.json`.

Etat au gel : le site etait deja hors service. Le projet Supabase `ooxogzzqpearlqbahurx` ne repond plus (pooler : `tenant/user not found`, DNS du projet non resolu), probablement supprime apres une auto-pause d'inactivite. Aucun dump possible, aucune donnee a conserver (quasi pas de photos). Domaine `mafamillelandry.ca` (Namecheap) volontairement **non renouvele** : la page de pause disparait a son expiration.

## Relance (dans l'ordre)
1. Domaine : s'il a expire, le racheter chez Namecheap, puis le repointer vers Vercel (projet `famille-website`).
2. Base neuve : Supabase (nouveau projet) ou PostgreSQL du VPS (voir `la-compagnie-maximus/migration-famille-website.md`). `npx prisma migrate deploy` puis `npm run db:seed`. Storage photos : nouveau bucket Supabase ou MinIO.
3. Secrets (#8) : generer de nouvelles valeurs pour tout (`DATABASE_URL`, cles Supabase, `AUTH_SECRET`, `RESEND_API_KEY`, `VAPID_*`, `CRON_SECRET`) et les poser sur Vercel par stdin, flag Sensitive. Fermer #8.
4. `vercel.json` : remettre `{"path": "/api/cron/email-digest", "schedule": "0 23 * * *"}` dans `crons`.
5. Vercel : retirer `SITE_PAUSED` (`npx vercel env rm SITE_PAUSED production`), puis deployer via `git push github main` (jamais `npx vercel --prod`).
6. Defenseur : `auto.enabled: true` dans `defenseurs/agents/defenseur-famille/config.json`, **en local ET sur le VPS** (`deploy.sh` ne synchronise pas les `config.json`). Le scan quotidien n'a jamais ete coupe.
7. #8 : repasser en `status:ready` si la rotation n'est pas faite a l'etape 3.
8. Mettre a jour ce fichier, la section « Projets en pause » de `~/claude-code/CLAUDE.md`, la table du skill `deploy` (+ copie vitrine) et la note du `masterplan.md` de la vitrine.

Laisses en place pendant la pause : projet Vercel et ses variables d'env, compte Resend, repo Forgejo non archive, miroir GitHub, scan Defenseur quotidien.

## Decisions recentes
- 2026-09-27 : Projet mis sur la glace (manque d'usage). Page de pause humoristique plutot qu'un 503 nu. Interrupteur `SITE_PAUSED` dans le middleware (avant l'auth) plutot qu'un deploiement separe, pour une relance en une variable. Supabase constate hors service : pas de dump, pas de rotation des secrets DB (plus rien a proteger). Domaine laisse a l'expiration. Defenseur `auto` coupe, #8 bloquee.

## Blockers actifs
- Projet en pause (decision de Max, 2026-09-27).
