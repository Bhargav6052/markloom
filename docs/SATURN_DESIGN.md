# Saturn landing-page integration preview

Uses existing main-based Markloom frontend, not experimental PR #14. The original backend, routes,
workspace, authentication, upload, AI review, OCR and human approvals are unchanged.

The hero is modelled after the approved Saturn visual reference rather than copied from the
separate chatgpt.site source (which is not available in this integration session).
Three.js is already installed. The M is constructed from a continuous sweep geometry.
The tilted orbital ring, reflection tube and gold particles use depth testing. Cursor tracking
is smooth, and a bounded-speed 360° idle animation resumes on inactivity.
No WebGL is loaded on narrow or reduced-motion screens, where a static SVG keeps the scene usable.
The renderer pauses when hidden/offscreen and disposes graphics resources on unmount.
All CTA destinations remain real application routes.

Do not merge to main or deploy production until CI passes and the preview is visually checked
against the approved screenshot. No database migrations or new secrets required.
