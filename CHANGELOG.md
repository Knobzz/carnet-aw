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
