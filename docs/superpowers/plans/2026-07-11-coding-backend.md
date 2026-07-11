# Coding — Backend + lógica + frontend conectado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend Node.js + Express + MySQL para la app de aprendizaje Coding (auth JWT, catálogo de materias, lecciones con quiz validado en servidor, XP y racha) con el UI kit del design system conectado a la API.

**Architecture:** Servidor Express único que expone la API en `/api/*`, sirve el design system en `/ds` y el frontend estático (React CDN + Babel standalone, sin build) desde `app/web/`. MySQL vía `mysql2/promise`; todo lo derivable (progreso, estados, XP, racha) se calcula, nunca se almacena. Spec: `docs/superpowers/specs/2026-07-11-coding-backend-design.md`.

**Tech Stack:** Node.js ≥ 20 (ESM, `node:test`), Express 4, mysql2, bcryptjs, jsonwebtoken, dotenv, supertest (dev). Frontend: React 18 UMD + Babel standalone + `window.CodingDesignSystem_2ecb3a`.

## Global Constraints

- Node ≥ 20; `app/package.json` con `"type": "module"` (ESM en todo el server).
- Dependencias exactas: `express`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `dotenv`; dev: `supertest`. Ninguna más.
- MySQL local. BD de desarrollo `coding`, BD de tests `coding_test` (los tests la crean solos). **Si la conexión falla por credenciales, DETENTE y pide al usuario su usuario/contraseña de MySQL para `app/.env` — no adivines.**
- La carpeta `Coding Design System/` **jamás se modifica**; se sirve como estáticos en `/ds`.
- `correct_index` y `password_hash` no aparecen NUNCA en una respuesta de la API.
- Mensajes de error al usuario en español con tuteo; fragmentos de código (SQL/Java/JS) en su sintaxis original.
- XP: +50 por lección, solo la primera vez que se aprueba su quiz.
- Estados de curso: `NUEVO` (0%), `EN CURSO` (>0%), `COMPLETADO` (100%), `BLOQUEADO` (prerequisito < 100%, prevalece). Único prerequisito: `bd2` → `bd1`.
- Tests con `node --test --test-concurrency=1` (los tests de BD comparten `coding_test`).
- Commit al final de cada tarea. Trabaja desde `D:\Sua_Files\IdeaProjects\coding`; los comandos npm se ejecutan dentro de `app/`.

---

### Task 1: Scaffolding del servidor Express

**Files:**
- Create: `app/package.json`
- Create: `app/.env.example`
- Create: `app/server/index.js`
- Test: `app/test/app.test.js`

**Interfaces:**
- Produces: `createApp()` exportada desde `app/server/index.js` — devuelve una app Express con `GET /api/health`, 404 JSON para `/api/*` desconocido, estáticos `/ds` → `Coding Design System/` y `/` → `app/web/`, y middleware central de errores (respeta `err.status`/`err.message`, 500 genérico si no).

- [ ] **Step 1: Crear `app/package.json`**

```json
{
  "name": "coding-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server/index.js",
    "seed": "node server/seed.js",
    "test": "node --test --test-concurrency=1 test/"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.11.0"
  },
  "devDependencies": {
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 2: Crear `app/.env.example`**

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=coding
JWT_SECRET=cambia-este-secreto-en-tu-env
```

- [ ] **Step 3: Instalar dependencias**

Run (en `app/`): `npm install`
Expected: instala sin errores, crea `app/node_modules` y `app/package-lock.json`.

- [ ] **Step 4: Escribir el test que falla** — `app/test/app.test.js`

```js
import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../server/index.js";

test("GET /api/health responde ok", async () => {
  const res = await request(createApp()).get("/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true });
});

test("ruta /api desconocida responde 404 JSON", async () => {
  const res = await request(createApp()).get("/api/nope");
  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Recurso no encontrado");
});
```

- [ ] **Step 5: Verificar que falla**

Run (en `app/`): `npm test`
Expected: FAIL — `Cannot find module '../server/index.js'`.

- [ ] **Step 6: Implementar `app/server/index.js`**

```js
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));
  // (las rutas de la API se montan aquí en tareas posteriores)

  app.use("/api", (req, res) => res.status(404).json({ error: "Recurso no encontrado" }));
  app.use("/ds", express.static(path.join(__dirname, "..", "..", "Coding Design System")));
  app.use(express.static(path.join(__dirname, "..", "web")));

  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inválido" });
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  });
  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => console.log(`Coding en http://localhost:${port}`));
}
```

- [ ] **Step 7: Verificar que pasa**

Run (en `app/`): `npm test`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
git add app/package.json app/package-lock.json app/.env.example app/server/index.js app/test/app.test.js
git commit -m "feat: scaffolding del servidor Express con health y manejo de errores"
```

---

### Task 2: Capa MySQL (schema + conexión)

**Files:**
- Create: `app/server/schema.sql`
- Create: `app/server/db.js`
- Create: `app/test/helpers.js`
- Test: `app/test/db.test.js`
- Modify: `app/server/index.js` (arranque con initDb)

**Interfaces:**
- Produces: desde `app/server/db.js` — `dbName()`, `getPool()`, `query(sql, params) → rows`, `initDb({ seed = true } = {})` (crea la BD si falta, aplica schema, siembra si `courses` está vacía y `seed` es true), `closeDb()`. La config sale de `process.env` **en el momento de la llamada** (lazy), para que los tests puedan fijar `DB_NAME=coding_test` antes.
- Produces: desde `app/test/helpers.js` — `setupTestDb()`, `resetUserData()` (trunca `xp_events`, `lesson_completions`, `users`), re-exporta `query`, `closeDb`.

- [ ] **Step 1: Crear `app/server/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(20) PRIMARY KEY,
  subject VARCHAR(60) NOT NULL,
  subject_tone ENUM('blue','cyan','violet','amber') NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  order_index INT NOT NULL,
  prereq_course_id VARCHAR(20) NULL,
  CONSTRAINT fk_courses_prereq FOREIGN KEY (prereq_course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS units (
  id VARCHAR(30) PRIMARY KEY,
  course_id VARCHAR(20) NOT NULL,
  name VARCHAR(120) NOT NULL,
  order_index INT NOT NULL,
  CONSTRAINT fk_units_course FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(30) PRIMARY KEY,
  unit_id VARCHAR(30) NOT NULL,
  title VARCHAR(120) NOT NULL,
  mins INT NOT NULL,
  order_index INT NOT NULL,
  content JSON NOT NULL,
  CONSTRAINT fk_lessons_unit FOREIGN KEY (unit_id) REFERENCES units(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id VARCHAR(30) NOT NULL UNIQUE,
  question TEXT NOT NULL,
  options JSON NOT NULL,
  correct_index TINYINT NOT NULL,
  explain_ok TEXT NOT NULL,
  explain_bad TEXT NOT NULL,
  CONSTRAINT fk_quiz_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lesson_completions (
  user_id INT NOT NULL,
  lesson_id VARCHAR(30) NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id),
  CONSTRAINT fk_lc_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_lc_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS xp_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id VARCHAR(30) NULL,
  amount INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_xp_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_xp_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 2: Escribir el test que falla** — `app/test/db.test.js`

```js
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, query, closeDb } from "./helpers.js";

test("initDb crea las 7 tablas", async () => {
  await setupTestDb();
  const rows = await query("SHOW TABLES");
  const names = rows.map((r) => Object.values(r)[0]);
  for (const t of ["users", "courses", "units", "lessons", "quiz_questions", "lesson_completions", "xp_events"]) {
    assert.ok(names.includes(t), `falta la tabla ${t}`);
  }
});

test("initDb es idempotente", async () => {
  await setupTestDb();
  await setupTestDb();
});

after(closeDb);
```

Y `app/test/helpers.js`:

```js
import "dotenv/config";
process.env.DB_NAME = "coding_test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto-de-test";

import { initDb, query, closeDb } from "../server/db.js";

export async function setupTestDb() {
  await initDb({ seed: false });
}

export async function resetUserData() {
  await query("SET FOREIGN_KEY_CHECKS = 0");
  await query("TRUNCATE TABLE xp_events");
  await query("TRUNCATE TABLE lesson_completions");
  await query("TRUNCATE TABLE users");
  await query("SET FOREIGN_KEY_CHECKS = 1");
}

export { query, closeDb };
```

- [ ] **Step 3: Verificar que falla**

Run (en `app/`): `npm test`
Expected: FAIL — `Cannot find module '../server/db.js'`.

- [ ] **Step 4: Implementar `app/server/db.js`**

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let pool = null;

function dbConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  };
}

export function dbName() {
  return process.env.DB_NAME || "coding";
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({ ...dbConfig(), database: dbName(), connectionLimit: 10 });
  }
  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

export async function initDb({ seed = true } = {}) {
  const conn = await mysql.createConnection(dbConfig());
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName()}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
    await getPool().query(stmt);
  }
  if (seed) {
    const rows = await query("SELECT COUNT(*) AS n FROM courses");
    if (rows[0].n === 0) {
      const { runSeed } = await import("./seed.js");
      await runSeed();
    }
  }
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
```

Nota: `seed.js` aún no existe; el import es dinámico y solo se ejecuta con `seed: true` y la tabla vacía, así que los tests (que usan `seed: false`) no lo tocan.

- [ ] **Step 5: Verificar que pasa**

Run (en `app/`): `npm test`
Expected: PASS. Si falla con `ER_ACCESS_DENIED_ERROR` o `ECONNREFUSED`: MySQL no está corriendo o las credenciales por defecto (root sin contraseña) no aplican — **pide al usuario sus credenciales**, créale `app/.env` a partir de `.env.example` y reintenta.

- [ ] **Step 6: Conectar arranque del server** — en `app/server/index.js`, añadir el import y reemplazar el bloque de arranque:

```js
import { initDb } from "./db.js";
```

```js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.env.JWT_SECRET) {
    console.error("Falta JWT_SECRET en app/.env (copia .env.example)");
    process.exit(1);
  }
  try {
    await initDb();
  } catch (e) {
    console.error("No se pudo conectar a MySQL. Revisa DB_HOST, DB_PORT, DB_USER y DB_PASSWORD en app/.env");
    console.error(e.message);
    process.exit(1);
  }
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => console.log(`Coding en http://localhost:${port}`));
}
```

- [ ] **Step 7: Correr todos los tests**

Run (en `app/`): `npm test`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add app/server/schema.sql app/server/db.js app/server/index.js app/test/db.test.js app/test/helpers.js
git commit -m "feat: capa MySQL con schema, pool lazy e initDb idempotente"
```

---

### Task 3: Gamificación pura (racha y XP semanal)

**Files:**
- Create: `app/server/services/gamification.js`
- Test: `app/test/gamification.test.js`

**Interfaces:**
- Produces: `toDayString(date) → "YYYY-MM-DD"` (zona local), `currentStreak(days, today) → number` (days: array de "YYYY-MM-DD"; si hoy no tiene actividad cuenta desde ayer), `bestStreak(days) → number`, `weeklyXp(events, now = new Date()) → number` (events: `[{amount, created_at}]`, ventana de 7 días).

- [ ] **Step 1: Escribir los tests que fallan** — `app/test/gamification.test.js`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { currentStreak, bestStreak, weeklyXp, toDayString } from "../server/services/gamification.js";

test("racha con días consecutivos hasta hoy", () => {
  assert.equal(currentStreak(["2026-07-09", "2026-07-10", "2026-07-11"], "2026-07-11"), 3);
});

test("hoy sin actividad no rompe la racha (cuenta desde ayer)", () => {
  assert.equal(currentStreak(["2026-07-09", "2026-07-10"], "2026-07-11"), 2);
});

test("un hueco rompe la racha", () => {
  assert.equal(currentStreak(["2026-07-08", "2026-07-10", "2026-07-11"], "2026-07-11"), 2);
});

test("sin actividad reciente la racha es 0", () => {
  assert.equal(currentStreak(["2026-07-01"], "2026-07-11"), 0);
  assert.equal(currentStreak([], "2026-07-11"), 0);
});

test("la racha cruza el cambio de mes", () => {
  assert.equal(currentStreak(["2026-06-30", "2026-07-01"], "2026-07-01"), 2);
});

test("mejor racha histórica", () => {
  assert.equal(bestStreak(["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-08", "2026-07-09"]), 3);
  assert.equal(bestStreak([]), 0);
});

test("días duplicados cuentan una vez", () => {
  assert.equal(currentStreak(["2026-07-11", "2026-07-11", "2026-07-10"], "2026-07-11"), 2);
});

test("XP semanal solo cuenta los últimos 7 días", () => {
  const now = new Date("2026-07-11T12:00:00");
  const events = [
    { amount: 50, created_at: new Date("2026-07-10T10:00:00") },
    { amount: 50, created_at: new Date("2026-07-05T10:00:00") },
    { amount: 50, created_at: new Date("2026-07-01T10:00:00") },
  ];
  assert.equal(weeklyXp(events, now), 100);
});

test("toDayString formatea en zona local", () => {
  assert.equal(toDayString(new Date(2026, 6, 11, 23, 59)), "2026-07-11");
});
```

- [ ] **Step 2: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — `Cannot find module '../server/services/gamification.js'`.

- [ ] **Step 3: Implementar `app/server/services/gamification.js`**

```js
const DAY_MS = 24 * 60 * 60 * 1000;

export function toDayString(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function previousDay(dayStr) {
  const [y, m, d] = dayStr.split("-").map(Number);
  return toDayString(new Date(y, m - 1, d - 1));
}

export function currentStreak(days, today) {
  const set = new Set(days);
  let cursor = set.has(today) ? today : previousDay(today);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = previousDay(cursor);
  }
  return streak;
}

export function bestStreak(days) {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of sorted) {
    run = prev !== null && previousDay(day) === prev ? run + 1 : 1;
    if (run > best) best = run;
    prev = day;
  }
  return best;
}

export function weeklyXp(events, now = new Date()) {
  const cutoff = now.getTime() - 7 * DAY_MS;
  return events
    .filter((e) => new Date(e.created_at).getTime() >= cutoff)
    .reduce((sum, e) => sum + e.amount, 0);
}
```

- [ ] **Step 4: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/server/services/gamification.js app/test/gamification.test.js
git commit -m "feat: racha y XP semanal como funciones puras"
```

---

### Task 4: Progreso puro (porcentaje y estado)

**Files:**
- Create: `app/server/services/progress.js`
- Test: `app/test/progress.test.js`

**Interfaces:**
- Produces: `progressPercent(completed, total) → 0..100` (redondeado; 0 si total es 0) y `courseStatus({ progress, prereqProgress = null }) → "NUEVO" | "EN CURSO" | "COMPLETADO" | "BLOQUEADO"`. (Las funciones con BD se añaden a este mismo archivo en la Task 8.)

- [ ] **Step 1: Escribir los tests que fallan** — `app/test/progress.test.js`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { progressPercent, courseStatus } from "../server/services/progress.js";

test("porcentaje de progreso redondeado", () => {
  assert.equal(progressPercent(0, 10), 0);
  assert.equal(progressPercent(1, 10), 10);
  assert.equal(progressPercent(2, 3), 67);
  assert.equal(progressPercent(10, 10), 100);
  assert.equal(progressPercent(0, 0), 0);
});

test("estados por progreso", () => {
  assert.equal(courseStatus({ progress: 0 }), "NUEVO");
  assert.equal(courseStatus({ progress: 45 }), "EN CURSO");
  assert.equal(courseStatus({ progress: 100 }), "COMPLETADO");
});

test("BLOQUEADO prevalece cuando el prerequisito no está al 100", () => {
  assert.equal(courseStatus({ progress: 0, prereqProgress: 60 }), "BLOQUEADO");
  assert.equal(courseStatus({ progress: 50, prereqProgress: 0 }), "BLOQUEADO");
  assert.equal(courseStatus({ progress: 0, prereqProgress: 100 }), "NUEVO");
  assert.equal(courseStatus({ progress: 0, prereqProgress: null }), "NUEVO");
});
```

- [ ] **Step 2: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — módulo no encontrado.

- [ ] **Step 3: Implementar `app/server/services/progress.js`**

```js
export function progressPercent(completed, total) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

export function courseStatus({ progress, prereqProgress = null }) {
  if (prereqProgress !== null && prereqProgress < 100) return "BLOQUEADO";
  if (progress >= 100) return "COMPLETADO";
  if (progress > 0) return "EN CURSO";
  return "NUEVO";
}
```

- [ ] **Step 4: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/server/services/progress.js app/test/progress.test.js
git commit -m "feat: porcentaje y estado de curso como funciones puras"
```

---

### Task 5: Autenticación (registro, login, middleware JWT)

**Files:**
- Create: `app/server/lib/validate.js`
- Create: `app/server/auth.js`
- Modify: `app/server/index.js` (montar `/api/auth`)
- Test: `app/test/auth.test.js`

**Interfaces:**
- Consumes: `query` de `../server/db.js`; helpers de test de Task 2.
- Produces: `app/server/auth.js` exporta **default** un Router con `POST /register` y `POST /login`, y con nombre: `requireAuth(req, res, next)` (deja `req.userId`) e `initials(name) → string` (2 letras mayúsculas). `app/server/lib/validate.js` exporta `required(value)` y `validEmail(value)`.
- Contratos HTTP: register `201 {token, user:{id,name,email,initials}}`, errores `400` (nombre vacío / email inválido / contraseña < 6) y `409` email duplicado ("Este correo ya está registrado"). Login `200 {token, user}` o `401` ("Correo o contraseña incorrectos"); `remember: true` → token de 30 días, si no 1 día.

- [ ] **Step 1: Escribir los tests que fallan** — `app/test/auth.test.js`

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { setupTestDb, resetUserData, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";
import { requireAuth } from "../server/auth.js";

let app;
before(async () => {
  await setupTestDb();
  app = createApp();
});
beforeEach(resetUserData);
after(closeDb);

const good = { name: "Juan Jose Sua", email: "juan@uni.edu", password: "secreto1" };

test("registro feliz devuelve 201 con token y usuario", async () => {
  const res = await request(app).post("/api/auth/register").send(good);
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.name, "Juan Jose Sua");
  assert.equal(res.body.user.email, "juan@uni.edu");
  assert.equal(res.body.user.initials, "JJ");
  assert.ok(!("password_hash" in res.body.user));
});

test("email duplicado devuelve 409", async () => {
  await request(app).post("/api/auth/register").send(good);
  const res = await request(app).post("/api/auth/register").send(good);
  assert.equal(res.status, 409);
  assert.equal(res.body.error, "Este correo ya está registrado");
});

test("validaciones de registro devuelven 400", async () => {
  for (const body of [
    { ...good, name: "  " },
    { ...good, email: "no-es-email" },
    { ...good, password: "corta" },
  ]) {
    const res = await request(app).post("/api/auth/register").send(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.ok(res.body.error);
  }
});

test("login feliz y credenciales malas", async () => {
  await request(app).post("/api/auth/register").send(good);
  const ok = await request(app).post("/api/auth/login").send({ email: good.email, password: good.password });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  const bad = await request(app).post("/api/auth/login").send({ email: good.email, password: "incorrecta" });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.error, "Correo o contraseña incorrectos");
});

test("remember extiende el token a 30 días", async () => {
  await request(app).post("/api/auth/register").send(good);
  const short = await request(app).post("/api/auth/login").send({ email: good.email, password: good.password });
  const long = await request(app).post("/api/auth/login").send({ email: good.email, password: good.password, remember: true });
  const dShort = jwt.decode(short.body.token);
  const dLong = jwt.decode(long.body.token);
  assert.equal(dShort.exp - dShort.iat, 24 * 60 * 60);
  assert.equal(dLong.exp - dLong.iat, 30 * 24 * 60 * 60);
});

test("requireAuth rechaza sin token y acepta token válido", () => {
  let status = null;
  const res = { status(s) { status = s; return this; }, json() {} };
  requireAuth({ headers: {} }, res, () => assert.fail("no debería llamar next"));
  assert.equal(status, 401);

  const token = jwt.sign({ sub: 7 }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  let called = false;
  requireAuth(req, {}, () => { called = true; });
  assert.ok(called);
  assert.equal(req.userId, 7);
});

test("JSON malformado devuelve 400", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send("{no es json");
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "JSON inválido");
});
```

- [ ] **Step 2: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — `Cannot find module '../server/auth.js'`.

- [ ] **Step 3: Implementar `app/server/lib/validate.js`**

```js
export function required(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
```

- [ ] **Step 4: Implementar `app/server/auth.js`**

```js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "./db.js";
import { required, validEmail } from "./lib/validate.js";

const router = Router();

export function initials(name) {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, initials: initials(u.name) };
}

function signToken(user, remember) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: remember ? "30d" : "1d" });
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!required(name)) return res.status(400).json({ error: "El nombre es obligatorio" });
    if (!validEmail(email)) return res.status(400).json({ error: "El correo no tiene un formato válido" });
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }
    const clean = { name: name.trim(), email: email.toLowerCase() };
    const existing = await query("SELECT id FROM users WHERE email = ?", [clean.email]);
    if (existing.length) return res.status(409).json({ error: "Este correo ya está registrado" });
    const hash = await bcrypt.hash(password, 10);
    const result = await query("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [clean.name, clean.email, hash]);
    const user = { id: result.insertId, ...clean };
    res.status(201).json({ token: signToken(user, false), user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, remember } = req.body || {};
    const rows = await query("SELECT * FROM users WHERE email = ?", [String(email || "").toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(password || ""), user.password_hash))) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }
    res.json({ token: signToken(user, Boolean(remember)), user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Inicia sesión para continuar" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Tu sesión expiró, inicia sesión de nuevo" });
  }
}

export default router;
```

- [ ] **Step 5: Montar el router** — en `app/server/index.js` añadir el import y el mount (antes del 404 de `/api`):

```js
import authRouter from "./auth.js";
```

```js
  app.use("/api/auth", authRouter);
```

- [ ] **Step 6: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS (todos los tests de todas las tareas hasta ahora).

- [ ] **Step 7: Commit**

```bash
git add app/server/lib/validate.js app/server/auth.js app/server/index.js app/test/auth.test.js
git commit -m "feat: registro, login con bcrypt y middleware JWT"
```

---

### Task 6: Seed — framework + Bases de datos I y II

**Files:**
- Create: `app/server/seed.js`
- Create: `app/server/seed-data/bd1.js`
- Create: `app/server/seed-data/bd2.js`
- Modify: `app/test/helpers.js` (sembrar siempre)
- Test: `app/test/seed.test.js`

**Interfaces:**
- Produces: `app/server/seed.js` exporta `runSeed()` (upsert idempotente de cursos/unidades/lecciones/quizzes por id estable — re-ejecutarlo refresca contenido sin tocar `users`, `lesson_completions` ni `xp_events`) y `COURSES` (array de módulos de curso). Ejecutable como CLI: `npm run seed`.
- Produces: formato de módulo de curso (lo consumen Task 7 y los tests):

```js
export default {
  id: "bd1", subject: "Bases de datos I", tone: "cyan",
  title: "Modelo relacional", description: "…", order: 1, prereq: null,
  units: [
    { id: "bd1-u1", name: "Unidad 1 · …", lessons: [
      { id: "l1", title: "…", mins: 12,
        content: [ { type: "p", html: "…" }, { type: "code", lines: ["…"] }, { type: "note", text: "…" } ],
        quiz: { question: "…", options: ["…", "…", "…", "…"], correct: 0, ok: "…", bad: "…" } },
    ]},
  ],
};
```

**Reglas de contenido (aplican también a Task 7):** español con tuteo, términos técnicos precisos, sin emoji; código en sintaxis original (SQL/Java/JS/HTML/CSS). Cada lección: 2–4 bloques (al menos un `p`; un bloque `code` cuando el tema implique código) y exactamente 1 quiz con 4 opciones, `correct` variado entre lecciones (no siempre el mismo índice), `ok`/`bad` de 1–2 frases que expliquen el porqué. En bloques `p`, los términos de código van en `<code>…</code>`. En bloques `code`, las `lines` son HTML con spans de color: palabras clave `<span style="color: var(--accent-violet)">…</span>`, strings/identificadores destacados `<span style="color: var(--accent-cyan)">…</span>`, números `<span style="color: var(--accent-amber)">…</span>`, comentarios `<span style="color: var(--text-tertiary)">…</span>`.

- [ ] **Step 1: Escribir el test que falla** — `app/test/seed.test.js`

```js
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, query, closeDb } from "./helpers.js";

function parseMaybe(v) {
  return typeof v === "string" ? JSON.parse(v) : v;
}

test("seed inserta bd1 y bd2 con estructura válida", async () => {
  await setupTestDb();
  const bd1 = await query("SELECT * FROM courses WHERE id = 'bd1'");
  assert.equal(bd1.length, 1);
  assert.equal(bd1[0].prereq_course_id, null);
  const bd2 = await query("SELECT * FROM courses WHERE id = 'bd2'");
  assert.equal(bd2[0].prereq_course_id, "bd1");

  const bd1Lessons = await query(
    "SELECT l.id FROM lessons l JOIN units u ON u.id = l.unit_id WHERE u.course_id = 'bd1'"
  );
  assert.equal(bd1Lessons.length, 10);
  const bd2Lessons = await query(
    "SELECT l.id FROM lessons l JOIN units u ON u.id = l.unit_id WHERE u.course_id = 'bd2'"
  );
  assert.equal(bd2Lessons.length, 9);

  const [q5] = await query("SELECT * FROM quiz_questions WHERE lesson_id = 'l5'");
  assert.equal(q5.correct_index, 1);
  assert.match(q5.question, /promedio/);
});

test("toda lección sembrada tiene contenido y quiz bien formados", async () => {
  await setupTestDb();
  const rows = await query(
    `SELECT l.id, l.content, q.options, q.correct_index
     FROM lessons l LEFT JOIN quiz_questions q ON q.lesson_id = l.id`
  );
  for (const row of rows) {
    const content = parseMaybe(row.content);
    assert.ok(Array.isArray(content) && content.length >= 2, `contenido corto en ${row.id}`);
    assert.notEqual(row.options, null, `falta quiz en ${row.id}`);
    const options = parseMaybe(row.options);
    assert.equal(options.length, 4, `opciones en ${row.id}`);
    assert.ok(row.correct_index >= 0 && row.correct_index <= 3, `correct_index en ${row.id}`);
  }
});

test("el seed es idempotente (upsert por id)", async () => {
  await setupTestDb();
  await setupTestDb();
  const rows = await query("SELECT COUNT(*) AS n FROM courses");
  assert.ok(rows[0].n >= 2);
});

after(closeDb);
```

- [ ] **Step 2: Actualizar `app/test/helpers.js`** — sembrar siempre (upsert idempotente):

```js
import "dotenv/config";
process.env.DB_NAME = "coding_test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto-de-test";

import { initDb, query, closeDb } from "../server/db.js";
import { runSeed } from "../server/seed.js";

export async function setupTestDb() {
  await initDb({ seed: false });
  await runSeed();
}

export async function resetUserData() {
  await query("SET FOREIGN_KEY_CHECKS = 0");
  await query("TRUNCATE TABLE xp_events");
  await query("TRUNCATE TABLE lesson_completions");
  await query("TRUNCATE TABLE users");
  await query("SET FOREIGN_KEY_CHECKS = 1");
}

export { query, closeDb };
```

- [ ] **Step 3: Verificar que falla**

Run (en `app/`): `npm test`
Expected: FAIL — `Cannot find module '../server/seed.js'`.

- [ ] **Step 4: Crear `app/server/seed-data/bd1.js`**

Contenido completo de las 10 lecciones. Las tres primeras van escritas aquí como patrón obligatorio de estilo; **escribe las 7 restantes tú** (l3, l4, l6, l7 y la unidad 3 completa) siguiendo exactamente el mismo formato, las reglas de contenido de arriba y estos temas: l3 claves primarias y foráneas; l4 relaciones 1:1, 1:N y N:M; l6 JOIN entre tablas; l7 normalización 1FN–3FN; bd1-l8 funciones de agregación (COUNT, SUM, AVG, MIN, MAX); bd1-l9 GROUP BY y HAVING; bd1-l10 subconsultas. El quiz de l5 se copia textual (viene del `data.js` original).

```js
const K = 'color: var(--accent-violet)';
const S = 'color: var(--accent-cyan)';
const N = 'color: var(--accent-amber)';
const C = 'color: var(--text-tertiary)';

export default {
  id: "bd1",
  subject: "Bases de datos I",
  tone: "cyan",
  title: "Modelo relacional",
  description: "Domina tablas, claves, consultas SQL y normalización — la base de todo sistema de información.",
  order: 1,
  prereq: null,
  units: [
    {
      id: "bd1-u1",
      name: "Unidad 1 · Introducción a las bases de datos",
      lessons: [
        {
          id: "l1",
          title: "Qué es un SGBD",
          mins: 12,
          content: [
            { type: "p", html: "Un <code>SGBD</code> (Sistema de Gestión de Bases de Datos) es el software que almacena, organiza y protege los datos de una aplicación. Tú le hablas en <code>SQL</code> y él se encarga de guardar la información en disco, controlar el acceso concurrente y garantizar que nada se corrompa." },
            { type: "p", html: "Ejemplos que usarás en la carrera: <code>MySQL</code>, <code>PostgreSQL</code>, <code>Oracle</code> y <code>SQL Server</code>. Todos comparten el mismo lenguaje base: SQL." },
            { type: "note", text: "Piensa en el SGBD como el bibliotecario: tú pides el libro (consulta), él sabe en qué estante está y te lo trae íntegro." },
          ],
          quiz: {
            question: "¿Cuál de estas responsabilidades corresponde a un SGBD?",
            options: [
              "Renderizar la interfaz gráfica de la aplicación",
              "Compilar el código fuente a binario",
              "Almacenar los datos y controlar el acceso concurrente",
              "Enviar correos a los usuarios",
            ],
            correct: 2,
            ok: "El SGBD gestiona el almacenamiento, la integridad y la concurrencia de los datos; la interfaz y la lógica de la app viven en otra capa.",
            bad: "Recuerda: el SGBD vive en la capa de datos. Interfaz, compilación y correos son responsabilidades de otras capas del sistema.",
          },
        },
        {
          id: "l2",
          title: "Tablas, filas y columnas",
          mins: 15,
          content: [
            { type: "p", html: "En el modelo relacional los datos viven en <code>tablas</code>. Cada <code>fila</code> es un registro (un estudiante concreto) y cada <code>columna</code> es un atributo (su nombre, su promedio). Toda columna tiene un tipo de dato fijo." },
            { type: "code", lines: [
              `<span style="${C}">-- Una tabla se define con sus columnas y tipos</span>`,
              `<span style="${K}">CREATE TABLE</span> estudiantes (`,
              `  id <span style="${S}">INT</span>,`,
              `  nombre <span style="${S}">VARCHAR</span>(<span style="${N}">80</span>),`,
              `  promedio <span style="${S}">DECIMAL</span>(<span style="${N}">3</span>,<span style="${N}">2</span>)`,
              `);`,
            ]},
            { type: "note", text: "Regla mental: tabla = sustantivo del dominio (estudiantes, cursos); columna = dato atómico de ese sustantivo." },
          ],
          quiz: {
            question: "En la tabla estudiantes(id, nombre, promedio), ¿qué representa una fila?",
            options: [
              "Un atributo de los estudiantes",
              "Un estudiante concreto con sus valores",
              "El tipo de dato de la tabla",
              "El nombre de la base de datos",
            ],
            correct: 1,
            ok: "Exacto: cada fila es un registro completo — un estudiante con su id, su nombre y su promedio.",
            bad: "Las columnas son los atributos; la fila es el registro completo de un estudiante concreto.",
          },
        },
        // l3 "Claves primarias y foráneas" (18 min) — escríbela siguiendo el patrón:
        // p (qué es PK y unicidad) + code (CREATE TABLE con PRIMARY KEY y FOREIGN KEY) + note + quiz.
      ],
    },
    {
      id: "bd1-u2",
      name: "Unidad 2 · El modelo relacional",
      lessons: [
        // l4 "Relaciones 1:1, 1:N y N:M" (20 min) — p + p + note + quiz.
        {
          id: "l5",
          title: "Consultas SELECT y WHERE",
          mins: 22,
          content: [
            { type: "p", html: "<code>SELECT</code> recupera columnas de una tabla; <code>WHERE</code> filtra las filas que cumplen una condición. Puedes ordenar el resultado con <code>ORDER BY</code>." },
            { type: "code", lines: [
              `<span style="${C}">-- Estudiantes con promedio superior a 4.0</span>`,
              `<span style="${K}">SELECT</span> nombre, promedio <span style="${K}">FROM</span> estudiantes`,
              `<span style="${K}">WHERE</span> promedio &gt; <span style="${N}">4.0</span>`,
              `<span style="${K}">ORDER BY</span> promedio <span style="${K}">DESC</span>;`,
            ]},
            { type: "note", text: "La condición del WHERE se evalúa fila por fila antes de proyectar las columnas del SELECT." },
          ],
          quiz: {
            question: "Tienes la tabla estudiantes(nombre, promedio). ¿Qué consulta devuelve los estudiantes con promedio mayor a 4.0, ordenados de mayor a menor?",
            options: [
              "SELECT nombre FROM estudiantes ORDER BY promedio;",
              "SELECT nombre, promedio FROM estudiantes WHERE promedio > 4.0 ORDER BY promedio DESC;",
              "SELECT * WHERE promedio > 4.0 FROM estudiantes;",
              "FILTER estudiantes BY promedio > 4.0;",
            ],
            correct: 1,
            ok: "WHERE filtra y ORDER BY … DESC ordena de mayor a menor.",
            bad: "Recuerda: la cláusula WHERE va después de FROM y necesitas DESC para ordenar de mayor a menor.",
          },
        },
        // l6 "JOIN entre tablas" (25 min) — p + code (INNER JOIN) + note + quiz.
        // l7 "Normalización: 1FN a 3FN" (28 min) — p + p + note + quiz.
      ],
    },
    {
      id: "bd1-u3",
      name: "Unidad 3 · Agregación y agrupación",
      lessons: [
        // bd1-l8 "Funciones de agregación" (20 min) — p + code (COUNT/AVG) + note + quiz.
        // bd1-l9 "GROUP BY y HAVING" (24 min) — p + code + note + quiz.
        // bd1-l10 "Subconsultas" (26 min) — p + code + note + quiz.
      ],
    },
  ],
};
```

(Los comentarios `// …` indican las lecciones que debes dejar **completamente escritas** en este paso — al terminar no queda ningún comentario placeholder en el archivo.)

- [ ] **Step 5: Crear `app/server/seed-data/bd2.js`**

Mismo formato. Curso: `id: "bd2"`, subject `"Bases de datos II"`, tone `"cyan"`, title `"Transacciones y triggers"`, description `"Transacciones seguras, triggers, procedimientos y rendimiento — bases de datos en producción."`, order `4`, prereq `"bd1"`. Unidades y lecciones (escribe TODO el contenido y quizzes siguiendo el patrón de bd1):

- `bd2-u1` "Unidad 1 · Transacciones": `bd2-l1` "Qué es una transacción" (16), `bd2-l2` "COMMIT y ROLLBACK" (18), `bd2-l3` "Propiedades ACID" (20)
- `bd2-u2` "Unidad 2 · Triggers y procedimientos": `bd2-l4` "Triggers" (20), `bd2-l5` "Procedimientos almacenados" (22), `bd2-l6` "Funciones definidas por el usuario" (18)
- `bd2-u3` "Unidad 3 · Rendimiento": `bd2-l7` "Índices" (20), `bd2-l8` "EXPLAIN y planes de consulta" (22), `bd2-l9` "Bloqueos y concurrencia" (22)

- [ ] **Step 6: Implementar `app/server/seed.js`**

```js
import { initDb, query, closeDb } from "./db.js";
import bd1 from "./seed-data/bd1.js";
import bd2 from "./seed-data/bd2.js";

export const COURSES = [bd1, bd2];

export async function runSeed() {
  for (const c of COURSES) {
    await query(
      `INSERT INTO courses (id, subject, subject_tone, title, description, order_index, prereq_course_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE subject = VALUES(subject), subject_tone = VALUES(subject_tone),
         title = VALUES(title), description = VALUES(description),
         order_index = VALUES(order_index), prereq_course_id = VALUES(prereq_course_id)`,
      [c.id, c.subject, c.tone, c.title, c.description, c.order, c.prereq]
    );
    for (const [unitIndex, u] of c.units.entries()) {
      await query(
        `INSERT INTO units (id, course_id, name, order_index) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), order_index = VALUES(order_index)`,
        [u.id, c.id, u.name, unitIndex]
      );
      for (const [lessonIndex, l] of u.lessons.entries()) {
        await query(
          `INSERT INTO lessons (id, unit_id, title, mins, order_index, content) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title = VALUES(title), mins = VALUES(mins),
             order_index = VALUES(order_index), content = VALUES(content)`,
          [l.id, u.id, l.title, l.mins, lessonIndex, JSON.stringify(l.content)]
        );
        await query(
          `INSERT INTO quiz_questions (lesson_id, question, options, correct_index, explain_ok, explain_bad)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE question = VALUES(question), options = VALUES(options),
             correct_index = VALUES(correct_index), explain_ok = VALUES(explain_ok), explain_bad = VALUES(explain_bad)`,
          [l.id, l.quiz.question, JSON.stringify(l.quiz.options), l.quiz.correct, l.quiz.ok, l.quiz.bad]
        );
      }
    }
  }
}

if (process.argv[1] && process.argv[1].replaceAll("\\", "/").endsWith("server/seed.js")) {
  await initDb({ seed: false });
  await runSeed();
  console.log("Seed aplicado");
  await closeDb();
}
```

- [ ] **Step 7: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS (los 3 tests de seed y todos los anteriores).

- [ ] **Step 8: Commit**

```bash
git add app/server/seed.js app/server/seed-data/ app/test/seed.test.js app/test/helpers.js
git commit -m "feat: seed idempotente con contenido de Bases de datos I y II"
```

---

### Task 7: Seed — Programación I y II, Algoritmos, Desarrollo web

**Files:**
- Create: `app/server/seed-data/prog1.js`, `app/server/seed-data/prog2.js`, `app/server/seed-data/algo.js`, `app/server/seed-data/web.js`
- Modify: `app/server/seed.js` (añadir los 4 cursos a `COURSES`)
- Modify: `app/test/seed.test.js` (totales)

**Interfaces:**
- Consumes: formato de módulo de curso y reglas de contenido de Task 6 (léelas: cada lección 2–4 bloques, quiz de 4 opciones con `correct` variado y explicaciones `ok`/`bad`; español con tuteo; código Java/JS/HTML/CSS/pseudocódigo con spans de color `--accent-violet` (keywords), `--accent-cyan` (strings/identificadores), `--accent-amber` (números), `--text-tertiary` (comentarios)).

- [ ] **Step 1: Añadir test de totales** — en `app/test/seed.test.js`:

```js
test("seed completo: 6 cursos, 64 lecciones, 64 quizzes", async () => {
  await setupTestDb();
  const courses = await query("SELECT id FROM courses");
  assert.equal(courses.length, 6);
  const lessons = await query("SELECT COUNT(*) AS n FROM lessons");
  assert.equal(lessons[0].n, 64);
  const quizzes = await query("SELECT COUNT(*) AS n FROM quiz_questions");
  assert.equal(quizzes[0].n, 64);
  const perCourse = await query(
    `SELECT u.course_id, COUNT(l.id) AS n FROM lessons l JOIN units u ON u.id = l.unit_id GROUP BY u.course_id`
  );
  const counts = Object.fromEntries(perCourse.map((r) => [r.course_id, r.n]));
  assert.deepEqual(counts, { bd1: 10, bd2: 9, prog1: 12, prog2: 9, algo: 12, web: 12 });
});
```

- [ ] **Step 2: Verificar que falla**

Run (en `app/`): `npm test`
Expected: FAIL — `courses.length` es 2, no 6.

- [ ] **Step 3: Escribir los 4 módulos de curso** (contenido y quizzes COMPLETOS, sin comentarios placeholder):

`prog1.js` — `id: "prog1"`, subject `"Programación I"`, tone `"blue"`, title `"Fundamentos y control de flujo"`, description `"Tus primeros programas en Java: variables, condicionales, bucles y funciones."`, order `5`, prereq `null`. Código en Java.
- `prog1-u1` "Unidad 1 · Primeros pasos": `prog1-l1` "Qué es programar" (10), `prog1-l2` "Variables y tipos de datos" (14), `prog1-l3` "Operadores y expresiones" (14), `prog1-l4` "Entrada y salida" (12)
- `prog1-u2` "Unidad 2 · Control de flujo": `prog1-l5` "Condicionales if y else" (16), `prog1-l6` "El switch" (12), `prog1-l7` "Bucles while" (16), `prog1-l8` "Bucles for" (16)
- `prog1-u3` "Unidad 3 · Funciones": `prog1-l9` "Definir y llamar métodos" (18), `prog1-l10` "Parámetros y retorno" (18), `prog1-l11` "Ámbito de variables" (14), `prog1-l12` "Descomposición de problemas" (20)

`prog2.js` — `id: "prog2"`, subject `"Programación II"`, tone `"blue"`, title `"Herencia y polimorfismo"`, description `"Programación orientada a objetos en Java: clases, herencia, polimorfismo y colecciones."`, order `2`, prereq `null`. Código en Java.
- `prog2-u1` "Unidad 1 · Objetos y clases": `prog2-l1` "Clases y objetos" (16), `prog2-l2` "Constructores" (14), `prog2-l3` "Encapsulamiento" (16)
- `prog2-u2` "Unidad 2 · Herencia": `prog2-l4` "Extender clases" (18), `prog2-l5` "super y sobreescritura" (18), `prog2-l6` "Clases abstractas" (20)
- `prog2-u3` "Unidad 3 · Polimorfismo y colecciones": `prog2-l7` "Polimorfismo" (20), `prog2-l8` "Interfaces" (18), `prog2-l9` "ArrayList y colecciones" (20)

`algo.js` — `id: "algo"`, subject `"Algoritmos"`, tone `"violet"`, title `"Recursión y complejidad"`, description `"Piensa como computador: análisis de complejidad, recursión y los algoritmos clásicos."`, order `3`, prereq `null`. Código en pseudocódigo o Java.
- `algo-u1` "Unidad 1 · Pensamiento algorítmico": `algo-l1` "Qué es un algoritmo" (12), `algo-l2` "Pseudocódigo" (14), `algo-l3` "Trazas de ejecución" (16), `algo-l4` "Notación Big O" (20)
- `algo-u2` "Unidad 2 · Recursión": `algo-l5` "El caso base" (18), `algo-l6` "Recursión sobre listas" (20), `algo-l7` "Torres de Hanói" (22), `algo-l8` "Recursión vs iteración" (18)
- `algo-u3` "Unidad 3 · Ordenamiento y búsqueda": `algo-l9` "Búsqueda lineal y binaria" (20), `algo-l10` "Bubble sort e insertion sort" (22), `algo-l11` "Merge sort" (24), `algo-l12` "Elegir el algoritmo correcto" (18)

`web.js` — `id: "web"`, subject `"Desarrollo web"`, tone `"amber"`, title `"HTML, CSS y JavaScript"`, description `"Construye para el navegador: estructura con HTML, estilo con CSS y comportamiento con JavaScript."`, order `6`, prereq `null`. Código HTML/CSS/JS.
- `web-u1` "Unidad 1 · HTML": `web-l1` "Estructura de un documento" (14), `web-l2` "Etiquetas semánticas" (16), `web-l3` "Formularios" (18), `web-l4` "Imágenes y enlaces" (14)
- `web-u2` "Unidad 2 · CSS": `web-l5` "Selectores y especificidad" (18), `web-l6` "El modelo de caja" (18), `web-l7` "Flexbox" (20), `web-l8` "Responsive y media queries" (20)
- `web-u3` "Unidad 3 · JavaScript": `web-l9` "Variables y funciones en JS" (18), `web-l10` "El DOM" (20), `web-l11` "Eventos" (18), `web-l12` "fetch y APIs" (22)

- [ ] **Step 4: Registrar los cursos** — en `app/server/seed.js`:

```js
import prog1 from "./seed-data/prog1.js";
import prog2 from "./seed-data/prog2.js";
import algo from "./seed-data/algo.js";
import web from "./seed-data/web.js";

export const COURSES = [bd1, bd2, prog1, prog2, algo, web];
```

(bd1 debe ir antes que bd2 por la FK del prerequisito; el resto no importa.)

- [ ] **Step 5: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS — en particular "seed completo" y "toda lección sembrada tiene contenido y quiz bien formados" (valida las 64).

- [ ] **Step 6: Commit**

```bash
git add app/server/seed-data/ app/server/seed.js app/test/seed.test.js
git commit -m "feat: contenido de las 6 materias (64 lecciones con quiz)"
```

---

### Task 8: Servicios de progreso con BD + rutas de cursos

**Files:**
- Modify: `app/server/services/progress.js` (añadir funciones con BD)
- Create: `app/server/routes/courses.js`
- Modify: `app/server/index.js` (montar `/api/courses`)
- Test: `app/test/courses.test.js`

**Interfaces:**
- Consumes: `query` (db.js), `progressPercent`/`courseStatus` (Task 4), seed (Tasks 6–7), `requireAuth` (Task 5).
- Produces (en `progress.js`):
  - `coursesForUser(userId) → [{ id, subject, subjectTone, title, description, lessons, hours, progress, status, prereqId }]` ordenado por `order_index`.
  - `courseDetail(userId, courseId) → { …curso, units: [{ id, name, lessons: [{ id, title, mins, done, current }] }] } | null`; **lanza** `Error` con `.status = 403` y mensaje `"Completa <subject del prerequisito> para desbloquear esta materia"` si está BLOQUEADO. Exactamente una lección tiene `current: true` (la primera no completada), salvo curso 100% completado.
  - `findContinue(userId) → { courseId, lessonId, lessonTitle } | null` — curso con actividad más reciente aún incompleto; si no hay, primer curso desbloqueado con progreso < 100%; null si todo está completo.
- Produces (rutas): `GET /api/courses` → array; `GET /api/courses/:id` → detalle, `404 {error: "Esta materia no existe"}`, `403` si bloqueado.

- [ ] **Step 1: Escribir los tests que fallan** — `app/test/courses.test.js`

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";

let app;
let token;
let userId;

before(async () => {
  await setupTestDb();
  app = createApp();
});
beforeEach(async () => {
  await resetUserData();
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Ana Prueba", email: "ana@uni.edu", password: "secreto1" });
  token = res.body.token;
  userId = res.body.user.id;
});
after(closeDb);

const auth = (req) => req.set("Authorization", `Bearer ${token}`);

test("sin token responde 401", async () => {
  const res = await request(app).get("/api/courses");
  assert.equal(res.status, 401);
});

test("catálogo para usuario nuevo: 6 cursos, bd2 bloqueado, resto nuevo", async () => {
  const res = await auth(request(app).get("/api/courses"));
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 6);
  assert.deepEqual(res.body.map((c) => c.id), ["bd1", "prog2", "algo", "bd2", "prog1", "web"]);
  const byId = Object.fromEntries(res.body.map((c) => [c.id, c]));
  assert.equal(byId.bd2.status, "BLOQUEADO");
  assert.equal(byId.bd1.status, "NUEVO");
  assert.equal(byId.bd1.progress, 0);
  assert.equal(byId.bd1.lessons, 10);
  assert.equal(byId.bd1.hours, 4);
});

test("detalle de curso con lección current", async () => {
  const res = await auth(request(app).get("/api/courses/bd1"));
  assert.equal(res.status, 200);
  assert.equal(res.body.units.length, 3);
  const lessons = res.body.units.flatMap((u) => u.lessons);
  assert.equal(lessons.length, 10);
  assert.equal(lessons[0].id, "l1");
  assert.equal(lessons[0].current, true);
  assert.equal(lessons.filter((l) => l.current).length, 1);
});

test("progreso tras completar una lección", async () => {
  await query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, 'l1')", [userId]);
  const detail = await auth(request(app).get("/api/courses/bd1"));
  assert.equal(detail.body.progress, 10);
  const lessons = detail.body.units.flatMap((u) => u.lessons);
  assert.equal(lessons.find((l) => l.id === "l1").done, true);
  assert.equal(lessons.find((l) => l.id === "l2").current, true);
  const list = await auth(request(app).get("/api/courses"));
  assert.equal(list.body.find((c) => c.id === "bd1").status, "EN CURSO");
});

test("curso bloqueado responde 403 con el prerequisito", async () => {
  const res = await auth(request(app).get("/api/courses/bd2"));
  assert.equal(res.status, 403);
  assert.match(res.body.error, /Bases de datos I/);
});

test("curso inexistente responde 404", async () => {
  const res = await auth(request(app).get("/api/courses/nope"));
  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Esta materia no existe");
});
```

- [ ] **Step 2: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — 404 en `/api/courses` (router no montado).

- [ ] **Step 3: Añadir funciones con BD a `app/server/services/progress.js`**

```js
import { query } from "../db.js";
```

(al inicio del archivo, y al final:)

```js
async function courseStats(userId) {
  const rows = await query(
    `SELECT c.id AS course_id,
            COUNT(l.id) AS total,
            COUNT(lc.lesson_id) AS completed,
            SUM(l.mins) AS mins,
            MAX(lc.completed_at) AS last_activity
     FROM courses c
     JOIN units u ON u.course_id = c.id
     JOIN lessons l ON l.unit_id = u.id
     LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = ?
     GROUP BY c.id`,
    [userId]
  );
  const map = {};
  for (const r of rows) {
    map[r.course_id] = {
      total: Number(r.total),
      completed: Number(r.completed),
      mins: Number(r.mins || 0),
      lastActivity: r.last_activity,
    };
  }
  return map;
}

export async function coursesForUser(userId) {
  const stats = await courseStats(userId);
  const courses = await query("SELECT * FROM courses ORDER BY order_index");
  return courses.map((c) => {
    const s = stats[c.id] || { total: 0, completed: 0, mins: 0 };
    const progress = progressPercent(s.completed, s.total);
    const prereq = c.prereq_course_id ? stats[c.prereq_course_id] : null;
    const prereqProgress = prereq ? progressPercent(prereq.completed, prereq.total) : null;
    return {
      id: c.id,
      subject: c.subject,
      subjectTone: c.subject_tone,
      title: c.title,
      description: c.description,
      lessons: s.total,
      hours: Math.round(s.mins / 60),
      progress,
      status: courseStatus({ progress, prereqProgress }),
      prereqId: c.prereq_course_id,
    };
  });
}

export async function courseDetail(userId, courseId) {
  const list = await coursesForUser(userId);
  const course = list.find((c) => c.id === courseId);
  if (!course) return null;
  if (course.status === "BLOQUEADO") {
    const prereq = list.find((c) => c.id === course.prereqId);
    const err = new Error(`Completa ${prereq.subject} para desbloquear esta materia`);
    err.status = 403;
    throw err;
  }
  const rows = await query(
    `SELECT u.id AS unit_id, u.name AS unit_name,
            l.id, l.title, l.mins,
            (lc.lesson_id IS NOT NULL) AS done
     FROM units u
     JOIN lessons l ON l.unit_id = u.id
     LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = ?
     WHERE u.course_id = ?
     ORDER BY u.order_index, l.order_index`,
    [userId, courseId]
  );
  const units = [];
  let currentAssigned = false;
  for (const r of rows) {
    let unit = units[units.length - 1];
    if (!unit || unit.id !== r.unit_id) {
      unit = { id: r.unit_id, name: r.unit_name, lessons: [] };
      units.push(unit);
    }
    const done = Boolean(r.done);
    const current = !done && !currentAssigned;
    if (current) currentAssigned = true;
    unit.lessons.push({ id: r.id, title: r.title, mins: r.mins, done, current });
  }
  return { ...course, units };
}

export async function findContinue(userId) {
  const list = await coursesForUser(userId);
  const recent = await query(
    `SELECT u.course_id, MAX(lc.completed_at) AS last_at
     FROM lesson_completions lc
     JOIN lessons l ON l.id = lc.lesson_id
     JOIN units u ON u.id = l.unit_id
     WHERE lc.user_id = ?
     GROUP BY u.course_id
     ORDER BY last_at DESC
     LIMIT 1`,
    [userId]
  );
  let course = null;
  if (recent.length) {
    const c = list.find((x) => x.id === recent[0].course_id);
    if (c && c.status !== "BLOQUEADO" && c.progress < 100) course = c;
  }
  if (!course) course = list.find((c) => c.status !== "BLOQUEADO" && c.progress < 100) || null;
  if (!course) return null;
  const next = await query(
    `SELECT l.id, l.title
     FROM lessons l
     JOIN units u ON u.id = l.unit_id
     LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = ?
     WHERE u.course_id = ? AND lc.lesson_id IS NULL
     ORDER BY u.order_index, l.order_index
     LIMIT 1`,
    [userId, course.id]
  );
  if (!next.length) return null;
  return { courseId: course.id, lessonId: next[0].id, lessonTitle: next[0].title };
}
```

- [ ] **Step 4: Crear `app/server/routes/courses.js`**

```js
import { Router } from "express";
import { coursesForUser, courseDetail } from "../services/progress.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await coursesForUser(req.userId));
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const detail = await courseDetail(req.userId, req.params.id);
    if (!detail) return res.status(404).json({ error: "Esta materia no existe" });
    res.json(detail);
  } catch (e) {
    next(e);
  }
});

export default router;
```

- [ ] **Step 5: Montar en `app/server/index.js`**

```js
import { requireAuth } from "./auth.js";
import coursesRouter from "./routes/courses.js";
```

(el import de `auth.js` queda: `import authRouter, { requireAuth } from "./auth.js";`)

```js
  app.use("/api/courses", requireAuth, coursesRouter);
```

- [ ] **Step 6: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/server/services/progress.js app/server/routes/courses.js app/server/index.js app/test/courses.test.js
git commit -m "feat: catálogo y detalle de cursos con progreso, estados y bloqueo"
```

---

### Task 9: Ruta /api/me (perfil, stats, continuar)

**Files:**
- Create: `app/server/routes/me.js`
- Modify: `app/server/index.js` (montar `/api/me`)
- Test: `app/test/me.test.js`

**Interfaces:**
- Consumes: `initials` (auth.js), `currentStreak`/`bestStreak`/`weeklyXp`/`toDayString` (gamification.js), `coursesForUser`/`findContinue` (progress.js), `query` (db.js).
- Produces: `GET /api/me` → `{ user: {id,name,email,initials}, stats: {xp, xpWeek, streak, bestStreak, activeCourses, completedCourses, lockedCourses}, continue: {courseId, lessonId, lessonTitle} | null }`. Si el usuario del token ya no existe → `401`.

- [ ] **Step 1: Escribir los tests que fallan** — `app/test/me.test.js`

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";

let app;
let token;
let userId;

before(async () => {
  await setupTestDb();
  app = createApp();
});
beforeEach(async () => {
  await resetUserData();
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Ana Prueba", email: "ana@uni.edu", password: "secreto1" });
  token = res.body.token;
  userId = res.body.user.id;
});
after(closeDb);

const me = () => request(app).get("/api/me").set("Authorization", `Bearer ${token}`);

test("usuario nuevo: stats en cero y continue apunta a bd1/l1", async () => {
  const res = await me();
  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, "Ana Prueba");
  assert.deepEqual(res.body.stats, {
    xp: 0, xpWeek: 0, streak: 0, bestStreak: 0,
    activeCourses: 0, completedCourses: 0, lockedCourses: 1,
  });
  assert.deepEqual(res.body.continue, { courseId: "bd1", lessonId: "l1", lessonTitle: "Qué es un SGBD" });
});

test("xp, racha y continue reflejan la actividad", async () => {
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', NOW() - INTERVAL 1 DAY)", [userId]);
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l2', NOW())", [userId]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount, created_at) VALUES (?, 'l1', 50, NOW() - INTERVAL 1 DAY)", [userId]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount, created_at) VALUES (?, 'l2', 50, NOW())", [userId]);
  const res = await me();
  assert.equal(res.body.stats.xp, 100);
  assert.equal(res.body.stats.xpWeek, 100);
  assert.equal(res.body.stats.streak, 2);
  assert.equal(res.body.stats.bestStreak, 2);
  assert.equal(res.body.stats.activeCourses, 1);
  assert.deepEqual(res.body.continue.courseId, "bd1");
  assert.equal(res.body.continue.lessonId, "l3");
});

test("racha con hueco solo cuenta el tramo reciente", async () => {
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', NOW() - INTERVAL 5 DAY)", [userId]);
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l2', NOW() - INTERVAL 4 DAY)", [userId]);
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l3', NOW())", [userId]);
  const res = await me();
  assert.equal(res.body.stats.streak, 1);
  assert.equal(res.body.stats.bestStreak, 2);
});

test("token de usuario borrado responde 401", async () => {
  await query("SET FOREIGN_KEY_CHECKS = 0");
  await query("DELETE FROM users WHERE id = ?", [userId]);
  await query("SET FOREIGN_KEY_CHECKS = 1");
  const res = await me();
  assert.equal(res.status, 401);
});
```

- [ ] **Step 2: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — 404 en `/api/me`.

- [ ] **Step 3: Implementar `app/server/routes/me.js`**

```js
import { Router } from "express";
import { query } from "../db.js";
import { initials } from "../auth.js";
import { currentStreak, bestStreak, weeklyXp, toDayString } from "../services/gamification.js";
import { coursesForUser, findContinue } from "../services/progress.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const users = await query("SELECT id, name, email FROM users WHERE id = ?", [req.userId]);
    if (!users.length) return res.status(401).json({ error: "Tu sesión expiró, inicia sesión de nuevo" });
    const user = users[0];

    const completions = await query("SELECT completed_at FROM lesson_completions WHERE user_id = ?", [req.userId]);
    const days = completions.map((r) => toDayString(r.completed_at));
    const events = await query("SELECT amount, created_at FROM xp_events WHERE user_id = ?", [req.userId]);
    const courses = await coursesForUser(req.userId);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, initials: initials(user.name) },
      stats: {
        xp: events.reduce((sum, e) => sum + e.amount, 0),
        xpWeek: weeklyXp(events),
        streak: currentStreak(days, toDayString(new Date())),
        bestStreak: bestStreak(days),
        activeCourses: courses.filter((c) => c.status === "EN CURSO").length,
        completedCourses: courses.filter((c) => c.status === "COMPLETADO").length,
        lockedCourses: courses.filter((c) => c.status === "BLOQUEADO").length,
      },
      continue: await findContinue(req.userId),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
```

- [ ] **Step 4: Montar en `app/server/index.js`**

```js
import meRouter from "./routes/me.js";
```

```js
  app.use("/api/me", requireAuth, meRouter);
```

- [ ] **Step 5: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/server/routes/me.js app/server/index.js app/test/me.test.js
git commit -m "feat: perfil con stats de XP, racha y punto de continuación"
```

---

### Task 10: Rutas de lección (contenido + responder quiz)

**Files:**
- Create: `app/server/routes/lessons.js`
- Modify: `app/server/index.js` (montar `/api/lessons`)
- Test: `app/test/lessons.test.js`

**Interfaces:**
- Consumes: `courseDetail` (progress.js — lanza 403 en curso bloqueado), `query` (db.js), `requireAuth`.
- Produces:
  - `GET /api/lessons/:id` → `{ id, title, unitName, courseId, courseSubject, position: {index, total}, courseProgress, content: [bloques], quiz: {question, options} }`. `404 {error:"Esta lección no existe"}`; `403` si su curso está bloqueado. **Nunca incluye `correct_index`.**
  - `POST /api/lessons/:id/answer` body `{answerIndex}` → `{ correct, explanation, xpAwarded, alreadyCompleted, courseProgress, nextLessonId }`. `400` si `answerIndex` no es entero 0..3. Respuesta correcta primera vez: inserta `lesson_completions` + `xp_events` (+50). `nextLessonId` = siguiente lección en orden global del curso o `null` si es la última.

- [ ] **Step 1: Escribir los tests que fallan** — `app/test/lessons.test.js`

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";

let app;
let token;
let userId;

before(async () => {
  await setupTestDb();
  app = createApp();
});
beforeEach(async () => {
  await resetUserData();
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Ana Prueba", email: "ana@uni.edu", password: "secreto1" });
  token = res.body.token;
  userId = res.body.user.id;
});
after(closeDb);

const auth = (req) => req.set("Authorization", `Bearer ${token}`);

async function correctIndexOf(lessonId) {
  const [q] = await query("SELECT correct_index FROM quiz_questions WHERE lesson_id = ?", [lessonId]);
  return q.correct_index;
}

test("GET lección: contenido y quiz sin la respuesta correcta", async () => {
  const res = await auth(request(app).get("/api/lessons/l5"));
  assert.equal(res.status, 200);
  assert.equal(res.body.title, "Consultas SELECT y WHERE");
  assert.equal(res.body.courseId, "bd1");
  assert.deepEqual(res.body.position, { index: 5, total: 10 });
  assert.ok(Array.isArray(res.body.content) && res.body.content.length >= 2);
  assert.equal(res.body.quiz.options.length, 4);
  assert.ok(!JSON.stringify(res.body).includes("correct_index"));
});

test("GET lección inexistente 404; lección de curso bloqueado 403", async () => {
  assert.equal((await auth(request(app).get("/api/lessons/nope"))).status, 404);
  assert.equal((await auth(request(app).get("/api/lessons/bd2-l1"))).status, 403);
});

test("answerIndex inválido responde 400", async () => {
  for (const bad of [undefined, -1, 4, "2", 1.5]) {
    const res = await auth(request(app).post("/api/lessons/l1/answer")).send({ answerIndex: bad });
    assert.equal(res.status, 400, String(bad));
  }
});

test("respuesta incorrecta no completa ni da XP", async () => {
  const right = await correctIndexOf("l1");
  const wrong = (right + 1) % 4;
  const res = await auth(request(app).post("/api/lessons/l1/answer")).send({ answerIndex: wrong });
  assert.equal(res.body.correct, false);
  assert.equal(res.body.xpAwarded, 0);
  assert.ok(res.body.explanation.length > 0);
  const done = await query("SELECT * FROM lesson_completions WHERE user_id = ?", [userId]);
  assert.equal(done.length, 0);
});

test("respuesta correcta completa, da 50 XP una sola vez y avanza", async () => {
  const right = await correctIndexOf("l1");
  const first = await auth(request(app).post("/api/lessons/l1/answer")).send({ answerIndex: right });
  assert.equal(first.body.correct, true);
  assert.equal(first.body.xpAwarded, 50);
  assert.equal(first.body.alreadyCompleted, false);
  assert.equal(first.body.courseProgress, 10);
  assert.equal(first.body.nextLessonId, "l2");

  const again = await auth(request(app).post("/api/lessons/l1/answer")).send({ answerIndex: right });
  assert.equal(again.body.correct, true);
  assert.equal(again.body.xpAwarded, 0);
  assert.equal(again.body.alreadyCompleted, true);

  const xp = await query("SELECT SUM(amount) AS total FROM xp_events WHERE user_id = ?", [userId]);
  assert.equal(Number(xp[0].total), 50);
});

test("completar todo bd1 desbloquea bd2 y la última lección no tiene siguiente", async () => {
  const lessons = await query(
    `SELECT l.id FROM lessons l JOIN units u ON u.id = l.unit_id
     WHERE u.course_id = 'bd1' ORDER BY u.order_index, l.order_index`
  );
  let last;
  for (const { id } of lessons) {
    const right = await correctIndexOf(id);
    last = await auth(request(app).post(`/api/lessons/${id}/answer`)).send({ answerIndex: right });
  }
  assert.equal(last.body.courseProgress, 100);
  assert.equal(last.body.nextLessonId, null);
  const bd2 = await auth(request(app).get("/api/courses/bd2"));
  assert.equal(bd2.status, 200);
});
```

- [ ] **Step 2: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — 404 en `/api/lessons/l5`.

- [ ] **Step 3: Implementar `app/server/routes/lessons.js`**

```js
import { Router } from "express";
import { query } from "../db.js";
import { courseDetail } from "../services/progress.js";

const router = Router();

function parseMaybe(v) {
  return typeof v === "string" ? JSON.parse(v) : v;
}

async function loadLesson(lessonId) {
  const rows = await query(
    `SELECT l.id, l.title, l.mins, l.content, u.name AS unit_name, u.course_id, c.subject AS course_subject
     FROM lessons l
     JOIN units u ON u.id = l.unit_id
     JOIN courses c ON c.id = u.course_id
     WHERE l.id = ?`,
    [lessonId]
  );
  return rows[0] || null;
}

router.get("/:id", async (req, res, next) => {
  try {
    const lesson = await loadLesson(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Esta lección no existe" });
    const detail = await courseDetail(req.userId, lesson.course_id); // 403 si bloqueado
    const all = detail.units.flatMap((u) => u.lessons);
    const index = all.findIndex((l) => l.id === lesson.id);
    const [quiz] = await query("SELECT question, options FROM quiz_questions WHERE lesson_id = ?", [lesson.id]);
    res.json({
      id: lesson.id,
      title: lesson.title,
      unitName: lesson.unit_name,
      courseId: lesson.course_id,
      courseSubject: lesson.course_subject,
      position: { index: index + 1, total: all.length },
      courseProgress: detail.progress,
      content: parseMaybe(lesson.content),
      quiz: quiz ? { question: quiz.question, options: parseMaybe(quiz.options) } : null,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/answer", async (req, res, next) => {
  try {
    const lesson = await loadLesson(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Esta lección no existe" });
    await courseDetail(req.userId, lesson.course_id); // 403 si bloqueado

    const [q] = await query("SELECT * FROM quiz_questions WHERE lesson_id = ?", [lesson.id]);
    if (!q) return res.status(404).json({ error: "Esta lección no tiene quiz" });
    const options = parseMaybe(q.options);
    const { answerIndex } = req.body || {};
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
      return res.status(400).json({ error: "Selecciona una opción válida" });
    }

    const correct = answerIndex === q.correct_index;
    let xpAwarded = 0;
    let alreadyCompleted = false;
    if (correct) {
      const existing = await query(
        "SELECT lesson_id FROM lesson_completions WHERE user_id = ? AND lesson_id = ?",
        [req.userId, lesson.id]
      );
      alreadyCompleted = existing.length > 0;
      if (!alreadyCompleted) {
        await query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, ?)", [req.userId, lesson.id]);
        await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, 50)", [req.userId, lesson.id]);
        xpAwarded = 50;
      }
    }

    const detail = await courseDetail(req.userId, lesson.course_id);
    const all = detail.units.flatMap((u) => u.lessons);
    const index = all.findIndex((l) => l.id === lesson.id);
    const nextLesson = all[index + 1] || null;

    res.json({
      correct,
      explanation: correct ? q.explain_ok : q.explain_bad,
      xpAwarded,
      alreadyCompleted,
      courseProgress: detail.progress,
      nextLessonId: nextLesson ? nextLesson.id : null,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
```

- [ ] **Step 4: Montar en `app/server/index.js`**

```js
import lessonsRouter from "./routes/lessons.js";
```

```js
  app.use("/api/lessons", requireAuth, lessonsRouter);
```

- [ ] **Step 5: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS — suite completa del backend en verde.

- [ ] **Step 6: Commit**

```bash
git add app/server/routes/lessons.js app/server/index.js app/test/lessons.test.js
git commit -m "feat: lección con contenido y quiz validado en servidor con XP único"
```

---

### Task 11: Frontend base — shell, cliente API y login/registro

**Files:**
- Create: `app/web/index.html`
- Create: `app/web/api.js`
- Create: `app/web/screens/AppShell.jsx`
- Create: `app/web/app.jsx`
- Create: `app/web/screens/LoginScreen.jsx`
- Create: `app/web/screens/DashboardScreen.jsx` (stub temporal, se reemplaza en Task 12)

**Interfaces:**
- Consumes: API de Tasks 5–10; bundle `window.CodingDesignSystem_2ecb3a` servido en `/ds/_ds_bundle.js`.
- Produces (globales `window`, patrón del UI kit):
  - `API` — `API.get(path)`, `API.post(path, body)` (path sin `/api`), `API.token`, `API.setToken(t)`, `API.onUnauthorized`; lanza `Error` con el mensaje `error` del servidor; en 401 (fuera de `/auth/*`) limpia el token y llama `onUnauthorized`.
  - De `AppShell.jsx`: `KIcon`, `ICONS`, `NavBar({onHome, tab, setTab, user:{initials, streak}})`, `PageFrame`, `LoadingPanel`, `ErrorPanel({message, onRetry})`.
  - De `app.jsx`: router de pantallas; pasa a cada pantalla las props documentadas en Tasks 12–14: Dashboard `{me, tab, setTab, onOpenCourse(id), onOpenLesson(courseId, lessonId)}`, Course `{me, courseId, tab, setTab, onBack, onOpenLesson(lessonId)}`, Lesson `{me, courseId, lessonId, tab, setTab, onBack, onOpenLesson(lessonId), showToast({tone,title,description}), refreshMe()}`.
  - `LoginScreen({onLoggedIn})`.

- [ ] **Step 1: Crear `app/web/index.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Coding</title>
<link rel="stylesheet" href="/ds/styles.css">
<style>
  .lesson-content code { font-family: var(--font-mono); font-size: 13px; color: var(--accent-cyan); }
</style>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
<script src="/ds/_ds_bundle.js"></script>
<script src="/api.js"></script>
</head>
<body>
<div id="root"></div>
<script type="text/babel" src="/screens/AppShell.jsx"></script>
<script type="text/babel" src="/screens/LoginScreen.jsx"></script>
<script type="text/babel" src="/screens/DashboardScreen.jsx"></script>
<script type="text/babel" src="/screens/CourseScreen.jsx"></script>
<script type="text/babel" src="/screens/LessonScreen.jsx"></script>
<script type="text/babel" src="/app.jsx"></script>
</body>
</html>
```

Nota: `CourseScreen.jsx` y `LessonScreen.jsx` aún no existen; crea también stubs mínimos para que no falle la carga (se reemplazan en Tasks 13–14):

```jsx
// app/web/screens/CourseScreen.jsx (stub Task 11, se reemplaza en Task 13)
function CourseScreen() { return null; }
Object.assign(window, { CourseScreen });
```

```jsx
// app/web/screens/LessonScreen.jsx (stub Task 11, se reemplaza en Task 14)
function LessonScreen() { return null; }
Object.assign(window, { LessonScreen });
```

- [ ] **Step 2: Crear `app/web/api.js`**

```js
const API = {
  token: localStorage.getItem("coding-token"),
  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem("coding-token", t);
    else localStorage.removeItem("coding-token");
  },
  onUnauthorized: null,
  async request(path, { method = "GET", body } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (this.token) headers.Authorization = "Bearer " + this.token;
    let res;
    try {
      res = await fetch("/api" + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
      throw new Error("No hay conexión con el servidor");
    }
    let data = null;
    try { data = await res.json(); } catch {}
    if (res.status === 401 && !path.startsWith("/auth/")) {
      this.setToken(null);
      if (this.onUnauthorized) this.onUnauthorized();
    }
    if (!res.ok) throw new Error((data && data.error) || "Error del servidor");
    return data;
  },
  get(path) { return this.request(path); },
  post(path, body) { return this.request(path, { method: "POST", body }); },
};
window.API = API;
```

- [ ] **Step 3: Crear `app/web/screens/AppShell.jsx`**

Copia de `Coding Design System/ui_kits/coding-app/AppShell.jsx` (KIcon, ICONS, NavBar, PageFrame idénticos) más dos componentes nuevos al final, quedando el `Object.assign` así:

```jsx
function LoadingPanel() {
  return (
    <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-md)" }}>
      Cargando…
    </div>
  );
}

function ErrorPanel({ message, onRetry }) {
  const { GlassPanel, Button } = KIT;
  return (
    <GlassPanel padding="var(--space-6)" style={{ textAlign: "center" }}>
      <p style={{ margin: "0 0 14px", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>{message}</p>
      <Button variant="secondary" onClick={onRetry}>Reintentar</Button>
    </GlassPanel>
  );
}

Object.assign(window, { KIcon, ICONS, NavBar, PageFrame, LoadingPanel, ErrorPanel });
```

- [ ] **Step 4: Crear `app/web/app.jsx`**

```jsx
const KITA = window.CodingDesignSystem_2ecb3a;

function App() {
  const { Toast } = KITA;
  const [route, setRoute] = React.useState({ screen: API.token ? "loading" : "login" });
  const [me, setMe] = React.useState(null);
  const [tab, setTab] = React.useState("inicio");
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);

  const showToast = (t) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const loadMe = async () => {
    try {
      const data = await API.get("/me");
      setMe(data);
      setRoute((r) => (r.screen === "loading" ? { screen: "dashboard" } : r));
    } catch {
      API.setToken(null);
      setRoute({ screen: "login" });
    }
  };

  React.useEffect(() => {
    API.onUnauthorized = () => { setMe(null); setRoute({ screen: "login" }); };
    if (API.token) loadMe();
  }, []);

  const go = {
    dashboard: () => { setRoute({ screen: "dashboard" }); loadMe(); },
    course: (courseId) => setRoute({ screen: "course", courseId }),
    lesson: (courseId, lessonId) => setRoute({ screen: "lesson", courseId, lessonId }),
  };

  let screen;
  if (route.screen === "login") {
    screen = <LoginScreen onLoggedIn={() => { setRoute({ screen: "loading" }); loadMe(); }} />;
  } else if (route.screen === "loading" || !me) {
    screen = <LoadingPanel />;
  } else if (route.screen === "course") {
    screen = <CourseScreen me={me} courseId={route.courseId} tab={tab} setTab={setTab}
      onBack={go.dashboard} onOpenLesson={(lessonId) => go.lesson(route.courseId, lessonId)} />;
  } else if (route.screen === "lesson") {
    screen = <LessonScreen me={me} courseId={route.courseId} lessonId={route.lessonId} tab={tab} setTab={setTab}
      onBack={() => go.course(route.courseId)} onOpenLesson={(lessonId) => go.lesson(route.courseId, lessonId)}
      showToast={showToast} refreshMe={loadMe} />;
  } else {
    screen = <DashboardScreen me={me} tab={tab} setTab={setTab}
      onOpenCourse={(id) => go.course(id)} onOpenLesson={(courseId, lessonId) => go.lesson(courseId, lessonId)} />;
  }

  return (
    <React.Fragment>
      {screen}
      {toast ? (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 90 }}>
          <Toast tone={toast.tone} title={toast.title} description={toast.description} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
```

- [ ] **Step 5: Crear `app/web/screens/LoginScreen.jsx`**

Basado en el del UI kit, con registro y estados reales:

```jsx
const KITL = window.CodingDesignSystem_2ecb3a;

function LoginScreen({ onLoggedIn }) {
  const { GlassPanel, Input, Button, Checkbox } = KITL;
  const [mode, setMode] = React.useState("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const isLogin = mode === "login";

  const switchMode = (e, m) => { e.preventDefault(); setMode(m); setError(null); };

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = isLogin
        ? await API.post("/auth/login", { email, password, remember })
        : await API.post("/auth/register", { name, email, password });
      API.setToken(data.token);
      onLoggedIn();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ width: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)", lineHeight: 1 }}>
            Coding<span style={{ display: "inline-block", width: 5, height: 34, marginLeft: 8, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 14px var(--accent-cyan)" }}></span>
          </div>
          <div style={{ marginTop: 10, fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>Aprende Ingeniería de Software, una lección a la vez</div>
        </div>
        <GlassPanel strength="strong" padding="var(--space-7)" radius="var(--radius-xl)">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {!isLogin ? (
              <Input label="Nombre completo" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
            ) : null}
            <Input label="Correo institucional" placeholder="tu@universidad.edu" value={email} onChange={(e) => setEmail(e.target.value)} iconLeft={<KIcon d="M2.5 4.5h11v7h-11v-7zM2.5 5l5.5 4 5.5-4" />} />
            <Input label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} iconLeft={<KIcon d={ICONS.lock} />} />
            {error ? <div style={{ fontSize: "var(--text-sm)", color: "#E67984" }}>{error}</div> : null}
            {isLogin ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Checkbox checked={remember} onChange={setRemember} label="Recordarme" />
                <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: "var(--text-sm)" }}>¿Olvidaste tu contraseña?</a>
              </div>
            ) : null}
            <Button fullWidth size="lg" disabled={loading} onClick={submit}>
              {loading ? "Un momento…" : isLogin ? "Entrar" : "Crear cuenta"}
            </Button>
            <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
              {isLogin
                ? <React.Fragment>¿Primera vez? <a href="#" onClick={(e) => switchMode(e, "register")}>Crea tu cuenta</a></React.Fragment>
                : <React.Fragment>¿Ya tienes cuenta? <a href="#" onClick={(e) => switchMode(e, "login")}>Entrar</a></React.Fragment>}
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
Object.assign(window, { LoginScreen });
```

- [ ] **Step 6: Stub temporal de Dashboard** — `app/web/screens/DashboardScreen.jsx`:

```jsx
function DashboardScreen({ me }) {
  return (
    <PageFrame>
      <h1 style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>Hola, {me.user.name} — dashboard en la próxima tarea</h1>
    </PageFrame>
  );
}
Object.assign(window, { DashboardScreen });
```

- [ ] **Step 7: Verificar en el navegador**

1. Asegúrate de que exista `app/.env` (cópialo de `.env.example` y completa credenciales reales de MySQL; pon un `JWT_SECRET` cualquiera no vacío).
2. Arranca el servidor (en `app/`): `npm start` (en background). Expected: `Coding en http://localhost:3000`.
3. Abre `http://localhost:3000` en el navegador. Verifica: fondo aurora + tarjeta de login de vidrio idéntica al UI kit.
4. Registra una cuenta (nombre, correo, contraseña ≥ 6) → debe pasar al stub del dashboard con tu nombre.
5. Recarga la página → sigue en el dashboard (token persistido).
6. En una ventana nueva intenta login con contraseña mala → mensaje rojo "Correo o contraseña incorrectos".
7. Cambia a "Crea tu cuenta" con el mismo correo → "Este correo ya está registrado".

- [ ] **Step 8: Commit**

```bash
git add app/web/
git commit -m "feat: shell del frontend con cliente API y login/registro reales"
```

---

### Task 12: Dashboard conectado

**Files:**
- Modify (reemplazo completo): `app/web/screens/DashboardScreen.jsx`

**Interfaces:**
- Consumes: props `{me, tab, setTab, onOpenCourse(id), onOpenLesson(courseId, lessonId)}`; `API.get("/courses")`; globales `NavBar`, `PageFrame`, `KIcon`, `ICONS`, `LoadingPanel`, `ErrorPanel`; `me.stats` y `me.continue` de `GET /api/me`.

- [ ] **Step 1: Reemplazar `app/web/screens/DashboardScreen.jsx`**

```jsx
const KITD = window.CodingDesignSystem_2ecb3a;

function StatPanel({ label, value, sub, tone }) {
  const { GlassPanel } = KITD;
  return (
    <GlassPanel tint={tone} padding="var(--space-5)">
      <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>
    </GlassPanel>
  );
}

function CourseCard({ course, onOpen }) {
  const { Card, Badge, Progress, Button } = KITD;
  const locked = course.status === "BLOQUEADO";
  const toneMap = { "EN CURSO": "cyan", "NUEVO": "blue", "COMPLETADO": "success", "BLOQUEADO": "neutral" };
  return (
    <Card
      eyebrow={course.subject}
      title={course.title}
      subtitle={course.lessons + " lecciones · " + course.hours + " h"}
      tint={locked ? "none" : course.subjectTone === "amber" ? "none" : course.subjectTone}
      hoverable={!locked}
      onClick={locked ? undefined : () => onOpen(course.id)}
      style={{ opacity: locked ? 0.55 : 1 }}
      footer={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Badge tone={toneMap[course.status]} dot={course.status === "EN CURSO"}>
            {locked ? <KIcon d={ICONS.lock} size={11} /> : null}
            {course.status}
          </Badge>
          {!locked && course.progress < 100 ? (
            <Button size="sm" variant={course.progress > 0 ? "primary" : "secondary"} onClick={() => onOpen(course.id)}>
              {course.progress > 0 ? "Continuar" : "Empezar"}
            </Button>
          ) : null}
        </div>
      }
    >
      <Progress value={course.progress} tone={course.status === "COMPLETADO" ? "success" : course.subjectTone === "amber" ? "blue" : course.subjectTone} showLabel />
    </Card>
  );
}

function DashboardScreen({ me, onOpenCourse, onOpenLesson, tab, setTab }) {
  const { Button } = KITD;
  const [courses, setCourses] = React.useState(null);
  const [error, setError] = React.useState(null);
  const load = () => {
    setError(null);
    API.get("/courses").then(setCourses).catch((e) => setError(e.message));
  };
  React.useEffect(load, []);

  const stats = me.stats;
  const cont = me.continue;

  return (
    <PageFrame>
      <NavBar onHome={() => {}} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: stats.streak }} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, margin: "44px 4px 24px" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
            Hola, {me.user.name.split(" ")[0]}
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>
            {cont
              ? <React.Fragment>Continúa donde quedaste: <strong style={{ color: "var(--text-primary)" }}>{cont.lessonTitle}</strong></React.Fragment>
              : "¡Completaste todas tus materias!"}
          </p>
        </div>
        {cont ? (
          <Button size="lg" iconLeft={<KIcon d={ICONS.play} />} onClick={() => onOpenLesson(cont.courseId, cont.lessonId)}>
            Continuar lección
          </Button>
        ) : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatPanel label="Racha" value={stats.streak + " días"} sub={"Tu mejor racha: " + stats.bestStreak + " días"} tone="none" />
        <StatPanel label="XP total" value={stats.xp.toLocaleString("es")} sub={"+" + stats.xpWeek + " esta semana"} tone="blue" />
        <StatPanel label="Materias activas" value={String(stats.activeCourses)} sub={stats.completedCourses + " completadas · " + stats.lockedCourses + " bloqueadas"} tone="cyan" />
      </div>
      <h2 style={{ margin: "0 4px 16px", fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>Tus materias</h2>
      {error ? (
        <ErrorPanel message={error} onRetry={load} />
      ) : !courses ? (
        <LoadingPanel />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {courses.map((c) => <CourseCard key={c.id} course={c} onOpen={onOpenCourse} />)}
        </div>
      )}
    </PageFrame>
  );
}
Object.assign(window, { DashboardScreen });
```

- [ ] **Step 2: Verificar en el navegador**

Con el servidor corriendo, recarga `http://localhost:3000` con sesión iniciada:
1. Saludo con tu nombre y "Continúa donde quedaste: Qué es un SGBD".
2. Stats: Racha 0 días, XP 0, Materias activas 0 (6 tarjetas: bd1/prog2/algo/prog1/web en NUEVO, bd2 BLOQUEADO al 55% de opacidad y sin botón).
3. La tarjeta de Bases de datos II no responde al click; las demás sí (llevan a un dashboard→course roto todavía: el stub de CourseScreen renderiza null — esperado hasta la Task 13).

- [ ] **Step 3: Commit**

```bash
git add app/web/screens/DashboardScreen.jsx
git commit -m "feat: dashboard con stats y catálogo reales"
```

---

### Task 13: Pantalla de curso conectada

**Files:**
- Modify (reemplazo completo): `app/web/screens/CourseScreen.jsx`

**Interfaces:**
- Consumes: props `{me, courseId, tab, setTab, onBack, onOpenLesson(lessonId)}`; `API.get("/courses/" + courseId)` → `{subject, title, description, progress, status, subjectTone, units:[{id, name, lessons:[{id, title, mins, done, current}]}]}`; globales del shell.

- [ ] **Step 1: Reemplazar `app/web/screens/CourseScreen.jsx`**

```jsx
const KITC = window.CodingDesignSystem_2ecb3a;

function LessonRow({ lesson, onOpen }) {
  const { Badge } = KITC;
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(lesson.id)}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: "var(--radius-md)", cursor: "pointer", background: hover ? "var(--glass-bg-strong)" : lesson.current ? "var(--glass-tint-cyan)" : "transparent", border: "1px solid " + (lesson.current ? "rgba(82,201,184,0.35)" : hover ? "var(--glass-stroke)" : "transparent"), transition: "all var(--duration-fast) var(--ease-glass)" }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 99, flexShrink: 0, background: lesson.done ? "linear-gradient(180deg, #58CFA0, #3DB27E)" : "var(--glass-bg)", border: "1px solid " + (lesson.done ? "rgba(255,255,255,0.35)" : "var(--glass-stroke-strong)"), boxShadow: lesson.done ? "0 0 12px rgba(76,199,147,0.35)" : "var(--refraction-edge)", color: lesson.done ? "#03160C" : "var(--text-tertiary)" }}>
        {lesson.done ? <KIcon d={ICONS.check} size={13} /> : <KIcon d={ICONS.play} size={12} />}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--text-primary)" }}>{lesson.title}</div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: 1 }}>{lesson.mins} min</div>
      </div>
      {lesson.current ? <Badge tone="cyan" dot>SIGUIENTE</Badge> : null}
    </div>
  );
}

function CourseScreen({ me, courseId, onBack, onOpenLesson, tab, setTab }) {
  const { GlassPanel, Badge, Progress, Button, IconButton } = KITC;
  const [course, setCourse] = React.useState(null);
  const [error, setError] = React.useState(null);
  const load = () => {
    setCourse(null);
    setError(null);
    API.get("/courses/" + courseId).then(setCourse).catch((e) => setError(e.message));
  };
  React.useEffect(load, [courseId]);

  const statusTone = { "EN CURSO": "cyan", "NUEVO": "blue", "COMPLETADO": "success" };
  const progressTone = course
    ? (course.status === "COMPLETADO" ? "success" : course.subjectTone === "amber" ? "blue" : course.subjectTone)
    : "cyan";
  const current = course ? course.units.flatMap((u) => u.lessons).find((l) => l.current) : null;

  return (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 20px" }}>
        <IconButton label="Volver" onClick={onBack}><KIcon d={ICONS.back} /></IconButton>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          Materias{course ? " / " + course.subject : ""}
        </span>
      </div>
      {error ? (
        <ErrorPanel message={error} onRetry={load} />
      ) : !course ? (
        <LoadingPanel />
      ) : (
        <React.Fragment>
          <GlassPanel tint={course.subjectTone === "amber" ? "none" : course.subjectTone} padding="var(--space-7)" radius="var(--radius-xl)" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <div style={{ flex: 1 }}>
                <Badge tone={statusTone[course.status] || "neutral"} dot={course.status === "EN CURSO"}>{course.status}</Badge>
                <h1 style={{ margin: "12px 0 6px", fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>{course.title}</h1>
                <p style={{ margin: 0, fontSize: "var(--text-md)", color: "var(--text-secondary)", maxWidth: 560 }}>{course.description}</p>
                {current ? (
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <Button iconLeft={<KIcon d={ICONS.play} />} onClick={() => onOpenLesson(current.id)}>
                      {course.progress > 0 ? "Continuar lección" : "Empezar"}
                    </Button>
                  </div>
                ) : null}
              </div>
              <Progress value={course.progress} shape="ring" tone={progressTone} size="lg" showLabel />
            </div>
          </GlassPanel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {course.units.map((u) => (
              <GlassPanel key={u.id} padding="var(--space-5)">
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "0 4px 10px" }}>{u.name}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {u.lessons.map((l) => <LessonRow key={l.id} lesson={l} onOpen={onOpenLesson} />)}
                </div>
              </GlassPanel>
            ))}
          </div>
        </React.Fragment>
      )}
    </PageFrame>
  );
}
Object.assign(window, { CourseScreen });
```

- [ ] **Step 2: Verificar en el navegador**

1. Desde el dashboard, click en "Bases de datos I" → héroe con anillo 0%, badge NUEVO, botón "Empezar", 3 unidades con 10 lecciones, "l1" marcada SIGUIENTE.
2. Botón volver regresa al dashboard.
3. Click en cualquier lección lleva a la pantalla de lección (stub null — pantalla vacía con navbar es lo esperado hasta la Task 14).

- [ ] **Step 3: Commit**

```bash
git add app/web/screens/CourseScreen.jsx
git commit -m "feat: pantalla de curso con temario y progreso reales"
```

---

### Task 14: Pantalla de lección con quiz + verificación end-to-end + README

**Files:**
- Modify (reemplazo completo): `app/web/screens/LessonScreen.jsx`
- Create: `app/README.md`

**Interfaces:**
- Consumes: props `{me, courseId, lessonId, tab, setTab, onBack, onOpenLesson(lessonId), showToast({tone,title,description}), refreshMe()}`; `GET /api/lessons/:id` y `POST /api/lessons/:id/answer` (contratos en Task 10); globales del shell.

- [ ] **Step 1: Reemplazar `app/web/screens/LessonScreen.jsx`**

```jsx
const KITX = window.CodingDesignSystem_2ecb3a;

function CodeBlock({ lines }) {
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, lineHeight: 1.7, background: "rgba(3,6,16,0.55)", border: "1px solid var(--glass-stroke)", borderRadius: "var(--radius-sm)", padding: "14px 18px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      {lines.map((l, i) => <div key={i} dangerouslySetInnerHTML={{ __html: l }}></div>)}
    </div>
  );
}

function ContentBlocks({ content }) {
  return (
    <div className="lesson-content">
      {content.map((b, i) => {
        if (b.type === "code") return <div key={i} style={{ margin: "14px 0" }}><CodeBlock lines={b.lines} /></div>;
        if (b.type === "note") return <p key={i} style={{ margin: "14px 0 0", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{b.text}</p>;
        return <p key={i} style={{ margin: "0 0 14px", fontSize: "var(--text-base)", color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: b.html }} />;
      })}
    </div>
  );
}

function LessonScreen({ me, courseId, lessonId, onBack, onOpenLesson, tab, setTab, showToast, refreshMe }) {
  const { GlassPanel, Badge, Button, Radio, Dialog, IconButton, Progress } = KITX;
  const [lesson, setLesson] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [answer, setAnswer] = React.useState(-1);
  const [result, setResult] = React.useState(null);
  const [sending, setSending] = React.useState(false);

  const load = () => {
    setLesson(null);
    setError(null);
    setAnswer(-1);
    setResult(null);
    API.get("/lessons/" + lessonId).then(setLesson).catch((e) => setError(e.message));
  };
  React.useEffect(load, [lessonId]);

  const send = async () => {
    setSending(true);
    try {
      const r = await API.post("/lessons/" + lessonId + "/answer", { answerIndex: answer });
      setResult(r);
      if (r.xpAwarded > 0) refreshMe();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const continueNext = () => {
    if (result.xpAwarded > 0) {
      showToast({ tone: "success", title: "Lección completada", description: "+" + result.xpAwarded + " XP en " + lesson.courseSubject });
    }
    if (result.nextLessonId) onOpenLesson(result.nextLessonId);
    else onBack();
  };

  return (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      {error ? (
        <div style={{ marginTop: 36 }}><ErrorPanel message={error} onRetry={load} /></div>
      ) : !lesson ? (
        <LoadingPanel />
      ) : (
        <React.Fragment>
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 20px" }}>
            <IconButton label="Volver" onClick={onBack}><KIcon d={ICONS.back} /></IconButton>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
              {lesson.courseSubject} / {lesson.unitName.split(" · ")[0]}
            </span>
            <div style={{ flex: 1 }}></div>
            <div style={{ width: 220 }}><Progress value={lesson.courseProgress} tone="cyan" size="sm" /></div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
              Lección {lesson.position.index} de {lesson.position.total}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "start" }}>
            <GlassPanel padding="var(--space-7)" radius="var(--radius-xl)">
              <Badge tone="cyan">LECCIÓN {lesson.position.index}</Badge>
              <h1 style={{ margin: "12px 0 10px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>{lesson.title}</h1>
              <ContentBlocks content={lesson.content} />
            </GlassPanel>
            {lesson.quiz ? (
              <GlassPanel tint="blue" padding="var(--space-6)" radius="var(--radius-xl)">
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>Comprueba lo aprendido</div>
                <p style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 500, color: "var(--text-primary)" }}>{lesson.quiz.question}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {lesson.quiz.options.map((o, i) => (
                    <div key={i} onClick={() => setAnswer(i)} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: answer === i ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", border: "1px solid " + (answer === i ? "var(--focus-ring)" : "var(--glass-stroke)"), cursor: "pointer", transition: "all var(--duration-fast) var(--ease-glass)" }}>
                      <Radio name="quiz" checked={answer === i} onChange={() => setAnswer(i)} label={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{o}</span>} />
                    </div>
                  ))}
                </div>
                <Button fullWidth disabled={answer < 0 || sending} onClick={send}>
                  {sending ? "Enviando…" : "Enviar respuesta"}
                </Button>
              </GlassPanel>
            ) : null}
          </div>
          <Dialog
            open={result !== null}
            onClose={() => setResult(null)}
            title={result && result.correct ? "¡Correcto!" : "No exactamente"}
            footer={result && result.correct
              ? <Button onClick={continueNext}>{result.nextLessonId ? "Continuar" : "Volver al temario"}</Button>
              : <React.Fragment>
                  <Button variant="ghost" onClick={() => setResult(null)}>Revisar lección</Button>
                  <Button onClick={() => setResult(null)}>Intentar de nuevo</Button>
                </React.Fragment>}
          >
            {result ? (
              <span>
                {result.explanation}
                {result.correct && result.xpAwarded > 0 ? (
                  <React.Fragment> Ganaste <strong style={{ color: "var(--accent-cyan)" }}>+{result.xpAwarded} XP</strong>.</React.Fragment>
                ) : null}
                {result.correct && result.alreadyCompleted ? " Ya habías completado esta lección, así que no hay XP nuevo." : null}
              </span>
            ) : null}
          </Dialog>
        </React.Fragment>
      )}
    </PageFrame>
  );
}
Object.assign(window, { LessonScreen });
```

- [ ] **Step 2: Crear `app/README.md`**

```markdown
# Coding — app

Backend Express + MySQL y frontend del design system para la app de aprendizaje **Coding**.

## Requisitos

- Node.js ≥ 20
- MySQL local corriendo (MySQL Server, XAMPP o WAMP)

## Puesta en marcha

```bash
cd app
npm install
copy .env.example .env    # en Windows (cp en unix); completa DB_USER/DB_PASSWORD y un JWT_SECRET
npm start                 # crea la BD `coding`, aplica schema y siembra contenido si hace falta
```

Abre http://localhost:3000, crea tu cuenta y estudia.

## Comandos

- `npm start` — arranca el servidor en el puerto 3000 (configurable con PORT)
- `npm test` — suite completa (usa la BD `coding_test`, se crea sola)
- `npm run seed` — refresca el contenido de materias/lecciones sin tocar usuarios ni progreso

## Estructura

- `server/` — Express: `auth.js` (JWT), `routes/` (me, courses, lessons), `services/` (progreso, gamificación), `seed-data/` (contenido de las 6 materias)
- `web/` — frontend sin build: React CDN + Babel + componentes de `/ds` (design system)
- `test/` — node:test + supertest
```

- [ ] **Step 3: Verificación end-to-end en el navegador**

Con el servidor corriendo y sesión iniciada:
1. Dashboard → "Continuar lección" → abre "Qué es un SGBD" con contenido (párrafos, nota) y quiz de 4 opciones.
2. "Enviar respuesta" está deshabilitado sin selección; selecciona una opción incorrecta → diálogo "No exactamente" con explicación; "Intentar de nuevo" cierra el diálogo.
3. Responde correcto → "¡Correcto!" con "+50 XP"; "Continuar" → toast verde "Lección completada · +50 XP en Bases de datos I" y carga la lección 2.
4. Vuelve al temario: l1 con check verde, l2 SIGUIENTE, anillo 10%.
5. Dashboard: XP 50, racha 1 día, Bases de datos I EN CURSO 10%.
6. Repite la lección 1 y responde bien otra vez → mensaje de que ya estaba completada, sin XP nuevo (dashboard sigue en 50 XP).
7. Lección con bloque de código (l2 o l5): el código se ve coloreado en JetBrains Mono.
8. Recarga en plena lección → la pantalla vuelve al dashboard con datos intactos (el mini-router no persiste la ruta; es el comportamiento esperado).

- [ ] **Step 4: Correr la suite completa una última vez**

Run (en `app/`): `npm test`
Expected: PASS total.

- [ ] **Step 5: Commit**

```bash
git add app/web/screens/LessonScreen.jsx app/README.md
git commit -m "feat: lección con quiz en vivo, XP y racha end-to-end"
```
