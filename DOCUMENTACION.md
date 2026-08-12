# LEVEL UP — Documentación del Sitio

> **La nueva era del fútbol amateur.** Plataforma deportiva digital que convierte cada partido de fútbol amateur en una carrera deportiva con progresión tipo videojuego: carta estilo FIFA, OVR, rangos, rankings, equipos y torneos.

- **Dominio:** [levelupp.com.co](https://levelupp.com.co)
- **Ubicación / mercado:** Bogotá, Colombia
- **Etapa:** Temporada Piloto (BETA) · 2026
- **Documento actualizado:** 7 de agosto de 2026

---

## 1. Resumen ejecutivo

LEVEL UP es una **web app** (no una app nativa) construida como sitio estático en **JavaScript vanilla, sin framework ni paso de build**, con una capa de nube en **Supabase** (base de datos, RPCs seguros, Storage y Edge Functions) y pagos mediante la pasarela colombiana **Wompi**.

La propuesta: el jugador crea un perfil gratuito, obtiene una **carta deportiva digital** (estilo FIFA Ultimate Team) con un **OVR** y 6 atributos, y esa carta **evoluciona partido a partido**. El equipo de LEVEL UP registra el desempeño en cancha, lo que actualiza el OVR, la XP, el rango y el ranking del jugador.

Hay **dos modos de juego**:

| Modo | Descripción |
|------|-------------|
| **Modo Libre** (Partidos) | Organiza o únete a partidos informales en cualquier cancha. Filtros por zona, horario y modalidad. Sin medición oficial de estadísticas (da XP básica por participar). |
| **Rey del Barrio** (Competitivo) | El modo oficial. Solo en **canchas certificadas** donde el equipo toma medidas en tiempo real. Cada partido afecta directamente OVR, estadísticas y rango. |

---

## 2. Arquitectura general

```
┌──────────────────────────────────────────────────────────────┐
│  NAVEGADOR (cliente)                                          │
│  ├─ Páginas HTML estáticas (una vista real por archivo)       │
│  ├─ app.js  (~7.955 líneas, toda la lógica, JS vanilla)       │
│  ├─ storage-shim.js  (window.LS: almacenamiento resiliente)   │
│  └─ style.css / redesign.css / landing-v4.css                 │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTPS
        ┌───────┴─────────┐                 ┌────────────────────┐
        ▼                 ▼                 ▼                    ▼
┌──────────────┐  ┌───────────────┐  ┌──────────────┐   ┌──────────────┐
│  Supabase    │  │ Supabase RPCs │  │  Supabase    │   │    Wompi     │
│  Postgres    │  │ (security     │  │  Edge Funcs  │   │  (pagos COP) │
│  + RLS       │  │  definer)     │  │  (Deno)      │   │              │
└──────────────┘  └───────────────┘  └──────┬───────┘   └──────┬───────┘
                                            └── wallet-webhook ◄┘
        Hosting estático: Cloudflare Pages (wrangler.toml)
```

### Principios de diseño técnico

- **Sin SPA ni router formal.** Cada archivo `.html` es una vista real. La navegación usa `location.href`. `getCurrentPage()` detecta la página actual y `renderNav()` pinta el menú dinámico.
- **Un único script global.** `app.js` es plano en el scope global; las funciones se exponen globalmente porque el HTML las llama con `onclick="..."` inline. `initApp()` se autoejecuta al final.
- **La nube es la fuente de verdad.** Estado en memoria en variables globales (`profiles`, `state`, `openMatches`, `teams`, etc.), con un cuarteto por entidad: `entityToRow` / `rowToEntity` / `pushEntityToCloud` / `syncEntityFromCloud`.
- **Sincronización periódica cada 45 s** (`setInterval(runSync, 45000)`), pausada cuando la pestaña está oculta para ahorrar egress, con refresco inmediato en `visibilitychange`.
- **Código defensivo para móviles y redes flojas.** `withTimeout()` envuelve las promesas de red, hay reintentos con backoff, watchdogs que reactivan botones a los 10 s y reparación de perfiles incompletos (`normalizeProfile`) para no congelar el arranque.

---

## 3. Infraestructura

### 3.1 Hosting — Cloudflare Pages

`wrangler.toml`:
```toml
name = "level-up"
compatibility_date = "2024-09-23"

[assets]
directory = "./"
not_found_handling = "404-page"
```
Sitio 100% estático servido desde la raíz del repositorio.

### 3.2 Backend — Supabase

- **Proyecto:** `https://vwihedjfxrilfdpmuzzu.supabase.co`
- **Llave usada en el frontend:** publishable/anon (`sb_publishable_...`) — pública por diseño.
- **Cliente:** `window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)` → constante `sb`, desde el UMD de `@supabase/supabase-js@2` (CDN jsDelivr).

**Tablas Postgres** (acceso vía `sb.from(...)`):

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Perfiles de jugadores (la más usada). |
| `open_matches` | Partidos abiertos del Modo Libre. |
| `match_invites` | Invitaciones a partidos. |
| `teams` | Equipos (Rey del Barrio). |
| `team_invites` | Invitaciones a equipos. |
| `team_challenges` | Retos entre equipos. |
| `team_matches` | Partidos de equipo programados/finalizados. |
| `tournaments` | Torneos. |
| `wallet_transactions` | Libro contable del saldo (fuente de verdad del dinero). |

**Storage:** bucket `player-photos` (fotos de jugador/equipo, subidas en base64 bajo demanda).

**RPCs (funciones `security definer` del servidor):**
`verify_login`, `request_password_reset`, `confirm_password_reset`, `email_available`, `delete_my_match`, `get_match_messages`, `post_match_message`, `submit_feedback`, `my_feedback`, `admin_list_feedback`, `admin_reply_feedback`, `admin_set_is_admin`, `award_coins`, `upsert_tournament`, `set_tournament_status`, `delete_tournament`, `tournament_add_team`, `apply_wallet_transaction`.

### 3.3 Edge Functions (Deno) — `supabase/functions/`

| Función | Rol |
|---------|-----|
| `wallet-init-recharge` | Recibe `{ profileId, amount }` (mínimo $5.000) y devuelve los datos **firmados** que el frontend necesita para abrir el Widget de Wompi. Calcula la firma de integridad `SHA-256(referencia + montoEnCentavos + moneda + secreto)`. El secreto de integridad **nunca** llega al navegador. La referencia codifica el `profileId`: `LU-RECARGA-<profileId>-<timestamp>`. |
| `wallet-webhook` | Recibe los eventos oficiales de Wompi, **verifica el checksum** con el secreto de eventos, y solo si el pago está `APPROVED` acredita el saldo. Es **la única vía** por la que el saldo sube. Idempotente (no duplica si ya existe la transacción/referencia), acredita vía RPC `apply_wallet_transaction` y añade una notificación al perfil. |

Variables de entorno de las funciones: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`.

### 3.4 Scripts SQL de configuración

- **`SQL_WALLET_SETUP.sql`** — Sistema de saldo:
  - Añade `profiles.saldo` (cacheado para lectura rápida).
  - Crea la tabla contable `wallet_transactions` (tipos: `recarga`, `pago_partido`, `reembolso`, `bonificacion`, `promocion`, `premio`).
  - Trigger `protect_saldo`: **bloquea cualquier modificación directa** de `profiles.saldo` que no venga de la función autorizada (protege contra PATCH directo con la llave pública).
  - Función `apply_wallet_transaction` (única vía autorizada para mover saldo, solo ejecutable por la Edge Function con service_role).
  - RLS: cualquiera puede **leer** `wallet_transactions`, nadie puede escribir salvo `service_role`.
- **`SQL_TEAMS_SETUP.sql`** — Equipos / Rey del Barrio / Retos: crea `teams`, `team_challenges`, `team_matches`, `team_invites` con RLS permisiva ("allow all") acorde al modelo de confianza de la beta (solo publishable key). Incluye `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` idempotentes (la columna `leave_requests` es crítica: si falta, todas las escrituras de equipo fallan).

### 3.5 Integraciones externas

| Integración | Uso |
|-------------|-----|
| **Wompi** | Pasarela de pago colombiana (producción). Widget cargado desde `checkout.wompi.co/widget.js`. Recargas de saldo e inscripción a torneos. |
| **WhatsApp** | Deep links `wa.me` para invitar jugadores a equipos, torneos y slots. |
| **Google Maps** | Enlaces a la ubicación de las canchas. |
| **WebAudio API** | Música de fondo (`theme.mp3`) y sonidos sintetizados de subida de rango. |
| **Google Fonts** | Orbitron + Inter. |

---

## 4. Almacenamiento resiliente (`storage-shim.js`)

Debe cargarse como **primer script síncrono** en todas las páginas. La app usa **siempre `window.LS`**, nunca `localStorage` directo.

**Problema que resuelve:** en algunos Safari/iPhone (modo privado, "bloquear todas las cookies") y en los navegadores in-app de Instagram / Facebook / TikTok, `localStorage` lanza excepción o se **borra/aísla al navegar** entre páginas → la sesión se pierde y el usuario "verifica y no entra".

**Solución:** `window.LS` usa `localStorage` nativo cuando funciona y **espeja siempre en `window.name`** (que sí sobrevive la navegación dentro de la misma pestaña). Si el nativo viene vacío, lee del respaldo. Si el nativo está totalmente bloqueado, opera 100% sobre `window.name` (sesión efímera, aceptable).

**Modo seguro (`?safe`):** `levelupp.com.co/?safe` activa un modo de diagnóstico/rescate que apaga vía CSS (`.safe-mode`) todo efecto visual costoso, para recuperar GPUs que se corrompían con los efectos del hero. `?nosafe` lo desactiva.

---

## 5. Modelo de datos del jugador

Estructura de un perfil (`makeProfile()` / `rowToProfile()`):

- **Identidad:** `id` (`p_<timestamp>_<rand>`), `name` (mayúsculas), `nickname` (único), `email`, `gender`, `position` (POR/DEF/MED/DEL), `team`, `dorsal` (1–99).
- **Fotos:** `photo` (medio cuerpo → carta) y `photoFull` (cuerpo completo → ficha). Las sube el equipo de LEVEL UP en el primer partido, no el usuario al registrarse.
- **Progresión:** `ovr` (inicia en **60**), `xp`, `lp` (Level Points), `matches`, `goals`, `assists`, `mvps`, `history[]`, `achievements[]`.
- **Atributos** `attrs = { pac, sho, pas, dri, def, fis }` → RITMO, TIRO, PASE, REGATE, DEFENSA, FÍSICO. Todos inician en 60.
- **Físicos** `physical = { weight, height, age, foot }` (editables solo por admin).
- **Sistema:** `saldo` (guardado en pesos, campo protegido), `isAdmin`, `founder`, `notifications[]`, `notifSeenCount`, calificaciones de comunidad, `pendingReveal`.

### Cómo evoluciona el OVR

El OVR **no se deriva de los atributos**; es un valor independiente que se mueve por partido según la calificación (`computeMatchDeltas`):

- calificación ≥ 9 → **+2** OVR
- calificación ≥ 7.5 → **+1**
- calificación < 5 → **−1**
- entre 5 y 7.5 → 0
- acotado a **[40, 99]**

Ganancias por partido:
- `XP = 80 + goles·15 + asistencias·10 + (MVP ? 50 : 0) + round(cal·5)`
- `LP = 4 + (MVP ? 3 : 0) + (cal ≥ 8 ? 2 : 0)`

---

## 6. Sistema de rangos

8 rangos, determinados por la **XP acumulada** (`getRank(xp)` toma el rango más alto cuyo umbral `min ≤ xp`). Cada rango tiene un marco-imagen tipo carta en `assets/ranks/`.

| # | Rango | Emoji | XP mínima | Lema |
|---|-------|-------|-----------|------|
| 1 | CANTERANO | 🥉 | 0 | El comienzo de tu historia |
| 2 | DEBUTANTE | 🥈 | 1.000 | Das tus primeros pasos |
| 3 | REVELACIÓN | ❄️ | 3.000 | Empiezas a llamar la atención |
| 4 | ELITE | ⭐ | 7.000 | Compites contra los mejores |
| 5 | CONSAGRADO | 🔥 | 15.000 | Tu nombre ya pesa en la cancha |
| 6 | ÍDOLO | 👑 | 30.000 | Eres referente e inspiración |
| 7 | LEYENDA | 🏛 | 60.000 | Tu historia ya es parte de LEVEL UP |
| 8 | GOAT | 🐐 | 120.000 | Eres el mejor de todos los tiempos |

Se asciende acumulando XP (jugar, goles, asistencias, MVP, buena calificación, constancia). La subida dispara una animación cinematográfica con sonido en la secuencia post-partido (reveal).

---

## 7. Level Coins (billetera)

- Saldo guardado internamente en **pesos** pero mostrado siempre en **coins** (equivalencia interna 1 coin ≈ $1.300).
- **Se ganan** jugando (el admin acredita coins al equipo ganador: 2 coins + 1 extra al MVP, vía RPC `award_coins`) o **se compran** con paquetes vía Wompi (la comisión de la pasarela va incluida en el precio).
- **Se usan** para inscripción a torneos, premios (canje de uniforme/kit) y transferencias entre jugadores.
- **Seguridad del dinero:** el saldo solo se mueve por `apply_wallet_transaction` (service_role); un trigger de Postgres bloquea cualquier escritura directa desde el frontend.

---

## 8. Autenticación y seguridad

- **Registro** (`submitNewProfile`): valida nombre, apodo único, correo, contraseña, consentimiento de datos y **filtro de groserías** propio (`BANNED_WORDS` con normalización de acentos). Inserta con INSERT (no UPSERT) — el índice único de la BD es el guardián real de duplicados.
- **Contraseñas:** hash **SHA-256** con fallback a implementación JS pura cuando `crypto.subtle` no existe (WebViews/contextos no seguros). Mínimo 6 caracteres con letras y números.
- **Login** (`verify_login`): el hash se compara **en el servidor**, nunca sale de la BD.
- **Recuperación de contraseña:** por **correo + código de 6 dígitos** (`request_password_reset` / `confirm_password_reset`). Mensaje neutro que no revela si el correo existe. (La antigua pregunta de seguridad quedó deprecada.)
- **Columnas protegidas** (`password_hash`, `security_answer_hash`, `email`, `is_admin`, `saldo`, `founder`): nunca se exponen en lectura pública ni se escriben desde el frontend. La protección real recae en RPCs `security definer`, triggers y RLS del lado servidor.

---

## 9. Panel de administración

Un admin (`state.isAdmin`, asignable solo vía RPC seguro `admin_set_is_admin`) puede:

- **Editar cualquier jugador:** fotos (carta y ficha), peso, altura, edad, pie dominante, y conceder/quitar el rol admin.
- **Registrar/finalizar partidos del Modo Libre:** temporizador en vivo, ajuste de estadísticas por jugador, goles, MVP; recalcula OVR/XP/LP/logros de todos y sincroniza a la nube.
- **Registrar partidos Rey del Barrio:** resultado, MVP, estadísticas; actualiza el récord de los equipos y **acredita Level Coins** al ganador.
- **Registro manual en cancha** (`admin-partido.html`): marcador y tabla de estadísticas en vivo (goles, tarjetas, tiros al arco, faltas por jugador) con cálculo automático de calificaciones.
- **Gestión de torneos:** crear, cambiar estado, eliminar, agregar equipos.
- **Bandeja de feedback/tickets:** ver, responder y cerrar reportes (bug/idea) enviados por los usuarios.

---

## 10. Mapa del sitio (páginas)

Todas las páginas de la app comparten cabecera (logo, nav dinámico, badge "TEMPORADA BETA", campana de notificaciones, menú PERFIL y menú "JUGAR PARTIDO"), un ticker de actividad, y cargan `storage-shim.js` + `style.css` + `app.js`.

### Públicas / landing
| Archivo | Función |
|---------|---------|
| `index.html` | **Landing principal.** Hero "JUEGA. COMPITE. ASCIENDE.", secciones narrativas (dolor, "imagina un lugar donde", manifiesto, preview de carta bloqueada, teaser, CTA final) y el modal de registro/login/reset. Redirige a `dashboard.html` si ya hay sesión. |
| `privacidad.html` | **Política de Tratamiento de Datos Personales y de Imagen** (habeas data colombiano: Ley 1581/2012, Decreto 1377/2013). Última actualización 25-jun-2026. |

### Con sesión
| Archivo | Función |
|---------|---------|
| `dashboard.html` | **Centro de mando.** Hero de bienvenida, "¿Qué es LEVEL UP?", los dos modos de juego, sistema de rangos, cómo subir de rango y "Tu progreso hoy". |
| `buscar-partido.html` | **Partidos (Modo Libre).** Asistente de 6 pasos para crear partidos; unirse, filtrar, chatear, compartir por WhatsApp y ver el mapa. |
| `equipos.html` | **Equipos / Rey del Barrio.** 3 pestañas: Crear/Mi equipo, Rey del Barrio (retos) y Partidos programados. |
| `torneos.html` | **Torneos.** Competencia oficial; inscripción de equipos, 3 premios, pago con saldo o Wompi (crear solo admin). |
| `premios.html` | **Premios.** Vitrina de recompensas y uniforme oficial, canjeables con coins. |
| `carta.html` | **Mi Carta.** La ficha/carta estilo FIFA del jugador. |
| `jugadores.html` | **Jugadores (Comunidad).** Buscador de jugadores y vista de fichas ajenas. |
| `ranking.html` | **Ranking general.** Todos los jugadores ordenados por OVR, con buscador. |
| `saldo.html` | **Mis Level Coins.** Billetera: saldo, recarga, historial y transferencias. |
| `notificaciones.html` | **Notificaciones.** Feed de actualizaciones de la carta e invitaciones. |
| `configuracion.html` | **Configuración.** Edición de apodo, dorsal, correo y cambio de contraseña. |
| `temporada-piloto.html` | **Temporada Beta.** Página informativa de la etapa piloto y "próximamente". |

### Herramientas / diagnóstico
| Archivo | Función |
|---------|---------|
| `admin-partido.html` | Panel/marcador de administración de un partido en vivo (CSS propio). |
| `estado.html` | Página de diagnóstico: prueba conectividad con Supabase (leer, RPC, escribir) y permite copiar el resultado para soporte. |

### Maquetas / previews (no productivas)
`index-v4.html` (+ `landing-v4.css`), `index-preview.html` (+ `redesign.css`), `torneo-preview.html`, `premios-preview.html`, `wallet-preview.html`. Son iteraciones de diseño con CSS embebido, precursoras de las páginas finales.

---

## 11. Módulos funcionales (en `app.js`)

**Activos** (`FUNCTIONAL_MODULES`): Mi Ficha, Partidos, Rey del Barrio, Torneos, Premios, Ranking.

- **Mi Ficha / Carta** — carta estilo FIFA con marco por rango, OVR, atributos, físicos y calificaciones de comunidad.
- **Partidos abiertos** — wizard de 6 pasos (modalidad → categoría → superficie → arena → fecha/hora → detalles), unión con aprobación del creador, filtros, estados por tiempo, chat de partido (RPCs), compartir, mapa, +50 XP por partido libre.
- **Rey del Barrio / Equipos** — crear equipo (escudo, capitán, colores, slots por posición), invitaciones (slot/WhatsApp/link), solicitudes de ingreso/salida, retos entre equipos con contraofertas, partidos de equipo, OVR y récord de equipo.
- **Torneos** — creación (admin), inscripción de equipos, 3 premios, pago con saldo o Wompi.
- **Ranking** — general por OVR/XP, búsqueda, vista pública de perfil, calificación entre compañeros que compartieron partido.
- **Saldo / Level Coins** — paquetes, recarga rápida, historial.
- **Notificaciones** — feed in-app con badge de no-leídas.
- **Secuencia post-partido (reveal)** — animación cinematográfica: procesamiento → revelado → evolución de OVR → subida de rango (con sonido) → recompensas → stats → logros → compartir carta como imagen.
- **Logros** — primer MVP, hat-trick, asistencia perfecta, muralla defensiva, 100 partidos, top 100.
- **Feedback/Tickets** — reportes de bug/idea con bandeja de admin.

**Próximamente** (`WIP_MODULES`, ~15): Fantasy, Marketplace, IA Scouting, entre otros, mostrados con modal "trabajo en progreso".

---

## 12. Assets

- **Fondos (JPG + WebP):** `bg-hero-stadium` (hero), `bg-competitivo-aerea` (competitivo), `bg-comunidad-tribuna` (comunidad).
- **Marca / jugador:** `logo.png`, `player-photo.png`, `card-generator.png`.
- **Premios:** `premio-kit-front/full/0..3.png` (uniforme oficial).
- **Audio:** `theme.mp3` (~3 MB, música de fondo).
- **`assets/ranks/`** — Los 8 marcos de rango como PNG con fondo transparente y centro libre (el OVR, foto, nombre y stats se renderizan encima). Cada rango tiene su versión base y una variante `-t`. Si faltan, la carta cae a marcos CSS por defecto sin romperse.

### Hojas de estilo
| Archivo | Rol |
|---------|-----|
| `style.css` (~256 KB) | Estilos globales de toda la app. Variables de marca en `:root`: verde `#00ff88`, magenta `#ff00aa`, naranja `#ff6600`, dorado `#c9a84c`, fondo `#020408`; fuentes Orbitron/Inter. |
| `redesign.css` (~14 KB) | Capa de rediseño de la landing (usada por `index-preview.html`). |
| `landing-v4.css` (~9 KB) | Estilos de la landing alternativa v4. |

---

## 13. Historial de lo construido

El repositorio tiene **50 commits** (del **7 al 31 de julio de 2026**). Grandes bloques de trabajo, en orden aproximado:

1. **Base de la plataforma:** landing narrativa, carta FIFA, sistema de OVR/XP/rangos, perfiles y ranking.
2. **Modo Libre (Partidos):** wizard de creación, unión con aprobación, chat de partido, filtros, superficies (césped/lisa/sala), mapa y compartir.
3. **Rey del Barrio (Equipos):** creación de equipos, slots por posición, retos con contraofertas, invitaciones por WhatsApp/link, partidos de equipo. Tablas Supabase (`SQL_TEAMS_SETUP.sql`).
4. **Torneos:** creación por admin, inscripción de equipos, premios (1º/2º/3º), valor por jugador y cancha con ubicación en Maps.
5. **Level Coins + Wompi:** billetera, paquetes de coins (con comisión incluida), recarga firmada por Edge Function, webhook idempotente, trigger de protección de saldo (`SQL_WALLET_SETUP.sql`). Todo migrado a "coins" en la UI.
6. **Premios:** vitrina con uniforme oficial, canje directo con coins, entrega en el próximo partido competitivo.
7. **Robustez de acceso:** almacenamiento resiliente `window.LS` (fallback `window.name`), registro/login a prueba de Safari bloqueado y de WebViews de Instagram/Facebook, hash SHA-256 con fallback JS, aviso "abre en tu navegador".
8. **Rendimiento y GPU:** desactivación de capas costosas del hero (humo/beams/partículas/blend), eliminación del parallax, modo seguro `?safe`, modo lite-fx automático.
9. **Móvil / UX:** menú hamburguesa (≤900px), botón JUGAR en el encabezado, modales con X universal y tecla Esc, editor de admin desplazable.
10. **Panel de administración:** editor de jugador, marcador compacto para registrar métricas, aplicación real del rol admin en la nube, contador de jugadores usando el conteo real de la nube.

---

## 14. Estructura del repositorio

```
LEVEL-UP/
├── index.html                  # Landing principal
├── dashboard.html              # Centro de mando
├── buscar-partido.html         # Partidos (Modo Libre)
├── equipos.html                # Equipos / Rey del Barrio
├── torneos.html                # Torneos
├── premios.html                # Premios
├── carta.html                  # Mi Carta
├── jugadores.html              # Comunidad
├── ranking.html                # Ranking general
├── saldo.html                  # Level Coins
├── notificaciones.html         # Notificaciones
├── configuracion.html          # Configuración
├── temporada-piloto.html       # Temporada Beta (info)
├── privacidad.html             # Política de datos
├── admin-partido.html          # Panel admin de partido en vivo
├── estado.html                 # Diagnóstico de conectividad
├── index-v4.html / *-preview.html   # Maquetas de diseño
├── app.js                      # Toda la lógica (~7.955 líneas)
├── storage-shim.js             # window.LS resiliente
├── style.css / redesign.css / landing-v4.css
├── SQL_WALLET_SETUP.sql        # Setup del sistema de saldo
├── SQL_TEAMS_SETUP.sql         # Setup de equipos/retos/partidos
├── wrangler.toml               # Config Cloudflare Pages
├── assets/                     # Imágenes, audio, marcos de rango
│   └── ranks/                  # 8 marcos de rango (base + variante -t)
└── supabase/
    └── functions/
        ├── wallet-init-recharge/index.ts
        └── wallet-webhook/index.ts
```

---

## 15. Notas de seguridad

- Las llaves *publishable* de Supabase y la *public key* de Wompi están hardcodeadas en el frontend: es lo esperado, son públicas por diseño.
- La seguridad real recae en el servidor: RPCs `security definer`, triggers de columnas protegidas (`protect_saldo`), y RLS. El frontend **nunca** escribe credenciales, `saldo`, `is_admin` ni `founder` directamente.
- Los secretos de Wompi (`WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`) y la `SERVICE_ROLE_KEY` viven solo en las Edge Functions, nunca en el navegador.
- El saldo solo puede subir por el webhook de Wompi tras verificar la firma del evento — no hay forma de acreditar dinero desde el cliente.

---

*Documento generado a partir del código fuente del repositorio (rama `claude/site-documentation-markdown-8nmu2v`).*
