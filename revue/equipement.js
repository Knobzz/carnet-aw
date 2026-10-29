/* Rend la planche d'ÉQUIPEMENT À PARTIR DE CE QUI EST LIVRÉ.

   Même principe que la planche des mouvements, et pour la même raison : elle
   parcourt `A.m.OUTILS_CONNUS`, c'est-à-dire la table qui part sur le
   téléphone, et va chercher dans `CATALOGUE_OUTILS` la source et la
   provenance du nom. Un type livré sans fiche de revue s'affiche EN ROUGE.
   La planche ne peut donc pas montrer autre chose que la vérité.

   Les muscles ajoutés sont CALCULÉS par le modèle lui-même
   (`musclesDeLOutil`), jamais recopiés : deux listes finiraient par
   diverger, et c'est l'écart que personne ne remarque.

   CHAQUE MUSCLE PORTE SA GRAVURE — demande de MB, 2026-10-26 : « je n'ai
   pas les images, il me faut du visuel ». On montre la planche de Gray, le
   nom latin et ce que le MODÈLE dit que le muscle fait. Pas de citation
   empruntée à un mouvement : ce serait exactement la faute que la planche
   des mouvements traque.

   ELLE LAISSE RENOMMER, comme l'autre. Les renommages ne touchent à rien :
   ils vivent dans une clé à part du navigateur, et un bouton les met au
   presse-papier. Cette planche n'écrit JAMAIS dans le carnet. */
(function () {
  'use strict';

  var A = window.App, cat = window.CATALOGUE_OUTILS;
  var CLE = 'carnet-aw-revue-outils';

  var el = function (t, c, x) {
    var e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };

  var memoire = {};
  var memoireOk = true;
  try { memoire = JSON.parse(localStorage.getItem(CLE) || '{}') || {}; }
  catch (e) { memoireOk = false; }

  function retenir() {
    try { localStorage.setItem(CLE, JSON.stringify(memoire)); }
    catch (e) { memoireOk = false; majBarre(); }
  }

  function fiche(cle) {
    var l = cat.OUTILS.filter(function (o) { return o.cle === cle; });
    return l.length ? l[0] : null;
  }

  /* ---------- LES TROIS CONTRÔLES PERMANENTS ---------- */

  /* 1. Un type livré sans fiche de revue est un type que personne ne peut
        relire. Zéro n'est pas acquis : ajoutez une ligne à OUTILS_CONNUS
        sans la documenter et ce compteur passe au rouge. */
  function sansFiche() {
    return (A.m.OUTILS_CONNUS || []).filter(function (k) {
      return !fiche(k.mots[0]);
    }).map(function (k) { return k.mots[0]; });
  }

  /* 2. La table cite des entrées du dictionnaire par leur NOM. Douze
        renommages ont eu lieu le 26/10 : un treizième la casserait EN
        SILENCE, puisqu'une entrée introuvable n'ajoute simplement rien. */
  function entreesFantomes() {
    var l = [];
    (A.m.OUTILS_CONNUS || []).forEach(function (k) {
      (k.entrees || []).forEach(function (nom) {
        var existe = A.m.DICTIONNAIRE.some(function (d) { return d.nom === nom; });
        if (!existe) l.push(k.mots[0] + ' → « ' + nom + ' »');
      });
    });
    return l;
  }

  /* 3. Deux types qui revendiquent le même mot rendraient la lecture
        ambiguë — et c'est le genre d'ambiguïté qui ne se voit qu'au moment
        où elle se trompe. */
  function motsEnDouble() {
    var vus = {}, doubles = [];
    (A.m.OUTILS_CONNUS || []).forEach(function (k) {
      k.mots.forEach(function (mot) {
        if (vus[mot]) doubles.push('« ' + mot + ' » : ' + vus[mot] + ' et ' + k.mots[0]);
        else vus[mot] = k.mots[0];
      });
    });
    return doubles;
  }

  /* Le NOM OFFICIEL d'un produit, tire du libelle du lien : « Titangrip —
     Iron Wrist » donne « Iron Wrist ». Les liens de categorie n'en sont
     pas, et ne se comptent pas. */
  function nomProduit(texte) {
    var t = String(texte || '').split('—');
    return t[t.length - 1].trim();
  }

  function estProduit(texte) {
    return String(texte || '').indexOf('catégorie') < 0;
  }

  /* 4. MB, 27/10 : « il faut que les utilisateurs puissent retrouver
        l'équipement qu'ils ont ». Un produit nommé dans une fiche doit être
        reconnu PAR SON NOM OFFICIEL — « Titan Grip Iron Wrist » tapé dans
        le carnet doit proposer quelque chose. La mesure du jour : 53 des 56
        l'étaient déjà, par le mot générique de leur type. Ce contrôle garde
        l'acquis au lieu de recopier 53 mots qui feraient doublon et
        finiraient par diverger — et il passe au rouge dès qu'une fiche cite
        un produit que le modèle ne sait pas lire. */
  function produitsNonReconnus() {
    var l = [];
    cat.OUTILS.forEach(function (f) {
      (f.liens || []).forEach(function (x) {
        if (!estProduit(x.texte)) return;
        var nom = nomProduit(x.texte);
        /* RECONNU, et non « propose des muscles » : la ceinture de judo du
           27/10 est reconnue et ne propose rien, parce qu'une sangle change
           ce qu'on tient. Écrit sur les muscles, ce contrôle l'aurait
           déclarée introuvable — et on aurait « corrigé » le modèle pour
           faire taire un rouge qui avait tort. */
        if (!nom || A.m.typesDeLOutil(nom).length) return;
        l.push(f.cle + ' → « ' + nom + ' »');
      });
    });
    return l;
  }

  /* 5. La table de montage vit à côté d'`OUTILS_CONNUS` : une entrée qui
        manque laisserait l'app muette sur « se monte sur », et une entrée
        de trop survivrait au type qu'elle décrivait. Les deux se taisent
        sans ce contrôle. */
  function montagesDepareilles() {
    var l = [], vus = {};
    (A.m.OUTILS_CONNUS || []).forEach(function (k) {
      vus[k.mots[0]] = 1;
      if (!A.m.MONTAGE[k.mots[0]]) l.push('type sans montage : ' + k.mots[0]);
    });
    Object.keys(A.m.MONTAGE).forEach(function (c) {
      if (!vus[c]) l.push('montage sans type : ' + c);
    });
    return l;
  }

  /* ---------- le visuel : un muscle, sa gravure ---------- */
  function rendreMuscle(id) {
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
    corps.appendChild(el('div', 'nom', m ? m.nom : '(' + id + ' — inconnu)'));
    if (m) {
      corps.appendChild(el('div', 'qui', m.latin || ''));
      /* Ce que le MODÈLE dit du muscle — pas une citation reprise d'un
         mouvement, qui serait un emprunt. */
      if (m.quoi) corps.appendChild(el('div', 'cite', m.quoi));
    }
    d.appendChild(corps);
    return d;
  }

  /* ---------- le renommage, comme sur l'autre planche ---------- */
  function champ(valeur, etiquette, surChange, multi) {
    var l = el('label', 'ligne-champ');
    l.appendChild(el('span', 'etiq', etiquette));
    var i = document.createElement(multi ? 'textarea' : 'input');
    if (!multi) i.type = 'text';
    i.className = 'champ champ-revue';
    i.value = valeur;

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
    if (multi) {
      i.rows = 1;
      i.style.minHeight = '0';
      i.style.resize = 'none';
      setTimeout(ajuster, 0);
    }
    l.appendChild(i);
    return l;
  }

  function texteDesRenommages() {
    return Object.keys(memoire).map(function (k) {
      var v = memoire[k];
      var bouts = [];
      if (v.nom && v.nom !== k) bouts.push('nom : ' + v.nom);
      if (v.mots != null) bouts.push('mots reconnus : ' + v.mots);
      return '- « ' + k + ' » → ' + bouts.join(' · ');
    }).join('\n');
  }

  var barre = null;

  function majBarre() {
    if (!barre) return;
    barre.textContent = '';
    var n = Object.keys(memoire).length;
    var r = el('div', 'item-resume',
      n ? n + ' renommage(s) en attente — ils ne touchent à rien tant que '
        + 'tu ne me les rends pas.'
        : 'Aucun renommage. Modifie un nom ou ses mots reconnus pour en '
        + 'poser un.');
    barre.appendChild(r);
    if (!memoireOk) {
      barre.appendChild(el('div', 'item-resume rouge',
        'Le navigateur refuse de retenir : copie-les avant de fermer.'));
    }
    if (!n) return;
    var bt = el('button', null, 'Copier les renommages');
    bt.type = 'button';
    bt.addEventListener('click', function () {
      var t = texteDesRenommages();
      var secours = document.getElementById('secours');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () {
          bt.textContent = 'Copié';
          setTimeout(function () { bt.textContent = 'Copier les renommages'; }, 1400);
        }, function () { secours.hidden = false; secours.textContent = t; });
      } else {
        secours.hidden = false;
        secours.textContent = t;
      }
    });
    barre.appendChild(bt);
  }

  function rendre() {
    var sortie = document.getElementById('sortie');
    var tete = document.getElementById('tete');
    sortie.textContent = '';
    tete.textContent = '';

    var types = A.m.OUTILS_CONNUS || [];
    var mots = types.reduce(function (n, k) { return n + k.mots.length; }, 0);
    var mesures = 0, parLeGeste = 0, muscles = 0;
    types.forEach(function (k) {
      var f = fiche(k.mots[0]);
      if (f && f.cite) mesures++; else if (f) parLeGeste++;
      muscles += A.m.musclesDeLOutil([k.mots[0]]).length;
    });

    tete.appendChild(el('div', 'chiffre', types.length + ' types d’équipement'));
    tete.appendChild(el('div', 'item-resume',
      mots + ' mots reconnus · ' + muscles + ' muscle(s) ajouté(s) en tout · '
      + mesures + ' type(s) mesuré(s) par une étude, ' + parLeGeste
      + ' par le GESTE que l’outil entraîne · ' + cat.ECARTES.length
      + ' écarté(s), et la raison est écrite.'));

    var sf = sansFiche();
    tete.appendChild(el('div', 'item-resume' + (sf.length ? ' rouge' : ''),
      sf.length
        ? sf.length + ' TYPE(S) LIVRÉ(S) SANS FICHE DE REVUE : ' + sf.join(' · ')
        : 'chaque type livré a sa fiche de revue.'));

    var ef = entreesFantomes();
    tete.appendChild(el('div', 'item-resume' + (ef.length ? ' rouge' : ''),
      ef.length
        ? ef.length + ' ENTRÉE(S) CITÉE(S) QUI N’EXISTENT PLUS — un '
          + 'renommage a cassé la table : ' + ef.join(' · ')
        : 'chaque entrée du dictionnaire citée par la table existe vraiment.'));

    var md = motsEnDouble();
    tete.appendChild(el('div', 'item-resume' + (md.length ? ' rouge' : ''),
      md.length
        ? md.length + ' MOT(S) REVENDIQUÉ(S) PAR DEUX TYPES : ' + md.join(' · ')
        : 'aucun mot n’est revendiqué par deux types à la fois.'));

    var mp = montagesDepareilles();
    tete.appendChild(el('div', 'item-resume' + (mp.length ? ' rouge' : ''),
      mp.length
        ? mp.length + ' DÉPAREILLAGE(S) ENTRE LES TYPES ET LEUR MONTAGE : '
          + mp.join(' · ')
        : 'chaque type dit où il se monte, et aucun montage ne survit à son '
          + 'type.'));

    var pn = produitsNonReconnus();
    tete.appendChild(el('div', 'item-resume' + (pn.length ? ' rouge' : ''),
      pn.length
        ? pn.length + ' PRODUIT(S) QUE LE CARNET NE SAIT PAS LIRE PAR LEUR '
          + 'NOM OFFICIEL : ' + pn.join(' · ')
        : 'chaque produit nommé ici est reconnu par son NOM OFFICIEL — '
          + '« Titan Grip Iron Wrist » tapé dans le carnet propose ses '
          + 'muscles, sans qu’on ait eu à recopier le nom dans les mots.'));

    barre = el('div', 'barre-revue');
    tete.appendChild(barre);
    majBarre();

    /* ---------- une carte par type ---------- */
    types.forEach(function (k) {
      var cle = k.mots[0];
      var f = fiche(cle);
      var memo = memoire[cle] || {};
      var bloc = el('div', 'mvt');
      var h = el('header');

      h.appendChild(champ(memo.nom != null ? memo.nom : (f ? f.nom : cle),
        'Nom du type', function (v) {
          memo.nom = v;
          memoire[cle] = memo;
          if ((memo.nom == null || memo.nom === (f ? f.nom : cle))
              && memo.mots == null) {
            delete memoire[cle];
          }
          retenir();
          majBarre();
        }));
      h.appendChild(champ(memo.mots != null ? memo.mots : k.mots.join(', '),
        'Mots reconnus (séparés par des virgules)', function (v) {
          memo.mots = v;
          memoire[cle] = memo;
          retenir();
          majBarre();
        }, true));
      bloc.appendChild(h);

      if (!f) {
        bloc.appendChild(el('div', 'note manque',
          'AUCUNE FICHE DE REVUE. Ce type est livré et personne ne peut '
        + 'dire d’où il vient.'));
        sortie.appendChild(bloc);
        return;
      }

      /* Ce que l'outil ajoute, CALCULÉ par le modèle et non recopié. */
      var ids = A.m.musclesDeLOutil([cle]);
      var d = el('div', 'delta');
      d.appendChild(el('span', 'et change', 'ajoute ' + ids.length + ' muscle(s)'));
      if ((k.entrees || []).length) {
        d.appendChild(el('span', 'et pareil',
          'reprend : ' + k.entrees.join(' + ')));
      }
      /* Les positions SUGGEREES, relues par le modele et non recopiees :
         une liste de plus ici se mettrait a mentir le jour ou le type
         change. Elles ne portent aucun muscle — c'est mesure, et le banc
         tient l'inclusion. */
      var pos = A.m.reglagesProposes(null, cle);
      if (pos.length) {
        d.appendChild(el('span', 'et pareil',
          'suggère ' + pos.length + ' réglage(s) : ' + pos.join(' · ')));
      }
      bloc.appendChild(d);

      /* LA SOURCE DU TYPE, avant les muscles : c'est elle qu'on relit. */
      var corps = el('div', 'note');
      if (f.cite) corps.appendChild(el('div', 'cite', '« ' + f.cite + ' »'));
      var q = el('div', 'qui');
      if (f.source.lien) {
        var a = el('a', null, f.source.qui);
        a.href = f.source.lien; a.target = '_blank'; a.rel = 'noreferrer';
        q.appendChild(a);
      } else {
        q.textContent = f.source.qui;
      }
      corps.appendChild(q);
      var v = el('div', 'deux');
      v.appendChild(el('span', null, 'Vu chez (liens produit) :'));
      var ul = document.createElement('ul');
      f.liens.forEach(function (x) {
        var li = el('li');
        var a = el('a', null, x.texte);
        a.href = x.url; a.target = '_blank'; a.rel = 'noreferrer';
        li.appendChild(a);
        /* MB veut VOIR que son matériel est retrouvable. Le nom officiel
           est donc relu PAR LE MODÈLE devant lui, pas affirmé. */
        if (estProduit(x.texte)) {
          var np = nomProduit(x.texte);
          var vu = A.m.typesDeLOutil(np).length;
          var mu = A.m.musclesDeLOutil([np]).length;
          li.appendChild(el('span', vu ? 'ok' : 'rouge',
            vu ? ' ✓ reconnu' + (mu ? ' (' + mu + ' muscle(s))' : ' (aucun muscle)')
               : ' ✗ NON RECONNU'));
        }
        ul.appendChild(li);
      });
      v.appendChild(ul);
      corps.appendChild(v);
      bloc.appendChild(corps);

      /* LES MUSCLES, AVEC LEUR GRAVURE. */
      ids.forEach(function (id) { bloc.appendChild(rendreMuscle(id)); });

      /* ---- LES REGLAGES QUI PORTENT DES MUSCLES, AVEC LES LEURS ----

         MB, 29/10 : « Montre moi les dessins des muscles impactes pour
         les deux stp, je ne vois pas juste avec les noms
         scientifiques. » C'est la meme phrase qu'au 26/10, citee en
         tete de ce fichier : « pas les images, il me faut du visuel ».

         Les reglages n'etaient annonces que par leur NOM. Les deux
         orientations du cone, qui sont justement ce qu'il faut
         comparer, n'avaient aucune image.

         LES MUSCLES SE DEMANDENT AU MODELE, par le meme chemin que
         l'app : une liste recopiee ici divergerait. Un reglage qui
         n'en porte pas — un trou de mousqueton — ne montre rien, et
         c'est juste : il ne change pas ce qui travaille. */
      pos.forEach(function (nomReglage) {
        var bidon = { nom: 'x', outils: [cle], reglages: {} };
        bidon.reglages[A.m.slug(cle)] = nomReglage;
        var mids = A.m.musclesDesReglages(A.store.vide(), bidon) || [];
        if (!mids.length) return;
        var t = el('div', 'delta');
        t.appendChild(el('span', 'et change',
          'Réglage « ' + nomReglage + ' » — ' + mids.length + ' muscle(s)'));
        bloc.appendChild(t);
        mids.forEach(function (id) { bloc.appendChild(rendreMuscle(id)); });
      });

      /* LA COMPATIBILITÉ — demande de MB du 26/10, LIVRÉE le 27/10. Elle
         est lue DANS LE MODÈLE : la fiche ne la porte plus, parce que deux
         copies d'un même texte divergent, et que celle qu'on ne lit plus
         est celle qui ment. */
      var mo = A.m.MONTAGE[cle] || {};
      var c = el('div', 'decider');
      c.appendChild(el('b', null, 'Se monte sur : '));
      c.appendChild(document.createTextNode(mo.monte || '—'));
      if (mo.pasSur) {
        c.appendChild(document.createElement('br'));
        c.appendChild(el('b', null, 'Pas sur : '));
        c.appendChild(document.createTextNode(mo.pasSur));
      }
      bloc.appendChild(c);

      bloc.appendChild(el('div', 'note', f.note));
      sortie.appendChild(bloc);
    });

    /* ---------- ce qui a été écarté ---------- */
    cat.ECARTES.forEach(function (e) {
      var bloc = el('div', 'mvt');
      var h = el('header');
      h.appendChild(el('h2', null, 'Écarté — ' + e.nom));
      bloc.appendChild(h);
      bloc.appendChild(el('div', 'note', e.pourquoi));
      sortie.appendChild(bloc);
    });

    document.title = (sf.length + ef.length + md.length + pn.length
                    + mp.length ? '✗ ' : '✓ ')
      + types.length + ' types — Équipement';

    window.__equipement = {
      types: types.length, mots: mots, muscles: muscles, mesures: mesures,
      parLeGeste: parLeGeste, ecartes: cat.ECARTES.length,
      sansFiche: sf.length, fantomes: ef.length, motsDoubles: md.length,
      nonReconnus: pn.length, depareilles: mp.length,
      renommages: Object.keys(memoire).length
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rendre);
  } else {
    rendre();
  }
}());
