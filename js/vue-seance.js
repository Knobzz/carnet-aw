/* Séance en cours.

   RÈGLE DE CETTE VUE : une frappe dans un champ ne reconstruit AUCUN nœud
   qui contient un champ. Les gestionnaires d'entrée écrivent dans le modèle,
   rafraîchissent les totaux (textContent sur trois nœuds connus) et sauvent.
   Ajouter / retirer / déplacer insère, retire ou déplace UN nœud — jamais un
   innerHTML de conteneur. C'est ce qui garde le focus au milieu d'un chiffre. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  var hote = null;      // conteneur de la vue
  var seance = null;    // séance affichée
  var refs = null;      // nœuds dont on change le texte sans rien reconstruire

  function etat() { return A.store.etat(); }
  function sauver() { A.store.sauver(); }

  /* ------------------------------------------------------------------
     totaux — trois textContent, rien d'autre
     ------------------------------------------------------------------ */
  function majTotaux() {
    if (!refs) return;
    var v = A.m.volumeSeance(seance);
    refs.nbSeries.textContent = v.seriesFaites + ' / ' + v.series;
    refs.tonnage.textContent = A.m.fmt(Math.round(v.tonnage));

    /* Une seance 100 % gripper a un tonnage nul mais n'est pas vide : la case
       AW bascule alors sur le compte de series, qui lui est parlant. */
    if (v.tonnageAw > 0 || !v.seriesAw) {
      refs.tonnageAw.textContent = A.m.fmt(Math.round(v.tonnageAw));
      refs.etiquetteAw.textContent = 'dont AW';
    } else {
      refs.tonnageAw.textContent = String(v.seriesAw);
      refs.etiquetteAw.textContent = 'séries AW';
    }
    var bouts = [];
    if (v.repsTotal) bouts.push(A.m.fmt(v.repsTotal) + ' reps au total');
    /* Le temps sous tension est l'autre façon de charger un tendon : il se lit
       à côté des reps, pas dans un écran à part. */
    if (v.tempsSousTension) bouts.push(A.m.texteTempsSousTension(v));
    refs.reps.textContent = bouts.join(' · ');
    refs.exclus.textContent = A.m.texteHorsTonnage(v);
  }

  /* ------------------------------------------------------------------
     numérotation des séries d'un exercice : on n'écrit que le libellé
     ------------------------------------------------------------------ */
  /* Relit la colonne PRECEDENT de toutes les lignes d'un exercice, sans
     reconstruire le moindre champ de saisie : on ne touche qu'au texte du
     bouton et a son gestionnaire. Necessaire des qu'un type de serie change,
     puisque le type decide du rang. */
  function rafraichirPrecedents(exo, listeNoeud) {
    Array.prototype.forEach.call(listeNoeud.children, function (ligne, i) {
      var s = exo.series[i];
      if (!s) return;
      var bt = ligne.querySelector('.serie-prec');
      var prec = A.m.dernierePerf(etat(), exo.slug, s.type, A.m.rangParType(exo.series, i), seance.id);
      var txt = A.m.texteDernierePerf(prec);
      bt.textContent = txt || '—';
      if (txt) {
        delete bt.dataset.vide;
        bt.title = 'Séance du ' + A.m.dateCourte(prec.date) + ' — appuyer pour recopier';
      } else {
        bt.dataset.vide = '1';
        bt.removeAttribute('title');
      }
      bt._prec = prec;
    });
  }

  function renumeroter(exo, listeNoeud) {
    var n = 0;
    Array.prototype.forEach.call(listeNoeud.children, function (ligne, i) {
      var s = exo.series[i];
      if (!s) return;
      var bt = ligne.querySelector('.serie-num');
      if (s.type === 'normale') { n += 1; bt.textContent = String(n); }
      else bt.textContent = A.m.TYPES_SERIE[s.type].lettre;
      bt.dataset.type = s.type;
      bt.title = A.m.TYPES_SERIE[s.type].nom;
      bt.setAttribute('aria-label', 'Série ' + (i + 1) + ' — ' + A.m.TYPES_SERIE[s.type].nom + ', changer le type');
    });
  }

  /* ------------------------------------------------------------------
     une ligne de série
     ------------------------------------------------------------------ */
  function ligneSerie(exo, serie, listeNoeud) {
    var tc = A.m.typeCharge(exo.typeCharge);
    var cols = A.m.colonnes(exo);
    var ligne = h('div', { class: 'serie' + (serie.faite ? ' faite' : ''),
                           'data-cols': String(cols.length) });

    /* 1. numéro / type */
    var num = h('button', { type: 'button', class: 'serie-num' });
    num.addEventListener('click', function () {
      /* Le RPE est ici AUSSI : l'appui long sur le ✓ est rapide mais ne
         s'invente pas. Un geste qui n'existe qu'en appui long est introuvable. */
      A.ui.feuille('Série ' + (exo.series.indexOf(serie) + 1), A.m.ORDRE_TYPES.map(function (t) {
        return { lettre: A.m.TYPES_SERIE[t].lettre || '#', nom: A.m.TYPES_SERIE[t].nom,
                 action: function () {
                   serie.type = t;
                   renumeroter(exo, listeNoeud);
                   /* Le type decide du rang : la colonne PRECEDENT de tout
                      l'exercice doit etre relue, pas seulement cette ligne. */
                   rafraichirPrecedents(exo, listeNoeud);
                   sauver();
                 } };
      }).concat([
        { lettre: 'R', nom: serie.rpe == null ? 'Noter le RPE' : 'RPE : ' + serie.rpe,
          action: ouvrirRpe }
      ]));
    });

    /* 2. précédent — la raison d'être d'un carnet.
       Le rang est celui de la serie DANS SON TYPE : la 2e serie de travail
       reste la 2e serie de travail, qu'on ait insere zero ou trois series d'un
       autre type avant elle. Indexer par rang brut faisait glisser toute la
       colonne d'un cran des qu'une serie etait inseree. */
    var rang = exo.series.indexOf(serie);
    var rangType = A.m.rangParType(exo.series, rang);
    var prec = A.m.dernierePerf(etat(), exo.slug, serie.type, rangType, seance.id);
    var txtPrec = A.m.texteDernierePerf(prec);
    var btPrec = h('button', { type: 'button', class: 'serie-prec', text: txtPrec || '—' });
    if (!txtPrec) btPrec.dataset.vide = '1';
    else {
      btPrec.title = 'Séance du ' + A.m.dateCourte(prec.date) + ' — appuyer pour recopier';
      btPrec.setAttribute('aria-label', 'Précédent : ' + txtPrec + '. Recopier dans les champs.');
    }

    /* 3-N. les colonnes de saisie — une, deux ou trois selon l'exercice.
       La cible du programme est le PLACEHOLDER : visible, mais pas déjà
       saisie — on voit ce qui a été corrigé. */
    var champs = {};
    cols.forEach(function (id) {
      var def = A.m.colonne(id);
      champs[id] = h('input', { class: 'serie-saisie', type: 'text',
        inputmode: def.mode(tc), enterkeyhint: 'next',
        value: serie[def.reel] || '', placeholder: serie[def.cible] || def.label(tc),
        'aria-label': def.label(tc) + ', série ' + (rang + 1) + ' de ' + exo.nom });
      champs[id].addEventListener('input', function () {
        serie[def.reel] = champs[id].value;
        majTotaux(); sauver();
      });
    });

    /* Au clavier du téléphone : « suivant » passe au champ d'à côté, « terminé »
       sur le DERNIER valide la série et referme le clavier. Deux ou trois
       gestes, pouce jamais levé. Le dernier champ dépend des colonnes : c'est
       pour ça qu'on chaîne la liste au lieu de nommer les champs. */
    cols.forEach(function (id, i) {
      var suivant = champs[cols[i + 1]];
      if (!suivant) champs[id].setAttribute('enterkeyhint', 'done');
      champs[id].addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (suivant) { suivant.focus(); suivant.select(); return; }
        champs[id].blur();
        if (!serie.faite) ok.click();
      });
    });

    /* Le gestionnaire lit btPrec._prec et non la valeur figee a la
       construction : changer le type d'une serie change ce qui sera recopie. */
    btPrec._prec = prec;
    btPrec.addEventListener('click', function () {
      var p = btPrec._prec;
      if (!p) return;
      /* On ne recopie que dans les colonnes affichées : une valeur posée dans
         un champ invisible ne se corrige pas, et compterait sans se voir. */
      cols.forEach(function (id) {
        var def = A.m.colonne(id), val = p[id === 'charge' ? 'charge' : id] || '';
        champs[id].value = val;
        serie[def.reel] = val;
      });
      majTotaux(); sauver();
      A.ui.toast('Recopié : ' + A.m.texteDernierePerf(p));
    });

    /* 5. le ✓ — valide ET lance le repos */
    var ok = h('button', { type: 'button', class: 'serie-ok',
                           'aria-pressed': serie.faite ? 'true' : 'false',
                           'aria-label': 'Valider la série. Appui long : noter le RPE.' });
    ok.appendChild(A.ui.svg(A.ui.CHEMIN_OK));

    /* Le RPE de la serie s'affiche en pastille sur le ✓ : il ne prend pas de
       colonne, et la ligne reste a cinq champs comme prevu. */
    var pastilleRpe = null;
    function majRpe() {
      if (serie.rpe == null) {
        if (pastilleRpe) { pastilleRpe.remove(); pastilleRpe = null; }
        return;
      }
      if (!pastilleRpe) { pastilleRpe = h('span', { class: 'serie-rpe' }); ligne.appendChild(pastilleRpe); }
      pastilleRpe.textContent = serie.rpe;
    }

    function ouvrirRpe() {
      A.ui.feuille('RPE — série ' + (exo.series.indexOf(serie) + 1), [6, 7, 8, 9, 10].map(function (v) {
        return { lettre: String(v),
                 nom: ({ 6: 'il restait 4 reps', 7: 'il restait 3 reps', 8: 'il restait 2 reps',
                         9: 'il restait 1 rep', 10: 'rien de plus' })[v],
                 action: function () { serie.rpe = v; majRpe(); sauver(true); } };
      }).concat([
        { nom: 'Effacer le RPE', action: function () { serie.rpe = null; majRpe(); sauver(true); } }
      ]));
    }

    /* Appui long : chemin rapide, sans quitter la ligne. */
    var minuteurLong = null, longFait = false;
    ok.addEventListener('pointerdown', function () {
      longFait = false;
      clearTimeout(minuteurLong);
      minuteurLong = setTimeout(function () { longFait = true; ouvrirRpe(); }, 550);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      ok.addEventListener(ev, function () { clearTimeout(minuteurLong); });
    });
    ok.addEventListener('click', function () {
      if (longFait) { longFait = false; return; }   // l'appui long a deja agi
      serie.faite = !serie.faite;
      ok.setAttribute('aria-pressed', serie.faite ? 'true' : 'false');
      ligne.classList.toggle('faite', serie.faite);
      if (serie.faite) {
        serie.faiteA = new Date().toISOString();
        /* Rien de saisi ? On fige la cible comme valeur réelle : valider veut
           dire « fait comme prévu », pas « fait, valeur inconnue ». */
        cols.forEach(function (id) {
          var def = A.m.colonne(id);
          if (!serie[def.reel] && serie[def.cible]) {
            serie[def.reel] = serie[def.cible];
            champs[id].value = serie[def.cible];
          }
        });
        var r = exo.series.indexOf(serie) + 1;
        A.ui.chrono.demarrer(exo.reposSecondes, exo.nom + ' · série ' + r);
      } else {
        serie.faiteA = null;
      }
      majTotaux();
      sauver(true);
    });

    ligne.appendChild(num);
    ligne.appendChild(btPrec);
    cols.forEach(function (id) { ligne.appendChild(champs[id]); });
    ligne.appendChild(ok);
    majRpe();
    return ligne;
  }

  /* ------------------------------------------------------------------
     un exercice
     ------------------------------------------------------------------ */
  function blocExercice(exo) {
    var bloc = h('div', { class: 'exo' });
    var tc = A.m.typeCharge(exo.typeCharge);

    var titre = h('h3', { text: exo.nom });
    var jetons = h('span', { class: 'enrobe' });
    if (exo.aw) jetons.appendChild(h('span', { class: 'jeton', text: 'AW' }));

    var menu = h('button', { class: 'bt-icone', text: '⋯', 'aria-label': 'Options de ' + exo.nom });
    var entete = h('div', { class: 'exo-entete' },
      h('div', {}, h('div', { class: 'exo-titre' }, titre, jetons)), menu);
    bloc.appendChild(entete);

    /* La consigne est une instruction d'exécution : elle est rendue visible,
       pas reléguée en petit gris sous le titre. */
    var consigne = h('div', { class: 'consigne', text: exo.consigne || '' });
    if (!exo.consigne) consigne.style.display = 'none';
    bloc.appendChild(consigne);

    var meta = h('div', { class: 'exo-meta' });
    function majMeta() {
      A.ui.vider(meta);
      meta.appendChild(h('span', { text: 'Repos ' + exo.reposSecondes + ' s' }));
      if (exo.cote) meta.appendChild(h('span', { class: 'jeton jeton-cote', text: A.m.nomCote(exo.cote) }));
      if (exo.prise) meta.appendChild(h('span', { class: 'jeton', text: 'Prise ' + A.m.nomPrise(exo.prise).toLowerCase() }));
      if (tc.id !== 'kg') meta.appendChild(h('span', { text: tc.nom }));
      (exo.outils || []).forEach(function (o) {
        meta.appendChild(h('span', { class: 'jeton jeton-outil', text: o }));
      });
      if ((exo.structures || []).length) {
        meta.appendChild(h('span', { text: exo.structures.map(A.m.nomStructure).join(' · ') }));
      }
      if ((exo.forces || []).length) {
        meta.appendChild(h('span', { text: exo.forces.map(A.m.nomForce).join(' · ') }));
      }
    }
    majMeta();
    bloc.appendChild(meta);

    var zone = h('div', { class: 'series' });
    var entete = h('div', { class: 'serie-entete' });
    function majEntete() {
      A.ui.vider(entete);
      var cols = A.m.colonnes(exo);
      entete.dataset.cols = String(cols.length);
      entete.appendChild(h('span', { text: 'Série' }));
      entete.appendChild(h('span', { text: 'Précédent' }));
      cols.forEach(function (id) {
        entete.appendChild(h('span', { text: A.m.colonne(id).label(tc) }));
      });
      entete.appendChild(h('span'));
    }
    majEntete();
    zone.appendChild(entete);

    var liste = h('div');
    exo.series.forEach(function (s) { liste.appendChild(ligneSerie(exo, s, liste)); });
    zone.appendChild(liste);

    var btPlus = h('button', { class: 'bt bt-petit bt-fantome', text: '+ Série' });
    btPlus.addEventListener('click', function () {
      var modele = exo.series[exo.series.length - 1];
      var s = A.m.serieSeanceVierge(modele ? { type: modele.type,
                                               repsCible: modele.repsCible,
                                               chargeCible: modele.chargeCible,
                                               dureeCible: modele.dureeCible } : {});
      exo.series.push(s);
      liste.appendChild(ligneSerie(exo, s, liste));   // UN nœud ajouté
      renumeroter(exo, liste);
      rafraichirPrecedents(exo, liste);
      majTotaux(); sauver();
    });

    var btMoins = h('button', { class: 'bt bt-petit bt-fantome', text: '− Série' });
    btMoins.addEventListener('click', function () {
      if (exo.series.length <= 1) { A.ui.toast('Un exercice garde au moins une série.'); return; }
      exo.series.pop();
      liste.removeChild(liste.lastChild);             // UN nœud retiré
      renumeroter(exo, liste);
      rafraichirPrecedents(exo, liste);
      majTotaux(); sauver();
    });

    zone.appendChild(h('div', { class: 'serie-actions' }, btMoins, btPlus));
    bloc.appendChild(zone);

    renumeroter(exo, liste);

    menu.addEventListener('click', function () {
      var i = seance.exercices.indexOf(exo);
      A.ui.feuille(exo.nom, [
        { nom: 'Voir l’historique', action: function () {
            A.vues.exercice.ouvrir(exo.slug, exo.nom);
          } },
        { nom: 'Modifier l’exercice', action: function () {
            A.panneau.editerExercice(exo, {}, function () {
              titre.textContent = exo.nom;
              A.ui.vider(jetons);
              if (exo.aw) jetons.appendChild(h('span', { class: 'jeton', text: 'AW' }));
              consigne.textContent = exo.consigne || '';
              consigne.style.display = exo.consigne ? '' : 'none';
              tc = A.m.typeCharge(exo.typeCharge);
              majMeta();
              majEntete();
              /* Changer les colonnes change les champs de chaque ligne : il
                 faut les reconstruire. La règle « on ne re-rend pas une liste
                 qui contient des champs » vise la FRAPPE ; ici l'utilisateur
                 vient de fermer un panneau, personne n'a le doigt sur un
                 champ, et le re-rendu est le geste qu'il a demandé. */
              A.ui.vider(liste);
              exo.series.forEach(function (s) { liste.appendChild(ligneSerie(exo, s, liste)); });
              renumeroter(exo, liste);
              rafraichirPrecedents(exo, liste);
              majTotaux(); sauver();
            });
          } },
        { nom: 'Dupliquer dans la séance', action: function () {
            var copie = A.m.exerciceSeanceVierge({
              nom: exo.nom, aw: exo.aw, typeCharge: exo.typeCharge, forces: exo.forces,
              structures: exo.structures, outils: exo.outils,
              consigne: exo.consigne, reposSecondes: exo.reposSecondes,
              series: exo.series.map(function (s) {
                return { type: s.type, repsCible: s.repsCible, chargeCible: s.chargeCible };
              })
            });
            seance.exercices.splice(i + 1, 0, copie);
            A.m.renumeroter(seance.exercices);
            refs.exos.insertBefore(blocExercice(copie), bloc.nextSibling);
            majTotaux(); sauver();
            A.ui.toast('Exercice dupliqué.');
          } },
        i > 0 ? { nom: 'Monter', action: function () {
            if (A.ui.deplacer(seance.exercices, i, -1, refs.exos)) {
              A.m.renumeroter(seance.exercices); sauver();
            }
          } } : null,
        i < seance.exercices.length - 1 ? { nom: 'Descendre', action: function () {
            if (A.ui.deplacer(seance.exercices, i, 1, refs.exos)) {
              A.m.renumeroter(seance.exercices); sauver();
            }
          } } : null,
        { nom: 'Retirer de la séance', classe: 'bt-danger', action: function () {
            A.ui.feuille('Retirer « ' + exo.nom + ' » ?', [
              { nom: 'Oui, retirer', classe: 'bt-danger arme', action: function () {
                  var j = seance.exercices.indexOf(exo);
                  if (j >= 0) seance.exercices.splice(j, 1);
                  A.m.renumeroter(seance.exercices);
                  if (bloc.parentNode) bloc.parentNode.removeChild(bloc);
                  majTotaux(); sauver(true);
                  if (!seance.exercices.length) monter(hote, seance.id);
                } }
            ]);
          } }
      ]);
    });

    return bloc;
  }

  /* ------------------------------------------------------------------
     la vue
     ------------------------------------------------------------------ */
  function monter(conteneur, seanceId) {
    hote = conteneur;
    A.ui.vider(hote);
    refs = null;
    A.ui.garderEcranAllume(etat().reglages.ecranAllume !== false);
    /* Un repos lance avant une fermeture de l'app doit se retrouver au retour. */
    A.ui.chrono.reprendre();

    var e = etat();
    seance = null;
    for (var i = 0; i < e.seances.length; i++) {
      if (e.seances[i].id === seanceId && e.seances[i].type === 'muscu') seance = e.seances[i];
    }
    if (!seance) { accueil(conteneur); return; }

    /* bandeau de provenance */
    var sousTitre = A.m.jourSemaine(seance.date) + ' ' + A.m.dateCourte(seance.date)
                  + (seance.programmeNom ? ' · ' + seance.programmeNom : ' · séance libre');
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:-4px 2px 10px', text: sousTitre }));

    /* totaux */
    refs = {};
    refs.nbSeries = h('dd', { class: 'chiffre', text: '0 / 0' });
    refs.tonnage = h('dd', { class: 'chiffre', text: '0' });
    refs.tonnageAw = h('dd', { class: 'chiffre', text: '0' });
    refs.etiquetteAw = h('dt', { text: 'dont AW' });
    refs.exclus = h('p', { class: 'note-exclus' });
    refs.reps = h('p', { class: 'note-exclus' });
    hote.appendChild(h('dl', { class: 'totaux' },
      h('div', {}, h('dt', { text: 'Séries faites' }), refs.nbSeries),
      h('div', {}, h('dt', { text: 'Volume' }), refs.tonnage),
      h('div', { class: 'aw' }, refs.etiquetteAw, refs.tonnageAw)));
    hote.appendChild(refs.exclus);
    hote.appendChild(refs.reps);

    /* exercices */
    refs.exos = h('div');
    hote.appendChild(refs.exos);
    if (!seance.exercices.length) {
      refs.exos.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Séance vide' }),
        'Ajoute le premier exercice ci-dessous. Rien n’est pré-rempli : le carnet apprend tes exercices à mesure.'));
    } else {
      seance.exercices.forEach(function (ex) { refs.exos.appendChild(blocExercice(ex)); });
    }

    /* ajout d'un exercice à la volée — sans toucher au programme d'origine */
    var btAjout = h('button', { class: 'bt bt-large', text: '+ Ajouter un exercice' });
    btAjout.addEventListener('click', function () {
      var neuf = A.m.exerciceSeanceVierge({});
      A.panneau.editerExercice(neuf, { titre: 'Ajouter un exercice' }, function () {
        var vraiNeuf = A.m.exerciceSeanceVierge(neuf);
        seance.exercices.push(vraiNeuf);
        A.m.renumeroter(seance.exercices);
        if (seance.exercices.length === 1) A.ui.vider(refs.exos);
        refs.exos.appendChild(blocExercice(vraiNeuf));
        majTotaux(); sauver(true);
      });
    });
    hote.appendChild(btAjout);

    hote.appendChild(h('div', { class: 'sous-titre', text: 'Fin de séance' }));

    var carte = h('div', { class: 'carte' });
    var corps = h('div', { class: 'carte-corps' });

    var deduite = A.m.dureeReelle(seance);
    var duree = h('input', { class: 'champ', type: 'number', min: '0', inputmode: 'numeric',
                             value: seance.dureeMin == null ? '' : seance.dureeMin,
                             placeholder: deduite == null ? '60' : String(deduite) });
    duree.addEventListener('input', function () {
      var n = parseInt(duree.value, 10);
      seance.dureeMin = isFinite(n) ? n : null; sauver();
    });
    var rpe = h('input', { class: 'champ', type: 'number', min: '1', max: '10', inputmode: 'numeric',
                           value: seance.rpeGlobal == null ? '' : seance.rpeGlobal, placeholder: '1–10' });
    rpe.addEventListener('input', function () {
      var n = parseInt(rpe.value, 10);
      seance.rpeGlobal = isFinite(n) ? Math.min(10, Math.max(1, n)) : null; sauver();
    });
    corps.appendChild(h('div', { class: 'grille-2' },
      A.ui.groupe('Durée (min)', duree), A.ui.groupe('RPE global', rpe)));
    if (deduite != null) {
      corps.appendChild(h('div', { class: 'item-resume', style: 'margin:-6px 0 12px',
        text: 'Déduite des validations : ' + deduite + ' min, du premier ✓ au dernier. '
            + 'Laissée en gris tant que tu ne saisis rien — c\u2019est une mesure, pas une décision.' }));
    }

    corps.appendChild(h('label', { text: 'Douleurs ressenties' }));
    corps.appendChild(A.ui.selecteurDouleurs(seance.douleurs, function (v) {
      seance.douleurs = v; sauver(true);
    }));
    corps.appendChild(h('div', { class: 'item-resume', style: 'margin:6px 0 12px',
      text: 'Un appui pose la zone. Un second ouvre l’intensité 0–10 — facultative, '
          + 'mais c’est elle qui dit si ça monte ou si ça descend. '
          + 'Suivi recoupe ensuite avec ce que tu as fait dans les 72 h précédentes.' }));

    var note = h('textarea', { class: 'champ', placeholder: 'Ce qui a tiré, ce qui a bien pris, le matériel employé…' });
    note.value = seance.note || '';
    note.addEventListener('input', function () { seance.note = note.value; sauver(); });
    corps.appendChild(A.ui.groupe('Note', note));

    carte.appendChild(corps);
    hote.appendChild(carte);

    var btFin = h('button', { class: 'bt bt-large bt-primaire', text: 'Terminer la séance' });
    btFin.addEventListener('click', function () {
      var v = A.m.volumeSeance(seance);
      var finir = function () {
        /* Si rien n'a ete saisi, on inscrit la duree mesuree plutot que de
           laisser un vide : l'information existe, autant la garder. */
        if (seance.dureeMin == null) {
          var d = A.m.dureeReelle(seance);
          if (d != null) seance.dureeMin = d;
        }
        etat().seanceEnCoursId = null;
        A.ui.chrono.arreter();
        A.ui.garderEcranAllume(false);
        A.store.sauver(true);
        A.ui.toast('Séance enregistrée dans le journal.');
        A.app.aller('journal');
      };
      if (v.seriesFaites < v.series) {
        A.ui.feuille(v.series - v.seriesFaites + ' série(s) non validée(s)', [
          { nom: 'Terminer quand même', classe: 'bt-primaire', action: finir },
          { nom: 'Revenir à la séance', action: function () {} }
        ]);
      } else finir();
    });
    hote.appendChild(btFin);

    var btJeter = A.ui.confirmer2(
      h('button', { class: 'bt bt-large bt-danger', style: 'margin-top:8px', text: 'Supprimer cette séance' }),
      'Appuyer encore pour supprimer',
      function () {
        var l = etat().seances, j = -1;
        for (var k = 0; k < l.length; k++) if (l[k].id === seance.id) j = k;
        if (j >= 0) l.splice(j, 1);
        etat().seanceEnCoursId = null;
        A.ui.chrono.arreter();
        A.store.sauver(true);
        A.ui.toast('Séance supprimée.');
        A.app.aller('seance');
      });
    hote.appendChild(btJeter);

    majTotaux();
  }

  /* écran quand aucune séance n'est en cours */
  function accueil(conteneur) {
    hote = conteneur;
    refs = null;
    seance = null;
    A.ui.garderEcranAllume(false);   // pas de séance, pas de verrou
    A.ui.vider(hote);
    var e = etat();
    /* Un programme sans exercice n'est pas lancable : il n'a rien a copier. */
    var actifs = e.programmes.filter(function (p) { return !p.archive && p.exercices.length; });

    if (!actifs.length) {
      hote.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Aucune séance en cours' }),
        'Compose un programme dans l’onglet Programmes, ou démarre une séance libre et ajoute les exercices au fur et à mesure.'));
    } else {
      hote.appendChild(h('div', { class: 'sous-titre', text: 'Lancer depuis un programme' }));
      actifs.forEach(function (p) {
        var n = p.exercices.length;
        var ns = p.exercices.reduce(function (t, x) { return t + x.series.length; }, 0);
        var it = h('button', { class: 'item' },
          h('div', { class: 'item-titre' }, h('h3', { text: p.nom })),
          h('div', { class: 'item-resume',
                     text: n + (n > 1 ? ' exercices' : ' exercice') + ' · ' + ns + (ns > 1 ? ' séries' : ' série') }));
        it.addEventListener('click', function () { lancer(p); });
        hote.appendChild(it);
      });
    }

    hote.appendChild(h('div', { class: 'sous-titre', text: 'Sans programme' }));
    var libre = h('button', { class: 'bt bt-large', text: 'Démarrer une séance libre' });
    libre.addEventListener('click', function () { lancer(null); });
    hote.appendChild(libre);
  }

  function lancer(programme) {
    var e = etat();
    var s = A.m.seanceMuscu(programme);
    e.seances.push(s);
    e.seanceEnCoursId = s.id;
    A.store.sauver(true);
    A.app.aller('seance');
  }

  function rendre(conteneur) {
    var e = etat();
    if (e.seanceEnCoursId) monter(conteneur, e.seanceEnCoursId);
    else accueil(conteneur);
  }

  A.vues = A.vues || {};
  A.vues.seance = { rendre: rendre, lancer: lancer, monter: monter,
                    titre: function () {
                      var e = etat();
                      return e.seanceEnCoursId ? 'Séance en cours' : 'Séance';
                    } };
})(window.App || (window.App = {}));
