# RR7-M1-02 — Starter question-bank audit (2026-11-08)

## Scope and evidence
Audited **all 10 currently accessible** questions in `src/data/questions.ts` at PR #1, not the historical 66-question HTML prototype (which is not in the repository). This is a **content/inventory audit**, not an independent factual verification of every Alberta government page. `sourceCheckedAt` is the existing author's claimed check date, **not** evidence of this audit's independent source verification. Source verification is explicitly scheduled for RR7-M1-03.

## Inventory
| Topic | IDs | Count | Share |
| --- | --- | ---: | ---: |
| Test basics | intro-01, intro-02, intro-09, intro-10 | 4 | 40% |
| Eligibility | intro-03 | 1 | 10% |
| Learner restrictions | intro-04, intro-05, intro-06, intro-07, intro-08 | 5 | 50% |
| **Total** | | **10** | **100%** |

All 10 entries have distinct stable IDs and four distinct option IDs each, one selected answer ID, an explanation, a topic, a source URL and a source-check date. No exact duplicate prompts or answer-choice IDs observed. **The existing automated schema validator does not prove the correct answer or explanation is factually correct.**

## Per-question audit
| ID | Topic | Structural / editorial status | Review note / follow-up |
| --- | --- | --- | --- |
| intro-01 | Test basics | PASS structural; SOURCE VERIFY PENDING | Knowledge-test length; verify current government page in M1-03. |
| intro-02 | Test basics | PASS structural; SOURCE VERIFY PENDING | Passing threshold; verify 25/30 rule. |
| intro-03 | Eligibility | PASS structural; SOURCE VERIFY PENDING | Minimum learner age; confirm current eligibility wording. |
| intro-04 | Learner restrictions | PASS structural; SOURCE VERIFY PENDING | Nighttime prohibition; check exact hours. |
| intro-05 | Learner restrictions | EDITORIAL REVIEW; SOURCE VERIFY PENDING | The phrase "a full Class 5 licence holder over 18" may omit other qualifying supervisor licence classes, and the age boundary needs exact legal wording. Answer option and explanation should use the same unambiguous conditions. |
| intro-06 | Learner restrictions | EDITORIAL REVIEW; SOURCE VERIFY PENDING | "0%" is a simplified alcohol-level answer. Confirm government language (zero alcohol/zero BAC) and any drug-related restrictions before revising. |
| intro-07 | Learner restrictions | PASS structural; SOURCE VERIFY PENDING | "Passengers" vs "occupants" wording should be checked; explanation uses occupants. |
| intro-08 | Learner restrictions | SOURCE VERIFY PENDING | Verify precise demerit-point suspension trigger and whether accumulated vs reached threshold matters. |
| intro-09 | Test basics | PASS structural; SOURCE VERIFY PENDING | Verify testing venue / online availability wording. |
| intro-10 | Test basics | SOURCE VERIFY PENDING | Confirm retake frequency and fees in current guidance. |

**Editorial flags:** intro-05, intro-06, intro-07 (minor wording). **Potentially time-sensitive legal-rule checks:** intro-03 through intro-10. None should be marked factually verified from structural validation alone.

## Gaps and release implications
The bank currently contains **10** introductory questions; the historical **66** are not accessible in the checked repository. A 10-question practice quiz can run, but **20-question practice and 30-question mock must remain disabled** until at least 20/30 individually reviewed, distinct questions exist. Current topics are heavily concentrated on the test process and learner restrictions, not the road-rule knowledge normally required to study: traffic signs and signals, intersections and right-of-way, speed and space management, parking, sharing the road, hazards and adverse conditions. These are **candidate coverage categories** for future original content, subject to authoritative Alberta guide review.

## Actionable correction backlog
1. **M1-03 P0:** Open each linked official Alberta source and verify all 10 answers, explanations and dates. Record exact page URL, checked date, rule excerpt in paraphrase, and confidence. Correct any substantive discrepancy in a separate, tested change.
2. **M1-03 P1:** Clarify intro-05 supervision wording and intro-06 zero-alcohol wording based on verified guidance; align intro-07 passenger/occupant terminology.
3. **M1-03 P1:** Create original, source-backed questions covering road signs, priority, traffic control, intersections, safe driving and hazards. Do not copy official exam items or copyrighted guide questions.
4. **M2 gate:** Add explicit UI availability rules for 10/20/30 modes based on **validated and content-reviewed** bank size, not fabricated fillers.
5. **Optional recovery:** If historical 66-question HTML source becomes available, audit each recovered item separately; do not infer it is already included.

## Acceptance and limitations
- **PASS:** every *available* question (10/10) has a row and structural/editorial status; inventory counts sum to 10; duplicate prompt scan and option/ID review found no exact duplicates.
- **BLOCKED:** auditing the *historical* 66-question prototype without its source.
- **NOT YET DONE:** independent factual verification and expansion of the question bank (RR7-M1-03).
- **Rollback:** delete this audit document; no runtime code or saved learner data changed.
