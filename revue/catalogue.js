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

  var RANGS = {
    moteur: {
      nom: 'moteur',
      quoi: 'la source le nomme dans son TABLEAU D’ACTIONS pour ce geste'
    },
    aide: {
      nom: 'aide',
      quoi: 'la source ne le met pas au tableau d’actions, mais écrit dans '
          + 'son texte qu’il y participe — second rang, et c’est dit'
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
    pt: 'Pronation of forearm at the proximal radioulnar joint, flexion of '
      + 'the forearm at the elbow joint',
    pq: 'Radioulnar joints: forearm pronation',
    sup: 'Proximal radioulnar joint: Forearm supination',
    bic: 'Flexion and supination of the forearm at the elbow joint, weak '
       + 'flexor of the arm at the glenohumeral joint',
    fujii: 'PT and ECR showed parallel activities during the static '
         + 'extension [...] the co-contraction of PT and ECR during wrist '
         + 'extension movements occurs to prevent supinating the forearm'
  };

  var m = function (id, rang, src, cite, deDeux) {
    return { id: id, rang: rang, source: src, cite: cite || null,
             deDeux: deDeux || null };
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
    }
  ];

  exports.CATALOGUE = {
    lot: 1,
    titre: 'Le poignet et l’avant-bras',
    RANGS: RANGS,
    MOUVEMENTS: MOUVEMENTS
  };
})(window);
