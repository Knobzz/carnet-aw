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
