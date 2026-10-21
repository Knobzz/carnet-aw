/* Suivi — l'app ne décide rien et ne propose aucun programme.
   Elle donne la matière : qui a été sollicité, quand, et ce qui a précédé une douleur. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function etat() { return A.store.etat(); }

  function section(titre, aide) {
    var f = document.createDocumentFragment();
    f.appendChild(h('div', { class: 'sous-titre', text: titre }));
    if (aide) f.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px', text: aide }));
    return f;
  }

  /* ------------------------------------------------------------------
     1. dernière sollicitation par exercice — le cœur du raisonnement tendineux
     ------------------------------------------------------------------ */
  function blocSollicitation(e) {
    var f = document.createDocumentFragment();
    f.appendChild(section('Dernière sollicitation',
      'Depuis combien de jours chaque exercice n’a pas été fait. Rouge : moins de 48 h. Laiton : 48 à 72 h. À toi de juger ce qui se recoupe.'));

    var liste = A.m.derniereSollicitation(e);
    if (!liste.length) {
      f.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Rien encore' }),
        'Valide des séries dans une séance : elles apparaîtront ici avec leur ancienneté.'));
      return f;
    }

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps', style: 'padding:6px 12px 10px' });
    var voirTout = liste.length > 10;
    var montres = voirTout ? liste.slice(0, 10) : liste;

    function ligne(x) {
      var j = x.jours;
      var txt = j === 0 ? "aujourd’hui" : (j === 1 ? 'hier' : j + ' j');
      return h('div', { class: 'item-ligne', style: 'padding:5px 0;align-items:center' },
        h('b', { text: x.nom }),
        x.aw ? h('span', { class: 'jeton', text: 'AW' }) : null,
        h('span', { class: 'delai', dataset: { zone: A.m.zoneDelai(j) }, text: txt }));
    }

    montres.forEach(function (x) { corps.appendChild(ligne(x)); });

    if (voirTout) {
      var bt = h('button', { class: 'bt bt-petit bt-fantome', style: 'margin-top:6px',
                             text: 'Voir les ' + (liste.length - 10) + ' autres' });
      bt.addEventListener('click', function () {
        liste.slice(10).forEach(function (x) { corps.insertBefore(ligne(x), bt); });
        bt.remove();
      });
      corps.appendChild(bt);
    }

    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  /* ------------------------------------------------------------------
     2. douleurs et ce qui les a précédées
     ------------------------------------------------------------------ */
  function blocDouleurs(e) {
    var f = document.createDocumentFragment();
    f.appendChild(section('Douleurs',
      'Chaque épisode, avec ce que tu as fait dans les 72 h qui l’ont précédé.'));

    var eps = A.m.episodesDouleur(e);
    if (!eps.length) {
      f.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Aucune douleur notée' }),
        'La ligne de douleurs est sur chaque séance, muscu comme sparring.'));
      return f;
    }

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });

    eps.slice(0, 12).forEach(function (se) {
      var bloc = h('div', { class: 'episode' });
      bloc.appendChild(h('div', { class: 'episode-tete' },
        h('b', { text: A.m.dateCourte(se.date) }),
        h('span', { class: 'item-date',
                    text: se.type === 'sparring' ? 'sparring' : (se.programmeNom || 'séance libre') })));
      bloc.appendChild(h('div', { class: 'enrobe', style: 'margin:4px 0 2px' },
        (se.douleurs || []).filter(function (z) { return z !== 'aucune'; }).map(function (z) {
          return h('span', { class: 'jeton jeton-douleur', text: A.m.nomZone(z) });
        })));

      var avant = A.m.fenetreAvant(e, se.date, 72, se.id);
      var zone = h('div', { class: 'fenetre72' });
      var bt = h('button', { class: 'bt bt-petit bt-fantome', style: 'padding:0 4px',
                             text: avant.length
                               ? 'Voir les 72 h précédentes (' + avant.length + ')'
                               : 'Rien dans les 72 h précédentes' });
      if (avant.length) {
        bt.addEventListener('click', function () {
          if (zone.firstChild) { A.ui.vider(zone); bt.textContent = 'Voir les 72 h précédentes (' + avant.length + ')'; return; }
          bt.textContent = 'Masquer';
          var ul = h('ul');
          avant.forEach(function (s) {
            var quoi;
            if (s.type === 'sparring') {
              quoi = 'Sparring' + (s.rounds ? ' · ' + s.rounds + ' rounds' : '')
                   + (s.style ? ' · ' + A.m.nomStyle(s.style) : '');
            } else {
              var noms = (s.exercices || []).filter(function (x) {
                return (x.series || []).some(function (y) { return y.faite; });
              }).map(function (x) { return x.nom + (x.aw ? ' (AW)' : ''); });
              quoi = noms.length ? noms.join(', ') : 'séance sans série validée';
            }
            var j = A.m.joursEntre(s.date, se.date);
            ul.appendChild(h('li', {},
              h('b', { text: (j === 0 ? 'le jour même' : 'J−' + j) + ' : ' }),
              quoi));
          });
          zone.appendChild(ul);
        });
      } else bt.disabled = true;

      bloc.appendChild(bt);
      bloc.appendChild(zone);
      corps.appendChild(bloc);
    });

    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  /* ------------------------------------------------------------------
     3. volume AW vs muscu générale
     ------------------------------------------------------------------ */
  function blocVolume(e) {
    var f = document.createDocumentFragment();
    f.appendChild(section('Volume par semaine', 'Tonnage des exercices chiffrés, AW à part de la muscu générale.'));

    var sem = A.m.volumeParSemaine(e, 8);
    if (!sem.length) {
      f.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Pas encore de volume' }),
        'Les exercices en kilos alimentent ce graphe. Grippers et élastiques comptent en séries, pas ici.'));
      return f;
    }

    var max = sem.reduce(function (m, s) { return Math.max(m, s.aw + s.general); }, 0) || 1;
    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });
    var barres = h('div', { class: 'barres' });

    sem.forEach(function (s) {
      var piste = h('div', { class: 'barre-piste' },
        h('i', { class: 'aw', style: 'width:' + (s.aw / max * 100) + '%' }),
        h('i', { class: 'gen', style: 'width:' + (s.general / max * 100) + '%' }));
      var d = A.m.dateCourte(s.semaine).replace(/ \d{4}$/, '');
      barres.appendChild(h('div', { class: 'barre' },
        h('span', { class: 'tab-num', text: d }),
        piste,
        h('span', { class: 'barre-val', text: A.m.fmt(Math.round(s.aw + s.general)) })));
    });

    corps.appendChild(barres);
    corps.appendChild(h('div', { class: 'legende' },
      h('span', {}, h('i', { style: 'background:var(--laiton)' }), 'AW'),
      h('span', {}, h('i', { style: 'background:var(--bleu)' }), 'Muscu générale')));
    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  /* ------------------------------------------------------------------
     4. forces de Larratt — ce qu'un programme néglige
     ------------------------------------------------------------------ */
  function blocForces(e) {
    var r = A.m.repartitionForces(e, 28);
    var f = document.createDocumentFragment();
    f.appendChild(section('Forces de Larratt — 28 derniers jours',
      'Séries validées sur les exercices que tu as associés à chaque force. Un zéro est une information.'));

    if (!r.total) {
      f.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Aucune force associée' }),
        'Facultatif : associe une ou plusieurs forces à un exercice depuis sa fiche, et ce compte se remplira.'));
      return f;
    }

    var max = Math.max.apply(null, A.m.FORCES.map(function (x) { return r.parForce[x.id]; })) || 1;
    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });
    var barres = h('div', { class: 'barres' });

    A.m.FORCES.forEach(function (x) {
      var n = r.parForce[x.id];
      barres.appendChild(h('div', { class: 'barre' },
        h('span', { text: x.nom }),
        h('div', { class: 'barre-piste' }, h('i', { class: 'gen', style: 'width:' + (n / max * 100) + '%' })),
        h('span', { class: 'barre-val', text: n + ' sér.' })));
    });

    corps.appendChild(barres);
    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  function rendre(hote) {
    A.ui.vider(hote);
    var e = etat();

    if (!e.seances.length) {
      hote.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Rien à recouper' }),
        'Le suivi se construit à partir de tes séances : ancienneté par exercice, douleurs et leurs 72 h, volume AW.'));
      return;
    }

    hote.appendChild(blocSollicitation(e));
    hote.appendChild(blocDouleurs(e));
    hote.appendChild(blocVolume(e));
    hote.appendChild(blocForces(e));
  }

  A.vues = A.vues || {};
  A.vues.suivi = { rendre: rendre, titre: function () { return 'Suivi'; } };
})(window.App || (window.App = {}));
