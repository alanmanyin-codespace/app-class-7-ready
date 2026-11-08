# RR7-M1-03 — Official-source provenance register (2026-11-08)

## Scope and method
Independently opened and read the **current official Alberta government pages** linked from all 10 accessible original starter questions in `src/data/questions.ts`. Checked the relevant visible sections on 2026-11-08. These are **not official exam questions**; this register verifies factual claims, not resemblance to the real exam. The historical 66-question prototype remains unavailable.

Evidence sources (all checked 2026-11-08):
- **K — Driver's knowledge test:** https://www.alberta.ca/drivers-knowledge-test — Overview, test bullets and test location. Says 30 multiple-choice questions, pass at 25, once daily, fee per attempt, at registry agent offices.
- **L — Get a Class 7 learner's licence:** https://www.alberta.ca/class-7-learners-licence — Eligibility, restrictions and Step 2. Specifies supervision by someone **over 18** holding a **full Class 5 licence or higher**, seated in front passenger seat; prohibited driving 12 a.m.–5 a.m.; 0% alcohol; no more people than seat belts; 8 demerit points allowed before suspension.
- **S — Steps to getting a driver's licence:** https://www.alberta.ca/get-drivers-licence-steps — Stage 1, learner eligibility. Minimum 14 years; parental/guardian consent under 18; knowledge and vision tests.

## Per-question evidence and disposition
| ID | Source / official section | Claim checked (paraphrase) | Verdict | Correction / residual concern |
| --- | --- | --- | --- | --- |
| intro-01 | K / Overview | Knowledge test has 30 multiple-choice items. | VERIFIED | None. |
| intro-02 | K / Overview | 25 correct answers out of 30 are needed. | VERIFIED | None. |
| intro-03 | S / Stage 1 | Minimum learner age is 14. | VERIFIED | Age alone is not full eligibility: under-18 consent, knowledge and vision tests also required. Current prompt asks only minimum age, so answer is correct. |
| intro-04 | L / Restrictions | No driving from midnight until 5 a.m. | VERIFIED | None. |
| intro-05 | L / Eligibility | Supervisor must be over 18, full Class 5 or higher, in front passenger seat. | VERIFIED WITH EDITORIAL CHANGE REQUIRED | Correct option currently says only “full Class 5 licence holder”; it is a qualifying example but omits “or higher.” Change option and explanation to **“a driver over 18 with a full Class 5 licence or higher, seated in the front passenger seat.”** Do not substitute “18 or older”: official text says **over 18**. |
| intro-06 | L / Restrictions | Learners must maintain 0% alcohol when driving. | VERIFIED WITH EDITORIAL CHANGE RECOMMENDED | Source explicitly says 0% alcohol. Current option is correct; improve prompt to “According to Alberta's Class 7 restrictions, what alcohol level must a learner maintain when driving?” Avoid asserting drug restrictions from this source alone. |
| intro-07 | L / Restrictions | Vehicle cannot contain more people than available seat belts. | VERIFIED WITH EDITORIAL CHANGE RECOMMENDED | Prompt says “passengers,” but government rule applies to **people/occupants**, including driver. Rephrase to “How many people, including the driver, may ride in the vehicle while a Class 7 learner drives?” and answer “No more people than available seat belts.” |
| intro-08 | L / Restrictions | Government says learners are allowed 8 demerit points **before** licence suspension. | SOURCE VERIFIED; ANSWER-WORDING RISK | The app says “suspended at eight demerit points,” which is **not a precise paraphrase** of “allowed 8 demerit points before receiving a suspension.” Do **not** claim an exact suspension trigger at 8 from this page. Revise to “How many demerit points does Alberta's Class 7 page say learners are allowed before suspension?” Answer “8”; explanation should quote no more than needed and paraphrase “Alberta's Class 7 page lists an allowance of 8 demerit points before suspension.” For exact legal threshold, verify the applicable regulation separately. |
| intro-09 | K / Overview | Tests are offered at Alberta registry agent offices. | VERIFIED | None. |
| intro-10 | K / Overview | One knowledge-test attempt per day; fee charged each time. | VERIFIED | None. |

**Count:** 10/10 linked question claims reviewed against current government pages; 7 no substantive content issue, 3 editorial fixes recommended (intro-05, intro-06, intro-07), and **one potentially misleading threshold statement requires correction** (intro-08). All 10 existing answer IDs are consistent with the three source pages; source verification does not guarantee every distractor is pedagogically optimal.

## Prioritized correction backlog
1. **P0 intro-08:** Remove the unsupported assertion “suspended at eight demerit points”; align prompt/explanation with the official page's “allowed 8 ... before suspension” phrasing. Avoid claiming the precise legal trigger without a second legal source.
2. **P1 intro-05:** State “full Class 5 or higher” in the correct option and explanation, preserving “over 18” and front-seat conditions.
3. **P1 intro-07:** Use “people including driver,” not just “passengers,” to avoid confusing seat-belt rule.
4. **P2 intro-06:** Make zero-alcohol prompt more precise; existing answer is source-supported.
5. **P1 content coverage:** Source-check new original road-rule questions against the current official Driver's Guide before introducing 20/30-question modes; do not copy government practice questions.

## Acceptance, test evidence and limits
- **PASS (manual evidence review):** All 10 accessible question records have an official-source reference, date, and per-item disposition. Source pages were opened directly and their relevant text read on 2026-11-08.
- **NOT TESTED HERE:** No npm test, lint, typecheck or production build executed for this documentation-only change. The preceding commit `af9103e` passed GitHub Actions run 42509500297.
- **NOT COMPLETE:** Runtime question corrections are backlog items, not silently assumed applied. This review is not legal advice and may need rechecking after Alberta rule changes. No signs or original 66-question source were audited.
- **Rollback:** Remove this documentation file; runtime behavior is untouched.
