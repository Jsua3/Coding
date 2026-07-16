# PROMPT MAESTRO — Coding

> Documento de contexto total del proyecto. **Léelo completo antes de trabajar en él desde una conversación nueva.**
> Última actualización: **2026-07-16**, tras fusionar la 8ª iteración ("La navbar que viaja") a `master` (código en `5bfe8ea`).

---

## 1. Qué es Coding

**Coding** es una aplicación web de aprendizaje de Ingeniería de Software (estilo Duolingo/Brilliant) para seis materias: Bases de datos I y II, Programación I y II, Algoritmos y Desarrollo web. Es un proyecto personal/académico de **Juan Jose** (estudiante, hispanohablante), pensado para uso local en su máquina Windows.

**Objetivo del producto:** que estudiar se sienta vivo y adictivo — lecciones cortas con teoría + ejercicios interactivos, feedback inmediato, XP, rachas, celebraciones, repaso de errores, niveles y logros. La referencia de calidad son "las mejores apps de aprendizaje actuales" (Duolingo, Brilliant, Mimo, Sololearn).

**Identidad visual:** lenguaje **Liquid Glass** — vidrio translúcido con blur, refracción, sombras frías y fondo aurora oscuro. Está definida en `Coding Design System/` (16 componentes React + tokens CSS + guidelines). **Esa carpeta es fuente de verdad visual y NUNCA se modifica**; la app la consume servida como estáticos en `/ds`.

**La física y el vocabulario del lenguaje** (capas ópticas del vidrio, el cursor como fuente de luz, la coreografía de gota, la disciplina de motion) están en **`docs/liquid-glass.md`**. Léelo antes de diseñar o animar cualquier cosa nueva.

---

## 2. Estado actual: ocho iteraciones + los fixes, todo fusionado a `master`

| # | Iteración | Qué añadió |
|---|---|---|
| 1 | **App base** (`2026-07-11-coding-backend`) | Backend Express + MariaDB, auth JWT, catálogo con progreso derivado, lecciones con quiz, XP y racha. Frontend del UI kit conectado. |
| 2 | **El loop de aprender** (`2026-07-12-loop-de-aprender`) | Motion core (`motion.css` + `fx.js`), orbe aurora, sonido sintetizado, 128 ejercicios de 4 tipos, lección como stepper, celebración, repaso de errores. |
| 3 | **La coreografía de gota** (`2026-07-13-coreografia-de-gota`) | Las **transiciones** hablan el lenguaje: la banda de feedback cae con squash & stretch y se evapora; el stepper hace *melt* entre ejercicios; la celebración se abre con un *bloom* desde el tap. Primitiva `usePhase`. |
| 4 | **El vidrio vivo** (`2026-07-14-vidrio-vivo`) | El **material** se comporta como materia: la navbar se parte en tres por tensión superficial al hacer scroll; *ripple* que nace donde tocas; ruido fractal sobre la aurora; elementos que se condensan al entrar. `window.Liquid`. + menú de perfil en el avatar y **cierre de sesión** (antes no existía). |
| 5 | **El meta-juego A** (`2026-07-14-meta-juego-a`) | **Niveles** (12, Aprendiz→Maestro) y **17 logros** (4 secretos), ambos **derivados**; página de **Progreso** (heatmap de 365 días, gráfica semanal, colección); **toast de logro**; y las tres **pestañas de la navbar por fin navegan** (nunca lo hicieron). |
| 6 | **El meta-juego B — la economía** (`2026-07-15-meta-juego-b`) | **Meta diaria de XP** configurable (anillo en Inicio); **protector de racha** canjeable con XP (reparación retroactiva); página de **Perfil**. El **split de XP**: nivel desde el XP ganado (nunca baja), saldo gastable desde el neto. **Primer cambio de esquema desde la iteración 2.** |
| 7 | **El cursor como fuente de luz** (`2026-07-15-cursor-luz`) | Paso 3 (y último) del lenguaje visual: `Liquid.pointer` publica 5 variables CSS y `.lg-tilt` las vuelve **tilt 3D** (máx 6°) + **brillo especular teñido** que sigue al cursor (retardo de intención 90ms, `mix-blend-mode: screen`). `TiltCard` envuelve las tarjetas de Inicio y Materias sin tocar el DS. |
| 8 | **La navbar que viaja** (`2026-07-16-navbar-viaja`) | **NavBar persistente**: `app.jsx` es el dueño del marco (PageFrame + NavBar fuera del div `key`ado; las 8 vistas son content-only) — antes cada pantalla montaba la suya y el indicador no podía deslizar. **`NavTabs`** reemplaza al Tabs del DS en la navbar: píldora **medida al texto** que viaja con **FLIP** (solo `transform`, se estira como gota). El logo lleva siempre a Inicio. |
| — | **Fix del `context`** (`fix/context-guard`) | Cerró un agujero de integridad preexistente: `POST /answer` confiaba en el `context` del cliente. Ahora el servidor lo degrada a `'lesson'` salvo que el ejercicio esté genuinamente pendiente de repaso. |
| — | **Fixes visuales** (directos a master, con systematic-debugging) | (a) Las tarjetas de logros desbordaban su celda 42px (`GlassPanel` es **content-box** y `height:100%` + padding se salía; fix: `boxSizing: border-box` vía el `style` prop). (b) La banda de feedback pisaba el botón Comprobar en pantallas bajas (fix: reservar 120px al fondo de lección y repaso). |

**Tests: 137/137** (empezó en 57). **El sub-proyecto 3 "El meta-juego" está entero** y **los 3 pasos del lenguaje visual (`docs/liquid-glass.md` §10) están hechos.**

### Lo siguiente acordado: el fondo vivo

El usuario lo pidió explícitamente: el fondo actual "es muy aburrido" — quiere uno **un poco más claro**, con una **cuadrícula tipo cuaderno que se deforma al paso del cursor** (evolución natural del cursor-como-luz: el cursor ya ilumina las tarjetas; ahora curvaría el espacio del fondo). Pendiente de brainstorm → spec → plan. Ver §11 para la deuda abierta.

## 3. Stack y decisiones técnicas (todas acordadas con el usuario)

| Decisión | Elección | Motivo |
|---|---|---|
| Backend | Node.js ≥ 20 (ESM) + Express 4 | Mismo lenguaje que el frontend |
| Base de datos | "MySQL" → en realidad **MariaDB 12.0.2** local (driver `mysql2/promise`) | Encaja con las materias de BD; ver §9 |
| Frontend | **Sin build**: React 18 UMD + Babel standalone en el navegador + globales `window` | Preserva el formato del UI kit del design system; cero riesgo visual |
| Auth | Registro/login reales: bcryptjs (cost 10) + JWT (1 día; 30 con "Recordarme") | |
| Ejercicios | **Estructurados** (sin ejecución de código libre) | Un motor de ejecución era un proyecto aparte; descartado |
| Personalidad | Orbe aurora (luz CSS), **no** mascota ilustrada | El DS prohíbe ilustraciones/emoji |
| Sonido | Web Audio sintetizado (sin archivos), con toggle | |
| Mecánicas descartadas | Vidas/corazones, tabla de líderes | Castigan o no aplican a uso local |
| Interacción | Todo **tap-based**, sin drag & drop | |
| Dependencias | SOLO: express, mysql2, bcryptjs, jsonwebtoken, dotenv (+ supertest dev). **No agregar más sin preguntar** | |

### Los dos principios que gobiernan todo

**1. Todo lo derivable se calcula, nunca se almacena.** Progreso, estados de curso, XP total/semanal, racha, bonus perfecto, cola de repaso, **niveles**, **logros**, heatmap — todo se deriva de `lesson_completions`, `xp_events` y `answer_attempts` en el momento de la consulta. **No hay columnas de progreso, ni tabla de logros.**

> El caso más bonito de este principio: **el toast de logro no se guarda en ninguna parte.** `POST /answer` calcula el conjunto de logros desbloqueados **antes** de su transacción y **después**, y devuelve la diferencia. Cero almacenamiento, cero migración. Si el usuario se pierde el toast, el logro sigue ahí en Progreso — **el toast es ceremonia, no registro.**

**2. Seguridad:** `answer` (respuesta correcta) y `password_hash` **jamás** salen por la API. Y desde la iteración 5: **el nombre real de un logro secreto bloqueado tampoco** — si se puede leer en la pestaña de red, no es un secreto. La validación de respuestas es 100% server-side. Todo SQL es parametrizado.

---

## 4. Estructura del repositorio

```
coding/                                  (repo git, rama master; remoto: github.com/Jsua3/Coding)
├── Coding Design System/                ← INTOCABLE; servido en /ds (styles.css, _ds_bundle.js, tokens)
├── prompt-maestro.md                    ← este documento
├── CLAUDE.md                            ← puntero corto a este documento
├── docs/
│   ├── liquid-glass.md                  ← EL LENGUAJE: física del vidrio, cursor, coreografía de gota
│   ├── documentos-carrera/              ← material de estudio personal (GIT-IGNORADO: PDFs con copyright)
│   └── superpowers/
│       ├── specs/                       ← specs de diseño aprobadas, una por iteración
│       └── plans/                       ← planes de implementación (tareas paso a paso con el código completo)
├── .claude/launch.json                  ← lanza el dev server (npm start --prefix app, puerto 3000)
├── .superpowers/sdd/progress.md         ← LEDGER (git-ignorado): historial de tareas, reviews y FOLLOW-UPS
└── app/
    ├── package.json                     ← scripts: start / seed / test  (type: module)
    ├── .env                             ← credenciales reales (GIT-IGNORADO; ver §9)
    ├── server/
    │   ├── index.js                     ← createApp(): API en /api/*, estáticos /ds y web/, error middleware
    │   ├── db.js                        ← pool mysql2 lazy; initDb() crea BD, aplica schema, siembra si vacía
    │   ├── schema.sql                   ← DDL (9 tablas). users.daily_goal + streak_shields desde la iteración 6
    │   ├── seed.js                      ← upsert idempotente por ids estables; CLI: npm run seed
    │   ├── auth.js                      ← register/login, requireAuth (Bearer JWT → req.userId)
    │   ├── routes/                      ← me, courses, lessons, exercises, review, progress, streak
    │   ├── services/
    │   │   ├── xp.js                    ← importes (LESSON=50, PERFECT=10, REVIEW=5, SHIELD_COST=50) + earnedXp/balanceXp
    │   │   ├── progress.js              ← progressPercent, courseStatus, coursesForUser, courseDetail
    │   │   ├── gamification.js          ← toDayString, currentStreak, bestStreak, weeklyXp, repairableGap (puras)
    │   │   ├── streak.js                ← protectedDaysFor, streakStateFor, balanceXpFor, protectStreak (async + tx)
    │   │   ├── exercises.js             ← validateResponse (pura)
    │   │   ├── review.js                ← cola de repaso derivada (orden por id de intento)
    │   │   ├── levels.js                ← LEVELS (12) + levelFor(xp) (pura)
    │   │   ├── achievements.js          ← ACHIEVEMENTS (17) + unlockedFor/achievementsFor/achievementInfo
    │   │   └── metagame.js              ← contadores derivados, actividad por día, heatmap (puras + async)
    │   └── seed-data/                   ← bd1, bd2, prog1, prog2, algo, web (contenido completo)
    ├── web/                             ← frontend sin build
    │   ├── index.html                   ← ORDEN DE SCRIPTS CRÍTICO (= resolución de dependencias)
    │   ├── api.js                       ← window.API (fetch + token; logout(); 401 → onUnauthorized)
    │   ├── fx.js, motion.css            ← motion core (§7)
    │   ├── liquid.js, liquid.css        ← window.Liquid: ripple(), reveal(), pointer() + el CSS del vidrio vivo
    │   ├── app.jsx                      ← router (lee `tab`), DUEÑO DEL MARCO (PageFrame + NavBar persistente
    │   │                                  fuera del div keyado), toast global, COLA DE LOGROS
    │   └── screens/                     ← Orb, AppShell (NavBar, NavTabs, TiltCard, PageFrame, hooks), Login,
    │                                      Inicio, Materias, Course, exercises, Lesson (+Celebration
    │                                      +FeedbackBand), Review, Progress, Profile — content-only (sin marco propio)
    ├── test/                            ← 137 tests: node:test + supertest contra MariaDB real (BD coding_test)
    └── README.md
```

---

## 5. Modelo de datos (MariaDB, InnoDB, utf8mb4) — **9 tablas**

> El esquema fue estable de la iteración 2 a la 5. La iteración 6 (la economía) fue el **primer cambio**: la columna `users.daily_goal` y la tabla `streak_shields`. `initDb` aplica `schema.sql` con `CREATE TABLE IF NOT EXISTS` + un paso de **migración idempotente** (`ALTER TABLE … ADD COLUMN IF NOT EXISTS`) para la columna nueva en la BD dev existente.

| Tabla | Claves/campos esenciales |
|---|---|
| `users` | id AI, name, email UNIQUE, password_hash, **daily_goal INT DEFAULT 50**, created_at |
| `courses` | id VARCHAR ('bd1','prog2','algo','bd2','prog1','web' — ese es el orden del catálogo), subject, subject_tone ENUM(blue,cyan,violet,amber), title, description, prereq_course_id (SOLO bd2→bd1) |
| `units` | id VARCHAR, course_id FK, name, order_index |
| `lessons` | id VARCHAR, unit_id FK, title, mins, order_index, **content JSON** (bloques `p`/`code`/`note`) |
| `exercises` | id VARCHAR `"<lessonId>-ex1\|ex2"`, lesson_id FK, order_index, type ENUM(choice,blanks,order,match), prompt, **payload JSON** (lo que ve el cliente), **answer JSON** (solo servidor), explain_ok, explain_bad |
| `answer_attempts` | id AI, user_id, exercise_id, context ENUM(lesson,review), correct, created_at DATETIME(3). **El orden de eventos se deriva del `id`, NUNCA del timestamp** |
| `lesson_completions` | PK compuesta (user_id, lesson_id), completed_at. **Sin id autoincremental** — ver §11 |
| `xp_events` | id AI, user_id, lesson_id NULL, **amount INT (puede ser NEGATIVO** — el gasto del protector de racha es un evento negativo), created_at |
| `streak_shields` | id AI, user_id FK, protected_day DATE, created_at, **UNIQUE(user_id, protected_day)**. Un día protegido por fila |

Sembrado: 6 cursos, 18 unidades, **64 lecciones**, **128 ejercicios** (2 por lección).

**El split de XP** (derivado, sin columnas): **XP ganado** = `SUM(amount>0)` → alimenta el nivel (nunca baja) y todo lo de "actividad" (meta diaria, gráfica semanal, heatmap). **Saldo** = `SUM(amount)` (con negativos) → lo gastable. Helpers `earnedXp`/`balanceXp` en `services/xp.js`.

---

## 6. API completa (`/api`, JSON; Bearer token salvo `/auth/*`)

| Endpoint | Devuelve |
|---|---|
| `POST /auth/register` | `201 {token, user}`. 400 validación, 409 email duplicado |
| `POST /auth/login` | `{token, user}`; 401 credenciales malas; `remember` → 30d |
| `GET /me` | `{user:{…, **createdAt**}, stats:{xp (ganado), **level:{n,name,progress}**, xpWeek, streak, bestStreak, **dailyGoal, xpToday, balance**, activeCourses, completedCourses, lockedCourses, reviewCount}, continue}` |
| `GET /courses` | catálogo con progreso y status (NUEVO/EN CURSO/COMPLETADO/**BLOQUEADO**) |
| `GET /courses/:id` | detalle + unidades + lecciones; **403** si bloqueado; 404 si no existe |
| `GET /lessons/:id` | contenido + ejercicios **sin answers**; 403 si curso bloqueado |
| `POST /exercises/:id/answer` | `{correct, explanation, lessonCompleted, xpAwarded, perfectBonus, streak, courseProgress, nextLessonId, reviewCleared, achievementsUnlocked}`. **El servidor decide el `context`** (§7.10) |
| `GET /review` | cola de repaso (máx 10) |
| **`GET /progress`** | `{level, **streak:{current,best,repairable}**, achievements[17], heatmap[365], weekXp[7]}` — todo derivado |
| **`PUT /me/daily-goal`** `{goal}` | guarda la meta; `goal` ∈ [20,50,100,150] o 400 |
| **`POST /streak/protect`** | repara el hueco (recalculado en el servidor), cobra en transacción → `{streak, balance}`; 400 si no reparable o falta saldo |

Errores: middleware central, `{error}` en español con tuteo, 500 genérico sin stack.

---

## 7. Reglas de negocio (la "lógica del programa")

1. **Completar lección** = todos sus ejercicios con ≥1 intento correcto. Al acertar el último: transacción con `lesson_completions` + `xp_events(+50)` (+`+10` si **perfecto** = cero fallos con context='lesson'). `ER_DUP_ENTRY` tolerado. Solo context='lesson' completa lecciones.
2. **Racha**: días-calendario consecutivos **con crédito** (≥1 completación **o** un día protegido), hacia atrás desde hoy (si hoy no hay actividad, cuenta desde ayer). El "día" sale SIEMPRE del reloj de Node (`toDayString`), **nunca** de `CURDATE()`. Un día protegido cuenta en `currentStreak`, `bestStreak` y los logros de constancia — de forma consistente (se pasa la unión `activos ∪ protegidos` a las funciones puras, que no cambian por dentro).
3. **Repaso**: un ejercicio queda pendiente si tiene un fallo sin acierto posterior con context='review' (**comparación por id de intento**). Acertar en lección NO desencola (refuerzo tipo Duolingo); acertar en repaso desencola y da **+5 XP una sola vez**.
4. **Desbloqueo**: `bd2` exige `bd1` al 100%. Se aplica en el SERVIDOR (403), no solo en la UI.
5. **Niveles**: 12, de Aprendiz (0 XP) a **Maestro (3.200 XP = las 64 lecciones)**. La curva está anclada al techo real del juego: terminar el temario te hace Maestro. `progress` usa `Math.floor` — **nunca puede decir 100% si aún falta XP**.
6. **Logros**: 17 (13 visibles + **4 secretos**). Se derivan de contadores **monótonos** (solo crecen) — por eso es seguro derivarlos: el conjunto de desbloqueados nunca encoge. La constancia se mide contra `bestStreak` (la MEJOR racha), no la actual: perder la racha no te quita el logro.
7. **El toast** solo puede dispararse en `POST /answer` (la única acción que muta el juego), sale de un diff antes/después, y **se ancla al montaje de la celebración**, no al momento de responder (si no, caería sobre el ejercicio y la celebración se abriría encima).
8. **Meta diaria**: preferencia guardada (`users.daily_goal`, escala [20,50,100,150]). Es un objetivo APARTE de la racha (no la afecta): la racha sigue siendo "≥1 día con crédito". El anillo mide XP **ganado** hoy.
9. **Protector de racha** (reparación retroactiva): si tu racha se rompió por un hueco reciente, pagas XP para rellenarlo. `repairableGap` (pura, `gamification.js`) decide qué es reparable con **tres guardas de honestidad**: (a) sin actividad hoy ni ayer → nada que proteger; (b) solo dentro de una ventana de **2 días**; (c) solo si el hueco topa con un ancla (racha previa a la que reconectar) — **no se puede fabricar** una racha de la nada. Coste **50 XP/día** (`SHIELD_COST`). El servidor **recalcula** el hueco (jamás confía en el cliente), valida saldo, y cobra en una transacción (escudo(s) + `xp_events` negativo). **Gastar baja el saldo pero NO el nivel** (el nivel sale del XP ganado).
10. **El servidor decide el `context`** de un intento (`answer_attempts`): degrada `'review'` a `'lesson'` salvo que el ejercicio esté genuinamente pendiente de repaso (`isPendingReview`, mirado antes del INSERT). El cliente dice en qué pantalla está, pero no puede reclamar "review" para algo no pendiente — así el primer fallo de cualquier ejercicio siempre cuenta como fallo de lección y es imposible forjar una lección perfecta.

### Tipos de ejercicio (contratos exactos)

| type | payload (cliente) | answer (servidor) | response del cliente |
|---|---|---|---|
| `choice` | `{options:[4]}` | `{index}` | `{index}` |
| `blanks` | `{code:[líneas con <b0>,<b1>…], bank:[fichas + ≥2 distractores]}` | `{blanks:[…]}` | `{blanks:[strings]}` |
| `order` | `{lines:[{id,html}] MEZCLADAS}` | `{order:[ids]}` | `{order:[ids]}` |
| `match` | `{left:[4], right:[4] mezclado}` | `{pairs:[[l,r]×4]}` | `{pairs}` |

---

## 8. Frontend — patrones obligatorios

- **Sin build.** PROHIBIDO `import`/`export` en `app/web/`. Prohibido el shorthand `<>` (usar `React.Fragment`). Los componentes se comparten con `Object.assign(window, {...})` y **el orden de los `<script>` en `index.html` ES la resolución de dependencias**.
- **El KIT**: `const KIT = window.CodingDesignSystem_2ecb3a`. Gotchas verificados: `tint`/`tone` NO aceptan "amber" (`Progress` solo blue/cyan/violet/success); **`GlassPanel`, `Card`, `Progress`, `Badge` NO reenvían `className`** ⇒ las clases de animación van en un `<div>` wrapper propio; `Card` hace `translateY(-4px)` en hover ⇒ un wrapper con `overflow: hidden` se lo recortaría; **los paneles del DS son `content-box`** (y la app no tiene reset global) ⇒ si les pasas `height: 100%` con padding, añade `boxSizing: "border-box"` por el `style` prop o desbordan su celda — nos pasó dos veces el mismo día (logros y la píldora de NavTabs).
- **La navbar es UNA y persistente**: vive en `app.jsx` (fuera del div `key`ado que remonta el contenido por navegación). Ninguna pantalla debe montar `PageFrame`/`NavBar` propios — son content-only. El indicador de pestañas (`NavTabs`) mide el texto y viaja con FLIP; sin la persistencia, no habría viaje.
- **Regla de oro del DS**: `backdrop-filter` JAMÁS en un elemento con texto — va en un `<span aria-hidden>` absoluto con `zIndex: -1`.
- **Motion**: solo se animan `transform`, `opacity`, `filter` (y `scale`/`translate` individuales). Excepciones declaradas y justificadas: `border-color`/`border-radius`/`box-shadow` en la navbar (repintado, nunca layout, y solo en cambio de estado).
- **Reduced motion, doble cinturón**: gate JS (`FX.reducedMotion`) + bloque `@media (prefers-reduced-motion: reduce)`, que debe ser **el último** de `liquid.css`. **Todo elemento cuyo estado base sea visible se oculta con `display: none`, nunca con `animation: none`** (con `animation: none` quedaría congelado y visible — nos pasó dos veces).
- **Higiene**: todo timer/rAF/observer en ref, limpiado en el `useEffect` de desmontaje. Los nodos inyectados se autodestruyen por `animationend` + `setTimeout` de seguridad.
- **Globales disponibles**: `window.FX` (`sound.play`, `burst`, `bloom`, `countUp`, `reducedMotion`), `window.Liquid` (`ripple`, `reveal`, `pointer`), y de `AppShell.jsx`: `usePhase(value, outMs)`, `useScrolled(px)`, `TiltCard` (envuelve una tarjeta para que sienta el cursor: brillo + tilt; va DENTRO del `.lg-reveal`, nunca en el mismo div — ambos escriben `transform`) y `NavTabs`.

---

## 9. Entorno local y comandos (Windows del usuario)

- **BD**: lo que corre en `localhost:3306` es **MariaDB 12.0.2** (servicio de Windows), no MySQL. Credenciales reales en `app/.env` (git-ignorado; usuario root). **Nunca adivinar contraseñas: si `.env` falta o falla, pedírselas al usuario.** BD dev `coding`; BD de tests `coding_test` (se crea/trunca sola).
- **Comandos** (desde `app/`): `npm start` (:3000), `npm test` (**137/137**), `npm run seed` (refresca contenido sin tocar usuarios ni progreso).
- **El dev server suele quedar corriendo entre sesiones**. Guarda el backend **en memoria**: si sus respuestas `/api` parecen viejas, **mátalo y relanza** `npm start`. Los estáticos (`web/`) sí se sirven frescos del disco.
- Cuenta de pruebas: `juan@test.dev` / `secreto1`.
- Frontend con CDN (React/Babel de unpkg con SRI): requiere internet la primera carga. **Vendorizarlos sigue pendiente.**

### Gotchas del tooling de navegador (los aprendimos a base de golpes)

- El panel corre con **`document.hidden === true` siempre** ⇒ el `IntersectionObserver` **nunca dispara**, `requestAnimationFrame` **nunca resuelve** y las animaciones CSS **no corren**. No intentes probar que algo *se ve* bien: prueba el **contrato** (clases, `getComputedStyle`, `getAnimations()`, estado forzado).
- **`read_console_messages` NO reporta excepciones no capturadas.** Antes de afirmar "cero errores", instala un trap: `window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));` (y reinstálalo tras cada recarga).
- Los screenshots pueden hacer timeout. Usa `read_page` / `javascript_tool`.
- Si el usuario dice "no veo los cambios": es **caché del navegador**. Ctrl+Shift+R.

---

## 10. Flujo de trabajo del proyecto

Para cualquier trabajo no trivial, el flujo **superpowers** de principio a fin:

1. `superpowers:brainstorming` — preguntas de una en una → diseño por secciones → aprobación.
2. Spec en `docs/superpowers/specs/YYYY-MM-DD-<tema>-design.md` (self-review + revisión del usuario) y commit.
3. `superpowers:writing-plans` — plan TDD paso a paso con el código completo en `docs/superpowers/plans/`.
4. `superpowers:subagent-driven-development` — rama feature, un subagente implementador por tarea + revisor por tarea + fixes con re-review. **Ledger en `.superpowers/sdd/progress.md`.**
5. Review final de toda la rama (modelo más capaz, con smoke test en vivo) → fixes → `superpowers:finishing-a-development-branch` (tests → merge → borrar rama).

**Este proceso funciona: en las tres últimas iteraciones los reviews cazaron bugs reales que el tooling jamás habría visto** — casi todos defectos del *plan*, no de los implementadores. No lo saltes.

**Convenciones:** commits en español (`feat:`/`fix:`/`docs:`/`chore:`/`refactor:`); TDD estricto en backend (RED→GREEN, con la evidencia en el reporte); copy en **español con tuteo**, sentence case, **sin emoji**, metadatos con "·". Colores por materia: Programación=blue, BD=cyan, Algoritmos=violet, Web=amber.

**Contenido didáctico:** técnicamente correcto SIEMPRE (los reviewers verifican el SQL/Java/JS que se enseña); spans de color solo dentro de template literals con las constantes K/S/N/C; jamás `${}` dentro de strings con comillas dobles en seed-data.

---

## 11. Lo que falta y lo que hay que mejorar

### Lo siguiente acordado
**El fondo vivo** (ver §2): más claro, cuadrícula tipo cuaderno que se deforma al paso del cursor. Pedido explícito del usuario; pendiente de brainstorm. Los 3 pasos del lenguaje visual de `docs/liquid-glass.md` §10 ya están hechos — esto sería vocabulario nuevo del lenguaje, no un paso pendiente.

### Deuda real, ordenada por importancia

1. **`perfectRun` es el único contador NO estrictamente monótono.** `lesson_completions` no tiene id autoincremental (su PK es compuesta), así que no hay clave de orden de inserción; el desempate por `lesson_id` da determinismo, no cronología. Prácticamente inalcanzable (exige 3 completaciones en el mismo segundo). Solo se cierra con una **columna de orden en el esquema**. (La iteración 6 tocó el esquema pero no lo abordó — no era su alcance.)
2. **`.lg-bars__bar` (gráfica semanal) transiciona `height`** (propiedad de layout), contra la regla del proyecto. Ya está cubierto por reduced motion, pero re-arquitecturarlo a `transform: scaleY()` queda pendiente.
3. **`diez-repasos` cuenta eventos de XP, no ejercicios distintos**: fallar y limpiar el mismo ejercicio 10 veces lo desbloquea, aunque el copy diga "Corrige 10 ejercicios en repaso".
4. **Dos `try/catch` sin test directo, ambos con razón documentada:** (a) el que contiene el fallo del cálculo de logros en `POST /answer`; (b) el `ER_DUP_ENTRY` dentro de la transacción de `protectStreak` (inalcanzable en una conexión: el pre-check lee la misma tabla cuyo UNIQUE chocaría). Ninguno tiene costura limpia sin mockeo de ESM o una carrera de dos conexiones. Verificados por lectura.
5. **Dos lecturas independientes de `new Date()` por petición** en `/me` y `/progress` podrían discrepar en el límite exacto de medianoche. Astronómicamente raro y autocorregible; pasar un único `now` a todo el response lo cierra.
6. **`FX.countUp` no cancela su `rAF`**: un re-disparo con una animación en vuelo puede parpadear. Patrón preexistente en varias pantallas.
7. **Vendorizar React/ReactDOM/Babel** a `app/web/vendor/` para funcionar offline.
8. **`tab`/`setTab` quedaron como props muertas en 6 de 7 pantallas** tras el lift de la navbar (solo Inicio usa `setTab`; el plan mandó no tocar firmas para minimizar el diff). Candidatas a una pasada de limpieza.
9. **El FLIP de `NavTabs` no maneja interrupción**: un click en cadena (cambiar de pestaña con la píldora aún en vuelo) salta al reposo intermedio antes de volar. Correctitud intacta; si el *feel* molesta, el fix es capturar el `transform` vivo (`getComputedStyle`) como origen.
10. **`will-change: transform` permanente en `.lg-tilt`** (mandato del spec del cursor-luz): asumible con pocas tarjetas; si una pantalla futura tiene muchas, promover solo en hover.
11. **Verificación humana pendiente** (el tooling congela `rAF`/transiciones/`IntersectionObserver`; necesita navegador en **primer plano**): el *feel* del tilt/brillo del cursor-luz (incl. el **doble-lift** de las tarjetas de curso: −4px del DS Card + −6px del wrapper = −10px; si molesta, `--lift: -3px` es fix de 1 línea), la refracción del `backdrop-filter` bajo el `TiltCard`, la legibilidad del botón de CourseCard en pico de brillo, y el viaje de la píldora de NavTabs (estiramiento de gota, 420ms).
12. Menores aceptados con razón documentada en el ledger (`.superpowers/sdd/progress.md`) — **consúltalo antes de "redescubrir" issues**.

> **Cerrado ya:** el agujero de integridad del `context` (un cliente podía forjar lecciones perfectas mandando `context:"review"` en sus fallos) — resuelto en `fix/context-guard`: el servidor decide el `context` (§7.10).

### Fuera de alcance decidido
Ejecución de código libre, drag & drop, vidas/corazones, leaderboard, recuperación de contraseña, migración a Vite (el backend en capas lo permite después).

---

## 12. Resumen en una frase

Coding es un Duolingo de Ingeniería de Software, local y en español, con estética Liquid Glass: Express + MariaDB con **toda la lógica derivada** (progreso, racha, repaso, niveles, logros, saldo, hueco reparable — cero columnas de estado salvo la meta diaria) y validación server-side; frontend React sin build donde el vidrio se comporta como materia (se parte por tensión superficial, responde al tacto, se condensa, **siente el cursor** — tilt + brillo especular — y su navbar persiste con una píldora que viaja midiendo el texto); 128 ejercicios, celebraciones, rachas, repaso, 12 niveles, 17 logros, meta diaria y protector de racha — construido y revisado tarea a tarea con el flujo superpowers, con el meta-juego y los 3 pasos del lenguaje visual completos, y **el fondo vivo** como siguiente iteración acordada.
