import test from "node:test";
import assert from "node:assert/strict";
import { starterQuestions } from "../src/data/questions.ts";
import { sampleQuestions } from "../src/lib/quiz.ts";
import { parseSession, serializeSession } from "../src/lib/session.ts";

const mock = sampleQuestions(starterQuestions, 30, () => 0.42);
const base = () => ({
  mode: 30,
  instantFeedback: true,
  questionIds: mock.map((q) => q.id),
  index: 4,
  answers: { [mock[0].id]: mock[0].options[0].id, [mock[1].id]: mock[1].answerId },
  checked: { [mock[0].id]: true },
  flagged: { [mock[2].id]: true },
});

test("resume: a valid session round-trips with questions in the saved order", () => {
  const restored = parseSession(serializeSession(base()), starterQuestions);
  assert.ok(restored);
  assert.deepEqual(restored.questions.map((q) => q.id), base().questionIds);
  assert.equal(restored.index, 4);
  assert.equal(restored.mode, 30);
  assert.equal(restored.instantFeedback, true);
  assert.deepEqual(restored.answers, base().answers);
  assert.deepEqual(restored.checked, base().checked);
  assert.deepEqual(restored.flagged, base().flagged);
});

test("resume: malformed, stale or inconsistent records fall back to null", () => {
  const cases = [
    null,
    "not json",
    "[]",
    serializeSession({ ...base(), mode: 25 }),
    serializeSession({ ...base(), instantFeedback: "yes" }),
    serializeSession({ ...base(), questionIds: base().questionIds.slice(0, 29) }),
    serializeSession({ ...base(), questionIds: [...base().questionIds.slice(0, 29), "removed-question"] }),
    serializeSession({ ...base(), questionIds: [...base().questionIds.slice(0, 29), base().questionIds[0]] }),
    serializeSession({ ...base(), index: 30 }),
    serializeSession({ ...base(), index: 1.5 }),
    serializeSession({ ...base(), answers: null }),
    serializeSession({ ...base(), flagged: { x: "yes" } }),
  ];
  for (const raw of cases) assert.equal(parseSession(raw, starterQuestions), null, String(raw).slice(0, 60));
});

test("resume: drops invalid answer IDs and checks without an answer", () => {
  const s = base();
  s.answers[mock[3].id] = "not-an-option";
  s.checked[mock[5].id] = true; // checked but never answered
  s.flagged["outside-session"] = true;
  const restored = parseSession(serializeSession(s), starterQuestions);
  assert.ok(restored);
  assert.equal(mock[3].id in restored.answers, false);
  assert.equal(mock[5].id in restored.checked, false);
  assert.equal("outside-session" in restored.flagged, false);
});
