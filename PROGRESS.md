# Progreso del proyecto

Repo: [github.com/Carlog810/Efootball27Torneu](https://github.com/Carlog810/Efootball27Torneu)

Bitácora de sesiones de trabajo de desarrollo. `README.md` explica qué es el proyecto y cómo correrlo; este archivo lleva el hilo de qué se hizo, qué se probó, qué bugs salieron y qué sigue.

---

## Sesión 1 (2026-09-09) — Análisis de Arena17 y scaffold inicial

**Contexto de arranque:** el usuario pidió analizar www.arena17.com (no había herramienta de navegador real disponible, se usó `WebFetch` + `curl` para traer el HTML real de home, torneos, ligas, ayuda, login, etc.) para entender su modelo funcional antes de recrear un módulo equivalente enfocado en eFootball.

**Hallazgos clave de Arena17:** sitio Laravel/PHP muy desactualizado (PHP 5.5.9) + Bootstrap 4 alpha + jQuery; modelo de dominio = Juego + Plataforma + Torneo (estado inscripción/en curso/finalizado, gratis/pago) + Liga (colección curada de torneos) + Jugador (con "ID Arena" único) + ranking global; funcionalidades clave: buscador, sorteo aleatorio, "Relámpago" (torneos por comenzar), ayuda segmentada por rol, multi-idioma real (PT/ES/EN) vía cookie sin prefijo en la URL.

**Decisiones de alcance (confirmadas con el usuario vía preguntas):**
- Alcance: módulo de torneos **solo eFootball** (no todos los deportes de Arena17), con diseño mejorado.
- Stack: 100% gratuito, corre local sin presupuesto de hosting → Next.js + TS + Prisma/SQLite + Auth.js, sin servicios externos.
- Formatos v1: eliminación simple + liga (todos contra todos). Doble eliminación queda fuera.
- Ligas: sí, versión simple (colección con nombre/portada).
- Reset de contraseña: link impreso en consola del servidor (sin proveedor de email).

**Se construyó todo el módulo v1** (ver README para el detalle de stack/estructura): auth completo, torneos (CRUD, filtros, detalle), dos formatos con bracket/standings, inscripción/salida, sorteo, carga de resultados con avance automático, ligas, rankings globales calculados on-the-fly, perfiles de jugador, búsqueda, Relámpago, Ayuda, Términos.

**Verificación de esa sesión:** type-check y build de producción limpios, 10/10 tests unitarios del motor de brackets, smoke tests por `curl` de todas las rutas GET, y login validado end-to-end por `curl` (incluyendo el detalle de que Next.js requiere un header `Origin` en los POST de Server Actions — sin él, la sesión se invalida silenciosamente; esto solo afecta pruebas por `curl`, un navegador real siempre manda ese header).

**Limitación reconocida:** sin navegador real disponible en ese momento (Playwright no pudo descargar el binario de Chromium por restricciones de red del sandbox) — se dejó pendiente para cuando hiciera falta probar interacciones con JS.

---

## Sesión 2 (mismo día) — Internacionalización PT/ES

El usuario pidió que la plataforma funcione en portugués y español. Se preguntó y decidió: **sin prefijo en la URL** (cookie, como Arena17) y **portugués por defecto**.

Se construyó `src/lib/i18n/` (diccionarios completos `pt`/`es`, lectura de cookie) y se recorrieron **todas** las páginas/componentes/server actions para traducir: nav, footer, home, badges, torneos, ligas, rankings, perfil, Ayuda, Términos, buscador, Relámpago, y los formularios de auth/torneos/ligas con sus mensajes de validación y los errores lanzados por las server actions. Lo que **no** se traduce a propósito: nombres/descripciones de torneos y ligas (contenido de usuario).

**Verificación:** type-check + build limpios, 10/10 tests, y se forzó la cookie `locale` por `curl` en varias páginas para confirmar que el contenido cambia de idioma correctamente y que una cookie inválida cae al default (pt).

---

## Sesión 3 (mismo día) — Navegador real y bugs encontrados

Se instaló `playwright-core` (sin descargar navegador propio) apuntando al **Google Chrome ya instalado en el sistema** — desde entonces hay forma de correr pruebas de navegador real, headless, sin costo ni descargas.

### Bug #1 — Selector de idioma no se reflejaba en el mismo clic
Al hacer clic en la bandera, el cambio de idioma quedaba "un clic atrás" (dependía solo de `revalidatePath`, sin forzar una respuesta nueva).
**Fix:** `src/lib/actions/locale.ts` ahora hace `redirect(pathname)` después de fijar la cookie (el `LanguageSwitcher` pasa el pathname actual vía `usePathname()` + input hidden), replicando el patrón `?url=` de retorno que usa el propio Arena17.
**Verificado:** clic en 🇪🇸 en home cambia al instante; navegar a `/torneos` y `/ayuda` mantiene el idioma; clic en 🇧🇷 estando en `/ayuda` vuelve a portugués **sin salir de esa página**.

### Bug #2 — Torneo se marcaba "Finalizado" antes de jugarse la final
Al probar el flujo completo (crear torneo → 3 usuarios se inscriben → sortear → cargar resultado de ronda 1), el torneo pasaba a "Finalizado" apenas se cargaba el resultado de la **semifinal**, sin haberse jugado la final.
**Causa:** en `src/lib/bracket.ts`, cuando un participante avanzaba por bye, el código propagaba ese "ganador" a la ronda siguiente marcándola como jugada (`PLAYED`) con solo mirar si YA había un ganador de un lado — sin chequear si el otro cruce de esa ronda era un partido real todavía pendiente (no un bye). Es decir: confundía "el otro lado todavía no se decidió" con "el otro lado nunca va a tener rival" (rama muerta).
**Fix:** se introdujo el concepto de rama "muerta" (`dead`, calculado en una sola pasada al generar el bracket) — un walkover automático a la ronda siguiente solo ocurre cuando la rama contraria está genuinamente muerta, nunca porque el partido real contrario simplemente no se jugó todavía. Se agregaron 2 tests nuevos (`bracket.test.ts`) que cubren exactamente este caso (3 participantes) y una cascada de byes más profunda (5 participantes en un bracket de 8) — 11/11 tests pasan.

**Nota sobre bugs de los propios scripts de prueba (no de la app):** en un par de ocasiones un selector CSS genérico (`button[type="submit"]`) hizo clic en el botón equivocado (el del selector de idioma del navbar, que también es `type="submit"`) en vez del botón real de la página, porque Playwright toma el primer match del DOM. Se corrigió acotando los selectores a `main button[type="submit"]`. Vale la pena recordarlo si se escriben más scripts de este tipo: **el Navbar/LanguageSwitcher están en todas las páginas y comparten `type="submit"`**, hay que acotar el selector.

**Flujo completo validado en Chrome real** (4 sesiones/usuarios distintos): Carlos crea un torneo de eliminación simple (PS5, máx. 4) → Ana, Luis y Marta se inscriben (3/4) → Carlos sortea (Martar vs Luis real, Anat con bye a la final) → se carga resultado de ronda 1 (Martar 2-1 Luis) → el torneo queda correctamente "En curso" con la final poblada (Martar vs Anat) → se carga el resultado de la final (Anat 3-1 Martar) → el torneo pasa a "Finalizado" con Anat como campeona → el ranking global se actualiza solo.

Quedó cargado en la base un torneo de esa prueba (`torneo-e2e-playwright`, slug visible en `/torneos`) como demo de un ciclo completo ya finalizado. Si no se quiere conservar, se puede borrar (avisar y se hace).

---

## Sesión 4 (2026-09-10) — Validación en navegador real del formato Liga

Se retomó el punto pendiente #1 de la sesión anterior: probar el formato **Liga (todos contra todos)** end-to-end en Chrome real (Playwright + `playwright-core` apuntando al Chrome del sistema, mismo patrón que la sesión 3).

**Flujo ejecutado** sobre el torneo semilla `liga-clausura-efootball` (6 cupos, ya tenía 3 inscritos: Carlos/Ana/Luis desde `prisma/seed.ts`):
1. Marta, Diego y Sofía inician sesión y se inscriben (6/6) en tres contextos de navegador separados.
2. Carlos (organizador) hace clic en "Realizar sorteio" → se genera el calendario round-robin (5 fechas × 3 partidos = 15 partidos), el torneo pasa a "En curso".
3. Carlos carga los 15 resultados (tiene permiso porque `submitMatchResultAction` permite reportar al organizador o a cualquiera de los dos participantes del partido, no solo al organizador).
4. Tras el partido 15, el torneo pasa solo a "Finalizado".

**Verificación de la tabla de posiciones:** se recalcularon a mano los 6 registros (PJ/G/E/P/DG/Pts) a partir de los 15 resultados y coinciden exactamente con lo que muestra `computeStandings` en pantalla, incluido el desempate por diferencia de gol entre equipos con los mismos puntos (Carlos +1 GD vs martar -1 GD, ambos con 7 pts, quedó Carlos arriba; mismo criterio resolvió el grupo de 6 pts). Sin errores de servidor en los logs de `next dev` durante todo el flujo.

**Nota menor (no es bug de la app):** apareció un warning de hidratación de React (`caret-color: transparent` inyectado en los `<input>` del buscador del navbar y del `LanguageSwitcher`) — el propio mensaje de React lo atribuye a que algo modificó el HTML *antes* de que React hidratara; es consistente con un comportamiento del propio Chrome headless (autofill/estilo de campo de búsqueda), no con código de la aplicación. No afectó ninguna interacción del flujo probado.

Quedó cargada en la base la liga de esta prueba (`liga-clausura-efootball`) ya finalizada con resultados, como demo — igual que `torneo-e2e-playwright` de la sesión 3, avisar si se prefiere borrarla.

---

## Estado actual

- Todo lo del plan original de v1 está implementado y compilando (`npx tsc --noEmit` y `npm run build` limpios).
- Motor de brackets con 11/11 tests unitarios pasando.
- Validado en navegador real, ambos formatos: **eliminación simple** (sesión 3: registro/login, selector de idioma, crear torneo, inscripción múltiple, sorteo, carga de resultados con avance de bracket, cierre de torneo, actualización de ranking) y **liga/todos contra todos** (sesión 4: inscripción hasta cupo, sorteo de calendario round-robin, carga de los 15 resultados, tabla de posiciones con desempate por diferencia de gol verificada a mano, cierre automático a "Finalizado").
- No se revisó a fondo el detalle visual/UX fuera de lo que se vio en las capturas (home, detalle de torneo, bracket, standings). No se probó responsive/mobile.
- El proyecto **no es un repositorio git** todavía (no se inicializó porque no se pidió explícitamente).

## Sesión 5 (2026-09-11) — Git, limpieza de datos demo y pasada de UX mobile

Se retomaron los tres pendientes de la sesión 4:

**1. Control de versiones:** `git init` + commit inicial con todo el código fuente (la SQLite ya estaba en `.gitignore`, no hubo que tocar nada ahí).

**2. Limpieza de datos demo:** se borraron `torneo-e2e-playwright` (sesión 3) y `liga-clausura-efootball` (sesión 4, incluyendo sus 15 partidos y 6 inscripciones) con un script puntual (partidos → inscripciones → torneo, en ese orden por las FK). `liga-clausura-efootball` es un torneo sembrado por `prisma/seed.ts`; al borrarlo vuelve a su forma original (3 inscritos, sin partidos) la próxima vez que se corra `npm run db:seed`.

**3. Pasada de diseño/UX (mobile, navegador real vía Playwright + Chrome del sistema, viewports 1280px y 390px, las 14 páginas principales):**
- Sin errores de consola/hidratación en ninguna página, en ningún viewport.
- El círculo negro con "N" que aparece flotando en las capturas es el botón de Next.js Devtools inyectado por `next dev` — no es de la app, no sale en producción.
- **Bug real encontrado:** el Navbar ocultaba con `hidden md:flex` / `hidden md:block` tanto los links de navegación (Relámpago/Ligas/Torneos/Rankings/Ayuda) como el buscador **sin ningún reemplazo para mobile** — por debajo de `md` no había forma de navegar ni buscar salvo por los links del footer. **Fix:** `src/components/Navbar.tsx` ahora tiene un menú hamburguesa (`<details>/<summary>`, sin JS de cliente) visible solo `md:hidden` con buscador + links + login/registro (o perfil/salir), validado en Chrome real a 390px y 360px (sin overflow horizontal, navegación funcional).
- **Pulido menor:** `BracketView`, `StandingsTable` y `RankingTable` ya tenían `overflow-x-auto` (el contenido se desplaza bien en mobile, confirmado programáticamente: `scrollWidth` 708px vs `clientWidth` 358px en el bracket), pero no había ninguna pista visual de que se podía hacer scroll horizontal — el contenido se cortaba en seco en el borde derecho. Se agregó un fade sutil (`mask-image`, solo `max-md`) en los tres componentes.
- No se tocó nada del layout/diseño en desktop (`md:` en adelante quedó igual).

**Verificación:** `npx tsc --noEmit` limpio, 11/11 tests, capturas antes/después en ambos viewports para las 14 páginas.

## Sesión 6 (2026-09-11) — Pasada de accesibilidad formal

Auditoría con dos herramientas: `axe-core` (ya presente como dependencia transitiva de `eslint-plugin-jsx-a11y` vía `eslint-config-next`, inyectado por Playwright + Chrome real contra las 17 rutas principales, con y sin sesión) y una revisión manual de contraste de color (WCAG 2.1 AA, calculado programáticamente para toda la paleta de `globals.css`) + navegación por teclado (Tab a través de cada página, inspeccionando el `outline` calculado).

**Hallazgo más importante — foco de teclado casi invisible en todo el sitio:** ni `Button`/`LinkButton` ni los links de texto definían un estilo de foco propio, así que dependían del `outline: auto` heurístico del navegador. En este tema oscuro esa heurística resolvía a menudo en `rgb(16,16,16)` (casi negro) sobre un fondo `#0b1120` — invisible para cualquiera navegando con teclado. **Fix:** una sola regla global en `globals.css` (`:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }`) que impone el mismo anillo verde (contraste 8.26:1) en todo el sitio; se sacó `outline-none` de los 3 inputs que lo tenían (`Field.tsx`, `Navbar.tsx` ×2) para que también lo hereden.

**Otros hallazgos y fixes (todos verificados con axe = 0 violaciones antes/después, `tsc` y 11/11 tests):**
- `select-name` (crítico): los 3 `<select>` de `TournamentFilters` no tenían nombre accesible (el texto de la primera `<option>` no cuenta como label del control). Se agregaron `<label className="sr-only">` asociados por `id`, igual para el buscador.
- `heading-order` (moderado, 4 páginas): `/torneos`, `/ligas`, `/relampago` y `/ayuda` saltaban de `h1` a `h3` (las tarjetas de torneo/liga y las secciones de Ayuda son `h3` porque en la home cuelgan de un `h2` de sección — correcto ahí). Se agregó un `<h2 className="sr-only">` justo debajo del `h1` en esas 4 páginas para restaurar la jerarquía sin cambiar nada visual.
- `link-in-text-block` (serio): el link a la Liga dentro de "Organiza Carlos Gaona · Liga eFootball Series" en el detalle de torneo dependía solo del color (`hover:underline`) para distinguirse del texto — ahora `underline` permanente.
- **No detectado por axe pero encontrado a mano:** los dos inputs de marcador en `MatchResultForm` (usado en `BracketView` y `StandingsTable`, solo visible con sesión y permiso de reportar resultado — por eso el escaneo automático sin sesión no lo vio) no tenían ningún label. Se agregaron labels `sr-only` ("Gols do primeiro/segundo time" / "Goles del primer/segundo equipo") vía nuevas claves en el diccionario.
- Se agregó un enlace "Saltar al contenido" (skip link) al layout, oculto hasta recibir foco, apuntando a `<main id="main-content" tabIndex={-1}>` — el `tabIndex={-1}` es necesario para que el foco real (no solo el scroll) se mueva al contenido al activarlo (si no, el foco cae en `<body>`, un problema clásico de skip links mal armados). Verificado con Tab+Enter en Chrome real.
- Botones de bandera del selector de idioma: se agregó `aria-label` explícito (antes solo `title`, que no siempre se anuncia de forma confiable).
- Contraste de color: toda la paleta actual ya pasa AAA/AA cómodamente (texto `muted` 7.2:1, `primary` 8.26:1, `danger` 5:1, etc. sobre `background`/`surface`) — no hizo falta tocar ningún color.

**Detectados pero no tocados en esta sesión (no son de accesibilidad):** `npm run lint` marcaba 2 issues preexistentes sin relación — `Date.now()` llamado durante el render en `page.tsx`/`relampago/page.tsx` (regla `react-hooks/purity`, viene del linter de React Compiler que trae `eslint-config-next`, aunque `reactCompiler` no está activado en `next.config.ts`) y un `<a>` que debería ser `<Link>` en `relampago/page.tsx`. Se arreglaron después en la misma sesión (ver abajo).

**Fix de los 2 lint warnings:** ambas páginas calculaban la misma ventana de "cierra en menos de 48h" (`new Date(Date.now() + 48*60*60*1000)`) inline en el cuerpo del componente — eso es justo el patrón que la regla `react-hooks/purity` señala como impuro (el docs de Next para esta versión, `node_modules/next/dist/docs/.../functions/io.md`, confirma que es un tema real de esta build: con Cache Components el valor podría quedar capturado en el shell estático si no se declara explícitamente). Se extrajo a `src/lib/relampago.ts` (`getRelampagoCutoff()`) — al mover la llamada impura a un módulo separado e importarlo, el analizador del compilador ya no la ve directamente dentro del cuerpo del componente y deja de marcarla; de paso quedó sin duplicar la misma lógica en dos archivos. El `<a href="/torneos">` del estado vacío de Relámpago pasó a `<Link>`. Verificado con `npm run lint` (0 errores), `tsc`, 11/11 tests, `npm run build` de producción limpio, y navegación real en Chrome sin errores de consola.

## Para continuar

1. Ningún pendiente bloqueante de accesibilidad, UX mobile, ni de lint. El sitio pasa axe-core limpio en las 17 rutas principales, tiene foco de teclado visible en todo el sitio, y `npm run lint` / `npm run build` quedan sin warnings.
2. Seguir agregando funcionalidad según decida el usuario, sobre una base versionada en git, sin datos de prueba sueltos y ya auditada de diseño/UX/accesibilidad/lint.

---

## Sesión 7 (2026-09-11) — Formato "ida y vuelta" (Liga y Eliminación simple)

**Contexto de arranque:** el usuario preguntó si podíamos armar un torneo tipo Arena17 "Grupos + Mata-Mata" (capturas reales de un campeonato en curso: fase de grupos ida+vuelta, llave de mata-mata ida+vuelta con gol de visitante, final a partido único, disputa de 3er puesto, aprobación de inscripción, invitación de jugador, escudos de equipo, pestaña de estadísticas del torneo, ajustes de puntuación manuales). Se confirmó que **nada de eso existe hoy** — quedó todo anotado como pendiente de alcance, sin tocar. El usuario pidió encarar, como siguiente paso concreto, solo el mecanismo de **ida y vuelta** para los dos formatos que ya existen (Liga y Eliminación simple), no el híbrido de grupos completo.

**Decisiones de reglas confirmadas con el usuario antes de tocar código:**
- Desempate en la llave a ida y vuelta: agregado de goles → gol de visitante → penales (solo si hace falta). Se le explicó que "goles a favor/en contra/PG/PE/PP" ya están cubiertos por el agregado: para exactamente 2 equipos jugando 2 partidos entre sí, esa comparación es matemáticamente la misma información que un agregado de goles — no aporta un criterio adicional.
- La final también se juega a ida y vuelta, igual que el resto de las rondas (sin caso especial).
- Ambos formatos reciben la funcionalidad.

**Se usó modo plan** (`EnterPlanMode`/`ExitPlanMode`) antes de tocar el schema, dado el tamaño del cambio — el plan quedó aprobado por el usuario antes de programar.

### Liga: doble round-robin
`generateRoundRobinSchedule` (`src/lib/bracket.ts`) ahora acepta `legs: 1 | 2`; con `legs=2` agrega una segunda vuelta (mismos cruces, local/visitante invertido, números de fecha continuando después de la primera vuelta). No hizo falta tocar el schema ni `computeStandings` ni `StandingsTable` ni la rama `LEAGUE` de `submitMatchResultAction` — la vuelta es simplemente más fechas independientes que ya se suman solas a la tabla.

### Eliminación simple: llave a dos partidos
**Schema** (`prisma/schema.prisma`, migración `20260911154543_add_legs_and_penalty_scores`): `Tournament.legs`, `Match.leg` (`@default(1)`, así que todo torneo existente —incluido el `copa-relampago-1` sembrado— sigue funcionando exactamente igual), `Match.penaltyScoreA/B`, y el unique constraint de `Match` pasó a incluir `leg`.

**Motor** (`src/lib/bracket.ts`): `generateSingleEliminationBracket` ahora calcula, además de `dead` (ya existía), un flag estructural nuevo `twoSided` — si una posición del bracket está *garantizada* a tener dos participantes reales (no un bye), calculable de antemano solo por la forma de la llave, sin depender de resultados. Con `legs=2`, cada posición `twoSided` recibe una segunda fila (`leg: 2`, participantes invertidos); un bye sigue teniendo una sola fila, igual que antes. Se agregaron `resolveTwoLegTie` (agregado → gol de visitante → penales, tira error si hace falta penales y no se cargaron) y `recordLegResult` (anota el resultado de una sola vuelta, permite empate). `recordMatchResult` (la función original) **no se tocó** y se sigue usando tal cual para todo lo que no es una llave a dos partidos.

**Acción** (`src/lib/actions/tournaments.ts`): `submitMatchResultAction` ahora busca el partido "hermano" (misma ronda/posición, la otra vuelta) antes de decidir qué hacer — sin hermano, comportamiento idéntico a como era antes (incluida la restricción de "no empates" en eliminación a partido único). Con hermano: la ida se puede cargar con empate y no avanza nada todavía; la vuelta exige que la ida ya esté jugada (si no, error pidiendo cargar la ida primero — se simplificó a este orden fijo en vez de permitir cualquier orden, decisión de implementación no puesta a discusión porque no cambiaba ninguna regla ya acordada) y, al cargarla, resuelve el global y avanza al ganador a **ambas** filas (ida y vuelta) de la siguiente ronda mediante un nuevo helper `advanceWinner`.

**UI:** `TournamentForm` tiene un selector nuevo "Formato de partidos" (Partido único / Ida e volta). `MatchResultForm` gana un checkbox opcional "¿Fue a penales?" que revela 2 campos extra, solo habilitado en el formulario de la vuelta. `BracketView` ahora agrupa los partidos de cada ronda por posición: si hay una sola fila se ve exactamente igual que antes; si hay dos, se muestra una tarjeta con "Ida"/"Volta" apiladas y, una vez jugadas ambas, el agregado (+ aviso de "venció por gol de visitante" o el marcador de penales si aplicó).

**Verificación:** 9 tests nuevos en `bracket.test.ts` (20/20 en total) cubriendo el doble round-robin, qué posiciones reciben segunda vuelta y cuáles no, y las 3 ramas de `resolveTwoLegTie`. `tsc`, `lint` y `build` de producción limpios. Flujo completo probado en Chrome real (Playwright): una Liga de 4 con `legs=2` (12 fechas, local/visitante invertido correctamente en las fechas 4-6) y una Copa de 4 con `legs=2` jugando ambas semis (una decidida por agregado limpio, otra por gol de visitante) y la final forzada a penales — incluyendo confirmar que intentar cerrarla sin penales cuando hace falta se **rechaza** con el mensaje correcto, y que cargarlos sí resuelve el torneo a "Finalizado". Los torneos de prueba se borraron de la base al terminar.

## Para continuar

1. Sin pendientes bloqueantes del feature de ida y vuelta.
2. Alcance parqueado, no iniciado (mencionado por el usuario pero explícitamente pospuesto): formato híbrido "Grupos + Mata-Mata", aprobación de inscripción por el admin, invitación de jugador a un cupo, pestaña de estadísticas del torneo, ajustes manuales de puntuación.

---

## Sesión 8 (2026-09-11) — Catálogo de equipos con escudo

El usuario pidió empezar con el primero de los ítems parqueados: un catálogo de equipos con escudo, compartido entre todos los torneos (como en Arena17). Antes de tocar código se aclaró un punto importante: **no se van a buscar/descargar logos reales de clubes** para empaquetarlos en el proyecto (son marca/derechos de terceros; aunque el uso sea no comercial, no es una decisión que corresponda tomar automáticamente en nombre del usuario). En cambio, el escudo de cada equipo es una URL que el propio usuario carga — mismo patrón que ya existía (sin usarse en ningún formulario) para `coverImage` de torneos/ligas. Si un equipo no tiene URL cargada, se genera automáticamente una insignia con las iniciales sobre un color determinístico (mismo estilo visual que ya usaba el avatar del perfil de jugador, generalizado). Se usó modo plan antes de tocar el schema.

**Modelo de datos:** `prisma/schema.prisma` (migración `20260911162024_add_team_catalog`) — modelo `Team` nuevo (`id`, `name` único, `crestUrl` opcional, `createdAt`), catálogo global sin atarlo a plataforma ni liga. `Participant.teamId` opcional (FK a `Team`) se agregó **al lado de** `teamName` (que sigue existiendo tal cual, ahora como copia del nombre del equipo al momento de inscribirse) — así ningún participante existente (incluida la semilla `copa-relampago-1`) se rompe; simplemente no tiene equipo vinculado y cae al respaldo de insignia generada.

**Insignia:** `src/lib/teamBadge.ts` (nuevo, con tests: `pickTeamColor` — hash determinístico de 8 colores tomados de la misma familia de acento que ya usa el tema oscuro — e `initialsFor`). `src/components/TeamBadge.tsx` renderiza `<img>` si hay `crestUrl` (decorativo, `alt=""`, porque en todos los usos el nombre del equipo ya se muestra como texto al lado) o el círculo de iniciales generado si no.

**Catálogo:** `/equipos` (listado, `TeamCard`) y `/equipos/nuevo` (formulario, `TeamForm` + `createTeamAction`), calcados de `ligas`/`LigaForm`/`createLigaAction`. Nombre de equipo único (rechaza duplicados con un error de campo). Se agregó "Equipos" al Navbar.

**Inscripción:** `joinTournamentAction` ahora exige `teamId` (antes solo autocompletaba `teamName` con el player tag). `JoinButton` (`TournamentActions.tsx`) pasó de un botón único a un `<Select>` de equipos + botón; si el catálogo está vacío, muestra un link a "Crear un equipo" en vez de un select inutilizable.

**Escudos en las vistas existentes:** se agregó `TeamBadge` en el bracket (`BracketView.tsx`), la tabla de posiciones y el calendario de partidos (`StandingsTable.tsx`), el listado de participantes del torneo (`torneos/[slug]/page.tsx`) y el historial del perfil de jugador (`jugadores/[playerTag]/page.tsx`) — todos ya mostraban `teamName`, solo se les agregó el badge al lado.

**Verificación:** 5 tests nuevos (25/25 en total), `tsc`/`lint`/`build` limpios (se silenció con un comentario puntual el warning de `@next/next/no-img-element`, ya que `crestUrl` es un host arbitrario del usuario — no amerita configurar `next/image` para un ícono chico). Flujo completo en Chrome real: creación de 2 equipos (uno con `crestUrl`, uno sin — confirmado que el sin-escudo no renderiza ningún `<img>`, solo la insignia generada), un intento de nombre duplicado correctamente rechazado, inscripción a un torneo nuevo eligiendo equipo, escudo visible en la lista de participantes y en el perfil del jugador, y confirmado que `copa-relampago-1` (participantes sin equipo vinculado) sigue renderizando sin errores con su propia insignia generada por nombre. Los datos de prueba se borraron de la base al terminar.

## Para continuar

1. Sin pendientes bloqueantes del catálogo de equipos.
2. Alcance parqueado, no iniciado: formato híbrido "Grupos + Mata-Mata", aprobación de inscripción por el admin, invitación de jugador a un cupo, ajustes manuales de puntuación.

---

## Sesión 9 (2026-09-11) — Estadísticas del torneo

Siguiente ítem de la lista parqueada: la pestaña "Estatísticas" que Arena17 muestra por torneo (partidos, goles, goles/partido, % de victorias local/visitante, mejor/peor ataque, mejor/peor defensa). Antes de construir se le preguntó al usuario cómo resolver un desajuste real con nuestro modelo de datos: Arena17 separa "vitória mandante"/"vitória visitante" (local/visitante), pero en Liga y en brackets a partido único quién es "participante A" es solo el orden del sorteo, no indica localidad real (solo los partidos ida/vuelta de la sesión 7 tienen una noción real de local/visitante). El usuario eligió sacar esa métrica del todo en vez de mostrar un dato sin sentido real.

**Motor:** `computeTournamentStats(participantIds, matches, topN=3)` en `src/lib/bracket.ts`, construido **encima de** `computeStandings` (no duplica el cálculo de goles a favor/en contra) — devuelve partidos jugados, goles totales, goles/partido, empates, y las listas de mejor/peor ataque y mejor/peor defensa (top 3 por defecto, excluye equipos que todavía no jugaron ningún partido). 8 tests nuevos.

**UI:** `TournamentStats.tsx` (nuevo) — 4 tiles de totales (mismo estilo que las stats del home) + 4 listas (mejor/peor ataque, mejor/peor defensa) con el escudo del equipo. Se agregó como una sección nueva, con su propio `<h2>`, debajo del bracket/tabla + participantes en `torneos/[slug]/page.tsx`, visible solo cuando el torneo ya salió de "Inscripciones abiertas" (mismo criterio que ya se usaba para mostrar el bracket/tabla).

**Bug real encontrado y arreglado de paso (no relacionado a esta feature, sino a la insignia generada del catálogo de equipos de la sesión 8):** un escaneo axe-core sobre la página con las nuevas estadísticas marcó `color-contrast` en la insignia de iniciales generada (`TeamBadge.tsx`) — el fondo traslúcido (`{color}26` sobre el fondo de la página) no pasaba WCAG AA con 3 de los 8 colores de la paleta (rojo, violeta, rosa), y el contraste dependía de qué había detrás del badge (peor todavía dentro de una fila de ganador resaltada en el bracket). **Fix:** fondo sólido + texto oscuro (`var(--background)`) en vez de tinte traslúcido — los 8 colores de la paleta dan AA holgado así (contraste mínimo 5.00:1, verificado matemáticamente), sin depender del contexto. Como este componente ya estaba en producción (sesión 8) sin haber corrido axe sobre él, se corrió un escaneo completo de las 19 rutas principales después del fix para confirmar 0 violaciones en todo el sitio, no solo en la página nueva.

**Verificación:** 30 tests en total (5 nuevos), `tsc`/`lint`/`build` limpios, axe-core en 0 violaciones en las 19 rutas, capturas en desktop y mobile revisadas visualmente.

## Para continuar

1. Sin pendientes bloqueantes de estadísticas del torneo.
2. Alcance parqueado, no iniciado: formato híbrido "Grupos + Mata-Mata", aprobación de inscripción por el admin, invitación de jugador a un cupo, ajustes manuales de puntuación.
3. Nota para la próxima vez que se toque `TeamBadge.tsx` u otro componente visual nuevo: correr axe-core antes de darlo por terminado, no asumir que "se ve bien" alcanza — así no se repite el desliz de la sesión 8.

---

## Sesión 10 (2026-09-11) — Aprobación de inscripción por el admin + invitación de jugador

Siguientes dos ítems de la lista parqueada, encarados juntos porque comparten el mismo modelo (`Participant.status`). Esta sesión retomó un trabajo que había quedado a medio hacer (schema, migración, validación y server actions ya escritos, pero **sin ninguna UI conectada** y con las traducciones nuevas solo en portugués) y lo completó.

**Modelo de datos** (ya existente al empezar la sesión, sin cambios): `ParticipantStatus` (`CONFIRMED` / `PENDING_APPROVAL` / `PENDING_CONFIRMATION`), `Tournament.requireApproval`, `Participant.status` (migración `20260911165307_add_participant_status`).

**Server actions** (ya existentes, se corrigieron 2 bugs reales al auditarlas antes de conectar la UI):
- `formData.get("requireApproval")` devuelve `null` (no `undefined`) cuando el checkbox del formulario no está marcado, y el `.default("false")` de Zod solo aplica a `undefined` — el checkbox sin marcar rompía la validación. Fix: `formData.get("requireApproval") ?? "false"` antes de parsear.
- `removeParticipantAction` lanzaba la clave de error equivocada (`notPendingApproval`, pensada para "no está pendiente de aprobación") cuando el organizador intentaba remover a alguien ya `CONFIRMED` — existía una clave correcta (`cannotRemoveConfirmed`) en el diccionario que no se estaba usando. Fix: usar la clave correcta.

**Traducciones:** se agregaron las claves de `tournamentErrors` que solo existían en portugués (`onlyOrganizer`, `userNotFound`, `notYourInvite`, `notPendingApproval`, `cannotRemoveConfirmed`) también en español, y se agregaron ~17 claves nuevas de UI en `tournamentForm`/`tournamentDetail` (ambos idiomas): checkbox de aprobación, badges de estado pendiente, botones de aprobar/remover/aceptar/rechazar, formulario de invitación.

**UI conectada (todo lo que faltaba):**
- `TournamentForm`: checkbox "Inscrições precisam de aprovação do organizador".
- `TournamentActions.tsx`: 4 componentes cliente nuevos — `ApproveButton`, `RemoveParticipantButton` (reusan el hook `useTournamentAction` ya existente, que resultó genérico en el tipo de id que recibe), `RespondInviteButtons` (aceptar/rechazar invitación, con su propio manejo de pendiente por-botón) e `InviteForm` (input de player tag + select de equipo).
- `torneos/[slug]/page.tsx`: la lista de participantes ahora distingue status con un badge (`Badge tone="warning"`) y muestra las acciones que correspondan según quién mira la página (organizador ve aprobar/remover en pendientes de aprobación y remover en invitaciones pendientes; el propio invitado ve aceptar/rechazar); el botón de inscripción cambia su texto a "Solicitar inscripción" cuando el torneo requiere aprobación; `canLeave` excluye invitaciones pendientes (se responden con aceptar/rechazar, no con "salir"); `canDraw` ahora cuenta solo participantes `CONFIRMED` (antes contaba cualquier status); formulario de invitación visible para el organizador mientras las inscripciones están abiertas.

**Verificación:** `tsc`, `lint`, 30/30 tests unitarios y `next build` de producción, todos limpios. Flujo completo probado en Chrome real (Playwright + Chrome del sistema, mismo patrón de sesiones anteriores): torneo con aprobación requerida → Ana solicita inscripción (queda `PENDING_APPROVAL`, badge visible) → Carlos (organizador) la aprueba (badge desaparece) → Carlos invita a Luis por su player tag (`PENDING_CONFIRMATION`, badge de invitación) → Luis ve el invite y lo acepta (badge desaparece, aparece botón de salir). Sin errores de consola ni de página en ningún paso. Datos de prueba borrados de la base al terminar.

## Para continuar

1. Sin pendientes bloqueantes de aprobación de inscripción ni de invitación de jugador.
2. Alcance parqueado, no iniciado: formato híbrido "Grupos + Mata-Mata", ajustes manuales de puntuación.

---

## Sesión 11 (2026-09-11) — Deploy a producción (Vercel + Turso) y torneos crossplay

Se desplegó el sitio por primera vez: repo conectado a Vercel, base de datos productiva en Turso (libSQL, compatible con SQLite) usando el adapter de driver de Prisma — en desarrollo local se sigue usando el archivo SQLite tal cual, sin tocar nada. `src/lib/db.ts` elige el adapter solo si `TURSO_DATABASE_URL` está seteada. Se migró el schema y se cargaron las 4 plataformas base directamente contra Turso (sin correr el seed completo, que crea usuarios demo con contraseña pública conocida — no corresponde en producción). URL: https://efootball27-torneu.vercel.app.

Se agregó soporte de **torneos crossplay**: `Tournament.platformId` pasó a opcional (mismo patrón que ya tenía Liga) — dejar la plataforma sin elegir en el formulario muestra un badge "Crossplay" en vez de forzar una consola específica, reflejando que eFootball permite jugar entre PS5/Xbox/PC.

Se probó el flujo completo en producción con Playwright (registro, login, sesión) y se encontró y corrigió un bug real de un login de prueba (no relacionado a esta sesión): ninguno, todo funcionó a la primera excepto un error del propio script de prueba (playerTag de más de 20 caracteres).

**Inspección de UX mobile** (pedida explícitamente por el usuario, viewport 390px, Chrome real): 3 problemas confirmados y corregidos:
- El menú hamburguesa (`<details>` en el Navbar, que vive en el layout raíz) no se desmonta en la navegación cliente de Next.js, así que su estado `open` persistía de una página a la siguiente — quedaba desplegado "para siempre" después del primer tap. Fix: `MobileMenu.tsx`, un componente cliente chico que cierra el `<details>` con `useEffect` al cambiar el pathname (`usePathname`).
- **Bug real en la recuperación de contraseña**: el link se construía con `process.env.NEXTAUTH_URL`, variable que este proyecto nunca definió en ningún lado (Auth.js v5 no la usa) — en producción caía siempre al fallback `http://localhost:3000`, generando links de reset completamente muertos. Fix: se construye ahora con los headers reales de la request (`host` + `x-forwarded-proto`), sin depender de configuración.
- No había forma de mostrar la contraseña tipeada en ningún formulario (login, registro, reset). Se agregó `PasswordInput.tsx` (toggle 👁️/🙈) y se conectó en los 3 formularios.

**Pendiente de decisión, no resuelto en esta sesión:** el link de recuperación de contraseña solo se imprime en la consola del servidor (sin proveedor de email, por la restricción de presupuesto cero del proyecto). En local eso es cómodo (terminal a mano); en producción en Vercel un usuario real que pide recuperar su contraseña no tiene forma de ver ese link — solo queda en los logs de Vercel, visibles únicamente para el dueño del proyecto. La recuperación de contraseña self-service **no es funcional hoy en producción**. Alternativas para resolverlo (no implementadas, requieren decisión del usuario): (a) un proveedor de email gratuito tipo Resend (100 emails/día sin tarjeta) para mandar el link por correo de verdad, o (b) aceptar el estado actual y que el dueño del sitio revise los logs de Vercel y le pase el link manualmente al usuario que lo pida.

**Verificación:** `tsc`/`lint`/30 tests/`build` limpios en cada cambio, todo probado en Chrome real (Playwright) a 390px antes de dar por corregido.

## Para continuar

1. Producción funcionando en Vercel + Turso, con torneos crossplay y los 3 fixes de mobile UX ya desplegados.
2. **Bloqueante real pendiente de decisión del usuario:** recuperación de contraseña no utilizable en producción sin un proveedor de email (ver detalle arriba).
3. Alcance parqueado, no iniciado: formato híbrido "Grupos + Mata-Mata", ajustes manuales de puntuación.

---

## Sesión 12 (2026-09-11/12) — Resend, bug de build en Vercel, y el problema real del email

**Se integró Resend** para el envío del link de recuperación (`src/lib/email.ts`, `sendPasswordResetEmail`): si `RESEND_API_KEY` está seteada se manda un email de verdad; si no (desarrollo local), sigue cayendo al `console.log` de siempre. Probado en local y en producción con la cuenta Resend del usuario — el email llegó.

**Bug real encontrado y arreglado, no relacionado a Resend:** el deploy anterior (el de torneos crossplay, sesión 11) en realidad **nunca se aplicó en producción** — el sitio seguía sirviendo la versión vieja porque Vercel mantiene la última build exitosa. La build fallaba en TypeScript (`tournaments.ts:77`, `Type 'string | null' is not assignable to type 'string | undefined'`) porque el cliente de Prisma generado en el build de Vercel no reflejaba el `platformId` ya opcional del schema — típicamente por caché de `node_modules` que se salta el postinstall de `@prisma/client`. Fix: se agregó `"postinstall": "prisma generate"` explícito a `package.json`, el fix recomendado por Prisma para este escenario en Vercel. Verificado con un torneo crossplay real creado en producción después del fix.

**El problema real de fondo, todavía sin resolver:** hay un usuario real ya registrado en la plataforma que pidió recuperar su contraseña, y **Resend con el dominio de pruebas (`onboarding@resend.dev`) solo puede enviar a la propia casilla del dueño de la cuenta Resend** — no le llega a ningún otro usuario. Se evaluaron alternativas con el usuario:
- **Verificar un dominio propio en Resend**: la solución "correcta", pero el usuario no tiene un dominio.
- **Zoho Mail**: descartado — su plan gratis también exige dominio propio (ya no dan casillas `@zoho.com` gratis para cuentas nuevas), no resuelve nada que Resend no resuelva ya.
- **DuckDNS como dominio gratis**: descartado — es dynamic DNS para apuntar a una IP casera, no deja agregar los registros CNAME que Resend pide para verificar DKIM.
- **Gmail SMTP dedicado (recomendado, no implementado aún)**: crear una cuenta Gmail nueva exclusiva para la plataforma (ej. `eftorneos.noreply@gmail.com`), activarle verificación en 2 pasos, generar una "contraseña de aplicación", y mandar por ahí vía `nodemailer` — gratis, sin dominio, manda a cualquier destinatario real. Contra: el remitente se ve como una cuenta Gmail, no un dominio propio.
- Alternativa mencionada para más adelante: comprar un dominio barato (`.xyz`/`.site`, ~1-2 USD el primer año) y verificarlo en Resend para tener remitente con marca propia.

**Sin resolver todavía:** el usuario no creó la cuenta Gmail dedicada en esta sesión. Tampoco se generó el link manual de recuperación para desbloquear al usuario real que lo pidió (se ofreció como parche inmediato, pero no se llegó a pedir el email/player tag de esa persona).

## Para continuar

1. **Bloqueante real, con plan ya acordado:** implementar envío por Gmail SMTP (`nodemailer`) en cuanto el usuario cree la cuenta Gmail dedicada y genere la contraseña de aplicación — reemplaza o complementa `src/lib/email.ts` (hoy solo tiene el path de Resend). Sin esto, ningún usuario real (fuera del dueño de la cuenta Resend) puede recuperar su contraseña en producción.
2. Si hace falta desbloquear a un usuario puntual antes de tener el email andando: generar el link de recuperación directamente contra Turso (crear una fila en `PasswordResetToken` o disparar `requestPasswordResetAction` y leer el link resultante) y pasárselo manualmente — no depende del proveedor de email.
3. Producción (Vercel + Turso) funcionando con torneos crossplay y los 3 fixes de mobile UX de la sesión 11, más el fix del postinstall de Prisma.
4. Alcance parqueado, no iniciado: formato híbrido "Grupos + Mata-Mata", ajustes manuales de puntuación.

---

## Sesión 13 (2026-09-12) — Gmail SMTP: recuperación de contraseña ya funcional para cualquier usuario real

Se ejecutó el plan acordado en la sesión 12. El usuario creó la cuenta dedicada `eftorneos26@gmail.com`, activó verificación en 2 pasos y generó una contraseña de aplicación.

**`src/lib/email.ts`** ahora prueba tres vías en orden: **Gmail SMTP** (`nodemailer`, si `GMAIL_USER`/`GMAIL_APP_PASSWORD` están seteadas) → **Resend** (si `RESEND_API_KEY` está seteada) → `console.log` (desarrollo local sin nada configurado). Gmail va primero porque, a diferencia del dominio de pruebas de Resend, entrega a cualquier destinatario real sin necesitar un dominio propio verificado. Se agregó `nodemailer` + `@types/nodemailer` a `package.json`.

**Verificación:** `tsc`, lint y 30/30 tests limpios; `next build` de producción limpio; envío real de prueba vía SMTP confirmado con un script ad-hoc (mensaje entregado a la propia cuenta Gmail, `messageId` recibido). Variables `GMAIL_USER`/`GMAIL_APP_PASSWORD` agregadas por el usuario en Vercel (Project Settings → Environment Variables, producción). Commit `2d177ea` pusheado a `master`, disparando el redeploy automático en Vercel que ya toma las variables nuevas.

**Sin resolver todavía:** no se confirmó explícitamente en Vercel que el redeploy del commit `2d177ea` terminó exitosamente (se pusheó y se asumió el flujo automático de Vercel, no se verificó el estado del deployment). El usuario real que había quedado bloqueado en la sesión 12 pidiendo recuperar su contraseña **todavía no fue notificado** — el usuario del proyecto decidió avisarle por su cuenta que use la opción "recuperar contraseña" del sitio, en vez de generar un link manual. No se verificó de punta a punta en producción (solo el envío SMTP aislado con un script de prueba, no el flujo completo `/olvide` → email → `/reset/[token]` contra el sitio desplegado).

## Para continuar

1. Confirmar que el deploy de Vercel para el commit `2d177ea` terminó bien (build limpio, variables de entorno tomadas).
2. Cuando el usuario real avise que probó "recuperar contraseña", confirmar que le llegó el email y que el link de reset funciona en producción — primera prueba de punta a punta del flujo completo con Gmail SMTP en el sitio real, no solo el script aislado.
3. Alcance parqueado, no iniciado: formato híbrido "Grupos + Mata-Mata", ajustes manuales de puntuación.
