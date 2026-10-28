/* Récupération — l'élastique quotidien, faible résistance, beaucoup de reps.

   Ce n'est pas une séance de travail, et ça ne doit pas en avoir la lourdeur :
   la routine est définie UNE FOIS, et chaque jour l'écran la présente déjà
   prête. Il ne reste qu'à cocher. C'est le seul réglage qui décide si un geste
   quotidien tient dans le temps.

   Rien n'est enregistré tant que rien n'est coché : une journée vide écrite
   dans le journal dirait qu'on l'a faite. Elle y entre au premier ✓, et en
   ressort si on décoche tout. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function etat() { return A.store.etat(); }
  function sauver(i) { A.store.sauver(i); }

  /* ------------------------------------------------------------------
     la journée en cours — écrite seulement si elle porte quelque chose
     ------------------------------------------------------------------ */

  function estVide(se) {
    return !(se.exercices || []).some(function (ex) {
      return (ex.series || []).some(function (s) {
        return s.faite || (s.chargeReel || '').trim() || (s.repsReel || '').trim()
            || (s.dureeReel || '').trim();
      });
    });
  }

  function rendre(hote) {
    A.ui.vider(hote);
    var e = etat();
    var routine = e.routineRecup;

    /* --- pas encore de routine --- */
    if (!routine || !(routine.exercices || []).length) {
      var bt = h('button', { class: 'bt bt-large bt-primaire', style: 'margin-bottom:12px',
                             text: routine ? 'Compléter ma routine' : 'Définir ma routine' });
      bt.addEventListener('click', function () { ouvrirRoutine(hote); });
      hote.appendChild(bt);
      hote.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Aucune routine' }),
        'Rien n’est livré ici non plus. Mets-y tes exercices d’élastique — '
      + 'ceux que tu fais presque tous les jours — avec leurs reps ou leur durée. '
      + 'Ensuite, chaque jour, il n’y aura plus qu’à cocher.'));
      return;
    }

    /* --- la journée --- */
    var jour = A.m.recupDuJour(e);
    var enregistre = !!jour;
    if (!jour) jour = A.m.seanceRecup(routine);

    /* Une routine modifiée après coup ne réécrit pas une journée déjà
       commencée : la journée est une COPIE, comme une séance. */

    function synchroniser() {
      if (estVide(jour)) {
        if (enregistre) {
          var i = e.seances.indexOf(jour);
          if (i >= 0) e.seances.splice(i, 1);
          enregistre = false;
        }
      } else if (!enregistre) {
        e.seances.push(jour);
        enregistre = true;
      }
      sauver();
    }

    var stats = null;      // recalculé après chaque coche
    var refStats = h('div', { class: 'item-resume', style: 'margin:-3px 2px 12px' });
    var refTitre = h('div', { class: 'sous-titre', style: 'margin-top:0' });

    function majEntete() {
      stats = A.m.statsRecup(e, 7);
      var c = A.m.compteRecup(jour);
      refTitre.textContent = A.m.jourSemaine(jour.date) + ' ' + A.m.dateCourte(jour.date);
      var bouts = [c.faits + ' / ' + c.total + ' fait' + (c.faits > 1 ? 's' : '')];
      bouts.push(stats.joursFaits + ' jour' + (stats.joursFaits > 1 ? 's' : '')
               + ' sur les 7 derniers');
      /* Une série de jours n'a de sens qu'au-delà de deux : « 1 jour d'affilée »
         ne dit rien de plus que « fait aujourd'hui ». */
      if (stats.serie >= 2) bouts.push(stats.serie + ' jours d’affilée');
      refStats.textContent = bouts.join(' · ');
    }

    hote.appendChild(refTitre);
    hote.appendChild(refStats);

    /* --- une ligne par exercice --- */
    var liste = h('div');

    /* ----------------------------------------------------------------
       UN ✓ PAR EXERCICE, QUI VAUT POUR TOUTES SES SÉRIES

       Deux demandes de MB, et la seconde corrige ma réponse à la première.

       1) « je ne vois que l'exo >> 50 reps […] il faudrait : Side Pressure
          4x50 reps ». Cause mesurée : l'écran ne rendait que la PREMIÈRE
          série — `(ex.series || [])[0]` — alors que sa routine en porte
          quatre. Le journal n'avait jamais rien à compter.

       2) « l'affichage initial était meilleur, je n'avais qu'une fois à
          valider […] ne peut on pas valider UNE fois les 4 séries ? »
          1.38.0 avait résolu le bon problème par le mauvais moyen : quatre
          lignes à cocher. Récup est un écran de GESTE — « il ne reste qu'à
          cocher » — et quatre appuis au lieu d'un, c'est la lourdeur que
          cet écran existe pour éviter.

       CE QUE ÇA COÛTE, ET C'EST ASSUMÉ : on ne peut plus noter une valeur
       DIFFÉRENTE par série depuis cet écran. Ce qu'on tape vaut pour toutes.
       Les cibles par série, elles, restent dans la routine, et cocher sans
       rien taper donne à chaque série LA SIENNE — c'est pourquoi le
       placeholder liste les cibles distinctes quand elles diffèrent plutôt
       que de n'en montrer qu'une.
       ---------------------------------------------------------------- */

    /* La valeur commune aux séries, ou '' si elles ne s'accordent pas : un
       champ unique ne peut pas afficher deux réponses. */
    function valeurCommune(series, cle) {
      var vals = [];
      series.forEach(function (s) {
        var x = (s[cle] || '').trim();
        if (vals.indexOf(x) < 0) vals.push(x);
      });
      return vals.length === 1 ? vals[0] : '';
    }

    function ciblesDistinctes(series, cle) {
      var vals = [];
      series.forEach(function (s) {
        var x = (s[cle] || '').trim();
        if (x && vals.indexOf(x) < 0) vals.push(x);
      });
      return vals;
    }

    function blocExo(ex) {
      var cols = A.m.colonnes(ex);
      var series = ex.series || [];
      if (!series.length) { series = ex.series = [A.m.serieSeanceVierge({})]; }

      var bloc = h('div', { class: 'recup-exo' });
      var titre = h('div', { class: 'recup-titre' }, h('b', { text: ex.nom }));
      /* Le nombre de séries se DIT, sinon un seul ✓ laisse croire qu'une
         seule série est en jeu. */
      if (series.length > 1) {
        titre.appendChild(h('span', { class: 'recup-compte',
                                      text: series.length + ' séries' }));
      }
      (ex.outils || []).forEach(function (o) {
        titre.appendChild(h('span', { class: 'jeton jeton-outil', text: o }));
      });
      bloc.appendChild(titre);

      if (ex.consigne) bloc.appendChild(h('div', { class: 'consigne', text: ex.consigne }));

      var ligne = h('div', { class: 'recup-ligne', 'data-cols': String(cols.length) });
      var champs = {};
      cols.forEach(function (id) {
        var def = A.m.colonne(id);
        var cibles = ciblesDistinctes(series, def.cible);
        var champ = h('input', { class: 'serie-saisie', type: 'text',
          inputmode: def.mode(A.m.typeCharge(ex.typeCharge)),
          value: valeurCommune(series, def.reel),
          placeholder: cibles.join(' · ') || def.label(A.m.typeCharge(ex.typeCharge)),
          'aria-label': def.label(A.m.typeCharge(ex.typeCharge)) + ' — ' + ex.nom
                      + (series.length > 1 ? ', les ' + series.length + ' séries' : '') });
        champ.addEventListener('input', function () {
          series.forEach(function (s) { s[def.reel] = champ.value; });
          synchroniser();
        });
        champs[id] = champ;
        ligne.appendChild(champ);
      });

      var ok = h('button', { type: 'button', class: 'serie-ok',
                             'aria-pressed': series.some(function (s) { return s.faite; })
                                             ? 'true' : 'false',
                             'aria-label': 'Fait — ' + ex.nom
                                         + (series.length > 1
                                            ? ', les ' + series.length + ' séries' : '') });
      ok.appendChild(A.ui.svg(A.ui.CHEMIN_OK));
      ok.addEventListener('click', function () {
        basculer(series, champs, cols, bloc, ok);
        majEntete();
        majBtTout();
        synchroniser();
      });
      ligne.appendChild(ok);
      bloc.appendChild(ligne);
      if (series.some(function (s) { return s.faite; })) bloc.classList.add('faite');
      return bloc;
    }

    /* Toutes les séries de l'exercice basculent ensemble : c'est UN geste.
       Celles qui n'ont rien de saisi prennent CHACUNE leur propre cible —
       « fait comme prévu », et non « fait, valeur inconnue ». */
    function basculer(series, champs, cols, bloc, ok, force) {
      var dejaFait = series.some(function (s) { return s.faite; });
      var neuf = force == null ? !dejaFait : force;
      if (neuf === dejaFait && series.every(function (s) { return s.faite === neuf; })) {
        return false;
      }
      series.forEach(function (s) {
        s.faite = neuf;
        if (neuf) {
          s.faiteA = new Date().toISOString();
          cols.forEach(function (id) {
            var def = A.m.colonne(id);
            if (!s[def.reel] && s[def.cible]) s[def.reel] = s[def.cible];
          });
        } else s.faiteA = null;
      });
      ok.setAttribute('aria-pressed', neuf ? 'true' : 'false');
      bloc.classList.toggle('faite', neuf);
      /* Le champ ne reflète la cible que si les séries s'accordent dessus. */
      cols.forEach(function (id) {
        var def = A.m.colonne(id);
        if (champs[id]) champs[id].value = valeurCommune(series, def.reel);
      });
      return true;
    }

    var blocs = [];
    jour.exercices.forEach(function (ex) {
      var b = blocExo(ex);
      blocs.push(b);
      liste.appendChild(b);
    });
    hote.appendChild(liste);

    /* --- tout cocher : le geste d'un soir où tout a été fait --- */
    var btTout = h('button', { class: 'bt bt-large', style: 'margin-top:10px' });
    function majBtTout() {
      var c = A.m.compteRecup(jour);
      btTout.textContent = c.faits >= c.total && c.total ? 'Tout décocher' : 'Tout marquer fait';
    }
    majBtTout();
    btTout.addEventListener('click', function () {
      var c = A.m.compteRecup(jour);
      var versFait = !(c.faits >= c.total && c.total);
      /* On reconstruit la liste : chaque bloc porte ses propres champs, et
         cocher d'un coup les touche tous. Personne n'a le doigt sur un champ,
         le geste vient d'un bouton. */
      jour.exercices.forEach(function (ex) {
        (ex.series || []).forEach(function (s) {
          if (versFait === s.faite) return;
          s.faite = versFait;
          if (versFait) {
            s.faiteA = new Date().toISOString();
            A.m.colonnes(ex).forEach(function (id) {
              var def = A.m.colonne(id);
              if (!s[def.reel] && s[def.cible]) s[def.reel] = s[def.cible];
            });
          } else s.faiteA = null;
        });
      });
      synchroniser();
      rendre(hote);
    });
    hote.appendChild(btTout);

    var btRoutine = h('button', { class: 'bt bt-large', style: 'margin-top:8px',
                                  text: 'Modifier ma routine' });
    btRoutine.addEventListener('click', function () { ouvrirRoutine(hote); });
    hote.appendChild(btRoutine);

    hote.appendChild(h('div', { class: 'item-resume', style: 'margin-top:12px',
      text: 'La journée n’entre dans le journal qu’une fois quelque chose coché. '
          + 'Modifier la routine ne touche pas aux journées déjà faites : chacune en est une copie.' }));

    majEntete();
    majBtTout();
  }

  function ouvrirRoutine(hote) {
    var e = etat();
    if (!e.routineRecup) {
      e.routineRecup = A.m.routineRecupVierge();
      A.store.sauver(true);
    }
    A.vues.programmes.editer(e.routineRecup, function () { rendre(hote); });
  }

  A.vues = A.vues || {};
  A.vues.recup = { rendre: rendre, titre: function () { return 'Récupération'; } };
})(window.App || (window.App = {}));
