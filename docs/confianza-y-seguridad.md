# Confianza y seguridad: especificación

Bloqueos y reportes, filtros automáticos de contenido, panel interno de moderación con
apelaciones, contactos de confianza y botón SOS, y los derechos RGPD (descargar y borrar
tus datos). El prototipo (`prototipo/confianza.js`, con apoyo de `app.js`) tiene todas las
pantallas y reglas, **simuladas en el navegador**. Este documento dice qué tiene que hacer
el **servidor** en la app real.

Relacionado: [`PRODUCTO.md`](../PRODUCTO.md) (Mensajería, Moderación y reportes, Edad,
aceptación legal y datos), [`cuentas-y-acceso.md`](cuentas-y-acceso.md) (eliminar la
cuenta), [`social.md`](social.md) y [`modelo-datos.md`](modelo-datos.md).

> Esto no es asesoramiento legal. Las referencias a la Ley de Servicios Digitales (DSA,
> Reglamento UE 2022/2065) y al RGPD son orientativas: hay que revisarlas con un abogado
> antes de lanzar.

## Qué está simulado en el prototipo

| En el prototipo | En la app real |
|---|---|
| Reportes, bloqueos, decisiones y apelaciones se guardan en el navegador | Se guardan en el servidor, que es quien aplica sus efectos en cada consulta |
| El filtro de texto son unas pocas reglas en el móvil | Clasificadores en el servidor (texto e imagen) más listas que mantiene el equipo |
| El panel de moderación es una pantalla más (Ajustes ▸ Prototipo) | Una web interna aparte, con acceso por roles y registro de quién hace qué |
| La cola mezcla tus reportes con unos de ejemplo (Lucía, Sara, Ana y el filtro) | Todos los reportes de todas las personas |
| Los contactos de confianza "aceptan" a los 3 s; los SMS no se envían | SMS reales con un proveedor (por ejemplo, Twilio o MessageBird) |
| La alerta SOS llega al panel del propio prototipo | Llega a un equipo de seguridad de guardia 24 horas |
| "Descargar mis datos" genera el JSON al momento en el móvil | El servidor prepara un ZIP (JSON + fotos y vídeos) y avisa cuando está listo |

## Bloqueos

- Se guardan en el servidor (`BLOQUEO`) y se aplican en **cada consulta**: perfil, muro,
  comentarios, búsqueda, mensajes, menciones, planes y enlaces directos.
- Efectos, en los dos sentidos:
  - no os veis los perfiles, publicaciones ni comentarios;
  - no os podéis escribir y las conversaciones directas desaparecen de la bandeja;
  - se deshace el seguimiento;
  - quien está bloqueado no puede unirse a tus planes. Si ya estaba apuntado, se avisa al anfitrión, sin decir por qué.
- No se avisa a quien bloqueas.
- Ajustes ▸ Cuentas bloqueadas: la lista, con un botón para desbloquear. Desbloquear no recupera el seguimiento.
- Se puede bloquear desde un chat, desde una solicitud de mensaje, desde el perfil (⋯) y al enviar un reporte.

## Reportes

**Qué se reporta**: una persona (perfil), una conversación, una publicación, un
comentario o un plan. Más adelante, también el comportamiento en un evento.

**Dónde**:

| Desde | Reporta |
|---|---|
| Chat o solicitud de mensaje (⋯) | La conversación |
| Perfil (⋯) | La persona |
| Publicación (⋯) | La publicación |
| Comentario (icono de aviso) | El comentario |
| Ficha del plan ▸ Seguridad | El plan, contra su anfitrión |

**Qué se guarda** (`REPORTE`):

- Quién reporta: nunca se le dice a la persona reportada.
- A quién se reporta y qué objeto.
- Motivo, y una **copia del texto** como prueba: el contenido, o los últimos mensajes si es una conversación. Si después se borra el original, la prueba sigue.
- Origen: una persona o el filtro automático.
- Gravedad, fecha y estado.

**Gravedad y plazo de respuesta** (SLA, propuesta):

| Gravedad | Motivos | Responder en |
|---|---|---|
| Crítica | Amenazas o peligro, posible menor, amenaza detectada por el filtro | 1 hora, 24 horas al día |
| Alta | Acoso, insultos u odio; contenido sexual no pedido | 24 horas |
| Media | Estafa, suplantación | 48 horas |
| Baja | Spam, otro motivo | 72 horas |

**Al enviar**:

- Bloquear viene marcado al reportar a una persona o una conversación, y desmarcado al reportar un contenido suelto.
- Una solicitud de mensaje reportada sale de la bandeja.
- Si el motivo es "amenazas o peligro", se muestran el 112 y cómo denunciar ante la policía.

**Tus reportes** (Ajustes ▸ Tus reportes): cada reporte con su estado:

- *En revisión*;
- *Resuelto*, con lo que se ha hecho;
- *Sin infracción*. En este caso puedes pedir otra revisión.

Cuando se revisa, llega un aviso de tipo "seguridad".

**Abuso del reporte** (art. 23 DSA): a quien envía muchos reportes claramente infundados
se le avisa y, si sigue, se dejan de tramitar sus reportes durante un tiempo.

## Filtros automáticos de contenido

Se aplican al publicar o editar:

- comentarios;
- pies de publicación;
- mensajes directos y de plan;
- título y descripción de un plan;
- descripción del perfil.

En el servidor se aplican también a las imágenes y los vídeos (desnudos, violencia), a
los directos y a los nombres de usuario.

| Categoría | Ejemplos | Qué pasa |
|---|---|---|
| Amenaza | "te voy a matar", "sé dónde vives" | **Se retiene**: no lo ve nadie más; entra en la cola con gravedad crítica |
| Odio | Insultos racistas, homófobos… | **Se retiene**; gravedad alta |
| Spam o estafa | Enlace + "gana 300 € a la semana", cripto, apuestas | **Se retiene**; gravedad baja |
| Insulto | "idiota", "imbécil", "pringados" | **Aviso antes de publicar** ("¿Seguro que quieres publicarlo?" · Editar / Publicar igualmente). Si se publica, se muestra a menos gente y entra en la cola con prioridad baja |
| Datos de contacto | Teléfono o email a quien no conoces, o en público | **Aviso**: "es más seguro hablar por el chat de la app". Se puede enviar igualmente y no se reporta |

- **Normalización**, para que no se esquive el filtro:
  - minúsculas y sin tildes;
  - números por letras: "1d10t4" → "idiota";
  - letras repetidas: "idiotaaa";
  - letras sueltas: "i d i o t a".
- **Lo retenido**:
  - solo lo ve quien lo publicó, marcado "En revisión";
  - en los mensajes se ve "No entregado: en revisión" y no le llega a la otra persona;
  - se registra como decisión automática (`ACCION_MODERACION` de tipo `retener`, en revisión), que se puede apelar.
- **La descripción del perfil** que se retendría no se guarda: se explica por qué.
- **En el servidor**:
  - un clasificador de texto multilingüe (de terceros, como Perspective o Hive, o propio) con umbrales por categoría;
  - listas de términos y de dominios de estafa que mantiene el equipo;
  - detección de patrones: muchos reportes a la vez, planes duplicados, cuentas nuevas que escriben a muchas personas;
  - imágenes: hash de material ilegal conocido (PhotoDNA o similar, con obligación de comunicarlo), clasificador de desnudos y violencia.
- **Las decisiones automáticas siempre las revisa una persona** si se apelan (art. 20.6 DSA).

## Panel interno de moderación

En la app real es una web aparte para el equipo, **no una pantalla de la app**. Tiene:

- Acceso con SSO y 2FA obligatoria.
- Roles: moderador, responsable de seguridad, legal y administrador.
- Registro inmutable de quién ve y decide qué.
- Datos personales visibles solo lo necesario.

**Cola**:

- Ordenada por gravedad y antigüedad, con el plazo de cada reporte.
- Cada tarjeta muestra:
  - el motivo, el tipo de objeto y la prueba;
  - si viene del filtro y de qué categoría;
  - la persona reportada, con cuántos reportes tiene, sanciones vigentes y avisos;
  - quién reporta: solo lo ve el equipo.
- Agrupar los reportes del mismo objeto (propuesta).

**Acciones** (graduadas):

| Acción | Efecto |
|---|---|
| Desestimar | No incumple las normas. Si estaba retenido, se publica |
| Publicar (lo retenido) | El filtro se equivocó: se publica y se anula la decisión automática |
| Retirar el contenido | Deja de verse para todos; queda guardado como prueba |
| Retirar y dar un aviso | Además suma un aviso a la cuenta |
| Reducir el alcance | La cuenta sale menos en el muro, la búsqueda y las sugerencias |
| Quitar la opción de organizar planes | No puede publicar planes; los que tenga se revisan |
| Suspender 7 o 30 días | No puede entrar; su contenido no se ve; no se le puede escribir |
| Cerrar la cuenta | Para siempre, para la **persona**: todos sus perfiles. Como la identidad está verificada, no puede volver a registrarse con el mismo documento |
| Escalar a las autoridades | Para amenazas creíbles, posibles menores y agresiones (art. 18 DSA). Conserva las pruebas |
| Retener el pago (escrow) | Plan fraudulento: no se paga al anfitrión y se reembolsa |

- **Avisos acumulados** (propuesta): con 3 avisos en 90 días, suspensión de 7 días; si vuelve a pasar, 30 días; después, cierre. Las faltas graves (amenaza creíble, menor, agresión) van directas al cierre.
- **Exposición de motivos** (art. 17 DSA). Cada decisión se comunica a la persona afectada con:
  - qué se ha hecho y a qué contenido;
  - el motivo y la norma incumplida;
  - si fue automática;
  - cómo apelar.

  En la app: Ajustes ▸ Estado de tu cuenta, y una notificación.
- **Quien reportó** recibe el resultado: un aviso de seguridad que no se puede desactivar.
- **Bienestar del equipo**: el contenido gráfico se difumina por defecto, con rotación y apoyo psicológico.

## Apelaciones

- **Quién apela**:
  - la persona afectada por una decisión, sea automática o del equipo;
  - quien reportó, si se desestimó su reporte (art. 20 DSA).
- **Plazo**: hasta 6 meses después de la decisión.
- **Cómo**: Ajustes ▸ Estado de tu cuenta ▸ Apelar (o Tus reportes ▸ Pedir otra revisión), con un texto de hasta 1.000 caracteres.
- **Quién la revisa**: una persona **distinta** de la que decidió. Plazo propuesto: 7 días.
- **Resultado**:
  - *Estimada*: se anula la decisión, el contenido vuelve y se levantan la suspensión, el alcance reducido o la prohibición de organizar. Si apeló quien reportó, el reporte vuelve a la cola.
  - *Desestimada*: se mantiene, y se informa de que puede acudir a un órgano de resolución extrajudicial certificado (art. 21 DSA) o a los tribunales.
- **Informe de transparencia** anual (art. 15 y 24 DSA): número de reportes, de decisiones por tipo, de automáticas, de apelaciones y de decisiones revocadas. Las microempresas y pequeñas empresas están exentas de parte de estas obligaciones (art. 19), pero conviene cumplirlas desde el principio.

## Contactos de confianza y botón SOS

**Contactos de confianza** (Ajustes ▸ Contactos de confianza y SOS):

- Hasta 3 personas, con nombre y teléfono. No hace falta que usen la app.
- Se les envía un SMS para que **acepten**: el número es de un tercero. Pueden darse de baja respondiendo BAJA.
- Opciones:
  - *Compartir cada plan al que vaya*: al apuntarte, reciben el plan, el sitio y la hora.
  - *Preguntarme si estoy bien al acabar*: al terminar el plan, la app pregunta. Si no respondes en 1 hora, avisa a tus contactos (evento `sin_respuesta`).
- **Ficha del plan ▸ Seguridad**: compartir el plan con tus contactos (si no lo haces ya siempre) y "He llegado bien", que les avisa.

**Botón SOS**:

- Está en la ficha del plan y en su chat.
- Abre dos opciones: *Llamar al 112* y *Enviar alerta con mi ubicación*.
- **Llamar al 112** usa la llamada del propio móvil. En España, Android e iPhone mandan la ubicación al 112 automáticamente (AML). La app no llama en tu nombre.
- **La alerta** crea un `EVENTO_SEGURIDAD` de tipo `sos`, activo, con:
  - la ubicación precisa (GPS, con permiso; si no, la del plan);
  - el plan;
  - a quién se ha avisado.

  Avisa por SMS a tus contactos (con enlace a la ubicación durante 2 horas) y al **equipo de seguridad**: notificación push crítica y llamada de la centralita.
- **En el panel**, las alertas activas salen primero. El equipo puede:
  - llamar a la persona;
  - pasar los datos al 112;
  - cerrar la alerta.
- **"Estoy bien"** cierra la alerta y avisa a los contactos.
- Las alertas y los avisos de seguridad **no se pueden desactivar** en las preferencias de notificaciones.
- **Abuso**: las falsas alarmas reiteradas se tratan como un reporte más, pero nunca se penaliza una alerta de buena fe.

## Tus datos (RGPD)

Ajustes ▸ Tus datos y privacidad.

**Descargar una copia** (art. 15 y 20 RGPD):

- Incluye:
  - cuenta (sin la contraseña) y perfil;
  - perfiles profesionales y publicaciones;
  - tus comentarios, me gusta y guardados, y tus valoraciones;
  - a quién sigues y quién te sigue;
  - tus planes (apuntado, asistidos y organizados);
  - tus mensajes, notificaciones y bloqueos;
  - tus reportes, sin datos de terceros;
  - las decisiones de moderación sobre ti;
  - contactos de confianza y eventos de seguridad;
  - consentimientos con su historial.
- Formato: JSON legible por máquina, más las fotos y los vídeos en el mismo ZIP.
- En la app real el servidor la prepara en segundo plano, avisa por notificación y email, y deja un enlace firmado que caduca en 4 días.
- Límite: una cada 24 horas.

**Consentimientos**:

| Qué | Base legal | Por defecto |
|---|---|---|
| Novedades por email | Consentimiento | No |
| Ubicación precisa | Permiso del móvil + consentimiento | Lo que se eligió en el alta |
| Estadísticas de uso | Consentimiento | No |
| Recomendaciones según tu actividad | Interés legítimo; se puede oponer (art. 21) | Sí |
| Términos, privacidad y 18+ | Contrato y obligación legal | Aceptados en el alta, con versión y fecha |

- Retirar un consentimiento es tan fácil como darlo (art. 7.3).
- Cada cambio se guarda con su fecha (`CONSENTIMIENTO` es histórico).

**Corregir** (art. 16): desde Editar perfil.

**Oposición, limitación y otras peticiones**: por email al delegado de protección de datos.

**Plazo de respuesta**: un mes, ampliable a dos más en casos complejos (art. 12). Se puede
reclamar ante la AEPD.

**Eliminar la cuenta** (art. 17). Ver [`cuentas-y-acceso.md`](cuentas-y-acceso.md).

- Desde Ajustes, con confirmación, y ofreciendo antes descargar los datos.
- Propuesta:
  - la cuenta se **desactiva al momento** y se borra del todo a los **30 días** (entrar antes la recupera);
  - las copias de seguridad se purgan en los 35 días siguientes;
  - las reseñas recibidas se anonimizan.
- **Se conservan**, bloqueados y solo el tiempo que obligue la ley:
  - pagos y facturas (normativa fiscal);
  - pruebas de reportes graves y lo que pidan las autoridades;
  - el hash del documento de identidad de una cuenta cerrada por moderación, para impedir que vuelva.

## Notificaciones nuevas

| Tipo | Cuándo | ¿Se puede desactivar? |
|---|---|---|
| Seguridad | Resultado de tus reportes, decisiones sobre tu contenido, apelaciones, alerta SOS enviada | No |

## API (borrador)

```
POST   /bloqueos                     { usuario_id }
DELETE /bloqueos/:usuario_id
GET    /bloqueos
POST   /reportes                     { objeto_tipo, objeto_id, motivo, detalle?, bloquear? }
GET    /reportes/mios
POST   /reportes/:id/apelacion       { texto }
GET    /cuenta/estado                (decisiones sobre ti, avisos, si puedes organizar)
POST   /moderacion/acciones/:id/apelacion { texto }
POST   /contenido/comprobar          { tipo, texto, destinatario_id? }  → ok | aviso | retener
GET    /contactos-confianza  ·  POST { nombre, telefono }  ·  DELETE /contactos-confianza/:id
PUT    /ajustes/seguridad            { compartir_planes, preguntar_si_estoy_bien }
POST   /planes/:id/compartir-contactos  ·  POST /planes/:id/he-llegado
POST   /sos                          { plan_id?, ubicacion? }   → id (prioridad máxima)
POST   /sos/:id/cerrar
POST   /datos/exportacion            → 202 + id   ·   GET /datos/exportacion/:id
GET    /consentimientos  ·  PUT /consentimientos/:tipo { valor }

# Web interna de moderación (roles)
GET    /mod/cola?gravedad=&tipo=
POST   /mod/reportes/:id/decision    { accion, motivo, nota_interna? }
GET    /mod/sos?estado=activa  ·  POST /mod/sos/:id { llamar | avisar_112 | cerrar }
GET    /mod/apelaciones  ·  POST /mod/apelaciones/:id { estimar: bool }
GET    /mod/historial?persona_id=
```
