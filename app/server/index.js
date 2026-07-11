import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));
  // (las rutas de la API se montan aquí en tareas posteriores)

  app.use("/api", (req, res) => res.status(404).json({ error: "Recurso no encontrado" }));
  app.use("/ds", express.static(path.join(__dirname, "..", "..", "Coding Design System")));
  app.use(express.static(path.join(__dirname, "..", "web")));

  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inválido" });
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  });
  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => console.log(`Coding en http://localhost:${port}`));
}
