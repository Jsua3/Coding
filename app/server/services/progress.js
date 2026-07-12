export function progressPercent(completed, total) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

export function courseStatus({ progress, prereqProgress = null }) {
  if (prereqProgress !== null && prereqProgress < 100) return "BLOQUEADO";
  if (progress >= 100) return "COMPLETADO";
  if (progress > 0) return "EN CURSO";
  return "NUEVO";
}
