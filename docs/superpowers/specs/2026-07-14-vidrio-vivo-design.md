# El vidrio vivo — diseño

**Fecha:** 2026-07-14 · **Estado:** aprobado por el usuario
**Contexto:** segunda adopción del lenguaje Liquid Glass (`docs/liquid-glass.md`). La iteración anterior (coreografía de gota, ya en `master`) cubrió las **transiciones**: cómo entran y salen las cosas. Esta cubre el **material**: que el vidrio se comporte como materia — que se parta por tensión superficial, que responda al tacto y que tenga grano.

**Motivación literal del usuario:** la navbar no convencía. Referencia visual: su proyecto "Rebbeca", donde la píldora única de la navbar se divide en tres al hacer scroll, como una gota de agua que se separa sobre el cristal.

---

## 1. Alcance

**Dentro (decidido con el usuario):**

1. **NavBar líquida** — la píldora única se divide en tres (logo · tabs · acciones) al hacer scroll, con cuello que se adelgaza y se rompe; se vuelve a fusionar al subir.
2. **Ripple** — onda de agua desde el punto exacto del tap, en las superficies interactivas cuyo DOM es nuestro.
3. **Textura y reveals** — ruido fractal sobre la aurora; los elementos de las listas se condensan al entrar en pantalla.

**Fuera (explícitamente diferido):**

- **Cursor como fuente de luz** (tilt + glow especular siguiendo el puntero). Es el siguiente paso natural; el usuario lo dejó fuera de esta iteración.
- Canto con `mask-composite` en superficies héroe.
- Backend, `Coding Design System/` (intocable), sonidos nuevos, transiciones del router.

---

## 2. La decisión técnica de la navbar: por qué NO usamos el filtro goo

El truco canónico para que dos formas se fusionen y se separen con cuello líquido es el filtro SVG *goo* (`feGaussianBlur` + `feColorMatrix` que dispara el contraste de alpha). **Lo descartamos** por dos razones que lo hacen incompatible con nuestro material:

1. **Mata el `backdrop-filter`.** Un `filter` en un ancestro cambia el contexto de composición: el vidrio deja de refractar el fondo real de la página. Perderíamos exactamente lo que hace que esto sea Liquid Glass.
2. **Destroza el texto.** El contraste de alpha se come el antialiasing; el logo, las tabs y la racha quedarían con bordes sucios.

El workaround habitual (silueta gooificada detrás + contenido nítido encima) duplica el DOM, arriesga fantasmas de doble capa, y además el goo lee como *materia gelatinosa*, que no es lo mismo que **una gota sobre cristal**.

**Nuestra solución: el cuello es un elemento real.** Igual que el `bead` de la coreografía de gota (acción secundaria: nadie lo mira directamente, pero vende la ilusión), entre píldora y píldora vive un **puente de vidrio `aria-hidden`**. Cuando la navbar se parte, el puente **adelgaza en Y mientras se estira en X** (conservación de volumen — lo que el ojo lee como materia blanda) hasta romperse. Cada píldora conserva su vidrio real, su `backdrop-filter` y su texto nítido.

---

## 3. NavBar líquida

### Estructura (reescritura de `NavBar` en `app/web/screens/AppShell.jsx`)

```jsx
<div className={"lg-nav" + (split ? " lg-nav--split" : "")}>
  <div className="lg-nav__pill lg-nav__pill--logo">    …logo Coding + barra cian… </div>
  <span aria-hidden className="lg-nav__bridge"></span>
  <div className="lg-nav__pill lg-nav__pill--tabs">    …Tabs (Inicio/Materias/Progreso)… </div>
  <span aria-hidden className="lg-nav__bridge"></span>
  <div className="lg-nav__pill lg-nav__pill--actions"> …SoundToggle, búsqueda, racha, avatar… </div>
</div>
```

- `.lg-nav` conserva el comportamiento actual del contenedor: `position: sticky; top: 20px; z-index: 40; display: flex; align-items: center`. Los puentes son `flex: 1` (ocupan el espacio vacío que hoy reparte `justify-content: space-between`).
- Cada `.lg-nav__pill` es una superficie de vidrio idéntica a la navbar de hoy: `background: rgba(16,23,44,0.6)`, `border: 1px solid var(--glass-stroke)`, `box-shadow: var(--refraction-edge), var(--shadow-glass)`, y su **blur en un `<span aria-hidden>` interno absoluto con `zIndex: -1`** (regla de oro del DS: `backdrop-filter` jamás sobre un elemento con texto).
- Cada `.lg-nav__bridge` tiene el mismo `background` y bordes superior/inferior que las píldoras, sin bordes laterales ni radio: es la **masa conectiva**. Su propio blur va en su capa, igual que las píldoras.
- El contenido interno de los tres grupos es **exactamente el de hoy** (mismos componentes, mismos handlers). Solo cambia el envoltorio.

### Los dos estados

**Fusionada** (arriba de la página, estado por defecto):
- Puentes: `scaleY(1)`, opacidad 1 → la masa llena los huecos.
- Píldoras: esquinas **internas rectas**, externas de píldora (logo: solo redondeada a la izquierda; tabs: recta a ambos lados; acciones: solo redondeada a la derecha).
- Resultado: se lee como **una sola superficie continua**, idéntica a la navbar actual.

**Partida** (con scroll):
- Puentes: `transform: scaleY(0) scaleX(1.10)` + `opacity: 0`, vía **transiciones** (no keyframes):
  ```css
  .lg-nav__bridge {
    transform-origin: center;
    transition: transform 420ms var(--ease-glass), opacity 300ms var(--ease-glass) 120ms;
  }
  .lg-nav--split .lg-nav__bridge { transform: scaleY(0) scaleX(1.10); opacity: 0; }
  ```
  El **retardo de 120ms en la opacidad** es la clave física: el cuello se ve **adelgazar y estirarse antes de desvanecerse** — se rompe, no se apaga. `transform-origin: center` hace que adelgace desde arriba y abajo hacia su línea media, como un cuello de líquido real.
- Píldoras: todas las esquinas a `--radius-pill`; las de los extremos se empujan hacia afuera (`translateX ∓10px`) con `--ease-spring` — cuyo cuarto número (`1.56 > 1`) hace que **la curva se pase del destino y regrese**: el rebote de la gota que se separa, sin JS.
- Encima de eso, un keyframe de **squash & stretch** (`nav-pill-split`: estira en X y adelgaza en Y a mitad de viaje, y recupera volumen al asentar — escalas siempre inversas = conservación de volumen).

**Re-fusión** (al volver arriba): las transiciones del puente son **bidireccionales por definición** (el cuello renace desde `scaleY(0)` hasta llenarse, esta vez con la opacidad entrando *antes* que el grosor), y las píldoras vuelven con `nav-pill-merge`, un squash de coalescencia.

**Sin animación en el montaje:** un keyframe colgado de la clase de estado se dispararía al cargar la página. Para evitarlo, `NavBar` distingue tres situaciones — inicial (sin clase, estático), partida (`.lg-nav--split`) y re-fusionada (`.lg-nav--merged`, que **solo se aplica tras la primera partida**, vía un `React.useRef` que recuerda si alguna vez se partió). Los puentes, al ir por transición, no sufren este problema en absoluto.

### Disparador: sin listener de scroll

Hook nuevo `useScrolled(px)` en `AppShell.jsx` (hermano de `usePhase`, publicado en `window`):

- Crea un **centinela** propio: un `<div>` de `position: absolute; top: 0; left: 0; width: 1px; height: <px>; pointer-events: none;` inyectado en `document.body` al montar, retirado al desmontar.
- Lo observa con un **`IntersectionObserver`** (`threshold: 0`). Mientras el centinela es visible → `false` (fusionada). Cuando sale de vista → `true` (partida).
- **Cero trabajo por frame**: no hay handler de `scroll`. Umbral: **32px**.
- Sin `IntersectionObserver` disponible: devuelve siempre `false` (navbar fusionada, degradación segura).
- Limpieza: `disconnect()` + retirar el centinela en el cleanup de desmontaje.

`NavBar` consume: `const split = useScrolled(32);`. No cambia `PageFrame` ni ninguna pantalla.

### Excepción declarada a la regla de oro del rendimiento

El lenguaje manda animar **solo `transform`/`opacity`/`filter`**. Aquí hacemos **una excepción consciente: el `border-radius` de las esquinas internas de las tres píldoras**. Justificación: `border-radius` provoca *repintado*, nunca *layout* (a diferencia de `top/left/width/height/margin`, que sí están prohibidos); son tres elementos pequeños; y la transición ocurre **una vez por cambio de estado de scroll**, no en cada frame. Sin ella, la fusión no puede leerse como una superficie continua. Todo lo demás (puentes, squash de las píldoras, ripple, reveals) respeta la regla estrictamente.

---

## 4. Ripple

`Liquid.ripple(el)` en `app/web/liquid.js`. Al recibir un tap sobre `el`:

1. Punto exacto del click relativo al elemento: `x = e.clientX - rect.left`, `y = e.clientY - rect.top`.
2. Radio = **distancia a la esquina más lejana** (Pitágoras): `d = ceil(sqrt(max(x, w-x)² + max(y, h-y)²) * 2)`. Garantiza que la onda cubra el elemento entero sin importar dónde toques (un diámetro fijo dejaría esquinas secas).
3. Inyecta un `<span class="lg-ripple">` circular de diámetro `d`, centrado en el tap, dentro de `el`.
4. **Se autodestruye por `animationend`** (+ `setTimeout` de seguridad a 1200ms, mismo doble cinturón que `FX.burst`/`FX.bloom`).
5. No-op bajo `FX.reducedMotion`.
6. Devuelve una función de limpieza (quita el listener) para el `useEffect` de desmontaje.

**Contrato del host:** `position: relative; overflow: hidden`. Las superficies destino ya lo cumplen o se les añade (ninguna tiene un `transform` de hover que el `overflow: hidden` pudiera recortar — ver más abajo).

**Curva** (`app/web/liquid.css`):

```css
.lg-ripple {
  position: absolute; border-radius: 50%; pointer-events: none;
  background: rgba(255, 255, 255, 0.10);   /* tenue: es vidrio oscuro */
  transform: scale(0);
  animation: lg-ripple 600ms var(--ease-out) forwards;
  will-change: transform, opacity;
}
@keyframes lg-ripple {
  0%   { transform: scale(0); opacity: 1; }
  60%  { opacity: 0.62; }                    /* aguanta a mitad de viaje */
  100% { transform: scale(1); opacity: 0; }  /* muere justo al llegar */
}
```

`--ease-out` (expo-out) codifica la física real: arranque violento, frenado larguísimo — el impacto tiene toda la energía y se disipa. La opacidad no cae lineal: la onda **pierde energía mientras viaja**.

### Dónde va (y dónde NO)

**Sí** — superficies interactivas cuyo DOM es nuestro y sin transform de hover:

| Archivo | Elementos |
|---|---|
| `screens/exercises.jsx` | opciones de `choice`, `TokenChip` del banco de `blanks`, líneas de `order` (secuencia y disponibles), celdas de `match` |
| `screens/CourseScreen.jsx` | `LessonRow` (filas del temario) |

**No** — y esto es una decisión, no un olvido:

- **Botones del KIT** (`Button`, `IconButton`): son del design system, intocable. Envolverlos en un host con `overflow: hidden` sería frágil (acoplaría el radio del wrapper al del botón).
- **`CourseCard` del dashboard**: usa el `Card` del DS, que en hover hace `translateY(-4px) scale(1.01)` en su div externo. Un wrapper con `overflow: hidden` **recortaría ese lift**. Las tarjetas ganan vida por los reveals, no por el ripple.

---

## 5. Textura y reveals

### Ruido fractal

`<span aria-hidden className="lg-noise">` renderizado **una sola vez** en la raíz de `app.jsx`:

```css
.lg-noise {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.74' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
}
```

(Data-URI exacto, el mismo de `docs/liquid-glass.md` §8.) SVG inline: cero peticiones HTTP. `z-index: -1` y **no `0`**: por el orden de pintado de CSS, un elemento posicionado con `z-index: 0` se pinta *por encima* del contenido de bloque no posicionado — el grano taparía la app. Con `-1` queda **detrás del contenido pero encima del fondo de página**: los paneles lo refractan con su `backdrop-filter` — el grano se lee *a través* del cristal, que es justo lo correcto. Los gradientes puros de la aurora producen *banding* (franjas visibles) y una lisura irreal; el grano al ~3.5% lo rompe y da tacto mineral. No se ve conscientemente; se nota si lo quitas.

Bajo reduced motion **se conserva** (es textura estática, no movimiento).

### Reveals que se condensan

`Liquid.reveal(container)` en `liquid.js`:

- Busca los `.lg-reveal` descendientes de `container`.
- A cada uno le publica `--reveal-delay: min(i * 55, 330)ms` — **stagger con techo**: los primeros ~6 entran en cascada, del séptimo en adelante entran juntos. Sin el techo, una grilla de 20 tarjetas tarda más de un segundo y la página se percibe lenta.
- Los observa con `IntersectionObserver` (`threshold: 0.12`). Al intersectar: añade `is-visible` y **`unobserve`** — los reveals son ceremonia de primera vez; repetirlos en cada scroll cansa.
- Sin `IntersectionObserver` o con `FX.reducedMotion`: añade `is-visible` de inmediato a todos. **El contenido nunca queda oculto.**
- Devuelve cleanup (`disconnect`).

```css
.lg-reveal {
  opacity: 0;
  transform: translateY(28px);
  filter: blur(10px);                  /* ← la firma líquida */
  transition:
    opacity   var(--duration-slow) var(--ease-glass) var(--reveal-delay, 0ms),
    transform var(--duration-slow) var(--ease-glass) var(--reveal-delay, 0ms),
    filter    var(--duration-slow) ease              var(--reveal-delay, 0ms);
}
.lg-reveal.is-visible { opacity: 1; transform: none; filter: none; }
```

El fade+slide lo tiene todo el mundo. Lo que lo vuelve líquido es el **blur inicial**: el elemento no "aparece", **se condensa** — pasa de vapor a sólido.

**Dónde:** `DashboardScreen` (los 3 `StatPanel`, la tarjeta de repaso, cada `CourseCard`) y `CourseScreen` (el panel héroe y cada `GlassPanel` de unidad). Como el KIT **no reenvía `className`**, cada uno se envuelve en un `<div className="lg-reveal">` propio — mismo patrón ya usado por `anim-condense` en la celebración. El `filter: blur()` del wrapper es transitorio y termina en `none`, así que el `backdrop-filter` del panel funciona normal en reposo (precedente verificado en la iteración anterior).

---

## 6. Arquitectura y archivos

**Nuevos** (capa de app; `Coding Design System/` no se toca):

| Archivo | Responsabilidad |
|---|---|
| `app/web/liquid.js` | `window.Liquid = { ripple(el), reveal(container) }`. Sin build: sin `import`/`export`. Cada función devuelve su cleanup. Gate `FX.reducedMotion`. |
| `app/web/liquid.css` | `.lg-nav*` (píldoras, puentes, keyframes de ruptura/formación, squash), `.lg-ripple`, `.lg-reveal`, `.lg-noise`, y su bloque `@media (prefers-reduced-motion: reduce)`. |

**Modificados:**

| Archivo | Cambio |
|---|---|
| `app/web/index.html` | `<link>` de `liquid.css` **después** de `motion.css`; `<script src="/liquid.js">` **después** de `fx.js` (script plano, no Babel) y antes de los `type="text/babel"`. El orden es la resolución de dependencias. |
| `app/web/screens/AppShell.jsx` | Hook `useScrolled(px)` + reescritura de `NavBar` en tres píldoras con puentes. Ambos al `Object.assign(window, …)`. |
| `app/web/screens/exercises.jsx` | Ripple en opciones de `choice`, `TokenChip`, líneas de `order`, celdas de `match`. |
| `app/web/screens/CourseScreen.jsx` | Ripple en `LessonRow`; wrappers `.lg-reveal` + `Liquid.reveal` en el héroe y las unidades. |
| `app/web/screens/DashboardScreen.jsx` | Wrappers `.lg-reveal` + `Liquid.reveal` en stats, tarjeta de repaso y tarjetas de curso. |
| `app/web/app.jsx` | Montar `<span aria-hidden className="lg-noise">` una vez en la raíz. |

**Patrón de consumo en React** (sin build, con la higiene ya establecida):

```jsx
const ref = React.useRef(null);
React.useEffect(() => Liquid.ripple(ref.current), []);   // el cleanup se devuelve directo
```

---

## 7. Reduced motion (doble cinturón)

- **JS** (`FX.reducedMotion`): `Liquid.ripple` es no-op; `Liquid.reveal` marca todo visible al instante.
- **CSS** (`@media (prefers-reduced-motion: reduce)` en `liquid.css`):
  - `.lg-ripple` → `display: none`. **Su estado base es visible**: solo `animation: none` dejaría un círculo blanco fijo dentro del elemento. (Exactamente el bug del `fx-bead` que el review final cazó en la iteración anterior — no lo repetimos.)
  - `.lg-nav__bridge` → `transition: none; animation: none`, **y `.lg-nav--split .lg-nav__bridge { display: none }`**. Mismo razonamiento: sin la regla de `display`, el puente quedaría a `scaleY(1)` visible en estado partido, y la navbar se vería fusionada y rota a la vez.
  - `.lg-nav__pill` → `transition: none; animation: none` (la navbar cambia de estado al instante, sin squash ni rebote; el estado sigue siendo correcto).
  - `.lg-reveal` → `opacity: 1; transform: none; filter: none; transition: none` (contenido siempre visible).
  - `.lg-noise` → **se conserva** (es textura estática, no movimiento).

---

## 8. Verificación

1. `npm test` desde `app/`: **57/57** (no se toca backend).
2. Checklist E2E en navegador (`:3000`, cuenta `juan@test.dev` / `secreto1`), **con trap `window.onerror` instalado** (lección de la iteración anterior: `read_console_messages` no reporta excepciones no capturadas):
   - **NavBar:** arriba se lee como una píldora continua; al bajar 32px se parte en tres con el cuello rompiéndose; al volver arriba se re-fusiona; sin parpadeo al cruzar el umbral; el logo, las tabs y las acciones siguen funcionando en ambos estados; el texto se mantiene nítido y el blur nunca cae sobre él.
   - **Ripple:** la onda nace donde tocas (no en el centro) en opciones de ejercicio, fichas, líneas de orden, celdas de match y filas del temario; cubre la esquina más lejana; no quedan `<span>` zombis en el DOM tras 1.5s.
   - **Reveals:** al cargar dashboard y curso, las tarjetas se condensan en cascada; al re-scrollear **no** se re-animan; ningún elemento queda invisible.
   - **Ruido:** presente en el DOM, `pointer-events: none`, no intercepta clicks; la aurora se ve sin banding.
   - **Regresión:** la coreografía de gota (banda, melt, bloom, celebración, repaso) sigue intacta.
3. **Reduced motion:** cinturón JS en vivo (`FX.reducedMotion = true`) + cinturón CSS por lectura de código. Sin círculos ni puentes fijos en pantalla; contenido nunca oculto.
4. **Verificación humana pendiente:** el *feel* (la ruptura del cuello, el squash, la onda) requiere un navegador en primer plano — el tooling suspende `rAF` y las animaciones en pestaña de fondo.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Parpadeo de la navbar al oscilar en el umbral de 32px | Umbral bien por debajo del reposo de la navbar sticky (top 20); el `IntersectionObserver` dispara una vez por cruce; las transiciones de 520ms absorben jitter |
| El `filter: blur()` del `.lg-reveal` rompe el `backdrop-filter` del panel envuelto | El blur es transitorio y termina en `none`; en reposo el vidrio funciona normal (precedente verificado con `anim-condense`) |
| El `overflow: hidden` del host de ripple recorta algo | Solo se aplica a elementos sin transform de hover; `Card` y los botones del KIT quedan explícitamente excluidos (§4) |
| La reescritura de `NavBar` rompe el layout en pantallas angostas | Los puentes son `flex: 1` y colapsan solos; las píldoras nunca se solapan porque el layout no cambia entre estados (solo `transform`, que no afecta al flujo) |
| El ruido oscurece o ensucia la lectura | Opacidad efectiva ~3.5%, detrás del vidrio, `pointer-events: none` |
