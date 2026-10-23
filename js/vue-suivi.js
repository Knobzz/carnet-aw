/* Suivi — l'app ne décide rien et ne propose aucun programme.
   Elle donne la matière : qui a été sollicité, quand, et ce qui a précédé une douleur. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function etat() { return A.store.etat(); }

  /* Ce que l'ecran retient entre deux rendus. La periode vit dans les
     reglages, donc elle survit a la fermeture ; la region choisie non —
     c'est un geste de lecture, pas un reglage, et la retrouver en rouvrant
     l'app donnerait un ecran filtre sans qu'on se souvienne de l'avoir
     demande. */
  var regionChoisie = null;

  function periodeDe(e) {
    return A.m.periodeSuivi(e.reglages && e.reglages.periodeSuivi);
  }

  /* Le selecteur, partage par les trois blocs qui comptent une charge.
     Un filtre par bloc laisserait l'ecran dire trois periodes a la fois. */
  function selecteurPeriode(e, refaire) {
    var active = periodeDe(e);
    var bande = h('div', { class: 'periodes', role: 'group',
                           'aria-label': 'Période du suivi' });
    A.m.PERIODES_SUIVI.forEach(function (p) {
      var bt = h('button', { type: 'button', class: 'periode-bt', text: p.nom,
                             'aria-pressed': p.id === active.id ? 'true' : 'false' });
      bt.addEventListener('click', function () {
        if (p.id === active.id) return;
        e.reglages.periodeSuivi = p.id;
        A.store.sauver(true);
        refaire();
      });
      bande.appendChild(bt);
    });
    return bande;
  }

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
  function blocForces(e, periode) {
    var r = A.m.repartitionForces(e, A.m.joursDeLaFenetre(periode.semaines));
    var f = document.createDocumentFragment();
    f.appendChild(section('Mouvements — ' + periode.nom,
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

     Il y a eu une tentative de polygones cliquables posés dessus, teintés
     selon la charge. Elle a été abandonnée : les traits de Gray ne sont pas
     fermés, les hachures font fuir un remplissage, et la direction des
     fibres sépare les groupes et non les muscles voisins, qui sont
     parallèles. Un découpage approximatif posé sur une gravure exacte gêne
     plus qu'il ne renseigne.

     Reste donc la gravure seule, qu'on feuillette par faces, et les
     chiffres dans les barres. Le détail d'un muscle s'ouvre par son nom.
     ------------------------------------------------------------------ */

  function blocMuscles(e, periode, refaire) {
    var f = document.createDocumentFragment();
    var jours = A.m.joursDeLaFenetre(periode.semaines);
    var c = A.m.chargeParMuscle(e, jours);

    /* Une region choisie sur le buste ne garde que SES muscles. On nomme le
       filtre et on donne le moyen de l'enlever : un ecran filtre sans le
       dire se lit comme un ecran vide. */
    var region = regionChoisie
      ? A.m.REGIONS_MUSCLE.filter(function (r) { return r.id === regionChoisie; })[0]
      : null;
    f.appendChild(section('Muscles — ' + (region ? region.nom : periode.nom),
      region
        ? 'Filtré sur la région que tu as touchée, sur ' + periode.nom
        + '. Touche-la de nouveau pour revoir tous les muscles.'
        : 'Ce qui tire, et combien. Les structures disent ce qui encaisse ; '
        + 'les muscles disent ce qui travaille.'));

    if (region) {
      var retirer = h('button', { type: 'button', class: 'bt bt-petit',
                                  style: 'margin:0 0 10px',
                                  text: '← tous les muscles' });
      retirer.addEventListener('click', function () {
        regionChoisie = null;
        refaire();
      });
      f.appendChild(retirer);
    }
    function retenu(m) { return !regionChoisie || m.groupe === regionChoisie; }

    if (!c.total) {
      f.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Aucun muscle renseigné' }),
        'Ouvre la fiche d’un exercice : coche ses mouvements, puis demande la proposition. '
      + 'Elle remplit les muscles d’après l’anatomie, et tu corriges.'));
      return f;
    }

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });

    /* --- les muscles sollicités, qu'on fait défiler au doigt ---
       Il y a eu ici un schéma dessiné à la main, puis des polygones
       cliquables posés sur les gravures : les deux ont échoué à suivre les
       contours réels. Le problème est résolu autrement — chaque muscle a
       SON illustration, le membre entier avec lui seul en rouge, et la
       forme y est juste par construction.

       On les fait défiler d'un glissement du doigt, dans l'ordre des barres
       — du plus sollicité au moins. Appuyer sans glisser ouvre l'image en
       grand. Les deux gestes sur la même zone, donc : il faut distinguer le
       glissement de l'appui, et c'est la distance parcourue qui tranche. */
    var maxM = A.m.MUSCLES.reduce(function (m, x) {
      return Math.max(m, c.parMuscle[x.id] || 0);
    }, 0) || 1;

    /* Sans region choisie, on ne montre que ce qui a travaille : c'est la
       question « qu'est-ce qui tire ». Avec une region, on montre TOUS ses
       muscles, charges ou non — parce que la planche d'un muscle jamais
       travaille n'a AUCUN autre chemin dans l'app. Trente-six planches
       livrees, et seules celles qu'on avait deja entrainees etaient
       visibles : un cul-de-sac que le filtre par region a rendu visible. */
    var classes = A.m.MUSCLES.slice().sort(function (a, b) {
      return (c.parMuscle[b.id] || 0) - (c.parMuscle[a.id] || 0);
    }).filter(function (m) {
      return retenu(m) && (regionChoisie || (c.parMuscle[m.id] || 0) > 0);
    });

    var chargesIci = classes.filter(function (m) { return (c.parMuscle[m.id] || 0) > 0; });
    if (regionChoisie && !chargesIci.length) {
      corps.appendChild(h('div', { class: 'item-resume',
        text: 'Aucun muscle de cette région n’a travaillé sur ' + periode.nom
            + '. Leurs planches restent consultables ci-dessous.' }));
    }
    if (classes.length) {
      var rang = 0;
      var vignette = h('img', { class: 'planche-fond' });
      var titre = h('div', { class: 'item-resume', style: 'margin-top:2px' });
      var compteur = h('div', { class: 'planche-rang', 'aria-hidden': 'true' });
      var cadre = h('button', { type: 'button', class: 'planche-carte planche-bouton' },
        vignette, compteur);

      function montrer(i) {
        /* On boucle : arrivé au dernier, le geste suivant revient au
           premier. Un cul-de-sac au bout d'une liste qu'on feuillette au
           doigt donne l'impression que le geste ne marche plus. */
        rang = ((i % classes.length) + classes.length) % classes.length;
        var m = classes[rang];
        var n = c.parMuscle[m.id] || 0;
        vignette.setAttribute('src', A.m.imageDuMuscle(m.id));
        vignette.setAttribute('alt', m.nom + ', teinté en rouge sur le membre supérieur');
        cadre.setAttribute('aria-label', m.nom + ', ' + n + ' séries — voir en grand');
        compteur.textContent = (rang + 1) + ' / ' + classes.length;
        A.ui.vider(titre);
        titre.appendChild(h('b', { text: m.nom }));
        titre.appendChild(h('span', { text: ' — ' + n + ' série' + (n > 1 ? 's' : '')
                                          + ' · ' + m.quoi + '.' }));
      }

      /* Un glissement, ce n'est pas un appui : on mesure la distance. Sous
         le seuil, c'est un appui et l'image s'ouvre ; au-dessus, c'est un
         geste de défilement et l'appui ne doit PAS partir. */
      var SEUIL = 36;
      var departX = null, departY = null, aGlisse = false;
      cadre.addEventListener('pointerdown', function (ev) {
        departX = ev.clientX; departY = ev.clientY; aGlisse = false;
      });
      cadre.addEventListener('pointerup', function (ev) {
        if (departX == null) return;
        var dx = ev.clientX - departX, dy = ev.clientY - departY;
        departX = null;
        /* Horizontal ET franc : un doigt qui part en diagonale fait
           défiler la page, pas la liste. */
        if (Math.abs(dx) > SEUIL && Math.abs(dx) > Math.abs(dy)) {
          aGlisse = true;
          montrer(rang + (dx < 0 ? 1 : -1));
        }
      });
      cadre.addEventListener('click', function (ev) {
        if (aGlisse) { aGlisse = false; ev.preventDefault(); return; }
        A.panneau.voirPlanche(classes[rang].id);
      });
      /* Au clavier, les flèches font la même chose : le glissement ne doit
         pas être le SEUL chemin. */
      cadre.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowRight') { ev.preventDefault(); montrer(rang + 1); }
        else if (ev.key === 'ArrowLeft') { ev.preventDefault(); montrer(rang - 1); }
      });

      montrer(0);
      corps.appendChild(cadre);
      corps.appendChild(titre);
      corps.appendChild(h('div', { class: 'item-resume',
        text: classes.length > 1
          ? 'Glisse du doigt sur l’image pour passer d’un muscle à l’autre, '
          + 'du plus sollicité au moins. Appuie pour la voir en grand.'
          : 'Appuie sur l’image pour la voir en grand.' }));
    }

    /* --- les chiffres, muscle par muscle --- */
    var barres = h('div', { class: 'barres barres-serrees barres-muscles', style: 'margin-top:12px' });
    A.m.MUSCLES.slice().sort(function (a, b) {
      return (c.parMuscle[b.id] || 0) - (c.parMuscle[a.id] || 0);
    }).forEach(function (m) {
      var n = c.parMuscle[m.id] || 0;
      if (!retenu(m)) return;
      if (!n && !regionChoisie) return;
      /* Le libellé est un BOUTON : il ouvre la planche en grand, avec le nom
         latin, ce que le muscle fait et ce qu'il mobilise. C'est le seul
         chemin vers le détail depuis que les zones cliquables ont été
         retirées, et il est plus sûr : il ne suppose aucun contour. */
      var lib = h('button', { type: 'button', class: 'barre-nom',
                              text: m.court || m.nom, title: m.nom });
      lib.addEventListener('click', function () { A.panneau.voirPlanche(m.id); });
      barres.appendChild(h('div', { class: 'barre' + (n ? '' : ' barre-vide') },
        lib,
        h('div', { class: 'barre-piste' },
          h('i', { class: 'aw', style: 'width:' + (n ? n / maxM * 100 : 0) + '%' })),
        h('span', { class: 'barre-val', text: n ? n + ' sér.' : 'jamais' })));
    });
    corps.appendChild(barres);

    /* L'insertion commune se compte, et se dit en une ligne. Elle est utile
       pour relier la carte à une douleur de coude — pas pour en faire le
       sujet de l'écran. */
    var ep = A.m.chargeEpicondyle(e, jours);
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
    var arts = A.m.chargeParArticulation(e, jours);
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

    /* --- le croisement mouvements × muscles ---
       Un exercice porte souvent PLUSIEURS gestes : on pronate et on curle
       dans le meme mouvement. Ses muscles comptent alors pour chacun de ses
       gestes, et c'est juste — ils ont travaille. Ce qui ne l'etait pas,
       c'est le titre : « ce qu'il fait travailler » se lit comme une
       affirmation sur le MOUVEMENT, alors que le compte porte sur TES
       EXERCICES. Le carnet connait les deux, et il tient la reponse
       anatomique a cote (musclesProposes) : on marque donc les muscles que
       le mouvement lui-meme ne produit PAS, au lieu de les fondre. */
    var croise = A.m.musclesParMouvement(e, jours).filter(function (x) { return x.series > 0; });
    if (croise.length) {
      f.appendChild(section('Tes exercices de chaque mouvement, muscle par muscle',
        'Un exercice qui porte plusieurs gestes compte ses muscles pour chacun. '
      + 'Une étoile marque ceux que le mouvement lui-même ne produit pas : ils '
      + 'viennent d’un autre geste du même exercice.'));
      var c2 = h('div', { class: 'carte' });
      var corps2 = h('div', { class: 'carte-corps', style: 'padding:8px 12px 10px' });
      var aUneEtoile = false;
      croise.forEach(function (x) {
        var ids = Object.keys(x.parMuscle).sort(function (a, b) {
          return x.parMuscle[b] - x.parMuscle[a];
        });
        /* Ce que le mouvement produit VRAIMENT, lu dans le modele et non
           deduit de l'exercice. */
        var duGeste = (A.m.musclesProposes([x.force], null, '', null) || {}).muscles || [];
        corps2.appendChild(h('div', { class: 'item-ligne', style: 'padding:6px 0' },
          h('b', { text: x.nom }),
          h('span', { text: x.series + ' sér.' })));
        corps2.appendChild(h('div', { class: 'item-resume', style: 'margin:-4px 0 4px;font-size:.76rem',
          text: ids.length
            ? ids.map(function (id) {
                var etoile = duGeste.indexOf(id) < 0;
                if (etoile) aUneEtoile = true;
                return A.m.nomMuscle(id) + ' ' + x.parMuscle[id] + (etoile ? ' *' : '');
              }).join(', ')
            : 'aucun muscle renseigné sur les exercices de ce mouvement' }));
      });
      if (aUneEtoile) {
        corps2.appendChild(h('div', { class: 'item-resume',
          style: 'margin-top:6px;font-size:.72rem',
          text: '* ce muscle ne vient pas de ce mouvement : il est sur un exercice '
              + 'qui porte aussi un autre geste.' }));
      }
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

  /* ------------------------------------------------------------------
     Ce qu'on travaille, par region du corps

     Deux silhouettes, parce que quatre des sept regions ne se montrent que
     d'un seul cote : le biceps et le triceps sont LE MEME segment vu de
     face et de dos. Une silhouette unique devrait en cacher un des deux.

     Le contour est dessine UNE fois et sert de DECOUPE a toutes les
     regions : chaque region n'est qu'un polygone grossier que le contour
     taille au bord reel du corps. Les seules limites que ce dessin AFFIRME
     sont les coupes internes, et chacune a son repere anatomique —
     insertion du deltoide, pli du coude, pli du poignet.

     Le buste s'arrete aux hanches : aucun des muscles du carnet n'est dans
     les jambes, elles ne portaient rien.

     Deux schemas ont echoue ici avant : un dessin a la main, puis des
     polygones poses sur les gravures. Les deux cherchaient les contours de
     chaque MUSCLE sur une gravure exacte, et l'oeil voyait la vraie limite
     juste a cote de la fausse. Ici ce sont SEPT regions sur un schema
     autonome, qui n'annonce aucune exactitude anatomique de detail.

     Le total, le tableau et les semaines sortent TOUS de chargeParSemaine.
     Deux sources, meme proches, finissent par se contredire : une fenetre
     en jours et une fenetre en semaines ISO ne couvrent deja pas les memes
     jours, et l'ecart est invisible a l'oeil.
     ------------------------------------------------------------------ */
  var NSVG = 'http://www.w3.org/2000/svg';

  function nsvg(nom, attrs, enfants) {
    var e = document.createElementNS(NSVG, nom);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    (enfants || []).forEach(function (x) { e.appendChild(x); });
    return e;
  }

  /* Un corps au canon classique : 7,5 tetes de haut, bras a 0,44 de la
     hauteur. Mesure, pas estime — la premiere version faisait 9,7 tetes
     avec des bras de 5,8, et elle ne ressemblait a personne.

     Face et dos sont SYMETRIQUES : on n'ecrit que la moitie droite et le
     miroir est calcule. Ecrire les deux a la main, c'est se garantir une
     asymetrie qu'on ne verra pas. */
  var DEMI_CORPS = [
    [53.6, 4, 56.6, 8.5, 56.6, 14], [56.6, 19, 55.4, 22.3, 53.6, 24],
    [53.6, 26, 53.6, 27, 53.6, 28.5], [58.5, 29.5, 64.5, 30.5, 69, 32.5],
    [72.5, 34, 74.5, 37, 75.5, 41], [77, 46, 78.5, 51, 79.5, 56],
    [80.5, 59, 81, 61, 81.2, 63], [82, 67, 83, 71, 83.5, 75],
    [84, 77.5, 84.2, 79, 84.2, 80.5], [84.5, 84, 84, 88, 83, 90.5],
    [82, 92.5, 80, 93, 78.8, 91.5], [78, 90, 77.6, 87, 77.5, 84],
    [77.4, 82, 77.3, 81, 77.2, 80], [76.6, 76, 75.6, 72, 74.8, 68],
    [74.2, 65, 73.8, 63, 73.6, 61], [72.6, 56, 70.5, 50, 68.5, 45],
    [67.8, 43.5, 66.8, 42.5, 65.8, 42], [65.2, 48, 64.2, 55, 63.5, 61],
    [63, 64, 62.5, 67, 62.2, 70], [62.5, 74, 63.5, 78, 64.5, 82],
    [64.8, 86, 64.8, 90, 64.8, 96], [60, 96, 55, 96, 50, 96]
  ];
  var CONTOUR = (function () {
    var d = 'M 50 4', m = function (x) { return 100 - x; };
    DEMI_CORPS.forEach(function (x) { d += ' C ' + x.join(' '); });
    /* Le retour : segments a l'envers, points de controle echanges, x en
       miroir. Le dernier point retombe EXACTEMENT sur le depart, donc le Z
       est de longueur nulle et aucun trait ne traverse le corps. */
    for (var i = DEMI_CORPS.length - 1; i >= 0; i--) {
      var x = DEMI_CORPS[i];
      var p = i === 0 ? [50, 4] : [DEMI_CORPS[i - 1][4], DEMI_CORPS[i - 1][5]];
      d += ' C ' + m(x[2]) + ' ' + x[3] + ' ' + m(x[0]) + ' ' + x[1]
         + ' ' + m(p[0]) + ' ' + p[1];
    }
    return d + ' Z';
  })();

  function miroirChemin(d) {
    return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, function (_, x, y) {
      return (100 - parseFloat(x)) + ' ' + y;
    });
  }

  /* Chaque region est dessinee LA OU SONT SES MUSCLES, et nulle part
     ailleurs. Ce qu'aucun muscle du carnet ne couvre — ventre, bas du dos,
     cou, hanches — reste de la peau neutre. Peindre tout le tronc pour une
     region qui ne tient que le grand pectoral affirmait un travail
     abdominal qui n'a pas eu lieu, et qu'aucun muscle du catalogue ne peut
     representer. */
  var FORMES_REGION = {
    /* Le deltoide : un capuchon arrondi de la clavicule a son insertion au
       tiers superieur du bras. Sa limite interne est le sillon
       delto-pectoral, un vrai repere visible sur un corps. */
    epauleFace:
      'M 58.6 30.2 C 64 30.4 68.6 32.6 72 36.2 C 75 39.4 76.9 43.8 78 48.6' +
      ' C 78.6 51 79 53 79.2 54.8 C 76 54.6 72.2 53 69.4 50.6' +
      ' C 67.4 48.8 66.2 46.6 65.8 44.4 C 64.8 39.4 62 33.2 58.6 30.2 Z',
    /* De dos : le meme capuchon plus l'omoplate, ou s'inserent le grand
       rond et le subscapulaire. */
    epauleDos:
      'M 57.4 29.8 C 63.4 30 68.4 32.4 72 36 C 75 39.2 76.9 43.8 78 48.6' +
      ' C 78.6 51 79 53 79.2 54.8 C 76 54.6 72.2 53 69.4 50.6' +
      ' C 67.6 49 66.4 47 65.9 45 C 63.2 47.4 60.2 49 57.2 49.8' +
      ' C 56.8 44 56.9 34.8 57.4 29.8 Z',
    /* Le grand pectoral : un eventail du sternum vers l'humerus, dont le
       bord inferieur s'arrete a hauteur des cotes. */
    pectoral:
      'M 50.6 32 C 54 31.4 57.4 31.4 59.8 32.4 C 62.4 33.8 64.2 36.6 64.9 39.8' +
      ' C 65.3 42 65 44.2 64 45.8 C 60.6 48.4 55.6 49.8 51 49.8' +
      ' C 50.4 49.8 50.2 49.2 50.2 48.2 C 50.2 42.4 50.3 36 50.6 32 Z',
    /* Le grand dorsal : etroit a l'aisselle, large en bas le long du
       rachis. Le bas du dos sous lui reste neutre. */
    dorsal:
      'M 65.8 45.4 C 64.8 49.4 63.8 54 63 58.6 C 62.4 63 61.9 67.2 61.5 70.6' +
      ' C 58.2 72.2 54.2 73 50.4 73 C 50.4 68 50.4 62 50.4 57.4' +
      ' C 53.6 56.4 56.8 54 59.4 51 C 61.6 48.4 64 46 65.8 45.4 Z',
    /* Le bras : la masse occupe TOUTE la largeur du segment entre
       l'insertion du deltoide et le pli du coude. En faire une bande collee
       au bord externe laissait l'interieur du bras neutre, ce qui disait
       qu'il ne travaille pas. */
    bras:
      'M 66.6 45.8 C 69.8 48.8 73.6 51.4 77.4 53.6' +
      ' C 78.8 56.8 79.9 60 80.7 62.8 C 78.4 63.8 75.6 64.2 73 63.8' +
      ' C 72 58.6 69.8 51.6 66.6 45.8 Z',
    /* L'avant-bras : pleine largeur, renfle pres du coude et effile vers le
       poignet, ou il ne reste que des tendons. */
    avb:
      'M 72.6 64.6 C 75.4 65 78.4 64.8 80.9 64' +
      ' C 82.1 68.2 83.3 72.8 84.1 76.8 C 84.5 78.6 84.7 79.9 84.7 80.9' +
      ' C 82.1 81.7 79.1 82 76.9 81.8' +
      ' C 76.3 77.4 75.1 72 73.9 68.2 C 73.5 66.7 73 65.5 72.6 64.6 Z',
    main:
      'M 76.7 82.7 C 79.3 83 82.3 82.7 84.7 82.1' +
      ' C 84.9 85.7 84.4 89.1 83.3 91 C 82 93 79.8 93.5 78.5 91.8' +
      ' C 77.5 90.3 76.9 87.1 76.7 84.3 Z'
  };


  /* Sur quelle vue chaque region se montre. Une region du catalogue absente
     d'ici n'aurait AUCUNE forme sur le buste : sa charge disparaitrait en
     silence. Le banc verifie la correspondance dans les deux sens. */
  var VUE_REGION = {
    epaule: 'deux', main: 'deux',
    torse_av: 'face', bras_av: 'face', avant_bras_av: 'face',
    torse_ar: 'dos',  bras_ar: 'dos',  avant_bras_ar: 'dos'
  };

  function formesDeLaVue(vue) {
    var face = vue === 'face', l = [];
    function paire(id, d) { l.push([id, d]); l.push([id, miroirChemin(d)]); }
    paire('epaule', face ? FORMES_REGION.epauleFace : FORMES_REGION.epauleDos);
    paire(face ? 'torse_av' : 'torse_ar',
          face ? FORMES_REGION.pectoral : FORMES_REGION.dorsal);
    paire(face ? 'bras_av' : 'bras_ar', FORMES_REGION.bras);
    paire(face ? 'avant_bras_av' : 'avant_bras_ar', FORMES_REGION.avb);
    paire('main', FORMES_REGION.main);
    return l;
  }

  /* Du jaune au rouge fonce en cinq paliers, et le GRIS pour ce qui n'a
     JAMAIS servi — c'est une troisieme chose, pas un palier tres pale.

     L'echelle etait bleu -> rouge jusqu'au 2026-10-23, et son palier median
     etait un gris clair : en theme clair il tombait a 43 du gris du
     « jamais », sous le seuil de ~40 ou deux teintes se confondent. Une
     region moyennement chargee se lisait comme une region jamais touchee.
     La rampe chaude est mesuree : 132 au minimum du gris, 50 au minimum
     entre deux paliers voisins.

     Son point faible connu : le rouge fonce ne contraste qu'a 1,77 avec le
     fond sombre. C'est tenable parce que la couleur ne porte JAMAIS
     l'information seule — la forme est cerclee d'un trait, elle porte son
     total au survol, le chiffre est dans le tableau juste en dessous, et
     toucher une region allume sa ligne. */
  var PALIERS_REGION = ['#ddc05f', '#dd9a39', '#d4691c', '#b83a12', '#99130a'];
  function teinteRegion(valeur, maxi) {
    if (!valeur) return null;
    return PALIERS_REGION[Math.min(4, Math.floor(valeur / maxi * 5))];
  }

  function blocRegions(e, periode, refaire) {
    var f = document.createDocumentFragment();
    var parSem = A.m.chargeParSemaine(e, 'region', periode.semaines);
    if (!parSem) return f;

    var totaux = {}, maxi = 0;
    parSem.cles.forEach(function (c) { totaux[c.id] = 0; });
    parSem.semaines.forEach(function (sem) {
      parSem.cles.forEach(function (c) { totaux[c.id] += sem.par[c.id] || 0; });
    });
    parSem.cles.forEach(function (c) { maxi = Math.max(maxi, totaux[c.id]); });

    f.appendChild(section('Régions — ' + periode.nom,
      'Du jaune au rouge foncé : le rouge foncé est le plus travaillé, le jaune '
    + 'le moins. Le gris n’a jamais servi — ce n’est pas un palier, c’est une '
    + 'troisième chose. Touche une région pour ne garder qu’elle dans les muscles.'));

    if (!maxi) {
      f.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Aucune région renseignée' }),
        'Une région se remplit dès qu’un exercice porte des muscles. '
      + 'Ouvre la fiche d’un exercice pour les renseigner.'));
      return f;
    }

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });

    /* ---- les deux silhouettes ---- */
    var dessin = nsvg('svg', {
      viewBox: '8 0 176 100', class: 'corps-regions', role: 'img',
      'aria-label': 'Charge par région du corps, de face et de dos'
    });
    var defs = nsvg('defs');
    dessin.appendChild(defs);

    ['face', 'dos'].forEach(function (vue, i) {
      var g = nsvg('g', { transform: 'translate(' + (i * 92) + ',0)' });
      var cle = 'decoupe-corps-' + vue;
      defs.appendChild(nsvg('clipPath', { id: cle }, [nsvg('path', { d: CONTOUR })]));
      g.appendChild(nsvg('path', { d: CONTOUR, class: 'peau-corps' }));

      var dedans = nsvg('g', { 'clip-path': 'url(#' + cle + ')' });
      formesDeLaVue(vue).forEach(function (fo) {
        var id = fo[0];
        var c = teinteRegion(totaux[id], maxi);
        var cle2 = parSem.cles.filter(function (x) { return x.id === id; })[0];
        var nom = cle2 ? cle2.nom : id;
        var p = nsvg('path', {
          d: fo[1], fill: c, 'data-region': id,
          class: 'zone-region' + (c ? '' : ' zone-muette')
        });
        var t = nsvg('title');
        var dedansElle = A.m.musclesDeLaRegion(id);
        t.textContent = nom + ' — ' + (totaux[id]
          ? totaux[id] + ' série' + (totaux[id] > 1 ? 's' : '')
          : 'jamais travaillée')
          + (dedansElle.length > 1 ? ' · ' + dedansElle.join(', ') : '');
        p.appendChild(t);
        dedans.appendChild(p);
      });
      g.appendChild(dedans);
      g.appendChild(nsvg('path', { d: CONTOUR, class: 'bord-corps' }));

      /* Les ZONES DE PRISE, par-dessus et hors decoupe : la meme forme avec
         un trait epais transparent. Le dessin reste exact — la main fait
         vraiment 12 px de large a 320 px — et le doigt vise quand meme une
         cible de plus de 24. Grossir le dessin pour atteindre la cible
         aurait menti sur l'anatomie. */
      formesDeLaVue(vue).forEach(function (fo) {
        g.appendChild(nsvg('path', { d: fo[1], class: 'prise-region',
                                     'data-region': fo[0] }));
      });
      g.appendChild(nsvg('path', { class: 'detail-corps', d: vue === 'face'
        ? 'M 43 31 Q 50 34 57 31 M 50 35 L 50 56 M 44 60 Q 50 63 56 60 M 44 68 Q 50 71 56 68'
        : 'M 50 30 L 50 82' }));
      dessin.appendChild(g);
    });
    corps.appendChild(dessin);
    corps.appendChild(h('div', { class: 'vues-corps' },
      h('span', { text: 'de face' }), h('span', { text: 'de dos' })));
    corps.appendChild(h('div', { class: 'echelle-ligne' },
      h('span', { text: 'le moins' }),
      h('span', { class: 'echelle-barre', 'aria-hidden': 'true' }),
      h('span', { text: 'le plus' })));

    /* ---- le tableau, du plus charge au moins ---- */
    var compare = A.m.comparerDeuxPeriodes(e, 'region', periode.semaines) || [];
    var triees = parSem.cles.slice().sort(function (a, b) {
      return totaux[b.id] - totaux[a.id];
    });
    var table = h('table', { class: 'table-regions' });
    table.appendChild(h('tr', {},
      h('th', { text: 'région' }),
      h('th', { class: 'col-n', text: periode.nom }),
      h('th', { class: 'col-n', text: 'écart' })));

    triees.forEach(function (c) {
      var total = totaux[c.id];
      var cmp = compare.filter(function (x) { return x.id === c.id; })[0] || {};
      var ec = cmp.ecart;
      var ou = VUE_REGION[c.id] === 'face' ? 'de face'
             : (VUE_REGION[c.id] === 'dos' ? 'de dos' : 'les deux vues');
      /* Un ecart NUL veut dire « jamais travaillee », pas « stable ». Un
         « = 0 » a cet endroit se lirait comme une stagnation. */
      var txt = ec == null ? 'jamais'
              : (ec > 0 ? '▲ +' + ec : (ec < 0 ? '▼ ' + ec : '= 0'));
      var classe = ec == null ? 'ecart-nul'
                 : (ec > 0 ? 'ecart-haut' : (ec < 0 ? 'ecart-bas' : ''));
      table.appendChild(h('tr', {
          'data-region': c.id, tabindex: '0', role: 'button',
          'aria-label': c.nom + ', ' + (total || 'aucune') + ' séries, ' + ou
        },
        h('td', {},
          h('span', { class: 'carre-region', 'aria-hidden': 'true',
            style: 'background:' + (teinteRegion(total, maxi) || 'var(--fond-3)') }),
          h('span', { text: c.nom }),
          h('span', { class: 'ou-vue', text: ou })),
        h('td', { class: 'col-n', text: total ? String(total) : '—' }),
        h('td', { class: 'col-n ' + classe, text: txt })));
    });
    corps.appendChild(table);

    /* ---- semaine apres semaine ---- */
    if (periode.semaines < 4) {
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin-top:12px',
        text: 'Sur ' + periode.nom + ', il n’y a pas de semaine après semaine à '
            + 'montrer : une ou deux barres mimeraient une tendance au lieu de '
            + 'la dire. Choisis 1 mois ou plus.' }));
      carte.appendChild(corps);
      f.appendChild(carte);
      brancherVedette(corps, refaire);
      return f;
    }

    corps.appendChild(h('div', { class: 'sous-titre', style: 'margin:16px 0 2px',
                                 text: 'Semaine après semaine' }));
    corps.appendChild(h('div', { class: 'item-resume', style: 'margin:0 0 8px',
      text: 'Une semaine sans séance reste visible, à zéro : la faire disparaître '
          + 'compresserait le temps.' }));
    triees.forEach(function (c) {
      if (!totaux[c.id]) return;
      var vals = parSem.semaines.map(function (x) { return x.par[c.id] || 0; });
      var hmax = Math.max.apply(null, vals) || 1;
      var piste = h('div', { class: 'piste-semaine' });
      vals.forEach(function (v, i) {
        piste.appendChild(h('i', {
          class: v ? '' : 'semaine-vide',
          style: 'height:' + (v ? Math.max(4, Math.round(v / hmax * 26)) : 3) + 'px',
          title: parSem.semaines[i].semaine + ' — ' + v + ' série' + (v > 1 ? 's' : '')
        }));
      });
      corps.appendChild(h('div', { class: 'bloc-piste' },
        h('div', { class: 'item-resume', style: 'margin:0 0 2px', text: c.nom }),
        piste));
    });
    corps.appendChild(h('div', { class: 'bornes-semaines' },
      h('span', { text: 'il y a ' + periode.semaines + ' sem.' }),
      h('span', { text: 'cette semaine' })));

    carte.appendChild(corps);
    f.appendChild(carte);
    brancherVedette(corps, refaire);
    return f;
  }

  /* Toucher une region la met en vedette ET filtre le bloc Muscles sur ses
     muscles. Sans le lien dans les deux sens, deux regions de teinte proche
     ne se distinguent pas — c'est exactement le cas du biceps et du triceps,
     qui sont le meme bras vu des deux cotes. */
  function brancherVedette(corps, refaire) {
    [].forEach.call(corps.querySelectorAll('[data-region]'), function (x) {
      if (regionChoisie && x.getAttribute('data-region') === regionChoisie) {
        x.classList.add('vedette');
      }
    });
    function basculer(ev) {
      var cible = ev.target.closest ? ev.target.closest('[data-region]') : null;
      if (!cible) return false;
      var id = cible.getAttribute('data-region');
      regionChoisie = (id === regionChoisie) ? null : id;
      refaire();
      return true;
    }
    corps.addEventListener('click', basculer);
    corps.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      if (basculer(ev)) ev.preventDefault();
    });
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

    /* Refaire l'ecran sans le faire sauter : on repose la page ou elle
       etait. Un filtre qui renvoie en haut de l'onglet fait perdre ce
       qu'on etait en train de lire. */
    var periode = periodeDe(e);
    function refaire() {
      var y = window.scrollY;
      rendre(hote);
      window.scrollTo(0, y);
    }
    hote.appendChild(selecteurPeriode(e, refaire));

    /* L'ordre répond à « qu'est-ce que je regarde en ouvrant l'onglet ».
       D'abord ce qui appelle une décision aujourd'hui — la question du
       lendemain, puis la dernière sollicitation par exercice. Ensuite ce
       qu'on travaille : volume, mouvements, muscles. Les structures et les
       douleurs ferment la marche : ce sont des recoupements, qu'on va
       chercher quand quelque chose fait mal, pas tous les jours. */
    hote.appendChild(blocVingtQuatre(e, function () { rendre(hote); }));
    hote.appendChild(blocSollicitation(e));
    hote.appendChild(blocVolume(e));
    hote.appendChild(blocRecup(e));
    hote.appendChild(blocForces(e, periode));
    hote.appendChild(blocRegions(e, periode, refaire));
    hote.appendChild(blocMuscles(e, periode, refaire));
    hote.appendChild(blocPentes(e));
    hote.appendChild(blocStructures(e));
    hote.appendChild(blocDouleurs(e));
  }

  A.vues = A.vues || {};
  A.vues.suivi = { rendre: rendre, titre: function () { return 'Suivi'; } };
})(window.App || (window.App = {}));
