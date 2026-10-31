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
