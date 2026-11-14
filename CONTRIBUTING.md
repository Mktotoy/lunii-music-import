# Contribuer

Les ajouts sont bienvenus : nouveaux formats, prise en charge V2, vraies jaquettes, pièges rencontrés.

## Règles

- **Les règles cadre de `SKILL.md` ne s'assouplissent pas.** Toute étape qui écrit sur la Lunii garde la sauvegarde, le test sur copie, l'ajout seulement et l'accord explicite de l'utilisateur.
- **Aucun code de `lunii-admin-web` dans ce dépôt.** Il n'a pas de licence déclarée : on l'utilise via `scripts/setup.sh`, on ne le recopie pas. Si un morceau est nécessaire, l'extraire au build comme `bundle.mjs` le fait pour l'encodeur BMP.
- **Aucune donnée personnelle** : pas de chemins personnels, noms, numéros de série, clés ou contenus de volume dans les commits, issues ou exemples.
- **Pas de clés.** Les clés de chiffrement sont lues sur l'appareil de l'utilisateur au moment de l'import ; ne jamais en publier.
- Scripts shell en fin de ligne LF, `set -euo pipefail`. Fichiers courts, une responsabilité par fichier.

## Où ajouter quoi

| Ajout | Fichier |
|---|---|
| Une étape de procédure | `SKILL.md`, section « Procédure » |
| Un piège observé | `SKILL.md`, section « Pièges connus » (cause et date) |
| Un format audio | `scripts/lunii-import.sh`, liste des extensions |
| Une option | variable d'environnement dans `scripts/lunii-import.sh`, documentée dans son en-tête et dans `SKILL.md` |
| Un contrôle après import | `scripts/lunii-cli/verify.sh` |

## Tester

Toujours sur une copie : `LUNII_VOLUME=<copie d'un volume Lunii> scripts/lunii-import.sh <albums> --run`. Le script ne démonte que les vrais points de montage.

Décrire dans la PR le modèle de Lunii, la version de firmware et la version du `.md` (deux premiers octets) testés.
