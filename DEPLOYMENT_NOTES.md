# Markloom deployment notes — 2026-11-15

The frontend refinement is implemented locally. Public deployment and complete live-service acceptance are **not** complete.

## Required before launch

- Final production domain. Set frontend `VITE_SITE_URL` and backend `PUBLIC_SITE_URL` to the same reachable HTTPS origin. The existing production Compose configuration derives these from `SITE_DOMAIN`.
- Actual legal operator, support email and privacy email: backend `PUBLIC_OPERATOR_NAME`, `PUBLIC_SUPPORT_EMAIL`, `PUBLIC_PRIVACY_EMAIL`. Complete legal review before setting `LEGAL_NOTICES_APPROVED=true`.
- Backend-only `SUPABASE_SECRET_KEY`, selected `AI_PROVIDER` / `AI_MODEL` and that provider's key. Never place these in a `VITE_*` variable. Privacy Center currently reports external AI unconfigured; this pass did not provision secrets.
- Supabase Auth Site URL and redirect allowlist must include the real origin and `/auth/callback`. Test signup, confirmation and recovery on a separate mobile device. Loopback email links point to the device opening them and cannot serve remote phones.
- Configure production CAPTCHA in Supabase Auth, expose only `TURNSTILE_SITE_KEY`, verify allowed hostnames. Keep production bot protection fail-closed.
- Configure production `CORS_ORIGINS`, storage/migrations, backups and retention procedures. The signed-out localhost alias used for visual testing was not allowed by the existing API CORS configuration; forms correctly remained disabled on that alias.

## Existing hosting path

The repository includes `compose.production.yaml` and `deploy/Caddyfile`. Point DNS to the intended host, set `SITE_DOMAIN` and `ACME_EMAIL`, and open ports 80/443. Caddy obtains certificates, redirects HTTP to HTTPS and sets HSTS/security headers. This was inspected locally, not deployed or certificate-tested. Follow DEPLOYMENT.md for the full hosting runbook. Confirm API readiness before exposing the app.

## Build and discovery

From frontend, use `REQUIRE_PUBLIC_SITE=true npm run build` with the actual production environment configured. Source maps are disabled. Secret-like frontend variables are rejected. Public routes receive distinct metadata; sitemap, robots and llms are generated. Without a real origin, all pages remain noindex, robots disallows crawling and the sitemap is intentionally empty. Do not substitute an invented domain.

WebSite, SoftwareApplication and public BreadcrumbList schemas are conditional on a real origin. Organization/LocalBusiness schemas are deliberately omitted until verified operator/business facts exist. Public metadata contains no private workspace records.

## Support and analytics

Contact displays only configured contacts. When a support address exists, its validated form opens the visitor's mail composer; it does not claim server delivery. Server-delivered support remains unimplemented. Optional first-party analytics requires backend availability/configuration and explicit consent; no third-party tracker was added or enabled by this pass.

## Acceptance still required

Fresh production login/signup/recovery; real upload and AI verification with citations; independent reviewer approval; real fact-change impacts; live 3D graph with populated authorized records; role-by-role browser tests; production mail delivery; real-device/browser and throttled-network performance; screen-reader/zoom/forced-colors and complete WCAG 2.2 review. The graph shows loaded recorded relationships and offers manual refresh; it is not a newly provisioned realtime subscription.
