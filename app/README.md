# Coding — app

Backend Express + MySQL y frontend del design system para la app de aprendizaje **Coding**.

## Requisitos

- Node.js ≥ 20
- MySQL local corriendo (MySQL Server, XAMPP o WAMP)

## Puesta en marcha

```bash
cd app
npm install
copy .env.example .env    # en Windows (cp en unix); completa DB_USER/DB_PASSWORD y un JWT_SECRET
npm start                 # crea la BD `coding`, aplica schema y siembra contenido si hace falta
```

Abre http://localhost:3000, crea tu cuenta y estudia.

## Comandos

- `npm start` — arranca el servidor en el puerto 3000 (configurable con PORT)
- `npm test` — suite completa (usa la BD `coding_test`, se crea sola)
- `npm run seed` — refresca el contenido de materias/lecciones sin tocar usuarios ni progreso

## Estructura

- `server/` — Express: `auth.js` (JWT), `routes/` (me, courses, lessons), `services/` (progreso, gamificación), `seed-data/` (contenido de las 6 materias)
- `web/` — frontend sin build: React CDN + Babel + componentes de `/ds` (design system)
- `test/` — node:test + supertest
