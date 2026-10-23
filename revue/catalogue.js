/* Catalogue des mouvements — LOT 1 : le poignet et l'avant-bras.
   -------------------------------------------------------------------------
   Ce fichier n'est PAS le modèle. C'est ce qu'on PROPOSE au modèle, et que
   MB valide mouvement par mouvement avant qu'on l'applique. Règle posée par
   lui le 2026-10-23 : « tu me listes, tu me montres ce que ça travaille, je
   valide avant qu'on envoie ».

   Chaque muscle d'un mouvement porte quatre choses, et aucune n'est
   facultative :

     id      le muscle, tel que le carnet le nomme ;
     rang    ce qu'il fait dans CE geste (voir RANGS) ;
     source  qui l'affirme, avec le lien pour le vérifier ;
     cite    ce que la source dit, MOT POUR MOT.

   Un rang `deduit` ne cite pas : il NOMME les deux faits cités dont il
   découle, et la planche l'affiche autrement. On ne fait pas passer un
   raisonnement pour une citation — c'est la règle du carnet depuis que la
   table des mouvements porte `dit` et `lien`.

   Rien ici n'entre dans le modèle tant que `etat` n'est pas 'valide'. */
(function (exports) {
  'use strict';

  /* LE RANG EST UNE AFFIRMATION À PART, ET IL A SA PROPRE BASE.

     Défaut trouvé par MB le 2026-10-23 : « est-ce que parfois un muscle
     passe d'aide à moteur ? » En vérifiant, DEUX définitions du rang se
     contredisaient dans ce fichier. Tantôt le rang disait OÙ la source
     parle du muscle (tableau d'actions ou corps du texte) ; tantôt il
     disait QUI MÈNE l'exercice. Le pectoral en est la preuve : son tableau
     d'actions nomme « arm flexion (clavicular head) », donc la première
     définition en fait un MOTEUR du développé militaire — et je l'avais mis
     AIDE, par un raisonnement sur les bras de levier.

     Le rang signifie désormais ce que MB croyait qu'il signifiait : QUI
     MÈNE CE GESTE. Et comme ce n'est pas la même affirmation que « ce
     muscle fait cette action », il porte sa propre base :

       `rangDit` présent  -> une MESURE le dit, citée comme les autres ;
       `rangDit` absent   -> c'est un RAISONNEMENT, et la planche l'écrit.

     Rien n'est caché : le compteur de l'en-tête sépare les deux, et un rang
     raisonné se voit d'un coup d'œil. On ne fait plus passer un jugement
     pour une citation — c'est le défaut que ce carnet traque partout
     ailleurs, et il était dans l'outil qui sert à le traquer. */
  var RANGS = {
    moteur: {
      nom: 'moteur',
      quoi: 'il MÈNE ce geste — vérifie sa base : citée ou raisonnée'
    },
    aide: {
      nom: 'aide',
      quoi: 'il participe sans mener — vérifie sa base, elle aussi'
    },
    tient: {
      nom: 'tient',
      quoi: 'il ne produit pas le geste : il TIENT la position pendant que '
          + 'le geste se fait'
    },
    deduit: {
      nom: 'déduit',
      quoi: 'aucune source ne décrit ce geste composé ; le muscle découle de '
          + 'DEUX faits cités, nommés dans la colonne'
    }
  };

  /* Les sources, une fois, avec leur date de relecture quand elle est
     affichée par le site. */
  var S = {
    fcr: {
      qui: 'Kenhub — Flexor carpi radialis', revu: '2023-11-03',
      lien: 'https://www.kenhub.com/en/library/anatomy/flexor-carpi-radialis-muscle'
    },
    fcu: {
      qui: 'Kenhub — Flexor carpi ulnaris', revu: '2023-11-03',
      lien: 'https://www.kenhub.com/en/library/anatomy/flexor-carpi-ulnaris-muscle'
    },
    pl: {
      qui: 'Kenhub — Palmaris longus', revu: '2023-11-03',
      lien: 'https://www.kenhub.com/en/library/anatomy/palmaris-longus-muscle'
    },
    fds: {
      qui: 'Kenhub — Flexor digitorum superficialis', revu: '2023-10-30',
      lien: 'https://www.kenhub.com/en/library/anatomy/flexor-digitorum-superficialis-muscle'
    },
    fdp: {
      qui: 'Kenhub — Flexor digitorum profundus', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/flexor-digitorum-profundus-muscle'
    },
    fpl: {
      qui: 'Kenhub — Flexor pollicis longus', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/flexor-pollicis-longus-muscle'
    },
    ecrl: {
      qui: 'Kenhub — Extensor carpi radialis longus', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/extensor-carpi-radialis-longus-muscle'
    },
    ecrb: {
      qui: 'Kenhub — Extensor carpi radialis brevis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/extensor-carpi-radialis-brevis-muscle'
    },
    ecu: {
      qui: 'Kenhub — Extensor carpi ulnaris', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/extensor-carpi-ulnaris-muscle'
    },
    ed: {
      qui: 'Kenhub — Extensor digitorum', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/extensor-digitorum-muscle'
    },
    pt: {
      qui: 'Kenhub — Pronator teres', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/pronator-teres-muscle'
    },
    pq: {
      qui: 'Kenhub — Pronator quadratus', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/pronator-quadratus-muscle'
    },
    sup: {
      qui: 'Kenhub — Supinator', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/supinator-muscle'
    },
    bic: {
      qui: 'Kenhub — Biceps brachii', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/biceps-brachii-muscle'
    },
    fpb: {
      qui: 'Kenhub — Flexor pollicis brevis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/flexor-pollicis-brevis-muscle'
    },
    addp: {
      qui: 'Kenhub — Adductor pollicis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/adductor-pollicis-muscle'
    },
    oppp: {
      qui: 'Kenhub — Opponens pollicis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/opponens-pollicis-muscle'
    },
    apb: {
      qui: 'Kenhub — Abductor pollicis brevis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/abductor-pollicis-brevis-muscle'
    },
    fdmb: {
      qui: 'Kenhub — Flexor digiti minimi brevis of hand', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/flexor-digiti-minimi-brevis-muscle-of-hand'
    },
    adm: {
      qui: 'Kenhub — Abductor digiti minimi of hand', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/abductor-digiti-minimi-muscle-of-hand'
    },
    oppdm: {
      qui: 'Kenhub — Opponens digiti minimi of hand', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/opponens-digiti-minimi-muscle'
    },
    lomb: {
      qui: 'Kenhub — Lumbrical muscles of the hand', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/lumbrical-muscles-of-the-hand'
    },
    pb: {
      qui: 'Kenhub — Palmaris brevis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/palmaris-brevis-muscle'
    },
    ei: {
      qui: 'Kenhub — Extensor indicis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/extensor-indicis-muscle'
    },
    edm: {
      qui: 'Kenhub — Extensor digiti minimi', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/extensor-digiti-minimi-muscle'
    },
    epl: {
      qui: 'Kenhub — Extensor pollicis longus', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/extensor-pollicis-longus-muscle'
    },
    pompes2025: {
      qui: '« Electromyographic Activation of the Pectoralis Major and '
         + 'Triceps Brachii Muscles During Standard, Diamond, and Wide Hand '
         + 'Position Push-Ups », 2025 — EMG sur 20 hommes',
      revu: null,
      lien: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13029269/'
    },
    tractions2017: {
      qui: 'Dickie, Faulkner, Barnes, Lark — J Electromyogr Kinesiol 2017, '
         + 'EMG sur 19 hommes entraînés, quatre prises comparées',
      revu: null,
      lien: 'https://pubmed.ncbi.nlm.nih.gov/27815036/'
    },
    pm: {
      qui: 'Kenhub — Pectoralis major', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/major-pectoralis-muscle'
    },
    ld: {
      qui: 'Kenhub — Latissimus dorsi', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/latissimus-dorsi-muscle'
    },
    tm: {
      qui: 'Kenhub — Teres major', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/teres-major-muscle'
    },
    delt: {
      qui: 'Kenhub — Deltoid', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/the-deltoid-muscle'
    },
    cb: {
      qui: 'Kenhub — Coracobrachialis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/coracobrachialis-muscle'
    },
    sub: {
      qui: 'Kenhub — Subscapularis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/subscapularis-muscle'
    },
    tri: {
      qui: 'Kenhub — Triceps brachii', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/triceps-brachii-muscle'
    },
    anc: {
      qui: 'Kenhub — Anconeus', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/anconeus-muscle'
    },
    bra: {
      qui: 'Kenhub — Brachialis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/brachialis-muscle'
    },
    hook2026: {
      qui: 'Giordano et al., « The Role of Kinematic and Electromyographic '
         + 'Analysis of the Elbow in Arm Wrestlers », Applied Sciences 2026 '
         + '— étude de rééducation, 11 athlètes avec épicondylite médiale',
      revu: null,
      lien: 'https://doi.org/10.3390/app16020713'
    },
    tawf: {
      qui: 'Toronto Armwrestling Federation — glossaire des techniques',
      revu: null,
      lien: 'https://www.tawf.ca/league/learn/arm-wrestling-techniques'
    },
    fujii: {
      qui: 'Fujii, Kobayashi, Sato, Shinozaki, Naito — J Electromyogr '
         + 'Kinesiol 2007;17(1):80-89, EMG sur 12 sujets',
      revu: null,
      lien: 'https://doi.org/10.1016/j.jelekin.2005.11.013'
    }
  };

  /* Les quatre citations qui reviennent le plus, écrites une fois. */
  var C = {
    fcr: 'Wrist joint: Wrist flexion, wrist abduction',
    fcu: 'Wrist joint: Wrist flexion, wrist adduction',
    pl: 'Wrist joint: Wrist flexion; Tenses palmar aponeurosis',
    fds: 'flexor digitorum superficialis aids the aids flexion of the wrist',
    fdp: 'This muscle is also an accessory wrist flexor, aiding the flexor '
       + 'carpi ulnaris, flexor carpi radialis, palmaris longus, flexor '
       + 'digitorum superficialis and flexor pollicis longus muscles to flex '
       + 'the hand at the wrist joint.',
    fpl: 'Flexor pollicis longus also flexes the thumb at the '
       + 'metacarpophalangeal joint and contributes to the flexion of the '
       + 'wrist.',
    ecrl: 'Wrist joints: Hand extension, hand abduction (radial deviation)',
    ecrb: 'Wrist joints: Hand extension, hand abduction (radial deviation)',
    ecu: 'Wrist joint: Hand extension and adduction',
    ed: 'Extensor digitorum also participates in the extension of the wrist.',
    ed_doigts: 'Metacarpophalangeal / Interphalangeal joints 2-5: Finger '
             + 'extension',
    pt: 'Pronation of forearm at the proximal radioulnar joint, flexion of '
      + 'the forearm at the elbow joint',
    pq: 'Radioulnar joints: forearm pronation',
    sup: 'Proximal radioulnar joint: Forearm supination',
    bic: 'Flexion and supination of the forearm at the elbow joint, weak '
       + 'flexor of the arm at the glenohumeral joint',
    fds_doigts: 'Metacarpophalangeal and proximal interphalangeal joints '
              + '2-5: Finger flexion',
    epl: 'Wrist joints: Weak hand extension ; Metacarpophalangeal and '
       + 'interphalangeal joint of thumb: Thumb extension',
    bra: 'Strong flexion of forearm at the elbow joint',
    pompes_rang: 'TB demonstrated statistically significantly higher RMS '
               + '(mV) and normalized RMS (%) than PM (p < 0.05), in '
               + 'diamond, followed by standard and wide push-ups [...] '
               + 'Diamond push-ups elicited the highest relative activation '
               + 'for both the PM and TB',
    pm: 'Shoulder joint: Arm adduction, Arm internal rotation, Arm flexion '
      + '(clavicular head), arm extension (sternocostal head) ; '
      + 'Scapulothoracic joint: Draws scapula anteroinferiorly',
    ld: 'Shoulder joint: Arm internal rotation, Arm adduction, Arm extension '
      + '; Assists in respiration',
    tm: 'Extension and internal rotation of the humerus (arm) ; supports '
      + 'shoulder adduction',
    delt: 'Clavicular part: flexion and internal rotation of the arm ; '
        + 'Acromial part: abduction of the arm beyond the initial 15° ; '
        + 'Spinal part: extension and external rotation of the arm',
    cb: 'Adduction and flexion of the arm at the shoulder joint',
    sub: 'Shoulder joint: Arm internal rotation ; Stabilizes humeral head in '
       + 'glenoid cavity',
    tri: 'Elbow joint: extension of the forearm ; Shoulder joint: extension '
       + 'and adduction of the arm (long head)',
    anc: 'Assists in forearm extension at the elbow joint ; Stabilization of '
       + 'elbow joint',
    hook_pro: 'In the Hook technique, the athlete executes forceful wrist '
            + 'flexion in combination with forearm PRONATION, and sustained '
            + 'elbow flexion [...] Pronator Teres : particularly crucial in '
            + 'the « Hook » technique',
    hook_sup: 'Supination turns your palm up and toward you ; it strengthens '
            + 'your wrist and is the heart of the hook',
    fpb: 'Carpometacarpal and metacarpophalangeal joint 1: Thumb flexion',
    addp: 'Carpometacarpal joint 1: Thumb adduction',
    oppp: 'Carpometacarpal joint 1: Thumb opposition',
    apb: 'Carpometacarpal joint 1: Thumb abduction',
    fdmb: 'Metacarpophalangeal joint 5: Finger flexion '
        + '(+ finger lateral rotation/opposition)',
    adm: 'Metacarpophalangeal joint 5: Finger abduction and flexion',
    oppdm: 'Carpometacarpal joint 5: Finger flexion, finger lateral '
         + 'rotation/opposition',
    lomb: 'Metacarpophalangeal joints 2-5: Finger flexion ; '
        + 'Interphalangeal joints 2-5: Finger extension',
    pb: 'Tightens palmar aponeurosis, tightens grip',
    ei: 'Wrist joints: Weak hand extension ; Metacarpophalangeal and '
      + 'interphalangeal joints of index finger: Finger extension',
    edm: 'Metacarpophalangeal joint 5: Finger extension',
    fujii: 'PT and ECR showed parallel activities during the static '
         + 'extension [...] the co-contraction of PT and ECR during wrist '
         + 'extension movements occurs to prevent supinating the forearm'
  };

  /* `rangDit` : {source, cite} quand une MESURE dit qui mène ce geste.
     Absent = rang raisonné, et la planche le dit. */
  var m = function (id, rang, src, cite, deDeux, rangDit) {
    return { id: id, rang: rang, source: src, cite: cite || null,
             deDeux: deDeux || null, rangDit: rangDit || null };
  };

  var MOUVEMENTS = [
    {
      id: 'wrist-curl',
      nom: 'Wrist curl',
      aussi: ['Flexion du poignet', 'Cupping', 'Tenue en cup'],
      geste: 'Avant-bras posé, paume vers le haut : le poignet se plie et '
           + 'ramène la main vers l’avant-bras.',
      muscles: [
        m('fcr', 'moteur', S.fcr, C.fcr),
        m('long_palmaire', 'moteur', S.pl, C.pl),
        m('fcu', 'moteur', S.fcu, C.fcu),
        m('flechisseurs_doigts', 'aide', S.fds, C.fds),
        m('long_flechisseur_pouce', 'aide', S.fpl, C.fpl)
      ],
      note: 'La phrase du fléchisseur profond des doigts ÉNUMÈRE les '
          + 'fléchisseurs du poignet : FCU, FCR, long palmaire, les deux '
          + 'fléchisseurs des doigts, et le long fléchisseur du pouce. '
          + 'Le carnet en propose quatre sur six.'
    },
    {
      id: 'wrist-curl-pouce',
      nom: 'Wrist curl côté pouce',
      aussi: ['Wrist curl bord du pouce', 'Wrist curl accentué pouce'],
      geste: 'Le même geste, mais la main part vers le pouce pendant qu’elle '
           + 'se plie.',
      muscles: [
        m('fcr', 'moteur', S.fcr, C.fcr),
        m('long_palmaire', 'moteur', S.pl, C.pl),
        m('flechisseurs_doigts', 'aide', S.fds, C.fds),
        m('long_flechisseur_pouce', 'aide', S.fpl, C.fpl)
      ],
      note: 'Le fléchisseur ULNAIRE sort : c’est lui qui emmène la main de '
          + 'l’autre côté. Le long palmaire reste : il s’insère au milieu, '
          + 'sur l’aponévrose palmaire, et ne penche d’aucun bord.'
    },
    {
      id: 'wrist-curl-auriculaire',
      nom: 'Wrist curl côté petit doigt',
      aussi: ['Wrist curl bord du petit doigt', 'Wrist curl côté auriculaire'],
      geste: 'Le même geste, mais la main part vers l’auriculaire.',
      muscles: [
        m('long_palmaire', 'moteur', S.pl, C.pl),
        m('fcu', 'moteur', S.fcu, C.fcu),
        m('flechisseurs_doigts', 'aide', S.fds, C.fds),
        m('long_flechisseur_pouce', 'aide', S.fpl, C.fpl)
      ]
    },
    {
      id: 'wrist-curl-inverse',
      nom: 'Wrist curl inversé',
      aussi: ['Reverse wrist curl', 'Extension du poignet',
              'Wrist curl en pronation'],
      geste: 'Avant-bras posé, paume vers le BAS : le dos de la main remonte '
           + 'vers l’avant-bras.',
      muscles: [
        m('rond_pronateur', 'tient', S.fujii, C.fujii),
        m('ecrl', 'moteur', S.ecrl, C.ecrl),
        m('ecrb', 'moteur', S.ecrb, C.ecrb),
        m('ecu', 'moteur', S.ecu, C.ecu),
        m('extenseurs_doigts', 'aide', S.ed, C.ed)
      ],
      note: 'L’EXTENSEUR ULNAIRE manque au carnet aujourd’hui, et c’est une '
          + 'asymétrie pure : côté flexion le carnet propose les DEUX bords '
          + '(radial et ulnaire), côté extension il n’en propose qu’un. '
          + 'Son tableau d’actions dit pourtant « Hand extension and '
          + 'adduction » — un extenseur du poignet de plein droit.'
    },
    {
      id: 'deviation-radiale',
      nom: 'Déviation radiale',
      aussi: ['Rising', 'Inclinaison radiale', 'Radial deviation'],
      geste: 'Le poignet penche vers le pouce, sans se plier ni se tendre.',
      muscles: [
        m('fcr', 'deduit', S.fcr, null,
          ['Fléchisseur radial : « wrist flexion, wrist ABDUCTION » (Kenhub)',
           'Extenseurs radiaux : « hand extension, hand ABDUCTION (radial '
         + 'deviation) » (Kenhub)']),
        m('ecrl', 'deduit', S.ecrl, null,
          ['les deux abduisent le poignet',
           'leurs composantes de flexion et d’extension s’annulent quand ils '
         + 'tirent ensemble']),
        m('ecrb', 'deduit', S.ecrb, null,
          ['les deux abduisent le poignet',
           'leurs composantes de flexion et d’extension s’annulent quand ils '
         + 'tirent ensemble'])
      ],
      note: 'TON MOT ÉTAIT LE BON. Le sport appelle ça « rising » : les '
          + 'sources d’armwrestling listent les trois mouvements de poignet '
          + 'comme cupping (flexion), rolling (pronation) et RISING '
          + '(déviation radiale), et le rising s’entraîne au « riser lift », '
          + 'une sangle passée sur les premières phalanges. '
          + '— Les trois muscles, eux, restent DÉDUITS : aucune source lue '
          + 'ne décrit la déviation pure comme un geste d’entraînement, ils '
          + 'découlent de deux faits cités.',
      aDecider: [
        { id: 'ecrl', rang: 'moteur', source: S.ecrl, cite: C.ecrl,
          pourquoi: 'Le carnet a DÉJÀ une force « Rising », et elle ne '
                  + 'contient AUCUN déviateur du poignet : deltoïde, biceps, '
                  + 'brachial, brachio-radial et le grip, source terrain '
                  + '(Devon Larratt). C’est le niveau TACTIQUE — lever la '
                  + 'main au-dessus de celle de l’adversaire. Le niveau '
                  + 'POIGNET, lui, est une déviation radiale, et il manque. '
                  + 'Faut-il ajouter les deux extenseurs radiaux et le '
                  + 'fléchisseur radial à la force « Rising » ? Ta règle de '
                  + '1.23.2 veut que ce soit toi qui tranches sur une entrée '
                  + 'de source terrain.' }
      ]
    },
    {
      id: 'deviation-ulnaire',
      nom: 'Déviation ulnaire',
      aussi: ['Déviation cubitale', 'Inclinaison ulnaire', 'Ulnar deviation'],
      geste: 'Le poignet penche vers l’auriculaire, sans se plier ni se '
           + 'tendre.',
      note: 'AUCUN terme de bras de fer trouvé. Les sources du sport nomment '
          + 'cupping, rolling et rising — la déviation ulnaire n’a pas son '
          + 'mot à elle, et je ne vais pas en inventer un. Côté salle, en '
          + 'revanche, elle a un nom : le LEVAGE DE MASSE (sledgehammer '
          + 'levers). Le « vertical lever to the nose » travaille la '
          + 'déviation ulnaire, le « horizontal lever to the front » la '
          + 'radiale. À décider : ajouter ces tournures au dictionnaire ?',
      muscles: [
        m('fcu', 'deduit', S.fcu, null,
          ['Fléchisseur ulnaire : « wrist flexion, wrist ADDUCTION »',
           'Extenseur ulnaire : « hand extension and ADDUCTION »']),
        m('ecu', 'deduit', S.ecu, null,
          ['les deux adduisent le poignet',
           'leurs composantes de flexion et d’extension s’annulent'])
      ]
    },
    {
      id: 'pronation',
      nom: 'Pronation',
      aussi: ['Poignée de pronation', 'Pronation à la poulie'],
      geste: 'L’avant-bras tourne : la paume va vers le bas.',
      muscles: [
        m('rond_pronateur', 'moteur', S.pt, C.pt),
        m('carre_pronateur', 'moteur', S.pq, C.pq)
      ]
    },
    {
      id: 'supination',
      nom: 'Supination',
      aussi: ['Supination à la clé'],
      geste: 'L’avant-bras tourne : la paume va vers le haut.',
      muscles: [
        m('supinateur', 'moteur', S.sup, C.sup),
        m('biceps', 'moteur', S.bic, C.bic)
      ],
      note: 'Le carnet ne propose PAS le biceps sur le mot « supination » '
          + 'aujourd’hui, alors que sa table des mouvements le fait. Le '
          + 'biceps est le supinateur puissant quand le coude est plié — '
          + '« the supination is most powerful in a flexed elbow » (Kenhub).'
    },

    /* ================= LOT 2 : LA MAIN ET LE GRIP =================
       Mesure avant correction, sur 24 noms de cette famille : TREIZE ne
       proposent rien. Et parmi ceux qui répondent, le même geste écrit de
       trois façons donne trois réponses — « Serrage » rend quatre muscles,
       « Fermeture de la main » en rend UN, et la zone « la main qui serre »,
       passée aux sources le matin même, en contient SIX. */
    {
      id: 'serrage',
      nom: 'Gripper',
      aussi: ['Serrage', 'Hand gripper', 'Fermeture de la main',
              'Poignée à ressort', 'Serrage de poing'],
      geste: 'Les doigts se referment sur la poignée, le pouce écrase '
           + 'par-dessus.',
      muscles: [
        m('flechisseurs_doigts', 'moteur', S.fds, C.fds_doigts),
        m('long_flechisseur_pouce', 'moteur', S.fpl, C.fpl),
        m('court_flechisseur_pouce', 'moteur', S.fpb, C.fpb),
        m('adducteur_pouce', 'moteur', S.addp, C.addp),
        m('court_flechisseur_auriculaire', 'moteur', S.fdmb, C.fdmb),
        m('lombricaux', 'moteur', S.lomb, C.lomb)
      ],
      aDecider: [
        { id: 'court_palmaire', rang: 'aide', source: S.pb, cite: C.pb,
          pourquoi: 'Son tableau d’actions dit littéralement « tightens '
                  + 'GRIP ». Il est aujourd’hui dans la zone « le creux de '
                  + 'la main » et pas dans « la main qui serre ». Faut-il '
                  + 'l’ajouter au serrage ? Si oui, la zone devra suivre.' }
      ],
      note: 'Cette liste est celle de la zone « la main qui serre », passée '
          + 'aux sources le 2026-10-23. Aujourd’hui « Serrage » en rend '
          + 'quatre et « Fermeture de la main » en rend UN.'
    },
    {
      id: 'pince',
      nom: 'Pince',
      aussi: ['Pinch', 'Pinch block'],
      geste: 'Le pouce écrase contre les doigts, sans que la main se referme '
           + 'sur une poignée.',
      muscles: [
        m('flechisseurs_doigts', 'moteur', S.fds, C.fds_doigts),
        m('long_flechisseur_pouce', 'moteur', S.fpl, C.fpl),
        m('court_flechisseur_pouce', 'moteur', S.fpb, C.fpb),
        m('opposant_pouce', 'moteur', S.oppp, C.oppp),
        m('adducteur_pouce', 'moteur', S.addp, C.addp)
      ],
      note: 'Aujourd’hui « Pince pouce index » propose NEUF muscles, dont '
          + 'les extenseurs et les abducteurs du pouce — ceux qui '
          + 'l’OUVRENT, dans un geste qui l’écrase. Même famille que « côté '
          + 'pouce » : les mots « pouce » et « index » sont lus comme des '
          + 'muscles.'
    },
    {
      id: 'ouverture-main',
      nom: 'Extenseurs à élastique',
      aussi: ['Extensor band', 'Ouverture de la main',
              'Élastique autour des doigts', 'Ouverture des doigts'],
      geste: 'Les doigts se tendent et le pouce s’écarte, contre un '
           + 'élastique passé autour d’eux.',
      muscles: [
        m('extenseurs_doigts', 'moteur', S.ed, C.ed_doigts),
        m('extenseur_petit_doigt', 'moteur', S.edm, C.edm),
        m('extenseurs_pouce', 'moteur', S.epl, C.epl),
        m('extenseur_index', 'moteur', S.ei, C.ei),
        m('abducteur_auriculaire', 'moteur', S.adm, C.adm),
        m('court_abducteur_pouce', 'moteur', S.apb, C.apb),
        m('lombricaux', 'aide', S.lomb, C.lomb)
      ],
      note: 'Aujourd’hui « Ouverture de la main » rend UN muscle. Les '
          + 'lombricaux sont au rang « aide » et non moteur : ils TENDENT '
          + 'les interphalangiennes (« Interphalangeal joints 2-5: Finger '
          + 'extension ») tout en PLIANT les métacarpo-phalangiennes — une '
          + 'moitié du geste seulement.'
    },
    {
      id: 'finger-curl',
      nom: 'Finger curl',
      aussi: ['Rouleau de doigts', 'Finger rolling', 'Enroulement des doigts'],
      geste: 'La barre roule jusqu’au bout des doigts, puis les doigts la '
           + 'ramènent dans la paume. Le poignet ne bouge pas.',
      muscles: [
        m('flechisseurs_doigts', 'moteur', S.fds, C.fds_doigts),
        m('court_flechisseur_auriculaire', 'moteur', S.fdmb, C.fdmb)
      ],
      note: 'Les LOMBRICAUX sont volontairement absents, et c’est leur '
          + 'citation qui le dit : ils plient les métacarpo-phalangiennes '
          + 'mais TENDENT les interphalangiennes, que ce geste plie. Ils '
          + 'travailleraient contre lui sur la moitié du trajet. Le pouce '
          + 'non plus n’y est pas : il tient la barre, il ne l’enroule pas.'
    },
    {
      id: 'tenue-barre',
      nom: 'Dead hang',
      aussi: ['Tenue à la barre', 'Suspension', 'Barre fixe en tenue',
              'Farmer walk', 'Marche du fermier'],
      geste: 'La main tient sans bouger, le temps que ça dure.',
      muscles: [
        m('flechisseurs_doigts', 'moteur', S.fds, C.fds_doigts),
        m('long_flechisseur_pouce', 'moteur', S.fpl, C.fpl),
        m('court_flechisseur_pouce', 'moteur', S.fpb, C.fpb),
        m('adducteur_pouce', 'moteur', S.addp, C.addp),
        m('court_flechisseur_auriculaire', 'moteur', S.fdmb, C.fdmb),
        m('lombricaux', 'moteur', S.lomb, C.lomb)
      ],
      note: 'Mêmes muscles que le serrage : ce qui change est le RÉGIME, pas '
          + 'le geste — ils tiennent au lieu de raccourcir. Le carnet ne '
          + 'distingue pas les régimes, et ce n’est pas ce lot qui le fera. '
          + 'Aujourd’hui, aucune de ces cinq écritures ne propose quoi que '
          + 'ce soit.'
    },
    {
      id: 'barre-epaisse',
      ecarte: 'equipement',
      nom: 'Barre épaisse',
      aussi: ['Fat grip', 'Poignée large', 'Thick bar', 'Grosse poignée'],
      geste: 'La poignée est trop large pour que les doigts se rejoignent : '
           + 'la paume se creuse autour, et la main tient quand même.',
      muscles: [
        m('flechisseurs_doigts', 'moteur', S.fds, C.fds_doigts),
        m('long_flechisseur_pouce', 'moteur', S.fpl, C.fpl),
        m('court_flechisseur_pouce', 'moteur', S.fpb, C.fpb),
        m('adducteur_pouce', 'moteur', S.addp, C.addp),
        m('court_flechisseur_auriculaire', 'moteur', S.fdmb, C.fdmb),
        m('lombricaux', 'moteur', S.lomb, C.lomb),
        m('court_palmaire', 'moteur', S.pb, C.pb),
        m('opposant_pouce', 'moteur', S.oppp, C.oppp),
        m('opposant_auriculaire', 'moteur', S.oppdm, C.oppdm)
      ],
      note: 'ÉCARTÉ VERS LA PHASE ÉQUIPEMENT par MB le 2026-10-23, et c’est '
          + 'le cas d’école : le geste est exactement celui du gripper, et '
          + 'ce que la poignée large ajoute — le creux de la paume, donc le '
          + 'court palmaire et les deux opposants — vient de l’OUTIL. Le '
          + 'travail est gardé ici pour n’être pas refait : ces trois '
          + 'muscles ne sont atteignables par aucun nom en attendant.'
    },

    /* ================= LOT 3 : LES EXERCICES DE TABLE =================
       MB, 2026-10-23 : « lot 3 = les exercices qui entraînent les gestes de
       table. Les gestes restent dans la case Mouvements. »

       C'est sa règle de 1.23.2 qui commande ce choix, et elle tient : les
       gestes de table n'ont que des sources TERRAIN, et la source « le
       nom » — ce que MB a écrit lui-même — ne doit pas les porter. Ils
       restent là où ils sont, avec leur auteur affiché à l'écran.

       Ce lot décrit ce que LE CORPS FAIT dans chaque exercice. Et ces
       exercices se trouvent être des COMPOSITIONS de gestes déjà sourcés
       aux lots 1 et 2 : déviation radiale, pronation, cupping, prise. Les
       citations sont donc les mêmes, et le rang « tient » dit ce qui tient
       pendant que le reste travaille.

       Mesure avant correction : sur 19 noms de cette famille, QUINZE ne
       proposent rien.

       LES ÉPAULES ET LE DOS N'Y SONT PAS : « side pressure » et « back
       pressure » à la poulie attendent le lot 4, où leurs muscles seront
       sourcés pour de bon plutôt que repris d'une liste terrain. */
    {
      id: 'riser-lift',
      nom: 'Riser lift',
      aussi: ['Riser à la sangle', 'Levée au riser'],
      geste: 'Une sangle passée sur les premières phalanges, reliée à une '
           + 'charge : la main se lève en penchant vers le pouce.',
      muscles: [
        m('fcr', 'deduit', S.fcr, null,
          ['Fléchisseur radial : « wrist flexion, wrist ABDUCTION » (Kenhub)',
           'Extenseurs radiaux : « hand extension, hand ABDUCTION » (Kenhub)']),
        m('ecrl', 'deduit', S.ecrl, null,
          ['les deux abduisent le poignet',
           'leurs composantes de flexion et d’extension s’annulent']),
        m('ecrb', 'deduit', S.ecrb, null,
          ['les deux abduisent le poignet',
           'leurs composantes de flexion et d’extension s’annulent']),
        m('flechisseurs_doigts', 'tient', S.fds, C.fds_doigts),
        m('long_flechisseur_pouce', 'tient', S.fpl, C.fpl)
      ],
      note: 'C’est l’exercice du RISING, et c’est ce qui règle la collision '
          + 'que j’avais créée : l’exercice s’appelle « Riser lift », pas '
          + '« Rising ». Le mot « Rising » tout court reste la déviation '
          + 'radiale — c’est ce qu’il veut dire dans le vocabulaire '
          + 'd’entraînement — pendant que la FORCE « Rising » de la case '
          + 'Mouvements reste le mouvement tactique complet, avec sa source '
          + 'Devon Larratt. Trois choses, trois endroits, plus de collision.'
    },
    {
      id: 'toproll-poulie',
      nom: 'Toproll à la poulie',
      aussi: ['Cable toproll', 'Toproll à la sangle'],
      geste: 'La paume tourne vers le bas pendant que la main penche vers le '
           + 'pouce, contre une poulie ou une sangle.',
      muscles: [
        m('rond_pronateur', 'moteur', S.pt, C.pt),
        m('carre_pronateur', 'moteur', S.pq, C.pq),
        m('fcr', 'deduit', S.fcr, null,
          ['Fléchisseur radial : « wrist flexion, wrist ABDUCTION »',
           'Extenseurs radiaux : « hand extension, hand ABDUCTION »']),
        m('ecrl', 'deduit', S.ecrl, null,
          ['les deux abduisent le poignet',
           'leurs composantes de flexion et d’extension s’annulent']),
        m('ecrb', 'deduit', S.ecrb, null,
          ['les deux abduisent le poignet',
           'leurs composantes de flexion et d’extension s’annulent']),
        m('flechisseurs_doigts', 'tient', S.fds, C.fds_doigts)
      ],
      note: 'La composition de deux gestes déjà sourcés : la PRONATION et la '
          + 'DÉVIATION RADIALE. C’est ce que la fédération décrit du '
          + 'toproll — « you pronate and slide your grip up toward your '
          + 'opponent’s fingertips ». Le geste tactique, lui, reste dans la '
          + 'case Mouvements.'
    },
    {
      id: 'hook-poulie',
      nom: 'Hook à la poulie',
      aussi: ['Cable hook', 'Hook à la sangle'],
      geste: 'Le poignet se referme et le coude se plie, contre une poulie '
           + 'ou une sangle.',
      muscles: [
        m('fcr', 'moteur', S.fcr, C.fcr),
        m('long_palmaire', 'moteur', S.pl, C.pl),
        m('fcu', 'moteur', S.fcu, C.fcu),
        m('flechisseurs_doigts', 'aide', S.fds, C.fds),
        m('long_flechisseur_pouce', 'aide', S.fpl, C.fpl),
        m('supinateur', 'moteur', S.tawf, C.hook_sup),
        m('biceps', 'moteur', S.bic, C.bic),
        m('brachial', 'moteur', S.bra, C.bra)
      ],
      note: 'LA ROTATION A ÉTÉ TRANCHÉE PAR MB le 2026-10-23 : le hook se '
          + 'tient en SUPINATION. Le supinateur entre, le rond pronateur '
          + 'sort. — Deux sources se contredisaient, et le carnet les a '
          + 'portées toutes les deux plutôt que d’arbitrer en silence : '
          + 'l’article de 2026 décrit le hook « in combination with forearm '
          + 'PRONATION » et nomme le rond pronateur « particularly '
          + 'crucial », quand le glossaire de la fédération de Toronto dit '
          + 'que la supination est « the heart of the hook ». C’est une '
          + 'étude de RÉÉDUCATION sur onze athlètes avec une épicondylite : '
          + 'sa pronation décrit vraisemblablement la charge en torsion qui '
          + 'les a blessés, pas le geste voulu. MB hooke ; la page web, '
          + 'non. — Le reste était sûr des deux côtés : le poignet se '
          + 'referme, le coude se plie.'
    },
    {
      id: 'tenue-cup',
      nom: 'Cup hold',
      aussi: ['Tenue en cup', 'Tenue de poignet fermé'],
      geste: 'Le poignet reste fermé sous la charge, sans bouger.',
      muscles: [
        m('fcr', 'tient', S.fcr, C.fcr),
        m('long_palmaire', 'tient', S.pl, C.pl),
        m('fcu', 'tient', S.fcu, C.fcu),
        m('flechisseurs_doigts', 'tient', S.fds, C.fds),
        m('long_flechisseur_pouce', 'tient', S.fpl, C.fpl)
      ],
      note: 'Les mêmes muscles que le wrist curl, au rang « tient » : ce qui '
          + 'change est le régime, pas le geste. Le carnet ne distingue pas '
          + 'les régimes — c’est une question ouverte depuis le lot 2, et ce '
          + 'lot ne la tranche pas non plus.'
    },

    /* ================= LOT 4 : LES ÉPAULES ET LE DOS =================
       La famille la plus pauvre du carnet. Sur 28 noms, DOUZE ne proposent
       rien, et presque tout ce qui répond ne rend qu'UN SEUL muscle.

       MB, 2026-10-23 : « ya différents dips, qui travaillent différentes
       zones. N'oublie pas les tractions et les pompes. Le développé
       militaire ne travaille pas que le pectoral, d'ailleurs je n'ai pas
       l'impression que c'est le cas nan ? Et puis il ne faut pas oublier le
       développé incliné. »

       Il a raison sur les quatre points, et le quatrième est mesuré :
       « Développé militaire » rend LE PECTORAL SEUL, alors que le moteur
       est le DELTOÏDE — « Acromial part: abduction of the arm beyond the
       initial 15° » — avec le triceps qui tend les coudes.

       UN TROU DU CARNET, COMME LES INTEROSSEUX : le HAUSSEMENT D'ÉPAULES
       travaille le TRAPÈZE, que les 36 muscles ne contiennent pas. Le
       carnet rend « Deltoïde » aujourd'hui, parce que le nom contient
       « épaules ». C'est faux, et c'est la dernière question du lot. */
    {
      id: 'developpe-militaire',
      nom: 'Développé militaire',
      aussi: ['Overhead press', 'Développé épaules', 'Shoulder press',
              'Développé militaire debout'],
      geste: 'La barre part des épaules et monte au-dessus de la tête, les '
           + 'coudes se tendent.',
      muscles: [
        m('grand_pectoral', 'aide', S.pm, C.pm),
        m('deltoide', 'moteur', S.delt, C.delt),
        m('triceps', 'moteur', S.tri, C.tri)
      ],
      note: 'TU AVAIS RAISON : ce nom rend aujourd’hui le PECTORAL SEUL. Le '
          + 'moteur est le deltoïde, qui abduit le bras, avec le triceps qui '
          + 'tend les coudes. Le pectoral n’est pas absent pour autant — son '
          + 'chef claviculaire fléchit le bras — mais il passe au rang '
          + '« aide ».'
    },
    {
      id: 'developpe-couche',
      nom: 'Développé couché',
      aussi: ['Bench press', 'Développé barre', 'Développé haltères'],
      geste: 'Allongé, la barre descend sur la poitrine et remonte bras '
           + 'tendus.',
      muscles: [
        m('grand_pectoral', 'moteur', S.pm, C.pm),
        m('deltoide', 'moteur', S.delt, C.delt),
        m('triceps', 'moteur', S.tri, C.tri)
      ],
      note: 'Aujourd’hui : le pectoral seul.'
    },
    {
      id: 'developpe-incline',
      nom: 'Développé incliné',
      aussi: ['Incline bench press', 'Développé incliné barre',
              'Développé incliné haltères'],
      geste: 'Le même geste, banc relevé : la charge part plus haut sur la '
           + 'poitrine.',
      muscles: [
        m('grand_pectoral', 'moteur', S.pm, C.pm),
        m('deltoide', 'moteur', S.delt, C.delt),
        m('triceps', 'moteur', S.tri, C.tri)
      ],
      note: 'MÊME LISTE QUE LE COUCHÉ, ET C’EST ASSUMÉ. L’inclinaison '
          + 'déplace la charge vers le chef CLAVICULAIRE du pectoral et le '
          + 'deltoïde antérieur — mais le carnet ne distingue pas les chefs '
          + 'd’un muscle, il n’a qu’une entrée « Grand pectoral ». Écrire '
          + 'deux listes différentes serait inventer une précision que le '
          + 'modèle n’a pas.'
    },
    {
      id: 'dips-pectoraux',
      nom: 'Dips prise large',
      aussi: ['Dips pectoraux', 'Dips buste penché', 'Chest dips',
              'Dips pecs'],
      geste: 'Buste penché en avant, coudes écartés : la poitrine descend '
           + 'entre les barres.',
      muscles: [
        m('grand_pectoral', 'moteur', S.pm, C.pm),
        m('deltoide', 'aide', S.delt, C.delt),
        m('triceps', 'moteur', S.tri, C.tri)
      ],
      note: 'TU AS DEMANDÉ LA DISTINCTION, et le carnet rendait « Dips → '
          + 'Triceps » pour les deux. MAIS ELLE N’EST PAS SOURCÉE : je n’ai '
          + 'trouvé aucune mesure comparant les dips prise large et prise '
          + 'serrée. Que le pectoral mène d’un côté et le triceps de '
          + 'l’autre est un raisonnement sur les bras de levier — le mien, '
          + 'et les deux badges rouges le disent. Les pompes et les '
          + 'tractions, elles, ont été mesurées, et la mesure a REFUSÉ de '
          + 'les séparer. Il se peut donc que celle-ci ne tienne pas non '
          + 'plus. À toi : on la garde en l’état, ou on fond les deux dips '
          + 'en une entrée tant qu’on n’a pas de mesure.'
    },
    {
      id: 'dips-triceps',
      nom: 'Dips prise serrée',
      aussi: ['Dips triceps', 'Dips buste droit', 'Triceps dips',
              'Dips verticaux'],
      geste: 'Buste droit, coudes serrés le long du corps : le corps descend '
           + 'et remonte à la force des triceps.',
      muscles: [
        m('deltoide', 'aide', S.delt, C.delt),
        m('triceps', 'moteur', S.tri, C.tri),
        m('ancone', 'aide', S.anc, C.anc)
      ]
    },
    {
      id: 'traction',
      nom: 'Traction',
      aussi: ['Pull up', 'Chin up', 'Tractions', 'Traction prise large',
              'Traction prise serrée', 'Traction prise neutre',
              'Traction neutre', 'Wide grip pull up', 'Pull ups',
              'Traction prise ouverte', 'Traction prise fermée'],
      geste: 'Suspendu à la barre, le corps monte jusqu’à ce que le menton '
           + 'passe.',
      muscles: [
        m('grand_dorsal', 'moteur', S.ld, C.ld),
        m('grand_rond', 'moteur', S.tm, C.tm),
        m('biceps', 'moteur', S.bic, C.bic),
        m('brachial', 'moteur', S.bra, C.bra)
      ],
      note: 'UNE SEULE ENTRÉE POUR TOUTES LES PRISES, et la mesure est '
          + 'encore plus nette que pour les pompes. Dickie et al. 2017 '
          + 'comparent supination, pronation, prise neutre et corde sur '
          + 'dix-neuf hommes entraînés : le SEUL écart significatif porte '
          + 'sur le TRAPÈZE MOYEN — un muscle que le carnet n’a pas. Pour '
          + 'le grand dorsal, le biceps, le deltoïde et le pectoral, '
          + 'l’activation est SEMBLABLE d’une prise à l’autre. Autrement '
          + 'dit : la seule différence mesurée entre un chin up et une '
          + 'traction prise large est INVISIBLE pour ce carnet. Les séparer '
          + 'serait inventer une distinction que personne n’a mesurée. — '
          + '« Traction pronation » et « traction supination » ont été '
          + 'RETIRÉES des écritures : elles portent les mots de la rotation '
          + 'de l’avant-bras, qui désignent les pronateurs et le '
          + 'supinateur. Un nom qui porte les mots de deux gestes n’en '
          + 'désigne aucun — « chin up » dit la même chose sans collision. '
          + '— La '
          + 'PRISE OUVERTE ou FERMÉE (pouce autour de la barre ou non) est '
          + 'reconnue comme écriture, mais le carnet a déjà un champ '
          + '« Prise » sur chaque exercice : c’est là qu’elle se note, pas '
          + 'dans une entrée séparée. — Le carnet rendait « Dorsal » tout '
          + 'court, pour toutes ces écritures.'
    },
    {
      id: 'pompes',
      nom: 'Pompes',
      aussi: ['Push up', 'Pompe', 'Push ups', 'Pompes prise large',
              'Pompes prise serrée', 'Pompes diamant', 'Diamond push up',
              'Wide push up', 'Pompes déclinées', 'Pompes inclinées',
              'Pompes serrées'],
      geste: 'Au sol, le corps descend et remonte sur les bras.',
      muscles: [
        m('grand_pectoral', 'moteur', S.pm, C.pm, null,
          { source: S.pompes2025, cite: C.pompes_rang }),
        m('deltoide', 'aide', S.delt, C.delt),
        m('triceps', 'moteur', S.tri, C.tri, null,
          { source: S.pompes2025, cite: C.pompes_rang })
      ],
      note: 'UNE SEULE ENTRÉE POUR TOUTES LES PRISES, ET C’EST LA MESURE QUI '
          + 'LE DIT — pas mon intuition, qui aurait séparé. L’étude de 2025 '
          + 'compare standard, diamant et prise large sur vingt hommes : ce '
          + 'qui change est l’INTENSITÉ, pas les muscles. Le triceps est '
          + 'au-dessus du pectoral dans les TROIS, et le diamant donne le '
          + 'plus pour les deux. Le carnet ne modélise pas l’intensité : '
          + 'leur donner des listes différentes serait inventer. Les onze '
          + 'écritures sont toutes reconnues. — RÉSERVE SUR LE RANG : '
          + 'l’étude normalise chaque muscle sur son PROPRE pic, ce qui rend '
          + 'la comparaison entre deux muscles fragile. C’est pourquoi le '
          + 'pectoral reste « moteur » avec le triceps au lieu de reculer : '
          + 'la mesure classe leurs intensités, elle ne dit pas que le '
          + 'pectoral cesse de mener. Ce sont les deux PREMIERS RANGS CITÉS '
          + 'du catalogue — tous les autres sont encore raisonnés.'
    },
    {
      id: 'rowing',
      nom: 'Rowing',
      aussi: ['Tirage horizontal', 'Rowing barre', 'Rowing haltère',
              'Rowing buste penché'],
      geste: 'Buste penché, la charge est tirée vers le ventre, coudes le '
           + 'long du corps.',
      muscles: [
        m('grand_dorsal', 'moteur', S.ld, C.ld),
        m('grand_rond', 'moteur', S.tm, C.tm),
        m('biceps', 'moteur', S.bic, C.bic),
        m('brachial', 'moteur', S.bra, C.bra)
      ]
    },
    {
      id: 'tirage-vertical',
      nom: 'Tirage vertical',
      aussi: ['Lat pulldown', 'Tirage poulie haute', 'Tirage nuque'],
      geste: 'Assis, la barre haute est tirée vers la poitrine.',
      muscles: [
        m('grand_dorsal', 'moteur', S.ld, C.ld),
        m('grand_rond', 'moteur', S.tm, C.tm),
        m('biceps', 'moteur', S.bic, C.bic),
        m('brachial', 'moteur', S.bra, C.bra)
      ]
    },
    {
      id: 'elevation-laterale',
      nom: 'Élévation latérale',
      aussi: ['Lateral raise', 'Élévations latérales'],
      geste: 'Bras le long du corps, ils montent sur les côtés jusqu’à '
           + 'l’horizontale.',
      muscles: [
        m('deltoide', 'moteur', S.delt, C.delt)
      ],
      note: 'UN SEUL MUSCLE, et c’est juste : « Acromial part: abduction of '
          + 'the arm beyond the initial 15° ». Le carnet n’a pas le '
          + 'sus-épineux, qui lance les quinze premiers degrés.'
    },
    {
      id: 'extension-triceps',
      nom: 'Extension triceps',
      aussi: ['Pushdown', 'Barre au front', 'Extension à la poulie',
              'Skull crusher', 'Extension nuque', 'Kickback',
              'Triceps poulie', 'Extension haltère', 'Extension au-dessus '
            + 'de la tête', 'Triceps corde'],
      geste: 'Le coude se tend contre la charge.',
      muscles: [
        m('triceps', 'moteur', S.tri, C.tri),
        m('ancone', 'aide', S.anc, C.anc)
      ],
      note: 'UNE SEULE ENTRÉE POUR DIX ÉCRITURES, et c’est volontaire. Tu as '
          + 'raison qu’il y a beaucoup d’exercices de triceps — pushdown, '
          + 'barre au front, extension nuque, kickback — mais ils emploient '
          + 'tous le MÊME muscle, et le carnet n’a qu’une entrée « Triceps '
          + 'brachial », sans ses trois chefs. Leur donner des listes '
          + 'différentes serait inventer une précision que le modèle n’a '
          + 'pas. En revanche chaque écriture est reconnue, donc chacun de '
          + 'ces noms te proposera ses muscles. — Les deux exercices de '
          + 'triceps dont la liste DIFFÈRE vraiment ont leur entrée à eux : '
          + 'les dips triceps (l’anconé et le deltoïde entrent) et le '
          + 'développé serré (le pectoral entre).'
    },
    {
      id: 'developpe-serre',
      nom: 'Développé serré',
      aussi: ['Close grip bench press', 'Développé couché prise serrée',
              'Close grip'],
      geste: 'Allongé, mains rapprochées : les coudes restent près du corps '
           + 'et se tendent.',
      muscles: [
        m('grand_pectoral', 'aide', S.pm, C.pm),
        m('deltoide', 'aide', S.delt, C.delt),
        m('triceps', 'moteur', S.tri, C.tri)
      ],
      note: 'C’est le développé couché dont le TRICEPS devient le moteur : '
          + 'les coudes serrés raccourcissent le bras de levier du pectoral, '
          + 'qui passe au rang « aide ». Aujourd’hui ce nom rend le pectoral '
          + 'seul.'
    },
    {
      id: 'side-pressure-poulie',
      nom: 'Side pressure à la poulie',
      aussi: ['Presse de côté', 'Side pressure'],
      geste: 'Le bras pousse vers l’intérieur et tourne la paume vers le '
           + 'corps, contre une poulie.',
      muscles: [
        m('grand_pectoral', 'moteur', S.pm, C.pm),
        m('deltoide', 'moteur', S.delt, C.delt),
        m('coraco_brachial', 'aide', S.cb, C.cb),
        m('subscapulaire', 'moteur', S.sub, C.sub)
      ],
      note: 'DÉCRIT PAR L’ANATOMIE, pas repris de la liste terrain. Le geste '
          + 'est une ADDUCTION du bras avec ROTATION INTERNE : le pectoral '
          + 'et le subscapulaire le disent mot pour mot. La FORCE « side '
          + 'pressure » de la case Mouvements, elle, garde sa liste terrain '
          + 'et sa source — ce sont deux choses, à deux endroits.'
    },
    {
      id: 'back-pressure-poulie',
      nom: 'Back pressure à la poulie',
      aussi: ['Tirage arrière', 'Back pressure', 'Pression arrière'],
      geste: 'Le bras tire vers l’arrière et vers le corps, contre une '
           + 'poulie.',
      muscles: [
        m('grand_pectoral', 'aide', S.pm, C.pm),
        m('grand_dorsal', 'moteur', S.ld, C.ld),
        m('grand_rond', 'moteur', S.tm, C.tm),
        m('triceps', 'aide', S.tri, C.tri)
      ],
      note: 'Même principe : une EXTENSION du bras avec adduction. Le grand '
          + 'dorsal et le grand rond la portent ; le chef sterno-costal du '
          + 'pectoral et la longue portion du triceps étendent aussi le '
          + 'bras, d’où leur rang « aide ».'
    },
    {
      id: 'haussement-epaules',
      ecarte: 'un trou du carnet',
      nom: 'Haussement d’épaules',
      aussi: ['Shrug', 'Shrugs', 'Haussements'],
      geste: 'Les épaules montent vers les oreilles, bras tendus sous la '
           + 'charge.',
      muscles: [
        m('deltoide', 'moteur', S.delt, C.delt)
      ],
      note: 'ÉCARTÉ, ET C’EST UN TROU DU CARNET. Le haussement d’épaules '
          + 'travaille le TRAPÈZE, que les 36 muscles ne contiennent pas. '
          + 'Aujourd’hui le carnet rend « Deltoïde » — parce que le nom '
          + 'contient « épaules » — et c’est faux : le deltoïde abduit le '
          + 'bras, il ne hausse pas l’épaule. Deux issues possibles : '
          + 'ajouter le trapèze au carnet, ou faire en sorte que ce nom ne '
          + 'propose RIEN plutôt que du faux. À toi.'
    }
  ];

  exports.CATALOGUE = {
    lot: 1,
    titre: 'Le poignet et l’avant-bras',
    RANGS: RANGS,
    MOUVEMENTS: MOUVEMENTS
  };
})(window);
