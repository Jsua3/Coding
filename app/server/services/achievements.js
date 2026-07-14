// Los logros se DERIVAN de los contadores; no se guardan en ninguna parte. Es seguro hacerlo
// porque todos los contadores son monótonos (solo crecen), así que el conjunto de desbloqueados
// nunca encoge. Ojo: la constancia se mide contra la MEJOR racha histórica, no la actual — perder
// la racha no te quita el logro.
export const ACHIEVEMENTS = [
  // Volumen
  { id: "primera-leccion", name: "Primer paso", description: "Completa tu primera lección", secret: false, metric: "lessonsDone", target: 1 },
  { id: "diez-lecciones", name: "Tomando ritmo", description: "Completa 10 lecciones", secret: false, metric: "lessonsDone", target: 10 },
  { id: "veinticinco-lecciones", name: "Medio camino", description: "Completa 25 lecciones", secret: false, metric: "lessonsDone", target: 25 },
  { id: "todas-las-lecciones", name: "Sin dejar una", description: "Completa las 64 lecciones", secret: false, metric: "lessonsDone", target: 64 },
  // Constancia
  { id: "racha-3", name: "Tres días seguidos", description: "Estudia 3 días seguidos", secret: false, metric: "bestStreak", target: 3 },
  { id: "racha-7", name: "Una semana entera", description: "Estudia 7 días seguidos", secret: false, metric: "bestStreak", target: 7 },
  { id: "racha-14", name: "Dos semanas", description: "Estudia 14 días seguidos", secret: false, metric: "bestStreak", target: 14 },
  { id: "racha-30", name: "Un mes sin fallar", description: "Estudia 30 días seguidos", secret: false, metric: "bestStreak", target: 30 },
  // Oficio
  { id: "primera-perfecta", name: "Sin un error", description: "Termina una lección sin fallar ni una vez", secret: false, metric: "perfectLessons", target: 1 },
  { id: "cinco-perfectas", name: "Pulso firme", description: "Termina 5 lecciones perfectas", secret: false, metric: "perfectLessons", target: 5 },
  { id: "primer-curso", name: "Materia dominada", description: "Completa una materia entera", secret: false, metric: "coursesCompleted", target: 1 },
  { id: "todos-los-cursos", name: "El plan completo", description: "Completa las 6 materias", secret: false, metric: "coursesCompleted", target: 6 },
  // Repaso
  { id: "diez-repasos", name: "Nada se queda atrás", description: "Corrige 10 ejercicios en repaso", secret: false, metric: "reviewCleared", target: 10 },
  // Secretos — los dos de horario son disjuntos a propósito: si "madrugador" fuera "antes de las 7"
  // a secas, terminar a las 3 de la mañana caería los dos de golpe.
  { id: "madrugador", name: "Madrugador", description: "Terminaste una lección entre las 5 y las 7 de la mañana", secret: true, metric: "earlyBird", target: 1 },
  { id: "nocturno", name: "Turno de noche", description: "Terminaste una lección de madrugada, antes de las 5", secret: true, metric: "nightOwl", target: 1 },
  { id: "resucitado", name: "Segunda oportunidad", description: "Acertaste en repaso un ejercicio que habías fallado tres veces", secret: true, metric: "resurrected", target: 1 },
  { id: "impecable", name: "Racha impecable", description: "Cinco lecciones perfectas seguidas", secret: true, metric: "perfectRun", target: 5 },
];

// Number(false) = 0 y Number(true) = 1, así que los booleanos secretos funcionan como umbral 1.
function value(stats, metric) {
  return Number((stats && stats[metric]) || 0);
}

export function unlockedFor(stats) {
  return new Set(ACHIEVEMENTS.filter((a) => value(stats, a.metric) >= a.target).map((a) => a.id));
}

export function achievementsFor(stats) {
  const unlocked = unlockedFor(stats);
  return ACHIEVEMENTS.map((a) => {
    const on = unlocked.has(a.id);
    // Un secreto bloqueado no revela nada: ni su nombre, ni su pista, ni su progreso. Un secreto
    // que se puede leer en la pestaña de red no es un secreto.
    if (a.secret) {
      return on
        ? { id: a.id, name: a.name, description: a.description, secret: true, unlocked: true, current: 1, target: 1 }
        : { id: a.id, name: "???", description: "Un logro secreto", secret: true, unlocked: false, current: 0, target: 1 };
    }
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      secret: false,
      unlocked: on,
      current: Math.min(value(stats, a.metric), a.target), // topado: nunca "12 de 10"
      target: a.target,
    };
  });
}

// El nombre REAL, secretos incluidos. Solo para el toast: un secreto que acaba de caer ya no es
// secreto — es justo el momento de decir cómo se llama.
export function achievementInfo(id) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  return a ? { id: a.id, name: a.name, description: a.description } : null;
}
