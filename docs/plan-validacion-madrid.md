# Plan de validación en Madrid · piloto low-code de 6 semanas

**Objetivo:** comprobar, antes de construir la app, que en Madrid la gente se apunta a planes con desconocidos, aparece, repite y, en parte, paga. Con herramientas gratuitas o casi gratuitas y planes sembrados a mano.

**Resultado:** un informe de una página con las métricas reales y la decisión de continuar, ajustar o parar. Ese informe también es la base de la conversación con Fever.

Los umbrales numéricos de este documento son **propuestas orientativas** para decidir con criterio; ajústalos antes de empezar si tienes referencias mejores.

---

## 1. Hipótesis y criterios de decisión

| # | Hipótesis | Cómo se mide | Verde (seguir) | Ámbar (ajustar) | Rojo (parar o pivotar) |
|---|---|---|---|---|---|
| H1 | Hay demanda de planes con desconocidos | Registros y % que se apunta a un plan en 14 días | ≥ 300 registros y ≥ 40% activación | 150–300 o 25–40% | < 150 o < 25% |
| H2 | Quien se apunta, aparece | Asistencias verificadas ÷ apuntados | Gratis ≥ 60%; pago ≥ 85% | Gratis 45–60% | Gratis < 45% |
| H3 | La experiencia engancha | % de asistentes que repite en 30 días | ≥ 30% | 15–30% | < 15% |
| H4 | Existe disposición a pagar | Plazas vendidas en los planes de pago | ≥ 70% del aforo | 40–70% | < 40% |
| H5 | El contenido se genera solo | % de planes con fotos subidas por asistentes | ≥ 50% | 25–50% | < 25% |
| H6 | La experiencia es segura y buena | Valoración media e incidencias | ≥ 4,3/5 y 0 incidentes graves | 4,0–4,3 | < 4,0 o cualquier incidente grave |

**Regla de decisión:**

- **Construir el MVP** si H2 y H3 están en verde y H4 da al menos ámbar.
- **Ajustar el formato y repetir 4 semanas** si H2 o H3 quedan en ámbar.
- **Parar o pivotar** (por ejemplo, a la vía B2B para hostelería) si H3 queda en rojo: sin repetición no hay producto, por mucha demanda inicial que haya.
- **H6 en rojo para el piloto en el acto**, sea cual sea el resto.

---

## 2. Herramientas (coste casi cero)

| Necesidad | Herramienta propuesta | Notas |
|---|---|---|
| Landing | Carrd, Framer o Notion; o GitHub Pages con el prototipo como escaparate | Una página: propuesta, próximos planes y botón de registro |
| Registro | Tally, Typeform o Google Forms | Incluye confirmación de mayoría de edad y consentimiento de datos (ver §8) |
| Comunidad | Comunidad de WhatsApp: un canal de anuncios y un grupo por plan | El grupo del plan se crea 48 h antes y se archiva después |
| Pagos | Stripe Payment Links | Cobras tú y pagas al organizador tras el evento (escrow manual). Consulta la facturación con tu gestor |
| Check-in | Un código QR por plan que abre un formulario de una pregunta ("código del día") | El anfitrión muestra el código en el sitio. Es la versión manual de la asistencia real verificada |
| Base de datos | Una hoja de cálculo (ver §6) | Única fuente de verdad para las métricas |
| Aftermovie | Álbum compartido por plan (Google Fotos o similar) | Pide las fotos en el mensaje posterior al plan |
| Valoraciones | Formulario de 3 preguntas tras cada plan | Valoración de 1 a 5, si repetirías, comentario |

---

## 3. Oferta: qué planes sembrar

Tres **anclas recurrentes semanales** (gratuitas, mismo día y hora, con un anfitrión responsable) y **uno o dos planes de pago al mes**. Son ejemplos para elegir según tus contactos:

| Tipo | Ejemplo | Por qué |
|---|---|---|
| Ancla en un local (gratis) | Afterwork del jueves en un bar colaborador | El local aporta público propio y un sitio seguro; tú aportas gente nueva |
| Ancla al aire libre (gratis) | Sábado por la mañana: running suave o paseo por el Retiro | Planes de bajo riesgo y fáciles para quien se estrena |
| Ancla abierta (libre) | Domingo al atardecer en el Templo de Debod | Formato "plan libre": no hace falta apuntarse, prueba el check-in sin inscripción |
| Plan de pago | Cena o experiencia con tu contacto de eventos | Mide la disposición a pagar y el ticket medio |

Reglas: siempre en sitios públicos o locales conocidos; un anfitrión de confianza en cada plan; aforo pequeño en los planes íntimos.

---

## 4. Demanda: cómo conseguir los primeros 300 registros

1. **Red propia y de los locales colaboradores.** Lo más barato y con más confianza.
2. **Comunidades internacionales y de recién llegados en Madrid** (expats, Erasmus, nómadas digitales): son exactamente el usuario central.
3. **Contenido de las propias quedadas** en Instagram y TikTok: el aftermovie es el anuncio.
4. **Prueba pequeña de anuncios en Meta** (100–200 €) en las semanas 5 y 6, solo para medir el coste por registro y por usuario activo. Es el dato que pide la economía unitaria.

Apunta el canal de origen de cada registro: sin eso no se puede calcular el coste de adquisición.

---

## 5. Calendario

| Semana | Qué se hace | Qué se mide |
|---|---|---|
| 0 · Preparación | Landing, formulario, comunidad de WhatsApp, Stripe, hoja de cálculo, normas de la comunidad. Cerrar 2–3 locales y anfitriones | — |
| 1–2 · Arranque | Lanzar las tres anclas. Captar los primeros 100 registros | Activación, tasa de asistencia |
| 3–4 · Consolidar | Mantener las anclas. Primer plan de pago. Empezar a pedir fotos | Repetición inicial, plazas vendidas, contenido |
| 5–6 · Escalar la prueba | Segundo plan de pago. Prueba de anuncios. 10 entrevistas a usuarios (5 que repiten y 5 que no volvieron) | Coste de adquisición, repetición a 30 días, valoraciones |
| Cierre | Informe de una página y decisión | Todas las hipótesis |

---

## 6. Estructura de la hoja de cálculo

| Pestaña | Columnas |
|---|---|
| Usuarios | id, fecha de alta, canal de origen, mayor de edad (sí/no), consentimiento (sí/no), idioma |
| Planes | id, nombre, tipo (ancla, libre o pago), fecha, anfitrión, aforo, precio |
| Inscripciones | usuario, plan, se apuntó (fecha), reconfirmó (sí/no), asistió (sí/no, del check-in) |
| Pagos | usuario, plan, importe, fecha, reembolsado (sí/no) |
| Valoraciones | usuario, plan, nota de 1 a 5, repetiría (sí/no), comentario |
| Incidencias | fecha, plan, gravedad, descripción, acción tomada |

Con esto salen todas las métricas de `PRODUCTO.md` (activación, asistencia, repetición, liquidez, conversión a pago, calidad y contenido).

---

## 7. Mensajes listos para usar

**Anuncio de un plan (canal de la comunidad):**
> Este jueves a las 20:00, afterwork en [local], [barrio]. Plan para conocer gente, sin compromiso. Grupo de [mín.]–[máx.] personas. Apúntate aquí: [enlace]. Habrá un anfitrión esperándote en la puerta.

**Recordatorio y reconfirmación (24 h antes, en el grupo del plan):**
> ¡Mañana nos vemos! Para tener el recuento real, responde "voy" antes de las 14:00. Si al final no puedes, dilo y liberas la plaza para alguien de la lista de espera.

**En el sitio (el anfitrión):**
> Bienvenidos. Escanead este código para marcar que habéis venido; tarda cinco segundos.

**Después del plan:**
> Gracias por venir. Dos cosas rápidas: valora el plan aquí ([enlace], 30 segundos) y, si tienes fotos, súbelas al álbum ([enlace]). El próximo [día] repetimos.

---

## 8. Mínimos legales y de seguridad

No es asesoramiento legal: antes de cobrar o de crecer, revisa esto con un abogado y con tu gestor.

- **Solo mayores de 18:** pregunta obligatoria en el registro.
- **Consentimiento de datos (RGPD):** en el formulario, para qué se usan los datos, cuánto tiempo se guardan y cómo pedir su borrado.
- **Normas de la comunidad:** respeto, cero acoso, "esto no es una app de ligar", y el anfitrión puede pedir a alguien que se vaya.
- **Canal de reporte:** un número o correo al que escribir si algo va mal, con respuesta el mismo día.
- **Pagos:** la plataforma cobra y reembolsa si el plan no se celebra; deja escrita esa política antes del primer cobro.

---

## 9. Presupuesto orientativo

| Partida | Coste |
|---|---|
| Dominio y landing | 0–20 € |
| Formularios, WhatsApp y hoja de cálculo | 0 € |
| Stripe | Comisión por transacción, sin cuota fija |
| Prueba de anuncios | 100–200 € |
| Imprevistos (material, impresión de los QR) | ~50 € |
| **Total** | **menos de 300 €** |

---

## 10. Riesgos y cómo reducirlos

| Riesgo | Mitigación |
|---|---|
| Poca demanda al inicio | Anclas en locales con público propio; empezar con planes pequeños que se llenan |
| Muchos no-shows | Reconfirmación el día anterior y lista de espera |
| Incidente de seguridad | Sitios públicos, anfitrión de confianza, normas claras, canal de reporte |
| Sobrecarga del fundador | Máximo 3 anclas; los anfitriones llevan sus planes |
| Datos incompletos | Registrar todo en la hoja desde el primer día, sobre todo el check-in y el canal de origen |
