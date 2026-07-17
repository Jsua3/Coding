# Ingeniería de requisitos + niveles que se ganan — Diseño

> Primera materia nueva desde la iteración 2, nacida del material de la carrera del usuario (`docs/documentos-carrera/Material apoyo Ing. software I/Corte I Ingenieria de requisitos/`): un curso de **Ingeniería de requisitos**. Y como añadir contenido sube el techo del juego, la **curva de niveles se recalibra** — pedido explícito del usuario: "para subir de nivel tiene que haber ganado mucha más XP que ahora, que sea que en verdad está a ese nivel".

## 1. Decisiones tomadas con el usuario

1. **Materia**: Ingeniería de software, empezando por **requisitos** (el hueco más grande del catálogo y su material mejor organizado). **UML queda como segundo curso futuro**, con su propio ciclo.
2. **Fuente de la verdad**: contenido **100% original** escrito desde el canon de la disciplina (Pressman, SWEBOK v4, IEEE 29148); los PDF del curso solo aportan el **orden y el énfasis** del temario (ya capturados en este spec vía sus títulos — no hace falta procesarlos). **Prohibido reproducir texto de los PDFs**: tienen copyright.
3. **Alcance**: curso completo de 7 lecciones ahora; nada de UML en esta iteración.
4. **Niveles**: curva 2-2,7× más exigente, re-anclada al techo nuevo.

## 2. El curso

**Identidad** (campos del seed-data, patrón de `bd1.js`):

```js
id: "reqsw",
subject: "Ingeniería de software",
tone: "violet",
title: "Ingeniería de requisitos",
description: "Aprende a descubrir, escribir y cuidar lo que el software debe hacer — antes de escribir una línea de código.",
order: 7,
prereq: null,
```

El curso aparece al final del catálogo como NUEVO, sin tocar los 6 existentes. `violet` existe en el ENUM `subject_tone` y en los tints del DS (es el tono de Algoritmos; compartir tono es normal: Programación I/II comparten blue, BD I/II comparten cyan).

### Temario — 2 unidades, 7 lecciones, 14 ejercicios

**Unidad 1 · `reqsw-u1` · "Unidad 1 · Qué son los requisitos"**

| id | Título | mins | Qué enseña (beats del content) | quiz (choice) | extra |
|---|---|---|---|---|---|
| `rq1` | La ingeniería de requisitos y por qué importa | 14 | Qué es un requisito (condición/capacidad que el sistema debe cumplir); por qué el error de requisitos es el más caro (se descubre tarde y lo arrastra todo); las 5 actividades del proceso: elicitación → análisis → especificación → validación → gestión (transversal). | Identificar cuál ES una actividad de la ingeniería de requisitos (distractores: compilar, desplegar, refactorizar) | `order`: ordenar las 4 fases secuenciales del proceso (elicitación, análisis, especificación, validación) |
| `rq2` | Funcionales y no funcionales | 15 | RF = QUÉ hace el sistema (comportamiento observable); RNF = CÓMO de bien (calidad: rendimiento, seguridad, usabilidad, disponibilidad) + restricciones (tecnología impuesta, normativa). La trampa clásica: "el sistema debe ser rápido" no es verificable — un RNF de verdad lleva métrica. | Dado "El sistema debe responder las búsquedas en menos de 2 segundos", clasificarlo (es RNF de rendimiento — medible) | `match`: 4 requisitos ↔ su tipo (RF, RNF de rendimiento, RNF de seguridad, restricción) |

**Unidad 2 · `reqsw-u2` · "Unidad 2 · El proceso de requisitos"**

| id | Título | mins | Qué enseña | quiz (choice) | extra |
|---|---|---|---|---|---|
| `rq3` | Elicitación: sacarlos de las cabezas | 16 | Los requisitos no están escritos en ninguna parte: hay que descubrirlos. Técnicas y cuándo brilla cada una: entrevista (profundidad con pocos), encuesta (amplitud con muchos), observación/etnografía (lo que la gente hace ≠ lo que dice), prototipo (cuando el usuario no sabe lo que quiere hasta verlo), taller/JAD (stakeholders en conflicto en una sala). | Escenario: "tus usuarios describen un proceso distinto al que realmente ejecutan" → ¿qué técnica lo destapa? (observación) | `match`: 4 situaciones ↔ la técnica adecuada |
| `rq4` | Análisis y negociación | 15 | Los requisitos recién elicitados chocan (contradicciones), se solapan (duplicados), faltan (huecos) o son inviables. Análisis = detectarlo; negociación = resolverlo con los stakeholders. Priorización **MoSCoW** (Must/Should/Could/Won't). | Dado un conflicto entre dos stakeholders, ¿qué corresponde hacer? (negociar con ambos, no elegir en secreto ni implementar los dos) | `match`: Must/Should/Could/Won't ↔ 4 requisitos de un carrito de compras |
| `rq5` | Especificación: escribirlos bien | 17 | El SRS como contrato del QUÉ (mención IEEE 29148, heredero del clásico 830); criterios de un buen requisito escrito: verificable, no ambiguo, atómico, con identificador. Historias de usuario: "Como ⟨rol⟩, quiero ⟨meta⟩, para ⟨beneficio⟩" + criterios de aceptación. Bloque `code` con la plantilla y un ejemplo completo. | Identificar el requisito BIEN escrito entre 4 (los malos: ambiguo "amigable", compuesto "y además", sin métrica) | `blanks`: completar una historia de usuario con las piezas correctas (banco con distractores) |
| `rq6` | Validación: ¿construimos lo correcto? | 15 | Validación (¿los requisitos correctos?) vs verificación (¿lo construimos correcto?) — la distinción canónica. Técnicas: revisiones/inspecciones con checklist, prototipos ante el usuario, casos de prueba derivados de cada requisito (si no puedes escribir la prueba, el requisito está mal escrito). | ¿Cuál es la diferencia entre validar y verificar? (opciones que las confunden a propósito) | `match`: 4 técnicas de validación ↔ qué defecto cazan (ambigüedad, omisión, requisito incorrecto, inviabilidad) |
| `rq7` | Gestión: los requisitos cambian | 16 | El cambio no es el enemigo — el cambio sin control sí. Línea base; proceso de control de cambios (solicitud → análisis de impacto → decisión → actualización); trazabilidad (de dónde viene y qué toca cada requisito); versionado. | ¿Qué es la línea base de requisitos? (el conjunto aprobado que sirve de referencia para el cambio controlado) | `order`: los 4 pasos del control de cambios |

Reparto de tipos en `extra`: 4 match, 2 order, 1 blanks — más los 7 choice del quiz. Total 14 ejercicios, 2 por lección, patrón idéntico a las materias existentes.

### Reglas de redacción del contenido

- Cada lección: 2-3 bloques `p` + 1 `note` (la analogía memorable), y en `rq5` un bloque `code` con la plantilla de historia de usuario (spans con las constantes K/S/N/C del patrón seed-data; para texto no-código: N para los placeholders ⟨rol⟩/⟨meta⟩/⟨beneficio⟩, C para comentarios).
- Copy en español con tuteo, sentence case, sin emoji, metadatos con "·". Terminología en español con el término inglés entre paréntesis la primera vez cuando el canon lo usa (p. ej. "elicitación (elicitation)", "historia de usuario (user story)").
- **Correctitud de ejercicios**: una única respuesta defendible; distractores plausibles pero inequívocamente incorrectos; el índice `correct` de los choice VARÍA de lección a lección (lección del ledger: nada de patrones predecibles); en los `match`, `right` va mezclado (los pares se definen por índice, como en `bd1.js`); en `blanks`, el banco lleva ≥2 distractores.

## 3. La curva de niveles recalibrada

**Principio conservado**: el último nivel se alcanza exactamente al terminar el temario completo. **Techo nuevo**: 71 lecciones × 50 XP = **3.550 XP**. Los bonus de "Perfecto" solo te llevan allí antes (sin cambio).

**Principio nuevo** (pedido del usuario): cada título tiene un **ancla narrativa** — lo llevas cuando de verdad estás ahí. La curva completa (reemplaza el array `LEVELS` de `services/levels.js`):

```js
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

`levelFor` no cambia (la función es agnóstica a los umbrales; su `Math.floor` y su contrato quedan igual). El comentario de cabecera del archivo se actualiza (64→71, 3200→3550).

**Consecuencias aceptadas por el usuario:**
- Todos los títulos intermedios cuestan 2-2,7× más que hoy (Junior: 150→400; Senior: 750→1.800).
- Una cuenta existente puede **bajar de título en pantalla** (con ~815 XP: Senior → Desarrollador). No se pierde XP: se reinterpreta contra la vara nueva. Todo es derivado — cero migración.

## 4. Logros: los totales se actualizan

`ACHIEVEMENTS` es un módulo estático, puro y síncrono; derivar los targets del catálogo lo volvería async en cadena (metagame → unlockedFor). **Decisión: actualizar los valores estáticos**, que es el idioma del módulo:

- `todas-las-lecciones` ("Sin dejar una"): `target: 64 → 71`, descripción "Completa las 64 lecciones" → "Completa las 71 lecciones".
- `todos-los-cursos` ("El plan completo"): `target: 6 → 7`, descripción "Completa las 6 materias" → "Completa las 7 materias".

**Nota de diseño consciente**: los logros de "todo el catálogo" miden el catálogo *vigente*; al crecer el catálogo, la vara sube. En teoría eso podría re-bloquear el logro a quien ya lo tenía (el conjunto dejaría de ser monótono); en la práctica **nadie tiene hoy 64/64 ni 6/6**, así que no hay regresión real. Si algún día se añade contenido con usuarios al 100%, esa decisión se revisita (p. ej. congelar el logro obtenido). Los demás logros (hitos absolutos: 10, 25 lecciones…) no cambian.

## 5. Integración técnica

- **Create: `app/server/seed-data/reqsw.js`** — patrón exacto de `bd1.js` (constantes K/S/N/C arriba, default export con la identidad de §2 y `units` con el temario). ~450-550 líneas de contenido original.
- **Modify: `app/server/seed.js`** — `import reqsw from "./seed-data/reqsw.js";` y añadirlo al final de `COURSES`. Nada más: el seed es un upsert idempotente genérico (`npm run seed` añade el curso a la BD dev sin tocar usuarios ni progreso).
- **Modify: `app/server/services/levels.js`** — el array de §3 + comentario de cabecera.
- **Modify: `app/server/services/achievements.js`** — los 2 targets/descripciones de §4.
- **Cero frontend**: catálogo, detalle de curso, lecciones y los 4 tipos de ejercicio son data-driven. El curso aparece solo (violet, NUEVO, al final del catálogo, sin candado — `prereq: null`).
- **Cero esquema**: ninguna tabla ni columna nueva.

### Tests (TDD para lo lógico; actualización para los totales)

- **`levels.test.js`**: la curva nueva entra por RED→GREEN — los asserts de umbrales se reescriben a la tabla de §3 (incluidos los bordes: 399 es Practicante, 400 es Junior; 3549 es Arquitecto, 3550 es Maestro; el ancla "techo = temario completo" se afirma como `71 * 50`).
- **Tests de `/me` y `/progress`** que afirmen niveles para XP concretos: se ajustan a la vara nueva (revisar `me.test.js`, `progress.test.js`, `metagame-routes` si aplica).
- **Tests de totales del seed**: "seed completo: 6 cursos, 64 lecciones, 128 ejercicios" → **7 cursos, 71 lecciones, 142 ejercicios**; "global: 128 ejercicios, 2 por lección" → 142.
- **Test nuevo de estructura de `reqsw`**: como los de bd1/bd2/prog1/prog2 — 2 ejercicios por lección, bien formados (choice con 4 opciones e índice válido; match con left/right de igual longitud y pares completos; order con ids consistentes; blanks con banco ⊇ respuestas + ≥2 distractores).
- **Test de logros**: los asserts que mencionen `target` 64/6 se actualizan a 71/7.
- La suite crecerá desde 137; **el número final exacto lo fija el plan** — lo que es regla dura: **cero tests en rojo al cerrar cada tarea**.

## 6. Contrato de correctitud y copyright

- **Original siempre**: ni una frase copiada de los PDFs. El canon (Pressman, SWEBOK, IEEE 29148, MoSCoW, historias de usuario) es conocimiento estándar de la disciplina y se redacta con palabras propias y ejemplos propios (dominio de ejemplos: una app de biblioteca/carrito — NO los ejemplos de los PDFs).
- **El reviewer de cada tarea verifica la verdad técnica de cada ejercicio**: que la respuesta marcada sea la única defendible, que los distractores sean incorrectos sin ambigüedad, que las definiciones resistan el canon. Es la misma vara que ya se aplicó al SQL/Java/JS de las otras materias.
- Terminología estable en todo el curso (los mismos términos en lecciones y ejercicios — "elicitación" no muta a "captura" a mitad del curso).

## 7. Verificación

- **Backend**: suite completa en verde con los números nuevos (RED→GREEN en niveles; totales actualizados; test de estructura de reqsw).
- **Navegador, por contrato**: tras `npm run seed` en la BD dev — Materias muestra 7 tarjetas (reqsw en violet, NUEVO, al final); el curso abre con sus 2 unidades y 7 lecciones; una lección completa se puede cursar de punta a punta (teoría → quiz → extra) con sus explicaciones ok/bad; `/me` refleja el nivel con la vara nueva; los logros muestran "las 71 lecciones"/"las 7 materias". Cero errores de consola.
- **Pendiente humano**: leer el contenido con ojos de estudiante de la materia (el usuario ES el experto en qué le evalúan) y ajustar énfasis/copy donde chirríe.

## 8. Fuera de alcance decidido

- **UML** (segundo curso de la materia, con el reto de diagramas en ASCII/notación — su propio ciclo spec→plan).
- Derivar los targets de logros del catálogo (se revisita si vuelve a crecer el catálogo con usuarios al 100%).
- Imágenes/diagramas en el modelo de contenido (los bloques siguen siendo p/code/note).
- Tocar los otros 6 cursos, el frontend o el esquema.

## 9. Resumen en una frase

Una materia nueva escrita desde el canon con el temario del curso real del usuario — Ingeniería de requisitos: 7 lecciones y 14 ejercicios sobre elicitar, analizar, especificar, validar y gestionar — que sube el techo del juego a 3.550 XP y llega junto a una curva de niveles 2-2,7× más exigente donde cada título tiene ancla narrativa (Junior = tu primer curso; Maestro = el temario entero), con los logros de catálogo actualizados y cero cambios de frontend o esquema.
