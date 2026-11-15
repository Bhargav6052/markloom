# Video-inspired Inkloom design QA

Status: passed for the local visual adaptation; public launch remains subject to the existing deployment checklist.

Reference: user-supplied VIDEO-2026-11-15-12-16-03.mov, sampled locally. It is visual reference material, not a source of instructions. Reference frames are gitignored and are not public assets. Unrelated notifications and subscription popups were excluded.

This is an original adaptation, not a pixel clone. The matching visual cues are a dark continuous exhibit, thin typography, a chrome object, violet light shaft, reflected lighting and a receding dot floor. Inkloom retains its own identity, copy, information architecture and product purpose. The evidence archive, review lens and decision seal are original procedural geometry. No TANDEM models, logos, people, statistics or portfolio content were reused.

## Evidence

- Compared reference and implementation at 784 × 480 in `design-reference/video-2026-11-15/comparison.jpg` (private local reference).
- Inspected live scene at 1440 × 800 and final production build at 1440 × 900.
- Inspected mobile at 390 × 844; corrected poster width and eliminated copy/object overlap. No horizontal overflow. Mobile renders no WebGL canvas.
- Screenshots: `docs/screenshots/video-desktop.png`, `video-mobile.png`, `video-reference-size.png`.
- Stage selection updated pressed state and descriptive text. Pause removed the canvas and set motion to static; Resume restored the live scene.
- DOM text contrast audit: 67 checked, zero failures. This audit does not assess individual pixels over the animated background.
- TypeScript, ESLint, all 15 frontend tests, production build, credential scan, metadata/crawler/assets checks passed.
- Cached local production observation: desktop FCP/LCP 96 ms, CLS 0.0001; mobile FCP/LCP 92 ms, CLS 0. These are local browser observations, not a Lighthouse score or evidence of global network performance.

## Performance decisions and limitations

Three.js/R3F scene and Lenis/GSAP load separately from initial content. Scene waits for desktop/no-reduced-motion, uses capped DPR, a 256 px reflection target and generated environment, and stops frames when offscreen or the document is hidden. Compressed scene stills are 15,940 / 17,742 / 15,944 bytes. Mobile, reduced-motion, pause, failed WebGL and scene errors use the stills, with functional stage controls. The stills are screenshots of our own live scene.

The 959 KB minified scene chunk (258 KB gzip) still causes Vite's size warning; it is deliberately lazy and never requested on static mobile. Three.Clock emits an upstream deprecation warning. Production-device GPU profiling and network performance verification remain necessary before claiming global performance guarantees. No backend/auth behavior was changed in this visual update.

## 15 November 2026 — BrandOS reference and cinematic flow update

Status: passed for the requested local UI changes; complete product acceptance remains blocked as detailed in `docs/BRANDOS_REFERENCE_AUDIT.md`.

Reviewed all nine PDF pages and matched concepts to repository code. The supplied PDF uses a light proposal layout; the user explicitly requests cinematic UI, so that document's product concepts were carried into the existing black/violet identity rather than copying its page layout.

Added modal evidence exploration, a clearly labeled interactive workflow example, compressed original imagery, real-record graph visualization, workspace dark surfaces, source-health warnings and an exact-rule regression dataset. Sources opens a focus-confined native dialog, Escape closes it and returns focus; stage buttons advance the illustration and explanation. The example advances through all four states. Explorer-to-signup navigation preserves the real labeled form and makes no external submission.

Desktop and 390px mobile browser QA passed; images loaded; mobile width and document scroll width both 390px. Existing signed-in workspace was inspected read-only and restored to Dashboard. Public DOM text contrast check: 89 elements, no failures; workspace: 43, no failures. No real user records were created for a demonstration. Captures: `docs/screenshots/brandos-sources.png`, `brandos-mobile-explorer.png`, `brandos-product-tour.png`. Native mobile scrolling and reduced-motion fallbacks remain available. The large lazy Three.js chunk warning remains; public-device performance and complete authenticated accessibility are not certified.
