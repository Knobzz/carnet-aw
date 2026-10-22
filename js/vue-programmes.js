/* Programmes — composition libre. Aucun programme n'est livré avec l'app.
   L'édition est vivante : chaque geste écrit dans le modèle et sauve.
   Comme en séance : on insère / retire / déplace UN nœud, jamais un conteneur. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function etat() { return A.store.etat(); }
  function sauver(i) { A.store.sauver(i); }

  /* ------------------------------------------------------------------
     éditeur d'un programme
     ------------------------------------------------------------------ */
  var enEdition = null;   // le programme ouvert dans l'editeur, a ne pas elaguer

  /* Un programme cree puis abandonne (sans nom et sans exercice) ne doit pas
     s'accumuler dans la liste. On l'elague au rendu plutot qu'a la fermeture :
     c'est le seul endroit qui attrape AUSSI les sorties par la croix, par
     Echap et par un changement d'onglet. */
  function elaguerVides(e) {
    for (var i = e.programmes.length - 1; i >= 0; i--) {
      var p = e.programmes[i];
      if (p !== enEdition && !p.nom.trim() && !p.exercices.length) e.programmes.splice(i, 1);
    }
  }

  function editer(prog, surFermeture) {
    enEdition = prog;
    A.panneau.ouvrir(prog.nom || 'Nouveau programme', function (c, fermer) {

      var champNom = h('input', { class: 'champ', value: prog.nom, placeholder: 'Poussée + poignet' });
      champNom.addEventListener('input', function () { prog.nom = champNom.value; sauver(); });
      c.appendChild(A.ui.groupe('Nom', champNom));

      var champDesc = h('textarea', { class: 'champ',
        placeholder: 'À quoi sert ce programme, quand il tombe dans la semaine, ce qu’il charge.' });
      champDesc.value = prog.description || '';
      champDesc.addEventListener('input', function () { prog.description = champDesc.value; sauver(); });
      c.appendChild(A.ui.groupe('Description', champDesc));

      c.appendChild(h('div', { class: 'sous-titre', text: 'Exercices' }));
      var listeExos = h('div');
      c.appendChild(listeExos);

      var vide = h('div', { class: 'vide' },
        h('strong', { text: 'Aucun exercice' }),
        'Ajoute le premier ci-dessous. Chaque exercice porte ses séries planifiées, avec reps et charge cibles.');

      function majVide() {
        var y = listeExos.contains(vide);
        if (!prog.exercices.length && !y) listeExos.appendChild(vide);
        if (prog.exercices.length && y) listeExos.removeChild(vide);
      }

      /* --- une ligne de série planifiée --- */
      function lignePlan(ep, sp, listeNoeud) {
        var tc = A.m.typeCharge(ep.typeCharge);
        var ligne = h('div', { class: 'plan-ligne' });

        var num = h('button', { type: 'button', class: 'serie-num' });
        num.addEventListener('click', function () {
          A.ui.feuille('Type de série', A.m.ORDRE_TYPES.map(function (t) {
            return { lettre: A.m.TYPES_SERIE[t].lettre || '#', nom: A.m.TYPES_SERIE[t].nom,
                     action: function () { sp.type = t; renumPlan(ep, listeNoeud); sauver(); } };
          }));
        });

        var cols = A.m.colonnes(ep);
        ligne.dataset.cols = String(cols.length);
        var champs = {};
        cols.forEach(function (id) {
          var def = A.m.colonne(id);
          champs[id] = h('input', { class: 'serie-saisie', type: 'text', inputmode: def.mode(tc),
                                    value: sp[def.cible] || '', placeholder: def.label(tc),
                                    'aria-label': def.label(tc) + ' cible' });
          champs[id].addEventListener('input', function () {
            sp[def.cible] = champs[id].value;
            sauver();
          });
        });

        var sup = h('button', { class: 'bt-icone', text: '✕', 'aria-label': 'Retirer cette série' });
        sup.addEventListener('click', function () {
          if (ep.series.length <= 1) { A.ui.toast('Un exercice garde au moins une série.'); return; }
          var i = ep.series.indexOf(sp);
          ep.series.splice(i, 1);
          listeNoeud.removeChild(ligne);
          renumPlan(ep, listeNoeud);
          sauver();
        });

        ligne.appendChild(num);
        cols.forEach(function (id) { ligne.appendChild(champs[id]); });
        ligne.appendChild(sup);
        return ligne;
      }

      function renumPlan(ep, listeNoeud) {
        var n = 0;
        Array.prototype.forEach.call(listeNoeud.children, function (ligne, i) {
          var s = ep.series[i];
          if (!s) return;
          var bt = ligne.querySelector('.serie-num');
          if (s.type === 'normale') { n += 1; bt.textContent = String(n); }
          else bt.textContent = A.m.TYPES_SERIE[s.type].lettre;
          bt.dataset.type = s.type;
          bt.title = A.m.TYPES_SERIE[s.type].nom;
        });
      }

      /* --- un exercice du programme --- */
      function blocExo(ep) {
        var bloc = h('div', { class: 'exo' });
        var tc = A.m.typeCharge(ep.typeCharge);

        var titre = h('h3', { text: ep.nom });
        var jetons = h('span', { class: 'enrobe' });
        function majJetons() {
          A.ui.vider(jetons);
          if (ep.aw) jetons.appendChild(h('span', { class: 'jeton', text: 'AW' }));
          if (tc.id !== 'kg') jetons.appendChild(h('span', { class: 'jeton jeton-neutre', text: tc.nom }));
        }
        majJetons();

        var menu = h('button', { class: 'bt-icone', text: '⋯', 'aria-label': 'Options de ' + ep.nom });
        bloc.appendChild(h('div', { class: 'exo-entete' },
          h('div', {}, h('div', { class: 'exo-titre' }, titre, jetons)), menu));

        var consigne = h('div', { class: 'consigne', text: ep.consigne || '' });
        if (!ep.consigne) consigne.style.display = 'none';
        bloc.appendChild(consigne);

        var meta = h('div', { class: 'exo-meta' });
        function majMeta() {
          A.ui.vider(meta);
          meta.appendChild(h('span', { text: 'Repos ' + ep.reposSecondes + ' s' }));
          if (ep.cote) meta.appendChild(h('span', { class: 'jeton jeton-cote', text: A.m.nomCote(ep.cote) }));
          if (ep.prise) meta.appendChild(h('span', { class: 'jeton', text: 'Prise ' + A.m.nomPrise(ep.prise).toLowerCase() }));
          (ep.outils || []).forEach(function (o) {
            meta.appendChild(h('span', { class: 'jeton jeton-outil', text: A.m.outilDit(ep, o) }));
          });
          if ((ep.structures || []).length) {
            meta.appendChild(h('span', { text: ep.structures.map(A.m.nomStructure).join(' · ') }));
          }
          if ((ep.forces || []).length) meta.appendChild(h('span', { text: ep.forces.map(A.m.nomForce).join(' · ') }));
        }
        majMeta();
        bloc.appendChild(meta);

        var zone = h('div', { class: 'series' });
        var enteteSeries = h('div', { class: 'plan-entete' });
        function majEntete() {
          A.ui.vider(enteteSeries);
          var cols = A.m.colonnes(ep);
          enteteSeries.dataset.cols = String(cols.length);
          enteteSeries.appendChild(h('span', { text: 'Série' }));
          cols.forEach(function (id) {
            enteteSeries.appendChild(h('span', { text: A.m.colonne(id).label(tc) + ' cible' }));
          });
          enteteSeries.appendChild(h('span'));
        }
        majEntete();
        zone.appendChild(enteteSeries);

        var listeSeries = h('div');
        ep.series.forEach(function (sp) { listeSeries.appendChild(lignePlan(ep, sp, listeSeries)); });
        zone.appendChild(listeSeries);
        renumPlan(ep, listeSeries);

        var plus = h('button', { class: 'bt bt-petit bt-fantome', text: '+ Série' });
        plus.addEventListener('click', function () {
          var d = ep.series[ep.series.length - 1];
          var sp = A.m.serieProgramme(d ? { type: d.type, repsCible: d.repsCible,
                                            chargeCible: d.chargeCible,
                                            dureeCible: d.dureeCible } : {});
          ep.series.push(sp);
          listeSeries.appendChild(lignePlan(ep, sp, listeSeries));
          renumPlan(ep, listeSeries);
          sauver();
        });
        zone.appendChild(h('div', { class: 'serie-actions' }, plus));
        bloc.appendChild(zone);

        menu.addEventListener('click', function () {
          var i = prog.exercices.indexOf(ep);
          A.ui.feuille(ep.nom, [
            { nom: 'Modifier l’exercice', action: function () {
                A.panneau.editerExercice(ep, {}, function () {
                  titre.textContent = ep.nom;
                  tc = A.m.typeCharge(ep.typeCharge);
                  majJetons(); majMeta(); majEntete();
                  consigne.textContent = ep.consigne || '';
                  consigne.style.display = ep.consigne ? '' : 'none';
                  /* Les colonnes ont pu changer : les lignes portent d'autres
                     champs. Le panneau vient de se fermer, personne ne tape. */
                  A.ui.vider(listeSeries);
                  ep.series.forEach(function (sp) { listeSeries.appendChild(lignePlan(ep, sp, listeSeries)); });
                  renumPlan(ep, listeSeries);
                  sauver(true);
                });
              } },
            { nom: 'Dupliquer l’exercice', action: function () {
                var copie = A.m.exerciceProgramme(ep);
                prog.exercices.splice(i + 1, 0, copie);
                A.m.renumeroter(prog.exercices);
                listeExos.insertBefore(blocExo(copie), bloc.nextSibling);
                sauver(true);
                A.ui.toast('Exercice dupliqué.');
              } },
            i > 0 ? { nom: 'Monter', action: function () {
                if (A.ui.deplacer(prog.exercices, i, -1, listeExos)) { A.m.renumeroter(prog.exercices); sauver(true); }
              } } : null,
            i < prog.exercices.length - 1 ? { nom: 'Descendre', action: function () {
                if (A.ui.deplacer(prog.exercices, i, 1, listeExos)) { A.m.renumeroter(prog.exercices); sauver(true); }
              } } : null,
            { nom: 'Supprimer l’exercice', classe: 'bt-danger', action: function () {
                A.ui.feuille('Supprimer « ' + ep.nom + ' » du programme ?', [
                  { nom: 'Oui, supprimer', classe: 'bt-danger arme', action: function () {
                      var j = prog.exercices.indexOf(ep);
                      if (j >= 0) prog.exercices.splice(j, 1);
                      A.m.renumeroter(prog.exercices);
                      listeExos.removeChild(bloc);
                      majVide();
                      sauver(true);
                    } }
                ]);
              } }
          ]);
        });

        return bloc;
      }

      prog.exercices.forEach(function (ep) { listeExos.appendChild(blocExo(ep)); });
      majVide();

      var btAjout = h('button', { class: 'bt bt-large', text: '+ Ajouter un exercice' });
      btAjout.addEventListener('click', function () {
        var brouillon = A.m.exerciceProgramme({});
        A.panneau.editerExercice(brouillon, { titre: 'Ajouter un exercice' }, function () {
          var ep = A.m.exerciceProgramme(brouillon);
          ep.series = [A.m.serieProgramme({})];
          prog.exercices.push(ep);
          A.m.renumeroter(prog.exercices);
          majVide();
          listeExos.appendChild(blocExo(ep));
          sauver(true);
        });
      });
      c.appendChild(btAjout);

      c.appendChild(h('div', { class: 'item-resume', style: 'margin-top:14px',
        text: 'Les modifications sont enregistrées à mesure. Un programme modifié ne réécrit jamais une séance déjà faite : chaque séance en est une copie.' }));

    }, [
      { nom: 'Fermer', classe: 'bt-primaire', action: function (fermer) { fermer(); } }
    ], function () {
      enEdition = null;
      A.store.sauver(true);
      surFermeture && surFermeture();
    });
  }

  /* ------------------------------------------------------------------
     liste
     ------------------------------------------------------------------ */
  function rendre(hote) {
    A.ui.vider(hote);
    var e = etat();
    elaguerVides(e);

    var btNeuf = h('button', { class: 'bt bt-large bt-primaire', style: 'margin-bottom:12px',
                               text: '+ Nouveau programme' });
    btNeuf.addEventListener('click', function () {
      var p = A.m.programme('');
      e.programmes.push(p);
      sauver(true);
      editer(p, function () { rendre(hote); });
    });
    hote.appendChild(btNeuf);

    if (!e.programmes.length) {
      hote.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Aucun programme' }),
        'Le carnet démarre vide. Crée ton premier programme : tu y mettras tes exercices, et pour chacun ses séries avec reps et charge cibles.'));
      return;
    }

    var actifs = e.programmes.filter(function (p) { return !p.archive; });
    var archives = e.programmes.filter(function (p) { return p.archive; });

    function carte(p) {
      var nExos = p.exercices.length;
      var nSeries = p.exercices.reduce(function (t, x) { return t + x.series.length; }, 0);
      var it = h('div', { class: 'item' + (p.archive ? ' archive' : '') });

      var tete = h('div', { class: 'item-titre' },
        h('h3', { text: p.nom || 'Sans nom' }),
        p.archive ? h('span', { class: 'jeton jeton-neutre', text: 'Archivé' }) : null);
      it.appendChild(tete);

      if (p.description) it.appendChild(h('div', { class: 'item-resume', text: p.description }));
      it.appendChild(h('div', { class: 'item-resume',
        text: nExos + (nExos > 1 ? ' exercices' : ' exercice') + ' · ' + nSeries + (nSeries > 1 ? ' séries' : ' série') }));

      if (nExos) {
        var lignes = h('div', { class: 'item-lignes' });
        p.exercices.slice(0, 4).forEach(function (ep) {
          var cibles = ep.series.map(function (s) { return s.repsCible || '?'; }).join('/');
          lignes.appendChild(h('div', { class: 'item-ligne' },
            h('b', { text: ep.nom }),
            h('span', { text: ep.series.length + '×  ' + cibles })));
        });
        if (nExos > 4) lignes.appendChild(h('div', { class: 'item-ligne' },
          h('b', { text: '+ ' + (nExos - 4) + ' autre(s)' })));
        it.appendChild(lignes);
      }

      var actions = h('div', { class: 'enrobe', style: 'margin-top:10px' });

      if (!p.archive) {
        var lancer = h('button', { class: 'bt bt-petit bt-primaire', text: 'Lancer une séance' });
        lancer.addEventListener('click', function () {
          if (!nExos) { A.ui.toast('Ce programme n’a pas encore d’exercice.'); return; }
          if (e.seanceEnCoursId) {
            A.ui.feuille('Une séance est déjà en cours', [
              { nom: 'Reprendre celle en cours', classe: 'bt-primaire', action: function () { A.app.aller('seance'); } },
              { nom: 'La laisser et en lancer une neuve', action: function () { A.vues.seance.lancer(p); } }
            ]);
            return;
          }
          A.vues.seance.lancer(p);
        });
        actions.appendChild(lancer);
      }

      var mod = h('button', { class: 'bt bt-petit', text: 'Modifier' });
      mod.addEventListener('click', function () { editer(p, function () { rendre(hote); }); });
      actions.appendChild(mod);

      var plus = h('button', { class: 'bt bt-petit', text: '⋯' });
      plus.addEventListener('click', function () {
        A.ui.feuille(p.nom || 'Programme', [
          { nom: 'Dupliquer le programme', action: function () {
              e.programmes.push(A.m.dupliquerProgramme(p));
              sauver(true); rendre(hote);
              A.ui.toast('Programme dupliqué — la version précédente est intacte.');
            } },
          { nom: p.archive ? 'Désarchiver' : 'Archiver', action: function () {
              p.archive = !p.archive; sauver(true); rendre(hote);
              A.ui.toast(p.archive
                ? 'Archivé. Les séances qui y renvoient gardent leur historique.'
                : 'Désarchivé.');
            } },
          { nom: 'Supprimer définitivement', classe: 'bt-danger', action: function () {
              A.ui.feuille('Supprimer « ' + (p.nom || 'Sans nom') + ' » ?', [
                { nom: 'Oui, supprimer', classe: 'bt-danger arme', action: function () {
                    var i = e.programmes.indexOf(p);
                    if (i >= 0) e.programmes.splice(i, 1);
                    sauver(true); rendre(hote);
                    A.ui.toast('Programme supprimé. Les séances passées restent au journal.');
                  } },
                { nom: 'Archiver plutôt', action: function () {
                    p.archive = true; sauver(true); rendre(hote);
                  } }
              ]);
            } }
        ]);
      });
      actions.appendChild(plus);

      it.appendChild(actions);
      return it;
    }

    actifs.forEach(function (p) { hote.appendChild(carte(p)); });

    if (archives.length) {
      hote.appendChild(h('div', { class: 'sous-titre', text: 'Archivés' }));
      archives.forEach(function (p) { hote.appendChild(carte(p)); });
    }
  }

  A.vues = A.vues || {};
  A.vues.programmes = { rendre: rendre, editer: editer, titre: function () { return 'Programmes'; } };
})(window.App || (window.App = {}));
