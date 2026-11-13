import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");

test("practice feedback defaults on, while mock mode disables the switch", () => {
  assert.match(source, /const \[instantFeedback, setInstantFeedback\] = useState\(true\)/);
  assert.match(source, /type="checkbox" role="switch" checked=\{mode === 30 \? false : instantFeedback\} disabled=\{mode === 30\}/);
  assert.match(source, /Show answers as I go/);
});

test("exam mode: checking an answer reveals feedback and locks the choice", () => {
  assert.match(source, /function checkAnswer\(\) \{ if \(mode === 30 \|\| !current \|\| !answers\[current\.id\]\) return;/);
  assert.match(source, /const needsCheck = !!current && mode !== 30 && instantFeedback && !!answers\[current\.id\] && !checked\[current\.id\]/);
  assert.match(source, /const locked = !!current && mode !== 30 && instantFeedback && !!checked\[current\.id\]/);
  assert.match(source, /onClick=\{checkAnswer\}>Check answer<\/button>/);
  assert.match(source, /disabled=\{locked\}/);
  assert.match(source, /\{locked && <div className=\{`answer-feedback/);
});

test("exam mode: without instant feedback nothing is revealed before submission", () => {
  // Feedback, verdicts and locked styling all depend on `locked`, which requires instantFeedback.
  assert.doesNotMatch(source, /\{checked\[current\.id\] && <div className=\{`answer-feedback/);
  assert.match(source, /if \(mode !== 30 && instantFeedback && checked\[q\.id\]\) return answers\[q\.id\] === q\.answerId \? "correct" : "incorrect"/);
});

test("exam mode: question map jumps, marks the current question and flags", () => {
  assert.match(source, /aria-current=\{i === index && !reviewing \? "step" : undefined\}/);
  assert.match(source, /flagged for review/);
  assert.match(source, /aria-pressed=\{!!flagged\[current\.id\]\} onClick=\{toggleFlag\}/);
});

test("exam mode: mock submits through an in-page review that skips the browser confirm", () => {
  assert.match(source, /onClick=\{\(\) => setReviewing\(true\)\}>\{mode === 30 \? "Review and submit" : "Review questions"\}/);
  assert.match(source, /disabled=\{mode !== 30 && answeredCount < selected\.length\} onClick=\{\(\) => finishQuiz\(true\)\}>\{mode === 30 \? "Submit mock exam ↗" : "Finish practice ↗"\}/);
  assert.match(source, /if \(!confirmed && mode === 30 && answeredCount < selected\.length && !window\.confirm/);
  assert.match(source, /Review before you submit/);
});

test("exam mode: sessions are saved while in progress and cleared on submit or exit", () => {
  assert.match(source, /if \(selected\.length > 0 && !isFinished\) saveSession\(/);
  assert.match(source, /const saved = saveCompletedAttempt\(result\);\s*clearSession\(\);/);
  assert.match(source, /function chooseAnotherMode\(\) \{.*clearSession\(\); \}$/m);
});

test("practice mode allows skipping unanswered questions without revealing answers", () => {
  // An unanswered question can be revisited via the question map or review flow.
  assert.match(source, /\{index < selected\.length - 1 && <button/);
  assert.doesNotMatch(source, /!needsCheck && index < selected\.length - 1 && <button/);
  assert.match(source, /onClick=\{\(\)=>setIndex\(\(i\)=>i\+1\)\}>Next question/);
  assert.doesNotMatch(source, /disabled=\{mode !== 30 && !answers\[current\.id\]\}>Next question/);
  // Checking a selected answer remains explicit when instant feedback is enabled.
  assert.match(source, /\{needsCheck && <button[^>]*onClick=\{checkAnswer\}>Check answer/);
});


test("practice review is accessible before completion while finish stays guarded", () => {
  assert.match(source, /<button className="btn btn-outline" type="button" onClick=\{\(\) => setReviewing\(true\)\}/);
  assert.doesNotMatch(source, /!needsCheck && <button className="btn btn-outline" type="button" onClick=\{\(\) => setReviewing\(true\)\}/);
  // A selected but unchecked practice answer must not block review navigation.
  assert.match(source, /mode !== 30 && answeredCount === selected.length && <button/);
  assert.match(source, /if \(mode !== 30 && answeredCount < selected.length\) return;/);
  assert.match(source, /disabled=\{mode !== 30 && answeredCount < selected.length\}/);
});
