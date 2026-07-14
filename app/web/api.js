const API = {
  token: localStorage.getItem("coding-token"),
  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem("coding-token", t);
    else localStorage.removeItem("coding-token");
  },
  onUnauthorized: null,
  // Cierre de sesión voluntario. Acaba en el mismo sitio que un 401 (de vuelta al login), pero es
  // otro camino: aquí el token era válido y lo tiramos a propósito.
  logout() {
    this.setToken(null);
    if (this.onUnauthorized) this.onUnauthorized();
  },
  async request(path, { method = "GET", body } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (this.token) headers.Authorization = "Bearer " + this.token;
    let res;
    try {
      res = await fetch("/api" + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
      throw new Error("No hay conexión con el servidor");
    }
    let data = null;
    try { data = await res.json(); } catch {}
    if (res.status === 401 && !path.startsWith("/auth/")) {
      this.setToken(null);
      if (this.onUnauthorized) this.onUnauthorized();
    }
    if (!res.ok) throw new Error((data && data.error) || "Error del servidor");
    return data;
  },
  get(path) { return this.request(path); },
  post(path, body) { return this.request(path, { method: "POST", body }); },
};
window.API = API;
