# Site Web Familial

Site web prive pour la famille, offrant un espace securise pour partager des moments, jouer ensemble et communiquer.

## Fonctionnalites

- **Calendrier** - Evenements familiaux, anniversaires, reunions
- **Jeux** - Collection de jeux avec classements (Piano Hero, Witch Case, Belle Bete Sage)
- **Album Photos** - Galerie organisee en albums (upload admin uniquement)
- **Forum** - Espace de discussion par categories

## Stack Technique

- **Frontend**: Next.js 14 (App Router)
- **Base de donnees**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Stockage**: Supabase Storage
- **Hebergement**: Vercel + Supabase (gratuit)

## Documentation

- [Specification complete](./SPEC.md) - Architecture, fonctionnalites, modeles de donnees
- [Maquette interactive](./mockup.html) - Ouvrir dans un navigateur pour visualiser le design

## Developpement

```bash
# Installation
npm install

# Lancer en local
npm run dev

# Migrations BDD
npx prisma migrate dev

# Build production
npm run build
```

## Securite

- Portail d'acces avec questions familiales
- Inscription sur invitation uniquement
- Reinitialisation de mot de passe par admin
- HTTPS, CSRF, rate limiting
