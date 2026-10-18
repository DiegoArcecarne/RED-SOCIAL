# Definición de producto — App de planes

## Qué es

Una red social donde descubres un plan y la gente para hacerlo, estés donde estés. Une dos modelos que ya funcionan globalmente por separado y que nadie ha combinado limpiamente: la capa social de conocer gente haciendo algo real (Timeleft) y el marketplace de experiencias curadas con comisión (Fever). El hueco que ocupa es la intersección: Fever te vende la entrada pero vas solo; Timeleft te da la gente pero solo en formato cena. Aquí tienes el plan, la gente y la reserva en una sola superficie.

El usuario central es quien llega a una ciudad —de viaje, recién mudado, o un sábado aburrido en la suya— y no sabe qué hacer ni con quién. Desde un viajero solo hasta un grupo de amigos o una pareja buscando algo auténtico.

## Posicionamiento

Lo que la app es: el sitio para encontrar planes y gente con quien vivirlos. Amigos, experiencias, comunidad.

Lo que la app no es, y se defiende activamente: una app de ligar. Esa reputación de "aquí no se viene a enrollarse" es un activo que cuesta años ganar y se pierde en un día. En el momento en que se percibe como sitio de ligue, se espantan segmentos enteros y cambia el comportamiento: la gente entra a flirtear en vez de a hacer el plan. Por eso se lanza con cero señales de dating y se construye esa confianza primero.

## Disponibilidad global y visibilidad

La app está abierta globalmente desde el día uno. Cualquiera, en cualquier lugar, puede descargarla, crear un perfil, explorar y ver los planes de los perfiles que hayan decidido hacer su contenido público; publicar un plan o unirse a uno requiere antes verificar la identidad (ver onboarding). Madrid no es una restricción geográfica: es el foco del esfuerzo de siembra y marketing, donde se concentra la energía para encender la liquidez primero, pero la plataforma no le cierra la puerta a nadie en ningún sitio.

La visibilidad la controla cada usuario, modelo Instagram. Un perfil público expone sus planes, stories y aftermovies a cualquiera; uno privado solo a seguidores aprobados. El descubrimiento global —feed y planes de cualquier ciudad— se nutre del contenido marcado como público. El alcance es mundial; el control, individual.

## Modelo de seguidores

Grafo asimétrico, tipo Instagram: uno sigue a otro sin necesidad de aprobación mutua. No es un modelo de amistad simétrica donde ambas partes confirman. Seguir es unidireccional, lo que favorece el descubrimiento y la viralidad —cualquiera puede seguir a un anfitrión, a un local o a un perfil interesante sin que el otro tenga que devolver el gesto— y encaja con el alma de red de contenido (aftermovies, stories) más que con la de mensajería privada.

La privacidad se monta encima del grafo, no en lugar de él. En un perfil público, seguir es instantáneo y sin fricción. En un perfil privado, la solicitud de seguimiento requiere aprobación del titular, que es quien decide quién ve su contenido. Así, "asimétrico" no significa "sin control": el control vive en el ajuste público/privado y en los permisos granulares (quién puede seguirte, quién puede escribirte, quién puede unirse a tus planes), no en una reciprocidad obligatoria.

Seguidores y amigos son cosas distintas. Seguidor es quien te sigue, lo sigas tú o no. Amigo es quien te sigue y a quien sigues: el seguimiento mutuo. No hay solicitud de amistad aparte: en cuanto los dos os seguís, sois amigos, y si uno deja de seguir, dejáis de serlo. Esto permite dar tres niveles de audiencia en todos los controles de privacidad (todos, seguidores, amigos) sin añadir otra relación que gestionar. En el perfil de otra persona el botón lo refleja: "Seguir", "Seguir también" (te sigue y tú a ella no; aparece además la etiqueta "Te sigue"), "Siguiendo" o "Amigos".

Esta elección es coherente con el resto del producto: el grafo asimétrico alimenta el ranking de planes por afinidad (a quién sigues es señal de interés), la pestaña de Vividas y la distribución de aftermovies, mientras que las capas anti-acoso —modos de recepción de DMs, mención con aceptación previa, bloqueo— protegen el lado privado sin obligar a que seguir sea mutuo.

## La unidad atómica: el Plan

Cada Plan se define por estos atributos:

- Tipo: social gratuito o experiencia de pago.
- Tipo de inscripción: apuntado (requiere apuntarse; aforo limitado o de pago) o libre (no requiere apuntarse; p. ej. un atardecer abierto). Determina si hay lista de apuntados o solo asistencia real.
- Modo de aprobación (en planes apuntados): automática (quien se apunta entra, hasta completar aforo) o manual (el anfitrión —o los admins del grupo organizador— aceptan o rechazan cada solicitud de asistencia). En la creación se presenta como "asistencia libre" vs "con aprobación".
- Grupo organizador (opcional): un plan puede crearse dentro de un grupo; entonces sus admins son quienes aprueban las solicitudes.
- Categoría temática (taxonomía actualizable, ver sección de descubrimiento).
- Ubicación, fecha y hora.
- Tamaño de grupo: mínimo, máximo y apuntados ahora. Eje de búsqueda de primer nivel.
- Anfitrión verificado.
- Recurrencia: puntual o ancla recurrente.
- Objeto media: el post (foto o vídeo) que representa el plan.

**Novedades.** Cada plan lleva una sección de novedades: un registro de sus cambios (fecha, hora, lugar, cancelación, desvelo del lugar, plazas) y de los avisos del anfitrión, con el antes y el después en los cambios. Lo que publica el anfitrión, o lo que cambia, avisa a quienes se han apuntado; los cambios de fecha, hora o lugar y las cancelaciones llegan siempre, aunque se hayan desactivado las notificaciones de novedades. Especificación en [`docs/novedades.md`](docs/novedades.md).

Cada Plan vive en dos estados principales. Próximo: perecedero y reservable. Pasado: evergreen, convertido en aftermovie que alimenta el feed social y vende la siguiente edición del plan equivalente. Entre ambos hay un momento intermedio —el plan en curso, mientras se celebra— en el que se activan las stories en vivo y las herramientas de seguridad presencial (check-in, SOS, reporte desde el chat).

## Chispas: posibles planes

Antes de un plan muchas veces hay solo una idea: "Estoy pensando ir a pescar el sábado, ¿alguien se anima?". Una **chispa** es eso: un plan posible que se lanza para ver quién se anima. Si se anima suficiente gente, se convierte en plan con un toque; si no, caduca sola. Es la forma más ligera de crear un plan: no exige fecha exacta, lugar exacto ni pago.

- **Qué se configura**:
  - qué te apetece y cuéntalo;
  - tema;
  - cuándo: hoy, este finde, esta semana, un día concreto o "cuando nos cuadre";
  - dónde, de forma aproximada;
  - **plazas**: sin límite, o un máximo contando a quien la lanza;
  - **mínimo para hacerlo**;
  - **quién puede apuntarse**: cualquiera, seguidores o amigos;
  - "decido yo quién va";
  - **gastos**: gratis, a escote o cada uno lo suyo, con una nota opcional.
- **Configuraciones distintas según el tipo de plan**: cada tema propone la suya, y se puede cambiar.
  - Una ruta de outdoor: máximo 8 y gasolina a escote.
  - Un partido: mínimo 4.
  - Una cena: máximo 6 para reservar mesa.
  - Una visita cultural: grupos de 4.
  - Una fiesta: sin límite.
- **Respuestas**: "Me apunto" (hace falta estar verificado, como para ir a un plan) o "Quizás".
  - Si la chispa está abierta a cualquiera, "decido yo quién va" viene activado por defecto: el botón es "Quiero ir" y la respuesta llega como solicitud.
  - Con amigos o seguidores, "Me apunto" entra directo.
  - Quien la lanza puede cambiarlo.
- **Cuando se llega al mínimo**, quien la lanzó recibe "Ya sois 3: ¿lo hacemos?" y **Confirmar el plan** le pide solo lo que falta:
  - día y hora (con una propuesta según el "cuándo");
  - punto de encuentro;
  - lugar del mapa, opcional;
  - quién pasa al plan, con todos marcados.

  Con "Más opciones" se abre el formulario completo (foto, precio, grupo). No es automático por defecto: quien la confirma pasa a ser anfitrión, responde del plan y cuenta para su fiabilidad.
- **Opción automática**: al lanzarla, "Hacerlo plan automáticamente". Solo con día concreto y zona; al llegar al mínimo, el plan se crea solo.
- **Los apuntados confirman**: dijeron sí a algo vago ("este finde"), así que, cuando ya es plan con día, hora y punto de encuentro, reciben "Ya es plan: ¿vas?". Tienen 24 h para confirmar ("Sí, voy" o "No puedo"); si no, su plaza queda libre. Así el recuento del plan es honesto.
- **Dónde se ven**: en una tira "Chispas · ¿quién se anima?" arriba de Disponibles, y en Crear ▸ Chispa.
- **Seguridad**: pasan por los mismos filtros automáticos, se pueden reportar y respetan bloqueos y suspensiones. No llevan dirección exacta ni pago.
- **Caducidad**: en la fecha elegida o, sin fecha, a los 7 días.

El nombre "chispa" es provisional, como la marca.

## Los tres niveles de plan

Aquí vive toda la estrategia. Los tres niveles cumplen funciones distintas y no compiten entre sí.

Nivel 1 — Anclas recurrentes gratuitas. Planes que se repiten a hora fija, sembrados de rituales que ya existen en cada ciudad (el himno del Café Victoria en Burgos, la quedada de surf del amanecer, el mercado de los jueves, la sesión de un local los viernes). No se fabrica la quedada, se captura una que ya tiene gente. Es el motor de liquidez y, sobre todo, el activo que Fever no tiene: ningún plan gratis, ninguna capa de comunidad. Sin fricción, sin coste.

Nivel 2 — Planes gratuitos de usuarios. Cualquiera publica un plan. Sin depósito, fricción cero para no frenar la liquidez. El absentismo se gestiona con reputación (ver sección de confianza), no con dinero.

Nivel 3 — Experiencias de pago curadas. La oferta de calidad: vía API de Fever, vía contactos de eventos en Madrid, y vía producciones propias. Aquí vive la comisión (15% propio, en el extremo bajo del rango de mercado 15-30% estilo Fever) y los mecanismos de exclusividad. Incluye los planes de "lugar secreto" y los planes muy especiales.

## Arquitectura de contenido: las pestañas

Principio de interfaz: el contenido manda. La cabecera (marca, avisos, mensajes y pestañas) y la barra de navegación de abajo se esconden al deslizar hacia abajo y vuelven al deslizar hacia arriba, como en Instagram. Arriba del todo, al cambiar de pantalla y en los chats siempre se ven. Los filtros de Disponibles van plegados tras un botón "Filtros" con el número de filtros puestos; los activos se ven como chips que se quitan con un toque.

La app organiza el contenido en pestañas diferenciadas, no en una sola superficie mezclada. El eje estratégico son las dos primeras —Vividas y Disponibles—, que resuelven la tensión entre alma social y transacción: lo social y lo comercial en una misma superficie se canibalizan; separados, cada uno respira. Stories y Menciones son superficies de apoyo. Esta estructura, y en concreto sacar las stories de los círculos de arriba para darles pestaña propia, diferencia el producto de Instagram.

Pestaña "Vividas". El muro: feed evergreen de lo que la gente publica de los planes —fotos, carruseles, vídeos y aftermovies—, cada publicación ligada a su plan, ordenado por algoritmo de afinidad. Es la superficie de retención, adicción y viralidad. Cada 5-6 publicaciones se inyectan 1-2 planes disponibles, al estilo de los anuncios de Instagram, con dos reglas: emparejamiento contextual (si vienes de tres aftermovies de surf, el plan inyectado es de surf, así no se siente publicidad sino "esto puedo hacerlo yo") y densidad dinámica (más planes cuando estás físicamente en un destino con inventario vivo, menos cuando navegas desde casa por inspiración). La tarjeta inyectada lleva los disparadores de conversión: cuenta atrás, plazas restantes, quién va. Las stories destacadas y los directos en curso también aparecen integrados en este feed, en una tira "Ahora mismo", no como círculos en la cabecera.

Pestaña "Disponibles". Inventario perecedero, filtrable. Es la superficie de descubrimiento y conversión. Filtros: tamaño de grupo, tema, ubicación, edad, fecha, precio.

Pestaña "Stories". Las stories tienen pestaña propia en lugar de la fila de círculos de Instagram. Es el espacio del "ahora mismo": contenido efímero (24 h) de planes en marcha, ambiente en vivo, gente que ya está en el sitio. Arriba, los directos que se están emitiendo; debajo, las stories del día, una tarjeta por persona.

Pestaña "Menciones". Recoge las publicaciones, planes y stories en los que otros usuarios te mencionan o etiquetan. Una mención no aparece asociada a tu perfil hasta que la aceptas. Es a la vez una superficie de contenido y un control de privacidad: tú decides qué contenido ajeno se vincula a ti.

Organización del histórico por hashtags. Los planes pasados se mantienen en feeds tipo hashtag de Instagram (#himnovictoria, #atardecertorimbia, #rooftopmadrid). Esto da tres cosas: un hogar permanente y navegable para cada ancla recurrente, prueba social acumulada que vende la siguiente edición, y una superficie de descubrimiento indexable de cara a buscadores y agentes (ventaja GEO frente a apps que hoy son invisibles para ellos).

## Descubrimiento y algoritmo

No hay emparejamiento persona-persona. Nada de swipe ni de parejas. La compatibilidad para los planes íntimos pequeños la dan los filtros (edad, intereses, tamaño de grupo) y la reputación visible, no un algoritmo que empareja gente.

Sí hay ranking de planes por afinidad. El feed ordena planes según intereses declarados en el onboarding y comportamiento (qué planes ves, a cuáles te apuntas). Esto es relevancia de contenido, no matching de citas.

Taxonomía actualizable. Las categorías no se hard-codean. Estructura propuesta de arranque, revisable: outdoor y aventura, fiesta y vida nocturna, gastronomía, cultura, deporte, bienestar, social y networking, planes para viajeros. Las categorías se añaden, fusionan o jubilan según los datos de uso real.

## Modelo económico

Modelo de cobro tipo Booking (escrow). La plataforma cobra el evento, retiene el pago y lo libera al organizador después de que el evento se celebre. Si no se celebra, se reembolsa a los usuarios. Esto elimina el fraude del organizador que cobra y no aparece, y protege al usuario.

Política de cancelación y reembolso. Sobre el escrow se montan reglas claras, mostradas siempre antes de reservar:

- Cancelación del asistente, por niveles que elige el organizador al publicar (estilo Booking): flexible (reembolso íntegro hasta 24 h antes), moderada (íntegro hasta 48 h antes, 50% entre 48 y 24 h, sin reembolso dentro de 24 h) y estricta, para experiencias con coste de producción (íntegro hasta 7 días antes, después sin reembolso). Los umbrales concretos son ajustables. Lo que no se reembolsa se paga al anfitrión tras el plan, menos la comisión.
- Cancelación o no-show del anfitrión, o evento no celebrado: reembolso íntegro a todos los asistentes desde el escrow, con independencia de la política del plan, porque el dinero no llega al organizador hasta después del evento. El anfitrión sufre penalización de reputación; la reiteración retira su capacidad de organizar y, si hubo fraude, el pago se retiene y entra en la vía de moderación.
- Mínimo de grupo no alcanzado: si a la hora de corte el plan no llega a su tamaño mínimo, se cancela automáticamente y se reembolsa íntegro.
- Desvelo en planes gratuitos saturados o especiales: si el evento no se celebra, el micropago se reembolsa; si el usuario no se presenta, no se reembolsa, que es justo su función de filtro de compromiso.

Comisión sobre experiencias de pago. 15% propio, en el extremo bajo del rango de mercado 15-30% (Fever cobra en ese rango). Se elige el suelo del rango como palanca de captación de oferta: un 15% es más atractivo para organizadores y locales que la comisión de los marketplaces grandes, baja la barrera de entrada de la oferta de pago en el arranque y deja margen para subir más adelante si el producto lo justifica. Es la fuente principal de ingresos, concentrada en el Nivel 3.

Micropago de desvelo (1-2 €), solo plataforma. No es un peaje sobre planes gratis. Se aplica únicamente a eventos exclusivos, especiales o saturados: planes de mucha demanda y planes muy especiales donde el secreto es parte del producto (lugar secreto, ubicación revelada poco antes). Si el plan es de pago, no hay micropago de desvelo: la ubicación forma parte de la reserva y se gestiona dentro del flujo escrow. En planes gratuitos saturados o especiales, el micropago funciona además como filtro suave de compromiso: solo paga quien de verdad va a ir.

Cómo funciona (prototipo y especificación en [docs/pagos.md](docs/pagos.md)):

- Cobro con Stripe Connect, con cargos y transferencias separados: la plataforma cobra la reserva, la retiene hasta el plan y la transfiere al anfitrión 48 h después de celebrarse, si nadie reclama. Al anfitrión le llega el 85 %. La comisión del 15 % lleva el IVA incluido y de ella salen los costes de Stripe.
- Al reservar se ve siempre la política de cancelación. Se paga con Apple Pay, Google Pay o tarjeta (con 3D Secure). En los planes con aprobación y en la lista de espera no se cobra hasta que hay plaza; entonces hay 24 h para pagar.
- Reclamaciones ("Tengo un problema" en Ajustes ▸ Pagos): pausan el pago al anfitrión y van al panel de moderación, que reembolsa o no.
- Anfitriones: para publicar un plan de pago hace falta la identidad verificada y los cobros activos. En Ajustes ▸ Cobros se dan los datos fiscales y el IBAN, y Stripe verifica a la persona y la cuenta. El anfitrión ve lo retenido, lo que está en camino, lo pagado y la factura mensual de la comisión. Por DAC7, cada año se informa a Hacienda de lo que cobra cada anfitrión.
- Recibo de cada pago para quien reserva. La factura de la entrada la emite el organizador, si es empresa o autónomo; propuesta: emitirla en su nombre.
- Propuesta para el piloto: planes de pago solo de anfitriones profesionales y hasta 100 €. Los particulares que cobran, más adelante. Sin micropago de desvelo.

Fuentes de ingreso, resumidas: comisión de experiencias de pago (principal), micropago de desvelo en planes especiales/saturados, las capas de cuenta de negocio (CPA por asistente confirmado y suscripción de herramientas, ver sección propia) y, a futuro, la publicidad (espacios destacados o patrocinados de marcas y locales). Los planes gratuitos de usuario no generan ingreso directo: su trabajo es crear la red, el contenido y la retención.

## Publicidad

Tercera vía de ingresos, además de la comisión y el micropago de desvelo, y posterior: solo tiene sentido cuando hay audiencia e inventario de atención que vender. Las rails se diseñan ahora y la capa se activa en fase 2.

Formato nativo, el plan patrocinado. Usa el mismo hueco de inyección que los planes orgánicos (1-2 cada 5-6 publicaciones), claramente etiquetado. Como el contenido de la app son planes, un plan patrocinado es nativo y no rompe el feed: la experiencia es el anuncio, en la misma lógica de Fever.

Autoservicio tipo Meta Ads. Segmentación por ubicación, intereses, edad y categoría; presupuesto y puja; analíticas de campaña. El panel de autoservicio debe ofrecer ese nivel de control.

Dos niveles de anunciante. Marcas, locales y organizadores con campañas, y el "boost" de autoservicio para que cualquier anfitrión promocione su propio plan, al estilo de promocionar un post en Instagram. El boost es alto volumen y bajo ticket; las campañas de marca, bajo volumen y alto ticket.

Coexiste con la comisión. Un local puede listar un plan de pago (comisión sobre la venta) y además pagar por destacarlo (publicidad). Son ingresos distintos sobre la misma oferta.

Guardarraíl de confianza. La densidad de publicidad se limita y los anuncios son siempre nativos y etiquetados. Saturar de publicidad mata la confianza social, que es el activo central del producto; la regla es la misma que rige la inyección orgánica.

## Cuentas de negocio: particulares y empresas

Distinguir cuentas de particular y de empresa abre una vía de ingresos propia y, de paso, formaliza parte de la siembra de anclas, porque muchos de los mejores planes recurrentes los hospeda un negocio. El himno de la vermutería Victoria todas las noches a las diez es justo eso: un ritual recurrente, hospedado por un local, que llena el feed gratis y le da afluencia al negocio.

Por qué no cobrar por publicación. Cobrar por cada publicación penaliza la frecuencia, que es lo que más te interesa. Si el local tiene que pagar cada vez que publica su plan diario, dejará de publicarlo y perderás el ancla. La regla es al revés: publicar es gratis, y el dinero llega por el valor que la app genera al negocio, no por el acto de publicar.

Modelo en capas:

- Listado gratuito. Cualquier negocio reclama y verifica su perfil y publica planes sin coste. Mantiene el feed lleno y el arranque resuelto.
- Cobro por valor entregado. Comisión sobre los planes de pago (ya en el modelo) y, para los planes gratuitos que generan afluencia, pago por asistente confirmado que llega a través de la app, modelo CPA donde el negocio paga por resultados y no por publicar. El boost de la capa de publicidad cubre la visibilidad extra.
- Suscripción de herramientas. Cuota mensual para negocios que quieren panel de analíticas, programación de planes recurrentes, varios locales, integración de reservas y presencia de marca. Ingreso recurrente y predecible.

Distinción de producto, no solo de cobro. La cuenta de empresa lleva distintivo de negocio verificado, distinto de la verificación de identidad personal. Evita la suplantación de locales ("este es el perfil oficial de la Vermutería Victoria"), tiene campos propios (horario, dirección, categoría, web, enlace de reserva, varios planes recurrentes) y se etiqueta de forma diferenciada en el feed, para que el usuario sepa que es un plan oficial de un local y no una quedada espontánea de un particular.

Ventaja de confianza. Un plan en un local conocido y responsable es de menor riesgo que el plan privado de un desconocido: sitio público, negocio que responde. Las cuentas de negocio funcionan como rampa segura para quien se estrena y aún no se fía de quedar con extraños.

Ventaja de ejecución. Es el ingreso más ejecutable desde el día uno: vender cuentas de negocio verificadas a bares, restaurantes y locales es lo que ya se hace con hostelería en Madrid y Burgos. Siembra a la vez la oferta y la facturación.

## Confianza, seguridad y reputación

El núcleo del producto, no un disclaimer. Con desconocidos y, en parte, ocio nocturno, esto es lo que diferencia de un grupo de WhatsApp y justifica la comisión.

Verificación antes del primer plan. La identidad verificada no se exige en el alta, sino antes de unirse al primer plan o publicar uno (ver flujo de onboarding y la barrera del primer plan).

Reputación por estrellas, visible en todos los perfiles. Reseñas post-plan de anfitriones y asistentes.

Gestión de absentismo con dientes proactivos. Penalización por no asistir: menor alcance algorítmico, y en casos graves expulsión o bloqueo de cuenta. Para que el sistema actúe antes de la falta y no solo después, se recomienda:

- Índice de fiabilidad agregado en el perfil: número de eventos a los que el usuario no se presentó, sin desvelar qué eventos concretos. Nunca un registro público de las faltas específicas. Mismo efecto disuasorio, sin escarnio y sin riesgo RGPD.
- La reputación abre puertas: los planes especiales y saturados exigen una fiabilidad mínima para apuntarse. Aparecer a los planes gratis gana acceso a los buenos. Convierte el nivel gratuito en la rampa que construye la reputación del nivel de pago, y da consecuencia real a faltar sin necesidad de depósito.
- Reconfirmación el mismo día y lista de espera con sobreasignación, para que el recuento de asistentes sea honesto.

Confianza proporcional al tamaño del grupo. Más exigencia de verificación y reputación en planes pequeños e íntimos; más holgura en planes grandes, donde el anonimato relativo reduce la barrera de entrada.

Matching ligero por idioma e intereses para mejorar la calidad del grupo, sin emparejar personas.

## Perfil de usuario

Información pública del perfil: nombre y usuario, foto, biografía, ciudad o ubicación actual (opcional), idiomas, intereses y categorías favoritas, distintivo de identidad verificada, reputación por estrellas y reseñas, índice de fiabilidad e historial de planes (organizados y asistidos —estos últimos a partir de la asistencia real verificada por ubicación, sujeta a la privacidad de presencia de cada usuario), todo sujeto a la configuración de privacidad.

Editar perfil. Desde el propio perfil (botón "Editar perfil", junto a "Compartir perfil") y desde Ajustes. Se pueden cambiar la foto, el nombre, el nombre de usuario y la descripción; las cuentas profesionales, además, la categoría (de una lista cerrada), la web y la dirección. Cada campo muestra un contador "usados/máximo" y no deja pasar del límite (ver "Longitud de los textos"). El nombre de usuario se valida mientras se escribe: formato y disponibilidad. Recomendación para producción: limitar los cambios de nombre de usuario (por ejemplo, dos cada 14 días, como hace Instagram) y reservar el anterior durante un tiempo para evitar suplantaciones.

En el perfil de una cuenta profesional los datos de negocio se muestran sin etiquetas: la categoría en gris sobre la descripción, y la dirección y la web en una línea con iconos. El distintivo de cuenta profesional es solo un icono.

### Valoraciones de planes en el perfil

En el perfil se ven las valoraciones (estrellas y opinión) que la persona ha hecho de los planes a los que asistió, en una pestaña propia, "Valoraciones". Quien es dueño del perfil ve además los planes a los que asistió y aún no ha valorado, con un botón para valorarlos.

Cada valoración es pública o privada:

- Configuración general: por defecto, tus valoraciones son públicas o privadas (Ajustes ▸ Privacidad ▸ Valoraciones de planes).
- Por plan: cada valoración puede seguir la configuración general o marcarse pública o privada solo para ese plan. Se cambia desde la propia valoración en tu perfil.

Además, decides quién ve cada tipo:

- Las públicas: todos, solo tus seguidores o solo tus amigos.
- Las privadas: solo tus seguidores, solo tus amigos o solo tú.

Reglas que acompañan:

- A quien no puede ver una valoración no se le dice que existe ni cuántas hay ocultas, porque eso delataría a qué planes fue la persona.
- Si la asistencia a un plan se registró en privado, su valoración nace privada (recomendación): una valoración pública desvelaría la asistencia.
- La nota media de un plan cuenta todas las valoraciones, públicas y privadas, de forma anónima. La privacidad decide si la valoración aparece con tu nombre, no si cuenta.

### Longitud de los textos

Propuesta de límites, tomando como referencia lo habitual en redes sociales (Instagram: 30 caracteres en nombre y usuario, 150 en la biografía, 2.200 en el pie). El prototipo ya los aplica todos desde un único sitio.

| Texto | Máximo | Notas |
|---|---|---|
| Nombre | 30 | Obligatorio. Libre: mayúsculas, tildes y espacios. |
| Nombre de usuario | 3–30 | Único. Solo minúsculas, números, punto y guion bajo; sin punto al principio ni al final ni dos seguidos. |
| Descripción del perfil | 150 | Opcional. |
| Web (cuenta profesional) | 100 | Opcional. |
| Dirección (cuenta profesional) | 120 | Opcional. La categoría se elige de una lista. |
| Título de un plan | 60 | Cabe en la cuadrícula y en las notificaciones. |
| Descripción de un plan | 1.000 | |
| Pie de una publicación | 2.200 | Incluye menciones y hashtags. |
| Texto alternativo | 250 | Accesibilidad. |
| Comentario | 500 | |
| Opinión al valorar un plan | 500 | Junto a 1–5 estrellas. |
| Título de un directo | 60 | |
| Mensaje en el chat de un directo | 200 | |
| Mensaje (chat o directo) | 1.000 | |
| Nombre de un grupo | 50 | |
| Descripción de un grupo | 300 | |

Índice de fiabilidad. Se muestra de forma agregada: el número de eventos a los que el usuario no se presentó, sin desvelar cuáles. Nunca un registro público de faltas concretas.

Contenido propio. Aftermovies (posts permanentes en la pestaña Vividas) y stories (efímeras), con la visibilidad que marque la configuración del perfil.

## Agenda

Un calendario con tus planes, **aparte de las notificaciones y accesible desde ellas** (tarjeta *Tu agenda* arriba de Notificaciones) y desde la ficha de cada plan. Vistas de **día** (franja horaria), **semana** (por defecto), **mes** (cuadrícula con puntos) y **año** (doce meses en pequeño).

- Entra lo que vas a hacer (planes a los que vas y los que organizas), lo que está a medias (solicitud enviada, plaza por pagar o por confirmar, lista de espera, chispas con día) y tu historial (a los que fuiste y los cancelados). Cada entrada lleva su estado en texto y un estilo: firme, a medias, pasado o tachado.
- Se lleva al calendario del móvil: un plan o todos en un archivo .ics, o una **suscripción** personal y revocable que se actualiza sola si un plan cambia de hora o se cancela. Los planes secretos no muestran el lugar hasta que se desvela.

Especificación completa en [`docs/agenda.md`](docs/agenda.md).

## Asistencia real y privacidad de presencia

El funcionamiento detallado del bucle (lista de espera, reconfirmación, cancelaciones y reembolsos, llegada con el QR del anfitrión, fiabilidad, chat del plan y notificaciones) y lo que debe hacer el servidor está en [docs/bucle-de-planes.md](docs/bucle-de-planes.md).

Apuntarse y asistir son cosas distintas. Apuntarse es reservar plaza —solo en planes apuntados—; asistir es estar físicamente en el plan. La app verifica la asistencia real por geolocalización: cuando el usuario está en el lugar y la hora del plan, su presencia se detecta y se registra como asistencia real. Funciona igual en planes libres y apuntados, gratuitos o de pago.

Planes apuntados y planes libres. Un plan apuntado requiere apuntarse —aforo limitado o de pago— y mantiene su lista de apuntados, lista de espera y reconfirmación. Un plan libre no requiere apuntarse (un atardecer abierto, una quedada de ancla recurrente): no hay inscripción previa, solo asistencia real al llegar. En ambos casos, la asistencia verificada por ubicación es lo que cuenta como "estuvo allí".

Dónde se refleja la asistencia. En dos sitios: como número de asistentes reales del plan (recuento honesto, no estimado), y en el perfil del usuario, como historial de planes a los que ha asistido, que alimenta sus Vividas.

Privacidad de presencia, por asistencia. Cada usuario decide, para su asistencia, si es pública o privada. Pública: aparece listado entre los asistentes del plan. Privada: su asistencia solo es visible en su propio perfil y no se lista en el plan. Decisión de diseño: los asistentes en privado cuentan en el agregado del plan, pero no se muestran por identidad; así el recuento sigue siendo honesto sin exponer a quien no quiere aparecer. El valor por defecto lo fija el usuario en ajustes.

Quién está en el plan: chinchetas y saludos. Da igual ir solo o en grupo. Al llegar, cada persona elige para ese plan quién la ve en el plan y en el mapa (todos los del plan, solo amigos o nadie) y, si quiere, si va sola o en grupo. Mientras dura el plan, quienes han registrado la llegada se ven entre sí:

- como chinchetas en el punto del plan, con enlace a su perfil, en la ficha ("Aquí ahora") y en el mapa;
- nunca en su ubicación exacta.

Desde ahí se puede enviar un mensaje o solo un saludo: una chincheta animada que dice "yo también estoy en este plan". Es uno por persona y plan, y llega directo porque estar en el mismo plan cuenta como conoceros. En el chat del plan, "Estoy aquí" avisa a todo el grupo. Quien no está en el plan no ve a nadie, los bloqueos se respetan y al terminar el plan desaparece todo. Detalle en [docs/bucle-de-planes.md](docs/bucle-de-planes.md).

Umbral de anonimato en planes pequeños. Contar a los privados en el total tiene un límite: en un plan de cuatro personas con tres caras visibles, "4 asistentes" delata que hubo alguien más y, a menudo, quién. Por eso, por debajo de un umbral (propuesta: 10 asistentes) el plan solo cuenta y muestra a los asistentes visibles; a partir del umbral muestra el total real y cuántos fueron en privado. El valor exacto del umbral es una decisión abierta; el prototipo usa 10.

Método de verificación en el piloto (recomendación). La geolocalización automática implica ubicación en segundo plano, consentimientos RGPD, consumo de batería y riesgo de ubicación falseada. Para el piloto y el MVP se recomienda un check-in más barato y más difícil de falsear: un código QR que el anfitrión muestra en el sitio, o su confirmación manual. La geolocalización automática queda como objetivo de producto una vez validado el bucle.

Relación con el resto del modelo. La asistencia real verificada refuerza el recuento honesto que ya buscaban la reconfirmación del día y la lista de espera, y alimenta el índice de fiabilidad: asistir construye reputación; apuntarse y no aparecer es el no-show penalizable. La geolocalización para verificar asistencia es un consentimiento separado, ya previsto en el onboarding y revocable en ajustes (RGPD). La privacidad de presencia es independiente de que el perfil sea público o privado: un perfil público puede tener asistencias privadas, y un perfil privado restringe a seguidores aprobados todo su contenido, incluidas sus Vividas.

## Publicaciones

El detalle de subir fotos y vídeos, el menú de cada publicación, los perfiles privados con solicitudes de seguimiento, la búsqueda, los #temas y las menciones, y lo que debe hacer el servidor, está en [docs/social.md](docs/social.md).

Además de los aftermovies (planes pasados) y las stories, el usuario crea publicaciones de perfil en tres formatos: foto, vídeo o carrusel (varias imágenes). Comparten un mismo flujo de subida —selección de tipo, vista previa, pie de texto y publicar— y la capa de moderación en la subida. Las publicaciones viven en el grid del perfil; cuando proceden de un plan, alimentan también las Vividas. Su visibilidad la rige el perfil (público o privado), como el resto del contenido.

Dos tipos de publicación, según su origen. Al crearla se elige qué se comparte:

- Experiencia de un plan: va vinculada a un plan al que se asistió o que se creó. Enlaza al plan, aparece en su ficha y cuenta como prueba social del plan.
- Momento de tu vida: una foto, carrusel o vídeo sin plan (un viaje, la familia, un domingo cualquiera). Es lo que hace que la app sea también una red social de personas y no solo un escaparate de planes; da contexto sobre quién es cada uno antes de quedar.

Al entrar en el perfil de alguien, sus publicaciones se pueden filtrar en Todo, Planes y Su vida (con el número de cada una), y el muro tiene el mismo filtro (Todo, Planes, Vida). El origen no se guarda aparte: se deduce de si la publicación tiene un plan vinculado.

El flujo de creación incluye las opciones habituales de una red social, adaptadas a esta app: ubicación, etiquetado de personas, pie con menciones y hashtags, texto alternativo para accesibilidad, control de comentarios, ocultar el número de "me gusta", compartir además en stories y audiencia (público / solo seguidores / amigos). La opción propia y diferencial es vincular la publicación a un plan existente —al que se asistió o que se creó—, de modo que la publicación queda ligada a ese plan y refuerza su prueba social.

## Compartir publicaciones y planes

Cualquier publicación, propia o ajena, cualquier plan y cualquier perfil se pueden compartir desde el botón de compartir (en el plan, arriba a la derecha de su ficha; en tu perfil, "Compartir perfil"; en el de otra persona, en ⋯). Todos usan la misma hoja y las mismas opciones. Cambia el contenido de la vista previa:

- Publicación: autor, primera foto y pie. Enlace planes.app/p/….
- Plan: título, fecha, lugar y precio ("vie · 20:30 · Azotea Círculo · 18 €"), resumen y portada del plan. Enlace planes.app/plan/…. Si la ubicación es secreta, el enlace dice "Zona aproximada" y nunca la desvela. Al añadirlo a tu story sale como "¿Te vienes? …", con el botón "Ver el plan".
- Perfil: nombre, @usuario, descripción y primera foto pública. Enlace planes.app/u/…. De un perfil privado solo se enseña la cabecera. Dentro de la app llega como tarjeta del perfil.

Compartir planes es la forma natural de traer a amigos a un plan, así que el enlace de un plan abre su ficha con el botón para apuntarse; si no tienes la app, primero te lleva a descargarla.

Dentro de la app:

- Enviar a personas que sigues: se eligen una o varias y se añade un mensaje opcional (máximo 500). Llega como mensaje directo, así que depende de la mensajería.
- Añadir a tu story: la publicación aparece en tu story con su foto, su música y el crédito del autor ("Publicación de @usuario"), y enlaza a la original.

Fuera de la app (WhatsApp, Telegram, SMS, correo…):

- Se comparte un enlace público a la publicación (planes.app/p/…, dominio provisional como la marca). Ese enlace lleva una vista previa con imagen, igual que la imagen destacada de WordPress. Para ello, la página pública incluye etiquetas Open Graph:
  - og:title: en una publicación, "Autor en planes · Plan" (si está ligada a un plan); en un plan, su título.
  - og:description: en una publicación, el pie recortado a unos 120 caracteres; en un plan, "fecha · lugar · precio" y el resumen.
  - og:image: una imagen de 1200×630 generada a partir de la primera foto (o de la portada del plan), con el pie o el título, el autor o los datos del plan y la marca encima. Recomendado: JPEG de menos de 300 KB, para que WhatsApp la muestre siempre.
  - og:url y twitter:card = summary_large_image.
- "Compartir en otras apps" abre el menú de compartir del móvil con el título, el texto y el enlace. Se comparte el enlace (no la imagen) para que WhatsApp y compañía generen la vista previa a partir de la web pública.
- Botones directos para WhatsApp y Telegram, "Copiar enlace", "Imagen" (la imagen 1200×630 como archivo, para una story de Instagram; si el móvil no deja compartir archivos, se descarga) y "Código QR" (para enseñarlo en persona en un plan o imprimirlo en un local).
- La página pública enseña el contenido y un botón para abrirlo en la app o descargarla. Con enlaces universales (iOS) y App Links (Android), si la app está instalada se abre directamente en esa pantalla. Si no hay sesión, la app recuerda el destino y lleva a él al entrar o al terminar el registro.
- "planes" aparece también en el menú de compartir del móvil: fotos o un vídeo de la galería abren una publicación nueva con ellos; un enlace de planes abre esa pantalla.

El detalle de la web pública (etiquetas, imagen, indexación), los enlaces que abren la app y el menú nativo, y lo que deben hacer el servidor y la app, está en [docs/compartir.md](docs/compartir.md). El prototipo genera esa web para los datos de ejemplo en prototipo/web/.

Privacidad al compartir:

- Fuera solo se comparten publicaciones públicas: audiencia "Público" y perfil público. Si una publicación es para seguidores o amigos, o el perfil es privado, solo se puede enviar dentro de la app a quien ya puede verla. Las retiradas por moderación o en revisión tampoco tienen página pública.
- Si un enlace llega a quien no tiene permiso para verla, la vista previa sale genérica, sin foto ni texto.
- Propuesta: un ajuste para que cada persona decida si otros pueden compartir sus publicaciones fuera y en sus stories, como hace Instagram.

Cada vez que se comparte se registra el destino (chat, story, WhatsApp, Telegram, copiar enlace, imagen, código QR, hoja del sistema). Sirve para medir el crecimiento por recomendación.

## Stories: el "ahora mismo"

Stories y aftermovies son dos formatos con funciones distintas y complementarias, y van en pestañas separadas.

Stories: efímeras (24 h), en su propia pestaña y no en círculos de cabecera. Sirven para la inmediatez y el FOMO. Su mejor uso aquí es el tiempo real: "hay gente en el atardecer de Torimbia ahora mismo", "el rooftop está a tope". Una story desde un plan en marcha es prueba social en vivo que atrae a gente cercana en ese momento. Encaja con el alma "ahora mismo" del producto. Las destacadas pueden aflorar dentro del feed de Vividas.

Aftermovies: permanentes, en la pestaña Vividas y organizados por hashtags. Prueba social acumulada que vende la siguiente edición del plan.

La distinción es clara: stories para el ahora, efímeras, atracción inmediata; aftermovies permanentes, para descubrimiento y conversión. La visibilidad de ambas la rige el perfil (público o privado), con controles por pieza (por ejemplo, "mejores amigos" en stories).

## Directos

Un directo es una emisión en vivo desde un plan en marcha: el anfitrión o un asistente enseña el ambiente mientras ocurre. Es la forma más intensa del "ahora mismo": quien está cerca y lo ve puede acercarse o apuntarse a la siguiente edición, y quien está lejos lo vive y vuelve otra vez. Se ven arriba en la pestaña Stories ("En directo ahora") y en la tira "Ahora mismo" del muro, y cada directo enlaza a su plan.

Propuesta de reglas:

- Solo se emite desde un plan en marcha al que se asiste o que se organiza, y con la identidad verificada.
- El chat del directo sigue las reglas de la mensajería: bloqueo, reporte y moderación automática.
- Seguridad presencial: quien emite pide permiso antes de enfocar a alguien, y quien tiene su presencia en privado no debe salir. Un directo se puede reportar y la moderación puede cortarlo mientras se emite.
- Al terminar no se publica solo: quien emitió puede guardar fragmentos como publicación vinculada al plan.

## Música

Las publicaciones y las stories pueden llevar una canción, como en Instagram: se elige al crearlas desde un selector con buscador (canción, artista o ambiente) y filtros por ambiente, se puede escuchar antes de elegirla, y luego aparece bajo el nombre del autor ("Artista · Canción"). En el muro la música no suena sola: se activa al tocar la canción o el botón de sonido del vídeo. En las stories suena al abrirlas y se puede silenciar. Nunca suena con la app en segundo plano.

La música con derechos no es gratis ni automática. Usar canciones comerciales exige licencias de los titulares (discográficas y editoriales; en España, además, entidades de gestión como SGAE) o un proveedor que las agregue, y suele incluir restricciones por país y por tipo de cuenta. Propuesta, pendiente de revisión legal (esto no es asesoramiento jurídico):

- Empezar con una biblioteca libre de derechos o con licencia de un proveedor de música para redes sociales, y valorar el catálogo comercial más adelante, cuando el uso lo justifique.
- Las cuentas profesionales solo pueden usar música libre de derechos: el uso comercial (promocionar un local o un evento de pago) suele quedar fuera de las licencias de uso personal. El prototipo ya aplica esta regla en el selector.
- La música se guarda como referencia a una pista de la biblioteca, no como audio copiado en la publicación, para poder retirarla si cambia la licencia sin borrar la publicación.

En el prototipo las pistas son originales y ficticias, generadas en el propio navegador, sin archivos ni canciones reales.

## Grupos y roles

Los grupos son espacios de organización colectiva, al estilo de los grupos de mensajería, pensados para comunidades que montan planes de forma recurrente (un club de running, un grupo gastronómico). Un grupo tiene nombre, descripción y una lista de miembros, cada uno con un rol —administrador o miembro—, y puede tener varios administradores.

Autoridad de los admins. Los administradores gestionan el grupo y, sobre todo, aprueban las solicitudes de asistencia a los planes creados dentro del grupo. Cuando un plan con aprobación pertenece a un grupo, no decide solo su creador: cualquiera de los admins puede aceptar o rechazar las solicitudes. Esto reparte la carga de organización y da continuidad cuando el creador no está disponible.

Planes de grupo. Al crear un plan se puede asociar a un grupo del que seas admin. El plan hereda a los admins del grupo como aprobadores y aparece listado en la ficha del grupo, junto a su histórico de planes.

## Mensajería

Base modelo Instagram/TikTok, pero con capas anti-acoso reforzadas, porque la mensajería a desconocidos es el principal vector de abuso en una app de quedar en persona.

Dos tipos de conversación. El chat de plan es grupal y contextual: al unirte a un plan entras en su chat para coordinar, visible para el grupo y de riesgo bajo porque gira en torno a una actividad compartida. El mensaje directo es privado, de mayor riesgo, y se rige por los modos de recepción.

Tres modos de recepción de mensajes directos, que elige el usuario: cerrado (nadie te escribe en directo), bajo solicitud (los mensajes de quien no conoces caen en una bandeja de solicitudes que aceptas o rechazas, sin confirmación de lectura hasta que aceptas) y abierto (cualquiera te escribe). El valor por defecto es "bajo solicitud", no abierto: en una app de conocer desconocidos, abrir por defecto invita al acoso.

Un solo mensaje de presentación. Un desconocido solo puede enviar un primer mensaje-solicitud; no puede bombardearte hasta que respondas o aceptes. Es el patrón de Bondy, y corta de raíz el spam y el acoso por insistencia.

Pantalla de mensajes. Se abre desde el icono de mensajes de la barra superior, que lleva el número de conversaciones sin leer. Tiene tres pestañas:

- Chats: mensajes directos.
- Planes: el chat de cada plan al que te has unido.
- Solicitudes: mensajes de gente que no conoces, con su número.

Hay buscador y un botón para escribir un mensaje nuevo; también se escribe desde el botón "Mensaje" del perfil de cada persona. Cuando compartes una publicación o un plan "en planes", llega como mensaje con una tarjeta que lo abre.

- En una conversación directa se ve con quién hablas y vuestra relación (amigos, te sigue, le sigues). El menú ofrece ver perfil, reportar y bloquear.
- En el chat de un plan se ve el nombre de quien escribe, y arriba queda fijado el punto de encuentro con la fecha y un botón "Confirmo que voy" para la confirmación del día. Si la ubicación es secreta, el punto de encuentro se desvela el día del plan.
- Conocer a alguien, a efectos de mensajes, es seguirle o compartir un plan con él. Lo que llega de quien no conoces depende de tu modo de recepción:
  - en "bajo solicitud" llega a Solicitudes, y no se marca como leído ni se avisa de la lectura hasta que aceptas;
  - en "abierto" llega directamente;
  - en "cerrado" no llega.
- Una solicitud muestra el mensaje y cuatro acciones: Aceptar (pasa a Chats), Rechazar, Bloquear y Reportar. En la lista de Solicitudes se puede aceptar o rechazar sin abrirla, y hay "Rechazar todas". Las fotos de desconocidos llegan difuminadas, con un botón para verlas si quieres.
- Rechazar borra la solicitud sin avisar a quien la envió. Como solo se permite un mensaje de presentación, esa persona no puede mandar otra solicitud (propuesta: durante 30 días, o siempre si además se la bloquea).
- Reportar abre una lista corta de motivos, hecha para que sea rápido y para que moderación pueda priorizar:
  - spam o publicidad;
  - acoso, insultos u odio;
  - contenido sexual que no he pedido;
  - se hace pasar por otra persona;
  - estafa o fraude;
  - puede ser menor de edad;
  - amenazas, o me siento en peligro;
  - otro motivo.

  Por defecto se marca también "Bloquear", y se adjuntan los mensajes de la conversación como prueba. La persona reportada nunca sabe quién la ha reportado, y una solicitud reportada sale de la bandeja.
- Reportar y denunciar no son lo mismo. Reportar es avisar a moderación, dentro de la app. Denunciar es acudir a las autoridades. Si el motivo es "amenazas, o me siento en peligro", la app muestra un aviso: llamar al 112 si el peligro es inmediato, y cómo denunciarlo ante la Policía Nacional, la Guardia Civil o la policía autonómica. Además, se conserva la conversación como prueba y se colabora con las autoridades cuando lo piden (pendiente de revisión legal).
- Si escribes a alguien que no te conoce, se avisa de que tu mensaje le llegará como solicitud, y después de ese único mensaje la conversación queda en espera hasta que acepte.
- El modo de recepción se elige en Ajustes ▸ Mensajes, como "Mensajes de quien no conoces": No recibir, Como solicitud (por defecto y recomendado) o Directamente. También se llega desde la propia pestaña Solicitudes. Un mensaje admite hasta 1.000 caracteres.

Bloqueo y reporte integrados. Bloquear a alguien implica que no te ve, no te escribe y no puede unirse a tus planes. El reporte enlaza con la capa de moderación.

Medios controlados. Las imágenes y vídeos de desconocidos —fuera de la gente con la que ya tienes relación: a quien sigues o con quien compartes un plan— llegan con opt-in o difuminados, para frenar el contenido no solicitado. La detección de acoso y solicitación se apoya en la capa automática de moderación.

Espacio de coordinación en planes pequeños. En los planes de pocos participantes, la plataforma ofrece un espacio de coordinación enriquecido: punto de encuentro en el mapa, confirmación del día y recordatorio del contacto de confianza. La clave de diseño es mantener la coordinación dentro de la app para que nadie tenga que dar su teléfono ni sus datos personales a desconocidos; el intercambio de contacto queda voluntario y opcional, nunca forzado. Así, ese espacio para contactar y compartir información es una función de seguridad, no de exposición. Además, en planes pequeños el anfitrión puede pedir una breve presentación y aprobar quién entra, un filtro ligero coherente con la confianza proporcional al tamaño del grupo.

## Ajustes

Estructura del menú de ajustes:

- Cuenta: editar perfil, usuario, email, teléfono, idioma de la app.
- Privacidad: perfil público o privado, quién puede seguirte, quién puede escribirte, quién puede unirse a tus planes (todos, solo verificados, o solo con fiabilidad mínima), visibilidad de ubicación, visibilidad del historial, visibilidad de presencia por defecto (pública o privada).
- Seguridad: contraseña, verificación en dos pasos, dispositivos y sesiones activas, estado de verificación de identidad.
- Notificaciones, granular: planes cerca de ti, recordatorios y reconfirmación del día, mensajes, nuevos seguidores, actualizaciones de planes que sigues.
- Descubrimiento: intereses y categorías, rango de edad preferido, radio geográfico, idioma de los planes.
- Pagos: métodos de pago, historial de reservas, reembolsos, recibos y reclamaciones.
- Cobros (si organizas planes de pago): alta con datos fiscales e IBAN, lo retenido, lo que está en camino y lo pagado, y las facturas de la comisión.
- Tu seguridad: contactos de confianza y SOS, cuentas bloqueadas, tus reportes (con su estado) y estado de tu cuenta (decisiones de moderación sobre ti, con sus motivos y la opción de apelar).
- Tus datos y privacidad: descargar una copia de tus datos, consentimientos (con su historial), corregir tus datos, términos y política de privacidad, eliminar cuenta.

## Seguridad y verificación de cuenta

Conviene separar dos capas que cumplen funciones distintas y suelen confundirse.

Seguridad de acceso, que protege la cuenta. Contraseña robusta y verificación en dos pasos por SMS, app de autenticación (TOTP) o email. Verificación de email y teléfono en el alta. Gestión de sesiones y dispositivos, con cierre remoto.

Desde Ajustes ▸ Seguridad y acceso se cambia la contraseña, se activa o desactiva la verificación en dos pasos (app autenticadora, SMS o email), se ven y cierran las sesiones abiertas y se elimina la cuenta. Eliminar la cuenta desde la propia app es obligatorio en App Store y Google Play, y es un derecho RGPD.

Verificación de identidad, que protege a la comunidad. Es distinta del 2FA. Es el requisito de confianza para quedar con desconocidos: comprobación de documento y selfie antes del primer plan, que otorga el distintivo de verificado. Es lo que diferencia de un grupo de WhatsApp y lo que sostiene la seguridad de los encuentros presenciales.

## Edad, aceptación legal y datos

Edad mínima de 18 años, no negociable. La app facilita quedar con desconocidos en persona e incluye ocio nocturno; es un entorno solo para adultos. Verificación de edad en el alta, y la edad como factor de elegibilidad por plan (un plan de ocio nocturno hereda los límites legales de su jurisdicción).

Aceptación en el onboarding: términos y condiciones, política de privacidad, confirmación de edad y código de conducta de la comunidad (anti-acoso, normas de comportamiento). Consentimientos específicos y separados para uso de ubicación, datos de verificación de identidad y pagos.

Cumplimiento RGPD desde el diseño, al operar en España y la UE: consentimiento explícito, minimización de datos, y derechos de acceso, portabilidad y eliminación accesibles desde ajustes. En Ajustes ▸ Tus datos y privacidad se descarga una copia de todos tus datos (JSON legible por máquina; en la app real, con las fotos y los vídeos en un ZIP), se gestionan los consentimientos opcionales (novedades por email, ubicación, estadísticas) y la oposición a las recomendaciones por actividad (interés legítimo), y se elimina la cuenta, ofreciendo antes la descarga. Detalle y plazos en [docs/confianza-y-seguridad.md](docs/confianza-y-seguridad.md).

La facilitación de encuentros presenciales entre desconocidos conlleva responsabilidad legal real. Los términos deben abordar la limitación de responsabilidad de la plataforma, y conviene revisarlos con un abogado especializado antes de lanzar. Esto no es asesoramiento legal.

## Moderación y reportes

Es la pata de seguridad más crítica, porque aquí no se modera solo contenido: se modera comportamiento que termina en encuentros físicos entre desconocidos. Una incidencia grave puede hundir la marca, así que el sistema se diseña como núcleo, no como parche.

Qué se puede reportar. Un plan (falso, engañoso, inseguro, estafa, contenido inadecuado), un usuario o perfil (cuenta falsa, suplantación, acoso, sospecha de menor, comportamiento peligroso), un mensaje o chat (acoso, spam, amenazas, solicitación), un contenido concreto (story o aftermovie con desnudos, violencia, odio o material ilegal) y, lo propio de esta app, el comportamiento en un evento (no presentarse, acoso presencial, incidente de seguridad, o un anfitrión que tergiversó el plan).

Cómo se reporta. Botón de reporte accesible en un toque desde cualquier sitio: plan, perfil, mensaje, contenido. Selección de categoría, detalle opcional y evidencia opcional (captura, plan adjuntado automáticamente). El reportante queda anónimo frente al reportado. En categorías graves, el flujo ofrece de inmediato opciones y recursos de seguridad.

Tres capas de revisión. Primera, automática y proactiva: análisis de contenido en la subida (imágenes para desnudos o violencia, texto para odio, amenazas o patrones de estafa) y detección de patrones (reportes masivos, planes duplicados, señales de fraude, ubicación incoherente). Lo de alta confianza se retiene o bloquea solo. Segunda, revisión humana en cola priorizada por gravedad, con un SLA más estricto en lo que afecta a seguridad física. Tercera, escalado: incidentes graves del mundo real (agresión, sospecha de menor, amenaza creíble) van por una vía dedicada, con preservación de la cuenta y cooperación con autoridades cuando proceda.

Acciones graduadas. Aviso y retirada de contenido, reducción de alcance (ligada al sistema de reputación), suspensión temporal, y bloqueo permanente. Como la identidad está verificada, un bloqueo grave impide que esa identidad vuelva a registrarse fácilmente: es una ventaja real de exigir verificación. A un anfitrión problemático se le puede retirar la capacidad de organizar y, si el evento fue fraudulento, retener el pago en el escrow.

Capa de seguridad presencial, que es lo que diferencia de una red social normal. Herramientas dentro del plan en vivo: compartir tu plan con un contacto de confianza, confirmación de "he llegado bien", botón de emergencia o SOS, y poder reportar desde el propio chat del plan en marcha.

- Contactos de confianza: hasta 3 personas, aunque no usen la app. Aceptan por SMS. Se les puede compartir cada plan automáticamente, y la app puede preguntarte si estás bien al acabar y avisarles si no respondes.
- El botón SOS está en la ficha y en el chat de cada plan. Ofrece llamar al 112 o enviar una alerta con tu ubicación a tus contactos y al equipo de seguridad (24 horas), que la ve la primera en su panel. Responsabilidad del anfitrión: está verificado y responde del plan; reportes de seguridad reiterados sobre un anfitrión implican su retirada. La exigencia de verificación y reputación es mayor en los planes pequeños e íntimos, donde el riesgo es más alto.

Usos prohibidos con tolerancia cero. Cualquier indicio de menor en la plataforma se escala de inmediato, sin excepción: la app es solo para mayores de 18. Solicitación sexual, trata o uso del producto como tapadera para esos fines están prohibidos por política, con detección y reporte. Estafa y suplantación, igual. Estas políticas se publican en el código de conducta y se aplican.

Transparencia y apelación. Al usuario sancionado se le notifica la acción y el motivo, y existe un proceso de apelación. A escala, conviene publicar informes de transparencia periódicos. El objetivo es que la moderación se perciba como justa, no arbitraria.

Cómo funciona en el prototipo (y qué debe hacer el servidor, en [docs/confianza-y-seguridad.md](docs/confianza-y-seguridad.md)):

- Filtros automáticos al publicar comentarios, pies, mensajes, planes y la descripción del perfil:
  - Un insulto pregunta "¿Seguro que quieres publicarlo?" (Editar / Publicar igualmente). Si se publica, se muestra a menos gente y entra en la cola con prioridad baja.
  - Dar tu teléfono o email a quien no conoces avisa de que es más seguro el chat de la app.
  - Las amenazas, el odio y el spam se retienen: solo los ve quien los publicó, marcados "En revisión", hasta que los revisa una persona.
- Gravedad y plazo de respuesta: crítica (peligro, posible menor, amenaza), 1 hora; alta (acoso, sexual), 24 horas; media (estafa, suplantación), 48 horas; baja (spam, otro), 72 horas.
- Cada decisión lleva su exposición de motivos (qué, por qué, qué norma, si fue automática y cómo apelar), visible en Ajustes ▸ Estado de tu cuenta. Quien reportó recibe el resultado en Ajustes ▸ Tus reportes.
- Apelación en 6 meses, revisada por una persona distinta de la que decidió. También puede pedir otra revisión quien reportó, si se desestimó su reporte.
- El panel de moderación es una herramienta interna (en la app real, una web aparte con roles): cola por gravedad, alertas SOS primero, apelaciones e historial.

Señales proactivas que reducen la necesidad de moderar a posteriori: identidad verificada, reputación e índice de fiabilidad visibles, valoraciones de anfitriones, reseñas de planes y la reconfirmación del día, que evita recuentos de asistentes falsos.

## Flujo de onboarding

El principio rector es fricción mínima al entrar y verificación donde de verdad importa. Registrarse, navegar y seguir no exigen verificar identidad; esa barrera se levanta justo antes del primer plan. Así no se ahuyenta al curioso en la puerta, pero se mantiene la confianza en el momento en que hay un encuentro real en juego.

Paso 1 — Bienvenida sin pedir nada. La primera pantalla comunica el posicionamiento —planes y gente con quien vivirlos, no una app de ligar— y deja ver valor antes de pedir datos. Cero formularios por delante de la propuesta.

Paso 2 — Registro y seguridad de acceso. Alta por email o teléfono con contraseña, o login social. Verificación de email y teléfono por código (OTP) en el alta. La verificación en dos pasos (2FA) se ofrece aquí pero no se obliga; vive en Seguridad y protege la cuenta, no a la comunidad. El detalle de cada pantalla (validaciones, códigos que caducan a los 10 minutos, bloqueo tras 5 intentos, recuperación de la contraseña sin desvelar qué cuentas existen) y lo que debe hacer el servidor está en [docs/cuentas-y-acceso.md](docs/cuentas-y-acceso.md).

Paso 3 — Edad y aceptación legal. Confirmación de edad (18+, no negociable) y aceptación en bloque de términos, política de privacidad y código de conducta. Los consentimientos sensibles —ubicación, datos de verificación de identidad, pagos— se piden separados y de forma contextual cuando se necesitan, no todos de golpe aquí.

Paso 4 — Creación de perfil. Usuario y nombre, foto, biografía, idiomas y ciudad o ubicación actual (opcional). Es el perfil personal: público y sujeto a la configuración de privacidad. Aquí se explica, en una línea y sin pedir nada todavía, cómo funciona la confianza: "Para que te sientas seguro al compartir y al ir a planes, todas las personas que asisten a un plan o lo organizan han verificado su identidad. Para mirar, seguir y publicar no hace falta, y tú decides en todo momento quién ve tus publicaciones". La verificación se pide más tarde, en el primer gesto que la necesita (ver más abajo).

Paso 5 — Intereses y descubrimiento. El usuario elige sus categorías favoritas de la taxonomía y, opcionalmente, rango de edad preferido, radio geográfico e idioma de los planes. Esto alimenta el ranking por afinidad desde el primer scroll, para que el feed no arranque en frío.

Paso 6 — Ubicación (contextual). Se pide permiso de ubicación explicando para qué: planes cerca de ti y densidad dinámica de inyección. Es un consentimiento separado y rechazable; sin él la app funciona, solo pierde la capa "cerca de mí".

Paso 7 — Siembra del grafo asimétrico. Aquí el grafo asimétrico hace un trabajo que un modelo de amistad simétrica no podría: como seguir es unidireccional y no requiere aprobación, el onboarding sugiere a quién seguir —anclas recurrentes de tu ciudad, locales y anfitriones verificados, perfiles destacados— y el usuario sale ya siguiendo cosas, con un toque y sin esperar reciprocidad. El resultado es que la pestaña Vividas aterriza poblada desde el minuto cero. La siembra de anclas recurrentes y el grafo asimétrico se combinan justo aquí para matar la pantalla vacía.

Paso 8 — Aterrizaje. El usuario llega a Vividas, ya con contenido afín y gente a la que sigue. La verificación de identidad todavía no se ha pedido: puede explorar, seguir, ver stories y planes públicos. La barrera aparece en el siguiente gesto con consecuencia presencial.

## Verificación de identidad: la barrera del primer plan

La comprobación de documento y selfie no va en el alta, va como puerta justo cuando el usuario intenta unirse a su primer plan o publicar uno. La idea: la app se usa como red social sin fricción, pero para participar en encuentros reales hay que estar verificado.

Sin verificar se puede:

- Ver los planes: título, fecha, zona, precio, descripción y número de asistentes.
- Seguir, dar me gusta, comentar y guardar.
- Publicar (fotos, carruseles, vídeos, stories) y compartir.
- Escribir a quien ya te conoce: te sigue o compartís un plan.

Hace falta estar verificado para:

- Apuntarse, solicitar ir o registrar la llegada a un plan.
- Organizar un plan o emitir un directo desde un plan.
- Entrar al chat de un plan.
- Ver quién va a un plan (la lista de asistentes; el número se ve igual).
- Ver la ubicación exacta de los planes íntimos (hasta 8 personas) que no son en un negocio; hasta entonces se ve la zona aproximada. Los planes secretos siguen su propia regla.
- Escribir a quien no te conoce (solicitud de mensaje), que es el principal canal de acoso.
- Crear perfiles profesionales.

Cuando alguien sin verificar toca una de esas acciones, aparece una explicación breve, no un muro: el porqué (el texto del paso 4), qué se pide (documento y selfie, unos 2 minutos), que el documento no se enseña nunca (solo el distintivo) y que se hace una vez para siempre. Tiene dos botones, "Verificar ahora" y "Ahora no", y al verificarse se completa la acción que quería hacer.

Sobre el texto: conviene no decir que "todos los perfiles que ven las publicaciones están verificados", porque para mirar no hace falta verificarse y sería falso. La garantía es que quien asiste a un plan o lo organiza está verificado; sobre las publicaciones, lo que se promete es control (quién las ve) y que se puede cambiar en cualquier momento. En ese momento se lanza el flujo de verificación, que otorga el distintivo de verificado y queda ya hecho para siempre. Esto separa con claridad las dos capas: el 2FA protege el acceso a la cuenta; la verificación de identidad protege a la comunidad y condiciona la participación en encuentros reales. La exigencia se gradúa luego por tamaño de grupo: más rigor de verificación y reputación en planes pequeños e íntimos, más holgura en los grandes.

## Varios perfiles por persona

Una persona puede gestionar varios perfiles desde la misma cuenta, como en Instagram, con una regla: solo uno es personal. El perfil personal es el vinculado a su identidad verificada; los demás son profesionales: un local o negocio, o un organizador o marca.

- Máximo 5 perfiles por persona, contando el personal (propuesta).
- Los perfiles profesionales no se verifican con otro documento: heredan la identidad verificada de la persona que los gestiona. Por eso, para crear uno hay que estar verificado. El distintivo de negocio verificado es aparte (reclamar tu local).
- No se muestra públicamente quién gestiona un perfil profesional, pero sí que detrás hay una persona verificada ("Detrás hay una persona con identidad verificada"). Así cada plan publicado tiene a alguien real responsable, y una sanción a la persona alcanza a todos sus perfiles.
- No se puede tener un segundo perfil personal (por ejemplo, uno anónimo): rompería la confianza que da "una persona, un perfil personal verificado".
- Se cambia de perfil desde el propio perfil (tocando el @usuario) o desde Ajustes ▸ Tus perfiles, y se crea uno nuevo desde Crear ▸ Perfil profesional. El flujo de creación recuerda que ya tienes tu perfil personal y explica por qué se verifica.

## Flujo de publicación de un plan

Caso base: un particular publica un plan social gratuito (Nivel 2). Se anotan las variaciones para anclas recurrentes (Nivel 1) y experiencias de pago (Nivel 3).

Prerrequisito — Identidad verificada. Publicar exige el distintivo de verificado, porque el anfitrión responde del plan. Si el usuario no está verificado, el botón de crear dispara primero el flujo de verificación. En las cuentas de empresa el requisito equivalente es la verificación de negocio (distintivo de negocio verificado), no la verificación de identidad personal.

Paso 1 — Tipo de plan. Social gratuito o experiencia de pago. Las cuentas de empresa ven además la opción de ancla recurrente con programación.

Paso 2 — El media primero. Se sube el post —foto o vídeo— que representa el plan, porque es la unidad de contenido que vivirá en el feed y, más tarde, el germen del aftermovie. El plan se construye alrededor de su imagen, no al revés.

Paso 3 — Título, descripción y categoría. Texto del plan y una categoría de la taxonomía actualizable, que alimenta filtros y ranking.

Paso 4 — Ubicación, fecha y hora. Dirección sobre mapa y franja horaria. Recurrencia: puntual o ancla recurrente. La ubicación es visible por defecto; el plan con ubicación oculta y desvelo de pago (micropago de 1-2 €) es exclusivo de planes de plataforma especiales o saturados, no del publicador particular corriente.

Paso 5 — Tamaño de grupo. Mínimo, máximo y, en vivo, apuntados ahora. Es el eje de primer nivel y, además, regula la confianza: al fijar un grupo pequeño, el sistema sube la exigencia de verificación y reputación y habilita la aprobación manual de asistentes.

Paso 6 — Requisitos de asistentes. Edad (que hereda los límites legales de la jurisdicción si el plan es de ocio nocturno), idioma y, en planes especiales o saturados, umbral de fiabilidad mínimo. En planes pequeños, el anfitrión puede exigir una breve presentación y aprobar quién entra.

Paso 7 — Precio y cobro (solo Nivel 3). Si es de pago, se fija precio y entra el modelo escrow tipo Booking: la plataforma cobra, retiene y libera al organizador tras celebrarse el evento, con reembolso si no se celebra. La comisión propia es del 15%.

Paso 8 — Revisión y moderación en la subida. Antes de publicar, la capa automática analiza media y texto (desnudos, violencia, odio, amenazas, patrones de estafa) y señales de fraude o duplicado. Lo de alta confianza se retiene; el resto se publica.

Paso 9 — Publicación y distribución. El plan entra en estado Próximo: aparece en Disponibles (filtrable) y se inyecta contextualmente en Vividas de usuarios afines y cercanos. Y aquí el grafo asimétrico vuelve a trabajar: los seguidores del anfitrión reciben el plan sin que él tenga que seguirlos de vuelta, así que un buen anfitrión o un local acumula audiencia unidireccional y su alcance crece edición tras edición. Es distribución de creador a audiencia, no de amigos mutuos. Al publicar se crea el chat de plan grupal.

Ciclo de vida después de publicar. En estado Próximo el plan muestra cuenta atrás, plazas restantes y quién va; el día del evento se dispara la reconfirmación y la lista de espera con sobreasignación para que el recuento sea honesto. Durante el plan en marcha viven el chat grupal y las herramientas de seguridad presencial (contacto de confianza, check-in de "he llegado bien", botón SOS, reporte desde el propio chat). Al terminar, el plan pasa a estado Pasado: su media se convierte en aftermovie permanente en Vividas, organizado por su hashtag, que vende la siguiente edición; y se abren las reseñas post-plan por estrellas a anfitrión y asistentes, que actualizan la reputación visible y el índice de fiabilidad agregado.

## Capa de mapa y lugares

Hasta aquí la unidad atómica ha sido el Plan, que es perecedero. La capa de mapa introduce una segunda entidad, persistente y complementaria: el Lugar. Un plan ocurre, pasa y se convierte en aftermovie; un lugar permanece. El Café Victoria sigue ahí mañana aunque el himno de esta noche ya sea pasado. Separar las dos entidades es lo que permite acumular historia, prueba social y comunidad alrededor de un sitio físico, y es el puente natural hacia las cuentas de negocio.

### El Lugar como entidad

Un Lugar es un punto geográfico persistente con página propia. Hay dos clases:

- Lugares de negocio: bares, restaurantes, locales, salas —reclamables por su dueño y vinculables a una cuenta de empresa verificada.
- Lugares públicos o geográficos: una playa, un mirador, un parque, un paseo —no son de nadie, no se reclaman, pero existen como anclas de rituales (el atardecer de Torimbia, la quedada de surf del amanecer).

La página de un lugar agrega todo lo que ya define el producto, anclado a coordenadas: sus planes próximos, sus anclas recurrentes, su feed de aftermovies por hashtag (#himnovictoria), las stories en vivo de quien está ahí ahora mismo, y —en los lugares de negocio— la reputación y las reseñas. Esa reputación del lugar no es un sistema de reseñas aparte: la página agrega las reseñas de sus planes y de sus anfitriones, de modo que la valoración del local emerge de los eventos que realmente hospeda, no de opiniones sueltas sobre el sitio. El lugar es, en la práctica, el hogar permanente de cada ancla recurrente que ya mencionaba la organización por hashtags, ahora con domicilio en el mapa.

### El mapa como superficie de descubrimiento

El mapa es la tercera forma de descubrir, junto al feed de Vividas y la pestaña Disponibles, y la más potente cuando el usuario está físicamente en un destino. Resuelve la pregunta "qué hay cerca de mí ahora". Sobre él conviven dos capas que se corresponden con las dos entidades: los planes perecederos (pines con cuenta atrás, plazas y quién va) y los lugares permanentes (pines de sitios con sus anclas e historial). Encima, la capa del "ahora mismo": stories en vivo que afloran en el mapa como prueba social inmediata —hay gente en el rooftop ahora—, coherente con el alma de inmediatez de las stories.

El mapa hereda los mismos filtros que Disponibles (tamaño de grupo, tema, fecha, precio, edad) y respeta la densidad dinámica: más útil y más denso cuando estás en un sitio con inventario vivo, más de inspiración cuando navegas desde casa. Los planes de lugar secreto aparecen como zona aproximada, con la ubicación exacta revelada tras el desvelo de pago o poco antes del evento, sin romper el mecanismo de exclusividad ya definido.

Ventaja de confianza en el mapa: un plan anclado a un local conocido y responsable se lee como de menor riesgo que el de un punto privado de un desconocido. El mapa hace visible esa diferencia y funciona como rampa segura para quien se estrena —ve sitios públicos, con negocio que responde, antes de atreverse con planes íntimos.

### Reclamar tu local

Un lugar de negocio puede existir en el mapa antes de que su dueño llegue a la app: sembrado al capturar un ritual recurrente, o generado por la actividad de los usuarios. "Reclamar tu local" es el flujo por el que un negocio toma posesión de esa página y la convierte en su perfil oficial.

Paso 1 — Encontrar o crear el lugar. El negocio busca su local en el mapa. Si ya existe (porque la app capturó su ancla o los usuarios lo referenciaron), lo reclama; si no, lo crea.

Paso 2 — Verificación de negocio. Es distinta de la verificación de identidad personal: comprueba que quien reclama representa al negocio (por ejemplo, datos fiscales, prueba de titularidad o validación del domicilio). Otorga el distintivo de negocio verificado, que evita la suplantación: solo puede haber un perfil oficial por local ("este es el perfil oficial de la Vermutería Victoria").

Paso 3 — Ficha del lugar. La cuenta de empresa rellena los campos propios ya previstos: horario, dirección, categoría, web, enlace de reserva y sus varios planes recurrentes. La ficha queda diferenciada en el feed y en el mapa para que el usuario sepa que es un plan oficial de un local, no una quedada espontánea de un particular.

Paso 4 — Toma de control del histórico. Al reclamar, el negocio hereda lo que el lugar ya había acumulado —su hashtag, sus aftermovies, sus reseñas—, de modo que no parte de cero: recupera la prueba social que su ritual ya generaba en la app.

Una vez reclamado, el lugar vive dentro del modelo en capas de cuentas de negocio que ya está definido: listado gratuito de base (publicar es gratis, no se cobra por publicación, para no penalizar la frecuencia de las anclas), cobro por valor entregado (comisión del 15% en los planes de pago y CPA por asistente confirmado que llega vía la app en los gratuitos), y suscripción de herramientas (analíticas, programación de planes recurrentes, varios locales, integración de reservas y presencia de marca). Las anclas recurrentes hospedadas por el local —el himno de las diez— son el caso de uso central de esta capa: llenan el feed gratis, dan afluencia al negocio, y son lo más ejecutable de monetizar desde el día uno vendiendo cuentas verificadas a hostelería.

### Lugares públicos no reclamables

Los lugares geográficos sin dueño —la playa, el mirador— no se reclaman, pero siguen siendo anclas valiosas: hospedan rituales gratuitos (Nivel 1) y acumulan su propio feed por hashtag. No tienen perfil de negocio ni cobro asociado; su moderación y su mantenimiento recaen en la plataforma y en la comunidad. Son liquidez pura: contenido y quedadas sin coste ni titular, justo el activo que diferencia el producto de un marketplace de entradas.

## Capa de ligar (en standby)

Aparcada para el lanzamiento, apuntada para más adelante. Diseño cuando se active: opt-in, apagada por defecto, invisible salvo que el usuario la encienda, y con control de visibilidad por usuario (pública, privada, oculta). Cada usuario decide si la quiere accesible o si ni le aparece.

Condición de activación: solo después de consolidar la reputación de "aquí no se viene a ligar". Si se enseña antes, se pierde el posicionamiento de planes y amigos para siempre. Nota de diseño: el producto ya genera romance de forma orgánica —conoces a alguien haciendo algo real, sin swipe—, así que esta capa es azúcar opcional sobre un mecanismo que ya existe solo, no un pilar.

## Herramientas internas

El equipo opera la app desde un **panel de administración**: una web aparte, con acceso por roles (administración, moderación, soporte y análisis), 2FA obligatoria y un registro inmutable de cada acción. Especificación completa en [`docs/herramientas-internas.md`](docs/herramientas-internas.md).

- **Usuarios**: buscar, ver su estado (verificación, sanciones, reportes, fiabilidad), dar por buena o revocar la verificación con motivo, suspender por motivos de cuenta, enviar el enlace para restablecer la contraseña y dejar notas internas. Nunca se "entra como" un usuario ni se leen sus mensajes privados.
- **Planes**: filtrar (con reportes, en revisión, de pago, destacados), destacar en Descubrir (curaduría, nunca de pago), aprobar lo que retuvo el filtro, retirar o restaurar, y cancelar con reembolso completo a todos.
- **Verificación de negocios**: cola con los documentos (CIF, licencia, titularidad del local, seguro) para verificar, pedir lo que falta o rechazar. Al verificar, el negocio lleva la marca y, si reclamaba un lugar del mapa, el lugar pasa a ser suyo. Entra en la cola al crear un perfil profesional o reclamar un lugar.
- **Categorías**: crear, renombrar, fusionar (mueve sus planes y chispas) y jubilar, sin tocar el código.
- **Métricas del piloto**: la métrica principal (asistencias verificadas por semana), su evolución y el semáforo de las hipótesis H1-H6 del plan de validación, más la operación del momento (reportes, SOS, negocios por verificar, cobros).
- **Moderación**: acceso al panel de confianza y seguridad.

## Roadmap de lanzamiento

Validación low-code primero. Antes de construir la app: landing, grupo por ciudad y pasarela de pago, con planes sembrados a mano. Es como arrancó el ganador de la categoría (Timeleft llegó a 1 M€/mes de ingresos con Typeform, WhatsApp y Stripe antes de tecnología pesada). El objetivo es validar el bucle completo —la gente se apunta, paga, sube el aftermovie, vuelve— a coste casi cero. El plan detallado del piloto (hipótesis, herramientas, calendario de seis semanas, métricas y criterios para continuar o parar) está en [`docs/plan-validacion-madrid.md`](docs/plan-validacion-madrid.md).

Ciudad de ignición: Madrid. Con contacto ya abierto con Fever y contactos locales con acceso a eventos importantes, Madrid resuelve la parte más difícil (oferta de pago de calidad y diferencial real) y aporta densidad de demanda desde el día uno. Se enciende una ciudad primero y se prueba el bucle entero ahí; no se reparten tres a la vez para no diluir la liquidez.

Expansión: Burgos y Llanes después, con el playbook probado. Burgos como ciudad real de tamaño medio con raíces y relaciones locales, y con el flujo constante de viajeros del Camino de Santiago como usuarios sociales de paso. Llanes como prueba de la tesis de destino turístico estacional. Sirven para demostrar que el modelo funciona en tres arquetipos de densidad distintos.

Fever, en paralelo y por fases. Primero relación vía programa de afiliados (puerta de entrada). Después integración vía API transaccional para nutrir la pestaña de pago con inventario Fever reservable in-app y comisión compartida. El producto debe estar definido y, idealmente, con audiencia demostrable antes de la conversación seria de API. El activo propio que no depende de Fever: el grafo social, la comunidad, el motor de aftermovies y las anclas recurrentes gratuitas. Hay un borrador de propuesta, pendiente de completar con los datos del piloto, en [`docs/borrador-propuesta-fever.md`](docs/borrador-propuesta-fever.md).

## Alcance del MVP (propuesta)

Este documento describe el producto completo. Para lanzar, la recomendación es construir solo lo que necesita el bucle central —descubrir un plan, apuntarse, ir y volver— y dejar el resto para cuando haya datos de uso. Es una propuesta pendiente de confirmar.

Dentro del MVP:

- Planes: crear, descubrir (feed con filtros de tema, fecha y tamaño de grupo) y ficha de detalle.
- Inscripción: plan libre o con aprobación, lista de apuntados y reconfirmación del día.
- Asistencia: check-in por QR del anfitrión e índice de fiabilidad.
- Confianza: verificación de identidad antes del primer plan, reseñas post-plan, reporte y bloqueo.
- Pagos: planes de pago con escrow y comisión del 15%.
- Chat de grupo de cada plan.
- Aftermovie: subir fotos de un plan pasado a su hashtag.
- Locales: publican sus anclas como cualquier anfitrión, con el distintivo de negocio verificado concedido a mano.
- Compartir fuera de la app: enlace público con vista previa e imagen (Open Graph) para WhatsApp y similares. Es barato y es el principal canal de crecimiento en el piloto.

Fuera del MVP (fase 2 o posterior): mensajes directos, stories, directos, música en publicaciones y stories, menciones, grupos con roles, opciones avanzadas de publicación, mapa de lugares y "reclamar tu local", monetización de cuentas de negocio (CPA, suscripción, panel), publicidad y boost, micropago de desvelo, geolocalización automática y capa de ligar.

Criterio para sumar funcionalidades: una entra cuando una métrica del piloto muestra que el bucle se rompe sin ella.

## Métricas

Métrica principal: asistencias reales verificadas por semana en la ciudad. Resume oferta, demanda y confianza en un solo número: solo sube si hay planes, si la gente se apunta y si aparece.

Embudo del bucle:

| Métrica | Definición | Qué indica |
|---|---|---|
| Activación | % de registrados que se apuntan a su primer plan en 14 días | Si la propuesta convence |
| Tasa de asistencia | Asistencias verificadas ÷ apuntados | Si el compromiso es real (el problema del no-show) |
| Repetición | % de asistentes que van a otro plan en 30 días | Si el producto engancha, el factor decisivo |
| Liquidez | % de planes publicados que alcanzan su mínimo de grupo | Si hay masa crítica |
| Conversión a pago | % de usuarios activos que reservan un plan de pago en 60 días | Si existe el negocio |
| Calidad | Valoración media post-plan y reportes por cada 100 asistencias | Si la experiencia y la seguridad aguantan |
| Contenido | % de planes pasados con aftermovie | Si el motor de contenido funciona |

Los objetivos concretos de cada métrica se fijan en el plan de validación.

## Economía unitaria (modelo a validar)

- Ingreso por reserva de pago = precio medio × 15%.
- Contribución por reserva = ingreso − coste de la pasarela de pago − reembolsos e incidencias.
- Valor de un usuario (LTV) ≈ reservas de pago por usuario y año × contribución por reserva × años de vida del usuario.
- Condición de viabilidad: el LTV debe quedar claramente por encima del coste de adquirir un usuario activo (CAC); la referencia habitual es al menos tres veces.

Ejemplo ilustrativo, con supuestos inventados solo para mostrar el cálculo (no es una previsión): precio medio 20 €, comisión 3 €, coste de pasarela unos 0,60 €, contribución unos 2,40 € por reserva. Con 4 reservas de pago al año y 2 años de vida, el LTV ronda los 19 €, así que el CAC tendría que quedar por debajo de unos 6 €.

Lectura: con un 15% sobre tickets bajos, el margen por usuario es pequeño. El modelo depende de la frecuencia (las anclas recurrentes que traen de vuelta), de una adquisición barata (orgánica, locales, boca a boca) y de las vías de ingreso adicionales. El piloto debe medir el precio medio, la frecuencia y el CAC reales.

## Competencia

| Alternativa | Qué ofrece | Qué le falta frente a esta app |
|---|---|---|
| Timeleft | Cenas entre desconocidos en grupos pequeños, a día y hora fijos | Formato único (cena y copas); sin planes variados ni anclas gratuitas |
| Fever | Marketplace de experiencias y entradas, con producciones propias | Vas solo o con los tuyos: no hay capa social ni planes gratis |
| Meetup | Grupos y eventos organizados por comunidades | Foco en grupos estables y temáticos; poca capa de experiencias y de seguridad presencial |
| Bondy | App española de planes entre desconocidos | Al revisarla al inicio del proyecto: tracción limitada y sin monetización visible |
| Eventbrite | Venta de entradas de eventos de terceros | Es ticketing, no red social |
| Bumble For Friends | Hacer amigos con emparejamiento uno a uno | Swipe entre personas; aquí el centro es el plan, sin emparejar |
| GetYourGuide, Airbnb Experiences | Actividades turísticas de pago | Turismo de pago; sin planes gratuitos ni comunidad local |
| Grupos de WhatsApp y Telegram | Gratis y ya instalados | Sin descubrimiento, verificación, reputación ni pagos |
| Plan&Go | App española de planes, cerrada pese a tener tracción | Aviso: la tracción sin monetización no basta |

El diferencial defendible es la combinación: plan, gente y reserva en una superficie; confianza diseñada como núcleo, y anclas recurrentes gratuitas que ningún marketplace tiene.

## Modelo de datos: entidades y relaciones

Primer modelo conceptual, derivado de los flujos anteriores. No es el esquema final de base de datos, sino el mapa de entidades y sus relaciones, para fijar el vocabulario y detectar huecos antes de implementar. Se agrupan por dominio. El diagrama entidad-relación está en [`docs/modelo-datos.md`](docs/modelo-datos.md).

### Identidad y cuenta

- Persona (titular). La persona real detrás de los perfiles: email, teléfono, contraseña y 2FA, fecha de nacimiento (18+) y verificación de identidad (documento y selfie). Gestiona uno o varios Usuarios (perfiles): exactamente uno personal y hasta cuatro profesionales. Las sanciones de moderación graves se aplican a la Persona, y por tanto a todos sus perfiles.
- Usuario (perfil). Pertenece a una Persona (persona_id); el tipo dice si es su perfil personal o uno profesional. Atributos: id, tipo (particular/usuario o profesional/empresa —la cuenta profesional lleva distintivo verificado de negocio; sus condiciones y precio son una decisión de negocio abierta), nombre (máx. 30), usuario (handle único, 3–30, minúsculas, números, punto y guion bajo), email, teléfono, hash de contraseña, fecha de nacimiento (gate 18+), idioma de la app, foto, biografía (máx. 150), preferencias de valoraciones (por defecto pública o privada; quién ve las públicas: todos / seguidores / amigos; quién ve las privadas: seguidores / amigos / solo yo), ciudad o ubicación actual (opcional), idiomas hablados, intereses y categorías favoritas, perfil público o privado, visibilidad de presencia por defecto (pública o privada), modo de recepción de DMs (cerrado / bajo solicitud / abierto, por defecto bajo solicitud), permisos (quién puede seguirte, escribirte, unirse a tus planes), reputación por estrellas (agregada), índice de fiabilidad (nº de no-shows, agregado, sin detalle de eventos), fecha de alta. Derivados: contadores de seguidores/seguidos, historial de planes.
- Cuenta de empresa. Especialización de Usuario con tipo = empresa. Campos propios: razón/nombre comercial, horario, dirección, categoría de negocio, web, enlace de reserva, distintivo de negocio verificado. Se vincula a uno o varios Lugares.
- Verificación de identidad. Atributos: usuario_id, proveedor, estado, referencias de documento y selfie, fecha, distintivo resultante. Es la barrera del primer plan; protege a la comunidad.
- Verificación de negocio. Atributos: cuenta_empresa_id, prueba de titularidad/datos fiscales, estado, distintivo. Distinta de la de identidad personal.
- Configuración de seguridad. 2FA (método: SMS / TOTP / email), y Sesión/Dispositivo (usuario_id, dispositivo, ubicación, última actividad, cierre remoto).
- Consentimiento. usuario_id, tipo (términos, privacidad, edad, código de conducta, ubicación, datos de verificación, pagos), versión, fecha. Soporta el cumplimiento RGPD y los consentimientos separados.

### Grafo social

- Seguimiento. seguidor_id, seguido_id, estado (activo o pendiente de aprobación si el perfil seguido es privado), fecha. Es asimétrico: la relación inversa no es obligatoria.
- Bloqueo. bloqueador_id, bloqueado_id, fecha. Implica no ver, no escribir y no poder unirse a planes del otro.

### Lugar

- Lugar. id, tipo (negocio o público/geográfico), nombre, coordenadas, dirección, categoría, hashtag asociado, estado (reclamado o no), propietario (cuenta_empresa_id, nulo en los públicos), campos de negocio cuando aplica (horario, web, enlace de reserva). Agrega —no almacena aparte— planes próximos, anclas recurrentes, aftermovies por hashtag y reseñas (heredadas de sus planes y anfitriones). Los públicos no reclamables no tienen propietario ni cobro.

### Plan y participación

- Plan. id, tipo (social gratuito o experiencia de pago), tipo de inscripción (apuntado o libre), modo de aprobación (automática o manual, solo en apuntados), grupo_id (grupo organizador, nulo si no aplica), nivel (1 ancla recurrente / 2 usuario gratuito / 3 pago curado), anfitrión_id (Usuario o Cuenta de empresa, verificado), lugar_id o ubicación libre, ubicación oculta (bool) con zona aproximada, categoría, título, descripción, media (post foto/vídeo), fecha y hora, recurrencia (puntual o regla de recurrencia), tamaño mínimo y máximo, duración en minutos (para la agenda; 2 h si no se indica), precio (nulo si gratuito), desvelo (importe, solo eventos especiales/saturados no de pago), requisitos de asistente (edad mínima, idioma, fiabilidad mínima, presentación requerida), política de cancelación (flexible / moderada / estricta), estado (próximo / en curso / pasado), hashtag, fecha de creación. Derivados: apuntados ahora, asistentes reales.
- Inscripción. Relación Usuario–Plan para la participación, solo en planes apuntados. plan_id, usuario_id, estado (solicitada, aprobada, rechazada, confirmada, en lista de espera con su posición, cancelada, cancelada tarde, asistió, no-show), reconfirmación del día (bool, con fecha), pago_id (nulo en planes gratuitos), importe reembolsado, fecha. Es la entidad donde viven la lista de espera con sobreasignación y la reconfirmación.
- Solicitud de asistencia. Relación Usuario–Plan en los planes con aprobación manual. plan_id, usuario_id, estado (pendiente, aceptada, rechazada), mensaje de presentación, fecha. La aceptan el anfitrión o los admins del grupo organizador; una solicitud aceptada equivale a una inscripción aprobada.
- Asistencia real. Relación Usuario–Plan que registra la asistencia verificada por geolocalización. plan_id, usuario_id, fecha y hora, método (QR del anfitrión en el piloto, marcada a mano por el anfitrión, o geolocalización más adelante), visibilidad (pública o privada). Es distinta de la Inscripción: un plan libre no tiene inscripciones pero sí asistencias reales; un plan apuntado tiene ambas. Alimenta el recuento de asistentes reales del plan y las Vividas del perfil; los registros con visibilidad privada no se listan por identidad y solo cuentan en el total a partir del umbral de anonimato.
- Pago. id, inscripción_id, usuario_id, importe, comisión (15% en planes de pago, IVA incluido), tipo (reserva de evento, desvelo, boost de publicidad, suscripción, CPA), estado (pendiente de pago, retenido, liberado, pagado al anfitrión, reembolsado, reembolso parcial, en revisión por reclamación), importe reembolsado y motivo, método de pago, número de recibo, id del PaymentIntent de Stripe, fecha de liberación, de pago al anfitrión y de reembolso. Centraliza el modelo escrow y las reglas de cancelación.
- Método de pago. usuario_id, marca, últimos 4 dígitos, caducidad, principal (bool). Los datos de la tarjeta los guarda Stripe.
- Cuenta de cobro. usuario_id (anfitrión), tipo (particular o autónomo/empresa), nombre legal, NIF, dirección fiscal, IBAN (cifrado), id de la cuenta conectada de Stripe, estado (en revisión, activa, faltan datos, desactivada).
- Transferencia. cuenta de cobro, plan, importe neto, fecha, id de Stripe; con su reversión si hay reembolso posterior.
- Factura. emisor, destinatario, serie y número, tipo (recibo de reserva, factura de la entrada, factura mensual de la comisión), base, IVA, total, fecha, PDF.
- Reseña. id, plan_id, autor_id, sujeto_id (anfitrión o asistente reseñado), estrellas, texto, fecha. Post-plan. Alimenta la reputación del usuario y, agregada, la del lugar.
- Valoración de plan. id, plan_id, autor_id (asistente), estrellas (1–5), opinión (máx. 500), visibilidad (pública / privada / nula = la configuración general del autor), fecha. Se muestra en la pestaña Valoraciones del perfil según las preferencias del autor (Usuario: valoraciones por defecto y audiencia de las públicas y de las privadas). Cuenta, anónima, en la media del plan.

### Grupos

- Grupo. id, nombre, descripción, media de portada, fecha de creación. Agrupa miembros y planes; es el espacio de organización colectiva.
- Miembro de grupo. Relación Usuario–Grupo con rol. grupo_id, usuario_id, rol (admin o miembro), fecha de alta. Un grupo puede tener varios admins; los admins aprueban las solicitudes de asistencia de los planes del grupo (Plan.grupo_id).

### Contenido

- Publicación. Post de perfil. id, autor_id, formato (foto / vídeo / carrusel), media (una foto, de 2 a 10 fotos, o un vídeo de hasta 60 s con su miniatura; sin metadatos de ubicación), pie de texto (con menciones @usuario y hashtags #tema), ubicación (lugar_id, opcional), usuarios etiquetados, plan vinculado (plan_id opcional; liga la publicación a un plan al que se asistió o que se creó, para que aparezca ligada a ese plan; si no lo tiene, es una publicación de la vida del usuario, y de ahí sale el filtro Planes / Su vida del perfil), texto alternativo (accesibilidad), audiencia (público / solo seguidores / amigos —seguimiento mutuo—, coherente con perfil público o privado), comentarios activos (bool), ocultar likes (bool), compartir en stories (bool), pista_id (música, opcional), likes, visibilidad, fecha. El aftermovie es una publicación especializada, ligada a un plan, que vive además en Vividas.
- Aftermovie. Post permanente. id, plan_id de origen, autor_id, media, hashtag(s), visibilidad (según perfil), fecha. Vive en la pestaña Vividas.
- Story. Efímera (24 h). id, autor_id, plan_id (opcional), media, pista_id (música, opcional), visibilidad (público / privado / mejores amigos), fecha de expiración. Vive en la pestaña Stories y puede aflorar destacada en Vividas.
- Directo. id, emisor_id, plan_id (plan en marcha), título, estado (en curso o finalizado), inicio, fin. Derivado: espectadores. Su chat reutiliza la mensajería y la moderación.
- Pista. Canción de la biblioteca de música. id, título, artista, ambiente, duración, origen de la licencia (libre de derechos / proveedor / catálogo comercial), países donde se puede usar, apta para cuentas profesionales (bool), estado (activa o retirada). Publicaciones y stories la referencian por pista_id; si se retira, la publicación se queda sin música pero no se borra.
- Compartido. id, publicación_id (o plan_id), usuario_id (quien comparte), destino (chat, story, whatsapp, telegram, copiar, imagen, sistema), destinatarios (si es un chat), fecha. Mide la difusión. La imagen para compartir (og:image) se genera y se guarda en caché por publicación, y se regenera si cambian el pie o la primera foto.
- Comentario. id, publicación_id, autor_id, texto, fecha. Solo cuando la publicación tiene los comentarios activos.
- Me gusta. usuario_id, publicación_id, fecha. El contador de la publicación se deriva de aquí; "ocultar likes" solo cambia lo que ven los demás.
- Guardado. usuario_id, publicación_id, fecha. Colección privada de cada usuario.
- Mención. id, tipo (etiqueta en una publicación, mención en el pie o en un comentario), contenido_id, autor_id, usuario_mencionado_id, estado (pendiente, aceptada, rechazada). No se asocia al perfil hasta aceptarse; aceptada, la publicación sale en el perfil ▸ Etiquetadas. Quién puede mencionar a cada usuario (todos, a quien sigue, nadie) vive en sus ajustes. Alimenta la pestaña Menciones.
- Hashtag. id, texto, lugar_id o ancla asociada (opcional). Agrupa aftermovies y organiza el histórico.

### Mensajería

- Conversación. id, tipo (chat de plan grupal o DM 1:1), plan_id (si es chat de plan), participantes, estado (aceptada, solicitud recibida o solicitud enviada; esta última admite un solo mensaje hasta que se acepta), no leídos por participante. El chat de plan se crea al publicar.
- Mensaje. id, conversación_id, autor_id, texto (máx. 1.000), media (foto; difuminada si el autor es un desconocido), contenido compartido (publicación o plan, opcional), estado (solicitud o aceptado — soporta el único mensaje de presentación y los modos de recepción), leído, fecha.

### Seguridad presencial y moderación

- Contacto de confianza. usuario_id, nombre, teléfono, estado (invitado, aceptado). Hasta 3 por usuario. Soporta "compartir tu plan", "he llegado bien" y el SOS.
- Evento de seguridad. usuario_id, plan_id, tipo (plan compartido, "he llegado bien", SOS, sin respuesta tras el plan), ubicación (en el SOS), estado (activa o cerrada, y por quién), avisado al 112, fecha.
- Reporte. id, reportante_id (anónimo frente al reportado), objeto (tipo: plan / usuario / mensaje / contenido / comportamiento en evento; objeto_id), categoría (spam, acoso, sexual no pedido, suplantación, estafa, posible menor, peligro, otro), detalle, evidencia (por ejemplo, los mensajes de la conversación), bloqueó también (bool), gravedad (la categoría "peligro" entra con prioridad máxima), estado (en cola, en revisión, resuelto, escalado), fecha.
- Reporte (además): origen (una persona o el filtro automático) y categoría del filtro (amenaza, odio, spam, insulto). Objetos: usuario, conversación, publicación, comentario, mensaje, plan.
- Acción de moderación. id, persona afectada, objeto, tipo (retenido por el filtro, retirada de contenido, aviso, reducción de alcance, retirada de capacidad de organizar, suspensión de 7 o 30 días, cierre de la cuenta, escalado a autoridades, retención de escrow), motivo y norma, exposición de motivos, automática (bool), estado (en revisión, vigente, anulada), fecha.
- Apelación. acción (o reporte, si apela quien reportó), texto, revisor (distinto de quien decidió), estado (pendiente, estimada, desestimada), fecha.
- Solicitud de datos (RGPD). persona_id, tipo (exportar, borrar, rectificar, oponerse, limitar), estado, enlace caducable, fechas.

### Monetización avanzada (fase 2)

- Suscripción de negocio. cuenta_empresa_id, tarifa, estado, periodo. Da acceso al panel de herramientas.
- Campaña / Boost. anunciante_id, tipo (campaña de marca o boost de un plan), plan_promocionado_id (en boost), segmentación (ubicación, intereses, edad, categoría), presupuesto, puja, estado, métricas. El plan patrocinado reutiliza el hueco de inyección orgánica.

### Soporte transversal

- Categoría. id, nombre, icono, orden, estado (activa, fusionada, jubilada) y en cuál se fusionó. Taxonomía actualizable desde el panel de administración; no se hard-codea.
- Verificación de negocio. cuenta de empresa, lugar que reclama (opcional), NIF, documentos (CIF, licencia de actividad, titularidad del local, seguro de responsabilidad civil), estado (pendiente, faltan documentos, verificado, rechazado), motivo, quién la decidió y fechas.
- Equipo y registro. Miembro del equipo (correo de trabajo, roles: administración, moderación, soporte, análisis; 2FA obligatoria), registro de cada acción del equipo (quién, rol, qué, sobre qué, antes y después, motivo, IP, fecha; solo inserción) y notas internas sobre usuarios. Ver [`docs/herramientas-internas.md`](docs/herramientas-internas.md).
- Métrica semanal. semana, ciudad, registros, activos, planes, apuntados y asistencias verificadas; agregada cada noche a partir de eventos de producto propios.
- Novedad del plan. plan_id, tipo (cambio de fecha u hora, de lugar, cancelación, desvelo, aviso, plazas, detalles), texto, antes y después, autor (anfitrión, admin del grupo o equipo), importante, estado (publicada o retirada), fecha. Junto con la última visita de cada usuario a cada plan, para marcar lo no visto.
- Suscripción de calendario. usuario_id, token (aleatorio, 128 bits), fecha de creación y de revocación. La agenda en sí no se guarda: se calcula a partir de inscripciones, solicitudes, pagos, listas de espera, invitaciones de chispas y asistencias.
- Notificación. usuario_id, tipo (recordatorio y reconfirmación, solicitud, mensaje, cambio en un plan, plaza de la lista de espera, después del plan, seguidor, mención y seguridad —resultado de tus reportes, decisiones de moderación y SOS—; y más adelante planes cerca), referencia (plan, conversación o ruta), texto, leída, fecha. Las preferencias por tipo viven en el Usuario. Los avisos de seguridad no se pueden desactivar.

### Relaciones clave, de un vistazo

- Un Usuario sigue a muchos Usuarios (Seguimiento, asimétrico) y puede bloquear a muchos (Bloqueo).
- Una Cuenta de empresa es dueña de uno o varios Lugares; un Lugar tiene como mucho un propietario (o ninguno, si es público).
- Un Lugar hospeda muchos Planes; un Plan ocurre en un Lugar (o ubicación libre).
- Un Plan tiene un anfitrión (Usuario o Empresa) y, si es apuntado, muchas Inscripciones; cada Inscripción enlaza un Usuario con un Plan y, si es de pago, con un Pago.
- Un Plan (libre o apuntado) acumula muchas Asistencias reales; cada Asistencia real enlaza un Usuario con un Plan, verificada por geolocalización y con visibilidad pública o privada. Alimenta el recuento del Plan y las Vividas del Usuario.
- Un Plan pasado genera un Aftermovie y abre Reseñas; las Reseñas alimentan la reputación del Usuario y, agregadas, la del Lugar.
- Un Plan con aprobación manual recibe Solicitudes de asistencia; las aceptan el anfitrión o, si el plan tiene grupo, los admins del Grupo.
- Un Grupo tiene muchos Miembros de grupo (Usuarios con rol admin o miembro) y muchos Planes; los admins aprueban las solicitudes de esos planes.
- Un Usuario crea muchas Publicaciones (foto, vídeo o carrusel) que viven en su perfil y en el muro; cada una recibe Comentarios y Me gusta.
- Un Plan en marcha puede tener Directos, emitidos por su anfitrión o por sus asistentes.
- Una Pista de la biblioteca puede sonar en muchas Publicaciones y Stories; cada una lleva como mucho una.
- Un Reporte apunta a cualquier objeto (Plan, Usuario, Mensaje, Contenido, comportamiento en evento) y puede derivar en Acciones de moderación; cada Acción se puede recurrir con una Apelación.

## Decisiones abiertas

- Taxonomía inicial concreta de categorías (la propuesta de arriba es punto de partida).
- Umbral de fiabilidad mínima para acceder a planes especiales/saturados.
- Cómo se reparte la comisión con Fever en los planes vía su API (la comisión propia ya está fijada en el 15%).
- Proveedor de verificación de identidad (documento y selfie) y proveedor de envío de códigos por SMS y email. Criterios en docs/cuentas-y-acceso.md.
- Precio de las capas de cuenta de negocio: importe del CPA por asistente confirmado y cuota de la suscripción de herramientas.
- Revisión legal de los términos: limitación de responsabilidad por encuentros presenciales, antes de lanzar.
- Nombre y marca (el "WanderMeet" del dosier previo es genérico y débil para SEO/GEO; pendiente de trabajar).
- Alcance del MVP: confirmar o ajustar la propuesta de la sección correspondiente.
- Umbral de anonimato de la presencia privada (propuesta: 10 asistentes, el valor que usa el prototipo).
- Método de check-in del piloto y del MVP: QR del anfitrión (recomendado) frente a geolocalización automática.
- Directos: confirmar quién puede emitir (solo anfitriones o también asistentes) y si se guardan al terminar.
- Música: biblioteca libre de derechos o proveedor con licencia para el lanzamiento, cuándo (y si) incorporar catálogo comercial, y revisión legal de las licencias por país y por tipo de cuenta.
- Valoraciones: confirmar las audiencias propuestas (públicas para todos, seguidores o amigos; privadas para seguidores, amigos o solo yo) y si una asistencia privada debe forzar la valoración privada.
- Amigos = seguimiento mutuo: confirmar o añadir más adelante una lista de "amigos cercanos" elegida a mano (como en Instagram), además de los mutuos.
- Longitud de los textos: confirmar los límites propuestos (nombre 30, usuario 3–30, descripción 150, título de plan 60…) y la frecuencia permitida para cambiar el nombre de usuario.
- Compartir: confirmar el ajuste "permitir que compartan mis publicaciones" y el dominio de los enlaces públicos (va con la marca).
- Varios perfiles: confirmar el máximo (propuesta: 5, uno personal) y si el perfil profesional muestra "detrás hay una persona verificada".
- Verificación: confirmar la lista de acciones que la piden, en especial escribir a desconocidos y el umbral de "plan íntimo" (hasta 8 personas) para ocultar la ubicación exacta.
- Objetivos numéricos de las métricas y criterios para continuar o parar tras el piloto (propuesta en el plan de validación).
