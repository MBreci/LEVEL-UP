# LEVEL UP — Documentación del Sitio

> **La nueva era del fútbol amateur.** Plataforma deportiva digital que convierte cada partido de fútbol amateur en una carrera deportiva con progresión tipo videojuego: carta estilo FIFA, OVR, rangos, rankings, equipos y torneos.

- **Dominio:** [levelupp.com.co](https://levelupp.com.co)
- **Ubicación / mercado:** Bogotá, Colombia
- **Etapa:** Temporada Piloto (BETA) · 2026
- **Documento actualizado:** 1 de septiembre de 2026 (migración completa a Next.js)

---

## 1. Resumen ejecutivo

LEVEL UP es una **web app** (no una app nativa) construida en **Next.js 16 (App Router, TypeScript)** con exportación 100% estática (`output: 'export'`), con una capa de nube en **Supabase** (base de datos, RPCs seguros, Storage y Edge Functions) y pagos mediante la pasarela colombiana **Wompi**. El backend, el contrato de datos y toda la lógica de negocio son idénticos a la versión original en JavaScript vanilla — esta fue una migración de framework, no un rediseño funcional.

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
│  ├─ Next.js 16 App Router — 100% Client Components             │
│  ├─ context/*.tsx  (un provider por entidad: perfiles, auth,   │
│  │   partidos, equipos, invitaciones, torneos, sync 45s)       │
│  ├─ lib/domain/*.ts  (mapeo fila↔objeto + llamadas Supabase,   │
│  │   una por entidad, framework-agnóstico)                     │
│  ├─ lib/localStore.ts  (useSyncExternalStore sobre storage-    │
│  │   shim.js: window.LS resiliente, ya no localStorage crudo) │
│  └─ app/globals.css  (puerto 1:1 de style.css)                 │
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
        Hosting estático: Cloudflare Workers (wrangler.toml → ./out)
```

### Principios de diseño técnico

- **App Router de Next.js, sin servidor real.** No hay Server Components con datos, no hay Route Handlers, no hay middleware — todo el árbol es Client Components, porque toda la sesión vive en `localStorage`/`window.name` (vía `window.LS`), igual que el original. El "enrutamiento" real sigue siendo puramente del lado del cliente; `AuthGuard` (no un middleware) redirige si no hay perfil activo.
- **Un contexto de React por entidad**, cada uno con el mismo patrón: estado respaldado por `createLocalStore()` (basado en `useSyncExternalStore`, no `useState`+`useEffect` — evita el parpadeo de hidratación y las reglas de lint de React 19 sobre setState en efectos), una función `refresh()` registrada en `SyncRegistry` (el reemplazo del `setInterval(runSync, 45000)` original) y acciones que hacen `pushXToCloud`/mutan el store local.
- **`lib/domain/*.ts`** son la traducción directa y fiel de las funciones puras de `app.js` — mismos nombres de tabla, mismas columnas, mismos RPCs, mismas fórmulas (OVR/XP/LP, calificación, achievements). Cero cambios de contrato con Supabase.
- **La nube sigue siendo la fuente de verdad**, con el mismo patrón "local-first + sync": se pinta desde el store local al montar, y en paralelo se sincroniza contra Supabase cada 45 s mientras la pestaña está visible.
- **Grupos de rutas aislados** para las páginas que no comparten el shell de la app: `(public)` (landing/privacidad), `(app)` (todo lo autenticado, con `AppHeader`/`ActivityTicker`/`AppFooter`/`AuthGuard`), `(admin-console)` (solo `/admin/partido`, sin ningún chrome compartido — replica el aislamiento total del `admin-partido.html` original, que tampoco cargaba `style.css`), y `(previews)` (mockups + diagnóstico, sin auth ni providers, todas con `robots: noindex`).

---

## 3. Infraestructura

### 3.1 Hosting — Cloudflare Workers (Static Assets)

`wrangler.toml`:
```toml
name = "levelup"
compatibility_date = "2024-09-23"

[assets]
directory = "./out"
not_found_handling = "404-page"
```
`./out` es la salida de `next build` (exportación estática). El despliegue sigue siendo 100% estático — no hay Worker con lógica de servidor, solo archivos.

### 3.2 Backend — Supabase

- **Proyecto:** `https://vwihedjfxrilfdpmuzzu.supabase.co`
- **Llave usada en el frontend:** publishable/anon (`sb_publishable_...`) — pública por diseño, ahora en `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en vez de hardcodeada en el HTML.
- **Cliente:** `@supabase/supabase-js` como dependencia npm (ya no UMD por CDN), instanciado una sola vez en `lib/supabase/client.ts` → `getSupabase()`.

**Tablas Postgres** (acceso vía `sb.from(...)`) — sin cambios respecto al original:

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

**Storage:** bucket `player-photos` (fotos de jugador/equipo).

**RPCs (funciones `security definer` del servidor):**
`verify_login`, `request_password_reset`, `confirm_password_reset`, `email_available`, `delete_my_match`, `get_match_messages`, `post_match_message`, `submit_feedback`, `my_feedback`, `admin_list_feedback`, `admin_reply_feedback`, `admin_set_is_admin`, `award_coins`, `upsert_tournament`, `set_tournament_status`, `delete_tournament`, `tournament_add_team`, `apply_wallet_transaction`, `redeem_prize`, `set_my_email`, `change_my_password`.

### 3.3 Edge Functions (Deno) — `supabase/functions/` (sin cambios, no forman parte de la migración)

| Función | Rol |
|---------|-----|
| `wallet-init-recharge` | Recibe `{ profileId, amount }` (mínimo $5.000) y devuelve los datos **firmados** que el frontend necesita para abrir el Widget de Wompi. El secreto de integridad **nunca** llega al navegador. |
| `wallet-webhook` | Recibe los eventos oficiales de Wompi, **verifica el checksum**, y solo si el pago está `APPROVED` acredita el saldo vía `apply_wallet_transaction`. **La única vía** por la que el saldo sube. |

### 3.4 Scripts SQL de configuración

- **`SQL_WALLET_SETUP.sql`** — saldo, `wallet_transactions`, trigger `protect_saldo`, función `apply_wallet_transaction`.
- **`SQL_TEAMS_SETUP.sql`** — `teams`, `team_challenges`, `team_matches`, `team_invites`.
- **`SQL_ADMIN_STATS_SETUP.sql`** — soporte para el Centro de Estadísticas admin.

### 3.5 Integraciones externas

Sin cambios: **Wompi** (widget `checkout.wompi.co/widget.js`), **WhatsApp** (`wa.me`), **Google Maps**, **WebAudio API** (`theme.mp3`), **Google Fonts** Orbitron + Inter (ahora vía `next/font/google` en `app/layout.tsx`, no un `<link>` por página).

---

## 4. Almacenamiento resiliente (`storage-shim.js`)

Sigue siendo el mismo archivo, ahora servido desde `public/storage-shim.js` y cargado una sola vez en `app/layout.tsx` vía `<Script src="/storage-shim.js" strategy="beforeInteractive">` (antes se repetía el `<script>` en cada página HTML). La app sigue usando **siempre `window.LS`**, nunca `localStorage` directo — en React, a través del helper tipado `lib/storage.ts` y el store reactivo `lib/localStore.ts`.

**Problema que resuelve** (sin cambios): en algunos Safari/iPhone y navegadores in-app de Instagram/Facebook/TikTok, `localStorage` se bloquea o se aísla al navegar. `window.LS` espeja en `window.name` como respaldo.

---

## 5. Modelo de datos del jugador

Sin cambios respecto al original — ver `lib/domain/profiles.ts` (`makeProfile()` / `rowToProfile()` / `profileToRow()`):

- **Identidad:** `id` (`p_<timestamp>_<rand>`), `name`, `nickname` (único), `email`, `gender`, `position`, `team`, `dorsal`.
- **Fotos:** `photo` (carta) y `photoFull` (ficha), subidas por el equipo de LEVEL UP o desde el editor admin.
- **Progresión:** `ovr` (inicia en **60**), `xp`, `lp`, `matches`, `goals`, `assists`, `mvps`, `history[]`, `achievements[]`.
- **Atributos** `attrs = { pac, sho, pas, dri, def, fis }`.
- **Físicos** `physical = { weight, height, age, foot }`.
- **Sistema:** `saldo` (protegido), `isAdmin`, `founder`, `notifications[]`, `notifSeenCount`, calificaciones de comunidad, `pendingReveal`.

### Cómo evoluciona el OVR

Fórmula idéntica, portada tal cual en `lib/domain/matchDeltas.ts::computeMatchDeltas`:

- calificación ≥ 9 → **+2** OVR · ≥ 7.5 → **+1** · < 5 → **−1** · acotado a **[40, 99]**
- `XP = 80 + goles·15 + asistencias·10 + (MVP ? 50 : 0) + round(cal·5)`
- `LP = 4 + (MVP ? 3 : 0) + (cal ≥ 8 ? 2 : 0)`

---

## 6. Sistema de rangos

Sin cambios — `lib/domain/rank.ts::RANKS`. 8 rangos por XP acumulada, marcos en `public/assets/ranks/`.

| # | Rango | Emoji | XP mínima |
|---|-------|-------|-----------|
| 1 | CANTERANO | 🥉 | 0 |
| 2 | DEBUTANTE | 🥈 | 1.000 |
| 3 | REVELACIÓN | ❄️ | 3.000 |
| 4 | ELITE | ⭐ | 7.000 |
| 5 | CONSAGRADO | 🔥 | 15.000 |
| 6 | ÍDOLO | 👑 | 30.000 |
| 7 | LEYENDA | 🏛 | 60.000 |
| 8 | GOAT | 🐐 | 120.000 |

---

## 7. Level Coins (billetera)

Sin cambios de contrato — `lib/domain/wallet.ts`. Saldo en pesos internamente, mostrado en coins (1 coin ≈ $1.300). Se ganan jugando o se compran vía Wompi (`/saldo`); se usan en torneos, premios y transferencias entre jugadores. El saldo solo se mueve por `apply_wallet_transaction` (service_role).

> **Nota conocida (no introducida por la migración):** el pago de apuestas entre equipos y el abono de coins por ganar un partido de Rey del Barrio (`award_coins`) dependían de una función que ya estaba muerta en el sitio original (sin botón real que la invocara). Se decidió **mantener ese comportamiento tal cual** en la migración — los coins apostados quedan bloqueados, no se pagan automáticamente. Ver también la nota sobre `profiles`/`open_matches` sin permiso de `DELETE` para el rol anónimo en la sección 15.

---

## 8. Autenticación y seguridad

Sin cambios de flujo — `context/AuthContext.tsx` + `lib/domain/auth.ts`. Registro con filtro de groserías propio, hash SHA-256 (con fallback JS puro), login vía RPC `verify_login`, recuperación por correo + código de 6 dígitos. Columnas protegidas (`password_hash`, `email`, `is_admin`, `saldo`, `founder`) nunca se escriben desde el frontend — la protección real sigue siendo RPCs `security definer`, triggers y RLS del lado servidor.

---

## 9. Panel de administración

Un admin (`profile.isAdmin`, asignable solo vía RPC `admin_set_is_admin`) tiene, en la app migrada:

- **"⚙ ADMIN"** (pill en el header) — panel modal con Jugadores (buscar/editar), Partidos Rey del Barrio, Partidos Modo Libre y Torneos, todo en una sola vista. En el sitio original este botón redirigía en silencio al dashboard (el modal nunca se había terminado de construir); en la migración se completó como un panel real y funcional.
- **"ESTADÍSTICAS"** (pill en el header) → `/admin/estadisticas` — Centro de Estadísticas: carga/corrección de partidos de ambos modos (con motor de reversión precisa de OVR/XP/LP al corregir), editor de jugador, y creación de cruces de torneo (restaurada aquí — en el original vivía dentro de un panel que nunca llegó a existir en el HTML real).
- **Consola en vivo** `/admin/partido?m=<id>` — marcador, timer, tabla de estadísticas en vivo por jugador (con set de columnas distinto para arquero vs. jugador de campo), cálculo automático de calificación, finalizar (recalcula OVR/XP/LP/logros) o corregir (sin recalcular, solo el detalle). Página completamente aislada del resto del sitio, igual que `admin-partido.html` original.
- **Editor de jugador** (compartido entre los tres puntos de entrada arriba): fotos (carta y ficha) al bucket `player-photos`, físico, y conceder/quitar el rol admin vía RPC.

---

## 10. Mapa del sitio (rutas)

### Públicas / landing
| Ruta | Función |
|------|---------|
| `/` | Landing principal. Redirige a `/dashboard` si ya hay sesión. |
| `/privacidad` | Política de Tratamiento de Datos Personales y de Imagen. |

### Con sesión (grupo de rutas `(app)`)
| Ruta | Función |
|------|---------|
| `/dashboard` | Centro de mando. |
| `/buscar-partido` | Partidos (Modo Libre): asistente de 6 pasos, unirse, chat de partido, compartir, mapa. |
| `/equipos` | Equipos / Rey del Barrio (tabs vía `?tab=crear\|rey\|programados`). |
| `/torneos` | Torneos: inscripción de equipos, pago con saldo o Wompi. |
| `/premios` | Premios: canje de recompensas con coins. |
| `/carta` | Mi Carta. |
| `/jugadores` | Comunidad / buscador de jugadores. |
| `/ranking` | Ranking general por OVR/XP. |
| `/saldo` | Mis Level Coins: balance, recarga, historial, transferencias. |
| `/notificaciones` | Notificaciones (feed + invitaciones/retos/solicitudes). |
| `/configuracion` | Edición de perfil. |
| `/temporada-piloto` | Página informativa de la Temporada Beta. |
| `/admin/estadisticas` | Centro de Estadísticas (solo admin). |

### Consola aislada (grupo de rutas `(admin-console)`, sin chrome del sitio)
| Ruta | Función |
|------|---------|
| `/admin/partido?m=<id>` | Marcador y registro en vivo de un partido de equipo (solo admin). |

### Maquetas / diagnóstico (grupo de rutas `(previews)`, sin auth, `robots: noindex`)
| Ruta | Función |
|------|---------|
| `/index-preview` | Maqueta de rediseño de la landing (hero 2 columnas + banners de rango). |
| `/index-v4` | Maqueta alternativa de landing ("Mockup 2", foto de jugador). |
| `/premios-preview` | Maqueta de la vitrina de premios. |
| `/torneo-preview` | Maqueta del Torneo de Apertura, con sorteo y bracket simulados en el cliente. |
| `/wallet-preview` | Maqueta de la billetera unificada. |
| `/estado` | Diagnóstico de conectividad con Supabase (leer, RPC, escribir) para soporte. |

---

## 11. Módulos funcionales

Sin cambios de alcance — ver `lib/domain/rank.ts::FUNCTIONAL_MODULES`: Mi Ficha, Partidos, Rey del Barrio, Torneos, Premios, Ranking. Cada uno con su propio conjunto de componentes bajo `components/<módulo>/`.

**Próximamente** (`WIP_MODULES`): Fantasy, Marketplace, IA Scouting, entre otros, mostrados con modal "trabajo en progreso" (`WipModal`).

---

## 12. Assets

Sin cambios de contenido — ahora sirven desde `public/assets/` (antes `assets/` en la raíz; la copia original quedó archivada en `legacy/assets/`).

### Hojas de estilo
| Archivo | Rol |
|---------|-----|
| `app/globals.css` | Puerto 1:1 de `style.css`. Mismas variables de marca en `:root`. |
| `app/(previews)/index-preview/redesign.css` | Capa de rediseño de la landing (solo para esa ruta preview). |
| `app/(previews)/index-v4/landing-v4.css` | Estilos de la landing alternativa v4 (solo para esa ruta preview). |
| `app/(admin-console)/admin/partido/admin-partido.css` | CSS aislado de la consola en vivo, bajo `.ap-console` (no toca `globals.css`). |

---

## 13. Historial de lo construido

El repositorio original tuvo 50 commits (7–31 de julio de 2026) construyendo la versión vanilla JS descrita en las secciones anteriores. El bloque más reciente fue la **migración completa a Next.js** (agosto–septiembre de 2026), ejecutada por fases sobre la rama `merge-branch`, preservando el 100% de la funcionalidad y el contrato de Supabase:

1. **Fase 0** — Scaffold (Next 16, TypeScript, App Router, export estático), fuentes, `storage-shim.js`, cliente Supabase tipado, auth (login/registro/reset), `AuthGuard`, dashboard.
2. **Fase 1** — Carta, ranking, jugadores, notificaciones, configuración, temporada piloto.
3. **Fase 2** — Buscar Partido (wizard, listados, invitaciones sincronizadas por Supabase, chat de partido).
4. **Fase 3** — Equipos / Rey del Barrio (perfil de equipo, retos con apuestas, invitaciones, partidos de equipo).
5. **Fase 4** — Torneos, Saldo/Wallet (Wompi), Premios, widget de feedback global.
6. **Fase 5** — Panel de administración completo: editor de jugador, consola Modo Libre, consola en vivo aislada (`/admin/partido`), Centro de Estadísticas (`/admin/estadisticas`) con motor de reversión precisa y creación de cruces de torneo restaurada.
7. **Fase 6** — Vistas preview aisladas (mockups de diseño + diagnóstico de conectividad), todas sin indexar.
8. **Fase 7** — Cutover: archivo de las páginas HTML/CSS/JS originales a `legacy/`, `wrangler.toml` apuntando a la exportación estática de Next, actualización de esta documentación.

Durante la migración se encontraron y corrigieron varios bugs reales de renderizado propios de la nueva implementación (no del original): modales anidados dentro de contenedores con `backdrop-filter`/`transform` que rompían su `position:fixed` (corregidos moviéndolos fuera de esos contenedores o a un portal de React), y una clase CSS `.open` que faltaba en el panel de estadísticas. Todos verificados end-to-end contra el proyecto Supabase real, incluyendo con una cuenta admin real.

---

## 14. Estructura del repositorio

```
LEVEL-UP/
├── app/                          # Next.js App Router
│   ├── layout.tsx                 # Root layout: fuentes, storage-shim.js
│   ├── globals.css                 # Puerto 1:1 de style.css
│   ├── (public)/                   # Landing + privacidad, sin auth
│   ├── (app)/                      # Todo lo autenticado (AuthGuard + providers + chrome)
│   │   ├── dashboard/ carta/ ranking/ jugadores/ notificaciones/
│   │   ├── configuracion/ temporada-piloto/ buscar-partido/
│   │   ├── equipos/ torneos/ saldo/ premios/
│   │   └── admin/estadisticas/
│   ├── (admin-console)/            # Solo /admin/partido, sin chrome compartido
│   └── (previews)/                 # Mockups + /estado, sin auth, noindex
├── components/                    # Un subdirectorio por módulo/feature
├── context/                       # Un provider de React por entidad
├── lib/
│   ├── domain/                     # Mapeo fila↔objeto + lógica pura, por entidad
│   ├── supabase/client.ts          # getSupabase()
│   ├── storage.ts / localStore.ts  # window.LS tipado + store reactivo
├── hooks/                         # useHasMounted, useClickOutside, etc.
├── types/                         # Tipos derivados de rowToX
├── public/
│   ├── assets/                     # Imágenes, audio, marcos de rango
│   └── storage-shim.js
├── legacy/                        # Sitio HTML/JS/CSS original, archivado (no servido)
│   ├── *.html, app.js, redesign.css, landing-v4.css, assets/
├── SQL_WALLET_SETUP.sql
├── SQL_TEAMS_SETUP.sql
├── SQL_ADMIN_STATS_SETUP.sql
├── wrangler.toml                  # Cloudflare Workers, directory = "./out"
└── supabase/
    └── functions/
        ├── wallet-init-recharge/index.ts
        └── wallet-webhook/index.ts
```

---

## 15. Notas de seguridad

- Las llaves *publishable* de Supabase y la *public key* de Wompi son públicas por diseño (ahora en `.env.local`, no hardcodeadas en HTML).
- La seguridad real recae en el servidor: RPCs `security definer`, triggers de columnas protegidas (`protect_saldo`), y RLS. El frontend **nunca** escribe credenciales, `saldo`, `is_admin` ni `founder` directamente.
- Los secretos de Wompi y la `SERVICE_ROLE_KEY` viven solo en las Edge Functions, nunca en el navegador.
- **Hueco conocido, preexistente (no introducido por la migración):** la tabla `profiles` no tiene una política RLS que permita `DELETE` con la llave anónima — un borrado directo no da error, pero tampoco borra nada (0 filas afectadas). El propio diagnóstico de `/estado` y cualquier perfil de prueba quedan huérfanos por este motivo; hay que borrarlos manualmente por SQL con una llave con más privilegios.
- **Otro caso similar:** `open_matches` sí permite `DELETE` directo, pero el original nunca lo usa así — pasa siempre por la RPC `delete_my_match` (que valida que el solicitante sea el creador). Un `DELETE` directo con la llave anónima en esa tabla también afecta 0 filas sin dar error; hay que usar la RPC.

---

*Documento actualizado para reflejar la migración completa a Next.js sobre la rama `merge-branch`.*
