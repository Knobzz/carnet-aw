/* LES TRACTIONS, REGROUPÉES — décision de MB, 2026-10-31.

   « J'aimerai un exo Traction avec les 4-5 tractions qui sont possibles et
   pareil pour Traction partielle. » Puis, devant l'écran : « Donc "Dos", je
   vois Pull up... Mais c'est traction en fait, ya un doublon flagrant,
   règle moi ça aussi. »

   HUIT FICHES DEVIENNENT DEUX. Mesuré avant d'écrire :

     Traction          ← Pull up (renommée), Chin up, prise large, prise serrée
     Traction partielle ← elle-même, supinée, prise large, prise serrée

   CE QUE LA FUSION COÛTE, ET C'EST MESURÉ. Les huit fiches partagent SIX
   muscles — grand pectoral, grand dorsal, grand rond, biceps, brachial,
   brachio-radial. La SEULE différence tient au **trapèze** : présent sur la
   pronée et la prise large, absent sur la supinée et la prise serrée. Une
   fiche unique doit donc trancher, et elle le porte — c'est la prise la plus
   courante. L'explication du geste « supinée » dit ce qui change.

   ET LA MESURE DU CARNET EST CONFIRMÉE PAR LA RECHERCHE : une étude trouve
   le pectoral et le biceps plus actifs en supination, et le trapèze
   inférieur plus actif en pronation. C'est exactement la différence que le
   dictionnaire portait déjà.

   LA LARGEUR, EN REVANCHE, EST BEAUCOUP MOINS NETTE, et c'est dit dans son
   explication plutôt que caché : les effets rapportés sont petits et
   inconsistants, et une étude sur le tirage vertical ne trouve pas de
   différence significative selon la prise.

   RIEN N'EST SUPPRIMÉ DU CARNET. Les six noms absorbés deviennent des
   écritures de leur fiche d'accueil : « Chin up » reste cherchable, et une
   séance passée qui le porte continue de se retrouver. */
(function (A) {
  'use strict';

  var RENOMMER = { 'Pull up': 'Traction' };

  var ABSORPTIONS = [
    /* ---------- vers « Traction » ---------- */
    {
      vers: 'Pull up',            /* nom AVANT renommage */
      fiche: 'Chin up',
      geste: 'Traction supinée',
      faire: 'Paumes tournées vers soi, mains à largeur d’épaules.',
      change: 'Une étude trouve le pectoral et le biceps plus actifs qu’en pronation, le trapèze inférieur moins.',
      garde: 'Le trapèze que porte la fiche « Traction » travaille MOINS '
           + 'ici. Une autre source nuance : à charge suffisante, les deux '
           + 'prises activent assez semblablement — la différence est '
           + 'réelle mais plus petite qu’on ne le dit souvent.',
      source: 'étude de tirage vertical citée par Fitness Volt, comparatif '
            + 'pull-up / chin-up, Breaking Muscle'
    },
    {
      vers: 'Pull up',
      fiche: 'Traction prise large',
      geste: 'Traction prise large',
      faire: 'Mains nettement plus larges que les épaules, paumes vers '
           + 'l’avant.',
      change: 'Censée reporter le travail sur le haut du grand dorsal et le '
            + 'grand rond.',
      garde: 'LA MESURE NE SUIT PAS TRÈS BIEN. Les effets de largeur '
           + 'rapportés sont petits et inconsistants ; une étude sur le '
           + 'tirage vertical ne trouve PAS de différence significative '
           + 'd’activation du grand dorsal selon la prise. Les affirmations '
           + 'les plus tranchées viennent de blogs sans source primaire.',
      source: 'Andersen et al. via StrengthLog, Breaking Muscle, '
            + 'revue de Fitness Volt'
    },
    {
      vers: 'Pull up',
      fiche: 'Traction prise serrée',
      geste: 'Traction prise serrée',
      faire: 'Mains proches l’une de l’autre, paumes vers l’avant.',
      change: 'Amplitude plus longue, et les fléchisseurs du coude prennent '
            + 'une part plus grande qu’en prise large.',
      garde: 'Même réserve que pour la prise large : l’effet de la largeur '
           + 'est faible dans les mesures, bien plus faible que dans ce '
           + 'qu’on en lit.',
      source: 'Andersen et al. via StrengthLog, Breaking Muscle'
    },

    /* ---------- vers « Traction partielle » ---------- */
    {
      vers: 'Traction partielle',
      fiche: 'Traction partielle supinée',
      geste: 'Traction partielle supinée',
      faire: 'Traction partielle, paumes tournées vers soi.',
      change: 'Même différence qu’entre traction et traction supinée : plus '
            + 'de biceps et de pectoral, moins de trapèze.',
      source: 'même étude que la traction supinée'
    },
    {
      vers: 'Traction partielle',
      fiche: 'Traction partielle prise large',
      geste: 'Traction partielle prise large',
      faire: 'Traction partielle, mains nettement plus larges que les '
           + 'épaules.',
      change: 'Travail orienté vers le haut du dos sur la portion choisie.',
      garde: 'Même réserve sur la largeur : l’effet mesuré est petit.',
      source: 'Andersen et al. via StrengthLog'
    },
    {
      vers: 'Traction partielle',
      fiche: 'Traction partielle prise serrée',
      geste: 'Traction partielle prise serrée',
      faire: 'Traction partielle, mains proches l’une de l’autre.',
      change: 'Les fléchisseurs du coude prennent davantage sur la portion '
            + 'travaillée.',
      garde: 'Même réserve sur la largeur.',
      source: 'Andersen et al. via StrengthLog'
    }
  ];

  A.tractionsRegroupees = { RENOMMER: RENOMMER, ABSORPTIONS: ABSORPTIONS };
})(window.App || (window.App = {}));
