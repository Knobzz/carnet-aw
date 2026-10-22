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
  /* Les libellés des onglets sont lus DANS js/app.js, pas recopiés ici : une
     copie resterait verte le jour où un onglet s'allonge, et c'est justement
     ce qu'on veut mesurer — six onglets à 320 px, chacun ne dispose que de
     53 px. */
  var onglets = [];

  function lireOnglets() {
    return fetch('../js/app.js?t=' + Date.now())
      .then(function (r) { return r.text(); })
      .then(function (src) {
        var bloc = src.match(/var ONGLETS = \[([\s\S]*?)\n {2}\];/);
        var noms = [];
        if (bloc) {
          bloc[1].replace(/nom:\s*'([^']*)'/g, function (tout, n) { noms.push(n); return tout; });
        }
        onglets = noms;
        return noms;
      })
      .catch(function () { onglets = []; return []; });
  }

  function hote() {
    var t = '?t=' + Date.now();
    var s = function (f) { return '<scr' + 'ipt src="../js/' + f + t + '"></scr' + 'ipt>'; };
    var barre = '';
    onglets.forEach(function (n) {
      barre += '<button class="onglet" role="tab" aria-selected="false" aria-label="' + n
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
      + '<nav class="onglets" role="tablist" aria-label="Sections">' + barre + '</nav>'
      + s('store.js') + s('model.js') + s('ui.js') + s('panneau.js')
      + s('vue-exercice.js') + s('vue-suivi.js') + s('vue-seance.js')
      + s('vue-programmes.js') + s('vue-recup.js')
      + '</body></html>';
  }

  function ouvrirHote() {
    return lireOnglets().then(monterHote);
  }

  function monterHote() {
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
              && fen.App.vues && fen.App.vues.suivi && fen.App.vues.seance
              && fen.App.vues.recup && fen.App.vues.programmes) {
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

    /* Un libellé REPRÉSENTATIF : l'app écrit `nom de l'exercice · série n`,
       et les noms d'exercices sont longs. Avec « Curl marteau · série 2 », le
       contrôle passait à 430 px sur un CSS qui coupait pourtant les vrais
       libellés — un cas de mesure trop gentil pour prouver quoi que ce soit. */
    chrono.demarrer(90, 'Curl marteau fat grip · série 3');

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

      /* Le NOM de l'exercice doit être lisible, pas réduit à « Cu… ». En
         flex, le temps et les deux boutons lui laissaient 35 px. On mesure la
         place réelle, et on la compare à ce qu'il faut pour lire quelques
         mots — pas à zéro, qui serait toujours vrai. */
      var quoi = doc.querySelector('.chrono-quoi');
      var rq = quoi.getBoundingClientRect();
      v.vrai(rq.width >= 150,
             'le nom de l’exercice a de la place pour être lu : ' + Math.round(rq.width)
           + ' px (il en faut au moins 150 ; le libellé mesuré en demande '
           + quoi.scrollWidth + ')');
      v.vrai(quoi.scrollWidth <= quoi.clientWidth + 1,
             'et il n’est pas tronqué par des points de suspension');

      /* 320 px ne suffit PAS à juger : le premier correctif passait ici et
         coupait encore le libellé à 430 px, la largeur d'un téléphone
         courant. On élargit l'hôte le temps de la mesure. */
      h.cadre.style.width = '430px';
      h.cadre.width = 430;
      return attendre(120).then(function () {
        var large = doc.querySelector('.chrono-quoi');
        v.vrai(large.scrollWidth <= large.clientWidth + 1,
               'à 430 px non plus, le nom n’est pas coupé (place : '
             + Math.round(large.getBoundingClientRect().width) + ' px)');
        h.cadre.style.width = LARGEUR + 'px';
        h.cadre.width = LARGEUR;
        return attendre(120);
      });
    }).then(function () {
      if (!rect(doc, '.chrono')) return;

      /* --- « Passer » --- */
      var passer = null;
      Array.prototype.forEach.call(doc.querySelectorAll('.chrono .bt-petit'), function (b) {
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
     10. Le côté, posé au doigt

     Le modèle sait le porter ; reste à savoir s'il arrive bien jusqu'à lui.
     La feuille d'intensité pose DEUX questions — le côté puis l'intensité —
     et c'est le chemin le plus facile à casser en silence.
     ================================================================ */

  bloc('Le côté, posé au doigt', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var exo = fen.App.m.exerciceSeanceVierge({ nom: 'Curl', typeCharge: 'kg' });

    fen.App.panneau.editerExercice(exo, {}, function () {});

    return attendre(120).then(function () {
      var pan = doc.querySelector('.panneau');
      function groupe(libelle) {
        var l = pan.querySelectorAll('.groupe > label');
        for (var i = 0; i < l.length; i++) if (l[i].textContent === libelle) return l[i].parentNode;
        return null;
      }
      var g = groupe('Côté');
      v.vrai(!!g, 'la fiche d’exercice demande le côté');
      if (!g) return;

      var puces = g.querySelectorAll('.puce');
      v.egal(puces.length, 3, 'trois réponses : droit, gauche, les deux');
      var mini = 999;
      Array.prototype.forEach.call(puces, function (p) {
        mini = Math.min(mini, p.getBoundingClientRect().height);
      });
      v.vrai(mini >= 44, 'chaque puce fait 44 px (mesuré : ' + Math.round(mini) + ')');
      v.egal(exo.cote, null, '[temoin] rien n’est coché d’avance : le côté n’est pas inventé');

      puces[0].click();
      v.egal(exo.cote, 'droit', 'un appui pose le côté');
      v.egal(puces[0].getAttribute('aria-pressed'), 'true', 'et se voit');
      puces[1].click();
      v.egal(exo.cote, 'gauche', 'le choix est UNIQUE : l’autre prend la place');
      v.egal(puces[0].getAttribute('aria-pressed'), 'false', 'le premier se relâche');
      puces[1].click();
      v.egal(exo.cote, null,
             'ré-appuyer sur celui qui est actif le retire : « non renseigné » reste atteignable');

      var fermer = pan.querySelector('.panneau-entete .bt-icone');
      if (fermer) fermer.click();

      /* --- la feuille de douleur : côté PUIS intensité --- */
      return attendre(100).then(function () {
        var douleurs = [];
        var sel = fen.App.ui.selecteurDouleurs([], function (v2) { douleurs = v2; });
        doc.getElementById('vue').appendChild(sel);

        var zone = null;
        Array.prototype.forEach.call(sel.querySelectorAll('.puce-douleur'), function (b) {
          if (b.textContent === 'Coude médial') zone = b;
        });
        v.vrai(!!zone, '[temoin] la zone est là');
        zone.click();                       // premier appui : la zone seule
        v.egal(douleurs.length, 1, 'un appui pose la zone');
        v.egal(douleurs[0].cote, null, 'sans côté : on n’a rien demandé encore');

        zone.click();                       // second appui : la feuille
        return attendre(100).then(function () {
          var popo = doc.querySelector('.popo');
          v.vrai(!!popo, 'le second appui ouvre la feuille');
          if (!popo) return;

          var cotes = popo.querySelectorAll('.puce');
          v.egal(cotes.length, 3, 'la feuille demande AUSSI le côté — une feuille, deux questions');

          var droit = null;
          Array.prototype.forEach.call(cotes, function (b) {
            if (b.textContent === 'Droit') droit = b;
          });
          droit.click();

          var cinq = null;
          Array.prototype.forEach.call(popo.querySelectorAll('.echelon'), function (b) {
            if (b.textContent === '5') cinq = b;
          });
          cinq.click();

          return attendre(100).then(function () {
            v.egal(douleurs[0].intensite, 5, 'l’intensité arrive jusqu’au modèle');
            v.egal(douleurs[0].cote, 'droit', 'et le côté AUSSI — c’est ce chemin qui casse en silence');
            v.egal(fen.App.m.texteDouleur(douleurs[0]), 'Coude médial D 5/10',
                   'la puce le dit en clair');
            v.egal(doc.querySelectorAll('.popo').length, 0, 'et la feuille se referme');

            fen.App.ui.vider(doc.getElementById('vue'));
            return attendre(20);
          });
        });
      });
    });
  });

  /* ================================================================
     9. Choisir dans tout l'équipement

     Taper le nom marche quand on le connaît. Passé une vingtaine d'outils, la
     liste déroulante de huit ne montre que les plus récents : il faut pouvoir
     ouvrir son équipement, le voir rangé, en cocher plusieurs d'un coup.
     ================================================================ */

  bloc('Choisir dans l’équipement', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var e = fen.App.store.etat();
    e.outils.length = 0;
    [['Barre droite', 'Barres'], ['Barre EZ', 'Barres'],
     ['Poulie haute', 'Poulies'], ['Poulie basse', 'Poulies'], ['Corde triceps', 'Poulies'],
     ['Golden Grip N2', 'Grippers'], ['Golden Grip N3', 'Grippers'],
     ['Golden Grip N4', 'Grippers'], ['Fat grip', 'Poignées'],
     ['Titan Grip Iron Wrist 60 mm', 'Poignées AW'], ['Élastique', '']
    ].forEach(function (o) { fen.App.m.majCatalogueOutils(e, o[0], o[1]); });

    /* Un exercice qui porte DÉJÀ un outil du catalogue, et un autre qui n'y
       est pas — celui-là ne doit jamais disparaître en silence. */
    var exo = fen.App.m.exerciceSeanceVierge({
      nom: 'Curl', typeCharge: 'kg', outils: ['Fat grip', 'Sangle maison']
    });

    var rendu = null;
    fen.App.panneau.choisirOutils(e, exo.outils, function (liste) { rendu = liste; });

    return attendre(120).then(function () {
      var pan = doc.querySelector('.panneau');
      v.vrai(!!pan, 'le sélecteur s’ouvre');
      if (!pan) return;

      var blocs = pan.querySelectorAll('.equip-bloc');
      var titres = Array.prototype.map.call(blocs, function (b) {
        return b.querySelector('.equip-cat b').textContent;
      });
      v.egal(titres[0], 'Sur cet exercice, hors équipement',
             'ce qui est porté sans être au catalogue vient EN PREMIER : '
           + 'c’est ce qu’on risquerait de perdre sans le voir');
      v.vrai(titres.indexOf('Barres') >= 0, 'les catégories sont là');
      v.vrai(titres.indexOf('Poulies') >= 0, 'toutes');
      v.egal(titres[titres.length - 1], 'Sans catégorie',
             '[temoin] et le fourre-tout reste en bas');

      /* Repliable : c'est ce qui rend trente outils parcourables. */
      var barres = null;
      Array.prototype.forEach.call(blocs, function (b) {
        if (b.querySelector('.equip-cat b').textContent === 'Barres') barres = b;
      });
      var entete = barres.querySelector('.equip-cat');
      var liste = barres.querySelector('.equip-liste');
      v.egal(entete.getAttribute('aria-expanded'), 'true', 'une catégorie s’ouvre dépliée');
      v.vrai(liste.getBoundingClientRect().height > 0, '[temoin] et on voit son contenu');
      entete.click();
      v.egal(entete.getAttribute('aria-expanded'), 'false', 'un appui la replie');
      v.egal(liste.getBoundingClientRect().height, 0, 'et son contenu disparaît');
      entete.click();
      v.vrai(liste.getBoundingClientRect().height > 0, 'un second appui la rouvre');

      /* La cible tactile, à 320 px. */
      var mini = 999;
      Array.prototype.forEach.call(pan.querySelectorAll('.equip-ligne, .equip-cat'), function (n) {
        mini = Math.min(mini, n.getBoundingClientRect().height);
      });
      v.vrai(mini >= 44, 'chaque ligne et chaque en-tête font 44 px (mesuré : '
                       + Math.round(mini) + ')');
      v.vrai(doc.documentElement.scrollWidth <= LARGEUR,
             'et rien ne déborde à 320 px');

      /* Ce qui est déjà porté est coché d'avance. */
      function ligne(nom) {
        var trouve = null;
        Array.prototype.forEach.call(pan.querySelectorAll('.equip-ligne'), function (b) {
          if (b.querySelector('.equip-nom').textContent === nom) trouve = b;
        });
        return trouve;
      }
      v.egal(ligne('Fat grip').getAttribute('aria-pressed'), 'true',
             'un outil déjà porté est coché d’avance');
      v.egal(ligne('Sangle maison').getAttribute('aria-pressed'), 'true',
             'celui qui est hors catalogue aussi');
      v.egal(ligne('Barre EZ').getAttribute('aria-pressed'), 'false',
             'et les autres ne le sont pas');

      /* Plusieurs d'un coup — c'est tout l'intérêt. */
      ligne('Barre EZ').click();
      ligne('Poulie haute').click();
      ligne('Golden Grip N3').click();
      v.egal(ligne('Barre EZ').getAttribute('aria-pressed'), 'true', 'on en coche plusieurs');

      /* Le filtre, pour couper court quand on sait ce qu'on veut. */
      var filtre = pan.querySelector('input[type="search"]');
      v.vrai(!!filtre, 'un filtre est proposé');
      filtre.value = 'poulie';
      filtre.dispatchEvent(new fen.Event('input', { bubbles: true }));
      v.vrai(ligne('Poulie haute').offsetParent !== null, 'il garde ce qui correspond');
      v.vrai(ligne('Barre EZ').offsetParent === null, 'et masque le reste');
      v.vrai(barres.hidden, 'une catégorie entièrement masquée disparaît aussi');
      /* Le cas que le contrôle d'à côté ne voit PAS : une ligne qui ne
         correspond pas, dans une catégorie qui, elle, correspond. « Fat grip »
         est rangé dans Poignées ; sous « grip », sa catégorie reste ouverte,
         et c'est là qu'une ligne non filtrée se remarque. */
      filtre.value = 'golden';
      filtre.dispatchEvent(new fen.Event('input', { bubbles: true }));
      v.vrai(ligne('Golden Grip N3').offsetParent !== null,
             '[temoin] ce qui correspond est bien là');
      v.vrai(ligne('Fat grip').offsetParent === null,
             'et une ligne qui ne correspond pas est masquée MÊME si sa catégorie '
           + 'reste affichée pour une autre ligne');
      filtre.value = 'poulie';
      filtre.dispatchEvent(new fen.Event('input', { bubbles: true }));
      v.vrai(ligne('Corde triceps').offsetParent === null,
             'un outil rangé dans « Poulies » mais qui ne s’appelle pas « poulie » '
           + 'est masqué lui aussi');
      filtre.value = '';
      filtre.dispatchEvent(new fen.Event('input', { bubbles: true }));
      v.vrai(ligne('Barre EZ').offsetParent !== null, 'vider le filtre rend tout');

      /* Changer d'avis sur un outil déjà porté : le décocher puis le
         recocher ne doit pas l'envoyer à la fin de la liste. C'est le geste
         qui distingue « on garde l'ordre en place » d'un simple hasard
         d'insertion. */
      ligne('Fat grip').click();
      ligne('Fat grip').click();
      v.egal(ligne('Fat grip').getAttribute('aria-pressed'), 'true',
             '[temoin] décoché puis recoché, il est bien coché');

      /* Valider. */
      var valider = null;
      Array.prototype.forEach.call(pan.querySelectorAll('.panneau-pied button'), function (b) {
        if (b.textContent === 'Valider') valider = b;
      });
      valider.click();

      return attendre(80).then(function () {
        v.vrai(!!rendu, 'valider rend la sélection');
        v.egal(rendu.indexOf('Sangle maison'), 1,
               'l’outil hors catalogue est GARDÉ, et à sa place d’origine');
        v.egal(rendu.slice(0, 2).join(','), 'Fat grip,Sangle maison',
               'l’ordre déjà en place ne se rebat pas sous les yeux');
        v.egal(rendu.length, 5, 'les trois outils cochés se sont ajoutés');
        v.vrai(rendu.indexOf('Poulie haute') >= 2, 'les nouveaux viennent après');
        v.egal(doc.querySelectorAll('.panneau').length, 0, 'et le panneau se referme');

        e.outils.length = 0;
        return attendre(20);
      });
    });
  });

  /* ================================================================
     8. L'onglet Récupération

     Ce qui compte ici est le FROTTEMENT : une routine déjà prête, un appui
     par ligne. Et une règle qu'on ne voit pas en regardant l'écran — une
     journée n'entre dans le journal qu'une fois quelque chose coché, sinon
     elle dirait qu'on l'a faite.
     ================================================================ */

  bloc('Récupération', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.seances = [];
    e.routineRecup = null;

    /* --- rien de défini --- */
    fen.App.vues.recup.rendre(vue);
    v.vrai(!!doc.querySelector('button'), 'l’écran vide propose un bouton');
    v.vrai(doc.body.textContent.indexOf('Définir ma routine') >= 0,
           'et il invite à définir la routine');
    v.egal(doc.querySelectorAll('.recup-exo').length, 0, 'aucune ligne à cocher');

    /* --- une routine de deux exercices --- */
    var routine = fen.App.m.routineRecupVierge();
    routine.exercices = [
      fen.App.m.exerciceProgramme({ nom: 'Extension poignet', typeCharge: 'elastique',
                                    colonnes: ['reps'], series: [{ repsCible: '30' }] }),
      fen.App.m.exerciceProgramme({ nom: 'Pronation lente', typeCharge: 'elastique',
                                    colonnes: ['reps', 'duree'],
                                    series: [{ repsCible: '20', dureeCible: '60' }] })
    ];
    e.routineRecup = routine;
    fen.App.vues.recup.rendre(vue);

    var exos = doc.querySelectorAll('.recup-exo');
    v.egal(exos.length, 2, 'la routine se présente déjà prête : une ligne par exercice');
    v.egal(e.seances.length, 0,
           'et RIEN n’est encore enregistré — une journée vide dirait qu’on l’a faite');

    var lignes = doc.querySelectorAll('.recup-ligne');
    v.egal(lignes[0].dataset.cols, '1', 'un exercice à une colonne n’a qu’un champ');
    v.egal(lignes[1].dataset.cols, '2', 'un autre en a deux');
    v.egal(lignes[0].querySelectorAll('.serie-saisie').length, 1, '[temoin] et c’est bien le cas');
    v.egal(lignes[1].querySelectorAll('.serie-saisie').length, 2, '[temoin] pour l’autre aussi');

    var champ0 = lignes[0].querySelector('.serie-saisie');
    v.egal(champ0.placeholder, '30', 'la cible de la routine est le placeholder');
    v.egal(champ0.value, '', 'rien n’est pré-saisi : on voit ce qu’on a corrigé');
    v.vrai(champ0.getBoundingClientRect().width >= 150,
           'le champ est large, il n’y a pas de colonne PRÉCÉDENT à loger ('
         + Math.round(champ0.getBoundingClientRect().width) + ' px)');

    var ok0 = exos[0].querySelector('.serie-ok');
    var r0 = ok0.getBoundingClientRect();
    v.vrai(r0.width >= 44 && r0.height >= 44, 'le ✓ fait au moins 44 px');

    /* --- cocher --- */
    ok0.click();
    v.egal(e.seances.length, 1, 'le premier ✓ fait entrer la journée dans le journal');
    v.egal(e.seances[0].type, 'recup', 'avec son type');
    v.egal(e.seances[0].exercices[0].series[0].repsReel, '30',
           'cocher sans rien saisir fige la cible : « fait comme prévu »');
    v.egal(ok0.getAttribute('aria-pressed'), 'true', 'le ✓ se marque');
    v.vrai(exos[0].classList.contains('faite'), 'et la ligne aussi');
    v.vrai(fen.getComputedStyle(ok0).backgroundColor !== fen.getComputedStyle(
             exos[1].querySelector('.serie-ok')).backgroundColor,
           'le ✓ coché ne se confond pas avec un ✓ qui ne l’est pas');

    /* --- décocher : la journée ressort --- */
    ok0.click();
    v.egal(e.seances.length, 1,
           'décocher ne retire pas la journée tant qu’une valeur y reste saisie');
    champ0.value = '';
    champ0.dispatchEvent(new fen.Event('input', { bubbles: true }));
    v.egal(e.seances.length, 0,
           'vidée de tout, la journée ressort du journal plutôt que d’y rester vide');

    /* --- tout cocher --- */
    var btTout = null;
    Array.prototype.forEach.call(doc.querySelectorAll('button'), function (b) {
      if (b.textContent.indexOf('Tout marquer fait') >= 0) btTout = b;
    });
    v.vrai(!!btTout, 'un bouton coche toute la routine d’un geste');
    btTout.click();
    v.egal(fen.App.m.compteRecup(fen.App.store.etat().seances[0]).faits, 2,
           'et il coche bien les deux');
    var apres = null;
    Array.prototype.forEach.call(doc.querySelectorAll('button'), function (b) {
      if (b.textContent.indexOf('Tout décocher') >= 0) apres = b;
    });
    v.vrai(!!apres, 'son libellé devient « Tout décocher » une fois tout fait');

    v.vrai(doc.documentElement.scrollWidth <= LARGEUR,
           'et l’écran ne déborde pas à 320 px (débord : '
         + (doc.documentElement.scrollWidth - LARGEUR) + ' px)');

    fen.App.ui.vider(vue);
    e.seances = [];
    e.routineRecup = null;
    return attendre(20);
  });

  /* ================================================================
     7. La barre d'onglets à 320 px

     Un sixième onglet — Récupération — ne laisse plus que 53 px par case.
     « Programmes » est le libellé le plus long : s'il ne tient pas, il se
     coupe en deux lignes et décale toute la barre.
     ================================================================ */

  bloc('Barre d’onglets à 320 px', function (v, h) {
    var fen = h.fen, doc = h.doc;

    v.vrai(onglets.length > 0,
           'les libellés ont été lus dans js/app.js, pas recopiés dans le banc');
    v.egal(onglets.length, 6, 'six onglets');
    v.vrai(onglets.indexOf('Récup') >= 0, 'dont Récupération');

    var cases = doc.querySelectorAll('.onglet');
    v.egal(cases.length, onglets.length, '[temoin] l’hôte en a bâti autant');

    /* La barre est en position fixe, left:0 right:0 : sa largeur reste celle
       de l'écran quoi qu'il arrive, et le document ne défile pas non plus.
       Mesurer l'une ou l'autre ne prouverait donc RIEN — un libellé trop long
       déborde en silence. Ce qui parle, c'est le bord de chaque case : les
       colonnes d'une grille `1fr` ne descendent pas sous leur contenu, donc
       un libellé trop long pousse les suivantes hors de l'écran. */
    var dehors = [], etroits = [], bas = [];
    var sommeCases = 0;
    Array.prototype.forEach.call(cases, function (o) {
      var sp = o.querySelector('span');
      var r = o.getBoundingClientRect();
      sommeCases += r.width;
      if (r.right > LARGEUR + 0.5 || r.left < -0.5) {
        dehors.push(sp.textContent + ' (jusqu’à ' + Math.round(r.right) + ' px)');
      }
      /* Une ligne de texte fait ~15 px ici : au-delà, le libellé est passé
         sur deux lignes et toute la barre s'est décalée. */
      if (sp.getBoundingClientRect().height > 20) etroits.push(sp.textContent);
      if (r.height < 44) bas.push(sp.textContent + ' (' + Math.round(r.height) + ' px)');
    });

    v.egal(dehors.length, 0,
           'aucun onglet ne sort de l’écran (fautifs : ' + (dehors.join(', ') || 'aucun') + ')');
    v.vrai(sommeCases <= LARGEUR + 1,
           'les six cases tiennent dans les ' + LARGEUR + ' px (somme mesurée : '
         + Math.round(sommeCases) + ' px)');
    v.egal(etroits.length, 0,
           'aucun libellé ne passe sur deux lignes (fautifs : ' + (etroits.join(', ') || 'aucun') + ')');
    v.egal(bas.length, 0,
           'chaque onglet garde 44 px de haut (fautifs : ' + (bas.join(', ') || 'aucun') + ')');
    return Promise.resolve();
  });

  /* ================================================================
     6. La ligne de série à 1, 2 et 3 colonnes, à 320 px

     C'est la mesure qui décide si trois colonnes de saisie sont tenables :
     avec PRÉCÉDENT, ce sont quatre colonnes souples à se partager la largeur.
     Un champ sous 40 px ne se lit plus et ne se vise plus.
     ================================================================ */

  bloc('Ligne de série à 320 px', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');

    /* On fabrique une séance en cours, et on la fait rendre par la vraie vue :
       mesurer une maquette ne prouverait rien sur l'app. */
    function seanceAvec(cols) {
      var e = fen.App.store.etat();
      var ex = fen.App.m.exerciceSeanceVierge({
        nom: 'Exercice banc', typeCharge: 'kg', colonnes: cols,
        series: [{}, {}]
      });
      var se = fen.App.m.seanceMuscu(null);
      se.exercices = [ex];
      e.seances = [se];
      e.seanceEnCoursId = se.id;
      fen.App.vues.seance.rendre(vue);
      return se;
    }

    function mesurer(cols) {
      seanceAvec(cols);
      var ligne = doc.querySelector('.serie');
      if (!ligne) return null;
      var champs = ligne.querySelectorAll('.serie-saisie');
      var prec = ligne.querySelector('.serie-prec');
      var mini = 9999;
      Array.prototype.forEach.call(champs, function (c) {
        mini = Math.min(mini, c.getBoundingClientRect().width);
      });
      return {
        nbChamps: champs.length,
        miniChamp: Math.round(mini),
        prec: Math.round(prec.getBoundingClientRect().width),
        droite: Math.round(ligne.getBoundingClientRect().right),
        cols: ligne.dataset.cols,
        entetes: Array.prototype.map.call(doc.querySelectorAll('.serie-entete span'),
          function (s) { return s.textContent; }).filter(function (t) { return t; })
      };
    }

    var m2 = mesurer(['charge', 'reps']);
    v.egal(m2.nbChamps, 2, 'le défaut affiche deux champs');
    v.egal(m2.cols, '2', 'et la ligne le dit à la grille');
    v.egal(m2.entetes.join(','), 'Série,Précédent,Charge,Reps', 'les en-têtes nomment les colonnes');
    v.vrai(m2.miniChamp >= 40, 'à deux colonnes, le plus petit champ fait '
                             + m2.miniChamp + ' px — au moins 40');

    var m1 = mesurer(['duree']);
    v.egal(m1.nbChamps, 1, 'un isométrique n’affiche qu’un champ');
    v.egal(m1.entetes.join(','), 'Série,Précédent,Sec', 'et sa colonne s’appelle Sec');
    v.vrai(m1.miniChamp >= 40, 'il est large (' + m1.miniChamp + ' px)');

    var m3 = mesurer(['charge', 'reps', 'duree']);
    v.egal(m3.nbChamps, 3, 'trois colonnes donnent trois champs');
    v.egal(m3.entetes.join(','), 'Série,Précédent,Charge,Reps,Sec', 'nommées dans l’ordre');
    v.vrai(m3.miniChamp >= 40,
           'À TROIS COLONNES, le plus petit champ fait ' + m3.miniChamp
         + ' px — c’est la mesure qui décide si trois colonnes tiennent à 320 px');
    v.vrai(m3.prec >= 48,
           'et PRÉCÉDENT garde ' + m3.prec + ' px, de quoi lire « 20 × 12 »');
    v.vrai(m3.droite <= LARGEUR, 'la ligne ne déborde pas de l’écran');
    v.vrai(doc.documentElement.scrollWidth <= LARGEUR,
           'et la séance ne défile pas horizontalement (débord : '
         + (doc.documentElement.scrollWidth - LARGEUR) + ' px)');

    /* La cible tactile du ✓ et du bouton de type ne doit pas avoir fondu. */
    var ok = doc.querySelector('.serie-ok').getBoundingClientRect();
    v.vrai(ok.width >= 40 && ok.height >= 40,
           'le ✓ reste visable : ' + Math.round(ok.width) + ' × ' + Math.round(ok.height) + ' px');

    /* Saisir dans la 3e colonne doit écrire dans dureeReel, pas ailleurs. */
    var se = fen.App.store.etat().seances[0];
    var champs = doc.querySelectorAll('.serie .serie-saisie');
    champs[2].value = '45';
    champs[2].dispatchEvent(new fen.Event('input', { bubbles: true }));
    v.egal(se.exercices[0].series[0].dureeReel, '45',
           'la troisième colonne écrit bien la DURÉE');
    v.egal(se.exercices[0].series[0].repsReel, '',
           'et surtout pas les reps — c’était tout le défaut d’avant');

    fen.App.ui.vider(vue);
    var e = fen.App.store.etat();
    e.seances = [];
    e.seanceEnCoursId = null;
    return attendre(20);
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
