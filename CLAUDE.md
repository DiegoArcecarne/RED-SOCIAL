# Instrucciones para trabajar en este proyecto

App de planes (red social para quedar con gente en planes reales). El producto está en
`PRODUCTO.md`; el estado actual y lo pendiente, en [`docs/estado.md`](docs/estado.md). Léelo
antes de empezar.

## Cómo trabajamos

- **Idioma**: todo en español (conversación, textos de la app, documentación, commits y PR).
- **Una rama y un PR por bloque** contra `main`. **Nunca fusionar**: los PR los fusiona Diego.
  Si los PR anteriores no están fusionados, la rama nueva sale de la última rama del bloque
  anterior y el PR dice sobre cuáles va encima.
- **Documentar cada cambio de concepto**: `PRODUCTO.md`, `docs/modelo-datos.md` (diagrama
  Mermaid) y la especificación del servidor en `docs/*.md` (el prototipo simula; el documento
  dice qué tiene que hacer el servidor). Añadir el punto al README del prototipo y la fila a la
  tabla de documentos del README principal.
- **Diseño**: oscuro, sobrio, estilo Instagram; **sin emojis** en ningún sitio; iconos de línea
  fina (SVG en `SVG` de `app.js`); un solo acento azul (`--accent`); colores como variables en
  `:root` de `styles.css`. Pensado para móvil (390 px de ancho); comprobar que no hay scroll
  horizontal.
- **Privacidad y confianza primero**: nada de píxeles ni rastreo de terceros (issue #28);
  verificación para participar en planes; filtros de contenido en todo lo que se publica.

## El prototipo (`prototipo/`)

SPA estática en JavaScript sin dependencias. Se edita **solo en las fuentes**: `index.html`,
`styles.css` y los `.js` (`data.js` datos de ejemplo, `cuentas.js`, `planes.js`, `social.js`,
`confianza.js`, `pagos.js`, `chispas.js`, `admin.js`, `agenda.js`, `videollamadas.js`,
`publicidad.js` y `app.js`, que va el último). Funciones globales (los `onclick` en línea las
llaman), router por `#/ruta` en `router()` de `app.js`, estado en `state` y persistencia en
`localStorage` con `saveState()` / `loadState()`.

Un módulo nuevo: añadir su `<script>` en `index.html` antes de `app.js`, a la lista de
`scripts/build-standalone.js`, al `node --check` de `.github/workflows/prototipo.yml` y a la
lista de fuentes del README del prototipo.

## Antes de cada commit

```bash
node scripts/build-standalone.js        # regenera prototipo/standalone.html (no editarlo a mano)
node scripts/build-web.js               # regenera prototipo/web/ (web pública de los enlaces)
node scripts/smoke-test.js              # pruebas automáticas: deben salir "Todo OK"
```

- Cada función nueva lleva sus comprobaciones en `scripts/smoke-test.js` (entorno simulado
  con `createEnv`, `check(...)`; cuidado con no repetir nombres de `const` de nivel superior).
- Comprobar en un navegador de verdad (Chromium con Playwright, viewport 390x844) y mirar
  capturas antes de dar algo por terminado.
- Los commits terminan con la línea de coautoría que indique la sesión; sin nombres de modelo
  en el repositorio.

## Vista previa para enseñar

- `node scripts/build-artifact.js` genera `.cache/vista-previa.html` (un solo archivo con
  las fotos incrustadas, para publicarlo como Artifact de Claude).
- O GitHub Pages: `https://diegoarcecarne.github.io/RED-SOCIAL/prototipo/` (rama elegida en
  Settings ▸ Pages). Se puede instalar en el móvil como app.
