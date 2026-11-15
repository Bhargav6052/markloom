# Markloom: motion comfort and product context

Current refinement, 15 November 2026. Supersedes the earlier 85% cursor and full-orbit presentation.

## Scope

Visible branding, workspace wordmark, authentication copy, page titles, metadata, README and generated social branding now use Markloom. Existing service, database, storage and event identifiers remain compatible; backend APIs, authentication behavior, permissions and data models were not changed. The original background, dotted floor, lighting palette, card artwork and three independent scenes are retained.

## Motion

- Gentle Motion is the default. Full Motion and Reduced Motion are available from a persistent public-page control; the choice is stored locally.
- A system reduced-motion preference takes priority over the chosen setting. Reduced Motion keeps navigation while disabling decorative flight and cursor transforms.
- Cursor influence is 25%, with explicit visual caps of 4° per axis and 7px translation. Velocity contribution and damping are bounded; the background spotlight no longer follows the pointer.
- ScrollTrigger scrub is 1.2. Each card follows a short partial arc and a tangent-matched dock instead of a full orbit. Gentle motion uses small depth changes and a stable 1.025 feature scale. Full remains restrained.
- Fast scrolling reduces decorative rotational/depth contribution. All choreography remains a pure function of scroll position, so tiny movements do not restart a timed orbit.
- The entire-page Back to Top tilt/blur is removed. Route entries use a light fade; supporting text stays stationary in its section.
- Desktop story lengths reduce from 175svh to 145svh; mobile from 185svh to 165svh, while preserving room for the independent scenes.

## Product context

Source shows a compact approved-guidance/fact preview; Draft shows an original claim, an explanatory finding, its cited example source and a suggested correction; Decision shows a version, example reviewer comment and pending human decision. These are explicitly illustrative, not live AI results or actual approvals. The public page does not fetch or expose private workspace records. On mobile, accessible disclosures reveal the examples; the card and scene controls leave with the reading section to prevent text collisions.

The Living Evidence Graph is an interactive explanatory example. A simulated fact change highlights two connected content revisions for human re-review while leaving an unrelated handbook unchanged. The workspace graph link opens the existing real application route. Privacy and Trust links to /app/privacy and the public privacy policy. The existing signup CTA remains functional.

## Validation

- 39 frontend tests pass, including default preference, system-priority and hard cursor-bound checks.
- TypeScript, ESLint, production build, credential scan and public metadata/asset checks pass.
- Browser reviewed at 1440×900, 1280×800, 390×844 and 1920×1080, without observed horizontal overflow.
- Gentle, Full and Reduced choices were exercised; Gentle was left selected. Reduced retained functional navigation and hero restoration. OS preference priority is covered by code and unit checks, not an OS-settings mutation.
- Source and Draft desktop previews have clear gaps below the featured card. At 1280×800, the Decision card bottom was about 494px and preview began at 520px.
- Mobile Draft example expands and remains readable; after scrolling into its example, the foreground card was entirely above the viewport rather than covering the heading or body text.
- Graph simulation marks the two connected examples for re-review and preserves the handbook's unlinked state.
- Slow and larger reverse wheel inputs were exercised; sampled decorative poses remained restrained. No physical-device trackpad certification or medical comfort claim is made.
- Final preview reported the Markloom title, Gentle mode, all three hero cards, no overflow at 1920×1080 and no browser errors.

Screenshots in docs/screenshots: markloom-hero-wide.png, markloom-source-desktop.png, markloom-draft-desktop.png, markloom-decision-laptop.png, markloom-mobile-example.png, markloom-evidence-graph-desktop.png and markloom-evidence-graph-mobile.png.

The production domain, operator details and backend launch requirements recorded earlier remain separate. This refinement does not claim a deployed production platform or live AI-provider readiness.
