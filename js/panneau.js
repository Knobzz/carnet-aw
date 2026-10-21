/* Panneau plein écran + éditeur d'attributs d'exercice, partagé entre
   l'éditeur de programme et la séance en cours. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function ouvrirPanneau(titre, construireCorps, actions, auxFermer) {
    var corps = A.ui.h('div', { class: 'panneau-corps' });
    var interieur = h('div', { class: 'interieur' });
    corps.appendChild(interieur);

    var fermerBt = h('button', { class: 'bt-icone', 'aria-label': 'Fermer', text: '✕' });
    var pan = h('div', { class: 'panneau', role: 'dialog', 'aria-modal': 'true', 'aria-label': titre },
      h('div', { class: 'panneau-entete' }, fermerBt, h('h2', { text: titre })),
      corps);

    var ferme = false;
    var entree = null;

    /* detruire() = le démontage seul ; fermer() = démontage + consommation de
       l'entrée d'historique. Le Retour d'Android appelle detruire() directement,
       l'interface appelle fermer(). */
    function detruire() {
      if (ferme) return;
      ferme = true;
      document.removeEventListener('keydown', esc);
      if (pan.parentNode) pan.parentNode.removeChild(pan);
      if (auxFermer) auxFermer();
    }
    function fermer() {
      if (ferme) return;
      detruire();
      A.ui.depiler(entree);
    }
    function esc(e) {
      if (e.key !== 'Escape') return;
      if (document.querySelector('.popo')) return;              // une feuille de choix est ouverte
      var tous = document.querySelectorAll('.panneau');
      if (tous[tous.length - 1] !== pan) return;                // seul celui du dessus se ferme
      fermer();
    }
    fermerBt.addEventListener('click', fermer);
    document.addEventListener('keydown', esc);

    construireCorps(interieur, fermer);

    if (actions && actions.length) {
      var pied = h('div', { class: 'panneau-pied' });
      actions.forEach(function (a) {
        var b = h('button', { class: 'bt ' + (a.classe || ''), text: a.nom });
        b.addEventListener('click', function () { a.action(fermer); });
        pied.appendChild(b);
      });
      pan.appendChild(pied);
    }

    document.body.appendChild(pan);
    entree = A.ui.empiler(detruire);
    return fermer;
  }

  /* Attributs d'un exercice. `exo` est muté en place ; `onFini` sert à
     rafraîchir uniquement l'en-tête concerné, jamais la liste entière. */
  function editerExercice(exo, options, onFini) {
    options = options || {};
    var etat = A.store.etat();
    var titre = options.titre || (exo.nom ? 'Modifier l’exercice' : 'Nouvel exercice');

    var valider = null;

    ouvrirPanneau(titre, function (c, fermer) {
      var champNom = h('input', { class: 'champ', value: exo.nom || '',
                                  placeholder: 'Curl marteau fat grip', inputmode: 'text' });
      var gNom = A.ui.groupe('Nom de l’exercice', champNom);
      c.appendChild(gNom);

      var btAw = h('button', { type: 'button', class: 'puce puce-aw', text: 'Spécifique bras de fer',
                               'aria-pressed': exo.aw ? 'true' : 'false' });
      var selCharge = h('select', { class: 'champ' });
      var selForces = null;

      A.ui.autocomplete(champNom, function (saisie) {
        return A.m.suggestions(etat, saisie, 8).map(function (x) {
          var j = [];
          if (x.aw) j.push({ texte: 'AW', classe: '' });
          j.push({ texte: A.m.typeCharge(x.typeCharge).nom });
          if ((x.outils || []).length) j.push({ texte: x.outils.join(' + '), classe: 'jeton-outil' });
          x.jetons = j;
          return x;
        });
      }, function (it) {
        /* Reprendre un nom connu reprend ses attributs : on ne les resaisit pas. */
        exo.aw = it.aw;
        exo.typeCharge = it.typeCharge;
        exo.forces = (it.forces || []).slice();
        exo.outils = (it.outils || []).slice();
        exo.structures = (it.structures || []).slice();
        btAw.setAttribute('aria-pressed', exo.aw ? 'true' : 'false');
        selCharge.value = exo.typeCharge;
        if (selForces) rafraichirForces();
        rafraichirOutils();
        rafraichirStructures();
      });

      btAw.addEventListener('click', function () {
        exo.aw = !exo.aw;
        btAw.setAttribute('aria-pressed', exo.aw ? 'true' : 'false');
      });
      c.appendChild(A.ui.groupe('', btAw,
        'Compté dans le volume AW, à part de la muscu générale.'));

      A.m.TYPES_CHARGE.forEach(function (t) {
        selCharge.appendChild(h('option', { value: t.id, text: t.nom }));
      });
      selCharge.value = exo.typeCharge || 'kg';
      selCharge.addEventListener('change', function () { exo.typeCharge = selCharge.value; });
      c.appendChild(A.ui.groupe('Type de charge', selCharge,
        'Seul « Kilos » entre dans le tonnage. Les autres sont comptés en séries.'));

      var boiteOutils = h('div');
      function rafraichirOutils() {
        A.ui.vider(boiteOutils);
        boiteOutils.appendChild(A.ui.champMulti(exo.outils || [], function (q, deja) {
          return A.m.suggestionsOutils(etat, q, deja, 8).map(function (o) {
            o.jetons = o.categorie ? [{ texte: o.categorie }] : [];
            return o;
          });
        }, function (v) { exo.outils = v; }, 'Dumbbell, poulie haute, Titan Grip…'));
      }
      rafraichirOutils();
      c.appendChild(A.ui.groupe('Outils', boiteOutils,
        'Autant qu’il en faut : « Titan Grip » et « Poulie haute » cohabitent sur le même exercice. La liste n’est pas imposée, elle retient ce que tu saisis.'));

      /* Les structures chargees. Memes identifiants que les zones de douleur :
         c'est ce qui permet a Suivi de repondre a « quand ai-je charge lourd le
         medial », question a laquelle la liste par exercice ne sait pas repondre. */
      var boiteStructures = h('div');
      function rafraichirStructures() {
        A.ui.vider(boiteStructures);
        boiteStructures.appendChild(A.ui.selecteurStructures(exo.structures || [],
          function (v) { exo.structures = v; }));
      }
      rafraichirStructures();
      c.appendChild(A.ui.groupe('Structures chargées', boiteStructures,
        'Facultatif. Les cinq premières sont les zones de douleur : les renseigner '
        + 'permet à Suivi de relier une douleur à ce qui l’a précédée.'));

      var boiteForces = h('div');
      function rafraichirForces() {
        A.ui.vider(boiteForces);
        selForces = A.ui.selecteurForces(exo.forces || [], function (v) { exo.forces = v; });
        boiteForces.appendChild(selForces);
      }
      rafraichirForces();
      c.appendChild(A.ui.groupe('Forces de Larratt', boiteForces,
        'Facultatif. Sert à repérer, dans Suivi, une force qu’un programme néglige.'));

      var champConsigne = h('textarea', { class: 'champ',
        placeholder: 'Tenue 3 s en haut, excentrique 4 s. Prise pronation serrée.' });
      champConsigne.value = exo.consigne || '';
      champConsigne.addEventListener('input', function () { exo.consigne = champConsigne.value; });
      c.appendChild(A.ui.groupe('Consigne d’exécution', champConsigne,
        'Tempo, tenue, prise. Affichée en clair pendant la séance.'));

      var champRepos = h('input', { class: 'champ', type: 'number', min: '0', step: '15',
                                    inputmode: 'numeric', value: exo.reposSecondes == null ? 120 : exo.reposSecondes });
      champRepos.addEventListener('input', function () {
        var n = parseInt(champRepos.value, 10);
        exo.reposSecondes = isFinite(n) && n >= 0 ? n : 0;
      });
      c.appendChild(A.ui.groupe('Repos (secondes)', champRepos,
        'Durée lancée par le ✓ d’une série.'));

      valider = function () {
        var nom = champNom.value.trim();
        if (!nom) { A.ui.toast('Donne un nom à l’exercice.'); champNom.focus(); return false; }
        exo.nom = nom;
        exo.slug = A.m.slug(nom);
        exo.consigne = champConsigne.value;
        (exo.outils || []).forEach(function (o) { A.m.majCatalogueOutils(etat, o); });
        if (!exo.structures) exo.structures = [];
        A.m.majCatalogue(etat, exo);
        return true;
      };
      setTimeout(function () { if (!exo.nom) champNom.focus(); }, 60);
    }, [
      { nom: 'Annuler', action: function (fermer) { fermer(); } },
      { nom: 'Enregistrer', classe: 'bt-primaire', action: function (fermer) {
          if (valider && !valider()) return;
          fermer();
          onFini && onFini(exo);
        } }
    ]);
  }

  A.panneau = { ouvrir: ouvrirPanneau, editerExercice: editerExercice };
})(window.App || (window.App = {}));
