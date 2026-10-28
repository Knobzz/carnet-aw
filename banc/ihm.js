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

  /* Attendre un ETAT plutot qu'un DELAI. Un `attendre(420)` apres une
     transition de 260 ms parait large, mais le navigateur ralentit les
     transitions d'une page qui n'a pas le focus : le controle devient
     intermittent, et un banc rouge par intermittence est pire qu'un banc
     rouge — on apprend a l'ignorer. */
  function attendreQue(condition, maxMs) {
    var fin = Date.now() + (maxMs || 2000);
    return new Promise(function (resoudre) {
      (function essayer() {
        var ok = false;
        try { ok = !!condition(); } catch (e) { ok = false; }
        if (ok || Date.now() > fin) return resoudre(ok);
        setTimeout(essayer, 40);
      })();
    });
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
    /* Les chemins sont ceux de l'app, pas ceux du banc : avec <base href="../">
       ci-dessous, `js/model.js` et `icones/muscle-fcu.png` se résolvent dans
       l'iframe exactement comme dans index.html. Sans ça, une planche
       trouvée ici serait introuvable sur le téléphone, ou l'inverse. */
    var s = function (f) { return '<scr' + 'ipt src="js/' + f + t + '"></scr' + 'ipt>'; };
    var barre = '';
    onglets.forEach(function (n) {
      barre += '<button class="onglet" role="tab" aria-selected="false" aria-label="' + n
             + '"><span>' + n + '</span></button>';
    });
    return '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
      + '<base href="../">'
      + '<link rel="stylesheet" href="css/app.css' + t + '">'
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
      + s('vue-programmes.js') + s('vue-recup.js') + s('vue-reglages.js')
      /* `vue-sparring.js` MANQUAIT jusqu'au 27/10 : `A.vues.sparring` etait
         undefined dans l'hote, l'appui ne faisait rien, et toute la vue
         echappait au banc. Trouve en branchant le sparring sur Seance. */
      + s('vue-sparring.js')
      /* `vue-journal.js` MANQUAIT aussi, trouve le 28/10 en rendant la
         journee de recup supprimable. Deux vues entieres echappaient au
         banc ; celle-ci portait justement la carte morte. */
      + s('vue-journal.js')
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
  /* LE VRAI DEBORDEMENT : le bord droit des elements eux-memes.

     `documentElement.scrollWidth <= LARGEUR` ne peut PAS tomber ici : la
     feuille pose `overflow-x: hidden` sur body, donc le document ne
     depasse jamais la fenetre, quoi qu'on y mette. Sept blocs du banc
     ecrivaient ce controle-la ; il etait vert par construction.

     On ne nomme que le plus HAUT des coupables : un enfant qui sort parce
     que son parent sort n'ajoute rien au diagnostic. */

  /* Le sous-onglet du Suivi est un etat de MODULE, comme la region choisie.
     Un bloc qui le laisse ailleurs que sur « Seances » le laisse ainsi pour
     tous les suivants. Mesure du 28/10 : 448 controles joues au lieu de
     551, une centaine emportes par un onglet reste sur « Recup ». */
  function rangerSousOnglet(doc) {
    var bt = null;
    Array.prototype.forEach.call(doc.querySelectorAll('.sous-onglet'), function (b) {
      if (b.textContent === 'Séances') bt = b;
    });
    if (bt && bt.getAttribute('aria-pressed') !== 'true') bt.click();
  }

  function debordements(doc, fen, largeur) {
    var sortis = [];
    Array.prototype.forEach.call(doc.querySelectorAll('body *'), function (n) {
      var r = n.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var st = fen.getComputedStyle(n);
      if (st.visibility === 'hidden' || st.display === 'none') return;
      if (r.right <= largeur + 0.5 && r.left >= -0.5) return;
      for (var i = 0; i < sortis.length; i++) {
        if (sortis[i].contains(n)) return;
      }
      sortis.push(n);
    });
    return sortis.map(function (n) {
      var r = n.getBoundingClientRect();
      var cl = (typeof n.className === 'string' && n.className.trim())
        ? '.' + n.className.trim().split(/\s+/).join('.') : '';
      return n.tagName.toLowerCase() + cl
           + ' [' + Math.round(r.left) + '→' + Math.round(r.right) + ']';
    });
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

      /* Ce qu'on mesure ici, c'est OU LE BANDEAU SE REPOSE une fois arrete —
         pas le deroulement de la glissade. Or un navigateur ne fait pas
         avancer une transition CSS sur une page qu'il ne peint pas : quand
         le volet d'apercu est masque, la page hote tombe a 0 x 0 et la
         transition reste figee a son point de depart. Le controle etait
         alors rouge quoi qu'il arrive, et vert des qu'on regardait — il
         mesurait l'etat du volet, pas celui du bandeau.

         On coupe donc la transition le temps de la mesure. L'etat final est
         immediat et ne depend plus du rendu. La glissade elle-meme n'est PAS
         mesuree ici : c'est le prix, et il est dit. */
      /* Avant de couper la transition, on verifie qu'elle EXISTE. Ce qui
         suit mesure les deux etats de REPOS, pas la glissade — et la
         glissade ne peut pas etre mesuree ici, puisqu'elle n'avance pas sur
         une page que le navigateur ne peint pas. Ce controle-ci porte donc
         sur une DECLARATION, pas sur un effet, et c'est le seul endroit du
         banc ou c'est assume : sans lui, supprimer l'animation ne ferait
         rien tomber du tout. */
      /* ET IL Y A UN SECOND ENVIRONNEMENT QUI LE FAIT MENTIR, trouve le
         2026-10-27 : la feuille coupe elle-meme la glissade sous
         `prefers-reduced-motion: reduce`, et ce reglage est VRAI dans le
         navigateur de travail. Le controle lisait alors 0 s et accusait le
         code d'avoir perdu l'animation — alors que le CSS faisait
         exactement ce qu'on lui demande.

         On lit donc le reglage, et on mesure CE QUI EST JUSTE DANS LES DEUX
         CAS : la glissade quand elle est permise, son ABSENCE quand elle ne
         l'est pas. Le controle tombe toujours si quelqu'un supprime la
         regle, et il ne tombe plus pour une raison qui n'est pas la
         sienne. */
      var cadre = doc.querySelector('.chrono');
      var sobre = fen.matchMedia
        && fen.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var dureeVisible = style(fen, '.chrono', 'transitionDuration') || '';
      cadre.classList.remove('visible');
      var dureeCachee = style(fen, '.chrono', 'transitionDuration') || '';
      cadre.classList.add('visible');
      function glisse(d) {
        return sobre ? /^0s(, ?0s)*$/.test(d.trim()) : /0\.26s|260ms/.test(d);
      }
      v.vrai(glisse(dureeVisible) && glisse(dureeCachee),
             (sobre
               ? 'mouvement reduit demande : la glissade est COUPEE dans les '
               + 'deux sens, et c’est ce que la feuille doit faire (montee '
               : 'la glissade est DECLAREE dans les deux sens (montee ')
             + dureeVisible
           + ', descente ' + dureeCachee + ') — les deux états portent chacun '
           + 'leur règle, et lire seulement l’état courant laissait l’autre '
           + 'sans garde. C’est une DÉCLARATION : le déroulement, lui, '
           + 'n’avance pas sur une page non peinte');

      var sansGlissade = doc.createElement('style');
      sansGlissade.textContent =
        '.chrono, .chrono.visible { transition: none !important; }';
      doc.head.appendChild(sansGlissade);

      if (passer) passer.click();

      return attendreQue(function () {
        return style(fen, '.chrono', 'visibility') === 'hidden';
      }).then(function () {
        var r2 = rect(doc, '.chrono');
        v.vrai(!!r2, '[temoin] le bandeau reste monté : il est caché, pas détruit');
        if (!r2) return;

        v.vrai(r2.top >= HAUTEUR,
               'arrêté, il est ENTIÈREMENT sous le bas de l’écran (haut mesuré à '
             + Math.round(r2.top) + ' px pour un écran de ' + HAUTEUR
             + ' ; page hôte ' + window.innerWidth + '×' + window.innerHeight
             + ', classes du bandeau « ' + doc.querySelector('.chrono').className
             + ' »)');
        v.egal(style(fen, '.chrono', 'visibility'), 'hidden',
               'et il est retiré du ciblage : visibility hidden');
        v.egal(style(fen, '.chrono', 'pointerEvents'), 'none',
               'doublé de pointer-events none, pour le temps de la glissade');
        v.vrai(!doc.body.classList.contains('chrono-ouvert'),
               'la page reprend sa hauteur normale');
        v.vrai(!doc.querySelector('.chrono').classList.contains('visible'),
               'et la classe « visible » est bien retirée — c’est CE QUE L’APP '
             + 'décide, mesuré sans dépendre du rendu');

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
        return attendreQue(function () {
          return style(fen, '.chrono', 'visibility') === 'visible';
        }).then(function () {
          var r3 = rect(doc, '.chrono');
          v.vrai(r3.bottom <= HAUTEUR + 1, 'relancé, il revient dans l’écran ('
               + 'bas mesuré à ' + Math.round(r3.bottom) + ' px)');
          v.egal(style(fen, '.chrono', 'visibility'), 'visible', 'et redevient visible');
          chrono.arreter();
          /* On rend la transition au reste du banc : elle n'etait coupee que
             le temps de mesurer les deux etats de REPOS. */
          sansGlissade.remove();
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

      /* L'ordre de la fiche est une décision : ce qui décrit l'exercice
         d'abord, ce qui sert au recoupement de la douleur en dernier. */
      v.vrai(libelles.indexOf('Structures chargées') > libelles.indexOf('Mouvements'),
             '« Structures chargées » passe APRÈS « Mouvements »');
      v.vrai(libelles.indexOf('Structures chargées') > libelles.indexOf('Muscles sollicités'),
             'et après « Muscles sollicités » : c’est le vocabulaire de la '
           + 'douleur, pas celui du travail');
      v.egal(libelles[libelles.length - 1], 'Structures chargées',
             'c’est même le TOUT dernier groupe de la fiche, après le repos');
      v.egal(libelles.indexOf('Forces de Larratt'), -1,
             '« Forces de Larratt » n’apparaît plus nulle part dans la fiche');

      /* CE CONTROLE EXIGEAIT ZERO AIDE SOUS « OUTILS » jusqu'au 27/10, et
         il est tombe ce jour-la. Il avait raison de tomber : l'aide avait
         ete retiree parce que la fiche etait BAVARDE, et le groupe est
         reste muet — au point que MB a cru la fonction absente, « pas
         possible dans la configuration que je voulais ».

         Le precedent etait juste a cote, dans le meme commentaire :
         « Structures chargees » avait perdu son aide puis l'avait REPRISE,
         courte. Ce qui etait reproche etait le bavardage, pas
         l'explication. Le controle mesure donc maintenant la BRIEVETE, qui
         est ce que la decision d'origine protegeait.

         Et le groupe s'appelle « Equipements » depuis le 27/10. */
      var gOutils = groupe('Équipements');
      var gStruct = groupe('Structures chargées');
      v.vrai(!!gOutils && !!gStruct, '[temoin] les deux groupes sont là');
      v.egal(groupe('Outils'), null,
             'plus aucun groupe ne s’appelle « Outils » : le reste de l’app '
           + 'dit « mon équipement »');
      var aideEq = gOutils && gOutils.querySelector('.item-resume');
      v.vrai(!!aideEq, 'le groupe « Équipements » porte une aide — sans elle, '
           + 'personne ne devine qu’il faut faire Entrée');
      v.vrai(!aideEq || aideEq.textContent.length <= 220,
             'et elle reste COURTE (' + (aideEq ? aideEq.textContent.length : 0)
           + ' caractères) : c’est le bavardage qui avait été reproché, pas '
           + 'l’explication');
      if (gStruct) {
        var aide = gStruct.querySelector('.item-resume');
        v.vrai(!!aide, 'une aide sous « Structures chargées » — elle a été redemandée');
        v.vrai(aide && aide.textContent.length <= 120,
               'et elle est COURTE (' + (aide ? aide.textContent.length : -1)
             + ' signes) : c’est le bavardage qui était reproché');
        v.vrai(aide && aide.textContent.indexOf('encaisse') >= 0,
               'elle dit la seule chose utile : ce n’est pas ce qui travaille');
      }

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

      /* --- la liste des muscles ---
         Elle est rangée par région, et une région oubliée du tableau rendrait
         ses muscles INVISIBLES : la case resterait vide sans que rien ne le
         dise. On compte donc les lignes contre le tableau du modèle. */
      /* --- les régions se replient ---
         Vingt-deux muscles d'affilée font un mur : on ne voit plus ce qu'on a
         coché, et le reste de la fiche part sous l'écran. */
      var entetes = pan.querySelectorAll('.muscle-bloc .equip-cat');
      v.egal(entetes.length, fen.App.m.REGIONS_MUSCLE.length,
             'une région repliable par groupe de muscles');
      var ouvertes = Array.prototype.filter.call(entetes, function (n) {
        return n.getAttribute('aria-expanded') === 'true';
      }).length;
      v.egal(ouvertes, 0, 'sur un exercice SANS muscle coché, toutes sont fermées');
      var hautVisible = 0;
      Array.prototype.forEach.call(pan.querySelectorAll('.muscle-bloc'), function (n) {
        hautVisible += n.getBoundingClientRect().height;
      });
      v.vrai(hautVisible < 400,
             'et les vingt-deux muscles tiennent alors en moins de 400 px '
           + '(mesuré : ' + Math.round(hautVisible) + ')');
      v.vrai(entetes[0].getBoundingClientRect().height >= 44,
             'chaque en-tête se touche');
      v.vrai(/[0-9]/.test(entetes[0].textContent),
             'et dit combien de muscles elle contient, sans l’ouvrir ('
           + entetes[0].textContent + ')');

      /* On les ouvre toutes : une ligne repliée mesure zéro, et les contrôles
         qui suivent mesurent des lignes réelles. */
      Array.prototype.forEach.call(entetes, function (n) { n.click(); });

      var lignesM = pan.querySelectorAll('.muscle-ligne');
      v.egal(lignesM.length, fen.App.m.MUSCLES.length,
             'chaque muscle a sa ligne dans la fiche — une région oubliée les '
           + 'ferait disparaître sans bruit');
      var nomsM = Array.prototype.map.call(lignesM, function (l) {
        return l.querySelector('b').textContent;
      });
      var absents = fen.App.m.MUSCLES.filter(function (m) {
        return nomsM.indexOf(m.nom) < 0;
      }).map(function (m) { return m.nom; });
      v.egal(absents.join(', '), '', 'et c’est bien chacun le sien');

      /* Chaque ligne dit ce que le muscle MOBILISE : c'est la seule entrée
         pour qui ne connaît pas les termes. */
      var sansJeton = Array.prototype.filter.call(lignesM, function (l) {
        var j = l.querySelector('.jeton-art');
        return !j || !j.textContent;
      }).length;
      v.egal(sansJeton, 0, 'chaque ligne dit l’articulation mobilisée');
      var texteM = pan.textContent;
      v.vrai(texteM.indexOf('Rotation de l’avant-bras') >= 0,
             'nommée en clair — « Rotation de l’avant-bras », pas « avant_bras »');
      v.vrai(texteM.indexOf('profond') >= 0,
             'et les muscles profonds sont signalés comme tels');
      v.vrai(texteM.indexOf('dit aussi long supinateur') >= 0,
             'le nom des planches françaises est donné : c’est celui qu’on reconnaît');

      var hautM = 999, sortM = 0;
      Array.prototype.forEach.call(lignesM, function (l) {
        var r = l.getBoundingClientRect();
        hautM = Math.min(hautM, r.height);
        if (r.right > LARGEUR + 1) sortM += 1;
      });
      v.vrai(hautM >= 44, 'chaque ligne reste touchable (mesuré : '
                        + Math.round(hautM) + ' px)');
      v.egal(sortM, 0, 'et aucune ne sort de l’écran à 320 px');

      /* Cocher un mouvement COCHE ses muscles : c'est le geste, et il n'en
         faut pas un second. Le décocher les RETIRE — mais seulement ceux que
         ce mouvement-là avait posés. Un muscle coché à la main, ou déjà posé
         par un autre mouvement, ne lui appartient pas. */
      var puceCup = null;
      Array.prototype.forEach.call(pan.querySelectorAll('.puce'), function (p) {
        if (p.textContent === 'Cupping') puceCup = p;
      });
      v.vrai(!!puceCup, '[temoin] la puce « Cupping » est là');
      v.egal(fen.App.m.muscles(brouillon).length, 0, '[temoin] aucun muscle au départ');
      if (puceCup) {
        puceCup.click();
        var apres = fen.App.m.muscles(brouillon);
        v.egal(apres.join(','),
               fen.App.m.muscles({ muscles: fen.App.m.MUSCLES_PAR_MOUVEMENT.cupping.muscles })
                        .join(','),
               'cocher « Cupping » coche directement ses muscles, sans second geste');
        v.vrai(apres.length > 0, '[temoin] et il y en a');
        var presses2 = pan.querySelectorAll('.muscle-ligne[aria-pressed="true"]');
        v.egal(presses2.length, apres.length, 'la liste en dessous le montre');
        var ouvertes2 = pan.querySelectorAll('.muscle-bloc .equip-cat[aria-expanded="true"]');
        v.vrai(ouvertes2.length > 0,
               'et la région qui les contient s’ouvre — cocher sans le voir ne vaut rien');

        puceCup.click();
        v.egal(fen.App.m.muscles(brouillon).length, 0,
               'décocher le mouvement RETIRE ses muscles');
        v.egal((brouillon.forces || []).length, 0, 'et le mouvement est décoché');

        /* Le vrai piège : un muscle coché À LA MAIN qui se trouve AUSSI dans
           la liste du mouvement. Retirer « la liste du mouvement » le
           prendrait au passage ; retirer « ce que ce mouvement a posé » le
           laisse, parce qu'il y était déjà. */
        function ligneDe(nom) {
          var t = null;
          Array.prototype.forEach.call(pan.querySelectorAll('.muscle-ligne'), function (n) {
            if (n.querySelector('b').textContent === nom) t = n;
          });
          return t;
        }
        var lFcu = ligneDe('Fléchisseur ulnaire du carpe');
        v.vrai(!!lFcu, '[temoin] la ligne du fléchisseur ulnaire est atteignable');
        lFcu.click();
        v.egal(fen.App.m.muscles(brouillon).join(','), 'fcu',
               '[temoin] coché à la main, et il est DANS la liste du cupping');
        puceCup.click();
        v.vrai(fen.App.m.muscles(brouillon).length > 1,
               '[temoin] le cupping pose les autres');
        puceCup.click();
        v.egal(fen.App.m.muscles(brouillon).join(','), 'fcu',
               'décocher ne reprend QUE ce que le mouvement avait posé : '
             + 'ce qui était coché à la main survit');

        /* Second piège : deux mouvements qui partagent un muscle. Rising et
           supination portent tous deux le biceps ; décocher le second ne doit
           pas emporter ce que le premier avait posé. */
        if (ligneDe('Fléchisseur ulnaire du carpe')) ligneDe('Fléchisseur ulnaire du carpe').click();
        v.egal(fen.App.m.muscles(brouillon).length, 0, '[temoin] on repart de zéro');
        var puceSup = null, puceRis = null;
        Array.prototype.forEach.call(pan.querySelectorAll('.puce'), function (p) {
          if (p.textContent === 'Supination') puceSup = p;
          if (p.textContent === 'Rising') puceRis = p;
        });
        puceSup.click();
        v.vrai(fen.App.m.muscles(brouillon).indexOf('biceps') >= 0,
               '[temoin] la supination pose le biceps');
        puceRis.click();
        puceRis.click();
        v.vrai(fen.App.m.muscles(brouillon).indexOf('biceps') >= 0,
               'décocher « Rising » ne reprend pas le biceps : c’est la '
             + 'supination qui l’avait posé');
        v.egal(fen.App.m.muscles(brouillon).indexOf('deltoide'), -1,
               'mais ce que « Rising » avait posé, lui, est bien parti');
        puceSup.click();
        v.egal(fen.App.m.muscles(brouillon).length, 0,
               'et décocher la supination finit de vider');
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
    ['Barre droite', 'Barre EZ', 'Poulie haute', 'Dumbbell', 'Haltère 10 kg',
     'Sangle de pronation'].forEach(function (n) {
      fen.App.m.majCatalogueOutils(e, n, 'Matériel');
    });
    fen.App.m.majCatalogueOutils(e, 'Poulie basse', 'Poulies');
    v.egal(e.outils.length, 15, '[temoin] quinze outils en catalogue — '
                              + 'un inventaire réaliste, pas trois');

    var brouillon = fen.App.m.exerciceProgramme({});
    fen.App.panneau.editerExercice(brouillon, { titre: 'Ajouter un exercice' }, function () {});

    return attendre(120).then(function () {
      var pan = doc.querySelector('.panneau');
      var saisie = pan.querySelector('.multi input.champ');
      v.vrai(!!saisie, 'le champ « Équipements » est là');
      if (!saisie) return;

      saisie.focus();
      saisie.dispatchEvent(new fen.Event('focus'));

      return attendre(80).then(function () {
        var liste = pan.querySelector('.multi .auto-liste');
        var noms = Array.prototype.map.call(liste.querySelectorAll('.auto-opt b'),
          function (b) { return b.textContent; });
        /* La coupe à huit cachait la moitié de l'équipement SANS RIEN DIRE :
           on ouvrait la liste et on croyait avoir perdu son matériel. Le
           signalement est venu d'un vrai téléphone, après avoir ajouté onze
           outils d'un coup. L'équipement est un inventaire borné : on le
           montre en entier, et la liste défile. */
        v.egal(noms.length, 15,
               'TOUT l’équipement est proposé, pas les huit premiers');
        v.vrai(noms.indexOf('Poulie basse') >= 0,
               'l’outil ajouté juste avant est VISIBLE sans rien taper');
        v.egal(noms[0], 'Poulie basse', 'et il arrive en tête');

        /* La liste déroulante ne doit pas sortir de l'écran à 320 px. */
        var r = liste.getBoundingClientRect();
        v.vrai(r.left >= 0 && r.right <= LARGEUR,
               'la liste déroulante tient dans la largeur');

        /* Et montrer tout ne doit pas faire une liste qui dépasse l'écran :
           elle DÉFILE. Sans ça, la correction du cachage en créerait un autre. */
        v.vrai(r.height <= HAUTEUR,
               'elle ne dépasse pas la hauteur de l’écran ('
             + Math.round(r.height) + ' px pour ' + HAUTEUR + ')');
        v.vrai(liste.scrollHeight > liste.clientHeight + 1,
               'elle défile : le reste est atteignable, pas perdu');

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
      /* « MOUVEMENTS » A ETE FONDU DANS « TON STYLE » le 28/10 — MB : « tu
         peux egalement enlever Mouvements je pense ? ». Ses six chiffres
         vivent sous leur style ; le titre qui porte la periode est
         desormais celui-la. */
      v.vrai(titres.some(function (t) { return t.indexOf('Ton style — ') === 0; }),
             'Suivi titre la section « Ton style » avec sa période');
      v.egal(titres.filter(function (t) { return t.indexOf('Mouvements — ') === 0; }).length, 0,
             'et le bloc « Mouvements » a disparu, pas ete neutralise');
      v.egal(titres.filter(function (t) { return /28 derniers jours/.test(t); }).length, 0,
             'et plus aucun titre n’annonce une fenêtre de 28 jours en dur');

      /* La Recup : sept jours, et plus de colonne a 28. Il faut une seance
         de recup dans le decor, sinon le bloc n'est pas rendu du tout et le
         controle mesurerait du vide. */
      var recup = fen.App.m.seanceRecup(null);
      recup.exercices = [{ id: fen.App.m.uid('e'), ordre: 0, nom: 'Élastique',
                           slug: 'elastique', series: [{ id: fen.App.m.uid('s'),
                           type: 'normale', faite: true }] }];
      e.seances = e.seances.concat([recup]);
      fen.App.vues.suivi.rendre(vue);
      /* LE BLOC RECUP A DEMENAGE dans son sous-onglet le 2026-10-28, a la
         demande de MB : « une separation nette entre Suivi des seances,
         suivi de la Recup et suivi des Sparring ». Le controle l'y suit.
         Il tombait, et il avait raison de tomber : le bloc n'est plus sur
         l'ecran d'ouverture. */
      var versRecup = null;
      Array.prototype.forEach.call(doc.querySelectorAll('.sous-onglet'), function (b) {
        if (b.textContent === 'Récup') versRecup = b;
      });
      v.vrai(!!versRecup, '[temoin] le sous-onglet Récup existe, avant d’y aller');
      if (versRecup) versRecup.click();
      var texteSuivi = doc.body.innerText;
      v.vrai(/récupération/i.test(texteSuivi),
             '[temoin] le bloc Récupération est bien rendu, avant de le mesurer');
      v.vrai(/7 derniers jours/i.test(texteSuivi),
             'la Récup garde ses SEPT jours : c’est la semaine d’une routine '
           + 'quotidienne, et elle se lit d’un coup d’œil');
      v.egal((texteSuivi.match(/28 derniers jours/gi) || []).length, 0,
             'et plus rien, nulle part, n’annonce une fenêtre de 28 jours — '
           + 'depuis que la période se choisit, elle disait une fenêtre de '
           + 'plus, figée, que personne n’avait demandée');
      v.egal(titres.indexOf('Forces de Larratt — 28 derniers jours'), -1,
             '« Forces de Larratt » a disparu de Suivi aussi');

      /* ON REPOSE L'ONGLET avant la suite du bloc : ce qui vient mesure
         l'ecran des seances. */
      rangerSousOnglet(doc);
      fen.App.vues.suivi.rendre(vue);

      var barres = doc.querySelectorAll('.barre');
      v.vrai(barres.length >= 3,
             '[temoin] il reste des barres à mesurer — styles, muscles, régions');

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
      /* « Side pressure » est le libelle le plus long des barres de style :
         c'est lui qui dit si un libelle se coupe a 320 px. */
      v.vrai(noms.indexOf('Side pressure') >= 0,
             '« Side pressure » est bien affiché — c’est la mesure partagée');
      v.egal(coupes.length, 0,
             'aucun libellé ne se coupe en deux lignes (fautifs : '
           + (coupes.join(', ') || 'aucun') + ')');

      /* La barre doit rester assez large pour qu'on compare des hauteurs. */
      var piste = doc.querySelector('.barre .barre-piste');
      v.vrai(piste.getBoundingClientRect().width >= 100,
             'la barre garde au moins 100 px de large (mesuré : '
           + Math.round(piste.getBoundingClientRect().width) + ')');

      var sortis = debordements(doc, fen, LARGEUR);
      v.egal(sortis.join(' · '), '',
             'et rien ne sort de l’écran à 320 px — mesuré au BORD DROIT des '
           + 'éléments, pas au scrollWidth, que « overflow-x: hidden » rend '
           + 'toujours vert');

      fen.App.ui.vider(vue);
      e.seances = [];
      return attendre(20);
    });
  });

  /* ================================================================
     Le buste par region, a 320 px

     Un dessin peut mentir sans qu'aucun controle de modele s'en apercoive.
     Les deux bords qu'on garde ici : une region du catalogue SANS forme sur
     le buste n'apparait nulle part et sa charge disparait en silence ; une
     forme dont l'id n'existe plus au catalogue affiche une zone que rien ne
     nourrit. On mesure la correspondance et les chiffres, pas l'esthetique.
     ================================================================ */

  bloc('Le buste par région, à 320 px', function (v, h) {
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
    function exoM(nom, muscles, n) {
      var l = [];
      for (var i = 0; i < n; i++) l.push(serie());
      return { id: fen.App.m.uid('e'), ordre: 0, nom: nom, slug: fen.App.m.slug(nom),
               aw: false, typeCharge: 'kg', forces: [], structures: [], outils: [],
               consigne: '', reposSecondes: 90, series: l,
               muscles: muscles, cote: 'deux' };
    }

    /* Un carnet ou les regions sont VOLONTAIREMENT inegales : il faut du
       rouge, du bleu, et au moins une region jamais touchee — sinon les
       trois cas d'affichage ne sont pas parcourus. Le bras arriere et le
       bras avant restent vides. */
    var e = fen.App.store.etat();
    e.seances = [];
    for (var sem = 0; sem < 11; sem++) {
      e.seances.push({
        id: 'bu-' + sem, type: 'muscu', date: jourIlYA(sem * 7 + 1),
        heure: jourIlYA(sem * 7 + 1) + 'T18:00:00.000Z',
        programmeId: null, programmeNom: 'Buste', dureeMin: 50, rpeGlobal: null,
        note: '', douleurs: [],
        exercices: [exoM('Wrist curl', ['fcu', 'fcr'], 4),
                    exoM('Extension poignet', ['ecrl', 'ecrb'], 2),
                    exoM('Élévation latérale', ['deltoide'], 3),
                    exoM('Pince', ['flechisseurs_doigts'], 1)]
      });
    }
    /* Une seule seance de tirage, tout au debut : le torse doit donc etre
       la region la MOINS chargee sans etre vide. */
    e.seances.push({
      id: 'bu-torse', type: 'muscu', date: jourIlYA(70),
      heure: jourIlYA(70) + 'T18:00:00.000Z', programmeId: null,
      programmeNom: 'Buste', dureeMin: 50, rpeGlobal: null, note: '',
      douleurs: [], exercices: [exoM('Tirage', ['grand_dorsal'], 2),
                                exoM('Développé couché', ['grand_pectoral'], 3)]
    });

    var vue = doc.getElementById('vue');
    fen.App.vues.suivi.rendre(vue);

    return attendre(90).then(function () {
      var svg = doc.querySelector('.corps-regions');
      v.vrai(!!svg, 'le buste est dessiné dans Suivi');
      if (!svg) return attendre(10);

      /* --- la correspondance, DANS LES DEUX SENS --- */
      var dessinees = {};
      Array.prototype.forEach.call(svg.querySelectorAll('[data-region]'), function (p) {
        dessinees[p.getAttribute('data-region')] = true;
      });
      var duModele = fen.App.m.REGIONS_MUSCLE.map(function (r) { return r.id; });
      var sansForme = duModele.filter(function (id) { return !dessinees[id]; });
      var horsModele = Object.keys(dessinees).filter(function (id) {
        return duModele.indexOf(id) < 0;
      });
      v.egal(sansForme.join(','), '',
             'chaque région du catalogue a sa forme sur le buste');
      v.egal(horsModele.join(','), '',
             'et aucune forme ne porte un id absent du catalogue');

      /* --- une ligne par region, et le TOTAL qui va avec --- */
      var lignes = doc.querySelectorAll('.table-regions tr[data-region]');
      v.egal(lignes.length, duModele.length, 'une ligne de tableau par région');

      function ligne(id) {
        return doc.querySelector('.table-regions tr[data-region="' + id + '"]');
      }
      function celluleDe(id, i) {
        var l = ligne(id);
        return l ? l.children[i].textContent.trim() : 'ligne absente';
      }
      function nombreDe(id) {
        var c = celluleDe(id, 1);
        if (c === 'ligne absente') return c;
        return c === '—' ? 0 : parseInt(c, 10);
      }
      /* 11 seances x 4 series de wrist curl, deux muscles de la loge
         anterieure chacun : le compte est pose a la main, pas relu depuis
         la fonction qu'on teste. */
      v.egal(nombreDe('avant_bras_av'), 11 * 4 * 2,
             'l’avant-bras antérieur compte ses séries, muscle par muscle');
      v.egal(nombreDe('epaule'), 11 * 3, 'l’épaule aussi');
      v.egal(nombreDe('bras_ar'), 0, 'le bras arrière n’a rien reçu');

      /* --- ce qui n'a JAMAIS servi se dit, et ne se devine pas a la teinte --- */
      var zonesBrasAr = svg.querySelectorAll('.zone-region[data-region="bras_ar"]');
      var muettes = Array.prototype.filter.call(zonesBrasAr, function (p) {
        return p.classList.contains('zone-muette');
      }).length;
      v.egal(muettes, zonesBrasAr.length,
             'une région jamais travaillée est grise, pas bleu pâle');
      v.egal(celluleDe('bras_ar', 2), 'jamais',
             'et sa ligne dit « jamais », pas « = 0 »');

      /* --- la somme des semaines egale le total affiche --- */
      var titres = Array.prototype.map.call(doc.querySelectorAll('.bloc-piste'),
        function (b) { return b.firstElementChild.textContent; });
      var nomAvb = fen.App.m.REGIONS_MUSCLE.filter(function (r) {
        return r.id === 'avant_bras_av';
      })[0].nom;
      v.vrai(titres.indexOf(nomAvb) >= 0, 'chaque région chargée a sa piste de semaines');
      var blocPiste = doc.querySelectorAll('.bloc-piste')[titres.indexOf(nomAvb)];
      var piste = blocPiste ? blocPiste.querySelector('.piste-semaine') : null;
      var semDefaut = fen.App.m.periodeSuivi(
        fen.App.store.etat().reglages.periodeSuivi).semaines;
      v.egal(piste ? piste.children.length : 'piste absente', semDefaut,
             'autant de barres que la période compte de semaines, pleines ou vides');
      var vides = piste ? Array.prototype.filter.call(piste.children, function (b) {
        return b.classList.contains('semaine-vide');
      }).length : 0;
      v.vrai(vides > 0, 'une semaine sans séance reste visible, à zéro');

      /* --- le lien dans les deux sens, et SUR LA BONNE VUE ---
         Le bras arriere ne doit s'allumer que sur le dos : un triceps qui
         apparait de face est un mensonge anatomique. */
      var lBrasAr = ligne('bras_ar');
      v.vrai(!!lBrasAr, 'la ligne du bras arrière existe, avant de la toucher');
      if (lBrasAr) lBrasAr.dispatchEvent(new fen.MouseEvent('click', { bubbles: true }));
      /* Le clic refait l'ecran : tout ce qu'on tenait avant est detache. */
      svg = doc.querySelector('.corps-regions');
      var allumees = svg.querySelectorAll('.zone-region.vedette');
      v.egal(allumees.length, 2, 'toucher une ligne allume les deux côtés du corps');
      var surDos = Array.prototype.every.call(allumees, function (p) {
        var t = p.parentNode.parentNode.getAttribute('transform') || '';
        return t.indexOf('translate(92') === 0;
      });
      v.vrai(surDos, 'et le bras arrière ne s’allume QUE sur la vue de dos');
      v.vrai(!!ligne('bras_ar') && ligne('bras_ar').classList.contains('vedette'),
             'la ligne touchée s’allume elle aussi');

      /* --- LE FILTRE : toucher une region ne garde que SES muscles ---
         Sans ca, le buste ne sert qu'a regarder ; avec, il sert a chercher. */
      var titresM = Array.prototype.map.call(doc.querySelectorAll('.sous-titre'),
        function (t) { return t.textContent; });
      v.vrai(titresM.some(function (t) { return t === 'Muscles — Triceps'; }),
             'le bloc Muscles se titre de la région touchée');
      function nomsAffiches() {
        return Array.prototype.map.call(
          doc.querySelectorAll('.barres-muscles .barre-nom'),
          function (b) { return b.textContent; });
      }
      /* Le triceps n'a RIEN recu dans ce decor : le filtrer doit donner une
         liste vide ET le dire. Un cadre vide sans phrase se lit comme un
         bogue. */
      /* Une region jamais travaillee montre quand meme SES muscles : leur
         planche n'a aucun autre chemin dans l'app — `voirPlanche` n'est
         appelee que d'ici, et seulement pour les muscles charges. */
      var duTriceps = fen.App.m.musclesDeLaRegion('bras_ar');
      var vusTriceps = nomsAffiches();
      v.egal(vusTriceps.join(', '), duTriceps.join(', '),
             'une région jamais travaillée montre TOUS ses muscles, pour que '
           + 'leurs planches restent atteignables');
      v.vrai(/Aucun muscle de cette région/.test(doc.body.innerText),
             'et l’écran dit qu’aucun n’a travaillé');
      /* PORTEE RESSERREE le 2026-10-28, et non affaiblie : ce compte
         portait sur TOUT le document. Depuis que le bloc « Ton style »
         rend un style a zero avec la meme classe, il en comptait une de
         plus — 3 au lieu de 2. Le controle disait vrai ; il ne disait pas
         OU. Il compte maintenant dans le bloc des muscles, le seul qu'il
         mesure. */
      v.egal(doc.querySelectorAll('.barres-muscles .barre-vide').length,
             duTriceps.length,
             'chacun porte « jamais » au lieu d’une barre minuscule');
      v.vrai(!!doc.querySelector('.planche-fond'),
             'et une planche est affichée, là où il n’y en avait aucune');

      /* On enleve le filtre, puis on le repose sur une region CHARGEE :
         c'est la qu'on verifie qu'il ne garde que les siens. */
      ligne('bras_ar').dispatchEvent(new fen.MouseEvent('click', { bubbles: true }));
      var tous = nomsAffiches();
      v.vrai(tous.length > 0, 'sans filtre, tous les muscles chargés sont là');

      ligne('avant_bras_av').dispatchEvent(new fen.MouseEvent('click', { bubbles: true }));
      var filtres = nomsAffiches();
      v.vrai(filtres.length > 0 && filtres.length < tous.length,
             'filtrer sur les fléchisseurs en garde moins (' + filtres.length
           + ' sur ' + tous.length + ')');
      var duGroupe = fen.App.m.musclesDeLaRegion('avant_bras_av');
      var intrus = filtres.filter(function (x) { return duGroupe.indexOf(x) < 0; });
      v.egal(intrus.join(','), '',
             'et AUCUN muscle d’une autre région n’y reste (intrus : '
           + (intrus.join(', ') || 'aucun') + ')');

      ligne('avant_bras_av').dispatchEvent(new fen.MouseEvent('click', { bubbles: true }));
      v.egal(nomsAffiches().length, tous.length,
             'toucher de nouveau la région rend TOUS les muscles');
      svg = doc.querySelector('.corps-regions');

      /* --- le torse n'est PAS la meme region des deux cotes ---
         Le grand pectoral est sur le thorax, le grand dorsal sur le dos.
         Fondus, ils etaient peints de la meme couleur de face et de dos, ce
         qui affirmait a l'ecran une equivalence qui n'existe pas. */
      function regionsDeLaVue(dec) {
        var g = svg.querySelectorAll('g[transform]')[dec];
        var o = {};
        if (g) Array.prototype.forEach.call(g.querySelectorAll('[data-region]'),
          function (p) { o[p.getAttribute('data-region')] = true; });
        return o;
      }
      var deFace = regionsDeLaVue(0), deDos = regionsDeLaVue(1);
      v.vrai(!!deFace.torse_av && !deFace.torse_ar,
             'de face, le torse porte le pectoral — et pas le dorsal');
      v.vrai(!!deDos.torse_ar && !deDos.torse_av,
             'de dos, il porte le dorsal — et pas le pectoral');
      v.vrai(nombreDe('torse_av') !== nombreDe('torse_ar'),
             'et leurs deux lignes portent des chiffres differents');

      /* --- l'echelle se lit : aucun palier ne se confond avec le gris du
         « jamais », ni avec son voisin. Mesure sur les teintes REELLEMENT
         rendues, pas sur la table ecrite dans le source : c'est l'ecran qui
         decide, pas la constante. Deux teintes se confondent sous ~40. */
      function versRgb(c) {
        var m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : null;
      }
      function ecart(a, b) {
        if (!a || !b) return 999;
        return Math.round(Math.sqrt(a.reduce(function (t, x, i) {
          return t + (x - b[i]) * (x - b[i]);
        }, 0)));
      }
      var grisJamais = null, teintes = {};
      svg = doc.querySelector('.corps-regions');
      Array.prototype.forEach.call(svg.querySelectorAll('.zone-region'), function (p) {
        var c = versRgb(fen.getComputedStyle(p).fill);
        if (p.classList.contains('zone-muette')) grisJamais = c;
        else if (c) teintes[c.join(',')] = c;
      });
      var liste = Object.keys(teintes).map(function (k) { return teintes[k]; });
      v.vrai(liste.length >= 3, 'au moins trois teintes distinctes a l’ecran');
      var tropPres = liste.filter(function (c) {
        return ecart(c, grisJamais) < 40;
      }).length;
      v.egal(tropPres, 0,
             'aucune teinte ne se confond avec le gris du « jamais » '
           + '(seuil 40 ; l’ancienne echelle tombait a 43 en theme clair)');
      var pales = liste.filter(function (c) {
        return c[0] > 235 && c[1] > 235 && c[2] > 235;
      }).length;
      v.egal(pales, 0, 'et aucune ne tire vers le blanc');
      var froides = liste.filter(function (c) { return c[0] - c[2] < 60; }).length;
      v.egal(froides, 0,
             'chaque teinte est CHAUDE — le rouge domine le bleu d’au moins 60. '
           + 'C’est ce critere-la qui tient quel que soit le theme : le banc '
           + 'tourne en sombre, ou l’ecart au gris ne voit rien');

      /* --- un exercice a DEUX gestes ne doit pas faire mentir l'ecran ---
         On pronate ET on curle dans le meme mouvement : les muscles du curl
         comptent pour la pronation, ce qui est vrai, mais doit etre MARQUE.
         Sans l'etoile, l'ecran affirme que la pronation fait travailler le
         biceps. */
      var gardees = e.seances;
      e.seances = [{
        id: 'melange', type: 'muscu', date: jourIlYA(1), heure: '',
        programmeId: null, programmeNom: 'M', dureeMin: 40, rpeGlobal: null,
        note: '', douleurs: [],
        exercices: [exoM('Pronation + curl',
                         ['rond_pronateur', 'carre_pronateur', 'biceps'], 3)]
      }];
      e.seances[0].exercices[0].forces = ['pronation'];
      fen.App.vues.suivi.rendre(vue);
      var txt = doc.body.innerText;
      v.vrai(txt.indexOf('Rond pronateur 3') >= 0,
             'le croisement mouvements × muscles est bien rendu, AVANT de '
           + 'mesurer ce qu’il dit');
      var titresCroise = Array.prototype.map.call(doc.querySelectorAll('.sous-titre'),
        function (t) { return t.textContent; });
      v.egal(titresCroise.filter(function (t) {
        return t.indexOf('ce qu’il fait travailler') >= 0;
      }).length, 0,
             'le croisement n’affirme plus « ce qu’il fait travailler » : '
           + 'il compte TES EXERCICES, pas le mouvement — lu par textContent, '
           + 'parce que innerText rend le titre en MAJUSCULES');
      v.vrai(titresCroise.some(function (t) {
        return t.indexOf('Par mouvement, muscle par muscle') === 0;
      }), 'et il dit ce qu’il compte vraiment');
      var titreBras = svg.querySelector('.zone-region[data-region="bras_av"] title');
      v.vrai(!!titreBras && /Brachial/i.test(titreBras.textContent),
             'le nom court « Biceps » est tenable parce que le TOUCHER nomme '
           + 'le brachial (« ' + (titreBras ? titreBras.textContent : 'aucun titre')
           + ' ») — sans ça, il escamoterait le plus fort fléchisseur du coude');

      v.vrai(/Biceps brachial 3 \*/.test(txt),
             'le biceps crédité à la pronation porte une étoile');
      v.vrai(/Rond pronateur 3(?! \*)/.test(txt),
             'et le rond pronateur, qui vient bien du geste, n’en porte pas');
      v.vrai(/ne vient pas de ce mouvement/.test(txt),
             'et la légende dit ce que l’étoile veut dire');
      e.seances = gardees;
      fen.App.vues.suivi.rendre(vue);
      svg = doc.querySelector('.corps-regions');

      /* --- le selecteur de periode ---
         Une seule bande pour les trois blocs qui comptent une charge : un
         filtre par bloc laisserait l'ecran annoncer trois periodes a la
         fois. */
      var bts = doc.querySelectorAll('.periodes .periode-bt');
      v.egal(bts.length, fen.App.m.PERIODES_SUIVI.length,
             'une touche par période proposée');
      var actives = Array.prototype.filter.call(bts, function (b) {
        return b.getAttribute('aria-pressed') === 'true';
      });
      v.egal(actives.length, 1, 'une seule est active à la fois');
      var hauteurMini = Math.min.apply(null, Array.prototype.map.call(bts, function (b) {
        return b.getBoundingClientRect().height;
      }));
      v.vrai(hauteurMini >= 40, 'et chacune fait au moins 40 px de haut (mesuré : '
                              + Math.round(hauteurMini) + ')');

      /* Choisir « 1 sem. » doit changer CE QUI EST COMPTE, pas seulement
         l'etiquette : on mesure le nombre de barres de semaines. */
      function titreRegions() {
        var t = Array.prototype.filter.call(doc.querySelectorAll('.sous-titre'),
          function (x) { return x.textContent.indexOf('Régions — ') === 0; })[0];
        return t ? t.textContent : 'absent';
      }
      var avant = titreRegions();
      bts[0].dispatchEvent(new fen.MouseEvent('click', { bubbles: true }));
      v.vrai(titreRegions() !== avant,
             'choisir une période change le titre des Régions ('
           + avant + ' → ' + titreRegions() + ')');
      v.egal(fen.App.store.etat().reglages.periodeSuivi,
             fen.App.m.PERIODES_SUIVI[0].id,
             'et le choix est ÉCRIT dans les réglages, donc il survivra');
      /* Sous quatre semaines, « semaine apres semaine » n'a rien a dire :
         une ou deux barres mimeraient une tendance. */
      v.egal(doc.querySelectorAll('.piste-semaine').length, 0,
             'sur une semaine, aucune piste hebdomadaire n’est dessinée');
      /* Un LUNDI, « 1 sem. » ne couvre qu'un jour — les semaines sont ISO,
         et hier etait dans la precedente. L'ecran montre alors l'etat vide
         au lieu de la piste. Les deux cas sont justes ; ce qui doit tenir,
         c'est que l'ecran DISE quelque chose, et la BONNE chose. */
      var ditPourquoi = /pas de semaine après semaine/.test(doc.body.innerText);
      var ditLaPeriode = /Rien sur .*Tes régions sont renseignées/s
                           .test(doc.body.innerText);
      v.vrai(ditPourquoi || ditLaPeriode,
             'et l’écran DIT pourquoi, au lieu de laisser un trou');
      v.egal(/Ouvre la fiche d’un exercice pour les renseigner/
               .test(doc.body.innerText), false,
             'et il n’accuse JAMAIS des muscles déjà renseignés');

      /* On repose le defaut pour ne pas laisser l'etat aux blocs suivants. */
      var iDefaut = 0;
      fen.App.m.PERIODES_SUIVI.forEach(function (p, i) {
        if (p.id === '3m') iDefaut = i;
      });
      bts = doc.querySelectorAll('.periodes .periode-bt');
      bts[iDefaut].dispatchEvent(new fen.MouseEvent('click', { bubbles: true }));
      v.vrai(doc.querySelectorAll('.piste-semaine').length > 0,
             'et revenir à 3 mois les fait revenir');
      svg = doc.querySelector('.corps-regions');

      /* --- la place a 320 px --- */
      var debordants = [];
      Array.prototype.forEach.call(
        doc.querySelectorAll('.corps-regions, .table-regions, .piste-semaine'),
        function (n) {
          var r = n.getBoundingClientRect();
          if (r.right > LARGEUR + 0.5 || r.left < -0.5) {
            debordants.push(n.className.baseVal || n.className);
          }
        });
      v.egal(debordants.join(','), '',
             'rien ne sort de l’écran à 320 px — mesuré au bord droit, pas '
           + 'au scrollWidth, que « overflow-x: hidden » rend toujours vert');
      var mini = 999, nomMini = '', formeMini = null;
      Array.prototype.forEach.call(svg.querySelectorAll('.zone-region'), function (p) {
        var r = p.getBoundingClientRect();
        if (r.width < mini) {
          mini = r.width; nomMini = p.getAttribute('data-region'); formeMini = p;
        }
      });
      svg.scrollIntoView({ block: 'center' });
      var rm = formeMini.getBoundingClientRect();
      var cx = rm.left + rm.width / 2, cy = rm.top + rm.height / 2;
      var atteints = [-12, 12].filter(function (dx) {
        var el = doc.elementFromPoint(cx + dx, cy);
        var z = el && el.closest ? el.closest('[data-region]') : null;
        return z && z.getAttribute('data-region') === nomMini;
      }).length;
      v.egal(atteints, 2,
             'la plus petite region (' + nomMini + ', ' + Math.round(mini)
           + ' px de dessin) reste ATTEINTE a 12 px de part et d’autre : '
           + 'c’est la zone de prise qui tient la cible, pas le dessin');
      var prises = {};
      Array.prototype.forEach.call(svg.querySelectorAll('.prise-region'), function (p) {
        prises[p.getAttribute('data-region')] = true;
      });
      v.egal(duModele.filter(function (id) { return !prises[id]; }).join(','), '',
             'et chaque région en a une : sans prise, la forme reste '
           + 'intouchable quelle que soit sa taille');

      fen.App.ui.vider(vue);
      e.seances = [];
      return attendre(20);
    });
  });

  /* ================================================================
     12. La carte du bras

     Un dessin peut mentir sans qu'aucun test de modèle s'en aperçoive : un
     muscle sans région est invisible, une région sans muscle est un
     mensonge. On mesure la correspondance, pas l'esthétique.
     ================================================================ */

  bloc('Carte du bras', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();

    function jourIlYA(n) {
      var d = new Date();
      d.setDate(d.getDate() - n);
      var z = function (x) { return (x < 10 ? '0' : '') + x; };
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
    }
    function exo(nom, muscles, n) {
      var series = [];
      for (var i = 0; i < n; i++) {
        series.push({ id: 's' + nom + i, type: 'normale', repsCible: '', chargeCible: '',
                      dureeCible: '', chargeReel: '20', repsReel: '10', dureeReel: '',
                      rpe: null, faite: true, faiteA: null });
      }
      return { id: 'e' + nom, ordre: 0, nom: nom, slug: nom.toLowerCase(), aw: true,
               typeCharge: 'kg', colonnes: ['charge', 'reps'], cote: 'droit', prise: null,
               muscles: muscles, forces: [], structures: [], outils: [], consigne: '',
               reposSecondes: 90, series: series };
    }

    e.seances = [{ id: 'm1', type: 'muscu', date: jourIlYA(1), heure: jourIlYA(1) + 'T18:00:00.000Z',
                   programmeId: null, programmeNom: 'P', dureeMin: null, rpeGlobal: null,
                   note: '', douleurs: [],
                   exercices: [exo('A', ['fcu'], 9), exo('B', ['biceps'], 3),
                               exo('C', ['grand_pectoral'], 1),
                               exo('D', ['fcr', 'ecrb', 'ecrl'], 2)] }];
    fen.App.vues.suivi.rendre(vue);

    return attendre(150).then(function () {
      var carte = doc.querySelector('.planche-carte');
      v.vrai(!!carte, 'la carte est dessinée');
      if (!carte) return;

      /* --- l'ordre des sections ---
         Ce qui appelle une décision d'abord ; les recoupements à la fin.
         Un ordre d'écran est une décision, pas un hasard du code. */
      var titres = Array.prototype.map.call(vue.querySelectorAll('.sous-titre'),
        function (n) { return n.textContent; });
      function rang(mot) {
        for (var i = 0; i < titres.length; i++) if (titres[i].indexOf(mot) >= 0) return i;
        return -1;
      }
      v.vrai(rang('Dernière sollicitation') >= 0 && rang('Par structure') >= 0,
             '[temoin] les deux sections repères sont là');
      /* L'ORDRE A CHANGE le 28/10 — MB : « Dans Suivi >> Seances >>
         Derniere sollicitation, je veux qu'il soit apres Muscles ». Elle
         repond a « qu'est-ce que je peux refaire aujourd'hui », qui se pose
         APRES avoir vu ce qu'on travaille. */
      v.vrai(rang('Muscles') < rang('Dernière sollicitation'),
             '« Dernière sollicitation » vient APRÈS les muscles');
      v.vrai(rang('Volume') < rang('Muscles'), 'le volume avant les muscles');
      v.vrai(rang('Muscles') < rang('Par structure'),
             'et les muscles avant « Par structure »');
      v.vrai(rang('Par structure') < rang('Douleur'),
             '« Par structure » et « Douleurs » ferment la marche, dans cet ordre');
      v.egal(titres.length - 1, rang('Douleur'),
             'les douleurs sont la DERNIÈRE section (' + titres.length + ' sections)');

      /* --- l'illustration, et le glissement du doigt ---
         Chaque muscle a la sienne : le membre entier, lui seul en rouge.
         On les fait défiler au doigt, dans l'ordre des barres. */
      var img = carte.querySelector('img.planche-fond');
      v.vrai(!!img, 'une illustration est montrée');
      v.egal(carte.querySelectorAll('svg').length, 0,
             'et rien n’est posé dessus : l’image est le sujet, pas un fond');
      if (!img) return;

      v.egal(img.getAttribute('src'), fen.App.m.imageDuMuscle('fcu'),
             'on commence par le muscle le PLUS sollicité');
      v.vrai(carte.parentNode.textContent.indexOf('Fléchisseur ulnaire du carpe') >= 0,
             'et il est nommé dessous');
      v.vrai(carte.parentNode.textContent.indexOf('9 séries') >= 0, 'avec son compte');
      v.egal(carte.tagName, 'BUTTON', 'l’image s’ouvre d’un appui : c’est un BOUTON');

      var rang = carte.querySelector('.planche-rang');
      v.vrai(!!rang, 'un compteur dit où on en est');
      v.egal(rang.textContent, '1 / 6', 'au premier des six muscles sollicités');

      /* Le navigateur ne doit pas prendre le geste pour un défilement
         horizontal de la page : `touch-action: pan-y` lui laisse le
         vertical et nous garde l'horizontal. */
      v.vrai(fen.getComputedStyle(carte).touchAction.indexOf('pan-y') >= 0,
             'le geste horizontal nous revient, le défilement vertical reste au '
           + 'navigateur (mesuré : ' + fen.getComputedStyle(carte).touchAction + ')');

      function glisser(dx, dy) {
        var r = carte.getBoundingClientRect();
        var x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
        var opt = function (x, y) {
          return { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1 };
        };
        carte.dispatchEvent(new fen.PointerEvent('pointerdown', opt(x0, y0)));
        carte.dispatchEvent(new fen.PointerEvent('pointerup', opt(x0 + dx, y0 + dy)));
        carte.dispatchEvent(new fen.MouseEvent('click', { bubbles: true, cancelable: true }));
      }

      glisser(-90, 0);
      v.egal(rang.textContent, '2 / 6', 'glisser de droite à gauche passe au suivant');
      v.vrai(img.getAttribute('src') !== fen.App.m.imageDuMuscle('fcu'),
             'et l’image change');
      v.egal(doc.querySelectorAll('.panneau').length, 0,
             'un glissement n’OUVRE PAS l’image en grand : ce n’est pas un appui');

      glisser(90, 0);
      v.egal(rang.textContent, '1 / 6', 'glisser dans l’autre sens revient en arrière');

      glisser(-20, 0);
      v.egal(rang.textContent, '1 / 6',
             'un petit mouvement ne fait pas défiler : c’est un appui qui a tremblé');
      return attendre(120).then(function () {
        v.egal(doc.querySelectorAll('.panneau').length, 1,
               'il ouvre l’image en grand, lui');
        var f1 = doc.querySelector('.panneau .panneau-entete .bt-icone');
        if (f1) f1.click();
        return attendre(80);
      }).then(function () {
        glisser(-80, 120);
        v.egal(rang.textContent, '1 / 6',
               'un geste en diagonale ne fait pas défiler non plus : le doigt '
             + 'partait vers le bas, c’est la page qu’il voulait bouger');

        /* La boucle : au dernier, le geste suivant revient au premier. Un
           cul-de-sac donne l'impression que le geste ne marche plus. */
        glisser(-90, 0); glisser(-90, 0); glisser(-90, 0);
        glisser(-90, 0); glisser(-90, 0);
        v.egal(rang.textContent, '6 / 6', '[temoin] on est au dernier');
        glisser(-90, 0);
        v.egal(rang.textContent, '1 / 6', 'et au-delà du dernier, ça BOUCLE');

        /* Les flèches font la même chose : le glissement ne doit pas être le
           seul chemin. */
        carte.dispatchEvent(new fen.KeyboardEvent('keydown',
          { key: 'ArrowRight', bubbles: true, cancelable: true }));
        v.egal(rang.textContent, '2 / 6', 'la flèche droite défile aussi');
        carte.dispatchEvent(new fen.KeyboardEvent('keydown',
          { key: 'ArrowLeft', bubbles: true, cancelable: true }));
        v.egal(rang.textContent, '1 / 6', 'et la flèche gauche revient');

        v.vrai(carte.getBoundingClientRect().width <= LARGEUR,
               'la vignette tient dans la largeur');
        v.egal(debordements(doc, fen, LARGEUR).join(' · '), '',
               'et rien ne sort de l’écran ' + '— mesuré au BORD DROIT des éléments, pas au scrollWidth, que « overflow-x: hidden » rend toujours vert');

        return new Promise(function (ok) {
          if (img.complete) return ok();
          img.addEventListener('load', function () { ok(); });
          img.addEventListener('error', function () { ok(); });
          fen.setTimeout(ok, 3000);
        }).then(function () {
          v.vrai(img.naturalWidth > 0, 'et l’image se charge pour de bon ('
               + img.naturalWidth + ' × ' + img.naturalHeight + ')');
          var fichiers = fen.App.m.MUSCLES.filter(function (m) { return m.image; })
                            .map(function (m) { return m.image; });
          v.egal(fichiers.length, fen.App.m.MUSCLES.length,
                 'les vingt-deux muscles ont leur illustration');
          return Promise.all(fichiers.map(function (f) {
            return fen.fetch(f).then(function (r) { return r.ok ? null : f; },
                                     function () { return f; });
          })).then(function (ratees) {
            v.egal(ratees.filter(Boolean).join(', '), '',
                   'et les ' + fichiers.length + ' existent vraiment dans le dépôt');
          });
        });
      }).then(function () {
        /* Un panneau resté ouvert ferait échouer le bloc SUIVANT, et on
           chercherait le défaut au mauvais endroit. */
        var reste = doc.querySelector('.panneau .panneau-entete .bt-icone');
        if (reste) reste.click();
        return attendre(80);
      }).then(function () {
        /* --- les barres, et le chemin vers la planche en grand --- */
        var noms = doc.querySelectorAll('.barres-muscles .barre-nom');
        v.vrai(noms.length >= 3, 'chaque barre porte un libellé');
        var inertes = Array.prototype.filter.call(noms, function (n) {
          return n.tagName !== 'BUTTON';
        }).map(function (n) { return n.textContent; });
        v.egal(inertes.join(', '), '', 'et c’est un BOUTON, pas un texte qui fait semblant');

        var coupes = Array.prototype.filter.call(
          doc.querySelectorAll('.barres-muscles .barre > :first-child'), function (n) {
            return n.scrollWidth > n.clientWidth + 1;
          }).map(function (n) { return n.textContent; });
        v.egal(coupes.join(', '), '',
               'aucun nom de muscle coupé — c’est à ça que servent les noms courts');

        var pm = Array.prototype.map.call(doc.querySelectorAll('.barres-muscles .barre-piste'),
          function (n) {
            var r = n.getBoundingClientRect();
            return Math.round(r.left) + '/' + Math.round(r.width);
          });
        v.egal(pm.filter(function (x) { return x !== pm[0]; }).length, 0,
               'toutes les pistes commencent au même endroit et font la même longueur');
        v.vrai(parseInt(pm[0].split('/')[1], 10) >= 70,
               'et il en reste de quoi comparer (' + pm[0].split('/')[1] + ' px)');

        noms[0].click();
        return attendre(140);
      }).then(function () {
        var pan = doc.querySelector('.panneau');
        v.vrai(!!pan, 'le libellé d’une barre ouvre la planche en grand');
        if (pan) {
          v.vrai(pan.querySelector('img.planche'), 'avec l’image');
          v.vrai(pan.textContent.indexOf('Gray') >= 0 && pan.textContent.indexOf('1918') >= 0,
                 'et la source : Gray, 1918, domaine public');
          var fermer = pan.querySelector('.panneau-entete .bt-icone');
          if (fermer) fermer.click();
        }
        return attendre(80);
      }).then(function () {
        /* Ce que tu mobilises : par articulation. */
        var lignes = doc.querySelectorAll('.barres-art .barre');
        v.egal(lignes.length, fen.App.m.ARTICULATIONS.length,
               'chaque articulation a sa barre, zéro compris');
        v.vrai(doc.querySelector('.barres-art').textContent
                  .indexOf('Rotation de l’avant-bras') >= 0,
               'et porte un nom lisible, pas un identifiant');

        fen.App.ui.vider(vue);
        e.seances = [];
        return attendre(20);
      });
    });
  });

  /* ================================================================
     11. La question du lendemain, à 320 px

     Même défaut que le libellé du chrono : un nom en ligne avec un bouton de
     taille fixe se réduit à « Coude m… ». On mesure la place réelle.
     ================================================================ */

  bloc('Question du lendemain à 320 px', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();

    function jourIlYA(n) {
      var d = new Date();
      d.setDate(d.getDate() - n);
      var z = function (x) { return (x < 10 ? '0' : '') + x; };
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
    }

    e.seances = [{ id: 'd1', type: 'muscu', date: jourIlYA(1), heure: jourIlYA(1) + 'T18:00:00.000Z',
                   programmeId: null, programmeNom: 'P', dureeMin: null, rpeGlobal: null,
                   note: '', exercices: [],
                   douleurs: [{ zone: 'coude_medial', intensite: 5, cote: 'droit' }] }];
    e.releves = [];
    fen.App.vues.suivi.rendre(vue);

    return attendre(120).then(function () {
      var ligne = doc.querySelector('.h24-ligne');
      v.vrai(!!ligne, 'la question du lendemain est posée');
      if (!ligne) return;

      var nom = ligne.querySelector('.h24-quoi b');
      v.egal(nom.textContent, 'Coude médial D', 'avec la zone ET le côté');
      v.vrai(nom.scrollWidth <= nom.clientWidth + 1,
             'et le nom n’est pas tronqué (place : ' + Math.round(nom.getBoundingClientRect().width)
           + ' px, il en demande ' + nom.scrollWidth + ')');

      var bt = ligne.querySelector('button');
      v.vrai(!!bt, 'un bouton permet de répondre');
      v.vrai(bt.getBoundingClientRect().height >= 44,
             'et il fait 44 px (mesuré : ' + Math.round(bt.getBoundingClientRect().height) + ')');
      v.egal(debordements(doc, fen, LARGEUR).join(' · '), '',
             'rien ne sort de l’écran à 320 px ' + '— mesuré au BORD DROIT des éléments, pas au scrollWidth, que « overflow-x: hidden » rend toujours vert');

      /* Répondre doit écrire un relevé et faire disparaître la question. */
      bt.click();
      return attendre(120).then(function () {
        var popo = doc.querySelector('.popo');
        v.vrai(!!popo, 'la feuille d’intensité s’ouvre');
        var trois = null;
        Array.prototype.forEach.call(popo.querySelectorAll('.echelon'), function (b) {
          if (b.textContent === '3') trois = b;
        });
        trois.click();

        return attendre(150).then(function () {
          v.egal(fen.App.store.etat().releves.length, 1, 'répondre pose un relevé');
          v.egal(fen.App.store.etat().releves[0].intensite, 3, 'avec la valeur choisie');
          v.egal(fen.App.m.questions24h(fen.App.store.etat()).length, 0,
                 'et la question ne se repose pas');

          var apres = doc.querySelector('.h24-ligne .delai');
          v.vrai(!!apres, 'l’écart s’affiche à la place');
          v.vrai(apres.textContent.indexOf('redescend') >= 0,
                 'et il est NOMMÉ : « ' + apres.textContent +' »');

          fen.App.ui.vider(vue);
          e.seances = [];
          e.releves = [];
          return attendre(20);
        });
      });
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

  /* ================================================================
     Le réglage de l'outil, à l'écran

     Le même Titan Grip, mousqueton dehors ou dedans, ne charge pas la même
     chose. La rangée ne doit apparaître QUE si l'outil retenu a des réglages
     déclarés : une case vide de plus serait une case de plus à ignorer.
     ================================================================ */
  bloc('Réglage de l’outil', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var e = fen.App.store.etat();

    fen.App.m.majCatalogueOutils(e, 'Titan Grip', 'Poignées AW');
    fen.App.m.majCatalogueOutils(e, 'Dumbbell', 'Barres');
    fen.App.m.majReglageOutil(e, 'Titan Grip', 'Mousqueton dehors', ['ecrl', 'ecrb', 'ecu']);
    fen.App.m.majReglageOutil(e, 'Titan Grip', 'Mousqueton dedans', ['fcu', 'fcr']);

    /* Un nom NEUTRE : « Pronation » contient un mot-muscle, et la source
       deviendrait « mixte » — on mesurerait alors autre chose que le réglage. */
    var brouillon = fen.App.m.exerciceProgramme({ nom: 'Essai A', outils: ['Dumbbell'] });
    fen.App.panneau.editerExercice(brouillon, { titre: 'Essai' }, function () {});

    function groupeDe(pan, libelle) {
      var l = pan.querySelectorAll('.groupe > label');
      for (var i = 0; i < l.length; i++) {
        if (l[i].textContent === libelle) return l[i].parentNode;
      }
      return null;
    }

    return attendre(140).then(function () {
      var pan = doc.querySelector('.panneau');
      v.vrai(!!pan, 'la fiche s’ouvre');
      if (!pan) return;

      var gr = groupeDe(pan, 'Réglage de l’outil');
      v.vrai(!!gr, 'le groupe existe dans la fiche');

      /* La version d'avant se CACHAIT quand aucun outil n'avait de réglage :
         impossible de distinguer « cet outil n'en a pas » de « la fonction ne
         marche pas ». C'est la question remontée du téléphone, et elle a
         coûté un aller-retour. Elle parle maintenant. */
      v.vrai(gr && gr.getBoundingClientRect().height > 0,
             'un outil sans réglage ne se tait PAS : le groupe reste visible');
      v.vrai(gr && gr.textContent.indexOf('Pas encore de réglage') >= 0,
             'et il dit pourquoi la rangée est vide');
      /* MB, 28/10 : « si un des equipements selectionnes a des
         specificites a selectionner par la suite, je dois pouvoir le
         rajouter dans l'exo directement, ce qui n'est pas le cas ». La
         ligne disait « Declare-les sur l'outil, dans Reglages ->
         Equipement » — une impasse polie. Elle porte un BOUTON. */
      var btReg = gr && Array.prototype.filter.call(gr.querySelectorAll('button'),
        function (b) { return b.textContent.indexOf('+ Réglage') === 0; })[0];
      v.vrai(!!btReg,
             'et il offre de poser un réglage SANS quitter l’exercice — '
           + 'un renvoi vers un autre écran est une impasse polie');
      v.egal(gr ? gr.querySelectorAll('.puce').length : -1, 0,
             'sans proposer une seule puce : il n’y a rien à choisir');

      /* On ajoute l'outil qui en a : la rangée doit apparaître seule. */
      brouillon.outils = ['Dumbbell', 'Titan Grip'];
      var fermer1 = pan.querySelector('.panneau-entete .bt-icone');
      if (fermer1) fermer1.click();
      return attendre(80);
    }).then(function () {
      fen.App.panneau.editerExercice(brouillon, { titre: 'Essai' }, function () {});
      return attendre(140);
    }).then(function () {
      var pan = doc.querySelector('.panneau');
      var gr = groupeDe(pan, 'Réglage de l’outil');
      v.vrai(gr && gr.getBoundingClientRect().height > 0
                && gr.querySelectorAll('.puce').length === 3,
             'avec un outil réglable, la rangée apparaît — avec ses puces, '
           + 'pas seulement son libellé');
      if (!gr) return;

      v.vrai(gr.textContent.indexOf('Titan Grip') >= 0,
             'elle dit DE QUEL OUTIL il s’agit — un exercice peut en porter plusieurs');
      v.vrai(gr.textContent.indexOf('Dumbbell') >= 0,
             'et nomme AUSSI celui qui n’en a pas, plutôt que de l’ignorer');
      v.vrai(gr.textContent.indexOf('Pas encore de réglage') >= 0,
             'en disant lequel des deux est dans ce cas');

      var puces = gr.querySelectorAll('.puce');
      var noms = Array.prototype.map.call(puces, function (p) { return p.textContent; });
      v.egal(noms.join(' | '), 'Aucun | Mousqueton dehors | Mousqueton dedans',
             '« Aucun » d’abord : ne rien régler reste un choix, pas un oubli');

      var choisies = Array.prototype.filter.call(puces, function (p) {
        return p.getAttribute('aria-pressed') === 'true';
      });
      v.egal(choisies.length, 1, 'une seule est retenue à la fois');
      v.egal(choisies[0].textContent, 'Aucun', 'et au départ c’est « Aucun »');

      var minH = 999, sort = 0;
      Array.prototype.forEach.call(puces, function (p) {
        var r = p.getBoundingClientRect();
        minH = Math.min(minH, r.height);
        if (r.right > LARGEUR + 1) sort += 1;
      });
      v.vrai(minH >= 44, 'chaque puce se touche (mesuré : ' + Math.round(minH) + ' px)');
      v.egal(sort, 0, 'et aucune ne sort de l’écran à 320 px');

      puces[1].click();
      v.egal(fen.App.m.reglageDe(brouillon, 'Titan Grip'), 'Mousqueton dehors',
             'appuyer retient le réglage');
      v.egal(puces[1].getAttribute('aria-pressed'), 'true', 'la puce le montre');
      v.egal(puces[0].getAttribute('aria-pressed'), 'false', 'et « Aucun » se relâche');

      /* LE REGLAGE COCHE SES MUSCLES, il ne les PROPOSE plus — MB, 28/10 :
         « je clique sur un, ca influence mon exo et les muscles tout
         simplement ». C'est le meme geste qu'un mouvement, qui coche depuis
         le 26/10. Il n'y a donc plus rien a proposer : le bouton disparait
         parce qu'il n'a plus de travail, et c'est ce qu'on mesure. */
      var dejaCoches = (brouillon.muscles || []).length;
      v.vrai(dejaCoches > 0,
             'poser un réglage COCHE ses muscles, directement ('
           + dejaCoches + ')');
      var bt = null;
      Array.prototype.forEach.call(pan.querySelectorAll('button'), function (b) {
        if (b.textContent.indexOf('Proposer d’après') === 0) bt = b;
      });
      if (bt) {
        v.vrai(bt.textContent.indexOf('le réglage de l’outil') >= 0,
               'et dit D’OÙ ça vient : du réglage, pas de l’anatomie ('
             + bt.textContent + ')');
        bt.click();
        v.vrai(fen.App.m.muscles(brouillon).indexOf('ecu') >= 0,
               'la proposition coche bien les muscles du réglage');
      }

      puces[0].click();
      v.egal(fen.App.m.reglageDe(brouillon, 'Titan Grip'), null,
             '« Aucun » retire le réglage — on peut revenir en arrière');

      var corps = pan.querySelector('.panneau-corps');
      v.vrai(corps.scrollWidth <= corps.clientWidth + 1,
             'aucun débordement horizontal à 320 px');

      var fermer = pan.querySelector('.panneau-entete .bt-icone');
      if (fermer) fermer.click();
      return attendre(80);
    }).then(function () {
      /* --- la panne silencieuse de ce dessin ---
         Les réglages sont rangés par NOM d'outil. « Titan Grip » et
         « TitanGrip » sont donc deux outils, et une espace suffit à
         déclarer un réglage sur l'un pendant que l'exercice porte l'autre.
         L'app ne les fusionne pas — renommer du matériel dans le dos de qui
         l'a saisi serait pire — mais elle doit le dire. */
      fen.App.m.majCatalogueOutils(e, 'TitanGrip', 'Poignées AW');
      v.vrai(!!fen.App.m.trouverOutil(e, fen.App.m.slug('TitanGrip')),
             '[temoin] « TitanGrip » est bien une SECONDE entrée du catalogue');
      var jumeau = fen.App.m.exerciceProgramme({ nom: 'Essai C',
                                                 outils: ['TitanGrip'] });
      fen.App.panneau.editerExercice(jumeau, { titre: 'Essai' }, function () {});
      return attendre(160);
    }).then(function () {
      var pan = doc.querySelector('.panneau');
      var gr = groupeDe(pan, 'Réglage de l’outil');
      v.vrai(gr && gr.textContent.indexOf('Pas de réglage') >= 0,
             'un outil jumeau n’a pas les réglages de son voisin');
      v.vrai(gr && gr.textContent.indexOf('« Titan Grip » en a') >= 0,
             'et l’app DIT lequel les porte, au lieu de laisser chercher');

      var fermer2 = pan.querySelector('.panneau-entete .bt-icone');
      if (fermer2) fermer2.click();
      return attendre(80).then(function () {
        e.outils = [];
        e.exercices = [];
      });
    });
  });

  /* ================================================================
     « Où ça tire ? », et l'équipement atteignable au doigt

     Les noms latins ne parlent pas à tout le monde, et une case qu'on ne
     sait pas cocher reste vide.
     ================================================================ */
  bloc('Où ça tire, à l’écran', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var brouillon = fen.App.m.exerciceProgramme({ nom: 'Essai B' });
    fen.App.panneau.editerExercice(brouillon, { titre: 'Essai' }, function () {});

    return attendre(140).then(function () {
      var pan = doc.querySelector('.panneau');
      v.vrai(!!pan, 'la fiche s’ouvre');
      if (!pan) return;

      var bloc2 = pan.querySelector('.ouca');
      v.vrai(!!bloc2, 'le raccourci « Par zone du corps » est là');
      v.vrai(bloc2.querySelector('button').textContent.indexOf('Par zone du corps') === 0,
             'et il annonce la MÉTHODE — désigner un endroit, pas un nom latin — '
           + 'sans rien supposer de celui qui appuie');
      if (!bloc2) return;

      var corps = bloc2.querySelector('.ouca-corps');
      v.egal(corps.getBoundingClientRect().height, 0,
             'et il est REPLIÉ au départ : qui connaît les noms n’a rien à lire');

      var entete = bloc2.querySelector('button');
      entete.click();
      return attendre(60).then(function () {
        v.vrai(corps.getBoundingClientRect().height > 0, 'un appui le déplie');
        var lignes = corps.querySelectorAll('.ouca-ligne');
        v.egal(lignes.length, fen.App.m.ZONES_RESSENTIES.length,
               'une ligne par zone ressentie');

        var pasBoutons = Array.prototype.filter.call(lignes, function (n) {
          return n.tagName !== 'BUTTON';
        }).length;
        v.egal(pasBoutons, 0, 'et ce sont des boutons');

        var minH = 999, sort = 0, coupes = 0;
        Array.prototype.forEach.call(lignes, function (n) {
          var r = n.getBoundingClientRect();
          minH = Math.min(minH, r.height);
          if (r.right > LARGEUR + 1) sort += 1;
          if (n.scrollWidth > n.clientWidth + 1) coupes += 1;
        });
        v.vrai(minH >= 44, 'chacune se touche (mesuré : ' + Math.round(minH) + ' px)');
        v.egal(sort, 0, 'aucune ne sort de l’écran à 320 px');
        v.egal(coupes, 0, 'et aucune n’est tronquée');

        v.vrai(corps.textContent.indexOf('côté dos de la main') >= 0,
               'l’explication situe la zone sans jargon…');
        v.egal(corps.textContent.indexOf('poilue'), -1,
               '…et sans parler à l’utilisateur comme à un enfant : ne pas '
             + 'connaître un vocabulaire n’est pas ne rien comprendre');
        v.vrai(corps.textContent.indexOf('le curl, sous toutes ses formes') >= 0,
               'et nomme l’exercice courant quand il y en a un — « plier le '
             + 'coude », c’est le curl');

        /* Appuyer COCHE, et n'écrit rien d'autre. */
        var cible = null;
        Array.prototype.forEach.call(lignes, function (n) {
          if (n.textContent.indexOf('Le bord du petit doigt') === 0) cible = n;
        });
        v.vrai(!!cible, 'on retrouve « Le bord du petit doigt »');
        if (!cible) return;
        cible.click();
        var l = fen.App.m.muscles(brouillon);
        v.egal(l.join(','), 'fcu,ecu,extenseur_petit_doigt',
               'un appui coche les muscles de la zone, dans l’ordre du tableau');

        /* Deux zones s'ajoutent, elles ne se remplacent pas : sinon le second
           appui effacerait le premier sans prévenir. */
        var autre = null;
        Array.prototype.forEach.call(lignes, function (n) {
          if (n.textContent.indexOf('La main qui serre') === 0) autre = n;
        });
        autre.click();
        var l2 = fen.App.m.muscles(brouillon);
        v.vrai(l2.indexOf('fcu') >= 0 && l2.indexOf('flechisseurs_doigts') >= 0,
               'une seconde zone S’AJOUTE, elle ne remplace pas la première');

        /* La liste des muscles doit suivre : cocher sans le voir ne vaut rien. */
        var presses = pan.querySelectorAll('.muscle-ligne[aria-pressed="true"]');
        v.egal(presses.length, l2.length,
               'et la liste en dessous le MONTRE, case cochée');

        /* --- une zone cochée le DIT, et se décoche ---

           Elle ne le disait pas : rien ne restait allumé, et un second appui
           ne retirait rien. MB l'a signalé en croyant qu'on ne pouvait pas en
           cocher plusieurs — on pouvait, mais l'écran ne le montrait pas. */
        v.egal(cible.getAttribute('aria-pressed'), 'true',
               'une zone cochée le DIT — sans ça on ne sait pas ce qu’on a pris');
        v.egal(autre.getAttribute('aria-pressed'), 'true',
               'et deux zones peuvent l’être en même temps');

        /* Un muscle coché À LA MAIN ne part jamais. Le piège : il faut
           qu'il APPARTIENNE à la zone qu'on cochera ensuite, sinon aucune
           zone ne peut l'emporter et le contrôle ne mesure rien. L'anconé
           appartient à « Le dessus de l'avant-bras », qu'on coche juste
           après — c'est ce cas-là qui faisait adopter le muscle par la
           zone, puis l'emportait au décochage. */
        var aMain = null;
        Array.prototype.forEach.call(pan.querySelectorAll('.muscle-ligne'), function (n) {
          var b2 = n.querySelector('b');
          if (b2 && b2.textContent === 'Anconé') aMain = n;
        });
        v.vrai(!!aMain, 'on retrouve l’anconé dans la liste');
        aMain.click();
        v.vrai(fen.App.m.muscles(brouillon).indexOf('ancone') >= 0,
               'et il est coché à la main, avant toute zone');

        /* Il FAUT deux zones qui se RECOUVRENT, sinon le contrôle ne mesure
           rien : « le bord du petit doigt » et « la main qui serre » n'ont
           aucun muscle commun, et la sémantique du premier-qui-pose donnerait
           le même résultat que l'union. Ce contrôle a d'abord été écrit comme
           ça, et il refusait de tomber.

           « Le dessus de l'avant-bras » partage l'extenseur ulnaire ET
           l'extenseur du petit doigt avec « le bord du petit doigt ». */
        var dessus = null;
        Array.prototype.forEach.call(lignes, function (n) {
          if (n.textContent.indexOf('Le dessus de l’avant-bras') === 0) dessus = n;
        });
        v.vrai(!!dessus, 'on retrouve « Le dessus de l’avant-bras »');
        dessus.click();
        var partage = fen.App.m.muscles(brouillon);
        v.vrai(partage.indexOf('ecu') >= 0 && partage.indexOf('extenseur_petit_doigt') >= 0,
               'les deux zones se recouvrent bien sur l’extenseur ulnaire et '
             + 'celui du petit doigt');

        cible.click();
        var l3 = fen.App.m.muscles(brouillon);
        v.egal(cible.getAttribute('aria-pressed'), 'false', 'décocher le DIT aussi');
        v.egal(l3.indexOf('fcu'), -1,
               'décocher retire ce que CETTE zone était seule à réclamer');
        v.vrai(l3.indexOf('ecu') >= 0 && l3.indexOf('extenseur_petit_doigt') >= 0,
               'mais PAS ce qu’une autre zone cochée réclame encore — c’est '
             + 'une union, pas un premier arrivé premier servi');
        v.vrai(l3.indexOf('flechisseurs_doigts') >= 0,
               'ni ce qu’une zone sans recouvrement avait posé');
        v.vrai(l3.indexOf('ancone') >= 0,
               'et JAMAIS ce qui a été coché à la main, MÊME quand la zone le '
             + 'contient : une zone n’ADOPTE pas ce qu’elle n’a pas posé');
        /* On décoche aussi « Le dessus », qui contient l'anconé : il doit
           survivre aux deux décochages. */
        dessus.click();
        var l4 = fen.App.m.muscles(brouillon);
        v.vrai(l4.indexOf('ancone') >= 0,
               'il survit même quand la zone qui le contient est décochée');

        var corpsPan = pan.querySelector('.panneau-corps');
        v.vrai(corpsPan.scrollWidth <= corpsPan.clientWidth + 1,
               'aucun débordement horizontal à 320 px');

        var fermer = pan.querySelector('.panneau-entete .bt-icone');
        if (fermer) fermer.click();
        return attendre(80);
      });
    });
  });

  /* ================================================================
     Envoyer un retour, a 320 px

     Deux choses que le modele ne peut pas voir : le bloc technique est-il
     VISIBLE — sa hauteur reelle, pas son attribut `hidden`, qui a deja ete
     battu ici par un `display: flex` — et les deux boutons tiennent-ils a
     44 px sans deborder.
     ================================================================ */
  bloc('Envoyer un retour, à 320 px', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    fen.App.vues.reglages.rendre(vue);

    return attendre(200).then(function () {
      v.vrai(vue.textContent.indexOf('Envoyer un retour') >= 0,
             'la section est là');
      /* L'ORDRE de l'écran est une décision, pas un hasard du code —
         « Ajouter un outil » doit tomber sous le pouce tout de suite, parce
         qu'on ajoute un outil bien plus souvent qu'on n'exporte un carnet.
         Un contrôle le tient, comme pour l'onglet Suivi. */
      var titres = [];
      Array.prototype.forEach.call(vue.children, function (n) {
        if (n.classList && n.classList.contains('sous-titre')) titres.push(n.textContent);
      });
      v.egal(titres.join(' · '),
             'Thème · En salle · Exercices connus · Équipement · Sauvegarde · '
           + 'État du stockage · Envoyer un retour · Tout effacer',
             'l’ordre des Réglages : le catalogue puis l’équipement, tout en haut');

      /* 7. Le bloc technique est VISIBLE EN ENTIER. On mesure sa HAUTEUR
         reelle : un bloc a zero pixel ne se lit pas, et on ne peut pas
         consentir a envoyer ce qu'on ne lit pas. */
      var pre = vue.querySelector('.retour-contexte');
      v.vrai(!!pre, 'le bloc technique est dans la page');
      var r = pre ? pre.getBoundingClientRect() : { height: 0, width: 0 };
      v.vrai(r.height > 40,
             'il est VISIBLE, pas replié (hauteur mesurée : ' + Math.round(r.height) + ' px)');
      v.vrai((pre ? pre.textContent : '').indexOf('- Version : ') >= 0,
             'et on y lit la version');

      /* Il ne deborde pas : l'agent utilisateur est long et sans espace. */
      v.vrai(r.width <= 320, 'il tient dans les 320 px (' + Math.round(r.width) + ')');
      v.egal(debordements(doc, fen, LARGEUR).join(' · '), '',
             'et rien ne sort de l’écran ' + '— mesuré au BORD DROIT des éléments, pas au scrollWidth, que « overflow-x: hidden » rend toujours vert');

      /* 8. Les deux boutons se touchent : 44 px, et pleine largeur. */
      var bts = [];
      Array.prototype.forEach.call(vue.querySelectorAll('button'), function (b) {
        var x = b.textContent.trim();
        if (x === 'Copier' || x === 'Ouvrir un ticket GitHub') bts.push(b);
      });
      v.egal(bts.length, 2, 'les deux boutons sont là : copier, et ouvrir un ticket');

      /* --- LA GARDE DU CHAMP VIDE, A L'ECRAN ---
         `texteRetour('')` rend deja `null`, et le banc du modele le garde
         depuis le debut. Mais rien ne prouvait que l'ECRAN en tienne compte :
         c'est le piege n° 5 — une moitie mesuree, l'autre non. On espionne
         donc ce qui PART : le toast, et l'ouverture d'onglet. */
      var champ = doc.querySelector('.champ-retour');
      v.vrai(!!champ, '[temoin] le champ de saisie est trouvable');
      var copier = null, ticket = null;
      Array.prototype.forEach.call(bts, function (b) {
        if (b.textContent === 'Copier') copier = b; else ticket = b;
      });
      v.vrai(!!copier && !!ticket, '[temoin] les deux boutons sont distingues');

      var toasts = [], ouverts = [], copies = [];
      var vraiToast = fen.App.ui.toast;
      var vraiOpen = fen.open;
      fen.App.ui.toast = function (m) { toasts.push(String(m)); };
      fen.open = function (u) { ouverts.push(String(u)); return null; };
      /* On espionne CE QUI PART dans le presse-papier, pas un chemin de
         secours : sans garde, `copierTexte(null)` y ecrit « null ». */
      var presse = fen.navigator.clipboard, vraiEcrire = null;
      if (presse && presse.writeText) {
        vraiEcrire = presse.writeText;
        presse.writeText = function (t) {
          copies.push(String(t));
          return new Promise(function () {});   /* on n'enchaine pas */
        };
      }

      function refus(t) { return /Écris d’abord/.test(t); }

      /* --- a vide : rien ne part --- */
      if (champ) champ.value = '';
      if (copier) copier.click();
      v.egal(toasts.filter(refus).length, 1,
             'champ vide, « Copier » refuse et le DIT');
      v.egal(copies.length, 0,
             'et RIEN n’est écrit dans le presse-papier (sans garde, il y '
           + 'recevrait « null »)');
      v.egal(doc.querySelectorAll('.retour-secours').length, 0,
             'ni préparé à la copie à la main');
      if (ticket) ticket.click();
      v.egal(toasts.filter(refus).length, 2,
             'champ vide, « Ouvrir un ticket » refuse aussi');
      v.egal(ouverts.length, 0,
             'et AUCUN onglet ne s’ouvre — c’est le seul endroit de l’app qui '
           + 'mène dehors');

      /* --- des espaces, ce n'est pas un retour --- */
      toasts.length = 0;
      if (champ) champ.value = '   \n  ';
      if (copier) copier.click();
      v.egal(toasts.filter(refus).length, 1,
             'des espaces seuls sont refusés comme un champ vide');
      v.egal(copies.length, 0, 'et le presse-papier reste intact');

      /* --- avec du texte : ca part --- */
      toasts.length = 0;
      if (champ) champ.value = 'le chrono reste affiché';
      if (ticket) ticket.click();
      v.egal(toasts.filter(refus).length, 0,
             'avec du texte, plus aucun refus');
      v.egal(ouverts.length, 1, 'et l’onglet s’ouvre, une fois');
      v.vrai(/github\.com/.test(ouverts[0] || ''),
             'sur github.com, avec le retour déjà écrit dedans');
      v.vrai(/chrono/.test(decodeURIComponent(ouverts[0] || '')),
             'et ce qu’on a tapé y est : ' + (ouverts[0] || 'aucun lien'));

      /* --- et la copie, avec du texte, emporte bien ce qu'on a tape --- */
      if (copier) copier.click();
      v.egal(copies.length, 1, 'avec du texte, « Copier » écrit une fois');
      v.vrai(/chrono/.test(copies[0] || ''),
             'et ce qu’on a tapé y est');
      v.vrai(/aucune donnée d’entraînement/.test(copies[0] || ''),
             'avec le bloc technique, qui ne porte aucune donnée d’entraînement');

      fen.App.ui.toast = vraiToast;
      fen.open = vraiOpen;
      if (vraiEcrire) presse.writeText = vraiEcrire;
      if (champ) champ.value = '';
      var petits = bts.filter(function (b) {
        return b.getBoundingClientRect().height < 44;
      }).map(function (b) { return b.textContent.trim(); });
      v.egal(petits.join(', '), '', 'chacun fait au moins 44 px de haut');
      var deborde = bts.filter(function (b) {
        return b.getBoundingClientRect().width > 320;
      }).length;
      v.egal(deborde, 0, 'et aucun ne déborde en largeur');

      /* Un retour vide ne part pas : l'ecran le DIT au lieu d'ouvrir un
         ticket que personne ne pourra traiter. */
      var champ = vue.querySelector('.champ-retour');
      v.vrai(!!champ, 'la zone de texte est là');
      if (champ) champ.value = '';
      if (bts[0]) bts[0].click();
      return attendre(120).then(function () {
        var t = doc.body.textContent;
        v.vrai(t.indexOf('Écris d’abord') >= 0,
               'appuyer avec un retour vide le DIT, au lieu de ne rien faire');
        fen.App.ui.vider(vue);
      });
    });
  });

  /* ================================================================
     Les Reglages se replient

     Demande de MB, « par souci de visibilite » : le catalogue d'exercices et
     chaque categorie d'outils doivent pouvoir se reduire et s'agrandir.

     Ce que le modele ne peut pas voir : la HAUTEUR REELLE du bloc replie. Un
     `hidden` se fait battre par un `display`, et ca s'est deja paye ici sur
     le filtre de l'equipement — on mesure donc le rectangle.
     ================================================================ */
  bloc('Les Réglages se replient', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.exercices.length = 0;
    e.outils.length = 0;
    ['Curl marteau', 'Wrist curl', 'Pronation Titan Grip'].forEach(function (n) {
      fen.App.m.majCatalogue(e, { nom: n });
    });
    fen.App.m.majCatalogueOutils(e, 'Poulie basse', 'Poulies');
    fen.App.m.majCatalogueOutils(e, 'Titan Grip', 'Poignées AW');
    fen.App.vues.reglages.rendre(vue);

    return attendre(200).then(function () {
      var entetes = Array.prototype.slice.call(vue.querySelectorAll('.equip-cat'));
      var corps = Array.prototype.slice.call(vue.querySelectorAll('.reglages-repli'));
      v.egal(entetes.length, 3,
             'le catalogue et les deux catégories d’outils ont leur en-tête');
      v.egal(corps.length, 3, 'et leur bloc repliable');

      var ouverts = corps.filter(function (c) {
        return c.getBoundingClientRect().height > 0;
      }).length;
      v.egal(ouverts, 0, 'tous sont REPLIÉS au départ : c’est ce qui rend l’écran lisible');

      /* Le compte reste lisible FERMÉ — sans lui, replier serait cacher. */
      var comptes = entetes.map(function (b) {
        var c = b.querySelector('.equip-compte');
        return c ? c.textContent : '';
      });
      /* 1 ET NON 3 DEPUIS LE 28/10 : des trois graines, « Curl marteau »
         et « Wrist curl » sont au DICTIONNAIRE et ne se listent plus — MB :
         « seuls mes exos crees de ma main doivent etre visibles ». Seul
         « Pronation Titan Grip » est a lui. Ce controle mesure donc deux
         choses a la fois : que le compte se lit FERME, et qu'il ne compte
         que les siens. */
      v.egal(comptes.join(','), '1,1,1',
             'le compte se lit sans ouvrir, et il ne compte que les SIENS : '
           + 'deux des trois graines sont au dictionnaire');

      var petits = entetes.filter(function (b) {
        return b.getBoundingClientRect().height < 44;
      }).length;
      v.egal(petits, 0, 'chaque en-tête fait au moins 44 px');

      entetes[0].click();
      return attendre(120).then(function () {
        v.vrai(corps[0].getBoundingClientRect().height > 0,
               'un appui OUVRE le bloc (hauteur mesurée)');
        v.egal(entetes[0].getAttribute('aria-expanded'), 'true',
               'et il le dit aux lecteurs d’écran');
        v.egal(corps[1].getBoundingClientRect().height, 0,
               'ouvrir l’un n’ouvre pas les autres');
        entetes[0].click();
        return attendre(120).then(function () {
          v.egal(corps[0].getBoundingClientRect().height, 0,
                 'un second appui le REFERME');
          fen.App.ui.vider(vue);
          e.exercices.length = 0;
          e.outils.length = 0;
        });
      });
    });
  });

  /* ================================================================
     Mon équipement, dans Réglages

     Une ligne qui s'ouvre doit être un bouton : atteignable au clavier,
     annoncée aux lecteurs d'écran, et touchable à 44 px. Elle était un div
     avec un curseur.
     ================================================================ */
  /* ---------------------------------------------------------------
     LE CATALOGUE NE MONTRE QUE CE QUI EST A LUI

     MB, 28/10 : « ce qui me gene c'est la surcharge d'informations […] a
     partir du moment ou l'exo est dans le dico, pourquoi le ravoir en
     visuel dans reglages ? » puis « seuls mes exos crees de ma main doivent
     etre visibles ».

     Les noms du dictionnaire restent MEMORISES — ils pre-remplissent le
     prochain exercice du meme nom — mais ils ne sont plus AFFICHES, et le
     carnet le dit : une liste qui maigrit sans explication inquiete plus
     qu'elle ne soulage.
     --------------------------------------------------------------- */
  bloc('Le catalogue ne montre que les miens', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.exercices.length = 0;
    ['Wrist curl', 'Traction', 'Pull up', 'Mon exo maison', 'Curl bizarre']
      .forEach(function (n) {
        fen.App.m.majCatalogue(e, { nom: n, typeCharge: 'kg' });
      });

    v.egal(e.exercices.length, 5,
           '[temoin] cinq noms sont mémorisés, dont trois du dictionnaire');

    fen.App.vues.reglages.rendre(vue);

    return attendre(220).then(function () {
      var cat = null;
      Array.prototype.forEach.call(vue.querySelectorAll('.equip-cat'), function (b) {
        if (!cat && b.textContent.indexOf('Catalogue') === 0) cat = b;
      });
      v.vrai(!!cat, 'le catalogue a son bloc');
      if (!cat) { fen.App.ui.vider(vue); e.exercices.length = 0; return; }

      v.vrai(cat.textContent.indexOf('2') >= 0,
             'et il en annonce DEUX, pas cinq : « ' + cat.textContent.trim()
           + ' »');
      if (cat.getAttribute('aria-expanded') !== 'true') cat.click();

      return attendre(160).then(function () {
        var t = vue.innerText;
        v.vrai(t.indexOf('Mon exo maison') >= 0 && t.indexOf('Curl bizarre') >= 0,
               'les deux noms à lui sont listés');
        v.egal(t.indexOf('Wrist curl'), -1,
               'et un nom du dictionnaire ne l’est pas');
        v.egal(t.indexOf('Traction\n'), -1,
               'une ÉCRITURE du dictionnaire non plus — « Traction » est '
             + 'une écriture de « Pull up »');
        v.vrai(t.indexOf('3 noms du dictionnaire sont mémorisés') >= 0,
               'et le carnet DIT combien il en garde sans les montrer — '
             + 'une liste qui maigrit sans raison inquiète');

        /* ILS SONT TOUJOURS MEMORISES : c'est tout l'interet du choix de
           MB, « cache-les », plutot que de ne plus les cataloguer. */
        v.egal(fen.App.store.etat().exercices.length, 5,
               'les cinq restent MÉMORISÉS : c’est l’affichage qui change, '
             + 'pas la mémoire');

        fen.App.ui.vider(vue);
        fen.App.store.etat().exercices.length = 0;
      });
    });
  });

  bloc('Mon équipement, au doigt', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.outils.length = 0;
    fen.App.m.majCatalogueOutils(e, 'Titan Grip Iron Wrist 60 mm', 'Poignées AW');
    fen.App.m.majCatalogueOutils(e, 'Poulie basse', 'Poulies');

    fen.App.vues.reglages.rendre(vue);

    return attendre(160).then(function () {
      var texte = vue.textContent;
      v.vrai(texte.indexOf('Titan Grip Iron Wrist') >= 0, 'l’équipement est listé');
      /* Les catégories se replient depuis 1.22.2, et elles sont FERMÉES au
         départ : une ligne repliée mesure zéro. On les ouvre donc avant de
         mesurer, sinon ce bloc mesurerait le repli au lieu des lignes.
         (C'est ce contrôle qui l'a dit : « chacune fait au moins 44 px —
         attendu 0, obtenu 2 ».) */
      Array.prototype.forEach.call(vue.querySelectorAll('.equip-cat'), function (b) {
        if (b.getAttribute('aria-expanded') !== 'true') b.click();
      });

      /* La liste en dur a été retirée : plus rien ne propose du matériel
         que l'utilisateur n'a pas saisi lui-même. */
      v.egal(texte.indexOf('Ajouter mon matériel'), -1,
             'aucun raccourci ne propose une liste d’outils écrite dans le code');
      v.egal(texte.indexOf('Golden Grip'), -1,
             'et aucun nom d’outil non saisi n’apparaît');

      var lignes = [];
      Array.prototype.forEach.call(vue.querySelectorAll('.item-ligne'), function (n) {
        if (n.textContent.indexOf('Titan Grip Iron Wrist') === 0
         || n.textContent.indexOf('Poulie basse') === 0) lignes.push(n);
      });
      v.egal(lignes.length, 2, 'les deux outils ont leur ligne');
      var pasBoutons = lignes.filter(function (n) { return n.tagName !== 'BUTTON'; })
                             .map(function (n) { return n.textContent; });
      v.egal(pasBoutons.join(', '), '',
             'et chaque ligne est un BOUTON — un div avec un curseur ne '
           + 's’atteint pas au clavier');
      var petites = lignes.filter(function (n) {
        return n.getBoundingClientRect().height < 44;
      }).length;
      v.egal(petites, 0, 'chacune fait au moins 44 px de haut');

      lignes[0].click();
      return attendre(140).then(function () {
        var pan = doc.querySelector('.panneau');
        v.vrai(!!pan, 'un appui ouvre la fiche de l’outil');
        if (pan) {
          v.vrai(pan.textContent.indexOf('Réglages') >= 0,
                 'et elle propose d’y poser des réglages');
          var fermer = pan.querySelector('.panneau-entete .bt-icone');
          if (fermer) fermer.click();
        }
        return attendre(80).then(function () {
          fen.App.ui.vider(vue);
          e.outils.length = 0;
        });
      });
    });
  });

  /* ---------------------------------------------------------------
     Ce que le carnet a LU dans le nom, A L'ECRAN

     MB, 27/10 : « montre dans l'app quand l'outil est reconnu, meme sans
     muscle ». Le defaut qu'il nommait : une ceinture de judo reconnue ne
     se distinguait EN RIEN d'un nom inconnu, parce qu'elle ne propose
     aucun muscle. Ce bloc mesure les TROIS cas, et surtout que la ligne
     suit la frappe — un renommage qui fait perdre la reconnaissance doit
     se voir AU MOMENT ou on le tape.
     --------------------------------------------------------------- */
  bloc('Ce que le carnet a lu, à l’écran', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.outils.length = 0;
    fen.App.m.majCatalogueOutils(e, 'Ceinture de judo', 'Sangles');

    v.egal(fen.App.m.musclesDeLOutil(['Ceinture de judo']).length, 0,
           '[temoin] cet outil n’ajoute AUCUN muscle — c’est tout l’objet '
         + 'du bloc : sans la ligne, rien ne le distinguerait d’un inconnu');

    fen.App.vues.reglages.rendre(vue);

    /* LE RANGEMENT N'EST PAS SUR LE CHEMIN HEUREUX. Ecrit a la fin du
       dernier `then`, il ne s'execute pas quand le bloc sort plus tot — le
       panneau reste ouvert, le catalogue reste rempli, et les blocs
       SUIVANTS tombent pour une raison qui n'est pas la leur. Mesure du
       27/10, chute P : 29 controles etrangers disparus. */
    function ranger() {
      Array.prototype.forEach.call(doc.querySelectorAll('.panneau'), function (p) {
        var x = p.querySelector('.panneau-entete .bt-icone');
        if (x) x.click();
      });
      return attendre(80).then(function () {
        fen.App.ui.vider(vue);
        e.outils.length = 0;
      });
    }

    return attendre(160).then(function () {
      Array.prototype.forEach.call(vue.querySelectorAll('.equip-cat'), function (b) {
        if (b.getAttribute('aria-expanded') !== 'true') b.click();
      });
      var ligne = null;
      Array.prototype.forEach.call(vue.querySelectorAll('.item-ligne'), function (n) {
        if (!ligne && n.textContent.indexOf('Ceinture de judo') === 0) ligne = n;
      });
      v.vrai(!!ligne, 'l’outil a sa ligne au catalogue');
      if (!ligne) return ranger();
      ligne.click();

      return attendre(140).then(function () {
        var pan = doc.querySelector('.panneau');
        var dit = pan && pan.querySelector('.dit-lu');
        v.vrai(!!dit, 'la fiche porte la ligne de lecture');
        if (!dit) return ranger();

        v.vrai(dit.textContent.indexOf('ceinture de judo') >= 0,
               'elle NOMME le mot lu : « ' + dit.textContent.slice(0, 60) + ' »');
        v.vrai(dit.textContent.indexOf('aucun muscle') >= 0,
               'et elle dit qu’il n’ajoute aucun muscle, au lieu de se taire');
        /* L'EFFET, PAS LA DECLARATION. La premiere ecriture lisait la
           CLASSE — elle serait restee verte avec une regle CSS qui ne
           gagne pas, et c'est precisement ce que j'ai cru voir le 27/10
           (c'etait le cache du navigateur, mais le controle, lui, ne
           l'aurait jamais dit). On compare donc la couleur PEINTE a celle
           d'une ligne ordinaire du meme panneau. */
        var ordinaire = Array.prototype.filter.call(
          pan.querySelectorAll('.item-resume'),
          function (n) { return n !== dit; })[0];
        v.vrai(!!ordinaire,
               '[temoin] le panneau porte une autre ligne de même classe — '
             + 'sans quoi la comparaison suivante n’aurait pas de témoin');
        v.vrai(ordinaire
            && fen.getComputedStyle(dit).color
               !== fen.getComputedStyle(ordinaire).color,
               'et elle se distingue À L’ŒIL : sa couleur n’est pas celle '
             + 'd’une ligne ordinaire (' + (ordinaire
                 ? fen.getComputedStyle(dit).color + ' contre '
                 + fen.getComputedStyle(ordinaire).color : '?') + ')');

        /* ELLE SUIT LA FRAPPE. Mesure de l'EFFET : on tape, on relit. */
        var champ = pan.querySelector('input.champ');
        champ.value = 'Poignée que j’ai faite moi-même';
        champ.dispatchEvent(new fen.Event('input', { bubbles: true }));
        return attendre(60).then(function () {
          v.vrai(dit.textContent.indexOf('Nom libre') === 0,
                 'un nom que rien ne reconnaît éteint la ligne DÈS la frappe');
          v.egal(fen.getComputedStyle(dit).color,
                 fen.getComputedStyle(ordinaire).color,
                 'et la couleur redevient celle d’une ligne ordinaire');
          v.egal(dit.textContent.indexOf('faute'), -1,
                 'sans rien reprocher — un nom libre est le cas normal');

          /* LE MONTAGE, lui aussi a l'ecran : ecrit dans la revue depuis
             le 26/10 et jamais arrive jusqu'ici avant le 27/10. */
          var mo = pan.querySelector('.dit-monte');
          /* LIRE PAR UNE FONCTION, jamais `mo.textContent` nu : ecrit nu,
             le bloc PLANTERAIT si la ligne disparaissait, et emporterait
             les autres. Lecon du 27/10, payee sur le banc du modele — 39
             controles perdus pour un `.indexOf` sans garde. */
          function txtMo() { return mo ? mo.textContent : ''; }
          v.vrai(!!mo, 'la fiche porte la ligne de montage');
          v.egal(txtMo(), '',
                 'elle se tait sur un nom que rien ne reconnaît');

          champ.value = 'Fat Gripz';
          champ.dispatchEvent(new fen.Event('input', { bubbles: true }));
          return attendre(60).then(function () {
            v.vrai(txtMo().indexOf('Se monte sur') === 0,
                   'et elle dit où ça se monte dès la frappe');
            v.vrai(txtMo().indexOf('Pas sur') > 0
                && txtMo().indexOf('sangle') > 0,
                   'y compris ce sur quoi ça ne se monte PAS : « '
                 + txtMo().slice(txtMo().indexOf('Pas sur'), 999)
                     .slice(0, 48) + '… »');

            champ.value = 'Titan Grip Iron Wrist 60 mm';
          champ.dispatchEvent(new fen.Event('input', { bubbles: true }));
          return attendre(60).then(function () {
            v.vrai(dit.textContent.indexOf('iron wrist') >= 0
                && dit.textContent.indexOf('5 muscle(s)') >= 0,
                   'et un outil qui PROPOSE dit combien : « '
                 + dit.textContent.slice(0, 70) + ' »');
            v.egal(txtMo().indexOf('Pas sur'), -1,
                   'et la ligne de montage se tait sur ce qu’on ne sait '
                 + 'pas : « ' + txtMo().slice(0, 48) + '… »');

            /* DEUX FAMILLES, DEUX LIGNES NOMMEES. « Iron Wrist Conic » est
               une poignee a rotation libre ET une poignee conique : deux
               « Se monte sur » de suite ne disaient pas lequel venait d'ou.
               Trouve en CLIQUANT la simulation du 27/10. */
            champ.value = 'Iron Wrist Conic';
            champ.dispatchEvent(new fen.Event('input', { bubbles: true }));
            return attendre(60).then(function () {
              v.egal(fen.App.m.montageDeLOutil('Iron Wrist Conic').length, 2,
                     '[temoin] cet outil touche bien DEUX familles — sans '
                   + 'quoi le contrôle suivant serait vrai pour rien');
              v.vrai(txtMo().indexOf('Poignée à rotation libre —') >= 0
                  && txtMo().indexOf('Poignée conique —') >= 0,
                     'chaque montage NOMME sa famille quand il y en a '
                   + 'plusieurs : « ' + txtMo().slice(0, 60) + '… »');
              return ranger();
            });
            });
          });
        });
      });
    });
  });

  /* ---------------------------------------------------------------
     Les positions de mousqueton, A L'ECRAN

     MB, 27/10 : « propose les trois positions de mousqueton en reglages ».
     Le modele les suggere ; ce bloc mesure qu'elles ARRIVENT dans la fiche
     de l'outil, qu'on les atteint au doigt, et surtout qu'un appui n'en
     CREE aucune — il ouvre la fiche avec le nom ecrit. Le piege n 5 a
     l'echelle d'un geste : le modele et le rendu, jamais l'un sans
     l'autre.
     --------------------------------------------------------------- */
  bloc('Positions de mousqueton, au doigt', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.outils.length = 0;
    fen.App.m.majCatalogueOutils(e, 'Golden Grip Wrist Wrench', 'Poignées AW');

    v.egal(fen.App.m.reglagesProposes(e, 'Golden Grip Wrist Wrench').length, 3,
           '[temoin] le modèle en suggère trois sur cet outil — sans quoi le '
         + 'reste du bloc serait vrai pour rien');

    fen.App.vues.reglages.rendre(vue);

    return attendre(160).then(function () {
      Array.prototype.forEach.call(vue.querySelectorAll('.equip-cat'), function (b) {
        if (b.getAttribute('aria-expanded') !== 'true') b.click();
      });
      var ligne = null;
      Array.prototype.forEach.call(vue.querySelectorAll('.item-ligne'), function (n) {
        if (!ligne && n.textContent.indexOf('Golden Grip Wrist Wrench') === 0) ligne = n;
      });
      v.vrai(!!ligne, 'l’outil a sa ligne au catalogue');
      if (!ligne) { fen.App.ui.vider(vue); e.outils.length = 0; return; }
      ligne.click();

      return attendre(140).then(function () {
        var pan = doc.querySelector('.panneau');
        v.vrai(!!pan, 'un appui ouvre la fiche de l’outil');
        if (!pan) return;

        var offres = Array.prototype.filter.call(
          pan.querySelectorAll('button'),
          function (b) { return b.textContent.indexOf('+ Mousqueton') === 0; });
        v.egal(offres.length, 3, 'la fiche OFFRE les trois positions');
        v.egal(offres.map(function (b) { return b.textContent; }).join(' | '),
               '+ Mousqueton au centre | + Mousqueton à l’extérieur'
             + ' | + Mousqueton à l’intérieur',
               'nommées comme MB les dit, et dans cet ordre');
        /* MESURER LA PLUS PETITE, et non « combien sont trop petites » :
           la chute du 27/10 l'a dit — sur une liste VIDE, « aucune n'est
           trop petite » est vrai pour rien. Ecrit ainsi, zero offre rend
           zero pixel, et le controle tombe. */
        var basse = offres.length ? Math.min.apply(null, offres.map(function (b) {
          return Math.round(b.getBoundingClientRect().height);
        })) : 0;
        v.vrai(basse >= 44,
               'la plus petite offre fait au moins 44 px de haut (' + basse
             + ' px) — une offre qu’on rate au pouce n’est pas une offre');
        v.vrai(pan.textContent.indexOf('aucune ne s’ajoute avant que tu '
             + 'l’enregistres') >= 0,
               'et l’aide dit ce que l’offre ne fait PAS');

        /* GARDE : sans elle, un ecran qui n'offre rien ferait planter
           `offres[1]` et le bloc entier disparaitrait du rapport — muet la
           ou il doit parler. Il doit RENDRE son echec, pas l'emporter. */
        if (offres.length < 2) {
          var x0 = pan.querySelector('.panneau-entete .bt-icone');
          if (x0) x0.click();
          fen.App.ui.vider(vue);
          e.outils.length = 0;
          return;
        }

        offres[1].click();
        return attendre(140).then(function () {
          var tous = doc.querySelectorAll('.panneau');
          var fiche = tous[tous.length - 1];
          var champ = fiche && fiche.querySelector('input.champ');
          /* NOMMER LE PANNEAU, pas seulement constater qu'il y en a un :
             la fiche de l'OUTIL porte elle aussi un `.champ`, et le
             controle serait vert sans que rien ne s'ouvre. */
          v.egal(fiche && fiche.getAttribute('aria-label'), 'Nouveau réglage',
                 'un appui ouvre la fiche du RÉGLAGE, par-dessus celle de '
               + 'l’outil');
          v.vrai(!!champ, 'et elle a son champ de nom');
          v.egal(champ && champ.value, 'Mousqueton à l’extérieur',
                 'avec le nom DÉJÀ écrit — un appui, et il reste modifiable');
          v.egal(fen.App.m.reglagesOutil(e, 'Golden Grip Wrist Wrench').length, 0,
                 'et RIEN n’est encore au catalogue : c’est lui qui enregistre');

          Array.prototype.forEach.call(tous, function (p) {
            var x = p.querySelector('.panneau-entete .bt-icone');
            if (x) x.click();
          });
          return attendre(80).then(function () {
            fen.App.ui.vider(vue);
            e.outils.length = 0;
          });
        });
      });
    });
  });

  /* ---------------------------------------------------------------
     POSER UN OUTIL SUR UN EXERCICE, quand l'equipement est VIDE

     MB, 27/10 : « comment je selectionne l'equipement quand je cree un
     exo ? pas possible dans la configuration que je voulais ». Reproduit :
     ca marchait: taper + ENTREE posait l'outil ET l'ajoutait au catalogue.
     Mais la touche n'etait nulle part ecrite, et le bouton « Choisir dans
     mon equipement » restait la, DESACTIVE, opacite 0.45 — un bouton
     eteint se lit « c'est casse ».
     --------------------------------------------------------------- */
  bloc('Poser un outil quand l’équipement est vide', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var e = fen.App.store.etat();
    e.outils.length = 0;
    var exo = fen.App.m.exerciceProgramme({ nom: 'Curl' });
    var rendu = null;

    v.egal(e.outils.length, 0,
           '[temoin] l’équipement est vide — c’est le cas que MB a vécu, et '
         + 'tout le bloc en dépend');

    fen.App.panneau.editerExercice(exo, { titre: 'Essai' },
                                   function (x) { rendu = x; });

    return attendre(200).then(function () {
      var pan = doc.querySelector('.panneau');
      v.vrai(!!pan, 'la fiche d’exercice s’ouvre');
      if (!pan) return;

      function ranger() {
        Array.prototype.forEach.call(doc.querySelectorAll('.panneau'), function (p) {
          var x = p.querySelector('.panneau-entete .bt-icone');
          if (x) x.click();
        });
        return attendre(80).then(function () { e.outils.length = 0; });
      }

        /* L'AFFICHAGE C (MB, 27/10) : plus de bouton « Choisir dans mon
           equipement », mais des sections REPLIEES. Ce bloc mesurait le
           bouton, et trois de ses controles etaient ecrits `!bt || ...` :
           le bouton parti, ils sont devenus VRAIS A VIDE au lieu de
           tomber. Seul le temoin a parle. On mesure donc ce qui existe. */
        function sections() {
          return Array.prototype.slice.call(pan.querySelectorAll('.equip-cat'));
        }
        function marques() {
          return sections().filter(function (b) {
            return b.textContent.indexOf('Golden Grip') === 0
                || b.textContent.indexOf('Titangrip') === 0;
          });
        }
        function sectionMienne() {
          return sections().filter(function (b) {
            return b.textContent.indexOf('Le mien') === 0;
          });
        }
        v.egal(marques().length, 2,
               'les marques ont leur section dans la fiche d’exercice');
        v.egal(marques().filter(function (b) {
          return b.getAttribute('aria-expanded') !== 'false';
        }).length, 0,
               'et TOUT est replié au départ — la fiche est déjà longue');
        v.egal(sectionMienne().length, 0,
               '« Le mien » ne s’affiche pas quand l’équipement est '
             + 'vide : une section à zéro n’apprend rien');
        v.egal(marques().filter(function (b) {
          return b.getBoundingClientRect().height < 44;
        }).length, 0, 'chaque section se touche au pouce');

        /* ELLE S'OUVRE SUR PLACE : c'est tout l'interet de C.

           LA GARDE N'EST PAS DU LUXE : ecrit `marques()[1].click()` nu, ce
           controle a PLANTE sous la chute du 27/10 et emporte le bloc
           SUIVANT avec lui — les panneaux restaient ouverts. Troisieme
           fois de la journee que je paie la meme faute. */
        var deux = marques()[1];
        if (deux) deux.click();
        var lignesM = pan.querySelectorAll('.item-ligne').length;
        v.vrai(!!deux && lignesM > 0,
               'déplier une marque montre ses produits SANS quitter la '
             + 'fiche (' + lignesM + ' lignes)');
        v.vrai(pan.textContent.indexOf('Clé de poignet') > 0,
               'avec ses familles NOMMÉES, pas leurs clés');
        v.egal(e.outils.length, 0, 'et déplier n’a RIEN posé');
        if (deux) deux.click();

      var aide = null;
      Array.prototype.forEach.call(pan.querySelectorAll('.item-resume'), function (n) {
        if (!aide && n.textContent.indexOf('Tape le nom') === 0) aide = n;
      });
      v.vrai(!!aide, 'une aide prend sa place');
      var t = aide ? aide.textContent : '';
      v.vrai(t.indexOf('Entrée') > 0,
             'elle NOMME la touche qui valide — personne ne devine '
           + '« Entrée » sur un clavier de téléphone');
      v.vrai(t.indexOf('y entre aussi') > 0,
             'et elle dit que l’outil tapé rejoint l’équipement : « '
           + t.slice(0, 64) + '… »');

      /* ET LE GESTE MARCHE VRAIMENT — l'effet, pas la declaration. */
      var champ = null;
      Array.prototype.forEach.call(pan.querySelectorAll('input.champ'), function (n) {
        /* On reconnait le champ par SA PLACE, pas par le texte de son
           exemple : l'exemple a change le 27/10, et un controle accroche a
           un libelle se casse au premier renommage. */
        if (!champ && n.closest && n.closest('.multi')) champ = n;
      });
      v.vrai(!!champ, 'le champ de saisie libre est là');
      if (!champ) return ranger();

      /* LES EXEMPLES DU CHAMP MARCHENT — MB, 27/10 : « mets des exemples
         qui marchent, deux des trois ne sont pas bons ». Mesure : les
         TROIS etaient muets.

         ET ON LIT LE VRAI PLACEHOLDER. Ma premiere ecriture recopiait les
         trois noms dans le banc et les mesurait eux-memes : elle serait
         restee verte en remettant les anciens exemples dans l'ecran. Un
         controle qui se mesure contre lui-meme ne prouve rien. */
      var ex = (champ.placeholder || '').replace(/[…\.]+$/, '')
                 .split(',').map(function (x) { return x.trim(); })
                 .filter(Boolean);
      v.vrai(ex.length >= 2,
             '[temoin] le champ propose des exemples (' + ex.length + ')');
      v.egal(ex.filter(function (x) {
        return !fen.App.m.musclesDeLOutil([x]).length;
      }).join(' · '), '',
             'et CHACUN est reconnu par le carnet : un exemple muet apprend '
           + 'le contraire de ce qu’il montre');
      champ.value = 'Fat Gripz';
      champ.dispatchEvent(new fen.Event('input', { bubbles: true }));
      champ.dispatchEvent(new fen.KeyboardEvent('keydown',
        { key: 'Enter', bubbles: true }));

      return attendre(140).then(function () {
        v.egal((exo.outils || []).join(','), 'Fat Gripz',
               'taper puis Entrée POSE l’outil sur l’exercice');
        v.egal(champ.value, '', 'et le champ se vide pour le suivant');
        v.egal(sectionMienne().length, 1,
               '« Le mien » APPARAÎT dès le premier outil posé — sans '
             + 'quoi on vient de remplir son équipement et rien ne le '
             + 'montre');
        return ranger();
      });
    });
  });

  /* ---------------------------------------------------------------
     PARCOURIR LES MARQUES

     MB, 27/10 : « je ne vois que les 4 que j'ai ajoutes a la main, je ne
     vois pas Titan Grip avec les sous categories et equipements propres a
     la marque ». Ce bloc mesure les deux moities : que le catalogue
     s'ouvre et se lise, et surtout qu'il NE POSE RIEN — la regle du projet
     est que rien n'est livre dans l'equipement.
     --------------------------------------------------------------- */
  bloc('Parcourir les marques', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.outils.length = 0;

    fen.App.vues.reglages.rendre(vue);

    function ranger() {
      Array.prototype.forEach.call(doc.querySelectorAll('.panneau'), function (p) {
        var x = p.querySelector('.panneau-entete .bt-icone');
        if (x) x.click();
      });
      return attendre(80).then(function () {
        fen.App.ui.vider(vue);
        e.outils.length = 0;
      });
    }

    return attendre(200).then(function () {
      var bt = null;
      Array.prototype.forEach.call(vue.querySelectorAll('button'), function (b) {
        if (!bt && b.textContent.indexOf('Parcourir les marques') === 0) bt = b;
      });
      v.vrai(!!bt, 'l’écran propose de parcourir les marques');
      if (!bt) return ranger();
      v.vrai(bt.getBoundingClientRect().height >= 44,
             'et le bouton se touche au pouce ('
           + Math.round(bt.getBoundingClientRect().height) + ' px)');
      bt.click();

      return attendre(160).then(function () {
        var pan = doc.querySelector('.panneau');
        var lignes = pan ? Array.prototype.map.call(
          pan.querySelectorAll('.item-ligne'),
          function (n) { return n.textContent; }) : [];
        v.egal(lignes.length, 4, 'les quatre marques sont listées');
        v.vrai(lignes.join(' ').indexOf('Titangrip') >= 0,
               'Titangrip en fait partie — c’est celle que MB a nommée');

        var tg = null;
        Array.prototype.forEach.call(pan.querySelectorAll('.item-ligne'), function (n) {
          if (!tg && n.textContent.indexOf('Titangrip') === 0) tg = n;
        });
        if (!tg) return ranger();
        tg.click();

        return attendre(160).then(function () {
          var ps = doc.querySelectorAll('.panneau');
          var q = ps[ps.length - 1];
          v.egal(q.getAttribute('aria-label'), 'Titangrip',
                 'un appui ouvre la marque');
          var titres = Array.prototype.map.call(
            q.querySelectorAll('.groupe > label, .groupe > .lib, .groupe b'),
            function (n) { return n.textContent.trim(); });
          var txt = q.innerText;
          /* LES FAMILLES PORTENT LEUR NOM. Avant le 27/10 l'ecran affichait
             la CLE : « fat grip », « pronator ». */
          v.vrai(txt.indexOf('Clé de poignet') > 0,
                 'les familles portent leur NOM, pas leur clé');
          v.egal(txt.indexOf('wrist wrench'), -1,
                 'et la clé ne s’affiche nulle part');

          var prod = null;
          Array.prototype.forEach.call(q.querySelectorAll('.item-ligne'), function (n) {
            if (!prod && n.textContent.indexOf('Iron Wrist Conic') === 0) prod = n;
          });
          v.vrai(!!prod, 'un produit de la marque est là');
          v.egal(e.outils.length, 0,
                 'et PARCOURIR n’a rien posé dans l’équipement');
          if (!prod) return ranger();
          prod.click();

          return attendre(200).then(function () {
            var ps2 = doc.querySelectorAll('.panneau');
            var fiche = ps2[ps2.length - 1];
            var champ = fiche && fiche.querySelector('input.champ');
            v.egal(fiche && fiche.getAttribute('aria-label'), 'Nouvel outil',
                   'un appui ouvre la fiche de l’outil');
            v.egal(champ && champ.value, 'Iron Wrist Conic',
                   'avec le nom DÉJÀ écrit, et modifiable');
            v.egal(e.outils.length, 0,
                   'et RIEN n’est encore au catalogue : c’est lui qui '
                 + 'enregistre');
            var lu = fiche && fiche.querySelector('.dit-lu');
            v.vrai(lu && lu.textContent.indexOf('iron wrist') >= 0,
                   'la fiche dit déjà ce qu’elle a lu dans ce nom');
            return ranger();
          });
        });
      });
    });
  });

  /* ------------------------------------------------------------------
     PRENDRE UN PRODUIT L'ATTACHE — SANS FORMULAIRE

     MB, 28/10 : « quand je clique sur un equipement deja rentre >> Titan
     Grip, apres selection, il me propose de l'enregistrer... Il est deja
     enregistre, pourquoi le refaire ?? »

     CAUSE MESUREE : l'ecran testait `trouverOutil` par SLUG EXACT. Son
     « Titan Grip » et le produit « Titan Grip Iron Wrist » sont deux
     slugs — le carnet le croyait neuf et ouvrait la fiche de creation.
     ------------------------------------------------------------------ */
  bloc('Prendre un produit l’attache, sans formulaire', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.outils.length = 0;
    /* SON DECOR : un « Titan Grip » deja chez lui, et un produit de la
       marque dont le nom est PLUS LONG. C'est tout le piege. */
    fen.App.m.majCatalogueOutils(e, 'Titan Grip', 'Poignées');
    /* ET UN IRON WRIST, reconnu, SANS reglage declare : c'est le decor du
       geste neuf — le carnet lui connait trois positions, l'ecran doit les
       offrir. */
    fen.App.m.majCatalogueOutils(e, 'Iron Wrist', 'Poignées');

    var exo = { nom: '', outils: [] };
    fen.App.panneau.editerExercice(exo, function () {});

    return attendre(220).then(function () {
      var pan = doc.querySelector('.panneau');
      v.vrai(!!pan, '[temoin] le panneau d’exercice est ouvert');
      if (!pan) return;

      var cat = Array.prototype.filter.call(pan.querySelectorAll('.equip-cat'),
        function (b) { return /titangrip/i.test(b.textContent); })[0];
      v.vrai(!!cat, '[temoin] la marque a sa section');
      if (cat) cat.click();

      return attendre(180).then(function () {
        var ligne = Array.prototype.filter.call(pan.querySelectorAll('.item-ligne'),
          function (x) { return /Iron Wrist/.test(x.textContent); })[0];
        v.vrai(!!ligne, '[temoin] le produit est listé');
        if (!ligne) return ranger();

        var avant = doc.querySelectorAll('.panneau').length;
        ligne.click();

        return attendre(220).then(function () {
          v.egal(doc.querySelectorAll('.panneau').length, avant,
                 'AUCUN second panneau ne s’ouvre : le produit s’attache, '
               + 'il ne se « ré-enregistre » pas');
          v.vrai((exo.outils || []).join(',').indexOf('Iron Wrist') >= 0,
                 'et il est bien attaché à l’exercice');
          /* LE NOM EST CELUI DE LA LIGNE, pas le nom de marque complet :
             la section porte deja « Titangrip ». J'avais ecrit
             « Titan Grip Iron Wrist » sans verifier — le banc l'a dit. */
          var pose = (exo.outils || [])[0] || '';
          v.vrai(!!pose && !!fen.App.m.trouverOutil(fen.App.store.etat(),
                   fen.App.m.slug(pose)),
                 'il entre au catalogue EN SILENCE, sous le nom attaché — '
               + 'c’est un effet de bord du geste, pas une décision à '
               + 'prendre (« ' + pose + ' »)');

          /* ---- APRES LE CHOIX : REPLIE, ET REVENU A LA CASE ----

             MB, 28/10, apres trois maquettes cliquables : « Replier ».

             CE CONTROLE MESURE LA POSITION PEINTE, pas l'appel. J'ai
             d'abord employe `scrollIntoView` : il n'a RIEN fait, deux
             essais de suite, et seule la capture d'ecran l'a dit — le
             chiffre que je mesurais, lui, bougeait (2 661 -> 1 880) parce
             que replier seize produits raccourcit la page. Une mesure sans
             capture aurait valide un ecran faux. */
          var cat2 = Array.prototype.filter.call(pan.querySelectorAll('.equip-cat'),
            function (b) { return /titangrip/i.test(b.textContent); })[0];
          v.egal(cat2 ? cat2.getAttribute('aria-expanded') : '(absente)', 'false',
                 'la section d’où vient le choix se REPLIE');
          v.egal(Array.prototype.filter.call(pan.querySelectorAll('.equip-cat'),
                   function (b) { return b.getAttribute('aria-expanded') === 'true'; }).length,
                 0, 'et aucune autre ne reste ouverte');

          var boite = pan.querySelector('.panneau-corps');
          var champ = pan.querySelector('.multi, .auto, .champ-multi')
                    || (pan.querySelector('.jeton-ret') || {}).parentNode;
          v.vrai(!!boite, '[temoin] le corps du panneau est bien le conteneur qui défile');
          if (boite) {
            var jeton = null;
            Array.prototype.forEach.call(pan.querySelectorAll('*'), function (n) {
              if (!jeton && n.children.length === 0
                  && n.textContent.trim() === 'Iron Wrist') jeton = n;
            });
            v.vrai(!!jeton, '[temoin] le jeton de l’équipement choisi est peint');
            if (jeton) {
              var rj = jeton.getBoundingClientRect();
              var rb = boite.getBoundingClientRect();
              var defile = boite.scrollHeight > boite.clientHeight + 4;
              if (defile) {
                v.vrai(rj.top >= rb.top - 2 && rj.top <= rb.top + 180,
                       'et l’écran est REVENU sur la case : le jeton se voit '
                     + 'à ' + Math.round(rj.top - rb.top) + ' px du haut du '
                     + 'cadre');
              } else {
                /* [temoin] ASSUME : l'hote du banc est plus haut qu'un
                   telephone, et le panneau y tient SANS defiler — il n'y a
                   donc rien a ramener. Le retour a la case a ete verifie
                   sur l'ecran reel a 320x700, capture a l'appui : 2 661 px
                   avant, le libelle « Equipements » en haut apres. Ce qui
                   se mesure ICI, c'est que rien ne bouge quand rien ne doit
                   bouger. */
                v.vrai(boite.scrollTop === 0,
                       '[temoin] le panneau tient sans défiler dans le banc '
                     + '(' + boite.clientHeight + ' px de haut) : rien à '
                     + 'ramener, et rien ne bouge');
              }
            }
          }

          /* ---- LES POSITIONS CONNUES SE POSENT EN UN APPUI ----

             MB, 28/10 : « ceux deja ajoutes, qui ont un reglage deja
             existant, doit etre selectionnable quand il est ajoute a l'exo,
             et directement sur la page, sans avoir a cliquer sur
             "+ Reglage pour Iron Wrist", puis ensuite choisir, c'est trop
             lourd. »

             LE CARNET CONNAISSAIT DEJA ces positions — MB les avait vues le
             27/10, sourcees sur la photo Titangrip. Ce qui manquait est que
             l'ecran ne lisait que les reglages DECLARES. */
          var sug = pan.querySelectorAll('.puces .puce');
          v.egal(sug.length, 3,
                 'un Iron Wrist propose ses TROIS positions, directement, '
               + 'sans passer par un bouton');
          v.vrai(pan.textContent.indexOf('Le carnet reconnaît cet équipement') >= 0,
                 'et il dit d’où elles viennent — une puce qui apparaît sans '
               + 'provenance inquiète');

          var ext = null;
          Array.prototype.forEach.call(sug, function (b) {
            if (/extérieur/.test(b.textContent)) ext = b;
          });
          v.vrai(!!ext, '[temoin] la position extérieure est là');
          if (ext) {
            ext.click();
            var oo = fen.App.m.trouverOutil(fen.App.store.etat(),
                                            fen.App.m.slug('Iron Wrist'));
            v.egal(((oo || {}).reglages || []).length, 1,
                   'UN SEUL appui la déclare sur l’équipement — pas de '
                 + 'formulaire, pas de second écran');
            v.egal(fen.App.m.reglageDe(exo, 'Iron Wrist'),
                   'Mousqueton à l’extérieur',
                   'et la pose sur l’exercice dans le même geste');
            v.egal(fen.App.m.reglagesProposes(fen.App.store.etat(),
                     'Iron Wrist').length, 2,
                   'les deux autres restent proposées : on n’a pas à les '
                 + 'retaper');
          }

          /* ---- ET LE REGLAGE SE POSE SANS QUITTER L'EXERCICE ---- */
          var bt = Array.prototype.filter.call(pan.querySelectorAll('button'),
            function (b) { return b.textContent.indexOf('+ Réglage') === 0; })[0];
          v.vrai(!!bt,
                 'la ligne de réglages porte un bouton plutôt qu’un renvoi '
               + 'vers Réglages → Équipement : une impasse polie reste une '
               + 'impasse');
          var r = bt ? bt.getBoundingClientRect() : { height: 0 };
          v.vrai(r.height >= 32,
                 'et il se touche (' + Math.round(r.height) + ' px)');
          return ranger();
        });
      });
    });

    function ranger() {
      Array.prototype.forEach.call(doc.querySelectorAll('.panneau'), function (p) {
        var x = p.querySelector('.panneau-entete .bt-icone');
        if (x) x.click();
      });
      return attendre(80).then(function () {
        fen.App.store.etat().outils.length = 0;
        fen.App.ui.vider(vue);
      });
    }
  });

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
      v.egal(debordements(doc, fen, LARGEUR).join(' · '), '',
             'et rien ne sort de l’écran à 320 px ' + '— mesuré au BORD DROIT des éléments, pas au scrollWidth, que « overflow-x: hidden » rend toujours vert');

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

  /* ------------------------------------------------------------------
     UN SEUL ✓ VALIDE LES QUATRE SÉRIES

     Deux demandes de MB, le même jour, et la seconde corrige ma réponse à
     la première :

       1) « il faudrait : Side Pressure 4x50 reps ». L'écran ne lisait que la
          PREMIÈRE série ; le journal n'avait rien à compter.
       2) « l'affichage initial était meilleur, je n'avais qu'une fois à
          valider […] ne peut on pas valider UNE fois les 4 séries ? »

     Ce bloc mesure les DEUX à la fois, et c'est pour ça qu'il tombe sur deux
     racines : sur 1.37.2 le journal dit « 50 reps », sur 1.38.0 il faut
     quatre appuis.
     ------------------------------------------------------------------ */
  bloc('Un seul ✓ valide les quatre séries', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.seances = [];

    var routine = fen.App.m.routineRecupVierge();
    routine.exercices = [fen.App.m.exerciceProgramme({
      nom: 'Side pressure', typeCharge: 'elastique', colonnes: ['reps'],
      series: [{ repsCible: '50' }, { repsCible: '50' },
               { repsCible: '50' }, { repsCible: '50' }] })];
    e.routineRecup = routine;

    v.egal(routine.exercices[0].series.length, 4,
           '[temoin] la routine en porte bien quatre — c’est le décor, et il '
         + 'tient des deux côtés');

    fen.App.vues.recup.rendre(vue);

    /* --- l'écran rapide : une ligne, un ✓ --- */
    v.egal(doc.querySelectorAll('.recup-ligne').length, 1,
           'UNE seule ligne à cocher, pas quatre : Récup est un écran de geste');
    v.egal(doc.querySelectorAll('.recup-ligne .serie-ok').length, 1,
           'et UN seul ✓ — « je n’avais qu’une fois à valider »');
    v.egal(doc.querySelectorAll('.recup-num').length, 0,
           'plus aucun numéro de série : il n’y a plus de série à désigner');

    /* --- mais il DIT ce qu'il valide --- */
    v.vrai(doc.body.textContent.indexOf('4 séries') >= 0,
           'la carte dit « 4 séries » : sans ce mot, un seul ✓ laisserait '
         + 'croire qu’une seule série est en jeu');
    /* MISE A JOUR DU 28/10 : depuis qu'il y a PLUSIEURS seances de recup,
       l'en-tete compte les SEANCES et c'est la CARTE qui compte ses
       exercices. Le controle mesure les deux, chacun a sa place. */
    v.vrai(doc.body.textContent.indexOf('0 / 1 séance faite') >= 0,
           'l’en-tête compte les SÉANCES faites du jour');
    v.vrai(doc.body.textContent.indexOf('0 / 1 exercice') >= 0,
           'et la carte compte ses EXERCICES : « 0 / 1 », pas « 0 / 4 » — '
         + 'les quatre séries ne font qu’un exercice');

    var champ = doc.querySelector('.recup-ligne .serie-saisie');
    v.vrai(!!champ && champ.placeholder === '50',
           'le champ porte la cible commune aux quatre séries');

    /* --- UN appui, et les quatre sont faites --- */
    var ok = doc.querySelector('.recup-ligne .serie-ok');
    v.vrai(!!ok, '[temoin] il y a bien un ✓ à cliquer');
    if (ok) ok.click();

    var jour = fen.App.store.etat().seances[0];
    v.vrai(!!jour, 'le ✓ fait entrer la journée dans le journal');
    var faites = ((jour || {}).exercices || [{}])[0].series || [];
    v.egal(faites.filter(function (s) { return s.faite; }).length, 4,
           'et les QUATRE séries sont cochées d’un seul appui');
    v.egal(faites.filter(function (s) { return s.repsReel === '50'; }).length, 4,
           'chacune prend sa cible : « fait comme prévu », pas « valeur inconnue »');
    v.vrai(doc.body.textContent.indexOf('1 / 1 séance faite') >= 0,
           'l’en-tête passe à « 1 / 1 séance faite », et non « 4 / 4 »');
    v.vrai(!!doc.querySelector('.recup-exo')
           && doc.querySelector('.recup-exo').classList.contains('faite'),
           'la carte de l’exercice se marque');
    v.vrai(!!doc.querySelector('.recup-seance')
           && doc.querySelector('.recup-seance').classList.contains('faite'),
           'et la SÉANCE aussi, puisque son seul exercice est fait');

    /* --- ce que MB voulait VOIR dans le journal --- */
    fen.App.vues.journal.rendre(vue);
    var t = doc.body.textContent;
    v.vrai(t.indexOf('4 × 50 reps') >= 0,
           'et le journal écrit « 4 × 50 reps » — la demande d’origine');
    v.vrai(t.indexOf('1 / 1 exercice') >= 0,
           'la carte compte « 1 / 1 exercice » : un appui, un exercice');

    /* --- ce qu'on tape vaut pour les quatre --- */
    fen.App.vues.recup.rendre(vue);
    var c2 = doc.querySelector('.recup-ligne .serie-saisie');
    v.vrai(!!c2, '[temoin] le champ est là après re-rendu');
    if (c2) {
      c2.value = '45';
      c2.dispatchEvent(new fen.Event('input', { bubbles: true }));
    }
    var s2 = fen.App.store.etat().seances[0].exercices[0].series;
    v.egal(s2.filter(function (s) { return s.repsReel === '45'; }).length, 4,
           'ce qu’on tape vaut pour les quatre séries — le prix assumé de '
         + 'l’appui unique');

    /* --- décocher défait les quatre --- */
    doc.querySelector('.recup-ligne .serie-ok').click();
    var s3 = (fen.App.store.etat().seances[0] || { exercices: [{ series: [] }] })
             .exercices[0].series;
    v.egal(s3.filter(function (s) { return s.faite; }).length, 0,
           'et décocher les défait toutes les quatre');

    /* --- des cibles DIFFÉRENTES ne se perdent pas --- */
    fen.App.store.etat().seances = [];
    routine.exercices = [fen.App.m.exerciceProgramme({
      nom: 'Pronation', typeCharge: 'elastique', colonnes: ['reps'],
      series: [{ repsCible: '50' }, { repsCible: '50' },
               { repsCible: '40' }, { repsCible: '40' }] })];
    fen.App.vues.recup.rendre(vue);
    var c3 = doc.querySelector('.recup-ligne .serie-saisie');
    v.egal(c3 ? c3.placeholder : '', '50 · 40',
           'des cibles différentes se LISTENT dans le placeholder — en montrer '
         + 'une seule mentirait sur les trois autres');
    doc.querySelector('.recup-ligne .serie-ok').click();
    var s4 = fen.App.store.etat().seances[0].exercices[0].series;
    v.egal(s4.map(function (s) { return s.repsReel; }).join(' '), '50 50 40 40',
           'et cocher sans rien taper donne à CHAQUE série la sienne');

    v.egal(debordements(doc, fen, LARGEUR).join(' · '), '',
           'rien ne déborde de 320 px');

    fen.App.ui.vider(vue);
    fen.App.store.etat().seances = [];
    fen.App.store.etat().routineRecup = null;
  });

  /* ------------------------------------------------------------------
     LES SOUS-ONGLETS DU SUIVI

     MB, 28/10 : « il faudra aussi une séparation nette entre Suivi des
     séances, suivi de la Récup et suivi des Sparring ». Trois dispositions
     lui ont été montrées, cliquables et mesurées ; il a pris les
     sous-onglets.

     CE BLOC MESURE L'ÉCRAN, pas le modèle : la séparation existait DÉJÀ
     dans les données — les compteurs filtrent `type === 'muscu'` depuis
     toujours — et ce qui manquait est que l'écran le DISE.
     ------------------------------------------------------------------ */
  bloc('Les sous-onglets du Suivi', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.seances = [];

    function jourIl(n) {
      var d = new fen.Date(); d.setDate(d.getDate() - n);
      var z = function (x) { return (x < 10 ? '0' : '') + x; };
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
    }
    function exo(nom, nb) {
      var s = [];
      for (var k = 0; k < nb; k++) {
        s.push({ id: 'x' + nom + k, type: 'normale', faite: true, faiteA: null,
                 chargeCible: '', repsCible: '', dureeCible: '',
                 chargeReel: '20', repsReel: '10', dureeReel: '', rpe: null });
      }
      return { id: 'e' + nom, ordre: 0, nom: nom, slug: fen.App.m.slug(nom),
               aw: true, typeCharge: 'kg', colonnes: ['charge', 'reps'],
               forces: [], muscles: [], structures: [], outils: [],
               consigne: '', reposSecondes: 90, series: s };
    }
    e.seances = [
      { id: 'm1', type: 'muscu', date: jourIl(2), heure: '', note: '', douleurs: [],
        exercices: [exo('Toproll à la poulie', 6), exo('Wrist curl', 3),
                    exo('Side pressure à la poulie', 5)] },
      { id: 's1', type: 'sparring', date: jourIl(1), style: 'hook', rounds: 6,
        dureeMin: 20, cote: 'droite', partenaires: 'Marc', douleurs: [] },
      { id: 's2', type: 'sparring', date: jourIl(3), style: 'hook', rounds: 4,
        dureeMin: 15, cote: 'droite', partenaires: 'Julien', douleurs: [] }
    ];

    fen.App.vues.suivi.rendre(vue);

    /* ---- la barre existe, et elle est cliquable au doigt ---- */
    var onglets = doc.querySelectorAll('.sous-onglet');
    v.egal(onglets.length, 3, 'trois sous-onglets');
    v.egal(Array.prototype.map.call(onglets, function (b) { return b.textContent; })
             .join('/'), 'Séances/Récup/Sparring', 'et ils se nomment');
    var minH = 9999, minL = 9999;
    Array.prototype.forEach.call(onglets, function (b) {
      var r = b.getBoundingClientRect();
      minH = Math.min(minH, r.height); minL = Math.min(minL, r.width);
    });
    v.vrai(minH >= 44,
           'le plus court fait 44 px — la maquette les avait à 38 ('
         + Math.round(minH) + ' px)');
    v.vrai(minL >= 60, 'et le plus étroit reste lisible ('
         + Math.round(minL) + ' px)');

    /* ---- SÉANCES : le style déduit, et ce que le carnet ne sait pas ---- */
    v.egal(onglets.length ? onglets[0].getAttribute('aria-pressed') : '(aucun onglet)',
           'true', 'Séances est l’onglet d’ouverture');
    var t = vue.innerText;
    v.vrai(t.indexOf('Séances de musculation') >= 0,
           'l’écran DIT sa portée — c’est ce qui manquait, pas le filtre');
    v.vrai(t.indexOf('Toproll') >= 0 && t.indexOf('Hook') >= 0,
           'les deux styles lisibles sont nommés');
    v.vrai(t.indexOf('Press — non lisible') >= 0,
           'et le PRESS est dit NON LISIBLE plutôt que montré à zéro : '
         + '« 0 série » se lirait « tu ne presses jamais »');
    v.vrai(t.indexOf('Side pressure') >= 0,
           'la mesure partagée se montre, à part et nommée');

    /* L'ÉCART, qui est le fond de la demande. */
    v.vrai(t.indexOf('TOPROLL') >= 0 && t.indexOf('HOOK') >= 0
           && t.indexOf('tu spares en') >= 0,
           'et l’écart se dit : entraîné en toproll, sparring en hook');

    /* UN NOM QUI NE S'OUVRE PAS NE PORTE PAS LA MARQUE D'UN NOM CLIQUABLE.
       Mesure de l'EFFET peint, pas de la classe : j'avais recopié
       `barre-nom`, dont le souligné pointillé annonce « il se passe
       quelque chose ». */
    var nomStyle = null;
    Array.prototype.forEach.call(vue.querySelectorAll('.barre span'), function (s) {
      if (!nomStyle && s.textContent === 'Toproll') nomStyle = s;
    });
    v.vrai(!!nomStyle, '[temoin] le libellé « Toproll » est bien une barre');
    if (nomStyle) {
      v.egal(fen.getComputedStyle(nomStyle).textDecorationLine, 'none',
             'et il n’est PAS souligné : rien ne s’ouvre en cliquant dessus');
    }

    /* ---- RÉCUP : pas de période, et pas d'écran blanc ----
       PAS D'INDEX NU : sur la version d'avant il n'y a aucun sous-onglet,
       `onglets[1]` levait une TypeError et 18 des 23 controles n'etaient
       jamais joues — 2/5, une chute illisible. Sixieme fois de la session. */
    if (onglets.length > 1) onglets[1].click();
    v.egal(vue.querySelectorAll('.periodes').length, 0,
           'l’onglet Récup ne montre PAS le sélecteur de période : ses blocs '
         + 'ne le lisent pas, et un sélecteur sans effet est un mensonge');
    v.vrai(vue.innerText.indexOf('Aucune journée de récupération') >= 0,
           'et il ne reste pas BLANC quand il n’y a rien — le bloc rendait '
         + 'un fragment vide, tenable parmi dix, illisible seul');
    v.egal(vue.innerText.indexOf('Toproll'), -1,
           'aucune donnée de séance ne fuit dans l’onglet Récup');

    /* ---- SPARRING : le déclaré, et ce qui manque au vocabulaire ---- */
    if (onglets.length > 2) onglets[2].click();
    var ts = vue.innerText;
    v.vrai(ts.indexOf('Sparrings notés') >= 0, 'le sparring dit sa portée');
    v.vrai(ts.indexOf('Rien n’est deviné') >= 0,
           'et qu’il ne déduit RIEN : le style y est coché à la main');
    v.vrai(ts.indexOf('2 sparr.') >= 0, 'les deux sparrings en hook sont comptés');
    v.vrai(ts.indexOf('10') >= 0 && ts.indexOf('35') >= 0,
           'rounds et minutes sont là, séparés');
    /* LE PRESS EST DECLARABLE depuis le 28/10 : ce bloc disait qu'il
       manquait, et le dire encore serait faux. Ce qui se mesure est qu'il
       est bien PROPOSE. */
    v.egal(ts.indexOf('Le press n’est pas proposé ici'), -1,
           'le carnet ne dit plus que le press manque — il ne manque plus');
    v.vrai(fen.App.m.STYLES.some(function (x) { return x.id === 'press'; }),
           'et il est déclarable sur un sparring');
    v.vrai(vue.querySelectorAll('.periodes').length === 1,
           'le sélecteur de période revient ici : les blocs de sparring le lisent');

    /* ---- rien ne déborde, sur les trois ---- */
    var sortis = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.sous-onglet'), function (b) {
      b.click();
      debordements(doc, fen, LARGEUR).forEach(function (n) { sortis.push(n); });
    });
    v.egal(sortis.length, 0, 'rien ne déborde de 320 px sur les trois onglets');

    /* ---- le choix ne survit PAS à une réouverture ---- */
    var tous = doc.querySelectorAll('.sous-onglet');
    if (tous.length > 2) tous[2].click();
    fen.App.ui.vider(vue);
    fen.App.vues.suivi.rendre(vue);
    tous = doc.querySelectorAll('.sous-onglet');
    v.egal(tous.length > 2 ? tous[2].getAttribute('aria-pressed') : '(aucun onglet)',
           'true',
           '[temoin] un re-rendu dans la même session garde l’onglet : c’est '
         + 'une lecture en cours, on ne la jette pas sous les doigts');

    rangerSousOnglet(doc);
    fen.App.ui.vider(vue);
    fen.App.store.etat().seances = [];
  });

  /* ------------------------------------------------------------------
     LE NOM D'UNE SÉANCE VALIDE CE QU'IL CONTIENT

     MB, 28/10 : « je valide le nom qui a les exos à l'intérieur, et on est
     bien ». Le ✓ de l'en-tête est le geste principal ; ouvrir la carte sert
     à corriger une valeur, pas à faire le travail.
     ------------------------------------------------------------------ */
  bloc('Le nom d’une séance valide ses exercices', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.seances = [];
    e.routineRecup = null;
    e.routinesRecup = [];

    /* MEMES ENVELOPPES : sur 1.39.0 ces fonctions n'existent pas, et
       l'ecran ne rend aucune carte. Chaque controle doit tomber avec SA
       valeur plutot que d'emporter ses voisins. */
    var m = fen.App.m;
    function ajout(nom) {
      return m.ajouterRoutineRecup ? m.ajouterRoutineRecup(e, nom)
                                   : { id: 'absent-' + nom, nom: nom, exercices: [] };
    }
    function dujour(et) { return m.recupsDuJour ? m.recupsDuJour(et) : []; }
    var r1 = ajout('Récup poignet');
    r1.exercices = [
      m.exerciceProgramme({ nom: 'Side pressure', typeCharge: 'elastique',
        colonnes: ['reps'], series: [{ repsCible: '50' }, { repsCible: '50' },
                                     { repsCible: '50' }, { repsCible: '50' }] }),
      m.exerciceProgramme({ nom: 'Extension poignet', typeCharge: 'elastique',
        colonnes: ['reps'], series: [{ repsCible: '30' }] })
    ];
    var r2 = ajout('Récup coude');
    r2.exercices = [m.exerciceProgramme({ nom: 'Pronation lente',
      typeCharge: 'elastique', colonnes: ['reps'], series: [{ repsCible: '20' }] })];

    fen.App.vues.recup.rendre(vue);

    /* ---- deux cartes, nommées, repliées ---- */
    var cartes = doc.querySelectorAll('.recup-seance');
    v.egal(cartes.length, 2, 'deux séances font deux cartes');
    v.egal(Array.prototype.map.call(doc.querySelectorAll('.recup-seance-nom b'),
             function (b) { return b.textContent; }).join(' / '),
           'Récup poignet / Récup coude', 'et chacune porte son nom');
    v.egal(doc.querySelectorAll('.recup-corps').length, 0,
           'À DEUX, elles sont repliées : le nom suffit à valider, ouvrir '
         + 'ne sert qu’à corriger');
    v.egal(doc.querySelectorAll('.recup-exo').length, 0,
           '[temoin] donc aucune ligne d’exercice n’est peinte');
    v.vrai(doc.body.textContent.indexOf('0 / 2 séances faites') >= 0,
           'l’en-tête compte les SÉANCES — et il accorde : « séances '
         + 'faites », pas « séances faite »');

    /* ---- le ✓ de la tête est atteignable au doigt ---- */
    var oks = doc.querySelectorAll('.recup-seance > .recup-seance-tete .serie-ok');
    v.egal(oks.length, 2, 'chaque carte a son ✓');
    var mini = 9999;
    Array.prototype.forEach.call(oks, function (o) {
      var r = o.getBoundingClientRect();
      mini = Math.min(mini, Math.min(r.width, r.height));
    });
    v.vrai(mini >= 44, 'et il garde 44 px (' + Math.round(mini) + ' px)');

    /* ---- UN appui sur le nom, et TOUT est fait ---- */
    if (oks.length) oks[0].click();
    var e2 = fen.App.store.etat();
    var jours = dujour(e2);
    v.egal(jours.length, 1, 'le ✓ fait entrer UNE journée au journal');
    v.egal(jours.length ? jours[0].routineNom : '', 'Récup poignet',
           'et elle porte le nom de la séance validée');
    var faites = 0, total = 0;
    (jours[0] || { exercices: [] }).exercices.forEach(function (ex) {
      (ex.series || []).forEach(function (s) { total += 1; if (s.faite) faites += 1; });
    });
    v.egal(faites + '/' + total, '5/5',
           'les CINQ séries des deux exercices sont cochées d’un seul appui '
         + 'sur le nom — « je valide le nom qui a les exos à l’intérieur »');
    v.vrai(doc.body.textContent.indexOf('1 / 2 séances faites') >= 0,
           'l’en-tête passe à « 1 / 2 séances faites »');

    var c0 = doc.querySelectorAll('.recup-seance')[0];
    v.vrai(!!c0 && c0.classList.contains('faite'), 'la carte validée se marque');
    var ok0 = c0 && c0.querySelector('.recup-seance-tete .serie-ok');
    var c1 = doc.querySelectorAll('.recup-seance')[1];
    var ok1 = c1 && c1.querySelector('.recup-seance-tete .serie-ok');
    v.vrai(!!ok0 && !!ok1
           && fen.getComputedStyle(ok0).backgroundColor
              !== fen.getComputedStyle(ok1).backgroundColor,
           'et son ✓ ne se confond pas avec celui de l’autre séance');

    /* L'AUTRE SÉANCE N'A PAS BOUGÉ : c'est tout l'intérêt de les séparer. */
    v.egal(m.recupDuJour ? m.recupDuJour(e2, null, r2.id) : null, null,
           'l’autre séance reste intouchée — valider l’une ne valide pas '
         + 'l’autre');

    /* ---- le nom déplie ---- */
    var nom1 = doc.querySelectorAll('.recup-seance-nom')[1];
    if (nom1) nom1.click();
    v.egal(doc.querySelectorAll('.recup-corps').length, 1,
           'appuyer sur le nom déplie SA carte, et elle seule');
    v.vrai(doc.body.textContent.indexOf('Pronation lente') >= 0,
           'et on y voit ses exercices');

    /* ---- un second appui défait ---- */
    /* MON ATTENTE ETAIT FAUSSE, PAS LE CODE. Décocher ne retire PAS la
       journée tant qu'une valeur y reste saisie — cocher a rempli les
       réels depuis les cibles, et ils restent. C'est une règle écrite
       depuis le premier jour, et le banc la tenait déjà ailleurs. Ce qui
       doit redescendre, c'est le COMPTE de séances faites. */
    var okA = doc.querySelectorAll('.recup-seance > .recup-seance-tete .serie-ok')[0];
    if (okA) okA.click();
    v.vrai(doc.body.textContent.indexOf('0 / 2 séances faites') >= 0,
           'un second appui défait la séance : l’en-tête redescend à '
         + '« 0 / 2 séances faites »');
    v.egal(dujour(fen.App.store.etat()).length, 1,
           '[temoin] la journée RESTE au journal : les valeurs saisies par '
         + 'le ✓ y demeurent, et une journée qui porte des chiffres n’est '
         + 'pas vide');

    v.egal(debordements(doc, fen, LARGEUR).join(' · '), '',
           'rien ne déborde de 320 px');

    fen.App.ui.vider(vue);
    var fin = fen.App.store.etat();
    fin.seances = [];
    fin.routinesRecup = [];
    fin.routineRecup = null;
  });

  bloc('Récupération', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    e.seances = [];
    e.routineRecup = null;
    e.routinesRecup = [];

    /* --- rien de défini ---
       MISE A JOUR DU 28/10 : plusieurs seances nommees, donc le libelle
       parle d'une PREMIERE seance et non d'une routine unique. */
    fen.App.vues.recup.rendre(vue);
    v.vrai(!!doc.querySelector('button'), 'l’écran vide propose un bouton');
    v.vrai(doc.body.textContent.indexOf('Définir ma première séance') >= 0,
           'et il invite à définir la PREMIÈRE séance — il peut y en avoir '
         + 'plusieurs depuis le 28/10');
    v.egal(doc.querySelectorAll('.recup-exo').length, 0, 'aucune ligne à cocher');
    v.egal(doc.querySelectorAll('.recup-seance').length, 0, 'et aucune carte');

    /* --- une séance de deux exercices ---
       Elle est posee par l'ANCIENNE cle : c'est la migration qu'on mesure
       au passage, et elle doit la faire entrer dans la liste. */
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

    v.egal(doc.querySelectorAll('.recup-seance').length, 1,
           'l’ancienne clé `routineRecup` devient UNE carte : la migration '
         + 'ne jette rien');
    v.egal(fen.App.m.routinesRecup(e).length, 1, 'et elle entre dans la liste');
    v.vrai(doc.body.textContent.indexOf('Modifier') >= 0,
           '[temoin] une seule séance reste DÉPLIÉE — l’écran d’avant ne '
         + 'gagne pas un appui ; le bouton « Modifier » n’est visible '
         + 'qu’ouverte');

    var exos = doc.querySelectorAll('.recup-exo');
    v.egal(exos.length, 2, 'la séance se présente déjà prête : une ligne par exercice');
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
    /* « TOUT MARQUER FAIT » A DISPARU le 28/10, et son geste est passé sur
       le NOM de la séance : MB, « je valide le nom qui a les exos à
       l'intérieur ». Un bouton de moins, et le geste est au même endroit
       que ce qu'il valide. */
    v.egal(doc.body.textContent.indexOf('Tout marquer fait'), -1,
           'plus de bouton « Tout marquer fait » : son geste vit sur le nom '
         + 'de la séance');
    var btTout = doc.querySelector('.recup-seance > .recup-seance-tete .serie-ok');
    v.vrai(!!btTout, 'le ✓ du nom coche toute la séance d’un geste');
    if (btTout) btTout.click();
    v.egal(fen.App.m.compteRecup(fen.App.store.etat().seances[0]).faits, 2,
           'et il coche bien les deux');
    /* IL N'Y A PLUS DE LIBELLE QUI CHANGE : c'est le MÊME ✓ qui bascule, et
       ce qui change est son ÉTAT. Un bouton qui se renomme demandait de
       lire ; un ✓ qui se dore se voit. */
    var teteOk = doc.querySelector('.recup-seance > .recup-seance-tete .serie-ok');
    v.egal(teteOk ? teteOk.getAttribute('aria-pressed') : '(absent)', 'true',
           'une fois tout fait, le ✓ du nom est marqué — c’est son ÉTAT qui '
         + 'change, plus un libellé à lire');
    v.vrai(!!doc.querySelector('.recup-seance.faite'),
           'et la carte de la séance se dore');

    v.egal(debordements(doc, fen, LARGEUR).join(' · '), '',
           'et rien ne sort de l’écran à 320 px ' + '— mesuré au BORD DROIT des éléments, pas au scrollWidth, que « overflow-x: hidden » rend toujours vert');

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

  /* ---------------------------------------------------------------
     NOTER UN SPARRING DEPUIS SEANCE

     MB, 27/10 : « en rajouter un c'est dans journal, c'est peu intuitif,
     ptete faire un onglet special sparring ? » Un septieme onglet ne tient
     pas — mesure dans le bloc « Barre d'onglets a 320 px » : les six
     occupent deja 318 px sur 320. Le geste entre donc dans Seance, qui est
     l'ecran ou l'on vient pour s'entrainer, et RESTE dans Journal.
     --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     UNE JOURNEE DE RECUP SE SUPPRIME

     MB, 28/10 : « je n'avais pas la possibilite de le supprimer par la
     suite, stuck en plus dans le journal ». Reproduit, et c'etait dans le
     code : `carteRecup` rendait un `div` avec `cursor:default` quand muscu
     et sparring rendaient des cartes cliquables. Aucun autre ecran ne
     montre une journee passee — l'onglet Recup ne presente que le jour
     courant. Elle etait donc DEFINITIVE.
     --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     LE MINUTEUR D'UN EXERCICE EN DUREE

     MB, 28/10 : « un exo avec juste du temps (par exemple 60 sec) : je n'ai
     pas un timer qui fait les 60 sec, c'est primordial […] en plus du timer
     de repos ». Affichage A, choisi apres avoir clique les trois
     simulations : un ▶ sur la ligne, entre la duree et le ✓.
     --------------------------------------------------------------- */
  bloc('Minuteur d’un exercice en durée', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var m = fen.App.m;
    var e = fen.App.store.etat();
    e.seances.length = 0;
    e.programmes.length = 0;
    e.seanceEnCoursId = null;

    var prog = m.programme('Essai');
    var enDuree = m.exerciceProgramme({ nom: 'Tenue en cup', colonnes: ['duree'] });
    enDuree.series = [m.serieProgramme({ dureeCible: 60 }),
                      m.serieProgramme({ dureeCible: 60 })];
    var sansDuree = m.exerciceProgramme({ nom: 'Curl',
                                          colonnes: ['charge', 'reps'] });
    sansDuree.series = [m.serieProgramme({ chargeCible: 20, repsCible: 10 })];
    prog.exercices = [enDuree, sansDuree];
    e.programmes.push(prog);
    var se = m.seanceMuscu(prog);
    e.seances.push(se);
    e.seanceEnCoursId = se.id;

    fen.App.vues.seance.rendre(vue);

    function ranger() {
      fen.App.ui.chrono.arreter();
      return attendre(80).then(function () {
        fen.App.ui.vider(vue);
        var st = fen.App.store.etat();
        st.seances.length = 0;
        st.programmes.length = 0;
        st.seanceEnCoursId = null;
      });
    }

    return attendre(260).then(function () {
      var blocs = Array.prototype.slice.call(vue.querySelectorAll('.series'));
      v.egal(blocs.length, 2, '[temoin] les deux exercices sont à l’écran');
      if (blocs.length < 2) return ranger();

      var gos = blocs[0].querySelectorAll('.serie-go');
      v.egal(gos.length, 2,
             'un exercice en durée porte un ▶ PAR SÉRIE');
      v.egal(blocs[1].querySelectorAll('.serie-go').length, 0,
             'et un exercice SANS durée n’en porte aucun — sa ligne ne '
           + 'change pas d’un pixel');
      /* RIEN A MESURER : on sort en le DISANT, au lieu de planter sur
         `gos[0]` et d'emporter le reste du bloc. Quatrieme fois de la
         session que cette forme se paie. */
      if (!gos.length) return ranger();

      /* L'EN-TETE SUIT, sinon tout glisse d'un cran. */
      var e1 = blocs[0].parentNode.querySelector('.serie-entete')
            || vue.querySelectorAll('.serie-entete')[0];
      v.vrai(!!e1 && e1.className.indexOf('a-minuteur') >= 0,
             'l’en-tête porte la même colonne que les lignes');

      v.vrai(gos[0].getBoundingClientRect().height >= 44,
             'le ▶ se touche au pouce ('
           + Math.round(gos[0].getBoundingClientRect().height) + ' px)');

      /* LE PRIX DE LA SIXIEME COLONNE, mesure sur la ligne reelle : le plus
         petit champ de saisie doit tenir les 40 px du banc. */
      var mini = Infinity;
      Array.prototype.forEach.call(blocs[0].querySelectorAll('.serie .champ'),
        function (c) {
          var w = c.getBoundingClientRect().width;
          if (w > 0 && w < mini) mini = w;
        });
      v.vrai(mini === Infinity || mini >= 40,
             'et le champ de saisie tient les 40 px malgré la colonne de '
           + 'plus (' + (mini === Infinity ? '—' : Math.round(mini) + ' px') + ')');

      /* L'EFFET : le chrono part, avec la duree ET le nom. */
      gos[0].click();
      return attendre(220).then(function () {
        var ch = doc.querySelector('.chrono');
        v.vrai(!!ch && doc.body.classList.contains('chrono-ouvert'),
               'un appui LANCE le chronomètre');
        v.egal(ch ? ch.querySelector('.chrono-quoi').textContent : '',
               'Tenue en cup · 60 s',
               'il dit QUOI et COMBIEN — sans quoi on ne sait pas si c’est '
             + 'le travail ou le repos qui tourne');
        v.egal(ch ? ch.querySelector('.chrono-temps').textContent : '', '1:00',
               'et il part de la durée de la série, pas du repos');
        v.egal(gos[0].getAttribute('aria-pressed'), 'true',
               'le ▶ montre qu’il tourne');

        gos[0].click();
        return attendre(200).then(function () {
          v.egal(doc.body.classList.contains('chrono-ouvert'), false,
                 'un second appui l’arrête');
          v.egal(gos[0].getAttribute('aria-pressed'), 'false',
                 'et le ▶ le montre aussi');

          /* AUCUNE DUREE NOTEE : il le DIT au lieu de rester gris. C'est la
             lecon du bouton « Choisir dans mon equipement ». */
          var st = fen.App.store.etat();
          st.seances[0].exercices[0].series.forEach(function (x) {
            x.dureeCible = null;
            x.dureeReel = null;
          });
          fen.App.vues.seance.rendre(vue);
          return attendre(260).then(function () {
            var g2 = vue.querySelectorAll('.serie-go')[0];
            v.vrai(!!g2, '[temoin] le ▶ est toujours là sans durée notée');
            if (g2) g2.click();
            return attendre(220).then(function () {
              v.egal(doc.body.classList.contains('chrono-ouvert'), false,
                     'sans durée notée, rien ne part');
              var t = doc.querySelector('.toast');
              v.vrai(!!t && t.textContent.indexOf('durée') >= 0,
                     'et il le DIT : « ' + (t ? t.textContent : 'rien')
                   + ' »');
              return ranger();
            });
          });
        });
      });
    });
  });

  bloc('Une journée de récup se supprime', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    var depart = e.seances.length;

    var routine = fen.App.m.routineRecupVierge();
    routine.exercices = [fen.App.m.exerciceProgramme({
      nom: 'Extenseurs à élastique',
      /* REPS SEULES : avec les colonnes par defaut (charge + reps) le texte
         devient « — × 50 », et ce n'est pas ce qu'on mesure ici. */
      colonnes: ['reps']
    })];
    /* QUATRE SERIES DE 50 REPS : le decor de MB, celui qui ne s'affichait
       que comme « 50 reps » avant le 28/10. */
    routine.exercices[0].series = [0, 1, 2, 3].map(function () {
      return fen.App.m.serieProgramme({ repsCible: 50 });
    });
    var jour = fen.App.m.seanceRecup(routine);
    (jour.exercices[0].series || []).forEach(function (sr) {
      sr.repsReel = '50';
      sr.faite = true;
    });
    e.seances.push(jour);

    fen.App.vues.journal.rendre(vue);

    function ranger() {
      Array.prototype.forEach.call(doc.querySelectorAll('.panneau'), function (p) {
        var x = p.querySelector('.panneau-entete .bt-icone');
        if (x) x.click();
      });
      return attendre(80).then(function () {
        var l = fen.App.store.etat().seances;
        for (var k = l.length - 1; k >= 0; k--) {
          if (l[k].id === jour.id) l.splice(k, 1);
        }
        fen.App.ui.vider(vue);
      });
    }

    return attendre(200).then(function () {
      /* LE SPARRING A QUITTE CET ECRAN le 28/10 : il vit sur Seance. */
      v.egal(vue.textContent.indexOf('Noter un sparring'), -1,
             'le Journal ne propose plus de noter un sparring — le geste vit '
           + 'sur l’écran Séance, et un geste à deux endroits ne dit pas '
           + 'lequel est le bon');

      /* LA CARTE PORTE LE NOM DE SA SEANCE depuis le 28/10 : deux seances
         de recup le meme jour seraient sinon indiscernables au journal. */
      var carte = null;
      Array.prototype.forEach.call(vue.querySelectorAll('.item'), function (n) {
        if (!carte && n.textContent.indexOf(routine.nom) >= 0) carte = n;
      });
      v.vrai(!!carte, '[temoin] la journée de récup est bien au journal');
      v.vrai(!!carte && carte.textContent.indexOf(routine.nom) >= 0,
             'et elle est titrée du NOM de la séance — « ' + routine.nom
           + ' » — et non du mot générique : deux séances le même jour '
           + 'doivent se distinguer');
      if (!carte) return ranger();

      /* LE NOMBRE DE SERIES, SUR LA CARTE. MB, 28/10 : « je ne vois que
         l'exo >> 50 reps, et c'est tout ». Elle lisait la PREMIERE série. */
      v.vrai(carte.textContent.indexOf('4 × 50 reps') >= 0,
             'la carte dit COMBIEN de séries, pas seulement la première : '
           + '« 4 × 50 reps »');

      carte.click();
      return attendre(220).then(function () {
        var pan = doc.querySelector('.panneau');
        v.vrai(!!pan,
               'un appui l’OUVRE — avant le 28/10 la carte était un div '
             + 'inerte, et la journée était définitive');
        if (!pan) return ranger();

        var sup = Array.prototype.filter.call(pan.querySelectorAll('button'),
          function (b) { return b.textContent.indexOf('Supprimer cette journ') === 0; })[0];
        v.vrai(!!sup, 'et la fiche offre de la supprimer');
        if (!sup) return ranger();

        /* DEUX APPUIS, comme partout ailleurs : un seul effacerait une
           journee sur un faux contact. */
        sup.click();
        return attendre(140).then(function () {
          v.egal(fen.App.store.etat().seances.length, depart + 1,
                 'un PREMIER appui ne supprime rien');
          var enc = Array.prototype.filter.call(
            doc.querySelectorAll('.panneau button'),
            function (b) { return b.textContent.indexOf('Appuyer encore') >= 0; })[0];
          v.vrai(!!enc, 'il demande confirmation');
          if (enc) enc.click();
          return attendre(260).then(function () {
            v.egal(fen.App.store.etat().seances.length, depart,
                   'le second la supprime pour de bon');
            return ranger();
          });
        });
      });
    });
  });

  bloc('Noter un sparring depuis Séance', function (v, h) {
    var fen = h.fen, doc = h.doc;
    var vue = doc.getElementById('vue');
    var e = fen.App.store.etat();
    var avant = e.seances.length;

    fen.App.vues.seance.rendre(vue);

    return attendre(200).then(function () {
      function boutons() {
        return Array.prototype.map.call(vue.querySelectorAll('button'),
          function (b) { return b.textContent.trim(); });
      }
      var bt = null;
      Array.prototype.forEach.call(vue.querySelectorAll('button'), function (b) {
        if (!bt && b.textContent.indexOf('Noter un sparring') > 0) bt = b;
      });
      v.vrai(!!bt,
             'l’écran Séance propose de noter un sparring — sans quoi il '
           + 'faut le chercher dans Journal : « ' + boutons().join(' | ') + ' »');
      if (!bt) { fen.App.ui.vider(vue); return; }
      v.vrai(bt.getBoundingClientRect().height >= 44,
             'et il se touche au pouce ('
           + Math.round(bt.getBoundingClientRect().height) + ' px)');
      v.vrai(vue.textContent.indexOf('Démarrer une séance libre') >= 0,
             '[temoin] le démarrage d’une séance libre est toujours là — '
           + 'on AJOUTE un chemin, on n’en retire pas');

      /* ET IL OUVRE VRAIMENT LA FICHE : l'effet, pas la declaration. */
      bt.click();
      return attendre(220).then(function () {
        var pan = doc.querySelector('.panneau');
        v.vrai(!!pan, 'un appui ouvre la fiche du sparring');
        var dedans = pan ? pan.textContent : '';
        v.vrai(dedans.indexOf('Sparring') >= 0 || dedans.indexOf('sparring') >= 0,
               'et c’est bien celle du sparring : « '
             + (pan ? pan.getAttribute('aria-label') : '?') + ' »');

        /* CE QUE L'APP PROMET VRAIMENT : le sparring s'enregistre A MESURE
           — chaque champ sauve a la frappe — donc fermer le GARDE. Ma
           premiere ecriture attendait l'inverse et elle est tombee ; c'est
           elle qui avait tort, pas l'app.

           L'ASPERITE RESTE, et elle est nommee : sur un sparring NEUF la
           fiche n'offre aucun « Supprimer » (il n'apparait qu'a l'edition
           d'un existant). Un appui par erreur laisse donc une ligne au
           journal. Le bouton pose sur Seance le 27/10 rend cet appui plus
           facile — raison de plus pour que ce controle le DISE. */
        /* LA CROIX, SUR UN SPARRING OU RIEN N'EST ECRIT. MB, 27/10 :
           « ne doit rien laisser ». Jusque-la elle laissait une ligne vide
           au journal, et la fiche d'un sparring NEUF n'offre aucun
           « Supprimer » — il fallait aller le retirer depuis Journal. */
        v.egal(dedans.indexOf('Supprimer'), -1,
               '[temoin] un sparring NEUF n’offre pas de le retirer d’ici — '
             + 'c’est pourquoi la croix doit le faire');
        var x = pan && pan.querySelector('.panneau-entete .bt-icone');
        if (x) x.click();
        return attendre(200).then(function () {
          v.egal(fen.App.store.etat().seances.length, avant,
                 'fermer sans RIEN écrire ne laisse aucune ligne au journal');

          /* MAIS CE QU'ON A ECRIT RESTE. Sans ce second cas, la correction
             pourrait tout effacer et le controle d'au-dessus serait vert. */
          bt.click();
          return attendre(220).then(function () {
            var p2 = doc.querySelector('.panneau');
            var club = p2 && p2.querySelector('input.champ[placeholder]');
            v.vrai(!!club, '[temoin] la fiche se rouvre avec son champ Club');
            if (club) {
              club.value = 'Club du banc';
              club.dispatchEvent(new fen.Event('input', { bubbles: true }));
            }
            var x2 = p2 && p2.querySelector('.panneau-entete .bt-icone');
            if (x2) x2.click();
            return attendre(200).then(function () {
              var l = fen.App.store.etat().seances;
              v.egal(l.length, avant + 1,
                     'alors qu’un sparring où l’on a écrit UN mot est GARDÉ : '
                   + 'il s’enregistre à mesure');
              l.splice(l.length - 1, 1);
              fen.App.ui.vider(vue);
            });
          });
        });
      });
    });
  });

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
    v.egal(debordements(doc, fen, LARGEUR).join(' · '), '',
           'et rien de la séance ne sort de l’écran ' + '— mesuré au BORD DROIT des éléments, pas au scrollWidth, que « overflow-x: hidden » rend toujours vert');

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
