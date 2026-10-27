#!/usr/bin/env node
/*
 * Genera una versión del prototipo para publicarla como vista previa (Artifact de Claude):
 * un solo HTML con las fotos incrustadas, porque la página publicada bloquea las imágenes
 * externas. Parte de prototipo/standalone.html (regenéralo antes con build-standalone.js).
 *
 * Uso:
 *   node scripts/build-artifact.js [salida.html] [carpeta-de-fotos]
 *   (por defecto: .cache/vista-previa.html y .cache/fotos; .cache no se sube al repositorio)
 *
 * Las fotos (Unsplash) se buscan en el código y se descargan con curl la primera vez.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const proto = path.join(root, 'prototipo');
const out = path.resolve(process.argv[2] || path.join(root, '.cache', 'vista-previa.html'));
const imgDir = path.resolve(process.argv[3] || path.join(root, '.cache', 'fotos'));

// Todas las fotos que usa el prototipo (identificadores de Unsplash en las fuentes).
const slugs = new Set();
fs.readdirSync(proto).filter((f) => f.endsWith('.js')).forEach((f) => {
  (fs.readFileSync(path.join(proto, f), 'utf8').match(/\b1[0-9]{9,12}-[0-9a-f]{12}\b/g) || []).forEach((s) => slugs.add(s));
});

fs.mkdirSync(imgDir, { recursive: true });
let downloaded = 0;
const missing = [];
for (const s of slugs) {
  const file = path.join(imgDir, s + '.jpg');
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) continue;
  try {
    execFileSync('curl', ['-sSfL', '-o', file, `https://images.unsplash.com/photo-${s}?w=700&h=700&fit=crop&q=60`], { stdio: 'pipe' });
    downloaded++;
  } catch (e) {
    missing.push(s);
    try { fs.unlinkSync(file); } catch (err) {}
  }
}

const html = fs.readFileSync(path.join(proto, 'standalone.html'), 'utf8');
const style = (html.match(/<style>[\s\S]*?<\/style>/) || [])[0];
const body = (html.match(/<body>([\s\S]*?)<\/body>/) || [])[1];
if (!style || !body) throw new Error('standalone.html no tiene <style> o <body>: regenéralo con node scripts/build-standalone.js');

// Fotos como data URI; si falta alguna, se pide a Unsplash como en el prototipo normal.
const map = {};
for (const s of slugs) {
  const file = path.join(imgDir, s + '.jpg');
  if (fs.existsSync(file)) map[s] = 'data:image/jpeg;base64,' + fs.readFileSync(file).toString('base64');
}
const uimgOld = "function uimg(slug,s){ s=s||500; return `https://images.unsplash.com/photo-${slug}?w=${s}&h=${s}&fit=crop&q=60`; }";
if (!body.includes(uimgOld)) throw new Error('No se encuentra la función uimg en standalone.html');
const page = body.replace(uimgOld, () => 'const IMG_DATA = ' + JSON.stringify(map) + ';\n'
  + "function uimg(slug,s){ s=s||500; return IMG_DATA[slug] || `https://images.unsplash.com/photo-${slug}?w=${s}&h=${s}&fit=crop&q=60`; }");
// Diseño oscuro siempre (la vista previa no debe pasarse a claro).
const css = style.replace('--maxw:430px;', '--maxw:430px;\n  color-scheme:dark;');

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, '<title>Prototipo de Planes</title>\n' + css + '\n' + page.trim() + '\n');
console.log(`${path.relative(root, out)} generado (${Math.round(fs.statSync(out).size / 1024)} KB, ${Object.keys(map).length} de ${slugs.size} fotos incrustadas${downloaded ? `, ${downloaded} descargadas` : ''})`);
if (missing.length) console.log('Sin descargar (se cargarán de Unsplash): ' + missing.join(', '));
