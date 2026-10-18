# Herramientas internas — panel de administración

Especificación de lo que necesita el equipo para operar la app: **usuarios, planes,
verificación de negocios, categorías y métricas del piloto**, más el acceso a moderación
(que ya define [`confianza-y-seguridad.md`](confianza-y-seguridad.md)). El prototipo lo
simula en *Ajustes ▸ Prototipo ▸ Panel de administración* (`prototipo/admin.js`); aquí
se describe lo que tiene que hacer el servidor.

## 1. Dónde vive y quién entra

- **Web aparte** (`admin.` + dominio), nunca dentro de la app de los usuarios. Mismo
  backend y misma base de datos, pero con su propia API (`/admin/v1/...`) que la app no
  puede llamar.
- **Acceso solo del equipo**: inicio de sesión con la cuenta de trabajo (SSO de Google
  Workspace o similar) y **2FA obligatoria** con llave o app de autenticación (no SMS).
  Sesiones de 12 h, cierre al cambiar de IP de país y lista de IPs permitidas opcional.
- **Nada de "entrar como" un usuario.** Para ayudar a alguien se ve su ficha, no su sesión.
  Los mensajes privados no se leen desde aquí; solo lo adjuntado en un reporte
  (ver confianza-y-seguridad §3).

### Roles

| Rol | Usuarios | Planes | Negocios | Categorías | Métricas | Moderación | Registro |
|---|---|---|---|---|---|---|---|
| Administración | ver, editar, suspender | todo | decidir | todo | ver | ver | ver |
| Moderación | ver, suspender | retirar, aprobar retenidos | ver | — | — | todo | ver lo suyo |
| Soporte | ver, nota interna, enviar restablecer contraseña | ver | pedir documentos | — | — | crear reporte | ver lo suyo |
| Análisis | — | — | — | — | ver (datos agregados) | — | — |

Las combinaciones se asignan por persona; un rol nuevo no da permisos que nadie haya
marcado. Cambiar roles es en sí una acción registrada y necesita a otra persona de
administración que la apruebe (doble firma).

## 2. Registro de cada acción

Todo lo que hace el equipo genera una fila **inmutable** en `REGISTRO_ADMIN`:

- quién (miembro del equipo y rol en ese momento), qué acción, sobre qué objeto (tipo e id),
  antes y después de los campos que cambian, motivo (texto libre, obligatorio en
  suspensiones, retiradas, cancelaciones, rechazos y revocaciones), IP y fecha;
- solo se añade, nunca se edita ni se borra (tabla de solo inserción, copia diaria a
  almacenamiento con bloqueo de escritura). Se conserva 5 años;
- se puede filtrar por persona del equipo, por usuario afectado y por tipo de acción, y
  exportar a CSV para auditorías;
- **alertas**: más de 20 suspensiones en una hora por la misma persona, o accesos a fichas
  sin relación con un caso abierto, avisan a administración.

## 3. Usuarios

- **Buscar** por nombre, @usuario, correo o teléfono (los dos últimos solo para soporte y
  administración, y quedan en el registro).
- **Ficha**: tipo de cuenta (persona o profesional y quién la gestiona), estado de
  verificación y cómo se hizo, estado de la cuenta (activa, suspendida hasta, cerrada),
  avisos y sanciones vigentes, reportes recibidos y hechos, planes organizados y asistidos,
  fiabilidad (no-shows y cancelaciones tardías), seguidores y fecha de alta.
- **Acciones**:
  - *Dar por verificada (revisión manual)*: cuando el proveedor de verificación falla pero
    el documento es válido. Requiere ver el expediente del proveedor; queda el motivo.
  - *Revocar la verificación*: la persona vuelve a necesitar verificarse para apuntarse a
    planes (cuentas-y-acceso §verificación). Se le avisa con el motivo.
  - *Suspender 7 días / reactivar*: usa el mismo estado que moderación (`USUARIO.estado`,
    `suspendida_hasta`). Las sanciones por contenido se deciden en el panel de moderación,
    con su exposición de motivos y su apelación; desde aquí solo se suspende por motivos de
    cuenta (fraude de pago, suplantación, cuenta comprometida).
  - *Enviar enlace para restablecer la contraseña* (al correo verificado; nunca se ve ni se
    fija una contraseña).
  - *Nota interna*: texto que solo ve el equipo, con autor y fecha. No se incluye en la
    exportación de datos del usuario salvo que lo pida expresamente (RGPD art. 15: sí es dato
    personal, se entrega si lo solicita).

## 4. Planes

- **Listado y filtros**: todos, con reportes, en revisión (retenidos por el filtro o
  retirados), de pago, destacados; y por fecha, categoría, anfitrión y estado.
- **Ficha**: estado, anfitrión, apuntados, asistencias verificadas, reportes, pagos
  (retenido, liberado, reembolsado) y si viene de una chispa.
- **Acciones**:
  - *Destacar en Descubrir*: el plan sube al principio del feed para todos (lleva la marca
    "Destacado"). Máximo 3 destacados a la vez por ciudad; caducan cuando empieza el plan.
    Es curaduría editorial, no publicidad: **nunca se cobra por destacar** (lo de pago es el
    boost de fase 2, que se marca como patrocinado).
  - *Aprobar* un plan que retuvo el filtro automático.
  - *Retirar de Descubrir / restaurar*: deja de salir en el feed, el mapa y la búsqueda; los
    apuntados lo siguen viendo. Si es por incumplir las normas, se hace desde moderación.
  - *Cancelar el plan*: avisa a todos por el chat del plan y por notificación y, si es de
    pago, reembolsa el 100 % a todos (pagos.md §reembolsos). La comisión no se cobra.

## 5. Verificación de negocios

Distinta de la verificación de identidad de una persona: comprueba que quien gestiona el
perfil profesional **representa al negocio** (PRODUCTO.md, "Reclamar tu local").

### Cuándo entra en la cola

- Al crear un perfil profesional (*Perfil ▸ Añadir un perfil profesional*).
- Al reclamar un lugar del mapa.
- Al activar los cobros (Stripe pide su propia verificación KYB; si ya la pasó, se adjunta).

### Documentos

| Documento | Para qué | Obligatorio |
|---|---|---|
| CIF / NIF | Que el negocio existe (se contrasta con el registro mercantil o censo de la AEAT) | Siempre |
| Licencia de actividad | Que puede organizar lo que publica | Locales con público |
| Titularidad del local | Contrato de alquiler, escritura o recibo a nombre del negocio | Para reclamar un lugar |
| Seguro de responsabilidad civil | Cobertura en planes con público | Organizadores de eventos y planes de pago con más de 30 personas |

Los documentos se guardan cifrados, fuera de la base de datos principal, solo los ve
quien revisa y se borran 90 días después de decidir (se conserva el resultado y la fecha).

### Decisiones

- **Verificar**: el perfil lleva la marca de negocio verificado en el perfil y en sus planes.
  Si reclamaba un lugar, el lugar pasa a ser suyo (`LUGAR.propietario_id`, `reclamado`) y
  hereda su histórico (hashtag, publicaciones, valoraciones). Si otro perfil tenía ese
  lugar, la decisión va a revisión doble (posible suplantación).
- **Pedir documentos**: se le dice exactamente qué falta; la solicitud queda en
  "Faltan documentos" y caduca a los 30 días.
- **Rechazar**: con motivo (los datos no coinciden, documento ilegible o caducado,
  actividad no permitida). Puede volver a solicitarlo; al tercer rechazo, revisión de
  administración.
- Objetivo de servicio: decidir en **48 h laborables**. La cola se ordena por antigüedad,
  con prioridad para quien tiene planes de pago publicados.

## 6. Categorías

Las categorías no van fijas en el código: la app las pide al servidor (`GET /categorias`,
cacheado 1 h) y el equipo las gestiona.

- **Crear** (nombre, icono de la lista de iconos de la app, orden).
- **Renombrar**: cambia el nombre en todas partes; el id no cambia.
- **Fusionar** A en B: los planes, chispas e intereses de usuarios con A pasan a B, y A queda
  `fusionada` con `fusionada_en_id = B` (los enlaces antiguos a A redirigen a B).
- **Jubilar**: deja de salir al crear y al filtrar; los planes que ya la tienen la conservan.
- **Reactivar** una jubilada o fusionada (la fusión no se deshace: los planes movidos se
  quedan en B).

Cada cambio queda en el registro. Los presets de las chispas (plazas, mínimo y gastos por
tema) se configuran por categoría; una categoría nueva usa la configuración general.

## 7. Métricas del piloto

### Qué se muestra

- **Cifra principal**: asistencias reales verificadas esta semana y su variación frente a la
  anterior (PRODUCTO.md, Métricas).
- **Evolución semanal** en columnas, con la tabla de registros, activos, planes, apuntados
  y asistencias.
- **Hipótesis H1-H6** de [`plan-validacion-madrid.md`](plan-validacion-madrid.md) con su
  semáforo: verde (seguir), ámbar (ajustar), rojo (parar o pivotar), calculado con los mismos
  umbrales del documento. Cada estado lleva icono y texto, no solo color.
- **Operación ahora**: personas y % verificadas, planes activos y de pago, chispas y cuántas
  son plan, cobrado en reservas y comisión, reportes abiertos y SOS activos, negocios por
  verificar.

### De dónde salen los datos

- La app registra **eventos de producto propios** (sin píxeles de terceros; ver la tarea del
  issue #28): `registro`, `verificacion_ok`, `apuntado`, `checkin_qr`, `asistencia`,
  `cancelacion`, `pago`, `reembolso`, `foto_subida`, `chispa_creada`, `chispa_convertida`.
  Cada evento lleva id seudónimo, fecha, ciudad y el id del plan; nunca contenido de
  mensajes ni ubicación exacta.
- Un trabajo nocturno los agrega en tablas por semana y por plan (`METRICA_SEMANAL`), que es
  lo único que lee el rol de análisis. Grupos de menos de 10 personas no se muestran
  desglosados.
- Analítica solo de quien la aceptó en el consentimiento (`CONSENTIMIENTO.tipo = analitica`);
  las métricas de negocio necesarias (asistencias, pagos) se calculan sobre los datos de la
  operación, que no requieren ese consentimiento.

### Definiciones

| Métrica | Cálculo |
|---|---|
| Activación | Registrados en la semana *s* que se apuntan a un plan en 14 días ÷ registrados en *s* |
| Asistencia | Asistencias verificadas (QR o código) ÷ apuntados confirmados, separado gratis y pago |
| Repetición | Asistentes en la semana *s* que asisten a otro plan en 30 días ÷ asistentes en *s* |
| Aforo de pago vendido | Plazas pagadas (sin reembolsadas) ÷ aforo de los planes de pago |
| Planes con fotos | Planes pasados con al menos una foto de un asistente ÷ planes pasados |
| Calidad (H6) | Media de valoraciones post-plan e incidentes graves (reportes de severidad crítica confirmados) |

En el piloto (sin app aún) estas cifras salen de las hojas y formularios del plan de
validación; el panel las muestra igual para que la decisión de la semana 6 se tome con la
misma vista.

## 8. Moderación

El panel de moderación es el de confianza-y-seguridad §4 (cola por severidad, decisiones con
exposición de motivos, apelaciones, SOS). Desde administración se ve el resumen (en cola,
críticos, apelaciones pendientes, SOS activos) y se entra a él; los roles de la §1 deciden
quién puede actuar.

## 9. Qué simula el prototipo y qué no

| En el prototipo | En la app real |
|---|---|
| Entra cualquiera desde Ajustes ▸ Prototipo | Web aparte, SSO, 2FA y roles |
| El registro dice siempre "Tú (admin)" y se guarda en el navegador | Tabla de solo inserción con persona, rol, motivo e IP |
| Métricas del piloto de ejemplo (`PILOT_WEEKS`, `PILOT_STATS` en `data.js`) | Agregados nocturnos de eventos propios |
| Verificar un negocio no pide documentos reales | Documentos cifrados, contraste con registros oficiales y KYB de Stripe |
| Lo del equipo se guarda en `localStorage` (`planes-admin`), común a las cuentas del navegador | Base de datos central |
