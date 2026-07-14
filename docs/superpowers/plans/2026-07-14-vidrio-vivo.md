# El vidrio vivo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que el vidrio de Coding se comporte como materia — que la navbar se parta por tensión superficial al hacer scroll, que las superficies respondan al tacto con una onda, y que la aurora tenga grano y los elementos se condensen al aparecer. Spec: `docs/superpowers/specs/2026-07-14-vidrio-vivo-design.md`.

**Architecture:** dos archivos nuevos en la capa de app — `app/web/liquid.css` (todo el CSS del vidrio vivo) y `app/web/liquid.js` (`window.Liquid` con `ripple()` y `reveal()`, cada uno devolviendo su cleanup). La NavBar se reescribe en `AppShell.jsx` como tres píldoras de vidrio unidas por dos **puentes** (`aria-hidden`) que se adelgazan y se rompen; un hook `useScrolled()` la dispara con un `IntersectionObserver` sobre un centinela (cero trabajo por frame). `Coding Design System/` no se toca.

**Tech Stack:** React 18 UMD + Babel standalone (frontend SIN build), CSS puro sobre tokens del DS, `IntersectionObserver`. Cero dependencias nuevas.

## Global Constraints

- **Frontend sin build:** PROHIBIDO `import`/`export` en `app/web/`; prohibido el shorthand `<>` (usar `React.Fragment` explícito); todo se comparte vía `Object.assign(window, {...})`; **el orden de los `<script>`/`<link>` en `index.html` es la resolución de dependencias**.
- **`Coding Design System/` es INTOCABLE.** Sus componentes (`GlassPanel`, `Card`, `Button`, `Tabs`…) **no reenvían `className`**: toda clase de animación va en un `<div>` propio.
- **Regla de oro del DS:** `backdrop-filter` JAMÁS sobre un elemento que contenga texto — va en un `<span aria-hidden>` absoluto con `zIndex: -1`.
- **Rendimiento:** en animaciones **solo** `transform`, `opacity`, `filter` y las propiedades individuales `scale`/`translate`. **Jamás** `top/left/width/height/margin/padding/border-width/gap/flex` (layout). Se permiten explícitamente `border-color`, `border-radius` y `box-shadow` (**repintado, nunca layout**) porque la fusión de la navbar es imposible sin ellas; van solo en cambios de estado, no por frame.
- **Reduced motion, doble cinturón:** gate JS (`FX.reducedMotion`) + bloque `@media (prefers-reduced-motion: reduce)`. **Todo elemento cuyo estado base sea visible (`.lg-ripple`, `.lg-nav__bridge` en estado partido) va con `display: none`, nunca con `animation: none`** — con `animation: none` quedaría congelado y visible en pantalla (fue el bug del `fx-bead` en la iteración anterior).
- **Higiene:** todo timer / rAF / observer se guarda en ref y se limpia en el `useEffect` de desmontaje. Los nodos inyectados se autodestruyen por `animationend` + `setTimeout` de seguridad (patrón de `FX.burst`/`FX.bloom`).
- Copy en español con tuteo, sin emoji. Comentarios en español.
- Los **57 tests** de backend (`npm test` desde `app/`) deben seguir pasando; este plan no toca `app/server/` ni `app/test/`.
- Dev server: suele estar en :3000 (EADDRINUSE ⇒ ya corre, reusarlo; los estáticos se sirven frescos del disco — basta recargar). Cuenta: `juan@test.dev` / `secreto1`.
- **Verificación en navegador:** instalar SIEMPRE un trap `window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));` antes de afirmar "cero errores" — `read_console_messages` NO reporta excepciones no capturadas (lección de la iteración anterior). Reinstalarlo tras cada recarga.
- Rama de trabajo: `feature/vidrio-vivo` (ya creada, con la spec committeada).

---

### Task 1: Fundación — liquid.css, liquid.js y la textura de ruido

**Files:**
- Create: `app/web/liquid.css`
- Create: `app/web/liquid.js`
- Modify: `app/web/index.html` (añadir `<link>` y `<script>`)
- Modify: `app/web/app.jsx` (montar la capa de ruido)

**Interfaces:**
- Produces: el archivo `liquid.css` (al que las Tasks 2, 4 y 7 añadirán secciones), el global `window.Liquid` (objeto, por ahora vacío de métodos), y la clase `.lg-noise`. Todas las tareas siguientes dependen de que estos dos archivos existan y estén cargados.
- Consumes: tokens del DS ya cargados (`--ease-out`, `--ease-glass`, `--ease-spring`, `--duration-slow`, `--glass-stroke`, `--shadow-glass`, `--refraction-edge`, `--radius-pill`, `--blur-lg`, `--saturate-glass`).

- [ ] **Step 1: Crear `app/web/liquid.css` con la textura**

```css
/* Liquid Glass — el vidrio vivo. Extiende motion.css; lee los tokens del design system. */

/* ---------- Textura: ruido fractal sobre la aurora ---------- */
/* z-index -1: se pinta detrás del contenido pero encima del fondo de página,
   así el backdrop-filter de los paneles lo refracta (el grano se lee A TRAVÉS del vidrio). */
.lg-noise {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.74' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
}

@media (prefers-reduced-motion: reduce) {
  /* El ruido es textura estática, no movimiento: se conserva. */
}
```

- [ ] **Step 2: Crear `app/web/liquid.js`**

```js
// Liquid Glass — el vidrio como material que responde. Sin dependencias, sin assets.
const Liquid = {};
window.Liquid = Liquid;
```

- [ ] **Step 3: Cargar ambos en `index.html`**

En `app/web/index.html`, la línea `<link rel="stylesheet" href="/motion.css">` pasa a ser dos líneas (liquid.css DESPUÉS de motion.css):

```html
<link rel="stylesheet" href="/motion.css">
<link rel="stylesheet" href="/liquid.css">
```

Y la línea `<script src="/fx.js"></script>` pasa a ser dos (liquid.js DESPUÉS de fx.js, porque lo consume; y sigue siendo un script plano, NO `type="text/babel"`):

```html
<script src="/fx.js"></script>
<script src="/liquid.js"></script>
```

- [ ] **Step 4: Montar la capa de ruido en `app/web/app.jsx`**

En el `return` de `App()`, añadir el span como primer hijo del `React.Fragment` (antes del div de pantalla, para que el contenido se pinte encima):

```jsx
  return (
    <React.Fragment>
      <span aria-hidden className="lg-noise"></span>
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

- [ ] **Step 5: Verificar en el navegador**

Abrir `http://localhost:3000` (si el puerto está ocupado, el server YA corre: recargar basta). Instalar el trap de errores y comprobar:

```js
window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));
JSON.stringify({
  liquid: typeof window.Liquid,
  noise: !!document.querySelector(".lg-noise"),
  // la capa no debe interceptar clicks:
  pe: getComputedStyle(document.querySelector(".lg-noise")).pointerEvents,
  errs: window.__errs.length
})
```
Expected: `{"liquid":"object","noise":true,"pe":"none","errs":0}`.

Además, comprobar que el CSS se sirve: `curl.exe -s http://localhost:3000/liquid.css` debe devolver el contenido (no 404), y que la app sigue navegando normal (login → dashboard).

- [ ] **Step 6: Commit**

```bash
git add app/web/liquid.css app/web/liquid.js app/web/index.html app/web/app.jsx
git commit -m "feat: fundacion del vidrio vivo (liquid.css, liquid.js) y textura de ruido sobre la aurora"
```

---

### Task 2: Liquid.ripple — la onda que nace donde tocas

**Files:**
- Modify: `app/web/liquid.js` (añadir el método `ripple`)
- Modify: `app/web/liquid.css` (añadir la sección del ripple + su regla de reduced motion)

**Interfaces:**
- Consumes: `window.FX.reducedMotion` (de `fx.js`, cargado antes); la clase `.lg-ripple`.
- Produces: **`Liquid.ripple(el)` → `cleanup()`**. Adjunta a `el` un listener de `pointerdown` que inyecta la onda dentro de `el`. Devuelve una función que quita el listener (para el `useEffect` de desmontaje). La Task 3 la consume así:
  ```jsx
  const ref = React.useRef(null);
  React.useEffect(() => Liquid.ripple(ref.current), []);
  ```
  **Contrato del host:** el elemento debe tener `position: relative` y `overflow: hidden` (si no, la onda se sale de su forma).

- [ ] **Step 1: Implementar `ripple` en `app/web/liquid.js`**

Reemplazar el contenido de `liquid.js` por:

```js
// Liquid Glass — el vidrio como material que responde. Sin dependencias, sin assets.
const Liquid = {
  // Onda que nace en el punto exacto del tap y crece hasta cubrir el elemento entero.
  // Contrato del host: position: relative + overflow: hidden.
  ripple(el) {
    if (!el) return () => {};
    const onDown = (e) => {
      if (window.FX && FX.reducedMotion) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Radio = distancia a la esquina MÁS LEJANA (Pitágoras): un diámetro fijo dejaría esquinas secas.
      const dx = Math.max(x, rect.width - x);
      const dy = Math.max(y, rect.height - y);
      const d = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 2);
      const wave = document.createElement("span");
      wave.className = "lg-ripple";
      wave.style.width = d + "px";
      wave.style.height = d + "px";
      wave.style.left = (x - d / 2) + "px";
      wave.style.top = (y - d / 2) + "px";
      el.appendChild(wave);
      wave.addEventListener("animationend", () => wave.remove());
      setTimeout(() => wave.remove(), 1200);
    };
    el.addEventListener("pointerdown", onDown);
    return () => el.removeEventListener("pointerdown", onDown);
  },
};
window.Liquid = Liquid;
```

- [ ] **Step 2: Añadir el CSS del ripple**

En `app/web/liquid.css`, insertar ANTES del bloque `@media (prefers-reduced-motion: reduce)`:

```css
/* ---------- Ripple: la gota de agua al tocar ---------- */
.lg-ripple {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.10); /* tenue: nuestro vidrio es oscuro */
  transform: scale(0);
  animation: lg-ripple 600ms var(--ease-out) forwards;
  will-change: transform, opacity;
}
@keyframes lg-ripple {
  0% { transform: scale(0); opacity: 1; }
  60% { opacity: 0.62; }                   /* aguanta a mitad de viaje: la onda pierde energía al viajar */
  100% { transform: scale(1); opacity: 0; } /* muere justo al llegar */
}
```

Y DENTRO del bloque `@media (prefers-reduced-motion: reduce)` (sustituyendo el comentario solitario que dejó la Task 1):

```css
@media (prefers-reduced-motion: reduce) {
  /* El ruido es textura estática, no movimiento: se conserva. */
  /* display:none y NO animation:none — el estado base del ripple es visible y quedaría un círculo fijo. */
  .lg-ripple { display: none !important; }
}
```

- [ ] **Step 3: Verificar en el navegador**

Recargar `http://localhost:3000`. En consola:

```js
// Host de prueba con el contrato correcto
const host = document.createElement("div");
host.style.cssText = "position:relative;overflow:hidden;width:200px;height:60px;background:#123";
document.body.appendChild(host);
const off = Liquid.ripple(host);
host.dispatchEvent(new PointerEvent("pointerdown", { clientX: host.getBoundingClientRect().left + 10, clientY: host.getBoundingClientRect().top + 10, bubbles: true }));
const now = host.querySelectorAll(".lg-ripple").length;
setTimeout(() => console.log("tras 1.4s:", host.querySelectorAll(".lg-ripple").length, "| cleanup:", typeof off), 1400);
now;
```
Expected: `1` inmediatamente; a los 1.4s la consola imprime `tras 1.4s: 0 | cleanup: function` (se autodestruyó). Limpiar con `host.remove()`.

- [ ] **Step 4: Commit**

```bash
git add app/web/liquid.js app/web/liquid.css
git commit -m "feat: Liquid.ripple, la onda que nace donde tocas y muere al llegar"
```

---

### Task 3: Aplicar el ripple a las superficies interactivas

**Files:**
- Modify: `app/web/screens/exercises.jsx` (los 4 renderers)
- Modify: `app/web/screens/CourseScreen.jsx` (`LessonRow`)

**Interfaces:**
- Consumes: `Liquid.ripple(el) → cleanup` (Task 2). El host necesita `position: relative` + `overflow: hidden`.
- Produces: nada nuevo de API; solo comportamiento.

**Contexto de decisión (NO desviarse):** el ripple va SOLO en elementos cuyo DOM es nuestro y que no tienen `transform` de hover. **NO** se aplica a los botones del KIT (`Button`, `IconButton`) ni a `CourseCard` — `Card` del DS hace `translateY(-4px) scale(1.01)` en hover, y un host con `overflow: hidden` le recortaría ese lift.

- [ ] **Step 1: Crear un componente `RippleBox` reutilizable en `exercises.jsx`**

En `app/web/screens/exercises.jsx`, justo después de la línea `const KITE = window.CodingDesignSystem_2ecb3a;`, añadir:

```jsx
// Superficie que responde al tacto con una onda. Cumple el contrato del host de Liquid.ripple.
function RippleBox({ style, onClick, children, disabled }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (disabled) return;
    return Liquid.ripple(ref.current);
  }, [disabled]);
  return (
    <div ref={ref} onClick={onClick} style={{ position: "relative", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Usar `RippleBox` en `ChoiceExercise`**

Reemplazar el `<div key={i} onClick=… style=…>` de `ChoiceExercise` por `RippleBox` (mismo estilo, mismo handler):

```jsx
function ChoiceExercise({ payload, value, onChange, locked }) {
  const { Radio } = KITE;
  const sel = value ? value.index : -1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {payload.options.map((o, i) => (
        <RippleBox key={i} disabled={locked} onClick={() => !locked && onChange({ index: i })}
          style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: sel === i ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", border: "1px solid " + (sel === i ? "var(--focus-ring)" : "var(--glass-stroke)"), cursor: locked ? "default" : "pointer", transition: "all var(--duration-fast) var(--ease-glass)" }}>
          <Radio name="ex-choice" checked={sel === i} onChange={() => !locked && onChange({ index: i })}
            label={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{o}</span>} />
        </RippleBox>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Ripple en `TokenChip` (fichas de `blanks`)**

`TokenChip` es un `<button>`, no un div: le añadimos el ripple directamente (los `<button>` aceptan hijos posicionados).

```jsx
function TokenChip({ text, ghost, onClick }) {
  const ref = React.useRef(null);
  const live = Boolean(onClick) && !ghost;
  React.useEffect(() => {
    if (!live) return;
    return Liquid.ripple(ref.current);
  }, [live]);
  return (
    <button ref={ref} onClick={onClick} disabled={ghost || !onClick}
      style={{ position: "relative", overflow: "hidden", fontFamily: "var(--font-mono)", fontSize: 12.5, padding: "7px 14px", borderRadius: "var(--radius-pill)", border: "1px solid var(--glass-stroke-strong)", background: ghost ? "transparent" : "var(--glass-bg-strong)", color: ghost ? "var(--text-tertiary)" : "var(--text-primary)", opacity: ghost ? 0.35 : 1, cursor: onClick && !ghost ? "pointer" : "default", boxShadow: ghost ? "none" : "var(--refraction-edge)", transition: "all var(--duration-fast) var(--ease-glass)" }}>
      {text}
    </button>
  );
}
```

- [ ] **Step 4: Ripple en las líneas de `OrderExercise`**

Las líneas ya usan `lineStyle`. Reemplazar los dos `<div … onClick=…>` (secuencia y disponibles) por `RippleBox`:

```jsx
        {order.map((id, i) => (
          <RippleBox key={id} disabled={locked} style={{ ...lineStyle, background: "var(--glass-bg-strong)" }} onClick={() => !locked && onChange({ order: order.filter((x) => x !== id) })}>
            <span style={{ color: "var(--accent-cyan)", fontWeight: 700, minWidth: 16 }}>{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: byId[id].html }} />
          </RippleBox>
        ))}
```

y

```jsx
        {available.map((l) => (
          <RippleBox key={l.id} disabled={locked} style={lineStyle} onClick={() => !locked && onChange({ order: [...order, l.id] })}>
            <span dangerouslySetInnerHTML={{ __html: l.html }} />
          </RippleBox>
        ))}
```

- [ ] **Step 5: Ripple en las celdas de `MatchExercise`**

Reemplazar el helper `cell` por una versión con `RippleBox` (misma firma, mismos estilos):

```jsx
  const cell = (text, active, color, onClick, key) => (
    <RippleBox key={key} disabled={locked} onClick={onClick} style={{ padding: "11px 14px", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", color: "var(--text-primary)", background: active ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", borderStyle: "solid", borderColor: color || (active ? "var(--focus-ring)" : "var(--glass-stroke)"), borderWidth: color ? "1px 1px 1px 3px" : "1px", cursor: locked ? "default" : "pointer", transition: "all var(--duration-fast) var(--ease-glass)" }}>
      {text}
    </RippleBox>
  );
```

- [ ] **Step 6: Ripple en `LessonRow` (`CourseScreen.jsx`)**

`LessonRow` ya es un div propio con handlers de hover. Añadir el ref, el efecto y el contrato del host:

```jsx
function LessonRow({ lesson, onOpen }) {
  const { Badge } = KITC;
  const [hover, setHover] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => Liquid.ripple(ref.current), []);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(lesson.id)}
      style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: "var(--radius-md)", cursor: "pointer", background: hover ? "var(--glass-bg-strong)" : lesson.current ? "var(--glass-tint-cyan)" : "transparent", border: "1px solid " + (lesson.current ? "rgba(82,201,184,0.35)" : hover ? "var(--glass-stroke)" : "transparent"), transition: "all var(--duration-fast) var(--ease-glass)" }}
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
```

(Respecto al actual solo cambian tres cosas: el `ref`, y `position: relative` + `overflow: hidden` al principio del estilo. El contenido interno es idéntico.)

- [ ] **Step 7: Verificar E2E en el navegador**

Recargar, entrar con `juan@test.dev` / `secreto1`, instalar el trap de errores. Comprobar:

1. **Temario:** entrar a un curso; al tocar una fila del temario aparece un `.lg-ripple` dentro de ella y desaparece solo. Verificar con `javascript_tool` justo tras el click: `document.querySelectorAll(".lg-ripple").length === 1`, y a los 1.5s `=== 0`.
2. **Ejercicio `choice`:** entrar a una lección, ir al ejercicio; al tocar una opción nace la onda **en el punto tocado** (no en el centro): comprobar que el `left`/`top` del span NO son iguales a `-(d/2)` centrado. Basta comprobar que existe y muere.
3. **`blanks`, `order`, `match`:** buscar una lección con cada tipo y comprobar que el ripple aparece en fichas / líneas / celdas.
4. `window.__errs.length === 0` en todos los casos.

- [ ] **Step 8: Commit**

```bash
git add app/web/screens/exercises.jsx app/web/screens/CourseScreen.jsx
git commit -m "feat: ripple en las superficies tap-ables (ejercicios y temario)"
```

---

### Task 4: Liquid.reveal — elementos que se condensan al entrar

**Files:**
- Modify: `app/web/liquid.js` (añadir el método `reveal`)
- Modify: `app/web/liquid.css` (sección del reveal + reduced motion)

**Interfaces:**
- Consumes: `window.FX.reducedMotion`; `IntersectionObserver`.
- Produces: **`Liquid.reveal(container)` → `cleanup()`**. Busca los descendientes `.lg-reveal:not(.is-visible)` de `container`, les publica `--reveal-delay` y los observa; al intersectar les añade `is-visible` y hace `unobserve`. Devuelve `disconnect`. Las Tasks 5 la consumen así:
  ```jsx
  const rootRef = React.useRef(null);
  React.useEffect(() => Liquid.reveal(rootRef.current), [datosCargados]);
  ```
  (La dependencia es necesaria: los elementos aparecen tras la carga async.)

- [ ] **Step 1: Implementar `reveal` en `app/web/liquid.js`**

Añadir el método DENTRO del objeto `Liquid`, después de `ripple` (respetando la coma):

```js
  // Los elementos .lg-reveal no "aparecen": se condensan (de vapor a sólido) al entrar en pantalla.
  // Ceremonia de primera vez: una vez revelado, se deja de observar.
  reveal(container) {
    if (!container) return () => {};
    const els = Array.from(container.querySelectorAll(".lg-reveal:not(.is-visible)"));
    if (!els.length) return () => {};
    if ((window.FX && FX.reducedMotion) || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return () => {};
    }
    // Stagger con techo: los primeros ~6 entran en cascada; el resto, juntos.
    // Sin el techo, una grilla de 20 tarjetas tarda más de un segundo y la página se percibe lenta.
    els.forEach((el, i) => el.style.setProperty("--reveal-delay", Math.min(i * 55, 330) + "ms"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  },
```

- [ ] **Step 2: Añadir el CSS del reveal**

En `app/web/liquid.css`, insertar ANTES del bloque `@media (prefers-reduced-motion: reduce)`:

```css
/* ---------- Reveal: el elemento no aparece, se CONDENSA (vapor → sólido) ---------- */
.lg-reveal {
  opacity: 0;
  transform: translateY(28px);
  filter: blur(10px); /* ← la firma líquida: sin esto es un fade+slide cualquiera */
  transition:
    opacity var(--duration-slow) var(--ease-glass) var(--reveal-delay, 0ms),
    transform var(--duration-slow) var(--ease-glass) var(--reveal-delay, 0ms),
    filter var(--duration-slow) ease var(--reveal-delay, 0ms);
}
.lg-reveal.is-visible {
  opacity: 1;
  transform: none;
  filter: none; /* en reposo no hay filter: el backdrop-filter de los paneles funciona normal */
}
```

Y DENTRO del bloque de reduced motion añadir:

```css
  .lg-reveal { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
```

- [ ] **Step 3: Verificar en el navegador**

Recargar. En consola:

```js
window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));
const box = document.createElement("div");
box.innerHTML = '<div class="lg-reveal">a</div><div class="lg-reveal">b</div>';
document.body.appendChild(box);
const off = Liquid.reveal(box);
setTimeout(() => {
  const els = box.querySelectorAll(".lg-reveal");
  console.log("visibles:", [...els].filter((e) => e.classList.contains("is-visible")).length,
              "| delay 2º:", els[1].style.getPropertyValue("--reveal-delay"),
              "| cleanup:", typeof off, "| errs:", window.__errs.length);
  box.remove();
}, 400);
```
Expected: `visibles: 2 | delay 2º: 55ms | cleanup: function | errs: 0` (el box está en viewport, así que intersecta de inmediato).

- [ ] **Step 4: Commit**

```bash
git add app/web/liquid.js app/web/liquid.css
git commit -m "feat: Liquid.reveal, los elementos se condensan de vapor a solido al entrar"
```

---

### Task 5: Aplicar los reveals al dashboard y al curso

**Files:**
- Modify: `app/web/screens/DashboardScreen.jsx`
- Modify: `app/web/screens/CourseScreen.jsx`

**Interfaces:**
- Consumes: `Liquid.reveal(container) → cleanup` (Task 4); la clase `.lg-reveal`.
- Produces: nada nuevo de API.

**Recordatorio del KIT:** `GlassPanel` y `Card` **no reenvían `className`** → cada uno se envuelve en un `<div className="lg-reveal">` propio. `Card` hace su lift de hover en su div interno, así que el wrapper no le estorba (el wrapper NO lleva `overflow: hidden`).

- [ ] **Step 1: Reveals en `DashboardScreen`**

En `DashboardScreen`, añadir el ref y el efecto justo después de `React.useEffect(load, []);`:

```jsx
  const rootRef = React.useRef(null);
  React.useEffect(() => Liquid.reveal(rootRef.current), [courses, me.stats.reviewCount]);
```

Reemplazar el `return` completo de `DashboardScreen` por (el saludo y el `<h2>` NO llevan reveal; el `key` se mueve del `CourseCard` a su wrapper):

```jsx
  return (
    <PageFrame>
      <NavBar onHome={() => {}} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: stats.streak }} />
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
            <StatPanel label="Racha" value={stats.streak + (stats.streak === 1 ? " día" : " días")} sub={"Tu mejor racha: " + stats.bestStreak + (stats.bestStreak === 1 ? " día" : " días")} tone="none" />
          </div>
          <div className="lg-reveal">
            <StatPanel label="XP total" value={stats.xp.toLocaleString("es")} sub={"+" + stats.xpWeek + " esta semana"} tone="blue" />
          </div>
          <div className="lg-reveal">
            <StatPanel label="Materias activas" value={String(stats.activeCourses)} sub={stats.completedCourses + " completadas · " + stats.lockedCourses + " bloqueadas"} tone="cyan" />
          </div>
        </div>
        {me.stats.reviewCount > 0 ? (
          <div className="lg-reveal">
            <KITD.GlassPanel tint="none" padding="var(--space-5)" style={{ marginBottom: 28, border: "1px solid rgba(230,175,107,0.35)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <Orb size={44} mood="idle" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>Repaso pendiente</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{me.stats.reviewCount} {me.stats.reviewCount === 1 ? "ejercicio" : "ejercicios"} por repasar · +5 XP cada uno</div>
                </div>
                <KITD.Button variant="secondary" onClick={onOpenReview}>Repasar ahora</KITD.Button>
              </div>
            </KITD.GlassPanel>
          </div>
        ) : null}
        <h2 style={{ margin: "0 4px 16px", fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>Tus materias</h2>
        {error ? (
          <ErrorPanel message={error} onRetry={load} />
        ) : !courses ? (
          <LoadingPanel />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
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
```

- [ ] **Step 2: Reveals en `CourseScreen`**

Añadir el ref y el efecto después de `React.useEffect(load, [courseId]);`:

```jsx
  const rootRef = React.useRef(null);
  React.useEffect(() => Liquid.reveal(rootRef.current), [course]);
```

Reemplazar el `React.Fragment` de la rama cargada (el `else` final del ternario) por (el `key` se mueve del `GlassPanel` de unidad a su wrapper):

```jsx
        <React.Fragment>
          <div ref={rootRef}>
            <div className="lg-reveal">
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
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {course.units.map((u) => (
                <div key={u.id} className="lg-reveal">
                  <GlassPanel padding="var(--space-5)">
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "0 4px 10px" }}>{u.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {u.lessons.map((l) => <LessonRow key={l.id} lesson={l} onOpen={onOpenLesson} />)}
                    </div>
                  </GlassPanel>
                </div>
              ))}
            </div>
          </div>
        </React.Fragment>
```

- [ ] **Step 3: Verificar E2E**

Recargar, entrar, instalar el trap. Comprobar:

1. **Dashboard:** al cargar, `document.querySelectorAll(".lg-reveal").length` es 10 (3 stats + 6 cursos + tarjeta de repaso si la hay); tras ~1.2s **todos** tienen `is-visible` (`[...document.querySelectorAll(".lg-reveal")].every(e => e.classList.contains("is-visible")) === true`). Ningún elemento queda invisible.
2. El stagger existe: `document.querySelectorAll(".lg-reveal")[1].style.getPropertyValue("--reveal-delay")` devuelve `"55ms"`.
3. **Curso:** entrar a un curso; el héroe y las unidades se revelan; las filas del temario siguen clickeables y con ripple (regresión de la Task 3).
4. **No re-animan:** hacer scroll abajo y arriba en el dashboard — los `.lg-reveal` conservan `is-visible` (no vuelven a ocultarse).
5. `window.__errs.length === 0`.

- [ ] **Step 4: Commit**

```bash
git add app/web/screens/DashboardScreen.jsx app/web/screens/CourseScreen.jsx
git commit -m "feat: las tarjetas del dashboard y del curso se condensan al entrar en pantalla"
```

---

### Task 6: useScrolled — el disparador sin listener de scroll

**Files:**
- Modify: `app/web/screens/AppShell.jsx` (hook nuevo + export)

**Interfaces:**
- Consumes: `IntersectionObserver`.
- Produces: **`useScrolled(px)` → `boolean`** (publicado en `window`). Devuelve `false` mientras la página está a menos de `px` del tope; `true` cuando bajó más. Sin `IntersectionObserver`: siempre `false` (degradación segura: navbar fusionada). La Task 7 lo consume: `const split = useScrolled(32);`.

- [ ] **Step 1: Implementar el hook**

En `app/web/screens/AppShell.jsx`, añadir justo ANTES del `Object.assign` final (después de `usePhase`):

```jsx
// true cuando la página bajó más de `px`. Sin listener de scroll: un centinela invisible al tope
// + IntersectionObserver = cero trabajo por frame.
function useScrolled(px) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:" + px + "px;pointer-events:none;";
    document.body.appendChild(sentinel);
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    io.observe(sentinel);
    return () => { io.disconnect(); sentinel.remove(); };
  }, [px]);
  return scrolled;
}
```

- [ ] **Step 2: Exportarlo**

Cambiar la última línea de `AppShell.jsx`:

```jsx
Object.assign(window, { KIcon, ICONS, NavBar, PageFrame, LoadingPanel, ErrorPanel, SoundToggle, usePhase, useScrolled });
```

- [ ] **Step 3: Verificar en el navegador**

Recargar. En consola:

```js
window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));
JSON.stringify({ hook: typeof window.useScrolled, errs: window.__errs.length })
```
Expected: `{"hook":"function","errs":0}`. La app sigue navegando normal (el hook aún no lo usa nadie).

- [ ] **Step 4: Commit**

```bash
git add app/web/screens/AppShell.jsx
git commit -m "feat: useScrolled, disparador de scroll con centinela e IntersectionObserver"
```

---

### Task 7: La NavBar líquida — la gota que se parte en tres

**Files:**
- Modify: `app/web/screens/AppShell.jsx` (reescritura de `NavBar`)
- Modify: `app/web/liquid.css` (sección de la navbar + reduced motion)

**Interfaces:**
- Consumes: `useScrolled(32)` (Task 6); tokens `--glass-stroke`, `--shadow-glass`, `--refraction-edge`, `--radius-pill`, `--blur-lg`, `--saturate-glass`, `--ease-spring`, `--ease-glass`.
- Produces: nada nuevo de API. `NavBar` conserva **exactamente** su firma actual `{ onHome, tab, setTab, user }` — la usan las 5 pantallas y ninguna cambia.

**Los tres problemas de CSS ya resueltos (NO improvisar otra solución):**

1. **El seam.** Dos superficies translúcidas adyacentes muestran una costura si tienen bordes laterales. Solución: las píldoras y los puentes llevan **siempre `border: 1px solid transparent`** (el ancho nunca cambia ⇒ nunca hay layout) y solo se anima **`border-color`**. En estado fusionado, los cantos internos son `transparent`: el fondo translúcido de cada pieza se pinta bajo ese borde (`background-clip: border-box`, el default), así que las piezas se tocan **sin costura**.
2. **Los brillos internos.** `--refraction-edge` incluye insets laterales que también delatarían las costuras. Solución: en estado fusionado, las piezas usan solo los insets superior e inferior; en estado partido, cada píldora recupera el `--refraction-edge` completo. Se anima `box-shadow` (repintado, no layout).
3. **Squash vs rebote.** No pueden pelearse por la propiedad `transform`. Solución: el **desplazamiento** va por `transition: transform` con `--ease-spring` (su cuarto número, `1.56 > 1`, hace que la curva se pase del destino y regrese — el rebote de la gota, sin JS), y el **squash & stretch** va por keyframe usando la propiedad individual **`scale`**, que compone con `transform` sin conflicto.

- [ ] **Step 1: Añadir el CSS de la navbar a `liquid.css`**

Insertar ANTES del bloque `@media (prefers-reduced-motion: reduce)`:

```css
/* ---------- NavBar líquida: una gota que se parte en tres por tensión superficial ---------- */
.lg-nav {
  position: sticky;
  top: 20px;
  z-index: 40;
  display: flex;
  align-items: stretch; /* píldoras y puentes con la misma altura: es UNA superficie */
}

/* Píldoras y puentes comparten el material. Borde SIEMPRE de 1px (el ancho nunca cambia ⇒ nunca hay
   layout); lo que cambia es el COLOR: los cantos internos son transparentes en estado fusionado, y
   así las piezas se tocan sin costura. */
.lg-nav__pill,
.lg-nav__bridge {
  position: relative;
  background: rgba(16, 23, 44, 0.6);
  border: 1px solid transparent;
  border-top-color: var(--glass-stroke);
  border-bottom-color: var(--glass-stroke);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), inset 0 -1px 0 rgba(255, 255, 255, 0.09), var(--shadow-glass);
}

.lg-nav__pill {
  display: flex;
  align-items: center;
  gap: 12px;
  transition:
    transform 520ms var(--ease-spring),
    border-color 380ms var(--ease-glass),
    border-radius 380ms var(--ease-glass),
    box-shadow 380ms var(--ease-glass);
}
.lg-nav__pill--logo {
  padding: 10px 20px 10px 24px;
  cursor: pointer;
  border-left-color: var(--glass-stroke);
  border-radius: var(--radius-pill) 0 0 var(--radius-pill);
}
.lg-nav__pill--tabs {
  padding: 10px 16px;
  border-radius: 0;
}
.lg-nav__pill--actions {
  padding: 10px 12px 10px 16px;
  border-right-color: var(--glass-stroke);
  border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
}

/* El puente: la masa conectiva. Al partirse adelgaza en Y mientras se estira en X
   (conservación de volumen) y SOLO DESPUÉS se desvanece — por eso la opacidad va con 120ms de
   retardo: el cuello se ve romperse, no apagarse. */
.lg-nav__bridge {
  flex: 1;
  min-width: 10px;
  transform-origin: center;
  transition: transform 420ms var(--ease-glass), opacity 300ms var(--ease-glass) 120ms;
}

/* --- Estado partido --- */
.lg-nav--split .lg-nav__bridge {
  transform: scaleY(0) scaleX(1.1);
  opacity: 0;
}
.lg-nav--split .lg-nav__pill {
  border-color: var(--glass-stroke);
  border-radius: var(--radius-pill);
  box-shadow: var(--refraction-edge), var(--shadow-glass);
}
.lg-nav--split .lg-nav__pill--logo { transform: translateX(-10px); }
.lg-nav--split .lg-nav__pill--actions { transform: translateX(10px); }

/* Squash & stretch, en la propiedad individual `scale` para no pelear con el translate del rebote.
   Escalas siempre inversas = conservación de volumen: es lo que el ojo lee como materia blanda.
   `--merged` solo se aplica tras la primera partida, así nada se anima al cargar la página. */
.lg-nav--split .lg-nav__pill,
.lg-nav--merged .lg-nav__pill {
  animation: lg-nav-squash 520ms var(--ease-glass);
}
@keyframes lg-nav-squash {
  0%, 100% { scale: 1 1; }
  40% { scale: 1.02 0.95; } /* estirada en X, chata en Y */
  70% { scale: 0.99 1.02; } /* se pasa y se comprime al revés */
}
```

Y DENTRO del bloque de reduced motion:

```css
  .lg-nav__pill, .lg-nav__bridge { transition: none !important; animation: none !important; }
  /* display:none y NO animation:none — el estado base del puente es visible, y con animation:none
     quedaría a scaleY(1) en estado partido: la navbar se vería fusionada y rota a la vez. */
  .lg-nav--split .lg-nav__bridge { display: none !important; }
```

- [ ] **Step 2: Reescribir `NavBar` en `AppShell.jsx`**

Reemplazar la función `NavBar` completa (líneas ~30-52) por:

```jsx
// El blur del vidrio: SIEMPRE en una capa aria-hidden aparte, jamás sobre un elemento con texto.
function NavGlass() {
  return <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))" }}></span>;
}

function NavBar({ onHome, tab, setTab, user }) {
  const { Tabs, IconButton, Badge } = KIT;
  const split = useScrolled(32);
  const [hasSplit, setHasSplit] = React.useState(false);
  React.useEffect(() => { if (split) setHasSplit(true); }, [split]);
  const cls = "lg-nav" + (split ? " lg-nav--split" : hasSplit ? " lg-nav--merged" : "");
  return (
    <div className={cls}>
      <div className="lg-nav__pill lg-nav__pill--logo" onClick={onHome}>
        <NavGlass />
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Coding</span>
        <span style={{ width: 4, height: 18, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 10px var(--accent-cyan)" }}></span>
      </div>
      <span aria-hidden className="lg-nav__bridge"><NavGlass /></span>
      <div className="lg-nav__pill lg-nav__pill--tabs">
        <NavGlass />
        <Tabs size="sm" value={tab} onChange={setTab} style={{ width: 380 }} items={[
          { id: "inicio", label: "Inicio" },
          { id: "materias", label: "Materias" },
          { id: "progreso", label: "Progreso" },
        ]} />
      </div>
      <span aria-hidden className="lg-nav__bridge"><NavGlass /></span>
      <div className="lg-nav__pill lg-nav__pill--actions">
        <NavGlass />
        <SoundToggle />
        <IconButton label="Buscar" size="sm" variant="ghost"><KIcon d={ICONS.search} /></IconButton>
        <Badge tone="amber" dot>{user.streak} {user.streak === 1 ? "día" : "días"}</Badge>
        <div style={{ width: 36, height: 36, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #6FA0E0, #4E86D6)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 14px rgba(94,151,230,0.35)", fontSize: 13, fontWeight: 700, color: "var(--text-on-accent)" }}>{user.initials}</div>
      </div>
    </div>
  );
}
```

Nota: `useScrolled` y `NavGlass` se definen en el mismo archivo antes de usarse. `NavGlass` NO necesita export (uso interno).

- [ ] **Step 3: Verificar E2E en el navegador**

Recargar, entrar, instalar el trap. Ir al dashboard (tiene scroll suficiente).

1. **Arriba (fusionada):** `document.querySelector(".lg-nav").className` no contiene `lg-nav--split`. Verificar que se lee como UNA píldora: los dos `.lg-nav__bridge` tienen `opacity: 1` y `transform: none` (o `matrix(1,0,0,1,0,0)`) según `getComputedStyle`. Comprobar a ojo (`read_page` / zoom) que no hay costuras verticales entre logo, tabs y acciones.
2. **Al bajar:** `window.scrollTo(0, 200)`; tras ~600ms la clase incluye `lg-nav--split`, los puentes tienen `opacity: 0`, y las tres píldoras tienen `border-radius` de 999px. Las píldoras de los extremos están desplazadas (`transform` con `translateX` de ∓10px).
3. **Al volver arriba:** `window.scrollTo(0, 0)`; tras ~600ms la clase incluye `lg-nav--merged` (no `--split`), los puentes vuelven a `opacity: 1` y las esquinas internas se cuadran.
4. **Funcionalidad intacta en ambos estados:** clic en el logo (vuelve al inicio), las Tabs cambian, el toggle de sonido funciona, la racha y el avatar se ven.
5. **Texto nítido:** ningún elemento con texto tiene `backdrop-filter` propio (el blur vive solo en los `<span aria-hidden>` de `NavGlass`).
6. `window.__errs.length === 0`, y **cero errores al cargar la página estando ya scrolleado** (recargar con la página desplazada).

- [ ] **Step 4: Commit**

```bash
git add app/web/screens/AppShell.jsx app/web/liquid.css
git commit -m "feat: navbar liquida que se parte en tres por tension superficial al hacer scroll"
```

---

### Task 8: Verificación final

**Files:**
- Ninguno (solo verificación). Si algo falla: arreglar en el archivo correspondiente y commitear como `fix:`.

**Interfaces:**
- Consumes: todo lo anterior.

- [ ] **Step 1: Backend intacto**

Run: `npm test` (desde `app/`)
Expected: **57/57 pass**. Este plan no tocó `app/server/` ni `app/test/`.

- [ ] **Step 2: Checklist E2E completo (spec §8)**

En el navegador contra :3000, con el trap `window.onerror` instalado tras cada recarga:

1. **NavBar:** fusionada arriba (sin costuras); se parte al bajar 32px con el cuello adelgazándose antes de desvanecerse; se re-fusiona al subir; sin parpadeo al oscilar en el umbral; logo, tabs, sonido, racha y avatar funcionan en ambos estados.
2. **Ripple:** la onda nace en el punto tocado (no en el centro) en opciones de `choice`, fichas de `blanks`, líneas de `order`, celdas de `match` y filas del temario; no quedan `<span class="lg-ripple">` en el DOM tras 1.5s.
3. **Reveals:** dashboard y curso se condensan en cascada; al re-scrollear NO se re-animan; ningún elemento queda invisible.
4. **Ruido:** `.lg-noise` presente, `pointer-events: none`, no intercepta clicks (los botones del dashboard responden).
5. **Regresión de la coreografía de gota:** la banda de feedback entra con rebote y se evapora; el melt entre ejercicios funciona; completar una lección dispara bloom + celebración condensada; el repaso funciona.

- [ ] **Step 3: Reduced motion (doble cinturón)**

**Cinturón JS**, en consola: `FX.reducedMotion = true;` → tocar una opción de ejercicio NO inyecta `.lg-ripple`; navegar al dashboard revela todo al instante (`is-visible` inmediato). Restaurar con `FX.reducedMotion = false` + recarga.

**Cinturón CSS:** si el navegador permite emular `prefers-reduced-motion: reduce`, activarlo y comprobar que (a) no queda ningún círculo blanco fijo dentro de los elementos tocados, (b) en estado partido NO se ve ningún puente (la navbar se ve como tres píldoras limpias, no fusionada-y-rota a la vez), (c) ningún contenido queda invisible. Si no se puede emular, verificar por lectura del bloque `@media` de `liquid.css` que cubre `.lg-ripple` (display none), `.lg-nav--split .lg-nav__bridge` (display none), `.lg-nav__pill`/`.lg-nav__bridge` (transition/animation none) y `.lg-reveal` (visible).

- [ ] **Step 4: Anotar la verificación humana pendiente**

Añadir al ledger `.superpowers/sdd/progress.md`: el *feel* (la ruptura del cuello de la navbar, el squash de las píldoras, la onda del ripple, la condensación) requiere un navegador en primer plano — el tooling suspende `rAF` y las animaciones en pestaña de fondo.

- [ ] **Step 5: Commit final (solo si hubo fixes)**

```bash
git add -A
git commit -m "fix: ajustes de la verificacion final del vidrio vivo"
```
