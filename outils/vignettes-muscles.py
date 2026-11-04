# -*- coding: utf-8 -*-
u"""GENERE LES VIGNETTES DES PLANCHES DE MUSCLES — chantier 3, 2026-11-04.

POURQUOI ELLES EXISTENT, ET C'EST MESURE. Les planches pleines font
296x400 et ~108 Ko piece. Affichees en 52x52 par le CSS dans l'ecran
« Le dictionnaire du carnet », elles coutaient 1,73 Mo pour une seule
recherche (« curl », 14 mouvements, 15 fichiers distincts) — et jusqu'a
4,1 Mo si l'on ouvre tout le dictionnaire. Le service worker ne les
precharge pas : c'est du reseau reel, sur un telephone.

Une vignette est une vignette, pas une planche pleine retrecie par le
navigateur. Celles-ci font 104 px de cote — deux fois la taille
d'affichage, pour rester nettes sur un ecran a forte densite.

CE QU'ELLES NE REMPLACENT PAS : la planche pleine, qui reste celle
qu'on ouvre d'une touche (`voirPlanche`) et celle du Suivi. Seul l'ecran
du dictionnaire emploie les vignettes.

A REJOUER quand une planche change ou qu'un muscle entre :

    python outils/vignettes-muscles.py
"""
from __future__ import print_function
import io
import os
import glob

from PIL import Image

COTE = 104          # deux fois les 52 px d'affichage
SOURCE = 'icones'
CIBLE = os.path.join('icones', 'vignettes')


def main():
    if not os.path.isdir(CIBLE):
        os.makedirs(CIBLE)

    planches = sorted(glob.glob(os.path.join(SOURCE, 'muscle-*.png')))
    if not planches:
        print(u'Aucune planche trouvee dans %s/ — rien a faire.' % SOURCE)
        return

    avant = 0
    apres = 0
    for p in planches:
        nom = os.path.basename(p)
        dest = os.path.join(CIBLE, nom)
        avant += os.path.getsize(p)

        im = Image.open(p).convert('RGBA')
        # On RECADRE AU CARRE sur le centre, comme le faisait `object-fit:
        # cover` — sinon la vignette ne montrerait pas la meme chose que
        # ce que l'ecran montrait jusqu'ici.
        l, h = im.size
        c = min(l, h)
        g = (l - c) // 2
        ht = (h - c) // 2
        im = im.crop((g, ht, g + c, ht + c)).resize((COTE, COTE), Image.LANCZOS)
        # La palette fait un fichier bien plus petit qu'un RGBA, et ces
        # planches sont des aplats : la perte ne se voit pas a 104 px.
        im = im.convert('P', palette=Image.ADAPTIVE, colors=128)
        im.save(dest, optimize=True)
        apres += os.path.getsize(dest)

    print(u'%d vignettes ecrites dans %s/' % (len(planches), CIBLE))
    print(u'  planches pleines : %s Ko' % '{:,}'.format(avant // 1024).replace(',', ' '))
    print(u'  vignettes        : %s Ko' % '{:,}'.format(apres // 1024).replace(',', ' '))
    if avant:
        print(u'  soit %.1f %% du poids d origine' % (apres * 100.0 / avant))


if __name__ == '__main__':
    main()
