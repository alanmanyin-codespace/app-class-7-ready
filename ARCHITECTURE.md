# Architecture decision — 2026-11-08

**Decision:** Next.js 16 App Router, TypeScript, React 19, Tailwind CSS 4, static export (`output: 'export'`) with browser-only quiz state. Hosted on Vercel when authorized.

**Reasons:** searchable static pages, familiar React development, low-hosting complexity, ability to share core quiz logic across views, and no user-account or backend dependency for MVP.

**Trade-offs:** static export intentionally excludes server actions, route handlers requiring runtime, dynamic rendering, Next image optimization and server-side persistence. No automatic offline app shell; needs explicitly tested service-worker caching later.

**Domain boundaries:**
- `src/lib/quiz.ts` is a side-effect-free question validator, unbiased Fisher-Yates sampler and scorer.
- `src/data/questions.ts` is a small, auditable, cited original starter bank. Replace/extend only after coverage and validity review.
- `src/lib/progress.ts` holds local persistence; migrate to IndexedDB only if requirements demand larger/durable data.
- `src/components/*` contains client-facing interactions; `src/app/*` contains static routes and metadata.

**Quality gates:** deterministic unit tests, lint, typecheck, production build, question-source review, responsive/keyboard smoke checks. For now only tests runnable without dependencies are verified.

**Next gated work:** secure GitHub write access and push archive; generate lockfile; run CI/build; verify preview; expand topic-balanced question bank; implement mistake review and full mock only after >=30 reviewed questions.
