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

  /* ---- CE QUI A ETE TOUCHE LE 29 OCTOBRE ----

     Calcule en comparant les champs `aussi` et `muscles` de chaque fiche
     entre le commit 5b68a18 et HEAD, commentaires ignores. Une premiere
     version comparait le texte brut et donnait un faux positif : « Tirage
     vertical », a qui l'analyseur attribuait le commentaire ecrit apres lui.

     AUCUNE FICHE DEJA LIVREE N'A VU SES MUSCLES CHANGER. Onze ont gagne des
     ecritures, zero a change de muscles. */
  var TOUCHEES = {
    date: '29 octobre',
    neuves: ['Haussement d’épaules', 'Élévation frontale', 'Oiseau',
             'Face pull', 'Tirage menton', 'Rotation externe d’épaule',
             'Rotation interne d’épaule', 'Rotation cubaine',
             'Développé Arnold', 'Élévation en Y', 'Handstand push-up',
             'Croix de fer'],
    ecritures: ['Wrist curl', 'Wrist curl inversé', 'Déviation ulnaire',
                'Supination', 'Finger curl', 'Cup hold',
                'Développé militaire', 'Curl concentré', 'Preacher curl',
                'Curl Zottman', 'Élévation latérale']
  };
  var TOUS_TOUCHES = TOUCHEES.neuves.concat(TOUCHEES.ecritures);
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
      /* La base du RANG, qui n'est pas celle du muscle : dire « ce muscle
         fait cette action » et « c'est lui qui mène » sont deux
         affirmations, et la seconde est rarement mesuree. */
      if (e.rang === 'moteur' || e.rang === 'aide') {
        nom.appendChild(el('span',
          'base ' + (e.rangDit ? 'citee' : 'raisonnee'),
          e.rangDit ? 'rang cité' : 'rang raisonné'));
      }
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

    if (e && e.rangDit) {
      corps.appendChild(el('div', 'cite', '↳ le rang : « ' + e.rangDit.cite + ' »'));
      var q2 = el('div', 'qui');
      var a2 = el('a', null, e.rangDit.source.qui);
      a2.href = e.rangDit.source.lien;
      a2.target = '_blank'; a2.rel = 'noreferrer';
      q2.appendChild(a2);
      corps.appendChild(q2);
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

  /* Le mot « Assists » du grand dorsal porte sur la RESPIRATION, pas sur
     l'action du bras : le compter rendrait quatre faux ecarts. Mesure, pas
     devine. */
  var MOTS_APPOINT = /(aids|also|participates|contributes|accessory)/i;

  /* Le muscle attendu dans le titre de sa page Kenhub. Seuls ceux dont le
     nom latin est reconnaissable y figurent : on ne verifie que ce qu'on
     peut verifier, et on ne devine pas le reste. */
  var PAGE_ATTENDUE = {
    biceps: 'biceps', brachial: 'brachialis', brachio_radial: 'brachioradialis',
    triceps: 'triceps', deltoide: 'deltoid', grand_pectoral: 'pectoralis',
    grand_dorsal: 'latissimus', grand_rond: 'teres', ancone: 'anconeus',
    trapeze: 'trapezius',
    supinateur: 'supinator', rond_pronateur: 'pronator teres',
    carre_pronateur: 'pronator quadratus', long_palmaire: 'palmaris longus',
    court_palmaire: 'palmaris brevis'
  };

  function citationsEmpruntees() {
    var l = [];
    cat.MOUVEMENTS.forEach(function (f) {
      (f.muscles || []).forEach(function (e) {
        if (!e.source || !e.cite) return;
        var attendu = PAGE_ATTENDUE[e.id];
        if (!attendu) return;
        var page = String(e.source.qui).toLowerCase();
        if (page.indexOf('kenhub') < 0) return;
        if (page.indexOf(attendu) < 0) l.push(f.nom + ' / ' + e.id);
      });
    });
    return l;
  }

  function ecartsDeRang() {
    var l = [];
    cat.MOUVEMENTS.forEach(function (f) {
      (f.muscles || []).forEach(function (e) {
        if (e.rang !== 'moteur' && e.rang !== 'aide') return;
        if (!e.cite) return;
        var attendu = MOTS_APPOINT.test(e.cite) ? 'aide' : 'moteur';
        if (attendu !== e.rang) l.push(f.nom + ' / ' + e.id);
      });
    });
    return l;
  }

  /* UN NOM NE DOIT PAS DÉJÀ DIRE AUTRE CHOSE.

     Un nom qui porte les mots de DEUX gestes propose les muscles de
     l'autre. « Curl pronation », rangé sous le curl inversé, rendait les
     deux pronateurs et jamais les fléchisseurs du coude. Trois fois ce
     chantier : « Rising à la sangle » (lot 3), « Traction pronation » et
     « Traction supination » (lot 4), « Curl pronation » et « Curl prise
     pronation » (lot 5) — et les trois fois c'est MB qui l'a vu, pas la
     planche. Celle-ci regardait les CITATIONS et les RANGS ; personne ne
     regardait les NOMS.

     La règle, mesurable : ce qu'un nom propose aujourd'hui doit être CONTENU
     dans ce que son entrée revendique. Un sous-ensemble est normal — le
     mot-clé n'est pas encore posé, le nom ne rend encore qu'une partie. Un
     muscle EN TROP veut dire que le nom parle d'un autre geste. */
  /* UNE FICHE QUI NE REVENDIQUE RIEN NE PEUT RIEN CONTREDIRE.

     Cette garde compare ce qu'un nom RETOURNE a ce que son entree
     REVENDIQUE. Sur un lot de noms seuls (`muscles: []`), tout nom qui
     repond quoi que ce soit y tombe : la garde a liste 35 « noms qui disent
     deja autre chose » le 29/10, pour une raison qui n'a rien a voir avec
     un defaut. Elle ne mesurait plus rien, elle faisait du bruit.

     Ce que ces noms repondent aujourd'hui reste LISIBLE, sur chaque carte,
     dans la pastille « aujourd'hui : ... » — c'est la qu'il faut le lire. */
  /* LES DOUBLONS DU CATALOGUE, calcules comme le banc les calcule.

     Une ecriture reclamee par deux mouvements est un DOUBLON, sauf si la
     fiche qui la prend DECLARE le transfert par `reprend`. Declaree, c'est
     un transfert ; muette, `ficheDictionnaire` prendrait la premiere de la
     table et le choix serait invisible.

     ZERO N'EST PAS ACQUIS : au 29/10, avant correction, ce compteur valait
     UN pour les entrees et QUATRE pour les ecritures. */
  function doublonsDuCatalogue() {
    var cle = A.m.slug, dits = {}, parNom = {}, par = {}, sortie = [];
    cat.MOUVEMENTS.forEach(function (f) {
      (parNom[cle(f.nom)] = parNom[cle(f.nom)] || []).push(f.nom);
      if (f.reprend) {
        (f.reprend.ecritures || []).forEach(function (e) {
          dits[cle(e)] = { vers: f.nom, de: f.reprend.de };
        });
      }
      [f.nom].concat(f.aussi || []).forEach(function (ec) {
        var k = cle(ec), l = (par[k] = par[k] || []);
        if (l.indexOf(f.nom) < 0) l.push(f.nom);
      });
    });
    Object.keys(parNom).forEach(function (k) {
      if (parNom[k].length > 1) sortie.push('« ' + parNom[k][0] + ' » DEUX FOIS');
    });
    Object.keys(par).forEach(function (k) {
      var noms = par[k];
      if (noms.length < 2) return;
      var t = dits[k];
      if (t && noms.length === 2
          && noms.indexOf(t.vers) >= 0 && noms.indexOf(t.de) >= 0) return;
      sortie.push(k + ' → ' + noms.join(' / '));
    });
    return sortie;
  }

  function nomsQuiDisentAutreChose() {
    var l = [];
    cat.MOUVEMENTS.forEach(function (f) {
      if (!(f.muscles || []).length) return;
      var revendique = (f.muscles || []).map(function (e) { return e.id; });
      [f.nom].concat(f.aussi || []).forEach(function (n) {
        var trop = A.m.musclesDuNom(n).filter(function (id) {
          return revendique.indexOf(id) < 0;
        });
        if (trop.length) {
          l.push(f.nom + ' / « ' + n + ' » → ' + trop.join(', '));
        }
      });
    });
    return l;
  }

  /* L'ORDRE DU CATALOGUE EST EDITORIAL, celui du modele ne l'est PAS.

     `musclesDuNom` rend ses muscles dans l'ordre de MUSCLES, et le controle
     d'accord du banc compare les deux listes JOINTES — donc dans l'ordre.
     Une fiche dont la liste se lit mieux autrement (la rotation avant les
     flechisseurs, par exemple) est parfaitement valable ICI, et doit etre
     TRIEE au moment d'ecrire son entree dans le modele.

     Mesure du 26/10 : 8 fiches sur 42 sont hors ordre de lecture, dont SIX
     deja livrees — leurs entrees du modele sont bien triees, seul
     l'affichage differe. Ce compteur ne regarde donc que celles qui restent
     a ajouter : ce sont les seules ou l'oubli couterait un banc rouge. */
  function aTrierAvantLeModele() {
    var ordre = A.m.MUSCLES.map(function (m) { return m.id; });
    return cat.MOUVEMENTS.filter(function (f) {
      if (A.m.DICTIONNAIRE.some(function (d) { return d.nom === f.nom; })) {
        return false;
      }
      var l = (f.muscles || []).map(function (e) { return e.id; });
      var trie = l.slice().sort(function (a, b) {
        return ordre.indexOf(a) - ordre.indexOf(b);
      });
      return l.join(',') !== trie.join(',');
    }).map(function (f) { return f.nom; });
  }

  var barre = null, compteurs = null;

  /* LE COMPTEUR COMPTE CE QUI RESTE A FAIRE, pas ce qui est en memoire.

     Il annoncait « 2 renommage(s) en attente » alors qu'un seul restait :
     l'autre etait deja au dictionnaire. C'est le nombre que MB lit, et le
     29/10 c'est lui qui lui a fait coller vingt renommages dont dix-huit
     etaient faits. Un compteur qui compte autre chose que ce qu'il annonce
     fait agir de travers. */
  function majBarre() {
    var tous = Object.keys(memoire);
    var restants = tous.filter(function (k) { return !dejaApplique(k, memoire[k]); });
    var n = restants.length;
    var faits = tous.length - n;
    compteurs.textContent = n
      ? n + ' renommage(s) en attente'
        + (faits ? ' (' + faits + ' deja au dictionnaire, non recopie(s))' : '')
      : (faits
          ? 'Aucun renommage en attente — les ' + faits + ' en mémoire sont '
            + 'déjà au dictionnaire.'
          : 'Aucun renommage. Modifie un nom ou ses autres écritures pour en poser un.')
        + (memoireOk ? '' : ' — le navigateur refuse de les retenir entre deux chargements.');
    barre.hidden = false;
  }

  /* CE QUI RESTE A FAIRE, PAS CE QU'ON A DEJA FAIT.

     La memoire des renommages vit dans `localStorage` et s'accumule d'une
     relecture a l'autre — c'est ce qui evite de perdre une revue en cours.
     Mais elle ne savait pas qu'un renommage avait ete APPLIQUE.

     Le 29/10, MB a colle vingt renommages en pensant donner une consigne :
     DIX-HUIT etaient appliques depuis longtemps, deux decrivaient un etat
     intermediaire depasse, et trois ecritures avaient ete retirees expres
     depuis (les « a la sangle », qu'un controle du banc interdit). Les
     reappliquer aurait defait un travail fait expres.

     On compare donc avec le dictionnaire VIVANT, et on ne recopie que
     l'ecart. */
  function dejaApplique(cle, v) {
    var cible = (v.nom && v.nom !== cle) ? v.nom : cle;
    var f = A.m.DICTIONNAIRE.filter(function (d) { return d.nom === cible; })[0];
    if (!f) return false;
    if (v.aussi == null) return true;
    var veut = String(v.aussi).split(',').map(function (x) { return x.trim(); })
                 .filter(function (x) { return x; });
    var a = f.aussi || [];
    return veut.every(function (x) { return a.indexOf(x) >= 0; });
  }

  function texteDesRenommages() {
    var restants = Object.keys(memoire).filter(function (k) {
      return !dejaApplique(k, memoire[k]);
    });
    if (!restants.length) {
      return '(rien à reporter : tout ce qui est en mémoire est déjà au '
           + 'dictionnaire)';
    }
    return restants.map(function (k) {
      var v = memoire[k];
      var bouts = [];
      if (v.nom && v.nom !== k) bouts.push('nom : ' + v.nom);
      if (v.aussi != null) bouts.push('autres écritures : ' + v.aussi);
      return '- « ' + k +' » → ' + bouts.join(' · ');
    }).join('\n');
  }

  /* `multi` : le champ s'ajuste a son contenu au lieu de le couper.

     Mesure du 26/10, sur la page reelle : 2 champs d'ecritures sur 15
     depassaient leur largeur — « Curl biceps » (15 ecritures) et
     « Isometrie de coude » (7 depuis le Curl Larratt). Soit exactement les
     deux que MB avait a relire. Un <input> ne sait pas revenir a la ligne,
     et rien ne signalait la coupe : la fiche paraissait complete.

     Pas de controle ecrit pour ca : un textarea qui s'ajuste a son contenu
     ne PEUT pas tronquer, donc le controle ne pourrait pas tomber. C'est la
     mesure avant/apres qui fait foi — 2 puis 0. */
  function champ(valeur, etiquette, surChange, multi) {
    var l = el('label', 'ligne-champ');
    l.appendChild(el('span', 'etiq', etiquette));
    var i = document.createElement(multi ? 'textarea' : 'input');
    if (!multi) i.type = 'text';
    i.className = 'champ champ-revue';
    i.value = valeur;

    /* `scrollHeight` ne compte PAS les bordures, alors que `height` les
       inclut en box-sizing: border-box. Poser l'un dans l'autre laisse
       deux pixels de defilement — mesure du 26/10 : les 8 champs pouvaient
       defiler, « Reverse curl » compris, qui fait deux mots. Rien n'etait
       cache, mais la barre apparaissait et plus aucune mesure ne pouvait
       distinguer « ca deborde » de « ca ne deborde pas ». */
    function ajuster() {
      i.style.height = 'auto';
      var cs = getComputedStyle(i);
      var bord = cs.boxSizing === 'border-box'
        ? (parseFloat(cs.borderTopWidth) || 0)
          + (parseFloat(cs.borderBottomWidth) || 0)
        : 0;
      i.style.height = (i.scrollHeight + bord) + 'px';
    }
    i.addEventListener('input', function () {
      surChange(i.value);
      if (multi) ajuster();
    });
    /* La hauteur ne se mesure qu'une fois l'element DANS la page : `rendre`
       n'accroche son arbre qu'a la fin. */
    if (multi) {
      i.rows = 1;
      i.style.minHeight = '0';
      i.style.resize = 'none';
      setTimeout(ajuster, 0);
    }
    l.appendChild(i);
    return l;
  }

  function rendre() {
    var sortie = document.getElementById('sortie');
    var sansSource = 0, cites = 0, deduits = 0, muscles = 0, aAjouter = 0;
    var rangsCites = 0, rangsRaisonnes = 0;

    /* Le modele D'ABORD (ce qui est livre), puis ce que le catalogue
       propose et qui n'y est pas encore : sans ca, un LOT NEUF serait
       invisible sur la planche qui sert justement a le valider. */
    var lignes = A.m.DICTIONNAIRE.map(function (d) {
      var f = cat.MOUVEMENTS.filter(function (x) { return x.nom === d.nom; })[0];
      return { nom: d.nom, aussi: d.aussi || [], muscles: d.muscles,
               livre: true, ecartees: (f && f.aussiEcartees) || null };
    });
    cat.MOUVEMENTS.forEach(function (f) {
      var livree = A.m.DICTIONNAIRE.filter(function (d) {
        return d.nom === f.nom;
      })[0];
      /* UNE FICHE DEJA LIVREE QUI GAGNE DES ECRITURES DOIT SE VOIR.

         On passait toute entree dont le nom est livre, et les ecritures
         qu'un lot AJOUTE a une fiche existante devenaient invisibles. Arrive
         trois fois — le developpe militaire et l'elevation laterale au lot
         6, les dips au lot 7 — et chaque fois il a fallu le DIRE a MB au
         lieu de le lui MONTRER. */
      if (livree) {
        var a = livree.aussi || [];
        var enPlus = (f.aussi || []).filter(function (x) { return a.indexOf(x) < 0; });
        if (!enPlus.length) return;
        lignes.push({ nom: f.nom, aussi: f.aussi || [],
                      muscles: livree.muscles,
                      livre: false, enPlus: enPlus,
                      ecartees: f.aussiEcartees || null,
                      reprend: f.reprend || null,
                      ecarte: f.ecarte || null });
        return;
      }
      lignes.push({ nom: f.nom, aussi: f.aussi || [],
                    muscles: f.muscles.map(function (x) { return x.id; }),
                    livre: false,
                    ecartees: f.aussiEcartees || null,
                    reprend: f.reprend || null,
                    ecarte: f.ecarte || null });
    });

    var montrerLivres = false, montrerTouchees = false;
    try {
      montrerLivres = localStorage.getItem(CLE + '-livres') === 'oui';
      montrerTouchees = localStorage.getItem(CLE + '-touchees') === 'oui';
    } catch (e) { montrerLivres = false; montrerTouchees = false; }

    /* TROIS MODES, ET LE TROISIEME EST NEUF : une fois livree, une fiche
       quitte la planche. Pour relire ce qu'on vient de faire il fallait
       rouvrir les 58 et chercher. Celui-ci n'ouvre QUE les touchees. */
    var masques = (montrerLivres || montrerTouchees) ? 0
      : lignes.filter(function (d) { return d.livre; }).length;
    var aLire = montrerTouchees
      ? lignes.filter(function (d) { return TOUS_TOUCHES.indexOf(d.nom) >= 0; })
      : (montrerLivres ? lignes
          : lignes.filter(function (d) { return !d.livre; }))
        .filter(function (d) { return !d.ecarte; });
    var ecartes = lignes.filter(function (d) { return d.ecarte; }).length;

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
        }, true));
      if (f && f.geste) h.appendChild(el('div', 'geste', f.geste));
      bloc.appendChild(h);

      var delta = el('div', 'delta');
      delta.appendChild(el('span',
        'et ' + (d.livre ? 'pareil' : 'change'),
        d.livre ? 'livré'
                : (d.ecarte ? 'écarté → ' + d.ecarte
                   : (d.enPlus ? '+' + d.enPlus.length + ' écriture(s) sur une '
                                 + 'fiche déjà livrée'
                      : 'à ajouter'))));
      /* UNE FICHE SANS MUSCLE LE DIT. Le lot 6 ne propose que des noms,
         donc ses entrees portent `muscles: []` : une pastille vide se
         lirait comme un defaut d'affichage, pas comme une intention. */
      delta.appendChild(el('span', 'et',
        d.muscles.length ? d.muscles.map(A.m.nomCourtMuscle).join(', ')
                         : 'muscles : a sourcer'));
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
      /* UN TRANSFERT SE LIT. Une fiche neuve qui prend un nom a une fiche
         livrée l'écrit : sans ça, MB validait une fiche sans voir ce qu'elle
         RETIRE à une autre — et deux fiches auraient réclamé le même nom. */
      if (d.reprend) {
        delta.appendChild(el('span', 'et change',
          'reprend ' + (d.reprend.ecritures || []).length + ' écriture(s) à '
          + '« ' + d.reprend.de + ' » : '
          + (d.reprend.ecritures || []).join(', ')));
      }
      bloc.appendChild(delta);

      /* CE QUI A ÉTÉ PROPOSÉ ET REFUSÉ, AVEC SA RAISON. La planche ne
         distinguait pas « en attente » de « refusé pour une raison » : les
         cinq pompes et le wrist curl en pronation ressortaient comme du
         travail à faire, et MB a recollé vingt renommages déjà appliqués
         pour la même raison. */
      if (d.ecartees && d.ecartees.length) {
        var ec = el('div', 'delta');
        ec.appendChild(el('span', 'et',
          d.ecartees.length + ' écriture(s) ÉCARTÉE(S), pas en attente'));
        d.ecartees.forEach(function (e) {
          ec.appendChild(el('span', 'et pareil', '« ' + e[0] + ' » — ' + e[1]));
        });
        bloc.appendChild(ec);
      }

      /* On parcourt LES MUSCLES LIVRÉS, pas ceux de la fiche de revue : si
         un muscle entre au dictionnaire sans citation, il se voit. */
      d.muscles.forEach(function (id) {
        var e = citationDe(f, id);
        muscles++;
        if (!e || !e.source) sansSource++;
        else if (e.cite) cites++;
        else if (e.deDeux) deduits++;
        if (e && (e.rang === 'moteur' || e.rang === 'aide')) {
          if (e.rangDit) rangsCites++; else rangsRaisonnes++;
        }
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
    tete.appendChild(el('div', 'item-resume',
      (masques ? masques + ' déjà validés, masqués · ' : '')
      + (ecartes ? ecartes + ' écarté(s) ('
          + lignes.filter(function (d) { return d.ecarte; })
                  .map(function (d) { return d.ecarte; })
                  .filter(function (x, k, l) { return l.indexOf(x) === k; })
                  .join(', ')
          + '), gardé(s) dans le catalogue · ' : '')
      + muscles + ' muscles · ' + cites + ' cités mot pour mot, '
      + deduits + ' déduits et dits comme tels, ' + sansSource + ' sans source'
      + ' · rangs : ' + rangsCites + ' cités, ' + rangsRaisonnes
      + ' RAISONNÉS.'));

    /* Les rangs qui s'écartent de la FORME de leur citation : ce ne sont pas
       des fautes, ce sont les endroits où mon jugement passe devant le
       texte. Ils doivent se compter, pas se deviner. */
    /* Une citation doit venir de la page DU muscle qu'elle appuie. Zero
       n'est pas un resultat acquis : ce controle a trouve six emprunts le
       jour ou il a ete ecrit. */
    var empruntees = citationsEmpruntees();
    tete.appendChild(el('div',
      'item-resume' + (empruntees.length ? ' rouge' : ''),
      empruntees.length
        ? empruntees.length + ' CITATION(S) EMPRUNTÉE(S) à la page d’un autre '
          + 'muscle : ' + empruntees.join(' · ')
        : 'aucune citation empruntée à la page d’un autre muscle.'));

    /* LE COMPTEUR DE DOUBLONS. Zéro n'est pas acquis : au 29/10, avant
       correction, il valait UN pour les entrées (« Dips prise serrée » deux
       fois) et QUATRE pour les écritures (toutes à « Extension triceps »).
       Le banc porte la même mesure, bloc « Le catalogue de revue sans
       doublon » — celle-ci est là pour que MB la VOIE. */
    var doubles = doublonsDuCatalogue();
    tete.appendChild(el('div',
      'item-resume' + (doubles.length ? ' rouge' : ''),
      doubles.length
        ? doubles.length + ' DOUBLON(S) dans le catalogue — un nom réclamé '
          + 'par deux entrées sans que le transfert soit déclaré : '
          + doubles.join(' · ')
        : 'aucun doublon : chaque nom n’est réclamé que par une entrée, et '
          + 'les transferts sont déclarés.'));

    /* Zéro n'est pas acquis : remets « Curl pronation » dans les écritures
       du curl inversé et ce bloc passe au rouge. */
    var autres = nomsQuiDisentAutreChose();
    tete.appendChild(el('div',
      'item-resume' + (autres.length ? ' rouge' : ''),
      autres.length
        ? autres.length + ' NOM(S) QUI DISENT DÉJÀ AUTRE CHOSE que ce que '
          + 'leur entrée revendique : ' + autres.join(' · ')
        : 'aucun nom ne propose un muscle que son entrée ne revendique pas.'));

    /* Zéro n'est pas acquis : au 26/10 ce compteur valait 2. */
    var aTrier = aTrierAvantLeModele();
    tete.appendChild(el('div', 'item-resume',
      aTrier.length
        ? aTrier.length + ' fiche(s) à TRIER en écrivant leur entrée du '
          + 'modèle — l’ordre du catalogue est éditorial, celui du modèle '
          + 'ne l’est pas : ' + aTrier.join(' · ')
        : 'toutes les fiches à ajouter sont déjà dans l’ordre de lecture.'));

    var ecarts = ecartsDeRang();
    tete.appendChild(el('div', 'item-resume',
      ecarts.length + ' rang(s) s’écartent de la forme de leur citation — '
      + 'jugement assumé, pas faute : ' + ecarts.slice(0, 4).join(' · ')
      + (ecarts.length > 4 ? ' … (+' + (ecarts.length - 4) + ')' : '')));

    /* LE BOUTON DIT CE QU'IL MONTRE, et le compte vient de la liste —
       l'ecrire en dur mentirait des qu'elle bouge. */
    if (montrerTouchees) {
      tete.appendChild(el('p', 'item-resume',
        TOUCHEES.neuves.length + ' fiche(s) NEUVE(S) et '
        + TOUCHEES.ecritures.length + ' qui ont gagné des écritures, le '
        + TOUCHEES.date + '. AUCUNE fiche déjà livrée n’a vu ses MUSCLES '
        + 'changer : onze ont gagné des noms, zéro a changé de muscles.'));
      var btSortir = el('button', 'bouton', 'Revenir à la revue');
      btSortir.addEventListener('click', function () {
        try { localStorage.removeItem(CLE + '-touchees'); } catch (e) {}
        location.reload();
      });
      tete.appendChild(btSortir);
    } else {
      var btTouchees = el('button', 'bouton',
        'Voir les ' + TOUS_TOUCHES.length + ' fiches touchées le ' + TOUCHEES.date);
      btTouchees.addEventListener('click', function () {
        try {
          localStorage.setItem(CLE + '-touchees', 'oui');
          localStorage.removeItem(CLE + '-livres');
        } catch (e) {}
        location.reload();
      });
      tete.appendChild(btTouchees);
    }

    if (montrerTouchees) {
      /* on ne propose pas les deux autres modes en meme temps */
    } else if (masques) {
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
    /* LE CHAPEAU SUIT CE QUE LE LOT CONTIENT. Un lot de NOMS SEULEMENT
       (`muscles: []` partout) ne peut pas annoncer « muscle par muscle,
       avec d'ou ca vient » : la phrase promettrait ce que la planche ne
       montre pas, et c'est exactement le genre d'ecart qu'on traque
       ailleurs. */
    /* SUR CE QUI EST EN REVUE, PAS SUR TOUT LE CATALOGUE. Les lots deja
       livres gardent leurs muscles : les compter ici rendait la condition
       toujours vraie, et le chapeau annoncait des muscles sur un lot qui
       n'en propose aucun. Mesure du 29/10. */
    var aDesMuscles = cat.MOUVEMENTS.some(function (f) {
      if (f.ecarte) return false;
      if (A.m.DICTIONNAIRE.some(function (d) { return d.nom === f.nom; })) return false;
      return (f.muscles || []).length;
    });
    document.getElementById('chapeau').textContent =
      'Lot ' + cat.lot + ' — ' + cat.titre + '. '
      + (aDesMuscles
          ? 'Ce qui sera LIVRÉ, muscle par muscle, avec d’où ça vient. '
          : 'Ce lot ne porte QUE des noms : les muscles viendront après, '
          + 'depuis une source anatomique citée. ')
      + 'Les noms sont modifiables ; rien n’est écrit dans le carnet.';

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

    window.__planche = { empruntees: citationsEmpruntees().length,
                         aTrier: aTrierAvantLeModele().length,
                         nomsFautifs: nomsQuiDisentAutreChose().length,
                         ecartsDeRang: ecartsDeRang().length,
                         rangsCites: rangsCites,
                         rangsRaisonnes: rangsRaisonnes,
                         mouvements: aLire.length, masques: masques,
                         aAjouter: aAjouter,
                         muscles: muscles,
                         cites: cites, deduits: deduits, sansSource: sansSource,
                         renommages: Object.keys(memoire).length };
  }

  A.store.charger();
  rendre();
})();
