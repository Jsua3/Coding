# El cursor como fuente de luz — Diseño

> Paso 3 del orden de adopción de `docs/liquid-glass.md` (§3 y §10). Cierra el último gran gesto del lenguaje visual que aún no está en la app: que cada superficie de vidrio sepa dónde está el cursor y se comporte como si ahí hubiera una luz.

## 1. Objetivo

Dar a las tarjetas de Inicio y del catálogo de Materias dos gestos que trabajan juntos:

1. **Brillo especular que sigue al cursor** — una luz radial, teñida del acento de la tarjeta, que nace donde está el puntero y **suma** luz (nunca oscurece).
2. **Tilt 3D** — la tarjeta se inclina hacia el cursor (máximo 6°) y se eleva al fijarte.

El *feel* ya se validó con el usuario en un demo interactivo; los números de este spec son los de ese demo (el brillo se suavizó a petición suya).

## 2. Alcance (superficies)

**Reciben el efecto (envueltas en `TiltCard`):**

- **Inicio**: la tarjeta de **meta diaria** (`MetaDiaria`), los **3 paneles de stats** (`StatPanel`: Nivel/Racha/XP), y **"Estás cerca de…"** (`CercaDeCaer`).
- **Materias**: las **tarjetas de curso** activas (`CourseCard`).

**Quedan planas, a propósito:**

- Las **tarjetas de curso bloqueadas** (`status === "BLOQUEADO"`, atenuadas al 55%, no interactivas): inclinar algo deshabilitado se siente roto.
- Los **banners de alerta** de Inicio (racha rota, repaso pendiente): ya llaman la atención con su borde ámbar; un tilt competiría con ese trabajo. El efecto es para el mobiliario que exploras, no para las notificaciones.

Fuera de alcance de esta iteración: Curso, Progreso, Perfil, la lección y la navbar. Se pueden sumar después envolviendo tarjetas con el mismo `TiltCard`; no requieren cambios en el módulo.

## 3. Arquitectura (3 piezas, cada una con una responsabilidad)

### 3.1 `Liquid.pointer(el, opts)` — capa DOM pura (en `app/web/liquid.js`)

Función de **un solo elemento**, con la firma de §3, que devuelve su función de limpieza (como `ripple`/`reveal`). No anima nada por JS: solo escribe variables CSS que el CSS consume.

```js
// opts: { tilt?: number }  (grados; default 4, tope duro 6)
pointer(el, opts = {}) {
  if (!el) return () => {};
  const strength = Math.min(Math.abs(opts.tilt ?? 4), 6);       // tope duro: 6°
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const enabled = !(window.FX && FX.reducedMotion) && finePointer;
  if (!enabled) return () => {};                                 // táctil / reduced motion → reposo

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
    el.style.setProperty("--ry", ((x - 0.5) *  strength).toFixed(2) + "deg");
  };
  const schedule = () => { if (!rafId) rafId = requestAnimationFrame(write); };

  const onMove  = (e) => { last = e; schedule(); };
  const onEnter = () => { clearTimeout(glowTimer); glowTimer = setTimeout(() => el.style.setProperty("--glow", "1"), 90); };
  const onLeave = () => {
    clearTimeout(glowTimer);
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    last = null;
    el.style.setProperty("--mx", "74%"); el.style.setProperty("--my", "18%");
    el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glow", "0");
  };
  const onFocusIn  = () => el.style.setProperty("--glow", "0.7");   // teclado: luz sin cursor
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
}
```

`clamp` es un helper local (`(v,a,b) => v<a?a:v>b?b:v`). La coalescencia con un único `requestAnimationFrame` garantiza **máximo una escritura de estilos por frame** aunque `pointermove` dispare 250 veces/segundo.

### 3.2 CSS: `.lg-tilt` + la capa de brillo (en `app/web/liquid.css`)

```css
.lg-tilt {
  position: relative;
  border-radius: var(--radius-lg);              /* igual que la tarjeta que envuelve */
  transform:
    perspective(900px)
    rotateX(var(--rx, 0deg))
    rotateY(var(--ry, 0deg))
    translateY(var(--lift, 0px));
  transform-style: preserve-3d;
  transition: transform 240ms var(--ease-glass);
  will-change: transform;
}
.lg-tilt:hover, .lg-tilt:focus-within { --lift: -6px; }

/* La luz que sigue al cursor. Suma (screen), nunca oscurece. */
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
/* Sin data-accent (tono neutro): hereda el blanco puro del default. */
```

> `--ease-glass` (= `cubic-bezier(0.22, 1, 0.36, 1)`) y `--radius-lg` son tokens reales del proyecto (ya se usan en `motion.css`). Lo único a verificar en la implementación: que el radio de `.lg-tilt` **iguale el de la tarjeta del DS que envuelve** para que el brillo recorte por sus esquinas (`--radius-lg` es lo más probable; si el componente usa otro, se usa ese).

**Segundo cinturón (reduced motion)**, en el bloque `@media (prefers-reduced-motion: reduce)` que **debe seguir siendo el último** de `liquid.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .lg-tilt { transform: none; transition: none; }
  .lg-tilt::after { display: none; }
}
```

### 3.3 Componente `TiltCard` (React, sin build)

Envoltorio con su `ref` + `useEffect`, exactamente como `RippleSurface` en `screens/exercises.jsx`. Lleva `.lg-tilt` en su `<div>` (resuelve la regla de que los componentes del DS **no reenvían `className`**) y el `data-accent`.

```jsx
function TiltCard({ accent, tilt, children }) {
  const ref = React.useRef(null);
  React.useEffect(() => Liquid.pointer(ref.current, { tilt: tilt ?? 5 }), []);
  return React.createElement(
    "div",
    { ref, className: "lg-tilt", "data-accent": accent || undefined },
    children
  );
}
Object.assign(window, { TiltCard });
```

Se registra en `index.html` **después** de `liquid.js` y **antes** de las pantallas que lo usan (el orden de `<script>` es la resolución de dependencias).

**Mapeo de `accent` por tarjeta** (sin ambigüedad):

| Tarjeta | `accent` |
|---|---|
| `MetaDiaria` | `cyan` |
| `StatPanel` Nivel | `violet` |
| `StatPanel` Racha | *(sin acento → brillo blanco)* |
| `StatPanel` XP | `blue` |
| `CercaDeCaer` | *(sin acento → brillo blanco)* |
| `CourseCard` | `course.subjectTone` (`blue`/`cyan`/`violet`/`amber`) |

Nota: la `CourseCard` pasa el **tono real de la materia**, incluido `amber`, aunque su tinte del DS se neutralice para la barra de progreso. El brillo puede cargar la aurora ámbar que el `Progress` no puede.

### 3.4 Convivencia con `reveal` — la restricción clave

`reveal` (condensación de entrada) y el tilt (inclinación en vivo) **escriben ambos `transform`**; en el mismo elemento se pisarían. Por eso `TiltCard` va **dentro** del `<div className="lg-reveal">` que ya existe:

```jsx
<div className="lg-reveal">
  <TiltCard accent="cyan">
    <MetaDiaria … />
  </TiltCard>
</div>
```

El de fuera se condensa una vez al entrar; el de dentro sigue al cursor. Dos capas, dos responsabilidades.

## 4. Calibración (los números)

| Parámetro | Valor | Nota |
|---|---|---|
| Fuerza del tilt | `5°` | tope duro `6°` (`Math.min(abs(tilt), 6)`) |
| Perspectiva | `900px` | por tarjeta (dentro del `transform`) |
| Elevación al fijarte | `−6px` | en `:hover`/`:focus-within` |
| Radio del brillo | `300px` | círculo anclado a `--mx/--my` |
| Núcleo del brillo | `rgba(255,255,255,0.10)` → `0.028` @26% → transparente @54% | blanco base |
| Tinte por acento | blue/violet `0.20`, cyan `0.17`, amber `0.18` | neutro = blanco puro |
| Pico de brillo | `--glow: 1` (ratón), `0.70` (foco) | |
| Reposo de la luz | `--mx: 74%`, `--my: 18%` | como una ventana; nunca centrada |
| Retardo de intención | `90 ms` | cruzar de paso no enciende |
| `transition` transform | `240 ms` | `--ease-glass` |
| `transition` brillo | `200 ms` | `--ease-glass` |

## 5. Gates y accesibilidad

- **Doble puerta obligatoria (ambas):** `FX.reducedMotion` (fuente única del proyecto, igual que `ripple`) **y** `matchMedia("(hover: hover) and (pointer: fine)")`. Si falla cualquiera, `Liquid.pointer` no engancha nada y devuelve un cleanup vacío: en táctil o con menos-movimiento el vidrio queda en reposo, sin variables escritas.
- **Segundo cinturón en CSS:** el `@media (prefers-reduced-motion: reduce)` neutraliza `.lg-tilt` y oculta su brillo (doble cinturón, como el resto del proyecto).
- **Teclado:** en tarjetas enfocables (las de curso), `focusin` enciende el brillo a `0.70` sin cursor; `focusout` resetea. Los paneles no interactivos solo responden al puntero — no necesitan foco.
- **Higiene:** el cleanup de `useEffect` (= el que devuelve `Liquid.pointer`) quita los cinco listeners, cancela el `rAF` y limpia el timer de 90 ms. `pointerleave` recentra las variables y apaga el brillo. `Liquid.pointer(null)` es no-op.

## 6. Restricciones del proyecto que aplican

- **Sin build:** nada de `import`/`export`; globales por `Object.assign(window, …)`; `React.createElement`/`React.Fragment`; el orden de `<script>` en `index.html` es la resolución de dependencias.
- **El DS es intocable** y **no reenvía `className`** ⇒ la clase `.lg-tilt` va en el `<div>` de `TiltCard`, nunca en un componente del kit.
- **`backdrop-filter` jamás sobre texto:** no se introduce ninguno nuevo; el brillo es un `::after` con `pointer-events: none`, no toca esa regla.
- **Motion:** solo se animan `transform`, `opacity`, `filter`. El tilt anima `transform`; el brillo, `opacity`. Cumple.
- **Copy:** no hay copy nuevo visible.

## 7. Verificación

**Backend:** cero cambios de servidor ⇒ los **137 tests** siguen intactos (se corren una vez para confirmar que la rama no rompió nada). Sin tests nuevos de backend: no hay nada que probar en el servidor.

**Frontend, por contrato** (el tooling congela `rAF`/`IntersectionObserver`, así que se prueba el contrato, no el *feel*):

- **Gates:** con `FX.reducedMotion = true` o puntero grueso, `pointermove` no escribe ninguna variable y no hay listeners activos.
- **Contrato:** con puntero fino, `pointermove` escribe las cinco variables en rango (`--mx/--my` en `%`, `--rx/--ry` con `|valor| ≤ 6°`), y el brillo solo enciende tras los `90 ms` (el `setTimeout` **sí** corre en el panel del tooling, a diferencia de `rAF` — gotcha ya documentado en el prompt maestro).
- **Limpieza:** desmontar el componente quita los handlers y cancela timers/rAF (sin fugas).
- **Reduced motion (CSS):** el `@media` sigue siendo el último bloque de `liquid.css`.

**Pendiente humano (caveat de siempre):** el *feel* real del tilt y del brillo necesita un navegador en **primer plano** — el tooling suspende `rAF` en pestaña de fondo.

## 8. Fuera de alcance decidido

- Aplicar el efecto a Curso, Progreso, Perfil, la lección o la navbar (se puede sumar después sin tocar el módulo).
- Parallax de capas internas de la tarjeta (mover el contenido a distinta profundidad que el marco). Es la evolución natural, pero YAGNI para esta iteración.
- Cambiar el `ripple` o el `reveal` existentes.

## 9. Resumen en una frase

Un módulo DOM puro `Liquid.pointer(el, {tilt})` (gateado por reduced-motion + puntero fino, coalescido a un `rAF` por frame) que publica cinco variables CSS; un `.lg-tilt` que las convierte en inclinación 3D (máx 6°) y en un brillo especular que suma luz siguiendo al cursor; y un `TiltCard` que envuelve las tarjetas de Inicio y Materias sin tocar el design system.
