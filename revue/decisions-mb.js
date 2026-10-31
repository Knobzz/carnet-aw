/* CE QUE MB A TRANCHÉ LE 2026-10-31, sur la page des variantes.

   Rien n'est appliqué au carnet : ce fichier sert à la SIMULATION, pour
   qu'il voie l'écran final avant qu'on touche au modèle.

   TROIS REGISTRES, recopiés de sa sortie :
     - `retirer`  : les variantes qui partent, et les écritures qu'elles
                    emportent avec elles ;
     - `renommer` : les exercices à renommer ;
     - `ajouter`  : les variantes à créer.

   UNE VARIANTE RETIRÉE EMPORTE SES ÉCRITURES. « Curl Zottman ▸ haltères »
   vaut pour « Curl Zottman avec haltères » ET « Zottman curl haltères » :
   c'est ce que la page affichait entre parenthèses, et c'est ce que ce
   fichier garde. */
(function (A) {
  'use strict';

  var RETIRER = {
    'Curl Zottman': ['haltères'],
    'Curl biceps': ['haltères · incliné debout', 'élastique · overhead',
                    'poulie · allongé', 'haltères · incliné avec rotation'],
    'Curl pronation à la poulie': ['poulie'],
    'Curl rising à la poulie': ['poulie'],
    'Dips prise serrée': ['banc', 'banc · entre deux', 'sur chaise'],
    'Développé Arnold': ['haltères'],
    'Développé militaire': ['élastique · unilatéral', 'élastique · assis',
                            'landmine · debout', 'landmine · à genoux unilatéral'],
    'Extenseurs à élastique': ['élastique'],
    'Extension verticale des triceps': ['barre · assis', 'poulie · basse',
                                        'élastique · au-dessus de la tête'],
    'Face pull': ['poulie · couché', 'corde · au visage', 'corde'],
    'Hammer curl': ['haltères · prise marteau',
                    'haltères · au pupitre prise marteau',
                    'élastique · prise marteau'],
    'Hook à la poulie': ['poulie'],
    'Oiseau': ['élastique · arrière', 'élastique · horizontale', 'élastique'],
    'Pull-over': ['machine · assis'],
    'Rotation externe d’épaule': ['haltères · couché', 'élastique · en abduction'],
    'Rotation interne d’épaule': ['poulie · à 90°'],
    'Rétraction des omoplates': ['machine · assis'],
    'Tate press': ['haltères · un bras'],
    'Tirage vertical': ['poulie · haute'],
    'Toproll à la poulie': ['poulie'],
    'Triceps kickback': ['haltères · debout', 'poulie · concentré',
                         'poulie · horizontale'],
    'Écarté': ['poulie · vis-à-vis couché', 'landmine · unilatéral'],
    'Élévation frontale': ['barre · allongé', 'poulie'],
    'Élévation latérale': ['poulie · unilatéral', 'machine · debout', 'landmine']
  };

  var RENOMMER = {
    'Extension triceps à la poulie': 'Extension triceps'
  };

  var AJOUTER = {
    'Cup hold': ['barre'],
    'Développé serré': ['barre'],
    'Déviation ulnaire': ['élastique'],
    'Finger curl': ['kettlebell', 'haltères'],
    'Oiseau': ['haltères'],
    'Pronation': ['élastique'],
    'Rising': ['élastique'],
    'Rotation cubaine': ['haltères'],
    'Rotation externe d’épaule': ['haltères'],
    'Rotation interne d’épaule': ['haltères', 'poulie'],
    'Rowing': ['barre seal'],
    'Wrist curl côté petit doigt': ['poulie', 'haltères'],
    'Wrist curl côté pouce': ['poulie', 'haltères'],
    'Élévation en Y': ['haltères']
  };

  /* CE QUE MB A DEMANDÉ DE RETIRER DE L'ÉCRAN « Ajouter un exercice ».

     LE PRIX DU CÔTÉ EST MESURÉ, et il n'est pas nul : `exercicesAyantCharge`
     relie une douleur DROITE ou GAUCHE aux exercices qui l'ont chargée, et
     le Suivi affiche un jeton de côté. Le retirer ferme ce lien pour les
     séances à venir — les anciennes gardent le leur.

     LA PRISE, elle, n'apparaît que comme étiquette dans le Journal.

     « NIVEAU (GRIPPER) » : zéro usage mesuré dans le carnet de démonstration
     de ce navigateur. Les vraies données de MB sont sur son téléphone et
     n'ont PAS pu être mesurées. */
  var ECRAN = { cote: false, prise: false, niveau: false };

  A.decisionsMB = { RETIRER: RETIRER, RENOMMER: RENOMMER,
                    AJOUTER: AJOUTER, ECRAN: ECRAN };
})(window.App || (window.App = {}));
