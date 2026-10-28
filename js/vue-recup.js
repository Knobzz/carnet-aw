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
       UNE LIGNE PAR SÉRIE — pas seulement la première

       MB, 28/10 : « je ne vois que l'exo >> 50 reps, et c'est tout, il
       faudrait un affichage du style : -Side Pressure 4x50 reps ». J'ai
       d'abord corrigé le JOURNAL ; il m'a répondu « toujours pas ».

       MESURE : sa routine porte QUATRE séries, cet écran n'en rendait
       qu'UNE — `(ex.series || [])[0]`. Le journal n'avait jamais rien à
       compter. L'éditeur de routine laisse déclarer quatre séries, l'écran
       en jetait trois : le piège n° 5, moitié livrée.

       L'ÉCRAN RESTE CELUI DU GESTE RAPIDE. À une seule série il ne change
       pas d'un pixel : ni numéro, ni colonne en plus. Le numéro n'apparaît
       que là où il répond à une question — « laquelle ? ». Numéroter « 1 »
       tout seul n'informe de rien et vole de la largeur.
       ---------------------------------------------------------------- */
    function blocExo(ex) {
      var cols = A.m.colonnes(ex);
      var series = ex.series || [];
      if (!series.length) { series = ex.series = [A.m.serieSeanceVierge({})]; }
      var plusieurs = series.length > 1;

      var bloc = h('div', { class: 'recup-exo' });
      var titre = h('div', { class: 'recup-titre' }, h('b', { text: ex.nom }));
      if (plusieurs) titre.appendChild(h('span', { class: 'recup-compte',
                                                   text: series.length + ' séries' }));
      (ex.outils || []).forEach(function (o) {
        titre.appendChild(h('span', { class: 'jeton jeton-outil', text: o }));
      });
      bloc.appendChild(titre);

      if (ex.consigne) bloc.appendChild(h('div', { class: 'consigne', text: ex.consigne }));

      /* La carte n'est « faite » que quand TOUTES ses séries le sont ; chaque
         ligne, elle, porte son propre état — sinon trois séries restantes se
         liraient comme un exercice fini. */
      function majBlocFait() {
        bloc.classList.toggle('faite', series.every(function (s) { return !!s.faite; }));
      }

      series.forEach(function (serie, i) {
        var ligne = h('div', { class: 'recup-ligne' + (plusieurs ? ' multi' : ''),
                               'data-cols': String(cols.length) });
        var quoi = plusieurs ? ex.nom + ', série ' + (i + 1) : ex.nom;
        if (plusieurs) ligne.appendChild(h('div', { class: 'recup-num', text: String(i + 1) }));

        var champs = {};
        cols.forEach(function (id) {
          var def = A.m.colonne(id);
          var champ = h('input', { class: 'serie-saisie', type: 'text', inputmode: def.mode(A.m.typeCharge(ex.typeCharge)),
            value: serie[def.reel] || '', placeholder: serie[def.cible] || def.label(A.m.typeCharge(ex.typeCharge)),
            'aria-label': def.label(A.m.typeCharge(ex.typeCharge)) + ' — ' + quoi });
          champ.addEventListener('input', function () {
            serie[def.reel] = champ.value;
            synchroniser();
          });
          champs[id] = champ;
          ligne.appendChild(champ);
        });

        var ok = h('button', { type: 'button', class: 'serie-ok',
                               'aria-pressed': serie.faite ? 'true' : 'false',
                               'aria-label': 'Fait — ' + quoi });
        ok.appendChild(A.ui.svg(A.ui.CHEMIN_OK));
        ok.addEventListener('click', function () {
          basculer(serie, champs, cols, ligne, ok);
          majBlocFait();
          majEntete();
          majBtTout();
          synchroniser();
        });
        ligne.appendChild(ok);
        if (serie.faite) ligne.classList.add('faite');
        bloc.appendChild(ligne);
      });

      majBlocFait();
      return bloc;
    }

    function basculer(serie, champs, cols, ligne, ok, force) {
      var neuf = force == null ? !serie.faite : force;
      if (neuf === serie.faite) return false;
      serie.faite = neuf;
      ok.setAttribute('aria-pressed', neuf ? 'true' : 'false');
      ligne.classList.toggle('faite', neuf);
      if (neuf) {
        serie.faiteA = new Date().toISOString();
        /* Rien de saisi ? La cible fait foi : cocher veut dire « fait comme
           prévu », pas « fait, valeur inconnue ». */
        cols.forEach(function (id) {
          var def = A.m.colonne(id);
          if (!serie[def.reel] && serie[def.cible]) {
            serie[def.reel] = serie[def.cible];
            if (champs[id]) champs[id].value = serie[def.cible];
          }
        });
      } else {
        serie.faiteA = null;
      }
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
