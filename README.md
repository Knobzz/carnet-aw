# Carnet AW

Carnet d'entraînement bras de fer. Programmes composables, séances journalisées,
sparring, suivi des douleurs et de la charge tendineuse. Pour un téléphone, en salle,
hors ligne, sans serveur.

**→ https://knobzz.github.io/carnet-aw/**

Sur le téléphone : ouvrir ce lien, puis *Ajouter à l'écran d'accueil*. L'app démarre
ensuite sans réseau. Les données restent sur l'appareil — l'hébergement ne sert qu'à
livrer les fichiers, et le carnet n'envoie rien nulle part.

- Le modèle de données : [MODELE.md](MODELE.md)
- La ligne de série, isolée : [maquette-ligne-serie.html](maquette-ligne-serie.html)

---

## La stack, et pourquoi

**HTML + CSS + JavaScript, sans framework ni build.** Fichiers servis tels quels.

| contrainte | ce qu'elle impose |
|---|---|
| tourner sur le téléphone | rien à compiler, rien à installer : on ouvre une URL |
| fonctionner hors ligne en salle | service worker + manifeste → PWA installable, tout en cache |
| rien chez un tiers | `localStorage` seul ; aucune requête réseau sortante dans le code |

Ce que ça coûte, dit franchement : pas de réactivité automatique — chaque vue déclare
ce qu'elle met à jour. C'est précisément ce qu'on voulait : **le re-rendu est un geste
explicite**, jamais un effet de bord d'une frappe au clavier. C'est ce qui règle le
piège n° 1 de ta spec, et aucun framework ne l'aurait réglé mieux.

**Pas de police web.** La typographie vient du système. Une police distante casse le
hors ligne et ajoute un aller-retour ; les chiffres sont rendus en `tabular-nums`, ce
qui est ce qui compte quand l'écran est une colonne de nombres.

---

## Faire tourner

Les fichiers sont statiques. Un serveur suffit, et il en faut un : le service worker
exige `http(s)` ou `localhost`.

```bash
python -m http.server 8713
```

Puis `http://localhost:8713`.

**Sur le téléphone**, il faut une origine en **HTTPS** pour que la PWA s'installe.
C'est le rôle de GitHub Pages ici : *Settings ▸ Pages ▸ Deploy from a branch ▸ `main` /
`(root)`*, aucune étape de construction. Un `git push` sur `main` suffit à publier.

Servie depuis un **sous-chemin** (`/carnet-aw/` et non la racine), l'app a été vérifiée
sur l'URL réelle : aucun chemin absolu, `start_url` et `scope` en `./`, service worker
enregistré avec la portée `https://knobzz.github.io/carnet-aw/` et 19 fichiers en cache,
tous sous `/carnet-aw/`.

Les données restent sur l'appareil, dans le stockage du navigateur de cette origine —
elles ne montent nulle part, même hébergée. L'hébergement ne sert qu'à livrer les fichiers.

---

## Sur le téléphone

C'est l'usage principal, et ces points-là ne sont pas du décor :

| | |
|---|---|
| **Bouton Retour** | Ferme le panneau ouvert, un par un. Installée en plein écran, l'app n'a plus de barre de navigateur : sans ça, le Retour **quittait l'app** au milieu d'une séance. |
| **Écran allumé** | Verrou d'écran pendant une séance seulement, relâché dès que tu quittes l'app. Débrayable dans Réglages — c'est de la batterie. |
| **Clavier** | « Suivant » passe de la charge aux reps, « Terminé » valide la série et referme le clavier. Deux gestes, pouce jamais levé. |
| **Clavier qui masque** | Le champ actif remonte **seulement** s'il est réellement recouvert, via `visualViewport`. Pas de saut de page à chaque appui. |
| **Tirer pour recharger** | Désactivé : c'est le geste qu'on fait sans y penser, et il rechargeait la page en pleine série. |
| **Stockage durable** | `navigator.storage.persist()` est demandé au démarrage, puis rejoué à la première touche (il aboutit bien mieux après un geste). Sans lui, un navigateur de téléphone peut **évincer** le carnet quand la place manque. Réglages affiche l'état réel : accordé / refusé. |
| **Vibration** | Courte à la fin du repos, pour ne pas avoir à regarder l'écran. |
| **Cibles tactiles** | 44 px partout, vérifié sur les cinq écrans et dans les panneaux, à 320 px de large. |

---

## Mettre à jour sans que le téléphone serve l'ancienne version

C'est le piège classique d'une PWA : le correctif est livré, l'app paraît inchangée.
Trois protections, dont une mécanique.

```bash
python outils/version.py 1.1.1
```

Ce script pose la version aux **quatre** endroits — les 13 `?v=` d'`index.html`, les 2
de `banc/index.html`, le nom du cache dans `sw.js`, `APP_VERSION` dans `js/app.js` — et
**imprime le compte**. Un total différent de **17** veut dire qu'un fichier a bougé : il
refuse alors d'écrire. Sans argument, il se contente de vérifier la cohérence.
(Le README annonçait trois endroits et un total de 14 ; le script en comptait 17. Il
avait raison — c'est le texte qui était resté en arrière.)

Les deux autres : le service worker installe ses fichiers avec `cache: 'reload'`
(sinon il recopie l'ancien contenu du cache HTTP dans un cache tout neuf), et il
revalide au réseau avec `cache: 'no-cache'`.

Reste un cas irréductible : **le tout premier chargement après une mise à jour** peut
servir une `index.html` encore en cache HTTP — la page qui porte les cache-busters ne
peut pas se buster elle-même. Le service worker corrige dès le chargement suivant.
Sur un vrai hébergeur statique (en-têtes corrects sur le HTML), ça ne se voit pas.

---

## Les fichiers

```
index.html                 coque : métas PWA et chargement des scripts
manifest.webmanifest       nom, icônes, affichage autonome
sw.js                      cache hors ligne (réseau d'abord, cache sinon)
css/app.css                feuille unique
js/
  store.js                 persistance : une clé, tout en try/catch, panne annoncée
  model.js                 identités, copies programme→séance, volume, colonne PRÉCÉDENT
  ui.js                    briques : éléments, confirmation en 2 temps, autocomplétion,
                           champ multi-valeurs, chronomètre
  panneau.js               panneau plein écran + fiche d'un exercice
  vue-seance.js            la séance en cours
  vue-programmes.js        composition des programmes
  vue-sparring.js          formulaire de sparring
  vue-journal.js           journal daté, muscu et sparring mêlés
  vue-exercice.js          historique d'un exercice : la pente, les records
  vue-suivi.js             sollicitation, structures, douleurs et leurs 72 h, pentes, volume
  vue-reglages.js          thème, sauvegarde, catalogues, équipement
outils/faire-icones.py     régénère les PNG depuis le même dessin que l'icône SVG
outils/version.py          pose la version aux 4 endroits et compte les 17 occurrences
outils/banc.js             lance les deux bancs sans tête : node outils/banc.js
banc/index.html            banc de modèle — une page à ouvrir
banc/ihm.html + ihm.js     banc d'interface — rectangles réels, style calculé
```

---

## Le banc de recette

Deux pages, **192 contrôles**, et un lanceur pour ne plus avoir à les ouvrir à la main.

```bash
node outils/banc.js        # sert les fichiers, ouvre les deux pages sans tête, rend 1 si rouge
```

À la main, c'est une page comme une autre :

```bash
python -m http.server 8713
```
- **http://localhost:8713/banc/** — le modèle. **144 contrôles, 13 blocs.**
- **http://localhost:8713/banc/ihm.html** — l'interface. **48 contrôles, 4 blocs.**

**Ni l'un ni l'autre ne touche au carnet.** Le banc de modèle travaille sur des états
fabriqués. Le banc d'interface, lui, fait tourner la **vraie app**, qui écrit : il pose
`window.__BANC_IHM` avant de charger `store.js`, qui choisit alors une autre clé de
stockage. Son premier bloc le vérifie — une isolation qu'on ne mesure pas n'est qu'une
intention.

Ce que mesure le **modèle** : lecture des nombres et des slugs · la colonne PRÉCÉDENT ·
le volume (fait vs prévu, charge non chiffrée, saisie incomplète) · l'indépendance
programme/séance · les douleurs et leur compatibilité descendante · structures et fenêtre
72 h · la durée déduite · l'historique · la fusion à l'import · le chrono persistant · les
catalogues vides au départ · **ce que l'autocomplétion montre vraiment** · **les six
mouvements**.

Ce que mesure l'**interface**, et que le modèle ne peut pas voir : des rectangles réels et
du style calculé, dans un iframe de **320 px** — la largeur la plus dure. Le chronomètre
sort-il entièrement de l'écran, et laisse-t-il la barre d'onglets atteignable · la fiche
d'exercice affiche-t-elle ce qu'elle doit, et plus ce qu'elle ne doit plus · 44 px sur
chaque puce et chaque bouton · aucun débordement horizontal · la suggestion la plus récente
est-elle lisible sans rien taper.

**Un contrôle qu'on n'a pas vu tomber ne prouve rien.** Cinq blocs ont été vus rougir, en
réintroduisant volontairement le défaut qu'ils surveillent :

| défaut réintroduit | ce que le banc a dit |
|---|---|
| PRÉCÉDENT indexé par rang brut | `attendu "20 × 12", obtenu "22 × 10"` — 4 contrôles rouges |
| volume recomptant les cibles | `une séance pas commencée pèse ZÉRO — attendu 0, obtenu 240` |
| intensité inconnue remplacée par 5 | `devient inconnue plutôt que fausse — attendu null, obtenu 5` |
| `vuLe` ramené à la date seule | `l'outil ajouté À L'INSTANT est VISIBLE — attendu true, obtenu false` |
| chrono caché par `translateY(140%)` | `haut mesuré à 679 px pour un écran de 720` — 41 px de fantôme, et la barre d'onglets injoignable |

Le quatrième mérite une mention : le correctif a d'abord été écrit avec un horodatage lu à
l'horloge, et **le banc l'a fait tomber** — huit outils posés d'un même geste tombent dans
la même milliseconde et restaient à égalité. C'est ce qui a mené à un horodatage
strictement croissant.

Les cas marqués `[temoin]` mesurent un invariant du décor et tiennent des deux côtés —
leur libellé dit pourquoi.

> Le banc chargeait d'abord ses scripts avec un simple `?v=<version>` et restait **vert sur
> du code cassé**, le navigateur resservant sa copie. Il ajoute désormais un horodatage à
> chaque chargement. Ce faux vert n'a été vu que parce qu'on a exigé de le faire tomber.

---

## Les six pièges, et où ils sont traités

1. **Pas de re-rendu à la frappe.** `js/vue-seance.js` : les gestionnaires d'entrée
   écrivent dans le modèle, rafraîchissent trois `textContent` de totaux, et s'arrêtent
   là. Ajouter, retirer ou déplacer une série insère / retire / déplace **un** nœud.
   Vérifié : focus et position du curseur conservés sur quatre frappes consécutives.
2. **Rien en dur.** Aucun programme, aucun exercice, aucun outil livré. Les trois
   catalogues (exercices, outils, catégories) n'existent que par ce qui a été saisi.
   Seule exception, explicite et volontaire : un bouton « Ajouter mon matériel » dans
   Réglages, qui n'écrit rien tant qu'on ne l'a pas touché.
3. **Ni `confirm()` ni `alert()`.** Deux formes : le bouton qui s'arme et se désarme
   seul après 4 s (`A.ui.confirmer2`), et la feuille de choix (`A.ui.feuille`) qui
   nomme ce qui va disparaître.
4. **Persistance.** Lecture et écriture sous `try/catch` ; un échec affiche un bandeau
   qui dit quoi faire, au lieu de perdre la saisie en silence. Écriture groupée à
   400 ms, immédiate quand la page passe en arrière-plan. Export et import vérifiés
   par un aller-retour complet : export → tout effacer → import → état identique.
5. **Mobile d'abord.** Vérifié à 320 px : aucun défilement horizontal sur les cinq
   écrans ni dans les panneaux, et aucun contrôle sous 44 px.
6. **Thème clair et sombre**, déduits du système, surchargeables dans Réglages.

---

## Ce qui reste ouvert

- **Aucune donnée ne sort de l'appareil.** Changer de téléphone = exporter puis importer.
  C'est le seul chemin, et c'est voulu : il n'y a pas de compte, donc pas de synchronisation.
- Le journal garde tout. Si un jour il devient lourd, c'est là qu'il faudra regarder —
  Réglages affiche la taille réelle des données.
