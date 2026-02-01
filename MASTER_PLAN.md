# Plan Directeur - Site Web Familial

> Document de suivi du projet. Dernière mise à jour: 2026-02-01 (soir)

---

## Statut Actuel

### Terminé
- [x] Setup Next.js 14 + Prisma + Supabase
- [x] Schéma base de données complet
- [x] Authentification NextAuth (credentials)
- [x] Portail de sécurité (questions familiales)
- [x] Pages connexion / inscription
- [x] Layout protégé avec navigation
- [x] Page d'accueil (dashboard)
- [x] Page jeux (liste)
- [x] Page classements (fonctionnelle)
- [x] Page photos (liste albums)
- [x] Page forum (liste catégories)
- [x] Page admin (dashboard)
- [x] Seed script pour données initiales
- [x] **Phase 1: Calendrier** (complet)
- [x] **Phase 2: Album Photos** (fonctionnel)
- [x] **Phase 3: Forum** (fonctionnel)
- [x] **Phase 4: Piano Hero v2** (premier jeu complet)

### En Cours
- [ ] **Phase 4: Jeux** - Autres jeux à venir (Piano Hero v1, Witch Case, Belle Bête Sage)

---

## Phase 1: Calendrier ✅

### 1.1 Backend
- [x] API GET `/api/events` - Liste des événements
- [x] API POST `/api/events` - Créer événement
- [x] API PUT `/api/events/[id]` - Modifier événement
- [x] API DELETE `/api/events/[id]` - Supprimer événement
- [x] API GET `/api/events/export` - Export iCal

### 1.2 Frontend
- [x] Installer composant calendrier (react-big-calendar)
- [x] Vue mensuelle avec événements
- [x] Vue hebdomadaire
- [x] Vue journalière
- [x] Modal création/édition événement
- [x] Sélecteur de catégorie avec couleurs
- [x] Support événements récurrents (anniversaires)

### 1.3 Fonctionnalités Avancées
- [x] Export iCal
- [x] Filtres par catégorie

---

## Phase 2: Album Photos ✅

### 2.1 Backend
- [x] API GET `/api/albums` - Liste albums
- [x] API GET `/api/albums/[id]` - Détail album avec photos
- [x] API POST `/api/albums` - Créer album (admin)
- [x] API PUT `/api/albums/[id]` - Modifier album (admin)
- [x] API DELETE `/api/albums/[id]` - Supprimer album (admin)
- [x] API POST `/api/photos/upload` - Upload photos (admin)
- [x] API GET `/api/photos/[id]` - Détail photo
- [x] API PUT `/api/photos/[id]` - Modifier caption (admin)
- [x] API DELETE `/api/photos/[id]` - Supprimer photo (admin)
- [x] API GET/POST `/api/photos/[id]/comments` - Commentaires
- [x] Intégration Supabase Storage

### 2.2 Frontend
- [x] Page `/photos/[albumId]` - Grille de photos
- [x] Lightbox avec navigation (clavier + boutons)
- [x] Commentaires sur photos (panneau latéral)
- [x] Téléchargement photo individuelle
- [ ] Téléchargement album complet (zip)

### 2.3 Admin Photos
- [x] Page `/admin/photos` - Gestion albums
- [x] Création album avec titre/description
- [x] Upload multiple
- [ ] Compression automatique côté client
- [ ] Définir photo de couverture
- [ ] Tags de personnes

---

## Phase 3: Forum ✅

### 3.1 Backend
- [x] API GET `/api/forum/categories` - Liste catégories (via page directe)
- [x] API GET `/api/forum/categories/[id]/topics` - Sujets d'une catégorie
- [x] API GET `/api/forum/topics/[id]` - Sujet avec réponses
- [x] API POST `/api/forum/topics` - Créer sujet
- [x] API POST `/api/forum/topics/[id]/replies` - Répondre
- [x] API PUT `/api/forum/topics/[id]/pin` - Épingler (admin)
- [x] API DELETE `/api/forum/topics/[id]` - Supprimer sujet
- [x] API DELETE `/api/forum/topics/[id]/replies/[replyId]` - Supprimer réponse
- [x] Protection CHILD role (middleware + API)

### 3.2 Frontend
- [x] Page `/forum/[categoryId]` - Liste des sujets
- [x] Page `/forum/[categoryId]/[topicId]` - Sujet et réponses
- [x] Formulaire nouveau sujet
- [x] Formulaire réponse avec citation
- [x] Formatage texte (gras, italique, liens)
- [x] Support emojis (natif dans le texte)
- [ ] Marquage lu/non-lu

### 3.3 Admin Forum
- [x] Épingler/désépingler sujets (dans la page sujet)
- [x] Supprimer sujets/réponses (dans la page sujet)
- [ ] Page `/admin/forum` - Modération dédiée
- [ ] Gérer catégories (CRUD)

---

## Phase 4: Jeux 🎮

> Style: **Friendly Cyberpunk** - Neons chaleureux (terracotta, bleu famille) sur fond sombre

### 4.1 Infrastructure Commune ✅
- [x] API POST `/api/games/scores` - Soumettre score
- [x] API GET `/api/games/scores` - Classement (query param `game`)
- [x] Variables CSS cyberpunk dans `globals.css`
- [x] `GameWrapper.tsx` - Wrapper réutilisable (auth, score submit)
- [x] `GameOverlay.tsx` - Menu/Pause/GameOver overlays
- [x] `GameControls.tsx` - Boutons start/pause/mute
- [x] `MobileControls.tsx` - Contrôles tactiles

### 4.2 Piano Hero v2 (Premier jeu) ✅
- [x] Cloner repo `Le-King-Fu/piano_hero_v2`
- [x] Porter `config.ts` avec palette friendly cyberpunk
- [x] Porter `Note.ts` (entité note qui tombe)
- [x] Porter `Renderer.ts` (canvas, effets visuels)
- [x] Porter `Audio.ts` (Web Audio API, sons 8-bit)
- [x] Créer hooks React:
  - [x] `useGameLoop.ts` (requestAnimationFrame)
  - [x] Input intégré dans composant principal
  - [x] Audio class avec wrapper
- [x] Créer `PianoHeroGame.tsx` (composant principal)
- [x] Créer page `/jeux/[gameId]` dynamique
- [x] Intégrer soumission score via API
- [x] Support mobile (touches piano tactiles)

### 4.3 Autres Jeux (À venir)
- [ ] Piano Hero (v1)
- [ ] Witch Case
- [ ] Belle Bête Sage

### 4.4 Classements (Amélioration future)
- [ ] Filtres: tout le temps / ce mois / cette semaine
- [ ] Classement personnel (historique)
- [ ] Badges/achievements (optionnel)

---

## Phase 5: Administration

### 5.1 Gestion Utilisateurs
- [ ] Page `/admin/utilisateurs` - Liste membres
- [ ] Voir détails utilisateur
- [ ] Modifier rôle (Admin/Membre/Enfant)
- [ ] Réinitialiser mot de passe (génère mot de passe temporaire)
- [ ] Désactiver/réactiver compte

### 5.2 Questions de Sécurité
- [ ] Page `/admin/questions` - Gérer questions
- [ ] Ajouter/modifier/supprimer questions
- [ ] Activer/désactiver questions
- [ ] Réordonner questions

### 5.3 Codes d'Invitation
- [ ] Page `/admin/invitations` - Gérer codes
- [ ] Générer nouveau code
- [ ] Voir codes actifs/utilisés/expirés
- [ ] Révoquer code non utilisé

---

## Phase 6: Tests

### 6.1 Setup
- [ ] Installer Vitest + Testing Library
- [ ] Configurer `vitest.config.ts`
- [ ] Installer Playwright pour E2E
- [ ] Créer structure `__tests__/`

### 6.2 Tests Unitaires
- [ ] Tests utilitaires (formatage dates, validation)
- [ ] Tests helpers authentification
- [ ] Tests transformations données

### 6.3 Tests Intégration (API Routes)
- [ ] Tests `/api/security/verify` (portail)
- [ ] Tests `/api/auth/register`
- [ ] Tests `/api/events` CRUD
- [ ] Tests `/api/games/scores`

### 6.4 Tests E2E (Playwright)
- [ ] Flow: Portail → Connexion → Dashboard
- [ ] Flow: Inscription avec code invitation
- [ ] Flow: Créer événement calendrier
- [ ] Flow: Parcourir album photos
- [ ] Flow: Créer sujet forum
- [ ] Flow: Jouer et soumettre score

### 6.5 CI/CD
- [ ] Créer `.github/workflows/ci.yml`
- [ ] Job: Lint + Build
- [ ] Job: Tests unitaires
- [ ] Job: Tests E2E

---

## Phase 7: Documentation

### 7.1 Documentation Technique
- [ ] Mettre à jour `README.md` (instructions complètes)
- [ ] Créer `docs/API.md` (référence endpoints)
- [ ] Documenter schéma base de données

### 7.2 Documentation Utilisateur
- [ ] Créer `docs/GUIDE_UTILISATEUR.md`
  - [ ] Comment se connecter
  - [ ] Utiliser le calendrier
  - [ ] Parcourir les photos
  - [ ] Participer au forum
  - [ ] Jouer aux jeux

### 7.3 Documentation Admin
- [ ] Créer `docs/GUIDE_ADMIN.md`
  - [ ] Gérer les membres
  - [ ] Configurer les questions de sécurité
  - [ ] Créer des codes d'invitation
  - [ ] Uploader des photos
  - [ ] Modérer le forum

---

## Phase 8: Infrastructure & Déploiement

### 8.1 Configuration Supabase
- [ ] Créer projet Supabase (free tier)
- [ ] Configurer base PostgreSQL
- [ ] Créer bucket Storage pour photos (public/photos)
- [ ] Configurer policies Storage (admin upload, public read)
- [ ] Noter les clés API (URL, anon key, service role key)

### 8.2 Déploiement Vercel
- [ ] Connecter repo GitHub à Vercel
- [ ] Configurer variables d'environnement:
  - [ ] `DATABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `AUTH_SECRET`
  - [ ] `NEXTAUTH_URL`
- [ ] Créer `vercel.json` si nécessaire
- [ ] Intégration Vercel (preview sur PR)
- [ ] Tester preview deployment
- [ ] Déployer en production

### 8.3 Base de Données Production
- [ ] Exécuter migrations: `npx prisma migrate deploy`
- [ ] Exécuter seed: `npm run db:seed`
- [ ] Vérifier données initiales (admin, questions)
- [ ] Tester connexion depuis l'app

### 8.4 Créer `docs/DEPLOYMENT.md` (procédure déploiement)

---

## Phase 9: Finitions & Production

### 9.1 UX/UI
- [ ] Mode sombre (toggle dans header)
- [ ] Animations et transitions
- [ ] États de chargement (skeletons)
- [ ] Messages d'erreur conviviaux
- [ ] Pages 404 et erreur personnalisées

### 9.2 Performance
- [ ] Optimisation images (next/image)
- [ ] Lazy loading composants lourds
- [ ] Pagination des listes longues
- [ ] Cache API (React Query configuré)

### 9.3 Sécurité Production
- [ ] Headers sécurité (CSP, X-Frame-Options, etc.)
- [ ] Rate limiting sur endpoints sensibles
- [ ] Validation stricte des entrées
- [ ] Audit dépendances (`npm audit`)

### 9.4 Monitoring
- [ ] Intégrer Sentry (error tracking)
- [ ] Configurer alertes Vercel
- [ ] Logs structurés

### 9.5 Domaine & DNS
- [ ] Choisir nom de domaine
- [ ] Configurer DNS
- [ ] Certificat SSL (automatique Vercel)

---

## Ordre de Priorité Recommandé

```
1. Phase 1: Calendrier                    ← Fonctionnalité principale
2. Phase 3: Forum                         ← Communication famille
3. Phase 2: Album Photos                  ← Partage souvenirs
4. Phase 4: Jeux                          ← Divertissement
5. Phase 5: Administration                ← Gestion complète
6. Phase 6: Tests                         ← Qualité & stabilité
7. Phase 7: Documentation                 ← Guides utilisateurs
8. Phase 8: Infrastructure & Déploiement  ← Mise en ligne
9. Phase 9: Finitions                     ← Polish final
```

---

## Notes & Décisions

### Questions Ouvertes
- [ ] Nom de domaine souhaité ?
- [ ] Liste des membres initiaux à inscrire ?
- [ ] Questions de sécurité spécifiques ?
- [ ] Catégories de forum souhaitées ?

### Décisions Prises
- Pas de service email (réinitialisation par admin uniquement)
- Upload photos réservé à l'admin
- Rôle "Enfant" = accès jeux uniquement

---

## Changelog

| Date | Modification |
|------|--------------|
| 2026-02-01 | **Piano Hero v2 terminé** - Infrastructure jeux (GameWrapper, overlays, contrôles), composant principal, API scores, page dynamique `/jeux/[gameId]`, support mobile |
| 2026-02-01 | Début Phase 4 Jeux - Intégration Piano Hero v2 (friendly cyberpunk) |
| 2026-02-01 | Phase 2 Album Photos implémentée (albums, upload, lightbox, commentaires) |
| 2026-02-01 | Phase 3 Forum implémentée (sujets, réponses, citations, modération) |
| 2026-02-01 | Phase 1 Calendrier terminée (filtres catégorie + export iCal) |
| 2026-01-31 | Création du plan directeur |
