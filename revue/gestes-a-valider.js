/* LES GESTES TROUVÉS CHEZ DOCTEUR-FITNESS — à valider par MB, 2026-10-31.

   MB : « Check ici pour les gestes : docteur-fitness.com/exercice-musculation »
   puis « Evite tout exo avec équipement, on peut les rajouter, je cherche
   vraiment des gestes particuliers, fais moi une liste, je la validerai ou
   non. »

   CE QUI A ÉTÉ LU : les quatre listes qui touchent le carnet — biceps (34),
   dos (77), épaules (58), triceps (38), soit 207 entrées, lues dans le
   navigateur page par page.

   LE FILTRE, ET IL EST SÉVÈRE. Sur ces 207, j'écarte :

     - tout ce qui ne diffère que par l'ENGIN — « Curl allongé à la poulie »,
       « Curl overhead avec élastique », « Rowing à la landmine ». C'est
       l'étage 3, et c'est exactement ce que MB a fait retirer le 31/10 ;
     - tout ce qui est un EXERCICE à part entière et non une façon de faire
       un mouvement existant — thruster, arraché, front lever, soulevé de
       terre, sled pull, superman, bird dog, planche inversée ;
     - ce que MB a déjà tranché — Renegade row et Svend press (« pas de
       fiche », 30/10), Croix de fer et Handstand push-up (écrémage) ;
     - ce que le carnet a déjà.

   IL RESTE ONZE. Chacun change la FAÇON de faire un mouvement que le carnet
   porte déjà : la prise, la trajectoire, la phase, l'angle du corps. Aucun
   n'a besoin d'un engin pour exister.

   ET LA SOURCE EST UN CATALOGUE, PAS UNE ÉTUDE. docteur-fitness liste et
   illustre ; il ne mesure pas. Les onze sont donnés comme CANDIDATS, et
   `doute` dit ceux où je ne suis pas sûr que ce soit un geste plutôt qu'un
   exercice à part. */
(function (A) {
  'use strict';

  var CANDIDATS = [
    /* ---------------- Traction ---------------- */
    {
      fiche: 'Traction', nom: 'Traction nuque',
      aussi: ['Behind the neck pull up'],
      change: 'La barre passe derrière la nuque au lieu de devant la '
            + 'poitrine.',
      pourquoi_geste: 'Rien d’autre ne change : même barre, même prise. '
            + 'C’est la trajectoire du corps qui diffère.',
      garde: 'Même famille que le développé nuque et le tirage nuque, que le '
           + 'carnet porte déjà avec leur avertissement de mobilité '
           + 'd’épaule. Si tu gardes les deux autres, celui-ci suit.'
    },
    {
      fiche: 'Traction', nom: 'Traction prise neutre',
      aussi: ['Tractions prise neutre', 'Neutral grip pull up'],
      change: 'Paumes face à face, mains parallèles.',
      pourquoi_geste: 'Une prise, pas un engin — on la fait sur la même '
            + 'barre dès qu’elle a des poignées parallèles.'
    },
    {
      fiche: 'Traction', nom: 'Traction négative',
      aussi: ['Tractions négatives', 'Traction excentrique'],
      change: 'On ne monte pas : on part en haut et on descend le plus '
            + 'lentement possible.',
      pourquoi_geste: 'C’est la PHASE qui change, pas le matériel. C’est '
            + 'aussi la façon classique de progresser quand la traction '
            + 'complète ne passe pas encore.'
    },
    {
      fiche: 'Traction', nom: 'Rocky pull-up',
      aussi: ['Rocky pull up'],
      change: 'On alterne : une répétition devant la poitrine, la suivante '
            + 'derrière la nuque.',
      pourquoi_geste: 'Un enchaînement de deux trajectoires sur la même '
            + 'barre.',
      doute: 'Il combine la traction et la traction nuque. Si tu ne gardes '
           + 'pas la traction nuque, celui-ci n’a plus de sens.'
    },

    /* ---------------- Tirage vertical ---------------- */
    {
      fiche: 'Tirage vertical', nom: 'Tirage vertical prise inversée',
      aussi: ['Tirage vertical en supination', 'Tirage supination'],
      change: 'Paumes tournées vers soi.',
      pourquoi_geste: 'La prise, sur la même barre de poulie.',
      garde: 'Le carnet porte déjà, pour la traction, la mesure qui dit que '
           + 'la supination charge plus le biceps et moins le trapèze '
           + 'inférieur. Et plusieurs études ne trouvent PAS de différence '
           + 'significative de grand dorsal selon la prise.'
    },
    {
      fiche: 'Tirage vertical', nom: 'Tirage vertical prise serrée',
      aussi: ['Tirage prise serrée'],
      change: 'Mains rapprochées sur la barre.',
      pourquoi_geste: 'Une prise.',
      doute: 'Même réserve que ci-dessus : l’effet de la largeur est petit '
           + 'dans les mesures. Si tu trouves que ça fait trop de gestes '
           + 'pour peu de différence, celui-là est le premier à sauter.'
    },

    /* ---------------- Rowing ---------------- */
    {
      fiche: 'Rowing', nom: 'Rowing prise neutre',
      aussi: ['Rowing en prise neutre'],
      change: 'Paumes face à face pendant le tirage.',
      pourquoi_geste: 'Une prise, pas un engin.'
    },

    /* ---------------- Pompes ---------------- */
    {
      fiche: 'Pompes', nom: 'Pompes piquées',
      aussi: ['Pike push up'],
      change: 'Bassin haut, corps en V renversé : on pousse vers le haut '
            + 'plutôt que vers l’avant.',
      pourquoi_geste: 'Aucun matériel, seulement la position du corps.',
      doute: 'C’EST LE PLUS DISCUTABLE DES ONZE. L’angle est si différent '
           + 'que le travail passe aux épaules — docteur-fitness le range '
           + 'd’ailleurs dans les exercices d’ÉPAULES, pas de pectoraux. '
           + 'C’est peut-être un exercice à part plutôt qu’un geste.'
    },

    /* ---------------- Curl biceps ---------------- */
    {
      fiche: 'Curl biceps', nom: 'Curl croisé',
      aussi: ['Curl biceps croisé', 'Cross body curl'],
      change: 'L’haltère monte en diagonale vers l’épaule opposée, sans '
            + 'rotation du poignet.',
      pourquoi_geste: 'Une trajectoire. On garde l’haltère qu’on avait.'
    },
    {
      fiche: 'Curl biceps', nom: 'Curl alterné',
      aussi: ['Curl biceps alterné'],
      change: 'Un bras monte pendant que l’autre descend, au lieu des deux '
            + 'ensemble.',
      pourquoi_geste: 'Le rythme, pas le matériel.',
      doute: 'Est-ce vraiment un geste différent, ou juste une façon de '
           + 'compter ses séries ? Je penche pour le geste — la charge '
           + 'tient plus longtemps sur chaque bras — mais c’est léger.'
    },

    /* ---------------- Triceps ---------------- */
    {
      fiche: 'Extension triceps', nom: 'Extension des triceps en planche',
      aussi: ['Extension triceps au sol'],
      change: 'En position de planche, sur les avant-bras, on tend les '
            + 'coudes pour monter sur les mains.',
      pourquoi_geste: 'Au poids du corps, sans rien.',
      doute: 'Proche des pompes diamant dans l’esprit. À ranger peut-être '
           + 'sous « Pompes » plutôt que sous « Extension triceps ».'
    }
  ];

  /* ================= CE QUE J'AI ÉCARTÉ, ET POURQUOI =================
     Écrit pour que MB puisse CONTESTER le filtre, pas seulement la liste.
     Un tri dont on ne voit que le résultat ne se vérifie pas. */
  var ECARTES = [
    { quoi: 'Front lever, Thruster, Arraché, Soulevé de terre, Sled pull, '
          + 'Superman, Bird dog, Planche inversée, Suspension passive',
      pourquoi: 'exercices à part entière, pas des façons de faire un '
              + 'mouvement que le carnet porte déjà' },
    { quoi: 'Tractions aux anneaux, avec sangles, assistées (banc, élastique, '
          + 'machine), lestées',
      pourquoi: 'c’est l’engin qui change — étage 3' },
    { quoi: 'Rowing à la landmine, à la barre en T, à la Smith, sur banc '
          + 'incliné, assis à la machine (sept variantes)',
      pourquoi: 'l’engin, encore' },
    { quoi: 'Curl allongé à la poulie, overhead avec élastique, en position '
          + 'squat, haltère incliné avec rotation',
      pourquoi: 'l’engin ou la position — et MB a fait retirer ces écritures '
              + 'le 31/10' },
    { quoi: 'Renegade row, Svend press',
      pourquoi: 'MB a tranché « pas de fiche » le 30/10' },
    { quoi: 'Croix de fer, Handstand push-up, Gripper',
      pourquoi: 'retirés par MB à l’écrémage' },
    { quoi: 'Shrugs (barre, haltères, poulie, machine, élastique)',
      pourquoi: 'le carnet a « Haussement d’épaules » et son geste '
              + '« Overhead shrug » ; le reste est de l’engin' },
    { quoi: 'Tout le bas du corps, les lombaires et les abdominaux',
      pourquoi: 'hors du périmètre du carnet, qui s’arrête au haut du corps' }
  ];

  A.gestesAValider = { CANDIDATS: CANDIDATS, ECARTES: ECARTES,
                       SOURCE: 'docteur-fitness.com, listes biceps / dos / '
                             + 'épaules / triceps (207 entrées), lues le '
                             + '2026-10-31' };
})(window.App || (window.App = {}));
