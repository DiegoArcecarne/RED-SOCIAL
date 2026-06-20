# Prototipo visual — App de planes

Prototipo navegable y estático (HTML + CSS + JS vanilla, **sin frameworks ni build**)
de la app definida en [`../PRODUCTO.md`](../PRODUCTO.md). Sirve para *ver la idea
funcionando*, no es código de producción.

## Cómo previsualizarlo

**Opción rápida (sin servidor):** abre `index.html` directamente en el navegador
(doble clic, o `File ▸ Abrir`). Al ser todo estático y sin `fetch`, funciona con
`file://`.

**Opción recomendada (servidor local):** desde esta carpeta,

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000  en el navegador
```

Para la mejor experiencia, activa la **vista móvil** en las DevTools del navegador
(`F12` ▸ icono de móvil), ya que el diseño es mobile-first.

## Qué incluye

Tres vistas principales, con navegación por la barra inferior y por hash (`#/...`):

1. **Descubrir** (pestaña *Disponibles*) — feed de planes filtrable por **tamaño de
   grupo**, **tema** y **precio**. Cada tarjeta muestra nivel del plan (ancla
   recurrente / gratis / experiencia de pago), anfitrión verificado, reputación,
   cuenta atrás y plazas. La pestaña *Vividas* muestra aftermovies con la inyección
   contextual de un plan; *Stories* y *Menciones* quedan como placeholders.
2. **Mapa** — lugares (negocio verificado, público, secreto) como pines sobre un
   mapa estilizado; al tocar un pin se ven sus planes e histórico.
3. **Ficha de plan** — detalle con KPIs, anfitrión y señales de confianza,
   asistentes, lugar, herramientas de seguridad, reseñas y reserva (escrow para
   planes de pago; verificación de identidad para los gratuitos).

Los datos son de ejemplo (`data.js`) y coherentes con el producto. La marca
("planes") es **provisional**: el nombre sigue siendo una decisión abierta.
