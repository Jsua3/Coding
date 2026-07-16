# La navbar que viaja — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La NavBar persiste entre pantallas (el indicador de pestañas por fin viaja en vez de saltar) y su píldora abraza el texto real de cada etiqueta.

**Architecture:** Dos movimientos: (1) un componente propio `NavTabs` (en `AppShell.jsx`) reemplaza al `Tabs` del DS dentro de la navbar — mide el botón activo y viaja con FLIP animando solo `transform`; (2) `app.jsx` pasa a ser el dueño del marco (`PageFrame` + `NavBar` fuera del div `key`ado que remonta el contenido), y las 8 vistas quedan content-only (10 sitios). Cero backend.

**Tech Stack:** Frontend sin build (React 18 UMD + Babel en el navegador, globales `window`), CSS con tokens del proyecto.

**Spec:** `docs/superpowers/specs/2026-07-16-navbar-viaja-design.md` (contiene la implementación de referencia de `NavTabs` — fuente de verdad).

## Global Constraints

- **Sin build:** PROHIBIDO `import`/`export` en `app/web/` y el shorthand `<>` (usar `React.Fragment`). Globales por `Object.assign(window, {...})`. El orden de `<script>` en `index.html` NO cambia.
- **El DS (`Coding Design System/`) es INTOCABLE.** Su `Tabs` queda como está; la navbar simplemente deja de usarlo.
- **Motion:** la píldora solo **transiciona `transform`** (420ms `var(--ease-glass)`); `left`/`width` se escriben SIEMPRE con `transition: none` (geometría de reposo, jamás animada). `transform-origin: left center` (la matemática del FLIP se calcula contra el borde izquierdo).
- **Reduced motion, doble cinturón:** gate JS (`FX.reducedMotion` ⇒ no se arma el FLIP) + `@media (prefers-reduced-motion: reduce)` que DEBE seguir siendo el último bloque de `liquid.css` y gana `.lg-navtabs__pill { transition: none !important; transform: none !important; }`.
- **Comportamiento aprobado por el usuario:** el logo lleva SIEMPRE a Inicio (`goTab("inicio")`), también desde Curso/Lección/Repaso (antes hacía `onBack` ahí). El botón "Volver" local no cambia.
- **Las props de las pantallas (`me`, `tab`, `setTab`) NO cambian** — varias las usan para más cosas. Solo dejan de alimentar una navbar propia. Excepción única: `CelebrationScreen` pierde `me`/`tab`/`setTab` (verificado: solo alimentaban su navbar).
- **Verificación:** no hay harness de frontend (dependencias nuevas prohibidas sin preguntar). Se verifica por contrato en el navegador contra el dev server (:3000, cuenta `juan@test.dev` / `secreto1`) + los **137 tests de backend** como guardia de regresión (deben seguir 137/137). Gotchas del tooling: `document.hidden=true` (rAF no resuelve; las TRANSICIONES no corren — verifica el contrato, no el movimiento), `window.onerror` manual para excepciones, screenshots suelen hacer timeout (usa DOM/JS).

---

### Task 1: `NavTabs` + recableado de la NavBar + CSS

**Files:**
- Modify: `app/web/screens/AppShell.jsx` (añadir `NavTabs`; simplificar `NavBar`; exportarlo)
- Modify: `app/web/liquid.css` (quitar los overrides muertos del Tabs del DS; añadir `.lg-navtabs*`; cinturón reduced-motion)

**Interfaces:**
- Produces: `window.NavTabs({ items, value, onChange })` — `items: [{id, label}]`; píldora `aria-hidden` posicionada por medición; FLIP en cambio de `value`. `NavBar` ya no tiene estado `sliding` y llama `setTab` directo.
- Consumes: `FX.reducedMotion` (gate), tokens `--ease-glass`, `--radius-pill`, `--glass-bg-pressed`, `--glass-stroke-strong`, `--text-sm`, `--weight-semibold`, `--duration-fast`.

- [ ] **Step 1: Añadir `NavTabs` en `AppShell.jsx`**

Colócalo justo ANTES de `function NavBar(…)` (línea ~89). El código es la implementación de referencia del spec §3, **verbatim**:

```jsx
// Las pestañas de la navbar. Reemplaza al Tabs del DS SOLO aquí: aquel mide tercios del
// contenedor y esta píldora mide el TEXTO real. El viaje es FLIP: geometría de reposo directa
// (left/width sin transición, jamás animados) y el vuelo solo con transform (translateX+scaleX),
// que entre anchos distintos estira la píldora como una gota y la deja nítida al llegar.
function NavTabs({ items, value, onChange }) {
  const listRef = React.useRef(null);
  const btnRefs = React.useRef({});
  const pillRef = React.useRef(null);
  const prevRect = React.useRef(null);
  const [tick, setTick] = React.useState(0); // re-medición por resize/fuentes

  React.useLayoutEffect(() => {
    const list = listRef.current, btn = btnRefs.current[value], pill = pillRef.current;
    if (!list || !btn || !pill) return;
    const lr = list.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const rect = { left: br.left - lr.left, width: br.width };

    pill.style.transition = "none";
    pill.style.left = rect.left + "px";
    pill.style.width = rect.width + "px";

    const prev = prevRect.current;
    prevRect.current = rect;
    const reduced = window.FX && FX.reducedMotion;
    if (!prev || reduced || (prev.left === rect.left && prev.width === rect.width)) return;

    // FLIP: arranca visualmente desde la geometría vieja y viaja a la nueva SOLO con transform.
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

- [ ] **Step 2: Simplificar `NavBar`**

En `NavBar` (AppShell.jsx:89-146):

1. Destructure: `const { Tabs, IconButton, Badge } = KIT;` → `const { IconButton, Badge } = KIT;`
2. BORRA el bloque del estado de deslizamiento (líneas ~104-115): el comentario "Al cambiar de pestaña, el indicador se estira…", `const [sliding, setSliding]`, `slideTimer`, su `useEffect` de limpieza y `changeTab`.
3. La píldora de pestañas (líneas ~125-135) queda:

```jsx
      <div className="lg-nav__pill lg-nav__pill--tabs">
        <NavGlass />
        {/* Sin vidrio propio: las pestañas son texto sobre la superficie de la navbar. El
            indicador es NavTabs: píldora medida al texto que viaja con FLIP. */}
        <NavTabs value={tab} onChange={setTab} items={[
          { id: "inicio", label: "Inicio" },
          { id: "materias", label: "Materias" },
          { id: "progreso", label: "Progreso" },
        ]} />
      </div>
```

(Desaparecen: el `+ (sliding ? " is-sliding" : "")` del className, y el `<Tabs …/>` con su `style` de overrides — ya no hay nada que anular.)

4. Añade `NavTabs` al `Object.assign(window, { … })` final del archivo.

- [ ] **Step 3: CSS — quitar lo muerto, añadir `.lg-navtabs*`**

En `app/web/liquid.css`:

1. BORRA el bloque de overrides del Tabs del DS (líneas ~143-156): el comentario "El indicador de la pestaña activa viajaba con --ease-spring…", `.lg-nav [role="tablist"] > div { transition… }`, `.lg-nav__pill--tabs.is-sliding [role="tablist"] > div { animation… }` y `@keyframes lg-tab-slide`.
2. AÑADE, antes del `@media (prefers-reduced-motion: reduce)` final:

```css
/* Las pestañas de la navbar: texto sobre la superficie, píldora medida al texto.
   El viaje es FLIP desde JS (NavTabs): aquí viven la piel y el transform-origin.
   left/width los escribe el JS SIEMPRE con transition:none — solo transform se anima. */
.lg-navtabs {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: center; /* los botones abrazan su texto: el grupo se centra en la cápsula */
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

3. DENTRO del `@media (prefers-reduced-motion: reduce)` (que sigue siendo el último bloque), añade:

```css
  .lg-navtabs__pill { transition: none !important; transform: none !important; }
```

- [ ] **Step 4: Verificar (backend + navegador)**

Run (desde `app/`): `npm test` → esperado `tests 137 … pass 137 … fail 0`.

Navegador (dev server :3000, sesión `juan@test.dev`/`secreto1`, Ctrl+Shift+R):

```js
(function(){
  const pill = document.querySelector(".lg-navtabs__pill");
  const activo = document.querySelector(".lg-navtabs__tab.is-active");
  const pr = pill.getBoundingClientRect(), br = activo.getBoundingClientRect();
  return { dLeft: Math.abs(pr.left - br.left).toFixed(1), dWidth: Math.abs(pr.width - br.width).toFixed(1) };
})();
```

Esperado: `dLeft` y `dWidth` ≤ 1.5 (la píldora abraza el botón activo). Repite en Materias y Progreso (navega con clicks reales). Nota: en esta tarea el FLIP aún NO viaja entre pestañas (la navbar sigue remontándose por pantalla — eso lo arregla la Task 2); lo que SÍ debe verse ya es la píldora medida. Cero errores de consola (trap `window.onerror`).

- [ ] **Step 5: Commit**

```bash
git add app/web/screens/AppShell.jsx app/web/liquid.css
git commit -m "feat: NavTabs, la pildora de pestanas medida al texto (FLIP listo)"
```

---

### Task 2: El lift — App es el dueño del marco

**Files:**
- Modify: `app/web/app.jsx` (shell con PageFrame + NavBar fuera del div `key`ado)
- Modify: `app/web/screens/InicioScreen.jsx:90-91,169`, `MateriasScreen.jsx:48-49,77`, `ProgressScreen.jsx:73-78`, `ProfileScreen.jsx:56-57,128`, `CourseScreen.jsx:48-50,98`, `LessonScreen.jsx:111-114,119-122,186-187,232,235,266-268,302`, `ReviewScreen.jsx:41-46`
- (Las líneas son las de HEAD actual de la rama; verifica el contexto exacto al editar.)

**Interfaces:**
- Consumes: `NavTabs` ya cableado en `NavBar` (Task 1). `PageFrame` y `NavBar` (globales de AppShell).
- Produces: una única `NavBar` viva en el DOM que sobrevive a todo cambio de pestaña/ruta.

- [ ] **Step 1: `app.jsx` — el shell**

El `return` final de `App` (líneas ~118-131) pasa de:

```jsx
  return (
    <React.Fragment>
      <span aria-hidden className="lg-noise"></span>
      <div key={route.screen + ":" + tab + ":" + (route.lessonId || route.courseId || "")} className="anim-screen-in">
        {screen}
      </div>
      …toasts…
    </React.Fragment>
  );
```

a:

```jsx
  // La NavBar vive AQUÍ, fuera del div keyado que remonta el contenido en cada navegación: es la
  // única forma de que el indicador de pestañas pueda viajar (un componente que muere no desliza).
  // El sticky sigue funcionando porque su contenedor es la página entera, no un wrapper corto.
  const conSesion = route.screen !== "login" && route.screen !== "loading" && me;
  const contenido = (
    <div key={route.screen + ":" + tab + ":" + (route.lessonId || route.courseId || "")} className="anim-screen-in">
      {screen}
    </div>
  );

  return (
    <React.Fragment>
      <span aria-hidden className="lg-noise"></span>
      {conSesion ? (
        <PageFrame>
          <NavBar user={{ ...me.user, streak: me.stats.streak }} tab={tab} setTab={goTab} onHome={() => goTab("inicio")} />
          {contenido}
        </PageFrame>
      ) : contenido}
      …toasts sin cambios…
    </React.Fragment>
  );
```

(Los toasts y `AchievementToast` quedan exactamente donde están.)

- [ ] **Step 2: Pantallas content-only (los 10 sitios)**

En TODOS los casos: quitar `<PageFrame>` + `</PageFrame>` + la línea `<NavBar …/>`, conservando intacto el contenido interior. Sitio por sitio:

1. **InicioScreen.jsx** (~90-91, cierre ~169): el `return` queda devolviendo directamente el `<div ref={rootRef}>…</div>`.
2. **MateriasScreen.jsx** (~48-49, cierre ~77): ídem — devuelve el `<div ref={rootRef}>…</div>`.
3. **ProgressScreen.jsx** (~73-78): la función `wrap` queda:
   ```jsx
   const wrap = (children) => children; // App pone el marco (PageFrame + NavBar)
   ```
4. **ProfileScreen.jsx** (~56-57, cierre ~128): devuelve el `<div ref={rootRef}>…</div>`.
5. **CourseScreen.jsx** (~48-50, cierre ~98): el contenido tiene varios hermanos ⇒ envuélvelos en `<React.Fragment>…</React.Fragment>`.
6. **LessonScreen.jsx, wrap de error** (~111-114): devuelve directamente el contenido interior (el div del ErrorPanel).
7. **LessonScreen.jsx, wrap de loading** (~119-122): ídem — devuelve directamente lo que hoy vive entre `<NavBar …/>` y `</PageFrame>`.
8. **LessonScreen.jsx, pantalla principal** (~186, cierre ~232): varios hermanos ⇒ `<React.Fragment>…</React.Fragment>` (la `FeedbackBand` sigue dentro, al final).
9. **LessonScreen.jsx, CelebrationScreen** (~235, ~266-268, cierre ~302): la firma pasa de `function CelebrationScreen({ data, onNext, onBack, me, tab, setTab })` a `function CelebrationScreen({ data, onNext, onBack })` (verificado: `me`/`tab`/`setTab` SOLO alimentaban su NavBar). Su `return` devuelve directamente el `<div style={{ minHeight: "70vh", … }}>…</div>`. Y el call-site (~línea 182) pasa de `<CelebrationScreen data={celebration} onNext={…} onBack={onBack} me={me} tab={tab} setTab={setTab} />` a `<CelebrationScreen data={celebration} onNext={…} onBack={onBack} />`.
10. **ReviewScreen.jsx** (~41-46): la función `wrap` queda:
    ```jsx
    const wrap = (children) => children; // App pone el marco (PageFrame + NavBar)
    ```

Las pantallas SIGUEN recibiendo `me`, `tab`, `setTab` — no toques sus firmas ni sus call-sites en `app.jsx` (salvo el de CelebrationScreen, punto 9, que está dentro de LessonScreen).

- [ ] **Step 3: Verificar (backend + navegador)**

Run (desde `app/`): `npm test` → 137/137.

Navegador (Ctrl+Shift+R, sesión iniciada), pega este barrido:

```js
(async function(){
  window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));
  const nav0 = document.querySelector(".lg-nav");
  const click = (texto) => Array.from(document.querySelectorAll(".lg-navtabs__tab")).find(b => b.textContent === texto).click();
  const espera = (ms) => new Promise(r => setTimeout(r, ms));
  click("Materias"); await espera(150);
  const flipArmado = document.querySelector(".lg-navtabs__pill").style.transform; // translateX(0px) scaleX(1) al final del vuelo, pero style.transform NO vacío = el FLIP se armó
  click("Progreso"); await espera(500);
  click("Inicio"); await espera(500);
  return {
    mismaNavbar: document.querySelector(".lg-nav") === nav0,   // esperado: true (mismo nodo vivo)
    navbarsEnDom: document.querySelectorAll(".lg-nav").length,  // esperado: 1
    flipArmado,                                                 // esperado: contiene "translateX"
    sticky: getComputedStyle(nav0).position,                    // esperado: "sticky"
    errores: window.__errs                                      // esperado: []
  };
})();
```

Regresión funcional adicional (clicks reales): entra a un curso → una lección → el logo "Coding" te lleva a INICIO (nuevo comportamiento aprobado); "Volver" de la lección te lleva al curso; el menú del avatar abre y navega a perfil; el repaso abre y su banda funciona. Cero errores.

- [ ] **Step 4: Commit**

```bash
git add app/web/app.jsx app/web/screens/InicioScreen.jsx app/web/screens/MateriasScreen.jsx app/web/screens/ProgressScreen.jsx app/web/screens/ProfileScreen.jsx app/web/screens/CourseScreen.jsx app/web/screens/LessonScreen.jsx app/web/screens/ReviewScreen.jsx
git commit -m "feat: la navbar persiste — App es el dueno del marco y el indicador por fin viaja"
```

---

### Task 3: Verificación final (barrido del spec §7)

**Files:** ninguno (solo verificación; sin cambios salvo defecto real descubierto)

- [ ] **Step 1: Backend intacto**

Run (desde `app/`): `npm test` → 137/137.

- [ ] **Step 2: Contrato completo en el navegador**

Con sesión y trap de errores instalado:

1. **Persistencia:** el barrido de la Task 2 Step 3 (mismo nodo, 1 navbar, sticky).
2. **Medición en las tres pestañas:** el check de la Task 1 Step 4 en Inicio, Materias y Progreso (dLeft/dWidth ≤ 1.5).
3. **Reduced motion (gate JS):** `FX.reducedMotion = true`; cambia de pestaña; `document.querySelector(".lg-navtabs__pill").style.transform` debe quedar vacío o sin armar (no `translateX(…px)` de arranque). Restaura `FX.reducedMotion = false`.
4. **Reduced motion (CSS):** por lectura — el `@media` sigue siendo el último bloque de `liquid.css` y contiene la línea de `.lg-navtabs__pill`.
5. **Limpieza de lo muerto:** `grep` en el repo — cero referencias a `is-sliding`, `lg-tab-slide` y ninguna a `Tabs` dentro de `AppShell.jsx` (el DS lo sigue exportando; nadie de la app lo usa).
6. **Regresión funcional:** lección completa hasta la celebración (la navbar sigue arriba, las pestañas navegan desde la celebración), repaso, perfil, logout→login. Cero errores de consola en todo el recorrido.

- [ ] **Step 3: Registrar el pendiente humano**

En el reporte: el *feel* del viaje de la píldora (el estiramiento de gota entre anchos distintos, 420ms `--ease-glass`) necesita un navegador en primer plano — el panel del tooling congela las transiciones. Verificado aquí: el contrato (geometría, FLIP armado, persistencia), no la suavidad.
