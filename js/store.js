/* Persistance — une seule clé, tout en try/catch.
   Si localStorage refuse, l'app le DIT (bandeau) plutôt que de perdre la saisie. */
(function (A) {
  'use strict';

  var CLE = 'carnet-aw-v1';
  var VERSION_DONNEES = 1;

  function vide() {
    return {
      versionDonnees: VERSION_DONNEES,
      exercices: [],
      outils: [],
      programmes: [],
      seances: [],
      reglages: { theme: 'auto', ecranAllume: true },
      seanceEnCoursId: null
    };
  }

  var etat = vide();
  var panne = null;          // message si la persistance ne marche pas
  var ecoutes = [];          // callbacks « la persistance a changé d'état »
  var minuteur = null;

  function signaler(msg) {
    if (panne === msg) return;
    panne = msg;
    ecoutes.forEach(function (f) { try { f(panne); } catch (e) {} });
  }

  function normaliser(brut) {
    var d = vide();
    if (!brut || typeof brut !== 'object') return d;
    if (Array.isArray(brut.exercices)) d.exercices = brut.exercices;
    if (Array.isArray(brut.outils)) d.outils = brut.outils;
    if (Array.isArray(brut.programmes)) d.programmes = brut.programmes;
    if (Array.isArray(brut.seances)) d.seances = brut.seances;
    if (brut.reglages && typeof brut.reglages === 'object') {
      d.reglages.theme = ['auto', 'clair', 'sombre'].indexOf(brut.reglages.theme) >= 0
        ? brut.reglages.theme : 'auto';
      d.reglages.ecranAllume = brut.reglages.ecranAllume !== false;
    }
    if (typeof brut.seanceEnCoursId === 'string') d.seanceEnCoursId = brut.seanceEnCoursId;
    d.versionDonnees = VERSION_DONNEES;
    return d;
  }

  function charger() {
    var brut;
    try {
      brut = window.localStorage.getItem(CLE);
    } catch (e) {
      signaler("Le stockage du navigateur est inaccessible (navigation privée ?). "
             + "La séance en cours tiendra tant que l'onglet reste ouvert, mais rien ne sera gardé.");
      etat = vide();
      return etat;
    }
    if (brut === null) { etat = vide(); return etat; }
    try {
      etat = normaliser(JSON.parse(brut));
    } catch (e) {
      signaler("Les données enregistrées sont illisibles. Rien n'a été effacé : "
             + "exporte une sauvegarde depuis Réglages avant toute nouvelle saisie.");
      etat = vide();
    }
    return etat;
  }

  function ecrire() {
    try {
      window.localStorage.setItem(CLE, JSON.stringify(etat));
      signaler(null);
      return true;
    } catch (e) {
      var plein = e && (e.name === 'QuotaExceededError' || e.code === 22);
      signaler(plein
        ? "Le stockage est plein : la dernière saisie n'a PAS été enregistrée. "
        + "Exporte une sauvegarde, puis fais de la place."
        : "L'enregistrement a échoué (" + (e && e.name ? e.name : 'erreur') + "). "
        + "Exporte une sauvegarde avant de fermer l'onglet.");
      return false;
    }
  }

  /* Écriture groupée : la saisie d'une série ne doit pas sérialiser tout l'état
     à chaque frappe. Au plus une écriture toutes les 400 ms, plus une écriture
     immédiate dès que la page passe en arrière-plan. */
  function sauver(immediat) {
    if (minuteur) { clearTimeout(minuteur); minuteur = null; }
    if (immediat) return ecrire();
    minuteur = setTimeout(function () { minuteur = null; ecrire(); }, 400);
    return true;
  }

  function vider() {
    etat = vide();
    try { window.localStorage.removeItem(CLE); } catch (e) {}
    ecrire();
  }

  function remplacer(nouvelEtat) {
    etat = normaliser(nouvelEtat);
    return ecrire();
  }

  /* Un navigateur de telephone EVINCE le stockage d'un site quand la place
     manque — sans prevenir, et sans que le site soit desinstalle. Un carnet
     construit sur des mois disparaitrait. On demande donc explicitement le
     stockage persistant : accorde, les donnees ne sont plus evincables. */
  var persistant = null;   // null = inconnu, true/false = reponse du navigateur

  function demanderPersistance() {
    if (!navigator.storage || !navigator.storage.persist) { persistant = false; return; }
    try {
      navigator.storage.persisted().then(function (deja) {
        if (deja) { persistant = true; return; }
        return navigator.storage.persist().then(function (ok) { persistant = !!ok; });
      }).catch(function () { persistant = false; });
    } catch (e) { persistant = false; }
  }

  /* Au chargement, le navigateur laisse souvent la demande en suspens : elle
     aboutit bien plus volontiers apres un geste. On la rejoue UNE fois, a la
     premiere touche, et seulement si elle n'avait pas encore repondu. */
  function rejouerAuPremierGeste() {
    function once() {
      document.removeEventListener('pointerdown', once, true);
      document.removeEventListener('keydown', once, true);
      if (persistant !== true) demanderPersistance();
    }
    document.addEventListener('pointerdown', once, true);
    document.addEventListener('keydown', once, true);
  }
  rejouerAuPremierGeste();

  function estPersistant() { return persistant; }

  function placeDisponible() {
    if (!navigator.storage || !navigator.storage.estimate) return Promise.resolve(null);
    return navigator.storage.estimate().then(function (e) { return e; }).catch(function () { return null; });
  }

  window.addEventListener('pagehide', function () { sauver(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') sauver(true);
  });

  A.store = {
    CLE: CLE,
    VERSION_DONNEES: VERSION_DONNEES,
    charger: charger,
    sauver: sauver,
    demanderPersistance: demanderPersistance,
    estPersistant: estPersistant,
    placeDisponible: placeDisponible,
    vider: vider,
    remplacer: remplacer,
    vide: vide,
    etat: function () { return etat; },
    panne: function () { return panne; },
    surPanne: function (f) { ecoutes.push(f); }
  };
})(window.App || (window.App = {}));
