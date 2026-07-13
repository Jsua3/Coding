# Coding — contexto para agentes

**Antes de trabajar en este proyecto, lee `prompt-maestro.md` (raíz del repo): contiene TODO el contexto** — objetivo, arquitectura, modelo de datos, API, reglas de negocio, patrones del frontend sin build, entorno, flujo de trabajo y roadmap.

Reglas mínimas que aplican siempre:

- `Coding Design System/` es intocable; se sirve en `/ds`.
- Todo lo derivable se calcula, nunca se almacena. `answer` y `password_hash` jamás salen por la API.
- Frontend sin build (React UMD + Babel): sin `import`/`export`, `React.Fragment` explícito, globales `window`, orden de scripts en `index.html` = dependencias.
- Copy en español con tuteo, sin emoji. Dependencias nuevas: preguntar primero.
- BD local = MariaDB 12.0.2; credenciales en `app/.env` (git-ignorado) — si falta, pedirlas al usuario, no adivinar.
- Comandos (desde `app/`): `npm start` (:3000), `npm test` (57/57 deben pasar), `npm run seed`.
- Trabajo no trivial: flujo superpowers (brainstorm → spec en `docs/superpowers/specs/` → plan → ejecución por subagentes → review final → merge). Ledger histórico en `.superpowers/sdd/progress.md`.
