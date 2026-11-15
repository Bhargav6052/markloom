# Markloom design audit — 2026-11-15

## Scope and baseline
Existing React/TypeScript/Vite frontend, Router, GSAP ScrollTrigger and Lenis. Three persistent HTML cards travel from the original hero pile into independent Source, Draft and Decision scenes. Preserve that architecture, artwork, dotted floor and atmosphere. Motion preferences already default to Gentle and honor the operating system. Existing screenshots and reports in docs record earlier appearance.

## Findings
- Public pages have a dark cinematic theme; workspace styles still use white/teal surfaces. Multiple historical CSS files contain overlapping hardcoded colors.
- Bright action surfaces need dark text. Translucent labels need solid backing. Focus must have a solid boundary rather than glow alone.
- Public navigation currently switches an inline experience deck instead of clean page routes.
- Workspace graph has genuine dependency records and an accessible ledger, but no interactive spatial view.
- Legal operator, public domain and support/privacy contacts are not finalized. Server secret and AI configuration were unavailable during earlier readiness checks. No authenticated browser session is assumed.

## Route inventory
Public: /, /privacy, /terms, /contact, unknown-route 404. Authentication: /login, /signup, /forgot-password, /reset-password, /resend-confirmation, /auth/callback. Workspace: /app/dashboard, knowledge, facts, assets, content (and content/:id), review, approvals, graph, analytics, notifications, team, settings, audit, privacy. Preserve all guards, permissions, callback handling and API contracts.

## Implementation plan
1. Add centralized semantic tokens and a final shared theme; retain historical scene CSS to avoid destabilizing measured paths.
2. Add consistent button/focus/form/table states and restrained page-specific CSS 3D introductions. Forms and data remain stationary.
3. Add clean public workflow/principles/tour pages and accurate metadata, public-only machine-readable discovery.
4. Add a lazy, demand-rendered real dependency graph with existing ledger alternative. Never synthesize relationships or live findings.
5. Calculate semantic contrast pairs and inspect browser-computed text/surface styles. Record unsupported backgrounds and private/live-service gaps explicitly.
6. Run frontend/backend regression checks and inspect desktop/mobile screenshots.

## Acceptance boundaries
Token tests are not a WCAG certification. Real email delivery, live AI analysis, private data, approval mutations and production hosting require actual configured services and authorized accounts. Do not fake those results or modify backend authorization to make a visual test pass.

## Implemented refinement

Shared theme and semantic contrast pairs are in `frontend/src/theme.css`, `design-tokens.json` and `contrast.ts`. Historical scene geometry remains; final scoped bridges retire conflicting workspace/public-control palettes. Cards retain their supplied artwork and pile; card labels have opaque backing, inactive transitional cards are excluded from keyboard/assistive navigation, and initial card entrances keep labels opaque. Supporting previews use solid surfaces instead of backdrop blur.

Added page-specific CSS depth introductions, clean workflow/principles/tour routes, restrained GSAP visual-only scroll entrances, site-wide motion settings and back-to-top, skip links, stable auth forms, actual-record spatial graph with lazy R3F rendering and ledger alternative. Organization loading no longer briefly displays onboarding. Unresolved content references no longer generate `/app/content/undefined` links. Backend services and permission rules were not changed.

Browser review found and corrected legacy ivory/lavender-on-violet action text, low-alpha explanatory graph edges, inherited local palette collisions and fixed utility controls obscuring form actions. Reports distinguish the local checks from live production acceptance.
