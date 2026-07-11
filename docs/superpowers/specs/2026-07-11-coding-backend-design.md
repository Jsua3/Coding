# Coding — Backend y lógica del programa — Diseño

**Fecha:** 2026-07-11
**Estado:** aprobado por el usuario (pendiente revisión final del documento)

## 1. Resumen

Construir el backend y la lógica de la app de aprendizaje **Coding** (materias de Ingeniería de Software) a partir del design system existente en `Coding Design System/`, y conectar el UI kit (`ui_kits/coding-app/`) para que funcione con datos reales. Resultado: app completa funcionando con login real, catálogo de materias, lecciones con quiz, XP y racha.

### Decisiones tomadas con el usuario

| Decisión | Elección |
|---|---|
| Stack backend | Node.js + Express |
| Base de datos | **MySQL** (driver `mysql2/promise`, pool de conexiones) |
| Alcance | Backend + conectar el frontend del UI kit |
| Autenticación | Registro + login reales: bcrypt + JWT; "Recordarme" alarga la sesión |
| Contenido | Las 6 materias con lecciones y quizzes completos |
| Arquitectura | Enfoque A: servidor único; Express sirve la API en `/api/*` y el frontend estático; el frontend mantiene su formato sin build (React CDN + Babel standalone + bundle del design system) |

## 2. Estructura del proyecto

`Coding Design System/` queda **intacta** (fuente de verdad visual). Express la sirve como estáticos bajo `/ds` para que el frontend cargue `styles.css` y `_ds_bundle.js` sin duplicarlos.

```
coding/
├── Coding Design System/          (no se modifica)
├── docs/superpowers/specs/        (este documento)
└── app/
    ├── package.json
    ├── .env                       (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, PORT)
    ├── .env.example
    ├── server/
    │   ├── index.js               — arranque: Express, estáticos (/ds y web/), montaje de rutas, manejo de errores
    │   ├── db.js                  — pool mysql2; crea la BD si no existe, aplica schema.sql, corre seed si está vacía
    │   ├── schema.sql             — DDL MySQL (InnoDB, utf8mb4)
    │   ├── seed.js                — contenido de las 6 materias
    │   ├── auth.js                — rutas /api/auth/* + middleware requireAuth (JWT)
    │   ├── routes/
    │   │   ├── me.js              — GET /api/me
    │   │   ├── courses.js         — GET /api/courses, GET /api/courses/:id
    │   │   └── lessons.js         — GET /api/lessons/:id, POST /api/lessons/:id/answer
    │   ├── services/
    │   │   ├── progress.js        — progreso, estados, desbloqueo, lección actual
    │   │   └── gamification.js    — XP (total y semanal) y racha (actual y mejor)
    │   └── lib/
    │       └── validate.js        — validación de inputs con mensajes en español
    ├── web/
    │   ├── index.html             — carga /ds/styles.css, React CDN, Babel, /ds/_ds_bundle.js y las pantallas
    │   ├── api.js                 — cliente fetch: token en localStorage, manejo de 401
    │   ├── app.jsx                — mini-router por estado: login → dashboard → curso/:id → lección/:id
    │   └── screens/
    │       ├── AppShell.jsx       — NavBar e iconos (adaptado del UI kit)
    │       ├── LoginScreen.jsx    — login + registro reales
    │       ├── DashboardScreen.jsx
    │       ├── CourseScreen.jsx
    │       └── LessonScreen.jsx
    └── test/
        ├── gamification.test.js
        ├── progress.test.js
        └── api.test.js
```

## 3. Modelo de datos (MySQL)

Motor InnoDB, charset `utf8mb4`. El servidor crea la base `coding` si no existe; los tests usan `coding_test`.

- **users** — `id INT AUTO_INCREMENT PK`, `name VARCHAR(80)`, `email VARCHAR(120) UNIQUE`, `password_hash VARCHAR(100)`, `created_at DATETIME`.
- **courses** — `id VARCHAR(20) PK` (`bd1`, `bd2`, `prog1`, `prog2`, `algo`, `web`), `subject VARCHAR(60)`, `subject_tone ENUM('blue','cyan','violet','amber')`, `title VARCHAR(120)`, `description TEXT`, `order_index INT`, `prereq_course_id VARCHAR(20) NULL FK→courses.id` (solo `bd2` → `bd1`).
- **units** — `id VARCHAR(30) PK`, `course_id FK`, `name VARCHAR(120)`, `order_index INT`.
- **lessons** — `id VARCHAR(30) PK`, `unit_id FK`, `title VARCHAR(120)`, `mins INT`, `order_index INT`, `content JSON` — lista de bloques: `{type:'p', html}`, `{type:'code', lines:[...]}` (líneas con spans de color como el CodeBlock actual), `{type:'note', text}`.
- **quiz_questions** — `id INT AUTO_INCREMENT PK`, `lesson_id FK UNIQUE` (una pregunta por lección), `question TEXT`, `options JSON` (array de 4 strings), `correct_index TINYINT`, `explain_ok TEXT`, `explain_bad TEXT`.
- **lesson_completions** — `user_id FK`, `lesson_id FK`, `completed_at DATETIME`, `PRIMARY KEY (user_id, lesson_id)`.
- **xp_events** — `id INT AUTO_INCREMENT PK`, `user_id FK`, `lesson_id FK NULL`, `amount INT`, `created_at DATETIME`.

**Derivado, nunca almacenado:** progreso por curso, estado del curso, XP total/semanal, racha actual/mejor, horas por curso (suma de `mins`), lección "actual". Evita datos desincronizados.

## 4. API

Todo bajo `/api`, JSON. Rutas protegidas con `Authorization: Bearer <token>` salvo `/auth/*`.

### Auth

- `POST /api/auth/register` — body `{name, email, password}`. Valida: nombre no vacío, email con formato, contraseña ≥ 6 caracteres. `201 {token, user:{id,name,email,initials}}`. Email duplicado → `409 {error:"Este correo ya está registrado"}`.
- `POST /api/auth/login` — body `{email, password, remember}`. Token JWT con expiración **1 día**, o **30 días** si `remember`. Credenciales malas → `401 {error:"Correo o contraseña incorrectos"}`.

### Datos

- `GET /api/me` → `{user:{id,name,email,initials}, stats:{xp, xpWeek, streak, bestStreak, activeCourses, completedCourses, lockedCourses}, continue:{courseId, lessonId, lessonTitle} | null}`.
- `GET /api/courses` → array con `{id, subject, subjectTone, title, description, lessons, hours, progress, status}` calculados por usuario. `status ∈ NUEVO | EN CURSO | COMPLETADO | BLOQUEADO`.
- `GET /api/courses/:id` → detalle: curso + `units:[{id, name, lessons:[{id, title, mins, done, current}]}]` + `progress`. Si el curso está BLOQUEADO → `403 {error:"Completa <prerequisito> para desbloquear esta materia"}`.
- `GET /api/lessons/:id` → `{id, title, unitName, courseId, courseSubject, position:{index,total}, courseProgress, content:[bloques], quiz:{question, options}}`. **Sin `correct_index`.** Lección de curso bloqueado → `403`.
- `POST /api/lessons/:id/answer` — body `{answerIndex}` → `{correct, explanation, xpAwarded, alreadyCompleted, courseProgress, nextLessonId | null}`. Si es correcta y es la primera vez: inserta `lesson_completions` + `xp_events(+50)`.

## 5. Reglas de negocio

1. **Completar lección:** responder bien el quiz completa la lección. **+50 XP solo la primera vez**; reintentos ilimitados sin XP duplicado (`alreadyCompleted: true`).
2. **Progreso de curso:** `completadas / total_lecciones`, redondeado. Estados: 0% → NUEVO; >0% → EN CURSO; 100% → COMPLETADO; prerequisito incompleto → BLOQUEADO (prevalece sobre los demás).
3. **Desbloqueo:** `bd2` requiere `bd1` al 100%. El backend rechaza con `403` el acceso a cursos/lecciones bloqueados (no solo lo oculta la UI).
4. **Racha:** días-calendario consecutivos con ≥1 lección completada, contando hacia atrás desde hoy; si hoy no hay actividad, la cuenta empieza en ayer (la racha no se rompe hasta terminar el día). Mejor racha = máxima secuencia histórica.
5. **XP semanal:** suma de `xp_events` de los últimos 7 días.
6. **"Continuar donde quedaste":** curso con `completed_at` más reciente; si no hay actividad, el primer curso desbloqueado con progreso < 100%. La lección a continuar es la primera no completada en orden (`current` en la UI).
7. **Seguridad del quiz:** `correct_index` solo existe en el servidor; la validación es server-side.

## 6. Contenido (seed)

Las 6 materias con el catálogo de `data.js` como base, expandido:

| Curso | Materia | Tono | Unidades × lecciones | Total |
|---|---|---|---|---|
| `prog1` | Programación I | blue | 3 × 4 (fundamentos, control de flujo, funciones) | 12 |
| `prog2` | Programación II | blue | 3 × 3 (POO, herencia y polimorfismo, colecciones) — Java | 9 |
| `bd1` | Bases de datos I | cyan | 2 unidades del data.js (7 lecciones) + 1 unidad de 3 (agregación, GROUP BY) | 10 |
| `bd2` | Bases de datos II | cyan | 3 × 3 (transacciones, triggers, índices) — prerequisito `bd1` | 9 |
| `algo` | Algoritmos | violet | 3 × 4 (recursión, complejidad, ordenamiento y búsqueda) | 12 |
| `web` | Desarrollo web | amber | 3 × 4 (HTML, CSS, JavaScript) | 12 |

Los conteos de lecciones y horas que muestra la UI se derivan del contenido realmente sembrado (no de los números fijos del `data.js` original).

Cada lección: 2–4 bloques de contenido (párrafo con `<code>` inline, bloque de código coloreado, nota) + 1 pregunta de quiz con 4 opciones y explicaciones. El quiz de SELECT/WHERE del `data.js` se conserva en la lección `l5`. Los fragmentos de código van en su sintaxis original (SQL, Java, JS); textos en español con tuteo, siguiendo los CONTENT FUNDAMENTALS del design system.

El seed corre automáticamente si las tablas están vacías; `npm run seed -- --reset` fuerza recarga de contenido sin borrar usuarios ni progreso (los cursos/lecciones se reinsertan por id estable).

## 7. Frontend (adaptación del UI kit)

Formato actual intacto: React 18 por CDN, Babel standalone, componentes de `window.CodingDesignSystem_2ecb3a`, estilos de `/ds/styles.css`.

- **`api.js`** — wrapper de `fetch`: agrega `Authorization`, token en `localStorage` (`coding-token`), parsea `{error}` del servidor; ante `401` limpia sesión y devuelve al login.
- **`app.jsx`** — router por estado: `{screen, courseId, lessonId}`; al cargar, si hay token válido (`GET /api/me` responde) entra directo al dashboard.
- **Login** — alterna entre "Entrar" y "Crea tu cuenta" (aparece campo nombre); botón con estado de carga; errores del servidor mostrados con `error` del Input o texto bajo el formulario; checkbox "Recordarme" → `remember`.
- **Dashboard** — datos de `/api/me` + `/api/courses`: saludo con nombre real, stats reales (racha con mejor racha, XP con XP semanal, materias activas con desglose), grid de tarjetas con progreso/estado del servidor; "Continuar lección" usa `continue` de `/api/me`. Tarjetas BLOQUEADO sin click (como hoy).
- **Curso** — recibe `courseId`; breadcrumb, héroe (título, descripción, anillo de progreso) y unidades/lecciones desde `/api/courses/:id`; `SIGUIENTE` en la lección `current`; click en lección → pantalla de lección.
- **Lección** — pinta `content` por tipo de bloque (p / code / note) reutilizando el CodeBlock; barra superior con `position` y `courseProgress` reales; quiz envía a `/api/lessons/:id/answer`; el Dialog muestra `explanation` y XP del servidor; en correcto, "Continuar" navega a `nextLessonId` (o vuelve al curso si era la última) y muestra el Toast "+50 XP"; en incorrecto, "Intentar de nuevo" / "Revisar lección" como hoy.
- **Estados de carga/error** — spinner simple de vidrio mientras llegan datos; si la API falla, mensaje con botón reintentar.

## 8. Manejo de errores y seguridad

- Middleware central de errores: `400` validación (mensajes en español), `401` sin token/expirado, `403` recurso bloqueado, `404` inexistente, `409` conflicto (email), `500` genérico sin detalles internos (stack solo al log del servidor).
- bcrypt (cost 10) para contraseñas; `JWT_SECRET` obligatorio en `.env` (el servidor no arranca sin él fuera de dev).
- Nunca salen en respuestas: `password_hash`, `correct_index`.
- Si MySQL no responde al arrancar: mensaje claro con las variables esperadas y salida con código ≠ 0.
- CORS no necesario (mismo origen). Rate limiting: fuera de alcance (proyecto local).

## 9. Testing

`node:test` + `supertest`, base `coding_test` creada/limpiada por los propios tests (`beforeEach` trunca tablas).

- **Unit — gamification:** racha con días consecutivos; hueco rompe la racha; hoy sin actividad no la rompe; mejor racha histórica; XP semanal solo cuenta 7 días.
- **Unit — progress:** estados NUEVO/EN CURSO/COMPLETADO; BLOQUEADO por prerequisito y su prevalencia; lección `current`.
- **Integración — API:** registro y login felices y con errores (email duplicado, contraseña corta, credenciales malas); `GET /courses` refleja progreso; respuesta correcta otorga XP una sola vez; respuesta incorrecta no completa; curso bloqueado responde `403`; rutas protegidas sin token responden `401`.

## 10. Ejecución

```bash
cd app
npm install
cp .env.example .env   # ajustar credenciales de MySQL
npm start              # crea BD + schema + seed si hace falta, sirve en http://localhost:3000
npm test
```

Requisito: servidor MySQL local corriendo (MySQL Server, XAMPP o WAMP).

## 11. Fuera de alcance

- Migración del frontend a Vite/build moderno (la estructura en capas del backend lo permite después).
- Recuperación de contraseña (el enlace queda decorativo), verificación de email, roles/admin.
- Editor de contenido (el contenido se gestiona por seed).
- Tabs de navegación "Explorar" y "Perfil" del NavBar: quedan como hoy (visuales, sin pantalla propia).
- Despliegue/producción (HTTPS, rate limiting, backups).
