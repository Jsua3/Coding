# Coding — "El loop de aprender" — Diseño (revamp, sub-proyecto 1 de 2)

**Fecha:** 2026-07-12
**Estado:** aprobado por el usuario (pendiente revisión final del documento)
**Contexto:** la app base está completa y fusionada a master (spec `2026-07-11-coding-backend-design.md`). Este sub-proyecto transforma la experiencia de aprender inspirándose en las mejores apps actuales (Duolingo, Brilliant, Mimo): motion, personalidad, variedad de ejercicios y celebración. El sub-proyecto 2 ("El meta-juego") queda especificado en la sección 11.

## 1. Resumen y decisiones tomadas con el usuario

| Decisión | Elección |
|---|---|
| Pilares de la iteración | Motion/microinteracciones + variedad de ejercicios + celebración post-lección + repaso de errores |
| Ejercicios | **Estructurados** (choice, huecos, ordenar, emparejar), validados en servidor; sin ejecución de código libre |
| Personalidad | **Orbe aurora**: mascota de luz hecha solo con gradientes CSS del design system (sin ilustraciones ni emoji) |
| Sonido | Sí: 5 efectos cortos **sintetizados con Web Audio** (sin archivos), toggle de silencio persistente |
| Mecánica extra | Ninguna en este sub-proyecto (el protector de racha va en el sub-proyecto 2) |
| Interacción | Todo **tap-based** (sin drag & drop) |
| Formato | Se mantiene el frontend sin build (React UMD + Babel standalone); sin librerías nuevas |

## 2. Fundaciones de experiencia

Dos archivos nuevos en `app/web/` (el design system `Coding Design System/` no se toca):

- **`motion.css`** — keyframes y clases utilitarias sobre los tokens del DS (`--ease-glass`, `--ease-spring`, 160/320/640ms):
  - `.anim-screen-in`: entrada de pantalla (fade + translateY(12px) → identidad, 320ms ease-glass).
  - `.anim-pop`: acierto (scale 1 → 1.06 → 1, ease-spring).
  - `.anim-shake`: error (±6px horizontal, 3 ciclos, 320ms).
  - `.anim-pulse-glow`: pulso de brillo para llama de racha y orbe (loop suave).
  - `.anim-rise`: banda de feedback que sube desde abajo (translateY(100%) → 0, ease-spring).
  - Partículas del burst (`.fx-spark`): traslación radial + fade, 640ms.
  - Bloque `@media (prefers-reduced-motion: reduce)`: desactiva shake, burst, pulse y count-up (los valores aparecen directos).
- **`fx.js`** — global `window.FX`:
  - `FX.countUp(el, from, to, ms = 640)` — anima un número con `requestAnimationFrame`, formato `toLocaleString("es")`, respeta reduced-motion (salta al valor final).
  - `FX.burst(x, y, count = 14)` — crea `count` chispas absolutas con colores aurora (azul/cian/violeta/ámbar) que se autolimpian al terminar su animación.
  - `FX.sound` — Web Audio API: `correct` (tercera mayor breve), `wrong` (golpe grave suave), `complete` (arpegio ascendente), `streak` (shimmer), `perfect` (arpegio + octava). `FX.sound.enabled` con getter/setter persistido en `localStorage("coding-sound")`, default `true`. El `AudioContext` se crea perezosamente en la primera interacción del usuario (requisito de autoplay de los navegadores).
- **`Orb`** (componente en `app/web/screens/Orb.jsx`, global window) — esfera de luz: contenedor circular con 3 gradientes radiales superpuestos (azul/cian/violeta), `filter: blur` sutil en las capas internas, flotación idle (translateY ±4px, 4s loop). Props: `size` (px) y `mood`:
  - `idle` — flota.
  - `happy` — pulso + brillo 1.15 (320ms) y vuelve a idle.
  - `sad` — opacidad 0.55 + desaturación breve y vuelve a idle.
  - `celebrate` — escala 1.2 + doble pulso + dispara `FX.burst` en su centro.
- **Toggle de sonido** — `IconButton` nuevo en el NavBar (icono altavoz/altavoz tachado, SVG de línea agregado a `ICONS`), conmuta `FX.sound.enabled`.
- **Transiciones de pantalla** — en `app.jsx`, el contenedor de la pantalla activa lleva `key={route.screen + (route.lessonId || route.courseId || "")}` y clase `.anim-screen-in`, de modo que cada navegación re-monta con la animación de entrada.
- **Fix cosmético heredado:** el badge de racha del NavBar pasa de `"{n} dias"` a `"{n} día(s)"` correcto (`1 día`, `7 días`).

`index.html` agrega `<link href="/motion.css">` y `<script src="/fx.js">` (antes de los screens).

## 3. Modelo de datos

### Nueva tabla `exercises` (reemplaza a `quiz_questions`)

```sql
CREATE TABLE IF NOT EXISTS exercises (
  id VARCHAR(40) PRIMARY KEY,          -- estable, p.ej. "l5-ex1", "l5-ex2"
  lesson_id VARCHAR(30) NOT NULL,
  order_index INT NOT NULL,
  type ENUM('choice','blanks','order','match') NOT NULL,
  prompt TEXT NOT NULL,                -- enunciado
  payload JSON NOT NULL,               -- lo que ve el cliente (SIN respuestas)
  answer JSON NOT NULL,                -- solo servidor
  explain_ok TEXT NOT NULL,
  explain_bad TEXT NOT NULL,
  CONSTRAINT fk_ex_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`payload`/`answer` por tipo:

| type | payload (cliente) | answer (servidor) | respuesta del cliente |
|---|---|---|---|
| `choice` | `{options: [4 strings]}` | `{index: 0..3}` | `{index}` |
| `blanks` | `{code: [lines HTML con marcadores <b0>, <b1>…], bank: [fichas mezcladas, con distractores]}` | `{blanks: ["ficha", …] por hueco}` | `{blanks: [strings]}` |
| `order` | `{lines: [{id, html}] en orden mezclado}` | `{order: [ids en orden correcto]}` | `{order: [ids]}` |
| `match` | `{left: [4 strings], right: [4 strings mezclados]}` | `{pairs: [[iLeft, iRight], …]}` | `{pairs: [[l,r], …]}` |

- El marcador de hueco en `blanks` es el literal `<b0>`, `<b1>`… dentro de la línea HTML; el renderer lo sustituye por el slot interactivo.
- La mezcla (orden de `bank`, `lines`, `right`) se fija en el seed — determinista, sin barajar en runtime.
- `quiz_questions` se elimina: `schema.sql` incluye `DROP TABLE IF EXISTS quiz_questions;` (idempotente; no contiene datos de usuario — el progreso vive en `lesson_completions`/`xp_events`, que no se tocan).

### Nueva tabla `answer_attempts`

```sql
CREATE TABLE IF NOT EXISTS answer_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exercise_id VARCHAR(40) NOT NULL,
  context ENUM('lesson','review') NOT NULL DEFAULT 'lesson',
  correct TINYINT(1) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aa_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_aa_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Todo lo demás se **deriva** de los intentos (principio intacto: derivado, nunca almacenado):
- **Ejercicio superado** (por usuario): existe intento `correct=1`.
- **Lección completa**: todos sus ejercicios superados → se inserta `lesson_completions` (tabla existente, sigue alimentando racha/progreso) en la misma transacción del intento que completa.
- **Bonus perfecto**: al completar, no existe ningún intento `correct=0, context='lesson'` del usuario en ejercicios de esa lección.
- **Cola de repaso**: ejercicios con ≥1 intento incorrecto y sin intento `correct=1, context='review'` posterior al último incorrecto. (Fallar durante la lección y luego acertarla NO limpia el repaso: la idea — como Duolingo — es reforzar después lo que costó.)

## 4. API

- `GET /api/lessons/:id` — cambia: en vez de `quiz`, devuelve `exercises: [{id, type, prompt, payload}]` ordenados. Sin `answer` jamás. El resto (content, position, courseProgress…) igual.
- `POST /api/exercises/:id/answer` — body `{response, context?}` (`context` ∈ `lesson`(default)|`review`). Valida por tipo (respuesta malformada → `400` en español). Registra el intento. Respuesta:
  ```
  { correct, explanation,
    lessonCompleted,          // true solo en el intento que completa la lección
    xpAwarded,                // 50 al completar, +5 por corregir en repaso, 0 en otro caso
    perfectBonus,             // 10 si aplica (solo junto a lessonCompleted), 0 si no
    streak: {value, extended} | null,   // solo con lessonCompleted
    courseProgress, nextLessonId,       // solo con lessonCompleted
    reviewCleared             // true si context=review y este acierto limpió el ejercicio
  }
  ```
  Transaccional (patrón ya existente): completion + xp_events (+50 y +10 como eventos separados) en una transacción; `ER_DUP_ENTRY` tolerado.
- `GET /api/review` — `{count, exercises: [{id, type, prompt, payload, courseSubject, lessonTitle}]}` (máx. 10, más recientes primero).
- `GET /api/me` — `stats` gana `reviewCount` (para la tarjeta del dashboard).
- Se elimina `POST /api/lessons/:id/answer` (sustituida por la de ejercicios). Sin compatibilidad hacia atrás: frontend y backend se actualizan juntos.

## 5. Reglas de negocio (resumen)

1. Lección completa = todos sus ejercicios con al menos un acierto. **+50 XP** una única vez (transacción, `ER_DUP_ENTRY` tolerado).
2. **+10 XP** de bonus perfecto si no hubo fallos en modo lección antes de completarla (evento `xp_events` separado, también única vez — va en la misma transacción de completación).
3. **Repaso:** corregir un ejercicio en modo repaso da **+5 XP** por ejercicio (solo la primera vez que se limpia tras su último fallo) y lo saca de la cola. Fallar en repaso lo mantiene.
4. Racha, progreso, estados y desbloqueo: sin cambios (siguen derivándose de `lesson_completions`).
5. Cursos bloqueados: responder ejercicios de sus lecciones sigue devolviendo `403` (misma vía `courseDetail`). Los ejercicios en cola de repaso pertenecen a cursos ya desbloqueados por construcción.

## 6. Pantalla de lección (stepper)

`LessonScreen` se rediseña como flujo de pasos:

1. **Paso 0 — teoría:** el `content` actual + botón "Continuar" (el panel de teoría deja de convivir lado a lado con el quiz).
2. **Pasos 1..N — ejercicios:** uno a la vez. Header: botón volver, breadcrumb, **barra de progreso de la lección** (segmentos por paso, se llenan con brillo) y el contador "Lección X de Y" existente. El **orbe pequeño** (`size≈56`) flota junto al panel del ejercicio.
3. **Comprobar:** deshabilitado hasta que la respuesta esté completa (opción elegida / todos los huecos llenos / todas las líneas ordenadas / todos los pares).
4. **Feedback — banda inferior de vidrio** (reemplaza al Dialog): sube con `.anim-rise`; verde (`--semantic-success` tintado) con `explanation` y botón "Continuar" al acertar (orbe `happy`, `FX.sound.correct`, `.anim-pop` en el panel); roja al fallar con `explanation` y "Intentar de nuevo" (orbe `sad`, `FX.sound.wrong`, `.anim-shake`). No se avanza sin acertar.

Renderers (componentes compartidos en `app/web/screens/exercises.jsx`, globales window — los usan LessonScreen y ReviewScreen):
- `ChoiceExercise` — tarjetas actuales de opción.
- `BlanksExercise` — código con slots; banco de fichas pill de vidrio; tocar ficha → llena el siguiente slot vacío (o el seleccionado); tocar slot lleno → devuelve la ficha al banco.
- `OrderExercise` — dos zonas: "tu secuencia" (arriba, numerada) y líneas disponibles (abajo); tocar una línea la añade al final de la secuencia; tocar una línea de la secuencia la devuelve.
- `MatchExercise` — dos columnas; tocas una opción izquierda (queda resaltada) y una derecha para **proponer** el par, que se une visualmente con un conector neutro (sin indicar si es correcto — la respuesta vive solo en el servidor); tocar un par propuesto lo deshace. Con los 4 pares propuestos se habilita "Comprobar" y el conjunto se valida de una vez, consistente con los demás tipos.

## 7. Celebración post-lección

Cuando la respuesta trae `lessonCompleted: true`, la pantalla entera transiciona a `CelebrationScreen` (componente definido en `LessonScreen.jsx`; el repaso usa su propia mini-celebración inline, ver sección 8):

- Orbe grande (`size≈120`) en modo `celebrate` + `FX.burst` + `FX.sound.complete`.
- Título "¡Lección completada!" (heavy 800), subtítulo con el nombre de la lección.
- **XP cuenta hacia arriba** con `FX.countUp` (+50); si `perfectBonus`, aparece después una línea "Perfecto +10" con `FX.sound.perfect`.
- Si `streak.extended`: la llama (icono `flame` existente) se enciende con `.anim-pulse-glow` y el texto "Racha: N días" (`FX.sound.streak`).
- Anillo `Progress shape="ring"` animado del progreso anterior al nuevo (interpolación JS del prop `value`).
- Botones: "Siguiente lección" (si `nextLessonId`) / "Volver al temario". El Toast global de XP se elimina de este flujo (la celebración lo reemplaza); `refreshMe()` se mantiene.

## 8. Repaso de errores (UI)

- **Dashboard:** si `stats.reviewCount > 0`, tarjeta "Repaso" con tinte ámbar entre las stats y el grid: "N ejercicios por repasar · +5 XP cada uno" + botón "Repasar ahora". Sin errores, no se renderiza.
- **`ReviewScreen`** (pantalla nueva, ruta `review`): mismo stepper de ejercicios (reutiliza los renderers y la banda de feedback) con `context: 'review'`; muestra materia/lección de origen como eyebrow de cada ejercicio. Al terminar la tanda: mini-celebración (orbe `celebrate`, "+N XP de repaso" con countUp) y "Volver al inicio". Los fallidos en la sesión permanecen en cola para la próxima.

## 9. Contenido (seed)

- Cada una de las 64 lecciones pasa de `quiz` a `exercises: [ex1, ex2]` en `seed-data/`:
  - `ex1` = el choice existente convertido (id `"<lessonId>-ex1"`, mismo texto/opciones/explicaciones).
  - `ex2` = **nuevo ejercicio estructurado** acorde al tema: `blanks` para sintaxis (SQL, Java, JS, HTML/CSS), `order` para algoritmos/flujos/secuencias, `match` para conceptos↔definiciones. Reglas de contenido idénticas al seed actual (español con tuteo, código técnicamente correcto, spans de color en código, sin emoji). Distractores plausibles en `blanks` (≥2 por ejercicio).
- Mezclas por tipo balanceadas por materia (no todos `match`); total 128 ejercicios.
- `seed.js` upserta `exercises` por id estable; sigue sin tocar datos de usuario.

## 10. Errores y testing

- **Validadores puros** por tipo en `app/server/services/exercises.js`: `validateResponse(type, payload, answer, response) → {valid, correct}` — `valid:false` para respuestas malformadas → `400 "Tu respuesta no tiene el formato esperado"`. Tests unitarios exhaustivos por tipo (correcta, incorrecta, parcial, ids falsos, tipos de dato erróneos).
- **Integración:** intento registrado con contexto correcto; lección completa solo al superar todos los ejercicios; +50/+10 una única vez; repaso: fallo en lección encola, acierto en lección NO desencola, acierto en repaso desencola y da +5 una vez; `GET /api/review` limita a 10; ningún payload serializado contiene `answer` ni `correct` (test de fuga); `403` en curso bloqueado; `GET /api/me` con `reviewCount`.
- **Seed:** 128 ejercicios, cada lección exactamente 2, payloads bien formados por tipo (blanks: nº de huecos == nº de respuestas y fichas del answer presentes en el bank; order: mismos ids en payload y answer; match: 4×4).
- **Frontend:** sin tests automáticos; checklist E2E en navegador (flujo completo con los 4 tipos, celebración con XP/racha/anillo, repaso de un error inducido, toggle de sonido, reduced-motion).

## 11. Fuera de alcance (= sub-proyecto 2: "El meta-juego")

Alcance ya acordado con el usuario para la siguiente iteración: meta diaria de XP configurable, logros/insignias con toast de desbloqueo, niveles derivados del XP, **protector de racha** (canjeable con XP), páginas de Perfil y Progreso (heatmap de actividad estilo GitHub, gráfica semanal de XP, logros). También fuera de este sub-proyecto: ejecución de código libre, drag & drop, vidas/corazones, tabla de líderes, migración a build moderno.
