// Datos de ejemplo — Coding app
window.CODING_DATA = {
  user: { name: "Juan Jose", initials: "JS", xp: 2450, streak: 7 },
  courses: [
    { id: "bd1", subject: "Bases de datos I", subjectTone: "cyan", title: "Modelo relacional", lessons: 12, hours: 4, progress: 68, status: "EN CURSO" },
    { id: "prog2", subject: "Programacion II", subjectTone: "blue", title: "Herencia y polimorfismo", lessons: 9, hours: 3, progress: 12, status: "NUEVO" },
    { id: "algo", subject: "Algoritmos", subjectTone: "violet", title: "Recursion y complejidad", lessons: 14, hours: 5, progress: 45, status: "EN CURSO" },
    { id: "bd2", subject: "Bases de datos II", subjectTone: "cyan", title: "Transacciones y triggers", lessons: 10, hours: 4, progress: 0, status: "BLOQUEADO" },
    { id: "prog1", subject: "Programacion I", subjectTone: "blue", title: "Fundamentos y control de flujo", lessons: 16, hours: 6, progress: 100, status: "COMPLETADO" },
    { id: "web", subject: "Desarrollo web", subjectTone: "amber", title: "HTML, CSS y JavaScript", lessons: 18, hours: 7, progress: 30, status: "EN CURSO" },
  ],
  units: [
    { name: "Unidad 1 · Introduccion a las bases de datos", lessons: [
      { id: "l1", title: "Que es un SGBD", mins: 12, done: true },
      { id: "l2", title: "Tablas, filas y columnas", mins: 15, done: true },
      { id: "l3", title: "Claves primarias y foraneas", mins: 18, done: true },
    ]},
    { name: "Unidad 2 · El modelo relacional", lessons: [
      { id: "l4", title: "Relaciones 1:1, 1:N y N:M", mins: 20, done: true },
      { id: "l5", title: "Consultas SELECT y WHERE", mins: 22, done: false, current: true },
      { id: "l6", title: "JOIN entre tablas", mins: 25, done: false },
      { id: "l7", title: "Normalizacion: 1FN a 3FN", mins: 28, done: false },
    ]},
  ],
  quiz: {
    question: "Tienes la tabla estudiantes(nombre, promedio). ¿Que consulta devuelve los estudiantes con promedio mayor a 4.0, ordenados de mayor a menor?",
    options: [
      "SELECT nombre FROM estudiantes ORDER BY promedio;",
      "SELECT nombre, promedio FROM estudiantes WHERE promedio > 4.0 ORDER BY promedio DESC;",
      "SELECT * WHERE promedio > 4.0 FROM estudiantes;",
      "FILTER estudiantes BY promedio > 4.0;",
    ],
    correct: 1,
  },
};
