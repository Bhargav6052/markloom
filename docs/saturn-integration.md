# Original Saturn frontend integration

Reference: https://markloom-saturn-preview.racingbarn32.chatgpt.site/ (version 4).

This integration copies the original authoring source, assets and animation implementation used to produce the reference. It does not reconstruct the design from a screenshot or merge PR #14 or #15.

The original static reference source repository commit is `552b503e79c777d69da16986055c467622d25981`. The production integration base is `03799b58` (full SHA in `saturn-source-manifest.json`). The manifest records 34 copied files and three unchanged original workflow images, with SHA-256 hashes. Run `node scripts/check-saturn-source.mjs` from `frontend` to verify them.

The exact landing component, stylesheet cascade, M silhouette/texture, Three.js materials, gold torus and moving orbit light, 30-second idle rotation, 50-second orbit, cursor damping, lazy rendering, touch glass feedback, GSAP typography, card journey, global watermark and Reduced Motion implementation are retained.

Only App's landing import/shared decorative watermark, the frontend CSS imports, motion/transparency preference UI, reference visual modules and brand assets are integrated. Existing authentication handlers, Supabase client, API routes, Content and Workspace components, AI/OCR processing, approvals, Evidence Graph, backend and database files remain byte-identical to origin/main. The reference preview's disconnected build environment is deliberately not copied; Vercel must use the existing project's configured Preview environment.

No production deployment, migration, RLS change or merge is part of this integration. Preview-only publishing occurs on `codex/saturn-source-integration`. The application retains its existing environment and auth security checks; missing Preview configuration must be reported rather than bypassed.

## Verification

- Frontend: 102 tests in 18 files; TypeScript, full ESLint, build, credential/public asset scans passed.
- Backend: 102 tests passed, 1 prerequisite-dependent test skipped; Ruff passed. Existing deprecation warnings remain.
- PostgreSQL/PGlite: complete existing suite passed, including tenant isolation, independent approvals, private storage, privacy, durable jobs, dependency validation and atomic rollback.
- Desktop at 1440×900: reference and integration measured identical header, hero, heading, object-container and chapter-strip geometry, font family/size and text color. Reduced Motion provides stable matched-state comparison; animated frames naturally differ with elapsed rotation phase.
- Remaining browser and Vercel verification results are recorded in `design-qa.md` after preview publication.

The legacy preview tree has seven tests for an unused earlier ribbon motion module. That unused module is not imported by the current Saturn reference and was not brought into the production integration. All tests present in this integration pass.
