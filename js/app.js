/* Coque : thème, onglets, bandeau de panne, démarrage. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  window.APP_VERSION = '1.61.0';

  var ONGLETS = [
    { id: 'seance',     nom: 'Séance',    icone: 'M7 7v10M17 7v10M7 12h10M3 9.5v5M21 9.5v5' },
    { id: 'recup',      nom: 'Récup',     icone: 'M20 12a8 8 0 1 1-2.4-5.7M20 4v3.6h-3.6' },
    { id: 'programmes', nom: 'Programmes', icone: 'M5 4h14v16H5zM9 8h6M9 12h6M9 16h3' },
    { id: 'journal',    nom: 'Journal',   icone: 'M4 5h16v14H4zM4 9h16M9 5v14' },
    { id: 'suivi',      nom: 'Suivi',     icone: 'M4 18l5-6 4 3 7-8' },
    { id: 'reglages',   nom: 'Réglages',  icone: 'M12 9a3 3 0 100 6 3 3 0 000-6M5 12H3m18 0h-2M12 5V3m0 18v-2M7.8 7.8 6.3 6.3m11.4 11.4-1.5-1.5m0-9.9 1.5-1.5M6.3 17.7l1.5-1.5' }
  ];

  var courant = 'seance';
  var hote = null, titreN = null, sousTitreN = null, barre = null, alerteN = null;

  /* LE JOUR OU L'ECRAN A ETE DESSINE.

     MB, 28/10 : « j'ai l'impression de l'avoir fait hier, et pourtant
     aujourd'hui je n'ai pas la possibilité de la faire, elle semble déjà
     validée ».

     Une PWA n'est pas rechargée, elle est REPRISE : MB fait sa récup le
     soir, range son téléphone, et le lendemain il retrouve L'ÉCRAN DE LA
     VEILLE — en-tête à la date d'hier, carte d'hier encore cochée.

     MESURE AVANT CORRECTION : écran rendu, on ajoute une séance de récup
     faite dans l'état, on émet `visibilitychange` puis `focus`. L'état dit
     « 1 / 2 », l'écran dit encore « 0 / 2 », et il n'a pas bougé d'un
     caractère. Les deux `visibilitychange` de l'app ne redessinent rien :
     `store.js` SAUVE quand l'onglet part, `ui.js` reprend le verrou
     d'écran quand il revient.

     ET LE PIRE N'EST PAS D'ETRE BLOQUE : un appui sur la coche de cet écran
     périmé DÉVALIDE la séance d'hier. Le geste ne fait pas rien, il fait
     l'inverse. */
  var jourRendu = null;

  function appliquerTheme() {
    var t = A.store.etat().reglages.theme;
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var sombre = t === 'sombre' ||
        (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      meta.setAttribute('content', sombre ? '#141c25' : '#eef1f3');
    }
  }

  function majAlerte() {
    var msg = A.store.panne();
    if (!msg) { if (alerteN) { alerteN.remove(); alerteN = null; } return; }
    if (!alerteN) {
      alerteN = h('div', { class: 'alerte', role: 'alert' }, h('strong', { text: 'Enregistrement' }), h('span'));
      hote.parentNode.insertBefore(alerteN, hote);
    }
    alerteN.lastChild.textContent = msg;
  }

  function majOnglets() {
    Array.prototype.forEach.call(barre.children, function (b, i) {
      b.setAttribute('aria-selected', ONGLETS[i].id === courant ? 'true' : 'false');
      var p = b.querySelector('.pastille');
      if (ONGLETS[i].id === 'seance') {
        var enCours = !!A.store.etat().seanceEnCoursId;
        if (enCours && !p) b.appendChild(h('span', { class: 'pastille', 'aria-hidden': 'true' }));
        if (!enCours && p) p.remove();
      }
    });
  }

  function aller(id) {
    courant = id;
    rafraichir();
    window.scrollTo(0, 0);
  }

  function rafraichir() {
    var v = A.vues[courant];
    if (!v) return;
    jourRendu = A.m.aujourdHui();
    titreN.textContent = v.titre ? v.titre() : '';
    sousTitreN.textContent = courant === 'seance' && A.store.etat().seanceEnCoursId
      ? 'Valide chaque série ; le repos part tout seul.'
      : '';
    sousTitreN.style.display = sousTitreN.textContent ? '' : 'none';
    majOnglets();
    majAlerte();
    v.rendre(hote);
  }

  function demarrer() {
    A.store.charger();
    A.store.demanderPersistance();
    A.store.surPanne(function () { if (hote) majAlerte(); });
    appliquerTheme();
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var surChangement = function () { appliquerTheme(); };
      if (mq.addEventListener) mq.addEventListener('change', surChangement);
      else if (mq.addListener) mq.addListener(surChangement);
    }

    titreN = h('h1');
    sousTitreN = h('span', { class: 'sous' });
    var entete = h('header', { class: 'entete' }, h('div', { style: 'flex:1;min-width:0' }, titreN, sousTitreN));

    hote = h('main', { class: 'vue active', id: 'vue' });

    barre = h('nav', { class: 'onglets', role: 'tablist', 'aria-label': 'Sections' });
    ONGLETS.forEach(function (o) {
      var b = h('button', { class: 'onglet', role: 'tab', 'aria-selected': 'false',
                            'aria-controls': 'vue', 'aria-label': o.nom, title: o.nom },
        A.ui.svg(o.icone), h('span', { text: o.nom }));
      b.addEventListener('click', function () { aller(o.id); });
      barre.appendChild(b);
    });

    var app = h('div', { class: 'app' }, entete, hote);
    document.body.appendChild(app);
    document.body.appendChild(barre);

    courant = A.store.etat().seanceEnCoursId ? 'seance'
            : (A.store.etat().programmes.length ? 'programmes' : 'seance');
    rafraichir();

    /* ---- L'ECRAN SUIT LE CALENDRIER, AU RETOUR AU PREMIER PLAN ----

       SEULEMENT SI LE JOUR A CHANGE : redessiner à chaque retour jetterait
       une valeur à demi saisie pour rien, et l'app repasse au premier plan
       vingt fois par séance.

       ET PAS SI UNE FICHE EST OUVERTE : MB est en train d'y saisir quelque
       chose, et le lui arracher serait pire que l'écran périmé. Le jour
       revient dès qu'il ferme la fiche ou change d'onglet, puisque
       `jourRendu` n'est pas mis à jour tant qu'on n'a pas redessiné.

       DEUX ECOUTEURS, parce que les téléphones ne s'accordent pas : iOS
       émet surtout `visibilitychange`, et un retour depuis une autre
       fenêtre ne donne parfois que `focus`. Le test est le même, donc
       l'émettre deux fois ne coûte qu'un `===`. */
    function suivreLeJour() {
      if (!hote || document.visibilityState === 'hidden') return;
      /* LA DECISION EST DANS LE MODELE, et c'est pour qu'elle soit
         mesurable : le banc d'interface ne charge pas cette coque. */
      if (!A.m.jourAChange(jourRendu)) return;
      if (document.querySelector('.panneau')) return;
      rafraichir();
    }
    document.addEventListener('visibilitychange', suivreLeJour);
    window.addEventListener('focus', suivreLeJour);

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { /* hors ligne non disponible, l'app marche quand même */ });
      });
    }
  }

  A.app = { aller: aller, rafraichir: rafraichir, appliquerTheme: appliquerTheme, demarrer: demarrer };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})(window.App || (window.App = {}));
