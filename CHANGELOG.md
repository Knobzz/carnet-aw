# Ce qui change, version par version

Écrit **pour qui utilise le carnet**, pas pour qui l'écrit. Chaque version dit
ce qu'elle **ajoute**, ce qu'elle **enlève** et ce qu'elle **corrige** — en
mots d'utilisateur, sans nom de fichier ni de fonction.

> **Comment lire sa propre version.** Réglages, tout en bas. Si l'écran ne
> montre pas ce qui est écrit ici, c'est le navigateur qui sert l'ancienne
> version : ferme l'onglet, rouvre-le depuis l'écran d'accueil.

**Rien n'est jamais perdu en montant de version.** Une séance saisie dans une
version ancienne se relit dans toutes les suivantes. Quand une version retire
quelque chose de l'écran, ce qui a déjà été saisi le garde — c'est le choix
qui disparaît, pas la donnée.

---

## 1.78.0

**Tu peux compléter le dictionnaire toi-même.** Trois choses qui manquaient.

- **Ajouter une façon d’écrire un mouvement**, même livré : sous les gestes
  d’un exercice, *« + une façon de l’écrire »*. Avant, le bouton se cachait
  dès que la fiche venait du carnet, et il n’y avait aucun chemin.
- **Un geste que tu ajoutes le dit** : « Ajouté par toi. Pas d’explication
  écrite », plutôt qu’un blanc qui passerait pour un oubli du carnet. Les
  explications livrées citent toutes une source ; la tienne n’en a pas, et
  c’est dit.
- **Tes fiches apparaissent enfin quand tu feuillettes.** Elles sortaient de
  la recherche mais d’aucune liste parcourue. Un groupe **« Les miennes »**
  paraît en dernier, et seulement si tu en as.

**Le dictionnaire du carnet n’est jamais modifié.** Ce que tu ajoutes vit à
côté : une version qui remplace le dictionnaire ne peut pas effacer ton
travail. Et si une version finit par livrer ce que tu avais ajouté, le
carnet te le **dit** au lieu de le retirer tout seul.

**Tes ajouts se voient et se retirent** dans Réglages ▸ Mon dictionnaire.

**Ce que ça enlève** : rien.

---

## 1.77.0

**Corrige l’ordre de tes outils entre minuit et 1 h du matin.** Un outil
repris à cette heure-là ne remontait pas en tête de tes suggestions : une
date était lue en heure locale, l’autre en heure universelle, et la plus
ancienne passait devant.

**Rien ne change à l’écran** : aucune date affichée ne bouge. C’est la
comparaison qui a été corrigée, pas les dates — l’autre façon de faire
aurait fait sauter d’un jour les dates du soir.

**Ce que ça enlève** : rien.

---

## 1.76.0

**La sauvegarde passe en PREMIER dans les Réglages.** C’est la première
chose que tu vois en ouvrant l’écran, avant le thème et le catalogue.

**Et les textes sont raccourcis** : 1 493 → 1 056 caractères, **29 % de
moins**, sans qu’aucune information disparaisse — les chiffres, les dates,
le choix à l’import et les avertissements sont tous restés. Ce qui part est
la répétition entre les trois sections.

**La sauvegarde automatique prévient quand elle décroche.** Si le navigateur
redemande l’accès au fichier (ce qu’il fait à chaque rafraîchissement sur
certains téléphones), un bandeau le dit et un bouton le redonne. Sans ça, le
fichier cessait d’être tenu à jour **en silence**, et tu te croyais protégé.

**Ce que ça enlève** : rien.

---

## 1.75.1

**Corrige une contradiction à l’écran.** Avec un fichier tenu à jour, les
Réglages affichaient quand même « Jamais exporté. 6 séance(s) ne tiennent
que sur cet appareil » — juste au-dessus du fichier en question. Le rappel
lit maintenant l’état du fichier, et dit « Un fichier est tenu à jour ».

L’alerte **revient** si ce fichier n’a jamais été écrit ou s’il est en
panne : un fichier choisi puis devenu inaccessible ne protège rien.

---

## 1.75.0

**Une sauvegarde automatique dans un fichier.** Le carnet peut tenir à jour
un fichier sur ton téléphone, réécrit tout seul à chaque enregistrement.
**Un geste pour le choisir, et plus rien ensuite.**

Réglages ▸ Sauvegarde automatique ▸ *Choisir le fichier à tenir à jour*.

**Tu as maintenant trois protections, et elles ne couvrent pas la même
chose** — c’est voulu, aucune ne remplace les autres :

| | ce qu’elle sauve |
|---|---|
| le **double de secours** | un écrasement, une fausse manœuvre |
| le **fichier automatique** | l’effacement des données du site, le changement d’appareil |
| l’**export manuel** | tout le reste, et il marche partout |

- **Elle ne peut pas te nuire** : elle s’écrit après le carnet, et si le
  fichier a disparu ou que l’accès a sauté, **ta saisie passe quand même**.
  L’écran le dit, et un bouton redonne l’accès.
- **Elle n’apparaît que si ton navigateur sait le faire.** Un réglage qui ne
  peut pas marcher se cherche, s’essaie, et on croit que c’est soi.
- **Le fichier est réécrit, pas dupliqué** : tu n’auras jamais
  `carnet-aw (1).json`, `(2)`, `(3)`…

**Ce que ça enlève** : rien.

---

## 1.74.0

**Le bouton d’export sait maintenant quand tu as exporté pour la dernière
fois.** Juste au-dessus de lui, une ligne dit l’un ou l’autre :

- « **Jamais exporté.** 12 séance(s) ne tiennent que sur cet appareil. »
- « **Dernier export : il y a 6 jours.** 3 séance(s) saisie(s) depuis. »

**Aucun seuil, et c’est voulu.** Le carnet ne te dira jamais « ça fait trop
longtemps » : il faudrait un nombre de jours que personne n’a mesuré. Il
affiche deux faits, tu décides. C’est la même règle que les remarques du
Suivi.

**Ce que ça enlève** : rien.

---

## 1.73.0

**La cause de la perte du 1ᵉʳ novembre est trouvée, et elle est fermée.**

Le carnet pouvait être ouvert **deux fois en même temps** — l’app installée
sur l’écran d’accueil et un onglet du navigateur, par exemple. Chacune
gardait le carnet en mémoire de son côté, et **chacune réécrivait tout dès
qu’elle passait en arrière-plan**, sans jamais relire ce que l’autre avait
enregistré entre-temps.

Donc : une app restée ouverte **avant** tes saisies, réveillée des jours plus
tard, écrasait le carnet avec sa vieille mémoire. Tes **équipements**
survivaient — elle les avait déjà — mais tes **séances disparaissaient**.

- **Reproduit** : 2 équipements et 6 séances en base, une instance périmée
  passe en arrière-plan, il reste 2 équipements et **0 séance**.
- **Ce qui la ferme** : chaque enregistrement porte désormais une marque.
  Avant d’écrire, l’app relit celle du carnet : si elle a changé, une autre
  instance est passée, et l’app **fusionne** au lieu d’écraser.
- **Rien ne se supprime tout seul** : après fusion, les séances des deux
  côtés sont là. Le prix, dit franchement : une séance que tu supprimes dans
  une instance peut **revenir** si une autre, périmée, la porte encore. Mieux
  vaut une séance à resupprimer qu’une séance perdue.
- **Les routines de récupération** entrent enfin dans la fusion : elles n’y
  étaient pas, et une routine créée dans une instance pouvait disparaître.

**Une épreuve rejouable** vérifie tout ça dans de vraies instances :
le cas exact du 1ᵉʳ novembre, la fermeture d’onglet, deux instances qui
saisissent chacune du neuf, trois instances en cascade, les routines de
récupération, un minuteur de repos, et un carnet vierge.

**Ce que ça enlève** : rien.

---

## 1.72.3

**Une sauvegarde de secours, et c’est le plus important de cette version.**

Le carnet garde désormais **un double de lui-même**, sur ton appareil, sous
un nom séparé. Il se pose dès que tu ouvres l’app, pas seulement quand tu
saisis quelque chose.

- **Un carnet vide ne peut pas l’écraser.** C’est sa seule règle, et c’est
  un fait, pas un réglage : si ce qui veut s’enregistrer ne contient rien et
  que le double contient quelque chose, le double reste.
- **Il se restaure depuis Réglages ▸ Sauvegarde de secours**, qui affiche de
  quand il date et ce qu’il contient, en face de ton carnet actuel — pour
  que tu choisisses sur deux chiffres, pas à l’aveugle.
- **Il ne peut pas te nuire** : il s’écrit après ton carnet, son échec est
  sans conséquence, et si la place manque **il est sacrifié** pour que ta
  saisie passe.
- Il ne remplace pas un export : il dépanne le jour où tu n’y as pas pensé.

**« Tout effacer » dit maintenant la vérité.** Depuis le double, ce bouton
n’effaçait plus tout — et ne le disait pas. L’écran l’annonce, et un second
bouton efface aussi le double, pour ne rien laisser si tu prêtes ou revends
le téléphone.

**Corrige l’onglet des gestes hors ligne.** Un fichier manquait à la liste
des fichiers gardés pour le mode hors connexion : en salle, sans réseau,
les façons d’exécuter un mouvement ne s’affichaient pas. C’est la
troisième fois qu’une liste tenue à la main oublie un fichier ; un contrôle
la compare désormais à la page au lieu de la relire.

**Ce que ça enlève** : rien.

---

## 1.71.0

**Ajoute « Ta lacune » dans Suivi**, en face de « Ton accent ».

Le carnet nomme ce qu’aucune de tes séries ne nourrit : un **style**
(« zéro série en toproll, quand le hook en porte neuf ») ou, si les deux
styles sont servis, un **mouvement** — rising, back pressure, side
pressure, supination, cupping, pronation. Et il propose les exercices de
ton dictionnaire qui le combleraient.

- **Le déclencheur est un zéro**, jamais un « moins » : « le style le moins
  travaillé » aurait demandé un seuil que personne ne donne. Une seule
  série dans un style l’éteint pour ce style.
- **Elle dit d’où elle vient et ce qui la contredit.** Aucune source ne
  recommande d’équilibrer les styles, et Larratt soutient l’inverse : c’est
  écrit dans la remarque, comme pour « tu ne déclares que du hook ».
- **Le press n’y apparaît jamais**, et ce n’est pas un oubli : la source le
  place hors de l’axe des six mouvements (toproll et hook décident du
  contrôle, press et side pressure de la finition). Son zéro ne dirait rien
  de tes séances.
- **Une seule lacune à la fois**, la plus large d’abord — avec le nombre des
  autres mouvements à zéro, pour ne rien taire sans en faire une liste.

**Ce que ça enlève** : rien. Aucun chiffre, aucun bloc ne disparaît de Suivi.

**Corrige une perte de données, et c’est le plus important de cette version**

Une page de test du projet — `banc/index.html`, publiée avec le reste du site
— **effaçait le carnet du navigateur qui l’ouvrait**. Pas un morceau : tout.
Elle affichait « 1597 contrôles réussis » pendant qu’elle le faisait.

- **Mesuré** : un carnet de 12 séances, 14 exercices et 11 outils tombait à
  zéro en ouvrant cette page une fois.
- **La cause** : cette page de test écrit dans le stockage, et elle le faisait
  sous le nom du carnet réel au lieu du sien.
- **Depuis quand** : le 22 octobre, donc **avant la 1.66.0 aussi**.
- **Ce qui la ferme** : la page de test a maintenant son propre stockage, et
  le banc vérifie à chaque lancement qu’il n’écrit pas sous celui du carnet
  — trois contrôles, qui tombent si la protection saute.

**Ce qui n’est PAS en cause**, et qui a été vérifié : la montée de version
elle-même ne perd rien (toutes les données écrites par la 1.66.0 sont relues
par celle-ci), et la mise à jour de l’application ne touche pas au carnet.

**Si tu as perdu des données** : regarde d’abord dans Réglages ▸ Sauvegarde si
un export existe. Rien dans le carnet lui-même ne permet de revenir en
arrière — c’est une limite connue, pas un oubli.

---

## 1.70.0

Le gros chantier du **dictionnaire d’exercices**, appliqué. Les 95
explications ont été relues une à une : **83 validées, 12 réécrites**.

**Ce que ça ajoute**

- **Les gestes sous le nom.** En choisissant *Curl biceps*, le carnet propose
  les façons de l'exécuter — spider curl, drag curl, bayesian curl, waiter
  curl — avec, pour chacune, **comment le faire et ce que ça change**.
- **Une explication pour chaque mouvement**, avec sa source. 95 en tout.
- **Un champ Matériel**, repliable par famille : barres, poids libres,
  machines et élastiques, appuis, position du corps. Cumulable, et le banc y
  porte son degré.
- **Les tractions sont regroupées** : huit fiches deviennent deux, *Traction*
  et *Traction partielle*, chacune avec ses façons de faire.
- **De nouveaux mouvements** : rowing inversé, élévation latérale bras
  fléchi, wrist curl derrière le dos, push press, Z press, développé au sol,
  Pendlay row, Yates row, tractions commando / archer / L-sit, Svend press.

**Ce que ça enlève**

- *Pince*, *Développé incliné*, *Gripper*, *Croix de fer*, *Handstand
  push-up* quittent le dictionnaire. **Leurs noms restent cherchables** et
  les séances déjà saisies ne bougent pas.
- *Côté*, *Prise* et *Niveau (gripper)* quittent l'écran d'ajout d'exercice.
  Les séances qui les portent les gardent.
- Une cinquantaine d'écritures qui ne faisaient que nommer un engin —
  *Curl à la poulie*, *Curl overhead avec élastique* — ne s'affichent plus
  dans le menu. **Elles restent cherchables** : l'engin se choisit maintenant
  dans Matériel.

**Ce qui reste à corriger, et qu'on sait**

- **Un outil posé entre minuit et 1 h du matin** ne remonte pas en tête de tes
  suggestions — une date est lue en heure locale, l'autre en heure
  universelle. Mesuré et inscrit dans `CHANTIERS.md` ; pas encore corrigé,
  parce que les deux façons de le faire ont un prix différent et que c'est
  une décision, pas un oubli.

---

## 1.66.0

**Corrige** le sens de montage du cône : son énoncé de départ était faux, et
l'avertissement qui l'accompagnait aussi.

## 1.65.1

**Corrige** le sens de montage du cône, validé après essai.

## 1.65.0

**Ajoute** les deux sens du cône, et les deux faces de l'avant-bras qu'ils
travaillent.

## 1.64.0

**Corrige** la proposition de muscles : l'accessoire effectivement choisi
propose enfin les siens, au lieu de ceux du type générique.

## 1.63.0

**Ajoute** le dixième lot du dictionnaire. Les quatre familles de muscles
sont complètes.

## 1.62.0

**Ajoute** le lot des pectoraux. L'*Écarté* absorbe treize noms qui en
faisaient des fiches séparées.

## 1.61.0

**Ajoute** le lot des dorsaux. Le *Rowing* se rétracte : ses variantes
rentrent sous lui au lieu de vivre à part.

## 1.60.0

**Change** l'écran de choix d'un exercice : il montre les **noms connus** du
mouvement plutôt que les muscles qu'il travaille.

## 1.59.0

**Change** le classement du dictionnaire : six groupes, un seul par
mouvement, et on le parcourt directement depuis *Ajouter un exercice*.

## 1.58.0

**Ajoute** le rangement du dictionnaire par groupe de muscles, replié à
l'arrivée.

## 1.57.0

**Ajoute** le septième lot et les tractions partielles, sourcées. Le
dictionnaire devient consultable.

## 1.56.1

**Corrige** un exercice en « reps seules », que le carnet racontait comme
« rien de saisi ».

## 1.56.0

**Ajoute** la recherche par mots : taper deux mots dans le désordre trouve le
mouvement. **Corrige** les doublons de la planche.

---

## Avant 1.56

L'historique détaillé n'a pas été tenu sous cette forme. Il se relit dans les
messages de commit du dépôt — `git log --oneline` — mais ceux-ci sont écrits
pour qui développe, pas pour qui s'entraîne.

**Ce fichier commence ici, et il est tenu à chaque montée de version.**
