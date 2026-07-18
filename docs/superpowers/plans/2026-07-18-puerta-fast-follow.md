# La puerta, fast-follow — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Darle voz y pulso a la puerta según el spec `docs/superpowers/specs/2026-07-18-puerta-fast-follow-design.md`: pista de scroll con texto en el hero, caret del logo titilando en las tres instancias, y login a dos columnas con pitch persuasivo por modo y coreografía de melt al alternar.

**Architecture:** Tres retoques sobre la puerta ya fusionada (iteración 12). El único cambio estructural es `LoginScreen.jsx` (archivo completo reemplazado: layout a dos columnas + `usePhase(mode, 160)` gobernando todo lo dependiente del modo). El resto son ediciones puntuales de `liquid.css`, `LandingScreen.jsx` (hint) y `AppShell.jsx` (caret de la navbar). Cero backend.

**Tech Stack:** React 18 UMD + Babel standalone (sin build), CSS en `liquid.css`. Sin dependencias nuevas.

## Global Constraints

- **Sin build**: PROHIBIDO `import`/`export` en `app/web/`; prohibido `<>` (usar `React.Fragment`); globales con `Object.assign(window, {...})`.
- **`Coding Design System/` es INTOCABLE.** Sus componentes NO reenvían `className` ⇒ clases de animación solo en `<div>` wrappers propios.
- **Motion**: solo `transform`/`opacity`/`filter` en animaciones nuevas (el caret anima solo `opacity`).
- **El `@media (prefers-reduced-motion: reduce)` sigue siendo EL ÚLTIMO bloque de `liquid.css`**: secciones nuevas ANTES de él, reglas de reduced motion DENTRO de él.
- **Comentarios JSX `{/* */}` SOLO en posición de children** — jamás tras `return (` ni dentro de un ternario (rompe Babel).
- **Copy**: español con tuteo, sentence case, sin emoji.
- **Commits en español** con el mensaje exacto de cada tarea.
- **`npm --prefix app test` = 141/141** en cada tarea (cero cambios de backend). MariaDB local corre; credenciales en `app/.env`.
- **Panel del navegador**: congela rAF/IO/animaciones CSS (`document.hidden === true`); `setTimeout` SÍ corre. Verificar CONTRATOS (clases, `getComputedStyle`, DOM), no el *feel*. Trap obligatorio tras cada recarga: `window.__errs = []; window.onerror = (m) => window.__errs.push(String(m));`. Dev server con `preview_start` config `dev` (JAMÁS por Bash); estáticos frescos del disco con recarga.

---

### Task 1: La pista de scroll con texto y el caret del logo

**Files:**
- Modify: `app/web/liquid.css` (bloque `.lg-hero__hint` reescrito; `.lg-caret` + keyframes nuevos antes del `@media`; 2 cambios dentro del `@media`)
- Modify: `app/web/screens/LandingScreen.jsx` (el hint del hero, en `HeroAct`)
- Modify: `app/web/screens/AppShell.jsx` (la barra del logo de la navbar)

**Interfaces:**
- Consumes: `KIcon` (global de AppShell), la animación `lg-hint` existente.
- Produces: clase **`.lg-caret`** (parpadeo de caret; la Task 2 la usa en el logo del login).

- [ ] **Step 1: Reescribir el bloque del hint en `liquid.css`**

Reemplazar el bloque actual:

```css
/* La pista de scroll: respira con transform, nada de layout. */
.lg-hero__hint {
  position: absolute;
  bottom: 26px;
  left: 50%;
  margin-left: -11px;
  color: var(--text-tertiary);
  animation: lg-hint 2.2s var(--ease-glass) infinite;
}
```

por:

```css
/* La pista de scroll: texto + chevron respirando juntos (solo transform/opacity). El texto
   informa por sí mismo — por eso bajo reduced motion el hint queda visible y estático. */
.lg-hero__hint {
  position: absolute;
  bottom: 26px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  animation: lg-hint 2.2s var(--ease-glass) infinite;
}
```

(El `@keyframes lg-hint` que le sigue NO cambia.)

- [ ] **Step 2: Añadir el caret en `liquid.css`**

Insertar INMEDIATAMENTE ANTES de la línea `@media (prefers-reduced-motion: reduce) {`:

```css
/* ---------- El cursor del logo: un caret de editor que titila ---------- */
/* Parpadeo abrupto, solo opacity (el glow viaja con la barra). La rampa de 1% entre
   keyframes (~11ms) es imperceptible: se lee como corte seco, como un caret real. */
.lg-caret { animation: lg-caret-blink 1.1s linear infinite; }
@keyframes lg-caret-blink {
  0%, 54% { opacity: 1; }
  55%, 100% { opacity: 0; }
}
```

- [ ] **Step 3: Los dos cambios dentro del `@media` final**

**(a)** Reemplazar:

```css
  /* Una pista de movimiento sin movimiento no informa: fuera entera. */
  .lg-hero__hint { display: none !important; }
```

por:

```css
  /* El hint ahora lleva texto: informa por sí mismo. Queda visible y estático (estado base
     visible y correcto ⇒ animation: none es el patrón válido, como el menú del avatar). */
  .lg-hero__hint { animation: none !important; }
  /* La barra del logo queda sólida: estado base visible y correcto. */
  .lg-caret { animation: none !important; }
```

El `@media` debe seguir siendo el último bloque del archivo.

- [ ] **Step 4: El hint con texto en `HeroAct` (`LandingScreen.jsx`)**

Reemplazar:

```jsx
      <span aria-hidden className="lg-hero__hint"><KIcon d="M4 6l4 4 4-4" size={22} /></span>
```

por:

```jsx
      <div aria-hidden className="lg-hero__hint">
        <span>Desliza para ver más</span>
        <KIcon d="M4 6l4 4 4-4" size={22} />
      </div>
```

- [ ] **Step 5: El caret de la navbar (`AppShell.jsx`)**

En `NavBar`, reemplazar:

```jsx
        <span style={{ width: 4, height: 18, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 10px var(--accent-cyan)" }}></span>
```

por:

```jsx
        <span className="lg-caret" style={{ width: 4, height: 18, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 10px var(--accent-cyan)" }}></span>
```

Y en `HeroAct` (`LandingScreen.jsx`), reemplazar:

```jsx
          Coding<span style={{ display: "inline-block", width: 7, height: 48, marginLeft: 12, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 18px var(--accent-cyan)" }}></span>
```

por:

```jsx
          Coding<span className="lg-caret" style={{ display: "inline-block", width: 7, height: 48, marginLeft: 12, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 18px var(--accent-cyan)" }}></span>
```

(La barra del login la trae la Task 2 con su reemplazo completo del archivo — no tocar `LoginScreen.jsx` aquí.)

- [ ] **Step 6: Guardia de backend**

Run: `npm --prefix app test`
Expected: **141/141 pass**.

- [ ] **Step 7: Verificación por contrato en el panel**

Sin token (`localStorage.clear()` + recarga), trap instalado:

```js
const hint = document.querySelector(".lg-hero__hint");
const heroCaret = document.querySelector(".lg-hero .lg-caret") || document.querySelector(".lg-caret");
({
  hintText: hint && hint.textContent.includes("Desliza para ver más"),
  hintChevron: hint && !!hint.querySelector("svg"),
  hintAnim: hint && getComputedStyle(hint).animationName === "lg-hint",
  caretAnim: heroCaret && getComputedStyle(heroCaret).animationName === "lg-caret-blink",
  caretDur: heroCaret && getComputedStyle(heroCaret).animationDuration === "1.1s",
  errs: window.__errs.length,
})
```

Expected: todos `true` y `errs: 0`. Después, login con `juan@test.dev` / `secreto1` y verificar el caret de la navbar: `getComputedStyle(document.querySelector(".lg-nav .lg-caret")).animationName === "lg-caret-blink"`. El cinturón CSS de reduced motion se verifica por lectura del archivo (el panel no emula `prefers-reduced-motion`): las dos reglas nuevas dentro del `@media`, que sigue siendo el último bloque.

- [ ] **Step 8: Commit**

```bash
git add app/web/liquid.css app/web/screens/LandingScreen.jsx app/web/screens/AppShell.jsx
git commit -m "feat: el hero invita a deslizar con palabras y el logo titila como un caret real"
```

---

### Task 2: El login a dos columnas, con vida

**Files:**
- Modify: `app/web/screens/LoginScreen.jsx` (archivo completo reemplazado abajo)

**Interfaces:**
- Consumes: `usePhase(value, outMs)` (AppShell — devuelve `{ shown, phase }`; retiene el valor viejo durante la fase "out"), `KIcon`/`ICONS` (AppShell), clase `.lg-caret` (Task 1), clases `anim-condense`/`anim-condense--delayed`/`anim-melt-out`/`anim-melt-in` (motion.css, existentes), `.lg-back` (liquid.css, existente).
- Produces: `LoginScreen({ onLoggedIn, initialMode, onBack })` — misma firma que hoy; `app.jsx` NO se toca.

- [ ] **Step 1: Reemplazar `app/web/screens/LoginScreen.jsx` completo**

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

  // La coreografía del cambio de modo: TODO lo dependiente del modo se renderiza desde
  // shownMode (usePhase retiene el modo viejo 160ms mientras se funde con melt-out, y el
  // nuevo emerge con melt-in). Lo visible es lo que manda — también en submit. Correo y
  // contraseña NUNCA se remontan: conservan lo tecleado al alternar.
  const { shown: shownMode, phase } = usePhase(mode, 160);
  const isLogin = shownMode === "login";
  const modeCls = phase === "out" ? "anim-melt-out" : "anim-melt-in";

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", gap: 64, padding: 32 }}>
      {onBack ? (
        <button className="lg-back" onClick={onBack}>
          <KIcon d={ICONS.back} size={14} />
          Volver
        </button>
      ) : null}

      {/* Columna izquierda: la marca (con su caret) y el pitch que cambia de argumento
          según el modo. El logo no se anima al alternar; el pitch entero sí. */}
      <div className="anim-condense" style={{ width: 400, textAlign: "left" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)", lineHeight: 1 }}>
          Coding<span className="lg-caret" style={{ display: "inline-block", width: 6, height: 42, marginLeft: 10, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 16px var(--accent-cyan)" }}></span>
        </div>
        <div className={modeCls} style={{ marginTop: 26 }}>
          {isLogin ? (
            <React.Fragment>
              <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.2, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
                Qué bueno verte de vuelta
              </h1>
              <p style={{ margin: "14px 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
                Continúa con tu progreso: tu racha, tu XP y tu cola de repaso te esperan donde los dejaste.
              </p>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.2, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
                Todo un plan de Ingeniería de Software te espera
              </h1>
              <p style={{ margin: "14px 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
                Ocho cursos: bases de datos, programación, algoritmos, desarrollo web e ingeniería de software.
              </p>
              <p style={{ margin: "10px 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
                Lecciones cortas con ejercicios interactivos y feedback al instante.
              </p>
              <p style={{ margin: "10px 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
                XP, niveles, logros y una racha que hace que estudiar enganche.
              </p>
              <p style={{ margin: "18px 0 0", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
                Crear tu cuenta toma menos de un minuto.
              </p>
            </React.Fragment>
          )}
        </div>
      </div>

      {/* Columna derecha: el formulario. Lo exclusivo de cada modo (Nombre, Recordarme, la
          etiqueta del botón, el pie) se funde y emerge con modeCls, cada uno en su wrapper
          propio — el DS no reenvía className. */}
      <div className="anim-condense anim-condense--delayed" style={{ width: 420 }}>
        <GlassPanel strength="strong" padding="var(--space-7)" radius="var(--radius-xl)">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {!isLogin ? (
              <div className={modeCls}>
                <Input label="Nombre completo" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            ) : null}
            <Input label="Correo institucional" placeholder="tu@universidad.edu" value={email} onChange={(e) => setEmail(e.target.value)} iconLeft={<KIcon d="M2.5 4.5h11v7h-11v-7zM2.5 5l5.5 4 5.5-4" />} />
            <Input label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} iconLeft={<KIcon d={ICONS.lock} />} />
            {error ? <div style={{ fontSize: "var(--text-sm)", color: "#E67984" }}>{error}</div> : null}
            {isLogin ? (
              <div className={modeCls}>
                <Checkbox checked={remember} onChange={setRemember} label="Recordarme" />
              </div>
            ) : null}
            <div className={modeCls}>
              <Button fullWidth size="lg" disabled={loading} onClick={submit}>
                {loading ? "Un momento…" : isLogin ? "Entrar" : "Crear cuenta"}
              </Button>
            </div>
            <div className={modeCls} style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
              {isLogin
                ? <React.Fragment>¿Primera vez? <a href="#" onClick={(e) => switchMode(e, "register")}>Crea tu cuenta</a></React.Fragment>
                : <React.Fragment>¿Ya tienes cuenta? <a href="#" onClick={(e) => switchMode(e, "login")}>Entrar</a></React.Fragment>}
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
Object.assign(window, { LoginScreen });
```

Cambios vs. el actual: layout a dos columnas (gap 64); el header centrado desaparece — el logo (56px, ahora con `lg-caret`) y el pitch por modo viven en la columna izquierda; el subtítulo fijo se retira; `usePhase(mode, 160)` + `modeCls` coreografían pitch, Nombre, Recordarme, botón y pie; `submit`/etiquetas deciden por `shownMode`. La lógica de red NO cambia.

- [ ] **Step 2: Guardia de backend**

Run: `npm --prefix app test`
Expected: **141/141 pass**.

- [ ] **Step 3: Verificación por contrato en el panel**

Sin token, ir al login con "Ya tengo cuenta" (o "Empieza a programar" para registro). TODO en UN solo script async (el swap tarda 160ms — esperar ~250ms tras cada click):

```js
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const texto = () => document.body.textContent;
  const campoNombre = () => !!([...document.querySelectorAll("label, div")].find((n) => n.textContent === "Nombre completo"));
  const out = {};
  // Estado inicial (modo entrar, viniendo de "Ya tengo cuenta")
  out.dosColumnas = !!document.querySelector(".lg-caret") && texto().includes("Qué bueno verte de vuelta");
  out.sinNombreEnLogin = !campoNombre();
  // Teclear en correo y contraseña
  const inputs = [...document.querySelectorAll("input")];
  const setVal = (el, v) => { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set; s.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
  setVal(inputs.find((i) => i.placeholder === "tu@universidad.edu"), "persist@test.dev");
  setVal(inputs.find((i) => i.type === "password"), "secreto1");
  // Alternar a registro
  [...document.querySelectorAll("a")].find((a) => a.textContent === "Crea tu cuenta").click();
  await wait(250);
  out.pitchRegistro = texto().includes("Todo un plan de Ingeniería de Software te espera") && texto().includes("menos de un minuto");
  out.nombreAparece = campoNombre();
  out.botonRegistro = [...document.querySelectorAll("button")].some((b) => b.textContent === "Crear cuenta");
  // Volver a entrar: lo tecleado sobrevive
  [...document.querySelectorAll("a")].find((a) => a.textContent === "Entrar").click();
  await wait(250);
  const inputs2 = [...document.querySelectorAll("input")];
  out.correoSobrevive = inputs2.some((i) => i.value === "persist@test.dev");
  out.passSobrevive = inputs2.some((i) => i.value === "secreto1");
  out.pitchEntrar = texto().includes("Qué bueno verte de vuelta");
  out.errs = window.__errs.length;
  return out;
})()
```

Expected: todos `true` y `errs: 0`. Después, con clicks reales: login completo con `juan@test.dev` / `secreto1` ⇒ dashboard; logout ⇒ login; "Volver" ⇒ landing; y un registro real (email único `pff+<timestamp>@test.dev`) ⇒ dashboard.

- [ ] **Step 4: Commit**

```bash
git add app/web/screens/LoginScreen.jsx
git commit -m "feat: el login a dos columnas — un pitch que cambia de argumento y campos que se funden"
```

---

### Task 3: Verificación E2E + prompt maestro al día

**Files:**
- Modify: `prompt-maestro.md` (cabecera, §2, §11)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: la iteración cerrada y documentada (regla del usuario: cambio significativo ⇒ prompt maestro al día en la misma sesión).

- [ ] **Step 1: Checklist E2E en el panel**

Recorrido completo sin token, trap instalado: landing (hint con texto + caret del hero + scrolly intacto: las 4 etapas siguen respondiendo al scroll con el patrón de la iteración 12 — `scrollTo` + `dispatchEvent(new Event("scroll"))` + esperas de 200ms) → "Empieza a programar" ⇒ login en registro con pitch de registro → alternar modos (ida y vuelta, texto tecleado sobrevive) → registro real ⇒ dashboard (caret en navbar) → logout ⇒ login → "Volver" ⇒ landing → login real ⇒ dashboard. `window.__errs.length === 0` al final. `npm --prefix app test` ⇒ 141/141.

- [ ] **Step 2: Actualizar `prompt-maestro.md`** — tres ediciones exactas:

**(a)** En la cabecera, reemplazar:

```markdown
> Última actualización: **2026-07-18**, tras fusionar la 12ª iteración ("La puerta de entrada") a `master`.
```

por:

```markdown
> Última actualización: **2026-07-18**, tras fusionar la 12ª iteración ("La puerta de entrada") y su fast-follow (pista de scroll con texto, caret del logo, login a dos columnas) a `master`.
```

y reemplazar la línea de "Qué está pendiente" de la cabecera:

```markdown
> **Qué está pendiente:** el usuario debe **crear el video en Claude Design** y soltarlo en `app/web/assets/` (la puerta funciona sin él, sobre la aurora); la **pasada de verificación humana** acumulada (§11) suma ahora el *feel* de la puerta (pinned, disolución, condensación del panel) y la legibilidad sobre el video real.
```

por:

```markdown
> **Qué está pendiente:** la **pasada de verificación humana** acumulada (§11) — el video real ya vive en `app/web/assets/gate.mp4` (1920×1080, 15 s, loop, hecho por el usuario en Claude Design) y la puerta suma el fast-follow: juzgar el ritmo del caret, la legibilidad del pitch del login sobre el video y el melt del cambio de modo.
```

**(b)** En la tabla de §2, añadir DESPUÉS de la fila 12 (La puerta de entrada) y ANTES de la fila del fix del `context`:

```markdown
| — | **Fast-follow de la puerta** (`2026-07-18-puerta-fast-follow`) | La puerta gana voz y pulso: el hero invita con **"Desliza para ver más"** (texto + chevron respirando; visible estático bajo reduced motion — el texto informa solo), el **caret del logo titila** como un editor (1,1s, solo opacity, en hero, login y navbar), y el **login pasa a dos columnas** — pitch persuasivo por modo a la izquierda (registro: qué vas a aprender; entrar: "continúa con tu progreso") y formulario a la derecha, con el cambio de modo coreografiado por `usePhase`+melt (nada aparece de la nada; correo y contraseña conservan lo tecleado). Además, el **video real** entró a `assets/` (gate.mp4 + póster, 7,3 MB). |
```

**(c)** En §11, reemplazar el bullet de la puerta:

```markdown
- **La puerta de entrada** (12ª): crear el video en Claude Design y soltarlo en `assets/`; juzgar la legibilidad del hero y el formulario **sobre el video real**; el *feel* del scrollytelling pinned (ritmo de 4 etapas en 350vh), la disolución del hero al scrollear y la condensación del panel del login. Y un ítem del review final: **el scrim de la puerta no se disuelve con el scroll** (es contraste permanente por spec) — si las secciones bajas del landing se ven demasiado oscuras, el fix de 1 línea es mover `.lg-gate__scrim` dentro de `.lg-gate__frame` para que se disuelva con el video.
```

por:

```markdown
- **La puerta de entrada** (12ª + fast-follow): el video ya está en `assets/` — juzgar la legibilidad del hero, del **pitch del login** y del formulario **sobre el video real**; el *feel* del scrollytelling pinned (ritmo de 4 etapas en 350vh), la disolución del hero, la condensación del panel, el **ritmo del caret** (1,1s) y el **melt del cambio de modo** del login. Y un ítem del review final de la 12ª: **el scrim de la puerta no se disuelve con el scroll** (es contraste permanente por spec) — si las secciones bajas del landing se ven demasiado oscuras, el fix de 1 línea es mover `.lg-gate__scrim` dentro de `.lg-gate__frame` para que se disuelva con el video.
```

- [ ] **Step 3: Commit**

```bash
git add prompt-maestro.md
git commit -m "docs: prompt maestro al dia tras el fast-follow de la puerta"
```

---

## Self-review del plan (hecho al escribirlo)

- **Cobertura del spec**: §1 hint (T1 Steps 1/3a/4), §2 caret (T1 Steps 2/3/5 + la instancia del login en T2), §3 login dos columnas con coreografía completa (T2), §4 restricciones (Global Constraints), §5 verificación (T1 S7, T2 S3, T3 S1), prompt maestro (T3). La nota aceptada del doble melt del primer montaje queda implementada tal cual (sin gates de primer render).
- **Consistencia**: `modeCls`/`shownMode`/`usePhase(mode, 160)` solo viven en T2; `.lg-caret` la produce T1 y la consume T2; la firma de `LoginScreen` no cambia ⇒ `app.jsx` intocado.
- **Sin placeholders**: todo el código completo; los reemplazos citan el texto viejo exacto.
