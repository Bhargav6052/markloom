# Latest auth preview repair — 15 November 2026

Root cause reproduced in the browser: Vite's production-bundle flag unconditionally required Turnstile on the localhost production preview even though its connected backend was development and no CAPTCHA site key existed. Both submit buttons were disabled before any Auth request.

The API now explicitly reports development/production configuration. A built preview qualifies for local development only when both page and API origins are loopback and the backend explicitly confirms development. Public builds, production backends, remote APIs, configured site keys and explicit CAPTCHA requirements remain protected. Unknown/loading/failed configuration does not silently enable a production form; connection failures now expose Retry. Switching auth modes clears stale errors/messages, and switching is disabled during a pending request.

Verification: **26 backend pytest tests and 15 frontend Vitest tests passed**, plus typecheck/lint/production build/secret/metadata checks. Five new policy tests cover compiled localhost preview, public production, local-to-production/remote APIs, explicit CAPTCHA and unknown config. Two new backend cases check environment/requirement reporting.

Browser: the repaired Sign in button became enabled with no unconfigured-CAPTCHA error. A deliberately invalid test login reached the actual Supabase provider and returned “Invalid login credentials”; no valid account/session was created. Signup fields and Create account were enabled. No signup email was sent or new real account created in testing. Successful owner login/verification still requires their own credentials; none were requested or exposed.

---

# Latest cinematic redesign verification — 15 November 2026

- Frontend TypeScript, ESLint and 10 unit tests passed. Production build, credential scan and route metadata/social/icon/image budget checks passed.
- Desktop 1440×900: interactive document click selected Draft and changed the caption; workflow anchor reached its target (top approximately 0); Lenis initialized; static/pause removed the canvas and Lenis class; stage selection continued to work.
- The final scene suspended its frame loop offscreen (`data-rendering=paused`) and rendered actively onscreen. Percentage-filtered shadows replaced a removed soft-shadow constant.
- Mobile 390×844: document width and scrollWidth both 390, zero canvas, no Lenis class, static motion state; Enter on the Decision control updated its caption.
- Computed public text contrast: 71 checked elements, zero below 4.5:1. Privacy route retained working navigation and correct title/theme with motion cleanup.
- Observed local FCP/LCP: desktop 156–344ms and mobile 184ms; CLS 0. Cached/loopback measurements only, not production/global performance certification.
- Main JS ~82.56 KB gzip, motion ~51.10 KB gzip (deferred desktop), Three ~253.79 KB gzip (lazy). Vite large-chunk advisory and existing Three Clock deprecation remain. No application errors observed in browser checks.
- Screenshot artifacts: cinematic-desktop.jpg, cinematic-workflow.jpg, cinematic-mobile-full.jpg in docs/screenshots. Backend was not changed by this visual task; its prior verification remains historical below.

---

# Latest public-site verification — 15 November 2026

- Backend: **24 pytest tests passed**, Ruff passed.
- Frontend: **10 Vitest tests passed**, TypeScript and ESLint passed; production build passed with the existing lazy-3D large-chunk warning.
- Frontend secret scan passed across source/output; public-variable guard tests reject secret values, service-role JWTs and insecure origins. No private credentials were found. Public Supabase keys are intentionally browser-visible.
- Ordered PostgreSQL migration/fixture tests passed, including new website-analytics browser access denial. Live analytics catalog check: RLS=true, anon insert=false, browser select=false, service insert=true, stored events=0.
- Per-route metadata/social/favicon/crawler/404 and image byte budgets passed. PNG social card=37,190 bytes; WebP=26,380 bytes.
- Computed desktop contrast check: **65 text elements checked, zero below 4.5:1** after fixing two workflow styles. Decorative/disabled elements were excluded. This is not a full accessibility certification.
- Production preview browser checks: consent reject/reopen and unconfigured-analytics states; Privacy/Terms/Support navigation; missing contacts displayed honestly; invalid email validity=false/typeMismatch=true; production CAPTCHA-missing form blocked; custom 404 rendered; mobile width=scrollWidth=390 with no canvas.
- Local browser performance observations: FCP/LCP 92–124ms, CLS 0, on cached/local-loopback runs. No production Lighthouse or real-network/global performance claim. Initial main JS ~556.55 KB → ~254.60 KB (gzip ~171 KB → ~81.55 KB).
- Existing localhost development entry remains 5174; optimized production-build QA runs at 4174. Screenshots in docs/screenshots/launch-*.jpg.
- Public deployment/TLS/nginx HTTP statuses, real Turnstile enforcement, actual consented analytics persistence with server credentials and production Auth email flows remain **not verified**. Domain/operator/contact values are pending by user instruction; no fake legal information or analytics data was created.

The earlier implementation verification below is historical; this section records the current public-site changes.

---

# Verification results

Executed 15 November 2026, Asia/Kolkata. These results replace earlier planning-only reports.

## Passed locally

| Check | Actual result |
| --- | --- |
| Backend `python -m pytest -q` | 17 passed; six dependency deprecation warnings |
| Backend `ruff check app tests` | Passed |
| Frontend TypeScript `tsc -b` | Passed |
| Frontend ESLint | Passed after removing one unused test import |
| Frontend Vitest | 4 passed with intentionally disconnected/stubbed test configuration |
| Frontend Vite production build | Passed; separate lazy auth/workspace/3D bundles; large-chunk warning remains |
| `node frontend/db-test.mjs` | Nine PostgreSQL acceptance groups passed against the actual ordered migration files |
| Migration/source comparison | Three migration artifacts match their reviewed source SQL |
| `bash -n scripts/dev.sh scripts/verify.sh` | Passed |

The PostgreSQL test runs PGlite, a real PostgreSQL WASM engine with test-only Auth/Storage stand-ins and fixtures. It reproduces Supabase's default anon/authenticated function grants and checks anonymous RPC denial, onboarding, role invitations, escalation/direct-write/cross-tenant denial, source activation, fixture analysis, independent exact-version human approval/passport, exact fact-change impacts, idempotency, optimistic conflicts, reapproval, historical isolation, policy-class blocking, attempt rows, durable job idempotency/exclusive claims/lease recovery/stale worker denial. It does **not** test hosted Auth, Storage or provider HTTP behavior.

## Live Supabase checks

- User-authorized restore returned success and project reached ACTIVE_HEALTHY.
- Three prefixed migrations applied successfully: inkloom_initial, inkloom_privacy_queue, inkloom_harden_grants. Local versions were aligned to returned remote history.
- Remote catalog verification: **27 Inkloom tables, all RLS enabled; private inkloom-private bucket; anonymous governance execute=false; 12 pre-existing application tables preserved.**
- Trusted worker/upload/policy/transfer RPCs are SECURITY INVOKER and not executable by anon/authenticated roles.
- `scripts/check-services.py` verified actual Auth health HTTP 200 and anonymous governance HTTP denial. No account, email, tenant fixture or provider call was created remotely.
- Advisors surfaced existing project's `handle_new_user` execute warnings and disabled leaked-password protection. These were not silently changed for the other app. An intentional worker-heartbeat deny policy was added. Do not describe the entire shared project as security-clean.

## Browser QA via supported computer-use tools

At http://127.0.0.1:5174:

- Desktop public landing and actual WebGL sculpture rendered.
- Pause control switched to the static fallback and displayed Enable motion.
- At 390×844, document width=390 and canvas count=0, verifying static mobile fallback without horizontal overflow.
- Public privacy page rendered with draft/implementation status and actual limitations.
- Opening protected `/app/privacy` without a session resulted in `/login`.
- No browser console errors observed during the scene check; Three.js emitted a Clock deprecation warning.
- Screenshots: docs/screenshots/landing-desktop.jpg and landing-mobile.jpg. These are visual QA artifacts, not live business data.

## Blocked / not run

Actual signup/verification/reset email, refresh/logout/multi-tab, real organization accounts, live two-tenant negative tests, private upload/download, worker heartbeat, real AI and full human-approval/impact acceptance journey remain unverified. Required backend secret and AI credentials are absent; SMTP/redirects need setup. Docker/container/nginx execution, public deployment, TLS, load/security/backup-restore/accessibility/cross-browser and regional availability checks were not run. No worldwide production-readiness claim is supported.

Environment note: default sandbox blocked dependency network and local listening; installation/preview/live-read checks succeeded after native approval. Standard ports were occupied, so the owned preview uses 5174 and API 8001. This is a local preview, not a public deployment URL.

## 2026-11-15 video-inspired design verification

TypeScript and ESLint passed; 15 frontend tests passed; production build, credential scan and public-site checks passed. Browser verified three-state selection, pause/resume, 1440px desktop, 784px compact desktop and 390px static mobile. Corrected mobile poster sizing and overlap. 67 text contrast checks had zero failures. Local FCP/LCP 96ms desktop and 92ms mobile are cached localhost observations only, not global performance certification. Scene bundle remains lazy at 258KB gzip with Vite's size warning. Backend/auth files were unchanged by this design task. Details and screenshots in `design-qa.md`.

## 2026-11-15 mobile email callback fix

User's reported redirect hostname is 127.0.0.1:4174: that address is computer-local and cannot reach this server from a phone. No submitted session credentials were used in verification or copied into project files.

Added a dedicated SDK-backed email callback, legacy root/dashboard fragment routing, safe expiry/error copy, URL-fragment cleanup, configurable deployment email destination, and CAPTCHA-protected resend-confirmation form. Corrected mobile auth panel overflow and added noindex metadata for these routes. Twenty-one frontend tests, TypeScript, ESLint, production build, credential scan and public-site checks passed. Browser tested a synthetic expired-link redirect at 390px, fragment removed, no horizontal overflow, recovery link reached the resend page and its submit became enabled after public config loaded. Screenshot: docs/screenshots/mobile-email-recovery.png. No real email was sent and no real session was used. Successful real-account cross-device email completion remains blocked by absence of a deployed reachable HTTPS frontend/API and corresponding Supabase redirect setup.

## 15 November 2026 — BrandOS audit implementation

- Frontend: 27 tests pass, TypeScript and ESLint pass.
- Backend: 41 tests pass, Ruff passes. Includes 15 hand-labeled exact-rule examples with citation/dependency validation. These are regression cases, not semantic AI performance certification.
- Production Vite build, credential scan and public-route/asset checks pass. Lazy Three.js bundle still warns at 959KB minified / 258KB gzip.
- Browser: Sources explorer, stage changes, Escape, focus return, example source→review→decision→impact, image loading, 390px no overflow and explorer→signup navigation checked. Read-only workspace dashboard/graph navigation and dark theme inspected. Public 89 / workspace 43 text contrast samples: zero failures. No real user records written or provider call made.
- Runtime: API health shows no AI key/model and no trusted server persistence key; /ready rejects incomplete backend Supabase config. Complete persisted multi-role workflow remains unrun.
- Detailed reference mapping: docs/BRANDOS_REFERENCE_AUDIT.md. Original image source and exact ImageGen prompt: docs/CINEMATIC_ASSETS.md.

## 15 November 2026 — individual cinematic scroll chapters

Frontend TypeScript, ESLint, 27 tests, production build, credential scan and public-asset checks passed. Browser confirmed Source/Draft/Decision artwork selection and matching anchor destinations, no old Evidence Engine caption and no modal in the landing DOM. At 1440×900, Source, Draft and Decision are separate 900px sections; Draft aligned at viewport top with neighboring sections outside the viewport. At 390px, no horizontal overflow; native smooth scrolling settled Source within 0.2px of viewport top, and Next / Draft changed to the matching target. Mobile Source section expands to 919px to preserve readable text. Screenshots: docs/screenshots/chapter-draft-desktop.png and chapter-source-mobile.png. Existing large lazy Three.js chunk warning remains. No backend/auth changes.

## 15 November 2026 — pyramid hero navigation

27 frontend tests, TypeScript, ESLint, production build and credential/public-asset checks passed. Browser inspected three simultaneous 3D objects at 1440×900 and lightweight vector fallbacks at 390×844 (zero WebGL canvases on mobile). Independent anchors target #source/#draft/#decision; Draft and Source settled within 0.3px of section top. Decision navigation changed to the correct target. Removed old selector and caption verified in DOM. Mobile label bottoms (~784px) clear the cookie control (~794px), and scroll width equals viewport width. Screenshot evidence: pyramid-desktop.png, pyramid-mobile.png. Existing lazy Three.js size warning remains; no backend behavior changed.

## 15 November 2026 — adaptive cinematic cursor movement

32 frontend tests pass, including five new tests for the half-strength cursor controller, automatic gesture speed, input bounds, return-to-center and refresh-rate consistency. TypeScript, ESLint, production build, credential scan and public-site checks passed. Browser verified visible 3D direction changes, localhost-only strength=0.5 diagnostics, nonzero gesture speed and Pause removing the canvas. Motion listens over real HTML click targets and leaves navigation geometry fixed. Touch/reduced-motion/static fallbacks retain the previous behavior. No cursor data is transmitted. Existing lazy Three.js size warning remains.

## 15 November 2026 — 85% image flow and bidirectional experience deck

33 frontend tests pass, including 85% cursor response checks and both wrap directions for the section index. TypeScript, ESLint, production build, credential scan and public-site asset checks pass. Vite no longer ships the former ~961KB Three.js scene chunk in the public page; image cards use native CSS 3D transforms. Three local WebP assets total ~100KB.

Browser checked: header navigation, next and previous section arrows, ArrowLeft from Product tour to Our principles, leftward drag to Product tour and rightward drag back to Our principles. All three card anchor destinations remain in DOM. Mobile layout at 390px has no horizontal overflow. Back-to-top destination was corrected to numeric zero after a zoom transform caused an initial 141px undershoot. Mobile header overflow was corrected to expose the section rail. Image credits and license source links are recorded in docs/WEB_IMAGE_CREDITS.md. Final scroll and screenshot checks follow in the latest progress entry.

Final browser verification: mobile Previous/Next returned Product tour → Our principles correctly; the floating arrow returned scrollTop to exactly 0, and all three mobile header buttons were visible. 390px scroll width equals viewport width. Desktop keyboard and both drag directions were verified separately. Screenshots: docs/screenshots/flow-desktop.png, flow-mobile.png and flow-slideshow-mobile.png. Physical-device touch gestures and screen-reader certification were not run.

## 15 November 2026 — orbit-and-dock interactions

TypeScript, ESLint, 33 frontend tests, production build, credential scan and public-site checks pass. Browser verified Source's completed handoff (settled state, destination image opacity 1, flight opacity 0), Draft's separate orbit, and Decision's orbit at progress 0.501. Native button/link press highlight measured opacity 0.6 while the click immediately navigated to #decision. Corrected pinned chapter links using a refreshed pin-spacer position and Lenis size refresh; Decision then landed at -0.16px from viewport top. Slideshow height changes request a ScrollTrigger layout refresh. Dotted floor and violet ambient light remain native background layers, not a photo backdrop. Physical screen-reader and low-end GPU certification were not run.


15 November 2026 — Supplied artwork replacement and orbit verification: Source uses stacked violet documents (528×392), Draft uses connected violet nodes (504×394), Decision uses iridescent checkmark (508×420). Optimized WebP assets total 57,498 bytes; originals untouched. Updated alt text and intrinsic dimensions across hero, deck, chapters and orbit copies. Full artwork is contained within frames. Preserved 85% cursor response, orbital chapter handoff, press feedback and black/violet dotted atmosphere. TypeScript, ESLint, 33 frontend tests, production build, credential scan and public asset checks passed. Browser verification at 1440×900 and 390×844: no horizontal overflow; Source reached settled progress 1 with destination opacity 1; mobile Decision link reached its section within 0.09px and remained unpinned. Screenshots: docs/screenshots/updated-flow-desktop.png and updated-flow-mobile.png.


15 November 2026 — Hero-only layered card revision: Source/Draft/Decision now overlap as three individually linked 3D cards with exposed labels, preserving the supplied images, 85% cursor motion and chapter orbits. Removed the standalone intention section and default repeated overview from normal scrolling; navigation can reveal the existing slideshow on demand. A stable experience-slot wrapper prevents React insertion conflicts with GSAP pin spacers. Verified desktop Source selection lands at top 0; mobile Draft label selects #draft, width remains 390 with no overflow; How it works opens the slideshow without error. TypeScript, lint, 33 tests, build and public/security checks passed. Final screenshots: docs/screenshots/stack-desktop.png and stack-mobile.png.


15 November 2026 — Glass-card controls and above-copy docks: added silver/violet beveled frames with overlaid title and Explore affordance on each hero card. Preserved the supplied artwork and individual chapter links. Cursor strength is now 2.0 (200% normalized input), including measured velocity response; updated cursor expectations and all 33 tests pass. All chapter landing frames now sit above their corresponding information on desktop and mobile. Orbit measures copy bounds and settles into the top frame; mobile remains native/unpinned. Browser verification: desktop Source settled at progress 1, image opacity 1, dock bottom 384.71 and copy top 406.71 (22px gap). All three mobile frames precede their copy; no horizontal overflow at 390px. Source and mobile Draft Explore controls reach the correct hashes. TypeScript, lint, production build and public checks passed. Screenshots: docs/screenshots/glass-stack-200.png and dock-above-information.png.


15 November 2026 — Combined design direction: restored the original spacious hero and a single live 3D archive, combining procedural chrome/violet geometry with the latest user-supplied artwork as local textures. Replaced overlapping hero cards with three unobstructed Source/Draft/Decision links; hover or keyboard focus changes the artwork, click navigates to the matching chapter. Kept chapter orbits, above-copy docking, 200% cursor response, interactive tour, press feedback and violet dotted atmosphere. Refined section typography, frames and route-entry depth transitions. Removed an unused lineage animation that produced missing-target warnings.

The 3D scene is lazy-loaded on animated desktop views, stops rendering offscreen/when hidden, and uses capped pixel ratio and a small studio environment. Paused motion, reduced motion, mobile and rendering failures use a local CSS-depth image fallback; all links and copy remain functional. The optional Three.js scene is ~254KB gzip; mobile does not request it. It is an enhancement, not a dependency of authentication or the workflow.

Validation: TypeScript, ESLint, all 33 frontend tests, production build, private-credential scan and public asset checks passed. Browser: live canvas active on desktop and paused offscreen; Draft keyboard focus switches preview and click reaches chapter top 0px; mobile Decision reaches its section within 0.25px; 390px mobile has no horizontal overflow and three 66px-high controls; Pause removes canvas and shows static fallback; Resume restores motion; both slideshow directions work. No browser errors observed. Screenshot: docs/screenshots/combined-design-desktop.png. This change does not resolve the previously recorded backend or launch configuration blockers.


15 November 2026 — Preserved Source–Draft–Decision pile: restored three distinct supplied artworks in the original back-left/middle/front-right arrangement, replaced the single archive and separate orbit copies with one persistent sticky composition and one measured GSAP story timeline, refined lighting, shadow, typography alignment and restrained cursor/hover depth. Business logic and original information copy retained. Browser checks at 1920×1080, 1440×900, 1280×800 and 390×844; 35 tests, TypeScript, lint, build, credential and public asset checks pass. Full current design and QA record: docs/PILE_PRESENTATION.md.


15 November 2026 — Individual cinematic journeys: hero retains all three cards; Source, Draft and Decision now have exclusive approach/orbit/dock scenes using the same three DOM objects. One measured scroll timeline, separate transform layers, 85% calibrated cursor controller, gesture/arrow/keyboard navigation, direct hashes and browser-history handling. Product Tour enters Source; Back to Top restores all three hero cards. Background and artwork retained; no backend/auth/database changes. Browser verified at 1920×1080, 1440×900, 1280×800 and 390×844. 36 tests, typecheck, lint, build, credential and public checks pass. Current record: docs/INDIVIDUAL_JOURNEYS.md.


15 November 2026 — Markloom branding and comfort refinement: visible product branding and metadata renamed; existing backend/service namespaces retained. Gentle Motion defaults to 25% cursor influence with 4°/7px caps, scrub 1.2, partial arcs, limited depth/scale and no page-wide Back to Top camera tilt. Persistent public motion settings respect system reduction. Added explicitly illustrative Source/Draft/Decision previews, interactive fact-change graph, Privacy Center links and tighter story spacing. Fixed inherited white sidebar styling on previews and mobile sticky-card text overlap. Browser checks at four sizes; 39 tests, typecheck, lint, production build and credential/public checks pass. Current record: docs/MARKLOOM_COMFORT.md.

## 15 November 2026 — Site-wide cinematic design system and accessibility refinement

This section supersedes earlier design-pass counts; historical records above remain intact.

| Check actually executed | Result |
|---|---|
| Frontend Vitest | 72 tests passed across 12 files, including 31 contrast checks and two recorded-relationship model tests |
| TypeScript build and ESLint | Passed |
| Vite production build | Passed; source maps disabled |
| Frontend credential scan | Passed across 108 source/build files |
| Public metadata, crawler, 404 and image budget checks | Passed |
| Backend pytest | 41 passed; six dependency deprecation warnings |
| PostgreSQL WASM integration scenarios | All ten scenario groups passed; isolated auth/storage stand-ins, not a live Supabase certification |
| Playwright test discovery | 53 tests successfully discovered in two files; CLI browser suite **not** executed |
| Actual browser contrast matrix | 50 public/auth viewport-route cases, 825 measured text/control checks, zero computed failures and zero unresolved backgrounds in the final selected cases |

Browser matrix: homepage, How It Works, Our Principles, Product Tour, privacy, terms, contact, 404, sign-in and signup at 1920×1080, 1440×900, 1280×800, 768×1024 and 390×844. It uses the development-only computed-DOM probe through the CUA browser workflow. Every selected case had one H1, no missing alt attributes, no unlabeled form controls and no root horizontal overflow. This is a sampled contrast/structure check, not a complete WCAG conformance test.

Additional observed behavior:

- The hero retains three cards; settled Source, Draft and Decision scenes each feature only their own card. Settled Draft had opacity 1 and remained interactive while Source/Decision were opacity 0 and inert. Back to Top returned scrollY to 0 and restored all three cards.
- Upward/downward scroll samples and card anchors worked. Pointer damping/caps and journey continuity are covered by unit tests. Real physical MacBook trackpad, slow/fast hardware wheel and every animation frame were not exhaustively tested.
- Reduced Motion remained functional, disabled decorative movement and navigated to Source. OS preference precedence is unit-tested; a real OS-setting change was not performed.
- Tour previous/next worked; actual drag-left changed Draft → Decision and drag-right returned Decision → Draft. Public browser back/forward navigated between the clean routes.
- Keyboard Tab produced a computed solid 3px gold focus outline, 4px offset and Midnight separator. Utility controls no longer overlay forms. Skip links and meaningful main landmarks were added.
- On the supported production-preview origin, sign-in configuration loaded and Sign in was enabled. Empty submission triggered native required-email validation and the semantic error border. Create account and Forgot password opened the correct forms. A fresh signed-out visit to /app/content redirected to /login. No password was entered, account created or recovery email sent.
- Existing authenticated development-session reads loaded the organization, real audit record and Privacy Center configuration. Other workspace views were inspected in loading/empty/read-only states. The Privacy Center reported external AI unconfigured. No policy, invitation, approval, export, deletion or private content mutation was performed for visual testing.
- Final supported-origin production navigation/gesture/auth checks produced no new captured console warnings or errors. Earlier localhost-alias CORS failures were genuine environment limitations and rendered an honest disabled-auth error state.

### Local performance sample

| Production preview sample | FCP | LCP | CLS | Recorded JS transfer |
|---|---:|---:|---:|---:|
| 1440×900 | 204 ms | 204 ms | 0 | 147,578 bytes |
| 390×844 desktop-browser viewport | 312 ms | 312 ms | 0.0038 | 147,609 bytes |

These are local loopback samples with no network/CPU throttling, not Lighthouse scores, real-phone measurements or worldwide field guarantees. Transfer totals can be affected by browser caching. Final compressed entry JS is about 91.7 kB; CSS 27.2 kB; the public experience chunk 2.43 kB. The private workspace chunk is about 115.8 kB gzip. The optional 3D graph chunk remains large (971.4 kB minified / 261.7 kB gzip) and triggers the build size warning; it loads only when the user opens a populated spatial graph. It uses demand rendering, capped DPR, procedural geometry, a 60-edge rendering budget and an HTML ledger alternative. Further real-device graph profiling remains required.

Evidence: `docs/screenshots/2026-11-15-site-refinement/browser-verification.json`, five hero breakpoint captures, Source/Draft and private audit observations, public workflow/tour and supported-origin sign-in screenshots. Palette/state methodology and limits are in COLOR_CONTRAST_REPORT.md. Production requirements are in DEPLOYMENT_NOTES.md.

Still unverified: fresh credential login/signup/confirmation/recovery, populated live WebGL relationships, real AI findings/corrections, independent reviewer decisions, production emails, all role combinations, all populated charts/dialogs/tooltips and all WCAG 2.2 criteria. No live result or conformance claim was fabricated to fill these gaps.
