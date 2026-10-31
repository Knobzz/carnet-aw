/* LES QUATRE ÉTAGES, GREFFÉS SUR L'APPLICATION RÉELLE.

   MB, 2026-10-31 : « Nan, je veux la simulation fidèle de l'application avec
   ces changements. »

   CE FICHIER NE REMPLACE RIEN DE L'APP. Il se charge APRÈS les treize
   scripts, enveloppe `A.panneau.editerExercice`, laisse le vrai panneau se
   construire entièrement, puis REMPLACE dans le DOM le seul bloc des
   variantes par les étages 2, 3 et 4. Tout le reste — la navigation, les
   séances, le Suivi, le Journal, les Réglages, le dictionnaire feuilletable
   — est l'app, sans un octet de différence.

   POURQUOI ENVELOPPER PLUTÔT QUE RÉÉCRIRE : `editerExercice` fait quatre
   cents lignes. Une copie modifiée aurait divergé du vrai panneau à la
   première retouche, et la simulation aurait menti sans qu'on le voie.

   CE QUI REND L'ENVELOPPE POSSIBLE, vérifié dans les sources :
     - les quatre appelants passent par `A.panneau.editerExercice(...)` au
       moment du clic, jamais par une référence capturée au chargement ;
     - `valider()` écrit dans `exo` et lit `exo.outils` — donc ce que les
       étages posent sur l'objet est gardé à l'enregistrement.

   RIEN N'EST ÉCRIT SUR LE DISQUE. Les neuf gestes vivent en mémoire, le
   temps de la page. Le carnet, lui, est le vrai : localStorage. */
(function (A) {
  'use strict';
  var m = A.m, V = A.variantes;
  var journal = [];
  function noter(x) { journal.push(x); }

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (k) {
      if (k) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
    });
    return e;
  }

  /* ============ 1. LES NEUF GESTES, EN MÉMOIRE ============
     Chaque ajout est VÉRIFIÉ : la fiche existe, le nom est libre. Un ajout
     refusé est COMPTÉ et dit — une simulation qui perd un ajout en silence
     ment sur ce qu'elle montre. */
  var poses = [], refuses = [];
  ((A.gestesAjoutes && A.gestesAjoutes.AJOUTS) || []).forEach(function (g) {
    var f = (m.DICTIONNAIRE || []).filter(function (x) { return x.nom === g.fiche; })[0];
    if (!f) { refuses.push(g.nom + ' : fiche « ' + g.fiche + ' » absente'); return; }
    var tous = [g.nom].concat(g.aussi || []);
    var pris = tous.filter(function (n) { return !!m.ficheLivree(n); });
    if (pris.length) { refuses.push(g.nom + ' : « ' + pris.join(', ') + ' » déjà pris'); return; }
    f.aussi = (f.aussi || []).concat(tous);
    poses.push(g);
  });
  noter(poses.length + ' gestes posés, ' + refuses.length + ' refusés');

  var CLASSE = {};
  poses.forEach(function (g) {
    CLASSE[g.fiche + ' § ' + g.nom] = 'geste';
    (g.aussi || []).forEach(function (n) { CLASSE[g.fiche + ' § ' + n] = 'syn'; });
  });
  var RSS = (A.gestesAjoutes && A.gestesAjoutes.REND_SON_STATUT) || {};
  var pushPressEntre = poses.some(function (g) { return g.nom === 'Push press'; });
  if (pushPressEntre) Object.keys(RSS).forEach(function (id) { CLASSE[id] = RSS[id].code; });

  function codeDe(fiche, nom) {
    var id = fiche + ' § ' + nom;
    if (CLASSE[id]) return CLASSE[id];
    var pr = A.classementNoms && A.classementNoms.PLAT[id];
    return (pr && pr.code) || 'syn';
  }
  function explDe(nom) {
    var g = poses.filter(function (x) { return x.nom === nom; })[0];
    if (g) return g;
    var cle = Object.keys(RSS).filter(function (id) {
      return id.split(' § ')[1] === nom; })[0];
    if (cle && pushPressEntre) return RSS[cle];
    return (A.explicationsGestes && A.explicationsGestes.E[nom]) || null;
  }
  function estNeuf(nom) {
    return poses.some(function (x) { return x.nom === nom; })
        || (pushPressEntre && Object.keys(RSS).some(function (id) {
             return id.split(' § ')[1] === nom; }));
  }

  /* ============ 2. LE MATÉRIEL ET L'ÉQUIPEMENT AW ============ */
  var MATERIEL = [
    { cat: 'Barres', items: [{ nom: 'Barre' }, { nom: 'Barre EZ' },
      { nom: 'Barre guidée' }, { nom: 'Landmine' }] },
    { cat: 'Poids libres', items: [{ nom: 'Haltères' }, { nom: 'Kettlebell' },
      { nom: 'Disque' }] },
    /* RENOMMEE le 31/10 — MB : « Cables et resistance faut trouver
       autre chose car on a machine.... ». Les trois objets sont
       Poulie, Elastique, Machine : « Machines et elastiques » les
       couvre sans mentir, une poulie etant une machine au sens
       courant. */
    { cat: 'Machines et élastiques', items: [
      { nom: 'Poulie', reglages: ['haute', 'basse', 'vis-à-vis'] },
      { nom: 'Élastique' }, { nom: 'Machine' }] },
    { cat: 'Appuis', items: [
      { nom: 'Banc', reglages: ['plat', 'incliné 15°', 'incliné 30°',
                                'incliné 45°', 'décliné'] },
      { nom: 'Pupitre' }, { nom: 'Chaise' }, { nom: 'Barre fixe' },
      { nom: 'Au sol' }] },
    { cat: 'Position du corps', items: [{ nom: 'Debout' }, { nom: 'Assis' },
      { nom: 'Couché' }, { nom: 'À genoux' }, { nom: 'Unilatéral' }] }
  ];
  var TOUT_MATERIEL = {};
  MATERIEL.forEach(function (g) {
    g.items.forEach(function (it) { TOUT_MATERIEL[it.nom] = it; });
  });
  /* ================= PAS D'ETAGE 4 =================

     MB, 31/10 : « 4-Equipement AW ne doit pas etre present, il est deja en
     bas avec "Equipements" ». MESURE : le panneau porte dix groupes, dont
     « Equipements » et « Reglage de l'outil ». L'etage 4 affichait les
     memes outils une seconde fois, quelques centimetres plus haut.

     IL NE RESTE DONC QUE TROIS ETAGES ICI : l'exercice, la facon de
     l'executer, le materiel. L'equipement de bras de fer reste ou il a
     toujours ete, dans le groupe de l'app, avec son catalogue de marques
     et ses reglages — que mon etage 4 ne savait pas faire. */

  /* `exo.outils` porte MON materiel ET l'equipement de l'app. On ne garde
     a l'etage 3 que ce qui est du materiel ordinaire ; le reste appartient
     au groupe « Equipements » et n'est pas touche ici. Dans le carnet
     construit pour de bon, le materiel meriterait son propre champ — c'est
     dit au chantier. */
  function estMateriel(nom) {
    return !!TOUT_MATERIEL[String(nom).split(' · ')[0]];
  }

  /* ============ 3. LA GREFFE ============ */
  function greffer(exo, panneau) {
    var champNom = panneau.querySelector(
      'input.champ[placeholder="Curl marteau fat grip"]');
    if (!champNom) { noter('ANCRAGE INTROUVABLE — le champ du nom a changé'); return false; }
    var gNom = champNom.closest('.groupe');
    if (!gNom) { noter('ANCRAGE INTROUVABLE — pas de .groupe parent'); return false; }

    /* ================= TROUVER LE BON BLOC =================

       PREMIERE VERSION FAUSSE, et la mesure l'a dit : je prenais
       `gNom.lastElementChild`. Or l'app empile DANS CET ORDRE —

           label · champNom · btDico · zoneVariantes · zoneDico

       — donc le dernier enfant est `zoneDico`, LE DICTIONNAIRE
       FEUILLETABLE. Je le detournais, et le menu de variantes de l'app
       restait affiche a cote du mien : DEUX listes de variantes, et les
       muscles venaient du clic sur CELLE DE L'APP, pas de mon code. J'ai
       failli attribuer a ma correction un resultat qui ne venait pas d'elle.

       LES DEUX SONT DES <div> SANS CLASSE : on prend le PREMIER, qui est
       `zoneVariantes`, et on verifie qu'il en reste un second — sinon
       l'ordre a change et on refuse de greffer plutot que de casser.

       ET ON MASQUE AU LIEU DE DETRUIRE : `rendreVariantes()` de l'app
       continue d'ecrire dedans a chaque frappe. Le vider ne servirait a
       rien, il se remplirait tout seul. */
    var nus = [].slice.call(gNom.children).filter(function (c) {
      return c.tagName === 'DIV' && !c.className;
    });
    if (nus.length < 2) {
      noter('ANCRAGE INTROUVABLE — ' + nus.length + ' div(s) nu(s) dans gNom, '
            + 'l’ordre du panneau a changé');
      return false;
    }
    var blocApp = nus[0];
    blocApp.style.display = 'none';   /* masque, jamais detruit */
    var zone = h('div');
    gNom.insertBefore(zone, blocApp.nextSibling);

    var ouverts = {};   /* survit au re-rendu : voir plus bas */

    function rendre() {
      zone.innerHTML = '';
      var nom = champNom.value.trim();
      var fiche = nom ? m.ficheDictionnaire(nom, A.store.etat()) : null;
      /* le nom de BASE, pas l'écriture tapée — c'est le piège n°1 du
         projet : `ficheDictionnaire` rend la fiche, dont `nom` est la base */
      var base = fiche ? fiche.nom : null;

      /* --- étage 2 : la façon de l'exécuter --- */
      var gestes = [];
      if (fiche) {
        var pris = {};
        V.variantesDe(fiche).forEach(function (v) {
          (v.ecritures || []).forEach(function (e) { pris[e] = 1; });
        });
        gestes = (fiche.aussi || []).filter(function (n) {
          return codeDe(base, n) === 'geste';
        });
      }
      if (fiche) {
        zone.appendChild(h('div', { class: 'item-resume',
          style: 'margin:10px 2px 4px', text: gestes.length
            ? '2 — La façon de l’exécuter · ' + gestes.length + ' connue(s)'
            : '2 — La façon de l’exécuter · ce mouvement n’en a pas d’autre' }));
        if (gestes.length) {
          var p2 = h('div', { class: 'dico-variantes' });
          [base].concat(gestes).forEach(function (n) {
            var b = h('button', { type: 'button', class: 'dico-variante',
              'aria-pressed': n === nom ? 'true' : 'false' });
            b.appendChild(document.createTextNode(
              n === base ? 'le mouvement simple' : n));
            if (estNeuf(n)) {
              b.appendChild(h('span', { style: 'margin-left:5px;font-size:.62rem;'
                + 'background:#2f5e44;color:#d6ffe6;border-radius:999px;'
                + 'padding:1px 6px;font-weight:700', text: 'NEUF' }));
            }
            b.addEventListener('click', function () {
              champNom.value = n;
              /* LES MUSCLES, SANS QUOI L'EXERCICE S'ENREGISTRE VIDE.

                 Mesure du 31/10 : poser le nom au clavier laissait
                 `muscles: 0` en base. Le menu de l'app, lui, passait par
                 `poserNom` -> `prendre(f)`.

                 ON NE PEUT PAS APPELER `prendre` DEPUIS ICI, et ce n'est
                 pas qu'une question de portee : pour une fiche BRUTE du
                 dictionnaire (qui n'a pas `duDictionnaire`), `prendre`
                 prend la branche « reprendre un nom connu », qui fait
                 `exo.outils = (it.outils || []).slice()` — elle EFFACERAIT
                 le materiel pose aux etages 3 et 4.

                 On reproduit donc la branche `duDictionnaire`, celle que
                 MB a decidee le 23/10 : une entree du dictionnaire remplit
                 LES MUSCLES ET RIEN D'AUTRE. */
              var f2 = m.ficheDictionnaire(n, A.store.etat());
              if (f2 && (f2.muscles || []).length) {
                exo.muscles = m.muscles(f2);
                noter('muscles repris de « ' + f2.nom + ' » : '
                      + exo.muscles.length);
              }
              /* `input` met a jour ce que l'app ecoute sur ce champ */
              champNom.dispatchEvent(new Event('input', { bubbles: true }));
              rendre();
            });
            p2.appendChild(b);
          });
          zone.appendChild(p2);

          var xp = (nom !== base) && explDe(nom);
          if (xp) {
            var bx = h('div', { class: 'item-resume',
              style: 'margin:7px 2px;line-height:1.45;white-space:normal' });
            bx.appendChild(h('div', { html: '<b>Le geste.</b> ' + xp.faire }));
            if (xp.change) bx.appendChild(h('div', { style: 'margin-top:4px',
              html: '<b>Ce que ça change.</b> ' + xp.change }));
            if (xp.garde) bx.appendChild(h('div', { style: 'margin-top:4px',
              html: '<b>À savoir.</b> ' + xp.garde }));
            bx.appendChild(h('div', { style: 'margin-top:4px;opacity:.7;'
              + 'font-style:italic', text: 'cherché le 31/10 — ' + xp.source }));
            zone.appendChild(bx);
          }
        }
      }

      /* --- étage 3 : le matériel --- */
      var outils = (exo.outils || []).slice();
      var mat = outils.filter(estMateriel);
      var aw = outils.filter(function (x) { return !estMateriel(x); });

      zone.appendChild(h('div', { class: 'item-resume',
        style: 'margin:12px 2px 4px', text: '3 — Matériel · '
          + (mat.length ? mat.length + ' posé(s)' : 'facultatif, cumulable') }));
      if (mat.length) {
        var pm = h('div', { class: 'puces' });
        mat.forEach(function (x) {
          var b = h('button', { type: 'button', class: 'puce puce-suggeree',
            'aria-pressed': 'true', text: x });
          b.addEventListener('click', function () {
            exo.outils = (exo.outils || []).filter(function (o) { return o !== x; });
            rendre();
          });
          pm.appendChild(b);
        });
        zone.appendChild(pm);
      }
      /* UNE CATEGORIE SE REPLIE — MB : « il faut que 3-Materiel puisse etre
         reduit pour chaque categories ».

         REPLIEES PAR DEFAUT, sauf celles qui portent deja un posé : sinon
         l'ecran s'ouvre sur vingt puces et le nom de l'exercice sort du
         champ de vision. L'etat d'ouverture SURVIT au re-rendu, qui a lieu
         a chaque clic — sans `ouverts`, poser une puce refermait la
         categorie qu'on etait en train d'employer. */
      MATERIEL.forEach(function (g) {
        var dedans = g.items.filter(function (it) {
          return mat.some(function (x) { return x.split(' · ')[0] === it.nom; });
        });
        var libres = g.items.filter(function (it) {
          return dedans.indexOf(it) < 0;
        });
        var d = h('details', { class: 'mat-cat' });
        if (ouverts[g.cat] || dedans.length) d.setAttribute('open', '');
        d.addEventListener('toggle', function () { ouverts[g.cat] = d.open; });
        var sm = h('summary', { style: 'cursor:pointer;padding:5px 2px;'
          + 'font-size:.78rem;color:var(--texte-2);list-style:revert' });
        sm.appendChild(document.createTextNode(g.cat));
        if (dedans.length) {
          sm.appendChild(h('span', { class: 'equip-compte',
            style: 'margin-left:6px', text: String(dedans.length) }));
        }
        d.appendChild(sm);
        if (libres.length) {
          var pc = h('div', { class: 'puces' });
          libres.forEach(function (it) {
            var b = h('button', { type: 'button', class: 'puce', text: it.nom });
            b.addEventListener('click', function () {
              exo.outils = (exo.outils || []).concat([it.nom]);
              rendre();
            });
            pc.appendChild(b);
          });
          d.appendChild(pc);
        } else {
          d.appendChild(h('div', { class: 'item-resume',
            style: 'margin:2px', text: 'tout est posé.' }));
        }
        zone.appendChild(d);
      });
      /* le réglage ne s'ouvre que pour ce qui en a un */
      mat.forEach(function (x) {
        var base2 = x.split(' · ')[0];
        var def = TOUT_MATERIEL[base2];
        if (!def || !def.reglages) return;
        var courant = x.indexOf(' · ') > 0 ? x.split(' · ')[1] : null;
        zone.appendChild(h('div', { class: 'equip-cat',
          text: base2 + ' — réglage' }));
        var pr = h('div', { class: 'puces' });
        def.reglages.forEach(function (v) {
          var b = h('button', { type: 'button', class: 'puce',
            'aria-pressed': courant === v ? 'true' : 'false', text: v });
          b.addEventListener('click', function () {
            var neuf = (courant === v) ? base2 : (base2 + ' · ' + v);
            exo.outils = (exo.outils || []).map(function (o) {
              return o === x ? neuf : o; });
            rendre();
          });
          pr.appendChild(b);
        });
        zone.appendChild(pr);
      });

      /* L'EQUIPEMENT DE BRAS DE FER N'EST PAS ICI : il vit dans le groupe
         « Equipements » de l'app, quelques centimetres plus bas, avec son
         catalogue de marques et ses reglages. */
      if (aw.length) {
        zone.appendChild(h('div', { class: 'item-resume',
          style: 'margin:10px 2px 0;opacity:.75',
          text: aw.length + ' équipement(s) de bras de fer posé(s) plus bas, '
              + 'dans « Équipements » : ' + aw.join(', ') }));
      }
    }

    /* CE QUE LA GREFFE NE SAIT PAS FAIRE, et qui est dit a l'ecran :
       `rafraichirMuscles()` est interne au panneau. Les muscles sont bien
       ECRITS dans `exo` — donc enregistres — mais le selecteur affiche
       encore l'etat d'avant tant qu'on ne touche pas au champ. Dans le
       carnet construit pour de bon, l'etage 2 appellerait `prendre`. */
    champNom.addEventListener('input', rendre);
    champNom.addEventListener('change', rendre);

    /* ================= LE CHEMIN MUET =================

       MB, 31/10 : « Je viens de cliquer sur Biceps, et je n'ai pas la
       possibilite ensuite de selectionner un geste different ».

       LA CAUSE EST DANS LA SOURCE DE L'APP, et elle est VOLONTAIRE :
       `poserNom` ecrit `champNom.value` puis dit en commentaire « PAS DE
       `input` EMIS ICI » — l'autocompletion ecoute cet evenement et se
       deployait par-dessus le dictionnaire. Aucun evenement ne part donc
       quand on choisit depuis le dictionnaire feuilletable, et aucun
       listener ne PEUT entendre. Ecouter plus fort n'y aurait rien fait.

       ON INTERCEPTE L'ECRITURE DE `.value` sur cette seule instance, en
       appelant le setter natif pour ne rien changer au comportement. Ca
       attrape TOUS les chemins d'un coup — le dictionnaire, les puces de
       l'app, la frappe — au lieu de courir apres chacun. */
    (function () {
      var proto = Object.getPrototypeOf(champNom);
      var natif = Object.getOwnPropertyDescriptor(proto, 'value');
      if (!natif || !natif.set) { noter('VALUE NON INTERCEPTABLE'); return; }
      Object.defineProperty(champNom, 'value', {
        configurable: true,
        get: function () { return natif.get.call(this); },
        set: function (v) {
          var avant = natif.get.call(this);
          natif.set.call(this, v);
          if (v !== avant) { try { rendre(); } catch (e) {
            noter('RENDU TOMBE apres ecriture du nom : ' + (e && e.message)); } }
        }
      });
      noter('ecriture du nom interceptee');
    })();

    rendre();
    noter('greffe posée sur « ' + (exo.nom || 'nouvel exercice') + ' »');
    return true;
  }

  /* ============ 4. L'ENVELOPPE ============ */
  var vrai = A.panneau.editerExercice;
  A.panneau.editerExercice = function (exo, options, onFini) {
    var r = vrai.call(this, exo, options, onFini);
    /* LE PANNEAU EST DANS LE DOM APRÈS CE TOUR DE BOUCLE. Un échec de
       greffe NE DOIT PAS casser le panneau : l'app reste utilisable, et le
       bandeau le dit au lieu de laisser croire que tout va bien. */
    setTimeout(function () {
      try {
        var p = document.querySelector('.panneau');
        if (!p) { noter('PANNEAU INTROUVABLE'); majBandeau(); return; }
        greffer(exo, p);
      } catch (e) {
        noter('GREFFE TOMBÉE : ' + (e && e.message));
      }
      majBandeau();
    }, 0);
    return r;
  };

  /* ============ 4 bis. PAS DE SERVICE WORKER SUR UNE SIMULATION ============

     `app.js` appelle `navigator.serviceWorker.register('sw.js')`. Depuis
     revue/, avec la `<base href="../">`, le script resout a la racine mais
     le scope reste revue/ — le navigateur refuse, et il a RAISON : une
     simulation ne doit pas s'installer hors ligne ni partager le cache de
     l'app. L'echec etait donc le bon comportement.

     MAIS IL SE REPETAIT A CHAQUE CHARGEMENT — neuf lignes rouges dans la
     console, qui masquent les vraies erreurs quand on en cherche une. On
     neutralise franchement, et on le NOTE, plutot que de laisser un echec
     attendu se confondre avec un defaut.

     CE PATCH NE TOUCHE QUE CETTE PAGE : l'app reelle, servie par
     index.html, enregistre son service worker comme avant. */
  if (navigator.serviceWorker && navigator.serviceWorker.register) {
    navigator.serviceWorker.register = function () {
      noter('service worker refuse — simulation, pas d’installation');
      return Promise.reject(new Error('simulation'));
    };
  }

  /* ============ 5. LE BANDEAU, qui dit ce qui tourne ============ */
  var bandeau = null;
  function majBandeau() {
    if (!bandeau) return;
    /* « service worker refuse » n'est PAS un defaut : c'est le comportement
       voulu. Le bandeau ne vire au rouge que sur un vrai echec de greffe. */
    var mauvais = journal.filter(function (x) {
      return /INTROUVABLE|TOMBÉE|TOMBE/.test(x); });
    bandeau.style.background = mauvais.length ? '#5e2f2f' : '#2f5e44';
    bandeau.textContent = (mauvais.length ? '⚠ ' : '● ')
      + 'Simulation — ' + poses.length + ' gestes ajoutés en mémoire'
      + (refuses.length ? ', ' + refuses.length + ' refusés' : '')
      + (mauvais.length ? ' · ' + mauvais[mauvais.length - 1] : '')
      + ' · rien n’est écrit sur le disque';
  }
  function poserBandeau() {
    bandeau = h('div', { style: 'position:fixed;left:0;right:0;bottom:0;z-index:9999;'
      + 'color:#d6ffe6;font:600 11px/1.5 system-ui;padding:5px 10px;'
      + 'text-align:center;pointer-events:none' });
    document.body.appendChild(bandeau);
    majBandeau();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', poserBandeau);
  } else { poserBandeau(); }

  A.patchQuatreEtages = { poses: poses, refuses: refuses, journal: journal,
                          codeDe: codeDe, estNeuf: estNeuf };
})(window.App);
