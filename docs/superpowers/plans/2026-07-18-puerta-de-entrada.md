# La puerta de entrada — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la puerta de entrada completa de Coding: un landing pre-login de cuatro actos (hero sobre video, scrollytelling pinned, catálogo, cierre) y el login rediseñado sobre el mismo video, según el spec `docs/superpowers/specs/2026-07-18-puerta-de-entrada-design.md`.

**Architecture:** Todo dentro de la SPA sin build. `app.jsx` gana el estado `landing` (por defecto sin token); el video vive en un componente `GateBackdrop` montado UNA vez en `App`, fuera del div keyado — la transición landing→login no lo reinicia. El scrollytelling usa `position: sticky` + un listener de scroll directo (sin rAF, a propósito: verificable en el panel del tooling). Cero backend, cero esquema.

**Tech Stack:** React 18 UMD + Babel standalone (sin build), CSS en `liquid.css`/`motion.css`, Express estático. Sin dependencias nuevas.

## Global Constraints

Copiadas del spec y de `prompt-maestro.md` §8 — aplican a TODAS las tareas:

- **Sin build**: PROHIBIDO `import`/`export` en `app/web/`. Prohibido el shorthand `<>` (usar `React.Fragment`). Globales con `Object.assign(window, {...})`. El orden de los `<script>` en `index.html` ES la resolución de dependencias.
- **`Coding Design System/` es INTOCABLE.** Sus componentes NO reenvían `className` ⇒ clases de animación en un `<div>` wrapper propio. Paneles del DS son `content-box` ⇒ si les pasas `height: 100%` con padding, añade `boxSizing: "border-box"` por el `style` prop.
- **Motion**: solo `transform`/`opacity`/`filter` en animaciones nuevas. `backdrop-filter` JAMÁS sobre un elemento con texto.
- **Reduced motion, doble cinturón**: gate JS (`FX.reducedMotion`) + `@media (prefers-reduced-motion: reduce)`, que debe seguir siendo **el último bloque** de `liquid.css`.
- **Higiene**: listeners/timers en refs o cleanup de `useEffect`, siempre limpiados al desmontar.
- **JSX en este proyecto**: comentarios `{/* */}` SOLO en posición de children — jamás directamente tras `return (` ni dentro de un ternario (rompe Babel).
- **Copy**: español con tuteo, sentence case, sin emoji, metadatos con "·".
- **Commits en español**: `feat:`/`fix:`/`docs:`.
- **Tests**: `npm --prefix app test` debe dar **141/141** en cada tarea (cero cambios de backend). Requiere MariaDB local corriendo (credenciales en `app/.env`).
- **Verificación en el panel del navegador**: el panel congela rAF/IntersectionObserver/animaciones (`document.hidden === true`). Verifica CONTRATOS (clases, `getComputedStyle`, estado del DOM), no el *feel*. `read_console_messages` NO reporta excepciones no capturadas: instala el trap `window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));` tras cada recarga, antes de afirmar "cero errores". El dev server se lanza con `preview_start` (config `dev` de `.claude/launch.json`); los estáticos de `web/` se sirven frescos del disco (recarga con Ctrl+Shift+R o `navigate`).

---

### Task 1: `GateBackdrop` — la capa de video que se defiende sola

**Files:**
- Create: `app/web/screens/Gate.jsx`
- Create: `app/web/assets/README.md`
- Modify: `app/web/liquid.css` (nueva sección ANTES del `@media` final + 1 regla DENTRO del `@media`)
- Modify: `app/web/index.html` (un `<script>` nuevo)

**Interfaces:**
- Consumes: `window.FX.reducedMotion` (fx.js), clases CSS nuevas de esta misma tarea.
- Produces: **`window.GateBackdrop`** — componente React `GateBackdrop({ mode })` con `mode: "landing" | "login"`. En `"landing"` disuelve su lámina con el scroll (opacidad 1→0 en los primeros 0.9·vh) y pausa el video al llegar a 0; en `"login"` opacidad fija 1. La Task 3 lo monta en `App`.

- [ ] **Step 1: CSS de la puerta en `liquid.css`**

Insertar este bloque INMEDIATAMENTE ANTES de la línea `@media (prefers-reduced-motion: reduce) {` (el `@media` debe seguir siendo el último bloque del archivo):

```css
/* ---------- La puerta de entrada: el video compartido del landing y el login ---------- */
/* Después de .lg-noise en el DOM (a igual z-index, el orden de fuente decide): el video pinta
   ENCIMA de cuadrícula y ruido; cuando su lámina se disuelve al scrollear, el fondo vivo
   reaparece debajo. pointer-events: none — es fondo, jamás roba un click. */
.lg-gate {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
/* La lámina póster+video. Su opacidad la escribe GateBackdrop directo en el evento de scroll
   (una resta y un clamp por evento — sin rAF, y así verificable en el panel del tooling).
   Solo opacity: jamás layout. */
.lg-gate__frame { position: absolute; inset: 0; }
/* El póster va DEBAJO del video como background CSS: si el archivo no existe todavía, un
   background 404 no pinta nada ni rompe nada — queda la aurora. */
.lg-gate__poster {
  position: absolute;
  inset: 0;
  background-image: url("assets/gate-poster.jpg");
  background-size: cover;
  background-position: center;
}
.lg-gate__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* El scrim: contraste garantizado para el vidrio y el texto encima del video. Es un gradiente
   (sin blur y sin texto dentro), más denso hacia el centro-abajo, donde vive el formulario. */
.lg-gate__scrim {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(90% 70% at 50% 62%, rgba(5, 8, 18, 0.42), transparent 75%),
    linear-gradient(180deg, rgba(5, 8, 18, 0.20) 0%, rgba(5, 8, 18, 0.55) 100%);
}
```

Y DENTRO del `@media (prefers-reduced-motion: reduce)`, antes de su llave de cierre final, añadir:

```css
  /* Cinturón 2 de la puerta: el gate JS ni monta el video bajo reduced motion; si aun así
     existiera, se apaga y queda el póster estático (estado base visible ⇒ display: none). */
  .lg-gate__video { display: none !important; }
```

- [ ] **Step 2: Crear `app/web/screens/Gate.jsx`**

Contenido completo del archivo:

```jsx
// La puerta comparte fondo: un video montado UNA vez en App (fuera del div keyado), que el
// landing disuelve al scrollear y el login usa a plena presencia. Si el archivo no existe,
// el autoplay se bloquea o hay reduced motion, la puerta queda sobre la aurora de siempre:
// el diseño no depende del video para funcionar.
function GateBackdrop({ mode }) {
  const [failed, setFailed] = React.useState(false);
  const frameRef = React.useRef(null);  // la lámina póster+video (NO el video: la disolución
  const videoRef = React.useRef(null);  // debe funcionar también en modo sin video)
  const noVideo = failed || (window.FX && FX.reducedMotion);

  // La disolución del hero: en landing, la opacidad cae de 1 a 0 durante los primeros ~90vh
  // de scroll, y el video SE PAUSA al llegar a 0 (cero decodificación mientras no se ve).
  // El cálculo va directo en el evento (pasivo, sin rAF): es una resta y un clamp — y así
  // queda verificable en el panel del tooling, donde rAF jamás procesa.
  React.useEffect(() => {
    const apply = () => {
      const op = mode === "login" ? 1 : Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.9));
      if (frameRef.current) frameRef.current.style.opacity = String(op);
      const el = videoRef.current;
      if (el) {
        if (op === 0 && !el.paused) el.pause();
        else if (op > 0 && el.paused) {
          const p = el.play();
          if (p && p.catch) p.catch(() => {}); // autoplay bloqueado: queda el póster, sin ruido
        }
      }
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    return () => window.removeEventListener("scroll", apply);
  }, [mode, noVideo]);

  return (
    <div aria-hidden="true" className="lg-gate">
      <div ref={frameRef} className="lg-gate__frame">
        <div className="lg-gate__poster"></div>
        {!noVideo ? (
          <video
            ref={videoRef}
            className="lg-gate__video"
            autoPlay
            muted
            loop
            playsInline
            src="assets/gate.mp4"
            poster="assets/gate-poster.jpg"
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
      <div className="lg-gate__scrim"></div>
    </div>
  );
}

Object.assign(window, { GateBackdrop });
```

- [ ] **Step 3: Script en `index.html`**

Añadir DESPUÉS de la línea de `AppShell.jsx` y ANTES de la de `LoginScreen.jsx`:

```html
<script type="text/babel" src="/screens/Gate.jsx"></script>
```

- [ ] **Step 4: Crear `app/web/assets/README.md`**

Contenido completo (crea la carpeta `app/web/assets/`):

```markdown
# Assets de la puerta

Aquí viven los archivos que entrega el usuario para el fondo de la puerta de entrada:

- `gate.mp4` — el video (MP4 H.264, 1920×1080, 24–30 fps, 10–20 s en loop perfecto, sin audio, ≤ 12 MB).
  Contenido: aurora en movimiento + código flotante; paleta fría oscura; zona central tranquila; sin texto ni logos.
- `gate-poster.jpg` — un frame quieto del video (fallback estático y póster de reduced motion).

La app funciona sin ellos (queda la aurora); al soltarlos aquí aparecen solos. Contrato completo:
`docs/superpowers/specs/2026-07-18-puerta-de-entrada-design.md` §2.
```

- [ ] **Step 5: Guardia de backend**

Run: `npm --prefix app test`
Expected: **141/141 pass** (cero cambios de backend).

- [ ] **Step 6: Verificación por contrato en el panel**

Con el dev server arriba (`preview_start`, config `dev`), recargar y ejecutar:

```js
window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));
const probe = document.createElement("div"); probe.className = "lg-gate"; document.body.appendChild(probe);
const cs = getComputedStyle(probe);
const out = {
  gateGlobal: typeof window.GateBackdrop === "function",
  cssPosition: cs.position, cssZ: cs.zIndex, cssPE: cs.pointerEvents,
  errs: window.__errs.length,
};
probe.remove();
out;
```

Expected: `{ gateGlobal: true, cssPosition: "fixed", cssZ: "-1", cssPE: "none", errs: 0 }`. (El componente aún no se monta en `App` — eso es de la Task 3.)

- [ ] **Step 7: Commit**

```bash
git add app/web/screens/Gate.jsx app/web/assets/README.md app/web/liquid.css app/web/index.html
git commit -m "feat: GateBackdrop — la capa de video de la puerta, con fallback y doble cinturon"
```

---

### Task 2: El login rediseñado

**Files:**
- Modify: `app/web/screens/LoginScreen.jsx` (archivo completo reemplazado abajo)
- Modify: `app/web/liquid.css` (clase `.lg-back` antes del `@media` + 1 regla dentro)

**Interfaces:**
- Consumes: `KIcon`, `ICONS` (globales de AppShell.jsx, ya cargado antes), clases `anim-condense`/`anim-condense--delayed` (motion.css, existentes).
- Produces: **`LoginScreen({ onLoggedIn, initialMode, onBack })`** — `initialMode: "login" | "register" | undefined` (undefined ⇒ "login"); `onBack` opcional: si viene, se muestra "← Volver". La Task 3 pasa ambos desde `app.jsx`.

- [ ] **Step 1: CSS del enlace Volver en `liquid.css`**

Insertar ANTES del `@media` final (después del bloque `.lg-gate__scrim` de la Task 1):

```css
/* ---------- La puerta: el enlace Volver del login ---------- */
.lg-back {
  position: fixed;
  top: 24px;
  left: 28px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-pill);
  transition: color var(--duration-fast) var(--ease-glass);
}
.lg-back:hover { color: var(--text-primary); }
```

Y DENTRO del `@media` final, junto a la regla `.lg-gate__video` de la Task 1:

```css
  .lg-back { transition: none !important; }
```

- [ ] **Step 2: Reemplazar `app/web/screens/LoginScreen.jsx` completo**

```jsx
const KITL = window.CodingDesignSystem_2ecb3a;

function LoginScreen({ onLoggedIn, initialMode, onBack }) {
  const { GlassPanel, Input, Button, Checkbox } = KITL;
  const [mode, setMode] = React.useState(initialMode === "register" ? "register" : "login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const isLogin = mode === "login";

  const switchMode = (e, m) => { e.preventDefault(); setMode(m); setError(null); };

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = isLogin
        ? await API.post("/auth/login", { email, password, remember })
        : await API.post("/auth/register", { name, email, password });
      API.setToken(data.token);
      onLoggedIn();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      {onBack ? (
        <button className="lg-back" onClick={onBack}>
          <KIcon d={ICONS.back} size={14} />
          Volver
        </button>
      ) : null}
      <div style={{ width: 420 }}>
        {/* El logo con más protagonismo (56px) — se condensa sobre el video. */}
        <div className="anim-condense" style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)", lineHeight: 1 }}>
            Coding<span style={{ display: "inline-block", width: 6, height: 42, marginLeft: 10, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 16px var(--accent-cyan)" }}></span>
          </div>
          <div style={{ marginTop: 12, fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>Aprende Ingeniería de Software, una lección a la vez</div>
        </div>
        {/* El panel entra condensándose (clase en wrapper propio: el DS no reenvía className).
            El blur del panel refracta el video en movimiento: el momento visual de la pantalla. */}
        <div className="anim-condense anim-condense--delayed">
          <GlassPanel strength="strong" padding="var(--space-7)" radius="var(--radius-xl)">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {!isLogin ? (
                <Input label="Nombre completo" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
              ) : null}
              <Input label="Correo institucional" placeholder="tu@universidad.edu" value={email} onChange={(e) => setEmail(e.target.value)} iconLeft={<KIcon d="M2.5 4.5h11v7h-11v-7zM2.5 5l5.5 4 5.5-4" />} />
              <Input label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} iconLeft={<KIcon d={ICONS.lock} />} />
              {error ? <div style={{ fontSize: "var(--text-sm)", color: "#E67984" }}>{error}</div> : null}
              {isLogin ? (
                <Checkbox checked={remember} onChange={setRemember} label="Recordarme" />
              ) : null}
              <Button fullWidth size="lg" disabled={loading} onClick={submit}>
                {loading ? "Un momento…" : isLogin ? "Entrar" : "Crear cuenta"}
              </Button>
              <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
                {isLogin
                  ? <React.Fragment>¿Primera vez? <a href="#" onClick={(e) => switchMode(e, "register")}>Crea tu cuenta</a></React.Fragment>
                  : <React.Fragment>¿Ya tienes cuenta? <a href="#" onClick={(e) => switchMode(e, "login")}>Entrar</a></React.Fragment>}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { LoginScreen });
```

Cambios vs. el actual: firma con `initialMode`/`onBack`; logo 44→56 (barra 5×34→6×42); wrappers `anim-condense` (header) y `anim-condense anim-condense--delayed` (panel); **eliminado** el enlace muerto "¿Olvidaste tu contraseña?" (la fila del Recordarme queda solo con el Checkbox); botón Volver condicional. La lógica de submit/toggle NO cambia.

- [ ] **Step 3: Guardia de backend**

Run: `npm --prefix app test`
Expected: **141/141 pass**.

- [ ] **Step 4: Verificación por contrato en el panel**

Sin token (ejecutar `localStorage.clear()` y recargar — la app sigue abriendo en login hasta la Task 3), con el trap instalado:

```js
const logo = [...document.querySelectorAll("div")].find((d) => d.textContent === "Coding" && d.querySelector("span"));
({
  logoSize: getComputedStyle(logo).fontSize,
  condensers: document.querySelectorAll(".anim-condense").length,
  forgotGone: !document.body.textContent.includes("Olvidaste"),
  backHidden: !document.querySelector(".lg-back"),
  errs: window.__errs.length,
})
```

Expected: `{ logoSize: "56px", condensers: 2, forgotGone: true, backHidden: true, errs: 0 }`.
Después: click en "Crea tu cuenta" ⇒ aparece el campo "Nombre completo" y desaparece el Checkbox (toggle intacto). Login con `juan@test.dev` / `secreto1` ⇒ llega al dashboard.

- [ ] **Step 5: Commit**

```bash
git add app/web/screens/LoginScreen.jsx app/web/liquid.css
git commit -m "feat: login redisenado — logo protagonista, condensacion, initialMode y Volver"
```

---

### Task 3: El landing (hero + catálogo + cierre) y el routing de la puerta

**Files:**
- Create: `app/web/screens/LandingScreen.jsx`
- Modify: `app/web/app.jsx` (ruta inicial, ramas de pantalla, montaje de GateBackdrop, scroll al cambiar de vista)
- Modify: `app/web/index.html` (un `<script>` nuevo)
- Modify: `app/web/liquid.css` (hero + hint, antes del `@media` + 1 regla dentro)

**Interfaces:**
- Consumes: `GateBackdrop({ mode })` (Task 1), `LoginScreen({ onLoggedIn, initialMode, onBack })` (Task 2), `TiltCard`/`KIcon`/`ICONS` (AppShell), `Liquid.reveal(container)` (liquid.js), clase `lg-reveal` (liquid.css).
- Produces: **`LandingScreen({ onStart, onLogin })`** — `onStart()` navega a login modo registro; `onLogin()` a login modo entrar. El render deja el hueco del Acto 2 (lo llena la Task 4).

- [ ] **Step 1: CSS del hero en `liquid.css`**

Insertar ANTES del `@media` final (tras el bloque `.lg-back`):

```css
/* ---------- El landing: hero sobre el video ---------- */
.lg-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}
/* La pista de scroll: respira con transform, nada de layout. */
.lg-hero__hint {
  position: absolute;
  bottom: 26px;
  left: 50%;
  margin-left: -11px;
  color: var(--text-tertiary);
  animation: lg-hint 2.2s var(--ease-glass) infinite;
}
@keyframes lg-hint {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(7px); opacity: 1; }
}
```

Y DENTRO del `@media` final:

```css
  /* Una pista de movimiento sin movimiento no informa: fuera entera. */
  .lg-hero__hint { display: none !important; }
```

- [ ] **Step 2: Crear `app/web/screens/LandingScreen.jsx`**

Contenido completo:

```jsx
const KITLD = window.CodingDesignSystem_2ecb3a;

// Colores de materia: la paleta compartida del proyecto (la misma de FX.burst).
const LANDING_TONES = { blue: "#5E97E6", cyan: "#52C9B8", violet: "#9289E3", amber: "#E6AF6B" };

// Catálogo estático: espejo del seed (esto es marketing, no datos vivos — GET /courses exige
// token). Se actualiza a mano en cada iteración de contenido, como los logros de catálogo.
const LANDING_COURSES = [
  { id: "bd1", subject: "Bases de datos I", title: "Modelo relacional", tone: "cyan",
    description: "Domina tablas, claves, consultas SQL y normalización — la base de todo sistema de información." },
  { id: "bd2", subject: "Bases de datos II", title: "Transacciones y triggers", tone: "cyan",
    description: "Transacciones seguras, triggers, procedimientos y rendimiento — bases de datos en producción.",
    lock: "Se abre al terminar Bases de datos I" },
  { id: "prog1", subject: "Programación I", title: "Fundamentos y control de flujo", tone: "blue",
    description: "Tus primeros programas en Java: variables, condicionales, bucles y funciones." },
  { id: "prog2", subject: "Programación II", title: "Herencia y polimorfismo", tone: "blue",
    description: "Programación orientada a objetos en Java: clases, herencia, polimorfismo y colecciones." },
  { id: "algo", subject: "Algoritmos", title: "Recursión y complejidad", tone: "violet",
    description: "Piensa como computador: análisis de complejidad, recursión y los algoritmos clásicos." },
  { id: "web", subject: "Desarrollo web", title: "HTML, CSS y JavaScript", tone: "amber",
    description: "Construye para el navegador: estructura con HTML, estilo con CSS y comportamiento con JavaScript." },
  { id: "reqsw", subject: "Ingeniería de software", title: "Ingeniería de requisitos", tone: "violet",
    description: "Aprende a descubrir, escribir y cuidar lo que el software debe hacer — antes de escribir una línea de código." },
  { id: "uml", subject: "Ingeniería de software", title: "Modelado con UML", tone: "violet",
    description: "Dibuja lo que el software es y lo que hace: los nueve diagramas que convierten requisitos en diseño.",
    lock: "Se abre al terminar Ingeniería de requisitos" },
];

// Acto 1 — el hero sobre el video: logo, titular y los dos CTAs de la puerta.
function HeroAct({ onStart, onLogin }) {
  const { Button } = KITLD;
  return (
    <section className="lg-hero">
      <div className="anim-condense">
        <div style={{ fontFamily: "var(--font-display)", fontSize: 64, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)", lineHeight: 1 }}>
          Coding<span style={{ display: "inline-block", width: 7, height: 48, marginLeft: 12, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 18px var(--accent-cyan)" }}></span>
        </div>
      </div>
      <div className="anim-condense anim-condense--delayed" style={{ maxWidth: 640 }}>
        <h1 style={{ margin: "26px 0 0", fontSize: 40, lineHeight: 1.15, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
          Aprende Ingeniería de Software como si fuera un juego
        </h1>
        <p style={{ margin: "16px 0 0", fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>
          Lecciones cortas, ejercicios interactivos y una racha que no vas a querer romper.
        </p>
      </div>
      <div className="anim-condense anim-condense--delayed" style={{ display: "flex", gap: 14, marginTop: 34 }}>
        <Button size="lg" onClick={onStart}>Empieza a programar</Button>
        <Button size="lg" variant="secondary" onClick={onLogin}>Ya tengo cuenta</Button>
      </div>
      <span aria-hidden className="lg-hero__hint"><KIcon d="M4 6l4 4 4-4" size={22} /></span>
    </section>
  );
}

// Acto 3 — el catálogo: 8 tarjetas con su tono real, condensación en cascada y cursor-luz.
function CatalogAct() {
  const { GlassPanel } = KITLD;
  return (
    <section style={{ maxWidth: 1160, margin: "0 auto", padding: "96px 32px 40px" }}>
      <div className="lg-reveal" style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 style={{ margin: 0, fontSize: 30, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
          Todo el plan, una lección a la vez
        </h2>
        <p style={{ margin: "10px 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
          Ocho cursos que se desbloquean a tu ritmo.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {LANDING_COURSES.map((c) => (
          <div key={c.id} className="lg-reveal">
            <TiltCard accent={c.tone}>
              {/* content-box del DS: height 100% + padding necesita border-box por style. */}
              <GlassPanel padding="var(--space-5)" style={{ height: "100%", boxSizing: "border-box" }}>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: LANDING_TONES[c.tone] }}>{c.subject}</div>
                <div style={{ margin: "6px 0 4px", fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>{c.title}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{c.description}</div>
                {c.lock ? (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                    <KIcon d={ICONS.lock} size={12} />
                    {c.lock}
                  </div>
                ) : null}
              </GlassPanel>
            </TiltCard>
          </div>
        ))}
      </div>
    </section>
  );
}

// Acto 4 — el cierre: remate corto con el mismo CTA del hero. Pie mínimo, sin enlaces falsos.
function CierreAct({ onStart }) {
  const { Button } = KITLD;
  return (
    <section style={{ maxWidth: 1160, margin: "0 auto", padding: "56px 32px 96px", textAlign: "center" }}>
      <div className="lg-reveal">
        <h2 style={{ margin: 0, fontSize: 30, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
          Tu primera lección te espera
        </h2>
        <div style={{ marginTop: 24 }}>
          <Button size="lg" onClick={onStart}>Empieza a programar</Button>
        </div>
        <p style={{ margin: "48px 0 0", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          Coding — un proyecto de aprendizaje personal
        </p>
      </div>
    </section>
  );
}

function LandingScreen({ onStart, onLogin }) {
  const rootRef = React.useRef(null);
  React.useEffect(() => Liquid.reveal(rootRef.current), []);
  return (
    <div ref={rootRef}>
      <HeroAct onStart={onStart} onLogin={onLogin} />
      {/* Acto 2 (cómo funciona, scrollytelling) llega en la siguiente tarea. */}
      <CatalogAct />
      <CierreAct onStart={onStart} />
    </div>
  );
}

Object.assign(window, { LandingScreen });
```

- [ ] **Step 3: Script en `index.html`**

Añadir DESPUÉS de la línea de `Gate.jsx` y ANTES de la de `LoginScreen.jsx`:

```html
<script type="text/babel" src="/screens/LandingScreen.jsx"></script>
```

- [ ] **Step 4: El routing de la puerta en `app.jsx`** — cuatro ediciones exactas:

**(a)** La ruta inicial. Reemplazar:

```jsx
  const [route, setRoute] = React.useState({ screen: API.token ? "loading" : "login" });
```

por:

```jsx
  // Sin token, la llegada fresca cae en el landing. Cerrar sesión y la expiración caen en
  // "login" directo (ya conoces el producto) — esos caminos no cambian.
  const [route, setRoute] = React.useState({ screen: API.token ? "loading" : "landing" });
```

**(b)** El scroll de la puerta. Añadir INMEDIATAMENTE DESPUÉS del `useEffect` de `API.onUnauthorized` (el que termina en `if (API.token) loadMe();`):

```jsx
  // La puerta abre siempre arriba: el landing puede estar scrolleado al pulsar un CTA.
  React.useEffect(() => {
    if (route.screen === "landing" || route.screen === "login") window.scrollTo(0, 0);
  }, [route.screen]);
```

**(c)** Las ramas de pantalla. Reemplazar:

```jsx
  let screen;
  if (route.screen === "login") {
    screen = <LoginScreen onLoggedIn={() => { setRoute({ screen: "loading" }); loadMe(); }} />;
  } else if (route.screen === "loading" || !me) {
```

por:

```jsx
  let screen;
  if (route.screen === "landing") {
    screen = <LandingScreen
      onStart={() => setRoute({ screen: "login", mode: "register" })}
      onLogin={() => setRoute({ screen: "login", mode: "login" })} />;
  } else if (route.screen === "login") {
    screen = <LoginScreen initialMode={route.mode} onBack={() => setRoute({ screen: "landing" })}
      onLoggedIn={() => { setRoute({ screen: "loading" }); loadMe(); }} />;
  } else if (route.screen === "loading" || !me) {
```

**(d)** El montaje del video y el marco. Reemplazar:

```jsx
  const conSesion = route.screen !== "login" && route.screen !== "loading" && me;
```

por:

```jsx
  const conSesion = route.screen !== "landing" && route.screen !== "login" && route.screen !== "loading" && me;
  const enPuerta = route.screen === "landing" || route.screen === "login";
```

y reemplazar:

```jsx
      <span aria-hidden className="lg-noise"></span>
```

por:

```jsx
      <span aria-hidden className="lg-noise"></span>
      {enPuerta ? <GateBackdrop mode={route.screen} /> : null}
```

(El `GateBackdrop` queda FUERA del div keyado, después del `.lg-noise` — a igual `z-index: -1`, el orden de fuente lo pinta encima de cuadrícula y ruido, y navegar landing⇄login no lo remonta.)

- [ ] **Step 5: Guardia de backend**

Run: `npm --prefix app test`
Expected: **141/141 pass**.

- [ ] **Step 6: Verificación por contrato en el panel**

Sin token (`localStorage.clear()` + recarga), trap instalado:

```js
({
  enLanding: !!document.querySelector(".lg-hero"),
  gate: !!document.querySelector(".lg-gate"),
  gateFueraDelKeyado: !document.querySelector(".anim-screen-in .lg-gate"),
  ctas: [...document.querySelectorAll("button")].map((b) => b.textContent).filter((t) => t.includes("Empieza") || t.includes("Ya tengo")).length,
  tarjetas: document.querySelectorAll(".lg-reveal").length >= 10,
  errs: window.__errs.length,
})
```

Expected: `{ enLanding: true, gate: true, gateFueraDelKeyado: true, ctas: 2, tarjetas: true, errs: 0 }`.

Después, la navegación completa de la puerta (clicks reales):
1. "Empieza a programar" ⇒ login con campo "Nombre completo" visible (modo registro), `.lg-back` presente, `window.scrollY === 0`.
2. "Volver" ⇒ landing de nuevo.
3. "Ya tengo cuenta" ⇒ login SIN campo "Nombre completo" (modo entrar).
4. El `.lg-gate` es EL MISMO nodo entre landing y login (guardar referencia antes: `window.__g = document.querySelector(".lg-gate")` ⇒ tras navegar, `document.querySelector(".lg-gate") === window.__g` ⇒ `true`: no se remontó).
5. Login con `juan@test.dev` / `secreto1` ⇒ dashboard, y `document.querySelector(".lg-gate") === null` (el video no vive con sesión).
6. Cerrar sesión desde el avatar ⇒ cae en **login** (no landing).
7. La disolución sin rAF: en el landing, `window.scrollTo(0, Math.round(innerHeight * 0.45)); dispatchEvent(new Event("scroll"));` ⇒ `document.querySelector(".lg-gate__frame").style.opacity` ≈ `"0.5"` (±0.05); a `innerHeight` ⇒ `"0"`.
8. `window.__errs.length === 0` al final de todo el recorrido.

- [ ] **Step 7: Commit**

```bash
git add app/web/screens/LandingScreen.jsx app/web/app.jsx app/web/index.html app/web/liquid.css
git commit -m "feat: el landing (hero, catalogo, cierre) y el routing de la puerta"
```

---

### Task 4: El scrollytelling — cómo funciona una lección

**Files:**
- Modify: `app/web/screens/LandingScreen.jsx` (añadir `SCROLLY_STEPS`, `useScrollStage`, `LessonMock`, `ScrollyAct`, `ScrollyStatic`; actualizar el render de `LandingScreen`)
- Modify: `app/web/liquid.css` (clases del track pinned, antes del `@media`)

**Interfaces:**
- Consumes: `usePhase(value, outMs)` (AppShell — retiene el valor anterior durante la fase de salida, devuelve `{ shown, phase }`), `Orb({ size, mood })` (Orb.jsx), clases `anim-melt-out`/`anim-melt-in`/`anim-drop-in`/`anim-pop` (motion.css, existentes — ya cubiertas por su `@media`).
- Produces: la sección pinned dentro de `LandingScreen`; nada nuevo en `window`.

- [ ] **Step 1: CSS del track en `liquid.css`**

Insertar ANTES del `@media` final (tras el bloque del hero de la Task 3):

```css
/* ---------- El landing: scrollytelling pinned ---------- */
/* El track alto da el recorrido; la escena queda fijada con sticky (sin secuestrar el scroll:
   si scrolleas rápido, las etapas pasan rápido). La etapa la decide useScrollStage por umbral. */
.lg-scrolly { position: relative; height: 350vh; }
.lg-scrolly__stage {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

(Nada nuevo dentro del `@media`: bajo reduced motion el track ni se monta — gate JS en el Step 3 — y las clases de coreografía ya están cubiertas por el `@media` de `motion.css`.)

- [ ] **Step 2: Añadir las piezas del scrollytelling a `LandingScreen.jsx`**

Insertar DESPUÉS de `LANDING_COURSES` y ANTES de `function HeroAct`:

```jsx
const SCROLLY_STEPS = [
  { k: "Teoría", copy: "La teoría, en bloques cortos y con el código delante." },
  { k: "Ejercicio", copy: "Cada lección se practica al momento, sin salir de ella." },
  { k: "Feedback", copy: "Sabes al instante si acertaste — y por qué." },
  { k: "Celebración", copy: "Cada lección suma XP. Cada día seguido, racha." },
];

// Progreso de scroll dentro del track → etapa discreta 0..count-1. Listener directo (sin
// rAF, a propósito: la cuenta es una resta y un clamp por evento, y así queda verificable
// en el panel del tooling, donde rAF jamás procesa). Reversible: la etapa es función del
// scroll, no una animación de una vía.
function useScrollStage(trackRef, count) {
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let top = 0, span = 1;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      top = rect.top + window.scrollY; // rect.top es relativo al viewport
      span = Math.max(1, el.offsetHeight - window.innerHeight);
    };
    const onScroll = () => {
      const p = Math.min(1, Math.max(0, (window.scrollY - top) / span));
      setStage(Math.min(count - 1, Math.floor(p * count)));
    };
    const onResize = () => { measure(); onScroll(); };
    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [count]);
  return stage;
}

// La maqueta: una lección de mentira que imita el lenguaje real (melt entre etapas, banda
// que cae, celebración) con piezas propias — NO reutiliza LessonScreen. usePhase da el melt:
// la etapa vieja se funde (anim-melt-out, 160ms) y la nueva emerge (anim-melt-in).
function LessonMock({ stage }) {
  const { GlassPanel } = KITLD;
  const { shown, phase } = usePhase(stage, 160);
  const opciones = [
    "Que la tabla tenga índices",
    "Que cada fila sea única e identificable",
    "Que las consultas corran más rápido",
    "Que no haga falta normalizar",
  ];

  let cuerpo;
  if (shown === 0) {
    cuerpo = (
      <React.Fragment>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: LANDING_TONES.cyan }}>Bases de datos I · Lección 2</div>
        <div style={{ margin: "8px 0 10px", fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>La clave primaria</div>
        <p style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          Toda tabla necesita una columna que identifique cada fila sin ambigüedad. En la biblioteca, el ISBN identifica cada libro.
        </p>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--accent-cyan)", background: "rgba(3,6,16,0.45)", border: "1px solid var(--glass-stroke)", borderRadius: "var(--radius-sm)", padding: "10px 12px", whiteSpace: "pre", overflowX: "auto" }}>
          {"SELECT titulo FROM libros\nWHERE isbn = '978-84-376-0494-7';"}
        </div>
      </React.Fragment>
    );
  } else if (shown === 3) {
    cuerpo = (
      <div style={{ textAlign: "center", padding: "18px 0 8px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><Orb size={54} mood="celebrate" /></div>
        <div className="anim-pop" style={{ margin: "14px 0 4px", fontSize: 34, fontWeight: "var(--weight-heavy)", fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>+50 XP</div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Lección completada — tu racha sigue viva</div>
      </div>
    );
  } else {
    cuerpo = (
      <React.Fragment>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: LANDING_TONES.cyan }}>Ejercicio 1 de 2</div>
        <div style={{ margin: "8px 0 12px", fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>¿Qué garantiza una clave primaria?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opciones.map((o, i) => {
            const marcada = i === 1;
            return (
              <div key={i} style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid " + (marcada ? "rgba(82,201,184,0.55)" : "var(--glass-stroke)"), background: marcada ? "rgba(82,201,184,0.10)" : "var(--glass-bg-subtle)", fontSize: "var(--text-sm)", color: marcada ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {o}
              </div>
            );
          })}
        </div>
        {shown === 2 ? (
          <div className="anim-drop-in" style={{ marginTop: 12, padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(82,201,184,0.55)", background: "rgba(82,201,184,0.14)" }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: LANDING_TONES.cyan }}>Correcto</div>
            <div style={{ marginTop: 2, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>Cada fila queda identificada de forma única — nadie puede duplicar un ISBN.</div>
          </div>
        ) : null}
      </React.Fragment>
    );
  }

  return (
    <div className={phase === "out" ? "anim-melt-out" : "anim-melt-in"} style={{ width: 400 }}>
      <GlassPanel strength="strong" padding="var(--space-6)" radius="var(--radius-lg)">
        {cuerpo}
      </GlassPanel>
    </div>
  );
}

// Acto 2 — el scrollytelling: la escena queda fijada mientras el copy y la maqueta avanzan
// con tu scroll por las 4 etapas del loop de aprender.
function ScrollyAct() {
  const trackRef = React.useRef(null);
  const stage = useScrollStage(trackRef, 4);
  return (
    <section ref={trackRef} className="lg-scrolly">
      <div className="lg-scrolly__stage">
        <div style={{ display: "flex", alignItems: "center", gap: 56, maxWidth: 1000, padding: "0 32px" }}>
          <div style={{ flex: "0 0 320px", textAlign: "left" }}>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Cómo funciona</div>
            <h2 style={{ margin: "10px 0 22px", fontSize: 30, lineHeight: 1.2, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Una lección se siente así</h2>
            {SCROLLY_STEPS.map((s, i) => (
              <div key={s.k} style={{ marginBottom: 14, opacity: i === stage ? 1 : 0.38, transform: i === stage ? "none" : "translateY(2px)", transition: "opacity 320ms var(--ease-glass), transform 320ms var(--ease-glass)" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: i === stage ? LANDING_TONES.cyan : "var(--text-secondary)" }}>{i + 1} · {s.k}</div>
                <div style={{ marginTop: 2, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{s.copy}</div>
              </div>
            ))}
          </div>
          <LessonMock stage={stage} />
        </div>
      </div>
    </section>
  );
}

// Reduced motion: sin pinned — las cuatro etapas apiladas como tarjetas estáticas, todo
// visible, cero animación (gate JS; el cinturón CSS ya cubre las clases de coreografía).
function ScrollyStatic() {
  const { GlassPanel } = KITLD;
  return (
    <section style={{ maxWidth: 760, margin: "0 auto", padding: "96px 32px 0" }}>
      <h2 style={{ margin: "0 0 22px", fontSize: 30, textAlign: "center", fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Una lección se siente así</h2>
      {SCROLLY_STEPS.map((s, i) => (
        <div key={s.k} style={{ marginBottom: 14 }}>
          <GlassPanel padding="var(--space-5)">
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: LANDING_TONES.cyan }}>{i + 1} · {s.k}</div>
            <div style={{ marginTop: 4, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{s.copy}</div>
          </GlassPanel>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 3: Actualizar el render de `LandingScreen`**

Reemplazar:

```jsx
      <HeroAct onStart={onStart} onLogin={onLogin} />
      {/* Acto 2 (cómo funciona, scrollytelling) llega en la siguiente tarea. */}
      <CatalogAct />
```

por:

```jsx
      <HeroAct onStart={onStart} onLogin={onLogin} />
      {window.FX && FX.reducedMotion ? <ScrollyStatic /> : <ScrollyAct />}
      <CatalogAct />
```

- [ ] **Step 4: Guardia de backend**

Run: `npm --prefix app test`
Expected: **141/141 pass**.

- [ ] **Step 5: Verificación por contrato en el panel**

Sin token, en el landing, trap instalado. Las etapas se fuerzan con scroll real + evento (sin rAF de por medio):

```js
const track = document.querySelector(".lg-scrolly");
const top = track.getBoundingClientRect().top + scrollY;
const span = track.offsetHeight - innerHeight;
const puntos = [0.1, 0.35, 0.6, 0.9].map((f) => {
  window.scrollTo(0, Math.round(top + span * f));
  window.dispatchEvent(new Event("scroll"));
  return document.querySelector(".lg-scrolly__stage").textContent;
});
({
  sticky: getComputedStyle(document.querySelector(".lg-scrolly__stage")).position === "sticky",
  e1: puntos[0].includes("La clave primaria"),
  e2: puntos[1].includes("¿Qué garantiza una clave primaria?") && !puntos[1].includes("Correcto"),
  e3: puntos[2].includes("Correcto"),
  e4: puntos[3].includes("+50 XP"),
  errs: window.__errs.length,
})
```

Expected: `{ sticky: true, e1: true, e2: true, e3: true, e4: true, errs: 0 }`.

**Nota de timing (usePhase):** el swap de etapa tarda 160ms (fase de salida). Si un punto sale con el contenido de la etapa anterior, espera ~200ms tras el `dispatchEvent` y relee (`setTimeout` SÍ corre en el panel — hazlo dentro del mismo script, no entre llamadas de herramienta).

Después: reversibilidad (scrollear de vuelta a `0.1` ⇒ reaparece "La clave primaria"); y reduced motion: `FX.reducedMotion = true` + remontar el landing (navegar a login y volver) ⇒ NO hay `.lg-scrolly`, hay 4 tarjetas apiladas con "Una lección se siente así", y no hay `<video>` en `.lg-gate`. Restaurar `FX.reducedMotion = false` al terminar.

- [ ] **Step 6: Commit**

```bash
git add app/web/screens/LandingScreen.jsx app/web/liquid.css
git commit -m "feat: el scrollytelling — una leccion de mentira que avanza con tu scroll"
```

---

### Task 5: Verificación E2E + prompt maestro al día

**Files:**
- Modify: `prompt-maestro.md` (§ cabecera, §2, §4, §8, §11)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: la iteración cerrada y documentada (regla del usuario: cambio significativo ⇒ prompt maestro al día en la misma sesión).

- [ ] **Step 1: Checklist E2E completo en el panel**

Recorrido entero con trap instalado, partiendo sin token:

1. Llegada fresca ⇒ landing (hero + CTAs + catálogo + cierre; `.lg-gate` presente).
2. Scroll del landing arriba-abajo: disolución del frame (opacidad 0 al pasar 0.9·vh), etapas 1→4 del scrolly, tarjetas del catálogo con `.lg-reveal` (en el panel el IO no dispara: forzar con `Liquid.reveal` re-invocado o verificar clases), cierre con CTA.
3. "Empieza a programar" ⇒ registro; crear una cuenta nueva (email único) ⇒ dashboard completo.
4. Cerrar sesión ⇒ login (no landing). "Volver" ⇒ landing. "Ya tengo cuenta" ⇒ login modo entrar ⇒ `juan@test.dev` / `secreto1` ⇒ dashboard.
5. El mismo nodo `.lg-gate` sobrevive landing⇄login (referencia guardada); desaparece con sesión.
6. Fallback: con el video ausente (no hay `assets/gate.mp4` aún), `window.__errs.length === 0` en todo el recorrido — el `onError` del video es silencioso por diseño.
7. `npm --prefix app test` ⇒ **141/141**.

- [ ] **Step 2: Actualizar `prompt-maestro.md`**

**(a)** Cabecera — reemplazar las líneas de "Última actualización" y "Qué cambió"/"Qué está pendiente" por:

```markdown
> Documento de contexto total del proyecto. **Léelo completo antes de trabajar en él desde una conversación nueva.**
> Última actualización: **2026-07-18**, tras fusionar la 12ª iteración ("La puerta de entrada") a `master`.
>
> **Qué cambió en la última tanda:** la 12ª iteración construyó **la puerta de entrada** — un landing pre-login de cuatro actos (hero sobre video, scrollytelling pinned, catálogo, cierre) y el login rediseñado sobre el mismo video, montado una sola vez en `App`. **Regla de proceso nueva pedida por el usuario: todo cambio significativo queda reflejado en este documento en la misma sesión.** Detalle en §2.
> **Qué está pendiente:** el usuario debe **crear el video en Claude Design** y soltarlo en `app/web/assets/` (la puerta funciona sin él, sobre la aurora); la **pasada de verificación humana** acumulada (§11) suma ahora el *feel* de la puerta (pinned, disolución, condensación del panel) y la legibilidad sobre el video real.
```

**(b)** §2 — añadir la fila 12 a la tabla, después de la fila 11 (Modelado con UML) y antes de la fila del fix del `context`:

```markdown
| 12 | **La puerta de entrada** (`2026-07-18-puerta-de-entrada`) | El pre-login completo: **landing** de cuatro actos — hero sobre **video** aurora+código (asset del usuario, contrato en el spec §2), **scrollytelling pinned** donde una lección de mentira avanza 4 etapas con el scroll (sticky + listener directo sin rAF, reversible), catálogo estático de los 8 cursos con tilt, cierre con CTA — y el **login rediseñado** sobre el mismo video (`GateBackdrop` montado UNA vez en `App`, fuera del div keyado: landing⇄login no lo reinicia), que **se defiende solo** si el video falta (aurora; `onError` silencioso; reduced motion a doble cinturón). Llegada fresca → landing; logout/expiración → login directo. Cero backend. |
```

**(c)** §4 — en el árbol del repositorio, reemplazar la línea:

```
    │   └── screens/                     ← Orb, AppShell (NavBar, NavTabs, TiltCard, PageFrame, hooks), Login,
```

y su continuación por:

```
    │   ├── assets/                      ← gate.mp4 + gate-poster.jpg (los entrega el usuario; README con el contrato)
    │   └── screens/                     ← Orb, AppShell (NavBar, NavTabs, TiltCard, PageFrame, hooks), Gate
    │                                      (GateBackdrop), Landing, Login, Inicio, Materias, Course, exercises,
    │                                      Lesson (+Celebration +FeedbackBand), Review, Progress, Profile —
    │                                      content-only (sin marco propio)
```

**(d)** §8 — añadir al final de la lista de patrones obligatorios:

```markdown
- **La puerta de entrada** (pre-login): estados sin token `landing` (por defecto) y `login` (con `mode` en la ruta); `GateBackdrop` (video + póster + scrim) vive en `App` fuera del div keyado y solo sin sesión — no lo montes en ninguna pantalla. El video es **mejora progresiva**: la puerta funciona sin `assets/gate.mp4`. El catálogo del landing es **copy estático espejo del seed** (se actualiza a mano en cada iteración de contenido, como los logros de catálogo). Logout/expiración → `login` directo, jamás al landing.
```

**(e)** §11 — en "Lo primero: la pasada de verificación humana", añadir al final de la lista de ítems del punto (c):

```markdown
- **La puerta de entrada** (12ª): crear el video en Claude Design y soltarlo en `assets/`; juzgar la legibilidad del hero y el formulario **sobre el video real**; el *feel* del scrollytelling pinned (ritmo de 4 etapas en 350vh), la disolución del hero al scrollear y la condensación del panel del login.
```

- [ ] **Step 3: Commit**

```bash
git add prompt-maestro.md
git commit -m "docs: prompt maestro al dia tras la 12a iteracion (la puerta de entrada)"
```

---

## Self-review del plan (hecho al escribirlo)

- **Cobertura del spec**: §1 routing (T3), §2 contrato del video (T1 README + queda en el spec), §3 GateBackdrop (T1), §4 actos 1/3/4 (T3) y acto 2 (T4), §5 login (T2), §6 gates (repartidos), §7 verificación (T5 + por tarea), §8 prompt maestro (T5). El ripple quedó FUERA por enmienda del spec (contrato del host vs. halo del Button).
- **Tipos y nombres cruzados**: `GateBackdrop({ mode })` (T1→T3), `LoginScreen({ onLoggedIn, initialMode, onBack })` (T2→T3), `LandingScreen({ onStart, onLogin })` (T3→app.jsx), `useScrollStage(trackRef, count)` y `LessonMock({ stage })` (T4 interno), `LANDING_TONES`/`LANDING_COURSES`/`SCROLLY_STEPS` (T3/T4, mismo archivo). Consistentes.
- **Sin placeholders**: todo el código está completo; el único hueco intencional (comentario del Acto 2 en T3) lo llena T4 con el reemplazo exacto.
