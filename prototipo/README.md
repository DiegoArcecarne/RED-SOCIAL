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

**Primero, entrar.** El prototipo arranca en la bienvenida. Puedes:

- Crear una cuenta: registro con email o teléfono, código, verificación en dos pasos opcional, 18+ y consentimientos, perfil, intereses, ubicación y a quién seguir. Las cuentas nuevas empiezan vacías.
- Entrar con la cuenta de demostración (Marina, con todo el contenido de ejemplo): `marina@planes.app` · `planes123`, o el botón "Entrar con la cuenta de demostración".

Los códigos llegan como una notificación dentro de la pantalla: tócala para rellenarlo. Todo es simulado y se guarda en tu navegador; lo que hará el servidor de verdad está en [`../docs/cuentas-y-acceso.md`](../docs/cuentas-y-acceso.md).

**Instalarlo en el móvil (web instalable).** Hay que abrirlo desde una dirección web (https), no como archivo:

1. Activa GitHub Pages en el repositorio: *Settings ▸ Pages ▸ Deploy from a branch ▸ main / (root)*.
2. Abre en el móvil `https://<usuario>.github.io/<repositorio>/prototipo/standalone.html`.
3. En iPhone (Safari): Compartir ▸ *Añadir a pantalla de inicio*. En Android (Chrome): menú ⋮ ▸ *Instalar aplicación*.

Se abre a pantalla completa, con su icono, y funciona sin conexión una vez cargado (`manifest.webmanifest`, `sw.js` e iconos en esta carpeta).

**Compartir con vista previa.** Con el prototipo publicado así, los enlaces que compartes desde la app llevan a la web pública (`…/prototipo/web/plan/p2.html`, etc.): al pegarlos en WhatsApp o Telegram sale la vista previa con la foto, y *Abrir en la app* te lleva a esa pantalla. Lo que crees en la demo se comparte con una página genérica (`web/abrir.html`).

**Las fotos necesitan internet.** Se cargan desde Unsplash; sin conexión se ven los
degradados de respaldo y el prototipo sigue funcionando. Fotos de
[Unsplash](https://unsplash.com) bajo la licencia de Unsplash.

**Lo que crees se guarda en tu navegador.** Planes, publicaciones, grupos,
solicitudes y asistencias sobreviven a recargar la página. Cada cuenta guarda lo suyo por separado. Para volver al estado inicial (borra también las
cuentas creadas): *Perfil ▸ Ajustes ▸ Restablecer demo*.

## Qué incluye

Estética en modo oscuro tipo Instagram, minimalista, sin emojis (iconos SVG de trazo fino).

1. **Descubrir** — cuadrícula de 3 columnas con 12 planes, cada uno con foto
   temática y un icono discreto de gratis o de pago. Filtros por tema, tamaño de
   grupo, precio y fecha, **plegados** tras el botón *Filtros* (con el número de filtros
   puestos, que se quitan con un toque). En todas las pantallas, la cabecera y la barra de
   abajo **se esconden al bajar** y vuelven al subir, para dejar sitio al contenido.
2. **Vividas (el muro)** — lo que la gente publica, tanto de los planes como de su
   vida, con un filtro Todo / Planes / Vida: fotos, carruseles
   que se deslizan y vídeos (simulados con la portada en movimiento). Me gusta
   (también con doble toque), comentarios, guardar y enlace al plan. **Compartir**:
   enviar a quien sigues, añadir a tu story o compartir fuera (WhatsApp, Telegram,
   copiar enlace, descargar la imagen o la hoja del móvil), con la vista previa del
   enlace con la imagen de la publicación (Open Graph, como la imagen destacada de
   WordPress). Solo las publicaciones públicas se comparten fuera. Los **planes** se
   comparten igual desde su ficha (botón arriba a la derecha), con fecha, lugar y
   precio en la vista previa. Cada 5
   publicaciones aparece un plan que puedes hacer tú, y una tira "Ahora mismo" con
   directos y stories.
3. **Stories y directos** — pestaña propia con los directos en emisión y las
   stories del día. Visor de stories a pantalla completa (avanza solo; toca a los
   lados para navegar) y vista de directo con espectadores y chat en vivo. Desde
   *Crear ▸ Directo* puedes emitir el tuyo.
4. **Música** — fotos, carruseles, vídeos y stories con canción, como en Instagram.
   Toca la canción bajo el nombre o el altavoz sobre la imagen para escucharla; las stories
   suenan solas y se pueden silenciar. Al crear una publicación, *Música* abre un
   selector con buscador, filtros por ambiente y escucha previa. Las pistas son
   originales y ficticias: se generan en el navegador (sin archivos ni canciones
   reales), así que suenan también sin conexión. Sube el volumen del dispositivo.
5. **Mapa** — lugares (negocio verificado, público, secreto) con sus planes.
6. **Ficha de plan** — portada, cuenta atrás, anfitrión y señales de confianza,
   lugar, seguridad, reseñas y reserva (escrow en los de pago). Distingue plan
   **libre**, **apuntado** y **con aprobación**; muestra los asistentes reales y el
   control de **presencia pública o privada**.
7. **Perfil y Ajustes** — publicaciones (filtrables en Todo / Planes / Su vida) y
   Vividas en cuadrícula, **Valoraciones** de los planes a los que fue (públicas o
   privadas, en general o por plan, y quién ve cada tipo: todos, seguidores o amigos;
   amigos = os seguís los dos), botón Seguir / Seguir también / Siguiendo / Amigos,
   **Editar perfil** (nombre, usuario y descripción con
   límite de caracteres y contador; el usuario se valida al escribir), insignia de cuenta
   **profesional** y ajustes de privacidad.
8. **Crear** (botón central) — **plan** (con tipo de asistencia y grupo
   organizador), **publicación** (de un plan o de tu vida; foto, vídeo o carrusel, con música, ubicación, etiquetas,
   plan vinculado, texto alternativo, audiencia y opción de compartirla en stories),
   **grupo** (miembros con rol de admin o miembro) y **directo**.
9. **Grupos** — miembros y roles; los admins aprueban las solicitudes de los
   planes del grupo.
10. **Solicitudes** — el organizador acepta o rechaza cada una. Aceptar inscribe a
   la persona; su asistencia real se cuenta cuando llega.
11. **Mensajes** (icono de la barra superior, con los no leídos) — Chats, chats de
   cada plan (con punto de encuentro y "Confirmo que voy") y Solicitudes de gente que
   no conoces (aceptar, rechazar, bloquear o reportar con motivo; si hay peligro, el 112
   y cómo denunciar; sus fotos llegan difuminadas). Un solo
   mensaje de presentación a quien no te conoce; "Quién puede escribirte" en Ajustes;
   lo que compartes "en planes" llega como mensaje.
12. **Verificación y varios perfiles** — sin verificar se usa como red social (mirar,
   seguir, publicar); para ir a planes, organizarlos, su chat, ver quién va o escribir a
   desconocidos se pide verificar, con una explicación breve. Un perfil personal y
   perfiles profesionales vinculados (Crear ▸ Perfil profesional; cambia de perfil
   tocando tu @usuario). Pruébalo en *Ajustes ▸ Simular cuenta sin verificar*.
13. **Bucle de planes** — filtro *Cuándo* (hoy, mañana, finde, 7 días); crear un plan
   con **foto real** de la cámara o la galería; lista de espera en planes completos;
   **reconfirmación del día**; cancelar con su política de reembolso (con menos de
   24 h es tardía); **llegada con el QR del anfitrión** (escanear o escribir su código; se
   puede probar con dos móviles); llegadas a mano; editar o cancelar tu plan con aviso
   al grupo; fiabilidad en tu perfil; chat del plan al apuntarte; y **campana de
   notificaciones** con preferencias (y avisos del sistema si das permiso). Pruébalo con
   *Cata de vinos naturales* (mañana: reconfirma) o *Jazz íntimo en Clamores* (completo).
   Especificación del servidor: [`../docs/bucle-de-planes.md`](../docs/bucle-de-planes.md).
14. **Social** — publicar **fotos, carruseles (hasta 10) y vídeos (hasta 60 s) de verdad**
   desde la cámara o la galería (se guardan en tu navegador y siguen al recargar; se
   quita la ubicación GPS de las fotos); menú ⋯ para editar el pie o eliminar; borrar tus
   comentarios; Guardados y Etiquetadas en el perfil; listas de seguidores y seguidos;
   **perfiles privados** con solicitudes (prueba con *Irene C.*, o pon tu perfil privado
   en Ajustes); **buscador** de personas, planes y #temas (en Descubrir); página de cada
   tema; y la pestaña **Menciones** para aceptar o quitar menciones y etiquetas.
   Especificación del servidor: [`../docs/social.md`](../docs/social.md).
15. **Confianza y seguridad** — **filtros automáticos**: un insulto pregunta "¿Seguro que
   quieres publicarlo?", tu teléfono a un desconocido avisa, y una amenaza o spam se
   retiene (solo lo ves tú, "En revisión"). **Reportar** publicaciones, comentarios,
   perfiles (⋯), conversaciones y planes; *Tus reportes* con su estado; *Cuentas
   bloqueadas*. **Panel de moderación** (Ajustes ▸ Prototipo): cola por gravedad,
   acciones (retirar, aviso, suspender, cerrar, quitar organizar…), alertas SOS,
   apelaciones e historial. *Estado de tu cuenta* con los motivos de cada decisión y
   **Apelar** (prueba con el comentario retirado de Marina). **Contactos de confianza** y
   **botón SOS** en la ficha y el chat de cada plan. **Tus datos**: descargar una copia
   (JSON), consentimientos y eliminar la cuenta.
   Especificación del servidor: [`../docs/confianza-y-seguridad.md`](../docs/confianza-y-seguridad.md).
16. **Compartir** — **web pública** en [`web/`](web/) (una página por plan, publicación
   pública y perfil, con las etiquetas que generan la vista previa con imagen en WhatsApp o
   Telegram); con el prototipo publicado, los enlaces que compartes llevan a esas páginas, y
   su botón *Abrir en la app* va a la misma pantalla. **Compartir perfiles**, **código QR**,
   **Compartir en otras apps** (el menú del móvil) e *Imagen* para stories. Un enlace abierto
   sin sesión te lleva a él al entrar. Con la web instalada en Android, *planes* sale en el
   menú de compartir de la galería (crea una publicación) y captura los enlaces.
   Especificación: [`../docs/compartir.md`](../docs/compartir.md).
17. **Pagos** (simulados, sin cobros reales) — *Reservar · 12 €* abre el pago: política de
   cancelación, dinero retenido hasta el plan, Apple Pay o Google Pay, tarjeta guardada o
   nueva (prueba 4242 4242 4242 4242; 4000 0027 6000 3184 pide confirmar en el banco;
   4000 0000 0000 0002 es rechazada). Reembolsos según la política (100 % si cancela el
   anfitrión); en planes con aprobación o lista de espera, 24 h para pagar. *Ajustes ▸ Pagos
   y reembolsos*: tarjetas, pagos con su estado, recibos y "Tengo un problema" (va al panel
   de moderación). *Ajustes ▸ Cobros*: alta del anfitrión (DNI/NIE e IBAN), lo retenido, en
   camino y pagado, y la factura mensual de la comisión del 15 %.
   Especificación: [`../docs/pagos.md`](../docs/pagos.md).
18. **Quién está en el plan** — al registrar tu llegada eliges quién te ve (todos los del
   plan, amigos o nadie) y si vas solo o en grupo. En la ficha, *Aquí ahora*: chinchetas en
   el punto del plan con enlace a cada perfil, *Yo también* (un saludo con una chincheta
   animada) y *Mensaje*; en el mapa, tu chincheta y cuántos estáis. Nunca la ubicación
   exacta y solo entre quienes están en el plan. Pruébalo en *Atardecer en el Templo de
   Debod*: *Registrar mi llegada* (el código está en "¿Pruebas con un solo móvil?").

**Privacidad en planes pequeños:** por debajo de 10 asistentes solo se cuentan los
visibles, para que nadie pueda deducir quién fue en privado.

Los datos son de ejemplo (`data.js`). La marca ("planes") es provisional y las
condiciones de las cuentas profesionales están pendientes de decidir.

## Para desarrollar

Edita **solo las fuentes** (`index.html`, `styles.css`, `data.js`, `cuentas.js`, `planes.js`, `social.js`, `confianza.js`, `pagos.js`, `app.js`).
`standalone.html` y `web/` se generan; no los edites a mano. Desde la raíz del repositorio:

```bash
node scripts/build-standalone.js           # regenera standalone.html
node scripts/build-standalone.js --check   # comprueba que está al día
node scripts/build-web.js                  # regenera la web pública (web/) a partir de data.js
node scripts/smoke-test.js                 # prueba todas las vistas y flujos
```

La integración continua (`.github/workflows/prototipo.yml`) comprueba en cada pull request la sintaxis,
que `standalone.html` y `web/` están al día, y la prueba de humo.
