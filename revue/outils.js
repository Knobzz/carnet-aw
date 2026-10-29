/* LA REVUE DE L'ÉQUIPEMENT — sources, provenance des noms, compatibilité.

   Ce fichier NE PART PAS sur le téléphone. Il tient, pour chaque type
   d'équipement que le modèle reconnaît, ce que la planche doit pouvoir
   montrer à MB : d'où vient le nom, d'où viennent les muscles, et à quoi
   l'outil se monte.

   LE CRITÈRE DU NOM, et il est mesurable : un nom n'entre que s'il apparaît
   sur AU MOINS DEUX sites indépendants. C'est ce qui sépare un TYPE de
   matériel d'une référence de marque — et ce qui tient la règle n° 6, qui
   interdit d'imposer une liste. Les deux sites relevés le 2026-10-26 :
   goldengrip.com et mithrilarmwrestling.com.

   LA COMPATIBILITÉ est une demande de MB du même jour : « il y a beaucoup
   d'équipement qui ne peuvent s'ajouter qu'à la poulie, les fat grips par
   exemple peuvent s'ajouter sur de la barre, des dumbbells et autres
   poignées, mais pas sur tout ». Elle est ÉCRITE ici, pas encore appliquée
   par le modèle : le carnet ne refuse rien à personne, et ce qu'on en fera
   se décide avec MB. */
(function () {
  'use strict';

  var S = {
    krings2021: {
      qui: 'Krings, Shepherd, Swain, Turner, Chander, Waldman, McAllister, '
         + 'Knight & Smith — « Impact of Fat Grip Attachments on Muscular '
         + 'Strength and Neuromuscular Activation During Resistance '
         + 'Exercise », J Strength Cond Res 2021, EMG sur 15 hommes '
         + 'entraînés, huit muscles, cinq exercices',
      lien: 'https://pubmed.ncbi.nlm.nih.gov/30694963/'
    },
    geste: {
      qui: 'Le GESTE que la poignée entraîne — les muscles sont ceux de '
         + 'l’entrée du dictionnaire, déjà sourcée, et rien n’est ajouté',
      lien: null
    },
    muet: {
      qui: 'LE FABRICANT NE DIT RIEN — page produit lue, aucun texte : un '
         + 'prix, un numéro d’article, un stock. Le trou est à la source, '
         + 'pas dans ce carnet',
      lien: null
    },
    cadre: {
      qui: 'LE CADRE NE TRAVAILLE RIEN — c’est l’accessoire monté dessus '
         + 'qui décide, et ses réglages le portent',
      lien: null
    },
    riennedit: {
      qui: 'TROIS études qui ne vont pas dans le même sens — c’est la '
         + 'source, et elle dit de ne RIEN conclure',
      lien: null
    }
  };

  var C = {
    fatgrip: 'Electromyography muscle activity was significantly increased '
           + 'in the forearm and shoulder muscles, but significantly '
           + 'decreased in the upper arm muscles with the use of FG during '
           + 'deadlift, bent-over row, and pull-ups',
    fatgrip_curl: 'However, there were no differences for EMG activity for '
                + 'upright row and concentration curl'
  };

  /* Un enregistrement par TYPE, repéré par son premier mot — le même que
     dans `OUTILS_CONNUS` du modèle, et la planche vérifie que les deux
     listes se correspondent exactement. */
  var OUTILS = [
    {
      cle: 'fat grip',
      nom: 'Prise épaisse',
      liens: [{ texte: 'Golden Grip — Thick grips', url: 'https://www.goldengrip.com/products/thick-grips' },
              { texte: 'Golden Grip — Axle Bar', url: 'https://www.goldengrip.com/products/axle-bar' },
              { texte: 'Titangrip — Hand Grips (Hantelgriffe)', url: 'https://titangrip.de/produkt/hand-grips-hantelgriffe' },
              { texte: 'Mithril — catégorie Thick Grip Handles', url: 'https://mithrilarmwrestling.com/collections/thick-grip-handles' }],
      source: S.krings2021,
      cite: C.fatgrip,
      note: 'LE SEUL ÉQUIPEMENT MESURÉ DIRECTEMENT. Les quatre muscles du '
          + 'poignet mesurés par l’étude sont ceux que le modèle ajoute ; '
          + 'le cinquième, le court extenseur radial, est une INFÉRENCE : '
          + 'l’étude pose UNE électrode sur « extensor carpi radialis » et '
          + 'le carnet en a deux. — CE QUE L’ÉTUDE DIT AUSSI : les muscles '
          + 'du BRAS baissent. Le carnet ne modélise pas l’intensité, donc '
          + 'le biceps reste présent — mais c’est le contraire de ce qu’on '
          + 'croit en achetant des manchons. — ET LA PORTÉE EST ÉTROITE : '
          + '« no differences […] for concentration curl ». Sur un curl, le '
          + 'manchon ne change rien de mesurable, et le modèle proposera '
          + 'quand même. Le carnet propose, il n’impose pas — mais c’est à '
          + 'trancher avec MB.'
    },
    {
      cle: 'pronator',
      nom: 'Poignée de pronation',
      liens: [{ texte: 'Golden Grip — Popeye’s Pronator', url: 'https://www.goldengrip.com/products/popeyes-pronator' },
              { texte: 'Golden Grip — Barbell Pronator', url: 'https://www.goldengrip.com/products/barbell-pronator' },
              { texte: 'Titangrip — Pronator Zylinder', url: 'https://titangrip.de/produkt/armwrestling-pronator-zylinder' },
              { texte: 'Titangrip — Pronator Ellipsoid', url: 'https://titangrip.de/produkt/armwrestling-pronator-ellipsoid' },
              { texte: 'Mithril — AXE, poignée de pronation/rising', url: 'https://mithrilarmwrestling.com/products/pronation-rise-handle' }],
      source: S.geste,
      cite: null,
      note: 'Les muscles sont ceux de l’entrée « Pronation », déjà sourcée. '
          + 'Aucune anatomie neuve n’est affirmée ici.'
    },
    {
      cle: 'riser',
      nom: 'Riser',
      liens: [{ texte: 'Golden Grip — Riser', url: 'https://www.goldengrip.com/products/the-riser' },
              { texte: 'Golden Grip — V-Bar Riser', url: 'https://www.goldengrip.com/products/v-bar-riser' },
              { texte: 'Titangrip — Rising Buddy Light', url: 'https://titangrip.de/produkt/rising-buddy-light' },
              { texte: 'Mithril — AXE, poignée de pronation/rising', url: 'https://mithrilarmwrestling.com/products/pronation-rise-handle' }],
      source: S.geste,
      cite: null,
      note: 'LE MOT ÉTAIT MORT DEPUIS CE MATIN : l’entrée « Riser lift » a '
          + 'été supprimée à la demande de MB, et ses mots-clés avec. Il '
          + 'revient ici comme ÉQUIPEMENT, ce qu’il est chez les deux '
          + 'fabricants — pas comme exercice. Les muscles sont ceux de '
          + 'l’entrée « Rising ».'
    },
    {
      cle: 'cup',
      nom: 'Poignée de cup',
      liens: [{ texte: 'Golden Grip — OptiCup', url: 'https://www.goldengrip.com/products/opticup' },
              { texte: 'Mithril — Independent Handle for Cupping', url: 'https://mithrilarmwrestling.com/products/independent-handle-for-cupping' },
              { texte: 'Mithril — catégorie Cupping and Wrist Flexion', url: 'https://mithrilarmwrestling.com/collections/cupping-and-wrist-flexion' }],
      source: S.geste,
      cite: null,
      note: 'Les muscles sont ceux de « Cup hold ».'
    },
    {
      cle: 'toproll',
      nom: 'Poignée de toproll',
      liens: [{ texte: 'Golden Grip — Anti-Toproll Handle', url: 'https://www.goldengrip.com/products/anti-toproll-handle' },
              { texte: 'Mithril — Anti-Toproll V3', url: 'https://mithrilarmwrestling.com/products/anti-toproll-v3' },
              { texte: 'Titangrip — Toproll Buddy', url: 'https://titangrip.de/produkt/toproll-buddy' },
              { texte: 'Titangrip — Toproll Counter', url: 'https://titangrip.de/produkt/toproll-counter' }],
      source: S.geste,
      cite: null,
      note: 'Les muscles sont ceux de « Toproll à la poulie ». — À '
          + 'TRANCHER AVEC MB : une poignée ANTI-toproll sert à résister '
          + 'au toproll de l’adversaire. Est-ce le même travail ? Le '
          + 'modèle les traite aujourd’hui comme un seul mot.'
    },
    {
      cle: 'hook',
      nom: 'Poignée de hook',
      liens: [{ texte: 'Mithril — catégorie Hook Training', url: 'https://mithrilarmwrestling.com/collections/hook-training' },
              { texte: 'Titangrip — Iron Wrist, « sowohl für Toproller als auch Hooker »', url: 'https://titangrip.de/produkt/armwrestling-iron-wrist' }],
      source: S.geste,
      cite: null,
      note: 'Les muscles sont ceux de « Hook à la poulie », tranchée par MB '
          + 'en supination au lot 3.'
    },
    {
      cle: 'pinch',
      nom: 'Bloc de pince',
      liens: [{ texte: 'Golden Grip — Pinch Grip Block', url: 'https://www.goldengrip.com/products/golden-grip-pinch-grip-block' },
              { texte: 'Golden Grip — Plate Pinch', url: 'https://www.goldengrip.com/products/plate-pinch' },
              { texte: 'Mithril — catégorie Finger Strength', url: 'https://mithrilarmwrestling.com/collections/finger-strength' }],
      source: S.geste,
      cite: null,
      note: 'Les muscles sont ceux de « Pince ». — LE « FINGER GURT » A '
          + 'QUITTÉ CETTE LISTE le 27/10, et c’est le quatrième contrôle '
          + 'qui l’a dit : il y était cité comme produit, et le carnet ne '
          + 'savait pas le lire. En regardant, ce n’est pas un bloc de '
          + 'pince — c’est une sangle de doigts. Il est passé aux écartés '
          + 'avec sa raison, plutôt qu’inventer un mot pour faire taire un '
          + 'rouge.'
    },
    {
      cle: 'multispinner',
      nom: 'Multispinner',
      liens: [{ texte: 'Golden Grip — Multispinner', url: 'https://www.goldengrip.com/products/multispinner-1' },
              { texte: 'Mithril — Multispinner 65mm', url: 'https://mithrilarmwrestling.com/products/multispinner-65mm' },
              { texte: 'Titangrip — Multi Spinner', url: 'https://titangrip.de/produkt/armwrestling-multi-spinner' },
              { texte: 'Titangrip — Multi Spinner Light', url: 'https://titangrip.de/produkt/armwrestling-multi-spinner-light' }],
      source: S.geste,
      cite: null,
      note: 'IL TOURNE DANS LES DEUX SENS, donc les deux rotations : les '
          + 'muscles de « Pronation » ET de « Supination ». Il a été le '
          + 'PREMIER type à citer deux entrées ; depuis le 27/10 ils sont '
          + 'cinq — la rotation libre, l’excentré, la clé de poignet et le '
          + 'rouleau font de même. MB l’a nommé '
          + 'de lui-même avant que je le trouve.'
    },
    {
      cle: 'wrist roller',
      nom: 'Rouleau de poignet',
      liens: [{ texte: 'Golden Grip — Wrist roller', url: 'https://www.goldengrip.com/products/wrist-roller' },
              { texte: 'Golden Grip — Neutral Wrist Roller', url: 'https://www.goldengrip.com/products/golden-grip-neutral-wrist-roller' },
              { texte: 'Titangrip — Forearm Roller', url: 'https://titangrip.de/produkt/forearm-roller' },
              { texte: 'Mithril — catégorie Independent Roller Handles', url: 'https://mithrilarmwrestling.com/collections/independent-roller-handles' }],
      source: S.geste,
      cite: null,
      note: 'LA CORDE S’ENROULE DANS LES DEUX SENS : le poignet fléchit ET '
          + 's’étend, donc « Wrist curl » et « Wrist curl inversé ». — '
          + '« roller » TOUT SEUL est écarté : une « rolling row handle » '
          + 'est une poignée de tirage, pas un rouleau de poignet. Le mot '
          + 'exigé est donc « wrist roller ».'
    },
    {
      cle: 'iron wrist',
      nom: 'Poignée à rotation libre',
      liens: [{ texte: 'Titangrip — Iron Wrist', url: 'https://titangrip.de/produkt/armwrestling-iron-wrist' },
              { texte: 'Titangrip — Iron Wrist Conic', url: 'https://titangrip.de/produkt/iron-wrist-conic' },
              { texte: 'Titangrip — Rolling Handle', url: 'https://titangrip.de/produkt/rolling-handle' },
              { texte: 'Golden Grip — Double Rolling Row Handle', url: 'https://www.goldengrip.com/products/double-rolling-row-handle' }],
      source: S.geste,
      cite: null,
      note: 'MB L’A NOMMÉE AVANT QUE JE LA TROUVE : « multi-spinner, iron '
          + 'wrist, rolling handle ». Base, et elle vient du fabricant : '
          + '« der Athlet muss viel Unterarmkraft aufwenden um zu '
          + 'verhindern, dass der Griff aus der Hand herausrotiert […] eine '
          + 'stabile Pronation oder Supination aufrecht erhalten » — d’où '
          + 'la rotation DANS LES DEUX SENS, plus les fléchisseurs des '
          + 'doigts. PALIER TERRAIN, pas EMG : c’est une fiche produit, pas '
          + 'une étude. — L’iron wrist était ÉCARTÉ hier faute de passer le '
          + 'critère des deux sites ; il entre parce que MB le possède et '
          + 'que le fabricant dit ce qu’il travaille. — ET ELLE PORTE SES '
          + 'POSITIONS depuis le 27/10, parce que MB a dit « regarde les '
          + 'photos, tu as oublié des équipements ». Il avait raison : la '
          + 'photo du fabricant montre une platine inox à TROIS TROUS en '
          + 'colonne, les deux sangles rivetées en haut et en bas, le '
          + 'mousqueton dans l’un des trois — et Titangrip écrit « durch '
          + 'die verschiedenen Einstellungsmöglichkeiten lässt sich die '
          + 'Belastung so verändern ». Les noms disent ce qu’on VOIT — '
          + '« en haut / au milieu / en bas », les trous étant empilés et '
          + 'non latéraux comme sur la clé. SANS MUSCLES, et pas pour la '
          + 'raison de la clé : ici les cinq muscles de bord MANQUENT '
          + 'vraiment, mais aucune source ne dit quel trou charge quel '
          + 'bord. Les poser serait les deviner.'
    },
    {
      cle: 'wrist wrench',
      nom: 'Clé de poignet',
      liens: [{ texte: 'Golden Grip — Wrist Wrench', url: 'https://www.goldengrip.com/products/the-wrist-wrench' },
              { texte: 'Golden Grip — Angular Wrist Wrench', url: 'https://www.goldengrip.com/products/angular-wrist-wrench' },
              { texte: 'Golden Grip — OptiWrench', url: 'https://www.goldengrip.com/products/optiwrench' },
              { texte: 'Titangrip — Wrist Wrench', url: 'https://titangrip.de/produkt/wrist-wrench' },
              { texte: 'ARMSPORT — Premium Wrist Wrench', url: 'https://wristball.net/product/armsport-wrist-wrench/' }],
      source: S.geste,
      cite: null,
      note: 'LE LEVIER TRAVAILLE DANS LES DEUX SENS : le poignet fléchit et '
          + 's’étend contre lui, d’où « Wrist curl » ET « Wrist curl '
          + 'inversé ». — LE MOUSQUETON, ET C’EST MB QUI LE SOULÈVE le '
          + '27/10 : « on peut le mettre au centre, à l’extérieur ou à '
          + 'l’intérieur, ce qui va influencer sur les muscles '
          + 'sollicités ». Il a raison, et le carnet sait déjà le dire — '
          + 'c’est un RÉGLAGE, et le modèle le définit avec cet exemple '
          + 'exact depuis longtemps : « le mousqueton posé à l’EXTÉRIEUR '
          + 'fait porter la pression sur le bord externe de la main ; à '
          + 'l’intérieur, c’est l’autre bord ». Le TYPE porte donc ce que '
          + 'la clé fait dans tous les cas ; le bord choisi se note au '
          + 'réglage. — TRANCHÉ LE 27/10, par MB : « propose les trois '
          + 'positions de mousqueton en réglages ». La fiche de l’outil les '
          + 'OFFRE donc, et un appui ouvre la fiche du réglage avec le nom '
          + 'déjà écrit : rien ne se crée sans son enregistrement. ELLES NE '
          + 'PORTENT AUCUN MUSCLE, et c’est MESURÉ : « Rising » (bord du '
          + 'pouce) et « Déviation ulnaire » (bord du petit doigt) sont '
          + 'DÉJÀ dans les dix que la clé propose — les y recopier '
          + 'n’ajouterait pas un muscle, et ferait passer le libellé de '
          + '« d’après l’outil » à « d’après ce qui est renseigné » : une '
          + 'perte. Le réglage vaut donc ici comme ÉTIQUETTE, qui distingue '
          + 'deux séances au journal ; l’utilisateur y cochera ses muscles '
          + 's’il le veut. Un contrôle du banc tient cette inclusion et '
          + 'tombera si les entrées du type changent.'
    },
    {
      cle: 'cone',
      nom: 'Poignée conique',
      liens: [{ texte: 'Golden Grip — Cone handle', url: 'https://www.goldengrip.com/products/cone-handle' },
              { texte: 'Mithril — Conic Handle 35-60mm', url: 'https://mithrilarmwrestling.com/products/conic-handle-35-60mm' },
              { texte: 'Mithril — Eccentric Cone', url: 'https://mithrilarmwrestling.com/products/eccentric-cone' },
              { texte: 'Titangrip — Kegel Tool', url: 'https://titangrip.de/produkt/kegel-tool' }],
      source: S.geste,
      cite: null,
      note: 'LE DIAMÈTRE CHANGE SUR LA LONGUEUR : la main glisse vers le '
          + 'gros bout si elle ne tient pas. Les fléchisseurs des doigts, '
          + 'et EUX SEULS — l’étude de Krings mesure le MANCHON, pas le '
          + 'cône, et je ne lui fais pas dire ce qu’elle ne dit pas. '
          + 'RAISONNÉ.'
    },
    {
      cle: 'eccentric',
      nom: 'Poignée excentrée',
      liens: [{ texte: 'Golden Grip — Eccentric Grip Handle', url: 'https://www.goldengrip.com/products/eccentric-grip-handle' },
              { texte: 'Mithril — Eccentric Handle', url: 'https://mithrilarmwrestling.com/products/eccentric-handle' },
              { texte: 'Mithril — Old School Eccentric Handle', url: 'https://mithrilarmwrestling.com/products/old-school-eccentric-handle' },
              { texte: 'Mithril — Eccentric Round Anti-Toproll', url: 'https://mithrilarmwrestling.com/products/eccentric-round-anti-toproll' }],
      source: S.geste,
      cite: null,
      note: 'L’AXE DE CHARGE N’EST PAS AU CENTRE DE LA MAIN : le poignet '
          + 'résiste à une torsion permanente, d’où les deux rotations. '
          + 'RAISONNÉ. — UN OUTIL PEUT PORTER DEUX MOTS : « Eccentric Round '
          + 'Anti-Toproll » est reconnu par CE type ET par l’anti-toproll, '
          + 'et il prend l’UNION des deux. C’est juste — il est les deux à '
          + 'la fois — et un contrôle du banc le tient. — MB a noté que ce '
          + 'type, la rotation libre et le glissant proposent presque la '
          + 'même chose : s’il veut couper, c’est là.'
    },
    {
      cle: 'slippery',
      nom: 'Poignée glissante',
      liens: [{ texte: 'Mithril — Soft & Slippery Handle', url: 'https://mithrilarmwrestling.com/products/independent-handle-70mm' },
              { texte: 'Mithril — Towel', url: 'https://mithrilarmwrestling.com/products/towel' }],
      source: S.geste,
      cite: null,
      note: 'LA PRISE GLISSE EXPRÈS : la main doit serrer plus fort. Les '
          + 'fléchisseurs des doigts, et c’est la DÉFINITION du geste, pas '
          + 'une mesure. RAISONNÉ.'
    },
    {
      cle: 'ceinture de judo',
      nom: 'Ceinture de judo / sangle',
      liens: [{ texte: 'Golden Grip — Armwrestling Judo Belt', url: 'https://www.goldengrip.com/products/armwrestling-judo-belt' },
              { texte: 'Golden Grip — Arm wrestling strap', url: 'https://www.goldengrip.com/products/arm-wrestling-strap' },
              { texte: 'Titangrip — Trainingsgurt', url: 'https://titangrip.de/produkt/armwrestling-trainingsgurt' },
              { texte: 'Mithril — Flat Strap', url: 'https://mithrilarmwrestling.com/products/flat-strap' }],
      source: S.riennedit,
      cite: null,
      note: 'LE SEUL TYPE QUI NE PROPOSE AUCUN MUSCLE, et c’est la source '
          + 'qui l’impose : trois études, trois directions — −16 % à '
          + 'l’avant-bras à l’arraché, aucun effet sur l’activation au '
          + 'soulevé de terre, l’hypothèse de fatigue contredite au '
          + 'tirage. On n’en tire pas une règle. Comme la poulie et '
          + 'l’élastique, elle change ce qu’on TIENT, pas ce qui travaille, '
          + 'et le geste est déjà nommé par l’exercice. — ELLE ENTRE POUR '
          + 'ÊTRE RECONNUE, sur demande de MB le 27/10 : « on va retirer '
          + 'pour les mouvements ceux qui ont sangle, et tu rajouteras '
          + 'ceinture de judo dans équipement ». C’est le bon rangement, et '
          + 'il corrige le sien du 26/10 (« on a déjà les mouvements avec '
          + 'sangle, donc ceinture de judo peut sauter ») : une sangle '
          + 'n’est pas un geste. CINQ ÉCRITURES ont donc quitté le '
          + 'dictionnaire le même jour — « Rising à la sangle », '
          + '« Pronation à la sangle », « Toproll à la sangle », « Hook à '
          + 'la sangle », « Curl à la sangle ». MESURÉ AVANT DE RETIRER : '
          + 'aucune ENTRÉE ne portait ce nom, les cinq n’étaient que des '
          + 'écritures alternatives, et les cinq mouvements restent. La '
          + 'LECTURE tient d’ailleurs toujours : « Rising à la sangle » '
          + 'tapé en nom d’exercice propose encore les trois muscles du '
          + 'rising. Ce qui disparaît, c’est la suggestion du dictionnaire '
          + 'sur ce mot — cinq contrôles du banc sont partis avec, et c’est '
          + 'la bonne arithmétique.'
    },
    {
      cle: 'corde',
      nom: 'Corde (deux boules au bout)',
      liens: [],
      source: S.riennedit,
      cite: null,
      note: 'AUCUN MUSCLE, et MB le démontre sans le vouloir en la '
          + 'décrivant : « pour faire du curl, extensions & cie ». LE MÊME '
          + 'OBJET sert à fléchir le coude ET à l’étendre — donc à des '
          + 'muscles opposés. Lui en faire porter ferait proposer du biceps '
          + 'à une extension triceps : c’est l’exercice qui nomme le '
          + 'travail, pas l’accessoire. — CE QU’ELLE IMPOSE VRAIMENT, c’est '
          + 'une PRISE NEUTRE : les deux brins tombent verticalement, paume '
          + 'ni au sol ni au plafond — les mots de MB le 15/10. Le carnet a '
          + 'déjà un champ « prise » et une entrée « Curl marteau » pour '
          + 'ça. — DEUXIÈME TYPE SANS MUSCLE, après la ceinture de judo, et '
          + 'les deux sont des ACCESSOIRES DE LIAISON : ce qui relie la '
          + 'charge à la main ne décide pas de ce qui travaille. C’est une '
          + 'famille, pas une exception. — AUCUN LIEN PRODUIT, et c’est '
          + 'voulu : la corde est du matériel de salle GÉNÉRIQUE, vendue '
          + 'partout et par aucun des quatre sites d’armwrestling relevés. '
          + 'Elle ne passe donc pas le critère des deux sites — elle entre '
          + 'parce que MB s’en sert, comme le hook au lot 3. J’avais '
          + 'd’abord mis deux liens ici : une URL de catégorie que j’avais '
          + 'INVENTÉE (404), et un « Spezial Rudergriff » qui est une '
          + 'poignée de tirage, pas une corde. Le quatrième contrôle a '
          + 'attrapé le second ; le premier, c’est l’ouverture de la page '
          + 'qui l’a dit.'
    },
    {
      cle: 'anti toproll',
      nom: 'Poignée anti-toproll',
      liens: [{ texte: 'Mithril — Anti-Toproll V3',
                url: 'https://mithrilarmwrestling.com/products/anti-toproll-v3' },
              { texte: 'Mithril — Eccentric Round Anti-Toproll',
                url: 'https://mithrilarmwrestling.com/products/eccentric-round-anti-toproll' },
              { texte: 'Mithril — catégorie Toproll Training',
                url: 'https://mithrilarmwrestling.com/collections/toproll-training' },
              { texte: 'Titangrip — Multi-Tool, accessoire Toproll Counter',
                url: 'https://titangrip.de/multi-tool' }],
      source: S.geste,
      cite: null,
      note: 'RÉSISTER À UN TOPROLL N’EST PAS EN FAIRE UN — question de MB le '
          + '28/10 : « l’anti-toproll, me semble t’il, tiens sur de la '
          + 'technique toproll, à confirmer ». CONFIRMÉ, et par la seule '
          + 'source qui range ses produits PAR BUT : Mithril trie son '
          + 'catalogue en « Shop by Training Goal », et ses CINQ poignées '
          + 'anti-toproll sont toutes sous « Toproll Training », AUCUNE '
          + 'sous « Hook Training ». — CE TYPE NE REMPLACE DONC RIEN : une '
          + 'poignée anti-toproll reste un toproll, et gagne en plus ce que '
          + 'les trois fabricants nomment. — LES DOIGTS ET LA FLEXION, DITS '
          + 'TROIS FOIS : Golden Grip, « elite finger strength, which can '
          + 'be used to contain your opponent’s hand during an armwrestling '
          + 'match » ; Titangrip, « gezielte Belastungsübertragung auf die '
          + 'Finger und das Handgelenk » ; Mithril V1, « Wrist flexion, '
          + 'pronation, finger containment, grip stability, and defensive '
          + 'hand control ». D’où l’entrée « Wrist curl », DÉRIVÉE du '
          + 'dictionnaire et non recopiée : le jour où la flexion du '
          + 'poignet gagne un muscle, l’anti-toproll le gagne aussi. — LES '
          + 'DEUX EXTENSEURS RESTENT PROPOSÉS, et aucun fabricant ne les '
          + 'nomme ici : ils viennent du toproll, par l’appartenance que MB '
          + 'demandait de confirmer. C’est dit plutôt que masqué.'
    },
    {
      cle: 'multi tool',
      nom: 'Multi-Tool (cadre)',
      liens: [{ texte: 'Titangrip — Multi-Tool et ses accessoires',
                url: 'https://titangrip.de/multi-tool' },
              { texte: 'Titangrip — Multi-Tool Rahmen (le cadre seul)',
                url: 'https://titangrip.de/produkt/multi-tool-rahmen' }],
      source: S.cadre,
      cite: null,
      note: 'LE CADRE, ET RIEN QUE LE CADRE. Un Multi-Tool nu ne travaille '
          + 'RIEN : c’est l’accessoire monté dessus qui décide, et c’est '
          + 'pourquoi il n’a ni muscles ni entrée. MB, 28/10 : « c’est une '
          + 'poignée métallique où tu peux mettre différentes poignées '
          + 'd’armwrestling dessus ». — SES NEUF ACCESSOIRES, et ce qu’ils '
          + 'proposent AUJOURD’HUI, mesuré nom par nom : Zylinder S, M, L, '
          + 'XL mènent à la PRISE ÉPAISSE (il faut écrire « Aufsatz '
          + 'Zylinder L » — « Zylinder » seul est interdit exprès, car '
          + '« Pronator Zylinder » est un autre produit) ; Exzentrisch mène '
          + 'à la pronation et la supination ; Kegel aux fléchisseurs des '
          + 'doigts ; Toproll Counter aux neuf muscles de l’anti-toproll. '
          + 'Sept sur neuf répondent donc déjà par leur nom de marque. — '
          + 'LES DEUX QUI RESTENT MUETS, et le trou n’est PAS dans ce '
          + 'carnet : « Aufsatz Wrist Pro Gelb » et « Aufsatz Multi Hand '
          + 'Grip Gelb » n’ont AUCUNE description chez Titangrip. Ni sur la '
          + 'page du Multi-Tool, ni sur leur propre fiche produit, lues le '
          + '29/10 : un prix, un numéro d’article, un stock, et rien '
          + 'd’autre. Leur donner des muscles serait les déduire de la '
          + 'forme du produit — c’est précisément ce que ce fichier '
          + 'interdit. Ils restent muets tant que le fabricant se tait.'
    },
    {
      cle: 'armwrestling buddies',
      nom: 'Armwrestling Buddies (cadre)',
      liens: [{ texte: 'Golden Grip — Armwrestling Buddies',
                url: 'https://www.goldengrip.com/products/armwrestling-buddies' },
              { texte: 'Golden Grip — Cone Handle',
                url: 'https://www.goldengrip.com/products/cone-handle' },
              { texte: 'Golden Grip — King’s Cup',
                url: 'https://www.goldengrip.com/products/kings-cup' }],
      source: S.cadre,
      cite: null,
      note: 'L’AUTRE CADRE, celui de Golden Grip, et le même principe : nu, '
          + 'il ne travaille rien. — CE N’EST PAS UNE MARQUE, et c’est ce '
          + 'qui m’a fait chercher à côté le 29/10 : « Armwrestling '
          + 'Buddies » est un PRODUIT de Golden Grip, le catalogue des '
          + 'marques du modèle le dit déjà. Cherché comme marque '
          + 'indépendante, il n’a évidemment pas de site. — SES SIX '
          + 'ACCESSOIRES RÉPONDENT TOUS par leur nom, mesuré : Offset '
          + 'Cylinder Handle mène à la prise épaisse, Anti-Toproll Handle '
          + '(avec ou sans sangle) aux neuf muscles de l’anti-toproll, '
          + 'Eccentric Grip Handle à la pronation et la supination, King’s '
          + 'Cup aux cinq de la cup, Cone Handle aux CINQ du cupping et du '
          + 'poignet. — LA DETTE DU CONE HANDLE EST SOLDÉE (1.66.0), ET '
          + 'MON ÉNONCÉ DE CETTE DETTE ÉTAIT FAUX : cette fiche disait, '
          + 'ici même, que la page Golden Grip « nomme une cup profonde, '
          + 'une tension côté auriculaire et de la supination ». Les deux '
          + 'pages ont été LUES le 29/10 : aucune ne dit cela, et celle de '
          + 'Golden Grip ne donne que des dimensions. J’avais déduit ces '
          + 'trois effets de la FORME du produit et les avais écrits comme '
          + 'une citation. — CE QUE LES DEUX DISENT VRAIMENT, et c’est le '
          + 'critère de deux sites indépendants : Golden Grip, « Train '
          + 'cupping, wrist flexion and hand control », page titrée « Cone '
          + 'Handle for Armwrestling Cup Training » ; Mithril, « Grip '
          + 'strength, cupping, wrist control, pronation, finger '
          + 'containment, and forearm stability ». COMMUN : le cupping et '
          + 'le poignet. Le type `cone` emprunte donc aux entrées « Cup '
          + 'hold » et « Wrist curl » — dérivées, non recopiées. — ET '
          + 'MITHRIL CONFIRME MB : « The changing diameter creates '
          + 'different leverage for the fingers along the cone. The '
          + 'athlete can alter hand position… » Les cinq du cupping sont '
          + 'exactement ceux de l’orientation « large vers le poignet » : '
          + 'les fabricants ne décrivent qu’UN des deux sens.'
    },
    {
      cle: 'thumb',
      nom: 'Travail du pouce',
      liens: [{ texte: 'Golden Grip — Thumb Pump', url: 'https://www.goldengrip.com/products/thumb-pump' },
              { texte: 'Golden Grip — Thumb War', url: 'https://www.goldengrip.com/products/thumb-war' },
              { texte: 'Titangrip — Thumb Belt', url: 'https://titangrip.de/produkt/thumb-belt' }],
      source: S.geste,
      cite: null,
      note: 'LES CINQ MUSCLES DU POUCE sont ceux que la prise FERMÉE '
          + 'propose déjà — même raisonnement, même liste, et aucune mesure '
          + 'nouvelle. Un contrôle du banc vérifie qu’il ne propose QUE du '
          + 'pouce : un mot trop gourmand se verrait.'
    },
  ];

  /* CE QUI A ÉTÉ CHERCHÉ ET REFUSÉ. Écrit pour qu’on ne le recherche pas
     deux fois, et pour que l’absence se voie. */
  var ECARTES = [
    {
      nom: 'Sangle de doigts (Finger Gurt)',
      pourquoi: 'AUCUNE DESCRIPTION, NULLE PART. La page Titangrip ne dit '
              + 'rien du tout — un prix, une catégorie « Griffkraft », et '
              + 'c’est tout. Elle était citée dans la fiche « Bloc de '
              + 'pince », où elle n’a rien à faire : on ne pince pas une '
              + 'sangle. — CE N’EST PAS RÉGLÉ POUR AUTANT : celui qui en a '
              + 'une ne trouvera rien dans le carnet. C’est un manque '
              + 'nommé, pas un manque masqué.'
    },
    {
      nom: 'Poulie, câble, élastique',
      pourquoi: 'Ils changent la COURBE de résistance, pas les muscles. Et '
              + 'le carnet a déjà un champ « Type de charge » pour '
              + 'l’élastique.'
    }
  ];

  window.CATALOGUE_OUTILS = { S: S, C: C, OUTILS: OUTILS, ECARTES: ECARTES };
}());
