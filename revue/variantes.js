/* LA PLANCHE DES VARIANTES — dériver, puis laisser MB trancher.

   Le chantier 2 veut qu'un mouvement porte UN nom et que l'engin devienne
   une variante enregistrée. Les variantes ne sont pas écrites à la main :
   elles sont DERIVEES des écritures que le dictionnaire porte déjà, puis
   corrigées ici.

   POURQUOI UNE PLANCHE ET PAS UNE LIVRAISON DIRECTE : la dérivation se
   trompe, et elle s'est trompée quatre fois en étant construite —
   « Extension VERTICALE des triceps » faisait sortir « barre · assis
   verticale » (le mot venait du nom de la fiche) ; « Curl haltère debout
   sur banc incliné » sortait `banc` comme engin ; onze étiquettes
   répétaient l'engin (« barre · barre EZ ») ; cinq prenaient un support
   pour l'engin. Les quatre sont corrigées en code, mais il en reste que
   seul un bras de fer peut trancher.

   LA SORTIE : « Copier les corrections » met en presse-papier le JSON des
   décisions, qui servira à écrire la table dans le modèle. Rien ici
   n'écrit dans le carnet. */
(function (A) {
  'use strict';

  /* ================== LA DERIVATION ==================
     Une variante porte DEUX choses : l'engin et, quand il y en a une, la
     position. L'engin seul effacerait 18 nuances mesurées (couché /
     incliné / décliné, unilatéral, barre droite contre barre EZ). Une
     variante SANS position rend l'engin seul : cette forme contient
     l'autre, elle ne ferme donc rien. */
  var POSITIONS = [
    ['vis a vis', 'vis-à-vis'], ['haute', 'haute'], ['basse', 'basse'],
    ['inclin', 'incliné'], ['declin', 'décliné'], ['couch', 'couché'],
    ['allong', 'allongé'], ['assis', 'assis'], ['debout', 'debout'],
    ['genoux', 'à genoux'], ['unilater', 'unilatéral'], ['un bras', 'un bras'],
    ['deux mains', 'à deux mains'], ['deux halter', 'deux haltères'],
    ['ez', 'barre EZ'], ['pupitre', 'au pupitre'], ['overhead', 'overhead'],
    ['concentr', 'concentré'], ['nuque', 'nuque'], ['arrier', 'arrière'],
    ['seal', 'seal'], ['rotation', 'avec rotation'], ['marteau', 'prise marteau'],
    ['45', 'à 45°'], ['90', 'à 90°'], ['abduction', 'en abduction'],
    ['horizontal', 'horizontale'], ['vertical', 'verticale'],
    ['tete', 'au-dessus de la tête'], ['visage', 'au visage'],
    ['entre deux', 'entre deux'], ['chaise', 'sur chaise'],
    ['guidee', 'barre guidée'], ['smith', 'barre guidée']
  ];

  /* CES ECRITURES NE DECRIVENT PAS UNE VARIANTE, et les laisser entrer
     ferait un menu faux. Chacune porte sa raison. */
  var PAS_UNE_VARIANTE = {
    'Bench press': 'le nom anglais du mouvement',
    'Incline bench press': 'le nom anglais du mouvement',
    'Close grip bench press': 'le nom anglais du mouvement',
    'Rope climb': 'le nom anglais du mouvement',
    'Grimper de corde': 'un autre nom du mouvement',
    'Montée de corde': 'un autre nom du mouvement',
    'Poignée de pronation': 'l’outil qui EST le mouvement',
    'Poignée à ressort': 'l’outil qui EST le mouvement',
    'Tenue à la barre': 'un autre nom du mouvement',
    'Barre fixe en tenue': 'un autre nom du mouvement'
  };

  /* Le banc, la chaise et la poignée ne portent pas la charge. */
  var SUPPORTS = { banc: 1, chaise: 1, poignee: 1 };

  var NOM_ENGIN = { poulie: 'poulie', barre: 'barre', haltere: 'haltères',
                    elastique: 'élastique', machine: 'machine', banc: 'banc',
                    corde: 'corde', landmine: 'landmine', kettlebell: 'kettlebell',
                    poignee: 'poignée', chaise: 'chaise', sangle: 'sangle',
                    anneaux: 'anneaux', plaque: 'plaque' };

  function sa(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  function positionsBrutes(texte) {
    var mots = sa(texte || '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ');
    var plat = ' ' + mots.join(' ') + ' ', sortie = [];
    POSITIONS.forEach(function (p) {
      if (p[0].indexOf(' ') >= 0) { if (plat.indexOf(' ' + p[0]) >= 0) sortie.push(p[1]); return; }
      for (var i = 0; i < mots.length; i++) {
        if (mots[i].indexOf(p[0]) === 0) { sortie.push(p[1]); return; }
      }
    });
    return sortie;
  }

  /* Une position déjà dite par le NOM DE BASE n'en est pas une : sinon
     « Extension verticale des triceps » colle « verticale » sur ses huit. */
  function positionDe(ecriture, nomFiche) {
    var parLeNom = positionsBrutes(nomFiche);
    return positionsBrutes(ecriture).filter(function (p) { return parLeNom.indexOf(p) < 0; });
  }

  /* L'engin de CHARGE bat le support : « Curl haltère debout sur banc
     incliné » est un curl aux haltères, pas un curl au banc. */
  function enginDe(ecriture) {
    var mots = A.m.motsCherche(ecriture) || [], charge = null, support = null;
    mots.forEach(function (w) {
      var f = A.m.familleEngin(w);
      if (!f) return;
      if (SUPPORTS[f]) { if (!support) support = f; }
      else if (!charge) charge = f;
    });
    return charge || support;
  }

  /* Une position qui nomme déjà l'engin le REMPLACE : « barre · barre EZ »
     devient « barre EZ ». Onze étiquettes se répétaient ainsi. */
  function etiquette(engin, positions) {
    if (!engin) return positions.join(' ');
    var nom = NOM_ENGIN[engin] || engin;
    var racine = sa(nom).replace(/s$/, '');
    if (positions.some(function (p) { return sa(p).indexOf(racine) >= 0; })) {
      return positions.join(' ');
    }
    return positions.length ? nom + ' · ' + positions.join(' ') : nom;
  }

  function variantesDe(fiche) {
    /* Le support n'est l'engin que si la fiche n'a PAS d'engin de charge
       ailleurs : le banc est l'engin des Dips, le décor de l'Oiseau. */
    var aUneCharge = (fiche.aussi || []).some(function (e) {
      var g = enginDe(e);
      return g && !SUPPORTS[g];
    });
    var vues = {}, sortie = [];
    (fiche.aussi || []).forEach(function (e) {
      if (PAS_UNE_VARIANTE[e]) return;
      var eng = enginDe(e);
      if (!eng) return;
      var pos = positionDe(e, fiche.nom);
      if (SUPPORTS[eng] && aUneCharge) {
        if (!pos.length) return;
        eng = null;
      }
      var cle = (eng || '') + '|' + pos.join('+');
      if (vues[cle]) { vues[cle].ecritures.push(e); return; }
      var v = { cle: cle, engin: eng, position: pos.slice(), ecritures: [e],
                texte: etiquette(eng, pos) };
      vues[cle] = v;
      sortie.push(v);
    });
    return sortie;
  }

  /* ================== CE QUI DEMANDE L'ŒIL DE MB ==================
     Mesuré, pas estimé : chaque motif porte le compte qui l'a fait naître. */
  function aSignaler(v, fiche) {
    var raisons = [];
    if (v.texte.length > 26) {
      raisons.push('étiquette longue (' + v.texte.length + ' signes) — à fondre ou à raccourcir ?');
    }
    if (v.position.length >= 3) {
      raisons.push('trois positions empilées — une seule suffirait-elle ?');
    }
    if (v.engin && SUPPORTS[v.engin]) {
      raisons.push('le support sert d’engin : juste pour les dips, douteux ailleurs');
    }
    if (!v.engin) {
      raisons.push('aucun engin nommé par l’écriture — seule la position reste');
    }
    return raisons;
  }

  A.variantes = {
    POSITIONS: POSITIONS, PAS_UNE_VARIANTE: PAS_UNE_VARIANTE,
    NOM_ENGIN: NOM_ENGIN, SUPPORTS: SUPPORTS,
    positionDe: positionDe, enginDe: enginDe, etiquette: etiquette,
    variantesDe: variantesDe, aSignaler: aSignaler
  };
})(window.App || (window.App = {}));
