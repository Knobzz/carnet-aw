/* Suivi — l'app ne décide rien et ne propose aucun programme.
   Elle donne la matière : qui a été sollicité, quand, et ce qui a précédé une douleur. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function etat() { return A.store.etat(); }

  function section(titre, aide) {
    var f = document.createDocumentFragment();
    f.appendChild(h('div', { class: 'sous-titre', text: titre }));
    if (aide) f.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px', text: aide }));
    return f;
  }

  /* ------------------------------------------------------------------
     1. dernière sollicitation par exercice — le cœur du raisonnement tendineux
     ------------------------------------------------------------------ */
  function blocSollicitation(e) {
    var f = document.createDocumentFragment();
    f.appendChild(section('Dernière sollicitation',
      'Depuis combien de jours chaque exercice n’a pas été fait. Rouge : moins de 48 h. Laiton : 48 à 72 h. À toi de juger ce qui se recoupe.'));

    var liste = A.m.derniereSollicitation(e);
    if (!liste.length) {
      f.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Rien encore' }),
        'Valide des séries dans une séance : elles apparaîtront ici avec leur ancienneté.'));
      return f;
    }

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps', style: 'padding:6px 12px 10px' });
    var voirTout = liste.length > 10;
    var montres = voirTout ? liste.slice(0, 10) : liste;

    function ligne(x) {
      var j = x.jours;
      var txt = j === 0 ? "aujourd’hui" : (j === 1 ? 'hier' : j + ' j');
      var n = h('div', { class: 'item-ligne', style: 'padding:7px 0;align-items:center;cursor:pointer' },
        h('b', { text: x.nom }),
        x.aw ? h('span', { class: 'jeton', text: 'AW' }) : null,
        h('span', { class: 'delai', dataset: { zone: A.m.zoneDelai(j) }, text: txt }));
      /* Un appui ouvre l'historique : l'anciennete dit quand, l'historique dit
         comment ça évolue. Les deux questions s'enchaînent naturellement. */
      n.addEventListener('click', function () { A.vues.exercice.ouvrir(x.slug, x.nom); });
      return n;
    }

    montres.forEach(function (x) { corps.appendChild(ligne(x)); });

    if (voirTout) {
      var bt = h('button', { class: 'bt bt-petit bt-fantome', style: 'margin-top:6px',
                             text: 'Voir les ' + (liste.length - 10) + ' autres' });
      bt.addEventListener('click', function () {
        liste.slice(10).forEach(function (x) { corps.insertBefore(ligne(x), bt); });
        bt.remove();
      });
      corps.appendChild(bt);
    }

    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  /* ------------------------------------------------------------------
     1 bis. par STRUCTURE — la question que la liste par exercice ne sait pas traiter
     ------------------------------------------------------------------ */
  function blocStructures(e) {
    var f = document.createDocumentFragment();
    var r = A.m.derniereSollicitationStructure(e);
    var l = r.lignes;

    /* Le côté ne s'affiche QUE s'il est renseigné quelque part : tant que le
       carnet n'en porte aucun, répéter « côté non renseigné » sur chaque
       ligne serait du bruit sur toute la hauteur de l'écran. */
    var avecCote = l.some(function (s) { return s.cote !== A.m.COTE_INCONNU; });
    var sansCote = l.filter(function (s) { return s.cote === A.m.COTE_INCONNU; });

    f.appendChild(section('Par structure',
      'Un exercice charge plusieurs structures, et une structure est chargée par plusieurs exercices. '
      + 'C’est ici que se lit « quand ai-je chargé lourd le médial », toutes origines confondues.'));

    if (!l.length) {
      f.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Aucune structure renseignée' }),
        'Facultatif : ouvre la fiche d’un exercice et coche ce qu’il charge. Les cinq premières '
        + 'structures sont les zones de douleur — c’est ce qui permet de relier les deux.'));
      return f;
    }

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps', style: 'padding:6px 12px 10px' });

    l.sort(function (a, b) { return a.jours - b.jours; }).forEach(function (s) {
      var j = s.jours;
      var txt = j === 0 ? "aujourd’hui" : (j === 1 ? 'hier' : j + ' j');
      var titre = h('b', { text: s.nom });
      if (avecCote) {
        titre.appendChild(h('span', { class: 'jeton jeton-cote',
          text: s.nomCote || 'côté ?' }));
      }
      corps.appendChild(h('div', { class: 'item-ligne', style: 'padding:7px 0;align-items:center' },
        titre,
        h('span', { style: 'font-size:.78rem', text: s.series + ' sér.' }),
        h('span', { class: 'delai', dataset: { zone: A.m.zoneDelai(j) }, text: txt })));
      if (s.exercices.length) {
        corps.appendChild(h('div', { class: 'item-resume', style: 'margin:-4px 0 4px 0;font-size:.76rem',
          text: s.exercices.join(', ') }));
      }
    });

    /* Les structures jamais chargées sont une information, pas un vide. */
    if (r.jamais.length) {
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin-top:8px',
        text: 'Jamais chargée : ' + r.jamais.map(function (x) { return x.nom; }).join(', ') + '.' }));
    }

    /* Dire une fois, et une seule, ce qui manque pour que le croisement
       gauche/droite soit juste. Le carnet montre, il ne réclame pas. */
    if (sansCote.length) {
      var noms = {};
      sansCote.forEach(function (x) { x.exercices.forEach(function (n) { noms[n] = true; }); });
      var liste = Object.keys(noms);
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin-top:6px',
        text: avecCote
          ? 'Sans côté renseigné : ' + liste.join(', ') + '. '
          + 'Ces séries ne peuvent être attribuées ni à un bras ni à l’autre.'
          : 'Aucun exercice ne dit quel bras il charge. Le côté se pose dans la fiche '
          + 'd’un exercice ; c’est lui qui permet de relier une douleur au bras qui l’a chargée.' }));
    }

    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  /* ------------------------------------------------------------------
     2. douleurs et ce qui les a précédées
     ------------------------------------------------------------------ */
  function blocDouleurs(e) {
    var f = document.createDocumentFragment();
    f.appendChild(section('Douleurs',
      'Chaque épisode, avec ce que tu as fait dans les 72 h qui l’ont précédé.'));

    var eps = A.m.episodesDouleur(e);
    if (!eps.length) {
      f.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Aucune douleur notée' }),
        'La ligne de douleurs est sur chaque séance, muscu comme sparring.'));
      return f;
    }

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });

    eps.slice(0, 12).forEach(function (se) {
      var bloc = h('div', { class: 'episode' });
      bloc.appendChild(h('div', { class: 'episode-tete' },
        h('b', { text: A.m.dateCourte(se.date) }),
        h('span', { class: 'item-date',
                    text: se.type === 'sparring' ? 'sparring' : (se.programmeNom || 'séance libre') })));
      bloc.appendChild(h('div', { class: 'enrobe', style: 'margin:4px 0 2px' },
        A.m.zonesVives(se.douleurs).map(function (d) {
          return h('span', { class: 'jeton jeton-douleur', text: A.m.texteDouleur(d) });
        })));

      var avant = A.m.fenetreAvant(e, se.date, 72, se.id);
      var zone = h('div', { class: 'fenetre72' });
      var bt = h('button', { class: 'bt bt-petit bt-fantome', style: 'padding:0 4px',
                             text: avant.length
                               ? 'Voir les 72 h précédentes (' + avant.length + ')'
                               : 'Rien dans les 72 h précédentes' });
      if (avant.length) {
        bt.addEventListener('click', function () {
          if (zone.firstChild) { A.ui.vider(zone); bt.textContent = 'Voir les 72 h précédentes (' + avant.length + ')'; return; }
          bt.textContent = 'Masquer';
          var ul = h('ul');
          avant.forEach(function (s) {
            var quoi;
            if (s.type === 'sparring') {
              quoi = 'Sparring' + (s.rounds ? ' · ' + s.rounds + ' rounds' : '')
                   + (s.style ? ' · ' + A.m.nomStyle(s.style) : '')
                   + (s.cote ? ' · ' + A.m.nomCote(s.cote) : '');
            } else {
              /* Le côté de chaque exercice est dit ici : c'est la question
                 que pose un épisode de douleur — « est-ce CE bras qui a
                 travaillé ? ». Sans cette marque, la liste répond à côté. */
              var noms = (s.exercices || []).filter(function (x) {
                return (x.series || []).some(function (y) { return y.faite; });
              }).map(function (x) {
                return x.nom + (x.aw ? ' (AW)' : '')
                     + (x.cote ? ' ' + A.m.courtCote(x.cote) : '');
              });
              quoi = noms.length ? noms.join(', ') : 'séance sans série validée';
            }
            var j = A.m.joursEntre(s.date, se.date);
            ul.appendChild(h('li', {},
              h('b', { text: (j === 0 ? 'le jour même' : 'J−' + j) + ' : ' }),
              quoi));
          });
          zone.appendChild(ul);
        });
      } else bt.disabled = true;

      bloc.appendChild(bt);
      bloc.appendChild(zone);
      corps.appendChild(bloc);
    });

    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  /* ------------------------------------------------------------------
     2 bis. la PENTE de chaque zone — ce qu'un oui/non ne peut pas montrer
     ------------------------------------------------------------------ */
  function blocPentes(e) {
    var zones = A.m.zonesRencontrees(e);
    var f = document.createDocumentFragment();
    if (!zones.length) return f;

    f.appendChild(section('Évolution par zone',
      'Chaque barre est un relevé, du plus ancien au plus récent. Une zone qui descend '
      + 'et une zone qui monte ne demandent pas la même chose.'));

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });

    zones.forEach(function (z) {
      var pts = A.m.suiviZone(e, z, 16);
      var connues = pts.filter(function (p) { return p.intensite != null; });

      var pente = h('div', { class: 'pente' });
      pts.forEach(function (p) {
        var i = p.intensite;
        var niveau = i == null ? 'inconnu' : (i < 4 ? 'bas' : (i < 7 ? 'moyen' : 'haut'));
        var hauteur = i == null ? 10 : Math.max(2, i / 10 * 34);
        pente.appendChild(h('i', { dataset: { niveau: niveau },
                                   style: 'height:' + hauteur + 'px',
                                   title: A.m.dateCourte(p.date) + (i == null ? ' — intensité non précisée' : ' — ' + i + '/10') }));
      });

      var resume;
      if (connues.length >= 2) {
        var d = connues[connues.length - 1].intensite - connues[0].intensite;
        resume = d > 0 ? 'en hausse de ' + d : (d < 0 ? 'en baisse de ' + (-d) : 'stable');
        resume += ' sur ' + connues.length + ' relevés';
      } else if (connues.length === 1) {
        resume = 'un seul relevé chiffré : ' + connues[0].intensite + '/10';
      } else {
        resume = 'aucune intensité renseignée — seule la présence est connue';
      }

      corps.appendChild(h('div', { style: 'margin-bottom:14px' },
        h('div', { class: 'item-ligne', style: 'align-items:baseline' },
          h('b', { text: A.m.nomZone(z) }),
          h('span', { style: 'font-size:.78rem', text: pts.length + ' fois' })),
        pente,
        h('div', { class: 'item-resume', style: 'margin-top:4px', text: resume })));
    });

    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  /* ------------------------------------------------------------------
     3. volume AW vs muscu générale
     ------------------------------------------------------------------ */
  function blocVolume(e) {
    var f = document.createDocumentFragment();
    f.appendChild(section('Volume par semaine', 'Tonnage des exercices chiffrés, AW à part de la muscu générale.'));

    var sem = A.m.volumeParSemaine(e, 8);
    if (!sem.length) {
      f.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Pas encore de volume' }),
        'Les exercices en kilos alimentent ce graphe. Grippers et élastiques comptent en séries, pas ici.'));
      return f;
    }

    var max = sem.reduce(function (m, s) { return Math.max(m, s.aw + s.general); }, 0) || 1;
    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });
    var barres = h('div', { class: 'barres' });

    sem.forEach(function (s) {
      var piste = h('div', { class: 'barre-piste' },
        h('i', { class: 'aw', style: 'width:' + (s.aw / max * 100) + '%' }),
        h('i', { class: 'gen', style: 'width:' + (s.general / max * 100) + '%' }));
      var d = A.m.dateCourte(s.semaine).replace(/ \d{4}$/, '');
      barres.appendChild(h('div', { class: 'barre' },
        h('span', { class: 'tab-num', text: d }),
        piste,
        h('span', { class: 'barre-val', text: A.m.fmt(Math.round(s.aw + s.general)) })));
    });

    corps.appendChild(barres);
    corps.appendChild(h('div', { class: 'legende' },
      h('span', {}, h('i', { style: 'background:var(--laiton)' }), 'AW'),
      h('span', {}, h('i', { style: 'background:var(--bleu)' }), 'Muscu générale')));

    /* Le temps sous tension ne se met PAS dans les mêmes barres : des kilos et
       des secondes ne se comparent pas, et les empiler fabriquerait une courbe
       qui ne veut rien dire. Il se lit à côté, semaine par semaine, et
       seulement s'il y en a. */
    var avecTst = sem.filter(function (s) { return s.tempsSousTension > 0; });
    if (avecTst.length) {
      corps.appendChild(h('div', { class: 'sous-titre', style: 'margin:14px 0 6px',
                                   text: 'Temps sous tension' }));
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 0 7px',
        text: 'Les séries tenues, isométries comprises. Des secondes ne s’additionnent pas à des kilos : elles se lisent à part.' }));
      var maxT = avecTst.reduce(function (m, s) { return Math.max(m, s.tempsSousTension); }, 0) || 1;
      var barresT = h('div', { class: 'barres' });
      sem.forEach(function (s) {
        if (!s.tempsSousTension) return;
        barresT.appendChild(h('div', { class: 'barre' },
          h('span', { class: 'tab-num', text: A.m.dateCourte(s.semaine).replace(/ \d{4}$/, '') }),
          h('div', { class: 'barre-piste' },
            h('i', { class: 'gen', style: 'width:' + (s.tempsSousTension / maxT * 100) + '%' })),
          h('span', { class: 'barre-val', text: A.m.texteDuree(s.tempsSousTension) })));
      });
      corps.appendChild(barresT);
    }
    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  /* ------------------------------------------------------------------
     4. mouvements — ce qu'un programme néglige
     ------------------------------------------------------------------ */
  function blocForces(e) {
    var r = A.m.repartitionForces(e, 28);
    var f = document.createDocumentFragment();
    f.appendChild(section('Mouvements — 28 derniers jours',
      'Séries validées sur les exercices que tu as associés à chaque mouvement. Un zéro est une information.'));

    if (!r.total) {
      f.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Aucun mouvement associé' }),
        'Facultatif : associe un ou plusieurs mouvements à un exercice depuis sa fiche, et ce compte se remplira.'));
      return f;
    }

    var max = Math.max.apply(null, A.m.FORCES.map(function (x) { return r.parForce[x.id]; })) || 1;
    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });
    var barres = h('div', { class: 'barres' });

    A.m.FORCES.forEach(function (x) {
      var n = r.parForce[x.id];
      barres.appendChild(h('div', { class: 'barre' },
        h('span', { text: x.nom }),
        h('div', { class: 'barre-piste' }, h('i', { class: 'gen', style: 'width:' + (n / max * 100) + '%' })),
        h('span', { class: 'barre-val', text: n + ' sér.' })));
    });

    corps.appendChild(barres);
    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  /* ------------------------------------------------------------------
     la carte des muscles

     Le schéma sert le coup d'œil, les barres servent la mesure : vingt-deux
     muscles sur un bras de 290 px seraient illisibles, et six régions
     teintées ne diraient pas les chiffres. Les deux, donc, et chacun son
     travail — et les muscles trop fins pour le dessin vivent dans les
     barres, où la place ne manque pas.

     Le dessin est un SCHÉMA, pas une planche d'anatomie : des régions nettes
     et nommées valent mieux qu'un réalisme raté. Il est en SVG inline —
     aucune image à charger, donc rien à casser hors ligne.
     ------------------------------------------------------------------ */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(nom, attrs) {
    var n = document.createElementNS(SVG_NS, nom);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  /* Le membre supérieur en VUE ANTÉRIEURE, épaule en haut, main en bas —
     la vue des planches d'anatomie, et celle qui laisse la place de montrer
     un muscle par région plutôt que six zones.

     Dessiné à la main d'après l'anatomie : il n'y a aucune image à charger,
     donc rien à casser hors ligne, aucune question de licence, et chaque
     muscle se teinte séparément — ce qu'une photo ne permettrait pas.

     Ce que ça N'EST PAS : une planche médicale. Les contours sont
     approximatifs, en particulier les insertions. Des régions nettes,
     nommées et à la bonne place valent mieux qu'un réalisme raté à 170 px
     de large.

     La main est le seul décor INERTE : elle sert à reconnaître le membre et
     ne répond pas au doigt. Le deltoïde, lui, est un muscle suivi comme les
     autres. */
  /* Les tracés sont CONSTRUITS, pas écrits à la main.

     Trois tentatives de dessin libre ont donné trois amas de formes
     détachées : sans discipline, les régions ne se touchent pas, les
     proportions dérivent, et le membre ne se reconnaît plus. On décrit donc
     le CONTOUR du membre — sa largeur à chaque hauteur — et chaque muscle
     occupe une bande de ce contour, exprimée en fractions de largeur. Les
     tracés se calculent, se touchent par construction, et restent justes
     quand on bouge un point du contour.

     Repères du contour : épaule large, bras qui s'affine vers le coude,
     avant-bras qui regonfle à son ventre musculaire puis se resserre au
     poignet. C'est ce profil qui fait lire « bras » et non « colonne ». */
  var CONTOUR = [
    { y: 22,  g: 40, d: 82 },
    { y: 48,  g: 30, d: 88 },
    { y: 70,  g: 29, d: 89 },
    { y: 110, g: 28, d: 90 },   // ventre du biceps
    { y: 150, g: 36, d: 82 },
    { y: 162, g: 38, d: 80 },   // coude
    { y: 188, g: 31, d: 87 },   // ventre de l'avant-bras
    { y: 218, g: 34, d: 84 },
    { y: 248, g: 41, d: 77 },
    { y: 266, g: 43, d: 75 }    // poignet
  ];

  /* Largeur du membre a une hauteur donnee, interpolee entre deux reperes. */
  function bords(y) {
    if (y <= CONTOUR[0].y) return CONTOUR[0];
    for (var i = 1; i < CONTOUR.length; i++) {
      if (y <= CONTOUR[i].y) {
        var a = CONTOUR[i - 1], b = CONTOUR[i];
        var t = (y - a.y) / (b.y - a.y);
        return { g: a.g + (b.g - a.g) * t, d: a.d + (b.d - a.d) * t };
      }
    }
    return CONTOUR[CONTOUR.length - 1];
  }

  /* Une fraction de largeur : soit fixe, soit un couple [début, fin] qui
     glisse le long de la bande. C'est ce qui permet de tracer un muscle
     OBLIQUE — le rond pronateur part du bord médial du coude et finit au
     milieu de l'avant-bras ; une bande droite en ferait un bandeau. */
  function frac(f, t) {
    return typeof f === 'number' ? f : f[0] + (f[1] - f[0]) * t;
  }

  /* Une bande : de la hauteur `de` a la hauteur `a`, entre deux fractions de
     la largeur du membre. On echantillonne pour que les bords suivent le
     galbe du contour au lieu d'etre des segments droits.

     `pointeHaut` et `pointeBas` sont la part de la longueur sur laquelle la
     bande se resserre vers son axe, comme un ventre musculaire vers son
     tendon. Sans elles, chaque muscle est un rectangle et le dessin entier
     lit « pile de briques » au lieu de « bras ». */
  function bande(de, a, fg, fd, pointeHaut, pointeBas) {
    var pas = Math.max(10, Math.round((a - de) / 3));
    var gauche = [], droite = [];
    for (var i = 0; i <= pas; i++) {
      var t = i / pas;
      var y = de + (a - de) * t;
      var b = bords(y);
      var large = b.d - b.g;
      var g = frac(fg, t), d = frac(fd, t);
      var k = 1;
      if (pointeHaut && t < pointeHaut) {
        k = Math.min(k, 0.22 + 0.78 * Math.sqrt(t / pointeHaut));
      }
      if (pointeBas && t > 1 - pointeBas) {
        k = Math.min(k, 0.22 + 0.78 * Math.sqrt((1 - t) / pointeBas));
      }
      var axe = (g + d) / 2, demi = (d - g) / 2 * k;
      gauche.push([(b.g + large * (axe - demi)).toFixed(1), y.toFixed(1)]);
      droite.push([(b.g + large * (axe + demi)).toFixed(1), y.toFixed(1)]);
    }
    droite.reverse();
    return 'M' + gauche.concat(droite).map(function (p) { return p[0] + ' ' + p[1]; }).join(' L') + ' Z';
  }

  /* Il ne reste que la main en décor : le deltoïde est devenu un muscle
     suivi comme les autres. */
  var SILHOUETTE = [];

  /* L'ordre compte : les tracés se recouvrent, et les derniers posés sont
     au-dessus. Les muscles profonds (supinateur, carré pronateur, brachial)
     viennent donc après les superficiels qui les bordent. */
  /* L'ordre est celui du dessin : les profonds (rond pronateur, supinateur)
     passent APRÈS les superficiels qu'ils croisent, sinon ils disparaissent
     dessous. Le pectoral et le dorsal sont hors du membre : ils gardent un
     tracé à eux. */
  /* Tous les muscles n'ont pas de territoire lisible à 190 px de large :
     l'anconé, le long palmaire ou l'extenseur du petit doigt y tiendraient
     sur trois pixels. Ceux-là n'ont PAS de tracé — ils vivent dans les
     barres chiffrées, où la place ne manque pas. Le banc vérifie que cette
     liste et celle du modèle se recouvrent exactement : un muscle oublié des
     deux serait invisible, et une région sans muscle serait un mensonge. */
  var TRACES_MUSCLE = [
    /* Le tronc : ces deux-là ne sont pas dans le membre, ils tirent dessus.
       Leurs tracés mordent sur le haut du bras — c'est là qu'ils s'insèrent,
       et ça évite le trou blanc entre le torse et l'épaule. */
    ['grand_pectoral',      'M5 30 Q20 22 40 29 Q51 42 52 58 Q32 67 13 61 Q3 46 5 30 Z'],
    ['grand_dorsal',        'M5 66 Q17 63 31 73 Q34 90 32 105 Q17 111 5 102 Z'],

    /* Bras, du bord médial au bord latéral. Chaque ventre se resserre vers
       son tendon : le triceps vers l'olécrane, le biceps en fuseau aux deux
       bouts, le brachial sous lui du côté latéral. */
    ['triceps',             bande(60, 164, 0.00, [0.36, 0.22], 0.18, 0.30)],
    ['biceps',              bande(58, 168, [0.26, 0.30], [0.76, 0.66], 0.26, 0.32)],
    ['brachial',            bande(92, 168, [0.70, 0.64], 1.00, 0.30, 0.18)],

    /* Le deltoïde coiffe l'épaule et descend sur le bras : il est posé APRÈS
       le bras, parce qu'en vrai il le recouvre. */
    ['deltoide',            'M43 24 Q63 13 77 33 Q85 52 79 70 Q68 76 59 67 Q58 43 43 24 Z'],

    /* Avant-bras, face antérieure : la masse flexo-pronatrice, du bord
       médial vers le milieu. Tous finissent en tendon au poignet. */
    ['fcu',                 bande(160, 258, 0.00, 0.17, 0.10, 0.45)],
    ['flechisseurs_doigts', bande(162, 260, 0.17, 0.39, 0.14, 0.40)],
    ['fcr',                 bande(162, 258, 0.39, 0.55, 0.16, 0.48)],

    /* Face postéro-latérale. Le brachio-radial part du BRAS, bien au-dessus
       du coude — c'est ce qui le rend reconnaissable sur une planche. */
    ['brachio_radial',      bande(118, 252, [0.60, 0.56], [0.86, 0.74], 0.34, 0.42)],
    ['ecrl',                bande(132, 254, [0.80, 0.74], [0.94, 0.86], 0.34, 0.44)],
    ['ecrb',                bande(148, 256, [0.92, 0.86], 1.00, 0.28, 0.44)],

    /* Les obliques du coude, posés par-dessus pour rester visibles : le rond
       pronateur traverse en diagonale vers le milieu du radius, le
       supinateur s'enroule sous les extenseurs. */
    ['rond_pronateur',      bande(158, 202, [0.02, 0.26], [0.26, 0.54], 0.10, 0.38)],
    ['supinateur',          bande(156, 196, [0.60, 0.56], [1.00, 0.88], 0.14, 0.34)],
    /* et le carré pronateur, transverse juste au-dessus du poignet */
    ['carre_pronateur',     bande(244, 264, 0.06, 0.94, 0.12, 0.12)]
  ];

  /* Dits dans les barres, pas sur le dessin — faute de place, et c'est écrit
     à l'écran plutôt que tu. */
  var SANS_TRACE_ATTENDUS = ['coraco_brachial', 'ancone', 'long_palmaire',
                             'ecu', 'extenseurs_doigts', 'extenseur_petit_doigt',
                             'extenseurs_pouce'];

  /* La main, inerte elle aussi — elle sert à reconnaître le membre. */
  var TRACE_MAIN = 'M43 262 Q36 278 39 292 Q44 304 59 305 Q74 304 78 291 Q81 276 76 262 Q59 268 43 262 Z';

  function blocMuscles(e) {
    var f = document.createDocumentFragment();
    var c = A.m.chargeParMuscle(e, 28);

    f.appendChild(section('Muscles — 28 derniers jours',
      'Ce qui tire, et combien. Les structures disent ce qui encaisse ; '
    + 'les muscles disent ce qui travaille.'));

    if (!c.total) {
      f.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Aucun muscle renseigné' }),
        'Ouvre la fiche d’un exercice : coche ses mouvements, puis demande la proposition. '
      + 'Elle remplit les muscles d’après l’anatomie, et tu corriges.'));
      return f;
    }

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });

    /* --- le schéma, un muscle par région --- */
    var maxM = A.m.MUSCLES.reduce(function (m, x) {
      return Math.max(m, c.parMuscle[x.id] || 0);
    }, 0) || 1;

    var svg = svgEl('svg', { viewBox: '0 0 100 306', class: 'carte-bras',
                             role: 'img',
                             'aria-label': 'Membre supérieur en vue antérieure, '
                                         + 'chaque muscle teinté selon sa sollicitation' });
    var detail = h('div', { class: 'item-resume', style: 'min-height:3.2em;margin-top:6px' });

    SILHOUETTE.concat([TRACE_MAIN]).forEach(function (d) {
      svg.appendChild(svgEl('path', { d: d, class: 'bras-inerte' }));
    });

    var zones = [];
    TRACES_MUSCLE.forEach(function (paire) {
      var id = paire[0], m = A.m.muscle(id);
      var n = c.parMuscle[id] || 0;
      var p = svgEl('path', { d: paire[1], class: 'region-bras',
                              'data-chaleur': n === 0 ? '0'
                                : (n / maxM > .66 ? '3' : (n / maxM > .33 ? '2' : '1')),
                              tabindex: '0', role: 'button',
                              'aria-label': m.nom + ', ' + n + ' séries' });
      function montrer() {
        zones.forEach(function (x) { x.removeAttribute('data-choisi'); });
        p.setAttribute('data-choisi', '1');
        detail.textContent = m.nom + (m.aussi ? ' (' + m.aussi + ')' : '')
          + ' — ' + n + ' série' + (n > 1 ? 's' : '')
          + ' · ' + m.quoi
          + (m.medial ? ' · insertion médiale' : '')
          + (m.lateral ? ' · insertion latérale' : '');
      }
      p.addEventListener('click', montrer);
      p.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); montrer(); }
      });
      zones.push(p);
      svg.appendChild(p);
    });

    corps.appendChild(h('div', { class: 'bras-enrobe' }, svg));
    var horsDessin = SANS_TRACE_ATTENDUS.filter(function (id) {
      return (c.parMuscle[id] || 0) > 0;
    }).map(A.m.nomMuscle);
    corps.appendChild(h('div', { class: 'item-resume', style: 'margin-top:2px',
      text: 'Vue antérieure. Appuie sur un muscle pour le détail.'
          + (horsDessin.length
              ? ' Faute de place, ceux-ci ne sont que dans les barres : '
                + horsDessin.join(', ') + '.'
              : '') }));
    corps.appendChild(detail);

    /* --- les chiffres, muscle par muscle --- */
    var barres = h('div', { class: 'barres barres-serrees barres-muscles', style: 'margin-top:12px' });
    A.m.MUSCLES.slice().sort(function (a, b) {
      return (c.parMuscle[b.id] || 0) - (c.parMuscle[a.id] || 0);
    }).forEach(function (m) {
      var n = c.parMuscle[m.id] || 0;
      if (!n) return;
      barres.appendChild(h('div', { class: 'barre' },
        h('span', { text: m.court || m.nom, title: m.nom }),
        h('div', { class: 'barre-piste' },
          h('i', { class: 'aw', style: 'width:' + (n / maxM * 100) + '%' })),
        h('span', { class: 'barre-val', text: n + ' sér.' })));
    });
    corps.appendChild(barres);

    /* L'insertion commune se compte, et se dit en une ligne. Elle est utile
       pour relier la carte à une douleur de coude — pas pour en faire le
       sujet de l'écran. */
    var ep = A.m.chargeEpicondyle(e, 28);
    if (ep.medial || ep.lateral) {
      var dits = [];
      if (ep.medial) dits.push(ep.medial + ' sur l’insertion médiale');
      if (ep.lateral) dits.push(ep.lateral + ' sur la latérale');
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin-top:10px',
        text: 'Séries : ' + dits.join(', ') + '.' }));
    }
    if (c.sansMuscle) {
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin-top:6px',
        text: c.sansMuscle + ' série(s) sur des exercices sans muscle renseigné : '
            + 'elles ne sont nulle part sur cette carte.' }));
    }

    carte.appendChild(corps);
    f.appendChild(carte);

    /* --- ce qui est mobilisé, par articulation ---
       Un compte par muscle dit « lequel travaille » ; celui-ci dit « qu'est-ce
       que je fais travailler », qui est la question d'un programme. Un zéro y
       est une information : un poignet jamais sollicité se voit. */
    var arts = A.m.chargeParArticulation(e, 28);
    if (arts.some(function (x) { return x.series > 0; })) {
      var maxA = arts.reduce(function (m, x) { return Math.max(m, x.series); }, 0) || 1;
      corps.appendChild(h('div', { class: 'sous-titre', style: 'margin:16px 0 4px',
                                   text: 'Ce que tu mobilises' }));
      var barresA = h('div', { class: 'barres barres-art barres-serrees' });
      arts.forEach(function (x) {
        barresA.appendChild(h('div', { class: 'barre' },
          h('span', { text: x.nom }),
          h('div', { class: 'barre-piste' },
            h('i', { class: 'aw', style: 'width:' + (x.series / maxA * 100) + '%' })),
          h('span', { class: 'barre-val',
                      text: x.series + ' sér.' })));
      });
      corps.appendChild(barresA);
    }

    /* --- le croisement mouvements × muscles --- */
    var croise = A.m.musclesParMouvement(e, 28).filter(function (x) { return x.series > 0; });
    if (croise.length) {
      f.appendChild(section('Chaque mouvement, ce qu’il fait travailler',
        'D’après tes exercices tels qu’ils sont renseignés — pas d’après la proposition.'));
      var c2 = h('div', { class: 'carte' });
      var corps2 = h('div', { class: 'carte-corps', style: 'padding:8px 12px 10px' });
      croise.forEach(function (x) {
        var ids = Object.keys(x.parMuscle).sort(function (a, b) {
          return x.parMuscle[b] - x.parMuscle[a];
        });
        corps2.appendChild(h('div', { class: 'item-ligne', style: 'padding:6px 0' },
          h('b', { text: x.nom }),
          h('span', { text: x.series + ' sér.' })));
        corps2.appendChild(h('div', { class: 'item-resume', style: 'margin:-4px 0 4px;font-size:.76rem',
          text: ids.length
            ? ids.map(function (id) { return A.m.nomMuscle(id) + ' ' + x.parMuscle[id]; }).join(', ')
            : 'aucun muscle renseigné sur les exercices de ce mouvement' }));
      });
      c2.appendChild(corps2);
      f.appendChild(c2);
    }

    return f;
  }

  /* ------------------------------------------------------------------
     la règle des 24 h — la seule question que le carnet pose

     Ce qui renseigne n'est pas la douleur pendant l'effort, mais si elle est
     revenue à son niveau de base le lendemain. L'app montre l'écart ; elle
     ne conseille rien, et elle ne demande rien quand il n'y a rien à
     demander.
     ------------------------------------------------------------------ */
  function blocVingtQuatre(e, surReponse) {
    var f = document.createDocumentFragment();
    var q = A.m.questions24h(e);
    var auj = A.m.aujourdHui();

    /* Ce à quoi on a déjà répondu aujourd'hui : on montre l'écart, qui est
       l'information, et pas seulement le chiffre du jour. */
    var repondus = A.m.relevesTries(e).filter(function (r) { return r.date === auj; });

    if (!q.length && !repondus.length) return f;

    f.appendChild(section('Et aujourd’hui ?',
      'Une douleur fait presque toujours mal pendant l’effort. Ce qui renseigne, '
    + 'c’est si elle est revenue à son niveau de la veille le lendemain.'));

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });

    function libelle(zone, cote) {
      return A.m.nomZone(zone) + (cote ? ' ' + A.m.courtCote(cote) : '');
    }

    q.forEach(function (x) {
      var quand = x.jours === 1 ? 'hier' : 'il y a ' + x.jours + ' j';
      /* Le nom de la zone a son propre rang : en ligne avec un bouton de
         taille fixe, « Coude médial D » se réduisait à « Coude m… ». */
      var ligne = h('div', { class: 'h24-ligne' },
        h('div', { class: 'h24-quoi' },
          h('b', { text: libelle(x.zone, x.cote) }),
          h('span', { text: x.intensite == null ? quand + ' · non chiffrée'
                                                : x.intensite + '/10 ' + quand })));
      var bt = h('button', { class: 'bt bt-petit', text: 'Répondre' });
      bt.addEventListener('click', function () {
        /* La feuille redemande le côté : si c'est en fait l'autre bras, le
           relevé doit aller là où il le dit, pas là où la question le
           supposait. La question d'origine, elle, reste sans réponse. */
        A.ui.choisirIntensite(libelle(x.zone, x.cote), null, function (v, c) {
          if (v === 'retirer') return;
          A.m.poserReleve(A.store.etat(), auj, x.zone, c, v);
          A.store.sauver(true);
          surReponse();
        }, x.cote);
      });
      ligne.appendChild(bt);
      corps.appendChild(ligne);
    });

    repondus.forEach(function (r) {
      /* La veille, telle qu'elle était : on la relit dans le suivi de la zone,
         qui mélange déjà séances et relevés. */
      var pts = A.m.suiviZone(e, r.zone, 0, r.cote).filter(function (p) { return p.date < auj; });
      var veille = pts.length ? pts[pts.length - 1] : null;
      var ec = A.m.ecart24h(veille && veille.intensite, r.intensite);

      var dit;
      if (ec.sens === 'baisse') dit = 'redescend (' + ec.delta + ')';
      else if (ec.sens === 'hausse') dit = 'n’est pas revenue à la base (+' + ec.delta + ')';
      else if (ec.sens === 'stable') dit = 'au même niveau';
      else dit = 'rien à comparer';

      corps.appendChild(h('div', { class: 'h24-ligne' },
        h('div', { class: 'h24-quoi' },
          h('b', { text: libelle(r.zone, r.cote) }),
          h('span', { text: (veille && veille.intensite != null ? veille.intensite + ' → ' : '')
                          + (r.intensite == null ? 'non chiffrée' : r.intensite + '/10') })),
        h('span', { class: 'delai', dataset: { zone: ec.sens === 'hausse' ? 'chaud'
                                             : (ec.sens === 'baisse' ? 'froid' : 'tiede') },
                    text: dit })));
    });

    corps.appendChild(h('div', { class: 'item-resume', style: 'margin-top:8px',
      text: 'Le carnet ne décide pas : il montre l’écart. Une douleur qui n’est pas '
          + 'revenue à sa base le lendemain est une information, pas une consigne.' }));

    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  /* ------------------------------------------------------------------
     la récupération : une régularité, pas une charge
     ------------------------------------------------------------------ */
  function blocRecup(e) {
    var f = document.createDocumentFragment();
    var jours = A.m.seancesRecupTriees(e).filter(function (s) { return A.m.recupFaite(s); });
    if (!jours.length) return f;

    f.appendChild(section('Récupération — régularité',
      'L’élastique quotidien ne se mesure pas en kilos : ce qui compte est de l’avoir fait.'));

    var s7 = A.m.statsRecup(e, 7), s28 = A.m.statsRecup(e, 28);
    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });

    corps.appendChild(h('dl', { class: 'totaux' },
      h('div', {}, h('dt', { text: '7 derniers jours' }),
        h('dd', { class: 'chiffre', text: s7.joursFaits + ' / 7' })),
      h('div', {}, h('dt', { text: '28 derniers jours' }),
        h('dd', { class: 'chiffre', text: s28.joursFaits + ' / 28' })),
      h('div', { class: 'aw' }, h('dt', { text: 'd’affilée' }),
        h('dd', { class: 'chiffre', text: String(s7.serie) }))));

    /* Les sept derniers jours, un carré par jour : on voit le trou tout de
       suite, ce qu'un pourcentage ne montre pas. */
    var bande = h('div', { class: 'recup-semaine' });
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var z = function (x) { return (x < 10 ? '0' : '') + x; };
      var iso = d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
      var fait = jours.some(function (s) { return s.date === iso; });
      bande.appendChild(h('span', { class: 'recup-jour' + (fait ? ' fait' : ''),
        title: A.m.dateCourte(iso) + (fait ? ' — fait' : ' — rien'),
        text: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()] }));
    }
    corps.appendChild(bande);

    if (!s7.aujourdHuiFait) {
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin-top:8px',
        text: 'Rien de coché aujourd’hui.' }));
    }

    /* La régularité dit si le geste tient ; elle ne dit PAS s'il progresse.
       Une rééducation qui ne monte jamais en charge ne soigne rien. On compte
       en reps et en secondes : l'élastique n'a pas de charge chiffrée. */
    var sem = A.m.volumeRecupParSemaine(e, 8);
    var avecVolume = sem.filter(function (x) { return x.reps > 0 || x.tempsSousTension > 0; });
    if (avecVolume.length >= 2) {
      corps.appendChild(h('div', { class: 'sous-titre', style: 'margin:16px 0 4px',
                                   text: 'Charge par semaine' }));
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 0 7px',
        text: 'Répétitions tenues, semaine par semaine. C’est ce qui dit si tu montes '
            + 'en charge ou si tu fais du surplace.' }));
      var maxR = sem.reduce(function (m, x) { return Math.max(m, x.reps); }, 0) || 1;
      var barres = h('div', { class: 'barres' });
      sem.forEach(function (x) {
        if (!x.reps && !x.tempsSousTension) return;
        var val = A.m.fmt(x.reps) + ' reps'
                + (x.tempsSousTension ? ' · ' + A.m.texteDuree(x.tempsSousTension) : '');
        barres.appendChild(h('div', { class: 'barre' },
          h('span', { class: 'tab-num', text: A.m.dateCourte(x.semaine).replace(/ \d{4}$/, '') }),
          h('div', { class: 'barre-piste' },
            h('i', { class: 'gen', style: 'width:' + (x.reps / maxR * 100) + '%' })),
          h('span', { class: 'barre-val', text: val })));
      });
      corps.appendChild(barres);
    } else if (jours.length) {
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin-top:8px',
        text: 'La charge par semaine apparaîtra après deux semaines cochées : '
            + 'une seule ne fait pas une pente.' }));
    }

    carte.appendChild(corps);
    f.appendChild(carte);
    return f;
  }

  function rendre(hote) {
    A.ui.vider(hote);
    var e = etat();

    if (!e.seances.length) {
      hote.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Rien à recouper' }),
        'Le suivi se construit à partir de tes séances : ancienneté par exercice, douleurs et leurs 72 h, volume AW.'));
      return;
    }

    var btHisto = h('button', { class: 'bt bt-large', style: 'margin-bottom:12px',
                                text: 'Historique par exercice' });
    btHisto.addEventListener('click', function () { A.vues.exercice.choisir(); });
    hote.appendChild(btHisto);

    hote.appendChild(blocVingtQuatre(e, function () { rendre(hote); }));
    hote.appendChild(blocSollicitation(e));
    hote.appendChild(blocStructures(e));
    hote.appendChild(blocDouleurs(e));
    hote.appendChild(blocPentes(e));
    hote.appendChild(blocVolume(e));
    hote.appendChild(blocRecup(e));
    hote.appendChild(blocForces(e));
    hote.appendChild(blocMuscles(e));
  }

  A.vues = A.vues || {};
  /* SANS_TRACE_ATTENDUS est exposé pour le banc : c'est lui qui vérifie que
     cette liste et celle du modèle se recouvrent exactement. */
  A.vues.suivi = { rendre: rendre, titre: function () { return 'Suivi'; },
                   SANS_TRACE_ATTENDUS: SANS_TRACE_ATTENDUS };
})(window.App || (window.App = {}));
