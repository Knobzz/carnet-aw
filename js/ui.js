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
     Alimentée par le catalogue d'usage D'ABORD, puis par le dictionnaire
     d'exercices quand le catalogue ne suffit pas (décision de MB,
     2026-10-23). Ce fichier ne connaît ni l'un ni l'autre : il affiche ce
     que le fournisseur lui donne, et les jetons disent d'où vient chaque
     ligne. Le champ garde le focus : on ne reconstruit que la liste. */
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

  /* ---------- notification de fin de repos ----------
     La vibration ne part que si la page est vivante. Quand le telephone est
     verrouille ou l'app en arriere-plan, seule une notification passe.

     Elle ne sert QUE si la page est cachee : notifier quelqu'un qui regarde
     deja l'ecran est du bruit. Et elle n'est jamais demandee d'office — le
     reglage est a l'arret par defaut. */

  function notificationsPossibles() {
    return typeof Notification !== 'undefined';
  }

  function demanderNotifications() {
    if (!notificationsPossibles()) return Promise.resolve('indisponible');
    if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
    try { return Notification.requestPermission(); }
    catch (e) { return Promise.resolve('denied'); }
  }

  function notifierFinRepos(libelle) {
    if (!notificationsPossibles() || Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return;   // il regarde deja
    try {
      var n = new Notification('Repos terminé', {
        body: libelle || 'Série suivante.',
        icon: 'icones/icone-192.png',
        badge: 'icones/icone-192.png',
        tag: 'carnet-aw-repos',
        renotify: true
      });
      n.onclick = function () { try { window.focus(); n.close(); } catch (e) {} };
    } catch (e) { /* une notification refusee ne doit jamais casser la seance */ }
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
      plus.addEventListener('click', function () {
        finA += 30000; duree += 30000; rendre(); ecrireEtat();
      });
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
        var libelle = quoi ? quoi.textContent : '';
        arreter();
        vibrer([120, 70, 120]);   // fin du repos : on le sent sans regarder
        if (A.store && A.store.etat().reglages.notifierRepos) notifierFinRepos(libelle);
      }
    }

    function lancer(finMs, dureeMs, libelle) {
      monter();
      duree = dureeMs;
      finA = finMs;
      quoi.textContent = libelle || '';
      actif = true;
      noeud.classList.add('visible');
      document.body.classList.add('chrono-ouvert');
      clearInterval(tick);
      tick = setInterval(rendre, 200);
      rendre();
    }

    function demarrer(secondes, libelle) {
      if (!secondes || secondes <= 0) return;
      var d = secondes * 1000;
      lancer(Date.now() + d, d, libelle);
      ecrireEtat();
    }

    /* Reprise apres une fermeture de l'app : l'etat du repos est relu du
       stockage, et l'horodatage etant absolu, le temps restant est juste
       meme si la page est restee morte dix minutes. */
    function reprendre() {
      var c = A.store && A.store.chronoEnCours && A.store.chronoEnCours();
      if (!c) return false;
      lancer(c.finA, c.duree || (c.finA - Date.now()), c.libelle);
      return true;
    }

    function ecrireEtat() {
      if (A.store && A.store.poserChrono) {
        A.store.poserChrono(actif ? finA : null, duree, quoi ? quoi.textContent : '');
      }
    }

    function arreter() {
      clearInterval(tick);
      actif = false;
      if (noeud) noeud.classList.remove('visible');
      document.body.classList.remove('chrono-ouvert');
      if (A.store && A.store.poserChrono) A.store.poserChrono(null);
    }

    return { demarrer: demarrer, arreter: arreter, reprendre: reprendre,
             actif: function () { return actif; } };
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

  /* Echelle 0-10, en grille : onze boutons empiles seraient illisibles et
     demanderaient un defilement pour atteindre les valeurs hautes. */
  function choisirIntensite(nomZone, actuelle, onChoix, coteActuel) {
    var fond = h('div', { class: 'popo', role: 'dialog', 'aria-modal': 'true',
                          'aria-label': 'Intensité — ' + nomZone });
    var boite = h('div', { class: 'popo-feuille' });
    boite.appendChild(h('h3', { text: nomZone }));

    /* Le cote se demande ICI, dans la feuille qui est deja ouverte : un
       troisieme appui pour le poser aurait fait du cote l'information
       qu'on ne renseigne jamais. Il reste facultatif — on peut choisir une
       intensite sans y toucher. */
    var cote = A.m.coteValide(coteActuel);
    boite.appendChild(h('div', { class: 'item-resume', style: 'padding:0 6px 6px',
      text: 'De quel côté ? Facultatif, mais c’est ce qui permet de relier la douleur à ce qui l’a chargée.' }));
    boite.appendChild(selecteurCote(cote, function (v) { cote = v; }));

    boite.appendChild(h('div', { class: 'item-resume', style: 'padding:10px 6px 8px',
      text: 'Intensité — 0 : rien. 3 : je la sens. 6 : elle gêne le geste. 9 : je dois arrêter.' }));

    var grille = h('div', { class: 'popo-echelle' });
    for (var i = 0; i <= 10; i++) {
      (function (v) {
        var b = h('button', { type: 'button', class: 'echelon',
                              'aria-pressed': actuelle === v ? 'true' : 'false',
                              dataset: { niveau: v < 4 ? 'bas' : (v < 7 ? 'moyen' : 'haut') },
                              text: String(v) });
        b.addEventListener('click', function () { fermer(); onChoix(v, cote); });
        grille.appendChild(b);
      })(i);
    }
    boite.appendChild(grille);

    var flou = h('button', { class: 'bt bt-large bt-fantome', style: 'margin-top:8px',
                             text: 'Non précisée' });
    flou.addEventListener('click', function () { fermer(); onChoix(null, cote); });
    boite.appendChild(flou);

    var ote = h('button', { class: 'bt bt-large bt-danger', style: 'margin-top:6px',
                            text: 'Retirer cette zone' });
    ote.addEventListener('click', function () { fermer(); onChoix('retirer', cote); });
    boite.appendChild(ote);

    var annul = h('button', { class: 'bt bt-large bt-fantome', style: 'margin-top:6px', text: 'Annuler' });
    annul.addEventListener('click', function () { fermer(); });
    boite.appendChild(annul);

    fond.appendChild(boite);
    fond.addEventListener('click', function (e) { if (e.target === fond) fermer(); });
    function esc(e) { if (e.key === 'Escape') fermer(); }
    var detruit = false, entree = null;
    function detruire() {
      if (detruit) return;
      detruit = true;
      document.removeEventListener('keydown', esc);
      if (fond.parentNode) fond.parentNode.removeChild(fond);
    }
    function fermer() { if (detruit) return; detruire(); depiler(entree); }
    document.addEventListener('keydown', esc);
    document.body.appendChild(fond);
    entree = empiler(detruire);
  }

  function jetonsDouleur(douleurs) {
    var vraies = A.m.zonesVives(douleurs);
    if (!vraies.length) return null;
    return h('span', { class: 'enrobe' }, vraies.map(function (d) {
      return h('span', { class: 'jeton jeton-douleur', text: A.m.texteDouleur(d) });
    }));
  }

  /* Ligne de sélection des douleurs, présente sur CHAQUE séance.

     UN appui pose la zone — c'est le geste rapide, celui d'avant, et il n'a
     pas bouge. UN SECOND appui sur une zone deja posee ouvre l'echelle 0-10.
     L'intensite reste donc facultative : elle ne ralentit que celui qui la
     veut. C'est elle qui dit si une tendinopathie monte ou descend, ce qu'un
     oui/non ne peut pas montrer.

     « Aucune » est exclusive et n'a jamais d'intensite. */
  function selecteurDouleurs(valeurs, onChange) {
    var sel = A.m.normaliserDouleurs(valeurs);
    var boite = h('div', { class: 'enrobe' });

    function trouve(zone) {
      for (var i = 0; i < sel.length; i++) if (sel[i].zone === zone) return sel[i];
      return null;
    }

    function rafraichir() {
      Array.prototype.forEach.call(boite.children, function (n, i) {
        var z = A.m.ZONES[i], d = trouve(z.id);
        n.setAttribute('aria-pressed', d ? 'true' : 'false');
        n.textContent = d ? A.m.texteDouleur(d) : z.nom;
        if (d && d.intensite != null) n.dataset.niveau = d.intensite < 4 ? 'bas' : (d.intensite < 7 ? 'moyen' : 'haut');
        else delete n.dataset.niveau;
      });
      onChange(sel.map(function (d) {
        return { zone: d.zone, intensite: d.intensite, cote: d.cote || null };
      }));
    }

    A.m.ZONES.forEach(function (z) {
      var b = h('button', { type: 'button', class: 'puce puce-douleur', text: z.nom,
                            'aria-pressed': 'false' });
      b.addEventListener('click', function () {
        var d = trouve(z.id);

        if (z.id === 'aucune') {
          sel = d ? [] : [{ zone: 'aucune', intensite: null, cote: null }];
          rafraichir();
          return;
        }

        sel = sel.filter(function (x) { return x.zone !== 'aucune'; });

        if (!d) {                       // premier appui : la zone, rien de plus
          sel.push({ zone: z.id, intensite: null, cote: null });
          rafraichir();
          return;
        }

        choisirIntensite(z.nom, d.intensite, function (v, c) {   // second appui
          if (v === 'retirer') sel = sel.filter(function (x) { return x.zone !== z.id; });
          else { d.intensite = v; d.cote = c; }
          rafraichir();
        }, d.cote);
      });
      boite.appendChild(b);
    });

    rafraichir();
    return boite;
  }

  /* Structures chargees par un exercice. Memes identifiants que les zones de
     douleur pour les cinq premieres : c'est ce qui rend le croisement possible. */
  function selecteurStructures(valeurs, onChange) {
    var sel = (valeurs || []).slice();
    var boite = h('div', { class: 'enrobe' });
    A.m.STRUCTURES.forEach(function (s) {
      var b = h('button', { type: 'button', class: 'puce', text: s.nom,
                            'aria-pressed': sel.indexOf(s.id) >= 0 ? 'true' : 'false' });
      b.addEventListener('click', function () {
        var i = sel.indexOf(s.id);
        if (i >= 0) sel.splice(i, 1); else sel.push(s.id);
        b.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
        onChange(sel.slice());
      });
      boite.appendChild(b);
    });
    return boite;
  }

  /* Le cote : un choix UNIQUE, et qui peut redevenir vide. Appuyer sur celui
     qui est deja actif le retire — « non renseigne » doit rester atteignable
     une fois qu'on a repondu par erreur. */
  function selecteurUnique(liste, valeur, onChange) {
    var sel = valeur || null;
    var boite = h('div', { class: 'enrobe' });
    var boutons = [];

    function rafraichir() {
      boutons.forEach(function (b) {
        b.noeud.setAttribute('aria-pressed', sel === b.id ? 'true' : 'false');
      });
    }

    liste.forEach(function (c) {
      var b = h('button', { type: 'button', class: 'puce', text: c.nom,
                            title: c.quoi || '',
                            'aria-pressed': sel === c.id ? 'true' : 'false' });
      b.addEventListener('click', function () {
        sel = (sel === c.id) ? null : c.id;
        rafraichir();
        onChange(sel);
      });
      boutons.push({ id: c.id, noeud: b });
      boite.appendChild(b);
    });
    return boite;
  }

  function selecteurCote(valeur, onChange) {
    return selecteurUnique(A.m.COTES, A.m.coteValide(valeur), onChange);
  }
  function selecteurPrise(valeur, onChange) {
    return selecteurUnique(A.m.PRISES, A.m.priseValide(valeur), onChange);
  }

  /* Les muscles, ranges par region, chacun avec CE QU'IL FAIT. Treize noms
     latins sans explication ne se cochent pas : on apprend en appuyant, ou
     on ne coche rien. Les muscles de la masse flexo-pronatrice portent une
     marque — c'est eux qui tirent sur l'epicondyle medial. */
  /* « Où ça tire ? » — l'entrée pour qui ne connaît pas les noms.

     Les noms des muscles ne parlent pas à qui ne les a pas appris, et une
     case qu'on ne sait pas cocher reste vide. Mais tout le monde sait dire
     où ça tire. Chaque ligne AJOUTE ses muscles à la sélection ; elle n'en
     retire jamais, parce que deux zones se recouvrent et qu'un décochage
     ferait disparaître ce qu'une autre avait posé. On corrige juste en
     dessous, dans la liste.

     Le bloc est REPLIÉ par défaut : qui connaît les noms n'a rien à lire. */
  /* Les zones ressenties sont des CASES A COCHER, pas des boutons qui
     ajoutent. Elles l'ont ete : un appui posait des muscles, un second n'en
     retirait aucun, et rien ne restait allume — on ne pouvait donc ni
     defaire, ni voir ce qu'on avait deja choisi. MB l'a signale en croyant
     qu'on ne pouvait pas en cocher plusieurs ; on pouvait, mais rien ne le
     montrait.

     La provenance des mouvements a servi de point de depart, mais elle ne
     convient pas telle quelle : la, un muscle appartient a CELUI qui l'a
     pose en premier. Pour des cases a cocher, ce qu'on attend est une
     UNION — decocher une zone ne doit retirer que ce qu'AUCUNE autre zone
     cochee ne reclame.

     On retient donc, par muscle, l'ensemble des zones qui l'ont pose
     (`origine`). Cocher une zone l'ajoute a l'origine de chacun de ses
     muscles, meme deja coches ; decocher la retire, et le muscle ne part
     que si son origine devient vide.

     Un muscle coche A LA MAIN n'a aucune origine : il ne part jamais. C'est
     la meme garantie que pour les mouvements, obtenue autrement.

     Ca compte : QUATORZE des trente-cinq muscles appartiennent a plusieurs
     zones, et l'extenseur du petit doigt a trois. Avec la semantique des
     mouvements, decocher « le dessus de l'avant-bras » emportait l'extenseur
     ulnaire alors que « le bord du petit doigt » restait coche.

     Le contrat est `(lire, ecrire)` et non plus `(onAjout)` : le selecteur a
     besoin de SAVOIR ce qui est deja coche pour calculer la provenance.

     Le libelle a change trois fois, et chaque abandon dit quelque chose :
     « Je ne connais pas les noms » collait une etiquette a qui appuyait ;
     « Ou ca tire ? » posait une question la ou un en-tete doit nommer ;
     « Choisir par sensation » decrivait un etat d'esprit. Celui qui reste
     annonce la METHODE — on va designer un endroit du corps, pas un nom
     latin — et c'est tout ce qu'un en-tete a besoin de faire. */
  function selecteurOuCaTire(lire, ecrire) {
    var LIBELLE = 'Par zone du corps';
    var corps = h('div', { class: 'ouca-corps', hidden: true });
    var entete = h('button', { type: 'button', class: 'bt', style: 'width:100%',
                               'aria-expanded': 'false',
                               text: LIBELLE + ' →' });
    entete.addEventListener('click', function () {
      var ouvert = entete.getAttribute('aria-expanded') === 'true';
      entete.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
      corps.hidden = ouvert;
      entete.textContent = LIBELLE + (ouvert ? ' →' : ' ↓');
    });

    corps.appendChild(h('div', { class: 'item-resume', style: 'margin:6px 0 2px',
      text: 'Coche ce que tu sens travailler : les muscles correspondants se '
          + 'cochent en dessous. Décoche, et ils s’en vont — sauf ceux qu’une '
          + 'autre zone ou toi aviez déjà posés.' }));

    var origine = {};   /* muscle -> [zones qui l'ont pose] */

    A.m.ZONES_RESSENTIES.forEach(function (z) {
      var b = h('button', { type: 'button', class: 'ouca-ligne',
                            'aria-pressed': 'false' },
        h('span', { class: 'equip-coche', 'aria-hidden': 'true' }),
        h('span', { class: 'ouca-texte' },
          h('b', { text: z.nom }),
          h('span', { text: z.aide })));

      b.addEventListener('click', function () {
        var coche = b.getAttribute('aria-pressed') === 'true';
        var noms = function (l) { return l.map(A.m.nomCourtMuscle).join(', '); };
        var siens = A.m.musclesDesZones([z.id]);
        var actuels = lire() || [];

        if (!coche) {
          var neufs = [];
          siens.forEach(function (id) {
            var dejaLa = actuels.indexOf(id) >= 0;
            /* Un muscle coché A LA MAIN n'a pas d'origine, et la zone ne
               l'ADOPTE pas : sinon la décocher l'emporterait, alors que
               personne ne l'avait posé pour elle. C'est le piège de ce
               dessin, et il ne se voit que si le muscle coché à la main
               appartient justement à la zone qu'on coche ensuite. */
            if (dejaLa && !origine[id]) return;
            if (!origine[id]) origine[id] = [];
            if (origine[id].indexOf(z.id) < 0) origine[id].push(z.id);
            if (!dejaLa) neufs.push(id);
          });
          b.setAttribute('aria-pressed', 'true');
          ecrire(A.m.muscles({ muscles: actuels.concat(neufs) }));
          toast(neufs.length
            ? neufs.length + ' muscle' + (neufs.length > 1 ? 's' : '')
              + ' coché' + (neufs.length > 1 ? 's' : '') + ' : ' + noms(neufs) + '.'
            : 'Ces muscles étaient déjà cochés — rien de neuf à ajouter.');
        } else {
          /* Un muscle part quand plus AUCUNE zone cochée ne le réclame. Celui
             qui a été coché à la main n'a pas d'origine du tout : il reste. */
          var partent = [];
          siens.forEach(function (id) {
            var o = origine[id];
            if (!o) return;
            var i = o.indexOf(z.id);
            if (i >= 0) o.splice(i, 1);
            if (!o.length) { delete origine[id]; partent.push(id); }
          });
          b.setAttribute('aria-pressed', 'false');
          if (partent.length) {
            ecrire(actuels.filter(function (id) { return partent.indexOf(id) < 0; }));
            toast('Décoché : ' + noms(partent) + '.');
          } else {
            toast('Rien retiré : ces muscles sont réclamés ailleurs, '
                + 'ou tu les avais cochés à la main.');
          }
        }
      });
      corps.appendChild(b);
    });

    return h('div', { class: 'ouca' }, entete, corps);
  }

  function selecteurMuscles(valeurs, onChange) {
    var sel = (valeurs || []).slice();
    var boite = h('div');

    function rendreGroupe(region) {
      var dedans = A.m.MUSCLES.filter(function (m) { return m.groupe === region.id; });
      if (!dedans.length) return;

      /* Vingt-deux muscles d'affilée font un mur : on ne voit plus ce qu'on a
         coché, et le reste de la fiche part sous l'écran. Chaque région se
         replie donc, comme les catégories de l'équipement.

         Une région qui PORTE déjà un muscle coché s'ouvre : sinon on
         rouvrirait six blocs pour vérifier ce qui est dedans. Le compte reste
         visible fermé, pour n'avoir justement pas à ouvrir. */
      var compte = h('span', { class: 'equip-compte' });
      var chevron = h('span', { class: 'equip-chevron', 'aria-hidden': 'true', text: '▾' });
      var entete = h('button', { type: 'button', class: 'equip-cat',
                                 'aria-expanded': 'false' },
        h('b', { text: region.nom }), compte, chevron);
      var liste = h('div', { class: 'muscle-liste' });

      function majCompte() {
        var n = 0;
        dedans.forEach(function (m) { if (sel.indexOf(m.id) >= 0) n += 1; });
        compte.textContent = n ? n + ' / ' + dedans.length : dedans.length;
      }
      function ouvrir(oui) {
        entete.setAttribute('aria-expanded', oui ? 'true' : 'false');
        liste.hidden = !oui;
      }
      entete.addEventListener('click', function () {
        ouvrir(entete.getAttribute('aria-expanded') !== 'true');
      });
      dedans.forEach(function (m) {
        var b = h('button', { type: 'button', class: 'muscle-ligne',
                              'aria-pressed': sel.indexOf(m.id) >= 0 ? 'true' : 'false' },
          h('span', { class: 'equip-coche', 'aria-hidden': 'true' }),
          h('span', { class: 'muscle-texte' },
            h('b', { text: m.nom }),
            /* Le nom classique des planches françaises : « long supinateur »,
               « grand palmaire ». C'est celui qu'on reconnaît. */
            h('span', { text: m.quoi + (m.aussi ? ' · dit aussi ' + m.aussi : '') }),
            /* Ce que le muscle MOBILISE, et son insertion quand elle est
               commune. Deux informations d'anatomie qui ne demandent aucune
               saisie et qui rendent la liste lisible à qui ne la connaît pas. */
            h('span', { class: 'muscle-marques' },
              h('span', { class: 'jeton jeton-art', text: A.m.nomArticulation(m.articulation) }),
              /* Le nom latin : c'est celui qui est écrit sur les planches
                 d'anatomie, et le seul qui permette d'y retrouver le muscle. */
              h('span', { class: 'jeton jeton-latin', text: m.latin }),
              m.medial ? h('span', { class: 'jeton jeton-medial', text: 'ins. médiale' })
                       : (m.lateral ? h('span', { class: 'jeton jeton-medial', text: 'ins. latérale' }) : null),
              m.profond ? h('span', { class: 'jeton jeton-medial', text: 'profond' }) : null)));
        b.addEventListener('click', function () {
          var i = sel.indexOf(m.id);
          if (i >= 0) sel.splice(i, 1); else sel.push(m.id);
          b.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
          majCompte();
          onChange(A.m.muscles({ muscles: sel }));
        });
        liste.appendChild(b);
      });

      majCompte();
      ouvrir(dedans.some(function (m) { return sel.indexOf(m.id) >= 0; }));
      boite.appendChild(h('div', { class: 'equip-bloc muscle-bloc' }, entete, liste));
    }

    A.m.REGIONS_MUSCLE.forEach(rendreGroupe);
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
        /* On dit AUSSI lequel vient de changer, et dans quel sens : cocher un
           mouvement coche les muscles qu'il fait travailler, et le décocher ne
           les retire pas. Sans ces deux informations, l'appelant devrait
           comparer deux listes pour deviner ce qui s'est passé. */
        onChange(sel.slice(), f.id, i < 0);
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
    selecteurForces: selecteurForces, selecteurStructures: selecteurStructures,
    selecteurCote: selecteurCote, selecteurPrise: selecteurPrise,
    selecteurUnique: selecteurUnique, selecteurMuscles: selecteurMuscles,
    selecteurOuCaTire: selecteurOuCaTire,
    choisirIntensite: choisirIntensite,
    notificationsPossibles: notificationsPossibles,
    demanderNotifications: demanderNotifications,
    groupe: groupe, deplacer: deplacer
  };
})(window.App || (window.App = {}));
