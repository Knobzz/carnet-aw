/* LA PAGE OÙ MB TRANCHE L'ÉQUIPEMENT.

   Elle montre les 24 types relevés sur les trois sites, avec les PHOTOS des
   produits — demande de MB du 27/10 : « il me faut du visuel ».

   Ce qu'un type DÉJÀ POSÉ ajoute est CALCULÉ par le modèle
   (`musclesDeLOutil`), jamais recopié : la page ne peut pas montrer autre
   chose que ce qui est livré. Ce qu'un CANDIDAT ajouterait est une
   proposition, et c'est écrit comme tel.

   Les décisions vivent dans une clé à part du navigateur, et un bouton les
   met au presse-papier. Cette page n'écrit JAMAIS dans le carnet. */
(function () {
  'use strict';

  var A = window.App, cat = window.CHOIX_OUTILS;
  var CLE = 'carnet-aw-choix-outils';

  var el = function (t, c, x) {
    var e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };

  var choix = {};
  var memoireOk = true;
  try { choix = JSON.parse(localStorage.getItem(CLE) || '{}') || {}; }
  catch (e) { memoireOk = false; }

  function retenir() {
    try { localStorage.setItem(CLE, JSON.stringify(choix)); }
    catch (e) { memoireOk = false; }
  }

  var LIBELLE = { oui: 'Je le garde', non: 'Je l’écarte', plus_tard: 'Plus tard' };

  function texteDesChoix() {
    return cat.TYPES.filter(function (t) { return choix[t.cle]; })
      .map(function (t) {
        return '- « ' + t.nom + ' » (' + t.cle + ') → ' + LIBELLE[choix[t.cle]];
      }).join('\n');
  }

  var tete = null;

  function majTete() {
    if (!tete) return;
    tete.textContent = '';
    var poses = cat.TYPES.filter(function (t) { return t.etat === 'pose'; }).length;
    var cand = cat.TYPES.length - poses;
    var decides = Object.keys(choix).filter(function (k) { return choix[k]; }).length;

    tete.appendChild(el('div', 'chiffre', cand + ' types à décider'));
    tete.appendChild(el('div', 'item-resume',
      '148 produits relevés sur trois sites — goldengrip 131, mithril 51, '
      + 'titangrip 37 — classés en ' + cat.TYPES.length + ' types : ' + poses
      + ' déjà posés dans le modèle, ' + cand + ' à trancher.'));
    tete.appendChild(el('div', 'item-resume' + (decides === cat.TYPES.length ? '' : ''),
      decides + ' décision(s) prise(s) sur ' + cat.TYPES.length + '.'));

    if (!memoireOk) {
      tete.appendChild(el('div', 'item-resume rouge',
        'Le navigateur refuse de retenir : copie tes choix avant de fermer.'));
    }

    var barre = el('div', 'barre-revue');
    if (decides) {
      var bt = el('button', null, 'Copier mes décisions');
      bt.type = 'button';
      bt.addEventListener('click', function () {
        var t = texteDesChoix();
        var secours = document.getElementById('secours');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t).then(function () {
            bt.textContent = 'Copié';
            setTimeout(function () { bt.textContent = 'Copier mes décisions'; }, 1400);
          }, function () { secours.hidden = false; secours.textContent = t; });
        } else {
          secours.hidden = false;
          secours.textContent = t;
        }
      });
      barre.appendChild(bt);
      var raz = el('button', null, 'Tout effacer');
      raz.type = 'button';
      raz.addEventListener('click', function () {
        choix = {}; retenir(); rendre();
      });
      barre.appendChild(raz);
    }
    tete.appendChild(barre);
  }

  function boutons(t) {
    var d = el('div', 'choix');
    ['oui', 'non', 'plus_tard'].forEach(function (v) {
      var b = el('button', 'cx' + (choix[t.cle] === v ? ' pris' : ''), LIBELLE[v]);
      b.type = 'button';
      b.addEventListener('click', function () {
        if (choix[t.cle] === v) delete choix[t.cle];
        else choix[t.cle] = v;
        retenir();
        rendre();
        var carte = document.getElementById('t-' + t.cle.replace(/\s+/g, '-'));
        if (carte) carte.scrollIntoView({ block: 'center' });
      });
      d.appendChild(b);
    });
    return d;
  }

  function rendre() {
    var sortie = document.getElementById('sortie');
    tete = document.getElementById('tete');
    sortie.textContent = '';
    majTete();

    cat.TYPES.forEach(function (t) {
      var bloc = el('div', 'mvt');
      bloc.id = 't-' + t.cle.replace(/\s+/g, '-');
      if (choix[t.cle]) bloc.className += ' decide';

      var h = el('header');
      var titre = el('h2', null, t.nom);
      titre.appendChild(el('span', 'rang ' + (t.etat === 'pose' ? 'moteur' : 'deduit'),
        t.etat === 'pose' ? 'déjà posé' : 'à décider'));
      h.appendChild(titre);
      h.appendChild(el('div', 'geste', t.quoi));
      bloc.appendChild(h);

      /* Ce qu'il ajoute : CALCULÉ pour les posés, PROPOSÉ pour les autres. */
      var d = el('div', 'delta');
      if (t.etat === 'pose') {
        var ids = A.m.musclesDeLOutil([t.cle]);
        d.appendChild(el('span', 'et change', 'ajoute ' + ids.length + ' muscle(s)'));
        d.appendChild(el('span', 'et pareil',
          ids.map(function (id) { return A.m.nomCourtMuscle(id); }).join(', ')));
      } else {
        d.appendChild(el('span', 'et change', 'ce que j’ajouterais'));
      }
      bloc.appendChild(d);

      if (t.propose) bloc.appendChild(el('div', 'note', t.propose));

      /* LES PHOTOS. */
      var g = el('div', 'photos');
      t.produits.forEach(function (p) {
        var a = el('a', 'photo');
        a.href = p.u; a.target = '_blank'; a.rel = 'noreferrer';
        var img = el('img');
        img.src = p.i;
        img.alt = p.n;
        img.loading = 'lazy';
        img.addEventListener('error', function () {
          img.remove();
          a.appendChild(el('span', 'manque', '(photo absente chez le marchand)'));
        });
        a.appendChild(img);
        a.appendChild(el('span', null, p.n));
        g.appendChild(a);
      });
      bloc.appendChild(g);

      bloc.appendChild(boutons(t));
      sortie.appendChild(bloc);
    });

    var decides = Object.keys(choix).filter(function (k) { return choix[k]; }).length;
    document.title = decides + '/' + cat.TYPES.length + ' — Choix de l’équipement';
    window.__choix = {
      types: cat.TYPES.length,
      candidats: cat.TYPES.filter(function (t) { return t.etat === 'candidat'; }).length,
      photos: cat.TYPES.reduce(function (n, t) { return n + t.produits.length; }, 0),
      decides: decides
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rendre);
  } else {
    rendre();
  }
}());
