/* Briques d'interface. Pas de confirm(), pas de alert() : ils sont inertes
   dans une WebView installée et la suppression ne partirait jamais. */
(function (A) {
  'use strict';

  function h(tag, props) {
    var e = document.createElement(tag), i, k;
    if (props) for (k in props) {
      if (!Object.prototype.hasOwnProperty.call(props, k)) continue;
      var v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'dataset') { for (var d in v) if (v[d] != null) e.dataset[d] = v[d]; }
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') e.value = v;
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    }
    for (i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x != null && x !== false) e.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
      else e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function vider(n) { while (n && n.firstChild) n.removeChild(n.firstChild); return n; }

  /* Le navigateur refuse la vibration tant que rien n'a ete touche, et le
     refus part en erreur dans la console. On attend donc la premiere touche. */
  var aTouche = false;
  (function () {
    function once() {
      aTouche = true;
      document.removeEventListener('pointerdown', once, true);
      document.removeEventListener('keydown', once, true);
    }
    document.addEventListener('pointerdown', once, true);
    document.addEventListener('keydown', once, true);
  })();

  function vibrer(motif) {
    if (!navigator.vibrate) return;
    /* hasBeenActive est le signal du navigateur lui-meme (activation
       « collante », qui ne retombe pas). Il est plus juste que notre drapeau :
       la vibration part a la FIN du repos, bien apres le ✓ qui l'a lancee,
       donc une activation transitoire ne conviendrait pas. */
    var ua = navigator.userActivation;
    if (ua && ua.hasBeenActive === false) return;
    if (!ua && !aTouche) return;
    try { navigator.vibrate(motif); } catch (e) {}
  }

  /* ---------- pile de surcouches et bouton Retour ----------
     Installée en plein écran, l'app n'a plus de chrome de navigateur : le
     Retour d'Android est le SEUL geste de retour disponible. Sans cette pile,
     il quitte l'app au lieu de fermer le panneau ouvert — et une séance en
     cours disparaît de l'écran au milieu d'un exercice.

     Chaque surcouche (panneau, feuille de choix) pousse une entrée d'historique
     en s'ouvrant. Le Retour en dépile une. Une fermeture par l'interface
     consomme l'entrée correspondante pour que les deux chemins restent alignés. */

  var pile = [];
  var sentinelle = false;   // une entree d'historique est posee pour les surcouches
  var ignorerPop = 0;
  var accordPlanifie = false;

  /* UNE seule entree d'historique, quelle que soit la profondeur de la pile, et
     elle est accordee en differe.

     La version directe (un pushState par ouverture, un history.back() par
     fermeture) avait une course : choisir dans une feuille la ferme ET ouvre
     un panneau dans le meme tic, si bien que le pushState du panneau partait
     avant que le back() de la feuille n'ait rendu la main. Resultat : le Retour
     suivant etait avale et le panneau restait ouvert.

     En differant l'accord d'un tic, la transition feuille -> panneau ne touche
     plus du tout a l'historique : la pile ne passe jamais par zero du point de
     vue de l'accord. */

  function accorder() {
    accordPlanifie = false;
    if (pile.length && !sentinelle) {
      try { history.pushState({ carnetSurcouche: 1 }, ''); sentinelle = true; } catch (e) {}
    } else if (!pile.length && sentinelle) {
      sentinelle = false;
      ignorerPop += 1;
      try { history.back(); } catch (e) { ignorerPop -= 1; }
    }
  }

  function planifierAccord() {
    if (accordPlanifie) return;
    accordPlanifie = true;
    setTimeout(accorder, 0);
  }

  function empiler(detruire) {
    var entree = { detruire: detruire };
    pile.push(entree);
    planifierAccord();
    return entree;
  }

  function depiler(entree) {
    var i = pile.indexOf(entree);
    if (i >= 0) pile.splice(i, 1);
    planifierAccord();
  }

  window.addEventListener('popstate', function () {
    if (ignorerPop > 0) { ignorerPop -= 1; return; }
    sentinelle = false;                 // le Retour vient de consommer l'entree
    var e = pile.pop();
    if (e) { e.detruire(); planifierAccord(); }   // s'il en reste, on en repose une
  });

  function svg(d, taille) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    if (taille) { s.setAttribute('width', taille); s.setAttribute('height', taille); }
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
    return s;
  }
  var CHEMIN_OK = 'M4 12.8 9.2 18 20 6.6';

  /* ---------- toast ---------- */
  var toastN = null, toastT = null;
  function toast(msg) {
    if (!toastN) {
      toastN = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(toastN);
    }
    toastN.textContent = msg;
    toastN.classList.add('visible');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastN.classList.remove('visible'); }, 2600);
  }

  /* ---------- confirmation en deux temps ----------
     Premier appui : le bouton s'arme et dit ce qui va arriver.
     Second appui dans les 4 s : l'action part. Sinon il se désarme tout seul. */
  function confirmer2(bouton, texteArme, action) {
    var libelle = bouton.textContent, t = null;
    function desarmer() {
      bouton.classList.remove('arme');
      bouton.textContent = libelle;
      bouton.dataset.arme = '';
      clearTimeout(t);
    }
    bouton.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (bouton.dataset.arme === '1') { desarmer(); action(); return; }
      bouton.dataset.arme = '1';
      bouton.classList.add('arme');
      bouton.textContent = texteArme;
      clearTimeout(t);
      t = setTimeout(desarmer, 4000);
    });
    return bouton;
  }

  /* ---------- feuille de choix (remplace prompt/confirm) ---------- */
  function feuille(titre, options) {
    var fond = h('div', { class: 'popo', role: 'dialog', 'aria-modal': 'true', 'aria-label': titre });
    var boite = h('div', { class: 'popo-feuille' }, h('h3', { text: titre }));
    options.forEach(function (o) {
      if (!o) return;
      var b = h('button', { class: 'bt bt-large' + (o.classe ? ' ' + o.classe : '') });
      if (o.lettre != null) b.appendChild(h('span', { class: 'popo-lettre', text: o.lettre }));
      b.appendChild(h('span', { text: o.nom }));
      b.addEventListener('click', function () { fermer(); o.action && o.action(); });
      boite.appendChild(b);
    });
    var annul = h('button', { class: 'bt bt-large bt-fantome', text: 'Annuler' });
    annul.addEventListener('click', fermer);
    boite.appendChild(annul);
    fond.appendChild(boite);
    fond.addEventListener('click', function (e) { if (e.target === fond) fermer(); });
    function esc(e) { if (e.key === 'Escape') fermer(); }

    var detruit = false;
    function detruire() {
      if (detruit) return;
      detruit = true;
      document.removeEventListener('keydown', esc);
      if (fond.parentNode) fond.parentNode.removeChild(fond);
    }
    function fermer() {
      if (detruit) return;
      detruire();
      depiler(entree);
    }

    document.addEventListener('keydown', esc);
    document.body.appendChild(fond);
    var entree = empiler(detruire);
    return fermer;
  }

  /* ---------- autocomplétion ----------
     Alimentée par le catalogue d'usage, jamais par une liste figée.
     Le champ garde le focus : on ne reconstruit que la liste déroulante. */
  function autocomplete(champ, fournisseur, surChoix) {
    var enrobe = h('div', { class: 'auto' });
    champ.parentNode.insertBefore(enrobe, champ);
    enrobe.appendChild(champ);
    var liste = h('div', { class: 'auto-liste', hidden: true, role: 'listbox' });
    enrobe.appendChild(liste);
    champ.setAttribute('autocomplete', 'off');
    champ.setAttribute('autocorrect', 'off');
    champ.setAttribute('spellcheck', 'false');

    function cacher() { liste.hidden = true; vider(liste); }

    function montrer() {
      var items = fournisseur(champ.value) || [];
      vider(liste);
      if (!items.length) { liste.hidden = true; return; }
      items.forEach(function (it) {
        var opt = h('button', { type: 'button', class: 'auto-opt', role: 'option' },
          h('b', { text: it.nom }),
          (it.jetons || []).map(function (j) {
            return h('span', { class: 'jeton ' + (j.classe || 'jeton-neutre'), text: j.texte });
          })
        );
        opt.addEventListener('mousedown', function (e) { e.preventDefault(); });
        opt.addEventListener('click', function () {
          champ.value = it.nom;
          cacher();
          surChoix && surChoix(it);
        });
        liste.appendChild(opt);
      });
      liste.hidden = false;
    }

    champ.addEventListener('input', montrer);
    champ.addEventListener('focus', montrer);
    champ.addEventListener('blur', function () { setTimeout(cacher, 160); });
    champ.addEventListener('keydown', function (e) { if (e.key === 'Escape') cacher(); });
    return enrobe;
  }

  /* ---------- chronomètre de repos ----------
     Horodatage absolu : il reste juste même si l'onglet est resté en veille. */
  var chrono = (function () {
    var noeud = null, temps = null, jauge = null, quoi = null;
    var finA = 0, duree = 0, tick = null, actif = false;

    function monter() {
      if (noeud) return;
      jauge = h('i');
      temps = h('div', { class: 'chrono-temps', text: '0:00' });
      quoi = h('div', { class: 'chrono-quoi' });
      var plus = h('button', { class: 'bt bt-petit', text: '+30 s' });
      plus.addEventListener('click', function () { finA += 30000; duree += 30000; rendre(); });
      var passer = h('button', { class: 'bt bt-petit bt-fantome', text: 'Passer' });
      passer.addEventListener('click', arreter);
      noeud = h('div', { class: 'chrono', role: 'timer', 'aria-live': 'off' },
        h('div', { class: 'chrono-corps' },
          h('div', { class: 'chrono-jauge' }, jauge),
          h('div', { class: 'chrono-rangee' }, temps, quoi, plus, passer)
        ));
      document.body.appendChild(noeud);
    }

    function rendre() {
      var reste = Math.max(0, finA - Date.now());
      var s = Math.ceil(reste / 1000);
      temps.textContent = Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
      jauge.style.width = (duree ? Math.max(0, reste / duree) * 100 : 0) + '%';
      if (reste <= 0) {
        arreter();
        vibrer([120, 70, 120]);   // fin du repos : on le sent sans regarder
      }
    }

    function demarrer(secondes, libelle) {
      if (!secondes || secondes <= 0) return;
      monter();
      duree = secondes * 1000;
      finA = Date.now() + duree;
      quoi.textContent = libelle || '';
      actif = true;
      noeud.classList.add('visible');
      document.body.classList.add('chrono-ouvert');
      clearInterval(tick);
      tick = setInterval(rendre, 200);
      rendre();
    }

    function arreter() {
      clearInterval(tick);
      actif = false;
      if (noeud) noeud.classList.remove('visible');
      document.body.classList.remove('chrono-ouvert');
    }

    return { demarrer: demarrer, arreter: arreter, actif: function () { return actif; } };
  })();

  /* ---------- garder l'écran allumé ----------
     Entre deux séries, le téléphone s'éteint et il faut le réveiller d'une main
     moite pour valider la suivante. Le verrou ne tient que pendant une séance,
     il se relâche tout seul au retour en arrière-plan, et il est débrayable
     dans Réglages — c'est de la batterie. */

  var verrou = null, verrouVoulu = false;

  function garderEcranAllume(oui) {
    verrouVoulu = !!oui;
    if (!('wakeLock' in navigator)) return;
    if (oui) {
      if (verrou || document.visibilityState !== 'visible') return;
      try {
        navigator.wakeLock.request('screen').then(function (v) {
          verrou = v;
          v.addEventListener('release', function () { verrou = null; });
        }).catch(function () { verrou = null; });
      } catch (e) { verrou = null; }
    } else if (verrou) {
      try { verrou.release(); } catch (e) {}
      verrou = null;
    }
  }

  /* Le système relâche le verrou dès que l'onglet passe derrière : on le
     redemande au retour, sinon il est perdu pour le reste de la séance. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && verrouVoulu && !verrou) garderEcranAllume(true);
  });

  /* ---------- le clavier ne doit pas masquer le champ ----------
     On n'agit QUE si le clavier recouvre vraiment le champ actif : un
     scrollIntoView systématique ferait sauter la page à chaque appui. */
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () {
      var a = document.activeElement;
      if (!a || (a.tagName !== 'INPUT' && a.tagName !== 'TEXTAREA')) return;
      var r = a.getBoundingClientRect();
      var bas = window.visualViewport.height + window.visualViewport.offsetTop;
      if (r.bottom > bas - 8) a.scrollIntoView({ block: 'center' });
    });
  }

  /* ---------- petits rendus partagés ---------- */

  function jetonsDouleur(zones) {
    var vraies = (zones || []).filter(function (z) { return z !== 'aucune'; });
    if (!vraies.length) return null;
    return h('span', { class: 'enrobe' }, vraies.map(function (z) {
      return h('span', { class: 'jeton jeton-douleur', text: A.m.nomZone(z) });
    }));
  }

  /* Ligne de sélection multiple des douleurs, présente sur CHAQUE séance.
     « Aucune » est exclusive : la cocher vide les autres, et inversement. */
  function selecteurDouleurs(valeurs, onChange) {
    var sel = (valeurs || []).slice();
    var boite = h('div', { class: 'enrobe' });
    A.m.ZONES.forEach(function (z) {
      var b = h('button', { type: 'button', class: 'puce puce-douleur', text: z.nom,
                            'aria-pressed': sel.indexOf(z.id) >= 0 ? 'true' : 'false' });
      b.addEventListener('click', function () {
        var dedans = sel.indexOf(z.id) >= 0;
        if (z.id === 'aucune') sel = dedans ? [] : ['aucune'];
        else {
          sel = sel.filter(function (x) { return x !== 'aucune'; });
          if (dedans) sel = sel.filter(function (x) { return x !== z.id; });
          else sel.push(z.id);
        }
        Array.prototype.forEach.call(boite.children, function (n, i) {
          n.setAttribute('aria-pressed', sel.indexOf(A.m.ZONES[i].id) >= 0 ? 'true' : 'false');
        });
        onChange(sel.slice());
      });
      boite.appendChild(b);
    });
    return boite;
  }

  function selecteurForces(valeurs, onChange) {
    var sel = (valeurs || []).slice();
    var boite = h('div', { class: 'enrobe' });
    A.m.FORCES.forEach(function (f) {
      var b = h('button', { type: 'button', class: 'puce', text: f.nom,
                            'aria-pressed': sel.indexOf(f.id) >= 0 ? 'true' : 'false' });
      b.addEventListener('click', function () {
        var i = sel.indexOf(f.id);
        if (i >= 0) sel.splice(i, 1); else sel.push(f.id);
        b.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
        onChange(sel.slice());
      });
      boite.appendChild(b);
    });
    return boite;
  }

  /* Champ multi-valeurs : jetons retirables + saisie libre avec autocomplétion
     alimentée par l'usage. Sert aux outils — un exercice peut en porter
     plusieurs (Titan Grip SUR poulie haute). Les jetons s'ajoutent et se
     retirent un par un : on ne reconstruit jamais la saisie sous le doigt. */
  function champMulti(valeurs, fournisseur, onChange, placeholder) {
    var sel = (valeurs || []).slice();
    var boite = h('div', { class: 'multi' });
    var jetons = h('div', { class: 'multi-jetons' });
    boite.appendChild(jetons);

    var saisie = h('input', { class: 'champ', type: 'text', placeholder: placeholder || 'Ajouter…',
                              enterkeyhint: 'done' });
    boite.appendChild(saisie);
    autocomplete(saisie, function (q) { return fournisseur(q, sel); }, function (it) {
      ajouter(it.nom);
    });

    function jeton(nom) {
      var sup = h('button', { type: 'button', text: '✕', 'aria-label': 'Retirer ' + nom });
      var j = h('span', { class: 'multi-jeton' }, h('span', { text: nom }), sup);
      sup.addEventListener('click', function () {
        var i = sel.indexOf(nom);
        if (i >= 0) sel.splice(i, 1);
        jetons.removeChild(j);
        onChange(sel.slice());
      });
      return j;
    }

    function ajouter(nom) {
      nom = String(nom || '').trim();
      saisie.value = '';
      if (!nom) return;
      var s = A.m.slug(nom);
      for (var i = 0; i < sel.length; i++) if (A.m.slug(sel[i]) === s) return;   // pas de doublon
      sel.push(nom);
      jetons.appendChild(jeton(nom));
      onChange(sel.slice());
    }

    sel.forEach(function (n) { jetons.appendChild(jeton(n)); });

    saisie.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); ajouter(saisie.value); }
      else if (e.key === 'Backspace' && !saisie.value && sel.length) {
        sel.pop();
        jetons.removeChild(jetons.lastChild);
        onChange(sel.slice());
      }
    });
    /* Quitter le champ avec du texte en cours le valide : sinon la saisie
       se perd silencieusement au moment d'appuyer sur Enregistrer. */
    saisie.addEventListener('blur', function () { setTimeout(function () { ajouter(saisie.value); }, 180); });

    return boite;
  }

  function groupe(libelle, champ, aide) {
    var g = h('div', { class: 'groupe' });
    if (libelle) {
      var id = champ.id || ('c_' + A.m.uid());
      champ.id = id;
      g.appendChild(h('label', { for: id, text: libelle }));
    }
    g.appendChild(champ);
    if (aide) g.appendChild(h('div', { class: 'item-resume', text: aide }));
    return g;
  }

  /* Déplace un élément dans un tableau ET le nœud correspondant dans le DOM,
     sans reconstruire la liste : les champs de saisie gardent leur focus. */
  function deplacer(tableau, index, delta, conteneur) {
    var cible = index + delta;
    if (cible < 0 || cible >= tableau.length) return false;
    var t = tableau[index]; tableau[index] = tableau[cible]; tableau[cible] = t;
    if (conteneur) {
      var noeuds = Array.prototype.slice.call(conteneur.children);
      var a = noeuds[index], b = noeuds[cible];
      if (a && b) {
        if (delta > 0) conteneur.insertBefore(b, a);
        else conteneur.insertBefore(a, b);
      }
    }
    return true;
  }

  A.ui = {
    h: h, vider: vider, svg: svg, CHEMIN_OK: CHEMIN_OK,
    toast: toast, confirmer2: confirmer2, feuille: feuille,
    autocomplete: autocomplete, chrono: chrono, champMulti: champMulti,
    empiler: empiler, depiler: depiler, garderEcranAllume: garderEcranAllume,
    jetonsDouleur: jetonsDouleur, selecteurDouleurs: selecteurDouleurs,
    selecteurForces: selecteurForces, groupe: groupe, deplacer: deplacer
  };
})(window.App || (window.App = {}));
