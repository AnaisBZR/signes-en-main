# Signes en main

Site pour apprendre la Langue des Signes Française (LSF) : leçons par thèmes, quiz,
révision intelligente (boîtes de Leitner), alphabet, et un dictionnaire de 746 mots
avec de vraies vidéos de personnes qui signent, toutes sous licence libre (Wikimedia Commons).

## Ouvrir le site

Double-cliquez sur **« Ouvrir le site.bat »** (il faut Python). Le site s'ouvre à
l'adresse http://127.0.0.1:8766/.

## Vérifier que tout marche

Double-cliquez sur **« Vérifier le site.bat »**. Il :

1. met à jour les numéros de version des fichiers dans `index.html`, pour que le
   navigateur recharge toujours la dernière version (`scripts/versionner.py`) ;
2. lance les tests automatiques (`tests/*.test.js`, il faut [Node.js](https://nodejs.org)) :
   révision intelligente, série de jours, mots des leçons présents dans le dictionnaire,
   auteur et licence libre de chaque vidéo… ;
3. propose de vérifier que les 881 vidéos et photos sont toujours en ligne
   (`scripts/verifier_videos.py`, rapport dans `data/verification-videos.txt`).

Pour tester toutes les pages dans le navigateur (environ 900 pages, et un quiz complet par
thème) : site ouvert, allez sur http://127.0.0.1:8766/tests/navigateur.html.

## Historique des versions (Git)

Le dossier est suivi par Git : chaque étape importante est enregistrée et peut être annulée.

- voir l'historique : `git log --oneline`
- voir ce qui a changé depuis la dernière étape : `git status` puis `git diff`
- enregistrer une étape : `git add -A` puis `git commit -m "ce que j'ai changé"`
- annuler les modifications d'un fichier pas encore enregistrées : `git restore chemin/du/fichier`

Le dossier `reel2toon/` (projet séparé, plus de 2 Go) n'est pas suivi.

## Organisation

| Dossier | Contenu |
|---|---|
| `index.html`, `css/`, `js/` | le site |
| `js/dictionnaire.js`, `js/alphabet.js` | données générées par `scripts/construire_dictionnaire.py` (ne pas modifier à la main) |
| `js/descriptions.js` | descriptions automatiques des signes, générées par `outils/descriptions.html` puis `scripts/construire_descriptions.py` |
| `tests/` | tests automatiques |
| `animateur-video/`, `studio/` | outils expérimentaux (avatar 3D) |
