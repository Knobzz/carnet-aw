/* Historique d'un exercice.

   PRÉCÉDENT ne montre que la séance d'avant : c'est ce qu'il faut sous les
   doigts pendant une série. Sur trois mois, la pente est invisible — c'est ce
   que cet écran rend.

   Il n'a pas d'onglet : il s'ouvre depuis l'exercice lui-même, en séance ou
   depuis Suivi. Un sixième onglet aurait coûté de la place à 375 px pour un
   écran qu'on consulte, pas qu'on habite. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function etat() { return A.store.etat(); }

  /* Record : la série la plus lourde jamais faite, et quand.
     N'a de sens que si la charge est chiffrée — un gripper n'a pas de record
     au tonnage, et on ne fait pas semblant. */
  function record(lignes) {
    var best = null;
    lignes.forEach(function (l) {
      if (!l.meilleure) return;
      if (!best || l.meilleure.charge > best.charge
          || (l.meilleure.charge === best.charge && l.meilleure.reps > best.reps)) {
        best = { charge: l.meilleure.charge, reps: l.meilleure.reps, date: l.date };
      }
    });
    return best;
  }

  function ouvrir(exoSlug, nomAffiche) {
    var lignes = A.m.historiqueExercice(etat(), exoSlug);
    var nom = nomAffiche || (lignes[0] && lignes[0].programme) || exoSlug;
    if (lignes.length) {
      // le nom tel qu'il a été saisi la dernière fois
      var cat = A.m.trouverCatalogue(etat(), exoSlug);
      if (cat) nom = cat.nom;
    }

    A.panneau.ouvrir(nom, function (c) {
      if (!lignes.length) {
        c.appendChild(h('div', { class: 'vide' },
          h('strong', { text: 'Aucune série validée' }),
          'Cet exercice n’a pas encore d’historique. Valide des séries en séance : elles apparaîtront ici.'));
        return;
      }

      var tc = A.m.typeCharge(lignes[0].typeCharge);
      var rec = record(lignes);
      var tonnages = lignes.filter(function (l) { return l.tonnage != null; });

      /* --- l'essentiel en trois chiffres --- */
      var derniere = lignes[0];
      c.appendChild(h('dl', { class: 'totaux' },
        h('div', {}, h('dt', { text: 'Séances' }), h('dd', { class: 'chiffre', text: String(lignes.length) })),
        h('div', {}, h('dt', { text: 'Depuis' }),
          h('dd', { class: 'chiffre', text: A.m.joursDepuis(lignes[lignes.length - 1].date) + ' j' })),
        h('div', { class: 'aw' }, h('dt', { text: 'Vu il y a' }),
          h('dd', { class: 'chiffre', text: A.m.joursDepuis(derniere.date) + ' j' }))));

      if (rec) {
        c.appendChild(h('p', { class: 'note-exclus',
          text: 'Meilleure série : ' + A.m.fmt(rec.charge, true) + (tc.unite ? ' ' + tc.unite : '')
              + ' × ' + rec.reps + ', le ' + A.m.dateCourte(rec.date) + '.' }));
      } else {
        c.appendChild(h('p', { class: 'note-exclus',
          text: 'Charge non chiffrée : pas de record au tonnage, les séries sont comptées telles quelles.' }));
      }

      /* --- la pente du tonnage, quand il y en a un --- */
      if (tonnages.length >= 2) {
        c.appendChild(h('div', { class: 'sous-titre', text: 'Volume par séance' }));
        var max = tonnages.reduce(function (m, l) { return Math.max(m, l.tonnage); }, 0) || 1;
        var carte = h('div', { class: 'carte' });
        var corps = h('div', { class: 'carte-corps' });
        var barres = h('div', { class: 'barres' });
        /* du plus ancien au plus récent : une pente se lit de gauche à droite,
           et une liste antéchronologique l'inverserait visuellement. */
        tonnages.slice().reverse().forEach(function (l) {
          barres.appendChild(h('div', { class: 'barre' },
            h('span', { class: 'tab-num', text: A.m.dateCourte(l.date).replace(/ \d{4}$/, '') }),
            h('div', { class: 'barre-piste' },
              h('i', { class: 'gen', style: 'width:' + (l.tonnage / max * 100) + '%' })),
            h('span', { class: 'barre-val', text: A.m.fmt(Math.round(l.tonnage)) })));
        });
        corps.appendChild(barres);
        carte.appendChild(corps);
        c.appendChild(carte);
      }

      /* --- chaque séance, dans le détail --- */
      c.appendChild(h('div', { class: 'sous-titre', text: 'Séance par séance' }));
      var liste = h('div', { class: 'carte' });
      var corpsL = h('div', { class: 'carte-corps' });

      lignes.forEach(function (l) {
        var estRecord = rec && l.meilleure
          && l.meilleure.charge === rec.charge && l.meilleure.reps === rec.reps && l.date === rec.date;

        var detail = l.detail.map(function (s) {
          var t = s.texte;
          if (s.type !== 'normale') t = A.m.TYPES_SERIE[s.type].lettre + ' ' + t;
          if (s.rpe != null) t += '@' + s.rpe;
          return t;
        }).join('   ');

        corpsL.appendChild(h('div', { class: 'histo-ligne' },
          h('span', { class: 'histo-date', text: A.m.dateCourte(l.date).replace(/ \d{4}$/, '') }),
          h('span', { class: 'histo-series' + (estRecord ? ' histo-record' : ''), text: detail }),
          h('span', { class: 'histo-total',
                      text: l.tonnage != null ? A.m.fmt(Math.round(l.tonnage)) + ' kg'
                            : l.tempsSousTension != null ? A.m.texteDuree(l.tempsSousTension)
                            : l.series + ' sér.' })));
      });

      corpsL.appendChild(h('div', { class: 'item-resume', style: 'margin-top:10px',
        text: 'D dégressive · E à l’échec · @ le RPE noté.' }));
      liste.appendChild(corpsL);
      c.appendChild(liste);
    }, [
      { nom: 'Fermer', classe: 'bt-primaire', action: function (fermer) { fermer(); } }
    ]);
  }

  /* Liste de tous les exercices pratiqués, pour entrer dans l'historique
     sans passer par une séance. */
  function choisir() {
    var l = A.m.exercicesPratiques(etat());
    if (!l.length) {
      A.ui.toast('Aucun exercice n’a encore de série validée.');
      return;
    }
    A.panneau.ouvrir('Historique par exercice', function (c) {
      var carte = h('div', { class: 'carte' });
      var corps = h('div', { class: 'carte-corps' });
      l.forEach(function (x) {
        var j = A.m.joursDepuis(x.derniere);
        var ligne = h('div', { class: 'item-ligne', style: 'align-items:center;padding:7px 0;cursor:pointer' },
          h('b', { text: x.nom }),
          x.aw ? h('span', { class: 'jeton', text: 'AW' }) : null,
          h('span', { class: 'delai', dataset: { zone: A.m.zoneDelai(j) },
                      text: j === 0 ? 'auj.' : (j === 1 ? 'hier' : j + ' j') }));
        ligne.addEventListener('click', function () { ouvrir(x.slug, x.nom); });
        corps.appendChild(ligne);
      });
      carte.appendChild(corps);
      c.appendChild(carte);
    }, [
      { nom: 'Fermer', classe: 'bt-primaire', action: function (fermer) { fermer(); } }
    ]);
  }

  A.vues = A.vues || {};
  A.vues.exercice = { ouvrir: ouvrir, choisir: choisir };
})(window.App || (window.App = {}));
