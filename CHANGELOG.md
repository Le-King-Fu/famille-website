# Changelog

## 2026-02-06

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
