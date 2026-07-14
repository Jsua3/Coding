// Los niveles cuentan tu carrera en el oficio, y la curva está anclada al techo real del juego:
// el último nivel se alcanza exactamente al terminar el temario (64 lecciones x 50 XP = 3200).
// Los bonus de "Perfecto" solo te llevan allí antes; el repaso solo da XP si fallas, así que un
// jugador impecable nunca lo necesita.
export const LEVELS = [
  { n: 1, name: "Aprendiz", xp: 0 },
  { n: 2, name: "Practicante", xp: 50 },
  { n: 3, name: "Junior", xp: 150 },
  { n: 4, name: "Desarrollador", xp: 300 },
  { n: 5, name: "Semi-senior", xp: 500 },
  { n: 6, name: "Senior", xp: 750 },
  { n: 7, name: "Especialista", xp: 1050 },
  { n: 8, name: "Tech lead", xp: 1400 },
  { n: 9, name: "Referente", xp: 1800 },
  { n: 10, name: "Principal", xp: 2250 },
  { n: 11, name: "Arquitecto", xp: 2700 },
  { n: 12, name: "Maestro", xp: 3200 },
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
