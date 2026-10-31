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
      faire: 'Poitrine posée sur un banc incliné, face au dossier, les bras '
           + 'pendent dans le vide. On monte sans que l’épaule ni le torse '
           + 'ne bougent.',
      change: 'Le banc bloque le tronc : impossible de tricher en balançant '
            + 'le buste. Amplitude large, mais on charge moins lourd qu’un '
            + 'drag curl.',
      source: 'PureGym, Muscle & Strength, comparatif Gymkee'
    },
    'Drag curl': {
      faire: 'Le poids « traîne » le long du corps au lieu de décrire un arc '
           + 'devant soi : les coudes reculent derrière le torse pendant la '
           + 'montée.',
      change: 'Insiste sur le chef court du biceps. On peut charger plus '
            + 'lourd qu’au spider curl, pour une amplitude plus courte.',
      garde: 'Ne pas hausser les épaules pour aider — c’est le signe que la '
           + 'charge est trop lourde.',
      source: 'Outlift, comparatif Gymkee'
    },
    'Bayesian curl': {
      faire: 'À la poulie, debout dos à la machine, le bras part en arrière '
           + 'du corps et on curle de là. Aussi appelé curl derrière le dos.',
      change: 'L’épaule en extension met le chef long du biceps sous tension '
            + 'dès le départ, et le câble maintient cette tension du début à '
            + 'la fin — ce qu’un haltère ne fait pas.',
      source: 'BarBend, StrengthLog'
    },
    'Waiter curl': {
      faire: 'Un seul haltère, tenu à plat dans les deux paumes par le '
           + 'dessous — comme un plateau de serveur. Le dessus de l’haltère '
           + 'reste tourné vers le haut tout le long.',
      change: 'La prise par-dessous empêche de refermer les doigts, donc '
            + 'd’aider avec les avant-bras. Le chef long travaille.',
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
      faire: 'Un enchaînement : tirage menton, puis rotation externe des '
           + 'épaules, puis développé au-dessus de la tête.',
      change: 'C’EST UN MOUVEMENT COMPOSÉ, pas une rotation. La rotation '
            + 'cubaine en est la version dépouillée : elle garde la seule '
            + 'rotation externe et laisse tomber le tirage et le développé. '
            + 'Le press travaille deltoïdes et haut du dos en plus de la '
            + 'coiffe.',
      garde: 'Charge légère : la coiffe est minuscule à côté des deltoïdes '
           + 'et lâche vite.',
      source: 'Mirafit, Fitness Volt, Sole Treadmills'
    },
    'Rotation externe coude au corps': {
      faire: 'Coude collé au flanc, avant-bras qui part vers l’extérieur.',
      change: 'Coude au corps contre bras en abduction à 90°, ce n’est pas '
            + 'le même angle d’épaule. Les cliniciens commencent par le '
            + 'coude au corps parce qu’il réduit le pincement de la coiffe, '
            + 'et vont vers l’abduction quand l’épaule le supporte.',
      garde: 'Aucune étude comparant directement les deux positions n’est '
           + 'ressortie de la recherche : ce classement vient de la '
           + 'pratique clinique, pas d’un essai.',
      source: 'Eric Cressey, tables de tests cliniques'
    },
    'Rotation interne coude au corps': {
      faire: 'Coude collé au flanc, avant-bras qui revient vers le ventre.',
      change: 'Même raison que l’externe : le coude au corps et l’abduction '
            + 'à 90° ne chargent pas la même chose. Les deux vont ensemble — '
            + 'si tu gardes l’un, garde l’autre.',
      source: 'Eric Cressey, tables de tests cliniques'
    },

    /* ---------------- pectoraux / triceps ---------------- */
    'Hex press': {
      faire: 'Deux haltères pressés l’un contre l’autre, les têtes qui se '
           + 'touchent, et on serre pendant toute la montée. Prise neutre, '
           + 'coudes serrés.',
      change: 'La tension vient de la PRESSION entre les deux haltères, pas '
            + 'de la largeur de prise. Ce n’est pas le même geste qu’un '
            + 'développé serré à la barre, qui est le mouvement lourd ; le '
            + 'hex press est un accessoire, plus léger.',
      garde: 'La recherche n’a pas donné de guide détaillé : les sources '
           + 'disent qu’il « ressemble » au développé haltères prise serrée '
           + 'sans toujours détailler la différence.',
      source: 'Breaking Muscle, BarBend, Fitness Volt'
    },
    'Pompes diamant': {
      faire: 'Mains rapprochées sous la poitrine, index et pouces qui '
           + 'forment un losange. Coudes serrés le long des côtes.',
      change: 'Les triceps passent devant, les pectoraux et les épaules '
            + 'derrière. Plus dur qu’une pompe large.',
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
