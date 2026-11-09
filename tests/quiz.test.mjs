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

const MINIMUM_QUESTION_COUNT = 54; // Raise toward 66 as verified content batches land.

test("expanded bank meets minimum count and validates every question dynamically", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 assert.ok(starterQuestions.length >= MINIMUM_QUESTION_COUNT, `Expected at least ${MINIMUM_QUESTION_COUNT} questions, got ${starterQuestions.length}`);
 assert.deepEqual(validateQuestionBank(starterQuestions), []);
 assert.equal(new Set(starterQuestions.map(q=>q.id)).size,starterQuestions.length);
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
 assert.ok(starterQuestions.length >= MINIMUM_QUESTION_COUNT);
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
  assert.ok(questionBank.questions.length >= MINIMUM_QUESTION_COUNT);
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

test("validated bank can draw 10/20/30 unique questions and rejects overdraw", async () => {
  const { starterQuestions } = await import("../src/data/questions.ts");
  for(const size of [10,20,30]){
    const drawn = sampleQuestions(starterQuestions,size,()=>0.4);
    assert.equal(drawn.length,size);
    assert.equal(new Set(drawn.map(q=>q.id)).size,size);
  }
  assert.throws(()=>sampleQuestions(starterQuestions,starterQuestions.length+1),RangeError);
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


test("road sign answer keys match safe meaning, not just an existing option ID", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 const expected = new Map([
  ["sign-01", /complete stop and proceed only when safe/i],
  ["sign-02", /yield the right of way to the pedestrians/i],
  ["sign-03", /traffic would be moving toward you/i],
  ["sign-04", /do not drive into that roadway opening/i],
  ["sign-05", /a warning sign/i],
  ["sign-06", /provide service information/i],
  ["sign-07", /guide route and destination decisions/i],
  ["sign-08", /follow the arrow's indicated direction/i],
 ]);
 const expectedPositions = new Map([["sign-01","a"],["sign-02","b"],["sign-03","c"],["sign-04","d"],["sign-05","b"],["sign-06","c"],["sign-07","d"],["sign-08","b"]]);
 const positions = new Set();
 for (const [id, meaning] of expected) {
  const q = starterQuestions.find((item) => item.id === id);
  assert.ok(q, `Missing ${id}`);
  const selected = q.options.find((option) => option.id === q.answerId);
  assert.ok(selected, `Invalid answer ID for ${id}`);
  assert.equal(q.answerId, expectedPositions.get(id), `Unexpected answer position for ${id}`);
  positions.add(q.answerId);
  assert.match(selected.text, meaning, `Unsafe or mismatched answer for ${id}`);
 }
 assert.equal(positions.size, 4, "Road sign answers should cover all four option positions");
});

test("eight original sign questions have valid answers and government guide provenance", async () => {
 const {starterQuestions,questionBank}=await import("../src/data/questions.ts");
 const signs=starterQuestions.filter(q=>q.id.startsWith("sign-"));
 assert.equal(signs.length,8);
 assert.deepEqual(signs.map(q=>q.id),Array.from({length:8},(_,i)=>`sign-${String(i+1).padStart(2,"0")}`));
 assert.deepEqual(validateVersionedQuestionBank(questionBank),[]);
 for(const q of signs){assert.equal(q.topic,"Road signs");assert.equal(q.sourceUrl,"https://open.alberta.ca/dataset/387f4e8a-6c0a-456a-ab31-995aadaf1f2b/resource/1edf5165-9c51-4da8-8206-7bf08bb9a76d/download/tran-drivers-guide-2023-04.pdf");assert.equal(q.sourceCheckedAt,"2026-11-08");assert.equal(q.options.length,4);assert.equal(q.options.filter(o=>o.id===q.answerId).length,1);}
});


test("results screen offers a route back to mode selection without submitting again", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /function chooseAnotherMode\(\)\s*\{[^}]*setSelected\(\[\]\)/);
 assert.match(source, /onClick=\{chooseAnotherMode\}>Choose another mode<\/button>/);
 assert.match(source, /function restart\(\)\s*\{\s*startQuiz\(mode\)/);
});


test("winter driving batch contains eight original, uniquely keyed, source-backed questions", async () => {
 const { starterQuestions, questionBank } = await import("../src/data/questions.ts");
 const winter = starterQuestions.filter(q => q.id.startsWith("winter-"));
 assert.equal(winter.length, 8);
 assert.deepEqual(winter.map(q => q.id), Array.from({length:8}, (_,i) => `winter-${String(i+1).padStart(2,"0")}`));
 assert.deepEqual(validateVersionedQuestionBank(questionBank), []);
 for (const q of winter) {
  assert.equal(q.topic, "Winter driving");
  assert.equal(q.sourceUrl, "https://www.alberta.ca/safer-winter-highways");
  assert.equal(q.sourceCheckedAt, "2026-11-09");
  assert.equal(q.options.length, 4);
  assert.equal(q.options.filter(o => o.id === q.answerId).length, 1);
 }
 assert.ok(starterQuestions.length >= 54);
});


test("quiz UI shows answered count and warns mock users about unanswered questions", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /const answeredCount = selected\.filter/);
 assert.match(source, /aria-live="polite"/);
 assert.match(source, /unanswered will count as incorrect/);
 assert.match(source, /answeredCount < selected\.length/);
});


test("winter driving answer keys match the source-backed safe actions", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 const expected = new Map([
  ["winter-01", ["b", /drive slower/i]],
  ["winter-02", ["b", /headlights on/i]],
  ["winter-03", ["b", /three times/i]],
  ["winter-04", ["a", /more slippery/i]],
  ["winter-05", ["a", /clear windows/i]],
  ["winter-06", ["c", /avoid cruise control/i]],
  ["winter-07", ["a", /avoid unnecessary/i]],
  ["winter-08", ["a", /inspect tires/i]],
 ]);
 for (const [id, [answerId, answerText]] of expected) {
  const q = starterQuestions.find(item => item.id === id);
  assert.ok(q, `Missing ${id}`);
  assert.equal(q.answerId, answerId, `Incorrect answer key: ${id}`);
  assert.match(q.options.find(option => option.id === q.answerId)?.text ?? "", answerText, `Unsafe correct option: ${id}`);
 }
});


test("eight distracted-driving questions have source provenance and semantically correct answer keys", async () => {
 const { starterQuestions, questionBank } = await import("../src/data/questions.ts");
 const questions = starterQuestions.filter(q => q.id.startsWith("distraction-"));
 assert.equal(questions.length, 8);
 assert.deepEqual(validateVersionedQuestionBank(questionBank), []);
 const expected = [
  ["a", /safely parked/i],
  ["b", /before driving/i],
  ["c", /voicemail/i],
  ["d", /hands-free call/i],
  ["a", /safe place to park/i],
  ["b", /police may charge/i],
  ["c", /before departure/i],
  ["d", /9-1-1/i],
 ];
 for (const [index, q] of questions.entries()) {
  assert.equal(q.id, `distraction-${String(index + 1).padStart(2, "0")}`);
  assert.equal(q.topic, "Distracted driving");
  assert.equal(q.sourceUrl, "https://www.alberta.ca/distracted-driving");
  assert.equal(q.sourceCheckedAt, "2026-11-09");
  assert.equal(q.options.length, 4);
  assert.equal(q.answerId, expected[index][0]);
  assert.match(q.options.find(o => o.id === q.answerId)?.text ?? "", expected[index][1]);
 }
 assert.ok(starterQuestions.length >= 54);
 for (const count of [10, 20, 30]) {
  const draw = sampleQuestions(starterQuestions, count, () => 0.42);
  assert.equal(new Set(draw.map(q => q.id)).size, count);
 }
});


test("mock exam offers accessible review of unanswered questions before submission", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /function reviewUnanswered\(\)/);
 assert.match(source, /selected\.findIndex\(\(question\) => !question\.options\.some/);
 assert.match(source, /if \(firstUnanswered !== -1\) setIndex\(firstUnanswered\)/);
 assert.match(source, /mode === 30 && answeredCount < selected\.length && <button/);
 assert.match(source, /onClick=\{reviewUnanswered\}>Review unanswered/);
});


test("school and playground zone answer keys retain their intended safe meanings", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 const expected = new Map([
  ["zones-01", ["b", /30 km\/h/i]],
  ["zones-02", ["b", /8:45 a\.m\./i]],
  ["zones-03", ["a", /restriction is in effect/i]],
  ["zones-04", ["a", /school area calling for caution/i]],
  ["zones-05", ["b", /8:30 a\.m\./i]],
  ["zones-06", ["c", /passing or attempting to pass is prohibited/i]],
  ["zones-07", ["a", /higher maximum-speed sign/i]],
  ["zones-08", ["b", /beneath the school sign/i]],
 ]);
 const zoneQuestions = starterQuestions.filter(q => q.id.startsWith("zones-"));
 assert.equal(zoneQuestions.length, expected.size);
 for (const [id, [answerId, meaning]] of expected) {
  const q = zoneQuestions.find(item => item.id === id);
  assert.ok(q, `Missing ${id}`);
  assert.equal(q.answerId, answerId, `Answer key changed for ${id}`);
  assert.match(q.options.find(option => option.id === q.answerId)?.text ?? "", meaning, `Answer meaning changed for ${id}`);
  assert.equal(q.sourceUrl, "https://www.alberta.ca/school-and-playground-zones");
 }
});
