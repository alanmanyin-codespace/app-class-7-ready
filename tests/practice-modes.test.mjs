import test from "node:test";
import assert from "node:assert/strict";
import { starterQuestions } from "../src/data/questions.ts";
import { sampleQuestions, validateQuestionBank } from "../src/lib/quiz.ts";

test("UX-02: live validated bank supports both 10 and 20 question sessions", () => {
  assert.deepEqual(validateQuestionBank(starterQuestions), []);
  for (const count of [10, 20]) {
    const selected = sampleQuestions(starterQuestions, count, () => 0.37);
    assert.equal(selected.length, count);
    assert.equal(new Set(selected.map(q => q.id)).size, count);
    assert.ok(selected.every(q => starterQuestions.includes(q)));
  }
});

test("UX-02: selection varies with random source and never changes original bank", () => {
  const ids = starterQuestions.map(q => q.id);
  const a = sampleQuestions(starterQuestions, 20, () => 0);
  const b = sampleQuestions(starterQuestions, 20, () => 0.99);
  assert.notDeepEqual(a.map(q => q.id), b.map(q => q.id));
  assert.deepEqual(starterQuestions.map(q => q.id), ids);
});

test("UX-02: insufficient or malformed bank fails closed", () => {
  assert.throws(() => sampleQuestions(starterQuestions.slice(0, 10), 20), RangeError);
  assert.throws(() => sampleQuestions([{ ...starterQuestions[0], answerId: "invalid" }, ...starterQuestions.slice(1)], 10), /Invalid question bank/);
});
