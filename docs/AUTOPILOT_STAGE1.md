# Markloom AutoPilot — Stage 1 (preview only)

## Why
Previously, creators had to upload a file, attach it to a new immutable content
revision, save, and separately queue an analysis job. This was repetitive.

## New workflow
In the existing **Content → saved draft → Attach original content** panel,
the creator may opt into **AutoPilot Stage 1**. With one explicit click, the UI:

1. Uploads the file using the existing authenticated private-storage endpoint.
2. Creates a new immutable content revision with the uploaded original. For PDF
   or DOCX, it saves the *exact extracted text* to match SQL's binary/text binding.
   For PNG/JPEG it preserves the creator's draft body and image metadata.
3. If the user separately ticked external AI consent, calls privacy preflight
   on the newly saved revision. External consent is included in the queued job
   **only if** that new version passes policy and provider checks.
4. If consent is absent, denied, or privacy preflight is unavailable, queues
   local-only checks. The background worker repeats policy checks before any
   external request; the server's transfer authorization RPC is still decisive.
5. The UI shows the queued job and results using existing polling.

Manual upload + version-save + review is unchanged when AutoPilot is off.
Files and content still require the original role/owner permissions enforced
by API and PostgreSQL. No source activation, approvals, or publication are
automated. No schema migration, new secrets, model change or Saturn UI edit.

## Failure behavior
If upload fails, nothing is saved or queued. If save fails, the original upload
may exist, but no job is queued; the UI displays a recoverable error. If queue
fails after the version was saved, the preserved version ID is displayed and
users can reload and queue analysis manually without re-uploading. Failures
never request external AI without an explicit consent + allowed preflight.

## Constraints
This is an opt-in *foreground orchestration* by the browser using existing
durable backend operations. It is not a fully atomic or scheduled server-side
automation; closing the tab mid-sequence may leave a file or revision saved
without a queued job. Analysis itself is durable once queued. Stage 2 can
introduce a server-owned orchestration transaction for stronger recovery.

## Verification and release gate
Run frontend Vitest, TypeScript check, ESLint, production build, PostgreSQL
database acceptance tests, and backend tests. Check manual end-to-end with a
real logged-in creator in a staging workspace, including PUBLIC + allowed
consent, CONFIDENTIAL blocked, no consent, simultaneous edits, unsupported
files, and worker downtime. Deploy only after human review of PR.
