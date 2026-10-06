# Prototipo visual — App de planes

Prototipo navegable y estático (HTML, CSS y JavaScript sin frameworks) de la app
definida en [`../PRODUCTO.md`](../PRODUCTO.md). Sirve para *ver la idea funcionando*
y para enseñarla; no es código de producción.

## Cómo verlo

- **Lo más simple:** abre `standalone.html` en el navegador (doble clic). Lleva HTML,
  CSS, datos y JavaScript en un único archivo y funciona sin servidor.
- **Multi-archivo:** `index.html` (usa `styles.css`, `data.js` y `app.js`).
- **Con servidor local:** `python3 -m http.server 8000` desde esta carpeta y abre
  `http://localhost:8000`.

El diseño es para móvil: activa la vista móvil de las DevTools (`F12` ▸ icono de móvil).

**Las fotos necesitan internet.** Se cargan desde Unsplash; sin conexión se ven los
degradados de respaldo y el prototipo sigue funcionando. Fotos de
[Unsplash](https://unsplash.com) bajo la licencia de Unsplash.

**Lo que crees se guarda en tu navegador.** Planes, publicaciones, grupos,
solicitudes y asistencias sobreviven a recargar la página. Para volver al estado
inicial: *Perfil ▸ Ajustes ▸ Restablecer demo*.

## Qué incluye

Estética en modo oscuro tipo Instagram, minimalista, sin emojis (iconos SVG de trazo fino).

1. **Descubrir** — cuadrícula de 3 columnas con 12 planes, cada uno con foto
   temática y un icono discreto de gratis o de pago. Filtros por tema, tamaño de
   grupo y precio. Pestañas *Vividas* (aftermovies), *Stories* y *Menciones*
   (estas dos, de muestra).
2. **Mapa** — lugares (negocio verificado, público, secreto) con sus planes.
3. **Ficha de plan** — portada, cuenta atrás, anfitrión y señales de confianza,
   lugar, seguridad, reseñas y reserva (escrow en los de pago). Distingue plan
   **libre**, **apuntado** y **con aprobación**; muestra los asistentes reales y el
   control de **presencia pública o privada**.
4. **Perfil y Ajustes** — publicaciones y Vividas en cuadrícula, insignia de cuenta
   **profesional** y ajustes de privacidad.
5. **Crear** (botón central) — **plan** (incluido el tipo de asistencia y el grupo
   organizador), **publicación** (foto, vídeo o carrusel, con ubicación, etiquetas,
   plan vinculado, texto alternativo, audiencia y opciones) y **grupo** (miembros
   con rol de admin o miembro).
6. **Grupos** — miembros y roles; los admins aprueban las solicitudes de los
   planes del grupo.
7. **Solicitudes** — el organizador acepta o rechaza cada una. Aceptar inscribe a
   la persona; su asistencia real se cuenta cuando llega.

**Privacidad en planes pequeños:** por debajo de 10 asistentes solo se cuentan los
visibles, para que nadie pueda deducir quién fue en privado.

Los datos son de ejemplo (`data.js`). La marca ("planes") es provisional y las
condiciones de las cuentas profesionales están pendientes de decidir.

## Para desarrollar

Edita **solo las fuentes** (`index.html`, `styles.css`, `data.js`, `app.js`).
`standalone.html` se genera; no lo edites a mano. Desde la raíz del repositorio:

```bash
node scripts/build-standalone.js           # regenera standalone.html
node scripts/build-standalone.js --check   # comprueba que está al día
node scripts/smoke-test.js                 # prueba todas las vistas y flujos
```

La integración continua (`.github/workflows/prototipo.yml`) ejecuta las tres cosas
en cada pull request.
