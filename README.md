# Carnet AW

Carnet d'entraînement bras de fer. Programmes composables, séances journalisées,
sparring, suivi des douleurs et de la charge tendineuse. Pour un téléphone, en salle,
hors ligne, sans serveur.

**→ https://knobzz.github.io/carnet-aw/**

Sur le téléphone : ouvrir ce lien, puis *Ajouter à l'écran d'accueil*. L'app démarre
ensuite sans réseau. Les données restent sur l'appareil — l'hébergement ne sert qu'à
livrer les fichiers, et le carnet n'envoie rien nulle part.

- Le modèle de données : [MODELE.md](MODELE.md)
- La ligne de série, isolée : [maquette-ligne-serie.html](maquette-ligne-serie.html)

---

## La stack, et pourquoi

**HTML + CSS + JavaScript, sans framework ni build.** Fichiers servis tels quels.

| contrainte | ce qu'elle impose |
|---|---|
| tourner sur le téléphone | rien à compiler, rien à installer : on ouvre une URL |
| fonctionner hors ligne en salle | service worker + manifeste → PWA installable, tout en cache |
| rien chez un tiers | `localStorage` seul ; aucune requête réseau sortante dans le code |

Ce que ça coûte, dit franchement : pas de réactivité automatique — chaque vue déclare
ce qu'elle met à jour. C'est précisément ce qu'on voulait : **le re-rendu est un geste
explicite**, jamais un effet de bord d'une frappe au clavier. C'est ce qui règle le
piège n° 1 de ta spec, et aucun framework ne l'aurait réglé mieux.

**Pas de police web.** La typographie vient du système. Une police distante casse le
hors ligne et ajoute un aller-retour ; les chiffres sont rendus en `tabular-nums`, ce
qui est ce qui compte quand l'écran est une colonne de nombres.

---

## Faire tourner

Les fichiers sont statiques. Un serveur suffit, et il en faut un : le service worker
exige `http(s)` ou `localhost`.

```bash
python -m http.server 8713
```

Puis `http://localhost:8713`.

**Sur le téléphone**, il faut une origine en **HTTPS** pour que la PWA s'installe.
C'est le rôle de GitHub Pages ici : *Settings ▸ Pages ▸ Deploy from a branch ▸ `main` /
`(root)`*, aucune étape de construction. Un `git push` sur `main` suffit à publier.

Le fichier vide **`.nojekyll`** à la racine dit à Pages de ne pas passer le dépôt par
Jekyll. C'est le réglage qui correspond à ce que ce projet est — des fichiers servis tels
quels — et il évite qu'un moteur de gabarits s'interpose un jour sur un nom de fichier
qui lui déplaît. **Ne pas le supprimer en le croyant inutile.**

> Il a été ajouté en croyant débloquer une publication qui semblait arrêtée. **Ce n'était
> pas la cause** : la construction était simplement lente — une trentaine de minutes — et
> elle est passée toute seule, avant même que ce fichier soit construit. Un
> `Last-Modified` figé se lit comme une panne et n'en est pas une. Le fichier reste parce
> qu'il est juste, pas parce qu'il a réparé quelque chose.

Servie depuis un **sous-chemin** (`/carnet-aw/` et non la racine), l'app a été vérifiée
sur l'URL réelle : aucun chemin absolu, `start_url` et `scope` en `./`, service worker
enregistré avec la portée `https://knobzz.github.io/carnet-aw/` et 21 fichiers en cache,
tous sous `/carnet-aw/`.

Les données restent sur l'appareil, dans le stockage du navigateur de cette origine —
elles ne montent nulle part, même hébergée. L'hébergement ne sert qu'à livrer les fichiers.

---

## Sur le téléphone

C'est l'usage principal, et ces points-là ne sont pas du décor :

| | |
|---|---|
| **Bouton Retour** | Ferme le panneau ouvert, un par un. Installée en plein écran, l'app n'a plus de barre de navigateur : sans ça, le Retour **quittait l'app** au milieu d'une séance. |
| **Écran allumé** | Verrou d'écran pendant une séance seulement, relâché dès que tu quittes l'app. Débrayable dans Réglages — c'est de la batterie. |
| **Clavier** | « Suivant » passe de la charge aux reps, « Terminé » valide la série et referme le clavier. Deux gestes, pouce jamais levé. |
| **Clavier qui masque** | Le champ actif remonte **seulement** s'il est réellement recouvert, via `visualViewport`. Pas de saut de page à chaque appui. |
| **Tirer pour recharger** | Désactivé : c'est le geste qu'on fait sans y penser, et il rechargeait la page en pleine série. |
| **Stockage durable** | `navigator.storage.persist()` est demandé au démarrage, puis rejoué à la première touche (il aboutit bien mieux après un geste). Sans lui, un navigateur de téléphone peut **évincer** le carnet quand la place manque. Réglages affiche l'état réel : accordé / refusé. **Mesuré sur un vrai téléphone en 1.22.1, app installée : accordé.** |
| **Mode avion** | La coque et les icônes sont pré-cachées (21 fichiers) ; les illustrations de muscles ne le sont pas — le service worker les garde à la première consultation. **Essayé en salle en 1.22.1 : concluant.** Les 35 illustrations pèsent 2 Mo : les pré-cacher les ferait payer à chaque installation, y compris à qui ne regarde jamais la carte. |
| **Vibration** | Courte à la fin du repos, pour ne pas avoir à regarder l'écran. |
| **Cibles tactiles** | 44 px partout, vérifié sur les cinq écrans et dans les panneaux, à 320 px de large. |

---

## Mettre à jour sans que le téléphone serve l'ancienne version

C'est le piège classique d'une PWA : le correctif est livré, l'app paraît inchangée.
Trois protections, dont une mécanique.

```bash
python outils/version.py 1.1.1
```

Ce script pose la version aux **quatre** endroits — les 14 `?v=` d'`index.html`, les 2
de `banc/index.html`, le nom du cache dans `sw.js`, `APP_VERSION` dans `js/app.js` — et
**imprime le compte**. Un total différent de **18** veut dire qu'un fichier a bougé : il
refuse alors d'écrire. Sans argument, il se contente de vérifier la cohérence.
(Ce texte a annoncé 14, puis 17, pendant que le script en comptait un autre. Chaque fois
c'est le script qui avait raison, et le texte qui était resté en arrière — c'est
précisément pourquoi il imprime le compte plutôt que de le supposer.)

`banc/ihm.html` n'y figure pas, et c'est voulu : il charge `ihm.js` avec un horodatage à
chaque appel, donc il ne peut pas servir une copie périmée.

Les deux autres : le service worker installe ses fichiers avec `cache: 'reload'`
(sinon il recopie l'ancien contenu du cache HTTP dans un cache tout neuf), et il
revalide au réseau avec `cache: 'no-cache'`.

Reste un cas irréductible : **le tout premier chargement après une mise à jour** peut
servir une `index.html` encore en cache HTTP — la page qui porte les cache-busters ne
peut pas se buster elle-même. Le service worker corrige dès le chargement suivant.
Sur un vrai hébergeur statique (en-têtes corrects sur le HTML), ça ne se voit pas.

---

## Les fichiers

```
index.html                 coque : métas PWA et chargement des scripts
manifest.webmanifest       nom, icônes, affichage autonome
sw.js                      cache hors ligne (réseau d'abord, cache sinon)
css/app.css                feuille unique
js/
  store.js                 persistance : une clé, tout en try/catch, panne annoncée
  model.js                 identités, copies programme→séance, volume, colonne PRÉCÉDENT
  ui.js                    briques : éléments, confirmation en 2 temps, autocomplétion,
                           champ multi-valeurs, chronomètre
  panneau.js               panneau plein écran + fiche d'un exercice
  vue-seance.js            la séance en cours
  vue-recup.js             la routine de récupération, à cocher chaque jour
  vue-programmes.js        composition des programmes
  vue-sparring.js          formulaire de sparring
  vue-journal.js           journal daté, muscu et sparring mêlés
  vue-exercice.js          historique d'un exercice : la pente, les records
  vue-suivi.js             sollicitation, structures, douleurs et leurs 72 h, pentes, volume
  vue-reglages.js          thème, équipement, sauvegarde, état du stockage,
                           envoyer un retour, catalogues
icones/planches/           les 35 planches entières : la SOURCE des illustrations
icones/planches-gray/      les 37 gravures d'origine, sous leur nom latin
outils/faire-icones.py     régénère les PNG depuis le même dessin que l'icône SVG
outils/recadrer-planches.py  dérive icones/muscle-*.png des planches entières
outils/version.py          pose la version aux 4 endroits et compte les 18 occurrences
outils/banc.js             lance les deux bancs sans tête : node outils/banc.js
banc/index.html            banc de modèle — une page à ouvrir
banc/ihm.html + ihm.js     banc d'interface — rectangles réels, style calculé
```

---

## Le banc de recette

Deux pages, **981 contrôles**, et un lanceur pour ne plus avoir à les ouvrir à la main.

```bash
node outils/banc.js        # sert les fichiers, ouvre les deux pages sans tête, rend 1 si rouge
```

À la main, c'est une page comme une autre :

```bash
python -m http.server 8713
```
- **http://localhost:8713/banc/** — le modèle. **577 contrôles, 29 blocs.**
- **http://localhost:8713/banc/ihm.html** — l'interface. **404 contrôles, 18 blocs.**

**Les deux s'ouvrent dans un navigateur ordinaire.** Playwright n'est exigé que par le
*lanceur* sans tête : sans `node` sur la machine, les deux pages tournent quand même, et
c'est comme ça que la 1.22.0 a été vérifiée.

**Ni l'un ni l'autre ne touche au carnet.** Le banc de modèle travaille sur des états
fabriqués. Le banc d'interface, lui, fait tourner la **vraie app**, qui écrit : il pose
`window.__BANC_IHM` avant de charger `store.js`, qui choisit alors une autre clé de
stockage. Son premier bloc le vérifie — une isolation qu'on ne mesure pas n'est qu'une
intention.

Ce que mesure le **modèle** : lecture des nombres et des slugs · la colonne PRÉCÉDENT ·
le volume (fait vs prévu, charge non chiffrée, saisie incomplète) · l'indépendance
programme/séance · les douleurs et leur compatibilité descendante · structures et fenêtre
72 h · la durée déduite · l'historique · la fusion à l'import · le chrono persistant · les
catalogues vides au départ · ce que l'autocomplétion montre vraiment · les six
mouvements · la durée par série, le temps sous tension et les colonnes choisies ·
la migration d'un carnet d'avant · la récupération quotidienne et sa régularité ·
le côté et le recoupement douleur / bras qui l'a chargée · **la règle des 24 h** ·
**les réglages d'un outil, et ce qu'ils proposent** ·
**« où ça tire », pour cocher des muscles sans en connaître les noms** ·
**la progression en récupération · **les muscles, la prise, et la carte du bras**.

Ce que mesure l'**interface**, et que le modèle ne peut pas voir : des rectangles réels et
du style calculé, dans un iframe de **320 px** — la largeur la plus dure. Le chronomètre
sort-il entièrement de l'écran, et laisse-t-il la barre d'onglets atteignable · la fiche
d'exercice affiche-t-elle ce qu'elle doit, et plus ce qu'elle ne doit plus · 44 px sur
chaque puce et chaque bouton · aucun débordement horizontal · la suggestion la plus récente
est-elle lisible sans rien taper · une ligne de série à trois champs reste-t-elle
saisissable · **chaque muscle est-il quelque part — une région du schéma, ou la liste
déclarée des muscles qui ne vivent que dans les barres** · **les pistes d'un même groupe
commencent-elles au même endroit, et en reste-t-il assez pour comparer** · six onglets tiennent-ils
dans la barre · **une journée de récupération
vide reste-t-elle hors du journal · **le nom de l'exercice tient-il dans le chrono** ·
**le filtre de l'équipement masque-t-il vraiment ce qu'il prétend**.

**Un contrôle qu'on n'a pas vu tomber ne prouve rien.** Cent cinq défauts ont été
réintroduits volontairement, un par un, et le banc les a tous fait rougir :

| défaut réintroduit | ce que le banc a dit |
|---|---|
| PRÉCÉDENT indexé par rang brut | `attendu "20 × 12", obtenu "22 × 10"` — 4 contrôles rouges |
| volume recomptant les cibles | `une séance pas commencée pèse ZÉRO — attendu 0, obtenu 240` |
| intensité inconnue remplacée par 5 | `devient inconnue plutôt que fausse — attendu null, obtenu 5` |
| `vuLe` ramené à la date seule | `l'outil ajouté À L'INSTANT est VISIBLE — attendu true, obtenu false` |
| chrono caché par `translateY(140%)` | `haut mesuré à 679 px pour un écran de 720` — 41 px de fantôme, et la barre d'onglets injoignable |
| volume lisant les champs masqués | `une durée saisie puis masquée ne compte plus — attendu 0, obtenu 30` |
| migration laissant les secondes dans REPS | `les secondes sont maintenant comptées — attendu 65, obtenu 0` — 4 contrôles rouges |
| journée de récup vide gardée au journal | `vidée de tout, la journée ressort du journal — attendu 0, obtenu 1` |
| ✓ coché indistinct en récupération | `le ✓ coché ne se confond pas avec un ✓ qui ne l'est pas — attendu true, obtenu false` |
| libellé du chrono sur la ligne des boutons | `il a de la place pour être lu — 28 px, il en faut 150` |
| outil hors catalogue non pré-coché | `l'outil hors catalogue est GARDÉ — attendu 1, obtenu -1` — 4 contrôles rouges |
| classement sans départage à égalité | `dans un carnet d'AVANT, le dernier outil posé est visible — attendu true, obtenu false` — 4 contrôles rouges |
| « les deux » traité comme un 3ᵉ côté | `le droit compte l'exercice droit ET celui qui porte sur les deux — attendu 2, obtenu 1` — 6 contrôles rouges |
| côté inconnu attribué au bras demandé | `à part, ce qui aurait pu être en cause sans qu'on puisse le dire — attendu "Vieux curl", obtenu ""` |
| côté perdu entre la feuille et le modèle | `le côté AUSSI — attendu "droit", obtenu null` |
| question des 24 h posée le jour même | `une douleur notée AUJOURD'HUI n'appelle rien — attendu 0, obtenu 1` |
| relevé empilé au lieu de corrigé | `répondre deux fois CORRIGE — attendu 1, obtenu 2` |
| nom de zone rogné dans la question | `il n'est pas tronqué — 90 px de place, il en demande 122` |
| « grip » accepté comme mot-muscle | `« Titan Grip » est un outil — attendu -1, obtenu 1` — 3 contrôles rouges |
| carré pronateur compté comme médial | `il est distal, et le compter là ferait accuser la mauvaise insertion — attendu 0, obtenu 6` |
| un muscle sans région sur le schéma | `aucun muscle ne manque (absents : Supinateur) — attendu 0, obtenu 1` |
| une illustration annoncée mais absente du dépôt | `les 19 illustrations existent vraiment` — 2 contrôles rouges |
| l'illustration qui n'est plus celle du muscle le plus chargé | `c'est l'illustration du muscle le PLUS sollicité` |
| l'image qui ne s'ouvre plus en grand | `c'est un BOUTON — attendu "BUTTON", obtenu "DIV"` |
| les muscles sans illustration passés sous silence | `les vingt-deux muscles ont leur illustration propre` |
| la planche générale retirée à un muscle | `chaque muscle garde AUSSI sa planche générale` |
| un glissement qui ouvre aussi l'image | `un glissement n'OUVRE PAS l'image en grand : ce n'est pas un appui` |
| aucun seuil : le moindre tremblement défile | `un petit mouvement ne fait pas défiler : c'est un appui qui a tremblé` |
| un geste en diagonale pris pour un défilement | `le doigt partait vers le bas, c'est la page qu'il voulait bouger` |
| un cul-de-sac au bout de la liste | `au-delà du dernier, ça BOUCLE — attendu "1 / 6", obtenu "6 / 6"` |
| `touch-action` oublié sur la zone de glissement | `le geste horizontal nous revient (mesuré : auto)` |
| les flèches du clavier retirées | `la flèche droite défile aussi — attendu "2 / 6", obtenu "1 / 6"` |
| l'ordre qui n'est plus celui des barres | `on commence par le muscle le PLUS sollicité` |
| les douleurs remontées avant les muscles | `« Par structure » et « Douleurs » ferment la marche, dans cet ordre` |
| un calque reposé sur l'illustration | `rien n'est posé dessus : l'image est le sujet, pas un fond` |
| l'ancien `extenseurs_poignet` perdu au lieu d'être converti | `il devient les deux — attendu "ecrl,ecrb", obtenu ""` |
| un muscle sans articulation déclarée | `chaque muscle dit ce qu'il mobilise (muets : Triceps brachial)` |
| un muscle compté pour toutes les articulations | `le fléchisseur ulnaire plie le poignet — attendu 3, obtenu 8` — 3 contrôles rouges |
| une série comptée par muscle du coude, pas une fois | `quatre séries restent quatre — attendu 4, obtenu 12` — 2 contrôles rouges |
| une articulation à zéro cachée | `chaque articulation a sa barre, zéro compris — attendu 6, obtenu 5` |
| le nom court d'un muscle oublié | `chaque muscle a un nom court` puis `la piste garde de quoi comparer (27 px)` |
| deux muscles au même nom court | `deux muscles ne portent pas le même — obtenu "Fléch. ulnaire"` |
| ce que le muscle FAIT retiré du détail | `il dit ce que le muscle FAIT — attendu true, obtenu false` |
| les hors dessin listés même sans série | `et ne l'est pas quand il n'a aucune série — attendu true, obtenu false` |
| une grille par ligne au lieu d'une par groupe | `toutes les pistes commencent au même endroit (vues : 204/27 176/55)` — 2 contrôles rouges |
| une région de muscles oubliée du tableau | `chaque muscle a sa ligne dans la fiche — attendu 22, obtenu 19` |
| une planche nommée mais absente du dépôt | `les 8 planches existent vraiment (icones/Gray417.png (404))` — 2 contrôles rouges |
| un muscle sans nom latin | `chaque muscle porte son nom latin — obtenu "Extenseur ulnaire du carpe"` |
| un muscle sans planche | `renvoie à une planche qui existe — obtenu "Supinateur"` |
| le latin retiré de la planche ouverte | `le nom LATIN à y chercher — attendu true, obtenu false` |
| la source de la gravure non citée | `la source est citée : Gray, 1918, domaine public` |
| le libellé des barres redevenu inerte | `c'est un BOUTON, pas un texte qui fait semblant` |
| un réglage reposé qui empile au lieu de mettre à jour | `reposer le même nom MET À JOUR — attendu 2, obtenu 3` |
| un renommage de réglage traité comme un ajout | `renommer par identifiant ne crée pas de second réglage — attendu 2, obtenu 3` |
| un réglage gardé après décochage de son outil | `retirer l'outil emporte son réglage — attendu 0, obtenu 1` |
| le réglage perdu à la copie de l'exercice | `remettre l'outil retrouve son réglage — attendu "Dehors", obtenu null` |
| le réglage absent du nom affiché de l'outil | `l'outil se DIT avec — attendu "Titan Grip · Dehors"` |
| la source « réglage » non nommée au bouton | `la source est NOMMÉE — attendu "reglage", obtenu "nom"` |
| la rangée de réglages montrée sans réglage à offrir | `un outil SANS réglage ne montre rien — attendu 0, obtenu 63` |
| la coupe à huit remise sur l'équipement | `TOUT l'équipement est proposé — attendu 15, obtenu 8` |
| un muscle qu'aucune zone ressentie ne nomme | `chaque muscle est atteignable sans connaître son nom (Supinateur)` |
| une zone qui nomme un muscle inexistant | `ne nomme aucun muscle inexistant — obtenu "serrer/zzz"` |
| une zone qui remplace la sélection au lieu de l'enrichir | `une seconde zone S'AJOUTE — attendu true, obtenu false` |
| le bloc « je ne connais pas les noms » déplié d'office | `il est REPLIÉ au départ — attendu 0, obtenu 611` |
| la liste de muscles non rafraîchie après un appui | `la liste en dessous le MONTRE — attendu 4, obtenu 0` |
| la ligne d'outil redevenue un div cliquable | `chaque ligne est un BOUTON — un div ne s'atteint pas au clavier` |
| les régions de muscles dépliées d'office | `toutes sont fermées — attendu 0, obtenu 6` — 2 contrôles rouges |
| « Épaule et tronc » refondue en une seule région | `« tronc » n’existe plus — attendu -1, obtenu 0` — 14 contrôles rouges |
| un muscle laissé dans l’ancien groupe | `aucun muscle dans un groupe qui n’est pas une région — attendu "", obtenu "tronc"` |
| une région déclarée que rien ne remplit | `aucune région sans muscle — attendu "", obtenu "nuque"` |
| un muscle perdu en route | `les 36 muscles sont toujours là — attendu 36, obtenu 35` |
| l’axe du Suivi figé au lieu de suivre les régions | `autant de clés qu’il y a de régions — attendu 7, obtenu 5` |
| la semaine commencée le dimanche | `chaque semaine rendue commence un LUNDI` — huit dimanches nommés |
| un pas de 14 jours entre les semaines | `deux semaines voisines sont à SEPT jours` — sept lundis nommés |
| le lundi rangé dans la semaine précédente | `une séance SUR le premier lundi est dans la fenêtre — attendu 4, obtenu 2` |
| une région du catalogue sans forme sur le buste | `attendu "", obtenu "epaule"` |
| une forme portant un id hors catalogue | `attendu "", obtenu "tronc"` |
| le triceps posé aussi sur la vue de face | `le bras arrière ne s’allume QUE sur la vue de dos — attendu true, obtenu false` |
| le total pris sur la dernière semaine seule | `attendu 88, obtenu 8` |
| les semaines vides escamotées de la piste | `douze semaines, pleines ou vides — attendu 12, obtenu 11` |
| le « jamais » peint en bleu pâle | `une région jamais travaillée est grise — attendu 2, obtenu 0` |
| le buste rétréci sous la cible du doigt | `la plus petite région reste touchable (avant_bras_av : 10 px)` |
| le torse refondu en une seule région | `« torse » fondu n’existe plus — attendu -1, obtenu 1` — 12 contrôles rouges |
| le même torse posé sur les deux vues | `de dos, il porte le dorsal — et pas le pectoral` |
| l’ancienne échelle bleu → rouge | `chaque teinte est CHAUDE — attendu 0, obtenu 3` |
| la fenêtre calculée N × 7 au lieu du vrai span ISO | `1 mois couvre 25 jours, pas 28 — attendu 25, obtenu 28` — 6 contrôles rouges |
| une période inconnue sans repli sur le défaut | `on rend une période DE LA TABLE — attendu 0, obtenu 6` |
| le choix de période non écrit dans les réglages | `attendu "1s", obtenu "3m"` |
| les pistes hebdomadaires gardées sous 4 semaines | `sur une semaine, aucune piste — attendu 0, obtenu 6` |
| le filtre par région qui ne filtre pas | `intrus : Deltoïde, Long ext. radial, Pectoral, Dorsal…` |
| le croisement qui affirme sur le mouvement | `n’affirme plus « ce qu’il fait travailler » — attendu 0, obtenu 1` |
| le mélange de gestes fondu sans étoile | `le biceps crédité à la pronation porte une étoile — attendu true, obtenu false` |
| la descente du chronomètre trop courte | `haut mesuré à 606 px pour un écran de 720` |
| la classe « visible » laissée sur le bandeau arrêté | `classes du bandeau « chrono visible »` — 4 contrôles rouges |
| la glissade du chronomètre supprimée | `montée 0.26s, descente 0s` |
| une carte plus large que l’écran (360 px pour 320) | `div.carte [12→372]` — 5 blocs rouges |
| un bouton plus large que l’écran | les 2 derniers blocs de débordement, rouges |
| la colonne des 28 jours remise dans Récup | `plus rien n’annonce une fenêtre de 28 jours — attendu 0, obtenu 1` |
| le toucher qui ne nomme plus le contenu d’une région | `« Biceps — jamais travaillée »` au lieu de nommer le brachial |
| la garde du champ vide retirée des deux boutons | un ticket GitHub **vide** s’ouvre, et « null » part dans le presse-papier — 6 contrôles rouges |
| « le wrist curl en pronation » rendu au bord de l’auriculaire | `bord_auriculaire / « wrist curl en pronation » : 1 sur 4` |
| une région déjà cochée qui reste fermée | `la région qui les contient s'ouvre — attendu true, obtenu false` |
| le compte retiré de l'en-tête de région | `dit combien de muscles elle contient, sans l'ouvrir` |
| un mouvement qui ne coche plus ses muscles | `cocher « Cupping » coche directement ses muscles` |
| décocher un mouvement qui ne retire rien | `décocher le mouvement RETIRE ses muscles — attendu 0, obtenu 4` |
| décocher qui reprend toute la liste du mouvement | `ce qui était coché à la main survit — attendu "fcu", obtenu ""` |
| la provenance confondue entre deux mouvements | `décocher « Rising » ne reprend pas le biceps : c'est la supination qui l'avait posé` |
| « Structures chargées » remontée dans la fiche | `passe APRÈS « Mouvements » — attendu true, obtenu false` |
| le groupe de réglages muet sur un outil sans réglage | `il dit pourquoi la rangée est vide` |
| l'entrée voisine non signalée | `l'app DIT lequel les porte, au lieu de laisser chercher` |
| une aide LONGUE sous « Structures chargées » | `elle est COURTE (214 signes) : c'est le bavardage qui était reproché` |
| « Structures chargées » plus en dernier | `c'est même le TOUT dernier groupe de la fiche, après le repos` |
| l'articulation retirée des lignes de la fiche | `chaque ligne dit l'articulation mobilisée — attendu 0, obtenu 22` |
| les lombricaux et l'hypothénar remis dans la prise fermée | `et ni les lombricaux ni l'hypothénar : la source ne le dit pas — attendu "", obtenu "opposant_auriculaire,lombricaux"` |
| les noms d'exercices qui fuient dans le retour | `le contexte ne porte AUCUNE donnée d'entraînement — attendu "", obtenu "Pronation Titan Grip, Curl marteau"` |
| un champ retiré du contexte technique | `et ils sont bien dix — attendu 10, obtenu 9` |
| le texte du testeur qui ne part plus | `le texte du testeur part — attendu true, obtenu false` |
| la garde du retour vide retirée | `un retour vide ne part pas — attendu null` — 3 contrôles rouges |
| le corps du ticket concaténé brut | `et il ne part jamais brut — attendu -1, obtenu 60` |
| le plafond d'URL retiré | `un retour trop long rend null — obtenu "https://github.com/…"` |
| le bloc technique replié à zéro pixel | `il est VISIBLE, pas replié (hauteur mesurée : 0 px)` |
| « Copier » qui perd sa classe `.bt` | `chacun fait au moins 44 px de haut — attendu "", obtenu "Copier"` |
| l'équipement redescendu en bas des Réglages | `l'ordre des Réglages : le catalogue puis l'équipement, tout en haut` |
| les blocs des Réglages ouverts par défaut | `tous sont REPLIÉS au départ — attendu 0, obtenu 3` — 5 contrôles rouges |
| le compte retiré de l'en-tête repliée | `le compte se lit sans ouvrir — attendu "3,1,1", obtenu ",,"` |
| une planche archivée reconvertie à 32 couleurs | `les planches archivées ont gardé leur marquage — vidées par la conversion : pronator_quadratus` |
| le décochage d'une zone rendu au premier qui a posé | `c'est une union, pas un premier arrivé premier servi — attendu true, obtenu false` |
| une zone qui ADOPTE un muscle coché à la main | `il survit même quand la zone qui le contient est décochée — attendu true, obtenu false` |
| la négation du nom ignorée | `un wrist curl INVERSÉ relève le poignet — attendu "ecrl,ecrb,extenseurs_doigts", obtenu "fcr,fcu"` — 4 contrôles rouges |
| les articles qui recassent la correspondance | `« flexion DU poignet » se lit comme « flexion poignet » — attendu "fcr,fcu", obtenu ""` — 2 contrôles rouges |
| les mots relus en sous-chaîne | `« latérale » ne contient plus « lat » — attendu "deltoide", obtenu "grand_dorsal,deltoide"` — 2 contrôles rouges |
| « doigts » tout seul remis aux fléchisseurs | `des doigts qui s'écartent, ce sont les extenseurs — obtenu "flechisseurs_doigts,extenseurs_doigts"` |
| une source rendue anonyme | `une source qui n'est pas du manuel NOMME qui l'affirme — attendu "", obtenu "back_pressure"` — 2 contrôles rouges |
| une poussée donnée pour de l'anatomie | `une DIRECTION DE POUSSÉE n'est jamais donnée pour de l'anatomie — obtenu "side_pressure"` — 2 contrôles rouges |
| deux sources arbitrées en silence | `on ne tranche pas en silence entre deux sources — attendu true, obtenu false` — 2 contrôles rouges |

Ce tableau est un **journal**, pas un inventaire : quelques lignes citent des contrôles
qui ont disparu avec ce qu'ils mesuraient — les planches générales de l'atlas, par
exemple, supprimées depuis que chaque muscle a son illustration propre. Elles restent
parce qu'elles disent ce qui a été payé, pas ce qui tourne aujourd'hui.

Deux méritent une mention. Le correctif du tri a d'abord été écrit avec un horodatage lu à
l'horloge, et **le banc l'a fait tomber** — huit outils posés d'un même geste tombent dans
la même milliseconde et restaient à égalité ; c'est ce qui a mené à un horodatage
strictement croissant. Et le chrono a été corrigé deux fois : le premier seuil, 419 px,
passait le contrôle à 320 px et **coupait encore le libellé à 430 px**, la largeur d'un
téléphone courant. Le contrôle, lui, mesurait un libellé trop court pour s'en apercevoir —
il mesure désormais le format réel de l'app.

Un défaut est passé **deux fois** : l'autocomplétion des outils, corrigée en horodatant
`vuLe`, puis constatée encore fautive sur un vrai téléphone. Corriger l'écriture ne
corrige pas ce qui est déjà écrit — un carnet nourri avant la correction porte des dates
seules, à égalité, et n'affichait jamais que ses huit premiers outils. Le classement
départage désormais à égalité, et le banc mesure enfin un carnet ANCIEN, ce qu'aucun de
ses contrôles ne faisait.

Et un contrôle a été ajouté **après** avoir vu qu'un défaut passait : compter le carré
pronateur comme médial ne faisait rougir aucun cas, parce qu'aucun n'en employait. Le
drapeau était vérifié, le COMPTE ne l'était pas.

Un autre a échappé au banc avant d'être vu à l'écran : le filtre de l'équipement
masquait les catégories entières mais pas les lignes d'une catégorie qui, elle,
correspondait — `display: flex` l'emporte sur `[hidden]`. Le contrôle ne regardait qu'une
ligne d'une catégorie entièrement masquée. Il regarde maintenant les deux cas.

Et un contrôle a **refusé de tomber** sur le défaut qu'on lui destinait : réduire la
hauteur de « Copier » en ligne le laissait vert, parce que `.bt` porte `min-height: 44px`
qui l'emporte. Le défaut réaliste n'était pas « un bouton plus petit » mais « un bouton
qui n'est plus un `.bt` » — la même régression que la ligne d'outil redevenue un `div`.
Tant qu'on n'avait pas trouvé ce défaut-là, ce contrôle ne prouvait rien.

`outils/recadrer-planches.py` porte ses **sept contrôles** à lui, avec les mêmes règles :
`--controle liste` lui ajoute une planche qui n'en a pas besoin, `--controle plancher`
retire le minimum de 296×400, `--controle seuil` laisse l'orange passer pour du marquage,
`--controle miettes` garde les pixels rouges égarés. Chacun fait rougir. Le plus utile
**refait la mesure** et exige qu'elle corresponde à la liste des planches recadrées, dans
les deux sens — c'est lui qui a trouvé l'opposant de l'auriculaire tout seul, à l'arrivée
des planches de la main.

Les cas marqués `[temoin]` mesurent un invariant du décor et tiennent des deux côtés —
leur libellé dit pourquoi.

> Le banc chargeait d'abord ses scripts avec un simple `?v=<version>` et restait **vert sur
> du code cassé**, le navigateur resservant sa copie. Il ajoute désormais un horodatage à
> chaque chargement. Ce faux vert n'a été vu que parce qu'on a exigé de le faire tomber.

---

## Les six pièges, et où ils sont traités

1. **Pas de re-rendu à la frappe.** `js/vue-seance.js` : les gestionnaires d'entrée
   écrivent dans le modèle, rafraîchissent trois `textContent` de totaux, et s'arrêtent
   là. Ajouter, retirer ou déplacer une série insère / retire / déplace **un** nœud.
   Vérifié : focus et position du curseur conservés sur quatre frappes consécutives.
2. **Rien en dur.** Aucun programme, aucun exercice, aucun outil livré, et pas davantage
   de routine de récupération. Les trois catalogues (exercices, outils, catégories)
   n'existent que par ce qui a été saisi.
   Il y avait **une exception** — un bouton « Ajouter mon matériel » posant douze outils
   écrits dans le code. Elle a été **retirée** : opt-in ou non, une liste écrite dans le
   code est une liste imposée, et elle revenait indéfiniment pour tout outil supprimé.
   Remonter un équipement d'un coup, c'est le travail de l'import d'une sauvegarde.
3. **Ni `confirm()` ni `alert()`.** Deux formes : le bouton qui s'arme et se désarme
   seul après 4 s (`A.ui.confirmer2`), et la feuille de choix (`A.ui.feuille`) qui
   nomme ce qui va disparaître.
4. **Persistance.** Lecture et écriture sous `try/catch` ; un échec affiche un bandeau
   qui dit quoi faire, au lieu de perdre la saisie en silence. Écriture groupée à
   400 ms, immédiate quand la page passe en arrière-plan. Export et import vérifiés
   par un aller-retour complet : export → tout effacer → import → état identique.
5. **Mobile d'abord.** Vérifié à 320 px : aucun défilement horizontal sur les cinq
   écrans ni dans les panneaux, et aucun contrôle sous 44 px.
6. **Thème clair et sombre**, déduits du système, surchargeables dans Réglages.

---

## Envoyer un retour

Réglages porte un bouton pour les bêta-testeurs : une zone de texte, un bloc de contexte
**technique** généré tout seul — version, écran, navigateur, installée ou non, et des
comptes — puis **Copier** ou **Ouvrir un ticket GitHub** pré-rempli.

**Aucune donnée d'entraînement n'en sort** : jamais un nom d'exercice, d'outil ou de
programme, jamais une charge, jamais une douleur. Le banc le mesure sur un carnet
fabriqué avec des noms reconnaissables.

**Rien ne part tout seul**, et le texte est lisible en entier avant — un contrôle mesure
la hauteur réelle du bloc, pas son attribut `hidden`. Le ticket est le **seul endroit de
l'app qui mène dehors** : pas une requête, une navigation vers `github.com` déclenchée par
un appui. Détail du dessin : [MODELE.md](MODELE.md).

---

## Ce qui reste ouvert

- **Aucune donnée ne sort de l'appareil.** Changer de téléphone = exporter puis importer.
  C'est le seul chemin, et c'est voulu : il n'y a pas de compte, donc pas de synchronisation.
- Le journal garde tout. Si un jour il devient lourd, c'est là qu'il faudra regarder —
  Réglages affiche la taille réelle des données.
