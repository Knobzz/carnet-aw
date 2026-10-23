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

  /* Ce que le carnet propose AUJOURD'HUI pour ce mouvement : on essaie le
     nom principal, puis ses autres ecritures, et on garde la premiere que
     le carnet comprend. Sert a montrer l'ECART sur un mouvement pas encore
     livre — c'est lui que MB valide. */
  function aujourdhui(d) {
    var noms = [d.nom].concat(d.aussi || []);
    for (var i = 0; i < noms.length; i++) {
      var l = A.m.musclesDuNom(noms[i]);
      if (l.length) return { par: noms[i], muscles: l };
    }
    return { par: null, muscles: [] };
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
    var sansSource = 0, cites = 0, deduits = 0, muscles = 0, aAjouter = 0;

    /* Le modele D'ABORD (ce qui est livre), puis ce que le catalogue
       propose et qui n'y est pas encore : sans ca, un LOT NEUF serait
       invisible sur la planche qui sert justement a le valider. */
    var lignes = A.m.DICTIONNAIRE.map(function (d) {
      return { nom: d.nom, aussi: d.aussi || [], muscles: d.muscles,
               livre: true };
    });
    cat.MOUVEMENTS.forEach(function (f) {
      var deja = A.m.DICTIONNAIRE.filter(function (d) {
        return d.nom === f.nom;
      }).length;
      if (deja) return;
      lignes.push({ nom: f.nom, aussi: f.aussi || [],
                    muscles: f.muscles.map(function (x) { return x.id; }),
                    livre: false, ecarte: f.ecarte || null });
    });

    var montrerLivres = false;
    try { montrerLivres = localStorage.getItem(CLE + '-livres') === 'oui'; }
    catch (e) { montrerLivres = false; }
    var masques = montrerLivres ? 0
      : lignes.filter(function (d) { return d.livre; }).length;
    var aLire = montrerLivres ? lignes
      : lignes.filter(function (d) { return !d.livre; });

    aLire.forEach(function (d) {
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
      delta.appendChild(el('span',
        'et ' + (d.livre ? 'pareil' : 'change'),
        d.livre ? 'livré'
                : (d.ecarte ? 'écarté → ' + d.ecarte : 'à ajouter')));
      delta.appendChild(el('span', 'et',
        d.muscles.map(A.m.nomCourtMuscle).join(', ')));
      /* Pour un mouvement pas encore livre, on montre AUSSI ce que le
         carnet repond aujourd'hui : c'est l'ecart que MB valide. */
      if (!d.livre) {
        var av = aujourdhui({ nom: d.nom, aussi: d.aussi });
        delta.appendChild(el('span', 'et',
          'aujourd’hui : ' + (av.muscles.length
            ? av.muscles.map(A.m.nomCourtMuscle).join(', ')
            : 'RIEN')));
        if (!d.ecarte) aAjouter++;
      }
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
      aLire.length + ' mouvement' + (aLire.length > 1 ? 's' : '')
      + (masques ? ' à trancher' : '')));
    var ecartes = aLire.filter(function (d) { return d.ecarte; }).length;
    tete.appendChild(el('div', 'item-resume',
      (masques ? masques + ' déjà validés, masqués · ' : '')
      + (ecartes ? ecartes + ' écarté(s) vers l’équipement · ' : '')
      + muscles + ' muscles · ' + cites + ' cités mot pour mot, '
      + deduits + ' déduits et dits comme tels, ' + sansSource + ' sans source.'));

    if (masques) {
      var btTout = el('button', 'bouton', 'Revoir les ' + masques + ' déjà validés');
      btTout.addEventListener('click', function () {
        try { localStorage.setItem(CLE + '-livres', 'oui'); } catch (e) {}
        location.reload();
      });
      tete.appendChild(btTout);
    } else if (lignes.some(function (d) { return d.livre; })) {
      var btMoins = el('button', 'bouton', 'Masquer les déjà validés');
      btMoins.addEventListener('click', function () {
        try { localStorage.removeItem(CLE + '-livres'); } catch (e) {}
        location.reload();
      });
      tete.appendChild(btMoins);
    }

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

    document.title = (sansSource ? '✗ ' : '✓ ') + aLire.length
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

    window.__planche = { mouvements: aLire.length, masques: masques,
                         aAjouter: aAjouter,
                         muscles: muscles,
                         cites: cites, deduits: deduits, sansSource: sansSource,
                         renommages: Object.keys(memoire).length };
  }

  A.store.charger();
  rendre();
})();
