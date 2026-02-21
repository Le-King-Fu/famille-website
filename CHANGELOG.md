# Changelog

## 2026-02-20

### Notifications par courriel - Digest quotidien (Resend)
- Intégration de Resend pour l'envoi d'emails transactionnels
- Nouvelle préférence `emailEnabled` par type de notification (opt-in, désactivé par défaut)
- Digest quotidien à 18h HE : un seul email récapitulatif regroupant toutes les notifications des dernières 24h
- Route cron `/api/cron/email-digest` sécurisée par `CRON_SECRET`
- Configuration `vercel.json` pour le cron job Vercel
- Types couverts : mentions, citations, réponses aux sujets, nouveaux événements
- Notifications groupées par type dans l'email avec liens cliquables
- Lien vers les préférences de notification en pied de page

### Notifications push - Améliorations
- Refactorisation du composant `NotificationPreferences` avec deux colonnes (Push + Email)
- Les toggles email sont toujours visibles (indépendants de la souscription push)
- API `/api/push/preferences` mise à jour pour supporter `emailEnabled`

## 2026-02-07

### Sécurité - Rate limiting sur les endpoints d'authentification
- Nouvelle librairie partagée `src/lib/rate-limit.ts` (getClientIP, checkRateLimit, recordFailedAttempt, resetAttempts)
- Rate limiting sur la connexion : 5 tentatives / 15 min par IP + par email
- Rate limiting sur l'inscription : 5 tentatives / heure par IP
- Refactorisation du rate limiting existant du portail de sécurité vers la librairie partagée
- Ajout du champ `type` au modèle `SecurityAttempt` avec contrainte unique `[ipAddress, type]`
- Extraction et amélioration de `getClientIP()` (support `x-real-ip`)

## 2026-02-06

### Sécurité - Durcissement
- Ajout des en-têtes de sécurité HTTP (X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy)
- Standardisation du hachage bcrypt à 12 rounds (reset mot de passe admin)
- Validation des métadonnées de scores de jeux (type objet, taille max 1 Ko)
- Réduction de la durée de session JWT de 7 à 3 jours

### Langue de seeeerpent - Correctifs (#19)
- Jeu renommé de "Witch Case" à "Langue de seeeerpent"
- Correction du niveau Difficile (même vitesse que Moyen → maintenant plus rapide)
- Boutons de difficulté cliquables sur le menu du jeu
- Correction du bonus LANDRY : détection dans tout le corps du serpent (ex: LAxLANDRY donne le bonus)

### Sécurité - Changement de mot de passe
- Nouvelle page `/profil/changer-mot-de-passe` pour les utilisateurs avec mot de passe temporaire
- API `PUT /api/users/me/password` avec validation (8+ caractères, majuscule, chiffre)
- Rafraîchissement automatique de la session JWT après changement
- Correction du 404 quand le middleware redirige vers la page de changement de mot de passe

### Jeu Belle Bête Sage - Améliorations (#14)
- Score de distance qui s'accumule en jouant, multiplié par la stat Vitesse du chien
- Bonus de +50 points pour sauter par-dessus les petits obstacles (chat, rat, cône)
- Combos multi-couloirs à partir du niveau Normal (2 obstacles en même temps)
- Difficulté augmentée aux niveaux Difficile et Expert (obstacles plus fréquents)
- Nouvelles couleurs des chiens : Nouki (brun pâle), Flora (brun foncé), Laska (noir et blanc avec taches)
- Labels descriptifs pour les stats : ♥ Vie, ⚡ Distance, ⭐ Bonus (remplace F/V/B)
- Écran tutoriel au premier lancement (touche T pour le revoir depuis le menu)

### Page d'accueil
- Déplacement de la section "Nouvelles réponses non lues" sous la grille de résumé (Événements, Forum, Scores)
- Augmentation de la limite de réponses non lues affichées de 5 à 10

## 2026-02-05

### Forum - Suivi de lecture
- Ajout du tracking read/unread pour les topics du forum
- Les topics non lus sont mis en évidence visuellement
- Marquage automatique comme lu lors de la consultation

### Forum - Système de @mentions
- Autocomplétion des @mentions avec nom complet des membres
- Système de notifications quand quelqu'un est mentionné
- Amélioration de l'UX de l'autocomplétion (navigation clavier, affichage)
- Fix du highlighting des mentions et auto-read pour les auteurs

### Analytics
- Intégration d'Umami pour le suivi des visites (optionnel via variables d'env)

### Page d'accueil
- Nouvelle section "Nouvelles réponses non lues" en haut de la page
- Affiche les 10 dernières réponses non lues des autres membres
- Inclut : avatar, auteur, date, titre du sujet, extrait du contenu
- Lien direct vers le topic concerné

### Forum - Édition des sujets
- Les auteurs peuvent maintenant modifier leurs propres sujets
- Affichage de l'indicateur "modifié" avec la date

### Forum - Texte enrichi (#13)
- Barre d'outils interactive avec boutons: **Gras**, *Italique*, __Souligné__, Titre
- Sélecteur d'emojis intégré pour insérer facilement des emojis
- Nouvelle syntaxe markdown: `## titre` et `__souligné__`
- Toolbar disponible dans: nouveau sujet, réponses, mode édition

### Forum & Photos - Réactions emoji (#15)
- Ajout de réactions emoji aux sujets, réponses et commentaires photos
- 6 emojis disponibles: 👍 ❤️ 😂 😮 😢 🎉
- Affichage groupé avec compteur et tooltip des utilisateurs
- Réactions personnelles mises en évidence en bleu
- Cliquer pour ajouter/retirer une réaction

### Contacts
- Support de plusieurs numéros de téléphone par contact (jusqu'à 3)
- Types de téléphone: cellulaire, domicile, travail, autre
