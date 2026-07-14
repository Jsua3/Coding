# Coreografía de gota — diseño

**Fecha:** 2026-07-13 · **Estado:** aprobado por el usuario (diseño por secciones en conversación)
**Contexto:** primer paso de adopción del lenguaje Liquid Glass (`docs/liquid-glass.md` §7 y §10). Aplica la coreografía de gota — squash & stretch, melt, bloom, bead, evaporación — a las pantallas existentes del loop de aprender.

---

## 1. Objetivo y alcance

**Objetivo:** que nada en el loop de ejercicios aparezca o desaparezca "en seco". Toda entrada es una gota que cae; toda salida es evaporación.

**Dentro del alcance (decidido con el usuario):**

- Entradas **y salidas** completas (incluye desmontajes animados).
- Superficies: **LessonScreen + ReviewScreen** (todo el loop de ejercicios), incluida la FeedbackBand compartida, las dos celebraciones (lección y "Repaso terminado") y un bead decorativo.
- El bloom de celebración nace **de las coordenadas reales del tap** en el botón Continuar.

**Fuera del alcance:**

- Transiciones del router (`anim-screen-in` queda igual en dashboard/curso/login).
- Ripple, tilt/glow de cursor, reveals de scroll, ruido de fondo (pasos 2–4 del orden de adopción de `docs/liquid-glass.md` §10).
- Backend, DS (`Coding Design System/` intocable), sonidos nuevos.

---

## 2. Vocabulario nuevo en `app/web/motion.css`

Seis piezas, todas solo con `transform`/`opacity`/`filter` y tokens del DS. Valores exactos:

| Clase | Keyframes (esencia) | Duración / easing | Uso |
|---|---|---|---|
| `anim-drop-in` | `0%: translateY(105%) scaleY(1.18) scaleX(0.96); 58%: translateY(-3px) scaleY(0.97) scaleX(1.04); 100%: none` · `transform-origin: bottom center` | 320ms `--ease-out`, `both` | Entrada de FeedbackBand |
| `anim-evaporate` | `to: opacity 0; filter blur(6px); transform translateY(-6px) scale(0.96)` | 160ms `--ease-glass`, `forwards` | Salida de FeedbackBand |
| `anim-melt-out` | `to: opacity 0; filter blur(5px)` | 160ms `--ease-glass`, `forwards` | Contenido saliente del stepper |
| `anim-melt-in` | `from: opacity 0; filter blur(5px); transform translateY(8px)` → `to: none` | 280ms `--ease-out`, `both` | Contenido entrante del stepper |
| `anim-condense` | `from: opacity 0; filter blur(10px); transform translateY(18px) scale(0.97)` → `to: none` | 640ms `--ease-glass`, `both`; en celebración con `animation-delay: 80ms` (el bloom se lee primero) | Panel de CelebrationScreen y de "Repaso terminado" |
| `fx-bead` | `0%,18%: opacity 0.72, scale(1.15)` → `100%: opacity 0, scale(0.42)` | 640ms `--ease-out`, `both` | Gotita decorativa en la entrada de la banda |

`fx-bloom` (keyframe del span que inyecta `FX.bloom`): `0%: opacity 0.82, scale(0.18), blur(0)` → `54%: opacity 0.62, scale(1.05), blur(0.5px)` → `100%: opacity 0, scale(1.38), blur(1.5px)`, 640ms `--ease-out`, `forwards`.

**Reduced motion:** todas las clases nuevas entran al bloque `@media (prefers-reduced-motion: reduce)` existente — `anim-evaporate` y `anim-melt-out` con `animation: none`; `fx-bead` y el span de bloom con `display: none` (su estado base es visible, así que solo `animation: none` los dejaría fijos en pantalla); `anim-drop-in`, `anim-melt-in`, `anim-condense` a `animation-duration: 1ms` (como `anim-screen-in`/`anim-rise`, para que el contenido nunca quede oculto).

`anim-rise` se conserva (lo usa quien no migre aún); la FeedbackBand deja de usarlo.

---

## 3. `FX.bloom(x, y)` en `app/web/fx.js`

Gemelo estructural de `FX.burst`:

- No-op si `FX.reducedMotion`.
- Inyecta en `document.body` un `<span class="fx-bloom">` con `position: fixed`, diámetro `60vmin`, centrado en `(x, y)` (left/top = coordenada − mitad), `border-radius: 50%`, `pointer-events: none`, `z-index: 190` (debajo de las chispas, 200), `mix-blend-mode: screen`, fondo `radial-gradient(circle, rgba(82,201,184,0.35), rgba(226,236,255,0.12) 45%, transparent 70%)` (luz cian-blanca de la marca).
- Se autodestruye por `animationend` + `setTimeout` de seguridad a 1200ms (mismo doble cinturón que `burst`).

---

## 4. La primitiva `usePhase` (en `app/web/screens/AppShell.jsx`)

```jsx
const { shown, phase } = usePhase(value, outMs); // phase: "in" | "out"
```

Publicada vía `Object.assign(window, { usePhase, ... })`. Contrato:

1. Cuando `value` cambia respecto a `shown`, el hook retiene `shown` y marca `phase: "out"`; tras `outMs` intercambia `shown = value` y marca `phase: "in"`.
2. **Entrada desde vacío es instantánea:** si `shown == null`, el cambio se aplica de inmediato con `phase: "in"` (nunca se anima la salida de algo inexistente).
3. **Salida a vacío sí se anima:** si `value` pasa a `null`, `shown` conserva el valor viejo durante la fase "out" y luego pasa a `null` (el consumidor desmonta).
4. **Re-entrada cancela la salida:** si durante "out" `value` vuelve a ser igual a `shown`, se cancela el timer y `phase` vuelve a `"in"`.
5. **Cambios rápidos colapsan:** un nuevo cambio durante "out" reinicia el timer hacia el valor más reciente; jamás se encolan fases.
6. **Reduced motion:** con `FX.reducedMotion`, intercambio inmediato y `phase` siempre `"in"`.
7. **Higiene:** timer en `useRef` + `clearTimeout` en el cleanup de desmontaje.

La comparación es por identidad (`===`); los consumidores pasan primitivos (número de paso, índice) u objetos estables (el objeto `result`).

---

## 5. Aplicación pantalla por pantalla

### FeedbackBand (`LessonScreen.jsx`, compartida con ReviewScreen)

- Internamente: `usePhase(result, 160)`. Renderiza mientras `shown != null` (reemplaza el `if (!result) return null`).
- Fase "in" → `anim-drop-in`; fase "out" → `anim-evaporate`. La clase va en el wrapper exterior (div propio, no componente del KIT).
- Durante "out": `pointerEvents: "none"` en el wrapper.
- **Bead:** `<span aria-hidden>` de ~8px, color `rgba(226,236,255,0.72)`, posicionado sobre el borde superior de la banda (cerca del extremo izquierdo), clase `fx-bead`, presente solo en fase "in".
- El botón Continuar pasa el evento: `onClick={(e) => onContinue(e)}` — el padre necesita las coordenadas para el bloom.

### LessonScreen (stepper)

- `usePhase(step, 160)` decide qué paso se pinta (`shown === 0` teoría, `shown >= 1` ejercicio `exercises[shown - 1]`).
- El div interno del panel (hoy `className={panelAnim}`) compone: clase de melt según fase (`anim-melt-in` / `anim-melt-out`) + `panelAnim` (pop/shake) — se concatenan.
- `continueNext` solo avanza `step` (o dispara celebración/onBack). El reset de `value`/`result` se hace en un efecto que observa `shown`: al intercambiar, `setValue(null); setResult(null)`. Así el ejercicio viejo no se ve vaciarse durante el melt-out, y la banda se evapora en el momento del intercambio (su `result` muere ahí).
- `ExerciseBody` conserva `key={ex.id}` (estado interno se resetea al montar el nuevo).
- Teoría→ejercicio 1 usa el mismo melt. Último ejercicio sin completar lección → `onBack()` (router, sin cambios).
- **Celebración:** en `continueNext(e)`, si `shown` va a celebración (`result.lessonCompleted`): capturar coordenadas del click (`e.clientX/Y`; si el evento no trae coordenadas útiles — activación por teclado, `clientX === 0 && clientY === 0` —, usar el centro del `getBoundingClientRect()` del botón, nunca el centro de la pantalla), llamar `FX.bloom(x, y)` y montar `CelebrationScreen`.

### CelebrationScreen

- El `GlassPanel` central se envuelve en un div propio con `anim-condense` y `animation-delay: 80ms` (el KIT no reenvía `className`; regla de `docs/liquid-glass.md` §2).
- El resto (countUp, timers de perfecto/racha/anillo) no cambia.

### ReviewScreen

- `usePhase(i, 160)` para el índice del ejercicio; mismo patrón de melt en el div interno del panel y mismo efecto de reset sincronizado con `shown`.
- El panel "Repaso terminado" se envuelve en div propio con `anim-condense`; el tap final (`continueNext(e)` cuando `i + 1 >= queue.length`) captura coordenadas y dispara `FX.bloom` antes de `setDone(true)` (misma regla de fallback de teclado).
- La FeedbackBand llega migrada gratis (es compartida).

---

## 6. Lo que NO cambia

- Router y `anim-screen-in`; LoginScreen, Dashboard, CourseScreen.
- Backend completo (los 57 tests siguen pasando sin tocarse).
- `Coding Design System/`.
- Sonidos (`correct/wrong/complete/perfect/streak` ya acompañan estos momentos).
- `anim-rise`, `anim-pop`, `anim-shake`, `anim-pulse-glow`, `fx-spark`, orbe.

---

## 7. Verificación

1. `npm test` desde `app/`: **57/57**.
2. Checklist E2E en navegador (dev server :3000, cuenta `juan@test.dev`):
   - Responder mal un ejercicio: banda entra con squash & stretch (una sola caída, sin doble animación), bead se reabsorbe.
   - "Intentar de nuevo": banda se evapora (no desaparece en seco); retry rápido + responder de nuevo antes de 160ms no deja banda zombi ni fase atascada.
   - "Continuar": melt-out del ejercicio viejo → melt-in del nuevo; el viejo no se vacía visualmente durante la salida; pop/shake siguen funcionando al comprobar.
   - Teoría→ejercicio 1 con melt.
   - Completar lección: bloom nace del botón Continuar, panel de celebración se condensa 80ms después; countUp/anillo intactos.
   - Repaso: mismo melt entre ejercicios; al terminar, bloom + "Repaso terminado" condensándose; +XP correcto.
   - Rehacer lección completada: sin celebración ni crash (regla de negocio 6 intacta).
   - Con reduced-motion activado: todo instantáneo pero funcional y visible (nada queda oculto).
3. Caveat del tooling: las animaciones se verifican por DOM/clases/datos; el "feel" (squash, bloom) requiere mirada humana en un navegador en primer plano — se anota como verificación humana pendiente, igual que en la iteración anterior.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Carreras de fase en `usePhase` (retry/continue rápidos) | Reglas 4 y 5 del contrato; casos cubiertos explícitamente en el checklist E2E |
| Composición de clases melt + pop/shake sobre el mismo div | Se concatenan; pop/shake solo ocurren con `result` presente (fase estable "in"); si en la práctica compiten, pop/shake se mueve a un span interno — decisión del plan |
| Doble animación de la banda entre ejercicios (evaporar + re-entrar) | La banda solo re-entra cuando hay nuevo `result` (tras Comprobar), nunca durante el melt |
| Blur animado en paneles con `backdrop-filter` cerca (costo GPU) | El melt anima el div de contenido, no el GlassPanel ni su capa de blur; evaporate anima el wrapper de la banda completa (su blur vive en un span interno y muere con ella) |
