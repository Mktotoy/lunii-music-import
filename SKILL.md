---
name: lunii-music-import
description: Importe des albums audio (MP3, M4A, WAV, OGG, FLAC) sur une Lunii V3 (Ma Fabrique à Histoires) en ligne de commande, sans interface web. Sauvegarde, conversion, test sur copie, ajout seulement, vérification. Triggers : importer musique Lunii, ajouter un album sur la Lunii, Lunii en ligne de commande, IMPORT MUSIQUE LUNII.
---

# lunii-music-import

Skill autonome, utilisable par tout agent capable d'exécuter des commandes shell (Claude Code, Codex, Gemini CLI, etc.). Le présent fichier est la seule consigne à suivre : lis-le en entier avant d'agir.

## Règles cadre (non négociables)

1. **Fichiers source intouchables.** Ne jamais modifier, renommer, déplacer ou supprimer les fichiers audio de l'utilisateur. Travailler sur des copies.
2. **Ajout seulement sur la Lunii.** Ne jamais supprimer, renommer, réordonner ni modifier un pack existant ou un fichier du volume. Le script n'ajoute que de nouveaux packs.
3. **Sauvegarde avant toute écriture.** Le script la fait à chaque exécution ; ne jamais la contourner ni la supprimer.
4. **Test avant écriture.** Toujours lancer d'abord sans `--run` (test sur une copie), montrer le résultat à l'utilisateur, puis attendre son accord explicite avant `--run`.
5. **Aucune écriture hors du script.** Pas de `cp`, `rm`, `mv`, `dd` ou édition manuelle sur le volume Lunii.
6. **Échec = arrêt.** Si une vérification échoue, ne rien tenter d'autre : montrer la sortie et le chemin de la sauvegarde à l'utilisateur.
7. **Usage personnel.** Uniquement des fichiers audio dont l'utilisateur dispose légitimement, sur sa propre Lunii.
8. **V3 seulement.** Le script refuse les autres modèles ; ne pas forcer.

## Paramètres à demander ou déduire

- Dossier des fichiers audio de l'utilisateur.
- Découpage en albums : un sous-dossier par album, ou consigne de regroupement de l'utilisateur.
- Titre de chaque album (par défaut, le nom du dossier).
- Point de montage de la Lunii s'il n'est pas détecté (`LUNII_VOLUME`).

## Procédure

1. **Installation (une fois).** `scripts/setup.sh`. Vérifie les prérequis (git, node 18+, npm, ffmpeg avec libmp3lame, python3 avec Pillow et numpy, openssl), clone `lunii-admin-web` dans `vendor/` à une version figée, construit l'outil.
2. **Préparer les albums en copies.** Créer un dossier « albums » (hors du dossier source) avec un sous-dossier par album, nommé `01 Titre`, `02 Titre`... Copier les pistes dedans, nommées `01 Titre.mp3`, `02 Titre.mp3`... dans l'ordre d'écoute voulu. Le préfixe numérique fixe l'ordre et disparaît du titre affiché.
3. **Brancher la Lunii** et vérifier qu'elle est montée (`lsblk` ; le volume contient `.md`, `.pi` et `.content`).
4. **Test.** `scripts/lunii-import.sh "<dossier albums>"`. Sauvegarde le volume, convertit les pistes, installe tout sur une copie, vérifie. Rien n'est écrit sur la Lunii.
5. **Récapitulatif à l'utilisateur** : albums, nombre de pistes, packs « OK », espace libre (`df -h`). Attendre son accord explicite.
6. **Écriture.** `scripts/lunii-import.sh "<dossier albums>" --run`. Vérifie que la Lunii n'a pas changé depuis la sauvegarde, écrit, vérifie (anciens packs intacts, nouveaux packs indexés, MP3 déchiffrable), démonte si possible.
7. **Compte rendu** : albums ajoutés, chemin de la sauvegarde, rappel d'éjecter avant de débrancher si le démontage automatique n'a pas eu lieu.

## Comment ça marche

`lunii-admin-web` est une application web qui installe des packs via l'API File System Access du navigateur. Une Lunii V3 étant un simple volume FAT monté, l'outil exécute le même code d'installation en Node : les API navigateur sont remplacées par des équivalents disque (`fshandles.ts`), ffmpeg WASM par ffmpeg natif (conversion en amont), le canvas par Pillow (`prep.py`). Chaque album devient un pack « album musical » : un menu de choix des pistes, puis lecture enchaînée. Les packs sont chiffrés avec la clé propre à l'appareil, lue dans son fichier `.md` ; aucune clé n'est fournie ni stockée par ce dépôt.

## Pièges connus

- Chaque piste est stockée deux fois dans le pack (menu et lecture) : prévoir environ le double de la taille des MP3 convertis.
- Conversion : environ une minute pour 15 minutes d'audio. Pour un gros volume, lancer en tâche de fond.
- Les packs officiels Lunii utilisent un autre schéma de chiffrement : ne pas s'en servir comme référence pour valider un pack perso.
- Un dossier de `.content` absent de l'index `.pi` peut exister : ne pas y toucher.
- Jaquette générée automatiquement (fond sombre et titre). Pour une vraie image, adapter `prep.py cover`.
- Lancer le script depuis un autre poste ou un serveur sans la Lunii branchée n'a pas de sens : il faut le volume monté localement.

## Étendre ce skill

Voir `CONTRIBUTING.md`. Toute nouvelle étape qui écrit sur la Lunii doit conserver la sauvegarde, le test sur copie et l'accord explicite de l'utilisateur.
