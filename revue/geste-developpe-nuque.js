/* LE DERNIER GESTE DU CHANTIER 2 — « Développé nuque », 2026-11-04.

   CE QU'IL RESTAIT. La planche d'écrémage portait 13 décisions « en faire
   une variante » ; 10 sont devenues des gestes le 31/10. Des trois
   restantes, deux sont des MACHINES (Pec deck, Pec deck inversé) que les
   quatre étages rangent dans Matériel — « Machine » y figure déjà, vérifié.
   Celle-ci est la seule qui soit vraiment un geste.

   IL NE S'APPELLE PAS « BEHIND THE NECK PRESS », et c'est MB qui l'avait
   tranché. `revue/classement-noms.js` :

       'Développé nuque': 'geste',
       'Behind the neck press': ['syn', 'Traduction de « Développé nuque »…']

   J'avais annoncé « le geste Behind the neck press » dans trois messages :
   c'était son synonyme anglais que je prenais pour son nom. Le classement
   le disait depuis le 31/10.

   SA SOURCE EST MEILLEURE QUE CELLE DE LA PLANCHE. Elle disait « deltoïdes
   latéral et postérieur nettement plus sollicités », sur la foi de
   Muscle & Strength, StrengthLevel et Legion — des comparateurs. Une
   recherche du 04/11 a trouvé l'étude qui le MESURE, et elle compare
   exactement les deux variantes.

   CE QUE L'ÉTUDE NE DIT PAS, et qui n'est donc pas écrit comme un fait :
   elle ne mesure AUCUN risque de blessure. Son introduction rapporte deux
   travaux tiers — l'un évoque une instabilité antérieure possible mais
   « not conclusive », l'autre juge les deux variantes sûres « for
   participants with normal trunk stability and ideal shoulder ROM ». C'est
   cette condition-là que `garde` reprend, en disant d'où elle vient.

   RIEN N'EST APPLIQUÉ PAR CE FICHIER : il est assemblé dans js/gestes.js
   par `python outils/assembler-gestes.py`.

   ET LES TROIS ÉCRITURES RESTENT DANS « Développé militaire ». J'avais
   écrit ici qu'elles en « sortaient », et je les avais retirées : la mesure
   a montré que les trois ne ramenaient plus rien. Un geste reste une
   écriture — c'est ce que font les dix convertis le 31/10. */
(function (A) {
  'use strict';

  var AJOUTS = [
    {
      fiche: 'Développé militaire',
      nom: 'Développé nuque',
      /* LES ÉCRITURES QUI LE DÉSIGNENT, ET ELLES RESTENT AUSSI DANS LA
         FICHE. J'avais commencé par les en retirer « pour éviter un
         doublon » ; la mesure a dit que les trois ne ramenaient plus RIEN.

         Les dix gestes convertis le 31/10 montrent la règle : « Spider
         curl » est un geste ET une écriture de « Curl biceps ». C'est ce
         qui le garde cherchable, et il n'y a aucun doublon à l'écran —
         l'étage 2 lit `gestesDe`, jamais `aussi`. */
      aussi: ['Behind the neck press', 'Développé nuque à la barre guidée'],
      faire: 'Assis, buste droit, la barre passe derrière la tête au lieu de descendre devant.',
      change: 'Deltoïdes médial et postérieur plus sollicités ; la barre devant favorise le pectoral.',
      garde: 'L’étude ne mesure aucun risque. Elle rapporte d’un autre travail que les deux variantes conviennent à qui a une amplitude d’épaule normale.',
      source: 'Coratella et al., Frontiers in Physiology 2022 — 8 culturistes, EMG, 80 % du 1-RM'
    }
  ];

  A.revue = A.revue || {};
  A.revue.gesteDeveloppeNuque = AJOUTS;
})(window.App || (window.App = {}));
