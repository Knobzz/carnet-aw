# -*- coding: utf-8 -*-
"""Génère les PNG de l'app à partir du même dessin que icones/icone.svg.

Un coude posé, l'avant-bras dressé, la main engagée, sur la ligne bleue de la
table. Rendu par suréchantillonnage ×4 puis réduction : c'est l'anti-aliasing.

    python outils/faire-icones.py
"""
import os
import sys

from PIL import Image, ImageDraw

ARDOISE = (0x1B, 0x24, 0x30, 255)
BLEU    = (0x2B, 0x5D, 0x8A, 255)
LAITON  = (0xD9, 0xA4, 0x45, 255)

SS = 4            # facteur de suréchantillonnage
BASE = 512.0      # repère du SVG


def courbe_coude(b, c, n=24):
    """Le quart de cercle entre l'avant-bras et la main, en segments."""
    (bx, by), (cx, cy) = b, c
    p1 = (bx, by - (by - cy) * 0.55)
    p2 = (cx - (cx - bx) * 0.55, cy)
    pts = []
    for i in range(n + 1):
        t = i / float(n)
        u = 1 - t
        x = u**3 * bx + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * cx
        y = u**3 * by + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * cy
        pts.append((x, y))
    return pts


def dessiner(taille, chemin, marge=0.0, coins=True):
    T = int(taille * SS)
    img = Image.new('RGBA', (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # fond : arrondi pour l'icône normale, plein bord pour la maskable
    if coins:
        d.rounded_rectangle([0, 0, T - 1, T - 1], radius=int(104 / BASE * T), fill=ARDOISE)
    else:
        d.rectangle([0, 0, T - 1, T - 1], fill=ARDOISE)

    e = T * marge
    k = (T - 2 * e) / BASE

    def P(x, y):
        return (e + x * k, e + y * k)

    # la table
    x0, y0 = P(78, 386)
    x1, y1 = P(78 + 356, 386 + 18)
    d.rounded_rectangle([x0, y0, x1, y1], radius=9 * k, fill=BLEU)

    # le bras : une polyligne épaisse à bouts ronds
    ep = 54 * k
    r = ep / 2.0
    pts = [P(150, 386), P(150, 236)]
    pts += courbe_coude(P(150, 236), P(212, 170))
    pts += [P(330, 148)]
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=LAITON, width=int(round(ep)))
    for p in pts:                                     # les jointures et les bouts
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=LAITON)

    img = img.resize((int(taille), int(taille)), Image.LANCZOS)
    img.save(chemin, 'PNG', optimize=True)
    return chemin


if __name__ == '__main__':
    racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dossier = os.path.join(racine, 'icones')
    if not os.path.isdir(dossier):
        os.makedirs(dossier)
    faits = [
        dessiner(192, os.path.join(dossier, 'icone-192.png')),
        dessiner(512, os.path.join(dossier, 'icone-512.png')),
        # maskable : le motif tient dans le cercle de sûreté (80 % du cadre)
        dessiner(512, os.path.join(dossier, 'icone-maskable-512.png'), marge=0.14, coins=False),
    ]
    for f in faits:
        sys.stdout.write('%s  %d o\n' % (os.path.basename(f), os.path.getsize(f)))
