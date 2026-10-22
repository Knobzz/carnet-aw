/* Banc d'interface — ce que le banc de modèle ne peut pas voir.

   `banc/banc.js` mesure le modèle : des fonctions, des nombres, aucune mise en
   page. Deux défauts lui échappaient par construction :

     — un bandeau qui ne sort pas de l'écran. Le chronomètre se cachait par
       `translateY(140%)`, soit 1,4 fois SA PROPRE hauteur, alors qu'il est posé
       au-dessus de la barre d'onglets : il en restait une quarantaine de pixels,
       et ce fantôme captait les appuis destinés à la barre.
     — un libellé, une aide, une puce : ce que la fiche d'exercice AFFICHE.

   Les contrôles d'ici mesurent donc des rectangles réels, du style calculé et
   du texte à l'écran, dans un iframe de 320 px — la largeur la plus dure.

   Il ne touche jamais au carnet : l'iframe pose `window.__BANC_IHM` avant de
   charger `store.js`, qui choisit alors une AUTRE clé de stockage. Le premier
   contrôle le vérifie — une isolation qu'on ne mesure pas n'est qu'une
   intention. */
(function () {
  'use strict';

  var LARGEUR = 320;
  var HAUTEUR = 720;
  var GLISSADE = 420;        // la transition CSS dure 260 ms ; on lui laisse du mou

  var cas = [];
  function bloc(nom, f) { cas.push({ bloc: nom, f: f }); }

  function attendre(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /* ---------- l'hôte : la vraie feuille de style, les vrais scripts ----------

     On ne charge PAS js/app.js : la coque n'est pas ce qu'on mesure, et elle
     enregistrerait un service worker qui resservirait ensuite ses copies — le
     faux vert déjà rencontré sur le banc de modèle. Les quatre fichiers
     chargés le sont avec un horodatage, pour la même raison. */
  function hote() {
    var t = '?t=' + Date.now();
    var s = function (f) { return '<scr' + 'ipt src="../js/' + f + t + '"></scr' + 'ipt>'; };
    var onglets = '';
    ['Séance', 'Programmes', 'Journal', 'Suivi', 'Réglages'].forEach(function (n) {
      onglets += '<button class="onglet" role="tab" aria-selected="false" aria-label="' + n
               + '"><span>' + n + '</span></button>';
    });
    return '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
      + '<link rel="stylesheet" href="../css/app.css' + t + '">'
      + '</head><body>'
      + '<scr' + 'ipt>window.__BANC_IHM = 1;</scr' + 'ipt>'
      + '<div class="app"><header class="entete"><div style="flex:1;min-width:0">'
      + '<h1>Banc d’interface</h1></div></header>'
      + '<main class="vue active" id="vue">'
      + '<div class="carte" id="carte-dessous"><div class="carte-corps">'
      + '<div class="sous-titre">Carte du dessous</div>'
      + '<div class="item-resume">Elle doit rester atteignable quand le repos est terminé.</div>'
      + '</div></div>'
      + '</main></div>'
      + '<nav class="onglets" role="tablist" aria-label="Sections">' + onglets + '</nav>'
      + s('store.js') + s('model.js') + s('ui.js') + s('panneau.js')
      + s('vue-exercice.js') + s('vue-suivi.js')
      + '</body></html>';
  }

  function ouvrirHote() {
    return new Promise(function (resolve, rejette) {
      var cadre = document.createElement('iframe');
      cadre.width = LARGEUR;
      cadre.height = HAUTEUR;
      cadre.title = 'hôte du banc d’interface';
      cadre.style.cssText = 'width:' + LARGEUR + 'px;height:' + HAUTEUR + 'px;'
                          + 'border:1px solid var(--trait-fort);border-radius:8px;display:block';
      cadre.setAttribute('srcdoc', hote());
      document.getElementById('scene').appendChild(cadre);

      var fini = false;
      var limite = setTimeout(function () {
        if (!fini) { fini = true; rejette(new Error('l’hôte n’a pas chargé en 10 s')); }
      }, 10000);

      cadre.addEventListener('load', function () {
        var fen = cadre.contentWindow;
        /* `load` part avant que les scripts aient fini de se poser sur
           certains navigateurs : on attend que l'objet App soit complet. */
        var essais = 0;
        (function prêt() {
          if (fini) return;
          if (fen.App && fen.App.ui && fen.App.panneau && fen.App.m && fen.App.store
              && fen.App.vues && fen.App.vues.suivi) {
            fini = true;
            clearTimeout(limite);
            resolve({ cadre: cadre, fen: fen, doc: fen.document });
            return;
          }
          if (++essais > 100) {
            fini = true;
            clearTimeout(limite);
            rejette(new Error('App incomplet dans l’hôte après 100 essais'));
            return;
          }
          setTimeout(prêt, 50);
        })();
      });
    });
  }

  /* ---------- petits outils de mesure ---------- */

  function rect(doc, sel) {
    var n = doc.querySelector(sel);
    return n ? n.getBoundingClientRect() : null;
  }
  function style(fen, sel, prop) {
    var n = fen.document.querySelector(sel);
    return n ? fen.getComputedStyle(n)[prop] : null;
  }
  /* Ce que le doigt toucherait vraiment à cet endroit de l'écran. */
  function sousLeDoigt(fen, x, y) {
    return fen.document.elementFromPoint(x, y);
  }
  function dansChrono(n) {
    while (n) { if (n.classList && n.classList.contains('chrono')) return true; n = n.parentNode; }
    return false;
  }

  /* ================================================================
     1. L'isolation du banc — mesurée, pas supposée
     ================================================================ */

  bloc('Isolation du stockage', function (v, h) {
    v.vrai(h.fen.App.store.CLE !== 'carnet-aw-v1',
           'le banc n’écrit PAS dans la clé du carnet — il en a une à lui');
    v.egal(h.fen.App.store.CLE, 'carnet-aw-banc-ihm', 'et c’est bien celle qu’on attend');
    v.egal(h.fen.localStorage.getItem('carnet-aw-v1'),
           window.localStorage.getItem('carnet-aw-v1'),
           '[temoin] l’iframe voit le même stockage que cette page : l’isolation '
         + 'ne vient donc pas de l’origine, mais de la clé');
    return Promise.resolve();
  });

  /* ================================================================
     2. Le chronomètre sort ENTIÈREMENT de l'écran
     ================================================================ */

  bloc('Chronomètre : il part et il revient', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var chrono = fen.App.ui.chrono;

    chrono.demarrer(90, 'Curl marteau · série 2');

    return attendre(GLISSADE).then(function () {
      var r = rect(doc, '.chrono');
      v.vrai(!!r, 'le bandeau est monté dans la page');
      if (!r) return;

      var barre = rect(doc, '.onglets');
      v.vrai(r.bottom <= HAUTEUR + 1, 'lancé, il est DANS l’écran');
      v.vrai(r.top >= 0, 'et pas au-dessus du bord haut');
      v.vrai(r.bottom <= barre.top + 1,
             'son bas reste au-dessus de la barre d’onglets, qu’il ne doit pas couvrir');
      v.egal(style(fen, '.chrono', 'visibility'), 'visible', 'il est visible');
      v.vrai(style(fen, '.chrono', 'pointerEvents') !== 'none',
             'et il capte les appuis — « + 30 s » et « Passer » doivent répondre');
      v.vrai(doc.body.classList.contains('chrono-ouvert'),
             'la page réserve sa hauteur, pour ne pas masquer la dernière carte');

      /* La cible tactile, à 320 px, sur les deux boutons du bandeau. */
      var bts = doc.querySelectorAll('.chrono .bt-petit');
      v.egal(bts.length, 2, '[temoin] deux boutons : « + 30 s » et « Passer »');
      var minH = 999;
      Array.prototype.forEach.call(bts, function (b) {
        minH = Math.min(minH, b.getBoundingClientRect().height);
      });
      v.vrai(minH >= 44, 'ils font au moins 44 px de haut (mesuré : ' + Math.round(minH) + ')');

      /* Le bandeau ne doit pas non plus déborder en largeur à 320 px. */
      v.vrai(r.width <= LARGEUR, 'il ne déborde pas de l’écran à 320 px');

      /* --- « Passer » --- */
      var passer = null;
      Array.prototype.forEach.call(bts, function (b) {
        if (b.textContent.indexOf('Passer') >= 0) passer = b;
      });
      v.vrai(!!passer, '[temoin] le bouton « Passer » est trouvable');
      if (passer) passer.click();

      return attendre(GLISSADE).then(function () {
        var r2 = rect(doc, '.chrono');
        v.vrai(!!r2, '[temoin] le bandeau reste monté : il est caché, pas détruit');
        if (!r2) return;

        v.vrai(r2.top >= HAUTEUR,
               'arrêté, il est ENTIÈREMENT sous le bas de l’écran (haut mesuré à '
             + Math.round(r2.top) + ' px pour un écran de ' + HAUTEUR + ')');
        v.egal(style(fen, '.chrono', 'visibility'), 'hidden',
               'et il est retiré du ciblage : visibility hidden');
        v.egal(style(fen, '.chrono', 'pointerEvents'), 'none',
               'doublé de pointer-events none, pour le temps de la glissade');
        v.vrai(!doc.body.classList.contains('chrono-ouvert'),
               'la page reprend sa hauteur normale');

        /* Le vrai symptôme, balayé sur toute la bande du bas : c'est là que le
           fantôme restait — 41 px mesurés sur l'ancien CSS, pile dans la zone
           du pouce. Un seul point ne suffirait pas : le milieu de l'ancienne
           place était, lui, bien parti. */
        var restes = [];
        [4, 10, 20, 30, 40].forEach(function (d) {
          if (dansChrono(sousLeDoigt(fen, LARGEUR / 2, HAUTEUR - d))) restes.push(d);
        });
        v.egal(restes.length, 0,
               'aucun appui dans les 40 px du bas ne tombe encore sur le bandeau '
             + '(hauteurs fautives : ' + (restes.join(', ') || 'aucune') + ')');

        /* Et la barre d'onglets, que le fantôme recouvrait. */
        var barre2 = rect(doc, '.onglets');
        var surBarre = sousLeDoigt(fen, LARGEUR / 2, Math.round((barre2.top + barre2.bottom) / 2));
        v.vrai(!dansChrono(surBarre),
               'la barre d’onglets n’est plus recouverte par le fantôme du bandeau');
        v.vrai(!!(surBarre && surBarre.closest('.onglets')),
               'c’est bien un onglet qui répond au doigt, là où il doit répondre');

        /* Il doit pouvoir repartir : une série de plus, un repos de plus. */
        chrono.demarrer(60, 'Série suivante');
        return attendre(GLISSADE).then(function () {
          var r3 = rect(doc, '.chrono');
          v.vrai(r3.bottom <= HAUTEUR + 1, 'relancé, il revient dans l’écran');
          v.egal(style(fen, '.chrono', 'visibility'), 'visible', 'et redevient visible');
          chrono.arreter();
          return attendre(GLISSADE);
        });
      });
    });
  });

  /* ================================================================
     3. La fiche d'exercice — ce qu'elle montre, et ce qu'elle ne montre plus
     ================================================================ */

  bloc('Fiche d’exercice', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var brouillon = fen.App.m.exerciceProgramme({});

    fen.App.panneau.editerExercice(brouillon, { titre: 'Ajouter un exercice' }, function () {});

    return attendre(120).then(function () {
      var pan = doc.querySelector('.panneau');
      v.vrai(!!pan, 'la fiche s’ouvre');
      if (!pan) return;

      function groupe(libelle) {
        var l = pan.querySelectorAll('.groupe > label');
        for (var i = 0; i < l.length; i++) {
          if (l[i].textContent === libelle) return l[i].parentNode;
        }
        return null;
      }
      var libelles = Array.prototype.map.call(pan.querySelectorAll('.groupe > label'),
        function (l) { return l.textContent; });

      v.vrai(libelles.indexOf('Mouvements') >= 0, '« Mouvements » est le libellé affiché');
      v.egal(libelles.indexOf('Forces de Larratt'), -1,
             '« Forces de Larratt » n’apparaît plus nulle part dans la fiche');

      /* L'aide sous ces deux groupes a été retirée : la fiche était bavarde. */
      var gOutils = groupe('Outils');
      var gStruct = groupe('Structures chargées');
      v.vrai(!!gOutils && !!gStruct, '[temoin] les deux groupes sont là');
      if (gOutils) v.egal(gOutils.querySelectorAll('.item-resume').length, 0,
                          'plus d’aide sous « Outils »');
      if (gStruct) v.egal(gStruct.querySelectorAll('.item-resume').length, 0,
                          'plus d’aide sous « Structures chargées »');

      /* Les six mouvements, et leur cible tactile à 320 px. */
      var gMouv = groupe('Mouvements');
      v.vrai(!!gMouv, 'le groupe « Mouvements » existe sous ce nom');
      if (gMouv) {
        var puces = gMouv.querySelectorAll('.puce');
        v.egal(puces.length, 6, 'six mouvements sont proposés');
        var noms = Array.prototype.map.call(puces, function (p) { return p.textContent; });
        v.vrai(noms.indexOf('Back pressure') >= 0, 'dont « Back pressure »');
        v.vrai(noms.indexOf('Side pressure') >= 0, 'et « Side pressure »');
        var minH = 999, debord = 0;
        Array.prototype.forEach.call(puces, function (p) {
          var r = p.getBoundingClientRect();
          minH = Math.min(minH, r.height);
          if (r.right > LARGEUR) debord += 1;
        });
        v.vrai(minH >= 44, 'chaque puce fait au moins 44 px de haut (mesuré : '
                         + Math.round(minH) + ')');
        v.egal(debord, 0, 'et aucune ne sort de l’écran à 320 px : elles passent à la ligne');
      }

      /* Rien ne doit déborder horizontalement, nulle part dans le panneau. */
      var corps = pan.querySelector('.panneau-corps');
      v.vrai(corps.scrollWidth <= corps.clientWidth + 1,
             'aucun débordement horizontal dans la fiche à 320 px (débord mesuré : '
           + (corps.scrollWidth - corps.clientWidth) + ' px)');

      /* On referme sans enregistrer : le brouillon ne doit rien laisser. */
      var fermer = pan.querySelector('.panneau-entete .bt-icone');
      if (fermer) fermer.click();
      return attendre(80).then(function () {
        v.egal(doc.querySelectorAll('.panneau').length, 0, 'la fiche se referme');
        v.egal(fen.App.store.etat().exercices.length, 0,
               'et « Annuler » n’a rien écrit au catalogue');
      });
    });
  });

  /* ================================================================
     4. L'autocomplétion des outils, vue de l'écran

     Le défaut de tri est mesuré au banc de modèle. Ici on vérifie que ce
     classement arrive bien jusqu'à la liste déroulante : neuf outils en
     catalogue, le dernier ajouté doit être LISIBLE sans rien taper.
     ================================================================ */

  bloc('Autocomplétion des outils, à l’écran', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var e = fen.App.store.etat();
    e.outils.length = 0;
    ['Golden Grip N2', 'Golden Grip N3', 'Golden Grip N4', 'Élastique de rééducation',
     'Fat grip', 'Ceinture de judo', 'Titan Grip Iron Wrist 60 mm',
     'Titan Grip Pronator Ellipsoid'].forEach(function (n) {
      fen.App.m.majCatalogueOutils(e, n, 'Matériel');
    });
    fen.App.m.majCatalogueOutils(e, 'Poulie basse', 'Poulies');
    v.egal(e.outils.length, 9, '[temoin] neuf outils en catalogue');

    var brouillon = fen.App.m.exerciceProgramme({});
    fen.App.panneau.editerExercice(brouillon, { titre: 'Ajouter un exercice' }, function () {});

    return attendre(120).then(function () {
      var pan = doc.querySelector('.panneau');
      var saisie = pan.querySelector('.multi input.champ');
      v.vrai(!!saisie, 'le champ « Outils » est là');
      if (!saisie) return;

      saisie.focus();
      saisie.dispatchEvent(new fen.Event('focus'));

      return attendre(80).then(function () {
        var liste = pan.querySelector('.multi .auto-liste');
        var noms = Array.prototype.map.call(liste.querySelectorAll('.auto-opt b'),
          function (b) { return b.textContent; });
        v.egal(noms.length, 8, 'huit suggestions au plus, pour tenir sur l’écran');
        v.vrai(noms.indexOf('Poulie basse') >= 0,
               'l’outil ajouté juste avant est VISIBLE sans rien taper');
        v.egal(noms[0], 'Poulie basse', 'et il arrive en tête');

        /* La liste déroulante ne doit pas sortir de l'écran à 320 px. */
        var r = liste.getBoundingClientRect();
        v.vrai(r.left >= 0 && r.right <= LARGEUR,
               'la liste déroulante tient dans la largeur');

        /* Choisir une suggestion la pose en jeton, et la retire des suivantes. */
        liste.querySelector('.auto-opt').click();
        return attendre(80).then(function () {
          var jetons = Array.prototype.map.call(pan.querySelectorAll('.multi-jeton span'),
            function (s) { return s.textContent; });
          v.vrai(jetons.indexOf('Poulie basse') >= 0, 'la choisir la pose en jeton');
          v.egal(brouillon.outils.length, 1, 'et l’exercice la porte');

          saisie.focus();
          saisie.dispatchEvent(new fen.Event('focus'));
          return attendre(80).then(function () {
            var noms2 = Array.prototype.map.call(
              pan.querySelectorAll('.multi .auto-liste .auto-opt b'),
              function (b) { return b.textContent; });
            v.egal(noms2.indexOf('Poulie basse'), -1,
                   'un outil déjà porté n’est plus proposé');

            var fermer = pan.querySelector('.panneau-entete .bt-icone');
            if (fermer) fermer.click();
            return attendre(80);
          });
        });
      });
    });
  });

  /* ================================================================
     5. Suivi : six mouvements tiennent dans la colonne, à 320 px

     Deux des six noms sont longs. La colonne des libellés valait 4,2 rem :
     « Back pressure » s'y coupait en deux et la liste devenait irrégulière.
     C'est une mesure de largeur, donc invisible au banc de modèle.
     ================================================================ */

  bloc('Suivi à 320 px', function (v, h) {
    var fen = h.fen, doc = h.doc;

    function jourIlYA(n) {
      var d = new Date();
      d.setDate(d.getDate() - n);
      var z = function (x) { return (x < 10 ? '0' : '') + x; };
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
    }
    function serie() {
      return { id: fen.App.m.uid('s'), type: 'normale', repsCible: '', chargeCible: '',
               chargeReel: '20', repsReel: '10', rpe: null, faite: true, faiteA: null };
    }
    function exo(nom, forces) {
      return { id: fen.App.m.uid('e'), ordre: 0, nom: nom, slug: fen.App.m.slug(nom),
               aw: true, typeCharge: 'kg', forces: forces, structures: ['coude_medial'],
               outils: [], consigne: '', reposSecondes: 90,
               series: [serie(), serie(), serie()] };
    }

    var e = fen.App.store.etat();
    e.seances = [{
      id: 'se-banc', type: 'muscu', date: jourIlYA(2), heure: jourIlYA(2) + 'T18:00:00.000Z',
      programmeId: null, programmeNom: 'Banc', dureeMin: 50, rpeGlobal: 7, note: '',
      douleurs: [{ zone: 'coude_medial', intensite: 4 }],
      exercices: [exo('Rising poulie', ['rising', 'back_pressure']),
                  exo('Side pression', ['side_pressure', 'cupping']),
                  exo('Curl', ['supination', 'pronation'])]
    }];

    var vue = doc.getElementById('vue');
    fen.App.vues.suivi.rendre(vue);

    return attendre(80).then(function () {
      var titres = Array.prototype.map.call(doc.querySelectorAll('.sous-titre'),
        function (t) { return t.textContent; });
      v.vrai(titres.indexOf('Mouvements — 28 derniers jours') >= 0,
             'Suivi titre la section « Mouvements »');
      v.egal(titres.indexOf('Forces de Larratt — 28 derniers jours'), -1,
             '« Forces de Larratt » a disparu de Suivi aussi');

      var barres = doc.querySelectorAll('.barre');
      v.vrai(barres.length >= 6, '[temoin] les six mouvements font six lignes');

      var hauteurs = [], coupes = [], noms = [];
      Array.prototype.forEach.call(barres, function (b) {
        var lab = b.firstElementChild;
        var r = lab.getBoundingClientRect();
        noms.push(lab.textContent);
        hauteurs.push(Math.round(r.height));
        /* Une ligne de texte fait environ 19 px a .8rem : au-dela, le libelle
           s'est coupe en deux. */
        if (r.height > 26) coupes.push(lab.textContent);
      });
      v.vrai(noms.indexOf('Back pressure') >= 0, '« Back pressure » est bien affiché');
      v.egal(coupes.length, 0,
             'aucun libellé ne se coupe en deux lignes (fautifs : '
           + (coupes.join(', ') || 'aucun') + ')');

      /* La barre doit rester assez large pour qu'on compare des hauteurs. */
      var piste = doc.querySelector('.barre .barre-piste');
      v.vrai(piste.getBoundingClientRect().width >= 100,
             'la barre garde au moins 100 px de large (mesuré : '
           + Math.round(piste.getBoundingClientRect().width) + ')');

      v.vrai(doc.documentElement.scrollWidth <= LARGEUR,
             'et Suivi ne déborde pas horizontalement à 320 px (débord : '
           + (doc.documentElement.scrollWidth - LARGEUR) + ' px)');

      fen.App.ui.vider(vue);
      e.seances = [];
      return attendre(20);
    });
  });

  /* ================================================================
     Exécution — séquentielle : les blocs partagent un seul hôte
     ================================================================ */

  function lancer() {
    window.__banc = { fini: false, ok: 0, ko: 0, blocs: [] };

    return ouvrirHote().then(function (h) {
      var resultats = [];

      function unBloc(i) {
        if (i >= cas.length) return Promise.resolve();
        var c = cas[i];
        var ok = 0, ko = [];
        var v = {
          egal: function (a, b, quoi) {
            if ((a === b) || (a == null && b == null)) ok += 1;
            else ko.push({ quoi: quoi, attendu: b, obtenu: a });
          },
          vrai: function (x, quoi) {
            if (x) ok += 1; else ko.push({ quoi: quoi, attendu: true, obtenu: x });
          }
        };
        return Promise.resolve()
          .then(function () { return c.f(v, h); })
          .catch(function (err) {
            ko.push({ quoi: 'le bloc a levé une erreur', attendu: 'aucune', obtenu: String(err) });
          })
          .then(function () {
            resultats.push({ bloc: c.bloc, ok: ok, ko: ko });
            return unBloc(i + 1);
          });
      }

      return unBloc(0).then(function () {
        /* Le banc nettoie sa propre clé : elle n'a servi qu'à ça. */
        try { h.fen.localStorage.removeItem(h.fen.App.store.CLE); } catch (e) {}
        return resultats;
      });
    });
  }

  window.BancIhm = { lancer: lancer, nbBlocs: function () { return cas.length; } };
})();
