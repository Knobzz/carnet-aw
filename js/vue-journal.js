/* Journal — toutes les séances, antéchronologique.
   Muscu et sparring vivent dans la même liste, filtrable : c'est dans leur
   entrelacement qu'on lit ce qui est tombé avant un sparring, ou avant une douleur. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  var filtre = 'tout';

  function etat() { return A.store.etat(); }

  /* ------------------------------------------------------------------
     détail d'une séance muscu
     ------------------------------------------------------------------ */
  function detailMuscu(se, surFin) {
    A.panneau.ouvrir(A.m.dateCourte(se.date), function (c, fermer) {
      var v = A.m.volumeSeance(se);

      c.appendChild(h('div', { class: 'item-resume', style: 'margin:-4px 0 10px',
        text: A.m.jourSemaine(se.date) + (se.programmeNom ? ' · ' + se.programmeNom : ' · séance libre')
            + (se.dureeMin ? ' · ' + se.dureeMin + ' min' : '')
            + (se.rpeGlobal ? ' · RPE ' + se.rpeGlobal : '') }));

      c.appendChild(h('dl', { class: 'totaux' },
        h('div', {}, h('dt', { text: 'Séries faites' }), h('dd', { class: 'chiffre', text: v.seriesFaites + ' / ' + v.series })),
        h('div', {}, h('dt', { text: 'Volume' }), h('dd', { class: 'chiffre', text: A.m.fmt(Math.round(v.tonnage)) })),
        h('div', { class: 'aw' }, h('dt', { text: 'dont AW' }), h('dd', { class: 'chiffre', text: A.m.fmt(Math.round(v.tonnageAw)) }))));
      var hors = A.m.texteHorsTonnage(v);
      if (hors) c.appendChild(h('p', { class: 'note-exclus', text: hors }));

      var douleurs = (se.douleurs || []).filter(function (z) { return z !== 'aucune'; });
      if (douleurs.length) {
        c.appendChild(h('div', { class: 'sous-titre', text: 'Douleurs' }));
        c.appendChild(h('div', { class: 'enrobe' }, douleurs.map(function (z) {
          return h('span', { class: 'jeton jeton-douleur', text: A.m.nomZone(z) });
        })));
      }

      c.appendChild(h('div', { class: 'sous-titre', text: 'Exercices' }));
      (se.exercices || []).forEach(function (ex) {
        var tc = A.m.typeCharge(ex.typeCharge);
        var bloc = h('div', { class: 'exo' });
        bloc.appendChild(h('div', { class: 'exo-entete' },
          h('div', {}, h('div', { class: 'exo-titre' },
            h('h3', { text: ex.nom }),
            ex.aw ? h('span', { class: 'jeton', text: 'AW' }) : null))));
        if (ex.consigne) bloc.appendChild(h('div', { class: 'consigne', text: ex.consigne }));
        if ((ex.outils || []).length) {
          bloc.appendChild(h('div', { class: 'exo-meta' }, ex.outils.map(function (o) {
            return h('span', { class: 'jeton jeton-outil', text: o });
          })));
        }

        var lignes = h('div', { class: 'item-lignes', style: 'padding:0 12px 10px' });
        var n = 0;
        (ex.series || []).forEach(function (s) {
          var etiq;
          if (s.type === 'normale') { n += 1; etiq = String(n); }
          else etiq = A.m.TYPES_SERIE[s.type].lettre;
          var val = [(s.chargeReel || '—'), (s.repsReel || '—')].join(' × ')
                  + (tc.id === 'kg' && s.chargeReel ? ' kg' : '');
          lignes.appendChild(h('div', { class: 'item-ligne' },
            h('b', { text: etiq + '. ' + (s.faite ? '' : '(non validée) ') }),
            h('span', { text: val })));
        });
        bloc.appendChild(lignes);
        c.appendChild(bloc);
      });

      if (se.note) {
        c.appendChild(h('div', { class: 'sous-titre', text: 'Note' }));
        c.appendChild(h('div', { class: 'carte' }, h('div', { class: 'carte-corps' },
          h('div', { style: 'white-space:pre-wrap', text: se.note }))));
      }

      c.appendChild(h('div', { class: 'sous-titre', text: 'Actions' }));

      /* Une séance improvisée qui marche devient un programme. */
      var btProg = h('button', { class: 'bt bt-large', style: 'margin-bottom:8px',
                                 text: 'Enregistrer comme programme' });
      btProg.addEventListener('click', function () {
        var p = A.m.programmeDepuisSeance(se);
        etat().programmes.push(p);
        A.store.sauver(true);
        fermer();
        A.ui.toast('Programme créé depuis cette séance.');
        A.app.aller('programmes');
        A.vues.programmes.editer(p, function () { A.app.rafraichir(); });
      });
      c.appendChild(btProg);

      var btReprendre = h('button', { class: 'bt bt-large', style: 'margin-bottom:8px',
                                      text: 'Reprendre / corriger cette séance' });
      btReprendre.addEventListener('click', function () {
        etat().seanceEnCoursId = se.id;
        A.store.sauver(true);
        fermer();
        A.app.aller('seance');
      });
      c.appendChild(btReprendre);

      c.appendChild(A.ui.confirmer2(
        h('button', { class: 'bt bt-large bt-danger', text: 'Supprimer cette séance' }),
        'Appuyer encore pour supprimer',
        function () {
          var l = etat().seances, i = -1;
          for (var k = 0; k < l.length; k++) if (l[k].id === se.id) i = k;
          if (i >= 0) l.splice(i, 1);
          if (etat().seanceEnCoursId === se.id) etat().seanceEnCoursId = null;
          A.store.sauver(true);
          fermer();
          A.ui.toast('Séance supprimée.');
          surFin && surFin();
        }));
    }, [{ nom: 'Fermer', classe: 'bt-primaire', action: function (fermer) { fermer(); surFin && surFin(); } }]);
  }

  /* ------------------------------------------------------------------
     cartes de liste
     ------------------------------------------------------------------ */
  function carteMuscu(se, hote) {
    var v = A.m.volumeSeance(se);
    var it = h('div', { class: 'item' });
    it.appendChild(h('div', { class: 'item-titre' },
      h('h3', { text: se.programmeNom || 'Séance libre' }),
      h('span', { class: 'item-date', text: A.m.dateCourte(se.date) })));

    var resume = [v.seriesFaites + '/' + v.series + ' séries'];
    if (v.tonnage) resume.push(A.m.fmt(Math.round(v.tonnage)) + ' kg');
    if (v.tonnageAw) resume.push(A.m.fmt(Math.round(v.tonnageAw)) + ' kg AW');
    if (se.dureeMin) resume.push(se.dureeMin + ' min');
    it.appendChild(h('div', { class: 'item-resume', text: resume.join(' · ') }));

    var lignes = h('div', { class: 'item-lignes' });
    (se.exercices || []).slice(0, 4).forEach(function (ex) {
      var faites = (ex.series || []).filter(function (s) { return s.faite; });
      var txt = faites.length
        ? faites.map(function (s) { return (s.chargeReel || '—') + '×' + (s.repsReel || '—'); }).join('  ')
        : 'non validé';
      lignes.appendChild(h('div', { class: 'item-ligne' },
        h('b', { text: ex.nom }), h('span', { text: txt })));
    });
    if ((se.exercices || []).length > 4) {
      lignes.appendChild(h('div', { class: 'item-ligne' },
        h('b', { text: '+ ' + (se.exercices.length - 4) + ' autre(s)' })));
    }
    if ((se.exercices || []).length) it.appendChild(lignes);

    var d = A.ui.jetonsDouleur(se.douleurs);
    if (d) { d.style.marginTop = '8px'; it.appendChild(d); }

    it.addEventListener('click', function () { detailMuscu(se, function () { rendre(hote); }); });
    return it;
  }

  function carteSparring(se, hote) {
    var it = h('div', { class: 'item' });
    it.appendChild(h('div', { class: 'item-titre' },
      h('h3', { text: 'Sparring' + (se.club ? ' · ' + se.club : '') }),
      h('span', { class: 'item-date', text: A.m.dateCourte(se.date) })));

    var r = [];
    if (se.rounds) r.push(se.rounds + ' rounds');
    if (se.dureeMin) r.push(se.dureeMin + ' min');
    if (se.style) r.push(A.m.nomStyle(se.style));
    if (se.partenaires) r.push(se.partenaires);
    if (r.length) it.appendChild(h('div', { class: 'item-resume', text: r.join(' · ') }));
    if (se.technique) it.appendChild(h('div', { class: 'item-resume', text: se.technique }));

    var d = A.ui.jetonsDouleur(se.douleurs);
    if (d) { d.style.marginTop = '8px'; it.appendChild(d); }

    it.addEventListener('click', function () {
      A.vues.sparring.editer(se, false, function () { rendre(hote); });
    });
    return it;
  }

  /* ------------------------------------------------------------------
     vue
     ------------------------------------------------------------------ */
  function rendre(hote) {
    A.ui.vider(hote);
    var e = etat();

    var btSpar = h('button', { class: 'bt bt-large', style: 'margin-bottom:10px', text: '+ Noter un sparring' });
    btSpar.addEventListener('click', function () { A.vues.sparring.nouveau(function () { rendre(hote); }); });
    hote.appendChild(btSpar);

    var barre = h('div', { class: 'filtres' });
    [['tout', 'Tout'], ['muscu', 'Muscu'], ['sparring', 'Sparring']].forEach(function (f) {
      var b = h('button', { type: 'button', class: 'puce', text: f[1],
                            'aria-pressed': filtre === f[0] ? 'true' : 'false' });
      b.addEventListener('click', function () { filtre = f[0]; rendre(hote); });
      barre.appendChild(b);
    });
    hote.appendChild(barre);

    var liste = A.m.toutesSeancesTriees(e).filter(function (s) {
      return filtre === 'tout' || s.type === filtre;
    });

    if (!liste.length) {
      hote.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Journal vide' }),
        filtre === 'sparring'
          ? 'Aucun sparring noté. Le bouton ci-dessus en ouvre un.'
          : 'Lance une séance depuis l’onglet Séance : elle apparaîtra ici, datée, avec ses séries.'));
      return;
    }

    var dernierMois = '';
    liste.forEach(function (se) {
      var mois = se.date.slice(0, 7);
      if (mois !== dernierMois) {
        dernierMois = mois;
        hote.appendChild(h('div', { class: 'sous-titre',
          text: A.m.dateCourte(se.date).replace(/^\d+ /, '') }));
      }
      hote.appendChild(se.type === 'sparring' ? carteSparring(se, hote) : carteMuscu(se, hote));
    });
  }

  A.vues = A.vues || {};
  A.vues.journal = { rendre: rendre, titre: function () { return 'Journal'; } };
})(window.App || (window.App = {}));
