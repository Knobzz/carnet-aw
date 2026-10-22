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
  routineRecup   : Programme | null    // la routine quotidienne, voir plus bas
  releves        : [ Releve ]          // la règle des 24 h, voir plus bas
  seances        : [ Seance | SeanceSparring | SeanceRecup ]
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
  typeCharge : 'kg' | 'niveau' | 'elastique' | 'poids_corps'
  colonnes   : [ 'charge' | 'reps' | 'duree' ]   // ce que la ligne fait saisir
  cote       : 'droit' | 'gauche' | 'deux' | null   // quel bras, voir plus bas
  prise      : 'ouverte' | 'fermee' | null
  muscles    : [ string ]              // ce qui tire, voir plus bas
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

C'est ce qui rend le sélecteur d'équipement possible — catégories repliables, plusieurs
outils cochés d'un coup — et c'est aussi ce qui l'oblige à une précaution : un exercice
peut porter un nom d'outil **absent du catalogue**, saisi à la main ou retiré de
l'équipement depuis. Le sélecteur les montre à part, en tête, et **ne les perd jamais à
la validation**. Un outil stocké par son nom ne doit pas disparaître parce que le
catalogue, lui, a changé.

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
  typeCharge    : 'kg' | 'niveau' | 'elastique' | 'poids_corps'
  colonnes      : [ string ]
  cote          : string | null
  prise         : string | null
  muscles       : [ string ]
  forces        : [ string ]
  outils        : [ string ]           // noms, copiés — pas des références
  consigne      : string               // tempo, tenue, prise — instruction d'exécution
  reposSecondes : int
  series        : [ SerieProgramme ]

SerieProgramme
  id         : string
  type       : 'normale' | 'degressive' | 'echec'
  repsCible  : string                  // libre : "30", ""
  chargeCible: string                  // libre : "17,5", "N3", "élastique rouge", ""
  dureeCible : string                  // en secondes : "45", ""
```

Une série planifiée est **une ligne**, avec ses champs. Jamais `"30/20/14/12"`.

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
  id, ordre, nom, slug, aw, typeCharge, colonnes, cote, prise, muscles,
      forces, outils, consigne, reposSecondes
  series : [ SerieSeance ]

SerieSeance
  id         : string
  type       : 'normale' | 'degressive' | 'echec'
  repsCible  : string                  // copié du programme — affiché en gris dans le champ
  chargeCible: string                  // idem
  dureeCible : string                  // idem
  repsReel   : string                  // ce que je saisis
  chargeReel : string                  // ce que je saisis
  dureeReel  : string                  // ce que je saisis, en secondes
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
  cote        : 'droit' | 'gauche' | 'deux' | null
  partenaires : string
  technique   : string
  ressenti    : string
  note        : string
  douleurs    : [ string ]
```

Les trois portent `type`, `date`, `heure` et `douleurs` aux mêmes noms : c'est ce qui permet
au journal et au recoupement 72 h de les traiter dans une seule liste.

## La récupération — une régularité, pas une charge

L'élastique quotidien : faible résistance, beaucoup de répétitions, presque tous les
jours. Ça n'a rien à faire dans le tonnage — cent répétitions à l'élastique noieraient le
compte de séries d'une semaine — et ce qu'on veut en lire n'est pas « combien » mais
« l'ai-je fait ».

```
routineRecup : Programme          // définie UNE FOIS, jamais lancée : elle se coche

SeanceRecup
  id          : string
  type        : 'recup'
  date        : 'AAAA-MM-JJ'
  heure       : ISO
  note        : string
  douleurs    : [ ]               // toujours vide : demander la douleur chaque soir
                                  // serait du frottement sur un geste quotidien
  exercices   : [ ExerciceSeance ]  // mêmes exercices, mêmes colonnes, UNE série
```

La routine est un `Programme` et la journée une `Seance` : ce sont les mêmes exercices,
les mêmes colonnes, la même ligne de saisie. **Seul `type: 'recup'` les distingue** — ce
qui suffit au journal pour les ranger, et à `seancesMuscuTriees()` pour les ignorer, donc
au tonnage pour ne jamais les voir.

Une journée est une **copie** de la routine, exactement comme une séance l'est d'un
programme : modifier la routine ne réécrit pas ce qui a déjà été coché.

**Une journée n'est enregistrée qu'une fois quelque chose coché**, et elle ressort si on
vide tout. Une journée vide écrite dans le journal dirait qu'on l'a faite.

`volumeRecupParSemaine()` compte les **répétitions** et les **secondes** par semaine,
jamais des kilos : l'élastique n'a pas de charge chiffrée, et c'est très bien ainsi.
La régularité dit si le geste tient ; elle ne dit **pas** s'il progresse, et une
rééducation qui ne monte jamais en charge ne soigne rien. Une journée non cochée ne pèse
rien : sinon la pente monterait sans qu'on ait rien fait.

`statsRecup()` rend les jours faits sur une fenêtre et la série en cours. Cette série se
compte **depuis hier** tant qu'aujourd'hui n'est pas coché : sinon elle afficherait zéro
chaque matin, ce qui est exactement ce qui démotive. Un jour compte comme fait dès
**une** ligne cochée : une routine à moitié faite reste une journée où l'on s'y est mis.

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

## Le côté

Le bras de fer est asymétrique, et une épicondylite est d'**un** côté. Sans cette
information, « coude médial 4/10 » ne dit pas quel coude, et le recoupement 72 h croise
la douleur d'un bras avec la charge de l'autre : il répond alors à côté de la question
qu'on lui pose. C'était le trou le plus grave du modèle, et il est passé inaperçu
longtemps parce que rien ne le signalait.

```
'droit' | 'gauche' | 'deux' | null
```

Porté par l'exercice (catalogue, programme et séance), par le sparring, et par la
douleur. **`null` veut dire NON RENSEIGNÉ** et n'est jamais remplacé par une valeur par
défaut — même principe que `intensite`. Un carnet écrit avant se relit entier, avec des
côtés inconnus plutôt qu'inventés, et ses totaux ne bougent pas d'un pouce.

**« Les deux » n'est pas un troisième côté.** C'est une charge qui porte sur les deux
bras, et elle compte **des deux côtés** : une barre chargée des deux mains sollicite le
médial droit *et* le gauche. `cotesCouverts()` porte cette règle, et c'est elle qui
rend `derniereSollicitationStructure()` juste.

Ce qui n'a pas de côté n'est **ni réparti ni jeté** : il tombe dans un seau à lui,
nommé, que l'écran montre à part. Un exercice sans côté pourrait être en cause dans une
douleur sans qu'on puisse le dire — et c'est exactement ce qu'il faut afficher.

`derniereSollicitationStructure()` rend donc `{ lignes, jamais }` : une ligne par
*(structure, côté)* réellement chargée, et la liste des structures jamais touchées.
L'écran n'affiche le côté que si le carnet en porte **au moins un** : tant qu'il n'y en
a aucun, répéter « côté non renseigné » sur chaque ligne serait du bruit sur toute la
hauteur. La fonctionnalité est invisible jusqu'à ce qu'on s'en serve.

Le côté se pose **dans la feuille d'intensité**, pas dans un troisième appui : une
feuille, deux questions. Un appui de plus en aurait fait l'information qu'on ne
renseigne jamais.

## Les muscles, et la prise

Les **structures** disent ce qui encaisse — poignet, coude médial : c'est le vocabulaire
de la douleur. Les **muscles** disent ce qui tire. Les deux sont portés par l'exercice,
et c'est leur croisement qui rend la carte lisible.

**Trente-cinq muscles** : tout ce qu'une planche du membre supérieur nomme, plus les
profonds qu'elle ne montre pas — coraco-brachial, brachial, carré pronateur, supinateur,
subscapulaire. La liste s'arrête à l'épaule : le dos et la poitrine n'y sont que par ce
qui tire sur le bras (grand dorsal, grand pectoral).

Elle est descendue **jusqu'à la main** en 1.22.0 : neuf muscles du thénar, de
l'hypothénar et de la paume, plus trois de l'avant-bras profond qui commandent le pouce
et l'index. Ce n'est pas du décor sur un carnet de bras de fer — la pression du pouce et
la main qui serre sont exactement ça. Ils étaient restés dehors parce que leurs planches
n'avaient jamais été versées au dépôt, pas par décision.

Chacun porte **quatre informations**, parce qu'une liste de noms latins ne se coche pas :

| champ | ce que c'est | pourquoi |
|---|---|---|
| `nom` | « Fléchisseur ulnaire du carpe » | le nom actuel, celui des manuels |
| `court` | « Fléch. ulnaire » | les barres n'ont pas 190 px pour un nom entier à 320 px |
| `aussi` | « cubital antérieur » | le nom classique, celui des planches françaises |
| `quoi` | « plie le poignet, côté auriculaire » | **ce qu'il fait** — la seule entrée pour qui ne connaît pas l'anatomie |
| `articulation` | `poignet` | ce qu'il mobilise, pour le compte par articulation |

Et deux marques : `profond: true` (sous un autre muscle, donc invisible au toucher) et
`medial` / `lateral` pour l'insertion commune au coude.

Attention au piège : **« long supinateur » désigne le brachio-radial, pas le
supinateur.** Les confondre enverrait la charge au mauvais muscle. Le banc tient un
contrôle là-dessus.

**`medial: true` marque la masse flexo-pronatrice.** Rond pronateur, fléchisseur radial du
carpe, long palmaire, fléchisseurs des doigts et fléchisseur ulnaire du carpe partagent
**un seul tendon d'origine, sur l'épicondyle médial** — cinq muscles, et le banc vérifie
que la liste ne bouge pas. `lateral: true` fait de même pour les radiaux, l'extenseur
ulnaire, les extenseurs des doigts et le supinateur, qui naissent de l'épicondyle
latéral.

C'est de l'anatomie, pas une opinion, et ça reste **une marque parmi d'autres** : l'app
compte les séries sur chaque insertion et le dit en une ligne. Elle n'en fait pas le
sujet de l'écran, et ne colore plus les barres en fonction.

Le **carré pronateur** (distal) et le **brachio-radial** (crête supracondylaire) ne
portent aucune marque. Les ranger avec les autres aurait été plus simple à lire et faux —
et ferait accuser la mauvaise insertion.

### La prise

`'ouverte' | 'fermee' | null`. Ce n'est pas un détail de style : une prise **fermée** fait
travailler les fléchisseurs des doigts, qui naissent eux aussi de l'épicondyle médial ;
une prise ouverte pousse sans serrer. Le même exercice, des deux façons, ne charge pas la
même chose.

**Et le pouce, depuis 1.22.0 — mais seulement ce qu'une source dit.** Une étude EMG de
1970 (JBJS, 115 sujets) établit que les muscles **extrinsèques** font la force d'une
prise de force, les intrinsèques assistant, et que le **thénar** y est employé dans
toutes ses formes. Une prise fermée propose donc aussi le long et le court fléchisseur du
pouce, le court abducteur, l'opposant et l'adducteur.

Ce qui reste **dehors** l'est pour la même raison : la même étude donne les **lombricaux**
comme *non employés* dans une prise de force, et l'hypothénar n'y est pas documenté. On ne
comble pas un trou de la source avec une intuition, et un contrôle tient ce refus.

> **Faux ami, écrit dans le code.** La « hook grip » de cette étude est la prise à quatre
> doigts sans pouce du chirurgien de la main, **pas le hook du bras de fer**. Les
> confondre ferait dire à l'étude ce qu'elle ne dit pas — même piège que « long
> supinateur » pour le brachio-radial.

**Aucun des muscles de la main n'est rattaché aux six mouvements.** Il n'existe pas
d'étude qui attribue le bras de fer à des muscles intrinsèques, et l'EMG de surface de
l'avant-bras souffre d'une diaphonie qui rend l'attribution à un muscle donné peu fiable.
Ce que l'app sait dire, elle le dit ; le reste, elle ne l'invente pas.

En revanche un exercice **nommé** « pince », « pinch », « gripper », « serrage » ou
« serrer » propose le pouce : c'est la source « le nom », ce que l'utilisateur a écrit
lui-même, et pas une mesure sur le bras de fer. « pouce » et « thumb » restent au groupe
qui l'**ouvre** — un même mot pour les six muscles du pouce noierait la proposition.

### Les trois sources de proposition

On ne peut pas demander de cocher trente-cinq muscles à qui ne connaît pas les termes : la
case resterait vide. La fiche **propose** donc, et dit **d'où ça vient** :

| source | d'où | solidité |
|---|---|---|
| **le nom** | « Curl **biceps** » contient le mot | ce que l'utilisateur a écrit lui-même |
| | les noms classiques comptent : « long supinateur », « grand palmaire », « cubital antérieur » | ceux des planches françaises |
| **le mouvement** | cupping = flexion du poignet, pronation, supination | manuel d'anatomie |
| **la prise** | fermée = on serre = fléchisseurs des doigts | définition de serrer |
| **le mouvement, suite** | rising, back pressure, side pressure | **à vérifier** : une seule étude EMG, et ce ne sont pas des actions articulaires |

Les mots lus dans le nom sont **volontairement discriminants**. « Curl » seul ne propose
rien — un curl marteau, un curl pronateur et un wrist curl ne travaillent pas la même
chose. Et « grip » a été retiré parce que « Titan Grip » et « Fat grip » sont des
**outils** : le banc a attrapé ce faux positif.

#### Deux défauts mesurés sur de vrais noms

**La négation était ignorée, et c'est le pire des deux.** « Wrist curl inversé » contient
« wrist curl », donc il proposait les **fléchisseurs** — exactement les muscles opposés à
ceux qu'il travaille. Une proposition fausse est pire qu'une absence : l'écran coche des
cases plausibles que personne ne va relire. L'app se contredisait d'ailleurs elle-même,
puisqu'elle écrit « le wrist curl inversé » dans l'explication de la zone des extenseurs.

Un nom qui porte **« inversé »** ou **« reverse »** lit désormais le geste *retourné*, et
ne lit plus les mots du geste droit. On prend le geste le plus **long** qui corresponde :
« wrist curl inversé » est un wrist curl retourné, pas un curl retourné — sans ça il
proposerait le brachio-radial, qui n'a rien à faire dans une flexion de poignet.

**Les articles cassaient la correspondance.** « Flexion **du** poignet » ne contient pas
« flexion poignet » : il ne proposait **rien**. Pareil pour « ouverture **de la** main ».
L'app est en français, et le français met des articles — on tolère donc une suite de mots
de liaison entre deux mots du motif. Rien n'est ajouté à la table : c'est la lecture qui
change.

> Trouvé parce que MB a demandé « si je fais un curl inversé, ça ne fait pas travailler
> les mêmes muscles que paume vers le haut, non ? » Il avait raison, et sa question a
> révélé deux défauts que la table seule ne montrait pas.

#### Les mots se lisent ENTIERS

Trois faux positifs mesurés, et chacun proposait un muscle qui n'a rien à faire là :

| nom | proposait | pourquoi |
|---|---|---|
| `Élévation latérale` | le **grand dorsal** | « latérale » contient `lat` |
| `Pression du pouce` | le **grand pectoral** | « pression » contient `press` |
| `Écartement des doigts` | les **fléchisseurs** | `doigts` ne dit pas le sens |

Les deux premiers sont réglés par une **règle** : un mot ne se lit que s'il est entier.
C'est la même famille que `grip` dans « Titan Grip », retiré pour cette raison — mais une
règle vaut mieux qu'un mot retiré de plus à chaque fois. Le **pluriel** français est
toléré (« tractions », « pronations »), et l'irrégulier est ajouté à la table quand il
existe (« pectoraux »).

Le troisième ne pouvait pas l'être : `doigts` **est** un mot entier. Le problème est le
mot lui-même — il ne dit pas dans quel **sens** les doigts travaillent, et des doigts qui
s'écartent sont tenus par les extenseurs. Il est retiré et remplacé par
`flexion doigts` et `fermeture main`, pendant que `ecartement doigts` rejoint les
extenseurs. **Un mot qui désigne les deux ne désigne aucun des deux.**

**Rien n'est écrit sans un geste.** La proposition remplit les cases quand on appuie ;
ce qui est stocké reste une décision, pas une déduction. Et la quatrième source est
gratuite : le catalogue retient les muscles **avec le nom de l'exercice**, donc on ne les
coche qu'une fois.

### La carte : une illustration par muscle

Il y a eu ici, successivement : un **schéma de bandes dessiné à la main**, puis des
**polygones cliquables posés sur les gravures**. Les deux ont été retirés, et les trois
méthodes essayées pour faire suivre les contours réels ont échoué — remplissage depuis une
graine (la tache fuit par les hachures, les traits de Gray ne sont pas fermés), direction
des fibres (sépare les groupes, pas les muscles voisins, qui sont parallèles), ligne
médiane + bord d'encre (correct sur les avant-bras, faux sur le bras, qui est en diagonale).

Le problème est résolu **autrement** : chaque muscle a maintenant **sa propre
illustration** — le membre entier, lui seul teinté en rouge. La forme y est **juste par
construction**, puisque c'est la planche elle-même qui porte la teinte. Rien à découper.

```
Muscle
  image : 'icones/muscle-fcu.png'     l'illustration propre, ou absente
```

**Les trente-cinq** en ont une. `musclesSansImage()` nomme les manquants plutôt que de
les laisser se fondre dans le lot, et le banc va chercher chaque fichier dans le dépôt :
une illustration annoncée mais absente donnerait une image cassée que personne ne verrait
avant le téléphone.

Un champ `planche` a longtemps désigné, à côté, la planche générale de l'atlas. Ces
planches ont été supprimées avec leur code de repli, et le champ a survécu **dix-neuf
commits sans être lu une seule fois** — déclaré partout, utilisé nulle part. C'est le
piège n° 5 appliqué au modèle, celui-là même que la section « Ce qui a changé après
coup » revendique d'avoir corrigé. Il est retiré.

### Les faire défiler au doigt

L'onglet Suivi montre les muscles sollicités **dans l'ordre des barres**, du plus chargé au
moins, et on passe de l'un à l'autre **d'un glissement du doigt** sur l'image. Un compteur
dit où on en est (`3 / 6`).

Deux gestes sur la même zone, donc, et il faut les distinguer :

- **la distance tranche.** Sous 36 px, c'est un appui qui a tremblé : l'image s'ouvre en
  grand. Au-dessus, c'est un défilement, et l'appui ne doit *pas* partir ;
- **le geste doit être horizontal** (`|dx| > |dy|`). Un doigt qui part en diagonale veut
  faire défiler la page, pas la liste ;
- **`touch-action: pan-y`** sur la zone : le navigateur garde le défilement vertical — la
  page bouge normalement — et nous laisse l'horizontal. Sans ça, le geste part en travers ;
- **ça boucle.** Au dernier, le geste suivant revient au premier : un cul-de-sac au bout
  d'une liste qu'on feuillette donne l'impression que le geste ne marche plus ;
- **les flèches du clavier font la même chose.** Le glissement ne doit pas être le seul
  chemin, et le nom de chaque barre ouvre toujours directement l'image du sien.

La vignette est plafonnée en hauteur : un avant-bras fait 406 × 1241, à pleine largeur il
mange l'écran et on ne voit plus les barres.

### Trois recadrées sur trente-cinq

Deux versions ont recadré **toutes** les planches sur leur zone rouge, sans que personne
ait compté qui en avait besoin. La mesure, faite après coup, dans le navigateur :

> la carte fait 290 px (`.planche-carte`) et coupe **à droite** (`overflow: hidden`) ; la
> vignette s'affiche à sa taille naturelle, plafonnée à 400 px de haut. Sur la planche
> entière, le muscle marqué est donc **visible à 100 % pour trente-deux muscles sur
> trente-cinq**.

Trois exceptions, et elles seules : le **brachial** (5 % du muscle visible), le **biceps**
(40 %) et l'**opposant de l'auriculaire** (35 %). Leurs planches sont plus larges que la
carte, et c'est le muscle lui-même qui sort du cadre. Quatre autres débordent aussi —
grand pectoral, coraco-brachial, triceps, deltoïde — mais ce qui est coupé y est du
décor.

La justification d'origine ne tenait pas à la mesure non plus : elle disait « le biceps
était un filet rouge dans une cage thoracique », alors que le biceps occupe **54 %** de la
carte. Le problème était le *clipping*, pas la taille du muscle.

**Le marquage ne se devine pas.** Les planches sont des PNG à **palette de 32 couleurs**.
On y cherche l'amas rouge franc — `r > 120`, `g < 0.20·r`, `b < 40` — nettement séparé de
l'orange de la gravure, qui vit à `g/r ≈ 0.34`. La version 1.21.0 affirmait que « le
marquage est exactement `(255, 0, 0)` » : c'est **faux en entrée**, quinze des vingt-deux
sources n'en portaient aucun pixel. Ce rouge pur n'existait que dans la **sortie**,
fabriqué par la re-quantification qui suivait le découpage — un critère vérifié là où il
ne pouvait pas tomber. On recadre désormais l'image à palette **telle quelle**, et les
planches non recadrées sont copiées **octet pour octet**.

`outils/recadrer-planches.py` porte sept contrôles. Le plus utile **refait la mesure** et
exige qu'elle corresponde à la liste, dans les deux sens : rien hors liste qui soit coupé,
rien dans la liste qui ne le soit pas. C'est lui qui a trouvé l'opposant de l'auriculaire,
tout seul, à l'arrivée des planches de la main.

**Poids.** `icones/planches/` porte les trente-cinq planches entières, et
`icones/planches-gray/` les trente-sept sources d'origine sous leur nom latin. Sans elles,
un recadrage n'est ni rejouable ni rattrapable — c'est ce qui manquait à la 1.21.0.
Recomposées sur blanc et réduites à une palette sans tramage, elles sont
**indistinguables à l'œil** : ce sont des gravures à quatre teintes, pas des photos. Rien
de tout ça n'est pré-chargé ni servi : le service worker ne met en cache que les
illustrations réellement consultées.

> **Une réduction de palette peut DÉTRUIRE un marquage, en silence.** Celui du carré
> pronateur ne couvre que **0,9 %** de sa planche : à 32 couleurs il disparaissait
> entièrement, et la planche serait entrée au dépôt vide sans que rien ne le signale.
> Elle est à **40 couleurs**, la plus petite palette mesurée qui le préserve — 99 % du
> marquage pour 6 ko de plus. Un contrôle relit désormais toute l'archive et exige que
> chaque source porte encore son marquage.

Le carré pronateur et le coraco-brachial n'avaient pas de marquage un moment, faute
d'avoir leur bonne planche ; elles sont arrivées depuis, et leur muscle est désormais
désigné — la bande distale entre radius et ulna, et le creux de l'aisselle.

**Une planche suit une autre convention** : le grand pectoral vient d'une autre série, et
elle marque son muscle **à l'envers** des autres — le pectoral est teinté pendant que le
deltoïde derrière lui reste en **gris**. Mesuré : **38,8 %** de pixels teintés contre
28,1 % de gris.

Le détecteur ne la lit pas, et c'est une limite **du détecteur**, pas de la planche. Sa
teinte vit entre `g/r = 0.22` et `0.38`, et son rouge le plus franc est à `(96, 17, 0)` —
rejeté par le seuil `r > 120`. Relâcher ce seuil pour elle ferait passer l'orange des
trente-quatre autres pour du marquage, et `--controle seuil` le montre en une seconde.

Ce n'est pas grave, et c'est là qu'on s'arrête : **son muscle occupe presque toute
l'image**, donc elle n'a rien à recadrer. Elle est nommée dans `HORS_DETECTEUR` pour que
les contrôles l'attendent, pas comme un défaut — inutile de la « réparer » au prochain
passage.

> Elle a d'abord été décrite ici comme « ne portant aucun marquage ». C'était faux, et
> c'est en la regardant qu'on l'a vu : le détecteur ne trouvait rien, et j'avais pris
> ça pour une propriété de la planche au lieu d'une limite de l'outil.

### Les planches de Gray

Le schéma répond à *combien*. Il ne répondra jamais à *à quoi ça ressemble, et où est-ce
exactement* — c'est un schéma de bandes, et c'est écrit à l'écran. Les gravures de
**Henry Gray, Anatomy of the Human Body, 1918** répondent à ça, et à rien d'autre.

**1918, domaine public** : c'est la seule raison de ces planches-là. Une planche trouvée au
hasard sur le web aurait une licence invérifiable sur une app publiée.

Chaque muscle porte **son nom latin et sa planche**. Le latin n'est pas de la décoration :
c'est le seul mot **écrit sur la gravure**. Chercher « fléchisseur ulnaire » sur une
planche de 1918 ne donne rien ; chercher *Flexor carpi ulnaris* le trouve.

Elles ne sont **pas pré-chargées**. Le service worker met en cache tout ce qui passe, donc
une illustration consultée une fois reste disponible hors ligne — mais tant qu'on ne
l'ouvre pas, elle ne coûte rien à l'installation.

**Attention** : elles ne sont pas non plus dans la liste de pré-cache de `sw.js`, qui ne
porte que la coque et les icônes de l'app. En **mode avion**, une illustration jamais
ouverte ne se chargera pas. C'est un choix de poids, pas un oubli, mais il se paie en
salle et il faut le savoir.

Le libellé de chaque barre est un **bouton** : c'est le seul chemin vers les muscles qui
n'ont pas de tracé sur le schéma, qui seraient sinon des noms sans visage.

Le banc **va chercher chaque fichier annoncé** : une illustration nommée mais absente
donnerait une image cassée que personne ne verrait avant le téléphone. Et l'iframe du banc
d'interface porte `<base href="../">`, pour que `icones/muscle-fcu.png` s'y résolve
**exactement comme dans `index.html`** — sans ça, une planche trouvée au banc pourrait
être introuvable en production.

Ce que ce n'est **pas** : une planche médicale. Les contours sont approximatifs, en
particulier les insertions. Des régions nettes, nommées et à la bonne place valent mieux
qu'un réalisme raté à 170 px de large.

### Ce qui est compté

`chargeParMuscle()` suit les mêmes règles que les structures : séries **validées**
seulement, « les deux » compte des deux côtés, et ce qui n'a pas de côté reste à part.
La **récupération y est incluse**, et c'est voulu : cent répétitions d'élastique chargent
le fléchisseur, même si elles n'ont rien à faire dans le tonnage. Ce qu'on mesure ici
n'est pas du travail, c'est de la sollicitation.

Les séries d'un exercice **sans muscle renseigné** sont comptées à part et l'écran le dit :
elles ne sont nulle part sur la carte.

### Ce que tu mobilises

`chargeParArticulation()` répond à une autre question. Un compte par muscle dit *lequel
travaille* ; celui-ci dit *qu'est-ce que je fais travailler* — épaule, coude, rotation de
l'avant-bras, poignet, doigts, pouce. C'est la question d'un programme, et un **zéro y est
une information** : un poignet jamais sollicité se voit.

**Une série s'y compte une fois par articulation**, même si l'exercice coche trois muscles
du coude. Additionner les muscles donnerait des nombres plus grands que le nombre de
séries faites — un compte que personne ne peut relire. Un exercice qui mobilise deux
articulations compte en revanche pour les deux : c'est vrai.

### Des barres qui se comparent

Les lignes d'un même groupe **partagent la grille du groupe** (`.barres-serrees`,
`display: contents` sur la ligne). Tant que chaque ligne était sa propre grille, la
colonne du libellé dépendait du mot le plus long de *sa* ligne : une piste courte remplie
à fond paraissait plus basse qu'une piste longue à moitié. Le banc mesure que toutes les
pistes d'un groupe commencent au même endroit, font la même longueur, et qu'il en reste
assez pour comparer.

## Les réglages d'un outil

Un même outil ne charge pas pareil selon la façon dont il est monté. Sur une poignée de
pronation, le mousqueton posé **à l'extérieur** fait porter la pression sur le bord externe
de la main et tire sur les extenseurs ; **à l'intérieur**, c'est l'autre bord. Ce n'est ni
un autre outil, ni un autre exercice : c'est un **réglage**.

```
Outil (catalogue)
  reglages : [ { id, nom, slug, muscles: [] } ]

Exercice
  reglages : { '<slug de l’outil>': '<nom du réglage>' }
```

**Les réglages vivent sur l'outil, pas sur l'exercice.** On les écrit une fois au
catalogue, on les coche ensuite. Les saisir à chaque exercice donnerait « extérieur »,
« Exterieur » et « ext » : trois réglages pour un seul.

**Côté exercice, la clé est le slug de l'outil tel que l'exercice le porte** — exactement
comme le reste. Renommer un outil au catalogue ne touche pas les exercices passés : leur
outil garde son ancien nom, et son réglage reste accroché au même endroit.

**Retirer l'outil emporte son réglage.** `reglagesPortes()` ne rend que les réglages dont
l'outil est encore coché : un réglage sans outil s'afficherait tout seul et personne ne
saurait de quoi il parle. Le réglage n'est pas *effacé* pour autant — remettre l'outil le
retrouve.

**Retirer un réglage du catalogue ne touche pas les exercices qui le portaient.** Leur
mention reste : on n'efface pas ce qui a été fait. Il ne propose simplement plus rien.

### « Où ça tire ? »

Les noms des muscles ne parlent pas à qui ne les a pas appris, et **une case qu'on ne sait
pas cocher reste vide** — exactement le défaut que les trois sources de proposition
essayaient déjà de contourner. Mais tout le monde sait dire **où ça tire**.

Treize **zones ressenties** : « le dessus de l'avant-bras — côté dos de la main, le wrist
curl inversé », « plier le coude — le curl, sous toutes ses formes », « la main qui
serre ». Chacune désigne les muscles qui y travaillent. Ce n'est pas une opinion : c'est de
l'anatomie de description, la même que celle des planches.

L'explication **situe sans jargon et sans condescendance**, et nomme l'exercice courant
quand il y en a un. La première version disait « la face poilue » : c'était parler à
quelqu'un comme à un enfant, ça a été relevé comme tel, et le banc tient maintenant le
choix. Ne pas connaître le vocabulaire d'une discipline n'est pas ne rien comprendre.

Quatre décisions tenues par des contrôles :

- **Ce sont des cases à cocher.** Une zone cochée reste allumée, et la décocher retire ses
  muscles. Elles ont longtemps été des boutons qui *ajoutaient* : un second appui ne
  retirait rien, et rien ne restait allumé. MB l'a signalé en croyant qu'on ne pouvait pas
  en cocher plusieurs — on pouvait, mais l'écran ne le montrait pas. Une interface qui ne
  dit pas ce qu'elle a retenu ment sur ce qu'elle sait faire.
- **Le décochage est une UNION, pas un premier arrivé premier servi.** Un muscle ne part
  que si **aucune** zone cochée ne le réclame encore. C'est nécessaire : **quatorze des
  trente-cinq** muscles appartiennent à plusieurs zones, et l'extenseur du petit doigt à
  trois. La provenance des mouvements a servi de point de départ, mais elle attribue le
  muscle à qui l'a posé *en premier* — décocher « le dessus de l'avant-bras » emportait
  alors l'extenseur ulnaire alors que « le bord du petit doigt » restait coché.
- **Une zone n'ADOPTE pas ce qu'elle n'a pas posé.** Un muscle coché à la main n'a aucune
  origine, et il survit à tous les décochages — *y compris quand la zone le contient*.
  C'est le piège de ce dessin : il ne se voit que si le muscle coché à la main appartient
  justement à la zone cochée ensuite, et le premier contrôle écrit ici ne le mesurait pas.
- **Tout muscle doit être atteignable par ce chemin.** Un muscle qu'aucune zone ne nomme
  resterait réservé à qui connaît déjà les termes — le banc le vérifie sur les 35.
- **Le bloc est replié par défaut.** Qui connaît les noms n'a rien à lire.

Le bloc s'appelle **« Par zone du corps »**, et chaque titre abandonné dit quelque chose :
« Je ne connais pas les noms » collait une étiquette à celui qui appuie ; « Où ça tire ? »
posait une question là où un en-tête doit nommer ; « Choisir par sensation » décrivait un
état d'esprit. Celui qui reste annonce la **méthode** — on va désigner un endroit du
corps, pas un nom latin — et c'est tout ce qu'un en-tête a besoin de faire.

### Les régions de muscles se replient

Trente-cinq muscles d'affilée font un mur : on ne voit plus ce qu'on a coché, et le reste de
la fiche part sous l'écran. Chaque région se replie donc, comme les catégories de
l'équipement — mêmes classes, même chevron.

Une région qui **porte déjà un muscle coché s'ouvre**, sinon il faudrait rouvrir six blocs
pour vérifier. Le **compte reste visible fermé** (`2 / 4`), pour n'avoir justement pas à
ouvrir. Le banc mesure que les 35 muscles tiennent alors en moins de 400 px.

### Un mouvement coche ses muscles

Cocher « Cupping » coche directement les muscles du cupping. C'est le geste, et il n'en
faut pas un second — le bouton de proposition reste pour le nom, la prise et le réglage.

**Le décocher les retire** — mais seulement **ce que ce mouvement-là avait posé**. La fiche
retient, par mouvement, les muscles qui n'y étaient **pas encore** au moment du clic
(`neufs`) : c'est exactement la provenance qu'il faut, et elle ne coûte rien à tenir.

Deux pièges, tenus par des contrôles :

- un muscle **coché à la main** qui figure aussi dans la liste du mouvement **survit** au
  décochage : il n'était pas dans `neufs` ;
- deux mouvements qui **partagent** un muscle (rising et supination portent le biceps) :
  décocher le second ne reprend pas ce que le premier avait posé.

La première version ne retirait rien, par prudence. C'était une prudence déplacée : elle
laissait une liste qu'on ne pouvait plus défaire autrement qu'à la main, muscle par
muscle.

Le message qui suit dit **la source**, qui n'est pas la même pour tous : cupping, pronation
et supination sont des actions articulaires ; rising, back et side pressure viennent d'une
seule étude EMG et restent **à vérifier**.

### L'ordre de la fiche

Ce qui décrit l'exercice d'abord ; **« Structures chargées » en dernier** des groupes
d'anatomie. Elles ne décrivent pas le travail mais ce qui **encaisse** — le vocabulaire de
la douleur — et servent au recoupement dans Suivi. C'est utile et c'est rare : ça ne doit
pas être le troisième écran qu'on traverse.

Elle est **le tout dernier groupe**, après « Repos ». L'aide sous ce groupe a été retirée
sur demande, puis **redemandée, courte** : ce qui était reproché était le bavardage, pas
l'explication. Deux contrôles tiennent le résultat — l'aide existe, et elle fait moins de
120 signes. Entre les deux, une version longue a été remise ici « pour expliquer » et c'est
le banc qui l'a arrêtée.

Il est au même endroit dans la fiche d'exercice et dans la fiche d'un réglage d'outil :
c'est le même problème aux deux endroits.

### La quatrième source de proposition

Un réglage peut porter des muscles, et c'est tout son intérêt : **c'est l'utilisateur qui
sait ce que SON matériel sollicite**, et le carnet le lui propose ensuite au lieu de le
lui redemander. `musclesProposes()` prend donc un quatrième argument, et la source
s'appelle `reglage` — le bouton le dit, comme pour les trois autres.

### Quand il n'y a rien à régler

Le groupe se montre dès qu'il y a **un outil**, même si aucun n'a de réglage, et dit
pourquoi la rangée est vide. La version d'avant se cachait en silence : impossible de
distinguer « cet outil n'en a pas » de « la fonction ne marche pas ». La question est
remontée d'un vrai téléphone et a coûté un aller-retour. Une ligne grise coûte moins.

**La panne silencieuse de ce dessin** : les réglages sont rangés par nom d'outil, donc
« Titan Grip Iron Wrist 60 mm » et « …60mm » sont deux outils, et une espace suffit à
déclarer un réglage sur l'un pendant que l'exercice porte l'autre. L'app **ne les fusionne
pas** — renommer du matériel dans le dos de qui l'a saisi serait pire — mais `outilProche()`
repère l'entrée voisine et le dit : « Pas de réglage — mais « X » en a. »

### Ce qui se voit

L'outil **se dit avec son réglage** partout où il s'affiche : séance, journal, programme.
`outilDit(exo, nom)` rend « Titan Grip · Mousqueton à l'extérieur ». Sans ça, deux séances
de « Pronation Titan Grip » seraient indiscernables au journal alors que ce n'était pas le
même travail.

La rangée de choix **n'apparaît que** si un outil retenu a des réglages déclarés. Une case
vide de plus serait une case de plus à ignorer — et le banc mesure la **hauteur réelle** du
groupe, pas l'attribut `hidden` : le filtre de l'équipement avait déjà été battu par un
`display: flex` qui l'emportait sur `[hidden]`.

## Le retour d'un testeur

Les bêta-testeurs rapportent depuis WhatsApp ou Discord : c'est comme ça que les gens le
font, et leur demander d'ouvrir un compte GitHub serait perdre le retour. **Copier** est
donc le chemin principal ; le ticket pré-rempli est l'autre.

Un rapport utile tient en deux morceaux : ce que la personne a vu, et le **décor** dans
lequel elle l'a vu. Le second, personne ne le donne de mémoire — ni sa version, ni la
largeur réelle de son écran, ni si l'app tourne installée ou dans un onglet.

```
contexte : version · écran et densité · navigateur · installée ou onglet
           séances · exercices · programmes · outils
           taille des données · stockage durable
```

**Aucune donnée d'entraînement n'y entre.** Que des comptes et des états : jamais un nom
d'exercice, d'outil ou de programme, jamais une charge, jamais une douleur. C'est une
promesse faite à l'écran, donc le banc la mesure — il fabrique un carnet avec des noms
reconnaissables et exige qu'aucun ne ressorte. Ce qui n'est pas connu se **dit** (« non
renseigné »), jamais une valeur par défaut : même principe que `null` partout ailleurs.

**Rien ne part tout seul, et le texte est visible en entier avant.** Le bloc technique
n'est ni replié ni caché derrière un « voir » : si on ne peut pas le lire, on ne peut pas
consentir à l'envoyer. Un contrôle mesure sa **hauteur réelle**, pas son attribut
`hidden` — déjà battu ici par un `display: flex`.

C'est **le seul endroit de l'app qui mène dehors**. Pas une requête : aucun `fetch`,
aucun XHR. Une navigation vers `github.com`, déclenchée par un appui, avec le texte lu
avant. L'écran le dit en une ligne.

Trois fonctions pures portent tout ça — `contexteTechnique(etat, env)`,
`texteRetour(saisie, contexte)` et `lienTicket(titre, corps)` — et ne lisent **rien** du
navigateur : l'écran relève le décor et le passe en argument. C'est ce qui permet de les
mesurer sur un état fabriqué et un décor fabriqué.

Deux gardes, chacune pour une panne silencieuse : `encodeURIComponent` sur le corps, parce
qu'un « & » ou un « # » tapé dans le retour tronquerait le ticket sans que personne le
voie ; et un plafond d'URL à **6 000 signes**, au-delà duquel on rend `null` plutôt que
d'ouvrir un onglet sur une erreur 414. Ce plafond est une borne **conservatrice**, pas une
mesure, et c'est écrit tel quel dans le code.

## L'ordre des Réglages, et le repli

Thème, En salle, **Exercices connus**, **Équipement**, Sauvegarde, État du stockage,
Envoyer un retour, Tout effacer.

Les deux catalogues sont remontés juste après « En salle » : on cherche « qu'est-ce que
j'ai déjà saisi » bien plus souvent qu'on n'exporte un carnet, et l'exercice se tape avant
l'outil qui le sert. Un ordre d'écran est une **décision**, pas un hasard du code — le
banc le tient, comme il tient celui de l'onglet Suivi.

**Le catalogue et chaque catégorie d'outils se replient**, avec les mêmes classes que les
catégories de l'équipement dans le sélecteur et les régions de muscles dans la fiche :
`equip-cat` pour l'en-tête, `equip-compte`, `equip-chevron`. Il y avait déjà deux endroits
où ça se replie ; en inventer un troisième aurait donné trois chevrons différents.

**Fermés au départ**, et le **compte reste lisible fermé** (`3`, `1`…). Sans lui, replier
serait cacher. Un catalogue de cinquante exercices pousse tout le reste sous l'écran, et
on ne cherche pas un exercice à chaque passage dans Réglages.

`hidden` seul ne suffit pas ici : un `display` l'emporte, et ça s'est déjà payé sur le
filtre de l'équipement. La règle `.reglages-repli[hidden]` est explicite dans la feuille,
et le banc mesure la **hauteur réelle du rectangle**, jamais l'attribut.

C'est ce repli qui a fait tomber un contrôle voisin : « Mon équipement, au doigt »
mesurait la hauteur des lignes d'outils, désormais repliées — « chacune fait au moins
44 px, attendu 0, obtenu 2 ». Il ouvre maintenant avant de mesurer.

## Zones de douleur, et leur intensité

```
Douleur
  zone      : 'coude_medial' | 'coude_lateral' | 'poignet' | 'avant_bras'
            | 'epaule' | 'aucune'
  intensite : 0–10 | null
  cote      : 'droit' | 'gauche' | 'deux' | null
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

## La règle des 24 h

Une douleur fait presque toujours mal **pendant** l'effort — ce n'est pas un signal. Ce
qui renseigne sur un tendon, c'est si elle est revenue à son niveau de base le
**lendemain**. C'est le repère qui revient dans toutes les sources de rééducation
tendineuse, et c'est un **avis d'expert, pas une règle validée par essai** : le carnet
montre donc l'écart, et ne conseille rien.

```
Releve
  id        : string
  date      : 'AAAA-MM-JJ'
  zone      : zone de douleur, jamais 'aucune'
  cote      : 'droit' | 'gauche' | 'deux' | null
  intensite : 0–10 | null
```

**Un relevé est indépendant d'une séance, et c'est tout l'objet :** le lendemain d'une
grosse séance est souvent un jour de repos, où rien ne serait enregistré. Il vit donc
dans sa propre liste.

`questions24h()` rend ce qu'il reste à demander : pour chaque *(zone, côté)* noté **hier
ou avant-hier** et pas encore repris aujourd'hui, la dernière valeur connue. Deux jours,
pas un — une séance du soir se juge le surlendemain matin aussi bien que le lendemain.
Rien n'est demandé pour une douleur notée **le jour même** : la question porte sur le
lendemain, pas sur l'instant.

Un seul relevé par *(jour, zone, côté)* : répondre deux fois **corrige**, ça n'empile
pas. Et répondre pour un côté ne répond pas pour l'autre.

`suiviZone()` mélange séances et relevés — c'est la même douleur, peu importe par quel
chemin elle a été saisie — et accepte un filtre par côté : deux bras font deux pentes.

`ecart24h()` nomme la direction : **baisse**, **stable**, **hausse**, ou **inconnu**
quand il manque une des deux valeurs. On ne l'invente pas, et on ne la commente pas.

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

## Ce que la ligne de série fait saisir

Un champ répondait à deux questions. `typeCharge: 'duree'` ne disait pas comment lire
une charge : il **détournait la colonne REPS en secondes**. Conséquence, un exercice
isométrique traînait une colonne charge dont il n'avait que faire, un exercice en kilos
ne pouvait pas porter de durée, et les secondes dormaient dans un champ nommé `repsReel`,
que tout le reste du code lisait comme des répétitions.

Les deux questions sont maintenant séparées :

| champ | répond à |
|---|---|
| `typeCharge` | **comment se lit la charge** — kilos, niveau de gripper, bande, lest |
| `colonnes` | **ce qu'on saisit** — charge, reps, durée, toute combinaison |

Le défaut reste `['charge', 'reps']`. Un isométrique n'a que `['duree']`. **Trois au
plus** : à 320 px, une quatrième colonne souple mettait les champs à 37 px — mesuré, et
refusé. À trois colonnes, la ligne passe d'ailleurs sur deux rangs, PRÉCÉDENT au-dessus.

L'ordre d'affichage est toujours celui du tableau `COLONNES`, quel que soit l'ordre de
sélection : une colonne ne doit pas changer de place d'un exercice à l'autre.

**Le tonnage est charge × reps : sans les deux colonnes, il n'y a rien à multiplier.**
C'est ce qui fait qu'un isométrique ne pèse rien tout seul, sans qu'on ait eu à l'écrire
nulle part — et c'est aussi pourquoi la migration ci-dessous ne déplace aucun chiffre.

### Le temps sous tension

`dureeReel` est le temps sous tension de **la série entière**, pas d'une répétition. Une
règle unique, qui s'explique en une phrase ; si un jour il faut la tenue *par rep*, ce
sera un champ qui porte ce nom-là, pas une seconde lecture du même.

`volumeSeance()` en sort `tempsSousTension` et `tempsSousTensionAw`, comptés comme le
tonnage. Ils ne s'additionnent jamais à des kilos et ne partagent pas les mêmes barres
dans Suivi : des secondes et des kilos empilés fabriqueraient une courbe qui ne veut
rien dire. Un total vide rend `''`, jamais « 0 s » — on n'a pas tenu zéro seconde, on
n'a rien chronométré.

### La migration, à la lecture

Comme pour les douleurs : convertie à la lecture, jamais réécrite dans le dos.

| avant | après |
|---|---|
| `typeCharge: 'duree'` | `typeCharge: 'kg'` + `colonnes: ['charge', 'duree']` |
| les secondes dans `repsReel` / `repsCible` | dans `dureeReel` / `dureeCible` |
| une série `type: 'echauffement'` | `type: 'normale'` |
| un exercice sans `colonnes` | `['charge', 'reps']` |

**Aucun chiffre du passé ne bouge.** Le type `'duree'` portait déjà `tonnage: false`, et
sans colonne reps il n'y a toujours rien à multiplier : le tonnage reste le même. Un
échauffement comptait déjà comme une série de travail. Seules les secondes se mettent à
compter — là où elles dormaient.

Le type **« échauffement » a été retiré** : il n'était pas employé, et il gonflait le
volume de travail sans qu'on puisse l'en sortir. Trois types restent : normale,
dégressive, à l'échec.

## Charge non numérique

`chargeReel` et `repsReel` sont des **chaînes libres**. `N3`, `élastique rouge`, `+ceinture`
sont des valeurs valides. Le calcul de volume appelle `nombre(txt)` qui rend `null` dès que
la chaîne n'est pas un nombre (`"17,5"` → `17.5`, `"N3"` → `null`). Une série non chiffrée
n'est pas comptée dans le tonnage **et elle est comptée à part** : l'écran affiche
« 2 140 kg · 3 séries non chiffrées ». Jamais un zéro silencieux.

## Le volume compte ce qui a été FAIT

`volumeSeance()` ne lit que les **colonnes affichées** — `chargeReel`, `repsReel`,
`dureeReel` —, et ne compte une série que si elle porte le ✓ ou une valeur saisie. Une
valeur restée dans un champ qu'on a ensuite masqué ne compte plus : rien ne doit compter
en coulisse. Une séance ouverte depuis un programme et pas encore
commencée affiche donc **0 kg**, pas le tonnage prévu par le programme.

Ce qui sort du tonnage sort pour une raison, et l'écran la dit :

| cas | compté comme |
|---|---|
| `N3`, une bande, le poids du corps | `seriesNonChiffrees` — « à charge non chiffrée » |
| type en kilos mais charge ou reps manquante | `seriesIncompletes` — « il manque la charge ou les reps » |
| une durée saisie | `tempsSousTension` — comptée en secondes, pas en kilos |
| ni charge ni reps à l'écran, et rien de saisi | `seriesSansTonnage` — « rien à multiplier » |

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
