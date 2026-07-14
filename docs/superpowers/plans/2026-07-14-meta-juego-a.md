# El meta-juego, Iteración A — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dar a Coding un meta-juego — niveles, logros con toast de desbloqueo y una página de Progreso — y arreglar de paso el bug de las pestañas muertas (el router nunca lee `tab`). Spec: `docs/superpowers/specs/2026-07-14-meta-juego-a-derivado-design.md`.

**Architecture:** **todo se deriva, nada se guarda.** Cero migraciones. Tres servicios puros nuevos (`xp.js` con los importes, `levels.js`, `achievements.js`) más uno que hace las consultas (`metagame.js`); un endpoint nuevo (`GET /progress`); y el toast sale de un **diff**: `POST /answer` calcula el conjunto de logros antes y después de su transacción y devuelve la diferencia. En el frontend, `DashboardScreen` se parte en `InicioScreen` + `MateriasScreen`, nace `ProgressScreen`, y el router pasa a leer `tab`.

**Tech Stack:** Node 20 ESM + Express 4 + MariaDB (`mysql2/promise`); tests con `node:test` + `supertest`. Frontend React 18 UMD + Babel standalone, SIN build. **Cero dependencias nuevas.**

## Global Constraints

- **Todo lo derivable se calcula, nunca se almacena.** Esta iteración **NO toca el esquema**: cero tablas, cero columnas, cero migraciones.
- **`answer` y `password_hash` jamás salen por la API.** Y ahora también: **el nombre real de un logro secreto bloqueado jamás sale por la API** (si se lee en la pestaña de red, no es un secreto).
- **TDD estricto en backend:** RED (test que falla) → GREEN (implementación mínima). Cada tarea de backend empieza escribiendo el test.
- **Los 57 tests actuales deben seguir pasando.** Esta iteración no cambia ninguna regla del loop.
- **Frontend sin build:** PROHIBIDO `import`/`export` en `app/web/`; prohibido el shorthand `<>` (usar `React.Fragment`); todo se comparte vía `Object.assign(window, {...})`; **el orden de los `<script>` en `index.html` es la resolución de dependencias**.
- **`Coding Design System/` es INTOCABLE.** Sus componentes (`GlassPanel`, `Card`, `Progress`, `Badge`…) **no reenvían `className`**: toda clase de animación va en un `<div>` propio.
- **Regla de oro del DS:** `backdrop-filter` JAMÁS sobre un elemento con texto — va en un `<span aria-hidden>` absoluto con `zIndex: -1`.
- **Animaciones:** solo `transform`, `opacity`, `filter` (y las propiedades individuales `scale`/`translate`). Doble cinturón de `prefers-reduced-motion` (gate JS `FX.reducedMotion` + bloque `@media`). **Todo elemento cuyo estado base sea visible se oculta con `display: none`, nunca con `animation: none`.**
- **El "día" se deriva SIEMPRE del reloj de Node** (`toDayString`), nunca de `CURDATE()` de la BD.
- **Higiene:** timers/rAF/observers en refs, limpiados en el `useEffect` de desmontaje.
- Copy en español con tuteo, sentence case, **sin emoji**. Comentarios en español.
- Comandos desde `app/`: `npm test` (node:test + supertest contra MariaDB real, BD `coding_test`, que se crea/trunca sola), `npm start` (:3000).
- Dev server: suele estar corriendo en :3000 (EADDRINUSE ⇒ ya corre, reusarlo; los estáticos se sirven frescos del disco). Cuenta: `juan@test.dev` / `secreto1`.
- **Verificación en navegador:** instalar SIEMPRE un trap `window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));` antes de afirmar "cero errores" — `read_console_messages` NO reporta excepciones no capturadas. Y ojo: el panel corre con `document.hidden === true`, así que `IntersectionObserver` no dispara y `requestAnimationFrame` no resuelve; fuerza el estado en vez de esperar animaciones.
- Rama: `feature/meta-juego-a` (ya creada, con la spec committeada).

---

### Task 1: Los importes de XP en un solo sitio

**Files:**
- Create: `app/server/services/xp.js`
- Modify: `app/server/routes/exercises.js` (los tres literales de XP)

**Interfaces:**
- Produces: **`XP_LESSON = 50`, `XP_PERFECT = 10`, `XP_REVIEW = 5`**. Las Tasks 4 y 7 los consumen. Son críticos: los logros derivan "lecciones perfectas" y "repasos corregidos" **del importe del evento**, así que el número tiene que ser el mismo al escribirlo y al leerlo.

Esta tarea es un refactor puro: **no cambia ningún comportamiento**. Su red de seguridad son los 57 tests actuales.

- [ ] **Step 1: Crear `app/server/services/xp.js`**

```js
// Los tres importes de XP del juego. Viven en un solo sitio porque se usan en los DOS sentidos:
// al escribirlos (rutas) y al leerlos (los logros derivan "lecciones perfectas" del importe 10 y
// "repasos corregidos" del importe 5). Si divergieran, los logros mentirían en silencio.
export const XP_LESSON = 50;
export const XP_PERFECT = 10;
export const XP_REVIEW = 5;
```

- [ ] **Step 2: Usarlos en `app/server/routes/exercises.js`**

Añadir el import junto a los demás:

```js
import { XP_LESSON, XP_PERFECT, XP_REVIEW } from "../services/xp.js";
```

Y sustituir los tres literales (usando placeholders `?` para no romper el SQL parametrizado):

```js
    if (reviewCleared) {
      await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, ?)", [req.userId, ex.lesson_id, XP_REVIEW]);
      xpAwarded = XP_REVIEW;
    }
```

```js
            await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, ?)", [req.userId, ex.lesson_id, XP_LESSON]);
            if (perfect) {
              await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, ?)", [req.userId, ex.lesson_id, XP_PERFECT]);
            }
            await conn.commit();
            lessonCompleted = true;
            xpAwarded = XP_LESSON;
            perfectBonus = perfect ? XP_PERFECT : 0;
```

- [ ] **Step 3: Verificar que no rompiste nada**

Run: `npm test` (desde `app/`)
Expected: **57/57 pass**. Es un refactor sin cambio de comportamiento; cualquier fallo significa que te comiste un literal.

- [ ] **Step 4: Commit**

```bash
git add app/server/services/xp.js app/server/routes/exercises.js
git commit -m "refactor: los importes de XP viven en services/xp.js (se leen y se escriben desde ahi)"
```

---

### Task 2: Niveles (función pura, TDD)

**Files:**
- Create: `app/server/services/levels.js`
- Test: `app/test/levels.test.js`

**Interfaces:**
- Produces: **`LEVELS`** (array de 12 `{n, name, xp}`) y **`levelFor(xp)` → `{n, name, xp, xpInLevel, xpToNext, progress, next}`** donde `next` es el objeto del nivel siguiente o `null` en el último, y `progress` es 0..100 dentro del nivel actual (100 si es el último). Las Tasks 5 y 6 lo consumen.

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/levels.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, levelFor } from "../server/services/levels.js";

test("la curva es ascendente, sin huecos ni retrocesos", () => {
  assert.equal(LEVELS.length, 12);
  assert.equal(LEVELS[0].xp, 0);
  for (let i = 1; i < LEVELS.length; i++) {
    assert.equal(LEVELS[i].n, i + 1);
    assert.ok(LEVELS[i].xp > LEVELS[i - 1].xp, `el nivel ${i + 1} no supera al anterior`);
  }
  // El último nivel se alcanza justo al terminar el temario: 64 lecciones x 50 XP.
  assert.equal(LEVELS[11].xp, 3200);
  assert.equal(LEVELS[11].name, "Maestro");
});

test("sin XP eres Aprendiz al 0%", () => {
  const l = levelFor(0);
  assert.equal(l.n, 1);
  assert.equal(l.name, "Aprendiz");
  assert.equal(l.progress, 0);
  assert.equal(l.xpInLevel, 0);
  assert.equal(l.xpToNext, 50);
  assert.equal(l.next.name, "Practicante");
});

test("cada umbral exacto entra en su nivel al 0%", () => {
  for (const lvl of LEVELS) {
    const l = levelFor(lvl.xp);
    assert.equal(l.n, lvl.n, `xp ${lvl.xp} deberia ser nivel ${lvl.n}`);
    assert.equal(l.xpInLevel, 0);
  }
});

test("justo debajo de un umbral sigues en el nivel anterior", () => {
  assert.equal(levelFor(49).n, 1);
  assert.equal(levelFor(50).n, 2);
  assert.equal(levelFor(3199).n, 11);
  assert.equal(levelFor(3200).n, 12);
});

test("el progreso dentro del nivel se calcula sobre el tramo", () => {
  // Nivel 2 (Practicante) va de 50 a 150: 100 XP de tramo.
  const l = levelFor(100);
  assert.equal(l.n, 2);
  assert.equal(l.xpInLevel, 50);
  assert.equal(l.xpToNext, 50);
  assert.equal(l.progress, 50);
});

test("en el ultimo nivel no hay siguiente y el progreso es 100", () => {
  const l = levelFor(5000);
  assert.equal(l.n, 12);
  assert.equal(l.name, "Maestro");
  assert.equal(l.next, null);
  assert.equal(l.xpToNext, 0);
  assert.equal(l.progress, 100);
});

test("XP invalido o negativo no rompe: eres Aprendiz", () => {
  assert.equal(levelFor(-10).n, 1);
  assert.equal(levelFor(undefined).n, 1);
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test -- test/levels.test.js` (o `node --test test/levels.test.js` desde `app/`)
Expected: FAIL — `Cannot find module '../server/services/levels.js'`.

- [ ] **Step 3: Implementar**

Crear `app/server/services/levels.js`:

```js
// Los niveles cuentan tu carrera en el oficio, y la curva está anclada al techo real del juego:
// el último nivel se alcanza exactamente al terminar el temario (64 lecciones x 50 XP = 3200).
// Los bonus de "Perfecto" solo te llevan allí antes; el repaso solo da XP si fallas, así que un
// jugador impecable nunca lo necesita.
export const LEVELS = [
  { n: 1, name: "Aprendiz", xp: 0 },
  { n: 2, name: "Practicante", xp: 50 },
  { n: 3, name: "Junior", xp: 150 },
  { n: 4, name: "Desarrollador", xp: 300 },
  { n: 5, name: "Semi-senior", xp: 500 },
  { n: 6, name: "Senior", xp: 750 },
  { n: 7, name: "Especialista", xp: 1050 },
  { n: 8, name: "Tech lead", xp: 1400 },
  { n: 9, name: "Referente", xp: 1800 },
  { n: 10, name: "Principal", xp: 2250 },
  { n: 11, name: "Arquitecto", xp: 2700 },
  { n: 12, name: "Maestro", xp: 3200 },
];

export function levelFor(xp) {
  const total = Math.max(0, Number(xp) || 0);
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) {
    if (total >= LEVELS[k].xp) i = k;
  }
  const current = LEVELS[i];
  const next = LEVELS[i + 1] || null;
  const xpInLevel = total - current.xp;
  const xpToNext = next ? next.xp - total : 0;
  const span = next ? next.xp - current.xp : 0;
  const progress = next ? Math.round((xpInLevel / span) * 100) : 100;
  return { n: current.n, name: current.name, xp: total, xpInLevel, xpToNext, progress, next };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **64/64 pass** (los 57 de antes + los 7 nuevos).

- [ ] **Step 5: Commit**

```bash
git add app/server/services/levels.js app/test/levels.test.js
git commit -m "feat: niveles derivados del XP, de Aprendiz a Maestro"
```

---

### Task 3: Logros (catálogo + funciones puras, TDD)

**Files:**
- Create: `app/server/services/achievements.js`
- Test: `app/test/achievements.test.js`

**Interfaces:**
- Consumes: nada (es puro; recibe un objeto `stats` ya calculado).
- Produces:
  - **`ACHIEVEMENTS`**: array de 17 `{ id, name, description, secret, metric, target }`.
  - **`unlockedFor(stats)` → `Set<id>`**.
  - **`achievementsFor(stats)` → array serializable** de `{ id, name, description, secret, unlocked, current, target }`. **Un secreto bloqueado sale con `name: "???"`, `description: "Un logro secreto"`, `current: 0`, `target: 1` — su nombre real NO se serializa.**
  - **`achievementInfo(id)` → `{ id, name, description }`** con el nombre REAL (la usa la Task 7 para el toast: un secreto que acaba de caer ya no es secreto).
  - `stats` es un objeto con estas claves (la Task 4 lo produce): `lessonsDone`, `bestStreak`, `perfectLessons`, `coursesCompleted`, `reviewCleared`, `earlyBird` (bool), `nightOwl` (bool), `resurrected` (bool), `perfectRun` (número).

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/achievements.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { ACHIEVEMENTS, unlockedFor, achievementsFor, achievementInfo } from "../server/services/achievements.js";

const VACIO = {
  lessonsDone: 0, bestStreak: 0, perfectLessons: 0, coursesCompleted: 0, reviewCleared: 0,
  earlyBird: false, nightOwl: false, resurrected: false, perfectRun: 0,
};

test("el catalogo tiene 17 logros, 4 de ellos secretos, con ids unicos", () => {
  assert.equal(ACHIEVEMENTS.length, 17);
  assert.equal(ACHIEVEMENTS.filter((a) => a.secret).length, 4);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, 17);
});

test("sin actividad no hay ningun logro", () => {
  assert.equal(unlockedFor(VACIO).size, 0);
});

test("cada logro cae exactamente en su umbral, no antes", () => {
  for (const a of ACHIEVEMENTS) {
    const justo = { ...VACIO, [a.metric]: a.target };
    const debajo = { ...VACIO, [a.metric]: typeof a.target === "number" ? a.target - 1 : false };
    assert.ok(unlockedFor(justo).has(a.id), `${a.id} deberia caer con ${a.metric} = ${a.target}`);
    assert.ok(!unlockedFor(debajo).has(a.id), `${a.id} NO deberia caer por debajo del umbral`);
  }
});

test("pasarse del umbral tambien lo desbloquea", () => {
  assert.ok(unlockedFor({ ...VACIO, lessonsDone: 100 }).has("todas-las-lecciones"));
  assert.ok(unlockedFor({ ...VACIO, bestStreak: 99 }).has("racha-30"));
});

test("los booleanos secretos funcionan como umbral 1", () => {
  assert.ok(unlockedFor({ ...VACIO, earlyBird: true }).has("madrugador"));
  assert.ok(unlockedFor({ ...VACIO, nightOwl: true }).has("nocturno"));
  assert.ok(unlockedFor({ ...VACIO, resurrected: true }).has("resucitado"));
  assert.ok(unlockedFor({ ...VACIO, perfectRun: 5 }).has("impecable"));
  assert.ok(!unlockedFor({ ...VACIO, perfectRun: 4 }).has("impecable"));
});

test("el conjunto de desbloqueados nunca encoge al crecer los contadores", () => {
  const pocos = { ...VACIO, lessonsDone: 10, bestStreak: 3 };
  const muchos = { ...VACIO, lessonsDone: 30, bestStreak: 8 };
  for (const id of unlockedFor(pocos)) {
    assert.ok(unlockedFor(muchos).has(id), `${id} se perdio al progresar`);
  }
});

test("un secreto bloqueado NO filtra su nombre real por la API", () => {
  const serializado = JSON.stringify(achievementsFor(VACIO));
  for (const a of ACHIEVEMENTS.filter((x) => x.secret)) {
    assert.ok(!serializado.includes(a.name), `el secreto "${a.name}" se filtro estando bloqueado`);
    assert.ok(!serializado.includes(a.description), `la pista de "${a.name}" se filtro`);
  }
  const madrugador = achievementsFor(VACIO).find((a) => a.id === "madrugador");
  assert.equal(madrugador.name, "???");
  assert.equal(madrugador.description, "Un logro secreto");
  assert.equal(madrugador.unlocked, false);
  assert.equal(madrugador.target, 1);
});

test("un secreto desbloqueado si muestra su nombre", () => {
  const lista = achievementsFor({ ...VACIO, earlyBird: true });
  const madrugador = lista.find((a) => a.id === "madrugador");
  assert.equal(madrugador.name, "Madrugador");
  assert.equal(madrugador.unlocked, true);
  assert.equal(madrugador.current, 1);
});

test("los visibles muestran su progreso, topado en el objetivo", () => {
  const lista = achievementsFor({ ...VACIO, lessonsDone: 12 });
  const diez = lista.find((a) => a.id === "diez-lecciones");
  assert.equal(diez.unlocked, true);
  assert.equal(diez.current, 10); // topado: no dice "12 de 10"
  assert.equal(diez.target, 10);
  const veinticinco = lista.find((a) => a.id === "veinticinco-lecciones");
  assert.equal(veinticinco.unlocked, false);
  assert.equal(veinticinco.current, 12);
  assert.equal(veinticinco.target, 25);
});

test("achievementInfo devuelve el nombre REAL, tambien el de un secreto", () => {
  assert.equal(achievementInfo("madrugador").name, "Madrugador");
  assert.equal(achievementInfo("no-existe"), null);
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node --test test/achievements.test.js` (desde `app/`)
Expected: FAIL — `Cannot find module '../server/services/achievements.js'`.

- [ ] **Step 3: Implementar**

Crear `app/server/services/achievements.js`:

```js
// Los logros se DERIVAN de los contadores; no se guardan en ninguna parte. Es seguro hacerlo
// porque todos los contadores son monótonos (solo crecen), así que el conjunto de desbloqueados
// nunca encoge. Ojo: la constancia se mide contra la MEJOR racha histórica, no la actual — perder
// la racha no te quita el logro.
export const ACHIEVEMENTS = [
  // Volumen
  { id: "primera-leccion", name: "Primer paso", description: "Completa tu primera lección", secret: false, metric: "lessonsDone", target: 1 },
  { id: "diez-lecciones", name: "Tomando ritmo", description: "Completa 10 lecciones", secret: false, metric: "lessonsDone", target: 10 },
  { id: "veinticinco-lecciones", name: "Medio camino", description: "Completa 25 lecciones", secret: false, metric: "lessonsDone", target: 25 },
  { id: "todas-las-lecciones", name: "Sin dejar una", description: "Completa las 64 lecciones", secret: false, metric: "lessonsDone", target: 64 },
  // Constancia
  { id: "racha-3", name: "Tres días seguidos", description: "Estudia 3 días seguidos", secret: false, metric: "bestStreak", target: 3 },
  { id: "racha-7", name: "Una semana entera", description: "Estudia 7 días seguidos", secret: false, metric: "bestStreak", target: 7 },
  { id: "racha-14", name: "Dos semanas", description: "Estudia 14 días seguidos", secret: false, metric: "bestStreak", target: 14 },
  { id: "racha-30", name: "Un mes sin fallar", description: "Estudia 30 días seguidos", secret: false, metric: "bestStreak", target: 30 },
  // Oficio
  { id: "primera-perfecta", name: "Sin un error", description: "Termina una lección sin fallar ni una vez", secret: false, metric: "perfectLessons", target: 1 },
  { id: "cinco-perfectas", name: "Pulso firme", description: "Termina 5 lecciones perfectas", secret: false, metric: "perfectLessons", target: 5 },
  { id: "primer-curso", name: "Materia dominada", description: "Completa una materia entera", secret: false, metric: "coursesCompleted", target: 1 },
  { id: "todos-los-cursos", name: "El plan completo", description: "Completa las 6 materias", secret: false, metric: "coursesCompleted", target: 6 },
  // Repaso
  { id: "diez-repasos", name: "Nada se queda atrás", description: "Corrige 10 ejercicios en repaso", secret: false, metric: "reviewCleared", target: 10 },
  // Secretos — los dos de horario son disjuntos a propósito: si "madrugador" fuera "antes de las 7"
  // a secas, terminar a las 3 de la mañana caería los dos de golpe.
  { id: "madrugador", name: "Madrugador", description: "Terminaste una lección entre las 5 y las 7 de la mañana", secret: true, metric: "earlyBird", target: 1 },
  { id: "nocturno", name: "Turno de noche", description: "Terminaste una lección de madrugada, antes de las 5", secret: true, metric: "nightOwl", target: 1 },
  { id: "resucitado", name: "Segunda oportunidad", description: "Acertaste en repaso un ejercicio que habías fallado tres veces", secret: true, metric: "resurrected", target: 1 },
  { id: "impecable", name: "Racha impecable", description: "Cinco lecciones perfectas seguidas", secret: true, metric: "perfectRun", target: 5 },
];

// Number(false) = 0 y Number(true) = 1, así que los booleanos secretos funcionan como umbral 1.
function value(stats, metric) {
  return Number((stats && stats[metric]) || 0);
}

export function unlockedFor(stats) {
  return new Set(ACHIEVEMENTS.filter((a) => value(stats, a.metric) >= a.target).map((a) => a.id));
}

export function achievementsFor(stats) {
  const unlocked = unlockedFor(stats);
  return ACHIEVEMENTS.map((a) => {
    const on = unlocked.has(a.id);
    // Un secreto bloqueado no revela nada: ni su nombre, ni su pista, ni su progreso. Un secreto
    // que se puede leer en la pestaña de red no es un secreto.
    if (a.secret) {
      return on
        ? { id: a.id, name: a.name, description: a.description, secret: true, unlocked: true, current: 1, target: 1 }
        : { id: a.id, name: "???", description: "Un logro secreto", secret: true, unlocked: false, current: 0, target: 1 };
    }
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      secret: false,
      unlocked: on,
      current: Math.min(value(stats, a.metric), a.target), // topado: nunca "12 de 10"
      target: a.target,
    };
  });
}

// El nombre REAL, secretos incluidos. Solo para el toast: un secreto que acaba de caer ya no es
// secreto — es justo el momento de decir cómo se llama.
export function achievementInfo(id) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  return a ? { id: a.id, name: a.name, description: a.description } : null;
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **74/74 pass** (57 + 7 de niveles + 10 de logros).

- [ ] **Step 5: Commit**

```bash
git add app/server/services/achievements.js app/test/achievements.test.js
git commit -m "feat: catalogo de 17 logros derivados, con 4 secretos que no se filtran por la API"
```

---

### Task 4: Los contadores y la actividad por día (TDD)

**Files:**
- Create: `app/server/services/metagame.js`
- Test: `app/test/metagame.test.js`

**Interfaces:**
- Consumes: `query` (de `../db.js`), `toDayString` y `bestStreak` (de `./gamification.js`), `XP_PERFECT` y `XP_REVIEW` (de `./xp.js`, Task 1), `coursesForUser` (de `./progress.js`), `unlockedFor` (de `./achievements.js`, Task 3).
- Produces:
  - **`achievementStats(userId)` → Promise\<stats\>** con las 9 claves que consume `achievements.js`.
  - **`unlockedIds(userId)` → Promise\<Set\<id\>\>** (atajo: `unlockedFor(await achievementStats(userId))`). La Task 7 la usa para el diff.
  - **`activityByDay(userId)` → Promise\<Map\<"YYYY-MM-DD", {lessons, xp}\>\>** — una sola pasada de consultas.
  - **`heatmapFrom(byDay, days, today)` → array** (PURA) de `{day, lessons, xp}`, de hace `days-1` días hasta `today` **incluyendo los días vacíos**.
  - **`weekXpFrom(byDay, today)` → array** (PURA) de `{day, xp}`, los 7 últimos días incluido hoy.

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/metagame.test.js`. Las dos funciones puras se testean sin BD; los contadores, contra la BD real:

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { heatmapFrom, weekXpFrom, achievementStats, unlockedIds } from "../server/services/metagame.js";

// ---------- puras ----------

test("el heatmap rellena los dias vacios y termina en hoy", () => {
  const byDay = new Map([["2026-07-14", { lessons: 2, xp: 110 }]]);
  const out = heatmapFrom(byDay, 3, new Date(2026, 6, 14));
  assert.equal(out.length, 3);
  assert.deepEqual(out[0], { day: "2026-07-12", lessons: 0, xp: 0 });
  assert.deepEqual(out[1], { day: "2026-07-13", lessons: 0, xp: 0 });
  assert.deepEqual(out[2], { day: "2026-07-14", lessons: 2, xp: 110 });
});

test("la semana son 7 dias hasta hoy, con los vacios", () => {
  const byDay = new Map([["2026-07-14", { lessons: 1, xp: 50 }]]);
  const out = weekXpFrom(byDay, new Date(2026, 6, 14));
  assert.equal(out.length, 7);
  assert.equal(out[0].day, "2026-07-08");
  assert.equal(out[6].day, "2026-07-14");
  assert.equal(out[6].xp, 50);
  assert.equal(out[0].xp, 0);
});

test("el heatmap cruza el cambio de mes", () => {
  const out = heatmapFrom(new Map(), 2, new Date(2026, 6, 1));
  assert.deepEqual(out.map((c) => c.day), ["2026-06-30", "2026-07-01"]);
});

// ---------- contra la BD ----------

before(async () => { await setupTestDb(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function crearUsuario() {
  const r = await query("INSERT INTO users (name, email, password_hash) VALUES ('Test', 'stats@test.dev', 'x')");
  return r.insertId;
}

test("sin actividad, todos los contadores estan a cero", async () => {
  const id = await crearUsuario();
  const s = await achievementStats(id);
  assert.equal(s.lessonsDone, 0);
  assert.equal(s.perfectLessons, 0);
  assert.equal(s.reviewCleared, 0);
  assert.equal(s.coursesCompleted, 0);
  assert.equal(s.perfectRun, 0);
  assert.equal(s.earlyBird, false);
  assert.equal(s.nightOwl, false);
  assert.equal(s.resurrected, false);
  assert.equal((await unlockedIds(id)).size, 0);
});

test("las lecciones perfectas se derivan del importe 10 del evento de XP", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, 'l1'), (?, 'l2')", [id, id]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50), (?, 'l1', 10), (?, 'l2', 50)", [id, id, id]);
  const s = await achievementStats(id);
  assert.equal(s.lessonsDone, 2);
  assert.equal(s.perfectLessons, 1);
});

test("los repasos corregidos se derivan del importe 5", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 5), (?, 'l2', 5), (?, 'l3', 50)", [id, id, id]);
  const s = await achievementStats(id);
  assert.equal(s.reviewCleared, 2);
});

test("los secretos de horario son disjuntos: las 03:00 es nocturno, no madrugador", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', '2026-07-10 03:30:00')", [id]);
  const s = await achievementStats(id);
  assert.equal(s.nightOwl, true);
  assert.equal(s.earlyBird, false);
});

test("las 06:00 es madrugador, no nocturno", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', '2026-07-10 06:00:00')", [id]);
  const s = await achievementStats(id);
  assert.equal(s.earlyBird, true);
  assert.equal(s.nightOwl, false);
});

test("resucitado: 3 fallos y luego un acierto EN REPASO", async () => {
  const id = await crearUsuario();
  const ex = "l1-ex1";
  await query(
    "INSERT INTO answer_attempts (user_id, exercise_id, context, correct) VALUES (?,?, 'lesson', 0), (?,?, 'lesson', 0), (?,?, 'lesson', 0)",
    [id, ex, id, ex, id, ex]
  );
  let s = await achievementStats(id);
  assert.equal(s.resurrected, false, "tres fallos solos no bastan");
  await query("INSERT INTO answer_attempts (user_id, exercise_id, context, correct) VALUES (?, ?, 'review', 1)", [id, ex]);
  s = await achievementStats(id);
  assert.equal(s.resurrected, true);
});

test("perfectRun cuenta lecciones perfectas CONSECUTIVAS por orden de completado", async () => {
  const id = await crearUsuario();
  // l1 perfecta, l2 NO, l3 y l4 perfectas -> la racha maxima es 2
  await query(
    `INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES
     (?, 'l1', '2026-07-01 10:00:00'), (?, 'l2', '2026-07-02 10:00:00'),
     (?, 'l3', '2026-07-03 10:00:00'), (?, 'l4', '2026-07-04 10:00:00')`,
    [id, id, id, id]
  );
  await query(
    "INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 10), (?, 'l3', 10), (?, 'l4', 10)",
    [id, id, id]
  );
  const s = await achievementStats(id);
  assert.equal(s.perfectLessons, 3);
  assert.equal(s.perfectRun, 2);
});

test("activityByDay agrupa lecciones y XP por dia", async () => {
  const id = await crearUsuario();
  await query("INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, 'l1', '2026-07-10 10:00:00'), (?, 'l2', '2026-07-10 18:00:00')", [id, id]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount, created_at) VALUES (?, 'l1', 50, '2026-07-10 10:00:00'), (?, 'l2', 50, '2026-07-10 18:00:00')", [id, id]);
  const { activityByDay } = await import("../server/services/metagame.js");
  const map = await activityByDay(id);
  assert.deepEqual(map.get("2026-07-10"), { lessons: 2, xp: 100 });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node --test test/metagame.test.js` (desde `app/`)
Expected: FAIL — `Cannot find module '../server/services/metagame.js'`.

- [ ] **Step 3: Implementar**

Crear `app/server/services/metagame.js`:

```js
import { query } from "../db.js";
import { toDayString, bestStreak } from "./gamification.js";
import { XP_PERFECT, XP_REVIEW } from "./xp.js";
import { coursesForUser } from "./progress.js";
import { unlockedFor } from "./achievements.js";

// Los contadores de los que dependen los logros. TODOS son monótonos (solo crecen), y por eso es
// seguro derivar los logros en vez de guardarlos: el conjunto de desbloqueados nunca encoge.
export async function achievementStats(userId) {
  const completions = await query(
    "SELECT lesson_id, completed_at FROM lesson_completions WHERE user_id = ? ORDER BY completed_at",
    [userId]
  );
  const events = await query("SELECT lesson_id, amount FROM xp_events WHERE user_id = ?", [userId]);
  const courses = await coursesForUser(userId);

  // "Perfecta" y "repaso corregido" se derivan del IMPORTE del evento — por eso los importes viven
  // en services/xp.js y se usan también al escribirlos.
  const perfectIds = new Set(
    events.filter((e) => e.amount === XP_PERFECT && e.lesson_id).map((e) => e.lesson_id)
  );

  // Racha máxima de lecciones perfectas consecutivas, por orden de completado.
  let run = 0;
  let perfectRun = 0;
  for (const c of completions) {
    run = perfectIds.has(c.lesson_id) ? run + 1 : 0;
    if (run > perfectRun) perfectRun = run;
  }

  const hours = completions.map((c) => new Date(c.completed_at).getHours());

  // ¿Algún ejercicio con 3+ fallos y, después, un acierto EN REPASO?
  const [res] = await query(
    `SELECT COUNT(*) AS n FROM (
       SELECT a.exercise_id
       FROM answer_attempts a
       WHERE a.user_id = ?
       GROUP BY a.exercise_id
       HAVING SUM(a.correct = 0) >= 3 AND SUM(a.context = 'review' AND a.correct = 1) >= 1
     ) t`,
    [userId]
  );

  return {
    lessonsDone: completions.length,
    bestStreak: bestStreak(completions.map((c) => toDayString(c.completed_at))),
    perfectLessons: perfectIds.size,
    coursesCompleted: courses.filter((c) => c.status === "COMPLETADO").length,
    reviewCleared: events.filter((e) => e.amount === XP_REVIEW).length,
    // Disjuntos a propósito: el que se levanta temprano y el que aún no se ha acostado.
    earlyBird: hours.some((h) => h >= 5 && h < 7),
    nightOwl: hours.some((h) => h < 5),
    resurrected: Number(res.n) > 0,
    perfectRun,
  };
}

export async function unlockedIds(userId) {
  return unlockedFor(await achievementStats(userId));
}

// Lecciones y XP agrupados por día, en una sola pasada.
export async function activityByDay(userId) {
  const completions = await query("SELECT completed_at FROM lesson_completions WHERE user_id = ?", [userId]);
  const events = await query("SELECT amount, created_at FROM xp_events WHERE user_id = ?", [userId]);
  const byDay = new Map();
  const cell = (day) => {
    if (!byDay.has(day)) byDay.set(day, { lessons: 0, xp: 0 });
    return byDay.get(day);
  };
  for (const c of completions) cell(toDayString(c.completed_at)).lessons += 1;
  for (const e of events) cell(toDayString(e.created_at)).xp += e.amount;
  return byDay;
}

// PURA. Incluye los días vacíos para que el frontend no tenga que rellenar huecos.
export function heatmapFrom(byDay, days, today) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const day = toDayString(d);
    const cell = byDay.get(day) || { lessons: 0, xp: 0 };
    out.push({ day, lessons: cell.lessons, xp: cell.xp });
  }
  return out;
}

// PURA.
export function weekXpFrom(byDay, today) {
  return heatmapFrom(byDay, 7, today).map((c) => ({ day: c.day, xp: c.xp }));
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **85/85 pass** (74 + 11 nuevos).

- [ ] **Step 5: Commit**

```bash
git add app/server/services/metagame.js app/test/metagame.test.js
git commit -m "feat: contadores de logros y actividad por dia, todo derivado de los eventos"
```

---

### Task 5: `GET /progress` (TDD)

**Files:**
- Create: `app/server/routes/progress.js`
- Modify: `app/server/index.js` (registrar la ruta)
- Test: `app/test/progress-api.test.js`

**Interfaces:**
- Consumes: `levelFor` (Task 2), `achievementsFor` (Task 3), `achievementStats` / `activityByDay` / `heatmapFrom` / `weekXpFrom` (Task 4).
- Produces: **`GET /api/progress`** → `{ level, achievements, heatmap, weekXp }`. Requiere auth (401 sin token). El frontend (Task 9) lo consume.

**Cuidado con el nombre del archivo de test:** ya existe `app/test/progress.test.js` (para `services/progress.js`). El nuevo es **`progress-api.test.js`**.

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/progress-api.test.js`:

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb } from "./helpers.js";
import { createApp } from "../server/index.js";
import { ACHIEVEMENTS } from "../server/services/achievements.js";

let app;
before(async () => { await setupTestDb(); app = createApp(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function registrar() {
  const r = await request(app).post("/api/auth/register").send({ name: "Ana Ruiz", email: "ana@test.dev", password: "secreto1" });
  return r.body.token;
}

test("sin token, /progress responde 401", async () => {
  const r = await request(app).get("/api/progress");
  assert.equal(r.status, 401);
});

test("un usuario nuevo esta en el nivel 1 y sin logros", async () => {
  const token = await registrar();
  const r = await request(app).get("/api/progress").set("Authorization", "Bearer " + token);
  assert.equal(r.status, 200);
  assert.equal(r.body.level.n, 1);
  assert.equal(r.body.level.name, "Aprendiz");
  assert.equal(r.body.achievements.length, 17);
  assert.equal(r.body.achievements.filter((a) => a.unlocked).length, 0);
});

test("el heatmap trae 365 dias y la semana 7, con los vacios incluidos", async () => {
  const token = await registrar();
  const r = await request(app).get("/api/progress").set("Authorization", "Bearer " + token);
  assert.equal(r.body.heatmap.length, 365);
  assert.equal(r.body.weekXp.length, 7);
  // El ultimo dia del heatmap es hoy, y es el mismo que el ultimo de la semana.
  assert.equal(r.body.heatmap[364].day, r.body.weekXp[6].day);
  for (const cell of r.body.heatmap) {
    assert.equal(typeof cell.lessons, "number");
    assert.equal(typeof cell.xp, "number");
  }
});

test("los logros secretos bloqueados NO filtran su nombre por la red", async () => {
  const token = await registrar();
  const r = await request(app).get("/api/progress").set("Authorization", "Bearer " + token);
  const crudo = JSON.stringify(r.body);
  for (const a of ACHIEVEMENTS.filter((x) => x.secret)) {
    assert.ok(!crudo.includes(a.name), `el secreto "${a.name}" viajo por la red estando bloqueado`);
  }
});

test("el XP y los logros se reflejan en /progress", async () => {
  const token = await registrar();
  const [u] = await query("SELECT id FROM users WHERE email = 'ana@test.dev'");
  await query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, 'l1')", [u.id]);
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50)", [u.id]);

  const r = await request(app).get("/api/progress").set("Authorization", "Bearer " + token);
  assert.equal(r.body.level.n, 2); // 50 XP = Practicante
  assert.equal(r.body.level.name, "Practicante");
  const primer = r.body.achievements.find((a) => a.id === "primera-leccion");
  assert.equal(primer.unlocked, true);
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node --test test/progress-api.test.js` (desde `app/`)
Expected: FAIL — 404 en `/api/progress` (la ruta no existe todavía).

- [ ] **Step 3: Crear la ruta**

Crear `app/server/routes/progress.js`:

```js
import { Router } from "express";
import { query } from "../db.js";
import { levelFor } from "../services/levels.js";
import { achievementsFor } from "../services/achievements.js";
import { achievementStats, activityByDay, heatmapFrom, weekXpFrom } from "../services/metagame.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const events = await query("SELECT amount FROM xp_events WHERE user_id = ?", [req.userId]);
    const xp = events.reduce((sum, e) => sum + e.amount, 0);
    const stats = await achievementStats(req.userId);
    const byDay = await activityByDay(req.userId);
    // El "día" sale SIEMPRE del reloj de Node, nunca de CURDATE() — misma regla que la racha.
    const today = new Date();

    res.json({
      level: levelFor(xp),
      achievements: achievementsFor(stats),
      heatmap: heatmapFrom(byDay, 365, today),
      weekXp: weekXpFrom(byDay, today),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
```

- [ ] **Step 4: Registrarla en `app/server/index.js`**

Añadir el import junto a los demás routers:

```js
import progressRouter from "./routes/progress.js";
```

Y la ruta, junto a las demás protegidas (después de `/api/review`):

```js
  app.use("/api/progress", requireAuth, progressRouter);
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **90/90 pass** (85 + 5 nuevos).

- [ ] **Step 6: Commit**

```bash
git add app/server/routes/progress.js app/server/index.js app/test/progress-api.test.js
git commit -m "feat: GET /progress con nivel, logros, heatmap y semana"
```

---

### Task 6: `/me` gana el nivel (TDD)

**Files:**
- Modify: `app/server/routes/me.js`
- Test: `app/test/me.test.js` (añadir un test)

**Interfaces:**
- Consumes: `levelFor` (Task 2).
- Produces: `GET /me` → `stats.level` = `{ n, name, progress }`. Lo consume `InicioScreen` (Task 8). **El resto de la forma de `/me` no cambia**: los tests actuales siguen valiendo tal cual.

- [ ] **Step 1: Actualizar el test EXISTENTE que se va a romper, y añadir el nuevo**

**CUIDADO — el detalle que rompe esta tarea si lo pasas por alto:** `app/test/me.test.js:31` hace un **`deepEqual` sobre el objeto `stats` ENTERO**. Añadir `level` lo rompe. No es un fallo tuyo: hay que actualizar esa aserción a la nueva forma.

En `app/test/me.test.js`, sustituir el `deepEqual` del test *"usuario nuevo: stats en cero y continue apunta a bd1/l1"* por:

```js
  assert.deepEqual(res.body.stats, {
    xp: 0, xpWeek: 0, streak: 0, bestStreak: 0,
    level: { n: 1, name: "Aprendiz", progress: 0 },
    activeCourses: 0, completedCourses: 0, lockedCourses: 1,
    reviewCount: 0,
  });
```

**El orden de las claves da igual** (`deepEqual` no lo mira), pero el conjunto debe coincidir exactamente.

Y añadir al final del archivo un test nuevo (el archivo ya tiene `app`, `token`, `userId` y el helper `me()` en su ámbito — úsalos, no crees otros):

```js
test("/me trae el nivel derivado del XP", async () => {
  await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, 'l1', 50)", [userId]);
  const res = await me();
  assert.equal(res.status, 200);
  assert.equal(res.body.stats.level.n, 2);
  assert.equal(res.body.stats.level.name, "Practicante");
  assert.equal(res.body.stats.level.progress, 0); // 50 XP es justo el umbral de Practicante
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node --test test/me.test.js` (desde `app/`)
Expected: FAIL — `r.body.stats.level` es `undefined`.

- [ ] **Step 3: Implementar**

En `app/server/routes/me.js`, añadir el import:

```js
import { levelFor } from "../services/levels.js";
```

Y dentro del handler, calcular el XP una sola vez y añadir `level` a `stats` (el XP ya se calcula ahí; extráelo a una constante):

```js
    const xp = events.reduce((sum, e) => sum + e.amount, 0);
    const lvl = levelFor(xp);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, initials: initials(user.name) },
      stats: {
        xp,
        level: { n: lvl.n, name: lvl.name, progress: lvl.progress },
        xpWeek: weeklyXp(events),
        streak: currentStreak(days, toDayString(new Date())),
        bestStreak: bestStreak(days),
        activeCourses: courses.filter((c) => c.status === "EN CURSO").length,
        completedCourses: courses.filter((c) => c.status === "COMPLETADO").length,
        lockedCourses: courses.filter((c) => c.status === "BLOQUEADO").length,
        reviewCount: await reviewCount(req.userId),
      },
      continue: await findContinue(req.userId),
    });
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **91/91 pass**. Ojo: el test *"usuario nuevo: stats en cero"* solo pasa si actualizaste su `deepEqual` en el Step 1 — es la única aserción existente que la nueva clave rompe.

- [ ] **Step 5: Commit**

```bash
git add app/server/routes/me.js app/test/me.test.js
git commit -m "feat: /me trae el nivel derivado del XP"
```

---

### Task 7: El diff de logros en `POST /answer` (TDD)

**Files:**
- Modify: `app/server/routes/exercises.js`
- Test: `app/test/achievements-api.test.js` (nuevo)

**Interfaces:**
- Consumes: `unlockedIds(userId)` (Task 4), `achievementInfo(id)` (Task 3).
- Produces: `POST /api/exercises/:id/answer` → nuevo campo **`achievementsUnlocked: [{ id, name, description }]`** (array vacío en el caso normal). **Los secretos recién caídos SÍ salen con su nombre real** — acaban de dejar de ser secretos. Lo consumen `LessonScreen`/`ReviewScreen` (Task 10).

**La clave:** el conjunto "antes" hay que calcularlo **antes de insertar el intento**, porque el logro `resucitado` depende de los intentos. Y solo hace falta si la respuesta es **correcta**: una respuesta incorrecta no puede desbloquear nada (todos los contadores son monótonos y ninguno crece al fallar).

- [ ] **Step 1: Escribir el test que falla**

Crear `app/test/achievements-api.test.js`:

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb, correctResponseFor, wrongResponseFor } from "./helpers.js";
import { createApp } from "../server/index.js";

let app;
before(async () => { await setupTestDb(); app = createApp(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function registrar() {
  const r = await request(app).post("/api/auth/register").send({ name: "Leo Diaz", email: "leo@test.dev", password: "secreto1" });
  return r.body.token;
}

async function ejerciciosDe(lessonId) {
  return query("SELECT id FROM exercises WHERE lesson_id = ? ORDER BY order_index", [lessonId]);
}

async function responder(token, exerciseId, body) {
  return request(app).post("/api/exercises/" + exerciseId + "/answer").set("Authorization", "Bearer " + token).send(body);
}

test("una respuesta que no completa nada no desbloquea logros", async () => {
  const token = await registrar();
  const [ex1] = await ejerciciosDe("l1");
  const r = await responder(token, ex1.id, { response: await correctResponseFor(ex1.id) });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.achievementsUnlocked, []);
});

test("una respuesta INCORRECTA nunca desbloquea nada", async () => {
  const token = await registrar();
  const [ex1] = await ejerciciosDe("l1");
  const r = await responder(token, ex1.id, { response: await wrongResponseFor(ex1.id) });
  assert.equal(r.body.correct, false);
  assert.deepEqual(r.body.achievementsUnlocked, []);
});

test("completar la primera leccion desbloquea 'Primer paso' Y 'Sin un error' de golpe", async () => {
  const token = await registrar();
  const ejercicios = await ejerciciosDe("l1");
  // Todos correctos a la primera: la leccion queda perfecta.
  let ultima;
  for (const ex of ejercicios) {
    ultima = await responder(token, ex.id, { response: await correctResponseFor(ex.id) });
  }
  assert.equal(ultima.body.lessonCompleted, true);
  const ids = ultima.body.achievementsUnlocked.map((a) => a.id).sort();
  assert.deepEqual(ids, ["primera-leccion", "primera-perfecta"]);
  // Vienen con su nombre real, listos para el toast.
  const primer = ultima.body.achievementsUnlocked.find((a) => a.id === "primera-leccion");
  assert.equal(primer.name, "Primer paso");
  assert.ok(primer.description.length > 0);
});

test("fallar en la leccion la deja imperfecta: solo cae 'Primer paso'", async () => {
  const token = await registrar();
  const ejercicios = await ejerciciosDe("l1");
  // Fallamos el primero adrede, luego acertamos todo.
  await responder(token, ejercicios[0].id, { response: await wrongResponseFor(ejercicios[0].id) });
  let ultima;
  for (const ex of ejercicios) {
    ultima = await responder(token, ex.id, { response: await correctResponseFor(ex.id) });
  }
  assert.equal(ultima.body.lessonCompleted, true);
  assert.deepEqual(ultima.body.achievementsUnlocked.map((a) => a.id), ["primera-leccion"]);
});

test("un logro solo se anuncia UNA vez: rehacer la leccion no lo repite", async () => {
  const token = await registrar();
  const ejercicios = await ejerciciosDe("l1");
  for (const ex of ejercicios) {
    await responder(token, ex.id, { response: await correctResponseFor(ex.id) });
  }
  // Segunda pasada por la misma leccion, ya completada.
  const otra = await responder(token, ejercicios[0].id, { response: await correctResponseFor(ejercicios[0].id) });
  assert.deepEqual(otra.body.achievementsUnlocked, []);
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node --test test/achievements-api.test.js` (desde `app/`)
Expected: FAIL — `achievementsUnlocked` es `undefined`.

- [ ] **Step 3: Implementar en `app/server/routes/exercises.js`**

Añadir los imports:

```js
import { unlockedIds } from "../services/metagame.js";
import { achievementInfo } from "../services/achievements.js";
```

Justo **después** de la validación (`if (!valid) return …`) y **antes** del `INSERT INTO answer_attempts`, capturar el "antes":

```js
    // El conjunto ANTES de tocar nada. Solo hace falta si la respuesta es correcta: los contadores
    // de los logros son monótonos y ninguno crece al fallar, así que una respuesta incorrecta no
    // puede desbloquear nada. Va antes del INSERT del intento porque "resucitado" mira los intentos.
    const antes = correct ? await unlockedIds(req.userId) : null;
```

Y justo **antes** del `res.json(...)`, calcular el diff:

```js
    let achievementsUnlocked = [];
    if (antes) {
      const despues = await unlockedIds(req.userId);
      achievementsUnlocked = [...despues]
        .filter((id) => !antes.has(id))
        .map(achievementInfo)
        .filter(Boolean);
    }
```

Y añadir el campo a la respuesta (el resto del objeto no cambia):

```js
    res.json({
      correct,
      explanation: correct ? ex.explain_ok : ex.explain_bad,
      lessonCompleted,
      xpAwarded,
      perfectBonus,
      streak,
      courseProgress: detail.progress,
      nextLessonId: nextLesson,
      reviewCleared,
      achievementsUnlocked,
    });
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test` (desde `app/`)
Expected: **96/96 pass** (91 + 5 nuevos). Los tests de `exercises.test.js` siguen pasando: solo se ha AÑADIDO un campo a la respuesta.

- [ ] **Step 5: Commit**

```bash
git add app/server/routes/exercises.js app/test/achievements-api.test.js
git commit -m "feat: POST /answer anuncia los logros recien desbloqueados (diff antes/despues)"
```

---

### Task 8: Las pestañas navegan de verdad — Inicio y Materias

**Files:**
- Create: `app/web/screens/InicioScreen.jsx`
- Create: `app/web/screens/MateriasScreen.jsx`
- Delete: `app/web/screens/DashboardScreen.jsx`
- Modify: `app/web/index.html` (orden de scripts)
- Modify: `app/web/app.jsx` (el router lee `tab`)

**Interfaces:**
- Consumes: `GET /me` con `stats.level` (Task 6); `window.Liquid.reveal` y la clase `.lg-reveal` (ya existen); `PageFrame`, `NavBar`, `LoadingPanel`, `ErrorPanel`, `KIcon`, `ICONS` (de `AppShell.jsx`); `Orb`.
- Produces: `window.InicioScreen`, `window.MateriasScreen`. **Aquí muere el bug de las pestañas muertas.**

**El bug, explicado:** `app.jsx` pasa `tab`/`setTab` a las pantallas, que lo pasan a la `NavBar`… y **nadie lo lee nunca**. El router decide la pantalla solo por `route.screen`. Por eso las tres pestañas no llevan a ningún lado.

- [ ] **Step 1: Crear `app/web/screens/MateriasScreen.jsx`**

Se lleva `CourseCard` (que hoy vive en `DashboardScreen.jsx` — **léelo y cópialo tal cual**, no lo reescribas) y la parrilla de cursos:

```jsx
const KITM = window.CodingDesignSystem_2ecb3a;

// CourseCard: cópialo VERBATIM desde app/web/screens/DashboardScreen.jsx (la función entera,
// cambiando solo el alias del KIT de KITD a KITM). No la reescribas de memoria.

function MateriasScreen({ me, onOpenCourse, tab, setTab }) {
  const [courses, setCourses] = React.useState(null);
  const [error, setError] = React.useState(null);
  const rootRef = React.useRef(null);

  const load = () => {
    setError(null);
    API.get("/courses").then(setCourses).catch((e) => setError(e.message));
  };
  React.useEffect(load, []);
  React.useEffect(() => Liquid.reveal(rootRef.current), [courses]);

  return (
    <PageFrame>
      <NavBar onHome={() => setTab("inicio")} tab={tab} setTab={setTab} user={{ ...me.user, streak: me.stats.streak }} />
      <div ref={rootRef}>
        <div style={{ margin: "44px 4px 24px" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Tus materias</h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>
            {me.stats.completedCourses} completadas · {me.stats.activeCourses} en curso · {me.stats.lockedCourses} bloqueadas
          </p>
        </div>
        {error ? (
          <ErrorPanel message={error} onRetry={load} />
        ) : !courses ? (
          <LoadingPanel />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            {courses.map((c) => (
              <div key={c.id} className="lg-reveal">
                <CourseCard course={c} onOpen={onOpenCourse} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
Object.assign(window, { MateriasScreen, CourseCard });
```

(La parrilla pasa de 3 columnas a **2**: al no competir con las estadísticas, las tarjetas respiran.)

- [ ] **Step 2: Crear `app/web/screens/InicioScreen.jsx`**

**Tu hoy.** Lleva el nivel, las estadísticas, "Continúa donde quedaste", la tarjeta de repaso y el bloque "Estás cerca de…". **Ya NO lleva la parrilla de materias.** Los bloques de estadísticas, continuar y repaso se copian tal cual del `DashboardScreen.jsx` actual (léelo).

```jsx
const KITI = window.CodingDesignSystem_2ecb3a;

// StatPanel: cópialo VERBATIM desde app/web/screens/DashboardScreen.jsx (cambiando el alias del KIT).

// Los 3 logros bloqueados más cerca de caer. El enfoque derivado no guarda fechas de desbloqueo,
// así que "tus últimos logros" no existe — y esto motiva más: lo que te hace volver mañana es lo
// que casi tienes, no lo que ya ganaste.
function CercaDeCaer({ achievements }) {
  const { GlassPanel, Progress } = KITI;
  if (!achievements) return null;
  const cerca = achievements
    .filter((a) => !a.unlocked && !a.secret && a.target > 0)
    .sort((x, y) => y.current / y.target - x.current / x.target)
    .slice(0, 3);
  const ganados = achievements.filter((a) => a.unlocked).length;
  if (!cerca.length) return null;
  return (
    <div className="lg-reveal">
      <GlassPanel padding="var(--space-5)" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>Estás cerca de…</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{ganados} de {achievements.length} logros</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cerca.map((a) => (
            <div key={a.id}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", marginBottom: 5 }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{a.name}</span>
                <span style={{ color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{a.current} de {a.target}</span>
              </div>
              <Progress value={Math.round((a.current / a.target) * 100)} tone="cyan" />
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

function InicioScreen({ me, onOpenLesson, onOpenReview, tab, setTab }) {
  const { Button } = KITI;
  const [progress, setProgress] = React.useState(null);
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    API.get("/progress").then(setProgress).catch(() => setProgress(null)); // si falla, Inicio sigue usable
  }, []);
  React.useEffect(() => Liquid.reveal(rootRef.current), [progress, me.stats.reviewCount]);

  const stats = me.stats;
  const cont = me.continue;
  const lvl = stats.level;

  return (
    <PageFrame>
      <NavBar onHome={() => setTab("inicio")} tab={tab} setTab={setTab} user={{ ...me.user, streak: stats.streak }} />
      <div ref={rootRef}>
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
          <div className="lg-reveal">
            <StatPanel label="Nivel" value={lvl ? lvl.n + " · " + lvl.name : "—"} sub={lvl ? lvl.progress + "% hacia el siguiente" : ""} tone="violet" />
          </div>
          <div className="lg-reveal">
            <StatPanel label="Racha" value={stats.streak + (stats.streak === 1 ? " día" : " días")} sub={"Tu mejor racha: " + stats.bestStreak + (stats.bestStreak === 1 ? " día" : " días")} tone="none" />
          </div>
          <div className="lg-reveal">
            <StatPanel label="XP total" value={stats.xp.toLocaleString("es")} sub={"+" + stats.xpWeek + " esta semana"} tone="blue" />
          </div>
        </div>

        {/* Tarjeta de repaso: cópiala VERBATIM del DashboardScreen.jsx actual (el bloque
            me.stats.reviewCount > 0 entero, con su wrapper .lg-reveal). */}

        <CercaDeCaer achievements={progress ? progress.achievements : null} />
      </div>
    </PageFrame>
  );
}
Object.assign(window, { InicioScreen });
```

- [ ] **Step 3: Borrar `DashboardScreen.jsx` y actualizar `index.html`**

```bash
git rm app/web/screens/DashboardScreen.jsx
```

En `app/web/index.html`, sustituir la línea de DashboardScreen por las dos nuevas. **El orden importa** (`MateriasScreen` define `CourseCard`, que nadie más usa; `InicioScreen` usa `StatPanel`, que define él mismo). Queda:

```html
<script type="text/babel" src="/screens/Orb.jsx"></script>
<script type="text/babel" src="/screens/AppShell.jsx"></script>
<script type="text/babel" src="/screens/LoginScreen.jsx"></script>
<script type="text/babel" src="/screens/InicioScreen.jsx"></script>
<script type="text/babel" src="/screens/MateriasScreen.jsx"></script>
<script type="text/babel" src="/screens/CourseScreen.jsx"></script>
<script type="text/babel" src="/screens/exercises.jsx"></script>
<script type="text/babel" src="/screens/LessonScreen.jsx"></script>
<script type="text/babel" src="/screens/ReviewScreen.jsx"></script>
<script type="text/babel" src="/app.jsx"></script>
```

(`ProgressScreen.jsx` lo añade la Task 9.)

- [ ] **Step 4: El router lee `tab` (`app/web/app.jsx`)**

Añadir `goTab` junto a `go`, y usarlo como `setTab` en TODAS las pantallas:

```jsx
  // Las pestañas SON navegación: cambiar de pestaña te devuelve al área principal desde donde estés.
  const goTab = (id) => { setTab(id); setRoute({ screen: "dashboard" }); };
```

Y cambiar la rama del dashboard del router:

```jsx
  } else {
    const comun = { me, tab, setTab: goTab };
    screen = tab === "materias"
      ? <MateriasScreen {...comun} onOpenCourse={(id) => go.course(id)} />
      : <InicioScreen {...comun}
          onOpenLesson={(courseId, lessonId) => go.lesson(courseId, lessonId)}
          onOpenReview={go.review} />;
  }
```

**Importante:** las demás pantallas (`CourseScreen`, `LessonScreen`, `ReviewScreen`) también deben recibir **`setTab={goTab}`** en vez de `setTab={setTab}`, para que las pestañas funcionen desde dentro de una lección. Cámbialo en sus cuatro llamadas.

Y la `key` del div de pantalla debe incluir el `tab`, para que cambiar de pestaña reproduzca la transición:

```jsx
      <div key={route.screen + ":" + tab + ":" + (route.lessonId || route.courseId || "")} className="anim-screen-in">
```

- [ ] **Step 5: Verificar E2E**

`npm test` desde `app/` → **96/96** (no tocaste el backend).

En el navegador (`http://localhost:3000`, `juan@test.dev` / `secreto1`), con el trap `window.onerror` instalado:

1. Las pestañas **Inicio** y **Materias** navegan de verdad (antes no hacían nada).
2. Inicio muestra el nivel (`Nivel 6 · Senior` o el que toque), la racha, el XP y "Estás cerca de…" con 3 logros y sus barras.
3. Materias muestra las 6 tarjetas en 2 columnas y se puede entrar a un curso.
4. Desde dentro de una lección, tocar "Materias" te saca al catálogo.
5. `window.__errs.length === 0`.

- [ ] **Step 6: Commit**

```bash
git add -A app/web
git commit -m "feat: las pestanas navegan de verdad; el dashboard se parte en Inicio y Materias"
```

---

### Task 9: La página de Progreso

**Files:**
- Create: `app/web/screens/ProgressScreen.jsx`
- Modify: `app/web/index.html` (añadir el script)
- Modify: `app/web/app.jsx` (la rama `progreso` del router)
- Modify: `app/web/liquid.css` (heatmap y gráfica)

**Interfaces:**
- Consumes: `GET /progress` (Task 5) → `{ level, achievements, heatmap, weekXp }`; `Liquid.reveal`; `PageFrame`/`NavBar`.
- Produces: `window.ProgressScreen`.

**Sin librerías:** el heatmap es una grilla de divs y la gráfica son 7 divs con `height` en %. Cero dependencias.

- [ ] **Step 1: Añadir el CSS a `app/web/liquid.css`**

Insertar ANTES del bloque `@media (prefers-reduced-motion: reduce)` (que debe seguir siendo el último):

```css
/* ---------- Progreso: heatmap y gráfica semanal (cero librerías) ---------- */
.lg-heat {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 1fr);
  gap: 3px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.lg-heat__cell {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  background: var(--glass-bg-subtle);
}
.lg-heat__cell--1 { background: rgba(82, 201, 184, 0.30); }
.lg-heat__cell--2 { background: rgba(82, 201, 184, 0.55); }
.lg-heat__cell--3 { background: rgba(82, 201, 184, 0.85); box-shadow: 0 0 8px rgba(82, 201, 184, 0.35); }

.lg-bars { display: flex; align-items: flex-end; gap: 10px; height: 140px; }
.lg-bars__col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; height: 100%; }
.lg-bars__bar {
  width: 100%;
  min-height: 3px;
  border-radius: var(--radius-sm) var(--radius-sm) 3px 3px;
  background: linear-gradient(180deg, rgba(94, 151, 230, 0.85), rgba(82, 201, 184, 0.55));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transform-origin: bottom center;
  transition: height var(--duration-slow) var(--ease-out);
}
```

- [ ] **Step 2: Crear `app/web/screens/ProgressScreen.jsx`**

```jsx
const KITP = window.CodingDesignSystem_2ecb3a;

function Heatmap({ cells }) {
  // 0 lecciones -> apagado; 1, 2, 3+ -> tres intensidades de cian.
  const nivel = (n) => (n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3);
  return (
    <div className="lg-heat">
      {cells.map((c) => (
        <span key={c.day} className={"lg-heat__cell lg-heat__cell--" + nivel(c.lessons)}
          title={c.lessons + (c.lessons === 1 ? " lección" : " lecciones") + " · " + c.xp + " XP · " + c.day}></span>
      ))}
    </div>
  );
}

function SemanaXp({ dias }) {
  const max = Math.max(1, ...dias.map((d) => d.xp)); // nunca dividimos por cero
  const nombre = (day) => {
    const [y, m, d] = day.split("-").map(Number);
    return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][new Date(y, m - 1, d).getDay()];
  };
  return (
    <div>
      <div className="lg-bars">
        {dias.map((d) => (
          <div key={d.day} className="lg-bars__col">
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{d.xp || ""}</span>
            <div className="lg-bars__bar" style={{ height: Math.round((d.xp / max) * 100) + "%" }}></div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        {dias.map((d) => (
          <div key={d.day} style={{ flex: 1, textAlign: "center", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{nombre(d.day)}</div>
        ))}
      </div>
    </div>
  );
}

function LogroCard({ a }) {
  const { GlassPanel, Progress, Badge } = KITP;
  return (
    <GlassPanel padding="var(--space-5)" strength={a.unlocked ? "strong" : "subtle"} style={{ opacity: a.unlocked ? 1 : 0.62, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, fontSize: "var(--text-md)", fontWeight: 700, color: a.unlocked ? "var(--text-primary)" : "var(--text-secondary)" }}>{a.name}</div>
        {a.unlocked ? <Badge tone="success">Conseguido</Badge> : a.secret ? <Badge tone="neutral">Secreto</Badge> : null}
      </div>
      <p style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{a.description}</p>
      {!a.unlocked && !a.secret ? (
        <React.Fragment>
          <Progress value={Math.round((a.current / a.target) * 100)} tone="cyan" />
          <div style={{ marginTop: 5, fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{a.current} de {a.target}</div>
        </React.Fragment>
      ) : null}
    </GlassPanel>
  );
}

function ProgressScreen({ me, tab, setTab }) {
  const { GlassPanel, Progress } = KITP;
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const rootRef = React.useRef(null);

  const load = () => {
    setError(null);
    API.get("/progress").then(setData).catch((e) => setError(e.message));
  };
  React.useEffect(load, []);
  React.useEffect(() => Liquid.reveal(rootRef.current), [data]);

  const wrap = (children) => (
    <PageFrame>
      <NavBar onHome={() => setTab("inicio")} tab={tab} setTab={setTab} user={{ ...me.user, streak: me.stats.streak }} />
      {children}
    </PageFrame>
  );

  if (error) return wrap(<div style={{ marginTop: 36 }}><ErrorPanel message={error} onRetry={load} /></div>);
  if (!data) return wrap(<LoadingPanel />);

  const lvl = data.level;

  return wrap(
    <div ref={rootRef}>
      <h1 style={{ margin: "44px 4px 24px", fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Tu progreso</h1>

      <div className="lg-reveal">
        <GlassPanel tint="violet" padding="var(--space-7)" radius="var(--radius-xl)" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Nivel {lvl.n}</div>
              <div style={{ margin: "6px 0 8px", fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text-primary)" }}>{lvl.name}</div>
              <p style={{ margin: 0, fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>
                {lvl.next
                  ? <React.Fragment>Te faltan <strong style={{ color: "var(--text-primary)" }}>{lvl.xpToNext} XP</strong> para {lvl.next.name}</React.Fragment>
                  : "Has llegado al último nivel. Nada mal."}
              </p>
              <div style={{ marginTop: 14, maxWidth: 420 }}><Progress value={lvl.progress} tone="violet" showLabel /></div>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 800, color: "var(--accent-cyan)", fontVariantNumeric: "tabular-nums" }}>
              {lvl.xp.toLocaleString("es")} <span style={{ fontSize: "var(--text-md)", color: "var(--text-tertiary)" }}>XP</span>
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="lg-reveal">
        <GlassPanel padding="var(--space-6)" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Tu último año</div>
          <Heatmap cells={data.heatmap} />
        </GlassPanel>
      </div>

      <div className="lg-reveal">
        <GlassPanel padding="var(--space-6)" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>Esta semana</div>
          <SemanaXp dias={data.weekXp} />
        </GlassPanel>
      </div>

      <h2 style={{ margin: "0 4px 16px", fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>
        Logros · {data.achievements.filter((a) => a.unlocked).length} de {data.achievements.length}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {data.achievements.map((a) => (
          <div key={a.id} className="lg-reveal"><LogroCard a={a} /></div>
        ))}
      </div>
    </div>
  );
}
Object.assign(window, { ProgressScreen });
```

- [ ] **Step 3: Cargarla y enrutarla**

En `app/web/index.html`, añadir después de `MateriasScreen.jsx`:

```html
<script type="text/babel" src="/screens/ProgressScreen.jsx"></script>
```

En `app/web/app.jsx`, añadir la rama a la selección por pestaña:

```jsx
    screen = tab === "materias"
      ? <MateriasScreen {...comun} onOpenCourse={(id) => go.course(id)} />
      : tab === "progreso"
      ? <ProgressScreen {...comun} />
      : <InicioScreen {...comun}
          onOpenLesson={(courseId, lessonId) => go.lesson(courseId, lessonId)}
          onOpenReview={go.review} />;
```

- [ ] **Step 4: Verificar E2E**

Con el trap instalado, en `http://localhost:3000`:

1. La pestaña **Progreso** abre la página nueva.
2. Se ve el nivel con su barra y "Te faltan N XP para …".
3. El heatmap pinta 365 celdas (`document.querySelectorAll(".lg-heat__cell").length === 365`) y las de los días con actividad están encendidas.
4. La gráfica pinta 7 barras y ninguna se rompe si la semana está a cero.
5. La colección muestra los 17 logros; los secretos bloqueados salen como `???` con la insignia "Secreto".
6. **El secreto no se filtra:** en la respuesta de red de `/api/progress`, buscar "Madrugador" → **no aparece**.
7. `window.__errs.length === 0`.

- [ ] **Step 5: Commit**

```bash
git add app/web/screens/ProgressScreen.jsx app/web/index.html app/web/app.jsx app/web/liquid.css
git commit -m "feat: pagina de Progreso con nivel, heatmap, semana y coleccion de logros"
```

---

### Task 10: El toast de logro (el momento)

**Files:**
- Modify: `app/web/screens/AppShell.jsx` (`AchievementToast` + "Progreso" en el menú del avatar)
- Modify: `app/web/liquid.css` (estilos del toast)
- Modify: `app/web/fx.js` (sonido `"achievement"`)
- Modify: `app/web/app.jsx` (la cola)
- Modify: `app/web/screens/LessonScreen.jsx` y `app/web/screens/ReviewScreen.jsx` (pasar los logros hacia arriba)

**Interfaces:**
- Consumes: `achievementsUnlocked` de `POST /answer` (Task 7); `usePhase(value, outMs)` (ya existe en `AppShell.jsx`); las clases `anim-drop-in` y `anim-evaporate` (ya existen en `motion.css`).
- Produces: `window.AchievementToast`; `FX.sound.play("achievement")`.

- [ ] **Step 1: El sonido, en `app/web/fx.js`**

Dentro de `play(name)`, añadir una rama más (arpegio ascendente, más largo que el de "perfecto" — es el premio mayor):

```js
        else if (name === "achievement") { this._note(523.25, 0, 0.1); this._note(659.25, 0.08, 0.1); this._note(783.99, 0.16, 0.1); this._note(1046.5, 0.24, 0.3); }
```

- [ ] **Step 2: El CSS, en `app/web/liquid.css`** (antes del bloque de reduced motion)

```css
/* ---------- Toast de logro: cae del cielo y se evapora ---------- */
.lg-ach {
  position: fixed;
  top: 96px;
  left: 50%;
  transform-origin: top center;
  z-index: 95;
  width: 340px;
  margin-left: -170px;
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  background: rgba(16, 23, 44, 0.74);
  border: 1px solid rgba(146, 137, 227, 0.45);
  box-shadow: var(--refraction-edge), var(--shadow-float), 0 0 40px rgba(146, 137, 227, 0.22);
}
/* El blur, en su capa aparte: jamás sobre un elemento con texto. */
.lg-ach__glass {
  position: absolute;
  inset: -1px;
  z-index: -1;
  border-radius: inherit;
  -webkit-backdrop-filter: blur(var(--blur-lg)) saturate(var(--saturate-glass));
  backdrop-filter: blur(var(--blur-lg)) saturate(var(--saturate-glass));
}
```

Y dentro del `@media (prefers-reduced-motion: reduce)`, nada nuevo: el toast usa `anim-drop-in` y `anim-evaporate`, que **ya** están cubiertos ahí.

- [ ] **Step 3: `AchievementToast` en `app/web/screens/AppShell.jsx`**

Añadir antes del `Object.assign` final, y exportarlo en él:

```jsx
// El logro cae como una gota desde arriba y se evapora al irse. usePhase retiene el contenido
// durante los 160ms de salida, igual que la banda de feedback.
function AchievementToast({ achievement, onDone }) {
  const { shown, phase } = usePhase(achievement, 160);
  const timer = React.useRef(null);

  React.useEffect(() => {
    if (!achievement) return;
    if (window.FX) FX.sound.play("achievement");
    clearTimeout(timer.current);
    timer.current = setTimeout(onDone, 2600);
    return () => clearTimeout(timer.current);
  }, [achievement]);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  if (!shown) return null;
  return (
    <div role="status" className={"lg-ach " + (phase === "out" ? "anim-evaporate" : "anim-drop-in")}
      style={{ pointerEvents: "none" }}>
      <span aria-hidden className="lg-ach__glass"></span>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Orb size={40} mood="celebrate" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--accent-violet)" }}>Logro desbloqueado</div>
          <div style={{ margin: "3px 0 2px", fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>{shown.name}</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{shown.description}</div>
        </div>
      </div>
    </div>
  );
}
```

**Ojo con el orden de scripts:** `AchievementToast` usa `Orb`, y `Orb.jsx` se carga ANTES que `AppShell.jsx` en `index.html`. Correcto tal cual está.

Y en el `Object.assign` final, añadir `AchievementToast` conservando todo lo que ya exporta.

- [ ] **Step 4: "Progreso" en el menú del avatar** (mismo archivo)

`AvatarMenu` gana una prop `onProgress` y un ítem encima de "Cerrar sesión":

```jsx
function AvatarMenu({ user, onLogout, onProgress }) {
```

y dentro del menú, justo antes del `<div className="lg-menu__sep">` que precede a "Cerrar sesión":

```jsx
          <button role="menuitem" className="lg-menu__item" onClick={() => { setOpen(false); onProgress(); }}>
            <KIcon d={ICONS.book} size={14} />
            Tu progreso
          </button>
          <div className="lg-menu__sep"></div>
```

(El separador que ya existía se mantiene entre los datos del usuario y este bloque; añade el segundo separador como se ve arriba.) Y en `NavBar`, pasarle la prop:

```jsx
        <AvatarMenu user={user} onLogout={() => API.logout()} onProgress={() => setTab("progreso")} />
```

- [ ] **Step 5: La cola en `app/web/app.jsx`**

Varios logros pueden caer a la vez (terminar la última lección puede desbloquear tres). Se encolan y se muestran de uno en uno:

```jsx
  const [achQueue, setAchQueue] = React.useState([]);
  const achTimer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(achTimer.current), []);

  // Si la respuesta completó la lección, la celebración se lleva la escena: el toast espera 900ms
  // para no pisar el bloom.
  const showAchievements = (lista, trasCelebracion) => {
    if (!lista || !lista.length) return;
    clearTimeout(achTimer.current);
    achTimer.current = setTimeout(() => setAchQueue((q) => [...q, ...lista]), trasCelebracion ? 900 : 0);
  };
```

Renderizar el primero de la cola dentro del `React.Fragment` del `return`, junto al Toast que ya existe:

```jsx
      <AchievementToast achievement={achQueue[0] || null} onDone={() => setAchQueue((q) => q.slice(1))} />
```

Y pasar `showAchievements` a `LessonScreen` y `ReviewScreen` (junto a `showToast`).

- [ ] **Step 6: Disparar desde las pantallas**

En `app/web/screens/LessonScreen.jsx`, dentro de `check()`, tras `setResult(r)`:

```jsx
      if (r.achievementsUnlocked && r.achievementsUnlocked.length && showAchievements) {
        showAchievements(r.achievementsUnlocked, r.lessonCompleted);
      }
```

(y añadir `showAchievements` a la lista de props de `LessonScreen`.)

En `app/web/screens/ReviewScreen.jsx`, lo mismo dentro de su `check()`, con `false` en el segundo argumento (en el repaso no hay celebración de lección):

```jsx
      if (r.achievementsUnlocked && r.achievementsUnlocked.length && showAchievements) {
        showAchievements(r.achievementsUnlocked, false);
      }
```

(y añadir `showAchievements` a sus props.)

- [ ] **Step 7: Verificar E2E**

Con el trap instalado. **Para forzar un logro sin jugar horas**, borra tu progreso de una lección y vuelve a hacerla, o crea una cuenta nueva desde el registro (una cuenta nueva desbloquea "Primer paso" y "Sin un error" al completar su primera lección — que es justo el caso de dos logros a la vez).

1. Completar la primera lección de una cuenta nueva: **caen dos toasts, uno tras otro**, y **no pisan la celebración** (aparecen después del bloom).
2. El toast cae desde arriba (`anim-drop-in`) y se evapora (`anim-evaporate`); suena.
3. El menú del avatar tiene "Tu progreso" y lleva a la pestaña Progreso.
4. `window.__errs.length === 0`.
5. Regresión: la celebración, el melt, el ripple y la navbar líquida siguen intactos.

- [ ] **Step 8: Commit**

```bash
git add app/web
git commit -m "feat: toast de logro que cae como una gota, con cola y sin pisar la celebracion"
```

---

### Task 11: Verificación final

**Files:** ninguno (solo verificación). Si algo falla: arreglar y commitear como `fix:`.

- [ ] **Step 1: La suite entera**

Run: `npm test` (desde `app/`)
Expected: **96/96 pass** (57 originales + 39 nuevos). Pega la línea de resumen en el reporte.

- [ ] **Step 2: Checklist E2E completo**

Con el trap `window.onerror` instalado tras cada recarga:

1. **Pestañas:** Inicio, Materias y Progreso navegan de verdad, y también desde dentro de una lección.
2. **Inicio:** nivel, racha, XP, continuar, repaso y "Estás cerca de…".
3. **Materias:** las 6 tarjetas, se entra a un curso.
4. **Progreso:** nivel con "te faltan N XP", 365 celdas de heatmap, 7 barras, 17 logros.
5. **Secretos:** salen como `???` con insignia "Secreto", y **su nombre real NO aparece en la respuesta de red de `/api/progress`** (compruébalo con `read_network_requests`).
6. **Toast:** al cruzar un umbral cae, suena y se evapora; con celebración de por medio, no la pisa.
7. **Menú del avatar:** "Tu progreso" navega; "Cerrar sesión" sigue funcionando.
8. **Regresión:** coreografía de gota (banda, melt, bloom, celebración), ripple, reveals y navbar líquida intactos.

- [ ] **Step 3: Reduced motion**

Cinturón JS: `FX.reducedMotion = true` → el toast aparece/desaparece al instante, sin fases. Cinturón CSS: leer el bloque `@media` de `liquid.css` y confirmar que cubre lo nuevo (el toast reutiliza `anim-drop-in`/`anim-evaporate`, ya cubiertos en `motion.css`).

- [ ] **Step 4: Anotar la verificación humana pendiente**

Añadir al ledger `.superpowers/sdd/progress.md`: el *feel* del toast y del heatmap necesita un navegador en primer plano (el panel congela `rAF` y el `IntersectionObserver`).

- [ ] **Step 5: Commit final (solo si hubo fixes)**

```bash
git add -A
git commit -m "fix: ajustes de la verificacion final del meta-juego"
```
