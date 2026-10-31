/* LES EXPLICATIONS DES MOUVEMENTS DE BASE — premier lot, 2026-10-31.

   MB : « On peut ensuite attaquer les explications, il faudra aussi les
   explications pour chacun des gestes, si tu ne trouves pas d'explications
   pour certains gestes, tu me le dis et je les écrirai. »

   L'AMPLEUR, MESURÉE AVANT DE COMMENCER : 58 fiches et 32 gestes, soit
   **90 explications**. Celles des 32 gestes sont écrites (fichiers
   `explications-gestes`, `gestes-ajoutes`, `tractions-regroupees`). Il
   restait les 58 mouvements de base, et **aucun n'en avait**.

   CE LOT EN COUVRE DOUZE, et ce n'est pas un choix au hasard : ce sont
   ceux qu'une source de référence du BRAS DE FER décrit elle-même, pas des
   pages d'agrégateur. MB : « évidemment venant de sources sûres &
   vérifiées, pas du wikipedia bullshit. »

   LA SOURCE PRINCIPALE : StrengthLog, « Arm Wrestling Strength Training:
   Guide & Program » (Andreas Abelsson, 2 décembre 2025), lu en entier. Son
   programme en huit semaines liste onze exercices avec leur exécution pas à
   pas ET la raison pour laquelle ils servent au bras de fer — ce second
   point est ce qu'aucune fiche générique ne donne.

   MESURE AU PASSAGE, ET ELLE EST BONNE : les ONZE exercices de ce
   programme sont DÉJÀ au dictionnaire. Le carnet couvre entièrement la
   référence.

   `faire` est reformulé, jamais recopié. `pourquoi_aw` est ce que la source
   dit du bras de fer. `garde` existe quand elle nomme une erreur. */
(function (A) {
  'use strict';

  var BASE = {
    /* ---------------- avant-bras, le cœur du sujet ---------------- */
    'Wrist curl': {
      faire: 'Barre en prise supination, avant-bras posés sur les cuisses ou '
           + 'sur un banc. On laisse la barre rouler vers le bout des doigts, '
           + 'puis on referme la main et on remonte par la seule flexion du '
           + 'poignet.',
      pourquoi_aw: 'C’est le mouvement qui tient le « cup » — la main fermée '
           + 'sur celle de l’adversaire. Si ton poignet part en arrière, tu '
           + 'perds le levier, et souvent le match.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Wrist curl inversé': {
      faire: 'Même position, mais prise en pronation, paumes vers le bas. On '
           + 'laisse descendre puis on relève le poignet.',
      pourquoi_aw: 'Les extenseurs stabilisent le poignet contre la traction '
           + 'de l’adversaire. Si le poignet s’effondre, la chaîne de force '
           + 'est rompue.',
      garde: 'La source conseille une barre plus épaisse que la normale, ou '
           + 'des fat grips, pour charger davantage les muscles concernés.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Pronation': {
      faire: 'À la poulie, côté du bras travaillé. Coude à 90° au corps, paume vers l’intérieur ; on tourne pour l’amener vers le bas.',
      pourquoi_aw: 'Les pronateurs — le rond pronateur en premier — sont ce '
           + 'qui fait un toproll fort : ils créent le couple qui roule la '
           + 'main de l’adversaire vers l’extérieur.',
      garde: 'Commencer léger et travailler le contrôle. Et ne pas laisser '
           + 'le câble ramener l’avant-bras d’un coup au retour.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Supination': {
      faire: 'À la poulie, mais le côté travaillé tourné À L’OPPOSÉ de la '
           + 'machine, le câble traversant le corps. Coude à 90° au corps, '
           + 'paume vers le bas au départ, on tourne pour l’amener vers le '
           + 'haut.',
      pourquoi_aw: 'Le supinateur sert les techniques qui vivent paume vers '
           + 'le haut — le hook — et c’est lui qui répond quand l’adversaire '
           + 'cherche à te proner.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },

    /* ---------------- bras ---------------- */
    'Curl inversé': {
      faire: 'Comme un curl, mais barre en prise pronation, mains un peu '
           + 'plus larges que les épaules. Bras collés au corps, on fléchit '
           + 'les coudes.',
      pourquoi_aw: 'Il charge le brachio-radial, le muscle épais du dessus '
           + 'de l’avant-bras. La source lui donne trois rôles : plus de '
           + 'puissance pour tirer ou résister, la tension de prise qu’on '
           + 'subit pendant un match, et le contrôle du coude et du poignet.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Curl concentré': {
      faire: 'Assis, coude calé contre l’intérieur de la cuisse, on monte '
           + 'l’haltère sans que le bras ne bouge.',
      pourquoi_aw: 'Une étude commandée par l’ACE (University of Wisconsin-La '
           + 'Crosse, 2014, 16 volontaires) a comparé huit exercices de '
           + 'biceps : le curl concentré active le biceps **significativement '
           + 'plus** que tous les autres testés.',
      garde: 'Les auteurs nuancent eux-mêmes : cette isolation est son '
           + 'avantage ET sa limite — elle sert moins un objectif '
           + 'fonctionnel. L’étude est financée par l’ACE.',
      source: 'étude ACE / UW-La Crosse 2014, relayée par ACE ProSource'
    },

    /* ---------------- torse ---------------- */
    'Développé couché': {
      faire: 'Allongé, omoplates serrées et abaissées, léger cambré. Prise '
           + 'un peu plus large que les épaules. On descend la barre au '
           + 'contact du sternum, on pousse en expirant.',
      pourquoi_aw: 'Le bras de fer est surtout de la traction, mais un '
           + 'pectoral fort stabilise le haut du corps et ramène le bras vers '
           + 'l’intérieur — l’adduction horizontale qui donne le levier.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Dips prise serrée': {
      faire: 'Mains à largeur d’épaules sur les barres. On descend jusqu’à ce '
           + 'que l’épaule passe sous le coude, ou aussi bas que c’est '
           + 'confortable, puis on remonte.',
      pourquoi_aw: 'Le triceps verrouille la position et pousse quand on '
           + 'finit un plaquage. Une fois les dips faciles au poids du corps, '
           + 'la source conseille une ceinture lestée.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },

    /* ---------------- dos et épaules ---------------- */
    'Rowing': {
      faire: 'Une main et un genou sur un banc, dos plat et parallèle au sol. '
           + 'On tire l’haltère en poussant le coude vers le plafond, on '
           + 'redescend en contrôlant.',
      pourquoi_aw: 'LA SOURCE DONNE UN AJOUT PROPRE AU BRAS DE FER : pendant '
           + 'la remontée, enroule légèrement le poignet avec les '
           + 'fléchisseurs de l’avant-bras. Ça travaille directement ta '
           + 'capacité à toproller.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Face pull': {
      faire: 'Corde à la poulie haute, bras presque tendus. On tire en écartant les coudes à hauteur d’épaules, omoplates qui bougent.',
      pourquoi_aw: 'Le bras de fer abîme les épaules, les coudes et les '
           + 'poignets ; le face pull renforce les petits stabilisateurs qui '
           + 'protègent l’épaule et contrebalancent le travail des rotateurs '
           + 'internes.',
      garde: 'La source est explicite : ce n’est PAS un exercice où chercher '
           + 'un record. Trop lourd, on tire à l’élan et on rate les muscles '
           + 'visés.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Développé militaire': {
      faire: 'Debout, barre aux épaules, on presse à la verticale sans élan '
           + 'de jambes.',
      pourquoi_aw: 'L’épaule — deltoïdes, coiffe, stabilisateurs de '
           + 'l’omoplate — est ce qui te permet d’appliquer ta force et de '
           + 'résister à celle d’en face. Elle encaisse aussi des contraintes '
           + 'énormes pendant un match.',
      garde: 'Pour le deltoïde ANTÉRIEUR, une étude ACE (UW-La Crosse, 16 '
           + 'sujets, 10 exercices) trouve le développé HALTÈRES devant tout '
           + 'le reste. Pour les autres faisceaux, les auteurs disent '
           + 'qu’il n’y a pas un meilleur exercice.',
      source: 'StrengthLog (bras de fer) ; étude ACE / UW-La Crosse 2014'
    },
    /* ================= LOT 2, 31/10 : LES EXERCICES DE TABLE ==========

       CEUX-LA, LE CARNET LES DOCUMENTE DEJA. Leurs commentaires dans
       `model.js` portent des arbitrages que MB a tranches et des sources
       qu'il a validees — il n'y avait rien a chercher ailleurs, seulement a
       le lire. C'est la regle « si je sais ouvrir le fichier qui contient
       la reponse, je l'ouvre ». */
    'Cup hold': {
      faire: 'On ferme la main sur la prise et on TIENT, poignet enroulé '
           + 'vers soi. Des secondes, pas des répétitions.',
      pourquoi_aw: 'C’est la position de contrôle : main fermée sur celle de '
           + 'l’adversaire, son levier réduit. Le carnet la compte en durée, '
           + 'et un isométrique seul ne pèse donc aucun tonnage.',
      source: 'dictionnaire du carnet, lot 3 des exercices de table '
            + '(validé par MB le 23/10)'
    },
    'Toproll à la poulie': {
      faire: 'À la poulie, on combine déviation radiale, pronation et '
           + 'fermeture de la main pour rouler la prise vers l’extérieur.',
      pourquoi_aw: 'Ce n’est pas un geste simple mais une COMPOSITION de '
           + 'gestes déjà sourcés — déviation radiale, pronation, cupping, '
           + 'prise. Ses muscles moteurs sont le rond pronateur et le carré '
           + 'pronateur.',
      source: 'dictionnaire du carnet, lot 3 (validé par MB le 23/10)'
    },
    'Hook à la poulie': {
      faire: 'À la poulie, avant-bras en SUPINATION, on tire en fermant la '
           + 'main et en gardant le poignet verrouillé.',
      pourquoi_aw: 'La supination est un arbitrage de MB CONTRE un article '
           + 'de 2026 qui décrit le hook en pronation : cette étude porte '
           + 'sur onze athlètes en rééducation d’une épicondylite, et sa '
           + 'pronation décrit vraisemblablement la charge qui les a '
           + 'blessés.',
      source: 'arbitrage de MB, inscrit dans le dictionnaire du carnet'
    },
    'Side pressure à la poulie': {
      faire: 'À la poulie, on pousse latéralement en gardant le coude au '
           + 'corps et le poignet ferme.',
      pourquoi_aw: 'VOA la décrit comme une FINITION plutôt qu’un style : '
           + '« elle termine la plupart des matchs de hook et beaucoup de '
           + 'matchs de toproll ». Le carnet la range avec les six '
           + 'mouvements, sur décision de MB du 28/10.',
      source: 'VOA, cité dans le commentaire de STYLES_AW'
    },
    'Back pressure à la poulie': {
      faire: 'À la poulie, on tire vers l’arrière en gardant le bras près du '
           + 'corps, poignet verrouillé.',
      pourquoi_aw: 'L’un des six mouvements du carnet, au même rang que le '
           + 'rising, la pronation et la side pressure.',
      source: 'dictionnaire du carnet, table FORCES'
    },
    'Rising': {
      faire: 'Déviation radiale : le poignet s’incline vers le côté du '
           + 'pouce, contre résistance.',
      pourquoi_aw: 'BarBend note que la plupart des variantes de wrist curl '
           + 'NÉGLIGENT les déviations radiale et ulnaire. Le carnet, lui, '
           + 'leur donne chacune sa fiche.',
      source: 'dictionnaire du carnet ; BarBend sur les variantes de '
            + 'wrist curl'
    },
    'Déviation ulnaire': {
      faire: 'Le poignet s’incline vers le côté du petit doigt, contre '
           + 'résistance.',
      pourquoi_aw: 'Le mouvement miroir du rising. VOA : « Chop / ulnar '
           + 'deviation — bending the wrist down towards the little-finger '
           + 'side ». MB, le 23/10 : elle n’a pas de mot propre au bras de '
           + 'fer.',
      source: 'VOA, cité dans le dictionnaire du carnet'
    },

    /* ---------------- quelques classiques, sources le 31/10 ---------- */
    /* ============ LOT 3 : LES CLASSIQUES ============
       Sources : les etudes ACE / University of Wisconsin-La Crosse lues le
       31/10 (triceps 2011, biceps 2014, epaules 2014) et le guide bras de
       fer de StrengthLog. Aucune n'est ecrite de memoire. */
    'Curl biceps': {
      faire: 'Bras le long du corps, coudes fixes, on fléchit en gardant le '
           + 'buste immobile.',
      pourquoi_aw: 'Le biceps et le brachial tiennent la traction quand le '
           + 'coude est fléchi. StrengthLog rappelle que le brachial, sous '
           + 'le biceps, est en réalité le plus fort des deux.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Hammer curl': {
      faire: 'Curl en prise neutre, paumes face à face, coudes au corps.',
      pourquoi_aw: 'La prise neutre charge le brachio-radial, celui qui '
           + 'tient la puissance dans le toproll.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Preacher curl': {
      faire: 'Bras posés sur le pupitre, coudes bloqués, on fléchit sans '
           + 'décoller l’arrière du bras.',
      pourquoi_aw: 'Le pupitre supprime l’élan du buste. L’étude ACE de 2014 '
           + 'l’a testé parmi huit exercices de biceps ; c’est le curl '
           + 'concentré qui l’emporte.',
      source: 'étude ACE / UW-La Crosse 2014, 16 volontaires'
    },
    'Triceps kickback': {
      faire: 'Buste penché, bras collé au corps, on étend le coude vers '
           + 'l’arrière sans bouger l’épaule.',
      pourquoi_aw: 'L’étude ACE sur huit exercices de triceps le classe '
           + 'DEUXIÈME, derrière les pompes diamant, devant les dips.',
      garde: 'Les auteurs préviennent que les deux exercices au poids du '
           + 'corps testés ne sont pas strictement comparables aux six '
           + 'autres, charges à 70 % du 1RM.',
      source: 'étude ACE / UW-La Crosse (triceps), 8 exercices, EMG des '
            + 'chefs long et latéral'
    },
    'Pompes': {
      faire: 'Mains à largeur d’épaules, corps en ligne de la tête aux '
           + 'talons, on descend la poitrine puis on pousse.',
      pourquoi_aw: 'Une mesure EMG place la pompe STANDARD devant la prise '
           + 'large pour le pectoral comme pour le triceps — l’inverse de ce '
           + 'qu’on en dit d’ordinaire.',
      source: 'étude EMG citée par Biology Insights ; comparatif LiveStrong'
    },
    'Élévation latérale': {
      faire: 'Bras le long du corps, on élève sur les côtés jusqu’à hauteur '
           + 'd’épaules, sans élan.',
      pourquoi_aw: 'Pour le deltoïde MOYEN, l’étude ACE de 2014 place en '
           + 'tête l’élévation bras fléchi et le rowing incliné à 45°.',
      garde: 'Ses auteurs refusent de nommer un meilleur exercice d’épaule, '
           + 'et conseillent de commencer par le deltoïde postérieur, le '
           + 'plus faible d’ordinaire.',
      source: 'étude ACE / UW-La Crosse 2014, 10 exercices, EMG des trois '
            + 'faisceaux'
    },
    'Oiseau': {
      faire: 'Buste penché, bras presque tendus, on écarte vers l’arrière à '
           + 'hauteur d’épaules.',
      pourquoi_aw: 'Travail du deltoïde postérieur, que l’étude ACE désigne '
           + 'comme le plus faible des trois faisceaux et le premier à '
           + 'renforcer.',
      source: 'étude ACE / UW-La Crosse 2014'
    },
    'Tirage vertical': {
      faire: 'Assis à la poulie haute, on tire la barre devant la poitrine '
           + 'en laissant les omoplates descendre.',
      pourquoi_aw: 'Les dorsaux stabilisent l’épaule et transfèrent la force '
           + 'pour que le bras ne travaille pas seul.',
      garde: 'Plusieurs études sur la largeur de prise ne trouvent PAS de '
           + 'différence significative d’activation du grand dorsal.',
      source: 'Andersen et al. via StrengthLog ; revue EMG PubMed 42647355'
    },
    'Traction': {
      faire: 'Suspendu à la barre, paumes vers l’avant, on tire jusqu’à '
           + 'passer le menton au-dessus.',
      pourquoi_aw: 'Une revue EMG de 2026 trouve les différentes prises de '
           + 'traction globalement ÉQUIVALENTES pour le grand dorsal ; c’est '
           + 'le rowing inversé qu’elle place devant.',
      source: 'revue narrative EMG, PubMed 42647355 (2026)'
    },
    'Dips prise large': {
      faire: 'Buste penché vers l’avant sur les barres, coudes écartés, on '
           + 'descend jusqu’à l’épaule sous le coude.',
      pourquoi_aw: 'Le buste penché déplace le travail vers le pectoral ; '
           + 'buste droit, c’est le triceps.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Farmer walk': {
      faire: 'Une charge lourde dans chaque main, on marche en gardant le '
           + 'buste droit et les épaules basses.',
      pourquoi_aw: 'Prise et stabilité d’épaule sous charge, deux choses que '
           + 'le bras de fer exige en continu.',
      garde: 'La fiche du carnet est INCOMPLÈTE par construction : les '
           + 'muscles les mieux mesurés de cet exercice sont ceux du tronc, '
           + 'qu’il ne connaît pas.',
      source: 'dictionnaire du carnet ; dette inscrite dans CHANTIERS.md'
    },
    'Dead hang': {
      faire: 'Suspendu à une barre, bras tendus, on tient.',
      pourquoi_aw: 'Le bras de fer met tendons et ligaments du poignet, du '
           + 'coude et de l’épaule sous forte contrainte. La source rappelle '
           + 'que ces tissus s’adaptent comme les muscles, et qu’ils '
           + 'demandent un travail à part : plus lourd, moins de '
           + 'répétitions, de l’isométrique ou de l’amplitude partielle.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    }
  };

  /* ================= CE QUI RESTE À FAIRE, COMPTÉ =================

     58 fiches au dictionnaire, 12 expliquées ici. **46 restent sans
     explication de mouvement de base.** Ce nombre est calculé par la page,
     pas écrit ici — un compte figé se périme au premier ajout.

     ET JE NE LES ÉCRIRAI PAS DE MÉMOIRE. Ce projet a déjà payé une
     explication inventée qui se lisait comme une explication vérifiée. Les
     46 restantes demandent chacune leur source ; celles que je ne trouve
     pas, je les nommerai pour que MB les écrive lui-même, comme il l'a
     proposé. */

  A.explicationsBase = { BASE: BASE };
})(window.App || (window.App = {}));
