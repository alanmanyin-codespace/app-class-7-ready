import test from "node:test";
import assert from "node:assert/strict";
import { validateQuestionBank, validateVersionedQuestionBank, QUESTION_SCHEMA_VERSION, sampleQuestions, scoreQuiz, passedOfficialStyleMock } from "../src/lib/quiz.ts";

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

test("expanded bank contains 38 valid, unique, source-linked original questions", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 assert.equal(starterQuestions.length, 38);
 assert.deepEqual(validateQuestionBank(starterQuestions), []);
 assert.equal(new Set(starterQuestions.map(q=>q.id)).size,38);
 for(const q of starterQuestions) {
  assert.ok(/^https:\/\/(?:www|open)\.alberta\.ca\//.test(q.sourceUrl), `Unexpected source domain for ${q.id}`);
  assert.match(q.sourceCheckedAt,/^\d{4}-\d{2}-\d{2}$/);
 }
});

test("intro-08 describes eight demerit points as an allowance BEFORE suspension, not suspension at eight", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 const q = starterQuestions.find((item) => item.id === "intro-08");
 assert.ok(q, "intro-08 must exist");
 assert.equal(q.answerId, "c");
 assert.equal(q.options.find((option) => option.id === q.answerId)?.text, "8");
 assert.match(q.prompt, /allowed before licence suspension/i);
 assert.match(q.explanation, /eight demerit points before suspension/i);
 assert.doesNotMatch(q.explanation, /suspend(?:ed|s|ing)? at (?:exactly )?eight/i);
 assert.equal(q.sourceUrl, "https://www.alberta.ca/class-7-learners-licence");
});

test("intro-05/06/07 preserve source-backed supervisor, alcohol and occupant rules", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 const find = (id) => {
   const item = starterQuestions.find((q) => q.id === id);
   assert.ok(item, `Missing ${id}`);
   return item;
 };
 const supervisor = find("intro-05");
 assert.equal(supervisor.answerId, "b");
 const supervisorAnswer = supervisor.options.find((o) => o.id === supervisor.answerId)?.text ?? "";
 assert.match(supervisorAnswer, /over 18/i);
 assert.match(supervisorAnswer, /full Class 5 licence or higher/i);
 assert.match(supervisorAnswer, /front passenger seat/i);
 const alcohol = find("intro-06");
 assert.equal(alcohol.answerId, "a");
 assert.match(alcohol.prompt, /must a learner maintain/i);
 assert.match(alcohol.explanation, /zero \(0%\) alcohol/i);
 const occupants = find("intro-07");
 assert.equal(occupants.answerId, "b");
 assert.match(occupants.prompt, /including the driver/i);
 assert.match(occupants.explanation, /including the driver/i);
 assert.match(occupants.options.find((o) => o.id === occupants.answerId)?.text ?? "", /available seat belts/i);
 for(const question of [supervisor, alcohol, occupants]) {
   assert.equal(question.sourceUrl, "https://www.alberta.ca/class-7-learners-licence");
 }
});


test("versioned starter bank loads safely and preserves practice data", async () => {
 const { questionBank, starterQuestions } = await import("../src/data/questions.ts");
 assert.equal(questionBank.schemaVersion, QUESTION_SCHEMA_VERSION);
 assert.equal(questionBank.questions, starterQuestions);
 assert.deepEqual(validateVersionedQuestionBank(questionBank), []);
 assert.equal(starterQuestions.length, 38);
});

test("versioned bank fails closed for malformed envelopes and question data", () => {
 assert.match(validateVersionedQuestionBank(null).join(" "), /object/i);
 assert.match(validateVersionedQuestionBank({schemaVersion: 999, questions: bank}).join(" "), /schemaVersion/);
 assert.match(validateVersionedQuestionBank({schemaVersion: QUESTION_SCHEMA_VERSION, questions: null}).join(" "), /array/);
 assert.match(validateVersionedQuestionBank({schemaVersion: QUESTION_SCHEMA_VERSION, questions: [make("duplicate"), make("duplicate")]}).join(" "), /Duplicate/);
 assert.match(validateVersionedQuestionBank({schemaVersion: QUESTION_SCHEMA_VERSION, questions: [{...make("broken"), answerId: "missing"}]}).join(" "), /Invalid options\/answer/);
});


test("school and playground zone batch retains source, unique IDs, and valid answers", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 const zones = starterQuestions.filter((q) => q.id.startsWith("zones-"));
 assert.equal(zones.length, 8);
 assert.deepEqual(zones.map((q) => q.id), Array.from({length: 8}, (_, i) => `zones-${String(i + 1).padStart(2, "0")}`));
 assert.deepEqual(validateQuestionBank(zones), []);
 for (const q of zones) {
  assert.equal(q.topic, "School and playground zones");
  assert.equal(q.sourceUrl, "https://www.alberta.ca/school-and-playground-zones");
  assert.equal(q.sourceCheckedAt, "2026-11-08");
  assert.equal(q.options.filter((o) => o.id === q.answerId).length, 1);
 }
});

test("intersection, pedestrian and roundabout batch contains 12 unique, provenance-linked questions", async () => {
  const { starterQuestions, questionBank } = await import("../src/data/questions.ts");
  const ids = [
    ...Array.from({length:8}, (_, i) => `junction-${String(i+1).padStart(2,"0")}`),
    "pedestrian-01",
    ...Array.from({length:3}, (_, i) => `roundabout-${String(i+1).padStart(2,"0")}`),
  ];
  const additions = starterQuestions.filter(q => ids.includes(q.id));
  assert.equal(questionBank.questions.length, 38);
  assert.equal(additions.length, 12);
  assert.equal(new Set(additions.map(q => q.id)).size, 12);
  assert.deepEqual(validateVersionedQuestionBank(questionBank), []);
  assert.deepEqual(validateQuestionBank(additions), []);
  const sources = new Map([
    ["junction-", ["Intersections and right of way", "https://www.alberta.ca/intersection-rules"]],
    ["pedestrian-", ["Pedestrian safety", "https://www.alberta.ca/pedestrian-safety"]],
    ["roundabout-", ["Roundabouts", "https://www.alberta.ca/roundabouts"]],
  ]);
  for (const q of additions) {
    const expected = [...sources].find(([prefix])=>q.id.startsWith(prefix))?.[1];
    assert.ok(expected, `Unexpected id: ${q.id}`);
    assert.equal(q.topic, expected[0]);
    assert.equal(q.sourceUrl, expected[1]);
    assert.equal(q.sourceCheckedAt, "2026-11-08");
    assert.equal(q.options.length, 4);
    assert.equal(q.options.filter(o=>o.id===q.answerId).length, 1);
  }
});

test("new bank can draw 10/20/30 unique questions and fails closed for 39", async () => {
  const { starterQuestions } = await import("../src/data/questions.ts");
  for(const size of [10,20,30]){
    const drawn = sampleQuestions(starterQuestions,size,()=>0.4);
    assert.equal(drawn.length,size);
    assert.equal(new Set(drawn.map(q=>q.id)).size,size);
  }
  assert.throws(()=>sampleQuestions(starterQuestions,39),RangeError);
});

test("30-question mock scores 24, 25 and 30 correctly, including skipped and invalid answers", () => {
 const qs=bank.slice(0,30);
 const answersFor=(n)=>Object.fromEntries(qs.slice(0,n).map(q=>[q.id,"a"]));
 for (const [correct,passes] of [[24,false],[25,true],[30,true]]) {
  const result=scoreQuiz(qs,answersFor(correct));
  assert.equal(result.total,30);
  assert.equal(result.correct,correct);
  assert.equal(result.answered,correct);
  assert.equal(passedOfficialStyleMock(result),passes);
 }
 const incomplete=scoreQuiz(qs,{...answersFor(24),"id-24":"invalid"});
 assert.equal(incomplete.answered,24);
 assert.equal(incomplete.incorrectIds.length,6);
 assert.equal(passedOfficialStyleMock(incomplete),false);
});

test("mock exam UI offers a real 30-question option, explicit submission and pass/fail feedback", async () => {
 const { readFile }=await import("node:fs/promises");
 const source=await readFile(new URL("../src/components/practice-quiz.tsx",import.meta.url),"utf8");
 assert.match(source,/30-question mock exam \(25 correct to pass\)/);
 assert.match(source,/sampleQuestions\(questions, count\)/);
 assert.match(source,/Submit mock exam/);
 assert.match(source,/passedOfficialStyleMock\(score\)/);
 assert.match(source,/mode !== 30 && !answers\[current.id\]/);
});


test("eight original sign questions have valid answers and government guide provenance", async () => {
 const {starterQuestions,questionBank}=await import("../src/data/questions.ts");
 const signs=starterQuestions.filter(q=>q.id.startsWith("sign-"));
 assert.equal(signs.length,8);
 assert.deepEqual(signs.map(q=>q.id),Array.from({length:8},(_,i)=>`sign-${String(i+1).padStart(2,"0")}`));
 assert.deepEqual(validateVersionedQuestionBank(questionBank),[]);
 for(const q of signs){assert.equal(q.topic,"Road signs");assert.equal(q.sourceUrl,"https://open.alberta.ca/dataset/387f4e8a-6c0a-456a-ab31-995aadaf1f2b/resource/1edf5165-9c51-4da8-8206-7bf08bb9a76d/download/tran-drivers-guide-2023-04.pdf");assert.equal(q.sourceCheckedAt,"2026-11-08");assert.equal(q.options.length,4);assert.equal(q.options.filter(o=>o.id===q.answerId).length,1);}
});
