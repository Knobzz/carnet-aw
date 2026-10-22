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

  /* ------------------------------------------------------------------
     Choisir dans tout l'équipement

     Taper le nom marche quand on le connaît. Passé une vingtaine d'outils, on
     ne les connaît plus par cœur et la liste déroulante de huit ne montre que
     les plus récents : il faut pouvoir OUVRIR son équipement, le voir rangé,
     et en cocher plusieurs d'un coup.

     Les catégories se replient — c'est ce qui rend trente outils parcourables
     sur un téléphone — et un filtre coupe court quand on sait ce qu'on veut.

     Les outils portés par l'exercice mais ABSENTS du catalogue (saisis à la
     main, ou retirés de l'équipement depuis) sont montrés à part et gardés :
     valider ne doit jamais faire disparaître en silence ce qui était là.
     ------------------------------------------------------------------ */
  function choisirOutils(etat, deja, onValider) {
    deja = (deja || []).slice();

    /* L'identité est le slug, comme partout ailleurs ; la valeur gardée est
       le NOM, comme partout ailleurs aussi. */
    var choisis = {};
    deja.forEach(function (n) { choisis[A.m.slug(n)] = n; });

    var groupes = A.m.outilsParCategorie(etat);
    var connus = {};
    groupes.forEach(function (g) { g.outils.forEach(function (o) { connus[o.slug] = true; }); });
    var horsCatalogue = deja.filter(function (n) { return !connus[A.m.slug(n)]; });

    ouvrirPanneau('Mon équipement', function (c, fermer) {
      if (!groupes.length && !horsCatalogue.length) {
        c.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Aucun équipement' }),
          'Rien n’est livré avec l’app. Ajoute tes outils depuis Réglages, '
        + 'ou tape-les directement dans la fiche : ils entreront tout seuls.'));
        return;
      }

      var champFiltre = h('input', { class: 'champ', type: 'search',
                                     placeholder: 'Filtrer — poulie, grip…',
                                     inputmode: 'search', enterkeyhint: 'done' });
      c.appendChild(A.ui.groupe('', champFiltre));

      var compteur = h('div', { class: 'item-resume', style: 'margin:-4px 2px 10px' });
      c.appendChild(compteur);
      function majCompteur() {
        var n = Object.keys(choisis).length;
        compteur.textContent = n ? n + ' outil' + (n > 1 ? 's' : '') + ' sur cet exercice'
                                 : 'Aucun outil sur cet exercice.';
      }
      majCompteur();

      var sections = [];

      function section(titre, outils, ouvertParDefaut) {
        var corps = h('div', { class: 'equip-liste' });
        var chevron = h('span', { class: 'equip-chevron', 'aria-hidden': 'true', text: '▾' });
        var compte = h('span', { class: 'equip-compte' });
        var entete = h('button', { type: 'button', class: 'equip-cat',
                                   'aria-expanded': ouvertParDefaut ? 'true' : 'false' },
          chevron, h('b', { text: titre }), compte);

        var lignes = [];
        outils.forEach(function (o) {
          var slug = o.slug || A.m.slug(o.nom);
          var bt = h('button', { type: 'button', class: 'equip-ligne',
                                 'aria-pressed': choisis[slug] ? 'true' : 'false' },
            h('span', { class: 'equip-coche', 'aria-hidden': 'true' }),
            h('span', { class: 'equip-nom', text: o.nom }));
          bt.addEventListener('click', function () {
            if (choisis[slug]) delete choisis[slug]; else choisis[slug] = o.nom;
            bt.setAttribute('aria-pressed', choisis[slug] ? 'true' : 'false');
            majCompte();
            majCompteur();
          });
          lignes.push({ bouton: bt, slug: slug, nom: o.nom });
          corps.appendChild(bt);
        });

        function majCompte() {
          var n = lignes.filter(function (l) { return !!choisis[l.slug]; }).length;
          compte.textContent = n ? n + ' / ' + lignes.length : String(lignes.length);
        }
        majCompte();

        function ouvrir(oui) {
          entete.setAttribute('aria-expanded', oui ? 'true' : 'false');
          corps.hidden = !oui;
        }
        ouvrir(ouvertParDefaut);
        entete.addEventListener('click', function () {
          ouvrir(entete.getAttribute('aria-expanded') !== 'true');
        });

        var bloc = h('div', { class: 'equip-bloc' }, entete, corps);
        c.appendChild(bloc);
        sections.push({ bloc: bloc, lignes: lignes, ouvrir: ouvrir, majCompte: majCompte });
      }

      /* Ce qui est sur l'exercice sans être au catalogue vient en premier :
         c'est ce qu'on risquerait de perdre sans le voir. */
      if (horsCatalogue.length) {
        section('Sur cet exercice, hors équipement',
                horsCatalogue.map(function (n) { return { nom: n, slug: A.m.slug(n) }; }), true);
      }
      groupes.forEach(function (g) { section(g.categorie, g.outils, true); });

      /* Filtrer : on masque les lignes qui ne correspondent pas, et une
         catégorie vidée disparaît plutôt que de laisser un titre orphelin.
         Le filtre OUVRE ce qu'il trouve — sinon il faudrait déplier pour voir
         le résultat de sa propre recherche. */
      champFiltre.addEventListener('input', function () {
        var q = A.m.slug(champFiltre.value);
        sections.forEach(function (s) {
          var visibles = 0;
          s.lignes.forEach(function (l) {
            var ok = !q || l.slug.indexOf(q) >= 0;
            l.bouton.hidden = !ok;
            if (ok) visibles += 1;
          });
          s.bloc.hidden = visibles === 0;
          if (q) s.ouvrir(true);
        });
      });
      champFiltre.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); champFiltre.blur(); }
      });
    }, [
      { nom: 'Annuler', action: function (fermer) { fermer(); } },
      { nom: 'Valider', classe: 'bt-primaire', action: function (fermer) {
          /* L'ordre déjà en place est conservé : revalider ne doit pas
             rebattre les jetons sous les yeux. Les nouveaux suivent. */
          var sortie = deja.filter(function (n) { return !!choisis[A.m.slug(n)]; });
          var dedans = {};
          sortie.forEach(function (n) { dedans[A.m.slug(n)] = true; });
          Object.keys(choisis).forEach(function (s) {
            if (!dedans[s]) sortie.push(choisis[s]);
          });
          fermer();
          onValider(sortie);
        } }
    ]);
  }

  /* Attributs d'un exercice. `exo` est muté en place ; `onFini` sert à
     rafraîchir uniquement l'en-tête concerné, jamais la liste entière. */
  function editerExercice(exo, options, onFini) {
    options = options || {};
    /* L'etat est relu a chaque usage, jamais capture : un import (remplacer())
       ou un effacement (vider()) remplace l'objet, et une reference prise a
       l'ouverture ecrirait ensuite dans un orphelin — en silence. */
    function etat() { return A.store.etat(); }
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
        return A.m.suggestions(etat(), saisie, 8).map(function (x) {
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
        exo.colonnes = A.m.colonnes(it);
        exo.forces = (it.forces || []).slice();
        exo.outils = (it.outils || []).slice();
        exo.structures = (it.structures || []).slice();
        btAw.setAttribute('aria-pressed', exo.aw ? 'true' : 'false');
        selCharge.value = exo.typeCharge;
        rafraichirColonnes();
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
      selCharge.addEventListener('change', function () {
        exo.typeCharge = selCharge.value;
        majAideColonnes();
      });
      c.appendChild(A.ui.groupe('Type de charge', selCharge,
        'Seul « Kilos » entre dans le tonnage. Les autres sont comptés en séries.'));

      /* Quelles colonnes la ligne de série affiche. Separe du type de charge :
         celui-ci dit COMMENT lire la charge, celles-la disent CE QU'ON SAISIT.
         Un isometrique n'a que DUREE ; le defaut reste charge + reps. */
      exo.colonnes = A.m.colonnes(exo);
      var boiteColonnes = h('div', { class: 'enrobe' });
      var aideColonnes = h('div', { class: 'item-resume' });

      function majAideColonnes() {
        var cols = A.m.colonnes(exo);
        var bouts = ['Affichées : ' + cols.map(function (id) { return A.m.colonne(id).nom; }).join(' · ') + '.'];
        bouts.push(A.m.peutPeser(exo)
          ? 'Charge × reps en kilos : cet exercice entre dans le tonnage.'
          : 'Pas de tonnage : ' + (A.m.aColonne(exo, 'charge') && A.m.aColonne(exo, 'reps')
              ? 'la charge n’est pas en kilos.'
              : 'sans charge ET reps, il n’y a rien à multiplier.'));
        if (A.m.aColonne(exo, 'duree')) bouts.push('La durée compte en temps sous tension.');
        aideColonnes.textContent = bouts.join(' ');
      }

      var pucesColonnes = [];
      function rafraichirColonnes() {
        pucesColonnes.forEach(function (p) {
          p.bouton.setAttribute('aria-pressed', A.m.aColonne(exo, p.id) ? 'true' : 'false');
        });
        majAideColonnes();
      }

      A.m.COLONNES.forEach(function (col) {
        var b = h('button', { type: 'button', class: 'puce', text: col.nom,
                              'aria-pressed': A.m.aColonne(exo, col.id) ? 'true' : 'false' });
        pucesColonnes.push({ id: col.id, bouton: b });
        b.addEventListener('click', function () {
          var cols = A.m.colonnes(exo);
          var i = cols.indexOf(col.id);
          if (i >= 0) {
            /* Un exercice sans aucune colonne n'aurait plus rien a saisir. */
            if (cols.length === 1) {
              A.ui.toast('Il faut au moins une colonne à saisir.');
              return;
            }
            cols.splice(i, 1);
          } else cols.push(col.id);
          exo.colonnes = A.m.colonnes({ colonnes: cols });
          b.setAttribute('aria-pressed', A.m.aColonne(exo, col.id) ? 'true' : 'false');
          majAideColonnes();
        });
        boiteColonnes.appendChild(b);
      });
      majAideColonnes();
      /* L'aide entre DANS le groupe : posée à côté, elle collait au libellé
         du groupe suivant et semblait lui appartenir. */
      var grColonnes = A.ui.groupe('Colonnes à saisir', boiteColonnes);
      grColonnes.appendChild(aideColonnes);
      c.appendChild(grColonnes);

      var boiteOutils = h('div');
      function rafraichirOutils() {
        A.ui.vider(boiteOutils);
        boiteOutils.appendChild(A.ui.champMulti(exo.outils || [], function (q, deja) {
          return A.m.suggestionsOutils(etat(), q, deja, 8).map(function (o) {
            o.jetons = o.categorie ? [{ texte: o.categorie }] : [];
            return o;
          });
        }, function (v) { exo.outils = v; }, 'Dumbbell, poulie haute, Titan Grip…'));
      }
      rafraichirOutils();
      var grOutils = A.ui.groupe('Outils', boiteOutils);

      /* Taper marche quand on connaît le nom. Passé une vingtaine d'outils,
         il faut pouvoir ouvrir son équipement et en cocher plusieurs. */
      var btEquip = h('button', { type: 'button', class: 'bt', style: 'margin-top:7px;width:100%' });
      function majBtEquip() {
        var n = (etat().outils || []).length;
        btEquip.textContent = n ? 'Choisir dans mon équipement (' + n + ')'
                                : 'Choisir dans mon équipement';
        btEquip.disabled = !n && !(exo.outils || []).length;
      }
      majBtEquip();
      btEquip.addEventListener('click', function () {
        choisirOutils(etat(), exo.outils || [], function (liste) {
          exo.outils = liste;
          rafraichirOutils();
          majBtEquip();
        });
      });
      grOutils.appendChild(btEquip);
      c.appendChild(grOutils);

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
      c.appendChild(A.ui.groupe('Structures chargées', boiteStructures));

      var boiteForces = h('div');
      function rafraichirForces() {
        A.ui.vider(boiteForces);
        selForces = A.ui.selecteurForces(exo.forces || [], function (v) { exo.forces = v; });
        boiteForces.appendChild(selForces);
      }
      rafraichirForces();
      c.appendChild(A.ui.groupe('Mouvements', boiteForces,
        'Facultatif. Sert à repérer, dans Suivi, un mouvement qu’un programme néglige.'));

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
        (exo.outils || []).forEach(function (o) { A.m.majCatalogueOutils(etat(), o); });
        if (!exo.structures) exo.structures = [];
        A.m.majCatalogue(etat(), exo);
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

  A.panneau = { ouvrir: ouvrirPanneau, editerExercice: editerExercice,
                choisirOutils: choisirOutils };
})(window.App || (window.App = {}));
