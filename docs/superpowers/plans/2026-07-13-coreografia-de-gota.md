# Coreografía de gota — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que nada en el loop de ejercicios (lección + repaso) aparezca o desaparezca en seco: entradas como gota que cae, salidas como evaporación, según la spec `docs/superpowers/specs/2026-07-13-coreografia-de-gota-design.md`.

**Architecture:** keyframes nuevos en `app/web/motion.css` (solo `transform`/`opacity`/`filter`); `FX.bloom(x,y)` imperativo en `app/web/fx.js`; una primitiva compartida `usePhase(value, outMs)` en `app/web/screens/AppShell.jsx` que retrasa el intercambio de valor para dar tiempo a la animación de salida; las pantallas (`FeedbackBand`, `LessonScreen`, `CelebrationScreen`, `ReviewScreen`) consumen fase + clases.

**Tech Stack:** React 18 UMD + Babel standalone (frontend SIN build), CSS puro sobre tokens del DS. Cero dependencias nuevas.

## Global Constraints

- Frontend sin build: PROHIBIDO `import`/`export` en `app/web/`; `React.Fragment` explícito (nunca `<>`); todo se comparte vía `Object.assign(window, {...})`; el orden de `<script>` en `index.html` es la resolución de dependencias (NO cambia en este plan: no hay archivos nuevos).
- Solo se animan `transform`, `opacity`, `filter`. Jamás top/left/width/height/margin en keyframes.
- `Coding Design System/` es INTOCABLE. `GlassPanel` no reenvía `className`: las clases de animación van en divs propios.
- Copy en español con tuteo, sin emoji.
- Timers/rAF en refs con `clearTimeout`/`cancelAnimationFrame` en cleanup de desmontaje.
- Reduced motion con doble cinturón: gate JS (`FX.reducedMotion`) + bloque `@media (prefers-reduced-motion: reduce)` en CSS.
- Los 57 tests de backend (`npm test` desde `app/`) deben seguir pasando; este plan no toca `app/server/` ni `app/test/`.
- Dev server: suele estar corriendo en :3000 (EADDRINUSE ⇒ reusarlo; los estáticos se sirven frescos del disco). Cuenta de pruebas: `juan@test.dev` / `secreto1`.
- Rama de trabajo: `feature/coreografia-de-gota`, creada desde `docs/liquid-glass`.
- Gotchas del navegador embebido: verificar por `read_page`/`javascript_tool`/clases del DOM; los screenshots pueden hacer timeout y el rAF se suspende en background.

---

### Task 1: Vocabulario CSS en motion.css

**Files:**
- Modify: `app/web/motion.css` (añadir al final, antes del bloque `@media (prefers-reduced-motion: reduce)`; y ampliar ese bloque)

**Interfaces:**
- Produces: clases CSS `anim-drop-in`, `anim-evaporate`, `anim-melt-out`, `anim-melt-in`, `anim-condense`, `anim-condense--delayed`, `fx-bead`, `fx-bloom` — usadas por Tasks 2, 4, 5, 6, 7.
- Consumes: tokens del DS ya cargados (`--ease-out`, `--ease-glass`).

- [ ] **Step 1: Añadir los keyframes nuevos**

Insertar en `app/web/motion.css`, inmediatamente ANTES del bloque `@media (prefers-reduced-motion: reduce)` existente:

```css
/* Coreografía de gota — spec 2026-07-13 */
.anim-drop-in { animation: drop-in 320ms var(--ease-out) both; transform-origin: bottom center; }
@keyframes drop-in {
  0% { opacity: 0; transform: translateY(105%) scaleY(1.18) scaleX(0.96); }
  58% { opacity: 1; transform: translateY(-3px) scaleY(0.97) scaleX(1.04); }
  100% { opacity: 1; transform: none; }
}

.anim-evaporate { animation: evaporate 160ms var(--ease-glass) forwards; }
@keyframes evaporate {
  to { opacity: 0; filter: blur(6px); transform: translateY(-6px) scale(0.96); }
}

.anim-melt-out { animation: melt-out 160ms var(--ease-glass) forwards; }
@keyframes melt-out {
  to { opacity: 0; filter: blur(5px); }
}

.anim-melt-in { animation: melt-in 280ms var(--ease-out) both; }
@keyframes melt-in {
  from { opacity: 0; filter: blur(5px); transform: translateY(8px); }
  to { opacity: 1; filter: blur(0); transform: translateY(0); }
}

.anim-condense { animation: condense 640ms var(--ease-glass) both; }
.anim-condense--delayed { animation-delay: 80ms; }
@keyframes condense {
  from { opacity: 0; filter: blur(10px); transform: translateY(18px) scale(0.97); }
  to { opacity: 1; filter: none; transform: none; }
}

.fx-bead {
  position: absolute; width: 8px; height: 8px; border-radius: 50%;
  background: rgba(226, 236, 255, 0.72); pointer-events: none;
  animation: bead 640ms var(--ease-out) both;
}
@keyframes bead {
  0%, 18% { opacity: 0.72; transform: scale(1.15); }
  100% { opacity: 0; transform: scale(0.42); }
}

.fx-bloom {
  position: fixed; z-index: 190; border-radius: 50%; pointer-events: none;
  mix-blend-mode: screen;
  background: radial-gradient(circle, rgba(82, 201, 184, 0.35), rgba(226, 236, 255, 0.12) 45%, transparent 70%);
  animation: bloom 640ms var(--ease-out) forwards;
}
@keyframes bloom {
  0% { opacity: 0.82; transform: scale(0.18); filter: blur(0); }
  54% { opacity: 0.62; transform: scale(1.05); filter: blur(0.5px); }
  100% { opacity: 0; transform: scale(1.38); filter: blur(1.5px); }
}
```

- [ ] **Step 2: Ampliar el bloque de reduced motion**

Dentro del bloque `@media (prefers-reduced-motion: reduce)` existente, añadir estas dos reglas (dejando las actuales intactas):

```css
  .anim-evaporate, .anim-melt-out, .fx-bead { animation: none !important; }
  .fx-bloom { display: none !important; }
  .anim-drop-in, .anim-melt-in, .anim-condense { animation-duration: 1ms !important; animation-delay: 0ms !important; }
```

Nota: `.fx-bloom` va con `display: none` (no basta `animation: none` — su estado base es visible y quedaría una mancha fija hasta el timeout de seguridad). Las entradas van a 1ms para que el contenido nunca quede oculto (mismo criterio que `anim-screen-in`).

- [ ] **Step 3: Verificar que el server sirve el CSS nuevo**

Con el dev server corriendo en :3000 (si no: `npm start` desde `app/`, reusar si EADDRINUSE):

Run (PowerShell): `(Invoke-WebRequest -UseBasicParsing http://localhost:3000/motion.css).Content -match "drop-in" ; (Invoke-WebRequest -UseBasicParsing http://localhost:3000/motion.css).Content -match "fx-bloom"`
Expected: `True` dos veces.

Cargar `http://localhost:3000` en el navegador y comprobar cero errores de consola.

- [ ] **Step 4: Commit**

```bash
git add app/web/motion.css
git commit -m "feat: vocabulario CSS de la coreografia de gota (drop-in, evaporate, melt, condense, bead, bloom)"
```

---

### Task 2: FX.bloom en fx.js

**Files:**
- Modify: `app/web/fx.js` (método nuevo dentro del objeto `FX`, después de `burst`)

**Interfaces:**
- Consumes: clase CSS `fx-bloom` (Task 1); `FX.reducedMotion` existente.
- Produces: `FX.bloom(x, y)` — `x`,`y` en px de viewport; sin valor de retorno. Usada por Tasks 5 y 7.

- [ ] **Step 1: Implementar FX.bloom**

En `app/web/fx.js`, añadir después del cierre del método `burst(x, y, count = 14) {...},` (y antes de `sound:`):

```js
  bloom(x, y) {
    if (FX.reducedMotion) return;
    const s = document.createElement("span");
    s.className = "fx-bloom";
    const d = Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.6);
    s.style.width = d + "px";
    s.style.height = d + "px";
    s.style.left = (x - d / 2) + "px";
    s.style.top = (y - d / 2) + "px";
    document.body.appendChild(s);
    s.addEventListener("animationend", () => s.remove());
    setTimeout(() => s.remove(), 1200);
  },
```

(Doble cinturón de limpieza `animationend` + `setTimeout`, igual que `burst`.)

- [ ] **Step 2: Verificar en el navegador**

Recargar `http://localhost:3000`. En la consola del navegador (o vía `javascript_tool`):

```js
FX.bloom(window.innerWidth / 2, window.innerHeight / 2);
document.querySelectorAll(".fx-bloom").length
```
Expected: `1` inmediatamente después de llamar.

```js
setTimeout(() => console.log("blooms:", document.querySelectorAll(".fx-bloom").length), 1400);
```
Expected: `blooms: 0` (se autodestruyó).

- [ ] **Step 3: Commit**

```bash
git add app/web/fx.js
git commit -m "feat: FX.bloom, la mancha de luz que se derrama desde el tap"
```

---

### Task 3: Primitiva usePhase en AppShell.jsx

**Files:**
- Modify: `app/web/screens/AppShell.jsx` (función nueva + export en el `Object.assign` final)

**Interfaces:**
- Consumes: `window.FX.reducedMotion` (script `fx.js` carga antes que `AppShell.jsx` en `index.html`).
- Produces: `usePhase(value, outMs)` → `{ shown, phase }` con `phase ∈ "in" | "out"`. Contrato (spec §4): cambio de `value` retiene `shown` en fase `"out"` durante `outMs` y luego intercambia con fase `"in"`; entrada desde `shown == null` es instantánea; re-entrada al valor mostrado cancela la salida; cambios rápidos reinician el timer hacia el valor más reciente; con `FX.reducedMotion` el intercambio es siempre inmediato. Usada por Tasks 4, 5, 7.

- [ ] **Step 1: Implementar usePhase**

En `app/web/screens/AppShell.jsx`, añadir antes del `Object.assign` final:

```jsx
// Retiene el valor anterior durante la fase de salida para poder animar desmontajes.
// Contrato completo en docs/superpowers/specs/2026-07-13-coreografia-de-gota-design.md §4.
function usePhase(value, outMs) {
  const [shown, setShown] = React.useState(value);
  const [phase, setPhase] = React.useState("in");
  const timer = React.useRef(null);
  const shownRef = React.useRef(value);
  shownRef.current = shown;

  React.useEffect(() => () => clearTimeout(timer.current), []);

  React.useEffect(() => {
    if (value === shownRef.current) {
      clearTimeout(timer.current);
      setPhase("in");
      return;
    }
    if (shownRef.current == null || (window.FX && FX.reducedMotion)) {
      clearTimeout(timer.current);
      setShown(value);
      setPhase("in");
      return;
    }
    setPhase("out");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setShown(value); setPhase("in"); }, outMs);
  }, [value]);

  return { shown, phase };
}
```

- [ ] **Step 2: Exportar en window**

Cambiar la última línea de `AppShell.jsx`:

```jsx
Object.assign(window, { KIcon, ICONS, NavBar, PageFrame, LoadingPanel, ErrorPanel, SoundToggle, usePhase });
```

- [ ] **Step 3: Verificar que compila y se publica**

Recargar `http://localhost:3000` (login si hace falta). En consola:

```js
typeof window.usePhase
```
Expected: `"function"`. Cero errores de Babel/React en consola. (El comportamiento fase a fase se verifica de forma real en la Task 4.)

- [ ] **Step 4: Commit**

```bash
git add app/web/screens/AppShell.jsx
git commit -m "feat: usePhase, primitiva de fases entrada/salida para desmontajes animados"
```

---

### Task 4: FeedbackBand — squash & stretch, evaporación y bead

**Files:**
- Modify: `app/web/screens/LessonScreen.jsx` (solo la función `FeedbackBand`, líneas ~33-51)

**Interfaces:**
- Consumes: `usePhase` (Task 3), clases `anim-drop-in`/`anim-evaporate`/`fx-bead` (Task 1).
- Produces: `FeedbackBand({ result, onContinue, onRetry })` — misma firma; `onContinue` ahora recibe el evento de click (`onContinue(e)`), del que dependen Tasks 5 y 7 para el bloom. La banda se auto-anima: entra cuando `result` pasa de null a objeto, se evapora cuando vuelve a null.

- [ ] **Step 1: Reemplazar FeedbackBand completa**

```jsx
function FeedbackBand({ result, onContinue, onRetry }) {
  const { Button } = KITX;
  const { shown, phase } = usePhase(result, 160);
  if (!shown) return null;
  const ok = shown.correct;
  return (
    <div className={phase === "out" ? "anim-evaporate" : "anim-drop-in"} style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, pointerEvents: phase === "out" ? "none" : "auto" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px 24px" }}>
        <div style={{ position: "relative", borderRadius: "var(--radius-lg)", padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, background: ok ? "rgba(76,199,147,0.14)" : "rgba(230,121,132,0.13)", border: "1px solid " + (ok ? "rgba(76,199,147,0.45)" : "rgba(230,121,132,0.45)"), boxShadow: "var(--shadow-float)" }}>
          <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(28px) saturate(135%)", backdropFilter: "blur(28px) saturate(135%)" }}></span>
          {phase === "in" ? <span aria-hidden className="fx-bead" style={{ top: -4, left: 26 }}></span> : null}
          <strong style={{ color: ok ? "#4CC793" : "#E67984", fontSize: "var(--text-md)", flexShrink: 0 }}>{ok ? "¡Correcto!" : "No exactamente"}</strong>
          <span style={{ flex: 1, color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>{shown.explanation}</span>
          {ok
            ? <Button onClick={onContinue}>Continuar</Button>
            : <Button variant="secondary" onClick={onRetry}>Intentar de nuevo</Button>}
        </div>
      </div>
    </div>
  );
}
```

Puntos que NO deben perderse al reemplazar: todo el contenido lee de `shown` (no de `result`); el blur sigue en el span `aria-hidden` interno (regla del DS: jamás blur sobre un elemento con texto); `pointerEvents: "none"` durante la salida.

- [ ] **Step 2: Verificar E2E en el navegador**

Recargar, entrar con `juan@test.dev` / `secreto1`, abrir cualquier lección, ir a un ejercicio:

1. Responder MAL → la banda entra (clase `anim-drop-in` presente en el DOM; con `javascript_tool`: `document.querySelector(".anim-drop-in") !== null` → `true`) y existe un `.fx-bead`.
2. Click "Intentar de nuevo" → inmediatamente después (`<160ms`) la banda tiene clase `anim-evaporate`; tras ~250ms ya no hay banda en el DOM (`document.querySelectorAll(".anim-evaporate, .anim-drop-in").length` → `0`).
3. Retry rápido: responder mal, click "Intentar de nuevo" y volver a Comprobar de inmediato → la banda nueva entra limpia, sin quedar atascada ni duplicada.

Expected: los tres pasos como se describen, cero errores de consola.

- [ ] **Step 3: Commit**

```bash
git add app/web/screens/LessonScreen.jsx
git commit -m "feat: FeedbackBand entra como gota y se evapora al salir, con bead decorativo"
```

---

### Task 5: LessonScreen — melt entre pasos y bloom hacia la celebración

**Files:**
- Modify: `app/web/screens/LessonScreen.jsx` (función `LessonScreen`)

**Interfaces:**
- Consumes: `usePhase` (Task 3), clases `anim-melt-out`/`anim-melt-in` (Task 1), `FX.bloom` (Task 2), `FeedbackBand` con `onContinue(e)` (Task 4).
- Produces: comportamiento; sin API nueva. `CelebrationScreen` (Task 6) recibe el mismo `data` de siempre.

- [ ] **Step 1: Incorporar usePhase al stepper**

En la función `LessonScreen`, después de la línea `const [panelAnim, setPanelAnim] = React.useState("");` añadir:

```jsx
  const { shown: shownStep, phase: stepPhase } = usePhase(step, 160);
```

Y después del `React.useEffect(load, [lessonId]);` añadir el reset sincronizado con el intercambio:

```jsx
  React.useEffect(() => { setValue(null); setResult(null); }, [shownStep]);
```

- [ ] **Step 2: Derivar el contenido del paso mostrado (no del real)**

Reemplazar la línea `const ex = step > 0 ? exercises[step - 1] : null;` por:

```jsx
  const ex = shownStep > 0 ? exercises[shownStep - 1] : null;
  const meltClass = stepPhase === "out" ? "anim-melt-out" : "anim-melt-in";
```

Reemplazar la condición del render `{step === 0 ? (` por `{shownStep === 0 ? (`.

En la StepBar, reemplazar `current={step + (result && result.correct ? 1 : 0)}` por:

```jsx
current={shownStep + (result && result.correct ? 1 : 0)}
```

(Con el paso real `step` la barra saltaría un segmento de más durante los 160ms del melt-out y retrocedería al intercambiar.)

En el encabezado del ejercicio, reemplazar `Ejercicio {step} de {exercises.length}` por `Ejercicio {shownStep} de {exercises.length}`.

- [ ] **Step 3: Aplicar el melt a las dos ramas del stepper**

Rama teoría — envolver el contenido del GlassPanel en un div con la clase de melt:

```jsx
        <GlassPanel padding="var(--space-7)" radius="var(--radius-xl)" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className={meltClass}>
            <Badge tone="cyan">LECCIÓN {lesson.position.index}</Badge>
            <h1 style={{ margin: "12px 0 10px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>{lesson.title}</h1>
            <ContentBlocks content={lesson.content} />
            <div style={{ marginTop: 20, textAlign: "right" }}>
              <Button size="lg" onClick={() => setStep(1)} iconLeft={<KIcon d={ICONS.play} />}>Continuar</Button>
            </div>
          </div>
        </GlassPanel>
```

Rama ejercicio — el melt va en un wrapper NUEVO y `panelAnim` (pop/shake) se queda en el div existente, anidado dentro. NO componer ambas clases en el mismo div: las dos reglas definen la propiedad `animation` y la que esté después en el CSS ganaría la cascada, matando el pop/shake (riesgo previsto en la spec §8 — esta es la decisión):

```jsx
            <div className={meltClass}>
              <div className={panelAnim}>
                {/* contenido idéntico al actual: encabezado "Ejercicio X de N", prompt, <ExerciseBody key={ex.id} .../>, botón Comprobar */}
              </div>
            </div>
```

- [ ] **Step 4: Bloom al disparar la celebración**

Reemplazar la función `continueNext` completa por:

```jsx
  const continueNext = (e) => {
    if (result.lessonCompleted) {
      let x = e ? e.clientX : 0;
      let y = e ? e.clientY : 0;
      if (!x && !y && e && e.currentTarget && e.currentTarget.getBoundingClientRect) {
        const r = e.currentTarget.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      if (x || y) FX.bloom(x, y);
      setCelebration({ ...result, lessonTitle: lesson.title, courseSubject: lesson.courseSubject, prevProgress: lesson.courseProgress });
      setResult(null);
      return;
    }
    if (step >= exercises.length) {
      onBack();
      return;
    }
    setStep(step + 1);
  };
```

Claves: ya NO hace `setValue(null)`/`setResult(null)` al avanzar de paso (eso lo hace el efecto de `shownStep` en el momento del intercambio — así el ejercicio viejo no se vacía durante el melt-out y la banda se evapora justo al intercambiar). El fallback de teclado (`clientX/Y` en 0) usa el centro del botón; si no hay evento, se omite el bloom — jamás el centro de la pantalla.

- [ ] **Step 5: Verificar E2E**

Recargar y entrar a una lección NO completada:

1. Teoría → "Continuar": el contenido de teoría se funde (`anim-melt-out` en DOM durante ~160ms) y el ejercicio 1 recristaliza (`anim-melt-in`).
2. Responder bien → "Continuar": melt-out del ejercicio viejo (aún con su respuesta puesta, no vaciado), banda evaporándose al intercambiar, melt-in del nuevo con inputs limpios.
3. Pop y shake siguen funcionando al Comprobar (elementos anidados: `document.querySelector(".anim-melt-in .anim-pop")` existe tras acertar — descendiente, no clase compuesta).
4. Completar la lección entera: al click "Continuar" del último ejercicio aparece un `.fx-bloom` en el DOM y se monta la celebración; countUp de XP y anillo funcionan como antes.
5. Rehacer una lección ya completada: al terminar vuelve al temario sin celebración ni crash (regla de negocio 6).

Expected: todo lo anterior, cero errores de consola.

- [ ] **Step 6: Commit**

```bash
git add app/web/screens/LessonScreen.jsx
git commit -m "feat: melt entre pasos de la leccion y bloom desde el boton hacia la celebracion"
```

---

### Task 6: CelebrationScreen — condensación

**Files:**
- Modify: `app/web/screens/LessonScreen.jsx` (función `CelebrationScreen`)

**Interfaces:**
- Consumes: clases `anim-condense`/`anim-condense--delayed` (Task 1).
- Produces: comportamiento; sin API nueva.

- [ ] **Step 1: Envolver el panel en el wrapper de condensación**

En `CelebrationScreen`, envolver el `<GlassPanel strength="strong" ...>` (el KIT no reenvía `className`, por eso el div propio):

```jsx
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="anim-condense anim-condense--delayed">
          <GlassPanel strength="strong" padding="var(--space-8)" radius="var(--radius-xl)" style={{ width: 460, textAlign: "center" }}>
            {/* contenido idéntico al actual */}
          </GlassPanel>
        </div>
      </div>
```

(Solo se añade el div wrapper con la clase; el contenido del panel no cambia. El delay de 80ms deja que el bloom de la Task 5 se lea primero.)

- [ ] **Step 2: Verificar E2E**

Completar una lección: el panel de celebración entra condensándose (blur → nítido) ~80ms después del bloom; `document.querySelector(".anim-condense")` existe; countUp, "Perfecto +10", racha y anillo intactos.

- [ ] **Step 3: Commit**

```bash
git add app/web/screens/LessonScreen.jsx
git commit -m "feat: la celebracion se condensa de vapor a solido tras el bloom"
```

---

### Task 7: ReviewScreen — melt, bloom final y condensación

**Files:**
- Modify: `app/web/screens/ReviewScreen.jsx`

**Interfaces:**
- Consumes: `usePhase` (Task 3), clases de Task 1, `FX.bloom` (Task 2), `FeedbackBand` migrada (Task 4 — llega gratis, es compartida).
- Produces: comportamiento; sin API nueva.

- [ ] **Step 1: Incorporar usePhase al índice del repaso**

Después de `const xpRef = React.useRef(null);` añadir:

```jsx
  const { shown: shownI, phase: iPhase } = usePhase(i, 160);
```

Después del `React.useEffect(load, []);` añadir:

```jsx
  React.useEffect(() => { setValue(null); setResult(null); }, [shownI]);
```

- [ ] **Step 2: Derivar del índice mostrado**

Reemplazar `const ex = queue[i];` por:

```jsx
  const ex = queue[shownI];
  const meltClass = iPhase === "out" ? "anim-melt-out" : "anim-melt-in";
```

En el encabezado, reemplazar `Repaso · {i + 1} de {queue.length}` por `Repaso · {shownI + 1} de {queue.length}`.

- [ ] **Step 3: Melt en el contenido del panel**

Envolver el contenido del `<GlassPanel tint="none" ...>` (badge, prompt, ExerciseBody, botón) en:

```jsx
          <div className={meltClass}>
            {/* contenido idéntico al actual: fila Badge REPASO + meta, <p> prompt, <ExerciseBody key={ex.id} .../>, botón Comprobar */}
          </div>
```

- [ ] **Step 4: Bloom en el tap final y condensación del cierre**

Reemplazar `continueNext` por:

```jsx
  const continueNext = (e) => {
    if (i + 1 < queue.length) {
      setI(i + 1);
      return;
    }
    let x = e ? e.clientX : 0;
    let y = e ? e.clientY : 0;
    if (!x && !y && e && e.currentTarget && e.currentTarget.getBoundingClientRect) {
      const r = e.currentTarget.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    if (x || y) FX.bloom(x, y);
    setDone(true);
  };
```

(Ya no hace `setValue(null)`/`setResult(null)` — eso lo hace el efecto de `shownI` al intercambiar.)

Y en la rama `if (done)`, envolver el `<GlassPanel strength="strong" ...>` en:

```jsx
        <div className="anim-condense anim-condense--delayed">
          {/* GlassPanel idéntico al actual */}
        </div>
```

- [ ] **Step 5: Verificar E2E**

Necesitas cola de repaso: falla adrede 2-3 ejercicios en una lección, vuelve al dashboard y entra a "Repasar":

1. Entre ejercicios del repaso: melt-out → melt-in, banda evaporándose al intercambiar, inputs limpios en el nuevo.
2. Al acertar el último: bloom desde el botón Continuar y panel "Repaso terminado" condensándose; `+N XP de repaso` con countUp correcto.
3. La banda del repaso entra con squash & stretch y bead (compartida, migrada en Task 4).

Expected: todo lo anterior, cero errores de consola.

- [ ] **Step 6: Commit**

```bash
git add app/web/screens/ReviewScreen.jsx
git commit -m "feat: repaso con melt entre ejercicios, bloom final y cierre condensado"
```

---

### Task 8: Verificación final (tests + checklist E2E + reduced motion)

**Files:**
- Ninguno (solo verificación). Si algo falla, arreglar en el archivo correspondiente y commitear como `fix:`.

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: evidencia de que la spec §7 se cumple, lista para el review final de la rama.

- [ ] **Step 1: Tests de backend intactos**

Run: `npm test` (desde `app/`)
Expected: **57/57 pass**. Este plan no tocó `app/server/` ni `app/test/` — cualquier fallo es preexistente o ambiental (diagnosticar antes de seguir).

- [ ] **Step 2: Checklist E2E completo (spec §7)**

En el navegador contra :3000 con `juan@test.dev` / `secreto1`, verificar la lista completa:

1. Banda: entra con squash & stretch (una sola caída, sin doble animación) + bead; se evapora en retry y al avanzar; retry rápido sin banda zombi.
2. Melt teoría→ej1 y entre ejercicios; el viejo no se vacía durante la salida; pop/shake componen bien.
3. Lección completada: bloom desde el botón + celebración condensada + countUp/anillo intactos.
4. Repaso: melt entre ejercicios; bloom + "Repaso terminado" condensado; XP correcto.
5. Rehacer lección completada: sin celebración ni crash.

- [ ] **Step 3: Reduced motion (doble cinturón)**

Cinturón JS — en consola del navegador:

```js
FX.reducedMotion = true;
```

Luego responder un ejercicio y continuar: la banda aparece/desaparece al instante (sin fases: `document.querySelector(".anim-evaporate")` nunca aparece), el paso cambia sin melt-out, `FX.bloom` no inyecta nada. Al terminar: `FX.reducedMotion = false;` y recargar.

Cinturón CSS — revisar por código que el bloque `@media (prefers-reduced-motion: reduce)` de `motion.css` cubre las 8 clases nuevas (Task 1 Step 2). Si el navegador de verificación permite emular `prefers-reduced-motion`, comprobar en vivo; si no, la revisión de código basta y se anota.

- [ ] **Step 4: Anotar verificación humana pendiente**

Añadir al ledger `.superpowers/sdd/progress.md`: el "feel" de squash/bloom/melt requiere mirada humana en un navegador en primer plano (el tooling no ve rAF/animaciones en background) — mismo caveat aceptado que en la iteración anterior.

- [ ] **Step 5: Commit final (si hubo fixes)**

```bash
git add -A
git commit -m "fix: ajustes de la verificacion final de la coreografia de gota"
```

(Solo si los pasos anteriores produjeron cambios.)
