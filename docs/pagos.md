# Pagos: especificación

Este documento cubre los planes de pago con Stripe Connect:

- el dinero se retiene hasta el plan;
- la comisión es del 15 %;
- los reembolsos siguen la política de cancelación;
- el alta y la verificación de los anfitriones;
- los recibos y las facturas.

El prototipo (`prototipo/pagos.js`) tiene todas las pantallas y reglas **simuladas en el
navegador**: no hay cobros reales. Este documento dice qué tienen que hacer el
**servidor** y la **app** con Stripe.

Relacionado: [`PRODUCTO.md`](../PRODUCTO.md) (Modelo económico),
[`bucle-de-planes.md`](bucle-de-planes.md) (apuntarse, lista de espera, cancelaciones),
[`confianza-y-seguridad.md`](confianza-y-seguridad.md) (reclamaciones en el panel de
moderación) y [`modelo-datos.md`](modelo-datos.md).

> Esto no es asesoramiento legal ni fiscal. Las cifras de Stripe y las referencias a la
> normativa (IVA, facturación, DAC7, PSD2) son orientativas y hay que revisarlas con un
> asesor y con la documentación vigente de Stripe antes de cobrar.

## ¿Van en el piloto? Propuesta

Sí, pero acotados:

- **Solo anfitriones profesionales** (locales y empresas con NIF) y planes de hasta 100 €.
- Los particulares que cobran plantean más dudas (si su actividad es habitual, si deben ser autónomos, DAC7…). Se abren después, si el piloto lo justifica.
- El prototipo ya permite ambos, para poder enseñarlo.
- No entra el micropago de desvelo.

## Qué está simulado en el prototipo

| En el prototipo | En la app real |
|---|---|
| El formulario de tarjeta valida el número (Luhn), la caducidad y el CVC; las tarjetas de prueba de Stripe dan cada resultado | Stripe Payment Element (web) o PaymentSheet (iOS y Android); los datos de la tarjeta nunca pasan por nuestros servidores |
| "Pagar con el móvil" cobra al momento | Apple Pay y Google Pay dentro del mismo Payment Element o PaymentSheet |
| 3D Secure: una pantalla "Confirma el pago en tu banco" | La autenticación reforzada real (PSD2), con la app del banco |
| Las tarjetas guardadas son una lista en el navegador | Métodos de pago guardados en el *Customer* de Stripe |
| El alta de cobros comprueba la letra del DNI o NIE y los dígitos de control del IBAN; Stripe "verifica" en 3 s | Alta alojada por Stripe (cuenta conectada), con su verificación de identidad y de la cuenta |
| Botones "Demo: llegan 3 reservas", "Demo: se ha celebrado" y "Demo: pasan 48 h" | Reservas reales; un proceso programado libera los pagos |
| Recibos y facturas en HTML descargable | PDF con numeración legal, enviados también por email |

## Cómo se mueve el dinero (Stripe Connect)

Modelo: **cargos y transferencias separados** (*separate charges and transfers*).

1. **Reserva.** La plataforma cobra a quien reserva el precio completo con un PaymentIntent, que se captura al momento. El dinero queda en el saldo de la plataforma, en un `transfer_group` por plan.
2. **El plan se celebra.** La reserva pasa a *liberado* y empieza un plazo de **48 h** para reclamar.
3. **Pago al anfitrión.** Pasadas las 48 h sin reclamación, una `Transfer` lleva a la cuenta conectada del anfitrión el **85 %** (el precio menos la comisión del 15 %). Después, Stripe paga a su IBAN según su calendario (normalmente 2-3 días hábiles).

| Ejemplo: plaza de 22 € | Importe |
|---|---|
| Paga quien reserva | 22,00 € |
| Comisión de planes (15 %, IVA incluido) | 3,30 € (base 2,73 € + IVA 0,57 €) |
| Recibe el anfitrión | 18,70 € |
| Coste de la tarjeta para planes (orientativo, tarjeta europea: 1,5 % + 0,25 €) | 0,58 € |

- **Por qué este modelo**: la plataforma decide cuándo transfiere, así que puede retener hasta el plan y reembolsar sin pedirle nada al anfitrión. Es el escrow de PRODUCTO.md.
  - Con *destination charges* el dinero llegaría al anfitrión al momento.
  - Con autorizar y capturar más tarde, la autorización de la tarjeta caduca en unos 7 días, así que solo serviría para planes muy cercanos.
- **Límite de retención**: Stripe limita cuánto tiempo puede quedarse el dinero en la plataforma antes de transferirlo. Hay que consultar el límite vigente en España, del orden de semanas o pocos meses. Propuesta: no vender plazas con más de 60 días de antelación.
- **Quién asume los costes**:
  - Las comisiones de Stripe (tarjeta, cuentas conectadas, transferencias) las asume planes con su 15 %. El anfitrión ve siempre "te llega el 85 %".
  - Las disputas (*chargebacks*) en este modelo son de la plataforma, que puede recuperar el importe del anfitrión si la disputa es por su culpa.
- **Que planes no custodie el dinero**: Stripe es la entidad de pago regulada que guarda los fondos, así que planes no necesita licencia de entidad de pago. Hay que confirmarlo con un abogado para el modelo concreto.

## Reservar y pagar

- En la ficha de un plan de pago, el botón dice **Reservar · 22 €**. Al tocarlo se abre el pago, que muestra:
  - el plan, el importe y "Pago protegido: lo retenemos hasta el plan";
  - la política de cancelación con sus plazos, **siempre antes de pagar**;
  - Apple Pay o Google Pay, las tarjetas guardadas o una tarjeta nueva (con la opción de guardarla).
- **Errores**: tarjeta rechazada, sin fondos o con datos mal escritos. Se explica el error y no se apunta a nadie.
- **3D Secure**: si el banco pide confirmar, se abre su verificación. Si se cancela, no se cobra.
- **Al pagar**:
  - quedas apuntado y entras en el chat del plan;
  - recibes una notificación con el número de recibo;
  - el pago aparece en Ajustes ▸ Pagos y reembolsos.
- **Planes con aprobación**:
  - se solicita sin pagar;
  - si te aceptan, tienes **24 h para pagar** y la plaza se guarda mientras;
  - si no pagas, pasa a la siguiente persona.
- **Lista de espera**:
  - no se cobra al apuntarse a la lista;
  - cuando queda una plaza, se te guarda 24 h para pagar.
- **Comprobaciones en el servidor**: la reserva y el cobro van en la misma operación. Si el plan se llena entre medias, el pago se cancela y no se cobra. Cada cobro lleva una clave de idempotencia por inscripción, para no cobrar dos veces.

## Cancelaciones y reembolsos

Políticas (las de PRODUCTO.md; el anfitrión elige una al publicar):

| Política | Reembolso |
|---|---|
| Flexible | 100 % hasta 24 h antes; después, nada |
| Moderada | 100 % hasta 48 h antes; 50 % entre 48 y 24 h; nada en las últimas 24 h |
| Estricta | 100 % hasta 7 días antes; después, nada |

- **Cancela quien reservó**: se aplica la política. Lo que no se devuelve se paga al anfitrión tras el plan, menos la comisión.
- **Cancela el anfitrión, no se celebra, o no llega al mínimo de grupo**: **reembolso del 100 % a todos**, sea cual sea la política. Si ya se había transferido, se revierte la transferencia (*transfer reversal*).
- **No presentarse**: no hay reembolso, y cuenta en la fiabilidad.
- **El reembolso** vuelve a la misma tarjeta en 5-10 días hábiles. Se avisa con una notificación y queda en el recibo.
- **La comisión**:
  - en un reembolso total se devuelve entera;
  - en uno parcial, solo se cobra sobre lo que se queda el anfitrión;
  - la comisión de la tarjeta que Stripe no devuelve la asume planes.

## Reclamaciones

- **Quién y cuándo**: quien pagó, desde Pagos ▸ *Tengo un problema*, mientras el dinero siga retenido o en las 48 h después del plan. Motivos: no se celebró, era muy distinto de lo anunciado, me han cobrado mal u otro.
- **Qué pasa al reclamar**:
  - el pago al anfitrión **se pausa**;
  - la reclamación entra en la cola del panel de moderación, con el pago enlazado;
  - el equipo decide *Reembolsar* (100 %, y el anfitrión no cobra) o *No procede* (sigue el pago al anfitrión);
  - en los dos casos se avisa a quien reclamó.
- **Si muchas personas reclaman el mismo plan**:
  - se retienen todos los pagos de ese plan;
  - se revisa al anfitrión, que puede perder la opción de organizar planes (ver confianza-y-seguridad.md).
- **Disputas con el banco** (*chargebacks*): llegan por webhook. Se responden con las pruebas (reserva, política aceptada, registro de llegada con QR) y se descuentan del anfitrión si procede.

## Alta y verificación de anfitriones

Para publicar un plan de pago hace falta tener la **identidad verificada** en planes y los **cobros activos**.

- **Ajustes ▸ Cobros**: se elige cobrar como *particular* o como *autónomo o empresa*, y se dan:
  - el nombre legal;
  - el DNI, NIE o NIF;
  - la dirección fiscal;
  - el IBAN.
- **En la app real**: se crea una **cuenta conectada** con el alta alojada por Stripe (las antiguas cuentas *Express*).
  - Stripe pide lo que le exige la normativa contra el blanqueo (fecha de nacimiento, documento si hace falta) y comprueba que la cuenta bancaria es del titular.
  - Se reutiliza la verificación de identidad de planes, pero Stripe puede pedir la suya.
- **Estados**:
  - *En revisión*;
  - *Activa*;
  - *Faltan datos*: el webhook `account.updated` trae `requirements`;
  - *Desactivada*.

  Sin la cuenta activa no se pueden publicar planes de pago, y si se desactiva, se pausan sus cobros.
- **Al crear un plan de pago**:
  - se ve lo que llega por plaza ("Por cada plaza de 20 € te llegan 17,00 €");
  - se elige la política de cancelación;
  - el plan siempre lleva reserva, nunca es "libre";
  - precio de 1 a 500 €.
- **Panel de cobros**:
  - cuánto hay retenido, en camino y pagado;
  - cada plan con sus reservas, ventas, comisión y neto;
  - las facturas de la comisión;
  - la cuenta de cobro (IBAN oculto).
- **Particulares**:
  - Se avisa de que, si organizan de forma habitual, deben darse de alta como autónomos.
  - Propuesta: un límite de planes de pago al mes para particulares.
- **DAC7**: planes debe informar cada año a Hacienda (modelo 238, en enero) de lo que cobra cada anfitrión, con:
  - su nombre, NIF, dirección, fecha de nacimiento e IBAN;
  - el número de planes y los importes de cada trimestre;
  - las comisiones.

  Se le comunica también al anfitrión. Por eso esos datos se piden en el alta.

## Recibos y facturas

- **Recibo de cada pago** (quien reserva):
  - número correlativo (`PL-2026-000118`), plan, organizador, fecha, forma de pago, importe y reembolsos;
  - "Cobrado por planes en nombre de {organizador}, a través de Stripe";
  - en Ajustes ▸ Pagos y en el email de confirmación, en PDF.
- **Factura de la entrada**:
  - Si el organizador es empresa o autónomo, la emite él, porque es quien vende el plan. Propuesta: que planes la emita en su nombre (facturación por cuenta de terceros, con su autorización), y que quien reserva pueda pedir la factura completa con su NIF.
  - Si es particular, no hay factura de la entrada: solo el recibo.
- **Factura de la comisión** (planes al anfitrión), **mensual**:
  - el concepto "Comisión por intermediación (15 %)";
  - las ventas del mes, la base, el IVA del 21 % y el total;
  - lo que se le ha pagado.

  La comisión ya está descontada, así que el anfitrión no paga nada aparte.
- **Numeración y conservación**:
  - series correlativas por emisor y año;
  - conservación de 4 años, o el plazo que marque la ley;
  - el sistema de facturación tiene que cumplir el reglamento de sistemas de facturación (VERI\*FACTU, con entrada en vigor prevista para 2027; hay que confirmar las fechas).
- **IVA de la entrada**: lo decide el organizador según la actividad. planes muestra el precio final, IVA incluido.

## Notificaciones nuevas

| Tipo | Cuándo |
|---|---|
| Pago | Pago confirmado (con el recibo), reembolso, reclamación resuelta, plaza que hay que pagar, reservas nuevas en tu plan, cobros activos, pago a tu cuenta |

## Servidor y Stripe

- **Webhooks** (con firma verificada e idempotentes):

  | Evento | Para qué |
  |---|---|
  | `payment_intent.succeeded` y `payment_intent.payment_failed` | Confirmar o descartar la reserva |
  | `charge.refunded` | Marcar el reembolso |
  | `charge.dispute.created` y `charge.dispute.closed` | Disputas con el banco |
  | `account.updated` | Estado de la cuenta del anfitrión |
  | `transfer.created` y `transfer.reversed` | Pagos al anfitrión y su reversión |
  | `payout.paid` y `payout.failed` | Llegada del dinero a su banco |

- **Libro de movimientos propio**: cada cobro, reembolso, transferencia y comisión es un apunte. Se concilia cada día con los informes de saldo de Stripe.
- **Proceso programado** cada hora:
  - libera los planes celebrados;
  - transfiere los que llevan 48 h sin reclamaciones;
  - cancela los que no llegan al mínimo de grupo y reembolsa;
  - caduca las plazas sin pagar a las 24 h.
- **Seguridad**:
  - claves de Stripe solo en el servidor;
  - claves restringidas por servicio;
  - cumplimiento PCI más sencillo (SAQ A), porque los datos de tarjeta nunca llegan a planes;
  - Radar de Stripe para el fraude con tarjetas.
- **Pruebas**: el modo de prueba de Stripe y sus tarjetas de prueba, las mismas que usa el prototipo:
  - 4242 4242 4242 4242: el pago sale bien;
  - 4000 0027 6000 3184: pide 3D Secure;
  - 4000 0000 0000 0002: el banco lo rechaza;
  - 4000 0000 0000 9995: sin fondos.

## API (borrador)

```
POST /planes/:id/reservas              → { client_secret }   (crea la inscripción y el PaymentIntent)
POST /pagos/:id/confirmacion           (lo confirma el webhook; la app solo consulta el estado)
GET  /pagos                            (tus pagos, con su estado y recibo)
GET  /pagos/:id/recibo.pdf
POST /pagos/:id/reclamacion            { motivo, texto }
GET  /metodos-pago · DELETE /metodos-pago/:id · PUT /metodos-pago/:id/principal
POST /cobros/cuenta                    → { url_alta }   (enlace al alta alojada por Stripe)
GET  /cobros                           (saldo retenido, en camino, pagado; ventas por plan)
GET  /cobros/facturas · GET /cobros/facturas/:mes.pdf
POST /webhooks/stripe
```
