/* LES TYPES D'ÉQUIPEMENT À TRANCHER — relevé du 2026-10-26/27.

   148 produits relevés sur TROIS sites : goldengrip.com (131),
   mithrilarmwrestling.com (51), titangrip.de (37). Classés en TYPES, parce
   que c'est sur un type que le carnet lit un mot, jamais sur une référence.

   `etat` dit où en est chacun :
     'pose'    — déjà dans OUTILS_CONNUS, livré. Ce que la page montre est
                 CALCULÉ par le modèle, pas recopié.
     'candidat'— à décider. `propose` dit ce que j'ajouterais, et d'où ça
                 viendrait. Rien n'est écrit dans le modèle.

   Les PHOTOS viennent des marchands, par leur adresse. La page a donc
   besoin d'Internet : rien n'est copié dans le dépôt, et une image qui
   disparaîtra chez eux disparaîtra ici — la page le dit au lieu de montrer
   un cadre vide. */
(function () {
  'use strict';

  var GG = 'https://www.goldengrip.com/products/';
  var MI = 'https://mithrilarmwrestling.com/products/';
  var TG = 'https://titangrip.de/produkt/';
  var CG = 'https://cdn.shopify.com/s/files/1/0571/6777/3834/';
  var CM = 'https://cdn.shopify.com/s/files/1/0728/7033/0622/files/';
  var CT = 'https://titangrip.de/wp-content/uploads/';

  function p(n, u, i) { return { n: n, u: u, i: i }; }

  var TYPES = [
    /* ================= LES NEUF DÉJÀ POSÉS ================= */
    { cle: 'fat grip', nom: 'Prise épaisse', etat: 'pose',
      quoi: 'Un manchon ou une barre de gros diamètre : la main ne se '
          + 'referme plus complètement.',
      produits: [
        p('Thick grips — Golden Grip', GG + 'thick-grips', CG + 'files/fatgripz_1.jpg?v=1699541703'),
        p('Axle Bar — Golden Grip', GG + 'axle-bar', CG + 'files/axle_thick_bar.jpg?v=1735551124'),
        p('Hand Grips — Titangrip', TG + 'hand-grips-hantelgriffe', CT + '2021/12/Armdruecken_Armwrestling_Hand_Grips_schwarz_Titangrip_Grip_Strength_0-300x300.jpg'),
        p('Round Handle 60mm — Mithril', MI + 'round-handle-60mm', CM + 'Shopify-Regular60mmHandle.png?v=1764170275')] },

    { cle: 'pronator', nom: 'Poignée de pronation', etat: 'pose',
      quoi: 'Une poignée faite pour tourner la paume vers le bas sous charge.',
      produits: [
        p('Popeye’s Pronator — Golden Grip', GG + 'popeyes-pronator', CG + 'files/popeye_spronator.jpg?v=1705581006'),
        p('Barbell Pronator — Golden Grip', GG + 'barbell-pronator', CG + 'files/barbellpronator_fdc8d189-80dd-4298-ad78-61b42086e4ab.jpg?v=1749736701'),
        p('Pronator Ellipsoid — Titangrip', TG + 'armwrestling-pronator-ellipsoid', CT + '2025/06/Armdruecken_Armwrestling_Pronator_Elliptisch_Titangrip_Grip_Strength_10-300x300.jpg'),
        p('AXE — Mithril', MI + 'pronation-rise-handle', CM + 'Shopify-Axe.png?v=1764170609')] },

    { cle: 'riser', nom: 'Riser', etat: 'pose',
      quoi: 'Le poignet penche vers le pouce sous charge — le « rising ».',
      produits: [
        p('Riser — Golden Grip', GG + 'the-riser', CG + 'files/riser.jpg?v=1687464406'),
        p('V-Bar Riser — Golden Grip', GG + 'v-bar-riser', CG + 'files/v-barriser_5.jpg?v=1772792691'),
        p('Rising Buddy Light — Titangrip', TG + 'rising-buddy-light', CT + '2023/07/Armdruecken_Armwrestling_Rising_Buddy_Light_Titangrip_Grip_Strength_1-300x300.jpg')] },

    { cle: 'cup', nom: 'Poignée de cup', etat: 'pose',
      quoi: 'Le poignet se ferme — le cupping.',
      produits: [
        p('OptiCup — Golden Grip', GG + 'opticup', CG + 'files/opticup_2.jpg?v=1772813276'),
        p('King’s Cup — Golden Grip', GG + 'kings-cup', CG + 'files/kingscup.jpg?v=1746055959'),
        p('Independent Handle for Cupping — Mithril', MI + 'independent-handle-for-cupping', CM + 'Independent_Handle_for_Cupping.png?v=1751293390'),
        p('Double Cupping Handle — Mithril', MI + 'double-cupping-handle', CM + 'Shopify_-_Double_Cupping_Handle.png?v=1745847878')] },

    { cle: 'toproll', nom: 'Poignée de toproll', etat: 'pose',
      quoi: 'Les poignées « anti-toproll » : on résiste à la rotation.',
      produits: [
        p('Anti-Toproll Handle — Golden Grip', GG + 'anti-toproll-handle', CG + 'files/antitoprollhandlegrip.jpg?v=1746055106'),
        p('Anti-Toproll V3 — Mithril', MI + 'anti-toproll-v3', CM + 'Shopify_-_ATR_V3.png?v=1751293221'),
        p('Toproll Buddy — Titangrip', TG + 'toproll-buddy', CT + '2023/11/Armdruecken_Armwrestling_Rising_Handle_Titangrip_Grip_Strength_0-300x300.jpg'),
        p('Toproll Counter — Titangrip', TG + 'toproll-counter', CT + '2026/06/Titangrip_Armwrestling_Armwrestling_Multi-Tool_Toproll_Counter_Grip_Strength_Griffkraft_Best_Training_Equipment_9.png-300x300.png')] },

    { cle: 'hook', nom: 'Poignée de hook', etat: 'pose',
      quoi: 'Le hook se tient en supination — tranché par toi au lot 3.',
      produits: [
        p('Heavy Hook — Mithril', MI + 'heavy-hook', CM + 'heavy-hook.png?v=1782825382'),
        p('Iron Wrist — Titangrip (« sowohl für Toproller als auch Hooker »)', TG + 'armwrestling-iron-wrist', CT + '2025/03/Armdruecken_Armwrestling_Iron_Wrist_Winding_Handle_Titangrip_Grip_Strength_0-300x300.webp')] },

    { cle: 'pinch', nom: 'Bloc de pince', etat: 'pose',
      quoi: 'On pince au lieu d’entourer : le pouce face aux doigts.',
      produits: [
        p('Pinch Grip Block — Golden Grip', GG + 'golden-grip-pinch-grip-block', CG + 'products/pinchgripblockaction.jpg?v=1678374067'),
        p('Plate Pinch — Golden Grip', GG + 'plate-pinch', CG + 'files/platepinch.jpg?v=1688566664'),
        p('Loadable blob — Golden Grip', GG + 'loadable-blob', CG + 'files/loadableblob.jpg?v=1700379327'),
        p('Saxon Bar — Golden Grip', GG + 'saxon-bar', CG + 'files/saxonbaractionphoto_538dad62-ce71-41f7-a255-e61e0a920cb9.jpg?v=1786623201')] },

    { cle: 'multispinner', nom: 'Multispinner', etat: 'pose',
      quoi: 'Il tourne dans les deux sens : pronation ET supination.',
      produits: [
        p('Multispinner — Golden Grip', GG + 'multispinner', CG + 'files/Multispinner1.jpg?v=1744463397'),
        p('Multispinner 65mm — Mithril', MI + 'multispinner-65mm', CM + 'Shopify_-_Multispinner_2025.png?v=1740205553'),
        p('Multi Spinner — Titangrip', TG + 'armwrestling-multi-spinner', CT + '2025/11/Titangrip_Armwrestling_Armwrestling_Multi_Tool_Best_Training_Grip_Strength_Griffkraft_Best_Training_Equipment_8-300x300.png')] },

    { cle: 'wrist roller', nom: 'Rouleau de poignet', etat: 'pose',
      quoi: 'Une corde s’enroule : le poignet fléchit ET s’étend.',
      produits: [
        p('Wrist roller — Golden Grip', GG + 'wrist-roller', CG + 'products/wristroller.jpg?v=1678374336'),
        p('Neutral Wrist Roller — Golden Grip', GG + 'golden-grip-neutral-wrist-roller', CG + 'files/neutralwristroller_1.jpg?v=1687463432'),
        p('Forearm Roller — Titangrip', TG + 'forearm-roller', CT + '2023/07/Armdruecken_Armwrestling_Forearm_Roller_Titangrip_Grip_Strength_1-300x300.jpg')] },

    /* ================= LES QUINZE À DÉCIDER ================= */
    { cle: 'rotation libre', nom: 'Poignée à rotation libre', etat: 'candidat',
      quoi: 'Elle tourne toute seule — roulement à billes ou axe lisse — et '
          + 'la main doit l’empêcher de s’échapper. Tes trois mots sont là : '
          + 'iron wrist, rolling handle.',
      propose: 'Pronation + Supination, PLUS les fléchisseurs des doigts. '
             + 'Base : la fiche Titangrip, « der Athlet muss viel '
             + 'Unterarmkraft aufwenden um zu verhindern, dass der Griff aus '
             + 'der Hand herausrotiert […] eine stabile Pronation oder '
             + 'Supination aufrecht erhalten ». Palier terrain, pas EMG.',
      produits: [
        p('Iron Wrist — Titangrip', TG + 'armwrestling-iron-wrist', CT + '2025/03/Armdruecken_Armwrestling_Iron_Wrist_Winding_Handle_Titangrip_Grip_Strength_0-300x300.webp'),
        p('Iron Wrist Conic — Titangrip', TG + 'iron-wrist-conic', CT + '2025/06/Armdruecken_Armwrestling_Iron_Wrist_Winding_Handle_Kegel_Conic_Titangrip_Grip_Strength_11-300x300.jpg'),
        p('Rolling Handle — Titangrip', TG + 'rolling-handle', CT + '2023/11/Armdruecken_Armwrestling_Rolling_Handle_Rolling_Thunder_Titangrip_Grip_Strength_0-300x300.jpeg'),
        p('Double Rolling Row Handle — Golden Grip', GG + 'double-rolling-row-handle', CG + 'files/doublerollingrowhandle.jpg?v=1772792148')] },

    { cle: 'wrench', nom: 'Clé de poignet (wrist wrench)', etat: 'candidat',
      quoi: 'Un levier au bout du poignet : le bras de levier fait tout le '
          + 'travail, et il est long.',
      propose: 'Les muscles de « Wrist curl » et « Wrist curl inversé » — le '
             + 'poignet fléchit et s’étend contre le levier. RAISONNÉ : '
             + 'aucune mesure trouvée sur cet outil.',
      produits: [
        p('Wrist Wrench — Golden Grip', GG + 'the-wrist-wrench', CG + 'files/wrist_wrench_action_photo.jpg?v=1772823190'),
        p('Angular Wrist Wrench — Golden Grip', GG + 'angular-wrist-wrench', CG + 'files/angularwristwrench.jpg?v=1749738842'),
        p('OptiWrench — Golden Grip', GG + 'optiwrench', CG + 'files/optiwrench_action_photo.jpg?v=1772815086'),
        p('Wrist Wrench — Titangrip', TG + 'wrist-wrench', CT + '2025/06/Armdruecken_Armwrestling_Wrist_Wrench_Titangrip_Grip_Strength_10-300x300.png')] },

    { cle: 'gripper', nom: 'Gripper (pince à ressort)', etat: 'candidat',
      quoi: 'La pince à main qu’on écrase.',
      propose: 'RIEN À AJOUTER, et c’est pour ça que je te le soumets : le '
             + 'carnet a DÉJÀ une entrée « Gripper » comme MOUVEMENT, avec '
             + 'ses six muscles. En faire aussi un outil ferait deux chemins '
             + 'pour la même chose — exactement ce que ce carnet évite.',
      produits: [
        p('Hand Gripper Lvl 1-6 — Golden Grip', GG + 'golden-grip-hand-gripper', CG + 'files/handgripperheavy.jpg?v=1699611913'),
        p('Mega Gripper LVL1-3 — Golden Grip', GG + 'mega-gripper-lvl1-3', CG + 'files/Mega_Gripper_jpg.jpg?v=1787146193'),
        p('Mini Grippers set — Golden Grip', GG + 'mini-grippers', CG + 'files/minihandgrippers.jpg?v=1786548154')] },

    { cle: 'sangle', nom: 'Sangle (strap)', etat: 'candidat',
      quoi: 'La sangle remplace la prise : la main ne serre plus.',
      propose: 'RIEN, et c’est mesuré dans trois directions contradictoires : '
             + '−16 % à l’avant-bras sur l’arraché, aucun effet sur le '
             + 'soulevé de terre, et une étude sur le tirage qui contredit '
             + 'l’hypothèse de fatigue. Je ne peux pas en faire une règle. '
             + 'Tu en as pourtant plusieurs au dictionnaire.',
      produits: [
        p('Arm wrestling strap — Golden Grip', GG + 'arm-wrestling-strap', CG + 'files/armwrestlingstrap_1.jpg?v=1698418815'),
        p('Bullet Strap — Golden Grip', GG + 'bullet-strap', CG + 'files/bullet_strap.jpg?v=1749737594'),
        p('Flat Strap — Mithril', MI + 'flat-strap', CM + 'Shopify_-_Flat_Strap.png?v=1754839767'),
        p('Trainingsgurt — Titangrip', TG + 'armwrestling-trainingsgurt', CT + '2025/06/Armdruecken_Armwrestling_Trainingsgurt_Training_Belt_Titangrip_Grip_Strength_Griffkraft_10-300x300.jpg')] },

    { cle: 'pouce', nom: 'Travail du pouce', etat: 'candidat',
      quoi: 'Sangle ou outil qui charge le pouce seul.',
      propose: 'Les cinq muscles du pouce que la prise FERMÉE propose déjà. '
             + 'RAISONNÉ : c’est la définition du geste, pas une mesure.',
      produits: [
        p('Thumb Pump — Golden Grip', GG + 'thumb-pump', CG + 'files/thumbpump_1.jpg?v=1778761311'),
        p('Thumb War — Golden Grip', GG + 'thumb-war', CG + 'products/thumbwar.jpg?v=1678375256'),
        p('Thumb Belt — Titangrip', TG + 'thumb-belt', CT + '2026/06/Titangrip_Armwrestling_Armwrestling_Thumb_Belt_Grip_Strength_Griffkraft_Best_Training_Equipment_0.png-300x300.png')] },

    { cle: 'doigts', nom: 'Travail des doigts', etat: 'candidat',
      quoi: 'Élastiques d’ouverture, sangle de doigts.',
      propose: 'RIEN À AJOUTER : le carnet a déjà « Extenseurs à élastique » '
             + 'et « Finger curl » comme mouvements. Même doublon que le '
             + 'gripper.',
      produits: [
        p('Finger Extension Elastics — Golden Grip', GG + 'finger-extension-elastics', CG + 'files/vingertrainingelastiekjes.jpg?v=1763033637'),
        p('Finger Gurt — Titangrip', TG + 'finger-gurt', CT + '2024/08/Armdruecken_Armwrestling_Finger_Gurt_Finger_Belt_Training_Belt_Titangrip_Griffkraft_Grip_Strength_0-300x300.jpg')] },

    { cle: 'cone', nom: 'Poignée conique', etat: 'candidat',
      quoi: 'Le diamètre change sur la longueur : la main glisse vers le '
          + 'gros bout si elle ne tient pas.',
      propose: 'Les fléchisseurs des doigts, comme la prise épaisse — mais '
             + 'SANS les muscles du poignet, que l’étude de Krings mesure '
             + 'pour le manchon et pas pour le cône. RAISONNÉ.',
      produits: [
        p('Cone handle — Golden Grip', GG + 'cone-handle', CG + 'files/conegrip.jpg?v=1746054901'),
        p('Conic Handle 35-60mm — Mithril', MI + 'conic-handle-35-60mm', CM + 'Shopify_-_Conic_Handle_35-60mm.png?v=1751293087'),
        p('Eccentric Cone — Mithril', MI + 'eccentric-cone', CM + 'Shopify_-_Eccentric_Cone_1.png?v=1743253264'),
        p('Kegel Tool — Titangrip', TG + 'kegel-tool', CT + '2025/06/Armdruecken_Armwrestling_Kegel_Tool_Titangrip_Grip_Strength_0-300x300.jpg')] },

    { cle: 'excentre', nom: 'Poignée excentrée', etat: 'candidat',
      quoi: 'L’axe de charge n’est pas au centre de la main : le poignet '
          + 'doit résister à une torsion permanente.',
      propose: 'Pronation + Supination, comme la rotation libre. RAISONNÉ, '
             + 'et peut-être le même type que la rotation libre — à toi de '
             + 'dire si tu les sépares.',
      produits: [
        p('Eccentric Grip Handle — Golden Grip', GG + 'eccentric-grip-handle', CG + 'files/eccentricgriphandle_4.jpg?v=1746056107'),
        p('Eccentric Handle — Mithril', MI + 'eccentric-handle', CM + 'Shopify-EccentricHandle.png?v=1737888383'),
        p('Old School Eccentric Handle — Mithril', MI + 'old-school-eccentric-handle', CM + 'Shopify_-_OldSchool_Eccentric_Handle.png?v=1744448518')] },

    { cle: 'independante', nom: 'Poignée indépendante', etat: 'candidat',
      quoi: 'Chaque main a sa poignée, libre de l’autre.',
      propose: 'RIEN : c’est une contrainte de montage, pas un geste. Elle '
             + 'ne change pas les muscles, elle change l’exercice qu’on peut '
             + 'faire avec.',
      produits: [
        p('Independent Handle — Mithril', MI + 'independent-handle', CM + 'IMG-9497.png?v=1782964460'),
        p('Independent Cone — Mithril', MI + 'independent-cone-l-bar', CM + 'independent-cone-deathwatch-l-bar.jpg?v=1780231503')] },

    { cle: 'ressort', nom: 'Poignée à ressort', etat: 'candidat',
      quoi: 'Un ressort absorbe : la charge monte et descend dans le geste.',
      propose: 'RIEN de mesuré. C’est un RÉGIME (élastique) plus qu’un '
             + 'muscle — et le carnet a déjà un champ « Type de charge » qui '
             + 'dit « Élastique ».',
      produits: [
        p('Spring Loaded Handle — Mithril', MI + 'spring-loaded-handle', CM + 'Shopify_-_Spring_Loaded_Handle.png?v=1754839483'),
        p('Spring Loaded Handle 2 — Mithril', MI + 'spring-loaded-handle-2', CM + 'spring-loaded-handle-2.jpg?v=1780220572')] },

    { cle: 'glissant', nom: 'Poignée glissante / serviette', etat: 'candidat',
      quoi: 'La prise glisse exprès : la main doit serrer plus fort.',
      propose: 'Les fléchisseurs des doigts. RAISONNÉ — c’est la définition '
             + 'du geste, aucune mesure trouvée.',
      produits: [
        p('Soft & Slippery Handle — Mithril', MI + 'independent-handle-70mm', CM + 'Soft_Handle.png?v=1754574527'),
        p('Towel — Mithril', MI + 'towel', CM + 'towel-handle.jpg?v=1783188883')] },

    { cle: 'barre', nom: 'Barre en L, U ou T', etat: 'candidat',
      quoi: 'La forme de la barre impose l’angle du poignet.',
      propose: 'RIEN : c’est un support. L’angle qu’elle impose se note déjà '
             + 'par le GESTE qu’on y fait.',
      produits: [
        p('Universal L-Bar 230mm — Mithril', MI + 'universal-l-bar-230mm', CM + 'Universal_L-Bar_230mm.png?v=1753975656'),
        p('U-Bar — Mithril', MI + 'u-bar', CM + 'U-Bar.png?v=1752764366'),
        p('T-Handle — Titangrip', TG + 'armwrestling-t-handle', CT + '2023/07/Armdruecken_Armwrestling_Multi_Handle_gelb_yellow_Titangrip_Grip_Strength_0-300x300.jpg')] },

    { cle: 'levier', nom: 'Levier / masse', etat: 'candidat',
      quoi: 'Une masse au bout d’un manche : le bras de levier charge le '
          + 'poignet en rotation ou en déviation.',
      propose: 'Pronation + Supination + déviation radiale, selon le sens '
             + 'du geste — et le carnet ne sait pas lire le sens dans le nom '
             + 'd’un outil. RAISONNÉ, et probablement trop vague pour entrer.',
      produits: [
        p('Sledgehammer 4,5 kg — Golden Grip', GG + 'sledgehammer-4-5kg-10lbs', CG + 'files/sledgehammer.jpg?v=1763212364'),
        p('Forearm Lever — Golden Grip', GG + 'forearm-lever', CG + 'files/forearmlever.jpg?v=1749734341'),
        p('Wrist Dumbbell — Titangrip', TG + 'wrist-dumbbell', CT + '2023/07/Armdruecken_Armwrestling_Wrist_Dumbbell_Square_Handgelenk_Kurzhantel_Eckig_Titangrip_Grip_Strength_1-300x300.jpg')] },

    { cle: 'farmer', nom: 'Poignées de farmer walk', etat: 'candidat',
      quoi: 'On tient lourd et on marche.',
      propose: 'RIEN À AJOUTER : « Farmer walk » est déjà une écriture de '
             + '« Dead hang » au dictionnaire. Même doublon que le gripper.',
      produits: [
        p('Farmer Walk Handles — Golden Grip', GG + 'farmer-walk-handles', CG + 'files/farmerwalkhandles_1.jpg?v=1772812536'),
        p('Farmer Walks — Golden Grip', GG + 'farmer-walks', CG + 'files/farmer_walks.jpg?v=1751405186')] },

    { cle: 'station', nom: 'Station / machine', etat: 'candidat',
      quoi: 'Les bâtis : Forearm Maxxer, Multi-Tool, Pullheavy, Bruce Lee '
          + 'Grip Machine… Seize produits sur les trois sites.',
      propose: 'RIEN : un bâti porte la charge, il ne fait pas le geste. '
             + 'C’est le geste qu’on y fait qui compte, et il a déjà son nom.',
      produits: [
        p('Forearm Maxxer — Titangrip', TG + 'forearm-maxxer', CT + '2026/04/Titangrip_Armwrestling_Armwrestling_Pronation_Station_Grip_Strength_Griffkraft_Best_Training_Equipment_0-300x300.png'),
        p('Multi-Tool Pro — Titangrip', TG + 'armwrestling-multi-tool-pro', CT + '2024/05/Armdruecken_Armwrestling_Multi-Tool_mit_6_verschiedenen_Aufsaetzen_Titangrip_Grip_Strength_9-300x300.jpg'),
        p('Forearm Finisher — Golden Grip', GG + 'forearm-finisher', CG + 'files/forearmfinisher.jpg')] },

    { cle: 'bicep blaster', nom: 'Bicep blaster', etat: 'candidat',
      quoi: 'Une plaque qui cale les coudes pendant un curl.',
      propose: 'RIEN de neuf : elle fige l’épaule, ce qui est exactement ce '
             + 'que fait le PUPITRE. Le carnet a « Preacher curl », et la '
             + 'mesure dit que la position de l’épaule ne change pas les '
             + 'muscles, seulement l’étirement.',
      produits: [
        p('Bicep Blaster — Golden Grip', GG + 'bicep-blaster', CG + 'files/BicepBlaster1.jpg?v=1744314037')] }
  ];

  window.CHOIX_OUTILS = { TYPES: TYPES };
}());
