#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Recadre les DEUX planches que la carte coupe. Les vingt autres restent entières.

    python outils/recadrer-planches.py            pose icones/muscle-*.png
    python outils/recadrer-planches.py --controle joue les contrôles
    python outils/recadrer-planches.py --apercu D  écrit une planche-contact dans D

SOURCE ET SORTIE
    Les planches entières vivent dans `icones/planches/` et ne bougent jamais.
    `icones/muscle-*.png` en est DÉRIVÉ. Sans les sources dans le dépôt, un
    recadrage n'est ni rejouable ni rattrapable — c'est ce qui manquait à la
    version 1.21.0, et c'est pourquoi son résultat est resté inégal sans que
    personne puisse le constater.

POURQUOI DEUX, ET PAS VINGT-DEUX
    La 1.21.0 a recadré les vingt-deux, et une première correction en a
    recadré dix-neuf. Les deux fois, la règle a été appliquée à tout le lot
    sans qu'on ait mesuré qui en avait besoin. La mesure, faite après coup :

        la carte de Suivi fait 290 px (`.planche-carte`) et coupe à DROITE
        (`overflow: hidden`) ; la vignette s'affiche à sa taille naturelle
        plafonnée à 400 px de haut. Sur la planche ENTIÈRE, le muscle marqué
        est donc visible à 100 % pour VINGT muscles sur vingt-deux.

        Les exceptions, et elles seules :
            brachial              413 px pour 290 —  5 % du muscle visible
            biceps                413 px pour 290 — 40 %
            opposant_auriculaire  385 px pour 290 — 35 %
            grand_rond            421 px pour 290 — 47 %

    La troisième n'a pas été vue à l'œil : elle est arrivée avec les treize
    muscles de la main, et c'est le CONTRÔLE qui l'a trouvée en refaisant la
    mesure. C'est tout l'intérêt d'un contrôle qui mesure au lieu de lire une
    liste — une planche neuve entre dans le lot et il le dit.

    Ce sont les deux seules planches où la carte coupe le muscle lui-même.
    Quatre autres débordent aussi (grand pectoral, coraco-brachial, triceps,
    deltoïde) mais ce qui sort du cadre y est du décor : le muscle reste
    entier.

    La liste est donc courte, explicite, et VÉRIFIÉE : un contrôle refait la
    mesure et exige qu'elle corresponde, dans les deux sens — rien hors liste
    qui soit coupé, rien dans la liste qui ne le soit pas. Ajouter un nom au
    jugé fait rougir le banc.

LES TROIS PLANCHERS, POUR LES DEUX RECADRÉES
    Lus dans css/app.css, pas supposés :
      296 px — largeur du corps du panneau sur un écran de 320 px. L'image y
               est en `width:100%` : plus étroite, elle est AGRANDIE, donc floue.
      400 px — plafond de hauteur de la vignette. Plus courte, elle n'occupe
               pas la carte : c'est un timbre.
    Un troisième plancher, de PROPORTION (largeur/hauteur >= 290/400), a été
    écrit puis RETIRÉ : mesuré sur ces deux planches, il rendait exactement la
    même fenêtre, au pixel près. Une règle qu'aucun contrôle ne peut faire
    rougir est une règle qu'on ne garde pas.

LE MARQUAGE, ET POURQUOI ON NE LE DEVINE PAS
    Les planches sont des PNG à PALETTE de 32 couleurs. On y cherche l'amas
    rouge franc : `r > 120`, `g < 0.20*r`, `b < 40`. L'orange de la gravure
    vit à g/r ≈ 0.34 et au-delà — l'écart est net et mesuré.

    La 1.21.0 affirmait « le marquage est exactement (255, 0, 0) ». C'est faux
    en entrée : 15 des 22 sources n'ont AUCUN pixel de cette couleur. Ce rouge
    pur n'existe que dans la SORTIE, fabriqué par la re-quantification qui
    suivait le découpage. Le critère était vérifié là où il ne pouvait pas
    tomber. On recadre donc l'image à palette TELLE QUELLE.

LES MIETTES
    Quelques pixels rouges égarés dans le thorax étiraient la boîte du
    brachial sur 278 px pour une planche de 420. Mais garder « la plus grande
    zone » ne marche pas non plus : le marquage du brachial est en HACHURES et
    éclate en 310 points. On referme donc les hachures (rayon 4, mesuré) avant
    de garder les zones qui pèsent au moins 10 % de la plus grosse.

UNE PLANCHE SUIT UNE AUTRE CONVENTION
    grand_pectoral vient d'une autre série, et elle marque son muscle À
    L'ENVERS des autres : le pectoral est TEINTÉ pendant que le deltoïde
    derrière lui reste en GRIS. Mesuré sur la planche : 38,8 % de pixels
    teintés contre 28,1 % de gris.

    Le détecteur ne la lit pas, et c'est une limite DU DÉTECTEUR, pas de la
    planche. Sa teinte vit entre g/r = 0.22 et 0.38, et son rouge le plus
    franc est à (96, 17, 0) — rejeté par le seuil `r > 120`. Relâcher ce
    seuil pour elle ferait passer l'orange des trente-quatre autres pour du
    marquage : le contrôle `--controle seuil` le montre en une seconde.

    Ce n'est pas grave, et c'est pour ça qu'on s'arrête là : son muscle
    occupe presque toute l'image, donc elle n'a RIEN à recadrer. Elle est
    nommée ici pour que les contrôles l'attendent, pas comme un défaut.

L'ARCHIVE AUSSI SE MESURE
    `icones/planches-gray/` porte les sources d'origine, réduites à une
    palette pour tenir dans le dépôt. Cette réduction peut DÉTRUIRE un
    marquage : celui du carré pronateur ne couvre que 0,9 % de sa planche, et
    32 couleurs le faisaient disparaître entièrement — converti sans que
    personne le mesure, il serait entré au dépôt vide. Il est à 40 couleurs,
    la plus petite palette qui le préserve (99 % du marquage, 6 ko de plus).

    Un contrôle relit donc toute l'archive et exige que chaque planche porte
    encore son marquage. C'est exactement le genre de perte qu'une conversion
    silencieuse produit, et qu'on ne voit qu'au téléphone.
"""

import os
import shutil
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = os.path.join(RACINE, 'icones', 'planches')
SORTIE = os.path.join(RACINE, 'icones')

# Les deux seules planches où la carte coupe le MUSCLE. Décidé en les
# regardant, puis vérifié par le contrôle « la liste correspond à la mesure ».
# `petit_rond` est entre le 2026-10-29, et ce n'est pas moi qui l'ai vu : le
# controle « la liste correspond a la mesure » l'a signale des sa premiere
# passe — « petit_rond coupe a 64% et hors liste ». Meme planche que le grand
# rond (530x504, Gray 410), donc meme coupe. C'est le deuxieme muscle que ce
# controle trouve tout seul, apres l'opposant de l'auriculaire.
A_RECADRER = ('biceps', 'brachial', 'opposant_auriculaire', 'grand_rond',
              'petit_rond')

CARTE_L = 290            # .planche-carte max-width, et elle coupe à droite
VIGNETTE_H = 400         # .planche-bouton .planche-fond max-height
PANNEAU_L = 296          # largeur de l'image ouverte en grand, écran de 320
MARGE = 0.12             # le muscle ne touche pas le bord de la fenêtre
FERMETURE = 4            # rayon qui referme les hachures (mesuré)
PART_ZONE = 0.10         # une zone compte si elle pèse ça de la plus grosse
VISIBLE_MINI = 0.97      # en dessous, la carte coupe le muscle : à recadrer
LARGEUR_BRACHIAL = 0.55  # part de planche que sa boîte ne doit pas dépasser

HORS_DETECTEUR = ('grand_pectoral',)
ARCHIVE = os.path.join(RACINE, 'icones', 'planches-gray')


def entrees_de_marquage(im, seuil=0.20):
    """Les index de palette qui sont du rouge franc, pas de l'orange."""
    pal = im.getpalette() or []
    return [i for i in range(len(pal) // 3)
            if (lambda r, g, b: r > 120 and g < seuil * r and b < 40)(*pal[3 * i:3 * i + 3])]


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


def marquage(im, seuil=0.20, fermeture=FERMETURE, sans_miettes=True):
    """Le masque du muscle, débarrassé de ses miettes. Vide si rien n'est marqué."""
    index = entrees_de_marquage(im, seuil)
    brut = np.isin(np.asarray(im), index) if index else np.zeros(im.size[::-1], bool)
    if not brut.any() or not sans_miettes:
        return brut
    trouvees = zones(fermer(brut, fermeture))
    if not trouvees:
        return brut
    plancher = PART_ZONE * len(trouvees[0])
    garde = np.zeros_like(brut)
    for zone in trouvees:
        if len(zone) < plancher:
            break
        for y, x in zone:
            garde[y, x] = True
    return garde & brut


def part_visible(im, **kw):
    """La part du muscle que la carte de 290 px laisse voir, planche entière.

    C'est LA mesure qui justifie la liste. La vignette s'affiche à sa taille
    naturelle plafonnée à 400 px de haut, et la carte coupe à droite : un
    muscle au-delà de 290 px affichés est invisible, quelle que soit sa taille.
    Mesuré dans le navigateur avant d'être écrit ici.
    """
    L, H = im.size
    m = marquage(im, **kw)
    if not m.any():
        return None                      # rien de marqué : rien à couper
    ech = min(1.0, float(VIGNETTE_H) / H)
    xs = np.nonzero(m)[1] * ech
    return float((xs < CARTE_L).sum()) / m.sum()


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


def fenetre(im, plancher=True, **kw):
    """La fenêtre de recadrage, ou None si la planche ne porte aucun marquage."""
    L, H = im.size
    m = marquage(im, **kw)
    if not m.any():
        return None, {}
    ys, xs = np.nonzero(m)
    x0, x1 = np.percentile(xs, [2, 98]).astype(int)
    y0, y1 = np.percentile(ys, [2, 98]).astype(int)
    detail = {'muscle': (int(x0), int(y0), int(x1), int(y1))}

    mx, my = int((x1 - x0 + 1) * MARGE), int((y1 - y0 + 1) * MARGE)
    fx0, fy0, fx1, fy1 = x0 - mx, y0 - my, x1 + mx, y1 + my
    if plancher:
        fx0, fx1 = etire(fx0, fx1, PANNEAU_L, L)
        fy0, fy1 = etire(fy0, fy1, VIGNETTE_H, H)
    else:
        fx0, fx1 = etire(fx0, fx1, 1, L)
        fy0, fy1 = etire(fy0, fy1, 1, H)
    return (int(fx0), int(fy0), int(fx1), int(fy1)), detail


def noms():
    return sorted(n for n in os.listdir(SOURCES)
                  if n.startswith('muscle-') and n.endswith('.png'))


def court(nom):
    return nom.replace('muscle-', '').replace('.png', '')


def poser(bavard=True, liste=A_RECADRER):
    """Écrit icones/muscle-*.png depuis icones/planches/."""
    for n in noms():
        c = court(n)
        src = os.path.join(SOURCES, n)
        dst = os.path.join(SORTIE, n)
        if c not in liste:
            # Copie OCTET POUR OCTET. Repasser par PIL ré-encoderait et
            # re-quantifierait la palette — c'est exactement ce que la 1.21.0
            # a fait sans le dire, et ça fabriquait des couleurs.
            shutil.copyfile(src, dst)
            if bavard:
                im = Image.open(src)
                print('%-24s %4dx%-5d  planche entière'
                      % (c, im.size[0], im.size[1]))
            continue
        im = Image.open(src)
        f, _ = fenetre(im)
        sortie = im if f is None else im.crop((f[0], f[1], f[2] + 1, f[3] + 1))
        sortie.save(dst, optimize=True)
        if bavard:
            print('%-24s %4dx%-5d -> %4dx%-5d  RECADRÉE'
                  % (c, im.size[0], im.size[1], sortie.size[0], sortie.size[1]))


# ----------------------------------------------------------------------
# Les contrôles. Chacun a été VU TOMBER : `--controle <defaut>` rejoue le
# défaut d'origine et doit faire rougir le contrôle correspondant.
# ----------------------------------------------------------------------

def controles(casser=None):
    echecs, joues = [], []

    def verifier(nom, ok, dit):
        print(('  OK   ' if ok else '  ROUGE') + ' ' + nom + (' — ' + dit if dit else ''))
        joues.append(nom)
        if not ok:
            echecs.append(nom)

    seuil = 0.45 if casser == 'seuil' else 0.20
    miettes = casser != 'miettes'
    plancher = casser != 'plancher'
    liste = tuple(A_RECADRER) + ('supinateur',) if casser == 'liste' else A_RECADRER
    kw = {'seuil': seuil, 'sans_miettes': miettes}

    sources = {court(n): Image.open(os.path.join(SOURCES, n)) for n in noms()}
    visibles = {c: part_visible(im, **kw) for c, im in sources.items()}
    fenetres = {c: fenetre(im, plancher, **kw)
                for c, im in sources.items() if c in liste}

    # 1. Les planches hors liste sont rendues TELLES QUELLES, octet pour octet.
    #    Tombe dès qu'une autre est recadrée — c'est le défaut qui a coûté
    #    deux tours : appliquer la règle à tout le lot.
    poser(bavard=False, liste=liste)
    alterees = []
    for n in noms():
        if court(n) in liste:
            continue
        a = open(os.path.join(SOURCES, n), 'rb').read()
        b = open(os.path.join(SORTIE, n), 'rb').read()
        if a != b:
            alterees.append(court(n))
    poser(bavard=False)      # on remet l'état normal quoi qu'il arrive
    verifier('les planches hors liste sortent intactes', not alterees,
             'modifiées à tort : ' + ', '.join(alterees) if alterees else
             '%d planches identiques à leur source, octet pour octet'
             % (len(noms()) - len(liste)))

    # 2. La liste correspond à LA MESURE, dans les deux sens. C'est ce qui
    #    empêche d'y ajouter un nom au jugé — ou d'en oublier un qui en a
    #    besoin. Tombe si on y ajoute le supinateur, visible à 100 %.
    fautifs = []
    for c, v in visibles.items():
        if v is None:
            if c in liste:
                fautifs.append(c + ' (aucun marquage)')
            continue
        coupe = v < VISIBLE_MINI
        if coupe and c not in liste:
            fautifs.append('%s coupé à %.0f%% et hors liste' % (c, v * 100))
        if not coupe and c in liste:
            fautifs.append('%s visible à %.0f%% et dans la liste' % (c, v * 100))
    verifier('la liste correspond à la mesure', not fautifs,
             '; '.join(fautifs[:3]) if fautifs else
             'coupés : ' + ', '.join('%s %.0f%%' % (c, visibles[c] * 100)
                                     for c in liste if visibles.get(c) is not None))

    # 3. Le plancher 296x400 sur les recadrées. Tombe si on le retire.
    petites = []
    for c, (f, _) in fenetres.items():
        if f is None:
            continue
        L, H = sources[c].size
        l, h = f[2] - f[0] + 1, f[3] - f[1] + 1
        if (l < PANNEAU_L and l < L) or (h < VIGNETTE_H and h < H):
            petites.append('%s %dx%d' % (c, l, h))
    verifier('plancher 296x400 tenu', not petites,
             'sous le plancher : ' + ', '.join(petites) if petites else
             ', '.join('%s %dx%d' % (c, f[2] - f[0] + 1, f[3] - f[1] + 1)
                       for c, (f, _) in fenetres.items() if f))

    # 4. La vignette remplit la carte. On mesure l'EFFET — la largeur réellement
    #    affichée après le plafond de 400 px — et non la taille du fichier, qui
    #    ment. Tombe si on retire le plancher de proportion.
    etroites = []
    for c, (f, _) in fenetres.items():
        if f is None:
            continue
        L, H = sources[c].size
        l, h = f[2] - f[0] + 1, f[3] - f[1] + 1
        affichee = round(l * min(1.0, float(VIGNETTE_H) / h))
        if affichee < CARTE_L and l < L:
            etroites.append('%s %d px sur %d' % (c, affichee, CARTE_L))
    verifier('la vignette remplit la carte de 290 px', not etroites,
             'trop étroites : ' + ', '.join(etroites) if etroites else
             'les recadrées remplissent la carte')

    # 5. L'orange de la gravure n'est JAMAIS pris pour du marquage.
    #    Tombe si on relâche le seuil jusqu'à l'orange (g/r ≈ 0.34).
    pris = []
    for c, im in sources.items():
        pal = im.getpalette()
        for i in entrees_de_marquage(im, seuil):
            r, g, b = pal[3 * i:3 * i + 3]
            if r and g / r >= 0.30:
                pris.append('%s:(%d,%d,%d)' % (c, r, g, b))
    verifier('orange jamais pris pour du marquage', not pris,
             'retenu à tort : ' + ', '.join(pris[:4]) if pris else
             'aucune entrée de palette au-dessus de g/r=0.30 sur les %d'
             % len(sources))

    # 6. Le brachial, défaut mesuré : sa boîte faisait 278 px de large sur une
    #    planche de 420 (66 %) à cause des miettes du thorax. Tombe si on garde
    #    les miettes, ET si on ne referme pas les hachures.
    f, d = fenetres.get('brachial', (None, {}))
    large = (d['muscle'][2] - d['muscle'][0] + 1) if d.get('muscle') else 0
    L = sources['brachial'].size[0]
    verifier('brachial : la boîte ne mange pas le thorax',
             0 < large <= LARGEUR_BRACHIAL * L,
             'boîte de %d px de large sur %d (%.0f%%)' % (large, L, large / L * 100)
             if large else 'aucune boîte')

    # 7. Dix-neuf planches portent un marquage, trois n'en portent aucune.
    #    Écrit d'abord comme un [temoin] « qui tient des deux côtés » — c'était
    #    faux : il rougit dès qu'on relâche le seuil. Ce n'est donc pas un
    #    témoin, c'est un contrôle, et il garde le contrôle 2 honnête : sans
    #    lui, un détecteur qui ne trouve plus rien rendrait tout « visible à
    #    100 % », donc tout hors liste, et le contrôle 2 serait vert.
    hors = sorted(c for c, v in visibles.items() if v is None)
    verifier('%d planches lues par le détecteur, %d hors convention'
             % (len(sources) - len(HORS_DETECTEUR), len(HORS_DETECTEUR)),
             tuple(hors) == tuple(sorted(HORS_DETECTEUR)),
             'hors convention : ' + (', '.join(hors) or 'aucune'))

    # 8. L'ARCHIVE porte encore son marquage. Une conversion de palette peut
    #    le DETRUIRE sans rien casser d'autre : c'est arrive au carre
    #    pronateur, dont la zone ne couvre que 0,9 % de la planche. Tombe des
    #    qu'une planche archivee ressort vide.
    vides = []
    if os.path.isdir(ARCHIVE):
        for n in sorted(os.listdir(ARCHIVE)):
            if not n.endswith('.png'):
                continue
            c = n[:-4]
            if c in ('pectoralis_major', ):     # autre convention, voir l'en-tete
                continue
            if not marquage(Image.open(os.path.join(ARCHIVE, n))).any():
                vides.append(c)
    verifier('les planches archivées ont gardé leur marquage', not vides,
             'vidées par la conversion : ' + ', '.join(vides) if vides else
             'chaque source garde un marquage détectable')

    print()
    if echecs:
        print('%d contrôle(s) ROUGE(S) sur %d : %s'
              % (len(echecs), len(joues), ', '.join(echecs)))
    else:
        print('Les %d contrôles sont verts.' % len(joues))
    return echecs


def apercu(dossier):
    """Planche-contact : marquage en vert, fenêtre en rose quand il y en a une."""
    os.makedirs(dossier, exist_ok=True)
    bouts = []
    for n in noms():
        c = court(n)
        im = Image.open(os.path.join(SOURCES, n))
        vue = im.convert('RGB')
        v = part_visible(im)
        if c in A_RECADRER:
            f, d = fenetre(im)
            dr = ImageDraw.Draw(vue)
            dr.bitmap((0, 0), Image.fromarray((marquage(im) * 255).astype(np.uint8)).convert('1'),
                      fill=(0, 200, 0))
            dr.rectangle(list(f), outline=(255, 0, 200), width=3)
            texte = ('<b style="color:#c00">RECADRÉE</b> — muscle visible à %.0f %% '
                     'dans la carte' % (v * 100))
        else:
            texte = ('planche entière — muscle visible à %.0f %%' % (v * 100)
                     if v is not None else 'planche entière — aucun marquage')
        vue.save(os.path.join(dossier, c + '.png'))
        bouts.append('<figure><figcaption><b>%s</b><br>%s</figcaption>'
                     '<img src="%s.png" alt=""></figure>' % (c, texte, c))
    with open(os.path.join(dossier, 'index.html'), 'w', encoding='utf-8') as f:
        f.write('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
                '<title>Les planches</title><style>'
                'body{margin:0;padding:14px;background:#fff;color:#111;'
                'font:13px/1.4 system-ui,sans-serif}.g{display:flex;flex-wrap:wrap;gap:16px}'
                'figure{margin:0;width:260px}img{width:100%;border:1px solid #bbb}'
                'figcaption{font-size:11.5px;min-height:3.4em}</style></head><body>'
                '<h1>Vingt entières, deux recadrées</h1><div class="g">'
                + '\n'.join(bouts) + '</div></body></html>')
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
