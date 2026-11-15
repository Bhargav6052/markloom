# Cinematic presentation update

The public page now uses an original black/violet document-system identity. Lenis and GSAP ScrollTrigger are dynamically loaded only for desktop motion; the separate R3F scene uses local procedural geometry/textures and a generated 64px studio environment. Camera motion reads a shared scroll-progress ref without per-frame React updates. Offscreen/document-hidden rendering stops; pause/reduced-motion/mobile paths use static evidence graphics and native scrolling. Scoped cleanup prevents animation state leaking into auth/workspace routes. See docs/CINEMATIC_DESIGN.md for measured bundles, verification and resource bounds.

---

# Inkloom architecture

React 19 + Vite + TypeScript SPA; React Router public/auth/workspace routes. Public 3D is a separate lazy Three.js/R3F/Drei bundle, procedural geometry only, motion animation, bounded DPR and static/mobile/reduced-motion fallback. The workspace and charts load separately from public content.

The browser uses Supabase Auth and a publishable key. The API validates each bearer session against Supabase `/auth/v1/user`, requires email confirmation, then checks membership. User-scoped REST/RPC preserves RLS; trusted upload/analysis/privacy persistence uses a server-only secret after explicit authorization. Provider keys never enter the browser.

Data belongs in Supabase Postgres (`inkloom_*` tables), Auth and private Storage (`inkloom-private`). Existing tables in the selected project belong to another app and are untouched. This is a shared Auth boundary, not a separate identity tenant per product.

Existing private SECURITY DEFINER membership/mutation functions retain fixed empty search paths, explicit identity/role/owner checks, tenant-scoped composite references and restricted grants. The public governance wrapper is SECURITY INVOKER; anonymous execution is revoked explicitly. No new privacy/worker function uses SECURITY DEFINER. This reviewed compatibility exception is recorded in the revised prompt rather than silently rewriting the original architecture.

`POST /analyze` enqueues an idempotent persistent job. A separate Python worker claims a six-minute lease, executes with a four-minute timeout, persists results and completes only its lease. Abandoned work is reclaimable up to three attempts. Source/current-version checks prevent stale results becoming current. Worker heartbeats support `/ready`. Provider retries can duplicate processing after crashes; no exactly-once claim.

Privacy decisions include immutable draft metadata, selected source config and original document metadata. Missing classification defaults to CONFIDENTIAL; unknown values fail closed. PUBLIC/INTERNAL need admin policy permission and explicit user choice. CONFIDENTIAL/RESTRICTED never go to external AI. The worker rechecks and records an attempt before I/O; provider failure never becomes successful analysis. Local-only output is labeled and still needs independent human approval.

Human decisions bind version IDs, text/binary hashes and evidence snapshots. Fact changes create targeted impact records and notifications in a transaction, preserving historical passports. Generic lists remain capped; analytics explicitly describe loaded counts. See LIMITATIONS.md for features outside this implementation.

Deployment topology: HTTPS ingress → nginx static SPA and API proxy → FastAPI; separate worker → Supabase and optional provider HTTPS. Compose binds only loopback for local verification and is not itself a public TLS deployment.
