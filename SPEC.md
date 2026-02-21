# Spécification - Site Web Familial

## Vue d'ensemble

Site web privé destiné aux membres de la famille, offrant un espace sécurisé pour partager des moments, jouer ensemble et communiquer.

---

## 1. Architecture Technique

### Stack technologique
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Base de données**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentification**: NextAuth.js + questions de sécurité personnalisées
- **Stockage d'images**: Supabase Storage
- **Hébergement**: Vercel (frontend) + Supabase (BDD + stockage)
- **Langue**: Français uniquement

### Estimation des coûts
| Service | Coût mensuel |
|---------|-------------|
| Vercel (Hobby) | Gratuit |
| Supabase (Free tier) | Gratuit |
| **Total** | **0€** |

*Note: Si le trafic dépasse les limites gratuites, Vercel Pro (20$/mois) et Supabase Pro (25$/mois) sont disponibles.*

---

## 2. Sécurité et Accès

### 2.1 Portail d'accès (Gatekeeping)
Avant même de voir la page de connexion, les visiteurs doivent répondre à 3 questions familiales:

**Exemples de questions:**
- "Quel est le prénom de la grand-mère maternelle ?"
- "Dans quelle ville les grands-parents se sont-ils rencontrés ?"
- "Quel est le plat préféré de Mamie pour Noël ?"

**Comportement:**
- 3 tentatives maximum
- Blocage de 15 minutes après 3 échecs
- Les questions sont configurables par l'administrateur

### 2.2 Authentification
- Inscription sur invitation uniquement (code d'invitation généré par admin)
- Connexion par email + mot de passe
- Mot de passe: minimum 8 caractères, 1 majuscule, 1 chiffre
- Session expirée après 7 jours d'inactivité
- Option "Se souvenir de moi" (30 jours)

### 2.3 Rôles utilisateurs
| Rôle | Permissions |
|------|-------------|
| Admin | Tout (gestion utilisateurs, questions, modération, upload photos) |
| Membre | Accès complet sauf upload photos |
| Enfant | Accès limité (pas de forum, jeux seulement) |

### 2.4 Gestion des mots de passe
- **Pas de service email requis**
- Réinitialisation par l'administrateur uniquement
- L'admin peut générer un nouveau mot de passe temporaire via le panneau d'administration
- L'utilisateur doit changer son mot de passe à la première connexion après réinitialisation

### 2.5 Mesures de sécurité
- HTTPS obligatoire
- Protection CSRF
- Rate limiting sur les endpoints sensibles
- Hashage des mots de passe (bcrypt)
- Validation et sanitization de toutes les entrées
- Headers de sécurité (CSP, X-Frame-Options, etc.)

---

## 3. Fonctionnalités

### 3.1 Calendrier Familial

**Description:** Calendrier partagé pour les événements familiaux.

**Fonctionnalités:**
- Vue mensuelle, hebdomadaire, journalière
- Catégories d'événements (anniversaires, réunions, vacances, etc.)
- Couleurs par catégorie
- Rappels par email (optionnel)
- Événements récurrents (anniversaires automatiques)
- Synchronisation iCal (export)

**Modèle de données:**
```
Event {
  id: UUID
  title: String
  description: String?
  startDate: DateTime
  endDate: DateTime?
  allDay: Boolean
  category: EventCategory
  createdBy: User
  recurrence: RecurrenceRule?
}
```

### 3.2 Jeux

**Description:** Collection de jeux existants (migrés depuis Site_Perso) avec ajout d'un système de classement centralisé.

#### Jeux existants à intégrer:

| Jeu | Type | Description |
|-----|------|-------------|
| **Piano Hero** | Rhythm | Notes qui tombent, appuyer sur les bonnes touches au bon moment |
| **Piano Hero v2** | Rhythm | Version modernisée avec système de vies et niveaux |
| **Witch_case** | Snake/Lettres | Collecter les lettres pour épeler "PASCAL" |
| **Belle Bête Sage** | Endless Runner | Choisir un chien, éviter obstacles, collecter pièces |

#### Modifications requises pour l'intégration:

1. **Authentification**: Récupérer l'ID utilisateur connecté
2. **Soumission des scores**: Appel API en fin de partie
3. **Affichage classement**: Modal ou page dédiée par jeu
4. **Données à capturer par jeu**:
   - Piano Hero: score, niveau de difficulté
   - Witch_case: score, difficulté, longueur du serpent
   - Belle Bête Sage: score, personnage choisi, niveau atteint

#### Système de classement:

```
GameScore {
  id: UUID
  game: GameType (PIANO_HERO | PIANO_HERO_V2 | WITCH_CASE | BELLE_BETE_SAGE)
  user: User
  score: Int
  metadata: JSON (difficulté, personnage, etc.)
  playedAt: DateTime
}
```

**Vues du classement:**
- Top 10 par jeu
- Classement personnel (historique)
- Filtres: tout le temps / ce mois / cette semaine

### 3.3 Album Photos

**Description:** Galerie de photos organisée en albums. **Upload réservé à l'administrateur.**

**Fonctionnalités Admin:**
- Création d'albums thématiques
- Upload multiple (drag & drop)
- Formats supportés: JPG, PNG, HEIC, WebP
- Compression automatique
- Gestion des tags de personnes

**Fonctionnalités Membres:**
- Consultation des albums et photos
- Diaporama
- Commentaires sur photos
- Recherche par date, album, personne
- Téléchargement (individuel ou album complet)

**Modèle de données:**
```
Album {
  id: UUID
  title: String
  description: String?
  coverPhoto: Photo?
  createdBy: User
  createdAt: DateTime
}

Photo {
  id: UUID
  album: Album
  url: String
  thumbnailUrl: String
  caption: String?
  takenAt: DateTime?
  uploadedBy: User
  tags: PersonTag[]
}
```

**Limites (free tier):**
- 1 Go de stockage total
- Photos redimensionnées à 2000px max

### 3.4 Forum / Messagerie

**Description:** Espace de discussion organisé par sujets.

**Fonctionnalités:**
- Catégories (Général, Recettes, Souvenirs, Organisation, etc.)
- Création de sujets (topics)
- Réponses avec citation
- Formatage basique (gras, italique, liens)
- Emojis
- Upload d'images dans les messages
- Notification par email (nouveau sujet, réponse)
- Marquage lu/non-lu
- Épingler des sujets importants (admin)

**Modèle de données:**
```
Category {
  id: UUID
  name: String
  description: String
  order: Int
}

Topic {
  id: UUID
  category: Category
  title: String
  content: String
  author: User
  isPinned: Boolean
  createdAt: DateTime
  lastReplyAt: DateTime
}

Reply {
  id: UUID
  topic: Topic
  content: String
  author: User
  quotedReply: Reply?
  createdAt: DateTime
}
```

### 3.5 Notifications

**Description:** Système de notifications multi-canal pour informer les membres de l'activité sur le site.

**Types de notification:**
| Type | Déclencheur |
|------|-------------|
| `MENTION` | Quelqu'un vous mentionne avec @Prénom |
| `QUOTE` | Quelqu'un cite votre réponse |
| `TOPIC_REPLY` | Quelqu'un répond à votre sujet |
| `NEW_EVENT` | Un nouvel événement est créé |

**Canaux:**

1. **Notifications in-app** — Toujours actives, cloche dans le header, marquage lu/non-lu
2. **Push (Web Push API)** — Opt-in, nécessite la souscription du navigateur, envoi immédiat
3. **Email (Resend)** — Opt-in par type, digest quotidien à 18h HE (un seul email récapitulatif)

**Préférences:** Chaque utilisateur peut activer/désactiver indépendamment push et email pour chaque type de notification. Les préférences sont configurables dans `/profil`.

**Modèle de données:**
```
NotificationPreference {
  id: UUID
  type: NotificationType
  pushEnabled: Boolean (default: true)
  emailEnabled: Boolean (default: false)
  userId: User
  @@unique([userId, type])
}
```

**Cron digest email:**
- Route : `GET /api/cron/email-digest` (sécurisée par `CRON_SECRET`)
- Fréquence : tous les jours à 23h UTC (18h HE)
- Collecte toutes les notifications des dernières 24h (y compris lues)
- Filtre par préférences `emailEnabled` de chaque utilisateur
- Envoie un email HTML groupé par type avec liens vers le site

---

## 4. Interface Utilisateur

### 4.1 Design
- Style: Moderne, chaleureux, familial
- Couleurs principales: Bleu doux (#4A90A4), Crème (#FFF8F0), Terracotta (#C17767)
- Police: Inter (sans-serif)
- Responsive (mobile-first)
- Mode sombre optionnel

### 4.2 Navigation
```
┌─────────────────────────────────────┐
│  🏠 Logo Famille    [Avatar] Menu   │
├─────────────────────────────────────┤
│  Accueil | Calendrier | Jeux |      │
│  Photos  | Forum      | Admin*      │
└─────────────────────────────────────┘
```

### 4.3 Pages
- `/` - Accueil (résumé: prochains événements, dernières photos, activité forum)
- `/calendrier` - Calendrier complet
- `/jeux` - Liste des jeux
- `/jeux/[type]` - Jeu spécifique
- `/jeux/classement` - Classements
- `/photos` - Galerie d'albums
- `/photos/[album]` - Album spécifique
- `/forum` - Liste des catégories
- `/forum/[category]` - Liste des sujets
- `/forum/[category]/[topic]` - Sujet et réponses
- `/profil` - Profil utilisateur
- `/admin` - Administration (admin seulement)

---

## 5. Plan de Développement

### Phase 1 - Fondations (MVP)
- [ ] Setup projet Next.js + Prisma + Supabase
- [ ] Système d'authentification complet
- [ ] Portail de sécurité (questions)
- [ ] Layout et navigation
- [ ] Page d'accueil

### Phase 2 - Calendrier
- [ ] Affichage calendrier
- [ ] CRUD événements
- [ ] Catégories et couleurs
- [ ] Événements récurrents

### Phase 3 - Album Photos
- [ ] Upload et stockage
- [ ] Gestion des albums
- [ ] Galerie et diaporama
- [ ] Commentaires

### Phase 4 - Forum
- [ ] Catégories et sujets
- [ ] Système de réponses
- [ ] Notifications

### Phase 5 - Jeux
- [ ] Infrastructure de jeux
- [ ] Quiz solo
- [ ] Système de classement
- [ ] Jeux additionnels

### Phase 6 - Finitions
- [ ] Mode sombre
- [ ] Optimisations performance
- [ ] Tests et corrections
- [ ] Documentation utilisateur

---

## 6. Variables d'Environnement Requises

```env
# Base de données
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Auth
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://famille.example.com

# Push Notifications (Web Push)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:admin@your-domain.com

# Email Notifications (Resend)
RESEND_API_KEY=xxx
RESEND_FROM_EMAIL=notifications@lacompagniemaximus.com

# Cron Jobs (Vercel)
CRON_SECRET=xxx
```

---

## 7. Commandes de Développement

```bash
# Installation
npm install

# Développement local
npm run dev

# Migrations base de données
npx prisma migrate dev

# Build production
npm run build

# Déploiement (via Vercel CLI)
vercel --prod
```

---

## 8. Questions Ouvertes

- [ ] Nom de domaine souhaité ? mafamillelandry.ca
- [ ] Liste des membres de la famille à inscrire initialement ?
- [ ] Questions de sécurité spécifiques à utiliser ? Oui, les questions réponses seront gérés dans l'interface administrateur
- [ ] Catégories de forum souhaitées ?
- [ ] Nom/titre du site ? Ma Famille Landry
