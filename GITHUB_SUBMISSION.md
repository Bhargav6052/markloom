# Markloom repository submission

This repository contains the full application source: React/TypeScript frontend, FastAPI backend and worker, Supabase migrations, automated tests, CI, container deployment files and implementation reports. Dependencies, generated builds, local credentials, temporary reference material and private workspace screenshots are excluded.

## Run the project

Follow README.md to install pinned frontend/backend dependencies, copy the three `.env.example` files into the local configuration files, configure your own Supabase project and start the frontend, API and worker. Consult DEPLOYMENT_NOTES.md for unfinished production configuration and live-service verification. This is a development implementation, not a claim of completed public deployment.

## Connect to GitHub

Create an empty private repository in your GitHub account. Keep the repository empty on creation to avoid conflicting initial commits. Use your own repository URL in these commands from this project's directory:

```sh
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

If you already have an `origin` remote, inspect it with `git remote -v` before changing it. Never force-push an existing repository to upload this project. Authenticate using GitHub's normal login/credential flow; do not put a personal access token in source files or a remote URL.

An extracted submission ZIP does not include `.git` metadata. Initialize it first if using that copy:

```sh
git init -b main
git add .
git commit -m "Initial Markloom application submission"
```

Then add your actual remote and push. If Git requests an author name/email, configure your own identity; do not copy someone else's identity.

## Contents

- `frontend/`: application, public assets, pinned pnpm lockfile and frontend tests.
- `backend/`: FastAPI service, analysis worker, Python dependencies/lockfile and backend tests.
- `supabase/`: current migrations and database definitions; legacy unapplied scripts are explicitly segregated.
- `tests/`, `.github/workflows/`: browser test definitions and frontend/backend CI.
- `deploy/`, Compose manifests, Dockerfiles: existing deployment configuration.
- Root and `docs/` reports: architecture, API contracts, verification and launch requirements.

For a fresh database use the current migrations. The existing shared Supabase project has pre-existing migration history; follow DEPLOYMENT.md before applying anything to it.

## Regenerate the submission ZIP

```sh
python3 scripts/package-submission.py
```

The packager honors Git ignore rules, checks for known credential formats and writes `submission/Markloom-complete-source.zip` plus an external SHA-256/file manifest. The ZIP contains a `Markloom/` folder ready to extract or import.
