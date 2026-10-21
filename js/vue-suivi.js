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
      var n = h('div', { class: 'item-ligne', style: 'padding:7px 0;align-items:center;cursor:pointer' },
        h('b', { text: x.nom }),
        x.aw ? h('span', { class: 'jeton', text: 'AW' }) : null,
        h('span', { class: 'delai', dataset: { zone: A.m.zoneDelai(j) }, text: txt }));
      /* Un appui ouvre l'historique : l'anciennete dit quand, l'historique dit
         comment ça évolue. Les deux questions s'enchaînent naturellement. */
      n.addEventListener('click', function () { A.vues.exercice.ouvrir(x.slug, x.nom); });
      return n;
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
     1 bis. par STRUCTURE — la question que la liste par exercice ne sait pas traiter
     ------------------------------------------------------------------ */
  function blocStructures(e) {
    var f = document.createDocumentFragment();
    var l = A.m.derniereSollicitationStructure(e).filter(function (s) { return s.date; });

    f.appendChild(section('Par structure',
      'Un exercice charge plusieurs structures, et une structure est chargée par plusieurs exercices. '
      + 'C’est ici que se lit « quand ai-je chargé lourd le médial », toutes origines confondues.'));

    if (!l.length) {
      f.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Aucune structure renseignée' }),
        'Facultatif : ouvre la fiche d’un exercice et coche ce qu’il charge. Les cinq premières '
        + 'structures sont les zones de douleur — c’est ce qui permet de relier les deux.'));
      return f;
    }

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps', style: 'padding:6px 12px 10px' });

    l.sort(function (a, b) { return a.jours - b.jours; }).forEach(function (s) {
      var j = s.jours;
      var txt = j === 0 ? "aujourd’hui" : (j === 1 ? 'hier' : j + ' j');
      corps.appendChild(h('div', { class: 'item-ligne', style: 'padding:7px 0;align-items:center' },
        h('b', { text: s.nom }),
        h('span', { style: 'font-size:.78rem', text: s.series + ' sér.' }),
        h('span', { class: 'delai', dataset: { zone: A.m.zoneDelai(j) }, text: txt })));
      if (s.exercices.length) {
        corps.appendChild(h('div', { class: 'item-resume', style: 'margin:-4px 0 4px 0;font-size:.76rem',
          text: s.exercices.join(', ') }));
      }
    });

    /* Les structures jamais chargées sont une information, pas un vide. */
    var jamais = A.m.derniereSollicitationStructure(e)
      .filter(function (s) { return !s.date; })
      .map(function (s) { return s.nom; });
    if (jamais.length) {
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin-top:8px',
        text: 'Jamais chargée : ' + jamais.join(', ') + '.' }));
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
        A.m.zonesVives(se.douleurs).map(function (d) {
          return h('span', { class: 'jeton jeton-douleur', text: A.m.texteDouleur(d) });
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
     2 bis. la PENTE de chaque zone — ce qu'un oui/non ne peut pas montrer
     ------------------------------------------------------------------ */
  function blocPentes(e) {
    var zones = A.m.zonesRencontrees(e);
    var f = document.createDocumentFragment();
    if (!zones.length) return f;

    f.appendChild(section('Évolution par zone',
      'Chaque barre est un relevé, du plus ancien au plus récent. Une zone qui descend '
      + 'et une zone qui monte ne demandent pas la même chose.'));

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });

    zones.forEach(function (z) {
      var pts = A.m.suiviZone(e, z, 16);
      var connues = pts.filter(function (p) { return p.intensite != null; });

      var pente = h('div', { class: 'pente' });
      pts.forEach(function (p) {
        var i = p.intensite;
        var niveau = i == null ? 'inconnu' : (i < 4 ? 'bas' : (i < 7 ? 'moyen' : 'haut'));
        var hauteur = i == null ? 10 : Math.max(2, i / 10 * 34);
        pente.appendChild(h('i', { dataset: { niveau: niveau },
                                   style: 'height:' + hauteur + 'px',
                                   title: A.m.dateCourte(p.date) + (i == null ? ' — intensité non précisée' : ' — ' + i + '/10') }));
      });

      var resume;
      if (connues.length >= 2) {
        var d = connues[connues.length - 1].intensite - connues[0].intensite;
        resume = d > 0 ? 'en hausse de ' + d : (d < 0 ? 'en baisse de ' + (-d) : 'stable');
        resume += ' sur ' + connues.length + ' relevés';
      } else if (connues.length === 1) {
        resume = 'un seul relevé chiffré : ' + connues[0].intensite + '/10';
      } else {
        resume = 'aucune intensité renseignée — seule la présence est connue';
      }

      corps.appendChild(h('div', { style: 'margin-bottom:14px' },
        h('div', { class: 'item-ligne', style: 'align-items:baseline' },
          h('b', { text: A.m.nomZone(z) }),
          h('span', { style: 'font-size:.78rem', text: pts.length + ' fois' })),
        pente,
        h('div', { class: 'item-resume', style: 'margin-top:4px', text: resume })));
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

    var btHisto = h('button', { class: 'bt bt-large', style: 'margin-bottom:12px',
                                text: 'Historique par exercice' });
    btHisto.addEventListener('click', function () { A.vues.exercice.choisir(); });
    hote.appendChild(btHisto);

    hote.appendChild(blocSollicitation(e));
    hote.appendChild(blocStructures(e));
    hote.appendChild(blocDouleurs(e));
    hote.appendChild(blocPentes(e));
    hote.appendChild(blocVolume(e));
    hote.appendChild(blocForces(e));
  }

  A.vues = A.vues || {};
  A.vues.suivi = { rendre: rendre, titre: function () { return 'Suivi'; } };
})(window.App || (window.App = {}));
