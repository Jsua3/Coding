# La puerta, fast-follow — Diseño

> Pedido del usuario tras su **pasada de feel** sobre la puerta recién fusionada (iteración 12, con el video real ya en `assets/`): (1) una **pista de scroll con texto** en el hero; (2) el **cursor del logo titilando** como un caret real de editor; (3) el **login a dos columnas** — texto persuasivo a la izquierda que cambia según el modo (registro/entrar), formulario a la derecha — con transiciones líquidas: nada aparece de la nada, y los campos que existen en un modo y no en el otro entran y salen con la coreografía liquid glass. Decisiones tomadas con él: logo en la **columna izquierda** del login (marca + pitch juntos); parpadeo **abrupto** tipo editor; las tres secciones aprobadas tal cual.

## 1. La pista de scroll con texto

El hint del hero (`.lg-hero__hint`, hoy solo chevron) gana texto:

```jsx
<div aria-hidden className="lg-hero__hint">
  <span>Desliza para ver más</span>
  <KIcon d="M4 6l4 4 4-4" size={22} />
</div>
```

- CSS: `.lg-hero__hint` pasa a columna flex centrada (`display: flex; flex-direction: column; align-items: center; gap: 6px`), texto `var(--text-xs)` — el color `var(--text-tertiary)` ya lo pone la clase. El centrado horizontal deja de ser `margin-left` fijo: `left: 0; right: 0` (el contenido se centra solo). La animación `lg-hint` (translateY + opacity) no cambia y anima el bloque entero.
- **Cambio deliberado de reduced motion**: la regla actual `.lg-hero__hint { display: none !important; }` se **reemplaza** por `animation: none !important;` — antes era una pista de movimiento pura (sin movimiento no informaba); ahora el texto informa por sí mismo, así que queda **visible y estático**. (Estado base visible y correcto ⇒ `animation: none` es el patrón válido aquí, como el chevron del menú.)

## 2. El cursor del logo titila

La barra cian del logotipo se vuelve un caret real. Clase nueva en `liquid.css` (antes del `@media`):

```css
/* El cursor del logo: parpadeo abrupto de caret de editor. Solo opacity (el glow viaja con
   la barra). El 1% de rampa entre keyframes (≈11ms) es imperceptible: se lee como corte seco. */
.lg-caret { animation: lg-caret-blink 1.1s linear infinite; }
@keyframes lg-caret-blink {
  0%, 54% { opacity: 1; }
  55%, 100% { opacity: 0; }
}
```

- Se aplica a las **tres instancias** del logo añadiendo `className="lg-caret"` al `<span>` de la barra (los estilos inline de tamaño se quedan): `LandingScreen.jsx` (HeroAct, 7×48), `LoginScreen.jsx` (6×42) y `AppShell.jsx` (NavBar, 4×18).
- Reduced motion (dentro del `@media`, que sigue siendo el último bloque): `.lg-caret { animation: none !important; }` — la barra queda sólida (estado base visible y correcto).

## 3. El login a dos columnas, con vida

### Layout

```
[← Volver]                 (fixed, sin cambios)

        ┌───────────────────────┐   ┌─────────────────────┐
        │ Coding▍  (56px)       │   │  GlassPanel strong  │
        │                       │   │  [Nombre completo]* │
        │ {titular por modo}    │   │  [Correo]           │
        │ {pitch por modo}      │   │  [Contraseña]       │
        │                       │   │  [Recordarme]*      │
        │                       │   │  [ Botón ]          │
        └───────────────────────┘   │  {pie alternancia}  │
              ~400px                └─────────────────────┘
                                          420px
```

Contenedor: `minHeight: 100vh; display: flex; alignItems: center; justifyContent: center; gap: 64px; padding: 32px`. Columna izquierda `width: 400, textAlign: "left"`; derecha `width: 420` (el panel actual, intacto por dentro salvo lo coreografiado). El **subtítulo fijo** de hoy ("Aprende Ingeniería de Software, una lección a la vez") **se retira**: el pitch por modo ocupa ese rol. Los asteriscos (*) marcan lo que existe solo en un modo.

### El texto que cautiva (copy de partida; el usuario lo pule en su pasada)

**Modo registro** — titular (display, ~30px, text-primary): **"Todo un plan de Ingeniería de Software te espera"**. Debajo, tres líneas (`text-base`, text-secondary, con aire entre ellas):
1. "Ocho cursos: bases de datos, programación, algoritmos, desarrollo web e ingeniería de software."
2. "Lecciones cortas con ejercicios interactivos y feedback al instante."
3. "XP, niveles, logros y una racha que hace que estudiar enganche."

Cierre (`text-sm`, text-tertiary): "Crear tu cuenta toma menos de un minuto."

**Modo entrar** — titular: **"Qué bueno verte de vuelta"**. Debajo: "Continúa con tu progreso: tu racha, tu XP y tu cola de repaso te esperan donde los dejaste."

### La coreografía del cambio de modo

Un solo `usePhase(mode, 160)` (el mecanismo del stepper de lección) gobierna TODO lo dependiente del modo:

```jsx
const { shown: shownMode, phase } = usePhase(mode, 160);
const isLogin = shownMode === "login";                       // TODO se renderiza desde shownMode
const modeCls = phase === "out" ? "anim-melt-out" : "anim-melt-in";
```

- **Se funden y emergen con `modeCls`** (cada uno en su `<div>` wrapper propio): el bloque de pitch entero (columna izquierda, titular incluido), el campo "Nombre completo" (solo registro), la fila "Recordarme" (solo entrar), el botón de enviar (su etiqueta cambia: "Crear cuenta"/"Entrar") y el pie de alternancia.
- **NO se remontan ni animan**: el logo, y los campos compartidos Correo y Contraseña — **lo tecleado se conserva** al alternar.
- `submit` y las etiquetas deciden por **`shownMode`** (lo visible es lo que manda; `mode` y `shownMode` solo difieren durante los 160ms de la fase out).
- El **alto del panel no se anima** (regla del proyecto: jamás layout): cambia de golpe en el swap y el melt lo disimula — el mismo idioma del melt teoría⇄ejercicio de la lección real.
- `switchMode` sigue limpiando el error al alternar (comportamiento actual, sin cambios).
- `initialMode` sigue funcionando igual: fija el `useState` inicial; llegar con "Empieza a programar" abre en registro sin coreografía de entrada extra (la condensación del panel ya existe).
- **Reduced motion**: `usePhase` colapsa la fase out (swap instantáneo, ya implementado) y las clases melt están cubiertas por el `@media` de `motion.css`. Doble cinturón sin código nuevo.
- **Nota aceptada**: en el primer montaje, `phase` es "in" y los bloques coreografiados reproducen su `anim-melt-in` (280ms) bajo la condensación del panel (640ms). Es una doble animación sutil del mismo carácter (ambas son condensación) y se acepta tal cual — no añadir gates de primer render.

## 4. Restricciones (las de siempre, aplicadas aquí)

Sin build; DS intocado (clases solo en wrappers `<div>` propios); solo `transform`/`opacity`/`filter`; comentarios JSX solo en posición de children; copy en español con tuteo, sentence case, sin emoji; el `@media` de `liquid.css` sigue siendo su último bloque; cero backend (**141/141** como guardia); `prompt-maestro.md` al día al cerrar (regla de la sesión 12).

## 5. Verificación

**Por contrato en el panel** (trap de `window.onerror`; el panel congela animaciones — se verifica estado, no feel):
- Hero: `.lg-hero__hint` contiene el texto "Desliza para ver más" y el chevron; su `animation-name` computado es `lg-hint`.
- Caret: las 3 barras tienen la clase `lg-caret` y `getAnimations()` (o el `animation-name` computado) reporta `lg-caret-blink` en hero, login y navbar.
- Login: dos columnas presentes (pitch izquierda con titular de registro/entrar según el modo); alternar modo con clicks reales ⇒ tras ~200ms el titular y los campos cambiaron (Nombre presente solo en registro; Recordarme solo en entrar); **lo tecleado en Correo/Contraseña sobrevive** a un ida-y-vuelta de modo; el flujo real de login con `juan@test.dev` sigue llegando al dashboard; registro real sigue funcionando.
- Reduced motion (`FX.reducedMotion = true` + remount): el swap de modo es instantáneo, el hint queda visible estático, la barra del logo sólida.
- Cero errores de consola en el recorrido.

**Pendiente humano**: el ritmo del parpadeo (1,1s), la legibilidad del pitch sobre el video, y el feel del melt al alternar modo.

## 6. Fuera de alcance

Recuperación de contraseña (sigue fuera); cambios al landing más allá del hint; tocar el catálogo o el scrollytelling; el ítem del scrim (sigue en §11 del prompt maestro como pendiente de juicio, no se toca aquí).

## 7. Resumen en una frase

Tres retoques que le dan voz y pulso a la puerta: el hero ahora invita a deslizar con palabras, el logo respira con un caret que titila como un editor de verdad, y el login se parte en dos — un pitch que cambia de argumento según vengas a crearte una cuenta o a continuar tu progreso, y un formulario donde los campos exclusivos de cada modo se funden y emergen con el melt del liquid glass, conservando lo que ya escribiste.
