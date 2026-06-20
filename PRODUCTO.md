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

Esta elección es coherente con el resto del producto: el grafo asimétrico alimenta el ranking de planes por afinidad (a quién sigues es señal de interés), la pestaña de Vividas y la distribución de aftermovies, mientras que las capas anti-acoso —modos de recepción de DMs, mención con aceptación previa, bloqueo— protegen el lado privado sin obligar a que seguir sea mutuo.

## La unidad atómica: el Plan

Cada Plan se define por estos atributos:

- Tipo: social gratuito o experiencia de pago.
- Categoría temática (taxonomía actualizable, ver sección de descubrimiento).
- Ubicación, fecha y hora.
- Tamaño de grupo: mínimo, máximo y apuntados ahora. Eje de búsqueda de primer nivel.
- Anfitrión verificado.
- Recurrencia: puntual o ancla recurrente.
- Objeto media: el post (foto o vídeo) que representa el plan.

Cada Plan vive en dos estados principales. Próximo: perecedero y reservable. Pasado: evergreen, convertido en aftermovie que alimenta el feed social y vende la siguiente edición del plan equivalente. Entre ambos hay un momento intermedio —el plan en curso, mientras se celebra— en el que se activan las stories en vivo y las herramientas de seguridad presencial (check-in, SOS, reporte desde el chat).

## Los tres niveles de plan

Aquí vive toda la estrategia. Los tres niveles cumplen funciones distintas y no compiten entre sí.

Nivel 1 — Anclas recurrentes gratuitas. Planes que se repiten a hora fija, sembrados de rituales que ya existen en cada ciudad (el himno del Café Victoria en Burgos, la quedada de surf del amanecer, el mercado de los jueves, la sesión de un local los viernes). No se fabrica la quedada, se captura una que ya tiene gente. Es el motor de liquidez y, sobre todo, el activo que Fever no tiene: ningún plan gratis, ninguna capa de comunidad. Sin fricción, sin coste.

Nivel 2 — Planes gratuitos de usuarios. Cualquiera publica un plan. Sin depósito, fricción cero para no frenar la liquidez. El absentismo se gestiona con reputación (ver sección de confianza), no con dinero.

Nivel 3 — Experiencias de pago curadas. La oferta de calidad: vía API de Fever, vía contactos de eventos en Madrid, y vía producciones propias. Aquí vive la comisión (15% propio, en el extremo bajo del rango de mercado 15-30% estilo Fever) y los mecanismos de exclusividad. Incluye los planes de "lugar secreto" y los planes muy especiales.

## Arquitectura de contenido: las pestañas

La app organiza el contenido en pestañas diferenciadas, no en una sola superficie mezclada. El eje estratégico son las dos primeras —Vividas y Disponibles—, que resuelven la tensión entre alma social y transacción: lo social y lo comercial en una misma superficie se canibalizan; separados, cada uno respira. Stories y Menciones son superficies de apoyo. Esta estructura, y en concreto sacar las stories de los círculos de arriba para darles pestaña propia, diferencia el producto de Instagram.

Pestaña "Vividas". Feed evergreen de aftermovies de planes pasados, ordenado por algoritmo de afinidad. Es la superficie de retención, adicción y viralidad. Cada 5-6 publicaciones se inyectan 1-2 planes disponibles, al estilo de los anuncios de Instagram, con dos reglas: emparejamiento contextual (si vienes de tres aftermovies de surf, el plan inyectado es de surf, así no se siente publicidad sino "esto puedo hacerlo yo") y densidad dinámica (más planes cuando estás físicamente en un destino con inventario vivo, menos cuando navegas desde casa por inspiración). La tarjeta inyectada lleva los disparadores de conversión: cuenta atrás, plazas restantes, quién va. Las stories destacadas también aparecen integradas en este feed, no como círculos en la cabecera.

Pestaña "Disponibles". Inventario perecedero, filtrable. Es la superficie de descubrimiento y conversión. Filtros: tamaño de grupo, tema, ubicación, edad, fecha, precio.

Pestaña "Stories". Las stories tienen pestaña propia en lugar de la fila de círculos de Instagram. Es el espacio del "ahora mismo": contenido efímero (24 h) de planes en marcha, ambiente en vivo, gente que ya está en el sitio.

Pestaña "Menciones". Recoge las publicaciones, planes y stories en los que otros usuarios te mencionan o etiquetan. Una mención no aparece asociada a tu perfil hasta que la aceptas. Es a la vez una superficie de contenido y un control de privacidad: tú decides qué contenido ajeno se vincula a ti.

Organización del histórico por hashtags. Los planes pasados se mantienen en feeds tipo hashtag de Instagram (#himnovictoria, #atardecertorimbia, #rooftopmadrid). Esto da tres cosas: un hogar permanente y navegable para cada ancla recurrente, prueba social acumulada que vende la siguiente edición, y una superficie de descubrimiento indexable de cara a buscadores y agentes (ventaja GEO frente a apps que hoy son invisibles para ellos).

## Descubrimiento y algoritmo

No hay emparejamiento persona-persona. Nada de swipe ni de parejas. La compatibilidad para los planes íntimos pequeños la dan los filtros (edad, intereses, tamaño de grupo) y la reputación visible, no un algoritmo que empareja gente.

Sí hay ranking de planes por afinidad. El feed ordena planes según intereses declarados en el onboarding y comportamiento (qué planes ves, a cuáles te apuntas). Esto es relevancia de contenido, no matching de citas.

Taxonomía actualizable. Las categorías no se hard-codean. Estructura propuesta de arranque, revisable: outdoor y aventura, fiesta y vida nocturna, gastronomía, cultura, deporte, bienestar, social y networking, planes para viajeros. Las categorías se añaden, fusionan o jubilan según los datos de uso real.

## Modelo económico

Modelo de cobro tipo Booking (escrow). La plataforma cobra el evento, retiene el pago y lo libera al organizador después de que el evento se celebre. Si no se celebra, se reembolsa a los usuarios. Esto elimina el fraude del organizador que cobra y no aparece, y protege al usuario.

Comisión sobre experiencias de pago. 15% propio, en el extremo bajo del rango de mercado 15-30% (Fever cobra en ese rango). Se elige el suelo del rango como palanca de captación de oferta: un 15% es más atractivo para organizadores y locales que la comisión de los marketplaces grandes, baja la barrera de entrada de la oferta de pago en el arranque y deja margen para subir más adelante si el producto lo justifica. Es la fuente principal de ingresos, concentrada en el Nivel 3.

Micropago de desvelo (1-2 €), solo plataforma. No es un peaje sobre planes gratis. Se aplica únicamente a planes de la plataforma de dos tipos: saturados o de mucha demanda, y planes muy especiales donde el secreto es parte del producto (lugar secreto, ubicación revelada poco antes). En planes de pago, el desvelo se integra en el flujo de reserva escrow. En planes gratuitos saturados, el micropago funciona además como filtro suave de compromiso: solo paga quien de verdad va a ir.

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

Información pública del perfil: nombre y usuario, foto, biografía, ciudad o ubicación actual (opcional), idiomas, intereses y categorías favoritas, distintivo de identidad verificada, reputación por estrellas y reseñas, índice de fiabilidad e historial de planes (organizados y asistidos), todo sujeto a la configuración de privacidad.

Índice de fiabilidad. Se muestra de forma agregada: el número de eventos a los que el usuario no se presentó, sin desvelar cuáles. Nunca un registro público de faltas concretas.

Contenido propio. Aftermovies (posts permanentes en la pestaña Vividas) y stories (efímeras), con la visibilidad que marque la configuración del perfil.

## Stories: el "ahora mismo"

Stories y aftermovies son dos formatos con funciones distintas y complementarias, y van en pestañas separadas.

Stories: efímeras (24 h), en su propia pestaña y no en círculos de cabecera. Sirven para la inmediatez y el FOMO. Su mejor uso aquí es el tiempo real: "hay gente en el atardecer de Torimbia ahora mismo", "el rooftop está a tope". Una story desde un plan en marcha es prueba social en vivo que atrae a gente cercana en ese momento. Encaja con el alma "ahora mismo" del producto. Las destacadas pueden aflorar dentro del feed de Vividas.

Aftermovies: permanentes, en la pestaña Vividas y organizados por hashtags. Prueba social acumulada que vende la siguiente edición del plan.

La distinción es clara: stories para el ahora, efímeras, atracción inmediata; aftermovies permanentes, para descubrimiento y conversión. La visibilidad de ambas la rige el perfil (público o privado), con controles por pieza (por ejemplo, "mejores amigos" en stories).

## Mensajería

Base modelo Instagram/TikTok, pero con capas anti-acoso reforzadas, porque la mensajería a desconocidos es el principal vector de abuso en una app de quedar en persona.

Dos tipos de conversación. El chat de plan es grupal y contextual: al unirte a un plan entras en su chat para coordinar, visible para el grupo y de riesgo bajo porque gira en torno a una actividad compartida. El mensaje directo es privado, de mayor riesgo, y se rige por los modos de recepción.

Tres modos de recepción de mensajes directos, que elige el usuario: cerrado (nadie te escribe en directo), bajo solicitud (los mensajes de quien no conoces caen en una bandeja de solicitudes que aceptas o rechazas, sin confirmación de lectura hasta que aceptas) y abierto (cualquiera te escribe). El valor por defecto es "bajo solicitud", no abierto: en una app de conocer desconocidos, abrir por defecto invita al acoso.

Un solo mensaje de presentación. Un desconocido solo puede enviar un primer mensaje-solicitud; no puede bombardearte hasta que respondas o aceptes. Es el patrón de Bondy, y corta de raíz el spam y el acoso por insistencia.

Bloqueo y reporte integrados. Bloquear a alguien implica que no te ve, no te escribe y no puede unirse a tus planes. El reporte enlaza con la capa de moderación.

Medios controlados. Las imágenes y vídeos de desconocidos —fuera de la gente con la que ya tienes relación: a quien sigues o con quien compartes un plan— llegan con opt-in o difuminados, para frenar el contenido no solicitado. La detección de acoso y solicitación se apoya en la capa automática de moderación.

Espacio de coordinación en planes pequeños. En los planes de pocos participantes, la plataforma ofrece un espacio de coordinación enriquecido: punto de encuentro en el mapa, confirmación del día y recordatorio del contacto de confianza. La clave de diseño es mantener la coordinación dentro de la app para que nadie tenga que dar su teléfono ni sus datos personales a desconocidos; el intercambio de contacto queda voluntario y opcional, nunca forzado. Así, ese espacio para contactar y compartir información es una función de seguridad, no de exposición. Además, en planes pequeños el anfitrión puede pedir una breve presentación y aprobar quién entra, un filtro ligero coherente con la confianza proporcional al tamaño del grupo.

## Ajustes

Estructura del menú de ajustes:

- Cuenta: editar perfil, usuario, email, teléfono, idioma de la app.
- Privacidad: perfil público o privado, quién puede seguirte, quién puede escribirte, quién puede unirse a tus planes (todos, solo verificados, o solo con fiabilidad mínima), visibilidad de ubicación, visibilidad del historial.
- Seguridad: contraseña, verificación en dos pasos, dispositivos y sesiones activas, estado de verificación de identidad.
- Notificaciones, granular: planes cerca de ti, recordatorios y reconfirmación del día, mensajes, nuevos seguidores, actualizaciones de planes que sigues.
- Descubrimiento: intereses y categorías, rango de edad preferido, radio geográfico, idioma de los planes.
- Pagos: métodos de pago, historial de reservas, reembolsos.
- Datos y legal: términos y condiciones, política de privacidad, descargar mis datos, eliminar cuenta.
- Moderación: usuarios bloqueados, reportes realizados.

## Seguridad y verificación de cuenta

Conviene separar dos capas que cumplen funciones distintas y suelen confundirse.

Seguridad de acceso, que protege la cuenta. Contraseña robusta y verificación en dos pasos por SMS, app de autenticación (TOTP) o email. Verificación de email y teléfono en el alta. Gestión de sesiones y dispositivos, con cierre remoto.

Verificación de identidad, que protege a la comunidad. Es distinta del 2FA. Es el requisito de confianza para quedar con desconocidos: comprobación de documento y selfie antes del primer plan, que otorga el distintivo de verificado. Es lo que diferencia de un grupo de WhatsApp y lo que sostiene la seguridad de los encuentros presenciales.

## Edad, aceptación legal y datos

Edad mínima de 18 años, no negociable. La app facilita quedar con desconocidos en persona e incluye ocio nocturno; es un entorno solo para adultos. Verificación de edad en el alta, y la edad como factor de elegibilidad por plan (un plan de ocio nocturno hereda los límites legales de su jurisdicción).

Aceptación en el onboarding: términos y condiciones, política de privacidad, confirmación de edad y código de conducta de la comunidad (anti-acoso, normas de comportamiento). Consentimientos específicos y separados para uso de ubicación, datos de verificación de identidad y pagos.

Cumplimiento RGPD desde el diseño, al operar en España y la UE: consentimiento explícito, minimización de datos, y derechos de acceso, portabilidad y eliminación accesibles desde ajustes.

La facilitación de encuentros presenciales entre desconocidos conlleva responsabilidad legal real. Los términos deben abordar la limitación de responsabilidad de la plataforma, y conviene revisarlos con un abogado especializado antes de lanzar. Esto no es asesoramiento legal.

## Moderación y reportes

Es la pata de seguridad más crítica, porque aquí no se modera solo contenido: se modera comportamiento que termina en encuentros físicos entre desconocidos. Una incidencia grave puede hundir la marca, así que el sistema se diseña como núcleo, no como parche.

Qué se puede reportar. Un plan (falso, engañoso, inseguro, estafa, contenido inadecuado), un usuario o perfil (cuenta falsa, suplantación, acoso, sospecha de menor, comportamiento peligroso), un mensaje o chat (acoso, spam, amenazas, solicitación), un contenido concreto (story o aftermovie con desnudos, violencia, odio o material ilegal) y, lo propio de esta app, el comportamiento en un evento (no presentarse, acoso presencial, incidente de seguridad, o un anfitrión que tergiversó el plan).

Cómo se reporta. Botón de reporte accesible en un toque desde cualquier sitio: plan, perfil, mensaje, contenido. Selección de categoría, detalle opcional y evidencia opcional (captura, plan adjuntado automáticamente). El reportante queda anónimo frente al reportado. En categorías graves, el flujo ofrece de inmediato opciones y recursos de seguridad.

Tres capas de revisión. Primera, automática y proactiva: análisis de contenido en la subida (imágenes para desnudos o violencia, texto para odio, amenazas o patrones de estafa) y detección de patrones (reportes masivos, planes duplicados, señales de fraude, ubicación incoherente). Lo de alta confianza se retiene o bloquea solo. Segunda, revisión humana en cola priorizada por gravedad, con un SLA más estricto en lo que afecta a seguridad física. Tercera, escalado: incidentes graves del mundo real (agresión, sospecha de menor, amenaza creíble) van por una vía dedicada, con preservación de la cuenta y cooperación con autoridades cuando proceda.

Acciones graduadas. Aviso y retirada de contenido, reducción de alcance (ligada al sistema de reputación), suspensión temporal, y bloqueo permanente. Como la identidad está verificada, un bloqueo grave impide que esa identidad vuelva a registrarse fácilmente: es una ventaja real de exigir verificación. A un anfitrión problemático se le puede retirar la capacidad de organizar y, si el evento fue fraudulento, retener el pago en el escrow.

Capa de seguridad presencial, que es lo que diferencia de una red social normal. Herramientas dentro del plan en vivo: compartir tu plan con un contacto de confianza, confirmación de "he llegado bien", botón de emergencia o SOS, y poder reportar desde el propio chat del plan en marcha. Responsabilidad del anfitrión: está verificado y responde del plan; reportes de seguridad reiterados sobre un anfitrión implican su retirada. La exigencia de verificación y reputación es mayor en los planes pequeños e íntimos, donde el riesgo es más alto.

Usos prohibidos con tolerancia cero. Cualquier indicio de menor en la plataforma se escala de inmediato, sin excepción: la app es solo para mayores de 18. Solicitación sexual, trata o uso del producto como tapadera para esos fines están prohibidos por política, con detección y reporte. Estafa y suplantación, igual. Estas políticas se publican en el código de conducta y se aplican.

Transparencia y apelación. Al usuario sancionado se le notifica la acción y el motivo, y existe un proceso de apelación. A escala, conviene publicar informes de transparencia periódicos. El objetivo es que la moderación se perciba como justa, no arbitraria.

Señales proactivas que reducen la necesidad de moderar a posteriori: identidad verificada, reputación e índice de fiabilidad visibles, valoraciones de anfitriones, reseñas de planes y la reconfirmación del día, que evita recuentos de asistentes falsos.

## Flujo de onboarding

El principio rector es fricción mínima al entrar y verificación donde de verdad importa. Registrarse, navegar y seguir no exigen verificar identidad; esa barrera se levanta justo antes del primer plan. Así no se ahuyenta al curioso en la puerta, pero se mantiene la confianza en el momento en que hay un encuentro real en juego.

Paso 1 — Bienvenida sin pedir nada. La primera pantalla comunica el posicionamiento —planes y gente con quien vivirlos, no una app de ligar— y deja ver valor antes de pedir datos. Cero formularios por delante de la propuesta.

Paso 2 — Registro y seguridad de acceso. Alta por email o teléfono con contraseña, o login social. Verificación de email y teléfono por código (OTP) en el alta. La verificación en dos pasos (2FA) se ofrece aquí pero no se obliga; vive en Seguridad y protege la cuenta, no a la comunidad.

Paso 3 — Edad y aceptación legal. Confirmación de edad (18+, no negociable) y aceptación en bloque de términos, política de privacidad y código de conducta. Los consentimientos sensibles —ubicación, datos de verificación de identidad, pagos— se piden separados y de forma contextual cuando se necesitan, no todos de golpe aquí.

Paso 4 — Creación de perfil. Usuario y nombre, foto, biografía, idiomas y ciudad o ubicación actual (opcional). Es el perfil público sujeto a la configuración de privacidad.

Paso 5 — Intereses y descubrimiento. El usuario elige sus categorías favoritas de la taxonomía y, opcionalmente, rango de edad preferido, radio geográfico e idioma de los planes. Esto alimenta el ranking por afinidad desde el primer scroll, para que el feed no arranque en frío.

Paso 6 — Ubicación (contextual). Se pide permiso de ubicación explicando para qué: planes cerca de ti y densidad dinámica de inyección. Es un consentimiento separado y rechazable; sin él la app funciona, solo pierde la capa "cerca de mí".

Paso 7 — Siembra del grafo asimétrico. Aquí el grafo asimétrico hace un trabajo que un modelo de amistad simétrica no podría: como seguir es unidireccional y no requiere aprobación, el onboarding sugiere a quién seguir —anclas recurrentes de tu ciudad, locales y anfitriones verificados, perfiles destacados— y el usuario sale ya siguiendo cosas, con un toque y sin esperar reciprocidad. El resultado es que la pestaña Vividas aterriza poblada desde el minuto cero. La siembra de anclas recurrentes y el grafo asimétrico se combinan justo aquí para matar la pantalla vacía.

Paso 8 — Aterrizaje. El usuario llega a Vividas, ya con contenido afín y gente a la que sigue. La verificación de identidad todavía no se ha pedido: puede explorar, seguir, ver stories y planes públicos. La barrera aparece en el siguiente gesto con consecuencia presencial.

## Verificación de identidad: la barrera del primer plan

La comprobación de documento y selfie no va en el alta, va como puerta justo cuando el usuario intenta unirse a su primer plan o publicar uno. En ese momento se lanza el flujo de verificación, que otorga el distintivo de verificado y queda ya hecho para siempre. Esto separa con claridad las dos capas: el 2FA protege el acceso a la cuenta; la verificación de identidad protege a la comunidad y condiciona la participación en encuentros reales. La exigencia se gradúa luego por tamaño de grupo: más rigor de verificación y reputación en planes pequeños e íntimos, más holgura en los grandes.

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

La página de un lugar agrega todo lo que ya define el producto, anclado a coordenadas: sus planes próximos, sus anclas recurrentes, su feed de aftermovies por hashtag (#himnovictoria), las stories en vivo de quien está ahí ahora mismo, y —en los lugares de negocio— la reputación y las reseñas. El lugar es, en la práctica, el hogar permanente de cada ancla recurrente que ya mencionaba la organización por hashtags, ahora con domicilio en el mapa.

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

## Roadmap de lanzamiento

Validación low-code primero. Antes de construir la app: landing, grupo por ciudad y pasarela de pago, con planes sembrados a mano. Es como arrancó el ganador de la categoría (Timeleft llegó a 1 M€/mes de ingresos con Typeform, WhatsApp y Stripe antes de tecnología pesada). El objetivo es validar el bucle completo —la gente se apunta, paga, sube el aftermovie, vuelve— a coste casi cero.

Ciudad de ignición: Madrid. Con contacto ya abierto con Fever y contactos locales con acceso a eventos importantes, Madrid resuelve la parte más difícil (oferta de pago de calidad y diferencial real) y aporta densidad de demanda desde el día uno. Se enciende una ciudad primero y se prueba el bucle entero ahí; no se reparten tres a la vez para no diluir la liquidez.

Expansión: Burgos y Llanes después, con el playbook probado. Burgos como ciudad real de tamaño medio con raíces y relaciones locales, y con el flujo constante de viajeros del Camino de Santiago como usuarios sociales de paso. Llanes como prueba de la tesis de destino turístico estacional. Sirven para demostrar que el modelo funciona en tres arquetipos de densidad distintos.

Fever, en paralelo y por fases. Primero relación vía programa de afiliados (puerta de entrada). Después integración vía API transaccional para nutrir la pestaña de pago con inventario Fever reservable in-app y comisión compartida. El producto debe estar definido y, idealmente, con audiencia demostrable antes de la conversación seria de API. El activo propio que no depende de Fever: el grafo social, la comunidad, el motor de aftermovies y las anclas recurrentes gratuitas.

## Decisiones abiertas

- Taxonomía inicial concreta de categorías (la propuesta de arriba es punto de partida).
- Umbral de fiabilidad mínima para acceder a planes especiales/saturados.
- Cómo se reparte la comisión con Fever en los planes vía su API (la comisión propia ya está fijada en el 15%).
- Proveedor de verificación de identidad (documento y selfie).
- Precio de las capas de cuenta de negocio: importe del CPA por asistente confirmado y cuota de la suscripción de herramientas.
- Revisión legal de los términos: limitación de responsabilidad por encuentros presenciales, antes de lanzar.
- Nombre y marca (el "WanderMeet" del dosier previo es genérico y débil para SEO/GEO; pendiente de trabajar).
