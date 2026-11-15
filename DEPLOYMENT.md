# Public HTTPS deployment update

Use compose.production.yaml with compose.yaml after providing the real values in docs/LAUNCH_CHECKLIST.md. Caddy provisions HTTPS/redirects and sends HSTS/CSP; the production API healthcheck uses /ready before web startup. No DNS/domain/certificate or legal/operator/contact details are finalized. Public deployment and container execution are not verified. Full configuration instructions: docs/PUBLIC_SITE_OPERATIONS.md.

A fourth additive Inkloom migration (website analytics) is now applied. Total Inkloom tables are 28; the analytics table is server-only and separate from private tenant activity. The prior runbook below still applies to the product, with this HTTPS overlay and migration update.

---

# Deployment runbook and acceptance gates

State: prepared manifests, **not deployed or container-verified**. Docker is not installed in the current environment. A static frontend alone does not provide a working product.

## Topology and secrets

Deploy the frontend/nginx container, FastAPI container and a separate worker container with outbound HTTPS to the selected Supabase project and optional AI provider. Put TLS/CDN/WAF ingress in front of nginx. A regional Supabase database plus CDN can be reachable globally but is not a measured availability/latency or jurisdictional guarantee. Select target regions, traffic/SLO and recovery requirements before launch.

Root `compose.yaml` is a local, same-origin packaging configuration. Web binds `127.0.0.1:8080`; API is internal, nginx proxies `/api`, `/health`, `/ready`; worker is independent. `ENVIRONMENT=production` disables interactive API docs. Configure a trusted HTTPS reverse proxy for real hosting and explicit CORS origins. Review nginx CSP and multi-instance abuse controls for your domain. API probe `/health` means liveness; `/ready` additionally requires live Auth/DB plus recent worker heartbeat and fails closed without the server secret. AI configuration is optional, local review remains available.

Build-time browser inputs: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Keep VITE_API_URL empty for the same-origin Compose proxy. Hosted static-only builds instead need the actual HTTPS API origin, appropriate CORS and SPA fallback to index.html. Do not deploy a build with the development localhost API URL.

Runtime API/worker inputs: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, server-only SUPABASE_SECRET_KEY; optional AI_PROVIDER/AI_MODEL and matching API key; CORS_ORIGINS JSON; MAX_UPLOAD_BYTES; ENVIRONMENT=production. Use the host secret manager, not image build args, logs or tracked files, for private keys.

## Local container validation when Docker is available

After filling ignored frontend/.env.local and backend/.env:

```sh
docker compose --env-file frontend/.env.local build
docker compose --env-file frontend/.env.local up -d
curl --fail http://127.0.0.1:8080/health
curl --fail http://127.0.0.1:8080/ready
```

Expected with missing secret/worker: `/ready` fails with 503. A frontend screenshot or `/health` 200 cannot override that. Avoid sharing `docker compose config` output because it expands backend secrets. Stop owned containers with the matching `docker compose ... down`; do not use `down -v` on database workloads.

## Database rollout

The selected shared project has three applied Inkloom migrations, matched by name/version locally. All 27 new tables are prefixed and RLS-enabled. Existing 12 application tables and their migration were preserved. `supabase/legacy_unapplied` is archival and must not be applied. Current desired definitions are in schema.sql/privacy_jobs.sql/hardening.sql; installation artifacts are the ordered migration files.

For a fresh compatible Supabase development project, inspect its schema, back it up and apply the three reviewed migration files in order. For this shared project, do not run a blind `supabase db push`: the existing capacity-connect migration history isn't owned by this repository. Use an explicitly selected project and reconcile history by inspection; never reset or mark unknown migrations repaired to silence a warning.

Back up data and Storage before changes. Validate restore into a disposable authorized environment. Prefer a forward repair for failed migration/application releases; roll back application images only when schema-compatible. Never drop new tables or restore an old backup over live data without a reviewed recovery plan and authorization. Restore/backup procedures have not been executed here.

## Auth and external processing

Configure Site URL and allowed redirects to the actual HTTPS app origin, `/app/dashboard`, `/reset-password`. Enable verified-email signup, custom SMTP/delivery monitoring and appropriate Auth protections. Check confirmation, wrong password, reset delivery/expired link, session refresh/revocation, logout, direct-route denial and multi-tab behavior with real test accounts. Do not disable confirmation for a demonstration.

The project shares Auth and a legacy profile trigger with another product; resolve account-isolation expectations. Resolve existing project advisor findings without breaking that app. Provider-account/tier terms and region are unverified; leave external classes denied until reviewed. Demonstrate source-aware preflight, restricted/confidential denial, a real permitted provider call and persisted outcome only after credentials/policy are configured.

## Final user acceptance and operations

Run scripts/verify.sh, remote health/anonymous checks, migration/RLS/advisor checks and then the full real-account journey in DEMO.md. Verify uploads/downloads, owner/role denial, two-organization isolation, human approval hash/version binding, evidence-change impacts, notifications and real analytics/privacy history. Add real concurrency/queue-lease recovery, parser/security, cross-browser/accessibility and measured mobile/3D performance checks.

Set and test backups/PITR expectations, alerts for job/provider failures and stale worker heartbeat, incident/support ownership, key rotation and approved retention/privacy notice. Review dependency advisories and shipping targets. Deploy only after blockers in LIMITATIONS.md are resolved and the user authorizes the actual hosting action. Return only URLs verified by the deployment provider and live checks; no public URL exists from this work.

## Email links and phones

Local preview (`127.0.0.1:4174`) is available on this computer only. On a phone, localhost/127.0.0.1 means the phone, so an email redirect there cannot open this server. Mobile styling does not provide public hosting.

Before testing email links across devices, deploy the frontend and API to reachable HTTPS addresses. Set `VITE_SITE_URL` to the frontend HTTPS origin and rebuild. Add the exact `<origin>/auth/callback` URL to Supabase Auth's redirect allow list and set Site URL to the intended frontend origin. Keep existing redirect entries needed by other apps sharing this Supabase project. New signup and recovery requests use this callback; existing implicit links to the dashboard or root are also recognized. The callback waits for SDK verification, routes recovery to the password form and successful confirmation to the workspace; expired/invalid links show recovery options. `/resend-confirmation` sends a replacement signup email subject to the same CAPTCHA policy and Supabase rate limits.

Use only the latest email. A previously generated localhost link cannot be repaired by changing deployment variables. Request a new email after deployment. Never share full email redirect URLs, access tokens or refresh tokens. Test on the physical phone/browser and verify API CORS, CAPTCHA, SMTP and SPA fallback on the hosted deployment before marking mobile email sign-in complete.
