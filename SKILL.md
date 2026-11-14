---
name: lunii-music-import
description: Prompt IA pas à pas pour importer ses propres musiques sur une Lunii (Ma Fabrique à Histoires) sous forme d'albums : préparation des fichiers, conversion, création d'un pack au format STUdio, installation avec un outil communautaire, vérification. Triggers : importer musique Lunii, créer un album Lunii, IMPORT MUSIQUE LUNII.
---

# IMPORT MUSIQUE LUNII

Ceci est un **prompt pour agent IA**, pas un logiciel. Il décrit un processus pas à pas pour transformer des fichiers audio personnels en albums écoutables sur une Lunii. Il ne contient aucun script et n'installe rien de lui-même. Les outils communautaires utilisés sont cités dans la section « Sources ».

À coller tel quel dans un agent capable d'exécuter des commandes (Claude Code, Codex, Gemini CLI...), ou à placer comme skill. Remplacer les `<...>` de la section « Paramètres ».

---

Tu m'aides à importer mes musiques sur ma Lunii, sous forme d'albums. Suis les étapes dans l'ordre. Ne passe à l'étape suivante que lorsque la précédente est réussie. Réponds en français, de façon concise.

## Paramètres

- Mes fichiers audio : `<CHEMIN>`
- Albums voulus : `<un album par sous-dossier, ou consigne de regroupement et de titres>`
- Dossier de travail : `<CHEMIN DE TRAVAIL>` (copies, conversions, sauvegarde)

## Règles cadre (non négociables)

1. **Mes fichiers sont intouchables.** Ne jamais modifier, renommer, déplacer ni supprimer les fichiers source. Travailler uniquement sur des copies dans le dossier de travail.
2. **Ajout seulement sur la Lunii.** Ne jamais supprimer, renommer, réordonner ni modifier un pack existant, ni aucun fichier du volume en dehors de l'installation du nouveau pack.
3. **Sauvegarde avant toute écriture** sur la Lunii, vérifiée (même liste de fichiers).
4. **Accord explicite** de ma part avant chaque écriture sur la Lunii, après un récapitulatif.
5. **Pas d'écriture manuelle** dans les fichiers internes de la Lunii (`.pi`, `.md`, `.content/`) : l'installation passe par un outil cité dans « Sources ».
6. **Échec = arrêt** : en cas d'erreur, ne rien tenter de plus, me montrer la sortie et le chemin de la sauvegarde.
7. **Usage personnel** : uniquement des fichiers dont je dispose légitimement, sur ma propre Lunii.

## Étape 1. Inventaire (lecture seule)

- Vérifier que `ffmpeg` (avec l'encodeur `libmp3lame`) est installé ; sinon me dire comment l'installer.
- Lister mes fichiers audio : albums, nombre de pistes, durée totale (`ffprobe`).
- Si la Lunii est branchée : trouver son volume monté (`lsblk`, `findmnt` ; il contient `.md`, `.pi` et `.content/`). Lire la version du modèle : les deux premiers octets de `.md` en entier 16 bits little-endian (3 = V2, 6 ou 7 = V3). Noter l'espace libre (`df -h`) et le nombre de packs (taille de `.pi` divisée par 16).
- Me présenter cet inventaire.

## Étape 2. Préparer les albums (copies)

- Dans le dossier de travail, créer `albums/` avec un sous-dossier par album : `01 Titre`, `02 Titre`...
- Copier les pistes dedans, renommées `01 Titre.mp3`, `02 Titre.mp3`... dans l'ordre d'écoute voulu. Retirer les doublons évidents, me signaler les pistes sans titre exploitable.
- Me montrer la liste finale (album, ordre, titres) et attendre ma validation.

## Étape 3. Convertir l'audio

Format attendu par la Lunii : MP3 mono, 44 100 Hz, sans tags ID3. Pour chaque piste :

```bash
ffmpeg -i "<entrée>" -map 0:a -ar 44100 -ac 1 -b:a 64k \
  -map_metadata -1 -write_xing 0 -id3v2_version 0 -c:a libmp3lame "<sortie>.mp3"
```

Vérifier chaque sortie avec `ffprobe` (`sample_rate=44100`, `channels=1`). Ordre de grandeur : environ une minute de conversion pour 15 minutes d'audio.

## Étape 4. Créer une jaquette par album

Une image PNG 320 x 240 par album (titre sur fond uni, ou image fournie par moi). La Lunii l'affiche en niveaux de gris : privilégier un fort contraste et un texte lisible.

## Étape 5. Construire un pack par album (format STUdio)

Un pack est une archive ZIP contenant `story.json` et un dossier `assets/` (audio et images référencés par nom de fichier). Structure d'un « album musical » à N pistes :

- **Nœud menu** (premier nœud de scène) : image = jaquette, pas d'audio. `controlSettings` : `wheel` vrai, `ok` vrai, `home` faux, `pause` faux, `autoplay` faux. `okTransition` vers le nœud d'action `choice_menu`, option 0. `homeTransition` nul.
- **Pour chaque piste i**, deux nœuds de scène qui partagent le même audio et la jaquette :
  - *Sélection* (vue dans le menu) : `wheel` vrai, `ok` vrai, `home` vrai, `pause` faux, `autoplay` vrai. `okTransition` vers `play_action_i`, option 0. `homeTransition` vers `cover_action`, option 0.
  - *Lecture* : `wheel` faux, `ok` vrai, `home` vrai, `pause` vrai, `autoplay` vrai. `okTransition` vers `play_action_{i+1}` (ou `choice_menu` après la dernière piste), option 0. `homeTransition` vers `choice_menu`, option i.
- **Nœuds d'action** : `cover_action` (options : le nœud menu), `choice_menu` (options : les N nœuds de sélection, dans l'ordre), `play_action_i` (options : le nœud de lecture i).
- **En-tête** : `title`, `description`, `version: 1`, `uuid` (UUID v4 nouveau, différent de tous les packs présents dans `.pi`).

Squelette de `story.json` :

```json
{
  "title": "<Titre de l'album>",
  "description": "<Description>",
  "version": 1,
  "uuid": "<uuid-v4>",
  "stageNodes": [
    { "uuid": "<uuid-menu>", "image": "cover.png", "audio": null,
      "controlSettings": { "wheel": true, "ok": true, "home": false, "pause": false, "autoplay": false },
      "okTransition": { "actionNode": "choice_menu", "optionIndex": 0 }, "homeTransition": null }
  ],
  "actionNodes": [
    { "id": "cover_action", "options": ["<uuid-menu>"] },
    { "id": "choice_menu", "options": ["<uuid-selection-0>", "<uuid-selection-1>"] }
  ]
}
```

Contrôler le pack avant d'aller plus loin : JSON valide, chaque `audio` et `image` existe dans `assets/`, chaque `actionNode` cité existe, chaque UUID d'option existe.

## Étape 6. Sauvegarder la Lunii

Copier l'intégralité du volume dans le dossier de travail (`cp -a "<volume>/." "<travail>/backup-<date>/"`), puis comparer les deux listes de fichiers. Ne pas continuer si elles diffèrent.

## Étape 7. Récapitulatif et accord

Me présenter : albums, nombre de pistes, taille des packs, espace libre sur la Lunii, chemin de la sauvegarde, outil d'installation choisi. Attendre mon accord explicite.

## Étape 8. Installer les packs

Avec un outil communautaire qui gère mon modèle (voir « Sources »), par exemple :

- **lunii-admin-web** : application web (Chrome ou Edge, sur la machine où la Lunii est branchée). Ouvrir l'application, connecter la Lunii, installer chaque archive ZIP du pack.
- **lunii-qt** : application de bureau qui installe des packs au format STUdio.

L'installation chiffre le pack avec la clé propre à l'appareil et l'ajoute à l'index. Ne jamais reproduire cette étape à la main.

## Étape 9. Vérifier

- Comparer le volume avec la sauvegarde : les anciens packs (`.content/<REF>/`) et les fichiers hors `.content` et `.pi` doivent être identiques. Les 16 × (nombre d'anciens packs) premiers octets de `.pi` doivent être inchangés.
- Chaque nouveau pack apparaît dans `.pi` et dans `.content/`.
- Éjecter proprement la Lunii (`sync`, puis démontage) avant de la débrancher.
- Compte rendu : albums ajoutés, espace restant, chemin de la sauvegarde.

## Pièges connus

- Chaque piste est référencée par deux nœuds (sélection et lecture) : selon l'outil, l'audio peut être stocké deux fois. Prévoir jusqu'au double de la taille des MP3.
- Des tags ID3 ou une fréquence autre que 44 100 Hz provoquent une reconversion par l'outil, voire un échec : convertir en amont (étape 3).
- Les packs officiels utilisent un autre schéma de chiffrement que les packs perso : ne pas s'en servir comme modèle.
- Un dossier de `.content/` absent de l'index `.pi` peut exister : ne pas y toucher.
- Les applications web d'installation exigent Chrome ou Edge, en local ou en https, sur la machine où la Lunii est branchée.

## Sources

- [lunii-admin-web](https://github.com/olup/lunii-admin-web) (olup) : gestion de la Lunii et installation de packs depuis le navigateur. Version hébergée : https://lunii-admin-web.pages.dev
- [lunii-admin-builder](https://github.com/olup/lunii-admin-builder) (olup) : construction de packs.
- [STUdio](https://github.com/marian-m12l/studio) (marian-m12l) : format de pack `story.json` et éditeur d'histoires.
- [lunii-qt](https://github.com/o-daneel/Lunii.QT) (o-daneel) : gestion de la Lunii et installation de packs, application de bureau.

Projet communautaire indépendant, non affilié à Lunii.
