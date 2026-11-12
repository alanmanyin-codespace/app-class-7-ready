# Class 7 Ready — Next.js starter

Class 7 Ready is an **unofficial**, independent Alberta Class 7 learner knowledge-test practice app. This repository bootstrap uses **Next.js App Router + React + TypeScript + Tailwind CSS** with a statically exported site.

## Current scope
- Responsive landing/dashboard and original **10-question starter quiz** with answer explanations and direct source links.
- Quiz selection/score helpers validated with native Node.js tests (including the official-format 25/30 threshold as a future mock-exam rule).
- Local browser-only history for starter attempts (localStorage, up to 100 records), with a safe fallback when unavailable.
- Road-sign information/roadmap page and clear unofficial-site disclaimer.
- **Not yet implemented:** full 66-question bank, real 30-question mock exam, topic mastery, mistake review, downloadable PWA/offline launch, production deployment, and cloud sync.

## Get started
Requires Node.js 22+. The repository bootstrap has no `node_modules` or lockfile because dependency installation has not yet been completed in the scaffold environment. Generate and commit a lockfile at first successful install.

```bash
npm install
npm run dev
# http://localhost:3000
```

Validation:

```bash
npm run test       # Node.js test runner; runs without downloaded dependencies
npm run lint       # after npm install
npm run typecheck  # after npm install
npm run build      # after npm install; static output in out/
```

## Deploy to Vercel
1. Connect the GitHub repository to Vercel after the initial commit is verified.
2. Import the repository into Vercel with the **Next.js** framework preset. Root directory: repository root. Build command: `npm run build`. The Next.js config enables `output: 'export'` and produces `out/`.
3. Do not enable production deployment until the app and content pass the milestone release gate.

> Initial scaffold was prepared separately and is not a production deployment. Verify the GitHub commit, build, and preview before any public release.

## Data and trust
- Starter questions are **original educational material**, linked to Alberta government pages with checked date `2026-11-08`. They are not official test questions.
- Before adding rules and signs, validate them against the latest official Alberta Driver's Guide and licensing pages.
- User results remain in localStorage on their device; no remote collection is configured.
- A manifest is included for groundwork, but no service worker is installed. Do **not** claim the website is fully offline/PWA-ready yet.

## Project management
Master SOP and hourly development milestone log:
https://docs.google.com/document/d/1DLkXyRbhCvBPr5NiHhjfuvgBBONKH4QB6q5GJ6mahng/edit
