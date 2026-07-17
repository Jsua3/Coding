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

export function levelFor(xp) {
  const total = Math.max(0, Number(xp) || 0);
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) {
    if (total >= LEVELS[k].xp) i = k;
  }
  const current = LEVELS[i];
  const next = LEVELS[i + 1] || null;
  const xpInLevel = total - current.xp;
  const xpToNext = next ? next.xp - total : 0;
  const span = next ? next.xp - current.xp : 0;
  // Math.floor y no Math.round: con round, los ultimos XP de un tramo largo redondean
  // a 100 y la barra se llena antes de que subas de nivel. El 100 se reserva al ultimo nivel.
  const progress = next ? Math.floor((xpInLevel / span) * 100) : 100;
  return { n: current.n, name: current.name, xp: total, xpInLevel, xpToNext, progress, next };
}
