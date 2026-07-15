import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb, correctResponseFor, wrongResponseFor } from "./helpers.js";
import { createApp } from "../server/index.js";

// El agujero de integridad del `context`: el cliente NO puede reclamar "review" para un ejercicio
// que no está genuinamente pendiente de repaso. Si lo intenta (para esconder un fallo de lección),
// el servidor degrada a 'lesson' — el servidor decide la verdad, igual que con `answer`.

let app;
before(async () => { await setupTestDb(); app = createApp(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function registrar() {
  const r = await request(app).post("/api/auth/register").send({ name: "Eva Ruiz", email: "eva@test.dev", password: "secreto1" });
  return { token: r.body.token, id: r.body.user.id };
}
async function ejerciciosDe(lessonId) {
  return query("SELECT id FROM exercises WHERE lesson_id = ? ORDER BY order_index", [lessonId]);
}
async function responder(token, exerciseId, body) {
  return request(app).post("/api/exercises/" + exerciseId + "/answer").set("Authorization", "Bearer " + token).send(body);
}

test("fallar con context 'review' un ejercicio NO pendiente cuenta como fallo de leccion: no forja perfecta", async () => {
  const { token } = await registrar();
  const ejercicios = await ejerciciosDe("l1");
  // El exploit: fallamos el primer ejercicio MINTIENDO context: "review". No está pendiente (es su
  // primer intento), así que la mentira debe ignorarse y el fallo contar como 'lesson'.
  await responder(token, ejercicios[0].id, { response: await wrongResponseFor(ejercicios[0].id), context: "review" });
  // Ahora acertamos todo para completar la lección.
  let ultima;
  for (const ex of ejercicios) {
    ultima = await responder(token, ex.id, { response: await correctResponseFor(ex.id) });
  }
  assert.equal(ultima.body.lessonCompleted, true);
  assert.equal(ultima.body.perfectBonus, 0, "el fallo mentiroso debe contar: la leccion NO es perfecta");
});

test("el fallo mentiroso se registra con context 'lesson', no 'review'", async () => {
  const { token, id } = await registrar();
  const ejercicios = await ejerciciosDe("l1");
  await responder(token, ejercicios[0].id, { response: await wrongResponseFor(ejercicios[0].id), context: "review" });
  const [row] = await query(
    "SELECT context FROM answer_attempts WHERE user_id = ? AND exercise_id = ?",
    [id, ejercicios[0].id]
  );
  assert.equal(row.context, "lesson");
});

test("el repaso legitimo sigue funcionando: fallar en leccion, luego acertar en repaso da +5 y limpia", async () => {
  const { token } = await registrar();
  const ejercicios = await ejerciciosDe("l1");
  const ex = ejercicios[0].id;
  // Fallo honesto en la lección: queda pendiente de repaso.
  await responder(token, ex, { response: await wrongResponseFor(ex) });
  // Ahora, en el repaso (context 'review' LEGÍTIMO: el ejercicio SÍ está pendiente), acertamos.
  const r = await responder(token, ex, { response: await correctResponseFor(ex), context: "review" });
  assert.equal(r.body.correct, true);
  assert.equal(r.body.reviewCleared, true);
  assert.equal(r.body.xpAwarded, 5);
});

test("re-responder 'review' un ejercicio ya limpiado (no pendiente) se degrada a 'lesson'", async () => {
  const { token, id } = await registrar();
  const ejercicios = await ejerciciosDe("l1");
  const ex = ejercicios[0].id;
  await responder(token, ex, { response: await wrongResponseFor(ex) });                          // falla en lección
  await responder(token, ex, { response: await correctResponseFor(ex), context: "review" });     // limpia en repaso
  // Ya no está pendiente: un nuevo intento con 'review' debe registrarse como 'lesson'.
  await responder(token, ex, { response: await correctResponseFor(ex), context: "review" });
  const rows = await query(
    "SELECT context FROM answer_attempts WHERE user_id = ? AND exercise_id = ? ORDER BY id",
    [id, ex]
  );
  assert.deepEqual(rows.map((r) => r.context), ["lesson", "review", "lesson"]);
});
