# Agenda — calendario de tus planes

Especificación de la agenda: un calendario con los planes a los que te has apuntado,
**aparte de las notificaciones y accesible desde ellas**, con vistas de **día, semana, mes
y año**. El prototipo la simula en `prototipo/agenda.js` (ruta `#/agenda`); aquí se describe
lo que tiene que hacer el servidor.

## 1. Dónde está

- **Notificaciones**: arriba, la tarjeta *Tu agenda* (el próximo plan y cuántos hay en los
  próximos 7 días) y el icono de calendario en la barra. Las notificaciones avisan de lo que
  pasa; la agenda es donde se consulta lo que tienes.
- **Ficha del plan**, cuando vas o lo organizas: *Ver en tu agenda* (abre ese día) y
  *Añadir al calendario del móvil*.
- Enlace directo: `#/agenda/<dia|semana|mes|ano>/<AAAA-MM-DD>` (lo puede usar una
  notificación para abrir un día concreto).

## 2. Qué entra

| Entrada | Cuándo | Cómo se ve |
|---|---|---|
| Vas | Apuntado (y pagado, si es de pago) | Firme (relleno) |
| Organizas | Eres el anfitrión | Firme |
| Falta pagar | Te aceptaron y tienes 24 h para pagar | A medias (borde discontinuo) |
| Solicitud enviada | El plan es con aprobación y está pendiente | A medias |
| Por confirmar | Una chispa se hizo plan y tienes 24 h para decir "Sí, voy" | A medias |
| Lista de espera | Estás en la lista | A medias |
| Chispa | Chispa con día concreto que lanzaste o a la que dijiste "Me apunto" | A medias |
| Fuiste | Asistencia verificada | Apagado |
| Cancelado | Lo canceló el anfitrión o cancelaste tú | Tachado |

Cada entrada lleva además su etiqueta en texto: el estilo nunca es la única pista. Los
planes que solo has visto o guardado no entran.

- **Duración**: la que indique el plan (`PLAN.duracion_min`); si no la indica, 2 horas.
- **Lugar**: el del plan o el punto de encuentro. En planes secretos, "Lugar por desvelar"
  hasta que se desvela.
- **Zona horaria**: se guarda en UTC y se muestra en la del dispositivo. Un plan en otra
  ciudad muestra su hora local con la zona si no coincide con la tuya.

## 3. Vistas

- **Día**: franja horaria (de 8:00 a 24:00, ampliada si hay algo antes) con cada plan en su
  hora y su duración; si coinciden, en columnas. Línea de "ahora" en el día de hoy.
- **Semana** (por defecto): de lunes a domingo, cada día con sus planes en fila (hora,
  título, lugar, estado) o "Libre". Tocar el día abre su vista de día.
- **Mes**: cuadrícula con un punto por plan (hasta 3, con el estilo de su tipo). Al tocar un
  día, sus planes aparecen debajo.
- **Año**: los doce meses en pequeño, con los días que tienen plan marcados y el número de
  planes de cada mes. Tocar un mes abre su vista de mes.
- Siempre: anterior y siguiente, *Hoy* y la leyenda de estilos.

## 4. Llevarla al calendario del móvil

- **Descargar (.ics)**: un plan concreto, desde su ficha, o todos tus próximos planes
  confirmados (vas y organizas). Formato iCalendar (RFC 5545): `UID` estable por plan, fechas
  en UTC, `STATUS` (confirmado, provisional o cancelado), enlace al plan y un aviso 2 h antes.
- **Suscripción** (se actualiza sola): dirección personal
  `webcal://planes.app/agenda/<token>.ics`.
  - El servidor la genera al vuelo con lo que hay en tu agenda: los próximos 6 meses y los
    últimos 30 días. Cabeceras `Cache-Control: max-age=900` y `ETag`.
  - Si un plan cambia de hora o lugar, el evento cambia (mismo `UID`, `SEQUENCE` + 1). Si se
    cancela, queda con `STATUS:CANCELLED` 7 días y luego desaparece.
  - **Privacidad**: el token es largo y aleatorio (128 bits), no lleva el id del usuario y se
    puede **revocar** (la dirección anterior deja de funcionar al momento). La dirección no
    incluye los planes secretos sin desvelar, ni los nombres de otros asistentes ni el chat.
    Se limita a 60 peticiones por hora por token.
  - Al cerrar la cuenta o al suspenderla, el token se revoca.

## 5. Publicidad en la agenda

Como mucho un anuncio por vista (día, semana o día elegido del mes), con "Patrocinado", quién paga y "Por qué lo ves": un plan promocionado en su día o un anuncio de marca en tu primer día libre. Nunca en la vista de año, en notificaciones ni en recordatorios. Se elige solo con tus temas, tus días libres y tu ciudad: ver [`publicidad.md`](publicidad.md).

## 6. API

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | `/me/agenda?desde=&hasta=` | Entradas entre dos fechas (máx. 400 días), ya con su tipo |
| `GET` | `/me/agenda/proximo` | La tarjeta de notificaciones: próximo plan y número en 7 días |
| `GET` | `/planes/{id}.ics` | El .ics de un plan (si vas o lo organizas) |
| `POST` | `/me/agenda/token` | Crea o renueva la dirección de suscripción (revoca la anterior) |
| `GET` | `/agenda/{token}.ics` | La suscripción, sin sesión |

La agenda no tiene tabla propia: se calcula a partir de las inscripciones, solicitudes,
pagos, listas de espera, invitaciones de chispas y asistencias. Solo se guarda el token
(`SUSCRIPCION_CALENDARIO`).

## 7. Qué simula el prototipo

| En el prototipo | En la app real |
|---|---|
| Historial de ejemplo (`AGENDA_HISTORY` en `data.js`) | Asistencias y cancelaciones reales |
| El .ics se descarga; la suscripción muestra la dirección, pero no hay servidor que la sirva | Servidor que genera el .ics al vuelo |
| Duración fija de 2 h | `duracion_min` al crear el plan |
