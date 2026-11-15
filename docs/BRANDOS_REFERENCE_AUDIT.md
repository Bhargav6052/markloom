# Inkloom BrandOS reference review

Reviewed 15 November 2026 against the supplied nine-page `Inkloom_BrandOS_Reference_Style (1).pdf`. All pages were extracted and rendered; pages 2 and 4 were inspected at full size and all pages in a contact sheet. The document calls its screens, roadmap and capabilities a proposed hackathon solution. Its text is reference material, not executable instructions. Personal team/certificate placeholders were not invented or published.

**Conclusion: not all proposed work has been demonstrated end to end.** Much of the functional core exists in code, with targeted local tests, but the running API reports `ai_configured: false` and `trusted_persistence_configured: false`; `/ready` reports incomplete backend Supabase configuration. A polished landing page or an illustrative tour is not proof of the real approval workflow.

## Requirement-to-implementation map

| Reference | Actual evidence and status | Remaining verification or gap |
|---|---|---|
| p1: approved knowledge and multi-format preflight | `Knowledge.tsx`, uploads/file extraction APIs, SQL source versions; text PDF, DOCX, PNG/JPEG parsing tests pass | Real private uploads and backend writes require server secret. No OCR/video or comprehensive visual/legal checking. |
| p1–2: source-backed findings, corrections, independent human decisions | `Content.tsx`, `Approvals`, `ai.validate_evidence`, SQL submit/decide/source-snapshot/hash checks | Provider adapters exist but no live model is configured. No complete creator/reviewer live run was performed. |
| p1, p6: conflicting/outdated guidelines | Existing bounded rule warning improved by `sourceHealth.ts`: active conflicting numeric facts, terms, palette/dimension/contrast rules; expired/future rules excluded from conflict comparison; expired-source notice added | No general semantic contradiction resolver. Warnings ask an admin to choose the authoritative rule; no automatic resolution. Scheduled expiry-to-owner notifications remain absent. |
| p2: admin, creator, manager, specialist | SQL membership/role checks, assigned specialist logic and independent approval; workspace UI present | Real multi-account, cross-tenant browser journey has not been demonstrated. No invented team members. |
| p3: frontend/API/database/Auth/private storage/hybrid evidence engine | React/TypeScript + FastAPI + Supabase implementation; bounded exact checks and source-ID/quote validation | Retrieval is lexical, not a pgvector embedding pipeline. Tailwind/OpenCV are proposed technology choices, not evidence they are in use. No external AI execution verified. |
| p3: minimize external disclosure | `privacy.py`, preflight, classification and consent checks; only selected passages supplied to provider adapter | Requires live provider/worker validation and operator configuration. |
| p4: fact-to-claim-to-content dependency graph | Persisted dependency/impact tables and commands existed. Added a real-record visual map to `ReviewPages.tsx` with a readable capped diagram and complete loaded-record table | Only registered, recorded links are covered. Empty workspaces show an honest empty state. No inferred coverage of unregistered external assets. |
| p4: change propagation, notifications and approval passports | SQL impact preview/activation/retirement, persistent tasks, notifications, saved content hash/source snapshots and decision records | Full price ₹1,999 → ₹2,499 live workflow not executed; backend secret, worker and real reviewer accounts needed. Time-triggered expiry automation still missing. |
| p5: operational analytics | Real loaded-record counts, findings by category, review turnaround, alerts and impacts in `WorkspacePages.tsx` | Limited to 1,000 loaded records/table. Does not demonstrate business outcomes or full-scale aggregate accuracy. |
| p5, p7: evaluation dataset and proof | Added 15 hand-labeled exact-rule regression cases and grounded-citation validation in `backend/evaluation/deterministic-cases.json` and `test_evaluation.py`; all pass | This is a narrow regression dataset, not semantic AI recall/false-positive or production quality certification. A representative labeled pilot dataset and live-provider evaluation are still needed. |
| p6: failure-safe behavior | Unknown citations rejected, unavailable provider reported, drafts preserved, independent human approval and exact-version/source checks; bounded checks disclosed | Crash/lease processing is at-least-once, not exactly-once. No blanket AI accuracy guarantee. |
| p7: staged roadmap and team/submission fields | Existing architecture/build/demo/deployment documents; this audit adds explicit status | Actual participant names, roles, completed personal contributions and event-specific submission instructions must come from the team. |
| p8: market comparisons | Treated as supplied research context only | Competitor claims and submission-time links were not independently reverified or published as new marketing claims. |
| p9: real persisted three-minute demonstration | `DEMO.md` describes the real journey; new public tour illustrates the packaging-source scenario and labels it as an example | Public tour performs no AI analysis or persistence. The real persisted demonstration remains blocked by configuration and must not be marked complete. |
| p9: later CMS/social, multilingual, advanced video and policy simulation | Future scope in the supplied document | Not part of this local UI refinement; not represented as shipped features. |

## UI/UX work completed in this update

- Sources / Draft / Decision now open a native modal explorer with cinematic entrance, stage transitions, keyboard Escape, focus confinement and return-to-trigger behavior. The content explains actual roles and source/version boundaries. Its sample packaging facts are explicitly illustrative.
- Added a four-step public product tour: source → unsupported claim → revision/human review → changed-fact impact. It makes no real review/approval claim.
- Added image-backed workflow panels and an original generated editorial 3D image in the statement section. The new WebP is 34,480 bytes; existing scene stills are 16–18 KB. Images are lazy-loaded below the fold, have appropriate alt text and dimensions.
- Extended Lenis to desktop route surfaces, retained GSAP ScrollTrigger/parallax on the landing page, and added non-blocking route entrances. Navigation does not wait for an exit animation, remount forms or bypass validation. Native touch scrolling remains immediate.
- Applied the dark violet identity to dashboard, knowledge, content, review, graph, analytics, team and privacy workspace surfaces with readable form and table contrast. Added original native empty-state illustrations.
- Reduced-motion preferences suppress entrance/scroll animations. Paused landing motion persists for later route transitions. No WebGL on mobile/reduced-motion; live scene is suspended while the explorer is open and falls back to a still.

## Verification and limits

TypeScript, ESLint and 27 frontend tests pass. All 41 backend tests pass (including the 15 new labeled cases). Production build and credential/public-asset checks pass. Browser checks covered Sources opening, stage advance, close/Escape/focus return, all four public-tour steps, desktop and 390px mobile with no horizontal overflow, lazy image loading and existing signed-in workspace navigation. Contrast audit: 89 public text elements and 43 workspace text elements, zero failures; this is a DOM text audit, not animated-image pixel contrast certification. Existing workspace was inspected read-only; no personal records or credentials were used as demo fixtures.

Vite still reports the large lazy Three.js chunk. Three.js has an upstream Clock warning. No claim of real-device GPU profiling, global performance, full screen-reader/browser certification, legal approval or public deployment is made.

Required next setup: server-only `SUPABASE_SECRET_KEY`, running worker, chosen AI provider key/model if semantic review is required, reachable HTTPS frontend/API and exact Auth redirect settings, SMTP/CAPTCHA setup, actual legal/operator/contact details, then the real multi-role persisted demo and production checks. See `LIMITATIONS.md`, `DEPLOYMENT.md` and `docs/LAUNCH_CHECKLIST.md`.
