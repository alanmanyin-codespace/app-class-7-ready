import { QUESTION_SCHEMA_VERSION, validateVersionedQuestionBank } from "../lib/quiz";
import type { Question, VersionedQuestionBank } from "../lib/quiz";

// Original introductory questions written for this app, based on current Alberta government guidance.
// NOT official exam questions. A full, balanced 66+ question bank still requires review.
// Keep sources and checked dates attached to each question.
const KNOWLEDGE = "https://www.alberta.ca/drivers-knowledge-test";
const LEARNER = "https://www.alberta.ca/class-7-learners-licence";
const STEPS = "https://www.alberta.ca/get-drivers-licence-steps";
const checked = "2026-11-08";

const questions: readonly Question[] = [
  { id:"intro-01", topic:"Test basics", prompt:"How many multiple-choice questions are on Alberta's driver's knowledge test?", options:[{id:"a",text:"20"},{id:"b",text:"25"},{id:"c",text:"30"},{id:"d",text:"40"}], answerId:"c", explanation:"The Alberta knowledge test contains 30 multiple-choice questions.", sourceUrl:KNOWLEDGE, sourceCheckedAt:checked },
  { id:"intro-02", topic:"Test basics", prompt:"How many correct answers are required to pass the 30-question knowledge test?", options:[{id:"a",text:"20"},{id:"b",text:"23"},{id:"c",text:"25"},{id:"d",text:"30"}], answerId:"c", explanation:"You need at least 25 correct answers out of 30 to pass.", sourceUrl:KNOWLEDGE, sourceCheckedAt:checked },
  { id:"intro-03", topic:"Eligibility", prompt:"What is the minimum age to apply for an Alberta Class 7 learner's licence?", options:[{id:"a",text:"12"},{id:"b",text:"14"},{id:"c",text:"16"},{id:"d",text:"18"}], answerId:"b", explanation:"The minimum age for a Class 7 learner's licence is 14.", sourceUrl:STEPS, sourceCheckedAt:checked },
  { id:"intro-04", topic:"Learner restrictions", prompt:"During which hours is a Class 7 learner prohibited from driving?", options:[{id:"a",text:"10 p.m. to 4 a.m."},{id:"b",text:"Midnight to 5 a.m."},{id:"c",text:"6 p.m. to midnight"},{id:"d",text:"No restrictions"}], answerId:"b", explanation:"Class 7 learners may not drive between midnight and 5 a.m.", sourceUrl:LEARNER, sourceCheckedAt:checked },
  { id:"intro-05", topic:"Learner restrictions", prompt:"Who must supervise a Class 7 learner driving a car?", options:[{id:"a",text:"Any friend aged 16"},{id:"b",text:"A driver over 18 with a full Class 5 licence or higher, in the front passenger seat"},{id:"c",text:"Any person with a learner's licence"},{id:"d",text:"Nobody, if travelling locally"}], answerId:"b", explanation:"A Class 7 learner must be supervised by someone over 18 with a full Class 5 licence or higher, seated in the front passenger seat.", sourceUrl:LEARNER, sourceCheckedAt:checked },
  { id:"intro-06", topic:"Learner restrictions", prompt:"According to Alberta's Class 7 restrictions, what alcohol level must a learner maintain while driving?", options:[{id:"a",text:"0%"},{id:"b",text:"0.02%"},{id:"c",text:"0.05%"},{id:"d",text:"0.08%"}], answerId:"a", explanation:"Class 7 learners must maintain a zero (0%) alcohol level while driving.", sourceUrl:LEARNER, sourceCheckedAt:checked },
  { id:"intro-07", topic:"Learner restrictions", prompt:"How many people, including the driver, may ride in a vehicle driven by a Class 7 learner?", options:[{id:"a",text:"Any number"},{id:"b",text:"No more people than the number of available seat belts"},{id:"c",text:"Exactly two"},{id:"d",text:"Only one passenger"}], answerId:"b", explanation:"The number of people in the vehicle, including the driver, must not exceed the number of available seat belts.", sourceUrl:LEARNER, sourceCheckedAt:checked },
  { id:"intro-08", topic:"Learner restrictions", prompt:"According to Alberta’s Class 7 guidance, how many demerit points are learners allowed before licence suspension?", options:[{id:"a",text:"4"},{id:"b",text:"6"},{id:"c",text:"8"},{id:"d",text:"15"}], answerId:"c", explanation:"Alberta’s Class 7 guidance lists an allowance of eight demerit points before suspension. It does not state that suspension occurs at exactly eight points.", sourceUrl:LEARNER, sourceCheckedAt:checked },
  { id:"intro-09", topic:"Test basics", prompt:"Where are Alberta driver's knowledge tests taken?", options:[{id:"a",text:"At a registry agent office"},{id:"b",text:"Only through a smartphone app"},{id:"c",text:"At a driving school without a registry"},{id:"d",text:"Only at home online"}], answerId:"a", explanation:"Knowledge tests are available at Alberta registry agent offices.", sourceUrl:KNOWLEDGE, sourceCheckedAt:checked },
  { id:"intro-10", topic:"Test basics", prompt:"How frequently may you attempt Alberta's driver's knowledge test?", options:[{id:"a",text:"Any number of times in one day"},{id:"b",text:"Once per day"},{id:"c",text:"Once per month"},{id:"d",text:"Once per year"}], answerId:"b", explanation:"Alberta allows one knowledge-test attempt per day, with a fee for each attempt.", sourceUrl:KNOWLEDGE, sourceCheckedAt:checked },
];

// Versioned envelope is the sole source of question data. Validate at module load so
// malformed bundled content cannot silently reach the practice UI.
export const questionBank: VersionedQuestionBank = {
  schemaVersion: QUESTION_SCHEMA_VERSION,
  questions,
};
const validationErrors = validateVersionedQuestionBank(questionBank);
if (validationErrors.length > 0) {
  throw new Error(`Invalid bundled question bank: ${validationErrors.join("; ")}`);
}
export const starterQuestions = questionBank.questions;
