# Le banc de recette

Deplace depuis le README le 2026-10-31 : il en occupait 64 %, et celui qui
ouvre le README cherche a faire tourner l'app, pas la liste des controles.
Rien n'a ete coupe.

Deux pages, **1 443 contrôles**, et un lanceur pour ne plus avoir à les ouvrir à la main.

```bash
node outils/banc.js        # sert les fichiers, ouvre les deux pages sans tête, rend 1 si rouge
```

À la main, c'est une page comme une autre :

```bash
python -m http.server 8713
```
- **http://localhost:8713/banc/** — le modèle. **936 contrôles, 32 blocs.**
- **http://localhost:8713/banc/ihm.html** — l'interface. **507 contrôles, 26 blocs.**
- **http://localhost:8713/revue/** — la **planche de revue**, qui n'est pas un banc :
  elle montre le **dictionnaire d'exercices tel qu'il est livré**, muscle par muscle, avec
  la planche anatomique de chacun, sa citation **mot pour mot** et le lien vers la source.
  C'est la surface sur laquelle MB valide un lot avant qu'il parte, et les noms y sont
  **modifiables** — un bouton rend les renommages à coller. Elle n'écrit jamais dans le
  carnet : ses renommages vivent dans une clé à part du navigateur.

  Elle parcourt `A.m.DICTIONNAIRE`, c'est-à-dire **ce qui est livré**, et va chercher la
  citation de chaque muscle dans `revue/catalogue.js`, qui ne part pas sur le téléphone.
  Un muscle livré sans citation s'affiche en rouge et compte dans « sans source » : la
  planche ne peut ni montrer autre chose que la vérité, ni taire un trou. Elle a d'abord
  lu le catalogue — donc une *copie* — et c'était le défaut même que ce carnet a payé cinq
  fois le 2026-10-23.

  Elle ne porte **aucun `?v=`** : `outils/version.py` gouverne dix-huit repères dans quatre
  fichiers nommés, et lui en donner un ferait mentir le compte. Elle casse son cache à
  l'horodatage, comme le banc.

  Elle ne montre que **ce qui reste à trancher** : les mouvements déjà validés sont
  masqués, comptés dans l'en-tête, et un bouton les rouvre. Demande de MB, 2026-10-23 :
  « pour le prochain lot, ne remets pas ceux qu'on a déjà validé. » Un mouvement **écarté**
  vers une phase ultérieure sort de la page entièrement — « ça pollue » — et n'est plus
  qu'une mention dans la ligne d'en-tête ; son travail reste dans le catalogue pour n'être
  pas refait.

  **Les lots, dans l'ordre décidé par MB.** 1 — le poignet et l'avant-bras. 2 — la main et
  le grip. 3 — les exercices de table. 4 — les épaules et le dos. **Les quatre sont
  livrés**, et le dictionnaire compte 31 mouvements. Chaque lot a suivi le même chemin —
  je liste, je source, MB valide, on livre. Reste la phase ÉQUIPEMENT.

  **La planche dit aussi ce qui n'est PAS sourcé.** Chaque rang (*moteur* / *aide*) porte
  sa base : *rang cité* quand une mesure dit qui mène ce geste, **rang raisonné** sinon —
  en rouge, et compté dans l'en-tête. Posé le 2026-10-23 sur une question de MB : « est-ce
  que parfois un muscle passe d'aide à moteur ? » En vérifiant, deux définitions du rang
  se contredisaient, et **111 rangs** se présentaient comme sourcés sans l'être. Un
  contrôle permanent compte en plus les rangs qui s'écartent de la **forme** de leur
  citation ; il a trouvé, à sa première exécution, une citation qui ne soutenait pas ce
  qu'elle appuyait.

  **Les équipements, livrés en 1.35.0.** Annoncés le 2026-10-23 pour « un second temps
  beaucoup plus tardif », ouverts le 26/10 et livrés le 27/10. **17 types**, relevés sur
  quatre sites d'armwrestling et triés depuis 228 références : un type n'entre que si son
  nom apparaît sur **deux sites indépendants** — c'est ce qui sépare un type de matériel
  d'une marque, et c'est ce qui tient la règle « rien n'est livré avec l'app ». L'outil
  est devenu la **cinquième source** de proposition de muscles, après le réglage, le nom,
  la prise et les forces.

  Trois choses s'y décident, et chacune a sa raison écrite :

  - **Les positions de montage sont SUGGÉRÉES, jamais créées.** Une clé de poignet
    propose « mousqueton au centre / à l'extérieur / à l'intérieur », une poignée à
    rotation libre « en haut / au milieu / en bas » — les trous y sont empilés, pas
    latéraux, et les noms disent **ce qu'on voit**. Un appui ouvre la fiche avec le nom
    déjà écrit ; rien ne s'ajoute avant l'enregistrement.
  - **Deux types ne proposent AUCUN muscle** : la ceinture de judo et la corde. Ce sont
    des **accessoires de liaison** — MB l'a démontré en décrivant la corde, « pour faire
    du curl, extensions & cie » : le même objet sert à des muscles opposés. Un contrôle
    exige que la liste des types sans muscle contienne exactement ces deux-là.
  - **Le carnet DIT où l'outil se monte, et ne refuse rien.** « Pas sur une sangle : il
    n'y a rien à grossir. » Quand rien n'est connu, il se tait — treize types sur
    dix-sept — au lieu d'écrire « rien de connu » ou de l'inventer.

  **Le catalogue des marques, en 1.36.0.** MB, 27/10 : « je ne vois que les 4 que j’ai
  ajoutés à la main, je ne vois pas Titan Grip avec les sous catégories ». **56
  références, 4 marques, 16 familles**, 2,1 Ko — dérivées des fiches de revue, pas
  saisies à part. Il **ne livre rien dans l’équipement** : c’est une référence qu’on
  parcourt, et un appui ouvre la fiche de l’outil avec le nom écrit ; c’est
  l’enregistrement qui pose. Deux contrôles le tiennent — un carnet neuf reste vide, et
  parcourir ne change rien. Une référence que le carnet ne sait pas lire porte la marque
  `libre` et le dit : « AXE » est le seul cas, le mot étant trop générique pour qu’un type
  le revendique.

  **L’affichage a été CHOISI, pas supposé.** Trois maquettes cliquables
  (`revue/simulations-equipement.html`, hors livraison), rendues avec les vraies données
  et le vrai CSS ; MB a pris la troisième — une seule liste, son matériel en haut, les
  marques repliées dessous, **tout replié au départ**. Cliquer a trouvé un défaut que la
  lecture n’aurait pas vu : un outil qui touche **deux familles** affichait deux « Se
  monte sur » anonymes.

  La planche de revue (`revue/equipement.html`, hors livraison) porte **cinq contrôles
  permanents** : un type sans fiche, une entrée du dictionnaire citée qui n'existe plus,
  un mot revendiqué par deux types, un produit que le carnet ne sait pas lire par son nom
  officiel, et un dépareillage entre les types et leur table de montage.

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
| un muscle perdu en route | `les 37 muscles sont toujours là — attendu 37, obtenu 36` |
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
| le brachio-radial remis dans une zone de mouvement de la main | `bord_pouce / Brachio-radial (coude)` |
| un muscle intrinsèque remis dans une zone de mouvement de la main | `Abd. auriculaire (intrinsèque : il bouge un doigt, pas la main)` |
| les lombricaux remis dans le creux de la paume | `attendu "ouvrir,serrer", obtenu "creux_paume,ouvrir,serrer"` |
| « en pronation » qui cesse de retourner le geste | `attendu "rond_pronateur,ecrl,ecrb,extenseurs_doigts", obtenu "fcr,fcu"` — 4 rouges |
| la rotation relue comme un moteur sous une position tenue | `obtenu "rond_pronateur,fcr,fcu,carre_pronateur"` — 4 rouges |
| le mot de rotation écarté PARTOUT au lieu de sous « en » | `« pronations à la poulie » : attendu les deux pronateurs, obtenu ""` |
| une position tenue qui avale tous les mots du nom | `« flexion du poignet en pronation » : attendu "fcr,fcu", obtenu ""` |
| le carré pronateur ajouté au wrist curl inversé sans source | `attendu -1, obtenu 1` |
| « en supination » traité sans décision | `attendu "supinateur", obtenu "brachio_radial,ecrl,ecrb,supinateur"` |
| le côté accentué qui cesse d’être lu | `attendu "fcr,fcu \| fcr \| fcu", obtenu "fcr,fcu \| fcr,fcu \| fcr,fcu"` — 6 rouges |
| le mot du côté ignoré mais pas RETIRÉ du nom | `attendu "fcr", obtenu "fcr,extenseurs_pouce,long_abducteur_pouce,court_abducteur_pouce"` — 6 rouges |
| le bord opposé laissé dans la proposition | `attendu "fcr", obtenu "fcr,fcu"` — 3 rouges |
| le sens du geste oublié sous un côté | `attendu "…,ecu,…", obtenu "…,fcu,…"` |
| une déviation pure réduite à un seul muscle | `attendu "fcr,ecrl,ecrb", obtenu "fcr"` |
| « pouce » tout seul promu marqueur de côté | `« extension du pouce » : attendu ses trois muscles, obtenu "fcr,ecrl,ecrb"` |
| les mots anglais et « cubitale » retirés | `« radial deviation » : obtenu ""` — 2 rouges |
| le long palmaire et les fléchisseurs des doigts retirés du wrist curl | `attendu "…,flechisseurs_doigts", obtenu "fcr,fcu"` — 9 rouges |
| l’option appliquée à MOITIÉ, les doigts oubliés | `attendu "…,long_flechisseur_pouce", obtenu "fcr,long_palmaire,fcu"` — 6 rouges |
| le long palmaire rangé sur un bord, alors qu’il est au milieu | `attendu 3, obtenu 2` |
| le dictionnaire placé AVANT mes propres exercices | `attendu "CURL MARTEAU", obtenu "Wrist curl"` — 5 rouges |
| une entrée du dictionnaire qui invente le côté et la prise | `attendu null, obtenu "droit"` |
| une entrée qui diverge de la lecture du nom | `attendu "fcu", obtenu "fcu,ecu"` |
| une entrée écrite hors de l’ordre de MUSCLES | `attendu "", obtenu "Wrist curl inversé"` |
| « extension poignet » retiré des trois muscles | `attendu les cinq, obtenu "ecrl,ecrb"` — 2 rouges |
| « reverse » qui cesse d’être un marqueur d’inversion | la liste mélange fléchisseurs ET extenseurs |
| la règle de prise retirée | `« pince pouce-index » : attendu 5 muscles, obtenu 9` — 2 rouges |
| la règle de prise appliquée PARTOUT, hors prise comprise | `« extension du pouce » : attendu ses 3 muscles, obtenu ""` — 2 rouges |
| les mots du grip retirés du petit doigt et des lombricaux | `« Gripper » : attendu 6 muscles, obtenu 4` — 3 rouges |
| une AUTRE ÉCRITURE que la lecture ne connaît pas | `« Rising » : attendu "fcr,ecrl,ecrb", obtenu ""` — **trouvé pour de vrai** |
| la prise ouverte qui cesse de proposer les fléchisseurs | `attendu "flechisseurs_doigts", obtenu ""` — 3 rouges |
| un libellé de prise qui repart sur « on pousse » | `les deux prises se définissent sur le POUCE — attendu true, obtenu false` |
| un muscle du pouce ajouté à la prise ouverte | `attendu 0, obtenu 1` |
| une seule cause pour l’état vide du buste | `il n’accuse JAMAIS des muscles déjà renseignés — attendu false, obtenu true` |
| la région d’un muscle changée sous lui | `la charge de l’epaule — attendu 4, obtenu 0` |
| le hook repassé en pronation, contre la décision de MB | `accord sur « Hook à la poulie »` + ses 2 écritures — 3 rouges |
| un mot d’écriture retiré d’un seul muscle | `« Tenue de poignet fermé » : 3 muscles au lieu de 5` |
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

