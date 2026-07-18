# La puerta de entrada — Diseño

> Pedido del usuario, en dos partes y en este orden: (1) **rediseñar el inicio de sesión** para que cuente con un **video de fondo** (que él creará con la herramienta Claude Design), y (2) un **apartado introductorio pre-login** — el landing que casi toda app web tiene — con la información del programa y los CTAs de entrada. Decisiones tomadas con él: video **a pantalla completa** detrás del vidrio; landing con **hero + catálogo + "cómo funciona"**, esta última como **scrollytelling pinned**; el **mismo video** de fondo en el hero del landing y en el login (continuidad total de la puerta); contenido del video: **aurora en movimiento + código/tipografía flotante**. Enfoque arquitectural elegido: **"una puerta, dos actos"** — todo dentro de la SPA, video montado una sola vez a nivel de `App`.
>
> Regla nueva de proceso (pedida por el usuario en esta sesión, ya en memoria): **todo cambio significativo termina reflejado en `prompt-maestro.md`** — esta iteración incluye esa actualización como tarea.

## 1. Arquitectura de la puerta

Hoy `app.jsx` tiene dos mundos: `login` y la app con sesión. La puerta añade un estado y una capa:

**Estados sin token:** `landing` (por defecto) y `login`. La ruta inicial pasa de
`{ screen: API.token ? "loading" : "login" }` a `{ screen: API.token ? "loading" : "landing" }`.

**Rutas de entrada y salida (decisión con intención):**

| Camino | Cae en |
|---|---|
| Abrir la app sin token (llegada fresca) | `landing` |
| "Empieza a programar" (hero o cierre del landing) | `login` en **modo registro** |
| "Ya tengo cuenta" (hero del landing) | `login` en modo entrar |
| "← Volver" (desde el login) | `landing` |
| Cerrar sesión / `onUnauthorized` / fallo de `loadMe` | `login` directo (ya conoces el producto; pasar por marketing estorba) |

El modo del login viaja en la ruta: `setRoute({ screen: "login", mode: "register" })`; `LoginScreen` recibe `initialMode` y `onBack`. Los tres caminos que hoy acaban en `{ screen: "login" }` no cambian (y siguen limpiando la ceremonia de logros).

**El video vive en `App`, fuera del div keyado** — el mismo patrón del canvas del fondo vivo y la navbar persistente. Un componente nuevo `GateBackdrop` se monta solo cuando `route.screen === "landing" || route.screen === "login"` (nunca en `loading` ni con sesión). Al navegar del landing al login el contenido se remonta con `anim-screen-in`, pero **el video ni parpadea ni se reinicia**: la continuidad sale gratis de esta decisión.

**Al cambiar de vista dentro de la puerta, `window.scrollTo(0, 0)`** (el landing puede estar scrolleado cuando pulsas el CTA; el login debe abrir arriba).

**Cero backend, cero esquema.** El catálogo del landing es copy estático en la pantalla (`GET /courses` exige token y esto es marketing, no datos vivos; se actualiza a mano en las iteraciones de contenido, como los logros de catálogo). Los **141 tests no se tocan**.

**Archivos nuevos y orden de scripts** (`index.html`, el orden ES la resolución de dependencias):
`screens/Gate.jsx` (GateBackdrop) y `screens/LandingScreen.jsx`, cargados después de `AppShell.jsx` y antes de `LoginScreen.jsx`/`app.jsx`. Assets nuevos en `app/web/assets/` (carpeta nueva): `gate.mp4` + `gate-poster.jpg` (los entrega el usuario; se commitean al repo).

## 2. El video — contrato para Claude Design (lo entrega el usuario)

**Contenido acordado:** aurora en movimiento + fragmentos de código/tipografía flotando. Tres reglas de composición:

1. **Paleta del lenguaje**: fondo casi negro azulado (como la aurora), luces frías — azul, cian, violeta, algún acento ámbar. **Nada de blancos grandes ni flashes** (el video arranca solo al cargar la página).
2. **Zona tranquila en el centro**: ahí flotan el formulario de vidrio y el titular del hero. El movimiento fuerte y los fragmentos de código, hacia bordes y esquinas.
3. **Sin texto fijo ni logos dentro del video** — el titular y el logo los pone la app encima (el copy se cambia sin rehacer el video).

**Formato:** MP4 (H.264), **1920×1080**, 24–30 fps, **10–20 s en loop perfecto** (el último frame funde con el primero; si la herramienta no lo da, cerrar con crossfade al inicio), **sin pista de audio**, peso objetivo **≤ 12 MB** (~5 Mbps).

**Entrega:** `app/web/assets/gate.mp4` + un frame quieto como `app/web/assets/gate-poster.jpg`.

## 3. `GateBackdrop` — la capa de video que se defiende sola

```jsx
// La puerta comparte fondo: un video montado UNA vez en App (fuera del div keyado), que el
// landing disuelve al scrollear y el login usa a plena presencia. Si el archivo no existe,
// el autoplay se bloquea o hay reduced motion, la puerta queda sobre la aurora de siempre:
// el diseño no depende del video para funcionar.
function GateBackdrop({ mode }) {                    // mode: "landing" | "login"
  const [failed, setFailed] = React.useState(false);
  const frameRef = React.useRef(null);               // la lámina póster+video (NO el video: la
  const videoRef = React.useRef(null);               // disolución debe funcionar también sin él)
  const noVideo = failed || (window.FX && FX.reducedMotion);

  // La disolución del hero: en landing, la opacidad cae de 1 a 0 durante el primer ~90vh
  // de scroll, y el video SE PAUSA al llegar a 0 (cero decodificación mientras no se ve).
  // El cálculo va directo en el evento (pasivo): es una resta y un clamp — y así queda
  // verificable en el panel del tooling, donde rAF jamás corre.
  React.useEffect(() => {
    const apply = () => {
      const op = mode === "login" ? 1 : Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.9));
      frameRef.current.style.opacity = String(op);
      const el = videoRef.current;
      if (el) { if (op === 0 && !el.paused) el.pause(); else if (op > 0 && el.paused) el.play().catch(() => {}); }
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    return () => window.removeEventListener("scroll", apply);
  }, [mode, noVideo]);

  return (
    <div aria-hidden className="lg-gate">
      <div ref={frameRef} className="lg-gate__frame">
        <div className="lg-gate__poster"></div>
        {!noVideo ? (
          <video ref={videoRef} className="lg-gate__video" autoPlay muted loop playsInline
            src="assets/gate.mp4" poster="assets/gate-poster.jpg" onError={() => setFailed(true)} />
        ) : null}
      </div>
      <div className="lg-gate__scrim"></div>
    </div>
  );
}
```

Notas de la implementación de referencia (el plan las respeta):

- **Capas y stacking**: `.lg-gate` es `position: fixed; inset: 0; z-index: -1; pointer-events: none`, colocado en el DOM **después** de `.lg-noise` (a igual z-index, el orden de fuente lo pinta encima de cuadrícula y ruido). Cuando su opacidad baja, la aurora + papel de cuaderno reaparecen debajo — la transición del hero a las secciones es literalmente *destapar* el fondo vivo.
- La opacidad se anima en `.lg-gate__frame` (el wrapper de póster+video juntos), no en el video suelto: el póster y el video se disuelven como una sola lámina.
- **El póster va debajo del video** como `background-image` CSS: si `gate-poster.jpg` no existe todavía, un background 404 no pinta nada ni dispara error visible — queda la aurora.
- `object-fit: cover` en el video (y en el póster por `background-size: cover`): 1920×1080 cubre cualquier viewport sin deformarse.
- **El scrim** es un gradiente fijo encima del video (`.lg-gate__scrim`), sutil: oscurece hacia el centro-abajo para que el vidrio y el texto ganen siempre el pulso de contraste. Sin texto dentro (regla del `backdrop-filter` no aplica: no hay blur aquí, solo gradiente).
- **Reduced motion, doble cinturón**: gate JS (`FX.reducedMotion` ⇒ el `<video>` ni se monta; queda el póster estático) + cinturón CSS en `liquid.css`: `@media (prefers-reduced-motion: reduce) { .lg-gate__video { display: none; } }` (estado base visible ⇒ `display: none`, la regla del proyecto).
- **Autoplay bloqueado** (política del navegador): el `play()` del efecto lleva `.catch(() => {})`; el elemento muestra su póster — mismo aspecto que reduced motion. `onError` (archivo ausente, códec no soportado) desmonta el video para siempre en esa sesión.
- El pausado por visibilidad usa el umbral de opacidad 0 — no hace falta IntersectionObserver (que además el panel del tooling congela).

## 4. El landing — cuatro actos

Una sola página de scroll (content-only, sin `PageFrame`/`NavBar`, como toda pantalla). Todo el copy en español con tuteo, sentence case, sin emoji. Los textos de abajo son la **propuesta de partida** (el usuario los ajusta en su pasada humana).

### Acto 1 — Hero (100vh)

El video llena la pantalla. Centrado, sobre la zona tranquila:

- El logotipo **"Coding"** con su barra cian luminosa (la del login actual, más grande: ~64px).
- Titular (una línea): **"Aprende Ingeniería de Software como si fuera un juego"**.
- Subtítulo: **"Lecciones cortas, ejercicios interactivos y una racha que no vas a querer romper."**
- CTAs: **"Empieza a programar"** (`Button size="lg"` primario, con `Liquid.ripple`) y **"Ya tengo cuenta"** (`Button variant="secondary" size="lg"` — vidrio; verificado: el DS declara `primary|secondary|ghost|danger`). Ambos navegan la puerta (§1).
- Abajo, un **chevron de scroll** que respira (solo `transform`; bajo reduced motion se oculta con `display: none` — es una pista de movimiento, sin movimiento no informa).

Al scrollear, `GateBackdrop` disuelve el video (§3) y las secciones siguientes viven sobre la aurora + papel de cuaderno.

### Acto 2 — Cómo funciona (el scrollytelling pinned)

Un track de **350vh** con la escena fijada por `position: sticky` (sin secuestrar el scroll: si scrolleas rápido, las etapas pasan rápido):

```jsx
<section className="lg-scrolly" ref={trackRef}>      {/* height: 350vh */}
  <div className="lg-scrolly__stage">                {/* sticky; top: 0; height: 100vh; centra la escena */}
    {/* columna de copy (izquierda) + maqueta de lección (derecha) */}
  </div>
</section>
```

**La escena**: una **maqueta de lección** en un `GlassPanel` (autocontenida en `LandingScreen.jsx` — NO reutiliza `LessonScreen`; imita su lenguaje con piezas propias pequeñas) que avanza por 4 etapas según el progreso de scroll dentro del track:

| Etapa | Umbral de progreso | La maqueta muestra | Copy al lado (una frase) |
|---|---|---|---|
| 1. Teoría | 0.00–0.25 | Bloque breve de teoría con un `code` real del catálogo (SQL de bd1) | "La teoría, en bloques cortos y con el código delante." |
| 2. Ejercicio | 0.25–0.50 | Opción múltiple de 4; una opción se marca sola (estado `selected`) | "Cada lección se practica al momento, sin salir de ella." |
| 3. Feedback | 0.50–0.75 | La banda verde cae con su squash & stretch: "Correcto" + explicación de una línea | "Sabes al instante si acertaste — y por qué." |
| 4. Celebración | 0.75–1.00 | Bloom: "+50 XP", anillo de progreso lleno | "Cada lección suma XP. Cada día seguido, racha." |

**Mecánica** — hook `useScrollStage(trackRef, n)` en `LandingScreen.jsx`:

- Listener de `scroll` **pasivo y directo** (sin rAF-throttle, a propósito: el cálculo es `clamp((scrollY - top) / (alto - vh))` + un `floor` — barato por evento, y **verificable en el panel del tooling**, donde rAF jamás procesa).
- `top`/`alto` se leen al montar y en `resize` (listener con limpieza), no por evento. Ojo: `getBoundingClientRect().top` es relativo al viewport — el top de documento es `rect.top + window.scrollY`.
- Devuelve `stage` (0–3, discreto). Cambiar de etapa dispara las transiciones — **melt** entre teoría⇄ejercicio (el idioma del stepper real), **drop-in** de la banda en la etapa 3, **bloom + count-up** en la 4 — reutilizando las clases de `motion.css`/`fx.js` existentes donde encajen. Solo `transform`/`opacity`/`filter`.
- Las etapas son **reversibles**: scrollear hacia arriba vuelve a la etapa anterior (el estado es función del scroll, no una animación de una vía).

**Reduced motion**: gate JS — `LandingScreen` no monta el track sticky sino `<ScrollyStatic>`: las 4 etapas apiladas como tarjetas estáticas con su copy (todo visible, cero animación). Cinturón CSS: las clases de coreografía ya están cubiertas por el `@media` de `motion.css`; el `@media` de `liquid.css` sigue siendo su último bloque.

### Acto 3 — Catálogo de materias

Encabezado: **"Todo el plan, una lección a la vez"** + una línea ("Ocho cursos que se desbloquean a tu ritmo."). Grid de **8 tarjetas de curso** (datos hardcodeados, espejo del seed) con su tono real y una línea de descripción:

| Curso | Tono | Materia |
|---|---|---|
| Bases de datos I / II | cyan | Bases de datos |
| Programación I / II | blue | Programación |
| Algoritmos | violet | Algoritmos |
| Desarrollo web | amber | Desarrollo web |
| Ingeniería de requisitos / Modelado con UML | violet | Ingeniería de software |

Las tarjetas entran con la **condensación en cascada** (`Liquid.reveal`) y **sienten el cursor** (`TiltCard` — dentro del `.lg-reveal`, nunca en el mismo div: ambos escriben `transform`). Los cursos con candado real (bd2, uml) muestran su prereq como texto ("Se abre al terminar Bases de datos I") — honestidad de producto, no mecánica.

### Acto 4 — Cierre

Banda corta de remate: **"Tu primera lección te espera"** + CTA **"Empieza a programar"** (mismo destino que el del hero). Pie mínimo: "Coding — un proyecto de aprendizaje personal". Sin enlaces falsos.

## 5. El login rediseñado

El mismo `GateBackdrop` a plena opacidad (modo `login`). Encima:

- **"← Volver"** arriba a la izquierda (vuelve al landing; discreto, `text-secondary`).
- **El logotipo con más protagonismo**: "Coding" + barra cian arriba del panel (~56px, hoy 44) con el subtítulo actual ("Aprende Ingeniería de Software, una lección a la vez").
- **El panel de vidrio** (`GlassPanel strength="strong"`, como hoy) mantiene la estructura del formulario — campos, Recordarme, error, cambio login/registro — pero **entra condensándose** sobre el video (la coreografía de condensación existente, vía clase en un `<div>` wrapper propio — los componentes del DS no reenvían `className`). El blur del panel refracta el video en movimiento: **ese es el momento visual de la pantalla**.
- `initialMode` respeta el CTA de origen: "Empieza a programar" abre **registro**; "Ya tengo cuenta", entrar. El toggle interno sigue funcionando igual.
- Botón de enviar con `Liquid.ripple`, como el resto de la app.
- El "¿Olvidaste tu contraseña?" actual (enlace muerto) **se elimina** — recuperación de contraseña está fuera de alcance decidido desde la iteración 1, y un enlace que no hace nada es deuda de copy.

## 6. Gates, accesibilidad y restricciones

- **Sin build**: sin `import`/`export`, `React.Fragment` explícito, globales por `Object.assign(window, …)`, orden de scripts en `index.html`.
- **DS intocado**; clases de animación siempre en wrappers propios.
- **Motion**: solo `transform`/`opacity`/`filter` en todo lo nuevo (la opacidad del `.lg-gate__frame` incluida). `backdrop-filter` jamás sobre un elemento con texto.
- **Reduced motion, doble cinturón en cada pieza**: video (§3), scrollytelling (§4.2), chevron (§4.1), condensaciones (cubiertas por los `@media` existentes). El `@media` de `liquid.css` sigue siendo el **último bloque** del archivo.
- **Higiene**: listeners de `scroll`/`resize` y timers en refs/efectos con limpieza al desmontar; el video se pausa al desmontarse `GateBackdrop` (el desmontaje ya lo hace el navegador al soltar el elemento).
- `GateBackdrop` entero es `aria-hidden` y `pointer-events: none` (es fondo). La maqueta del scrollytelling es decorativa pero contiene texto real — queda legible para lectores como contenido normal (no se oculta).
- Los CTAs son `Button` reales del DS con textos descriptivos; la navegación de la puerta es por estado React (sin URLs — igual que el resto de la app).

## 7. Verificación

**Backend:** cero cambios ⇒ **141/141** como guardia.

**Navegador, por contrato** (trap de `window.onerror` instalado antes de afirmar "cero errores"):

- Sin token: la app abre en el landing; `.lg-gate` existe, es `fixed` y precede al contenido; el `<video>` tiene `autoplay/muted/loop/playsinline` y `src` correcto.
- **Fallback forzado**: disparar `onError` del video (o renombrar el asset) ⇒ el video se desmonta, cero errores de consola, la puerta se ve sobre la aurora.
- **Disolución verificable sin rAF**: `window.scrollTo(0, 0.5·vh)` + evento `scroll` ⇒ la opacidad de `.lg-gate__frame` queda ≈ 0.44; a ≥ 0.9·vh ⇒ 0 y `video.paused === true`; de vuelta arriba ⇒ 1 y reproduciendo (o `catch` silencioso en el panel).
- **Etapas del scrollytelling**: con `scrollTo` a los 4 rangos del track, `useScrollStage` reporta 0→1→2→3 y el DOM muestra la pieza de cada etapa (por clases/contenido, no por *feel*); reversibilidad scrolleando hacia atrás.
- **Navegación de la puerta**: "Empieza a programar" ⇒ login en modo registro (campo Nombre visible); "Ya tengo cuenta" ⇒ modo entrar; "← Volver" ⇒ landing; en ambos cambios, `scrollY === 0`.
- **Los caminos con sesión no cambian**: login correcto ⇒ dashboard; logout ⇒ **login directo** (no landing); `onUnauthorized` ⇒ login. Registro nuevo desde el CTA completa el flujo entero.
- **Reduced motion**: con `FX.reducedMotion = true` (y remount), no hay `<video>` (queda el póster), el landing monta `ScrollyStatic` (4 etapas visibles apiladas) y no hay chevron. CSS por lectura: `.lg-gate__video` con `display: none` en el `@media`, que sigue siendo el último bloque de `liquid.css`.
- Cero errores de consola en el recorrido completo: landing arriba-abajo, login, registro, sesión, logout.

**Pendiente humano** (navegador en primer plano): crear el video en Claude Design y soltarlo en `assets/`; juzgar la legibilidad del formulario y el titular **sobre el video real**; el *feel* del pinned (ritmo de las 4 etapas en 350vh — se calibra scrolleando), la disolución del hero y la condensación del panel del login.

## 8. Actualización del prompt maestro (parte de la iteración)

Al cerrar: fila nueva en §2, `assets/` + `Gate.jsx` + `LandingScreen.jsx` en §4, la puerta (estados sin token, GateBackdrop, contrato del video) en §8, y los pendientes humanos en §11. Es la primera iteración bajo la regla nueva del usuario: **cambio significativo ⇒ prompt maestro al día en la misma sesión.**

## 9. Fuera de alcance decidido

- **Crear el video** (lo hace el usuario en Claude Design; la app funciona sin él desde el día uno).
- Sección del meta-juego en el landing (no la eligió; el cierre ya insinúa XP/racha).
- Recuperación de contraseña (fuera desde la iteración 1; ahora además desaparece el enlace muerto).
- URLs/rutas navegables (hash routing) — la app entera navega por estado; el landing no es distinto.
- Pase responsive dedicado (la app es de uso local en el desktop del usuario; el landing usa layouts fluidos razonables, sin media queries de móvil).
- WebM/AV1 como segundo source (un solo MP4 H.264 basta en el Chrome/Edge local del usuario).

## 10. Resumen en una frase

La puerta de entrada completa: un landing que cuenta el producto en cuatro actos — hero sobre un video de aurora y código (creado por el usuario en Claude Design), un scrollytelling pinned donde una lección de mentira avanza con tu scroll usando las coreografías reales (melt, banda, bloom), el catálogo con tilt y condensación, y un cierre con CTA — y un login rediseñado donde el mismo video, montado una sola vez a nivel de `App` y sin reiniciarse jamás entre pantallas, queda refractado por el vidrio del formulario que se condensa encima; todo sin build, sin backend nuevo, con el video como mejora progresiva (la puerta funciona sobre la aurora si el archivo falta) y reduced motion a doble cinturón en cada pieza.
