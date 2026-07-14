# PROMPT MAESTRO — Coding

> Documento de contexto total del proyecto. Léelo completo antes de trabajar en él desde una conversación nueva. Última actualización: **2026-07-13**, tras fusionar la iteración "El loop de aprender" a `master` (commit `dc5f9fa` + config `513f0cc`).

---

## 1. Qué es Coding

**Coding** es una aplicación web de aprendizaje de Ingeniería de Software (estilo Duolingo/Brilliant) para las materias: Bases de datos I y II, Programación I y II, Algoritmos y Desarrollo web. Es un proyecto personal/académico del usuario (Juan Jose, estudiante, hispanohablante), pensado para uso local en su máquina Windows.

**Objetivo del producto:** que estudiar se sienta vivo y adictivo — lecciones cortas con teoría + ejercicios interactivos, feedback inmediato, XP, rachas, celebraciones y repaso de errores. La referencia de calidad son "las mejores apps de aprendizaje actuales" (Duolingo, Brilliant, Mimo, Sololearn).

**Identidad visual:** lenguaje **Liquid Glass** — vidrio translúcido con blur, refracción, sombras frías y fondo aurora oscuro. Está definida por completo en la carpeta `Coding Design System/` (16 componentes React + tokens CSS + guidelines). **Esa carpeta es fuente de verdad visual y NUNCA se modifica**; la app la consume servida como estáticos en `/ds`. La física y el vocabulario del lenguaje (capas ópticas, cursor como fuente de luz, coreografía de gota, disciplina de motion) están en **`docs/liquid-glass.md`** — léelo antes de diseñar o animar algo nuevo.

---

## 2. Estado actual y qué fue lo último que se añadió

El proyecto se construyó en **dos iteraciones completas**, ambas fusionadas a `master`:

1. **Iteración 1 — App base** (spec `docs/superpowers/specs/2026-07-11-coding-backend-design.md`): backend Express + MariaDB con auth JWT, catálogo de materias con progreso derivado, lecciones con quiz de opción múltiple, XP y racha; frontend del UI kit conectado (login, dashboard, curso, lección). + Follow-ups de endurecimiento (transacciones, límites de longitud, pase de contenido).

2. **Iteración 2 — "El loop de aprender"** (spec `docs/superpowers/specs/2026-07-12-loop-de-aprender-design.md`) — **lo último añadido**:
   - **Motion core**: `app/web/motion.css` (keyframes sobre tokens del DS) + `app/web/fx.js` (`window.FX`: sonidos sintetizados con Web Audio, `burst` de chispas aurora, `countUp` de números).
   - **Orbe aurora** (`app/web/screens/Orb.jsx`): mascota de luz hecha solo con gradientes CSS; estados `idle/happy/sad/celebrate`.
   - **Toggle de sonido** en el NavBar (persistido en `localStorage["coding-sound"]`), transiciones de pantalla animadas.
   - **Modelo de ejercicios**: la tabla `quiz_questions` fue reemplazada por `exercises` (4 tipos: `choice`, `blanks`, `order`, `match`) + `answer_attempts` (registro de intentos con contexto `lesson|review`). **128 ejercicios** sembrados (2 por lección).
   - **Lección como stepper**: paso de teoría → ejercicios uno a la vez → banda de feedback inferior de vidrio (reemplazó al Dialog) → **CelebrationScreen** (XP con countUp, bonus "Perfecto +10", llama de racha, anillo animado).
   - **Repaso de errores**: cola derivada de intentos fallidos; tarjeta ámbar en el dashboard; `ReviewScreen` con +5 XP por ejercicio corregido.

**Roadmap acordado con el usuario (siguiente iteración): sub-proyecto 2 "El meta-juego"** — meta diaria de XP configurable, logros/insignias con toast de desbloqueo, niveles derivados del XP, **protector de racha** canjeable con XP, páginas de Perfil y Progreso (heatmap de actividad estilo GitHub, gráfica semanal de XP). Este alcance ya fue decidido; cuando se retome, sigue el flujo spec → plan → ejecución (ver §10).

---

## 3. Stack y decisiones técnicas (todas acordadas con el usuario)

| Decisión | Elección | Motivo |
|---|---|---|
| Backend | Node.js ≥ 20 (ESM) + Express 4 | Mismo lenguaje que el frontend |
| Base de datos | "MySQL" → en realidad **MariaDB 12.0.2** local (driver `mysql2/promise`) | Encaja con las materias de BD; ver §9 Entorno |
| Frontend | **Sin build**: React 18 UMD + Babel standalone en el navegador + globales `window` | Preserva el formato del UI kit del design system; cero riesgo visual |
| Auth | Registro/login reales: bcryptjs (cost 10) + JWT (1 día; 30 con "Recordarme") | |
| Ejercicios | **Estructurados** (sin ejecución de código libre) | Un motor de ejecución era un proyecto aparte; se descartó |
| Personalidad | Orbe aurora (luz CSS), **no** mascota ilustrada (el DS prohíbe ilustraciones/emoji) | |
| Sonido | Web Audio sintetizado (sin archivos), con toggle | |
| Mecánicas descartadas | Vidas/corazones, tabla de líderes | Castigan o no aplican a uso local |
| Interacción | Todo **tap-based**, sin drag & drop | |
| Dependencias | SOLO: express, mysql2, bcryptjs, jsonwebtoken, dotenv (+ supertest dev). **No agregar más sin preguntar** | |

**Principio arquitectónico central: todo lo derivable se calcula, nunca se almacena.** Progreso, estados de curso, XP total/semanal, racha, bonus perfecto, cola de repaso — todo se deriva de `lesson_completions`, `xp_events` y `answer_attempts` en el momento de la consulta. No hay columnas de progreso.

**Principio de seguridad central:** `answer` (respuesta correcta de un ejercicio) y `password_hash` **jamás** aparecen en una respuesta de la API. La validación de respuestas es 100% server-side. Todo SQL es parametrizado.

---

## 4. Estructura del repositorio

```
coding/                                  (repo git, rama master; SIN remoto configurado aún)
├── Coding Design System/                ← INTOCABLE; servido en /ds (styles.css, _ds_bundle.js, ui_kits de referencia)
├── prompt-maestro.md                    ← este documento
├── CLAUDE.md                            ← puntero corto a este documento
├── docs/
│   ├── liquid-glass.md                  ← el lenguaje de diseño: física del vidrio, cursor, coreografía de gota
│   └── superpowers/
│       ├── specs/                       ← specs de diseño aprobadas por iteración
│       └── plans/                       ← planes de implementación (tareas TDD paso a paso)
├── .claude/launch.json                  ← lanza el dev server (npm start --prefix app, puerto 3000)
├── .superpowers/sdd/progress.md         ← ledger de ejecución (git-ignorado, historial de tareas/reviews)
└── app/
    ├── package.json                     ← scripts: start / seed / test  (type: module)
    ├── .env                             ← credenciales reales (GIT-IGNORADO; ver §9). .env.example como plantilla
    ├── server/
    │   ├── index.js                     ← createApp(): API en /api/*, estáticos /ds y web/, middleware central de errores
    │   ├── db.js                        ← pool mysql2 lazy; initDb() crea BD si falta, aplica schema.sql, siembra si vacía
    │   ├── schema.sql                   ← DDL completo (8 tablas) + DROP legacy de quiz_questions
    │   ├── seed.js                      ← upsert idempotente por ids estables (runSeed); CLI: npm run seed
    │   ├── auth.js                      ← POST /api/auth/register|login, middleware requireAuth (Bearer JWT → req.userId), initials()
    │   ├── routes/
    │   │   ├── me.js                    ← GET /api/me
    │   │   ├── courses.js               ← GET /api/courses, GET /api/courses/:id
    │   │   ├── lessons.js               ← GET /api/lessons/:id (contenido + exercises SIN answers)
    │   │   ├── exercises.js             ← POST /api/exercises/:id/answer (el corazón de la lógica)
    │   │   └── review.js                ← GET /api/review
    │   ├── services/
    │   │   ├── progress.js              ← progressPercent, courseStatus (puras) + coursesForUser, courseDetail (lanza 403), findContinue
    │   │   ├── gamification.js          ← toDayString, currentStreak, bestStreak, weeklyXp (puras)
    │   │   ├── exercises.js             ← validateResponse(type, payload, answer, response) (pura)
    │   │   └── review.js                ← isPendingReview, pendingReview, reviewCount (cola derivada, orden por id de intento)
    │   ├── lib/validate.js              ← required(), validEmail()
    │   └── seed-data/                   ← bd1.js, bd2.js, prog1.js, prog2.js, algo.js, web.js (contenido completo)
    ├── web/                             ← frontend sin build
    │   ├── index.html                   ← orden de scripts CRÍTICO: styles /ds+motion.css → React/Babel CDN → _ds_bundle → api.js → fx.js → Orb → AppShell → Login → Dashboard → Course → exercises → Lesson → Review → app.jsx
    │   ├── api.js                       ← window.API (fetch + token en localStorage "coding-token"; 401 fuera de /auth/* → logout)
    │   ├── fx.js, motion.css            ← motion core (ver §7)
    │   ├── app.jsx                      ← mini-router por estado: login → dashboard → course/:id → lesson/:id → review; toast global
    │   └── screens/                     ← Orb, AppShell (KIcon/ICONS/NavBar/PageFrame/LoadingPanel/ErrorPanel/SoundToggle),
    │                                      LoginScreen, DashboardScreen, CourseScreen, exercises.jsx (renderers),
    │                                      LessonScreen (+CelebrationScreen +FeedbackBand), ReviewScreen
    ├── test/                            ← 57 tests: node:test + supertest contra MariaDB real (BD coding_test)
    └── README.md                        ← guía de usuario corta
```

---

## 5. Modelo de datos (MariaDB, InnoDB, utf8mb4)

| Tabla | Claves/campos esenciales |
|---|---|
| `users` | id AI, name, email UNIQUE, password_hash, created_at |
| `courses` | id VARCHAR ('bd1','prog2','algo','bd2','prog1','web' — ese es el orden del catálogo por order_index 1..6), subject, subject_tone ENUM(blue,cyan,violet,amber), title, description, prereq_course_id (SOLO bd2→bd1) |
| `units` | id VARCHAR, course_id FK, name, order_index |
| `lessons` | id VARCHAR (ej. 'l5', 'prog1-l3'), unit_id FK, title, mins, order_index, **content JSON** (bloques `{type:'p',html}` / `{type:'code',lines[]}` / `{type:'note',text}`) |
| `exercises` | id VARCHAR `"<lessonId>-ex1|ex2"`, lesson_id FK, order_index, type ENUM(choice,blanks,order,match), prompt, **payload JSON** (lo que ve el cliente), **answer JSON** (solo servidor), explain_ok, explain_bad |
| `answer_attempts` | id AI, user_id, exercise_id, context ENUM(lesson,review), correct TINYINT, created_at **DATETIME(3)**. El orden de eventos se deriva del **id** (no del timestamp) |
| `lesson_completions` | PK compuesta (user_id, lesson_id), completed_at |
| `xp_events` | id AI, user_id, lesson_id NULL, amount (50 lección / 10 perfecto / 5 repaso), created_at |

Conteos sembrados: 6 cursos, 18 unidades, **64 lecciones** (bd1:10, bd2:9, prog1:12, prog2:9, algo:12, web:12), **128 ejercicios** (cada lección: ex1 choice derivado del campo `quiz` del seed-data + ex2 estructurado del campo `extra`).

---

## 6. API completa (`/api`, JSON; Bearer token salvo `/auth/*` y `/health`)

| Endpoint | Devuelve |
|---|---|
| `POST /auth/register` `{name,email,password}` | `201 {token, user:{id,name,email,initials}}`. 400 validación (nombre vacío, email inválido, password<6, name>80, email>120), 409 email duplicado (también ante carrera, vía ER_DUP_ENTRY) |
| `POST /auth/login` `{email,password,remember}` | `{token, user}`; 401 credenciales malas; remember → 30d |
| `GET /me` | `{user, stats:{xp, xpWeek, streak, bestStreak, activeCourses, completedCourses, lockedCourses, reviewCount}, continue:{courseId,lessonId,lessonTitle}\|null}` |
| `GET /courses` | catálogo con `{…, lessons, hours, progress, status}` por usuario. status ∈ NUEVO/EN CURSO/COMPLETADO/**BLOQUEADO** (prevalece) |
| `GET /courses/:id` | detalle + `units[].lessons[]:{id,title,mins,done,current}` (exactamente una `current`); **403** si bloqueado ("Completa <materia> para desbloquear esta materia"); 404 si no existe |
| `GET /lessons/:id` | `{id,title,unitName,courseId,courseSubject,position:{index,total},courseProgress,content[],exercises:[{id,type,prompt,payload}]}` — sin answers; 403 si curso bloqueado |
| `POST /exercises/:id/answer` `{response, context?}` | `{correct, explanation, lessonCompleted, xpAwarded, perfectBonus, streak:{value,extended}\|null, courseProgress, nextLessonId, reviewCleared}`. 400 respuesta malformada; 403 bloqueado; 404 |
| `GET /review` | `{count, exercises:[{id,type,prompt,payload,lessonTitle,courseSubject}]}` (máx 10, más recientes primero) |

Errores: middleware central — `{error}` en español con tuteo; 400/401/403/404/409; 500 genérico sin stack al cliente. JSON malformado → 400 "JSON inválido".

---

## 7. Reglas de negocio (la "lógica del programa")

1. **Completar lección** = todos sus ejercicios con ≥1 intento correcto. Al acertar el último pendiente: transacción con `lesson_completions` + `xp_events(+50)` (+`xp_events(+10)` si **perfecto** = cero intentos incorrectos con context='lesson' en esa lección antes de completar). `ER_DUP_ENTRY` tolerado (sin 500 ni XP doble). Solo context='lesson' completa lecciones.
2. **Racha**: días-calendario consecutivos con ≥1 completación, hacia atrás desde hoy (si hoy no hay actividad, cuenta desde ayer — no se rompe hasta terminar el día). `streak.extended` = esta completación es la primera del día. El "día" se deriva SIEMPRE del reloj de Node (`toDayString`), nunca de `CURDATE()` de la BD.
3. **Repaso**: un ejercicio queda **pendiente** si tiene un intento incorrecto sin acierto posterior con context='review' (comparación por id de intento). Fallar en lección encola; acertar EN LECCIÓN no desencola (refuerzo tipo Duolingo); acertar en repaso desencola y da **+5 XP una sola vez** (`reviewCleared:true`); fallar en repaso mantiene; re-fallar tras limpiar re-encola.
4. **Desbloqueo**: `bd2` exige `bd1` al 100%. Se aplica en el SERVIDOR (403) en courses/:id, lessons/:id y answer — no solo en la UI.
5. **"Continuar donde quedaste"**: curso con actividad más reciente aún incompleto; si no hay, primer curso desbloqueado incompleto por orden; la lección es la primera no completada.
6. Rehacer una lección completada: permitido, sin XP nuevo; al terminar vuelve al temario (sin celebración ni crash).

### Tipos de ejercicio (contratos exactos)

| type | payload (cliente) | answer (servidor) | response del cliente |
|---|---|---|---|
| `choice` | `{options:[4]}` | `{index}` | `{index}` |
| `blanks` | `{code:[líneas HTML con marcadores literales <b0>,<b1>…], bank:[fichas únicas, con ≥2 distractores]}` | `{blanks:[por hueco]}` (≥2 huecos, sin fichas repetidas) | `{blanks:[strings]}` |
| `order` | `{lines:[{id,html}] MEZCLADAS (nunca en orden correcto; permutación distinta por ejercicio)}` | `{order:[ids]}` | `{order:[ids]}` |
| `match` | `{left:[4], right:[4] mezclado (sin pares identidad)}` | `{pairs:[[l,r]×4]}` | `{pairs}` |

Validación en `services/exercises.js` (`validateResponse` → `{valid, correct}`; `valid:false` ⇒ 400).

---

## 8. Frontend — patrones obligatorios

- **Sin build**: JSX transpilado por Babel standalone en el navegador. **Prohibido**: `import`/`export` en archivos de `web/`, el shorthand `<>` (usar `React.Fragment` explícito). Los componentes se comparten vía `Object.assign(window, {...})` y el **orden de los `<script>` en index.html es la resolución de dependencias** — respetarlo.
- Componentes del design system: `const KIT = window.CodingDesignSystem_2ecb3a` (GlassPanel, Card, Button, IconButton, Input, Select, Checkbox, Radio, Switch, Badge, Tag, Progress, Toast, Tooltip, Tabs, Dialog). OJO: `tint` de GlassPanel/Card y `tone` de Progress NO aceptan "amber" (mapear amber→none/blue); GlassPanel NO reenvía `className` (animar un div interno); GlassPanel envuelve children en un div interno (un `display:flex` en su style NO alcanza a los hijos — usar wrapper propio).
- **Regla de oro del DS**: `backdrop-filter` (blur) JAMÁS en un elemento que contenga texto — va en una capa `<span aria-hidden>` absoluta con zIndex -1 (así lo hace FeedbackBand).
- **Higiene establecida**: todo `setTimeout`/`requestAnimationFrame` de una pantalla se guarda en ref y se limpia en un `useEffect` de desmontaje (patrón en LessonScreen/ReviewScreen/CelebrationScreen); `key={ex.id}` en `ExerciseBody` para resetear estado interno entre ejercicios; estilos de borde solo con longhands si algún lado varía (evita warning de React).
- `window.FX`: `FX.sound.play("correct"|"wrong"|"complete"|"perfect"|"streak")` (respeta `FX.sound.enabled`), `FX.burst(x,y)`, `FX.countUp(el,from,to,ms)`. Todo respeta `prefers-reduced-motion` (media query en motion.css + `FX.reducedMotion` en JS).
- Renderers de ejercicios en `screens/exercises.jsx`: `ExerciseBody({exercise, value, onChange, locked})` + `responseComplete(exercise, value)` — compartidos por LessonScreen y ReviewScreen. Interacción tap: blanks (ficha→siguiente hueco; tocar ficha puesta la devuelve), order (tocar añade a la secuencia numerada; tocar en secuencia devuelve), match (izquierda→derecha propone par con conector NEUTRO — nunca revelar corrección antes de Comprobar).

---

## 9. Entorno local y comandos (Windows del usuario)

- **BD**: lo que corre en `localhost:3306` es **MariaDB 12.0.2** (servicio de Windows), no MySQL — compatible con mysql2. Credenciales reales en `app/.env` (git-ignorado; usuario root). **Nunca adivinar contraseñas: si `.env` falta o falla la conexión, pedirlas al usuario.** BD dev `coding` (se crea+siembra sola al arrancar); BD de tests `coding_test` (se crea/trunca sola).
- **Comandos** (desde `app/`): `npm start` (puerto 3000; crea BD/schema/seed si falta), `npm test` (**57/57** deben pasar; node:test + supertest, `--test-concurrency=1`), `npm run seed` (refresca contenido por upsert de ids estables SIN tocar usuarios/progreso).
- El dev server **suele quedar corriendo** entre sesiones en :3000 (EADDRINUSE ⇒ reusarlo para frontend; para cambios de backend hay que MATAR ese proceso y arrancar de nuevo — los estáticos se sirven frescos del disco, las rutas no). `.claude/launch.json` define el lanzador ("dev").
- Frontend con CDN (React/Babel de unpkg con SRI): requiere internet la primera carga. Vendorizarlos es un follow-up aceptado pendiente.
- Cuenta de pruebas que suele existir en la BD dev: `juan@test.dev` / `secreto1`.
- Gotchas del tooling de navegador (pane de Claude): la pestaña queda en background ⇒ `requestAnimationFrame` suspendido (countUp/anillo parecen congelados — verificar datos por API y avisar que un humano lo mire en foreground); screenshots pueden hacer timeout (usar read_page/get_page_text/javascript_tool); el `toLocaleString("es")` puede no mostrar separador de miles por ICU reducido del navegador embebido (no es bug de la app).

---

## 10. Flujo de trabajo del proyecto (cómo se construye)

El proyecto usa el flujo **superpowers** de principio a fin. Para cualquier trabajo nuevo no trivial:

1. `superpowers:brainstorming` — preguntas al usuario una a la vez → diseño por secciones → aprobación.
2. Spec en `docs/superpowers/specs/YYYY-MM-DD-<tema>-design.md` (self-review + revisión del usuario) y commit.
3. `superpowers:writing-plans` — plan TDD paso a paso con código completo en `docs/superpowers/plans/`.
4. `superpowers:subagent-driven-development` — rama feature, un subagente implementador por tarea (modelo barato si el plan trae el código; sonnet para integración/contenido/browser) + revisor por tarea + fixes con re-review; ledger en `.superpowers/sdd/progress.md`.
5. Review final de toda la rama (modelo más capaz, con smoke test en vivo) → fixes → `superpowers:finishing-a-development-branch` (tests → merge a master → borrar rama).

Convenciones: commits en español estilo `feat:/fix:/docs:/chore:/refactor:`; TDD estricto en backend (RED→GREEN); frontend se verifica con checklist E2E en navegador; los mensajes de error y todo el copy en **español con tuteo** ("Continúa donde quedaste"), sentence case, **sin emoji**, metadatos con "·". Colores por materia: Programación=blue, Bases de datos=cyan, Algoritmos=violet, Web=amber.

Contenido didáctico: técnicamente correcto SIEMPRE (los reviewers verifican el SQL/Java/JS enseñado); código en su sintaxis original; spans de color en código solo dentro de template literals con las constantes K(violet)/S(cyan)/N(amber)/C(text-tertiary); jamás `${}` dentro de strings con comillas dobles en seed-data.

---

## 11. Pendientes y follow-ups aceptados (no bloqueantes)

- **Sub-proyecto 2 "El meta-juego"** (alcance ya acordado — ver §2). Es lo siguiente grande.
- Verificación humana pendiente: mirar el countUp de XP y el anillo de la celebración en un navegador en primer plano (el tooling no puede ver rAF).
- Vendorizar React/ReactDOM/Babel a `app/web/vendor/` para funcionar offline.
- Hacer atómico el +5 de repaso (check+insert+XP en transacción) — teórico en app local.
- El +50/+10 y el flujo general ya son transaccionales y tolerantes a duplicados.
- Menores aceptados con razón documentada en `.superpowers/sdd/progress.md` (ledger) — consultarlo antes de "redescubrir" issues.
- El repo NO tiene remoto configurado (existe `github.com/Jsua3/Coding` vacío); push/PR pendiente de que el usuario lo pida.
- Fuera de alcance decidido: ejecución de código libre, drag & drop, vidas, leaderboard, recuperación de contraseña, migración a Vite (el backend en capas lo permite después).

---

## 12. Resumen en una frase

Coding es un Duolingo de Ingeniería de Software, local y en español, con estética Liquid Glass: Express+MariaDB con toda la lógica derivada y validación server-side, frontend React sin build con motion/orbe/sonido, 128 ejercicios interactivos de 4 tipos, celebraciones, rachas y repaso de errores — construido y revisado tarea a tarea con el flujo superpowers, con "El meta-juego" como siguiente iteración acordada.
