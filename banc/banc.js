/* Banc de recette.

   Chaque contrôle porte une intention écrite. Un contrôle qui ne peut pas
   TOMBER ne prouve rien : ceux qui mesurent un invariant du décor plutôt
   qu'un comportement portent `[temoin]` et disent pourquoi ils tiennent.

   Le banc n'écrit jamais dans le stockage : il travaille sur des états
   fabriqués, passés en argument aux fonctions du modèle. */
(function (A) {
  'use strict';

  var cas = [];
  function bloc(nom, f) { cas.push({ bloc: nom, f: f }); }

  /* ---------- petites fabriques d'état, pour que les cas se lisent ---------- */

  function serie(type, charge, reps, extra) {
    var s = { id: A.m.uid('s'), type: type, repsCible: '', chargeCible: '',
              chargeReel: charge == null ? '' : String(charge),
              repsReel: reps == null ? '' : String(reps),
              rpe: null, faite: true, faiteA: null };
    if (extra) for (var k in extra) s[k] = extra[k];
    return s;
  }

  function exo(nom, series, opts) {
    opts = opts || {};
    return { id: A.m.uid('e'), ordre: 0, nom: nom, slug: A.m.slug(nom),
             aw: !!opts.aw, typeCharge: opts.typeCharge || 'kg',
             forces: opts.forces || [], structures: opts.structures || [],
             outils: opts.outils || [], consigne: '', reposSecondes: 90,
             series: series };
  }

  function seance(date, exercices, opts) {
    opts = opts || {};
    return { id: opts.id || A.m.uid('se'), type: 'muscu', date: date,
             heure: date + 'T18:00:00.000Z', programmeId: null,
             programmeNom: opts.programmeNom || 'P',
             dureeMin: opts.dureeMin == null ? null : opts.dureeMin,
             rpeGlobal: null, note: '', douleurs: opts.douleurs || [],
             exercices: exercices };
  }

  function etatAvec(seances, extra) {
    var e = A.store.vide();
    e.seances = seances || [];
    if (extra) for (var k in extra) e[k] = extra[k];
    return e;
  }

  function jourIlYA(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    var z = function (x) { return (x < 10 ? '0' : '') + x; };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }

  /* ================================================================
     1. Lecture des nombres — la charge n'est pas toujours un nombre
     ================================================================ */

  bloc('Nombres et identité', function (v) {
    v.egal(A.m.nombre('17,5'), 17.5, 'la virgule décimale est lue');
    v.egal(A.m.nombre('25'), 25, 'un entier est lu');
    v.egal(A.m.nombre('N3'), null, 'un niveau de gripper n’est PAS un nombre');
    v.egal(A.m.nombre('élastique rouge'), null, 'une couleur n’est pas un nombre');
    v.egal(A.m.nombre(''), null, 'le vide n’est pas zéro');
    v.egal(A.m.nombre('  '), null, 'les espaces seuls ne sont pas zéro');
    v.egal(A.m.nombre('12kg'), null, 'une unité collée invalide la lecture, au lieu de tronquer');

    v.egal(A.m.slug('Curl marteau FAT GRIP'), 'curl marteau fat grip', 'le slug ignore la casse');
    v.egal(A.m.slug('Élévation latérale'), 'elevation laterale', 'le slug ignore les accents');
    v.egal(A.m.slug('  double   espace '), 'double espace', 'le slug compacte les espaces');
    v.egal(A.m.slug('Curl — marteau'), 'curl marteau', 'la ponctuation devient séparateur');
  });

  /* ================================================================
     2. PRÉCÉDENT — le défaut mesuré, et sa correction
     ================================================================ */

  bloc('Colonne PRÉCÉDENT', function (v) {
    /* La semaine d'avant : trois séries de travail, rien d'autre. */
    var e = etatAvec([
      seance('2026-10-14', [exo('Curl', [
        serie('normale', 20, 12), serie('normale', 22, 10), serie('normale', 24, 8)
      ])], { id: 'A' })
    ]);

    /* Aujourd'hui, j'insère une dégressive en tête. Les séries de travail
       restent la 1re, la 2e et la 3e SÉRIE DE TRAVAIL. */
    var auj = [serie('degressive', 10, 20), serie('normale', 0, 0),
               serie('normale', 0, 0), serie('normale', 0, 0)];

    function precedentDe(i) {
      return A.m.texteDernierePerf(
        A.m.dernierePerf(e, 'curl', auj[i].type, A.m.rangParType(auj, i), 'B'));
    }

    v.egal(precedentDe(1), '20 × 12', 'la 1re série de travail retrouve la 1re série de travail');
    v.egal(precedentDe(2), '22 × 10', 'la 2e retrouve la 2e, malgré la dégressive insérée');
    v.egal(precedentDe(3), '24 × 8', 'la 3e retrouve la 3e');
    v.egal(precedentDe(0), '', 'une série d’un autre type ne reprend pas une série de travail');

    /* Et sans la dégressive, rien ne doit bouger. */
    var sans = [serie('normale', 0, 0), serie('normale', 0, 0), serie('normale', 0, 0)];
    v.egal(A.m.texteDernierePerf(A.m.dernierePerf(e, 'curl', 'normale', A.m.rangParType(sans, 0), 'B')),
           '20 × 12', 'sans mélange de types, l’alignement est inchangé');

    v.egal(A.m.rangParType(auj, 3), 2, 'le rang par type ignore les séries d’un autre type');
    v.egal(A.m.rangParType(sans, 2), 2, 'sans mélange, rang par type = rang brut');

    /* Traverser les programmes : c'est le slug qui fait l'identité. */
    var e2 = etatAvec([
      seance('2026-10-10', [exo('Curl', [serie('normale', 18, 14)])],
             { id: 'C', programmeNom: 'Autre programme' })
    ]);
    v.egal(A.m.texteDernierePerf(A.m.dernierePerf(e2, 'curl', 'normale', 0, 'X')),
           '18 × 14', 'PRÉCÉDENT traverse les programmes');

    /* Une série vide ne doit pas être proposée comme repère. */
    var e3 = etatAvec([seance('2026-10-12', [exo('Curl', [serie('normale', '', '')])], { id: 'D' })]);
    v.egal(A.m.dernierePerf(e3, 'curl', 'normale', 0, 'X'), null,
           'une série sans valeur ne devient pas un précédent');

    /* La charge non chiffrée est un précédent parfaitement valide. */
    var e4 = etatAvec([seance('2026-10-12', [exo('Gripper', [serie('normale', 'N3', 6)],
                       { typeCharge: 'niveau' })], { id: 'E' })]);
    v.egal(A.m.texteDernierePerf(A.m.dernierePerf(e4, 'gripper', 'normale', 0, 'X')),
           'N3 × 6', 'un gripper a un précédent comme les autres');
  });

  /* ================================================================
     3. Volume — ce qui est FAIT, jamais ce qui est prévu
     ================================================================ */

  bloc('Volume', function (v) {
    var planifiee = seance('2026-10-20', [{
      id: 'x', ordre: 0, nom: 'Curl', slug: 'curl', aw: false, typeCharge: 'kg',
      forces: [], structures: [], outils: [], consigne: '', reposSecondes: 90,
      series: [
        { id: 's1', type: 'normale', repsCible: '12', chargeCible: '20',
          repsReel: '', chargeReel: '', rpe: null, faite: false, faiteA: null }
      ]
    }]);
    var vp = A.m.volumeSeance(planifiee);
    v.egal(vp.tonnage, 0, 'une séance ouverte et pas commencée pèse ZÉRO, pas le tonnage prévu');
    v.egal(vp.series, 1, 'la série planifiée est quand même comptée comme série');
    v.egal(vp.seriesFaites, 0, 'aucune n’est faite');

    var faite = seance('2026-10-20', [exo('Curl', [serie('normale', 20, 12)])]);
    v.egal(A.m.volumeSeance(faite).tonnage, 240, '20 × 12 = 240');

    var aw = seance('2026-10-20', [
      exo('Curl AW', [serie('normale', 20, 10)], { aw: true }),
      exo('Squat', [serie('normale', 100, 5)], { aw: false })
    ]);
    var va = A.m.volumeSeance(aw);
    v.egal(va.tonnageAw, 200, 'le volume AW est compté à part');
    v.egal(va.tonnageGeneral, 500, 'la muscu générale aussi');
    v.egal(va.tonnage, 700, 'et le total est la somme des deux');
    v.egal(va.seriesAw, 1, 'les séries AW sont comptées');

    var gripper = seance('2026-10-20', [
      exo('Gripper', [serie('normale', 'N3', 6), serie('normale', 'N3', 5)], { typeCharge: 'niveau' })
    ]);
    var vg = A.m.volumeSeance(gripper);
    v.egal(vg.tonnage, 0, 'un gripper ne produit pas de tonnage');
    v.egal(vg.seriesNonChiffrees, 2, 'il est compté en séries NON CHIFFRÉES, pas perdu');
    v.egal(vg.seriesIncompletes, 0, 'et ce n’est PAS une saisie incomplète');
    v.vrai(/non chiffr/.test(A.m.texteHorsTonnage(vg)), 'le texte le dit en toutes lettres');

    var moitie = seance('2026-10-20', [exo('Curl', [serie('normale', 20, '')])]);
    var vm = A.m.volumeSeance(moitie);
    v.egal(vm.seriesIncompletes, 1, 'charge sans reps = saisie INCOMPLÈTE');
    v.egal(vm.seriesNonChiffrees, 0, 'et non « charge non chiffrée » : les deux cas sont distincts');
    v.vrai(/incompl/.test(A.m.texteHorsTonnage(vm)), 'le texte distingue bien les deux');

    v.egal(A.m.volumeSeance(seance('2026-10-20', [])).tonnage, 0,
           '[temoin] une séance sans exercice pèse zéro — il n’y a rien à additionner');
  });

  /* ================================================================
     4. Programme → séance : une COPIE, jamais une référence
     ================================================================ */

  bloc('Programme et séance', function (v) {
    var p = A.m.programme('Mercredi');
    var ep = A.m.exerciceProgramme({
      nom: 'Curl', aw: true, typeCharge: 'kg', outils: ['Fat grip'],
      structures: ['coude_medial'], consigne: 'Tenue 3 s', reposSecondes: 150,
      series: [{ type: 'normale', repsCible: '12', chargeCible: '20' }]
    });
    p.exercices = [ep];

    var s = A.m.seanceMuscu(p);
    v.egal(s.exercices.length, 1, 'l’exercice est copié dans la séance');
    v.egal(s.exercices[0].series.length, 1, 'ses séries planifiées aussi');
    v.egal(s.exercices[0].series[0].chargeCible, '20', 'la charge cible est reportée');
    v.egal(s.exercices[0].series[0].chargeReel, '', 'la valeur réelle démarre vide');
    v.egal(s.exercices[0].consigne, 'Tenue 3 s', 'la consigne suit');
    v.egal(s.exercices[0].reposSecondes, 150, 'le repos suit');
    v.egal(s.exercices[0].outils[0], 'Fat grip', 'les outils suivent');
    v.egal(s.exercices[0].structures[0], 'coude_medial', 'les structures suivent');
    v.egal(s.programmeNom, 'Mercredi', 'le nom du programme est FIGÉ dans la séance');

    /* Le point qui a fait capoter les essais précédents. */
    p.exercices[0].nom = 'Curl modifié';
    p.exercices[0].series[0].chargeCible = '999';
    v.egal(s.exercices[0].nom, 'Curl', 'modifier le programme ne renomme PAS la séance déjà créée');
    v.egal(s.exercices[0].series[0].chargeCible, '20', 'ni ne réécrit ses cibles');

    p.exercices[0].series.push(A.m.serieProgramme({}));
    v.egal(s.exercices[0].series.length, 1, 'ni n’ajoute de série à l’historique');

    /* Et le retour : une séance devient un programme. */
    var sFaite = seance('2026-10-20', [exo('Curl', [serie('normale', 25, 9)], { aw: true })]);
    var p2 = A.m.programmeDepuisSeance(sFaite, 'Repris');
    v.egal(p2.exercices[0].series[0].chargeCible, '25', 'la valeur RÉELLE devient la cible');
    v.egal(p2.exercices[0].series[0].repsCible, '9', 'reps comprises');
    v.vrai(p2.exercices[0].aw, 'le marqueur AW suit');

    var copie = A.m.dupliquerProgramme(p, 'Copie');
    copie.exercices[0].nom = 'Autre';
    v.egal(p.exercices[0].nom, 'Curl modifié', 'dupliquer ne lie pas les deux programmes');
  });

  /* ================================================================
     5. Douleurs — zone, intensité, et les carnets d'avant
     ================================================================ */

  bloc('Douleurs', function (v) {
    var ancien = A.m.normaliserDouleurs(['coude_medial', 'poignet']);
    v.egal(ancien.length, 2, 'un carnet d’avant (liste de chaînes) se relit');
    v.egal(ancien[0].zone, 'coude_medial', 'la zone est conservée');
    v.egal(ancien[0].intensite, null, 'l’intensité inconnue reste null, elle n’est PAS inventée');

    var neuf = A.m.normaliserDouleurs([{ zone: 'poignet', intensite: 7 }]);
    v.egal(neuf[0].intensite, 7, 'une intensité renseignée est gardée');

    v.egal(A.m.normaliserDouleurs([{ zone: 'poignet', intensite: 42 }])[0].intensite, 10,
           'une intensité hors échelle est ramenée dans 0–10');
    v.egal(A.m.normaliserDouleurs([{ zone: 'poignet', intensite: -3 }])[0].intensite, 0,
           'y compris par le bas');
    v.egal(A.m.normaliserDouleurs([{ zone: 'poignet', intensite: 'beaucoup' }])[0].intensite, null,
           'une intensité illisible devient inconnue plutôt que fausse');
    v.egal(A.m.normaliserDouleurs(null).length, 0, 'une absence de donnée ne casse rien');
    v.egal(A.m.normaliserDouleurs([{ pasDeZone: 1 }]).length, 0, 'une entrée sans zone est écartée');

    v.egal(A.m.zonesVives([{ zone: 'aucune', intensite: null }]).length, 0,
           '« Aucune » est une réponse, pas une douleur');
    v.egal(A.m.zonesVives([{ zone: 'aucune' }, { zone: 'poignet' }]).length, 1,
           'et elle n’empêche pas de compter les autres');

    v.egal(A.m.texteDouleur({ zone: 'poignet', intensite: 4 }), 'Poignet 4/10',
           'le libellé porte l’intensité');
    v.egal(A.m.texteDouleur({ zone: 'poignet', intensite: null }), 'Poignet',
           'et se tait quand elle est inconnue');

    var e = etatAvec([
      seance('2026-10-10', [], { id: 'a', douleurs: [{ zone: 'coude_medial', intensite: 6 }] }),
      seance('2026-10-17', [], { id: 'b', douleurs: [{ zone: 'coude_medial', intensite: 3 }] }),
      seance('2026-10-18', [], { id: 'c', douleurs: [{ zone: 'aucune', intensite: null }] })
    ]);
    v.egal(A.m.episodesDouleur(e).length, 2, '« Aucune » ne compte pas comme épisode');
    var pente = A.m.suiviZone(e, 'coude_medial');
    v.egal(pente.length, 2, 'la zone est suivie dans le temps');
    v.egal(pente[0].intensite, 6, 'du plus ancien…');
    v.egal(pente[1].intensite, 3, '…au plus récent, pour se lire comme une courbe');
    v.egal(A.m.zonesRencontrees(e)[0], 'coude_medial', 'les zones rencontrées sont listées');
  });

  /* ================================================================
     6. Fenêtre 72 h et structures
     ================================================================ */

  bloc('Charge et structures', function (v) {
    var e = etatAvec([
      seance(jourIlYA(1), [exo('Curl', [serie('normale', 20, 10)], { structures: ['coude_medial'] })], { id: 'r1' }),
      seance(jourIlYA(5), [exo('Poignet', [serie('normale', 15, 12)], { structures: ['poignet', 'avant_bras'] })], { id: 'r2' })
    ]);

    var st = A.m.derniereSollicitationStructure(e);
    function parNom(id) {
      for (var i = 0; i < st.lignes.length; i++) if (st.lignes[i].structure === id) return st.lignes[i];
      return null;
    }
    v.egal(parNom('coude_medial').jours, 1, 'le médial a été chargé hier');
    v.egal(parNom('poignet').jours, 5, 'le poignet il y a cinq jours');
    v.egal(parNom('biceps'), null, 'une structure jamais chargée n’a pas de ligne…');
    v.vrai(st.jamais.some(function (x) { return x.structure === 'biceps'; }),
           '…elle est listée à part, ce qui le DIT au lieu de mentir');
    v.egal(parNom('coude_medial').exercices[0], 'Curl', 'et on sait par quel exercice');

    var ch = A.m.chargeParStructure(e, 28);
    v.egal(ch.parStructure.avant_bras, 1, 'les séries sont comptées par structure');
    v.egal(ch.parStructure.epaule, 0, 'une structure non chargée compte zéro, pas undefined');

    v.egal(A.m.zoneDelai(1), 'chaud', 'moins de 48 h : chaud');
    v.egal(A.m.zoneDelai(2), 'tiede', '48 à 72 h : tiède');
    v.egal(A.m.zoneDelai(3), 'froid', 'au-delà : froid');

    var e2 = etatAvec([
      seance('2026-10-19', [], { id: 'pivot' }),
      seance('2026-10-17', [], { id: 'avant2j' }),
      seance('2026-10-16', [], { id: 'avant3j' }),
      seance('2026-10-15', [], { id: 'avant4j' }),
      seance('2026-10-21', [], { id: 'apres' })
    ]);
    var f = A.m.fenetreAvant(e2, '2026-10-19', 72, 'pivot').map(function (s) { return s.id; });
    v.egal(f.indexOf('avant2j') >= 0, true, 'J−2 est dans la fenêtre 72 h');
    v.egal(f.indexOf('avant3j') >= 0, true, 'J−3 aussi');
    v.egal(f.indexOf('avant4j') >= 0, false, 'J−4 non');
    v.egal(f.indexOf('apres') >= 0, false, 'et ce qui suit n’y est évidemment pas');
  });

  /* ================================================================
     7. Durée déduite des validations
     ================================================================ */

  bloc('Durée réelle', function (v) {
    var t0 = '2026-10-20T18:00:00.000Z';
    var t1 = '2026-10-20T19:02:00.000Z';
    var s = seance('2026-10-20', [exo('Curl', [
      serie('normale', 20, 10, { faiteA: t0 }),
      serie('normale', 20, 10, { faiteA: t1 })
    ])]);
    v.egal(A.m.dureeReelle(s), 62, 'du premier ✓ au dernier');

    var une = seance('2026-10-20', [exo('Curl', [serie('normale', 20, 10, { faiteA: t0 })])]);
    v.egal(A.m.dureeReelle(une), null,
           'une seule validation ne borne aucun intervalle : null, pas zéro');

    var aucune = seance('2026-10-20', [exo('Curl', [serie('normale', 20, 10)])]);
    v.egal(A.m.dureeReelle(aucune), null, 'sans horodatage, pas de durée inventée');
  });

  /* ================================================================
     8. Historique d'un exercice
     ================================================================ */

  bloc('Historique', function (v) {
    var e = etatAvec([
      seance('2026-10-20', [exo('Curl', [serie('normale', 25, 8), serie('normale', 25, 7)])], { id: 'h1' }),
      seance('2026-10-13', [exo('Curl', [serie('normale', 22, 10)])], { id: 'h2' }),
      seance('2026-10-13', [exo('Squat', [serie('normale', 100, 5)])], { id: 'h3' })
    ]);
    var hist = A.m.historiqueExercice(e, 'curl');
    v.egal(hist.length, 2, 'seules les séances contenant l’exercice sont retenues');
    v.egal(hist[0].date, '2026-10-20', 'la plus récente en tête');
    v.egal(hist[0].tonnage, 25 * 8 + 25 * 7, 'le tonnage de la séance est juste');
    v.egal(hist[0].meilleure.charge, 25, 'la meilleure série est repérée');
    v.egal(hist[0].repsTotal, 15, 'les reps sont totalisées');

    var pratiques = A.m.exercicesPratiques(e).map(function (x) { return x.slug; });
    v.egal(pratiques.length, 2, 'les exercices pratiqués sont listés');
    v.egal(pratiques[0], 'curl', 'le plus récemment pratiqué en tête');

    var vide = etatAvec([seance('2026-10-20', [{
      id: 'z', ordre: 0, nom: 'Curl', slug: 'curl', aw: false, typeCharge: 'kg',
      forces: [], structures: [], outils: [], consigne: '', reposSecondes: 90,
      series: [{ id: 'q', type: 'normale', repsCible: '', chargeCible: '',
                 repsReel: '', chargeReel: '', rpe: null, faite: false, faiteA: null }]
    }])]);
    v.egal(A.m.historiqueExercice(vide, 'curl').length, 0,
           'une séance sans série validée n’entre pas dans l’historique');
  });

  /* ================================================================
     9. Fusion à l'import — rien ne doit disparaître
     ================================================================ */

  bloc('Fusion', function (v) {
    /* La fusion travaille sur l'état VIVANT du magasin : on le sauvegarde et
       on le remet en place à la fin, pour ne rien abîmer. */
    var sauve = JSON.parse(JSON.stringify(A.store.etat()));
    try {
      var courant = A.store.vide();
      courant.seances = [seance('2026-10-20', [], { id: 'ici' })];
      courant.programmes = [{ id: 'pA', nom: 'A', description: '', archive: false, creeLe: '2026-10-01', exercices: [] }];
      A.store.remplacer(courant);

      var bilan = A.store.fusionner({
        seances: [seance('2026-10-20', [], { id: 'ici' }), seance('2026-10-12', [], { id: 'ailleurs' })],
        programmes: [{ id: 'pB', nom: 'B', description: '', archive: false, creeLe: '2026-10-01', exercices: [] }],
        exercices: [], outils: []
      });

      v.egal(bilan.seancesAjoutees, 1, 'la séance absente est ajoutée');
      v.egal(bilan.seancesGardees, 1, 'celle déjà présente est gardée, pas dupliquée');
      v.egal(bilan.programmesAjoutes, 1, 'le programme absent est ajouté');
      v.egal(A.store.etat().seances.length, 2, 'aucune séance n’a disparu');

      var fr = A.store.compareFraicheur({ seances: [seance('2026-10-01', [], { id: 'vieux' })] });
      v.vrai(fr.courantPlusRecent, 'un import plus ancien que le carnet est signalé AVANT de remplacer');

      var fr2 = A.store.compareFraicheur({ seances: [seance('2027-01-01', [], { id: 'futur' })] });
      v.egal(fr2.courantPlusRecent, false, 'un import plus récent ne déclenche pas l’alerte');
    } finally {
      A.store.remplacer(sauve);
    }
  });

  /* ================================================================
     10. Chrono persistant
     ================================================================ */

  bloc('Chrono', function (v) {
    var sauve = JSON.parse(JSON.stringify(A.store.etat()));
    try {
      A.store.poserChrono(Date.now() + 60000, 60000, 'Curl · série 2');
      var c = A.store.chronoEnCours();
      v.vrai(!!c, 'un repos en cours est retrouvé après relecture');
      v.egal(c.libelle, 'Curl · série 2', 'avec ce qu’il concerne');

      A.store.poserChrono(Date.now() - 1000, 60000, 'fini');
      v.egal(A.store.chronoEnCours(), null, 'un repos déjà écoulé ne se rouvre pas');

      A.store.poserChrono(null);
      v.egal(A.store.chronoEnCours(), null, 'un repos arrêté ne laisse rien derrière lui');
    } finally {
      A.store.remplacer(sauve);
    }
  });

  /* ================================================================
     11. Catalogues implicites — rien n'est livré d'avance
     ================================================================ */

  bloc('Catalogues', function (v) {
    var e = A.store.vide();
    v.egal(e.exercices.length, 0, '[temoin] le catalogue d’exercices démarre VIDE — aucune liste imposée');
    v.egal(e.outils.length, 0, '[temoin] celui des outils aussi');
    v.egal(e.programmes.length, 0, '[temoin] et aucun programme n’est fourni');

    A.m.majCatalogue(e, { nom: 'Curl marteau', aw: true, typeCharge: 'kg', outils: ['Fat grip'] });
    v.egal(e.exercices.length, 1, 'un nom saisi entre au catalogue');
    v.egal(e.outils.length, 1, 'et son outil aussi, sans qu’on l’ait demandé');

    A.m.majCatalogue(e, { nom: 'CURL MARTEAU', aw: false, typeCharge: 'niveau' });
    v.egal(e.exercices.length, 1, 'le même nom à la casse près ne crée pas de doublon');
    v.egal(e.exercices[0].typeCharge, 'niveau', 'mais ses attributs sont mis à jour');

    A.m.majCatalogueOutils(e, 'Poulie haute', 'Poulies');
    A.m.majCatalogueOutils(e, 'Poulie haute', '');
    v.egal(e.outils.length, 2, 'un outil déjà connu ne se duplique pas');
    v.egal(A.m.trouverOutil(e, 'poulie haute').categorie, 'Poulies',
           'et une catégorie vide n’efface pas celle qui est posée');

    /* --- MES EXERCICES D'ABORD, PUIS LE DICTIONNAIRE ---
       Décision de MB, 2026-10-23. L'ordre n'est pas un détail : ce qu'il a
       écrit lui-même passe toujours devant ce qu'on lui propose. */
    var sug = A.m.suggestions(e, 'curl', 8);
    v.egal(sug[0].nom, 'CURL MARTEAU',
           'ce que j’ai écrit moi-même passe EN PREMIER');
    v.egal(!!sug[0].duDictionnaire, false,
           'et la première ligne ne vient pas du dictionnaire');
    v.vrai(sug.length > 1 && sug.slice(1).every(function (x) {
             return x.duDictionnaire;
           }),
           'le dictionnaire complète ensuite, et seulement ensuite');
    v.egal(A.m.suggestions(e, 'zzz', 8).length, 0,
           'un mot qu’aucun des deux ne connaît ne propose rien');

    /* Le dictionnaire se cherche aussi sur ses AUTRES écritures : c'est tout
       l'intérêt d'en avoir un. « rising » est le mot du bras de fer pour la
       déviation radiale — MB l'a dit, et les sources du sport le confirment. */
    v.egal((A.m.suggestions({ exercices: [] }, 'déviation rad', 8)[0] || {}).entree,
           'Rising',
           '« déviation radiale » trouve l’entrée Rising par son autre '
         + 'écriture');
    v.egal((A.m.suggestions({ exercices: [] }, 'reverse wrist', 8)[0] || {}).entree,
           'Wrist curl inversé',
           'et « reverse wrist » trouve le wrist curl inversé');

    /* --- UNE SUGGESTION GARDE L'ÉCRITURE TAPÉE ---
       MB, 2026-10-23 : « si j'écris Rising, ça écrit Déviation Radiale ».
       C'était le carnet qui décidait à sa place : l'autocomplétion
       remplaçait le champ par le nom principal de l'entrée. Désormais la
       ligne porte l'écriture qui correspond à ce qui a été tapé, et
       l'entrée canonique est dite à côté, sans réécrire le champ.

       L'EXEMPLE A ÉTÉ RETOURNÉ le 26/10, et c'est le même geste de MB qui
       l'a imposé : il a fait de « Rising » le NOM de l'entrée, et
       « Déviation radiale » une écriture. Taper « rising » rendait donc
       nom === entree, et le contrôle ne pouvait plus rien montrer — un vert
       qui ne prouve rien. On tape maintenant l'écriture FRANÇAISE, qui
       diffère encore du nom de l'entrée. */
    var sr = A.m.suggestions({ exercices: [] }, 'déviation rad', 8)[0] || {};
    v.egal(sr.nom, 'Déviation radiale',
           'taper « déviation rad » propose « Déviation radiale », et pas '
         + 'le nom de l’entrée à la place');
    v.egal(sr.entree, 'Rising',
           'et dit à quelle entrée du dictionnaire il se rattache');
    v.vrai(sr.nom !== sr.entree,
           'les deux DIFFÈRENT : sans ça, ce bloc ne mesurerait rien');
    v.egal(sr.muscles.join(','), 'fcr,ecrl,ecrb',
           'avec les muscles de cette entrée');

    var sd = A.m.suggestions({ exercices: [] }, 'rising', 8)[0] || {};
    v.egal(sd.nom, 'Rising',
           'et taper le nom principal propose le nom principal');

    var sh = A.m.suggestions({ exercices: [] }, 'dead h', 8)[0] || {};
    v.egal(sh.nom, 'Dead hang',
           'une entrée dont le nom principal est anglais le garde aussi');
    var st = A.m.suggestions({ exercices: [] }, 'tenue à la b', 8)[0] || {};
    v.egal(st.nom, 'Tenue à la barre',
           'et son écriture française reste française');
    v.egal(st.entree, 'Dead hang',
           'tout en disant de quelle entrée elle vient');

    /* Une entrée du dictionnaire n'INVENTE rien : un nom et des muscles,
       rien d'autre. `null` veut dire « non renseigné » et ne se décide pas
       à la place de MB. */
    var dico = A.m.entreeDictionnaire(A.m.DICTIONNAIRE[0]);
    v.egal(dico.cote, null, 'une entrée du dictionnaire ne décide pas du côté');
    v.egal(dico.prise, null, 'ni de la prise');
    v.egal(dico.outils.length + dico.forces.length + dico.structures.length, 0,
           'ni des outils, ni des forces, ni des structures');
    v.vrai(dico.muscles.length > 0, '[temoin] elle apporte bien des muscles');

    /* Un nom DÉJÀ au catalogue ne revient pas en double. C'est le cas le
       plus fréquent : MB écrit « Wrist curl » une fois, et ensuite c'est SON
       entrée qu'il doit retrouver. */
    var e3 = A.store.vide();
    A.m.majCatalogue(e3, { nom: 'Wrist curl', typeCharge: 'kg' });
    var sw = A.m.suggestions(e3, 'wrist curl', 8);
    v.egal(sw.filter(function (x) { return x.slug === 'wrist curl'; }).length, 1,
           'un nom déjà écrit n’apparaît qu’UNE fois');
    v.egal(!!sw[0].duDictionnaire, false, 'et c’est le sien, pas celui du dictionnaire');

    /* --- LE DICTIONNAIRE ET LA LECTURE DU NOM DISENT LA MÊME CHOSE ---
       Le carnet s'est contredit quatre fois en une journée parce que deux
       moitiés du modèle décrivaient le même geste autrement. Ce contrôle
       refuse que ça recommence, entrée par entrée. */
    A.m.DICTIONNAIRE.forEach(function (d) {
      v.egal(A.m.musclesDuNom(d.nom).join(','), d.muscles.join(','),
             'dictionnaire et lecture du nom s’accordent sur « ' + d.nom + ' »');
    });

    /* --- LA RÈGLE DE PRISE (lot 2, 2026-10-23) ---
       « Pince pouce-index » proposait NEUF muscles, dont les extenseurs et
       les abducteurs du pouce — ceux qui l'OUVRENT, dans un geste qui
       l'écrase. Sous un mot de prise, le nom d'un doigt désigne le doigt
       EMPLOYÉ, pas le muscle qui l'ouvre. */
    v.egal(A.m.musclesDuNom('Pince pouce-index').join(','),
           A.m.musclesDuNom('Pince').join(','),
           '« pince pouce-index » dit la même chose que « pince » : les '
         + 'doigts nommés sont ceux qui pincent');
    v.egal(A.m.musclesDuNom('Pince pouce-index')
            .filter(function (id) {
              return ['extenseurs_pouce', 'long_abducteur_pouce',
                      'court_abducteur_pouce', 'extenseur_index']
                       .indexOf(id) >= 0;
            }).length, 0,
           'et aucun muscle qui OUVRE le pouce ou l’index');

    /* Sans mot de prise, les mêmes mots désignent bien les muscles : c'est
       ce qui tomberait si la règle s'appliquait partout. */
    v.egal(A.m.musclesDuNom('Extension du pouce').join(','),
           'extenseurs_pouce,long_abducteur_pouce,court_abducteur_pouce',
           '« extension du pouce » garde les muscles qui l’ouvrent : aucune '
         + 'prise dans ce nom');

    /* --- TOUTES LES ÉCRITURES D'UNE ENTRÉE S'ACCORDENT ---
       C'est la généralisation du défaut que MB a trouvé lui-même :
       « extension du poignet » rendait deux muscles là où « wrist curl
       inversé » en rendait cinq, pour la même entrée. Ce contrôle refuse
       qu'une AUTRE ÉCRITURE dise autre chose que son entrée. */
    A.m.DICTIONNAIRE.forEach(function (d) {
      (d.aussi || []).forEach(function (n) {
        v.egal(A.m.musclesDuNom(n).join(','), d.muscles.join(','),
               '« ' + n + ' » dit la même chose que « ' + d.nom + ' »');
      });
    });

    /* Et chaque entrée suit l'ORDRE de MUSCLES, comme le reste du carnet :
       sinon deux listes identiques se compareraient comme différentes, et le
       contrôle d'accord ci-dessus mentirait. Vécu : « Supination » portait
       supinateur avant biceps, et l'accord tombait pour cette seule raison. */
    var ordre = A.m.MUSCLES.map(function (x) { return x.id; });
    v.egal(A.m.DICTIONNAIRE.filter(function (d) {
             var rangs = d.muscles.map(function (i) { return ordre.indexOf(i); });
             return rangs.some(function (r, k) { return k > 0 && r < rangs[k - 1]; });
           }).map(function (d) { return d.nom; }).join(', '), '',
           'toutes les entrées suivent l’ordre de MUSCLES');
  });

  /* ================================================================
     12. Ce que l'autocomplétion MONTRE — pas seulement ce qu'elle trie

     La liste est tronquée à huit : le classement décide donc ce qui est
     VISIBLE. `vuLe` valait la date seule, tous les outils ajoutés le même
     jour étaient à égalité, le tri stable gardait l'ordre d'insertion, et le
     dernier ajouté — celui qu'on vient de taper — tombait hors des huit.
     Avec neuf outils en catalogue, un outil neuf n'apparaissait jamais.
     ================================================================ */

  bloc('Autocomplétion : ce qui est visible', function (v) {
    var e = A.store.vide();

    /* Le geste réel : huit outils saisis coup sur coup, dans la même seconde. */
    ['Golden Grip N2', 'Golden Grip N3', 'Golden Grip N4', 'Élastique de rééducation',
     'Fat grip', 'Ceinture de judo', 'Titan Grip Iron Wrist 60 mm',
     'Titan Grip Pronator Ellipsoid'].forEach(function (n) {
      A.m.majCatalogueOutils(e, n, 'Matériel');
    });
    v.egal(e.outils.length, 8, '[temoin] les huit outils sont en catalogue');

    /* …puis « + Ajouter un outil » en pose un neuvième, le même jour. */
    A.m.majCatalogueOutils(e, 'Poulie haute', 'Poulies');
    v.egal(e.outils.length, 9, '[temoin] et le neuvième aussi');

    var vus = A.m.suggestionsOutils(e, '', [], 8).map(function (o) { return o.nom; });
    v.egal(vus.length, 8, 'la liste déroulante reste bornée à huit');
    v.vrai(vus.indexOf('Poulie haute') >= 0,
           'l’outil ajouté À L’INSTANT est VISIBLE sans rien taper');
    v.egal(vus[0], 'Poulie haute', 'et il arrive en tête : le plus récent d’abord');

    /* Le même outil revu remonte, sans se dupliquer. */
    A.m.majCatalogueOutils(e, 'Fat grip');
    v.egal(e.outils.length, 9, 'revoir un outil connu ne le duplique pas');
    v.egal(A.m.suggestionsOutils(e, '', [], 8)[0].nom, 'Fat grip',
           'mais le remet en tête de liste');

    /* Taper doit marcher aussi, et sans se laisser arrêter par les accents. */
    v.egal(A.m.suggestionsOutils(e, 'poulie', [], 8)[0].nom, 'Poulie haute',
           'taper le nom le propose');
    v.egal(A.m.suggestionsOutils(e, 'elastique', [], 8)[0].nom, 'Élastique de rééducation',
           'et les accents ne font pas obstacle');

    /* Ce qui est déjà sur l'exercice ne se propose plus : sinon la liste
       offre un doublon que champMulti refusera en silence. */
    var sansFat = A.m.suggestionsOutils(e, '', ['Fat grip'], 8).map(function (o) { return o.nom; });
    v.egal(sansFat.indexOf('Fat grip'), -1, 'un outil déjà porté n’est plus proposé');
    v.vrai(sansFat.indexOf('Poulie haute') >= 0, 'et sa place profite aux autres');

    /* Même histoire pour le catalogue d'exercices : même tri, même troncature. */
    var e2 = A.store.vide();
    for (var i = 1; i <= 9; i++) A.m.majCatalogue(e2, { nom: 'Exercice ' + i, typeCharge: 'kg' });
    var exos = A.m.suggestions(e2, '', 8).map(function (x) { return x.nom; });
    v.egal(exos.length, 8, 'huit exercices au plus, là aussi');
    v.egal(exos[0], 'Exercice 9', 'et le dernier saisi est en tête, donc visible');

    /* LE CAS QU'ON AVAIT MANQUÉ, et qui s'est vu sur un vrai téléphone :
       un carnet nourri AVANT que vuLe soit horodaté. Toutes ses entrées
       portent la même date, elles sont à égalité, et le tri stable garde
       alors l'ordre d'INSERTION — soit l'inverse de ce qu'on veut. Corriger
       l'écriture ne corrige pas ce qui est déjà écrit : il a fallu un
       départage au classement.

       Les quatre premiers contrôles d'au-dessus passaient tous ; celui-ci
       est le seul qui regarde un carnet ancien. */
    var vieux = A.store.vide();
    ['Golden Grip N2', 'Golden Grip N3', 'Golden Grip N4', 'Élastique',
     'Fat grip', 'Ceinture de judo', 'Titan Grip Iron Wrist', 'Titan Grip Pronator',
     'Barre droite', 'Barre EZ', 'Poulie haute', 'Poulie basse'].forEach(function (n) {
      vieux.outils.push({ id: 'ou_' + n, nom: n, slug: A.m.slug(n),
                          categorie: '', vuLe: A.m.aujourdHui() });   // DATE SEULE
    });
    var vus = A.m.suggestionsOutils(vieux, '', [], 8).map(function (o) { return o.nom; });
    v.egal(vus.length, 8, '[temoin] huit suggestions, comme toujours');
    v.vrai(vus.indexOf('Poulie basse') >= 0,
           'dans un carnet d’AVANT, le dernier outil posé est visible lui aussi');
    v.egal(vus[0], 'Poulie basse', 'et il passe en tête : à égalité, le dernier posé gagne');
    v.egal(vus.indexOf('Golden Grip N2'), -1,
           'ce sont les PREMIERS posés qui sortent de la fenêtre, pas les derniers');

    /* Même histoire pour les exercices d'un carnet ancien. */
    var vieuxExos = A.store.vide();
    for (var k = 1; k <= 10; k++) {
      vieuxExos.exercices.push({ id: 'ex' + k, nom: 'Exercice ' + k, slug: 'exercice ' + k,
                                 aw: false, typeCharge: 'kg', colonnes: ['charge', 'reps'],
                                 forces: [], structures: [], outils: [],
                                 vuLe: A.m.aujourdHui() });
    }
    v.egal(A.m.suggestions(vieuxExos, '', 8)[0].nom, 'Exercice 10',
           'le dernier exercice saisi d’un carnet ancien est visible, lui aussi');

    /* Un horodatage reste prioritaire sur une date seule du même jour : se
       servir d'un outil ancien doit le remonter devant les autres. */
    var melange = A.store.vide();
    melange.outils.push({ id: 'a', nom: 'Ancien', slug: 'ancien', categorie: '',
                          vuLe: A.m.aujourdHui() });
    A.m.majCatalogueOutils(melange, 'Repris');
    v.egal(A.m.suggestionsOutils(melange, '', [], 8)[0].nom, 'Repris',
           'un outil dont on vient de se servir passe devant une date seule');

    /* Compatibilité descendante : un carnet d'avant portait la date seule.
       Elle doit rester comparable — et se classer AVANT un horodatage du
       même jour, puisqu'on ne sait pas à quelle heure elle a été posée. */
    var e3 = A.store.vide();
    A.m.majCatalogueOutils(e3, 'Outil horodaté');
    e3.outils.push({ id: 'vieux', nom: 'Outil d’un ancien carnet',
                     slug: 'outil d un ancien carnet', categorie: '',
                     vuLe: A.m.aujourdHui() });
    v.egal(A.m.suggestionsOutils(e3, '', [], 8)[0].nom, 'Outil horodaté',
           'une date seule se relit, et se classe avant un horodatage du même jour');
    v.egal(A.m.suggestionsOutils(e3, '', [], 8).length, 2,
           'les deux formes cohabitent, aucune n’est perdue');
  });

  /* ================================================================
     14. La durée par série, et les colonnes choisies

     `typeCharge: 'duree'` détournait la colonne REPS en secondes : un champ
     répondait à deux questions. Ce qui s'affiche est maintenant dit par
     `colonnes`, et `typeCharge` ne dit plus que comment lire la charge.
     ================================================================ */

  bloc('Durée et colonnes', function (v) {
    /* --- lecture d'une durée --- */
    v.egal(A.m.secondes('45'), 45, 'des secondes seules se lisent');
    v.egal(A.m.secondes('1:30'), 90, 'et la forme minutes:secondes aussi');
    v.egal(A.m.secondes('2:05'), 125, 'y compris avec un zéro de tête');
    v.egal(A.m.secondes('90'), 90, '« 90 » reste 90 secondes, pas 1 min 30 : ce qui est tapé est lu');
    v.egal(A.m.secondes(''), null, 'le vide n’est pas zéro seconde');
    v.egal(A.m.secondes('longtemps'), null, 'un mot n’est pas une durée');
    v.egal(A.m.secondes('1:75'), null, '75 secondes dans une minute n’existent pas');
    v.egal(A.m.secondes('-10'), null, 'une durée négative non plus');
    v.egal(A.m.texteDuree(45), '45 s', 'sous la minute, on lit des secondes');
    v.egal(A.m.texteDuree(90), '1:30', 'au-delà, on lit des minutes — 1 850 s ne dit rien');
    v.egal(A.m.texteDuree(605), '10:05', 'et le zéro de tête est posé');
    v.egal(A.m.texteDuree(null), '', 'rien à dire quand il n’y a rien');

    /* --- quelles colonnes --- */
    v.egal(A.m.colonnes({}).join(','), 'charge,reps', 'le défaut reste charge + reps');
    v.egal(A.m.colonnes({ colonnes: [] }).join(','), 'charge,reps',
           'un exercice sans aucune colonne n’aurait rien à saisir : on refuse');
    v.egal(A.m.colonnes({ colonnes: ['duree'] }).join(','), 'duree',
           'un isométrique n’affiche QUE la durée');
    v.egal(A.m.colonnes({ colonnes: ['duree', 'charge'] }).join(','), 'charge,duree',
           'l’ordre à l’écran est toujours le même, quel que soit l’ordre saisi');
    v.egal(A.m.colonnes({ colonnes: ['charge', 'zzz'] }).join(','), 'charge',
           'une colonne inconnue est ignorée, pas affichée');
    v.vrai(A.m.aColonne({ colonnes: ['duree'] }, 'duree'), 'aColonne répond sur ce qui est là');
    v.vrai(!A.m.aColonne({ colonnes: ['duree'] }, 'reps'), 'et sur ce qui n’y est pas');

    /* --- ce qui peut peser --- */
    v.vrai(A.m.peutPeser({ typeCharge: 'kg', colonnes: ['charge', 'reps'] }),
           'kilos + charge + reps : le tonnage est possible');
    v.vrai(!A.m.peutPeser({ typeCharge: 'kg', colonnes: ['duree'] }),
           'sans colonne reps, il n’y a RIEN à multiplier');
    v.vrai(!A.m.peutPeser({ typeCharge: 'kg', colonnes: ['charge', 'duree'] }),
           'ni avec charge seule et durée');
    v.vrai(!A.m.peutPeser({ typeCharge: 'elastique', colonnes: ['charge', 'reps'] }),
           '[temoin] et un élastique ne pèse toujours pas, colonnes ou pas');
  });

  /* ================================================================
     15. Le temps sous tension — l'autre façon de charger un tendon
     ================================================================ */

  bloc('Temps sous tension', function (v) {
    function exoDuree(nom, series, cols) {
      var x = exo(nom, series, { typeCharge: 'kg' });
      x.colonnes = cols;
      return x;
    }
    function serieD(duree, extra) {
      var s = serie('normale', '', '', extra);
      s.dureeReel = duree == null ? '' : String(duree);
      return s;
    }

    var iso = seance('2026-10-20', [
      exoDuree('Gainage poignet', [serieD(45), serieD(45), serieD('1:00')], ['duree'])
    ]);
    var v1 = A.m.volumeSeance(iso);
    v.egal(v1.tempsSousTension, 150, 'les durées des séries s’additionnent');
    v.egal(v1.seriesDuree, 3, 'et on sait combien de séries le composent');
    v.egal(v1.tonnage, 0, 'un isométrique ne pèse RIEN — il n’y a rien à multiplier');
    v.egal(v1.seriesIncompletes, 0,
           'et ce n’est pas une saisie incomplète : l’exercice n’a pas de colonne reps');
    v.egal(v1.seriesSansTonnage, 0,
           'une série qui porte une durée est déjà comptée, la signaler serait du bruit');
    v.egal(A.m.texteTempsSousTension(v1), '2:30 sous tension · 3 séries',
           'l’écran le dit en clair');

    /* Une série validée sans rien dedans, sur un exercice sans tonnage
       possible : ce n'est ni du tonnage ni du temps. Il faut le DIRE. */
    var vide = seance('2026-10-20', [exoDuree('Gainage', [serieD(null)], ['duree'])]);
    var v2 = A.m.volumeSeance(vide);
    v.egal(v2.tempsSousTension, 0, 'une série validée sans durée ne vaut pas zéro seconde en silence');
    v.egal(v2.seriesSansTonnage, 1, 'elle est comptée à part');
    v.vrai(A.m.texteHorsTonnage(v2).indexOf('rien à multiplier') >= 0,
           'et l’écran explique pourquoi elle sort du tonnage');
    v.egal(A.m.texteTempsSousTension(v2), '',
           'jamais « 0 s », qui ferait croire à une séance où l’on n’a rien tenu');

    /* Tonnage ET durée sur le même exercice : les deux comptes cohabitent. */
    var mixte = seance('2026-10-20', [
      (function () {
        var x = exoDuree('Curl tenue', [], ['charge', 'reps', 'duree']);
        var s1 = serie('normale', 20, 10); s1.dureeReel = '30';
        var s2 = serie('normale', 20, 10); s2.dureeReel = '30';
        x.series = [s1, s2];
        return x;
      })()
    ]);
    var v3 = A.m.volumeSeance(mixte);
    v.egal(v3.tonnage, 400, 'les trois colonnes ensemble : le tonnage se calcule normalement');
    v.egal(v3.tempsSousTension, 60, 'et le temps sous tension aussi, en même temps');

    /* Une valeur restée dans un champ qu'on a ensuite masqué ne doit plus
       compter : sinon le total bouge sans que rien ne soit visible. */
    var masque = seance('2026-10-20', [
      (function () {
        var x = exoDuree('Curl', [], ['charge', 'reps']);
        var s1 = serie('normale', 20, 10); s1.dureeReel = '30';
        x.series = [s1];
        return x;
      })()
    ]);
    var v4 = A.m.volumeSeance(masque);
    v.egal(v4.tonnage, 200, '[temoin] le tonnage de la série est bien là');
    v.egal(v4.tempsSousTension, 0,
           'une durée saisie puis masquée ne compte plus — rien ne compte en coulisse');

    /* AW à part, comme pour le tonnage. */
    var aw = seance('2026-10-20', [
      (function () { var x = exoDuree('Tenue AW', [serieD(60)], ['duree']); x.aw = true; return x; })(),
      exoDuree('Tenue générale', [serieD(30)], ['duree'])
    ]);
    var v5 = A.m.volumeSeance(aw);
    v.egal(v5.tempsSousTension, 90, 'le total additionne tout');
    v.egal(v5.tempsSousTensionAw, 60, 'et la part AW est comptée à part, comme le tonnage');
  });

  /* ================================================================
     16. PRÉCÉDENT recopie aussi la durée
     ================================================================ */

  bloc('PRÉCÉDENT avec durée', function (v) {
    function avecDuree(s, d) { s.dureeReel = d; return s; }

    var e = etatAvec([
      seance('2026-10-14', [
        (function () {
          var x = exo('Gainage', [avecDuree(serie('normale', '', ''), '45')]);
          x.colonnes = ['duree'];
          return x;
        })()
      ], { id: 'A' })
    ]);
    var p = A.m.dernierePerf(e, 'gainage', 'normale', 0, 'B');
    v.vrai(!!p, 'une série qui ne porte QU’une durée est un précédent valide');
    v.egal(p.duree, '45', 'et la durée en fait partie');
    v.egal(A.m.texteDernierePerf(p), '45 s', 'affichée en clair');

    var e2 = etatAvec([
      seance('2026-10-14', [
        (function () {
          var x = exo('Curl tenue', [avecDuree(serie('normale', 20, 10), '30')]);
          x.colonnes = ['charge', 'reps', 'duree'];
          return x;
        })()
      ], { id: 'A' })
    ]);
    v.egal(A.m.texteDernierePerf(A.m.dernierePerf(e2, 'curl tenue', 'normale', 0, 'B')),
           '20 × 10 · 30 s', 'les trois valeurs tiennent sur le bouton, séparées');

    /* Une série vraiment vide reste sans précédent. */
    var e3 = etatAvec([seance('2026-10-12', [exo('Vide', [serie('normale', '', '')])], { id: 'D' })]);
    v.egal(A.m.dernierePerf(e3, 'vide', 'normale', 0, 'X'), null,
           '[temoin] une série sans aucune valeur ne devient pas un précédent');
  });

  /* ================================================================
     17. La migration à la lecture — un carnet d'avant se relit entier
     ================================================================ */

  bloc('Migration des colonnes', function (v) {
    /* Un exercice d'avant : typeCharge 'duree', les secondes dans repsReel. */
    var vieux = {
      versionDonnees: 1, exercices: [], outils: [], programmes: [],
      seances: [{
        id: 'se1', type: 'muscu', date: '2026-09-01', heure: '2026-09-01T18:00:00.000Z',
        programmeId: null, programmeNom: 'P', dureeMin: null, rpeGlobal: null,
        note: '', douleurs: [],
        exercices: [{
          id: 'e1', ordre: 0, nom: 'Gainage', slug: 'gainage', aw: false,
          typeCharge: 'duree', forces: [], structures: [], outils: [],
          consigne: '', reposSecondes: 90,
          series: [{ id: 's1', type: 'normale', repsCible: '40', chargeCible: '',
                     repsReel: '45', chargeReel: '', rpe: null, faite: true, faiteA: null },
                   { id: 's2', type: 'echauffement', repsCible: '', chargeCible: '',
                     repsReel: '20', chargeReel: '', rpe: null, faite: true, faiteA: null }]
        }]
      }]
    };
    var m = A.m.migrer(vieux);
    var ex = m.seances[0].exercices[0];

    v.egal(ex.typeCharge, 'kg', 'typeCharge « duree » n’existe plus : il ne dit que la charge');
    v.egal(ex.colonnes.join(','), 'charge,duree', 'et les colonnes disent ce qui s’affiche');
    v.egal(ex.series[0].dureeReel, '45', 'les secondes quittent la colonne REPS…');
    v.egal(ex.series[0].repsReel, '', '…qui redevient vide, puisqu’elle ne voulait rien dire');
    v.egal(ex.series[0].dureeCible, '40', 'la cible suit le même chemin');
    v.egal(ex.series[1].type, 'normale', 'un échauffement d’avant devient une série normale');

    /* Le point qui compte : AUCUN chiffre du passé ne doit bouger. */
    var vol = A.m.volumeSeance(m.seances[0]);
    v.egal(vol.tonnage, 0, 'le tonnage reste à zéro — il l’était déjà, « duree » ne pesait pas');
    v.egal(vol.tempsSousTension, 65, 'et les secondes sont maintenant comptées, là où elles dormaient');

    /* Un exercice ordinaire d'avant reçoit le défaut, et rien d'autre. */
    var ordinaire = A.m.migrer({
      exercices: [{ nom: 'Curl', slug: 'curl', typeCharge: 'kg' }],
      programmes: [], seances: []
    });
    v.egal(ordinaire.exercices[0].colonnes.join(','), 'charge,reps',
           'un exercice d’avant prend le défaut charge + reps');
    v.egal(ordinaire.exercices[0].typeCharge, 'kg', '[temoin] et son type de charge ne bouge pas');

    /* La migration doit atteindre les programmes aussi, pas seulement les
       séances : un programme non converti resservirait l'ancien format. */
    var prog = A.m.migrer({
      exercices: [], seances: [],
      programmes: [{ id: 'p1', nom: 'P', exercices: [{
        id: 'ep1', nom: 'Gainage', slug: 'gainage', typeCharge: 'duree',
        series: [{ id: 'sp1', type: 'normale', repsCible: '60', chargeCible: '' }]
      }] }]
    });
    var pex = prog.programmes[0].exercices[0];
    v.egal(pex.colonnes.join(','), 'charge,duree', 'un programme d’avant est converti lui aussi');
    v.egal(pex.series[0].dureeCible, '60', 'avec les cibles de ses séries');

    /* Migrer deux fois ne doit rien abîmer. */
    var deuxFois = A.m.migrer(A.m.migrer({
      exercices: [], programmes: [], seances: [{
        id: 'x', type: 'muscu', date: '2026-09-01', exercices: [{
          nom: 'G', slug: 'g', typeCharge: 'duree',
          series: [{ type: 'normale', repsReel: '30', chargeReel: '' }]
        }]
      }]
    }));
    v.egal(deuxFois.seances[0].exercices[0].series[0].dureeReel, '30',
           'migrer deux fois donne le même résultat qu’une');
    v.egal(deuxFois.seances[0].exercices[0].colonnes.join(','), 'charge,duree',
           'et les colonnes ne se redoublent pas');
  });

  /* ================================================================
     18. Le type « échauffement » n'existe plus
     ================================================================ */

  bloc('Types de série', function (v) {
    v.egal(Object.keys(A.m.TYPES_SERIE).length, 3, 'trois types de série, pas quatre');
    v.egal(A.m.TYPES_SERIE.echauffement, undefined, '« échauffement » n’en fait plus partie');
    v.egal(A.m.ORDRE_TYPES.indexOf('echauffement'), -1, 'ni dans l’ordre proposé au doigt');
    v.egal(A.m.ORDRE_TYPES.join(','), 'normale,degressive,echec', 'les trois restants, dans cet ordre');
    v.egal(A.m.TYPES_SERIE.normale.lettre, '', '[temoin] une série normale porte son numéro, pas une lettre');

    /* Un type inconnu dans un vieux carnet ne doit pas casser l'affichage :
       renumeroter() lit TYPES_SERIE[s.type].lettre sans filet. */
    var m = A.m.migrer({ exercices: [], programmes: [], seances: [{
      id: 'x', type: 'muscu', date: '2026-09-01', exercices: [{
        nom: 'C', slug: 'c', typeCharge: 'kg',
        series: [{ type: 'inconnu', repsReel: '', chargeReel: '' }]
      }]
    }] });
    v.egal(m.seances[0].exercices[0].series[0].type, 'normale',
           'un type inconnu redevient normal plutôt que de faire planter la ligne');
  });

  /* ================================================================
     23. Les muscles, et la prise

     Les STRUCTURES disent ce qui encaisse ; les MUSCLES disent ce qui tire.
     Le pré-remplissage propose, il n'impose pas, et il dit d'où il vient.
     ================================================================ */

  bloc('Muscles et prise', function (v) {
    v.egal(A.m.MUSCLES.length, 37, 'trente-sept muscles — toute la planche, les profonds qu’elle ne montre pas, la main, le grand rond, et le trapèze entré le 26/10');
    v.egal(A.m.nomMuscle('fcu'), 'Fléchisseur ulnaire du carpe', 'nommés en clair');
    v.egal(A.m.nomMuscle('zzz'), 'zzz', 'un identifiant inconnu se rend tel quel');
    v.vrai(!!A.m.muscle('biceps').quoi, 'et chacun dit ce qu’il FAIT — sinon personne ne coche');

    /* La masse flexo-pronatrice : c'est ce qui relie la carte à la douleur,
       et se tromper là rendrait tout le reste faux. */
    var medial = A.m.MUSCLES.filter(function (m) { return m.medial; })
                            .map(function (m) { return m.id; }).sort();
    v.egal(medial.join(','), 'fcr,fcu,flechisseurs_doigts,long_palmaire,rond_pronateur',
           'cinq muscles naissent de l’épicondyle médial, et pas un de plus');
    v.vrai(!A.m.muscle('carre_pronateur').medial,
           'le carré pronateur est DISTAL : le ranger avec les autres aurait été plus '
         + 'simple à lire et faux');
    v.vrai(!A.m.muscle('supinateur').medial, 'le supinateur non plus');
    v.vrai(A.m.muscle('supinateur').lateral, 'il est du côté latéral');
    v.vrai(A.m.muscle('ecrb').lateral, 'les radiaux aussi');
    v.vrai(A.m.muscle('ecu').lateral, 'et le cubital postérieur');
    v.vrai(!A.m.muscle('brachio_radial').medial && !A.m.muscle('brachio_radial').lateral,
           'et le brachio-radial ne porte aucune des deux marques — crête supracondylaire');

    /* --- le pré-remplissage --- */
    var cup = A.m.musclesProposes(['cupping']);
    v.egal(cup.source, 'anatomie',
           'le cupping EST une flexion du poignet : la proposition vient du manuel');
    v.vrai(cup.muscles.indexOf('fcu') >= 0, 'et propose le fléchisseur ulnaire');
    v.vrai(cup.muscles.indexOf('fcr') >= 0, 'et le radial');

    var pro = A.m.musclesProposes(['pronation']);
    v.egal(pro.muscles.sort().join(','), 'carre_pronateur,rond_pronateur',
           'la pronation propose les deux pronateurs, et rien d’autre');

    var side = A.m.musclesProposes(['side_pressure']);
    /* --- la source est NOMMÉE, et vérifiable ---
       « À vérifier » tout court ne dit pas QUI l'affirme : c'est un avis
       qu'on ne peut pas contredire. Toute source qui n'est pas de l'anatomie
       de manuel porte donc `dit` (qui) et `lien` (où le vérifier). */
    var anonymes = Object.keys(A.m.MUSCLES_PAR_MOUVEMENT).filter(function (f) {
      var p = A.m.MUSCLES_PAR_MOUVEMENT[f];
      return p.source !== 'anatomie' && !(p.dit && p.lien);
    });
    v.egal(anonymes.join(', '), '',
           'une source qui n’est pas du manuel NOMME qui l’affirme, et où le vérifier');
    /* Écrit d'abord `…dit.length > 3` : quand `dit` manquait, ça levait une
       TypeError qui emportait les CENT ET UN contrôles du bloc. Un contrôle
       doit échouer, pas planter — sinon il masque ce qu'il devait prouver. */
    var sbp = A.m.sourceDuMouvement('back_pressure');
    v.vrai(!!sbp.dit && sbp.dit.length > 3,
           'et l’accesseur le rend à l’écran');
    v.egal(A.m.sourceDuMouvement('cupping').dit, null,
           'l’anatomie de manuel n’a personne à nommer');
    v.egal(A.m.sourceDuMouvement('zzz'), null, 'un mouvement inconnu ne rend rien');

    /* Une DIRECTION DE POUSSÉE n'est pas une action articulaire : sa source
       ne peut jamais être 'anatomie'. Le contrôle épinglait 'a_verifier' ;
       depuis qu'un troisième niveau existe, il mesure la RÈGLE plutôt que la
       valeur — sinon il faudrait le réécrire à chaque fois qu'une source est
       mieux renseignée, ce qui n'est pas ce qu'il garde. */
    /* Le contenu du back pressure, et D'OÙ vient chaque nom. Deux sources le
       renseignent et elles ne disent pas la même chose : l'étude EMG nomme le
       grand pectoral en premier, Voice of Armwrestling ne le nomme pas et
       ajoute le brachio-radial et le deltoïde postérieur. Les deux y sont.

       Le grand rond est le seul nom que les DEUX donnent : l'étude parmi les
       rotateurs internes agissant sur l'humérus pendant le sport, les
       compétiteurs comme prioritaire pour tirer la main de l'adversaire vers
       soi. C'est pour lui qu'un trente-sixième muscle est entré au modèle. */
    v.egal(A.m.MUSCLES_PAR_MOUVEMENT.back_pressure.muscles.join(','),
           'grand_pectoral,grand_dorsal,grand_rond,subscapulaire,deltoide,'
         + 'biceps,brachio_radial',
           'le back pressure porte ce que les DEUX sources nomment');
    v.vrai(A.m.MUSCLES_PAR_MOUVEMENT.back_pressure.muscles.indexOf('grand_rond') >= 0,
           'dont le grand rond, nommé par l’étude ET par les compétiteurs');
    v.vrai(A.m.MUSCLES_PAR_MOUVEMENT.back_pressure.muscles.indexOf('grand_pectoral') >= 0,
           'et le grand pectoral, que seule l’étude nomme : on ne tranche pas '
         + 'en silence entre deux sources');

    var poussees = ['rising', 'back_pressure', 'side_pressure'];
    var enDur = poussees.filter(function (f) {
      return A.m.MUSCLES_PAR_MOUVEMENT[f].source === 'anatomie';
    });
    v.egal(enDur.join(', '), '',
           'une DIRECTION DE POUSSÉE n’est jamais donnée pour de l’anatomie');
    var articulaires = ['cupping', 'pronation', 'supination'].filter(function (f) {
      return A.m.MUSCLES_PAR_MOUVEMENT[f].source !== 'anatomie';
    });
    v.egal(articulaires.join(', '), '',
           '[temoin] et une ACTION ARTICULAIRE l’est toujours : c’est du manuel, '
         + 'et ça ne dépend d’aucune source à nommer');
    v.vrai(poussees.every(function (f) {
             var x = A.m.sourceDuMouvement(f);
             return !!(x.dit && x.lien);
           }),
           'les trois poussées nomment qui les affirme, et où le vérifier');

    var mixte = A.m.musclesProposes(['cupping', 'side_pressure']);
    v.egal(mixte.source, 'mixte', 'mélanger les deux se dit « mixte », pas « anatomie »');

    v.egal(A.m.musclesProposes([]).muscles.length, 0, 'sans mouvement, aucune proposition');
    v.egal(A.m.musclesProposes([]).source, null, 'et aucune source à annoncer');
    v.egal(A.m.musclesProposes(['zzz']).muscles.length, 0, 'un mouvement inconnu ne propose rien');

    /* La prise fermée fait travailler les fléchisseurs des doigts : c'est la
       définition de serrer, pas une interprétation. */
    v.egal(A.m.nomPrise('fermee'), 'Fermée', 'la prise se nomme');
    v.egal(A.m.nomPrise(null), 'Prise non renseignée', 'et son absence se DIT');
    v.egal(A.m.priseValide('molle'), null, 'une valeur inconnue devient non renseignée');
    var ferme = A.m.musclesProposes([], 'fermee');
    /* La proposition a été ÉLARGIE au pouce, et bornée par la même source :
       les extrinsèques font la force d'une prise de force, et le thénar y est
       employé dans toutes ses formes (JBJS 1970, 115 sujets). Ce qui reste
       dehors l'est pour la même raison — voir le contrôle juste en dessous. */
    v.egal(ferme.muscles.join(','),
           'flechisseurs_doigts,long_flechisseur_pouce,court_abducteur_pouce,'
         + 'court_flechisseur_pouce,opposant_pouce,adducteur_pouce',
           'une prise fermée propose les fléchisseurs des doigts ET le pouce');
    /* Les lombricaux sont explicitement donnés comme NON employés dans une
       prise de force, et l'hypothénar n'est pas documenté. Les proposer
       serait combler un trou de la source avec une intuition. */
    v.egal(ferme.muscles.filter(function (m) {
             return ['lombricaux', 'court_palmaire', 'opposant_auriculaire',
                     'court_flechisseur_auriculaire', 'abducteur_auriculaire'].indexOf(m) >= 0;
           }).join(','), '',
           'et ni les lombricaux ni l’hypothénar : la source ne le dit pas');
    v.egal(ferme.source, 'anatomie', 'et c’est de l’anatomie');
    /* Ce controle disait « une prise ouverte ne propose rien : on pousse,
       on ne serre pas ». MB a montre que la definition etait fausse — on ne
       pousse pas une traction. Une prise ouverte SERRE, sans le pouce. */
    v.egal(A.m.musclesProposes([], 'ouverte').muscles.join(','),
           'flechisseurs_doigts',
           'une prise ouverte serre avec les DOIGTS : le pouce n’est pas sur '
         + 'la barre, mais eux si');
    v.egal(A.m.musclesProposes([], 'ouverte').muscles
            .filter(function (id) { return /pouce/.test(id); }).length, 0,
           'et aucun muscle du pouce, puisqu’il ne tient rien');

    /* La prise FERMEE ajoute le pouce PAR-DESSUS les doigts : elle contient
       l'ouverte, elle ne la remplace pas. C'est ce qui tombe si les deux
       listes se mettent a diverger. */
    var po = A.m.musclesProposes([], 'ouverte').muscles;
    var pf = A.m.musclesProposes([], 'fermee').muscles;
    v.egal(po.filter(function (id) { return pf.indexOf(id) < 0; }).join(','), '',
           'tout ce que l’ouverte propose, la fermée le propose aussi');
    v.vrai(pf.length > po.length,
           'et la fermée en ajoute : le pouce qui s’enroule');

    /* Les LIBELLÉS parlent du POUCE, pas de pousser ou serrer : c'est la
       correction de MB, et un texte qui repartirait sur « on pousse »
       rendrait ce contrôle rouge. */
    v.vrai(A.m.PRISES.every(function (p) { return /pouce/.test(p.quoi); }),
           'les deux prises se définissent sur le POUCE');
    v.egal(A.m.PRISES.filter(function (p) { return /pousse/.test(p.quoi); }).length, 0,
           'et aucune ne parle de pousser : on ne pousse pas une traction');

    /* --- la proposition depuis le NOM ---
       « Curl biceps prise ouverte » contient le mot biceps : le proposer
       n'invente rien, ça relit ce qui a été écrit. C'est la seule des trois
       sources qui ne demande aucune case cochée. */
    /* Ces deux contrôles portaient les listes d'AVANT le lot 5, qui n'a
       pas change ce qu'ils mesurent — la lecture d'un nom, et le mot
       « marteau » — mais a ajoute des muscles aux deux entrees. On mesure
       donc la PRESENCE, pas la liste entiere : le lot suivant ne les fera
       pas tomber pour rien. */
    v.vrai(A.m.musclesDuNom('Curl biceps prise ouverte').indexOf('biceps') >= 0,
           'le nom « Curl biceps » propose le biceps, sans rien cocher');
    v.egal(A.m.musclesDuNom('Curl biceps prise ouverte').join(','),
           A.m.musclesDuNom('Curl biceps').join(','),
           'et « prise ouverte » ne change pas ce que le NOM dit : la prise '
         + 'a son propre champ');
    v.vrai(A.m.musclesDuNom('Curl marteau').indexOf('brachio_radial') >= 0,
           '« marteau » désigne le brachio-radial sans ambiguïté');
    v.egal(A.m.musclesDuNom('Curl marteau').join(','),
           A.m.musclesDuNom('Hammer curl').join(','),
           'et le curl marteau dit la même chose que le hammer curl');
    v.egal(A.m.musclesDuNom('Pronation Titan Grip').sort().join(','),
           'carre_pronateur,rond_pronateur', '« pronation » propose les deux pronateurs');
    /* Un gripper ne serre pas qu'avec les doigts : le pouce s'oppose, et
       sans lui il n'y a pas de prise. Le controle a ete elargi avec la
       table des mots, pas aligne apres coup sur sa sortie. */
    v.egal(A.m.musclesDuNom('Gripper N3').join(','),
           'flechisseurs_doigts,long_flechisseur_pouce,'
         + 'court_flechisseur_pouce,adducteur_pouce,'
         + 'court_flechisseur_auriculaire,lombricaux',
           'un gripper serre : les fléchisseurs des doigts, le pouce, le '
         + 'petit doigt qui se replie, et les lombricaux');
    v.egal(A.m.musclesDuNom('Tirage poulie haute').join(','),
           'grand_dorsal,grand_rond,biceps,brachial',
           '« tirage poulie haute » tire : le dos ET les fléchisseurs du coude');
    v.egal(A.m.musclesDuNom('CURL BICEPS').join(','),
           A.m.musclesDuNom('curl biceps').join(','),
           'la casse ne change rien');
    v.vrai(A.m.musclesDuNom('curl biceps').length > 0,
           '[temoin] et « curl biceps » dit quelque chose, sinon la '
         + 'comparaison ci-dessus serait vraie pour rien');
    /* Un mot qui apparaît dans un nom d'OUTIL ne désigne pas un muscle :
       « Titan Grip » et « Fat grip » sont du matériel. Le banc a attrapé ce
       faux positif, et c'est ce qui a fait retirer « grip » tout court. */
    v.egal(A.m.musclesDuNom('Pronation Titan Grip').indexOf('flechisseurs_doigts'), -1,
           '« Titan Grip » est un outil : il ne propose aucun fléchisseur');
    v.egal(A.m.musclesDuNom('Curl Fat grip').length, 0,
           '« Fat grip » non plus — et « curl » seul ne dit rien');
    v.egal(A.m.musclesDuNom('Gripper N3').join(','),
           'flechisseurs_doigts,long_flechisseur_pouce,'
         + 'court_flechisseur_pouce,adducteur_pouce,'
         + 'court_flechisseur_auriculaire,lombricaux',
           '[temoin] mais « gripper », lui, désigne bien le serrage');

    /* --- la NEGATION, lue --- */
    /* « Wrist curl inversé » contient « wrist curl » : il proposait les
       FLÉCHISSEURS, soit exactement les muscles opposés à ceux qu'il
       travaille. Une proposition fausse est pire qu'une absence : l'écran
       coche des cases plausibles que personne ne va relire.

       Et l'app se contredisait elle-même — elle écrit « le wrist curl
       inversé » dans l'explication de la zone des EXTENSEURS. */
    /* Le ROND PRONATEUR y est, et c'est mesuré : Fujii et al.,
       J Electromyogr Kinesiol 2007;17(1):80-89 — « PT and ECR showed
       parallel activities during the static extension » chez les DOUZE
       sujets quand l'avant-bras est prone, et le mécanisme est nommé :
       la co-contraction « occurs to prevent supinating the forearm »,
       parce que l'ECRL supine l'avant-bras de 30 à 80° depuis la position
       prone. Le rond pronateur ne tourne pas, il TIENT. */
    v.egal(A.m.musclesDuNom('Wrist curl inversé').join(','),
           'rond_pronateur,ecrl,ecrb,ecu,extenseurs_doigts',
           'un wrist curl INVERSÉ relève le poignet : les extenseurs, plus '
         + 'le rond pronateur qui tient la pronation (Fujii 2007, 12 sujets '
         + 'sur 12)');
    v.egal(A.m.musclesDuNom('Wrist curl inversé').indexOf('carre_pronateur'), -1,
           'et PAS le carré pronateur : l’étude ne mesure que le rond');
    v.egal(A.m.musclesDuNom('Wrist curl inversé').indexOf('fcu'), -1,
           'et SURTOUT pas les fléchisseurs, qui sont le geste droit');
    /* MB : « un wrist curl ne fait pas travailler QUE les fléchisseurs
       pronateurs, nan ? » Il avait raison. Le LONG PALMAIRE est un
       fléchisseur du poignet au tableau d'actions de Kenhub (revu le
       2023-11-03), et les FLÉCHISSEURS DES DOIGTS y « aident » — le carnet
       les affirmait déjà tous les deux pour le cupping. */
    v.egal(A.m.musclesDuNom('Wrist curl').join(','), 'fcr,long_palmaire,fcu,flechisseurs_doigts,long_flechisseur_pouce',
           'un wrist curl droit, ce sont les deux fléchisseurs du carpe, le '
         + 'long palmaire et les fléchisseurs des doigts');

    /* LA PREUVE EST L'ACCORD. Le carnet se contredisait pour la quatrième
       fois ce jour-là : la table anatomique proposait quatre muscles pour
       le cupping, la lecture du nom en donnait deux pour le même geste.
       Ce contrôle refuse que les deux moitiés divergent de nouveau. */
    v.egal(A.m.musclesDuNom('Wrist curl').join(','),
           (A.m.musclesProposes(['cupping'], null, '', null).muscles || []).join(','),
           'la lecture du NOM dit la même chose que la table ANATOMIQUE, '
         + 'pour le même geste');
    v.egal(A.m.musclesDuNom('Cupping').join(','),
           A.m.musclesDuNom('Wrist curl').join(','),
           'et « cupping » est le nom bras de fer du même geste');

    /* On prend le geste le plus LONG : « wrist curl inversé » est un wrist
       curl retourné, pas un curl retourné. Sans ça il proposerait aussi le
       brachio-radial, qui n'a rien à faire dans une flexion de poignet. */
    v.egal(A.m.musclesDuNom('Wrist curl inversé').indexOf('brachio_radial'), -1,
           'c’est un WRIST curl inversé, pas un curl inversé');
    v.egal(A.m.musclesDuNom('Curl inversé').join(','), 'biceps,brachial,brachio_radial,ecrl,ecrb',
           'un curl inversé se tient en pronation : les trois fléchisseurs '
         + 'du coude ET les radiaux. Le biceps et le brachial sont entrés '
         + 'au lot 5 — un coude qui se plie les emploie forcément');
    v.egal(A.m.musclesDuNom('Reverse curl').join(','),
           A.m.musclesDuNom('Curl inversé').join(','),
           'et « reverse curl » dit la même chose en anglais');

    /* --- UNE POSITION TENUE N'EST PAS UN GESTE (MB, 2026-10-23) ---
       « En pronation » dit où l'avant-bras est TENU. Le carnet le lisait
       comme le geste de pronation, et rendait pour « wrist curl en
       pronation » les FLÉCHISSEURS — les muscles opposés — là où « wrist
       curl inversé », le même geste, rendait les extenseurs.

       Le commentaire du modèle le disait déjà (« un curl inversé se tient
       en pronation ») sans que la lecture l'applique : même forme que
       « inversé » avant lui, où l'app écrivait « le wrist curl inversé »
       dans la zone des EXTENSEURS tout en proposant les fléchisseurs.

       LA PREUVE EST L'ÉGALITÉ : deux écritures du même geste doivent
       proposer la même chose. C'est ce qui tombe si le marqueur disparaît. */
    v.egal(A.m.musclesDuNom('Wrist curl en pronation').join(','),
           A.m.musclesDuNom('Wrist curl inversé').join(','),
           '« wrist curl en pronation » et « wrist curl inversé » sont le '
         + 'même geste et proposent la même chose');
    v.egal(A.m.musclesDuNom('Wrist curl en pronation').join(','),
           'rond_pronateur,ecrl,ecrb,ecu,extenseurs_doigts',
           'et ce sont bien les extenseurs, pas les fléchisseurs');
    v.egal(A.m.musclesDuNom('Wrist curl en pronation')
            .filter(function (id) { return id === 'fcr' || id === 'fcu'; }).length, 0,
           'aucun fléchisseur du poignet ne reste : c’était le défaut');
    v.egal(A.m.musclesDuNom('Curl en pronation').join(','),
           A.m.musclesDuNom('Curl inversé').join(','),
           '« curl en pronation » et « curl inversé » aussi');

    /* La position ne retourne QUE les gestes qui supposent une prise par
       défaut. « Flexion du poignet » nomme sa direction : la dire tenue en
       pronation ne l'inverse pas, et les fléchisseurs restent. C'est ce qui
       tombe si le marqueur retourne tout au lieu de passer par les clés. */
    v.egal(A.m.musclesDuNom('Flexion du poignet en pronation').join(','), 'fcr,long_palmaire,fcu,flechisseurs_doigts,long_flechisseur_pouce',
           '« flexion du poignet en pronation » garde les fléchisseurs : '
         + 'le nom dit déjà son sens');

    /* Et le GESTE de pronation, lui, ne bouge pas : sans « en » devant, le
       mot désigne toujours la rotation. Tombe si le mot est écarté partout
       au lieu de l’être sous une position tenue. */
    v.egal(A.m.musclesDuNom('Pronations à la poulie').join(','),
           'rond_pronateur,carre_pronateur',
           'une pronation SANS « en » reste le geste : les deux pronateurs');

    /* --- « EN SUPINATION » : DÉCISION EN ATTENTE ---
       Même grammaire, mais la retirer du geste laisserait « curl en
       supination » sans AUCUNE proposition, puisque « curl » seul n'est
       volontairement pas lu. Aucune source ne dit ce qui tient une
       supination. Ce contrôle fige l'état actuel pour que le changement,
       s'il vient, soit décidé et pas subi. */
    v.egal(A.m.musclesDuNom('Curl en supination').join(','), 'biceps,supinateur',
           '« en supination » se lit encore comme le geste — décision de MB '
         + 'en attente');

    /* --- « EXTENSION DU POIGNET » EST LE MÊME GESTE (MB, 2026-10-23) ---
       MB : « extension du poignet et wrist curl inversé sont deux exercices
       différents ». Sur la TERMINOLOGIE il se trompait — les sources sont
       nettes, un reverse wrist curl est un exercice de POIGNET, et c'est
       « reverse curl », SANS « wrist », qui bouge le coude.

       Mais le carnet lui donnait raison par un DÉFAUT : le mot « extension
       poignet » ne vivait que sur les deux radiaux. Le même geste rendait
       DEUX muscles sous un nom et CINQ sous l'autre — et le dictionnaire
       les donnait comme synonymes. Cinquième fois en une journée que deux
       écritures d'un même geste divergent. */
    ['Extension du poignet', 'Extension poignet', 'Reverse wrist curl']
      .forEach(function (n) {
        v.egal(A.m.musclesDuNom(n).join(','),
               A.m.musclesDuNom('Wrist curl inversé').join(','),
               '« ' + n + ' » dit la même chose que « wrist curl inversé »');
      });

    /* Et ce qui porte « curl » SANS « wrist » reste au COUDE : c'est la
       distinction que MB défendait, et elle, elle est juste. */
    v.egal(A.m.musclesDuNom('Curl inversé').join(','), 'biceps,brachial,brachio_radial,ecrl,ecrb',
           'un curl inversé, lui, bouge le COUDE — et garde le brachio-radial');
    v.egal(A.m.musclesDuNom('Extension du poignet').indexOf('brachio_radial'), -1,
           'et le brachio-radial n’entre PAS dans une extension de poignet');

    /* --- LE CÔTÉ ACCENTUÉ (MB, 2026-10-23) ---
       MB : « on peut faire un wrist curl qui accentue le côté du pouce, et
       inversement avec le petit doigt, ou alors tu wrist curl normalement,
       sans accentuation d'un côté ou de l'autre. » C'est l'axe qu'il
       emploie — la DÉVIATION — et c'était le pire de la table :

         Wrist curl cote pouce       -> ... + les trois muscles qui OUVRENT
                                              le pouce
         Wrist curl cote petit doigt -> ... + quatre muscles du petit doigt,
                                              dont trois INTRINSÈQUES
         Deviation radiale           -> RIEN

       Dans « côté pouce », POUCE nomme une direction. Le lire comme un
       muscle est la famille de « lat » dans « latérale », en pire : le mot
       est le bon, c'est son RÔLE qui est faux.

       Source : Kenhub, revu le 2023-11-03 — le fléchisseur radial fait
       « wrist flexion, wrist ABDUCTION », l'ulnaire « wrist flexion, wrist
       ADDUCTION ». Chacun fléchit ET dévie de son bord. */
    v.egal(A.m.musclesDuNom('Wrist curl côté pouce').join(','),
           'fcr,long_palmaire,flechisseurs_doigts,long_flechisseur_pouce',
           'un wrist curl accentué POUCE, c’est le fléchisseur radial — '
         + 'celui qui fléchit ET abduit');
    v.egal(A.m.musclesDuNom('Wrist curl côté petit doigt').join(','),
           'long_palmaire,fcu,flechisseurs_doigts,long_flechisseur_pouce',
           'accentué PETIT DOIGT, c’est l’ulnaire — celui qui fléchit ET '
         + 'adduit');
    /* Les TROIS variantes que MB décrit doivent différer entre elles.
       C'est la demande, dite en un contrôle : avant, les deux accentuées
       proposaient la même chose que la neutre, plus du bruit. */
    var troisVariantes = ['Wrist curl',
                          'Wrist curl côté pouce',
                          'Wrist curl côté petit doigt']
      .map(function (n) { return A.m.musclesDuNom(n).join(','); });
    v.egal(troisVariantes.join(' | '),
           'fcr,long_palmaire,fcu,flechisseurs_doigts,long_flechisseur_pouce'
         + ' | fcr,long_palmaire,flechisseurs_doigts,long_flechisseur_pouce'
         + ' | long_palmaire,fcu,flechisseurs_doigts,long_flechisseur_pouce',
           'les trois variantes diffèrent par le BORD, et par lui seul : le '
         + 'long palmaire et les fléchisseurs des doigts sont dans les '
         + 'trois');

    /* Le long palmaire s'insère sur l'aponévrose palmaire, au MILIEU : il
       ne penche d'aucun côté, donc aucun côté ne l'écarte. C'est ce qui
       tomberait si on le rangeait par erreur sur un bord. */
    v.egal(troisVariantes.filter(function (l) {
             return l.indexOf('long_palmaire') >= 0;
           }).length, 3,
           'le long palmaire est dans les trois : il n’a pas de côté');

    /* Le mot du côté est RETIRÉ du nom, pas seulement ignoré : sinon
       « pouce » propose les muscles qui l'ouvrent. C'était le défaut. */
    /* Ce contrôle visait les muscles qui OUVRENT le pouce — c'était eux, le
       défaut. Il passait par /pouce/ dans l'identifiant : une coïncidence,
       pas une mesure, et le long fléchisseur du pouce l'a fait tomber le
       jour où il est entré à bon droit comme fléchisseur du POIGNET. On
       nomme donc les trois. */
    v.egal(A.m.musclesDuNom('Wrist curl côté pouce')
            .filter(function (id) {
              return ['extenseurs_pouce', 'long_abducteur_pouce',
                      'court_abducteur_pouce'].indexOf(id) >= 0;
            }).length, 0,
           'aucun muscle qui OUVRE le pouce : dans « côté pouce », POUCE est '
         + 'une direction');
    v.egal(A.m.musclesDuNom('Wrist curl côté petit doigt')
            .filter(function (id) {
              return (A.m.muscle(id) || {}).intrinseque;
            }).length, 0,
           'et aucun intrinsèque : ils bougent un doigt, pas le poignet');

    /* MB : « quand je fais un wrist curl, ça bosse dans l'avant-bras. »
       Mesuré : les quatre muscles proposés ont leur VENTRE dans
       l'avant-bras, même celui que le carnet range dans la région Grip.
       La région dit la FONCTION, pas l'endroit. */
    v.egal(A.m.musclesDuNom('Wrist curl')
            .filter(function (id) {
              return (A.m.muscle(id) || {}).intrinseque;
            }).length, 0,
           'les quatre muscles d’un wrist curl sont dans l’AVANT-BRAS : '
         + 'aucun intrinsèque de la main');

    /* Le côté dit le BORD, le geste dit le SENS. Un wrist curl inversé
       accentué petit doigt tend du côté ulnaire : c'est l'extenseur
       ulnaire, et plus les radiaux. */
    v.egal(A.m.musclesDuNom('Wrist curl inversé côté petit doigt').join(','),
           'rond_pronateur,ecu,extenseurs_doigts',
           'un wrist curl INVERSÉ accentué petit doigt tend du côté ulnaire');
    v.egal(A.m.musclesDuNom('Wrist curl inversé côté pouce').join(','),
           'rond_pronateur,ecrl,ecrb,extenseurs_doigts',
           'et accentué pouce, il tend du côté radial');

    /* Une DÉVIATION PURE prend les deux muscles du même bord : le
       fléchisseur et l'extenseur tirent ensemble, leurs flexions
       s'annulent, il ne reste que la déviation. Et ce vocabulaire-là ne
       proposait RIEN du tout avant. */
    v.egal(A.m.musclesDuNom('Déviation radiale').join(','), 'fcr,ecrl,ecrb',
           'une déviation radiale pure : le fléchisseur et les deux '
         + 'extenseurs du bord du pouce');
    v.egal(A.m.musclesDuNom('Déviation ulnaire').join(','), 'fcu,ecu',
           'et une déviation ulnaire : les deux du bord du petit doigt');
    v.egal(A.m.musclesDuNom('Radial deviation').join(','),
           A.m.musclesDuNom('Déviation radiale').join(','),
           'l’anglais dit la même chose');
    v.egal(A.m.musclesDuNom('Déviation cubitale').join(','),
           A.m.musclesDuNom('Déviation ulnaire').join(','),
           'et « cubitale » est le mot français pour « ulnaire »');

    /* UN MOT DE CÔTÉ SOUS UN GESTE DE COUDE. Autorisé par MB le 26/10 :
       « curl rising, c'est sensiblement le même mouvement que le curl
       pronation, mais en rising ». Le poignet y fait une VRAIE déviation,
       pas une flexion accentuée — donc les trois muscles radiaux, pas un.

       TROIS CHUTES MESURÉES, une par cause, parce qu'une seule révocation
       ne les montrait pas toutes — le bloc rendait 779/780 et j'ai failli
       m'en contenter :

         modèle d'avant entier  -> le 1er tombe seul : « fcr,ecrl,ecrb »,
           les trois fléchisseurs du coude manquent, « rising » ayant quitté
           le nom avant la recherche des mots-clés ;
         SEULE l'ancienne règle du sens remise -> le 1er et le 3e tombent :
           « biceps,brachial,fcr,brachio_radial », les deux extenseurs
           radiaux manquent. Le 3e ne pouvait pas tomber au tour précédent,
           l'autre moitié du défaut le masquant ;
         SEUL « rising curl » retiré des mots-clés -> le 2e tombe.

       Les deux derniers portent `[temoin]` : ils affirment que la correction
       n'a RIEN changé, donc ils tiennent des deux côtés, par construction. */
    v.egal(A.m.musclesDuNom('Curl rising').join(','),
           'biceps,brachial,fcr,brachio_radial,ecrl,ecrb',
           'un curl rising : le coude qui plie ET la déviation radiale '
         + 'entière, comme le curl pronation prend les deux pronateurs');
    v.egal(A.m.musclesDuNom('Rising curl').join(','),
           A.m.musclesDuNom('Curl rising').join(','),
           'et les deux ordres de mots disent la même chose');

    /* LA DISTINCTION QUE TOUT CECI PROTÈGE, et c'est elle qui tombe si on
       simplifie la règle : le MÊME mot de côté, deux sens opposés. */
    v.vrai(A.m.musclesDuNom('Curl rising').indexOf('ecrl') >= 0,
           'le curl rising prend les extenseurs radiaux : c’est une déviation');
    v.egal(A.m.musclesDuNom('Wrist curl côté pouce').indexOf('ecrl'), -1,
           '[temoin] le wrist curl côté pouce ne les prend PAS : c’est une '
         + 'flexion accentuée, et il lisait déjà juste AVANT la correction — '
         + 'c’est précisément ce qu’elle devait préserver');

    /* Un geste de poignet NOMMÉ retire toujours le mot de côté : sans ça,
       « côté pouce » proposerait les muscles qui OUVRENT le pouce. C'est
       l'invariant que la correction du 26/10 devait préserver. */
    v.egal(A.m.musclesDuNom('Wrist curl côté pouce')
            .filter(function (id) {
              return ['extenseurs_pouce', 'long_abducteur_pouce',
                      'court_abducteur_pouce'].indexOf(id) >= 0;
            }).length, 0,
           '[temoin] et le mot de côté quitte toujours un nom qui dit le '
         + 'poignet : invariant d’avant la correction, gardé après');

    /* LE TRAPEZE SEPARE LA PRONATION, ET RIEN D AUTRE. Dickie 2017 sur 19
       hommes : 60,1 contre 37,1 %MVIC pour le trapeze moyen, prise pronee
       contre prise neutre, et aucun autre ecart entre orientations. La
       lecture doit donc rendre le trapeze a la pronee et le retirer aux
       autres — c est MARQUEURS_NON_PRONEE qui le fait.

       VU TOMBER, ET LU PAR BLOC — un seul des quatre est tombe en retirant
       la garde, et c est instructif : « Chin up » ne contient ni
       « traction » ni « pull up », donc le trapeze ne s y declenche JAMAIS,
       garde ou pas. Ce qui le protege est l absence de mot-cle, pas la
       garde. Seuls les noms qui disent « traction » ET une orientation non
       pronee dependent d elle — « Traction prise serree », « Traction
       supinee », et leurs ecritures : sept accords rouges. Les controles
       qui tiennent des deux cotes le disent maintenant. */
    v.vrai(A.m.musclesDuNom('Traction').indexOf('trapeze') >= 0,
           'une traction pronée prend le trapèze');
    v.egal(A.m.musclesDuNom('Chin up').indexOf('trapeze'), -1,
           '[temoin] un chin up ne le prend pas — et ce n’est pas la garde '
         + 'qui l’en empêche : son nom ne contient aucun mot du trapèze');
    v.egal(A.m.musclesDuNom('Traction supinée').indexOf('trapeze'), -1,
           'une traction SUPINÉE non plus, et celle-là tient par la garde : '
         + 'son nom dit « traction »');
    v.egal(A.m.musclesDuNom('Traction prise serrée').indexOf('trapeze'), -1,
           'une prise neutre non plus : c’est l’écart que Dickie mesure');
    v.egal(A.m.musclesDuNom('Traction').filter(function (id) {
             return A.m.musclesDuNom('Chin up').indexOf(id) < 0;
           }).join(','), 'trapeze',
           '[temoin] et le trapèze est la SEULE différence entre les deux '
         + 'listes — vrai des deux côtés de la garde, mais il tombe si un '
         + 'muscle entre dans l’une sans entrer dans l’autre');

    /* Le marqueur ne doit pas se déclencher sur un nom qui NOMME le pouce.
       C'est la garde contre un mot trop gourmand — le défaut de « lat »
       une fois de plus, mais dans l'autre sens. */
    v.egal(A.m.musclesDuNom('Extension du pouce').join(','),
           'extenseurs_pouce,long_abducteur_pouce,court_abducteur_pouce',
           '« extension du pouce » nomme le pouce et garde ses muscles : '
         + 'ce n’est pas un côté');

    /* --- les ARTICLES ne cassent plus la correspondance ---
       L'app est en français, et le français met des articles. « flexion du
       poignet » ne contenait pas « flexion poignet » : il ne proposait RIEN. */
    v.egal(A.m.musclesDuNom('Flexion du poignet').join(','), 'fcr,long_palmaire,fcu,flechisseurs_doigts,long_flechisseur_pouce',
           '« flexion DU poignet » se lit comme « flexion poignet »');
    v.egal(A.m.musclesDuNom('Ouverture de la main').join(','),
           'extenseurs_doigts,extenseur_petit_doigt,extenseurs_pouce,'
         + 'extenseur_index,court_abducteur_pouce,'
         + 'abducteur_auriculaire,lombricaux',
           'et « ouverture DE LA main » comme « ouverture main »');
    v.egal(A.m.musclesDuNom('Flexion poignet').join(','), 'fcr,long_palmaire,fcu,flechisseurs_doigts,long_flechisseur_pouce',
           'sans article, rien ne change');

    /* « Flexion du poignet » nomme le MEME geste qu'un wrist curl : les
       deux doivent proposer la meme chose. Le carnet a deja paye trois fois
       d'avoir deux vocabulaires qui divergent. */
    v.egal(A.m.musclesDuNom('Flexion du poignet').join(','),
           A.m.musclesDuNom('Wrist curl').join(','),
           '« flexion du poignet » et « wrist curl » sont le même geste');

    /* --- les mots se lisent ENTIERS ---
       Trois faux positifs mesurés sur de vrais noms. Chacun proposait un
       muscle qui n'a rien à y faire, et c'est pire qu'une absence. */
    v.egal(A.m.musclesDuNom('Élévation latérale').join(','), 'deltoide',
           '« latérale » ne contient plus « lat » : le dorsal ne s’allume pas');
    v.egal(A.m.musclesDuNom('Lat pulldown').join(','),
           'grand_dorsal,grand_rond,biceps,brachial',
           'mais « lat » reste lisible quand c’est un mot entier');
    v.egal(A.m.musclesDuNom('Pression du pouce').indexOf('grand_pectoral'), -1,
           '« pression » ne contient plus « press » : le pectoral ne s’allume pas');
    v.egal(A.m.musclesDuNom('Bench press').join(','),
           'grand_pectoral,deltoide,triceps',
           'mais « press » reste lisible dans « bench press »');
    v.egal(A.m.musclesDuNom('Pectoraux').join(','), 'grand_pectoral',
           'et le pluriel irrégulier est lu : « pectoraux » n’est pas « pectorals »');
    /* Ce controle portait la LISTE de la traction en dur, et il tombait a
       chaque fois qu'elle changeait — pour une raison qui n'est pas la
       sienne. Ce qu'il mesure, c'est le PLURIEL : on compare donc les deux
       lectures entre elles. Il tombe toujours si « tractions » cesse d'etre
       lu comme « traction », et plus pour autre chose. */
    v.egal(A.m.musclesDuNom('Tractions').join(','),
           A.m.musclesDuNom('Traction').join(','),
           'le pluriel régulier aussi : « tractions » dit « traction »');
    v.vrai(A.m.musclesDuNom('Traction').length > 0,
           '[temoin] et « traction » dit quelque chose, sinon la comparaison '
         + 'ci-dessus serait vraie pour rien');

    /* « doigts » tout seul ne dit pas dans quel SENS ils travaillent : des
       doigts qui s'écartent sont tenus par les EXTENSEURS. Le mot est retiré,
       comme « grip » l'avait été. */
    v.egal(A.m.musclesDuNom('Écartement des doigts').join(','), 'extenseurs_doigts',
           'des doigts qui s’écartent, ce sont les extenseurs');
    v.egal(A.m.musclesDuNom('Flexion des doigts').join(','), 'flechisseurs_doigts',
           'et des doigts qui se plient, les fléchisseurs');
    v.egal(A.m.musclesDuNom('Fermeture de la main').join(','),
           'flechisseurs_doigts,long_flechisseur_pouce,'
         + 'court_flechisseur_pouce,adducteur_pouce,'
         + 'court_flechisseur_auriculaire,lombricaux',
           'la main qui se ferme aussi');

    /* Ce qui NE doit PAS proposer : un mot ambigu ne désigne pas un muscle. */
    v.egal(A.m.musclesDuNom('Curl').length, 0,
           '« curl » tout seul ne propose RIEN — marteau, pronateur et wrist curl '
         + 'ne travaillent pas la même chose');
    v.egal(A.m.musclesDuNom('Poulie haute').length, 0, 'un outil ne désigne pas un muscle');
    v.egal(A.m.musclesDuNom('').length, 0, 'un nom vide ne propose rien');
    v.egal(A.m.musclesDuNom(null).length, 0, 'ni l’absence de nom');

    var parNom = A.m.musclesProposes([], null, 'Curl biceps');
    v.egal(parNom.source, 'nom', 'la source est nommée : elle vient du nom');
    var troisSources = A.m.musclesProposes(['cupping'], 'fermee', 'Curl biceps');
    v.egal(troisSources.source, 'mixte', 'trois sources ensemble se disent « mixte »');
    v.vrai(troisSources.muscles.indexOf('biceps') >= 0, 'et les propositions se cumulent');
    v.vrai(troisSources.muscles.indexOf('fcu') >= 0, 'depuis le mouvement');
    v.vrai(troisSources.muscles.indexOf('flechisseurs_doigts') >= 0, 'et depuis la prise');

    /* --- ce que chaque muscle mobilise --- */
    v.egal(A.m.ARTICULATIONS.length, 6, 'six articulations nommées');
    v.egal(A.m.nomArticulation('avant_bras'), 'Rotation de l’avant-bras',
           'la rotation de l’avant-bras en est une — c’est elle que travaille la pronation');
    v.egal(A.m.nomArticulation('zzz'), '', 'une articulation inconnue ne rend rien');
    var sansArt = A.m.MUSCLES.filter(function (m) {
      return !A.m.nomArticulation(m.articulation);
    }).map(function (m) { return m.nom; });
    v.egal(sansArt.length, 0,
           'chaque muscle dit ce qu’il mobilise (muets : ' + (sansArt.join(', ') || 'aucun') + ')');
    var sansQuoi = A.m.MUSCLES.filter(function (m) { return !m.quoi; }).map(function (m) { return m.nom; });
    v.egal(sansQuoi.length, 0,
           'et chacun dit ce qu’il fait (muets : ' + (sansQuoi.join(', ') || 'aucun') + ')');
    /* Les barres n'ont pas la place des noms entiers : chaque muscle doit
       avoir un nom court, et deux muscles ne peuvent pas porter le même —
       sur un graphique, deux lignes « Fléch. » ne se distinguent plus. */
    var sansCourt = A.m.MUSCLES.filter(function (m) { return !m.court; })
                               .map(function (m) { return m.nom; });
    v.egal(sansCourt.join(', '), '', 'chaque muscle a un nom court pour les barres');
    var courts = A.m.MUSCLES.map(function (m) { return m.court; });
    v.egal(courts.filter(function (x, i) { return courts.indexOf(x) !== i; }).join(', '), '',
           'et deux muscles ne portent pas le même');
    v.egal(A.m.nomCourtMuscle('ecrb'), 'Court ext. radial', 'le nom court se lit par identifiant');

    /* --- le nom latin ---
       Le latin n'est pas de la décoration : c'est le nom sous lequel le
       muscle existe partout ailleurs qu'ici. */
    var sansLatin = A.m.MUSCLES.filter(function (m) { return !m.latin; })
                               .map(function (m) { return m.nom; });
    v.egal(sansLatin.join(', '), '', 'chaque muscle porte son nom latin');

    /* --- l'illustration propre à chaque muscle ---
       Le membre entier, ce muscle-là en rouge. C'est ce que le découpage
       essayait de fabriquer sans y arriver : ici la forme est juste par
       construction. Un fichier annoncé mais absent donnerait une image
       cassée que personne ne verrait avant le téléphone. */
    v.egal(A.m.musclesSansImage().join(', '), '',
           'les vingt-deux muscles ont leur illustration propre (sans : '
         + (A.m.musclesSansImage().join(', ') || 'aucun') + ')');
    var malFichu = A.m.MUSCLES.filter(function (m) {
      return m.image && m.image.indexOf('icones/muscle-') !== 0;
    }).map(function (m) { return m.id; });
    v.egal(malFichu.join(', '), '', 'chaque illustration est rangée au même endroit');
    v.egal(A.m.imageDuMuscle('fcu'), 'icones/muscle-fcu.png',
           'l’illustration se lit par identifiant');
    v.egal(A.m.imageDuMuscle('zzz'), null,
           'un muscle inconnu rend null, pas une chaîne vide trompeuse');


    v.egal(A.m.nomCourtMuscle('zzz'), '', 'et un inconnu ne rend rien');
    var tropLong = A.m.MUSCLES.filter(function (m) { return m.court.length > 18; })
                              .map(function (m) { return m.court; });
    v.egal(tropLong.join(', '), '', 'aucun nom court ne dépasse 18 signes');

    var idsM = A.m.MUSCLES.map(function (m) { return m.id; });
    v.egal(idsM.filter(function (x, i) { return idsM.indexOf(x) !== i; }).join(','), '',
           'aucun identifiant en double');

    /* --- un carnet d'avant : l'identifiant disparu se convertit --- */
    v.egal(A.m.muscles({ muscles: ['extenseurs_poignet'] }).join(','), 'ecrl,ecrb',
           '« extenseurs du poignet » désignait les DEUX radiaux : il devient les deux, '
         + 'plutôt que de disparaître du carnet');
    v.egal(A.m.muscles({ muscles: ['extenseurs_poignet', 'ecrl'] }).join(','), 'ecrl,ecrb',
           'et sans doubler celui qui était déjà là');

    /* L'ordre est celui du tableau, jamais celui de la saisie. */
    v.egal(A.m.muscles({ muscles: ['fcu', 'triceps'] }).join(','), 'triceps,fcu',
           'les muscles sont remis dans l’ordre du tableau — de l’épaule vers la main, '
         + 'quel que soit l’ordre de saisie');
    v.egal(A.m.muscles({ muscles: ['fcu', 'fcu'] }).join(','), 'fcu', 'sans doublon');
    v.egal(A.m.muscles({ muscles: ['zzz'] }).length, 0, 'et sans inconnu');
    v.egal(A.m.muscles({}).length, 0, 'un exercice sans muscle n’en a aucun — pas de défaut');

    /* --- le comptage --- */
    function exoM(nom, muscles, cote, n) {
      var series = [];
      for (var i = 0; i < (n || 1); i++) series.push(serie('normale', 20, 10));
      var x = exo(nom, series);
      x.muscles = muscles;
      x.cote = cote;
      return x;
    }

    var e = etatAvec([
      seance(jourIlYA(1), [
        exoM('Curl droit', ['biceps', 'fcu'], 'droit', 3),
        exoM('Barre', ['biceps'], 'deux', 2),
        exoM('Sans muscle', [], 'droit', 4)
      ])
    ]);
    var c = A.m.chargeParMuscle(e, 28);
    v.egal(c.parMuscle.biceps, 5, 'les séries validées se comptent par muscle');
    v.egal(c.parMuscle.fcu, 3, 'chacun le sien');
    v.egal(c.parMuscle.triceps, 0, 'un muscle jamais sollicité vaut ZÉRO, pas undefined');
    v.egal(c.sansMuscle, 4,
           'et les séries d’un exercice sans muscle sont comptées À PART — '
         + 'elles ne sont nulle part sur la carte, et l’écran le dit');
    v.egal(c.parCote['biceps|droit'], 5, '« les deux » compte à droite…');
    v.egal(c.parCote['biceps|gauche'], 2, '…et à gauche, comme pour les structures');
    v.egal(c.parRegion.bras_av, 5, 'les régions du schéma additionnent leurs muscles');

    /* Ce qui est mobilisé : un muscle ne compte que pour SON articulation. */
    var arts = A.m.chargeParArticulation(e, 28);
    function art(id) { return arts.filter(function (x) { return x.articulation === id; })[0]; }
    v.egal(arts.length, A.m.ARTICULATIONS.length, 'chaque articulation a sa ligne');
    v.egal(art('coude').series, 5, 'le biceps fléchit le coude');
    v.egal(art('poignet').series, 3, 'le fléchisseur ulnaire plie le poignet');
    v.egal(art('pouce').series, 0, 'une articulation jamais mobilisée vaut ZÉRO, pas rien');
    v.egal(art('coude').nom, 'Coude', 'et la ligne porte son nom lisible');
    v.vrai(art('coude').part > art('poignet').part, 'la part relative se calcule');

    /* Le piège : trois muscles du coude cochés sur le même exercice ne font
       pas trois fois le travail. Une série se compte UNE fois par
       articulation, sinon le total dépasse le nombre de séries faites. */
    var deuxDuCoude = etatAvec([
      seance(jourIlYA(1), [exoM('Curl marteau', ['biceps', 'brachial', 'brachio_radial'], 'droit', 4)])
    ]);
    var a2 = A.m.chargeParArticulation(deuxDuCoude, 28);
    v.egal(a2.filter(function (x) { return x.articulation === 'coude'; })[0].series, 4,
           'quatre séries restent quatre, même avec trois muscles du coude cochés');
    v.egal(a2.reduce(function (t, x) { return t + x.series; }, 0), 4,
           'et le total ne dépasse pas les séries réellement faites');

    /* Mais un exercice qui mobilise DEUX articulations compte pour les deux. */
    var deuxArts = etatAvec([
      seance(jourIlYA(1), [exoM('Cupping', ['fcu', 'flechisseurs_doigts'], 'droit', 4)])
    ]);
    var a3 = A.m.chargeParArticulation(deuxArts, 28);
    v.egal(a3.filter(function (x) { return x.articulation === 'poignet'; })[0].series, 4,
           'le poignet compte ses quatre séries…');
    v.egal(a3.filter(function (x) { return x.articulation === 'doigts'; })[0].series, 4,
           '…et les doigts aussi : l’exercice fait travailler les deux');
    v.egal(A.m.chargeParArticulation(etatAvec([]), 28).filter(function (x) {
      return x.part !== 0;
    }).length, 0, 'un carnet vide ne donne aucune part — pas de division par zéro');

    /* L'épicondyle médial : le lien avec la douleur, sans saisie de plus. */
    var ep = A.m.chargeEpicondyle(e, 28);
    v.egal(ep.medial, 3, 'ce qui tire sur l’épicondyle médial se compte tout seul');
    v.egal(ep.musclesMedial.join(','), 'Fléchisseur ulnaire du carpe', 'et se nomme');
    v.egal(ep.lateral, 0, 'le latéral reste à zéro ici');

    /* Et ce qui n'est PAS médial ne doit pas y entrer. Le contrôle
       d'au-dessus ne couvrait que le drapeau ; celui-ci couvre le COMPTE,
       là où une erreur ferait accuser la mauvaise insertion. */
    var pronat = etatAvec([
      seance(jourIlYA(1), [
        exoM('Pronation', ['carre_pronateur'], 'droit', 6),
        exoM('Supination', ['supinateur'], 'droit', 2)
      ])
    ]);
    var ep2 = A.m.chargeEpicondyle(pronat, 28);
    v.egal(ep2.medial, 0,
           'le carré pronateur ne tire PAS sur l’épicondyle médial : il est distal, '
         + 'et le compter là ferait accuser la mauvaise insertion');
    v.egal(ep2.lateral, 2, 'le supinateur, lui, compte bien du côté latéral');

    /* La récupération COMPTE ici, et c'est voulu : cent répétitions
       d'élastique chargent le fléchisseur, même hors du tonnage. */
    var avecRecup = A.store.vide();
    avecRecup.seances = [{
      id: 'r1', type: 'recup', date: jourIlYA(1), heure: jourIlYA(1) + 'T20:00:00.000Z',
      note: '', douleurs: [],
      exercices: [{ id: 'xr', ordre: 0, nom: 'Élastique', slug: 'elastique', aw: false,
                    typeCharge: 'elastique', colonnes: ['reps'], cote: 'droit', prise: null,
                    muscles: ['ecrb'], forces: [], structures: [], outils: [],
                    consigne: '', reposSecondes: 0,
                    series: [{ id: 'sr', type: 'normale', repsCible: '', chargeCible: '',
                               dureeCible: '', repsReel: '30', chargeReel: '', dureeReel: '',
                               rpe: null, faite: true, faiteA: null }] }]
    }];
    v.egal(A.m.chargeParMuscle(avecRecup, 28).parMuscle.ecrb, 1,
           'la récupération sollicite les muscles, même si elle ne pèse rien');
    v.egal(A.m.volumeParSemaine(avecRecup, 8).length, 0,
           '[temoin] et elle reste hors du volume de travail');

    /* --- le croisement mouvements × muscles --- */
    var e2 = etatAvec([
      seance(jourIlYA(1), [
        (function () {
          var x = exoM('Cup poulie', ['fcu', 'fcr'], 'droit', 4);
          x.forces = ['cupping'];
          return x;
        })()
      ])
    ]);
    var croise = A.m.musclesParMouvement(e2, 28);
    var cupping = croise.filter(function (x) { return x.force === 'cupping'; })[0];
    v.egal(cupping.series, 4, 'un mouvement compte les séries de ses exercices');
    v.egal(cupping.parMuscle.fcu, 4, 'et ce qu’ils font travailler');
    var rising = croise.filter(function (x) { return x.force === 'rising'; })[0];
    v.egal(rising.series, 0, 'un mouvement jamais travaillé vaut zéro, pas rien');
    v.egal(Object.keys(rising.parMuscle).length, 0, 'et ne nomme aucun muscle');
  });

  /* ================================================================
     21. La règle des 24 h

     Ce qui renseigne n'est pas la douleur pendant l'effort — elle est
     presque toujours là — mais si elle est revenue à sa base le lendemain.
     Un relevé est INDÉPENDANT d'une séance, et c'est tout l'objet : le
     lendemain d'une grosse séance est souvent un jour de repos.
     ================================================================ */

  /* ================================================================
     Les réglages d'un outil

     Le même Titan Grip, mousqueton à l'extérieur ou à l'intérieur, ne charge
     pas la même chose. Ce n'est ni un autre outil, ni un autre exercice.
     ================================================================ */
  /* ================================================================
     « Où ça tire ? »

     Les noms des muscles ne parlent pas à qui ne les a pas appris. Une
     perception, si.
     ================================================================ */
  /* ================================================================
     Par semaine et par zone

     Le modele savait compter par zone OU par semaine, jamais les deux. Le
     danger de ce genre d'ajout, c'est qu'il RECOMPTE : deux chemins de calcul
     pour la meme chose finissent par diverger, et personne ne le remarque
     avant de lire deux ecrans cote a cote.
     ================================================================ */
  bloc('Par semaine et par zone', function (v) {
    /* Un carnet fabrique : deux seances de muscu cette semaine, une de
       recuperation, et une seance vieille de trois mois qui doit rester
       DEHORS de la fenetre. */
    function serie() { return { id: A.m.uid('s'), type: 'normale', faite: true,
                                chargeReel: '20', repsReel: '10' }; }
    function exo(nom, muscles, forces) {
      return { id: A.m.uid('e'), nom: nom, slug: A.m.slug(nom), colonnes: ['charge','reps'],
               muscles: muscles, forces: forces || [], series: [serie(), serie()] };
    }
    function jour(n) {
      var d = new Date(); d.setDate(d.getDate() - n);
      var z = function (x) { return (x < 10 ? '0' : '') + x; };
      return d.getFullYear() + '-' + z(d.getMonth()+1) + '-' + z(d.getDate());
    }
    var e = { seances: [
      { id: 'a', type: 'muscu', date: jour(1), heure: '', douleurs: [],
        exercices: [exo('Curl', ['biceps'], ['rising'])] },
      { id: 'b', type: 'muscu', date: jour(10), heure: '', douleurs: [],
        exercices: [exo('Wrist curl', ['fcu','fcr'], ['cupping'])] },
      { id: 'c', type: 'recup', date: jour(3), heure: '', douleurs: [],
        exercices: [exo('Élastique', ['fcu'], [])] },
      { id: 'vieux', type: 'muscu', date: jour(120), heure: '', douleurs: [],
        exercices: [exo('Vieux curl', ['biceps'], ['rising'])] }
    ], exercices: [], programmes: [], outils: [], releves: [] };

    var d8 = A.m.chargeParSemaine(e, 'region', 8);
    v.egal(d8.semaines.length, 8, 'huit semaines rendues, pleines ou vides');
    var prem = d8.semaines[0], dern = d8.semaines[d8.semaines.length - 1];
    v.egal(!!prem && !!dern && prem.semaine < dern.semaine, true,
           'du PLUS ANCIEN au plus récent : c’est une série temporelle');

    /* Une semaine sans séance vaut ZÉRO et reste dans la liste. La faire
       disparaître compresserait le temps : la courbe sauterait par-dessus un
       arrêt et montrerait une régularité qui n’a pas eu lieu. */
    var vides = d8.semaines.filter(function (x) { return x.total === 0; }).length;
    v.vrai(vides > 0, 'une semaine sans séance vaut zéro, elle ne disparaît pas');

    /* LE contrôle de ce bloc : sommer les semaines doit redonner EXACTEMENT
       ce que la fonction d’origine compte sur la même fenêtre. Sinon deux
       écrans du même carnet se contredisent. */
    function sommeAxe(d, cle) {
      var t = 0;
      d.semaines.forEach(function (x) { t += x.par[cle] || 0; });
      return t;
    }
    /* La fenetre ne fait PAS 8 x 7 jours. Les semaines partent d'un LUNDI,
       donc elles couvrent entre 50 et 56 jours selon le jour ou on regarde —
       aujourd'hui, 8 semaines valent ' + joursDepuis(d8.semaines[0].semaine) + ' jours. L'ecrire en dur
       donnait un controle qui tenait par chance : le decor n'avait aucune
       seance dans l'ecart, donc la comparaison fautive ne pouvait pas
       tomber. On DERIVE la fenetre de ce que la fonction a vraiment rendu. */
    function joursDepuis(iso) {
      var a = new Date(iso + 'T00:00:00'), b = new Date();
      b.setHours(0, 0, 0, 0);
      return Math.round((b - a) / 86400000) + 1;
    }
    var jours = joursDepuis(d8.semaines[0].semaine);
    v.vrai(jours > 7 * 7 && jours <= 8 * 7,
           'huit semaines ISO couvrent entre 50 et 56 jours, pas 56 tout rond');
    var ref = A.m.chargeParMuscle(e, jours).parRegion;
    var ecarts = [];
    d8.cles.forEach(function (c) {
      if (sommeAxe(d8, c.id) !== ref[c.id]) {
        ecarts.push(c.id + ' : ' + sommeAxe(d8, c.id) + ' vs ' + ref[c.id]);
      }
    });
    v.egal(ecarts.join(', '), '',
           'la somme des semaines égale chargeParMuscle sur la même fenêtre');

    var mv = A.m.chargeParSemaine(e, 'mouvement', 8);
    var refF = A.m.repartitionForces(e, jours).parForce;
    var ecartsF = [];
    mv.cles.forEach(function (c) {
      if (sommeAxe(mv, c.id) !== refF[c.id]) {
        ecartsF.push(c.id + ' : ' + sommeAxe(mv, c.id) + ' vs ' + refF[c.id]);
      }
    });
    v.egal(ecartsF.join(', '), '',
           'et la somme des mouvements égale repartitionForces');

    /* Les deux axes n’ont PAS le même périmètre de séances, et c’est voulu :
       la récupération charge les fléchisseurs sans être du travail. */
    v.vrai(sommeAxe(d8, 'avant_bras_av') > 0,
           'la récupération compte dans les régions…');
    v.egal(sommeAxe(mv, 'cupping'), 2,
           '…et PAS dans les mouvements : deux séries de muscu, pas trois');

    /* La comparaison dérive de la même source, et de rien d’autre. */
    var cmp = A.m.comparerDeuxPeriodes(e, 'mouvement', 4);
    var rising = cmp.filter(function (x) { return x.id === 'rising'; })[0];
    v.egal(rising.recent, 2, 'le rising de ces quatre semaines');
    v.egal(rising.precedent, 0, 'contre les quatre précédentes');
    v.egal(rising.ecart, 2, 'et l’écart entre les deux');

    /* Une zone JAMAIS travaillée n’a pas « stagné » : elle est absente, et un
       écart de 0 se lirait comme une stabilité. */
    var jamais = cmp.filter(function (x) { return x.id === 'side_pressure'; })[0];
    v.egal(jamais.recent + jamais.precedent, 0, 'le side pressure n’a jamais servi');
    v.egal(jamais.ecart, null, 'son écart est null, pas zéro : il n’a pas stagné');

    /* La BORDURE elle-meme, et pas un jour approchant : une seance posee sur
       le premier lundi doit etre DEDANS, celle de la veille DEHORS. Les deux
       dates sont calculees depuis ce que la fonction a rendu, donc le
       controle mesure la meme chose quel que soit le jour ou il tourne. */
    function veille(iso) {
      var d = new Date(iso + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      var z = function (x) { return (x < 10 ? '0' : '') + x; };
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
    }
    /* Un fait ABSOLU, qui ne se lit pas dans la sortie de la fonction : une
       semaine commence un LUNDI, et deux semaines voisines sont a sept jours.
       Les deux controles qui suivent tiraient leur bordure du resultat
       meme — ils la mesuraient contre elle-meme et ne pouvaient pas tomber.
       Vu le 2026-10-22 : la semaine passee au DIMANCHE ne les faisait pas
       bouger d'un pouce. */
    var liste = (d8.semaines || []).filter(function (x) { return x && x.semaine; });
    v.egal(liste.length, 8, 'huit semaines exploitables, avant de mesurer leurs bords');
    var pasLundi = liste.map(function (x) { return x.semaine; })
      .filter(function (iso) { return new Date(iso + 'T00:00:00').getDay() !== 1; });
    v.egal(pasLundi.join(','), '', 'chaque semaine rendue commence un LUNDI');
    var pasSept = [];
    for (var k = 1; k < liste.length; k++) {
      var p0 = new Date(liste[k-1].semaine + 'T00:00:00');
      var p1 = new Date(liste[k].semaine + 'T00:00:00');
      if (Math.round((p1 - p0) / 86400000) !== 7) pasSept.push(liste[k].semaine);
    }
    v.egal(pasSept.join(','), '', 'deux semaines voisines sont a SEPT jours');

    var lundi = liste.length ? liste[0].semaine : '1970-01-05';
    function avecSeanceLe(date) {
      var c = { seances: e.seances.concat([
        { id: 'bord', type: 'muscu', date: date, heure: '', douleurs: [],
          exercices: [exo('Curl bordure', ['biceps'], [])] }
      ]), exercices: [], programmes: [], outils: [], releves: [] };
      return sommeAxe(A.m.chargeParSemaine(c, 'region', 8), 'bras_av');
    }
    var sansBord = sommeAxe(d8, 'bras_av');
    v.egal(avecSeanceLe(lundi), sansBord + 2,
           'une seance posee SUR le premier lundi est dans la fenetre');
    v.egal(avecSeanceLe(veille(lundi)), sansBord,
           'celle de la veille en est dehors : la bordure est nette');

    v.egal(A.m.chargeParSemaine(e, 'zzz', 8), null, 'un axe inconnu ne rend rien');

    /* --- les periodes du Suivi ---
       Elles se comptent en SEMAINES parce que tout l'ecran derive de
       chargeParSemaine. Les fonctions qui comptent en jours doivent partir
       du MEME nombre, sinon deux blocs du meme ecran affichent des totaux
       differents sans que rien ne le dise. */
    v.vrai(A.m.PERIODES_SUIVI.length >= 4, 'plusieurs périodes sont proposées');
    var croissantes = A.m.PERIODES_SUIVI.every(function (p, i, t) {
      return i === 0 || p.semaines > t[i - 1].semaines;
    });
    v.vrai(croissantes, 'et elles vont de la plus courte à la plus longue');
    v.egal(A.m.periodeSuivi('1m').semaines, 4, '« 1 mois » vaut quatre semaines');
    /* Un id inconnu — carnet plus vieux, ou plus recent — ne doit pas
       casser l'ecran : il retombe sur le defaut. */
    var horsTable = ['zzz', null, undefined, '', 0, '1 mois'].filter(function (x) {
      return A.m.PERIODES_SUIVI.indexOf(A.m.periodeSuivi(x)) < 0;
    }).length;
    v.egal(horsTable, 0,
           'quoi qu’on demande, on rend une période DE LA TABLE — un carnet '
         + 'd’une autre version ne doit pas casser l’écran');

    /* La valeur attendue se calcule SANS appeler la fonction. La fenetre va
       du lundi d'il y a N-1 semaines jusqu'a aujourd'hui, soit
       (N-1) x 7 + rang + 1 = 7N - 6 + rang, avec lundi = 0.

       Ecrite d'abord « 7N - rang », elle n'etait juste que le JEUDI — le
       jour ou je l'ai ecrite. Elle a passe par coincidence et elle est
       tombee le lendemain. Un DIMANCHE (rang 6), la bonne formule donne
       7N, soit le meme resultat que la formule fautive : le controle est
       alors aveugle, et son libelle le dit. */
    var rangDuJour = (new Date().getDay() + 6) % 7;
    A.m.PERIODES_SUIVI.forEach(function (p) {
      var attendu = p.semaines * 7 - 6 + rangDuJour;
      v.egal(A.m.joursDeLaFenetre(p.semaines), attendu,
             p.nom + ' couvre ' + attendu + ' jours, pas ' + (p.semaines * 7)
           + ' : les semaines partent d’un lundi'
           + (rangDuJour === 6 ? ' — AVEUGLE aujourd’hui, on est dimanche' : ''));
    });
  });

  /* ================================================================
     L'epaule n'est pas le torse

     Separees le 2026-10-22, puis le torse coupe en deux le 2026-10-23. La
     mesure qui l'a decidee : sur les 21 mots d'exercice du carnet qui
     touchent cette zone, AUCUN n'allume deux cotes a la fois —
     « elevation laterale » va a l'epaule, « developpe » au torse avant,
     « tirage » au torse arriere. Fondus, ils rendaient UNE SEULE ligne, et
     un tirage y annulait un developpe.

     Ce bloc garde les deux bords. Le premier est le piege de la moitie
     livree : une region declaree sans muscle, ou un muscle range dans un
     groupe qui n'est plus une region, ne se voit NULLE PART a l'ecran —
     la charge disparait en silence.
     ================================================================ */
  bloc('Épaule et torse', function (v) {
    var ids = A.m.REGIONS_MUSCLE.map(function (r) { return r.id; });
    v.egal(ids.indexOf('tronc'), -1,
           '« tronc » n’existe plus : la region fondue a bien ete retiree');
    v.egal(ids.indexOf('torse'), -1,
           '« torse » fondu n’existe plus non plus : il s’est coupe en deux');
    ['epaule', 'torse_av', 'torse_ar'].forEach(function (id) {
      v.vrai(ids.indexOf(id) >= 0, id + ' est une region a part entiere');
    });

    /* Les DEUX SENS, parce qu'une seule direction laisse passer la moitie
       de la faute : un groupe sans region perd sa charge, une region sans
       muscle affiche une ligne qui ne bougera jamais. */
    var groupes = {};
    A.m.MUSCLES.forEach(function (m) {
      groupes[m.groupe] = (groupes[m.groupe] || 0) + 1;
    });
    var orphelins = Object.keys(groupes).filter(function (g) { return ids.indexOf(g) < 0; });
    var vides = ids.filter(function (r) { return !groupes[r]; });
    v.egal(orphelins.join(','), '', 'aucun muscle dans un groupe qui n’est pas une region');
    v.egal(vides.join(','), '', 'aucune region sans muscle');
    v.egal(A.m.MUSCLES.length, 37, 'les 37 muscles sont toujours la');

    /* Les noms courts ne doivent escamoter personne : la liste du contenu
       est DERIVEE des MUSCLES, jamais ecrite a cote. */
    v.egal(A.m.musclesDeLaRegion('bras_ar').join(', '), 'Triceps, Anconé',
           '« Triceps » dit qu’il tient aussi l’ancone');
    v.egal(A.m.musclesDeLaRegion('torse_av').length, 1,
           '« Pectoraux » est EXACT : la region ne tient que lui');
    v.egal(A.m.musclesDeLaRegion('torse_ar').join(', '), 'Dorsal, Trapèze',
           '« Dorsaux » en tient DEUX depuis le 26/10 : le grand dorsal et '
         + 'le trapèze. Le libellé de la région reste « Dorsaux », et c’est '
         + 'ce contrôle qui dira si un troisième entre sans qu’on le nomme');

    /* Le nom reste court — c'est le mot de la salle. Il n'est tenable que
       parce que le contenu se dit ailleurs : ce controle garde la LISTE,
       et le banc d'interface garde qu'elle arrive bien a l'ecran. */
    v.egal(A.m.musclesDeLaRegion('bras_av').join(', '), 'Biceps, Brachial',
           '« Biceps » tient aussi le BRACHIAL — le plus fort fléchisseur du '
         + 'coude des deux, et il a son propre mot dans le carnet. Le nom '
         + 'court ne le dit pas : le toucher doit le dire');
    var sansContenu = A.m.REGIONS_MUSCLE.filter(function (r) {
      return !A.m.musclesDeLaRegion(r.id).length;
    }).map(function (r) { return r.id; });
    v.egal(sansContenu.join(','), '',
           'et chaque region sait nommer ce qu’elle contient');

    /* La coupe est anatomique : scapulo-humeral d'un cote, thoraco-humeral
       de l'autre. On la nomme muscle par muscle, sinon « separes » ne veut
       rien dire. */
    function groupeDe(id) {
      var m = A.m.MUSCLES.filter(function (x) { return x.id === id; })[0];
      return m ? m.groupe : null;
    }
    ['deltoide', 'grand_rond', 'subscapulaire', 'coraco_brachial'].forEach(function (id) {
      v.egal(groupeDe(id), 'epaule', id + ' tient a l’omoplate : il est a l’epaule');
    });
    /* Le torse coupe en deux : les deux muscles ne sont pas sur la meme
       FACE, et fondus ils etaient peints de la meme couleur des deux cotes.
       Sur les douze mots du carnet qui les touchent, six vont a l'un, six a
       l'autre, et AUCUN aux deux. */
    v.egal(groupeDe('grand_pectoral'), 'torse_av',
           'le grand pectoral est sur le thorax : torse AVANT');
    v.egal(groupeDe('grand_dorsal'), 'torse_ar',
           'le grand dorsal est sur le dos : torse ARRIERE');

    /* Et la preuve par l'usage : une elevation laterale et un tirage, le
       meme jour, doivent tomber dans DEUX lignes differentes. C'est ce que
       la separation promet a l'ecran — le reste n'est que declaration. */
    function exoMuscle(nom, muscles, n) {
      var series = [];
      for (var i = 0; i < n; i++) series.push(serie('normale', 20, 10));
      var x = exo(nom, series);
      x.muscles = muscles;
      x.cote = 'deux';
      return x;
    }
    var e = etatAvec([
      seance(jourIlYA(1), [
        exoMuscle('Élévation latérale', ['deltoide'], 4),
        exoMuscle('Tirage poulie', ['grand_dorsal'], 6),
        exoMuscle('Développé couché', ['grand_pectoral'], 5)
      ])
    ]);
    var r = A.m.chargeParMuscle(e, 28).parRegion;
    v.egal(r.epaule, 4, 'l’elevation laterale compte a l’epaule');
    v.egal(r.torse_ar, 6, 'le tirage compte au torse ARRIERE');
    v.egal(r.torse_av, 5, 'le developpe couche compte au torse AVANT');
    /* TROIS lignes distinctes la ou il n'y en avait qu'une : c'est ce que la
       separation promet a l'ecran, le reste n'est que declaration. */
    v.egal([r.epaule, r.torse_av, r.torse_ar].filter(function (x, i, t) {
      return t.indexOf(x) === i;
    }).length, 3, 'les trois lignes bougent SEPAREMENT');

    /* La meme chose vue par l'axe du Suivi : si la region neuve n'arrive
       pas jusqu'a chargeParSemaine, le buste l'affichera a zero pour
       toujours sans que rien ne tombe. */
    var sem = A.m.chargeParSemaine(e, 'region', 4);
    var cles = sem.cles.map(function (c) { return c.id; });
    v.egal(cles.length, A.m.REGIONS_MUSCLE.length,
           'l’axe « region » rend AUTANT de cles qu’il y a de regions');
    ['epaule', 'torse_av', 'torse_ar'].forEach(function (id) {
      v.vrai(cles.indexOf(id) >= 0, id + ' arrive jusqu’a la serie par semaine');
    });
    var total = function (id) {
      return sem.semaines.reduce(function (a, x) {
        return a + ((x.par || {})[id] || 0);
      }, 0);
    };
    v.egal(total('epaule'), 4, 'et la charge de l’epaule y est juste');
    v.egal(total('torse_ar'), 6, 'celle du torse arriere aussi');
    v.egal(total('torse_av'), 5, 'celle du torse avant aussi');
  });

  /* ================================================================
     Le retour d'un testeur

     Deux promesses tiennent cet ecran, et ce sont elles qu'on mesure : le
     bloc technique ne porte AUCUNE donnee d'entrainement, et ce qu'on lit
     est exactement ce qui part.
     ================================================================ */
  bloc('Envoyer un retour', function (v) {
    /* Un carnet fabrique avec des noms RECONNAISSABLES : si l'un d'eux
       ressort dans le contexte technique, la promesse est trahie. */
    var e = {
      exercices:  [{ nom: 'Pronation Titan Grip', slug: 'pronation titan grip' },
                   { nom: 'Curl marteau', slug: 'curl marteau' }],
      programmes: [{ nom: 'Semaine lourde' }],
      outils:     [{ nom: 'Poulie basse' }, { nom: 'Gripper N3' }],
      seances:    [{ date: '2026-10-20', note: 'coude douloureux' },
                   { date: '2026-10-21', note: '' },
                   { date: '2026-10-22', note: '' }]
    };
    var decor = { version: '1.21.0', largeur: 320, hauteur: 720, ratio: 3,
                  navigateur: 'Mozilla/5.0 (Linux; Android 13)', installee: true,
                  tailleKo: 42.5, durable: true };
    var ctx = A.m.contexteTechnique(e, decor);

    /* 1. AUCUNE donnee d'entrainement. C'est la promesse de l'ecran. */
    var fuites = ['Pronation Titan Grip', 'Curl marteau', 'Semaine lourde',
                  'Poulie basse', 'Gripper N3', 'coude douloureux', '2026-10-20']
      .filter(function (x) { return ctx.indexOf(x) >= 0; });
    v.egal(fuites.join(', '), '',
           'le contexte ne porte AUCUNE donnée d’entraînement');

    /* 2. Les dix champs sont la, et ils disent les bons nombres. */
    var manquants = A.m.CHAMPS_CONTEXTE.filter(function (c) {
      return ctx.indexOf('- ' + c + ' : ') < 0;
    });
    v.egal(manquants.join(', '), '', 'les dix champs du contexte sont présents');
    v.egal(A.m.CHAMPS_CONTEXTE.length, 10, 'et ils sont bien dix');
    v.vrai(ctx.indexOf('- Séances : 3') >= 0, 'il compte les séances');
    v.vrai(ctx.indexOf('- Exercices connus : 2') >= 0, 'et les exercices');
    v.vrai(ctx.indexOf('- Écran : 320 × 720 px') >= 0, 'il donne la largeur réelle');
    v.vrai(ctx.indexOf('installée') >= 0, 'et dit si l’app est installée');

    /* Un decor vide ne s'invente pas : « non renseigné », jamais une valeur
       par defaut — meme principe que `null` partout ailleurs. */
    var vide = A.m.contexteTechnique({}, {});
    v.vrai(vide.indexOf('- Version : non renseigné') >= 0,
           'ce qui n’est pas connu se DIT, au lieu d’être inventé');
    v.vrai(vide.indexOf('- Séances : 0') >= 0, 'un carnet vide compte zéro, pas rien');

    /* 3. Ce qu'on lit est ce qui part : le texte du testeur ET le bloc. */
    var t = A.m.texteRetour('  le chrono reste affiché  ', ctx);
    v.vrai(t.indexOf('le chrono reste affiché') >= 0, 'le texte du testeur part');
    v.vrai(t.indexOf('- Version : 1.21.0') >= 0, 'et le contexte avec lui');
    v.vrai(t.indexOf('aucune donnée d’entraînement') >= 0,
           'et le texte DIT ce qu’il ne contient pas');

    /* 4. Un retour vide ne part pas : un contexte sans une phrase ouvre un
       ticket que personne ne peut traiter. */
    v.egal(A.m.texteRetour('', ctx), null, 'un retour vide ne part pas');
    v.egal(A.m.texteRetour('   \n  ', ctx), null, 'ni un retour fait d’espaces');
    v.egal(A.m.texteRetour(null, ctx), null, 'ni une saisie absente');

    /* 5. Le lien encode son corps. Un « & » ou un « # » tape dans le retour
       tronquerait le ticket en silence, et personne ne le verrait. */
    var lien = A.m.lienTicket('Retour', 'charge & reps #3 = 50%');
    v.vrai(lien.indexOf('charge%20%26%20reps%20%233') >= 0,
           'le corps du ticket est encodé : « & » et « # » ne le tronquent pas');
    v.egal(lien.indexOf('body=charge & reps'), -1, 'et il ne part jamais brut');
    v.vrai(lien.indexOf(A.m.LIEN_TICKETS) === 0, 'il pointe le dépôt du carnet');

    /* 6. Un texte trop long ne part pas : GitHub refuse l'URL, et ouvrir un
       onglet sur une erreur 414 serait pire que de renvoyer vers « Copier ». */
    var court = A.m.lienTicket('Retour', new Array(500).join('a'));
    v.vrai(!!court, 'un retour ordinaire tient dans un lien');
    var long = A.m.lienTicket('Retour', new Array(A.m.URL_TICKET_MAX + 10).join('a'));
    v.egal(long, null, 'un retour trop long rend null, au lieu d’ouvrir une erreur');
  });

  /* ================================================================
     Les exemples d'une zone chargent bien CETTE zone

     Chaque zone ressentie donne un ou deux exercices en exemple, apres le
     tiret de son aide. Rien ne verifiait qu'ils correspondent : « le wrist
     curl en pronation » illustrait le bord de l'AURICULAIRE alors que ses
     moteurs principaux (ECRL, ECRB) sont du cote du POUCE — et c'etait en
     plus le meme geste que l'exemple d'une autre zone. Releve par MB le
     2026-10-23.

     On ne juge pas a l'oeil : on demande au carnet LUI-MEME ce que le nom
     de l'exemple charge, et on exige que la majorite tombe dans la zone.
     ================================================================ */
  bloc('Les exemples des zones', function (v) {
    var rates = [], juges = 0;
    A.m.ZONES_RESSENTIES.forEach(function (z) {
      var apres = String(z.aide || '').split('—')[1];
      if (!apres) return;
      apres.split(',').forEach(function (brut) {
        var nom = brut.replace(/^\s*(?:les?|la|l’|l')\s*/i, '').trim();
        if (!nom) return;
        var m = A.m.musclesDuNom(nom);
        /* Un exemple que le carnet ne connait pas ne prouve rien : on ne le
           juge pas, et on compte combien on en a vraiment juges. */
        if (!m.length) return;
        juges++;
        var dedans = m.filter(function (id) { return z.muscles.indexOf(id) >= 0; }).length;
        if (dedans * 2 < m.length) {
          rates.push(z.id + ' / « ' + nom + ' » : ' + dedans + ' sur ' + m.length);
        }
      });
    });
    v.vrai(juges >= 5,
           '[temoin] au moins cinq exemples sont reconnus par le carnet, sinon '
         + 'ce bloc ne mesure presque rien (juges : ' + juges + ')');
    v.egal(rates.join(' · '), '',
           'chaque exemple charge MAJORITAIREMENT les muscles de sa zone');
  });

  bloc('Où ça tire', function (v) {
    v.egal(A.m.ZONES_RESSENTIES.length, 13, 'treize zones ressenties');

    var muets = A.m.ZONES_RESSENTIES.filter(function (z) {
      return !z.nom || !z.aide || !(z.muscles || []).length;
    }).map(function (z) { return z.id; });
    v.egal(muets.join(', '), '',
           'chacune a un nom, une explication en mots de tous les jours, et des muscles');

    var fantomes = [];
    A.m.ZONES_RESSENTIES.forEach(function (z) {
      z.muscles.forEach(function (m) { if (!A.m.muscle(m)) fantomes.push(z.id + '/' + m); });
    });
    v.egal(fantomes.join(', '), '', 'et ne nomme aucun muscle inexistant');

    /* L'invariant qui compte : AUCUN muscle ne doit être hors d'atteinte par
       ce chemin, sinon il resterait réservé à qui connaît déjà les noms. */
    var couverts = {};
    A.m.ZONES_RESSENTIES.forEach(function (z) {
      z.muscles.forEach(function (m) { couverts[m] = 1; });
    });
    var horsAtteinte = A.m.MUSCLES.filter(function (m) { return !couverts[m.id]; })
                                  .map(function (m) { return m.nom; });
    v.egal(horsAtteinte.join(', '), '',
           'chaque muscle est atteignable sans connaître son nom (hors d’atteinte : '
         + (horsAtteinte.join(', ') || 'aucun') + ')');

    /* Une zone qui dit « la main part » decrit un mouvement DE LA MAIN. Un
       muscle qui ne traverse que le coude ou l'epaule ne peut pas l'y faire
       partir — il peut s'y faire SENTIR, ce qui n'est pas la meme phrase.
       C'est ce qui a fait sortir le brachio-radial du bord du pouce : il
       s'insere sur le styloide radial et ne traverse que le coude.

       Le controle est volontairement ETROIT. Le champ `articulation` ne
       porte qu'UNE valeur, alors que des muscles en servent deux : le
       biceps y est « coude » et c'est pourtant le plus puissant supinateur,
       d'ou sa place dans « tourner la paume vers le haut ». Une regle large
       le ferait tomber a tort. */
    var horsMain = [];
    A.m.ZONES_RESSENTIES.forEach(function (z) {
      if (String(z.aide || '').indexOf('la main part') < 0) return;
      z.muscles.forEach(function (mid) {
        var m = A.m.muscle(mid);
        if (!m) return;
        if (m.articulation === 'coude' || m.articulation === 'epaule') {
          horsMain.push(z.id + ' / ' + (m.court || m.nom)
                      + ' (n’atteint que le ' + m.articulation + ')');
        } else if (m.intrinseque) {
          horsMain.push(z.id + ' / ' + (m.court || m.nom)
                      + ' (intrinsèque : il bouge un doigt, pas la main)');
        }
      });
    });
    v.egal(horsMain.join(' · '), '',
           'une zone qui dit « la main part » ne tient que des muscles qui '
         + 'agissent sur la main');
    var jugees = A.m.ZONES_RESSENTIES.filter(function (z) {
      return String(z.aide || '').indexOf('la main part') >= 0;
    }).length;
    v.egal(jugees, 2,
           '[temoin] deux zones parlent de la main qui part — sinon ce '
         + 'contrôle ne mesure rien (jugées : ' + jugees + ')');

    /* Le drapeau `intrinseque` : les deux attaches DANS la main. Les
       flechisseurs venus de l'avant-bras ne le portent pas, sinon le
       controle ci-dessus viderait des zones qui ont raison. */
    var intr = A.m.MUSCLES.filter(function (m) { return m.intrinseque; })
                          .map(function (m) { return m.id; }).sort();
    v.egal(intr.length, 9, 'neuf muscles sont intrinsèques à la main');
    v.egal(intr.filter(function (id) {
      return A.m.muscle(id).groupe !== 'main';
    }).join(','), '', 'et tous sont du groupe « main »');
    ['flechisseurs_doigts', 'long_flechisseur_pouce'].forEach(function (id) {
      v.vrai(!A.m.muscle(id).intrinseque,
             id + ' n’est PAS intrinsèque : il vient de l’avant-bras');
    });

    v.egal(A.m.zoneRessentie('bord_pouce').nom, 'Le bord du pouce', 'une zone se lit par id');
    v.egal(A.m.zoneRessentie('zzz'), null, 'et un id inconnu ne rend rien');

    /* Les DEUX seuls deviateurs ulnaires sont l'ECU et le FCU ; l'extenseur
       du petit doigt est extrinseque et passe du cote ulnaire. Les deux
       hypothenariens sont partis le 2026-10-23 : nes du pisiforme et de
       l'hamulus, ils sont entierement en aval du poignet et bougent le
       petit doigt, pas la main. */
    v.egal(A.m.musclesDesZones(['bord_auriculaire']).join(','),
           'fcu,ecu,extenseur_petit_doigt',
           'le bord du petit doigt : les deux ulnaires, et l’extenseur du '
         + 'petit doigt — rien d’intrinsèque');
    v.egal(A.m.musclesDesZones(['serrer']).join(','),
           'flechisseurs_doigts,long_flechisseur_pouce,court_flechisseur_pouce,'
         + 'adducteur_pouce,court_flechisseur_auriculaire,lombricaux',
           'serrer, ce sont les fléchisseurs des doigts, le pouce qui écrase, '
         + 'le petit doigt qui se replie, et les lombricaux qui plient les '
         + 'métacarpo-phalangiennes');

    /* Les lombricaux ont quitte le creux de la paume le 2026-10-23 : AUCUNE
       source ne leur attribue le creux, et le seul lien que les textes font
       avec les « arches palmaires » est VASCULAIRE. Ils sont dans les deux
       zones qui nomment leurs deux actions — flechir les
       metacarpo-phalangiennes, tendre les interphalangiennes. */
    var ouLombricaux = A.m.ZONES_RESSENTIES.filter(function (z) {
      return z.muscles.indexOf('lombricaux') >= 0;
    }).map(function (z) { return z.id; }).sort();
    v.egal(ouLombricaux.join(','), 'ouvrir,serrer',
           'les lombricaux sont dans les deux zones qui nomment leurs deux '
         + 'actions, et plus dans le creux de la paume');

    v.egal(A.m.musclesDesZones(['creux_paume']).join(','),
           'opposant_pouce,opposant_auriculaire,court_palmaire',
           'le creux de la main, ce sont les deux opposants et le court '
         + 'palmaire — les seuls que les sources y attachent');
    v.egal(A.m.musclesDesZones(['paume_bas']).join(','), 'rond_pronateur,carre_pronateur',
           'tourner la paume vers le bas, ce sont les deux pronateurs');

    /* Deux zones se recouvrent : on ne doit pas compter deux fois. */
    var deux = A.m.musclesDesZones(['avb_dessus', 'bord_auriculaire']);
    v.egal(deux.filter(function (x, i) { return deux.indexOf(x) !== i; }).join(','), '',
           'deux zones qui se recouvrent ne donnent pas de doublon');
    v.vrai(deux.indexOf('fcu') >= 0 && deux.indexOf('ecrl') >= 0,
           'et les deux apports sont là');

    var ordre = A.m.musclesDesZones(['tendre_coude', 'epaule']);
    v.egal(ordre.join(','), 'deltoide,coraco_brachial,subscapulaire,triceps,ancone',
           'l’ordre est celui du tableau, pas celui des appuis');

    v.egal(A.m.musclesDesZones(['zzz']).length, 0, 'une zone inconnue n’apporte rien');
    v.egal(A.m.musclesDesZones().length, 0, 'et rien du tout non plus');
  });

  bloc('Réglages d’outil', function (v) {
    var e = A.store.vide();
    A.m.majCatalogueOutils(e, 'Titan Grip Iron Wrist 60', 'Poignées AW');
    A.m.majCatalogueOutils(e, 'Poulie basse', 'Poulies');

    v.egal(A.m.reglagesOutil(e, 'Titan Grip Iron Wrist 60').length, 0,
           'un outil neuf n’a AUCUN réglage — rien n’est supposé');
    v.egal(A.m.reglagesOutil(e, 'Outil inconnu').length, 0,
           'et un outil qui n’existe pas n’en a pas non plus, sans planter');

    var r = A.m.majReglageOutil(e, 'Titan Grip Iron Wrist 60', 'Mousqueton à l’extérieur',
                                ['ecrl', 'ecrb', 'ecu']);
    v.vrai(!!r && !!r.id, 'un réglage se pose et reçoit un identifiant');
    v.egal(r.muscles.join(','), 'ecrl,ecrb,ecu', 'avec les muscles qu’il sollicite');
    v.egal(A.m.reglagesOutil(e, 'Titan Grip Iron Wrist 60').length, 1, 'et il est au catalogue');
    v.egal(A.m.reglagesOutil(e, 'Poulie basse').length, 0,
           'sur CET outil seulement — un réglage n’est pas global');

    A.m.majReglageOutil(e, 'Titan Grip Iron Wrist 60', 'Mousqueton à l’intérieur',
                        ['fcu', 'fcr', 'flechisseurs_doigts']);
    v.egal(A.m.reglagesOutil(e, 'Titan Grip Iron Wrist 60').length, 2, 'un second s’ajoute');

    /* Reposer le MÊME nom met à jour, il n'empile pas : sinon la liste se
       remplirait de doublons au premier enregistrement répété. */
    A.m.majReglageOutil(e, 'Titan Grip Iron Wrist 60', 'Mousqueton à l’extérieur', ['ecu']);
    v.egal(A.m.reglagesOutil(e, 'Titan Grip Iron Wrist 60').length, 2,
           'reposer le même nom MET À JOUR, il n’empile pas');
    v.egal(A.m.trouverReglage(e, 'Titan Grip Iron Wrist 60', 'Mousqueton à l’extérieur')
                .muscles.join(','), 'ecu', 'et les muscles suivent');

    /* Renommer : avec l'identifiant, c'est un renommage ; sans lui, ce serait
       un second réglage à côté de l'ancien. */
    A.m.majReglageOutil(e, 'Titan Grip Iron Wrist 60', 'Dehors', null, r.id);
    v.egal(A.m.reglagesOutil(e, 'Titan Grip Iron Wrist 60').length, 2,
           'renommer par identifiant ne crée pas de second réglage');
    v.egal(A.m.trouverReglage(e, 'Titan Grip Iron Wrist 60', 'Dehors').muscles.join(','), 'ecu',
           'et garde ses muscles : renommer n’est pas recommencer');
    v.egal(A.m.trouverReglage(e, 'Titan Grip Iron Wrist 60', 'Mousqueton à l’extérieur'), null,
           'l’ancien nom ne répond plus');

    v.egal(A.m.majReglageOutil(e, 'Titan Grip Iron Wrist 60', '   '), null,
           'un réglage sans nom ne s’enregistre pas');
    v.egal(A.m.majReglageOutil(e, 'Outil inconnu', 'Quelque chose'), null,
           'et on ne règle pas un outil qui n’existe pas');

    /* --- côté exercice --- */
    var x = A.m.exerciceProgramme({ nom: 'Pronation Titan', outils: ['Titan Grip Iron Wrist 60'] });
    v.egal(A.m.reglageDe(x, 'Titan Grip Iron Wrist 60'), null,
           'un exercice neuf ne retient AUCUN réglage');
    A.m.poserReglage(x, 'Titan Grip Iron Wrist 60', 'Dehors');
    v.egal(A.m.reglageDe(x, 'Titan Grip Iron Wrist 60'), 'Dehors', 'il se pose…');
    v.egal(A.m.outilDit(x, 'Titan Grip Iron Wrist 60'), 'Titan Grip Iron Wrist 60 · Dehors',
           '…et l’outil se DIT avec, sinon deux séances seraient indiscernables au journal');
    A.m.poserReglage(x, 'Titan Grip Iron Wrist 60', '');
    v.egal(A.m.reglageDe(x, 'Titan Grip Iron Wrist 60'), null, 'et il se retire');
    v.egal(A.m.outilDit(x, 'Titan Grip Iron Wrist 60'), 'Titan Grip Iron Wrist 60',
           'l’outil redevient nu');

    /* Décocher l'outil doit emporter son réglage : un réglage sans outil
       s'afficherait tout seul, et personne ne saurait de quoi il parle. */
    A.m.poserReglage(x, 'Titan Grip Iron Wrist 60', 'Dehors');
    v.egal(A.m.reglagesPortes(x).length, 1, '[temoin] le réglage est porté');
    x.outils = [];
    v.egal(A.m.reglagesPortes(x).length, 0,
           'retirer l’outil emporte son réglage : il ne reste pas tout seul');
    var copie = A.m.exerciceProgramme(x);
    v.egal(JSON.stringify(copie.reglages), '{}',
           'et la copie ne le traîne pas non plus');

    x.outils = ['Titan Grip Iron Wrist 60'];
    var copie2 = A.m.exerciceProgramme(x);
    v.egal(A.m.reglageDe(copie2, 'Titan Grip Iron Wrist 60'), 'Dehors',
           'remettre l’outil retrouve son réglage — rien n’avait été effacé');
    var enSeance = A.m.exerciceSeanceVierge(copie2);
    v.egal(A.m.reglageDe(enSeance, 'Titan Grip Iron Wrist 60'), 'Dehors',
           'et la séance qui en part le porte aussi');

    /* --- le catalogue retient le réglage AVEC le nom de l'exercice --- */
    A.m.majCatalogue(e, copie2);
    var auCat = A.m.trouverCatalogue(e, A.m.slug('Pronation Titan'));
    v.egal(A.m.reglageDe(auCat, 'Titan Grip Iron Wrist 60'), 'Dehors',
           'le catalogue retient le réglage avec le nom, comme les muscles');

    /* --- la quatrième source de proposition --- */
    var y = A.m.exerciceProgramme({ nom: 'Travail poignée', outils: ['Titan Grip Iron Wrist 60'] });
    v.egal(A.m.musclesDesReglages(e, y).length, 0, 'sans réglage retenu, rien n’est proposé');
    A.m.poserReglage(y, 'Titan Grip Iron Wrist 60', 'Mousqueton à l’intérieur');
    v.egal(A.m.musclesDesReglages(e, y).join(','), 'fcr,fcu,flechisseurs_doigts',
           'le réglage retenu désigne ses muscles, dans l’ordre du tableau');
    var prop = A.m.musclesProposes([], null, 'Travail poignée', A.m.musclesDesReglages(e, y));
    v.egal(prop.source, 'reglage',
           'et la source est NOMMÉE : elle vient du réglage, pas de l’anatomie');
    v.egal(prop.muscles.join(','), 'fcr,fcu,flechisseurs_doigts', 'avec les bons muscles');
    var mixte = A.m.musclesProposes(['cupping'], null, 'Curl biceps',
                                    A.m.musclesDesReglages(e, y));
    v.egal(mixte.source, 'mixte', 'mêlée à une autre source, elle se dit « mixte »');
    v.vrai(mixte.muscles.indexOf('biceps') >= 0 && mixte.muscles.indexOf('fcr') >= 0,
           'et les deux sources se cumulent');
    /* ---- L'OUTIL, CINQUIEME SOURCE ----
       MB, 2026-10-26 : l'equipement ajoute ses muscles a un exercice qu'on
       a deja. La table ne connait que des TYPES, pas des references : un
       outil inconnu passe sans rien ajouter. */
    var sansOutil = A.m.musclesProposes([], null, 'Pull up', null, []);
    var avecGros = A.m.musclesProposes([], null, 'Pull up', null, ['Fat Gripz']);
    v.egal(avecGros.muscles.filter(function (id) {
             return sansOutil.muscles.indexOf(id) < 0;
           }).join(','), 'fcr,fcu,ecrl,ecrb,ecu',
           'une prise épaisse ajoute les CINQ muscles du poignet : la '
         + 'traction n’en portait aucun, pas même les radiaux — je le '
         + 'croyais, ce contrôle m’a détrompé');
    v.egal(A.m.musclesProposes([], null, 'Travail', null,
                               ['Popeye Pronator']).source, 'outil',
           'et quand l’outil est la SEULE source, le bouton le dira');
    v.egal(A.m.musclesProposes([], null, 'Travail', null,
                               ['Strap Handle 60mm']).muscles.length, 0,
           'un outil que la table ne connaît pas n’ajoute rien : le catalogue '
         + 'd’outils reste implicite');
    v.egal(A.m.musclesDeLOutil(['Multispinner 65mm']).join(','),
           A.m.musclesDeLOutil(['multi spinner']).join(','),
           'la casse et l’orthographe du modèle ne changent rien');

    /* LA GARDE QUI COMPTE : la table cite des entrees du dictionnaire par
       leur NOM. Un renommage — il y en a eu douze le 26/10 — la casserait
       EN SILENCE, puisqu'une entree introuvable n'ajoute simplement rien. */
    var citees = [];
    A.m.OUTILS_CONNUS.forEach(function (k) {
      (k.entrees || []).forEach(function (nom) { citees.push(nom); });
    });
    var fantomes = citees.filter(function (nom) {
      return !A.m.DICTIONNAIRE.some(function (d) { return d.nom === nom; });
    });
    v.egal(fantomes.join(', '), '',
           'chaque entrée citée par la table des outils existe vraiment : '
         + 'un renommage la casserait sans bruit (' + citees.length + ' citées)');
    v.vrai(citees.length >= 5,
           '[temoin] et la table en cite au moins cinq, sinon le contrôle '
         + 'ci-dessus serait vrai pour rien');

    /* ---- LES SIX TYPES VALIDES PAR MB LE 27/10 ----
       Tries sur 228 produits de quatre sites. Ces controles tombent si un
       type perd ses mots, et le dernier tient une regle de LECTURE qu on
       pourrait casser sans la voir. */
    [['Iron Wrist', 5], ['Rolling Handle', 5], ['Wrist Wrench', 10],
     ['Cone handle', 1], ['Eccentric Handle', 4],
     ['Soft & Slippery Handle', 1], ['Thumb Belt', 5]
    ].forEach(function (x) {
      v.egal(A.m.musclesDeLOutil([x[0]]).length, x[1],
             '« ' + x[0] + ' » est reconnu et ajoute ' + x[1] + ' muscle(s)');
    });

    /* La cle de poignet couvre les DEUX sens : le levier fait flechir ET
       etendre. Si elle ne prenait qu un sens, ce controle tomberait. */
    var cle = A.m.musclesDeLOutil(['Wrist Wrench']);
    v.vrai(cle.indexOf('fcr') >= 0 && cle.indexOf('ecrl') >= 0,
           'la clé de poignet prend les fléchisseurs ET les extenseurs : le '
         + 'levier travaille dans les deux sens');

    /* Le pouce ne propose QUE du pouce : un mot trop gourmand se verrait.
       LU PAR BLOC : ce controle etait VRAI A VIDE — en retirant le type, la
       liste devenait vide et le filtre aussi. Il exige donc d abord qu il y
       ait quelque chose a filtrer. */
    v.vrai(A.m.musclesDeLOutil(['Thumb Pump']).length > 0,
           '[temoin] un outil de pouce propose quelque chose — sans quoi le '
         + 'controle suivant serait vrai pour rien');
    v.egal(A.m.musclesDeLOutil(['Thumb Pump']).filter(function (id) {
             return !/pouce/.test(id);
           }).join(','), '',
           'un outil de pouce ne propose que des muscles du pouce');

    /* UN OUTIL PEUT PORTER DEUX MOTS, et il prend alors les deux jeux.
       « Eccentric Round Anti-Toproll » est les deux a la fois, donc c est
       juste — mais c est une regle de lecture, et elle doit etre tenue. */
    var deux = A.m.musclesDeLOutil(['Eccentric Round Anti-Toproll']);
    var exc = A.m.musclesDeLOutil(['Eccentric Handle']);
    var atr = A.m.musclesDeLOutil(['Anti-Toproll V3']);
    /* LU PAR BLOC : la premiere ecriture comparait deux longueurs, et elle
       tenait des que l UN des deux types existait. On exige maintenant
       l UNION des deux — elle ne peut etre vraie que si les DEUX sont la. */
    v.vrai(exc.length > 0 && atr.length > 0,
           '[temoin] les deux types existent — sans quoi l union ci-dessous '
         + 'serait vraie pour rien');
    v.egal(deux.join(','),
           A.m.muscles({ muscles: exc.concat(atr) }).join(','),
           'un outil qui porte DEUX mots connus prend l’UNION des deux jeux, '
         + 'pas le premier trouvé');

    v.egal(A.m.musclesProposes([], null, '', ['zzz']).muscles.length, 0,
           'un muscle inconnu posé sur un réglage ne passe pas');

    /* ---- LA CEINTURE DE JUDO (MB, 27/10) ----

       RECONNU n'est pas PROPOSE DES MUSCLES. Ce type est le seul a etre
       l'un sans l'autre, et c'est la source qui l'impose : trois etudes,
       trois directions. Il entre pour que celui qui tape « ceinture de
       judo » voie que le carnet sait ce que c'est. */
    v.egal(A.m.typesDeLOutil('Ceinture de judo').length, 1,
           'une ceinture de judo est RECONNUE');
    v.egal(A.m.musclesDeLOutil(['Ceinture de judo']).length, 0,
           'et elle ne propose AUCUN muscle — une sangle change ce qu’on '
         + 'tient, pas ce qui travaille');
    v.egal(A.m.typesDeLOutil('Sangle maison').length, 1,
           'le mot « sangle » suffit : du matériel fait maison se reconnaît');
    v.egal(A.m.typesDeLOutil('Poignée sans nom connu').length, 0,
           'et un nom qu’aucun type ne revendique n’est reconnu par rien');

    /* LA CORDE, meme famille : un accessoire de LIAISON ne decide pas du
       geste. MB l'a demontre en la decrivant — « curl, extensions & cie »,
       donc des muscles opposes avec le meme objet. */
    v.egal(A.m.typesDeLOutil('Corde à poulie').length, 1,
           'une corde est RECONNUE');
    v.egal(A.m.musclesDeLOutil(['Corde à poulie']).length, 0,
           'et elle n’ajoute aucun muscle — le même objet sert au curl ET à '
         + 'l’extension, donc à des muscles opposés');
    var sansMuscle = A.m.OUTILS_CONNUS.filter(function (k) {
      return !A.m.musclesDeLOutil([k.mots[0]]).length;
    }).map(function (k) { return k.mots[0]; });
    v.egal(sansMuscle.sort().join(' · '), 'ceinture de judo · corde',
           'DEUX types seulement ne proposent rien, et ce sont les deux '
         + 'accessoires de liaison — toute autre entrée dans cette liste '
         + 'serait un oubli, pas un choix');

    /* UN SEUL ENDROIT DECIDE : si `typesDeLOutil` ne voit rien, ni les
       muscles ni les reglages ne peuvent apparaitre. Les trois etaient
       trois boucles separees avant le 27/10. */
    var muets = ['Poignée sans nom connu', 'zzz', ''];
    v.egal(muets.filter(function (x) {
      return A.m.typesDeLOutil(x).length === 0
          && (A.m.musclesDeLOutil([x]).length || A.m.reglagesProposes(null, x).length);
    }).join(','), '',
           'aucun nom non reconnu ne propose de muscle ni de réglage — la '
         + 'reconnaissance se décide en UN seul endroit');

    /* ---- CE QUE LE CARNET DIT AVOIR LU (MB, 27/10) ----

       « Montre dans l'app quand l'outil est reconnu, meme sans muscle. »
       La ligne nomme les MOTS lus : un verdict nu n'apprend rien. */
    v.egal(A.m.motsReconnus('Titan Grip Iron Wrist 60 mm').join(' · '),
           'iron wrist',
           'le carnet dit QUEL mot il a lu dans le nom');
    v.egal(A.m.motsReconnus('Ceinture de judo').join(' · '), 'ceinture de judo',
           'et il le dit AUSSI quand l’outil n’ajoute aucun muscle — sans '
         + 'quoi une ceinture reconnue ressemblerait à un nom inconnu');
    v.egal(A.m.motsReconnus('Poignée sans nom connu').length, 0,
           'un nom libre ne fait rien dire : le carnet n’impose aucune liste');
    v.egal(A.m.motsReconnus('').length, 0, 'et un nom vide non plus');

    /* UN SEUL MOT PAR TYPE, et le PLUS LONG : « Golden Grip Wrist Wrench »
       touche « wrist wrench » ET « wrench ». Les montrer tous les deux se
       lirait comme deux reconnaissances. */
    v.egal(A.m.motsReconnus('Golden Grip Wrist Wrench').join(' · '),
           'wrist wrench',
           'deux mots du MÊME type ne font qu’une mention, la plus précise');
    v.egal(A.m.motsReconnus('Eccentric Round Anti-Toproll').join(' · '),
           'anti toproll · eccentric',
           'mais deux types DIFFÉRENTS se disent tous les deux');

    /* DIRE et RECONNAITRE ne peuvent pas diverger : une ligne qui se tait
       sur un outil reconnu est exactement le defaut que MB a nomme. */
    var dits = ['Titan Grip Iron Wrist 60 mm', 'Ceinture de judo',
                'Sangle maison', 'Poignée sans nom connu', ''];
    v.egal(dits.filter(function (x) {
      return (A.m.motsReconnus(x).length > 0)
          !== (A.m.typesDeLOutil(x).length > 0);
    }).join(','), '',
           'le carnet dit quelque chose EXACTEMENT quand il a reconnu '
         + 'quelque chose');

    /* ---- LE CATALOGUE DES MARQUES (MB, 27/10) ----

       « Je ne vois que les 4 que j'ai ajoutes a la main. » C'est une
       REFERENCE qu'on parcourt ; elle ne pose rien dans l'equipement. */
    v.egal(A.m.marquesConnues().join(' · '),
           'Golden Grip · Titangrip · Mithril · ARMSPORT',
           'quatre marques, dans l’ordre du relevé');
    v.vrai(A.m.CATALOGUE_MARQUES.length >= 50,
           'et une cinquantaine de références (' + A.m.CATALOGUE_MARQUES.length
         + ')');

    /* IL NE LIVRE RIEN. La regle n 6 du projet tient : un etat neuf a un
       equipement VIDE, catalogue ou pas. */
    var neuf = A.store.vide();
    v.egal(neuf.outils.length, 0,
           'un carnet neuf a un équipement VIDE — le catalogue des marques '
         + 'ne s’y déverse pas');
    A.m.marquesConnues().forEach(function (m) { A.m.produitsDeLaMarque(m); });
    v.egal(neuf.outils.length, 0,
           'et le PARCOURIR ne change rien non plus');

    /* CHAQUE PRODUIT POINTE UN TYPE QUI EXISTE, et son nom est lisible par
       le modele : une reference qu'on ne sait pas lire est une impasse. */
    var clesT = {};
    A.m.OUTILS_CONNUS.forEach(function (k) { clesT[k.mots[0]] = 1; });
    v.egal(A.m.CATALOGUE_MARQUES.filter(function (p) {
      return !clesT[p.c];
    }).map(function (p) { return p.n; }).join(' · '), '',
           'chaque référence pointe une famille qui existe');
    /* ILLISIBLE SE DIT, et ne s'excuse pas. « AXE » est trop generique
       pour qu'un type le revendique : la reference reste au catalogue, mais
       elle porte `libre` et sa fiche dira « nom libre ». */
    v.egal(A.m.CATALOGUE_MARQUES.filter(function (p) {
      return !A.m.typesDeLOutil(p.n).length && !p.libre;
    }).map(function (p) { return p.n; }).join(' · '), '',
           'toute référence que le carnet ne sait pas LIRE porte la marque '
         + '« libre » — un manque nommé, jamais masqué');
    v.egal(A.m.CATALOGUE_MARQUES.filter(function (p) {
      return p.libre && A.m.typesDeLOutil(p.n).length;
    }).map(function (p) { return p.n; }).join(' · '), '',
           'et aucune ne la porte à tort : une marque qui survit à sa raison '
         + 'devient un mensonge');
    v.egal(A.m.CATALOGUE_MARQUES.filter(function (p) { return p.libre; }).length,
           2, '[temoin] deux références sont dans ce cas — les deux lignes '
         + 'de l’AXE, qui est à la fois pronation et rising');

    /* LES FAMILLES ONT UN NOM LISIBLE : sans lui l'ecran affichait
       « fat grip » et « pronator » a qui ouvre son equipement. */
    v.egal(A.m.nomDuType('wrist wrench'), 'Clé de poignet',
           'une famille porte son nom, pas sa clé');
    v.egal(A.m.OUTILS_CONNUS.filter(function (k) {
      return A.m.nomDuType(k.mots[0]) === k.mots[0];
    }).map(function (k) { return k.mots[0]; }).join(' · '), '',
           'et les DIX-SEPT en ont un — une clé qui s’affiche telle quelle '
         + 'est un oubli, pas un choix');

    /* ---- OU CA SE MONTE (MB, 26/10, livre le 27/10) ---- */
    v.egal((A.m.montageDeLOutil('Fat Gripz')[0] || {}).monte || '',
           'Barre, haltères, poignée de poulie, barre de traction — '
         + 'partout où la main entoure un cylindre.',
           'le carnet dit où une prise épaisse se monte');
    /* LA GARDE N'EST PAS DU LUXE : ecrit sans `|| ''`, ce controle a plante
       sous la chute U du 27/10 et emporte TRENTE-NEUF controles du bloc.
       Un controle doit rendre son echec, jamais celui des autres. */
    v.vrai(((A.m.montageDeLOutil('Fat Gripz')[0] || {}).pasSur || '')
           .indexOf('sangle') >= 0,
           'et ce sur quoi elle ne se monte PAS — l’exemple même que MB a '
         + 'donné le 26/10');
    v.egal((A.m.montageDeLOutil('Titan Grip Iron Wrist')[0] || {}).pasSur, null,
           'quand rien n’est connu, `pasSur` vaut null — le carnet se tait '
         + 'au lieu d’inventer');
    v.egal(A.m.montageDeLOutil('Poignée sans nom connu').length, 0,
           'et un nom non reconnu n’a aucun montage à dire');
    v.egal(A.m.montageDeLOutil('Eccentric Round Anti-Toproll').length, 2,
           'un outil qui porte DEUX mots connus dit les DEUX montages');

    /* LES DEUX LISTES SE CORRESPONDENT. Une table a cote qui derive en
       silence est le piege n 5 : l'app se tairait sur « se monte sur » sans
       que rien ne le signale. */
    var sansMontage = A.m.OUTILS_CONNUS.filter(function (k) {
      return !A.m.MONTAGE[k.mots[0]];
    }).map(function (k) { return k.mots[0]; });
    var vusT = {};
    A.m.OUTILS_CONNUS.forEach(function (k) { vusT[k.mots[0]] = 1; });
    var orphelins = Object.keys(A.m.MONTAGE).filter(function (c) {
      return !vusT[c];
    });
    v.vrai(A.m.OUTILS_CONNUS.length > 0 && Object.keys(A.m.MONTAGE).length > 0,
           '[temoin] les deux tables existent — sans quoi l’égalité '
         + 'ci-dessous serait vraie pour rien');
    v.egal(sansMontage.concat(orphelins).join(' · '), '',
           'chaque type a son montage, et aucun montage ne survit à son type');

    /* ---- « SANGLE » A QUITTE LES MOUVEMENTS ----

       MB : « on va retirer pour les mouvements ceux qui ont sangle ».
       MESURE : aucune ENTREE ne portait ce nom — cinq ECRITURES seulement,
       et les cinq mouvements restent. */
    var sangles = [];
    A.m.DICTIONNAIRE.forEach(function (d) {
      if (/sangle/i.test(d.nom)) sangles.push(d.nom);
      (d.aussi || []).forEach(function (a) {
        if (/sangle/i.test(a)) sangles.push(d.nom + ' ← ' + a);
      });
    });
    v.egal(sangles.join(' · '), '',
           'plus aucun mouvement ne s’écrit « à la sangle » : la sangle est '
         + 'un équipement, pas un geste');
    v.egal(A.m.suggestionsDictionnaire('sangle', []).length, 0,
           'et le dictionnaire ne propose plus rien sur ce mot');

    /* MAIS LA LECTURE TIENT, et c'est ce qui rend le retrait sans douleur :
       l'ecriture a disparu du dictionnaire, pas la capacite de lire le nom
       que quelqu'un aura deja tape dans son carnet. */
    v.vrai(A.m.musclesDuNom('Rising').length > 0,
           '[temoin] le rising se lit — sans quoi l’égalité suivante serait '
         + 'vraie pour rien');
    v.egal(A.m.musclesDuNom('Rising à la sangle').join(','),
           A.m.musclesDuNom('Rising').join(','),
           'un exercice déjà nommé « Rising à la sangle » se LIT encore '
         + 'pareil : c’est l’écriture du dictionnaire qui part, pas la '
         + 'lecture');

    /* --- retirer --- */
    var id2 = A.m.trouverReglage(e, 'Titan Grip Iron Wrist 60', 'Mousqueton à l’intérieur').id;
    v.vrai(A.m.supprimerReglageOutil(e, 'Titan Grip Iron Wrist 60', id2), 'un réglage se retire');
    v.egal(A.m.reglagesOutil(e, 'Titan Grip Iron Wrist 60').length, 1, 'et il n’est plus là');
    v.egal(A.m.reglageDe(y, 'Titan Grip Iron Wrist 60'), 'Mousqueton à l’intérieur',
           'mais l’exercice qui le portait GARDE sa mention — on n’efface pas '
         + 'ce qui a été fait');
    v.egal(A.m.musclesDesReglages(e, y).length, 0,
           'il ne propose simplement plus rien');
    v.egal(A.m.supprimerReglageOutil(e, 'Titan Grip Iron Wrist 60', 'zzz'), false,
           'retirer un réglage inconnu ne fait rien, et le dit');

    /* --- deux entrées que seule une espace sépare ---
       « Titan Grip Iron Wrist 60 » et « TitanGripIronWrist60 » sont DEUX
       outils, et c'est voulu :
       fusionner des noms au jugé renommerait du matériel dans le dos de qui
       l'a saisi. Mais déclarer un réglage sur l'un pendant que l'exercice
       porte l'autre est une panne silencieuse, et l'app doit la nommer. */
    A.m.majCatalogueOutils(e, 'TitanGripIronWrist60', 'Poignées AW');
    v.egal(A.m.reglagesOutil(e, 'TitanGripIronWrist60').length, 0,
           '[temoin] le jumeau n’hérite d’aucun réglage');
    var voisin = A.m.outilProche(e, 'TitanGripIronWrist60');
    v.vrai(!!voisin, 'l’app repère l’entrée voisine qui en porte');
    v.egal(voisin && voisin.nom, 'Titan Grip Iron Wrist 60', 'et dit laquelle');
    v.egal(A.m.outilProche(e, 'Titan Grip Iron Wrist 60'), null,
           'un outil qui a déjà ses réglages n’a pas de voisin à proposer');
    v.egal(A.m.outilProche(e, 'Poulie basse'), null,
           'ni un outil dont aucun jumeau n’existe');
    v.egal(A.m.outilProche(e, ''), null, 'et un nom vide ne rapproche rien');

    /* ---- LES POSITIONS QUE LE TYPE SUGGERE (MB, 27/10) ----

       « Propose les trois positions de mousqueton en reglages. » Elles sont
       SUGGEREES, jamais creees : le catalogue ne se remplit qu'a son
       enregistrement. */
    var f = A.store.vide();
    A.m.majCatalogueOutils(f, 'Golden Grip Wrist Wrench', 'Poignées AW');
    A.m.majCatalogueOutils(f, 'Poulie basse', 'Poulies');

    v.egal(A.m.reglagesProposes(f, 'Golden Grip Wrist Wrench').join(' · '),
           'Mousqueton au centre · Mousqueton à l’extérieur'
         + ' · Mousqueton à l’intérieur',
           'une clé de poignet SUGGÈRE les trois positions de mousqueton');
    v.egal(A.m.reglagesProposes(f, 'Poulie basse').length, 0,
           'un outil dont le type n’en porte pas n’en suggère aucune');
    /* CE CONTROLE DISAIT HIER « la poignee a rotation libre n'en suggere
       aucune », et il est TOMBE le 27/10 quand elle a recu les siennes. Il
       avait raison de tomber. Ce qu'il voulait dire — la suggestion vient
       du TYPE, pas de l'idee qu'un outil se regle — se mesure maintenant
       sur un outil dont le type n'en porte pas. */
    v.egal(A.m.reglagesProposes(f, 'Pince de Mithril').length, 0,
           'un bloc de pince n’en suggère aucune — la suggestion vient du '
         + 'TYPE, pas de l’idée qu’un outil se règle');
    /* Celui-la, je ne l'ai PAS vu tomber le 27/10, et c'est pourquoi il
       porte son etiquette : un nom vide sort avant toute lecture, et aucune
       panne plausible de la suggestion ne le fait bouger. Il tient des deux
       cotes, et il est la pour qu'un nom vide ne plante jamais. */
    v.egal(A.m.reglagesProposes(f, '').length, 0,
           '[temoin] un nom vide ne suggère rien — il sort avant toute '
         + 'lecture, et ce cas tient des deux côtés');

    /* SUGGERER n'est pas CREER. C'est la regle de l'app, et elle se mesure. */
    v.egal(A.m.reglagesOutil(f, 'Golden Grip Wrist Wrench').length, 0,
           'et les lire ne les CRÉE pas — le catalogue de l’outil reste vide');

    /* Reproposer celle qu'on vient de prendre est la facon la plus sure d'en
       obtenir deux. */
    A.m.majReglageOutil(f, 'Golden Grip Wrist Wrench', 'Mousqueton au centre', []);
    v.egal(A.m.reglagesProposes(f, 'Golden Grip Wrist Wrench').join(' · '),
           'Mousqueton à l’extérieur · Mousqueton à l’intérieur',
           'une position déjà posée n’est plus suggérée');
    v.egal(A.m.reglagesProposes(null, 'Golden Grip Wrist Wrench').length, 3,
           'sans état, les trois restent — la fonction se mesure seule');

    /* POURQUOI AUCUN MUSCLE N'EST POSE DESSUS, et c'est mesure : tout ce
       qu'un bord accentue est DEJA dans ce que la cle propose. Ce controle
       tombe si les entrees du type changent — et la note du modele devient
       fausse le meme jour. */
    function duDico(nom) {
      var t = A.m.DICTIONNAIRE.filter(function (d) { return d.nom === nom; });
      return t.length ? t[0].muscles.slice() : [];
    }
    var cle = A.m.musclesDeLOutil(['Golden Grip Wrist Wrench']);
    var bords = duDico('Rising').concat(duDico('Déviation ulnaire'));
    v.vrai(cle.length > 0 && duDico('Rising').length > 0
        && duDico('Déviation ulnaire').length > 0,
           '[temoin] la clé et les deux bords ont chacun leurs muscles — sans '
         + 'quoi l’inclusion ci-dessous serait vraie pour rien');
    v.egal(bords.filter(function (m) { return cle.indexOf(m) < 0; }).join(','), '',
           'les deux bords sont DÉJÀ dans les muscles de la clé : un muscle '
         + 'posé sur la position n’ajouterait rien à la proposition');

    /* ---- ET L'IRON WRIST EN PORTE AUSSI (MB, 27/10) ----

       « Regarde les photos, tu as oublie des equipements. » Il avait
       raison. Les noms different de ceux de la cle, et c'est voulu : la
       platine a ses trous EMPILES, pas lateraux. */
    A.m.majCatalogueOutils(f, 'Titan Grip Iron Wrist 60 mm', 'Poignées AW');
    v.egal(A.m.reglagesProposes(f, 'Titan Grip Iron Wrist 60 mm').join(' · '),
           'Mousqueton au centre · Mousqueton à l’extérieur'
         + ' · Mousqueton à l’intérieur',
           'une poignée à rotation libre suggère les trois positions');
    v.egal(A.m.reglagesProposes(f, 'Rolling Handle').join(' · '),
           'Mousqueton au centre · Mousqueton à l’extérieur'
         + ' · Mousqueton à l’intérieur',
           'et le rolling handle aussi — c’est le TYPE qui les porte, pas '
         + 'le produit');

    /* CE CONTROLE DISAIT L'INVERSE jusqu'au 27/10 : « les deux types ne
       partagent AUCUN nom ». J'avais donne a la poignee son propre
       vocabulaire — « en haut / au milieu / en bas » — parce que ses trous
       sont empiles. MB a tranche pour un vocabulaire unique, avec
       l'argument qui me manquait : il TIENT l'outil, et la platine est au
       cote de la main. Le controle mesure donc maintenant l'UNIFORMITE,
       et il tombe si quelqu'un redonne un vocabulaire propre a un type. */
    var cleP = A.m.reglagesProposes(null, 'Golden Grip Wrist Wrench');
    var ironP = A.m.reglagesProposes(null, 'Iron Wrist');
    v.vrai(cleP.length === 3 && ironP.length === 3,
           '[temoin] les deux types en suggèrent bien trois — sans quoi '
         + 'l’égalité suivante serait vraie pour rien');
    v.egal(ironP.join(' · '), cleP.join(' · '),
           'les deux types disent les positions avec les MÊMES mots : on ne '
         + 'réapprend pas le même réglage d’un outil à l’autre');

    /* ET D'UNE SEULE LISTE : deux copies du meme trio auraient derive au
       premier ajout. */
    v.egal(A.m.POSITIONS_MOUSQUETON.join(' · '), cleP.join(' · '),
           'et ces mots viennent d’UNE seule liste, pas d’une copie par type');

    /* ET AUCUNE NE PORTE DE MUSCLE, sur l'un comme sur l'autre : sur la
       cle parce qu'ils y sont deja, ici parce qu'aucune source ne dit quel
       trou charge quel bord. Le controle mesure la CONSEQUENCE — poser une
       position ne change pas ce qui est propose. */
    var g = A.store.vide();
    A.m.majCatalogueOutils(g, 'Iron Wrist', 'Poignées AW');
    var exo = { nom: 'Essai', outils: ['Iron Wrist'], reglages: {} };
    var avant = A.m.musclesProposes([], null, exo.nom,
                                    A.m.musclesDesReglages(g, exo),
                                    exo.outils);
    A.m.majReglageOutil(g, 'Iron Wrist', 'Mousqueton en haut', []);
    A.m.poserReglage(exo, 'Iron Wrist', 'Mousqueton en haut');
    var apres = A.m.musclesProposes([], null, exo.nom,
                                    A.m.musclesDesReglages(g, exo),
                                    exo.outils);
    v.vrai(avant.muscles.length > 0 && avant.source === 'outil',
           '[temoin] l’outil seul propose quelque chose, et le dit — sans '
         + 'quoi les deux contrôles suivants seraient vrais pour rien');
    v.egal(apres.muscles.join(','), avant.muscles.join(','),
           'poser une position NE CHANGE PAS les muscles proposés : elle '
         + 'est une étiquette, et le carnet ne devine pas le bord chargé');
    /* ET C'EST LA MESURE QUI COMPTE : l'egalite ci-dessus tient meme si le
       reglage herite des muscles de l'outil — l'union est la meme. Ecrite
       seule, elle etait VERTE sous la chute du 27/10, donc vide. La SOURCE,
       elle, bouge : un reglage qui apporte quelque chose fait passer le
       bouton de « d'apres l'outil » a « d'apres ce qui est renseigne », et
       l'utilisateur perd la raison de ce qu'on lui propose. */
    v.egal(apres.source, 'outil',
           'et la proposition vient TOUJOURS de l’outil seul : une position '
         + 'qui apporterait des muscles ferait basculer le libellé en '
         + '« ce qui est renseigné »');

    /* --- un carnet d'AVANT, sans la notion --- */
    var vieux = { nom: 'Vieux', outils: ['Dumbbell'] };
    v.egal(A.m.reglageDe(vieux, 'Dumbbell'), null,
           'un exercice d’avant n’a pas de réglage, et ne plante pas');
    v.egal(A.m.outilDit(vieux, 'Dumbbell'), 'Dumbbell', 'son outil se dit nu');
    v.egal(A.m.reglagesPortes(vieux).length, 0, 'et il n’en porte aucun');
  });

  /* ---------------------------------------------------------------
     UN SPARRING OU RIEN N'A ETE ECRIT

     MB, 27/10 : « un sparring neuf ferme sans rien ecrire ne doit rien
     laisser ». Le predicat vit au modele : il ne depend d'aucun ecran.
     --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     CE NOM EST-IL AU DICTIONNAIRE ?

     MB, 28/10 : « seuls mes exos crees de ma main, car pas presents dans
     le dico, doivent etre visibles ». Le predicat vit au modele : il ne
     depend d'aucun ecran.
     --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     LES SERIES FAITES, RESUMEES

     MB, 28/10 : « je ne vois que l'exo >> 50 reps, et c'est tout […] il
     faudrait : Side Pressure  4x50 reps ». La carte du journal lisait
     `(ex.series || [])[0]` : quatre series identiques se disaient comme
     une seule.
     --------------------------------------------------------------- */
  bloc('Résumé des séries faites', function (v) {
    function exo(nom, cols, n) {
      var e = A.m.exerciceProgramme({ nom: nom, colonnes: cols });
      e.series = [];
      for (var i = 0; i < n; i++) e.series.push(A.m.serieSeanceVierge());
      return e;
    }

    var a = exo('Side pressure', ['reps'], 4);
    a.series.forEach(function (s) { s.repsReel = '50'; s.faite = true; });
    v.egal(A.m.resumeSeriesFaites(a), '4 × 50 reps',
           'quatre séries identiques se disent « 4 × 50 reps » — c’est la '
         + 'forme que MB a demandée');

    var b = exo('Pronation', ['reps'], 1);
    b.series[0].repsReel = '30'; b.series[0].faite = true;
    v.egal(A.m.resumeSeriesFaites(b), '30 reps',
           'une seule série ne s’annonce pas « 1 × » : le compte ne sert '
         + 'qu’à partir de deux');

    var c = exo('Curl', ['reps'], 2);
    c.series[0].repsReel = '12'; c.series[0].faite = true;
    c.series[1].repsReel = '10'; c.series[1].faite = true;
    v.egal(A.m.resumeSeriesFaites(c), '12 reps  10 reps',
           'des séries DIFFÉRENTES se listent : les résumer les perdrait');

    /* LE CAS AMBIGU : « 4 × 20 × 12 kg » se lit de trois facons. */
    var d = exo('Développé', ['charge', 'reps'], 3);
    d.series.forEach(function (s) {
      s.chargeReel = '20'; s.repsReel = '12'; s.faite = true;
    });
    v.egal(A.m.resumeSeriesFaites(d), '3 séries · 20 × 12 kg',
           'quand le texte porte DÉJÀ un « × », le compte change de '
         + 'séparateur — sinon « 4 × 20 × 12 kg » se lit de trois façons');

    var f = exo('Tenue', ['duree'], 4);
    f.series.forEach(function (s) { s.dureeReel = '30'; s.faite = true; });
    v.egal(A.m.resumeSeriesFaites(f), '4 × 30 s',
           'et une durée se résume pareil');

    var g = exo('Rien', ['reps'], 2);
    g.series[0].repsReel = '20';
    v.egal(A.m.resumeSeriesFaites(g), '',
           'rien de validé ne rend RIEN — c’est l’écran qui dira « non '
         + 'fait », pas le modèle');

    /* LES NON VALIDEES NE COMPTENT PAS, meme remplies : c'est le ✓ qui
       dit ce qui a ete fait, pas la presence d'un chiffre. */
    var k = exo('Mixte', ['reps'], 3);
    k.series[0].repsReel = '50'; k.series[0].faite = true;
    k.series[1].repsReel = '50'; k.series[1].faite = true;
    k.series[2].repsReel = '50';
    v.egal(A.m.resumeSeriesFaites(k), '2 × 50 reps',
           'une série remplie mais NON validée ne se compte pas');
  });

  bloc('Au dictionnaire ou a moi', function (v) {
    v.vrai(A.m.auDictionnaire('Pull up'), 'un nom du dictionnaire en est');
    v.vrai(A.m.auDictionnaire('Traction'),
           'une ÉCRITURE aussi — « Traction » est une écriture de « Pull '
         + 'up », et ce qu’on en fait ne peut pas dépendre de l’orthographe');
    v.vrai(A.m.auDictionnaire('PULL UP'),
           'et la casse ne décide de rien');
    v.vrai(A.m.auDictionnaire('Déviation ulnaire'),
           'les accents non plus');
    v.egal(A.m.auDictionnaire('Mon exo maison'), false,
           'un nom que personne n’a écrit au dictionnaire n’en est pas');
    v.egal(A.m.auDictionnaire(''), false, 'et un nom vide non plus');

    /* CHAQUE ENTREE SE RECONNAIT ELLE-MEME, nom ET ecritures. Ecrit a la
       main, ce controle aurait teste trois noms ; la boucle les prend tous,
       et une entree ajoutee demain est couverte sans qu'on y pense. */
    var ratés = [];
    A.m.DICTIONNAIRE.forEach(function (d) {
      if (!A.m.auDictionnaire(d.nom)) ratés.push(d.nom);
      (d.aussi || []).forEach(function (a) {
        if (!A.m.auDictionnaire(a)) ratés.push(d.nom + ' ← ' + a);
      });
    });
    v.vrai(A.m.DICTIONNAIRE.length > 0,
           '[temoin] le dictionnaire n’est pas vide — sans quoi la boucle '
         + 'ci-dessous serait vraie pour rien');
    v.egal(ratés.join(' · '), '',
           'les 42 entrées ET toutes leurs écritures se reconnaissent');
  });

  bloc('Sparring vierge', function (v) {
    var sp = A.m.seanceSparring();
    v.vrai(A.m.sparringVierge(sp),
           'un sparring qui sort du modèle est VIERGE — rien n’y est écrit');

    /* LA DATE NE COMPTE PAS : elle est pre-remplie, personne ne l'a
       ecrite. La compter rendrait le predicat toujours faux. */
    v.vrai(!!sp.date, '[temoin] il porte pourtant une date');
    sp.date = '2026-01-15';
    v.vrai(A.m.sparringVierge(sp),
           'et CHANGER la date ne suffit pas à le remplir : elle est '
         + 'pré-remplie, pas saisie');

    /* CHAQUE CHAMP LE REMPLIT, et un seul suffit. Le controle les parcourt
       TOUS : ecrit a la main, il en aurait oublie un — et le champ oublie
       est celui qu'on perd. */
    var remplissent = [['club', 'Le club'], ['style', 'toproll'],
                       ['partenaires', 'Jo'], ['technique', 'hook'],
                       ['ressenti', 'dur'], ['note', 'rien'],
                       ['dureeMin', 90], ['rounds', 12], ['cote', 'droit']];
    var ratés = remplissent.filter(function (p) {
      var x = A.m.seanceSparring();
      x[p[0]] = p[1];
      return A.m.sparringVierge(x);
    }).map(function (p) { return p[0]; });
    v.egal(ratés.join(' · '), '',
           'CHACUN des neuf champs suffit à le remplir — un champ oublié '
         + 'est une saisie perdue');

    var d = A.m.seanceSparring();
    d.douleurs = [{ structure: 'coude_medial', niveau: 'moyen' }];
    v.egal(A.m.sparringVierge(d), false,
           'et une douleur notée le remplit aussi');

    /* CE N'EST PAS UN SPARRING : on ne touche pas aux seances de muscu. */
    v.egal(A.m.sparringVierge(A.m.seanceMuscu(null)), false,
           'une séance de MUSCU n’est jamais « vierge » à ce sens — ce '
         + 'prédicat ne doit en effacer aucune');
    v.egal(A.m.sparringVierge(null), false, 'et rien du tout non plus');
  });

  bloc('Règle des 24 h', function (v) {
    function etatDouleur(jours, zone, cote, intensite) {
      var se = seance(jourIlYA(jours), [], { id: 'd' + jours });
      se.douleurs = [{ zone: zone, intensite: intensite, cote: cote }];
      return se;
    }

    /* --- la question se pose le LENDEMAIN, pas le jour même --- */
    var hier = A.store.vide();
    hier.seances = [etatDouleur(1, 'coude_medial', 'droit', 5)];
    var q = A.m.questions24h(hier);
    v.egal(q.length, 1, 'une douleur notée hier appelle une question aujourd’hui');
    v.egal(q[0].zone, 'coude_medial', 'sur la bonne zone');
    v.egal(q[0].cote, 'droit', 'et le bon côté');
    v.egal(q[0].intensite, 5, 'avec la valeur de la veille, pour pouvoir comparer');
    v.egal(q[0].jours, 1, 'et depuis combien de jours');

    var aujourdhui = A.store.vide();
    aujourdhui.seances = [etatDouleur(0, 'coude_medial', 'droit', 5)];
    v.egal(A.m.questions24h(aujourdhui).length, 0,
           'une douleur notée AUJOURD’HUI n’appelle rien : la question porte sur le lendemain');

    var vieux = A.store.vide();
    vieux.seances = [etatDouleur(5, 'coude_medial', 'droit', 5)];
    v.egal(A.m.questions24h(vieux).length, 0,
           'et une douleur d’il y a cinq jours non plus : la fenêtre est de deux jours');

    var avantHier = A.store.vide();
    avantHier.seances = [etatDouleur(2, 'poignet', null, 3)];
    v.egal(A.m.questions24h(avantHier).length, 1,
           'avant-hier compte encore : une séance du soir se juge aussi le surlendemain');

    /* --- répondre fait disparaître la question --- */
    var e = A.store.vide();
    e.seances = [etatDouleur(1, 'coude_medial', 'droit', 5)];
    A.m.poserReleve(e, A.m.aujourdHui(), 'coude_medial', 'droit', 3);
    v.egal(A.m.questions24h(e).length, 0, 'répondre retire la question');
    v.egal(e.releves.length, 1, 'et pose un relevé');

    A.m.poserReleve(e, A.m.aujourdHui(), 'coude_medial', 'droit', 2);
    v.egal(e.releves.length, 1, 'répondre deux fois CORRIGE, ça n’empile pas');
    v.egal(e.releves[0].intensite, 2, 'et c’est la dernière réponse qui vaut');

    /* Le côté distingue : répondre pour le droit ne répond pas pour le gauche. */
    var deux = A.store.vide();
    deux.seances = [etatDouleur(1, 'coude_medial', 'droit', 5)];
    deux.seances[0].douleurs.push({ zone: 'coude_medial', intensite: 4, cote: 'gauche' });
    v.egal(A.m.questions24h(deux).length, 2, 'deux côtés douloureux font deux questions');
    A.m.poserReleve(deux, A.m.aujourdHui(), 'coude_medial', 'droit', 1);
    var reste = A.m.questions24h(deux);
    v.egal(reste.length, 1, 'répondre pour un côté ne répond pas pour l’autre');
    v.egal(reste[0].cote, 'gauche', 'et c’est bien l’autre qui reste à renseigner');

    /* --- un relevé d'hier vaut aussi point de départ --- */
    var chaine = A.store.vide();
    A.m.poserReleve(chaine, jourIlYA(1), 'coude_medial', 'droit', 4);
    var q2 = A.m.questions24h(chaine);
    v.egal(q2.length, 1, 'un relevé d’hier appelle la question du jour, sans aucune séance');
    v.egal(q2[0].intensite, 4, 'avec sa valeur — le lendemain est souvent un jour de repos');

    /* --- l'écart, nommé, jamais conseillé --- */
    v.egal(A.m.ecart24h(5, 3).sens, 'baisse', 'de 5 à 3 : ça redescend');
    v.egal(A.m.ecart24h(5, 3).delta, -2, 'et on dit de combien');
    v.egal(A.m.ecart24h(3, 6).sens, 'hausse', 'de 3 à 6 : ce n’est pas revenu à la base');
    v.egal(A.m.ecart24h(5, 5).sens, 'stable', 'au même niveau');
    v.egal(A.m.ecart24h(null, 3).sens, 'inconnu',
           'sans valeur de départ, il n’y a PAS d’écart — on ne l’invente pas');
    v.egal(A.m.ecart24h(5, null).sens, 'inconnu', 'ni sans valeur d’arrivée');

    /* --- le suivi d'une zone mélange séances et relevés --- */
    var melange = A.store.vide();
    melange.seances = [etatDouleur(3, 'coude_medial', 'droit', 6)];
    A.m.poserReleve(melange, jourIlYA(2), 'coude_medial', 'droit', 4);
    A.m.poserReleve(melange, jourIlYA(1), 'coude_medial', 'droit', 2);
    var pts = A.m.suiviZone(melange, 'coude_medial', 0);
    v.egal(pts.length, 3, 'la pente est faite des deux : c’est la même douleur');
    v.egal(pts.map(function (p) { return p.intensite; }).join(','), '6,4,2',
           'et elle est dans l’ordre, du plus ancien au plus récent');

    var droite = A.m.suiviZone(melange, 'coude_medial', 0, 'gauche');
    v.egal(droite.length, 0,
           'filtrer sur un côté ne rend que ce côté — deux bras font deux pentes');

    /* Une normalisation qui refuse ce qui n'a pas de sens. */
    var sales = A.m.normaliserReleves([
      { date: '2026-10-20', zone: 'coude_medial', cote: 'droit', intensite: 4 },
      { date: '2026-10-20', zone: 'aucune', intensite: 2 },
      { zone: 'poignet', intensite: 3 },
      { date: '2026-10-20', zone: 'poignet', intensite: 'beaucoup' }
    ]);
    v.egal(sales.length, 2, '« aucune » et un relevé sans date sont refusés');
    v.egal(sales[1].intensite, null, 'et une intensité non chiffrée devient inconnue, pas zéro');
  });

  /* ================================================================
     22. La progression en récupération
     ================================================================ */

  bloc('Progression en récupération', function (v) {
    function jourRecup(n, reps) {
      return { id: 're' + n, type: 'recup', date: jourIlYA(n), heure: jourIlYA(n) + 'T20:00:00.000Z',
               note: '', douleurs: [],
               exercices: [{ id: 'x' + n, ordre: 0, nom: 'Élastique', slug: 'elastique',
                             aw: false, typeCharge: 'elastique', colonnes: ['reps', 'duree'],
                             cote: null, forces: [], structures: [], outils: [],
                             consigne: '', reposSecondes: 0,
                             series: [{ id: 's' + n, type: 'normale', repsCible: '', chargeCible: '',
                                        dureeCible: '', repsReel: String(reps), chargeReel: '',
                                        dureeReel: '60', rpe: null, faite: true, faiteA: null }] }] };
    }

    var e = A.store.vide();
    e.seances = [jourRecup(1, 30), jourRecup(2, 30), jourRecup(9, 20)];

    var sem = A.m.volumeRecupParSemaine(e, 8);
    v.vrai(sem.length >= 1, 'la charge se compte par semaine');
    var total = sem.reduce(function (m, x) { return m + x.reps; }, 0);
    v.egal(total, 80, 'toutes les répétitions validées sont comptées');
    var tst = sem.reduce(function (m, x) { return m + x.tempsSousTension; }, 0);
    v.egal(tst, 180, 'et les secondes tenues aussi');

    /* Une journée NON cochée ne compte pas : sinon la pente monterait sans
       qu'on ait rien fait. */
    var vide = A.store.vide();
    var j = jourRecup(1, 30);
    j.exercices[0].series[0].faite = false;
    vide.seances = [j];
    v.egal(A.m.volumeRecupParSemaine(vide, 8).length, 0,
           'une journée ouverte mais pas cochée ne pèse rien');

    /* La récupération ne doit pas déborder dans le volume de travail. */
    var avecMuscu = A.store.vide();
    avecMuscu.seances = [jourRecup(1, 30),
                         seance(jourIlYA(1), [exo('Curl', [serie('normale', 20, 10)])])];
    v.egal(A.m.volumeParSemaine(avecMuscu, 8)[0].series, 1,
           '[temoin] le volume de travail ignore toujours la récupération');
    v.egal(A.m.volumeRecupParSemaine(avecMuscu, 8)[0].reps, 30,
           'et la récupération ne compte pas la muscu');
  });

  /* ================================================================
     20. Le côté — le bras de fer est asymétrique

     Sans lui, « coude médial 4/10 » ne dit pas quel coude, et le recoupement
     72 h croise la douleur d'un bras avec la charge de l'autre. `null` veut
     dire NON RENSEIGNÉ, jamais une valeur par défaut — même principe que
     l'intensité d'une douleur.
     ================================================================ */

  bloc('Côté', function (v) {
    v.egal(A.m.COTES.length, 3, 'trois réponses possibles : droit, gauche, les deux');
    v.egal(A.m.nomCote('droit'), 'Droit', 'elles s’affichent en clair');
    v.egal(A.m.nomCote(null), 'Côté non renseigné',
           'et l’absence de réponse se DIT, au lieu d’être comblée');
    v.egal(A.m.coteValide('zzz'), null, 'une valeur inconnue devient « non renseigné »');
    v.egal(A.m.coteValide(undefined), null, 'l’absence aussi');
    v.egal(A.m.courtCote('deux'), 'G+D', 'la forme courte tient dans un jeton');

    /* « Les deux » n'est pas un troisième côté : c'est une charge qui porte
       sur les deux, et elle compte des deux côtés. */
    v.egal(A.m.cotesCouverts('droit').join(','), 'droit', 'une charge à droite charge le droit');
    v.egal(A.m.cotesCouverts('deux').sort().join(','), 'droit,gauche',
           '« les deux » charge les DEUX, ce n’est pas un côté de plus');
    v.egal(A.m.cotesCouverts(null).length, 0,
           'un côté inconnu ne couvre RIEN : on ne devine pas quel bras a travaillé');

    /* --- la douleur porte un côté --- */
    var d = A.m.normaliserDouleurs([{ zone: 'coude_medial', intensite: 4, cote: 'droit' }]);
    v.egal(d[0].cote, 'droit', 'une douleur sait de quel côté elle est');
    v.egal(A.m.texteDouleur(d[0]), 'Coude médial D 4/10', 'et le dit à l’écran');

    var vieille = A.m.normaliserDouleurs(['coude_medial']);
    v.egal(vieille[0].cote, null,
           'une douleur d’un carnet d’avant a un côté INCONNU, pas inventé');
    v.egal(A.m.texteDouleur(vieille[0]), 'Coude médial',
           'et son affichage ne change pas : rien à dire de plus');

    var aucune = A.m.normaliserDouleurs([{ zone: 'aucune', intensite: 3, cote: 'droit' }]);
    v.egal(aucune[0].cote, null, '« aucune » ne porte pas de côté : il n’y a rien à situer');
    v.egal(aucune[0].intensite, 3, '[temoin] le reste de la normalisation est inchangé');

    var faux = A.m.normaliserDouleurs([{ zone: 'poignet', intensite: null, cote: 'milieu' }]);
    v.egal(faux[0].cote, null, 'un côté absurde est refusé, pas stocké');

    /* --- le recoupement, qui est la raison d'être du champ --- */
    function exoCote(nom, cote, structures) {
      var x = exo(nom, [serie('normale', 20, 10)], { structures: structures });
      x.cote = cote;
      return x;
    }

    var e = etatAvec([
      seance(jourIlYA(1), [
        exoCote('Curl droit', 'droit', ['coude_medial']),
        exoCote('Curl gauche', 'gauche', ['coude_medial']),
        exoCote('Barre', 'deux', ['coude_medial']),
        exoCote('Vieux curl', null, ['coude_medial'])
      ])
    ]);

    var r = A.m.derniereSollicitationStructure(e);
    function ligne(st, cote) {
      return r.lignes.filter(function (x) {
        return x.structure === st && x.cote === cote;
      })[0] || null;
    }

    v.vrai(!!ligne('coude_medial', 'droit'), 'le médial droit a sa propre ligne');
    v.vrai(!!ligne('coude_medial', 'gauche'), 'le médial gauche aussi');
    v.vrai(!!ligne('coude_medial', A.m.COTE_INCONNU),
           'et ce qui n’a pas de côté a la sienne, nommée');

    v.egal(ligne('coude_medial', 'droit').series, 2,
           'le droit compte l’exercice droit ET celui qui porte sur les deux');
    v.egal(ligne('coude_medial', 'gauche').series, 2, 'le gauche aussi, symétriquement');
    v.egal(ligne('coude_medial', A.m.COTE_INCONNU).series, 1,
           'l’exercice sans côté n’est attribué à AUCUN bras — il reste à part');

    v.egal(ligne('coude_medial', 'droit').exercices.sort().join(','), 'Barre,Curl droit',
           'et on voit lesquels, pour pouvoir contester le compte');
    v.egal(ligne('coude_medial', 'droit').nomCote, 'Droit', 'la ligne porte son libellé');
    v.egal(ligne('coude_medial', A.m.COTE_INCONNU).nomCote, null,
           'celle sans côté n’en porte pas : l’écran décide quoi en dire');

    v.vrai(r.jamais.length > 0, 'les structures jamais chargées restent listées');
    v.egal(r.jamais.filter(function (x) { return x.structure === 'coude_medial'; }).length, 0,
           '[temoin] et le médial n’en fait pas partie, puisqu’il a été chargé');

    /* La charge sur une fenêtre, ventilée. */
    var c = A.m.chargeParStructure(e, 28);
    v.egal(c.parStructure.coude_medial, 4,
           'le total par structure ne change PAS : quatre exercices, quatre séries');
    v.egal(c.parCote['coude_medial|droit'], 2, 'mais on sait maintenant ce qui revient au droit');
    v.egal(c.parCote['coude_medial|gauche'], 2, 'et au gauche');
    v.egal(c.parCote['coude_medial|' + A.m.COTE_INCONNU], 1, 'et ce qu’on ne peut pas attribuer');

    /* Ce qui a chargé un côté donné, dans une fenêtre de séances. */
    var q = A.m.exercicesAyantCharge(e.seances, 'coude_medial', 'droit');
    v.egal(q.surLeCote.sort().join(','), 'Barre,Curl droit',
           'on retrouve ce qui a chargé CE bras');
    v.egal(q.sansCote.join(','), 'Vieux curl',
           'et à part, ce qui aurait pu être en cause sans qu’on puisse le dire');

    var qg = A.m.exercicesAyantCharge(e.seances, 'coude_medial', 'gauche');
    v.egal(qg.surLeCote.indexOf('Curl droit'), -1,
           'le bras gauche ne se voit PAS attribuer le travail du droit — '
         + 'c’est tout l’objet du champ');

    /* Un carnet d'avant : tout est inconnu, et rien ne se perd. */
    var vieux = etatAvec([seance(jourIlYA(1), [exo('Curl', [serie('normale', 20, 10)],
                                                  { structures: ['coude_medial'] })])]);
    var rv = A.m.derniereSollicitationStructure(vieux);
    v.egal(rv.lignes.length, 1, 'un carnet d’avant donne une ligne, pas zéro');
    v.egal(rv.lignes[0].cote, A.m.COTE_INCONNU, 'avec un côté inconnu');
    v.egal(rv.lignes[0].series, 1, 'et son compte intact');
    v.egal(A.m.chargeParStructure(vieux, 28).parStructure.coude_medial, 1,
           'le total d’un carnet d’avant ne bouge pas d’un pouce');
  });

  /* ================================================================
     19. La récupération — une régularité, pas une charge

     L'élastique quotidien n'a rien à faire dans le tonnage : cent répétitions
     à faible résistance noieraient le compte de séries d'une semaine. Ce
     qu'on veut en lire est « l'ai-je fait », pas « combien ».
     ================================================================ */

  bloc('Récupération', function (v) {
    function jour(d, faits) {
      return { id: 're' + d, type: 'recup', date: d, heure: d + 'T20:00:00.000Z',
               note: '', douleurs: [],
               exercices: (faits || []).map(function (f, i) {
                 return { id: 'x' + d + i, ordre: i, nom: 'Élastique ' + i, slug: 'elastique ' + i,
                          aw: false, typeCharge: 'elastique', colonnes: ['reps'],
                          forces: [], structures: [], outils: [], consigne: '', reposSecondes: 0,
                          series: [{ id: 's' + d + i, type: 'normale', repsCible: '30',
                                     chargeCible: '', dureeCible: '', repsReel: f ? '30' : '',
                                     chargeReel: '', dureeReel: '', rpe: null,
                                     faite: !!f, faiteA: null }] };
               }) };
    }

    var e = A.store.vide();
    e.seances = [jour(jourIlYA(0), [true, true]), jour(jourIlYA(1), [true, false]),
                 jour(jourIlYA(3), [false, false])];

    v.egal(A.m.seancesRecupTriees(e).length, 3, 'les journées de récupération se retrouvent');
    v.egal(A.m.seancesRecupTriees(e)[0].date, jourIlYA(0), 'la plus récente d’abord');

    v.vrai(A.m.recupFaite(e.seances[0]), 'une journée dont une ligne est cochée compte comme FAITE');
    v.vrai(A.m.recupFaite(e.seances[1]),
           'une routine à moitié faite compte aussi — c’est une journée où l’on s’y est mis');
    v.vrai(!A.m.recupFaite(e.seances[2]), 'une journée sans rien de coché ne compte pas');

    var c = A.m.compteRecup(e.seances[1]);
    v.egal(c.faits + '/' + c.total, '1/2', 'le détail dit combien sur combien');

    var s = A.m.statsRecup(e, 7);
    v.egal(s.joursFaits, 2, 'deux jours faits sur les sept derniers');
    v.vrai(s.aujourdHuiFait, 'et aujourd’hui en fait partie');
    v.egal(s.serie, 2, 'deux jours d’affilée : aujourd’hui et hier');

    /* LE point qui compte : rien de tout ça ne doit toucher au tonnage. */
    var avecMuscu = A.store.vide();
    avecMuscu.seances = [seance(jourIlYA(1), [exo('Curl', [serie('normale', 20, 10)])]),
                         jour(jourIlYA(1), [true, true])];
    v.egal(A.m.seancesMuscuTriees(avecMuscu).length, 1,
           'une journée de récupération n’est PAS une séance de muscu');
    v.egal(A.m.volumeParSemaine(avecMuscu, 8)[0].series, 1,
           'elle n’ajoute aucune série au volume de travail');
    v.egal(A.m.derniereSollicitation(avecMuscu).length, 1,
           'et elle n’entre pas dans la dernière sollicitation par exercice');
    v.egal(A.m.toutesSeancesTriees(avecMuscu).length, 2,
           '[temoin] mais le journal, lui, les voit toutes les deux');

    /* La série en cours ne doit pas tomber à zéro chaque matin. */
    var hier = A.store.vide();
    hier.seances = [jour(jourIlYA(1), [true]), jour(jourIlYA(2), [true])];
    var s2 = A.m.statsRecup(hier, 7);
    v.vrai(!s2.aujourdHuiFait, '[temoin] aujourd’hui n’est pas encore coché');
    v.egal(s2.serie, 2,
           'la série se compte depuis hier tant que la journée n’est pas finie — '
         + 'sinon elle afficherait zéro chaque matin');

    /* Un trou casse la série, mais pas le compte de la fenêtre. */
    var trou = A.store.vide();
    trou.seances = [jour(jourIlYA(0), [true]), jour(jourIlYA(2), [true]), jour(jourIlYA(3), [true])];
    var s3 = A.m.statsRecup(trou, 7);
    v.egal(s3.serie, 1, 'un jour sauté casse la série');
    v.egal(s3.joursFaits, 3, 'mais les trois jours restent comptés sur la fenêtre');

    /* La journée est une COPIE de la routine, comme une séance l'est d'un
       programme : modifier la routine ne réécrit pas ce qui est fait. */
    var routine = A.m.routineRecupVierge();
    routine.exercices = [A.m.exerciceProgramme({ nom: 'Extension poignet', typeCharge: 'elastique',
                                                 colonnes: ['reps'],
                                                 series: [{ repsCible: '30' }] })];
    var j = A.m.seanceRecup(routine);
    v.egal(j.type, 'recup', 'la journée porte son type');
    v.egal(j.date, A.m.aujourdHui(), 'et la date du jour');
    v.egal(j.exercices.length, 1, 'elle reprend les exercices de la routine');
    v.egal(j.exercices[0].series[0].repsCible, '30', 'avec leurs cibles');
    v.egal(j.exercices[0].series[0].repsReel, '', 'et rien de saisi');

    routine.exercices[0].nom = 'Autre chose';
    v.egal(j.exercices[0].nom, 'Extension poignet',
           'modifier la routine APRÈS coup ne touche pas la journée déjà bâtie');

    v.egal(A.m.recupDuJour({ seances: [j] }).id, j.id, 'la journée du jour se retrouve');
    v.egal(A.m.recupDuJour({ seances: [] }), null, 'et il n’y en a pas quand il n’y en a pas');
  });

  /* ================================================================
     13. Les mouvements — six, et la clé de stockage ne bouge pas
     ================================================================ */

  bloc('Mouvements', function (v) {
    v.egal(A.m.FORCES.length, 6, 'six mouvements sont proposés');
    var ids = A.m.FORCES.map(function (f) { return f.id; });
    v.vrai(ids.indexOf('back_pressure') >= 0, 'back pressure en fait partie');
    v.vrai(ids.indexOf('side_pressure') >= 0, 'side pressure aussi');
    v.egal(A.m.nomForce('back_pressure'), 'Back pressure', 'et il s’affiche en clair');
    v.egal(A.m.nomForce('side_pressure'), 'Side pressure', 'lui aussi');
    v.egal(A.m.nomForce('rising'), 'Rising', '[temoin] les quatre d’origine sont intacts');
    v.egal(A.m.nomForce('zzz'), 'zzz',
           'un identifiant inconnu se rend tel quel, plutôt que de vider la ligne');

    /* La clé de stockage reste `forces` : renommer le champ rendrait muets
       les exercices déjà saisis. Seul l'affichage a changé de nom. */
    var e = etatAvec([seance(jourIlYA(2), [
      exo('Side pressure poulie', [serie('normale', 20, 10), serie('normale', 20, 10)],
          { forces: ['side_pressure', 'rising'] })
    ])]);
    var r = A.m.repartitionForces(e, 28);
    v.egal(r.parForce.side_pressure, 2, 'les séries d’un mouvement neuf sont comptées');
    v.egal(r.parForce.rising, 2, 'et celles d’un mouvement d’origine aussi');
    v.egal(r.parForce.cupping, 0, 'un mouvement jamais chargé vaut ZÉRO, pas rien');
    v.egal(r.total, 4, 'le total additionne les deux mouvements de l’exercice');

    /* Un carnet écrit avant ces deux ajouts se relit sans perte. */
    var vieux = etatAvec([seance(jourIlYA(1), [
      exo('Curl', [serie('normale', 20, 10)], { forces: ['supination'] })
    ])]);
    v.egal(A.m.repartitionForces(vieux, 28).parForce.supination, 1,
           'un exercice d’avant garde son mouvement');
    v.egal(A.m.repartitionForces(vieux, 28).parForce.back_pressure, 0,
           'et les deux nouveaux y valent zéro, sans erreur');
  });

  /* ================================================================
     Exécution
     ================================================================ */

  function lancer() {
    var resultats = [];
    cas.forEach(function (c) {
      var ok = 0, ko = [];
      var v = {
        egal: function (a, b, quoi) {
          var pareil = (a === b) || (a == null && b == null);
          if (pareil) ok += 1;
          else ko.push({ quoi: quoi, attendu: b, obtenu: a });
        },
        vrai: function (x, quoi) {
          if (x) ok += 1; else ko.push({ quoi: quoi, attendu: true, obtenu: x });
        }
      };
      try { c.f(v); }
      catch (err) { ko.push({ quoi: 'le bloc a levé une erreur', attendu: 'aucune', obtenu: String(err) }); }
      resultats.push({ bloc: c.bloc, ok: ok, ko: ko });
    });
    return resultats;
  }

  A.banc = { lancer: lancer, nbBlocs: function () { return cas.length; } };
})(window.App || (window.App = {}));
