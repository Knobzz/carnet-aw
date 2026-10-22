/* Service worker — hors ligne en salle.
   Les fichiers de l'app sont mis en cache à l'installation ; ensuite la page
   est servie depuis le cache dès que le réseau manque. Aucune donnée
   d'entraînement ne passe par ici : elle ne quitte jamais le téléphone. */

var CACHE = 'carnet-aw-v1.19.0';

var FICHIERS = [
  './',
  'index.html',
  'css/app.css',
  'js/store.js',
  'js/model.js',
  'js/ui.js',
  'js/panneau.js',
  'js/vue-seance.js',
  'js/vue-recup.js',
  'js/vue-programmes.js',
  'js/vue-sparring.js',
  'js/vue-journal.js',
  'js/vue-exercice.js',
  'js/vue-suivi.js',
  'js/vue-reglages.js',
  'js/app.js',
  'manifest.webmanifest',
  'icones/icone.svg',
  'icones/icone-192.png',
  'icones/icone-512.png',
  'icones/icone-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) {
        /* addAll() passe par le cache HTTP du navigateur et peut donc installer
           d'ANCIENS fichiers dans un cache tout neuf. On force la relecture. */
        return Promise.all(FICHIERS.map(function (f) {
          return fetch(new Request(f, { cache: 'reload' })).then(function (r) {
            if (r && r.ok) return c.put(f, r);
          });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (cles) {
      return Promise.all(cles.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Réseau d'abord quand il répond (pour récupérer une version à jour),
   cache sinon. En salle, c'est toujours la branche cache qui sert. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  /* Une seule entree par fichier : index.html?v=3 et index.html sont le meme
     fichier, et doivent partager leur place en cache. */
  var cle = new Request(url.origin + url.pathname, { credentials: 'same-origin' });

  /* Le cache HTTP du navigateur peut servir un ancien fichier a la place du
     reseau — y compris a ce service worker. Une correction livree resterait
     alors invisible sur le telephone. On force donc la revalidation : le
     serveur repond 304 si rien n'a change, ce qui ne coute presque rien. */
  var reqReseau;
  try { reqReseau = new Request(e.request, { cache: 'no-cache' }); }
  catch (err) { reqReseau = e.request; }

  e.respondWith(
    fetch(reqReseau).then(function (r) {
      if (r && r.ok) {
        var copie = r.clone();
        caches.open(CACHE).then(function (c) { c.put(cle, copie); });
      }
      return r;
    }).catch(function () {
      return caches.match(cle, { ignoreSearch: true }).then(function (c) {
        if (c) return c;
        /* Navigation hors ligne vers une route inconnue : on sert la page. */
        if (e.request.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      });
    })
  );
});
