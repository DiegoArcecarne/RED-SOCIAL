# Modelo de datos — diagrama de entidades

Diagrama conceptual de entidades y relaciones de la app de planes, derivado de la
sección "Modelo de datos: entidades y relaciones" de [`PRODUCTO.md`](../PRODUCTO.md).
No es el esquema final de base de datos: fija el vocabulario y las relaciones
principales. Los atributos se muestran abreviados (clave y campos representativos).

```mermaid
erDiagram
    PERSONA ||--|{ USUARIO : "gestiona (1 personal + profesionales)"
    PERSONA ||--o| VERIFICACION_IDENTIDAD : tiene
    USUARIO ||--o| CUENTA_EMPRESA : "puede ser"
    CUENTA_EMPRESA ||--o| VERIFICACION_NEGOCIO : tiene
    PERSONA ||--o{ SESION_DISPOSITIVO : usa
    PERSONA ||--o{ CONSENTIMIENTO : otorga

    USUARIO ||--o{ SEGUIMIENTO : "sigue a"
    USUARIO ||--o{ SEGUIMIENTO : "es seguido por"
    USUARIO ||--o{ BLOQUEO : "bloquea"
    USUARIO ||--o{ BLOQUEO : "es bloqueado por"

    CUENTA_EMPRESA ||--o{ LUGAR : posee
    LUGAR ||--o{ PLAN : hospeda
    USUARIO ||--o{ PLAN : "organiza (anfitrion)"
    CATEGORIA ||--o{ PLAN : clasifica

    USUARIO ||--o{ CHISPA : lanza
    CHISPA ||--o{ RESPUESTA_CHISPA : recibe
    USUARIO ||--o{ RESPUESTA_CHISPA : responde
    CHISPA |o--o| PLAN : "se convierte en"
    PLAN ||--o{ INSCRIPCION : recibe
    USUARIO ||--o{ INSCRIPCION : realiza
    INSCRIPCION ||--o| PAGO : genera
    USUARIO ||--o{ METODO_PAGO : guarda
    USUARIO ||--o| CUENTA_COBRO : "cobra con"
    CUENTA_COBRO ||--o{ TRANSFERENCIA : recibe
    PAGO }o--o| TRANSFERENCIA : "se liquida en"
    PAGO ||--o{ FACTURA : "documenta"
    CUENTA_COBRO ||--o{ FACTURA : "recibe (comision)"

    PLAN ||--o{ ASISTENCIA_REAL : "registra (geo)"
    USUARIO ||--o{ ASISTENCIA_REAL : asiste

    PLAN ||--o{ SOLICITUD_ASISTENCIA : recibe
    USUARIO ||--o{ SOLICITUD_ASISTENCIA : envia

    GRUPO ||--o{ MIEMBRO_GRUPO : tiene
    USUARIO ||--o{ MIEMBRO_GRUPO : "es miembro"
    GRUPO ||--o{ PLAN : organiza

    USUARIO ||--o{ PUBLICACION : crea
    PLAN ||--o{ PUBLICACION : "vinculada a"
    LUGAR ||--o{ PUBLICACION : ubica
    PUBLICACION ||--o{ COMPARTIDO : "se comparte"
    USUARIO ||--o{ COMPARTIDO : comparte
    PLAN ||--o{ COMPARTIDO : "se comparte"
    USUARIO ||--o{ COMPARTIDO : "su perfil se comparte"
    PUBLICACION ||--o{ COMENTARIO : recibe
    USUARIO ||--o{ COMENTARIO : escribe
    PUBLICACION ||--o{ ME_GUSTA : recibe
    USUARIO ||--o{ ME_GUSTA : da
    PISTA ||--o{ PUBLICACION : "suena en"
    PISTA ||--o{ STORY : "suena en"
    USUARIO ||--o{ DIRECTO : emite
    PLAN ||--o{ DIRECTO : "se emite desde"

    PLAN ||--o{ VALORACION_PLAN : recibe
    USUARIO ||--o{ VALORACION_PLAN : valora
    PLAN ||--o{ RESENA : abre
    USUARIO ||--o{ RESENA : "escribe"
    USUARIO ||--o{ RESENA : "es resenado en"

    PLAN ||--o| AFTERMOVIE : "se convierte en"
    USUARIO ||--o{ AFTERMOVIE : publica
    USUARIO ||--o{ STORY : publica
    PLAN ||--o{ STORY : ambienta
    USUARIO ||--o{ MENCION : "es mencionado en"
    HASHTAG ||--o{ AFTERMOVIE : agrupa
    LUGAR ||--o{ HASHTAG : ancla

    PLAN ||--o| CONVERSACION : "tiene chat"
    CONVERSACION ||--o{ MENSAJE : contiene
    USUARIO ||--o{ MENSAJE : envia

    USUARIO ||--o{ CONTACTO_CONFIANZA : define
    USUARIO ||--o{ EVENTO_SEGURIDAD : dispara
    PLAN ||--o{ EVENTO_SEGURIDAD : "ocurre en"
    USUARIO ||--o{ REPORTE : emite
    REPORTE ||--o{ ACCION_MODERACION : "deriva en"
    PERSONA ||--o{ ACCION_MODERACION : "recibe"
    ACCION_MODERACION ||--o| APELACION : "se recurre con"
    REPORTE ||--o| APELACION : "quien reporta pide revisar"
    PERSONA ||--o{ SOLICITUD_DATOS : "pide (RGPD)"

    CUENTA_EMPRESA ||--o{ SUSCRIPCION_NEGOCIO : contrata
    USUARIO ||--o{ CAMPANA_BOOST : anuncia
    PLAN ||--o| CAMPANA_BOOST : promociona
    USUARIO ||--o{ NOTIFICACION : recibe

    PERSONA {
        uuid id PK
        string email "unico, verificado por codigo"
        string telefono "E.164, unico"
        string password_hash "Argon2id"
        string metodo_2fa "app|sms|email|null"
        date fecha_nacimiento "gate 18+"
        bool identidad_verificada
        int intentos_fallidos
        datetime bloqueado_hasta
    }
    USUARIO {
        uuid id PK
        uuid persona_id FK
        bool es_personal "uno por persona"
        string tipo "particular | profesional"
        string nombre "max 30"
        string usuario "handle unico, 3-30"
        string biografia "max 150"
        string valoraciones_default "publica|privada"
        string audiencia_val_publicas "todos|seguidores|amigos"
        string audiencia_val_privadas "seguidores|amigos|solo_yo"
        bool perfil_publico
        string presencia_default "publica|privada"
        string modo_recepcion_dm "cerrado|bajo_solicitud|abierto"
        float reputacion_estrellas "agregada"
        int indice_fiabilidad "no-shows, agregado"
    }
    CUENTA_EMPRESA {
        uuid id PK
        uuid usuario_id FK
        string nombre_comercial
        string horario
        string direccion
        string web
        string enlace_reserva
        bool distintivo_negocio_verificado
    }
    VERIFICACION_IDENTIDAD {
        uuid id PK
        uuid persona_id FK
        string proveedor
        string estado
        datetime fecha
    }
    VERIFICACION_NEGOCIO {
        uuid id PK
        uuid cuenta_empresa_id FK
        string prueba_titularidad
        string estado
    }
    SEGUIMIENTO {
        uuid id PK
        uuid seguidor_id FK
        uuid seguido_id FK
        string estado "activo|pendiente (perfil privado)"
        datetime fecha "amigos = seguimiento mutuo"
    }
    BLOQUEO {
        uuid id PK
        uuid bloqueador_id FK
        uuid bloqueado_id FK
        datetime fecha
    }
    LUGAR {
        uuid id PK
        string tipo "negocio|publico"
        string nombre
        point coordenadas
        string categoria
        string hashtag
        bool reclamado
        uuid propietario_id FK "cuenta_empresa, nullable"
    }
    PLAN {
        uuid id PK
        string tipo "social_gratuito|experiencia_pago"
        string tipo_inscripcion "apuntado|libre"
        string modo_aprobacion "automatica|manual"
        uuid grupo_id FK "grupo organizador, nullable"
        int nivel "1|2|3"
        uuid anfitrion_id FK
        uuid lugar_id FK
        bool ubicacion_oculta
        datetime fecha_hora
        string recurrencia "puntual|recurrente"
        int tamano_min
        int tamano_max
        decimal precio "nullable"
        decimal desvelo "solo especial/saturado no de pago"
        string politica_cancelacion "flexible|moderada|estricta"
        string estado "proximo|en_curso|pasado|cancelado"
        string foto "url en almacenamiento"
    }
    CHISPA {
        uuid id PK
        uuid autor_id FK
        string titulo "max 60"
        string texto "max 300"
        string tema
        string cuando "hoy|finde|semana|fecha|sin_fecha"
        datetime fecha "si cuando=fecha"
        string zona "aproximada"
        int maximo "null = sin limite"
        int minimo
        string quien "todos|seguidores|amigos"
        bool aprobacion "por defecto si quien=todos"
        bool automatica "plan al llegar al minimo; requiere fecha y zona"
        string gastos "gratis|a_escote|cada_uno"
        string estado "abierta|convertida|caducada|descartada"
        uuid plan_id FK "al convertirse"
    }
    RESPUESTA_CHISPA {
        uuid chispa_id FK
        uuid usuario_id FK
        string estado "si|quizas|pendiente"
        datetime fecha
    }
    INSCRIPCION {
        uuid id PK
        uuid plan_id FK
        uuid usuario_id FK
        string estado "por_confirmar (desde una chispa, 24 h)|solicitada|aprobada|rechazada|confirmada|lista_espera|cancelada|cancelada_tarde|asistio|no_show"
        int posicion_espera "si lista_espera"
        bool reconfirmado_dia
        decimal reembolsado
        uuid pago_id FK "nullable"
    }
    ASISTENCIA_REAL {
        uuid id PK
        uuid plan_id FK
        uuid usuario_id FK
        datetime fecha_hora
        string metodo "qr_anfitrion|manual_anfitrion|geolocalizacion"
        string visibilidad "todos|amigos|nadie (en el plan y en el mapa)"
        string modo "solo|grupo|null"
    }
    SOLICITUD_ASISTENCIA {
        uuid id PK
        uuid plan_id FK
        uuid usuario_id FK
        string estado "pendiente|aceptada|rechazada"
        string mensaje
        datetime fecha
    }
    GRUPO {
        uuid id PK
        string nombre
        string descripcion
        string media
        datetime fecha_creacion
    }
    MIEMBRO_GRUPO {
        uuid id PK
        uuid grupo_id FK
        uuid usuario_id FK
        string rol "admin|miembro"
        datetime fecha_alta
    }
    PUBLICACION {
        uuid id PK
        uuid autor_id FK
        string formato "foto|video|carrusel"
        string media "1 foto, 2-10 fotos o 1 video (max 60 s) con miniatura"
        string pie_texto "con @menciones y #hashtags"
        uuid ubicacion_lugar_id FK "nullable"
        string usuarios_etiquetados "lista de usuario_id"
        uuid plan_vinculado_id FK "null = de su vida"
        string texto_alt "accesibilidad"
        string audiencia "publico|seguidores|amigos"
        bool comentarios_activos
        bool ocultar_likes
        bool compartir_en_stories
        uuid pista_id FK "musica, nullable"
        int likes
        string visibilidad
    }
    PAGO {
        uuid id PK
        uuid inscripcion_id FK
        decimal importe
        decimal comision "15% IVA incluido"
        decimal reembolsado
        string tipo "reserva|desvelo|boost|suscripcion|cpa"
        string estado "pendiente|retenido|liberado|pagado|reembolsado|reembolso_parcial|en_revision"
        string stripe_payment_intent
        string numero_recibo "PL-AAAA-000000"
        datetime fecha_liberacion
    }
    METODO_PAGO {
        uuid id PK
        uuid usuario_id FK
        string marca
        string ultimos4
        string caducidad
        bool principal
        string stripe_payment_method
    }
    CUENTA_COBRO {
        uuid id PK
        uuid usuario_id FK
        string tipo "particular|empresa"
        string nombre_legal
        string nif
        string iban "cifrado"
        string stripe_account "acct_..."
        string estado "en_revision|activa|faltan_datos|desactivada"
    }
    TRANSFERENCIA {
        uuid id PK
        uuid cuenta_cobro_id FK
        uuid plan_id FK
        decimal neto
        string stripe_transfer
        bool revertida
        datetime fecha
    }
    FACTURA {
        uuid id PK
        string tipo "recibo|entrada|comision_mensual"
        string serie_numero
        uuid emisor_id
        uuid destinatario_id
        decimal base
        decimal iva
        decimal total
        datetime fecha
    }
    RESENA {
        uuid id PK
        uuid plan_id FK
        uuid autor_id FK
        uuid sujeto_id FK "anfitrion o asistente"
        int estrellas
        string texto
    }
    AFTERMOVIE {
        uuid id PK
        uuid plan_id FK
        uuid autor_id FK
        string media
        string visibilidad
    }
    STORY {
        uuid id PK
        uuid autor_id FK
        uuid plan_id FK "opcional"
        uuid pista_id FK "musica, nullable"
        string visibilidad "publico|privado|mejores_amigos"
        datetime expira_at "24h"
    }
    PISTA {
        uuid id PK
        string titulo
        string artista
        string ambiente
        int duracion_s
        string licencia "libre|proveedor|catalogo"
        string paises "donde se puede usar"
        bool apta_profesional
        string estado "activa|retirada"
    }
    VALORACION_PLAN {
        uuid id PK
        uuid plan_id FK
        uuid autor_id FK "asistente"
        int estrellas "1-5"
        string opinion "max 500"
        string visibilidad "publica|privada|null=general"
        datetime fecha
    }
    DIRECTO {
        uuid id PK
        uuid emisor_id FK
        uuid plan_id FK "plan en marcha"
        string titulo
        string estado "en_curso|finalizado"
        datetime inicio
        datetime fin
    }
    COMPARTIDO {
        uuid id PK
        uuid publicacion_id FK "o plan_id, o perfil_id"
        uuid usuario_id FK
        string destino "chat|story|whatsapp|telegram|copiar|imagen|qr|sistema"
        string destinatarios "si es chat"
        datetime fecha
    }
    COMENTARIO {
        uuid id PK
        uuid publicacion_id FK
        uuid autor_id FK
        string texto
        datetime fecha
    }
    ME_GUSTA {
        uuid usuario_id FK
        uuid publicacion_id FK
        datetime fecha
    }
    MENCION {
        uuid id PK
        string tipo "etiqueta|pie|comentario"
        string contenido_tipo "publicacion|plan|story"
        uuid contenido_id
        uuid autor_id FK
        uuid usuario_mencionado_id FK
        string estado "pendiente|aceptada|rechazada"
    }
    CONVERSACION {
        uuid id PK
        string tipo "chat_plan|dm"
        uuid plan_id FK "si chat_plan"
        string estado "aceptada|solicitud|enviada"
    }
    MENSAJE {
        uuid id PK
        uuid conversacion_id FK
        uuid autor_id FK
        string texto "max 1000"
        string media "foto, difuminada si es de un desconocido"
        string compartido "publicacion o plan, opcional"
        uuid saludo_plan_id FK "saludo yo-tambien-estoy, opcional"
        string estado "solicitud|aceptado"
        bool leido
    }
    REPORTE {
        uuid id PK
        uuid reportante_id FK "null si viene del filtro; anonimo ante reportado"
        string origen "usuario|automatico"
        uuid reportado_id FK
        string objeto_tipo "usuario|conversacion|publicacion|comentario|mensaje|plan|evento"
        uuid objeto_id
        string categoria "spam|acoso|sexual|suplantacion|estafa|menor|peligro|otro"
        string categoria_filtro "amenaza|odio|spam|insulto, si es automatico"
        string evidencia "copia del texto o de los mensajes"
        string gravedad "critica 1h|alta 24h|media 48h|baja 72h"
        string estado "en_cola|en_revision|resuelto|desestimado|escalado"
        datetime fecha
    }
    ACCION_MODERACION {
        uuid id PK
        uuid reporte_id FK "opcional"
        uuid persona_id FK "afectada"
        uuid moderador_id FK "null si es automatica"
        string tipo "retener|retirar|aviso|reduccion_alcance|retirar_organizar|suspension_7|suspension_30|cierre|autoridades|retener_escrow"
        string objeto_tipo
        uuid objeto_id
        string motivo "categoria y norma incumplida"
        string exposicion_motivos "lo que se le dice, art. 17 DSA"
        bool automatica
        string estado "en_revision|vigente|revocada"
        datetime fecha
        datetime hasta "en suspensiones"
    }
    APELACION {
        uuid id PK
        uuid accion_id FK "o reporte_id si apela quien reporto"
        uuid persona_id FK
        string texto "max 1000"
        uuid revisor_id FK "distinto de quien decidio"
        string estado "pendiente|estimada|desestimada"
        datetime fecha
    }
    CONTACTO_CONFIANZA {
        uuid id PK
        uuid usuario_id FK
        string nombre
        string telefono "E.164, cifrado"
        string estado "invitado|aceptado|rechazado"
    }
    EVENTO_SEGURIDAD {
        uuid id PK
        uuid usuario_id FK
        uuid plan_id FK
        string tipo "compartir|llegada|sos|sin_respuesta"
        point ubicacion "solo en SOS"
        string estado "activa|cerrada (SOS)"
        string cerrada_por "usuario|equipo"
        bool avisado_112
        datetime fecha
    }
    SOLICITUD_DATOS {
        uuid id PK
        uuid persona_id FK
        string tipo "exportar|borrar|rectificar|oponerse|limitar"
        string estado "recibida|en_proceso|lista|caducada"
        string enlace "exportacion, firmado y caducable"
        datetime fecha
        datetime completada
    }
    SUSCRIPCION_NEGOCIO {
        uuid id PK
        uuid cuenta_empresa_id FK
        string tarifa
        string estado
    }
    CAMPANA_BOOST {
        uuid id PK
        uuid anunciante_id FK
        string tipo "campana_marca|boost"
        uuid plan_promocionado_id FK "en boost"
        decimal presupuesto
    }
    CATEGORIA {
        uuid id PK
        string nombre
        string estado "activa|fusionada|jubilada"
    }
    CONSENTIMIENTO {
        uuid id PK
        uuid persona_id FK
        string tipo "terminos|privacidad|edad|codigo_conducta|ubicacion|verificacion|pagos|marketing|analitica|personalizacion"
        string version
        bool valor "historico: cada cambio es una fila nueva"
        datetime fecha
    }
    SESION_DISPOSITIVO {
        uuid id PK
        uuid persona_id FK
        string dispositivo
        datetime ultima_actividad
    }
    NOTIFICACION {
        uuid id PK
        uuid usuario_id FK
        string tipo "recordatorio|solicitud|mensaje|cambio|plaza|despues_plan|seguidor|mencion|seguridad|pago|aqui|chispa"
        string referencia "plan, conversacion o ruta"
        string texto
        bool leida
        datetime fecha
    }
```
