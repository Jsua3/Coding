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
        {
          id: "rq2",
          title: "Funcionales y no funcionales",
          mins: 15,
          content: [
            { type: "p", html: "Un <code>requisito funcional</code> (<code>RF</code>) describe QUÉ debe hacer el sistema: un comportamiento observable que el usuario puede activar y verificar. En un carrito de compras: \"el sistema debe permitir aplicar un cupón de descuento al total de la compra\" es un RF — lo pruebas aplicando el cupón y viendo si el total baja." },
            { type: "p", html: "Un <code>requisito no funcional</code> (<code>RNF</code>) describe CÓMO de bien debe comportarse ese sistema: rendimiento (velocidad), seguridad (protección de datos), usabilidad (facilidad de uso) o disponibilidad (cuánto tiempo permanece operativo). Junto a los RNF conviven las <code>restricciones</code>: decisiones ya tomadas que el proyecto debe respetar sí o sí, como una tecnología impuesta por el cliente o una normativa que hay que cumplir." },
            { type: "p", html: "La trampa más común es escribir un RNF que suena bien pero no se puede verificar: <code>\"el sistema debe ser rápido\"</code> no dice cuánto es rápido, así que nadie puede comprobar si se cumplió. Un RNF de verdad lleva una métrica: <code>\"el sistema debe responder las búsquedas en menos de 2 segundos\"</code> sí se puede medir y aprobar o rechazar." },
            { type: "note", text: "Piensa en un restaurante: el RF es qué platos tiene el menú; el RNF es cuánto tardan en traerte el plato; la restricción es que la cocina debe cumplir las normas sanitarias, la pongas o no en el menú." },
          ],
          quiz: {
            question: "\"El sistema debe responder las búsquedas en menos de 2 segundos\". ¿Qué tipo de requisito es?",
            options: [
              "Un requisito funcional: describe una operación de búsqueda",
              "Una restricción: impone un límite de tiempo sobre el proveedor",
              "Un requisito no funcional de rendimiento: fija una métrica medible de tiempo de respuesta",
              "No es un requisito, es un detalle de implementación",
            ],
            correct: 2,
            ok: "Es un RNF de rendimiento: no dice qué busca el sistema (eso ya lo define un RF aparte), dice qué tan rápido debe responder, y lo hace con una métrica verificable: 2 segundos.",
            bad: "No es un RF (no describe una acción nueva del sistema) ni una restricción (no impone una tecnología o norma externa); sí es un requisito, solo que en vez de decir qué hacer, dice qué tan bien hacerlo — con una métrica medible.",
          },
          extra: {
            type: "match",
            prompt: "Empareja cada tipo de requisito con un ejemplo real.",
            payload: {
              left: ["RF", "RNF de rendimiento", "RNF de seguridad", "Restricción"],
              right: [
                "Las contraseñas de los usuarios deben almacenarse cifradas, nunca en texto plano",
                "El sistema debe permitir añadir un libro a la lista de préstamos pendientes",
                "El sistema debe integrarse con el lector de código de barras ya instalado en la biblioteca",
                "El catálogo debe mostrar los resultados de una búsqueda en menos de 1.5 segundos",
              ],
            },
            answer: { pairs: [[0, 1], [1, 3], [2, 0], [3, 2]] },
            ok: "Un RF dice qué hace el sistema (añadir un préstamo); un RNF de rendimiento fija una métrica de velocidad; un RNF de seguridad protege los datos; una restricción es una decisión externa ya tomada, como integrarse con un hardware que ya existe.",
            bad: "No confundas calidad con restricción: un RNF nace de una necesidad de calidad del propio sistema (rapidez, protección de datos); una restricción viene de afuera — una tecnología o norma que el proyecto no puede cambiar.",
          },
        },
      ],
    },
    {
      id: "reqsw-u2",
      name: "Unidad 2 · El proceso de requisitos",
      lessons: [
        {
          id: "rq3",
          title: "Elicitación: sacarlos de las cabezas",
          mins: 16,
          content: [
            { type: "p", html: "Los requisitos no viven escritos en ningún documento esperando a que los copies: viven repartidos en la cabeza de cada stakeholder, en cómo trabaja hoy el negocio y en los sistemas que ya existen. <code>Elicitar</code> (elicitation) es el trabajo activo de sacarlos a la luz — no es una entrevista pasiva, es una investigación." },
            { type: "p", html: "La <code>entrevista</code> conversa en profundidad con pocas personas — perfecta cuando necesitas entender el porqué detrás de una necesidad compleja. La <code>encuesta</code> hace la pregunta contraria: menos profundidad, pero a muchas personas a la vez — útil para confirmar una hipótesis en una población grande de usuarios." },
            { type: "p", html: "La <code>observación</code> (u observación etnográfica) consiste en mirar a la gente trabajar en vez de preguntarle: revela la brecha entre lo que alguien dice que hace y lo que en verdad hace. El <code>prototipo</code> sirve cuando el propio usuario no sabe describir lo que quiere hasta que lo ve y lo toca. Y el <code>taller</code> (o <code>JAD</code>, Joint Application Design) sienta a stakeholders en conflicto en la misma sala para que negocien en tiempo real, en vez de heredar visiones contradictorias por separado." },
            { type: "note", text: "Elicitar es más arqueología que transcripción: nadie te entrega los requisitos completos y ordenados, tienes que desenterrarlos con la herramienta correcta para cada terreno." },
          ],
          quiz: {
            question: "Tus usuarios describen un proceso de trabajo distinto al que realmente ejecutan. ¿Qué técnica de elicitación destapa esa diferencia?",
            options: [
              "Observación, para ver el proceso real en vez de la versión que cuentan",
              "Encuesta, para confirmar esa misma descripción con más usuarios",
              "Prototipo, para que evalúen una versión temprana del sistema",
              "Taller (JAD), para sentar a todos los stakeholders en una sala",
            ],
            correct: 0,
            ok: "Cuando lo que la gente dice y lo que la gente hace no coinciden, preguntar más no ayuda — necesitas ver el proceso real. La observación (o etnografía) capta el comportamiento tal como ocurre, no como se recuerda o se cuenta.",
            bad: "Una encuesta solo multiplicaría la misma versión contada, un prototipo evalúa una propuesta futura y un taller resuelve conflictos entre personas — ninguno revela qué hace la gente hoy; solo la observación directa lo hace.",
          },
          extra: {
            type: "match",
            prompt: "Empareja cada situación con la técnica de elicitación más adecuada.",
            payload: {
              left: ["Entrevista", "Encuesta", "Prototipo", "Taller (JAD)"],
              right: [
                "El cliente no logra describir cómo quiere el formulario hasta que lo prueba",
                "Dos áreas del negocio piden funciones que se contradicen entre sí",
                "Necesitas entender a fondo un proceso complejo que solo maneja el jefe de operaciones",
                "Quieres confirmar qué tan seguido usan una función 500 usuarios registrados",
              ],
            },
            answer: { pairs: [[0, 2], [1, 3], [2, 0], [3, 1]] },
            ok: "Entrevista para profundidad con una sola persona clave, encuesta para amplitud con muchos, prototipo cuando el usuario necesita ver algo para poder opinar, y taller para negociar en vivo entre partes en conflicto.",
            bad: "No elijas la técnica por comodidad: si el problema es profundidad con pocos usa entrevista, si es amplitud con muchos usa encuesta, si el usuario no sabe describir lo que quiere usa un prototipo, y si hay conflicto entre áreas usa un taller conjunto.",
          },
        },
        {
          id: "rq4",
          title: "Análisis y negociación",
          mins: 15,
          content: [
            { type: "p", html: "Elicitar deja una lista cruda de requisitos, y esa lista casi nunca es coherente: puede tener <code>contradicciones</code> (dos stakeholders piden cosas incompatibles), <code>solapamientos</code> (el mismo requisito escrito dos veces con otras palabras), <code>huecos</code> (algo que todos daban por sentado y nadie mencionó) o requisitos <code>inviables</code> (piden algo que el presupuesto o la tecnología no permiten). <code>Analizar</code> es el trabajo de encontrar estos defectos antes de que lleguen al diseño." },
            { type: "p", html: "Encontrar un conflicto no lo resuelve: hace falta <code>negociar</code> — sentar a los stakeholders involucrados y llegar a un acuerdo que todos puedan aceptar. Lo que nunca corresponde es que el analista decida en secreto a espaldas de alguna de las partes: eso solo pospone el conflicto hasta que el stakeholder ignorado descubra el resultado." },
            { type: "p", html: "Como no hay tiempo ni presupuesto para todo, hay que priorizar. <code>MoSCoW</code> clasifica cada requisito en <code>Must</code> (imprescindible: sin esto el sistema no sirve), <code>Should</code> (importante, pero el sistema sobrevive sin él en la primera versión), <code>Could</code> (deseable si sobra tiempo) o <code>Won't</code> (fuera de esta versión, aunque quede documentado para el futuro)." },
            { type: "note", text: "Negociar requisitos se parece a repartir un presupuesto familiar limitado: todos tienen deseos legítimos, pero alguien tiene que sentarlos a decidir juntos qué entra primero — nunca decidirlo a espaldas de uno de ellos." },
          ],
          quiz: {
            question: "Dos stakeholders piden versiones incompatibles del mismo requisito. ¿Qué corresponde hacer?",
            options: [
              "Elegir la versión del stakeholder con más rango, sin avisar al otro",
              "Implementar las dos versiones y que el sistema decida en tiempo de ejecución",
              "Descartar el requisito por completo para evitar el conflicto",
              "Sentar a ambos stakeholders y negociar una versión que los dos puedan aceptar",
            ],
            correct: 3,
            ok: "El conflicto es información valiosa, no un problema a esconder: negociar con ambas partes visibiliza el trade-off y produce una decisión que se sostiene después, cuando el sistema ya esté en producción.",
            bad: "Decidir en secreto solo pospone el conflicto hasta que el stakeholder ignorado lo note; implementar ambas versiones duplica trabajo y ambigüedad; descartar el requisito ignora una necesidad real que alguien sí tiene.",
          },
          extra: {
            type: "match",
            prompt: "Empareja cada categoría de MoSCoW con un requisito de un carrito de compras.",
            payload: {
              left: ["Must", "Should", "Could", "Won't"],
              right: [
                "El sistema debería guardar las direcciones de envío favoritas para no volver a escribirlas",
                "El sistema debe permitir pagar la compra con tarjeta",
                "El sistema no incluirá pago con criptomonedas en esta versión",
                "El sistema podría sugerir productos relacionados al finalizar la compra",
              ],
            },
            answer: { pairs: [[0, 1], [1, 0], [2, 3], [3, 2]] },
            ok: "Must es lo mínimo sin lo cual el carrito no cumple su propósito (pagar); should mejora la experiencia pero no bloquea el lanzamiento; could es un extra si sobra tiempo; won't queda fuera de esta versión, documentado para revisarlo después.",
            bad: "No leas MoSCoW como una escala de \"me gustaría\": must es lo que hace que el sistema sirva para su propósito central, y won't no significa \"nunca\" — significa \"no en esta versión\".",
          },
        },
      ],
    },
  ],
};
