# El meta-juego, Iteración A: lo derivado — diseño

**Fecha:** 2026-07-14 · **Estado:** aprobado por el usuario
**Contexto:** sub-proyecto 3 del roadmap. Las iteraciones anteriores dieron a Coding su loop (lecciones, XP, racha, repaso) y su materialidad (coreografía de gota, vidrio vivo). Esta le da un **meta-juego**: una razón para volver mañana que no sea la siguiente lección.

**Motivación literal:** las pestañas `Inicio`, `Materias` y `Progreso` de la navbar **no llevan a ningún lado** — el router de `app.jsx` nunca lee el estado `tab`. Son tres controles muertos desde la primera iteración. Esta spec les da destino.

---

## 1. Alcance

**El sub-proyecto se parte en dos por su línea de fractura arquitectónica: lo derivado y lo almacenado.** Esta spec es la **Iteración A: lo derivado**.

**Dentro:**

1. **Niveles** derivados del XP total (función pura, cero almacenamiento).
2. **Logros** derivados de los eventos ya existentes, con **toast de desbloqueo**.
3. **Routing real de las pestañas**: `Inicio` (tu hoy) · `Materias` (el catálogo) · `Progreso` (nueva).
4. **Página de Progreso**: nivel, heatmap de actividad, gráfica semanal de XP, colección de logros.
5. Enlace a **Progreso** desde el menú del avatar.

**Fuera — es la Iteración B ("la economía"):**

- **Meta diaria de XP configurable.** Es una preferencia del usuario: no se deriva de nada, exige columna nueva en `users`.
- **Protector de racha canjeable con XP.** Obliga a cambiar `currentStreak`, la función pura más delicada de la app (tendría que saber qué huecos cubrió un escudo).
- **Página de Perfil.** En A no tendría contenido propio: el menú del avatar ya da nombre, email y cerrar sesión. En B nace con una razón real — ser el sitio de los ajustes.

**Consecuencia clave del alcance: esta iteración NO toca el esquema.** Cero tablas, cero columnas, cero migraciones.

---

## 2. La decisión técnica: cómo se desbloquea un logro sin guardarlo

Los logros son derivables de `lesson_completions` + `xp_events` + `answer_attempts`. Pero el **toast** necesita saber *cuándo* cae uno. Tres caminos:

| | Cómo | Coste |
|---|---|---|
| **A (elegido)** | Al responder un ejercicio, el servidor calcula el conjunto de logros **antes** de la transacción y **después**, y devuelve la diferencia | Cero almacenamiento. Dos cálculos por respuesta |
| B | Tabla `user_achievements` con `unlocked_at` | Rompe el principio central; migración; **si mañana cambias la regla de un logro, la tabla y las reglas divergen y ya no sabes cuál manda** |
| C | Derivar, pero guardar un "visto" | Sigue necesitando tabla y sigue teniendo la divergencia, a cambio de muy poco |

**Vamos con A.** Es literalmente el principio del proyecto ("todo lo derivable se calcula, nunca se almacena"). Lo único que se pierde es la fecha de desbloqueo, que no se muestra en ninguna parte. Si el usuario se pierde el toast, el logro sigue ahí en Progreso — el toast es ceremonia, no registro.

---

## 3. Niveles (`app/server/services/levels.js`, puro)

**La curva está anclada al techo real del juego.** El XP máximo sin fallar nunca es `64 lecciones × 50 = 3.200` (más hasta 640 de bonus "Perfecto"; el repaso solo da XP si fallas, así que un jugador impecable nunca lo toca). Por eso **el último nivel se alcanza exactamente al terminar el temario**: completar las 64 lecciones te hace Maestro, y los bonus solo te llevan allí antes.

```js
export const LEVELS = [
  { n: 1,  name: "Aprendiz",      xp: 0 },
  { n: 2,  name: "Practicante",   xp: 50 },    // tu primera lección
  { n: 3,  name: "Junior",        xp: 150 },
  { n: 4,  name: "Desarrollador", xp: 300 },
  { n: 5,  name: "Semi-senior",   xp: 500 },
  { n: 6,  name: "Senior",        xp: 750 },
  { n: 7,  name: "Especialista",  xp: 1050 },
  { n: 8,  name: "Tech lead",     xp: 1400 },
  { n: 9,  name: "Referente",     xp: 1800 },
  { n: 10, name: "Principal",     xp: 2250 },
  { n: 11, name: "Arquitecto",    xp: 2700 },
  { n: 12, name: "Maestro",       xp: 3200 },  // = las 64 lecciones
];
```

Saltos: 50, 100, 150, 200, 250, 300, 350, 400, 450, 450, 500 — curva ascendente, sin muros.

```js
// levelFor(xp) → { n, name, xp, next, xpInLevel, xpToNext, progress }
// - `next`: el objeto del siguiente nivel, o null si ya es Maestro.
// - `xpInLevel`: XP acumulado dentro del nivel actual (xp - LEVELS[n-1].xp).
// - `xpToNext`: XP que falta para el siguiente (0 si es Maestro).
// - `progress`: 0..100, porcentaje dentro del nivel actual (100 si es Maestro).
```

Casos borde que la función debe cubrir (y que tendrán test): `xp = 0` → Aprendiz al 0%; `xp` exactamente en un umbral → el nivel nuevo al 0%; `xp` por encima de 3.200 → Maestro al 100% con `next: null` y `xpToNext: 0`.

---

## 4. Logros (`app/server/services/achievements.js`, puro)

### El contrato

```js
// El catálogo es una constante; cada logro declara cómo se mide.
// unlockedFor(stats) → Set<id>        (qué logros están desbloqueados)
// achievementsFor(stats) → [{ id, name, description, secret, unlocked, current, target }]
//   - `current`/`target`: progreso del contador (para "12 de 25"). En los secretos, target es 1.
//   - Un secreto NO desbloqueado se sirve con name/description ocultos (ver §6).
```

`stats` es un objeto de contadores **derivados** que el servicio de progreso arma una sola vez:

```js
{
  lessonsDone,        // COUNT(lesson_completions)
  bestStreak,         // gamification.bestStreak(days)
  perfectLessons,     // COUNT(xp_events WHERE amount = 10 AND lesson_id IS NOT NULL)
  coursesCompleted,   // progress.coursesForUser → status === "COMPLETADO"
  reviewCleared,      // COUNT(xp_events WHERE amount = 5)
  earlyBird,          // ¿alguna lesson_completions con hora < 07:00?
  nightOwl,           // ¿alguna lesson_completions con hora entre 00:00 y 04:59?
  resurrected,        // ¿algún ejercicio con ≥3 intentos incorrectos y luego un acierto en context='review'?
  perfectRun,         // racha máxima de lecciones perfectas consecutivas (por completed_at)
}
```

**Nota sobre `perfectLessons` y `reviewCleared`:** se derivan del importe del `xp_event` (10 = bonus perfecto, 5 = repaso corregido), que son las únicas fuentes de esos importes en toda la app. Los tres importes (50/10/5) se extraen a constantes compartidas (`XP_LESSON`, `XP_PERFECT`, `XP_REVIEW`) en `services/xp.js` y se usan **tanto al escribirlos como al leerlos**, para que no haya números mágicos duplicados.

### El catálogo (17)

**Volumen** (visibles, progreso = `lessonsDone`)

| id | Nombre | Descripción | Umbral |
|---|---|---|---|
| `primera-leccion` | Primer paso | Completa tu primera lección | 1 |
| `diez-lecciones` | Tomando ritmo | Completa 10 lecciones | 10 |
| `veinticinco-lecciones` | Medio camino | Completa 25 lecciones | 25 |
| `todas-las-lecciones` | Sin dejar una | Completa las 64 lecciones | 64 |

**Constancia** (visibles, progreso = `bestStreak`)

| id | Nombre | Descripción | Umbral |
|---|---|---|---|
| `racha-3` | Tres días seguidos | Estudia 3 días seguidos | 3 |
| `racha-7` | Una semana entera | Estudia 7 días seguidos | 7 |
| `racha-14` | Dos semanas | Estudia 14 días seguidos | 14 |
| `racha-30` | Un mes sin fallar | Estudia 30 días seguidos | 30 |

**Oficio** (visibles)

| id | Nombre | Descripción | Contador | Umbral |
|---|---|---|---|---|
| `primera-perfecta` | Sin un error | Termina una lección sin fallar ni una vez | `perfectLessons` | 1 |
| `cinco-perfectas` | Pulso firme | Termina 5 lecciones perfectas | `perfectLessons` | 5 |
| `primer-curso` | Materia dominada | Completa una materia entera | `coursesCompleted` | 1 |
| `todos-los-cursos` | El plan completo | Completa las 6 materias | `coursesCompleted` | 6 |

**Repaso** (visible)

| id | Nombre | Descripción | Contador | Umbral |
|---|---|---|---|---|
| `diez-repasos` | Nada se queda atrás | Corrige 10 ejercicios en repaso | `reviewCleared` | 10 |

**Secretos** (4 — se muestran como `???` hasta caer)

| id | Nombre | Descripción | Regla |
|---|---|---|---|
| `madrugador` | Madrugador | Terminaste una lección antes de las 7 de la mañana | `earlyBird` |
| `nocturno` | Turno de noche | Terminaste una lección de madrugada | `nightOwl` (00:00–04:59) |
| `resucitado` | Segunda oportunidad | Acertaste en repaso un ejercicio que habías fallado tres veces | `resurrected` |
| `impecable` | Racha impecable | Cinco lecciones perfectas seguidas | `perfectRun >= 5` |

Copy en español con tuteo, sentence case, sin emoji. Los umbrales de volumen (1/10/25/64) y de constancia (3/7/14/30) llevan test de borde: justo debajo, justo encima, y exactamente en el umbral.

---

## 5. Reglas de negocio nuevas

1. **Un logro nunca se "pierde".** Los contadores usados son monótonos (`lessonsDone`, `bestStreak`, `perfectLessons`, `coursesCompleted`, `reviewCleared` solo crecen; los booleanos secretos solo pasan de falso a verdadero). Esto es lo que hace seguro derivarlos: el conjunto de desbloqueados nunca encoge.
   - **Ojo con `bestStreak` y no `streak`:** la racha *actual* sí baja. Los logros de constancia se miden contra la **mejor** racha histórica, así que perder la racha no te quita el logro.
2. **El toast solo puede dispararse en `POST /exercises/:id/answer`.** Es la única acción que muta el estado del juego. Es imposible desbloquear un logro navegando.
3. **Se pueden desbloquear varios logros de golpe** (terminar la última lección puede caer `todas-las-lecciones`, `todos-los-cursos` y `primer-curso` a la vez). El endpoint devuelve un array y el frontend los encola.

---

## 6. API

**`GET /progress`** (nuevo, requiere auth):

```json
{
  "level": { "n": 6, "name": "Senior", "xp": 820, "xpInLevel": 70, "xpToNext": 230, "progress": 23, "next": { "n": 7, "name": "Especialista", "xp": 1050 } },
  "achievements": [
    { "id": "diez-lecciones", "name": "Tomando ritmo", "description": "Completa 10 lecciones", "secret": false, "unlocked": true, "current": 16, "target": 10 },
    { "id": "madrugador", "name": "???", "description": "Un logro secreto", "secret": true, "unlocked": false, "current": 0, "target": 1 }
  ],
  "heatmap": [ { "day": "2026-07-14", "lessons": 3, "xp": 170 } ],
  "weekXp": [ { "day": "2026-07-08", "xp": 60 } ]
}
```

- `heatmap`: **365 días** hasta hoy inclusive, **incluyendo los días vacíos** (`lessons: 0, xp: 0`) — así el frontend no tiene que rellenar huecos.
- `weekXp`: los **7 últimos días** (incluido hoy), también con los vacíos.
- **Regla de oro de los secretos:** un secreto **no desbloqueado** se sirve con `name: "???"` y `description: "Un logro secreto"`. **Su nombre real no sale del servidor.** Un secreto que se pueda leer en las herramientas de red no es un secreto.
- El "día" se deriva SIEMPRE del reloj de Node (`toDayString`), nunca de `CURDATE()` — misma regla que la racha.

**`POST /exercises/:id/answer`** gana un campo en su respuesta:

```json
{ "…lo de siempre…", "achievementsUnlocked": [ { "id": "primera-perfecta", "name": "Sin un error", "description": "Termina una lección sin fallar ni una vez" } ] }
```

- Array vacío en el caso normal.
- **Los secretos recién desbloqueados SÍ salen con su nombre real aquí** — acaban de caer, ya no son secretos.
- Se calcula como diff: conjunto de desbloqueados **antes** de la transacción vs **después**. Si la respuesta es incorrecta o no cambia nada, el array va vacío.

**`GET /me`** gana **un solo campo**, `stats.level` (`{ n, name, progress }`), para que Inicio pueda pintar el nivel sin pedir `/progress`. El resto de su forma no cambia: los tests actuales que lo comprueban siguen valiendo tal cual.

---

## 7. Frontend

### El router (`app/web/app.jsx`) — aquí está el bug de las pestañas

Hoy `tab` se pasa a las pantallas y **nadie lo lee**. Cambia a:

```jsx
// Las pestañas SON navegación: cambiar de pestaña te lleva al área principal.
const goTab = (id) => { setTab(id); setRoute({ screen: "dashboard" }); };
// …
} else if (route.screen === "dashboard") {
  screen = tab === "materias" ? <MateriasScreen … />
         : tab === "progreso" ? <ProgressScreen … />
         : <InicioScreen … />;
}
```

`goTab` se pasa como `setTab` a **todas** las NavBar, así que las pestañas funcionan también desde una lección o el repaso (te sacan al área principal). La `key` del div de pantalla incluye el `tab`, para que cambiar de pestaña reproduzca la transición.

### Pantallas

| Archivo | Qué es |
|---|---|
| `screens/InicioScreen.jsx` (nuevo; sustituye a `DashboardScreen.jsx`) | **Tu hoy**: nivel con su anillo, racha, XP semanal, "Continúa donde quedaste", tarjeta de repaso, y un bloque **"Estás cerca de…"**. Ya NO lleva la parrilla de materias. |

**Sobre "Estás cerca de…":** el enfoque A **no guarda fechas de desbloqueo**, así que "tus últimos logros" no existe — no hay cronología que derivar. En su lugar, Inicio muestra el contador (`7 de 17 logros`) y los **3 logros bloqueados más cerca de caer** (mayor `current / target` entre los **no secretos**), con su barra: *"Te faltan 2 lecciones para Medio camino"*. Es derivable, y además es mejor producto: lo que te hace volver mañana es lo que casi tienes, no lo que ya ganaste.
| `screens/MateriasScreen.jsx` (nuevo) | **El catálogo**: la parrilla de los 6 cursos (se lleva `CourseCard` desde el antiguo Dashboard). Al no competir por espacio, las tarjetas respiran más. |
| `screens/ProgressScreen.jsx` (nuevo) | **Progreso**: nivel grande con anillo y "faltan 230 XP para Especialista", **heatmap** de 365 días, **gráfica semanal** de barras, y la **colección de logros**. |

`DashboardScreen.jsx` se **elimina**; el orden de `<script>` en `index.html` se actualiza (es la resolución de dependencias). `CourseCard` vive ahora en `MateriasScreen.jsx`.

### El heatmap y la gráfica (sin dependencias)

- **Heatmap**: grilla CSS de 53 columnas × 7 filas, una celda por día. Intensidad por número de lecciones: 0 → `--glass-bg-subtle`; 1 → cian al 30%; 2 → cian al 55%; 3+ → cian al 85%. Cada celda con `title` (tooltip nativo) `"3 lecciones · 170 XP · 14 jul"`. **Cero librerías**: es una grilla de divs.
- **Gráfica semanal**: 7 barras, altura relativa al máximo de la semana, con el valor encima. Divs con `height` en %. Si la semana está a cero, se muestran las barras vacías (no se divide por cero).

### El toast de logro (el momento)

Nuevo componente `AchievementToast` en `AppShell.jsx`. Cuando `POST /answer` devuelve `achievementsUnlocked`, `LessonScreen`/`ReviewScreen` lo pasan a `app.jsx`, que los **encola** (si caen tres a la vez, se muestran uno tras otro, 2.600ms cada uno).

Habla el lenguaje: **cae como una gota** desde arriba (`anim-drop-in`, ya existe), suena (`FX.sound.play("achievement")` — arpegio nuevo, sintetizado, sin assets), y al cerrarse **se evapora** (`anim-evaporate`, ya existe). Usa `usePhase` para retener el contenido durante la salida. El blur va en su capa `aria-hidden`, jamás sobre el texto.

**Colisión con la celebración:** al completar una lección perfecta puede caer un logro *y* abrirse la `CelebrationScreen`. El toast se monta **por encima** (`z-index` mayor) y espera a que el bloom pase: se encola con **900ms de retardo** cuando la respuesta trae `lessonCompleted: true`, para no pisar la ceremonia.

### El menú del avatar

Gana una entrada **"Progreso"** encima de "Cerrar sesión", que hace `goTab("progreso")`. (Perfil llegará en la Iteración B.)

---

## 8. Lo que NO cambia

- El esquema de la base de datos. **Cero migraciones.**
- Las reglas del loop: completar una lección, la racha, el repaso, el desbloqueo de `bd2`.
- `Coding Design System/` (intocable).
- La coreografía de gota y el vidrio vivo (se **consumen**, no se modifican).

---

## 9. Verificación

1. **Tests unitarios nuevos (puros, TDD estricto):**
   - `levels.js`: cada umbral, los tres bordes (0 XP, exactamente en umbral, por encima del techo), `progress` dentro del nivel, `next: null` en Maestro.
   - `achievements.js`: cada logro en su umbral exacto, justo debajo y justo encima; los 4 secretos; que un secreto bloqueado **no filtre su nombre**; que el conjunto nunca encoja al crecer los contadores.
2. **Tests de integración nuevos:** `GET /progress` (forma, 365 días con huecos, 7 días de semana, 401 sin token); `POST /answer` devolviendo `achievementsUnlocked` (vacío en el caso normal; con el logro al cruzar el umbral; varios de golpe).
3. **Los 57 tests actuales siguen pasando** — esta iteración no toca sus reglas.
4. **Checklist E2E en navegador** (con trap `window.onerror`, que `read_console_messages` no reporta excepciones no capturadas):
   - Las tres pestañas navegan de verdad, desde cualquier pantalla.
   - Inicio muestra el nivel; Materias muestra las 6 tarjetas; Progreso muestra heatmap, gráfica y logros.
   - Los secretos se ven como `???` y su nombre real **no aparece en la respuesta de red**.
   - Al cruzar un umbral, cae el toast; con la celebración de por medio, no la pisa.
   - Regresión: la coreografía de gota, el ripple, los reveals y la navbar líquida siguen intactos.
5. **Verificación humana pendiente:** el *feel* del toast y del heatmap necesita un navegador en primer plano (el panel del tooling congela `rAF` y el `IntersectionObserver`).

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El diff de logros calcula el conjunto dos veces por respuesta (varias queries) | Es una app local de un solo usuario; el coste es de milisegundos. Si molestara, se calcula el "antes" solo cuando la respuesta es **correcta** (una incorrecta no puede desbloquear nada) |
| Los importes 50/10/5 como números mágicos duplicados al leer y al escribir | Se extraen a `services/xp.js` (`XP_LESSON`, `XP_PERFECT`, `XP_REVIEW`) y se usan en ambos lados |
| Un secreto se filtra por la API antes de desbloquearse | El servidor **nunca** serializa el nombre real de un secreto bloqueado; hay test explícito |
| Partir `DashboardScreen` rompe el orden de scripts de `index.html` | El orden es la resolución de dependencias: se actualiza en la misma tarea que crea los archivos, y la verificación E2E lo cubre |
| El toast pisa la celebración | 900ms de retardo cuando la respuesta trae `lessonCompleted` |
