#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Recadre les planches de Gray sur le muscle marqué, avec un PLANCHER.

    python outils/recadrer-planches.py            pose icones/muscle-*.png
    python outils/recadrer-planches.py --controle joue les contrôles
    python outils/recadrer-planches.py --apercu D  écrit une planche-contact dans D

SOURCE ET SORTIE
    Les planches entières vivent dans `icones/planches/` et ne bougent jamais.
    `icones/muscle-*.png` en est DÉRIVÉ, et se régénère. Sans les sources dans
    le dépôt, le recadrage n'est ni rejouable ni vérifiable — c'est ce qui
    manquait à la version 1.21.0, et c'est pour ça que son résultat était
    inégal sans que personne puisse le constater.

LES TROIS NOMBRES QUI GOUVERNENT LES PLANCHERS
    Lus dans css/app.css, pas supposés :
      296 px — largeur du corps du panneau sur un écran de 320 px
               (`.panneau-corps` padding 12px). L'image y est en `width:100%`,
               donc une image plus étroite est AGRANDIE, donc floue.
      400 px — `.planche-bouton .planche-fond { max-height:400px; width:auto }`.
               La vignette s'affiche à sa taille naturelle, plafonnée à 400 px
               de haut, dans une carte de 290 px. Une image plus courte que
               400 px n'occupe pas la carte : c'est un timbre.
      290 px — `.planche-carte { max-width:290px }`, la largeur de la carte.

    Une fenêtre fait donc au moins 296x400, quitte à montrer beaucoup de membre
    autour d'un petit muscle — ce qui est exactement ce qu'on veut : un muscle
    minuscule a besoin de repères pour être situable.

    Ça ne suffit pas, et c'est le piège : la vignette PLAFONNE à 400 px de
    haut. Une fenêtre plus haute est donc réduite pour tenir, et redevient
    étroite dans la carte — le brachio-radial, long, ne remplissait que 62 %
    des 290 px malgré ses 296 px de large. D'où un troisième plancher, de
    PROPORTION : largeur / hauteur >= 290/400. Il fait passer 7 vignettes
    au-dessus de la carte, le brachio-radial de 62 % à 86 %, et ne coûte que
    de montrer la planche sur toute sa largeur. Un plancher qui ne regarde
    que les pixels, sans la proportion, se croit tenu et ne l'est pas.

LE MARQUAGE, ET POURQUOI ON NE LE DEVINE PAS
    Les planches sont des PNG à PALETTE de 32 couleurs. On lit la palette et on
    y cherche l'amas rouge franc : `r > 120`, `g < 0.20*r`, `b < 40`. L'orange
    de la gravure vit à g/r ≈ 0.34 et au-delà — l'écart est net et mesuré.

    La version 1.21.0 affirmait « le marquage est exactement (255, 0, 0) ».
    C'est faux en entrée : 15 des 22 sources n'ont AUCUN pixel à (255,0,0). Ce
    rouge pur n'existe que dans la SORTIE, fabriqué par la re-quantification
    qui suivait le découpage. Le critère était vérifié là où il ne pouvait pas
    tomber. On recadre donc l'image à palette TELLE QUELLE, sans re-quantifier.

LES MIETTES, ET POURQUOI ON NE GARDE PAS « LA PLUS GRANDE ZONE »
    Quelques pixels rouges égarés dans le thorax étiraient la boîte du
    brachial sur 278 px de large pour une planche de 420. Il faut donc jeter
    les miettes — mais PAS en gardant la seule plus grande zone :

      - trois planches sont teintées en HACHURES et non en aplat. Leur
        marquage éclate en centaines de points : 310 zones pour le brachial,
        273 pour le grand dorsal, 2 625 pour les extenseurs du pouce. La plus
        grande n'y pèse que 28 % du marquage.
      - et certains muscles apparaissent RÉELLEMENT en deux endroits sur la
        planche : les fléchisseurs des doigts se partagent 54 / 45.

    On referme donc les hachures (dilatation de rayon 4, mesurée : elle tient
    le pire cas à 91 % du marquage, contre 62 % à rayon 1), puis on garde
    TOUTES les zones qui pèsent au moins 10 % de la plus grosse. Les deux
    moitiés d'un muscle survivent, les miettes partent.

TROIS PLANCHES NE PORTENT AUCUN MARQUAGE
    carre_pronateur, coraco_brachial, grand_pectoral : la gravure entière est
    orange, rien n'y est désigné. On les garde ENTIÈRES et on le dit. Recadrer
    au jugé y produirait une fenêtre sur un muscle qui n'est pas le bon.
"""

import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = os.path.join(RACINE, 'icones', 'planches')
SORTIE = os.path.join(RACINE, 'icones')

PLANCHER_L, PLANCHER_H = 296, 400
CARTE_L = 290         # largeur de la carte, pour le plancher de PROPORTION
MARGE = 0.12          # le muscle ne doit pas toucher le bord de la fenêtre
FERMETURE = 4         # rayon qui referme les hachures (mesuré, voir en-tête)
PART_ZONE = 0.10      # une zone compte si elle pèse ça de la plus grosse
PART_MINIMALE = 0.85  # au total, on doit garder au moins ça du marquage
LARGEUR_BRACHIAL = 0.55   # part de planche que sa boîte ne doit pas dépasser

SANS_MARQUAGE = ('carre_pronateur', 'coraco_brachial', 'grand_pectoral')


def entrees_de_marquage(im, seuil=0.20):
    """Les index de palette qui sont du rouge franc, pas de l'orange."""
    pal = im.getpalette() or []
    gardes = []
    for i in range(len(pal) // 3):
        r, g, b = pal[3 * i:3 * i + 3]
        if r > 120 and g < seuil * r and b < 40:
            gardes.append(i)
    return gardes


def fermer(masque, rayon):
    """Referme les coupures que les hachures de la gravure ouvrent."""
    if rayon <= 0:
        return masque
    out = masque.copy()
    for dy in range(-rayon, rayon + 1):
        for dx in range(-rayon, rayon + 1):
            out |= np.roll(np.roll(masque, dy, 0), dx, 1)
    return out


def zones(masque):
    """Toutes les zones connexes (8-connexité), de la plus grosse à la plus petite."""
    H, L = masque.shape
    vu = np.zeros_like(masque, dtype=bool)
    trouvees = []
    for sy, sx in zip(*np.nonzero(masque)):
        if vu[sy, sx]:
            continue
        pile = deque([(sy, sx)])
        vu[sy, sx] = True
        zone = []
        while pile:
            y, x = pile.popleft()
            zone.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < H and 0 <= nx < L and masque[ny, nx] and not vu[ny, nx]:
                        vu[ny, nx] = True
                        pile.append((ny, nx))
        trouvees.append(zone)
    return sorted(trouvees, key=len, reverse=True)


def sans_les_miettes(masque, fermeture=FERMETURE):
    """Le marquage débarrassé de ses miettes, et la part qu'on en garde."""
    total = int(masque.sum())
    if total == 0:
        return masque, 0.0
    trouvees = zones(fermer(masque, fermeture))
    if not trouvees:
        return masque, 0.0
    plancher = PART_ZONE * len(trouvees[0])
    garde = np.zeros_like(masque)
    for zone in trouvees:
        if len(zone) < plancher:
            break
        for y, x in zone:
            garde[y, x] = True
    garde &= masque
    return garde, int(garde.sum()) / total


def etire(a0, a1, minimum, borne):
    """Élargit [a0,a1] jusqu'à `minimum`, symétriquement, sans sortir de la planche."""
    manque = minimum - (a1 - a0 + 1)
    if manque > 0:
        a0 -= manque // 2
        a1 += manque - manque // 2
    if a0 < 0:
        a1 -= a0
        a0 = 0
    if a1 > borne - 1:
        a0 -= a1 - (borne - 1)
        a1 = borne - 1
    return max(0, a0), min(borne - 1, a1)


def fenetre(im, seuil=0.20, plancher=True, sans_miettes=True, fermeture=FERMETURE,
            proportion=True):
    """La fenêtre de recadrage, ou None si la planche ne porte aucun marquage.

    Rend aussi ce qui a servi à la décider, pour que les contrôles puissent
    mesurer l'EFFET et pas seulement le résultat.
    """
    L, H = im.size
    index = entrees_de_marquage(im, seuil)
    masque = np.isin(np.asarray(im), index) if index else np.zeros((H, L), bool)
    if not masque.any():
        return None, {'px': 0, 'part': 0.0}

    if sans_miettes:
        garde, part = sans_les_miettes(masque, fermeture)
    else:
        garde, part = masque, 1.0
    ys, xs = np.nonzero(garde)

    x0, x1 = np.percentile(xs, [2, 98]).astype(int)
    y0, y1 = np.percentile(ys, [2, 98]).astype(int)
    detail = {'px': int(masque.sum()), 'part': part,
              'muscle': (int(x0), int(y0), int(x1), int(y1))}

    mx = int((x1 - x0 + 1) * MARGE)
    my = int((y1 - y0 + 1) * MARGE)
    fx0, fy0, fx1, fy1 = x0 - mx, y0 - my, x1 + mx, y1 + my
    if plancher:
        fx0, fx1 = etire(fx0, fx1, PLANCHER_L, L)
        fy0, fy1 = etire(fy0, fy1, PLANCHER_H, H)
    else:
        fx0, fx1 = etire(fx0, fx1, 1, L)
        fy0, fy1 = etire(fy0, fy1, 1, H)
    if proportion:
        # La vignette plafonne à 400 px de haut : une fenêtre plus haute est
        # réduite, et redevient étroite dans la carte. On l'élargit donc —
        # jamais on ne la raccourcit, on ne recadre pas davantage.
        voulue = int(round((fy1 - fy0 + 1) * CARTE_L / float(PLANCHER_H)))
        fx0, fx1 = etire(fx0, fx1, min(L, max(fx1 - fx0 + 1, voulue)), L)
    return (int(fx0), int(fy0), int(fx1), int(fy1)), detail


def noms():
    return sorted(n for n in os.listdir(SOURCES)
                  if n.startswith('muscle-') and n.endswith('.png'))


def court(nom):
    return nom.replace('muscle-', '').replace('.png', '')


def poser(bavard=True):
    """Écrit icones/muscle-*.png depuis icones/planches/."""
    faits = []
    for n in noms():
        im = Image.open(os.path.join(SOURCES, n))
        f, d = fenetre(im)
        # On recadre l'image À PALETTE telle quelle : aucune couleur n'est
        # inventée, et le (255,0,0) fabriqué par la re-quantification de
        # 1.21.0 ne peut pas réapparaître.
        sortie = im if f is None else im.crop((f[0], f[1], f[2] + 1, f[3] + 1))
        chemin = os.path.join(SORTIE, n)
        sortie.save(chemin, optimize=True)
        faits.append((court(n), im.size, sortie.size, f is None, d))
        if bavard:
            etat = 'planche entière (aucun marquage)' if f is None else 'recadrée'
            print('%-24s %4dx%-5d -> %4dx%-5d  %s'
                  % (court(n), im.size[0], im.size[1],
                     sortie.size[0], sortie.size[1], etat))
    return faits


# ----------------------------------------------------------------------
# Les contrôles. Chacun a été VU TOMBER : `--controle casse` rejoue chaque
# défaut d'origine et doit faire rougir le contrôle correspondant.
# ----------------------------------------------------------------------

def controles(casser=None):
    echecs = []
    joues = []

    def verifier(nom, ok, dit):
        print(('  OK   ' if ok else '  ROUGE') + ' ' + nom + (' — ' + dit if dit else ''))
        joues.append(nom)
        if not ok:
            echecs.append(nom)

    seuil = 0.45 if casser == 'seuil' else 0.20
    plancher = casser != 'plancher'
    miettes = casser != 'miettes'
    fermeture = 0 if casser == 'fermeture' else FERMETURE
    proportion = casser != 'proportion'

    mesures = {}
    for n in noms():
        im = Image.open(os.path.join(SOURCES, n))
        mesures[court(n)] = (im.size, ) + fenetre(im, seuil, plancher, miettes,
                                                  fermeture, proportion)

    # 1. L'orange de la gravure n'est JAMAIS pris pour du marquage.
    #    Tombe si on relâche le seuil jusqu'à l'orange (g/r ≈ 0.34).
    fautifs = []
    for n in noms():
        im = Image.open(os.path.join(SOURCES, n))
        pal = im.getpalette()
        for i in entrees_de_marquage(im, seuil):
            r, g, b = pal[3 * i:3 * i + 3]
            if r and g / r >= 0.30:
                fautifs.append('%s:(%d,%d,%d)' % (court(n), r, g, b))
    verifier('orange jamais pris pour du marquage', not fautifs,
             'retenu à tort : ' + ', '.join(fautifs[:4]) if fautifs else
             'aucune entrée de palette au-dessus de g/r=0.30')

    # 2. Les trois planches sans marquage sont REFUSÉES, pas recadrées au juge.
    #    Tombe si le seuil attrape l'orange, qui existe partout.
    mauvais = [m for m in SANS_MARQUAGE if mesures[m][1] is not None]
    verifier('les planches sans marquage restent entières', not mauvais,
             'recadrées à tort : ' + ', '.join(mauvais) if mauvais else
             ', '.join(SANS_MARQUAGE))

    # 2 bis. [temoin] Les 19 autres, elles, portent bien un marquage. Il tient
    #        des deux côtés : c'est le décor, pas un effet du lot. Sans lui, le
    #        contrôle 2 serait vert si le détecteur ne trouvait JAMAIS rien.
    trouves = [c for c in mesures if c not in SANS_MARQUAGE and mesures[c][1] is not None]
    verifier('[temoin] les 19 autres portent un marquage', len(trouves) == 19,
             '%d/19 détectées' % len(trouves))

    # 3. Le plancher : aucune fenêtre sous 296x400, sauf si la planche
    #    elle-même est plus petite sur cet axe. Tombe si on retire le plancher.
    petites = []
    for c, ((L, H), f, d) in mesures.items():
        if f is None:
            continue
        l, h = f[2] - f[0] + 1, f[3] - f[1] + 1
        if (l < PLANCHER_L and l < L) or (h < PLANCHER_H and h < H):
            petites.append('%s %dx%d' % (c, l, h))
    verifier('plancher 296x400 tenu', not petites,
             'sous le plancher : ' + ', '.join(petites[:5]) if petites else
             '19 fenêtres au-dessus, ou bornées par la planche')

    # 3 bis. Le plancher de PROPORTION. On mesure l'EFFET — la largeur que la
    #        vignette occupera réellement dans la carte, après le plafond de
    #        400 px de haut — et non la taille du fichier, qui ment : une
    #        fenêtre de 296x654 fait bien 296 px de large et n'en affiche que
    #        181. Tombe si on retire le plancher de proportion.
    etroites = []
    for c, ((L, H), f, d) in mesures.items():
        if f is None:
            continue
        l, h = f[2] - f[0] + 1, f[3] - f[1] + 1
        affichee = round(l * min(1.0, PLANCHER_H / float(h)))
        if affichee < CARTE_L and l < L:   # sauf si la planche est déjà épuisée
            etroites.append('%s %d px sur %d' % (c, affichee, CARTE_L))
    verifier('la vignette remplit la carte de 290 px', not etroites,
             'trop étroites : ' + ', '.join(etroites[:5]) if etroites else
             'chaque fenêtre remplit la carte, ou prend toute la planche')

    # 4. On garde le MUSCLE en jetant les miettes. Tombe sans la fermeture des
    #    hachures : les extenseurs du pouce éclatent en 2 625 points et il n'en
    #    resterait que 60 %.
    perdus = ['%s %.0f%%' % (c, d['part'] * 100) for c, (t, f, d) in mesures.items()
              if f is not None and d.get('part', 1.0) < PART_MINIMALE]
    verifier('on garde le muscle, pas des miettes', not perdus,
             'trop perdu : ' + ', '.join(perdus) if perdus else
             'au pire %.0f%% du marquage gardé, seuil %.0f%%'
             % (min(d['part'] for t, f, d in mesures.values() if f) * 100,
                PART_MINIMALE * 100))

    # 5. Le brachial, défaut mesuré : sa boîte faisait 278 px de large sur une
    #    planche de 420 (66%) à cause des miettes du thorax. Tombe avec le 4.
    t, f, d = mesures['brachial']
    large = (d['muscle'][2] - d['muscle'][0] + 1) if f is not None else 0
    verifier('brachial : la boîte ne mange pas le thorax',
             0 < large <= LARGEUR_BRACHIAL * t[0],
             'boîte de %d px de large sur %d (%.0f%%)' % (large, t[0], large / t[0] * 100))

    print()
    if echecs:
        print('%d contrôle(s) ROUGE(S) sur %d : %s'
              % (len(echecs), len(joues), ', '.join(echecs)))
    else:
        print('Les %d contrôles sont verts.' % len(joues))
    return echecs


def apercu(dossier):
    """Planche-contact : marquage en vert, boîte en bleu, fenêtre en rose."""
    os.makedirs(dossier, exist_ok=True)
    bouts = []
    for n in noms():
        im = Image.open(os.path.join(SOURCES, n))
        f, d = fenetre(im)
        vue = im.convert('RGB')
        c = court(n)
        if f is None:
            texte = '<b style="color:#c00">AUCUN MARQUAGE</b> — planche gardée entière'
        else:
            index = entrees_de_marquage(im)
            m = np.isin(np.asarray(im), index)
            dr = ImageDraw.Draw(vue)
            dr.bitmap((0, 0), Image.fromarray((m * 255).astype(np.uint8)).convert('1'),
                      fill=(0, 200, 0))
            dr.rectangle(list(d['muscle']), outline=(0, 80, 255), width=3)
            dr.rectangle(list(f), outline=(255, 0, 200), width=3)
            texte = ('muscle <b>%dx%d</b> &rarr; fenêtre <b>%dx%d</b>'
                     % (d['muscle'][2] - d['muscle'][0] + 1,
                        d['muscle'][3] - d['muscle'][1] + 1,
                        f[2] - f[0] + 1, f[3] - f[1] + 1))
        vue.save(os.path.join(dossier, c + '.png'))
        bouts.append('<figure><figcaption><b>%s</b><br>%s</figcaption>'
                     '<img src="%s.png" alt=""></figure>' % (c, texte, c))
    with open(os.path.join(dossier, 'index.html'), 'w', encoding='utf-8') as f:
        f.write('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
                '<title>Recadrage des planches</title><style>'
                'body{margin:0;padding:14px;background:#fff;color:#111;'
                'font:13px/1.4 system-ui,sans-serif}.g{display:flex;flex-wrap:wrap;gap:16px}'
                'figure{margin:0;width:260px}img{width:100%;border:1px solid #bbb}'
                'figcaption{font-size:11.5px;min-height:3.4em}'
                '.l span{display:inline-block;margin-right:12px;padding:2px 8px;'
                'color:#fff;font-weight:600}</style></head><body>'
                '<h1>Où tombe la fenêtre</h1><p class="l">'
                '<span style="background:#00c800">marquage</span>'
                '<span style="background:#0050ff">boîte du muscle</span>'
                '<span style="background:#ff00c8">fenêtre finale</span></p>'
                '<div class="g">' + '\n'.join(bouts) + '</div></body></html>')
    print('écrit : ' + os.path.join(dossier, 'index.html'))


if __name__ == '__main__':
    if '--controle' in sys.argv:
        i = sys.argv.index('--controle')
        casser = sys.argv[i + 1] if len(sys.argv) > i + 1 else None
        if casser:
            print('--- on REINTRODUIT le défaut « %s » ---' % casser)
        sys.exit(1 if controles(casser) and not casser else 0)
    elif '--apercu' in sys.argv:
        apercu(sys.argv[sys.argv.index('--apercu') + 1])
    else:
        poser()
