# RED-SOCIAL · app de planes

Una red social donde descubres un plan y la gente para hacerlo, estés donde estés.
Une la capa social de conocer gente haciendo algo real con un marketplace de
experiencias. Foco inicial: Madrid.

**Estado:** producto definido y prototipo navegable. Siguiente paso: validar el
bucle con un piloto low-code en Madrid antes de construir la app.

## Qué hay en el repositorio

| Ruta | Qué es |
|---|---|
| [`PRODUCTO.md`](PRODUCTO.md) | Definición de producto completa: posicionamiento, flujos, modelo económico, confianza y seguridad, alcance del MVP, métricas, competencia y decisiones abiertas |
| [`docs/modelo-datos.md`](docs/modelo-datos.md) | Diagrama de entidades y relaciones (Mermaid) |
| [`docs/plan-validacion-madrid.md`](docs/plan-validacion-madrid.md) | Piloto de 6 semanas: hipótesis, herramientas, calendario y criterios para continuar o parar |
| [`docs/borrador-propuesta-fever.md`](docs/borrador-propuesta-fever.md) | Borrador de propuesta a Fever, a completar con los datos del piloto |
| [`prototipo/`](prototipo/) | Prototipo visual navegable (ver su [README](prototipo/README.md)) |
| [`scripts/`](scripts/) | Generación de `standalone.html` y prueba de humo del prototipo |

## Ver el prototipo

Abre `prototipo/standalone.html` en el navegador, en vista móvil. Si GitHub Pages
está activado sobre `main`, la raíz del sitio redirige al prototipo.

## Comprobaciones

```bash
node scripts/build-standalone.js --check   # standalone.html al día con las fuentes
node scripts/smoke-test.js                 # todas las vistas y flujos
```

Se ejecutan automáticamente en cada pull request que toca el prototipo.
