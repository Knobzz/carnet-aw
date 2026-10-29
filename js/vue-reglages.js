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
            /* LES FICHES SE DISENT AUSSI, et seulement quand il y en a :
               une fusion muette serait pire qu'un remplacement, mais une
               phrase qui annonce « 0 fiche » à qui n'en a aucune est du
               bruit. */
            var dit = b.seancesAjoutees + ' séance(s) et ' + b.programmesAjoutes
                    + ' programme(s) ajoutés · ' + b.seancesGardees
                    + ' déjà présentes, inchangées.';
            if (b.fichesAjoutees || b.fichesGardees) {
              dit += ' Dictionnaire : ' + b.fichesAjoutees + ' fiche(s) ajoutée(s), '
                   + b.fichesGardees + ' gardée(s).';
            }
            if (b.peseesAjoutees || b.peseesGardees) {
              dit += ' Pesées : ' + b.peseesAjoutees + ' ajoutée(s), '
                   + b.peseesGardees + ' gardée(s).';
            }
            A.ui.toast(dit);
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
  /* Il y avait ici une liste de matériel en dur — douze outils, les miens —
     et un bouton « Ajouter mon matériel ». Elle a été RETIRÉE.

     Elle était pourtant opt-in : rien ne s'ajoutait sans un appui. Mais elle
     revenait indéfiniment pour tout outil retiré, et surtout elle
     contredisait ce que cette app dit partout ailleurs : le catalogue n'a
     jamais de liste imposée, il se construit avec ce qui est saisi. Une
     liste écrite dans le code est une liste imposée, même derrière un
     bouton.

     Ce qu'elle rendait service à faire — remonter un équipement d'un coup —
     est déjà fait par l'import d'une sauvegarde, qui rend TOUT et pas
     seulement douze noms choisis par quelqu'un d'autre. */


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
  function editerReglage(outil, reglage, apres, nomSuggere) {
    var e = etat();
    var neuf = !reglage;
    var choisis = neuf ? [] : (reglage.muscles || []).slice();
    var appliquer = null;

    A.panneau.ouvrir(neuf ? 'Nouveau réglage' : reglage.nom, function (c, fermer) {
      /* `nomSuggere` vient d'une position proposée par le type de l'outil :
         le nom est déjà écrit, et il reste MODIFIABLE. La fiche s'ouvre
         quand même — c'est l'utilisateur qui enregistre, et il voit ce
         qu'il crée. */
      var champ = h('input', { class: 'champ',
                               value: neuf ? (nomSuggere || '') : reglage.nom,
                               placeholder: 'Mousqueton à l’extérieur…' });
      c.appendChild(A.ui.groupe('Nom du réglage', champ,
        'Comment l’outil est monté : ce qui change ce qu’il sollicite.'));

      /* Les noms ne parlent pas à tout le monde. « Où ça tire ? » demande
         une PERCEPTION — le dessus de l'avant-bras, le bord du pouce — et
         coche les muscles correspondants, qu'on corrige ensuite. */
      var boiteM = h('div');
      function rendreM() {
        A.ui.vider(boiteM);
        boiteM.appendChild(A.ui.selecteurMuscles(choisis, function (l) { choisis = l; }));
      }
      rendreM();
      var ouCaTire = A.ui.selecteurOuCaTire(
        function () { return choisis.slice(); },
        function (voulus) {
          choisis = A.m.muscles({ muscles: voulus });
          rendreM();
        });
      var grM = A.ui.groupe('Muscles sollicités', ouCaTire,
        'Facultatif — un réglage qui n’est qu’une étiquette distingue déjà '
      + 'deux séances. S’ils sont cochés, la fiche d’exercice les proposera.');
      grM.insertBefore(boiteM, grM.lastChild);
      c.appendChild(grM);

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
  function editerOutil(outil, apres, nomSuggere) {
    var e = etat();
    var neuf = !outil;
    var appliquer = null;

    A.panneau.ouvrir(neuf ? 'Nouvel outil' : outil.nom, function (c, fermer) {
      /* `nomSuggere` vient du catalogue des marques : le nom est deja
         ecrit, et il reste MODIFIABLE. La fiche s'ouvre quand meme — c'est
         l'utilisateur qui enregistre, et il voit ce qu'il cree. */
      var champNom = h('input', { class: 'champ',
                                  value: neuf ? (nomSuggere || '') : outil.nom,
                                  placeholder: 'Poulie haute, Titan Grip Iron Wrist…' });
      c.appendChild(A.ui.groupe('Nom de l’outil', champNom));

      /* ---- CE QUE LE CARNET A LU DANS CE NOM ----
         MB, 27/10 : « montre dans l’app quand l’outil est reconnu, même
         sans muscle ». Avant, une ceinture de judo reconnue ne se
         distinguait EN RIEN d’un nom inconnu : zéro muscle, zéro
         changement à l’écran — on lui demandait de croire.

         La ligne nomme les MOTS lus, pas un verdict : « reconnu : iron
         wrist » apprend quelque chose, « reconnu » tout seul, non. Elle se
         remet à jour À CHAQUE FRAPPE, pour qu’un renommage qui fait perdre
         la reconnaissance se voie AU MOMENT où on le tape, et pas au
         prochain exercice.

         ET ELLE NE REPROCHE RIEN quand ce n’est pas reconnu : le carnet ne
         livre aucune liste, un outil inconnu est le cas NORMAL, et la ligne
         dit comment faire sans. */
      var dit = h('div', { class: 'item-resume dit-lu' });
      function majLu() {
        var nom = champNom.value.trim();
        var mots = A.m.motsReconnus(nom);
        var n = A.m.musclesDeLOutil([nom]).length;
        dit.classList.toggle('dit-reconnu', mots.length > 0);
        if (!nom) { dit.textContent = ''; return; }
        if (!mots.length) {
          dit.textContent = 'Nom libre — le carnet n’y reconnaît rien, et '
            + 'ça ne gêne pas : coche ses muscles dans les exercices qui '
            + 'l’emploient.';
          return;
        }
        dit.textContent = 'Reconnu : « ' + mots.join(' », « ') + ' ». '
          + (n
              ? n + ' muscle(s) proposé(s) aux exercices qui l’emploient.'
              : 'Il n’ajoute aucun muscle — il change ce que tu tiens, pas '
              + 'ce qui travaille.');
      }

      /* ---- OÙ ÇA SE MONTE ----
         MB, 26/10 : « beaucoup d’équipement ne peuvent s’ajouter qu’à la
         poulie, les fat grips peuvent s’ajouter sur de la barre, des
         dumbbells et autres poignées, mais pas sur tout ». C’était écrit
         dans la revue depuis, et jamais arrivé jusqu’ici.

         LE CARNET NE REFUSE RIEN, il DIT : celui qui a trouvé un montage
         que je ne connais pas a raison contre moi. Et quand rien n’est
         connu sur ce qu’on ne peut PAS faire, la ligne se tait — la
         plupart des types sont dans ce cas, et « rien de connu » affiché
         autant de fois serait du bruit.

         LE COMPTE EXACT A ÉTÉ RETIRÉ le 28/10 : il disait « treize sur
         dix-sept » alors que la table en portait déjà dix-neuf avant ce
         lot, et vingt après. Un nombre figé dans une phrase ne garde
         rien et vieillit tout seul. */
      var ou = h('div', { class: 'item-resume dit-monte' });
      function majOu() {
        var l = A.m.montageDeLOutil(champNom.value.trim());
        if (!l.length) { ou.textContent = ''; return; }
        /* DEUX LIGNES, pas un pave : « se monte sur » et « pas sur »
           disent le contraire l'un de l'autre, et colles ils se lisent
           comme une seule phrase. */
        A.ui.vider(ou);
        /* QUAND IL Y EN A PLUSIEURS, chaque ligne nomme sa famille : « Iron
           Wrist Conic » est une poignee a rotation libre ET une poignee
           conique, et deux « Se monte sur » de suite ne disaient pas lequel
           venait d'ou. Trouve en cliquant la simulation, pas a la lecture. */
        var plusieurs = l.length > 1;
        l.forEach(function (x) {
          var tete = plusieurs ? A.m.nomDuType(x.type) + ' — se monte sur : '
                               : 'Se monte sur : ';
          ou.appendChild(h('div', { text: tete + x.monte }));
          if (x.pasSur) {
            ou.appendChild(h('div', { class: 'dit-pas',
                                      text: 'Pas sur : ' + x.pasSur }));
          }
        });
      }
      majOu();
      champNom.addEventListener('input', majOu);
      majLu();
      champNom.addEventListener('input', majLu);
      c.appendChild(dit);
      c.appendChild(ou);

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

          /* ---- les positions que l'outil SUGGÈRE ----
             MB, 27/10 : « propose les trois positions de mousqueton en
             réglages ». Une clé de poignet se monte le mousqueton au
             centre, à l'extérieur ou à l'intérieur, et ce n'est pas le
             même travail.

             ELLES NE SE CRÉENT PAS TOUTES SEULES : un appui ouvre la fiche
             avec le nom déjà écrit, et c'est encore lui qui enregistre.
             C'est la règle de l'app — rien n'est livré, le catalogue se
             construit avec ce qu'il saisit. Celles qui existent déjà ne
             sont plus proposées. */
          var positions = A.m.reglagesProposes(e, outil.nom);
          if (positions.length) {
            var boiteSug = h('div', { class: 'enrobe', style: 'margin-top:8px' });
            positions.forEach(function (nom) {
              var b = h('button', { type: 'button', class: 'bt bt-petit',
                                    text: '+ ' + nom });
              b.addEventListener('click', function () {
                editerReglage(outil, null, function () { rendreReglages(); }, nom);
              });
              boiteSug.appendChild(b);
            });
            boiteReg.appendChild(h('div', { class: 'item-resume',
              style: 'margin-top:10px',
              text: 'Cet outil se monte de plusieurs façons :' }));
            boiteReg.appendChild(boiteSug);
          }
        }
        rendreReglages();
        c.appendChild(A.ui.groupe('Réglages', boiteReg,
          'Facultatif. « Mousqueton à l’extérieur », « poignée fine » : ce qui '
        + 'change ce que l’outil sollicite, sans en faire un autre exercice. '
        + 'Un outil reconnu propose ses positions ; aucune ne s’ajoute avant '
        + 'que tu l’enregistres.'));

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


  /* ---------- envoyer un retour ----------

     Les betateseurs rapportent depuis WhatsApp ou Discord : c'est comme ca
     que les gens le font, et leur demander d'ouvrir un compte GitHub serait
     perdre le retour. « Copier » est donc le chemin principal ; le ticket
     est l'autre, pour qui a deja un compte.

     RIEN NE PART TOUT SEUL, et le texte est visible EN ENTIER avant. Le bloc
     technique n'est ni replie ni cache derriere un « voir » : si on ne peut
     pas le lire, on ne peut pas consentir a l'envoyer.

     C'est le seul endroit de l'app qui mene dehors. Pas une requete —
     aucun fetch, aucun XHR — une NAVIGATION vers github.com, declenchee par
     un appui, avec le texte lu avant. */

  /* Le decor du navigateur, releve ICI. Le modele ne l'interroge pas : il
     recoit ce qu'on lui donne, ce qui le rend mesurable sans navigateur. */
  function decorNavigateur() {
    var ko = null;
    try {
      var brut = (window.localStorage.getItem(A.store.CLE) || '').length;
      ko = Math.round(brut / 1024 * 10) / 10;
    } catch (err) { ko = null; }
    var installee = null;
    try {
      installee = !!((window.matchMedia
                   && window.matchMedia('(display-mode: standalone)').matches)
                  || window.navigator.standalone === true);
    } catch (err) { installee = null; }
    return {
      version: window.APP_VERSION || null,
      largeur: window.innerWidth, hauteur: window.innerHeight,
      ratio: window.devicePixelRatio || null,
      navigateur: (window.navigator && navigator.userAgent) || null,
      installee: installee,
      tailleKo: ko,
      durable: A.store.estPersistant()
    };
  }

  /* Copier sans se taire en cas d'echec. Le presse-papier refuse dans un
     contexte non securise, sans permission, ou simplement parce que le
     navigateur ne l'a pas : on selectionne alors le texte pour que le geste
     manuel reste possible, et on DIT quoi faire. */
  function copierTexte(texte, hote) {
    function secours() {
      var zone = h('textarea', { class: 'champ retour-secours', readonly: 'readonly' });
      zone.value = texte;
      hote.appendChild(zone);
      try { zone.focus(); zone.select(); zone.setSelectionRange(0, texte.length); } catch (e) {}
      A.ui.toast('Le navigateur a refusé le presse-papier. Le texte est '
               + 'sélectionné juste en dessous : copie-le à la main.');
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texte).then(function () {
          A.ui.toast('Copié. Colle-le dans WhatsApp ou Discord.');
        }, secours);
        return;
      }
    } catch (err) { /* on tombe dans le secours */ }
    secours();
  }

  function sectionRetour(hote) {
    hote.appendChild(h('div', { class: 'sous-titre', text: 'Envoyer un retour' }));
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px',
      text: 'Décris ce que tu faisais, ce que tu attendais, et ce qui s’est passé. '
          + 'Le bloc en dessous est ajouté automatiquement : il dit la version et le '
          + 'décor, jamais ton entraînement. Rien ne part tout seul.' }));

    var champ = h('textarea', { class: 'champ champ-retour', rows: '5',
      placeholder: 'J’ai appuyé sur…, je m’attendais à…, et à la place…' });
    hote.appendChild(champ);

    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:10px 2px 5px',
      text: 'Ce qui sera joint, en entier :' }));
    var contexte = A.m.contexteTechnique(etat(), decorNavigateur());
    var bloc = h('pre', { class: 'retour-contexte', text: contexte });
    hote.appendChild(bloc);

    /* « Stockage durable » arrive en differe, comme dans la carte au-dessus :
       on relit une fois plutot que de joindre « non renseigné » pour toujours. */
    if (A.store.estPersistant() === null) {
      setTimeout(function () {
        contexte = A.m.contexteTechnique(etat(), decorNavigateur());
        bloc.textContent = contexte;
      }, 900);
    }

    var boite = h('div');

    var btCopier = h('button', { class: 'bt bt-large bt-primaire',
                                 style: 'margin-bottom:8px', text: 'Copier' });
    btCopier.addEventListener('click', function () {
      var t = A.m.texteRetour(champ.value, contexte);
      if (!t) { A.ui.toast('Écris d’abord ce que tu as vu.'); champ.focus(); return; }
      copierTexte(t, boite);
    });
    hote.appendChild(btCopier);

    var btTicket = h('button', { class: 'bt bt-large', text: 'Ouvrir un ticket GitHub' });
    btTicket.addEventListener('click', function () {
      var t = A.m.texteRetour(champ.value, contexte);
      if (!t) { A.ui.toast('Écris d’abord ce que tu as vu.'); champ.focus(); return; }
      var lien = A.m.lienTicket('Retour — Carnet AW ' + (window.APP_VERSION || ''), t);
      if (!lien) {
        A.ui.toast('Ce retour est trop long pour tenir dans un lien. '
                 + 'Appuie sur « Copier » et colle-le dans le ticket.');
        return;
      }
      window.open(lien, '_blank', 'noopener');
    });
    hote.appendChild(btTicket);
    hote.appendChild(boite);

    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:8px 2px 0',
      text: 'Le ticket ouvre github.com avec ce texte déjà écrit — c’est le seul '
          + 'endroit de l’app qui mène dehors, et il faut un compte GitHub. '
          + 'Sans compte, « Copier » fait aussi bien.' }));
  }


  /* Un bloc qui se replie, avec le compte visible FERME.

     Les memes classes que les categories de l'equipement dans le selecteur et
     que les regions de muscles dans la fiche : `equip-cat` pour l'entete,
     `equip-compte`, `equip-chevron`. Il y avait deja deux endroits ou ca se
     replie — en inventer un troisieme aurait donne trois chevrons differents.

     FERME au depart : c'est la demande, « par souci de visibilite ». Un
     catalogue de cinquante exercices pousse tout le reste sous l'ecran, et on
     ne cherche pas un exercice a chaque passage dans Reglages. Le compte reste
     lisible sans ouvrir — c'est ce qui rend le repli supportable.

     `hidden` SEUL ne suffit pas dans cette app : un `display` l'emporte, et ca
     s'est deja paye ici sur le filtre de l'equipement. La regle
     `.reglages-repli[hidden]` est dans la feuille, et le banc mesure la
     HAUTEUR REELLE, pas l'attribut. */
  function blocRepliable(titre, nbr) {
    var compte = h('span', { class: 'equip-compte', text: String(nbr) });
    var chevron = h('span', { class: 'equip-chevron', 'aria-hidden': 'true', text: '▾' });
    var entete = h('button', { type: 'button', class: 'equip-cat',
                               'aria-expanded': 'false' },
      h('b', { text: titre }), compte, chevron);
    var corps = h('div', { class: 'carte-corps reglages-repli', hidden: true });
    entete.addEventListener('click', function () {
      var ouvert = entete.getAttribute('aria-expanded') === 'true';
      entete.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
      corps.hidden = ouvert;
    });
    return { carte: h('div', { class: 'carte' }, entete, corps), corps: corps };
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

    /* ================================================================
       MON POIDS

       MB, 29/10 : « j'y ai pensé quand j'ai mis un exo avec poids du corps,
       n'ayant pas mon poids de corps enregistré, j'ai trouvé ça dommage ».

       IL EST DATÉ. Un poids de corps change ; une valeur unique aurait
       recalculé l'historique à chaque pesée. Une ligne par pesée, et c'est
       `poidsAuJour` qui rend celle qui était en vigueur un jour donné.

       PAS DE TAILLE. Elle avait été demandée aussi, et je ne la pose pas :
       RIEN dans le carnet ne la lirait. Un champ que rien ne consomme est
       un champ qui pourrit, et c'est l'argument qui vaut ici autant
       qu'ailleurs. Le jour où un écran en a besoin, elle entrera avec lui.
       ================================================================ */
    hote.appendChild(h('div', { class: 'sous-titre', text: 'Mon poids' }));

    var champDatePoids = h('input', { class: 'champ', type: 'date',
                                      value: A.m.aujourdHui() });
    var champPoids = h('input', { class: 'champ', type: 'number', min: '1',
                                  max: '500', step: '0.1', inputmode: 'decimal',
                                  placeholder: 'kg' });
    var btPeser = h('button', { class: 'bt bt-petit', text: 'Enregistrer' });
    var listePesees = h('div');

    function rendrePesees() {
      A.ui.vider(listePesees);
      var l = A.m.peseesTriees(e);
      if (!l.length) {
        listePesees.appendChild(h('div', { class: 'item-resume',
          text: 'Aucune pesée. Tant qu’il n’y en a pas, un exercice en poids '
              + 'du corps ne peut rien afficher d’autre que son lest.' }));
        return;
      }
      l.forEach(function (p, i) {
        /* L'ECART AVEC LA PESEE PRECEDENTE — c'est-à-dire la SUIVANTE dans
           la liste, puisqu'elle est triée du plus récent au plus ancien.
           Gratuit dès lors que les pesées sont datées, et c'est la seule
           chose que la liste apprend qu'une valeur unique ne dirait pas. */
        var avant = l[i + 1];
        var ecart = avant ? Math.round((p.poids - avant.poids) * 10) / 10 : null;
        var bt = h('button', { class: 'bt bt-petit bt-danger pousse',
                               text: 'Supprimer' });
        A.ui.confirmer2(bt, 'Confirmer ?', function () {
          A.m.supprimerPesee(e, p.id);
          A.store.sauver(true);
          rendrePesees();
        });
        listePesees.appendChild(h('div', { class: 'item-ligne rangee' },
          h('span', { text: A.m.dateCourte(p.date) }),
          h('b', { text: p.poids + ' kg' }),
          h('span', { class: 'item-resume',
                      text: ecart == null ? ''
                          : (ecart > 0 ? '+' : '') + ecart + ' kg' }),
          bt));
      });
    }

    function enregistrerPesee() {
      var kg = parseFloat(String(champPoids.value).replace(',', '.'));
      if (!isFinite(kg) || kg <= 0 || kg > 500) {
        A.ui.toast('Un poids entre 1 et 500 kg. Le carnet refuse la frappe, '
                 + 'pas le gabarit.');
        return;
      }
      var quand = champDatePoids.value || A.m.aujourdHui();
      A.m.poserPesee(e, quand, kg);
      A.store.sauver(true);
      champPoids.value = '';
      rendrePesees();
      A.ui.toast('Pesée du ' + A.m.dateCourte(quand) + ' enregistrée. Elle ne '
               + 'change aucun tonnage.');
    }
    btPeser.addEventListener('click', enregistrerPesee);
    /* Entrée valide : sur un téléphone, viser le bouton après avoir tapé
       deux chiffres est un geste de trop. */
    champPoids.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); enregistrerPesee(); }
    });

    hote.appendChild(h('div', { class: 'rangee' }, champDatePoids, champPoids, btPeser));
    /* L'AIDE DIT CE QUE LE GESTE FAIT ET CE QU'IL NE FAIT PAS. Sans la
       seconde moitié, MB attendrait que son volume par semaine bouge, et il
       ne bougera pas : `poids_corps` garde `tonnage: false`, décision prise
       à part pour ne pas réécrire des chiffres déjà lus. */
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:8px 2px 10px',
      text: 'Une pesée par jour ; te repeser le soir corrige le matin. Elle '
          + 'sert à lire un exercice en poids du corps AU POIDS DE CE '
          + 'JOUR-LÀ — une séance de juillet garde le poids de juillet. Elle '
          + 'n’entre dans aucun tonnage : ton volume par semaine ne bougera '
          + 'pas.' }));
    rendrePesees();
    hote.appendChild(listePesees);

    /* Le CATALOGUE vient avant l'équipement, et les deux avant le reste.
       On cherche « qu'est-ce que j'ai déjà saisi » plus souvent qu'on
       n'exporte un carnet, et l'exercice se tape avant l'outil qui le
       sert. Un ordre d'écran est une décision, pas un hasard du code. */
    /* --- catalogue --- */
    /* ---- SEULS LES NOMS QUI NE SONT PAS AU DICTIONNAIRE ----
       MB, 28/10 : « a partir du moment ou l'exo est dans le dico, pourquoi
       le ravoir en visuel dans reglages ? » puis « seuls mes exos crees de
       ma main doivent etre visibles ».

       IL AVAIT RAISON, ET MON ARGUMENT ETAIT FAUX. Je lui avais dit que
       l'entree gardait SES reglages. Mesure : deux usages du meme nom avec
       des reglages differents ne font QU'UNE entree, et la seconde ECRASE
       la premiere — kg devient elastique, charge+reps devient duree. Le
       catalogue ne garde pas des reglages par exercice ; il garde un jeu
       par NOM, et c'est le dernier. Ce qui garde vraiment les reglages,
       c'est l'exercice lui-meme dans son programme ou sa seance.

       CE QUI RESTE, ET QU'ON NE JETTE PAS : il PRE-REMPLIT le prochain
       exercice du meme nom. Les entrees du dictionnaire continuent donc
       d'etre memorisees — elles ne sont plus AFFICHEES. Et le carnet le
       DIT, parce qu'une liste qui maigrit sans explication inquiete plus
       qu'elle ne soulage.

       PRECEDENT, lui, n'a jamais lu ce catalogue : il parcourt les seances.
       Je l'avais range dans ses dependances, a tort. */
    var aMoi = e.exercices.filter(function (x) {
      return !A.m.auDictionnaire(x.nom);
    });
    var duDico = e.exercices.length - aMoi.length;

    hote.appendChild(h('div', { class: 'sous-titre', text: 'Exercices connus' }));
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px',
      text: 'Rien n’est livré ici : seuls tes exercices à toi, ceux qui ne '
          + 'sont pas au dictionnaire, sont listés. Ils alimentent '
          + 'l’autocomplétion.'
          + (duDico
              ? ' ' + duDico + ' nom' + (duDico > 1 ? 's' : '') + ' du '
                + 'dictionnaire ' + (duDico > 1 ? 'sont mémorisés' : 'est mémorisé')
                + ' sans être listé' + (duDico > 1 ? 's' : '') + ' : le carnet '
                + 's’en sert pour te pré-remplir.'
              : '') }));

    if (!aMoi.length) {
      hote.appendChild(h('div', { class: 'vide' },
        h('strong', { text: duDico ? 'Rien qui soit à toi' : 'Catalogue vide' }),
        duDico
          ? 'Tout ce que tu as employé vient du dictionnaire. Un exercice '
            + 'que tu nommes toi-même apparaîtra ici.'
          : 'Il se remplira au premier exercice que tu saisiras.'));
    } else {
      var bloc2 = blocRepliable('Catalogue', aMoi.length);
      var corps2 = bloc2.corps;
      aMoi.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); }).forEach(function (x) {
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
      hote.appendChild(bloc2.carte);
    }

    /* L'équipement vient AVANT la sauvegarde et le reste : c'est ce qu'on
       ouvre le plus souvent dans cet écran — on ajoute un outil bien plus
       souvent qu'on n'exporte un carnet. Un ordre d'écran est une décision,
       pas un hasard du code, et le banc le tient. */
    /* --- équipement --- */
    hote.appendChild(h('div', { class: 'sous-titre', text: 'Équipement' }));
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px',
      text: 'Ton équipement ne contient que ce que tu y mets : rien n’y '
          + 'entre tout seul. Les marques ci-dessous sont un relevé à '
          + 'parcourir, pas une liste livrée. Un exercice peut porter '
          + 'plusieurs outils — « Titan Grip » et « Poulie haute » ensemble. '
          + 'Les catégories sont les tiennes : tape-en une nouvelle et elle '
          + 'existe.' }));

    var btOutilNeuf = h('button', { class: 'bt bt-large', style: 'margin-bottom:10px',
                                    text: '+ Ajouter un outil' });
    btOutilNeuf.addEventListener('click', function () {
      editerOutil(null, function () { rendre(hote); });
    });
    hote.appendChild(btOutilNeuf);

    /* ---- PARCOURIR LES MARQUES ----
       MB, 27/10 : « je ne vois pas Titan Grip avec les sous categories et
       equipements propres a la marque ». C'est une REFERENCE, pas une
       livraison : rien n'entre dans son equipement tant qu'il n'a pas
       appuye, et l'appui ouvre la fiche avec le nom ecrit. La liste
       ci-dessous reste vide tant qu'il n'a rien pose. */
    var btMarques = h('button', { class: 'bt bt-large', style: 'margin-bottom:10px',
                                  text: 'Parcourir les marques ('
                                      + A.m.CATALOGUE_MARQUES.length + ')' });
    btMarques.addEventListener('click', function () { ouvrirMarques(); });
    hote.appendChild(btMarques);

    function ouvrirMarques() {
      A.panneau.ouvrir('Les marques', function (c) {
        c.appendChild(h('div', { class: 'item-resume' },
          'Un relevé de ' + A.m.CATALOGUE_MARQUES.length + ' références, pour '
        + 'retrouver le tien sans le taper. Rien n’entre dans ton équipement '
        + 'tant que tu n’as pas enregistré. Il datera : ce que tu ne trouves '
        + 'pas ici, tape-le à la main.'));
        A.m.marquesConnues().forEach(function (marque) {
          var familles = A.m.produitsDeLaMarque(marque);
          var combien = familles.reduce(function (n, f) {
            return n + f.produits.length;
          }, 0);
          var b = h('button', { type: 'button', class: 'item-ligne item-bouton' },
            h('b', { text: marque }),
            h('span', { text: combien + ' référence' + (combien > 1 ? 's' : '') }));
          b.addEventListener('click', function () { ouvrirMarque(marque); });
          c.appendChild(b);
        });
      }, [{ nom: 'Fermer', classe: 'bt-primaire',
            action: function (fermer) { fermer(); } }]);
    }

    function ouvrirMarque(marque) {
      A.panneau.ouvrir(marque, function (c, fermer) {
        A.m.produitsDeLaMarque(marque).forEach(function (f) {
          var boite = h('div');
          f.produits.forEach(function (nom) {
            var deja = !!A.m.trouverOutil(e, A.m.slug(nom));
            var b = h('button', { type: 'button', class: 'item-ligne item-bouton' },
              h('b', { text: nom }),
              h('span', { text: deja ? 'déjà chez toi'
                                     : A.m.musclesDeLOutil([nom]).length
                                       + ' muscle(s)' }));
            b.addEventListener('click', function () {
              fermer();
              editerOutil(null, function () { rendre(hote); }, nom);
            });
            boite.appendChild(b);
          });
          /* LA FAMILLE PORTE SON NOM, pas sa cle : « Cle de poignet », et
             non « wrist wrench ». La cle sert au code — elle n'a rien a
             faire sous les yeux de qui ouvre son equipement. */
          c.appendChild(A.ui.groupe(A.m.nomDuType(f.cle), boite));
        });
      }, [{ nom: 'Fermer', classe: 'bt-primaire',
            action: function (fermer) { fermer(); } }]);
    }

    if (!e.outils.length) {
      hote.appendChild(h('div', { class: 'vide' }, h('strong', { text: 'Aucun outil' }),
        'Ajoute-le ici, ou saisis-le directement dans la fiche d’un exercice : il entrera tout seul.'));
    } else {
      /* Un BOUTON, pas un div avec un curseur : une ligne qui s'ouvre doit
         s'atteindre au clavier, s'annoncer aux lecteurs d'écran et faire
         44 px de haut comme tout ce qui se touche ici. */
      function ligneOutil(o) {
        var combien = compterUsages(e, o);
        var ligne = h('button', { type: 'button', class: 'item-ligne item-bouton' },
          h('b', { text: o.nom }),
          h('span', { text: combien ? combien + ' exo' + (combien > 1 ? 's' : '') : 'non employé' }));
        ligne.addEventListener('click', function () { editerOutil(o, function () { rendre(hote); }); });
        return ligne;
      }

      A.m.outilsParCategorie(e).forEach(function (g) {
        var bloc3 = blocRepliable(g.categorie, g.outils.length);
        g.outils.forEach(function (o) { bloc3.corps.appendChild(ligneOutil(o)); });
        hote.appendChild(bloc3.carte);
      });

      /* ---- CE QUE LE CARNET RECONNAIT DEJA, REPLIE ----
         MB, 28/10 : « il est deja dans le dico, il n'a pas besoin d'etre en
         doublon dans mes equipements ET dans le dico ». Il sort donc de la
         liste du haut — mais il reste ATTEIGNABLE, parce que c'est ici, et
         nulle part ailleurs, qu'on pose les positions de mousqueton d'un
         Wrist Wrench. Les masquer tout a fait aurait ferme cette porte. */
      var reconnus = A.m.outilsParCategorie(e, 'reconnus');
      var combienR = 0;
      reconnus.forEach(function (g) { combienR += g.outils.length; });
      if (combienR) {
        var blocR = blocRepliable('Reconnus par le carnet', combienR);
        blocR.corps.appendChild(h('div', { class: 'item-resume', style: 'margin:2px 2px 8px',
          text: 'Le carnet sait déjà ce que ces équipements sollicitent : '
              + 'ils ne sont pas listés plus haut. Ouvre-en un pour lui '
              + 'donner des réglages — des positions de mousqueton, par '
              + 'exemple. Il remontera alors dans ta liste.' }));
        reconnus.forEach(function (g) {
          g.outils.forEach(function (o) { blocR.corps.appendChild(ligneOutil(o)); });
        });
        hote.appendChild(blocR.carte);
      }
    }


    /* --- sauvegarde --- */
    /* ------------------------------------------------------------------
       MON DICTIONNAIRE

       MB : « le dictionnaire devrait logiquement, a terme, tout comprendre,
       voir meme rajouter un exo au dictionnaire ». Les fiches s'ecrivent
       dans la fiche d'exercice ; elles se relisent et se suppriment ici.
       ------------------------------------------------------------------ */
    /* ---------- LE DICTIONNAIRE DU CARNET ----------

       MB, 29/10 : « j'aimerai aussi que le dictionnaire existant soit
       consultable pour le moment dans "réglages" en attendant que ce
       dernier soit consultable en version finale dans "Ajouter un
       exercice" ».

       « POUR LE MOMENT » EST DE LUI, et la section le dit : c'est une
       fenêtre pour LIRE, pas l'écran final. Les catégories de muscles et
       les images par exercice sont le chantier 3 de CHANTIERS.md.

       LA RECHERCHE EST CELLE DE L'ÉCRAN D'AJOUT, pas une seconde : taper
       « curl poulie » doit donner ici ce que ça donne là. */
    hote.appendChild(h('div', { class: 'sous-titre', text: 'Le dictionnaire du carnet' }));

    var nbFiches = A.m.DICTIONNAIRE.length;
    var nbEcritures = A.m.DICTIONNAIRE.reduce(function (n, d) {
      return n + 1 + (d.aussi || []).length;
    }, 0);
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px',
      text: nbFiches + ' mouvements, ' + nbEcritures + ' façons de les écrire. '
          + 'Une fiche remplit les MUSCLES d’un exercice, rien d’autre : ni '
          + 'la charge, ni la prise, ni le côté. Fenêtre de lecture en '
          + 'attendant la version feuilletable, avec les groupes de muscles '
          + 'et les images, dans « Ajouter un exercice ».' }));

    var chercheDico = h('input', { type: 'text', class: 'champ',
                                   placeholder: 'Chercher : curl poulie, cable, épaules…',
                                   'aria-label': 'Chercher dans le dictionnaire' });
    hote.appendChild(chercheDico);
    var listeDico = h('div', { style: 'margin-top:10px' });
    var compteDico = h('div', { class: 'item-resume', style: 'margin:8px 2px 0' });
    hote.appendChild(listeDico);
    hote.appendChild(compteDico);

    function rendreDico() {
      A.ui.vider(listeDico);
      var q = chercheDico.value.trim();
      var l = A.m.fichesDuDictionnaire(e, q);
      /* UN RÉSULTAT VIDE SE DIT. Une liste qui disparaît sans un mot se lit
         comme une panne, pas comme « rien ne correspond ». */
      if (!l.length) {
        compteDico.textContent = 'Aucun mouvement ne correspond à « ' + q + ' ».';
        return;
      }
      compteDico.textContent = q
        ? l.length + ' mouvement' + (l.length > 1 ? 's' : '') + ' sur ' + nbFiches + '.'
        : 'Dans l’ordre du dictionnaire, par famille.';
      l.forEach(function (d) {
        var carte = h('div', { class: 'carte' });
        var corps = h('div', { class: 'carte-corps' });
        corps.appendChild(h('div', { class: 'remarque-titre', text: d.nom }));
        var mus = h('div', { class: 'item-resume' });
        mus.appendChild(h('b', { text: 'Muscles : ' }));
        mus.appendChild(document.createTextNode(
          (d.muscles || []).length
            ? d.muscles.map(A.m.nomCourtMuscle).join(', ')
            : 'aucun — cette fiche ne remplit rien'));
        corps.appendChild(mus);
        if ((d.aussi || []).length) {
          var au = h('div', { class: 'item-resume', style: 'margin-top:4px' });
          au.appendChild(h('b', { text: 'Aussi écrit : ' }));
          au.appendChild(document.createTextNode(d.aussi.join(' · ')));
          corps.appendChild(au);
        }
        carte.appendChild(corps);
        listeDico.appendChild(carte);
      });
    }
    chercheDico.addEventListener('input', rendreDico);
    rendreDico();

    hote.appendChild(h('div', { class: 'sous-titre', text: 'Mon dictionnaire' }));
    var fiches = A.m.dictionnairePerso(e);
    hote.appendChild(h('div', { class: 'item-resume', style: 'margin:-3px 2px 9px',
      text: 'Les exercices que tu as versés toi-même. Une fiche rend ses '
          + 'muscles, et rien d’autre — comme une fiche livrée. Elle se '
          + 'crée depuis la fiche d’exercice, sous les muscles.' }));

    /* --- LES HOMONYMES, s'il y en a --- */
    var conflits = A.m.conflitsDictionnaire(e);
    conflits.forEach(function (c) {
      var carte = h('div', { class: 'carte' });
      var corps = h('div', { class: 'carte-corps' });
      corps.appendChild(h('div', { class: 'remarque-titre',
        text: 'Deux fiches pour « ' + c.perso.nom + ' »' }));
      corps.appendChild(h('div', { class: 'item-resume',
        text: 'Une version du carnet a livré une fiche portant ce nom. '
            + 'En attendant que tu tranches, c’est LA TIENNE qui joue — '
            + 'rien n’a changé dans tes exercices.' }));

      function liste(titre, ids) {
        var l = h('div', { class: 'item-resume', style: 'margin-top:6px' });
        l.appendChild(h('b', { text: titre + ' (' + ids.length + ') : ' }));
        l.appendChild(document.createTextNode(
          ids.length ? ids.map(A.m.nomCourtMuscle).join(', ') : 'aucun'));
        return l;
      }
      var aMoiM = A.m.muscles(c.perso), livM = A.m.muscles(c.livree);
      corps.appendChild(liste('La tienne', aMoiM));
      corps.appendChild(liste('Celle du carnet', livM));

      /* CE QU'ON PERD, calculé — pas deux listes à comparer de l'œil. */
      var perdus = aMoiM.filter(function (id) { return livM.indexOf(id) < 0; });
      var gagnes = livM.filter(function (id) { return aMoiM.indexOf(id) < 0; });
      var ecart = h('div', { class: 'item-resume', style: 'margin-top:6px' });
      if (!perdus.length && !gagnes.length) {
        ecart.textContent = 'Les deux portent exactement les mêmes muscles : '
                          + 'le choix ne change rien à tes chiffres.';
      } else {
        var bouts = [];
        if (perdus.length) bouts.push('prendre celle du carnet te ferait perdre '
          + perdus.map(A.m.nomCourtMuscle).join(', '));
        if (gagnes.length) bouts.push('elle t’apporterait '
          + gagnes.map(A.m.nomCourtMuscle).join(', '));
        ecart.textContent = bouts.join(' ; ') + '.';
      }
      corps.appendChild(ecart);

      var acts = h('div', { class: 'recup-actions' });
      var btMoi = h('button', { class: 'bt bt-petit', text: 'Je garde la mienne' });
      btMoi.addEventListener('click', function () {
        A.m.trancherConflit(e, c.perso.id, 'moi');
        A.store.sauver(true);
        A.ui.toast('Ta fiche « ' + c.perso.nom + ' » reste celle qui joue.');
        rendre(hote);
      });
      var btLiv = A.ui.confirmer2(
        h('button', { class: 'bt bt-petit bt-danger', text: 'Prendre celle du carnet' }),
        'Appuyer encore — ta fiche sera supprimée',
        function () {
          A.m.trancherConflit(e, c.perso.id, 'livree');
          A.store.sauver(true);
          A.ui.toast('Ta fiche est supprimée ; celle du carnet prend la main.');
          rendre(hote);
        });
      acts.appendChild(btMoi);
      acts.appendChild(btLiv);
      corps.appendChild(acts);
      carte.appendChild(corps);
      hote.appendChild(carte);
    });

    if (!fiches.length) {
      hote.appendChild(h('div', { class: 'vide' },
        h('strong', { text: 'Aucune fiche à toi' }),
        'Quand tu nommes un exercice que le carnet ne connaît pas et que tu '
      + 'coches ses muscles, un bouton apparaît sous les muscles pour le '
      + 'verser ici. Ses muscles reviendront seuls la fois suivante.'));
    } else {
      var blocD = blocRepliable('Mes fiches', fiches.length);
      fiches.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); })
        .forEach(function (f) {
          var sup = h('button', { class: 'bt-icone', text: '✕',
                                  'aria-label': 'Retirer ' + f.nom + ' de mon dictionnaire' });
          A.ui.confirmer2(sup, '✓ ?', function () {
            A.m.supprimerDuDictionnaire(e, f.id);
            A.store.sauver(true);
            A.ui.toast('« ' + f.nom + ' » n’est plus dans ton dictionnaire. '
                     + 'Tes exercices passés gardent leurs muscles.');
            rendre(hote);
          });
          var n = A.m.muscles(f).length;
          blocD.corps.appendChild(h('div', { class: 'item' },
            h('div', { class: 'item-corps' },
              h('div', { class: 'item-nom', text: f.nom }),
              h('div', { class: 'item-resume',
                         text: n + ' muscle' + (n > 1 ? 's' : '')
                             + ' · ' + A.m.muscles(f).map(A.m.nomCourtMuscle).join(', ') })),
            sup));
        });
      hote.appendChild(blocD.carte);
    }

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

    sectionRetour(hote);

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
  /* `editerOutil` sort d'ici depuis le 27/10 : la fiche d'exercice en a
     besoin pour l'affichage C, ou un appui sur une reference de marque
     ouvre la fiche de l'outil avec le nom deja ecrit. Elle reste DEFINIE
     ici, aupres de l'ecran qui la possede. */
  A.vues.reglages = { rendre: rendre, editerOutil: editerOutil,
                      titre: function () { return 'Réglages'; } };
})(window.App || (window.App = {}));
