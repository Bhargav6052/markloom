# Current hosted status — 21 November 2026

The frontend is deployed at https://markloom-ochre.vercel.app/ and the FastAPI API and worker have Railway deployments. After Saturn PR #16 was merged, deployment checks for Vercel and both Railway services succeeded; 102 frontend tests, 103 backend tests and PostgreSQL integration CI checks passed. This is evidence of deployment and automated tests, **not** a complete live-account audit, AI accuracy benchmark, security certification, or SLA.

The older November 15 report below describes configuration and test gaps **at that earlier date**. Its claims about hosting/worker setup should not be used as today's runtime status. Actual provider configuration, email delivery, full authenticated journeys, legal/operator details, external model precision/recall, 10-draft benchmark and five-scenario impact demonstration still require independent verification. The landing examples are explicitly illustrative.

---

# Latest public-site status

Privacy/Terms/Contact pages, consent controls, SEO/social/favicon/crawler assets, custom 404, validation, CAPTCHA integration, anonymous analytics infrastructure, secret guards and HTTPS/CSP deployment configuration are now implemented. The original product/credential limitations below still apply. Public notices remain drafts until real operator/contact details and legal review are supplied. Analytics table is installed but no events are collected without server credentials; Turnstile requires Supabase-side enforcement configuration. TLS and real 404 HTTP status need deployment verification; no production domain/DNS or Docker runtime is available. See docs/LAUNCH_CHECKLIST.md for the current checklist.

---

# Launch blockers and scope limits

Updated 15 November 2026. The product is a tested development implementation, **not ready for worldwide public use**.

## Setup-dependent blockers

- Backend `SUPABASE_SECRET_KEY` is absent. Real backend uploads, policy changes, privacy requests and analysis queue writes need it. No deployed worker or recent production heartbeat exists.
- No AI key/model is configured; no provider-account terms/tier/region have been verified. No external model was called. Local deterministic checks require a running configured worker and remain limited in coverage.
- Signup, verified email, password recovery/expiry, logout/refresh, real-account tenant isolation, private upload/download and the complete live approval/impact journey have not been executed. Production SMTP and Auth allowed redirects need configuration.
- Public frontend/API/worker hosting, domain/TLS, incident ownership, backup restoration, concurrency/load testing and regional performance remain unverified. Docker is unavailable on this machine, so images/Compose were not executed.
- The chosen Supabase project shares Auth with an existing learning application and its profile-creation trigger. Existing objects were preserved; operator review/account isolation is required before launch. Existing `handle_new_user` function execute warnings and disabled leaked-password protection were reported by Supabase advisors and not changed for the other app.

## Not implemented or still bounded

- Lists and overview calculations load at most 1,000 rows per table. They are explicitly labeled as loaded-record counts. Server aggregation, full pagination/search and targeted detail retrieval are required before large datasets.
- Email invitations, invitation resend/revoke UI, member deactivation/removal, MFA enrollment, profile editing, scoped agency/campaign access and broader account lifecycle are incomplete.
- Data export/deletion requests are recorded; fulfillment, admin case management, automatic retention purges, legal holds and published privacy notices are not implemented. No automatic deletion or legal compliance certification is claimed.
- Advanced brief/scoping rules, full-text search, source expiry scheduled impact handling, rule dependency impacts beyond existing fact links, asset rights/license lifecycle, connectors/webhooks, durable notification outbox and user-defined agent tools are not implemented.
- Worker processing is at-least-once after lease expiry. A crash after a provider receives a request may cause a later duplicate attempt or leave an `attempting` event with unknown delivery. There is no exactly-once provider guarantee. Explicit failures are terminal until manually retried.
- Version hashes bind saved text and original binary hash; metadata is version-bound by ID but is not included in that hash. Original approvals are read-only for browser roles. Operators with privileged DB access remain trusted.
- PDF support is selectable text only, <=100 pages; DOCX, PNG/JPEG are bounded. No OCR, malware scanning/quarantine, video analysis, transformed-logo recognition, arbitrary raster contrast certification or legal certification.
- nginx has a single-instance API rate limit. Distributed abuse controls, CSP tuned to the production origin, alerts/traces and isolated extraction workers require production work. Uploaded files are parsed with bounds but not sandboxed against all parser vulnerabilities.
- Browser QA covered public pages and signed-out protection at desktop/390px. Authenticated accessibility/keyboard, all target browsers, screen readers and measured performance budgets remain unverified. Three.js currently emits a Clock deprecation warning; build reports large lazy chunks.

These are explicit gaps against the original master prompt, not completed stages or guarantees of global availability.
