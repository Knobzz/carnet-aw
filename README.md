# Carnet AW

Carnet d'entraînement bras de fer. Programmes composables, séances journalisées,
sparring, suivi des douleurs et de la charge tendineuse. Pour un téléphone, en salle,
hors ligne, sans serveur.

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
GitHub Pages, Netlify, Cloudflare Pages conviennent : on y dépose le dossier tel quel,
sans étape de construction. Une fois la page ouverte, « Ajouter à l'écran d'accueil »
l'installe ; ensuite elle démarre sans réseau.

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

Ce script pose la version aux **trois** endroits — les 12 `?v=` d'`index.html`, le nom
du cache dans `sw.js`, `APP_VERSION` dans `js/app.js` — et **imprime le compte**.
Un total différent de 14 veut dire qu'un fichier a bougé : il refuse alors d'écrire.
Sans argument, il se contente de vérifier la cohérence.

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
  vue-suivi.js             sollicitation, douleurs et leurs 72 h, volume, forces
  vue-reglages.js          thème, sauvegarde, catalogues, équipement
outils/faire-icones.py     régénère les PNG depuis le même dessin que l'icône SVG
outils/version.py          pose la version aux 3 endroits et compte les 14 occurrences
```

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
