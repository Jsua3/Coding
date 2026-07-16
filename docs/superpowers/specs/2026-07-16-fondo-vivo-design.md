# El fondo vivo — Diseño

> Pedido explícito del usuario: el fondo actual "es muy aburrido". Quiere uno **un poco más claro** y con una **cuadrícula tipo cuaderno que se deforma al paso del cursor**. Decisiones tomadas con él: deformación de **lente de gota** (las líneas se curvan hacia el cursor, como refractadas bajo una gota de agua) y aclarado **sutil** (el carácter nocturno y el contraste del vidrio no se tocan). Es la evolución natural del cursor-como-luz: el cursor ya ilumina las tarjetas; ahora curva el espacio del fondo.

## 1. Las capas del fondo (de atrás a adelante)

1. **`body` — la aurora aclarada.** El DS pinta `body { background: var(--aurora-page) }` (`tokens/utilities.css`, intocable). La app lo **anula en cascada** desde `liquid.css` (que carga después de `/ds/styles.css` en `index.html`): misma composición de 3 auroras + degradado, un paso más luminosa.
2. **`.lg-grid` — el canvas de la cuadrícula** (NUEVO): `position: fixed; inset: 0; z-index: -1; pointer-events: none`, `aria-hidden`. Pintado por `Liquid.grid(canvas)`.
3. **`.lg-noise` — el ruido fractal existente** (sin cambios). En el DOM va DESPUÉS del canvas (a igual `z-index`, el orden de fuente decide): el grano se lee encima de las líneas.
4. El contenido. **El vidrio de los paneles refracta la cuadrícula y el ruido** (su `backdrop-filter` los desenfoca): la cuadrícula se lee borrosa bajo los paneles y nítida en los espacios — papel de cuaderno bajo el vidrio.

El canvas vive en `App` (app.jsx), junto al `.lg-noise`, **fuera** del div `key`ado — es fondo de página, presente también en el login, y no se remonta jamás.

## 2. CSS (en `liquid.css`)

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

No hay cinturón nuevo de reduced motion en CSS: el canvas no tiene animaciones CSS — bajo reduced motion el gate JS lo deja **estático** (la cuadrícula es textura y se queda; solo la deformación desaparece).

## 3. `Liquid.grid(canvas)` — implementación de referencia (en `liquid.js`)

Mismo idioma que `ripple`/`reveal`/`pointer`: función que devuelve su limpieza, auto-gateada. **Fuente de verdad para el plan:**

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

Decisiones finas:
- **El listener de `pointermove` vive en `window`**: la lente funciona sobre TODA la página, también cuando el cursor está sobre un panel — la cuadrícula se curva *debajo* del vidrio, que es exactamente la física correcta.
- **La gota se condensa, no vuela**: cuando la fuerza es 0 (primer movimiento, o tras el desvanecimiento), la lente aparece EN el cursor y crece ahí (ver `onMove`). Perseguir desde la posición vieja se vería como un barrido fantasma cruzando el fondo.
- **Dormirse de verdad**: `settled` corta el bucle tanto con el cursor quieto dentro (lente estable a fuerza 1) como tras el desvanecimiento (fuerza 0). `pointermove` re-agenda. Sin esto, un rAF correría a 60fps para siempre.
- **`warp` con salida temprana** (`power <= 0`, `d >= RADIUS`): el dibujo estático cuesta lo mismo que una cuadrícula sin lente.
- Presupuesto: ~60 polilíneas × ~50 segmentos ≈ 3.500 puntos por frame en canvas 2D inmediato — trivial a 60fps, y solo mientras la lente está viva.

## 4. Montaje en `App` (app.jsx)

Junto al `.lg-noise` existente, ANTES de él en el DOM (a igual `z-index: -1`, el orden de fuente pinta el ruido encima de las líneas):

```jsx
function App() {
  // …estado existente…
  const gridRef = React.useRef(null);
  React.useEffect(() => Liquid.grid(gridRef.current), []);
  // …
  return (
    <React.Fragment>
      <canvas ref={gridRef} aria-hidden className="lg-grid"></canvas>
      <span aria-hidden className="lg-noise"></span>
      {/* …resto sin cambios… */}
    </React.Fragment>
  );
}
```

## 5. Calibración (los números)

| Parámetro | Valor | Nota |
|---|---|---|
| Paso de cuadrícula | `48px` | escala de cuaderno, no de plano técnico |
| Color de línea | `rgba(226,236,255,0.045)` | apenas sobre el nivel del ruido (0.035); 1px |
| Radio de lente | `180px` | |
| Desplazamiento máximo | `10px` hacia el centro | refracción, no succión |
| Caída | `smoothstep` | sin costuras en el borde de la lente |
| Persecución | `12%` por frame | gota pesada, no sticker |
| Fuerza (fade in/out) | `8%` por frame | ~400ms de desvanecimiento al salir |
| Segmento de polilínea | `24px` | curvas suaves con pocos puntos |
| Aurora base | `#0A0F1E → #0E1526`, `#05070F → #080D1A` | aclarado sutil |
| Acentos de aurora | `0.12→0.17`, `0.10→0.14`, `0.08→0.11` | ~+40% de presencia |

## 6. Gates, accesibilidad y restricciones

- **Doble puerta JS** (`FX.reducedMotion` o puntero no-fino) ⇒ sin listeners de puntero, sin rAF: la cuadrícula se dibuja una vez, estática. La textura se queda (es fondo, como el ruido); solo el movimiento desaparece. No hay animación CSS que neutralizar en el `@media`.
- El canvas es `aria-hidden` y `pointer-events: none`: invisible para lectores y clics.
- **Sin build**: `Liquid.grid` es un método más del objeto global `Liquid`; sin dependencias nuevas (canvas 2D nativo).
- **El DS queda intocado**: el aclarado es un override en cascada desde `liquid.css`.
- La regla de motion (solo `transform`/`opacity`/`filter`) aplica a animaciones CSS/estilos — el canvas pinta píxeles, no anima propiedades; su disciplina es el presupuesto de rAF (dormirse en reposo), que este diseño cumple.

## 7. Verificación

**Backend:** cero cambios ⇒ **137/137** como guardia.

**Navegador, por contrato** (el dibujo inicial es síncrono — funciona incluso en el panel del tooling; solo los ticks de rAF no corren):
- El canvas existe, es `fixed` a viewport y su bitmap mide `innerWidth×dpr` / `innerHeight×dpr`.
- **Hay tinta**: `ctx.getImageData` sobre una línea de la cuadrícula (p. ej. `x = 48·dpr, y = 10·dpr`) tiene alpha > 0, y sobre el centro de una celda, alpha = 0.
- El `background` computado del `body` contiene `#0e1526` (el override en cascada ganó).
- Orden de capas: el canvas precede al `.lg-noise` en el DOM.
- **Gate**: con `FX.reducedMotion = true` (y remount del canvas), `pointermove` no agenda rAF ni cambia nada.
- Cero errores de consola (trap) en navegación completa; login incluido (el fondo vive fuera del marco de sesión).

**Pendiente humano:** el *feel* de la lente (la persecución amortiguada, el desvanecimiento al salir) y el juicio estético del aclarado necesitan navegador en primer plano.

## 8. Fuera de alcance decidido

- WebGL/shaders (sobredimensionado para esto; anotado como evolución si el fondo pide más física).
- Onda con estela y repulsión (el usuario eligió lente de gota).
- Interacción táctil con la cuadrícula (en táctil queda estática, coherente con el resto del lenguaje).
- Tocar el DS o sus tokens.

## 9. Resumen en una frase

El fondo deja de ser un telón: una aurora un paso más luminosa (override en cascada, DS intocado) con papel de cuaderno encima — un canvas 2D (`Liquid.grid`) cuya cuadrícula se curva hacia el cursor como bajo una gota-lente, perseguido con amortiguación, refractado por el vidrio de los paneles, y que duerme a cero CPU en cuanto no hay nada que animar.
