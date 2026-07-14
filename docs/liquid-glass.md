# Liquid Glass — el lenguaje de diseño de Coding

> La física y el vocabulario detrás de la estética de Coding, adaptados a nuestra marca y a nuestro stack. Complementa (no reemplaza) a `Coding Design System/`, que sigue siendo la fuente de verdad visual e **intocable**. Todo lo que este documento describe y aún no exista se implementa en la capa de la app (`app/web/`), nunca dentro del DS.

**Cómo leer este documento:** las secciones 1–2 explican la física del material que el DS ya trae. Las secciones 3–8 definen el vocabulario dinámico (cursor, ripple, coreografía) que extiende ese material — parte ya existe en `motion.css`/`fx.js`, parte es especificación para trabajo futuro. Las secciones 9–10 son la disciplina y el orden de adopción.

---

## 1. La idea madre

Todo el sistema descansa en una sola decisión de arquitectura: **JavaScript nunca dibuja nada; solo escribe variables CSS. CSS decide qué significan.**

El JS mide el cursor y publica 5 números en el elemento:

| Variable | Significado | Default (reposo) |
|---|---|---|
| `--mx`, `--my` | posición del cursor sobre la superficie, en % | `74%`, `18%` |
| `--rx`, `--ry` | inclinación del panel, en grados | `0deg` |
| `--glow-intensity` | brillo especular, 0→1 | `0` |

Los estilos consumen esas variables en gradientes y transforms. Tres regalos:

1. **Desacople** — cambias el look sin tocar el JS, y viceversa.
2. **Suavizado gratis** — CSS tiene `transition` sobre esas propiedades, así que el movimiento queda amortiguado sin motor de física.
3. **Composición** — cualquier superficie que quiera "sentir" el cursor solo necesita el hook + leer las variables.

Los defaults importan: sin cursor, la luz "vive" arriba a la derecha (`74% 18%`), como una ventana. Nunca `50%/50%` — centrado se ve artificial.

Este es el mismo patrón que ya usamos en `fx.js` (`--dx`/`--dy` de las chispas): JS publica números, `motion.css` los anima. El lenguaje entero es esa idea, generalizada.

---

## 2. El material: vidrio sobre aurora oscura

En CSS no existe refracción real. El truco es descomponer lo que el ojo interpreta como vidrio en fenómenos separados y fingir cada uno con una capa. **Nuestro vidrio es oscuro**: se apoya en blancos translúcidos muy bajos (7–22%) sobre el fondo aurora — los valores de glassmorphism claro (blancos al 40%+) no aplican aquí.

Las capas, de atrás hacia adelante, y qué token del DS las cubre:

**Capa 1 — El desenfoque del fondo.** `backdrop-filter: blur(var(--blur-md)) saturate(var(--saturate-glass))` (+ pareja `-webkit-`). El secreto es el `saturate(135%)`: el vidrio real no solo difumina, concentra y aviva el color que lo atraviesa. Sin él, el panel se ve lechoso y muerto. Nuestros charcos aurora de fondo son justo lo que este filtro necesita para lucir.

**Capa 2 — El cuerpo del vidrio.** `--glass-bg` (blanco al 11%) es el material base; `--glass-bg-subtle/strong/pressed` son sus densidades. Los tintes por materia (`--glass-tint-blue/cyan/violet`) tiñen la masa sin cambiar la física.

**Capa 3 — La refracción desigual** (extensión, capa app). Un gradiente diagonal con opacidades alternadas simula densidad variable del vidrio. Adaptado a vidrio oscuro:

```css
--lg-refraction: linear-gradient(118deg,
  rgba(255, 255, 255, 0.10),
  rgba(255, 255, 255, 0.02) 34%,
  rgba(226, 236, 255, 0.05) 64%,
  rgba(255, 255, 255, 0.07));
```

El ángulo 118° es deliberado: fuera de los 45/90° obvios. Los ángulos "raros" leen como luz natural; los perfectos, como plástico digital.

**Capa 4 — El brillo especular que sigue al cursor** (extensión, capa app; la joya del sistema). El DS trae `--specular` estático (sheen superior). La versión viva es un radial anclado a las variables del cursor:

```css
--lg-highlight: radial-gradient(
  circle at var(--mx, 74%) var(--my, 18%),
  rgba(255, 255, 255, 0.14),
  rgba(255, 255, 255, 0.04) 28%,
  transparent 58%);
```

Sobre vidrio oscuro el centro va al 12–16%, no al 80% del tema claro — más y el panel "quema". El glow de hover va en un `::after` con dos propiedades críticas:

```css
.lg-surface::after {
  background: radial-gradient(circle at var(--mx, 74%) var(--my, 18%),
    rgba(255, 255, 255, 0.10), transparent 55%);
  opacity: var(--glow-intensity, 0);  /* el JS la sube a 1 en hover */
  mix-blend-mode: screen;             /* la luz SUMA, nunca oscurece */
  transition: opacity var(--duration-fast) var(--ease-glass);
}
```

`screen` es la elección física correcta: un reflejo añade luz, jamás resta. Para superficies con tono de materia, el glow puede teñirse con el acento (`rgba` de `--accent-blue/cyan/violet/amber` a opacidad ~0.08–0.12) — la luz de Coding es aurora, no solo blanca.

**Capa 5 — El canto del vidrio** (extensión, capa app). El borde de un vidrio real es más brillante que su cara. El DS ya aproxima esto con `--refraction-edge` (biseles inset asimétricos: 45% arriba, 13% lados, 9% abajo) — suficiente para el 90% de superficies. Para superficies héroe (celebración, tarjetas de logro del meta-juego) existe el upgrade: borde degradado real con `mask-composite`:

```css
.lg-edge::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1px;                        /* grosor del anillo */
  background:
    linear-gradient(90deg, transparent, rgba(255,255,255,0.55) 28%, transparent 58%) top / 100% 1px no-repeat,
    linear-gradient(180deg, rgba(255,255,255,0.45), transparent 42%, rgba(255,255,255,0.10)) left / 1px 100% no-repeat,
    linear-gradient(145deg, rgba(255,255,255,0.30), rgba(255,255,255,0.03));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

La magia: dos máscaras (content-box, 1px más pequeña por el padding, y una completa) restadas con `exclude` — el gradiente solo se ve en el anillo de 1px, respetando el `border-radius`. La luz del borde es asimétrica: máxima arriba-izquierda (de donde viene la luz), tenue abajo-derecha.

**Capa 6 — El grosor.** Los biseles de `--refraction-edge` + las sombras de profundidad (`--shadow-rest/glass/float`: suaves, grandes, frías — elevación ambiental, nunca sombra dura de caja). Para masa interior en superficies grandes, una niebla inset tenue: `inset 0 0 22px rgba(255,255,255,0.04)`.

**El esqueleto que sostiene las capas:**

```css
.lg-surface {
  position: relative;
  isolation: isolate;   /* el blend-mode del glow no se escapa al resto de la página */
  overflow: hidden;
}
.lg-surface > *       { position: relative; z-index: 3; }  /* contenido arriba */
.lg-surface::before   { z-index: 2; }                      /* canto */
.lg-surface::after    { z-index: 1; }                      /* glow del cursor */
```

`isolation: isolate` es fácil de olvidar y crítico: sin él, `mix-blend-mode: screen` compone contra lo que haya debajo en la página.

**Reglas de la casa que estas capas deben respetar siempre:**

- `backdrop-filter` JAMÁS en un elemento que contenga texto — va en una capa `<span aria-hidden>` absoluta con `zIndex: -1` (el patrón de FeedbackBand).
- `GlassPanel`/`Card` del KIT no reenvían `className` y envuelven children en un div interno: los efectos se aplican en un **wrapper propio** dentro o fuera del componente, nunca esperando que el KIT propague clases.
- Las variantes se hacen re-declarando variables (`--lg-*`), nunca duplicando reglas: la clase base define la física, las variantes solo ajustan constantes.

---

## 3. El cursor como fuente de luz

La contraparte JS del sistema. En nuestro stack sin build es un módulo global estilo `fx.js` — `window.Liquid` — que expone `Liquid.pointer(el, opts)` y devuelve una función de limpieza (encaja directo con el patrón `useEffect` de desmontaje que ya usamos):

```jsx
const ref = React.useRef(null);
React.useEffect(() => window.Liquid.pointer(ref.current, { tilt: 4 }), []);
```

Anatomía obligatoria del módulo:

**a) El gate de entrada.** Dos condiciones, ambas obligatorias:

```js
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const enabled = !reducedMotion && finePointer;
```

Si el usuario pidió menos movimiento, el efecto no existe; si el dispositivo es táctil, tampoco (no hay cursor que seguir y el tilt se sentiría roto). Coding ya es tap-based en sus ejercicios: en táctil el vidrio simplemente queda en reposo, perfecto.

**b) Coalescencia con requestAnimationFrame.** `pointermove` puede disparar 250 veces/segundo; la pantalla pinta 60–120. Guardar solo el último evento + un único rAF pendiente = máximo una escritura de estilos por frame:

```js
onPointerMove(e) { this.last = e; this.schedule(); }
schedule() {
  if (this.rafId) return;
  this.rafId = requestAnimationFrame(() => { this.rafId = 0; this.write(); });
}
```

Jamás escribir estilos directo en el handler: tiembla y quema CPU.

**c) La trigonometría del tilt:**

```js
const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
const strength = Math.min(Math.abs(opts.tilt ?? 4), 6);  // techo duro: 6°
const rx = (y - 0.5) * -strength;  // cursor abajo → el panel se inclina hacia ti
const ry = (x - 0.5) *  strength;
```

Tres decisiones finas: normalizar a 0..1 hace el efecto independiente del tamaño; el signo negativo en `rx` hace que el panel "mire" al cursor (invertido, huye y se siente repelente); el clamp a 6° — más y el texto se distorsiona y el efecto pasa de "material que responde" a gimmick. **La sutileza ES el lujo.**

**d) El glow con retardo de intención.** El brillo no se enciende al entrar: espera **90ms**. Si el cursor solo cruza la tarjeta camino a otra cosa, no hay destello; solo si se queda se enciende la luz. En una grilla de tarjetas del dashboard, esta diferencia es enorme.

**e) El reset elegante.** Al salir (`pointerleave`): cancelar el rAF, limpiar el timer, recentrar las variables (`--mx: 74%`, `--my: 18%`, `--rx/--ry: 0deg`, `--glow-intensity: 0`). No animar nada por JS — las `transition` de CSS devuelven el panel a reposo solas. Y accesibilidad de foco: `focusin` (teclado) enciende el glow a `0.82` sin cursor; `focusout` lo apaga.

**El tilt en CSS**, donde las variables cobran vida:

```css
.lg-tilt {
  transform:
    perspective(900px)            /* sin esto no hay 3D, solo skew feo */
    rotateX(var(--rx, 0deg))
    rotateY(var(--ry, 0deg))
    translateY(var(--lift, 0px));
  transform-style: preserve-3d;
  transition: transform 220ms var(--ease-glass);
  will-change: transform;
}
.lg-tilt:hover {
  --lift: -4px;                          /* el panel SE ELEVA hacia la luz */
  box-shadow: var(--shadow-float);       /* y su sombra se hunde */
}
```

Claves: `perspective(900px)` va dentro del transform del propio elemento (cada tarjeta tiene su punto de fuga; menos de 900 exagera, más de 1500 aplana). La inercia es la `transition`: el rAF escribe valores instantáneos pero el panel siempre persigue al cursor con retardo amortiguado — eso se siente como "vidrio pesado", no "sticker pegado al mouse". Y el hover compone elevación + sombra a la vez: subir + sombra más profunda = "el objeto se acercó a mí". **La luz y la profundidad siempre cuentan la misma historia.**

---

## 4. El ripple: la gota de agua al click

Complementa (no reemplaza) al `FX.burst` de chispas: el burst celebra aciertos, el ripple responde a cualquier tap sobre vidrio. Algoritmo:

```js
// 1. Punto exacto del click, relativo al elemento
const x = e.clientX - rect.left;
const y = e.clientY - rect.top;
// 2. Radio = distancia a la ESQUINA MÁS LEJANA (Pitágoras)
const dx = Math.max(x, rect.width - x);
const dy = Math.max(y, rect.height - y);
const diameter = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 2);
// 3. Inyectar un <span> circular centrado en el click
// 4. Autodestrucción SIN timers:
wave.addEventListener("animationend", () => wave.remove(), { once: true });
```

Por qué cada paso importa: el Pitágoras garantiza que la onda cubra el elemento completo hagas click donde hagas click; la onda nace **donde tocaste**, no en el centro (eso la hace "agua" y no "flash"); limpieza por `animationend` y no por `setTimeout` (mismo patrón que ya usan las chispas de `fx.js` — sin spans zombies).

La curva codifica la física de una onda real:

```css
.lg-ripple-wave {
  position: absolute; border-radius: 50%;
  background: rgba(255, 255, 255, 0.10);   /* sobre vidrio oscuro, tenue */
  transform: scale(0);
  animation: lg-ripple 600ms var(--ease-out) forwards;
  pointer-events: none;
  will-change: transform, opacity;
}
@keyframes lg-ripple {
  0%   { transform: scale(0); opacity: 1; }
  60%  { opacity: 0.62; }     /* aún visible a mitad de viaje */
  100% { transform: scale(1); opacity: 0; }  /* muere justo al llegar */
}
```

`--ease-out` (nuestro expo-out) es la elección correcta: arranque violento, frenado larguísimo — el impacto tiene toda la energía y se disipa. La opacidad aguanta (0.62 al 60%) y muere al final: la onda pierde energía mientras viaja. Contrato del host: `position: relative; overflow: hidden`.

---

## 5. El vocabulario de movimiento

Los tokens del DS son la base — no se inventan curvas nuevas por pantalla:

| Token | Valor | Rol |
|---|---|---|
| `--ease-glass` | `cubic-bezier(0.22, 1, 0.36, 1)` | deslizamiento estándar: tilt, hovers, transiciones de estado |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | expo-out: reveals, ripples, ondas |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | rebote fuerte: botones, chips, el pop del orbe |
| `--duration-fast` | `160ms` | micro-feedback: glow, hover de iconos |
| `--duration-base` | `320ms` | transiciones de estado: pantallas, botones, feedback |
| `--duration-slow` | `640ms` | narrativa: reveals, ondas, celebraciones |

La clave del spring está en su cuarto número: `1.56 > 1` significa que la curva **se pasa del destino y regresa** — rebote sin JS. Regla de uso: **rebote solo en cosas pequeñas y táctiles** (botones, chips, el orbe); nunca en paneles grandes — un panel de 800px rebotando marea. Si algún día hace falta un rebote suave para elementos medianos, se declara en la capa app (`--lg-ease-spring-soft: cubic-bezier(0.18, 0.89, 0.32, 1.18)`), no se toca el DS.

Y la regla de oro del rendimiento: **solo se animan `transform`, `opacity` y `filter`** (compositor/GPU). Jamás `top/left/width/height/margin` (layout/CPU). Todo keyframe de `motion.css` ya la cumple; todo keyframe nuevo debe cumplirla.

---

## 6. Coreografía de scroll: elementos que se condensan

Para listas largas (temario de un curso, grilla del dashboard, futuro heatmap del meta-juego). El fade+slide lo tiene todo el mundo; lo que lo vuelve líquido es el **blur inicial**:

```css
.lg-reveal {
  opacity: 0;
  transform: translateY(28px);
  filter: blur(10px);             /* ← LA firma líquida */
  transition:
    opacity   var(--duration-slow) var(--ease-glass) var(--reveal-delay, 0ms),
    transform var(--duration-slow) var(--ease-glass) var(--reveal-delay, 0ms),
    filter    var(--duration-slow) ease              var(--reveal-delay, 0ms);
}
.lg-reveal.is-visible { opacity: 1; transform: none; filter: none; }
```

El elemento no "aparece": **se condensa** — pasa de vapor a sólido. Es la metáfora óptica del vidrio aplicada al tiempo.

El lado JS es un `IntersectionObserver` con dos decisiones finas:

```js
els.forEach((el, i) => {
  el.style.setProperty("--reveal-delay", Math.min(i * 55, 330) + "ms");  // stagger CON TECHO
  observer.observe(el);
});
// al intersectar:
entry.target.classList.add("is-visible");
observer.unobserve(entry.target);   // one-shot: no re-anima al re-scrollear
```

- Stagger de 55ms con techo en 330ms: los primeros ~6 elementos entran en cascada; del séptimo en adelante entran juntos. Sin el techo, una grilla de 20 tarjetas tarda más de un segundo y la página se percibe lenta.
- `unobserve` tras el primer disparo: los reveals son ceremonia de primera vez; repetirlos en cada scroll cansa.
- Con `prefers-reduced-motion` o sin `IntersectionObserver`: se añade `is-visible` directo — el contenido nunca queda oculto.

---

## 7. La coreografía de gota: squash, bead, bloom, melt

Aquí el sistema deja de ser "glassmorphism" y se vuelve **liquid** glass. El patrón general:

> **Toda entrada es una gota que cae (squash → overshoot → settle). Toda salida es evaporación (fade + blur + scale down). Nada aparece o desaparece en seco.** Cuando dudes de cómo animar algo nuevo, pregúntate: ¿qué haría un líquido?

Los cuatro comportamientos, con su lugar natural en Coding:

**Squash & stretch (tensión superficial)** — el principio nº1 de Disney aplicado a UI:

```css
@keyframes lg-drop-in {
  0%   { transform: translateY(22px) scaleY(1.18) scaleX(0.96); opacity: 0; }
  58%  { transform: translateY(-3px) scaleY(0.97) scaleX(1.04); opacity: 1; }
  100% { transform: none; }
}
```

Una gota que se mueve se deforma en el eje del movimiento (scale > 1 en el eje, < 1 en el perpendicular), al frenar **se pasa del destino** y rebota comprimida al revés, y recién entonces reposa. Las escalas X e Y son siempre inversas — conservación de volumen, lo que el ojo lee como "materia blanda" en vez de "PNG deslizándose". Candidato natural: la entrada de FeedbackBand (hoy `anim-rise`) y los toasts de logro del meta-juego.

**Bead (la gotita que se desprende)** — un elemento decorativo pequeño que acompaña la entrada del panel grande y se encoge hasta desaparecer (`opacity 0.72→0, scale 1.15→0.42`). Acción secundaria pura: nadie lo mira directamente, pero vende la ilusión. Candidato: una chispa que acompañe la tarjeta de repaso al aparecer.

**Bloom (el líquido que se derrama)** — una mancha radial que crece desde el punto de interacción **ganando blur mientras se expande** (`scale 0.18→1.38, blur 0→1.5px`): un líquido pierde el borde definido al esparcirse. Misma familia que el ripple, pero difuminado porque es un cambio de ambiente, no un impacto. Candidato: la transición a CelebrationScreen, derramándose desde el último ejercicio acertado.

**Melt (transición por desenfoque)** — en vez de cortar entre estado A y B, el elemento se funde (`blur 0→5px→0`), cambia por dentro y recristaliza. Candidato: el cambio de contenido del stepper de lección entre ejercicio y ejercicio.

Todos usan solo `transform`, `opacity` y `filter`, así que entran directo a `motion.css` sin romper la regla de oro.

---

## 8. La textura: por qué no se ve plano digital

Dos capas de ambiente, y la primera ya la tenemos: **`--aurora-page`** son 3 radial-gradients enormes y suavísimos en puntos no simétricos (12% 8%, 88% 18%, 78% 92%) sobre el degradado `#0A0F1E → #05070F` — charcos de luz ambiental en blue/violet/cyan. Esto importa para el vidrio por una razón que se pasa por alto: `backdrop-filter` solo luce si hay algo interesante detrás que difuminar. **El fondo es la mitad del efecto.** Un panel de vidrio sobre fondo liso = nada.

La segunda capa es una extensión disponible: **ruido fractal inline** (SVG con `feTurbulence`, cero peticiones HTTP) apilado como última capa del fondo, a ~3–4% de opacidad efectiva. Los gradientes puros producen banding (franjas visibles) y una lisura irreal; el grano lo rompe y da tacto de mineral. No se ve conscientemente; se nota si lo quitas:

```css
.lg-noise {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.74' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
}
```

---

## 9. La disciplina (lo que hace que no se caiga a pedazos)

Checklist obligatorio para todo efecto nuevo — varios puntos ya son higiene establecida del proyecto:

1. **Reduced motion en TODOS los niveles**: el JS se auto-desactiva (`matchMedia`, como `FX.reducedMotion`) y el CSS tiene su bloque `@media (prefers-reduced-motion: reduce)` (como el de `motion.css`). Doble cinturón.
2. **Capacidad de puntero**: efectos de cursor solo bajo `(hover: hover) and (pointer: fine)`. En táctil, el tilt no existe y no debe existir.
3. **Una escritura por frame**: rAF coalescido; jamás escribir estilos directo en el handler de `pointermove`.
4. **`will-change` solo donde hay animación activa** (`transform`, `opacity`) — es una reserva de memoria GPU, no un amuleto para todo.
5. **Limpieza obsesiva**: `cancelAnimationFrame` + `clearTimeout` en la función de cleanup (nuestro patrón de refs + `useEffect` de desmontaje), `unobserve` tras revelar, `animationend` para autodestruir ripples y chispas.
6. **Solo propiedades de compositor** en animaciones: `transform`/`opacity`/`filter`.
7. **`isolation: isolate`** en cada superficie con blend-modes.
8. **Los pseudo-elementos hacen el trabajo decorativo** (`::before` canto, `::after` glow): el DOM real no se ensucia y el contenido queda limpio en `z-index: 3`. Donde el KIT no dé acceso a pseudo-elementos, un `<span aria-hidden>` absoluto cumple el mismo rol (patrón FeedbackBand).
9. **`-webkit-backdrop-filter` siempre en pareja** con `backdrop-filter`, y una base `rgba` decente como fallback.
10. **Bordes con longhands** si algún lado varía (regla ya establecida — evita el warning de React).

Y el criterio estético que gobierna todos los números de este documento: **cada valor está justo debajo del umbral donde se volvería notorio como "efecto"**. 6° de tilt y no 15. Glow a 90ms y no instantáneo. Ruido al 3% y no al 10. Rebote solo en piezas pequeñas. El liquid glass funciona porque ninguna pieza pide atención individual — todas juntas construyen la sensación de material.

---

## 10. Adopción en Coding

Dónde vive cada cosa cuando se implemente (vía flujo superpowers, como todo trabajo no trivial):

- **CSS nuevo** → `app/web/motion.css` (keyframes de gota, reveal, ripple) o un `app/web/liquid.css` propio si crece (cargado en `index.html` junto a `motion.css`).
- **JS nuevo** → `app/web/liquid.js` exponiendo `window.Liquid` (`Liquid.pointer(el, opts)`, `Liquid.ripple(el)`, `Liquid.reveal(container)`), cargado junto a `fx.js`. Cada función devuelve cleanup para el `useEffect` de desmontaje.
- **`Coding Design System/` no se toca.** Los tokens `--lg-*` de este documento son de la capa app y leen de los del DS.

Orden de adopción incremental (cada paso es útil por sí solo):

1. **Coreografía de gota** en lo que ya existe: FeedbackBand entra con squash & stretch, el stepper cambia de ejercicio con melt, la celebración abre con bloom. Solo CSS, riesgo mínimo, sube la sensación de líquido de inmediato.
2. **Ripple** en botones y opciones de ejercicio (tap-based: es nuestro feedback táctil natural).
3. **`Liquid.pointer`** (tilt + glow) en las tarjetas del dashboard y del catálogo — el paso que hace que el vidrio "sienta" al usuario. Gates primero, siempre.
4. **Reveal con blur** en temarios y grillas; **ruido fractal** sobre la aurora.
5. El **canto con mask-composite** reservado para superficies héroe del meta-juego (logros, niveles).

El meta-juego (sub-proyecto 2) debería nacer ya hablando este lenguaje: sus toasts de logro son gotas que caen, su heatmap se revela condensándose, sus insignias tienen canto de vidrio real.
