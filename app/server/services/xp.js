// Los tres importes de XP del juego. Viven en un solo sitio porque se usan en los DOS sentidos:
// al escribirlos (rutas) y al leerlos (los logros derivan "lecciones perfectas" del importe 10 y
// "repasos corregidos" del importe 5). Si divergieran, los logros mentirían en silencio.
export const XP_LESSON = 50;
export const XP_PERFECT = 10;
export const XP_REVIEW = 5;

// El coste de proteger un día de racha: una lección. Se ESCRIBE (el evento negativo) y se LEE
// (el precio mostrado y la validación), así que vive con los demás importes.
export const SHIELD_COST = 50;

// El split de XP. Gastar (un evento negativo) reduce el SALDO pero no el XP ganado, así que el
// nivel — que se deriva de lo ganado — nunca baja al proteger la racha.
export function earnedXp(events) {
  return events.reduce((sum, e) => (e.amount > 0 ? sum + e.amount : sum), 0);
}
export function balanceXp(events) {
  return events.reduce((sum, e) => sum + e.amount, 0);
}
