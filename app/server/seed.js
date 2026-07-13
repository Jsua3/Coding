import "dotenv/config";
import { initDb, query, closeDb } from "./db.js";
import bd1 from "./seed-data/bd1.js";
import bd2 from "./seed-data/bd2.js";
import prog1 from "./seed-data/prog1.js";
import prog2 from "./seed-data/prog2.js";
import algo from "./seed-data/algo.js";
import web from "./seed-data/web.js";

export const COURSES = [bd1, bd2, prog1, prog2, algo, web];

export async function runSeed() {
  for (const c of COURSES) {
    await query(
      `INSERT INTO courses (id, subject, subject_tone, title, description, order_index, prereq_course_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE subject = VALUES(subject), subject_tone = VALUES(subject_tone),
         title = VALUES(title), description = VALUES(description),
         order_index = VALUES(order_index), prereq_course_id = VALUES(prereq_course_id)`,
      [c.id, c.subject, c.tone, c.title, c.description, c.order, c.prereq]
    );
    for (const [unitIndex, u] of c.units.entries()) {
      await query(
        `INSERT INTO units (id, course_id, name, order_index) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), order_index = VALUES(order_index)`,
        [u.id, c.id, u.name, unitIndex]
      );
      for (const [lessonIndex, l] of u.lessons.entries()) {
        await query(
          `INSERT INTO lessons (id, unit_id, title, mins, order_index, content) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title = VALUES(title), mins = VALUES(mins),
             order_index = VALUES(order_index), content = VALUES(content)`,
          [l.id, u.id, l.title, l.mins, lessonIndex, JSON.stringify(l.content)]
        );
        await query(
          `INSERT INTO quiz_questions (lesson_id, question, options, correct_index, explain_ok, explain_bad)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE question = VALUES(question), options = VALUES(options),
             correct_index = VALUES(correct_index), explain_ok = VALUES(explain_ok), explain_bad = VALUES(explain_bad)`,
          [l.id, l.quiz.question, JSON.stringify(l.quiz.options), l.quiz.correct, l.quiz.ok, l.quiz.bad]
        );
        await query(
          `INSERT INTO exercises (id, lesson_id, order_index, type, prompt, payload, answer, explain_ok, explain_bad)
           VALUES (?, ?, 0, 'choice', ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE lesson_id=VALUES(lesson_id), order_index=VALUES(order_index), type=VALUES(type),
             prompt=VALUES(prompt), payload=VALUES(payload), answer=VALUES(answer),
             explain_ok=VALUES(explain_ok), explain_bad=VALUES(explain_bad)`,
          [l.id + "-ex1", l.id, l.quiz.question, JSON.stringify({ options: l.quiz.options }), JSON.stringify({ index: l.quiz.correct }), l.quiz.ok, l.quiz.bad]
        );
        if (l.extra) {
          await query(
            `INSERT INTO exercises (id, lesson_id, order_index, type, prompt, payload, answer, explain_ok, explain_bad)
             VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE lesson_id=VALUES(lesson_id), order_index=VALUES(order_index), type=VALUES(type),
               prompt=VALUES(prompt), payload=VALUES(payload), answer=VALUES(answer),
               explain_ok=VALUES(explain_ok), explain_bad=VALUES(explain_bad)`,
            [l.id + "-ex2", l.id, l.extra.type, l.extra.prompt, JSON.stringify(l.extra.payload), JSON.stringify(l.extra.answer), l.extra.ok, l.extra.bad]
          );
        }
      }
    }
  }
}

if (process.argv[1] && process.argv[1].replaceAll("\\", "/").endsWith("server/seed.js")) {
  await initDb({ seed: false });
  await runSeed();
  console.log("Seed aplicado");
  await closeDb();
}
