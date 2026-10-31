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
      faire: 'Debout, barre tenue derrière les fesses, paumes vers l’arrière. '
           + 'On laisse la barre rouler vers le bout des doigts, puis on '
           + 'referme en remontant par la seule flexion du poignet.',
      change: 'La charge passe DERRIÈRE la ligne médiane du corps, et c’est '
            + 'tout l’intérêt pour toi : c’est la position du hook et du '
            + 'toproll. Un wrist curl ordinaire, assis bras sur les cuisses, '
            + 'ne te met jamais là.',
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
      faire: 'Même départ qu’un développé militaire, mais les jambes '
           + 'lancent la barre : une flexion courte des hanches, genoux et '
           + 'chevilles, puis on finit aux épaules.',
      change: 'C’EST LUI QUI DONNE SON SENS À « STRICT PRESS ». Tant qu’il '
            + 'n’était pas au carnet, « strict press » ne distinguait rien — '
            + 'il redevient un geste du moment que le push press existe à '
            + 'côté. Et l’élan permet de charger nettement plus lourd : une '
            + 'source avance environ 30 % de plus, chiffre à prendre comme '
            + 'un ordre de grandeur, pas comme une mesure.',
      source: 'Fitness Volt, PowerliftingTechnique, BarBend'
    },

    /* ================= LES CLASSIQUES ABSENTS ================= */
    {
      fiche: 'Développé militaire',
      nom: 'Z press',
      aussi: ['Développé assis au sol', 'Z-press'],
      faire: 'Assis au sol, jambes tendues devant soi, sans banc et sans '
           + 'appui dans le dos. On presse la barre au-dessus de la tête.',
      change: 'Ni jambes ni dossier : rien pour tricher, ni élan ni '
            + 'cambrure. Le gainage devient la limite avant les épaules.',
      garde: 'Les sources s’accordent à en faire un ACCESSOIRE, pas un '
           + 'mouvement principal : on y charge moins qu’assis sur un banc, '
           + 'et son rôle est d’améliorer le développé ordinaire.',
      source: 'BarBend, PowerliftingTechnique, Muscle & Strength'
    },
    {
      fiche: 'Développé couché',
      nom: 'Développé au sol',
      aussi: ['Floor press', 'Développé couché au sol'],
      faire: 'Allongé au sol au lieu d’un banc. Les coudes touchent le sol '
           + 'en bas, ce qui arrête la descente avant la poitrine.',
      change: 'Amplitude raccourcie par le sol : sert surtout le verrouillage '
            + 'en fin de poussée, et épargne l’épaule de la position basse.',
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
      faire: 'Buste à l’horizontale, et la barre REPOSE AU SOL entre chaque '
           + 'répétition. Chaque tirage repart de l’arrêt complet.',
      change: 'C’est la seule différence avec un rowing ordinaire, et elle '
            + 'est nette : le départ et l’amplitude. Pas d’élan accumulé '
            + 'd’une rép à l’autre.',
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
      faire: 'Mains l’une devant l’autre SUR la barre, dans son axe, et le '
           + 'corps monte en se décalant d’un côté puis de l’autre à chaque '
           + 'répétition.',
      change: 'Le décalage latéral attaque le dos sous un angle que la '
            + 'traction de face ne donne pas, et change de côté à chaque '
            + 'rép.',
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
