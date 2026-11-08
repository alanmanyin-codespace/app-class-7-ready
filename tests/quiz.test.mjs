import test from "node:test";
import assert from "node:assert/strict";
import { validateQuestionBank, sampleQuestions, scoreQuiz, passedOfficialStyleMock } from "../src/lib/quiz.ts";

const make = (id) => ({ id, prompt:`Prompt ${id}`, options:[{id:"a",text:"Correct"},{id:"b",text:"Wrong"}], answerId:"a", explanation:"Explains the answer", topic:"Test basics", sourceUrl:"https://www.alberta.ca/drivers-knowledge-test", sourceCheckedAt:"2026-11-08" });
const bank = Array.from({length:35},(_,i)=>make(`id-${i}`));

test("validated bank: catches duplicate IDs and wrong answer choices", () => {
 assert.deepEqual(validateQuestionBank(bank), []);
 assert.match(validateQuestionBank([...bank, make("id-0")]).join(" "),/Duplicate/);
 assert.match(validateQuestionBank([{...make("broken"),answerId:"nope"}]).join(" "),/Invalid/);
});

test("sampleQuestions returns unique, requested-length questions without mutating input", () => {
 const original=[...bank];
 const selection=sampleQuestions(bank,30,()=>0.3);
 assert.equal(selection.length,30);
 assert.equal(new Set(selection.map(q=>q.id)).size,30);
 assert.deepEqual(bank,original);
});

test("sampleQuestions rejects impossible counts and invalid random generators", () => {
 assert.throws(()=>sampleQuestions(bank,36),RangeError);
 assert.throws(()=>sampleQuestions(bank,0),RangeError);
 assert.throws(()=>sampleQuestions(bank,10,()=>1),RangeError);
});

test("scoring ignores unknown answer IDs and counts blanks as incorrect", () => {
 const selection=bank.slice(0,3);
 const s=scoreQuiz(selection,{"id-0":"a","id-1":"invalid"});
 assert.deepEqual({correct:s.correct,answered:s.answered,total:s.total,percent:s.percent,incorrectIds:s.incorrectIds},{correct:1,answered:1,total:3,percent:33,incorrectIds:["id-1","id-2"]});
});

test("official-style 30 question threshold: 24 fails, 25 passes", () => {
 const qs=bank.slice(0,30);
 const makeAnswers=(n)=>Object.fromEntries(qs.slice(0,n).map(q=>[q.id,"a"]));
 assert.equal(passedOfficialStyleMock(scoreQuiz(qs,makeAnswers(24))),false);
 assert.equal(passedOfficialStyleMock(scoreQuiz(qs,makeAnswers(25))),true);
 assert.equal(passedOfficialStyleMock(scoreQuiz(qs,makeAnswers(30))),true);
 assert.equal(passedOfficialStyleMock(scoreQuiz(bank.slice(0,10),makeAnswers(10))),false);
});

test("starter bank contains 10 valid, unique, source-linked original questions", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 assert.equal(starterQuestions.length, 10);
 assert.deepEqual(validateQuestionBank(starterQuestions), []);
 assert.equal(new Set(starterQuestions.map(q=>q.id)).size,10);
 for(const q of starterQuestions) {
  assert.ok(q.sourceUrl.startsWith("https://www.alberta.ca/"));
  assert.match(q.sourceCheckedAt,/^\d{4}-\d{2}-\d{2}$/);
 }
});
