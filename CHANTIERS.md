# Les chantiers à venir

**Pourquoi ce fichier.** MB, 2026-10-29 : « Je veux que tous les projets à
venir soient consignés sur le git, que rien ne se perde. » Jusqu'ici ces
intentions vivaient dans des notes hors dépôt, que MB ne pouvait pas lire.
Elles vivent ici désormais, versionnées avec le code.

**Ce que ce fichier n'est pas** : une liste de tâches à faire maintenant.
Chaque entrée dit *quand* elle s'ouvre. L'ordre général est celui que MB a
posé le 23/10 — les mouvements d'abord, les équipements bien après.

---

## 1. Les équipements spécifiques au bras de fer

**Quand** : après les lots de mouvements. Ordre posé par MB le 2026-10-23,
« dans un second temps beaucoup plus tardif ».

Les équipements changent les muscles réellement sollicités par un même geste.
Le carnet a déjà de quoi l'accrocher : les outils ont un catalogue et des
réglages, et `musclesProposes()` connaît une source `reglage`.

Y est déjà renvoyée : **« Barre épaisse »**, écartée du lot 2 parce que c'est
le même geste que le gripper — c'est la poignée large qui ajoute le creux de
la paume. Elle EST l'outil, elle n'est pas un mouvement.

## 2. Les variantes, plutôt qu'un nom par engin

**Quand** : quand le dictionnaire sera rempli.

MB, 2026-10-29 : « je vois le même exo avec des variantes (barbell, dumbell
etc etc), je pense qu'il sera intéressant de prendre **le nom de l'exo de
base**, et ensuite avoir la possibilité de **sélectionner quelles variantes
dans le menu de l'exo directement**. Gros chantier à venir également. »

**Ce que ça corrige.** Aujourd'hui les variantes d'engin vivent dans `aussi`,
les autres écritures. « Développé militaire » absorbe douze façons d'écrire le
même geste. Ça marche pour la RECHERCHE, mais ça ne garde **aucune trace de
l'engin réellement utilisé** : l'historique ne saura jamais que la séance
s'est faite à la poulie plutôt qu'aux haltères.

**Conséquence sur les lots en cours** : les `aussi` qu'on écrit maintenant ne
sont pas perdus, mais une partie deviendra des variantes le jour venu.

## 3. Le dictionnaire feuilletable, par groupe de muscles, avec images

**Quand** : « plus tard, quand le dictionnaire sera déjà bien rempli »
(MB, 2026-10-29).

**Ce qui existe déjà** : 37 images de muscles (`icones/muscle-*.png`), chaque
muscle porte son champ `image`, les huit groupes existent
(`REGIONS_MUSCLE`), et `musclesDeLaRegion()` les dérive des muscles — jamais
d'une liste écrite à côté.

**Ce qui manque, et c'est le coût** : **aucune fiche d'exercice ne porte
d'image**. Zéro sur 46. Il faut un visuel par EXERCICE, pas par muscle.

**Le piège, mesuré le 29/10** : les GIF de docteur-fitness portent « Crédit
illustration © Aliaksandr Makatserchyk ». Ils ne sont pas réutilisables. Les
visuels devront être produits ou pris à une source libre — c'est ce qui décide
si ce chantier coûte une journée ou trois semaines.

Même besoin, vu d'un autre bout : un utilisateur de MB demandait le 29/10
« des vidéos ou photo de démonstration pour les exos spécifiques au bras de
fer ». MB : « le chapitre photo / vidéo est à mettre de côté pour le moment,
sans qu'on l'oublie pour autant. »

## 4. Suivi ▸ Muscles : grouper, et replier par défaut

**Quand** : à suivre, dès que le nombre de muscles le rend illisible.

MB, 2026-10-29 : « dans le suivi, ça va faire énormément de muscles qui vont
s'afficher dans "Muscles", il faudra les **classer par groupes**, et que les
**groupes soient réduits de base**. L'affichage des muscles se fait toujours,
le **plus sollicité apparaît en premier** je pense. »

Trois exigences, donc : groupés, repliés à l'arrivée, et l'ordre par
sollicitation **conservé** à l'intérieur. Les groupes existent déjà
(`REGIONS_MUSCLE`, huit zones) ; la section *Régions* du Suivi sait déjà
filtrer les muscles au doigt — voir si c'est le même mécanisme plutôt qu'un
second, parallèle.

Ce chantier grossit à chaque muscle ajouté : le lot des épaules en apporte
six.

## 5. Le poids du corps dans le graphe Volume par semaine

**Quand** : décision à prendre, pas un oubli.

La 1.52.0 compte le poids du corps **à part** du tonnage, et l'affiche dans
les totaux d'une séance (« AU POIDS DU CORPS 1 135 »). Le graphe *Volume par
semaine* n'est PAS touché : `volumeSeance()` reçoit le poids en argument, et
l'appel du graphe ne le passe pas.

L'y faire entrer veut dire décider s'il fait une **troisième pile** à côté
d'AW et Muscu générale. C'est une question d'affichage à part entière.

## 6. La taille, dans le profil

**Quand** : le jour où un écran en a besoin.

Demandée avec le poids le 29/10, **pas posée** : rien dans le carnet ne la
lirait. Un champ que rien ne consomme est un champ qui pourrit. Le poids, lui,
a trois lecteurs (Réglages, la séance, le Journal).

---

## Dettes mesurées, pas des chantiers

Petites, nommées, et qui ne demandent qu'une décision.

- **Le Cone Handle** propose un seul muscle (`flechisseurs_doigts`) là où sa
  fiche Golden Grip nomme une cup profonde, une tension côté auriculaire et de
  la supination. Signalé, pas traité.
- **La date de la séance de récup** : MB a eu une séance mal datée le 28/10,
  et le chemin par lequel c'est arrivé reste **inexpliqué**. Le champ Date du
  Journal permet de réparer ; la cause n'est pas trouvée.
- **Le dentelé antérieur et l'angulaire de l'omoplate** n'ont pas de planche
  utilisable (voir le lot des épaules) : l'angulaire n'est du domaine public
  qu'aux États-Unis, et aucune planche Gray isolant le dentelé n'a été
  trouvée.
