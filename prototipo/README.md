# Prototipo visual — App de planes

Prototipo navegable y estático (HTML + CSS + JS vanilla, **sin frameworks ni build**)
de la app definida en [`../PRODUCTO.md`](../PRODUCTO.md). Sirve para *ver la idea
funcionando*, no es código de producción.

## Cómo previsualizarlo

**Opción más simple (un solo archivo):** abre `standalone.html` directamente en el
navegador. Lleva TODO en línea (HTML + CSS + datos + JS), sin archivos externos, así
que funciona con `file://` sin ninguna dependencia ni servidor.

**Opción multi-archivo:** abre `index.html` (usa `styles.css`, `data.js`, `app.js`).
También funciona con `file://` porque no usa `fetch`; los datos se exponen además en
`window` para no depender del scope compartido entre `<script>`.

**Opción recomendada (servidor local):** desde esta carpeta,

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000  en el navegador
```

Para la mejor experiencia, activa la **vista móvil** en las DevTools del navegador
(`F12` ▸ icono de móvil), ya que el diseño es mobile-first.

## Qué incluye

Estética **modo oscuro tipo Instagram**, minimalista y sin emojis (los iconos son
SVG monolínea). Tres vistas principales, con navegación por la barra inferior y por
hash (`#/...`):

1. **Descubrir** (pestaña *Disponibles*) — **cuadrícula tipo Instagram de 3 columnas**
   con 12 publicaciones; cada celda es una portada cuadrada con título mínimo, precio
   y tamaño de grupo. Al tocar una celda se abre la ficha. Filtrable por **tamaño de
   grupo**, **tema** y **precio**. La pestaña *Vividas* muestra aftermovies en grid;
   *Stories* y *Menciones* quedan como placeholders.
2. **Mapa** — lugares (negocio verificado, público, secreto) como pines sobre un
   mapa oscuro estilizado; al tocar un pin se ven sus planes e histórico.
3. **Ficha de plan** — detalle con KPIs, anfitrión y señales de confianza,
   asistentes, lugar, herramientas de seguridad, reseñas y reserva (escrow para
   planes de pago; verificación de identidad para los gratuitos).

Los datos son de ejemplo (`data.js`) y coherentes con el producto. La marca
("planes") es **provisional**: el nombre sigue siendo una decisión abierta.
