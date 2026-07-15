# El meta-juego, Iteración B: la economía — diseño

**Fecha:** 2026-07-15 · **Estado:** aprobado por el usuario
**Contexto:** cierre del sub-proyecto 3. La Iteración A (ya en `master`) hizo el meta-juego **derivado**: niveles, logros, la página de Progreso. Esta iteración añade lo único que **exige tocar el esquema**: una preferencia del usuario (la meta diaria) y un gasto de XP (el protector de racha), más la página de Perfil como hogar de los ajustes.

**Es el primer cambio de `schema.sql` desde la iteración 2.**

---

## 1. Alcance

**Dentro:**

1. **Meta diaria de XP configurable** — un objetivo que el usuario fija; anillo de progreso en Inicio.
2. **Protector de racha canjeable con XP** — reparación retroactiva de un hueco reciente.
3. **Página de Perfil** — identidad + ajustes (la meta diaria) + panel de racha (con el botón de proteger) + cerrar sesión.
4. El **split de XP**: nivel desde el XP ganado (nunca baja), saldo gastable desde el neto.

**Fuera:**

- El **agujero del `context`** (follow-up preexistente): se cierra en una tarea aparte DESPUÉS de esta iteración, no aquí.
- Cursor como fuente de luz (paso 3 del lenguaje visual — `docs/liquid-glass.md` §10).
- Cualquier otra tienda o economía más allá del escudo.

---

## 2. Modelo de datos (el único cambio de esquema)

**Una columna nueva y una tabla nueva** en `app/server/schema.sql` (que `initDb` aplica; ver §7 sobre la migración):

```sql
ALTER TABLE users ADD COLUMN daily_goal INT NOT NULL DEFAULT 50;
-- (en schema.sql se escribe directamente en el CREATE TABLE users con el DEFAULT)

CREATE TABLE IF NOT EXISTS streak_shields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  protected_day DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shield (user_id, protected_day),
  CONSTRAINT fk_shield_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- `daily_goal`: la meta. Default 50 (una lección). El `DEFAULT` cubre a los usuarios existentes sin migración manual.
- `streak_shields`: **un día protegido por fila.** El `UNIQUE(user_id, protected_day)` impide proteger el mismo día dos veces (y hace idempotente un doble submit vía `ER_DUP_ENTRY`).

**El gasto de XP NO es una columna nueva: es un `xp_events` con `amount` negativo** (la columna ya es `INT` con signo). Comprar un escudo = **una transacción** con dos inserciones: la(s) fila(s) en `streak_shields` + un `xp_events(amount = -COST, lesson_id = NULL)`. Atómico, como la completación de lección.

### El split de XP (derivado, sin columnas nuevas)

Dos derivaciones distintas de la misma tabla `xp_events`:

| Concepto | Fórmula | Alimenta |
|---|---|---|
| **XP ganado** (`xpEarned`) | `SUM(amount) WHERE amount > 0` | El **nivel** (nunca baja), la meta diaria, la gráfica semanal, el heatmap — todo lo que es "actividad" |
| **XP saldo** (`balance`) | `SUM(amount)` (incluye los negativos) | Solo lo que puedes **gastar** (la compra del escudo) |

**Consecuencia clave que esto resuelve:** gastar XP reduce tu **saldo** pero no tu **nivel**. Proteger tu racha nunca te degrada de Senior a Semi-senior — el nivel es tu esfuerzo acumulado, un récord permanente.

**Regla de invariante:** todo lector de XP existente que hoy hace `SUM(amount)` y quiere "actividad" debe pasar a `SUM(amount WHERE amount > 0)`. Los sitios exactos:
- `me.js` → `stats.xp` (el "XP total" mostrado), `stats.level`, `weeklyXp`.
- `progress.js` (ruta) → `level`, `heatmap`, `weekXp`.
- `metagame.js` → `activityByDay` (el heatmap: solo actividad positiva).
- **Constante `SHIELD_COST = 50`** en `services/xp.js` (junto a los otros importes de XP), porque se **escribe** (el evento negativo) y se **lee** (el precio mostrado y la validación).

---

## 3. El protector de racha (la pieza delicada)

### `currentStreak` NO cambia por dentro

La regla: **un día cuenta si tuviste actividad O lo protegiste.** En vez de tocar la función pura, se le pasa la **unión** `díasActivos ∪ díasProtegidos`. Lo mismo con `bestStreak`. Un helper centraliza la unión para no repetir la query.

**Los días protegidos cuentan en TODAS partes de forma consistente** — incluida `bestStreak`, y por tanto los logros de constancia (`racha-3/7/14/30`). Es el XP del usuario; el día cuenta, punto. (Decisión explícita, no accidente.)

### `repairableGap` — función pura nueva en `gamification.js`

```js
// repairableGap(activeDays, protectedDays, today, windowDays) → { days: [YYYY-MM-DD…], costPerDay, totalCost } | null
// Devuelve el hueco reparable inmediatamente detrás de la racha actual, o null.
```

Algoritmo (con las tres propiedades que lo hacen honesto):

1. `credited = activeDays ∪ protectedDays`. **Racha viva:** `cursor = credited.has(today) ? today : prevDay(today)`. Si `!credited.has(cursor)` → **`null`** (sin actividad hoy ni ayer, no hay racha que proteger).
2. Camina atrás mientras `credited` para hallar `streakStart` (el día más antiguo de la racha actual).
3. Recoge los días que faltan justo antes de `streakStart`, **mientras** estén dentro de la ventana (`today - día ≤ windowDays`). Para al toparse con un día con crédito (el **ancla**) o al salir de la ventana.
4. **Reparable solo si paró por el ancla** (hubo racha antes que reconectar). Si se acabó la ventana antes del ancla → **`null`**.

Tabla de verdad (con `windowDays = 2`, `costPerDay = 50`), que se testea entera:

| Situación (hoy = último) | `repairableGap` |
|---|---|
| activo · **falta** · activo(hoy) | `{days:[falta], totalCost:50}` |
| activo · **falta** · **falta** · activo(hoy), ancla dentro de ventana | `{days:[2 días], totalCost:100}` |
| **3 días** seguidos faltando (ancla fuera de ventana) | `null` |
| Racha larga y sana (hueco antiguo detrás) | `null` |
| Fabricar de la nada (activo hoy, todo lo demás vacío) | `null` (sin ancla) |
| Sin actividad hoy ni ayer | `null` (sin racha viva) |
| Hoy sin actividad, ayer activo, hueco fresco detrás con ancla | reparable (la racha vive a través de ayer) |

### La compra: `POST /streak/protect`

- **Recalcula `repairableGap` en el servidor.** Jamás confía en que el cliente diga qué días proteger — el servidor decide qué es reparable con los datos reales (misma disciplina que `answer`).
- Comprueba que el **saldo** (`SUM(amount)`) alcanza el `totalCost`. Si no → 400 "No tienes suficiente XP para proteger tu racha".
- Si el hueco ya no es reparable (pasó la ventana) → 400 "Ya no puedes recuperar esta racha".
- En una **transacción**: inserta una fila `streak_shields` por cada día del hueco + un `xp_events(amount = -totalCost)`. `ER_DUP_ENTRY` (doble submit) tolerado sin cobrar dos veces.
- Devuelve `{ streak: {current, best, repairable}, balance }`.

### La meta diaria: `PUT /me/daily-goal`

- `{goal}` debe estar en la escala `[20, 50, 100, 150]`. Fuera de ella → 400 "Esa meta no es válida".
- Guarda `users.daily_goal` y devuelve `{ dailyGoal }`.

---

## 4. API

**`GET /me`** gana en `stats`:
- `dailyGoal` (el valor guardado), `xpToday` (XP **ganado** hoy: `SUM(amount>0 AND día = hoy)`), `balance` (saldo gastable).
- `xp`, `level`, `xpWeek`, `streak` pasan a derivarse del **XP ganado** (ver §2 invariante). `streak` sigue siendo un número, pero calculado sobre la unión activos ∪ protegidos.

**`GET /progress`** gana:
- `streak: { current, best, repairable }` — `current` y `best` sobre la unión; `repairable` es `{ days:[…], totalCost } | null`.
- `level`, `heatmap`, `weekXp` pasan a derivarse del XP ganado.

**`PUT /me/daily-goal`** `{goal}` → `{ dailyGoal }`. 400 si fuera de escala.

**`POST /streak/protect`** (body vacío) → `{ streak, balance }`. 400 si no reparable o saldo insuficiente.

Todas requieren auth (Bearer). Errores en español con tuteo.

---

## 5. Frontend

### Inicio (`InicioScreen.jsx`)

- **Anillo de meta diaria** junto a las estadísticas: `Progress` en forma de anillo (`shape="ring"`, tono cyan/violet) con `xpToday / dailyGoal`, etiqueta "XP de hoy". Usa `FX.countUp`. Si `xpToday >= dailyGoal`, el anillo se llena y muestra "¡Meta cumplida!".
- **Tarjeta de alerta ámbar** (solo si `progress.streak.repairable`): *"Tu racha de N días se rompió. Recupérala por {totalCost} XP"* → botón que navega a Perfil (`setTab("perfil")`). Es sensible al tiempo, por eso vive en Inicio y no oculta tras una pestaña. Envuelta en `.lg-reveal`.

### Perfil (`ProfileScreen.jsx`, nuevo)

La pestaña muerta cobra vida. El router (`app.jsx`) gana la rama `perfil`; el menú del avatar gana "Tu perfil" encima de "Tu progreso".

- **Identidad:** avatar grande (las iniciales), nombre, email, "Miembro desde {fecha}" (de `user.created_at` — **se añade a `/me`** si no está: hoy `/me` no devuelve `created_at`, hay que incluirlo).
- **Meta diaria:** cuatro botones de nivel — **Relajado 20 · Normal 50 · Serio 100 · Intenso 150** XP. El activo resaltado. Tocar uno hace `PUT /me/daily-goal` y refresca. Sin guardar explícito (cambio inmediato).
- **Panel de racha:** racha actual (con la llama), mejor racha, y — si hay hueco reparable — el botón **Proteger racha** que muestra el coste y el saldo restante; al confirmar hace `POST /streak/protect`.
- **Cerrar sesión:** botón (se mantiene también en el menú del avatar — atajo útil).

### La ceremonia (habla el lenguaje)

- Proteger la racha con éxito: `FX.burst(x, y)` (chispas aurora) sobre el botón + `FX.sound.play("streak")`; la tarjeta de alerta de Inicio se **evapora** (`anim-evaporate`) la próxima vez que se monta Inicio (porque `repairable` pasa a `null`).
- Perfil entra con los reveals que ya existen (`Liquid.reveal` + `.lg-reveal`).
- El selector de meta: el botón activo transiciona suave; nada de rebote (pieza mediana).

Reglas de la casa que aplican: nada de blur sobre texto; el KIT no reenvía `className` (wrappers propios); copy en español con tuteo, sin emoji; reduced motion doble cinturón.

---

## 6. Verificación

1. **Tests unitarios nuevos (puros, TDD estricto):**
   - `repairableGap`: cada fila de la tabla de §3; los bordes de la ventana (1, 2, 3 días); que no fabrica; que respeta el ancla.
   - El nivel desde XP ganado: gastar XP (evento negativo) **no baja** el nivel; el saldo sí baja.
   - La unión activos ∪ protegidos alimenta `currentStreak` y `bestStreak` de forma consistente.
2. **Tests de integración nuevos:**
   - `PUT /me/daily-goal`: valida la escala (400 fuera de ella), persiste, 401 sin token.
   - `POST /streak/protect`: cobra el coste correcto y reconecta; rechaza hueco no reparable (400); rechaza saldo insuficiente (400); es atómico (si falla el XP, no queda escudo); doble submit no cobra dos veces (`ER_DUP_ENTRY`).
   - `/me` y `/progress`: traen los campos nuevos con la forma correcta; el `deepEqual` de `stats` en `me.test.js` se **actualiza** (gana `dailyGoal`, `xpToday`, `balance`).
3. **Los 102 tests actuales siguen pasando.** El split es aditivo; hay que revisar los que afirman sobre `stats.xp` tras gastar (ninguno gasta hoy, así que siguen valiendo — pero el `deepEqual` de `/me` gana claves nuevas).
4. **Checklist E2E** (con trap `window.onerror`): anillo de meta llena; tarjeta de alerta solo con hueco; proteger reconecta la racha, descuenta el saldo y **no baja el nivel**; cambiar la meta persiste; Perfil navega desde el menú del avatar; cerrar sesión funciona.
5. **Verificación humana pendiente:** el *feel* de las chispas al proteger y de la evaporación de la alerta — navegador en primer plano.

---

## 7. La migración de esquema (primera desde la iteración 2)

`initDb()` en `db.js` aplica `schema.sql` con `CREATE TABLE IF NOT EXISTS`, así que la **tabla nueva** sale sola. Pero **una columna nueva en una tabla que ya existe NO la añade `CREATE TABLE IF NOT EXISTS`** — la BD dev del usuario ya tiene `users` sin `daily_goal`.

**Decisión:** `initDb()` gana un paso de migración idempotente y explícito — tras aplicar el schema, ejecuta los `ALTER TABLE … ADD COLUMN IF NOT EXISTS` pendientes (MariaDB 10.0+ soporta `IF NOT EXISTS` en `ADD COLUMN`). Es una lista de migraciones mínima, no un framework. La BD de tests se crea desde cero cada vez, así que ahí el `CREATE TABLE` con la columna basta; la migración solo importa para la BD dev existente.

`seed.js` no cambia (no siembra usuarios). El `.env` y las credenciales no cambian.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El split de XP rompe un lector existente que quería "actividad" y ahora ve negativos | Lista explícita de sitios en §2; cada uno pasa a `amount > 0`; los tests de `/me` y `/progress` lo cubren |
| `repairableGap` se equivoca en un borde de la ventana o fabrica una racha | Tabla de verdad exhaustiva testeada con fechas fijas, incluidos los tres casos de fabricación/ancla |
| La compra cobra pero no protege (o al revés) | Transacción única; test de atomicidad; `ER_DUP_ENTRY` tolerado |
| La columna nueva no llega a la BD dev existente | Paso de migración `ALTER … ADD COLUMN IF NOT EXISTS` en `initDb` (§7) |
| El cliente intenta proteger días arbitrarios | El servidor **recalcula** `repairableGap` e ignora cualquier lista del cliente |
| Gastar deja el saldo negativo | La ruta valida `balance >= totalCost` antes de cobrar; test explícito |
