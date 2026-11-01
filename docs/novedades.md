# Novedades del plan

Especificación de la sección **Novedades** de cada plan: un registro de los cambios y los
avisos del plan, y las notificaciones que reciben quienes se han apuntado. El prototipo lo
simula en `prototipo/planes.js` (ficha del plan); aquí se describe lo que tiene que hacer el
servidor.

## 1. Qué es

Una lista, de lo más reciente a lo más antiguo, en la ficha del plan, justo debajo de su
descripción. Cada novedad tiene un tipo, un texto, quién la publicó y cuándo. Se ven las 3
últimas y *Ver todas*. Lo que no habías visto desde tu última visita lleva la marca *Nuevo*,
y el título de la sección dice cuántas hay sin ver.

| Tipo | Cuándo se crea | Importante |
|---|---|---|
| Cambio de fecha u hora | Al editar el plan: queda el antes y el después, y el motivo si se escribe | Sí |
| Cambio de lugar | Al editar el plan (o el punto de encuentro) | Sí |
| Plan cancelado | Lo cancela el anfitrión o el equipo | Sí |
| Lugar desvelado | En los planes secretos, 2 h antes | Sí |
| Aviso | El anfitrión publica algo ("Traed linterna"). Máximo 280 caracteres | No |
| Plazas | Se amplía el aforo o quedan las últimas plazas | No |
| Detalles actualizados | Cambia el título o la descripción (sin notificación) | No |

Las novedades no se editan ni se borran: si algo cambia otra vez, se publica una nueva. El
equipo puede retirar una por moderación; en su lugar queda "Retirada por incumplir las
normas".

## 2. Quién recibe la notificación

- **Quien va al plan** (inscripción confirmada o aprobada), con la notificación "Novedades
  de tus planes" (`cambio`). Al tocarla se abre la ficha del plan.
- Los **cambios importantes** (fecha, hora, lugar, cancelación, desvelo) llegan además a
  quien está en la **lista de espera**, tiene una **solicitud** pendiente o una plaza **por
  confirmar** desde una chispa, y **siempre**: aunque haya desactivado las novedades en sus
  preferencias y aunque sea de noche (no respetan el horario de silencio si el plan es en
  las próximas 24 h).
- Los **avisos** respetan las preferencias y el horario de silencio.
- Nunca a quien lo publica. En los planes libres (sin apuntados) no hay a quién avisar: la
  novedad queda en la ficha.
- Todas las novedades se publican también como mensaje del sistema en el **chat del plan**.
- Si se cambia la fecha o la hora, la inscripción vuelve a pedir **reconfirmación** y la
  **agenda** (y el calendario suscrito) se actualiza. Los **recordatorios** del plan (el día
  antes, 2 h antes y 15 min antes; bucle-de-planes §Notificaciones) se reprograman con la
  nueva hora.

Varias novedades del mismo plan en 10 minutos se agrupan en una sola notificación ("3
novedades en Cata de vinos naturales").

## 3. Moderación

Los avisos pasan por los mismos filtros automáticos que el resto del contenido
(confianza-y-seguridad §2): una amenaza, odio o spam no se publica; un insulto o datos de
contacto piden confirmación antes de publicar. Un anfitrión que abusa de los avisos (más de
5 al día en un plan) recibe un aviso; las novedades se pueden reportar desde la ficha.

## 4. Datos y API

`NOVEDAD_PLAN`: id, plan_id, tipo, texto, antes y después (en cambios), autor_id (anfitrión,
admin del grupo o equipo), importante, estado (publicada o retirada), fecha. Y por usuario y
plan, la fecha de la última visita para calcular lo no visto (`VISTO_NOVEDADES`).

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | `/planes/{id}/novedades?antes=` | Lista paginada, con `nuevo` según tu última visita |
| `POST` | `/planes/{id}/novedades` | El anfitrión publica un aviso (`texto`) |
| `POST` | `/planes/{id}/novedades/visto` | Marca como vistas al abrir la ficha |
| `PATCH` | `/planes/{id}` | Editar el plan: si cambia fecha, hora o lugar, el servidor crea la novedad y avisa |

Las notificaciones se envían desde una cola (las mismas de bucle-de-planes §Notificaciones),
nunca desde la petición del anfitrión, para que un plan con 80 apuntados no retrase la
respuesta.
