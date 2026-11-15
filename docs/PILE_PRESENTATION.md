# Inkloom: preserved three-card presentation

Historical presentation, 15 November 2026. Superseded by INDIVIDUAL_JOURNEYS.md; the current design features one card at a time after the hero.

## Preserved identity

Source remains the back-left card, Draft the middle card, and Decision the front-right card in the resting pile. All three supplied artworks, names, links, and information copy are retained. The implementation changes the public presentation and animation only. It does not change authentication, database, API, role checks, or application business logic.

## Audit and implementation

The preceding hero showed one archive with changing artwork, which did not preserve three distinct cards. Independent chapter orbit copies also broke the relationship between the original pile and the text. Pointer response and thick frames competed with the content.

The implementation restores the three-card HTML composition with native CSS perspective, beveled edges, restrained metallic highlights, local artwork, and soft overlapping shadows. A violet spotlight and the existing perspective-dot floor provide a shared environment. The initial stagger, subtle idle movement, focus illumination, hover depth and pointer tilt use separate transform variables so they do not overwrite one another.

The same three DOM cards stay in a sticky rail spanning the hero and all three story sections. One GSAP ScrollTrigger timeline brings the relevant card forward and returns the previous one, with natural reverse playback. Stage positions come from measured section offsets rather than assumed equal section heights. No card is cloned for chapter animations. Explicit resting and selected stacking order prevents perspective from reversing the pile at different widths.

Desktop keeps the information on the left and the connected pile on the right. Mobile keeps the same pile above the copy, preserves native touch scrolling, and reserves space to prevent overlap. Pausing motion or requesting reduced motion keeps all three cards, links, and sections available. Pointer loops stop when the pile is offscreen or the document is hidden. The unused single-archive renderer is no longer imported or shipped in the public bundle.

## Verification

- TypeScript, ESLint, all 35 frontend tests, production build, credential scan and public asset checks passed.
- Browser reviewed at 1920×1080, 1440×900, 1280×800 and 390×844; no horizontal overflow observed.
- Three cards remain present through Source, Draft and Decision; stage values reach 1, 2 and 3 and reverse on upward scrolling.
- Stage links and an actual Draft artwork-card click reach the corresponding section; desktop section tops reach 0px.
- Mobile Draft stage: sticky stage top 15px, last card bottom about 351px, information top 435px. No image/text collision.
- Pause mode retains three visible cards and disables the idle animation. Resume restores motion.
- Onward navigation to Our principles remains functional. No browser errors were reported in the final preview.
- Screenshots: pile-hero-1440.png, pile-hero-1280.png, pile-story-1920.png, pile-source.png, pile-draft.png, pile-decision.png, pile-mobile-hero.png and pile-mobile-draft.png in docs/screenshots.

This is a frontend verification, not a new live authentication, backend or production-readiness certification. Existing launch configuration requirements remain recorded separately.
