# Modèle de données — Carnet AW

Stockage : une seule clé `localStorage` → `carnet-aw-v1`, un objet JSON.
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
  reglages       : { theme: 'auto'|'clair'|'sombre' }
  seanceEnCoursId: string | null
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
  forces     : [ 'rising' | 'supination' | 'cupping' | 'pronation' ]
  outils     : [ string ]              // noms d'outils, voir plus bas
  vuLe       : ISO date                // dernière fois que le nom a été employé
```

`slug` est la seule chose qui fait dire « c'est le même exercice ». C'est ce qui permet à
la colonne PRÉCÉDENT de traverser les programmes.

## Outils (catalogue implicite lui aussi)

```
Outil
  id        : string
  nom       : string                   // « Poulie haute », « Titan Grip Iron Wrist 60 mm »
  slug      : string                   // identité, mêmes règles que l'exercice
  categorie : string                   // libre : « Grippers », « Poignées AW »… ou vide
  vuLe      : ISO date
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

## Zones de douleur

`'coude_medial' | 'coude_lateral' | 'poignet' | 'avant_bras' | 'epaule' | 'aucune'`

Stockées par identifiant, affichées en toutes lettres. `'aucune'` est **enregistré**, pas
déduit d'une liste vide : une séance sans douleur cochée et une séance non renseignée ne
disent pas la même chose, et le recoupement a besoin de la différence.

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

## Trois ajouts au modèle que tu as écrit

1. **`forces`** sur l'exercice (catalogue, programme et séance) — les quatre forces de
   Larratt, que tu donnais comme « à considérer ». Elles sont là, facultatives, et l'écran
   Suivi les compte pour montrer celle qu'un programme néglige.
2. **`outils`** sur l'exercice, et le catalogue `outils` — demandé en cours de route,
   même principe que les exercices : rien de livré, tout vient de l'usage.
3. **`slug`, `heure`, `faiteA`, `programmeNom`** — de la plomberie :
   `slug` fait l'identité d'un exercice entre programmes, `heure` trie deux séances du même
   jour, `faiteA` donne l'heure réelle d'une série (chrono, et ordre d'exécution),
   `programmeNom` est figé pour qu'une séance reste lisible après suppression du programme.

Rien d'autre n'a bougé.
