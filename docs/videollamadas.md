# Planes por videollamada

Especificación de los planes que se hacen por videollamada: una actividad, un debate, una
clase o lo que se le ocurra a quien lo organiza, sin lugar. El prototipo lo simula en
`prototipo/videollamadas.js` (ficha del plan y sala `#/sala/<id>`); aquí se describe lo que
tiene que hacer el servidor.

## 1. Opciones al crear el plan

En *Crear plan ▸ Dónde*: **En persona** o **Videollamada**. Con videollamada desaparecen el
lugar, el tamaño de grupo y el QR de llegada, y aparecen:

| Opción | Valores | Qué significa |
|---|---|---|
| Quién la ve | **Pública** / **Privada** | Pública: sale en Descubrir y cualquiera puede verla en directo aunque no participe. Privada: no sale en Descubrir, ni en la búsqueda ni en la web pública; solo entra quien está apuntado (se invita con el enlace) |
| Comentarios de quien mira | **Con** / **Sin** (solo en públicas) | Quien mira puede escribir en directo. El anfitrión puede cerrarlos durante la llamada |
| Quién se une a la llamada | **Cualquiera** (hasta el límite) / **Con mi aprobación** | Unirse es entrar con cámara y micro. Con aprobación, cada persona pide entrar y decide el anfitrión |
| Límite de personas | 2 a 50 (contando al anfitrión) | Quien solo mira no cuenta |
| Duración | 30, 45, 60, 90 o 120 min | Para la agenda y para cerrar la sala |

Las combinaciones cubren los casos pedidos: privada; pública con comentarios; pública sin
comentarios; unirse libre con límite; unirse con aprobación del anfitrión. Todo lo demás del
plan sigue igual: tema, fecha, precio (también puede ser de pago), grupo organizador,
novedades, agenda y recordatorios.

Se reutiliza la inscripción de los planes: apuntarse a la videollamada es reservar sitio
en la llamada (`tipo_inscripcion = apuntado`, plazas = límite; `aprobacion = manual` si es con
aprobación). Si se llena, lista de espera.

## 2. La sala

- Se abre **10 minutos antes** y se cierra al acabar la duración (con 15 min de cortesía) o
  cuando el anfitrión pulsa *Finalizar para todos*.
- **Participantes** (los apuntados y el anfitrión): micro, cámara, levantar la mano y salir.
  Hay que tener la identidad verificada, como para ir a cualquier plan.
- **Espectadores** (solo en públicas): ven y oyen, comentan si hay comentarios, y pueden
  *Unirse* (libre, si hay sitio) o *Pedir unirse* (con aprobación) sin salir de la sala.
  Para mirar basta con tener cuenta.
- **El anfitrión gestiona**: deja entrar o rechaza a quien lo pide, silencia, saca de la
  llamada (pasa a espectador y no puede volver a pedir), abre o cierra los comentarios y
  finaliza para todos. En planes de un grupo, sus admins también.
- **Asistencia**: 10 minutos dentro de la llamada cuentan como asistencia verificada (el
  equivalente al QR), con la misma fiabilidad e historial que un plan en persona.
- **No se graba.** Si más adelante se permite grabar, hará falta el consentimiento explícito
  de cada participante y un aviso visible en la sala.

## 3. Proveedor de vídeo

Recomendación: **LiveKit** (Cloud para empezar; se puede alojar después) o, como alternativa,
Daily o Agora. Criterios: SFU con WebRTC, SDK para web, iOS y Android, roles por token,
emisión a muchos espectadores y precio por minuto.

- **Tokens**: el servidor de la app emite un token por persona y sala con su rol:
  `participante` (puede publicar audio y vídeo), `espectador` (solo suscribirse) o
  `anfitrion` (además, permisos de administración de la sala). Caducan a los 10 min y se
  renuevan mientras la persona tenga derecho a estar.
- **Espectadores**: hasta unos cientos, en la misma sala como suscriptores; para audiencias
  mayores, emisión por HLS de baja latencia desde el proveedor.
- **Comentarios**: por el canal de datos de la sala o por el websocket propio de la app, pero
  siempre guardados y filtrados en el servidor (los mismos filtros que el resto del contenido).
- **Coste orientativo**: se paga por minuto de participante y de espectador. Un debate de 8
  personas durante 60 min con 40 espectadores ronda unos pocos euros; conviene limitar la
  duración y el número de espectadores en el piloto.

## 4. Privacidad y seguridad

- Las **privadas** no tienen página pública ni vista previa con datos del plan: su enlace
  abre la app (o una página genérica sin título ni anfitrión) y solo deja entrar a quien está
  apuntado. Tampoco se indexan.
- En las públicas, la sala avisa de que cualquiera puede estar mirando. Se recomienda no
  compartir datos personales en directo.
- **Reportar** la videollamada (y a cualquier participante) desde la sala; moderación puede
  cerrar una sala en directo y sancionar como en el resto de la app.
- Los comentarios que el filtro retiene no se publican; los insultos piden confirmación.

## 5. Datos y API

- `PLAN.modalidad` (`presencial | videollamada`) y, en videollamadas, `CONFIG_VIDEOLLAMADA`:
  visibilidad, comentarios, modo de unirse, límite, duración, id de la sala en el proveedor,
  estado (`programada | abierta | en_directo | terminada`).
- `PARTICIPACION_LLAMADA`: persona, rol, entrada y salida (para la asistencia de 10 min),
  silenciado o expulsado.
- `COMENTARIO_LLAMADA`: persona, texto (máx. 200), estado, fecha.

| Método | Ruta | Para qué |
|---|---|---|
| `POST` | `/planes/{id}/sala/token` | Token para entrar con tu rol (si la sala está abierta) |
| `POST` | `/planes/{id}/sala/solicitudes` | Pedir unirse desde la sala |
| `POST` | `/planes/{id}/sala/solicitudes/{persona}` | El anfitrión acepta o rechaza |
| `POST` | `/planes/{id}/sala/participantes/{persona}` | Silenciar o sacar |
| `PATCH` | `/planes/{id}/sala` | Abrir o cerrar comentarios, finalizar |
| `GET` / `POST` | `/planes/{id}/sala/comentarios` | Leer y escribir comentarios |

Los eventos del proveedor (entrada, salida, fin de sala) llegan por webhook y alimentan la
asistencia y las métricas (asistencias verificadas por videollamada, aparte de las presenciales).

## 6. Qué simula el prototipo

| En el prototipo | En la app real |
|---|---|
| Las demás personas son fichas con su inicial; quién habla va rotando | Vídeo y audio reales por el proveedor |
| Tu cámara se enciende si el navegador lo permite (sin audio) | Audio y vídeo, con selección de dispositivo |
| Espectadores y comentarios de otros, simulados | Reales, con los filtros en el servidor |
| *Demo: pasan 10 minutos* para la asistencia | Tiempo real dentro de la sala |
