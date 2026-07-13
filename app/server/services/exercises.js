export function validateResponse(type, payload, answer, response) {
  if (!response || typeof response !== "object") return { valid: false };

  if (type === "choice") {
    const n = payload.options.length;
    if (!Number.isInteger(response.index) || response.index < 0 || response.index >= n) return { valid: false };
    return { valid: true, correct: response.index === answer.index };
  }

  if (type === "blanks") {
    const blanks = response.blanks;
    if (!Array.isArray(blanks) || blanks.length !== answer.blanks.length) return { valid: false };
    if (!blanks.every((b) => typeof b === "string")) return { valid: false };
    return { valid: true, correct: blanks.every((b, i) => b === answer.blanks[i]) };
  }

  if (type === "order") {
    const ids = payload.lines.map((l) => l.id);
    const order = response.order;
    if (!Array.isArray(order) || order.length !== ids.length) return { valid: false };
    if (new Set(order).size !== order.length || !order.every((id) => ids.includes(id))) return { valid: false };
    return { valid: true, correct: order.every((id, i) => id === answer.order[i]) };
  }

  if (type === "match") {
    const pairs = response.pairs;
    const n = payload.left.length;
    if (!Array.isArray(pairs) || pairs.length !== n) return { valid: false };
    const ls = new Set();
    const rs = new Set();
    for (const p of pairs) {
      if (!Array.isArray(p) || p.length !== 2 || !Number.isInteger(p[0]) || !Number.isInteger(p[1])) return { valid: false };
      if (p[0] < 0 || p[0] >= n || p[1] < 0 || p[1] >= n) return { valid: false };
      ls.add(p[0]);
      rs.add(p[1]);
    }
    if (ls.size !== n || rs.size !== n) return { valid: false };
    const want = new Map(answer.pairs.map(([l, r]) => [l, r]));
    return { valid: true, correct: pairs.every(([l, r]) => want.get(l) === r) };
  }

  return { valid: false };
}
