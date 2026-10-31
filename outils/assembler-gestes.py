# -*- coding: utf-8 -*-
u"""ASSEMBLER js/gestes.js DEPUIS LES FICHIERS DE REVUE.

POURQUOI PAS DANS model.js : il faudrait y retaper 39 Ko de donnees, et
chaque retape est une occasion de perdre un mot. Les fichiers de revue sont
DEJA la source relue par MB — on les assemble, on ne les recopie pas.

CE QUE LE FICHIER PORTE :
  - les 57 explications de mouvement ;
  - les 38 gestes, avec leur explication, ranges PAR FICHE ;
  - de quoi dire, pour un nom donne, s'il est un geste.

CE QU'IL NE PORTE PAS : le classement des 105 autres noms. Il ne sert qu'a
distinguer geste / materiel / synonyme a l'ecran, et seuls les 'geste' en
sortent — ils sont deja ici, nommement. Emporter le reste serait emporter
une table dont personne ne lit 95 % des lignes.

LE DICTIONNAIRE EST DEJA TRANSFORME dans model.js : les absorptions, le
renommage et les retraits y sont. Ce fichier ne refait RIEN de tout ca — il
ne porte que du TEXTE.
"""
import io
import os

SOURCES = [
    ('revue/explications-base.js', u'les 57 explications de mouvement'),
    ('revue/explications-gestes.js', u'les explications des 14 premiers gestes'),
    ('revue/gestes-ajoutes.js', u'les 11 gestes trouves par la recherche'),
    ('revue/gestes-valides-mb.js', u'les 5 valides par MB, plus le Svend press'),
    ('revue/tractions-regroupees.js', u'les 6 gestes nes de la fusion des tractions'),
]

morceaux = []
for chemin, quoi in SOURCES:
    assert os.path.exists(chemin), u'source introuvable : ' + chemin
    t = io.open(chemin, encoding='utf-8').read()
    morceaux.append(u'/* ===== %s\n   source : %s ===== */\n%s'
                    % (quoi, chemin, t.rstrip()))
    print(u'  lu  %-34s %6d signes' % (chemin, len(t)))

AGREGATEUR = u"""

/* ================= L'AGREGAT, LA SEULE PORTE =================

   Les blocs ci-dessus sont les fichiers de revue, repris tels quels pour
   qu'un mot relu par MB ne soit jamais retape. Ils posent chacun leur
   propre cle sur `App`. CE BLOC est ce que l'application appelle — rien
   d'autre, pour qu'un changement de forme la-haut ne se propage pas.

   `gestesDe(nomDeFiche)` rend les gestes d'un mouvement, chacun avec son
   `faire`, son `change` et sa `source`.
   `explicationDe(nomDeFiche)` rend celle du mouvement lui-meme.
   `estUnGeste(nomDeFiche, nom)` dit si un nom est un geste de cette fiche. */
(function (A) {
  'use strict';

  var PAR_FICHE = {};

  function poser(fiche, nom, x, aussi) {
    if (!fiche || !nom) return;
    var l = PAR_FICHE[fiche] = PAR_FICHE[fiche] || [];
    if (l.some(function (g) { return g.nom === nom; })) return;
    l.push({ nom: nom, aussi: (aussi || []).slice(),
             faire: x.faire || '', change: x.change || '',
             garde: x.garde || '', source: x.source || '' });
  }

  /* LES TRACTIONS D'ABORD : leurs gestes visent la fiche d'ACCUEIL, qui a
     ete renommee depuis. On vise le nom d'aujourd'hui. */
  var TR = A.tractionsRegroupees || { RENOMMER: {}, ABSORPTIONS: [] };
  TR.ABSORPTIONS.forEach(function (a) {
    poser(TR.RENOMMER[a.vers] || a.vers, a.geste, a, []);
  });

  (A.gestesAjoutes && A.gestesAjoutes.AJOUTS || []).forEach(function (g) {
    poser(TR.RENOMMER[g.fiche] || g.fiche, g.nom, g, g.aussi);
  });
  (A.gestesValidesMB && A.gestesValidesMB.GARDES || []).forEach(function (g) {
    poser(TR.RENOMMER[g.fiche] || g.fiche, g.nom, g, g.aussi);
  });
  var RSS = (A.gestesAjoutes && A.gestesAjoutes.REND_SON_STATUT) || {};
  Object.keys(RSS).forEach(function (id) {
    var p = id.split(' \\u00a7 ');
    poser(TR.RENOMMER[p[0]] || p[0], p[1], RSS[id], []);
  });

  /* LES QUATORZE PREMIERS GESTES : leur fichier ne dit pas de quelle fiche
     ils relevent — c'est le classement qui le disait. On le retrouve en
     cherchant le nom dans les `aussi` du dictionnaire, ce qui est plus sur
     qu'une table a tenir a jour. */
  var E = (A.explicationsGestes && A.explicationsGestes.E) || {};
  Object.keys(E).forEach(function (nom) {
    var f = (A.m && A.m.DICTIONNAIRE || []).filter(function (d) {
      return (d.aussi || []).indexOf(nom) >= 0;
    })[0];
    if (f) poser(f.nom, nom, E[nom], []);
  });

  var BASE = (A.explicationsBase && A.explicationsBase.BASE) || {};

  A.gestes = {
    PAR_FICHE: PAR_FICHE,
    gestesDe: function (fiche) { return (PAR_FICHE[fiche] || []).slice(); },
    explicationDe: function (fiche) { return BASE[fiche] || null; },
    estUnGeste: function (fiche, nom) {
      return (PAR_FICHE[fiche] || []).some(function (g) { return g.nom === nom; });
    }
  };
})(window.App || (window.App = {}));
"""

entete = u"""/* LES GESTES ET LES EXPLICATIONS — assemble le 2026-10-31.

   CE FICHIER EST ASSEMBLE, PAS ECRIT A LA MAIN. Ses blocs sont les fichiers
   de `revue/` repris TELS QUELS : ce sont eux que MB a relus — 83 validees,
   12 corrigees mot pour mot — et une retape serait une occasion de perdre
   un mot.

   Pour le regenerer apres une correction dans revue/ :
     python outils/assembler-gestes.py

   Ce qu'il porte : 57 explications de mouvement, 38 gestes sur 16 fiches.
   Ce qu'il ne porte pas : le dictionnaire lui-meme, qui vit dans model.js
   et y est deja transforme (absorptions, renommage, retraits). */

"""

sortie = entete + u'\n\n'.join(morceaux) + AGREGATEUR
io.open('js/gestes.js', 'w', encoding='utf-8', newline='').write(sortie)
print(u'\njs/gestes.js ecrit : %d signes' % len(sortie))
