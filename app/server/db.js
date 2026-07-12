import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let pool = null;

function dbConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  };
}

export function dbName() {
  return process.env.DB_NAME || "coding";
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({ ...dbConfig(), database: dbName(), connectionLimit: 10 });
  }
  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

export async function initDb({ seed = true } = {}) {
  const conn = await mysql.createConnection(dbConfig());
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName()}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
    await getPool().query(stmt);
  }
  if (seed) {
    const rows = await query("SELECT COUNT(*) AS n FROM courses");
    if (rows[0].n === 0) {
      const { runSeed } = await import("./seed.js");
      await runSeed();
    }
  }
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
