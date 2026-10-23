/* Rend la planche de revue À PARTIR DU DICTIONNAIRE LIVRÉ.

   Elle lisait d'abord le catalogue de revue — donc une COPIE de ce qui part
   sur le téléphone. C'est exactement le défaut que ce carnet a payé quatre
   fois le 2026-10-23 : deux moitiés qui décrivent la même chose et qui
   divergent. La planche parcourt donc `A.m.DICTIONNAIRE`, c'est-à-dire ce
   qui est livré, et va chercher dans `CATALOGUE` la citation de chaque
   muscle. Un muscle livré sans citation s'affiche EN ROUGE et compte dans
   « sans source » : la planche ne peut plus montrer autre chose que la
   vérité, ni taire un trou.

   Elle laisse RENOMMER (demande de MB, 2026-10-23). Les renommages ne
   touchent à rien : ils vivent dans une clé à part du navigateur, et un
   bouton les met au presse-papier pour qu'ils me soient rendus. La planche
   n'écrit JAMAIS dans le carnet. */
(function () {
  'use strict';

  var A = window.App, cat = window.CATALOGUE;
  var CLE = 'carnet-aw-revue';

  var el = function (t, c, x) {
    var e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };

  /* Les renommages, dans une clé à part. Si le navigateur refuse (mode
     privé, stockage bloqué), la planche marche quand même : on perd juste
     la mémoire entre deux chargements, et on le dit. */
  var memoire = {};
  var memoireOk = true;
  try { memoire = JSON.parse(localStorage.getItem(CLE) || '{}') || {}; }
  catch (e) { memoireOk = false; }

  function retenir() {
    try { localStorage.setItem(CLE, JSON.stringify(memoire)); }
    catch (e) { memoireOk = false; majBarre(); }
  }

  /* La fiche de revue d'un mouvement : le geste, les notes, et surtout les
     citations, repérées par le nom D'ORIGINE (un renommage ne doit pas
     faire perdre les sources). */
  function fiche(nom) {
    var l = cat.MOUVEMENTS.filter(function (x) { return x.nom === nom; });
    return l.length ? l[0] : null;
  }

  function citationDe(f, id) {
    if (!f) return null;
    var l = (f.muscles || []).concat(f.aDecider || [])
      .filter(function (x) { return x.id === id; });
    return l.length ? l[0] : null;
  }

  function rendreMuscle(id, e) {
    var m = A.m.muscle(id);
    var d = el('div', 'muscle');
    if (m && m.image) {
      var img = el('img');
      img.src = '../' + m.image;
      img.alt = m.nom;
      img.loading = 'lazy';
      d.appendChild(img);
    }
    var corps = el('div', 'corps');
    var nom = el('div', 'nom', m ? m.nom : '(' + id + ' — inconnu du carnet)');
    if (e) {
      var r = cat.RANGS[e.rang] || { nom: e.rang };
      nom.appendChild(el('span', 'rang ' + e.rang, r.nom));
    }
    corps.appendChild(nom);
    if (m && m.latin) corps.appendChild(el('div', 'qui', m.latin));

    if (e && e.cite) {
      corps.appendChild(el('div', 'cite', '« ' + e.cite + ' »'));
    } else if (e && e.deDeux) {
      var dd = el('div', 'deux');
      dd.appendChild(el('span', null, 'Déduit de deux faits cités :'));
      var ul = el('ul');
      e.deDeux.forEach(function (f) { ul.appendChild(el('li', null, f)); });
      dd.appendChild(ul);
      corps.appendChild(dd);
    }

    var qui = el('div', 'qui');
    if (e && e.source) {
      var a = el('a', null, e.source.qui
        + (e.source.revu ? ' · revu le ' + e.source.revu : ''));
      a.href = e.source.lien;
      a.target = '_blank';
      a.rel = 'noreferrer';
      qui.appendChild(a);
    } else {
      qui.appendChild(el('span', 'manque',
        'LIVRÉ SANS SOURCE — à sourcer avant la livraison'));
    }
    corps.appendChild(qui);
    d.appendChild(corps);
    return d;
  }

  var barre = null, compteurs = null;

  function majBarre() {
    var n = Object.keys(memoire).length;
    compteurs.textContent = n
      ? n + ' renommage(s) en attente'
      : 'Aucun renommage. Modifie un nom ou ses autres écritures pour en poser un.'
        + (memoireOk ? '' : ' — le navigateur refuse de les retenir entre deux chargements.');
    barre.hidden = false;
  }

  function texteDesRenommages() {
    return Object.keys(memoire).map(function (k) {
      var v = memoire[k];
      var bouts = [];
      if (v.nom && v.nom !== k) bouts.push('nom : ' + v.nom);
      if (v.aussi != null) bouts.push('autres écritures : ' + v.aussi);
      return '- « ' + k +' » → ' + bouts.join(' · ');
    }).join('\n');
  }

  function champ(valeur, etiquette, surChange) {
    var l = el('label', 'ligne-champ');
    l.appendChild(el('span', 'etiq', etiquette));
    var i = document.createElement('input');
    i.type = 'text';
    i.className = 'champ champ-revue';
    i.value = valeur;
    i.addEventListener('input', function () { surChange(i.value); });
    l.appendChild(i);
    return l;
  }

  function rendre() {
    var sortie = document.getElementById('sortie');
    var sansSource = 0, cites = 0, deduits = 0, muscles = 0;

    A.m.DICTIONNAIRE.forEach(function (d) {
      var f = fiche(d.nom);
      var bloc = el('div', 'mvt');

      var h = el('header');
      var memo = memoire[d.nom] || {};
      h.appendChild(champ(memo.nom != null ? memo.nom : d.nom,
        'Nom du mouvement', function (v) {
          memo.nom = v;
          memoire[d.nom] = memo;
          if ((memo.nom == null || memo.nom === d.nom) && memo.aussi == null) {
            delete memoire[d.nom];
          }
          retenir();
          majBarre();
        }));
      h.appendChild(champ(memo.aussi != null ? memo.aussi : (d.aussi || []).join(', '),
        'Autres écritures (séparées par des virgules)', function (v) {
          memo.aussi = v;
          memoire[d.nom] = memo;
          retenir();
          majBarre();
        }));
      if (f && f.geste) h.appendChild(el('div', 'geste', f.geste));
      bloc.appendChild(h);

      var delta = el('div', 'delta');
      delta.appendChild(el('span', 'et pareil', 'ce qui sera livré'));
      delta.appendChild(el('span', 'et',
        d.muscles.map(A.m.nomCourtMuscle).join(', ')));
      bloc.appendChild(delta);

      /* On parcourt LES MUSCLES LIVRÉS, pas ceux de la fiche de revue : si
         un muscle entre au dictionnaire sans citation, il se voit. */
      d.muscles.forEach(function (id) {
        var e = citationDe(f, id);
        muscles++;
        if (!e || !e.source) sansSource++;
        else if (e.cite) cites++;
        else if (e.deDeux) deduits++;
        bloc.appendChild(rendreMuscle(id, e));
      });

      if (f && f.note) bloc.appendChild(el('div', 'note', f.note));
      (f && f.aDecider || []).forEach(function (e) {
        if (d.muscles.indexOf(e.id) >= 0) return;   /* déjà tranché, déjà livré */
        var b = el('div', 'decider');
        b.appendChild(el('b', null, 'À décider : ' + (A.m.muscle(e.id) || {}).nom));
        b.appendChild(el('div', null, e.pourquoi));
        bloc.appendChild(b);
      });
      sortie.appendChild(bloc);
    });

    var tete = document.getElementById('tete');
    tete.appendChild(el('div', 'chiffre ' + (sansSource ? 'rouge' : 'vert'),
      A.m.DICTIONNAIRE.length + ' mouvements'));
    tete.appendChild(el('div', 'item-resume',
      muscles + ' muscles livrés · ' + cites + ' cités mot pour mot, '
      + deduits + ' déduits et dits comme tels, ' + sansSource + ' sans source.'));

    barre = el('div', 'barre-revue');
    compteurs = el('div', 'item-resume');
    barre.appendChild(compteurs);
    var bt = el('button', 'bouton bouton-plein', 'Copier les renommages');
    bt.addEventListener('click', function () {
      var t = texteDesRenommages();
      if (!t) { bt.textContent = 'Rien à copier'; return; }
      var fini = function (ok) {
        bt.textContent = ok ? 'Copié — colle-le-moi' : 'Copie refusée, sélectionne le texte';
        setTimeout(function () { bt.textContent = 'Copier les renommages'; }, 2500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () { fini(true); },
                                              function () { fini(false); });
      } else { fini(false); }
      var pre = document.getElementById('secours');
      pre.textContent = t;
      pre.hidden = false;
    });
    barre.appendChild(bt);
    tete.appendChild(barre);
    majBarre();

    document.title = (sansSource ? '✗ ' : '✓ ') + A.m.DICTIONNAIRE.length
      + ' mouvements — Dictionnaire';
    document.getElementById('chapeau').textContent =
      'Lot ' + cat.lot + ' — ' + cat.titre + '. Ce qui sera LIVRÉ, muscle par '
      + 'muscle, avec d’où ça vient. Les noms sont modifiables ; rien n’est '
      + 'écrit dans le carnet.';

    var leg = document.getElementById('legende');
    leg.appendChild(el('b', null, 'Les quatre rangs'));
    var ul = el('ul');
    ['moteur', 'aide', 'tient', 'deduit'].forEach(function (k) {
      var li = el('li');
      li.appendChild(el('span', 'rang ' + k, cat.RANGS[k].nom));
      li.appendChild(el('span', null, ' ' + cat.RANGS[k].quoi));
      ul.appendChild(li);
    });
    leg.appendChild(ul);

    window.__planche = { mouvements: A.m.DICTIONNAIRE.length, muscles: muscles,
                         cites: cites, deduits: deduits, sansSource: sansSource,
                         renommages: Object.keys(memoire).length };
  }

  A.store.charger();
  rendre();
})();
