# The Living Loom

Replaces the homepage card-stack, old floor, and carousel with a continuous procedural
Three.js sculpture. Four scroll positions interpolate tube geometry and 46 fragments:
interwoven loop, organized source, network, decision check. The page explicitly labels
example records and keeps real workspace actions as links. No remote textures or new
dependencies. Public routes, consent, workspace workflows and auth remain in place.

The renderer is lazy-loaded on screens >=900px and is not requested in reduced motion.
A static SVG remains usable on mobile and on renderer failure/context loss. The render
loop runs at a 30 FPS target while the art is visible, pauses in hidden tabs, caps pixel
ratio at 1.5, and disposes resources on unmount. Full motion adds subtle rotation;
gentle motion uses scroll and restrained pointer response. No native Apple shader API.

Visual verification on actual browsers and low-power devices is required before merge.
The old card assets are still used by the separate product tour route.
