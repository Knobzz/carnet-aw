/* Modèle : identité des exercices, copie programme -> séance, volume, colonne PRÉCÉDENT. */
(function (A) {
  'use strict';

  /* Le type « échauffement » a été retiré : il n'était pas employé, et il
     gonflait le volume de travail sans qu'on puisse l'en sortir. Les séries
     qui le portaient deviennent normales à la lecture — voir migrer(). */
  var TYPES_SERIE = {
    normale:    { lettre: '',  nom: 'Normale' },
    degressive: { lettre: 'D', nom: 'Dégressive' },
    echec:      { lettre: 'E', nom: "À l'échec" }
  };
  var ORDRE_TYPES = ['normale', 'degressive', 'echec'];

  /* `typeCharge` ne dit plus qu'une chose : COMMENT se lit la charge. Il disait
     aussi, pour la valeur 'duree', quelles colonnes afficher — en detournant la
     colonne REPS en secondes. Deux questions dans un seul champ : un exercice
     isometrique ne pouvait pas se passer de la colonne charge, et un exercice
     en kilos ne pouvait pas porter de duree. Ce qui s'affiche est maintenant
     dit par `colonnes`, juste en dessous. */
  var TYPES_CHARGE = [
    { id: 'kg',          nom: 'Kilos',            unite: 'kg', labelCharge: 'Charge', modeCharge: 'decimal', tonnage: true },
    { id: 'niveau',      nom: 'Niveau (gripper)', unite: '',   labelCharge: 'Niveau', modeCharge: 'text',    tonnage: false },
    { id: 'elastique',   nom: 'Élastique',        unite: '',   labelCharge: 'Bande',  modeCharge: 'text',    tonnage: false },
    { id: 'poids_corps', nom: 'Poids du corps',   unite: 'kg', labelCharge: 'Lest',   modeCharge: 'decimal', tonnage: false }
  ];

  /* Ce que la ligne de serie AFFICHE. Trois colonnes au plus : a 320 px, la
     quatrieme passerait sous 45 px avec la colonne PRECEDENT, et on ne lirait
     plus rien. Un isometrique n'affiche que DUREE ; le defaut reste charge+reps.

     L'ordre de ce tableau est l'ordre a l'ecran, toujours : la colonne charge
     ne doit pas changer de place d'un exercice a l'autre. */
  /* Chaque colonne sait OU elle lit, OU elle ecrit, comment elle s'appelle et
     quel clavier elle demande. La seance et l'editeur de programme batissent
     tous deux leurs champs a partir d'ici : les nommer un par un dans chaque
     vue dupliquait le code et rendait l'ajout d'une colonne impossible sans
     rouvrir les deux. L'entete de la colonne charge depend du type de charge
     — « Charge », « Niveau », « Bande », « Lest » — d'ou les fonctions. */
  var COLONNES = [
    { id: 'charge', nom: 'Charge', reel: 'chargeReel', cible: 'chargeCible',
      label: function (tc) { return tc.labelCharge; },
      mode: function (tc) { return tc.modeCharge; },
      aide: 'Ce qui est soulevé.' },
    { id: 'reps', nom: 'Reps', reel: 'repsReel', cible: 'repsCible',
      label: function () { return 'Reps'; },
      mode: function () { return 'numeric'; },
      aide: 'Le nombre de répétitions.' },
    /* En SECONDES : le clavier numerique du telephone n'offre pas de « : ».
       secondes() lit quand meme « 1:30 », pour un carnet tape ailleurs, mais
       ce n'est pas ce qu'on demande ici. */
    { id: 'duree', nom: 'Durée', reel: 'dureeReel', cible: 'dureeCible',
      label: function () { return 'Sec'; },
      mode: function () { return 'numeric'; },
      aide: 'Le temps sous tension de la série, en secondes.' }
  ];
  var COLONNES_DEFAUT = ['charge', 'reps'];

  function colonne(id) {
    for (var i = 0; i < COLONNES.length; i++) if (COLONNES[i].id === id) return COLONNES[i];
    return COLONNES[0];
  }

  /* Les colonnes d'un exercice, remises dans l'ordre canonique et jamais vides :
     un exercice sans aucune colonne n'aurait plus rien a saisir. */
  function colonnes(exo) {
    var voulues = (exo && exo.colonnes) || null;
    if (!voulues || !voulues.length) return COLONNES_DEFAUT.slice();
    var l = [];
    COLONNES.forEach(function (c) { if (voulues.indexOf(c.id) >= 0) l.push(c.id); });
    return l.length ? l : COLONNES_DEFAUT.slice();
  }
  function aColonne(exo, id) { return colonnes(exo).indexOf(id) >= 0; }

  /* Le tonnage est charge x reps : sans les DEUX colonnes, il n'y a rien a
     multiplier. C'est ce qui fait qu'un isometrique ne pese rien tout seul,
     sans qu'on ait eu a l'ecrire quelque part — et c'est aussi pourquoi la
     migration des anciens `typeCharge: 'duree'` ne deplace aucun chiffre. */
  function peutPeser(exo) {
    return typeCharge(exo && exo.typeCharge).tonnage
        && aColonne(exo, 'charge') && aColonne(exo, 'reps');
  }

  /* Les mouvements du bras de fer. La cle de stockage reste `forces` sur
     l'exercice : renommer le champ casserait les carnets deja saisis, et
     l'affichage seul avait besoin de changer. Ranges par axe — ce qui pousse,
     puis ce que fait la main. */
  var FORCES = [
    { id: 'rising',        nom: 'Rising' },
    { id: 'back_pressure', nom: 'Back pressure' },
    { id: 'side_pressure', nom: 'Side pressure' },
    { id: 'supination',    nom: 'Supination' },
    { id: 'cupping',       nom: 'Cupping' },
    { id: 'pronation',     nom: 'Pronation' }
  ];

  /* Structures anatomiques qu'un exercice charge. Les cinq premieres sont
     EXACTEMENT les zones de douleur : c'est ce qui permet a Suivi de croiser
     « quand ai-je charge lourd le medial » avec « quand le medial a fait mal ».
     Les deux dernieres n'ont pas de douleur correspondante, et c'est assume. */
  var STRUCTURES = [
    { id: 'poignet',       nom: 'Poignet' },
    { id: 'coude_medial',  nom: 'Coude médial' },
    { id: 'coude_lateral', nom: 'Coude latéral' },
    { id: 'avant_bras',    nom: 'Avant-bras' },
    { id: 'epaule',        nom: 'Épaule' },
    { id: 'main_doigts',   nom: 'Main et doigts' },
    { id: 'biceps',        nom: 'Biceps' }
  ];

  /* ---------- le cote ----------

     Le bras de fer est asymetrique, et une epicondylite est d'UN cote. Sans
     cette information, « coude medial 4/10 » ne dit pas quel coude, et le
     recoupement 72 h croise la douleur d'un bras avec la charge de l'autre :
     il repond alors a cote de la question qu'on lui pose.

     `null` veut dire NON RENSEIGNE, et n'est jamais remplace par une valeur
     par defaut — meme principe que l'intensite d'une douleur. Un carnet
     ecrit avant se relit entier, avec des cotes inconnus plutot qu'inventes.

     « Les deux » n'est pas un troisieme cote : c'est une charge qui porte sur
     les deux, et elle compte des deux cotes. */
  var COTES = [
    { id: 'droit',  nom: 'Droit',     court: 'D' },
    { id: 'gauche', nom: 'Gauche',    court: 'G' },
    { id: 'deux',   nom: 'Les deux',  court: 'G+D' }
  ];
  var COTE_INCONNU = 'inconnu';

  function coteValide(id) {
    for (var i = 0; i < COTES.length; i++) if (COTES[i].id === id) return id;
    return null;
  }
  function nomCote(id) {
    for (var i = 0; i < COTES.length; i++) if (COTES[i].id === id) return COTES[i].nom;
    return 'Côté non renseigné';
  }
  function courtCote(id) {
    for (var i = 0; i < COTES.length; i++) if (COTES[i].id === id) return COTES[i].court;
    return '';
  }
  /* Quels cotes une charge portee « a droite », « a gauche » ou « des deux »
     sollicite reellement. Un cote inconnu ne couvre rien : on ne devine pas. */
  function cotesCouverts(cote) {
    if (cote === 'deux') return ['droit', 'gauche'];
    if (cote === 'droit' || cote === 'gauche') return [cote];
    return [];
  }

  /* ---------- la prise ----------

     Main ouverte ou doigts refermes : ce n'est pas un detail de style. Une
     prise fermee fait travailler les FLECHISSEURS DES DOIGTS, qui naissent
     eux aussi de l'epicondyle medial ; une prise ouverte pousse sans serrer.
     Le meme exercice, des deux facons, ne charge pas la meme chose.

     Comme le cote : `null` veut dire non renseigne, et ne devient jamais une
     valeur par defaut. */
  var PRISES = [
    { id: 'ouverte', nom: 'Ouverte', quoi: 'main ouverte, on pousse' },
    { id: 'fermee',  nom: 'Fermée',  quoi: 'doigts refermés, on serre' }
  ];

  function priseValide(id) {
    for (var i = 0; i < PRISES.length; i++) if (PRISES[i].id === id) return id;
    return null;
  }
  function nomPrise(id) {
    for (var i = 0; i < PRISES.length; i++) if (PRISES[i].id === id) return PRISES[i].nom;
    return 'Prise non renseignée';
  }

  /* ---------- les muscles ----------

     Les STRUCTURES disent ce qui encaisse (poignet, coude medial…) : c'est le
     vocabulaire de la douleur. Les MUSCLES disent ce qui tire. Les deux sont
     portes par l'exercice, et c'est leur croisement qui rend la carte lisible.

     `medial: true` marque les muscles de la MASSE FLEXO-PRONATRICE : rond
     pronateur, flechisseur radial du carpe, long palmaire, flechisseur
     superficiel des doigts et flechisseur ulnaire du carpe partagent UN SEUL
     tendon d'origine, sur l'epicondyle medial. Leur surmenage est exactement
     ce qu'on appelle epicondylite mediale. C'est ce qui relie la carte a la
     douleur, et ce n'est pas une opinion : c'est de l'anatomie.

     `lateral: true` fait la meme chose pour l'origine des extenseurs.

     Le carre pronateur (distal) et le brachio-radial (crete supracondylaire)
     ne portent AUCUNE des deux marques : les mettre avec les autres aurait
     ete plus simple a lire et faux. */
  var MUSCLES = [
    /* --- épaule et tronc --- */
    { id: 'grand_pectoral', nom: 'Grand pectoral', court: 'Pectoral', aussi: 'pectoral',
      groupe: 'tronc', quoi: 'ramène le bras vers soi', articulation: 'epaule' },
    { id: 'grand_dorsal', nom: 'Grand dorsal', court: 'Dorsal', aussi: 'dorsal',
      groupe: 'tronc', quoi: 'tire le bras vers l’arrière et le bas', articulation: 'epaule' },
    { id: 'deltoide', nom: 'Deltoïde', court: 'Deltoïde', groupe: 'tronc',
      quoi: 'élève le bras et tient l’épaule', articulation: 'epaule' },
    { id: 'coraco_brachial', nom: 'Coraco-brachial', court: 'Coraco-brach.', groupe: 'tronc',
      quoi: 'amène le bras vers l’avant et vers soi', articulation: 'epaule', profond: true },

    /* --- bras --- */
    { id: 'biceps', nom: 'Biceps brachial', court: 'Biceps', aussi: 'biceps',
      groupe: 'bras_av', quoi: 'fléchit le coude et supine', articulation: 'coude' },
    { id: 'brachial', nom: 'Brachial', court: 'Brachial', aussi: 'brachial antérieur',
      groupe: 'bras_av', quoi: 'fléchit le coude, quelle que soit la prise',
      articulation: 'coude', profond: true },
    { id: 'triceps', nom: 'Triceps brachial', court: 'Triceps', aussi: 'triceps',
      groupe: 'bras_ar', quoi: 'tend le coude', articulation: 'coude' },
    { id: 'ancone', nom: 'Anconé', court: 'Anconé', groupe: 'bras_ar',
      quoi: 'assiste l’extension et tient le coude', articulation: 'coude' },

    /* --- avant-bras, face antérieure : la masse flexo-pronatrice --- */
    { id: 'rond_pronateur', nom: 'Rond pronateur', court: 'Rond pronat.',
      groupe: 'avant_bras_av', quoi: 'tourne la paume vers le bas',
      articulation: 'avant_bras', medial: true },
    { id: 'fcr', nom: 'Fléchisseur radial du carpe', court: 'Fléch. radial',
      aussi: 'grand palmaire', groupe: 'avant_bras_av',
      quoi: 'plie le poignet, côté pouce', articulation: 'poignet', medial: true },
    { id: 'long_palmaire', nom: 'Long palmaire', court: 'Long palmaire',
      aussi: 'petit palmaire', groupe: 'avant_bras_av',
      quoi: 'plie faiblement le poignet — absent chez une personne sur six',
      articulation: 'poignet', medial: true },
    { id: 'fcu', nom: 'Fléchisseur ulnaire du carpe', court: 'Fléch. ulnaire',
      aussi: 'cubital antérieur', groupe: 'avant_bras_av',
      quoi: 'plie le poignet, côté auriculaire', articulation: 'poignet', medial: true },
    { id: 'flechisseurs_doigts', nom: 'Fléchisseurs des doigts', court: 'Fléch. doigts',
      groupe: 'main', quoi: 'serrent la main', articulation: 'doigts', medial: true },
    { id: 'carre_pronateur', nom: 'Carré pronateur', court: 'Carré pronat.',
      groupe: 'avant_bras_av', quoi: 'tourne l’avant-bras, près du poignet',
      articulation: 'avant_bras', profond: true },

    /* --- avant-bras, face postérieure --- */
    { id: 'brachio_radial', nom: 'Brachio-radial', court: 'Brachio-radial',
      aussi: 'long supinateur', groupe: 'avant_bras_ar',
      quoi: 'fléchit le coude, prise marteau', articulation: 'coude' },
    { id: 'ecrl', nom: 'Long extenseur radial du carpe', court: 'Long ext. radial',
      aussi: '1er radial', groupe: 'avant_bras_ar',
      quoi: 'relève le poignet, côté pouce', articulation: 'poignet', lateral: true },
    { id: 'ecrb', nom: 'Court extenseur radial du carpe', court: 'Court ext. radial',
      aussi: '2e radial', groupe: 'avant_bras_ar', quoi: 'relève le poignet',
      articulation: 'poignet', lateral: true },
    { id: 'ecu', nom: 'Extenseur ulnaire du carpe', court: 'Ext. ulnaire',
      aussi: 'cubital postérieur', groupe: 'avant_bras_ar',
      quoi: 'relève le poignet, côté auriculaire', articulation: 'poignet', lateral: true },
    { id: 'extenseurs_doigts', nom: 'Extenseurs des doigts', court: 'Ext. doigts',
      groupe: 'avant_bras_ar', quoi: 'ouvrent la main', articulation: 'doigts', lateral: true },
    { id: 'extenseur_petit_doigt', nom: 'Extenseur du petit doigt', court: 'Ext. auriculaire',
      groupe: 'avant_bras_ar', quoi: 'ouvre l’auriculaire', articulation: 'doigts', lateral: true },
    { id: 'extenseurs_pouce', nom: 'Extenseurs du pouce', court: 'Ext. pouce',
      groupe: 'avant_bras_ar', quoi: 'ouvrent et écartent le pouce', articulation: 'pouce' },
    { id: 'supinateur', nom: 'Supinateur', court: 'Supinateur', groupe: 'avant_bras_ar',
      quoi: 'tourne la paume vers le haut', articulation: 'avant_bras',
      lateral: true, profond: true }
  ];

  /* Ce que chaque muscle MOBILISE. C'est la question qu'on se pose vraiment
     devant un programme — « qu'est-ce que je fais travailler » — et à
     laquelle ni l'insertion ni la region ne repondent. */
  var ARTICULATIONS = [
    { id: 'epaule',     nom: 'Épaule' },
    { id: 'coude',      nom: 'Coude' },
    { id: 'avant_bras', nom: 'Rotation de l’avant-bras' },
    { id: 'poignet',    nom: 'Poignet' },
    { id: 'doigts',     nom: 'Doigts' },
    { id: 'pouce',      nom: 'Pouce' }
  ];

  function nomArticulation(id) {
    for (var i = 0; i < ARTICULATIONS.length; i++) if (ARTICULATIONS[i].id === id) return ARTICULATIONS[i].nom;
    return '';
  }


  /* Les regions du schema. Treize muscles sur un bras de 290 px seraient
     illisibles : le dessin montre SIX regions, et les chiffres exacts se
     lisent en barres en dessous. Le visuel sert le coup d'oeil, pas la
     precision — c'est la division du travail entre les deux. */
  var REGIONS_MUSCLE = [
    { id: 'tronc',          nom: 'Épaule et tronc' },
    { id: 'bras_av',        nom: 'Bras, avant' },
    { id: 'bras_ar',        nom: 'Bras, arrière' },
    { id: 'avant_bras_av',  nom: 'Avant-bras, face antérieure' },
    { id: 'avant_bras_ar',  nom: 'Avant-bras, face postérieure' },
    { id: 'main',           nom: 'Main et doigts' }
  ];

  /* Ce qu'un mouvement fait travailler — PROPOSÉ, jamais impose.

     `source` dit d'ou vient la proposition, et l'ecran l'affiche :
       'anatomie'   le mouvement EST une action articulaire, et les muscles
                    qui la produisent sont du manuel. Cupping = flexion du
                    poignet ; pronation et supination = rotation de l'avant-bras.
       'a_verifier' le mouvement est une DIRECTION DE POUSSEE, pas une action
                    articulaire. Ce qui suit vient d'une seule etude EMG sur
                    le bras de fer — grand pectoral donne comme le plus
                    important, FCU comme determinant pour prendre l'avantage —
                    et merite d'etre corrige par qui tire.

     Rien n'est ecrit sur l'exercice sans un geste : la proposition remplit
     les cases, l'utilisateur garde la main. */
  var MUSCLES_PAR_MOUVEMENT = {
    cupping:       { source: 'anatomie',   muscles: ['fcu', 'fcr', 'long_palmaire', 'flechisseurs_doigts'] },
    pronation:     { source: 'anatomie',   muscles: ['rond_pronateur', 'carre_pronateur'] },
    supination:    { source: 'anatomie',   muscles: ['supinateur', 'biceps'] },
    rising:        { source: 'a_verifier', muscles: ['biceps', 'brachial', 'brachio_radial', 'deltoide'] },
    back_pressure: { source: 'a_verifier', muscles: ['grand_dorsal', 'grand_pectoral', 'biceps'] },
    side_pressure: { source: 'a_verifier', muscles: ['grand_pectoral', 'deltoide', 'fcu'] }
  };

  /* Ce qu'un NOM d'exercice dit deja. « Curl biceps prise ouverte » contient
     le mot biceps : le proposer n'invente rien, ca relit ce qui a ete ecrit.
     C'est la troisieme source de proposition, apres les mouvements et la
     prise, et la seule qui ne demande AUCUNE case cochee.

     Les mots sont volontairement discriminants. « Poulie » ne dit rien d'un
     muscle, « curl » tout seul non plus — un curl marteau, un curl pronateur
     et un wrist curl ne travaillent pas la meme chose. On ne propose que sur
     un mot qui designe sans ambiguite. */
  var MOTS_MUSCLE = {
    biceps:              ['biceps'],
    triceps:             ['triceps', 'extension coude', 'dips'],
    brachial:            ['brachial'],   /* « brachio radial » ne le contient pas */
    /* « long supinateur » est le nom classique du BRACHIO-RADIAL, pas du
       supinateur : les confondre enverrait la charge au mauvais muscle. */
    brachio_radial:      ['brachio radial', 'brachioradial', 'long supinateur', 'marteau', 'hammer'],
    rond_pronateur:      ['pronation', 'pronateur', 'pronator', 'pronat'],
    carre_pronateur:     ['pronation', 'pronateur', 'pronator', 'pronat'],
    supinateur:          ['supination', 'supinateur', 'supinator', 'supinat'],
    fcu:                 ['cupping', 'cup', 'wrist curl', 'flexion poignet',
                          'flechisseur poignet', 'cubital anterieur'],
    fcr:                 ['cupping', 'cup', 'wrist curl', 'flexion poignet',
                          'flechisseur poignet', 'grand palmaire'],
    /* PAS « grip » tout court : « Titan Grip » et « Fat grip » sont des
       OUTILS, et le banc l'a attrape. Un mot qui apparait dans un nom de
       materiel ne designe pas un muscle. */
    flechisseurs_doigts: ['gripper', 'pince', 'serrage', 'doigts', 'pinch', 'serrer'],
    ecrl:                ['extension poignet', 'reverse curl', 'reverse wrist', '1er radial'],
    ecrb:                ['extension poignet', 'reverse curl', 'reverse wrist', '2e radial', '2eme radial'],
    ecu:                 ['cubital posterieur', 'extenseur ulnaire'],
    extenseurs_doigts:   ['extenseur doigts', 'extension doigts', 'ouverture main', 'extensor band'],
    extenseur_petit_doigt: ['petit doigt', 'auriculaire'],
    extenseurs_pouce:    ['pouce', 'thumb'],
    deltoide:            ['deltoide', 'epaule', 'elevation laterale', 'shoulder press'],
    coraco_brachial:     ['coraco'],
    ancone:              ['ancone'],
    long_palmaire:       ['petit palmaire', 'long palmaire'],
    grand_pectoral:      ['pectoral', 'pec', 'developpe', 'bench', 'press'],
    grand_dorsal:        ['dorsal', 'tirage', 'rowing', 'traction', 'pull up', 'lat']
  };

  function musclesDuNom(nom) {
    var s = slug(nom);
    if (!s) return [];
    var vus = {};
    Object.keys(MOTS_MUSCLE).forEach(function (id) {
      MOTS_MUSCLE[id].forEach(function (mot) {
        if (s.indexOf(slug(mot)) >= 0) vus[id] = 1;
      });
    });
    var l = [];
    MUSCLES.forEach(function (m) { if (vus[m.id]) l.push(m.id); });
    return l;
  }

  function muscle(id) {
    for (var i = 0; i < MUSCLES.length; i++) if (MUSCLES[i].id === id) return MUSCLES[i];
    return null;
  }
  /* Le nom court sert aux barres, où la place manque : « Court ext. radial »
     tient sur une ligne là où « Court extenseur radial du carpe » mangerait
     la piste. Le nom entier reste sur la fiche et au doigt sur le schéma. */
  function nomCourtMuscle(id) {
    var m = muscle(id);
    return m ? (m.court || m.nom) : '';
  }

  function nomMuscle(id) {
    var m = muscle(id);
    return m ? m.nom : id;
  }
  /* Remet une liste de muscles dans l'ordre du tableau, sans doublon ni
     inconnu — meme discipline que les colonnes. */
  /* Un identifiant d'avant : « extenseurs_poignet » designait les DEUX
     radiaux, qui ont maintenant chacun le leur. Converti a la lecture, comme
     tout le reste : un carnet deja renseigne ne perd rien. */
  var MUSCLES_RENOMMES = { extenseurs_poignet: ['ecrl', 'ecrb'] };

  function muscles(exo) {
    var bruts = (exo && exo.muscles) || [];
    var voulus = [];
    bruts.forEach(function (id) {
      var r = MUSCLES_RENOMMES[id];
      if (r) r.forEach(function (x) { voulus.push(x); });
      else voulus.push(id);
    });
    var l = [];
    MUSCLES.forEach(function (m) { if (voulus.indexOf(m.id) >= 0) l.push(m.id); });
    return l;
  }

  /* Ce que les mouvements d'un exercice proposent, et d'ou ca vient. */
  function musclesProposes(forces, prise, nom) {
    var vus = {}, l = [], sources = {};

    /* Le nom d'abord : c'est ce que l'utilisateur a ECRIT lui-meme, donc la
       source la moins contestable des trois. */
    musclesDuNom(nom).forEach(function (m) { vus[m] = 1; sources.nom = true; });
    /* Une prise fermee fait travailler les flechisseurs des doigts. C'est la
       definition de serrer, pas une interpretation. */
    if (priseValide(prise) === 'fermee') {
      vus.flechisseurs_doigts = 1;
      sources.anatomie = true;
    }
    (forces || []).forEach(function (f) {
      var p = MUSCLES_PAR_MOUVEMENT[f];
      if (!p) return;
      sources[p.source] = true;
      p.muscles.forEach(function (m) { if (!vus[m]) { vus[m] = 1; l.push(m); } });
    });
    var ordonne = [];
    MUSCLES.forEach(function (m) { if (vus[m.id]) ordonne.push(m.id); });
    var nb = (sources.nom ? 1 : 0) + (sources.anatomie ? 1 : 0) + (sources.a_verifier ? 1 : 0);
    var source = nb > 1 ? 'mixte'
               : (sources.nom ? 'nom'
               : (sources.anatomie ? 'anatomie'
               : (sources.a_verifier ? 'a_verifier' : null)));
    return { muscles: ordonne, source: source };
  }

  var ZONES = [
    { id: 'coude_medial',  nom: 'Coude médial' },
    { id: 'coude_lateral', nom: 'Coude latéral' },
    { id: 'poignet',       nom: 'Poignet' },
    { id: 'avant_bras',    nom: 'Avant-bras' },
    { id: 'epaule',        nom: 'Épaule' },
    { id: 'aucune',        nom: 'Aucune' }
  ];

  var STYLES = [
    { id: 'hook',    nom: 'Hook' },
    { id: 'toproll', nom: 'Toproll' },
    { id: 'mixte',   nom: 'Mixte' }
  ];

  var compteur = 0;
  function uid(p) {
    compteur += 1;
    return (p || 'i') + '_' + Date.now().toString(36) + '_' + compteur.toString(36)
         + Math.random().toString(36).slice(2, 6);
  }

  /* Identité d'un exercice : c'est le slug qui fait « c'est le même »,
     d'un programme à l'autre et d'une séance à l'autre. */
  function slug(nom) {
    return String(nom == null ? '' : nom)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  /* "17,5" -> 17.5 ; "N3", "", "rouge" -> null. Jamais 0 par défaut. */
  function nombre(txt) {
    if (txt == null) return null;
    var s = String(txt).trim().replace(',', '.');
    if (s === '') return null;
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  /* Une duree de serie, en secondes. Deux ecritures, parce que les deux se
     tapent naturellement : "45" pour trois quarts de minute, "1:30" quand la
     tenue depasse la minute et qu'on la compte en minutes. Tout le reste rend
     null, comme nombre() : une tenue non chiffree n'est pas zero seconde.

     "90" reste 90 secondes et non 1 min 30 : ce qui est tape est ce qui est lu. */
  function secondes(txt) {
    if (txt == null) return null;
    var s = String(txt).trim().replace(',', '.');
    if (s === '') return null;
    var m = s.match(/^(\d+):([0-5]\d)$/);
    if (m) return (+m[1]) * 60 + (+m[2]);
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    var n = parseFloat(s);
    return isFinite(n) && n >= 0 ? n : null;
  }

  /* Au-dela de la minute, les secondes seules ne se lisent plus d'un coup
     d'oeil : 1 850 s ne dit rien, 30:50 se compare. */
  function texteDuree(sec) {
    if (sec == null) return '';
    var s = Math.round(sec);
    if (s < 60) return s + ' s';
    var mn = Math.floor(s / 60), r = s % 60;
    return mn + ':' + (r < 10 ? '0' : '') + r;
  }

  function fmt(n, dec) {
    if (n == null) return '—';
    var x = Math.round(n * (dec ? 10 : 1)) / (dec ? 10 : 1);
    var p = String(x).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return p.join(',');
  }

  function typeCharge(id) {
    for (var i = 0; i < TYPES_CHARGE.length; i++) if (TYPES_CHARGE[i].id === id) return TYPES_CHARGE[i];
    return TYPES_CHARGE[0];
  }
  function nomZone(id) {
    for (var i = 0; i < ZONES.length; i++) if (ZONES[i].id === id) return ZONES[i].nom;
    return id;
  }
  function nomStructure(id) {
    for (var i = 0; i < STRUCTURES.length; i++) if (STRUCTURES[i].id === id) return STRUCTURES[i].nom;
    return id;
  }

  /* ---------- douleurs : zone ET intensite ----------
     Une tendinopathie ne se suit pas en oui/non : ce qui compte est si elle
     monte ou descend. On stocke donc { zone, intensite 0-10 | null }.

     Les carnets d'avant stockaient une simple chaine. normaliserDouleurs()
     accepte les deux formes : une sauvegarde ancienne se relit sans perte,
     avec une intensite inconnue (null) plutot qu'inventee. */

  function normaliserDouleurs(liste) {
    if (!Array.isArray(liste)) return [];
    var sortie = [];
    liste.forEach(function (d) {
      if (typeof d === 'string') { sortie.push({ zone: d, intensite: null, cote: null }); return; }
      if (d && typeof d === 'object' && typeof d.zone === 'string') {
        var i = d.intensite;
        i = (typeof i === 'number' && isFinite(i)) ? Math.min(10, Math.max(0, Math.round(i))) : null;
        /* « Aucune » ne porte ni intensite ni cote : il n'y a pas de douleur
           a situer. */
        var c = d.zone === 'aucune' ? null : coteValide(d.cote);
        sortie.push({ zone: d.zone, intensite: i, cote: c });
      }
    });
    return sortie;
  }

  function zonesDe(douleurs) {
    return normaliserDouleurs(douleurs).map(function (d) { return d.zone; });
  }

  /* Les zones reellement douloureuses : « aucune » est une reponse, pas une zone. */
  function zonesVives(douleurs) {
    return normaliserDouleurs(douleurs).filter(function (d) { return d.zone !== 'aucune'; });
  }

  function intensiteDe(douleurs, zone) {
    var l = normaliserDouleurs(douleurs);
    for (var i = 0; i < l.length; i++) if (l[i].zone === zone) return l[i].intensite;
    return null;
  }

  function texteDouleur(d) {
    return nomZone(d.zone)
         + (d.cote ? ' ' + courtCote(d.cote) : '')
         + (d.intensite == null ? '' : ' ' + d.intensite + '/10');
  }
  function nomForce(id) {
    for (var i = 0; i < FORCES.length; i++) if (FORCES[i].id === id) return FORCES[i].nom;
    return id;
  }
  function nomStyle(id) {
    for (var i = 0; i < STYLES.length; i++) if (STYLES[i].id === id) return STYLES[i].nom;
    return '';
  }

  /* ---------- dates ---------- */

  function aujourdHui() {
    var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }
  function dateObjet(iso) {
    var p = String(iso || '').split('-');
    return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
  }
  function jourSemaine(iso) {
    return ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][dateObjet(iso).getDay()];
  }
  function dateCourte(iso) {
    var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    var d = dateObjet(iso);
    return d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function joursEntre(isoA, isoB) {
    var a = dateObjet(isoA).getTime(), b = dateObjet(isoB).getTime();
    return Math.round((b - a) / 86400000);
  }
  function joursDepuis(iso) { return joursEntre(iso, aujourdHui()); }

  /* Horodatage d'usage des catalogues, a la milliseconde.

     Il valait la DATE seule, et c'etait un defaut : tous les outils ajoutes le
     meme jour se valaient, le tri stable gardait alors l'ordre d'insertion, et
     le dernier ajoute — celui qu'on vient de taper — tombait hors des huit
     suggestions affichees. Avec neuf outils en catalogue, un outil neuf
     n'apparaissait donc JAMAIS a l'ouverture de la liste.

     Une date ancienne ('2026-10-21') reste comparable : elle se classe avant
     tout horodatage du meme jour, ce qui est exactement ce qu'on veut.

     Il est STRICTEMENT croissant, et pas seulement lu a l'horloge : huit outils
     poses d'un meme geste — le raccourci « Ajouter mon matériel » — tombent
     dans la meme milliseconde, et seraient de nouveau a egalite. Le banc l'a
     fait tomber avant qu'on le croie. Le decalage introduit se compte en
     millisecondes, et `vuLe` ne sert qu'a classer. */
  var dernierVu = '';

  function maintenant() {
    var t = new Date().toISOString();
    if (t <= dernierVu) t = new Date(new Date(dernierVu).getTime() + 1).toISOString();
    dernierVu = t;
    return t;
  }

  /* ---------- catalogue implicite ---------- */

  function trouverCatalogue(etat, s) {
    for (var i = 0; i < etat.exercices.length; i++) if (etat.exercices[i].slug === s) return etat.exercices[i];
    return null;
  }

  /* Un nom employé entre au catalogue, ou s'y met à jour. Rien n'est pré-rempli. */
  function majCatalogue(etat, exo) {
    var s = slug(exo.nom);
    if (!s) return null;
    var e = trouverCatalogue(etat, s);
    if (!e) {
      e = { id: uid('ex'), nom: exo.nom, slug: s, aw: !!exo.aw,
            typeCharge: exo.typeCharge || 'kg', colonnes: colonnes(exo),
            cote: coteValide(exo.cote), prise: priseValide(exo.prise),
            muscles: muscles(exo),
            forces: (exo.forces || []).slice(),
            structures: (exo.structures || []).slice(),
            outils: (exo.outils || []).slice(), vuLe: maintenant() };
      etat.exercices.push(e);
    } else {
      e.nom = exo.nom;
      e.aw = !!exo.aw;
      if (exo.typeCharge) e.typeCharge = exo.typeCharge;
      if (exo.colonnes) e.colonnes = colonnes(exo);
      /* Le cote se met a jour, et peut aussi etre EFFACE : repasser un exercice
         a « non renseigne » doit pouvoir se faire. */
      e.cote = coteValide(exo.cote);
      if (exo.muscles) e.muscles = muscles(exo);
      e.prise = priseValide(exo.prise);
      if (exo.forces) e.forces = exo.forces.slice();
      if (exo.structures) e.structures = exo.structures.slice();
      if (exo.outils) e.outils = exo.outils.slice();
      e.vuLe = maintenant();
    }
    (exo.outils || []).forEach(function (o) { majCatalogueOutils(etat, o); });
    return e;
  }

  /* ---------- catalogue d'outils, implicite lui aussi ----------
     Dumbbell, poulie haute, Titan Grip… : rien n'est livré avec l'app,
     la liste se construit avec ce que je saisis. Un exercice peut en porter
     plusieurs — « Titan Grip sur poulie haute » en est le cas courant. */

  function trouverOutil(etat, s) {
    for (var i = 0; i < etat.outils.length; i++) if (etat.outils[i].slug === s) return etat.outils[i];
    return null;
  }

  function majCatalogueOutils(etat, nom, categorie) {
    var s = slug(nom);
    if (!s) return null;
    var o = trouverOutil(etat, s);
    if (!o) {
      o = { id: uid('ou'), nom: String(nom).trim(), slug: s,
            categorie: (categorie || '').trim(), vuLe: maintenant() };
      etat.outils.push(o);
    } else {
      o.nom = String(nom).trim();
      /* Une catégorie vide ne doit pas effacer celle qui est déjà posée :
         l'outil saisi depuis un exercice n'en porte pas. */
      if (categorie != null && String(categorie).trim()) o.categorie = String(categorie).trim();
      o.vuLe = maintenant();
    }
    return o;
  }

  var SANS_CATEGORIE = 'Sans catégorie';

  /* Catégories réellement employées, jamais une liste imposée. */
  function categoriesOutils(etat) {
    var vues = {}, l = [];
    etat.outils.forEach(function (o) {
      var c = (o.categorie || '').trim();
      if (!c) return;
      var k = slug(c);
      if (!vues[k]) { vues[k] = 1; l.push(c); }
    });
    return l.sort(function (a, b) { return a.localeCompare(b); });
  }

  function outilsParCategorie(etat) {
    var groupes = {}, ordre = [];
    etat.outils.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); }).forEach(function (o) {
      var c = (o.categorie || '').trim() || SANS_CATEGORIE;
      if (!groupes[c]) { groupes[c] = []; ordre.push(c); }
      groupes[c].push(o);
    });
    ordre.sort(function (a, b) {
      if (a === SANS_CATEGORIE) return 1;      // le fourre-tout reste en bas
      if (b === SANS_CATEGORIE) return -1;
      return a.localeCompare(b);
    });
    return ordre.map(function (c) { return { categorie: c, outils: groupes[c] }; });
  }

  /* Classement par recence, avec un departage qui compte.

     `vuLe` horodate suffit pour ce qui est ecrit depuis, mais PAS pour un
     carnet d'avant : ses entrees portent une date seule, celles d'un meme jour
     sont a egalite, et le tri stable garde alors l'ordre d'INSERTION — soit
     exactement l'inverse de ce qu'on veut. Un carnet nourri en une journee
     n'affichait donc que ses huit premiers outils, et jamais les suivants.
     Le symptome a ete constate sur un vrai telephone apres coup : corriger
     l'ecriture ne corrige pas ce qui est deja ecrit.

     A egalite, le dernier POSE passe donc devant. C'est vrai des deux cotes :
     pour un carnet ancien c'est la seule information d'ordre disponible, et
     pour un carnet recent le cas ne se presente pas, les horodatages etant
     strictement croissants. */
  function parRecence(liste) {
    return liste
      .map(function (x, i) { return { x: x, i: i }; })
      .sort(function (a, b) {
        var d = (b.x.vuLe || '').localeCompare(a.x.vuLe || '');
        return d !== 0 ? d : b.i - a.i;
      })
      .map(function (p) { return p.x; });
  }

  /* La liste est TRONQUEE a `limite` : le classement decide donc ce qui est
     visible, pas seulement ce qui vient en premier. */
  function suggestionsOutils(etat, saisie, dejaPris, limite) {
    var q = slug(saisie);
    var pris = (dejaPris || []).map(slug);
    var l = parRecence(etat.outils.filter(function (o) { return pris.indexOf(o.slug) < 0; }));
    if (!q) return l.slice(0, limite || 8);
    var debut = [], dedans = [];
    for (var i = 0; i < l.length; i++) {
      var p = l[i].slug.indexOf(q);
      if (p === 0) debut.push(l[i]);
      else if (p > 0) dedans.push(l[i]);
    }
    return debut.concat(dedans).slice(0, limite || 8);
  }

  /* Suggestions pour l'autocomplétion : ce que j'ai déjà employé, rien d'autre.
     Classement : commence par la saisie d'abord, puis le plus récemment vu. */
  function suggestions(etat, saisie, limite) {
    var q = slug(saisie);
    var l = parRecence(etat.exercices);
    if (!q) return l.slice(0, limite || 8);
    var debut = [], dedans = [];
    for (var i = 0; i < l.length; i++) {
      var p = l[i].slug.indexOf(q);
      if (p === 0) debut.push(l[i]);
      else if (p > 0) dedans.push(l[i]);
    }
    return debut.concat(dedans).slice(0, limite || 8);
  }

  /* ---------- migration, À LA LECTURE ----------

     Même principe que normaliserDouleurs() : une sauvegarde ancienne se relit
     intégralement, et rien n'est réécrit sur le disque tant que l'app n'écrit
     pas d'elle-même. Deux conversions.

     1. `typeCharge: 'duree'` détournait la colonne REPS en secondes. L'exercice
        devient « charge en kilos, colonnes charge + durée », et ses secondes
        passent de repsReel à dureeReel, là où elles auraient toujours dû être.
        AUCUN chiffre du passé ne bouge : sans colonne reps, il n'y a rien à
        multiplier, donc pas de tonnage — exactement comme avant, où le type
        'duree' portait tonnage: false.

     2. Le type de série « échauffement » n'existe plus. Les séries qui le
        portaient deviennent normales. Là non plus rien ne bouge : un
        échauffement comptait déjà dans le tonnage comme une série de travail.
        Seule la colonne PRÉCÉDENT se décale, et dans le bon sens : elle
        indexait par rang DANS LE TYPE, et ces séries rejoignent le rang des
        normales, qui est celui qu'on compare. */
  function migrer(etat) {
    function unExercice(ex) {
      if (!ex || typeof ex !== 'object') return;

      if (ex.typeCharge === 'duree') {
        ex.typeCharge = 'kg';
        ex.colonnes = ['charge', 'duree'];
        (ex.series || []).forEach(function (s) {
          if (!s) return;
          if (!s.dureeReel && s.repsReel) { s.dureeReel = s.repsReel; s.repsReel = ''; }
          if (!s.dureeCible && s.repsCible) { s.dureeCible = s.repsCible; s.repsCible = ''; }
        });
      }
      ex.colonnes = colonnes(ex);
      /* Le cote n'est pas invente : absent, il reste null. */
      ex.cote = coteValide(ex.cote);
      ex.muscles = muscles(ex);
      ex.prise = priseValide(ex.prise);

      (ex.series || []).forEach(function (s) {
        if (!s) return;
        if (s.dureeReel == null) s.dureeReel = '';
        if (s.dureeCible == null) s.dureeCible = '';
        if (s.type === 'echauffement') s.type = 'normale';
        if (!TYPES_SERIE[s.type]) s.type = 'normale';
      });
    }

    (etat.exercices || []).forEach(unExercice);
    (etat.programmes || []).forEach(function (p) { (p.exercices || []).forEach(unExercice); });
    if (etat.routineRecup) (etat.routineRecup.exercices || []).forEach(unExercice);
    (etat.seances || []).forEach(function (s) {
      if (s && (s.type === 'muscu' || s.type === 'recup')) (s.exercices || []).forEach(unExercice);
    });
    return etat;
  }

  /* ---------- fabriques ---------- */

  function serieProgramme(modele) {
    modele = modele || {};
    return { id: uid('sp'), type: modele.type || 'normale',
             repsCible: modele.repsCible || '', chargeCible: modele.chargeCible || '',
             dureeCible: modele.dureeCible || '' };
  }

  function exerciceProgramme(modele) {
    modele = modele || {};
    return {
      id: uid('ep'), ordre: 0,
      nom: modele.nom || '', slug: slug(modele.nom || ''),
      aw: !!modele.aw, typeCharge: modele.typeCharge || 'kg',
      colonnes: colonnes(modele), cote: coteValide(modele.cote),
      prise: priseValide(modele.prise), muscles: muscles(modele),
      forces: (modele.forces || []).slice(),
      structures: (modele.structures || []).slice(),
      outils: (modele.outils || []).slice(),
      consigne: modele.consigne || '',
      reposSecondes: modele.reposSecondes == null ? 120 : modele.reposSecondes,
      series: (modele.series || []).map(serieProgramme)
    };
  }

  function programme(nom) {
    return { id: uid('pr'), nom: nom || '', description: '', archive: false,
             creeLe: aujourdHui(), exercices: [] };
  }

  function renumeroter(liste) {
    for (var i = 0; i < liste.length; i++) liste[i].ordre = i;
    return liste;
  }

  /* La séance est une COPIE. Aucune référence vivante vers le programme. */
  function serieDepuisProgramme(sp) {
    return { id: uid('ss'), type: sp.type,
             repsCible: sp.repsCible || '', chargeCible: sp.chargeCible || '',
             dureeCible: sp.dureeCible || '',
             repsReel: '', chargeReel: '', dureeReel: '',
             rpe: null, faite: false, faiteA: null };
  }

  function exerciceSeanceDepuisProgramme(ep) {
    return {
      id: uid('es'), ordre: ep.ordre,
      nom: ep.nom, slug: ep.slug || slug(ep.nom),
      aw: !!ep.aw, typeCharge: ep.typeCharge || 'kg',
      colonnes: colonnes(ep), cote: coteValide(ep.cote),
      prise: priseValide(ep.prise), muscles: muscles(ep),
      forces: (ep.forces || []).slice(),
      structures: (ep.structures || []).slice(),
      outils: (ep.outils || []).slice(),
      consigne: ep.consigne || '',
      reposSecondes: ep.reposSecondes == null ? 120 : ep.reposSecondes,
      series: (ep.series || []).map(serieDepuisProgramme)
    };
  }

  function serieSeanceVierge(modele) {
    modele = modele || {};
    return { id: uid('ss'), type: modele.type || 'normale',
             repsCible: modele.repsCible || '', chargeCible: modele.chargeCible || '',
             dureeCible: modele.dureeCible || '',
             repsReel: '', chargeReel: '', dureeReel: '',
             rpe: null, faite: false, faiteA: null };
  }

  function exerciceSeanceVierge(modele) {
    modele = modele || {};
    return {
      id: uid('es'), ordre: 0,
      nom: modele.nom || '', slug: slug(modele.nom || ''),
      aw: !!modele.aw, typeCharge: modele.typeCharge || 'kg',
      colonnes: colonnes(modele), cote: coteValide(modele.cote),
      prise: priseValide(modele.prise), muscles: muscles(modele),
      forces: (modele.forces || []).slice(),
      structures: (modele.structures || []).slice(),
      outils: (modele.outils || []).slice(),
      consigne: modele.consigne || '',
      reposSecondes: modele.reposSecondes == null ? 120 : modele.reposSecondes,
      series: (modele.series && modele.series.length ? modele.series.map(serieSeanceVierge)
                                                     : [serieSeanceVierge()])
    };
  }

  function seanceMuscu(prog) {
    var s = {
      id: uid('se'), type: 'muscu', date: aujourdHui(), heure: new Date().toISOString(),
      programmeId: prog ? prog.id : null, programmeNom: prog ? prog.nom : null,
      dureeMin: null, rpeGlobal: null, note: '', douleurs: [], exercices: []
    };
    if (prog) s.exercices = renumeroter(prog.exercices.map(exerciceSeanceDepuisProgramme));
    return s;
  }

  /* ---------- récupération ----------

     L'élastique quotidien, faible résistance, beaucoup de répétitions. Ce
     n'est pas une séance de travail et ça n'a rien à faire dans le tonnage :
     cent répétitions à l'élastique noieraient le compte de séries d'une
     semaine. C'est une ROUTINE — définie une fois — qu'on coche jour après
     jour, et ce qu'on veut en lire est la régularité, pas la charge.

     Elle réutilise la forme d'un programme, et sa journée celle d'une séance :
     ce sont les mêmes exercices, les mêmes colonnes, la même ligne de saisie.
     Seul `type: 'recup'` la distingue — ce qui suffit au journal pour la ranger
     et à seancesMuscuTriees() pour l'ignorer, donc au tonnage pour ne pas la
     voir. */

  function routineRecupVierge() {
    var p = programme('Ma routine de récupération');
    p.description = 'Élastique, faible résistance, beaucoup de répétitions. '
                  + 'À cocher chaque jour.';
    return p;
  }

  function seanceRecup(routine) {
    var s = { id: uid('re'), type: 'recup', date: aujourdHui(),
              heure: new Date().toISOString(), note: '', douleurs: [], exercices: [] };
    if (routine) {
      s.exercices = renumeroter((routine.exercices || []).map(exerciceSeanceDepuisProgramme));
    }
    return s;
  }

  function seancesRecupTriees(etat) {
    return (etat.seances || []).filter(function (s) { return s && s.type === 'recup'; })
      .sort(function (a, b) {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return String(b.heure || '').localeCompare(String(a.heure || ''));
      });
  }

  function recupDuJour(etat, date) {
    date = date || aujourdHui();
    var l = etat.seances || [];
    for (var i = 0; i < l.length; i++) {
      if (l[i] && l[i].type === 'recup' && l[i].date === date) return l[i];
    }
    return null;
  }

  /* Un jour compte comme FAIT des qu'une ligne est validee : une routine a
     moitie faite reste une journee ou l'on s'y est mis, et c'est ce qui
     entretient l'habitude. Le detail (3 sur 5) est rendu a part, pour que
     l'ecran puisse le dire sans avoir a recompter. */
  function recupFaite(se) {
    if (!se) return false;
    return (se.exercices || []).some(function (ex) {
      return (ex.series || []).some(function (s) { return s.faite; });
    });
  }

  function compteRecup(se) {
    var total = 0, faits = 0;
    (se && se.exercices || []).forEach(function (ex) {
      total += 1;
      if ((ex.series || []).some(function (s) { return s.faite; })) faits += 1;
    });
    return { faits: faits, total: total };
  }

  /* Combien de jours faits sur les N derniers, et depuis combien de jours
     d'affilee. La serie en cours ne se casse PAS parce qu'aujourd'hui n'est
     pas encore coche : on la compte depuis hier tant que la journee n'est pas
     finie — sinon elle afficherait zero chaque matin. */
  function statsRecup(etat, jours) {
    jours = jours || 7;
    var faits = {};
    seancesRecupTriees(etat).forEach(function (se) {
      if (recupFaite(se)) faits[se.date] = true;
    });

    function jourDecale(n) {
      var d = new Date();
      d.setDate(d.getDate() - n);
      var z = function (x) { return (x < 10 ? '0' : '') + x; };
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
    }

    var dans = 0;
    for (var i = 0; i < jours; i++) if (faits[jourDecale(i)]) dans += 1;

    var depart = faits[jourDecale(0)] ? 0 : 1;
    var serie = 0;
    for (var j = depart; j < 400; j++) {
      if (!faits[jourDecale(j)]) break;
      serie += 1;
    }

    return { fenetre: jours, joursFaits: dans, serie: serie,
             aujourdHuiFait: !!faits[jourDecale(0)] };
  }

  /* La regularite dit si le geste tient ; elle ne dit PAS s'il progresse. Une
     reeducation qui ne monte jamais en charge ne soigne rien, et c'est le
     reproche le plus courant qu'on puisse faire a un carnet d'habitudes.

     On compte en REPS et en SECONDES, pas en kilos : l'elastique n'a pas de
     charge chiffree, et c'est tres bien ainsi. */
  function volumeRecupParSemaine(etat, nbSemaines) {
    var par = {}, ordre = [];
    seancesRecupTriees(etat).forEach(function (se) {
      if (!recupFaite(se)) return;
      var sem = semaineDe(se.date);
      if (!par[sem]) {
        par[sem] = { semaine: sem, reps: 0, tempsSousTension: 0, series: 0, jours: 0 };
        ordre.push(sem);
      }
      par[sem].jours += 1;
      (se.exercices || []).forEach(function (ex) {
        var aR = aColonne(ex, 'reps'), aD = aColonne(ex, 'duree');
        (ex.series || []).forEach(function (s) {
          if (!s.faite) return;
          par[sem].series += 1;
          var rp = aR ? nombre(s.repsReel) : null;
          var dr = aD ? secondes(s.dureeReel) : null;
          if (rp != null) par[sem].reps += rp;
          if (dr != null) par[sem].tempsSousTension += dr;
        });
      });
    });
    return ordre.sort().slice(-(nbSemaines || 8))
      .map(function (s) { return par[s]; }).reverse();
  }

  function seanceSparring() {
    return { id: uid('sp'), type: 'sparring', date: aujourdHui(), heure: new Date().toISOString(),
             club: '', dureeMin: null, rounds: null, style: '', cote: null, partenaires: '',
             technique: '', ressenti: '', note: '', douleurs: [] };
  }

  /* Séance passée -> programme. Les valeurs RÉELLES deviennent les cibles ;
     à défaut (série jamais faite), on reprend la cible d'origine. */
  function programmeDepuisSeance(seance, nom) {
    var p = programme(nom || ((seance.programmeNom || 'Séance') + ' — ' + dateCourte(seance.date)));
    p.description = 'Créé depuis la séance du ' + dateCourte(seance.date) + '.';
    p.exercices = renumeroter((seance.exercices || []).map(function (es) {
      return exerciceProgramme({
        nom: es.nom, aw: es.aw, typeCharge: es.typeCharge, colonnes: colonnes(es),
        cote: es.cote, prise: es.prise, muscles: muscles(es),
        forces: es.forces, structures: es.structures, outils: es.outils,
        consigne: es.consigne, reposSecondes: es.reposSecondes,
        series: (es.series || []).map(function (ss) {
          return { type: ss.type,
                   repsCible: (ss.repsReel || '').trim() || ss.repsCible || '',
                   chargeCible: (ss.chargeReel || '').trim() || ss.chargeCible || '',
                   dureeCible: (ss.dureeReel || '').trim() || ss.dureeCible || '' };
        })
      });
    }));
    return p;
  }

  function dupliquerProgramme(p, nom) {
    var c = programme(nom || (p.nom + ' (copie)'));
    c.description = p.description;
    c.exercices = renumeroter(p.exercices.map(function (ep) { return exerciceProgramme(ep); }));
    return c;
  }

  /* ---------- volume ---------- */

  /* Le volume compte ce qui a été FAIT, jamais ce qui était prévu : une séance
     ouverte et pas encore commencée affiche 0, pas le tonnage du programme.
     Une série compte dès qu'elle porte une valeur saisie ou le ✓ (qui fige la
     cible en valeur réelle). On ne lit que les champs réels — une cible seule
     ne pèse rien.

     Une série non chiffrée (N3, élastique, poids du corps) n'est pas du zéro :
     elle est comptée à part et l'écran le dit. */
  /* Duree reelle d'une seance, deduite des horodatages de validation.
     C'est l'emploi de faiteA, qui etait ecrit sans jamais etre lu.
     Rend null tant qu'il n'y a pas DEUX series validees : une seule ne borne
     aucun intervalle, et un zero serait un mensonge. */
  function dureeReelle(seance) {
    var t = [];
    (seance.exercices || []).forEach(function (ex) {
      (ex.series || []).forEach(function (s) {
        if (s.faite && s.faiteA) {
          var d = Date.parse(s.faiteA);
          if (isFinite(d)) t.push(d);
        }
      });
    });
    if (t.length < 2) return null;
    t.sort(function (a, b) { return a - b; });
    return Math.max(1, Math.round((t[t.length - 1] - t[0]) / 60000));
  }

  function volumeSeance(seance) {
    var r = { series: 0, seriesFaites: 0, tonnage: 0, tonnageAw: 0, tonnageGeneral: 0,
              seriesNonChiffrees: 0, seriesIncompletes: 0, seriesSansTonnage: 0,
              seriesAw: 0, repsTotal: 0,
              tempsSousTension: 0, tempsSousTensionAw: 0, seriesDuree: 0 };
    (seance.exercices || []).forEach(function (ex) {
      var tc = typeCharge(ex.typeCharge);
      /* On ne lit QUE les colonnes affichees : une valeur restee dans un champ
         qu'on a ensuite masque ne doit pas continuer a compter en silence. */
      var aCharge = aColonne(ex, 'charge'),
          aReps   = aColonne(ex, 'reps'),
          aDuree  = aColonne(ex, 'duree');
      (ex.series || []).forEach(function (s) {
        r.series += 1;
        if (ex.aw) r.seriesAw += 1;
        if (s.faite) r.seriesFaites += 1;

        var cTxt = aCharge ? (s.chargeReel || '').trim() : '';
        var rTxt = aReps   ? (s.repsReel   || '').trim() : '';
        var dTxt = aDuree  ? (s.dureeReel  || '').trim() : '';
        if (!s.faite && !cTxt && !rTxt && !dTxt) return;   // rien de fait, rien à compter

        var ch = nombre(cTxt), rp = nombre(rTxt), dr = secondes(dTxt);
        if (rp != null) r.repsTotal += rp;

        /* Le temps sous tension se compte toujours, quel que soit le tonnage :
           c'est l'autre façon de charger un tendon, et la seule que mesure un
           isométrique. */
        if (dr != null) {
          r.tempsSousTension += dr;
          if (ex.aw) r.tempsSousTensionAw += dr;
          r.seriesDuree += 1;
        }

        if (tc.tonnage && aCharge && aReps && ch != null && rp != null) {
          var t = ch * rp;
          r.tonnage += t;
          if (ex.aw) r.tonnageAw += t; else r.tonnageGeneral += t;
        } else if (!aCharge || !aReps) {
          /* Le tonnage est charge × reps : sans les deux colonnes, il n'y a
             rien à multiplier, et ce n'est PAS une saisie manquante. Une série
             qui porte une durée est déjà comptée en temps sous tension — la
             signaler ici serait du bruit sur chaque isométrique. */
          if (dr == null) r.seriesSansTonnage += 1;
        } else if (!tc.tonnage || (cTxt && ch == null)) {
          /* N3, une bande rouge, le poids du corps : la charge N'EST PAS un
             nombre, et ce n'est pas un défaut de saisie. */
          r.seriesNonChiffrees += 1;
        } else {
          /* Type chiffré, deux colonnes affichées, mais une valeur manque. */
          r.seriesIncompletes += 1;
        }
      });
    });
    return r;
  }

  /* Dire ce qui n'est PAS dans le tonnage, et pourquoi. Un zéro muet ferait
     croire à une séance vide ; c'est le piège qu'on refuse ici. */
  function texteHorsTonnage(v) {
    var bouts = [];
    if (v.seriesNonChiffrees) {
      bouts.push(v.seriesNonChiffrees + (v.seriesNonChiffrees > 1 ? ' séries' : ' série')
        + ' à charge non chiffrée (gripper, élastique, poids du corps) — '
        + (v.seriesNonChiffrees > 1 ? 'comptées' : 'comptée') + ' en séries, pas en kilos.');
    }
    if (v.seriesIncompletes) {
      bouts.push(v.seriesIncompletes + (v.seriesIncompletes > 1 ? ' séries incomplètes' : ' série incomplète')
        + ' : il manque la charge ou les reps.');
    }
    if (v.seriesSansTonnage) {
      bouts.push(v.seriesSansTonnage + (v.seriesSansTonnage > 1 ? ' séries' : ' série')
        + ' sur un exercice sans charge ni reps — rien à multiplier, et rien de saisi non plus.');
    }
    return bouts.join(' ');
  }

  /* Ce qu'une serie DIT, en une ligne. Le journal et l'historique le
     demandaient chacun de leur cote, et chacun supposait deux colonnes :
     « 20 × 45 » pour un gainage de 45 secondes, ou « 45 × — » une fois les
     secondes deplacees. On ne montre que les colonnes AFFICHEES par
     l'exercice, et rien d'autre.

     `court` sert aux listes serrees du journal, ou chaque serie n'a que
     quelques caracteres ; la forme longue porte l'unite. */
  function texteSerie(exo, s, court) {
    if (!s) return '';
    var cols = colonnes(exo), tc = typeCharge(exo && exo.typeCharge);
    var vide = '—';
    var aC = cols.indexOf('charge') >= 0, aR = cols.indexOf('reps') >= 0,
        aD = cols.indexOf('duree') >= 0;
    var ch = aC ? (s.chargeReel || '').trim() : '',
        rp = aR ? (s.repsReel || '').trim() : '',
        dr = aD ? (s.dureeReel || '').trim() : '';
    var bouts = [];

    if (aC && aR) {
      bouts.push((ch || vide) + (court ? '×' : ' × ') + (rp || vide)
               + (!court && ch && tc.id === 'kg' ? ' kg' : ''));
    } else if (aC) {
      bouts.push((ch || vide) + (!court && ch && tc.unite ? ' ' + tc.unite : ''));
    } else if (aR) {
      bouts.push((rp || vide) + (court ? '' : ' reps'));
    }
    if (aD) bouts.push(dr ? (texteDuree(secondes(dr)) || dr) : vide);

    return bouts.join(court ? ' ' : ' · ');
  }

  /* Le temps sous tension, dit comme le tonnage : un chiffre, et ce qu'il
     recouvre. Rend '' quand il n'y a rien — jamais « 0 s », qui ferait croire
     a une seance ou l'on n'a rien tenu alors qu'on n'a simplement rien chronometre. */
  function texteTempsSousTension(v) {
    if (!v.tempsSousTension) return '';
    return texteDuree(v.tempsSousTension) + ' sous tension'
         + (v.seriesDuree ? ' · ' + v.seriesDuree + (v.seriesDuree > 1 ? ' séries' : ' série') : '');
  }

  /* ---------- colonne PRÉCÉDENT ---------- */

  function seancesMuscuTriees(etat) {
    return etat.seances.filter(function (s) { return s.type === 'muscu'; })
      .sort(function (a, b) {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return String(b.heure || '').localeCompare(String(a.heure || ''));
      });
  }

  /* Rang d'une serie PARMI CELLES DE SON TYPE : la 2e serie de travail reste la
     2e serie de travail, qu'il y ait eu zero ou trois degressives avant elle.

     C'est la correction d'un defaut mesure : l'indexation par rang brut faisait
     glisser TOUTE la colonne d'un cran des qu'une serie d'un autre type etait
     inseree, et
     affichait des valeurs fausses mais plausibles — donc suivies. */
  function rangParType(series, index) {
    var s = series[index];
    if (!s) return -1;
    var n = 0;
    for (var i = 0; i < index; i++) if (series[i].type === s.type) n += 1;
    return n;
  }

  function serieAuRangParType(series, type, rang) {
    var n = 0;
    for (var i = 0; i < series.length; i++) {
      if (series[i].type !== type) continue;
      if (n === rang) return series[i];
      n += 1;
    }
    return null;
  }

  /* Ce que j'ai fait sur CETTE série de CET exercice la dernière fois, quel que soit
     le programme. On prend la séance la plus récente (hors celle-ci) qui contient
     l'exercice ; on y lit la série de même TYPE et de même rang dans son type.
     Pas de remontée plus loin : la colonne doit être prévisible, pas « la
     meilleure valeur trouvée ». */
  function dernierePerf(etat, exoSlug, type, rangDansType, exclureSeanceId) {
    if (!exoSlug) return null;
    var liste = seancesMuscuTriees(etat);
    for (var i = 0; i < liste.length; i++) {
      var se = liste[i];
      if (se.id === exclureSeanceId) continue;
      for (var j = 0; j < se.exercices.length; j++) {
        var ex = se.exercices[j];
        if (ex.slug !== exoSlug) continue;
        var s = serieAuRangParType(ex.series || [], type, rangDansType);
        if (!s) return null;
        var c = (s.chargeReel || '').trim(), r = (s.repsReel || '').trim(),
            d = (s.dureeReel || '').trim();
        if (!c && !r && !d) return null;
        return { charge: c, reps: r, duree: d, date: se.date,
                 typeCharge: ex.typeCharge, colonnes: colonnes(ex), rpe: s.rpe };
      }
    }
    return null;
  }

  /* « 20 × 12 », « 45 s », « 20 × 12 · 45 s » : on ne montre que ce qui a ete
     saisi. Le bouton est etroit — coller une duree a un couple charge/reps le
     fait deborder — mais il vaut mieux une ligne dense qu'une valeur cachee. */
  function texteDernierePerf(p) {
    if (!p) return '';
    var bouts = [];
    if (p.charge && p.reps) bouts.push(p.charge + ' × ' + p.reps);
    else if (p.charge || p.reps) bouts.push(p.charge || p.reps);
    if (p.duree) bouts.push(texteDuree(secondes(p.duree)) || p.duree);
    return bouts.join(' · ');
  }

  /* ---------- suivi ---------- */

  function toutesSeancesTriees(etat) {
    return etat.seances.slice().sort(function (a, b) {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return String(b.heure || '').localeCompare(String(a.heure || ''));
    });
  }

  /* Dernière fois que chaque exercice a été fait, et il y a combien de jours.
     C'est la matière du raisonnement 48–72 h : l'app montre, elle ne décide pas. */
  function derniereSollicitation(etat) {
    var par = {};
    seancesMuscuTriees(etat).forEach(function (se) {
      (se.exercices || []).forEach(function (ex) {
        if (!ex.slug) return;
        var faites = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!faites) return;
        if (!par[ex.slug] || par[ex.slug].date < se.date) {
          par[ex.slug] = { slug: ex.slug, nom: ex.nom, aw: ex.aw, forces: ex.forces || [],
                           date: se.date, series: faites };
        }
      });
    });
    return Object.keys(par).map(function (k) {
      par[k].jours = joursDepuis(par[k].date);
      return par[k];
    }).sort(function (a, b) { return a.jours - b.jours; });
  }

  /* Derniere fois que chaque STRUCTURE a ete chargee, et combien de series.
     Repond a la question que la liste par exercice ne sait pas traiter :
     « quand ai-je charge lourd le medial », toutes origines confondues. */
  /* Quand chaque structure a-t-elle ete chargee, ET DE QUEL COTE.

     Une charge portee « des deux » compte des DEUX cotes : ce n'est pas un
     troisieme cote, c'est un exercice qui sollicite les deux bras. Un
     exercice sans cote renseigne tombe dans son propre seau, nomme — on ne
     le repartit pas au hasard, et on ne le jette pas non plus.

     Rendu : une ligne par (structure, cote) REELLEMENT chargee, plus la
     liste des structures jamais touchees. L'ecran decide ensuite s'il
     mentionne le cote — inutile tant que le carnet n'en porte aucun. */
  function derniereSollicitationStructure(etat) {
    var par = {}, ordre = [];

    function poser(st, cote, date, nom, faites) {
      var cle = st + '|' + cote;
      if (!par[cle]) {
        par[cle] = { structure: st, cote: cote, date: date, series: 0, exercices: [] };
        ordre.push(cle);
      }
      var e = par[cle];
      if (date > e.date) { e.date = date; e.series = 0; e.exercices = []; }
      if (date === e.date) {
        e.series += faites;
        if (e.exercices.indexOf(nom) < 0) e.exercices.push(nom);
      }
    }

    seancesMuscuTriees(etat).forEach(function (se) {
      (se.exercices || []).forEach(function (ex) {
        var faites = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!faites) return;
        var cotes = cotesCouverts(ex.cote);
        if (!cotes.length) cotes = [COTE_INCONNU];
        (ex.structures || []).forEach(function (st) {
          cotes.forEach(function (c) { poser(st, c, se.date, ex.nom, faites); });
        });
      });
    });

    var lignes = ordre.map(function (cle) {
      var e = par[cle];
      return { structure: e.structure, nom: nomStructure(e.structure),
               cote: e.cote, nomCote: e.cote === COTE_INCONNU ? null : nomCote(e.cote),
               date: e.date, jours: joursDepuis(e.date),
               series: e.series, exercices: e.exercices };
    });

    var touchees = {};
    lignes.forEach(function (l) { touchees[l.structure] = true; });
    var jamais = STRUCTURES.filter(function (s) { return !touchees[s.id]; })
      .map(function (s) { return { structure: s.id, nom: s.nom }; });

    return { lignes: lignes, jamais: jamais };
  }

  /* Series validees par structure sur une fenetre, pour voir la repartition. */
  /* Le meme compte, mais sur une fenetre, et ventile par cote. `parStructure`
     reste le total toutes origines confondues — c'est lui qui repond a
     « ai-je neglige l'avant-bras » ; `parCote` repond a « de quel bras ». */
  function chargeParStructure(etat, depuisJours) {
    var c = {}, parCote = {}, total = 0;
    STRUCTURES.forEach(function (s) { c[s.id] = 0; });
    seancesMuscuTriees(etat).forEach(function (se) {
      if (depuisJours != null && joursDepuis(se.date) > depuisJours) return;
      (se.exercices || []).forEach(function (ex) {
        var n = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!n) return;
        var cotes = cotesCouverts(ex.cote);
        if (!cotes.length) cotes = [COTE_INCONNU];
        (ex.structures || []).forEach(function (st) {
          if (c[st] == null) return;
          c[st] += n;
          total += n;
          cotes.forEach(function (k) {
            var cle = st + '|' + k;
            parCote[cle] = (parCote[cle] || 0) + n;
          });
        });
      });
    });
    return { parStructure: c, parCote: parCote, total: total };
  }

  /* ---------- la carte des muscles ----------

     Meme regles que pour les structures, parce que ce sont les memes
     questions : on ne compte que les series VALIDEES, « les deux » compte des
     deux cotes, et ce qui n'a pas de cote reste a part plutot que d'etre
     reparti au hasard.

     La recuperation est incluse ici, et c'est VOULU : cent repetitions
     d'elastique chargent le flechisseur comme le reste, meme si elles n'ont
     rien a faire dans le tonnage. Ce qu'on mesure ici n'est pas du travail,
     c'est de la sollicitation. */
  function chargeParMuscle(etat, depuisJours) {
    var parMuscle = {}, parCote = {}, parRegion = {}, total = 0, sansMuscle = 0;
    MUSCLES.forEach(function (m) { parMuscle[m.id] = 0; });
    REGIONS_MUSCLE.forEach(function (r) { parRegion[r.id] = 0; });

    (etat.seances || []).forEach(function (se) {
      if (!se || (se.type !== 'muscu' && se.type !== 'recup')) return;
      if (depuisJours != null && joursDepuis(se.date) > depuisJours) return;
      (se.exercices || []).forEach(function (ex) {
        var n = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!n) return;
        var l = muscles(ex);
        if (!l.length) { sansMuscle += n; return; }
        var cotes = cotesCouverts(ex.cote);
        if (!cotes.length) cotes = [COTE_INCONNU];
        l.forEach(function (id) {
          parMuscle[id] += n;
          total += n;
          var m = muscle(id);
          if (m) parRegion[m.groupe] += n;
          cotes.forEach(function (c) {
            var cle = id + '|' + c;
            parCote[cle] = (parCote[cle] || 0) + n;
          });
        });
      });
    });

    return { parMuscle: parMuscle, parCote: parCote, parRegion: parRegion,
             total: total, sansMuscle: sansMuscle };
  }

  /* Ce qu'on MOBILISE, par articulation. Un compte par muscle répond à
     « lequel travaille » ; celui-ci répond à « qu'est-ce que je fais
     travailler », qui est la question d'un programme.

     Une série se compte UNE FOIS par articulation, même si l'exercice coche
     trois muscles du poignet. Additionner les muscles donnerait des nombres
     plus grands que le nombre de séries faites — un compte que personne ne
     peut relire. */
  function chargeParArticulation(etat, depuisJours) {
    var par = {}, total = 0;
    ARTICULATIONS.forEach(function (x) { par[x.id] = 0; });

    (etat.seances || []).forEach(function (se) {
      if (!se || (se.type !== 'muscu' && se.type !== 'recup')) return;
      if (depuisJours != null && joursDepuis(se.date) > depuisJours) return;
      (se.exercices || []).forEach(function (ex) {
        var n = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!n) return;
        var vues = [];
        muscles(ex).forEach(function (id) {
          var m = muscle(id);
          if (!m || par[m.articulation] == null) return;
          if (vues.indexOf(m.articulation) >= 0) return;
          vues.push(m.articulation);
          par[m.articulation] += n;
          total += n;
        });
      });
    });

    return ARTICULATIONS.map(function (x) {
      return { articulation: x.id, nom: x.nom, series: par[x.id],
               part: total ? par[x.id] / total : 0 };
    });
  }

  /* Le croisement que la carte rend possible : pour chaque mouvement, ce
     qu'il a REELLEMENT fait travailler — d'apres les exercices tels qu'ils
     sont renseignes, pas d'apres la table de proposition. C'est la difference
     entre ce que l'app suggere et ce que tu fais. */
  function musclesParMouvement(etat, depuisJours) {
    var par = {};
    FORCES.forEach(function (f) { par[f.id] = { force: f.id, nom: f.nom, series: 0, parMuscle: {} }; });

    (etat.seances || []).forEach(function (se) {
      if (!se || (se.type !== 'muscu' && se.type !== 'recup')) return;
      if (depuisJours != null && joursDepuis(se.date) > depuisJours) return;
      (se.exercices || []).forEach(function (ex) {
        var n = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!n) return;
        var l = muscles(ex);
        (ex.forces || []).forEach(function (f) {
          if (!par[f]) return;
          par[f].series += n;
          l.forEach(function (id) {
            par[f].parMuscle[id] = (par[f].parMuscle[id] || 0) + n;
          });
        });
      });
    });

    return FORCES.map(function (f) { return par[f.id]; });
  }

  /* Ce qui tire sur l'epicondyle medial — la masse flexo-pronatrice — et sur
     l'epicondyle lateral. C'est le lien direct entre la carte et la douleur
     qu'on suit, et il ne demande aucune saisie de plus. */
  function chargeEpicondyle(etat, depuisJours) {
    var c = chargeParMuscle(etat, depuisJours);
    var medial = 0, lateral = 0, nomsM = [], nomsL = [];
    MUSCLES.forEach(function (m) {
      var n = c.parMuscle[m.id] || 0;
      if (!n) return;
      if (m.medial) { medial += n; nomsM.push(m.nom); }
      if (m.lateral) { lateral += n; nomsL.push(m.nom); }
    });
    return { medial: medial, lateral: lateral, musclesMedial: nomsM, musclesLateral: nomsL };
  }

  /* Ce qui a charge un cote donne d'une structure, dans une liste de seances.
     C'est la brique du recoupement : une douleur au medial DROIT doit se
     croiser avec ce qui a charge le medial droit, pas avec l'autre bras.
     Un exercice sans cote renseigne est rendu a part, parce qu'il pourrait
     etre en cause sans qu'on puisse le dire. */
  function exercicesAyantCharge(seances, structure, cote) {
    var surLeCote = [], sansCote = [];
    (seances || []).forEach(function (se) {
      if (!se || se.type !== 'muscu') return;
      (se.exercices || []).forEach(function (ex) {
        if (!(ex.series || []).some(function (s) { return s.faite; })) return;
        if (structure && (ex.structures || []).indexOf(structure) < 0) return;
        var cotes = cotesCouverts(ex.cote);
        if (!cotes.length) { sansCote.push(ex.nom); return; }
        if (!cote || cotes.indexOf(cote) >= 0) surLeCote.push(ex.nom);
      });
    });
    return { surLeCote: surLeCote, sansCote: sansCote };
  }

  function zoneDelai(jours) {
    if (jours < 2) return 'chaud';   // < 48 h
    if (jours < 3) return 'tiede';   // 48–72 h
    return 'froid';
  }

  /* Tout ce qui a été fait dans les N heures précédant une date donnée.
     C'est ce qui permet de relier une douleur à la charge qui l'a précédée. */
  function fenetreAvant(etat, dateIso, heures, exclureId) {
    var jours = Math.ceil(heures / 24);
    return toutesSeancesTriees(etat).filter(function (s) {
      if (s.id === exclureId) return false;
      var d = joursEntre(s.date, dateIso);
      return d >= 0 && d <= jours;
    });
  }

  function episodesDouleur(etat) {
    return toutesSeancesTriees(etat).filter(function (s) {
      return zonesVives(s.douleurs).length > 0;
    });
  }

  /* Evolution d'une zone dans le temps : c'est la pente qui renseigne, pas un
     releve isole. Rendu du plus ancien au plus recent pour se lire comme une
     courbe. Une intensite inconnue (carnet d'avant) est gardee a null et
     signalee, jamais remplacee par un chiffre invente. */
  /* ---------- la règle des 24 h ----------

     Ce qui renseigne sur un tendon n'est pas la douleur PENDANT l'effort —
     elle est presque toujours là — mais si elle est revenue a son niveau de
     base le LENDEMAIN. C'est le signal qui revient dans toutes les sources de
     reeducation tendineuse, et c'est un avis d'expert, pas une regle validee
     par essai : l'app montre donc l'ecart, et ne conseille rien.

     Un releve est INDEPENDANT d'une seance, et c'est tout l'objet : le
     lendemain d'une grosse seance est souvent un jour de repos, ou rien ne
     serait enregistre. Il vit dans sa propre liste.

       Releve : { id, date, zone, cote, intensite }

     Un seul par (jour, zone, cote) : repondre deux fois corrige, n'empile pas. */

  function relevesTries(etat) {
    return ((etat && etat.releves) || []).slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function normaliserReleves(liste) {
    if (!Array.isArray(liste)) return [];
    var sortie = [];
    liste.forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      if (typeof r.zone !== 'string' || r.zone === 'aucune') return;
      if (typeof r.date !== 'string' || !r.date) return;
      var i = r.intensite;
      i = (typeof i === 'number' && isFinite(i)) ? Math.min(10, Math.max(0, Math.round(i))) : null;
      sortie.push({ id: r.id || uid('rl'), date: r.date, zone: r.zone,
                    cote: coteValide(r.cote), intensite: i });
    });
    return sortie;
  }

  function poserReleve(etat, date, zone, cote, intensite) {
    if (!etat.releves) etat.releves = [];
    var c = coteValide(cote);
    for (var i = etat.releves.length - 1; i >= 0; i--) {
      var r = etat.releves[i];
      if (r.date === date && r.zone === zone && coteValide(r.cote) === c) {
        etat.releves.splice(i, 1);
      }
    }
    var neuf = { id: uid('rl'), date: date, zone: zone, cote: c,
                 intensite: (typeof intensite === 'number' && isFinite(intensite))
                            ? Math.min(10, Math.max(0, Math.round(intensite))) : null };
    etat.releves.push(neuf);
    return neuf;
  }

  /* Tout ce qui a ete note pour une zone, seances ET releves melanges : c'est
     la meme douleur, peu importe par quel chemin elle a ete saisie. */
  function suiviZone(etat, zone, nbMax, cote) {
    var l = [];
    var filtreCote = coteValide(cote);
    toutesSeancesTriees(etat).forEach(function (se) {
      zonesVives(se.douleurs).forEach(function (d) {
        if (d.zone !== zone) return;
        if (filtreCote && coteValide(d.cote) !== filtreCote) return;
        l.push({ date: se.date, intensite: d.intensite, cote: d.cote, type: se.type,
                 quoi: se.type === 'sparring' ? 'sparring'
                     : se.type === 'recup' ? 'récupération'
                     : (se.programmeNom || 'séance libre') });
      });
    });
    relevesTries(etat).forEach(function (r) {
      if (r.zone !== zone) return;
      if (filtreCote && r.cote !== filtreCote) return;
      l.push({ date: r.date, intensite: r.intensite, cote: r.cote, type: 'releve',
               quoi: 'relevé du jour' });
    });
    l.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    l.reverse();
    return nbMax ? l.slice(-nbMax) : l;
  }

  /* Ce qu'il reste a demander aujourd'hui : pour chaque (zone, cote) note
     HIER ou AVANT-HIER et pas encore repris aujourd'hui, la derniere valeur
     connue. Deux jours, pas un : une seance du soir se juge le surlendemain
     matin aussi bien que le lendemain.

     Rien n'est demande pour une douleur notee le jour meme : la question
     porte sur le lendemain, pas sur l'instant. */
  function questions24h(etat, aujourdHuiIso) {
    var auj = aujourdHuiIso || aujourdHui();
    var derniers = {}, repondu = {};

    function cle(zone, cote) { return zone + '|' + (cote || COTE_INCONNU); }

    toutesSeancesTriees(etat).forEach(function (se) {
      var j = joursEntre(se.date, auj);
      if (j < 1 || j > 2) return;
      zonesVives(se.douleurs).forEach(function (d) {
        var k = cle(d.zone, d.cote);
        if (!derniers[k] || derniers[k].date < se.date) {
          derniers[k] = { zone: d.zone, cote: d.cote || null, date: se.date,
                          intensite: d.intensite, jours: j };
        }
      });
    });

    relevesTries(etat).forEach(function (r) {
      var j = joursEntre(r.date, auj);
      var k = cle(r.zone, r.cote);
      if (j === 0) { repondu[k] = true; return; }
      if (j < 1 || j > 2) return;
      if (!derniers[k] || derniers[k].date < r.date) {
        derniers[k] = { zone: r.zone, cote: r.cote, date: r.date,
                        intensite: r.intensite, jours: j };
      }
    });

    var sortie = [];
    Object.keys(derniers).forEach(function (k) {
      if (repondu[k]) return;
      sortie.push(derniers[k]);
    });
    sortie.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    return sortie;
  }

  /* L'ecart entre la veille et aujourd'hui, nomme. On ne conseille pas : on
     dit si c'est redescendu, si c'est stable, ou si ca n'est pas revenu. */
  function ecart24h(avant, apres) {
    if (avant == null || apres == null) return { sens: 'inconnu', delta: null };
    var d = apres - avant;
    return { sens: d <= -1 ? 'baisse' : (d >= 1 ? 'hausse' : 'stable'), delta: d };
  }

  /* Toutes les zones ayant fait mal au moins une fois, la plus recente d'abord. */
  function zonesRencontrees(etat) {
    var vues = {}, ordre = [];
    toutesSeancesTriees(etat).forEach(function (se) {
      zonesVives(se.douleurs).forEach(function (d) {
        if (!vues[d.zone]) { vues[d.zone] = 1; ordre.push(d.zone); }
      });
    });
    return ordre;
  }

  /* Tout ce qu'un exercice a donne, seance par seance, du plus recent au plus
     ancien. PRECEDENT ne montre que la fois d'avant ; ceci montre la pente. */
  function historiqueExercice(etat, exoSlug) {
    var sorties = [];
    seancesMuscuTriees(etat).forEach(function (se) {
      (se.exercices || []).forEach(function (ex) {
        if (ex.slug !== exoSlug) return;
        var faites = (ex.series || []).filter(function (s) { return s.faite; });
        if (!faites.length) return;
        var tonnage = 0, chiffrees = 0, meilleure = null, repsTotal = 0, tst = 0;
        var peut = peutPeser(ex), aD = aColonne(ex, 'duree');
        faites.forEach(function (s) {
          var ch = nombre(s.chargeReel), rp = nombre(s.repsReel);
          var dr = aD ? secondes(s.dureeReel) : null;
          if (rp != null) repsTotal += rp;
          if (dr != null) tst += dr;
          if (peut && ch != null && rp != null) {
            tonnage += ch * rp;
            chiffrees += 1;
            if (!meilleure || ch > meilleure.charge || (ch === meilleure.charge && rp > meilleure.reps)) {
              meilleure = { charge: ch, reps: rp };
            }
          }
        });
        sorties.push({
          seanceId: se.id, date: se.date,
          programme: se.programmeNom || 'séance libre',
          series: faites.length, repsTotal: repsTotal,
          tonnage: chiffrees ? tonnage : null,
          tempsSousTension: tst || null,
          colonnes: colonnes(ex),
          meilleure: meilleure,
          typeCharge: ex.typeCharge,
          detail: faites.map(function (s) {
            return { type: s.type, rpe: s.rpe, texte: texteSerie(ex, s, true),
                     charge: s.chargeReel, reps: s.repsReel, duree: s.dureeReel };
          })
        });
      });
    });
    return sorties;
  }

  /* Exercices connus par l'historique, le plus recemment pratique d'abord. */
  function exercicesPratiques(etat) {
    var par = {}, ordre = [];
    seancesMuscuTriees(etat).forEach(function (se) {
      (se.exercices || []).forEach(function (ex) {
        if (!ex.slug) return;
        if (!(ex.series || []).some(function (s) { return s.faite; })) return;
        if (!par[ex.slug]) {
          par[ex.slug] = { slug: ex.slug, nom: ex.nom, aw: ex.aw, typeCharge: ex.typeCharge,
                           derniere: se.date, seances: 0 };
          ordre.push(ex.slug);
        }
        par[ex.slug].seances += 1;
      });
    });
    return ordre.map(function (s) { return par[s]; });
  }

  function semaineDe(iso) {
    var d = dateObjet(iso);
    var j = (d.getDay() + 6) % 7;            // lundi = 0
    d.setDate(d.getDate() - j);
    var z = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }

  function volumeParSemaine(etat, nbSemaines) {
    var par = {}, ordre = [];
    var limite = nbSemaines || 8;
    seancesMuscuTriees(etat).forEach(function (se) {
      var sem = semaineDe(se.date);
      if (!par[sem]) {
        par[sem] = { semaine: sem, aw: 0, general: 0, series: 0, seances: 0, tempsSousTension: 0 };
        ordre.push(sem);
      }
      var v = volumeSeance(se);
      par[sem].aw += v.tonnageAw;
      par[sem].general += v.tonnageGeneral;
      par[sem].series += v.series;
      par[sem].tempsSousTension += v.tempsSousTension;
      par[sem].seances += 1;
    });
    return ordre.sort().slice(-limite).map(function (s) { return par[s]; }).reverse();
  }

  function repartitionForces(etat, depuisJours) {
    var c = {}, total = 0;
    FORCES.forEach(function (f) { c[f.id] = 0; });
    seancesMuscuTriees(etat).forEach(function (se) {
      if (depuisJours != null && joursDepuis(se.date) > depuisJours) return;
      (se.exercices || []).forEach(function (ex) {
        var n = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!n) return;
        (ex.forces || []).forEach(function (f) {
          if (c[f] != null) { c[f] += n; total += n; }
        });
      });
    });
    return { parForce: c, total: total };
  }

  A.m = {
    TYPES_SERIE: TYPES_SERIE, ORDRE_TYPES: ORDRE_TYPES, TYPES_CHARGE: TYPES_CHARGE,
    FORCES: FORCES, ZONES: ZONES, STYLES: STYLES, STRUCTURES: STRUCTURES,
    COTES: COTES, COTE_INCONNU: COTE_INCONNU,
    PRISES: PRISES, priseValide: priseValide, nomPrise: nomPrise,
    ARTICULATIONS: ARTICULATIONS, nomArticulation: nomArticulation,
    MUSCLES: MUSCLES, REGIONS_MUSCLE: REGIONS_MUSCLE,
    MUSCLES_PAR_MOUVEMENT: MUSCLES_PAR_MOUVEMENT,
    muscle: muscle, nomMuscle: nomMuscle, nomCourtMuscle: nomCourtMuscle,
    muscles: muscles,
    musclesProposes: musclesProposes, musclesDuNom: musclesDuNom,
    chargeParMuscle: chargeParMuscle,
    musclesParMouvement: musclesParMouvement, chargeEpicondyle: chargeEpicondyle,
    chargeParArticulation: chargeParArticulation,
    coteValide: coteValide, nomCote: nomCote, courtCote: courtCote,
    cotesCouverts: cotesCouverts,
    COLONNES: COLONNES, COLONNES_DEFAUT: COLONNES_DEFAUT,
    uid: uid, slug: slug, nombre: nombre, fmt: fmt,
    secondes: secondes, texteDuree: texteDuree,
    colonnes: colonnes, colonne: colonne, aColonne: aColonne,
    peutPeser: peutPeser, migrer: migrer,
    typeCharge: typeCharge, nomZone: nomZone, nomForce: nomForce, nomStyle: nomStyle,
    nomStructure: nomStructure,
    normaliserDouleurs: normaliserDouleurs, zonesDe: zonesDe, zonesVives: zonesVives,
    intensiteDe: intensiteDe, texteDouleur: texteDouleur,
    suiviZone: suiviZone, zonesRencontrees: zonesRencontrees,
    relevesTries: relevesTries, normaliserReleves: normaliserReleves,
    poserReleve: poserReleve, questions24h: questions24h, ecart24h: ecart24h,
    volumeRecupParSemaine: volumeRecupParSemaine,
    rangParType: rangParType, serieAuRangParType: serieAuRangParType,
    dureeReelle: dureeReelle,
    derniereSollicitationStructure: derniereSollicitationStructure,
    chargeParStructure: chargeParStructure, exercicesAyantCharge: exercicesAyantCharge,
    historiqueExercice: historiqueExercice, exercicesPratiques: exercicesPratiques,
    aujourdHui: aujourdHui, maintenant: maintenant,
    dateCourte: dateCourte, jourSemaine: jourSemaine,
    joursDepuis: joursDepuis, joursEntre: joursEntre, semaineDe: semaineDe,
    trouverCatalogue: trouverCatalogue, majCatalogue: majCatalogue, suggestions: suggestions,
    trouverOutil: trouverOutil, majCatalogueOutils: majCatalogueOutils, suggestionsOutils: suggestionsOutils,
    categoriesOutils: categoriesOutils, outilsParCategorie: outilsParCategorie, SANS_CATEGORIE: SANS_CATEGORIE,
    serieProgramme: serieProgramme, exerciceProgramme: exerciceProgramme, programme: programme,
    renumeroter: renumeroter,
    seanceMuscu: seanceMuscu, seanceSparring: seanceSparring,
    routineRecupVierge: routineRecupVierge, seanceRecup: seanceRecup,
    seancesRecupTriees: seancesRecupTriees, recupDuJour: recupDuJour,
    recupFaite: recupFaite, compteRecup: compteRecup, statsRecup: statsRecup,
    exerciceSeanceVierge: exerciceSeanceVierge, serieSeanceVierge: serieSeanceVierge,
    programmeDepuisSeance: programmeDepuisSeance, dupliquerProgramme: dupliquerProgramme,
    volumeSeance: volumeSeance, texteHorsTonnage: texteHorsTonnage,
    texteSerie: texteSerie,
    texteTempsSousTension: texteTempsSousTension,
    seancesMuscuTriees: seancesMuscuTriees, toutesSeancesTriees: toutesSeancesTriees,
    dernierePerf: dernierePerf, texteDernierePerf: texteDernierePerf,
    derniereSollicitation: derniereSollicitation, zoneDelai: zoneDelai,
    fenetreAvant: fenetreAvant, episodesDouleur: episodesDouleur,
    volumeParSemaine: volumeParSemaine, repartitionForces: repartitionForces
  };
})(window.App || (window.App = {}));
