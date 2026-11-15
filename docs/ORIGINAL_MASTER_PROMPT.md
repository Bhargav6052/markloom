# BRAND GOVERNANCE PLATFORM — ONE-PASTE FULL-STACK BUILD CONTRACT

> **Purpose:** Paste this whole file into Codex in your existing repository. It includes a global contract and ordered individual implementation prompts. For lower-context runs, paste `00_GLOBAL_CONTRACT.md` once and the stage files one at a time in order. This is a **specification**, not evidence that an app has already been built.

## Product and non-negotiable outcome
Build a **real, multi-tenant, AI-assisted brand-governance SaaS** for organizations, marketing agencies, creators, brand managers and authorized specialist reviewers. It must review actual submitted content against **approved, versioned organization evidence**, suggest corrections preserving meaning, obtain **human approval for an exact immutable version**, and flag affected content if a fact/policy/asset changes. Distinguish `LIVE`, `CURRENT_AS_OF`, `STALE`, `UNVERIFIED`, and `ERROR` states. **Never pass demonstration records off as live company data**.

An original premium UI includes a cinematic 3D public landing page, a fast and clear authenticated workspace, and a **persistent shield icon labeled Privacy** that opens an operational, truthful Privacy Center showing live configuration and actual system processing events.

**Users:** Organization Admin, Creator, Brand Manager, Authorized Specialist Reviewer (e.g. legal/product/accessibility). A global SaaS operator is a separate audited system role; do not create hidden cross-tenant access. Agency collaborators may be invited with limited org-scoped permissions.

**Business workflow:** signup/login → create/join org → configure privacy/AI → approve brand guidelines, facts, terms and assets → brief + draft text/image/PDF/DOCX → classify and check data-sharing eligibility → extract content → run deterministic checks and permitted real AI agent tools → source-cited findings → creator accepts/edits/rejects suggestions → new immutable version → specialist/manager review and comments → human approves exact content hash → publishing passport/export → admin changes approved evidence/asset → dependency impact preview and activation → affected content flagged for re-review, event notifications and live analytics.

## Preserve, inspect and verify
1. First inspect every relevant current repo file, migrations, connected Supabase configuration, environment example, existing routes, tests and uploaded reference video at `design-reference/reference.mov` if available. **Continue the working repository; no resetting existing DB, deleting users or replacing functioning services.** Do not claim to have seen the video if inaccessible.
2. Create/maintain `PROGRESS.md`, `ARCHITECTURE.md`, `API_CONTRACT.md`, `SECURITY.md`, `PRIVACY_DATA_MAP.md`, `PRIVACY_POLICY_REVIEW.md`, `TEST_RESULTS.md`, `LIMITATIONS.md`, `DEMO.md`, `.env.example`, migrations and lockfiles.
3. If Supabase project is inactive or keys unavailable, report it, **do not fabricate production connectivity**. Build all unblocked local code and clearly mark remote tests `BLOCKED`; pause on required private credentials, project selection and deployment authorization only.
4. Prefer existing compatible stack, otherwise React + Vite + TypeScript + Tailwind + TanStack Query + React Router + react-hook-form/zod; Python FastAPI + Pydantic + pytest; Supabase Postgres/Auth/Private Storage/Realtime; Pillow/OpenCV/PyMuPDF/python-docx; hosted Gemini/OpenAI through a server-side provider adapter. `pgvector` for embeddings only if useful; use a simple transactional Postgres dependency graph (no unnecessary Neo4j). Use Recharts and Playwright. Pin package versions, use official docs to verify current APIs, do not rely on obsolete SDK calls.
5. For real 3D public scene use `three`, `@react-three/fiber`, `@react-three/drei`, and one motion engine (e.g., motion or GSAP). Lazy-load WebGL; ship reduced-motion, WebGL-unavailable and mobile fallbacks. **No copied brand, scene objects or exact visual arrangement from the reference video.**
6. Security: real JWT validation on backend; org membership authorization *per route/action*; RLS on all exposed Postgres tables and Storage; private signed URLs; `service_role`/secret keys never in browser; no authorization from editable `user_metadata`; no `security definer` shortcut; immutable approval/audit history; scoped access by organization in every query. If using backend privileged DB access, manually enforce authorization and test tenant isolation, and prefer least-privileged access.
7. No fake loading simulations, hardcoded AI answers, front-end-only approvals, static statistics, dead buttons, fabricated citations or claims of compliance certifications. Synthetic fixtures may be used **only** in isolated tests and a visibly labeled, separate optional demo workspace; not in real users' activity or analytics.
8. AI can *propose* findings, explanations, tool actions and corrections but **never publish or finally approve**. Actual tool calls use validated schemas, explicit permissions, limits, timeouts and logs. All saved updates go through backend authorization/state-machine checks; agents never get unrestricted SQL or browser credentials.
9. Do not create external accounts, paid services, external deployment, or destructive migrations without my authorization. Report honest results and continue sequentially where possible. In chat keep progress terse; use files for durable detail. When interrupted, read `PROGRESS.md` and continue.

## Grounded privacy and live-data rules
- `Real-time` means read current authorized records or receive database/webhook events and show their actual timestamps, processing status, provider and source; **not** running a generic web search or pretending every product fact is globally true. Company-approved source material remains the authority for brand claims. External feeds/CMS APIs require configured authorized integration, sync status, timestamps, provenance, retries and explicit freshness TTL. Outside-web facts must remain unapproved candidates until an Admin/SME verifies them.
- Actual AI calls require configured provider credentials and a permitted data class, with provider/model/tokens/status logged appropriately. If no key: `Not configured — analysis unavailable`; do not silently substitute canned outputs. If service fails: `Provider unavailable` with retry/manual workflow. No promise of instantaneous internet knowledge.
- Personal/confidential data defaults: `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`. Default `CONFIDENTIAL` and `RESTRICTED` to **no external AI transmission**. Org policy may be stricter. Show preflight summary of data categories and recipient provider before a permitted external call. `RESTRICTED` must never be sent to external API without a separately reviewed enterprise policy—not an ordinary toggle. If blocked, run local deterministic checks and assign human review.
- **Privacy Center**: add an accessible shield icon in authenticated header/sidebar labeled `Privacy`, linking to `/app/privacy`; public footer links `/privacy`. These are real functional routes. The center shows the actual current data inventory, provider configuration, actual recent AI disclosures, sensitivity and consent/policy events, retention/deletion configuration and real requests statuses. Policy prose is versioned, Admin-reviewed and reflects actual backend capabilities. Operational facts are generated from config/database (not a static invented promise). Legal text is a reviewed draft pending responsible admin/legal publication. Never copy a competitor's legal policy or falsely claim GDPR, DPDP, HIPAA or SOC 2 certification.
- Verify provider privacy terms for the *actual account/tier*, model and feature before presenting training/retention statements. Example: OpenAI API is generally not trained on API data by default, but may retain abuse logs/application state; Gemini Developer API free and paid tiers have materially different data-use terms. A `not verified` notice is preferable to fabricated guarantees.

## Architectural boundaries
- Frontend UI → typed API client → authenticated FastAPI routers → services (brand knowledge, content, privacy gate, analysis agent, review, fact-change, notifications) → data repository/Postgres/Auth/Storage. Background analysis jobs must be **durable** (DB job table + worker claiming/retry/lease, or verified production queue). Realtime via Supabase Realtime with authorization or authenticated SSE/poll fallback. Avoid a polling loop without cleanup.
- Text extraction/indexing: chunk with content provenance (document, version, page/section, checksum, status); searchable Postgres full-text is baseline, optional org-filtered pgvector embeddings. Only current approved in-scope facts are authoritative. Source validation on backend rejects invented IDs, nonexistent snippets, unrelated tenant references and out-of-scope evidence. Statuses: `SUPPORTED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE`, `NOT_APPLICABLE`, with uncertainty and explicit missing-evidence distinction.
- Version-bound decisions: persist SHA-256 hash over canonical content and/or original file bytes, content_version_id, approved fact versions, policy/rule version IDs, reviewer, timestamp and decision. Any materially edited version requires fresh review; later source changes flag dependencies without modifying live external posts.
- Operations/integrations: idempotency keys, outbox events, database transactions around fact activation/impact records, rate limiting, input validation, API errors, pagination, structured logs without raw private content, observability/health checks and recovery/backup docs. Separation of public marketing demos and real tenant data.

## Suggested org-scoped data model (adjust to existing schema, no duplicate tables)
`organizations`, `profiles`, `memberships`, `invitations`, `brand_documents`, `document_versions`, `brand_rules`, `rule_versions`, `rule_scopes`, `brand_terms`, `approved_facts`, `fact_versions`, `evidence_chunks`, `brand_assets`, `asset_versions`, `asset_rights`, `campaign_briefs`, `submissions`, `content_versions`, `extracted_claims`, `claim_evidence_links`, `analysis_jobs`, `analysis_runs`, `findings`, `finding_sources`, `suggestions`, `review_assignments`, `review_comments`, `review_decisions`, `publishing_passports`, `fact_change_proposals`, `impact_events`, `notifications`, `audit_events`, `event_outbox`, `integration_connections`, `sync_runs`, `privacy_classification_rules`, `ai_processing_policies`, `ai_provider_configs`, `data_inventory`, `processing_events`, `privacy_policy_versions`, `privacy_acknowledgements`, `privacy_requests`, `retention_jobs`, `agent_tool_runs`, `reviewer_feedback`.
Every tenant-owned table has immutable `organization_id` plus appropriate FK/checks and RLS; sensitive storage paths must be org-scoped. Build indices for status, version, org, dependency lookups and events. Store provider secrets only in server-side secret configuration, **never** in plaintext table rows.

## Contracted API categories (consistent, versioned `/api/v1`)
- `GET /health`, `GET /ready`; `GET /me`; `/organizations`, `/members`, `/invitations`.
- `/brand/documents`, `/brand/rules`, `/brand/facts`, `/brand/assets`, `/brand/terms`, `/brand/conflicts`.
- `/content/submissions`, `/content/versions`, `/content/uploads`, `/content/briefs`.
- `/analysis/jobs` (create, status, results), `/analysis/findings`, `/analysis/suggestions`, `/agent/tool-runs` (read-only authorized history).
- `/reviews/queue`, `/reviews/assignments`, `/reviews/comments`, `/reviews/decisions`, `/passports`.
- `/evidence/graph`, `/facts/change-proposals`, `/facts/impact-preview`, `/facts/activate-change`, `/impacts`.
- `/privacy/status`, `/privacy/data-map`, `/privacy/processing-events`, `/privacy/preview-ai-transfer`, `/privacy/policies`, `/privacy/acknowledgements`, `/privacy/requests`, `/privacy/retention`.
- `/notifications`, `/analytics`, `/audit`, `/integrations`, `/integrations/sync-runs`.
Document request/response schemas, pagination, errors, role permissions and live status semantics in `API_CONTRACT.md`. Do not promise routes not actually implemented.

## Definition of done for every stage
A stage is `DONE` only if code exists, frontend feature connects to real backend/DB, authorization is checked, tests relevant to that stage executed with results in `TEST_RESULTS.md`, errors are handled and old working flows still pass. If blocked by missing external credentials, mark `BLOCKED` with specific missing setup and continue unrelated stages. Do not call placeholders complete. Correct an implementation error before proceeding to new decorative features. Keep visuals beautiful, but **the end-to-end working application outranks animation**.

---
## Ordered Codex stage prompts

Run in this order; each prompt is also supplied as a separate file in the ZIP. Each prompt depends on global contract above and the prior working stages.

---
### STAGE 00 — REPOSITORY AUDIT + EXECUTION BLUEPRINT

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 00: REPOSITORY AUDIT + EXECUTION BLUEPRINT** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Inspect the current application files, routes, state, build config, migration history, Supabase project ref/status and existing UI. Do not change production data. List functioning services vs mock/hardcoded screens and mapping to the required product. Study the local provided recording if available, extract its spatial style and movement patterns without copying. Draft `ARCHITECTURE.md`, `API_CONTRACT.md`, `PROGRESS.md` with a feature matrix `EXISTS / MISSING / BLOCKED / TESTED`, integration list, privacy threat model and phase sequence. Check official SDK release docs and project node/python versions. Decide one main auth session strategy (Bearer JWT or secure cookie) and one durable background-job approach and write why. Inspect current Git working tree; never erase user edits. Identify current missing credentials and exactly where they belong (`frontend/.env.local`, `backend/.env`, both gitignored). Avoid printing secrets. If current project is inactive, don't implicitly restore or migrate it without explicit selection.

**Acceptance gate:** A documented current state; repository unchanged except non-destructive docs; next stages have a coherent plan; no invented assertions.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 01 — FOUNDATION, ROUTING, DESIGN SYSTEM AND SERVICES

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 01: FOUNDATION, ROUTING, DESIGN SYSTEM AND SERVICES** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Make existing app or scaffold monorepo work on Mac. `frontend` Vite React TypeScript and Tailwind + router/query + typed forms; `backend` FastAPI Pydantic layered architecture. Add `.env.example` (no secret values), `README.md` exact local commands, `/health`, `/ready`, CORS strict origins, typed error envelope, API client with auth injection, project logging, retries only when idempotent, lockfiles and dev scripts. Build design tokens: midnight graphite, blue-slate, ice teal, opal, copper, large editorial type, calm neutral authenticated workspaces, no unnecessary icons. Shared components: Button, Input, FormField, Modal, Alert, Skeleton, Table, PageHeader, Toast, EmptyState, ErrorBoundary, PermissionGate, SourceCitation, StatusChip. Routes protected but not faked: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/privacy`, `/app/*` with initial real route boundaries. Set up Playwright/pytest/Vitest, CI example. Provide simple 2D site shell; postpone expensive scene to stage 16.

**Acceptance gate:** Both servers start and frontend health-status check calls actual backend; builds/types/lint tests pass; all links have real destinations or are visibly disabled with reason.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 02 — AUTHENTICATION, PASSWORD RESET AND SECURE SESSION

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 02: AUTHENTICATION, PASSWORD RESET AND SECURE SESSION** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Integrate actual Supabase Auth provider and project **only if user-selected active**. Build accessible login/signup/recovery/update password/email confirmation and logout. Correct frontend auth initialization, session refreshing and protected navigation; backend validates JWT issuer/audience/signature/expiry using current recommended SDK/JWKS guidance and obtains auth.user ID—not user-submitted ID. Use routing guards but always recheck auth server-side. For reset emails configure allowed redirect domains/production auth redirects, display accurate delivery/error states, handle expired and revoked tokens. Implement `GET /me`, user display info, user profile editing, session state and rate-limit sensitive endpoints. For unavailable Supabase, show configuration guidance instead of fake login. Cover sign-in, wrong password, email verification settings, reset, logout, direct-route unauthorized access, token expiry and multi-tab session update.

**Acceptance gate:** Actual signup/login/logout/password recovery and protected server requests verified against connected project; no static bypass credential; failures handled. If remote setup unavailable mark BLOCKED.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 03 — DATABASE SCHEMA, MIGRATIONS, STORAGE AND TENANT RLS

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 03: DATABASE SCHEMA, MIGRATIONS, STORAGE AND TENANT RLS** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Inspect existing schema and migrate in forward-only reviewed steps, preserving data. Create normalized tables from global model prioritized for active features; avoid creating all 40 empty tables if a verified staged migration strategy is cleaner, but complete required tables across following stages. All `public` exposed tables RLS enabled plus SELECT/INSERT/UPDATE/DELETE scoped to org membership and permission; ensure UPDATE has SELECT/USING/WITH CHECK and correct tenant immutability; avoid relying on user-editable metadata. Private Supabase Storage buckets for original sources/content/approved assets and gated signed URL endpoints. Validate file MIME by sniffing, extension/size bounds, block path traversal and malicious payloads, configure safe PDFs/docs processing and antivirus hookup optional (do not falsely say scanned if not implemented). Schema handles UUIDs, FK, unique per org, lifecycle status, soft-delete where retention requires, datetime timezone. Create schema diagrams and RLS policy tests with two orgs, Admin, Creator, external Reviewer, unauthorized guest and missing org membership. Use CLI `--help` and current docs before migrations; never `DROP` prod user data without permission.

**Acceptance gate:** Repeatable migrations on clean test DB, successful upload/download with permission, unauthorized cross-tenant requests rejected, Supabase data accessible only according to RLS.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 04 — ORGANIZATION ONBOARDING, ROLES, INVITES AND AGENCY ACCESS

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 04: ORGANIZATION ONBOARDING, ROLES, INVITES AND AGENCY ACCESS** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Design first-run wizard: organization name/industry/region, workspace slug, primary Admin, choose initial privacy settings; user accepts published privacy notice (when required) and creates org, then lands dashboard. Admin adds Creator/Manager/Reviewer with email invitation token, expiry, revoke/resend, role and optional limited campaign/market scope. Never accept an arbitrary role from signup. Implement membership server authorization and active org context. Multi-org switching always changes query keys, invalidates stale cache, closes websocket streams and prevents cross-tenant leakage. Agency guest access with limited resources is optional but invitation permission framework should support it. Build pages `/app/team`, `/app/settings/organization`. Track invitation, role and org changes in audit log. Test creator cannot grant self Admin, reviewers cannot modify approved facts and member removed loses access.

**Acceptance gate:** Onboard org, invite and join users, restrict pages and APIs by actual role, auditable changes, no cross-org information.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 05 — AUTHENTICATED WORKSPACE + ACTIONABLE DASHBOARD

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 05: AUTHENTICATED WORKSPACE + ACTIONABLE DASHBOARD** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Implement original polished dashboard, fixed left navigation, org selector, searchable header, activity feed and keyboard-accessible mobile drawer. Route `/app/dashboard`, `/app/brand`, `/app/facts`, `/app/assets`, `/app/content`, `/app/analysis`, `/app/reviews`, `/app/evidence`, `/app/impacts`, `/app/analytics`, `/app/notifications`, `/app/team`, `/app/settings`, `/app/privacy`, `/app/audit`. Each allowed navigation item routes to a working page as it is built; for future modules use a transparent 'not yet configured' state, not a pretend functioning component. Dashboard GET aggregates actual tenant counts of submissions, pending human approvals, violations, flagged assets, due expiring facts, recent activity and tasks assigned to logged-in user. Use pagination, URL filters, loading/retry/error/empty states. Privacy icon: visible shield-check in sidebar/header *now* linking to a real preliminary Privacy Center route whose functional data features follow Stage 8; don't label incomplete features complete.

**Acceptance gate:** Real auth+org-scoped dashboard metrics, navigation and permitted actions; responsive 390-1920px, keyboard accessible, no invented graphs.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 06 — BRAND KNOWLEDGE, CURRENT FACTS, SCOPED RULES AND ASSET LIBRARY

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 06: BRAND KNOWLEDGE, CURRENT FACTS, SCOPED RULES AND ASSET LIBRARY** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Admin workspace uploads real brand guidance PDFs/DOCX, uses PyMuPDF/python-docx to extract text/sections/page provenance and creates reviewable proposed rules, not auto-approved guidance. Admin can approve/reject/retire rule versions with effective dates, channels, region, audience, product, scope precedence and block/minor status. Manage terminology preferred/prohibited, tone exemplars, message hierarchy, required disclaimers, product fact versions and approved claims with source/methodology/expiry; maintain citation map and checksum. Simple conflicting-rule detector for exact contradictory values/overlapping scope; send conflict to Admin rather than using one arbitrarily. Brand assets: authorized logo versions, allowed palette/usage/rights owner/license expiry and private previews, tags and search. Choose a real brand/source retrieval policy with organization+status+date+scope filters and FTS baseline; pgvector embeddings optional with org-scoped permission tests. Never treat downloaded third-party claims or uploaded unapproved sources as company-verified facts. UI includes source detail and review history.

**Acceptance gate:** Admin can upload an actual doc, approve a fact with supporting source and retrieve exact page/version; expired and unapproved source excluded from authoritative verification.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 07 — CONTENT BRIEF, UPLOAD, EXTRACTION AND IMMUTABLE VERSIONS

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 07: CONTENT BRIEF, UPLOAD, EXTRACTION AND IMMUTABLE VERSIONS** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Creator can choose audience, channel, market, product, campaign, target reading level and PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED classification. Form provides brief completeness and applicable rules preview. Submit text or permitted PNG/JPG, text-based PDF, DOCX; upload to signed private storage and record version content hash, timestamps, owner, MIME, size and language. Extract real text/layout and image metadata, page/section references, but if PDF scanned and OCR unavailable flag `needs OCR/manual` rather than invent text; optional OCR only if installed and validated. Show genuine source preview, accessible alternative/metadata, status, upload errors, file scan status if implemented. Create immutable versions on edits, track diff; rejected extension/large malicious files handled. Ensure no auto-analysis until privacy preflight. Store real organization record and no simulated preview content.

**Acceptance gate:** Upload/reopen a real image/document, extract text where supported, save draft and versions, enforce permissions and avoid overwritten approvals.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 08 — LIVE PRIVACY CENTER, DATA MAP, POLICY AND AI TRANSFER GATE

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 08: LIVE PRIVACY CENTER, DATA MAP, POLICY AND AI TRANSFER GATE** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Implement a **real, interactive privacy feature with clearly labeled shield-check icon** at global app header/sidebar, `/app/privacy`, plus `/privacy` footer public notice. Two linked parts:
(A) OPERATIONAL PRIVACY DASHBOARD (generated from actual backend/DB/integrations, not made-up): active data classes allowed to leave app; configured AI vendor/model/region if known; most recent real external transfers by timestamp, org/user/action/category, data-category descriptors, counts, status and reason (without sensitive raw payloads); actual retention config; effective policy version; configured storage region; list connected integrations and true sync status; actual deletion/export requests; current signed-in user's access. Live refresh on authorized Supabase Realtime events or secure polling. Status labels `Verified configuration`, `Pending verification`, `Unavailable`; no fake zero-risk status.
(B) POLICY GOVERNANCE: versioned editable notice draft (purpose, data collected, legal bases/consent where applicable, service providers, retention, sharing, rights requests, contact, effective date), Admin/legal must review and explicitly publish; versions recorded; member acknowledgement if appropriate; no copy/paste of a competitor policy, no automatic legal-certification claims. Generate suggested disclosures from actual `data_inventory` and vendor configs, with citations to verified vendor terms, but label as drafts needing review. Contact email is configured, never invented. Support genuine self-service access export/data request submission and admin request tracking with status; implement actual bounded export and deletion workflows only if safe and authorized; for actions not available label `Manual request pending`, not `Deleted`. Retention job purges only categories safely eligible and keeps required immutable audit record per documented policy; show actual outcome.
(C) AI GATE: versioned org policy by data-class and provider, user preflight disclosure preview before every external AI request showing data categories, purpose and provider, strict sensitivity checks, PUBLIC and INTERNAL configurable, CONFIDENTIAL/RESTRICTED blocked by default, RESTRICTED requires specialist policy path and does not get an ordinary override switch. Enforce on backend, not only UI. Write `processing_events` only on actual sends/responses/failures, with transfer decision, provider, model, class, purpose, counts/metadata and no raw secrets. If provider tier terms unverified, warn and default to block sensitive categories. Support disabled AI mode with deterministic checks/manual review. AI consent/acknowledgement is not a blanket substitute for appropriate legal basis.

**Acceptance gate:** Real Privacy icon opens operational status, current vendor/disclosure changes reflect DB config; confidential external call blocked before request; processing-events appear only when actually executed; rights request creates a real record; policy publication/versioning works.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 09 — REAL TOOL-USING AI AGENT, GROUNDED FACT CHECKS AND NEURAL-NET CHOICES

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 09: REAL TOOL-USING AI AGENT, GROUNDED FACT CHECKS AND NEURAL-NET CHOICES** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Implement actual server-side AI agent/orchestrator (not a scripted pretend assistant). Architecture: `AgentController` obtains authenticated actor/org/request + live content version → retrieves *approved/current/scope-matching* brand source IDs through tools → privacy gate → runs deterministic checks → if allowed, calls configured Gemini/OpenAI model with structured output → validates findings/citations → persists findings, claim anchors, tool run records, model/provider/time/status and sends only safe needed context. Build constrained, permission-enforced tool registry: `retrieve_brand_rules(scope)`, `retrieve_approved_facts(product,as_of)`, `search_approved_chunks(query,limit)`, `list_approved_assets(scope)`, `analyze_text_claims`, `evaluate_tone`, `check_terminology`, `check_visual_properties`, `get_prior_review_feedback`, `record_draft_findings` (authorized server action). Agent cannot run arbitrary shell/SQL/browser, update facts, approve content, send notifications or publish via arbitrary model-generated instructions. Model may choose read-only tools within strict bounds; action tools must be server approved. Use Pydantic schemas and json validation, verify cited source ID/org/version and quote span; if invalid drop citation and mark uncertainty. Evidence verdict `SUPPORTED | CONTRADICTED | INSUFFICIENT_EVIDENCE | NOT_APPLICABLE`, severity and exact text location; do not label missing as false. Detect prompt injection in user-uploaded instructions, treat document text as data; don't let it override role, org, policy or tool permissions. Use provider adapter, limits/retries/backoff, provider-specific model capability checks, durable analysis job statuses `QUEUED/RUNNING/COMPLETED/PARTIAL/FAILED/BLOCKED_BY_PRIVACY`. Never show sample answers as real. A hosted LLM is already a neural network; don't spend hackathon time training a separate network. Use embeddings/pgvector only if retrieval evaluation shows real benefit; optional small OCR/vision classifier only after measured need and proper data.
Test with actual provider credentials if configured: upload approved fact, submit wrong/unsupported claim, see model request plus actual persisted and traceable finding. Test timeouts, bad JSON, invalid citations, wrong tenant and provider outage. Production datasets must come from authorized users/sources, while unit tests can use explicit fixtures.

**Acceptance gate:** Live AI provider request and tool audit recorded with valid source citation when configured; no real key → honest unavailable status; wrong citations rejected; confidential prompt never exits app.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 10 — INTENT-PRESERVING AI CORRECTIONS AND EDITOR

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 10: INTENT-PRESERVING AI CORRECTIONS AND EDITOR** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Build issue review UI with original text/asset preview, highlighted exact span/page, severity, supporting guideline and source, AI reasoning, confidence or uncertainty and minimal suggested rewrite. Provide accept one suggestion, customize, dismiss with reason, request exception and see side-by-side diff. Substitution must never fabricate new numbers, studies, certificates or quoted sources; model rewrite should use only currently approved approved claims. Auto apply is forbidden: creator explicitly approves local edit; backend creates new immutable version with new SHA and a fresh analysis status, old record retained. Recompute impacted claims/links after edit, re-run review as requested. For image/visual issues suggest actual approved asset reference or manual design fix, don't quietly alter image. Keep helpful feedback even when AI disabled. Verify cursor/selection, undo/compare, save/reopen/version history, ownership checks, rejected suggestion feedback and no inherited approval.

**Acceptance gate:** Creator fixes one real flagged claim and saves new version; previous text and report remain; corrected content can be rechecked; no approvals auto-copied.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 11 — RISK-BASED HUMAN REVIEW AND VERIFIED PUBLISHING PASSPORT

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 11: RISK-BASED HUMAN REVIEW AND VERIFIED PUBLISHING PASSPORT** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Build review state machine (`DRAFT`, `ANALYSIS_PENDING`, `READY_FOR_REVIEW`, `IN_REVIEW`, `CHANGES_REQUESTED`, `REJECTED`, `APPROVED`, `REVIEW_REQUIRED`, `ARCHIVED`) with transactional transitions authorized by role and version. Risk tiers LOW/MEDIUM/HIGH/CRITICAL based on product/channel, claims, privacy class and admin policy; route specialized claims to assigned Reviewer and final decision to authorized Manager. No automatic final approval even for zero findings. Review queue, filters, inline issue/thread comments, specialist feedback, overrides with rationale, request changes and status notification. Bind final Publishing Passport to content_version_id+SHA256, reviewer IDs, timestamp, source/rule version IDs, decision, unresolved warnings, and evidence links; export downloadable summary as actual generated artifact if feasible. Any subsequent edit or changed authoritative dependencies removes 'ready to publish' on new version and prompts re-review; prior historical passport remains but becomes flagged if applicable. Use content status separate from external publish status; do not claim item is published unless real authorized integration confirms. Reject unauthorized approvals and hash mismatch.

**Acceptance gate:** Two actual roles collaborate, manager approves exact version, immutable decision stored, creator edit requires reapproval, high-risk specialist routing works.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 12 — LIVING EVIDENCE GRAPH, FACT-CHANGE SIMULATOR AND IMPACT EVENTS

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 12: LIVING EVIDENCE GRAPH, FACT-CHANGE SIMULATOR AND IMPACT EVENTS** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Implement genuine graph as tenant-scoped Postgres edges `approved_fact_version → extracted_claim → content_version → passport`. Graph visualization can use SVG/React Flow for clear interaction in authenticated app, with 3D optional **only if performance/legibility permit**. Claims must link with validated evidence; no relationships invented by arbitrary keyword matching (possible candidate edges require verification). Admin proposes fact update, preview shows old/new fact, source changes, affected current claims/content and approvals; no mutation on preview. On activation require authorized Admin and correct optimistic version, use transactional locks/idempotency and event outbox: create new approved fact version, retire prior per policy, query *actual* dependency edges to previous version, create each unique impact event, flag only content needing review and enqueue notifications. Exclude unrelated claims and other orgs. Never modify live external ad, silently overwrite past records or auto reapprove. Show timeline, affected count, relevant quoted claim, action needed, reviewer owner and ability to revise/approve. Handle claims supported by multiple sources: if alternative still-valid evidence fully supports it, avoid false automatic invalidation; mark 'needs evidence reassessment' before forced re-review. Include exact ₹1,999→₹2,499 scenario as a **clearly labeled sample fixture in local E2E test**, but user database stores only their approved facts.

**Acceptance gate:** Real org fact update triggers idempotent precise impact records/notifications, no duplicate after retry, unrelated doc stays unaffected; old passports preserved with review status caveat.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 13 — ASSET GOVERNANCE, BASIC VISUAL CHECKS AND ACCESSIBILITY

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 13: ASSET GOVERNANCE, BASIC VISUAL CHECKS AND ACCESSIBILITY** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Borrow *necessary standard features* from proven DAM/governance products, implemented in our own code: reusable asset library, tags and approved/rejected asset states, license owner, expiry alerts, brand color/size policies, approved template references, version history and approvals. Real image processing: Pillow/OpenCV color histogram/palette threshold, dimensions, optional perceptual hash for approved logo similarity (show `possible mismatch`, not legal certainty); check embedded text contrast only if actual text/bounds can be identified; logo safe-zone/manual review as applicable. Document warnings: missing image alt text when relevant metadata exists, basic contrast measurement only where measurable, missing required disclaimer as deterministic rule. Show clear unsupported checks instead of false claims of complete WCAG compliance. Feature flags for OCR/vision API only if properly configured and privacy permitted. Keep current rights/license expiry time from database; no fake certificates. Test source asset replacement, expired usage rights, wrongful similarity, accessibility limitation disclosure.

**Acceptance gate:** Works on actual uploaded images and metadata, reliable measurable issues documented; unmeasurable concerns route to human review; no unsupported certification.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 14 — REALTIME NOTIFICATIONS, CURRENT ANALYTICS AND GOVERNANCE INSIGHTS

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 14: REALTIME NOTIFICATIONS, CURRENT ANALYTICS AND GOVERNANCE INSIGHTS** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Implement persistent `notifications` and outbox events for new assignment, comment, approval, request changes, fact/asset expiry and evidence change. Use auth-scoped Supabase Realtime subscriptions if configured, or authenticated SSE/poll fallback with event cursor/cleanup and backoff. Show real unread count and mark read in DB; no fabricated real-time stream. Analytics query actual `analysis_runs`, findings, reviews, impacts; compute first-pass approval, average review time, common failed rules, unsupported-claim count, corrections accepted, false-positive feedback, review bottlenecks and audit completeness with explicit denominators, time windows and empty states. Add guideline unclear-rule signal only where reviewer disagreements/overrides are recorded; a proposed guideline update remains an **Admin-approved draft**, not self-modified truth. Data displayed must be org-scoped and update after real events. Add export CSV only from permissions-authorized data. Distinguish operational events from marketing metrics; no invented savings percentages.

**Acceptance gate:** When manager approves, creator sees actual in-app event, notifications persist on refresh, analytics change to reflect records and cannot leak between orgs.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 15 — AUTHORIZED LIVE DATA CONNECTORS, WEBHOOKS AND SOURCE FRESHNESS

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 15: AUTHORIZED LIVE DATA CONNECTORS, WEBHOOKS AND SOURCE FRESHNESS** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Implement an integration framework but don't fabricate working third-party integrations. Production app needs company-approved documents and facts first; real-time outside truth is optional. Build a `SourceConnector` interface with permission-scoped `connect`, `sync`, `status`, `disconnect`, token refresh, `webhook_received`, source version, fetched timestamp, freshness TTL, idempotency, audit and error states. Choose only **one** authorized connector if credentials and relevant docs available (e.g., a public product JSON/CSV endpoint with actual user-supplied URL or a configured CMS API/Google Drive connector), document exactly how it was authenticated; only sync authorized content and never mark it approved automatically. Use verified sources, etags/update timestamps and actor attribution; changes enter `Proposed fact change` queue and Admin must approve. For external internet claims, show `external candidate`, original link, retrieval timestamp, not authoritative proof. Webhook signature verification; backoff, duplicates, 403, 429 and deletion handling. For a source not connected, surface `Not connected`, never show 'syncing live' fake data. Also support manual approved fact edits in production and ensure core full workflow doesn't depend on an optional connector.

**Acceptance gate:** Actual sync with a legitimately configured source proves freshness and creates candidate changes; otherwise connector is transparently disabled and core brand workflow works using real user-entered data.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 16 — ORIGINAL CINEMATIC 3D PUBLIC WEBSITE AND APP UX POLISH

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 16: ORIGINAL CINEMATIC 3D PUBLIC WEBSITE AND APP UX POLISH** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Inspect reference movie if available (do not claim viewing otherwise); build original editorial/scrollytelling visual identity rather than imitation. Public `/` hero: real interactive Evidence Constellation — floating translucent document planes, luminous fact/claim nodes, curved proof edges and restrained human approval seal. Midnight graphite + slate + ice teal + copper; no copied purple spotlight/dotted stage, unrelated 3D objects, excessive icons or neon. Show meaningful chapters source truth → analysis → human review → change impact → privacy/security → CTA; link Sign In and Create Workspace to actual auth. A demo toggle `fact changed` animates relevant *explicitly labeled example* links and is visually/architecturally isolated from tenant DB, never claims real verification. Use R3F/Three geometry, camera, lights, scroll-driven transitions, hover/tap interactions, lazy load, DPR cap, cleanup/dispose, reduced motion/low-power/2D fallback. Authenticated app favors quick stable UI: no distracting 3D in forms, audits or approvals; optional lightweight graph only on evidence page. Ensure professional motion transitions, responsive 390/768/1024/1440/1920, readable contrast, keyboard access, fast interactions, no broken CTAs. Include privacy shield button accessible in both surfaces (header/sidebar, footer). Measure bundle and interaction performance, don't promise fixed FPS.

**Acceptance gate:** Actually rendered animated 3D scene with manual/automated browser screenshots and no UI regression; fallback works and users can complete core actions without WebGL.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 17 — SECURITY, INTEGRATION, QA, RESILIENCE AND NEGATIVE TESTS

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 17: SECURITY, INTEGRATION, QA, RESILIENCE AND NEGATIVE TESTS** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Run real browser tests with two orgs + admin/creator/reviewer, real Supabase auth if configured, real staging org sources, and real AI request only with configured key. Isolate test fixtures from actual user data; never claim production data is sample. Tests: RLS cross-org read/write + Storage unauthorized path + private signed URLs; Auth refresh/reset/expired JWT; roles and privilege escalation attempts; prompt injection in uploaded content; file type/size; AI refusal/outage/timeouts/invalid JSON/citation fabrication; privacy blocked confidential payload must show zero actual outbound model calls; external AI provider disclosure/logs; data request creation and exports; review transitions and approval hash bound; fact activation races, retries, cross-org edges, multiple evidence sources; Realtime subscribe/unsubscribe; analytics math; portal reduced motion/WebGL failure. Run `npm run lint`, `tsc`, `npm run build`, backend `pytest`, Playwright E2E, migration tests and security advisors where available. Log actual command/results in `TEST_RESULTS.md`. Add security headers/CSP configured to real endpoints, dependencies auditing, rate limits, tenant-safe cache keys, async task retries and budget. Fix any failures or mark precise BLOCKED with evidence. No unverified claims of GDPR/DPDP/SOC2 or secure retention.

**Acceptance gate:** Full test report with real pass/fail/blocked commands and evidence; key end-to-end journey passes on actual integrated environment. Otherwise call app incomplete and explain exactly why.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 18 — PRODUCTION CONFIGURATION, DEPLOYMENT READINESS AND USER DOCUMENTATION

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 18: PRODUCTION CONFIGURATION, DEPLOYMENT READINESS AND USER DOCUMENTATION** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Prepare separate front/back deployment manifests and env mapping with no secrets committed. Document production custom origin, API base URL, Supabase project, Auth redirect URLs, HTTPS, allowed origins, signed URLs, email config, worker process and queue lease, runtime secrets, rate limits, storage access and backups. Health/ready checks, structured non-sensitive logs, alerts for AI timeouts and job failures, user-facing incident/error states. Document `README.md` (Mac setup and start commands), `DEPLOYMENT.md` (cloud steps), `PRIVACY_DATA_MAP.md`, `PRIVACY_POLICY_REVIEW.md` (legally review before external launch), `API_CONTRACT.md`, `ARCHITECTURE.md`, `SECURITY.md`, `LIMITATIONS.md`, `DEMO.md`, `TEST_RESULTS.md`, `PROGRESS.md`. Provide exact configs for user without printing keys. Do **not** deploy or purchase services without explicit authorization. If user authorizes later, run actual deploy, verify via browser and return verified URLs—not guessed. Write change log and migration rollback/backup notes.

**Acceptance gate:** Fresh local environment can follow README and run; deploy plan and secrets checklist verified; external deploy only after consent; docs match reality.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
### STAGE 19 — FINAL ACCEPTANCE TEST AND ROUND-2 JUDGE DEMONSTRATION

**Copy/paste into Codex:**

> Read the global contract at the top of this master prompt (or `00_GLOBAL_CONTRACT.md` when using the ZIP) and `PROGRESS.md`; inspect the current repo and preserve working behavior. Execute **Stage 19: FINAL ACCEPTANCE TEST AND ROUND-2 JUDGE DEMONSTRATION** now. Do not respond with a plan only; implement, wire API/storage/DB as applicable, and run relevant tests.

Implement and **execute if credentials available** the 16-step end-to-end journey: 1 signup; 2 new organization; 3 admin privacy config; 4 approve actual brand doc; 5 create and approve product fact; 6 creator upload real ad text/PDF; 7 privacy preflight; 8 live AI provider call authorized; 9 persist evidence-cited issue/unsupported claim; 10 creator correction + immutable version; 11 specialist/manager assigned and reviews; 12 human approval binds content hash/passport; 13 update approved fact with preview; 14 activate and get exact impacted links and actual notification; 15 revise/reapprove; 16 verify analytics/audit and Privacy Center actual processing event. Also verify no hidden sample results in production, no automatic approval, no cross-org access, confidential blocked, external integration status truthfulness and 3D landing. Produce `DEMO.md` 3-minute script and one-page judge matrix showing problem, solution, tech, originality and feasible scope. If incomplete, list exactly what is not implemented/tested; do not announce 'complete' unless live integrated journeys passed.

**Acceptance gate:** A runnable, tested full-stack product with verifiable operational data. Include timestamps/results and state remaining blockers honestly.

After implementing, update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`; state what actually passed, what is blocked and what is next. Advance automatically through feasible work if running from the combined master prompt, without fabricating results.

---
## Recovery and review prompts

**If Codex loses context:**
```text
Read 00_GLOBAL_CONTRACT.md, PROGRESS.md, TEST_RESULTS.md and repo tree. Identify current stage, unresolved defects and missing credentials. Continue from last verified checkpoint without rebuilding. Execute next unblocked stage and run tests.
```

**If Codex creates a fake feature:**
```text
Audit the last stage for mock arrays, hardcoded metrics, fake timer-based analysis, dead buttons, fabricated model citations and unauthorized tenant queries. Replace with real authenticated API and DB behavior or disable with an honest blocked state. Add a failing test first, fix and rerun; document actual commands.
```

**If a stage fails integration:**
```text
Reproduce the exact error; inspect frontend network requests, FastAPI logs, Supabase RLS/Storage rules and source code without leaking secrets. Identify root cause, add regression test, fix minimal code, rerun both previous and current stage tests. Do not skip the stage.
```

**Prioritized shipping order if time is limited:** 0-12 + 17-19 (includes real privacy + AI + evidence + approval) first; 13-16 after proven core journey. 15 (external connector) is optional unless one is authorized. No neural-network training is required just to claim 'AI'; a properly integrated hosted model is a real neural model.

## Authoritative documentation to consult and re-check at build time
- Supabase Auth/RLS/Storage: https://supabase.com/docs/guides/auth ; https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/storage/security/access-control
- Supabase security: https://supabase.com/docs/guides/security/product-security
- OpenAI API data controls: https://developers.openai.com/api/docs/guides/your-data
- Gemini Developer API pricing/data terms (tier differences): https://ai.google.dev/gemini-api/docs/pricing
- UX competitors for feature *ideas*, not code/policy text: https://www.frontify.com/en/solution/brand-governance ; https://support.bynder.com/hc/en-us/articles/39420994737426-How-to-Configure-and-Use-the-Brand-Compliance-Agent ; https://business.adobe.com/products/genstudio-for-performance-marketing/brand-compliance.html
- Applicable privacy law: consult actual jurisdiction and commencement dates with counsel, e.g. India DPDP rules official Gazette https://egazette.gov.in/WriteReadData/2025/267650.pdf ; never declare compliance simply because a policy page exists.
