# Markloom — brand governance

**Hosted application (21 November 2026):** [Markloom on Vercel](https://markloom-ochre.vercel.app/) with a separate Railway FastAPI service and analysis worker. The approved original Saturn UI/UX was merged in [PR #16](https://github.com/Bhargav6052/markloom/pull/16). Deployment and automated checks succeeded. The system includes Supabase Auth, organization workspaces, versioned evidence/content, independent approvals, and a privacy-gated analysis worker. **Deployment success is not proof of production readiness or measured AI accuracy.** See [LIMITATIONS.md](LIMITATIONS.md).

The supplied prompt was reviewed and revised in [docs/PROMPT_REVIEW.md](docs/PROMPT_REVIEW.md) and [docs/REVISED_MASTER_PROMPT.md](docs/REVISED_MASTER_PROMPT.md). Its original is preserved; the Downloads file was not edited.

## GitHub and submission

Full repository contents and GitHub upload instructions: [GITHUB_SUBMISSION.md](GITHUB_SUBMISSION.md). Run `python3 scripts/package-submission.py` to create a source-only submission ZIP without local credentials or installed dependencies.

## Run locally

Requirements: Node 24, pnpm 11.25, Python 3.12, uv. Install Node and uv on your PATH. This session used bundled runtimes; those absolute machine-specific paths are not required by the app.

```sh
cd frontend
pnpm install --frozen-lockfile
cd ../backend
uv sync --frozen
cd ..
./scripts/dev.sh
```

Default frontend: http://127.0.0.1:5173. API: http://127.0.0.1:8000. If occupied:

```sh
INKLOOM_WEB_PORT=5174 INKLOOM_API_PORT=8001 ./scripts/dev.sh
```

The script starts frontend, API and worker. A worker without the server secret exits with a configuration error; it does not simulate results. Development OpenAPI is available at `/docs`; `/health` reports configuration presence; `/ready` checks live Auth/database and a recent worker heartbeat and returns 503 when required setup is missing.

## Configuration

Copy `frontend/.env.example` to `frontend/.env.local` and `backend/.env.example` to `backend/.env` for a fresh checkout. The original development machine has local configuration in ignored env files; these are intentionally absent from a submission archive or fresh clone.

- Browser: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL`.
- API/worker: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, **server-only** `SUPABASE_SECRET_KEY`.
- Optional real AI: `AI_PROVIDER=gemini` or `openai`, `AI_MODEL`, matching `GEMINI_API_KEY` or `OPENAI_API_KEY`.
- Production: `ENVIRONMENT=production`, explicit JSON `CORS_ORIGINS`.

Never paste secret keys into chat, source files, VITE variables or browser configuration. Put them in the ignored backend env file locally and your host's secret manager when deployed. Without an AI key, local deterministic review remains possible with a configured worker; the UI labels its limited coverage.

## Supabase

Project `iszoqfyjlgesbnogvpbu` was restored with user authorization. Its existing application tables were preserved. Markloom uses `public.inkloom_*` tables/functions, `inkloom_private` helpers, and the private `inkloom-private` bucket. Four Markloom migrations are applied; files in `supabase/migrations` match remote migration versions. The older unprefixed draft is preserved in `supabase/legacy_unapplied` and must not be applied.

This project also serves an existing learning app. Auth is shared, and its existing signup trigger still creates that app's profile. Review account isolation before public launch. Do not blindly run `supabase db push` against this shared project: its older non-Markloom migration history is outside this repository. See DEPLOYMENT.md.

Configure Auth Site URL and allowed redirects for the actual frontend origin and `/auth/callback`. Retain `/app/dashboard` and `/reset-password` only for compatible legacy links. For the alternate preview use `http://127.0.0.1:5174` and those paths; a public HTTPS origin is required for mobile email links. Enable verified-email signup and configure production SMTP. No email was sent and no real account was created during verification. Invitations currently use manually shared IDs; the app does not send invitation email.

## Checks and deployment

```sh
./scripts/verify.sh
./backend/.venv/bin/python scripts/check-services.py
```

The second command performs read-only live health and anonymous denial checks; it creates no accounts or tenant data. Full results: TEST_RESULTS.md. Container manifests and a runbook are in DEPLOYMENT.md; container runtime, public hosting, live user journeys and scale readiness have not been verified.

## Public website checklist

Privacy, terms and contact/support routes, consent controls, social/favicon assets and route metadata are implemented. The current domain/operator/contact values are intentionally not invented. See [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) for all requested items and missing owner inputs, and [docs/PUBLIC_SITE_OPERATIONS.md](docs/PUBLIC_SITE_OPERATIONS.md) for HTTPS, bot protection, analytics and SEO configuration.

Production indexing stays disabled until VITE_SITE_URL is set. Production HTTPS uses the Caddy overlay in compose.production.yaml; real DNS/certificates and container execution are still unverified. Optional analytics has its own server-only database table but collects nothing while the server key is absent. Authentication CAPTCHA requires Turnstile/Supabase configuration, not just a frontend widget.
