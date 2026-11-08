import test from "node:test";
import assert from "node:assert/strict";
import { QUESTION_SCHEMA_VERSION, validateQuestionBank, validateVersionedQuestionBank } from "../src/lib/quiz.ts";

const valid = () => ({
  id: "test-01", prompt: "What is the example rule?",
  options: [{id:"a",text:"Option A"},{id:"b",text:"Option B"}],
  answerId:"a", explanation:"Example explanation.", topic:"Test basics",
  sourceUrl:"https://www.alberta.ca/drivers-knowledge-test", sourceCheckedAt:"2026-11-08"
});
const bank = (questions = [valid()]) => ({schemaVersion:QUESTION_SCHEMA_VERSION,questions});
test("accepts version 1 and optional accessible imageAlt", () => {
 assert.deepEqual(validateVersionedQuestionBank(bank([{...valid(),imageAlt:"Diagram of the road"}])),[]);
});
test("rejects unsupported schema versions and malformed envelope", () => {
 assert.match(validateVersionedQuestionBank({...bank(),schemaVersion:2}).join(" "),/schemaVersion/);
 assert.match(validateVersionedQuestionBank(null).join(" "),/object/);
 assert.match(validateVersionedQuestionBank({...bank(),questions:null}).join(" "),/array/);
});
test("rejects duplicate IDs and duplicate option IDs", () => {
 assert.match(validateVersionedQuestionBank(bank([valid(),valid()])).join(" "),/Duplicate/);
 assert.match(validateQuestionBank([{...valid(),options:[{id:"a",text:"One"},{id:"a",text:"Two"}]}]).join(" "),/Duplicate option/);
});
test("rejects invalid source URLs and impossible dates", () => {
 for (const sourceUrl of ["", "http://example.com", "not-a-url", "https://user:pass@example.com"]) {
  assert.match(validateQuestionBank([{...valid(),sourceUrl}]).join(" "),/sourceUrl/);
 }
 for (const sourceCheckedAt of ["", "2026-02-30", "2026-13-01", "08/11/2026"]) {
  assert.match(validateQuestionBank([{...valid(),sourceCheckedAt}]).join(" "),/sourceCheckedAt/);
 }
});
test("rejects missing essential fields, invalid topic and invalid image alt", () => {
 assert.match(validateQuestionBank([{...valid(),prompt:" "}]).join(" "),/Incomplete/);
 assert.match(validateQuestionBank([{...valid(),topic:"Unknown"}]).join(" "),/topic/);
 assert.match(validateQuestionBank([{...valid(),imageAlt:""}]).join(" "),/imageAlt/);
});
test("handles malformed question/option objects without throwing", () => {
 assert.match(validateQuestionBank([null]).join(" "),/Invalid question/);
 assert.match(validateQuestionBank([{...valid(),options:[null,{id:"a",text:"OK"}]}]).join(" "),/Invalid option/);
});
