# Security boundary and verification

Updated 15 November 2026.

## Implemented controls

Verified bearer sessions are checked with Supabase Auth on protected API requests; no trust in editable user metadata for authorization. Roles are read from organization memberships. RLS covers all 28 Inkloom tables, with tenant-scoped composite foreign keys. Browser roles have read-only table grants; transactional governance RPCs enforce identity, membership, ownership, exact-version/evidence freshness and independent human decisions. Private helper functions have fixed empty search paths and restricted grants. New worker/policy/upload/transfer persistence functions are invoker-only and service-role-only. Anonymous governance execution is explicitly revoked, including Supabase's separate anon default grant.

Server secret and provider keys stay in ignored local env or host secret storage. Browser uses only a publishable key. Stored originals are in a private bucket; backend validates membership and file metadata before uploads, and user-scoped authorization controls downloads. Extraction has byte/page/expanded-DOCX/pixel bounds. Downloads use attachment and nosniff. This is not a malware scanner or isolated parser sandbox.

External AI needs allowed draft/source/document sensitivity, organization policy and user choice. The worker repeats the gate immediately before I/O and records an attempt. Confidential/restricted material remains local. Provider output is schema validated; cited IDs/quotes must exist in the exact organization evidence snapshot. AI cannot approve or publish. No unrestricted SQL or browser credentials are exposed to an agent.

API middleware adds request IDs, safe generic errors, no-store and nosniff. Explicit CORS origins are configured. nginx adds baseline browser headers, request-size bounds and a per-instance API rate limit. Production API docs are disabled. These do not replace HTTPS ingress, distributed abuse controls or operational monitoring.

## Evidence

Local PostgreSQL tests exercise role escalation denial, direct-write denial, tenant/historical isolation, independent review, immutable historical passports, optimistic conflict handling, exact impact targeting, policy classes, queue idempotency and leased-worker recovery. Backend tests cover unauthenticated APIs, privacy defaults, worker errors, extraction and citation checks. Live checks verified RLS, private bucket, restricted RPC grants and anonymous HTTP denial. Full real-account isolation and live storage/provider workflows remain blocked, not passed.

## Existing shared-project concerns

The selected Supabase project also contains another app. Its `public.handle_new_user()` signup trigger remains unchanged and creates that app's profile record. Advisor warnings for that existing function's execution grants and disabled leaked-password protection remain operator launch concerns. No Inkloom public wrapper is SECURITY DEFINER. The worker-heartbeat table intentionally denies client access.

## Release requirements

Configure and rotate server secrets safely; verify verified-email/redirect/SMTP behavior; resolve shared Auth lifecycle; enable appropriate provider protection; test all role/tenant boundaries remotely; add/tune production CSP and distributed abuse limits; review dependency advisories, extraction isolation/malware strategy, backup restoration, alerts, incident ownership and privileged operator access. Do not claim a security audit, compliance certification or worldwide legal coverage from these tests.

## Public website hardening update

Frontend builds now allow only approved VITE public variables, reject privileged JWT/secret patterns and scan source/emitted files. Public identity/contact values are served through an explicit configuration response; private credentials are never serialized there. Website analytics uses a separate server-only RLS table and allowlisted fields; consent/privacy-signal checks occur in browser and server. Public API has bounded per-process abuse limiting and the gateway retains its ingress limit. Turnstile tokens are passed to Supabase Auth; actual server-side CAPTCHA enforcement is a required operator configuration check. Caddy production configuration adds automatic HTTPS/HSTS/CSP; live TLS validation is pending domain/DNS/deployment.
