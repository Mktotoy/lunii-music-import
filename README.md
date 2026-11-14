# lunii-music-import

Importer ses propres albums audio sur une **Lunii V3** (Ma Fabrique à Histoires) en ligne de commande, sans navigateur, avec un agent IA ou à la main.

- Un sous-dossier par album, une commande, un pack Lunii par album (menu de choix des pistes, puis lecture enchaînée).
- Sauvegarde automatique du volume, test complet sur une copie, ajout seulement, vérification après écriture.
- Packagé comme **skill** : `SKILL.md` contient les règles et la procédure pour n'importe quel agent (Claude Code, Codex, Gemini CLI...).

> Projet communautaire indépendant, non affilié à Lunii. Usage personnel, sur votre propre appareil, avec des fichiers audio dont vous disposez légitimement. Utilisation à vos risques : une sauvegarde est faite à chaque exécution.

## Démarrage rapide

```bash
git clone https://github.com/Mktotoy/lunii-music-import
cd lunii-music-import
scripts/setup.sh                                   # une fois

# albums/01 Comptines/01 Titre.mp3, 02 Titre.mp3...
# albums/02 Contes/...
scripts/lunii-import.sh ~/albums                   # test sur copie, rien n'est écrit
scripts/lunii-import.sh ~/albums --run             # écriture sur la Lunii
```

## Avec un agent IA

- **Claude Code** : copier ce dossier dans `~/.claude/skills/lunii-music-import/`, puis demander « importe ces albums sur ma Lunii ».
- **Autres agents** : leur faire lire `SKILL.md` (voir `AGENTS.md`).
- **Prompt à coller** dans n'importe quel agent : `PROMPT.md`.

## Prérequis

Linux ou macOS, git, Node 18+, npm, ffmpeg avec libmp3lame, python3 avec Pillow et numpy, openssl. La Lunii doit être branchée et montée localement.

## Ce qui est testé

Lunii V3, firmware 3.3.3 (`.md` version 7) : 4 albums, 74 pistes. Les packs générés utilisent le même schéma de chiffrement que les packs installés par l'interface web de `lunii-admin-web`. Non testé sur V2 (refusé par le script).

## Structure

| Chemin | Rôle |
|---|---|
| `SKILL.md` | Règles cadre et procédure pour agent |
| `PROMPT.md` | Prompt autonome à copier-coller |
| `AGENTS.md` | Point d'entrée pour les agents non Claude |
| `scripts/setup.sh` | Installation : clone `lunii-admin-web` (version figée), dépendances, build |
| `scripts/lunii-import.sh` | Import : sauvegarde, conversion, test, écriture, vérification |
| `scripts/lunii-cli/` | Exécution en Node du code d'installation de `lunii-admin-web` |

## Crédits

S'appuie sur [lunii-admin-web](https://github.com/olup/lunii-admin-web) (olup) et son fork. Ce dépôt ne contient aucun fichier de `lunii-admin-web` : le code est téléchargé par `scripts/setup.sh` au moment de l'installation et reste soumis aux conditions de son auteur.

## Licence

MIT pour le code de ce dépôt (voir `LICENSE`).
