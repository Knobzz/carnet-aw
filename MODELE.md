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

**Vingt-deux muscles** : tout ce qu'une planche du membre supérieur nomme, plus les
profonds qu'elle ne montre pas — coraco-brachial, brachial, carré pronateur, supinateur.
La liste s'arrête à l'épaule : le dos et la poitrine n'y sont que par ce qui tire sur le
bras (grand dorsal, grand pectoral).

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

### Les trois sources de proposition

On ne peut pas demander de cocher vingt-deux muscles à qui ne connaît pas les termes : la
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

**Rien n'est écrit sans un geste.** La proposition remplit les cases quand on appuie ;
ce qui est stocké reste une décision, pas une déduction. Et la quatrième source est
gratuite : le catalogue retient les muscles **avec le nom de l'exercice**, donc on ne les
coche qu'une fois.

### Le schéma

Un membre supérieur en **vue antérieure**, épaule en haut, main en bas — la vue des
planches d'anatomie, et celle qui laisse la place de montrer **un muscle par région**
plutôt que six zones.

Il est dessiné en **SVG inline**, pas importé. Une planche trouvée sur le web poserait
trois problèmes : une licence invérifiable sur une app publiée, un poids qui dépasse
celui de l'app entière, et l'impossibilité de **teinter un muscle** — une image
matricielle ne change pas de couleur. Le SVG, lui, pèse quelques kilo-octets, reste net
à toute taille et se teinte muscle par muscle.

**Les tracés sont construits, pas écrits à la main.** Trois tentatives de dessin libre ont
donné trois amas de formes détachées. On décrit donc le **contour** du membre — sa largeur
à chaque hauteur — et chaque muscle occupe une bande de ce contour, en fractions de
largeur. Les régions se touchent par construction, et restent justes quand on déplace un
point du contour.

**Chaque muscle a un ventre, pas un rectangle.** Une bande peut se resserrer vers son axe
à l'une ou l'autre extrémité (`pointeHaut`, `pointeBas`) et glisser en biais le long du
membre (une fraction `[début, fin]`). Sans ça le dessin lit « pile de briques » : c'est
ce qu'il faisait, et c'est ce que le fuseau corrige. Le rond pronateur traverse en
diagonale parce qu'en vrai il traverse en diagonale.

**Tous les muscles n'ont pas de territoire lisible à 190 px de large.** L'anconé, le long
palmaire ou l'extenseur du petit doigt y tiendraient sur trois pixels. Ceux-là vivent
**dans les barres**, et la légende sous le dessin les nomme — mais seulement quand ils ont
des séries, sinon on listerait pour lister. La liste `SANS_TRACE_ATTENDUS` est exposée au
banc, qui vérifie le **recouvrement exact** : tout muscle est soit une région du schéma,
soit déclaré hors dessin. Un muscle oublié des deux serait invisible ; une région sans
muscle serait un mensonge.

La **main** est le seul décor : elle sert à reconnaître le membre et ne répond pas au
doigt. Le deltoïde, lui, est devenu un muscle suivi comme les autres.

### Les planches de Gray

Le schéma répond à *combien*. Il ne répondra jamais à *à quoi ça ressemble, et où est-ce
exactement* — c'est un schéma de bandes, et c'est écrit à l'écran. Neuf gravures de
**Henry Gray, Anatomy of the Human Body, 1918** répondent à ça, et à rien d'autre.

**1918, domaine public** : c'est la seule raison de ces planches-là. Une planche trouvée au
hasard sur le web aurait une licence invérifiable sur une app publiée.

Chaque muscle porte **son nom latin et sa planche**. Le latin n'est pas de la décoration :
c'est le seul mot **écrit sur la gravure**. Chercher « fléchisseur ulnaire » sur une
planche de 1918 ne donne rien ; chercher *Flexor carpi ulnaris* le trouve.

Elles ne sont **pas pré-chargées**. Le service worker met en cache tout ce qui passe, donc
une planche consultée une fois reste disponible hors ligne — mais tant qu'on ne l'ouvre
pas, elle ne coûte rien à l'installation. 680 ko précachés pour des images qu'on regarde
trois fois seraient payés par tout le monde, tout le temps.

Le libellé de chaque barre est un **bouton** : c'est le seul chemin vers les sept muscles
qui n'ont pas de tracé sur le schéma, qui seraient sinon des noms sans visage.

Le banc **va chercher les huit fichiers** : une planche nommée mais absente donnerait une
image cassée que personne ne verrait avant le téléphone. Et l'iframe du banc d'interface
porte `<base href="../">`, pour que `icones/Gray414.png` s'y résolve **exactement comme
dans `index.html`** — sans ça, une planche trouvée au banc pourrait être introuvable en
production.

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

### La quatrième source de proposition

Un réglage peut porter des muscles, et c'est tout son intérêt : **c'est l'utilisateur qui
sait ce que SON matériel sollicite**, et le carnet le lui propose ensuite au lieu de le
lui redemander. `musclesProposes()` prend donc un quatrième argument, et la source
s'appelle `reglage` — le bouton le dit, comme pour les trois autres.

### Ce qui se voit

L'outil **se dit avec son réglage** partout où il s'affiche : séance, journal, programme.
`outilDit(exo, nom)` rend « Titan Grip · Mousqueton à l'extérieur ». Sans ça, deux séances
de « Pronation Titan Grip » seraient indiscernables au journal alors que ce n'était pas le
même travail.

La rangée de choix **n'apparaît que** si un outil retenu a des réglages déclarés. Une case
vide de plus serait une case de plus à ignorer — et le banc mesure la **hauteur réelle** du
groupe, pas l'attribut `hidden` : le filtre de l'équipement avait déjà été battu par un
`display: flex` qui l'emportait sur `[hidden]`.

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
