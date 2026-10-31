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
      faire: 'À la poulie ou ceinture, côté du bras travaillé. Coude à 90° au corps, paume vers l’intérieur ; on tourne pour l’amener vers le bas.',
      pourquoi_aw: 'Les pronateurs — le rond pronateur en premier — sont ce '
           + 'qui fait un toproll fort : ils créent le couple qui roule la '
           + 'main de l’adversaire vers l’extérieur.',
      garde: 'Commencer léger et travailler le contrôle. Et ne pas laisser '
           + 'le câble ramener l’avant-bras d’un coup au retour.',
      source: 'StrengthLog, Arm Wrestling Strength Training (02/12/2025)'
    },
    'Supination': {
      faire: 'À la poulie ou ceinture, mais le côté travaillé tourné À L’OPPOSÉ de la machine, le câble traversant le corps. Coude à 90° au corps, paume vers le bas au départ, on tourne pour l’amener vers le haut.',
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
      faire: 'À la poulie, avant-bras en SUPINATION, on tire vers soi en fermant la main et en gardant le poignet verrouillé.',
      pourquoi_aw: 'La supination est un arbitrage de MB CONTRE un article '
           + 'de 2026 qui décrit le hook en pronation : cette étude porte '
           + 'sur onze athlètes en rééducation d’une épicondylite, et sa '
           + 'pronation décrit vraisemblablement la charge qui les a '
           + 'blessés.',
      source: 'arbitrage de MB, inscrit dans le dictionnaire du carnet'
    },
    'Side pressure à la poulie': {
      faire: 'À la poulie, on pousse latéralement en gardant le coude au corps et le poignet ferme, perpendiculaire à la poulie.',
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
      faire: 'Buste penché vers l’avant sur les barres, genoux qui remontent, coudes écartés, on descend jusqu’à l’épaule sous le coude.',
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
    /* ========== LOT 4 : CE QUE MB A ECRIT LUI-MEME, le 31/10 ==========
       `de: 'MB'` les marque. Seule leur LONGUEUR a ete arrangee pour tenir
       dans l'ecran — jamais leur sens. */
    'Curl Larratt': {
      de: 'MB',
      faire: 'Contraction isométrique intense, idéalement à 90°, avec un '
           + 'basculement du corps. Se fait sur pupitre de préférence.',
      source: 'MB, 31/10'
    },
    'Curl Zottman': {
      de: 'MB',
      faire: 'Bras le long du corps, coudes fixes. On monte en supination, '
           + 'puis on bascule en pronation en haut et on redescend ainsi.',
      source: 'MB, 31/10'
    },
    'Curl pronation à la poulie': {
      de: 'MB',
      faire: 'Sangle autour du pouce, passant sur le dessus de la main. Mouvement de bas en haut comme un curl, face à la machine. La sangle s’enroule au choix en position basse (au poignet), neutre, ou haute (après les phalanges) — trois hauteurs, trois bras de levier.',
      source: 'MB, 31/10'
    },
    'Curl rising à la poulie': {
      de: 'MB',
      faire: 'Sangle autour du poignet, qui passe ensuite sur les doigts '
           + 'après les phalanges. Mouvement de bas en haut comme un curl, '
           + 'face à la machine.',
      source: 'MB, 31/10'
    },
    'Développé serré': {
      de: 'MB',
      faire: 'Allongé, omoplates serrées et abaissées, léger cambré. Prise '
           + 'serrée, mains presque jointes. On descend au sternum et on '
           + 'pousse en expirant.',
      source: 'MB, 31/10'
    },
    'Extenseurs à élastique': {
      de: 'MB',
      faire: 'Doigts réunis en un point, on ouvre la main le plus loin possible.',
      source: 'MB, 31/10'
    },
    'Finger curl': {
      de: 'MB',
      faire: 'Barre ou poids en prise supination, avant-bras posés ou non. Seulement une flexion des doigts — un mouvement de crochet.',
      source: 'MB, 31/10'
    },
    'Pull-over': {
      de: 'MB',
      faire: 'On abaisse l’haltère en arc de cercle derrière la tête jusqu’à l’étirement du dos et de la cage, bras tendus, puis on remonte en contractant les dorsaux.',
      source: 'MB, 31/10'
    },
    'Traction partielle': {
      de: 'MB',
      faire: 'Tenue isométrique coude à 90° : on monte et on descend en gardant cet angle à la redescente.',
      source: 'MB, 31/10'
    },
    'Wrist curl côté petit doigt': {
      de: 'MB',
      faire: 'Barre en supination, avant-bras posés. On laisse rouler vers '
           + 'les doigts, puis on remonte au poignet en accentuant côté '
           + 'auriculaire.',
      source: 'MB, 31/10'
    },
    'Wrist curl côté pouce': {
      de: 'MB',
      faire: 'Barre en supination, avant-bras posés. On laisse rouler vers '
           + 'les doigts, puis on remonte au poignet en accentuant côté '
           + 'pouce.',
      source: 'MB, 31/10'
    },
    'Écarté': {
      de: 'MB',
      faire: 'Allongé, omoplates serrées et abaissées, léger cambré. Bras tendus, on forme un arc de cercle.',
      source: 'MB, 31/10'
    },

    /* ========== LOT 5 : LES QUINZE CHERCHEES ==========
       Dont DEUX que MB m'a nommement rendues : « Montee a la corde :
       cherche sur internet », « Muscle-up : cherche sur internet ». */
    'Montée à la corde': {
      faire: 'On grimpe en bloquant la corde avec les pieds : elle passe de '
           + 'l’intérieur de la jambe par-dessus la cheville et revient au '
           + 'milieu du pied, genou à 90°.',
      pourquoi_aw: 'Prise et tirage sous charge complète. Les sources '
           + 'conseillent de commencer par la descente lente jambes '
           + 'tendues, puis des montées partielles.',
      garde: 'Des tapis sous la corde : les sources le disent franchement.',
      source: 'BarBend, 8 Tips For Improving Your Rope Climb'
    },
    'Muscle-up': {
      faire: 'Prise fausse, pouces par-dessus la barre. Tirage puissant vers '
           + 'le ventre, buste qui bascule en avant au passage, puis on '
           + 'pousse jusqu’au verrouillage.',
      pourquoi_aw: 'La vitesse prise dès le début du tirage fait passer la '
           + 'transition. Le chemin se fait AUTOUR de la barre, pas en '
           + 'tirant droit dessus.',
      garde: 'Une source avance une base d’environ 12 à 15 tractions avant '
           + 'd’y prétendre. Progressions : sauté depuis une caisse, avec '
           + 'élastique, ou en excentrique depuis le haut.',
      source: 'BarBend et StrengthLog, muscle-up et ses progressions'
    },
    'Rétraction des omoplates': {
      faire: 'Debout, gainage serré, poitrine haute : on tire les omoplates '
           + 'vers le bas et vers l’arrière sans cambrer le bas du dos.',
      pourquoi_aw: 'ACE donne une tenue de 5 à 10 secondes, 2 à 4 fois. '
           + 'C’est la base de la stabilité d’épaule sous charge.',
      source: 'ACE, Correct Cues for Scapular Motion'
    },
    'Haussement d’épaules': {
      faire: 'Debout, charge en main, gainage serré, très léger buste en '
           + 'avant. Coudes verrouillés, on monte les épaules vers les '
           + 'oreilles.',
      garde: 'Le mouvement reste VERTICAL : un haussement ne doit pas '
           + 'tourner en rotation d’épaules.',
      source: 'BarBend, Shrugs'
    },
    'Élévation frontale': {
      faire: 'Charge devant les cuisses, prise pronation. Gainage serré, '
           + 'omoplates basses et en arrière, on lève jusqu’à '
           + 'l’horizontale des épaules.',
      garde: 'Buste droit, pas de cambrure lombaire, poignets neutres.',
      source: 'ACE, Exercise Library — Front raise'
    },
    'Tirage menton': {
      faire: 'Barre devant les cuisses, on tire vers le haut jusqu’au menton en menant par les coudes.',
      garde: 'EXERCICE DISCUTÉ : les sources le disent praticable sur une '
           + 'épaule saine, avec des adaptations. Elles conseillent de le '
           + 'faire suivre de haussements, pour que les trapèzes supérieurs '
           + 'suivent les deltoïdes.',
      source: 'BarBend, best shoulder exercises'
    },
    'Rotation externe d’épaule': {
      faire: 'Coude fléchi, avant-bras qui part vers l’extérieur contre la '
           + 'résistance.',
      pourquoi_aw: 'Les cliniciens commencent coude au corps, position qui '
           + 'réduit le pincement de la coiffe, et vont vers l’abduction à '
           + '90° quand l’épaule le supporte.',
      source: 'Eric Cressey ; tables de tests cliniques'
    },
    'Rotation interne d’épaule': {
      faire: 'Coude fléchi, avant-bras qui revient vers le ventre contre la '
           + 'résistance.',
      pourquoi_aw: 'Le pendant de la rotation externe. Le bras de fer '
           + 'sollicite fortement les rotateurs internes — d’où '
           + 'l’intérêt des face pulls en contrepoids.',
      source: 'Eric Cressey ; StrengthLog (bras de fer)'
    },
    'Rotation cubaine': {
      faire: 'Coudes à hauteur d’épaules, on fait tourner les avant-bras '
           + 'vers le haut en rotation externe, sans développé.',
      pourquoi_aw: 'C’est le Cuban press dépouillé : il garde la seule '
           + 'rotation externe et laisse tomber le tirage menton et le '
           + 'développé.',
      garde: 'Charge légère : la coiffe est minuscule à côté des '
           + 'deltoïdes.',
      source: 'Mirafit, Fitness Volt, Sole Treadmills'
    },
    'Développé Arnold': {
      faire: 'Haltères devant le visage, paumes vers soi. On presse '
           + 'au-dessus de la tête en tournant les paumes vers l’avant.',
      garde: 'Bras perpendiculaires au sol et parallèles entre eux pendant '
           + 'la montée.',
      source: 'BarBend, How to Do the Arnold Press'
    },
    'Élévation en Y': {
      faire: 'À plat ventre sur un banc incliné à 30-45°, bras pendants. On '
           + 'lève en Y, pouces vers le haut, jusqu’à hauteur de tête.',
      garde: 'Charges très légères, sinon le mouvement ne sert plus à '
           + 'rien.',
      source: 'StrengthLog, dumbbell shoulder exercises'
    },
    'Extension triceps': {
      faire: 'Face à la poulie haute, pieds joints, coudes collés aux '
           + 'côtes. Poitrine haute, dos plat, on pousse jusqu’à '
           + 'l’extension complète.',
      source: 'BarBend, Triceps Pushdowns'
    },
    'Barre au front': {
      faire: 'Allongé, barre au-dessus de la poitrine. Sans bouger les bras, '
           + 'on fléchit les coudes pour descendre vers le front, puis on '
           + 'tend.',
      garde: 'Les sources divergent sur la fin de course : certaines '
           + 'descendent légèrement DERRIÈRE la tête pour plus '
           + 'd’étirement, d’autres s’arrêtent au front.',
      source: 'BarBend, Skull Crushers'
    },
    'Extension verticale des triceps': {
      faire: 'Dos à la poulie basse, léger buste en avant, corde derrière '
           + 'la tête et bras près des oreilles. On tend les coudes à fond.',
      pourquoi_aw: 'Le chef long est le seul des trois à s’attacher au '
           + 'coude ET à l’épaule : il faut passer les bras au-dessus de '
           + 'la tête pour l’étirer vraiment.',
      source: 'BarBend, overhead triceps extension'
    },
    'Tate press': {
      faire: 'Allongé, haltères au-dessus de la poitrine. Sans bouger les '
           + 'épaules, on fléchit les coudes vers l’EXTÉRIEUR, pouces vers '
           + 'le milieu de la poitrine.',
      garde: 'Ne pas laisser les épaules s’enrouler en avant. Un repère : '
           + 'penser à pousser les auriculaires vers le plafond.',
      source: 'BarBend et StrengthLog, Tate press'
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
