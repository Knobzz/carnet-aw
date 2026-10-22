/* Persistance — une seule clé, tout en try/catch.
   Si localStorage refuse, l'app le DIT (bandeau) plutôt que de perdre la saisie. */
(function (A) {
  'use strict';

  /* Le banc d'interface fait tourner la vraie app, et la vraie app ECRIT :
     lancer un repos pose `chrono` dans le stockage. Sur le telephone, cette
     seule ligne est ce qui empeche un banc ouvert par curiosite d'effacer un
     carnet construit sur des mois. L'isolation est STRUCTURELLE, pas une
     precaution que le banc doit penser a prendre — et le banc la mesure. */
  var CLE = window.__BANC_IHM ? 'carnet-aw-banc-ihm' : 'carnet-aw-v1';
  var VERSION_DONNEES = 1;

  function vide() {
    return {
      versionDonnees: VERSION_DONNEES,
      exercices: [],
      outils: [],
      programmes: [],
      /* La routine de recuperation : un programme comme les autres, mais un
         seul, et qui ne se lance pas — il se coche, jour apres jour. */
      routineRecup: null,
      /* Les releves de douleur du lendemain : independants des seances, parce
         que le lendemain d'une grosse seance est souvent un jour de repos. */
      releves: [],
      seances: [],
      reglages: { theme: 'auto', ecranAllume: true, notifierRepos: false },
      seanceEnCoursId: null,
      chrono: null          // { finA, duree, libelle } — survit a la fermeture
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
    if (brut.routineRecup && typeof brut.routineRecup === 'object') d.routineRecup = brut.routineRecup;
    if (Array.isArray(brut.releves)) d.releves = brut.releves;
    if (Array.isArray(brut.seances)) d.seances = brut.seances;
    if (brut.reglages && typeof brut.reglages === 'object') {
      d.reglages.theme = ['auto', 'clair', 'sombre'].indexOf(brut.reglages.theme) >= 0
        ? brut.reglages.theme : 'auto';
      d.reglages.ecranAllume = brut.reglages.ecranAllume !== false;
      d.reglages.notifierRepos = brut.reglages.notifierRepos === true;
    }
    if (typeof brut.seanceEnCoursId === 'string') d.seanceEnCoursId = brut.seanceEnCoursId;

    if (brut.chrono && typeof brut.chrono === 'object'
        && typeof brut.chrono.finA === 'number' && isFinite(brut.chrono.finA)) {
      d.chrono = { finA: brut.chrono.finA,
                   duree: +brut.chrono.duree || 0,
                   libelle: String(brut.chrono.libelle || '') };
    }

    /* Les douleurs etaient une liste de chaines ; elles portent maintenant une
       intensite. On convertit a LA LECTURE, pour qu'une sauvegarde ancienne se
       relise sans perte — intensite inconnue, jamais inventee. */
    if (A.m && A.m.normaliserDouleurs) {
      d.seances.forEach(function (s) { s.douleurs = A.m.normaliserDouleurs(s.douleurs); });
    }

    /* Les colonnes de la ligne de serie, et le type de serie disparu : meme
       principe, converti A LA LECTURE pour qu'une sauvegarde ancienne se
       relise entiere. Voir A.m.migrer() — il dit ce qui bouge et ce qui ne
       bouge pas. */
    if (A.m && A.m.normaliserReleves) d.releves = A.m.normaliserReleves(d.releves);
    if (A.m && A.m.migrer) A.m.migrer(d);

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

  /* Le repos en cours est ecrit tout de suite : si le systeme tue la page
     entre deux series — ce qui arrive des qu'on bascule vers un autre app —
     il doit se retrouver au retour, pas disparaitre. */
  function poserChrono(finA, duree, libelle) {
    etat.chrono = finA ? { finA: finA, duree: duree || 0, libelle: libelle || '' } : null;
    ecrire();
  }

  function chronoEnCours() {
    var c = etat.chrono;
    if (!c || c.finA <= Date.now()) return null;   // perime : rien a reprendre
    return c;
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

  /* Fusion d'une sauvegarde dans le carnet courant.

     Remplacer est previsible mais destructeur : importer depuis un vieux
     telephone effacait des seances plus recentes, en silence. Fusionner garde
     les deux cotes.

     Regles, ecrites ici pour qu'on puisse les contester :
       - l'identite est l'id ;
       - un element present des deux cotes est garde DANS SA VERSION COURANTE :
         ce qui est sous les doigts fait foi, l'import ne doit pas defaire une
         saisie du jour ;
       - un element absent du courant est ajoute ;
       - rien n'est jamais supprime par un import.
     Le compte de ce qui a ete ajoute et de ce qui a ete garde est rendu, et
     l'ecran l'affiche : une fusion muette serait pire qu'un remplacement. */
  function fusionner(brut) {
    var entrant = normaliser(brut);
    var bilan = { seancesAjoutees: 0, seancesGardees: 0, relevesAjoutes: 0,
                  programmesAjoutes: 0, programmesGardes: 0,
                  exercicesAjoutes: 0, outilsAjoutes: 0 };

    function parId(liste) {
      var m = {};
      liste.forEach(function (x) { if (x && x.id) m[x.id] = true; });
      return m;
    }

    var vusSeances = parId(etat.seances);
    entrant.seances.forEach(function (s) {
      if (!s || !s.id) return;
      if (vusSeances[s.id]) { bilan.seancesGardees += 1; return; }
      etat.seances.push(s);
      bilan.seancesAjoutees += 1;
    });

    /* Les releves suivent la meme regle que les seances : l'identite est
       l'id, rien n'est jamais supprime par un import. */
    if (!etat.releves) etat.releves = [];
    var vusReleves = parId(etat.releves);
    entrant.releves.forEach(function (r) {
      if (!r || !r.id || vusReleves[r.id]) return;
      etat.releves.push(r);
      bilan.relevesAjoutes = (bilan.relevesAjoutes || 0) + 1;
    });

    var vusProgrammes = parId(etat.programmes);
    entrant.programmes.forEach(function (p) {
      if (!p || !p.id) return;
      if (vusProgrammes[p.id]) { bilan.programmesGardes += 1; return; }
      etat.programmes.push(p);
      bilan.programmesAjoutes += 1;
    });

    /* Les catalogues se fusionnent par slug : ce sont des aides a la saisie,
       pas des donnees. Un doublon n'y serait que du bruit. */
    var vusExos = {};
    etat.exercices.forEach(function (x) { vusExos[x.slug] = true; });
    entrant.exercices.forEach(function (x) {
      if (!x || !x.slug || vusExos[x.slug]) return;
      etat.exercices.push(x);
      vusExos[x.slug] = true;
      bilan.exercicesAjoutes += 1;
    });

    var vusOutils = {};
    etat.outils.forEach(function (o) { vusOutils[o.slug] = true; });
    entrant.outils.forEach(function (o) {
      if (!o || !o.slug || vusOutils[o.slug]) return;
      etat.outils.push(o);
      vusOutils[o.slug] = true;
      bilan.outilsAjoutes += 1;
    });

    bilan.ecrit = ecrire();
    return bilan;
  }

  /* De quand date la sauvegarde, et le carnet courant a-t-il du plus recent
     qu'elle ? C'est ce qui permet d'avertir AVANT un remplacement. */
  function compareFraicheur(brut) {
    function derniere(seances) {
      var d = '';
      (seances || []).forEach(function (s) { if (s && s.date > d) d = s.date; });
      return d || null;
    }
    var ici = derniere(etat.seances);
    var la = derniere((brut && brut.seances) || []);
    return { courant: ici, importe: la,
             courantPlusRecent: !!(ici && (!la || ici > la)) };
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
    poserChrono: poserChrono,
    chronoEnCours: chronoEnCours,
    remplacer: remplacer,
    fusionner: fusionner,
    compareFraicheur: compareFraicheur,
    vide: vide,
    etat: function () { return etat; },
    panne: function () { return panne; },
    surPanne: function (f) { ecoutes.push(f); }
  };
})(window.App || (window.App = {}));
