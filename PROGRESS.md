# Progreso del proyecto

Bitácora de sesiones de trabajo con Claude Code. `README.md` explica qué es el proyecto y cómo correrlo; este archivo lleva el hilo de qué se hizo, qué se probó, qué bugs salieron y qué sigue.

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

**Fuera de alcance, detectado pero no tocado (no es de accesibilidad):** `npm run lint` marca 2 issues preexistentes sin relación — `Date.now()` llamado durante el render en `page.tsx`/`relampago/page.tsx` (regla `react-hooks/purity`) y un `<a>` que debería ser `<Link>` en `relampago/page.tsx`. Quedan para una futura pasada de calidad de código si se quiere.

## Para continuar

1. Ningún pendiente bloqueante de accesibilidad ni de UX mobile. El sitio pasa axe-core limpio en las 17 rutas principales (con y sin sesión) y tiene foco de teclado visible en todo el sitio.
2. Opcional, sin urgencia: los 2 lint warnings mencionados arriba (no son de accesibilidad).
3. Seguir agregando funcionalidad según decida el usuario, sobre una base versionada en git, sin datos de prueba sueltos y ya auditada de diseño/UX/accesibilidad.
