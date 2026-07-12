export function required(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
