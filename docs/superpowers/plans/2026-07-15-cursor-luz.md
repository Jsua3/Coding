# El cursor como fuente de luz — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que las tarjetas de Inicio y Materias sientan el cursor: un brillo especular que lo sigue (suma luz) y un tilt 3D sutil (máx 6°) que se inclina hacia él.

**Architecture:** Tres piezas desacopladas — `Liquid.pointer(el, opts)` (módulo DOM puro que publica 5 variables CSS, gateado y coalescido a un `rAF`/frame) en `liquid.js`; las clases `.lg-tilt` + la capa de brillo `::after` en `liquid.css`; y un componente `TiltCard` (en `AppShell.jsx`) que envuelve tarjetas sin tocar el design system. `reveal` y el tilt van en capas separadas porque ambos escriben `transform`.

**Tech Stack:** Frontend sin build (React 18 UMD + Babel en el navegador, globales `window`), CSS con tokens del proyecto. Cero backend.

**Spec:** `docs/superpowers/specs/2026-07-15-cursor-luz-design.md`.

## Global Constraints

- **Sin build:** PROHIBIDO `import`/`export` en `app/web/`. Prohibido el shorthand `<>` (usar `React.Fragment`). Componentes/globales por `Object.assign(window, {...})`. El orden de `<script>` en `index.html` es la resolución de dependencias.
- **El design system (`Coding Design System/`, servido en `/ds`) es INTOCABLE y NO reenvía `className`** ⇒ la clase `.lg-tilt` va SIEMPRE en un `<div>` propio (`TiltCard`), nunca en un componente del kit.
- **Motion:** solo se animan `transform`, `opacity`, `filter`. `backdrop-filter` jamás sobre texto (el brillo es un `::after` con `pointer-events: none`; no introduce ninguno).
- **Reduced motion, doble cinturón:** gate JS (`FX.reducedMotion`) + el bloque `@media (prefers-reduced-motion: reduce)`, que **debe seguir siendo el último de `liquid.css`**.
- **Copy** en español, tuteo, sentence case, sin emoji. No hay copy nuevo visible en esta iteración.
- **Dependencias nuevas: prohibidas sin preguntar.** No hay harness de test de frontend (jsdom sería una dependencia nueva), así que **la verificación del frontend es por contrato en el navegador** (getComputedStyle, estado forzado, listeners) contra el dev server, más los **137 tests de backend como guardia de regresión** (deben seguir en 137/137). Este patrón es el mismo de las iteraciones visuales anteriores (coreografía, vidrio vivo).
- **Números de calibración (verbatim del spec):** tilt fuerza `5°` / tope duro `6°`; `perspective(900px)`; elevación `−6px`; brillo radial `300px` con núcleo `rgba(255,255,255,0.10)` → `0.028` @26% → transparente @54%; tintes por acento blue/violet `0.20`, cyan `0.17`, amber `0.18`; pico `--glow` `1` (ratón) / `0.70` (foco); reposo `--mx: 74%`, `--my: 18%`; retardo de intención `90 ms`; `transition` transform `240ms` y brillo `200ms`, ambas `--ease-glass`.
- **Mapeo de `accent` por tarjeta:** MetaDiaria=`cyan`; StatPanel Nivel=`violet`, Racha=sin acento, XP=`blue`; CercaDeCaer=sin acento; CourseCard=`course.subjectTone` (incluye `amber`).

---

### Task 1: `Liquid.pointer(el, opts)` en liquid.js

**Files:**
- Modify: `app/web/liquid.js` (añadir un método `pointer` al objeto `Liquid`, junto a `ripple` y `reveal`)

**Interfaces:**
- Produces: `Liquid.pointer(el, opts)` — `el`: HTMLElement o null; `opts`: `{ tilt?: number }` (grados, default 4, tope duro 6). Devuelve una función de limpieza `() => void`. Escribe en `el` las variables CSS `--mx`, `--my` (en `%`), `--rx`, `--ry` (en `deg`), `--glow` (`0`..`1`). No-op (cleanup vacío) si `el` es null o si el gate falla.

- [ ] **Step 1: Añadir el método `pointer` al objeto `Liquid`**

En `app/web/liquid.js`, dentro del objeto `Liquid` (después del método `reveal`, antes del cierre `}` del objeto), añade:

```js
  // El cursor como fuente de luz: publica 5 variables CSS (--mx/--my/--rx/--ry/--glow)
  // que el CSS (.lg-tilt) convierte en tilt 3D + brillo especular. No anima nada por JS.
  // Doble puerta: reduced motion (fuente única del proyecto) + puntero fino (en táctil no hay
  // cursor que seguir). Coalescencia: máximo una escritura de estilos por frame.
  pointer(el, opts = {}) {
    if (!el) return () => {};
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const strength = Math.min(Math.abs(opts.tilt ?? 4), 6); // tope duro: 6°
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const enabled = !(window.FX && FX.reducedMotion) && finePointer;
    if (!enabled) return () => {};

    let last = null, rafId = 0, glowTimer = 0;

    const write = () => {
      rafId = 0;
      if (!last) return;
      const rect = el.getBoundingClientRect();
      const x = clamp((last.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((last.clientY - rect.top) / rect.height, 0, 1);
      el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      el.style.setProperty("--rx", ((y - 0.5) * -strength).toFixed(2) + "deg"); // mira al cursor
      el.style.setProperty("--ry", ((x - 0.5) * strength).toFixed(2) + "deg");
    };
    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(write); };
    const recenter = () => {
      el.style.setProperty("--mx", "74%");
      el.style.setProperty("--my", "18%");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };

    const onMove = (e) => { last = e; schedule(); };
    const onEnter = () => {
      clearTimeout(glowTimer);
      glowTimer = setTimeout(() => el.style.setProperty("--glow", "1"), 90); // retardo de intención
    };
    const onLeave = () => {
      clearTimeout(glowTimer);
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      last = null;
      recenter();
      el.style.setProperty("--glow", "0");
    };
    const onFocusIn = () => el.style.setProperty("--glow", "0.7"); // teclado: luz sin cursor
    const onFocusOut = onLeave;

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      clearTimeout(glowTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  },
```

Cuida la coma final: `reveal` termina en `},` y `pointer` también debe terminar en `},` para que `window.Liquid = Liquid;` siga válido.

- [ ] **Step 2: Verificar que el backend sigue verde (guardia de regresión)**

Run (desde `app/`): `npm test`
Expected: `tests 137 ... pass 137 ... fail 0`. (No debe cambiar: este cambio no toca el servidor. Confirma que no rompiste nada al editar el árbol.)

- [ ] **Step 3: Verificar el contrato de `Liquid.pointer` en el navegador**

Arranca el dev server (`npm start`, :3000) y abre la app. En la consola del navegador (o vía tooling), pega:

```js
(() => {
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;left:0;top:0;width:200px;height:100px";
  document.body.appendChild(el);
  const off = Liquid.pointer(el, { tilt: 5 });
  el.dispatchEvent(new PointerEvent("pointermove", { clientX: 200, clientY: 100, bubbles: true }));
  requestAnimationFrame(() => {
    const s = el.style;
    console.log("mx", s.getPropertyValue("--mx"), "my", s.getPropertyValue("--my"),
                "rx", s.getPropertyValue("--rx"), "ry", s.getPropertyValue("--ry"));
    // Esquina inferior-derecha: mx≈100%, my≈100%, rx≈-2.5deg (mira al cursor), ry≈+2.5deg
    off(); el.remove();
  });
})();
```

Expected: `mx 100.0% my 100.0% rx -2.50deg ry 2.50deg` (o muy cerca). Los grados quedan `≤ 6`. Con puntero fino real, funciona; si el entorno del tooling reporta `(pointer: fine)` false, verifícalo forzando `enabled` por lectura de código. Nota: `rAF` puede estar suspendido en el panel de fondo del tooling — si no resuelve, usa un navegador en primer plano o confía en la revisión de código de este contrato puro.

- [ ] **Step 4: Commit**

```bash
git add app/web/liquid.js
git commit -m "feat: Liquid.pointer, el cursor como fuente de luz (modulo DOM puro)"
```

---

### Task 2: CSS `.lg-tilt` + capa de brillo en liquid.css

**Files:**
- Modify: `app/web/liquid.css` (añadir las reglas `.lg-tilt` y sus tintes; y añadir el neutralizado de `.lg-tilt` al `@media (prefers-reduced-motion: reduce)` **existente**, que debe quedar el último bloque del archivo)

**Interfaces:**
- Consumes: las variables `--mx/--my/--rx/--ry/--glow` que escribe `Liquid.pointer` (Task 1), y el atributo `data-accent` que pone `TiltCard` (Task 3).
- Produces: la clase `.lg-tilt` (transform 3D + brillo) y los selectores `.lg-tilt[data-accent="…"]`.

- [ ] **Step 1: Comprobar dónde está el `@media` de reduced motion**

Localiza en `app/web/liquid.css` el bloque `@media (prefers-reduced-motion: reduce) { … }`. Debe ser el ÚLTIMO bloque del archivo (regla del proyecto). Vas a insertar las reglas nuevas de `.lg-tilt` **ANTES** de ese `@media`, y a añadir una línea DENTRO de ese `@media`.

- [ ] **Step 2: Añadir las reglas de `.lg-tilt` (antes del `@media` final)**

Inserta, justo antes del `@media (prefers-reduced-motion: reduce)`:

```css
/* El cursor como fuente de luz. Las variables las escribe Liquid.pointer (liquid.js).
   perspective por tarjeta: cada una tiene su propio punto de fuga. */
.lg-tilt {
  position: relative;
  border-radius: var(--radius-lg);
  transform:
    perspective(900px)
    rotateX(var(--rx, 0deg))
    rotateY(var(--ry, 0deg))
    translateY(var(--lift, 0px));
  transform-style: preserve-3d;
  transition: transform 240ms var(--ease-glass);
  will-change: transform;
}
.lg-tilt:hover,
.lg-tilt:focus-within { --lift: -6px; } /* el panel se eleva hacia la luz */

/* La luz que sigue al cursor. Suma (screen), nunca oscurece. pointer-events:none: no roba clicks. */
.lg-tilt::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    300px circle at var(--mx, 74%) var(--my, 18%),
    var(--lg-glow-tint, rgba(255, 255, 255, 0.10)),
    rgba(255, 255, 255, 0.028) 26%,
    transparent 54%);
  opacity: var(--glow, 0);
  mix-blend-mode: screen;
  transition: opacity 200ms var(--ease-glass);
  pointer-events: none;
  z-index: 3;
}

.lg-tilt[data-accent="blue"]   { --lg-glow-tint: rgba(90, 147, 255, 0.20); }
.lg-tilt[data-accent="violet"] { --lg-glow-tint: rgba(162, 129, 255, 0.20); }
.lg-tilt[data-accent="cyan"]   { --lg-glow-tint: rgba(55, 224, 212, 0.17); }
.lg-tilt[data-accent="amber"]  { --lg-glow-tint: rgba(230, 175, 107, 0.18); }
```

Verifica que `--radius-lg` y `--ease-glass` existan en el CSS del proyecto (se usan en `motion.css`). Si la tarjeta del DS que se envuelve usa OTRO radio, iguala ESE valor aquí para que el brillo recorte por sus esquinas.

- [ ] **Step 3: Añadir el segundo cinturón dentro del `@media` de reduced motion**

Dentro del bloque `@media (prefers-reduced-motion: reduce) { … }` existente (el último del archivo), añade:

```css
  .lg-tilt { transform: none; transition: none; }
  .lg-tilt::after { display: none; }
```

- [ ] **Step 4: Verificar el contrato del CSS en el navegador**

Con el dev server corriendo y la app abierta, en consola:

```js
(() => {
  const el = document.createElement("div");
  el.className = "lg-tilt";
  el.setAttribute("data-accent", "cyan");
  el.style.setProperty("--glow", "1");
  el.style.setProperty("--rx", "3deg");
  document.body.appendChild(el);
  const after = getComputedStyle(el, "::after");
  console.log("blend", after.mixBlendMode, "op", after.opacity,
              "transform", getComputedStyle(el).transform.slice(0, 15));
  el.remove();
})();
```

Expected: `blend screen op 1 transform matrix3d(...)` (el `transform` resuelve a `matrix3d` por la perspective — confirma que la regla aplica). Si sale `none`, el bloque no se cargó (revisa que no quedó dentro del `@media`).

- [ ] **Step 5: Commit**

```bash
git add app/web/liquid.css
git commit -m "feat: .lg-tilt, el tilt 3D y el brillo especular que sigue al cursor"
```

---

### Task 3: Componente `TiltCard` en AppShell.jsx

**Files:**
- Modify: `app/web/screens/AppShell.jsx` (añadir el componente `TiltCard` y registrarlo en `window`, junto a los otros helpers compartidos)

**Interfaces:**
- Consumes: `Liquid.pointer` (Task 1) y la clase `.lg-tilt` (Task 2).
- Produces: `window.TiltCard` — componente React. Props: `accent?` (string: `"blue"|"cyan"|"violet"|"amber"` o ausente), `tilt?` (number, default 5), `children`. Renderiza un `<div className="lg-tilt" data-accent={accent}>` que engancha `Liquid.pointer` en el montaje y limpia en el desmontaje.

- [ ] **Step 1: Añadir el componente `TiltCard`**

En `app/web/screens/AppShell.jsx`, junto a los otros helpers compartidos (donde viven `usePhase`/`useScrolled`), añade el componente. Usa `React.createElement` (no JSX con atributo condicional que meta `data-accent="undefined"`):

```jsx
// Envuelve una tarjeta para que sienta el cursor (brillo + tilt). La clase .lg-tilt va en
// ESTE div propio porque los componentes del DS no reenvian className. Liquid.pointer se
// auto-gatea (reduced motion / tactil): en esos casos el div queda inerte, sin coste.
function TiltCard({ accent, tilt, children }) {
  const ref = React.useRef(null);
  React.useEffect(() => Liquid.pointer(ref.current, { tilt: tilt == null ? 5 : tilt }), []);
  return React.createElement(
    "div",
    { ref: ref, className: "lg-tilt", "data-accent": accent || null },
    children
  );
}
```

- [ ] **Step 2: Registrar `TiltCard` en `window`**

Al final de `AppShell.jsx` está la línea (≈254):

```jsx
Object.assign(window, { KIcon, ICONS, NavBar, PageFrame, LoadingPanel, ErrorPanel, SoundToggle, usePhase, useScrolled, AchievementToast });
```

Añade `TiltCard` a esa lista:

```jsx
Object.assign(window, { KIcon, ICONS, NavBar, PageFrame, LoadingPanel, ErrorPanel, SoundToggle, usePhase, useScrolled, AchievementToast, TiltCard });
```

`AppShell.jsx` (línea ~24 de `index.html`) se carga ANTES que `InicioScreen.jsx` y `MateriasScreen.jsx` (líneas ~26–27), así que `TiltCard` estará disponible como global cuando esas pantallas se compilen — ya es así, no toques `index.html`.

- [ ] **Step 3: Verificar que el componente monta y engancha**

Con el dev server corriendo, en la app (ya logueado, en cualquier pantalla), en consola:

```js
console.log(typeof TiltCard); // "function"
```

Expected: `function`. (El wiring real se prueba al aplicarlo, Tasks 4–5, y en el barrido final, Task 6.)

- [ ] **Step 4: Commit**

```bash
git add app/web/screens/AppShell.jsx
git commit -m "feat: componente TiltCard (envoltorio del cursor-luz, sin tocar el DS)"
```

---

### Task 4: Aplicar el efecto en InicioScreen

**Files:**
- Modify: `app/web/screens/InicioScreen.jsx` (envolver MetaDiaria, los 3 StatPanel y CercaDeCaer en `TiltCard`, dentro de sus `.lg-reveal` existentes)

**Interfaces:**
- Consumes: `TiltCard` (Task 3).

- [ ] **Step 1: Envolver la tarjeta de meta diaria**

En `InicioScreen`, el bloque actual (líneas ~109–111):

```jsx
        <div className="lg-reveal">
          <MetaDiaria xpToday={stats.xpToday} dailyGoal={stats.dailyGoal} />
        </div>
```

pasa a:

```jsx
        <div className="lg-reveal">
          <TiltCard accent="cyan">
            <MetaDiaria xpToday={stats.xpToday} dailyGoal={stats.dailyGoal} />
          </TiltCard>
        </div>
```

- [ ] **Step 2: Envolver los 3 paneles de stats**

El grid de stats (líneas ~130–140) pasa a envolver cada `StatPanel` con su acento (Nivel=`violet`, Racha=sin acento, XP=`blue`):

```jsx
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          <div className="lg-reveal">
            <TiltCard accent="violet">
              <StatPanel label="Nivel" value={lvl ? lvl.n + " · " + lvl.name : "—"} sub={lvl ? lvl.progress + "% hacia el siguiente" : ""} tone="violet" />
            </TiltCard>
          </div>
          <div className="lg-reveal">
            <TiltCard>
              <StatPanel label="Racha" value={stats.streak + (stats.streak === 1 ? " día" : " días")} sub={"Tu mejor racha: " + stats.bestStreak + (stats.bestStreak === 1 ? " día" : " días")} tone="none" />
            </TiltCard>
          </div>
          <div className="lg-reveal">
            <TiltCard accent="blue">
              <StatPanel label="XP total" value={stats.xp.toLocaleString("es")} sub={"+" + stats.xpWeek + " esta semana"} tone="blue" />
            </TiltCard>
          </div>
        </div>
```

- [ ] **Step 3: Envolver "Estás cerca de…" (dentro del componente CercaDeCaer)**

En el componente `CercaDeCaer` (mismo archivo), el `return` actual envuelve un `GlassPanel` en un `.lg-reveal`. Añade el `TiltCard` (sin acento) DENTRO del `.lg-reveal`, alrededor del `GlassPanel`:

```jsx
  return (
    <div className="lg-reveal">
      <TiltCard>
        <GlassPanel padding="var(--space-5)" style={{ marginBottom: 28 }}>
          {/* …contenido intacto… */}
        </GlassPanel>
      </TiltCard>
    </div>
  );
```

No toques el contenido interno del `GlassPanel`; solo lo envuelves.

- [ ] **Step 4: Verificar en el navegador**

Con el dev server corriendo, abre Inicio. En consola:

```js
document.querySelectorAll(".lg-tilt").length; // esperado: 5 (meta + 3 stats + cerca de caer)
```

Expected: `5` (o `4` si "Estás cerca de…" no se muestra porque no hay logros cerca). Ninguna tarjeta debe verse rota, ni el texto desplazado en reposo. Cero errores de consola (instala `window.onerror` antes si vas a afirmar "cero errores").

- [ ] **Step 5: Commit**

```bash
git add app/web/screens/InicioScreen.jsx
git commit -m "feat: Inicio siente el cursor (meta, stats y 'estas cerca de')"
```

---

### Task 5: Aplicar el efecto en MateriasScreen

**Files:**
- Modify: `app/web/screens/MateriasScreen.jsx` (envolver las CourseCard activas en `TiltCard`; las bloqueadas quedan planas; evitar el doble lift del DS Card)

**Interfaces:**
- Consumes: `TiltCard` (Task 3).

- [ ] **Step 1: Envolver las tarjetas de curso activas (saltar las bloqueadas)**

El `.map` actual (líneas ~63–67):

```jsx
            {courses.map((c) => (
              <div key={c.id} className="lg-reveal">
                <CourseCard course={c} onOpen={onOpenCourse} />
              </div>
            ))}
```

pasa a:

```jsx
            {courses.map((c) => (
              <div key={c.id} className="lg-reveal">
                {c.status === "BLOQUEADO" ? (
                  <CourseCard course={c} onOpen={onOpenCourse} />
                ) : (
                  <TiltCard accent={c.subjectTone}>
                    <CourseCard course={c} onOpen={onOpenCourse} />
                  </TiltCard>
                )}
              </div>
            ))}
```

`c.subjectTone` es `blue`/`cyan`/`violet`/`amber`; el brillo carga la aurora ámbar aunque el `Progress` la neutralice.

**No cambies nada del `Card` del DS** (es intocable y `hoverable` tiene efectos que no podemos verificar a ciegas). Solo lo envuelves. El `Card` activo hace su propio `translateY(-4px)` en hover; sumado al `−6px` del wrapper da una elevación de `−10px`. Eso es un ítem de *feel* que decide un humano en primer plano (ver Task 6, Step 5): si resulta excesivo, el arreglo es de una línea — bajar el `--lift` de `.lg-tilt:hover` a `-3px`, o (si se confirma que `hoverable` no afecta el clic) pasar `hoverable={false}` a la `CourseCard`. No lo decidas por adivinación aquí.

- [ ] **Step 2: Verificar en el navegador**

Con el dev server corriendo, abre Materias. En consola:

```js
document.querySelectorAll(".lg-tilt").length; // esperado: nº de cursos NO bloqueados
document.querySelectorAll(".lg-tilt[data-accent='amber']").length; // ≥1 si hay materia ámbar activa
```

Expected: el conteo de `.lg-tilt` = cursos activos (los bloqueados no lo tienen). Las tarjetas bloqueadas siguen atenuadas y sin efecto. Cero errores de consola.

- [ ] **Step 3: Commit**

```bash
git add app/web/screens/MateriasScreen.jsx
git commit -m "feat: el catalogo de Materias siente el cursor (cursos activos)"
```

---

### Task 6: Verificación final (barrido de contrato)

**Files:** ninguno (solo verificación; sin cambios de código salvo que el barrido descubra un defecto)

- [ ] **Step 1: Backend intacto**

Run (desde `app/`): `npm test`
Expected: `tests 137 ... pass 137 ... fail 0`.

- [ ] **Step 2: Gates (doble puerta)**

Con el dev server y la app abierta (Inicio), en consola: fuerza reduced motion y comprueba que el efecto NO engancha.

```js
FX.reducedMotion = true;
const el = document.querySelector(".lg-tilt");
const off = Liquid.pointer(el, { tilt: 5 });      // debe devolver no-op
el.dispatchEvent(new PointerEvent("pointermove", { clientX: 50, clientY: 50, bubbles: true }));
requestAnimationFrame(() => { console.log("rx tras reduced:", el.style.getPropertyValue("--rx") || "(vacío)"); off(); FX.reducedMotion = false; });
```

Expected: `rx tras reduced: (vacío)` — con reduced motion no se escribe ninguna variable. (El CSS `@media` es el segundo cinturón; confírmalo por lectura: es el último bloque de `liquid.css` y contiene `.lg-tilt { transform: none }`.)

- [ ] **Step 3: Contrato del brillo con retardo de 90 ms**

En una tarjeta real de Inicio (puntero fino), comprueba que el brillo enciende SOLO tras el retardo. El `setTimeout` sí corre en el panel del tooling (a diferencia de `rAF`):

```js
const c = document.querySelector(".lg-tilt");
c.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
console.log("glow inmediato:", c.style.getPropertyValue("--glow") || "(vacío)");        // aún no
setTimeout(() => console.log("glow a 120ms:", c.style.getPropertyValue("--glow")), 120); // "1"
```

Expected: `glow inmediato: (vacío)` y luego `glow a 120ms: 1`. (Requiere que el gate esté activo; si el tooling reporta puntero no-fino, verifica este contrato en un navegador en primer plano.)

- [ ] **Step 4: Limpieza y ausencia de fugas**

Navega de Inicio a Materias y de vuelta varias veces; confirma cero errores de consola (trap `window.onerror`) y que los conteos de `.lg-tilt` son los esperados en cada pantalla. El cleanup de `useEffect` desengancha los listeners al desmontar.

- [ ] **Step 5: Registrar el pendiente humano**

Deja constancia (en el reporte de la tarea y para el review final): el *feel* real del tilt y del brillo —la inclinación amortiguada, la luz que suma, la elevación al fijarse— necesita un navegador en **primer plano**, porque el tooling suspende `rAF` en pestaña de fondo. Es el mismo caveat aceptado en las iteraciones visuales anteriores. **Incluye explícitamente** el ítem del doble-lift de la `CourseCard` (`−10px` = `−4px` del DS Card + `−6px` del wrapper): confirmar con ojos humanos si se siente bien o hay que bajar el `--lift` a `-3px` (fix de una línea en `liquid.css`).

---

## Notas de verificación (para todos los que ejecuten el plan)

- **No hay tests unitarios de frontend** (el proyecto no tiene harness DOM y añadir jsdom sería una dependencia nueva → prohibido sin preguntar). La verificación es por contrato en el navegador contra el dev server, más los 137 tests de backend como guardia de regresión. Es el patrón de las iteraciones visuales previas.
- **El dev server guarda el backend en memoria** pero sirve `web/` fresco del disco: para cambios de frontend basta recargar (Ctrl+Shift+R si el navegador cachea). No hace falta reiniciarlo salvo que toques el servidor (no es el caso aquí).
- **Gotchas del tooling** (documentados en el prompt maestro §9): `document.hidden === true` ⇒ `rAF`/`IntersectionObserver` no disparan; `read_console_messages` no reporta excepciones no capturadas (instala `window.onerror`); los screenshots pueden hacer timeout (usa `read_page`/`javascript_tool`).
```
