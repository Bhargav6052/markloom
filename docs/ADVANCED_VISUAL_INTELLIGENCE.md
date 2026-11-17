# Advanced visual intelligence (review candidate)

Local worker reads same-workspace private original images and verifies SHA-256.
Images and OCR output are not sent to Gemini. Existing findings show approved asset
document IDs, unverified OCR text, working-image coordinates and minimum word confidence.
OCR findings contain no creator-body quote or edit; no OCR-only fact dependency is created.
Source-linked OCR findings are insufficient evidence until human review.
No new database schema, permission, or approval change.

- English Tesseract OCR: maximum 1600-pixel side, 12 lines, 20 words per line,
  12-second subprocess timeout, 512 KB accepted output. Docker installs English data.
- Full-image aspect ratio, edge hash and coarse RGB comparison: up to eight approved
  candidate originals in 25 seconds. Exact binary matching remains unchanged.
- Resize/re-encoding candidates are advisory. Crops, rotations, composites and
  embedded logos are not reliably covered.
- OCR may omit or misread text. Missing disclaimer checks are advisory.
- Raster contrast uses pixel luminance percentiles in recognized text regions, not
  a WCAG conformance measurement. Unreadable text may escape OCR.
- Engine absence, inaccessible files and comparison limits yield manual-review notices.
- Existing findings retain priority under the 100-issue cap. No original objects changed.
- Synthetic test fixtures are not production data. The real-engine test skips if
  Tesseract is absent. No production migration or external service is required.

Review CI and staging results before merge.
