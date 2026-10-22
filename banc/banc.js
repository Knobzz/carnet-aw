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
    function parNom(id) { for (var i = 0; i < st.length; i++) if (st[i].structure === id) return st[i]; }
    v.egal(parNom('coude_medial').jours, 1, 'le médial a été chargé hier');
    v.egal(parNom('poignet').jours, 5, 'le poignet il y a cinq jours');
    v.egal(parNom('biceps').date, null, 'une structure jamais chargée le dit, au lieu de mentir');
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

    v.egal(A.m.suggestions(e, 'curl').length, 1, 'l’autocomplétion propose ce qui a été saisi');
    v.egal(A.m.suggestions(e, 'zzz').length, 0, 'et rien d’autre');
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

    /* Le geste réel : « Ajouter mon matériel » pose huit outils d'un coup… */
    ['Golden Grip N2', 'Golden Grip N3', 'Golden Grip N4', 'Élastique de rééducation',
     'Fat grip', 'Ceinture de judo', 'Titan Grip Iron Wrist 60 mm',
     'Titan Grip Pronator Ellipsoid'].forEach(function (n) {
      A.m.majCatalogueOutils(e, n, 'Matériel');
    });
    v.egal(e.outils.length, 8, '[temoin] les huit outils du raccourci sont en catalogue');

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
