# RoadReady 7 question data contract (v1)

The app uses `VersionedQuestionBank` from `src/lib/quiz.ts`. Each question must have a stable unique `id`, nonblank `prompt`, at least two nonblank choices with unique choice IDs, `answerId` matching one choice, nonblank `explanation`, supported `topic`, HTTPS `sourceUrl`, and a real ISO calendar date `sourceCheckedAt` (YYYY-MM-DD). `imageAlt` is optional, but when supplied must be nonblank. The current topics are Test basics, Eligibility, and Learner restrictions; expand the typed topic registry deliberately when adding topics. The validator checks structure and traceability, **not** factual correctness or source reliability. Editors must independently verify each claim against current authoritative guidance.

Example envelope (illustrative content, not an official exam item):

```json
{
  "schemaVersion": 1,
  "questions": [{
    "id": "intro-01",
    "prompt": "How many multiple-choice questions are on Alberta's driver's knowledge test?",
    "options": [
      {"id": "a", "text": "20"},
      {"id": "b", "text": "25"},
      {"id": "c", "text": "30"},
      {"id": "d", "text": "40"}
    ],
    "answerId": "c",
    "explanation": "The Alberta knowledge test contains 30 multiple-choice questions.",
    "topic": "Test basics",
    "sourceUrl": "https://www.alberta.ca/drivers-knowledge-test",
    "sourceCheckedAt": "2026-11-08"
  }]
}
```

Validation API: `validateVersionedQuestionBank(unknown): string[]` returns zero errors for a valid envelope. `validateQuestionBank(questions)` checks raw arrays and is also used by the quiz engine. Do not render or sample a bank with errors. Schema version increments require a documented migration and tests. Question IDs should not be recycled because saved attempts refer to IDs.

Run `npm test` and `npm run check` before review. No licensed Alberta exam question text should be copied into this repository.
