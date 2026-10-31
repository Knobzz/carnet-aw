/* LES GESTES ET LES EXPLICATIONS — assemble le 2026-10-31.

   CE FICHIER EST ASSEMBLE, PAS ECRIT A LA MAIN. Ses blocs sont les fichiers
   de `revue/` repris TELS QUELS : ce sont eux que MB a relus — 83 validees,
   12 corrigees mot pour mot — et une retape serait une occasion de perdre
   un mot.

   Pour le regenerer apres une correction dans revue/ :
     python outils/assembler-gestes.py

   Ce qu'il porte : 57 explications de mouvement, 38 gestes sur 16 fiches.
   Ce qu'il ne porte pas : le dictionnaire lui-meme, qui vit dans model.js
   et y est deja transforme (absorptions, renommage, retraits). */

/* ===== les 57 explications de mouvement
   source : revue/explications-base.js ===== */
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

/* ===== les explications des 14 premiers gestes
   source : revue/explications-gestes.js ===== */
/* COMMENT FAIRE CHAQUE GESTE — une explication par variante.

   MB, 31/10 : « le fait de sélectionner une variante devrait être accompagné
   par la suite d'une petite explication sur comment faire l'exo ». Et, avant
   ça : « fais une recherche pour être sûr que les exercices existent ».

   CHAQUE ENTRÉE A ÉTÉ CHERCHÉE SUR LE WEB le 2026-10-31, et `source` dit où.
   Les deux que la recherche a fait TOMBER ne sont plus des gestes et ne sont
   donc pas ici — voir `RETIRES` en bas de fichier, qui dit pourquoi.

   `faire`    le geste, en une ou deux phrases ;
   `change`   ce que ça change par rapport au mouvement de base — c'est la
              seule raison d'avoir une variante plutôt qu'un nom ;
   `garde`    l'erreur ou le risque, quand les sources en nomment un.
              L'aide dit ce que le geste fait ET ce qu'il ne fait pas.
   `source`   d'où ça vient. « connaissance » = AUCUNE recherche ne l'a
              confirmé, et il faut le lire comme tel.

   AUCUN TEXTE ICI N'EST UNE CITATION. Les sources ont été lues et reformulées ;
   là où elles se contredisent, `garde` le dit au lieu de trancher. */
(function (A) {
  'use strict';

  var E = {
    /* ---------------- biceps ---------------- */
    'Spider curl': {
      faire: 'Poitrine sur un banc incliné, face au dossier, bras dans le vide. On monte sans bouger l’épaule.',
      change: 'Le banc bloque le tronc : pas de balancement possible. Amplitude large, charge plus légère.',
      source: 'PureGym, Muscle & Strength, comparatif Gymkee'
    },
    'Drag curl': {
      faire: 'Le poids traîne le long du corps au lieu de décrire un arc : les coudes reculent derrière le torse.',
      change: 'Insiste sur le chef court. Plus lourd qu’au spider curl, amplitude plus courte.',
      garde: 'Ne pas hausser les épaules pour aider — c’est le signe que la '
           + 'charge est trop lourde.',
      source: 'Outlift, comparatif Gymkee'
    },
    'Bayesian curl': {
      faire: 'À la poulie, debout dos à la machine, le bras part en arrière du corps.',
      change: 'L’épaule en extension met le chef long sous tension dès le départ, et le câble la maintient du début à la fin.',
      source: 'BarBend, StrengthLog'
    },
    'Waiter curl': {
      faire: 'Un seul haltère tenu à plat dans les deux paumes, par le dessous — comme un plateau de serveur.',
      change: 'La prise par-dessous empêche d’aider avec les avant-bras. Le chef long travaille.',
      garde: 'Deux pièges nommés par les sources : laisser l’haltère '
           + 'basculer (on retombe sur une prise neutre, et c’est le '
           + 'brachial qui prend), et laisser le coude avancer — le curl '
           + 'devient alors une élévation frontale. La charge est limitée '
           + 'par la tenue, pas par le biceps ; certains signalent une gêne '
           + 'au poignet.',
      source: 'Fitbod, PowerliftingTechnique, Fitness Volt'
    },

    /* ---------------- épaules ---------------- */
    'Développé nuque': {
      faire: 'Barre descendue derrière la tête au lieu de devant, puis '
           + 'poussée à la verticale.',
      change: 'Travaille plus le deltoïde latéral et postérieur que le '
            + 'développé devant.',
      garde: 'C’EST LE GESTE LE PLUS DISCUTÉ DE LA LISTE. Il demande de '
           + 'pouvoir lever les bras le long des oreilles sans que les côtes '
           + 'ne s’ouvrent et sans douleur ; sinon on force une épaule qui '
           + 'ne suit pas. Certaines morphologies d’acromion le rendent '
           + 'inconfortable quelle que soit la technique. Les sources ne '
           + 'sont pas d’accord : plusieurs le déconseillent franchement, '
           + 'd’autres l’emploient avec une charge légère. À éviter en '
           + 'reprise après blessure d’épaule.',
      source: 'Healthline, Ironman Magazine, BoxLife (mobilité), '
            + 'Built With Science'
    },
    'Overhead shrug': {
      faire: 'Barre tenue bras tendus au-dessus de la tête, et on hausse les '
           + 'épaules de là.',
      change: 'Bras au-dessus, on POUSSE les trapèzes vers le haut au lieu '
            + 'de les tirer : ce n’est plus le même faisceau qui travaille.',
      garde: 'L’équilibre est le point faible — la charge tombe droit sur '
           + 'la tête. Gainage serré, charge légère. Les sources se '
           + 'contredisent sur son intérêt : « plutôt correctif » pour les '
           + 'uns, « le meilleur pour isoler le trapèze supérieur » pour '
           + 'les autres — cette seconde affirmation n’est appuyée par '
           + 'aucune mesure.',
      source: 'Mirafit, Motra, The Body Blueprint'
    },
    'Cuban press': {
      faire: 'Un enchaînement : tirage menton, rotation externe des épaules, puis développé au-dessus de la tête.',
      change: 'Mouvement composé, pas une rotation : la rotation cubaine en est la version dépouillée.',
      garde: 'Charge légère : la coiffe est minuscule à côté des deltoïdes '
           + 'et lâche vite.',
      source: 'Mirafit, Fitness Volt, Sole Treadmills'
    },
    'Rotation externe coude au corps': {
      faire: 'Coude collé au flanc, avant-bras qui part vers l’extérieur.',
      change: 'Coude au corps plutôt qu’en abduction à 90° : l’angle d’épaule change, et le pincement de la coiffe est moindre.',
      garde: 'Aucune étude comparant directement les deux positions n’est '
           + 'ressortie de la recherche : ce classement vient de la '
           + 'pratique clinique, pas d’un essai.',
      source: 'Eric Cressey, tables de tests cliniques'
    },
    'Rotation interne coude au corps': {
      faire: 'Coude collé au flanc, avant-bras qui revient vers le ventre.',
      change: 'Même logique que l’externe : les deux vont ensemble.',
      source: 'Eric Cressey, tables de tests cliniques'
    },

    /* ---------------- pectoraux / triceps ---------------- */
    'Hex press': {
      faire: 'Deux haltères pressés l’un contre l’autre, têtes qui se touchent. Prise neutre, coudes serrés.',
      change: 'La tension vient de la pression entre les haltères, pas de la prise. Accessoire, plus léger qu’à la barre.',
      garde: 'La recherche n’a pas donné de guide détaillé : les sources '
           + 'disent qu’il « ressemble » au développé haltères prise serrée '
           + 'sans toujours détailler la différence.',
      source: 'Breaking Muscle, BarBend, Fitness Volt'
    },
    'Pompes diamant': {
      faire: 'Mains rapprochées sous la poitrine, index et pouces en losange. Coudes serrés.',
      change: 'Les triceps passent devant, pectoraux et épaules derrière.',
      source: 'Peloton, LiveStrong, Coach, mesures EMG citées par '
            + 'Biology Insights'
    },
    'Wide push up': {
      faire: 'Mains nettement plus larges que les épaules, corps en ligne '
           + 'de la tête aux talons.',
      change: 'Censé reporter la charge sur les pectoraux.',
      garde: 'LA MESURE NE SUIT PAS TOUT À FAIT : une étude EMG trouve que '
           + 'c’est la pompe STANDARD qui active le plus pectoraux et '
           + 'triceps, et la position large qui active le MOINS. Une autre '
           + '(Allen) trouve le pectoral plus actif que le triceps en prise '
           + 'large. L’effet triceps du diamant est bien établi ; l’effet '
           + 'pectoral de la prise large l’est beaucoup moins.',
      source: 'LiveStrong, planfit, étude EMG citée par Biology Insights'
    },

    /* ---------------- dos ---------------- */
    'Tirage nuque': {
      faire: 'Barre de la poulie haute tirée derrière la nuque au lieu de '
           + 'devant la poitrine.',
      change: 'Même famille que le développé nuque, et à trancher de la '
            + 'même façon : si tu gardes l’un, garde l’autre.',
      garde: 'Une étude de 2009 citée par les sources trouve le tirage '
           + 'DEVANT nettement plus activateur du grand dorsal que le '
           + 'tirage nuque. Les risques nommés sont le pincement d’épaule, '
           + 'la coiffe et le cou. Demande une bonne rotation externe et '
           + 'une bonne mobilité dorsale ; il vaut mieux maîtriser le '
           + 'tirage devant d’abord.',
      source: 'Bodybuilding.com, Motra, FlashMavi, Ironman Magazine'
    },
    'Rowing buste penché': {
      faire: 'Buste penché vers l’avant, dos plat, on tire la barre vers le '
           + 'bas-ventre.',
      change: 'C’est le bent-over row.',
      garde: 'JE N’AI PAS CHERCHÉ CELUI-LÀ, et mon doute n’est pas sur son '
           + 'existence — il est sur ton carnet : « Rowing » tout court y '
           + 'désigne peut-être déjà ce mouvement, auquel cas c’est un '
           + 'simple synonyme et non une variante. C’est à toi de le dire.',
      source: 'connaissance — non vérifié'
    }
  };

  /* ================= CE QUE LA RECHERCHE A FAIT TOMBER =================

     Deux des seize « gestes » que j'avais proposés ne tiennent pas une fois
     cherchés. Je les laisse écrits ici plutôt que de les effacer : une
     proposition retirée en silence se represente trois semaines plus tard. */
  var RETIRES = {
    'Strict press': {
      etait: 'geste', devient: 'syn',
      pourquoi: 'Le développé militaire EST un strict press — même geste, '
              + 'sans élan de jambes, le militaire ayant en plus les talons '
              + 'rapprochés. Ce qui s’y oppose est le PUSH press, qui ajoute '
              + 'l’impulsion des jambes et n’est pas dans ton dictionnaire. '
              + 'Tant qu’il n’y est pas, « Strict press » ne distingue rien.',
      source: 'Fitness Volt, PowerliftingTechnique, Breaking Muscle'
    },
    'Écartés Hyght': {
      etait: 'geste', devient: 'mat',
      pourquoi: 'Le nom « Hyght » n’apparaît que sur des sites d’applications '
              + 'de fitness et des pages de substitution d’exercices, jamais '
              + 'sur une source de référence. Ce qu’elles décrivent est un '
              + 'écarté sur banc incliné — donc du MATÉRIEL (le banc et son '
              + 'degré), pas un geste nouveau.',
      source: 'Fitness Volt, Lyfta, Fitwill, Wikipedia (Fly)'
    }
  };

  A.explicationsGestes = { E: E, RETIRES: RETIRES };
})(window.App || (window.App = {}));

/* ===== les 11 gestes trouves par la recherche
   source : revue/gestes-ajoutes.js ===== */
/* LES NEUF GESTES QUI MANQUAIENT — décision de MB, 2026-10-31.

   « Tu rajoutes les deux, ainsi que les classiques absents, qui sont des
   gestes de différents mouvements j'ai l'impression. »

   Il a vu juste : ils se rattachent à SIX fiches différentes. Aucun des neuf
   n'était dans le carnet — mesuré avant d'écrire, les neuf noms étaient
   libres et les six fiches d'accueil existent toutes.

   CHAQUE GESTE A ÉTÉ CHERCHÉ SUR LE WEB le 2026-10-31, comme les quatorze
   premiers, et `source` dit où. Même grammaire : `faire`, `change`, `garde`
   quand les sources nomment un risque, `source` toujours.

   `aussi` porte les écritures supplémentaires qui doivent rester
   CHERCHABLES — « Floor press » pour « Développé au sol », par exemple. Ce
   ne sont pas des gestes de plus : ce sont les mots que MB tapera.

   RIEN N'EST APPLIQUÉ AU MODÈLE. Ce fichier sert à la simulation ; le
   dictionnaire ne bougera qu'une fois le rendu validé. */
(function (A) {
  'use strict';

  var AJOUTS = [
    /* ================= LES DEUX POUR LE BRAS DE FER ================= */
    {
      fiche: 'Wrist curl',
      nom: 'Wrist curl derrière le dos',
      aussi: ['Behind the back wrist curl', 'Flexion du poignet derrière le dos',
              'Behind the back barbell wrist curl'],
      faire: 'Debout, barre derrière les fesses, paumes vers l’arrière. On la laisse rouler vers les doigts, puis on remonte au poignet.',
      change: 'La charge passe derrière la ligne médiane : la position du hook et du toproll.',
      garde: 'Avec une barre, selon la longueur de tes bras, les fessiers '
           + 'gênent la remontée et réduisent l’amplitude — la poulie est '
           + 'donnée comme le meilleur outil pour ce geste, la machine '
           + 'Smith et les haltères marchent aussi. Et une source se '
           + 'contredit sur les muscles : c’est un travail de FLÉCHISSEURS, '
           + 'pas d’extenseurs — pour les extenseurs, c’est le wrist curl '
           + 'inversé que tu as déjà.',
      source: 'John Brookfield / IronMind (« especially good for arm '
            + 'wrestlers »), BarBend, StrengthLog, Fitness Volt'
    },
    {
      fiche: 'Développé militaire',
      nom: 'Push press',
      aussi: ['Développé avec élan', 'Push-press'],
      faire: 'Comme un développé militaire, mais les jambes lancent la barre : flexion courte des hanches et des genoux, puis on finit aux épaules.',
      change: 'L’élan permet de charger plus lourd qu’en strict.',
      source: 'Fitness Volt, PowerliftingTechnique, BarBend'
    },

    /* ================= LES CLASSIQUES ABSENTS ================= */
    {
      fiche: 'Développé militaire',
      nom: 'Z press',
      aussi: ['Développé assis au sol', 'Z-press'],
      faire: 'Assis au sol, jambes tendues, sans banc ni appui dans le dos. On presse au-dessus de la tête.',
      change: 'Ni jambes ni dossier : le gainage devient la limite avant les épaules.',
      garde: 'Les sources s’accordent à en faire un ACCESSOIRE, pas un '
           + 'mouvement principal : on y charge moins qu’assis sur un banc, '
           + 'et son rôle est d’améliorer le développé ordinaire.',
      source: 'BarBend, PowerliftingTechnique, Muscle & Strength'
    },
    {
      fiche: 'Développé couché',
      nom: 'Développé au sol',
      aussi: ['Floor press', 'Développé couché au sol'],
      faire: 'Allongé au sol au lieu d’un banc : les coudes touchent le sol et arrêtent la descente.',
      change: 'Amplitude raccourcie : sert le verrouillage, et épargne l’épaule en position basse.',
      garde: 'Eric Cressey le classe DEVANT le pin press pour une raison '
           + 'précise : sur pins, on n’est pas en position de « poser » '
           + 'correctement les stabilisateurs de l’omoplate. Son ordre est '
           + 'board press, puis floor press, puis pin press « si tant est '
           + 'qu’on le fasse ».',
      source: 'Eric Cressey, PowerliftingTechnique, T3'
    },
    {
      fiche: 'Rowing',
      nom: 'Pendlay row',
      aussi: ['Rowing Pendlay', 'Rowing départ au sol'],
      faire: 'Buste à l’horizontale, la barre repose au sol entre chaque répétition.',
      change: 'Chaque tirage repart de l’arrêt complet : pas d’élan accumulé.',
      garde: 'Une source place le rowing ordinaire comme le meilleur choix '
           + 'pour la prise de masse (séries plus longues), le Pendlay '
           + 'étant plutôt un mouvement de force. Les deux travaillent '
           + 'largement les mêmes muscles.',
      source: 'PowerliftingTechnique, Gymshark, GoodRx'
    },
    {
      fiche: 'Rowing',
      nom: 'Yates row',
      aussi: ['Rowing Yates', 'Rowing en supination'],
      faire: 'Rowing buste penché, mais en PRISE SUPINÉE, largeur d’épaules, '
           + 'et le buste nettement moins penché qu’un rowing classique.',
      change: 'L’angle du buste est ce qui le distingue du Pendlay et du '
            + 'rowing à la T-bar.',
      garde: 'Les sources se contredisent sur ce qu’il cible : on lui prête '
           + 'd’ordinaire le haut du dos, mais des pratiquants le ressentent '
           + 'surtout dans le grand dorsal. C’est du témoignage, pas de la '
           + 'mesure. Les chiffres de charge trouvés viennent de relevés '
           + 'd’utilisateurs — à ne pas lire comme une comparaison.',
      source: 'Fitness Volt, Wikipedia (Bent-over row), StrengthLevel'
    },
    {
      fiche: 'Pull up',
      nom: 'Traction commando',
      aussi: ['Commando pull up', 'Traction prise mixte sur la barre'],
      faire: 'Mains l’une devant l’autre sur la barre, dans son axe. Le corps monte en se décalant d’un côté, puis de l’autre.',
      change: 'Le décalage attaque le dos sous un angle que la traction de face ne donne pas.',
      source: 'Bodybuilding.com'
    },
    {
      fiche: 'Pull up',
      nom: 'Traction archer',
      aussi: ['Archer pull up'],
      faire: 'Prise large, on tire d’un seul côté en gardant l’autre bras '
           + 'tendu le long de la barre, puis on alterne.',
      change: 'Presque tout le travail passe sur un bras — c’est l’étape '
            + 'avant la traction à un bras.',
      garde: 'Les sources la classent comme AVANCÉE : elle demande déjà de '
           + 'la force dans le dos et les bras.',
      source: 'Fitness Volt, Lyfta'
    },
    /* ===== DEUX DE PLUS, trouves le 31/10 en cherchant les gestes manques
       sur des sources EMG, a la demande de MB : « cherches voir si on a
       rate des gestes pour certains exercices, evidemment venant de
       sources sures & verifiees ». ===== */
    {
      fiche: 'Rowing',
      nom: 'Rowing inversé',
      aussi: ['Inverted row', 'Traction australienne', 'Australian pull up'],
      faire: 'Barre à hauteur de hanches, on se place dessous, corps gainé, et on tire la poitrine vers elle.',
      change: 'La seule variante de rowing qu’une revue EMG place devant les autres pour le grand dorsal.',
      garde: 'LA REVUE ELLE-MEME MET EN GARDE : ce classement repose sur une '
           + 'seule etude preliminaire, de petite taille, qui demande a etre '
           + 'repliquee. C’est un indice, pas un verdict.',
      source: 'revue narrative EMG du grand dorsal, PubMed 42647355 (2026)'
    },
    {
      fiche: 'Élévation latérale',
      nom: 'Élévation latérale bras fléchi',
      aussi: ['Bent-arm lateral raise', 'Élévation latérale coude plié'],
      faire: 'Comme une élévation latérale, mais coudes fléchis à 90° tout du long, ce qui raccourcit le bras de levier.',
      change: 'Une étude ACE la place parmi les deux meilleures pour le deltoïde moyen.',
      garde: 'L’etude est financee par l’ACE, et ses auteurs refusent de '
           + 'nommer un meilleur exercice d’epaule : « il n’y en a pas un ». '
           + 'Ils conseillent de commencer par le deltoide POSTERIEUR, le '
           + 'plus faible d’ordinaire.',
      source: 'etude ACE / UW-La Crosse 2014, 16 sujets, EMG des trois '
            + 'faisceaux du deltoide'
    },
    {
      fiche: 'Pull up',
      nom: 'Traction L-sit',
      aussi: ['L-sit pull up', 'Traction jambes tendues'],
      faire: 'Traction ordinaire, mais jambes tendues à l’horizontale devant '
           + 'soi, en L, pendant toute la série.',
      change: 'Le gainage entre dans le mouvement : ce n’est plus seulement '
            + 'le dos qui travaille.',
      garde: 'Des ischio-jambiers raides la rendent nettement plus dure — '
           + 'un travail de souplesse peut être nécessaire avant. Donnée '
           + 'comme difficile pour un débutant.',
      source: 'Bodybuilding.com, Planfit'
    }
  ];

  /* ================= L'EFFET DE BORD, ÉCRIT NOIR SUR BLANC =================

     « Strict press » avait été reclassé en SYNONYME ce matin, après
     recherche, parce que rien ne s'y opposait dans le dictionnaire : le
     développé militaire EST un strict press.

     LE PUSH PRESS CHANGE ÇA. Dès qu'il entre, « strict press » distingue à
     nouveau quelque chose — presser sans élan de jambes contre presser avec.
     Il redevient donc un geste, et ce retour est une CONSÉQUENCE de la
     décision de MB, pas une décision de plus. */
  var REND_SON_STATUT = {
    'Développé militaire § Strict press': {
      code: 'geste',
      parce_que: 'le push press entre au dictionnaire',
      faire: 'Développé au-dessus de la tête SANS aucun élan de jambes : '
           + 'les jambes restent fixes, seul le haut du corps travaille.',
      change: 'C’est l’opposé exact du push press. Le développé militaire '
            + 'est sa version talons rapprochés.',
      source: 'Fitness Volt, PowerliftingTechnique, Breaking Muscle'
    }
  };

  A.gestesAjoutes = { AJOUTS: AJOUTS, REND_SON_STATUT: REND_SON_STATUT };
})(window.App || (window.App = {}));

/* ===== les 5 valides par MB, plus le Svend press
   source : revue/gestes-valides-mb.js ===== */
/* CE QUE MB A TRANCHÉ SUR LES ONZE CANDIDATS, 2026-10-31.

   SA SORTIE, recopiée : 5 gardés, 6 écartés, 0 en suspens.

     GARDÉS   Traction nuque · Traction négative · Rowing prise neutre ·
              Curl croisé · Curl alterné
     ÉCARTÉS  Traction prise neutre · Rocky pull-up · Tirage vertical prise
              inversée · Tirage vertical prise serrée · Pompes piquées ·
              Extension des triceps en planche

   LES SIX ÉCARTÉS RESTENT ÉCRITS ICI, avec sa décision. Une proposition
   retirée en silence se represente trois semaines plus tard — c'est déjà
   arrivé sur ce projet avec « Strict press » et « Écartés Hyght ».

   ET IL A COHÉRENCE AVEC LUI-MÊME : il écarte Rocky pull-up alors qu'il
   garde Traction nuque, ce que mon doute annonçait comme lié. J'avais écrit
   « si tu ne gardes pas la traction nuque, celui-ci n'a plus de sens » —
   l'inverse ne tenait pas, et il l'a vu : Rocky pull-up alterne les deux
   trajectoires à chaque répétition, ce qui en fait un enchaînement plutôt
   qu'un geste.

   PLUS UN SIXIÈME, DEMANDÉ À PART : « Rajoute la svend press dans les
   gestes s'il te plaît, tu me fais une fiche. » */
(function (A) {
  'use strict';

  var GARDES = [
    {
      fiche: 'Traction', nom: 'Traction nuque',
      aussi: ['Behind the neck pull up'],
      faire: 'La barre passe derrière la nuque au lieu de devant la poitrine.',
      change: 'Même famille que le développé nuque et le tirage nuque : la '
            + 'mobilité d’épaule doit suivre.',
      garde: 'Les sources qui traitent les mouvements « nuque » demandent de '
           + 'pouvoir lever les bras le long des oreilles sans douleur, et '
           + 'certaines morphologies d’acromion les rendent inconfortables '
           + 'quelle que soit la technique.',
      source: 'docteur-fitness (liste dos) ; avertissement repris des '
            + 'sources du développé nuque'
    },
    {
      fiche: 'Traction', nom: 'Traction négative',
      aussi: ['Tractions négatives', 'Traction excentrique'],
      faire: 'On part en haut, menton au-dessus de la barre, et on descend '
           + 'le plus lentement possible. Pas de phase montante.',
      change: 'C’est la phase qui change, pas le matériel. La façon '
            + 'classique de progresser quand la traction complète ne passe '
            + 'pas encore.',
      source: 'docteur-fitness (liste dos) ; progressions décrites par '
            + 'BarBend pour le muscle-up'
    },
    {
      fiche: 'Rowing', nom: 'Rowing prise neutre',
      aussi: ['Rowing en prise neutre'],
      faire: 'Paumes face à face pendant tout le tirage, mains parallèles.',
      change: 'Une prise, pas un engin : le coude reste plus près du corps '
            + 'qu’en pronation.',
      source: 'docteur-fitness (liste dos)'
    },
    {
      fiche: 'Curl biceps', nom: 'Curl croisé',
      aussi: ['Curl biceps croisé', 'Cross body curl'],
      faire: 'L’haltère monte en diagonale vers l’épaule opposée, sans '
           + 'rotation du poignet : la prise reste neutre tout du long.',
      change: 'La trajectoire traverse le corps et la prise neutre charge '
            + 'davantage le brachial et le brachio-radial.',
      source: 'docteur-fitness (liste biceps)'
    },
    {
      fiche: 'Curl biceps', nom: 'Curl alterné',
      aussi: ['Curl biceps alterné'],
      faire: 'Un bras monte pendant que l’autre descend, au lieu des deux '
           + 'ensemble.',
      change: 'Chaque bras reste plus longtemps sous tension, et on peut '
            + 'charger un peu plus lourd qu’en simultané.',
      source: 'docteur-fitness (liste biceps)'
    },

    /* ---------------- demandé à part par MB ---------------- */
    {
      fiche: 'Développé serré', nom: 'Svend press',
      aussi: ['Plate press', 'Développé avec disques'],
      faire: 'Deux disques légers pincés entre les paumes, tenus contre la '
           + 'poitrine. On serre fort, puis on tend les bras devant soi '
           + 'jusqu’au verrouillage, et on revient.',
      change: 'La tension vient de la PRESSION des paumes l’une contre '
            + 'l’autre, pas de la charge. Même principe que le hex press, '
            + 'qui est déjà un geste de cette fiche.',
      garde: 'Charge très légère — 2 à 5 kg par disque — et mouvement lent, '
           + 'sinon il n’y a rien à serrer. Garder les mains à hauteur de '
           + 'poitrine : trop haut, le travail part dans les épaules.',
      source: 'BarBend, Svend press et Plate pinch press'
    }
  ];

  /* ================= LES SIX ÉCARTÉS, ET LA RAISON ================= */
  var ECARTES = [
    { nom: 'Traction prise neutre',
      pourquoi: 'écarté par MB — une prise de plus pour peu de différence' },
    { nom: 'Rocky pull-up',
      pourquoi: 'écarté par MB. Mon doute le disait lié à la traction nuque, '
              + 'qu’il garde ; il reste un ENCHAÎNEMENT de deux trajectoires '
              + 'plutôt qu’un geste' },
    { nom: 'Tirage vertical prise inversée',
      pourquoi: 'écarté par MB — les études ne trouvent pas de différence '
              + 'significative de grand dorsal selon la prise' },
    { nom: 'Tirage vertical prise serrée',
      pourquoi: 'écarté par MB, même raison' },
    { nom: 'Pompes piquées',
      pourquoi: 'écarté par MB. C’était mon plus gros doute : l’angle est si '
              + 'différent que le travail passe aux épaules' },
    { nom: 'Extension des triceps en planche',
      pourquoi: 'écarté par MB. Je le disais proche des pompes diamant dans '
              + 'l’esprit' }
  ];

  A.gestesValidesMB = { GARDES: GARDES, ECARTES: ECARTES };
})(window.App || (window.App = {}));

/* ===== les 6 gestes nes de la fusion des tractions
   source : revue/tractions-regroupees.js ===== */
/* LES TRACTIONS, REGROUPÉES — décision de MB, 2026-10-31.

   « J'aimerai un exo Traction avec les 4-5 tractions qui sont possibles et
   pareil pour Traction partielle. » Puis, devant l'écran : « Donc "Dos", je
   vois Pull up... Mais c'est traction en fait, ya un doublon flagrant,
   règle moi ça aussi. »

   HUIT FICHES DEVIENNENT DEUX. Mesuré avant d'écrire :

     Traction          ← Pull up (renommée), Chin up, prise large, prise serrée
     Traction partielle ← elle-même, supinée, prise large, prise serrée

   CE QUE LA FUSION COÛTE, ET C'EST MESURÉ. Les huit fiches partagent SIX
   muscles — grand pectoral, grand dorsal, grand rond, biceps, brachial,
   brachio-radial. La SEULE différence tient au **trapèze** : présent sur la
   pronée et la prise large, absent sur la supinée et la prise serrée. Une
   fiche unique doit donc trancher, et elle le porte — c'est la prise la plus
   courante. L'explication du geste « supinée » dit ce qui change.

   ET LA MESURE DU CARNET EST CONFIRMÉE PAR LA RECHERCHE : une étude trouve
   le pectoral et le biceps plus actifs en supination, et le trapèze
   inférieur plus actif en pronation. C'est exactement la différence que le
   dictionnaire portait déjà.

   LA LARGEUR, EN REVANCHE, EST BEAUCOUP MOINS NETTE, et c'est dit dans son
   explication plutôt que caché : les effets rapportés sont petits et
   inconsistants, et une étude sur le tirage vertical ne trouve pas de
   différence significative selon la prise.

   RIEN N'EST SUPPRIMÉ DU CARNET. Les six noms absorbés deviennent des
   écritures de leur fiche d'accueil : « Chin up » reste cherchable, et une
   séance passée qui le porte continue de se retrouver. */
(function (A) {
  'use strict';

  var RENOMMER = { 'Pull up': 'Traction' };

  var ABSORPTIONS = [
    /* ---------- vers « Traction » ---------- */
    {
      vers: 'Pull up',            /* nom AVANT renommage */
      fiche: 'Chin up',
      geste: 'Traction supinée',
      faire: 'Paumes tournées vers soi, mains à largeur d’épaules.',
      change: 'Une étude trouve le pectoral et le biceps plus actifs qu’en pronation, le trapèze inférieur moins.',
      garde: 'Le trapèze que porte la fiche « Traction » travaille MOINS '
           + 'ici. Une autre source nuance : à charge suffisante, les deux '
           + 'prises activent assez semblablement — la différence est '
           + 'réelle mais plus petite qu’on ne le dit souvent.',
      source: 'étude de tirage vertical citée par Fitness Volt, comparatif '
            + 'pull-up / chin-up, Breaking Muscle'
    },
    {
      vers: 'Pull up',
      fiche: 'Traction prise large',
      geste: 'Traction prise large',
      faire: 'Mains nettement plus larges que les épaules, paumes vers '
           + 'l’avant.',
      change: 'Censée reporter le travail sur le haut du grand dorsal et le '
            + 'grand rond.',
      garde: 'LA MESURE NE SUIT PAS TRÈS BIEN. Les effets de largeur '
           + 'rapportés sont petits et inconsistants ; une étude sur le '
           + 'tirage vertical ne trouve PAS de différence significative '
           + 'd’activation du grand dorsal selon la prise. Les affirmations '
           + 'les plus tranchées viennent de blogs sans source primaire.',
      source: 'Andersen et al. via StrengthLog, Breaking Muscle, '
            + 'revue de Fitness Volt'
    },
    {
      vers: 'Pull up',
      fiche: 'Traction prise serrée',
      geste: 'Traction prise serrée',
      faire: 'Mains proches l’une de l’autre, paumes vers l’avant.',
      change: 'Amplitude plus longue, et les fléchisseurs du coude prennent '
            + 'une part plus grande qu’en prise large.',
      garde: 'Même réserve que pour la prise large : l’effet de la largeur '
           + 'est faible dans les mesures, bien plus faible que dans ce '
           + 'qu’on en lit.',
      source: 'Andersen et al. via StrengthLog, Breaking Muscle'
    },

    /* ---------- vers « Traction partielle » ---------- */
    {
      vers: 'Traction partielle',
      fiche: 'Traction partielle supinée',
      geste: 'Traction partielle supinée',
      faire: 'Traction partielle, paumes tournées vers soi.',
      change: 'Même différence qu’entre traction et traction supinée : plus '
            + 'de biceps et de pectoral, moins de trapèze.',
      source: 'même étude que la traction supinée'
    },
    {
      vers: 'Traction partielle',
      fiche: 'Traction partielle prise large',
      geste: 'Traction partielle prise large',
      faire: 'Traction partielle, mains nettement plus larges que les '
           + 'épaules.',
      change: 'Travail orienté vers le haut du dos sur la portion choisie.',
      garde: 'Même réserve sur la largeur : l’effet mesuré est petit.',
      source: 'Andersen et al. via StrengthLog'
    },
    {
      vers: 'Traction partielle',
      fiche: 'Traction partielle prise serrée',
      geste: 'Traction partielle prise serrée',
      faire: 'Traction partielle, mains proches l’une de l’autre.',
      change: 'Les fléchisseurs du coude prennent davantage sur la portion '
            + 'travaillée.',
      garde: 'Même réserve sur la largeur.',
      source: 'Andersen et al. via StrengthLog'
    }
  ];

  A.tractionsRegroupees = { RENOMMER: RENOMMER, ABSORPTIONS: ABSORPTIONS };
})(window.App || (window.App = {}));

/* ================= L'AGREGAT, LA SEULE PORTE =================

   Les blocs ci-dessus sont les fichiers de revue, repris tels quels pour
   qu'un mot relu par MB ne soit jamais retape. Ils posent chacun leur
   propre cle sur `App`. CE BLOC est ce que l'application appelle — rien
   d'autre, pour qu'un changement de forme la-haut ne se propage pas.

   `gestesDe(nomDeFiche)` rend les gestes d'un mouvement, chacun avec son
   `faire`, son `change` et sa `source`.
   `explicationDe(nomDeFiche)` rend celle du mouvement lui-meme.
   `estUnGeste(nomDeFiche, nom)` dit si un nom est un geste de cette fiche. */
(function (A) {
  'use strict';

  var PAR_FICHE = {};

  function poser(fiche, nom, x, aussi) {
    if (!fiche || !nom) return;
    var l = PAR_FICHE[fiche] = PAR_FICHE[fiche] || [];
    if (l.some(function (g) { return g.nom === nom; })) return;
    l.push({ nom: nom, aussi: (aussi || []).slice(),
             faire: x.faire || '', change: x.change || '',
             garde: x.garde || '', source: x.source || '' });
  }

  /* LES TRACTIONS D'ABORD : leurs gestes visent la fiche d'ACCUEIL, qui a
     ete renommee depuis. On vise le nom d'aujourd'hui. */
  var TR = A.tractionsRegroupees || { RENOMMER: {}, ABSORPTIONS: [] };
  TR.ABSORPTIONS.forEach(function (a) {
    poser(TR.RENOMMER[a.vers] || a.vers, a.geste, a, []);
  });

  (A.gestesAjoutes && A.gestesAjoutes.AJOUTS || []).forEach(function (g) {
    poser(TR.RENOMMER[g.fiche] || g.fiche, g.nom, g, g.aussi);
  });
  (A.gestesValidesMB && A.gestesValidesMB.GARDES || []).forEach(function (g) {
    poser(TR.RENOMMER[g.fiche] || g.fiche, g.nom, g, g.aussi);
  });
  var RSS = (A.gestesAjoutes && A.gestesAjoutes.REND_SON_STATUT) || {};
  Object.keys(RSS).forEach(function (id) {
    var p = id.split(' \u00a7 ');
    poser(TR.RENOMMER[p[0]] || p[0], p[1], RSS[id], []);
  });

  /* LES QUATORZE PREMIERS GESTES : leur fichier ne dit pas de quelle fiche
     ils relevent — c'est le classement qui le disait. On le retrouve en
     cherchant le nom dans les `aussi` du dictionnaire, ce qui est plus sur
     qu'une table a tenir a jour. */
  var E = (A.explicationsGestes && A.explicationsGestes.E) || {};
  Object.keys(E).forEach(function (nom) {
    var f = (A.m && A.m.DICTIONNAIRE || []).filter(function (d) {
      return (d.aussi || []).indexOf(nom) >= 0;
    })[0];
    if (f) poser(f.nom, nom, E[nom], []);
  });

  var BASE = (A.explicationsBase && A.explicationsBase.BASE) || {};

  A.gestes = {
    PAR_FICHE: PAR_FICHE,
    gestesDe: function (fiche) { return (PAR_FICHE[fiche] || []).slice(); },
    explicationDe: function (fiche) { return BASE[fiche] || null; },
    estUnGeste: function (fiche, nom) {
      return (PAR_FICHE[fiche] || []).some(function (g) { return g.nom === nom; });
    }
  };
})(window.App || (window.App = {}));
