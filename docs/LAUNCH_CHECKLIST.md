# Public-site implementation and launch checklist

Updated 15 November 2026. The application remains under development. No domain, legal operator or contact address was invented.

| Requested item | Implemented / verified | Remaining setup |
| --- | --- | --- |
| Privacy policy | `/privacy`, linked from footer/auth/support; live public operator configuration and accurate storage/AI/consent facts | Operator details and legal review; remains draft |
| Terms and conditions | `/terms`, integrated links and ownership/review/use responsibilities | Operator/jurisdiction/commercial details and legal review; no draft acceptance collected |
| Contact / Support | `/contact`; actual configured mail links or explicit not-published state; no fake message submission | Supply support/privacy emails |
| Secrets off frontend | No private keys found; build rejects private VITE variables, secret-like keys and service-role JWTs; emitted output scanned | Public Supabase publishable key intentionally remains public for Auth/RLS |
| Force HTTPS | Caddy automatic certificate/HTTP redirect configuration, HSTS/CSP/security headers; production mixed-content API guard | Domain, DNS, certificate email, deployment and external redirect/TLS verification |
| Cookie consent | Reject/allow/current-choice controls, persistent versioned preference, reopen, one-year expiry, DNT/GPC blocking | Optional analytics unavailable until backend configured |
| Meta titles/descriptions | Route-specific runtime and generated HTML heads for public/auth routes; private/unknown routes noindex | Production domain for canonical URLs |
| Social preview | Original 1200×630 optimized PNG/WebP, OG/Twitter cards and descriptive preview alt | Absolute preview URL generated when domain configured; test public crawler after launch |
| Favicon | SVG, 32px PNG and 180px Apple touch icon linked in head | None locally |
| Sitemap / robots | Generated per build; only public canonical pages included; private/auth/API excluded | Currently safe Disallow-all/empty sitemap until domain finalized |
| Alt text | No public raster content images lack alt; decorative geometry hidden from assistive tech; social preview alt included | Preserve alt for future uploaded/displayed images |
| Image compression | Social PNG 37,190 bytes, WebP 26,380 bytes; SVG favicon 250 bytes; build byte budgets | Original evidence uploads intentionally preserved, not silently recompressed |
| Page load speed | Main JS ~556.55 KB → ~254.60 KB (~54% reduction), gzip ~171 KB → ~81.55 KB; Auth/3D/workspace lazy; compression configured | Local FCP/LCP observations ~92–124ms and CLS 0 are cached localhost observations, not public/network benchmarks; 3D bundle remains large |
| Color contrast | Two detected failures corrected; computed check of 65 public text elements found no ratios below 4.5:1 after fixes | This is not a complete screen-reader/browser/accessibility audit |
| Mobile-friendly | 390×844 tested; width=scrollWidth=390, no canvas by default; consent controls fit; touch targets enlarged | Other target devices/browsers still need release testing |
| Custom 404 | Original recovery page with working home/sign-in/privacy links; nginx configured to return real HTTP 404 for unknown public paths | nginx/container runtime not installed; external HTTP status verification pending |
| Broken links | Home anchors and privacy/terms/support/signup/404 navigation inspected; static build route/assets checks pass; auth switches now use real routes | Full authenticated workflow remains in original acceptance plan |
| Form validation | Native email validity tested, new password 12+ characters/confirmation, input bounds, honeypot, server validation | Verify real Auth recovery/delivery and configured provider password policy |
| Spam/bot protection | Turnstile token integration for login/signup/recovery; production form fails closed without challenge; server and nginx request limits | Create/configure Turnstile site key and enable CAPTCHA verification in Supabase Auth; no active CAPTCHA claimed before this |
| Analytics | First-party consent-gated public events API and dedicated RLS table applied; no IP/account/referrer/query fields; operator SQL report; privacy signals honored | Server secret absent: no events are being collected; enable/restart after key configured and review retention |
| Clear CTA | Consistent “Create your workspace” action; supporting navigation stays secondary | None locally |

## Values the owner must supply before public launch

Backend host environment (`backend/.env` locally; secret manager in production):

- `PUBLIC_SITE_URL`: final HTTPS origin.
- `PUBLIC_OPERATOR_NAME`: real legal operator.
- `PUBLIC_SUPPORT_EMAIL` and `PUBLIC_PRIVACY_EMAIL`: working, monitored addresses.
- `LEGAL_NOTICES_APPROVED=true` only after actual operator/legal review and final content updates. This flag does not itself make draft text a complete contract.
- `TURNSTILE_SITE_KEY` (public). Set the matching verification secret in **Supabase Auth CAPTCHA settings**, not VITE or frontend code. Confirm server-side provider enforcement.
- `SUPABASE_SECRET_KEY`: server-only key, required for uploads/worker/analytics persistence.
- `ANALYTICS_ENABLED=true` if desired. It still requires explicit visitor consent and a configured backend. Restart services after changing env.

Frontend build: `VITE_SITE_URL` must match the HTTPS origin. `VITE_API_URL` should be empty for the production same-origin proxy, or the actual HTTPS API origin for separate hosting. Browser Supabase URL/key must be publishable-only.

HTTPS deployment env: `SITE_DOMAIN` (hostname only) and `ACME_EMAIL` for certificates. Configure DNS/ports 80/443, production SMTP and Supabase Auth redirect allowlist. No private key goes into build args.

Production `GET /ready` now identifies missing legal/domain/bot fields, missing backend setup and absent worker heartbeat. The production Compose overlay uses this readiness gate before serving the web tier. TLS, real CAPTCHA, actual analytics collection, Docker images and public-speed tests remain unverified until configured and deployed. No public launch was performed.
