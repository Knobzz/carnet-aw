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
    /* --- épaule et torse ---
       Separes le 2026-10-22, apres mesure : sur les 21 mots d'exercice du
       carnet qui touchent cette zone, AUCUN n'allume les deux cotes.
       « elevation laterale » et « shoulder press » vont a l'epaule,
       « developpe », « tirage », « traction » au torse. Fondus en une
       region, un tirage et une elevation laterale rendaient la meme ligne.
       La coupe est anatomique : scapulo-humeral d'un cote (deltoide,
       grand rond, subscapulaire, coraco-brachial), thoraco-humeral de
       l'autre (grand pectoral, grand dorsal). */
    { id: 'grand_pectoral', nom: 'Grand pectoral', court: 'Pectoral', aussi: 'pectoral',
      latin: 'Pectoralis major', image: 'icones/muscle-grand_pectoral.png', groupe: 'torse',
      quoi: 'ramène le bras vers soi', articulation: 'epaule' },
    { id: 'grand_dorsal', nom: 'Grand dorsal', court: 'Dorsal', aussi: 'dorsal',
      latin: 'Latissimus dorsi', image: 'icones/muscle-grand_dorsal.png', groupe: 'torse',
      quoi: 'tire le bras vers l’arrière et le bas', articulation: 'epaule' },
    /* L'auxiliaire du grand dorsal : meme action sur l'humerus, et les deux
       sont nommes ensemble aussi bien par l'etude EMG — parmi les rotateurs
       internes agissant pendant le sport — que par les competiteurs, qui les
       donnent prioritaires pour tirer la main de l'adversaire vers soi. */
    { id: 'grand_rond', nom: 'Grand rond', court: 'Grand rond',
      latin: 'Teres major', image: 'icones/muscle-grand_rond.png', groupe: 'epaule',
      quoi: 'ramène le bras vers l’arrière et le tourne vers l’intérieur',
      articulation: 'epaule' },
    { id: 'deltoide', nom: 'Deltoïde', court: 'Deltoïde',
      latin: 'Deltoideus', image: 'icones/muscle-deltoide.png', groupe: 'epaule',
      quoi: 'élève le bras et tient l’épaule', articulation: 'epaule' },
    { id: 'coraco_brachial', nom: 'Coraco-brachial', court: 'Coraco-brach.',
      latin: 'Coracobrachialis', image: 'icones/muscle-coraco_brachial.png', groupe: 'epaule',
      quoi: 'amène le bras vers l’avant et vers soi', articulation: 'epaule', profond: true },
    { id: 'subscapulaire', nom: 'Subscapulaire', court: 'Subscapulaire',
      aussi: 'sous-scapulaire',
      latin: 'Subscapularis', image: 'icones/muscle-subscapulaire.png',
      groupe: 'epaule', quoi: 'tourne le bras vers l’intérieur',
      articulation: 'epaule', profond: true },

    /* --- bras --- */
    { id: 'biceps', nom: 'Biceps brachial', court: 'Biceps', aussi: 'biceps',
      latin: 'Biceps brachii', image: 'icones/muscle-biceps.png', groupe: 'bras_av',
      quoi: 'fléchit le coude et supine', articulation: 'coude' },
    { id: 'brachial', nom: 'Brachial', court: 'Brachial', aussi: 'brachial antérieur',
      latin: 'Brachialis', image: 'icones/muscle-brachial.png', groupe: 'bras_av',
      quoi: 'fléchit le coude, quelle que soit la prise',
      articulation: 'coude', profond: true },
    { id: 'triceps', nom: 'Triceps brachial', court: 'Triceps', aussi: 'triceps',
      latin: 'Triceps brachii', image: 'icones/muscle-triceps.png', groupe: 'bras_ar',
      quoi: 'tend le coude', articulation: 'coude' },
    { id: 'ancone', nom: 'Anconé', court: 'Anconé',
      latin: 'Anconeus', image: 'icones/muscle-ancone.png', groupe: 'bras_ar',
      quoi: 'assiste l’extension et tient le coude', articulation: 'coude' },

    /* --- avant-bras, face antérieure : la masse flexo-pronatrice --- */
    { id: 'rond_pronateur', nom: 'Rond pronateur', court: 'Rond pronat.',
      latin: 'Pronator teres', image: 'icones/muscle-rond_pronateur.png', groupe: 'avant_bras_av',
      quoi: 'tourne la paume vers le bas',
      articulation: 'avant_bras', medial: true },
    { id: 'fcr', nom: 'Fléchisseur radial du carpe', court: 'Fléch. radial',
      aussi: 'grand palmaire', latin: 'Flexor carpi radialis', image: 'icones/muscle-fcr.png',
      groupe: 'avant_bras_av',
      quoi: 'plie le poignet, côté pouce', articulation: 'poignet', medial: true },
    { id: 'long_palmaire', nom: 'Long palmaire', court: 'Long palmaire',
      aussi: 'petit palmaire', latin: 'Palmaris longus', image: 'icones/muscle-long_palmaire.png',
      groupe: 'avant_bras_av',
      quoi: 'plie faiblement le poignet — absent chez une personne sur six',
      articulation: 'poignet', medial: true },
    { id: 'fcu', nom: 'Fléchisseur ulnaire du carpe', court: 'Fléch. ulnaire',
      aussi: 'cubital antérieur', latin: 'Flexor carpi ulnaris', image: 'icones/muscle-fcu.png',
      groupe: 'avant_bras_av',
      quoi: 'plie le poignet, côté auriculaire', articulation: 'poignet', medial: true },
    { id: 'flechisseurs_doigts', nom: 'Fléchisseurs des doigts', court: 'Fléch. doigts',
      latin: 'Flexor digitorum superficialis et profundus', image: 'icones/muscle-flechisseurs_doigts.png',
      groupe: 'main', quoi: 'serrent la main', articulation: 'doigts', medial: true },
    { id: 'carre_pronateur', nom: 'Carré pronateur', court: 'Carré pronat.',
      latin: 'Pronator quadratus', image: 'icones/muscle-carre_pronateur.png', groupe: 'avant_bras_av',
      quoi: 'tourne l’avant-bras, près du poignet',
      articulation: 'avant_bras', profond: true },

    /* --- avant-bras, face postérieure --- */
    { id: 'brachio_radial', nom: 'Brachio-radial', court: 'Brachio-radial',
      aussi: 'long supinateur', latin: 'Brachioradialis', image: 'icones/muscle-brachio_radial.png',
      groupe: 'avant_bras_ar',
      quoi: 'fléchit le coude, prise marteau', articulation: 'coude' },
    { id: 'ecrl', nom: 'Long extenseur radial du carpe', court: 'Long ext. radial',
      aussi: '1er radial', latin: 'Extensor carpi radialis longus', image: 'icones/muscle-ecrl.png',
      groupe: 'avant_bras_ar',
      quoi: 'relève le poignet, côté pouce', articulation: 'poignet', lateral: true },
    { id: 'ecrb', nom: 'Court extenseur radial du carpe', court: 'Court ext. radial',
      aussi: '2e radial', latin: 'Extensor carpi radialis brevis', image: 'icones/muscle-ecrb.png',
      groupe: 'avant_bras_ar', quoi: 'relève le poignet',
      articulation: 'poignet', lateral: true },
    { id: 'ecu', nom: 'Extenseur ulnaire du carpe', court: 'Ext. ulnaire',
      aussi: 'cubital postérieur', latin: 'Extensor carpi ulnaris', image: 'icones/muscle-ecu.png',
      groupe: 'avant_bras_ar',
      quoi: 'relève le poignet, côté auriculaire', articulation: 'poignet', lateral: true },
    { id: 'extenseurs_doigts', nom: 'Extenseurs des doigts', court: 'Ext. doigts',
      latin: 'Extensor digitorum', image: 'icones/muscle-extenseurs_doigts.png',
      groupe: 'avant_bras_ar', quoi: 'ouvrent la main', articulation: 'doigts', lateral: true },
    { id: 'extenseur_petit_doigt', nom: 'Extenseur du petit doigt', court: 'Ext. auriculaire',
      latin: 'Extensor digiti minimi', image: 'icones/muscle-extenseur_petit_doigt.png',
      groupe: 'avant_bras_ar', quoi: 'ouvre l’auriculaire', articulation: 'doigts', lateral: true },
    { id: 'extenseurs_pouce', nom: 'Extenseurs du pouce', court: 'Ext. pouce',
      latin: 'Extensor pollicis longus et brevis', image: 'icones/muscle-extenseurs_pouce.png',
      groupe: 'avant_bras_ar', quoi: 'ouvrent et écartent le pouce', articulation: 'pouce' },
    { id: 'supinateur', nom: 'Supinateur', court: 'Supinateur',
      latin: 'Supinator', image: 'icones/muscle-supinateur.png', groupe: 'avant_bras_ar',
      quoi: 'tourne la paume vers le haut', articulation: 'avant_bras',
      lateral: true, profond: true },
    /* --- avant-bras profond : ce qui commande le pouce et l'index ---
       Ces trois-la naissent du radius, de l'ulna ou de la membrane
       interosseuse — PAS d'un epicondyle. Ils ne portent donc ni `medial` ni
       `lateral`, comme le carre pronateur et le brachio-radial : les ranger
       avec les autres serait plus simple a lire et ferait accuser la mauvaise
       insertion. */
    { id: 'long_abducteur_pouce', nom: 'Long abducteur du pouce', court: 'Long abd. pouce',
      latin: 'Abductor pollicis longus', image: 'icones/muscle-long_abducteur_pouce.png',
      groupe: 'avant_bras_ar', quoi: 'écarte le pouce de la paume, et le tire vers l’arrière',
      articulation: 'pouce', profond: true },
    { id: 'long_flechisseur_pouce', nom: 'Long fléchisseur du pouce', court: 'Long fléch. pouce',
      aussi: 'long fléchisseur propre du pouce',
      latin: 'Flexor pollicis longus', image: 'icones/muscle-long_flechisseur_pouce.png',
      groupe: 'avant_bras_av', quoi: 'plie le bout du pouce — c’est lui qui écrase',
      articulation: 'pouce', profond: true },
    { id: 'extenseur_index', nom: 'Extenseur de l’index', court: 'Ext. index',
      latin: 'Extensor indicis', image: 'icones/muscle-extenseur_index.png',
      groupe: 'avant_bras_ar', quoi: 'ouvre l’index, seul',
      articulation: 'doigts', profond: true },

    /* --- la main : le thenar, l'hypothenar, les lombricaux ---
       Mesure trouvee, et elle borne ce qu'on peut dire : les EXTRINSEQUES
       font la force d'une prise de force, les intrinseques assistent (JBJS
       1970, 115 sujets). Le thenar y est employe dans toutes les formes SAUF
       la « hook grip » — attention au faux ami : cette « hook grip » est la
       prise a quatre doigts sans pouce du chirurgien de la main, PAS le hook
       du bras de fer. Les deux n'ont que le nom en commun, et les confondre
       ferait dire a l'etude ce qu'elle ne dit pas. */
    { id: 'court_abducteur_pouce', nom: 'Court abducteur du pouce', court: 'Court abd. pouce',
      latin: 'Abductor pollicis brevis', image: 'icones/muscle-court_abducteur_pouce.png',
      groupe: 'main', quoi: 'écarte le pouce de la paume', articulation: 'pouce' },
    { id: 'court_flechisseur_pouce', nom: 'Court fléchisseur du pouce', court: 'Court fléch. pouce',
      latin: 'Flexor pollicis brevis', image: 'icones/muscle-court_flechisseur_pouce.png',
      groupe: 'main', quoi: 'plie la base du pouce', articulation: 'pouce' },
    { id: 'opposant_pouce', nom: 'Opposant du pouce', court: 'Opp. pouce',
      latin: 'Opponens pollicis', image: 'icones/muscle-opposant_pouce.png',
      groupe: 'main', quoi: 'amène le pouce en face des autres doigts',
      articulation: 'pouce', profond: true },
    { id: 'adducteur_pouce', nom: 'Adducteur du pouce', court: 'Add. pouce',
      latin: 'Adductor pollicis', image: 'icones/muscle-adducteur_pouce.png',
      groupe: 'main', quoi: 'serre le pouce contre l’index — la pince qui tient',
      articulation: 'pouce', profond: true },
    { id: 'abducteur_auriculaire', nom: 'Abducteur de l’auriculaire', court: 'Abd. auriculaire',
      latin: 'Abductor digiti minimi', image: 'icones/muscle-abducteur_auriculaire.png',
      groupe: 'main', quoi: 'écarte le petit doigt', articulation: 'doigts' },
    { id: 'court_flechisseur_auriculaire', nom: 'Court fléchisseur de l’auriculaire',
      court: 'Fléch. auriculaire',
      latin: 'Flexor digiti minimi brevis', image: 'icones/muscle-court_flechisseur_auriculaire.png',
      groupe: 'main', quoi: 'plie la base du petit doigt', articulation: 'doigts' },
    { id: 'opposant_auriculaire', nom: 'Opposant de l’auriculaire', court: 'Opp. auriculaire',
      latin: 'Opponens digiti minimi', image: 'icones/muscle-opposant_auriculaire.png',
      groupe: 'main', quoi: 'creuse la paume du côté du petit doigt',
      articulation: 'doigts', profond: true },
    { id: 'court_palmaire', nom: 'Court palmaire', court: 'Court palmaire',
      aussi: 'palmaire cutané',
      latin: 'Palmaris brevis', image: 'icones/muscle-court_palmaire.png',
      groupe: 'main', quoi: 'plisse la peau de la paume et l’empêche de glisser',
      articulation: 'doigts' },
    /* Les lombricaux ne sont PAS employes dans une prise de force — c'est le
       resultat explicite de l'etude de 1970, quatrieme excepte. On les garde
       parce qu'ils existent et qu'ils tiennent les doigts, pas parce qu'ils
       serrent : c'est pour ca qu'ils n'entrent pas dans la prise fermee. */
    { id: 'lombricaux', nom: 'Lombricaux', court: 'Lombricaux',
      latin: 'Lumbricales', image: 'icones/muscle-lombricaux.png',
      groupe: 'main', quoi: 'plient les doigts à leur base en tendant le bout',
      articulation: 'doigts', profond: true }
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
  /* ---------- les planches de Gray ----------

     Henry Gray, « Anatomy of the Human Body », 1918 : domaine public, et
     c'est ce qui compte ici. Une planche trouvée au hasard sur le web aurait
     une licence invérifiable sur une app publiée.

     Elles ne REMPLACENT pas le schéma : une image matricielle ne se teinte
     pas muscle par muscle, donc elle ne peut pas porter la charge. Elles
     répondent à l'autre question — « à quoi ça ressemble, et où est-ce » —
     que des bandes de couleur ne répondront jamais.

     Elles ne sont pas pré-chargées : le service worker les met en cache à la
     première consultation. Tant qu'on ne les ouvre pas, elles ne coûtent rien
     à l'installation.

     `fichier` est vérifié par le banc contre le dépôt : une planche nommée
     mais absente donnerait une image cassée, et personne ne le verrait
     avant le téléphone. */
  /* Il y a eu ici les planches generales de l'atlas, avec un schema dessine
     a la main par-dessus, puis des polygones cliquables. Les deux ont echoue
     a suivre les contours reels, et les planches ne servaient plus que de
     repli. Elles sont parties avec : chaque muscle a SON image. */

  /* L'illustration d'UN muscle : le membre entier, avec celui-là en rouge.

     C'est ce que le decoupage essayait de fabriquer, et n'y arrivait pas :
     ici la forme est juste par construction, puisque c'est la planche
     elle-meme qui porte la teinte. Les vingt-deux en ont une.

     Le banc verifie que chaque fichier annonce existe vraiment, et qu'il
     n'en manque aucun : un muscle ajoute au carnet sans son image serait un
     nom sans visage. */
  function imageDuMuscle(id) {
    var m = muscle(id);
    return (m && m.image) || null;
  }

  /* Les muscles qui n'ont pas encore leur illustration propre. Les nommer
     vaut mieux que les laisser se fondre dans le lot : c'est ce qui reste
     a trouver. */
  function musclesSansImage() {
    return MUSCLES.filter(function (m) { return !m.image; })
                  .map(function (m) { return m.id; });
  }

  var REGIONS_MUSCLE = [
    { id: 'epaule',         nom: 'Épaule' },
    { id: 'torse',          nom: 'Torse' },
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
                    le bras de fer.
       'terrain'    ce que disent les competiteurs, les entraineurs et les
                    federations. Il n'existe qu'UNE etude EMG sur ce sport :
                    refuser cette parole reviendrait a refuser presque tout
                    ce qui s'en sait. Elle ne vaut pas de l'anatomie de
                    manuel, et c'est pour ca qu'elle a son niveau a elle.

     Toute entree qui n'est pas 'anatomie' porte `dit` et `lien` : QUI
     l'affirme, et OU on peut le verifier. Un avis anonyme est un avis qu'on
     ne peut pas contredire — et l'ecran affiche le nom, pas juste « a
     verifier ».

     Rien n'est ecrit sur l'exercice sans un geste : la proposition remplit
     les cases, l'utilisateur garde la main. */
  var MUSCLES_PAR_MOUVEMENT = {
    cupping:       { source: 'anatomie',   muscles: ['fcu', 'fcr', 'long_palmaire', 'flechisseurs_doigts'] },
    pronation:     { source: 'anatomie',   muscles: ['rond_pronateur', 'carre_pronateur'] },
    supination:    { source: 'anatomie',   muscles: ['supinateur', 'biceps'] },
    /* Les quatre premiers viennent de l'etude EMG ; la main vient de Larratt,
       qui decrit le POUCE COMME UN LEVIER et parle de monter « par les
       doigts ». Les abducteurs du pouce restent dehors : ils l'ECARTENT, et
       ce n'est pas le geste. */
    rising:        { source: 'terrain',
                     dit: 'Devon Larratt, et une étude EMG pour les quatre premiers',
                     lien: 'https://podcasts.happyscribe.com/the-joe-rogan-experience/2510-devon-larratt',
                     muscles: ['biceps', 'brachial', 'brachio_radial', 'deltoide',
                               'flechisseurs_doigts', 'long_flechisseur_pouce',
                               'court_flechisseur_pouce', 'adducteur_pouce'] },
    /* DEUX sources, et elles ne disent pas la meme chose. L'etude EMG nomme
       le grand pectoral en premier ; Voice of Armwrestling ne le nomme pas
       et ajoute le brachio-radial et le deltoide posterieur. On garde les
       deux plutot que d'arbitrer en silence — et l'ecran dit que deux
       sources parlent.

       Le subscapulaire vient de l'etude, qui le nomme parmi les rotateurs
       internes agissant sur l'humerus pendant le sport. */
    back_pressure: { source: 'terrain',
                     dit: 'Voice of Armwrestling, et une étude EMG sur bras de fer simulé',
                     lien: 'https://voaarmwrestling.com/blogs/training/toproll-technique-and-exercises',
                     muscles: ['grand_pectoral', 'grand_dorsal', 'grand_rond',
                               'subscapulaire', 'deltoide', 'biceps',
                               'brachio_radial'] },
    /* « L'epaule et le torse delivrent la pression et PROTEGENT L'HUMERUS » :
       c'est exactement le role du subscapulaire, rotateur interne principal,
       que l'etude nomme parmi ceux qui agissent sur l'humerus pendant le
       sport. Le grand dorsal, l'autre gros rotateur interne, reste dehors :
       aucune source ne le rattache a la pression laterale. */
    side_pressure: { source: 'terrain',
                     dit: 'Voice of Armwrestling, et une étude EMG sur bras de fer simulé',
                     lien: 'https://voaarmwrestling.com/blogs/training/toproll-technique-and-exercises',
                     muscles: ['grand_pectoral', 'subscapulaire', 'deltoide', 'fcu'] }
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
    /* PAS « doigts » tout seul : le mot ne dit pas dans quel SENS ils
       travaillent, et « ecartement des doigts » proposait les flechisseurs
       alors que des doigts qui s'ecartent sont tenus par les extenseurs.
       Meme raison que « grip » : un mot qui designe les deux ne designe
       aucun des deux. */
    flechisseurs_doigts: ['gripper', 'pince', 'serrage', 'pinch', 'serrer',
                          'flexion doigts', 'fermeture main'],
    /* Un exercice de PINCE est d'abord un exercice de pouce : c'est lui qui
       s'oppose aux doigts, et sans lui il n'y a pas de pince du tout. Les
       mots viennent du nom que l'utilisateur a ecrit — la source la moins
       contestable des quatre — et pas d'une mesure sur le bras de fer. */
    adducteur_pouce:     ['pince', 'pinch', 'serrage', 'gripper', 'serrer',
                          'adducteur du pouce', 'adducteur pouce'],
    court_flechisseur_pouce: ['pince', 'pinch', 'serrage', 'gripper', 'serrer'],
    long_flechisseur_pouce:  ['pince', 'pinch', 'serrage', 'gripper', 'serrer',
                              'long flechisseur du pouce', 'flechisseur du pouce'],
    opposant_pouce:      ['pince', 'pinch', 'opposant du pouce', 'opposition du pouce',
                          'opposant pouce'],
    ecrl:                ['extension poignet', 'reverse curl', 'reverse wrist', '1er radial'],
    ecrb:                ['extension poignet', 'reverse curl', 'reverse wrist', '2e radial', '2eme radial'],
    ecu:                 ['cubital posterieur', 'extenseur ulnaire'],
    extenseurs_doigts:   ['extenseur doigts', 'extension doigts', 'ouverture main',
                          'ecartement doigts', 'extensor band'],
    extenseur_petit_doigt: ['petit doigt', 'auriculaire'],
    abducteur_auriculaire: ['petit doigt', 'auriculaire'],
    court_flechisseur_auriculaire: ['petit doigt', 'auriculaire'],
    opposant_auriculaire:  ['petit doigt', 'auriculaire'],
    extenseurs_pouce:    ['pouce', 'thumb'],
    /* « pouce » et « thumb » designent le groupe qui l'OUVRE : les mots de la
       pince, plus haut, couvrent l'autre sens. Un meme mot pour les six
       muscles du pouce noierait la proposition au lieu de l'aider. */
    long_abducteur_pouce: ['pouce', 'thumb', 'long abducteur'],
    court_abducteur_pouce:['pouce', 'thumb', 'court abducteur'],
    deltoide:            ['deltoide', 'epaule', 'elevation laterale', 'shoulder press'],
    /* « pouce » tout seul reste aux extenseurs du pouce, ou il etait deja :
       six muscles du pouce qui repondraient tous au meme mot noieraient la
       proposition au lieu de l'aider. On ne propose que sur un mot qui
       designe sans ambiguite. */
    extenseur_index:       ['extenseur index', 'extenseur de l index', 'index'],
    lombricaux:            ['lombricaux', 'lombrical'],
    court_palmaire:        ['court palmaire'],
    subscapulaire:         ['subscapulaire', 'sous scapulaire'],
    coraco_brachial:     ['coraco'],
    ancone:              ['ancone'],
    long_palmaire:       ['petit palmaire', 'long palmaire'],
    /* « press » est garde pour « bench press » et « shoulder press », qui
       sont des mots entiers. Il ne s'allume plus dans « pression » depuis
       que les mots se lisent entiers. « pectoraux » est ajoute : le pluriel
       francais est irregulier, et le `s?` ne le couvre pas. */
    grand_pectoral:      ['pectoral', 'pectoraux', 'pec', 'developpe', 'bench', 'press'],
    grand_dorsal:        ['dorsal', 'tirage', 'rowing', 'traction', 'pull up', 'lat'],
    grand_rond:          ['grand rond', 'teres major']
  };

  /* ---------- lire un nom d'exercice ----------

     Deux defauts mesures sur de vrais noms, et le second est le pire des
     deux parce qu'il propose FAUX au lieu de ne rien proposer.

     1. LES ARTICLES cassaient la correspondance. « flexion du poignet » ne
        contient pas « flexion poignet », donc il ne proposait RIEN. Pareil
        pour « ouverture de la main ». L'app est en francais, et le francais
        met des articles. On tolere donc une suite de mots de liaison entre
        deux mots du motif.

     2. LA NEGATION etait ignoree. « Wrist curl inverse » contient « wrist
        curl », donc il proposait les FLECHISSEURS — exactement les muscles
        opposes a ceux qu'il travaille. L'app ecrivait d'ailleurs « le wrist
        curl inverse » dans l'explication de la zone des EXTENSEURS : son
        propre vocabulaire se contredisait.

        Un nom qui porte « inverse » ou « reverse » lit donc le geste
        RETOURNE, et ne lit plus les mots du geste droit. On prend le geste
        le plus LONG qui corresponde : « wrist curl inverse » est un wrist
        curl retourne, pas un curl retourne. */

  var LIAISONS = '(?: (?:de|du|des|d|le|la|les|l|a|au|aux|en|sur|avec))* ';

  /* `slug()` ne laisse que des lettres, des chiffres et des espaces : il ne
     reste aucun metacaractere a echapper, et l'echappement serait du code
     qu'aucun cas ne peut exercer. */
  /* Les mots se lisent ENTIERS. « lat » ne doit pas s'allumer dans
     « elevation laterale », ni « press » dans « pression » : les deux
     proposaient un muscle qui n'a rien a y faire. C'est la meme famille que
     « grip » dans « Titan Grip », deja retire pour cette raison — mais une
     regle vaut mieux qu'un mot retire de plus a chaque fois.

     Le pluriel francais est tolere, sinon « tractions » et « pronations »
     cesseraient de se lire. */
  function motifDuMot(mot) {
    return '(?:^| )' + slug(mot).split(' ').join(LIAISONS) + 's?(?: |$)';
  }

  var MARQUEURS_INVERSION = ['inverse', 'reverse'];

  /* Ce qu'un geste devient quand il est RETOURNE. Les listes sont courtes et
     sures : un wrist curl inverse releve le poignet, un curl inverse se tient
     en pronation et charge le brachio-radial et les radiaux. */
  var GESTES_INVERSES = {
    'wrist curl': ['ecrl', 'ecrb', 'extenseurs_doigts'],
    'curl':       ['brachio_radial', 'ecrl', 'ecrb']
  };

  /* Qui affirme ce qu'un mouvement propose, et ou le verifier. Rendu meme
     pour 'anatomie', ou il n'y a personne a nommer : c'est du manuel. */
  function sourceDuMouvement(id) {
    var p = MUSCLES_PAR_MOUVEMENT[id];
    if (!p) return null;
    return { source: p.source, dit: p.dit || null, lien: p.lien || null };
  }

  function musclesDuNom(nom) {
    var s = slug(nom);
    if (!s) return [];
    var vus = {};

    var inverse = MARQUEURS_INVERSION.some(function (mk) {
      return s.indexOf(mk) >= 0;
    });
    if (inverse) {
      /* Le geste le PLUS LONG d'abord : « wrist curl » avant « curl », sinon
         un wrist curl inverse serait lu comme un curl inverse. */
      var base = null;
      Object.keys(GESTES_INVERSES)
        .sort(function (a, b) { return b.length - a.length; })
        .forEach(function (k) {
          if (!base && new RegExp(motifDuMot(k)).test(s)) base = k;
        });
      if (base) GESTES_INVERSES[base].forEach(function (id) { vus[id] = 1; });
    }

    Object.keys(MOTS_MUSCLE).forEach(function (id) {
      MOTS_MUSCLE[id].forEach(function (mot) {
        /* Un nom retourne ne lit PAS les mots du geste droit. */
        if (inverse && GESTES_INVERSES[slug(mot)]) return;
        if (new RegExp(motifDuMot(mot)).test(s)) vus[id] = 1;
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
  function musclesProposes(forces, prise, nom, musclesReglage) {
    var vus = {}, l = [], sources = {};

    /* Le réglage d'abord, à égalité avec le nom : c'est l'utilisateur qui a
       écrit ce que SON matériel sollicite, une fois, au catalogue. */
    (musclesReglage || []).forEach(function (m) {
      if (!muscle(m)) return;
      vus[m] = 1; sources.reglage = true;
    });

    /* Le nom d'abord : c'est ce que l'utilisateur a ECRIT lui-meme, donc la
       source la moins contestable des trois. */
    musclesDuNom(nom).forEach(function (m) { vus[m] = 1; sources.nom = true; });
    /* Une prise fermee fait travailler les flechisseurs des doigts. C'est la
       definition de serrer, pas une interpretation. */
    if (priseValide(prise) === 'fermee') {
      /* Les EXTRINSEQUES font la force d'une prise de force ; les intrinseques
         assistent. Le thenar, lui, est employe dans toutes les formes de prise
         de force — c'est mesure (JBJS 1970, 115 sujets), pas deduit.

         Ce qui N'EST PAS propose ici l'est pour la meme raison : les
         lombricaux sont explicitement donnes comme non employes dans une
         prise de force, et l'hypothenar n'est pas documente. On ne comble pas
         un trou de la source avec une intuition. */
      ['flechisseurs_doigts', 'long_flechisseur_pouce', 'court_flechisseur_pouce',
       'court_abducteur_pouce', 'opposant_pouce', 'adducteur_pouce'
      ].forEach(function (m) { vus[m] = 1; });
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
    var nb = (sources.nom ? 1 : 0) + (sources.anatomie ? 1 : 0)
           + (sources.a_verifier ? 1 : 0) + (sources.terrain ? 1 : 0)
           + (sources.reglage ? 1 : 0);
    var source = nb > 1 ? 'mixte'
               : (sources.reglage ? 'reglage'
               : (sources.nom ? 'nom'
               : (sources.anatomie ? 'anatomie'
               : (sources.a_verifier ? 'a_verifier'
               : (sources.terrain ? 'terrain' : null)))));
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
     poses coup sur coup tombent dans la meme milliseconde, et seraient de
     nouveau a egalite. Le banc l'a
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
            outils: (exo.outils || []).slice(), reglages: reglagesDe(exo),
            vuLe: maintenant() };
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
      /* Le réglage se retient AVEC le nom de l'exercice, comme les muscles :
         « Pronation Titan Grip » revient avec son mousqueton du bon côté. */
      if (exo.reglages) e.reglages = reglagesDe(exo);
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

  /* Le slug SERRE : le meme, sans les espaces. Il ne sert a rien d'autre qu'a
     reperer deux entrees du catalogue que seule une espace separe — « Titan
     Grip Iron Wrist 60 mm » et « …60mm » sont deux outils differents pour
     l'app, et c'est voulu : fusionner des noms au jugé renommerait du
     materiel dans le dos de celui qui l'a saisi. Mais on peut le DIRE.

     Ce slug n'est jamais une identite : il ne sert qu'a poser une question. */
  function slugSerre(nom) { return slug(nom).replace(/ /g, ''); }

  /* Un outil du catalogue dont le nom ne differe que par des espaces, et qui
     porte des reglages. Repond a la panne silencieuse : on declare un reglage
     sur une entree, l'exercice porte l'autre, et la rangee reste vide sans
     que rien n'explique pourquoi. */
  function outilProche(etat, nom) {
    var s = slug(nom), serre = slugSerre(nom);
    if (!serre) return null;
    for (var i = 0; i < etat.outils.length; i++) {
      var o = etat.outils[i];
      if (o.slug === s) continue;
      if (slugSerre(o.nom) !== serre) continue;
      if ((o.reglages || []).length) return o;
    }
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

  /* ---------- « où ça tire ? » ----------

     Les noms des muscles ne parlent pas à qui ne les a pas appris, et une
     case qu'on ne sait pas cocher reste vide. Mais TOUT LE MONDE sait dire
     où ça tire : le dessus de l'avant-bras, le bord du pouce, la main qui
     serre. Ça, c'est une perception, pas un savoir.

     Chaque zone ressentie désigne les muscles qui y travaillent. Ce n'est
     pas une opinion : c'est de l'anatomie de description, la même que celle
     des planches. Et ça n'écrit rien tout seul — ça REMPLIT la liste, qui
     reste corrigeable.

     `aide` situe la zone sans jargon ET sans condescendance : « côté dos de
     la main » se comprend sans avoir ouvert un manuel, et nomme l'exercice
     courant quand il y en a un — « le curl », « le wrist curl ». La première
     version disait « la face poilue » : c'était parler à quelqu'un comme à
     un enfant, et ça a été relevé comme tel. Ne pas connaître le vocabulaire
     d'une discipline n'est pas la même chose que ne rien comprendre. */
  var ZONES_RESSENTIES = [
    { id: 'avb_dessus', nom: 'Le dessus de l’avant-bras',
      aide: 'côté dos de la main — le wrist curl inversé',
      muscles: ['ecrl', 'ecrb', 'ecu', 'extenseurs_doigts', 'extenseur_petit_doigt', 'ancone'] },
    { id: 'avb_dessous', nom: 'Le dessous de l’avant-bras',
      aide: 'côté paume — le wrist curl',
      muscles: ['rond_pronateur', 'fcr', 'long_palmaire', 'fcu', 'flechisseurs_doigts'] },
    { id: 'bord_pouce', nom: 'Le bord du pouce',
      aide: 'quand la main part du côté du pouce, ou résiste pour ne pas y partir '
          + '— le toproll, le reverse curl',
      muscles: ['brachio_radial', 'ecrl', 'ecrb', 'fcr', 'extenseurs_pouce',
                'long_abducteur_pouce', 'court_abducteur_pouce'] },
    { id: 'bord_auriculaire', nom: 'Le bord du petit doigt',
      aide: 'quand la main part du côté de l’auriculaire, ou résiste pour ne pas y '
          + 'partir — le hook, le wrist curl en pronation',
      muscles: ['ecu', 'fcu', 'extenseur_petit_doigt', 'abducteur_auriculaire',
                'court_flechisseur_auriculaire'] },
    { id: 'serrer', nom: 'La main qui serre',
      aide: 'les doigts se referment — le gripper, la barre épaisse',
      muscles: ['flechisseurs_doigts', 'long_flechisseur_pouce',
                'court_flechisseur_pouce', 'adducteur_pouce'] },
    { id: 'ouvrir', nom: 'La main qui s’ouvre',
      aide: 'les doigts s’écartent — l’élastique autour des doigts',
      muscles: ['extenseurs_doigts', 'extenseur_petit_doigt', 'extenseurs_pouce',
                'extenseur_index', 'abducteur_auriculaire'] },
    /* Les lombricaux et le court palmaire ne SERRENT pas — l'etude de 1970 le
       dit des premiers, le second est un muscle de la peau. Ils creusent la
       paume autour de la prise, et c'est une perception a part entiere : sans
       cette zone, deux muscles resteraient reserves a qui connait les noms. */
    { id: 'creux_paume', nom: 'Le creux de la main',
      aide: 'la paume se creuse autour de la poignée, sans serrer plus fort '
          + '— la barre épaisse, la poignée large',
      muscles: ['lombricaux', 'court_palmaire', 'opposant_pouce', 'opposant_auriculaire'] },
    { id: 'paume_bas', nom: 'Tourner la paume vers le bas',
      aide: 'le GESTE de tourner, pas une position tenue — la poignée de '
          + 'pronation, la sangle',
      muscles: ['rond_pronateur', 'carre_pronateur'] },
    { id: 'paume_haut', nom: 'Tourner la paume vers le haut',
      aide: 'le GESTE de tourner, pas une position tenue — le curl '
          + 'supination, la clé',
      muscles: ['supinateur', 'biceps'] },
    { id: 'plier_coude', nom: 'Plier le coude',
      aide: 'ramener la main vers l’épaule — le curl, sous toutes ses formes',
      muscles: ['biceps', 'brachial', 'brachio_radial'] },
    { id: 'tendre_coude', nom: 'Tendre le coude',
      aide: 'pousser la main loin de l’épaule — l’extension, les dips',
      muscles: ['triceps', 'ancone'] },
    { id: 'epaule', nom: 'L’épaule',
      aide: 'le bras entier bouge — les élévations, le développé',
      muscles: ['deltoide', 'coraco_brachial', 'subscapulaire'] },
    { id: 'bras_vers_soi', nom: 'Ramener le bras vers soi',
      aide: 'le torse travaille avec le bras — le tirage, le pull-over',
      muscles: ['grand_pectoral', 'grand_dorsal', 'grand_rond'] }
  ];

  function zoneRessentie(id) {
    for (var i = 0; i < ZONES_RESSENTIES.length; i++) {
      if (ZONES_RESSENTIES[i].id === id) return ZONES_RESSENTIES[i];
    }
    return null;
  }

  /* Les muscles d'une ou plusieurs zones ressenties, dans l'ordre du tableau
     et sans doublon. Une zone inconnue n'apporte rien et ne plante pas. */
  function musclesDesZones(ids) {
    var l = [];
    (ids || []).forEach(function (id) {
      var z = zoneRessentie(id);
      if (z) z.muscles.forEach(function (m) { l.push(m); });
    });
    return muscles({ muscles: l });
  }

  /* ---------- les réglages d'un outil ----------

     Un même outil ne charge pas pareil selon la façon dont il est monté.
     Sur une poignée de pronation, le mousqueton posé à l'EXTÉRIEUR fait
     porter la pression sur le bord externe de la main ; à l'intérieur,
     c'est l'autre bord. Ce n'est pas un autre outil, et ce n'est pas un
     autre exercice : c'est un RÉGLAGE, et il mérite d'être noté parce qu'il
     change ce qui travaille.

     Les réglages vivent sur l'OUTIL, dans le catalogue : on les écrit une
     fois, on les coche ensuite. Les écrire à chaque exercice donnerait
     « extérieur », « Exterieur », « ext » — trois réglages pour un seul.

     Un réglage peut porter des muscles. C'est tout l'intérêt : c'est
     l'utilisateur qui sait ce que SON matériel sollicite, et le carnet le
     lui propose ensuite au lieu de le lui redemander. */

  function reglagesOutil(etat, nomOutil) {
    var o = trouverOutil(etat, slug(nomOutil));
    return (o && Array.isArray(o.reglages)) ? o.reglages : [];
  }

  function trouverReglage(etat, nomOutil, nomReglage) {
    var cible = slug(nomReglage);
    if (!cible) return null;
    var l = reglagesOutil(etat, nomOutil);
    for (var i = 0; i < l.length; i++) if (l[i].slug === cible) return l[i];
    return null;
  }

  /* Pose ou met à jour un réglage. `id` sert au renommage : sans lui, changer
     « Extérieur » en « Dehors » en créerait un second à côté. */
  function majReglageOutil(etat, nomOutil, nomReglage, musclesVoulus, id) {
    var o = trouverOutil(etat, slug(nomOutil));
    if (!o) return null;
    var n = String(nomReglage == null ? '' : nomReglage).trim();
    if (!n) return null;
    if (!Array.isArray(o.reglages)) o.reglages = [];
    var r = null, i;
    if (id) {
      for (i = 0; i < o.reglages.length; i++) if (o.reglages[i].id === id) r = o.reglages[i];
    }
    if (!r) {
      for (i = 0; i < o.reglages.length; i++) if (o.reglages[i].slug === slug(n)) r = o.reglages[i];
    }
    if (!r) { r = { id: uid('rg'), nom: n, slug: slug(n), muscles: [] }; o.reglages.push(r); }
    r.nom = n;
    r.slug = slug(n);
    if (musclesVoulus) r.muscles = muscles({ muscles: musclesVoulus });
    return r;
  }

  function supprimerReglageOutil(etat, nomOutil, id) {
    var o = trouverOutil(etat, slug(nomOutil));
    if (!o || !Array.isArray(o.reglages)) return false;
    for (var i = 0; i < o.reglages.length; i++) {
      if (o.reglages[i].id === id) { o.reglages.splice(i, 1); return true; }
    }
    return false;
  }

  /* Côté exercice, le réglage retenu est rangé par SLUG de l'outil tel que
     l'exercice le porte — comme le reste. Renommer un outil au catalogue ne
     touche pas les exercices : leur outil garde son ancien nom, et son
     réglage reste accroché au même endroit. */
  function reglageDe(exo, nomOutil) {
    var m = exo && exo.reglages;
    var s = slug(nomOutil);
    if (!m || !s) return null;
    var v = m[s];
    return v ? String(v) : null;
  }

  function poserReglage(exo, nomOutil, nomReglage) {
    var s = slug(nomOutil);
    if (!s) return exo;
    if (!exo.reglages) exo.reglages = {};
    var n = String(nomReglage == null ? '' : nomReglage).trim();
    if (n) exo.reglages[s] = n;
    else delete exo.reglages[s];
    return exo;
  }

  /* Les réglages réellement portés, dans l'ordre des outils. Décocher un
     outil emporte son réglage : un réglage sans outil s'afficherait tout
     seul, et personne ne saurait de quoi il parle. */
  function reglagesPortes(exo) {
    var l = [];
    (exo && exo.outils || []).forEach(function (o) {
      var r = reglageDe(exo, o);
      if (r) l.push({ outil: o, reglage: r });
    });
    return l;
  }

  /* L'outil tel qu'on le DIT : avec son réglage s'il en porte un. Sans ça,
     deux séances de « Pronation Titan Grip » seraient indiscernables au
     journal alors que ce n'était pas le même travail. */
  function outilDit(exo, nomOutil) {
    var r = reglageDe(exo, nomOutil);
    return r ? nomOutil + ' · ' + r : nomOutil;
  }

  function reglagesDe(modele) {
    var m = {};
    reglagesPortes(modele).forEach(function (x) { m[slug(x.outil)] = x.reglage; });
    return m;
  }

  /* Les muscles que les réglages retenus désignent — la quatrième source de
     proposition, et la seule qui vienne de l'utilisateur ET de son matériel. */
  function musclesDesReglages(etat, exo) {
    var ids = [];
    (exo && exo.outils || []).forEach(function (o) {
      var nom = reglageDe(exo, o);
      if (!nom) return;
      var r = trouverReglage(etat, o, nom);
      if (r) (r.muscles || []).forEach(function (x) { ids.push(x); });
    });
    return muscles({ muscles: ids });
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
     visible, pas seulement ce qui vient en premier.

     `limite <= 0` veut dire TOUT. L'equipement d'une personne est un
     inventaire borne — une vingtaine d'outils, pas des centaines — et une
     coupe a huit cachait silencieusement le reste : on ouvrait la liste et
     on croyait avoir perdu son materiel. Le signalement est venu d'un vrai
     telephone, apres avoir ajoute onze outils d'un coup. La liste deroulante
     defile deja (max-height + overflow), donc rien ne deborde.

     Les EXERCICES gardent leur coupe : leur catalogue peut compter des
     centaines d'entrees, et on les retrouve en tapant. */
  function suggestionsOutils(etat, saisie, dejaPris, limite) {
    var q = slug(saisie);
    var pris = (dejaPris || []).map(slug);
    var l = parRecence(etat.outils.filter(function (o) { return pris.indexOf(o.slug) < 0; }));
    var n = limite == null ? 8 : (limite <= 0 ? l.length : limite);
    if (!q) return l.slice(0, n);
    var debut = [], dedans = [];
    for (var i = 0; i < l.length; i++) {
      var p = l[i].slug.indexOf(q);
      if (p === 0) debut.push(l[i]);
      else if (p > 0) dedans.push(l[i]);
    }
    return debut.concat(dedans).slice(0, n);
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
      outils: (modele.outils || []).slice(), reglages: reglagesDe(modele),
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
      outils: (ep.outils || []).slice(), reglages: reglagesDe(ep),
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
      outils: (modele.outils || []).slice(), reglages: reglagesDe(modele),
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

  /* ---------- par SEMAINE et par zone ----------

     Le modele savait compter par ZONE (une fenetre, un total) ou par SEMAINE
     (du volume global), jamais les deux. « Quelle zone monte, laquelle
     tombe » demande les deux a la fois.

     Chaque axe garde EXACTEMENT les regles de la fonction qui le comptait
     deja, sinon deux ecrans du meme carnet se contrediraient :

       'region'     comme chargeParMuscle — la RECUPERATION EST INCLUSE, et
                    une serie compte une fois par muscle, donc plusieurs fois
                    pour une region qui en porte plusieurs.
       'mouvement'  comme repartitionForces — la MUSCULATION SEULE, et une
                    serie compte une fois par mouvement coche.

     Ce n'est pas un detail : les deux axes n'ont pas le meme perimetre de
     seances. Un controle somme les semaines et exige le meme total que la
     fonction d'origine sur la meme fenetre — il tombe des que l'un des deux
     derive.

     UNE SEMAINE SANS SEANCE VAUT ZERO, et elle reste dans la liste. La faire
     disparaitre compresserait le temps : une courbe sauterait par-dessus un
     mois d'arret et montrerait une regularite qui n'a pas eu lieu.

     Rendu du PLUS ANCIEN au plus recent — c'est une serie temporelle, elle se
     lit dans ce sens. `volumeParSemaine` rend l'inverse parce que c'est une
     liste qu'on consulte, pas une courbe. */

  var AXES_SEMAINE = {
    region:    { cles: function () { return REGIONS_MUSCLE; },
                 avecRecup: true },
    mouvement: { cles: function () { return FORCES; },
                 avecRecup: false }
  };

  function semainesRecentes(nbSemaines) {
    var l = [], d = new Date();
    for (var i = 0; i < nbSemaines; i++) {
      var z = function (n) { return (n < 10 ? '0' : '') + n; };
      var iso = d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
      var sem = semaineDe(iso);
      if (l.indexOf(sem) < 0) l.push(sem);
      d.setDate(d.getDate() - 7);
    }
    return l.sort();
  }

  function chargeParSemaine(etat, axe, nbSemaines) {
    var def = AXES_SEMAINE[axe];
    if (!def) return null;
    var n = nbSemaines || 8;
    var semaines = semainesRecentes(n);
    var cles = def.cles();
    var par = {};
    semaines.forEach(function (sem) {
      par[sem] = {};
      cles.forEach(function (c) { par[sem][c.id] = 0; });
    });

    (etat.seances || []).forEach(function (se) {
      if (!se) return;
      if (se.type !== 'muscu' && !(def.avecRecup && se.type === 'recup')) return;
      var sem = semaineDe(se.date);
      if (!par[sem]) return;
      (se.exercices || []).forEach(function (ex) {
        var faites = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!faites) return;
        if (axe === 'region') {
          muscles(ex).forEach(function (id) {
            var m = muscle(id);
            if (m && par[sem][m.groupe] != null) par[sem][m.groupe] += faites;
          });
        } else {
          (ex.forces || []).forEach(function (f) {
            if (par[sem][f] != null) par[sem][f] += faites;
          });
        }
      });
    });

    return {
      cles: cles.map(function (c) { return { id: c.id, nom: c.nom }; }),
      semaines: semaines.map(function (sem) {
        var total = 0;
        cles.forEach(function (c) { total += par[sem][c.id]; });
        return { semaine: sem, par: par[sem], total: total };
      })
    };
  }

  /* Les N dernieres semaines contre les N precedentes, par zone. Derive de
     chargeParSemaine et de RIEN D'AUTRE : deux chemins de calcul finiraient
     par diverger, et c'est le genre d'ecart que personne ne remarque.

     `ecart` est null quand les deux periodes sont a zero : une zone jamais
     travaillee n'a pas « stagne », elle est absente, et un 0 affiche comme
     une stabilite serait un mensonge. */
  function comparerDeuxPeriodes(etat, axe, nbSemaines) {
    var n = nbSemaines || 4;
    var d = chargeParSemaine(etat, axe, n * 2);
    if (!d) return null;
    var sem = d.semaines;
    var coupe = Math.max(0, sem.length - n);
    function somme(liste, cle) {
      var t = 0;
      liste.forEach(function (x) { t += x.par[cle] || 0; });
      return t;
    }
    return d.cles.map(function (c) {
      var recent = somme(sem.slice(coupe), c.id);
      var avant = somme(sem.slice(0, coupe), c.id);
      return { id: c.id, nom: c.nom, recent: recent, precedent: avant,
               ecart: (recent === 0 && avant === 0) ? null : recent - avant };
    });
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

  /* ---------- le retour d'un testeur ----------

     Un rapport utile tient en deux morceaux : ce que la personne a vu, et le
     DECOR dans lequel elle l'a vu. Le second, personne ne le donne de
     memoire — ni sa version, ni la largeur reelle de son ecran, ni si l'app
     tourne installee ou dans un onglet — et c'est exactement ce qui manque
     dans un message envoye depuis WhatsApp.

     AUCUNE DONNEE D'ENTRAINEMENT N'Y ENTRE. Que des comptes et des etats :
     jamais un nom d'exercice, d'outil ou de programme, jamais une charge,
     jamais une douleur. C'est une promesse faite a l'ecran, donc le banc la
     tient — il cherche ces noms dans le texte produit.

     Les trois fonctions sont PURES. L'ecran releve le decor du navigateur et
     le passe en argument ; elles n'interrogent rien elles-memes. C'est ce qui
     permet de les mesurer sur un etat fabrique ET un decor fabrique, sans
     navigateur sous la main. */

  var CHAMPS_CONTEXTE = ['Version', 'Écran', 'Navigateur', 'Affichage',
                         'Séances', 'Exercices connus', 'Programmes', 'Outils',
                         'Taille des données', 'Stockage durable'];

  function contexteTechnique(etat, env) {
    var e = etat || {}, d = env || {};
    var inconnu = 'non renseigné';
    function compte(l) { return String((l || []).length); }
    /* Chaque ligne commence par « - » : c'est une liste en markdown pour le
       ticket GitHub, et ca reste lisible tel quel dans un message. Sans ca,
       GitHub recollerait les dix lignes en un seul paragraphe. */
    var valeurs = {
      'Version': d.version || inconnu,
      'Écran': (d.largeur && d.hauteur)
             ? d.largeur + ' × ' + d.hauteur + ' px'
               + (d.ratio ? ' · densité ×' + d.ratio : '')
             : inconnu,
      'Navigateur': d.navigateur || inconnu,
      'Affichage': d.installee === true ? 'installée (écran d’accueil)'
                 : d.installee === false ? 'onglet du navigateur' : inconnu,
      'Séances': compte(e.seances),
      'Exercices connus': compte(e.exercices),
      'Programmes': compte(e.programmes),
      'Outils': compte(e.outils),
      'Taille des données': d.tailleKo == null ? inconnu : d.tailleKo + ' Ko',
      'Stockage durable': d.durable === true ? 'accordé'
                        : d.durable === false ? 'refusé' : inconnu
    };
    return CHAMPS_CONTEXTE.map(function (c) {
      return '- ' + c + ' : ' + valeurs[c];
    }).join('\n');
  }

  /* Le texte complet : celui qu'on copie ET celui qu'on envoie sont le MEME,
     sinon ce qu'on a lu n'est pas ce qui part.

     Un retour vide rend `null`. Envoyer un contexte technique sans une phrase
     de la personne, c'est ouvrir un ticket que personne ne peut traiter —
     l'ecran le DIT au lieu de l'envoyer. */
  function texteRetour(saisie, contexte) {
    var s = String(saisie == null ? '' : saisie).trim();
    if (!s) return null;
    return s + '\n\n---\nContexte technique — aucune donnée d’entraînement\n'
             + (contexte || '');
  }

  var LIEN_TICKETS = 'https://github.com/Knobzz/carnet-aw/issues/new';

  /* GitHub refuse une URL trop longue (414). Le plafond exact n'a PAS ete
     mesure : 6 000 est une borne conservatrice, et le dire vaut mieux qu'un
     chiffre qui aurait l'air mesure. Au-dela on rend `null`, et l'ecran
     renvoie vers « Copier » — ouvrir un onglet sur une page d'erreur serait
     pire que de ne rien ouvrir.

     `encodeURIComponent` n'est pas une precaution de style : un « & » ou un
     « # » tape dans le retour tronquerait le corps du ticket en silence, et
     la moitie du rapport arriverait sans que personne le remarque. */
  var URL_TICKET_MAX = 6000;

  function lienTicket(titre, corps) {
    var u = LIEN_TICKETS
          + '?title=' + encodeURIComponent(String(titre == null ? '' : titre))
          + '&body='  + encodeURIComponent(String(corps == null ? '' : corps));
    return u.length > URL_TICKET_MAX ? null : u;
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
    imageDuMuscle: imageDuMuscle, musclesSansImage: musclesSansImage,
    muscles: muscles,
    musclesProposes: musclesProposes, musclesDuNom: musclesDuNom,
    sourceDuMouvement: sourceDuMouvement,
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
    ZONES_RESSENTIES: ZONES_RESSENTIES, zoneRessentie: zoneRessentie,
    musclesDesZones: musclesDesZones,
    outilProche: outilProche,
    reglagesOutil: reglagesOutil, trouverReglage: trouverReglage,
    majReglageOutil: majReglageOutil, supprimerReglageOutil: supprimerReglageOutil,
    reglageDe: reglageDe, poserReglage: poserReglage, reglagesPortes: reglagesPortes,
    outilDit: outilDit,
    musclesDesReglages: musclesDesReglages,
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
    volumeParSemaine: volumeParSemaine, repartitionForces: repartitionForces,
    chargeParSemaine: chargeParSemaine, comparerDeuxPeriodes: comparerDeuxPeriodes,
    CHAMPS_CONTEXTE: CHAMPS_CONTEXTE, LIEN_TICKETS: LIEN_TICKETS,
    URL_TICKET_MAX: URL_TICKET_MAX,
    contexteTechnique: contexteTechnique, texteRetour: texteRetour,
    lienTicket: lienTicket
  };
})(window.App || (window.App = {}));
