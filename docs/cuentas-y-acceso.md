# Cuentas y acceso: especificación

Cómo funcionan el registro, el inicio de sesión, la verificación en dos pasos, la edad
y los consentimientos, el onboarding y la verificación de identidad. El prototipo
(`prototipo/cuentas.js`) ya tiene todas las pantallas y los flujos, **simulados en el
navegador**. Este documento dice qué tiene que hacer el **servidor** cuando se
construya la app real, para que nada de esto dependa del móvil.

Relacionado: [`PRODUCTO.md`](../PRODUCTO.md) (Flujo de onboarding, Verificación de
identidad, Varios perfiles por persona) y [`modelo-datos.md`](modelo-datos.md)
(Persona, Usuario, Verificación de identidad, Consentimiento, Sesión de dispositivo).

## Qué está simulado en el prototipo

| En el prototipo | En la app real |
|---|---|
| Las cuentas se guardan en el `localStorage` del navegador | Base de datos en el servidor |
| Contraseña con un hash de demostración | Argon2id con sal por usuario, en el servidor |
| El código llega como una notificación dibujada en la pantalla | SMS o email a través de un proveedor (Twilio, Amazon SES…) |
| La app autenticadora es un código mostrado en pantalla | TOTP (RFC 6238) con clave por usuario y códigos de recuperación |
| La verificación de identidad son pantallas de muestra | SDK y servidor del proveedor (Veriff, Onfido, Didit…) |
| El bloqueo por falta de verificación lo hace la pantalla | Lo aplica el servidor en cada petición (ver más abajo) |
| La sesión es una clave en el navegador | Token de sesión de corta duración y token de refresco rotatorio |

Cuenta de demostración: `marina@planes.app` · `planes123` (o el botón "Entrar con la
cuenta de demostración"). Las cuentas nuevas empiezan vacías, sin el contenido de Marina.

## Registro

1. **Bienvenida**: propuesta de valor y tres botones: crear cuenta, ya tengo cuenta y cuenta de demostración (solo en el prototipo).
2. **Email o teléfono y contraseña.**
   - Email con formato válido.
   - Teléfono en formato internacional E.164. Los españoles de 9 cifras se completan con +34.
   - Contraseña de 8 caracteres o más, con letras y números, sin contener el email.
   - Si el email o el teléfono ya existen, se ofrece entrar o recuperar la contraseña.
3. **Código de 6 cifras** al email o por SMS.
   - Caduca a los 10 minutos y admite 5 intentos.
   - Se puede pedir otro a los 30 segundos.
   - El campo usa `autocomplete="one-time-code"` para que el móvil lo rellene solo.
4. **Verificación en dos pasos (opcional)**: app autenticadora (recomendada), SMS o email. Si se activa, se confirma con un código. Se puede saltar y activarla después.
5. **Edad y consentimientos.**
   - Fecha de nacimiento: si es menor de 18 años, no se crea la cuenta ni se guarda nada.
   - Aceptación en bloque de Términos, Privacidad y Código de conducta (obligatoria), con versión y fecha.
   - Novedades por email, aparte y desmarcado (opcional).
   - Ubicación, verificación de identidad y pagos se piden después, cuando hacen falta.
6. **Se crea la cuenta** (Persona y su perfil personal) y se inicia sesión.

## Onboarding

Cuatro pasos con indicador de progreso. Si se cierra la app, continúa en el paso donde lo dejó.

1. **Perfil.**
   - Nombre (máx. 30) y nombre de usuario (3–30; minúsculas, números, punto y guion bajo; único).
   - Foto, descripción (máx. 150), ciudad (opcional) e idiomas.
   - Incluye el texto de confianza sobre la verificación.
2. **Intereses**: al menos 3 categorías y la distancia de los planes (5, 10, 25 o 50 km).
3. **Ubicación**: explicación y permiso del sistema. Rechazable: la app funciona sin ella.
4. **A quién seguir**: primero locales y anfitriones verificados, después perfiles que comparten planes de tus intereses y perfiles destacados. Hay "Seguir a todos".

Al terminar se entra al muro (Vividas) con contenido de quien sigues.

## Inicio de sesión, recuperación y seguridad

- **Entrar**:
  - Con email o teléfono y contraseña.
  - El error es genérico ("Email, teléfono o contraseña incorrectos"), para no desvelar qué cuentas existen.
  - 5 fallos seguidos bloquean el acceso 15 minutos.
  - Con la verificación en dos pasos activa, se pide el código.
- **Recuperar la contraseña**:
  - Código al email o teléfono de la cuenta. Si no existe, el mensaje es el mismo y no se envía nada.
  - Nueva contraseña repetida dos veces, que cierra el resto de sesiones.
  - En la app real, si la cuenta tiene 2FA, se pide también el segundo factor.
- **Ajustes ▸ Seguridad y acceso**:
  - Email y teléfono.
  - Cambiar contraseña (pide la actual).
  - Activar o desactivar la verificación en dos pasos.
  - Dónde has iniciado sesión, con cierre remoto.
  - Cerrar sesión.
  - **Eliminar cuenta**: hay que escribir ELIMINAR. Es obligatorio en App Store y Google Play y es un derecho RGPD.

## Verificación de identidad con el proveedor

Pasos en la app (en el prototipo están dibujados):

1. Elegir documento: DNI, NIE o pasaporte.
2. Foto de la parte delantera.
3. Foto de la parte de atrás (no con pasaporte).
4. Selfie con prueba de vida.
5. Comprobación.

Lo que hace el servidor:

1. La app pide `POST /verificacion/sesion`. El servidor crea la sesión en el proveedor, con la Persona como referencia, y devuelve la URL o el token del SDK.
2. El proveedor avisa al servidor con un **webhook firmado** (HMAC). El servidor comprueba la firma y que el evento no está repetido.
3. Estados: `pendiente` → `aprobada` | `rechazada` | `revision_manual` | `caducada`.
   - Solo `aprobada` da el distintivo.
   - `revision_manual` se resuelve en menos de 24 h y se avisa con una notificación.
4. Se guarda el resultado, la fecha, el proveedor y el tipo de documento. **No se guardan las imágenes** en nuestros servidores: se quedan en el proveedor con su política de retención.
5. La verificación es de la **Persona**: vale para su perfil personal y para sus perfiles profesionales.
6. Un mismo documento no puede verificar dos Personas. El proveedor devuelve un identificador del documento para detectarlo.

Proveedor a elegir (decisión abierta). Criterios: precio por verificación, cobertura de documentos de la UE, prueba de vida, SDK para iOS, Android y web, y alojamiento de datos en la UE.

## Reglas que aplica el servidor

La pantalla avisa, pero **quien decide es el servidor**. Cada petición de estas acciones
comprueba que la Persona tiene la identidad verificada; si no, responde
`403 verificacion_requerida` y la app muestra la explicación.

| Acción | Sin verificar |
|---|---|
| Ver planes, seguir, me gusta, comentar, publicar, compartir | Permitido |
| Escribir a quien te sigue o comparte un plan contigo | Permitido |
| Apuntarse, solicitar ir, registrar la llegada | `403 verificacion_requerida` |
| Crear un plan, emitir un directo desde un plan | `403 verificacion_requerida` |
| Leer o escribir en el chat de un plan | `403 verificacion_requerida` |
| Lista de asistentes de un plan | Solo el número |
| Ubicación exacta de un plan íntimo (≤ 8) fuera de un negocio | Solo la zona aproximada |
| Escribir a quien no te conoce (solicitud) | `403 verificacion_requerida` |
| Crear un perfil profesional | `403 verificacion_requerida` |

Otras reglas del servidor:

- **Límites de ritmo** por IP, por cuenta y por destino de envío: códigos (máx. 5 por hora), intentos de entrada y registros.
- **Sesiones**: token de acceso de unos 15 minutos y token de refresco rotatorio. Cerrar sesión o cambiar la contraseña revoca los tokens.
- **Edad**: se valida en el servidor. Si una verificación de identidad revela que es menor, la cuenta se suspende.
- **Consentimientos**: se guardan con versión y fecha. Si cambia la versión, se vuelven a pedir.
- **Eliminar cuenta**:
  - Se borran el perfil, las publicaciones, los mensajes y los perfiles profesionales.
  - Las reseñas recibidas se anonimizan.
  - Lo que exija la ley (pagos, reportes graves) se conserva el tiempo obligatorio.

## API (borrador)

```
POST /auth/registro            { email | telefono, password }        → envía código
POST /auth/registro/confirmar  { codigo }                             → token provisional
POST /auth/2fa/alta            { metodo: app | sms | email }          → clave TOTP o envía código
POST /auth/2fa/confirmar       { codigo }
POST /auth/edad-consentimientos { fecha_nacimiento, legal: true, marketing, version }  → crea la cuenta
POST /auth/entrar              { identificador, password }            → sesión o reto 2FA
POST /auth/entrar/2fa          { codigo }                             → sesión
POST /auth/recuperar           { identificador }                      → siempre 202
POST /auth/recuperar/confirmar { codigo, password_nueva }
POST /auth/salir
PATCH /perfil                  { nombre, usuario, bio, ciudad, idiomas }
PUT  /perfil/intereses         { categorias[], radio_km }
POST /verificacion/sesion                                             → url o token del SDK
POST /webhooks/verificacion    (proveedor, firmado)
DELETE /cuenta                 { confirmacion: "ELIMINAR" }
```
