/* Panneau plein écran + éditeur d'attributs d'exercice, partagé entre
   l'éditeur de programme et la séance en cours. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function ouvrirPanneau(titre, construireCorps, actions, auxFermer) {
    var corps = A.ui.h('div', { class: 'panneau-corps' });
    var interieur = h('div', { class: 'interieur' });
    corps.appendChild(interieur);

    var fermerBt = h('button', { class: 'bt-icone', 'aria-label': 'Fermer', text: '✕' });
    var pan = h('div', { class: 'panneau', role: 'dialog', 'aria-modal': 'true', 'aria-label': titre },
      h('div', { class: 'panneau-entete' }, fermerBt, h('h2', { text: titre })),
      corps);

    /* CHAQUE PANNEAU PASSE AU-DESSUS DE CEUX QUI SONT DEJA OUVERTS.

       `.panneau` vaut 80 pour tous : deux panneaux ouverts en meme temps
       — l'editeur d'un programme, puis « Modifier l'exercice » — se
       departagent alors par le seul ordre du document. Ca marche, et ca
       marche par accident : un re-rendu qui reinsere le premier apres le
       second l'inverserait sans bruit, et le panneau qu'on vient
       d'ouvrir s'afficherait DERRIERE celui qu'on regarde.

       MESURE DU 11/11, en cherchant le defaut que MB voit dans les
       Programmes : les deux portaient bien 80 et 80.

       LA MARGE EST TENUE : la profondeur depasse rarement deux, et
       `.popo` vaut 90 — les menus restent donc au-dessus de tous les
       panneaux tant qu'on n'en empile pas dix, ce que rien ne fait. */
    pan.style.zIndex = String(80 + document.querySelectorAll('.panneau').length);

    var ferme = false;
    var entree = null;

    /* detruire() = le démontage seul ; fermer() = démontage + consommation de
       l'entrée d'historique. Le Retour d'Android appelle detruire() directement,
       l'interface appelle fermer(). */
    function detruire() {
      if (ferme) return;
      ferme = true;
      document.removeEventListener('keydown', esc);
      if (pan.parentNode) pan.parentNode.removeChild(pan);
      if (auxFermer) auxFermer();
    }
    function fermer() {
      if (ferme) return;
      detruire();
      A.ui.depiler(entree);
    }
    function esc(e) {
      if (e.key !== 'Escape') return;
      if (document.querySelector('.popo')) return;              // une feuille de choix est ouverte
      var tous = document.querySelectorAll('.panneau');
      if (tous[tous.length - 1] !== pan) return;                // seul celui du dessus se ferme
      fermer();
    }
    fermerBt.addEventListener('click', fermer);
    document.addEventListener('keydown', esc);

    construireCorps(interieur, fermer);

    if (actions && actions.length) {
      var pied = h('div', { class: 'panneau-pied' });
      actions.forEach(function (a) {
        var b = h('button', { class: 'bt ' + (a.classe || ''), text: a.nom });
        b.addEventListener('click', function () { a.action(fermer); });
        pied.appendChild(b);
      });
      pan.appendChild(pied);
    }

    document.body.appendChild(pan);
    entree = A.ui.empiler(detruire);
    return fermer;
  }

  /* ------------------------------------------------------------------
     Une planche de Gray, en grand

     Le schéma de l'onglet Suivi répond à « combien » : il se teinte, il se
     touche, il tient dans 190 px. Il ne répondra jamais à « à quoi ça
     ressemble, et où est-ce exactement » — c'est un schéma de bandes, et
     c'est dit à l'écran.

     La gravure répond à ça, et à rien d'autre : elle ne se teinte pas, elle
     ne compte rien. On y ajoute le nom LATIN parce que c'est celui qui est
     écrit SUR la gravure ; chercher « fléchisseur ulnaire » sur une planche
     de 1918 ne donne rien.
     ------------------------------------------------------------------ */
  function voirPlanche(idMuscle) {
    var m = A.m.muscle(idMuscle);
    var img = A.m.imageDuMuscle(idMuscle);
    if (!m || !img) return;
    return ouvrirPanneau(m.nom, function (c) {
      c.appendChild(h('div', { class: 'item-resume', style: 'margin-bottom:2px' },
        h('b', { text: m.latin }),
        h('span', { text: ' — en rouge sur le membre.' })));

      /* L'illustration du muscle : le membre entier, avec celui-là en rouge.
         C'est ce que le découpage essayait de fabriquer sans y arriver — ici
         la forme est juste par construction, puisque c'est la planche
         elle-même qui porte la teinte. */
      c.appendChild(h('img', { class: 'planche', src: img,
        alt: m.nom + ', teinté en rouge sur le membre supérieur' }));

      c.appendChild(h('div', { class: 'item-resume', style: 'margin-top:8px' },
        h('span', { text: m.quoi.charAt(0).toUpperCase() + m.quoi.slice(1) + '. ' }),
        h('span', { text: 'Mobilise : ' + A.m.nomArticulation(m.articulation) + '.' })));
      if (m.aussi) {
        c.appendChild(h('div', { class: 'item-resume',
          text: 'Dit aussi « ' + m.aussi +' » sur les planches françaises.' }));
      }
      c.appendChild(h('div', { class: 'item-resume', style: 'margin-top:8px;opacity:.75',
        text: 'Henry Gray, Anatomy of the Human Body, 1918. Domaine public.' }));
    }, [{ nom: 'Fermer', classe: 'bt-plein', action: function (f) { f(); } }]);
  }

  /* ------------------------------------------------------------------
     Choisir dans tout l'équipement

     Taper le nom marche quand on le connaît. Passé une vingtaine d'outils, on
     ne les connaît plus par cœur et la liste déroulante de huit ne montre que
     les plus récents : il faut pouvoir OUVRIR son équipement, le voir rangé,
     et en cocher plusieurs d'un coup.

     Les catégories se replient — c'est ce qui rend trente outils parcourables
     sur un téléphone — et un filtre coupe court quand on sait ce qu'on veut.

     Les outils portés par l'exercice mais ABSENTS du catalogue (saisis à la
     main, ou retirés de l'équipement depuis) sont montrés à part et gardés :
     valider ne doit jamais faire disparaître en silence ce qui était là.
     ------------------------------------------------------------------ */
  function choisirOutils(etat, deja, onValider) {
    deja = (deja || []).slice();

    /* L'identité est le slug, comme partout ailleurs ; la valeur gardée est
       le NOM, comme partout ailleurs aussi. */
    var choisis = {};
    deja.forEach(function (n) { choisis[A.m.slug(n)] = n; });

    /* TOUS LES EQUIPEMENTS, reconnus compris. Le filtre pose le 28/10 sur
       la LISTE DE REGLAGES ne vaut pas ici : ce panneau sert a ATTACHER un
       equipement a un exercice, et masquer les reconnus empecherait d'y
       mettre un Fat Gripz. Le banc l'a attrape — « Choisir dans
       l'equipement » est tombe a 22/23 des que le defaut de la fonction a
       change. Une porte de reglage qu'on range n'est pas une porte d'usage
       qu'on ferme. */
    var groupes = A.m.outilsParCategorie(etat, 'tous');
    var connus = {};
    groupes.forEach(function (g) { g.outils.forEach(function (o) { connus[o.slug] = true; }); });
    var horsCatalogue = deja.filter(function (n) { return !connus[A.m.slug(n)]; });

    ouvrirPanneau('Mon équipement', function (c, fermer) {
      if (!groupes.length && !horsCatalogue.length) {
        c.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Aucun équipement' }),
          'Rien n’est livré avec l’app. Ajoute tes outils depuis Réglages, '
        + 'ou tape-les directement dans la fiche : ils entreront tout seuls.'));
        return;
      }

      var champFiltre = h('input', { class: 'champ', type: 'search',
                                     placeholder: 'Filtrer — poulie, grip…',
                                     inputmode: 'search', enterkeyhint: 'done' });
      c.appendChild(A.ui.groupe('', champFiltre));

      var compteur = h('div', { class: 'item-resume', style: 'margin:-4px 2px 10px' });
      c.appendChild(compteur);
      function majCompteur() {
        var n = Object.keys(choisis).length;
        compteur.textContent = n ? n + ' outil' + (n > 1 ? 's' : '') + ' sur cet exercice'
                                 : 'Aucun outil sur cet exercice.';
      }
      majCompteur();

      var sections = [];

      function section(titre, outils, ouvertParDefaut) {
        var corps = h('div', { class: 'equip-liste' });
        var chevron = h('span', { class: 'equip-chevron', 'aria-hidden': 'true', text: '▾' });
        var compte = h('span', { class: 'equip-compte' });
        var entete = h('button', { type: 'button', class: 'equip-cat',
                                   'aria-expanded': ouvertParDefaut ? 'true' : 'false' },
          chevron, h('b', { text: titre }), compte);

        var lignes = [];
        outils.forEach(function (o) {
          var slug = o.slug || A.m.slug(o.nom);
          var bt = h('button', { type: 'button', class: 'equip-ligne',
                                 'aria-pressed': choisis[slug] ? 'true' : 'false' },
            h('span', { class: 'equip-coche', 'aria-hidden': 'true' }),
            h('span', { class: 'equip-nom', text: o.nom }));
          bt.addEventListener('click', function () {
            if (choisis[slug]) delete choisis[slug]; else choisis[slug] = o.nom;
            bt.setAttribute('aria-pressed', choisis[slug] ? 'true' : 'false');
            majCompte();
            majCompteur();
          });
          lignes.push({ bouton: bt, slug: slug, nom: o.nom });
          corps.appendChild(bt);
        });

        function majCompte() {
          var n = lignes.filter(function (l) { return !!choisis[l.slug]; }).length;
          compte.textContent = n ? n + ' / ' + lignes.length : String(lignes.length);
        }
        majCompte();

        function ouvrir(oui) {
          entete.setAttribute('aria-expanded', oui ? 'true' : 'false');
          corps.hidden = !oui;
        }
        ouvrir(ouvertParDefaut);
        entete.addEventListener('click', function () {
          ouvrir(entete.getAttribute('aria-expanded') !== 'true');
        });

        var bloc = h('div', { class: 'equip-bloc' }, entete, corps);
        c.appendChild(bloc);
        sections.push({ bloc: bloc, lignes: lignes, ouvrir: ouvrir, majCompte: majCompte });
      }

      /* Ce qui est sur l'exercice sans être au catalogue vient en premier :
         c'est ce qu'on risquerait de perdre sans le voir. */
      if (horsCatalogue.length) {
        section('Sur cet exercice, hors équipement',
                horsCatalogue.map(function (n) { return { nom: n, slug: A.m.slug(n) }; }), true);
      }
      groupes.forEach(function (g) { section(g.categorie, g.outils, true); });

      /* Filtrer : on masque les lignes qui ne correspondent pas, et une
         catégorie vidée disparaît plutôt que de laisser un titre orphelin.
         Le filtre OUVRE ce qu'il trouve — sinon il faudrait déplier pour voir
         le résultat de sa propre recherche. */
      champFiltre.addEventListener('input', function () {
        var q = A.m.slug(champFiltre.value);
        sections.forEach(function (s) {
          var visibles = 0;
          s.lignes.forEach(function (l) {
            var ok = !q || l.slug.indexOf(q) >= 0;
            l.bouton.hidden = !ok;
            if (ok) visibles += 1;
          });
          s.bloc.hidden = visibles === 0;
          if (q) s.ouvrir(true);
        });
      });
      champFiltre.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); champFiltre.blur(); }
      });
    }, [
      { nom: 'Annuler', action: function (fermer) { fermer(); } },
      { nom: 'Valider', classe: 'bt-primaire', action: function (fermer) {
          /* L'ordre déjà en place est conservé : revalider ne doit pas
             rebattre les jetons sous les yeux. Les nouveaux suivent. */
          var sortie = deja.filter(function (n) { return !!choisis[A.m.slug(n)]; });
          var dedans = {};
          sortie.forEach(function (n) { dedans[A.m.slug(n)] = true; });
          Object.keys(choisis).forEach(function (s) {
            if (!dedans[s]) sortie.push(choisis[s]);
          });
          fermer();
          onValider(sortie);
        } }
    ]);
  }

  /* Attributs d'un exercice. `exo` est muté en place ; `onFini` sert à
     rafraîchir uniquement l'en-tête concerné, jamais la liste entière. */
  function editerExercice(exo, options, onFini) {
    options = options || {};
    /* L'etat est relu a chaque usage, jamais capture : un import (remplacer())
       ou un effacement (vider()) remplace l'objet, et une reference prise a
       l'ouverture ecrirait ensuite dans un orphelin — en silence. */
    function etat() { return A.store.etat(); }
    var titre = options.titre || (exo.nom ? 'Modifier l’exercice' : 'Nouvel exercice');

    var valider = null;

    ouvrirPanneau(titre, function (c, fermer) {
      var champNom = h('input', { class: 'champ', value: exo.nom || '',
                                  placeholder: 'Curl marteau fat grip', inputmode: 'text' });
      var gNom = A.ui.groupe('Nom de l’exercice', champNom);
      c.appendChild(gNom);

      var btAw = h('button', { type: 'button', class: 'puce puce-aw', text: 'Spécifique bras de fer',
                               'aria-pressed': exo.aw ? 'true' : 'false' });
      var selCharge = h('select', { class: 'champ' });
      var selForces = null;

      champNom.addEventListener('input', function () {
        if (surChangementForces) surChangementForces();
      });

      A.ui.autocomplete(champNom, function (saisie) {
        /* RIEN TANT QUE RIEN N'EST TAPÉ. MB, 28/10 : « quand je clique sur
           Nom de l'exercice, il me propose des historiques que j'ai déjà
           fait, je n'en veux pas, ça va faire une surcharge d'info ».

           Mesuré : `autocomplete` ouvre la liste au FOCUS autant qu'à la
           saisie, et `suggestions(etat, '')` rend les huit exercices les
           plus récents. Un simple appui dans le champ posait donc huit
           lignes sur l'écran avant la première lettre.

           LA GARDE EST ICI, dans CE fournisseur, et non dans `autocomplete`
           ni dans `suggestions` : le champ des outils emploie le premier, et
           sa liste au focus, elle, sert — c'est là qu'on retrouve son
           matériel. Un seul écran change. */
        if (!String(saisie || '').trim()) return [];
        return A.m.suggestions(etat(), saisie, 8).map(function (x) {
          var j = [];
          /* Une entrée du DICTIONNAIRE se montre pour ce qu'elle est : elle
             ne vient pas du carnet, et elle ne décide que des muscles. Lui
             coller le jeton « Kilos » laisserait croire qu'elle apporte un
             type de charge, qu'elle n'apporte pas. */
          if (x.duDictionnaire) {
            /* « LE MIEN » SE DISTINGUE DU LIVRE. Sans ça, MB ne saurait pas
               si les muscles qui arrivent sont les siens ou ceux du carnet —
               et c'est précisément ce qu'il faut savoir pour arbitrer un
               homonyme. */
            j.push(x.aMoi ? { texte: 'mon dictionnaire', classe: 'jeton-dico-moi' }
                          : { texte: 'dictionnaire', classe: 'jeton-dico' });
            if (x.entree && x.entree !== x.nom) j.push({ texte: '= ' + x.entree });
            j.push({ texte: x.muscles.length + ' muscles' });
          } else {
            /* « EXERCICE CONNU » : MB, 28/10, « ou alors "exercice connu"
               car pas dans le dictionnaire a la base ». Une suggestion sans
               jeton de provenance laissait croire que tout venait du meme
               endroit. */
            j.push({ texte: 'exercice connu', classe: 'jeton-connu' });
            if (x.aw) j.push({ texte: 'AW', classe: '' });
            j.push({ texte: A.m.typeCharge(x.typeCharge).nom });
            if ((x.outils || []).length) j.push({ texte: x.outils.join(' + '), classe: 'jeton-outil' });
          }
          x.jetons = j;
          return x;
        });
      }, prendre);

      /* CE QU'ON FAIT D'UN EXERCICE CHOISI, PAR QUELQUE CHEMIN QUE CE SOIT.

         Extrait le 29/10 : la liste de suggestions et le bouton « Parcourir
         le dictionnaire » mènent tous deux ici. Écrire un second
         remplissage à côté aurait donné deux comportements pour un même
         geste — le défaut déjà payé sur les colonnes, puis sur la
         recherche. */
      function prendre(it) {
        /* LES ETAGES SUIVENT CE QU'ON VIENT DE CHOISIR — correctif du
           10/11, et il ferme DEUX constats de MB d'un coup.

           L'autocompletion pose `champ.value` sans emettre `input`
           (js/ui.js), et cet evenement est le seul qui tenait
           `ficheOuverte` a jour. Selon ce qu'on avait tape avant, il
           restait donc `null` — aucun etage, donc pas d'acces au
           Materiel — ou PERIME : l'ecran montrait les gestes de la
           fiche precedente sous le nom d'une autre.

           Mesure du 10/11 : champ « Wrist curl cote petit doigt », qui
           n'a AUCUN geste, et l'ecran affichait encore « Wrist curl
           derriere le dos ».

           C'est ici que ca se repare, et pas dans `ui.js` : ce
           `prendre` est deja « ce qu'on fait d'un exercice choisi, par
           quelque chemin que ce soit ». Le reparer dans
           l'autocompletion aurait touche aussi le champ des outils, qui
           n'a pas d'etages. */
        majFicheOuverte(it.nom || champNom.value);

        /* Une entrée du dictionnaire ne remplit QUE les muscles — décision
           de MB, 2026-10-23. Le type de charge, le côté, la prise et les
           outils restent ce qu'ils étaient : on ne décide rien à sa place,
           et « non renseigné » le reste. */
        if (it.duDictionnaire) {
          exo.muscles = A.m.muscles(it);
          rafraichirMuscles();
          /* LE RENDU, PAS SEULEMENT L'ETAT : `majFicheOuverte` change ce
             que l'ecran DOIT montrer, il ne le montre pas. */
          rendreVariantes();
          return;
        }
        /* Reprendre un nom connu reprend ses attributs : on ne les resaisit pas. */
        exo.aw = it.aw;
        exo.typeCharge = it.typeCharge;
        exo.colonnes = A.m.colonnes(it);
        exo.cote = A.m.coteValide(it.cote);
        exo.muscles = A.m.muscles(it);
        exo.prise = A.m.priseValide(it.prise);
        exo.forces = (it.forces || []).slice();
        exo.outils = (it.outils || []).slice();
        exo.structures = (it.structures || []).slice();
        btAw.setAttribute('aria-pressed', exo.aw ? 'true' : 'false');
        selCharge.value = exo.typeCharge;
        rafraichirColonnes();
        rafraichirCote();
        rafraichirPrise();
        rafraichirMuscles();
        if (selForces) rafraichirForces();
        rafraichirOutils();
        rafraichirStructures();
        /* APRES `exo.outils`, ET C'EST POURQUOI CE N'EST PAS EN TETE :
           cette branche REMPLACE les outils de l'exercice, et l'etage 3
           les affiche. Redessiner avant aurait montre les precedents. */
        rendreVariantes();
      }

      /* ---------- PARCOURIR LE DICTIONNAIRE ----------

         MB, 29/10, après avoir vu trois rendus simulés : « A, le bouton ».

         RIEN NE CHANGE POUR QUI TAPE. Le bouton est fermé au départ et
         n'occupe qu'une ligne ; les huit groupes n'existent dans la page
         que s'il est ouvert. Un panneau déjà long ne s'allonge pas pour
         ceux qui n'en ont pas besoin. */
      var zoneDico = h('div');
      var dicoOuvert = false;
      var btDico = h('button', { type: 'button', class: 'bt bt-doux',
                                 style: 'width:100%',
                                 'aria-expanded': 'false' });

      function libelleDico() {
        btDico.textContent = (dicoOuvert ? 'Masquer le dictionnaire ▴'
                                         : 'Parcourir le dictionnaire ▾');
        btDico.setAttribute('aria-expanded', dicoOuvert ? 'true' : 'false');
      }

      /* ---------- LES VARIANTES, SOUS LE NOM ----------

         MB, 30/10, après avoir essayé le carnet : « dans Curl Biceps, je
         vois 17 autres noms, comment les sélectionner une fois que j'ai
         cliqué sur Curl Biceps, c'est ça que je veux faire ».

         CE QUI RESTE DANS `aussi` EST BIEN DES VARIANTES, et c'est ce qui
         rend ce bloc possible : l'écrémage du 30/10 a retiré les synonymes
         et les traductions — « Curl spider », « Zottman curl », « Pompe ».
         Ce qui demeure décrit un geste qui CHANGE : l'engin, la position,
         la prise.

         RIEN DE NEUF N'EST STOCKÉ. Cliquer une variante écrit son nom dans
         le champ, exactement comme si on l'avait tapé — `ficheDictionnaire`
         rend la même fiche pour une écriture que pour son nom de base, et
         les muscles ne bougent pas. L'historique continue de se tenir par
         le nom, comme avant. */
      var zoneVariantes = h('div');
      var ficheOuverte = null;      // le nom de BASE, pas l'écriture choisie

      /* ================= LE MATERIEL ORDINAIRE =================

         Aucun de ces engins n'est du materiel de bras de fer, et c'est
         VOULU — MB, 31/10 : « pour moi les deux sont distincts pour le
         coup, pas de melange ». La corde AW et la corde de poulie portent
         le meme mot ; elle n'est donc PAS ici.

         « Machines et elastiques » et non « Cables et resistance » : MB,
         « faut trouver autre chose car on a machine.... ». Les trois
         objets sont Poulie, Elastique, Machine, et une poulie est une
         machine au sens courant. */
      /* LA TABLE VIT DANS LE MODELE DEPUIS LE 10/11, et cet ecran la
         lit. Elle etait ici, dans cette closure : le versement au
         catalogue ne pouvait donc pas distinguer le materiel de salle de
         l'equipement, et tout entrait dans « Le mien ». Une seconde copie
         aurait diverge a la premiere entree ajoutee. */
      var MATERIEL = A.m.MATERIEL_SALLE;
      var estMateriel = A.m.estMaterielDeSalle;

      /* L'ETAT D'OUVERTURE DES CATEGORIES SURVIT AU RE-RENDU, qui a lieu a
         chaque clic : sans lui, poser une puce refermait la categorie
         qu'on etait en train d'employer. */
      var ouverts = {};

      function blocExplication(xp) {
        var p = h('div', { class: 'item-resume',
          style: 'margin:7px 2px;line-height:1.45;white-space:normal' });
        p.appendChild(h('div', { class: 'remarque-titre', text: 'Le geste' }));
        p.appendChild(h('div', { text: xp.faire }));
        /* PLUS DE BLOC « CE QUE CA CHANGE » — MB, 10/11 : « trop de
           blabla [...] la ya trop d'info, synthetise ».

           MESURE : 40 gestes, 15 013 caracteres d'explication. Ce bloc
           en portait 3 637, soit 24 % de ce qu'on lit. Il reste DANS LES
           DONNEES (`g.change`), donc il revient en decommentant ces
           lignes — les 40 phrases ne sont pas perdues, elles ne sont
           plus affichees.

           CE QU'ON PERD, ET IL FAUT LE SAVOIR : la phrase qui disait en
           quoi un geste differe de sa fiche. Quand cette nuance est le
           SEUL moyen de ne pas confondre deux mouvements, elle passe
           desormais dans le texte du geste lui-meme. */
        /* if (xp.change) { ... } — retire le 10/11, voir ci-dessus. */
        if (xp.source) {
          p.appendChild(h('div', { style: 'margin-top:4px;opacity:.65;'
            + 'font-style:italic', text: xp.source }));
        }
        return p;
      }

      /* QUELLE FICHE L'ECRAN REGARDE, d'apres ce que le champ porte.

         Un seul endroit decide, et les trois chemins y passent : la
         frappe, le dictionnaire, et l'autocompletion. Avant le 10/11 le
         troisieme n'y passait pas, et `ficheOuverte` restait `null` ou
         perime — les constats 2 et 5 de MB.

         ELLE REND LE NOM DE BASE, jamais l'ecriture choisie : taper
         « Cable wrist curl » doit ouvrir les gestes de « Wrist curl ».
         C'est `ficheDictionnaire` qui le sait, pas moi. */
      function majFicheOuverte(nom) {
        var f = A.m.ficheDictionnaire(String(nom || '').trim(), etat());
        ficheOuverte = (f && f.nom) || null;
      }

      function rendreVariantes() {
        A.ui.vider(zoneVariantes);
        if (!ficheOuverte) return;
        var G = A.gestes;
        var choisi = champNom.value.trim();

        /* ---- 2. LA FACON DE L'EXECUTER ----
           Les seuls GESTES, pas les ecritures d'engin : celles-ci
           faisaient les doublons que MB a vus le 30/10, et l'engin se
           choisit maintenant a l'etage 3. */
        /* LES MIENS AVEC LES LIVRES, depuis le 04/11 (chantier 7).

           `G.gestesDe` ne lit que la table LIVREE : une ecriture ajoutee
           par MB etait cherchable mais n'apparaissait PAS ici. La fusion
           vit dans le modele — `gestesDuNom` — pour que le banc puisse la
           mesurer. */
        var gestes = A.m.gestesDuNom
          ? A.m.gestesDuNom(ficheOuverte, etat())
          : (G ? G.gestesDe(ficheOuverte) : []);
        zoneVariantes.appendChild(h('div', { class: 'item-resume',
          style: 'margin:10px 2px 4px', text: gestes.length
            ? '2 — La façon de l’exécuter · ' + gestes.length + ' connue(s)'
            : '2 — La façon de l’exécuter · ce mouvement n’en a pas d’autre' }));

        if (gestes.length) {
          var puces = h('div', { class: 'dico-variantes' });
          var noms = [ficheOuverte].concat(gestes.map(function (g) { return g.nom; }));
          noms.forEach(function (n) {
            var b = h('button', { type: 'button', class: 'dico-variante',
                                  'aria-pressed': n === choisi ? 'true' : 'false',
                                  text: n === ficheOuverte ? 'le mouvement simple' : n });
            b.addEventListener('click', function () { poserNom(n); });
            puces.appendChild(b);
          });
          zoneVariantes.appendChild(puces);
        }

        /* L'EXPLICATION DU GESTE CHOISI, ou celle du mouvement quand on est
           sur le nom simple. Une absence se DIT, elle ne se laisse pas
           vide : MB a vu « Barre au front » ne rien afficher. */
        var xp = null, aMoi = null;
        if (choisi && choisi !== ficheOuverte) {
          aMoi = gestes.filter(function (g) {
            return g.deMoi && g.nom === choisi; })[0] || null;
        }
        if (G && !aMoi) {
          if (choisi && choisi !== ficheOuverte) {
            xp = G.gestesDe(ficheOuverte).filter(function (g) {
              return g.nom === choisi; })[0] || null;
          }
          if (!xp) xp = G.explicationDe(ficheOuverte);
        }
        /* UN GESTE A MOI NE SE PRESENTE PAS COMME LES 38 LIVRES.

           C'est la question que le chantier 7 laissait ouverte. Il n'a pas
           d'explication et on n'en invente aucune : l'ecran le DIT. Laisser
           le bloc vide le ferait passer pour un oubli du carnet, et MB a
           deja vu « Barre au front » ne rien afficher. */
        zoneVariantes.appendChild(
          aMoi
            ? h('div', { class: 'item-resume', style: 'margin:4px 2px;opacity:.75',
                text: 'Ajouté par toi. Pas d’explication écrite — les '
                    + 'explications du carnet citent toutes une source, et '
                    + 'celle-ci n’en a pas.' })
            : xp ? blocExplication(xp)
            : h('div', { class: 'item-resume', style: 'margin:4px 2px;opacity:.7',
                text: 'Pas encore d’explication écrite pour ce mouvement.' }));

        /* ---- AJOUTER UNE FACON DE L'ECRIRE ----

           Le manque 2 du chantier 7 : le bouton d'ajout au dictionnaire se
           cachait des que la fiche etait livree, et il n'y avait AUCUN
           chemin pour completer « Curl biceps ». Celui-ci parait sur toute
           fiche — sur une livree, le modele cree un complement plutot que
           d'y toucher. */
        /* UN CHAMP EN LIGNE, PAS UNE BOITE DE DIALOGUE.

           `A.ui.demanderTexte` N'EXISTE PAS — verifie avant d'ecrire cette
           ligne, et `A.ui.feuille` ne sert qu'a CHOISIR, pas a saisir.
           `window.prompt` est banni ici depuis que `feuille` le remplace.
           Un champ qui se revele sous les puces evite d'inventer une API et
           garde le geste la ou il se fait. */
        var saisie = h('input', { type: 'text', class: 'champ',
                                  placeholder: 'Une autre façon de l’écrire',
                                  hidden: true, style: 'margin:6px 2px 2px' });
        var btPlus = h('button', { type: 'button', class: 'bt',
                                   style: 'margin:6px 2px 2px;font-size:.86rem',
                                   text: '+ une façon de l’écrire' });
        btPlus.addEventListener('click', function () {
          saisie.hidden = false;
          btPlus.hidden = true;
          saisie.focus();
        });
        saisie.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') { ev.preventDefault(); poserEcriture(saisie.value); }
          if (ev.key === 'Escape') { saisie.hidden = true; btPlus.hidden = false; }
        });
        /* SORTIR DU CHAMP SANS RIEN ECRIRE LE REFERME : un champ ouvert et
           vide sous les puces se lit comme un travail en cours. */
        saisie.addEventListener('blur', function () {
          if (!saisie.value.trim()) { saisie.hidden = true; btPlus.hidden = false; }
        });
        zoneVariantes.appendChild(btPlus);
        zoneVariantes.appendChild(saisie);

        function poserEcriture(v) {
          var nom = String(v || '').trim();
          if (!nom) return;
          var r = A.m.ajouterEcriture(etat(), ficheOuverte, nom);
          if (r.ok) {
            A.store.sauver(true);
            A.ui.toast('« ' + nom + ' » ajouté.');
            rendreVariantes();
            return;
          }
          /* LE REFUS DIT SA RAISON, et nomme la fiche qui a pris
             l'ecriture : sans ca MB chercherait ou elle est passee. */
          A.ui.toast(
            r.raison === 'deja' ? '« ' + nom + ' » y est déjà.'
            : r.raison === 'prise'
              ? '« ' + nom + ' » désigne déjà « '
                + (r.fiche ? r.fiche.nom : 'un autre mouvement') + ' ».'
            : r.raison === 'vide' ? 'Écris un nom.'
            : 'Impossible d’ajouter ici (' + r.raison + ').');
        }

        /* ---- 3. LE MATERIEL ----
           `exo.outils` porte le materiel ET l'equipement de bras de fer.
           On ne montre ici que le materiel ordinaire ; le reste appartient
           au groupe « Equipements », plus bas, et n'est pas touche. */
        var tous = (exo.outils || []).slice();
        var mat = tous.filter(estMateriel);
        var aw = tous.filter(function (x) { return !estMateriel(x); });

        zoneVariantes.appendChild(h('div', { class: 'item-resume',
          style: 'margin:12px 2px 4px', text: '3 — Matériel · '
            + (mat.length ? mat.length + ' posé(s)' : 'facultatif, cumulable') }));

        if (mat.length) {
          var pm = h('div', { class: 'puces' });
          mat.forEach(function (x) {
            var b = h('button', { type: 'button', class: 'puce puce-suggeree',
              'aria-pressed': 'true', text: x });
            b.addEventListener('click', function () {
              exo.outils = (exo.outils || []).filter(function (o) { return o !== x; });
              rendreVariantes();
            });
            pm.appendChild(b);
          });
          zoneVariantes.appendChild(pm);
        }

        /* ---- CE QU'ON CHOISIT LE PLUS, AVANT LES CATEGORIES ----

           Idee de MB, 10/11. Mesure : 19 entrees, 2 atteignables sans
           deplier — les 17 autres coutent deux clics et demandent de se
           rappeler leur categorie. Ces puces-ci en coutent UN.

           ELLES N'APPARAISSENT QUE S'IL Y A UN HISTORIQUE : sur un carnet
           neuf, une section « le plus choisi » vide serait une promesse
           non tenue, et elle pousserait les categories vers le bas pour
           rien. */
        var frequents = A.m.materielLePlusChoisi(etat(), 6, mat);
        if (frequents.length) {
          zoneVariantes.appendChild(h('div', { class: 'item-resume',
            style: 'margin:8px 2px 3px;opacity:.75',
            text: 'Le plus souvent choisi' }));
          var pf = h('div', { class: 'puces' });
          frequents.forEach(function (x) {
            /* LE COMPTE EST DIT. Une liste « la plus choisie » dont on ne
               voit pas les chiffres demande de croire sur parole, et deux
               materiels a une seance paraitraient alors des habitudes. */
            var b = h('button', { type: 'button', class: 'puce',
              title: x.nom + ' \u2014 ' + x.fois + ' s\u00e9ance(s)' },
              h('span', { text: x.nom }),
              h('span', { class: 'puce-compte', text: ' ' + x.fois }));
            b.addEventListener('click', function () {
              exo.outils = (exo.outils || []).concat([x.nom]);
              rendreVariantes();
            });
            pf.appendChild(b);
          });
          zoneVariantes.appendChild(pf);
        }

        MATERIEL.forEach(function (g) {
          var dedans = g.items.filter(function (it) {
            return mat.some(function (x) { return x.split(' · ')[0] === it.nom; });
          });
          var libres = g.items.filter(function (it) { return dedans.indexOf(it) < 0; });
          var d = h('details');
          if (ouverts[g.cat] || dedans.length) d.setAttribute('open', '');
          d.addEventListener('toggle', function () { ouverts[g.cat] = d.open; });
          var sm = h('summary', { class: 'equip-cat',
            style: 'cursor:pointer;list-style:revert' });
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
                rendreVariantes();
              });
              pc.appendChild(b);
            });
            d.appendChild(pc);
          } else {
            d.appendChild(h('div', { class: 'item-resume', style: 'margin:2px',
              text: 'tout est posé.' }));
          }
          zoneVariantes.appendChild(d);
        });

        /* LE REGLAGE NE S'OUVRE QUE POUR CE QUI EN A UN : le banc son
           degre, la poulie sa hauteur. Une barre n'a rien a regler. */
        mat.forEach(function (x) {
          var base = x.split(' · ')[0];
          /* LA DEFINITION VIENT DU MODELE — correctif du 11/11.

             Cette ligne lisait `TOUT_MATERIEL`, l'index local supprime la
             veille en remontant la table dans le modele. Elle jetait donc
             un `ReferenceError` des que l'exercice portait un materiel,
             et « Modifier l'exercice » ne s'ouvrait pas. */
          var def = A.m.materielDeSalle(base);
          if (!def || !def.reglages) return;
          var courant = x.indexOf(' · ') > 0 ? x.split(' · ')[1] : null;
          zoneVariantes.appendChild(h('div', { class: 'equip-cat',
            text: base + ' — réglage' }));
          var pr = h('div', { class: 'puces' });
          def.reglages.forEach(function (v) {
            var b = h('button', { type: 'button', class: 'puce',
              'aria-pressed': courant === v ? 'true' : 'false', text: v });
            b.addEventListener('click', function () {
              var neuf = (courant === v) ? base : (base + ' · ' + v);
              exo.outils = (exo.outils || []).map(function (o) {
                return o === x ? neuf : o; });
              rendreVariantes();
            });
            pr.appendChild(b);
          });
          zoneVariantes.appendChild(pr);
        });

        if (aw.length) {
          zoneVariantes.appendChild(h('div', { class: 'item-resume',
            style: 'margin:10px 2px 0;opacity:.75',
            text: aw.length + ' équipement(s) de bras de fer posé(s) plus '
                + 'bas, dans « Équipements » : ' + aw.join(', ') }));
        }
      }

      /* Le chemin commun : écrire un nom dans le champ et remplir avec lui.
         `choisirFiche` l'appelle depuis le dictionnaire, les puces de
         variantes aussi — ce qui garantit qu'ils remplissent pareil. */
      function poserNom(nom) {
        var f = A.m.ficheDictionnaire(nom, etat());
        champNom.value = nom;
        /* PAS DE `input` EMIS ICI. L'autocomplétion écoute cet événement :
           elle se déployait par-dessus le dictionnaire pour proposer ce
           qu'on venait de choisir. Ce qui doit rester commun aux deux
           chemins, c'est `prendre(it)` — le remplissage — et il l'est. */
        if (surChangementForces) surChangementForces();
        if (f) prendre(f);
        /* `f.nom`, PAS `f.entree`. Mesure du 30/10 : `ficheDictionnaire`
           rend la fiche BRUTE du dictionnaire — elle porte `nom`, `groupe`,
           `aussi`, `muscles`, et AUCUN champ `entree`. J'avais pris le nom
           de champ d'une autre fonction, celle qui compose une fiche pour
           l'autocompletion. Le bloc ne s'affichait jamais. */
        ficheOuverte = (f && f.nom) || nom;
        rendreVariantes();
      }

      function choisirFiche(nom) {
        poserNom(nom);
        dicoOuvert = false;
        libelleDico();
        rendreDico();
      }

      /* LE DICTIONNAIRE CHERCHE PAR LUI-MEME — correctif du 10/11.

         Il filtrait sur `champNom`, ce qui aide tant qu'on tape et
         enferme des qu'un exercice est choisi : le champ porte alors un
         nom complet, et le dictionnaire ne montrait plus qu'une ligne.
         MB : « je suis stuck avec l'exo choisi ».

         Meme motif que *Reglages > Le dictionnaire du carnet*, qui a son
         champ a lui depuis la 1.57.0. Une seule facon de chercher dans le
         dictionnaire, pas deux.

         IL SURVIT AU RE-RENDU : `rendreDico` ne vide que la LISTE. Le
         recreer a chaque frappe lui ferait perdre le focus au premier
         caractere — et on ne pourrait toujours pas chercher. */
      var champDico = h('input', { type: 'text', class: 'champ',
        placeholder: 'Chercher dans le dictionnaire\u2026',
        'aria-label': 'Chercher dans le dictionnaire' });
      var listeDico = h('div');
      /* IL NAIT CACHE. `rendreDico` le cache aussi, mais il n'est
         appele qu'au clic sur le bouton : a la creation, le champ
         restait visible sous l'etage 3, dictionnaire ferme. Vu a
         l'ecran le 10/11 — aucune epreuve ne pouvait le dire, elles
         ouvrent toutes le dictionnaire avant de regarder. */
      champDico.hidden = true;
      zoneDico.appendChild(champDico);
      zoneDico.appendChild(listeDico);
      champDico.addEventListener('input', function () { rendreDico(); });

      function rendreDico() {
        A.ui.vider(listeDico);
        champDico.hidden = !dicoOuvert;
        if (!dicoOuvert) return;
        var q = champDico.value.trim();
        var groupes = A.m.fichesParGroupe(etat(), q);
        var lignes = groupes.reduce(function (n, g) { return n + g.fiches.length; }, 0);
        if (!lignes) {
          listeDico.appendChild(h('div', { class: 'item-resume',
            text: 'Aucun mouvement ne correspond à « ' + q + ' ».' }));
          return;
        }
        listeDico.appendChild(h('div', { class: 'item-resume',
          style: 'margin:6px 2px',
          text: (q ? lignes + ' mouvement(s) pour « ' + q + ' »'
                   : A.m.DICTIONNAIRE.length + ' mouvements')
              + ' — chacun dans le groupe de ce qu’il travaille le plus. '
              + 'Touche-en un pour le prendre : il ne remplit que les '
              + 'muscles.' }));
        groupes.forEach(function (g) {
          if (!g.fiches.length) return;
          var compte = h('span', { class: 'equip-compte', text: String(g.fiches.length) });
          var chevron = h('span', { class: 'equip-chevron', 'aria-hidden': 'true', text: '▾' });
          var entete = h('button', { type: 'button', class: 'equip-cat',
                                     'aria-expanded': q ? 'true' : 'false' },
            h('b', { text: g.nom }), compte, chevron);
          var corps = h('div', { class: 'carte-corps reglages-repli' });
          corps.hidden = !q;
          g.fiches.forEach(function (d) {
            /* LE NOM, PUIS SES AUTRES ECRITURES — PAS SES MUSCLES.

               MB, 29/10 : « pas besoin de mettre les muscles que ca
               travaille » ; puis « tu peux mettres les noms connus a la
               place, ca indiquera les variantes pour l'user ». Les muscles
               arrivent une ligne plus bas, dans la fiche, des qu'on a
               choisi. Reglages, lui, les garde : on y vient justement pour
               savoir ce qu'une fiche porte.

               TROIS AU PLUS, ET LE RESTE SE COMPTE. Mediane : 3 ecritures.
               Mais le developpe militaire en porte VINGT — 599 caracteres,
               huit lignes a 320 px pour une seule entree. 34 fiches sur 62
               sont donc tronquees, et le nombre restant est ECRIT : une
               liste qui s'arrete sans le dire se lit comme complete. */
            var b = h('button', { type: 'button', class: 'dico-choix' });
            b.appendChild(h('div', { class: 'remarque-titre', text: d.nom }));
            var au = d.aussi || [];
            if (au.length) {
              b.appendChild(h('div', { class: 'item-resume',
                text: au.slice(0, 3).join(' · ')
                    + (au.length > 3 ? ' · +' + (au.length - 3) + ' autres' : '') }));
            }
            b.addEventListener('click', function () { choisirFiche(d.nom); });
            corps.appendChild(b);
          });
          entete.addEventListener('click', function () {
            var o = entete.getAttribute('aria-expanded') === 'true';
            entete.setAttribute('aria-expanded', o ? 'false' : 'true');
            corps.hidden = o;
          });
          listeDico.appendChild(h('div', { class: 'carte dico-groupes' }, entete, corps));
        });
      }

      btDico.addEventListener('click', function () {
        dicoOuvert = !dicoOuvert;
        if (dicoOuvert) {
          /* ON REPREND CE QUI EST TAPE SEULEMENT SI RIEN N'EST CHOISI.

             On cherchait : le filtre continue le geste, c'est le confort
             d'avant. Une fiche est deja reconnue : on vient voir AUTRE
             CHOSE, et le champ s'ouvre vide. C'est tout le constat du
             10/11. */
          champDico.value = ficheOuverte ? '' : champNom.value.trim();
        }
        libelleDico();
        rendreDico();
        if (dicoOuvert) champDico.focus();
      });
      /* TAPER FILTRE CE QUI EST OUVERT, et n'ouvre rien tout seul : le
         bouton reste la seule porte. */
      champNom.addEventListener('input', function () {
        /* LE DICTIONNAIRE NE SUIT PLUS CE CHAMP : il a le sien. Le laisser
           suivre reproduirait l'enfermement a la premiere frappe. */
        /* CE QU'ON TAPE DÉCIDE AUSSI DES VARIANTES. Taper le nom d'une
           fiche les ouvre sans passer par le dictionnaire ; taper autre
           chose les referme, sans quoi elles resteraient à proposer les
           variantes d'un mouvement qu'on a quitté. */
        /* MEME REGLE QUE LES DEUX AUTRES CHEMINS : une seule ecriture.
           Elle etait recopiee ici, et une troisieme fois plus bas. */
        majFicheOuverte(champNom.value);
        rendreVariantes();
      });
      libelleDico();
      /* LE DICTIONNAIRE S'OUVRE SOUS LE BOUTON QUI L'APPELLE.

         MB, 10/11 : « tu me fais pop le dico en dessous de 3- materiel,
         j'aimerai que ce soit plus smooth ». L'ordre etait `btDico`, puis
         les etages 2 et 3, puis le dictionnaire : il s'ouvrait donc
         apres tout le materiel, a plusieurs ecrans du bouton — et sur un
         telephone, on ne voyait rien se passer.

         Les etages passent dessous. Ils ne bougent pas quand le
         dictionnaire est ferme, et quand il s'ouvre ils descendent : on
         voit ce qu'on vient de demander, la ou on a appuye. */
      gNom.appendChild(btDico);
      gNom.appendChild(zoneDico);
      gNom.appendChild(zoneVariantes);
      /* Le panneau peut s'ouvrir sur un exercice DÉJÀ nommé — quand on le
         modifie. Ses variantes doivent être là d'emblée. */
      (function () {
        majFicheOuverte(champNom.value);
        rendreVariantes();
      })();

      btAw.addEventListener('click', function () {
        exo.aw = !exo.aw;
        btAw.setAttribute('aria-pressed', exo.aw ? 'true' : 'false');
      });
      c.appendChild(A.ui.groupe('', btAw,
        'Compté dans le volume AW, à part de la muscu générale.'));

      /* CÔTÉ ET PRISE SONT PARTIS DE CET ÉCRAN le 2026-10-31, demande de MB.

         CE QUE LE CÔTÉ COÛTE, et il a tranché en le sachant :
         `exercicesAyantCharge(seances, structure, cote)` relie une douleur
         DROITE ou GAUCHE aux exercices qui l'ont chargée, et le Suivi
         affiche un jeton de côté. Ce lien ne se posera plus sur les séances
         à venir.

         CE QUI NE CHANGE PAS : les séances passées gardent leur côté et leur
         prise, le Suivi continue de les lire, et le modèle garde les deux
         champs. C'est la SAISIE qui disparaît, pas la donnée — un carnet
         importé d'avant reste entier.

         `rafraichirPrise` est appelée plus haut, dans `prendre()` : elle
         reste définie, et ne fait plus rien. */
      function rafraichirCote() {}
      function rafraichirPrise() {}

      /* ---- LE REPOS, EN MINUTES PUIS EN SECONDES ----

         Retour d'un utilisateur de MB, 29/10 : « le temps de repos en
         seconde est pas hyper adapté, ce serait bien si tu pouvais faire un
         côté où tu choisis les minutes et l'autre les secondes ».

         IL ETAIT TOUT EN BAS, après les muscles et la consigne — après tout
         ce qu'on ne remplit qu'une fois. Le repos, on le change souvent. MB
         l'a placé ici, entre « Prise » et « Type de charge ».

         `exo.reposSecondes` NE CHANGE PAS : la donnée reste des secondes.
         Deux champs qui composent un seul nombre, donc aucune clé neuve et
         rien à ajouter à `normaliser()` — c'est là qu'un banc vert cacherait
         une valeur qui ne survit pas au rechargement.

         LE REPORT SE FAIT AU `change`, PAS A LA FRAPPE. Taper « 90 » dans
         les secondes passe par « 9 », et un champ qui saute sous les doigts
         est hostile. Entre-temps le total est juste quand même : mn × 60 + 90
         vaut le même nombre. On ne recompose l'affichage qu'une fois la
         valeur validée. */
      var reposTotal = exo.reposSecondes == null ? 120 : exo.reposSecondes;
      var champMin = h('input', { class: 'champ', type: 'number', min: '0', step: '1',
                                  inputmode: 'numeric',
                                  value: Math.floor(reposTotal / 60) });
      var champSec = h('input', { class: 'champ', type: 'number', min: '0', max: '59',
                                  step: '5', inputmode: 'numeric',
                                  value: reposTotal % 60 });
      var aideRepos = h('div', { class: 'item-resume' });

      function lireRepos() {
        var mn = parseInt(champMin.value, 10);
        var sc = parseInt(champSec.value, 10);
        if (!isFinite(mn) || mn < 0) mn = 0;
        if (!isFinite(sc) || sc < 0) sc = 0;
        return mn * 60 + sc;
      }
      /* LE TOTAL RESTE LISIBLE : c'est ce que les deux champs enlèvent, et
         c'est ce qui le leur rend. Rien ne devient invisible. */
      function majRepos() {
        exo.reposSecondes = lireRepos();
        aideRepos.textContent = 'Lancé par le ✓ d’une série. Enregistré : '
                              + exo.reposSecondes + ' s.';
      }
      champMin.addEventListener('input', majRepos);
      champSec.addEventListener('input', majRepos);
      /* ET AU `change`, ON RECOMPOSE : 0 min 90 s se réécrit 1 min 30 s. */
      function recomposer() {
        var t = lireRepos();
        champMin.value = Math.floor(t / 60);
        champSec.value = t % 60;
        majRepos();
      }
      champMin.addEventListener('change', recomposer);
      champSec.addEventListener('change', recomposer);
      majRepos();

      var rangeeRepos = h('div', { class: 'rangee' },
        champMin, h('span', { class: 'unite', text: 'min' }),
        champSec, h('span', { class: 'unite', text: 's' }));
      var grRepos = A.ui.groupe('Repos', rangeeRepos);
      grRepos.appendChild(aideRepos);
      c.appendChild(grRepos);

      A.m.TYPES_CHARGE.forEach(function (t) {
        selCharge.appendChild(h('option', { value: t.id, text: t.nom }));
      });
      selCharge.value = exo.typeCharge || 'kg';
      selCharge.addEventListener('change', function () {
        exo.typeCharge = selCharge.value;
        majAideColonnes();
      });
      c.appendChild(A.ui.groupe('Type de charge', selCharge,
        'Seul « Kilos » entre dans le tonnage. Les autres sont comptés en séries.'));

      /* Quelles colonnes la ligne de série affiche. Separe du type de charge :
         celui-ci dit COMMENT lire la charge, celles-la disent CE QU'ON SAISIT.
         Un isometrique n'a que DUREE ; le defaut reste charge + reps. */
      exo.colonnes = A.m.colonnes(exo);
      var boiteColonnes = h('div', { class: 'enrobe' });
      var aideColonnes = h('div', { class: 'item-resume' });

      function majAideColonnes() {
        var cols = A.m.colonnes(exo);
        var bouts = ['Affichées : ' + cols.map(function (id) { return A.m.colonne(id).nom; }).join(' · ') + '.'];
        bouts.push(A.m.peutPeser(exo)
          ? 'Charge × reps en kilos : cet exercice entre dans le tonnage.'
          : 'Pas de tonnage : ' + (A.m.aColonne(exo, 'charge') && A.m.aColonne(exo, 'reps')
              ? 'la charge n’est pas en kilos.'
              : 'sans charge ET reps, il n’y a rien à multiplier.'));
        if (A.m.aColonne(exo, 'duree')) bouts.push('La durée compte en temps sous tension.');
        aideColonnes.textContent = bouts.join(' ');
      }

      var pucesColonnes = [];
      function rafraichirColonnes() {
        pucesColonnes.forEach(function (p) {
          p.bouton.setAttribute('aria-pressed', A.m.aColonne(exo, p.id) ? 'true' : 'false');
        });
        majAideColonnes();
      }

      A.m.COLONNES.forEach(function (col) {
        var b = h('button', { type: 'button', class: 'puce', text: col.nom,
                              'aria-pressed': A.m.aColonne(exo, col.id) ? 'true' : 'false' });
        pucesColonnes.push({ id: col.id, bouton: b });
        b.addEventListener('click', function () {
          var cols = A.m.colonnes(exo);
          var i = cols.indexOf(col.id);
          if (i >= 0) {
            /* Un exercice sans aucune colonne n'aurait plus rien a saisir. */
            if (cols.length === 1) {
              A.ui.toast('Il faut au moins une colonne à saisir.');
              return;
            }
            cols.splice(i, 1);
          } else cols.push(col.id);
          exo.colonnes = A.m.colonnes({ colonnes: cols });
          b.setAttribute('aria-pressed', A.m.aColonne(exo, col.id) ? 'true' : 'false');
          majAideColonnes();
        });
        boiteColonnes.appendChild(b);
      });
      majAideColonnes();
      /* L'aide entre DANS le groupe : posée à côté, elle collait au libellé
         du groupe suivant et semblait lui appartenir. */
      var grColonnes = A.ui.groupe('Colonnes à saisir', boiteColonnes);
      grColonnes.appendChild(aideColonnes);
      c.appendChild(grColonnes);

      var boiteOutils = h('div');
      function rafraichirOutils() {
        A.ui.vider(boiteOutils);
        boiteOutils.appendChild(A.ui.champMulti(exo.outils || [], function (q, deja) {
          /* Zéro = TOUT. L'équipement est un inventaire borné, et une coupe
             à huit en cachait la moitié sans rien dire. La liste défile. */
          return A.m.suggestionsOutils(etat(), q, deja, 0).map(function (o) {
            o.jetons = o.categorie ? [{ texte: o.categorie }] : [];
            return o;
          });
        }, function (v) {
          /* LA CROIX D'UN JETON RETIRE UN OUTIL, elle aussi. Sans ces deux
             lignes, ses muscles restaient cochés : la moitié livrée. */
          var repris = reprendreLesRetires(exo.outils, v);
          exo.outils = v;
          if (repris.length) {
            A.ui.toast('Décoché : '
                     + repris.map(A.m.nomCourtMuscle).join(', ') + '.');
          }
          /* LA LISTE SUIT. Sans cet appel, taper un outil ne le faisait pas
             apparaitre sous « Le mien » : on venait de remplir son
             equipement et rien ne le montrait. Trouve par le controle du
             banc, pas a l'oeil. */
          majEquip();
          rafraichirReglages();
          /* L'outil est la CINQUIEME source de proposition depuis le
             26/10 : sans ce rafraichissement, on tapait « Fat Gripz »
             et le bouton restait a « d'apres le nom (7) » jusqu'a ce
             qu'on retouche le nom. La moitie livree, piege n 5. */
          rafraichirMuscles();
        },
          /* DES EXEMPLES QUI MARCHENT — MB, 27/10 : « deux des trois ne
             sont pas bons ». Mesure : les TROIS etaient muets. « Dumbbell »,
             « poulie haute » et « Titan Grip » ne sont reconnus par rien,
             zero muscle chacun. Les trois d'aujourd'hui proposent 5, 10 et 5
             muscles, et un controle du banc exige qu'ils restent reconnus —
             un exemple qui ne marche pas apprend le contraire de ce qu'il
             montre. */
          'Fat Gripz, Wrist Wrench, Titan Grip Iron Wrist…'));
      }

      /* ---- les réglages de chaque outil ----
         Un même outil ne charge pas pareil selon la façon dont il est monté :
         le mousqueton à l'extérieur de la poignée pousse sur le bord externe
         de la main. Ce n'est ni un autre outil, ni un autre exercice.

         Le groupe N'APPARAÎT QUE si un outil retenu a des réglages déclarés
         au catalogue. Montrer une rangée vide à tous ceux qui n'en ont pas
         serait une case de plus à ignorer. */
      var boiteReglages = h('div');
      var grReglages = A.ui.groupe('Réglage de l’outil', boiteReglages);
      /* ---- POSER UN REGLAGE SANS QUITTER L'EXERCICE ----

         MB, 28/10 : « si un des equipements selectionnes a des
         specificites a selectionner par la suite, je dois pouvoir le
         rajouter dans l'exo directement, ce qui n'est pas le cas ».

         C'etait exact, et la ligne le disait elle-meme : « Declare-les sur
         l'outil, dans Reglages -> Equipement ». Une impasse polie — il
         fallait fermer l'exercice, traverser deux ecrans, et revenir.

         L'outil est CREE s'il ne l'est pas encore : on ne peut pas poser un
         reglage sur un nom que le catalogue ignore, et le demander serait
         le meme formulaire de trop qu'on vient de retirer. */
      function boutonReglage(nomOutil) {
        var bt = h('button', { type: 'button', class: 'bt bt-petit',
                               style: 'margin-top:6px',
                               text: '+ Réglage pour « ' + nomOutil + ' »' });
        bt.addEventListener('click', function () {
          var o = A.m.trouverOutil(etat(), A.m.slug(nomOutil));
          if (!o) {
            o = A.m.majCatalogueOutils(etat(), nomOutil, '');
            A.store.sauver(true);
          }
          A.vues.reglages.editerOutil(o, function () {
            rafraichirReglages();
            rafraichirMuscles();
            majEquip();
          });
        });
        return bt;
      }

      function rafraichirReglages() {
        A.ui.vider(boiteReglages);
        /* Le groupe se montre dès qu'il y a UN outil, même si aucun n'a de
           réglage. La version d'avant se cachait en silence, et on ne
           pouvait pas distinguer « cet outil n'a pas de réglage » de « la
           fonction ne marche pas » — c'est exactement la question qui est
           remontée du téléphone. Une ligne grise coûte moins qu'un
           aller-retour. */
        var aucunOutil = !(exo.outils || []).length;
        (exo.outils || []).forEach(function (nomOutil) {
          var l = A.m.reglagesOutil(etat(), nomOutil);
          /* CE QUE LE TYPE PROPOSE compte autant que ce qui est declare.
             Un Iron Wrist a trois positions de mousqueton, le carnet le
             sait depuis le 27/10, et l'ecran l'ignorait. */
          var suggeres = A.m.reglagesProposes(etat(), nomOutil);
          boiteReglages.appendChild(h('div', { class: 'item-resume',
                                               style: 'margin-top:6px', text: nomOutil }));
          /* UNE POSITION SUGGEREE SE POSE EN UN APPUI. Elle est DECLAREE
             sur l'outil au passage, sans formulaire : au prochain exercice
             c'est un reglage ordinaire, et ses muscles s'y ajoutent depuis
             la fiche quand MB le voudra. */
          function poserSuggere(nom) {
            /* MEME REGLE QUE `poser` : poser une suggestion REMPLACE le
               reglage courant, donc elle en reprend les muscles. Sans ces
               deux lignes, passer de « Centre » a « Exterieur » par la puce
               suggeree cumulait les deux. */
            var avant = A.m.reglageDe(exo, nomOutil);
            var repris = (avant && A.m.slug(avant) !== A.m.slug(nom))
                       ? reprendreReglage(nomOutil, avant) : [];
            /* IL EMPORTE LES MUSCLES DE SA FAMILLE, quand elle est connue.
               Monter le Kegel sur un Multi-Tool donne les muscles du cone,
               sans rien a saisir — c'est tout l'interet. Un accessoire que
               le fabricant ne decrit pas rend [], et c'est la reponse
               juste : « Wrist Pro » et « Multi Hand Grip » n'ont AUCUNE
               description sur titangrip.de, les deux fiches ouvertes. */
            var mus = A.m.musclesDuReglagePropose
                    ? A.m.musclesDuReglagePropose(nomOutil, nom) : [];
            A.m.majReglageOutil(etat(), nomOutil, nom, mus);
            A.m.poserReglage(exo, nomOutil, nom);
            /* `neufs` est DECLARE ICI et non dans le `if` : il est lu plus
               bas pour composer le message, et un `var` interne au bloc
               rendrait `undefined` quand l'accessoire ne porte aucun muscle
               — ce qui est le cas de « Wrist Pro » et « Multi Hand Grip ». */
            var neufs = [];
            if (mus.length) {
              var fusion = A.m.muscles(exo).slice();
              mus.forEach(function (id) {
                if (fusion.indexOf(id) < 0) { fusion.push(id); neufs.push(id); }
              });
              exo.muscles = A.m.muscles({ muscles: fusion });
              noterPose(nomOutil, nom, neufs);
            }
            var dits = [];
            if (neufs.length) dits.push('Coché : ' + neufs.map(A.m.nomCourtMuscle).join(', '));
            if (repris.length) dits.push('décoché : ' + repris.map(A.m.nomCourtMuscle).join(', '));
            if (dits.length) A.ui.toast(dits.join(' · ') + ' — « ' + nom + ' »');
            A.store.sauver(true);
            rafraichirReglages();
            rafraichirMuscles();
            majAideMuscles();
          }

          if (!l.length && suggeres.length) {
            boiteReglages.appendChild(h('div', { class: 'item-resume',
              style: 'margin:-2px 0 0;opacity:.8',
              /* « POSITIONS » ETAIT FAUX pour un Multi-Tool : ses reglages
                 sont des ACCESSOIRES qu'on monte, pas des trous. Un mot
                 neutre couvre les deux sans mentir sur aucun. */
              text: 'Le carnet reconnaît cet équipement et lui connaît '
                  + 'ceux-ci. Touche-en un : il s’applique à l’exercice et '
                  + 'devient le tien.' }));
            var rangeeS = h('div', { class: 'puces' });
            suggeres.forEach(function (nom) {
              var b = h('button', { type: 'button', class: 'puce', text: nom,
                                    'aria-pressed': 'false' });
              b.addEventListener('click', function () { poserSuggere(nom); });
              rangeeS.appendChild(b);
            });
            boiteReglages.appendChild(rangeeS);
            /* PAS DE BOUTON ICI : les positions sont sous les doigts. */
            return;
          }

          if (!l.length) {
            /* La panne silencieuse de ce dessin : les réglages sont rangés
               par nom d'outil, donc « Titan Grip … 60 mm » et « …60mm » sont
               deux outils. L'app ne les fusionne pas — renommer du matériel
               dans le dos de qui l'a saisi serait pire — mais elle le DIT. */
            var proche = A.m.outilProche(etat(), nomOutil);
            boiteReglages.appendChild(h('div', { class: 'item-resume',
              style: 'margin:-2px 0 0;opacity:.8',
              text: proche
                ? 'Pas de réglage — mais « ' + proche.nom + ' » en a. '
                  + 'Deux outils très proches dans ton équipement : c’est celui-là '
                  + 'que tu voulais ?'
                : 'Pas encore de réglage.' }));
            /* LE SEUL CAS OU LE BOUTON RESTE : le carnet ne connait rien a
               cet outil, et il n'a aucun reglage. Sans lui, il n'y aurait
               aucun chemin. */
            boiteReglages.appendChild(boutonReglage(nomOutil));
            return;
          }
          var rangee = h('div', { class: 'puces' });
          var puces = [];
          function majPuces() {
            var actuel = A.m.reglageDe(exo, nomOutil);
            puces.forEach(function (p) {
              p.bouton.setAttribute('aria-pressed',
                (p.nom === actuel || (!p.nom && !actuel)) ? 'true' : 'false');
            });
          }
          function poser(nom) {
            /* ON REPREND L'ANCIEN AVANT DE POSER LE NEUF.

               MB, 28/10 : « tout devrait se decocher quand je clique sur
               aucun ». La regle du 26/10 disait le contraire — « changer de
               reglage ne retire pas » — par crainte d'effacer ce qu'un
               autre reglage avait pose. La crainte etait juste, la
               conclusion non : `encoreRevendique` regarde, et ne retire que
               ce que plus personne ne reclame.

               Re-appuyer sur le reglage DEJA pose ne reprend rien : ce
               n'est pas un changement, et le decocher puis le recocher
               ferait clignoter un toast pour rien. */
            var avant = A.m.reglageDe(exo, nomOutil);
            var repris = [];
            if (avant && A.m.slug(avant) !== A.m.slug(nom || '')) {
              repris = reprendreReglage(nomOutil, avant);
            }
            A.m.poserReglage(exo, nomOutil, nom);
            var choisi = null;
            l.forEach(function (r) { if (r.nom === nom) choisi = r; });
            var ajoutes = [];
            if (choisi && (choisi.muscles || []).length) {
              var fusion = A.m.muscles(exo).slice();
              choisi.muscles.forEach(function (id) {
                if (fusion.indexOf(id) < 0) { fusion.push(id); ajoutes.push(id); }
              });
              exo.muscles = A.m.muscles({ muscles: fusion });
              noterPose(nomOutil, nom, ajoutes);
            }
            if (ajoutes.length || repris.length) rafraichirMuscles();
            majPuces();
            majAideMuscles();
            /* UN SEUL MESSAGE, QUI DIT LES DEUX SENS. Deux toasts coup sur
               coup se chassent l'un l'autre, et c'est le premier — ce qui
               part — qu'on perdrait. */
            var dits = [];
            if (ajoutes.length) {
              dits.push('Coché : ' + ajoutes.map(A.m.nomCourtMuscle).join(', '));
            }
            if (repris.length) {
              dits.push('décoché : ' + repris.map(A.m.nomCourtMuscle).join(', '));
            }
            if (dits.length) {
              A.ui.toast(dits.join(' · ') + (nom ? ' — « ' + nom + ' »' : '.'));
            }
          }
          [{ nom: null, texte: 'Aucun' }].concat(l.map(function (r) {
            return { nom: r.nom, texte: r.nom };
          })).forEach(function (o) {
            var b = h('button', { type: 'button', class: 'puce', text: o.texte });
            b.addEventListener('click', function () { poser(o.nom); });
            puces.push({ nom: o.nom, bouton: b });
            rangee.appendChild(b);
          });
          /* LES SUGGESTIONS QUI RESTENT se posent au bout de la rangee :
             MB a declare « Centre », le carnet sait qu'il existe aussi
             « Exterieur » et « Interieur », et les lui cacher l'obligerait
             a les retaper. */
          suggeres.forEach(function (nom) {
            var bs = h('button', { type: 'button', class: 'puce puce-suggeree',
                                   text: nom, 'aria-pressed': 'false',
                                   title: 'Position connue de cet équipement' });
            bs.addEventListener('click', function () { poserSuggere(nom); });
            rangee.appendChild(bs);
          });
          majPuces();
          boiteReglages.appendChild(rangee);

          /* ---- ET LE TROU DU CADRE, SUR LE MEME REGLAGE ----

             MB, 28/10 : « Les deux ensemble ». Le cadre Golden Grip porte
             SIX accessoires et CINQ trous, et `poserReglage` n'a qu'une
             case par outil. On demande donc les deux dimensions l'une
             APRES l'autre et on compose le nom : six puces, puis cinq.
             Jamais trente.

             CETTE RANGEE N'EXISTE QUE SI LE REGLAGE POSE A DES TROUS : un
             mousqueton d'Iron Wrist n'en a pas, et rien ne s'affiche. Elle
             ne remplace pas la rangee du dessus — `positionsProposees` lit
             la BASE, donc on change de trou sans défaire l'accessoire. */
          var poseActuel = A.m.reglageDe(exo, nomOutil);
          var trous = (poseActuel && A.m.positionsProposees)
                    ? A.m.positionsProposees(nomOutil, poseActuel) : [];
          if (trous.length) {
            var base = A.m.baseDuReglage(poseActuel);
            var trouPose = A.m.positionDuReglage(poseActuel);
            var rgPose = A.m.trouverReglage(etat(), nomOutil, poseActuel);

            /* LE FABRICANT DIT POURQUOI, JAMAIS LEQUEL. « 5 holes in the
               frame to allow you to focus on different fingers » — et
               aucune source ne dit quel trou charge quel doigt. Le trou ne
               coche donc aucun muscle, et l'écran le dit au lieu de le
               laisser deviner. */
            boiteReglages.appendChild(h('div', { class: 'item-resume',
              style: 'margin:6px 0 0;opacity:.8',
              text: 'Dans quel trou du cadre « ' + base + ' » est vissé. '
                  + 'Le fabricant dit que les cinq trous servent à viser '
                  + 'd’autres doigts, jamais lequel : le trou ne coche '
                  + 'aucun muscle, il distingue deux séances.' }));

            var rangeeT = h('div', { class: 'puces' });
            function poserTrou(trou) {
              var neuf = A.m.composerReglage(base, trou);
              if (!neuf || A.m.slug(neuf) === A.m.slug(poseActuel || '')) return;
              /* LA TRACE DEMENAGE AVEC LE NOM. Sans ces lignes, renommer le
                 réglage orphelinait `poseParReglage` : « Aucun » n'aurait
                 plus rien décoché — un geste sans inverse, exactement le
                 défaut que MB a signalé le 28/10 par l'autre porte. */
              var cAvant = clefPose(nomOutil, poseActuel);
              var cApres = clefPose(nomOutil, neuf);
              if (poseParReglage[cAvant] && cAvant !== cApres) {
                poseParReglage[cApres] = poseParReglage[cAvant];
                delete poseParReglage[cAvant];
              }
              /* `null` EN MUSCLES : le renommage ne touche pas à ce que
                 l'accessoire avait posé. Passer [] les effacerait. */
              A.m.majReglageOutil(etat(), nomOutil, neuf, null,
                                  rgPose ? rgPose.id : null);
              A.m.poserReglage(exo, nomOutil, neuf);
              A.store.sauver(true);
              A.ui.toast('« ' + neuf + ' »');
              rafraichirReglages();
              rafraichirMuscles();
              majAideMuscles();
            }
            [{ t: null, texte: 'Aucun trou' }].concat(trous.map(function (t) {
              return { t: t, texte: t };
            })).forEach(function (o) {
              var bt = h('button', { type: 'button', class: 'puce',
                text: o.texte,
                'aria-pressed': ((o.t || null) === (trouPose || null))
                                ? 'true' : 'false' });
              bt.addEventListener('click', function () { poserTrou(o.t); });
              rangeeT.appendChild(bt);
            });
            boiteReglages.appendChild(rangeeT);
          }
          /* PLUS DE BOUTON QUAND IL Y A DEJA DES PUCES — MB, 28/10 :
             « enleve presque le "+ Reglage pour ..." ». Les reglages
             declares et les suggestions restantes sont tous dans la rangee
             ci-dessus ; un bouton de plus ne menait qu'a retaper ce qui est
             deja la. Pour un reglage VRAIMENT nouveau, la fiche de l'outil
             dans Reglages reste le chemin. */
        });
        grReglages.hidden = aucunOutil;
      }

      rafraichirOutils();
      rafraichirReglages();
      /* « Equipements », et non « Outils » — MB, 27/10. Le reste de l'app
         dit deja « mon equipement » : deux mots pour la meme chose se
         paient en hesitation a chaque ouverture de fiche. */
      var grOutils = A.ui.groupe('Équipements', boiteOutils);

      /* Taper marche quand on connaît le nom. Passé une vingtaine d'outils,
         il faut pouvoir ouvrir son équipement et en cocher plusieurs. */
      /* ---- L'AFFICHAGE C, choisi par MB le 27/10 apres avoir clique les
         trois simulations : « une seule liste, mon materiel en haut, les
         marques repliees dessous », puis « avec la possibilite de replier
         les miens aussi, TOUT EST REPLIE A LA BASE ».

         Tout replie, c'est ce qui rend la chose tenable : la fiche
         d'exercice est deja longue, et le releve des marques ne doit pas se
         mettre en travers de qui ne le cherche pas. Chaque section se
         remplit a l'OUVERTURE, pas avant — 56 references construites pour
         rien a chaque ouverture de fiche seraient payees par tout le monde.

         ET RIEN NE S'AJOUTE TOUT SEUL : une reference de marque ouvre la
         fiche de l'outil avec son nom ecrit, et c'est l'enregistrement qui
         pose. Le parcours ne pose jamais. */
      var aideOutils = h('div', { class: 'item-resume', style: 'margin-top:7px' });
      var boiteC = h('div', { style: 'margin-top:7px' });

      /* CE QUE CHAQUE OUTIL A POSE, ET LUI SEUL.

         MB, 28/10 : « si je deselectionne un outil, les muscles impactes
         restent coches ». Exact, et c'est devenu un defaut le jour ou poser
         un reglage s'est mis a COCHER ses muscles : un geste sans inverse.

         LES MOUVEMENTS ONT CETTE TRACE DEPUIS LE 26/10 et s'en servent
         pour retirer ce qu'ils avaient pose. Les outils ne l'avaient pas.
         Meme regle ici : on ne retire que ce que CET outil a ajoute —
         jamais un muscle coche a la main, jamais un muscle qu'un mouvement
         ou un autre outil avait deja pose, puisqu'il n'etait pas dans
         `neufs`. */
      var poseParReglage = {};

      /* « outil|reglage ». Un outil sans reglage a la clé « outil| ». */
      function clefPose(nomOutil, nomReglage) {
        return A.m.slug(nomOutil) + '|' + A.m.slug(nomReglage || '');
      }

      function noterPose(nomOutil, nomReglage, ajoutes) {
        var c = clefPose(nomOutil, nomReglage);
        poseParReglage[c] = (poseParReglage[c] || []).concat(ajoutes);
      }

      /* LA GARDE QUI MANQUAIT AU RAISONNEMENT DU 26/10. Il disait : « deux
         réglages peuvent partager un muscle, et un retrait effacerait ce
         qu'un autre avait posé », et il en concluait qu'il ne fallait rien
         retirer. La crainte était fondée ; la conclusion, non. Il suffit
         de REGARDER qui revendique encore le muscle.

         La clé du réglage qu'on retire est supprimée AVANT l'appel : ce
         qui reste ici, ce sont les autres. */
      function encoreRevendique(id) {
        var cles = Object.keys(poseParReglage), i;
        for (i = 0; i < cles.length; i++) {
          if (poseParReglage[cles[i]].indexOf(id) >= 0) return true;
        }
        return false;
      }

      /* Rend ce qui a VRAIMENT ete decoche, pour que l'appelant le DISE. */
      function retirerMuscles(ids) {
        var vraiment = ids.filter(function (id) { return !encoreRevendique(id); });
        if (!vraiment.length) return [];
        exo.muscles = A.m.muscles(exo).filter(function (id) {
          return vraiment.indexOf(id) < 0;
        });
        return vraiment;
      }

      /* CE QU'UN SEUL REGLAGE A POSE. MB : « tout devrait se decocher quand
         je clique sur aucun ». */
      function reprendreReglage(nomOutil, nomReglage) {
        var c = clefPose(nomOutil, nomReglage);
        var ids = poseParReglage[c] || [];
        delete poseParReglage[c];
        return retirerMuscles(ids);
      }

      /* RETIRER UN OUTIL LUI REPREND CE QU'IL AVAIT POSE, et rien d'autre.

         DEUX CHEMINS MENENT ICI, et c'est pour ca que c'est une fonction :
         la puce de « Mon equipement » (`basculerOutil`) et la croix du
         jeton dans le champ (`champMulti`). J'avais d'abord traite le
         premier seulement ; le second laissait les muscles coches — le
         defaut meme que MB signalait, par l'autre porte.

         Rend la liste reprise, pour que l'appelant le DISE. */
      function reprendreOutil(nom) {
        /* TOUT CE QUI A ETE POSE SOUS CET OUTIL, accessoires compris :
           retirer le Multi-Tool doit reprendre ce que le Kegel avait posé
           en étant monté dessus. D'où le préfixe plutôt qu'une clé. */
        var pref = A.m.slug(nom) + '|';
        var ids = [];
        Object.keys(poseParReglage).forEach(function (c) {
          if (c.indexOf(pref) !== 0) return;
          ids = ids.concat(poseParReglage[c]);
          delete poseParReglage[c];
        });
        /* Le reglage pose sur cet outil s'en va avec lui : garder
           « Mousqueton a l'exterieur » sur un outil qu'on vient d'enlever
           n'a aucun sens. */
        A.m.poserReglage(exo, nom, null);
        return retirerMuscles(ids);
      }

      /* Ce que le champ a jetons vient de retirer, compare a l'etat d'avant. */
      function reprendreLesRetires(avant, apres) {
        var vus = {}, repris = [];
        (apres || []).forEach(function (n) { vus[A.m.slug(n)] = 1; });
        (avant || []).forEach(function (n) {
          if (!vus[A.m.slug(n)]) repris = repris.concat(reprendreOutil(n));
        });
        return repris;
      }

      function basculerOutil(nom) {
        var l = (exo.outils || []).slice();
        var i = -1, k;
        for (k = 0; k < l.length; k++) {
          if (A.m.slug(l[k]) === A.m.slug(nom)) i = k;
        }
        var retire = i >= 0;
        if (retire) l.splice(i, 1); else l.push(nom);
        exo.outils = l;

        if (retire) {
          var aRetirer = reprendreOutil(nom);
          if (aRetirer.length) {
            A.ui.toast('Décoché : '
                     + aRetirer.map(A.m.nomCourtMuscle).join(', ') + '.');
          }
        }
        rafraichirOutils();
        rafraichirReglages();
        rafraichirMuscles();
        majEquip();
      }
      /* ---- APRES UN CHOIX : REPLIER, ET REVENIR A LA CASE ----

         MB, 28/10 : « si j'ai beaucoup scrolle, je ne vois que les
         equipements et c'est pas top visuellement, il faudrait revenir
         dans la case equipement quand j'ai clique sur quelque chose, voir
         reduire la categorie ou j'ai clique ? » Trois maquettes cliquables
         lui ont ete montrees ; il a pris celle-la.

         CE QUE LA MESURE A DIT, et qui a reduit le choix de trois a deux :
         « replier sans remonter » n'existe pas. Replier Titangrip, qui
         porte seize produits, raccourcit la page SOUS la position de
         defilement, et le navigateur ramene tout seul en haut — 592 px -> 0
         dans les deux maquettes. On remonte donc explicitement, plutot que
         de laisser le hasard d'une longueur decider ou on atterrit.

         SEULEMENT A L'AJOUT. Decocher depuis la liste n'est pas un geste de
         fin : on est en train de corriger, on ne veut pas etre renvoye
         ailleurs.

         CE QUE CA COUTE, ET C'EST ASSUME : un produit par ouverture. Pour
         en prendre trois dans la meme marque, il faut la rouvrir trois
         fois. C'est le prix que MB a choisi en voyant les deux. */
      /* UN TIMER, PAS `requestAnimationFrame`.

         Le banc l'a dit : rAF ne se declenche PAS dans une trame qui n'est
         pas peinte, et le retour a la case ne se faisait jamais la-bas
         (jeton a 626 px du haut au lieu du haut). Sur un telephone ou le
         panneau est visible, ca marchait — c'est exactement le genre de
         dependance qui tient par chance.

         Un `setTimeout(0)` suffit : il passe apres la repeinte de la liste,
         et `getBoundingClientRect` force la mise en page de toute facon. */
      function apresRepeinte(f) { setTimeout(f, 0); }

      function choisirDepuis(cle, nom) {
        var ajout = !porte(nom);
        if (ajout) ouverts[cle] = false;
        basculerOutil(nom);
        /* ON POSE LA POSITION, ON NE LA DEMANDE PAS.

           `scrollIntoView` n'a RIEN fait ici, deux essais de suite : la
           case restait 1 237 px au-dessus de l'ecran. Le conteneur est
           `.panneau-corps`, et le seul deplacement observe venait du
           raccourcissement de la page — pas de l'appel. Plutot que de
           chercher pourquoi l'API se tait, on calcule `scrollTop` : c'est
           deterministe, et ca se mesure.

           ET SUR LA TRAME SUIVANTE : `basculerOutil` repeint, replier seize
           produits raccourcit la page, et une position calculee avant la
           repeinte vise ce qui n'existe plus. */
        if (ajout && grOutils) {
          apresRepeinte(function () {
            var boite = grOutils.parentNode;
            while (boite && boite !== document.body
                   && boite.scrollHeight <= boite.clientHeight + 4) {
              boite = boite.parentNode;
            }
            if (!boite || boite === document.body) return;
            /* DELTA DE RECTANGLES, et non somme d'`offsetTop` : la chaine
               des `offsetParent` saute tout parent non positionne, et le
               libelle du groupe se retrouvait rogne en haut de l'ecran.
               Deux rectangles et une soustraction ne sautent rien. */
            var rg = grOutils.getBoundingClientRect();
            var rb = boite.getBoundingClientRect();
            boite.scrollTop = Math.max(0, boite.scrollTop + (rg.top - rb.top) - 10);
          });
        }
      }

      function porte(nom) {
        return (exo.outils || []).some(function (x) {
          return A.m.slug(x) === A.m.slug(nom);
        });
      }

      /* Une section repliee qui ne se construit qu'a l'ouverture. */
      var ouverts = {};
      function section(cle, titre, combien, remplir) {
        var tete = h('button', { type: 'button', class: 'equip-cat',
                                 'aria-expanded': ouverts[cle] ? 'true' : 'false' },
          h('b', { text: titre }),
          h('span', { text: String(combien) }));
        var corps = h('div', { style: 'padding-left:6px' });
        corps.hidden = !ouverts[cle];
        function peindre() {
          A.ui.vider(corps);
          if (ouverts[cle]) remplir(corps);
        }
        peindre();
        tete.addEventListener('click', function () {
          ouverts[cle] = !ouverts[cle];
          tete.setAttribute('aria-expanded', ouverts[cle] ? 'true' : 'false');
          corps.hidden = !ouverts[cle];
          peindre();
        });
        boiteC.appendChild(tete);
        boiteC.appendChild(corps);
      }

      function lignePorte(nom, droite, f) {
        var b = h('button', { type: 'button', class: 'item-ligne item-bouton' },
          h('b', { text: nom }), h('span', { text: droite }));
        b.addEventListener('click', f);
        return b;
      }

      function majEquip() {
        A.ui.vider(boiteC);
        /* LE CATALOGUE *ET* CE QUE L'EXERCICE PORTE DEJA. Un outil tape a
           l'instant n'entre au catalogue qu'a l'enregistrement : sans
           l'union, on venait de l'ajouter et « Le mien » restait vide, ou
           pire, absent. Le controle du banc l'a dit. */
        var vus = {}, mien = [];
        (etat().outils || []).forEach(function (o) {
          vus[A.m.slug(o.nom)] = 1;
          mien.push(o.nom);
        });
        (exo.outils || []).forEach(function (nom) {
          if (vus[A.m.slug(nom)]) return;
          vus[A.m.slug(nom)] = 1;
          mien.push(nom);
        });
        aideOutils.textContent = mien.length
          ? 'Tape le nom puis Entrée, ou déplie une section. Un outil tapé '
          + 'ici entre aussi dans ton équipement.'
          : 'Tape le nom de l’outil, puis Entrée. Ton équipement est encore '
          + 'vide : ce que tu ajoutes ici y entre aussi.';

        if (mien.length) {
          section('mien', 'Le mien', mien.length, function (corps) {
            mien.forEach(function (nom) {
              corps.appendChild(lignePorte(nom, porte(nom) ? 'coché' : 'ajouter',
                function () { choisirDepuis('mien', nom); }));
            });
            /* LE CHOIX MULTIPLE RESTE ATTEIGNABLE au-dela d'une poignee
               d'outils : cocher trente lignes une par une n'est pas un
               geste. En dessous, il couterait un aller-retour pour rien. */
            if (mien.length > 8) {
              corps.appendChild(lignePorte('Cocher plusieurs d’un coup',
                mien.length + ' outils', function () {
                  choisirOutils(etat(), exo.outils || [], function (liste) {
                    exo.outils = liste;
                    rafraichirOutils();
                    rafraichirReglages();
                    rafraichirMuscles();
                    majEquip();
                  });
                }));
            }
          });
        }

        A.m.marquesConnues().forEach(function (mq) {
          var familles = A.m.produitsDeLaMarque(mq);
          var combien = familles.reduce(function (n, f) {
            return n + f.produits.length;
          }, 0);
          section('m:' + mq, mq, combien, function (corps) {
            familles.forEach(function (f) {
              corps.appendChild(h('div', { class: 'item-resume',
                                           text: A.m.nomDuType(f.cle) }));
              f.produits.forEach(function (nom) {
                var connu = !!A.m.trouverOutil(etat(), A.m.slug(nom));
                var nm = A.m.musclesDeLOutil([nom]).length;
                corps.appendChild(lignePorte(nom,
                  porte(nom) ? 'coché'
                             : connu ? 'chez toi'
                                     : (nm ? nm + ' muscle(s)' : 'nom libre'),
                  function () {
                    /* PRENDRE UN PRODUIT L'ATTACHE, POINT.

                       MB, 28/10 : « quand je clique sur un équipement déjà
                       rentré >> Titan Grip, après sélection, il me propose
                       de l'enregistrer… Il est déjà enregistré, pourquoi le
                       refaire ?? »

                       MESURE : `connu` compare par SLUG EXACT. Son
                       « Titan Grip » et le produit « Titan Grip Iron
                       Wrist » sont deux slugs — le carnet le croyait donc
                       neuf et ouvrait la fiche de création. Un formulaire
                       pour un nom que le carnet connaît déjà par cœur.

                       L'inscription au catalogue se fait en silence : c'est
                       un effet de bord du geste, pas une décision à prendre.
                       La fiche reste atteignable par Réglages, et le bouton
                       « + Réglage » ci-dessous l'ouvre sans quitter l'exo. */
                    if (!A.m.trouverOutil(etat(), A.m.slug(nom))) {
                      A.m.majCatalogueOutils(etat(), nom, '');
                      A.store.sauver(true);
                    }
                    choisirDepuis('m:' + mq, nom);
                  }));
              });
            });
          });
        });
      }
      majEquip();

      grOutils.appendChild(aideOutils);
      grOutils.appendChild(boiteC);
      c.appendChild(grOutils);
      c.appendChild(grReglages);

      var boiteForces = h('div');
      var surChangementForces = null;
      /* Ce que CHAQUE mouvement a posé, et lui seul. Décocher doit retirer ce
         que ce mouvement avait coché — et rien d'autre : un muscle coché à la
         main, ou déjà posé par un autre mouvement, n'est pas à lui.
         `neufs` ne contient que ce qui n'y était pas : c'est exactement la
         provenance dont on a besoin, et elle ne coûte rien à tenir. */
      var posePar = {};
      function rafraichirForces() {
        A.ui.vider(boiteForces);
        selForces = A.ui.selecteurForces(exo.forces || [], function (v, quoi, coche) {
          exo.forces = v;
          /* Cocher un mouvement COCHE ses muscles, directement — c'est le
             geste, et il n'y en a pas besoin d'un second. Le décocher
             retire CE QUE CE MOUVEMENT AVAIT POSÉ, et rien d'autre : ce
             qu'un autre avait déjà posé n'était pas dans `neufs`.

             CE COMMENTAIRE DISAIT L'INVERSE jusqu'au 28/10 — « le décocher
             ne les retire pas » — alors que la branche d'en dessous les
             retire depuis le 26/10, et que l'aide du groupe dit « le
             décocher les retire ». Un commentaire faux coûte plus cher
             qu'aucun commentaire.

             La source est dite dans le message, parce qu'elle n'est pas la
             même pour tous : cupping, pronation et supination sont des
             actions articulaires ; rising, back et side pressure viennent
             d'une seule étude EMG et restent à vérifier. */
          var pm = A.m.MUSCLES_PAR_MOUVEMENT[quoi];
          if (pm && coche) {
            var fusion = A.m.muscles(exo).slice();
            var neufs = [];
            pm.muscles.forEach(function (id) {
              if (fusion.indexOf(id) < 0) { fusion.push(id); neufs.push(id); }
            });
            posePar[quoi] = neufs;
            exo.muscles = A.m.muscles({ muscles: fusion });
            rafraichirMuscles();
            if (neufs.length) {
              /* La source est NOMMÉE. « À vérifier » tout court ne dit pas
                 qui l'affirme, donc ne se vérifie pas : c'est un avis qu'on
                 ne peut pas contredire. Ici on nomme, et on dit toujours
                 que ça se corrige en dessous. */
              A.ui.toast(neufs.map(A.m.nomCourtMuscle).join(', ')
                + (pm.dit ? ' — d’après ' + pm.dit + '.'
                          : ' — d’après l’anatomie.')
                + ' Corrige en dessous si besoin.');
            }
          } else if (pm && !coche) {
            /* Décocher retire ce que CE mouvement avait posé. Pas les muscles
               cochés à la main, pas ceux qu'un autre mouvement avait déjà
               posés : ils n'étaient pas dans `neufs`. */
            var aRetirer = posePar[quoi] || [];
            delete posePar[quoi];
            if (aRetirer.length) {
              exo.muscles = A.m.muscles(exo).filter(function (id) {
                return aRetirer.indexOf(id) < 0;
              });
              rafraichirMuscles();
              A.ui.toast('Décoché : ' + aRetirer.map(A.m.nomCourtMuscle).join(', ') + '.');
            }
          }
          if (surChangementForces) surChangementForces();
        });
        boiteForces.appendChild(selForces);
      }
      rafraichirForces();
      c.appendChild(A.ui.groupe('Mouvements', boiteForces,
        'Cocher un mouvement coche les muscles qu’il fait travailler ; le '
      + 'décocher les retire. Ceux que tu as cochés toi-même restent.'));

      /* ---- les muscles, proposés depuis les mouvements ----
         On ne peut pas demander de cocher vingt-deux muscles à qui ne connaît pas
         les termes : la case resterait vide, et la carte aussi. Les
         mouvements déjà cochés proposent donc une première liste, et on dit
         D'OÙ elle vient — du manuel d'anatomie pour les trois mouvements qui
         sont des actions articulaires, d'une seule étude EMG pour les trois
         autres. Rien n'est écrit sans un geste. */
      exo.muscles = A.m.muscles(exo);
      var boiteMuscles = h('div');
      var aideMuscles = h('div', { class: 'item-resume' });
      var btProposer = h('button', { type: 'button', class: 'bt',
                                     style: 'margin-top:7px;width:100%' });
      /* VERSER CE NOM AU DICTIONNAIRE. Il porte le nom et les muscles, rien
         d'autre — le contrat des fiches livrées, tenu à l'identique. */
      /* UNE CLASSE, et non pas son texte, pour qu'on puisse le designer.
         Le banc le cherchait par le mot « dictionnaire » et attrapait la
         LIGNE D'AUTOCOMPLETION, qui porte le jeton « mon dictionnaire » :
         deux controles mesuraient alors un element qui n'etait pas celui-la. */
      /* IL NE S'APPELLE PLUS `btDico`, ET C'EST UN CORRECTIF. 10/11.

         Ce nom etait DEJA pris, 1 400 lignes plus haut, par le bouton
         « Parcourir le dictionnaire ». Meme fonction, meme portee : le
         `var` d'ici hoistait et gagnait partout, donc `libelleDico()`
         ecrivait « Masquer le dictionnaire » sur CE bouton-ci — cache
         la plupart du temps — pendant que le vrai gardait « Parcourir ▾ »
         dictionnaire ouvert.

         Trouve en comptant les boutons RENDUS, pas en relisant le
         fichier : ni l'une ni l'autre declaration n'est fausse a sa
         place, c'est leur coexistence qui l'est.

         Le nom dit maintenant ce qu'il fait : il AJOUTE une fiche. */
      var btAjoutDico = h('button', { type: 'button', class: 'bt bt-dico',
                                 style: 'margin-top:7px;width:100%' });

      function majAideMuscles() {
        var l = A.m.muscles(exo);
        var bouts = [];
        if (!l.length) {
          bouts.push('Aucun muscle renseigné : cet exercice n’apparaîtra pas sur la carte.');
        } else {
          var med = l.filter(function (id) { return (A.m.muscle(id) || {}).medial; })
                     .map(A.m.nomMuscle);
          var lat = l.filter(function (id) { return (A.m.muscle(id) || {}).lateral; })
                     .map(A.m.nomMuscle);
          bouts.push(l.length + ' muscle' + (l.length > 1 ? 's' : '') + '.');
          /* L'insertion est une information d'anatomie, dite une fois et sans
             insistance : on ne rappelle pas une blessure à chaque fiche. */
          if (med.length) bouts.push('Insertion médiale : ' + med.join(', ') + '.');
          if (lat.length) bouts.push('Insertion latérale : ' + lat.join(', ') + '.');
        }
        aideMuscles.textContent = bouts.join(' ');

        var prop = A.m.musclesProposes(exo.forces || [], exo.prise, champNom.value,
                                       A.m.musclesDesReglages(etat(), exo),
                                       exo.outils || []);
        var manquants = prop.muscles.filter(function (id) { return l.indexOf(id) < 0; });
        btProposer.disabled = !manquants.length;
        /* Le bouton dit D'OÙ vient la proposition. Annoncer « d'après les
           mouvements » alors qu'on lit le nom serait une petite malhonnêteté,
           et c'est exactement ce que le reste de l'app refuse. */
        var depuis = { nom: 'le nom', anatomie: 'l’anatomie',
                       a_verifier: 'les mouvements', terrain: 'les compétiteurs',
                       reglage: 'le réglage de l’outil', outil: 'l’outil',
                       mixte: 'ce qui est renseigné' };
        btProposer.textContent = !prop.muscles.length
          ? 'Rien à proposer : donne un nom, ou coche un mouvement'
          : (manquants.length
              ? 'Proposer d’après ' + (depuis[prop.source] || 'ce qui est renseigné')
                + ' (' + manquants.length + ')'
              : 'Proposition déjà appliquée');

        majBtDico(l);
      }

      /* TROIS ÉTATS, ET JAMAIS UN BOUTON MORT.

         Le cas qu'on pourrait croire anodin est celui du nom DÉJÀ LIVRÉ :
         y proposer « ajouter » fabriquerait un homonyme que personne n'a
         demandé — c'est-à-dire le conflit que MB vient de me demander
         d'outiller. On ne crée pas le problème qu'on vient d'armer. */
      function majBtDico(lesMuscles) {
        var nom = champNom.value.trim();
        var l = lesMuscles || A.m.muscles(exo);
        if (!nom || !l.length) { btAjoutDico.hidden = true; return; }

        var mienne = A.m.dictionnairePerso(etat()).filter(function (f) {
          return A.m.slug(f.nom) === A.m.slug(nom);
        })[0];
        if (mienne) {
          var pareil = (mienne.muscles || []).slice().sort().join(',')
                     === l.slice().sort().join(',');
          btAjoutDico.hidden = false;
          btAjoutDico.disabled = pareil;
          btAjoutDico.textContent = pareil
            ? 'Déjà dans ton dictionnaire'
            : 'Mettre à jour ta fiche (' + l.length + ' muscles)';
          return;
        }
        if (A.m.ficheLivree(nom)) { btAjoutDico.hidden = true; return; }

        btAjoutDico.hidden = false;
        btAjoutDico.disabled = false;
        btAjoutDico.textContent = 'Ajouter « ' + nom + ' » à ton dictionnaire';
      }

      function rafraichirMuscles() {
        A.ui.vider(boiteMuscles);
        boiteMuscles.appendChild(A.ui.selecteurMuscles(exo.muscles, function (v) {
          exo.muscles = v;
          majAideMuscles();
        }));
        majAideMuscles();
      }
      rafraichirMuscles();

      btProposer.addEventListener('click', function () {
        var prop = A.m.musclesProposes(exo.forces || [], exo.prise, champNom.value,
                                       A.m.musclesDesReglages(etat(), exo),
                                       exo.outils || []);
        if (!prop.muscles.length) return;
        var fusion = A.m.muscles(exo).slice();
        prop.muscles.forEach(function (id) { if (fusion.indexOf(id) < 0) fusion.push(id); });
        exo.muscles = A.m.muscles({ muscles: fusion });
        rafraichirMuscles();
        A.ui.toast(prop.source === 'anatomie'
          ? 'Proposé d’après l’anatomie. À corriger si ça ne correspond pas.'
          : prop.source === 'nom'
          ? 'Proposé d’après le nom que tu as écrit. À corriger si besoin.'
          : prop.source === 'reglage'
          ? 'Proposé d’après le réglage de l’outil — c’est toi qui l’as renseigné.'
          : 'Proposé — à vérifier : les directions de poussée ne sont pas des actions articulaires.');
      });

      btAjoutDico.addEventListener('click', function () {
        var nom = champNom.value.trim();
        var l = A.m.muscles(exo);
        if (!nom || !l.length) return;
        var neuve = !A.m.dictionnairePerso(etat()).some(function (f) {
          return A.m.slug(f.nom) === A.m.slug(nom);
        });
        A.m.ajouterAuDictionnaire(etat(), nom, l, A.m.colonnes(exo));
        A.store.sauver(true);
        majBtDico();
        /* LE MESSAGE DIT CE QUE LA FICHE FAIT ET CE QU'ELLE NE FAIT PAS.
           Sans la seconde moitié, MB s'attendrait à retrouver son type de
           charge et ses outils, et ne les retrouverait pas. */
        A.ui.toast(neuve
          ? '« ' + nom + ' » est dans ton dictionnaire : ses ' + l.length
            + ' muscles reviendront seuls. Le type de charge et les outils, non.'
          : 'Ta fiche « ' + nom + ' » porte maintenant ' + l.length + ' muscles.');
      });

      /* L'entrée de secours : les noms latins ne parlent pas à tout le monde,
         et une case qu'on ne sait pas cocher reste vide. */
      var ouCaTire = A.ui.selecteurOuCaTire(
        function () { return A.m.muscles(exo); },
        function (voulus) {
          exo.muscles = A.m.muscles({ muscles: voulus });
          rafraichirMuscles();
        });

      var grMuscles = A.ui.groupe('Muscles sollicités', ouCaTire);
      grMuscles.appendChild(boiteMuscles);
      grMuscles.appendChild(btProposer);
      grMuscles.appendChild(btAjoutDico);
      grMuscles.appendChild(aideMuscles);
      c.appendChild(grMuscles);

      /* Cocher un mouvement doit rafraîchir la proposition : sinon le bouton
         reste à « coche un mouvement » alors qu'on vient de le faire. */
      surChangementForces = majAideMuscles;

      var champConsigne = h('textarea', { class: 'champ',
        placeholder: 'Tenue 3 s en haut, excentrique 4 s. Prise pronation serrée.' });
      champConsigne.value = exo.consigne || '';
      champConsigne.addEventListener('input', function () { exo.consigne = champConsigne.value; });
      c.appendChild(A.ui.groupe('Consigne d’exécution', champConsigne,
        'Tempo, tenue, prise. Affichée en clair pendant la séance.'));

      /* Les structures chargées, TOUT en bas — après le repos. Elles ne
         décrivent pas l'exercice : elles nomment ce qui ENCAISSE, dans le
         vocabulaire des douleurs, et ne servent qu'au recoupement dans Suivi.
         C'est utile et c'est rare.

         L'aide avait été retirée d'ici, puis redemandée, courte. Les deux
         demandes sont du même utilisateur et la seconde gagne : ce qui était
         reproché était le bavardage, pas l'explication. */
      var boiteStructures = h('div');
      function rafraichirStructures() {
        A.ui.vider(boiteStructures);
        boiteStructures.appendChild(A.ui.selecteurStructures(exo.structures || [],
          function (v) { exo.structures = v; }));
      }
      rafraichirStructures();
      c.appendChild(A.ui.groupe('Structures chargées', boiteStructures,
        'Ce qui encaisse, pas ce qui travaille. Sert à relier une douleur aux '
      + 'séances qui l’ont chargée.'));

      valider = function () {
        var nom = champNom.value.trim();
        if (!nom) { A.ui.toast('Donne un nom à l’exercice.'); champNom.focus(); return false; }
        exo.nom = nom;
        exo.slug = A.m.slug(nom);
        exo.consigne = champConsigne.value;
        /* MEME REGLE QU'AU MODELE : le materiel de salle reste sur la
           seance et n'entre pas dans l'inventaire. MB, 10/11. */
        (exo.outils || []).forEach(function (o) {
          if (!A.m.estMaterielDeSalle(o)) A.m.majCatalogueOutils(etat(), o);
        });
        if (!exo.structures) exo.structures = [];
        A.m.majCatalogue(etat(), exo);
        return true;
      };
      setTimeout(function () { if (!exo.nom) champNom.focus(); }, 60);
    }, [
      { nom: 'Annuler', action: function (fermer) { fermer(); } },
      { nom: 'Enregistrer', classe: 'bt-primaire', action: function (fermer) {
          if (valider && !valider()) return;
          fermer();
          onFini && onFini(exo);
        } }
    ]);
  }

  A.panneau = { ouvrir: ouvrirPanneau, editerExercice: editerExercice,
                choisirOutils: choisirOutils, voirPlanche: voirPlanche };
})(window.App || (window.App = {}));
