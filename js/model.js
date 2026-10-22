/* Modèle : identité des exercices, copie programme -> séance, volume, colonne PRÉCÉDENT. */
(function (A) {
  'use strict';

  /* Le type « échauffement » a été retiré : il n'était pas employé, et il
     gonflait le volume de travail sans qu'on puisse l'en sortir. Les séries
     qui le portaient deviennent normales à la lecture — voir migrer(). */
  var TYPES_SERIE = {
    normale:    { lettre: '',  nom: 'Normale' },
    degressive: { lettre: 'D', nom: 'Dégressive' },
    echec:      { lettre: 'E', nom: "À l'échec" }
  };
  var ORDRE_TYPES = ['normale', 'degressive', 'echec'];

  /* `typeCharge` ne dit plus qu'une chose : COMMENT se lit la charge. Il disait
     aussi, pour la valeur 'duree', quelles colonnes afficher — en detournant la
     colonne REPS en secondes. Deux questions dans un seul champ : un exercice
     isometrique ne pouvait pas se passer de la colonne charge, et un exercice
     en kilos ne pouvait pas porter de duree. Ce qui s'affiche est maintenant
     dit par `colonnes`, juste en dessous. */
  var TYPES_CHARGE = [
    { id: 'kg',          nom: 'Kilos',            unite: 'kg', labelCharge: 'Charge', modeCharge: 'decimal', tonnage: true },
    { id: 'niveau',      nom: 'Niveau (gripper)', unite: '',   labelCharge: 'Niveau', modeCharge: 'text',    tonnage: false },
    { id: 'elastique',   nom: 'Élastique',        unite: '',   labelCharge: 'Bande',  modeCharge: 'text',    tonnage: false },
    { id: 'poids_corps', nom: 'Poids du corps',   unite: 'kg', labelCharge: 'Lest',   modeCharge: 'decimal', tonnage: false }
  ];

  /* Ce que la ligne de serie AFFICHE. Trois colonnes au plus : a 320 px, la
     quatrieme passerait sous 45 px avec la colonne PRECEDENT, et on ne lirait
     plus rien. Un isometrique n'affiche que DUREE ; le defaut reste charge+reps.

     L'ordre de ce tableau est l'ordre a l'ecran, toujours : la colonne charge
     ne doit pas changer de place d'un exercice a l'autre. */
  /* Chaque colonne sait OU elle lit, OU elle ecrit, comment elle s'appelle et
     quel clavier elle demande. La seance et l'editeur de programme batissent
     tous deux leurs champs a partir d'ici : les nommer un par un dans chaque
     vue dupliquait le code et rendait l'ajout d'une colonne impossible sans
     rouvrir les deux. L'entete de la colonne charge depend du type de charge
     — « Charge », « Niveau », « Bande », « Lest » — d'ou les fonctions. */
  var COLONNES = [
    { id: 'charge', nom: 'Charge', reel: 'chargeReel', cible: 'chargeCible',
      label: function (tc) { return tc.labelCharge; },
      mode: function (tc) { return tc.modeCharge; },
      aide: 'Ce qui est soulevé.' },
    { id: 'reps', nom: 'Reps', reel: 'repsReel', cible: 'repsCible',
      label: function () { return 'Reps'; },
      mode: function () { return 'numeric'; },
      aide: 'Le nombre de répétitions.' },
    /* En SECONDES : le clavier numerique du telephone n'offre pas de « : ».
       secondes() lit quand meme « 1:30 », pour un carnet tape ailleurs, mais
       ce n'est pas ce qu'on demande ici. */
    { id: 'duree', nom: 'Durée', reel: 'dureeReel', cible: 'dureeCible',
      label: function () { return 'Sec'; },
      mode: function () { return 'numeric'; },
      aide: 'Le temps sous tension de la série, en secondes.' }
  ];
  var COLONNES_DEFAUT = ['charge', 'reps'];

  function colonne(id) {
    for (var i = 0; i < COLONNES.length; i++) if (COLONNES[i].id === id) return COLONNES[i];
    return COLONNES[0];
  }

  /* Les colonnes d'un exercice, remises dans l'ordre canonique et jamais vides :
     un exercice sans aucune colonne n'aurait plus rien a saisir. */
  function colonnes(exo) {
    var voulues = (exo && exo.colonnes) || null;
    if (!voulues || !voulues.length) return COLONNES_DEFAUT.slice();
    var l = [];
    COLONNES.forEach(function (c) { if (voulues.indexOf(c.id) >= 0) l.push(c.id); });
    return l.length ? l : COLONNES_DEFAUT.slice();
  }
  function aColonne(exo, id) { return colonnes(exo).indexOf(id) >= 0; }

  /* Le tonnage est charge x reps : sans les DEUX colonnes, il n'y a rien a
     multiplier. C'est ce qui fait qu'un isometrique ne pese rien tout seul,
     sans qu'on ait eu a l'ecrire quelque part — et c'est aussi pourquoi la
     migration des anciens `typeCharge: 'duree'` ne deplace aucun chiffre. */
  function peutPeser(exo) {
    return typeCharge(exo && exo.typeCharge).tonnage
        && aColonne(exo, 'charge') && aColonne(exo, 'reps');
  }

  /* Les mouvements du bras de fer. La cle de stockage reste `forces` sur
     l'exercice : renommer le champ casserait les carnets deja saisis, et
     l'affichage seul avait besoin de changer. Ranges par axe — ce qui pousse,
     puis ce que fait la main. */
  var FORCES = [
    { id: 'rising',        nom: 'Rising' },
    { id: 'back_pressure', nom: 'Back pressure' },
    { id: 'side_pressure', nom: 'Side pressure' },
    { id: 'supination',    nom: 'Supination' },
    { id: 'cupping',       nom: 'Cupping' },
    { id: 'pronation',     nom: 'Pronation' }
  ];

  /* Structures anatomiques qu'un exercice charge. Les cinq premieres sont
     EXACTEMENT les zones de douleur : c'est ce qui permet a Suivi de croiser
     « quand ai-je charge lourd le medial » avec « quand le medial a fait mal ».
     Les deux dernieres n'ont pas de douleur correspondante, et c'est assume. */
  var STRUCTURES = [
    { id: 'poignet',       nom: 'Poignet' },
    { id: 'coude_medial',  nom: 'Coude médial' },
    { id: 'coude_lateral', nom: 'Coude latéral' },
    { id: 'avant_bras',    nom: 'Avant-bras' },
    { id: 'epaule',        nom: 'Épaule' },
    { id: 'main_doigts',   nom: 'Main et doigts' },
    { id: 'biceps',        nom: 'Biceps' }
  ];

  /* ---------- le cote ----------

     Le bras de fer est asymetrique, et une epicondylite est d'UN cote. Sans
     cette information, « coude medial 4/10 » ne dit pas quel coude, et le
     recoupement 72 h croise la douleur d'un bras avec la charge de l'autre :
     il repond alors a cote de la question qu'on lui pose.

     `null` veut dire NON RENSEIGNE, et n'est jamais remplace par une valeur
     par defaut — meme principe que l'intensite d'une douleur. Un carnet
     ecrit avant se relit entier, avec des cotes inconnus plutot qu'inventes.

     « Les deux » n'est pas un troisieme cote : c'est une charge qui porte sur
     les deux, et elle compte des deux cotes. */
  var COTES = [
    { id: 'droit',  nom: 'Droit',     court: 'D' },
    { id: 'gauche', nom: 'Gauche',    court: 'G' },
    { id: 'deux',   nom: 'Les deux',  court: 'G+D' }
  ];
  var COTE_INCONNU = 'inconnu';

  function coteValide(id) {
    for (var i = 0; i < COTES.length; i++) if (COTES[i].id === id) return id;
    return null;
  }
  function nomCote(id) {
    for (var i = 0; i < COTES.length; i++) if (COTES[i].id === id) return COTES[i].nom;
    return 'Côté non renseigné';
  }
  function courtCote(id) {
    for (var i = 0; i < COTES.length; i++) if (COTES[i].id === id) return COTES[i].court;
    return '';
  }
  /* Quels cotes une charge portee « a droite », « a gauche » ou « des deux »
     sollicite reellement. Un cote inconnu ne couvre rien : on ne devine pas. */
  function cotesCouverts(cote) {
    if (cote === 'deux') return ['droit', 'gauche'];
    if (cote === 'droit' || cote === 'gauche') return [cote];
    return [];
  }

  var ZONES = [
    { id: 'coude_medial',  nom: 'Coude médial' },
    { id: 'coude_lateral', nom: 'Coude latéral' },
    { id: 'poignet',       nom: 'Poignet' },
    { id: 'avant_bras',    nom: 'Avant-bras' },
    { id: 'epaule',        nom: 'Épaule' },
    { id: 'aucune',        nom: 'Aucune' }
  ];

  var STYLES = [
    { id: 'hook',    nom: 'Hook' },
    { id: 'toproll', nom: 'Toproll' },
    { id: 'mixte',   nom: 'Mixte' }
  ];

  var compteur = 0;
  function uid(p) {
    compteur += 1;
    return (p || 'i') + '_' + Date.now().toString(36) + '_' + compteur.toString(36)
         + Math.random().toString(36).slice(2, 6);
  }

  /* Identité d'un exercice : c'est le slug qui fait « c'est le même »,
     d'un programme à l'autre et d'une séance à l'autre. */
  function slug(nom) {
    return String(nom == null ? '' : nom)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  /* "17,5" -> 17.5 ; "N3", "", "rouge" -> null. Jamais 0 par défaut. */
  function nombre(txt) {
    if (txt == null) return null;
    var s = String(txt).trim().replace(',', '.');
    if (s === '') return null;
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  /* Une duree de serie, en secondes. Deux ecritures, parce que les deux se
     tapent naturellement : "45" pour trois quarts de minute, "1:30" quand la
     tenue depasse la minute et qu'on la compte en minutes. Tout le reste rend
     null, comme nombre() : une tenue non chiffree n'est pas zero seconde.

     "90" reste 90 secondes et non 1 min 30 : ce qui est tape est ce qui est lu. */
  function secondes(txt) {
    if (txt == null) return null;
    var s = String(txt).trim().replace(',', '.');
    if (s === '') return null;
    var m = s.match(/^(\d+):([0-5]\d)$/);
    if (m) return (+m[1]) * 60 + (+m[2]);
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    var n = parseFloat(s);
    return isFinite(n) && n >= 0 ? n : null;
  }

  /* Au-dela de la minute, les secondes seules ne se lisent plus d'un coup
     d'oeil : 1 850 s ne dit rien, 30:50 se compare. */
  function texteDuree(sec) {
    if (sec == null) return '';
    var s = Math.round(sec);
    if (s < 60) return s + ' s';
    var mn = Math.floor(s / 60), r = s % 60;
    return mn + ':' + (r < 10 ? '0' : '') + r;
  }

  function fmt(n, dec) {
    if (n == null) return '—';
    var x = Math.round(n * (dec ? 10 : 1)) / (dec ? 10 : 1);
    var p = String(x).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return p.join(',');
  }

  function typeCharge(id) {
    for (var i = 0; i < TYPES_CHARGE.length; i++) if (TYPES_CHARGE[i].id === id) return TYPES_CHARGE[i];
    return TYPES_CHARGE[0];
  }
  function nomZone(id) {
    for (var i = 0; i < ZONES.length; i++) if (ZONES[i].id === id) return ZONES[i].nom;
    return id;
  }
  function nomStructure(id) {
    for (var i = 0; i < STRUCTURES.length; i++) if (STRUCTURES[i].id === id) return STRUCTURES[i].nom;
    return id;
  }

  /* ---------- douleurs : zone ET intensite ----------
     Une tendinopathie ne se suit pas en oui/non : ce qui compte est si elle
     monte ou descend. On stocke donc { zone, intensite 0-10 | null }.

     Les carnets d'avant stockaient une simple chaine. normaliserDouleurs()
     accepte les deux formes : une sauvegarde ancienne se relit sans perte,
     avec une intensite inconnue (null) plutot qu'inventee. */

  function normaliserDouleurs(liste) {
    if (!Array.isArray(liste)) return [];
    var sortie = [];
    liste.forEach(function (d) {
      if (typeof d === 'string') { sortie.push({ zone: d, intensite: null, cote: null }); return; }
      if (d && typeof d === 'object' && typeof d.zone === 'string') {
        var i = d.intensite;
        i = (typeof i === 'number' && isFinite(i)) ? Math.min(10, Math.max(0, Math.round(i))) : null;
        /* « Aucune » ne porte ni intensite ni cote : il n'y a pas de douleur
           a situer. */
        var c = d.zone === 'aucune' ? null : coteValide(d.cote);
        sortie.push({ zone: d.zone, intensite: i, cote: c });
      }
    });
    return sortie;
  }

  function zonesDe(douleurs) {
    return normaliserDouleurs(douleurs).map(function (d) { return d.zone; });
  }

  /* Les zones reellement douloureuses : « aucune » est une reponse, pas une zone. */
  function zonesVives(douleurs) {
    return normaliserDouleurs(douleurs).filter(function (d) { return d.zone !== 'aucune'; });
  }

  function intensiteDe(douleurs, zone) {
    var l = normaliserDouleurs(douleurs);
    for (var i = 0; i < l.length; i++) if (l[i].zone === zone) return l[i].intensite;
    return null;
  }

  function texteDouleur(d) {
    return nomZone(d.zone)
         + (d.cote ? ' ' + courtCote(d.cote) : '')
         + (d.intensite == null ? '' : ' ' + d.intensite + '/10');
  }
  function nomForce(id) {
    for (var i = 0; i < FORCES.length; i++) if (FORCES[i].id === id) return FORCES[i].nom;
    return id;
  }
  function nomStyle(id) {
    for (var i = 0; i < STYLES.length; i++) if (STYLES[i].id === id) return STYLES[i].nom;
    return '';
  }

  /* ---------- dates ---------- */

  function aujourdHui() {
    var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }
  function dateObjet(iso) {
    var p = String(iso || '').split('-');
    return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
  }
  function jourSemaine(iso) {
    return ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][dateObjet(iso).getDay()];
  }
  function dateCourte(iso) {
    var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    var d = dateObjet(iso);
    return d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function joursEntre(isoA, isoB) {
    var a = dateObjet(isoA).getTime(), b = dateObjet(isoB).getTime();
    return Math.round((b - a) / 86400000);
  }
  function joursDepuis(iso) { return joursEntre(iso, aujourdHui()); }

  /* Horodatage d'usage des catalogues, a la milliseconde.

     Il valait la DATE seule, et c'etait un defaut : tous les outils ajoutes le
     meme jour se valaient, le tri stable gardait alors l'ordre d'insertion, et
     le dernier ajoute — celui qu'on vient de taper — tombait hors des huit
     suggestions affichees. Avec neuf outils en catalogue, un outil neuf
     n'apparaissait donc JAMAIS a l'ouverture de la liste.

     Une date ancienne ('2026-10-21') reste comparable : elle se classe avant
     tout horodatage du meme jour, ce qui est exactement ce qu'on veut.

     Il est STRICTEMENT croissant, et pas seulement lu a l'horloge : huit outils
     poses d'un meme geste — le raccourci « Ajouter mon matériel » — tombent
     dans la meme milliseconde, et seraient de nouveau a egalite. Le banc l'a
     fait tomber avant qu'on le croie. Le decalage introduit se compte en
     millisecondes, et `vuLe` ne sert qu'a classer. */
  var dernierVu = '';

  function maintenant() {
    var t = new Date().toISOString();
    if (t <= dernierVu) t = new Date(new Date(dernierVu).getTime() + 1).toISOString();
    dernierVu = t;
    return t;
  }

  /* ---------- catalogue implicite ---------- */

  function trouverCatalogue(etat, s) {
    for (var i = 0; i < etat.exercices.length; i++) if (etat.exercices[i].slug === s) return etat.exercices[i];
    return null;
  }

  /* Un nom employé entre au catalogue, ou s'y met à jour. Rien n'est pré-rempli. */
  function majCatalogue(etat, exo) {
    var s = slug(exo.nom);
    if (!s) return null;
    var e = trouverCatalogue(etat, s);
    if (!e) {
      e = { id: uid('ex'), nom: exo.nom, slug: s, aw: !!exo.aw,
            typeCharge: exo.typeCharge || 'kg', colonnes: colonnes(exo),
            cote: coteValide(exo.cote),
            forces: (exo.forces || []).slice(),
            structures: (exo.structures || []).slice(),
            outils: (exo.outils || []).slice(), vuLe: maintenant() };
      etat.exercices.push(e);
    } else {
      e.nom = exo.nom;
      e.aw = !!exo.aw;
      if (exo.typeCharge) e.typeCharge = exo.typeCharge;
      if (exo.colonnes) e.colonnes = colonnes(exo);
      /* Le cote se met a jour, et peut aussi etre EFFACE : repasser un exercice
         a « non renseigne » doit pouvoir se faire. */
      e.cote = coteValide(exo.cote);
      if (exo.forces) e.forces = exo.forces.slice();
      if (exo.structures) e.structures = exo.structures.slice();
      if (exo.outils) e.outils = exo.outils.slice();
      e.vuLe = maintenant();
    }
    (exo.outils || []).forEach(function (o) { majCatalogueOutils(etat, o); });
    return e;
  }

  /* ---------- catalogue d'outils, implicite lui aussi ----------
     Dumbbell, poulie haute, Titan Grip… : rien n'est livré avec l'app,
     la liste se construit avec ce que je saisis. Un exercice peut en porter
     plusieurs — « Titan Grip sur poulie haute » en est le cas courant. */

  function trouverOutil(etat, s) {
    for (var i = 0; i < etat.outils.length; i++) if (etat.outils[i].slug === s) return etat.outils[i];
    return null;
  }

  function majCatalogueOutils(etat, nom, categorie) {
    var s = slug(nom);
    if (!s) return null;
    var o = trouverOutil(etat, s);
    if (!o) {
      o = { id: uid('ou'), nom: String(nom).trim(), slug: s,
            categorie: (categorie || '').trim(), vuLe: maintenant() };
      etat.outils.push(o);
    } else {
      o.nom = String(nom).trim();
      /* Une catégorie vide ne doit pas effacer celle qui est déjà posée :
         l'outil saisi depuis un exercice n'en porte pas. */
      if (categorie != null && String(categorie).trim()) o.categorie = String(categorie).trim();
      o.vuLe = maintenant();
    }
    return o;
  }

  var SANS_CATEGORIE = 'Sans catégorie';

  /* Catégories réellement employées, jamais une liste imposée. */
  function categoriesOutils(etat) {
    var vues = {}, l = [];
    etat.outils.forEach(function (o) {
      var c = (o.categorie || '').trim();
      if (!c) return;
      var k = slug(c);
      if (!vues[k]) { vues[k] = 1; l.push(c); }
    });
    return l.sort(function (a, b) { return a.localeCompare(b); });
  }

  function outilsParCategorie(etat) {
    var groupes = {}, ordre = [];
    etat.outils.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); }).forEach(function (o) {
      var c = (o.categorie || '').trim() || SANS_CATEGORIE;
      if (!groupes[c]) { groupes[c] = []; ordre.push(c); }
      groupes[c].push(o);
    });
    ordre.sort(function (a, b) {
      if (a === SANS_CATEGORIE) return 1;      // le fourre-tout reste en bas
      if (b === SANS_CATEGORIE) return -1;
      return a.localeCompare(b);
    });
    return ordre.map(function (c) { return { categorie: c, outils: groupes[c] }; });
  }

  /* Classement par recence, avec un departage qui compte.

     `vuLe` horodate suffit pour ce qui est ecrit depuis, mais PAS pour un
     carnet d'avant : ses entrees portent une date seule, celles d'un meme jour
     sont a egalite, et le tri stable garde alors l'ordre d'INSERTION — soit
     exactement l'inverse de ce qu'on veut. Un carnet nourri en une journee
     n'affichait donc que ses huit premiers outils, et jamais les suivants.
     Le symptome a ete constate sur un vrai telephone apres coup : corriger
     l'ecriture ne corrige pas ce qui est deja ecrit.

     A egalite, le dernier POSE passe donc devant. C'est vrai des deux cotes :
     pour un carnet ancien c'est la seule information d'ordre disponible, et
     pour un carnet recent le cas ne se presente pas, les horodatages etant
     strictement croissants. */
  function parRecence(liste) {
    return liste
      .map(function (x, i) { return { x: x, i: i }; })
      .sort(function (a, b) {
        var d = (b.x.vuLe || '').localeCompare(a.x.vuLe || '');
        return d !== 0 ? d : b.i - a.i;
      })
      .map(function (p) { return p.x; });
  }

  /* La liste est TRONQUEE a `limite` : le classement decide donc ce qui est
     visible, pas seulement ce qui vient en premier. */
  function suggestionsOutils(etat, saisie, dejaPris, limite) {
    var q = slug(saisie);
    var pris = (dejaPris || []).map(slug);
    var l = parRecence(etat.outils.filter(function (o) { return pris.indexOf(o.slug) < 0; }));
    if (!q) return l.slice(0, limite || 8);
    var debut = [], dedans = [];
    for (var i = 0; i < l.length; i++) {
      var p = l[i].slug.indexOf(q);
      if (p === 0) debut.push(l[i]);
      else if (p > 0) dedans.push(l[i]);
    }
    return debut.concat(dedans).slice(0, limite || 8);
  }

  /* Suggestions pour l'autocomplétion : ce que j'ai déjà employé, rien d'autre.
     Classement : commence par la saisie d'abord, puis le plus récemment vu. */
  function suggestions(etat, saisie, limite) {
    var q = slug(saisie);
    var l = parRecence(etat.exercices);
    if (!q) return l.slice(0, limite || 8);
    var debut = [], dedans = [];
    for (var i = 0; i < l.length; i++) {
      var p = l[i].slug.indexOf(q);
      if (p === 0) debut.push(l[i]);
      else if (p > 0) dedans.push(l[i]);
    }
    return debut.concat(dedans).slice(0, limite || 8);
  }

  /* ---------- migration, À LA LECTURE ----------

     Même principe que normaliserDouleurs() : une sauvegarde ancienne se relit
     intégralement, et rien n'est réécrit sur le disque tant que l'app n'écrit
     pas d'elle-même. Deux conversions.

     1. `typeCharge: 'duree'` détournait la colonne REPS en secondes. L'exercice
        devient « charge en kilos, colonnes charge + durée », et ses secondes
        passent de repsReel à dureeReel, là où elles auraient toujours dû être.
        AUCUN chiffre du passé ne bouge : sans colonne reps, il n'y a rien à
        multiplier, donc pas de tonnage — exactement comme avant, où le type
        'duree' portait tonnage: false.

     2. Le type de série « échauffement » n'existe plus. Les séries qui le
        portaient deviennent normales. Là non plus rien ne bouge : un
        échauffement comptait déjà dans le tonnage comme une série de travail.
        Seule la colonne PRÉCÉDENT se décale, et dans le bon sens : elle
        indexait par rang DANS LE TYPE, et ces séries rejoignent le rang des
        normales, qui est celui qu'on compare. */
  function migrer(etat) {
    function unExercice(ex) {
      if (!ex || typeof ex !== 'object') return;

      if (ex.typeCharge === 'duree') {
        ex.typeCharge = 'kg';
        ex.colonnes = ['charge', 'duree'];
        (ex.series || []).forEach(function (s) {
          if (!s) return;
          if (!s.dureeReel && s.repsReel) { s.dureeReel = s.repsReel; s.repsReel = ''; }
          if (!s.dureeCible && s.repsCible) { s.dureeCible = s.repsCible; s.repsCible = ''; }
        });
      }
      ex.colonnes = colonnes(ex);
      /* Le cote n'est pas invente : absent, il reste null. */
      ex.cote = coteValide(ex.cote);

      (ex.series || []).forEach(function (s) {
        if (!s) return;
        if (s.dureeReel == null) s.dureeReel = '';
        if (s.dureeCible == null) s.dureeCible = '';
        if (s.type === 'echauffement') s.type = 'normale';
        if (!TYPES_SERIE[s.type]) s.type = 'normale';
      });
    }

    (etat.exercices || []).forEach(unExercice);
    (etat.programmes || []).forEach(function (p) { (p.exercices || []).forEach(unExercice); });
    if (etat.routineRecup) (etat.routineRecup.exercices || []).forEach(unExercice);
    (etat.seances || []).forEach(function (s) {
      if (s && (s.type === 'muscu' || s.type === 'recup')) (s.exercices || []).forEach(unExercice);
    });
    return etat;
  }

  /* ---------- fabriques ---------- */

  function serieProgramme(modele) {
    modele = modele || {};
    return { id: uid('sp'), type: modele.type || 'normale',
             repsCible: modele.repsCible || '', chargeCible: modele.chargeCible || '',
             dureeCible: modele.dureeCible || '' };
  }

  function exerciceProgramme(modele) {
    modele = modele || {};
    return {
      id: uid('ep'), ordre: 0,
      nom: modele.nom || '', slug: slug(modele.nom || ''),
      aw: !!modele.aw, typeCharge: modele.typeCharge || 'kg',
      colonnes: colonnes(modele), cote: coteValide(modele.cote),
      forces: (modele.forces || []).slice(),
      structures: (modele.structures || []).slice(),
      outils: (modele.outils || []).slice(),
      consigne: modele.consigne || '',
      reposSecondes: modele.reposSecondes == null ? 120 : modele.reposSecondes,
      series: (modele.series || []).map(serieProgramme)
    };
  }

  function programme(nom) {
    return { id: uid('pr'), nom: nom || '', description: '', archive: false,
             creeLe: aujourdHui(), exercices: [] };
  }

  function renumeroter(liste) {
    for (var i = 0; i < liste.length; i++) liste[i].ordre = i;
    return liste;
  }

  /* La séance est une COPIE. Aucune référence vivante vers le programme. */
  function serieDepuisProgramme(sp) {
    return { id: uid('ss'), type: sp.type,
             repsCible: sp.repsCible || '', chargeCible: sp.chargeCible || '',
             dureeCible: sp.dureeCible || '',
             repsReel: '', chargeReel: '', dureeReel: '',
             rpe: null, faite: false, faiteA: null };
  }

  function exerciceSeanceDepuisProgramme(ep) {
    return {
      id: uid('es'), ordre: ep.ordre,
      nom: ep.nom, slug: ep.slug || slug(ep.nom),
      aw: !!ep.aw, typeCharge: ep.typeCharge || 'kg',
      colonnes: colonnes(ep), cote: coteValide(ep.cote),
      forces: (ep.forces || []).slice(),
      structures: (ep.structures || []).slice(),
      outils: (ep.outils || []).slice(),
      consigne: ep.consigne || '',
      reposSecondes: ep.reposSecondes == null ? 120 : ep.reposSecondes,
      series: (ep.series || []).map(serieDepuisProgramme)
    };
  }

  function serieSeanceVierge(modele) {
    modele = modele || {};
    return { id: uid('ss'), type: modele.type || 'normale',
             repsCible: modele.repsCible || '', chargeCible: modele.chargeCible || '',
             dureeCible: modele.dureeCible || '',
             repsReel: '', chargeReel: '', dureeReel: '',
             rpe: null, faite: false, faiteA: null };
  }

  function exerciceSeanceVierge(modele) {
    modele = modele || {};
    return {
      id: uid('es'), ordre: 0,
      nom: modele.nom || '', slug: slug(modele.nom || ''),
      aw: !!modele.aw, typeCharge: modele.typeCharge || 'kg',
      colonnes: colonnes(modele), cote: coteValide(modele.cote),
      forces: (modele.forces || []).slice(),
      structures: (modele.structures || []).slice(),
      outils: (modele.outils || []).slice(),
      consigne: modele.consigne || '',
      reposSecondes: modele.reposSecondes == null ? 120 : modele.reposSecondes,
      series: (modele.series && modele.series.length ? modele.series.map(serieSeanceVierge)
                                                     : [serieSeanceVierge()])
    };
  }

  function seanceMuscu(prog) {
    var s = {
      id: uid('se'), type: 'muscu', date: aujourdHui(), heure: new Date().toISOString(),
      programmeId: prog ? prog.id : null, programmeNom: prog ? prog.nom : null,
      dureeMin: null, rpeGlobal: null, note: '', douleurs: [], exercices: []
    };
    if (prog) s.exercices = renumeroter(prog.exercices.map(exerciceSeanceDepuisProgramme));
    return s;
  }

  /* ---------- récupération ----------

     L'élastique quotidien, faible résistance, beaucoup de répétitions. Ce
     n'est pas une séance de travail et ça n'a rien à faire dans le tonnage :
     cent répétitions à l'élastique noieraient le compte de séries d'une
     semaine. C'est une ROUTINE — définie une fois — qu'on coche jour après
     jour, et ce qu'on veut en lire est la régularité, pas la charge.

     Elle réutilise la forme d'un programme, et sa journée celle d'une séance :
     ce sont les mêmes exercices, les mêmes colonnes, la même ligne de saisie.
     Seul `type: 'recup'` la distingue — ce qui suffit au journal pour la ranger
     et à seancesMuscuTriees() pour l'ignorer, donc au tonnage pour ne pas la
     voir. */

  function routineRecupVierge() {
    var p = programme('Ma routine de récupération');
    p.description = 'Élastique, faible résistance, beaucoup de répétitions. '
                  + 'À cocher chaque jour.';
    return p;
  }

  function seanceRecup(routine) {
    var s = { id: uid('re'), type: 'recup', date: aujourdHui(),
              heure: new Date().toISOString(), note: '', douleurs: [], exercices: [] };
    if (routine) {
      s.exercices = renumeroter((routine.exercices || []).map(exerciceSeanceDepuisProgramme));
    }
    return s;
  }

  function seancesRecupTriees(etat) {
    return (etat.seances || []).filter(function (s) { return s && s.type === 'recup'; })
      .sort(function (a, b) {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return String(b.heure || '').localeCompare(String(a.heure || ''));
      });
  }

  function recupDuJour(etat, date) {
    date = date || aujourdHui();
    var l = etat.seances || [];
    for (var i = 0; i < l.length; i++) {
      if (l[i] && l[i].type === 'recup' && l[i].date === date) return l[i];
    }
    return null;
  }

  /* Un jour compte comme FAIT des qu'une ligne est validee : une routine a
     moitie faite reste une journee ou l'on s'y est mis, et c'est ce qui
     entretient l'habitude. Le detail (3 sur 5) est rendu a part, pour que
     l'ecran puisse le dire sans avoir a recompter. */
  function recupFaite(se) {
    if (!se) return false;
    return (se.exercices || []).some(function (ex) {
      return (ex.series || []).some(function (s) { return s.faite; });
    });
  }

  function compteRecup(se) {
    var total = 0, faits = 0;
    (se && se.exercices || []).forEach(function (ex) {
      total += 1;
      if ((ex.series || []).some(function (s) { return s.faite; })) faits += 1;
    });
    return { faits: faits, total: total };
  }

  /* Combien de jours faits sur les N derniers, et depuis combien de jours
     d'affilee. La serie en cours ne se casse PAS parce qu'aujourd'hui n'est
     pas encore coche : on la compte depuis hier tant que la journee n'est pas
     finie — sinon elle afficherait zero chaque matin. */
  function statsRecup(etat, jours) {
    jours = jours || 7;
    var faits = {};
    seancesRecupTriees(etat).forEach(function (se) {
      if (recupFaite(se)) faits[se.date] = true;
    });

    function jourDecale(n) {
      var d = new Date();
      d.setDate(d.getDate() - n);
      var z = function (x) { return (x < 10 ? '0' : '') + x; };
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
    }

    var dans = 0;
    for (var i = 0; i < jours; i++) if (faits[jourDecale(i)]) dans += 1;

    var depart = faits[jourDecale(0)] ? 0 : 1;
    var serie = 0;
    for (var j = depart; j < 400; j++) {
      if (!faits[jourDecale(j)]) break;
      serie += 1;
    }

    return { fenetre: jours, joursFaits: dans, serie: serie,
             aujourdHuiFait: !!faits[jourDecale(0)] };
  }

  function seanceSparring() {
    return { id: uid('sp'), type: 'sparring', date: aujourdHui(), heure: new Date().toISOString(),
             club: '', dureeMin: null, rounds: null, style: '', cote: null, partenaires: '',
             technique: '', ressenti: '', note: '', douleurs: [] };
  }

  /* Séance passée -> programme. Les valeurs RÉELLES deviennent les cibles ;
     à défaut (série jamais faite), on reprend la cible d'origine. */
  function programmeDepuisSeance(seance, nom) {
    var p = programme(nom || ((seance.programmeNom || 'Séance') + ' — ' + dateCourte(seance.date)));
    p.description = 'Créé depuis la séance du ' + dateCourte(seance.date) + '.';
    p.exercices = renumeroter((seance.exercices || []).map(function (es) {
      return exerciceProgramme({
        nom: es.nom, aw: es.aw, typeCharge: es.typeCharge, colonnes: colonnes(es),
        cote: es.cote,
        forces: es.forces, structures: es.structures, outils: es.outils,
        consigne: es.consigne, reposSecondes: es.reposSecondes,
        series: (es.series || []).map(function (ss) {
          return { type: ss.type,
                   repsCible: (ss.repsReel || '').trim() || ss.repsCible || '',
                   chargeCible: (ss.chargeReel || '').trim() || ss.chargeCible || '',
                   dureeCible: (ss.dureeReel || '').trim() || ss.dureeCible || '' };
        })
      });
    }));
    return p;
  }

  function dupliquerProgramme(p, nom) {
    var c = programme(nom || (p.nom + ' (copie)'));
    c.description = p.description;
    c.exercices = renumeroter(p.exercices.map(function (ep) { return exerciceProgramme(ep); }));
    return c;
  }

  /* ---------- volume ---------- */

  /* Le volume compte ce qui a été FAIT, jamais ce qui était prévu : une séance
     ouverte et pas encore commencée affiche 0, pas le tonnage du programme.
     Une série compte dès qu'elle porte une valeur saisie ou le ✓ (qui fige la
     cible en valeur réelle). On ne lit que les champs réels — une cible seule
     ne pèse rien.

     Une série non chiffrée (N3, élastique, poids du corps) n'est pas du zéro :
     elle est comptée à part et l'écran le dit. */
  /* Duree reelle d'une seance, deduite des horodatages de validation.
     C'est l'emploi de faiteA, qui etait ecrit sans jamais etre lu.
     Rend null tant qu'il n'y a pas DEUX series validees : une seule ne borne
     aucun intervalle, et un zero serait un mensonge. */
  function dureeReelle(seance) {
    var t = [];
    (seance.exercices || []).forEach(function (ex) {
      (ex.series || []).forEach(function (s) {
        if (s.faite && s.faiteA) {
          var d = Date.parse(s.faiteA);
          if (isFinite(d)) t.push(d);
        }
      });
    });
    if (t.length < 2) return null;
    t.sort(function (a, b) { return a - b; });
    return Math.max(1, Math.round((t[t.length - 1] - t[0]) / 60000));
  }

  function volumeSeance(seance) {
    var r = { series: 0, seriesFaites: 0, tonnage: 0, tonnageAw: 0, tonnageGeneral: 0,
              seriesNonChiffrees: 0, seriesIncompletes: 0, seriesSansTonnage: 0,
              seriesAw: 0, repsTotal: 0,
              tempsSousTension: 0, tempsSousTensionAw: 0, seriesDuree: 0 };
    (seance.exercices || []).forEach(function (ex) {
      var tc = typeCharge(ex.typeCharge);
      /* On ne lit QUE les colonnes affichees : une valeur restee dans un champ
         qu'on a ensuite masque ne doit pas continuer a compter en silence. */
      var aCharge = aColonne(ex, 'charge'),
          aReps   = aColonne(ex, 'reps'),
          aDuree  = aColonne(ex, 'duree');
      (ex.series || []).forEach(function (s) {
        r.series += 1;
        if (ex.aw) r.seriesAw += 1;
        if (s.faite) r.seriesFaites += 1;

        var cTxt = aCharge ? (s.chargeReel || '').trim() : '';
        var rTxt = aReps   ? (s.repsReel   || '').trim() : '';
        var dTxt = aDuree  ? (s.dureeReel  || '').trim() : '';
        if (!s.faite && !cTxt && !rTxt && !dTxt) return;   // rien de fait, rien à compter

        var ch = nombre(cTxt), rp = nombre(rTxt), dr = secondes(dTxt);
        if (rp != null) r.repsTotal += rp;

        /* Le temps sous tension se compte toujours, quel que soit le tonnage :
           c'est l'autre façon de charger un tendon, et la seule que mesure un
           isométrique. */
        if (dr != null) {
          r.tempsSousTension += dr;
          if (ex.aw) r.tempsSousTensionAw += dr;
          r.seriesDuree += 1;
        }

        if (tc.tonnage && aCharge && aReps && ch != null && rp != null) {
          var t = ch * rp;
          r.tonnage += t;
          if (ex.aw) r.tonnageAw += t; else r.tonnageGeneral += t;
        } else if (!aCharge || !aReps) {
          /* Le tonnage est charge × reps : sans les deux colonnes, il n'y a
             rien à multiplier, et ce n'est PAS une saisie manquante. Une série
             qui porte une durée est déjà comptée en temps sous tension — la
             signaler ici serait du bruit sur chaque isométrique. */
          if (dr == null) r.seriesSansTonnage += 1;
        } else if (!tc.tonnage || (cTxt && ch == null)) {
          /* N3, une bande rouge, le poids du corps : la charge N'EST PAS un
             nombre, et ce n'est pas un défaut de saisie. */
          r.seriesNonChiffrees += 1;
        } else {
          /* Type chiffré, deux colonnes affichées, mais une valeur manque. */
          r.seriesIncompletes += 1;
        }
      });
    });
    return r;
  }

  /* Dire ce qui n'est PAS dans le tonnage, et pourquoi. Un zéro muet ferait
     croire à une séance vide ; c'est le piège qu'on refuse ici. */
  function texteHorsTonnage(v) {
    var bouts = [];
    if (v.seriesNonChiffrees) {
      bouts.push(v.seriesNonChiffrees + (v.seriesNonChiffrees > 1 ? ' séries' : ' série')
        + ' à charge non chiffrée (gripper, élastique, poids du corps) — '
        + (v.seriesNonChiffrees > 1 ? 'comptées' : 'comptée') + ' en séries, pas en kilos.');
    }
    if (v.seriesIncompletes) {
      bouts.push(v.seriesIncompletes + (v.seriesIncompletes > 1 ? ' séries incomplètes' : ' série incomplète')
        + ' : il manque la charge ou les reps.');
    }
    if (v.seriesSansTonnage) {
      bouts.push(v.seriesSansTonnage + (v.seriesSansTonnage > 1 ? ' séries' : ' série')
        + ' sur un exercice sans charge ni reps — rien à multiplier, et rien de saisi non plus.');
    }
    return bouts.join(' ');
  }

  /* Ce qu'une serie DIT, en une ligne. Le journal et l'historique le
     demandaient chacun de leur cote, et chacun supposait deux colonnes :
     « 20 × 45 » pour un gainage de 45 secondes, ou « 45 × — » une fois les
     secondes deplacees. On ne montre que les colonnes AFFICHEES par
     l'exercice, et rien d'autre.

     `court` sert aux listes serrees du journal, ou chaque serie n'a que
     quelques caracteres ; la forme longue porte l'unite. */
  function texteSerie(exo, s, court) {
    if (!s) return '';
    var cols = colonnes(exo), tc = typeCharge(exo && exo.typeCharge);
    var vide = '—';
    var aC = cols.indexOf('charge') >= 0, aR = cols.indexOf('reps') >= 0,
        aD = cols.indexOf('duree') >= 0;
    var ch = aC ? (s.chargeReel || '').trim() : '',
        rp = aR ? (s.repsReel || '').trim() : '',
        dr = aD ? (s.dureeReel || '').trim() : '';
    var bouts = [];

    if (aC && aR) {
      bouts.push((ch || vide) + (court ? '×' : ' × ') + (rp || vide)
               + (!court && ch && tc.id === 'kg' ? ' kg' : ''));
    } else if (aC) {
      bouts.push((ch || vide) + (!court && ch && tc.unite ? ' ' + tc.unite : ''));
    } else if (aR) {
      bouts.push((rp || vide) + (court ? '' : ' reps'));
    }
    if (aD) bouts.push(dr ? (texteDuree(secondes(dr)) || dr) : vide);

    return bouts.join(court ? ' ' : ' · ');
  }

  /* Le temps sous tension, dit comme le tonnage : un chiffre, et ce qu'il
     recouvre. Rend '' quand il n'y a rien — jamais « 0 s », qui ferait croire
     a une seance ou l'on n'a rien tenu alors qu'on n'a simplement rien chronometre. */
  function texteTempsSousTension(v) {
    if (!v.tempsSousTension) return '';
    return texteDuree(v.tempsSousTension) + ' sous tension'
         + (v.seriesDuree ? ' · ' + v.seriesDuree + (v.seriesDuree > 1 ? ' séries' : ' série') : '');
  }

  /* ---------- colonne PRÉCÉDENT ---------- */

  function seancesMuscuTriees(etat) {
    return etat.seances.filter(function (s) { return s.type === 'muscu'; })
      .sort(function (a, b) {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return String(b.heure || '').localeCompare(String(a.heure || ''));
      });
  }

  /* Rang d'une serie PARMI CELLES DE SON TYPE : la 2e serie de travail reste la
     2e serie de travail, qu'il y ait eu zero ou trois degressives avant elle.

     C'est la correction d'un defaut mesure : l'indexation par rang brut faisait
     glisser TOUTE la colonne d'un cran des qu'une serie d'un autre type etait
     inseree, et
     affichait des valeurs fausses mais plausibles — donc suivies. */
  function rangParType(series, index) {
    var s = series[index];
    if (!s) return -1;
    var n = 0;
    for (var i = 0; i < index; i++) if (series[i].type === s.type) n += 1;
    return n;
  }

  function serieAuRangParType(series, type, rang) {
    var n = 0;
    for (var i = 0; i < series.length; i++) {
      if (series[i].type !== type) continue;
      if (n === rang) return series[i];
      n += 1;
    }
    return null;
  }

  /* Ce que j'ai fait sur CETTE série de CET exercice la dernière fois, quel que soit
     le programme. On prend la séance la plus récente (hors celle-ci) qui contient
     l'exercice ; on y lit la série de même TYPE et de même rang dans son type.
     Pas de remontée plus loin : la colonne doit être prévisible, pas « la
     meilleure valeur trouvée ». */
  function dernierePerf(etat, exoSlug, type, rangDansType, exclureSeanceId) {
    if (!exoSlug) return null;
    var liste = seancesMuscuTriees(etat);
    for (var i = 0; i < liste.length; i++) {
      var se = liste[i];
      if (se.id === exclureSeanceId) continue;
      for (var j = 0; j < se.exercices.length; j++) {
        var ex = se.exercices[j];
        if (ex.slug !== exoSlug) continue;
        var s = serieAuRangParType(ex.series || [], type, rangDansType);
        if (!s) return null;
        var c = (s.chargeReel || '').trim(), r = (s.repsReel || '').trim(),
            d = (s.dureeReel || '').trim();
        if (!c && !r && !d) return null;
        return { charge: c, reps: r, duree: d, date: se.date,
                 typeCharge: ex.typeCharge, colonnes: colonnes(ex), rpe: s.rpe };
      }
    }
    return null;
  }

  /* « 20 × 12 », « 45 s », « 20 × 12 · 45 s » : on ne montre que ce qui a ete
     saisi. Le bouton est etroit — coller une duree a un couple charge/reps le
     fait deborder — mais il vaut mieux une ligne dense qu'une valeur cachee. */
  function texteDernierePerf(p) {
    if (!p) return '';
    var bouts = [];
    if (p.charge && p.reps) bouts.push(p.charge + ' × ' + p.reps);
    else if (p.charge || p.reps) bouts.push(p.charge || p.reps);
    if (p.duree) bouts.push(texteDuree(secondes(p.duree)) || p.duree);
    return bouts.join(' · ');
  }

  /* ---------- suivi ---------- */

  function toutesSeancesTriees(etat) {
    return etat.seances.slice().sort(function (a, b) {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return String(b.heure || '').localeCompare(String(a.heure || ''));
    });
  }

  /* Dernière fois que chaque exercice a été fait, et il y a combien de jours.
     C'est la matière du raisonnement 48–72 h : l'app montre, elle ne décide pas. */
  function derniereSollicitation(etat) {
    var par = {};
    seancesMuscuTriees(etat).forEach(function (se) {
      (se.exercices || []).forEach(function (ex) {
        if (!ex.slug) return;
        var faites = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!faites) return;
        if (!par[ex.slug] || par[ex.slug].date < se.date) {
          par[ex.slug] = { slug: ex.slug, nom: ex.nom, aw: ex.aw, forces: ex.forces || [],
                           date: se.date, series: faites };
        }
      });
    });
    return Object.keys(par).map(function (k) {
      par[k].jours = joursDepuis(par[k].date);
      return par[k];
    }).sort(function (a, b) { return a.jours - b.jours; });
  }

  /* Derniere fois que chaque STRUCTURE a ete chargee, et combien de series.
     Repond a la question que la liste par exercice ne sait pas traiter :
     « quand ai-je charge lourd le medial », toutes origines confondues. */
  /* Quand chaque structure a-t-elle ete chargee, ET DE QUEL COTE.

     Une charge portee « des deux » compte des DEUX cotes : ce n'est pas un
     troisieme cote, c'est un exercice qui sollicite les deux bras. Un
     exercice sans cote renseigne tombe dans son propre seau, nomme — on ne
     le repartit pas au hasard, et on ne le jette pas non plus.

     Rendu : une ligne par (structure, cote) REELLEMENT chargee, plus la
     liste des structures jamais touchees. L'ecran decide ensuite s'il
     mentionne le cote — inutile tant que le carnet n'en porte aucun. */
  function derniereSollicitationStructure(etat) {
    var par = {}, ordre = [];

    function poser(st, cote, date, nom, faites) {
      var cle = st + '|' + cote;
      if (!par[cle]) {
        par[cle] = { structure: st, cote: cote, date: date, series: 0, exercices: [] };
        ordre.push(cle);
      }
      var e = par[cle];
      if (date > e.date) { e.date = date; e.series = 0; e.exercices = []; }
      if (date === e.date) {
        e.series += faites;
        if (e.exercices.indexOf(nom) < 0) e.exercices.push(nom);
      }
    }

    seancesMuscuTriees(etat).forEach(function (se) {
      (se.exercices || []).forEach(function (ex) {
        var faites = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!faites) return;
        var cotes = cotesCouverts(ex.cote);
        if (!cotes.length) cotes = [COTE_INCONNU];
        (ex.structures || []).forEach(function (st) {
          cotes.forEach(function (c) { poser(st, c, se.date, ex.nom, faites); });
        });
      });
    });

    var lignes = ordre.map(function (cle) {
      var e = par[cle];
      return { structure: e.structure, nom: nomStructure(e.structure),
               cote: e.cote, nomCote: e.cote === COTE_INCONNU ? null : nomCote(e.cote),
               date: e.date, jours: joursDepuis(e.date),
               series: e.series, exercices: e.exercices };
    });

    var touchees = {};
    lignes.forEach(function (l) { touchees[l.structure] = true; });
    var jamais = STRUCTURES.filter(function (s) { return !touchees[s.id]; })
      .map(function (s) { return { structure: s.id, nom: s.nom }; });

    return { lignes: lignes, jamais: jamais };
  }

  /* Series validees par structure sur une fenetre, pour voir la repartition. */
  /* Le meme compte, mais sur une fenetre, et ventile par cote. `parStructure`
     reste le total toutes origines confondues — c'est lui qui repond a
     « ai-je neglige l'avant-bras » ; `parCote` repond a « de quel bras ». */
  function chargeParStructure(etat, depuisJours) {
    var c = {}, parCote = {}, total = 0;
    STRUCTURES.forEach(function (s) { c[s.id] = 0; });
    seancesMuscuTriees(etat).forEach(function (se) {
      if (depuisJours != null && joursDepuis(se.date) > depuisJours) return;
      (se.exercices || []).forEach(function (ex) {
        var n = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!n) return;
        var cotes = cotesCouverts(ex.cote);
        if (!cotes.length) cotes = [COTE_INCONNU];
        (ex.structures || []).forEach(function (st) {
          if (c[st] == null) return;
          c[st] += n;
          total += n;
          cotes.forEach(function (k) {
            var cle = st + '|' + k;
            parCote[cle] = (parCote[cle] || 0) + n;
          });
        });
      });
    });
    return { parStructure: c, parCote: parCote, total: total };
  }

  /* Ce qui a charge un cote donne d'une structure, dans une liste de seances.
     C'est la brique du recoupement : une douleur au medial DROIT doit se
     croiser avec ce qui a charge le medial droit, pas avec l'autre bras.
     Un exercice sans cote renseigne est rendu a part, parce qu'il pourrait
     etre en cause sans qu'on puisse le dire. */
  function exercicesAyantCharge(seances, structure, cote) {
    var surLeCote = [], sansCote = [];
    (seances || []).forEach(function (se) {
      if (!se || se.type !== 'muscu') return;
      (se.exercices || []).forEach(function (ex) {
        if (!(ex.series || []).some(function (s) { return s.faite; })) return;
        if (structure && (ex.structures || []).indexOf(structure) < 0) return;
        var cotes = cotesCouverts(ex.cote);
        if (!cotes.length) { sansCote.push(ex.nom); return; }
        if (!cote || cotes.indexOf(cote) >= 0) surLeCote.push(ex.nom);
      });
    });
    return { surLeCote: surLeCote, sansCote: sansCote };
  }

  function zoneDelai(jours) {
    if (jours < 2) return 'chaud';   // < 48 h
    if (jours < 3) return 'tiede';   // 48–72 h
    return 'froid';
  }

  /* Tout ce qui a été fait dans les N heures précédant une date donnée.
     C'est ce qui permet de relier une douleur à la charge qui l'a précédée. */
  function fenetreAvant(etat, dateIso, heures, exclureId) {
    var jours = Math.ceil(heures / 24);
    return toutesSeancesTriees(etat).filter(function (s) {
      if (s.id === exclureId) return false;
      var d = joursEntre(s.date, dateIso);
      return d >= 0 && d <= jours;
    });
  }

  function episodesDouleur(etat) {
    return toutesSeancesTriees(etat).filter(function (s) {
      return zonesVives(s.douleurs).length > 0;
    });
  }

  /* Evolution d'une zone dans le temps : c'est la pente qui renseigne, pas un
     releve isole. Rendu du plus ancien au plus recent pour se lire comme une
     courbe. Une intensite inconnue (carnet d'avant) est gardee a null et
     signalee, jamais remplacee par un chiffre invente. */
  function suiviZone(etat, zone, nbMax) {
    var l = [];
    toutesSeancesTriees(etat).forEach(function (se) {
      var d = zonesVives(se.douleurs).filter(function (x) { return x.zone === zone; })[0];
      if (!d) return;
      l.push({ date: se.date, intensite: d.intensite, type: se.type,
               quoi: se.type === 'sparring' ? 'sparring' : (se.programmeNom || 'séance libre') });
    });
    l.reverse();
    return nbMax ? l.slice(-nbMax) : l;
  }

  /* Toutes les zones ayant fait mal au moins une fois, la plus recente d'abord. */
  function zonesRencontrees(etat) {
    var vues = {}, ordre = [];
    toutesSeancesTriees(etat).forEach(function (se) {
      zonesVives(se.douleurs).forEach(function (d) {
        if (!vues[d.zone]) { vues[d.zone] = 1; ordre.push(d.zone); }
      });
    });
    return ordre;
  }

  /* Tout ce qu'un exercice a donne, seance par seance, du plus recent au plus
     ancien. PRECEDENT ne montre que la fois d'avant ; ceci montre la pente. */
  function historiqueExercice(etat, exoSlug) {
    var sorties = [];
    seancesMuscuTriees(etat).forEach(function (se) {
      (se.exercices || []).forEach(function (ex) {
        if (ex.slug !== exoSlug) return;
        var faites = (ex.series || []).filter(function (s) { return s.faite; });
        if (!faites.length) return;
        var tonnage = 0, chiffrees = 0, meilleure = null, repsTotal = 0, tst = 0;
        var peut = peutPeser(ex), aD = aColonne(ex, 'duree');
        faites.forEach(function (s) {
          var ch = nombre(s.chargeReel), rp = nombre(s.repsReel);
          var dr = aD ? secondes(s.dureeReel) : null;
          if (rp != null) repsTotal += rp;
          if (dr != null) tst += dr;
          if (peut && ch != null && rp != null) {
            tonnage += ch * rp;
            chiffrees += 1;
            if (!meilleure || ch > meilleure.charge || (ch === meilleure.charge && rp > meilleure.reps)) {
              meilleure = { charge: ch, reps: rp };
            }
          }
        });
        sorties.push({
          seanceId: se.id, date: se.date,
          programme: se.programmeNom || 'séance libre',
          series: faites.length, repsTotal: repsTotal,
          tonnage: chiffrees ? tonnage : null,
          tempsSousTension: tst || null,
          colonnes: colonnes(ex),
          meilleure: meilleure,
          typeCharge: ex.typeCharge,
          detail: faites.map(function (s) {
            return { type: s.type, rpe: s.rpe, texte: texteSerie(ex, s, true),
                     charge: s.chargeReel, reps: s.repsReel, duree: s.dureeReel };
          })
        });
      });
    });
    return sorties;
  }

  /* Exercices connus par l'historique, le plus recemment pratique d'abord. */
  function exercicesPratiques(etat) {
    var par = {}, ordre = [];
    seancesMuscuTriees(etat).forEach(function (se) {
      (se.exercices || []).forEach(function (ex) {
        if (!ex.slug) return;
        if (!(ex.series || []).some(function (s) { return s.faite; })) return;
        if (!par[ex.slug]) {
          par[ex.slug] = { slug: ex.slug, nom: ex.nom, aw: ex.aw, typeCharge: ex.typeCharge,
                           derniere: se.date, seances: 0 };
          ordre.push(ex.slug);
        }
        par[ex.slug].seances += 1;
      });
    });
    return ordre.map(function (s) { return par[s]; });
  }

  function semaineDe(iso) {
    var d = dateObjet(iso);
    var j = (d.getDay() + 6) % 7;            // lundi = 0
    d.setDate(d.getDate() - j);
    var z = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }

  function volumeParSemaine(etat, nbSemaines) {
    var par = {}, ordre = [];
    var limite = nbSemaines || 8;
    seancesMuscuTriees(etat).forEach(function (se) {
      var sem = semaineDe(se.date);
      if (!par[sem]) {
        par[sem] = { semaine: sem, aw: 0, general: 0, series: 0, seances: 0, tempsSousTension: 0 };
        ordre.push(sem);
      }
      var v = volumeSeance(se);
      par[sem].aw += v.tonnageAw;
      par[sem].general += v.tonnageGeneral;
      par[sem].series += v.series;
      par[sem].tempsSousTension += v.tempsSousTension;
      par[sem].seances += 1;
    });
    return ordre.sort().slice(-limite).map(function (s) { return par[s]; }).reverse();
  }

  function repartitionForces(etat, depuisJours) {
    var c = {}, total = 0;
    FORCES.forEach(function (f) { c[f.id] = 0; });
    seancesMuscuTriees(etat).forEach(function (se) {
      if (depuisJours != null && joursDepuis(se.date) > depuisJours) return;
      (se.exercices || []).forEach(function (ex) {
        var n = (ex.series || []).filter(function (s) { return s.faite; }).length;
        if (!n) return;
        (ex.forces || []).forEach(function (f) {
          if (c[f] != null) { c[f] += n; total += n; }
        });
      });
    });
    return { parForce: c, total: total };
  }

  A.m = {
    TYPES_SERIE: TYPES_SERIE, ORDRE_TYPES: ORDRE_TYPES, TYPES_CHARGE: TYPES_CHARGE,
    FORCES: FORCES, ZONES: ZONES, STYLES: STYLES, STRUCTURES: STRUCTURES,
    COTES: COTES, COTE_INCONNU: COTE_INCONNU,
    coteValide: coteValide, nomCote: nomCote, courtCote: courtCote,
    cotesCouverts: cotesCouverts,
    COLONNES: COLONNES, COLONNES_DEFAUT: COLONNES_DEFAUT,
    uid: uid, slug: slug, nombre: nombre, fmt: fmt,
    secondes: secondes, texteDuree: texteDuree,
    colonnes: colonnes, colonne: colonne, aColonne: aColonne,
    peutPeser: peutPeser, migrer: migrer,
    typeCharge: typeCharge, nomZone: nomZone, nomForce: nomForce, nomStyle: nomStyle,
    nomStructure: nomStructure,
    normaliserDouleurs: normaliserDouleurs, zonesDe: zonesDe, zonesVives: zonesVives,
    intensiteDe: intensiteDe, texteDouleur: texteDouleur,
    suiviZone: suiviZone, zonesRencontrees: zonesRencontrees,
    rangParType: rangParType, serieAuRangParType: serieAuRangParType,
    dureeReelle: dureeReelle,
    derniereSollicitationStructure: derniereSollicitationStructure,
    chargeParStructure: chargeParStructure, exercicesAyantCharge: exercicesAyantCharge,
    historiqueExercice: historiqueExercice, exercicesPratiques: exercicesPratiques,
    aujourdHui: aujourdHui, maintenant: maintenant,
    dateCourte: dateCourte, jourSemaine: jourSemaine,
    joursDepuis: joursDepuis, joursEntre: joursEntre, semaineDe: semaineDe,
    trouverCatalogue: trouverCatalogue, majCatalogue: majCatalogue, suggestions: suggestions,
    trouverOutil: trouverOutil, majCatalogueOutils: majCatalogueOutils, suggestionsOutils: suggestionsOutils,
    categoriesOutils: categoriesOutils, outilsParCategorie: outilsParCategorie, SANS_CATEGORIE: SANS_CATEGORIE,
    serieProgramme: serieProgramme, exerciceProgramme: exerciceProgramme, programme: programme,
    renumeroter: renumeroter,
    seanceMuscu: seanceMuscu, seanceSparring: seanceSparring,
    routineRecupVierge: routineRecupVierge, seanceRecup: seanceRecup,
    seancesRecupTriees: seancesRecupTriees, recupDuJour: recupDuJour,
    recupFaite: recupFaite, compteRecup: compteRecup, statsRecup: statsRecup,
    exerciceSeanceVierge: exerciceSeanceVierge, serieSeanceVierge: serieSeanceVierge,
    programmeDepuisSeance: programmeDepuisSeance, dupliquerProgramme: dupliquerProgramme,
    volumeSeance: volumeSeance, texteHorsTonnage: texteHorsTonnage,
    texteSerie: texteSerie,
    texteTempsSousTension: texteTempsSousTension,
    seancesMuscuTriees: seancesMuscuTriees, toutesSeancesTriees: toutesSeancesTriees,
    dernierePerf: dernierePerf, texteDernierePerf: texteDernierePerf,
    derniereSollicitation: derniereSollicitation, zoneDelai: zoneDelai,
    fenetreAvant: fenetreAvant, episodesDouleur: episodesDouleur,
    volumeParSemaine: volumeParSemaine, repartitionForces: repartitionForces
  };
})(window.App || (window.App = {}));
