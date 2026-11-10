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
      faire: 'Accroupi ou assis, coude calé contre le genou comme un curl '
           + 'concentration, bras à 90°. Une ceinture de judo passe SUR '
           + 'l’articulation du dessus des doigts, lestée à l’autre bout. '
           + 'On monte en tournant les phalanges vers le haut.',
      change: 'Ce n’est PAS la déviation radiale de la fiche : les sources '
            + 'décrivent un effort de biceps et de pronation, le coude '
            + 'fixé, et non une inclinaison du poignet vers le pouce. '
            + 'C’est le geste qui sert à rester au-dessus de l’adversaire.',
      garde: 'La source conseille d’ajouter environ 2 kg toutes les deux '
           + 'semaines, et pas davantage, pour limiter le risque. Aucune '
           + 'source primaire de Devon Larratt n’a été trouvée : la '
           + 'position vient de guides spécialisés, pas de lui.',
      source: 'Grip Gladiators (position et montée) ; Gegns Gym (sangle sur '
            + 'l’articulation du dessus) ; Golden Grip (ceinture de judo + '
            + 'pin de charge) ; Armwrestling World (« rising is bicep driven »)'
    },
    {
      fiche: 'Pronation',
      nom: 'Pronation lift à la ceinture',
      aussi: ['Pronation lift', 'Belt pronation lift',
              'Pronation à la ceinture de judo'],
      faire: 'Même position que le rising lift — accroupi ou assis, coude '
           + 'contre le genou, bras à 90° — mais la ceinture fait le tour '
           + 'de l’EXTÉRIEUR de la main, côté petit doigt. On tourne '
           + 'l’avant-bras contre la charge.',
      change: 'C’est le point d’application qui sépare les deux lifts, pas '
            + 'la position du corps : sur l’articulation du dessus, la '
            + 'charge demande de monter ; autour du petit doigt, elle '
            + 'demande de tourner.',
      garde: 'Même progression prudente que le rising lift. Et le couple '
           + 'est plus long qu’à la poulie : commencer bien plus léger que '
           + 'ce qu’on tire debout.',
      source: 'Gegns Gym (sangle autour de l’extérieur de la main, côté '
            + 'petit doigt) ; Grip Gladiators (position du coude au genou) ; '
            + 'Golden Grip (ceinture de judo + pin de charge)'
    }
  ];

  A.revue = A.revue || {};
  A.revue.liftsLarratt = AJOUTS;
})(window.App || (window.App = {}));
