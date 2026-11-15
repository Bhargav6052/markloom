# Inkloom cinematic identity

Implemented 15 November 2026. This is an original visual direction for the existing Inkloom product; no TANDEM branding, copy, models or layout was copied.

## Visual concept

“Evidence in orbit” connects approved source material, a creative draft and an independent human decision. Three illuminated document layers replace a generic decorative object. Document selection changes the explanatory caption; the scene is explicitly a conceptual illustration, not tenant data or fake live analysis.

Black/charcoal surfaces, restrained violet accents, thin system sans-serif typography, large whitespace, quiet rules and a single consistent workspace CTA establish the identity. The workflow, lineage diagram and closing section extend the product story. Legal/auth pages receive compatible dark public styling; authenticated workspace surfaces keep their clear neutral layout and contrast corrections.

The wordmark uses an original stacked-document mark. Favicon, social image and share copy were updated to match the violet identity. Social assets remain optimized and under the existing build budgets.

## Motion and interaction

- Lenis 1.3.27 and GSAP 3.15.1 / ScrollTrigger are loaded dynamically for desktop motion. A shared GSAP ticker drives Lenis and keeps scroll effects synchronized.
- Hero line staggers, workflow reveals, illustration parallax and section transitions use scoped GSAP context. Native anchors/buttons remain usable without the motion module.
- React Three Fiber / Three.js renders procedural document panels with local canvas textures, metal/roughness materials, violet lighting, percentage-filtered shadows and a small generated studio environment. No external model, HDR or font is downloaded.
- Pointer movement gently shifts the camera and document system. Clicking a 3D document selects its stage. Keyboard-accessible HTML stage buttons provide the same selection without requiring the canvas.
- DPR is capped at 1.35; environment resolution is 64; shadow map is 512. The scene is deferred and its frame loop stops offscreen or when the document is hidden.
- Pause tears down Lenis/ScrollTrigger and removes the live canvas. Reduced-motion preferences choose the static/native path and cannot be overridden by the motion button. Mobile defaults to native scrolling and CSS perspective documents, with functional stage selection.
- Unmounting the landing page destroys Lenis, reverts scoped GSAP styles/triggers and releases scene textures/environment resources. No backend/auth operation depends on decorative animation.

## Verification

Frontend TypeScript, ESLint, ten existing unit tests, production build, secret scan and metadata/asset budget checks passed. Runtime desktop checks verified real mesh click → Draft selection, stage captions, smooth workflow anchor positioning, native/static pause, and offscreen `data-rendering=paused`. Mobile 390×844: width=scrollWidth=390, canvas=0, no Lenis instance, keyboard stage selection still works. Computed check found zero sub-4.5:1 failures across 71 checked public text elements (decorative/disabled text excluded). Privacy route navigation returned the correct title/theme with no retained Lenis instance.

Build sizes: initial main JS ~259.02 KB / 82.56 KB gzip, desktop motion module ~135.04 KB / 51.10 KB gzip, lazy Three scene ~942.37 KB / 253.79 KB gzip, CSS ~32.38 KB / 8.66 KB gzip. The Three bundle still triggers Vite's large-chunk advisory; it is not part of the mobile/static path.

Local cached/loopback browser observations: desktop FCP/LCP 156–344ms, mobile FCP/LCP 184ms, CLS 0 in observed runs. These are development-machine observations, not production Lighthouse, global-network or FPS guarantees. Three.js/R3F emits an existing Clock deprecation warning; no application console errors were observed. Actual OS-level reduced-motion switching was not automated; the shared pause/static path and media-query implementation were checked.

Screenshots are in docs/screenshots/cinematic-desktop.jpg, cinematic-workflow.jpg and cinematic-mobile-full.jpg. Production domain/legal/credential/deployment blockers from LAUNCH_CHECKLIST.md remain unchanged; this redesign was not publicly deployed.

## 2026-11-15 — supplied video adaptation

Replaced the document-card hero with an original chrome evidence engine, review lens and decision seal. The full-width exhibit uses a generated violet beam, reflective dark floor and perspective dots. Existing Lenis/ScrollTrigger support remains. Desktop pointer/camera response and stage morphs are decorative; controls, text, navigation and auth links remain independent. Mobile and reduced-motion use compressed renders of the same original scene. See `design-qa.md` for measured checks and limitations.

## 15 November 2026 — independent Source / Draft / Decision chapters

Replaced the combined workflow list and modal explorer with three distinct scroll destinations: `#source`, `#draft`, and `#decision`. Each desktop chapter occupies at least one viewport; mobile chapters grow to fit readable content. Each has its own illustration, on-image stage title, explanation and next-chapter link. GSAP reveals/parallax run independently per chapter; native smooth scrolling remains available on mobile, with immediate scrolling for reduced-motion/paused preferences.

Removed the visible “The Evidence Engine” caption. The active hero artwork now carries Source, Draft or Decision directly over the image. Its accessible image link targets the matching chapter; bottom controls select the preview without opening a dialog. Text is HTML rather than baked into the raster, so it stays sharp and accessible on all screen sizes. No artwork regeneration, backend or auth change was needed.

## 15 November 2026 — simultaneous 3D pyramid navigation

Replaced the hero's single switching model with three distinct objects visible together in a triangular/pyramid arrangement: source sheets at the apex, a draft with a review lens at lower left, and a decision seal at lower right. A faint 3D triangular connection and shared violet lighting tie them together. Large semantic HTML anchor targets independently link to #source, #draft and #decision; object labels remain sharp, keyboard reachable and available without WebGL. Pointer/camera movement stays decorative.

Original shaded SVG objects form the lightweight mobile, reduced-motion, loading, pause and WebGL-failure fallback; all three links remain available. The old selector, active-stage footnote, technical caption and hero kicker were removed. Shortened the hero subcopy and chapter introduction, removed repeated image metadata/counters, and omitted the noninteractive mobile motion status. Kept desktop pause/resume and all substantive chapter information.

Desktop and 390px mobile were inspected. Draft settled within 0.3px of its target, Source within 0.3px; Decision clicked to its exact target. Mobile label bottoms are ~784px, above the cookie control at ~794px. No horizontal overflow. Latest screenshots: docs/screenshots/pyramid-desktop.png and pyramid-mobile.png. Native smooth anchors honor reduced-motion preferences. Existing deployment/product limitations are unchanged.

## 15 November 2026 — adaptive 50% cursor response

The three live objects now share a ref-based pointer controller (`cursorMotion.ts`). Cursor coordinates are normalized to the hero; `CURSOR_STRENGTH = 0.5` applies half-strength response. Successive event positions and timestamps calculate direction and velocity automatically. Fast gestures raise the damping response and add a small bounded inertial tilt/depth movement; slow gestures ease more gently. Momentum decays after movement stops. Each icon uses the same response strength with its own subtle floating phase. The camera adds restrained parallax.

Listeners are attached to the hero rather than only the WebGL canvas, so moving over the HTML icon links continues to work. Labels and navigation hit areas stay fixed. Pointer leave, cancel, scrolling, window blur and hidden-document events clear the input; re-entry establishes a fresh position without a speed spike. Delta-time bounds and exponential smoothing keep movement stable across refresh rates and suspended frames. Touch input is ignored; existing mobile/reduced-motion/paused fallbacks remain static and usable.

Added five meaningful controller tests: half-strength steady position, fast-vs-slow automatic speed, extreme input bounds/stale events, release/recentering and consistent 30/144Hz settling. Browser QA observed live response strength 0.5, opposing cursor-direction values and nonzero speed (~0.46 normalized units/sec) after successive movements. Pause removed the canvas. Localhost-only numeric diagnostics are stored on the scene host for QA; no cursor coordinates are sent to analytics or the backend. Screenshot: docs/screenshots/pyramid-cursor-motion.png.

## 15 November 2026 — web artwork, 85% flow and section slideshow

Replaced the triangle with a left-to-right Source → Draft → Decision strip. Three free web-sourced 3D renders are locally compressed and hosted; source pages/artists/license are recorded in WEB_IMAGE_CREDITS.md. Each label sits inside the image with a contrast gradient, and each card links to its independent information chapter. Cards use native GPU 3D perspective, cursor-driven pitch/yaw/depth, highlights and shadows. They are image planes, not volumetric replacements for the photographed artwork. The old heavy Three.js hero no longer ships in the page bundle.

The shared timestamp-based controller now uses CURSOR_STRENGTH = 0.85. Its adaptive response rate also scales with strength, so faster gestures respond more quickly. Mobile/reduced-motion/paused views stay readable and static; offscreen/hidden cards stop the animation loop. All three labels remain functional links.

How it works, Our principles and Product tour now select an accessible three-panel experience deck. Both previous/next arrows wrap, arrow keys work, and horizontal pointer drags/swipes work in either direction. Vertical touch scrolling is retained. The real illustrative four-step product tour remains interactive inside its panel. Ordinary chapter anchors remain independent of the slideshow.

Added a lower-right floating up-arrow. It uses smooth Lenis/native scrolling and a restrained 3D viewport entrance, with immediate scrolling under reduced motion. Its top destination is numeric zero so the zoom transform cannot change the scroll target. The mobile header exposes all three section controls; corrected inherited overflow that clipped them.

## 15 November 2026 — scroll orbit, docking and press feedback

Preserved the supplied reference's dark stage identity: native perspective dots, a soft violet pool and a vertical atmospheric beam. These are CSS layers, not a replacement photographic background. Foreground source artwork and the independent information sections remain.

Each chapter now has an aria-hidden visual copy of its card. ScrollTrigger drives one complete ellipse around the information, with depth/yaw/pitch changes, then expands the card into the image frame and hands off to the accessible chapter image. Desktop chapters stay in view during the scroll sequence; scrolling backward reverses it. Mobile uses a compact unpinned orbit around the illustration to keep text and normal touch scrolling readable. Reduced-motion/paused views render the settled image without orbit or pinning. GSAP context cleanup restores the original layout and image styles.

Press feedback is global: pointerdown/keyboard capture starts a short 3D glow before a control's ordinary handler. It does not intercept, delay, replay or bypass the actual action or form validation. The highlight is a pointer-events-none overlay, leaving the real click target unchanged. Reduced-motion users receive a short opacity highlight without 3D movement.

Verified Source reached data-orbit-state=settled with accessible image opacity 1 and flying copy opacity 0. Draft ran its separate orbit. A Next / Decision click changed the hash while the highlight was visibly active (opacity 0.6), confirming immediate action with pre-action feedback. Frontend checks: TypeScript, ESLint, 33 tests, build, credential scan and public-site checks passed.


15 November 2026 — Combined design direction: restored the original spacious hero and a single live 3D archive, combining procedural chrome/violet geometry with the latest user-supplied artwork as local textures. Replaced overlapping hero cards with three unobstructed Source/Draft/Decision links; hover or keyboard focus changes the artwork, click navigates to the matching chapter. Kept chapter orbits, above-copy docking, 200% cursor response, interactive tour, press feedback and violet dotted atmosphere. Refined section typography, frames and route-entry depth transitions. Removed an unused lineage animation that produced missing-target warnings.

The 3D scene is lazy-loaded on animated desktop views, stops rendering offscreen/when hidden, and uses capped pixel ratio and a small studio environment. Paused motion, reduced motion, mobile and rendering failures use a local CSS-depth image fallback; all links and copy remain functional. The optional Three.js scene is ~254KB gzip; mobile does not request it. It is an enhancement, not a dependency of authentication or the workflow.

Validation: TypeScript, ESLint, all 33 frontend tests, production build, private-credential scan and public asset checks passed. Browser: live canvas active on desktop and paused offscreen; Draft keyboard focus switches preview and click reaches chapter top 0px; mobile Decision reaches its section within 0.25px; 390px mobile has no horizontal overflow and three 66px-high controls; Pause removes canvas and shows static fallback; Resume restores motion; both slideshow directions work. No browser errors observed. Screenshot: docs/screenshots/combined-design-desktop.png. This change does not resolve the previously recorded backend or launch configuration blockers.


15 November 2026 — Preserved Source–Draft–Decision pile: restored three distinct supplied artworks in the original back-left/middle/front-right arrangement, replaced the single archive and separate orbit copies with one persistent sticky composition and one measured GSAP story timeline, refined lighting, shadow, typography alignment and restrained cursor/hover depth. Business logic and original information copy retained. Browser checks at 1920×1080, 1440×900, 1280×800 and 390×844; 35 tests, TypeScript, lint, build, credential and public asset checks pass. Full current design and QA record: docs/PILE_PRESENTATION.md.


15 November 2026 — Individual cinematic journeys: hero retains all three cards; Source, Draft and Decision now have exclusive approach/orbit/dock scenes using the same three DOM objects. One measured scroll timeline, separate transform layers, 85% calibrated cursor controller, gesture/arrow/keyboard navigation, direct hashes and browser-history handling. Product Tour enters Source; Back to Top restores all three hero cards. Background and artwork retained; no backend/auth/database changes. Browser verified at 1920×1080, 1440×900, 1280×800 and 390×844. 36 tests, typecheck, lint, build, credential and public checks pass. Current record: docs/INDIVIDUAL_JOURNEYS.md.


15 November 2026 — Markloom branding and comfort refinement: visible product branding and metadata renamed; existing backend/service namespaces retained. Gentle Motion defaults to 25% cursor influence with 4°/7px caps, scrub 1.2, partial arcs, limited depth/scale and no page-wide Back to Top camera tilt. Persistent public motion settings respect system reduction. Added explicitly illustrative Source/Draft/Decision previews, interactive fact-change graph, Privacy Center links and tighter story spacing. Fixed inherited white sidebar styling on previews and mobile sticky-card text overlap. Browser checks at four sizes; 39 tests, typecheck, lint, production build and credential/public checks pass. Current record: docs/MARKLOOM_COMFORT.md.
