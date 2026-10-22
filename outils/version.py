# -*- coding: utf-8 -*-
"""Pose une version neuve PARTOUT, et compte ce qu'elle a touché.

Une mise à jour doit atteindre le téléphone. Trois endroits la gouvernent, et
en oublier un donne le pire symptôme : l'app paraît inchangée alors que le
correctif est bien livré.

    index.html       le ?v= de la feuille et des 13 scripts   14 occurrences
    banc/index.html  le ?v= de la feuille et du chargeur        2
    sw.js            le nom du cache                            1
    js/app.js        window.APP_VERSION, affiché dans Réglages  1

                                                        total 18

Usage :
    python outils/version.py            lit et vérifie la cohérence
    python outils/version.py 1.1.0      pose 1.1.0 partout

Le compte est imprimé à chaque fois : un total qui n'est pas 18 veut dire
qu'un fichier a bougé et que ce script doit être relu, pas contourné.

Il a déjà refusé d'écrire une fois, à l'arrivée de js/vue-recup.js : c'est ce
qu'on lui demande.
"""
import io
import os
import re
import sys

ATTENDU = 18

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def lire(rel):
    with io.open(os.path.join(RACINE, rel), encoding='utf-8') as f:
        return f.read()


def ecrire(rel, texte):
    with io.open(os.path.join(RACINE, rel), 'w', encoding='utf-8', newline='') as f:
        f.write(texte)


MOTIFS = [
    ('index.html', re.compile(r'\?v=([0-9]+\.[0-9]+\.[0-9]+)'), lambda v: '?v=' + v),
    # Le banc doit mesurer la version qu'il pretend mesurer : ses propres
    # cache-busters sont gouvernes par le meme geste.
    ('banc/index.html', re.compile(r'\?v=([0-9]+\.[0-9]+\.[0-9]+)'), lambda v: '?v=' + v),
    ('sw.js', re.compile(r"var CACHE = 'carnet-aw-v([0-9]+\.[0-9]+\.[0-9]+)';"),
     lambda v: "var CACHE = 'carnet-aw-v%s';" % v),
    ('js/app.js', re.compile(r"window\.APP_VERSION = '([0-9]+\.[0-9]+\.[0-9]+)';"),
     lambda v: "window.APP_VERSION = '%s';" % v),
]


def etat():
    """Retourne {fichier: (nb_occurrences, {versions trouvées})}."""
    vu = {}
    for rel, motif, _ in MOTIFS:
        trouves = motif.findall(lire(rel))
        vu[rel] = (len(trouves), set(trouves))
    return vu


def rapport(vu):
    total = 0
    versions = set()
    for rel, (n, vs) in vu.items():
        total += n
        versions |= vs
        sys.stdout.write('  %-14s %2d occurrence(s)  %s\n'
                         % (rel, n, ', '.join(sorted(vs)) or '—'))
    sys.stdout.write('  %-14s %2d au total\n' % ('', total))
    return total, versions


def main():
    vu = etat()
    sys.stdout.write('Version en place :\n')
    total, versions = rapport(vu)

    if total != ATTENDU:
        sys.stdout.write('\nATTENTION : %d occurrences au lieu de %d attendues.\n'
                         'Un fichier a bouge — relire outils/version.py avant de poser une version.\n'
                         % (total, ATTENDU))
        return 1
    if len(versions) > 1:
        sys.stdout.write('\nATTENTION : plusieurs versions coexistent (%s).\n'
                         % ', '.join(sorted(versions)))
        if len(sys.argv) < 2:
            return 1

    if len(sys.argv) < 2:
        sys.stdout.write('\nCoherent. Pour poser une version : python outils/version.py 1.1.0\n')
        return 0

    neuve = sys.argv[1].strip()
    if not re.match(r'^[0-9]+\.[0-9]+\.[0-9]+$', neuve):
        sys.stdout.write('\nVersion attendue sous la forme 1.2.3, reçu : %s\n' % neuve)
        return 1

    poses = 0
    for rel, motif, remplacer in MOTIFS:
        texte = lire(rel)
        texte, n = motif.subn(lambda m: remplacer(neuve), texte)
        ecrire(rel, texte)
        poses += n

    sys.stdout.write('\nVersion %s posee :\n' % neuve)
    rapport(etat())
    if poses != ATTENDU:
        sys.stdout.write('\nATTENTION : %d remplacements au lieu de %d.\n' % (poses, ATTENDU))
        return 1
    sys.stdout.write('\n%d cache-busters a jour. Le telephone verra la mise a jour.\n' % poses)
    return 0


if __name__ == '__main__':
    sys.exit(main())
