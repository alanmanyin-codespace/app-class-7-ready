# RR7-M1-05 — UI screen/state map and accessibility acceptance contract

Status: **SPEC DONE** (2026-11-08). This document describes current implementation versus future MVP. It is not evidence that unbuilt routes work.

## Routes, entry, exits and failure states

| Screen / route | Current implementation | Entry | Success / exit | Empty, error and interrupted states |
|---|---|---|---|---|
| Home `/` | Implemented | Brand/nav, direct link | Start introductory 10-question quiz; About; Signs | No saved attempts: zero-state prompt. Corrupt/blocked storage: zero-state, no crash. Refresh must retain saved results when available. |
| Practice `/practice` | Implemented: 10 starter questions only | Home CTA, nav, direct link | One question at a time; Previous/Next; submit after all answered; results on same route | Incomplete selection: Next/Finish disabled. Invalid/insufficient bank: show a safe explanatory message, not a blank page (future). Refresh during quiz currently resets unsaved answers; disclose this until recovery exists. |
| Practice result `/practice` (finished state) | Implemented | Finish 10-question quiz | Score, per-question explanation/source, retake, Home | Failed localStorage write: warning shown; results remain visible. Unknown answer ID: treat as unanswered. No official-exam pass/fail label for starter mode. |
| 20-question practice `/practice?size=20` (proposed; route not implemented) | Not built | Future mode selector | Same question/result/retry contract as 10 | <20 validated questions: disable mode and explain bank limitation; never silently shrink. |
| Mock exam (`/practice`, 30-question mode) | Implemented 2026-11-12 | Mode picker on `/practice` | 30 unique questions; question map with jump, flag for review, in-page review before submit; 25/30 pass; review | <30 verified questions: disable with clear reason. The review screen lists unanswered and flagged questions before submission. Answers appear before submission only when the learner keeps **Show answers as I go** on; with it off, no pre-submit answer disclosure. |
| Signs `/signs` | Implemented placeholder | Nav/direct link | Official Driver's Guide, Practice | No licensed catalog yet: clear coming-soon state, no broken/uncited imagery. |
| Mistakes `/mistakes` (proposed) | Not built | Future result/dashboard link | Filter incorrect IDs, retry, back to dashboard | No mistakes: congratulatory zero state. Removed IDs: skip safely with explanation; corrupt storage: recovery guidance. |
| Progress `/` dashboard (future dedicated `/progress` optional) | Summary implemented | Home | Number of attempts, best score, last result, retake | No history: onboarding; storage unavailable: explain results may not persist; no fake topic confidence for tiny samples. |
| About `/about` | Implemented | Nav/footer/direct link | Official source and Practice | Independent/unofficial disclaimer, local-only privacy, offline-launch limitation visible. |
| Unknown route | Next.js default 404 | Mistyped/deep link | Home recovery | Custom 404 with focusable Home link planned. |

## State transitions

**Introductory practice:** `idle/ready -> question(i, selected answer optional) -> question(i+1) -> question(i-1) -> submit (only after all 10 answered) -> results -> retry -> question(0)`. Answers remain editable before submission. On retry, select 10 unique questions from the validated bank. Current first attempt uses stable bank order to avoid hydration mismatch. In-flight sessions (questions, answers, checked, flags, position, feedback setting) are kept in `sessionStorage` and restored after a refresh in the same tab; malformed or stale records fall back to the mode picker. Submitting or leaving the quiz clears it.

**Mock (implemented 2026-11-12):** `unavailable (bank <30) | ready -> answering (optional check -> locked feedback per question; flag; jump via map) -> review before submit -> submitted -> pass/fail + review -> retake`. Pass only if exactly 30 questions and correct >=25. Never show answer explanations before submission. Never label the 10-question introductory quiz as a mock.

**Persistence:** `storage missing -> zero-state`; `save success -> dashboard summary`; `quota/denied -> results visible + nonblocking warning`; `corrupt JSON -> safe zero-state`. Preserve privacy: browser-local only, no account or analytics by default.

## Keyboard and assistive-technology acceptance checklist

1. At 320px, 375px, 768px and 1280px viewport widths, every critical route remains usable without horizontal scrolling or clipped action buttons. Verify on actual browser before claiming PASS.
2. Keyboard-only: Tab/Shift+Tab reach nav, mode entry, each radio option, Previous, Next, Finish, retake, explanation links and Home in logical DOM order; Enter/Space activate controls; arrow keys navigate each radio group.
3. All interactive controls have visible focus indicators at least 2 CSS px equivalent with sufficient contrast; do not remove browser focus styling.
4. Every question has an accessible group name including question index and question text (use `fieldset` with descriptive `legend` or `aria-labelledby`). Current generic legend "Select one answer" is an accessibility gap to fix.
5. Progress must announce `Question N of 10` as the active question changes; do not rely solely on the visual progress bar. A polite live region or focus-managed heading must be tested with a screen reader.
6. After Next/Previous, focus moves predictably to the new question heading or the first answer, not silently to a removed button. On submission, focus moves to result heading. Current UI lacks explicit focus management; test and implement in M3.
7. Disabled Next/Finish buttons have adjacent understandable guidance (e.g., "Choose an answer to continue"), not color alone.
8. Results communicate correct/incorrect in words, not solely color or symbols. Source links have discernible names and open-new-tab behavior explained.
9. Decorative illustration is `aria-hidden`; meaningful road signs require concise alt text, source attribution, and text-only fallback. Do not use icon glyphs as the sole label.
10. Minimum touch target 44×44 CSS px or sufficient spacing for links/radio options on mobile; verify measured layout.
11. Text zoom to 200% and browser zoom to 400% at 1280px must preserve reading order and access to Finish; no fixed-height clipping.
12. Check contrast of normal text >=4.5:1 and large text >=3:1, with visible control boundaries; check reduced-motion setting for transitions.
13. Use one `h1` per route, meaningful headings and landmarks, and a skip-to-main-content link. Current layout has no skip link; track as M3 gap.
14. Announce save failure in `role=status` without blocking access to results; malformed or insufficient bank must produce readable `role=alert` feedback.
15. Browser Back/Forward and refresh must not create phantom quiz attempts; a submitted result is saved at most once. Current refresh of unfinished quiz resets progress; track as M3 recovery gap.
16. Offline test: after initial online load, verify routes and saved history without connectivity on mobile and desktop. Static export alone is **not** offline-launch support; service worker/PWA caching remains unimplemented.

## Implementation and test handoff

- Current files inspected: `src/app/page.tsx`, `src/app/practice/page.tsx`, `src/components/practice-quiz.tsx`, `src/components/dashboard-progress.tsx`, `src/app/signs/page.tsx`, `src/app/about/page.tsx`, `src/app/layout.tsx`, `src/lib/progress.ts`, `src/lib/quiz.ts`, `src/app/globals.css`.
- Suggested follow-up M2/M3 components: mode picker, quiz-state controller, results/review, mock, mistakes, signs catalog, focus manager, error/empty-state UI, skip link, and offline shell. Do not create unapproved new backend.
- Test plan: Playwright keyboard traversal and mobile screenshots; axe-core accessibility scan; manual VoiceOver/NVDA; offline airplane-mode test; unit tests for incomplete banks and persistence failures.
- Exit criteria for RR7-M1-05 **spec**: all seven MVP journeys have entry/exit/error states, present-versus-planned status is explicit, keyboard/mobile checks are measurable. Actual UI acceptance remains unverified until browser tests.
- Rollback: revert this documentation-only commit; no runtime behavior or stored user data changes.
- Priority content issue remains: `intro-08` demerit threshold wording must be corrected before release (P0). `intro-05/06/07` editorial fixes pending.
