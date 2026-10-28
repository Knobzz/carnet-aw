/* Sparring — formulaire par séance. Même modèle de douleurs que la muscu,
   pour que le recoupement 72 h traite les deux dans une seule liste. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function etat() { return A.store.etat(); }

  function editer(sp, estNeuf, surFin) {
    A.panneau.ouvrir(estNeuf ? 'Nouveau sparring' : 'Sparring du ' + A.m.dateCourte(sp.date),
      function (c, fermerPanneau) {
        var date = h('input', { class: 'champ', type: 'date', value: sp.date });
        date.addEventListener('input', function () { if (date.value) { sp.date = date.value; A.store.sauver(); } });

        var club = h('input', { class: 'champ', value: sp.club || '', placeholder: 'Nom du club' });
        club.addEventListener('input', function () { sp.club = club.value; A.store.sauver(); });

        c.appendChild(A.ui.groupe('Date', date));
        c.appendChild(A.ui.groupe('Club', club));

        var duree = h('input', { class: 'champ', type: 'number', min: '0', inputmode: 'numeric',
                                 value: sp.dureeMin == null ? '' : sp.dureeMin, placeholder: '90' });
        duree.addEventListener('input', function () {
          var n = parseInt(duree.value, 10); sp.dureeMin = isFinite(n) ? n : null; A.store.sauver();
        });
        var rounds = h('input', { class: 'champ', type: 'number', min: '0', inputmode: 'numeric',
                                  value: sp.rounds == null ? '' : sp.rounds, placeholder: '12' });
        rounds.addEventListener('input', function () {
          var n = parseInt(rounds.value, 10); sp.rounds = isFinite(n) ? n : null; A.store.sauver();
        });
        c.appendChild(h('div', { class: 'grille-2' },
          A.ui.groupe('Durée (min)', duree), A.ui.groupe('Rounds', rounds)));

        c.appendChild(h('label', { text: 'Style travaillé' }));
        var puces = h('div', { class: 'enrobe', style: 'margin-bottom:12px' });
        A.m.STYLES.forEach(function (s) {
          var b = h('button', { type: 'button', class: 'puce', text: s.nom,
                                'aria-pressed': sp.style === s.id ? 'true' : 'false' });
          b.addEventListener('click', function () {
            sp.style = (sp.style === s.id) ? '' : s.id;
            Array.prototype.forEach.call(puces.children, function (n, i) {
              n.setAttribute('aria-pressed', A.m.STYLES[i].id === sp.style ? 'true' : 'false');
            });
            A.store.sauver();
          });
          puces.appendChild(b);
        });
        c.appendChild(puces);

        /* De quel bras. Un sparring charge un coude, pas deux — sauf si on a
           tiré des deux côtés, ce que « Les deux » dit. */
        c.appendChild(h('label', { text: 'Bras' }));
        var cotes = A.ui.selecteurCote(sp.cote, function (v) { sp.cote = v; A.store.sauver(); });
        cotes.style.marginBottom = '12px';
        c.appendChild(cotes);

        var part = h('input', { class: 'champ', value: sp.partenaires || '',
                                placeholder: 'Qui, et à quel niveau' });
        part.addEventListener('input', function () { sp.partenaires = part.value; A.store.sauver(); });
        c.appendChild(A.ui.groupe('Partenaires', part));

        var tech = h('textarea', { class: 'champ',
          placeholder: 'Ce que j’ai travaillé : départ, pression latérale, tenue du poignet…' });
        tech.value = sp.technique || '';
        tech.addEventListener('input', function () { sp.technique = tech.value; A.store.sauver(); });
        c.appendChild(A.ui.groupe('Points techniques travaillés', tech));

        var res = h('textarea', { class: 'champ', placeholder: 'Comment ça a répondu, ce qui a lâché, ce qui a tenu.' });
        res.value = sp.ressenti || '';
        res.addEventListener('input', function () { sp.ressenti = res.value; A.store.sauver(); });
        c.appendChild(A.ui.groupe('Ressenti', res));

        c.appendChild(h('label', { text: 'Douleurs ressenties' }));
        c.appendChild(A.ui.selecteurDouleurs(sp.douleurs, function (v) { sp.douleurs = v; A.store.sauver(true); }));
        c.appendChild(h('div', { class: 'item-resume', style: 'margin:6px 0 12px',
          text: 'Suivi recoupera cette ligne avec les séances des 72 h précédentes.' }));

        var note = h('textarea', { class: 'champ', placeholder: 'Autre chose à retenir.' });
        note.value = sp.note || '';
        note.addEventListener('input', function () { sp.note = note.value; A.store.sauver(); });
        c.appendChild(A.ui.groupe('Note', note));

        if (!estNeuf) {
          var sup = A.ui.confirmer2(
            h('button', { class: 'bt bt-large bt-danger', style: 'margin-top:12px', text: 'Supprimer ce sparring' }),
            'Appuyer encore pour supprimer',
            function () {
              var l = etat().seances, i = -1;
              for (var k = 0; k < l.length; k++) if (l[k].id === sp.id) i = k;
              if (i >= 0) l.splice(i, 1);
              A.store.sauver(true);
              fermerPanneau();
              A.ui.toast('Sparring supprimé.');
              surFin && surFin(true);
            });
          c.appendChild(sup);
        }
      },
      [{ nom: estNeuf ? 'Enregistrer' : 'Fermer', classe: 'bt-primaire', action: function (fermer) {
          A.store.sauver(true);
          fermer();
          surFin && surFin(false);
        } }],
      /* RIEN D'ECRIT, RIEN DE GARDE — MB, 27/10. C'est le QUATRIEME
         argument de `panneau.ouvrir`, celui qui s'execute au DEMONTAGE :
         le seul chemin que la croix, le Retour d'Android et le bouton
         « Enregistrer » traversent tous les trois. Ecrit dans l'action du
         bouton seul, la croix serait passee a cote — et la croix est
         justement le geste de celui qui a appuye par erreur. */
      function () {
        if (!estNeuf || !A.m.sparringVierge(sp)) return;
        var l = etat().seances;
        for (var k = 0; k < l.length; k++) {
          if (l[k].id === sp.id) { l.splice(k, 1); break; }
        }
        A.store.sauver(true);
      });
  }

  function nouveau(surFin) {
    var sp = A.m.seanceSparring();
    etat().seances.push(sp);
    A.store.sauver(true);
    editer(sp, true, function (supprime) {
      /* Le nettoyage a deja eu lieu au demontage : on regarde si le
         sparring a SURVECU, plutot que de refaire le test. Annoncer
         « enregistre » pour une ligne qu'on vient de retirer serait un
         mensonge poli. */
      var garde = etat().seances.some(function (x) { return x.id === sp.id; });
      if (!supprime && garde) A.ui.toast('Sparring enregistré.');
      surFin && surFin();
    });
  }

  A.vues = A.vues || {};
  A.vues.sparring = { editer: editer, nouveau: nouveau };
})(window.App || (window.App = {}));
