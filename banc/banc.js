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
    /* La semaine d'avant : trois séries de travail, pas d'échauffement. */
    var e = etatAvec([
      seance('2026-10-14', [exo('Curl', [
        serie('normale', 20, 12), serie('normale', 22, 10), serie('normale', 24, 8)
      ])], { id: 'A' })
    ]);

    /* Aujourd'hui, j'ajoute un échauffement en tête. Les séries de travail
       restent la 1re, la 2e et la 3e SÉRIE DE TRAVAIL. */
    var auj = [serie('echauffement', 10, 20), serie('normale', 0, 0),
               serie('normale', 0, 0), serie('normale', 0, 0)];

    function precedentDe(i) {
      return A.m.texteDernierePerf(
        A.m.dernierePerf(e, 'curl', auj[i].type, A.m.rangParType(auj, i), 'B'));
    }

    v.egal(precedentDe(1), '20 × 12', 'la 1re série de travail retrouve la 1re série de travail');
    v.egal(precedentDe(2), '22 × 10', 'la 2e retrouve la 2e, malgré l’échauffement inséré');
    v.egal(precedentDe(3), '24 × 8', 'la 3e retrouve la 3e');
    v.egal(precedentDe(0), '', 'un échauffement ne reprend pas une série de travail');

    /* Et sans échauffement, rien ne doit bouger. */
    var sans = [serie('normale', 0, 0), serie('normale', 0, 0), serie('normale', 0, 0)];
    v.egal(A.m.texteDernierePerf(A.m.dernierePerf(e, 'curl', 'normale', A.m.rangParType(sans, 0), 'B')),
           '20 × 12', 'sans échauffement, l’alignement est inchangé');

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
