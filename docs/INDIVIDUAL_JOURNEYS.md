# Current presentation: three independent cinematic journeys

15 November 2026. Journey architecture reference. Current motion settings and product previews are documented in MARKLOOM_COMFORT.md; the full-orbit/85% values below are historical.

## Experience

The hero retains the original Source / Draft / Decision overlapping pile and the existing user-supplied artworks. Once scrolling leaves the hero, only the corresponding card is featured in each information scene. Each existing DOM card approaches on a curved path, makes one closed orbit in the visual focal area, slows, and docks. Inactive cards become transparent, inert and hidden from accessibility navigation; no scene clones are created. The orbit stays clear of the information text. Upward scrolling reverses the choreography, and Back to Top restores the original three-card hero.

The existing black/purple atmosphere, lighting layers, and perspective-dot floor rules are unchanged. No replacement artwork was downloaded or copied from Pinterest. Existing asset provenance remains in WEB_IMAGE_CREDITS.md; no new licensing claim is made for user-supplied assets.

## Implementation

- One GSAP ScrollTrigger track evaluates a pure, measured journey model using section offsets.
- Explicit nested transform layers own travel, 3D orientation, calibrated 85% pointer response and hover depth separately.
- Direct navigation moves to the selected section and then plays the orbit/dock segment over one second; normal scrolling maps directly to the same reversible path.
- Scene links, next/previous controls, horizontal drag, horizontal wheel gestures and focused arrow keys share the same scene-navigation action. Vertical scrolling remains available.
- Product Tour enters the Source scene. Browser history, direct scene hashes and onward navigation use the real section destinations.
- Reduced/paused motion disables flights and pointer transforms while still showing only the correct scene card. It preserves the three-card hero and functioning navigation.
- The public scene uses native CSS 3D and the current local WebP assets. Backend, authentication, database and application business logic are not changed.

## Verification

36 frontend tests, TypeScript, ESLint, production build, credential scan and public asset checks passed.

Browser checks:

- 1440×900: hero contains all three cards; Source, Draft and Decision each reach settled state with one visible card and two inert/hidden cards.
- Manual upward scroll changes Source from settled to orbit while keeping the other cards hidden.
- Next/previous controls, keyboard arrows and browser Back navigate correctly.
- 1280×800: a horizontal mouse drag moves Source to Draft; horizontal wheel moves Draft to Decision; no horizontal overflow.
- 390×844: direct #draft link reaches a settled Draft with its bottom about 275px and information beginning at 430px; no overflow. Next moves to Decision alone.
- Paused mode still shows only Draft in its section. Resume restores motion.
- Back to Top reaches scrollY 0, scene hero, and all three visible cards.
- Product Tour enters Source. Final CTA/footer and privacy controls remain present.
- 1920×1080: Decision is the only visible featured card and remains within the viewport.
- No browser errors reported in the final preview.

Evidence in docs/screenshots: journey-hero.png, journey-source.png, journey-source-orbit.png, journey-draft.png, journey-decision.png, journey-mobile-draft.png, journey-wide-decision.png and journey-footer.png. Evidence consists of screenshots and observed browser interactions; no screen-recording file was captured. Mobile checks use a browser viewport, not a physical-device certification. Existing deployment/backend configuration requirements remain separate.
