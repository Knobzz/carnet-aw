/* Lance les deux bancs sans ouvrir de navigateur à la main.

       node outils/banc.js

   Il sert les fichiers du dépôt sur un port libre, ouvre les deux pages dans
   un Chromium sans tête, lit `window.__banc` et rend 1 si un contrôle échoue.
   C'est ce qui permet de faire tomber un contrôle en boucle sans quitter le
   terminal — la seule façon honnête d'en écrire un.

   Les deux pages restent la référence : ce lanceur ne fait que les ouvrir.
   S'il manque Playwright, il le dit et donne les deux URL à ouvrir soi-même,
   plutôt que de prétendre avoir mesuré quoi que ce soit.

   Chemin du navigateur : $PLAYWRIGHT_CHROMIUM, sinon celui de Playwright. */
'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');

var RACINE = path.dirname(__dirname);

var TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

/* Sans en-tête anti-cache, le navigateur peut resservir sa copie et le banc
   reste VERT sur du code cassé. Le piège a déjà été rencontré pour de vrai. */
function servir() {
  return http.createServer(function (req, res) {
    var rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    var abs = path.join(RACINE, rel);
    if (abs.indexOf(RACINE) !== 0) { res.writeHead(403); res.end(); return; }
    if (rel.slice(-1) === '/') abs = path.join(abs, 'index.html');
    fs.stat(abs, function (err, st) {
      if (!err && st.isDirectory()) abs = path.join(abs, 'index.html');
      fs.readFile(abs, function (err2, buf) {
        if (err2) { res.writeHead(404); res.end('absent'); return; }
        res.writeHead(200, {
          'Content-Type': TYPES[path.extname(abs)] || 'application/octet-stream',
          'Cache-Control': 'no-store'
        });
        res.end(buf);
      });
    });
  });
}

function chromium(pw) {
  var ep = process.env.PLAYWRIGHT_CHROMIUM;
  if (ep && fs.existsSync(ep)) return { executablePath: ep };
  return {};
}

function rendre(nom, r) {
  var lignes = [];
  lignes.push('');
  lignes.push(nom + ' — ' + r.ok + ' / ' + (r.ok + r.ko) + (r.ko ? '  ✗' : '  ✓'));
  r.blocs.forEach(function (b) {
    lignes.push('  ' + (b.ko.length ? '✗' : '✓') + ' ' + b.bloc
              + '  ' + b.ok + '/' + (b.ok + b.ko.length));
    b.ko.forEach(function (e) {
      lignes.push('      ' + e.quoi);
      lignes.push('        attendu ' + JSON.stringify(e.attendu)
                + ' · obtenu ' + JSON.stringify(e.obtenu));
    });
  });
  console.log(lignes.join('\n'));
}

function main() {
  var pw;
  try { pw = require('playwright'); }
  catch (e) {
    console.log('Playwright n’est pas installé — rien n’a été mesuré.\n'
      + '  npm install playwright     puis   node outils/banc.js\n'
      + 'Ou, à la main :  python -m http.server 8713\n'
      + '  http://localhost:8713/banc/        (modèle)\n'
      + '  http://localhost:8713/banc/ihm.html (interface)');
    process.exit(2);
  }

  var serveur = servir();
  serveur.listen(0, '127.0.0.1', function () {
    var base = 'http://127.0.0.1:' + serveur.address().port;
    var pages = [
      { nom: 'Banc de modèle', url: base + '/banc/index.html' },
      { nom: 'Banc d’interface', url: base + '/banc/ihm.html' }
    ];
    var total = { ok: 0, ko: 0 };

    pw.chromium.launch(chromium(pw)).then(function (navigateur) {
      return navigateur.newContext({
        viewport: { width: 420, height: 900 },
        /* Le service worker de l'app servirait ses copies au banc. */
        serviceWorkers: 'block'
      }).then(function (ctx) {
        function une(i) {
          if (i >= pages.length) return Promise.resolve();
          var p = pages[i];
          return ctx.newPage().then(function (page) {
            var bruits = [];
            page.on('pageerror', function (e) { bruits.push('erreur JS : ' + e.message); });
            return page.goto(p.url, { waitUntil: 'load' })
              .then(function () {
                return page.waitForFunction('window.__banc && window.__banc.fini !== false',
                                            null, { timeout: 30000 });
              })
              .then(function () { return page.evaluate('window.__banc'); })
              .then(function (r) {
                rendre(p.nom, r);
                bruits.forEach(function (b) { console.log('      ! ' + b); });
                total.ok += r.ok; total.ko += r.ko;
                if (bruits.length) total.ko += bruits.length;
              })
              .catch(function (err) {
                console.log('\n' + p.nom + ' — n’a pas rendu de résultat : ' + err.message.split('\n')[0]);
                total.ko += 1;
              })
              .then(function () { return page.close(); })
              .then(function () { return une(i + 1); });
          });
        }
        return une(0);
      }).then(function () { return navigateur.close(); });
    }).then(function () {
      serveur.close();
      console.log('\n' + total.ok + ' / ' + (total.ok + total.ko) + ' au total sur les deux bancs.');
      process.exit(total.ko ? 1 : 0);
    }).catch(function (err) {
      serveur.close();
      console.log('Le navigateur n’a pas démarré : ' + err.message.split('\n')[0]
        + '\nPLAYWRIGHT_CHROMIUM peut désigner un exécutable Chromium.');
      process.exit(2);
    });
  });
}

main();
