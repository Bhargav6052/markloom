# Authentication preview fix

15 November 2026: Fixed the production-preview CAPTCHA deadlock affecting Sign in/Create account. Explicit backend environment plus loopback page/API checks now distinguish a local development preview from a public deployment. Public production protection remains required. Added configuration loading/retry handling and stale-error cleanup. Backend 26 / frontend 15 tests and the production build pass; browser verified the enabled login form and a real provider invalid-login response. See TEST_RESULTS.md.

---

# Cinematic public-site redesign

15 November 2026: Implemented the original black/violet “evidence in orbit” identity, purposeful interactive 3D documents, Lenis + GSAP ScrollTrigger, camera/pointer motion, restrained parallax, native/static fallbacks and coordinated public legal/auth styling. Existing backend, tenant data, auth and workspace behavior were preserved. Public metadata/social/favicons match the new identity.

Type/lint/10 frontend tests/build/secret and asset checks pass. Browser QA confirms mesh and keyboard selection, smooth anchors, pause cleanup, offscreen suspension, 390px static/mobile behavior and 71 checked text elements with no contrast failures. Details and limits: docs/CINEMATIC_DESIGN.md. Existing public-launch setup blockers still apply.

---

# Public-site release checklist update

15 November 2026: Added integrated Privacy/Terms/Contact pages with configurable real operator details, consent controls, route metadata and crawler assets, original optimized social/favicon assets, a custom 404, validation/CAPTCHA wiring, frontend secret guards, first-party analytics infrastructure and HTTPS deployment configuration. No production domain or legal/contact details were invented. Fourth migration inkloom_website_analytics is applied; total Inkloom tables: 28. Existing product data/functions were preserved.

Verification now includes 24 backend tests, 10 frontend tests, build/type/lint/secret/asset checks, the full PostgreSQL fixture suite plus analytics access denial, and public desktop/mobile browser checks. Main initial JS reduced by about 54%; 65 checked public text elements meet 4.5:1 in the computed contrast check. Local observed FCP/LCP 92–124ms and CLS 0 are not global/network benchmarks. See docs/LAUNCH_CHECKLIST.md for precise statuses and release setup. Remaining backend key/live-product and public deployment blockers still apply.

---

# Current implementation checkpoint

Updated 15 November 2026, Asia/Kolkata. This checkpoint supersedes earlier planning-only statements. The original 20-stage document is a specification; its acceptance gates are not all complete.

| Area | Observed state |
| --- | --- |
| Prompt review/revision | Saved in docs; original preserved |
| Public website | Implemented, production build passed, desktop/mobile browser checks passed |
| Real 3D | Lazy WebGL scene, pause control, static mobile/failure fallback; rendered in browser |
| Auth | Supabase integration implemented, publishable configuration connected; Auth health live verified; full signup/email/recovery not executed |
| Supabase | Restored ACTIVE_HEALTHY; 27 Inkloom tables with RLS and private bucket verified remotely; 12 existing tables preserved |
| Organization/roles/content/sources/reviews/impacts | Implemented existing workflow; transactional PostgreSQL fixture journey passed; real-account journey not executed |
| Privacy | Operational endpoints/UI, default-confidential classification, source-aware preflight, policy auditing, attempts and requests implemented; local tests passed |
| Durable analysis | Database queue, idempotency, leased claims, recovery and worker implemented; PostgreSQL/unit tests passed; deployed worker not running |
| AI | Real provider adapters implemented; no provider key/model configured; external call not executed |
| Deployment | Dockerfiles, Compose, nginx, CI and runbook prepared; Docker not installed, containers/public deployment unverified |
| Launch | BLOCKED: server secret, verified user flows, production email/origins, hosting, operational/security/legal gates |

This work also corrected a real Supabase default-privilege issue: anonymous execution on the new governance wrapper was explicitly revoked in a forward migration and verified via live HTTP denial. New trusted persistence/worker RPCs are not executable by browser roles.

Next independent release work: complete list pagination/aggregate reporting, full account lifecycle, email invitations, request fulfillment/retention operations, deployment/load/security verification and remaining advanced requirements. Next setup-dependent work: backend secret → running worker/readiness → real verified accounts and uploads → complete acceptance journey → optional permitted provider call → production deployment validation. Never claim those checks passed from fixture results.

## 2026-11-15 supplied video design update

Implemented an original cinematic evidence engine and rebuilt the opening composition around the supplied video's lighting, thin typography and dotted reflective stage. Mobile/reduced-motion fallbacks now use 16–18KB captures of our own scene; no reference-video assets are shipped. Local build and frontend checks passed; visual QA evidence is in `design-qa.md`. Existing production legal, domain, backend-secret and service setup requirements still apply; this update was not a deployment.

## 2026-11-15 mobile email diagnosis

Confirmed phone email redirects use computer-local 127.0.0.1:4174. Added dedicated /auth/callback and /resend-confirmation routes, legacy-link handling, explicit expired-link recovery, VITE_SITE_URL-based email destinations and mobile auth sizing fix. Twenty-one frontend tests and build checks pass. Physical-phone completion needs HTTPS deployment and exact Supabase redirect allow-list configuration; no public deployment or shared-project Auth configuration changes were performed. See DEPLOYMENT.md.

## 15 November 2026 — PDF audit and cinematic interactions

Reviewed the nine-page BrandOS PDF and documented code evidence, verification gaps and launch blockers in docs/BRANDOS_REFERENCE_AUDIT.md. Added Sources/Draft/Decision modal flows, interactive illustrative product tour, original generated/compressed imagery, image-led workflow, route entrances and expanded desktop smooth scrolling, dark workspace identity, data-driven dependency diagram, source-health warnings and 15 labeled exact-rule regression cases. The tour is an example, not a substitute for the missing real persisted demo.

Verified: 27 frontend tests, 41 backend tests, TypeScript, ESLint, Ruff, production build, secret scan and public-asset checks. Browser inspected desktop/mobile interactions, keyboard modal dismissal/focus return, public-to-signup route, images, no mobile overflow and existing workspace read-only. Runtime health still reports AI and backend server credentials absent, and readiness fails. No backend credential, model account, public hosting, legal data or successful live end-to-end run was invented. Asset provenance/prompt saved in docs/CINEMATIC_ASSETS.md.

## 15 November 2026 — screenshot-requested chapter refinement

Made Source, Draft and Decision independent full-screen scroll chapters, replacing the combined workflow and modal interaction. Hero image titles now sit directly on the artwork and the old Evidence Engine caption is removed. Image clicks target the matching information section; next links continue the sequence. Desktop and mobile scroll/overflow checks and frontend verification passed. The earlier PDF audit remains applicable to product capabilities; its modal description is superseded by this refinement.

## 15 November 2026 — clean three-object pyramid

Implemented simultaneous Source/Draft/Decision hero objects in a pyramid layout, each with its own accessible smooth-scroll link. Replaced switching selector/technical captions with three concise labels; simplified hero and repeated chapter text. Added purpose-built original vector fallback icons for mobile/reduced-motion. TypeScript, ESLint, 27 frontend tests, production build, credential/public-site checks passed. Verified desktop 3D, all three link destinations, Source/Draft settled positions, 390px no overflow, and labels clear of the cookie control. No backend/auth changes.

## 15 November 2026 — 50% cinematic cursor response

Added timestamp-based cursor velocity measurement and adaptive smoothing to the three pyramid objects. Half-strength position/tilt response, restrained inertia, camera parallax and automatic settling run without React updates per pointer event. Input resets on leave/scroll/blur/hidden state, and click targets remain stationary. Five new controller tests pass (32 frontend tests total); type/lint/build checks pass. Browser observed live directional response and speed; Pause removed the canvas. No backend/auth or analytics changes.

## 15 November 2026 — flowing web-sourced 3D image cards

Replaced pyramid with a linear, cursor-responsive photographic flow. Labels moved inside all three new locally hosted Unsplash renders; independent Source/Draft/Decision chapters use the same artwork. Increased normalized cursor strength to 0.85 and scaled automatic speed response. Added three-section cinematic slideshow with previous/next, keyboard arrows and bidirectional horizontal drags; moved existing product tour into its section. Added fixed lower-right animated back-to-top and corrected numeric top targeting under transforms. Mobile section navigation is visible after fixing inherited nav overflow. 33 frontend tests and build/lint/security checks pass. Backend/auth unchanged. Credit record: docs/WEB_IMAGE_CREDITS.md.

Final mobile QA confirmed numeric scrollTop=0 after back-to-top, visible header section rail, previous/next panel changes, and zero horizontal overflow. Desktop drag-left/drag-right and keyboard section changes passed. New image labels are overlaid inside the photos, and the old triangle/under-image titles are no longer rendered. The reference audit's older triangle/Three.js presentation notes are superseded; product/backend blockers remain unchanged.

## 15 November 2026 — orbit-and-settle chapter choreography

Added scroll-controlled full-orbit card flights and docking for Source, Draft and Decision, with reversible desktop pinned sequences and compact unpinned mobile sequences. Retained/restored the requested black/violet perspective-dot stage atmosphere without changing it to a photo background. Added global pointer/keyboard 3D press highlights that do not block actual actions. Reduced-motion and pause retain settled images and static layout. TypeScript/lint/33 tests/build/security/public checks passed. Browser measured Source settled (image alpha1, flight alpha0), Draft orbit and an active press highlight during immediate navigation to Decision.


15 November 2026 — Supplied artwork replacement and orbit verification: Source uses stacked violet documents (528×392), Draft uses connected violet nodes (504×394), Decision uses iridescent checkmark (508×420). Optimized WebP assets total 57,498 bytes; originals untouched. Updated alt text and intrinsic dimensions across hero, deck, chapters and orbit copies. Full artwork is contained within frames. Preserved 85% cursor response, orbital chapter handoff, press feedback and black/violet dotted atmosphere. TypeScript, ESLint, 33 frontend tests, production build, credential scan and public asset checks passed. Browser verification at 1440×900 and 390×844: no horizontal overflow; Source reached settled progress 1 with destination opacity 1; mobile Decision link reached its section within 0.09px and remained unpinned. Screenshots: docs/screenshots/updated-flow-desktop.png and updated-flow-mobile.png.


15 November 2026 — Hero-only layered card revision: Source/Draft/Decision now overlap as three individually linked 3D cards with exposed labels, preserving the supplied images, 85% cursor motion and chapter orbits. Removed the standalone intention section and default repeated overview from normal scrolling; navigation can reveal the existing slideshow on demand. A stable experience-slot wrapper prevents React insertion conflicts with GSAP pin spacers. Verified desktop Source selection lands at top 0; mobile Draft label selects #draft, width remains 390 with no overflow; How it works opens the slideshow without error. TypeScript, lint, 33 tests, build and public/security checks passed. Final screenshots: docs/screenshots/stack-desktop.png and stack-mobile.png.


15 November 2026 — Glass-card controls and above-copy docks: added silver/violet beveled frames with overlaid title and Explore affordance on each hero card. Preserved the supplied artwork and individual chapter links. Cursor strength is now 2.0 (200% normalized input), including measured velocity response; updated cursor expectations and all 33 tests pass. All chapter landing frames now sit above their corresponding information on desktop and mobile. Orbit measures copy bounds and settles into the top frame; mobile remains native/unpinned. Browser verification: desktop Source settled at progress 1, image opacity 1, dock bottom 384.71 and copy top 406.71 (22px gap). All three mobile frames precede their copy; no horizontal overflow at 390px. Source and mobile Draft Explore controls reach the correct hashes. TypeScript, lint, production build and public checks passed. Screenshots: docs/screenshots/glass-stack-200.png and dock-above-information.png.


15 November 2026 — Combined design direction: restored the original spacious hero and a single live 3D archive, combining procedural chrome/violet geometry with the latest user-supplied artwork as local textures. Replaced overlapping hero cards with three unobstructed Source/Draft/Decision links; hover or keyboard focus changes the artwork, click navigates to the matching chapter. Kept chapter orbits, above-copy docking, 200% cursor response, interactive tour, press feedback and violet dotted atmosphere. Refined section typography, frames and route-entry depth transitions. Removed an unused lineage animation that produced missing-target warnings.

The 3D scene is lazy-loaded on animated desktop views, stops rendering offscreen/when hidden, and uses capped pixel ratio and a small studio environment. Paused motion, reduced motion, mobile and rendering failures use a local CSS-depth image fallback; all links and copy remain functional. The optional Three.js scene is ~254KB gzip; mobile does not request it. It is an enhancement, not a dependency of authentication or the workflow.

Validation: TypeScript, ESLint, all 33 frontend tests, production build, private-credential scan and public asset checks passed. Browser: live canvas active on desktop and paused offscreen; Draft keyboard focus switches preview and click reaches chapter top 0px; mobile Decision reaches its section within 0.25px; 390px mobile has no horizontal overflow and three 66px-high controls; Pause removes canvas and shows static fallback; Resume restores motion; both slideshow directions work. No browser errors observed. Screenshot: docs/screenshots/combined-design-desktop.png. This change does not resolve the previously recorded backend or launch configuration blockers.


15 November 2026 — Preserved Source–Draft–Decision pile: restored three distinct supplied artworks in the original back-left/middle/front-right arrangement, replaced the single archive and separate orbit copies with one persistent sticky composition and one measured GSAP story timeline, refined lighting, shadow, typography alignment and restrained cursor/hover depth. Business logic and original information copy retained. Browser checks at 1920×1080, 1440×900, 1280×800 and 390×844; 35 tests, TypeScript, lint, build, credential and public asset checks pass. Full current design and QA record: docs/PILE_PRESENTATION.md.


15 November 2026 — Individual cinematic journeys: hero retains all three cards; Source, Draft and Decision now have exclusive approach/orbit/dock scenes using the same three DOM objects. One measured scroll timeline, separate transform layers, 85% calibrated cursor controller, gesture/arrow/keyboard navigation, direct hashes and browser-history handling. Product Tour enters Source; Back to Top restores all three hero cards. Background and artwork retained; no backend/auth/database changes. Browser verified at 1920×1080, 1440×900, 1280×800 and 390×844. 36 tests, typecheck, lint, build, credential and public checks pass. Current record: docs/INDIVIDUAL_JOURNEYS.md.


15 November 2026 — Markloom branding and comfort refinement: visible product branding and metadata renamed; existing backend/service namespaces retained. Gentle Motion defaults to 25% cursor influence with 4°/7px caps, scrub 1.2, partial arcs, limited depth/scale and no page-wide Back to Top camera tilt. Persistent public motion settings respect system reduction. Added explicitly illustrative Source/Draft/Decision previews, interactive fact-change graph, Privacy Center links and tighter story spacing. Fixed inherited white sidebar styling on previews and mobile sticky-card text overlap. Browser checks at four sizes; 39 tests, typecheck, lint, production build and credential/public checks pass. Current record: docs/MARKLOOM_COMFORT.md.

2026-11-15 — Applied the approved shared Midnight/Violet/Gold theme; added clean workflow/principles/tour routes, purpose-specific CSS depth introductions, stable forms and keyboard skip/focus support. Preserved original pile, artwork, atmosphere and independent card journeys. Added real-record on-demand spatial evidence view with ledger alternative and refresh, contrast calculations/probe/matrix, conditional structured metadata and llms discovery. Fixed workspace loading flash, unresolved content links and image drag interference. Verification: 72 frontend tests, 41 backend tests, all ten local PostgreSQL integration groups, build/lint/type/security/public checks; 50 browser contrast cases (825 checks). See DESIGN_AUDIT.md, COLOR_CONTRAST_REPORT.md, TEST_RESULTS.md and DEPLOYMENT_NOTES.md for exact scope and launch gaps.
