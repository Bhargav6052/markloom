# Color contrast report — 2026-11-15

Target: WCAG 2.2 AA. This is a scoped engineering audit, **not a whole-site conformance certification**.

The luminance tests use the WCAG sRGB transfer function and compare unrounded ratios. Requirements follow [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): ordinary text 4.5:1, large text 3:1, essential boundaries/graphics 3:1. Disabled controls have a genuine inactive-component exception; their labels still use readable muted text.

## Automated semantic pairs

28 approved pairs pass. The 31-test suite additionally checks the 21:1 reference, rejects ivory on bright accents, and verifies JSON/CSS token synchronization. Bright accent buttons use Midnight text. Essential graph strokes no longer use low-alpha colors. Focus uses a solid 3px gold outline with a 4px Midnight separator; browser computed styles confirmed both.

| Component | Foreground | Background | Ratio | Required | Result | Correction |
|---|---|---|---:|---:|---|---|
| Primary text / midnight | #F7F6FA | #0A0812 | 18.476:1 | 4.5:1 | PASS | Semantic token assignment |
| muted text / midnight | #AFA6BD | #0A0812 | 8.531:1 | 4.5:1 | PASS | Semantic token assignment |
| violet text / midnight | #9B8CFF | #0A0812 | 7.184:1 | 4.5:1 | PASS | Semantic token assignment |
| gold text / midnight | #E9BC70 | #0A0812 | 11.257:1 | 4.5:1 | PASS | Semantic token assignment |
| error text / midnight | #FFB4AF | #0A0812 | 11.738:1 | 4.5:1 | PASS | Semantic token assignment |
| success text / midnight | #9BDEBB | #0A0812 | 12.836:1 | 4.5:1 | PASS | Semantic token assignment |
| info text / midnight | #B9C8FF | #0A0812 | 12.087:1 | 4.5:1 | PASS | Semantic token assignment |
| Primary text / surface | #F7F6FA | #12101C | 17.479:1 | 4.5:1 | PASS | Semantic token assignment |
| muted text / surface | #AFA6BD | #12101C | 8.071:1 | 4.5:1 | PASS | Semantic token assignment |
| violet text / surface | #9B8CFF | #12101C | 6.796:1 | 4.5:1 | PASS | Semantic token assignment |
| gold text / surface | #E9BC70 | #12101C | 10.650:1 | 4.5:1 | PASS | Semantic token assignment |
| error text / surface | #FFB4AF | #12101C | 11.105:1 | 4.5:1 | PASS | Semantic token assignment |
| success text / surface | #9BDEBB | #12101C | 12.144:1 | 4.5:1 | PASS | Semantic token assignment |
| info text / surface | #B9C8FF | #12101C | 11.435:1 | 4.5:1 | PASS | Semantic token assignment |
| Primary text / raised | #F7F6FA | #1C1828 | 16.121:1 | 4.5:1 | PASS | Semantic token assignment |
| muted text / raised | #AFA6BD | #1C1828 | 7.444:1 | 4.5:1 | PASS | Semantic token assignment |
| violet text / raised | #9B8CFF | #1C1828 | 6.268:1 | 4.5:1 | PASS | Semantic token assignment |
| gold text / raised | #E9BC70 | #1C1828 | 9.823:1 | 4.5:1 | PASS | Semantic token assignment |
| error text / raised | #FFB4AF | #1C1828 | 10.242:1 | 4.5:1 | PASS | Semantic token assignment |
| success text / raised | #9BDEBB | #1C1828 | 11.200:1 | 4.5:1 | PASS | Semantic token assignment |
| info text / raised | #B9C8FF | #1C1828 | 10.547:1 | 4.5:1 | PASS | Semantic token assignment |
| violet action: normal/hover/pressed | #0A0812 | #9B8CFF | 7.184:1 | 4.5:1 | PASS | Semantic token assignment |
| gold action: normal/hover/pressed | #0A0812 | #E9BC70 | 11.257:1 | 4.5:1 | PASS | Semantic token assignment |
| Control/graph boundary / midnight | #81758F | #0A0812 | 4.614:1 | 3:1 | PASS | Semantic token assignment |
| Control/graph boundary / surface | #81758F | #12101C | 4.366:1 | 3:1 | PASS | Semantic token assignment |
| Control/graph boundary / raised | #81758F | #1C1828 | 4.026:1 | 3:1 | PASS | Semantic token assignment |
| lightViolet / light surface | #4F3C9D | #F7F6FA | 7.916:1 | 4.5:1 | PASS | Semantic token assignment |
| lightGold / light surface | #705012 | #F7F6FA | 6.860:1 | 4.5:1 | PASS | Semantic token assignment |

## Browser-computed audit

`BrowserAudit.tsx` is a development-only DOM probe, excluded from production. It inspects visible text, alpha-composites ancestor backgrounds, calculates actual font-size thresholds and measures input/select/textarea boundaries against inside and outside colors. It also records alt attributes, labels, heading count and horizontal overflow. Painted backgrounds, filters and opacity that cannot be resolved are flagged for manual review, never counted as passes. It does not resolve every overlapping sibling, pseudo-element, canvas pixel or image; screenshots and manual review remain necessary.

The public/auth matrix covers 1920×1080, 1440×900, 1280×800, 768×1024 and 390×844 on ten routes. Observations, corrections and final rechecks are saved under `docs/screenshots/2026-11-15-site-refinement/`. Initial legacy Sign in text measured 2.572:1; public-page CTA text measured 1.539:1. Both were corrected to Midnight on Violet (7.184:1). Card labels and preview text now have opaque backing. Card entrance opacity was removed while retaining the restrained transform entrance; inactive cards are inert during fades. Additional representative Source/Draft/Decision, graph-example, keyboard focus and private read-only frames were inspected.

A reusable Playwright matrix is in `tests/e2e/contrast.spec.ts`; it fails on measured text/control contrast failures, missing labels/alt, wrong H1 count and overflow. Browser execution in this session used the CUA browser workflow and the equivalent DOM probe, rather than running the Playwright CLI. The 50-case CLI matrix itself is not claimed as executed. See TEST_RESULTS.md and the recorded JSON for exact observations.

## Limits and remaining review

Authenticated checks used the existing admin session, including live organization, empty-record, Privacy Center and audit-history states. They do not certify every populated row, every role, dialog, tooltip, validation state or canvas relationship. New 3D graph model tests verify version-specific edges, broken-reference exclusion, rendering limits and open-impact highlighting; a populated live WebGL graph remains unverified because this workspace had no recorded dependencies. Charts with populated data, provider failures, invitations, approval actions and private exports/deletion were not fabricated or invoked for appearance testing.

Full screen-reader, 200–400% zoom, forced-colors, real trackpad/device testing and all animated brightest-pixel combinations remain manual acceptance items. No claim of complete WCAG 2.2 AA conformance is made from palette tests or sampled frames alone.

## Final recorded sample totals

The saved matrix contains **50 cases and 825 measured text/control checks**, with **0 computed failures and 0 unresolved backgrounds in the selected final cases**. The three initial hero-frame opacity flags were addressed by retaining the card transform entrance without fading its readable labels, and all five hero sizes were rechecked. Additional settled Source, Draft and Decision frames each recorded zero failures and zero unresolved backgrounds. These totals describe the sampled frames only. The raw workspace summaries include earlier painted-background flags and loading observations; they are not included in the public/auth matrix total or presented as a private-page certification.
