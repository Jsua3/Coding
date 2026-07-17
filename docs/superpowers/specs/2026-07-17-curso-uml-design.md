# Modelado con UML — Diseño

> Segundo curso de la materia "Ingeniería de software" (acordado al cerrar la 10ª iteración): los diagramas del corte 2 del curso real del usuario. Mismo contrato que `reqsw`: contenido **100% original desde el canon** (UML 2.x — OMG, Fowler "UML Distilled", Sommerville/Pressman), con el temario del usuario marcando **orden y énfasis** (sus PDFs no se abren ni se citan: el orden ya está capturado aquí). El reto propio del curso: **enseñar notación sin imágenes** — diagramas reales dibujados con caracteres de caja en bloques `code`.

## 1. Decisiones tomadas con el usuario

1. **Prereq**: `uml` exige `reqsw` completado (candado en servidor, mecánica ya existente y testeada con bd1→bd2). Calca la secuencia del curso real: corte 1 (requisitos) → corte 2 (modelado).
2. **Temario**: 9 lecciones = intro + 8 diagramas, con el **diagrama de objetos fusionado en la lección de clases** (es su instantánea; en el canon son inseparables). Orden del corte del usuario: intro → casos de uso → actividades → estados → clases → secuencia → contexto → tiempo → componentes.
3. **Curva**: **solo se mueve el techo** — Maestro 3.550 → **4.000** (= 80 lecciones × 50). El resto de umbrales NO se toca (el título actual del usuario no vuelve a moverse). **Deuda consciente que queda escrita**: Arquitecto (3.500) pierde su ancla de "todo menos una lección"; el tramo final pasa a ser "el último curso entero te corona", hasta una futura recalibración.
4. **Dibujo**: enfoque de caracteres de caja Unicode en `CodeBlock` (aprobado sobre prosa-sin-dibujo y sobre SVG/assets, descartados).

## 2. El curso

**Identidad** (patrón seed-data):

```js
id: "uml",
subject: "Ingeniería de software",
tone: "violet",
title: "Modelado con UML",
description: "Dibuja lo que el software es y lo que hace: los nueve diagramas que convierten requisitos en diseño.",
order: 8,
prereq: "reqsw",
```

### Temario — 2 unidades, 9 lecciones, 18 ejercicios

**Unidad 1 · `uml-u1` · "Unidad 1 · El lenguaje y el comportamiento"**

| id | Título | mins | Qué enseña (beats) | quiz (choice) | extra |
|---|---|---|---|---|---|
| `um1` | UML: un lenguaje, no un método | 14 | Qué es UML: lenguaje VISUAL estándar de modelado (OMG) — no una metodología, no un proceso, no un lenguaje de programación. Para qué modelar: comunicar, razonar antes de construir, documentar. Las dos familias: **estructura** (clases, objetos, componentes) vs **comportamiento** (casos de uso, actividades, estados, secuencia, tiempo). | ¿Qué es UML? (correcta: lenguaje estándar de modelado; distractores: metodología de desarrollo, lenguaje de programación, herramienta concreta) | `match`: 4 diagramas ↔ su propósito específico (clases→estructura estática y relaciones; secuencia→mensajes en el tiempo; casos de uso→qué hace el sistema para cada actor; componentes→piezas y sus interfaces) |
| `um2` | Casos de uso | 16 | Actor = ROL externo (humano u otro sistema), caso de uso = objetivo con valor observable, la elipse y la caja del sistema. La confusión clásica: **«include»** (paso común factorizado, ocurre SIEMPRE) vs **«extend»** (comportamiento opcional/condicional). Diagrama dibujado: biblioteca con `«actor» Socio`, `( Prestar libro )` ─«include»→ `( Validar socio )`, `( Pagar multa )` como extend. | Escenario "Pagar multa ocurre solo si hay retraso al devolver" → ¿include o extend? (extend; distractores: include, generalización, asociación simple) | `match`: 4 elementos de notación ↔ significado (elipse, «actor», «include», «extend») |
| `um3` | Diagrama de actividades | 15 | El flujo de un proceso: nodo inicial `●`, actividades, decisión `◇` con guardas `[condición]`, fusión, **bifurcación/sincronización** (barras: ramas en paralelo), calles/swimlanes (quién hace qué), nodo final. Diagrama dibujado: checkout del carrito con una decisión. | En una decisión `◇`, ¿qué son las etiquetas `[hay stock]` / `[sin stock]`? (guardas: condiciones excluyentes que eligen la rama; distractores: eventos, acciones, estados) | `order`: ordenar el flujo del checkout (agregar al carrito → confirmar dirección → pagar → recibir confirmación), payload mezclado |
| `um4` | Diagrama de estados | 16 | La vida de UN objeto: estados (rectángulo redondeado), transiciones con `evento [guarda] / acción`, estado inicial y final. Diagrama dibujado: un Préstamo (Activo → Vencido → Devuelto) con `devolver [con retraso] / calcular multa`. | Leer la transición `devolver [con retraso] / calcular multa`: ¿qué significa? (al ocurrir el evento devolver, SI hay retraso, se transita ejecutando calcular multa; distractores que confunden evento/guarda/acción) | `match`: 4 piezas ↔ rol (estado, evento, guarda, acción) |

**Unidad 2 · `uml-u2` · "Unidad 2 · Estructura, interacción y arquitectura"**

| id | Título | mins | Qué enseña | quiz (choice) | extra |
|---|---|---|---|---|---|
| `um5` | Clases y objetos | 18 | La caja de 3 compartimentos (nombre / atributos / operaciones), visibilidad `+` pública, `-` privada, `#` protegida. Relaciones: asociación (línea), **agregación** (`◇` hueco: todo-parte débil, vidas independientes) vs **composición** (`◆` relleno: la parte muere con el todo), herencia (`△` apuntando al padre), multiplicidades (`1`, `*`, `0..1`, `1..*`). El **diagrama de objetos** como instantánea: instancias con valores (`ana: Socio`). Diagrama dibujado: Pedido ◆─ LíneaDePedido, Socio ─ Préstamo con multiplicidades. | "Si se elimina el pedido, sus líneas de pedido desaparecen con él" → ¿qué relación es? (composición; distractores: agregación, asociación simple, herencia) | `match`: 4 símbolos ↔ relación (`◇` agregación, `◆` composición, `△` herencia, `1..*` multiplicidad) |
| `um6` | Diagrama de secuencia | 17 | La interacción en el TIEMPO: líneas de vida (`obj: Clase` + línea discontinua vertical), mensaje síncrono (flecha llena — el emisor espera), respuesta (flecha discontinua), mensaje asíncrono (flecha abierta — no espera), activaciones (barras). Diagrama dibujado: Socio → :SistemaPréstamos → :Catálogo para prestar un libro, con respuesta. | En un mensaje SÍNCRONO, ¿qué hace el emisor? (espera la respuesta antes de seguir; distractores: sigue sin esperar, el receptor decide, se cancela la llamada) | `order`: ordenar los mensajes del préstamo (solicitar préstamo → verificar disponibilidad → registrar préstamo → confirmar al socio), payload mezclado |
| `um7` | El diagrama de contexto | 14 | La FRONTERA del sistema: el sistema como caja única, actores y sistemas externos alrededor, flujos etiquetados. Herencia honesta: nace del análisis estructurado y convive con UML (a menudo se dibuja como diagrama de casos de uso a nivel de sistema). Su pregunta: ¿qué es responsabilidad del sistema y qué del mundo exterior? Diagrama dibujado: SistemaBiblioteca en el centro; Socio, Bibliotecario y PasarelaDePagos afuera. | ¿Qué NO muestra un diagrama de contexto? (la estructura interna del sistema; distractores que sí muestra: actores externos, la frontera, los flujos con el exterior) | `match`: 4 elementos ↔ su rol respecto a la frontera, con 4 descripciones ÚNICAS (socio→"persona externa que solicita préstamos"; pasarela de pagos→"sistema externo que procesa los cobros"; módulo de reservas→"responsabilidad interna: gestiona los apartados"; catálogo→"almacén interno de los títulos y ejemplares") — enseña dentro/fuera sin repetir respuestas (un match exige emparejamiento único) |
| `um8` | Diagramas de tiempo | 15 | El diagrama de tiempos (timing, familia de interacción): el TIEMPO en horizontal, los ESTADOS de una línea de vida en vertical; los cambios de estado son escalones; restricciones de duración `{< 2 s}`. Cuándo brilla: sistemas con plazos reales (sensores, semáforos, timeouts). Diagrama dibujado: un Préstamo pasando Activo→Vencido→Devuelto sobre un eje de días con una restricción. | En un diagrama de tiempos, ¿qué representa el eje horizontal? (el tiempo; distractores: los estados, los actores, la prioridad) | `choice` de lectura: dado el timing dibujado en la lección, ¿cuándo pasó el préstamo a Vencido? (leer el escalón contra el eje; distractores con lecturas erróneas del eje) |
| `um9` | Diagramas de componentes | 15 | Piezas reemplazables: el componente (caja con `«component»`), **interfaz provista** (lollipop `─○`: "yo ofrezco esto") vs **requerida** (socket `─(`: "yo necesito esto"), dependencias (flecha discontinua). Encajar lollipop en socket = acoplar por contrato, no por implementación. Diagrama dibujado: TiendaWeb requiere IPagos; PasarelaPagos la provee. | Si un componente dibuja un lollipop `─○` con la interfaz IPagos, ¿qué declara? (que PROVEE/implementa IPagos; distractores: que la requiere, que hereda de ella, que la prohíbe) | `match`: 4 notaciones ↔ significado (lollipop provista, socket requerida, `«component»`, dependencia discontinua) |

Reparto: 9 quiz choice + 6 match + 2 order + 1 choice de lectura = **18 ejercicios**. Índices `correct` de los 9 quiz: `1, 3, 0, 2, 1, 2, 0, 3, 0` — ningún índice más de 3 veces y ninguno ausente (con 9 quiz sobre 4 posiciones, el tope parejo es 3).

## 3. El contrato del dibujo (la apuesta del curso)

**El único toque de frontend, declarado:** `CodeBlock` (`app/web/screens/LessonScreen.jsx:3-9`) gana dos propiedades en su style: `whiteSpace: "pre"` y `overflowX: "auto"`. Sin la primera, el HTML colapsa espacios y cualquier diagrama se desalinea (hoy ya se pierde la indentación del SQL de las materias viejas — esto la restaura); con la segunda, un diagrama ancho scrollea dentro del bloque y la página jamás scrollea horizontal.

**Reglas de dibujo** (obligatorias para las 8 lecciones de diagramas):

- Caracteres de caja Unicode: `┌ ─ ┬ ┐ │ ├ ┼ ┤ └ ┴ ┘` para cajas, `▶ ◀ ▲ ▼` para puntas de flecha, `●` inicial, `◉` final, `◇ ◆ △` para rombos/herencia, `○` lollipop. Óvalos de caso de uso como `( Nombre del caso )`. Actores con el estereotipo canónico `«actor»` en caja (notación UML 2.x válida — la figura de palo no sobrevive al texto).
- **≤ 60 columnas** de ancho y **≤ 12 líneas** por diagrama; **un concepto por diagrama** (si la lección enseña dos cosas, dos diagramas pequeños mejor que uno enciclopédico).
- Color **selectivo** con las constantes K/S/N/C: se resalta EL elemento que la lección está enseñando (p. ej. la flecha `«include»` en ámbar `N`), no se decora todo. Los spans van SOLO en template literals.
- Cada diagrama puede llevar debajo su leyenda en un bloque `note` si algún símbolo lo pide.

**Ejemplo normativo** (um2; el estilo exacto que el resto debe seguir):

```js
{ type: "code", lines: [
  `<span style="${C}">── Casos de uso · biblioteca ──────────────────</span>`,
  `┌─────────┐      ( Prestar libro )`,
  `│ «actor» │────▶(                 )`,
  `│  Socio  │      (_______________)`,
  `└─────────┘             │`,
  `                  <span style="${N}">«include»</span>`,
  `                         ▼`,
  `                 ( Validar socio )`,
]},
```

**Regla verificable por test:** toda lección de diagrama (`um2`…`um9`) contiene **≥ 1 bloque `code`** en su content — el estudiante siempre VE el diagrama.

## 4. Curva y logros

- **`services/levels.js`**: cambia SOLO `{ n: 12, name: "Maestro", xp: 3550 }` → `xp: 4000`, su comentario de línea (`// el temario entero: la última lección te corona` → `// el temario entero (80 lecciones): el último curso entero te corona`) y el comentario de cabecera (71→80, 3550→4000, + una línea sobre la deuda del ancla de Arquitecto). `levelFor` y los otros 11 umbrales, intactos.
- **`test/levels.test.js`** (cambios mínimos): `LEVELS[11].xp === 80 * 50`; la tabla de umbrales exactos termina en `4000`; los bordes del último tramo pasan a `3999 → n11` / `4000 → n12`; el último valor del loop de "nunca llega a 100" pasa de `3549` a `3999`.
- **`services/achievements.js`**: `todas-las-lecciones` target `71 → 80` ("Completa las 80 lecciones"); `todos-los-cursos` target `7 → 8` ("Completa las 8 materias"). Misma decisión estática de siempre, misma nota: nadie está al 100%, no hay re-bloqueo real.

## 5. Integración técnica

- **Create: `app/server/seed-data/uml.js`** — patrón exacto de `reqsw.js` (constantes K/S/N/C, default export, units). ~550-650 líneas (los diagramas ocupan).
- **Modify: `app/server/seed.js`** — `import uml from "./seed-data/uml.js";` + `uml` al final de `COURSES`.
- **El candado es puro dato**: `prereq: "reqsw"` viaja por `prereq_course_id`; la lógica de servidor (status BLOQUEADO + 403) es genérica y ya está testeada con bd1→bd2.
- **Modify: `app/web/screens/LessonScreen.jsx:5`** — las dos propiedades del CodeBlock (§3). Único frontend.
- **Cero esquema.**

### Tests

- **Totales**: "7 cursos, 71 lecciones, 142 ejercicios" → **8 cursos, 80 lecciones, 160 ejercicios** (los dos sitios de `seed.test.js`, más el `deepEqual` por curso que gana `uml: 9`).
- **Catálogo** (`courses.test.js`): usuario nuevo ve 8 cursos; `uml` al final, **BLOQUEADO** (como bd2); + un test barato de candado: `GET /courses/uml` → **403** para usuario nuevo.
- **Estructura de `uml`** (calcado del test de estructura de reqsw): 9 lecciones en 2 unidades (4+5); 2 ejercicios por lección bien formados (match biyectivos, orders con payload mezclado y answer permutación); **y la regla nueva: um2…um9 tienen ≥ 1 bloque `code` en su content**.
- Suite: la vigente al arrancar es **139**; crecerá ~2-3 (estructura de uml, candado 403). El número exacto lo fija el plan; `fail 0` innegociable al cierre de cada tarea. Nota para el test de estructura: el extra de `um8` es `choice` (no match/order) — el test debe validar cada extra según su tipo declarado, no asumir match/order para todos.

## 6. Contrato de correctitud y copyright

- **Original siempre**: cero frases de los PDFs (no se abren). Canon: UML 2.x del OMG, Fowler, Sommerville/Pressman. Ejemplos propios: biblioteca y carrito, coherentes con reqsw (el mismo mundo — las historias de usuario de rq5 pueden reaparecer como casos de uso en um2: continuidad didáctica deliberada).
- **Honestidad de canon**: el diagrama de contexto se presenta con su herencia real (análisis estructurado, convive con UML) — no se enseña como tipo oficial UML. Los timing y componentes sí son UML 2.x oficiales.
- **El reviewer de cada tarea verifica como profesor**: resuelve cada quiz, recorre cada match par por par, y además **lee cada diagrama dibujado** verificando que la notación sea canónicamente correcta (flechas de include/extend con dirección correcta, rombos en el lado del "todo", triángulo apuntando al padre, lollipop en el proveedor).
- Terminología estable con reqsw donde se tocan (stakeholder, requisito, historia de usuario).

## 7. Verificación

- **Backend**: suite en verde con los totales nuevos; TDD en la curva (bordes 3999/4000 primero en RED).
- **Navegador** (dev server :3000, `juan@test.dev`): 8 tarjetas — `uml` al final **con candado** (BLOQUEADO). Para cursar: **se fuerzan por SQL las 7 completions de `reqsw` en la cuenta de pruebas** (INSERT en `lesson_completions`), se verifica que uml se desbloquea, se cursa `um1` de punta a punta y se comprueba que **un diagrama renderiza alineado** (`white-space: pre` computado en el CodeBlock + lectura del bloque); al terminar **se restauran los datos** (DELETE de esas completions) — precedente exacto: así se probó el protector de racha. La indentación del SQL de una lección vieja (bd1) también se verifica de pasada (regalo del fix).
- **Pendiente humano**: leer el contenido como estudiante del corte 2 **y juzgar la legibilidad de los diagramas dibujados** — es la apuesta estética del curso y solo ojos humanos la validan. Si algún diagrama no se entiende, se redibuja (los beats no cambian).

## 8. Fuera de alcance decidido

- Diagramas como imágenes/SVG o un tipo de bloque nuevo (el modelo p/code/note no se toca).
- Los diagramas de despliegue, paquetes y comunicación (no están en el corte del usuario).
- Ejercicios de DIBUJAR diagramas (los 4 tipos de ejercicio existentes no lo permiten; leer e interpretar sí).
- Recalibración completa de la curva (decisión explícita: solo el techo; la deuda del ancla de Arquitecto queda anotada).

## 9. Resumen en una frase

El segundo curso de Ingeniería de software: 9 lecciones y 18 ejercicios donde los diagramas UML se DIBUJAN de verdad — cajas, flechas y rombos en caracteres de caja dentro del CodeBlock (que gana `white-space: pre`, el único toque de frontend) — con candado tras el curso de requisitos, el techo del juego en 4.000 XP (solo Maestro se mueve, por decisión del usuario) y el mismo contrato de las materias: original desde el canon, verificado como profesor, con el temario del corte real marcando el orden.
