# Social: especificación

Publicaciones con fotos y vídeos reales, muro, me gusta, comentarios y guardados,
seguir y amigos, perfiles privados con solicitudes, valoraciones con su privacidad,
búsqueda y menciones. El prototipo (`prototipo/social.js`, con apoyo de `app.js`) tiene
todas las pantallas y reglas, **simuladas en el navegador**. Este documento dice qué
tiene que hacer el **servidor** en la app real.

Relacionado: [`PRODUCTO.md`](../PRODUCTO.md) (Modelo de seguidores, Publicaciones,
Valoraciones de planes, Compartir), [`bucle-de-planes.md`](bucle-de-planes.md)
(notificaciones) y [`modelo-datos.md`](modelo-datos.md).

## Qué está simulado en el prototipo

| En el prototipo | En la app real |
|---|---|
| Fotos y vídeos se guardan en el navegador (IndexedDB) | Subida directa a almacenamiento con URL firmada; CDN |
| Las fotos se reducen a 1.350 px y se vuelven a codificar en el móvil | Lo mismo en el móvil, y en el servidor variantes (miniatura, 640, 1080), WebP/AVIF y moderación de imágenes |
| El vídeo se reproduce tal cual (máx. 60 s y 50 MB en la demo) | Transcodificación a H.264/AAC MP4 y HLS, miniatura, quitar metadatos y moderación |
| Una cuenta privada acepta tu solicitud a los 4 s; al poner tu perfil privado llega una solicitud | Personas reales, con avisos |
| La privacidad (privado, audiencia, bloqueos) la aplica la pantalla | La aplica el servidor en **cada** consulta (feed, perfil, búsqueda, enlaces) |
| La búsqueda recorre los datos de ejemplo en el móvil | Índice de búsqueda en el servidor |

## Publicaciones

- **Crear**:
  - Desde la cámara o la galería: 1 foto (foto), de 2 a 10 fotos (carrusel) o 1 vídeo de hasta 60 s.
  - Un vídeo va solo, sin fotos. El formato lo decide lo que se sube.
  - Vista previa con opción de quitar cada elemento.
  - Al subir se **quita la ubicación GPS** (EXIF) de las fotos: el móvil las vuelve a codificar y el servidor lo comprueba. En el vídeo, el servidor elimina los metadatos.
- **Menú ⋯**:
  - De las tuyas: editar el pie (queda marcado como editado) y eliminar, que borra también los archivos, los me gusta y los comentarios.
  - De las ajenas: seguir o dejar de seguir, y reportar.
  - En todas: copiar el enlace.
- **Comentarios**: se pueden borrar los propios. El autor de la publicación también puede borrar los de su publicación (propuesta) y desactivarlos.
- **Me gusta** (también con doble toque) y **guardados**: los guardados solo los ve quien guarda, en su perfil ▸ Guardados.
- **@menciones y #temas** son tocables: llevan al perfil o a la página del tema.

## Seguir, amigos y perfiles privados

- **Seguir** es unidireccional. **Amigos** = seguimiento mutuo.
- **Seguidores y seguidos**: listas tocables en el perfil. En tu lista de seguidores puedes **eliminar** a alguien sin que se le avise.
- **Perfil privado**:
  - Quien no te sigue ve tu cabecera (nombre, foto, descripción y contadores), pero no tus publicaciones, planes ni valoraciones, y tus publicaciones no le salen en el muro, en la búsqueda de temas ni por enlace.
  - Seguirte es una **solicitud** que confirmas o eliminas (en Notificaciones ▸ Solicitudes para seguirte). Quien la pide ve "Solicitado" y puede retirarla.
  - Al pasar tu perfil a público, las solicitudes pendientes se aceptan.
- **Audiencia de cada publicación**: público, seguidores o amigos. En un perfil privado, "público" equivale a seguidores.
- **Valoraciones**: además de su propia visibilidad (pública o privada, y quién ve cada tipo), un perfil privado las oculta a quien no le sigue.
- **Bloquear** oculta todo en los dos sentidos y deshace el seguimiento.

## Búsqueda

- Entrada desde Descubrir ("Busca planes, personas o #temas"). Pestañas Todo / Personas / Planes / Temas, con el número de resultados de cada una.
- Sin texto: búsquedas recientes (se pueden borrar) y temas populares.
- Ignora tildes y mayúsculas.
  - **Personas**: nombre, usuario, descripción y categoría de negocio.
  - **Planes**: título, descripción, lugar, tema y anfitrión; no salen los cancelados.
  - **Temas**: #hashtags de las publicaciones y de los lugares.
- Las cuentas privadas salen en la búsqueda (como en Instagram) con "Cuenta privada". Las personas bloqueadas no salen.
- **Página de cada tema**: publicaciones con ese #tema y planes en el lugar asociado.
- Servidor: Postgres con `unaccent` y búsqueda por trigramas (o un motor como Meilisearch o Typesense). Los filtros de privacidad y bloqueo se aplican en la consulta. Las sugerencias se ordenan por cercanía en el grafo (amigos, amigos de amigos) y por actividad.

## Menciones y etiquetas

- Llegan a la pestaña **Menciones**:
  - etiquetas en publicaciones;
  - @menciones en el pie;
  - @menciones en comentarios.
- Una mención **no se asocia a tu perfil hasta que la aceptas**:
  - **Aceptar**: la publicación en la que te etiquetan sale en tu perfil ▸ Etiquetadas.
  - **Quitar**: deja de aparecer y, si era una etiqueta, te quita de la publicación.
- **Quién puede mencionarte o etiquetarte**: todos, solo a quien sigues, o nadie. Lo que no está permitido ni llega.
- La pestaña muestra una marca cuando hay menciones pendientes. Las nuevas generan una notificación de tipo "mención".

## Notificaciones nuevas

| Tipo | Cuándo |
|---|---|
| Seguidor | Alguien pide seguirte (perfil privado) o acepta tu solicitud |
| Mención | Te mencionan o te etiquetan |

## API (borrador)

```
POST /media/subida                  { tipo: imagen|video, bytes }   → url firmada + id
POST /publicaciones                 { media_ids[], pie, plan_id?, audiencia, ... }
PATCH /publicaciones/:id            { pie }
DELETE /publicaciones/:id
POST/DELETE /publicaciones/:id/me-gusta  ·  /guardado
POST /publicaciones/:id/comentarios  ·  DELETE /comentarios/:id
GET  /muro?cursor=                  (respeta privacidad, audiencia y bloqueos)
POST /usuarios/:id/seguir           → siguiendo | solicitado
DELETE /usuarios/:id/seguir  ·  DELETE /seguidores/:id
GET  /usuarios/:id/seguidores  ·  /seguidos
GET  /solicitudes-seguimiento  ·  POST /solicitudes-seguimiento/:id { aceptar: bool }
GET  /buscar?q=&tipo=todo|personas|planes|temas
GET  /temas/:tag
GET  /menciones  ·  POST /menciones/:id { aceptar: bool }
PUT  /ajustes/menciones             { politica: todos|seguidos|nadie }
```
