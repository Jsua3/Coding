import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupTestDb, resetUserData, query, closeDb, correctResponseFor, wrongResponseFor } from "./helpers.js";
import { createApp } from "../server/index.js";

let app;
before(async () => { await setupTestDb(); app = createApp(); });
beforeEach(async () => { await resetUserData(); });
after(async () => { await closeDb(); });

async function registrar() {
  const r = await request(app).post("/api/auth/register").send({ name: "Leo Diaz", email: "leo@test.dev", password: "secreto1" });
  return r.body.token;
}

async function ejerciciosDe(lessonId) {
  return query("SELECT id FROM exercises WHERE lesson_id = ? ORDER BY order_index", [lessonId]);
}

async function responder(token, exerciseId, body) {
  return request(app).post("/api/exercises/" + exerciseId + "/answer").set("Authorization", "Bearer " + token).send(body);
}

test("una respuesta que no completa nada no desbloquea logros", async () => {
  const token = await registrar();
  const [ex1] = await ejerciciosDe("l1");
  const r = await responder(token, ex1.id, { response: await correctResponseFor(ex1.id) });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.achievementsUnlocked, []);
});

test("una respuesta INCORRECTA nunca desbloquea nada", async () => {
  const token = await registrar();
  const [ex1] = await ejerciciosDe("l1");
  const r = await responder(token, ex1.id, { response: await wrongResponseFor(ex1.id) });
  assert.equal(r.body.correct, false);
  assert.deepEqual(r.body.achievementsUnlocked, []);
});

test("completar la primera leccion desbloquea 'Primer paso' Y 'Sin un error' de golpe", async () => {
  const token = await registrar();
  const ejercicios = await ejerciciosDe("l1");
  // Todos correctos a la primera: la leccion queda perfecta.
  let ultima;
  for (const ex of ejercicios) {
    ultima = await responder(token, ex.id, { response: await correctResponseFor(ex.id) });
  }
  assert.equal(ultima.body.lessonCompleted, true);
  const ids = ultima.body.achievementsUnlocked.map((a) => a.id).sort();
  assert.deepEqual(ids, ["primera-leccion", "primera-perfecta"]);
  // Vienen con su nombre real, listos para el toast.
  const primer = ultima.body.achievementsUnlocked.find((a) => a.id === "primera-leccion");
  assert.equal(primer.name, "Primer paso");
  assert.ok(primer.description.length > 0);
});

test("fallar en la leccion la deja imperfecta: solo cae 'Primer paso'", async () => {
  const token = await registrar();
  const ejercicios = await ejerciciosDe("l1");
  // Fallamos el primero adrede, luego acertamos todo.
  await responder(token, ejercicios[0].id, { response: await wrongResponseFor(ejercicios[0].id) });
  let ultima;
  for (const ex of ejercicios) {
    ultima = await responder(token, ex.id, { response: await correctResponseFor(ex.id) });
  }
  assert.equal(ultima.body.lessonCompleted, true);
  assert.deepEqual(ultima.body.achievementsUnlocked.map((a) => a.id), ["primera-leccion"]);
});

test("un logro solo se anuncia UNA vez: rehacer la leccion no lo repite", async () => {
  const token = await registrar();
  const ejercicios = await ejerciciosDe("l1");
  for (const ex of ejercicios) {
    await responder(token, ex.id, { response: await correctResponseFor(ex.id) });
  }
  // Segunda pasada por la misma leccion, ya completada.
  const otra = await responder(token, ejercicios[0].id, { response: await correctResponseFor(ejercicios[0].id) });
  assert.deepEqual(otra.body.achievementsUnlocked, []);
});
