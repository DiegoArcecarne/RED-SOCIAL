# Bucle central de planes: especificación

Lo imprescindible del piloto: **descubrir un plan → apuntarse → ir → volver**. El
prototipo (`prototipo/planes.js`) tiene todas las pantallas y reglas, **simuladas en el
navegador**. Este documento dice qué tiene que hacer el **servidor** en la app real.

Relacionado: [`PRODUCTO.md`](../PRODUCTO.md) (Plan, Asistencia real y privacidad,
Mensajería, Alcance del MVP), [`cuentas-y-acceso.md`](cuentas-y-acceso.md)
(verificación obligatoria para participar) y [`modelo-datos.md`](modelo-datos.md).

## Qué está simulado en el prototipo

| En el prototipo | En la app real |
|---|---|
| La foto se reduce en el móvil y se guarda en el navegador | Subida a almacenamiento (S3, R2, Supabase Storage) con miniaturas y moderación de imágenes |
| El anfitrión acepta tu solicitud a los 4 s; a tu plan llega una solicitud a los 5 s | Personas reales, con avisos push |
| "Demo: alguien cancela" y "Demo: simular que el plan ha terminado" | Lo hacen el tiempo real y el servidor |
| Código de llegada calculado en el móvil (igual en cualquier móvil) | Lo firma el servidor con una clave secreta |
| Se puede registrar la llegada a cualquier hora | Solo de 1 h antes a 4 h después del inicio |
| Chat con respuestas automáticas y "está escribiendo…" | Mensajería en tiempo real (WebSocket o Realtime) |
| Notificaciones dentro de la app, y del sistema si la app está abierta y con permiso | Push con la app cerrada (APNs, FCM, Web Push) y recordatorios programados |

## Descubrir y crear

- **Filtros**: tema, tamaño de grupo, precio y **cuándo** (hoy, mañana, este finde, próximos 7 días). Los planes pasados y los cancelados no aparecen.
- **Crear plan**:
  - Foto de la cámara o de la galería. Se reduce a 1.200 px de lado mayor en JPEG, y el servidor genera miniaturas y la pasa por la moderación automática.
  - Título (máx. 60), descripción (máx. 1.000), lugar, fecha, tamaño, tema, precio, tipo de asistencia (libre, apuntarse o con aprobación) y grupo organizador.
  - Al publicarlo se crea su chat, con el anfitrión dentro.
- **Editar** (solo el anfitrión): si cambian la fecha, la hora o el lugar, se avisa a todos los apuntados, se escribe el cambio en el chat del plan y se pide **reconfirmar** otra vez.

## Chispas: posibles planes

Una chispa es un plan posible: "Estoy pensando ir a pescar, ¿alguien se anima?". Si llega al mínimo de gente, se convierte en plan; si no, caduca.

- **Campos**:
  - título (60) y texto (300);
  - tema;
  - cuándo (`hoy`, `finde`, `semana`, `fecha` con su fecha, o `sin_fecha`);
  - zona aproximada (texto o lugar);
  - plazas (`sin límite` o máximo de 2 a 100, contando a quien la lanza);
  - mínimo;
  - quién puede apuntarse (`todos`, `seguidores`, `amigos`);
  - aprobación (bool);
  - gastos (`gratis`, `a_escote`, `cada_uno`) con una nota.
- **Configuración por tipo de plan**: el servidor devuelve la propuesta de cada tema, y la app la aplica al elegirlo.

  | Tema | Plazas | Mínimo | Gastos |
  |---|---|---|---|
  | Outdoor | 8 | 2 | A escote |
  | Deporte | 10 | 4 | Gratis |
  | Gastronomía | 6 | 2 | Cada uno lo suyo |
  | Cultura | 4 | 2 | Cada uno lo suyo |
  | Fiesta | Sin límite | 3 | Cada uno lo suyo |
  | Bienestar | 8 | 2 | Gratis |
  | Social | Sin límite | 2 | Cada uno lo suyo |
  | Viajeros | 6 | 2 | A escote |

- **Respuestas**:
  - Hay tres: `si`, `quizas` y `pendiente` (si la chispa es con aprobación).
  - "Me apunto" exige identidad verificada y plaza libre: se comprueba en el servidor, en la misma operación.
  - Se puede cambiar o retirar la respuesta.
- **Avisos** (tipo `chispa`): a quien la lanza, cuando alguien se apunta o quiere ir, y al llegar al mínimo ("Ya sois 3: ¿lo convertís en plan?"). A quien respondió, cuando le aceptan y cuando la chispa se convierte en plan o caduca.
- **Convertir en plan**:
  - crea el plan con los datos de la chispa (que se pueden editar);
  - es siempre de los que hay que apuntarse;
  - quienes respondieron `si` quedan inscritos y entran en el chat del plan;
  - la chispa pasa a `convertida`, con enlace al plan;
  - si el plan es de pago, cada persona tiene que pagar su plaza (ver pagos.md).
- **Estados**: `abierta`, `convertida`, `caducada` (en la fecha o a los 7 días sin fecha) y `descartada` (por quien la lanzó).
- **Privacidad y seguridad**:
  - la visibilidad sigue "quién puede apuntarse";
  - sin dirección exacta;
  - filtros automáticos al publicar;
  - reportable (objeto `chispa`);
  - bloqueos y suspensiones ocultan.
- **Límite contra el spam**: propuesta de 3 chispas abiertas por persona.

## Inscripción

Estados de la inscripción: `solicitada` → `aprobada` / `rechazada`; `confirmada`
(apuntado); `lista_espera`; `cancelada` / `cancelada_tarde`; `asistio` / `no_show`.

- **Apuntarse**: requiere identidad verificada (regla del servidor). En los de pago, el importe queda retenido hasta el plan.
- **Con aprobación**: la persona envía una solicitud. La deciden el anfitrión o los admins del grupo, y el resultado se notifica.
- **Lista de espera**: si el plan está completo, se entra en la lista por orden de llegada. Cuando se libera una plaza, la recibe la **primera persona** de la lista y se le avisa.
  - En el prototipo se le apunta directamente.
  - Propuesta para la app: plaza reservada durante 2 h para que confirme; si no, pasa a la siguiente.
- **Reconfirmación del día**: en las 24 h previas se pide "¿Sigues yendo?" (botones Sí, voy / Ya no puedo).
  - Si no se reconfirma **2 h antes**, la plaza pasa a la lista de espera.
  - Aviso push al abrirse la ventana y otro recordatorio 1 h antes del plazo.
- **Cancelar la asistencia**:
  - Con más de 24 h, sin efectos.
  - Con menos de 24 h, cuenta como **cancelación tardía** en la fiabilidad (no como no presentado).
  - La plaza pasa a la lista de espera.
  - En los de pago se aplica la política del plan:

| Política | Reembolso |
|---|---|
| Flexible | 100 % hasta 24 h antes; después, nada |
| Moderada | 100 % hasta 48 h antes; 50 % entre 48 y 24 h; nada en las últimas 24 h |
| Estricta | 100 % hasta 7 días antes; después, nada |

Son las de PRODUCTO.md (el prototipo usaba otros plazos hasta el bloque de pagos). El detalle del cobro y los reembolsos está en [`pagos.md`](pagos.md).

- **El anfitrión cancela el plan**: aviso a todos, reembolso del 100 % y mensaje en el chat. Cuenta en la fiabilidad del anfitrión.

## Llegada con el QR del anfitrión

- El anfitrión abre **QR de llegada**: un QR con `planes:llegada:<plan>:<código>` y el código de 4 cifras debajo.
  - El código cambia **cada 10 minutos** y se acepta también el inmediatamente anterior, para que una captura reenviada deje de servir enseguida.
- El asistente escanea el QR con la cámara (BarcodeDetector en Android; en iPhone, con el escáner nativo de la app) o escribe el código.
- **Servidor**:
  - El código es `HMAC(clave_del_servidor, plan_id + franja de 10 min)` recortado a 4 cifras.
  - Se valida que la persona está apuntada (o que el plan es libre), que está dentro de la ventana horaria y que no ha registrado ya la llegada.
  - Opcionalmente se cruza con la ubicación del móvil, con un radio de unos 300 m.
  - Se limitan los intentos: 5 por minuto.
- **Llegadas a mano**: el anfitrión puede marcar a quien no pueda escanear. Queda registrado quién lo marcó (`metodo = manual_anfitrion`).
- La llegada respeta la **privacidad de presencia**:
  - visible para todos los del plan: aparece en la lista;
  - solo amigos o nadie: solo cuenta en el total;
  - por debajo de 10 asistentes, solo se cuentan los visibles.

## Quién está en el plan: chinchetas y saludos

Da igual ir solo o en grupo. Al llegar, cada persona elige para ese plan:

- **Quién la ve en el plan y en el mapa**:
  - *todos los del plan*;
  - *solo amigos* (os seguís los dos);
  - *nadie*.

  El valor por defecto sale de Ajustes ▸ Presencia por defecto.
- **Cómo va**: *voy solo*, *voy en grupo* o *no decirlo*. Decir que vas solo anima a otros a saludarte.

Mientras dura el plan, quienes han **registrado la llegada** se ven entre sí:

- **En la ficha del plan**, el bloque *Aquí ahora*:
  - un mapa pequeño del punto del plan con la chincheta de cada persona (su foto, con enlace a su perfil) y la tuya;
  - la lista con "va solo" o "va en grupo";
  - para cada persona, *Yo también* (saludar) y *Mensaje*.
- **En el mapa**, el lugar del plan lleva tu chincheta animada y cuántos estáis. Al tocarlo, ves quién está contigo.
- **Saludo "yo también estoy en este plan"**: un mensaje directo con una chincheta animada, sin texto.
  - Uno por persona y plan.
  - Estar en el mismo plan cuenta como conoceros, así que llega directo y no como solicitud.
  - En el chat del plan, *Estoy aquí* avisa a todo el grupo.

Reglas de privacidad y seguridad (el servidor las aplica en cada consulta):

- **Nunca se muestra la posición exacta de nadie**: todas las chinchetas van en el punto del plan.
- **Solo te ven**:
  - quienes han registrado la llegada a **ese** plan;
  - y solo durante la ventana del plan (desde 1 h antes hasta 4 h después del inicio).
  - Al terminar, desaparece.
- **Quién no ve a quién**:
  - Quien no está en el plan no ve a nadie: ni chinchetas ni nombres; solo el recuento habitual.
  - Los bloqueos ocultan en los dos sentidos.
  - Las cuentas suspendidas no salen.
- **Con *nadie***: sigues viendo a los demás y puedes saludar, y al saludar esa persona sabe que estás.
- **Límites y reportes**: un saludo por persona y plan, y un máximo de saludos por plan (propuesta: 20). Los saludos y mensajes se pueden reportar como cualquier mensaje.

## Índice de fiabilidad

- Sube con cada **llegada** registrada. Baja con cada **no presentado**: estaba apuntado, no registró la llegada y el plan ya ha terminado.
- Las **cancelaciones tardías** se cuentan aparte y se ven, pero pesan menos.
- Porcentaje = asistencias / (asistencias + no presentados).
- Se muestra **agregado** ("Fiabilidad 92 % · 1 no presentado"), nunca a qué planes.
- Si alguien fue pero no lo registró, el anfitrión puede corregirlo en las 48 h siguientes.

## Chat del plan

- Se entra al apuntarse (o al ser aceptado) y se sale al cancelar. Las entradas, salidas y cambios del plan aparecen como mensajes del sistema.
- Arriba quedan fijados el punto de encuentro y "Confirmo que voy".
- Tiempo real en la app: WebSocket o Supabase Realtime, con "está escribiendo…", confirmaciones de lectura opcionales, reintentos si se pierde la conexión y moderación automática del texto.

## Notificaciones

| Tipo | Cuándo |
|---|---|
| Recordatorio | Al apuntarse a un plan de las próximas 24 h; programado el día antes y 2 h antes; reconfirmación |
| Solicitud | Te aceptan o no; alguien quiere ir a tu plan |
| Mensaje | Mensajes nuevos en tus chats (agrupados) |
| Cambio | El anfitrión cambia la fecha, la hora o el lugar, o cancela |
| Lista de espera | Hay plaza para ti |
| Después del plan | Llegada registrada, no presentado, valora el plan |

- **Centro de notificaciones** (campana de la barra superior): nuevas y anteriores, marcar todo como leído, y cada aviso lleva a su plan, chat o solicitudes.
- **Preferencias** por tipo. Los avisos de seguridad (SOS, cambios de última hora en un plan al que vas) no se pueden desactivar.
- **Push**:
  - el servidor guarda los tokens de cada dispositivo y envía con APNs/FCM (app nativa) o Web Push con VAPID (web instalable; en iPhone, desde iOS 16.4 y solo con la app añadida a la pantalla de inicio);
  - los recordatorios se programan con una cola de tareas;
  - horario de silencio por la noche, salvo cambios de última hora.

## API (borrador)

```
GET  /planes?tema=&tamano=&precio=&cuando=hoy|manana|finde|semana&cerca=lat,lng
POST /planes                         (multipart: datos + foto)
PATCH /planes/:id                    → avisa y pide reconfirmar si cambian fecha, hora o lugar
POST /planes/:id/cancelar            (anfitrión)
POST /planes/:id/inscripcion         → confirmada | lista_espera | solicitada
POST /planes/:id/reconfirmar
DELETE /planes/:id/inscripcion       → cancelada | cancelada_tarde, con el reembolso
POST /solicitudes/:id/decidir        { decision: aceptada | rechazada }
GET  /planes/:id/llegada/qr          (anfitrión) → { payload, codigo, caduca }
POST /planes/:id/llegada             { codigo, ubicacion? }
POST /planes/:id/llegada/manual      (anfitrión) { usuario_id }
POST /chispas                        { titulo, texto, tema, cuando, fecha?, zona, limite, maximo?, minimo, quien, aprobacion, gastos, nota_gastos? }
GET  /chispas?cerca=&tema=           (abiertas que puedes ver)
POST /chispas/:id/respuesta          { estado: si | quizas | null }
POST /chispas/:id/respuestas/:usuario { aceptar: bool }   (con aprobación)
POST /chispas/:id/convertir          → plan_id
POST /chispas/:id/descartar
PUT  /planes/:id/presencia           { visibilidad: todos|amigos|nadie, modo: solo|grupo|null }
GET  /planes/:id/aqui                → personas visibles para ti (solo si has registrado la llegada y el plan está en marcha)
POST /planes/:id/saludos             { usuario_id }   (uno por persona y plan)
GET  /notificaciones   ·   POST /notificaciones/leidas   ·   PUT /notificaciones/preferencias
POST /dispositivos                   { token_push, plataforma }
WS   /chat/:conversacion             (tiempo real)
```
