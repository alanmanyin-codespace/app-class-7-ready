# Vercel Web Analytics — Class 7 Ready

## Scope

Class 7 Ready uses the `@vercel/analytics` Next.js integration in `src/app/layout.tsx` to capture **anonymous, aggregate page views** for App Router routes on Vercel. The package version is pinned in `package.json` and `package-lock.json`. The site has no account, and quiz progress remains in browser-only storage. **Do not add personally identifying data, raw answer responses, email addresses, identifiers or localStorage values to analytics.**

Vercel Web Analytics is *not* individual user/session tracing or screen replay; it does not track a person's complete sequence of interactions. On the connected Hobby team, custom events are not available, so do not implement calls to `track()` or claim quiz-answer tracking.

## Activation checklist (Vercel dashboard, project class-7-ready)

1. Open https://vercel.com/alanmanyin919s-projects/class-7-ready/analytics .
2. Select **Enable** under Web Analytics if it is not already enabled. This enables the project intake routes after a subsequent deployment; no paid add-on is required for base Hobby web analytics within the plan's limits.
3. Once PR #1 has passed CI and is reviewed, authorize a deployment/merge separately. A preview deployment may be useful for validating the script before a production release. This document does **not** authorize merging, promoting or deploying.
4. In browser developer tools, inspect the Network panel on the deployed site. On a fresh load and after navigating to another route, look for a successful `/view` request under the Vercel insights/unique analytics route. Page-view counting requires the Vercel project to have analytics enabled and the deployment to contain this code; ad blockers or privacy settings may block requests.
5. Use Vercel project > Analytics to view pages, routes, referrers, device information and aggregate visitors. Choose the correct environment/date range. Expect zero data until someone loads an instrumented deployment.

## Data boundaries and expected behavior

- App routes (/ , /practice, /signs, /about) tracked via Next.js route integration. Do not send full quiz answers or question IDs as query parameters in tracked page URLs.
- No analytics in local development by default. Page views may appear only after the Vercel Analytics service is activated and a deployment is visited.
- No cookies are set by Vercel Web Analytics; data is aggregated. This does not constitute session replay or user-level tracing.
- Vercel's privacy documentation explains optional `beforeSend` URL redaction. Implement it before adding user identifiers or dynamic sensitive routes. Revisit privacy copy before public production release.

Official docs: https://vercel.com/docs/analytics/quickstart ; https://vercel.com/docs/analytics/privacy-policy ; https://vercel.com/docs/analytics/using-web-analytics ; https://vercel.com/docs/analytics/limits-and-pricing .
