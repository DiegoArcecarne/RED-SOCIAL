#!/usr/bin/env node
/*
 * Genera prototipo/standalone.html a partir de las fuentes del prototipo
 * (index.html + styles.css + data.js + cuentas.js + planes.js + social.js + confianza.js + pagos.js + chispas.js + app.js), todo en línea en un único archivo.
 *
 * Uso:
 *   node scripts/build-standalone.js           # regenera standalone.html
 *   node scripts/build-standalone.js --check   # falla si standalone.html está desactualizado
 *
 * Regla: no edites standalone.html a mano; edita las fuentes y vuelve a ejecutar esto.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'prototipo');
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');

function build() {
  let html = read('index.html');
  const css = read('styles.css');
  const data = read('data.js');
  const cuentas = read('cuentas.js');
  const planes = read('planes.js');
  const social = read('social.js');
  const confianza = read('confianza.js');
  const pagos = read('pagos.js');
  const chispas = read('chispas.js');
  const app = read('app.js');

  const link = '<link rel="stylesheet" href="styles.css" />';
  const scripts = /  <script src="data.js"><\/script>\n  <script src="cuentas.js"><\/script>\n  <script src="planes.js"><\/script>\n  <script src="social.js"><\/script>\n  <script src="confianza.js"><\/script>\n  <script src="pagos.js"><\/script>\n  <script src="chispas.js"><\/script>\n  <script src="app.js"><\/script>/;
  if (!html.includes(link)) throw new Error('index.html: no se encuentra el <link> a styles.css');
  if (!scripts.test(html)) throw new Error('index.html: no se encuentran los <script> de data.js, cuentas.js, planes.js, social.js, confianza.js, pagos.js, chispas.js y app.js');

  // Funciones de reemplazo: evitan que "$&", "$1"… del CSS/JS se interpreten como patrones.
  html = html.replace(link, () => '<style>\n' + css + '\n  </style>');
  html = html.replace(scripts, () => '  <script>\n' + data + '\n\n' + cuentas + '\n\n' + planes + '\n\n' + social + '\n\n' + confianza + '\n\n' + pagos + '\n\n' + chispas + '\n\n' + app + '\n  </script>');
  html = html.replace('<title>Prototipo · App de planes</title>', '<title>Prototipo (standalone) · App de planes</title>');
  return html;
}

const out = path.join(dir, 'standalone.html');
const html = build();

if (process.argv.includes('--check')) {
  const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (current !== html) {
    console.error('standalone.html está desactualizado. Ejecuta: node scripts/build-standalone.js');
    process.exit(1);
  }
  console.log('standalone.html al día');
} else {
  fs.writeFileSync(out, html);
  console.log(`standalone.html generado (${html.length} bytes)`);
}
