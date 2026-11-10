/* LES DEUX LIFTS A LA CEINTURE — demandes par MB le 2026-11-10.

   MB : « j'aimerai aussi rajouter deux mouvements, le rising lift et
   pronation lift, c'est un geste utilise par Devon Larrat, il s'accroupit,
   puis avec une ceinture de judo, coude contre le genou, bras a 90°,
   souleve une charge lourde, cherche sur internet avant tout rajout pour
   me confirmer que tu vois ce que c'est. »

   CHERCHE AVANT D'ECRIRE, comme demande. Ce que les sources disent :

     Grip Gladiators decrit exactement la position de MB — « rest your
       elbow on your leg like a concentration curl, wrap a martial arts
       belt around your hand, attach weight to the end », et definit la
       montee comme « using bicep and pronation strength to lift the
       opponent's hand by turning the knuckles upward ». Il conseille
       d'ajouter ~5 lb toutes les deux semaines.
     Gegns Gym donne CE QUI SEPARE LES DEUX, et c'est le seul endroit ou
       je l'ai trouve : la sangle passe « over the top knuckle » pour le
       riser, et « around the outside of the hand (pinky side) » pour la
       pronation. C'est le point d'application qui change, pas la
       position du corps.
     Golden Grip nomme l'outil — « Judo Belt + Loading Pin » — et dit a
       quoi ca sert : « trains finger rise used by Devon Larratt to stay
       above opponents ».
     Armwrestling World : « Devon Larratt regards rising strength as the
       most crucial technique involved in arm wrestling. Rising is bicep
       driven. »

   CE QUE LES SOURCES NE DISENT PAS, et il faut le dire : aucune ne
   decrit l'accroupissement, ni le nom « rising lift » dans la bouche de
   Larratt lui-meme. Un fil GripBoard rapporte des pratiquants qui font
   « les pronation et riser lifts de Devon, avec une ceinture de judo et
   du poids », mais c'est un temoignage de forum, pas une source primaire.
   Faute de video ou d'interview de Larratt, le `source` de chaque geste
   nomme ce qu'il tient, et rien de plus.

   ET LA NUANCE QUI COMPTE POUR LE CARNET. La fiche « Rising » du
   dictionnaire est une DEVIATION RADIALE — le poignet s'incline vers le
   pouce — et ses muscles sont `fcr`, `ecrl`, `ecrb`. Le lift de Larratt,
   lui, est decrit par ses sources comme BICEPS + PRONATION. Ce n'est
   donc pas le meme mouvement, et c'est ecrit dans son `change` : un
   geste qui ne dit pas en quoi il differe de sa fiche n'apprend rien.

   MB a tranche le 10/11 : « tu peux les rajouter comme gestes je pense ».
   Ils vivent donc a l'etage 2 de leur fiche, et restent cherchables par
   leurs ecritures. */
(function (A) {
  'use strict';

  var AJOUTS = [
    {
      fiche: 'Rising',
      nom: 'Rising lift à la ceinture',
      /* LES ECRITURES, pour qu'il se tape comme il se dit en salle.
         « Riser lift » est la forme qu'emploient les deux sources
         anglaises ; MB dit « rising lift ». Les deux mènent ici. */
      aussi: ['Riser lift', 'Rising lift', 'Belt riser lift',
              'Rising à la ceinture de judo'],
      /* COURT, ET LA NUANCE DEDANS. Premiere ecriture : 862 caracteres,
         le plus long des 40 gestes, contre 375 de moyenne — c'est cet
         ecran que MB a vu en disant « trop d'info ».

         LA NUANCE RESTE, parce qu'elle est le seul moyen de ne pas
         confondre deux mouvements : la fiche « Rising » est une
         deviation radiale du poignet, ce lift-ci est biceps + pronation.
         Elle tenait dans « Ce que ca change », qui ne s'affiche plus. */
      faire: 'Coude calé contre le genou, bras à 90°, une ceinture lestée '
           + 'passant SUR le dessus des doigts. On monte en tournant les '
           + 'phalanges vers le haut — biceps et pronation, pas la '
           + 'déviation radiale de la fiche.',
      change: 'Ce n’est PAS la déviation radiale de la fiche : les sources '
            + 'décrivent un effort de biceps et de pronation, le coude '
            + 'fixé, et non une inclinaison du poignet vers le pouce. '
            + 'C’est le geste qui sert à rester au-dessus de l’adversaire.',
      garde: 'Ajouter environ 2 kg toutes les deux semaines, pas plus. '
           + 'Aucune source primaire de Devon Larratt : la position vient '
           + 'de guides spécialisés.',
      source: 'Grip Gladiators (position et montée) ; Gegns Gym (sangle sur '
            + 'l’articulation du dessus) ; Golden Grip (ceinture de judo + '
            + 'pin de charge) ; Armwrestling World (« rising is bicep driven »)'
    },
    {
      fiche: 'Pronation',
      nom: 'Pronation lift à la ceinture',
      aussi: ['Pronation lift', 'Belt pronation lift',
              'Pronation à la ceinture de judo'],
      /* MEME REGLE QUE LE RISING LIFT : court, et ce qui les separe
         dedans — c'est l'endroit ou passe la sangle, pas la position. */
      faire: 'Même position que le rising lift, mais la ceinture fait le '
           + 'tour de l’EXTÉRIEUR de la main, côté petit doigt. On tourne '
           + 'l’avant-bras contre la charge.',
      change: 'C’est le point d’application qui sépare les deux lifts, pas '
            + 'la position du corps : sur l’articulation du dessus, la '
            + 'charge demande de monter ; autour du petit doigt, elle '
            + 'demande de tourner.',
      garde: 'Même progression que le rising lift, et plus léger encore : '
           + 'le bras de levier est plus long qu’à la poulie.',
      source: 'Gegns Gym (sangle autour de l’extérieur de la main, côté '
            + 'petit doigt) ; Grip Gladiators (position du coude au genou) ; '
            + 'Golden Grip (ceinture de judo + pin de charge)'
    }
  ];

  A.revue = A.revue || {};
  A.revue.liftsLarratt = AJOUTS;
})(window.App || (window.App = {}));
