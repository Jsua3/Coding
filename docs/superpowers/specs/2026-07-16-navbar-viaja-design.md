# La navbar que viaja — Diseño

> Arregla las dos quejas del usuario sobre la navbar (el indicador salta en vez de deslizarse; la píldora es asimétrica respecto al texto) atacando sus causas raíz: la NavBar se remonta con cada pantalla, y el indicador del `Tabs` del DS mide un tercio del contenedor, no la etiqueta.

## 1. Las dos causas raíz (diagnosticadas, no supuestas)

1. **El salto.** `app.jsx` renderiza el contenido con `key={route.screen + ":" + tab + …}` para re-disparar `anim-screen-in` en cada navegación. La NavBar vive **dentro** de ese subárbol (cada pantalla monta la suya), así que cambiar de pestaña desmonta la navbar entera y monta otra: el indicador nace ya en su posición final. La animación de deslizamiento de la iteración 4 existe pero **nunca llega a correr**.
2. **La asimetría.** El indicador del `Tabs` del DS es `width: calc((100% - 8px) / 3)` + `translateX(idx * 100%)`: un tercio exacto del contenedor. Con etiquetas de ancho tan distinto ("Inicio" vs "Progreso"), la píldora nunca abraza la palabra. El DS es intocable ⇒ el arreglo vive en nuestra capa.

## 2. Arquitectura — App es el dueño del marco

Cuando hay sesión (ni `login` ni `loading`), `app.jsx` renderiza:

```jsx
<PageFrame>
  <NavBar user={{ ...me.user, streak: me.stats.streak }} tab={tab} setTab={goTab} onHome={() => goTab("inicio")} />
  <div key={route.screen + ":" + tab + ":" + (route.lessonId || route.courseId || "")} className="anim-screen-in">
    {screen}
  </div>
</PageFrame>
```

- La NavBar queda **fuera** del div `key`ado: sobrevive a todo cambio de pestaña/ruta. El contenido sigue re-montando con `anim-screen-in` en cada navegación, como hoy.
- El `position: sticky` de `.lg-nav` sigue funcionando: su contenedor vuelve a ser la página completa (un wrapper que solo contuviera la navbar la dejaría sin recorrido donde pegarse).
- `login`/`loading` se renderizan como hoy, sin marco.
- **Cambio de comportamiento deliberado y aprobado:** el logo lleva **siempre a Inicio** (`goTab("inicio")`). Hoy en Curso/Lección/Repaso hacía `onBack`. El botón "Volver" de esas pantallas sigue existiendo para la vuelta local.
- El estado `sliding`/`slideTimer` de `NavBar` y su `changeTab` desaparecen (obsoletos: el viaje ahora lo hace `NavTabs` por FLIP). `NavBar` llama `setTab` directo.

## 3. `NavTabs` — el indicador medido con FLIP

Componente propio en `AppShell.jsx` que reemplaza al `Tabs` del DS **solo dentro de la navbar**. Mismo contrato de accesibilidad (`role="tablist"`, `role="tab"`, `aria-selected`) y misma piel de píldora que el DS (`--glass-bg-pressed`, borde `--glass-stroke-strong`, sombra inset, `--radius-pill`), para que el look no cambie: cambian la geometría y el viaje.

**Contrato:** `NavTabs({ items, value, onChange })` — `items: [{id, label}]`.

**Implementación de referencia** (la fuente de verdad para el plan):

```jsx
function NavTabs({ items, value, onChange }) {
  const listRef = React.useRef(null);
  const btnRefs = React.useRef({});
  const pillRef = React.useRef(null);
  const prevRect = React.useRef(null);
  const [tick, setTick] = React.useState(0); // re-medición por resize/fonts

  // Geometría en reposo + el viaje FLIP. useLayoutEffect: mide y pinta ANTES del paint.
  React.useLayoutEffect(() => {
    const list = listRef.current, btn = btnRefs.current[value], pill = pillRef.current;
    if (!list || !btn || !pill) return;
    const lr = list.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const rect = { left: br.left - lr.left, width: br.width };

    // Reposo: geometría directa, sin transición (left/width NO se animan jamás — regla de motion).
    pill.style.transition = "none";
    pill.style.left = rect.left + "px";
    pill.style.width = rect.width + "px";

    const prev = prevRect.current;
    prevRect.current = rect;
    const reduced = window.FX && FX.reducedMotion;
    if (!prev || reduced || (prev.left === rect.left && prev.width === rect.width)) return;

    // FLIP: arranca visualmente desde la geometría vieja y viaja a la nueva SOLO con transform.
    // Entre anchos distintos la píldora se estira/encoge como una gota; en reposo queda nítida.
    const dx = prev.left - rect.left;
    const sx = prev.width / rect.width;
    pill.style.transform = "translateX(" + dx + "px) scaleX(" + sx + ")";
    void pill.offsetWidth; // reflow: fija el punto de partida antes de encender la transición
    pill.style.transition = "transform 420ms var(--ease-glass)";
    pill.style.transform = "translateX(0) scaleX(1)";
  }, [value, tick]);

  // Las fuentes web y el resize cambian el ancho del texto: re-medir sin animar.
  React.useEffect(() => {
    const remeasure = () => { prevRect.current = null; setTick((t) => t + 1); };
    window.addEventListener("resize", remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, []);

  return (
    <div ref={listRef} role="tablist" className="lg-navtabs">
      <span ref={pillRef} aria-hidden className="lg-navtabs__pill"></span>
      {items.map((it) => (
        <button
          key={it.id}
          ref={(el) => { btnRefs.current[it.id] = el; }}
          role="tab"
          aria-selected={it.id === value}
          className={"lg-navtabs__tab" + (it.id === value ? " is-active" : "")}
          onClick={() => onChange && onChange(it.id)}
        >{it.label}</button>
      ))}
    </div>
  );
}
```

Decisiones finas:
- **`transform-origin: left center`** en la píldora (CSS): el FLIP calcula `dx` contra el borde izquierdo; con origin centrado la matemática mentiría.
- El `prevRect.current = null` en re-mediciones evita un FLIP falso tras resize/fuentes (reposicionar no es navegar).
- `useLayoutEffect` (no `useEffect`): mide y pinta antes del paint — sin parpadeo del estado viejo.
- La píldora es `aria-hidden` y `pointer-events: none`: decoración, no semántica.
- Los botones replican la tipografía del DS Tabs sm (`--text-sm`, semibold, color activo/terciario con transición de color), con `padding: 0 18px` — la píldora abraza el botón, y el botón abraza la palabra.

## 4. Inventario exacto de cambios (10 sitios, 8 vistas)

| Archivo | Sitio | Cambio |
|---|---|---|
| `app.jsx` | shell | Gana `PageFrame` + `NavBar` + div `key`ado (§2). El `key` actual del div de contenido se conserva tal cual |
| `InicioScreen.jsx:90-91` | wrap principal | Quita `<PageFrame>` + `<NavBar>`; devuelve contenido pelado |
| `MateriasScreen.jsx:48-49` | wrap principal | Ídem |
| `ProgressScreen.jsx:75-76` | función `wrap()` | Ídem (el wrap queda como Fragment o desaparece) |
| `ProfileScreen.jsx:56-57` | wrap principal | Ídem |
| `CourseScreen.jsx:49-50` | wrap principal | Ídem |
| `LessonScreen.jsx:111-114` | wrap de error | Ídem |
| `LessonScreen.jsx:119-122` | wrap de loading | Ídem |
| `LessonScreen.jsx:186-187` | pantalla principal | Ídem |
| `LessonScreen.jsx:267-268` (CelebrationScreen) | celebración | Ídem; `CelebrationScreen` pierde las props `me`/`tab`/`setTab` (solo alimentaban su navbar) y su call-site en LessonScreen deja de pasarlas |
| `ReviewScreen.jsx:42-43` | función `wrap()` | Ídem (cubre error/loading/done/main) |
| `AppShell.jsx` | NavBar | Reemplaza `<Tabs …>` por `<NavTabs …>`; borra `sliding`/`slideTimer`/`changeTab`; añade `NavTabs` y lo exporta en el `Object.assign` |

Las props que cada pantalla recibe (`me`, `tab`, `setTab`) **no cambian** — varias las usan para más cosas (p. ej. `setTab("perfil")` desde la alerta de racha). Solo dejan de alimentar una navbar propia.

## 5. CSS (`liquid.css`)

**Se va** (muerto con el DS Tabs fuera de la navbar): el bloque `.lg-nav [role="tablist"] > div { transition … }`, `.lg-nav__pill--tabs.is-sliding …` y `@keyframes lg-tab-slide`.

**Entra** (antes del `@media` final):

```css
/* Las pestañas de la navbar: texto sobre la superficie, píldora medida al texto.
   El viaje es FLIP desde JS (NavTabs): aquí solo vive la piel y el transform-origin. */
.lg-navtabs {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: center; /* los botones ahora abrazan su texto: el grupo se centra en la cápsula */
  height: 36px;
  padding: 4px;
  width: 100%;
  min-width: 0;
}
.lg-navtabs__pill {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: var(--radius-pill);
  background: var(--glass-bg-pressed);
  border: 1px solid var(--glass-stroke-strong);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(3,6,16,0.35);
  transform-origin: left center;
  pointer-events: none;
}
.lg-navtabs__tab {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-pill);
  padding: 0 18px;
  white-space: nowrap;
  transition: color var(--duration-fast) var(--ease-glass);
  outline: none;
}
.lg-navtabs__tab.is-active { color: var(--text-primary); }
```

**Segundo cinturón**, dentro del `@media (prefers-reduced-motion: reduce)` existente (que sigue siendo el último bloque):

```css
  .lg-navtabs__pill { transition: none !important; transform: none !important; }
```

(El primero es el gate JS: con `FX.reducedMotion`, `NavTabs` no arma el FLIP y la píldora salta directo — coherente con el resto del proyecto.)

Nota: la píldora se posiciona con `left`/`width` medidos contra el contenedor `.lg-navtabs` (su `position: relative`), así que el centrado del grupo no afecta la matemática del FLIP — los rects se miden después del layout.

## 6. Restricciones del proyecto que aplican

- **Sin build**: nada de `import`/`export` ni `<>`; `NavTabs` se exporta por `Object.assign(window, …)` en `AppShell.jsx` (que ya se carga antes que todas las pantallas — el orden de `<script>` no cambia).
- **El DS es intocable**: `Tabs` del DS queda como está (lo usan las demos del DS); la navbar simplemente deja de usarlo.
- **Motion**: la píldora solo **transiciona `transform`**; `left`/`width` se escriben siempre con `transition: none`. El color del texto transiciona `color` (ya era así en el DS, repintado puro).
- **Reduced motion doble cinturón**: gate JS + `@media` final.
- **Copy**: sin copy nuevo.

## 7. Verificación

**Backend:** cero cambios de servidor ⇒ los **137 tests** deben seguir en 137/137 (guardia de regresión).

**Navegador, por contrato** (el tooling congela rAF pero `getBoundingClientRect`/`getComputedStyle`/clicks funcionan):
- **Persistencia:** guardar referencia al nodo `.lg-nav`, navegar Inicio→Materias→Progreso→Inicio, y comprobar `document.querySelector(".lg-nav") === nodoGuardado` (mismo nodo vivo, no un clon).
- **Medición:** el rect de `.lg-navtabs__pill` ≈ rect del botón activo (mismos left/width ±1px), en las tres pestañas.
- **FLIP armado:** justo tras `click` en otra pestaña, `pill.style.transform` contiene `translateX(` con valor ≠ 0 (el vuelo está armado; que la transición corra suave es el pendiente humano).
- **Reduced motion:** con `FX.reducedMotion = true`, tras cambiar de pestaña `pill.style.transform` queda vacío o identidad (sin FLIP).
- **Sticky vivo:** `getComputedStyle(nav).position === "sticky"`.
- **Regresión funcional:** el logo lleva a Inicio desde una lección; "Volver" sigue llevando al curso; el menú del avatar abre/cierra; cero errores de consola (trap `window.onerror`) en ~10 navegaciones incluyendo lección y repaso.

**Pendiente humano:** el *feel* del viaje de la píldora (el estiramiento de gota entre anchos) necesita navegador en primer plano.

## 8. Fuera de alcance decidido

- **El fondo vivo** (cuadrícula que se deforma con el cursor): siguiente iteración, ya acordado con el usuario.
- Tocar el `Tabs` del DS o cualquier otra pieza del DS.
- Cambiar el comportamiento de las pestañas (siguen siendo navegación que te devuelve al dashboard: `goTab`).
- Deep-linking / URL por pestaña (no existe hoy; no se introduce).

## 9. Resumen en una frase

La NavBar sube a `App` y vive fuera del subárbol que se remonta por navegación (por fin persiste), y sus pestañas cambian el `Tabs` del DS por un `NavTabs` propio que mide el texto real y viaja con FLIP — la píldora abraza la palabra, se estira como gota durante el vuelo y llega nítida, animando solo `transform`.
