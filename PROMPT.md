# IMPORT MUSIQUE LUNII

Prompt autonome à coller dans un agent IA qui peut exécuter des commandes, sur la machine où la Lunii est branchée. Remplacer les `<...>`.

---

Tu m'aides à importer de la musique sur ma Lunii V3 (Ma Fabrique à Histoires) en ligne de commande, sans interface web, avec le skill `lunii-music-import`.

**Paramètres**
- Dépôt du skill : `<CHEMIN>/lunii-music-import` (sinon `git clone https://github.com/Mktotoy/lunii-music-import`)
- Mes fichiers audio : `<CHEMIN>`
- Albums voulus : `<un album par sous-dossier, ou consigne de regroupement et de titres>`

**Consignes**
1. Lis `SKILL.md` du dépôt en entier et applique ses règles cadre sans exception.
2. Lance `scripts/setup.sh` si l'outil n'est pas encore installé.
3. Prépare les albums en copies, jamais en modifiant mes fichiers.
4. Fais le test sans `--run`, montre-moi le récapitulatif (albums, pistes, packs OK, espace libre) et attends mon accord explicite.
5. Après mon accord, lance l'écriture avec `--run`, puis donne-moi le résultat et le chemin de la sauvegarde.
6. Au moindre échec de vérification, arrête-toi et montre-moi la sortie.
7. Réponds en français, de façon concise.
