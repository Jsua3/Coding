import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "./db.js";
import { required, validEmail } from "./lib/validate.js";

const router = Router();

export function initials(name) {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, initials: initials(u.name) };
}

function signToken(user, remember) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: remember ? "30d" : "1d" });
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!required(name)) return res.status(400).json({ error: "El nombre es obligatorio" });
    if (!validEmail(email)) return res.status(400).json({ error: "El correo no tiene un formato válido" });
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }
    if (name.trim().length > 80) {
      return res.status(400).json({ error: "El nombre es demasiado largo (máximo 80 caracteres)" });
    }
    if (email.length > 120) {
      return res.status(400).json({ error: "El correo es demasiado largo (máximo 120 caracteres)" });
    }
    const clean = { name: name.trim(), email: email.toLowerCase() };
    const existing = await query("SELECT id FROM users WHERE email = ?", [clean.email]);
    if (existing.length) return res.status(409).json({ error: "Este correo ya está registrado" });
    const hash = await bcrypt.hash(password, 10);
    const result = await query("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [clean.name, clean.email, hash]);
    const user = { id: result.insertId, ...clean };
    res.status(201).json({ token: signToken(user, false), user: publicUser(user) });
  } catch (e) {
    if (e && e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Este correo ya está registrado" });
    }
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, remember } = req.body || {};
    const rows = await query("SELECT * FROM users WHERE email = ?", [String(email || "").toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(password || ""), user.password_hash))) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }
    res.json({ token: signToken(user, Boolean(remember)), user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Inicia sesión para continuar" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Tu sesión expiró, inicia sesión de nuevo" });
  }
}

export default router;
