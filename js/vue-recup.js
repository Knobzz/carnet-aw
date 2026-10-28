/* Récupération — l'élastique quotidien, faible résistance, beaucoup de reps.

   Ce n'est pas une séance de travail, et ça ne doit pas en avoir la lourdeur :
   les séances sont définies UNE FOIS, et chaque jour l'écran les présente déjà
   prêtes. Il ne reste qu'à cocher. C'est le seul réglage qui décide si un geste
   quotidien tient dans le temps.

   PLUSIEURS SÉANCES NOMMÉES depuis le 2026-10-28. MB : « j'aimerai pouvoir
   ajouter des séances de récup et non pas juste une, actuellement cela me
   limite, et niveau validation ce serait plus simple, je valide le nom qui a
   les exos à l'intérieur, et on est bien ». Le ✓ de l'en-tête d'une séance
   vaut donc pour tous ses exercices — un geste, un nom.

   Rien n'est enregistré tant que rien n'est coché : une journée vide écrite
   dans le journal dirait qu'on l'a faite. Elle y entre au premier ✓, et en
   ressort si on décoche tout. Une journée PAR SÉANCE validée : les
   statistiques, elles, comptent les DATES distinctes, donc faire deux séances
   un mardi reste un jour et la série ne s'emballe pas. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function etat() { return A.store.etat(); }
  function sauver(i) { A.store.sauver(i); }

  /* Quelles séances sont dépliées. C'est un geste de LECTURE, pas un réglage :
     il ne survit pas à la fermeture, pour la même raison que la région du
     Suivi — rouvrir l'app sur un écran à moitié replié sans se souvenir de
     l'avoir demandé. */
  var deplie = {};

  /* ------------------------------------------------------------------
     la journée en cours — écrite seulement si elle porte quelque chose
     ------------------------------------------------------------------ */

  function estVide(se) {
    return !(se.exercices || []).some(function (ex) {
      return (ex.series || []).some(function (s) {
        return s.faite || (s.chargeReel || '').trim() || (s.repsReel || '').trim()
            || (s.dureeReel || '').trim();
      });
    });
  }

  /* ----------------------------------------------------------------
     UN ✓ PAR EXERCICE, QUI VAUT POUR TOUTES SES SÉRIES

     Deux demandes de MB, et la seconde corrige ma réponse à la première.

     1) « je ne vois que l'exo >> 50 reps […] il faudrait : Side Pressure
        4x50 reps ». Cause mesurée : l'écran ne rendait que la PREMIÈRE
        série — `(ex.series || [])[0]` — alors que sa routine en porte
        quatre. Le journal n'avait jamais rien à compter.

     2) « l'affichage initial était meilleur, je n'avais qu'une fois à
        valider […] ne peut on pas valider UNE fois les 4 séries ? »
        1.38.0 avait résolu le bon problème par le mauvais moyen : quatre
        lignes à cocher. Récup est un écran de GESTE — « il ne reste qu'à
        cocher » — et quatre appuis au lieu d'un, c'est la lourdeur que
        cet écran existe pour éviter.

     CE QUE ÇA COÛTE, ET C'EST ASSUMÉ : on ne peut plus noter une valeur
     DIFFÉRENTE par série depuis cet écran. Ce qu'on tape vaut pour toutes.
     Les cibles par série, elles, restent dans la séance, et cocher sans
     rien taper donne à chaque série LA SIENNE — c'est pourquoi le
     placeholder liste les cibles distinctes quand elles diffèrent plutôt
     que de n'en montrer qu'une.
     ---------------------------------------------------------------- */

  /* La valeur commune aux séries, ou '' si elles ne s'accordent pas : un
     champ unique ne peut pas afficher deux réponses. */
  function valeurCommune(series, cle) {
    var vals = [];
    series.forEach(function (s) {
      var x = (s[cle] || '').trim();
      if (vals.indexOf(x) < 0) vals.push(x);
    });
    return vals.length === 1 ? vals[0] : '';
  }

  function ciblesDistinctes(series, cle) {
    var vals = [];
    series.forEach(function (s) {
      var x = (s[cle] || '').trim();
      if (x && vals.indexOf(x) < 0) vals.push(x);
    });
    return vals;
  }

  /* Toutes les séries de l'exercice basculent ensemble : c'est UN geste.
     Celles qui n'ont rien de saisi prennent CHACUNE leur propre cible —
     « fait comme prévu », et non « fait, valeur inconnue ». */
  function basculerSeries(ex, versFait) {
    var series = ex.series || [];
    var cols = A.m.colonnes(ex);
    series.forEach(function (s) {
      if (s.faite === versFait) return;
      s.faite = versFait;
      if (versFait) {
        s.faiteA = new Date().toISOString();
        cols.forEach(function (id) {
          var def = A.m.colonne(id);
          if (!s[def.reel] && s[def.cible]) s[def.reel] = s[def.cible];
        });
      } else s.faiteA = null;
    });
  }

  function exoFait(ex) {
    return (ex.series || []).some(function (s) { return s.faite; });
  }

  function rendre(hote) {
    A.ui.vider(hote);
    var e = etat();
    var routines = A.m.routinesRecup(e);

    /* --- pas encore de séance --- */
    if (!routines.length) {
      var bt = h('button', { class: 'bt bt-large bt-primaire', style: 'margin-bottom:12px',
                             text: 'Définir ma première séance' });
      bt.addEventListener('click', function () { ajouterPuisEditer(hote); });
      hote.appendChild(bt);
      hote.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Aucune séance de récupération' }),
        'Rien n’est livré ici non plus. Mets-y tes exercices d’élastique — '
      + 'ceux que tu fais presque tous les jours — avec leurs reps ou leur durée. '
      + 'Tu peux en définir plusieurs, nommées, et les cocher séparément.'));
      return;
    }

    var refTitre = h('div', { class: 'sous-titre', style: 'margin-top:0' });
    var refStats = h('div', { class: 'item-resume', style: 'margin:-3px 2px 12px' });

    function majEntete() {
      var c = A.m.compteJourneeRecup(e);
      var stats = A.m.statsRecup(e, 7);
      refTitre.textContent = A.m.jourSemaine(A.m.aujourdHui()) + ' '
                           + A.m.dateCourte(A.m.aujourdHui());
      /* L'accord se fait sur le TOTAL, pas sur le nombre de faites :
         « 0 / 2 séances faites », et non « séances faite ». */
      var bouts = [c.faites + ' / ' + c.total + ' séance'
                 + (c.total > 1 ? 's faites' : ' faite')];
      bouts.push(stats.joursFaits + ' jour' + (stats.joursFaits > 1 ? 's' : '')
               + ' sur les 7 derniers');
      /* Une série de jours n'a de sens qu'au-delà de deux : « 1 jour d'affilée »
         ne dit rien de plus que « fait aujourd'hui ». */
      if (stats.serie >= 2) bouts.push(stats.serie + ' jours d’affilée');
      refStats.textContent = bouts.join(' · ');
    }

    hote.appendChild(refTitre);
    hote.appendChild(refStats);

    /* UNE SEULE SÉANCE S'OUVRE PAR DÉFAUT — l'écran d'avant n'avait pas de
       carte à ouvrir, et lui en ajouter une coûterait un appui pour rien.
       MAIS ELLE SE REPLIE : MB, 28/10, « il faut que la routine puisse être
       réduite par souci de lisibilité ». J'avais verrouillé le dépliage à
       une seule séance ; c'était une décision de trop. Le défaut change,
       pas la possibilité. */
    var seule = routines.length === 1;
    routines.forEach(function (routine) {
      hote.appendChild(carteSeance(e, routine, hote, majEntete, seule));
    });

    var btAjout = h('button', { class: 'bt bt-large', style: 'margin-top:10px',
                                text: '+ Ajouter une séance de récup' });
    btAjout.addEventListener('click', function () { ajouterPuisEditer(hote); });
    hote.appendChild(btAjout);

    hote.appendChild(h('div', { class: 'item-resume', style: 'margin-top:12px',
      text: 'Une séance n’entre dans le journal qu’une fois quelque chose coché. '
          + 'Modifier une séance ne touche pas aux journées déjà faites : chacune '
          + 'en est une copie.' }));

    majEntete();
  }

  /* ------------------------------------------------------------------
     UNE CARTE PAR SÉANCE — son nom valide ses exercices

     MB : « je valide le nom qui a les exos à l'intérieur, et on est bien ».
     Le ✓ de l'en-tête est donc le geste principal ; ouvrir la carte sert à
     corriger une valeur, pas à faire le travail.
     ------------------------------------------------------------------ */
  function carteSeance(e, routine, hote, majEntete, seule) {
    var jour = A.m.recupDuJour(e, null, routine.id);
    var enregistre = !!jour;
    if (!jour) jour = A.m.seanceRecup(routine);

    /* Une séance modifiée après coup ne réécrit pas une journée déjà
       commencée : la journée est une COPIE, comme une séance de muscu. */

    function synchroniser() {
      if (estVide(jour)) {
        if (enregistre) {
          var i = e.seances.indexOf(jour);
          if (i >= 0) e.seances.splice(i, 1);
          enregistre = false;
        }
      } else if (!enregistre) {
        e.seances.push(jour);
        enregistre = true;
      }
      sauver();
    }

    var carte = h('div', { class: 'recup-seance' });
    var exos = jour.exercices || [];
    /* `undefined` veut dire « pas encore touché » : le défaut s'applique.
       Une fois que MB a cliqué, c'est SON choix qui vaut, dans les deux
       sens. */
    var ouvert = deplie[routine.id] === undefined ? seule : !!deplie[routine.id];

    /* --- l'en-tête : le nom, ce qu'il contient, et le ✓ --- */
    var tete = h('div', { class: 'recup-seance-tete' });
    var bloc = h('button', { type: 'button', class: 'recup-seance-nom',
                             'aria-expanded': ouvert ? 'true' : 'false' });
    bloc.appendChild(h('b', { text: routine.nom }));
    var sous = h('span', { class: 'recup-seance-sous' });
    bloc.appendChild(sous);

    function majSous() {
      var faits = exos.filter(exoFait).length;
      if (!exos.length) {
        sous.textContent = 'aucun exercice — à compléter';
        return;
      }
      sous.textContent = faits + ' / ' + exos.length + ' exercice'
                       + (exos.length > 1 ? 's' : '');
    }

    var ok = h('button', { type: 'button', class: 'serie-ok',
                           'aria-label': 'Fait — toute la séance ' + routine.nom });
    ok.appendChild(A.ui.svg(A.ui.CHEMIN_OK));

    function toutFait() {
      return exos.length > 0 && exos.every(exoFait);
    }

    function majTete() {
      var t = toutFait();
      ok.setAttribute('aria-pressed', t ? 'true' : 'false');
      carte.classList.toggle('faite', t);
      majSous();
    }

    ok.addEventListener('click', function () {
      /* LE NOM VALIDE TOUT CE QU'IL CONTIENT : c'est exactement la demande.
         Si tout est déjà fait, le même appui défait tout. */
      var versFait = !toutFait();
      exos.forEach(function (ex) { basculerSeries(ex, versFait); });
      synchroniser();
      majEntete();
      rendre(hote);
    });

    /* UNE SÉANCE SANS EXERCICE N'A RIEN À VALIDER, et le bouton le dit en
       restant éteint plutôt qu'en mentant sur ce qu'un appui ferait. */
    if (!exos.length) {
      ok.disabled = true;
      ok.setAttribute('aria-disabled', 'true');
    }

    bloc.addEventListener('click', function () {
      deplie[routine.id] = !ouvert;
      rendre(hote);
    });

    tete.appendChild(bloc);
    tete.appendChild(ok);
    carte.appendChild(tete);

    if (!ouvert) { majTete(); return carte; }

    /* --- le corps : une ligne par exercice --- */
    var liste = h('div', { class: 'recup-corps' });
    exos.forEach(function (ex) { liste.appendChild(blocExo(ex)); });
    carte.appendChild(liste);

    function blocExo(ex) {
      var cols = A.m.colonnes(ex);
      var series = ex.series || [];
      if (!series.length) { series = ex.series = [A.m.serieSeanceVierge({})]; }

      var b = h('div', { class: 'recup-exo' });
      var titre = h('div', { class: 'recup-titre' }, h('b', { text: ex.nom }));
      /* Le nombre de séries se DIT, sinon un seul ✓ laisse croire qu'une
         seule série est en jeu. */
      if (series.length > 1) {
        titre.appendChild(h('span', { class: 'recup-compte',
                                      text: series.length + ' séries' }));
      }
      (ex.outils || []).forEach(function (o) {
        titre.appendChild(h('span', { class: 'jeton jeton-outil', text: o }));
      });
      b.appendChild(titre);

      if (ex.consigne) b.appendChild(h('div', { class: 'consigne', text: ex.consigne }));

      var ligne = h('div', { class: 'recup-ligne', 'data-cols': String(cols.length) });
      var champs = {};
      cols.forEach(function (id) {
        var def = A.m.colonne(id);
        var cibles = ciblesDistinctes(series, def.cible);
        var champ = h('input', { class: 'serie-saisie', type: 'text',
          inputmode: def.mode(A.m.typeCharge(ex.typeCharge)),
          value: valeurCommune(series, def.reel),
          placeholder: cibles.join(' · ') || def.label(A.m.typeCharge(ex.typeCharge)),
          'aria-label': def.label(A.m.typeCharge(ex.typeCharge)) + ' — ' + ex.nom
                      + (series.length > 1 ? ', les ' + series.length + ' séries' : '') });
        champ.addEventListener('input', function () {
          series.forEach(function (s) { s[def.reel] = champ.value; });
          synchroniser();
        });
        champs[id] = champ;
        ligne.appendChild(champ);
      });

      var okExo = h('button', { type: 'button', class: 'serie-ok',
                                'aria-pressed': exoFait(ex) ? 'true' : 'false',
                                'aria-label': 'Fait — ' + ex.nom
                                            + (series.length > 1
                                               ? ', les ' + series.length + ' séries' : '') });
      okExo.appendChild(A.ui.svg(A.ui.CHEMIN_OK));
      okExo.addEventListener('click', function () {
        var versFait = !exoFait(ex);
        basculerSeries(ex, versFait);
        okExo.setAttribute('aria-pressed', versFait ? 'true' : 'false');
        b.classList.toggle('faite', versFait);
        cols.forEach(function (id) {
          var def = A.m.colonne(id);
          if (champs[id]) champs[id].value = valeurCommune(series, def.reel);
        });
        /* SYNCHRONISER D'ABORD : `majEntete` compte les journées
           ENREGISTRÉES, et la journée n'entre dans `e.seances` qu'ici.
           Dans l'autre ordre, le premier ✓ laissait l'en-tête à zéro. */
        synchroniser();
        majTete();
        majEntete();
      });
      ligne.appendChild(okExo);
      b.appendChild(ligne);
      if (exoFait(ex)) b.classList.add('faite');
      return b;
    }

    if (!exos.length) {
      liste.appendChild(h('div', { class: 'item-resume', style: 'margin:2px',
        text: 'Cette séance ne contient aucun exercice. Ouvre-la pour en ajouter.' }));
    }

    var btMod = h('button', { class: 'bt bt-petit', style: 'margin-top:8px',
                              text: 'Modifier' });
    btMod.addEventListener('click', function () {
      A.vues.programmes.editer(routine, function () {
        A.m.tenirRoutineRecup(etat());
        A.store.sauver(true);
        rendre(hote);
      });
    });

    /* SUPPRIMER NE TOUCHE PAS AU PASSÉ, et la phrase le dit : les journées
       déjà faites sont des copies, elles restent au journal. */
    var btSup = A.ui.confirmer2(
      h('button', { class: 'bt bt-petit bt-danger', style: 'margin-top:8px',
                    text: 'Supprimer' }),
      'Appuyer encore pour supprimer',
      function () {
        A.m.supprimerRoutineRecup(etat(), routine.id);
        delete deplie[routine.id];
        A.store.sauver(true);
        A.ui.toast('Séance supprimée. Les journées déjà faites restent au journal.');
        rendre(hote);
      });

    var actions = h('div', { class: 'recup-actions' }, btMod, btSup);
    carte.appendChild(actions);

    majTete();
    return carte;
  }

  function ajouterPuisEditer(hote) {
    var e = etat();
    var r = A.m.ajouterRoutineRecup(e);
    A.store.sauver(true);
    deplie[r.id] = true;
    A.vues.programmes.editer(r, function () {
      A.m.tenirRoutineRecup(etat());
      A.store.sauver(true);
      rendre(hote);
    });
  }

  A.vues = A.vues || {};
  A.vues.recup = { rendre: rendre, titre: function () { return 'Récupération'; } };
})(window.App || (window.App = {}));
