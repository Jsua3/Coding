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

## Cómo se aprende

Cada lección es un flujo: teoría → 2 ejercicios (opción múltiple, completar código, ordenar líneas o emparejar) → celebración con XP. Completar sin fallos da bonus "perfecto" (+10). Los ejercicios fallados entran a la cola de **Repaso** (tarjeta en el inicio): corregirlos da +5 XP. El sonido se silencia desde el altavoz del menú.

## Estructura

- `server/` — Express: `auth.js` (JWT), `routes/` (me, courses, lessons, exercises, review), `services/` (progreso, gamificación, validadores de ejercicios, repaso), `seed-data/` (contenido de las 7 materias: lecciones + 142 ejercicios)
- `web/` — frontend sin build: React CDN + Babel + design system en `/ds`; `motion.css`/`fx.js` (animaciones y sonido), `screens/` (login, dashboard, curso, lección stepper, repaso)
- `test/` — node:test + supertest
