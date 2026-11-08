import test from "node:test";
import assert from "node:assert/strict";
import { sampleQuestions, scoreQuiz, passedOfficialStyleMock, validateQuestionBank } from "../src/lib/quiz.ts";

const question = (id) => ({
  id, prompt: `Original prompt ${id}`,
  options: [{ id: "a", text: "Correct" }, { id: "b", text: "Incorrect" }],
  answerId: "a", explanation: "Explanation", topic: "Test basics",
  sourceUrl: "https://www.alberta.ca/drivers-knowledge-test",
  sourceCheckedAt: "2026-11-08",
});
const bank = Array.from({ length: 35 }, (_, i) => question(`q-${i}`));
const answersFor = (items, correctCount) => Object.fromEntries(
  items.map((item, index) => [item.id, index < correctCount ? "a" : "b"]),
);

test("RR7-M1-04: deterministic 10/20/30 sampling returns unique IDs", () => {
  for (const count of [10, 20, 30]) {
    const chosen = sampleQuestions(bank, count, () => 0.25);
    assert.equal(chosen.length, count);
    assert.equal(new Set(chosen.map((q) => q.id)).size, count);
    assert.deepEqual(sampleQuestions(bank, count, () => 0.25).map(q => q.id), chosen.map(q => q.id));
  }
});

test("RR7-M1-04: selection never mutates the source bank", () => {
  const before = structuredClone(bank);
  sampleQuestions(bank, 30, () => 0.5);
  assert.deepEqual(bank, before);
});

test("RR7-M1-04: insufficient bank fails closed for each mode", () => {
  for (const count of [10, 20, 30]) {
    assert.throws(() => sampleQuestions(bank.slice(0, count - 1), count), RangeError);
  }
  assert.throws(() => sampleQuestions([], 10), RangeError);
});

test("RR7-M1-04: invalid requested counts and RNG values are rejected", () => {
  for (const count of [0, -1, 1.5, Number.NaN, 36]) {
    assert.throws(() => sampleQuestions(bank, count), RangeError);
  }
  for (const value of [-0.01, 1, Number.NaN, Infinity]) {
    assert.throws(() => sampleQuestions(bank, 10, () => value), RangeError);
  }
});

test("RR7-M1-04: practice mode scores correct, wrong, skipped and unknown choices", () => {
  const qs = bank.slice(0, 10);
  const score = scoreQuiz(qs, { "q-0": "a", "q-1": "b", "q-2": "not-an-option" });
  assert.equal(score.total, 10);
  assert.equal(score.correct, 1);
  assert.equal(score.answered, 2);
  assert.equal(score.percent, 10);
  assert.deepEqual(score.incorrectIds, qs.slice(1).map(q => q.id));
  assert.equal(passedOfficialStyleMock(score), false);
});

test("RR7-M1-04: 20-question practice score uses 20 as denominator", () => {
  const qs = bank.slice(0, 20);
  const score = scoreQuiz(qs, answersFor(qs, 13));
  assert.deepEqual({ total: score.total, correct: score.correct, answered: score.answered, percent: score.percent },
    { total: 20, correct: 13, answered: 20, percent: 65 });
  assert.equal(passedOfficialStyleMock(score), false);
});

test("RR7-M1-04: mock boundary 24 fail, 25 pass, 30 pass", () => {
  const qs = bank.slice(0, 30);
  for (const [correct, expected] of [[24, false], [25, true], [30, true]]) {
    const score = scoreQuiz(qs, answersFor(qs, correct));
    assert.equal(score.correct, correct);
    assert.equal(passedOfficialStyleMock(score), expected);
  }
});

test("RR7-M1-04: skipped mock answers are incorrect, not counted as answered", () => {
  const qs = bank.slice(0, 30);
  const score = scoreQuiz(qs, Object.fromEntries(qs.slice(0, 25).map(q => [q.id, "a"])));
  assert.equal(score.correct, 25);
  assert.equal(score.answered, 25);
  assert.equal(score.incorrectIds.length, 5);
  assert.equal(passedOfficialStyleMock(score), true);
});

test("RR7-M1-04: zero-answer score and empty selection are safe", () => {
  const zero = scoreQuiz([], {});
  assert.deepEqual(zero, { total: 0, correct: 0, answered: 0, percent: 0, incorrectIds: [] });
  assert.equal(passedOfficialStyleMock(zero), false);
  const unanswered = scoreQuiz(bank.slice(0, 10), {});
  assert.equal(unanswered.percent, 0);
  assert.equal(unanswered.incorrectIds.length, 10);
});

test("RR7-M1-04: malformed and duplicate bank data cannot be sampled", () => {
  const invalid = [...bank.slice(0, 10), question("q-0")];
  assert.match(validateQuestionBank(invalid).join(" "), /Duplicate/);
  assert.throws(() => sampleQuestions(invalid, 10), /Invalid question bank/);
  assert.throws(() => sampleQuestions([{ ...question("bad"), answerId: "missing" }], 1), /Invalid question bank/);
});

test("RR7-M1-04: retake can select and score again without modifying earlier result", () => {
  const first = sampleQuestions(bank, 10, () => 0);
  const score1 = scoreQuiz(first, answersFor(first, 3));
  const second = sampleQuestions(bank, 10, () => 0.9);
  const score2 = scoreQuiz(second, answersFor(second, 8));
  assert.equal(score1.correct, 3);
  assert.equal(score2.correct, 8);
  assert.equal(score1.correct, 3);
});
