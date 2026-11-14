# IMPORT MUSIQUE LUNII

Un **prompt pour agent IA** qui guide pas à pas l'import de vos propres musiques sur une Lunii (Ma Fabrique à Histoires), sous forme d'albums.

C'est uniquement un texte : aucun script, aucune dépendance, rien à installer. L'agent suit le processus, et l'installation finale passe par des outils communautaires existants, cités dans les sources.

## Utilisation

- **N'importe quel agent** (Claude Code, Codex, Gemini CLI...) : copier le contenu de [`SKILL.md`](SKILL.md) dans la conversation, puis remplir la section « Paramètres ».
- **Comme skill Claude Code** : placer `SKILL.md` dans `~/.claude/skills/lunii-music-import/`, puis demander « importe ces musiques sur ma Lunii ».

## Le processus

1. Inventaire en lecture seule (fichiers, modèle de Lunii, espace libre)
2. Préparation des albums en copies (ordre, titres)
3. Conversion audio (MP3 mono 44 100 Hz, sans tags)
4. Jaquette par album
5. Pack au format STUdio par album (menu de choix, puis lecture enchaînée)
6. Sauvegarde complète de la Lunii
7. Récapitulatif et accord explicite
8. Installation avec un outil communautaire
9. Vérification (anciens packs intacts) et éjection

Règles cadre : vos fichiers ne sont jamais modifiés, rien n'est supprimé sur la Lunii, sauvegarde avant toute écriture, accord explicite avant chaque écriture.

## Contribuer

Ajoutez une étape, un piège ou une précision par pull request, sans assouplir les règles cadre. Pour un piège, indiquez le modèle de Lunii et la version de firmware concernés.

## Sources

[lunii-admin-web](https://github.com/olup/lunii-admin-web) et [lunii-admin-builder](https://github.com/olup/lunii-admin-builder) (olup), [STUdio](https://github.com/marian-m12l/studio) (marian-m12l), [lunii-qt](https://github.com/o-daneel/Lunii.QT) (o-daneel).

Projet communautaire indépendant, non affilié à Lunii. Usage personnel, sur votre propre appareil, avec des fichiers dont vous disposez légitimement.

## Licence

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr) : libre de partager et d'adapter, en citant la source.
