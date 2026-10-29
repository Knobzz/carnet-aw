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
    brr: {
      qui: 'Kenhub — Brachioradialis', revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/brachioradialis-muscle'
    },
    larratt: {
      qui: 'Devon Larratt, principes d’entraînement rapportés par '
         + 'armwrestlingworld.com — source de TERRAIN, pas une mesure',
      revu: null,
      lien: 'https://armwrestlingworld.com/devon-larratt/'
    },
    bagchi2019: {
      qui: 'Bagchi & Raizada — « A Comparative Electromyographical Analysis '
         + 'of Biceps Brachii and Brachioradialis during eight different '
         + 'types of Biceps Curl », 2019',
      revu: null,
      lien: 'https://www.researchgate.net/publication/341071634_A_Comparative_Electromyographical_Analysis_of_Biceps_Brachii_and_Brachioradialis_during_eight_different_types_of_Biceps_Curl'
    },
    curls2023: {
      qui: 'Comparaison EMG sur hommes entraînés — curl traditionnel, '
         + 'marteau et inversé, AIP Conf. Proc. 2023',
      revu: null,
      lien: 'https://ui.adsabs.harvard.edu/abs/2023AIPC.2750e0008J/abstract'
    },
    kleiber2015: {
      qui: 'Kleiber, Kunz & Disselhorst-Klug — « Muscular coordination of '
         + 'biceps brachii and brachioradialis in elbow flexion with respect '
         + 'to hand position », Frontiers in Physiology 2015, 16 sujets',
      revu: 'Frontiers in Physiology — deux relecteurs nommés',
      lien: 'https://www.frontiersin.org/articles/10.3389/fphys.2015.00215/full'
    },
    trap: {
      qui: 'Kenhub — Trapezius',
      revu: null,
      lien: 'https://www.kenhub.com/en/library/anatomy/trapezius-muscle'
    },
    revueLD2026: {
      qui: 'Revue narrative — « Electromyographic Analysis of Latissimus '
         + 'Dorsi Activation During Common Resistance Training Exercises », '
         + 'Journal of Functional Morphology and Kinesiology 2026 '
         + '(rapporte Youdas 2010, 21 H + 4 F, et Lusk 2010, 12 H : je '
         + 'n’ai pas pu ouvrir ces deux primaires)',
      revu: null,
      lien: 'https://www.mdpi.com/2411-5142/11/3/315'
    },
    marcolin2018: {
      qui: 'Marcolin et al. — « Differences in electromyographic activity of '
         + 'biceps brachii and brachioradialis while performing three '
         + 'variants of curl », PeerJ 2018, 12 sujets',
      revu: null,
      lien: 'https://peerj.com/articles/5165/'
    },
    pompes2025: {
      qui: '« Electromyographic Activation of the Pectoralis Major and '
         + 'Triceps Brachii Muscles During Standard, Diamond, and Wide Hand '
         + 'Position Push-Ups », 2025 — EMG sur 20 hommes',
      revu: null,
      lien: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13029269/'
    },
    krings2021: {
      qui: 'Krings, Shepherd, Swain, Turner, Chander, Waldman, McAllister, '
         + 'Knight & Smith — « Impact of Fat Grip Attachments on Muscular '
         + 'Strength and Neuromuscular Activation During Resistance '
         + 'Exercise », J Strength Cond Res 2021, EMG sur 15 hommes '
         + 'entraînés, huit muscles, cinq exercices',
      revu: null,
      lien: 'https://pubmed.ncbi.nlm.nih.gov/30694963/'
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
      /* NOM CORRIGE le 2026-10-28 : le carnet disait « Giordano et al. ».
         Les auteurs sont MAROTTA et al. — verifie sur la page de l'editeur.
         Une source mal attribuee est une source qu'on ne peut pas
         retrouver. */
      qui: 'Marotta, Lopresti, Zangari et al. (Université de Catanzaro), '
         + '« The Role of Kinematic and Electromyographic '
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
    },
    /* LA COIFFE DES ROTATEURS, entrée au carnet le 2026-10-29. */
    supra: {
      qui: 'Kenhub — Supraspinatus', revu: '2022-12-05',
      lien: 'https://www.kenhub.com/en/library/anatomy/supraspinatus-muscle'
    },
    infra: {
      qui: 'Kenhub — Infraspinatus', revu: '2023-11-03',
      lien: 'https://www.kenhub.com/en/library/anatomy/infraspinatus-muscle'
    },
    tmin: {
      qui: 'Kenhub — Teres minor', revu: '2023-11-03',
      lien: 'https://www.kenhub.com/en/library/anatomy/teres-minor-muscle'
    },
    rhom: {
      qui: 'Kenhub — Rhomboid muscles', revu: '2023-09-19',
      lien: 'https://www.kenhub.com/en/library/anatomy/rhomboid-muscles'
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
    brr: 'Elbow joint: Forearm flexion (when semi pronated)',
    bb_concentre: 'concentrated curl is a more effective exercise for '
                + 'activation of biceps muscles as compared to other '
                + 'exercises with the same load',
    br_marteau: 'hammer curls showed the greatest activation of the '
              + 'brachioradialis',
    bra_inverse: 'brachialis muscle was significantly greater activated '
               + 'during reverse curl compared to hammer and traditional '
               + 'bicep curl',
    bb_position: 'the muscular activity of biceps brachii shows no '
               + 'significant changes in any hand position',
    bb_levier: 'less muscle force can be generated by biceps brachii due to '
             + 'the disadvantaged lever arm at a constant activity',
    br_pronation: 'brachioradialis is an active flexor of the elbow with '
                + 'increasing contribution in pronated hand position',
    trap: 'Transverse part — Scapulothoracic joint: draws scapula medially',
    large_trapeze: 'A wide pronated grip was reported to produce '
                 + 'significantly greater middle trapezius EMG amplitude '
                 + 'compared to narrow pronated, narrow supinated and wide '
                 + 'supinated configurations, with no significant '
                 + 'differences in latissimus dorsi, upper trapezius or '
                 + 'lower trapezius EMG amplitude observed across grip '
                 + 'variants',
    dickie_concentrique: 'The concentric phases of each pull-up variation '
                       + 'resulted in significantly greater EMGARV of the '
                       + 'brachioradialis, biceps brachii, and pectoralis '
                       + 'major in comparison to the eccentric phases',
    dickie_trapeze: 'the pronated grip resulted in significantly greater '
                  + 'EMGPEAK (60.1 ± 22.5 vs. 37.1 ± 13.1%MVIC; P = 0.004) '
                  + 'and EMGARV (48.0 ± 21.2 vs. 27.4 ± 10.7%MVIC; '
                  + 'P = 0.001) of the middle trapezius when compared to the '
                  + 'neutral grip pull-up',
    dickie_similaire: 'EMGPEAK and EMGARV of the shoulder-arm-forearm '
                    + 'complex during complete repetitions of pull-up '
                    + 'variants are similar despite varying hand '
                    + 'orientations',
    fatgrip: 'Electromyography muscle activity was significantly increased '
           + 'in the forearm and shoulder muscles, but significantly '
           + 'decreased in the upper arm muscles with the use of FG during '
           + 'deadlift, bent-over row, and pull-ups',
    fatgrip_curl: 'However, there were no differences for EMG activity for '
                + 'upright row and concentration curl',
    chin_biceps: 'In a mixed sample of 21 men and 4 women, supinated grips '
               + 'elicited greater biceps brachii and pectoralis major EMG '
               + 'amplitude, whereas pronated grips were associated with '
               + 'comparatively higher lower trapezius EMG amplitude '
               + '(Youdas et al., 2010)',
    ld_pronation: 'a pronated grip was associated with greater LD EMG '
                + 'amplitude than a supinated grip in a study of 12 healthy '
                + 'men (Lusk et al., 2010), whereas the supinated variant, '
                + 'despite eliciting lower LD EMG amplitude, was associated '
                + 'with greater biceps brachii EMG amplitude',
    ld_unique: 'Forearm orientation was examined in a single study, which '
             + 'reported greater LD amplitude with a pronated than with a '
             + 'supinated grip; this remains unreplicated',
    largeur_non: 'grip width is not sufficiently supported as a determinant '
               + 'of LD EMG amplitude in this exercise',
    ez_halteres: 'higher activation profile of both BB and BR during the EZ '
               + 'compared to the DC [dumbbell curl]',
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
    supra: 'Shoulder joint: abduction of arm, stabilization of the humeral '
         + 'head in the glenoid cavity',
    infra: 'Shoulder joint: Arm external rotation; Stabilizes humeral head '
         + 'in glenoid cavity',
    tmin: 'Shoulder joint: Arm external rotation, arm adduction; Stabilizes '
        + 'humeral head in glenoid cavity',
    /* UNE SEULE LIGNE POUR LE MAJEUR ET LE MINEUR : l'encart Kenhub ne les
       separe que sur les origines et insertions, pas sur l'action. */
    rhom: 'Scapulothoracic joint: Draws scapula superomedially, Rotates '
        + 'glenoid cavity inferiorly; Supports position of scapula',
    /* LA PARTIE DESCENDANTE DU TRAPEZE, distincte de la transverse deja
       citee plus haut. C'est elle que le haussement d'epaules engage.
       L'encart Kenhub ne porte PAS le mot « elevation » — il est dans le
       corps du texte, et les notes le disent comme tel. */
    trap_desc: 'Descending part (superior fibers) — Scapulothoracic joint: '
             + 'draws scapula superomedially',
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
      nom: 'Rising',
      aussi: ['Déviation radiale', 'Inclinaison radiale', 'Radial deviation',
              'Cable rising', 'Rising à la poulie', 'Rising à la sangle'],
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
          + '(déviation radiale). — L’ENTRÉE « RISER LIFT » A ÉTÉ '
          + 'SUPPRIMÉE le 26/10, et c’est MB qui l’a tranché : « le fait de '
          + 'rajouter Rising à la poulie & cie remplace le riser ». Elle '
          + 'portait les trois muscles radiaux PLUS la prise — fléchisseurs '
          + 'des doigts et du pouce. Ce qui disparaît est donc la prise, et '
          + 'c’est juste : une sangle passée sur les phalanges ne se SERRE '
          + 'pas, et le carnet a un champ Prise pour le cas où l’on tient '
          + 'une poignée. Même argument que sur le curl pronation, où la '
          + 'sangle est au pouce. — « Riser lift », « Riser à la sangle » '
          + 'et « Levée au riser » ne proposent donc plus rien : MB ne les '
          + 'a pas repris dans sa liste d’écritures, et je ne les remets '
          + 'pas de ma propre initiative. '
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
      aussi: ['Déviation cubitale', 'Inclinaison ulnaire', 'Ulnar deviation',
              'Déviation ulnaire au cable'],
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
      aussi: ['Poignée de pronation', 'Pronation à la poulie',
              'Cable pronation', 'Pronation à la sangle'],
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

    /* ================= LOT 5 : LES FLÉCHISSEURS DU COUDE =================
       MB, 2026-10-26 : « je viens de remarquer qu'il y a 0 exercices qui
       concernent le biceps ». Mesuré, et c'est la famille la plus vide du
       carnet : sur 34 noms, VINGT-HUIT ne proposent rien — « Curl » tout
       court compris. Le biceps n'apparaissait que comme ASSISTANT, dans la
       traction, le rowing, le tirage et le hook.

       C'est aussi le premier lot dont les RANGS sont CITÉS plutôt que
       raisonnés : trois études disent quel fléchisseur mène quel curl, ce
       qu'aucune source ne disait pour les lots 1 à 4. Les trois
       fléchisseurs du coude du carnet — biceps, brachial, brachio-radial —
       ne se partagent donc pas les curls au jugé.

       CE QUE LE CARNET NE PEUT PAS DIRE : il n'a qu'une entrée « Biceps »,
       sans ses deux chefs. Or l'incliné étire la longue portion et le
       pupitre la raccourcit. Les listes sont donc identiques, comme pour le
       développé incliné — écrire autre chose serait inventer. */
    {
      id: 'curl',
      nom: 'Curl biceps',
      aussi: ['Curl haltères', 'Curl barre', 'Curl barre EZ',
              'Curl EZ', 'Curl debout', 'Curl à la poulie', 'Cable curl',
              'Curl incliné', 'Incline curl', 'Spider curl', 'Curl araignée',
              'Drag curl', 'Curl 21', 'Bayesian curl', 'Curl à la sangle'],
      geste: 'Le coude se plie, paume vers le haut, contre la charge.',
      muscles: [
        m('biceps', 'moteur', S.bic, C.bic),
        m('brachial', 'moteur', S.bra, C.bra),
        m('brachio_radial', 'aide', S.brr, C.brr)
      ],
      note: 'UNE ENTRÉE POUR QUINZE ÉCRITURES, et le nom nu « Curl » n’en '
          + 'fait PAS partie : renommé « Curl biceps » par MB le 26/10, ce '
          + 'qui met le nom d’accord avec un refus que le modèle porte depuis '
          + 'le lot 1 — « curl » tout court ne propose rien, parce qu’un curl '
          + 'marteau, un curl inversé et un wrist curl ne travaillent pas la '
          + 'même chose. — Le carnet n’a qu’une entrée '
          + '« Biceps », sans longue ni courte portion : l’incliné, le '
          + 'spider et le drag curl changent l’ANGLE de l’épaule et donc '
          + 'l’étirement de la longue portion, mais pas les muscles. Même '
          + 'raison que pour le développé incliné. — Ce qui EST mesuré : la '
          + 'barre EZ et la barre droite activent plus le biceps ET le '
          + 'brachio-radial que les haltères, et le curl haltère plus que '
          + 'le Bayesian à la poulie. Des intensités, pas des muscles. — Le '
          + 'brachio-radial est en « aide », et la RAISON a été corrigée le '
          + '26/10 : ce n’est pas que « la supination le place en mauvaise '
          + 'position ». Ce qui est mesuré, c’est que sa contribution '
          + 'AUGMENTE en pronation — donc elle est plus basse ici. — ET UNE '
          + 'TENSION QU’IL FAUT DIRE : en position supinée, la même étude '
          + 'trouve les deux muscles « constantly on the same level ». Cela '
          + 'ne départage pas « moteur » et « aide », parce qu’un EMG '
          + 'normalisé muscle par muscle ne compare pas deux muscles entre '
          + 'eux. Le rang reste donc RAISONNÉ, en rouge, et c’est juste '
          + 'qu’il le soit.'
    },
    {
      id: 'curl-concentre',
      nom: 'Curl concentré',
      aussi: ['Concentration curl', 'Curl concentration'],
      geste: 'Assis, le coude calé contre la cuisse : rien ne bouge que '
           + 'l’avant-bras.',
      muscles: [
        m('biceps', 'moteur', S.bic, C.bic, null,
          { source: S.bagchi2019, cite: C.bb_concentre }),
        m('brachial', 'aide', S.bra, C.bra),
        m('brachio_radial', 'aide', S.brr, C.brr)
      ],
      note: 'RANG CITÉ : c’est le curl qui active le plus le biceps, mesuré '
          + 'sur huit variantes. Le coude calé supprime l’élan, et c’est '
          + 'vraisemblablement ce qui fait la différence — mais ça, c’est '
          + 'mon explication, pas celle de l’étude.'
    },
    {
      id: 'curl-pupitre',
      nom: 'Preacher curl',
      aussi: ['Curl pupitre', 'Curl Larry Scott', 'Curl au pupitre'],
      geste: 'Le bras repose à plat sur le pupitre incliné, l’épaule en '
           + 'avant : le coude se plie sans que le bras recule.',
      muscles: [
        m('biceps', 'moteur', S.bic, C.bic),
        m('brachial', 'moteur', S.bra, C.bra),
        m('brachio_radial', 'aide', S.brr, C.brr)
      ],
      note: 'C’EST LE CURL DU BRAS DE FER, et c’est Larratt qui le dit : '
          + 'il traite le RISING comme un geste de biceps, et conseille de '
          + '« trouver une barre ou un banc à pupitre » pour l’entraîner. '
          + 'Source de TERRAIN, rapportée par armwrestlingworld.com — pas '
          + 'une mesure, et le rang reste raisonné. — L’épaule est FLÉCHIE, '
          + 'donc la longue portion du biceps part RACCOURCIE, l’inverse du '
          + 'curl incliné où elle part étirée. Le carnet ne distinguant pas '
          + 'les chefs, les deux listes sont identiques ; la différence est '
          + 'écrite ici plutôt que simulée dans les muscles.'
    },
    {
      id: 'curl-marteau',
      nom: 'Hammer curl',
      aussi: ['Curl marteau', 'Curl prise neutre', 'Curl marteau haltères'],
      geste: 'Le coude se plie, pouce vers le haut, la paume regardant le '
           + 'corps.',
      muscles: [
        m('biceps', 'aide', S.bic, C.bic),
        m('brachial', 'moteur', S.bra, C.bra),
        m('brachio_radial', 'moteur', S.brr, C.brr, null,
          { source: S.bagchi2019, cite: C.br_marteau })
      ],
      note: 'RANG CITÉ pour le brachio-radial : c’est le curl qui l’active '
          + 'le plus. Aujourd’hui le carnet ne propose QUE lui — le brachial '
          + 'et le biceps manquent, alors qu’un coude qui se plie les '
          + 'emploie forcément. — RAISON CORRIGÉE le 26/10, après une '
          + 'question de MB : j’avais écrit que la prise neutre « place le '
          + 'biceps en désavantage ». Mesuré sur 16 sujets, son ACTIVATION '
          + 'ne change pas selon la position de la main ; c’est son BRAS DE '
          + 'LEVIER qui est désavantagé. Il passe « aide » parce qu’un autre '
          + 'mène, pas parce qu’il travaille moins.'
    },
    {
      id: 'curl-inverse-coude',
      nom: 'Curl inversé',
      aussi: ['Reverse curl', 'Curl inversé haltères',
              'Curl inversé barre', 'Reverse barbell curl',
              'Curl inversé barre EZ', 'Curl inversé EZ', 'Reverse EZ curl',
              'Curl inversé à la poulie', 'Reverse cable curl'],
      geste: 'Le coude se plie, paume vers le BAS.',
      muscles: [
        m('biceps', 'aide', S.bic, C.bic),
        m('brachial', 'moteur', S.bra, C.bra, null,
          { source: S.curls2023, cite: C.bra_inverse }),
        m('brachio_radial', 'moteur', S.brr, C.brr),
        m('ecrl', 'aide', S.ecrl, C.ecrl),
        m('ecrb', 'aide', S.ecrb, C.ecrb)
      ],
      note: 'DEUX ÉCRITURES RETIRÉES, et MB les a vues avant le banc. '
          + '« Curl pronation » et « Curl prise pronation » figuraient ici ; '
          + 'MB : « le curl pronation est un exercice à part ». Sur le fond '
          + 'il a raison — pronater sous charge est un geste de ROTATION, '
          + 'pas une flexion du coude. Et c’est MESURÉ : ces deux noms '
          + 'rendent « rond pronateur, carré pronateur », jamais les muscles '
          + 'de cette entrée, parce qu’ils portent les mots de DEUX gestes. '
          + 'Troisième fois ce chantier, après « Traction pronation » au lot '
          + '4 et « Rising à la sangle » au lot 3. — ET IL A SA PROPRE '
          + 'ENTRÉE : MB a décrit le geste le même jour (sangle au pouce, '
          + 'rotation ET remontée vers le menton), voir « Curl pronation ». '
          + 'Ici le coude se plie SANS rotation ; là-bas les deux gestes '
          + 'sont dans le même mouvement. — HUIT ÉCRITURES AJOUTÉES le '
          + '26/10 à la demande de MB, sur le modèle de « Curl biceps » : '
          + 'haltères, barre, barre EZ, poulie, et leurs noms anglais. '
          + 'Elles changent l’OUTIL, pas les muscles — exactement comme le '
          + 'curl incliné ou le drag curl sous « Curl biceps ». Ce qui est '
          + 'mesuré sur le curl classique vaut ici sans qu’une source le '
          + 'redise : la barre EZ et la barre droite activent plus que les '
          + 'haltères. Une INTENSITÉ, pas une liste de muscles — donc une '
          + 'écriture, pas une entrée. — '
          + 'RANG CITÉ pour le BRACHIAL : il est activé significativement '
          + 'plus au curl inversé qu’au marteau et au curl classique. '
          + 'C’est la bonne surprise de ce lot — l’intuition dit « brachio-'
          + 'radial », la mesure dit « brachial ». Les deux extenseurs '
          + 'radiaux tiennent le poignet en extension pendant le geste, '
          + 'd’où leur rang « aide » : celui-là est raisonné, pas cité.'
    },
    {
      id: 'curl-zottman',
      nom: 'Curl Zottman',
      aussi: ['Zottman curl'],
      geste: 'On monte en supination et on redescend en pronation, en '
           + 'tournant l’avant-bras en haut du mouvement.',
      muscles: [
        m('biceps', 'moteur', S.bic, C.bic),
        m('brachial', 'moteur', S.bra, C.bra),
        m('brachio_radial', 'moteur', S.brr, C.brr),
        m('supinateur', 'aide', S.sup, C.sup),
        m('rond_pronateur', 'aide', S.pt, C.pt),
        m('carre_pronateur', 'aide', S.pq, C.pq)
      ],
      note: 'AUCUNE MESURE sur ce curl — je l’ai cherché. Sa liste est '
          + 'RAISONNÉE : c’est un curl supination à la montée et un curl '
          + 'inversé à la descente, plus la ROTATION qui fait passer de '
          + 'l’un à l’autre. Les trois fléchisseurs y passent donc, et les '
          + 'rotateurs avec. Tous les rangs sont en rouge, et c’est voulu.'
    },
    {
      id: 'curl-rising',
      nom: 'Curl rising à la poulie',
      aussi: ['Rising cable curl'],
      geste: 'Paume NEUTRE — « ni face au sol, ni face au plafond ». Le '
           + 'poignet penche vers le pouce pendant que le coude remonte. '
           + 'L’avant-bras ne tourne PAS : c’est ce qui sépare ce geste du '
           + 'curl pronation.',
      muscles: [
        m('biceps', 'aide', S.bic, C.bic),
        m('brachial', 'moteur', S.bra, C.bra),
        m('fcr', 'deduit', S.fcr, null,
          ['Fléchisseur radial : « wrist flexion, wrist ABDUCTION » (Kenhub)',
           'Extenseurs radiaux : « hand extension, hand ABDUCTION (radial '
         + 'deviation) » (Kenhub)']),
        m('brachio_radial', 'moteur', S.brr, C.brr, null,
          { source: S.bagchi2019, cite: C.br_marteau }),
        m('ecrl', 'deduit', S.ecrl, null,
          ['les deux abduisent le poignet',
           'leurs composantes de flexion et d’extension s’annulent quand ils '
         + 'tirent ensemble']),
        m('ecrb', 'deduit', S.ecrb, null,
          ['les deux abduisent le poignet',
           'leurs composantes de flexion et d’extension s’annulent quand ils '
         + 'tirent ensemble'])
      ],
      note: 'DEUXIÈME GESTE COMPOSÉ DU CARNET, après le curl pronation, et '
          + 'MB le décrit par lui : « c’est sensiblement le même mouvement, '
          + 'mais en rising ». La moitié poignet est donc une VRAIE '
          + 'déviation — les trois muscles radiaux — et non une flexion '
          + 'accentuée, qui n’en prendrait qu’un. Les trois « déduits » '
          + 'reprennent mot pour mot la dérivation déjà validée de '
          + '« Déviation radiale » : rien de neuf n’est affirmé ici. — '
          + 'IL A FALLU TOUCHER AU MOTEUR DE LECTURE, ce qu’aucun lot '
          + 'n’avait demandé jusqu’ici, et MB l’a autorisé. « rising » est '
          + 'un marqueur de côté, et il était RETIRÉ du nom avant qu’on '
          + 'cherche les mots-clés : aucun mot-clé contenant « rising » ne '
          + 'pouvait donc exister. C’est le piège qui avait fait renommer '
          + '« Rising à la sangle » en « Riser à la sangle » au lot 3 — '
          + 'contourné deux fois, traité la troisième. Portée mesurée avant '
          + 'de toucher : sur 135 noms livrés, 12 portent un mot de côté, '
          + 'et aucun ne change. — CE QUI RESTE RAISONNÉ : le brachial, et '
          + 'les trois déduits du poignet. Le rang du brachio-radial, lui, '
          + 'est CITÉ — c’est la position neutre qui l’a tranché, voir plus '
          + 'bas. Je '
          + 'n’ai PAS repris la citation de Kleiber qui met le biceps en '
          + '« aide » au curl pronation — elle parle de la position de '
          + 'l’avant-bras, pas de la déviation du poignet, et l’emprunter '
          + 'ici serait exactement la faute que la planche traque. — '
          + 'LA POSITION NEUTRE TRANCHE LES RANGS DU COUDE, et c’est MB qui '
          + 'l’a donnée le 26/10 : « ni face au sol, ni face au plafond ». '
          + 'C’est la SEMI-PRONATION — le mot exact de la citation du '
          + 'brachio-radial, « forearm flexion (when semi pronated) ». Pour '
          + 'sa moitié coude, ce geste est donc mécaniquement un CURL '
          + 'MARTEAU, et le carnet le mesure déjà : « hammer curls showed '
          + 'the greatest activation of the brachioradialis ». Le '
          + 'brachio-radial mène, rang CITÉ ; le biceps passe « aide ». — '
          + 'LE JUGEMENT QUE J’ASSUME, et qu’il faut lire : cette citation '
          + 'parle du curl MARTEAU, pas du curl rising. Je l’applique parce '
          + 'que ce que l’étude fait varier est la PRISE — neutre contre '
          + 'supinée contre pronée — et que MB vient de décrire une prise '
          + 'neutre. Si ça te paraît tiré, dis-le : le rang retombe en '
          + 'rouge et rien d’autre ne bouge. — CE QUI NE TRANCHE PAS : '
          + 'Kleiber trouve le biceps et le brachio-radial « constantly on '
          + 'the same level » en neutre. Ça ne contredit pas, ça ne '
          + 'départage pas — un EMG normalisé muscle par muscle ne compare '
          + 'pas deux muscles entre eux, comme déjà écrit sous « Curl '
          + 'biceps ». C’est Bagchi qui départage, pas Kleiber.'
    },
    {
      id: 'curl-pronation',
      nom: 'Curl pronation à la poulie',
      aussi: ['Pronation cable curl'],
      geste: 'Sangle enroulée autour du POUCE : l’avant-bras tourne en '
           + 'pronation PENDANT que le coude remonte, presque jusqu’au '
           + 'menton. Les deux gestes dans le même mouvement.',
      muscles: [
        m('rond_pronateur', 'moteur', S.pt, C.pt, true),
        m('carre_pronateur', 'moteur', S.pq, C.pq),
        m('biceps', 'aide', S.bic, C.bic, null,
          { source: S.kleiber2015, cite: C.bb_levier }),
        m('brachial', 'moteur', S.bra, C.bra),
        m('brachio_radial', 'moteur', S.brr, C.brr, null,
          { source: S.kleiber2015, cite: C.br_pronation })
      ],
      note: 'GESTE DÉCRIT PAR MB, le 26/10 : sangle au pouce, rotation et '
          + 'remontée vers le menton dans le même mouvement. C’est un geste '
          + 'COMPOSÉ, et la seule entrée du lot où un muscle du carnet fait '
          + 'les DEUX moitiés à lui seul : le rond pronateur est cité pour '
          + '« pronation of forearm » ET « flexion of the forearm at the '
          + 'elbow joint ». — LE BICEPS S’ACTIVE, et MB avait raison plus '
          + 'fort qu’il ne le pensait : mesuré sur 16 sujets, son activité ne '
          + 'change PAS selon la position de la main. Ce qui change est son '
          + 'BRAS DE LEVIER, pas son activation — d’où « aide », et le rang '
          + 'est CITÉ. Il est en même temps supinateur, donc il freine la '
          + 'rotation qu’il accompagne ; aucune source ne mesure ce cas, et '
          + 'je ne l’invente pas. — DEUX CHOSES OUVERTES POUR MB : la sangle '
          + 'au POUCE, que le carnet ne sait dire que par le champ Prise et '
          + 'qui n’est donc pas dans cette liste ; et « Curl prise '
          + 'pronation », qui pourrait être une écriture d’ICI plutôt que du '
          + 'curl inversé — à lui de dire, je ne tranche pas.'
    },
    {
      id: 'tenue-coude',
      nom: 'Curl Larratt',
      aussi: ['Tenue de coude', 'Tenue isométrique de coude',
              'Hold de coude', 'Flexion de coude isométrique',
              'Isométrie de coude', 'Larratt curl'],
      geste: 'Le coude reste plié sous la charge, sans bouger.',
      muscles: [
        m('biceps', 'tient', S.bic, C.bic),
        m('brachial', 'tient', S.bra, C.bra),
        m('brachio_radial', 'tient', S.brr, C.brr)
      ],
      note: 'CORRIGÉ LE 26/10, ET C’EST MB QUI L’A TROUVÉ. Cette note '
          + 'disait : « j’ai cherché l’isométrie du coude en bras de fer — '
          + 'chez les pros, chez Larratt : rien, ni protocole, ni mesure, ni '
          + 'même un nom d’exercice établi ». C’est FAUX sur le dernier '
          + 'point. Le nom existe, il porte celui de Larratt, et il est en '
          + 'ligne depuis le 9 décembre 2019 : « The Larratt Curl is an arm '
          + 'wrestling strength exercise that will build up major biceps '
          + 'ISOMETRIC strength and size. You can perform it as a stand '
          + 'alone exercise […] or perform it at the end of your preacher '
          + 'curls » (chaîne Strength and Physique, youtu.be/mS70iYz-eWU). '
          + 'MB me l’avait cité en exemple et je ne l’avais pas couvert. — '
          + 'PALIER TERRAIN, et la limite est nette : cette description '
          + 'établit que l’exercice EXISTE et qu’il est ISOMÉTRIQUE. Elle '
          + 'ne mesure aucun muscle. Les trois restent ceux du curl au rang '
          + '« tient », sur la seule anatomie. — C’EST MB QUI EN A FAIT '
          + 'L’ENTRÉE, le 26/10 : je l’avais posé en simple écriture de '
          + '« Isométrie de coude », il a inversé les deux. Le nom du '
          + 'geste passe donc devant sa description, et « Isométrie de '
          + 'coude » devient une écriture. Le Larratt curl se fait en '
          + 'position de pupitre, mais le carnet ne modélise pas la '
          + 'POSITION et la liste de muscles est la même ; c’est pour ça '
          + 'que les deux tiennent dans une seule entrée. — '
          + 'CE QUE JE N’AI PAS PU VÉRIFIER : un aperçu généré par Google '
          + 'ajoute un balancement du corps et affirme que Larratt ne '
          + 'pratique pas les curls supinés. Ni l’un ni l’autre n’est dans '
          + 'la description d’origine, et YouTube m’a refusé la seconde '
          + 'vidéo. Non vérifié, donc non repris — et de toute façon ce que '
          + 'Larratt pratique n’est pas une affirmation sur les muscles. — '
          + 'Les trois muscles au rang « tient », c’est un RAISONNEMENT : '
          + 'tenir un coude plié emploie ce qui le plie. — Le carnet ne distingue toujours '
          + 'pas les RÉGIMES, question ouverte depuis le lot 2. Au bras de '
          + 'fer la tenue de coude est pourtant centrale : c’est elle qui '
          + 'empêche le bras de s’ouvrir. Le trou est donc réel, et il est '
          + 'nommé : ce qui manque n’est plus le NOM de l’exercice, c’est '
          + 'une MESURE de ce qu’il travaille, et là je n’ai toujours rien '
          + 'trouvé.'
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
      nom: 'Pull up',
      aussi: ['Traction', 'Traction pronée'],
      geste: 'Suspendu à la barre, le corps monte jusqu’à ce que le menton '
           + 'passe.',
      muscles: [
        m('grand_pectoral', 'aide', S.pm, C.pm, null,
          { source: S.tractions2017, cite: C.dickie_concentrique }),
        m('grand_dorsal', 'moteur', S.ld, C.ld),
        m('grand_rond', 'moteur', S.tm, C.tm),
        m('trapeze', 'aide', S.trap, C.trap, null,
          { source: S.tractions2017, cite: C.dickie_trapeze }),
        m('biceps', 'aide', S.bic, C.bic, null,
          { source: S.revueLD2026, cite: C.chin_biceps }),
        m('brachial', 'moteur', S.bra, C.bra),
        m('brachio_radial', 'aide', S.brr, C.brr, null,
          { source: S.tractions2017, cite: C.dickie_concentrique })
      ],
      note: 'SCINDÉE LE 26/10, ET C’EST MB QUI AVAIT RAISON : « toutes les '
          + 'tractions sont dans le même lot, je ne suis pas d’accord ». '
          + 'Cette entrée couvre désormais la PRONATION seule ; la '
          + 'supination a la sienne, « Chin up ». — MA FAUTE, et elle est '
          + 'nette : je concluais sur l’ORIENTATION à partir de Dickie '
          + '2017, qui compare des LARGEURS. Deux études mesurent '
          + 'l’orientation et trouvent un écart sur des muscles que le '
          + 'carnet A : plus de biceps et de grand pectoral en supination, '
          + 'plus de grand dorsal en pronation. — MAIS LA LARGEUR, ELLE, '
          + 'NE TIENT PAS : « grip width is not sufficiently supported as a '
          + 'determinant of LD EMG amplitude ». — LA QUATRIÈME TRACTION DE '
          + 'MB, la PRISE LARGE, n’a donc pas d’entrée, et la raison est '
          + 'précise : la SEULE différence mesurée de la prise large porte '
          + 'sur le TRAPÈZE MOYEN — « a wide pronated grip was reported to '
          + 'produce significantly greater middle trapezius EMG amplitude '
          + 'compared to narrow pronated, narrow supinated and wide '
          + 'supinated configurations, with NO significant differences in '
          + 'latissimus dorsi, upper trapezius or lower trapezius ». Or le '
          + 'carnet n’a AUCUN trapèze : vérifié, zéro sur trente-six '
          + 'muscles. Lui donner une entrée aujourd’hui produirait une '
          + 'liste identique à celle-ci, mot pour mot. Le choix appartient '
          + 'à MB : soit on AJOUTE le trapèze au modèle — c’est un trou '
          + 'qu’il connaît déjà, signalé au haussement d’épaules — et la '
          + 'prise large devient une vraie entrée, soit elle reste une '
          + 'écriture. Je ne tranche pas à sa place. — « Prise serrée » a '
          + 'quitté cette entrée : MB la définit comme « paumes face à '
          + 'face », donc elle est allée à la prise neutre. Le carnet faisait exactement l’inverse : il séparait '
          + 'par la largeur, qui ne se mesure pas, et fusionnait par '
          + 'l’orientation, qui se mesure. — CE QUE JE N’AI PAS FAIT : '
          + 'reculer le grand dorsal en « aide » ici ou là. L’écart de '
          + 'dorsal entre les deux prises vient d’UNE étude, et la revue '
          + 'écrit elle-même « this remains unreplicated ». Le seul rang '
          + 'que je bouge est celui du BICEPS, que deux sources '
          + 'rapportent. — '
          + 'CE QUI MANQUE ENCORE ICI, et MB l’a nomme le 26/10 : les '
          + 'PARTIAL PULL UPS — on tient l’isometrie et on fait des '
          + 'moities, ce qui met l’accent sur le coude et l’avant-bras. '
          + 'Rien n’a ete cherche : c’est a faire quand on reviendra '
          + 'aux mouvements, apres l’equipement. Ecrit ici parce que '
          + 'c’est la qu’on le cherchera. — '
          + 'Dickie et al. 2017 '
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
      id: 'traction-large',
      nom: 'Traction prise large',
      aussi: ['Traction large', 'Wide grip pull up', 'Wide pull up'],
      geste: 'Suspendu à la barre PAUMES VERS LE MUR et les mains bien '
           + 'écartées, le corps monte jusqu’à ce que le menton passe.',
      muscles: [
        m('grand_pectoral', 'aide', S.pm, C.pm, null,
          { source: S.tractions2017, cite: C.dickie_concentrique }),
        m('grand_dorsal', 'moteur', S.ld, C.ld),
        m('grand_rond', 'moteur', S.tm, C.tm),
        m('trapeze', 'aide', S.trap, C.trap, null,
          { source: S.tractions2017, cite: C.dickie_trapeze }),
        m('biceps', 'aide', S.bic, C.bic, null,
          { source: S.revueLD2026, cite: C.chin_biceps }),
        m('brachial', 'moteur', S.bra, C.bra),
        m('brachio_radial', 'aide', S.brr, C.brr, null,
          { source: S.tractions2017, cite: C.dickie_concentrique })
      ],
      note: 'LA QUATRIÈME TRACTION DE MB, et la seule qui ait exigé un '
          + 'MUSCLE NEUF. Tant que le carnet n’avait pas de trapèze, cette '
          + 'entrée aurait eu une liste identique à celle de « Traction » — '
          + 'un doublon, pas une variante. MB a autorisé l’ajout le 26/10, '
          + 'et le trapèze est devenu le trente-septième muscle. — CE QUI '
          + 'EST MESURÉ, ET C’EST LA SEULE DIFFÉRENCE TROUVÉE : « a wide '
          + 'pronated grip was reported to produce significantly greater '
          + 'middle trapezius EMG amplitude compared to narrow pronated, '
          + 'narrow supinated and wide supinated configurations ». La même '
          + 'phrase dit aussi ce qui NE change PAS : « with no significant '
          + 'differences in latissimus dorsi, upper trapezius or lower '
          + 'trapezius ». Le grand dorsal reste donc identique aux trois '
          + 'autres tractions — l’idée courante que la prise large « fait '
          + 'les dorsaux » n’est pas soutenue, et la revue l’écrit : « grip '
          + 'width is not sufficiently supported as a determinant of LD EMG '
          + 'amplitude ». — LA LIMITE, ET ELLE EST SÉRIEUSE : la mesure '
          + 'porte sur le faisceau MOYEN du trapèze, et le carnet n’a '
          + 'qu’UN trapèze. La gravure de Gray teinte le muscle entier, et '
          + 'il n’existe pas de planche par faisceau dans le domaine '
          + 'public utilisée ici. Le carnet dit donc « trapèze » là où la '
          + 'source dit « trapèze moyen ». Même limite que les deux chefs '
          + 'du biceps. — Le BICEPS est en « aide » comme dans toutes les '
          + 'prises pronées, pour la raison citée chez « Traction ».'
    },
    {
      id: 'traction-neutre',
      nom: 'Traction prise serrée',
      aussi: ['Traction neutre', 'Traction prise neutre',
              'Neutral grip pull up'],
      geste: 'Suspendu à deux poignées PARALLÈLES, paumes face à face, le '
           + 'corps monte jusqu’à ce que le menton passe.',
      muscles: [
        m('grand_pectoral', 'aide', S.pm, C.pm, null,
          { source: S.tractions2017, cite: C.dickie_concentrique }),
        m('grand_dorsal', 'moteur', S.ld, C.ld),
        m('grand_rond', 'moteur', S.tm, C.tm),
        m('biceps', 'aide', S.bic, C.bic, null,
          { source: S.revueLD2026, cite: C.chin_biceps }),
        m('brachial', 'moteur', S.bra, C.bra),
        m('brachio_radial', 'aide', S.brr, C.brr, null,
          { source: S.tractions2017, cite: C.dickie_concentrique })
      ],
      note: 'LA TROISIÈME TRACTION DE MB : « paumes face à face ». Ce qui la '
          + 'distingue des deux autres est le BRACHIO-RADIAL, qu’aucune '
          + 'd’elles ne porte. La base est la même que pour le Curl rising, '
          + 'et elle est citée deux fois : la paume face à face place '
          + 'l’avant-bras en SEMI-PRONATION, et le brachio-radial fléchit '
          + 'le coude « when semi pronated » (Kenhub) ; c’est en prise '
          + 'neutre qu’il est le plus activé (Bagchi, huit variantes de '
          + 'curl). Le modèle le faisait DÉJÀ sans entrée : « Traction '
          + 'prise marteau » propose le brachio-radial depuis le lot 5, par '
          + 'le mot « marteau ». — LE BICEPS EST EN « AIDE », ET CE RANG '
          + 'EST RAISONNÉ : aucune source ne compare la prise neutre à la '
          + 'supinée sur le biceps. Je le place comme au curl marteau, par '
          + 'cohérence, et c’est un jugement — pas une mesure. — '
          + '« TRACTION PRISE SERRÉE » EST RANGÉE ICI, parce que MB l’a '
          + 'définie comme « paumes face à face ». ATTENTION : dans l’usage '
          + 'courant, « prise serrée » veut dire ÉTROITE, pas parallèle, et '
          + 'elle désigne alors une traction pronée. C’est le carnet de MB, '
          + 'donc c’est sa définition qui vaut — mais elle est écrite ici '
          + 'pour qu’on ne la redécouvre pas dans six mois. — AUCUNE MESURE '
          + 'ne compare la prise neutre aux autres sur les muscles du dos : '
          + 'Dickie 2017 les trouve SEMBLABLES. Le dorsal et le grand rond '
          + 'sont donc identiques aux deux autres entrées, et c’est voulu.'
    },
    {
      id: 'chin-up',
      nom: 'Chin up',
      aussi: ['Chin ups', 'Traction supinée', 'Traction prise supinée'],
      geste: 'Suspendu à la barre PAUME VERS SOI, le corps monte jusqu’à ce '
           + 'que le menton passe.',
      muscles: [
        m('grand_pectoral', 'aide', S.pm, C.pm, null,
          { source: S.tractions2017, cite: C.dickie_concentrique }),
        m('grand_dorsal', 'moteur', S.ld, C.ld),
        m('grand_rond', 'moteur', S.tm, C.tm),
        m('biceps', 'moteur', S.bic, C.bic, null,
          { source: S.revueLD2026, cite: C.chin_biceps }),
        m('brachial', 'moteur', S.bra, C.bra),
        m('brachio_radial', 'aide', S.brr, C.brr, null,
          { source: S.tractions2017, cite: C.dickie_concentrique })
      ],
      note: 'ENTRÉE NEUVE, et elle vient d’un désaccord de MB : « il y en a '
          + 'au moins 4 différents, qui ciblent des muscles différents ». Il '
          + 'avait raison sur le fond, et la mesure en donne TROIS sur '
          + 'ses quatre : la pronation, la supination et la prise '
          + 'neutre. La quatrième, la prise LARGE, attend le trapèze — '
          + 'voir la note de « Traction ». — CE QUI SÉPARE CETTE '
          + 'ENTRÉE DE « TRACTION » : le BICEPS y mène au lieu d’aider, et '
          + 'le GRAND PECTORAL entre. Les deux viennent de la même citation, '
          + 'et les deux muscles sont au carnet. C’est le premier cas où un '
          + 'muscle change de rang entre deux variantes d’un même geste — '
          + 'ce que MB demandait depuis le lot 4. — LE PECTORAL EST EN '
          + '« AIDE », ET LA CITATION EST COMPARATIVE : elle dit qu’il est '
          + 'PLUS actif en supination qu’en pronation, pas qu’il mène. '
          + 'L’écrire « moteur » serait lui faire dire plus qu’elle ne dit. '
          + '— « Traction supination » n’est PAS une écriture : ce nom '
          + 'porte les mots de la rotation de l’avant-bras et propose le '
          + 'supinateur. « Traction supinée » et « Traction prise supinée » '
          + 'passent, elles — mesuré, pas supposé. — Les écritures de '
          + 'LARGEUR restent chez « Traction » : la revue écrit que la '
          + 'largeur n’est pas soutenue par les données.'
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
      nom: 'Haussement d’épaules',
      aussi: ['Shrug', 'Shrugs', 'Haussements', 'Dumbbell shrug',
              'Haussement d’épaules avec haltères', 'Shrug barre',
              'Shrugs avec haltères', 'Shrug à la poulie',
              'Shrugs avec élastique', 'Shrug à la machine à mollets',
              'Overhead shrug', 'Barbell shrug'],
      geste: 'Les épaules montent vers les oreilles, bras tendus sous la '
           + 'charge.',
      muscles: [
        m('trapeze', 'moteur', S.trap, C.trap_desc),
        m('rhomboides', 'aide', S.rhom, C.rhom)
      ],
      note: 'IL N’EST PLUS ÉCARTÉ, ET C’EST UNE MESURE QUI LE DIT. Sa note '
          + 'disait « le TRAPÈZE, que les 36 muscles ne contiennent pas ». '
          + 'Elle est périmée : le trapèze est entré au carnet avec le LOT 5 '
          + '(commit 480183f, « fait entrer le TRENTE-SEPTIÈME muscle »), et '
          + 'son champ `quoi` dit mot pour mot « rapproche les omoplates et '
          + 'hausse les épaules ». L’obstacle qui l’avait fait écarter '
          + 'n’existe plus.  CE QUI MANQUE SE DIT : l’ANGULAIRE DE '
          + 'L’OMOPLATE n’est pas au carnet, faute de planche libre — la '
          + 'seule trouvée n’est du domaine public qu’aux États-Unis. Or sa '
          + 'ligne Kenhub est MOT POUR MOT celle de la partie descendante du '
          + 'trapèze : « Draws scapula superomedially ». Ce geste propose '
          + 'donc la moitié de ce qu’il travaille, et c’est écrit.  '
          + 'L’ENCART KENHUB NE DIT PAS « elevation » : ses trois parties '
          + 'sont décrites sans ce mot, qui vit dans le CORPS du texte — '
          + '« The descending (upper) fibers act with the levator scapulae '
          + 'muscle to produce an elevation of the scapula at the '
          + 'scapulothoracic joint ». On cite la ligne de l’encart, et cette '
          + 'phrase-ci reste une note : on ne fait pas passer l’une pour '
          + 'l’autre.'
    },

    /* ================= LOT 6 : LES ÉPAULES, LES NOMS =================

       MB, 29/10 : « Ne prends pas en compte les muscles impactés, on fera
       nos recherches sur les muscles ailleurs que sur ce site. On commence
       par les épaules, tu me fais une simulation avec le nom des mouvements
       comme on avait fait, je valide les noms + noms connus et on lance. »

       DONC `muscles: []` PARTOUT ICI. Ce lot ne propose QUE des noms. Les
       muscles entreront après, d’une source anatomique citée — pas de
       docteur-fitness, qui ne cite aucune référence sur aucune de ses
       fiches.

       MESURE QUI OUVRE LE LOT, sur les 58 noms de la page « exercices
       épaules » de docteur-fitness : 19 ne proposent RIEN, et surtout
       DIX-SEPT rendent « Deltoïde » et rien d’autre. Un face pull, un
       développé militaire et une rotation externe reçoivent la même
       réponse, parce que le carnet lit « épaule » dans le nom et conclut.
       Une réponse fausse coûte plus cher qu’une absence : on ne corrige pas
       ce qui a répondu.

       LE REGROUPEMENT SUIT LE CRITÈRE DE MB, posé au lot 2 : « peut-on
       faire ce geste avec un autre outil, ou sans ? » Si oui, l’outil ne
       fait pas un mouvement de plus — « élévations latérales à la poulie »
       est une AUTRE ÉCRITURE d’« élévation latérale », pas une fiche. */
    {
      id: 'elevation-frontale',
      nom: 'Élévation frontale',
      aussi: ['Front raise', 'Élévations frontales',
              'Élévation frontale à la poulie',
              'Élévation frontale allongée à la barre',
              'Élévation frontale sur banc incliné',
              'Élévations frontales à la poulie basse',
              'Élévations frontales avec élastique', 'Dumbbell front raise'],
      geste: 'Bras tendu, la charge monte DEVANT soi jusqu’à hauteur '
           + 'd’épaule.',
      muscles: [
        m('deltoide', 'moteur', S.delt, C.delt),
        m('grand_pectoral', 'aide', S.pm, C.pm)
      ],
      note: 'Absente du carnet. Cinq écritures sur le site, aucune reconnue.'
    },
    {
      id: 'oiseau',
      nom: 'Oiseau',
      aussi: ['Reverse fly', 'Rear delt fly', 'Élévation latérale buste penché',
              'Bent over lateral raise', 'Oiseau assis sur un banc',
              'Oiseau à la poulie à 45°', 'Oiseau avec élastique',
              'Oiseau inversé avec sangles de suspension', 'Écartés arrière',
              'Écartés arrière avec élastique', 'Pec deck inversé',
              'Reverse pec deck',
              'Extension horizontale des épaules avec élastique'],
      geste: 'Buste penché ou appuyé, les bras s’ouvrent vers l’ARRIÈRE, '
           + 'coudes légèrement fléchis.',
      muscles: [
        m('deltoide', 'moteur', S.delt, C.delt),
        m('rhomboides', 'aide', S.rhom, C.rhom),
        m('trapeze', 'aide', S.trap, C.trap),
        m('infra_epineux', 'aide', S.infra, C.infra),
        m('petit_rond', 'aide', S.tmin, C.tmin)
      ],
      note: 'La fiche qui absorbe le plus de noms : six du site, sous quatre '
          + 'appellations sans rapport les unes avec les autres — « oiseau », '
          + '« écartés arrière », « pec deck inversé », « extension '
          + 'horizontale ». C’est exactement ce que les autres écritures '
          + 'servent à rattraper. À noter : « Oiseau inversé avec sangles de '
          + 'suspension » rend aujourd’hui SIX muscles du GRIP, parce que le '
          + 'carnet y lit « suspension ».'
    },
    {
      id: 'face-pull',
      nom: 'Face pull',
      aussi: ['Face pull couché à la poulie', 'Tirage visage',
              'Tirage à la corde au visage', 'Rope face pull'],
      geste: 'La corde est tirée vers le visage, coudes hauts, les mains '
           + 'passant de part et d’autre de la tête.',
      muscles: [
        m('deltoide', 'moteur', S.delt, C.delt),
        m('infra_epineux', 'aide', S.infra, C.infra),
        m('petit_rond', 'aide', S.tmin, C.tmin),
        m('rhomboides', 'aide', S.rhom, C.rhom),
        m('trapeze', 'aide', S.trap, C.trap)
      ],
      note: 'Absent du carnet sous toute forme, alors que c’est un geste '
          + 'd’arrière d’épaule très programmé.'
    },
    {
      id: 'tirage-menton',
      nom: 'Tirage menton',
      aussi: ['Upright row', 'Tirage menton à la barre',
              'Tirage menton à la poulie', 'Tirage menton avec kettlebell',
              'Tirage menton avec élastique', 'Tirage menton à la barre guidée'],
      geste: 'La charge longe le corps et monte vers le menton, coudes au-'
           + 'dessus des mains.',
      muscles: [
        m('deltoide', 'moteur', S.delt, C.delt),
        m('trapeze', 'aide', S.trap, C.trap_desc),
        m('biceps', 'aide', S.bic, C.bic),
        m('brachial', 'aide', S.bra, C.bra)
      ],
      note: 'Absent, et PIRE qu’absent : le carnet répond aujourd’hui '
          + '« Dorsal » à ses trois écritures du site, parce qu’il y lit '
          + '« tirage ».'
    },
    {
      id: 'rotation-externe-epaule',
      nom: 'Rotation externe d’épaule',
      aussi: ['External rotation', 'Rotation externe', 'Rotateurs externes',
              'Rotation externe coude au corps',
              'Rotation externe de l’épaule couchée avec haltère',
              'Rotation externe de l’épaule à la poulie',
              'Rotation externe de l’épaule en abduction avec élastique',
              'Rotations externes de l’épaule avec élastique'],
      geste: 'Coude fléchi et fixe, l’avant-bras s’écarte vers l’EXTÉRIEUR '
           + 'en tournant le bras dans l’épaule.',
      muscles: [
        m('infra_epineux', 'moteur', S.infra, C.infra),
        m('petit_rond', 'moteur', S.tmin, C.tmin),
        m('deltoide', 'aide', S.delt, C.delt)
      ],
      note: 'La coiffe des rotateurs. Quatre écritures sur le site, aucune '
          + 'reconnue — et c’est un geste qui compte au bras de fer.'
    },
    {
      id: 'rotation-interne-epaule',
      nom: 'Rotation interne d’épaule',
      aussi: ['Internal rotation', 'Rotation interne', 'Rotateurs internes',
              'Rotation interne coude au corps',
              'Rotation interne à 90° à la poulie',
              'Rotations internes de l’épaule avec élastique'],
      geste: 'Même position, l’avant-bras revient vers le VENTRE : le bras '
           + 'tourne vers l’intérieur dans l’épaule.',
      muscles: [
        m('subscapulaire', 'moteur', S.sub, C.sub),
        m('grand_pectoral', 'aide', S.pm, C.pm),
        m('grand_dorsal', 'aide', S.ld, C.ld),
        m('grand_rond', 'aide', S.tm, C.tm),
        m('deltoide', 'aide', S.delt, C.delt)
      ],
      note: 'L’autre moitié de la coiffe. Deux écritures sur le site.'
    },
    {
      id: 'rotation-cubaine',
      nom: 'Rotation cubaine',
      aussi: ['Cuban rotation', 'Cuban press', 'Rotations cubaines',
              'Rotation cubaine à la barre'],
      geste: 'Un tirage menton, puis une rotation externe, puis un développé '
           + '— les trois enchaînés sans lâcher.',
      muscles: [
        m('deltoide', 'moteur', S.delt, C.delt),
        m('infra_epineux', 'aide', S.infra, C.infra),
        m('petit_rond', 'aide', S.tmin, C.tmin),
        m('trapeze', 'aide', S.trap, C.trap_desc),
        m('triceps', 'aide', S.tri, C.tri),
        m('biceps', 'aide', S.bic, C.bic)
      ],
      note: 'Un geste NOMMÉ, pas une variante d’engin : il porte un nom '
          + 'propre, comme le Zottman côté biceps. C’est ce qui lui vaut sa '
          + 'fiche plutôt qu’une place dans les autres écritures.'
    },
    {
      id: 'developpe-arnold',
      nom: 'Développé Arnold',
      aussi: ['Arnold press', 'Développé Arnold avec haltères'],
      geste: 'Un développé qui part paumes vers soi et tourne en montant, '
           + 'pour finir paumes vers l’avant.',
      muscles: [
        m('deltoide', 'moteur', S.delt, C.delt),
        m('grand_pectoral', 'aide', S.pm, C.pm),
        m('triceps', 'aide', S.tri, C.tri),
        m('infra_epineux', 'aide', S.infra, C.infra),
        m('petit_rond', 'aide', S.tmin, C.tmin)
      ],
      note: 'Même raisonnement que la rotation cubaine : un nom propre, donc '
          + 'une fiche.'
    },
    {
      id: 'elevation-y',
      nom: 'Élévation en Y',
      aussi: ['Y raise', 'Élévation en Y à la poulie', 'Y-raise'],
      geste: 'Bras tendus, la charge monte en DIAGONALE vers le haut et '
           + 'l’extérieur : les deux bras dessinent un Y.',
      muscles: [
        m('deltoide', 'moteur', S.delt, C.delt),
        m('trapeze', 'aide', S.trap, C.trap_desc),
        m('supra_epineux', 'aide', S.supra, C.supra)
      ],
      note: 'Une seule écriture sur le site. Je la propose SÉPARÉE de '
          + 'l’oiseau parce que le bras MONTE au lieu de partir en arrière. '
          + 'Si tu préfères en faire une autre écriture de l’oiseau, '
          + 'renomme-la ici et ça suffira.'
    },
    {
      id: 'handstand-push-up',
      nom: 'Handstand push-up',
      aussi: ['HSPU', 'Pompes en équilibre', 'Pompes piquées', 'Pike push-up',
              'Handstand push-up avec sangles de suspension'],
      geste: 'En appui tête en bas contre un mur, les bras fléchissent puis '
           + 'poussent : un développé vertical au poids du corps.',
      muscles: [
        m('deltoide', 'moteur', S.delt, C.delt),
        m('triceps', 'moteur', S.tri, C.tri),
        m('grand_pectoral', 'aide', S.pm, C.pm)
      ],
      note: 'Les pompes piquées sont le même geste en plus accessible : une '
          + 'autre écriture, pas une fiche.'
    },
    {
      id: 'croix-de-fer',
      nom: 'Croix de fer',
      aussi: ['Iron cross', 'Croix de fer avec haltères'],
      geste: 'Bras écartés à l’horizontale, tenus sous la charge sans '
           + 'bouger.',
      muscles: [
        m('deltoide', 'tient', S.delt, C.delt),
        m('supra_epineux', 'tient', S.supra, C.supra)
      ],
      note: 'Je la propose parce qu’elle est TENUE et non dynamique — le '
          + 'carnet sait déjà noter ça en secondes, avec la colonne Durée.'
    },

    /* ---- LES QUATRE ÉCARTÉS DU LOT 6 ----
       Une liste d’écartés n’est pas un reliquat : c’est ce qui évite qu’on
       reprenne la même discussion au lot suivant. */
    {
      id: 'thruster',
      ecarte: 'le bas du corps',
      nom: 'Thruster',
      aussi: ['Thruster avec kettlebell', 'Thruster à la landmine'],
      geste: 'Un squat, puis un développé au-dessus de la tête dans le même '
           + 'élan.',
      muscles: [],
      note: 'ÉCARTÉ. La moitié du geste est dans les JAMBES, et le carnet '
          + 'n’a aucun muscle de jambe : une fiche « thruster » mentirait '
          + 'par omission, et rien à l’écran ne dirait qu’elle ment.'
    },
    {
      id: 'arrache-halftere',
      ecarte: 'le bas du corps',
      nom: 'Arraché avec haltère',
      aussi: ['Dumbbell snatch'],
      geste: 'L’haltère part du sol et finit bras tendu au-dessus de la '
           + 'tête, en un seul mouvement.',
      muscles: [],
      note: 'ÉCARTÉ, même raison : un mouvement de corps entier, venu des '
          + 'haltérophiles. Le carnet ne couvre pas le bas du corps.'
    },
    {
      id: 'rotations-russes-developpe',
      ecarte: 'pas d’oblique au carnet',
      nom: 'Rotations russes avec développé épaules',
      aussi: [],
      geste: 'Le tronc tourne d’un côté puis de l’autre entre deux '
           + 'développés.',
      muscles: [],
      note: 'ÉCARTÉ. La rotation vient du TRONC, et le carnet n’a pas '
          + 'd’oblique. Le reste est un développé déjà couvert.'
    },
    {
      id: 'passage-epaule',
      ecarte: 'mobilité',
      nom: 'Passage d’épaule avec élastique',
      aussi: ['Shoulder dislocate', 'Passage d’épaule'],
      geste: 'L’élastique tenu large passe de devant à derrière le corps, '
           + 'bras tendus.',
      muscles: [],
      note: 'ÉCARTÉ. C’est de la MOBILITÉ, pas une série qu’on charge : rien '
          + 'à compter en charge × reps, ni en temps sous tension.'
    }
  ];

  exports.CATALOGUE = {
    lot: 6,
    titre: 'Les épaules',
    RANGS: RANGS,
    MOUVEMENTS: MOUVEMENTS
  };
})(window);
