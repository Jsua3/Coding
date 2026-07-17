# Ingeniería de requisitos + niveles que se ganan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La 7ª materia del catálogo — Ingeniería de requisitos (7 lecciones, 14 ejercicios, contenido 100% original desde el canon) — junto a la curva de niveles recalibrada (techo 3.550, títulos 2-2,7× más exigentes) y los logros de catálogo actualizados (71 lecciones / 7 materias).

**Architecture:** Un archivo nuevo de seed-data (`reqsw.js`) con el patrón exacto de `bd1.js`, registrado en `seed.js` (upsert idempotente, cero frontend, cero esquema). La curva entra por TDD en `levels.js` + `levels.test.js`; los logros son 2 valores estáticos en `achievements.js`. El contenido se escribe en 2 tandas (rq1-rq4 con el archivo sin registrar — todo verde entre tareas — y rq5-rq7 + registro + tests de totales).

**Tech Stack:** Node ESM (backend), node:test + supertest contra MariaDB real. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-07-17-curso-requisitos-design.md` — el temario detallado (beats por lección, quiz y extra de cada una) vive en su §2 y ES la fuente de requisitos del contenido.

## Global Constraints

- **Copyright — innegociable:** contenido 100% ORIGINAL. Ni una frase de los PDFs de `docs/documentos-carrera/` (no hace falta abrirlos: el temario ya está en el spec). El canon (Pressman, SWEBOK, IEEE 29148, MoSCoW, historias de usuario) se redacta con palabras propias y **ejemplos propios** (dominio: una app de biblioteca y un carrito de compras).
- **Copy:** español con tuteo, sentence case, sin emoji, metadatos con "·". Terminología estable en todo el curso (el término inglés entre paréntesis solo la primera vez: "elicitación (elicitation)").
- **Correctitud de ejercicios:** una única respuesta defendible; distractores plausibles pero inequívocamente incorrectos; el índice `correct` de los choice VARÍA entre lecciones (jamás un patrón); en `match`, `right` va MEZCLADO y los pares se definen por índice (`answer.pairs: [[l,r],…]` como en `bd1.js`); en `blanks`, el banco lleva las respuestas + ≥2 distractores; en `order`, `lines` van MEZCLADAS en el payload y `answer.order` lleva los ids en el orden correcto.
- **Spans de color** solo dentro de template literals con las constantes `K/S/N/C` (definidas arriba del archivo). Jamás `${}` dentro de strings con comillas dobles en seed-data.
- **Números exactos del spec:** curva `[0, 100, 400, 800, 1250, 1800, 2300, 2750, 3100, 3350, 3500, 3550]`; logros `todas-las-lecciones` target **71** ("Completa las 71 lecciones") y `todos-los-cursos` target **7** ("Completa las 7 materias"); totales del seed **7 cursos, 71 lecciones, 142 ejercicios**; identidad del curso verbatim del spec §2 (`id: "reqsw"`, tone `violet`, order `7`, prereq `null`); ids `reqsw-u1`/`reqsw-u2` y `rq1`…`rq7`.
- **Tests con dientes:** al ajustar tests existentes a la vara nueva, se preserva la INTENCIÓN de cada test (p. ej. el test de "el nivel NO baja al gastar" debe seguir distinguiendo nivel-por-ganado de nivel-por-saldo — con la vara nueva eso exige un escenario con ≥100 XP ganados). Cero tests en rojo al cerrar cada tarea.
- **Cero frontend, cero esquema.** El curso aparece solo (data-driven). `violet` ya existe en el ENUM.
- **Entorno:** `npm test` desde `app/` (BD `coding_test`, se trunca sola); la BD dev se actualiza con `npm run seed` SOLO en la verificación final (no toca usuarios ni progreso). Dev server :3000 (no matarlo), cuenta de pruebas `juan@test.dev` / `secreto1`.

---

### Task 1: La vara nueva — curva de niveles + logros (TDD)

**Files:**
- Modify: `app/server/services/levels.js` (el array `LEVELS` + comentario de cabecera; `levelFor` NO se toca)
- Modify: `app/server/services/achievements.js:10,20` (2 targets + 2 descripciones)
- Test: `app/test/levels.test.js` (reescritura de asserts), `app/test/me.test.js:77-89`, `app/test/progress-api.test.js:62-63,83-84`

**Interfaces:**
- Produces: `LEVELS` con los 12 umbrales nuevos (mismos nombres, mismos `n`); `ACHIEVEMENTS` con targets 71/7. Nada más cambia de forma.

- [ ] **Step 1: Reescribir `levels.test.js` a la vara nueva (RED primero)**

Reemplaza el contenido de `app/test/levels.test.js` por:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, levelFor } from "../server/services/levels.js";

test("la curva es ascendente, sin huecos ni retrocesos", () => {
  assert.equal(LEVELS.length, 12);
  assert.equal(LEVELS[0].xp, 0);
  for (let i = 1; i < LEVELS.length; i++) {
    assert.equal(LEVELS[i].n, i + 1);
    assert.ok(LEVELS[i].xp > LEVELS[i - 1].xp, `el nivel ${i + 1} no supera al anterior`);
  }
  // El último nivel se alcanza justo al terminar el temario: 71 lecciones x 50 XP.
  assert.equal(LEVELS[11].xp, 71 * 50);
  assert.equal(LEVELS[11].name, "Maestro");
  assert.deepEqual(LEVELS.map((l) => l.name), [
    "Aprendiz", "Practicante", "Junior", "Desarrollador", "Semi-senior", "Senior",
    "Especialista", "Tech lead", "Referente", "Principal", "Arquitecto", "Maestro",
  ]);
});

test("la curva exige de verdad: los umbrales son los acordados", () => {
  // La vara nueva: cada título tiene ancla narrativa (Junior ≈ tu primer curso;
  // Senior = la mitad del temario; Maestro = el temario entero).
  assert.deepEqual(LEVELS.map((l) => l.xp), [0, 100, 400, 800, 1250, 1800, 2300, 2750, 3100, 3350, 3500, 3550]);
});

test("sin XP eres Aprendiz al 0%", () => {
  const l = levelFor(0);
  assert.equal(l.n, 1);
  assert.equal(l.name, "Aprendiz");
  assert.equal(l.progress, 0);
  assert.equal(l.xpInLevel, 0);
  assert.equal(l.xpToNext, 100);
  assert.equal(l.next.name, "Practicante");
});

test("cada umbral exacto entra en su nivel al 0%", () => {
  for (const lvl of LEVELS) {
    const l = levelFor(lvl.xp);
    assert.equal(l.n, lvl.n, `xp ${lvl.xp} deberia ser nivel ${lvl.n}`);
    assert.equal(l.xpInLevel, 0);
  }
});

test("justo debajo de un umbral sigues en el nivel anterior", () => {
  assert.equal(levelFor(99).n, 1);
  assert.equal(levelFor(100).n, 2);
  assert.equal(levelFor(3549).n, 11);
  assert.equal(levelFor(3550).n, 12);
});

test("el progreso dentro del nivel se calcula sobre el tramo", () => {
  // Nivel 2 (Practicante) va de 100 a 400: 300 XP de tramo.
  const l = levelFor(250);
  assert.equal(l.n, 2);
  assert.equal(l.xpInLevel, 150);
  assert.equal(l.xpToNext, 150);
  assert.equal(l.progress, 50);
});

test("en el ultimo nivel no hay siguiente y el progreso es 100", () => {
  const l = levelFor(5000);
  assert.equal(l.n, 12);
  assert.equal(l.name, "Maestro");
  assert.equal(l.next, null);
  assert.equal(l.xpToNext, 0);
  assert.equal(l.progress, 100);
});

test("XP invalido o negativo no rompe: eres Aprendiz", () => {
  assert.equal(levelFor(-10).n, 1);
  assert.equal(levelFor(undefined).n, 1);
});

test("el progreso nunca llega a 100 si todavia falta XP para el siguiente nivel", () => {
  for (const xp of [99, 399, 799, 1249, 1799, 2299, 2749, 3099, 3349, 3499, 3549]) {
    const l = levelFor(xp);
    assert.ok(l.next !== null, `${xp} XP deberia tener nivel siguiente`);
    assert.ok(l.xpToNext > 0, `${xp} XP deberia tener XP pendiente`);
    assert.ok(l.progress < 100, `${xp} XP: progress ${l.progress} no puede ser 100 si faltan ${l.xpToNext} XP`);
  }
});
```

(El archivo pasa de 8 a 9 tests: gana el de umbrales exactos.)

- [ ] **Step 2: RED**

Run (desde `app/`): `npm test -- --test-name-pattern "curva|umbral|Aprendiz|progreso" 2>&1 | tail -20` — o la suite entera si el filtro no coopera.
Expected: FAIL — los asserts nuevos (3550, umbrales, xpToNext 100…) chocan contra la curva vieja.

- [ ] **Step 3: La curva nueva en `levels.js`**

Reemplaza el array `LEVELS` y su comentario de cabecera por:

```js
// Los niveles cuentan tu carrera en el oficio, y la curva está anclada al techo real del juego:
// el último nivel se alcanza exactamente al terminar el temario (71 lecciones x 50 XP = 3550).
// Los bonus de "Perfecto" solo te llevan allí antes. La vara es exigente a propósito (pedido del
// usuario): cada título tiene ancla narrativa — lo llevas cuando de verdad estás ahí.
export const LEVELS = [
  { n: 1, name: "Aprendiz", xp: 0 },
  { n: 2, name: "Practicante", xp: 100 },   // tus primeras 2 lecciones: el ding temprano se conserva
  { n: 3, name: "Junior", xp: 400 },        // ≈ tu primer curso completo
  { n: 4, name: "Desarrollador", xp: 800 }, // ≈ dos cursos
  { n: 5, name: "Semi-senior", xp: 1250 },  // un tercio del temario
  { n: 6, name: "Senior", xp: 1800 },       // la mitad del temario
  { n: 7, name: "Especialista", xp: 2300 }, // dos tercios
  { n: 8, name: "Tech lead", xp: 2750 },    // ~55 lecciones
  { n: 9, name: "Referente", xp: 3100 },    // ~62 lecciones
  { n: 10, name: "Principal", xp: 3350 },   // casi todo el catálogo
  { n: 11, name: "Arquitecto", xp: 3500 },  // todo menos una lección
  { n: 12, name: "Maestro", xp: 3550 },     // el temario entero: la última lección te corona
];
```

`levelFor` queda EXACTAMENTE igual.

- [ ] **Step 4: Los 2 logros de catálogo en `achievements.js`**

Línea 10: `target: 64` → `target: 71` y descripción `"Completa las 64 lecciones"` → `"Completa las 71 lecciones"`.
Línea 20: `target: 6` → `target: 7` y descripción `"Completa las 6 materias"` → `"Completa las 7 materias"`.
Nada más del archivo cambia.

- [ ] **Step 5: Ajustar los tests de rutas a la vara nueva (preservando sus dientes)**

Corre la suite: `npm test`. Además de los ya arreglados, fallarán los tests de rutas que afirman niveles con XP concretos. Ajusta EXACTAMENTE estos, leyendo su contexto:

1. **`app/test/me.test.js` ~77-79** (tras ganar ~50-60 XP afirmaba n2/Practicante): con la vara nueva ese XP es **n1 "Aprendiz"** — ajusta `n`, `name` y `progress` al valor que corresponda al XP real del escenario (`progress = Math.floor(xp/100*100)`).
2. **`app/test/me.test.js` ~83-89** (el test del split: "60 XP ganados → nivel 2; un gasto de 50 no lo baja"). Con 60 XP ambos lados serían Aprendiz y el test perdería los dientes. **Sube el escenario a ≥100 XP ganados** (p. ej. el evento positivo pasa de +60 a +110, o añade un segundo evento positivo) y ajusta los asserts a **n2/"Practicante" antes Y después del gasto** — así el assert sigue demostrando que el nivel sale del XP GANADO y no del saldo. Actualiza el comentario del test a los números nuevos.
3. **`app/test/progress-api.test.js` ~62-63 y ~83-84** ("50 XP = Practicante"): con la vara nueva 50 XP es **n1/"Aprendiz"** — ajusta valores y comentarios. La intención (el nivel refleja el XP ganado) se conserva porque los valores esperados siguen siendo exactos.

Si algún otro test falla por niveles, ajústalo con el mismo criterio (valores exactos de la vara nueva, intención intacta) y déjalo anotado en tu reporte. Los logros NO tienen tests con 64/6 (verificado por grep) — si aun así algo rompe por targets, mismo criterio.

- [ ] **Step 6: GREEN — suite entera**

Run: `npm test`
Expected: `tests 138 … pass 138 … fail 0` (137 + 1 test nuevo de umbrales). Si tu conteo difiere, explica por qué en el reporte (p. ej. otro test ajustado); lo innegociable es `fail 0`.

- [ ] **Step 7: Commit**

```bash
git add app/server/services/levels.js app/server/services/achievements.js app/test/levels.test.js app/test/me.test.js app/test/progress-api.test.js
git commit -m "feat: la curva de niveles exige de verdad (techo 3550) y los logros de catalogo van a 71/7"
```

---

### Task 2: Contenido I — `reqsw.js` con la identidad y rq1-rq4 (sin registrar)

**Files:**
- Create: `app/server/seed-data/reqsw.js` (identidad + Unidad 1 completa + rq3, rq4 de la Unidad 2)

**Interfaces:**
- Produces: default export con `{ id: "reqsw", …, units: [reqsw-u1(rq1,rq2), reqsw-u2(rq3,rq4)] }`. La Task 3 AÑADE rq5-rq7 a `reqsw-u2` y lo registra.
- **El archivo NO se importa en `seed.js` todavía** — la suite queda intacta (los totales siguen siendo 6/64/128 hasta la Task 3).

- [ ] **Step 1: Leer el molde y el temario**

Lee `app/server/seed-data/bd1.js` COMPLETO (es el molde: constantes K/S/N/C, estructura de units/lessons/content/quiz/extra, estilo de copy) y el spec `docs/superpowers/specs/2026-07-17-curso-requisitos-design.md` §2 (la tabla de beats por lección ES tu lista de requisitos: qué enseña cada lección, el foco del quiz con sus distractores, y el tipo + tema del extra).

- [ ] **Step 2: Crear `reqsw.js` con la identidad y la lección rq1 (patrón oro, verbatim)**

```js
const K = 'color: var(--accent-violet)';
const S = 'color: var(--accent-cyan)';
const N = 'color: var(--accent-amber)';
const C = 'color: var(--text-tertiary)';

export default {
  id: "reqsw",
  subject: "Ingeniería de software",
  tone: "violet",
  title: "Ingeniería de requisitos",
  description: "Aprende a descubrir, escribir y cuidar lo que el software debe hacer — antes de escribir una línea de código.",
  order: 7,
  prereq: null,
  units: [
    {
      id: "reqsw-u1",
      name: "Unidad 1 · Qué son los requisitos",
      lessons: [
        {
          id: "rq1",
          title: "La ingeniería de requisitos y por qué importa",
          mins: 14,
          content: [
            { type: "p", html: "Un <code>requisito</code> es una condición o capacidad que el sistema debe cumplir para resolver el problema de alguien. En una app de biblioteca: \"el sistema debe permitir renovar un préstamo solo si nadie más reservó el libro\". Fíjate: describe QUÉ debe pasar, no CÓMO programarlo." },
            { type: "p", html: "¿Por qué dedicarle una disciplina entera? Porque el error de requisitos es <code>el más caro del proyecto</code>: se descubre tarde (en pruebas, o peor, en producción) y todo lo construido encima lo hereda. Corregir un malentendido en esta fase cuesta una conversación; corregirlo en producción cuesta re-diseñar, re-programar y re-probar." },
            { type: "p", html: "La ingeniería de requisitos es un proceso con <code>cuatro actividades secuenciales</code> — elicitación (descubrirlos), análisis (entenderlos y negociarlos), especificación (escribirlos) y validación (confirmar que son los correctos) — más una transversal que las acompaña siempre: la <code>gestión</code> (cuidarlos cuando cambian)." },
            { type: "note", text: "Construir sin requisitos es como cocinar para un alérgico sin preguntarle a qué: el plato puede salir perfecto y aun así mandarlo al hospital." },
          ],
          quiz: {
            question: "¿Cuál de estas actividades pertenece a la ingeniería de requisitos?",
            options: [
              "Compilar el código fuente a binario",
              "Elicitar las necesidades de los stakeholders",
              "Desplegar la aplicación en producción",
              "Refactorizar los módulos duplicados",
            ],
            correct: 1,
            ok: "Elicitar — descubrir las necesidades hablando con los stakeholders — es la primera actividad del proceso de requisitos. Compilar, desplegar y refactorizar operan sobre código ya escrito.",
            bad: "Compilar, desplegar y refactorizar trabajan sobre código que ya existe; la ingeniería de requisitos trabaja ANTES: descubre y define qué debe hacer el sistema.",
          },
          extra: {
            type: "order",
            prompt: "Ordena las fases secuenciales del proceso de requisitos, de la primera a la última.",
            payload: {
              lines: [
                { id: "esp", html: "Especificación — escribir los requisitos" },
                { id: "eli", html: "Elicitación — descubrir las necesidades" },
                { id: "val", html: "Validación — confirmar que son los correctos" },
                { id: "ana", html: "Análisis y negociación — entenderlos y resolver conflictos" },
              ],
            },
            answer: { order: ["eli", "ana", "esp", "val"] },
            ok: "Primero descubres (elicitación), luego entiendes y negocias (análisis), después escribes (especificación) y al final confirmas que escribiste lo correcto (validación). La gestión acompaña todo el ciclo.",
            bad: "Piensa en el flujo natural: no puedes escribir lo que no entendiste, ni entender lo que no descubriste. Elicitar → analizar → especificar → validar.",
          },
        },
      ],
    },
  ],
};
```

Este rq1 es el **patrón oro**: su registro (tono cercano, ejemplos propios, explicaciones ok/bad que enseñan en ambas ramas) es la vara de las 6 lecciones restantes.

- [ ] **Step 3: Escribir rq2 (cierra la Unidad 1) y rq3-rq4 (abren `reqsw-u2`)**

Siguiendo los beats del spec §2 al pie de la letra:

- **rq2 · "Funcionales y no funcionales" · 15 min** — RF = qué hace el sistema (comportamiento observable); RNF = cómo de bien (rendimiento, seguridad, usabilidad, disponibilidad) + restricciones (tecnología impuesta, normativa). La trampa: "el sistema debe ser rápido" no es verificable — un RNF de verdad lleva métrica. Quiz: clasificar "El sistema debe responder las búsquedas en menos de 2 segundos" (RNF de rendimiento — medible; distractores: RF, restricción, "no es un requisito"). Extra `match`: 4 requisitos ↔ su tipo (RF, RNF de rendimiento, RNF de seguridad, restricción) — requisitos del dominio carrito/biblioteca, `right` mezclado.
- **rq3 · "Elicitación: sacarlos de las cabezas" · 16 min** — los requisitos no están escritos en ninguna parte; técnicas y cuándo brilla cada una: entrevista (profundidad con pocos), encuesta (amplitud con muchos), observación/etnografía (lo que la gente hace ≠ lo que dice), prototipo (el usuario no sabe lo que quiere hasta verlo), taller/JAD (stakeholders en conflicto en una sala). Quiz: escenario "tus usuarios describen un proceso distinto al que realmente ejecutan" → observación. Extra `match`: 4 situaciones ↔ la técnica adecuada.
- **rq4 · "Análisis y negociación" · 15 min** — los requisitos recién elicitados chocan (contradicciones), se solapan (duplicados), faltan (huecos) o son inviables; análisis = detectarlo, negociación = resolverlo con los stakeholders (nunca decidir en secreto); priorización MoSCoW (Must/Should/Could/Won't) con su significado real. Quiz: ante un conflicto entre dos stakeholders, qué corresponde (negociar con ambos; distractores: elegir en secreto al de más rango, implementar los dos, descartar ambos). Extra `match`: Must/Should/Could/Won't ↔ 4 requisitos de un carrito de compras.

Reglas duras al escribir (además de las Global Constraints): 2-3 bloques `p` + 1 `note` por lección; `<code>` inline para los términos técnicos; los `correct` de los quiz DEBEN variar de posición entre rq1-rq4 (rq1 ya usa el índice 1); explicaciones `ok`/`bad` que enseñan (la `bad` corrige el malentendido, no repite la `ok`).

- [ ] **Step 4: Verificar que la suite sigue intacta y el archivo parsea**

Run (desde `app/`): `node -e "import('./server/seed-data/reqsw.js').then(m => { const c = m.default; console.log(c.id, c.units.length, c.units.map(u => u.lessons.length)); })"`
Expected: `reqsw 2 [ 2, 2 ]`

Run: `npm test`
Expected: el MISMO resultado que dejó la Task 1 (el archivo no está registrado: nada cambia). `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add app/server/seed-data/reqsw.js
git commit -m "feat: Ingenieria de requisitos, unidad 1 y media (rq1-rq4, aun sin registrar)"
```

---

### Task 3: Contenido II — rq5-rq7, registro en el seed y tests

**Files:**
- Modify: `app/server/seed-data/reqsw.js` (añadir rq5, rq6, rq7 a `reqsw-u2`)
- Modify: `app/server/seed.js:1-10` (import + `COURSES`)
- Test: `app/test/seed.test.js:52-59,128-134` (totales), `app/test/courses.test.js:32` (catálogo de 7), + test nuevo de estructura de reqsw

**Interfaces:**
- Consumes: el `reqsw.js` de la Task 2 (con rq1-rq4) y su patrón oro.
- Produces: el curso completo (7 lecciones) registrado; totales nuevos en verde.

- [ ] **Step 1: Escribir rq5-rq7 (cierran la Unidad 2)**

Mismos moldes y reglas que la Task 2 (lee `reqsw.js` — rq1 es el patrón oro). Beats del spec §2:

- **rq5 · "Especificación: escribirlos bien" · 17 min** — el SRS como contrato del QUÉ (IEEE 29148, heredero del clásico 830); criterios de un buen requisito escrito: verificable, no ambiguo, atómico, con identificador; historias de usuario: "Como ⟨rol⟩, quiero ⟨meta⟩, para ⟨beneficio⟩" + criterios de aceptación. Incluye un bloque `code` con la plantilla y un ejemplo completo (biblioteca), usando spans: `N` para los placeholders ⟨rol⟩/⟨meta⟩/⟨beneficio⟩, `C` para comentarios. Quiz: identificar el requisito BIEN escrito entre 4 (los malos: ambiguo "amigable", compuesto "y además", sin métrica). Extra `blanks`: completar una historia de usuario con las piezas correctas — banco con las respuestas + ≥2 distractores.
- **rq6 · "Validación: ¿construimos lo correcto?" · 15 min** — validación (¿son los requisitos correctos?) vs verificación (¿construimos correcto lo especificado?) — la distinción canónica; técnicas: revisiones/inspecciones con checklist, prototipos ante el usuario, casos de prueba derivados de cada requisito (si no puedes escribir la prueba, el requisito está mal escrito). Quiz: la diferencia entre validar y verificar (opciones que las confunden a propósito). Extra `match`: 4 técnicas de validación ↔ qué defecto cazan (ambigüedad, omisión, requisito incorrecto, inviabilidad).
- **rq7 · "Gestión: los requisitos cambian" · 16 min** — el cambio no es el enemigo, el cambio sin control sí; línea base; control de cambios (solicitud → análisis de impacto → decisión → actualización); trazabilidad (de dónde viene y qué toca cada requisito); versionado. Quiz: qué es la línea base (el conjunto aprobado que sirve de referencia para el cambio controlado). Extra `order`: los 4 pasos del control de cambios, mezclados en el payload.

Vigila el reparto global de `correct` en los 7 quiz: que los índices 0-3 aparezcan repartidos (rq1 usa el 1; ninguno puede repetirse más de 2 veces en el curso).

- [ ] **Step 2: Registrar el curso en `seed.js`**

```js
import reqsw from "./seed-data/reqsw.js";
```

y `export const COURSES = [bd1, bd2, prog1, prog2, algo, web, reqsw];`

- [ ] **Step 3: Actualizar los tests de totales y catálogo**

1. `app/test/seed.test.js` ~52-59: título del test → `"seed completo: 7 cursos, 71 lecciones, 142 ejercicios"`; asserts → cursos 7, lecciones 71, ejercicios 142.
2. `app/test/seed.test.js` ~128-134: título → `"global: 142 ejercicios, 2 por lección, todos bien formados"`; asserts → 142 filas, 71 lecciones.
3. `app/test/courses.test.js` ~32: el catálogo del usuario nuevo pasa a **7 cursos** — ajusta el conteo y, si el test enumera cursos/estados, añade reqsw (NUEVO, al final, sin candado). Lee el test completo antes de tocar.

- [ ] **Step 4: Test de estructura de reqsw**

En `app/test/seed.test.js` hay tests de estructura por curso (busca los de bd1/bd2 y prog1/prog2 — p. ej. "bd1 y bd2: 2 ejercicios por lección, bien formados"). Añade uno equivalente para reqsw, calcado de su método (los tests existen en el repo: léelos y replica):

- 7 lecciones en 2 unidades (2 + 5), todas con `content` no vacío.
- 2 ejercicios por lección (`-ex1` choice con 4 opciones e índice válido; `-ex2` del tipo declarado).
- Los `match`: `left.length === right.length` y `answer.pairs` cubre todos los índices sin repetir.
- El `blanks` de rq5: cada respuesta de `answer.blanks` existe en `payload.bank`, y `bank.length >= answer.blanks.length + 2`.
- Los `order` (rq1, rq7): `answer.order` es una permutación de los ids de `payload.lines`, y el payload NO está en el orden de la respuesta (está mezclado).

- [ ] **Step 5: Suite entera en verde**

Run: `npm test`
Expected: `fail 0`, con el conteo = el de la Task 1 + tus tests nuevos (repórtalo exacto). Los totales 7/71/142 en verde.

- [ ] **Step 6: Commit**

```bash
git add app/server/seed-data/reqsw.js app/server/seed.js app/test/seed.test.js app/test/courses.test.js
git commit -m "feat: Ingenieria de requisitos completa (rq5-rq7) y registrada — 7 cursos, 71 lecciones"
```

---

### Task 4: Verificación final

**Files:** ninguno (salvo defecto real descubierto)

- [ ] **Step 1: Suite completa**

Run (desde `app/`): `npm test` → `fail 0` (pega el tail con el conteo final).

- [ ] **Step 2: Seed de la BD dev**

Run (desde `app/`): `npm run seed`
Expected: termina sin error. Es un upsert idempotente: añade reqsw sin tocar usuarios ni progreso.

- [ ] **Step 3: Barrido en el navegador (dev server :3000, cuenta `juan@test.dev` / `secreto1`, Ctrl+Shift+R)**

1. **Materias**: 7 tarjetas; reqsw al final, en violet, estado NUEVO, sin candado, "7 lecciones".
2. **El curso abre**: 2 unidades ("Unidad 1 · Qué son los requisitos", "Unidad 2 · El proceso de requisitos"), 7 lecciones con sus minutos.
3. **Cursar rq1 de punta a punta**: teoría (3 párrafos + nota) → quiz (responder BIEN la opción "Elicitar…") → extra order (ordenar elicitación → análisis → especificación → validación) → lección completada con +50 XP (y +10 si salió perfecta). Verifica las explicaciones ok en ambas.
4. **La vara nueva en vivo**: `/api/me` → `stats.level` consistente con la curva nueva para el XP de la cuenta (compara contra la tabla del spec §3).
5. **Logros**: en Progreso, "Sin dejar una" dice "las 71 lecciones" y "El plan completo" dice "las 7 materias".
6. Cero errores de consola (trap `window.onerror`) en el recorrido completo.

Gotchas del panel: rAF/transiciones congeladas (verifica contrato, no animaciones); screenshots suelen timeout (usa DOM/JS).

- [ ] **Step 4: Registrar el pendiente humano**

En el reporte: (a) el usuario debe LEER el contenido con ojos de estudiante de la materia (él es el experto en qué le evalúan) y pedir ajustes de énfasis/copy; (b) su cuenta personal bajará de título en pantalla con la vara nueva — esperado y aceptado, no es un bug.
