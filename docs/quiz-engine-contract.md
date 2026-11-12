# RR7-M1-04 — Deterministic quiz-engine test contract

Date: 2026-11-08. Applies to the Next.js starter engine in `src/lib/quiz.ts` and tests in `tests/quiz-contract.test.mjs`. All fixture prompts are synthetic; no official exam items are reproduced.

## Contract matrix

| Case | Mode / condition | Expected outcome | Executable coverage |
| --- | --- | --- | --- |
| C01 | 10 practice, deterministic RNG | Exactly 10 unique IDs, repeatable for same input and RNG | sampling test |
| C02 | 20 practice, deterministic RNG | Exactly 20 unique IDs | sampling test |
| C03 | 30 mock, deterministic RNG | Exactly 30 unique IDs | sampling test |
| C04 | All modes | Source bank remains unmodified | mutation test |
| C05 | Bank of 9/19/29 for 10/20/30 | Throw RangeError; do **not** silently shorten a real exam | insufficient-bank test |
| C06 | Zero, negative, fractional, NaN, oversized count | Reject with RangeError | count test |
| C07 | RNG outside [0,1) or NaN | Reject with RangeError | RNG test |
| C08 | 10 practice: correct/wrong/skipped/unknown | Correct/answered counts distinguish unknown from actual choices; skipped count incorrect | practice scoring test |
| C09 | 20 practice: 13/20 | 65%, practice never reports official mock pass | practice scoring test |
| C10 | 30 mock: 24/30 | Fail | boundary test |
| C11 | 30 mock: 25/30 | Pass | boundary test |
| C12 | 30 mock: 30/30 | Pass | boundary test |
| C13 | 30 mock: 25 correct, 5 skipped | Pass on score 25, report answered=25 and 5 incorrect IDs | skipped mock test |
| C14 | No answers / empty score | Zero-safe, no division by zero, no mock pass | empty score test |
| C15 | Duplicate IDs / answer not in options | Validation errors; sampling fails closed | malformed bank test |
| C16 | Retake with different RNG | Fresh selection and independent score, earlier result unchanged | retake test |

## Product decisions and constraints

- **Mock format:** 30 multiple-choice questions; at least 25 correct passes, per Alberta's knowledge-test overview: https://www.alberta.ca/drivers-knowledge-test (source reviewed 2026-11-08).
- **Timer:** No countdown timer for MVP. Do not invent an official time limit.
- **Missing questions:** No partial or 10-question substitute presented as a 30-question mock. UI must disable unavailable modes and explain how many verified questions are required.
- **Answer submission:** Wrong, missing and unknown option IDs do not receive credit. `answered` only counts a valid option ID. Answer reveal before submission is the learner's choice (amended 2026-11-12): with **Show answers as I go** on (the default), the learner presses *Check answer* to see correctness, the correct option and the explanation for that question, and the choice is then locked. With it off, the mock UI shows no answer key before submission. Scoring is identical either way.
- **Retake:** A fresh selection may be sampled; previous saved results must remain intact. This contract tests the pure quiz engine only, not persistence.
- **Determinism:** Tests inject a fixed RNG. The production app can use Math.random; avoid asserting a particular shuffled order across different RNG implementations.
- **Source quality:** The 10 available starter questions are not enough for 20 or 30 modes. Do not enable those UI paths until the source-backed question bank reaches the necessary count.
- **Validation:** Before sampling, malformed question records and duplicate IDs must fail rather than silently proceed.

## Acceptance and follow-up

The new automated suite must pass in GitHub Actions alongside existing tests, ESLint, TypeScript and the production build. This is a **contract for engine behavior**, not evidence that 20/30 UI routes, storage, keyboard UX or offline mode are implemented. Existing 10-question UI remains the only available quiz mode.

Next: RR7-M1-05 UI/state flow map and accessibility acceptance criteria. Separately, correct the P0 intro-08 demerit-point explanation before release, using the reviewed official-source register. Draft PR #1 stays unmerged.
