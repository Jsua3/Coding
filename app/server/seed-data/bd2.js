const K = 'color: var(--accent-violet)';
const S = 'color: var(--accent-cyan)';
const N = 'color: var(--accent-amber)';
const C = 'color: var(--text-tertiary)';

export default {
  id: "bd2",
  subject: "Bases de datos II",
  tone: "cyan",
  title: "Transacciones y triggers",
  description: "Transacciones seguras, triggers, procedimientos y rendimiento — bases de datos en producción.",
  order: 4,
  prereq: "bd1",
  units: [
    {
      id: "bd2-u1",
      name: "Unidad 1 · Transacciones",
      lessons: [
        {
          id: "bd2-l1",
          title: "Qué es una transacción",
          mins: 16,
          content: [
            { type: "p", html: "Una <code>transacción</code> es un conjunto de una o más operaciones SQL que se ejecutan como una sola unidad indivisible: o se aplican todas, o no se aplica ninguna. Empieza con <code>START TRANSACTION</code> y termina con <code>COMMIT</code> o <code>ROLLBACK</code>." },
            { type: "code", lines: [
              `<span style="${C}">-- Transferir saldo entre dos cuentas como una sola unidad</span>`,
              `<span style="${K}">START TRANSACTION</span>;`,
              `<span style="${K}">UPDATE</span> cuentas <span style="${K}">SET</span> saldo = saldo - <span style="${N}">500</span> <span style="${K}">WHERE</span> id = <span style="${N}">1</span>;`,
              `<span style="${K}">UPDATE</span> cuentas <span style="${K}">SET</span> saldo = saldo + <span style="${N}">500</span> <span style="${K}">WHERE</span> id = <span style="${N}">2</span>;`,
              `<span style="${K}">COMMIT</span>;`,
            ]},
            { type: "note", text: "Si el sistema falla justo después del primer UPDATE, la transacción queda sin confirmar y el SGBD la revierte por completo: nunca verás una cuenta debitada sin que la otra reciba el monto." },
          ],
          quiz: {
            question: "¿Por qué agrupas dos UPDATE consecutivos dentro de START TRANSACTION … COMMIT en una transferencia de saldo?",
            options: [
              "Para que la consulta se ejecute más rápido",
              "Porque MySQL exige una transacción para usar UPDATE",
              "Para que ambos UPDATE se apliquen juntos o ninguno se aplique",
              "Para evitar escribir dos sentencias SQL distintas",
            ],
            correct: 2,
            ok: "La transacción agrupa ambas operaciones en una unidad atómica: si algo falla a mitad de camino, el SGBD revierte todo y ninguna cuenta queda a medias.",
            bad: "Una transacción no acelera la ejecución ni es obligatoria para usar UPDATE; su propósito es garantizar que el conjunto de operaciones sea todo-o-nada.",
          },
        },
        {
          id: "bd2-l2",
          title: "COMMIT y ROLLBACK",
          mins: 18,
          content: [
            { type: "p", html: "<code>COMMIT</code> confirma de forma permanente todos los cambios hechos durante la transacción actual; a partir de ahí son visibles para el resto de conexiones. <code>ROLLBACK</code> deshace todos los cambios de la transacción y la deja como si nunca hubiera empezado." },
            { type: "code", lines: [
              `<span style="${C}">-- Si algo sale mal, deshacemos toda la transacción</span>`,
              `<span style="${K}">START TRANSACTION</span>;`,
              `<span style="${K}">UPDATE</span> inventario <span style="${K}">SET</span> stock = stock - <span style="${N}">1</span> <span style="${K}">WHERE</span> producto_id = <span style="${N}">42</span>;`,
              `<span style="${K}">INSERT INTO</span> pedidos (producto_id, cantidad) <span style="${K}">VALUES</span> (<span style="${N}">42</span>, <span style="${N}">1</span>);`,
              `<span style="${C}">-- si detectamos un error de validación:</span>`,
              `<span style="${K}">ROLLBACK</span>;`,
            ]},
            { type: "note", text: "Después de un ROLLBACK, el UPDATE y el INSERT de esa transacción desaparecen: es como si nunca se hubieran ejecutado." },
          ],
          quiz: {
            question: "Dentro de una transacción ejecutas un UPDATE y luego un INSERT, pero detectas un error antes de confirmar. ¿Qué instrucción deja la base de datos como si esa transacción nunca hubiera ocurrido?",
            options: [
              "ROLLBACK",
              "COMMIT",
              "SELECT",
              "DELETE",
            ],
            correct: 0,
            ok: "ROLLBACK deshace todos los cambios de la transacción activa, incluidos el UPDATE y el INSERT.",
            bad: "COMMIT haría permanentes los cambios (justo lo contrario de lo que quieres); SELECT y DELETE no revierten una transacción.",
          },
        },
        {
          id: "bd2-l3",
          title: "Propiedades ACID",
          mins: 20,
          content: [
            { type: "p", html: "<code>ACID</code> es el acrónimo de las cuatro propiedades que garantiza una transacción: Atomicidad, Consistencia, Aislamiento y Durabilidad. La <code>Atomicidad</code> asegura que la transacción se aplica completa o no se aplica; la <code>Consistencia</code> asegura que la base de datos pasa de un estado válido a otro estado válido, respetando las reglas definidas (claves, restricciones)." },
            { type: "p", html: "El <code>Aislamiento</code> garantiza que transacciones concurrentes no interfieran entre sí, como si se ejecutaran una tras otra. La <code>Durabilidad</code> garantiza que, una vez hecho COMMIT, los cambios sobreviven incluso ante una caída del servidor justo después." },
            { type: "note", text: "Piensa en ACID como el contrato de confianza entre tu aplicación y el SGBD: sin él, no podrías confiar en que un pago se procesó una sola vez y de forma correcta." },
          ],
          quiz: {
            question: "Dos usuarios compran el último boleto disponible al mismo tiempo, en transacciones distintas. ¿Qué propiedad ACID evita que ambas transacciones vean el mismo boleto como disponible y lo vendan dos veces?",
            options: [
              "Atomicidad",
              "Consistencia",
              "Durabilidad",
              "Aislamiento",
            ],
            correct: 3,
            ok: "El Aislamiento controla cómo interactúan transacciones concurrentes, evitando que una vea datos a medio modificar por otra y así se prevenga la doble venta.",
            bad: "Atomicidad protege el todo-o-nada de una transacción, Consistencia las reglas del esquema y Durabilidad la persistencia tras un COMMIT; ninguna regula directamente la concurrencia entre transacciones.",
          },
        },
      ],
    },
    {
      id: "bd2-u2",
      name: "Unidad 2 · Triggers y procedimientos",
      lessons: [
        {
          id: "bd2-l4",
          title: "Triggers",
          mins: 20,
          content: [
            { type: "p", html: "Un <code>trigger</code> (disparador) es un bloque de código que el SGBD ejecuta automáticamente cuando ocurre un evento sobre una tabla: <code>BEFORE INSERT</code>, <code>AFTER UPDATE</code>, <code>BEFORE DELETE</code>, etc. Es útil para validar datos o mantener columnas derivadas sin depender de que la aplicación lo recuerde hacer." },
            { type: "code", lines: [
              `<span style="${C}">-- Registra automáticamente el descuento de stock tras cada venta</span>`,
              `<span style="${K}">CREATE TRIGGER</span> despues_venta`,
              `<span style="${K}">AFTER INSERT ON</span> pedidos`,
              `<span style="${K}">FOR EACH ROW</span>`,
              `<span style="${K}">UPDATE</span> inventario`,
              `<span style="${K}">SET</span> stock = stock - NEW.cantidad`,
              `<span style="${K}">WHERE</span> producto_id = NEW.producto_id;`,
            ]},
            { type: "note", text: "NEW hace referencia a la fila que se acaba de insertar; en un trigger de UPDATE también tienes disponible OLD, con los valores anteriores." },
          ],
          quiz: {
            question: "Creas el trigger despues_venta AFTER INSERT ON pedidos que descuenta stock en inventario. ¿Cuándo se ejecuta ese código?",
            options: [
              "Solo cuando un desarrollador lo llama manualmente desde la aplicación",
              "Automáticamente, cada vez que se inserta una fila en pedidos",
              "Una vez al día, en un horario programado",
              "Solo si el INSERT afecta a más de una fila",
            ],
            correct: 1,
            ok: "Un trigger AFTER INSERT se dispara automáticamente en cada INSERT sobre la tabla, sin que la aplicación tenga que invocarlo.",
            bad: "Los triggers no se llaman manualmente ni corren en un horario fijo; tampoco dependen de cuántas filas afecte el INSERT, se ejecutan por cada fila insertada.",
          },
        },
        {
          id: "bd2-l5",
          title: "Procedimientos almacenados",
          mins: 22,
          content: [
            { type: "p", html: "Un <code>procedimiento almacenado</code> (stored procedure) es un bloque de lógica SQL con nombre que se guarda en el SGBD y se invoca con <code>CALL</code>. Permite encapsular varias sentencias, aceptar parámetros y reutilizar lógica compleja sin repetirla en cada aplicación cliente." },
            { type: "code", lines: [
              `<span style="${C}">-- Matricula a un estudiante en un curso</span>`,
              `<span style="${K}">DELIMITER</span> //`,
              `<span style="${K}">CREATE PROCEDURE</span> matricular(<span style="${K}">IN</span> p_estudiante <span style="${S}">INT</span>, <span style="${K}">IN</span> p_curso <span style="${S}">INT</span>)`,
              `<span style="${K}">BEGIN</span>`,
              `  <span style="${K}">INSERT INTO</span> matriculas (estudiante_id, curso_id) <span style="${K}">VALUES</span> (p_estudiante, p_curso);`,
              `<span style="${K}">END</span> //`,
              `<span style="${K}">DELIMITER</span> ;`,
              ``,
              `<span style="${K}">CALL</span> matricular(<span style="${N}">101</span>, <span style="${N}">7</span>);`,
            ]},
            { type: "note", text: "A diferencia de una función, un procedimiento no siempre devuelve un valor con RETURN: su propósito principal es ejecutar acciones (inserciones, actualizaciones), no calcular y devolver un dato." },
          ],
          quiz: {
            question: "¿Cuál es la ventaja principal de encapsular la lógica de matricular(estudiante, curso) en un procedimiento almacenado en lugar de repetir el INSERT en cada aplicación cliente?",
            options: [
              "El procedimiento se ejecuta sin necesidad de una base de datos",
              "El procedimiento reemplaza por completo el uso de SQL",
              "La lógica queda centralizada en el SGBD y se reutiliza con un simple CALL",
              "El procedimiento convierte automáticamente la tabla en una vista",
            ],
            correct: 2,
            ok: "El procedimiento guarda la lógica una sola vez en el SGBD; cualquier cliente la reutiliza con CALL sin duplicar sentencias SQL.",
            bad: "Un procedimiento sigue siendo SQL ejecutado por la base de datos, no la reemplaza, y no tiene relación con convertir tablas en vistas.",
          },
        },
        {
          id: "bd2-l6",
          title: "Funciones definidas por el usuario",
          mins: 18,
          content: [
            { type: "p", html: "Una <code>función definida por el usuario</code> (UDF) es similar a un procedimiento, pero siempre devuelve un único valor con <code>RETURN</code> y puede usarse directamente dentro de una expresión SQL, como si fuera una función nativa (<code>COUNT</code>, <code>AVG</code>)." },
            { type: "code", lines: [
              `<span style="${C}">-- Calcula la letra de calificación a partir de un promedio numérico</span>`,
              `<span style="${K}">DELIMITER</span> //`,
              `<span style="${K}">CREATE FUNCTION</span> letra_calificacion(promedio <span style="${S}">DECIMAL</span>(<span style="${N}">3</span>,<span style="${N}">2</span>))`,
              `<span style="${K}">RETURNS</span> <span style="${S}">CHAR</span>(<span style="${N}">1</span>)`,
              `<span style="${K}">DETERMINISTIC</span>`,
              `<span style="${K}">BEGIN</span>`,
              `  <span style="${K}">IF</span> promedio &gt;= <span style="${N}">4.5</span> <span style="${K}">THEN</span> <span style="${K}">RETURN</span> <span style="${S}">'A'</span>;`,
              `  <span style="${K}">ELSEIF</span> promedio &gt;= <span style="${N}">3.5</span> <span style="${K}">THEN</span> <span style="${K}">RETURN</span> <span style="${S}">'B'</span>;`,
              `  <span style="${K}">ELSE</span> <span style="${K}">RETURN</span> <span style="${S}">'C'</span>;`,
              `  <span style="${K}">END IF</span>;`,
              `<span style="${K}">END</span> //`,
              `<span style="${K}">DELIMITER</span> ;`,
            ]},
            { type: "note", text: "DETERMINISTIC le indica al SGBD que, para el mismo argumento, la función siempre devuelve el mismo resultado — útil para que pueda optimizar su ejecución." },
          ],
          quiz: {
            question: "¿Qué diferencia principal tiene letra_calificacion(promedio) frente a un procedimiento almacenado?",
            options: [
              "Devuelve siempre un único valor y puede usarse dentro de un SELECT como una expresión",
              "No puede recibir parámetros de entrada",
              "Solo puede ejecutarse con CALL, nunca dentro de una consulta",
              "Se ejecuta automáticamente ante cualquier INSERT",
            ],
            correct: 0,
            ok: "Una función siempre devuelve un valor con RETURN y se integra en expresiones SQL, como SELECT nombre, letra_calificacion(promedio); eso la distingue de un procedimiento.",
            bad: "Las funciones sí reciben parámetros y se usan dentro de consultas, no con CALL; ejecutarse ante un INSERT es comportamiento de un trigger, no de una función.",
          },
        },
      ],
    },
    {
      id: "bd2-u3",
      name: "Unidad 3 · Rendimiento",
      lessons: [
        {
          id: "bd2-l7",
          title: "Índices",
          mins: 20,
          content: [
            { type: "p", html: "Un <code>índice</code> es una estructura auxiliar que el SGBD mantiene para localizar filas rápidamente sin recorrer la tabla completa, de forma similar al índice de un libro. Se crea sobre una o varias columnas que usas con frecuencia en cláusulas <code>WHERE</code>, <code>JOIN</code> u <code>ORDER BY</code>." },
            { type: "code", lines: [
              `<span style="${C}">-- Acelera las búsquedas por email, muy frecuentes en el login</span>`,
              `<span style="${K}">CREATE INDEX</span> idx_usuarios_email <span style="${K}">ON</span> usuarios(email);`,
              `<span style="${K}">SELECT</span> * <span style="${K}">FROM</span> usuarios <span style="${K}">WHERE</span> email = <span style="${S}">'ana@correo.com'</span>;`,
            ]},
            { type: "note", text: "Los índices aceleran las lecturas pero tienen un costo: cada INSERT, UPDATE o DELETE debe actualizar también el índice, así que no conviene indexar cualquier columna." },
          ],
          quiz: {
            question: "¿Por qué no conviene crear un índice sobre cada columna de una tabla, aunque los índices aceleren las búsquedas?",
            options: [
              "Porque MySQL solo permite un índice por tabla",
              "Porque los índices hacen que SELECT devuelva menos columnas",
              "Porque un índice convierte la tabla en solo lectura",
              "Porque cada índice adicional ralentiza los INSERT, UPDATE y DELETE, que deben mantenerlo actualizado",
            ],
            correct: 3,
            ok: "Cada índice se debe actualizar en cada escritura, así que indexar todo penaliza el rendimiento de INSERT, UPDATE y DELETE a cambio de lecturas más rápidas.",
            bad: "MySQL permite varios índices por tabla, no afectan las columnas que devuelve el SELECT y no vuelven la tabla de solo lectura; el costo real está en las escrituras.",
          },
        },
        {
          id: "bd2-l8",
          title: "EXPLAIN y planes de consulta",
          mins: 22,
          content: [
            { type: "p", html: "<code>EXPLAIN</code> antepuesto a una consulta te muestra el <code>plan de ejecución</code> que el SGBD va a usar: si recorrerá la tabla completa (full scan) o aprovechará un índice, cuántas filas estima examinar y en qué orden combinará las tablas de un JOIN." },
            { type: "code", lines: [
              `<span style="${C}">-- Antes de optimizar, siempre mide con EXPLAIN</span>`,
              `<span style="${K}">EXPLAIN</span> <span style="${K}">SELECT</span> * <span style="${K}">FROM</span> usuarios <span style="${K}">WHERE</span> email = <span style="${S}">'ana@correo.com'</span>;`,
              `<span style="${C}">-- Las columnas "type" y "key" del resultado indican si usó el índice</span>`,
            ]},
            { type: "note", text: "Si la columna type del resultado muestra ALL, el SGBD está recorriendo la tabla completa; si muestra ref o const y key indica el índice, la búsqueda es eficiente." },
          ],
          quiz: {
            question: "Ejecutas EXPLAIN sobre una consulta y la columna type del resultado muestra ALL. ¿Qué te indica eso?",
            options: [
              "Que la consulta usó todos los índices disponibles",
              "Que el SGBD recorrió la tabla completa sin usar un índice",
              "Que la consulta falló y no devolvió resultados",
              "Que la tabla está vacía",
            ],
            correct: 1,
            ok: "type = ALL significa full table scan: el SGBD revisó cada fila porque no encontró (o no usó) un índice útil para esa condición.",
            bad: "ALL no significa que se usaron todos los índices, ni que la consulta falló, ni que la tabla esté vacía: describe una lectura secuencial completa de la tabla.",
          },
        },
        {
          id: "bd2-l9",
          title: "Bloqueos y concurrencia",
          mins: 22,
          content: [
            { type: "p", html: "Cuando dos transacciones intentan modificar la misma fila al mismo tiempo, el SGBD usa <code>bloqueos</code> (locks) para evitar que se pisen los cambios. Una transacción que modifica una fila obtiene un bloqueo exclusivo sobre ella; otra transacción que intente modificar la misma fila debe esperar a que la primera termine con COMMIT o ROLLBACK." },
            { type: "code", lines: [
              `<span style="${C}">-- Bloquea la fila para reservar el último cupo sin condiciones de carrera</span>`,
              `<span style="${K}">START TRANSACTION</span>;`,
              `<span style="${K}">SELECT</span> cupos <span style="${K}">FROM</span> cursos <span style="${K}">WHERE</span> id = <span style="${N}">7</span> <span style="${K}">FOR UPDATE</span>;`,
              `<span style="${K}">UPDATE</span> cursos <span style="${K}">SET</span> cupos = cupos - <span style="${N}">1</span> <span style="${K}">WHERE</span> id = <span style="${N}">7</span>;`,
              `<span style="${K}">COMMIT</span>;`,
            ]},
            { type: "note", text: "Un bloqueo mal gestionado puede producir un interbloqueo (deadlock): dos transacciones se esperan mutuamente y ninguna puede avanzar. El SGBD detecta esta situación y cancela una de las dos." },
          ],
          quiz: {
            question: "¿Para qué usas SELECT … FOR UPDATE antes de restar un cupo en cursos.cupos dentro de una transacción?",
            options: [
              "Para que la consulta se ejecute sin necesidad de COMMIT",
              "Para ordenar el resultado antes de actualizarlo",
              "Para bloquear la fila y evitar que otra transacción la modifique al mismo tiempo",
              "Para crear un índice temporal sobre la tabla",
            ],
            correct: 2,
            ok: "FOR UPDATE bloquea la fila leída hasta que la transacción termine, evitando que dos transacciones concurrentes resten el mismo cupo a la vez.",
            bad: "FOR UPDATE no reemplaza el COMMIT, no ordena resultados ni crea índices; su función es adquirir un bloqueo exclusivo sobre la fila leída.",
          },
        },
      ],
    },
  ],
};
