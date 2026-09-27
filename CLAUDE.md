# Famille Website

Site familial prive avec portail securise.

@STATE.md

> **EN PAUSE depuis le 2026-09-27** : `SITE_PAUSED=true` sur Vercel, le site affiche la page statique `public/en-pause/index.html`. Ne pas deployer de feature ; procedure de relance dans `STATE.md`.

## Stack

- Next.js 15, React 18, Tailwind
- Prisma 5 + PostgreSQL (Supabase)
- NextAuth 5 (beta)
- Supabase Storage (photos, signed URLs)

## Securite

- Portail questions → login → roles : Admin / Member / Child
- RLS Supabase sur les donnees sensibles

## Features

- **Calendrier** : evenements familiaux
- **Photos** : albums avec Supabase Storage, signed URLs (video max 100MB)
- **Forum** : discussions familiales
- **Jeux** : Piano Hero v2, Belle Bete Sage (endless runner), Witch Case (stub) — Canvas + Web Audio

## Notifications

- **Email** : digest quotidien 18h ET via Vercel cron (pas fire-and-forget) — cron retire pendant la pause
- **Push** : Web Push API + service worker (opt-in, VAPID)

## Git & Deploy

- Dual remotes : `origin` = Forgejo, `github` = GitHub mirror
- Deploy : `git pull origin main` → `git push github main` → Vercel auto-deploy
- **JAMAIS `npx vercel --prod`** (Forgejo author non reconnu par Vercel)

## Commandes

```bash
npm run dev              # Dev server
npm test                 # 58 tests
npx prisma migrate dev   # Migrations
npm run db:seed          # Seed data
```

## Schema Prisma

11+ tables : User, Event, Album, Photo, Forum*, GameScore, etc.

## Env

```
DATABASE_URL
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
AUTH_SECRET
VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
RESEND_API_KEY
CRON_SECRET
SITE_PAUSED            # "true" = mode pause (middleware)
```

## Gotchas

- Video upload max 100MB via signed URLs
- NextAuth session refresh necessaire apres password reset
- Invitation codes expiry sans auto-cleanup (manuel)
- JAMAIS `npx vercel --prod` — toujours passer par le GitHub mirror
