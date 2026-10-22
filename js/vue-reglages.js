/* Réglages — thème, sauvegarde, et l'état réel de la persistance. */
(function (A) {
  'use strict';
  var h = A.ui.h;

  function etat() { return A.store.etat(); }

  function nomFichier() {
    var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'carnet-aw-' + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate())
         + '-' + z(d.getHours()) + z(d.getMinutes()) + '.json';
  }

  /* Export réel : un Blob, un <a download>, et l'URL libérée après coup. */
  function exporter() {
    var texte;
    try {
      texte = JSON.stringify(etat(), null, 2);
    } catch (err) {
      A.ui.toast('Export impossible : les données n’ont pas pu être sérialisées.');
      return;
    }
    try {
      var blob = new Blob([texte], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = h('a', { href: url, download: nomFichier() });
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
      A.ui.toast('Sauvegarde exportée.');
    } catch (err) {
      A.ui.toast('Le navigateur a refusé le téléchargement.');
    }
  }

  /* Import réel : on lit, on valide la forme, on montre ce qu'il y a dedans,
     et on ne remplace qu'après une confirmation qui dit ce qui sera écrasé. */
  function importer(fichier, apres) {
    var fr = new FileReader();
    fr.onerror = function () { A.ui.toast('Le fichier n’a pas pu être lu.'); };
    fr.onload = function () {
      var brut;
      try {
        brut = JSON.parse(String(fr.result));
      } catch (err) {
        /* Ne pas confondre « le fichier est mauvais » avec « le code est
           mauvais ». Un SyntaxError vient du fichier ; tout le reste est un
           defaut de l'app, et le dire evite de chercher des heures du cote
           du fichier. */
        if (err instanceof SyntaxError) {
          A.ui.toast('Ce fichier n’est pas un JSON valide.');
        } else {
          A.ui.toast('Erreur interne à la lecture (' + (err && err.name) + '). Le fichier n’est pas en cause.');
          throw err;
        }
        return;
      }
      if (!brut || typeof brut !== 'object' || !Array.isArray(brut.seances) || !Array.isArray(brut.programmes)) {
        A.ui.toast('Ce fichier n’est pas une sauvegarde du carnet.');
        return;
      }
      var e = etat();
      var resume = brut.programmes.length + ' programme(s), ' + brut.seances.length + ' séance(s)';
      /* Surtout pas « fr » ici : ce nom est deja celui du FileReader, et le var
         hoiste le rendait indefini au debut de ce gestionnaire. */
      var fraicheur = A.store.compareFraicheur(brut);

      /* Remplacer est previsible mais destructeur. Fusionner garde les deux
         cotes. Les deux restent offerts — mais la fusion vient en premier, et
         le remplacement dit CE QU'IL EFFACE, chiffre, avant d'etre choisi. */
      var options = [
        { nom: 'Fusionner — garder les deux', classe: 'bt-primaire', action: function () {
            var b = A.store.fusionner(brut);
            if (!b.ecrit) { A.ui.toast('La fusion a échoué à l’écriture.'); return; }
            A.app.appliquerTheme();
            apres && apres();
            A.ui.toast(b.seancesAjoutees + ' séance(s) et ' + b.programmesAjoutes
                     + ' programme(s) ajoutés · ' + b.seancesGardees + ' déjà présentes, inchangées.');
          } },
        { nom: 'Remplacer — effacer ' + e.seances.length + ' séance(s) d’ici',
          classe: 'bt-danger', action: function () {
            A.ui.feuille(fraicheur.courantPlusRecent
              ? 'Ce carnet a du plus récent que la sauvegarde'
              : 'Effacer tout et remettre la sauvegarde ?', [
              { nom: 'Oui, remplacer par ' + resume, classe: 'bt-danger arme', action: function () {
                  if (A.store.remplacer(brut)) {
                    A.ui.toast('Sauvegarde importée. Le carnet précédent est effacé.');
                    A.app.appliquerTheme();
                    apres && apres();
                  } else {
                    A.ui.toast('L’import a échoué à l’écriture. Rien n’a été remplacé en mémoire.');
                  }
                } },
              { nom: 'Annuler', action: function () {} }
            ]);
          } },
        { nom: 'Ne rien faire', action: function () {} }
      ];

      var titre = 'Sauvegarde : ' + resume;
      if (fraicheur.courantPlusRecent) {
        titre = 'Attention — ce carnet est plus récent';
        options.unshift(null);
      }
      A.ui.feuille(titre, options);
      if (fraicheur.courantPlusRecent) {
        var f = document.querySelector('.popo-feuille');
        if (f) f.insertBefore(h('div', { class: 'alerte',
          text: 'Ici : séances jusqu’au ' + A.m.dateCourte(fraicheur.courant)
              + '. Dans la sauvegarde : jusqu’au ' + (fraicheur.importe ? A.m.dateCourte(fraicheur.importe) : 'aucune')
              + '. Remplacer perdrait ce qui est plus récent.' }), f.children[1]);
      }
    };
    fr.readAsText(fichier);
  }

  /* Le matériel que tu as listé dans la spec — proposé, jamais imposé. */
  var MATERIEL = [
    { nom: 'Golden Grip N2',                categorie: 'Grippers' },
    { nom: 'Golden Grip N3',                categorie: 'Grippers' },
    { nom: 'Golden Grip N4',                categorie: 'Grippers' },
    { nom: 'Élastique de rééducation',      categorie: 'Élastiques' },
    { nom: 'Fat grip',                      categorie: 'Poignées' },
    { nom: 'Ceinture de judo',              categorie: 'Sangles' },
    { nom: 'Titan Grip Iron Wrist 60 mm',   categorie: 'Poignées AW' },
    { nom: 'Titan Grip Pronator Ellipsoid', categorie: 'Poignées AW' },
    { nom: 'Barre droite',                  categorie: 'Barres' },
    { nom: 'Barre EZ',                      categorie: 'Barres' },
    { nom: 'Poulie haute',                  categorie: 'Poulies' },
    { nom: 'Poulie basse',                  categorie: 'Poulies' }
  ];

  /* Combien d'exercices DISTINCTS emploient cet outil. On compte les slugs,
     pas les occurrences : le même exercice présent dans un programme et dans
     trois séances reste UN exercice. */
  function compterUsages(e, outil) {
    var cible = A.m.slug(outil.nom), vus = {};
    function voir(liste) {
      (liste || []).forEach(function (ex) {
        if ((ex.outils || []).some(function (o) { return A.m.slug(o) === cible; })) {
          vus[ex.slug || A.m.slug(ex.nom)] = 1;
        }
      });
    }
    e.programmes.forEach(function (p) { voir(p.exercices); });
    e.seances.forEach(function (se) { if (se.type === 'muscu') voir(se.exercices); });
    return Object.keys(vus).length;
  }

  /* Fiche d'un RÉGLAGE : son nom, et ce qu'il fait travailler.

     Les muscles sont facultatifs — un réglage qui n'est qu'une étiquette
     (« mousqueton à l'extérieur ») a déjà sa valeur : il distingue deux
     séances qui se ressembleraient. Mais s'ils sont renseignés, la fiche
     d'exercice les PROPOSE, et c'est la seule source qui vienne du matériel
     de celui qui s'en sert. */
  function editerReglage(outil, reglage, apres) {
    var e = etat();
    var neuf = !reglage;
    var choisis = neuf ? [] : (reglage.muscles || []).slice();
    var appliquer = null;

    A.panneau.ouvrir(neuf ? 'Nouveau réglage' : reglage.nom, function (c, fermer) {
      var champ = h('input', { class: 'champ', value: neuf ? '' : reglage.nom,
                               placeholder: 'Mousqueton à l’extérieur…' });
      c.appendChild(A.ui.groupe('Nom du réglage', champ,
        'Comment l’outil est monté : ce qui change ce qu’il sollicite.'));

      c.appendChild(A.ui.groupe('Muscles sollicités',
        A.ui.selecteurMuscles(choisis, function (l) { choisis = l; }),
        'Facultatif. S’ils sont cochés, la fiche d’exercice les proposera '
      + 'quand ce réglage est retenu.'));

      if (!neuf) {
        c.appendChild(A.ui.confirmer2(
          h('button', { class: 'bt bt-large bt-danger', style: 'margin-top:12px',
                        text: 'Retirer ce réglage' }),
          'Appuyer encore pour retirer',
          function () {
            A.m.supprimerReglageOutil(e, outil.nom, reglage.id);
            A.store.sauver(true);
            fermer();
            A.ui.toast('Retiré. Les exercices qui le portent gardent leur mention.');
            apres && apres();
          }));
      }

      appliquer = function () {
        var nom = champ.value.trim();
        if (!nom) { A.ui.toast('Donne un nom au réglage.'); champ.focus(); return false; }
        var existant = A.m.trouverReglage(e, outil.nom, nom);
        if (existant && (neuf || existant.id !== reglage.id)) {
          A.ui.toast('« ' + existant.nom + ' » existe déjà sur cet outil.');
          return false;
        }
        A.m.majReglageOutil(e, outil.nom, nom, choisis, neuf ? null : reglage.id);
        A.store.sauver(true);
        return true;
      };
      setTimeout(function () { if (neuf) champ.focus(); }, 60);
    }, [
      { nom: 'Annuler', action: function (fermer) { fermer(); } },
      { nom: 'Enregistrer', classe: 'bt-primaire', action: function (fermer) {
          if (appliquer && !appliquer()) return;
          fermer();
          apres && apres();
        } }
    ]);
  }

  /* Fiche d'un outil : nom + catégorie, la catégorie en saisie libre avec
     autocomplétion sur celles déjà employées. `outil` null = création. */
  function editerOutil(outil, apres) {
    var e = etat();
    var neuf = !outil;
    var appliquer = null;

    A.panneau.ouvrir(neuf ? 'Nouvel outil' : outil.nom, function (c, fermer) {
      var champNom = h('input', { class: 'champ', value: neuf ? '' : outil.nom,
                                  placeholder: 'Poulie haute, Titan Grip Iron Wrist…' });
      c.appendChild(A.ui.groupe('Nom de l’outil', champNom));

      var champCat = h('input', { class: 'champ', value: neuf ? '' : (outil.categorie || ''),
                                  placeholder: 'Grippers, Poulies, Poignées AW…' });
      c.appendChild(A.ui.groupe('Catégorie', champCat,
        'Facultative, et libre : une catégorie neuve se crée en la tapant.'));
      A.ui.autocomplete(champCat, function (q) {
        var qs = A.m.slug(q);
        return A.m.categoriesOutils(e)
          .filter(function (x) { return !qs || A.m.slug(x).indexOf(qs) >= 0; })
          .slice(0, 8)
          .map(function (x) { return { nom: x, jetons: [] }; });
      }, function () {});

      if (!neuf) {
        /* ---- les réglages ----
           Un même outil ne charge pas pareil selon la façon dont il est
           monté. On les écrit UNE fois ici ; la fiche d'exercice les coche
           ensuite. Les écrire à chaque exercice donnerait « extérieur »,
           « Exterieur » et « ext » : trois réglages pour un seul. */
        var boiteReg = h('div');
        function rendreReglages() {
          A.ui.vider(boiteReg);
          var l = A.m.reglagesOutil(e, outil.nom);
          if (!l.length) {
            boiteReg.appendChild(h('div', { class: 'item-resume',
              text: 'Aucun pour l’instant.' }));
          }
          l.forEach(function (r) {
            var b = h('button', { type: 'button', class: 'item-ligne item-bouton' },
              h('b', { text: r.nom }),
              h('span', { text: (r.muscles || []).length
                ? (r.muscles || []).length + ' muscle(s)' : 'sans muscle' }));
            b.addEventListener('click', function () {
              editerReglage(outil, r, function () { rendreReglages(); });
            });
            boiteReg.appendChild(b);
          });
          var plus = h('button', { type: 'button', class: 'bt', style: 'margin-top:8px',
                                   text: '+ Ajouter un réglage' });
          plus.addEventListener('click', function () {
            editerReglage(outil, null, function () { rendreReglages(); });
          });
          boiteReg.appendChild(plus);
        }
        rendreReglages();
        c.appendChild(A.ui.groupe('Réglages', boiteReg,
          'Facultatif. « Mousqueton à l’extérieur », « poignée fine » : ce qui '
        + 'change ce que l’outil sollicite, sans en faire un autre exercice.'));

        var n = compterUsages(e, outil);
        c.appendChild(h('div', { class: 'item-resume', style: 'margin-top:10px',
          text: n ? 'Employé par ' + n + ' exercice(s).' : 'Aucun exercice ne l’emploie pour l’instant.' }));

        c.appendChild(A.ui.confirmer2(
          h('button', { class: 'bt bt-large bt-danger', style: 'margin-top:12px',
                        text: 'Retirer de l’équipement' }),
          'Appuyer encore pour retirer',
          function () {
            var i = e.outils.indexOf(outil);
            if (i >= 0) e.outils.splice(i, 1);
            A.store.sauver(true);
            fermer();
            A.ui.toast('Retiré. Les exercices qui le portent gardent leur outil.');
            apres && apres();
          }));
      }

      appliquer = function () {
        var nom = champNom.value.trim();
        if (!nom) { A.ui.toast('Donne un nom à l’outil.'); champNom.focus(); return false; }
        var cat = champCat.value.trim();
        var existant = A.m.trouverOutil(e, A.m.slug(nom));
        if (existant && existant !== outil) {
          A.ui.toast('« ' + existant.nom + ' » existe déjà.');
          return false;
        }
        if (neuf) A.m.majCatalogueOutils(e, nom, cat);
        else {
          /* Renommer change le slug : on met l'entrée à jour EN PLACE, sinon
             majCatalogueOutils en créerait une seconde à côté de l'ancienne. */
          outil.nom = nom;
          outil.slug = A.m.slug(nom);
          outil.categorie = cat;
          outil.vuLe = A.m.maintenant();
        }
        A.store.sauver(true);
        return true;
      };

      setTimeout(function () { if (neuf) champNom.focus(); }, 60);
    }, [
      { nom: 'Annuler', action: function (fermer) { fermer(); } },
      { nom: 'Enregistrer', classe: 'bt-primaire', action: function (fermer) {
          if (appliquer && !appliquer()) return;
          fermer();
          apres && apres();
        } }
    ]);
  }

  function rendre(hote) {
    A.ui.vider(hote);
    var e = etat();

    /* --- thème --- */
    hote.appendChild(h('div', { class: 'sous-titre', text: 'Thème' }));
    var puces = h('div', { class: 'enrobe' });
    [['auto', 'Système'], ['clair', 'Clair'], ['sombre', 'Sombre']].forEach(function (t) {
      var b = h('button', { type: 'button', class: 'puce', text: t[1],
                            'aria-pressed': e.reglages.theme === t[0] ? 'true' : 'false' });
      b.addEventListener('click', function () {
        e.reglages.theme = t[0];
        A.store.sauver(true);
        A.app.appliquerTheme();
        Array.prototype.forEach.call(puces.children, function (n, i) {
          n.setAttribute('aria-pressed', ['auto', 'clair', 'sombre'][i] === t[0] ? 'true' : 'false');
        });
      });
      puces.appendChild(b);
    });
    hote.appendChild(puces);

    /* --- en salle --- */
    hote.appendChild(h('div', { class: 'sous-titre', text: 'En salle' }));

    var btEcran = h('button', { type: 'button', class: 'puce', text: 'Garder l’écran allumé',
                                'aria-pressed': e.reglages.ecranAllume !== false ? 'true' : 'false' });
    btEcran.addEventListener('click', function () {
      e.reglages.ecranAllume = !(e.reglages.ecranAllume !== false);
      btEcran.setAttribute('aria-pressed', e.reglages.ecranAllume ? 'true' : 'false');
      A.store.sauver(true);
      A.ui.garderEcranAllume(e.reglages.ecranAllume && !!e.seanceEnCoursId);
    });
    hote.appendChild(btEcran);
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:8px 2px 12px',
      text: 'Pendant une séance seulement, et relâché dès que tu quittes l’app. Évite d’avoir à réveiller le téléphone entre deux séries — au prix d’un peu de batterie.'
          + ('wakeLock' in navigator ? '' : ' Ce navigateur ne le permet pas : le réglage reste sans effet.') }));

    /* Notification de fin de repos. A l'arret par defaut : elle demande une
       permission, et elle ne sert que si l'ecran est eteint ou l'app derriere.
       Avec l'ecran maintenu allume, la vibration suffit. */
    var dispo = A.ui.notificationsPossibles();
    var btNotif = h('button', { type: 'button', class: 'puce', text: 'Notifier la fin du repos',
                                'aria-pressed': e.reglages.notifierRepos ? 'true' : 'false' });
    var etatNotif = h('div', { class: 'item-resume', style: 'margin:8px 2px 0' });

    function direEtatNotif() {
      if (!dispo) { etatNotif.textContent = 'Ce navigateur ne gère pas les notifications : le réglage reste sans effet.'; return; }
      var p = Notification.permission;
      etatNotif.textContent =
        (p === 'granted' ? 'Permission accordée. ' :
         p === 'denied'  ? 'Permission refusée par le navigateur — à rouvrir dans ses réglages de site. ' :
                           'La permission sera demandée à l’activation. ')
        + 'N’est envoyée que si l’app est en arrière-plan : te notifier pendant que tu regardes l’écran serait du bruit.';
    }
    direEtatNotif();

    btNotif.addEventListener('click', function () {
      var veut = !e.reglages.notifierRepos;
      if (!veut) {
        e.reglages.notifierRepos = false;
        btNotif.setAttribute('aria-pressed', 'false');
        A.store.sauver(true);
        direEtatNotif();
        return;
      }
      A.ui.demanderNotifications().then(function (p) {
        e.reglages.notifierRepos = (p === 'granted');
        btNotif.setAttribute('aria-pressed', e.reglages.notifierRepos ? 'true' : 'false');
        A.store.sauver(true);
        direEtatNotif();
        if (p !== 'granted') A.ui.toast('Notification non autorisée : le réglage reste à l’arrêt.');
      });
    });

    hote.appendChild(btNotif);
    hote.appendChild(etatNotif);

    /* --- sauvegarde --- */
    hote.appendChild(h('div', { class: 'sous-titre', text: 'Sauvegarde' }));
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px',
      text: 'Tout vit sur ce téléphone, dans le stockage du navigateur. Rien ne part sur un serveur. '
          + 'Un export régulier est le seul filet si tu changes d’appareil ou si tu effaces les données du site. '
          + 'À l’import, tu choisis : fusionner (rien n’est perdu) ou remplacer.' }));

    var btExp = h('button', { class: 'bt bt-large', style: 'margin-bottom:8px', text: 'Exporter une sauvegarde (.json)' });
    btExp.addEventListener('click', exporter);
    hote.appendChild(btExp);

    var fich = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
    fich.addEventListener('change', function () {
      if (fich.files && fich.files[0]) importer(fich.files[0], function () { rendre(hote); });
      fich.value = '';
    });
    var btImp = h('button', { class: 'bt bt-large', text: 'Importer une sauvegarde' });
    btImp.addEventListener('click', function () { fich.click(); });
    hote.appendChild(btImp);
    hote.appendChild(fich);

    /* --- état réel du stockage --- */
    hote.appendChild(h('div', { class: 'sous-titre', text: 'État du stockage' }));
    var taille = 0, ok = true;
    try { taille = (window.localStorage.getItem(A.store.CLE) || '').length; } catch (err) { ok = false; }
    var ligneDurable = h('span', { text: '…' });
    var p = A.store.estPersistant();
    if (p === true) ligneDurable.textContent = 'accordé';
    else if (p === false) ligneDurable.textContent = 'refusé';
    else ligneDurable.textContent = 'en cours…';

    /* La reponse arrive en differe : on la relit une fois plutot que d'afficher
       « en cours » pour toujours. */
    if (p === null) {
      setTimeout(function () {
        var q = A.store.estPersistant();
        ligneDurable.textContent = q === true ? 'accordé' : (q === false ? 'refusé' : 'inconnu');
      }, 900);
    }

    var carte = h('div', { class: 'carte' }, h('div', { class: 'carte-corps' },
      h('div', { class: 'item-ligne' }, h('b', { text: 'Écriture' }),
        h('span', { text: A.store.panne() ? 'en échec' : (ok ? 'fonctionne' : 'inaccessible') })),
      h('div', { class: 'item-ligne' }, h('b', { text: 'Stockage durable' }), ligneDurable),
      h('div', { class: 'item-ligne' }, h('b', { text: 'Taille des données' }),
        h('span', { text: taille ? (taille / 1024).toFixed(1) + ' Ko' : '—' })),
      h('div', { class: 'item-ligne' }, h('b', { text: 'Exercices connus' }),
        h('span', { text: String(e.exercices.length) })),
      h('div', { class: 'item-ligne' }, h('b', { text: 'Programmes' }),
        h('span', { text: String(e.programmes.length) })),
      h('div', { class: 'item-ligne' }, h('b', { text: 'Séances' }),
        h('span', { text: String(e.seances.length) }))));
    hote.appendChild(carte);
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:6px 2px 0',
      text: '« Stockage durable » refusé veut dire que le navigateur peut effacer le carnet s’il manque de place. '
          + 'Installer l’app depuis l’écran d’accueil l’accorde presque toujours — et un export régulier reste le seul vrai filet.' }));

    /* --- catalogue --- */
    hote.appendChild(h('div', { class: 'sous-titre', text: 'Exercices connus' }));
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px',
      text: 'Le carnet n’a jamais de liste imposée : ce catalogue est seulement ce que tu as déjà saisi. Il alimente l’autocomplétion.' }));

    if (!e.exercices.length) {
      hote.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Catalogue vide' }),
        'Il se remplira au premier exercice que tu saisiras.'));
    } else {
      var c2 = h('div', { class: 'carte' }), corps2 = h('div', { class: 'carte-corps' });
      e.exercices.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); }).forEach(function (x) {
        var sup = h('button', { class: 'bt-icone', text: '✕', 'aria-label': 'Oublier ' + x.nom });
        A.ui.confirmer2(sup, '✓ ?', function () {
          var i = e.exercices.indexOf(x);
          if (i >= 0) e.exercices.splice(i, 1);
          A.store.sauver(true);
          rendre(hote);
          A.ui.toast('Retiré de l’autocomplétion. Les séances passées sont intactes.');
        });
        corps2.appendChild(h('div', { class: 'item-ligne', style: 'align-items:center' },
          h('b', { text: x.nom }),
          x.aw ? h('span', { class: 'jeton', text: 'AW' }) : null,
          h('span', { text: A.m.typeCharge(x.typeCharge).nom }),
          sup));
      });
      c2.appendChild(corps2);
      hote.appendChild(c2);
    }

    /* --- équipement --- */
    hote.appendChild(h('div', { class: 'sous-titre', text: 'Équipement' }));
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px',
      text: 'Rien n’est livré avec l’app. Un exercice peut porter plusieurs outils — « Titan Grip » et « Poulie haute » ensemble, par exemple. Les catégories sont les tiennes : tape-en une nouvelle et elle existe.' }));

    var btOutilNeuf = h('button', { class: 'bt bt-large', style: 'margin-bottom:10px',
                                    text: '+ Ajouter un outil' });
    btOutilNeuf.addEventListener('click', function () {
      editerOutil(null, function () { rendre(hote); });
    });
    hote.appendChild(btOutilNeuf);

    if (!e.outils.length) {
      hote.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Aucun outil' }),
        'Ajoute-le ici, ou saisis-le directement dans la fiche d’un exercice : il entrera tout seul.'));
    } else {
      A.m.outilsParCategorie(e).forEach(function (g) {
        var c3 = h('div', { class: 'carte' });
        var corps3 = h('div', { class: 'carte-corps' });
        corps3.appendChild(h('div', { class: 'sous-titre', style: 'margin:0 0 6px', text: g.categorie }));
        g.outils.forEach(function (o) {
          var combien = compterUsages(e, o);
          var ligne = h('div', { class: 'item-ligne', style: 'align-items:center;padding:6px 0;cursor:pointer' },
            h('b', { text: o.nom }),
            h('span', { text: combien ? combien + ' exo' + (combien > 1 ? 's' : '') : 'non employé' }));
          ligne.addEventListener('click', function () { editerOutil(o, function () { rendre(hote); }); });
          corps3.appendChild(ligne);
        });
        c3.appendChild(corps3);
        hote.appendChild(c3);
      });
    }

    /* Ton matériel, tel que tu l'as listé, rangé par catégorie. Ce n'est PAS
       pré-chargé : c'est un geste volontaire, et tout reste modifiable ensuite. */
    var manquants = MATERIEL.filter(function (m) { return !A.m.trouverOutil(e, A.m.slug(m.nom)); });
    if (manquants.length) {
      var btMat = h('button', { class: 'bt bt-large', style: 'margin-top:4px',
                                text: 'Ajouter mon matériel (' + manquants.length + ')' });
      btMat.addEventListener('click', function () {
        manquants.forEach(function (m) { A.m.majCatalogueOutils(e, m.nom, m.categorie); });
        A.store.sauver(true);
        rendre(hote);
        A.ui.toast(manquants.length + ' outils ajoutés.');
      });
      hote.appendChild(btMat);
      hote.appendChild(h('div', { class: 'item-resume', style: 'margin:6px 2px 0',
        text: 'Raccourci unique : ' + manquants.map(function (m) { return m.nom; }).join(', ')
            + '. Rien ne s’ajoute sans cet appui.' }));
    }

    /* --- remise à zéro --- */
    hote.appendChild(h('div', { class: 'sous-titre', text: 'Tout effacer' }));
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px',
      text: 'Supprime programmes, séances et catalogue. Exporte d’abord : c’est irréversible.' }));
    hote.appendChild(A.ui.confirmer2(
      h('button', { class: 'bt bt-large bt-danger', text: 'Effacer toutes les données' }),
      'Appuyer encore pour tout effacer',
      function () {
        A.store.vider();
        A.app.appliquerTheme();
        A.ui.toast('Carnet remis à zéro.');
        A.app.aller('programmes');
      }));

    hote.appendChild(h('div', { class: 'item-resume', style: 'margin-top:18px;text-align:center',
      text: 'Carnet AW · données locales · version ' + (window.APP_VERSION || '1.0.0') }));
  }

  A.vues = A.vues || {};
  A.vues.reglages = { rendre: rendre, titre: function () { return 'Réglages'; } };
})(window.App || (window.App = {}));
