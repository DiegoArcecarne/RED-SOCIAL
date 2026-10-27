# Estado del proyecto

Resumen para retomar el trabajo (por ejemplo, desde otra cuenta). Actualízalo al cerrar cada
bloque.

## Dónde está todo

- **Código y documentos**: este repositorio. Nada importante vive fuera.
- **PR abiertos sin fusionar, encadenados**: del #8 al #37. Cada uno va encima del anterior,
  así que **fusionar el último (o la rama más reciente) en `main` incluye todos**; después se
  pueden cerrar los demás. A partir de ahí, las ramas nuevas salen de `main`.
- **Rama más reciente**: la del último PR abierto (ahora, `claude/traspaso-8jk291`, que va
  encima de `claude/publicidad-agenda-8jk291`, PR #37).

## Qué está hecho (prototipo y especificación)

| Bloque | PR | Documento |
|---|---|---|
| Producto, mapa y lugares, modelo de datos | #1–#2 | `PRODUCTO.md`, `docs/modelo-datos.md` |
| Prototipo visual: feed en cuadrícula, ficha, mapa, modo oscuro | #3–#8 | `prototipo/README.md` |
| Revisión, pruebas automáticas y plan de validación del piloto | #9 | `docs/plan-validacion-madrid.md` |
| Muro, stories, directos, música, publicaciones de planes y de vida | #10–#12 | `docs/social.md` |
| Perfil, editar perfil, valoraciones, seguidores y amigos | #13–#15 | `PRODUCTO.md` |
| Compartir dentro y fuera, mensajes, solicitudes y reportes | #16–#20 | `docs/compartir.md` |
| Cuentas: registro, 2FA, 18+, onboarding, web instalable | #21 | `docs/cuentas-y-acceso.md` |
| Bucle de planes: lista de espera, reconfirmación, QR de llegada | #22 | `docs/bucle-de-planes.md` |
| Social: fotos y vídeos reales, privados, búsqueda, menciones | #23 | `docs/social.md` |
| Confianza y seguridad: filtros, moderación, apelaciones, SOS, RGPD | #24 | `docs/confianza-y-seguridad.md` |
| Web pública de los enlaces, universal links, menú nativo | #25 | `docs/compartir.md` |
| Pagos: dinero retenido, 15 %, reembolsos, cobros y facturas | #26 | `docs/pagos.md` |
| Interfaz compacta | #27 | — |
| Quién está en el plan (chinchetas y saludos) | #29 | `docs/bucle-de-planes.md` |
| Chispas (posibles planes) | #30–#31 | `docs/bucle-de-planes.md` |
| Panel de administración | #32 | `docs/herramientas-internas.md` |
| Agenda (día, semana, mes, año; .ics) | #34 | `docs/agenda.md` |
| Novedades del plan y recordatorios | #35 | `docs/novedades.md` |
| Planes por videollamada; portadas; arreglos del móvil y del carrusel | #36 | `docs/videollamadas.md` |
| Publicidad en la agenda sin rastreo; lupa de búsqueda | #37 | `docs/publicidad.md` |

## Pendiente

- **Issue #28**: algoritmo de recomendación por intereses y anuncios por búsquedas sin
  píxeles. La parte de anuncios en la agenda ya está (`docs/publicidad.md`); falta el
  algoritmo del feed y la publicidad en Descubrir.
- **Issue #33**: ponerla en los móviles (cuentas de Apple y Google, TestFlight y prueba
  interna, política de privacidad, pruebas en dispositivos y de accesibilidad) y la Fase 2.
- Decisiones abiertas: al final de `PRODUCTO.md`.

## Cómo probarlo

- Abrir `prototipo/index.html` en el navegador (o `prototipo/standalone.html`, un solo
  archivo) y pulsar *Entrar con la cuenta de demostración* (Marina).
- Pruebas: `node scripts/smoke-test.js`.
- Vista previa publicable: `node scripts/build-artifact.js` (ver `CLAUDE.md`).
