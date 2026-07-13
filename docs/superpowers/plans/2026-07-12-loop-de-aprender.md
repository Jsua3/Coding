# Coding — "El loop de aprender" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar el loop de aprender de Coding: motion/orbe/sonido, 4 tipos de ejercicio validados en servidor, lección como stepper con feedback inmediato, celebración post-lección y repaso de errores.

**Architecture:** Patrón expand-migrate-contract sobre la app existente: primero se AÑADEN `exercises` + `answer_attempts` (el seed escribe ambos modelos), luego las rutas migran a ejercicios, y al final se elimina `quiz_questions`. Frontend sin build (React UMD + Babel): animaciones con CSS + Web APIs (`motion.css`, `fx.js`), renderers de ejercicio compartidos entre lección y repaso. Spec: `docs/superpowers/specs/2026-07-12-loop-de-aprender-design.md`.

**Tech Stack:** Node ≥ 20 ESM, Express 4, mysql2 (MariaDB local), node:test + supertest; frontend React 18 UMD + Babel standalone + design system en `/ds`; Web Audio API, requestAnimationFrame. **Sin dependencias nuevas.**

## Global Constraints

- La carpeta `Coding Design System/` jamás se modifica. Sin librerías nuevas (npm ni CDN).
- `answer` y todo índice/secuencia correcta viven SOLO en el servidor; jamás en una respuesta de la API (los payloads de `GET /api/lessons/:id` y `GET /api/review` no contienen `answer`).
- Todo derivado, nunca almacenado: completación, perfecto, cola de repaso y racha se derivan de `answer_attempts` + `lesson_completions`.
- XP: +50 al completar lección (única vez), +10 bonus perfecto (única vez, misma transacción), +5 por ejercicio corregido en repaso (única vez por limpieza).
- Mensajes al usuario en español con tuteo. Interacción tap-based (sin drag & drop). `@media (prefers-reduced-motion: reduce)` desactiva shake/burst/pulse/count-up.
- Estado transicional esperado: entre las Tasks 7 y 12 el frontend viejo no puede completar lecciones (la API vieja ya no existe). Los tests siempre quedan verdes en cada task.
- Tests: `cd app; npm test` (node --test --test-concurrency=1, MariaDB real vía app/.env; BD de tests `coding_test`). Commit al final de cada task. Trabaja desde `D:\Sua_Files\IdeaProjects\coding`.
- En seed-data, dentro de strings con comillas dobles NUNCA va `${}` (los spans de color `${K}`/`${S}`/`${N}`/`${C}` solo en template literals con backticks). Fichas del `bank` únicas por ejercicio.

---

### Task 1: Motion core (motion.css + fx.js)

**Files:**
- Create: `app/web/motion.css`
- Create: `app/web/fx.js`
- Modify: `app/web/index.html` (link + script)

**Interfaces:**
- Produces: clases CSS `anim-screen-in`, `anim-pop`, `anim-shake`, `anim-rise`, `anim-pulse-glow`, `fx-spark`, y estilos `.orb*` (los consume el componente Orb de Task 2). Global `window.FX`: `FX.reducedMotion: bool`, `FX.countUp(el, from, to, ms=640)`, `FX.burst(x, y, count=14)`, `FX.sound.enabled` (get/set, persiste en localStorage "coding-sound", default true), `FX.sound.play(name)` con name ∈ `correct|wrong|complete|perfect|streak`.

- [ ] **Step 1: Crear `app/web/motion.css`**

```css
/* Motion core — construido sobre los tokens del design system */

.anim-screen-in { animation: screen-in 320ms var(--ease-glass) both; }
@keyframes screen-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.anim-pop { animation: pop 320ms var(--ease-spring); }
@keyframes pop {
  0% { transform: scale(1); }
  45% { transform: scale(1.06); }
  100% { transform: scale(1); }
}

.anim-shake { animation: shake 320ms var(--ease-glass); }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

.anim-rise { animation: rise 320ms var(--ease-spring) both; }
@keyframes rise {
  from { opacity: 0; transform: translateY(100%); }
  to { opacity: 1; transform: translateY(0); }
}

.anim-pulse-glow { animation: pulse-glow 1.6s var(--ease-glass) infinite; }
@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(230, 175, 107, 0.45)); transform: scale(1); }
  50% { filter: drop-shadow(0 0 16px rgba(230, 175, 107, 0.8)); transform: scale(1.08); }
}

.fx-spark {
  position: fixed; z-index: 200; width: 7px; height: 7px; border-radius: 50%;
  pointer-events: none;
  animation: spark 640ms var(--ease-glass) both;
}
@keyframes spark {
  from { opacity: 1; transform: translate(0, 0) scale(1); }
  to { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.4); }
}

/* Orbe aurora — mascota de luz (solo gradientes, sin ilustraciones) */
.orb { position: relative; border-radius: 50%; flex-shrink: 0; animation: orb-float 4s ease-in-out infinite; transition: opacity 320ms var(--ease-glass), filter 320ms var(--ease-glass); }
@keyframes orb-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.orb__layer { position: absolute; inset: 0; border-radius: 50%; filter: blur(6px); }
.orb__layer--blue { background: radial-gradient(circle at 32% 32%, rgba(94, 151, 230, 0.95), transparent 68%); }
.orb__layer--cyan { background: radial-gradient(circle at 68% 62%, rgba(82, 201, 184, 0.8), transparent 62%); }
.orb__layer--violet { background: radial-gradient(circle at 52% 82%, rgba(146, 137, 227, 0.7), transparent 60%); }
.orb__core { position: absolute; inset: 22%; border-radius: 50%; background: radial-gradient(circle at 40% 35%, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.06) 70%); filter: blur(1px); }
.orb--happy { animation: orb-float 4s ease-in-out infinite, orb-happy 640ms var(--ease-spring); }
@keyframes orb-happy {
  0% { transform: scale(1); filter: brightness(1); }
  40% { transform: scale(1.15); filter: brightness(1.35); }
  100% { transform: scale(1); filter: brightness(1); }
}
.orb--sad { opacity: 0.55; filter: saturate(0.5); }
.orb--celebrate { animation: orb-celebrate 900ms var(--ease-spring); }
@keyframes orb-celebrate {
  0% { transform: scale(1); filter: brightness(1); }
  30% { transform: scale(1.28); filter: brightness(1.5); }
  55% { transform: scale(1.1); filter: brightness(1.2); }
  80% { transform: scale(1.22); filter: brightness(1.4); }
  100% { transform: scale(1); filter: brightness(1); }
}

@media (prefers-reduced-motion: reduce) {
  .anim-pop, .anim-shake, .anim-pulse-glow, .fx-spark { animation: none !important; }
  .orb, .orb--happy, .orb--celebrate { animation: none !important; }
  .anim-screen-in, .anim-rise { animation-duration: 1ms !important; }
}
```

- [ ] **Step 2: Crear `app/web/fx.js`**

```js
// Utilidades de experiencia — sin dependencias, sin assets
const FX = {
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,

  countUp(el, from, to, ms = 640) {
    if (!el) return;
    if (FX.reducedMotion || ms <= 0) { el.textContent = to.toLocaleString("es"); return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased).toLocaleString("es");
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  burst(x, y, count = 14) {
    if (FX.reducedMotion) return;
    const colors = ["#5E97E6", "#52C9B8", "#9289E3", "#E6AF6B"];
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "fx-spark";
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 40 + Math.random() * 50;
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.background = colors[i % colors.length];
      s.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      s.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
      setTimeout(() => s.remove(), 1200);
    }
  },

  sound: {
    ctx: null,
    get enabled() { return localStorage.getItem("coding-sound") !== "off"; },
    set enabled(v) { localStorage.setItem("coding-sound", v ? "on" : "off"); },
    _ensure() {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    _note(freq, at, dur = 0.14, type = "sine", vol = 0.16) {
      const ctx = this._ensure();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + dur + 0.05);
    },
    play(name) {
      if (!this.enabled) return;
      try {
        if (name === "correct") { this._note(523.25, 0, 0.12); this._note(659.25, 0.07, 0.16); }
        else if (name === "wrong") { this._note(196, 0, 0.18, "triangle", 0.12); }
        else if (name === "complete") { this._note(523.25, 0, 0.12); this._note(659.25, 0.09, 0.12); this._note(783.99, 0.18, 0.2); }
        else if (name === "perfect") { this._note(659.25, 0, 0.1); this._note(783.99, 0.08, 0.1); this._note(1046.5, 0.16, 0.24); }
        else if (name === "streak") { this._note(880, 0, 0.1, "sine", 0.12); this._note(1046.5, 0.09, 0.18, "sine", 0.12); }
      } catch (e) { /* audio no disponible: silencio */ }
    },
  },
};
window.FX = FX;
```

- [ ] **Step 3: Enlazar en `app/web/index.html`** — añadir tras el `<link>` de `/ds/styles.css`:

```html
<link rel="stylesheet" href="/motion.css">
```

y tras `<script src="/api.js"></script>`:

```html
<script src="/fx.js"></script>
```

- [ ] **Step 4: Verificar en el navegador**

Arranca el servidor (`npm start` en `app/`, background). En `http://localhost:3000`, abre la consola del navegador y ejecuta:
1. `FX.sound.play("correct")` → se oye un ping breve de dos notas.
2. `FX.sound.enabled = false; FX.sound.play("correct")` → silencio. `FX.sound.enabled = true`.
3. `FX.burst(innerWidth/2, innerHeight/2)` → estallido de chispas de colores que desaparecen solas (sin nodos residuales: `document.querySelectorAll(".fx-spark").length === 0` tras ~1s).
4. `const d = document.createElement("div"); document.body.appendChild(d); FX.countUp(d, 0, 2450, 800)` → el texto sube hasta "2.450".
5. Sin errores en consola al cargar la página.

- [ ] **Step 5: Correr la suite backend (sin regresión)**

Run (en `app/`): `npm test`
Expected: PASS (44 tests — nada del backend cambió).

- [ ] **Step 6: Commit**

```bash
git add app/web/motion.css app/web/fx.js app/web/index.html
git commit -m "feat: motion core con animaciones, burst y sonido sintetizado"
```

---

### Task 2: Orbe aurora, toggle de sonido y transiciones de pantalla

**Files:**
- Create: `app/web/screens/Orb.jsx`
- Modify: `app/web/screens/AppShell.jsx` (ICONS de sonido, SoundToggle en NavBar, fix "día(s)")
- Modify: `app/web/app.jsx` (wrapper de transición)
- Modify: `app/web/index.html` (script Orb.jsx)

**Interfaces:**
- Consumes: clases `.orb*` y `window.FX` (Task 1).
- Produces: global `Orb({ size = 56, mood = "idle" | "happy" | "sad" | "celebrate", style })`. NavBar con toggle de sonido. Todas las pantallas entran con `.anim-screen-in`.

- [ ] **Step 1: Crear `app/web/screens/Orb.jsx`**

```jsx
function Orb({ size = 56, mood = "idle", style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (mood === "celebrate" && ref.current && window.FX) {
      const r = ref.current.getBoundingClientRect();
      FX.burst(r.left + r.width / 2, r.top + r.height / 2, 18);
    }
  }, [mood]);
  return (
    <div ref={ref} className={"orb" + (mood !== "idle" ? " orb--" + mood : "")} style={{ width: size, height: size, ...style }}>
      <span className="orb__layer orb__layer--blue"></span>
      <span className="orb__layer orb__layer--cyan"></span>
      <span className="orb__layer orb__layer--violet"></span>
      <span className="orb__core"></span>
    </div>
  );
}
Object.assign(window, { Orb });
```

- [ ] **Step 2: Modificar `app/web/screens/AppShell.jsx`**

(a) Añadir a `ICONS`:

```js
  sound: "M2.5 6v4h2.5L8.5 13V3L5 6H2.5zM10.5 5.5a3.5 3.5 0 010 5M12 3.5a6 6 0 010 9",
  soundOff: "M2.5 6v4h2.5L8.5 13V3L5 6H2.5zM10.5 6.5l3 3M13.5 6.5l-3 3",
```

(b) Añadir el componente (antes de `NavBar`):

```jsx
function SoundToggle() {
  const { IconButton } = KIT;
  const [on, setOn] = React.useState(window.FX ? FX.sound.enabled : true);
  const toggle = () => { FX.sound.enabled = !on; setOn(!on); if (!on) FX.sound.play("correct"); };
  return (
    <IconButton label={on ? "Silenciar" : "Activar sonido"} size="sm" variant="ghost" onClick={toggle}>
      <KIcon d={on ? ICONS.sound : ICONS.soundOff} />
    </IconButton>
  );
}
```

(c) En `NavBar`, junto al IconButton de buscar, añadir `<SoundToggle />` y arreglar el plural del streak:

```jsx
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SoundToggle />
        <IconButton label="Buscar" size="sm" variant="ghost"><KIcon d={ICONS.search} /></IconButton>
        <Badge tone="amber" dot>{user.streak} {user.streak === 1 ? "día" : "días"}</Badge>
```

(d) Extender el `Object.assign` final con `SoundToggle`.

- [ ] **Step 3: Transiciones de pantalla en `app/web/app.jsx`** — envolver la pantalla activa; reemplazar el `return` final de `App`:

```jsx
  return (
    <React.Fragment>
      <div key={route.screen + ":" + (route.lessonId || route.courseId || "")} className="anim-screen-in">
        {screen}
      </div>
      {toast ? (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 90 }}>
          <Toast tone={toast.tone} title={toast.title} description={toast.description} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </React.Fragment>
  );
```

- [ ] **Step 4: Script en `app/web/index.html`** — antes de `AppShell.jsx`:

```html
<script type="text/babel" src="/screens/Orb.jsx"></script>
```

- [ ] **Step 5: Verificar en el navegador**

1. Login → dashboard entra con fade+slide; navegar a un curso y volver re-anima.
2. NavBar: badge de racha dice "0 días" (y "1 día" si la racha es 1 — verifica el texto con racha real o leyendo el código). Toggle de sonido conmuta icono y persiste tras recargar (localStorage "coding-sound").
3. En consola: `typeof window.Orb === "function"` (el orbe aún no se monta en ninguna pantalla — eso llega en Tasks 12-14).
4. Sin errores en consola.

- [ ] **Step 6: Suite backend sin regresión**

Run (en `app/`): `npm test`
Expected: PASS (44).

- [ ] **Step 7: Commit**

```bash
git add app/web/screens/Orb.jsx app/web/screens/AppShell.jsx app/web/app.jsx app/web/index.html
git commit -m "feat: orbe aurora, toggle de sonido y transiciones de pantalla"
```

---

### Task 3: Validadores puros de ejercicios

**Files:**
- Create: `app/server/services/exercises.js`
- Test: `app/test/exercises-validate.test.js`

**Interfaces:**
- Produces: `validateResponse(type, payload, answer, response) → { valid: boolean, correct?: boolean }`. `valid: false` = respuesta malformada (la ruta devolverá 400). Tipos y formas exactas (spec §3):
  - choice: payload `{options: [..]}`, answer `{index}`, response `{index}`
  - blanks: payload `{code: [..], bank: [..]}`, answer `{blanks: [..]}`, response `{blanks: [..]}`
  - order: payload `{lines: [{id, html}]}`, answer `{order: [ids]}`, response `{order: [ids]}`
  - match: payload `{left: [..], right: [..]}`, answer `{pairs: [[l, r]..]}`, response `{pairs: [[l, r]..]}`

- [ ] **Step 1: Escribir los tests que fallan** — `app/test/exercises-validate.test.js`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { validateResponse } from "../server/services/exercises.js";

const choiceP = { options: ["a", "b", "c", "d"] };
const choiceA = { index: 2 };

test("choice: correcta, incorrecta y malformada", () => {
  assert.deepEqual(validateResponse("choice", choiceP, choiceA, { index: 2 }), { valid: true, correct: true });
  assert.deepEqual(validateResponse("choice", choiceP, choiceA, { index: 0 }), { valid: true, correct: false });
  for (const bad of [null, {}, { index: -1 }, { index: 4 }, { index: "2" }, { index: 1.5 }]) {
    assert.equal(validateResponse("choice", choiceP, choiceA, bad).valid, false, JSON.stringify(bad));
  }
});

const blanksP = { code: ["<b0> x <b1>"], bank: ["WHERE", "ASC", "DESC"] };
const blanksA = { blanks: ["WHERE", "ASC"] };

test("blanks: exacto por hueco", () => {
  assert.deepEqual(validateResponse("blanks", blanksP, blanksA, { blanks: ["WHERE", "ASC"] }), { valid: true, correct: true });
  assert.deepEqual(validateResponse("blanks", blanksP, blanksA, { blanks: ["ASC", "WHERE"] }), { valid: true, correct: false });
  for (const bad of [{}, { blanks: ["WHERE"] }, { blanks: ["WHERE", 3] }, { blanks: "WHERE,ASC" }]) {
    assert.equal(validateResponse("blanks", blanksP, blanksA, bad).valid, false, JSON.stringify(bad));
  }
});

const orderP = { lines: [{ id: "a", html: "x" }, { id: "b", html: "y" }, { id: "c", html: "z" }] };
const orderA = { order: ["b", "a", "c"] };

test("order: secuencia exacta, ids válidos y sin repetidos", () => {
  assert.deepEqual(validateResponse("order", orderP, orderA, { order: ["b", "a", "c"] }), { valid: true, correct: true });
  assert.deepEqual(validateResponse("order", orderP, orderA, { order: ["a", "b", "c"] }), { valid: true, correct: false });
  for (const bad of [{}, { order: ["b", "a"] }, { order: ["b", "a", "x"] }, { order: ["b", "b", "c"] }]) {
    assert.equal(validateResponse("order", orderP, orderA, bad).valid, false, JSON.stringify(bad));
  }
});

const matchP = { left: ["1", "2", "3", "4"], right: ["w", "x", "y", "z"] };
const matchA = { pairs: [[0, 1], [1, 0], [2, 3], [3, 2]] };

test("match: conjunto completo de pares", () => {
  assert.deepEqual(validateResponse("match", matchP, matchA, { pairs: [[1, 0], [0, 1], [3, 2], [2, 3]] }), { valid: true, correct: true });
  assert.deepEqual(validateResponse("match", matchP, matchA, { pairs: [[0, 0], [1, 1], [2, 2], [3, 3]] }), { valid: true, correct: false });
  for (const bad of [{}, { pairs: [[0, 1]] }, { pairs: [[0, 1], [0, 2], [2, 3], [3, 0]] }, { pairs: [[0, 9], [1, 0], [2, 3], [3, 2]] }, { pairs: [["0", 1], [1, 0], [2, 3], [3, 2]] }]) {
    assert.equal(validateResponse("match", matchP, matchA, bad).valid, false, JSON.stringify(bad));
  }
});

test("tipo desconocido es inválido", () => {
  assert.equal(validateResponse("essay", {}, {}, {}).valid, false);
});
```

- [ ] **Step 2: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — `Cannot find module '../server/services/exercises.js'`.

- [ ] **Step 3: Implementar `app/server/services/exercises.js`**

```js
export function validateResponse(type, payload, answer, response) {
  if (!response || typeof response !== "object") return { valid: false };

  if (type === "choice") {
    const n = payload.options.length;
    if (!Number.isInteger(response.index) || response.index < 0 || response.index >= n) return { valid: false };
    return { valid: true, correct: response.index === answer.index };
  }

  if (type === "blanks") {
    const blanks = response.blanks;
    if (!Array.isArray(blanks) || blanks.length !== answer.blanks.length) return { valid: false };
    if (!blanks.every((b) => typeof b === "string")) return { valid: false };
    return { valid: true, correct: blanks.every((b, i) => b === answer.blanks[i]) };
  }

  if (type === "order") {
    const ids = payload.lines.map((l) => l.id);
    const order = response.order;
    if (!Array.isArray(order) || order.length !== ids.length) return { valid: false };
    if (new Set(order).size !== order.length || !order.every((id) => ids.includes(id))) return { valid: false };
    return { valid: true, correct: order.every((id, i) => id === answer.order[i]) };
  }

  if (type === "match") {
    const pairs = response.pairs;
    const n = payload.left.length;
    if (!Array.isArray(pairs) || pairs.length !== n) return { valid: false };
    const ls = new Set();
    const rs = new Set();
    for (const p of pairs) {
      if (!Array.isArray(p) || p.length !== 2 || !Number.isInteger(p[0]) || !Number.isInteger(p[1])) return { valid: false };
      if (p[0] < 0 || p[0] >= n || p[1] < 0 || p[1] >= n) return { valid: false };
      ls.add(p[0]);
      rs.add(p[1]);
    }
    if (ls.size !== n || rs.size !== n) return { valid: false };
    const want = new Map(answer.pairs.map(([l, r]) => [l, r]));
    return { valid: true, correct: pairs.every(([l, r]) => want.get(l) === r) };
  }

  return { valid: false };
}
```

- [ ] **Step 4: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/server/services/exercises.js app/test/exercises-validate.test.js
git commit -m "feat: validadores puros para los 4 tipos de ejercicio"
```

---

### Task 4: Schema de ejercicios + seed framework + contenido BD I y II

**Files:**
- Modify: `app/server/schema.sql` (añadir `exercises` y `answer_attempts`; NO tocar `quiz_questions` todavía)
- Modify: `app/server/seed.js` (upsert de ejercicios derivados)
- Modify: `app/server/seed-data/bd1.js` y `app/server/seed-data/bd2.js` (campo `extra` en las 19 lecciones)
- Modify: `app/test/helpers.js` (resetUserData trunca también answer_attempts)
- Test: `app/test/seed.test.js` (nuevos asserts)

**Interfaces:**
- Consumes: formato seed-data existente (lecciones con `quiz {question, options, correct, ok, bad}`).
- Produces: tablas `exercises` (id VARCHAR(40) PK tipo `"<lessonId>-ex1|ex2"`) y `answer_attempts`. Cada lección genera ex1 (choice, derivado de `quiz`) y ex2 (derivado de `extra`). Formato del campo `extra` (lo consumen Tasks 5-6):

```js
extra: {
  type: "blanks" | "order" | "match",
  prompt: "…enunciado…",
  payload: { … },     // según tipo (spec §3); marcadores <b0>, <b1>… en blanks
  answer: { … },      // según tipo
  ok: "…", bad: "…",
}
```

- Helper de test `assertExerciseShape(row)` definido en `app/test/seed.test.js` (lo reutiliza el test global de Task 6, en el mismo archivo — no se importa desde otros archivos de test).

- [ ] **Step 1: Añadir al final de `app/server/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS exercises (
  id VARCHAR(40) PRIMARY KEY,
  lesson_id VARCHAR(30) NOT NULL,
  order_index INT NOT NULL,
  type ENUM('choice','blanks','order','match') NOT NULL,
  prompt TEXT NOT NULL,
  payload JSON NOT NULL,
  answer JSON NOT NULL,
  explain_ok TEXT NOT NULL,
  explain_bad TEXT NOT NULL,
  CONSTRAINT fk_ex_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS answer_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exercise_id VARCHAR(40) NOT NULL,
  context ENUM('lesson','review') NOT NULL DEFAULT 'lesson',
  correct TINYINT(1) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_aa_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_aa_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 2: Escribir los tests que fallan** — añadir a `app/test/seed.test.js` (antes de `after(closeDb)`), y exportar el helper de forma:

```js
function assertExerciseShape(row) {
  const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  const answer = typeof row.answer === "string" ? JSON.parse(row.answer) : row.answer;
  assert.ok(row.prompt.length > 0, `prompt vacío en ${row.id}`);
  assert.ok(row.explain_ok.length > 0 && row.explain_bad.length > 0, `explicaciones en ${row.id}`);
  if (row.type === "choice") {
    assert.equal(payload.options.length, 4, `opciones en ${row.id}`);
    assert.ok(Number.isInteger(answer.index) && answer.index >= 0 && answer.index <= 3, `answer.index en ${row.id}`);
  } else if (row.type === "blanks") {
    const holes = payload.code.join("\n").match(/<b\d+>/g) || [];
    assert.equal(holes.length, answer.blanks.length, `huecos vs respuestas en ${row.id}`);
    assert.ok(answer.blanks.length >= 2, `mínimo 2 huecos en ${row.id}`);
    assert.equal(new Set(answer.blanks).size, answer.blanks.length, `ficha repetida en answer de ${row.id}`);
    assert.ok(answer.blanks.every((b) => payload.bank.includes(b)), `answer fuera del bank en ${row.id}`);
    assert.ok(payload.bank.length > answer.blanks.length, `sin distractores en ${row.id}`);
    assert.equal(new Set(payload.bank).size, payload.bank.length, `fichas repetidas en ${row.id}`);
  } else if (row.type === "order") {
    const ids = payload.lines.map((l) => l.id);
    assert.deepEqual([...ids].sort(), [...answer.order].sort(), `ids payload vs answer en ${row.id}`);
    assert.notDeepEqual(ids, answer.order, `lines ya en orden correcto en ${row.id}`);
  } else if (row.type === "match") {
    assert.equal(payload.left.length, 4, `left en ${row.id}`);
    assert.equal(payload.right.length, 4, `right en ${row.id}`);
    assert.equal(answer.pairs.length, 4, `pairs en ${row.id}`);
    const identity = answer.pairs.every(([l, r]) => l === r);
    assert.ok(!identity, `right sin mezclar en ${row.id}`);
  } else {
    assert.fail(`tipo desconocido ${row.type} en ${row.id}`);
  }
}

test("bd1 y bd2: 2 ejercicios por lección, bien formados", async () => {
  await setupTestDb();
  const rows = await query(
    `SELECT e.*, u.course_id FROM exercises e
     JOIN lessons l ON l.id = e.lesson_id JOIN units u ON u.id = l.unit_id
     WHERE u.course_id IN ('bd1','bd2') ORDER BY e.lesson_id, e.order_index`
  );
  const byLesson = {};
  for (const r of rows) (byLesson[r.lesson_id] = byLesson[r.lesson_id] || []).push(r);
  assert.equal(Object.keys(byLesson).length, 19);
  for (const [lessonId, exs] of Object.entries(byLesson)) {
    assert.equal(exs.length, 2, `ejercicios en ${lessonId}`);
    assert.equal(exs[0].id, lessonId + "-ex1");
    assert.equal(exs[0].type, "choice");
    assert.equal(exs[1].id, lessonId + "-ex2");
    assert.notEqual(exs[1].type, "choice", `ex2 debe ser estructurado en ${lessonId}`);
    for (const e of exs) assertExerciseShape(e);
  }
});
```

Nota: `seed.test.js` ya importa `assert`, `test`, `setupTestDb`, `query`; añade `export` al helper para Task 6.

- [ ] **Step 3: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — 0 lecciones con ejercicios (la tabla existe vacía o no existe aún).

- [ ] **Step 4: Extender `app/server/seed.js`** — añadir tras el upsert de `quiz_questions`, dentro del loop de lecciones:

```js
        await query(
          `INSERT INTO exercises (id, lesson_id, order_index, type, prompt, payload, answer, explain_ok, explain_bad)
           VALUES (?, ?, 0, 'choice', ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE lesson_id=VALUES(lesson_id), order_index=VALUES(order_index), type=VALUES(type),
             prompt=VALUES(prompt), payload=VALUES(payload), answer=VALUES(answer),
             explain_ok=VALUES(explain_ok), explain_bad=VALUES(explain_bad)`,
          [l.id + "-ex1", l.id, l.quiz.question, JSON.stringify({ options: l.quiz.options }), JSON.stringify({ index: l.quiz.correct }), l.quiz.ok, l.quiz.bad]
        );
        if (l.extra) {
          await query(
            `INSERT INTO exercises (id, lesson_id, order_index, type, prompt, payload, answer, explain_ok, explain_bad)
             VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE lesson_id=VALUES(lesson_id), order_index=VALUES(order_index), type=VALUES(type),
               prompt=VALUES(prompt), payload=VALUES(payload), answer=VALUES(answer),
               explain_ok=VALUES(explain_ok), explain_bad=VALUES(explain_bad)`,
            [l.id + "-ex2", l.id, l.extra.type, l.extra.prompt, JSON.stringify(l.extra.payload), JSON.stringify(l.extra.answer), l.extra.ok, l.extra.bad]
          );
        }
```

- [ ] **Step 5: Actualizar `app/test/helpers.js`** — en `resetUserData`, añadir antes del TRUNCATE de xp_events:

```js
  await query("TRUNCATE TABLE answer_attempts");
```

- [ ] **Step 6: Escribir `extra` en las 19 lecciones de bd1.js y bd2.js**

Asignación de tipos (obligatoria) y tema del ejercicio:

| Lección | Tipo | Ejercicio sobre |
|---|---|---|
| l1 | match | término ↔ definición (SGBD, SQL, tabla, fila) |
| l2 | blanks | CREATE TABLE con tipos de dato |
| l3 | blanks | PRIMARY KEY / FOREIGN KEY en un CREATE TABLE |
| l4 | match | tipo de relación ↔ ejemplo (1:1, 1:N, N:M, atributo) |
| l5 | blanks | SELECT/WHERE/ORDER BY (ejemplo completo abajo) |
| l6 | order | construir un INNER JOIN línea a línea (ejemplo completo abajo) |
| l7 | match | forma normal ↔ regla (1FN, 2FN, 3FN, sin normalizar) |
| bd1-l8 | blanks | COUNT/AVG en una consulta |
| bd1-l9 | order | consulta con GROUP BY y HAVING |
| bd1-l10 | blanks | subconsulta con IN |
| bd2-l1 | order | pasos de una transacción (START…COMMIT) |
| bd2-l2 | blanks | COMMIT y ROLLBACK en un script |
| bd2-l3 | match | propiedad ACID ↔ significado (ejemplo completo abajo) |
| bd2-l4 | blanks | CREATE TRIGGER (BEFORE/AFTER, NEW) |
| bd2-l5 | order | CREATE PROCEDURE con parámetros |
| bd2-l6 | blanks | función definida por el usuario (RETURNS) |
| bd2-l7 | match | tipo de índice/concepto ↔ uso |
| bd2-l8 | blanks | EXPLAIN y lectura de type/rows |
| bd2-l9 | match | tipo de bloqueo/aislamiento ↔ efecto |

**Tres ejemplos completos — patrón obligatorio de estilo** (las constantes `K/S/N/C` ya existen en cada archivo):

l5 (blanks):

```js
extra: {
  type: "blanks",
  prompt: "Completa la consulta para obtener los productos con precio menor a 100, ordenados de menor a mayor.",
  payload: {
    code: [
      `<span style="${K}">SELECT</span> nombre, precio <span style="${K}">FROM</span> productos`,
      `<b0> precio &lt; <span style="${N}">100</span>`,
      `<span style="${K}">ORDER BY</span> precio <b1>;`,
    ],
    bank: ["WHERE", "ASC", "HAVING", "DESC", "GROUP BY"],
  },
  answer: { blanks: ["WHERE", "ASC"] },
  ok: "WHERE filtra fila por fila y ASC ordena de menor a mayor (además es el orden por defecto).",
  bad: "El filtro de filas va con WHERE (HAVING es para grupos) y el orden de menor a mayor es ASC.",
},
```

l6 (order):

```js
extra: {
  type: "order",
  prompt: "Ordena las líneas para construir la consulta que lista cada estudiante con el nombre de su carrera.",
  payload: {
    lines: [
      { id: "a", html: `<span style="${K}">ON</span> e.carrera_id = c.id;` },
      { id: "b", html: `<span style="${K}">SELECT</span> e.nombre, c.nombre` },
      { id: "c", html: `<span style="${K}">INNER JOIN</span> carreras c` },
      { id: "d", html: `<span style="${K}">FROM</span> estudiantes e` },
    ],
  },
  answer: { order: ["b", "d", "c", "a"] },
  ok: "Primero proyectas (SELECT), luego la tabla base (FROM), después unes (INNER JOIN) y por último la condición de unión (ON).",
  bad: "Recuerda el orden: SELECT → FROM → INNER JOIN → ON. El ON siempre acompaña al JOIN que condiciona.",
},
```

bd2-l3 (match):

```js
extra: {
  type: "match",
  prompt: "Empareja cada propiedad ACID con su significado.",
  payload: {
    left: ["Atomicidad", "Consistencia", "Aislamiento", "Durabilidad"],
    right: [
      "Lo confirmado sobrevive a fallos del sistema",
      "Todo o nada: no hay efectos a medias",
      "Los datos siempre cumplen las reglas definidas",
      "Las transacciones concurrentes no se pisan entre sí",
    ],
  },
  answer: { pairs: [[0, 1], [1, 2], [2, 3], [3, 0]] },
  ok: "Atomicidad = todo o nada; consistencia = reglas intactas; aislamiento = concurrencia sin interferencia; durabilidad = lo confirmado no se pierde.",
  bad: "Repasa: atomicidad habla de 'todo o nada', durabilidad de sobrevivir fallos, aislamiento de concurrencia y consistencia de reglas.",
},
```

**Reglas para las 16 restantes:** español con tuteo, técnicamente correcto, sin emoji; en `blanks` **mínimo 2 huecos**, ≥ 2 distractores, fichas únicas en el bank y **sin fichas repetidas en `answer.blanks`** (cada ficha se usa a lo más una vez); en `order` las `lines` en orden mezclado (nunca el correcto) con ids `a/b/c/d…`; en `match` `right` mezclado (nunca pares identidad) y 4×4; `ok`/`bad` de 1–2 frases explicando el porqué; spans de color solo en template literals. Al terminar NO queda ninguna lección de bd1/bd2 sin `extra`.

- [ ] **Step 7: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS (todos, incluido el nuevo assert de 19 lecciones).

- [ ] **Step 8: Commit**

```bash
git add app/server/schema.sql app/server/seed.js app/server/seed-data/bd1.js app/server/seed-data/bd2.js app/test/helpers.js app/test/seed.test.js
git commit -m "feat: modelo de ejercicios con seed de Bases de datos I y II"
```

---

### Task 5: Contenido — extras de Programación I y II

**Files:**
- Modify: `app/server/seed-data/prog1.js`, `app/server/seed-data/prog2.js`
- Test: `app/test/seed.test.js` (assert temporal de conteo)

**Interfaces:**
- Consumes: formato `extra` y reglas de la Task 4 (léela: ejemplos completos de blanks/order/match y reglas de contenido). Código en **Java** con spans `K/S/N/C`.

- [ ] **Step 1: Test que falla** — añadir a `app/test/seed.test.js`:

```js
test("prog1 y prog2: toda lección tiene su ejercicio extra", async () => {
  await setupTestDb();
  const rows = await query(
    `SELECT COUNT(*) AS n FROM exercises e
     JOIN lessons l ON l.id = e.lesson_id JOIN units u ON u.id = l.unit_id
     WHERE u.course_id IN ('prog1','prog2') AND e.order_index = 1`
  );
  assert.equal(rows[0].n, 21);
});
```

Run (en `app/`): `npm test` → FAIL (n = 0).

- [ ] **Step 2: Escribir `extra` en las 21 lecciones**

Asignación de tipos:

| Lección | Tipo | Ejercicio sobre |
|---|---|---|
| prog1-l1 | match | concepto ↔ definición (programa, compilador, algoritmo, bug) |
| prog1-l2 | blanks | declaración de variables con tipos Java (int, String, double) |
| prog1-l3 | blanks | expresión con operadores (%, ==, &&) |
| prog1-l4 | blanks | Scanner y System.out.println |
| prog1-l5 | blanks | if / else if / else |
| prog1-l6 | blanks | switch con case y break |
| prog1-l7 | order | bucle while con contador (inicializar → condición → cuerpo → incremento) |
| prog1-l8 | blanks | cabecera de un for |
| prog1-l9 | blanks | definición y llamada de un método |
| prog1-l10 | blanks | parámetros y return |
| prog1-l11 | match | ámbito ↔ ejemplo (local, parámetro, atributo, constante) |
| prog1-l12 | order | pasos para descomponer un problema (leer → validar → calcular → mostrar) |
| prog2-l1 | blanks | class con atributos y new |
| prog2-l2 | blanks | constructor con this |
| prog2-l3 | match | encapsulamiento ↔ pieza (private, getter, setter, public) |
| prog2-l4 | blanks | extends y herencia de método |
| prog2-l5 | blanks | super(...) y @Override |
| prog2-l6 | match | abstracta/concreta/método abstracto/instanciación ↔ regla |
| prog2-l7 | order | flujo polimórfico (declarar Figura f → asignar new Circulo → llamar area() → resolver en runtime) |
| prog2-l8 | blanks | interface e implements |
| prog2-l9 | blanks | ArrayList: add, get, size |

Reglas idénticas a Task 4. Java técnicamente correcto (compilable conceptualmente).

- [ ] **Step 3: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS. El assert de forma de bd1/bd2 no valida estos (lo hará el global de Task 6), pero revisa tú mismo cada `extra` contra `assertExerciseShape` mentalmente antes de commitear.

- [ ] **Step 4: Commit**

```bash
git add app/server/seed-data/prog1.js app/server/seed-data/prog2.js app/test/seed.test.js
git commit -m "feat: ejercicios estructurados de Programación I y II"
```

---

### Task 6: Contenido — extras de Algoritmos y Desarrollo web + validación global

**Files:**
- Modify: `app/server/seed-data/algo.js`, `app/server/seed-data/web.js`
- Test: `app/test/seed.test.js` (test global de 128)

**Interfaces:**
- Consumes: formato `extra`, reglas y `assertExerciseShape` (Task 4). algo: Java o pseudocódigo; web: HTML/CSS/JS.

- [ ] **Step 1: Test global que falla** — añadir a `app/test/seed.test.js` (importando el helper local `assertExerciseShape` ya definido):

```js
test("global: 128 ejercicios, 2 por lección, todos bien formados", async () => {
  await setupTestDb();
  const rows = await query("SELECT * FROM exercises ORDER BY lesson_id, order_index");
  assert.equal(rows.length, 128);
  const byLesson = {};
  for (const r of rows) (byLesson[r.lesson_id] = byLesson[r.lesson_id] || []).push(r);
  assert.equal(Object.keys(byLesson).length, 64);
  for (const exs of Object.values(byLesson)) {
    assert.equal(exs.length, 2);
    assert.equal(exs[0].type, "choice");
    assert.notEqual(exs[1].type, "choice");
    for (const e of exs) assertExerciseShape(e);
  }
});
```

Run (en `app/`): `npm test` → FAIL (rows.length < 128).

- [ ] **Step 2: Escribir `extra` en las 24 lecciones**

| Lección | Tipo | Ejercicio sobre |
|---|---|---|
| algo-l1 | match | algoritmo/entrada/salida/paso ↔ definición |
| algo-l2 | order | pseudocódigo de "mayor de dos números" |
| algo-l3 | order | traza: orden de valores que toma una variable en un bucle |
| algo-l4 | match | O(1)/O(n)/O(log n)/O(n²) ↔ ejemplo de operación |
| algo-l5 | blanks | caso base y llamada recursiva de factorial |
| algo-l6 | blanks | recursión sobre lista (suma de elementos) |
| algo-l7 | order | pasos de Hanói para n=2 (mover disco 1 a aux → disco 2 a destino → disco 1 a destino, + paso inicial) |
| algo-l8 | match | recursión/iteración/caso base/desbordamiento ↔ característica |
| algo-l9 | order | pasos de búsqueda binaria (calcular medio → comparar → descartar mitad → repetir) |
| algo-l10 | order | una pasada de bubble sort sobre [3,1,2] |
| algo-l11 | order | fases de merge sort (dividir → ordenar mitades → combinar → devolver) |
| algo-l12 | match | problema ↔ algoritmo adecuado |
| web-l1 | order | estructura de un documento HTML (doctype → html → head → body) |
| web-l2 | match | etiqueta semántica ↔ uso (header, nav, main, footer) |
| web-l3 | blanks | form con input y label (atributos type/for) |
| web-l4 | blanks | img con src/alt y a con href |
| web-l5 | match | selector ↔ especificidad/uso (etiqueta, .clase, #id, inline) |
| web-l6 | blanks | box model: padding, border, margin en CSS |
| web-l7 | blanks | display:flex, justify-content, align-items |
| web-l8 | blanks | @media (max-width) con regla dentro |
| web-l9 | blanks | función JS con const y arrow |
| web-l10 | blanks | document.querySelector y textContent |
| web-l11 | blanks | addEventListener("click", …) |
| web-l12 | order | flujo de fetch (fetch → then res.json() → usar datos → catch) |

Reglas idénticas a Task 4.

- [ ] **Step 3: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS — 128 ejercicios validados por forma.

- [ ] **Step 4: Refrescar la BD de desarrollo**

Run (en `app/`): `npm run seed`
Expected: `Seed aplicado`.

- [ ] **Step 5: Commit**

```bash
git add app/server/seed-data/algo.js app/server/seed-data/web.js app/test/seed.test.js
git commit -m "feat: ejercicios estructurados de Algoritmos y Desarrollo web (128 totales)"
```

---

### Task 7: GET /api/lessons/:id devuelve ejercicios (retirar quiz y POST viejo)

**Files:**
- Modify: `app/server/routes/lessons.js`
- Test: `app/test/lessons.test.js` (reescritura parcial)

**Interfaces:**
- Consumes: tabla `exercises` (Tasks 4-6).
- Produces: `GET /api/lessons/:id` → igual que antes pero con `exercises: [{id, type, prompt, payload}]` (orden por `order_index`) en lugar de `quiz`. **El campo `quiz` desaparece. `POST /api/lessons/:id/answer` se elimina** (Task 8 crea el reemplazo). Estado transicional: completar lecciones vía API no es posible hasta Task 8; el frontend viejo muestra la lección sin quiz (no crashea: `lesson.quiz` undefined → panel oculto).

- [ ] **Step 1: Reescribir los tests de GET** — en `app/test/lessons.test.js`: elimina el helper `correctIndexOf` y TODOS los tests de `POST /api/lessons/:id/answer` (los reemplaza Task 8 en otro archivo). Sustituye el test del GET por:

```js
test("GET lección: contenido y ejercicios sin respuestas", async () => {
  const res = await auth(request(app).get("/api/lessons/l5"));
  assert.equal(res.status, 200);
  assert.equal(res.body.title, "Consultas SELECT y WHERE");
  assert.equal(res.body.courseId, "bd1");
  assert.deepEqual(res.body.position, { index: 5, total: 10 });
  assert.ok(Array.isArray(res.body.content) && res.body.content.length >= 2);
  assert.equal(res.body.exercises.length, 2);
  assert.deepEqual(res.body.exercises.map((e) => e.id), ["l5-ex1", "l5-ex2"]);
  assert.equal(res.body.exercises[0].type, "choice");
  assert.equal(res.body.exercises[0].payload.options.length, 4);
  const body = JSON.stringify(res.body);
  assert.ok(!body.includes("\"answer\""), "answer filtrado");
  assert.ok(!body.includes("correct_index"), "correct_index filtrado");
  assert.ok(!("quiz" in res.body), "quiz retirado");
});
```

Mantén los tests de 404/403 del GET tal cual. Entre los POST tests a eliminar está también el de tolerancia a duplicados añadido en el fix post-review ("pre-inserta la completación y responde correcto") — su comportamiento queda re-cubierto por el test de idempotencia de la Task 8.

- [ ] **Step 2: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — `res.body.exercises` es undefined.

- [ ] **Step 3: Modificar `app/server/routes/lessons.js`**

En el GET, reemplazar la consulta y el campo `quiz`:

```js
    const exercises = await query(
      "SELECT id, type, prompt, payload FROM exercises WHERE lesson_id = ? ORDER BY order_index",
      [lesson.id]
    );
```

y en el `res.json`:

```js
      exercises: exercises.map((e) => ({ id: e.id, type: e.type, prompt: e.prompt, payload: parseMaybe(e.payload) })),
```

(eliminando la consulta a `quiz_questions` y el campo `quiz`). **Eliminar por completo** el handler `router.post("/:id/answer", …)` y los imports que quedan sin uso (`getPool` si ya no se usa aquí).

- [ ] **Step 4: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS (la suite baja de conteo por los POST tests retirados — es esperado).

- [ ] **Step 5: Commit**

```bash
git add app/server/routes/lessons.js app/test/lessons.test.js
git commit -m "feat: lección expone ejercicios; retirada la API de quiz único"
```

---

### Task 8: POST /api/exercises/:id/answer (contexto lección)

**Files:**
- Create: `app/server/routes/exercises.js`
- Modify: `app/server/index.js` (mount)
- Modify: `app/test/helpers.js` (helpers de respuesta)
- Test: `app/test/exercises.test.js`

**Interfaces:**
- Consumes: `validateResponse` (Task 3), `courseDetail` (403 en bloqueado), `currentStreak`/`toDayString`, `query`/`getPool`, `requireAuth`.
- Produces (helpers de test, en `app/test/helpers.js` para que otros archivos de test los importen SIN re-ejecutar suites ajenas): `correctResponseFor(exerciseId)` y `wrongResponseFor(exerciseId)` — consultan `exercises.answer/payload` en la BD de test y devuelven el body `response` correcto/incorrecto según el tipo.
- Produces: `POST /api/exercises/:id/answer` body `{response}` →

```
{ correct, explanation, lessonCompleted, xpAwarded, perfectBonus,
  streak: {value, extended} | null, courseProgress, nextLessonId, reviewCleared }
```

  Reglas: intento SIEMPRE registrado en `answer_attempts` (context 'lesson' en esta task); lección completa cuando todos sus ejercicios tienen un intento correcto → transacción `lesson_completions` + `xp_events(+50)` (+`xp_events(+10)` si perfecto: cero intentos incorrectos context 'lesson' en la lección antes de completar); `ER_DUP_ENTRY` tolerado; `streak.extended` = no había otra completación hoy; `courseProgress` siempre; `nextLessonId` solo si completó; `reviewCleared` siempre `false` en esta task (Task 9 lo activa). `404` ejercicio inexistente; `403` curso bloqueado; `400` respuesta malformada ("Tu respuesta no tiene el formato esperado").

- [ ] **Step 1: Añadir helpers de respuesta a `app/test/helpers.js`** (al final, exportados):

```js
export async function correctResponseFor(exerciseId) {
  const [row] = await query("SELECT type, answer FROM exercises WHERE id = ?", [exerciseId]);
  const answer = typeof row.answer === "string" ? JSON.parse(row.answer) : row.answer;
  if (row.type === "choice") return { index: answer.index };
  if (row.type === "blanks") return { blanks: answer.blanks };
  if (row.type === "order") return { order: answer.order };
  return { pairs: answer.pairs };
}

export async function wrongResponseFor(exerciseId) {
  const [row] = await query("SELECT type, payload, answer FROM exercises WHERE id = ?", [exerciseId]);
  const answer = typeof row.answer === "string" ? JSON.parse(row.answer) : row.answer;
  const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  if (row.type === "choice") return { index: (answer.index + 1) % payload.options.length };
  if (row.type === "blanks") return { blanks: [...answer.blanks].reverse() };
  if (row.type === "order") return { order: [...answer.order].reverse() };
  return { pairs: answer.pairs.map(([l], i, arr) => [l, arr[(i + 1) % arr.length][1]]) };
}
```

(`blanks` invertidas siempre difieren de la respuesta: la regla de contenido garantiza ≥2 huecos sin fichas repetidas.)

- [ ] **Step 2: Escribir los tests que fallan** — `app/test/exercises.test.js`

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb, correctResponseFor, wrongResponseFor } from "./helpers.js";
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

test("404 ejercicio inexistente, 403 curso bloqueado, 400 malformada, 401 sin token", async () => {
  assert.equal((await auth(request(app).post("/api/exercises/nope/answer")).send({ response: { index: 0 } })).status, 404);
  assert.equal((await auth(request(app).post("/api/exercises/bd2-l1-ex1/answer")).send({ response: { index: 0 } })).status, 403);
  const bad = await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: { index: 99 } });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error, "Tu respuesta no tiene el formato esperado");
  assert.equal((await request(app).post("/api/exercises/l1-ex1/answer").send({ response: { index: 0 } })).status, 401);
});

test("incorrecta: registra intento, no completa, no da XP", async () => {
  const res = await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await wrongResponseFor("l1-ex1") });
  assert.equal(res.body.correct, false);
  assert.ok(res.body.explanation.length > 0);
  assert.equal(res.body.lessonCompleted, false);
  assert.equal(res.body.xpAwarded, 0);
  const attempts = await query("SELECT * FROM answer_attempts WHERE user_id = ?", [userId]);
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].correct, 0);
  assert.equal(attempts[0].context, "lesson");
  assert.equal((await query("SELECT * FROM lesson_completions WHERE user_id = ?", [userId])).length, 0);
});

test("un ejercicio correcto de dos NO completa la lección", async () => {
  const res = await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await correctResponseFor("l1-ex1") });
  assert.equal(res.body.correct, true);
  assert.equal(res.body.lessonCompleted, false);
  assert.equal(res.body.xpAwarded, 0);
  assert.equal(res.body.nextLessonId, null);
});

test("lección perfecta: completa con +50 +10, racha extendida y siguiente lección", async () => {
  await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await correctResponseFor("l1-ex1") });
  const res = await auth(request(app).post("/api/exercises/l1-ex2/answer")).send({ response: await correctResponseFor("l1-ex2") });
  assert.equal(res.body.correct, true);
  assert.equal(res.body.lessonCompleted, true);
  assert.equal(res.body.xpAwarded, 50);
  assert.equal(res.body.perfectBonus, 10);
  assert.deepEqual(res.body.streak, { value: 1, extended: true });
  assert.equal(res.body.courseProgress, 10);
  assert.equal(res.body.nextLessonId, "l2");
  const xp = await query("SELECT SUM(amount) AS total FROM xp_events WHERE user_id = ?", [userId]);
  assert.equal(Number(xp[0].total), 60);
});

test("con un fallo previo no hay bonus perfecto", async () => {
  await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await wrongResponseFor("l1-ex1") });
  await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await correctResponseFor("l1-ex1") });
  const res = await auth(request(app).post("/api/exercises/l1-ex2/answer")).send({ response: await correctResponseFor("l1-ex2") });
  assert.equal(res.body.lessonCompleted, true);
  assert.equal(res.body.xpAwarded, 50);
  assert.equal(res.body.perfectBonus, 0);
});

test("re-responder tras completar no duplica XP y segunda lección del día no extiende racha", async () => {
  for (const ex of ["l1-ex1", "l1-ex2"]) {
    await auth(request(app).post(`/api/exercises/${ex}/answer`)).send({ response: await correctResponseFor(ex) });
  }
  const again = await auth(request(app).post("/api/exercises/l1-ex2/answer")).send({ response: await correctResponseFor("l1-ex2") });
  assert.equal(again.body.lessonCompleted, false);
  assert.equal(again.body.xpAwarded, 0);
  for (const ex of ["l2-ex1", "l2-ex2"]) {
    await auth(request(app).post(`/api/exercises/${ex}/answer`)).send({ response: await correctResponseFor(ex) });
  }
  const l2done = await auth(request(app).post("/api/exercises/l2-ex2/answer")).send({ response: await correctResponseFor("l2-ex2") });
  assert.equal(l2done.body.lessonCompleted, false); // ya estaba completa por el loop anterior
  const xp = await query("SELECT SUM(amount) AS total FROM xp_events WHERE user_id = ?", [userId]);
  assert.equal(Number(xp[0].total), 120); // 50+10 (l1) + 50+10 (l2), sin duplicados
  const completions = await query("SELECT * FROM lesson_completions WHERE user_id = ?", [userId]);
  assert.equal(completions.length, 2);
});
```

Nota: el segundo `l2done` reenvía el último ejercicio ya completado — verifica idempotencia. El test de racha extendida en segunda lección: al completar l2 (dentro del loop) la respuesta debió traer `streak.extended === false`; si quieres el assert explícito, captura la respuesta del loop del último ejercicio de l2 y asévera `streak.extended === false`.

- [ ] **Step 3: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — 404 en `/api/exercises/...`.

- [ ] **Step 4: Implementar `app/server/routes/exercises.js`**

```js
import { Router } from "express";
import { query, getPool } from "../db.js";
import { courseDetail } from "../services/progress.js";
import { validateResponse } from "../services/exercises.js";
import { currentStreak, toDayString } from "../services/gamification.js";

const router = Router();

function parseMaybe(v) {
  return typeof v === "string" ? JSON.parse(v) : v;
}

async function loadExercise(id) {
  const rows = await query(
    `SELECT e.*, u.course_id
     FROM exercises e
     JOIN lessons l ON l.id = e.lesson_id
     JOIN units u ON u.id = l.unit_id
     WHERE e.id = ?`,
    [id]
  );
  return rows[0] || null;
}

router.post("/:id/answer", async (req, res, next) => {
  try {
    const ex = await loadExercise(req.params.id);
    if (!ex) return res.status(404).json({ error: "Este ejercicio no existe" });
    await courseDetail(req.userId, ex.course_id); // lanza 403 si el curso está bloqueado

    const { valid, correct } = validateResponse(
      ex.type,
      parseMaybe(ex.payload),
      parseMaybe(ex.answer),
      req.body && req.body.response
    );
    if (!valid) return res.status(400).json({ error: "Tu respuesta no tiene el formato esperado" });

    await query(
      "INSERT INTO answer_attempts (user_id, exercise_id, context, correct) VALUES (?, ?, 'lesson', ?)",
      [req.userId, ex.id, correct ? 1 : 0]
    );

    let lessonCompleted = false;
    let xpAwarded = 0;
    let perfectBonus = 0;
    let streak = null;

    if (correct) {
      const done = await query(
        "SELECT lesson_id FROM lesson_completions WHERE user_id = ? AND lesson_id = ?",
        [req.userId, ex.lesson_id]
      );
      if (!done.length) {
        const remaining = await query(
          `SELECT e.id FROM exercises e
           LEFT JOIN answer_attempts a ON a.exercise_id = e.id AND a.user_id = ? AND a.correct = 1
           WHERE e.lesson_id = ? AND a.id IS NULL`,
          [req.userId, ex.lesson_id]
        );
        if (!remaining.length) {
          const fails = await query(
            `SELECT a.id FROM answer_attempts a
             JOIN exercises e ON e.id = a.exercise_id
             WHERE a.user_id = ? AND e.lesson_id = ? AND a.context = 'lesson' AND a.correct = 0
             LIMIT 1`,
            [req.userId, ex.lesson_id]
          );
          const perfect = fails.length === 0;
          const todayDone = await query(
            "SELECT lesson_id FROM lesson_completions WHERE user_id = ? AND DATE(completed_at) = CURDATE() LIMIT 1",
            [req.userId]
          );
          const conn = await getPool().getConnection();
          try {
            await conn.beginTransaction();
            await conn.query("INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, ?)", [req.userId, ex.lesson_id]);
            await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, 50)", [req.userId, ex.lesson_id]);
            if (perfect) {
              await conn.query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, 10)", [req.userId, ex.lesson_id]);
            }
            await conn.commit();
            lessonCompleted = true;
            xpAwarded = 50;
            perfectBonus = perfect ? 10 : 0;
          } catch (e) {
            await conn.rollback();
            if (!(e && e.code === "ER_DUP_ENTRY")) throw e;
          } finally {
            conn.release();
          }
          if (lessonCompleted) {
            const rows = await query("SELECT completed_at FROM lesson_completions WHERE user_id = ?", [req.userId]);
            const days = rows.map((r) => toDayString(r.completed_at));
            streak = { value: currentStreak(days, toDayString(new Date())), extended: todayDone.length === 0 };
          }
        }
      }
    }

    const detail = await courseDetail(req.userId, ex.course_id);
    const all = detail.units.flatMap((u) => u.lessons);
    const idx = all.findIndex((l) => l.id === ex.lesson_id);
    const nextLesson = lessonCompleted && all[idx + 1] ? all[idx + 1].id : null;

    res.json({
      correct,
      explanation: correct ? ex.explain_ok : ex.explain_bad,
      lessonCompleted,
      xpAwarded,
      perfectBonus,
      streak,
      courseProgress: detail.progress,
      nextLessonId: nextLesson,
      reviewCleared: false,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
```

- [ ] **Step 5: Montar en `app/server/index.js`**

```js
import exercisesRouter from "./routes/exercises.js";
```

```js
  app.use("/api/exercises", requireAuth, exercisesRouter);
```

- [ ] **Step 6: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/server/routes/exercises.js app/server/index.js app/test/helpers.js app/test/exercises.test.js
git commit -m "feat: responder ejercicios con completación, bonus perfecto y racha"
```

---

### Task 9: Repaso de errores (backend)

**Files:**
- Create: `app/server/services/review.js`
- Create: `app/server/routes/review.js`
- Modify: `app/server/routes/exercises.js` (contexto review + XP de repaso)
- Modify: `app/server/routes/me.js` (stats.reviewCount)
- Modify: `app/server/index.js` (mount /api/review)
- Test: `app/test/review.test.js`, ajuste en `app/test/me.test.js`

**Interfaces:**
- Consumes: `answer_attempts` con `context`, ruta answer (Task 8), helper `correctResponseFor` exportado de `app/test/exercises.test.js`.
- Produces (services/review.js):
  - `isPendingReview(userId, exerciseId) → boolean` — hay intento incorrecto sin acierto en modo review posterior.
  - `pendingReview(userId, limit = 10) → [{id, type, prompt, payload, lessonTitle, courseSubject}]` (más reciente primero, sin answer).
  - `reviewCount(userId) → number`.
- Produces (rutas): `GET /api/review` → `{count, exercises}`; `POST /api/exercises/:id/answer` acepta `context: "review"` en el body → si el acierto limpia un pendiente: `reviewCleared: true`, `xpAwarded: 5` (evento xp_events amount 5, única vez por limpieza); en contexto review NUNCA completa lecciones ni da +50. `GET /api/me` → `stats.reviewCount`.

- [ ] **Step 1: Escribir los tests que fallan** — `app/test/review.test.js`

```js
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb, correctResponseFor, wrongResponseFor } from "./helpers.js";
import { createApp } from "../server/index.js";

let app;
let token;

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
});
after(closeDb);

const auth = (req) => req.set("Authorization", `Bearer ${token}`);

async function failOnce(exId) {
  await auth(request(app).post(`/api/exercises/${exId}/answer`)).send({ response: await wrongResponseFor(exId) });
}

test("fallar encola; acertar en modo lección NO desencola", async () => {
  await failOnce("l1-ex1");
  let review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.count, 1);
  assert.equal(review.body.exercises[0].id, "l1-ex1");
  assert.ok(!JSON.stringify(review.body).includes("\"answer\""));
  await auth(request(app).post("/api/exercises/l1-ex1/answer")).send({ response: await correctResponseFor("l1-ex1") });
  review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.count, 1, "sigue pendiente: el acierto fue en modo lección");
});

test("acertar en modo review desencola, da +5 una sola vez", async () => {
  await failOnce("l1-ex1");
  const res = await auth(request(app).post("/api/exercises/l1-ex1/answer"))
    .send({ response: await correctResponseFor("l1-ex1"), context: "review" });
  assert.equal(res.body.correct, true);
  assert.equal(res.body.reviewCleared, true);
  assert.equal(res.body.xpAwarded, 5);
  assert.equal(res.body.lessonCompleted, false, "review nunca completa lecciones");
  const review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.count, 0);
  const again = await auth(request(app).post("/api/exercises/l1-ex1/answer"))
    .send({ response: await correctResponseFor("l1-ex1"), context: "review" });
  assert.equal(again.body.reviewCleared, false);
  assert.equal(again.body.xpAwarded, 0);
  const xp = await query("SELECT SUM(amount) AS total FROM xp_events");
  assert.equal(Number(xp[0].total), 5);
});

test("fallar en review lo mantiene en cola; re-fallo tras limpiar re-encola", async () => {
  await failOnce("l1-ex1");
  await failOnce("l1-ex1"); // dos fallos, una sola entrada en cola (agrupa por ejercicio)
  let review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.count, 1);
  await auth(request(app).post("/api/exercises/l1-ex1/answer"))
    .send({ response: await correctResponseFor("l1-ex1"), context: "review" });
  await failOnce("l1-ex1");
  review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.count, 1, "un fallo posterior a la limpieza re-encola");
});

test("la cola se limita a 10 y me.stats.reviewCount refleja el total", async () => {
  const lessons = await query(
    `SELECT l.id FROM lessons l JOIN units u ON u.id = l.unit_id
     WHERE u.course_id = 'bd1' ORDER BY u.order_index, l.order_index`
  );
  for (const { id } of lessons) {
    await failOnce(id + "-ex1");
    await failOnce(id + "-ex2");
  }
  const review = await auth(request(app).get("/api/review"));
  assert.equal(review.body.exercises.length, 10);
  assert.equal(review.body.count, 20);
  const me = await auth(request(app).get("/api/me"));
  assert.equal(me.body.stats.reviewCount, 20);
});
```

Y en `app/test/me.test.js`, en el test del usuario nuevo, actualizar el `deepEqual` de stats para incluir `reviewCount: 0`.

- [ ] **Step 2: Verificar que fallan**

Run (en `app/`): `npm test`
Expected: FAIL — 404 en `/api/review` y `reviewCleared`/`reviewCount` ausentes.

- [ ] **Step 3: Implementar `app/server/services/review.js`**

```js
import { query } from "../db.js";

function parseMaybe(v) {
  return typeof v === "string" ? JSON.parse(v) : v;
}

const PENDING_HAVING = `HAVING last_wrong IS NOT NULL AND (last_review_ok IS NULL OR last_review_ok < last_wrong)`;

export async function isPendingReview(userId, exerciseId) {
  const rows = await query(
    `SELECT
       MAX(CASE WHEN correct = 0 THEN created_at END) AS last_wrong,
       MAX(CASE WHEN correct = 1 AND context = 'review' THEN created_at END) AS last_review_ok
     FROM answer_attempts
     WHERE user_id = ? AND exercise_id = ?`,
    [userId, exerciseId]
  );
  const r = rows[0];
  return Boolean(r && r.last_wrong && (!r.last_review_ok || r.last_review_ok < r.last_wrong));
}

export async function pendingReview(userId, limit = 10) {
  const rows = await query(
    `SELECT e.id, e.type, e.prompt, e.payload, l.title AS lesson_title, c.subject AS course_subject,
            MAX(CASE WHEN a.correct = 0 THEN a.created_at END) AS last_wrong,
            MAX(CASE WHEN a.correct = 1 AND a.context = 'review' THEN a.created_at END) AS last_review_ok
     FROM answer_attempts a
     JOIN exercises e ON e.id = a.exercise_id
     JOIN lessons l ON l.id = e.lesson_id
     JOIN units u ON u.id = l.unit_id
     JOIN courses c ON c.id = u.course_id
     WHERE a.user_id = ?
     GROUP BY e.id, e.type, e.prompt, e.payload, l.title, c.subject
     ${PENDING_HAVING}
     ORDER BY last_wrong DESC
     LIMIT ${Number(limit)}`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    prompt: r.prompt,
    payload: parseMaybe(r.payload),
    lessonTitle: r.lesson_title,
    courseSubject: r.course_subject,
  }));
}

export async function reviewCount(userId) {
  const rows = await query(
    `SELECT COUNT(*) AS n FROM (
       SELECT a.exercise_id,
              MAX(CASE WHEN a.correct = 0 THEN a.created_at END) AS last_wrong,
              MAX(CASE WHEN a.correct = 1 AND a.context = 'review' THEN a.created_at END) AS last_review_ok
       FROM answer_attempts a
       WHERE a.user_id = ?
       GROUP BY a.exercise_id
       ${PENDING_HAVING}
     ) pendientes`,
    [userId]
  );
  return Number(rows[0].n);
}
```

(`limit` se interpola con `Number()` — MySQL no acepta placeholder en LIMIT con todas las configs; la coerción numérica elimina cualquier inyección.)

- [ ] **Step 4: Actualizar `app/server/routes/exercises.js`**

(a) Import: `import { isPendingReview } from "../services/review.js";`

(b) Tras validar y ANTES del INSERT del intento:

```js
    const context = req.body && req.body.context === "review" ? "review" : "lesson";
    let reviewCleared = false;
    if (context === "review" && correct) {
      reviewCleared = await isPendingReview(req.userId, ex.id);
    }
```

(c) El INSERT del intento usa `context` en lugar del literal `'lesson'`:

```js
    await query(
      "INSERT INTO answer_attempts (user_id, exercise_id, context, correct) VALUES (?, ?, ?, ?)",
      [req.userId, ex.id, context, correct ? 1 : 0]
    );
```

(d) Tras el INSERT, otorgar XP de repaso, y condicionar la completación a `context === "lesson"`:

```js
    if (reviewCleared) {
      await query("INSERT INTO xp_events (user_id, lesson_id, amount) VALUES (?, ?, 5)", [req.userId, ex.lesson_id]);
      xpAwarded = 5;
    }

    if (context === "lesson" && correct) {
```

(e) En el `res.json`, `reviewCleared` deja de ser el literal `false` y pasa a la variable.

- [ ] **Step 5: Crear `app/server/routes/review.js` y montar**

```js
import { Router } from "express";
import { pendingReview, reviewCount } from "../services/review.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.json({
      count: await reviewCount(req.userId),
      exercises: await pendingReview(req.userId, 10),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
```

En `app/server/index.js`:

```js
import reviewRouter from "./routes/review.js";
```

```js
  app.use("/api/review", requireAuth, reviewRouter);
```

- [ ] **Step 6: Añadir `reviewCount` a `app/server/routes/me.js`**

```js
import { reviewCount } from "../services/review.js";
```

y en `stats`:

```js
        reviewCount: await reviewCount(req.userId),
```

- [ ] **Step 7: Verificar que pasan**

Run (en `app/`): `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/server/services/review.js app/server/routes/review.js app/server/routes/exercises.js app/server/routes/me.js app/server/index.js app/test/review.test.js app/test/me.test.js
git commit -m "feat: repaso de errores derivado de intentos con +5 XP por corrección"
```

---

### Task 10: Contract — eliminar quiz_questions

**Files:**
- Modify: `app/server/schema.sql` (DROP)
- Modify: `app/server/seed.js` (retirar upsert de quiz_questions)
- Modify: `app/test/seed.test.js` (retirar asserts de quiz_questions)

**Interfaces:**
- Produces: la tabla `quiz_questions` deja de existir; `exercises` es la única fuente. Los campos `quiz` de seed-data se conservan (alimentan ex1).

- [ ] **Step 1: Modificar `app/server/schema.sql`** — eliminar el bloque `CREATE TABLE IF NOT EXISTS quiz_questions …` completo y añadir en su lugar (después del CREATE de `answer_attempts`):

```sql
DROP TABLE IF EXISTS quiz_questions;
```

- [ ] **Step 2: Modificar `app/server/seed.js`** — eliminar el `await query(INSERT INTO quiz_questions …)` del loop de lecciones (el upsert de `exercises` queda).

- [ ] **Step 3: Limpiar `app/test/seed.test.js`** — retirar los asserts que consultan `quiz_questions`:

(a) El del quiz de l5 con `correct_index = 1` se sustituye por su equivalente sobre exercises:

```js
  const [ex1] = await query("SELECT * FROM exercises WHERE id = 'l5-ex1'");
  const answer = typeof ex1.answer === "string" ? JSON.parse(ex1.answer) : ex1.answer;
  assert.equal(answer.index, 1);
  assert.match(ex1.prompt, /promedio/);
```

(b) El test "seed completo" cambia su assert de quizzes por: `SELECT COUNT(*) AS n FROM exercises` → 128.

(c) El test "toda lección sembrada tiene contenido y quiz bien formados" (LEFT JOIN a quiz_questions) se reescribe sobre el ex1 de cada lección:

```js
test("toda lección sembrada tiene contenido y su ejercicio choice bien formado", async () => {
  await setupTestDb();
  const rows = await query(
    `SELECT l.id, l.content, e.payload, e.answer
     FROM lessons l LEFT JOIN exercises e ON e.lesson_id = l.id AND e.order_index = 0`
  );
  for (const row of rows) {
    const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
    assert.ok(Array.isArray(content) && content.length >= 2, `contenido corto en ${row.id}`);
    assert.notEqual(row.payload, null, `falta ejercicio choice en ${row.id}`);
    const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
    const answer = typeof row.answer === "string" ? JSON.parse(row.answer) : row.answer;
    assert.equal(payload.options.length, 4, `opciones en ${row.id}`);
    assert.ok(answer.index >= 0 && answer.index <= 3, `answer.index en ${row.id}`);
  }
});
```

- [ ] **Step 4: Verificar cero referencias**

Run (en el repo): `grep -rn "quiz_questions" app/ --include="*.js" --include="*.sql"`
Expected: sin resultados.

- [ ] **Step 5: Suite completa**

Run (en `app/`): `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/server/schema.sql app/server/seed.js app/test/seed.test.js
git commit -m "refactor: quiz_questions eliminada; exercises es la única fuente"
```

---

### Task 11: Renderers de ejercicios (frontend)

**Files:**
- Create: `app/web/screens/exercises.jsx`
- Modify: `app/web/index.html` (script antes de LessonScreen.jsx)

**Interfaces:**
- Consumes: bundle del DS (`Radio`), globales `KIcon`/`ICONS`, estilos `.lesson-content`.
- Produces (globales window; los consumen LessonScreen y ReviewScreen):
  - `ExerciseBody({ exercise, value, onChange, locked })` — despacha al renderer según `exercise.type`; `value` es la respuesta parcial (forma por tipo, ver abajo) o `null`; `onChange(nuevoValue)`; `locked` congela la interacción mientras se muestra feedback.
  - `responseComplete(exercise, value) → boolean` — habilita "Comprobar".
  - Formas de `value` = las del body de la API: `{index}` / `{blanks: [string|null…]}` (completo cuando sin null) / `{order: [ids…]}` / `{pairs: [[l,r]…]}`.

- [ ] **Step 1: Crear `app/web/screens/exercises.jsx`**

```jsx
const KITE = window.CodingDesignSystem_2ecb3a;

function responseComplete(exercise, value) {
  if (!value) return false;
  const p = exercise.payload;
  if (exercise.type === "choice") return Number.isInteger(value.index);
  if (exercise.type === "blanks") return Array.isArray(value.blanks) && value.blanks.every((b) => typeof b === "string");
  if (exercise.type === "order") return Array.isArray(value.order) && value.order.length === p.lines.length;
  if (exercise.type === "match") return Array.isArray(value.pairs) && value.pairs.length === p.left.length;
  return false;
}

function blanksCount(payload) {
  return (payload.code.join("\n").match(/<b\d+>/g) || []).length;
}

function ChoiceExercise({ payload, value, onChange, locked }) {
  const { Radio } = KITE;
  const sel = value ? value.index : -1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {payload.options.map((o, i) => (
        <div key={i} onClick={() => !locked && onChange({ index: i })}
          style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: sel === i ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", border: "1px solid " + (sel === i ? "var(--focus-ring)" : "var(--glass-stroke)"), cursor: locked ? "default" : "pointer", transition: "all var(--duration-fast) var(--ease-glass)" }}>
          <Radio name="ex-choice" checked={sel === i} onChange={() => !locked && onChange({ index: i })}
            label={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{o}</span>} />
        </div>
      ))}
    </div>
  );
}

function TokenChip({ text, ghost, onClick }) {
  return (
    <button onClick={onClick} disabled={ghost || !onClick}
      style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, padding: "7px 14px", borderRadius: "var(--radius-pill)", border: "1px solid var(--glass-stroke-strong)", background: ghost ? "transparent" : "var(--glass-bg-strong)", color: ghost ? "var(--text-tertiary)" : "var(--text-primary)", opacity: ghost ? 0.35 : 1, cursor: onClick && !ghost ? "pointer" : "default", boxShadow: ghost ? "none" : "var(--refraction-edge)", transition: "all var(--duration-fast) var(--ease-glass)" }}>
      {text}
    </button>
  );
}

function BlanksExercise({ payload, value, onChange, locked }) {
  const total = blanksCount(payload);
  const placed = value && value.blanks ? value.blanks : Array(total).fill(null);
  const usedTokens = new Set(placed.filter((t) => t !== null));

  const place = (token) => {
    if (locked || usedTokens.has(token)) return;
    const i = placed.indexOf(null);
    if (i === -1) return;
    const next = [...placed];
    next[i] = token;
    onChange({ blanks: next });
  };
  const remove = (slotIndex) => {
    if (locked || placed[slotIndex] === null) return;
    const next = [...placed];
    next[slotIndex] = null;
    onChange({ blanks: next });
  };

  let slotCursor = -1;
  return (
    <div>
      <div className="lesson-content" style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, lineHeight: 2.1, background: "rgba(3,6,16,0.55)", border: "1px solid var(--glass-stroke)", borderRadius: "var(--radius-sm)", padding: "14px 18px" }}>
        {payload.code.map((line, li) => (
          <div key={li}>
            {line.split(/(<b\d+>)/).map((part, pi) => {
              if (/^<b\d+>$/.test(part)) {
                slotCursor += 1;
                const idx = slotCursor;
                const token = placed[idx];
                return token !== null ? (
                  <span key={pi} onClick={() => remove(idx)} style={{ display: "inline-block", margin: "0 3px", cursor: locked ? "default" : "pointer" }}>
                    <TokenChip text={token} />
                  </span>
                ) : (
                  <span key={pi} style={{ display: "inline-block", minWidth: 72, margin: "0 3px", borderBottom: "2px dashed var(--glass-stroke-strong)", height: "1.2em", verticalAlign: "middle" }}></span>
                );
              }
              return <span key={pi} dangerouslySetInnerHTML={{ __html: part }} />;
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {payload.bank.map((token) => (
          <TokenChip key={token} text={token} ghost={usedTokens.has(token)} onClick={() => place(token)} />
        ))}
      </div>
    </div>
  );
}

function OrderExercise({ payload, value, onChange, locked }) {
  const order = value && value.order ? value.order : [];
  const byId = Object.fromEntries(payload.lines.map((l) => [l.id, l]));
  const available = payload.lines.filter((l) => !order.includes(l.id));

  const lineStyle = { fontFamily: "var(--font-mono)", fontSize: 13, padding: "9px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-stroke)", background: "var(--glass-bg-subtle)", cursor: locked ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all var(--duration-fast) var(--ease-glass)" };

  return (
    <div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", fontWeight: 600, marginBottom: 8 }}>Tu secuencia</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 44, marginBottom: 14, padding: 8, borderRadius: "var(--radius-md)", border: "1px dashed var(--glass-stroke-strong)" }}>
        {order.map((id, i) => (
          <div key={id} style={{ ...lineStyle, background: "var(--glass-bg-strong)" }} onClick={() => !locked && onChange({ order: order.filter((x) => x !== id) })}>
            <span style={{ color: "var(--accent-cyan)", fontWeight: 700, minWidth: 16 }}>{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: byId[id].html }} />
          </div>
        ))}
        {order.length === 0 ? <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", padding: 6 }}>Toca las líneas de abajo en el orden correcto</div> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {available.map((l) => (
          <div key={l.id} style={lineStyle} onClick={() => !locked && onChange({ order: [...order, l.id] })}>
            <span dangerouslySetInnerHTML={{ __html: l.html }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchExercise({ payload, value, onChange, locked }) {
  const pairs = value && value.pairs ? value.pairs : [];
  const [selLeft, setSelLeft] = React.useState(null);
  const pairedL = new Set(pairs.map((p) => p[0]));
  const pairedR = new Set(pairs.map((p) => p[1]));
  const colors = ["#5E97E6", "#52C9B8", "#9289E3", "#E6AF6B"];
  const pairColor = {};
  pairs.forEach((p, i) => { pairColor[p[0]] = colors[i % colors.length]; pairColor["r" + p[1]] = colors[i % colors.length]; });

  const clickLeft = (i) => {
    if (locked) return;
    if (pairedL.has(i)) { onChange({ pairs: pairs.filter((p) => p[0] !== i) }); setSelLeft(null); return; }
    setSelLeft(i === selLeft ? null : i);
  };
  const clickRight = (j) => {
    if (locked || selLeft === null) return;
    if (pairedR.has(j)) return;
    onChange({ pairs: [...pairs, [selLeft, j]] });
    setSelLeft(null);
  };

  const cell = (text, active, color, onClick) => (
    <div onClick={onClick} style={{ padding: "11px 14px", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", color: "var(--text-primary)", background: active ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", border: "1px solid " + (color || (active ? "var(--focus-ring)" : "var(--glass-stroke)")), borderLeft: color ? "3px solid " + color : undefined, cursor: locked ? "default" : "pointer", transition: "all var(--duration-fast) var(--ease-glass)" }}>
      {text}
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {payload.left.map((t, i) => cell(t, selLeft === i || pairedL.has(i), pairColor[i], () => clickLeft(i)))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {payload.right.map((t, j) => cell(t, pairedR.has(j), pairColor["r" + j], () => clickRight(j)))}
      </div>
    </div>
  );
}

function ExerciseBody({ exercise, value, onChange, locked }) {
  const p = { payload: exercise.payload, value, onChange, locked };
  if (exercise.type === "choice") return <ChoiceExercise {...p} />;
  if (exercise.type === "blanks") return <BlanksExercise {...p} />;
  if (exercise.type === "order") return <OrderExercise {...p} />;
  if (exercise.type === "match") return <MatchExercise {...p} />;
  return null;
}

Object.assign(window, { ExerciseBody, responseComplete });
```

- [ ] **Step 2: Script en `app/web/index.html`** — antes de `LessonScreen.jsx`:

```html
<script type="text/babel" src="/screens/exercises.jsx"></script>
```

- [ ] **Step 3: Verificar carga sin errores**

Con el servidor corriendo, recarga `http://localhost:3000` → consola sin errores; `typeof window.ExerciseBody === "function"` y `typeof window.responseComplete === "function"` en consola. (El comportamiento se verifica end-to-end en Task 12.)

- [ ] **Step 4: Suite backend sin regresión**

Run (en `app/`): `npm test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add app/web/screens/exercises.jsx app/web/index.html
git commit -m "feat: renderers tap-based de los 4 tipos de ejercicio"
```

---

### Task 12: LessonScreen como stepper con feedback en banda

**Files:**
- Modify (reemplazo completo): `app/web/screens/LessonScreen.jsx`

**Interfaces:**
- Consumes: `ExerciseBody`/`responseComplete` (Task 11), `Orb` (Task 2), `FX` (Task 1), API `GET /api/lessons/:id` (exercises) y `POST /api/exercises/:id/answer` (Task 8). Props desde app.jsx (sin cambios): `{me, courseId, lessonId, tab, setTab, onBack, onOpenLesson, showToast, refreshMe}`.
- Produces: pantalla stepper. Al recibir `lessonCompleted: true` guarda `celebration` en estado — **Task 13 la renderiza** (en esta task, al completar: banda verde y su "Continuar" vuelve al temario con un toast simple `showToast` provisional).

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

function StepBar({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, flex: 1, maxWidth: 260 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ flex: 1, height: 6, borderRadius: 99, background: i < current ? "linear-gradient(90deg, #6FA0E0, #52C9B8)" : "var(--glass-bg-strong)", boxShadow: i < current ? "0 0 8px rgba(82,201,184,0.45)" : "none", transition: "all var(--duration-base) var(--ease-glass)" }}></span>
      ))}
    </div>
  );
}

function FeedbackBand({ result, onContinue, onRetry }) {
  const { Button } = KITX;
  if (!result) return null;
  const ok = result.correct;
  return (
    <div className="anim-rise" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60 }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px 24px" }}>
        <div style={{ position: "relative", borderRadius: "var(--radius-lg)", padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, background: ok ? "rgba(76,199,147,0.14)" : "rgba(230,121,132,0.13)", border: "1px solid " + (ok ? "rgba(76,199,147,0.45)" : "rgba(230,121,132,0.45)"), boxShadow: "var(--shadow-float)" }}>
          <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(28px) saturate(135%)", backdropFilter: "blur(28px) saturate(135%)" }}></span>
          <strong style={{ color: ok ? "#4CC793" : "#E67984", fontSize: "var(--text-md)", flexShrink: 0 }}>{ok ? "¡Correcto!" : "No exactamente"}</strong>
          <span style={{ flex: 1, color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>{result.explanation}</span>
          {ok
            ? <Button onClick={onContinue}>Continuar</Button>
            : <Button variant="secondary" onClick={onRetry}>Intentar de nuevo</Button>}
        </div>
      </div>
    </div>
  );
}

function LessonScreen({ me, courseId, lessonId, onBack, onOpenLesson, tab, setTab, showToast, refreshMe }) {
  const { GlassPanel, Badge, Button, IconButton, Progress } = KITX;
  const [lesson, setLesson] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [step, setStep] = React.useState(0); // 0 = teoría; 1..N = ejercicios
  const [value, setValue] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [celebration, setCelebration] = React.useState(null);
  const [orbMood, setOrbMood] = React.useState("idle");
  const [panelAnim, setPanelAnim] = React.useState("");
  const orbTimer = React.useRef(null);

  const orbReact = (mood, ms) => {
    setOrbMood(mood);
    clearTimeout(orbTimer.current);
    orbTimer.current = setTimeout(() => setOrbMood("idle"), ms);
  };

  const load = () => {
    setLesson(null); setError(null); setStep(0); setValue(null); setResult(null); setCelebration(null); setOrbMood("idle");
    API.get("/lessons/" + lessonId).then(setLesson).catch((e) => setError(e.message));
  };
  React.useEffect(load, [lessonId]);

  if (error) {
    return (
      <PageFrame>
        <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
        <div style={{ marginTop: 36 }}><ErrorPanel message={error} onRetry={load} /></div>
      </PageFrame>
    );
  }
  if (!lesson) {
    return (
      <PageFrame>
        <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
        <LoadingPanel />
      </PageFrame>
    );
  }

  const exercises = lesson.exercises || [];
  const totalSteps = exercises.length + 1;
  const ex = step > 0 ? exercises[step - 1] : null;

  const check = async () => {
    setSending(true);
    try {
      const r = await API.post("/exercises/" + ex.id + "/answer", { response: value });
      setResult(r);
      if (r.correct) {
        orbReact("happy", 700);
        FX.sound.play("correct");
        setPanelAnim("anim-pop");
      } else {
        orbReact("sad", 900);
        FX.sound.play("wrong");
        setPanelAnim("anim-shake");
      }
      setTimeout(() => setPanelAnim(""), 400);
      if (r.xpAwarded > 0) refreshMe();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const continueNext = () => {
    if (result.lessonCompleted) {
      setCelebration({ ...result, lessonTitle: lesson.title, courseSubject: lesson.courseSubject, prevProgress: lesson.courseProgress });
      setResult(null);
      // Task 13 renderiza la celebración; puente provisional:
      if (!window.CelebrationScreen) {
        showToast({ tone: "success", title: "Lección completada", description: "+" + (result.xpAwarded + result.perfectBonus) + " XP en " + lesson.courseSubject });
        onBack();
      }
      return;
    }
    setStep(step + 1);
    setValue(null);
    setResult(null);
  };

  if (celebration && window.CelebrationScreen) {
    return <CelebrationScreen data={celebration} onNext={celebration.nextLessonId ? () => onOpenLesson(celebration.nextLessonId) : null} onBack={onBack} me={me} tab={tab} setTab={setTab} />;
  }

  return (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 20px" }}>
        <IconButton label="Volver" onClick={onBack}><KIcon d={ICONS.back} /></IconButton>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{lesson.courseSubject} / {lesson.unitName.split(" · ")[0]}</span>
        <div style={{ flex: 1 }}></div>
        <StepBar total={totalSteps} current={step + (result && result.correct ? 1 : 0)} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>Lección {lesson.position.index} de {lesson.position.total}</span>
      </div>

      {step === 0 ? (
        <GlassPanel padding="var(--space-7)" radius="var(--radius-xl)" style={{ maxWidth: 760, margin: "0 auto" }}>
          <Badge tone="cyan">LECCIÓN {lesson.position.index}</Badge>
          <h1 style={{ margin: "12px 0 10px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>{lesson.title}</h1>
          <ContentBlocks content={lesson.content} />
          <div style={{ marginTop: 20, textAlign: "right" }}>
            <Button size="lg" onClick={() => setStep(1)} iconLeft={<KIcon d={ICONS.play} />}>Continuar</Button>
          </div>
        </GlassPanel>
      ) : (
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start", maxWidth: 820, margin: "0 auto" }}>
          <Orb size={56} mood={orbMood} style={{ marginTop: 8 }} />
          <GlassPanel tint="blue" padding="var(--space-6)" radius="var(--radius-xl)" style={{ flex: 1 }} className={panelAnim}>
            <div className={panelAnim}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>
                Ejercicio {step} de {exercises.length}
              </div>
              <p style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 500, color: "var(--text-primary)" }}>{ex.prompt}</p>
              <ExerciseBody exercise={ex} value={value} onChange={setValue} locked={Boolean(result) || sending} />
              <div style={{ marginTop: 20 }}>
                <Button fullWidth disabled={!responseComplete(ex, value) || sending || Boolean(result && result.correct)} onClick={check}>
                  {sending ? "Comprobando…" : "Comprobar"}
                </Button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      <FeedbackBand result={result} onContinue={continueNext} onRetry={() => { setResult(null); }} />
    </PageFrame>
  );
}
Object.assign(window, { LessonScreen });
```

Nota: `GlassPanel` puede no aceptar `className`; si al verificar el shake/pop no se aplica, el `div` interno con `className={panelAnim}` es el portador real del efecto (por eso está duplicado) — elimina el `className` del GlassPanel si genera warning.

- [ ] **Step 2: Verificar en el navegador**

1. Abrir una lección NO completada (usa una cuenta nueva si hace falta): paso de teoría con "Continuar" → primer ejercicio (choice) con orbe flotando al lado.
2. "Comprobar" deshabilitado sin selección; responde MAL → banda roja sube con explicación, panel tiembla, orbe se atenúa, sonido grave; "Intentar de nuevo" cierra la banda y permite reintentar.
3. Responde BIEN → banda verde, pop, orbe brilla, ping; "Continuar" pasa al ejercicio 2 (estructurado: prueba llenar huecos/ordenar/emparejar según el tipo).
4. Completa el ejercicio 2 → (celebración aún no existe) toast provisional "+60 XP" y vuelve al temario; l1 con check verde y progreso 10%.
5. StepBar se llena por pasos. Consola sin errores.

- [ ] **Step 3: Suite backend sin regresión**

Run (en `app/`): `npm test` → PASS.

- [ ] **Step 4: Commit**

```bash
git add app/web/screens/LessonScreen.jsx
git commit -m "feat: lección como stepper con feedback en banda, orbe y sonido"
```

---

### Task 13: Pantalla de celebración

**Files:**
- Modify: `app/web/screens/LessonScreen.jsx` (añadir CelebrationScreen al final, antes del Object.assign)

**Interfaces:**
- Consumes: `data` = `{xpAwarded, perfectBonus, streak, courseProgress, nextLessonId, lessonTitle, courseSubject, prevProgress}` (lo arma LessonScreen, Task 12), `Orb`, `FX`, DS `Progress`/`Button`/`GlassPanel`.
- Produces: global `CelebrationScreen({ data, onNext, onBack, me, tab, setTab })`. El puente provisional de Task 12 (`if (!window.CelebrationScreen)`) queda inerte automáticamente.

- [ ] **Step 1: Añadir a `app/web/screens/LessonScreen.jsx`** (antes del `Object.assign` final):

```jsx
function CelebrationScreen({ data, onNext, onBack, me, tab, setTab }) {
  const { GlassPanel, Button, Progress } = KITX;
  const xpRef = React.useRef(null);
  const [ring, setRing] = React.useState(data.prevProgress);
  const [showPerfect, setShowPerfect] = React.useState(false);
  const [showStreak, setShowStreak] = React.useState(false);

  React.useEffect(() => {
    FX.sound.play("complete");
    FX.countUp(xpRef.current, 0, data.xpAwarded, 900);
    const timers = [];
    if (data.perfectBonus > 0) {
      timers.push(setTimeout(() => { setShowPerfect(true); FX.sound.play("perfect"); }, 1000));
    }
    if (data.streak && data.streak.extended) {
      timers.push(setTimeout(() => { setShowStreak(true); FX.sound.play("streak"); }, 1400));
    }
    timers.push(setTimeout(() => {
      const start = performance.now();
      const dur = 900;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        setRing(Math.round(data.prevProgress + (data.courseProgress - data.prevProgress) * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 500));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlassPanel strength="strong" padding="var(--space-8)" radius="var(--radius-xl)" style={{ width: 460, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <Orb size={120} mood="celebrate" />
          </div>
          <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>¡Lección completada!</h1>
          <p style={{ margin: "0 0 22px", fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>{data.lessonTitle}</p>

          <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 800, color: "var(--accent-cyan)", fontVariantNumeric: "tabular-nums" }}>
            +<span ref={xpRef}>0</span> XP
          </div>
          {showPerfect ? (
            <div className="anim-pop" style={{ marginTop: 6, fontSize: "var(--text-md)", fontWeight: 700, color: "var(--accent-amber)" }}>Perfecto +{data.perfectBonus}</div>
          ) : null}
          {showStreak ? (
            <div className="anim-pop" style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, color: "var(--accent-amber)", fontSize: "var(--text-md)", fontWeight: 600 }}>
              <span className="anim-pulse-glow" style={{ display: "inline-flex" }}><KIcon d={ICONS.flame} size={18} /></span>
              Racha: {data.streak.value} {data.streak.value === 1 ? "día" : "días"}
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "center", margin: "24px 0 26px" }}>
            <Progress value={ring} shape="ring" tone="cyan" size="lg" showLabel />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Button variant="secondary" onClick={onBack}>Volver al temario</Button>
            {onNext ? <Button size="lg" iconLeft={<KIcon d={ICONS.play} />} onClick={onNext}>Siguiente lección</Button> : null}
          </div>
        </GlassPanel>
      </div>
    </PageFrame>
  );
}
```

y extender el `Object.assign` final: `Object.assign(window, { LessonScreen, CelebrationScreen });`

- [ ] **Step 2: Retirar el puente provisional** — en `continueNext` de LessonScreen, eliminar el bloque `if (!window.CelebrationScreen) { … }` (la celebración siempre existe ya).

- [ ] **Step 3: Verificar en el navegador**

1. Completa una lección nueva sin fallos → celebración: orbe grande estalla con chispas + fanfarria, XP cuenta 0→50, al segundo aparece "Perfecto +10" con su sonido, si es la primera lección del día la llama pulsa con "Racha: N días", el anillo anima del progreso viejo al nuevo.
2. "Siguiente lección" abre la siguiente; "Volver al temario" regresa al curso con progreso actualizado.
3. Completa otra lección fallando una vez → sin línea "Perfecto"; XP cuenta a 50; sin racha (segunda del día).
4. NavBar refleja XP/racha nuevos al volver (refreshMe ya corrió). Consola sin errores.

- [ ] **Step 4: Suite backend sin regresión**

Run (en `app/`): `npm test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add app/web/screens/LessonScreen.jsx
git commit -m "feat: celebración post-lección con XP animado, perfecto y racha"
```

---

### Task 14: Pantalla de repaso + tarjeta en dashboard

**Files:**
- Create: `app/web/screens/ReviewScreen.jsx`
- Modify: `app/web/app.jsx` (ruta review)
- Modify: `app/web/screens/DashboardScreen.jsx` (tarjeta Repaso)
- Modify: `app/web/index.html` (script)

**Interfaces:**
- Consumes: `GET /api/review`, `POST /api/exercises/:id/answer` con `context: "review"`, `ExerciseBody`/`responseComplete`, `Orb`, `FX`, `me.stats.reviewCount`.
- Produces: global `ReviewScreen({ me, tab, setTab, onBack, refreshMe })`; app.jsx gana ruta `review` y pasa `onOpenReview` al Dashboard; Dashboard muestra la tarjeta cuando `me.stats.reviewCount > 0`.

- [ ] **Step 1: Crear `app/web/screens/ReviewScreen.jsx`**

```jsx
const KITR = window.CodingDesignSystem_2ecb3a;

function ReviewScreen({ me, tab, setTab, onBack, refreshMe }) {
  const { GlassPanel, Badge, Button } = KITR;
  const [queue, setQueue] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [i, setI] = React.useState(0);
  const [value, setValue] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [earned, setEarned] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [orbMood, setOrbMood] = React.useState("idle");
  const orbTimer = React.useRef(null);
  const xpRef = React.useRef(null);

  const orbReact = (mood, ms) => {
    setOrbMood(mood);
    clearTimeout(orbTimer.current);
    orbTimer.current = setTimeout(() => setOrbMood("idle"), ms);
  };

  const load = () => {
    setQueue(null); setError(null); setI(0); setValue(null); setResult(null); setEarned(0); setDone(false);
    API.get("/review").then((r) => setQueue(r.exercises)).catch((e) => setError(e.message));
  };
  React.useEffect(load, []);

  React.useEffect(() => {
    if (done) {
      FX.sound.play("complete");
      FX.countUp(xpRef.current, 0, earned, 800);
      refreshMe();
    }
  }, [done]);

  const wrap = (children) => (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      {children}
    </PageFrame>
  );

  if (error) return wrap(<div style={{ marginTop: 36 }}><ErrorPanel message={error} onRetry={load} /></div>);
  if (!queue) return wrap(<LoadingPanel />);
  if (queue.length === 0 && !done) return wrap(
    <GlassPanel padding="var(--space-7)" style={{ maxWidth: 520, margin: "48px auto", textAlign: "center" }}>
      <p style={{ margin: "0 0 16px", color: "var(--text-secondary)" }}>No tienes ejercicios por repasar. ¡Sigue así!</p>
      <Button onClick={onBack}>Volver al inicio</Button>
    </GlassPanel>
  );

  if (done) {
    return wrap(
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlassPanel strength="strong" padding="var(--space-8)" radius="var(--radius-xl)" style={{ width: 420, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><Orb size={96} mood="celebrate" /></div>
          <h1 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)" }}>Repaso terminado</h1>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: "var(--accent-cyan)", fontVariantNumeric: "tabular-nums", marginBottom: 20 }}>
            +<span ref={xpRef}>0</span> XP de repaso
          </div>
          <Button onClick={onBack}>Volver al inicio</Button>
        </GlassPanel>
      </div>
    );
  }

  const ex = queue[i];

  const check = async () => {
    setSending(true);
    try {
      const r = await API.post("/exercises/" + ex.id + "/answer", { response: value, context: "review" });
      setResult(r);
      if (r.correct) { orbReact("happy", 700); FX.sound.play("correct"); } else { orbReact("sad", 900); FX.sound.play("wrong"); }
      if (r.reviewCleared) setEarned((e) => e + r.xpAwarded);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const continueNext = () => {
    if (i + 1 < queue.length) { setI(i + 1); setValue(null); setResult(null); }
    else setDone(true);
  };

  return wrap(
    <React.Fragment>
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 20px" }}>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>Repaso · {i + 1} de {queue.length}</span>
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start", maxWidth: 820, margin: "0 auto" }}>
        <Orb size={56} mood={orbMood} style={{ marginTop: 8 }} />
        <GlassPanel tint="none" padding="var(--space-6)" radius="var(--radius-xl)" style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Badge tone="amber" dot>REPASO</Badge>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{ex.courseSubject} · {ex.lessonTitle}</span>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 500, color: "var(--text-primary)" }}>{ex.prompt}</p>
          <ExerciseBody exercise={ex} value={value} onChange={setValue} locked={Boolean(result) || sending} />
          <div style={{ marginTop: 20 }}>
            <Button fullWidth disabled={!responseComplete(ex, value) || sending || Boolean(result && result.correct)} onClick={check}>
              {sending ? "Comprobando…" : "Comprobar"}
            </Button>
          </div>
        </GlassPanel>
      </div>
      <FeedbackBand result={result} onContinue={continueNext} onRetry={() => setResult(null)} />
    </React.Fragment>
  );
}
Object.assign(window, { ReviewScreen });
```

Nota: `FeedbackBand` es global desde Task 12 — añade `FeedbackBand` al `Object.assign` de LessonScreen.jsx si no lo está: `Object.assign(window, { LessonScreen, CelebrationScreen, FeedbackBand });`

- [ ] **Step 2: Ruta en `app/web/app.jsx`** — añadir a `go`:

```js
    review: () => setRoute({ screen: "review" }),
```

y la rama de render (antes del else final):

```jsx
  } else if (route.screen === "review") {
    screen = <ReviewScreen me={me} tab={tab} setTab={setTab} onBack={go.dashboard} refreshMe={loadMe} />;
```

y al Dashboard pásale la prop: `onOpenReview={go.review}`.

- [ ] **Step 3: Tarjeta en `app/web/screens/DashboardScreen.jsx`** — firma: `function DashboardScreen({ me, onOpenCourse, onOpenLesson, onOpenReview, tab, setTab })`, y entre el grid de stats y el `<h2>` de materias:

```jsx
      {me.stats.reviewCount > 0 ? (
        <KITD.GlassPanel tint="none" padding="var(--space-5)" style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 18, border: "1px solid rgba(230,175,107,0.35)" }}>
          <Orb size={44} mood="idle" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>Repaso pendiente</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{me.stats.reviewCount} {me.stats.reviewCount === 1 ? "ejercicio" : "ejercicios"} por repasar · +5 XP cada uno</div>
          </div>
          <KITD.Button variant="secondary" onClick={onOpenReview}>Repasar ahora</KITD.Button>
        </KITD.GlassPanel>
      ) : null}
```

- [ ] **Step 4: Script en `app/web/index.html`** — tras `LessonScreen.jsx`:

```html
<script type="text/babel" src="/screens/ReviewScreen.jsx"></script>
```

- [ ] **Step 5: Verificar en el navegador**

1. Falla a propósito un ejercicio en una lección (luego complétala) → al volver al dashboard aparece "Repaso pendiente · 1 ejercicio".
2. "Repasar ahora" → el ejercicio fallado con eyebrow de materia/lección; acertarlo → banda verde, +5, "Continuar" → pantalla final "+5 XP de repaso" con countUp; volver → la tarjeta desapareció y el XP del NavBar subió 5.
3. Fallar en repaso lo mantiene: repite y verifica que la tarjeta persiste.
4. Consola sin errores.

- [ ] **Step 6: Suite backend sin regresión**

Run (en `app/`): `npm test` → PASS.

- [ ] **Step 7: Commit**

```bash
git add app/web/screens/ReviewScreen.jsx app/web/app.jsx app/web/screens/DashboardScreen.jsx app/web/index.html app/web/screens/LessonScreen.jsx
git commit -m "feat: sesión de repaso de errores con tarjeta en dashboard"
```

---

### Task 15: E2E final + README

**Files:**
- Modify: `app/README.md`

**Interfaces:**
- Consumes: todo lo anterior.

- [ ] **Step 1: Actualizar `app/README.md`** — reemplazar la sección "Estructura" y añadir una de experiencia:

```markdown
## Cómo se aprende

Cada lección es un flujo: teoría → 2 ejercicios (opción múltiple, completar código, ordenar líneas o emparejar) → celebración con XP. Completar sin fallos da bonus "perfecto" (+10). Los ejercicios fallados entran a la cola de **Repaso** (tarjeta en el inicio): corregirlos da +5 XP. El sonido se silencia desde el altavoz del menú.

## Estructura

- `server/` — Express: `auth.js` (JWT), `routes/` (me, courses, lessons, exercises, review), `services/` (progreso, gamificación, validadores de ejercicios, repaso), `seed-data/` (contenido de las 6 materias: lecciones + 128 ejercicios)
- `web/` — frontend sin build: React CDN + Babel + design system en `/ds`; `motion.css`/`fx.js` (animaciones y sonido), `screens/` (login, dashboard, curso, lección stepper, repaso)
- `test/` — node:test + supertest
```

- [ ] **Step 2: Checklist E2E completo en el navegador** (cuenta nueva)

1. Registro → dashboard entra animado; stats en 0; sin tarjeta de repaso.
2. Lección 1 de BD I: teoría → choice (fallar 1 vez: banda roja + shake + orbe triste + sonido; reintentar y acertar) → estructurado (acertar) → celebración SIN "Perfecto" (hubo 1 fallo), XP cuenta a 50, racha 1 día encendida, anillo 0→10%.
3. "Siguiente lección": completar l2 sin fallos → celebración CON "Perfecto +10" y sin racha extra.
4. Dashboard: XP 110, racha 1, tarjeta "Repaso pendiente · 1 ejercicio" (el choice fallado de l1).
5. Repasarlo → +5 XP; tarjeta desaparece; XP 115.
6. Probar los 4 tipos: entrar a lecciones cuyos ex2 sean blanks (l2), order (l6) y match (l1/l4/l7 según asignación) — interacción tap completa en cada uno.
7. Toggle de sonido: silenciar → acierto sin sonido; persiste tras recargar.
8. `prefers-reduced-motion` (emular en DevTools → Rendering) → sin shake/burst/countUp (valores directos), pantallas sin animación perceptible.
9. Curso bloqueado (BD II) sigue bloqueado; curso completado al 100% muestra COMPLETADO.
10. Consola sin errores en todo el recorrido.

- [ ] **Step 3: Suite completa final**

Run (en `app/`): `npm test`
Expected: PASS total.

- [ ] **Step 4: Commit**

```bash
git add app/README.md
git commit -m "docs: README con el nuevo loop de aprender"
```
