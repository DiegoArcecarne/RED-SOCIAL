# Recomendación por intereses y anuncios en Descubrir, sin píxeles

Especificación de cómo Plannet decide qué planes y publicaciones enseña a cada persona, y
dónde salen los anuncios en Descubrir, usando solo lo que pasa dentro de la app (issue #28).
El prototipo lo simula en `prototipo/recomendacion.js`; aquí se describe lo que tiene que
hacer el servidor. Los anuncios en la agenda y la promoción de planes están en
[`publicidad.md`](publicidad.md).

## 1. Principio

La conversión ocurre dentro de la app: apuntarse, pagar y llegar con el QR del anfitrión.
Por eso no hace falta un píxel para saber si un plan o un anuncio funcionó. Todo lo que
usamos lo apunta nuestra propia app en nuestro servidor, y la persona puede verlo, borrarlo
u oponerse.

## 2. Registro de eventos propio

| Evento | Datos | Base legal | Se guarda |
|---|---|---|---|
| Apuntarse, pagar, lista de espera, llegada con QR | plan, hora | Necesario para el servicio | Lo que dure la cuenta (es su historial de planes) |
| Guardar, valorar, compartir | plan o publicación, hora | Necesario para el servicio | Mientras no lo borre |
| Ver la ficha de un plan | plan, tema, hora | Interés legítimo (recomendación) | 90 días |
| Buscar | texto, hora | Interés legítimo | Las últimas 8 búsquedas, que la persona ve y borra |
| "No me interesa" y "Ver menos" | plan, publicación o tema, hora | Interés legítimo | Hasta que lo deshaga |
| Me gusta, comentarios | publicación | Necesario para el servicio | Mientras exista |
| Tiempo viendo una publicación | publicación, segundos | Consentimiento (*Estadísticas de uso*) | 30 días, agregado después |

- Nada de identificadores publicitarios del móvil, SDK de terceros ni datos de otras webs.
- Si la persona se opone a *Recomendaciones según tu actividad*, se dejan de guardar los
  eventos de interés legítimo y se borran los que había. El servicio sigue funcionando con
  el orden por fecha.
- El registro de cambios de consentimiento ya existe (`docs/confianza-y-seguridad.md`).

## 3. Recomendación: fase 1 (piloto), reglas a mano

Cada plan recibe puntos; se ordena de más a menos y se guardan los tres motivos con más
peso para "Por qué ves este plan".

| Señal | Puntos | Motivo que se enseña |
|---|---|---|
| Destacado por el equipo | +100 (siempre arriba) | Destacado por el equipo de Plannet |
| Fue a planes de ese tema (QR de llegada) | +4 | Has ido a planes de X |
| Eligió el tema en el onboarding o en Tus intereses | +3 | Elegiste X entre tus temas |
| Buscó algo que está en el título, tema o lugar | +3 | Buscaste «…» |
| Personas a las que sigue van y se dejan ver | +2 por persona, máx. +4 | Va Lucía, a quien sigues |
| Sigue al anfitrión | +2 | Sigues a X |
| Guarda publicaciones de planes de ese tema | +2 | Guardas publicaciones de planes de X |
| Es en las próximas 48 h / esta semana / dentro de más de 14 días | +2 / +1 / −1 | Es en los próximos dos días |
| Ha mirado 2 o más planes del tema en 30 días | +1,5 | Has mirado varios planes de X |
| Ocupación (apuntados / aforo) | hasta +1 | Lo están eligiendo: N personas apuntadas |
| Fiabilidad del anfitrión ≥ 97 % | +0,5 | Anfitrión con un N % de fiabilidad |
| Plan completo | −1 | — |
| Pidió ver menos de ese tema | −6 | Pediste ver menos planes de X |
| "No me interesa este plan" | Fuera de Disponibles y del muro | — (sigue saliendo si lo busca) |

- **Diversidad**: no más de 2 planes seguidos del mismo tema, salvo que no quede otro.
- **Arranque en frío**: con una cuenta nueva solo cuentan los temas del onboarding, la fecha
  y la ocupación. Un plan nuevo sin historial no pierde nada: la ocupación es la única señal
  de popularidad y pesa poco.
- **Publicaciones (Vividas)**: frescura (−1 punto por día), +2 si sigue al autor, +1,5 si es
  de un plan al que fue o de un tema suyo, hasta +1 por Me gusta (escala logarítmica),
  +0,5 si es de hoy, −4 si pidió ver menos de ese tema. "No me interesa" la quita.
- **Sin personalización**: Disponibles por fecha (los destacados primero) y Vividas de la
  más reciente a la más antigua.

## 4. Fase 2: modelo aprendido

Cuando haya datos suficientes (orientativo: varios miles de asistencias reales), sustituir
los puntos por un modelo que estime la probabilidad de apuntarse y de llegar, con pruebas
A/B contra las reglas de la fase 1. Se mantienen las reglas de diversidad, las señales
negativas y la lista de parámetros de la sección 6. No se usan nunca categorías especiales
de datos (salud, religión, orientación, política), ni directamente ni deducidas.

## 5. Anuncios en Descubrir

| Superficie | Densidad | Cómo se elige |
|---|---|---|
| **Vividas** | De cada dos huecos de plan inyectado (1 cada 5 publicaciones), como mucho uno es patrocinado: un anuncio cada 10 publicaciones. Nunca se añaden huecos | El tema de lo que se acaba de ver (+2) y los temas de la persona (+1), y la puja |
| **Búsqueda** | Como mucho uno, encima de los planes, y no se repite en los resultados | Solo si tiene que ver con lo buscado: palabras clave de la campaña, título o tema del plan (+3); después, temas de la persona y puja. Si no tiene que ver, no sale |
| **Agenda** | Ver `publicidad.md` | — |
| Disponibles, notificaciones, chats, novedades, videollamadas | Sin anuncios | — |

- Cada campaña elige sus superficies (`agenda`, `muro`, `busqueda`). Un plan promocionado
  por su anfitrión sale en las tres; las campañas de marca eligen.
- El tope de 3 veces al día por anuncio y persona es común a todas las superficies.
- Mismas reglas que en la agenda: "Patrocinado", quién paga, "Por qué lo ves" con los
  motivos y la superficie, *No me interesa este anuncio*, *No ver anuncios de…*, *Usar mis
  temas* y *Reportar*. No se anuncia un plan propio ni uno que ya está en tu agenda.
- **Segmentación para anunciantes**: ciudad, radio, tema, palabras clave de búsqueda y día
  u hora. Nada de edad ni de datos sensibles. Si un segmento tiene menos de 100 personas
  (umbral orientativo), no se puede elegir.
- **Medición**: veces visto por superficie, toques, y reservas y llegadas con QR atribuidas
  al anuncio si ocurren en los 7 días siguientes al toque. Todo agregado por anuncio y día;
  el anunciante nunca ve quién.
- **Recordatorio (retargeting) interno**: a quien guardó un plan se le puede recordar ese
  plan en su agenda, nunca fuera de la app.

## 6. Transparencia y control (DSA arts. 26 y 27)

- *Por qué ves este plan* en la ficha (los tres motivos), *Por qué veo esto* en el menú de
  cada publicación y *Por qué lo ves* en cada anuncio.
- *No me interesa* (plan o publicación) y *Ver menos planes de X*.
- **Ajustes ▸ Tus intereses**: activar o desactivar las recomendaciones (el mismo
  consentimiento que en *Tus datos*), editar los temas, ver los temas que cuentan por los
  planes a los que fue, deshacer lo descartado, la lista de parámetros y lo que nunca se
  usa, y borrar el historial de recomendación.
- Los términos de uso explican los parámetros principales (los de la sección 3) y la opción
  sin personalización.

## 7. Datos y API

Entidades nuevas en [`modelo-datos.md`](modelo-datos.md): `EVENTO_ACTIVIDAD`,
`PREFERENCIA_RECOMENDACION` y `ATRIBUCION_ANUNCIO`; `CAMPANA_BOOST` gana superficies,
palabras clave e impresiones por superficie.

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | `/me/descubrir/planes?filtros…` | Planes ordenados, cada uno con sus motivos |
| `GET` | `/me/vividas?cursor=` | Publicaciones ordenadas, con los huecos de plan y de anuncio ya colocados |
| `GET` | `/buscar?q=` | Resultados y, si encaja, el resultado patrocinado con sus motivos |
| `POST` | `/me/eventos` | Lote de eventos (vista, búsqueda); se ignora si la persona se opuso |
| `POST` | `/me/no-me-interesa` | Plan, publicación o tema (`menos`); `DELETE` para deshacer |
| `GET` / `PATCH` | `/me/intereses` | Temas, descartados y si se usan las recomendaciones |
| `DELETE` | `/me/eventos` | Borrar el historial de recomendación |
| `GET` | `/promociones/{id}/resultados` | Vistas por superficie, toques, reservas y llegadas atribuidas |

## 8. Métricas

- De los planes vistos en Descubrir: cuántos acaban en apuntarse y en llegada con QR.
- Retención semanal de quien llega a un plan desde Descubrir.
- Diversidad: temas distintos vistos y a los que se apunta cada persona al mes.
- Ingresos por cada 1.000 vistas en cada superficie.
- Quejas: "No me interesa", ocultaciones de anuncios y reportes por cada 1.000 vistas.
- Equilibrio: parte de los planes vistos que son de particulares y gratuitos frente a los
  de negocios y promocionados.

## 9. Pendiente de decidir

- Revisar con un abogado la base legal: interés legítimo para recomendar y para anuncios
  con temas propios, o consentimiento separado para estos últimos.
- El umbral de datos para pasar a la fase 2 y quién valida el modelo.
- Si Disponibles también lleva un plan patrocinado (hoy, no).
- El panel del anunciante para cuentas de negocio (campañas de marca con palabras clave),
  más allá de la promoción de un plan desde su ficha.
