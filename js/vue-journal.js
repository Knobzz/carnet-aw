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

      var dureeAffichee = se.dureeMin != null ? se.dureeMin : A.m.dureeReelle(se);
      var mesuree = se.dureeMin == null && dureeAffichee != null;
      c.appendChild(h('div', { class: 'item-resume', style: 'margin:-4px 0 10px',
        text: A.m.jourSemaine(se.date) + (se.programmeNom ? ' · ' + se.programmeNom : ' · séance libre')
            + (dureeAffichee != null ? ' · ' + dureeAffichee + ' min' + (mesuree ? ' (mesurée)' : '') : '')
            + (se.rpeGlobal ? ' · RPE ' + se.rpeGlobal : '') }));

      c.appendChild(h('dl', { class: 'totaux' },
        h('div', {}, h('dt', { text: 'Séries faites' }), h('dd', { class: 'chiffre', text: v.seriesFaites + ' / ' + v.series })),
        h('div', {}, h('dt', { text: 'Volume' }), h('dd', { class: 'chiffre', text: A.m.fmt(Math.round(v.tonnage)) })),
        h('div', { class: 'aw' }, h('dt', { text: 'dont AW' }), h('dd', { class: 'chiffre', text: A.m.fmt(Math.round(v.tonnageAw)) }))));
      if (v.repsTotal || v.tempsSousTension) {
        var bouts = [];
        if (v.repsTotal) bouts.push(A.m.fmt(v.repsTotal) + ' reps au total');
        if (v.tempsSousTension) bouts.push(A.m.texteTempsSousTension(v));
        if (v.seriesAw) bouts.push(v.seriesAw + ' série(s) marquée(s) AW');
        c.appendChild(h('p', { class: 'note-exclus', text: bouts.join(' · ') }));
      }
      var hors = A.m.texteHorsTonnage(v);
      if (hors) c.appendChild(h('p', { class: 'note-exclus', text: hors }));

      var douleurs = A.m.zonesVives(se.douleurs);
      if (douleurs.length) {
        c.appendChild(h('div', { class: 'sous-titre', text: 'Douleurs' }));
        c.appendChild(h('div', { class: 'enrobe' }, douleurs.map(function (d) {
          return h('span', { class: 'jeton jeton-douleur', text: A.m.texteDouleur(d) });
        })));
      }

      c.appendChild(h('div', { class: 'sous-titre', text: 'Exercices' }));
      (se.exercices || []).forEach(function (ex) {
        var bloc = h('div', { class: 'exo' });
        var btHisto = h('button', { class: 'bt-icone', text: '↗',
                                    'aria-label': 'Historique de ' + ex.nom, title: 'Historique' });
        btHisto.addEventListener('click', function () { A.vues.exercice.ouvrir(ex.slug, ex.nom); });
        bloc.appendChild(h('div', { class: 'exo-entete' },
          h('div', {}, h('div', { class: 'exo-titre' },
            h('h3', { text: ex.nom }),
            ex.aw ? h('span', { class: 'jeton', text: 'AW' }) : null)),
          btHisto));
        if (ex.consigne) bloc.appendChild(h('div', { class: 'consigne', text: ex.consigne }));
        if ((ex.outils || []).length || (ex.structures || []).length) {
          var m2 = h('div', { class: 'exo-meta' });
          if (ex.cote) m2.appendChild(h('span', { class: 'jeton jeton-cote', text: A.m.nomCote(ex.cote) }));
          if (ex.prise) m2.appendChild(h('span', { class: 'jeton', text: 'Prise ' + A.m.nomPrise(ex.prise).toLowerCase() }));
          (ex.outils || []).forEach(function (o) {
            m2.appendChild(h('span', { class: 'jeton jeton-outil', text: A.m.outilDit(ex, o) }));
          });
          if ((ex.structures || []).length) {
            m2.appendChild(h('span', { text: ex.structures.map(A.m.nomStructure).join(' · ') }));
          }
          bloc.appendChild(m2);
        }

        var lignes = h('div', { class: 'item-lignes', style: 'padding:0 12px 10px' });
        var n = 0;
        (ex.series || []).forEach(function (s) {
          var etiq;
          if (s.type === 'normale') { n += 1; etiq = String(n); }
          else etiq = A.m.TYPES_SERIE[s.type].lettre;
          var val = A.m.texteSerie(ex, s) + (s.rpe != null ? '  RPE ' + s.rpe : '');
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
    if (v.tempsSousTension) resume.push(A.m.texteDuree(v.tempsSousTension) + ' sous tension');
    var dm = se.dureeMin != null ? se.dureeMin : A.m.dureeReelle(se);
    if (dm != null) resume.push(dm + ' min');
    it.appendChild(h('div', { class: 'item-resume', text: resume.join(' · ') }));

    var lignes = h('div', { class: 'item-lignes' });
    (se.exercices || []).slice(0, 4).forEach(function (ex) {
      var faites = (ex.series || []).filter(function (s) { return s.faite; });
      var txt = faites.length
        ? faites.map(function (s) { return A.m.texteSerie(ex, s, true); }).join('  ')
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
    if (se.cote) r.push('bras ' + A.m.nomCote(se.cote).toLowerCase());
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

  /* Une journée de récupération ne se résume pas en kilos : ce qu'on veut y
     lire est ce qui a été fait, et combien. Elle n'est pas cliquable — on la
     corrige dans l'onglet Récup, tant qu'on y est. */
  /* LA JOURNEE DE RECUP S'OUVRE, ET SE SUPPRIME. MB, 28/10 : « je n'avais
     pas la possibilite de le supprimer par la suite, stuck en plus dans le
     journal ».

     REPRODUIT, ET C'ETAIT DANS LE CODE : cette carte rendait un `div` avec
     `cursor:default`, quand muscu et sparring rendaient des cartes
     cliquables. Une journee entree au journal etait donc DEFINITIVE — et
     aucun autre ecran ne la montre, l'onglet Recup ne presentant que le
     jour courant. */
  function detailRecup(se, surFin) {
    A.panneau.ouvrir((se.routineNom || 'Récupération')
                   + ' du ' + A.m.dateCourte(se.date),
      function (c, fermer) {
        /* ---- LA DATE SE CORRIGE ICI ----

           MB, 28/10 : « mon exo que j'avais fait hier a la date
           d'aujourd'hui, dois je le supprimer ? » Non : la seule chose que
           cette fiche offrait était « Supprimer cette journée », donc
           corriger une date voulait dire EFFACER le jour — et le refaire
           aujourd'hui l'aurait daté d'aujourd'hui. Il perdait la journée,
           son compte dans « N jours sur les 7 derniers » et sa ligne au
           journal, pour réparer une date.

           MÊME CHAMP QUE LA FICHE DE SPARRING, qui le porte depuis
           toujours : `<input type="date">` dans un `A.ui.groupe('Date')`.
           Un second vocabulaire pour le même geste se paie en hésitation.

           LE JOURNAL SE RE-REND À LA FERMETURE — `surFin` est déjà câblé
           sur le bouton « Fermer ». La carte change donc de place et de
           mois toute seule, sans qu'on redessine sous les doigts de MB. */
        var champDate = h('input', { class: 'champ', type: 'date', value: se.date });
        champDate.addEventListener('input', function () {
          if (!champDate.value) return;
          se.date = champDate.value;
          A.store.sauver(true);
        });
        c.appendChild(A.ui.groupe('Date', champDate));

        /* « exercices » : un ✓ par exercice, donc un compte par exercice.
           Le nombre de series se lit sur la ligne — « 4 × 50 reps ». */
        var cpt = A.m.compteRecup(se);
        c.appendChild(h('div', { class: 'item-resume',
          text: cpt.faits + ' / ' + cpt.total + ' exercice'
              + (cpt.total > 1 ? 's' : '') + ' coché'
              + (cpt.faits > 1 ? 's' : '') + '.' }));

        var lignes = h('div', { class: 'item-lignes' });
        (se.exercices || []).forEach(function (ex) {
          /* Meme resume que la carte : je l'avais ecrite ce matin avec le
             MEME defaut, en recopiant la ligne d'a cote. */
          lignes.appendChild(h('div', { class: 'item-ligne' },
            h('b', { text: ex.nom }),
            h('span', { text: A.m.resumeSeriesFaites(ex) || 'non fait' })));
        });
        if ((se.exercices || []).length) c.appendChild(lignes);

        var d = A.ui.jetonsDouleur(se.douleurs);
        if (d) { d.style.marginTop = '8px'; c.appendChild(d); }

        c.appendChild(A.ui.confirmer2(
          h('button', { class: 'bt bt-large bt-danger', style: 'margin-top:12px',
                        text: 'Supprimer cette journée' }),
          'Appuyer encore pour supprimer',
          function () {
            var l = etat().seances, i = -1;
            for (var k = 0; k < l.length; k++) if (l[k].id === se.id) i = k;
            if (i >= 0) l.splice(i, 1);
            A.store.sauver(true);
            fermer();
            A.ui.toast('Journée supprimée.');
            surFin && surFin();
          }));
      },
      [{ nom: 'Fermer', classe: 'bt-primaire',
         action: function (fermer) { fermer(); surFin && surFin(); } }]);
  }

  function carteRecup(se, hote) {
    var it = h('div', { class: 'item' });
    var c = A.m.compteRecup(se);
    it.appendChild(h('div', { class: 'item-titre' },
      h('h3', { text: se.routineNom || 'Récupération' }),
      h('span', { class: 'item-date', text: A.m.dateCourte(se.date) })));
    it.appendChild(h('div', { class: 'item-resume',
      text: c.faits + ' / ' + c.total + ' exercice' + (c.total > 1 ? 's' : '') }));

    var lignes = h('div', { class: 'item-lignes' });
    (se.exercices || []).forEach(function (ex) {
      /* TOUTES LES SERIES, PAS LA PREMIERE. MB, 28/10 : « je ne vois que
         l'exo >> 50 reps, et c'est tout […] il faudrait 4x50 reps ». Ceci
         lisait `(ex.series || [])[0]` : quatre séries identiques se
         disaient comme une seule.

         Forme longue ici : la carte n'est pas serrée, et « 30 » tout seul
         ne dit pas si ce sont des reps ou des secondes. */
      lignes.appendChild(h('div', { class: 'item-ligne' },
        h('b', { text: ex.nom }),
        h('span', { text: A.m.resumeSeriesFaites(ex) || 'non fait' })));
    });
    if ((se.exercices || []).length) it.appendChild(lignes);
    it.addEventListener('click', function () {
      detailRecup(se, function () { rendre(hote); });
    });
    return it;
  }

  /* ------------------------------------------------------------------
     vue
     ------------------------------------------------------------------ */
  function rendre(hote) {
    A.ui.vider(hote);
    var e = etat();

    /* LE SPARRING A QUITTE CET ECRAN le 28/10 — MB : « j'ai encore "noter
       un sparring" dans journal ». Il vit sur l'ecran Seance depuis la
       1.36.1, qui est l'endroit ou l'on vient s'entrainer ; Journal est
       l'endroit ou l'on RELIT. J'avais garde les deux chemins en pensant
       qu'un chemin de plus ne coute rien — il coute : le geste parait
       exister a deux endroits sans qu'on sache lequel est le bon. */

    /* LES MÊMES SOUS-ONGLETS QUE LE SUIVI. MB, 28/10 : « tu me fais le
       journal comme le suivi, avec les trois sous onglets, par souci
       d'homogénéité ».

       « TOUT » RESTE, ET C'EST UNE QUATRIÈME ENTRÉE ASSUMÉE : c'est la
       SEULE vue chronologique qui mélange les trois, et un journal sans
       elle ne répond plus à « qu'est-ce que j'ai fait cette semaine ».
       Le Suivi, lui, n'en a pas besoin : il compare des comptes, il ne
       déroule pas une chronologie.

       « Muscu » devient « Séances », le mot du Suivi : deux noms pour la
       même chose coûtent plus que la lettre qu'ils économisent. */
    var barre = h('div', { class: 'sous-onglets', role: 'tablist',
                           'aria-label': 'Ce que le journal montre' });
    [['tout', 'Tout'], ['muscu', 'Séances'], ['recup', 'Récup'],
     ['sparring', 'Sparring']].forEach(function (f) {
      var b = h('button', { type: 'button', class: 'sous-onglet', text: f[1],
                            role: 'tab',
                            'aria-pressed': filtre === f[0] ? 'true' : 'false',
                            'aria-selected': filtre === f[0] ? 'true' : 'false' });
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
          : filtre === 'recup'
          ? 'Aucune journée de récupération. Elles entrent ici dès qu’une ligne est cochée dans l’onglet Récup.'
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
      hote.appendChild(se.type === 'sparring' ? carteSparring(se, hote)
                     : se.type === 'recup' ? carteRecup(se, hote)
                     : carteMuscu(se, hote));
    });
  }

  A.vues = A.vues || {};
  A.vues.journal = { rendre: rendre, titre: function () { return 'Journal'; } };
})(window.App || (window.App = {}));
