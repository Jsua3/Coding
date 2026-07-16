# El fondo vivo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El fondo deja de ser un telón: aurora un paso más luminosa + una cuadrícula de cuaderno (canvas 2D) que se curva hacia el cursor como bajo una gota-lente y duerme a cero CPU en reposo.

**Architecture:** Un módulo nuevo `Liquid.grid(canvas)` en `liquid.js` (canvas 2D inmediato: polilíneas deformadas por un campo radial `smoothstep`; lente que persigue amortiguada y se condensa donde está el cursor; rAF solo mientras hay algo que animar). CSS en `liquid.css`: override en cascada del `body` (aurora aclarada, DS intocado) + `.lg-grid`. Montaje único en `App` (app.jsx), antes del `.lg-noise` — el vidrio de los paneles refracta la cuadrícula.

**Tech Stack:** Frontend sin build (React 18 UMD + Babel en el navegador), canvas 2D nativo, CSS. Cero backend, cero dependencias.

**Spec:** `docs/superpowers/specs/2026-07-16-fondo-vivo-design.md` (contiene la implementación de referencia completa de `Liquid.grid` — fuente de verdad, usar verbatim).

## Global Constraints

- **Sin build:** PROHIBIDO `import`/`export` en `app/web/` y el shorthand `<>`. `Liquid.grid` es un método más del objeto global `Liquid`. Sin dependencias nuevas.
- **El DS (`Coding Design System/`) es INTOCABLE.** El aclarado del fondo es un override en cascada desde `liquid.css` (que carga después de `/ds/styles.css`).
- **Números verbatim del spec:** paso `48px`; línea `rgba(226,236,255,0.045)` a `1px`; radio de lente `180px`; desplazamiento máximo `10px` hacia el centro; caída `smoothstep`; persecución `12%`/frame (`FOLLOW = 0.12`); fade `8%`/frame (`FADE = 0.08`); segmento `24px`; aurora: base `#0A0F1E → #0E1526` y `#05070F → #080D1A`, acentos `0.12→0.17`, `0.10→0.14`, `0.08→0.11`.
- **Presupuesto de rAF:** el bucle corre SOLO mientras hay algo que animar (condición `settled` del spec); en reposo, cero CPU. La gota **se condensa** donde está el cursor cuando su fuerza es 0 (jamás persigue desde fuera de pantalla).
- **Gates:** `FX.reducedMotion` o puntero no-fino ⇒ sin listeners de puntero ni rAF; la cuadrícula se dibuja UNA vez, estática (es textura y se queda). No hay animación CSS que neutralizar en el `@media` (que sigue siendo el último bloque de `liquid.css` — no se toca).
- **El canvas** es `aria-hidden` + `pointer-events: none`, vive en `App` FUERA del div `key`ado, y va ANTES del `.lg-noise` en el DOM (a igual `z-index: -1`, el orden de fuente pinta el grano encima de las líneas).
- **Verificación:** sin harness de frontend — contrato en el navegador contra el dev server (:3000, `juan@test.dev` / `secreto1`) + los **137 tests de backend** como guardia (137/137). Gotchas del panel: el dibujo inicial del canvas es SÍNCRONO (verificable con `getImageData` incluso en el panel); los ticks de rAF NO corren; `window.onerror` manual; screenshots suelen timeout.

---

### Task 1: `Liquid.grid` + CSS (el módulo y su piel)

**Files:**
- Modify: `app/web/liquid.js` (añadir el método `grid` al objeto `Liquid`, después de `pointer`)
- Modify: `app/web/liquid.css` (override del `body` + `.lg-grid`, antes del `@media` final)

**Interfaces:**
- Produces: `Liquid.grid(canvas)` — `canvas`: HTMLCanvasElement o null; devuelve función de limpieza `() => void`. Dibuja la cuadrícula al enganchar (síncrono) y la deforma con el cursor si los gates lo permiten. No-op (cleanup vacío) si `canvas` es null.
- Consumes: `FX.reducedMotion` (gate), tokens ninguno (colores literales calibrados en el spec).

- [ ] **Step 1: Añadir el método `grid` a `liquid.js`**

Dentro del objeto `Liquid`, después del método `pointer` (y antes del cierre del objeto), añade este método **verbatim** (es la implementación de referencia del spec §3). Cuida la coma final: `pointer` termina en `},` y `grid` también debe terminar en `},`.

```js
  // El fondo vivo: papel de cuaderno que se curva bajo el cursor como bajo una gota-lente.
  // Canvas 2D inmediato: la cuadrícula son polilíneas cuyos puntos se desplazan hacia el
  // centro de la lente con caída smoothstep. La lente PERSIGUE al cursor con amortiguación
  // (gota pesada, no imán) y el rAF solo corre mientras hay algo que animar: en reposo, cero CPU.
  // Bajo reduced motion o puntero no-fino la cuadrícula se dibuja UNA vez, estática.
  grid(canvas) {
    if (!canvas) return () => {};
    const ctx = canvas.getContext("2d");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const animated = !(window.FX && FX.reducedMotion) && finePointer;

    const STEP = 48;      // paso de la cuadrícula (px)
    const RADIUS = 180;   // radio de la lente (px)
    const PULL = 10;      // desplazamiento máximo hacia el centro (px)
    const FOLLOW = 0.12;  // persecución amortiguada por frame
    const FADE = 0.08;    // crecimiento/decaimiento de la fuerza por frame
    const SEG = 24;       // longitud de segmento de las polilíneas (px)

    let w = 0, h = 0;
    const lens = { x: -9999, y: -9999, power: 0 }; // la gota: posición + fuerza 0..1
    const target = { x: -9999, y: -9999, inside: false };
    let rafId = 0;

    // smoothstep: 1 en el centro, 0 en el borde, sin costuras.
    const falloff = (d) => {
      const t = 1 - d / RADIUS;
      return t * t * (3 - 2 * t);
    };

    // Refracción de gota: el punto se desplaza HACIA el centro de la lente.
    const warp = (x, y) => {
      if (lens.power <= 0) return { x, y };
      const dx = lens.x - x, dy = lens.y - y;
      const d = Math.hypot(dx, dy);
      if (d === 0 || d >= RADIUS) return { x, y };
      const k = (falloff(d) * PULL * lens.power) / d;
      return { x: x + dx * k, y: y + dy * k };
    };

    const drawLine = (x0, y0, x1, y1) => {
      ctx.beginPath();
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / SEG);
      for (let i = 0; i <= steps; i++) {
        const p = warp(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps);
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(226, 236, 255, 0.045)";
      ctx.lineWidth = 1;
      for (let x = STEP; x < w; x += STEP) drawLine(x, 0, x, h);
      for (let y = STEP; y < h; y += STEP) drawLine(0, y, w, y);
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const tick = () => {
      rafId = 0;
      lens.x += (target.x - lens.x) * FOLLOW;
      lens.y += (target.y - lens.y) * FOLLOW;
      const goal = target.inside ? 1 : 0;
      lens.power += (goal - lens.power) * FADE;
      // ¿Ya no hay nada que animar? Estado final exacto, un último dibujo, y a dormir.
      const settled =
        Math.abs(target.x - lens.x) < 0.2 &&
        Math.abs(target.y - lens.y) < 0.2 &&
        Math.abs(goal - lens.power) < 0.01;
      if (settled) {
        lens.power = goal;
        lens.x = target.x;
        lens.y = target.y;
        draw();
        return;
      }
      draw();
      schedule();
    };
    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(tick); };

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      target.inside = true;
      // Si la gota está dormida (fuerza 0), se CONDENSA donde está el cursor — sin esto,
      // perseguiría desde su última posición (o desde fuera de pantalla en el primer movimiento)
      // y se vería un barrido extraño cruzando el fondo.
      if (lens.power === 0) { lens.x = target.x; lens.y = target.y; }
      schedule();
    };
    const onLeave = () => { target.inside = false; schedule(); }; // la lente se desvanece y las líneas vuelven

    window.addEventListener("resize", resize);
    resize(); // el primer dibujo: la cuadrícula estática (también en reduced motion / táctil)
    if (animated) {
      window.addEventListener("pointermove", onMove);
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (animated) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  },
```

Puntos que NO puedes perder al transcribir (el reviewer los comprobará uno a uno):
- `const animated = !(window.FX && FX.reducedMotion) && finePointer;` — y los listeners de puntero SOLO se añaden (y se quitan en el cleanup) `if (animated)`.
- `resize()` se llama SIEMPRE al enganchar (el primer dibujo estático existe también bajo reduced motion/táctil) y queda suscrito a `window.resize` SIEMPRE.
- En `onMove`: `if (lens.power === 0) { lens.x = target.x; lens.y = target.y; }` — la condensación de la gota.
- En `tick`: la condición `settled` (deltas < 0.2 / < 0.01) hace `return` SIN re-agendar — el sueño a cero CPU.
- `warp` con salidas tempranas (`lens.power <= 0`, `d === 0 || d >= RADIUS`).
- Las constantes exactas: `STEP 48, RADIUS 180, PULL 10, FOLLOW 0.12, FADE 0.08, SEG 24`.

- [ ] **Step 2: Añadir el CSS a `liquid.css`**

Antes del `@media (prefers-reduced-motion: reduce)` final, inserta el bloque **verbatim del spec §2**:

```css
/* ---------- El fondo vivo: aurora un paso más luminosa + papel de cuaderno ---------- */
/* Override en cascada del body del DS (que queda intocado): mismas 3 auroras + degradado,
   base #0A0F1E -> #0E1526 y acentos ~40% más presentes. El carácter nocturno no cambia. */
body {
  background:
    radial-gradient(52% 42% at 12% 8%, rgba(94, 151, 230, 0.17), transparent 70%),
    radial-gradient(44% 38% at 88% 18%, rgba(146, 137, 227, 0.14), transparent 70%),
    radial-gradient(50% 46% at 78% 92%, rgba(82, 201, 184, 0.11), transparent 70%),
    linear-gradient(180deg, #0E1526 0%, #080D1A 100%);
  background-attachment: fixed;
}

/* La cuadrícula: detrás del contenido, delante del body, refractada por el vidrio
   (mismo patrón de capa que .lg-noise). El dibujo lo hace Liquid.grid (canvas 2D). */
.lg-grid {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
```

El `@media` final NO se toca (no hay animación CSS nueva que neutralizar).

- [ ] **Step 3: Verificar el backend (guardia de regresión)**

Run (desde `app/`): `npm test`
Expected: `tests 137 … pass 137 … fail 0`.

- [ ] **Step 4: Verificar el contrato del módulo en el navegador**

Con el dev server (:3000) y la app cargada (Ctrl+Shift+R), pega en consola:

```js
(function(){
  const c = document.createElement("canvas");
  c.className = "lg-grid";
  document.body.appendChild(c);
  const off = Liquid.grid(c);
  const ctx = c.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  // Primera línea vertical en x=48 (px CSS): tinta. Centro de celda (24,24): vacío.
  const online = ctx.getImageData(Math.round(48 * dpr), Math.round(10 * dpr), 1, 1).data[3];
  const inCell = ctx.getImageData(Math.round(24 * dpr), Math.round(24 * dpr), 1, 1).data[3];
  const bitmapOk = c.width === Math.round(window.innerWidth * dpr) && c.height === Math.round(window.innerHeight * dpr);
  off(); c.remove();
  return { online, inCell, bitmapOk }; // esperado: online > 0, inCell === 0, bitmapOk true
})();
```

Expected: `online > 0` (hay tinta sobre la línea), `inCell === 0` (la celda está vacía), `bitmapOk true` (dimensionado a viewport×DPR). El dibujo inicial es síncrono — esto funciona incluso en el panel del tooling.

Gate de reduced motion (contrato, determinista):

```js
(function(){
  FX.reducedMotion = true;
  const c = document.createElement("canvas");
  document.body.appendChild(c);
  let rafCalls = 0;
  const orig = window.requestAnimationFrame;
  window.requestAnimationFrame = function(f){ rafCalls++; return orig(f); };
  const off = Liquid.grid(c);
  window.dispatchEvent(new PointerEvent("pointermove", { clientX: 100, clientY: 100 }));
  window.requestAnimationFrame = orig;
  off(); c.remove();
  FX.reducedMotion = false;
  return { rafCalls }; // esperado: 0 — sin listeners ni rAF bajo reduced motion
})();
```

Expected: `rafCalls: 0`.

- [ ] **Step 5: Commit**

```bash
git add app/web/liquid.js app/web/liquid.css
git commit -m "feat: Liquid.grid, el papel de cuaderno con lente de gota (+ aurora mas luminosa)"
```

---

### Task 2: Montaje en `App` + barrido de contrato

**Files:**
- Modify: `app/web/app.jsx` (el canvas junto al `.lg-noise` + su `useEffect`)

**Interfaces:**
- Consumes: `Liquid.grid` (Task 1) y la clase `.lg-grid` (Task 1).

- [ ] **Step 1: Montar el canvas en `App`**

En `app.jsx`, dentro de `function App()`:

1. Junto a los otros refs/estado (tras `const toastTimer = React.useRef(null);`), añade:

```jsx
  // El fondo vivo: un solo canvas para toda la sesión, fuera del div keyado (jamás se remonta).
  const gridRef = React.useRef(null);
  React.useEffect(() => Liquid.grid(gridRef.current), []);
```

2. En el `return` final, el `<span aria-hidden className="lg-noise"></span>` pasa a estar precedido por el canvas (el orden importa: a igual z-index, el ruido se pinta ENCIMA de las líneas):

```jsx
    <React.Fragment>
      <canvas ref={gridRef} aria-hidden className="lg-grid"></canvas>
      <span aria-hidden className="lg-noise"></span>
```

Nada más cambia en `app.jsx`.

- [ ] **Step 2: Verificar el backend**

Run (desde `app/`): `npm test`
Expected: 137/137.

- [ ] **Step 3: Barrido de contrato en el navegador**

Ctrl+Shift+R con sesión iniciada; pega en consola:

```js
(function(){
  window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));
  const canvas = document.querySelector("canvas.lg-grid");
  const noise = document.querySelector(".lg-noise");
  if (!canvas || !noise) return { error: "capa ausente", canvas: !!canvas, noise: !!noise };
  const dpr = window.devicePixelRatio || 1;
  const ctx = canvas.getContext("2d");
  return {
    ordenCapas: (canvas.compareDocumentPosition(noise) & Node.DOCUMENT_POSITION_FOLLOWING) ? "canvas antes del ruido (OK)" : "MAL",
    bitmapOk: canvas.width === Math.round(window.innerWidth * dpr),
    tinta: ctx.getImageData(Math.round(48 * dpr), Math.round(10 * dpr), 1, 1).data[3] > 0,
    fondoAclarado: getComputedStyle(document.body).backgroundImage.includes("rgb(14, 21, 38)"),
    fixed: getComputedStyle(canvas).position === "fixed",
    errores: window.__errs
  };
})();
```

Expected: `ordenCapas OK`, `bitmapOk true`, `tinta true`, `fondoAclarado true` (#0E1526 = rgb(14,21,38) en el gradiente computado), `fixed true`, `errores []`.

Regresión funcional (clicks reales): navega Inicio→Materias→Progreso→una lección→logout→login. En CADA parada, `document.querySelectorAll("canvas.lg-grid").length === 1` (también en el login: el fondo vive fuera del marco de sesión). Cero errores de consola en todo el recorrido. Nota: tras logout/login el canvas NO se remonta (vive fuera del árbol de sesión) — si observas un remount, repórtalo como defecto.

- [ ] **Step 4: Registrar el pendiente humano**

En el reporte: el *feel* de la lente (persecución amortiguada, condensación de la gota, desvanecimiento de ~400ms al salir) y el juicio estético del aclarado del fondo necesitan un navegador en **primer plano** — el panel congela rAF, así que aquí solo se verificó el contrato (dibujo estático, gates, capas).

- [ ] **Step 5: Commit**

```bash
git add app/web/app.jsx
git commit -m "feat: el fondo vivo montado en App (canvas unico bajo el ruido)"
```
