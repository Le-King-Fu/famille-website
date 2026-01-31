# Spécification - Calendrier Familial

> Version 1.0 - 2026-01-31

---

## Vue d'ensemble

Calendrier partagé pour les événements familiaux avec support des événements récurrents et images.

---

## 1. Modèle de Données

### Event (existant dans schema.prisma)

```prisma
enum EventCategory {
  BIRTHDAY    // Anniversaires (auto-recurring)
  REUNION     // Réunions de famille
  VACATION    // Vacances
  HOLIDAY     // Fêtes (Noël, Pâques...)
  OTHER       // Autres
}

model Event {
  id          String        @id @default(cuid())
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime?
  allDay      Boolean       @default(false)
  category    EventCategory @default(OTHER)
  color       String?       // Couleur personnalisée (hex)
  recurrence  Json?         // Règle de récurrence (RRULE format)
  imageUrl    String?       // URL image (Supabase Storage) - ADMIN ONLY
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  createdById String
  createdBy   User          @relation(fields: [createdById], references: [id])
}
```

### Champ à ajouter au schéma
```prisma
imageUrl    String?       // URL image associée à l'événement
```

---

## 2. Permissions

### Règles d'accès

| Action | ADMIN | MEMBER | CHILD |
|--------|-------|--------|-------|
| Voir calendrier | ✅ | ✅ | ✅ |
| Voir événements | ✅ | ✅ | ✅ |
| Créer événement | ✅ | ✅ | ❌ |
| Modifier ses événements | ✅ | ✅ | ❌ |
| Modifier tous les événements | ✅ | ❌ | ❌ |
| Supprimer ses événements | ✅ | ✅ | ❌ |
| Supprimer tous les événements | ✅ | ❌ | ❌ |
| Ajouter/modifier image | ✅ | ❌ | ❌ |

### Authentification requise

- **Toutes les routes API** nécessitent une session authentifiée
- Vérification via `auth()` de NextAuth
- Retour `401 Unauthorized` si non connecté
- Retour `403 Forbidden` si permissions insuffisantes

---

## 3. API Endpoints

### GET `/api/events`

Liste les événements dans une plage de dates.

**Authentification**: Requise (tout utilisateur connecté)

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| start | ISO date | Oui | Date début de la plage |
| end | ISO date | Oui | Date fin de la plage |
| category | string | Non | Filtrer par catégorie |

**Response 200**:
```json
{
  "events": [
    {
      "id": "clx123...",
      "title": "Anniversaire Papa",
      "description": "65 ans!",
      "startDate": "2026-03-15T00:00:00Z",
      "endDate": null,
      "allDay": true,
      "category": "BIRTHDAY",
      "color": "#C17767",
      "imageUrl": "https://xxx.supabase.co/storage/v1/...",
      "recurrence": null,
      "createdBy": {
        "id": "user123",
        "firstName": "Marie",
        "lastName": "Landry"
      }
    }
  ]
}
```

**Response 401**: Non authentifié

---

### POST `/api/events`

Crée un nouvel événement.

**Authentification**: Requise (ADMIN ou MEMBER uniquement)

**Request Body**:
```json
{
  "title": "Réunion de famille",
  "description": "Chez Mamie",
  "startDate": "2026-04-10T14:00:00Z",
  "endDate": "2026-04-10T18:00:00Z",
  "allDay": false,
  "category": "REUNION",
  "color": "#4A90A4",
  "imageUrl": "https://...",
  "recurrence": {
    "frequency": "YEARLY",
    "interval": 1
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | Oui | Max 100 caractères |
| description | string | Non | Max 500 caractères |
| startDate | ISO date | Oui | |
| endDate | ISO date | Non | Doit être >= startDate |
| allDay | boolean | Non | Default: false |
| category | EventCategory | Non | Default: OTHER |
| color | string | Non | Format hex (#RRGGBB) |
| imageUrl | string | Non | **ADMIN uniquement** |
| recurrence | object | Non | Voir format ci-dessous |

**Recurrence Object**:
```json
{
  "frequency": "YEARLY" | "MONTHLY" | "WEEKLY" | "DAILY",
  "interval": 1,
  "until": "2030-12-31T00:00:00Z",
  "count": 10,
  "byDay": ["MO", "WE", "FR"],
  "byMonth": [1, 6, 12],
  "byMonthDay": [15]
}
```

**Response 201**: Événement créé
**Response 400**: Données invalides
**Response 401**: Non authentifié
**Response 403**: Permission refusée (CHILD ou imageUrl par non-admin)

---

### GET `/api/events/[id]`

Récupère un événement spécifique.

**Authentification**: Requise

**Response 200**: Événement complet
**Response 401**: Non authentifié
**Response 404**: Événement non trouvé

---

### PUT `/api/events/[id]`

Modifie un événement.

**Authentification**: Requise (créateur ou ADMIN)

**Request Body**: Mêmes champs que POST, tous optionnels

**Response 200**: Événement mis à jour
**Response 401**: Non authentifié
**Response 403**: Pas le créateur et pas admin
**Response 404**: Événement non trouvé

---

### DELETE `/api/events/[id]`

Supprime un événement.

**Authentification**: Requise (créateur ou ADMIN)

**Query Parameters** (pour événements récurrents):
| Param | Type | Description |
|-------|------|-------------|
| mode | string | `single` (cette occurrence), `future` (cette occurrence et suivantes), `all` (toutes) |

**Response 204**: Supprimé
**Response 401**: Non authentifié
**Response 403**: Pas le créateur et pas admin
**Response 404**: Événement non trouvé

---

## 4. Interface Utilisateur

### 4.1 Structure des fichiers

```
src/
├── app/(protected)/calendrier/
│   └── page.tsx                    # Page principale
├── components/calendar/
│   ├── Calendar.tsx                # Composant calendrier principal
│   ├── CalendarToolbar.tsx         # Navigation + sélecteur de vue
│   ├── EventModal.tsx              # Modal création/édition
│   ├── EventCard.tsx               # Affichage événement dans cellule
│   ├── EventDetail.tsx             # Vue détaillée d'un événement
│   ├── CategorySelect.tsx          # Sélecteur catégorie avec couleurs
│   ├── RecurrenceSelect.tsx        # Sélecteur récurrence
│   └── EventImage.tsx              # Composant image (placeholder si vide)
├── lib/
│   └── recurrence.ts               # Helpers rrule
```

### 4.2 Vues du calendrier

#### Vue Mensuelle
```
┌─────────────────────────────────────────────────────────────────┐
│  📅 Calendrier familial                      [+ Nouvel événement]
├─────────────────────────────────────────────────────────────────┤
│  [◀]  Janvier 2026  [▶]              [Mois] [Semaine] [Jour]    │
├─────────────────────────────────────────────────────────────────┤
│   Lun      Mar      Mer      Jeu      Ven      Sam      Dim     │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────┤
│    1    │    2    │    3    │    4    │    5    │    6    │  7  │
│ ┌─────┐ │         │         │         │         │ ┌─────┐ │     │
│ │ 🖼️  │ │         │         │         │         │ │ 🖼️  │ │     │
│ │Fête │ │         │         │         │         │ │Réun.│ │     │
│ └─────┘ │         │         │         │         │ └─────┘ │     │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┤
│    8    │    9    │   10    │   11    │   12    │   13    │ 14  │
│         │         │         │         │         │         │     │
│         │         │         │         │         │         │     │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────┘

🖼️ = Placeholder image (miniature si image existe)
```

#### Vue Hebdomadaire
```
┌─────────────────────────────────────────────────────────────────┐
│  [◀]  6 - 12 Janvier 2026  [▶]       [Mois] [Semaine] [Jour]    │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────┤
│  Lun 6  │  Mar 7  │  Mer 8  │  Jeu 9  │ Ven 10  │ Sam 11  │Dim12│
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┤
│ 08:00   │         │         │         │         │         │     │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┤
│ 09:00   │         │         │         │         │         │     │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┤
│ 10:00   │┌───────┐│         │         │         │         │     │
│         ││ 🖼️    ││         │         │         │         │     │
│ 11:00   ││Réunion││         │         │         │         │     │
│         │└───────┘│         │         │         │         │     │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┤
│ ...     │         │         │         │         │         │     │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────┘
```

#### Vue Journalière
```
┌─────────────────────────────────────────────────────────────────┐
│  [◀]  Samedi 10 Janvier 2026  [▶]    [Mois] [Semaine] [Jour]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  08:00  ─────────────────────────────────────────────────────   │
│                                                                 │
│  09:00  ─────────────────────────────────────────────────────   │
│                                                                 │
│  10:00  ┌─────────────────────────────────────────────────┐     │
│         │  🖼️ [image placeholder]                         │     │
│  11:00  │                                                 │     │
│         │  Réunion de famille                             │     │
│  12:00  │  📍 Chez Mamie                                  │     │
│         │  👤 Créé par Marie                              │     │
│  13:00  └─────────────────────────────────────────────────┘     │
│                                                                 │
│  14:00  ─────────────────────────────────────────────────────   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Vue Détail Événement (Modal)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                              ✕  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │              🖼️ IMAGE PLACEHOLDER                       │    │
│  │           (ou image de l'événement)                     │    │
│  │                                                         │    │
│  │     [📷 Ajouter une image]  ← ADMIN ONLY               │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  🎂 Anniversaire                                                │
│                                                                 │
│  Anniversaire de Papa                                           │
│  ══════════════════════════════════════════════                 │
│                                                                 │
│  📅  Samedi 15 Mars 2026                                        │
│  🔄  Se répète chaque année                                     │
│  👤  Créé par Marie Landry                                      │
│                                                                 │
│  65 ans cette année! On fête ça chez lui.                       │
│                                                                 │
│                              [Modifier]  [Supprimer]            │
│                              ↑ visible si créateur ou admin     │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Modal Création/Édition

```
┌─────────────────────────────────────────────────────────────────┐
│  Nouvel événement                                            ✕  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              🖼️ IMAGE PLACEHOLDER                       │    │
│  │                                                         │    │
│  │     [📷 Ajouter une image]  ← ADMIN ONLY, sinon caché  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Titre *                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Catégorie                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🎂 Anniversaire                                     ▼  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ☑ Journée entière                                              │
│                                                                 │
│  Date début *                        Heure (si pas journée)     │
│  ┌────────────────────────┐          ┌────────────────────┐     │
│  │ 15/03/2026             │          │ 14:00              │     │
│  └────────────────────────┘          └────────────────────┘     │
│                                                                 │
│  Date fin                            Heure fin                  │
│  ┌────────────────────────┐          ┌────────────────────┐     │
│  │ 15/03/2026             │          │ 18:00              │     │
│  └────────────────────────┘          └────────────────────┘     │
│                                                                 │
│  Récurrence                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🔄 Chaque année                                     ▼  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Description                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│                              [Annuler]  [Enregistrer]           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Catégories et Couleurs

| Category | Label FR | Couleur | Icône |
|----------|----------|---------|-------|
| BIRTHDAY | Anniversaire | `#C17767` (terracotta) | 🎂 |
| REUNION | Réunion | `#4A90A4` (bleu) | 👨‍👩‍👧‍👦 |
| VACATION | Vacances | `#6BBF59` (vert) | ✈️ |
| HOLIDAY | Fête | `#F4A261` (orange) | 🎄 |
| OTHER | Autre | `#8B8B8B` (gris) | 📌 |

---

## 6. Gestion des Images

### Règles
- **Upload**: ADMIN uniquement
- **Affichage**: Tous les utilisateurs connectés
- **Stockage**: Supabase Storage bucket `event-images`
- **Format acceptés**: JPG, PNG, WebP
- **Taille max**: 2 Mo
- **Redimensionnement**: 800px largeur max (côté client avant upload)

### Placeholder
Quand pas d'image:
- Afficher un placeholder avec l'icône de la catégorie
- Couleur de fond = couleur de la catégorie (opacity 10%)
- Bouton "Ajouter une image" visible uniquement pour ADMIN

### Composant EventImage
```tsx
interface EventImageProps {
  imageUrl?: string | null
  category: EventCategory
  canEdit: boolean  // true si ADMIN
  onImageChange?: (url: string) => void
}
```

---

## 7. Récurrence

### Format stockage (JSON)
```json
{
  "frequency": "YEARLY",
  "interval": 1,
  "until": "2030-12-31T23:59:59Z",
  "count": null,
  "byDay": null,
  "byMonth": [3],
  "byMonthDay": [15]
}
```

### Options UI simplifiées
| Option | Valeur |
|--------|--------|
| Ne se répète pas | `null` |
| Chaque jour | `{ frequency: "DAILY", interval: 1 }` |
| Chaque semaine | `{ frequency: "WEEKLY", interval: 1 }` |
| Chaque mois | `{ frequency: "MONTHLY", interval: 1 }` |
| Chaque année | `{ frequency: "YEARLY", interval: 1 }` |
| Personnalisé... | Modal avancé |

### Bibliothèque
Utiliser `rrule` pour:
- Générer les occurrences dans une plage de dates
- Parser/serialiser les règles

```bash
npm install rrule
```

---

## 8. Dépendances à installer

```bash
npm install react-big-calendar rrule date-fns
npm install -D @types/react-big-calendar
```

Note: `date-fns` déjà installé.

---

## 9. Validation

### Côté client (form)
- Titre: requis, 1-100 caractères
- Date début: requis, format valide
- Date fin: si présent, >= date début
- Couleur: format hex valide si présent

### Côté serveur (API)
- Mêmes validations
- Vérifier session authentifiée
- Vérifier rôle pour création (pas CHILD)
- Vérifier propriétaire ou ADMIN pour modification/suppression
- Vérifier ADMIN pour imageUrl

---

## 10. Checklist d'implémentation

### Backend
- [ ] Ajouter `imageUrl` au schéma Prisma
- [ ] Créer `src/app/api/events/route.ts` (GET, POST)
- [ ] Créer `src/app/api/events/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Implémenter vérification authentification
- [ ] Implémenter vérification permissions
- [ ] Implémenter expansion récurrence pour GET
- [ ] Créer bucket Supabase `event-images`

### Frontend
- [ ] Installer dépendances (react-big-calendar, rrule)
- [ ] Créer `Calendar.tsx` avec react-big-calendar
- [ ] Créer `CalendarToolbar.tsx`
- [ ] Créer `EventModal.tsx`
- [ ] Créer `EventDetail.tsx`
- [ ] Créer `EventImage.tsx` avec placeholder
- [ ] Créer `CategorySelect.tsx`
- [ ] Créer `RecurrenceSelect.tsx`
- [ ] Mettre à jour `/calendrier/page.tsx`
- [ ] Configurer localisation française

### Tests
- [ ] Test API: authentification requise
- [ ] Test API: CHILD ne peut pas créer
- [ ] Test API: MEMBER ne peut pas ajouter image
- [ ] Test API: modification par propriétaire seulement
- [ ] Test API: ADMIN peut tout modifier
- [ ] Test UI: modal création
- [ ] Test UI: navigation calendrier
