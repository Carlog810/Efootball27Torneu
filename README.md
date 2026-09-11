# EF Torneos

Repo: [github.com/Carlog810/Efootball27Torneu](https://github.com/Carlog810/Efootball27Torneu)

Plataforma comunitaria de gestión de torneos y ligas de **eFootball**, inspirada en [Arena17](https://www.arena17.com) pero acotada a eFootball, con diseño propio y un stack 100% gratuito (no requiere ninguna cuenta ni servicio de pago para desarrollar o correr localmente).

Funciona en **portugués** (idioma por defecto) y **español**, sin prefijo de idioma en la URL — el idioma se guarda en una cookie, igual que en Arena17.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS 4** — diseño oscuro propio, sin librerías de UI de terceros
- **Prisma ORM + SQLite** (`prisma/dev.db`, archivo local, cero configuración)
- **Auth.js (NextAuth v5 beta)** con Credentials Provider + `bcryptjs`
- **Zod** para validación de formularios/acciones
- **Vitest** para tests unitarios del motor de brackets
- Mutaciones vía **Server Actions** de Next.js (sin capa REST separada)

No hay pasarela de pago real (el campo "tarifa" es informativo), ni envío de email real (el link de reseteo de contraseña se imprime en la consola del servidor), ni chat en vivo. Ver [Roadmap](#roadmap--pendientes) para lo que falta.

## Puesta en marcha

```bash
npm install
npx prisma migrate dev   # crea prisma/dev.db y aplica las migraciones
npm run db:seed          # siembra plataformas, ligas, torneos y usuarios demo
npm run dev              # http://localhost:3000
```

Variables de entorno (`.env`, ya incluido para desarrollo local):

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="dev-secret-change-me-in-production-please-1234567890"
```

### Usuarios demo (sembrados por `npm run db:seed`)

Contraseña para todos: **`Demo1234!`**

| Email | playerTag |
|---|---|
| carlos@example.com | carlosg |
| ana@example.com | anat |
| luis@example.com | luisp |
| marta@example.com | martar |
| diego@example.com | diegof |
| sofia@example.com | sofiac |
| pedro@example.com | pedror |
| valentina@example.com | valec |

El seed también crea: una liga (`Liga eFootball Series`), un torneo de eliminación simple **en curso** con resultados de ejemplo (`Copa Relámpago #1`), un torneo de **liga** abierto a inscripción (`Liga eFootball Clausura`) y un torneo **Relámpago** por comenzar (`Relámpago Express`).

## Scripts

```bash
npm run dev        # servidor de desarrollo (Turbopack)
npm run build      # build de producción
npm run start      # sirve el build de producción
npm run lint       # ESLint
npm test           # vitest run (motor de brackets)
npm run db:seed    # re-siembra la base (usa upsert, no duplica)
npx prisma studio  # inspeccionar la base de datos visualmente
```

## Estructura del proyecto

```
prisma/
  schema.prisma       # modelo de datos
  seed.ts              # datos de ejemplo
src/
  app/                 # rutas (App Router)
    torneos/           # listado, detalle, crear
    ligas/             # listado, detalle, crear
    jugadores/[tag]/   # perfil público
    rankings/          # leaderboard global
    login|registro|olvide|reset/[token]/   # auth
    relampago/ ayuda/ terminos/ buscar/
  components/          # componentes de UI (server + client)
    forms/             # formularios cliente (useActionState)
    ui/                # primitivos (Button, Card, Badge, Field)
  lib/
    actions/           # server actions (auth, torneos, ligas, locale)
    auth.ts            # config de Auth.js
    auth-helpers.ts     # requireUser() / getOptionalUser()
    bracket.ts          # motor de torneos: brackets, round-robin, standings (puro, testeado)
    rankings.ts          # cálculo del ranking global
    validation.ts         # esquemas Zod (localizados)
    i18n/
      dictionary.ts        # diccionarios pt/es completos
      locale.ts             # lectura de la cookie de idioma
  types/next-auth.d.ts    # augmentación de tipos de sesión
```

## Modelo de datos

`Platform`, `User` (con `playerTag` único, equivalente al "ID Arena"), `Liga` (colección de torneos), `Tournament` (`SINGLE_ELIM` | `LEAGUE`; estado `REGISTRATION` → `IN_PROGRESS` → `FINISHED`), `Participant`, `Match`, `PasswordResetToken`. Los rankings y tablas de posiciones se calculan **on-the-fly** desde los `Match` jugados — no hay tablas derivadas que puedan desincronizarse.

## Internacionalización

- `src/lib/i18n/dictionary.ts` contiene los diccionarios completos `pt`/`es` (nav, formularios, mensajes de validación, errores de las server actions, Ayuda, Términos, etc.)
- La cookie `locale` (sin prefijo en la URL) determina el idioma; default **portugués**.
- El selector de idioma (banderas en el navbar) es un Client Component que **redirige a la misma página** tras fijar la cookie (mismo patrón que usa Arena17 con su `?url=` de retorno) — necesario para que el cambio se refleje en el mismo clic.
- Lo que **no** se traduce a propósito: nombres/descripciones de torneos y ligas (contenido de usuario, igual que en Arena17).

## Testing

`npm test` corre los tests unitarios de `src/lib/bracket.ts` (generación de brackets con byes, cascadas de bye, calendario round-robin par/impar, cálculo de standings). Es lógica pura, sin DB ni framework — fácil de extender.

No hay tests end-to-end automatizados en el repo. Durante el desarrollo se validaron los flujos interactivos (login, crear torneo, unirse, sorteo, cargar resultados, selector de idioma) con scripts ad-hoc de Playwright apuntando al Chrome del sistema (`playwright-core`, sin descargar navegador propio) — ver `PROGRESS.md` para el detalle de qué se probó y qué bugs salieron de ahí.

## Roadmap / pendientes

Fuera de alcance en v1, documentado para después:
- Eliminación doble (bracket con llave de perdedores)
- Chat en vivo dentro de un torneo
- Pagos reales para torneos "de pago" (el campo hoy es solo informativo)
- Envío de email real para el reset de contraseña (hoy se imprime en consola)
- Animación de sorteo sincronizada en tiempo real entre usuarios (hoy es una tirada aleatoria del lado del servidor)
- Multi-idioma más allá de PT/ES si hiciera falta

Ver `PROGRESS.md` para el estado sesión a sesión y los próximos pasos concretos.
