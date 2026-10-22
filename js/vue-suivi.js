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
     la carte des muscles : les planches de Gray, cliquables

     Il y avait ici un schéma de bandes dessiné à la main. Il a été RETIRÉ :
     il ne ressemblait pas à un bras, et ça a été dit deux fois. Le remplacer
     par des contours calculés l'avait rendu moins laid, pas plus juste.

     Ce sont maintenant les gravures de Gray (1918, domaine public), avec des
     polygones transparents posés PAR-DESSUS — teintés selon la charge et
     cliquables. On garde donc ce qu'une image matricielle ne sait pas faire,
     se teinter muscle par muscle, sans renoncer à l'anatomie réelle.

     Aucune planche ne montre le membre entier : c'est un atlas, pas une
     affiche. Cinq faces, donc, choisies par une rangée de puces, et un
     muscle peut figurer sur plusieurs.

     Les polygones sont en pourcentage de la planche et le SVG s'étire
     dessus : rien ne se décale quand la largeur de l'écran change.
     ------------------------------------------------------------------ */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(nom, attrs) {
    var n = document.createElementNS(SVG_NS, nom);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

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

    /* --- la carte : une planche, des zones teintées --- */
    var maxM = A.m.MUSCLES.reduce(function (m, x) {
      return Math.max(m, c.parMuscle[x.id] || 0);
    }, 0) || 1;

    var detail = h('div', { class: 'item-resume', style: 'min-height:3.2em;margin-top:6px' });

    /* Ce qu'on sait d'un muscle, dit en entier : le nom, ce qu'il fait, ce
       qu'il mobilise, son insertion s'il en partage une, et de quoi aller
       voir la planche en grand. C'est la même chose au doigt sur la carte et
       sur une barre. */
    function direMuscle(id, n) {
      var m = A.m.muscle(id);
      A.ui.vider(detail);
      var marques = [m.quoi];
      marques.push('mobilise : ' + A.m.nomArticulation(m.articulation).toLowerCase());
      if (m.medial) marques.push('insertion médiale');
      if (m.lateral) marques.push('insertion latérale');
      if (m.profond) marques.push('profond');
      detail.appendChild(h('div', null,
        h('b', { text: m.nom }),
        h('span', { text: ' — ' + n + ' série' + (n > 1 ? 's' : '') })));
      detail.appendChild(h('div', { text: marques.join(' · ') }));
      if (m.aussi) detail.appendChild(h('div', { text: 'dit aussi « ' + m.aussi + ' »' }));
      var bt = h('button', { type: 'button', class: 'bt bt-planche',
                             style: 'margin-top:5px',
                             text: 'Voir ' + m.latin + ' en grand' });
      bt.addEventListener('click', function () { A.panneau.voirPlanche(id); });
      detail.appendChild(bt);
    }

    function chaleur(n) {
      if (!n) return '0';
      return n / maxM > .66 ? '3' : (n / maxM > .33 ? '2' : '1');
    }

    var enrobe = h('div', { class: 'planche-carte' });
    var puces = [];

    function montrerCarte(idCarte) {
      var ct = A.m.carte(idCarte);
      var pl = A.m.planche(ct.planche);
      A.ui.vider(enrobe);
      puces.forEach(function (x) {
        x.bouton.setAttribute('aria-pressed', x.id === idCarte ? 'true' : 'false');
      });

      enrobe.appendChild(h('img', { class: 'planche-fond', src: pl.fichier,
        alt: 'Planche de Gray numéro ' + pl.numero + ' : ' + pl.nom }));

      /* `preserveAspectRatio="none"` : le SVG s'étire exactement sur l'image,
         donc les pourcentages tombent au bon endroit quelle que soit la
         largeur. Avec le réglage par défaut il se centrerait et tout
         glisserait. */
      var svg = svgEl('svg', { class: 'planche-zones', viewBox: '0 0 100 100',
                               preserveAspectRatio: 'none' });
      var zones = [];
      ct.zones.forEach(function (z) {
        var m = A.m.muscle(z.muscle);
        var n = c.parMuscle[z.muscle] || 0;
        var pg = svgEl('polygon', { points: z.points, class: 'zone-planche',
                                    'data-chaleur': chaleur(n),
                                    tabindex: '0', role: 'button',
                                    'aria-label': m.nom + ', ' + n + ' séries' });
        function montrer() {
          zones.forEach(function (x) { x.removeAttribute('data-choisi'); });
          pg.setAttribute('data-choisi', '1');
          direMuscle(z.muscle, n);
        }
        pg.addEventListener('click', montrer);
        pg.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); montrer(); }
        });
        zones.push(pg);
        svg.appendChild(pg);
      });
      enrobe.appendChild(svg);
      legende.textContent = pl.nom + ' — Gray, 1918.';
    }

    var rangee = h('div', { class: 'puces planche-faces' });
    A.m.CARTES.forEach(function (ct) {
      var b = h('button', { type: 'button', class: 'puce', text: ct.nom,
                            'aria-pressed': 'false' });
      b.addEventListener('click', function () { montrerCarte(ct.id); });
      puces.push({ id: ct.id, bouton: b });
      rangee.appendChild(b);
    });

    var legende = h('div', { class: 'item-resume', style: 'margin-top:2px' });
    corps.appendChild(rangee);
    corps.appendChild(enrobe);
    corps.appendChild(legende);
    corps.appendChild(h('div', { class: 'item-resume',
      text: 'Appuie sur un muscle de la planche pour le détail, ou sur son nom '
          + 'dans les barres. Les zones sont posées à l’œil : elles situent, '
          + 'elles ne dissèquent pas.' }));
    corps.appendChild(detail);

    montrerCarte(A.m.CARTES[0].id);

    /* --- les chiffres, muscle par muscle --- */
    var barres = h('div', { class: 'barres barres-serrees barres-muscles', style: 'margin-top:12px' });
    A.m.MUSCLES.slice().sort(function (a, b) {
      return (c.parMuscle[b.id] || 0) - (c.parMuscle[a.id] || 0);
    }).forEach(function (m) {
      var n = c.parMuscle[m.id] || 0;
      if (!n) return;
      /* Le libellé est un BOUTON : il ouvre la planche en grand, sans avoir
         à deviner sur quelle face le muscle se trouve. */
      var lib = h('button', { type: 'button', class: 'barre-nom',
                              text: m.court || m.nom, title: m.nom });
      lib.addEventListener('click', function () { A.panneau.voirPlanche(m.id); });
      barres.appendChild(h('div', { class: 'barre' },
        lib,
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
  A.vues.suivi = { rendre: rendre, titre: function () { return 'Suivi'; } };
})(window.App || (window.App = {}));
