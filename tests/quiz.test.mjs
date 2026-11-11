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

test("practice and mock modes sample unique questions without changing the bank", () => {
 const snapshot = bank.map(q => q.id);
 for (const count of [10, 20, 30]) {
  const first = sampleQuestions(bank, count, () => 0);
  const second = sampleQuestions(bank, count, () => 0.999);
  assert.equal(first.length, count);
  assert.equal(second.length, count);
  assert.equal(new Set(first.map(q => q.id)).size, count);
  assert.equal(new Set(second.map(q => q.id)).size, count);
  assert.ok(first.every(q => bank.includes(q)));
  assert.ok(second.every(q => bank.includes(q)));
  assert.notDeepEqual(first.map(q => q.id), second.map(q => q.id), `Mode ${count} should permit different initial selections`);
 }
 assert.deepEqual(bank.map(q => q.id), snapshot);
 assert.throws(() => sampleQuestions(bank.slice(0, 19), 20), RangeError);
 assert.throws(() => sampleQuestions(bank.slice(0, 29), 30), RangeError);
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

const MINIMUM_QUESTION_COUNT = 74; // All additions require current official source evidence.

test("expanded bank meets minimum count and validates every question dynamically", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 assert.ok(starterQuestions.length >= MINIMUM_QUESTION_COUNT, `Expected at least ${MINIMUM_QUESTION_COUNT} questions, got ${starterQuestions.length}`);
 assert.deepEqual(validateQuestionBank(starterQuestions), []);
 assert.equal(new Set(starterQuestions.map(q=>q.id)).size,starterQuestions.length);
 for(const q of starterQuestions) {
  assert.ok(/^https:\/\/(?:www|open)\.alberta\.ca\//.test(q.sourceUrl), `Unexpected source domain for ${q.id}`);
  assert.match(q.sourceCheckedAt,/^\d{4}-\d{2}-\d{2}$/);
  const checked = new Date(`${q.sourceCheckedAt}T00:00:00Z`);
  assert.ok(Number.isFinite(checked.getTime()) && checked.toISOString().slice(0, 10) === q.sourceCheckedAt, `Invalid source-check date for ${q.id}`);
  assert.ok(checked.getTime() <= Date.now(), `Future source-check date for ${q.id}`);
 }
});

test("all original questions have distinct prompts and unambiguous answer options", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 const normalize = (value) => value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
 const seenPrompts = new Map();
 for (const q of starterQuestions) {
  const prompt = normalize(q.prompt);
  assert.ok(prompt.length >= 20, `Question ${q.id} has an unusually short prompt`);
  assert.ok(!seenPrompts.has(prompt), `Duplicate prompt: ${q.id} and ${seenPrompts.get(prompt)}`);
  seenPrompts.set(prompt, q.id);
  const choices = q.options.map((option) => normalize(option.text));
  assert.equal(new Set(choices).size, choices.length, `Duplicate answer choices in ${q.id}`);
  assert.ok(choices.every(Boolean), `Empty answer choice in ${q.id}`);
  assert.ok(normalize(q.explanation).length >= 20, `Missing meaningful explanation for ${q.id}`);
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
 const winter = starterQuestions.filter(q => /^winter-0[1-8]$/.test(q.id));
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
 assert.match(source, /Array\.from\(\{ length: selected\.length - 1 \}/);
 assert.match(source, /\(index \+ offset \+ 1\) % selected\.length/);
 assert.match(source, /if \(nextUnanswered !== undefined\) setIndex\(nextUnanswered\)/);
 assert.match(source, /answeredCount < selected\.length && <button/);
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


test("intersection, pedestrian and roundabout answer keys retain their intended safe meanings", async () => {
  const { starterQuestions } = await import("../src/data/questions.ts");
  const expected = new Map([
    ["junction-01", ["b", /stop completely, then yield/i, "https://www.alberta.ca/intersection-rules"]],
    ["junction-02", ["b", /yield to the oncoming car and the pedestrian/i, "https://www.alberta.ca/intersection-rules"]],
    ["junction-03", ["c", /do not enter the intersection/i, "https://www.alberta.ca/intersection-rules"]],
    ["junction-04", ["c", /clear the intersection/i, "https://www.alberta.ca/intersection-rules"]],
    ["junction-05", ["d", /stop sign/i, "https://www.alberta.ca/intersection-rules"]],
    ["junction-06", ["a", /yield sign/i, "https://www.alberta.ca/intersection-rules"]],
    ["junction-07", ["b", /indicated turn has the right of way/i, "https://www.alberta.ca/intersection-rules"]],
    ["junction-08", ["a", /stop and yield/i, "https://www.alberta.ca/intersection-rules"]],
    ["pedestrian-01", ["b", /stop and yield to the pedestrian/i, "https://www.alberta.ca/pedestrian-safety"]],
    ["roundabout-01", ["c", /already circulating/i, "https://www.alberta.ca/roundabouts"]],
    ["roundabout-02", ["d", /changing lanes within the roundabout/i, "https://www.alberta.ca/roundabouts"]],
    ["roundabout-03", ["a", /signal a right turn/i, "https://www.alberta.ca/roundabouts"]],
  ]);
  for (const [id, [answerId, meaning, sourceUrl]] of expected) {
    const q = starterQuestions.find(item => item.id === id);
    assert.ok(q, `Missing question ${id}`);
    assert.equal(q.answerId, answerId, `Answer key changed: ${id}`);
    assert.match(q.options.find(option => option.id === q.answerId)?.text ?? "", meaning, `Answer meaning changed: ${id}`);
    assert.equal(q.sourceUrl, sourceUrl);
  }
});


test("each quiz answer radio group announces the current question and provides option values", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /<legend className="sr-only">Question \{index \+ 1\} of \{selected\.length\}: \{current\.prompt\}\. Select one answer\.<\/legend>/);
 assert.match(source, /name=\{\x60question-\$\{current\.id\}\x60\} value=\{opt\.id\}/);
});


test("six new pedestrian-safety scenarios have verified provenance and safe answer meanings", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 const expected = [
  ["pedestrian-02","a",/stop and yield until/i],
  ["pedestrian-03","c",/unmarked crosswalk and yield/i],
  ["pedestrian-04","b",/allow enough time/i],
  ["pedestrian-05","d",/especially alert/i],
  ["pedestrian-06","a",/intention to cross/i],
  ["pedestrian-07","b",/yield to vehicles outside a crosswalk/i],
 ];
 assert.ok(starterQuestions.length >= 60);
 for (const [id, answerId, meaning] of expected) {
  const q = starterQuestions.find(item => item.id === id);
  assert.ok(q, `Missing ${id}`);
  assert.equal(q.topic, "Pedestrian safety");
  assert.equal(q.answerId, answerId);
  assert.match(q.options.find(o => o.id === q.answerId)?.text ?? "", meaning);
  assert.equal(q.sourceUrl, "https://www.alberta.ca/pedestrian-safety");
  assert.equal(q.sourceCheckedAt, "2026-11-09");
 }
 assert.equal(new Set(starterQuestions.map(q => q.id)).size, starterQuestions.length);
});


test("incomplete mock submission asks for confirmation before scoring", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /mode === 30 && answeredCount < selected\.length && !window\.confirm/);
 assert.match(source, /Unanswered questions count as incorrect/);
 assert.match(source, /\) return;\s*const result = scoreQuiz\(selected, answers\)/);
});

test("six roadside worker safety questions have verified Alberta provenance and safe answer keys", async () => {
 const { starterQuestions, questionBank } = await import("../src/data/questions.ts");
 const expected = [
  ["roadside-01", "b", /move into the farther lane/i],
  ["roadside-02", "c", /60 km\/h or less/i],
  ["roadside-03", "a", /50 km\/h/i],
  ["roadside-04", "d", /obey the flag person's directions/i],
  ["roadside-05", "b", /stay focused on driving/i],
  ["roadside-06", "c", /including stopped roadside vehicles in construction zones/i],
 ];
 assert.ok(starterQuestions.length >= 72);
 assert.deepEqual(validateVersionedQuestionBank(questionBank), []);
 assert.equal(new Set(starterQuestions.map(q => q.id)).size, starterQuestions.length);
 for (const [id, answerId, meaning] of expected) {
  const q = starterQuestions.find(item => item.id === id);
  assert.ok(q, `Missing ${id}`);
  assert.equal(q.topic, "Roadside worker safety");
  assert.equal(q.answerId, answerId);
  assert.match(q.options.find(o => o.id === q.answerId)?.text ?? "", meaning);
  assert.equal(q.sourceUrl, "https://www.alberta.ca/roadside-worker-safety");
  assert.equal(q.sourceCheckedAt, "2026-11-09");
 }
});


test("all practice modes can jump to unanswered questions and require valid answers before finishing", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /answeredCount < selected\.length && <button/);
 assert.match(source, /mode !== 30 && answeredCount !== selected\.length/);
 assert.match(source, /function reviewUnanswered\(\)/);
});


test("question changes move keyboard focus to the current heading without adding it to tab order", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /useRef<HTMLHeadingElement>\(null\)/);
 assert.match(source, /if \(selected\.length > 0 && !isFinished\) questionHeadingRef\.current\?\.focus\(\)/);
 assert.match(source, /\[index, selected, isFinished\]/);
 assert.match(source, /<h2 className="quiz-question" ref=\{questionHeadingRef\} tabIndex=\{-1\}>\{current\.prompt\}<\/h2>/);
});

// The navigation skips the current blank question and wraps around the session.
test("review unanswered navigation advances and wraps instead of selecting current blank", () => {
 const unanswered = [true, false, true, false];
 const findNext = (current) => Array.from({length: unanswered.length - 1}, (_, offset) => (current + offset + 1) % unanswered.length).find(i => unanswered[i]);
 assert.equal(findNext(0), 2);
 assert.equal(findNext(2), 0);
 assert.equal(findNext(1), 2);
 assert.equal(findNext(3), 0);
});


test("review unanswered retains keyboard focus when only the current question is blank", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /if \(nextUnanswered !== undefined\) setIndex\(nextUnanswered\);\s*else questionHeadingRef\.current\?\.focus\(\)/);
});

test("road sign questions retain independently checked meanings and official guide provenance", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 // Rechecked 2026-11-09 against Alberta's current driver-guide index and traffic-sign catalogue.
 // https://www.alberta.ca/driver-guides-overview-and-pdf-versions
 // https://www.alberta.ca/traffic-sign-catalogue
 const guide = "https://open.alberta.ca/dataset/387f4e8a-6c0a-456a-ab31-995aadaf1f2b/resource/1edf5165-9c51-4da8-8206-7bf08bb9a76d/download/tran-drivers-guide-2023-04.pdf";
 const expected = new Map([
  ["sign-01", ["a", /complete stop and proceed only when safe/i]],
  ["sign-02", ["b", /yield the right of way to the pedestrians/i]],
  ["sign-03", ["c", /traffic would be moving toward you/i]],
  ["sign-04", ["d", /do not drive into that roadway opening/i]],
  ["sign-05", ["b", /warning sign/i]],
  ["sign-06", ["c", /provide service information/i]],
  ["sign-07", ["d", /guide route and destination decisions/i]],
  ["sign-08", ["b", /follow the arrow's indicated direction/i]],
 ]);
 const signs = starterQuestions.filter(q => q.id.startsWith("sign-"));
 assert.equal(signs.length, expected.size);
 for (const [id, [answerId, meaning]] of expected) {
  const q = signs.find(item => item.id === id);
  assert.ok(q, `Missing ${id}`);
  assert.equal(q.topic, "Road signs");
  assert.equal(q.answerId, answerId, `Answer key changed for ${id}`);
  assert.match(q.options.find(o => o.id === q.answerId)?.text ?? "", meaning, `Incorrect meaning for ${id}`);
  assert.equal(q.sourceUrl, guide, `Unexpected source for ${id}`);
  assert.match(q.sourceCheckedAt, /^\d{4}-\d{2}-\d{2}$/);
 }
});


test("quiz progress bar reflects completed answers rather than navigation position", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /aria-label="Questions answered" aria-valuemin=\{0\} aria-valuemax=\{selected\.length\} aria-valuenow=\{answeredCount\}/);
 assert.match(source, /width:\x60\$\{\(answeredCount\/selected\.length\)\*100\}%\x60/);
 assert.doesNotMatch(source, /aria-label="Quiz progress"/);
});


test("submitting a quiz focuses the results heading for keyboard and screen-reader orientation", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /const resultsHeadingRef = useRef<HTMLHeadingElement>\(null\)/);
 assert.match(source, /if \(isFinished\) resultsHeadingRef\.current\?\.focus\(\)/);
 assert.match(source, /\[isFinished\]/);
 assert.match(source, /<h2 ref=\{resultsHeadingRef\} tabIndex=\{-1\}>You scored \{score\.correct\} out of \{score\.total\}\.<\/h2>/);
});


test("completed practice can finish from any question, while incomplete practice remains gated", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /index===selected\.length-1 \|\| answeredCount===selected\.length/);
 assert.match(source, /disabled=\{mode !== 30 && answeredCount !== selected\.length\}/);
 assert.match(source, /mode !== 30 && !answers\[current\.id\]/);
});

test("winter preparedness additions preserve independently verified answer meanings", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 // Alberta Safer winter highways, checked 2026-11-10:
 // https://www.alberta.ca/safer-winter-highways
 const expected = new Map([
  ["winter-09", ["a", /blanket and a flashlight/i]],
  ["winter-10", ["b", /more than half full/i]],
 ]);
 for (const [id, [answerId, meaning]] of expected) {
  const q = starterQuestions.find(item => item.id === id);
  assert.ok(q, `Missing ${id}`);
  assert.equal(q.topic, "Winter driving");
  assert.equal(q.answerId, answerId);
  assert.match(q.options.find(o => o.id === q.answerId)?.text ?? "", meaning);
  assert.equal(q.sourceUrl, "https://www.alberta.ca/safer-winter-highways");
  assert.equal(q.sourceCheckedAt, "2026-11-10");
 }
});


test("winter snowplow and lane-change scenarios preserve Alberta source and answers", async () => {
 const { starterQuestions } = await import("../src/data/questions.ts");
 const expected = new Map([
  ["winter-11", ["b", /stay back until the snowplow operator lets you pass/i]],
  ["winter-12", ["a", /signal early, check mirrors and shoulder-check/i]],
 ]);
 for (const [id, [answerId, meaning]] of expected) {
  const q = starterQuestions.find(item => item.id === id);
  assert.ok(q, `Missing ${id}`);
  assert.equal(q.topic, "Winter driving");
  assert.equal(q.answerId, answerId);
  assert.match(q.options.find(option => option.id === answerId)?.text ?? "", meaning);
  assert.equal(q.sourceUrl, "https://www.alberta.ca/safer-winter-highways");
  assert.equal(q.sourceCheckedAt, "2026-11-10");
 }
});

test("returning from results restores focus to mode selection without initial autofocus", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /const focusModeOnReturn = useRef\(false\)/);
 assert.match(source, /selected\.length === 0 && focusModeOnReturn\.current/);
 assert.match(source, /modeHeadingRef\.current\?\.focus\(\)/);
 assert.match(source, /focusModeOnReturn\.current = false/);
 assert.match(source, /function chooseAnotherMode\(\) \{ focusModeOnReturn\.current = true; setSelected\(\[\]\)/);
 assert.match(source, /id="practice-mode-title" ref=\{modeHeadingRef\} tabIndex=\{-1\}/);
});


test("result review distinguishes skipped mock answers from incorrect selections", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /ok \? "Correct" : answer \? "Needs review" : "Unanswered"/);
 assert.match(source, /answer\?\.text \?\? "Not answered"/);
});

test("completed practice retains Next navigation alongside Finish before the last question", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /index < selected\.length - 1 && <button[^>]*onClick=\{\(\)=>setIndex\(\(i\)=>i\+1\)\}/);
 assert.match(source, /index===selected\.length-1 \|\| answeredCount===selected\.length/);
 assert.match(source, /disabled=\{mode !== 30 && !answers\[current\.id\]\}/);
});


test("mock submission is available from any question and warns before submitting blanks", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /mode === 30 \|\| index===selected\.length-1 \|\| answeredCount===selected\.length/);
 assert.match(source, /mode === 30 && answeredCount < selected\.length && !window\.confirm/);
 assert.match(source, /Unanswered questions count as incorrect/);
 assert.match(source, /disabled=\{mode !== 30 && answeredCount !== selected\.length\}/);
});


test("winter following distance and cruise control additions preserve Alberta evidence", async () => {
 const { starterQuestions, questionBank } = await import("../src/data/questions.ts");
 const expected = new Map([
  ["winter-13", ["c", /at least three times your normal following distance/i]],
  ["winter-14", ["b", /avoid using cruise control in winter conditions/i]],
 ]);
 assert.ok(starterQuestions.length >= 72);
 assert.deepEqual(validateVersionedQuestionBank(questionBank), []);
 assert.equal(new Set(starterQuestions.map(q => q.id)).size, starterQuestions.length);
 for (const [id, [answerId, meaning]] of expected) {
  const q = starterQuestions.find(item => item.id === id);
  assert.ok(q, `Missing ${id}`);
  assert.equal(q.topic, "Winter driving");
  assert.equal(q.answerId, answerId);
  assert.match(q.options.find(option => option.id === answerId)?.text ?? "", meaning);
  assert.equal(q.sourceUrl, "https://www.alberta.ca/safer-winter-highways");
  assert.equal(q.sourceCheckedAt, "2026-11-10");
 }
});


test("in-progress quiz can return to mode selection only after confirming loss of answers", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /function exitQuiz\(\) \{/);
 assert.match(source, /if \(!window\.confirm\("Leave this quiz\? Your current answers will be lost\."\)\) return;/);
 assert.match(source, /chooseAnotherMode\(\);\s*\}/);
 assert.match(source, /type="button" onClick=\{exitQuiz\}>Change mode<\/button>/);
});


test("results show separate correct, incorrect, and unanswered totals", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /aria-label="Answer breakdown"/);
 assert.match(source, /score\.correct\} correct/);
 assert.match(source, /score\.answered - score\.correct\} incorrect/);
 assert.match(source, /score\.total - score\.answered\} unanswered/);
});


test("30-question mock scoring reconciles correct, wrong and unanswered answers", () => {
 const questions = bank.slice(0, 30);
 const answers = Object.fromEntries([
  ...questions.slice(0, 24).map(q => [q.id, "a"]),
  ...questions.slice(24, 27).map(q => [q.id, "b"]),
 ]);
 const result = scoreQuiz(questions, answers);
 const correct = questions.filter(q => answers[q.id] === q.answerId).length;
 const incorrect = questions.filter(q => answers[q.id] && answers[q.id] !== q.answerId).length;
 const unanswered = questions.filter(q => !answers[q.id]).length;
 assert.deepEqual({ correct, incorrect, unanswered }, { correct: 24, incorrect: 3, unanswered: 3 });
 assert.equal(correct + incorrect + unanswered, result.total);
 assert.equal(result.correct, correct);
 assert.equal(result.answered, correct + incorrect);
 assert.equal(result.incorrectIds.length, incorrect + unanswered);
 assert.equal(passedOfficialStyleMock(result), false);
});


test("winter bridge icing and headlight visibility questions retain Alberta provenance", async () => {
 const { starterQuestions, questionBank } = await import("../src/data/questions.ts");
 assert.ok(starterQuestions.length >= 74);
 assert.deepEqual(validateVersionedQuestionBank(questionBank), []);
 assert.equal(new Set(starterQuestions.map(q => q.id)).size, starterQuestions.length);
 const expected = new Map([
  ["winter-15", ["a", /bridge deck/i]],
  ["winter-16", ["c", /headlights so the taillights are illuminated/i]],
 ]);
 for (const [id, [answerId, meaning]] of expected) {
  const q = starterQuestions.find(item => item.id === id);
  assert.ok(q, `Missing ${id}`);
  assert.equal(q.topic, "Winter driving");
  assert.equal(q.answerId, answerId);
  assert.match(q.options.find(o => o.id === answerId)?.text ?? "", meaning);
  assert.equal(q.sourceUrl, "https://www.alberta.ca/safer-winter-highways");
  assert.equal(q.sourceCheckedAt, "2026-11-10");
 }
});


test("answer review displays each question source verification date", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /Source last checked: <time dateTime=\{q\.sourceCheckedAt\}>\{q\.sourceCheckedAt\}<\/time>/);
 assert.match(source, /href=\{q\.sourceUrl\} target="_blank" rel="noopener noreferrer"/);
});


test("results breakdown derives incorrect and unanswered from validated scoring", async () => {
 const { readFile } = await import("node:fs/promises");
 const source = await readFile(new URL("../src/components/practice-quiz.tsx", import.meta.url), "utf8");
 assert.match(source, /score\.answered - score\.correct/);
 assert.match(source, /score\.total - score\.answered/);
 const questions = bank.slice(0, 3);
 const score = scoreQuiz(questions, { "id-0": "a", "id-1": "invalid" });
 assert.deepEqual([score.correct, score.answered - score.correct, score.total - score.answered], [1, 0, 2]);
});
