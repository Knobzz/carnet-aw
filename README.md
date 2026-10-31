# Carnet AW

Carnet d'entraînement bras de fer : programmes, séances, sparring, suivi des
douleurs et de la charge tendineuse. Pour un téléphone, en salle, hors ligne,
sans serveur.

**→ https://knobzz.github.io/carnet-aw/**

Ouvrir ce lien sur le téléphone, puis *Ajouter à l'écran d'accueil*. L'app
démarre ensuite sans réseau. **Les données restent sur l'appareil** :
l'hébergement ne sert qu'à livrer les fichiers, et le carnet n'envoie rien
nulle part.

## Par où commencer

| je veux… | aller voir |
|---|---|
| savoir ce qui a changé à la dernière version | [CHANGELOG.md](CHANGELOG.md) |
| faire tourner le carnet en local | *Faire tourner*, plus bas |
| comprendre comment les données sont rangées | [MODELE.md](MODELE.md) |
| savoir ce qui est prévu, et ce qui est en dette | [CHANTIERS.md](CHANTIERS.md) |
| lancer les contrôles avant de livrer | [docs/BANC.md](docs/BANC.md) |
| éviter les erreurs qui reviennent | [docs/PIEGES.md](docs/PIEGES.md) |

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

Le fichier vide **`.nojekyll`** à la racine dit à Pages de ne pas passer le dépôt par
Jekyll. C'est le réglage qui correspond à ce que ce projet est — des fichiers servis tels
quels — et il évite qu'un moteur de gabarits s'interpose un jour sur un nom de fichier
qui lui déplaît. **Ne pas le supprimer en le croyant inutile.**

> Il a été ajouté en croyant débloquer une publication qui semblait arrêtée. **Ce n'était
> pas la cause** : la construction était simplement lente — une trentaine de minutes — et
> elle est passée toute seule, avant même que ce fichier soit construit. Un
> `Last-Modified` figé se lit comme une panne et n'en est pas une. Le fichier reste parce
> qu'il est juste, pas parce qu'il a réparé quelque chose.

Servie depuis un **sous-chemin** (`/carnet-aw/` et non la racine), l'app a été vérifiée
sur l'URL réelle : aucun chemin absolu, `start_url` et `scope` en `./`, service worker
enregistré avec la portée `https://knobzz.github.io/carnet-aw/` et 21 fichiers en cache,
tous sous `/carnet-aw/`.

Les données restent sur l'appareil, dans le stockage du navigateur de cette origine —
elles ne montent nulle part, même hébergée. L'hébergement ne sert qu'à livrer les fichiers.

---

## Mettre à jour sans que le téléphone serve l'ancienne version

C'est le piège classique d'une PWA : le correctif est livré, l'app paraît inchangée.
Trois protections, dont une mécanique.

```bash
python outils/version.py 1.1.1
```

Ce script pose la version aux **quatre** endroits — les 14 `?v=` d'`index.html`, les 2
de `banc/index.html`, le nom du cache dans `sw.js`, `APP_VERSION` dans `js/app.js` — et
**imprime le compte**. Un total différent de **18** veut dire qu'un fichier a bougé : il
refuse alors d'écrire. Sans argument, il se contente de vérifier la cohérence.
(Ce texte a annoncé 14, puis 17, pendant que le script en comptait un autre. Chaque fois
c'est le script qui avait raison, et le texte qui était resté en arrière — c'est
précisément pourquoi il imprime le compte plutôt que de le supposer.)

`banc/ihm.html` n'y figure pas, et c'est voulu : il charge `ihm.js` avec un horodatage à
chaque appel, donc il ne peut pas servir une copie périmée.

Les deux autres : le service worker installe ses fichiers avec `cache: 'reload'`
(sinon il recopie l'ancien contenu du cache HTTP dans un cache tout neuf), et il
revalide au réseau avec `cache: 'no-cache'`.

Reste un cas irréductible : **le tout premier chargement après une mise à jour** peut
servir une `index.html` encore en cache HTTP — la page qui porte les cache-busters ne
peut pas se buster elle-même. Le service worker corrige dès le chargement suivant.
Sur un vrai hébergeur statique (en-têtes corrects sur le HTML), ça ne se voit pas.

---

## La stack, en trois lignes

**HTML + CSS + JavaScript, sans framework ni build.** Les fichiers sont
servis tels quels : rien à compiler, rien à installer. Un service worker et
un manifeste en font une PWA installable, qui fonctionne hors ligne.
`localStorage` seul, aucune requête sortante dans le code.

**Ce que ça coûte, dit franchement** : pas de réactivité automatique — chaque
vue déclare ce qu'elle met à jour. C'est voulu : **le re-rendu est un geste
explicite**, jamais l'effet de bord d'une frappe. C'est ce qui règle le
piège du rendu incrémental, qu'aucun framework n'aurait mieux réglé.

**Pas de police web** : la typographie vient du système. Une police distante
casserait le hors ligne. Les chiffres sont en `tabular-nums`, ce qui compte
quand l'écran est une colonne de nombres.

## Sur le téléphone

C'est l'usage principal, et ces points-là ne sont pas du décor :

| | |
|---|---|
| **Bouton Retour** | Ferme le panneau ouvert, un par un. Installée en plein écran, l'app n'a plus de barre de navigateur : sans ça, le Retour **quittait l'app** au milieu d'une séance. |
| **Écran allumé** | Verrou d'écran pendant une séance seulement, relâché dès que tu quittes l'app. Débrayable dans Réglages — c'est de la batterie. |
| **Clavier** | « Suivant » passe de la charge aux reps, « Terminé » valide la série et referme le clavier. Deux gestes, pouce jamais levé. |
| **Clavier qui masque** | Le champ actif remonte **seulement** s'il est réellement recouvert, via `visualViewport`. Pas de saut de page à chaque appui. |
| **Tirer pour recharger** | Désactivé : c'est le geste qu'on fait sans y penser, et il rechargeait la page en pleine série. |
| **Stockage durable** | `navigator.storage.persist()` est demandé au démarrage, puis rejoué à la première touche (il aboutit bien mieux après un geste). Sans lui, un navigateur de téléphone peut **évincer** le carnet quand la place manque. Réglages affiche l'état réel : accordé / refusé. **Mesuré sur un vrai téléphone en 1.22.1, app installée : accordé.** |
| **Mode avion** | La coque et les icônes sont pré-cachées (21 fichiers) ; les illustrations de muscles ne le sont pas — le service worker les garde à la première consultation. **Essayé en salle en 1.22.1 : concluant.** Les 35 illustrations pèsent 2 Mo : les pré-cacher les ferait payer à chaque installation, y compris à qui ne regarde jamais la carte. |
| **Vibration** | Courte à la fin du repos, pour ne pas avoir à regarder l'écran. |
| **Cibles tactiles** | 44 px partout, vérifié sur les cinq écrans et dans les panneaux, à 320 px de large. |

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
  vue-recup.js             la routine de récupération, à cocher chaque jour
  vue-programmes.js        composition des programmes
  vue-sparring.js          formulaire de sparring
  vue-journal.js           journal daté, muscu et sparring mêlés
  vue-exercice.js          historique d'un exercice : la pente, les records
  vue-suivi.js             sollicitation, structures, douleurs et leurs 72 h, pentes, volume
  vue-reglages.js          thème, équipement, sauvegarde, état du stockage,
                           envoyer un retour, catalogues
icones/planches/           les 37 planches entières : la SOURCE des illustrations
icones/planches-gray/      les 39 gravures d'origine, sous leur nom latin
outils/faire-icones.py     régénère les PNG depuis le même dessin que l'icône SVG
outils/recadrer-planches.py  dérive icones/muscle-*.png des planches entières
outils/version.py          pose la version aux 4 endroits et compte les 18 occurrences
outils/banc.js             lance les deux bancs sans tête : node outils/banc.js
banc/index.html            banc de modèle — une page à ouvrir
banc/ihm.html + ihm.js     banc d'interface — rectangles réels, style calculé
```

---

## Avant de livrer

```bash
python outils/version.py X.Y.Z   # pose la version et COMPTE ses 18 occurrences
node outils/banc.js              # joue les deux bancs, rend 1 si rouge
```

Le compte de **18** n'est pas décoratif : un total différent veut dire qu'une
page a gagné ou perdu un script, et qu'il faut relire le script de version
avant de continuer.

Puis **tenir [CHANGELOG.md](CHANGELOG.md)** — ce que la version ajoute,
enlève et corrige, en mots d'utilisateur.

Le détail des contrôles, leur lecture par bloc et la discipline de chute :
[docs/BANC.md](docs/BANC.md).

## Envoyer un retour

Réglages porte un bouton pour les bêta-testeurs : une zone de texte, un bloc de contexte
**technique** généré tout seul — version, écran, navigateur, installée ou non, et des
comptes — puis **Copier** ou **Ouvrir un ticket GitHub** pré-rempli.

**Aucune donnée d'entraînement n'en sort** : jamais un nom d'exercice, d'outil ou de
programme, jamais une charge, jamais une douleur. Le banc le mesure sur un carnet
fabriqué avec des noms reconnaissables.

**Rien ne part tout seul**, et le texte est lisible en entier avant — un contrôle mesure
la hauteur réelle du bloc, pas son attribut `hidden`. Le ticket est le **seul endroit de
l'app qui mène dehors** : pas une requête, une navigation vers `github.com` déclenchée par
un appui. Détail du dessin : [MODELE.md](MODELE.md).

---

## Ce qui reste ouvert

- **Aucune donnée ne sort de l'appareil.** Changer de téléphone = exporter puis importer.
  C'est le seul chemin, et c'est voulu : il n'y a pas de compte, donc pas de synchronisation.
- Le journal garde tout. Si un jour il devient lourd, c'est là qu'il faudra regarder —
  Réglages affiche la taille réelle des données.
