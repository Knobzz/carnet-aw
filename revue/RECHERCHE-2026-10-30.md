# Recherche du 2026-10-30 — le vocabulaire du dictionnaire, vérifié

**Ce que MB a demandé**, le soir du 30/10 :

> « Tu me fais une recherche consciencieuse et méthodique des exercices que nous avons, et
> de leurs variantes sur internet, via sources sûres, il faut qu'on soit professionnel
> là-dessus. Après, beaucoup d'informations c'est bien, mais le but n'est pas d'en mettre
> toujours plus d'accord ? Donc vérifie parmi les mouvements qu'on a déjà, s'il n'y en a
> pas trop ? […] **Tout devra être vérifié par mes soins.** »

Et, dans le même message, le distingo à faire :

> « Certains ont d'autres écritures pour dire exactement la même chose (par exemple :
> Curl rising à la poulie >> Rising cable curl | Curl Larratt >> Tenue de coude, Tenue
> isométrique de coude etc etc), il faudra donc faire le distingo entre variantes, et même
> nom. Ça fera peut-être un écrémage de certains noms connus. »

**Rien n'est appliqué.** Ce document rapporte ; la planche `revue/ecremage.html` sert à
trancher.

---

## 1. Comment la recherche a été menée

**Quatre agents, un par bloc de muscles** — et le compte a été fait **avant** d'appuyer,
pas après :

| bloc | fiches | écritures examinées |
|---|---|---|
| avant-bras | 19 | 48 |
| épaules | 13 | 37 |
| dos | 15 | 33 |
| pectoraux + triceps + biceps | 18 | 46 |

Les trois petits groupes ont été **fusionnés** pour tenir en quatre agents plutôt que six.
Consigne donnée aux quatre, mot pour mot : classer en **A** (même mouvement), **B**
(variante), **C** (autre exercice), **ne proposer aucun ajout**, citer la source, et dire
« je ne sais pas » plutôt que d'inventer.

### La limite que les quatre ont signalée d'elles-mêmes

**ExRx.net refuse la lecture automatisée (HTTP 403).** Sa taxonomie n'a donc **pas** pu
être confirmée, contrairement à ce que la consigne demandait. Les sources réellement
lues, par ordre de fiabilité :

- un **essai contrôlé** de 10 semaines, preacher curl contre bayesian curl (PMC11906226) ;
- des **études EMG** : Dickie et al. 2017 (*J. Electromyogr. Kinesiol.* 27:30-36),
  Ohrnberger et al. 2019 (Eastern Kentucky University), Marcolin 2015, PubMed 26488636 ;
- des **revues** sur l'amplitude : Kassiano 2023, Brookbush 2025 ;
- Wikipédia, StrengthLog, Catalyst Athletics, ArmProgress ;
- puis des catalogues d'exercices.

Un agent note que les pages d'un site consulté **se déclarent elles-mêmes générées par IA
et se contredisent** : elles n'ont servi qu'à décrire un geste, jamais à trancher une
question de biomécanique.

---

## 2. Ce qui a été trouvé — 79 cas

| | |
|---|---|
| **autre exercice**, à sortir de sa fiche | **8** |
| **variante** mal rangée en « autre écriture » | **21** |
| **ne porte rien**, part sans perte | **34** |
| **aucune source ne tranche** | **16** |

### Les huit qui ne sont pas le même mouvement

| écriture | rangée sous | pourquoi |
|---|---|---|
| **Curl 21** | Curl biceps | **ce n'est pas un exercice** : une méthode de série (7+7+7), applicable à n'importe quel curl et même à d'autres groupes |
| **Hex press** | Développé serré | adduction isométrique en plus du développé — et c'est un exercice de **pectoraux**, rangé dans les triceps |
| **Svend press** | Écarté | c'est un **développé** : les coudes s'étendent, l'écarté garde l'angle fixe |
| **Farmer walk** | Dead hang | port de charge **en marchant** |
| **Marche du fermier** | Dead hang | traduction du précédent |
| **Renegade row** | Rowing | planche sur deux haltères, unilatéral alterné ; le rowing est un hinge debout |
| **Pompes piquées** | Handstand push-up | corps **non inversé** : c'est la progression *vers* le HSPU |
| **Pike push-up** | Handstand push-up | terme anglais du précédent |

**Prix à connaître sur Farmer walk** : aucune fiche « Farmer walk » n'existe au
dictionnaire. Le retirer rend le nom **introuvable**, alors que les listes de mots-clés
musculaires le reconnaissent toujours. Il faut donc le retirer **aux deux endroits**, ou
lui faire sa fiche.

### La règle opérationnelle à ne pas oublier

> **Toute écriture retirée doit l'être AUX DEUX ENDROITS** : dans `aussi`, et dans les
> listes de mots-clés musculaires de `js/model.js`. Les oublier les ferait diverger.

---

## 3. Les huit tractions — et pourquoi je ne recommande rien

La recherche sur le dos conclut : **une fiche, deux au maximum**, et propose d'en retirer
six sur huit. Son argumentaire :

1. **L'amplitude est une variable d'entraînement, pas un exercice.** Kassiano 2023, la
   méta de Wolf, la revue Brookbush d'octobre 2025 (« *Acute Variables: Exercise Range of
   Motion* ») la traitent au même rang que la charge ou le tempo.
2. **L'écartement des mains n'est jamais nommé comme un exercice.** L'étude EMG de l'EKU
   s'intitule littéralement « *EMG for Pull-Up Grip **Modifications*** » et compare large /
   serrée / neutre comme trois **réglages**, sans différence statistiquement significative.
3. **L'orientation des paumes** est la seule dimension que la langue distingue (pull-up /
   chin-up) — et même là, Dickie 2017 trouve des activations globalement semblables.

### ⚠️ La réserve, et elle est décisive

**Les quatre fiches « partielle », c'est MB qui les a demandées**, le 29/10 :

> « Vérifie sur internet ce que les partial pull ups font sur les muscles, moi j'ai
> l'impression quand j'en fais, que l'accent sur les muscles de l'avant bras sont plus
> forts, le fait de devoir rester également à moitié engagé rajoute une isométrie. »

**Aucune des sources citées ne porte sur le bras de fer** : elles parlent d'hypertrophie
en population générale. L'agent le reconnaît lui-même — « *si les quatre fiches existent
pour une raison de programmation, ce n'est pas du vocabulaire et aucune source ne tranche* ».

**Rien ne doit être retiré ici sans que MB le dise.**

### Un défaut de structure, lui, incontestable

Les huit fiches spécifient **chacune un seul des deux axes** : « Chin up » dit
l'orientation mais pas la largeur, « Traction prise serrée » dit la largeur mais pas
l'orientation. Une traction serrée *pronée* et une serrée *supinée* tombent donc sous le
même nom.

Et les **trois écritures** de « Traction prise serrée » disent toutes « **neutre** » —
or neutre (orientation des paumes) et serrée (écartement) sont deux axes différents. Soit
le nom est juste et les trois partent, soit la fiche porte en réalité la prise neutre et
c'est le **nom** qui est faux.

---

## 4. Ce qu'aucune source ne tranche — 16 cas pour MB

Les plus importants :

- **« Chop »** (Déviation ulnaire) — **aucune** source externe ne le définit. Ni Wikipédia,
  ni ArmProgress (66 exercices, aucune entrée « chop » ni « ulnar »), ni les sites de
  rééducation. Classé « même geste » **uniquement parce que c'est le mot de MB**.
- **« Cupping »** est-il sous la bonne fiche ? Wikipédia donne raison au rangement actuel
  (cupping = la flexion). Mais ArmProgress le sépare de « Wrist curls », et au bras de fer
  cupping nomme d'ordinaire une **pression tenue**. *Conséquence mesurable* : taper
  « cupping » tombe sur une fiche en **reps**, pas sur `Cup hold` qui est en **charge +
  durée** — exactement le doublon déjà payé avec « Tenue en cup ».
- **« Supination à la clé »** — **conflit interne** : le catalogue d'équipement envoie la
  clé de poignet sur *Wrist curl* / *Wrist curl inversé*, cette écriture l'envoie sur
  *Supination*.
- **« Curl rising à la poulie »** — **aucune source trouvée**, ni en français ni en
  anglais. Nom de salle ?
- **« Back pressure à la poulie »** — Wikipédia en fait une **technique** (l'une des trois
  pressions du bras de fer), pas un exercice.
- **« Side pressure »** — même chose : nomme une **direction de pression** pendant le duel.
- **« Croix de fer »** — aucune source d'armwrestling ne l'emploie, et le nom couvre deux
  choses (anneaux de gymnastique / haltères bras tendus).
- **Le paramètre des dips est mal nommé** : ce qui discrimine est l'**inclinaison du
  buste**, pas la prise. « Dips buste penché » et « Dips buste droit » nomment le bon
  paramètre ; « prise large » et « prise serrée » le mauvais.
- **« Extension triceps » recouvre « Extension verticale des triceps »** : les deux fiches
  se chevauchent.
- **« Curl Larratt » a six écritures** qui disent la même chose. Toutes justes ; en garder
  six est un choix de **confort de frappe**.
- **Pull-over rangé sous DOS** : l'EMG est partagée, plusieurs travaux donnent le
  **pectoral** dominant ou à égalité. Discutable, pas faux.

---

## 5. Les mesures locales — ce qui se mesure sans internet

| | |
|---|---|
| doublons purs (mêmes mots, autre ordre ou pluriel, **même fiche**) | **21** |
| une écriture rangée sous **deux** fiches | **0** |
| fiches commençant par « Curl » | **7** |
| fiches de traction | **8** |

**Les 21 doublons ne portent rien, et c'est joué, pas supposé** : sur **12 écritures non
doublées**, l'ordre inverse et le pluriel ont été tapés (« curl drag », « drag curls »,
« crusher skull », « pulldown lat »…) → **12/12 trouvées dans les trois premiers**. La
recherche gère déjà l'ordre et le pluriel.

*Au passage : la première version de cette mesure était fausse — `suggestionsDictionnaire`
était appelée avec les arguments dans le désordre, et tout sortait « absent ». C'est le
témoin qui l'a montré.*

**Nuance apportée par la recherche avant-bras** : une écriture n'est gratuite à supprimer
que si **une autre écriture de la même fiche contient tous ses mots** — `placeParMots`
exige tous les mots dans **une seule** écriture. Six suppressions ont été vérifiées à ce
compte (Serrage, Pronation curl à la poulie, Tenue de coude, Barre fixe en tenue, Wrist
curl accentué pouce, une des deux « Ouverture… »).

---

## 6. Ce qui NE doit pas être repris

La recherche avant-bras a refusé de lister en trop les écritures d'engin (`Poignée de
pronation`, `Poignée à ressort`, `Pinch block`, `Élastique autour des doigts`,
`Supination à la clé`) : **c'est une décision de MB du 29/10, déjà prise et écrite dans le
code.** La contredire ici serait la reprendre à sa place.

De même, `Wrist curl côté auriculaire` reste : c'est le seul endroit de la fiche qui porte
le mot « auriculaire », qu'un utilisateur tape vraiment.

---

## 7. Où ça continue

- **`revue/ecremage.html`** — les 79 cas, un par un, avec la source et le prix. MB tranche
  et copie ses décisions.
- **`revue/simulation-variantes-sous-le-nom.html`** — l'écran qu'il a décrit : le nom
  principal dans le champ, les variantes dessous.
- **`revue/variantes.js`** — la dérivation partagée (engin + position).
