# Plan d'Intégration des Jeux

> Document de planification pour l'intégration de nouveaux jeux dans le site familial.

---

## Architecture Existante

### Structure des Jeux

```
src/components/games/
├── common/                    # Composants partagés
│   ├── GameWrapper.tsx        # Layout wrapper (header, navigation)
│   ├── GameOverlay.tsx        # Menu/Pause/GameOver overlays
│   ├── GameControls.tsx       # Boutons start/pause/mute
│   ├── MobileControls.tsx     # Contrôles tactiles
│   └── types.ts               # Types partagés (GameState, GameMetadata)
├── piano-hero-v2/             # Premier jeu implémenté
│   ├── PianoHeroGame.tsx
│   ├── config.ts
│   ├── entities/
│   ├── systems/
│   └── hooks/
└── [nouveau-jeu]/             # Structure pour chaque nouveau jeu
```

### Registre des Jeux

Fichier: `/src/app/(protected)/jeux/[gameId]/page.tsx`

```typescript
const GAMES = {
  'piano-hero-v2': {
    name: 'Piano Hero v2',
    gameType: 'PIANO_HERO_V2' as GameType,
    component: PianoHeroGame,
  },
  // Ajouter nouveaux jeux ici
}
```

### Types de Jeux (Base de Données)

Fichier: `prisma/schema.prisma`

```prisma
enum GameType {
  PIANO_HERO
  PIANO_HERO_V2      # Implémenté
  WITCH_CASE         # À venir
  BELLE_BETE_SAGE    # À venir
}
```

### Palette de Couleurs (Friendly Cyberpunk)

```css
--game-bg: #2C3E50;           /* Fond principal */
--game-primary: #C17767;      /* Terracotta - éléments UI */
--game-secondary: #4A90A4;    /* Bleu famille - succès */
--game-accent: #E57373;       /* Rouge doux - erreurs */
--game-gold: #F7931A;         /* Or/Bitcoin - bonus */
--game-text: #FFF8F0;         /* Crème - texte */
```

---

## Belle Bête Sage

### Progression de l'Implémentation

> Dernière mise à jour: 2026-02-03

| Tâche | Statut | Fichier |
|-------|--------|---------|
| config.ts | ✅ Terminé | `src/components/games/belle-bete-sage/config.ts` |
| Player entity | ✅ Terminé | `src/components/games/belle-bete-sage/entities/Player.ts` |
| Obstacle entity | ✅ Terminé | `src/components/games/belle-bete-sage/entities/Obstacle.ts` |
| Collectible entity | ✅ Terminé | `src/components/games/belle-bete-sage/entities/Collectible.ts` |
| Renderer system | ✅ Terminé | `src/components/games/belle-bete-sage/systems/Renderer.ts` |
| Audio system | ✅ Terminé | `src/components/games/belle-bete-sage/systems/Audio.ts` |
| Main component | ✅ Terminé | `src/components/games/belle-bete-sage/BelleBeteSageGame.tsx` |
| index.ts | ✅ Terminé | `src/components/games/belle-bete-sage/index.ts` |
| Registry + Hub | ✅ Terminé | `/jeux/[gameId]/page.tsx` + `/jeux/page.tsx` |

**Statut**: Intégration complète ! Le jeu est disponible dans le hub des jeux.

---

### Source

- **Repository**: [Le-King-Fu/Site_Perso](https://github.com/Le-King-Fu/Site_Perso/tree/main/games/belle-bete-sage)
- **Type**: Endless runner cyberpunk à 3 couloirs
- **Technologie**: Vite + JavaScript vanilla + Canvas 2D

### Description du Jeu

Un endless runner mettant en scène les chiens de la famille dans un univers cyberpunk. Le joueur contrôle un chien qui court automatiquement et doit éviter des obstacles tout en collectant des pièces et des bonus.

### Caractéristiques

| Fonctionnalité | Description |
|----------------|-------------|
| **3 Personnages** | Flora (Berger Allemand), Nouki (Labrador), Laska (Berger Australien) |
| **Statistiques** | Force (vies), Vitesse, Beauté (multiplicateur bonus) |
| **3 Couloirs** | Déplacement gauche/droite entre les couloirs |
| **Saut** | Éviter les petits obstacles (500ms, 50px hauteur) |
| **Obstacles** | 6 types: chat, rat, voiture, moto, vache, cône (petits/grands) |
| **Collectibles** | Pièces (100 pts), Bonus (500 pts × beauté) |
| **Difficulté** | 5 niveaux (vitesse 0.8x-2.0x, spawn 1600ms-600ms) |
| **Progression** | Level up tous les 2000 points |

### Statistiques des Personnages

| Chien | Force | Vitesse | Beauté |
|-------|-------|---------|--------|
| Flora (Berger Allemand) | 3 | 4 | 5 |
| Nouki (Labrador) | 5 | 3 | 4 |
| Laska (Berger Australien) | 3 | 5 | 4 |

### Structure des Fichiers à Créer

```
src/components/games/belle-bete-sage/
├── BelleBeteSageGame.tsx    # Composant React principal
├── config.ts                # Configuration (couleurs, constantes)
├── index.ts                 # Exports
├── entities/
│   ├── Player.ts            # Chien avec stats et animation
│   ├── Obstacle.ts          # Obstacles (chat, voiture, etc.)
│   └── Collectible.ts       # Pièces et bonus
├── systems/
│   ├── Renderer.ts          # Rendu Canvas 2D
│   └── Audio.ts             # Sons Web Audio API
└── hooks/
    └── useGameLoop.ts       # Réutiliser de piano-hero-v2
```

### Configuration à Adapter

#### Canvas

| Propriété | Valeur |
|-----------|--------|
| Affichage | 640×480 pixels |
| Résolution native | 320×240 pixels |
| Couloirs | 3 × 80px de large |
| Position joueur Y | 180px |

#### Couleurs (Adaptation Palette Famille)

| Élément Original | Hex Original | Adaptation |
|------------------|--------------|------------|
| Accent primaire | #ff6b35 | #C17767 (terracotta) |
| Accent secondaire | #00ff88 | #4A90A4 (bleu famille) |
| Pièces | #ffcc00 | #F7931A (game-gold) |
| Danger | #ff6b6b | #E57373 (game-accent) |

### Contrôles

#### Desktop

| Touche | Action |
|--------|--------|
| ← / A | Couloir gauche |
| → / D | Couloir droite |
| ↑ / W / Espace | Sauter |
| Échap | Menu/Pause |

#### Mobile

| Geste | Action |
|-------|--------|
| Swipe gauche | Couloir gauche |
| Swipe droite | Couloir droite |
| Swipe haut / Tap | Sauter |

Alternative: 3 boutons tactiles (◀ ▲ ▶)

### Système de Rendu

Tout le rendu est procédural via Canvas 2D (pas d'images externes):

- **Fond**: Ville cyberpunk avec bâtiments néon défilants
- **Couloirs**: Lignes verticales avec séparateurs
- **Joueur**: Chien animé (pattes, queue) dessiné avec primitives
- **Obstacles**: Formes géométriques assemblées (chat, voiture, etc.)
- **Collectibles**: Pièces pulsantes, bonus rotatifs
- **UI**: Score, vies (cœurs), niveau, stats personnage
- **Effets**: Glow néon via `shadowColor` et `shadowBlur`

### Système Audio

| Son | Description |
|-----|-------------|
| Pièce | Ton ascendant court |
| Bonus | Arpège |
| Collision | Accord dissonant |
| Saut | Whoosh rapide |
| Level up | Fanfare |
| Ambiance | Loop optionnelle |

### Métadonnées de Score

```typescript
interface BelleBeteSageMetadata {
  character: 'flora' | 'nouki' | 'laska'
  level: number
  coinsCollected: number
  bonusesCollected: number
}
```

### Intégration au Registre

```typescript
// /src/app/(protected)/jeux/[gameId]/page.tsx
const GAMES = {
  'piano-hero-v2': { ... },
  'belle-bete-sage': {
    name: 'Belle Bête Sage',
    gameType: 'BELLE_BETE_SAGE' as GameType,
    component: BelleBeteSageGame,
  },
}
```

### Carte dans le Hub des Jeux

```typescript
// /src/app/(protected)/jeux/page.tsx
{
  id: 'belle-bete-sage',
  name: 'Belle Bête Sage',
  description: 'Endless runner cyberpunk avec nos chiens !',
  icon: Dog, // lucide-react
  color: 'game-secondary',
}
```

### Particularités par Rapport à Piano Hero v2

| Aspect | Piano Hero v2 | Belle Bête Sage |
|--------|---------------|-----------------|
| Sélection personnage | Non | Oui (écran dédié) |
| Stats affichées | Non | Oui (Force/Vitesse/Beauté) |
| Mouvement joueur | Fixe | 3 couloirs + saut |
| Type de jeu | Rhythm game | Endless runner |
| Obstacles | Notes à frapper | Obstacles à éviter |
| Collectibles | Non | Oui (pièces, bonus) |

### Tâches d'Implémentation

- [ ] Créer `config.ts` avec constantes et palette adaptée
- [ ] Créer `entities/Player.ts` (chien avec stats, animation, saut)
- [ ] Créer `entities/Obstacle.ts` (6 types, collision, vitesse)
- [ ] Créer `entities/Collectible.ts` (pièces, bonus, animation)
- [ ] Créer `systems/Renderer.ts` (canvas, tous les dessins)
- [ ] Créer `systems/Audio.ts` (Web Audio API)
- [ ] Créer `BelleBeteSageGame.tsx` (composant principal)
- [ ] Ajouter écran sélection personnage
- [ ] Intégrer contrôles mobiles (swipe + boutons)
- [ ] Ajouter au registre des jeux
- [ ] Ajouter carte dans hub `/jeux`
- [ ] Tester et ajuster équilibrage

### Améliorations Optionnelles

- [ ] Photos réelles des chiens de la famille en bonus collectibles
- [ ] Power-ups temporaires (invincibilité, aimant pièces)
- [ ] Thèmes visuels déblocables
- [ ] Mode deux joueurs local

---

## Witch Case

> À documenter

---

## Piano Hero v1

> À documenter

---

## Notes Générales

### Checklist pour Nouveau Jeu

1. [ ] Créer dossier dans `src/components/games/[nom-jeu]/`
2. [ ] Implémenter composant principal avec interface `GameComponentProps`
3. [ ] Ajouter `GameType` dans Prisma si nécessaire
4. [ ] Ajouter au registre `GAMES` dans `/jeux/[gameId]/page.tsx`
5. [ ] Ajouter carte dans `/jeux/page.tsx`
6. [ ] Utiliser composants communs (`GameWrapper`, `GameOverlay`, etc.)
7. [ ] Implémenter `onScoreSubmit` callback
8. [ ] Tester sur desktop et mobile
9. [ ] Vérifier soumission scores et classement

### Interface Composant Jeu

```typescript
interface GameComponentProps {
  onScoreSubmit?: (score: number, metadata: GameMetadata) => Promise<boolean>
  onGameOver?: (score: number, isNewRecord: boolean) => void
}
```
