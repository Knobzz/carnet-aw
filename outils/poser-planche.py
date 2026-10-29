#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fait entrer une planche d'origine dans le dépôt, sans détruire son marquage.

    python outils/poser-planche.py <source.png> <nom_latin> <id_du_muscle>

CE QUE CET OUTIL EXISTE POUR EMPÊCHER
    La réduction de palette peut DÉTRUIRE un marquage en silence. C'est écrit
    dans MODELE.md, et c'est arrivé : le marquage du carré pronateur ne couvre
    que 0,9 % de sa planche, et à 32 couleurs il disparaissait ENTIÈREMENT —
    la planche serait entrée au dépôt vide sans que rien ne le signale. Elle
    est à 40 couleurs, la plus petite palette mesurée qui le préserve.

    Jusqu'ici cette réduction se faisait à la main, hors dépôt. Donc elle
    n'était ni rejouable ni vérifiable, et c'est précisément ce que l'archive
    `icones/planches-gray/` reproche à la version 1.21.0 sur le recadrage.

CE QU'IL FAIT
    1. recompose sur BLANC (une planche en RGBA a un fond transparent, qui
       deviendrait noir une fois aplati) ;
    2. mesure le rouge franc de la source, AVANT toute réduction ;
    3. essaie les palettes par taille croissante et garde LA PREMIÈRE qui
       conserve au moins 95 % des pixels marqués ;
    4. refuse d'écrire si aucune n'y arrive — mieux vaut pas de planche
       qu'une planche muette ;
    5. écrit les deux fichiers : l'archive sous son nom LATIN, et la source
       de travail sous l'id du muscle.

LE CRITÈRE DU ROUGE est celui de `recadrer-planches.py`, mot pour mot :
    r > 120, g < 0.20*r, b < 40 — nettement séparé de l'orange de la gravure,
    qui vit à g/r ~ 0.34. Ne pas le redéfinir ici : deux définitions du même
    fait finiraient par diverger.
"""
import os
import sys

from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVE = os.path.join(RACINE, 'icones', 'planches-gray')
TRAVAIL = os.path.join(RACINE, 'icones', 'planches')

PALETTES = [32, 40, 48, 64, 96, 128, 160, 192, 256]
GARDE = 0.95          # part du marquage qui doit survivre


def est_rouge(r, g, b):
    """Le rouge franc du marquage, pas l'orange de la gravure."""
    return r > 120 and g < 0.20 * r and b < 40


def pixels_rouges(im):
    rgb = im.convert('RGB')
    couleurs = rgb.getcolors(1 << 24)
    if couleurs is None:
        raise SystemExit('trop de couleurs pour être comptées')
    return sum(n for n, (r, g, b) in couleurs if est_rouge(r, g, b))


def sur_blanc(im):
    """Une planche RGBA aplatie sans fond devient NOIRE là où elle était
       transparente. On recompose donc sur blanc, comme le reste de
       l'archive."""
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        fond = Image.new('RGB', im.size, (255, 255, 255))
        rgba = im.convert('RGBA')
        fond.paste(rgba, mask=rgba.split()[3])
        return fond
    return im.convert('RGB')


def poser(source, latin, muscle_id):
    brut = Image.open(source)
    plat = sur_blanc(brut)
    avant = pixels_rouges(plat)
    total = plat.width * plat.height
    print(u'%s — %dx%d, %d pixels marqués (%.2f %% de la planche)'
          % (os.path.basename(source), plat.width, plat.height, avant,
             100.0 * avant / total))
    if not avant:
        raise SystemExit(u'ABANDON : la source ne porte AUCUN pixel de rouge '
                         u'franc. Une planche sans marquage ne désigne aucun '
                         u'muscle.')

    retenue = None
    for n in PALETTES:
        reduite = plat.convert('P', palette=Image.ADAPTIVE, colors=n,
                               dither=Image.NONE)
        reste = pixels_rouges(reduite)
        part = 1.0 * reste / avant
        print(u'   %3d couleurs : %6d marqués, %5.1f %% conservés'
              % (n, reste, 100.0 * part))
        if part >= GARDE:
            retenue = (n, reduite, reste)
            break

    if retenue is None:
        raise SystemExit(u'ABANDON : aucune palette jusqu’à %d ne conserve '
                         u'%d %% du marquage. Mieux vaut pas de planche qu’une '
                         u'planche muette.' % (PALETTES[-1], int(GARDE * 100)))

    n, image, reste = retenue
    for dossier, nom in ((ARCHIVE, latin + '.png'),
                         (TRAVAIL, 'muscle-' + muscle_id + '.png')):
        chemin = os.path.join(dossier, nom)
        image.save(chemin, optimize=True)
        print(u'   écrit %s (%d ko)' % (chemin.replace(RACINE + os.sep, ''),
                                        os.path.getsize(chemin) // 1024))
    print(u'   palette retenue : %d couleurs, %.1f %% du marquage conservé\n'
          % (n, 100.0 * reste / avant))


if __name__ == '__main__':
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    poser(sys.argv[1], sys.argv[2], sys.argv[3])
