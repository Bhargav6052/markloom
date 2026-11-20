# Liquid Glass-inspired web interface

A shared final CSS layer changes all public and authenticated surfaces without replacing
existing React routing, roles, data flows or approvals. The dark indigo palette, rounded
controls, frosted navigation, subtle lighting and opaque document surfaces are inspired
by Apple's materials guidance, not native Apple APIs. Native OS/browser rendering can differ.

Workspace navigation scrolls independently on desktop; account details and Sign out remain
outside the scrolling area. Mobile uses horizontally scrollable navigation and a visible
account row. Short desktop windows fall back to normal scrolling.

Blur is limited to navigation and utility chrome. Unsupported backdrop filters use
opaque backgrounds. Reduced transparency, increased contrast and reduced motion preferences
are respected; appearance settings persist a separate local transparency preference.
Existing cinematic assets and interaction logic remain unchanged.

Verify desktop/mobile layout, short windows, keyboard navigation, authentication, content
revision and human approval before deployment. No backend or migration changes.
