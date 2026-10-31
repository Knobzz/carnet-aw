/* LES 105 AUTRES NOMS, CLASSÉS — proposition, pas décision.

   MB, 31/10 : « j'aimerai qu'on revoit les autres noms connus des exos ».
   Hier il a dû cocher 298 écritures une par une et il l'a mal vécu : « putain
   mais je suis dégouté [...] pourquoi je dois tout refaire ». Donc cette
   fois le classement est FAIT, et il n'a qu'à corriger ce qui cloche.

   TROIS CASES, et une seule question derrière chacune :

     'geste'  Le mouvement s'exécute AUTREMENT. Il mérite l'étage 2.
              Test : deux personnes qui font l'un et l'autre ne font pas
              le même geste — Spider curl contre Curl biceps.

     'mat'    La différence est le MATÉRIEL ou la POSITION. Elle appartient
              à l'étage 3, pas à un nom.
              Test : la différence tient en un jeton — « assis », « poulie ».

     'syn'    Le même geste, un autre mot. Il reste CHERCHABLE et ne monte
              nulle part. C'est le cas de loin le plus fréquent.

   `doute` marque les DOUZE où je ne suis pas sûr, avec la raison.
   Ce sont ceux à regarder en premier : le reste est franc.

   CE QUE CE CLASSEMENT NE SUPPRIME DE RIEN : aucun de ces noms ne quitte le
   carnet. Un 'syn' reste trouvable à la recherche, exactement comme
   aujourd'hui. Le classement décide seulement de ce qui s'AFFICHE à
   l'étage 2. */
(function (A) {
  'use strict';

  var C = {
    'Développé militaire': {
      'Overhead press': 'syn',
      'Développé épaules': 'syn',
      'Shoulder press': 'syn',
      'Développé militaire debout': 'mat',
      /* RECLASSE le 31/10 APRES RECHERCHE : le developpe militaire EST un
         strict press. Ce qui s'y oppose est le PUSH press, absent du
         dictionnaire — donc ce nom ne distingue rien. */
      'Strict press': ['syn', 'Je l’avais proposé comme geste ; la recherche '
        + 'dit que le développé militaire EST le strict press. Ce qui s’y '
        + 'oppose est le PUSH press, qui n’est pas dans ton dictionnaire.'],
      'Développé épaules assis': 'mat',
      'Presse à épaules inclinée': 'mat',
      'Développé nuque': 'geste',
      'Behind the neck press': ['syn', 'Traduction de « Développé nuque », '
        + 'que mon lexique a raté : « neck » y est, « nuque » n’y est pas '
        + 'comme équivalent de « derrière ». Si tu montes « Développé nuque » '
        + 'en geste, celui-ci le suit.']
    },
    'Curl biceps': {
      'Curl debout': 'mat',
      'Curl incliné': 'mat',
      'Spider curl': 'geste',
      'Drag curl': 'geste',
      'Bayesian curl': 'geste',
      'Waiter curl': 'geste'
    },
    'Oiseau': {
      'Reverse fly': 'syn',
      'Élévation latérale buste penché': 'syn',
      'Bent over lateral raise': 'syn',
      'Écartés arrière': 'syn',
      'Pec deck inversé': 'mat'
    },
    'Déviation ulnaire': { 'Chop': 'syn', 'Inclinaison ulnaire': 'syn' },
    'Farmer walk': { 'Port de charge': 'syn' },
    'Back pressure à la poulie': {
      'Tirage arrière': 'syn', 'Back pressure': 'syn', 'Pression arrière': 'syn'
    },
    'Cup hold': { 'Cupping': 'syn', 'Tenue de poignet fermé': 'syn' },
    'Développé serré': {
      'Close grip bench press': 'syn',
      'Développé couché prise serrée': 'syn',
      'Hex press': ['geste', 'Les deux haltères serrés l’un contre l’autre '
        + 'pendant tout le mouvement — la tension vient de la pression, pas '
        + 'de la prise. Ce n’est pas le même geste qu’un développé serré à '
        + 'la barre.']
    },
    'Écarté': {
      /* RECLASSE le 31/10 APRES RECHERCHE : « Hyght » n'apparait que sur
         des sites d'applications fitness, jamais sur une source de
         reference. Ce qu'elles decrivent est un ecarte sur banc incline. */
      'Écartés Hyght': ['mat', 'Je l’avais proposé comme geste ; « Hyght » '
        + 'n’apparaît que sur des sites d’applis fitness. Ce qu’ils décrivent '
        + 'est un écarté sur banc incliné — donc du matériel.'],
      'Pec deck': 'mat',
      'Chest fly': 'syn'
    },
    'Finger curl': {
      'Rouleau de doigts': 'syn', 'Finger rolling': 'syn',
      'Enroulement des doigts': 'syn'
    },
    'Montée à la corde': { 'Rope climb': 'syn', 'Grimper de corde': 'syn' },
    'Pompes': {
      'Push up': 'syn',
      'Pompes diamant': ['geste', 'Mains en losange sous la poitrine : le '
        + 'travail passe aux triceps. Geste à mon sens — mais tu peux le voir '
        + 'comme une simple prise.'],
      'Wide push up': ['geste', 'Même question que le diamant : prise large. '
        + 'Si l’un est un geste, l’autre aussi ; si l’un est une prise, '
        + 'l’autre aussi. Ils vont ensemble.']
    },
    'Preacher curl': { 'Curl pupitre': 'syn', 'Curl Larry Scott': 'syn' },
    'Rising': { 'Déviation radiale': 'syn', 'Inclinaison radiale': 'syn' },
    'Traction prise large': {
      'Traction large': 'syn', 'Wide grip pull up': 'syn', 'Wide pull up': 'syn'
    },
    'Triceps kickback': {
      'Extension arrière': 'syn', 'Kickback alterné assis': 'mat'
    },
    'Barre au front': {
      'Skull crusher': 'syn', 'Lying triceps extension': 'syn'
    },
    'Chin up': { 'Traction supinée': 'syn', 'Traction prise supinée': 'syn' },
    'Dead hang': { 'Tenue à la barre': 'syn', 'Suspension': 'syn' },
    'Dips prise large': { 'Dips pectoraux': 'syn', 'Dips buste penché': 'syn' },
    'Dips prise serrée': { 'Dips triceps': 'syn', 'Dips buste droit': 'syn' },
    'Extension verticale des triceps': {
      'Extension nuque': 'syn', 'Overhead triceps extension': 'syn'
    },
    'Hammer curl': { 'Curl prise neutre': 'syn' },
    'Haussement d’épaules': {
      'Shrug': 'syn',
      'Overhead shrug': ['geste', 'Bras tendus au-dessus de la tête : ce '
        + 'n’est plus le même trapèze qui travaille.']
    },
    'Pince': { 'Pinch block': 'mat' },
    'Pull up': { 'Traction': 'syn', 'Traction pronée': 'syn' },
    'Rétraction des omoplates': {
      'Rétraction scapulaire': 'syn', 'Scapular retraction': 'syn'
    },
    'Rotation cubaine': {
      'Cuban press': ['geste', 'Le « press » ajoute un développé à la fin de '
        + 'la rotation — c’est un mouvement de plus, pas le même geste. '
        + 'Mais beaucoup de gens emploient les deux mots pour la même chose.']
    },
    'Rotation externe d’épaule': {
      'External rotation': 'syn',
      'Rotation externe coude au corps': ['geste', 'Coude collé au flanc '
        + 'contre bras en abduction : l’angle de l’épaule n’est pas le même, '
        + 'et c’est précisément ce que tu avais fait retirer côté variantes '
        + 'le 31/10 (« élastique · en abduction »).']
    },
    'Rotation interne d’épaule': {
      'Internal rotation': 'syn',
      'Rotation interne coude au corps': ['geste', 'Même raison que l’externe '
        + '— les deux vont ensemble.']
    },
    'Rowing': {
      'Tirage horizontal': 'syn',
      'Rowing buste penché': ['geste', 'Le bent over row. Mais « Rowing » '
        + 'tout court désigne souvent déjà celui-là — auquel cas c’est un '
        + 'synonyme.']
    },
    'Side pressure à la poulie': {
      'Presse de côté': 'syn', 'Side pressure': 'syn'
    },
    'Tirage vertical': {
      'Lat pulldown': 'syn',
      'Tirage nuque': ['geste', 'Barre derrière la nuque : même famille que '
        + '« Développé nuque », et à trancher de la même façon.']
    },
    'Traction partielle': {
      'Partial pull up': 'syn', 'Traction partielle pronée': 'syn'
    },
    'Traction partielle prise large': {
      'Partial wide grip pull up': 'syn', 'Traction partielle large': 'syn'
    },
    'Traction partielle supinée': {
      'Partial chin up': 'syn', 'Chin up partiel': 'syn'
    },
    'Wrist curl côté petit doigt': {
      'Wrist curl bord du petit doigt': 'syn',
      'Wrist curl côté auriculaire': 'syn'
    },
    'Wrist curl inversé': { 'Extension du poignet': 'syn' },
    'Curl concentré': { 'Concentration curl': 'syn' },
    'Curl pronation à la poulie': { 'Pronation curl': 'syn' },
    'Développé couché': { 'Bench press': 'syn' },
    'Développé incliné': { 'Incline bench press': 'syn' },
    'Élévation frontale': { 'Front raise': 'syn' },
    'Élévation latérale': { 'Lateral raise': 'syn' },
    'Extenseurs à élastique': { 'Ouverture de la main': 'syn' },
    'Extension triceps': { 'Pushdown': 'syn' },
    /* CORRIGE PAR MB le 31/10 : j'avais mis 'mat'. « Poignee de
       pronation » est le nom d'un OUTIL AW — le `pronator` est l'un
       des 20 types d'OUTILS_CONNUS — donc il releve de l'ETAGE 4,
       pas du materiel ordinaire. Comme nom, c'est un synonyme. */
    'Pronation': { 'Poignée de pronation': 'syn' },
    'Pull-over': { 'Pullover': 'syn' },
    'Tate press': { 'Extension coudes ouverts': 'syn' },
    'Tirage menton': { 'Upright row': 'syn' },
    'Wrist curl': { 'Flexion du poignet': 'syn' },
    'Wrist curl côté pouce': { 'Wrist curl bord du pouce': 'syn' }
  };

  /* aplati : "fiche § nom" -> { code, doute } */
  var PLAT = {};
  Object.keys(C).forEach(function (f) {
    Object.keys(C[f]).forEach(function (n) {
      var v = C[f][n];
      PLAT[f + ' § ' + n] = Array.isArray(v)
        ? { code: v[0], doute: v[1] }
        : { code: v, doute: null };
    });
  });

  A.classementNoms = { PAR_FICHE: C, PLAT: PLAT };
})(window.App || (window.App = {}));
