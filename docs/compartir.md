# Compartir: especificación

Este documento cubre:

- La web pública de los enlaces, con las etiquetas que generan la vista previa con imagen.
- Los enlaces que abren la app si está instalada: *universal links* en iOS y *App Links* en Android.
- El menú de compartir nativo del móvil, para enviar desde planes y para recibir en planes.

El prototipo lo tiene todo **funcionando a escala de demo**:

- `prototipo/web/` es la web pública, generada con `scripts/build-web.js` a partir de los datos de ejemplo.
- La hoja de compartir está en `app.js`.
- Recibir lo que te comparten está en `social.js` y `sw.js`.

Este documento dice qué tiene que hacer el **servidor** y la **app nativa** en la versión real.

Relacionado: [`PRODUCTO.md`](../PRODUCTO.md) (Compartir publicaciones y planes),
[`social.md`](social.md) (privacidad de publicaciones y perfiles) y
[`modelo-datos.md`](modelo-datos.md) (`COMPARTIDO`).

## Qué está simulado en el prototipo

| En el prototipo | En la app real |
|---|---|
| Una página HTML estática por plan, publicación pública y perfil de los **datos de ejemplo** | El servidor genera la página de cualquier contenido al pedirla (SSR) y la guarda en la CDN |
| Lo creado en la demo se comparte con `abrir.html#/…`, una página genérica sin vista previa propia | Todo tiene su página y su vista previa |
| `og:image` es la foto recortada a 1200×630 (Unsplash) | Imagen 1200×630 generada en el servidor con la foto, el título y la marca, como la que ya dibuja la app |
| Todas las páginas llevan `noindex` (son datos inventados) | Se indexa según las reglas de abajo |
| Sin `og:url` ni `canonical` (la dirección depende de dónde se publique) | `og:url` y `canonical` con `https://planes.app/…` |
| "Abrir en la app" lleva a `standalone.html#/plan/p2` | El propio enlace abre la app (universal links / App Links) |
| Con la web instalada en Android, el enlace se abre dentro de ella (`handle_links`) y salta a la pantalla | Lo hace el sistema con la asociación de dominio |
| `.well-known/` con valores provisionales (Team ID, paquete, huella) | Valores reales, servidos en la raíz de `planes.app` |
| Recibir desde el menú de compartir: solo Android con la web instalada (`share_target`) | Extensión de compartir en iOS e *intent filter* en Android |

Para probarlo en el móvil:

1. Publica el repositorio con GitHub Pages (ver `prototipo/README.md`).
2. Comparte un plan desde la app. El enlace lleva a `…/prototipo/web/plan/p2.html`, y WhatsApp o Telegram enseñan la vista previa con la foto.

## Direcciones

Las mismas en la web y en la app, para que un enlace siempre lleve a la misma pantalla:

| Contenido | Dirección | Pantalla de la app |
|---|---|---|
| Plan | `https://planes.app/plan/{id}` | Ficha del plan |
| Publicación | `https://planes.app/p/{id}` | La publicación |
| Perfil | `https://planes.app/u/{usuario}` | El perfil |
| Tema | `https://planes.app/tema/{tag}` | La página del tema |
| Lugar | `https://planes.app/lugar/{id}` | El lugar en el mapa |

- Ids cortos y no consecutivos (por ejemplo, 10 caracteres base62), para que no se puedan recorrer.
- Si alguien cambia su nombre de usuario, la dirección antigua redirige (301) durante 90 días. Después queda libre.
- Se añaden parámetros de origen al compartir (`?c=wa` para WhatsApp, `?c=tg` para Telegram, `?c=qr`, `?c=sys`), sin datos de la persona. Sirven para medir el crecimiento.

## Web pública

Una página ligera y rápida (menos de 50 KB sin la imagen, sin JavaScript necesario), con
el contenido básico y un botón **Abrir en la app**.

| | Plan | Publicación | Perfil |
|---|---|---|---|
| `og:type` | `website` | `article` | `profile` |
| `og:title` | Título del plan | "Autor en planes · Plan" | "Nombre (@usuario)" |
| `og:description` | "Gratis · Mediano · Outdoor · Templo de Debod · Madrid" | Pie recortado (160) | Descripción, o "Cuenta privada" |
| `og:image` | Portada con título, fecha y lugar | Primera foto con el pie | Primera foto pública, o tarjeta con el nombre |
| En la página | Fecha, lugar, precio, anfitrión, resumen | Foto, pie, me gusta, plan | Cabecera, contadores y cuadrícula |

Etiquetas en todas las páginas:

- Open Graph: `og:site_name`, `og:locale` (`es_ES`), `og:url`, `og:image:width`, `og:image:height` y `og:image:alt`.
- Twitter/X: `twitter:card` = `summary_large_image`.
- `<link rel="canonical">` y `theme-color`.

En los planes se añade también `schema.org/Event` (JSON-LD) con la fecha, el lugar, el precio y el organizador, para que Google lo muestre como evento.

**Imagen de vista previa (`og:image`)**:

- Formato:
  - JPEG de 1200×630;
  - **menos de 300 KB**, para que WhatsApp la muestre siempre;
  - servida por HTTPS desde la CDN, en una dirección estable que cambia si cambia el contenido, por ejemplo `/og/plan/{id}.jpg?v={hash}`.
- La genera el servidor con la misma composición que la app (foto, degradado, texto y marca), por ejemplo con Satori o Resvg, o con un servicio de imágenes. Se cachea y se regenera al editar el título, la foto, la fecha o el lugar.
- Las vistas previas que ya mandó WhatsApp no se actualizan: es una caché suya.

**Privacidad** (las mismas reglas que en la app; el servidor las aplica al generar la página):

- **Planes**:
  - Si son secretos, salen como "Zona aproximada".
  - Los íntimos fuera de un negocio, también: el sitio exacto solo lo ven las personas verificadas, en la app.
  - Nunca se muestra quién va.
  - Un plan cancelado dice que se ha cancelado.
- **Publicaciones**:
  - Solo tienen página las públicas de perfiles públicos.
  - Las que son para seguidores o amigos, las de cuentas privadas, las borradas, las retiradas por moderación y las que están en revisión dan una página genérica ("Esta publicación no está disponible"), sin foto ni texto, con código 404 o 410.
- **Perfiles privados**: solo la cabecera (nombre, foto, descripción y contadores). Ni publicaciones ni planes.
- **Bloqueos**: la web no sabe quién la mira, así que la protección real está en la app, que comprueba los bloqueos al abrir.
- **Cuentas suspendidas o cerradas**: página "no disponible".

**Indexación** (propuesta):

| Contenido | Se indexa |
|---|---|
| Planes públicos, lugares y perfiles profesionales | Sí, con sitemap |
| Perfiles personales | No (`noindex`) por defecto; propuesta de un ajuste para permitirlo |
| Publicaciones | No: se comparten, pero no salen en Google |

**Rendimiento y abuso**:

- Las páginas van a la CDN con caché corta (5 minutos) y se invalidan al editar o borrar.
- Los rastreadores (WhatsApp, facebookexternalhit, Twitterbot, TelegramBot, Slackbot…) reciben lo mismo que una persona.
- Límite de peticiones por IP en `/og/`.

## Enlaces que abren la app

**iOS (universal links)**:

- Se sirve `https://planes.app/.well-known/apple-app-site-association`, con estas condiciones:
  - JSON y `Content-Type: application/json`;
  - sin redirecciones;
  - sin extensión en el nombre del archivo.

  Hay un modelo en `prototipo/web/.well-known/`.
- La app declara `applinks:planes.app` en *Associated Domains*.
- Apple descarga el archivo a través de su CDN al instalar o actualizar la app, así que los cambios tardan en llegar.
- Rutas: `/plan/*`, `/p/*`, `/u/*`, `/tema/*` y `/lugar/*`. Lo demás (ayuda, legal) se abre en el navegador.

**Android (App Links)**:

- Se sirve `https://planes.app/.well-known/assetlinks.json` con el paquete y las huellas SHA-256 de los certificados de firma: el de subida y el de Google Play App Signing.
- La app declara los `intent-filter` con `android:autoVerify="true"` para las mismas rutas.
- En Android 12 y posteriores, si la verificación falla, el enlace se abre en el navegador.

**Comportamiento**:

- **Con la app instalada**: el enlace abre directamente la pantalla.
- **Sin la app**: se abre la web, con "Abrir en la app" (que lleva a la tienda) y, en iOS, el *Smart App Banner*: `<meta name="apple-itunes-app" content="app-id=…, app-argument=https://planes.app/plan/{id}">`.
- **Sin sesión en la app**: se recuerda el destino y, al entrar o terminar el registro, se lleva a él. En la bienvenida se explica: "Te han compartido el plan «…». Entra o crea tu cuenta y te llevamos ahí". El prototipo ya lo hace.
- **Tras instalar** (*deferred deep link*):
  - En Android, el *Install Referrer* de Google Play lleva el destino.
  - En iOS no hay un mecanismo fiable sin terceros. Las opciones son Branch, AppsFlyer o Adjust; Firebase Dynamic Links se cerró en 2025. Propuesta para el piloto: sin terceros, y que la bienvenida muestre los planes compartidos recientes desde esa IP, solo si la persona lo confirma.
- **Si el contenido ya no existe o no tienes permiso**: la app enseña "Ya no está disponible" o "Es de una cuenta privada: síguela para verla". Nunca muestra un error en blanco.
- **Seguridad**: la app solo acepta rutas conocidas. Los parámetros nunca ejecutan acciones (apuntarse, seguir, pagar) sin que la persona lo confirme.

## Menú de compartir nativo

### Enviar desde planes

La hoja de compartir de planes tiene dos partes:

- **Dentro de planes**: enviar a personas que sigues (por mensaje) y añadir a tu story.
- **Fuera**: la vista previa del enlace, el botón **Compartir en otras apps** (el menú del sistema) y accesos directos a WhatsApp, Telegram, Copiar enlace, Imagen y Código QR.

Detalles:

- El menú del sistema comparte **título, texto y enlace**:
  - iOS: `UIActivityViewController`;
  - Android: `Intent.ACTION_SEND` con `createChooser`;
  - React Native: `Share`;
  - web: `navigator.share`.

  Se comparte el enlace y no la imagen porque así WhatsApp, iMessage o Telegram generan la vista previa con la web pública.
- Se abre al tocar, sin esperar a nada. Los navegadores solo dejan abrirlo justo después de un toque.
- **Imagen**: la imagen 1200×630 como archivo, para Instagram Stories u otras apps de fotos. Con el menú nativo si deja compartir archivos; si no, se descarga.
  - Fase 2: botón "Instagram Stories" directo, con la imagen como pegatina. Necesita un identificador de app de Meta.
- **Código QR** del enlace, para enseñarlo en persona en un plan o en un local. Los negocios pueden imprimirlo.
- **Perfiles**: tienen el mismo menú (desde "Compartir perfil" en el tuyo y desde ⋯ en los demás). Los privados solo enseñan la cabecera.

### Recibir en planes

"planes" sale en el menú de compartir de la galería, la cámara o el navegador.

- **Fotos o un vídeo**: se abre *Nueva publicación* con ellos ya añadidos, hasta 10 fotos o un vídeo, con las mismas reglas de tamaño y duración que al subir.
- **Un enlace de planes**: abre esa pantalla.
- **Otro texto o enlace**: va al pie de una publicación nueva.
- **Cómo se hace**:
  - iOS: *Share Extension*. Los archivos se pasan a la app por un *App Group*.
  - Android: `intent-filter` para `ACTION_SEND` y `ACTION_SEND_MULTIPLE` con `image/*`, `video/*` y `text/plain`.
  - Prototipo: `share_target` del manifest y el service worker, que guarda lo recibido y abre `#/recibido`. Solo funciona en Android con la web instalada.

## Medición

Cada vez que alguien comparte se guarda un `COMPARTIDO` con:

- el contenido (plan, publicación o perfil);
- el destino: chat, story, sistema, whatsapp, telegram, copiar, imagen o qr;
- los destinatarios, si es dentro de la app.

Al abrir un enlace con `?c=…` se cuenta la visita y, si acaba en registro o en apuntarse a
un plan, se atribuye a quien compartió. Métricas:

- enlaces abiertos por cada compartido;
- registros por cada 100 visitas;
- apuntados que llegan por un enlace;
- reparto por canal.

## API (borrador)

```
GET  /plan/:id · /p/:id · /u/:usuario · /tema/:tag · /lugar/:id   (HTML con Open Graph; SSR + CDN)
GET  /og/:tipo/:id.jpg?v=                                          (imagen 1200×630)
GET  /.well-known/apple-app-site-association · /.well-known/assetlinks.json
GET  /sitemap.xml                                                  (planes, lugares, perfiles profesionales)
POST /compartidos        { tipo: plan|publicacion|perfil, id, destino, destinatarios? }
GET  /enlaces/resolver?url=   → { ruta, disponible: bool, motivo? }   (lo usa la app al abrir un enlace)
```
