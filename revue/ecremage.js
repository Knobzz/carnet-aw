/* CE QUE LES QUATRE RECHERCHES ONT TROUVÉ — à trancher par MB.

   MB, 2026-10-30 : « tu me fais une recherche consciencieuse et méthodique
   des exercices que nous avons, et de leurs variantes sur internet, via
   sources sûres […] beaucoup d'informations c'est bien, mais le but n'est
   pas d'en mettre toujours plus […] vérifie parmi les mouvements qu'on a
   déjà, s'il n'y a pas trop ? […] Tout devra être vérifié par mes soins. »

   QUATRE RECHERCHES, UNE PAR BLOC DE MUSCLES — avant-bras (48 écritures),
   épaules (37), dos (33), pectoraux+triceps+biceps (46). Le compte a été
   fait AVANT de lancer, et les trois petits groupes ont été fusionnés pour
   tenir en quatre agents.

   AUCUN AJOUT N'EST PROPOSÉ ICI. La consigne donnée aux quatre était de
   CLASSER et de signaler ce qui est en trop, jamais d'enrichir.

   UNE LIMITE QUE LES QUATRE ONT SIGNALÉE D'ELLES-MÊMES : ExRx.net refuse
   la lecture automatisée (HTTP 403). Sa taxonomie n'a donc PAS pu être
   confirmée, contrairement à ce que la consigne demandait. Ce qui a servi,
   par ordre de fiabilité : un essai contrôlé (PMC11906226), des études EMG
   (Dickie 2017, Ohrnberger 2019, Marcolin 2015), Wikipédia, StrengthLog,
   Catalyst Athletics, puis des catalogues d'exercices.

   RIEN ICI N'ÉCRIT DANS LE CARNET. */
(function (A) {
  'use strict';

  /* --- `quoi` : ce que la recherche conclut ---
     'autre'    : ce n'est pas le même mouvement, ça n'a rien à faire là
     'variante' : un paramètre change vraiment — mal rangé en « autre écriture »
     'doublon'  : ne porte rien de plus, part sans perte
     'question' : aucune source ne tranche, ou un conflit interne */

  var CAS = [

    /* ================= CE QUI N'EST PAS LE MÊME MOUVEMENT ================= */
    { fiche: 'Dead hang', ecr: 'Farmer walk', quoi: 'autre',
      dit: 'Port de charge EN MARCHANT, bras le long du corps. Rien ne le '
         + 'rattache au suspendu sinon la prise tenue.',
      prix: 'Aucune fiche « Farmer walk » n’existe au dictionnaire. Le retirer '
          + 'rend le nom introuvable, alors que les listes de mots-clés '
          + 'musculaires le reconnaissent toujours — il faut le retirer AUX '
          + 'DEUX endroits, ou lui faire sa fiche.' },
    { fiche: 'Dead hang', ecr: 'Marche du fermier', quoi: 'autre',
      dit: 'Traduction du précédent, même verdict.', prix: 'Idem.' },
    { fiche: 'Rowing', ecr: 'Renegade row', quoi: 'autre',
      dit: 'Position de planche en appui sur deux haltères, unilatéral alterné, '
         + 'exigence de gainage. Le rowing est un hinge debout.',
      src: 'MasterClass · Fitness Volt' },
    { fiche: 'Curl biceps', ecr: 'Curl 21', quoi: 'autre',
      dit: 'CE N’EST PAS UN EXERCICE : c’est une MÉTHODE de série (7 + 7 + 7), '
         + 'applicable à n’importe quel curl et même à d’autres groupes. Elle '
         + 'ne décrit aucun geste.',
      src: 'BarBend · Bodybuilding.com (« the 21 method on every body part »)' },
    { fiche: 'Développé serré', ecr: 'Hex press', quoi: 'autre',
      dit: 'Haltères serrés l’un contre l’autre en permanence : adduction '
         + 'ISOMÉTRIQUE en plus du développé. Et c’est un exercice de '
         + 'PECTORAUX, rangé ici dans les triceps.',
      src: 'Breaking Muscle (« part dumbbell bench press and part isometric '
         + 'dumbbell flye ») · ThisIsWhyImFit' },
    { fiche: 'Écarté', ecr: 'Svend press', quoi: 'autre',
      dit: 'C’est un DÉVELOPPÉ : debout, plaques pincées, les coudes '
         + 's’étendent. L’écarté garde l’angle du coude fixe.',
      src: 'Garage Gym Reviews · Fitness Volt',
      prix: 'Classé par la description du geste, pas par une taxonomie : '
          + 'aucune source d’autorité ne le range formellement.' },
    { fiche: 'Handstand push-up', ecr: 'Pompes piquées', quoi: 'autre',
      dit: 'Hanches fléchies, pieds au sol, corps NON inversé : fraction de '
         + 'charge et barème distincts. C’est la progression VERS le HSPU.',
      src: 'StrengthLevel · StrongFirst',
      prix: 'Aucune source de kinésiologie ne le formalise : sites de '
          + 'calisthénie et comparateur de barèmes.' },
    { fiche: 'Handstand push-up', ecr: 'Pike push-up', quoi: 'autre',
      dit: 'Terme anglais du précédent.', src: 'StrengthLevel · StrongFirst' },

    /* ================= DES VARIANTES, PAS DES SYNONYMES ================= */
    { fiche: 'Développé militaire', ecr: 'Behind the neck press', quoi: 'variante',
      dit: 'La barre descend DERRIÈRE la nuque : trajectoire différente, '
         + 'deltoïdes latéral et postérieur nettement plus sollicités.',
      src: 'Muscle & Strength · StrengthLevel · Legion',
      prix: 'Il a son propre barème. Si le carnet veut une fiche par barème, '
          + 'c’est une FICHE à part, pas une variante.' },
    { fiche: 'Oiseau', ecr: 'Pec deck inversé', quoi: 'variante',
      dit: 'Machine guidée, buste vertical, trajectoire imposée.' },
    { fiche: 'Oiseau', ecr: 'Reverse pec deck', quoi: 'variante',
      dit: 'Traduction anglaise de la précédente.' },
    { fiche: 'Rotation externe d’épaule', ecr: 'Rotation externe coude au corps',
      quoi: 'variante',
      dit: 'Fixe l’abduction à 0°. La rotation externe se pratique aussi à 90° '
         + '(position 90/90) : bras de levier et contrainte différents.' },
    { fiche: 'Rotation interne d’épaule', ecr: 'Rotation interne coude au corps',
      quoi: 'variante', dit: 'Même raison que du côté externe.' },
    { fiche: 'Rotation cubaine', ecr: 'Cuban press', quoi: 'variante',
      dit: 'Le Cuban press enchaîne tirage menton + rotation externe + '
         + 'développé. La rotation cubaine en est la version amputée.',
      src: 'FitnessVolt · Sole',
      prix: 'Les bases en font l’exercice PARENT : c’est peut-être le NOM '
          + 'PRINCIPAL qu’il faut inverser. Sources non universitaires.' },
    { fiche: 'Écarté', ecr: 'Écartés Hyght', quoi: 'variante',
      dit: 'Écarté assis sur banc incliné 30–45°, grand arc.',
      src: 'Fitwill',
      prix: 'Le nom « Hyght » n’apparaît que dans des catalogues '
          + 'd’applications, jamais dans une source de référence.' },
    { fiche: 'Écarté', ecr: 'Pec deck', quoi: 'variante',
      dit: 'Même adduction d’épaule, mais machine assise, buste vertical, '
         + 'coudes plus fléchis.', src: 'Wikipedia · Healthline' },
    { fiche: 'Écarté', ecr: 'Butterfly', quoi: 'variante',
      dit: 'Autre nom de la MÊME machine que « Pec deck » — donc aussi un '
         + 'doublon de celle-ci.', src: 'Eisenhorn · Bodybuilding.com' },
    { fiche: 'Pompes', ecr: 'Pompes diamant', quoi: 'variante',
      dit: 'Prise resserrée : déplace la charge vers les triceps, effet mesuré '
         + 'par EMG.', src: 'Marcolin 2015 · revue Muscles 2026' },
    { fiche: 'Pompes', ecr: 'Diamond push up', quoi: 'variante',
      dit: 'Terme anglais du précédent.' },
    { fiche: 'Pompes', ecr: 'Wide push up', quoi: 'variante',
      dit: 'Prise large.', src: 'Marcolin 2015 vs PubMed 26488636',
      prix: 'Les deux études DIVERGENT sur l’effet pectoral.' },
    { fiche: 'Curl biceps', ecr: 'Spider curl', quoi: 'variante',
      dit: 'Couché ventral sur banc à 45°, bras VERTICAUX, consigne explicite '
         + 'de ne pas laisser partir le bras : épaule bloquée autrement.',
      src: 'StrengthLog' },
    { fiche: 'Curl biceps', ecr: 'Drag curl', quoi: 'variante',
      dit: 'La barre LONGE le torse et les coudes partent en arrière : '
         + 'extension d’épaule ajoutée, le coude n’est plus fixe.',
      src: 'Wikipedia',
      prix: 'L’effet sur le chef long est CONTESTÉ — deux sources disent '
          + 'l’inverse l’une de l’autre, et ce sont des pages IA.' },
    { fiche: 'Curl biceps', ecr: 'Bayesian curl', quoi: 'variante',
      dit: 'À la poulie, épaule maintenue EN EXTENSION derrière le corps. '
         + 'Traité comme condition distincte dans un essai de 10 semaines '
         + 'contre le preacher curl — aucune différence d’hypertrophie.',
      src: 'PMC11906226 · StrengthLog · Henselmans' },
    { fiche: 'Curl biceps', ecr: 'Waiter curl', quoi: 'variante',
      dit: 'Un seul haltère tenu SOUS le plateau supérieur, supination '
         + 'maintenue.', src: 'Fitness Volt · Powerlifting Technique',
      prix: 'Les sources sont en désaccord sur la supination réelle.' },
    { fiche: 'Traction prise serrée', ecr: 'Traction neutre', quoi: 'variante',
      dit: '« neutre » = orientation des paumes (face à face), « serrée » = '
         + 'écartement des mains. DEUX AXES DIFFÉRENTS.',
      src: 'Ohrnberger 2019 (EKU) · StrengthLog',
      prix: 'Les trois écritures de cette fiche disent « neutre ». Soit le nom '
          + 'est juste et les trois partent, soit la fiche porte en réalité la '
          + 'prise neutre et c’est le NOM qui est faux.' },
    { fiche: 'Traction prise serrée', ecr: 'Traction prise neutre', quoi: 'variante',
      dit: 'Même confusion, mesurée comme une prise DISTINCTE de la serrée.',
      src: 'Ohrnberger 2019 (EKU)' },
    { fiche: 'Traction prise serrée', ecr: 'Neutral grip pull up', quoi: 'variante',
      dit: 'Même confusion, en anglais.', src: 'StrengthLog' },
    { fiche: 'Traction partielle prise serrée', ecr: 'Traction partielle neutre',
      quoi: 'variante', dit: 'La confusion serrée / neutre, répétée.' },
    { fiche: 'Traction partielle prise serrée', ecr: 'Partial neutral grip pull up',
      quoi: 'variante', dit: 'Idem, en anglais.' },

    /* ================= CE QUI NE PORTE RIEN ================= */
    { fiche: 'Élévation latérale', ecr: 'Élévations latérales', quoi: 'doublon',
      dit: 'Pluriel pur du nom principal.' },
    { fiche: 'Élévation latérale', ecr: 'Side lateral raise', quoi: 'doublon',
      dit: 'Doublon anglais de « Lateral raise ».' },
    { fiche: 'Élévation frontale', ecr: 'Élévations frontales', quoi: 'doublon',
      dit: 'Pluriel pur.' },
    { fiche: 'Rotation cubaine', ecr: 'Rotations cubaines', quoi: 'doublon',
      dit: 'Pluriel pur.' },
    { fiche: 'Rotation externe d’épaule', ecr: 'Rotation externe', quoi: 'doublon',
      dit: 'Troncature du nom principal, déjà contenue dedans.' },
    { fiche: 'Rotation interne d’épaule', ecr: 'Rotation interne', quoi: 'doublon',
      dit: 'Troncature du nom principal.' },
    { fiche: 'Rotation externe d’épaule', ecr: 'Rotateurs externes', quoi: 'doublon',
      dit: 'Nomme le MUSCLE, pas le geste — ambigu et redondant.' },
    { fiche: 'Rotation interne d’épaule', ecr: 'Rotateurs internes', quoi: 'doublon',
      dit: 'Nomme le muscle, pas le geste.' },
    { fiche: 'Oiseau', ecr: 'Rear delt fly', quoi: 'doublon',
      dit: 'Doublon anglais de « Reverse fly ».' },
    { fiche: 'Pompes', ecr: 'Pompe', quoi: 'doublon', dit: 'Singulier.' },
    { fiche: 'Pompes', ecr: 'Push ups', quoi: 'doublon', dit: 'Pluriel de « Push up ».' },
    { fiche: 'Développé serré', ecr: 'Close grip', quoi: 'doublon',
      dit: 'Abréviation de « Close grip bench press ».' },
    { fiche: 'Barre au front', ecr: 'Barre front', quoi: 'doublon',
      dit: '« Barre au front » sans le « au ».' },
    { fiche: 'Extension verticale des triceps', ecr: 'Extension verticale',
      quoi: 'doublon', dit: 'Nom principal tronqué.' },
    { fiche: 'Extension verticale des triceps', ecr: 'Extensions verticales',
      quoi: 'doublon', dit: 'Le même, au pluriel.' },
    { fiche: 'Kickback', ecr: 'Triceps kickback', quoi: 'doublon',
      dit: 'Le même terme que « Kickback triceps », dans l’autre ordre.' },
    { fiche: 'Dips prise large', ecr: 'Dips pecs', quoi: 'doublon',
      dit: 'Trois écritures disent « pectoraux » ; une suffit.' },
    { fiche: 'Dips prise large', ecr: 'Chest dips', quoi: 'doublon',
      dit: 'Idem, en anglais.' },
    { fiche: 'Dips prise serrée', ecr: 'Triceps dips', quoi: 'doublon',
      dit: 'Même terme que « Dips triceps », ordre inversé.' },
    { fiche: 'Dips prise serrée', ecr: 'Dips verticaux', quoi: 'doublon',
      dit: 'Redit « Dips buste droit ».' },
    { fiche: 'Curl biceps', ecr: 'Curl spider', quoi: 'doublon',
      dit: 'Ni anglais ni français : la moins défendable des trois écritures '
         + 'de « Spider curl ».' },
    { fiche: 'Curl biceps', ecr: 'Curl araignée', quoi: 'doublon',
      dit: 'Troisième écriture du même nom.' },
    { fiche: 'Curl concentré', ecr: 'Curl concentration', quoi: 'doublon',
      dit: '« Curl concentré » mal accordé.' },
    { fiche: 'Curl Zottman', ecr: 'Zottman curl', quoi: 'doublon',
      dit: 'Le même terme, ordre inversé.' },
    { fiche: 'Chin up', ecr: 'Chin ups', quoi: 'doublon',
      dit: 'Pluriel pur — `slugCherche` retire déjà le « s » final.' },
    { fiche: 'Haussement d’épaules', ecr: 'Shrugs', quoi: 'doublon',
      dit: 'Pluriel de « Shrug » : une seule des deux suffit.' },
    { fiche: 'Haussement d’épaules', ecr: 'Haussements', quoi: 'doublon',
      dit: 'Tronque le nom principal, déjà couvert par lui.' },
    { fiche: 'Traction partielle', ecr: 'Partial traction', quoi: 'doublon',
      dit: 'LE MOT N’EXISTE PAS en anglais pour ce geste : les sources disent '
         + '« partial pull-up », « half pull-up », « partial reps ».',
      src: 'Caliverse · BarBend' },
    { fiche: 'Gripper', ecr: 'Serrage', quoi: 'doublon',
      dit: 'Littéralement contenu dans « Serrage de poing » : même panier, '
         + 'même rang. On ne perd RIEN.' },
    { fiche: 'Curl pronation à la poulie', ecr: 'Pronation curl à la poulie',
      quoi: 'doublon',
      dit: 'Tous ses mots sont dans le nom principal. On ne perd rien.' },
    { fiche: 'Curl Larratt', ecr: 'Tenue de coude', quoi: 'doublon',
      dit: '{tenue, coude} ⊂ « Tenue isométrique de coude ».',
      prix: 'On perd le RANG seulement : la frappe retombe dans le panier '
          + '« par mots ».' },
    { fiche: 'Dead hang', ecr: 'Barre fixe en tenue', quoi: 'doublon',
      dit: '{tenue, barre} déjà dans « Tenue à la barre », et « Suspension » '
         + 'reste.', prix: 'On perd le rang seulement.' },
    { fiche: 'Wrist curl côté pouce', ecr: 'Wrist curl accentué pouce',
      quoi: 'doublon',
      dit: 'L’accentuation est déjà dite deux fois (côté, bord).',
      prix: 'On perd le seul mot « accentué ».' },
    { fiche: 'Extenseurs à élastique', ecr: 'Ouverture des doigts', quoi: 'doublon',
      dit: 'Redit « Ouverture de la main » avec un autre mot — une seule des '
         + 'deux suffit.',
      prix: 'On perd la frappe exacte « ouverture doigts ».' },

    /* ================= CE QU’AUCUNE SOURCE NE TRANCHE ================= */
    { fiche: 'Déviation ulnaire', ecr: 'Chop', quoi: 'question',
      dit: 'AUCUNE source externe ne le définit. Ni Wikipédia (qui liste les '
         + 'pressions : cupping, pronation, supination, rising, side/back '
         + 'pressure, posting), ni ArmProgress (66 exercices, aucune entrée '
         + '« chop » ni « ulnar »), ni les sites de rééducation. Classé '
         + '« même geste » UNIQUEMENT parce que c’est TON mot.' },
    { fiche: 'Wrist curl', ecr: 'Cupping', quoi: 'question',
      dit: 'Wikipédia donne raison au rangement actuel (cupping = la flexion). '
         + 'Mais ArmProgress sépare « Cupping » de « Wrist curls », et au bras '
         + 'de fer cupping nomme d’ordinaire une PRESSION TENUE.',
      prix: 'CONSÉQUENCE MESURABLE : taper « cupping » tombe sur une fiche en '
          + 'REPS, pas sur « Cup hold » qui est en CHARGE + DURÉE — exactement '
          + 'le doublon déjà payé avec « Tenue en cup ».' },
    { fiche: 'Supination', ecr: 'Supination à la clé', quoi: 'question',
      dit: 'CONFLIT INTERNE, pas d’arbitrage externe : le catalogue '
         + 'd’équipement envoie la clé de poignet sur « Wrist curl » et '
         + '« Wrist curl inversé » (les bords étant un réglage de mousqueton), '
         + 'alors que cette écriture l’envoie sur « Supination ». Une seule '
         + 'fiche produit de faible qualité parle de « pronation & supination '
         + 'drills ».',
      prix: 'Reste à savoir si « à la clé » désigne chez toi la clé de poignet '
          + 'ou un levier chargé au bout.' },
    { fiche: 'Développé militaire', ecr: 'Strict press', quoi: 'question',
      dit: 'Aucune source ne tranche : les uns les donnent interchangeables, '
         + 'les autres réservent « military » aux talons joints — et notent '
         + 'que le développé militaire se fait souvent ASSIS, ce qui '
         + 'contredit « strict ».' },
    { fiche: 'Croix de fer', ecr: '(la fiche entière)', quoi: 'question',
      dit: 'AUCUNE source d’armwrestling n’emploie ce nom, et il couvre DEUX '
         + 'choses : le maintien aux anneaux (gymnastique) et le maintien '
         + 'd’haltères bras tendus. Ambigu tant que la fiche ne dit pas '
         + 'laquelle.' },
    { fiche: 'Side pressure à la poulie', ecr: 'Side pressure', quoi: 'question',
      dit: 'En armwrestling, « side pressure » nomme une DIRECTION DE PRESSION '
         + 'pendant le duel, pas un exercice. L’écriture courte expose à la '
         + 'lire comme la technique.', src: 'Armpower' },
    { fiche: 'Side pressure à la poulie', ecr: 'Presse de côté', quoi: 'question',
      dit: 'AUCUNE source francophone n’emploie ce terme. Usage local, ou '
         + 'écriture inventée ?' },
    { fiche: 'Back pressure à la poulie', ecr: 'Back pressure', quoi: 'question',
      dit: 'Wikipédia définit la back pressure comme l’une des trois pressions '
         + 'du bras de fer — donc une TECHNIQUE. La seule référence '
         + 'd’entraînement trouvée est un dispositif en planche (IronMind), '
         + 'pas un exercice à la poulie. Nom maison probable.' },
    { fiche: 'Curl rising à la poulie', ecr: '(la fiche entière)', quoi: 'question',
      dit: 'AUCUNE source trouvée ne définit ce mouvement, ni en français ni '
         + 'en anglais. Les catalogues ne connaissent que le « cable curl ». '
         + 'Soit c’est un nom de salle, soit c’est autre chose sous un nom '
         + 'inhabituel.' },
    { fiche: 'Extension triceps', ecr: '(le nom est générique)', quoi: 'question',
      dit: '« Extension triceps » recouvre « Extension verticale des triceps » : '
         + 'les deux fiches se chevauchent, et « Pushdown » est la seule '
         + 'écriture qui désigne vraiment un geste.' },
    { fiche: 'Dips prise large', ecr: '(le nom nomme le mauvais paramètre)',
      quoi: 'question',
      dit: 'Ce qui discrimine les dips est l’INCLINAISON DU BUSTE, pas la '
         + 'prise. « Dips buste penché » et « Dips buste droit » nomment le '
         + 'bon paramètre ; « prise large » et « prise serrée » le mauvais.',
      prix: 'Les chiffres EMG qui circulent (26 %, 35 %) sont cités par des '
          + 'blogs SANS que les études soient vérifiables.' },
    { fiche: 'Curl Larratt', ecr: '(six écritures pour une chose)',
      quoi: 'question',
      dit: 'Les six sont justes, mais cinq disent la même chose avec un mot '
         + 'différent. En garder six est un choix de CONFORT DE FRAPPE, pas '
         + 'une exigence de vocabulaire. Combien en veux-tu ?' },
    { fiche: 'Pull-over', ecr: '(rangé sous DOS)', quoi: 'question',
      dit: 'L’EMG est partagée : plusieurs travaux donnent le PECTORAL '
         + 'dominant ou à égalité avec le grand dorsal. Son rangement sous '
         + 'DOS est discutable, pas faux.' },
    { fiche: 'Traction', ecr: '(HUIT fiches de traction)', quoi: 'question',
      dit: 'Pull up · Chin up · prise serrée · prise large · partielle · '
         + 'partielle supinée · partielle prise serrée · partielle prise '
         + 'large. La recherche conclut : UNE fiche (deux axes de variantes) '
         + 'ou DEUX (pull up / chin up). L’amplitude est traitée partout '
         + 'comme une VARIABLE D’ENTRAÎNEMENT, pas comme un exercice ; '
         + 'l’écartement des mains comme un RÉGLAGE (l’étude EKU s’intitule '
         + '« EMG for Pull-Up Grip MODIFICATIONS »).',
      src: 'Kassiano 2023 · Brookbush 2025 · Ohrnberger 2019 · Dickie 2017',
      prix: 'ATTENTION — LES QUATRE « PARTIELLE », C’EST TOI QUI LES AS '
          + 'DEMANDÉES, le 29/10 : « moi j’ai l’impression quand j’en fais, '
          + 'que l’accent sur les muscles de l’avant-bras sont plus forts, le '
          + 'fait de devoir rester à moitié engagé rajoute une isométrie ». '
          + 'Et AUCUNE des sources citées ne porte sur le bras de fer : elles '
          + 'parlent d’hypertrophie en population générale. L’agent le '
          + 'reconnaît lui-même. Ne rien retirer ici sans que tu le dises.' },
    { fiche: 'Traction prise serrée', ecr: '(le nom, ou ses écritures)',
      quoi: 'question',
      dit: 'Ses TROIS écritures disent toutes « neutre ». Soit le nom est '
         + 'juste et les trois partent, soit la fiche porte en réalité la '
         + 'prise neutre et c’est le NOM qui est faux.' },
    { fiche: '(les huit tractions)', ecr: '(un défaut de structure)',
      quoi: 'question',
      dit: 'Chaque fiche ne spécifie QU’UN des deux axes : « Chin up » dit '
         + 'l’orientation mais pas la largeur, « Traction prise serrée » dit '
         + 'la largeur mais pas l’orientation. Une traction serrée PRONÉE et '
         + 'une serrée SUPINÉE tombent donc sous le même nom.' }
  ];

  /* Une suppression se fait DEUX FOIS : les mêmes chaînes sont recopiées
     dans les listes de mots-clés musculaires du modèle, qui divergeraient
     sinon. C'est la note la plus opérationnelle des quatre rapports. */
  var AVERTISSEMENT_SUPPRESSION =
    'Toute écriture retirée doit l’être AUX DEUX ENDROITS : dans `aussi`, et '
  + 'dans les listes de mots-clés musculaires de `js/model.js`. Les oublier '
  + 'les ferait diverger.';

  A.ecremage = { CAS: CAS, AVERTISSEMENT_SUPPRESSION: AVERTISSEMENT_SUPPRESSION };
})(window.App || (window.App = {}));
