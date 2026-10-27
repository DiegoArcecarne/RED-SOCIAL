# Publicidad sin rastreo: planes promocionados y anuncios en la agenda

Especificación de cómo salen anuncios en la app sin píxeles de seguimiento (ver issue #28).
El prototipo lo simula en la agenda (`prototipo/publicidad.js`); aquí se describe lo que
tiene que hacer el servidor.

## 1. Qué se anuncia

- **Plan promocionado (boost)**: cualquier anfitrión paga para que su plan llegue a más
  gente. Es el formato principal: el anuncio es un plan, como el resto del contenido.
- **Campaña de marca**: una marca, local u organizador con un mensaje que no es un plan
  (por ejemplo, alquiler de bicis para los planes del finde), con su enlace.

## 2. Dónde sale

| Superficie | Cuánto | Estado |
|---|---|---|
| **Agenda** | Como mucho **un anuncio por vista** (el día, la semana o el día elegido en el mes). El de un plan sale en el día del plan; el de marca, en tu primer día libre | En el prototipo |
| Descubrir | El hueco de inyección del muro (1 de cada 5-6), ya previsto en PRODUCTO.md | Fase 2 |
| Nunca | La vista de año, las notificaciones, los recordatorios, los chats, las novedades de un plan, las videollamadas | — |

Cada anuncio lleva siempre **"Patrocinado"**, quién paga y **"Por qué lo ves"**. Un mismo
anuncio se ve como mucho **3 veces al día** por persona. Un plan que ya está en tu agenda
(vas, lo organizas, lo has pedido…) no se te anuncia, ni tampoco los tuyos.

## 3. Cómo se elige (sin rastreo)

Solo con datos que ya están en la app y que la persona puede ver:

- **Tus temas**: los que elegiste al registrarte y los de los planes a los que has ido. Se
  puede desactivar en *Por qué lo ves ▸ Usar mis temas para elegir anuncios*.
- **Tu agenda**: si ese día lo tienes libre.
- **Tu ciudad** (la de tu perfil, no tu ubicación).

Nunca: navegación fuera de la app, píxeles o SDK de terceros, identificadores publicitarios
del móvil, el contenido de los chats, la lista de contactos ni la ubicación exacta. No hay
segmentación por edad ni por datos sensibles (salud, religión, orientación, política).

**Subasta**: entre los anuncios que encajan, gana el de más puntos (cada motivo que encaja
suma) y, a igualdad, la puja más alta. Precio orientativo: 6 € por cada 1.000 veces vistas
(CPM); se cobra por impresión vista al menos 1 s con el 50 % en pantalla.

## 4. Lo que puede hacer quien ve el anuncio

- *No me interesa este anuncio* y *No ver anuncios de [cuenta]*.
- Desactivar el uso de sus temas.
- *Reportar el anuncio* (va a moderación como un reporte de plan o de cuenta).

Los anuncios no se pueden desactivar del todo: son parte del modelo de negocio, con la
densidad limitada de la tabla anterior.

## 5. Promocionar un plan (anfitrión)

En la ficha de tu plan ▸ *Organización ▸ Promocionar este plan*:

1. **Presupuesto** (10, 25 o 50 €) y **duración** (3, 7 o 14 días; termina antes si llega
   el día del plan o se acaba el presupuesto).
2. **Estimación**: personas y veces vistas con ese presupuesto.
3. **Pago** con la tarjeta guardada (Stripe). Se cobra lo gastado; lo que sobra se
   devuelve al terminar. Factura con IVA en *Cobros*.
4. **Revisión**: el equipo lo revisa antes de que salga (mismas normas que el contenido:
   nada de planes engañosos, apuestas ni productos prohibidos). Si lo rechaza,
   devuelve el 100 %.
5. **Resultados** en la ficha: veces vista, toques y gasto; pausar, reanudar o terminar.

No se puede promocionar un plan cancelado, retirado, en revisión ni una videollamada privada.

## 6. Datos y API

`CAMPANA_BOOST`: anunciante, tipo (boost o marca), plan promocionado, superficies,
temas (en marca), presupuesto, gastado, puja, estado (`en_revision | activa | pausada |
terminada | rechazada`), fechas, impresiones y toques. Por persona: anuncios y
anunciantes ocultos, si se usan sus temas, y el contador diario de impresiones por anuncio.

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | `/me/agenda/anuncio?desde=&hasta=` | El anuncio (o ninguno) para los días que se ven, con sus motivos |
| `POST` | `/anuncios/{id}/impresion` y `/toque` | Contadores (agregados; sin guardar quién) |
| `POST` | `/me/anuncios/ocultos` | Ocultar un anuncio o un anunciante |
| `POST` | `/planes/{id}/promocion` | Crear la promoción y cobrar |
| `PATCH` | `/promociones/{id}` | Pausar, reanudar o terminar |

Las impresiones y los toques se guardan **agregados por anuncio y día**; el anunciante
nunca ve quién ha visto su anuncio.
