/* Persistance — une seule clé, tout en try/catch.
   Si localStorage refuse, l'app le DIT (bandeau) plutôt que de perdre la saisie. */
(function (A) {
  'use strict';

  /* Le banc d'interface fait tourner la vraie app, et la vraie app ECRIT :
     lancer un repos pose `chrono` dans le stockage. Sur le telephone, cette
     seule ligne est ce qui empeche un banc ouvert par curiosite d'effacer un
     carnet construit sur des mois. L'isolation est STRUCTURELLE, pas une
     precaution que le banc doit penser a prendre — et le banc la mesure. */
  /* QUATRE CLES, ET AUCUNE NE SE MELANGE AU CARNET REEL.

     `__BANC_MODELE`: le banc de modele. ENTRE LE 04/11, ET IL A COUTE UN
                      CARNET. Ce fichier affirmait que l'isolation etait
                      « structurelle » ; elle l'etait pour le banc
                      d'interface, qui pose son drapeau dans l'iframe qu'il
                      construit. Le banc de MODELE n'en posait aucun, et
                      `banc.js` appelle `remplacer()` cinq fois : ouvrir
                      banc/index.html ecrivait sous 'carnet-aw-v1'. Mesure :
                      12 seances avant, 0 apres, 1597/1597 affiches pendant.
                      Defaut ne le 22/10, vu le 04/11 — treize jours.
     `__BANC_IHM`   : le banc d'interface, qui ecrit et efface sans arret.
     `__BAC_A_SABLE`: la promenade de MB — l'app ENTIERE avec un carnet de
                      demonstration, pour voir les fonctionnements sans
                      toucher a ses donnees. Elle a sa propre cle et non
                      celle du banc, sinon sa promenade laisserait un decor
                      derriere elle et le banc mesurerait ce decor.

     Les drapeaux se posent par l'hote AVANT ce fichier ; rien dans l'app ne
     les pose, donc le carnet reel ne peut pas tomber dessus. CE QUI MANQUAIT
     N'ETAIT PAS LA REGLE, C'ETAIT UN CONTROLE QUI LA MESURE DEPUIS LE BANC
     LUI-MEME : `A.store.CLE` est exporte pour ca. */
  var CLE = window.__BANC_MODELE ? 'carnet-aw-banc'
          : window.__BANC_IHM ? 'carnet-aw-banc-ihm'
          : window.__BAC_A_SABLE ? 'carnet-aw-bac'
          : 'carnet-aw-v1';
  /* LE FILET : un double du carnet, sous une cle QUI N'EST PAS LA SIENNE.

     Ne le 04/11, apres que MB a tout perdu. Il existe pour une raison
     precise : la perte vient d'un ECRASEMENT PAR DU VIDE, et rien dans le
     carnet ne permettait de revenir en arriere. Il ne remplace pas une
     sauvegarde exportee — il la rend moins indispensable le jour ou on n'y
     a pas pense.

     ELLE NE DEPEND PAS DE `CLE` : le filet n'appartient qu'au carnet reel.
     Les bancs et le bac a sable n'en ecrivent aucun, sans quoi mesurer
     ecraserait le filet — le meme defaut, un cran plus bas. */
  var CLE_FILET = 'carnet-aw-filet';
  var VERSION_DONNEES = 1;

  function vide() {
    return {
      versionDonnees: VERSION_DONNEES,
      /* LE DERNIER EXPORT — sa date, et ou en etait le carnet.

         Le carnet n'en gardait aucune trace, donc il ne pouvait rien
         rappeler : pas par choix, par ignorance. `seances` retient combien
         il y en avait AU MOMENT de l'export, ce qui permet de dire
         « N depuis » sans inventer de seuil. `null` tant que rien n'a ete
         exporte — et ce zero-la est le fait le plus parlant. */
      dernierExport: null,

      /* LA REVISION DE CET ETAT — qui l'a ecrit, et quand.

         Elle existe pour qu'une instance sache si une AUTRE a ecrit depuis
         sa derniere lecture. Sans elle, celle qui dort ecrase celle qui
         travaille : le bug de MB du 01/11, reproduit le 04/11. */
      rev: '',
      exercices: [],
      outils: [],
      programmes: [],
      /* Les seances de recuperation : des programmes comme les autres, mais
         qui ne se lancent pas — ils se cochent, jour apres jour. Plusieurs
         depuis le 2026-10-28, a la demande de MB.

         `routineRecup` SURVIT, tenue a jour sur la premiere de la liste :
         une version anterieure reservie par le service worker y retrouve
         une seance au lieu d'un ecran vide. */
      routineRecup: null,
      routinesRecup: [],
      /* MON DICTIONNAIRE — les fiches que MB ecrit lui-meme (nom + muscles).
         INERTE POUR LES VERSIONS ANTERIEURES : 1.46 relit sans broncher une
         sauvegarde qui la porte, elle l'ignore. C'est la garantie de retour
         arriere, et elle ne coute rien ici. */
      dictionnairePerso: [],
      /* Les releves de douleur du lendemain : independants des seances, parce
         que le lendemain d'une grosse seance est souvent un jour de repos. */
      releves: [],
      /* MES PESEES : { id, date, poids }. Datees, parce qu'un poids de corps
         change et qu'une valeur unique recalculerait l'historique a chaque
         pesee. INERTE POUR LES VERSIONS ANTERIEURES, comme le dictionnaire :
         une 1.51 relit sans broncher une sauvegarde qui les porte, elle les
         ignore. C'est la garantie de retour arriere. */
      pesees: [],
      seances: [],
      reglages: { theme: 'auto', ecranAllume: true, notifierRepos: false,
                  /* La periode du Suivi. Un id, valide par le modele a la
                     lecture : un carnet d'une autre version retombe sur le
                     defaut au lieu de casser l'ecran. */
                  periodeSuivi: '3m' },
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
    if (Array.isArray(brut.routinesRecup)) d.routinesRecup = brut.routinesRecup;
    /* SANS CETTE LIGNE, MON DICTIONNAIRE NE SURVIT A RIEN. `normaliser` est
       une liste blanche : une cle qu'elle ignore disparait au premier
       rechargement, et a l'import. Trouve dans le bac a sable, le 28/10 —
       pas par un controle : la fonctionnalite marchait tant qu'on ne
       rechargeait pas. */
    if (Array.isArray(brut.dictionnairePerso)) d.dictionnairePerso = brut.dictionnairePerso;
    if (Array.isArray(brut.releves)) d.releves = brut.releves;
    /* SANS CETTE LIGNE, LES PESEES NE SURVIVENT A RIEN — meme piege que le
       dictionnaire perso, trouve dans le bac a sable le 28/10 : `normaliser`
       est une liste blanche, et la fonctionnalite marche tant qu'on ne
       recharge pas. Un controle du banc rejoue le cycle complet. */
    if (Array.isArray(brut.pesees)) d.pesees = brut.pesees;
    if (Array.isArray(brut.seances)) d.seances = brut.seances;
    if (brut.reglages && typeof brut.reglages === 'object') {
      d.reglages.theme = ['auto', 'clair', 'sombre'].indexOf(brut.reglages.theme) >= 0
        ? brut.reglages.theme : 'auto';
      d.reglages.ecranAllume = brut.reglages.ecranAllume !== false;
      d.reglages.notifierRepos = brut.reglages.notifierRepos === true;
      if (typeof brut.reglages.periodeSuivi === 'string') {
        d.reglages.periodeSuivi = brut.reglages.periodeSuivi;
      }
    }
    if (typeof brut.seanceEnCoursId === 'string') d.seanceEnCoursId = brut.seanceEnCoursId;
    /* LA REVISION TRAVERSE `normaliser`, ET C'EST VITAL.

       `normaliser` est une liste blanche : une cle qu'elle ignore disparait
       au premier rechargement. Si `rev` ne passait pas, chaque lecture la
       perdrait, la detection de conflit ne verrait JAMAIS de difference, et
       la garde serait morte sans que rien ne le dise. C'est le piege deja
       paye par le dictionnaire perso et les pesees, le 28/10. */
    if (typeof brut.rev === 'string') d.rev = brut.rev;
    /* IL TRAVERSE LA LISTE BLANCHE, sans quoi il disparaitrait au premier
       rechargement et le rappel repartirait de zero a chaque ouverture —
       le piege paye par le dictionnaire perso et les pesees le 28/10. */
    if (brut.dernierExport && typeof brut.dernierExport === 'object') {
      d.dernierExport = { le: String(brut.dernierExport.le || ''),
                          seances: +brut.dernierExport.seances || 0 };
    }

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
    if (A.m && A.m.normaliserPesees) d.pesees = A.m.normaliserPesees(d.pesees);
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
      /* ON RETIENT CE QU'ON VIENT DE LIRE : c'est le point de comparaison
         de la garde de conflit. Sans cette ligne, `revConnue` resterait
         `null` et la garde ne se declencherait jamais — elle existerait
         sans jamais s'executer, ce qui est pire que pas de garde. */
      revConnue = typeof etat.rev === 'string' && etat.rev ? etat.rev : null;
      /* LE DOUBLE SE POSE DES LA LECTURE, ET C'EST LA QUE TOUT SE JOUE.

         Premiere epreuve du filet, 04/11 : carnet charge a 12 seances,
         « FILET : AUCUN ». `poserFilet()` n'etait appele que par `ecrire()`
         — or LIRE un carnet n'est pas l'ecrire. Entre la mise a jour et la
         premiere saisie, il n'y avait aucun double, et c'est justement la
         fenetre ou l'on ouvre des pages sans rien saisir. L'ecrasement du
         01/11 est arrive dans cette fenetre : le filet n'aurait rien sauve.

         Il aurait pourtant PARU marcher — les fonctions existent, l'ecran
         s'affiche, le code se relit juste. Seule l'epreuve l'a dit.

         LA GARDE DU ZERO VAUT AUSSI ICI : `poserFilet` sort si l'etat lu
         n'a aucune substance, donc un carnet vide ou illisible n'ecrase
         jamais un double valable. C'est pour ca que l'appel est DANS le
         `try`, apres un `normaliser` reussi, et pas dans le `catch`. */
      poserFilet();
    } catch (e) {
      signaler("Les données enregistrées sont illisibles. Rien n'a été effacé : "
             + "exporte une sauvegarde depuis Réglages avant toute nouvelle saisie.");
      etat = vide();
    }
    return etat;
  }

  /* CE QUE L'ETAT PORTE DE PERDABLE, compte sur ses VRAIS champs.

     La liste est celle de `vide()`, moins ce qui se recalcule ou ne fait mal
     a personne : `reglages` (trois preferences), `chrono` (un repos en
     cours), `seanceEnCoursId` (un pointeur). Ce qui reste est ce qu'on
     pleure. Les noms sont LUS dans `vide()`, pas devines — un champ invente
     rendrait zero sur un carnet plein, et le filet ne se poserait jamais. */
  function substance(e) {
    if (!e || typeof e !== 'object') return 0;
    var n = 0;
    ['seances', 'exercices', 'outils', 'programmes', 'routinesRecup',
     'pesees', 'releves', 'dictionnairePerso'].forEach(function (k) {
      if (Array.isArray(e[k])) n += e[k].length;
    });
    return n;
  }

  /* LE DOUBLE, ET SA SEULE GARDE EST UN ZERO.

     « Si le nouveau est beaucoup plus petit » serait un seuil de moi, et le
     carnet n'en pose aucun. Ce qui se mesure ici est un FAIT : un etat sans
     aucune substance n'ecrase jamais un filet qui en a. C'est precisement ce
     qui aurait sauve MB le 01/11 — l'etat ecrit par le banc etait VIDE.

     Son echec est AVALE : une saisie reussie ne doit pas echouer parce que
     son double n'a pas tenu. */
  function poserFilet() {
    if (CLE !== 'carnet-aw-v1') return;      /* ni banc, ni bac a sable */
    if (!substance(etat)) return;            /* LE ZERO, et rien d'autre */
    try {
      window.localStorage.setItem(CLE_FILET, JSON.stringify({
        le: new Date().toISOString(),
        versionApp: String(A.VERSION || ''),
        etat: etat
      }));
    } catch (e) { /* le filet ne nuit JAMAIS a la sauvegarde */ }
  }

  /* CE QUE LE FILET CONTIENT, pour que l'ecran le DISE avant de proposer
     quoi que ce soit. Il rend `null` quand il n'y a rien, et jamais un objet
     a moitie : un filet illisible vaut pas de filet. */
  function filet() {
    var brut = null;
    try { brut = window.localStorage.getItem(CLE_FILET); } catch (e) { return null; }
    if (!brut) return null;
    var d;
    try { d = JSON.parse(brut); } catch (e) { return null; }
    if (!d || !d.etat || typeof d.etat !== 'object') return null;
    var n = substance(d.etat);
    if (!n) return null;
    return { le: String(d.le || ''), versionApp: String(d.versionApp || ''),
             compte: n, octets: brut.length,
             seances: (d.etat.seances || []).length,
             etat: d.etat };
  }

  /* RESTAURER — et c'est un `remplacer`, donc ca passe par `normaliser`.
     On ne reinjecte pas un objet brut dans l'app : il traverse la meme porte
     que l'import, sans quoi un filet ancien ferait entrer une forme que le
     reste du code ne sait plus lire. */
  /* EFFACER LE DOUBLE POUR DE BON. Il survit a `vider()` — c'est son
     interet — donc « Tout effacer » ne tenait plus sa promesse. Qui prete
     ou revend son telephone doit pouvoir ne rien laisser. */
  /* NOTER L'EXPORT. Appele par l'ecran APRES un telechargement reussi,
     jamais avant : un export qu'on croit fait est pire que pas d'export. */
  function noterExport() {
    etat.dernierExport = { le: new Date().toISOString(),
                           seances: (etat.seances || []).length };
    return ecrire();
  }

  /* CE QU'IL Y A A DIRE SUR LES EXPORTS, en FAITS et sans seuil.

     `jamais` : aucun export, et c'est le cas qui a coute six seances a MB.
     `depuis` : combien de seances se sont ajoutees depuis le dernier. Un
     nombre, pas un jugement — c'est MB qui decide si c'est beaucoup. */
  function etatExport() {
    var d = etat.dernierExport;
    var n = (etat.seances || []).length;
    if (!d || !d.le) return { jamais: true, seances: n, depuis: n, jours: null };
    var jours = null;
    try {
      var t = new Date(d.le).getTime();
      if (!isNaN(t)) jours = Math.floor((Date.now() - t) / 86400000);
    } catch (e) {}
    return { jamais: false, le: d.le, jours: jours, seances: n,
             depuis: Math.max(0, n - (+d.seances || 0)) };
  }

  /* ================================================================
     LA SAUVEGARDE AUTOMATIQUE DANS UN FICHIER

     Demandee par MB le 04/11, apres avoir perdu six seances sans aucun
     export. Mesuree AVANT d'etre ecrite, sur son telephone : son Chrome
     garde la permission d'ecriture apres fermeture de la page, donc
     « automatique » veut vraiment dire automatique chez lui.

     ELLE NE REMPLACE RIEN. Le double de secours couvre l'ecrasement, ce
     fichier couvre l'effacement des donnees du site et le changement
     d'appareil, le bouton d'export couvre le reste et marche partout.
     ================================================================ */
  var BASE_FICHIER = 'carnet-aw-fichier', MAGASIN_FICHIER = 'poignees';
  var poigneeFichier = null;       /* la poignee, une fois reprise */
  var minuteurFichier = null;      /* le regroupement, large */
  var etatFichier = { actif: false, nom: '', le: '', panne: '' };

  function baseFichier() {
    return new Promise(function (ok, ko) {
      if (typeof indexedDB !== 'object' || !indexedDB) { ko(new Error('pas d IndexedDB')); return; }
      var r = indexedDB.open(BASE_FICHIER, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(MAGASIN_FICHIER); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { ko(r.error); };
    });
  }

  function rangerPoignee(h) {
    return baseFichier().then(function (db) {
      return new Promise(function (ok, ko) {
        var t = db.transaction(MAGASIN_FICHIER, 'readwrite');
        if (h) t.objectStore(MAGASIN_FICHIER).put(h, 'carnet');
        else t.objectStore(MAGASIN_FICHIER).delete('carnet');
        t.oncomplete = function () { ok(true); };
        t.onerror = function () { ko(t.error); };
      });
    });
  }

  function reprendrePoignee() {
    return baseFichier().then(function (db) {
      return new Promise(function (ok, ko) {
        var t = db.transaction(MAGASIN_FICHIER, 'readonly');
        var q = t.objectStore(MAGASIN_FICHIER).get('carnet');
        q.onsuccess = function () { ok(q.result || null); };
        q.onerror = function () { ko(q.error); };
      });
    });
  }

  /* LE SUPPORT SE MESURE, IL NE SE SUPPOSE PAS. Un navigateur sans l'API
     ne doit voir AUCUNE proposition : offrir un reglage qui ne peut pas
     marcher est pire que ne rien offrir. */
  function fichierPossible() {
    return typeof window.showSaveFilePicker === 'function'
        && typeof indexedDB === 'object' && indexedDB !== null;
  }

  /* CHOISIR LE FICHIER — le seul geste, et il n'arrive qu'une fois.
     Doit etre appele DEPUIS un geste de MB : le navigateur refuse le
     selecteur sans activation. */
  function choisirFichier() {
    if (!fichierPossible()) return Promise.resolve({ ok: false, raison: 'non supporte' });
    return window.showSaveFilePicker({
      suggestedName: 'carnet-aw.json',
      types: [{ description: 'Carnet AW', accept: { 'application/json': ['.json'] } }]
    }).then(function (h) {
      poigneeFichier = h;
      etatFichier = { actif: true, nom: h.name || 'carnet-aw.json', le: '', panne: '' };
      return rangerPoignee(h).then(function () { return ecrireFichier(true); });
    }).then(function () {
      return { ok: true, nom: etatFichier.nom };
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return { ok: false, raison: 'annule' };
      etatFichier.panne = (e && e.name) || 'erreur';
      return { ok: false, raison: etatFichier.panne };
    });
  }

  function oublierFichier() {
    poigneeFichier = null;
    etatFichier = { actif: false, nom: '', le: '', panne: '' };
    return rangerPoignee(null).catch(function () { return false; });
  }

  /* ECRIRE — et son echec ne remonte JAMAIS jusqu'a la saisie.

     La panne est RANGEE dans `etatFichier.panne` pour que l'ecran puisse la
     dire. Un fichier supprime, une carte retiree, une permission revoquee :
     tout cela arrive, et rien de tout cela ne doit empecher d'enregistrer
     une serie. C'est la lecon du filet, qui avait failli devenir la cause
     de ce qu'il previent. */
  function ecrireFichier(tout_de_suite) {
    if (!poigneeFichier) return Promise.resolve(false);
    if (!tout_de_suite) {
      /* REGROUPEMENT LARGE : le carnet se sauve toutes les 400 ms pendant
         la saisie. Ecrire un fichier a ce rythme n'apporte rien et use le
         stockage. Trois secondes apres la derniere ecriture suffisent. */
      if (minuteurFichier) clearTimeout(minuteurFichier);
      minuteurFichier = setTimeout(function () {
        minuteurFichier = null;
        ecrireFichier(true);
      }, 3000);
      return Promise.resolve(true);
    }
    var texte;
    try { texte = JSON.stringify(etat, null, 2); }
    catch (e) { etatFichier.panne = 'donnees illisibles'; return Promise.resolve(false); }

    return poigneeFichier.queryPermission({ mode: 'readwrite' }).then(function (p) {
      /* ON NE DEMANDE RIEN ICI. `requestPermission` exige un geste de MB :
         l'appeler depuis une ecriture de fond echouerait, et pire,
         consommerait le droit de demander. L'ecran s'en charge. */
      if (p !== 'granted') {
        etatFichier.panne = 'permission a redonner';
        signaler(messageFichier());
        return false;
      }
      return poigneeFichier.createWritable().then(function (f) {
        return f.write(texte).then(function () { return f.close(); });
      }).then(function () {
        etatFichier.le = new Date().toISOString();
        etatFichier.panne = '';
        return true;
      });
    }).catch(function (e) {
      etatFichier.panne = (e && e.name) || 'erreur';
      return false;
    });
  }

  /* REPRENDRE LA POIGNEE AU DEMARRAGE, sans rien demander. */
  function reprendreFichier() {
    if (!fichierPossible()) return Promise.resolve(false);
    return reprendrePoignee().then(function (h) {
      if (!h) return false;
      poigneeFichier = h;
      etatFichier.actif = true;
      etatFichier.nom = h.name || 'carnet-aw.json';
      return h.queryPermission({ mode: 'readwrite' }).then(function (p) {
        etatFichier.panne = p === 'granted' ? '' : 'permission a redonner';
        /* ON LE DIT TOUT DE SUITE, sans attendre une ecriture : au
           demarrage, MB doit savoir AVANT de saisir que le fichier ne
           suivra pas. */
        signaler(messageFichier());
        return p === 'granted';
      });
    }).catch(function (e) {
      etatFichier.panne = (e && e.name) || 'erreur';
      return false;
    });
  }

  /* REDONNER LA PERMISSION — depuis un geste de MB, et de la seulement. */
  function redonnerPermissionFichier() {
    if (!poigneeFichier) return Promise.resolve(false);
    return poigneeFichier.requestPermission({ mode: 'readwrite' }).then(function (p) {
      etatFichier.panne = p === 'granted' ? '' : 'permission refusee';
      signaler(messageFichier());
      if (p === 'granted') return ecrireFichier(true);
      return false;
    }).catch(function (e) {
      etatFichier.panne = (e && e.name) || 'erreur';
      return false;
    });
  }

  /* CE QU'IL Y A A DIRE DU FICHIER, ou rien.

     Rend `null` quand tout va bien — c'est ce que `signaler` attend pour
     effacer le bandeau. Un fichier qui n'a jamais ete choisi ne dit rien
     non plus : on n'alerte pas sur une fonctionnalite non utilisee. */
  function messageFichier() {
    if (!etatFichier.actif || !etatFichier.panne) return null;
    if (etatFichier.panne === 'permission a redonner') {
      return "La sauvegarde automatique a decroche : le navigateur redemande "
           + "l'acces au fichier. Reglages, Sauvegarde automatique, "
           + "« Redonner l'acces » — sinon le fichier n'est plus tenu a jour.";
    }
    return "La sauvegarde automatique ne fonctionne plus (" + etatFichier.panne
         + "). Ton carnet est enregistre normalement, mais le fichier ne suit "
         + "plus : va voir dans Reglages.";
  }

  function infoFichier() {
    return { possible: fichierPossible(), actif: etatFichier.actif,
             nom: etatFichier.nom, le: etatFichier.le, panne: etatFichier.panne };
  }

  function effacerFilet() {
    try { window.localStorage.removeItem(CLE_FILET); return true; }
    catch (e) { return false; }
  }

  function restaurerFilet() {
    var f = filet();
    if (!f) return false;
    return remplacer(f.etat);
  }

  /* LA REVISION QUE CETTE INSTANCE A LUE OU ECRITE EN DERNIER.

     `null` tant qu'on n'a rien lu : une instance qui n'a jamais charge ne
     peut pas juger d'un conflit, et elle n'ecrase donc rien a tort. */
  var revConnue = null;

  function nouvelleRev() {
    return String(Date.now()) + '.' + Math.random().toString(36).slice(2, 8);
  }

  /* CE QUE LE DISQUE PORTE COMME REVISION, sans toucher a `etat`.

     Un disque illisible rend `null`, et `null` ne declenche AUCUN conflit :
     on ne veut pas qu'un stockage abime empeche d'enregistrer. La garde
     protege d'un ecrasement, elle ne doit pas devenir un blocage. */
  function revDuDisque() {
    var brut;
    try { brut = window.localStorage.getItem(CLE); } catch (e) { return null; }
    if (!brut) return null;
    try {
      var d = JSON.parse(brut);
      return d && typeof d.rev === 'string' && d.rev ? d.rev : null;
    } catch (e) { return null; }
  }

  function ecrire() {
    /* ---- UNE AUTRE INSTANCE A-T-ELLE ECRIT DEPUIS NOTRE DERNIERE VUE ? ----

       C'est le bug de MB, reproduit le 04/11 : une instance ouverte AVANT
       ses saisies, reveillee puis passee en arriere-plan, ecrivait sa
       memoire perimee par-dessus. Outils intacts (elle les avait), six
       seances disparues (elle ne les a jamais eues).

       ON NE REFUSE PAS L'ECRITURE, ON FUSIONNE. Refuser ferait perdre ce
       que CETTE instance a en memoire ; ecraser fait perdre ce que l'autre
       a ecrit. La fusion ne perd ni l'un ni l'autre, et c'est la regle du
       carnet : rien ne se supprime tout seul.

       LE PRIX EST REEL ET IL EST DIT : une seance supprimee dans une
       instance peut revenir si une autre, perimee, la porte encore. Mieux
       vaut une seance qui revient — on peut la resupprimer — qu'une qui
       disparait sans trace. */
    var surDisque = revDuDisque();
    /* `null` COMPTE COMME UNE VALEUR, et c'est tout le correctif du 04/11.

       La condition exigeait une revision DES DEUX COTES. Deux relectures
       et une mesure (revue/mesure-garde-desarmee.html) ont montre que
       chacune des deux exigences ouvrait un trou :

         `revConnue !== null` -> une instance ouverte sur un carnet VIDE
             n'etait jamais gardee. Mesure : 6 seances et 2 equipements
             passes a ZERO. C'est l'etat d'un carnet apres une perte.

         `surDisque !== null` -> une instance d'avant 1.73 reecrit sans la
             cle `rev` (son `normaliser` ne la relit pas), et la garde se
             coupait alors pour TOUTES les instances. Mesure : 2 -> 1.

       `revConnue === null` ne dit pas « je suis seule » : il dit « je n'ai
       rien lu, ou j'ai lu un carnet sans revision ». Pareil pour le
       disque. Ce sont des raisons de se mefier, pas d'ecraser. */
    if (surDisque !== revConnue) {
      var brutDisque = null;
      try { brutDisque = window.localStorage.getItem(CLE); } catch (e) {}
      if (brutDisque) {
        try { fusionnerDans(JSON.parse(brutDisque)); } catch (e) { /* illisible : on garde ce qu'on a */ }
      }
    }

    etat.rev = nouvelleRev();
    revConnue = etat.rev;

    try {
      window.localStorage.setItem(CLE, JSON.stringify(etat));
      /* `signaler(null)` EFFACAIT LE BANDEAU A CHAQUE SAUVEGARDE, donc un
         message pose par le fichier aurait vecu 400 ms. Le bandeau reflete
         maintenant l'etat REEL : rien a dire, ou la panne du fichier. */
      signaler(messageFichier());
      poserFilet();
      /* LE FICHIER VIENT EN DERNIER, et son echec est avale : une serie
         enregistree ne doit pas echouer parce qu'un fichier externe n'a pas
         repondu. Regroupe sur 3 s — le carnet, lui, se sauve toutes les
         400 ms pendant la saisie. */
      try { ecrireFichier(false); } catch (e) {}
      return true;
    } catch (e) {
      var plein = e && (e.name === 'QuotaExceededError' || e.code === 22);
      /* LE STOCKAGE EST PLEIN : LE FILET EST SACRIFIE, PAS LA SAISIE.

         Mieux vaut perdre le double que la serie qu'on vient de faire. On
         retire le filet, on reessaie UNE fois, et on ne le repose pas dans
         la foulee — il reviendra a la prochaine ecriture si la place y est.
         Sans ca, le filet pourrait etre la cause meme d'une saisie perdue :
         un garde-fou qui provoque ce qu'il previent. */
      if (plein) {
        try {
          window.localStorage.removeItem(CLE_FILET);
          window.localStorage.setItem(CLE, JSON.stringify(etat));
          signaler("Le stockage était plein : la sauvegarde de secours a "
                 + "été retirée pour garder ta saisie. Exporte une "
                 + "sauvegarde depuis Réglages, puis fais de la place.");
          return true;
        } catch (e2) { /* vraiment plein : on tombe dans le message ci-dessous */ }
      }
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
  /* `fusionner` ECRIVAIT A LA FIN, donc l'appeler depuis `ecrire()` aurait
     boucle. Le corps vit maintenant ici, sans ecriture ; `fusionner` reste
     ce qu'il etait (fusion + ecriture) pour l'import, et la garde de
     conflit appelle cette version-ci. */
  function fusionner(brut) {
    var bilan = fusionnerDans(brut);
    bilan.ecrit = ecrire();
    return bilan;
  }

  function fusionnerDans(brut) {
    var entrant = normaliser(brut);
    var bilan = { seancesAjoutees: 0, seancesGardees: 0, relevesAjoutes: 0,
                  programmesAjoutes: 0, programmesGardes: 0,
                  exercicesAjoutes: 0, outilsAjoutes: 0,
                  fichesAjoutees: 0, fichesGardees: 0,
                  peseesAjoutees: 0, peseesGardees: 0 };

    function parId(liste) {
      var m = {};
      liste.forEach(function (x) { if (x && x.id) m[x.id] = true; });
      return m;
    }

    /* OU EST L'ELEMENT, pas seulement s'il y est : pour le remplacer par
       une version plus fournie, il faut sa place. */
    function placesParId(liste) {
      var m = {};
      liste.forEach(function (x, i) { if (x && x.id) m[x.id] = i; });
      return m;
    }

    /* COMPTER CE QU'UN ELEMENT PORTE VRAIMENT.

       Un grain = une valeur non vide, comptee recursivement. Une seance a
       trois exercices de deux series pese plus qu'une seance vide portant
       le meme id. C'est ce qui permet de trancher un conflit sans inventer
       d'horodatage — et un horodatage neuf devrait etre relu par
       `normaliser`, sans quoi il disparaitrait au rechargement. */
    function grains(x) {
      if (x === null || x === undefined || x === '') return 0;
      if (Array.isArray(x)) {
        var n = 0;
        x.forEach(function (y) { n += grains(y); });
        return n;
      }
      if (typeof x === 'object') {
        var n = 0;
        Object.keys(x).forEach(function (k) { n += grains(x[k]); });
        return n;
      }
      return 1;
    }

    /* A ID EGAL, LA VERSION LA PLUS FOURNIE GAGNE.

       Mesure du 04/11 : sans ceci, une instance endormie vidait une seance
       de ses 3 exercices en la laissant en place. Le prix — un element
       supprime qui revient — est celui que `ecrire` assume deja juste
       au-dessus, et pour la meme raison : on peut resupprimer, on ne peut
       pas deviner ce qui a disparu. */
    function garderLePlusFourni(liste, places, entrants, bilanAjout, bilanGarde) {
      entrants.forEach(function (x) {
        if (!x || !x.id) return;
        var i = places[x.id];
        if (i === undefined) {
          places[x.id] = liste.length;
          liste.push(x);
          bilan[bilanAjout] += 1;
          return;
        }
        if (grains(x) > grains(liste[i])) liste[i] = x;
        bilan[bilanGarde] += 1;
      });
    }

    garderLePlusFourni(etat.seances, placesParId(etat.seances), entrant.seances,
                       'seancesAjoutees', 'seancesGardees');

    /* Les releves suivent la meme regle que les seances : l'identite est
       l'id, rien n'est jamais supprime par un import. */
    if (!etat.releves) etat.releves = [];
    var vusReleves = parId(etat.releves);
    entrant.releves.forEach(function (r) {
      if (!r || !r.id || vusReleves[r.id]) return;
      etat.releves.push(r);
      bilan.relevesAjoutes = (bilan.relevesAjoutes || 0) + 1;
    });

    garderLePlusFourni(etat.programmes, placesParId(etat.programmes), entrant.programmes,
                       'programmesAjoutes', 'programmesGardes');

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

    /* MES FICHES SUIVENT LA MEME REGLE QUE LE RESTE : l'identite est l'id,
       celle qui est sous les doigts fait foi, et rien n'est supprime. Sans
       ce bloc, importer une sauvegarde laissait le dictionnaire du carnet
       courant intact mais perdait celles de la sauvegarde — une moitie. */
    var mesFiches = Array.isArray(etat.dictionnairePerso) ? etat.dictionnairePerso : (etat.dictionnairePerso = []);
    var vuesFiches = parId(mesFiches);
    var nomsVus = {};
    mesFiches.forEach(function (f) { if (f && f.nom && A.m) nomsVus[A.m.slug(f.nom)] = true; });
    (entrant.dictionnairePerso || []).forEach(function (f) {
      if (!f || !f.id) return;
      if (vuesFiches[f.id]) { bilan.fichesGardees += 1; return; }
      /* DEUX FICHES DU MEME NOM NE PEUVENT PAS COEXISTER : la recherche n'en
         montrerait qu'une, au hasard de l'ordre. Celle d'ici gagne, comme
         partout ailleurs dans cette fusion. */
      if (A.m && nomsVus[A.m.slug(f.nom)]) { bilan.fichesGardees += 1; return; }
      mesFiches.push(f);
      if (A.m) nomsVus[A.m.slug(f.nom)] = true;
      bilan.fichesAjoutees += 1;
    });

    /* MES PESEES, MEME REGLE. Sans ce bloc, importer une sauvegarde
       garderait les pesees d'ici et perdrait les siennes — la moitie que
       `normaliser` ne rattrape pas, parce qu'elle ne garde que ce qui est
       DEJA dans le carnet courant.

       UNE PESEE PAR JOUR VAUT AUSSI A L'IMPORT : deux ids differents sur la
       meme date feraient deux pesees le meme jour, et `poidsAuJour` en
       prendrait une au hasard de l'ordre. Celle d'ici gagne. */
    var mesPesees = Array.isArray(etat.pesees) ? etat.pesees : (etat.pesees = []);
    var vuesPesees = parId(mesPesees);
    var datesVues = {};
    mesPesees.forEach(function (p) { if (p && p.date) datesVues[p.date] = true; });
    (entrant.pesees || []).forEach(function (p) {
      if (!p || !p.id) return;
      if (vuesPesees[p.id] || datesVues[p.date]) {
        bilan.peseesGardees = (bilan.peseesGardees || 0) + 1;
        return;
      }
      mesPesees.push(p);
      datesVues[p.date] = true;
      bilan.peseesAjoutees = (bilan.peseesAjoutees || 0) + 1;
    });

    /* LES ROUTINES DE RECUPERATION MANQUAIENT A CETTE FUSION, et elles
       comptent : MB en avait trois. Sans ce bloc, une routine creee dans
       une autre instance (ou dans une sauvegarde importee) etait perdue,
       alors que les JOURNEES de recup, elles, passaient par `seances`. La
       moitie, encore — piege n° 5. */
    if (!Array.isArray(etat.routinesRecup)) etat.routinesRecup = [];
    var vuesRoutines = parId(etat.routinesRecup);
    (entrant.routinesRecup || []).forEach(function (r) {
      if (!r || !r.id || vuesRoutines[r.id]) return;
      etat.routinesRecup.push(r);
      bilan.routinesAjoutees = (bilan.routinesAjoutees || 0) + 1;
    });

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
    CLE_FILET: CLE_FILET,
    substance: substance,
    filet: filet,
    restaurerFilet: restaurerFilet,
    effacerFilet: effacerFilet,
    noterExport: noterExport,
    etatExport: etatExport,
    fichierPossible: fichierPossible,
    choisirFichier: choisirFichier,
    oublierFichier: oublierFichier,
    reprendreFichier: reprendreFichier,
    redonnerPermissionFichier: redonnerPermissionFichier,
    infoFichier: infoFichier,
    revConnue: function () { return revConnue; },
    revDuDisque: revDuDisque,
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
