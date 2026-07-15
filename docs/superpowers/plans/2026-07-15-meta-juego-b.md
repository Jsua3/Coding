# El meta-juego, Iteración B: la economía — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dar a Coding una meta diaria de XP configurable y un protector de racha canjeable con XP, más la página de Perfil como hogar de los ajustes. Spec: `docs/superpowers/specs/2026-07-15-meta-juego-b-economia-design.md`.

**Architecture:** primer cambio de esquema desde la iteración 2 — una columna (`users.daily_goal`) y una tabla (`streak_shields`), con migración idempotente en `initDb`. El gasto de XP es un `xp_events` con importe **negativo**. Dos derivaciones de la misma tabla: **XP ganado** (`SUM(amount>0)`, alimenta el nivel — nunca baja) y **saldo** (`SUM(amount)`, lo gastable). `currentStreak`/`bestStreak` no cambian por dentro: se les pasa la unión `activos ∪ protegidos`. Una función pura nueva, `repairableGap`, decide qué hueco es reparable.

**Tech Stack:** Node 20 ESM + Express 4 + MariaDB (`mysql2/promise`); tests `node:test` + `supertest`. Frontend React 18 UMD + Babel standalone, SIN build. **Cero dependencias nuevas.**

## Global Constraints

- **Todo lo derivable se calcula, nunca se almacena.** Esta iteración añade **exactamente** una columna y una tabla — nada más. Niveles, racha, saldo, hueco reparable: todo se deriva.
- **Seguridad:** `answer` y `password_hash` jamás salen por la API; el nombre de un logro secreto bloqueado, tampoco. **El servidor recalcula el hueco reparable — jamás confía en qué días dice el cliente proteger.**
- **El split de XP:** el **nivel** y todo lo de "actividad" (meta diaria, gráfica semanal, heatmap, `stats.xp`) se derivan del **XP ganado** (`SUM(amount) WHERE amount > 0`). El **saldo** gastable es `SUM(amount)` (con negativos). Gastar reduce el saldo, **nunca el nivel**.
- **TDD estricto en backend:** RED (test que falla) → GREEN. El reporte trae la evidencia.
- **Los 102 tests actuales deben seguir pasando.** El único que cambia de forma es el `deepEqual` de `stats` en `me.test.js` (gana claves nuevas) — se **actualiza**, no se debilita.
- **Frontend sin build:** PROHIBIDO `import`/`export` en `app/web/`; prohibido `<>` (usar `React.Fragment`); todo vía `Object.assign(window, {...})`; **el orden de los `<script>` en `index.html` es la resolución de dependencias**.
- **`Coding Design System/` es INTOCABLE.** Sus componentes no reenvían `className`: las clases de animación van en un `<div>` propio. `Progress` acepta tonos `blue|cyan|violet|success` (NO amber).
- **Regla de oro del DS:** `backdrop-filter` JAMÁS sobre un elemento con texto — va en un `<span aria-hidden>` con `zIndex: -1`.
- **El "día" se deriva SIEMPRE del reloj de Node** (`toDayString`), nunca de `CURDATE()`.
- Copy en español con tuteo, sentence case, **sin emoji**. Comentarios en español.
- Dev server: suele estar en :3000. **Guarda el backend en memoria: si sus respuestas `/api` parecen viejas, MÁTALO y relanza `npm start`.** Cuenta: `juan@test.dev` / `secreto1`.
- **Verificación en navegador:** trap `window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));` antes de afirmar "cero errores" (reinstalar tras cada recarga). El panel corre con `document.hidden === true`: el `IntersectionObserver` no dispara y `rAF` no resuelve — verifica el contrato, no el aspecto animado.
- Rama: `feature/meta-juego-b` (ya creada, con la spec committeada).

---

### Task 1: Esquema y migración

**Files:**
- Modify: `app/server/schema.sql`
- Modify: `app/server/db.js` (paso de migración en `initDb`)
- Test: `app/test/schema-b.test.js` (nuevo)

**Interfaces:**
- Produces: la columna `users.daily_goal INT NOT NULL DEFAULT 50` y la tabla `streak_shields`. Todas las tareas siguientes dependen de que existan.

**El problema que resuelve la migración:** `CREATE TABLE IF NOT EXISTS` crea la tabla nueva sola, pero **NO añade una columna a una tabla que ya existe** — la BD dev del usuario ya tiene `users` sin `daily_goal`. Por eso `initDb` gana un `ALTER TABLE … ADD COLUMN IF NOT EXISTS` idempotente (MariaDB 12 lo soporta). La BD de tests se crea desde cero, así que ahí el `CREATE` con la columna basta.

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/schema-b.test.js`:

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";

before(async () => { await setupTestDb(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

test("users tiene daily_goal con default 50", async () => {
  await query("INSERT INTO users (name, email, password_hash) VALUES ('Ana', 'ana@test.dev', 'x')");
  const [u] = await query("SELECT daily_goal FROM users WHERE email = 'ana@test.dev'");
  assert.equal(u.daily_goal, 50);
});

test("streak_shields existe y es única por (user, día)", async () => {
  const r = await query("INSERT INTO users (name, email, password_hash) VALUES ('Leo', 'leo@test.dev', 'x')");
  const id = r.insertId;
  await query("INSERT INTO streak_shields (user_id, protected_day) VALUES (?, '2026-07-10')", [id]);
  await assert.rejects(
    () => query("INSERT INTO streak_shields (user_id, protected_day) VALUES (?, '2026-07-10')", [id]),
    /ER_DUP_ENTRY|Duplicate/
  );
});
```

Nota: `resetUserData()` en `helpers.js` trunca `users`, `xp_events`, `lesson_completions`, `answer_attempts`. **Hay que añadirle `streak_shields`** (Step 3).

- [ ] **Step 2: Actualizar el esquema**

En `app/server/schema.sql`, en el `CREATE TABLE IF NOT EXISTS users`, añadir la columna (antes de `created_at`):

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  daily_goal INT NOT NULL DEFAULT 50,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Y al final del archivo (después del `DROP TABLE IF EXISTS quiz_questions;`), añadir la tabla:

```sql
CREATE TABLE IF NOT EXISTS streak_shields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  protected_day DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shield (user_id, protected_day),
  CONSTRAINT fk_shield_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 3: La migración idempotente en `initDb` + `resetUserData`**

En `app/server/db.js`, dentro de `initDb`, después del bucle que aplica el schema (`for (const stmt of schema.split(";")…)`), añadir el paso de migración antes del bloque `if (seed)`:

```js
  // Migraciones idempotentes: CREATE TABLE IF NOT EXISTS no añade columnas a tablas que ya existen,
  // así que la BD dev que ya tiene `users` no recibiría daily_goal sin esto. MariaDB 12 soporta
  // ADD COLUMN IF NOT EXISTS, que es un no-op tanto en BD nueva como existente.
  await getPool().query("ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_goal INT NOT NULL DEFAULT 50");
```

Y en `app/test/helpers.js`, añadir `streak_shields` al `resetUserData` (es la única forma de que los tests partan de cero):

```js
export async function resetUserData() {
  await query("SET FOREIGN_KEY_CHECKS = 0");
  await query("TRUNCATE TABLE answer_attempts");
  await query("TRUNCATE TABLE xp_events");
  await query("TRUNCATE TABLE lesson_completions");
  await query("TRUNCATE TABLE streak_shields");
  await query("TRUNCATE TABLE users");
  await query("SET FOREIGN_KEY_CHECKS = 1");
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **104/104 pass** (102 + 2 nuevos). La BD de tests se recrea con el schema nuevo.

- [ ] **Step 5: Commit**

```bash
git add app/server/schema.sql app/server/db.js app/test/schema-b.test.js app/test/helpers.js
git commit -m "feat: esquema de la economia (users.daily_goal + streak_shields) con migracion idempotente"
```

---

### Task 2: Constantes y derivaciones de XP (puras, TDD)

**Files:**
- Modify: `app/server/services/xp.js`
- Test: `app/test/xp.test.js` (nuevo)

**Interfaces:**
- Consumes: nada.
- Produces: **`SHIELD_COST = 50`**; **`earnedXp(events) → número`** (`SUM(amount) WHERE amount > 0`); **`balanceXp(events) → número`** (`SUM(amount)`). `events` es un array de `{amount}`. Las Tasks 4, 5, 6, 7, 8 los consumen.

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/xp.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { SHIELD_COST, earnedXp, balanceXp } from "../server/services/xp.js";

test("SHIELD_COST es 50 (una lección)", () => {
  assert.equal(SHIELD_COST, 50);
});

test("earnedXp suma solo los eventos positivos", () => {
  const events = [{ amount: 50 }, { amount: 10 }, { amount: -50 }, { amount: 5 }];
  assert.equal(earnedXp(events), 65); // 50+10+5, el -50 no cuenta
});

test("balanceXp suma todo, incluidos los negativos", () => {
  const events = [{ amount: 50 }, { amount: 10 }, { amount: -50 }, { amount: 5 }];
  assert.equal(balanceXp(events), 15); // 50+10-50+5
});

test("sin eventos, ambos son 0", () => {
  assert.equal(earnedXp([]), 0);
  assert.equal(balanceXp([]), 0);
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node --test test/xp.test.js` (desde `app/`)
Expected: FAIL — `SHIELD_COST`/`earnedXp`/`balanceXp` no exportados.

- [ ] **Step 3: Implementar**

En `app/server/services/xp.js`, añadir al final:

```js
// El coste de proteger un día de racha: una lección. Se ESCRIBE (el evento negativo) y se LEE
// (el precio mostrado y la validación), así que vive con los demás importes.
export const SHIELD_COST = 50;

// El split de XP. Gastar (un evento negativo) reduce el SALDO pero no el XP ganado, así que el
// nivel — que se deriva de lo ganado — nunca baja al proteger la racha.
export function earnedXp(events) {
  return events.reduce((sum, e) => (e.amount > 0 ? sum + e.amount : sum), 0);
}
export function balanceXp(events) {
  return events.reduce((sum, e) => sum + e.amount, 0);
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **108/108 pass** (104 + 4 nuevos).

- [ ] **Step 5: Commit**

```bash
git add app/server/services/xp.js app/test/xp.test.js
git commit -m "feat: SHIELD_COST y el split de XP ganado/saldo (el nivel no baja al gastar)"
```

---

### Task 3: `repairableGap` — la función pura del protector (TDD)

**Files:**
- Modify: `app/server/services/gamification.js`
- Test: `app/test/repairable-gap.test.js` (nuevo)

**Interfaces:**
- Consumes: `previousDay`/`toDayString` (internos de `gamification.js`).
- Produces: **`repairableGap(activeDays, protectedDays, today, windowDays) → { days: ["YYYY-MM-DD", …] } | null`**. `activeDays`/`protectedDays` son `Set` (o arrays) de strings; `today` es un string `"YYYY-MM-DD"`. Devuelve el hueco reparable inmediatamente detrás de la racha actual, o `null`. **PURA.** La Task 4 la consume.

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/repairable-gap.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { repairableGap } from "../server/services/gamification.js";

const W = 2;
const set = (...d) => new Set(d);

test("un hueco de 1 día, con actividad hoy, es reparable", () => {
  // activo el 8, falta el 9, activo el 10 (hoy)
  const g = repairableGap(set("2026-07-08", "2026-07-10"), set(), "2026-07-10", W);
  assert.deepEqual(g, { days: ["2026-07-09"] });
});

test("un hueco de 2 días con ancla dentro de la ventana es reparable", () => {
  // activo el 8, faltan 9 y 10, activo el 11 (hoy)
  const g = repairableGap(set("2026-07-08", "2026-07-11"), set(), "2026-07-11", W);
  assert.deepEqual(g, { days: ["2026-07-09", "2026-07-10"] });
});

test("3 días seguidos faltando: el ancla queda fuera de la ventana, no reparable", () => {
  // activo el 8, faltan 9,10,11, activo el 12 (hoy)
  const g = repairableGap(set("2026-07-08", "2026-07-12"), set(), "2026-07-12", W);
  assert.equal(g, null);
});

test("no se puede fabricar una racha de la nada", () => {
  // solo activo hoy, todo lo demás vacío
  const g = repairableGap(set("2026-07-10"), set(), "2026-07-10", W);
  assert.equal(g, null);
});

test("racha larga y sana: el hueco de detrás es antiguo, nada que reparar", () => {
  const g = repairableGap(set("2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"), set(), "2026-07-10", W);
  assert.equal(g, null);
});

test("sin actividad hoy ni ayer: no hay racha viva que proteger", () => {
  // activo el 8, hoy es el 11 (ni 10 ni 11 activos)
  const g = repairableGap(set("2026-07-08"), set(), "2026-07-11", W);
  assert.equal(g, null);
});

test("hoy sin actividad pero ayer sí, con hueco fresco detrás: reparable", () => {
  // activo el 8, falta el 9, activo el 10, hoy es el 11 (sin actividad hoy)
  const g = repairableGap(set("2026-07-08", "2026-07-10"), set(), "2026-07-11", W);
  assert.deepEqual(g, { days: ["2026-07-09"] });
});

test("un día ya protegido cuenta como crédito: cierra el hueco", () => {
  // activo el 8 y el 10 (hoy), el 9 ya está protegido -> no hay hueco reparable
  const g = repairableGap(set("2026-07-08", "2026-07-10"), set("2026-07-09"), "2026-07-10", W);
  assert.equal(g, null);
});

test("borde exacto de la ventana: el día a windowDays de distancia sí entra", () => {
  // hoy 12; activo 12; falta 11; falta 10 (a 2 días, borde); activo 9 (ancla)
  const g = repairableGap(set("2026-07-09", "2026-07-12"), set(), "2026-07-12", W);
  assert.deepEqual(g, { days: ["2026-07-10", "2026-07-11"] });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node --test test/repairable-gap.test.js` (desde `app/`)
Expected: FAIL — `repairableGap` no exportado.

- [ ] **Step 3: Implementar**

En `app/server/services/gamification.js`, añadir al final. El `previousDay` ya existe en el archivo (es privado); reutilízalo:

```js
// Distancia en días entre dos "YYYY-MM-DD" (today - day). UTC para no tropezar con el horario de verano.
function daysBetween(dayStr, todayStr) {
  const [y1, m1, d1] = dayStr.split("-").map(Number);
  const [y2, m2, d2] = todayStr.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

// El hueco reparable inmediatamente detrás de la racha actual, o null. Un día "cuenta" si tuviste
// actividad O lo protegiste. Tres guardas lo hacen honesto:
//   1. Sin actividad hoy ni ayer -> no hay racha viva -> null.
//   2. El hueco solo se recoge dentro de la ventana (today - día <= windowDays).
//   3. Reparable SOLO si el hueco topa con un día con crédito (un ancla: hubo racha antes). Si se
//      acaba la ventana antes del ancla -> null. Esto bloquea fabricar una racha de la nada.
export function repairableGap(activeDays, protectedDays, today, windowDays) {
  const credited = new Set([...activeDays, ...protectedDays]);
  let cursor = credited.has(today) ? today : previousDay(today);
  if (!credited.has(cursor)) return null; // guarda 1
  while (credited.has(previousDay(cursor))) cursor = previousDay(cursor);
  const streakStart = cursor;
  const gap = [];
  let d = previousDay(streakStart);
  while (!credited.has(d) && daysBetween(d, today) <= windowDays) { // guarda 2
    gap.push(d);
    d = previousDay(d);
  }
  if (gap.length === 0) return null;
  if (!credited.has(d)) return null; // guarda 3: se acabó la ventana antes del ancla
  return { days: gap.reverse() };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **117/117 pass** (108 + 9 nuevos).

- [ ] **Step 5: Commit**

```bash
git add app/server/services/gamification.js app/test/repairable-gap.test.js
git commit -m "feat: repairableGap, el hueco de racha reparable (con ancla y ventana honestas)"
```

---

### Task 4: El servicio de racha (async, TDD) + los días protegidos cuentan en los logros

**Files:**
- Create: `app/server/services/streak.js`
- Modify: `app/server/services/metagame.js` (bestStreak sobre la unión)
- Test: `app/test/streak.test.js` (nuevo)

**Interfaces:**
- Consumes: `query`/`getPool` (`db.js`); `currentStreak`/`bestStreak`/`repairableGap`/`toDayString` (`gamification.js`); `SHIELD_COST`/`balanceXp` (`xp.js`).
- Produces:
  - **`protectedDaysFor(userId) → Promise<["YYYY-MM-DD", …]>`**
  - **`streakStateFor(userId) → Promise<{ current, best, repairable }>`** donde `repairable` es `{ days, totalCost } | null`.
  - **`balanceXpFor(userId) → Promise<número>`**
  - **`protectStreak(userId) → Promise<{ streak, balance }>`**; lanza un `Error` con `.status = 400` y mensaje en español si no hay hueco reparable o falta saldo.
  - **`PROTECT_WINDOW_DAYS = 2`** (exportado).
  Las Tasks 6, 7, 8 los consumen.

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/streak.test.js`:

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { protectedDaysFor, streakStateFor, balanceXpFor, protectStreak } from "../server/services/streak.js";
import { toDayString } from "../server/services/gamification.js";

before(async () => { await setupTestDb(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function crearUsuario() {
  const r = await query("INSERT INTO users (name, email, password_hash) VALUES ('T', 't@test.dev', 'x')");
  return r.insertId;
}
// Un día "YYYY-MM-DD" a N días de hoy (hacia atrás).
function hace(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDayString(d);
}

test("balanceXpFor resta los gastos", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, NULL, -50)", [id, id]);
  assert.equal(await balanceXpFor(id), 0);
});

test("protectStreak cobra el coste, protege el día y reconecta la racha", async () => {
  const id = await crearUsuario();
  // Actividad hace 2 días y hoy; falta ayer -> hueco de 1 día reparable.
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?), (?, 'l2', ?)",
    [id, hace(2) + " 10:00:00", id, hace(0) + " 10:00:00"]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, 'l2', 50)", [id, id]);

  const antes = await streakStateFor(id);
  assert.equal(antes.current, 1);           // solo hoy
  assert.ok(antes.repairable);
  assert.equal(antes.repairable.totalCost, 50);

  const r = await protectStreak(id);
  assert.equal(r.balance, 50);              // 100 ganados - 50 gastados
  assert.equal(r.streak.current, 3);        // hoy + ayer(protegido) + antier
  assert.equal(r.streak.repairable, null);  // ya no hay hueco
  assert.deepEqual(await protectedDaysFor(id), [hace(1)]);
});

test("protectStreak rechaza si no hay hueco reparable", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?)", [id, hace(0) + " 10:00:00"]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50)", [id]);
  await assert.rejects(() => protectStreak(id), (e) => e.status === 400);
});

test("protectStreak rechaza si el saldo no alcanza", async () => {
  const id = await crearUsuario();
  // Hueco reparable de 1 día, pero el usuario tiene 0 de saldo gastable (nunca ganó XP suelto).
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?), (?, 'l2', ?)",
    [id, hace(2) + " 10:00:00", id, hace(0) + " 10:00:00"]);
  // Solo 40 XP ganados: por debajo del coste de 50.
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 20), (?, 'l2', 20)", [id, id]);
  await assert.rejects(() => protectStreak(id), (e) => e.status === 400 && /XP/.test(e.message));
  // Y NO cobró: el saldo sigue intacto y no hay escudo.
  assert.equal(await balanceXpFor(id), 40);
  assert.deepEqual(await protectedDaysFor(id), []);
});

test("un día protegido cuenta para bestStreak (y por tanto para los logros de constancia)", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?), (?, 'l2', ?)",
    [id, hace(2) + " 10:00:00", id, hace(0) + " 10:00:00"]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, 'l2', 50)", [id, id]);
  await protectStreak(id);
  const { achievementStats } = await import("../server/services/metagame.js");
  const s = await achievementStats(id);
  assert.equal(s.bestStreak, 3); // los 3 días consecutivos, con el del medio protegido
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node --test test/streak.test.js` (desde `app/`)
Expected: FAIL — `Cannot find module '../server/services/streak.js'`.

- [ ] **Step 3: Crear `app/server/services/streak.js`**

```js
import { query, getPool } from "../db.js";
import { currentStreak, bestStreak, repairableGap, toDayString } from "./gamification.js";
import { SHIELD_COST, balanceXp } from "./xp.js";

export const PROTECT_WINDOW_DAYS = 2;

export async function protectedDaysFor(userId) {
  const rows = await query("SELECT protected_day FROM streak_shields WHERE user_id = ?", [userId]);
  return rows.map((r) => toDayString(r.protected_day));
}

export async function balanceXpFor(userId) {
  const rows = await query("SELECT amount FROM xp_events WHERE user_id = ?", [userId]);
  return balanceXp(rows);
}

// Un día cuenta si tuviste actividad O lo protegiste: se le pasa la unión a las funciones puras,
// que no cambian por dentro.
export async function streakStateFor(userId) {
  const completions = await query("SELECT completed_at FROM lesson_completions WHERE user_id = ?", [userId]);
  const activeDays = completions.map((r) => toDayString(r.completed_at));
  const protectedDays = await protectedDaysFor(userId);
  const credited = [...activeDays, ...protectedDays];
  const today = toDayString(new Date());
  const gap = repairableGap(new Set(activeDays), new Set(protectedDays), today, PROTECT_WINDOW_DAYS);
  return {
    current: currentStreak(credited, today),
    best: bestStreak(credited),
    repairable: gap ? { days: gap.days, totalCost: gap.days.length * SHIELD_COST } : null,
  };
}

// El servidor RECALCULA el hueco: jamás confía en qué días dice el cliente proteger.
export async function protectStreak(userId) {
  const state = await streakStateFor(userId);
  if (!state.repairable) {
    const e = new Error("Ya no puedes recuperar esta racha");
    e.status = 400;
    throw e;
  }
  const totalCost = state.repairable.totalCost;
  const balance = await balanceXpFor(userId);
  if (balance < totalCost) {
    const e = new Error("No tienes suficiente XP para proteger tu racha");
    e.status = 400;
    throw e;
  }
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    for (const day of state.repairable.days) {
      await conn.query("INSERT INTO streak_shields (user_id, protected_day) VALUES (?, ?)", [userId, day]);
    }
    await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, NULL, ?)", [userId, -totalCost]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    // Doble submit: otra petición ya protegió estos días. No cobramos de nuevo; devolvemos el estado real.
    if (!(e && e.code === "ER_DUP_ENTRY")) throw e;
  } finally {
    conn.release();
  }
  return { streak: await streakStateFor(userId), balance: await balanceXpFor(userId) };
}
```

- [ ] **Step 4: Los días protegidos cuentan en los logros (`metagame.js`)**

En `app/server/services/metagame.js`, `achievementStats` calcula `bestStreak` solo de las completaciones. Hay que unir los días protegidos. Añadir el import al principio del archivo:

```js
import { protectedDaysFor } from "./streak.js";
```

Y en `achievementStats`, donde hoy hace `bestStreak: bestStreak(completions.map((c) => toDayString(c.completed_at)))`, cambiarlo por:

```js
    bestStreak: bestStreak([...completions.map((c) => toDayString(c.completed_at)), ...(await protectedDaysFor(userId))]),
```

(Es la misma regla que en `streakStateFor`: un día protegido cuenta para la racha en todas partes.)

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **122/122 pass** (117 + 5 nuevos). Ojo con posibles imports circulares: `metagame.js` importa de `streak.js`, y `streak.js` NO importa de `metagame.js` — no hay ciclo.

- [ ] **Step 6: Commit**

```bash
git add app/server/services/streak.js app/server/services/metagame.js app/test/streak.test.js
git commit -m "feat: servicio de racha (estado, saldo, proteger) y los dias protegidos cuentan en los logros"
```

---

### Task 5: `PUT /me/daily-goal` (TDD)

**Files:**
- Modify: `app/server/routes/me.js`
- Test: `app/test/daily-goal.test.js` (nuevo)

**Interfaces:**
- Produces: **`PUT /api/me/daily-goal`** `{goal}` → `{ dailyGoal }`; 400 si `goal` no está en `[20, 50, 100, 150]`; 401 sin token. Exporta **`DAILY_GOAL_OPTIONS = [20, 50, 100, 150]`** para el test. El frontend (Task 10) lo consume.

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/daily-goal.test.js`:

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";

let app;
before(async () => { await setupTestDb(); app = createApp(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function registrar() {
  const r = await request(app).post("/api/auth/register").send({ name: "Ana", email: "ana@test.dev", password: "secreto1" });
  return r.body.token;
}

test("sin token, 401", async () => {
  const r = await request(app).put("/api/me/daily-goal").send({ goal: 100 });
  assert.equal(r.status, 401);
});

test("una meta válida se guarda", async () => {
  const token = await registrar();
  const r = await request(app).put("/api/me/daily-goal").set("Authorization", "Bearer " + token).send({ goal: 100 });
  assert.equal(r.status, 200);
  assert.equal(r.body.dailyGoal, 100);
  const [u] = await query("SELECT daily_goal FROM users WHERE email = 'ana@test.dev'");
  assert.equal(u.daily_goal, 100);
});

test("una meta fuera de la escala se rechaza con 400", async () => {
  const token = await registrar();
  const r = await request(app).put("/api/me/daily-goal").set("Authorization", "Bearer " + token).send({ goal: 77 });
  assert.equal(r.status, 400);
  // Y no cambió el default.
  const [u] = await query("SELECT daily_goal FROM users WHERE email = 'ana@test.dev'");
  assert.equal(u.daily_goal, 50);
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node --test test/daily-goal.test.js` (desde `app/`)
Expected: FAIL — 404 en `PUT /api/me/daily-goal`.

- [ ] **Step 3: Implementar en `app/server/routes/me.js`**

Añadir tras la línea `const router = Router();`:

```js
export const DAILY_GOAL_OPTIONS = [20, 50, 100, 150];

router.put("/daily-goal", async (req, res, next) => {
  try {
    const goal = req.body && req.body.goal;
    if (!DAILY_GOAL_OPTIONS.includes(goal)) {
      return res.status(400).json({ error: "Esa meta no es válida" });
    }
    await query("UPDATE users SET daily_goal = ? WHERE id = ?", [goal, req.userId]);
    res.json({ dailyGoal: goal });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **125/125 pass** (122 + 3 nuevos).

- [ ] **Step 5: Commit**

```bash
git add app/server/routes/me.js app/test/daily-goal.test.js
git commit -m "feat: PUT /me/daily-goal con validacion de la escala"
```

---

### Task 6: `POST /streak/protect` (TDD)

**Files:**
- Create: `app/server/routes/streak.js`
- Modify: `app/server/index.js` (registrar la ruta)
- Test: `app/test/streak-api.test.js` (nuevo)

**Interfaces:**
- Consumes: `protectStreak` (Task 4).
- Produces: **`POST /api/streak/protect`** → `{ streak, balance }`; 400 (con `{error}` en español) si no reparable o saldo insuficiente; 401 sin token.

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/streak-api.test.js`:

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";
import { toDayString } from "../server/services/gamification.js";

let app;
before(async () => { await setupTestDb(); app = createApp(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function registrar() {
  const r = await request(app).post("/api/auth/register").send({ name: "Leo", email: "leo@test.dev", password: "secreto1" });
  return { token: r.body.token, id: r.body.user.id };
}
function hace(n) { const d = new Date(); d.setDate(d.getDate() - n); return toDayString(d); }

test("sin token, 401", async () => {
  const r = await request(app).post("/api/streak/protect");
  assert.equal(r.status, 401);
});

test("proteger un hueco reparable reconecta la racha y descuenta el saldo", async () => {
  const { token, id } = await registrar();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', ?), (?, 'l2', ?)",
    [id, hace(2) + " 10:00:00", id, hace(0) + " 10:00:00"]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, 'l2', 50)", [id, id]);

  const r = await request(app).post("/api/streak/protect").set("Authorization", "Bearer " + token);
  assert.equal(r.status, 200);
  assert.equal(r.body.streak.current, 3);
  assert.equal(r.body.streak.repairable, null);
  assert.equal(r.body.balance, 50);
});

test("sin hueco reparable, 400", async () => {
  const { token } = await registrar();
  const r = await request(app).post("/api/streak/protect").set("Authorization", "Bearer " + token);
  assert.equal(r.status, 400);
  assert.ok(r.body.error);
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node --test test/streak-api.test.js` (desde `app/`)
Expected: FAIL — 404 en `/api/streak/protect`.

- [ ] **Step 3: Crear `app/server/routes/streak.js`**

```js
import { Router } from "express";
import { protectStreak } from "../services/streak.js";

const router = Router();

router.post("/protect", async (req, res, next) => {
  try {
    const result = await protectStreak(req.userId);
    res.json(result);
  } catch (e) {
    // protectStreak marca los errores esperados con .status = 400 y un mensaje en español.
    if (e && e.status === 400) return res.status(400).json({ error: e.message });
    next(e);
  }
});

export default router;
```

- [ ] **Step 4: Registrarla en `app/server/index.js`**

Añadir el import junto a los demás routers:

```js
import streakRouter from "./routes/streak.js";
```

Y la ruta, junto a las demás protegidas (después de `/api/progress`):

```js
  app.use("/api/streak", requireAuth, streakRouter);
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **128/128 pass** (125 + 3 nuevos).

- [ ] **Step 6: Commit**

```bash
git add app/server/routes/streak.js app/server/index.js app/test/streak-api.test.js
git commit -m "feat: POST /streak/protect (recalcula el hueco en el servidor, cobra en transaccion)"
```

---

### Task 7: `/me` gana meta, XP de hoy, saldo y "miembro desde" + el split (TDD)

**Files:**
- Modify: `app/server/routes/me.js`
- Modify: `app/server/services/gamification.js` (`weeklyXp` solo positivos)
- Test: `app/test/me.test.js` (actualizar el `deepEqual` + un test nuevo)

**Interfaces:**
- Consumes: `earnedXp`/`balanceXp` (Task 2); `streakStateFor` (Task 4); `levelFor`.
- Produces: `GET /me` con `stats` ampliado: `dailyGoal`, `xpToday`, `balance`, y `xp`/`level`/`xpWeek`/`streak`/`bestStreak` derivados del **XP ganado** / la unión. `user` gana `createdAt`.

- [ ] **Step 1: Actualizar el test y añadir el nuevo**

**LEE `app/test/me.test.js` entero primero.** Tiene un `deepEqual` sobre el objeto `stats` completo que hay que ampliar (no debilitar). En el test *"usuario nuevo: stats en cero…"*, el `deepEqual` de `stats` pasa a:

```js
  assert.deepEqual(res.body.stats, {
    xp: 0, xpWeek: 0, streak: 0, bestStreak: 0,
    level: { n: 1, name: "Aprendiz", progress: 0 },
    dailyGoal: 50, xpToday: 0, balance: 0,
    activeCourses: 0, completedCourses: 0, lockedCourses: 1,
    reviewCount: 0,
  });
```

Y añadir al final del archivo (usa el `me()`/`userId`/`token` que ya están en su ámbito):

```js
test("gastar XP baja el saldo pero NO el nivel ni el xp ganado", async () => {
  // 60 XP ganados -> nivel 2 (Practicante). Luego un gasto de 50 (escudo).
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 60), (?, NULL, -50)", [userId, userId]);
  const res = await me();
  assert.equal(res.body.stats.xp, 60);          // ganado, no toca el gasto
  assert.equal(res.body.stats.balance, 10);      // saldo: 60 - 50
  assert.equal(res.body.stats.level.n, 2);       // el nivel NO baja
  assert.equal(res.body.stats.level.name, "Practicante");
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `node --test test/me.test.js` (desde `app/`)
Expected: FAIL — faltan `dailyGoal`/`xpToday`/`balance`; y el test del gasto ve `xp: 10` (suma con el negativo) en vez de 60.

- [ ] **Step 3: `weeklyXp` cuenta solo lo ganado**

En `app/server/services/gamification.js`, `weeklyXp` hoy suma `e.amount` sin filtrar el signo. Un gasto de escudo en la semana no debe restar de la "actividad". Cambiar el `reduce` para ignorar los negativos:

```js
export function weeklyXp(events, now = new Date()) {
  const cutoff = now.getTime() - 7 * DAY_MS;
  return events
    .filter((e) => e.amount > 0 && new Date(e.created_at).getTime() >= cutoff)
    .reduce((sum, e) => sum + e.amount, 0);
}
```

- [ ] **Step 4: Implementar en `app/server/routes/me.js`**

Añadir los imports:

```js
import { earnedXp, balanceXp } from "../services/xp.js";
import { streakStateFor } from "../services/streak.js";
```

Cambiar el `SELECT` de `users` para traer `created_at` y `daily_goal`:

```js
    const users = await query("SELECT id, name, email, daily_goal, created_at FROM users WHERE id = ?", [req.userId]);
```

Y reemplazar el cálculo del XP y la respuesta:

```js
    const xp = earnedXp(events);                 // ganado: alimenta el nivel y el "XP total"
    const balance = balanceXp(events);           // saldo gastable
    const lvl = levelFor(xp);
    const today = toDayString(new Date());
    const xpToday = events
      .filter((e) => e.amount > 0 && toDayString(e.created_at) === today)
      .reduce((sum, e) => sum + e.amount, 0);
    const streakState = await streakStateFor(req.userId);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, initials: initials(user.name), createdAt: user.created_at },
      stats: {
        xp,
        level: { n: lvl.n, name: lvl.name, progress: lvl.progress },
        xpWeek: weeklyXp(events),
        streak: streakState.current,
        bestStreak: streakState.best,
        dailyGoal: user.daily_goal,
        xpToday,
        balance,
        activeCourses: courses.filter((c) => c.status === "EN CURSO").length,
        completedCourses: courses.filter((c) => c.status === "COMPLETADO").length,
        lockedCourses: courses.filter((c) => c.status === "BLOQUEADO").length,
        reviewCount: await reviewCount(req.userId),
      },
      continue: await findContinue(req.userId),
    });
```

(El `days`/`currentStreak`/`bestStreak` inline de antes se eliminan: ahora la racha sale de `streakState`, que ya incluye los días protegidos. El import de `currentStreak`/`bestStreak` en `me.js` queda sin uso — quítalo; `toDayString` sí se sigue usando.)

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **129/129 pass** (128 + 1 nuevo). Cualquier otro test de `/me` que afirme sobre `stats` debe seguir pasando — solo se AÑADIERON claves; el que hacía `deepEqual` ya se actualizó.

- [ ] **Step 6: Commit**

```bash
git add app/server/routes/me.js app/server/services/gamification.js app/test/me.test.js
git commit -m "feat: /me trae meta diaria, XP de hoy, saldo y miembro-desde, con el split ganado/saldo"
```

---

### Task 8: `/progress` gana el estado de racha + el split (TDD)

**Files:**
- Modify: `app/server/routes/progress.js`
- Modify: `app/server/services/metagame.js` (`activityByDay` solo positivos)
- Test: `app/test/progress-api.test.js` (añadir tests)

**Interfaces:**
- Consumes: `earnedXp` (Task 2); `streakStateFor` (Task 4).
- Produces: `GET /progress` gana `streak: { current, best, repairable }`; `level`/`heatmap`/`weekXp` derivados del XP ganado.

- [ ] **Step 1: Escribir los tests que fallan**

En `app/test/progress-api.test.js` (LEE su cabecera para reusar `registrar`/`app`/`query`), añadir:

```js
test("/progress trae el estado de racha", async () => {
  const token = await registrar();
  const r = await request(app).get("/api/progress").set("Authorization", "Bearer " + token);
  assert.equal(r.status, 200);
  assert.equal(r.body.streak.current, 0);
  assert.equal(r.body.streak.best, 0);
  assert.equal(r.body.streak.repairable, null);
});

test("el nivel de /progress se deriva del XP GANADO, no del saldo", async () => {
  const token = await registrar();
  const [u] = await query("SELECT id FROM users WHERE email = 'ana@test.dev'");
  // 60 ganados -> nivel 2. Un gasto de 50 no debe bajar el nivel.
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 60), (?, NULL, -50)", [u.id, u.id]);
  const r = await request(app).get("/api/progress").set("Authorization", "Bearer " + token);
  assert.equal(r.body.level.n, 2);
  assert.equal(r.body.level.name, "Practicante");
});
```

(El email `ana@test.dev` es el que registra el `registrar()` de `progress-api.test.js` — verifícalo al leer el archivo; si usa otro, ajústalo.)

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `node --test test/progress-api.test.js` (desde `app/`)
Expected: FAIL — `r.body.streak` es `undefined`; y el nivel sale 1 (10 XP neto) en vez de 2.

- [ ] **Step 3: `activityByDay` cuenta solo lo ganado (el heatmap es actividad)**

En `app/server/services/metagame.js`, `activityByDay` hace `cell.xp += e.amount` para todos los eventos. Un gasto de escudo no debe restar del heatmap ni de la gráfica semanal. Cambiar esa línea:

```js
  for (const e of events) if (e.amount > 0) cell(toDayString(e.created_at)).xp += e.amount;
```

- [ ] **Step 4: Implementar en `app/server/routes/progress.js`**

Añadir los imports:

```js
import { earnedXp } from "../services/xp.js";
import { streakStateFor } from "../services/streak.js";
```

Cambiar el cálculo del XP y la respuesta:

```js
    const events = await query("SELECT amount FROM xp_events WHERE user_id = ?", [req.userId]);
    const xp = earnedXp(events); // el nivel se deriva del XP ganado, no del saldo
    const stats = await achievementStats(req.userId);
    const byDay = await activityByDay(req.userId);
    const today = new Date();
    const streak = await streakStateFor(req.userId);

    res.json({
      level: levelFor(xp),
      streak,
      achievements: achievementsFor(stats),
      heatmap: heatmapFrom(byDay, 365, today),
      weekXp: weekXpFrom(byDay, today),
    });
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **131/131 pass** (129 + 2 nuevos).

- [ ] **Step 6: Commit**

```bash
git add app/server/routes/progress.js app/server/services/metagame.js app/test/progress-api.test.js
git commit -m "feat: /progress trae el estado de racha y deriva el nivel del XP ganado"
```

---

### Task 9: Inicio gana el anillo de meta diaria y la alerta de racha

**Files:**
- Modify: `app/web/screens/InicioScreen.jsx`
- Modify: `app/web/liquid.css` (nada nuevo si reutiliza clases; si añade, antes del `@media`)

**Interfaces:**
- Consumes: `GET /me` (`stats.dailyGoal`, `stats.xpToday`), `GET /progress` (`streak.repairable`) — `InicioScreen` ya pide `/progress`; el `Progress` en anillo del KIT; `FX.countUp`; `.lg-reveal`.
- Produces: comportamiento.

- [ ] **Step 1: El anillo de meta diaria**

**LEE `app/web/screens/InicioScreen.jsx` entero.** Ya tiene una grilla de 3 `StatPanel` (Nivel/Racha/XP) y ya pide `/progress` a `setProgress`. Añade un cuarto panel con el anillo, y como la grilla es de 3 columnas, conviértela en una fila de 4 o añade el anillo aparte. La forma más limpia: un panel propio del anillo **encima** de la grilla de estadísticas. Añádelo dentro del `<div ref={rootRef}>`, tras el bloque del saludo y antes de la grilla de 3 stats:

```jsx
        <div className="lg-reveal">
          <MetaDiaria xpToday={stats.xpToday} dailyGoal={stats.dailyGoal} />
        </div>
```

Y define el componente arriba del archivo (tras `const KITI = …`), usando `Progress` en anillo:

```jsx
function MetaDiaria({ xpToday, dailyGoal }) {
  const { GlassPanel, Progress } = KITI;
  const pct = dailyGoal > 0 ? Math.min(100, Math.round((xpToday / dailyGoal) * 100)) : 0;
  const cumplida = xpToday >= dailyGoal;
  const ref = React.useRef(null);
  React.useEffect(() => { FX.countUp(ref.current, 0, xpToday, 640); }, [xpToday]);
  return (
    <GlassPanel tint="cyan" padding="var(--space-5)" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Progress value={pct} shape="ring" tone="cyan" size="lg" showLabel />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Meta diaria</div>
          <div style={{ margin: "4px 0 2px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
            <span ref={ref}>0</span> / {dailyGoal} XP
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: cumplida ? "var(--accent-cyan)" : "var(--text-secondary)" }}>
            {cumplida ? "¡Meta cumplida! Sigue así." : "XP ganado hoy. Ajústala en tu perfil."}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: La tarjeta de alerta de racha reparable**

En `InicioScreen`, `progress` (de `/progress`) trae `streak.repairable`. `InicioScreen` recibe `setTab` (para navegar). Añade la alerta tras el anillo, solo si hay hueco:

```jsx
        {progress && progress.streak && progress.streak.repairable ? (
          <div className="lg-reveal">
            <GlassPanel padding="var(--space-5)" style={{ marginBottom: 28, border: "1px solid rgba(230,175,107,0.45)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <span aria-hidden style={{ fontSize: 28 }}><KIcon d={ICONS.flame} size={26} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>Tu racha se rompió</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                    Recupérala por {progress.streak.repairable.totalCost} XP antes de que sea tarde.
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setTab("perfil")}>Ir a proteger</Button>
              </div>
            </GlassPanel>
          </div>
        ) : null}
```

(`Button` ya está desestructurado del KIT en `InicioScreen`; si no, añádelo. `KIcon`/`ICONS` son globales de `AppShell`.)

- [ ] **Step 3: Verificar E2E**

`npm test` desde `app/` → **131/131** (no tocaste backend). En el navegador (`http://localhost:3000`, cuenta `juan@test.dev`), con el trap de errores:

1. Inicio muestra el anillo de meta con `X / 50 XP` y el porcentaje.
2. Si la cuenta tiene un hueco reparable, aparece la tarjeta ámbar con el coste y "Ir a proteger"; si no, no aparece. (Para forzar un hueco: inserta actividad de hace 2 días y hoy, saltándote ayer, vía SQL directo en la BD dev — o pruébalo tras la Task 10 desde la UI.)
3. `window.__errs.length === 0`.

- [ ] **Step 4: Commit**

```bash
git add app/web/screens/InicioScreen.jsx app/web/liquid.css
git commit -m "feat: Inicio con el anillo de meta diaria y la alerta de racha reparable"
```

---

### Task 10: La página de Perfil

**Files:**
- Create: `app/web/screens/ProfileScreen.jsx`
- Modify: `app/web/index.html` (añadir el script)
- Modify: `app/web/app.jsx` (rama `perfil`)
- Modify: `app/web/screens/AppShell.jsx` (ítem "Tu perfil" en el menú del avatar)

**Interfaces:**
- Consumes: `GET /me`, `GET /progress` (`streak`), `PUT /me/daily-goal`, `POST /streak/protect`; `PageFrame`/`NavBar`/`LoadingPanel`/`ErrorPanel`/`Orb`/`KIcon`/`ICONS`; `Liquid.reveal`; `FX.burst`/`FX.sound`.
- Produces: `window.ProfileScreen`.

- [ ] **Step 1: Crear `app/web/screens/ProfileScreen.jsx`**

```jsx
const KITF = window.CodingDesignSystem_2ecb3a;

const META_NIVELES = [
  { goal: 20, label: "Relajado" },
  { goal: 50, label: "Normal" },
  { goal: 100, label: "Serio" },
  { goal: 150, label: "Intenso" },
];

function ProfileScreen({ me, tab, setTab, refreshMe }) {
  const { GlassPanel, Button, Badge } = KITF;
  const [data, setData] = React.useState(null); // /progress: para el estado de racha
  const [goal, setGoal] = React.useState(me.stats.dailyGoal);
  const [saving, setSaving] = React.useState(false);
  const [protecting, setProtecting] = React.useState(false);
  const [error, setError] = React.useState(null);
  const rootRef = React.useRef(null);
  const errorTimer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(errorTimer.current), []);
  const showError = (m) => { setError(m); clearTimeout(errorTimer.current); errorTimer.current = setTimeout(() => setError(null), 3200); };

  const load = () => { API.get("/progress").then(setData).catch(() => setData(null)); };
  React.useEffect(load, []);
  React.useEffect(() => Liquid.reveal(rootRef.current), [data]);

  const cambiarMeta = (g) => {
    if (g === goal || saving) return;
    setSaving(true);
    setGoal(g); // optimista
    API.put("/me/daily-goal", { goal: g })
      .then(() => refreshMe())
      .catch(() => setGoal(me.stats.dailyGoal))
      .finally(() => setSaving(false));
  };

  const proteger = (e) => {
    if (protecting) return;
    setProtecting(true);
    const b = e.currentTarget.getBoundingClientRect();
    API.post("/streak/protect")
      .then(() => {
        FX.burst(b.left + b.width / 2, b.top + b.height / 2);
        FX.sound.play("streak");
        load();
        refreshMe();
      })
      .catch((err) => showError(err.message))
      .finally(() => setProtecting(false));
  };

  const u = me.user;
  const desde = u.createdAt ? new Date(u.createdAt).toLocaleDateString("es", { year: "numeric", month: "long" }) : "";
  const streak = data && data.streak ? data.streak : null;

  return (
    <PageFrame>
      <NavBar onHome={() => setTab("inicio")} tab={tab} setTab={setTab} user={{ ...me.user, streak: me.stats.streak }} />
      <div ref={rootRef}>
        <h1 style={{ margin: "44px 4px 24px", fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Tu perfil</h1>

        {/* Identidad */}
        <div className="lg-reveal">
          <GlassPanel padding="var(--space-6)" style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #6FA0E0, #4E86D6)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 14px rgba(94,151,230,0.35)", fontSize: 22, fontWeight: 800, color: "var(--text-on-accent)" }}>{u.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)" }}>{u.name}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", marginTop: 2 }}>{u.email}</div>
                {desde ? <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: 4 }}>Miembro desde {desde}</div> : null}
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Meta diaria */}
        <div className="lg-reveal">
          <GlassPanel padding="var(--space-6)" style={{ marginBottom: 18 }}>
            <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Meta diaria de XP</div>
            <p style={{ margin: "0 0 16px", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>Cuánto XP quieres ganar cada día.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {META_NIVELES.map((m) => (
                <button key={m.goal} onClick={() => cambiarMeta(m.goal)} disabled={saving}
                  style={{ padding: "14px 10px", borderRadius: "var(--radius-md)", cursor: saving ? "default" : "pointer", textAlign: "center", background: goal === m.goal ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", border: "1px solid " + (goal === m.goal ? "var(--focus-ring)" : "var(--glass-stroke)"), color: "var(--text-primary)", transition: "all var(--duration-fast) var(--ease-glass)" }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--accent-cyan)", fontVariantNumeric: "tabular-nums" }}>{m.goal}</div>
                </button>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* Racha */}
        <div className="lg-reveal">
          <GlassPanel padding="var(--space-6)" style={{ marginBottom: 18 }}>
            <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Tu racha</div>
            <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--accent-amber)", fontVariantNumeric: "tabular-nums" }}>
                  <KIcon d={ICONS.flame} size={24} />{streak ? streak.current : me.stats.streak}
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>días seguidos</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{streak ? streak.best : me.stats.bestStreak}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>tu mejor racha</div>
              </div>
              <div style={{ flex: 1 }}></div>
              {streak && streak.repairable ? (
                <Button variant="secondary" disabled={protecting} onClick={proteger}>
                  {protecting ? "Protegiendo…" : "Proteger racha · " + streak.repairable.totalCost + " XP"}
                </Button>
              ) : null}
            </div>
            {streak && streak.repairable ? (
              <p style={{ margin: "12px 0 0", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                Tienes {me.stats.balance} XP de saldo. Proteger cuesta {streak.repairable.totalCost} XP y no baja tu nivel.
              </p>
            ) : null}
            {error ? <p style={{ margin: "12px 0 0", fontSize: "var(--text-sm)", color: "var(--danger)" }}>{error}</p> : null}
          </GlassPanel>
        </div>

        {/* Cerrar sesión */}
        <div className="lg-reveal">
          <Button variant="ghost" iconLeft={<KIcon d={ICONS.logout} size={14} />} onClick={() => API.logout()}>Cerrar sesión</Button>
        </div>
      </div>
    </PageFrame>
  );
}
Object.assign(window, { ProfileScreen });
```

- [ ] **Step 2: Cargarla, enrutarla y añadir el ítem del menú**

En `app/web/index.html`, tras `ProgressScreen.jsx`:

```html
<script type="text/babel" src="/screens/ProfileScreen.jsx"></script>
```

En `app/web/app.jsx`, la rama del dashboard elige por `tab`. Añadir `perfil`, pasando `refreshMe` (que es `loadMe`):

```jsx
    screen = tab === "materias"
      ? <MateriasScreen {...comun} onOpenCourse={(id) => go.course(id)} />
      : tab === "progreso"
      ? <ProgressScreen {...comun} />
      : tab === "perfil"
      ? <ProfileScreen {...comun} refreshMe={loadMe} />
      : <InicioScreen {...comun}
          onOpenLesson={(courseId, lessonId) => go.lesson(courseId, lessonId)}
          onOpenReview={go.review} />;
```

En `app/web/screens/AppShell.jsx`, `AvatarMenu` ya tiene un ítem "Tu progreso" (`onProgress`). Añade "Tu perfil" encima. Da a `AvatarMenu` una prop `onProfile` y el ítem:

```jsx
          <button role="menuitem" className="lg-menu__item" onClick={() => { setOpen(false); onProfile(); }}>
            <KIcon d={ICONS.book} size={14} />
            Tu perfil
          </button>
```

Y en `NavBar`, donde monta `<AvatarMenu … onProgress={() => setTab("progreso")} />`, añade `onProfile={() => setTab("perfil")}`.

- [ ] **Step 3: Verificar E2E**

Con el trap instalado, en `http://localhost:3000`:

1. El menú del avatar tiene "Tu perfil" y navega a la página.
2. Perfil muestra identidad (nombre, email, miembro desde), el selector de meta con el nivel actual resaltado, el panel de racha y cerrar sesión.
3. Cambiar la meta: tocar otro nivel lo resalta y persiste (recarga y sigue). Verifica el `PUT` en la red.
4. **Ciclo completo del protector** (fuérzalo por SQL en la BD dev: actividad de hace 2 días y hoy, saltándote ayer, con ≥50 XP): la alerta aparece en Inicio y en Perfil; "Proteger racha" cobra, reconecta la racha (el número sube), lanza chispas, y la alerta desaparece; el **nivel no baja** aunque el saldo sí.
5. `window.__errs.length === 0`.

- [ ] **Step 4: Commit**

```bash
git add app/web/screens/ProfileScreen.jsx app/web/index.html app/web/app.jsx app/web/screens/AppShell.jsx
git commit -m "feat: pagina de Perfil con identidad, meta diaria, panel de racha y proteger"
```

---

### Task 11: Verificación final

**Files:** ninguno (solo verificación). Si algo falla: arreglar y commitear como `fix:`.

- [ ] **Step 1: La suite entera**

Run: `npm test` (desde `app/`)
Expected: **131/131 pass** (102 originales + 29 nuevos). Pega la línea de resumen.

- [ ] **Step 2: Checklist E2E completo**

Con el trap `window.onerror` instalado tras cada recarga, contra :3000 (mata y relanza el dev server si sus respuestas parecen viejas):

1. **Meta diaria:** el anillo de Inicio llena con el XP de hoy; cambiar la meta en Perfil persiste y el anillo se recalcula.
2. **Protector:** con un hueco reparable, la alerta aparece en Inicio; "Proteger" cobra el coste correcto, reconecta la racha, y la alerta desaparece.
3. **El split:** tras proteger, el **saldo** baja pero el **nivel y el XP total NO** (compruébalo en Inicio y en Progreso).
4. **Perfil:** navega desde el menú del avatar; identidad, ajustes y cerrar sesión funcionan.
5. **Regresión:** las tres pestañas anteriores (Inicio/Materias/Progreso) siguen navegando; el toast de logro, la coreografía de gota, el ripple, los reveals y la navbar líquida siguen intactos; cerrar sesión limpia la ceremonia de logros.

- [ ] **Step 3: Reduced motion**

Cinturón JS: `FX.reducedMotion = true` → proteger no lanza chispas (`FX.burst` es no-op). Cinturón CSS: si añadiste clases nuevas a `liquid.css`, confirma que el bloque `@media` las cubre y sigue siendo el último.

- [ ] **Step 4: Anotar la verificación humana pendiente**

Añadir al ledger `.superpowers/sdd/progress.md`: el *feel* de las chispas al proteger la racha y de la evaporación de la alerta necesita un navegador en primer plano.

- [ ] **Step 5: Commit final (solo si hubo fixes)**

```bash
git add -A
git commit -m "fix: ajustes de la verificacion final de la economia"
```
