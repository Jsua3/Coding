# Coding — contexto para agentes

**Antes de trabajar en este proyecto, lee `prompt-maestro.md` (raíz del repo): contiene TODO el contexto** — objetivo, arquitectura, modelo de datos, API, reglas de negocio, patrones del frontend sin build, entorno, flujo de trabajo, deuda pendiente y roadmap.

Para diseñar o animar cualquier cosa nueva, lee también **`docs/liquid-glass.md`**: es el lenguaje visual (física del vidrio, coreografía de gota, disciplina de motion).

Reglas mínimas que aplican siempre:

- `Coding Design System/` es intocable; se sirve en `/ds`. Sus componentes **no reenvían `className`**: las clases de animación van en un `<div>` propio.
- **Todo lo derivable se calcula, nunca se almacena** (progreso, racha, repaso, niveles, logros — cero columnas de estado). `answer` y `password_hash` jamás salen por la API; **el nombre de un logro secreto bloqueado, tampoco**.
- Frontend sin build (React UMD + Babel): sin `import`/`export`, `React.Fragment` explícito, globales `window`, orden de scripts en `index.html` = dependencias.
- `backdrop-filter` jamás sobre un elemento con texto (va en un `<span aria-hidden>` con `zIndex: -1`). En animaciones, solo `transform`/`opacity`/`filter`. Reduced motion con doble cinturón (gate JS + `@media`).
- Copy en español con tuteo, sentence case, sin emoji. Dependencias nuevas: preguntar primero.
- BD local = MariaDB 12.0.2; credenciales en `app/.env` (git-ignorado) — si falta, pedirlas al usuario, no adivinar.
- Comandos (desde `app/`): `npm start` (:3000), `npm test` (**102/102** deben pasar), `npm run seed`. El dev server guarda el backend en memoria: si sus respuestas parecen viejas, mátalo y relánzalo.
- Trabajo no trivial: flujo superpowers (brainstorm → spec en `docs/superpowers/specs/` → plan → ejecución por subagentes → review final → merge). **Ledger histórico y follow-ups abiertos en `.superpowers/sdd/progress.md` — léelo antes de "redescubrir" issues.**
