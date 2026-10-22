# Modèle de données — Carnet AW

Stockage : une seule clé `localStorage` → `carnet-aw-v1`, un objet JSON.
(Une seconde existe, `carnet-aw-banc-ihm`, et c'est la raison : le banc
d'interface fait tourner la vraie app, qui **écrit** — lancer un repos pose
`chrono`. Il pose `window.__BANC_IHM` avant de charger `store.js`, qui choisit
alors cette autre clé. L'isolation est structurelle, et le banc la mesure.)
Toute lecture et toute écriture passent par `js/store.js`, enveloppées en `try/catch`.
Si l'écriture échoue, l'app le **dit** (bandeau rouge persistant) au lieu de perdre
silencieusement la saisie.

```
Etat
  versionDonnees : 1
  exercices      : [ Exercice ]        // catalogue implicite, alimenté par l'usage
  outils         : [ Outil ]           // idem, pour l'équipement
  programmes     : [ Programme ]
  seances        : [ Seance | SeanceSparring ]
  reglages       : { theme, ecranAllume, notifierRepos }
  seanceEnCoursId: string | null
  chrono         : { finA, duree, libelle } | null   // le repos survit à la fermeture
```

## Catalogue (implicite)

Il n'est **jamais** pré-rempli. Il se construit à mesure : chaque nom d'exercice saisi
dans un programme ou dans une séance y entre, avec ses attributs les plus récents.
Il ne sert qu'à l'autocomplétion et à retrouver « le même exercice » d'une séance à l'autre.

```
Exercice
  id         : string
  nom        : string                  // tel que saisi, affiché tel quel
  slug       : string                  // clé d'identité : minuscules, sans accents, espaces compactés
  aw         : bool
  typeCharge : 'kg' | 'niveau' | 'elastique' | 'poids_corps' | 'duree'
  forces     : [ 'rising' | 'back_pressure' | 'side_pressure'
               | 'supination' | 'cupping' | 'pronation' ]   // affiché « Mouvements »
  structures : [ string ]              // ce que l'exercice charge, voir plus bas
  outils     : [ string ]              // noms d'outils, voir plus bas
  vuLe       : ISO datetime            // dernière fois que le nom a été employé
```

**`forces` garde son nom de champ alors que l'écran dit « Mouvements ».** Le
renommer aurait rendu muets tous les exercices déjà saisis, pour un gain nul :
seul l'affichage avait besoin de changer. Les deux valeurs ajoutées,
`back_pressure` et `side_pressure`, viennent s'ajouter aux quatre d'origine ; un
carnet écrit avant les connaît simplement à zéro.

**`vuLe` porte l'heure, à la milliseconde, et pas seulement la date.** Il ne sert
qu'à classer les suggestions — et la liste étant tronquée à huit, ce classement
décide de ce qui est **visible**. Avec la date seule, tous les outils ajoutés le
même jour étaient à égalité : le tri stable gardait l'ordre d'insertion, et le
dernier ajouté tombait hors des huit. Un outil neuf n'apparaissait jamais dans
l'autocomplétion d'une fiche d'exercice, ce qui a été pris pour un bug
d'affichage. Il est de plus **strictement croissant** : huit outils posés d'un
même geste tombent dans la même milliseconde, et seraient de nouveau à égalité.
Une date seule d'un ancien carnet reste comparable, et se classe avant tout
horodatage du même jour — on ne sait pas à quelle heure elle a été posée.

`slug` est la seule chose qui fait dire « c'est le même exercice ». C'est ce qui permet à
la colonne PRÉCÉDENT de traverser les programmes.

## Outils (catalogue implicite lui aussi)

```
Outil
  id        : string
  nom       : string                   // « Poulie haute », « Titan Grip Iron Wrist 60 mm »
  slug      : string                   // identité, mêmes règles que l'exercice
  categorie : string                   // libre : « Grippers », « Poignées AW »… ou vide
  vuLe      : ISO datetime             // voir plus haut : il décide de ce qui est visible
```

Un exercice porte **autant d'outils qu'il en faut** — c'est le cas « Titan Grip **sur** poulie
haute », qui est deux outils sur un seul exercice, pas un troisième outil à inventer.

L'outil est stocké **par son nom**, pas par un identifiant, dans `ExerciceProgramme` et
`ExerciceSeance`. C'est délibéré : une séance de mars doit rester lisible même si l'outil a
été renommé ou retiré du catalogue depuis. Le catalogue ne sert qu'à l'autocomplétion et au
rangement ; il n'est jamais une clé étrangère.

Les **catégories** ne sont pas une liste fermée : elles n'existent que parce qu'une est tapée.
Un outil sans catégorie se range sous « Sans catégorie », en bas.

## Programme — le modèle réutilisable

```
Programme
  id          : string
  nom         : string
  description : string
  archive     : bool
  creeLe      : ISO
  exercices   : [ ExerciceProgramme ]

ExerciceProgramme
  id            : string
  ordre         : int
  nom           : string
  slug          : string
  aw            : bool
  typeCharge    : 'kg' | 'niveau' | 'elastique' | 'poids_corps' | 'duree'
  forces        : [ string ]
  outils        : [ string ]           // noms, copiés — pas des références
  consigne      : string               // tempo, tenue, prise — instruction d'exécution
  reposSecondes : int
  series        : [ SerieProgramme ]

SerieProgramme
  id         : string
  type       : 'echauffement' | 'normale' | 'degressive' | 'echec'
  repsCible  : string                  // libre : "30", "3x5s", ""
  chargeCible: string                  // libre : "17,5", "N3", "élastique rouge", ""
```

Une série planifiée est **une ligne**, avec ses deux champs. Jamais `"30/20/14/12"`.

## Séance — le journal daté

Une séance est une **copie intégrale** du programme au moment du lancement. Aucune
référence vivante : `programmeId` n'est qu'une étiquette de provenance, personne ne la
suit pour aller relire le programme. Modifier un programme ne touche pas une séance passée.

```
Seance
  id          : string
  type        : 'muscu'
  date        : 'AAAA-MM-JJ'
  heure       : ISO                    // pour trier deux séances du même jour
  programmeId : string | null
  programmeNom: string | null          // figé, survit à la suppression du programme
  dureeMin    : int | null
  rpeGlobal   : int | null             // 1–10
  note        : string
  douleurs    : [ string ]             // zones, voir plus bas
  exercices   : [ ExerciceSeance ]

ExerciceSeance
  id, ordre, nom, slug, aw, typeCharge, forces, outils, consigne, reposSecondes
  series : [ SerieSeance ]

SerieSeance
  id         : string
  type       : 'echauffement' | 'normale' | 'degressive' | 'echec'
  repsCible  : string                  // copié du programme — affiché en gris dans le champ
  chargeCible: string                  // idem
  repsReel   : string                  // ce que je saisis
  chargeReel : string                  // ce que je saisis
  rpe        : int | null
  faite      : bool
  faiteA     : ISO | null              // horodatage du ✓, sert au chrono et à l'ordre réel
```

```
SeanceSparring
  id          : string
  type        : 'sparring'
  date        : 'AAAA-MM-JJ'
  heure       : ISO
  club        : string
  dureeMin    : int | null
  rounds      : int | null
  style       : 'hook' | 'toproll' | 'mixte' | ''
  partenaires : string
  technique   : string
  ressenti    : string
  note        : string
  douleurs    : [ string ]
```

Les deux portent `type`, `date`, `heure` et `douleurs` aux mêmes noms : c'est ce qui permet
au journal et au recoupement 72 h de les traiter dans une seule liste.

## Structures chargées

```
'poignet' | 'coude_medial' | 'coude_lateral' | 'avant_bras' | 'epaule'
          | 'main_doigts' | 'biceps'
```

Les **cinq premières sont exactement les zones de douleur**. Ce n'est pas une coïncidence :
c'est ce qui permet à Suivi de répondre à « quand ai-je chargé lourd le médial », puis de la
croiser avec « quand le médial a fait mal ». Les deux dernières n'ont pas de douleur
correspondante, et c'est assumé.

Portées par l'exercice (catalogue, programme et séance), facultatives, copiées comme le
reste — jamais référencées.

## Zones de douleur, et leur intensité

```
Douleur
  zone      : 'coude_medial' | 'coude_lateral' | 'poignet' | 'avant_bras'
            | 'epaule' | 'aucune'
  intensite : 0–10 | null
```

`'aucune'` est **enregistré**, pas déduit d'une liste vide : une séance sans douleur cochée
et une séance non renseignée ne disent pas la même chose, et le recoupement a besoin de la
différence. Elle ne porte jamais d'intensité.

**`intensite` vaut `null` quand elle n'est pas renseignée, jamais une valeur par défaut.**
Une tendinopathie ne se suit pas en oui/non : ce qui renseigne est la pente. Mais un relevé
absent ne doit pas être inventé, sous peine de fabriquer une pente qui n'existe pas.

**Compatibilité descendante.** Les carnets antérieurs stockaient `douleurs: ['coude_medial']`,
une simple liste de chaînes. `normaliserDouleurs()` accepte les deux formes et convertit **à
la lecture** : une sauvegarde ancienne se relit intégralement, avec une intensité inconnue.

## Le repos survit à la fermeture

`chrono` porte `finA` en **horodatage absolu**. Sur téléphone, basculer vers un autre app peut
faire tuer la page entre deux séries : au retour, le temps restant est recalculé depuis `finA`,
et reste juste même après dix minutes de page morte. Un chrono déjà écoulé ne se rouvre pas.

## L'import : fusionner ou remplacer

Remplacer est prévisible mais destructeur — importer depuis un vieux téléphone effaçait des
séances plus récentes, en silence. **Fusionner** est désormais le premier choix proposé :

- l'identité est l'`id` ;
- un élément présent des deux côtés est gardé **dans sa version courante** — ce qui est sous
  les doigts fait foi, l'import ne défait pas une saisie du jour ;
- un élément absent du courant est ajouté ;
- **rien n'est jamais supprimé par un import.**

Les catalogues fusionnent par `slug` : ce sont des aides à la saisie, pas des données. Le
compte de ce qui a été ajouté et gardé est affiché — une fusion muette serait pire qu'un
remplacement. Avant un remplacement, l'écran compare les dates et **avertit** si le carnet
courant contient du plus récent que la sauvegarde.

## Charge non numérique

`chargeReel` et `repsReel` sont des **chaînes libres**. `N3`, `élastique rouge`, `+ceinture`
sont des valeurs valides. Le calcul de volume appelle `nombre(txt)` qui rend `null` dès que
la chaîne n'est pas un nombre (`"17,5"` → `17.5`, `"N3"` → `null`). Une série non chiffrée
n'est pas comptée dans le tonnage **et elle est comptée à part** : l'écran affiche
« 2 140 kg · 3 séries non chiffrées ». Jamais un zéro silencieux.

## Le volume compte ce qui a été FAIT

`volumeSeance()` ne lit que `chargeReel` / `repsReel`, et ne compte une série que si elle
porte le ✓ ou une valeur saisie. Une séance ouverte depuis un programme et pas encore
commencée affiche donc **0 kg**, pas le tonnage prévu par le programme.

Ce qui sort du tonnage sort pour une raison, et l'écran la dit :

| cas | compté comme |
|---|---|
| `N3`, une bande, le poids du corps | `seriesNonChiffrees` — « à charge non chiffrée » |
| type en kilos mais charge ou reps manquante | `seriesIncompletes` — « il manque la charge ou les reps » |

Jamais un zéro muet.

## Ce qui a changé après coup

Trois champs étaient **déclarés sans être employés** — le piège n° 5 appliqué au modèle
lui-même. Ils sont maintenant branchés :

| champ | état précédent | aujourd'hui |
|---|---|---|
| `rpe` par série | déclaré, aucun chemin de saisie | appui long sur le ✓, ou menu de la série |
| `faiteA` | écrit, jamais lu | `dureeReelle()` en déduit la durée, du premier ✓ au dernier |
| `repsTotal`, `seriesAw` | calculés, jamais affichés | totaux de séance et détail du journal |

`dureeReelle()` rend `null` tant qu'il n'y a pas **deux** validations : une seule ne borne
aucun intervalle, et un zéro serait un mensonge.

## Trois ajouts au modèle que tu as écrit

1. **`forces`** sur l'exercice (catalogue, programme et séance) — les forces de Larratt,
   que tu donnais comme « à considérer ». Elles sont là, facultatives, et l'écran
   Suivi les compte pour montrer celle qu'un programme néglige. Elles sont **six**
   depuis, et s'affichent sous le nom de **Mouvements** ; le champ, lui, reste `forces`.
2. **`outils`** sur l'exercice, et le catalogue `outils` — demandé en cours de route,
   même principe que les exercices : rien de livré, tout vient de l'usage.
   **`structures`** et l'intensité de douleur ont suivi, pour la même raison.
3. **`slug`, `heure`, `faiteA`, `programmeNom`** — de la plomberie :
   `slug` fait l'identité d'un exercice entre programmes, `heure` trie deux séances du même
   jour, `faiteA` donne l'heure réelle d'une série (chrono, et ordre d'exécution),
   `programmeNom` est figé pour qu'une séance reste lisible après suppression du programme.

Rien d'autre n'a bougé.
