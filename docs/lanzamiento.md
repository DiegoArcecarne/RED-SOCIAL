# Planes exclusivos de la app: lanzamiento y promoción

Mecánica para lanzar la app (y para promocionar planes después): un plan atractivo cuyas
entradas **solo se venden dentro de la app**, con **cuenta y verificación**. El plan hace de
anuncio y cada entrada vendida trae una persona registrada y verificada, que es justo lo que
necesita el piloto (`plan-validacion-madrid.md`, H1: registros y activación). El prototipo lo
simula en `prototipo/lanzamiento.js` con *Fiesta de lanzamiento de planes*.

## 1. Por qué funciona

- **Escasez y exclusividad**: "solo en la app" y una hora de apertura anunciada generan
  conversación y prisa (como un *drop*).
- **El registro es el precio de entrada**: no hay atajo. Quien quiere ir, se registra y se
  verifica; la verificación, que en otro momento es fricción, aquí es parte del valor (a tu
  nombre, sin reventa).
- **Se queda**: quien compra ya tiene la app, su agenda, el chat del plan y los planes de la
  semana siguiente. El lanzamiento no acaba en la fiesta.

## 2. Cómo es para quien llega

1. Ve el plan fuera (redes, carteles con QR, Fever, prensa). El enlace lleva a la **web pública**
   del plan: foto, fecha, lugar y "Entradas solo en la app", con el botón *Consigue tu entrada en
   la app* (sin precio de compra ni pasarela).
2. Abre la app (o la instala) y llega al plan: el destino se recuerda durante el registro.
3. **Antes de la venta**: ve cuándo abre, cuánta gente espera y pulsa *Avísame*. Si además está
   verificado, tiene **acceso anticipado** (por defecto, 24 h antes que el resto).
4. **Al abrir** (o al empezar su acceso anticipado) recibe un aviso y compra con el pago
   protegido de siempre. Hace falta la cuenta verificada.
5. Su entrada es **nominativa**: en la puerta, su QR de la app y su DNI.

## 3. Reglas

| Regla | Detalle |
|---|---|
| Canal único | Las entradas solo se venden en la app. Ni taquilla, ni otras webs, ni puntos de venta. Si hay entradas para prensa o invitados, se emiten también en la app, a nombre de cada persona |
| Cuenta verificada | Para comprar (y para el acceso anticipado). Mayores de 18 |
| Una por persona | Intransferible. Sin reventa: si no puede ir, la devuelve (según la política del plan) y pasa a la lista de espera |
| Apertura anunciada | Fecha y hora de apertura visibles desde el primer día; nadie compra antes, salvo el acceso anticipado |
| Acceso anticipado | Para quien está en la lista de aviso y verificado. Horas configurables (0 = sin anticipado) |
| Antifraude | Límite de compras por tarjeta y por dispositivo, y revisión de cuentas creadas en masa. Las cuentas verificadas el mismo día de la apertura pasan por revisión manual si hay señales raras |
| Puerta | QR firmado y de un solo uso, comprobado con la app del anfitrión, más DNI. Nombre y foto de la cuenta en la pantalla del escáner |

## 4. Qué se mide

- **Lista de aviso** (personas que pulsan *Avísame*) y su evolución hasta la apertura.
- **Registros desde el enlace del plan**: cada cuenta guarda de qué enlace viene
  (`CUENTA.origen`, por ejemplo `plan/<id>`).
- **Verificaciones** y **compras** por origen; tiempo hasta agotar.
- **Retención**: cuántos de los que compraron van a otro plan en 30 días (H3 del piloto).

El anfitrión ve en la ficha: personas esperando, registros que ha traído el enlace y entradas
vendidas. El equipo, en el panel de administración.

## 5. Datos y API

- `PLAN.exclusivo_app` (bool), `PLAN.apertura_venta` (fecha y hora), `PLAN.horas_anticipado`.
- `AVISO_VENTA`: persona, plan, fecha; con los avisos enviados (anticipado y apertura).
- `CUENTA.origen`: el enlace por el que llegó (plan, perfil, publicación o tema).

| Método | Ruta | Para qué |
|---|---|---|
| `POST` | `/planes/{id}/aviso-venta` | Apuntarse a la lista de aviso |
| `GET` | `/planes/{id}/venta` | Estado: cuándo abre, si puedes comprar ya, cuántos esperan |
| `POST` | `/planes/{id}/inscripcion` | Comprar: el servidor rechaza si no es tu momento, no estás verificado o ya tienes entrada |

Los avisos los envía una cola programada a la hora del acceso anticipado y a la de apertura.
La compra se hace con una reserva de plaza de pocos minutos para que la apertura no se
sobrevenda (la plaza se libera si el pago no se completa).

## 6. Otras estrategias (pendientes, sin hacer)

- **Bonos de descuento de marcas**: acuerdos con marcas y locales para regalar descuentos a quien
  se registra o va a un plan (por ejemplo, un 15 % en alquiler de bicis, la primera consumición
  o una entrada a mitad de precio). La marca consigue clientes que ya han demostrado ir a planes;
  la app, un motivo más para registrarse y repetir. Por definir: quién paga el descuento, cómo se
  canjea (código en la app o QR en el local), límite por persona y cómo se mide el canje sin
  rastreo fuera de la app.

## 7. Qué simula el prototipo

| En el prototipo | En la app real |
|---|---|
| Lista de aviso y registros con cifras de ejemplo | Cifras reales por origen |
| *Demo: abre la venta* | La hora de apertura |
| El registro guarda su origen en el navegador | En la cuenta, en el servidor |
