# Brand Governance Platform — development plan

Status: planning only. Updated: 14 November 2026 (Asia/Kolkata).

## Starting point and authority

The workspace contains a proposal PDF in `output/pdf/` and its Python generation source and rendered images in `tmp/pdfs/`. No application source, dependency manifests, database migrations, tests, environment configuration, or `.git` directory were found. Preserve these existing artifacts.

The latest user instructions govern implementation. In particular, Supabase replaces the older proposal's SQLite approach, and the Living Evidence Graph is a core feature. The proposal's deferred scope and approval gates do not override the user's subsequent stage instructions. This plan does not start application development; the user will provide individual stage prompts.

## Planned architecture

- `frontend/`: React, TypeScript, Tailwind CSS and a responsive interface with accessible forms, clear status labels, and no decorative icons. Supabase Auth provides actual sessions. Browser configuration contains only public configuration and the Supabase publishable key.
- `backend/`: Python FastAPI, typed request/response contracts, validated authentication, organization membership checks, and a configurable Gemini/OpenAI adapter. Provider credentials stay on the server. No hardcoded model responses or silent provider fallbacks.
- `supabase/`: versioned Postgres migrations, tenant-scoped RLS and private Storage policies. Routine requests carry the authenticated user's identity so RLS remains effective. Any privileged provisioning path must be narrowly scoped and separately authorized.
- `tests/`: meaningful backend, database authorization, frontend interaction, and end-to-end workflow checks, introduced with the relevant features.
- Root documentation: setup instructions, environment examples without values, progress, test evidence, and limitations.

Final dependency versions and SDK calls will be verified against current official documentation during implementation, then pinned with lockfiles.

## Data and authorization design

Plan organization-scoped memberships with administrator, creator, and reviewer roles; confirm role details with the relevant stage prompt. Authorization comes from protected membership records, never editable user profile metadata. Enforce permissions in FastAPI and in database/storage access, including attempts through the Supabase Data API.

Planned records: organizations, memberships, source documents, immutable guideline/fact versions, content items, immutable content revisions, review runs, findings, evidence references, review requests, human decisions, fact-change events, impact records, and audit events. Store original uploads privately, with organization membership checks on downloads. Version and tenant keys must prevent references across organizations.

Every substantive AI finding must reference a valid approved source version, a deterministic check, or an explicit missing-evidence category. Preserve review input snapshots and run status. Provider failure, invalid citations, and partial processing must remain visible and must never become a passing result.

Approval is an explicit authorized human action bound to a content revision and evidence snapshot. Database transactions must reject stale or concurrent decisions. New content revisions require a new decision; changed facts mark affected content for re-review while preserving historical decisions. No AI approval or automatic publication.

## Living Evidence Graph

Use relational nodes and edges in Supabase Postgres for the initial graph; a separate graph database is unnecessary for the first implementation.

1. Each review records dependencies from exact content revisions and passages to immutable approved fact/guideline versions, along with evidence and how the dependency was established.
2. An administrator changes an approved fact by creating a new version, preserving its stable identity and prior history.
3. The version-change transaction persists an event and identifies content linked to prior versions; persist deduplicated impact records with a reason and review status.
4. Display affected content, previous/current facts, dependency evidence, and human re-review actions. Mark impacts as candidates for re-review; a dependency does not by itself prove a contradiction.
5. Re-review creates a new run against current evidence. It never rewrites, approves, or publishes content. Historical graph edges remain inspectable.

Coverage limitation to expose: recorded dependencies can reveal affected reviewed content; unreviewed content and dependencies missed by extraction cannot be guaranteed covered. Test direct and indirect traversal only where the implemented edge types support it; do not claim semantic completeness.

## Proposed stages

These are a suggested sequence, to be aligned to the user's stage prompts.

| Stage | Deliverables | Completion evidence |
| --- | --- | --- |
| 0 — Inspection and plan | Inventory, architecture, staged plan, tracking documents | Files inspected; blockers recorded; no application claims |
| 1 — Foundation | Frontend/backend skeleton, pinned dependencies, configuration validation, setup guide, health/readiness handling | Frontend build/typecheck and backend startup checks; readiness honestly reports missing integrations |
| 2 — Authentication and tenancy | Supabase migrations, real sign-in/out, memberships, role enforcement and RLS | Valid/expired/invalid token cases, cross-tenant access denial, role escalation denial, direct database access tests |
| 3 — Approved knowledge | Private uploads, supported extraction, fact/guideline versions, administrator source approval and persistence | Upload/download permissions, invalid input handling, unapproved-source exclusion, version history after reload |
| 4 — Content and AI review | Persistent content revisions, deterministic checks, real provider adapter, evidence validation, findings and user-applied corrections | Provider contract/failure tests, citation rejection, revision persistence, live provider smoke test when configured |
| 5 — Human workflow | Revision-bound submissions, reviewer queue, decisions, comments, justified exceptions and audit history | Unauthorized decision denial, edit/approval race, stale evidence/revision rejection, full creator-to-reviewer journey |
| 6 — Living Evidence Graph | Persisted dependencies, fact-change events, affected-content view and re-review lifecycle | Known dependencies become impacted, unrelated content stays unaffected, duplicate/retry and tenant isolation tests |
| 7 — Integration and demo readiness | Responsive/accessibility fixes, integration tests, clean setup validation, deployment instructions and supported demo journey | Authenticated end-to-end flow and fact-change scenario using real services; remaining gaps explicitly documented |

Start with structured facts/guidelines and text content. Add document formats only with real parsing, explicit support/size limits, and tests. Synthetic test fixtures may be used in tests; they must never masquerade as live AI results in the application.

## Stage execution contract

Before every major change, inspect affected files, project instructions, repository status, and existing tests. Preserve working behavior. Implement only the current stage and prerequisites authorized by its prompt. Persist important operations with clear failure states; design retries/idempotency for paid AI runs and fact-change processing.

Run relevant checks after each stage, fix discovered errors, and record unavailable checks as blocked rather than passing. Update `PROGRESS.md`, `TEST_RESULTS.md`, and `LIMITATIONS.md`. Each stage report lists changed files, completed features, executed checks/results, unresolved errors, and next steps. Wait for the next stage prompt when the current stage is complete.

## Setup prerequisites

No credentials were found in project files; no connected Supabase project or AI account has been selected or verified. Do not paste secrets into chat or commit them.

1. Install macOS Command Line Tools with `xcode-select --install`, then verify `git --version`. Initialize Git during foundation work once available; no repository currently exists here.
2. Install a supported Node.js LTS release from the official Node.js installer; restart the shell and verify `node --version` and `npm --version`. The implementation stage will select and record the exact supported version.
3. Python resolves to `/usr/bin/python3` and `uv` is available. Verify a working Python version during foundation work and create a project-local virtual environment; neither Python execution nor dependency installation has yet been validated.
4. Create or select a Supabase project. From its connection/API settings, obtain the project URL and publishable key. Put them in the future gitignored `frontend/.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Configure allowed authentication site/redirect URLs for the actual frontend origin chosen in Stage 1.
5. Put `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the future gitignored `backend/.env`. The backend will verify user tokens using the project's documented Auth/JWT verification mechanism. Do not assume a service-role key is required for ordinary operations; any later privileged credential belongs only in server configuration.
6. Select Gemini or OpenAI, enable API access in that provider's account, and store `AI_PROVIDER`, `AI_MODEL`, and the selected `GEMINI_API_KEY` or `OPENAI_API_KEY` in `backend/.env`. Use a real available model ID from that account. Implementations will provide validation and precise provider setup instructions; no provider has been exercised yet.
7. Install the Supabase CLI using its current official installation instructions during database setup. Verify its version and discover command options with `--help`. Configure migration access privately; never place database passwords, access tokens, or secret keys in browser variables. Test migrations/RLS against an isolated local or designated development database before applying them elsewhere.

Environment filenames and variable names above are the proposed contract; these files and loaders do not exist yet. Stage 1 will add exact runnable install/start commands based on the implemented manifests. No dependency installation, remote resource creation, migration, deployment, or secret configuration occurred during planning.
