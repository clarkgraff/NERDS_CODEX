# Course modelling and geodesic geometry validation

Review checkpoint: 17 October 2026. No commit, push, fetch, merge, branch change, MSI build, Stage 3 work or SURVEYOR changes were performed for this validation increment.

## Repository and scope

- Workspace: `C:\Users\Clark\Documents\Codex\2026-10-13\ar\outputs\NERDS_CODEX`.
- Branch: `codex/stage2-v031`.
- Unchanged HEAD: `794ee6edc0c5cf7ac18e83491edd0047241db88c` (NERDS Stage 2 - course geometry and WGS84 development checkpoint).
- Configured origin: `https://github.com/clarkgraff/NERDS_CODEX.git`; inspected locally only. Remote state was not queried.
- Working tree was clean at the start of the latest requested validation; existing course implementation was already in HEAD. All subsequent changes listed below remain uncommitted for review.
- Package version remains **0.3.0** in this Stage 2 development tree. Routing engine identifies the course-development increment separately. This is not a packaged v0.3.1 release.
- Revision C takes precedence over conflicting earlier requirements, supplemented by the approved Stage 2 course instructions and BETA vessel-suitability clarification. This review validates the current course increment, not completion of the whole Revision C/Stage 2 backlog.

## Implemented and verified current functionality

The existing course model separates ordered itinerary IDs, persistent manual routing constraints, automatic course-vertex metadata, authoritative leg points, and geographic source evidence. Schema 1/2 projects migrate to an empty course plan; schema 3 projects preserve constraints through SQLite restart and project roundtrip. Reordering an itinerary does not alphabetize it or turn automatic vertices into manual constraints. Orphaned constraints remain stored and only apply to their original ordered leg identity.

Authoritative course distances and interpolation use WGS84 ellipsoidal geodesics through GeographicLib. The economical graph-search cost remains an explicitly identified spherical estimate. Rhumb courses are not silently substituted: the current course model accepts GEODESIC only. Tests verify published inverse-distance reference vectors, near-antipodal cases, dateline crossings, near-polar interpolation, coincident points and endpoint/length consistency. Cesium route entities were inspected in Electron and explicitly use GEODESIC arcs.

Coarse raster simplification removes unnecessary intermediate vertices only after conservative geographic-mask checks. Original raster geometry remains in evidence; mapped source-waterway bends and source edge references remain intact. This is simplification against existing geographic information, not detailed hydrographic refinement.

Corrections made in this increment:

1. Canonicalize the direction used for greedy simplification, so reversing the same raster path produces exactly reversed simplified geometry rather than different bends and distances. Added a constrained-path regression with independent shortcut checks.
2. Correct the independent acceptance validator's interpretation of sampled diagonal transitions. It now traverses actual sample-chord cell-boundary crossings rather than assuming both diagonal side cells were crossed. Water checks and corner-touch rejection remain active. Added the formerly rejected Black Sea segment in both directions and a negative continent-crossing test.
3. Update desktop city fixtures to select the intended source identity rather than the first feature sharing a city name/country in the expanded all-feature index. Production discovery selection was not changed.
4. Update obsolete desktop expectations to the approved baseline routing behavior: per-leg connectors, current nominal-duration label, and one baseline alternative during preference BYPASS. This does not certify the older two-alternative preference feature.
5. Permit the retained Stage 1 desktop test to write its new results into Stage 2 evidence, preserving the accepted Stage 1 report.

## Executed validation

| Suite | Result |
| --- | --- |
| Targeted course model, geodesic, geometry and independent-validator unit tests | 11 PASS, 0 FAIL |
| Complete current `node --test test/*.test.cjs` suite | 46 PASS, 0 FAIL, 0 skipped |
| Geographic regression | 159 evaluations: 115 PASS, 0 FAIL, 44 UNRESOLVED, 0 DEFERRED |
| Primary itinerary and unrestricted Hamburg–Kiel, both directions | 4 PASS; both direction comparisons PASS |
| Mandatory remote discovery | 5 PASS, 0 FAIL, 0 UNRESOLVED; required aliases included |
| Dataset acquisition/resume Python tests | 2 PASS |
| Full desktop acceptance | 14 check groups PASS |
| Retained Stage 1 desktop fault-isolation/persistence/drag | 7 check groups PASS |
| Vessel-suitability desktop | 4 check groups PASS |
| Primary-itinerary desktop, including GEODESIC presentation | 6 check groups PASS |
| Mixed-grid desktop | 3 check groups PASS |
| Remote-discovery desktop | 4 check groups PASS |

The six desktop runners pass 38 check groups in total, with isolated temporary data directories. External renderer networking is denied during offline tests; the operating-system network adapter was not disabled. Mode-selection desktop checks verify selection and recalculation, not successful worldwide land or multimodal routing.

The geographic command deliberately returns a nonzero exit code while UNRESOLVED cases remain. It is not an all-green suite. PASS requires supported connected geometry, preserved mandatory waypoint order, compatible attachments, distances matching authoritative WGS84 geometry, correct cumulative distance and nominal duration, and no fabricated ETA across gaps. Missing connectivity remains UNRESOLVED even when error handling works correctly. No DEFERRED result is counted as PASS.

Historical Stage 1 baseline/discovery/geographic scripts were not rerun against their archived output files: their cases are covered by the expanded current suites. The `water-desktop.cjs` wrapper duplicates the full desktop runner. Diagnostics/helper modules are not separate acceptance suites. Accepted Stage 1 evidence was preserved.

## Baseline comparison and limitations

The committed course checkpoint recorded **114 PASS / 2 FAIL / 43 UNRESOLVED**. Corrected results are **115 PASS / 0 FAIL / 44 UNRESOLVED**. Sevastopol → Odesa changes from FAIL to PASS after correcting the false geometry rejection. The full reverse Odesa–Sevastopol–Rostov itinerary changes from FAIL to UNRESOLVED because the unsupported Rostov connection still prevents acceptance. The earlier pre-simplification 115/0/44 baseline is preserved in aggregate; no additional worldwide connectivity is claimed by this increment.

Primary Hamburg → Cuxhaven → Kiel → Copenhagen retains all mandatory ordered waypoints, traverses Brunsbüttel and Holtenau in order, and passes both directional geometry/accounting checks. The reverse paths match exactly within the documented numerical tolerance. Unrestricted Hamburg → Kiel and its reverse also pass without injected canal-entrance waypoints.

Successful legs survive a failed added or intermediate leg, including save/reopen/restart. Unknown distances are not converted to zero completed distances; later successful legs do not acquire fictitious absolute ETAs. Manual coordinates and map pins retain exact stored coordinates and stable IDs through edit/reorder/restart.

Remaining geographic non-passes include southern South American access/channel connections, Bordeaux access, Amazon estuary/Breves/Alter do Chão connections, Kingston Mills/Toronto/Great Lakes-to-St Lawrence connections, Rostov access, and the unsupported road-network itinerary. Current diagnostics identify missing local water attachment, missing offshore/source-network connection, or unavailable road graph. They do not establish genuine vessel restrictions as the cause. See comparison.json for every unresolved evaluation and its diagnostic reason. Montréal–Québec source routing remains covered by passing unit regressions; this does not imply the complete Great Lakes–St Lawrence system is solved.

Outstanding approved increments remain explicit coarse-to-detailed refinement using improved geographic data, Edit course interactions and constraint-aware routing, and presentation-only zoom smoothing/LOD. Constraints currently persist but affected routes return `MANUAL_CONSTRAINT_ROUTING_PENDING`; they are not silently ignored or claimed as functioning edited courses. Rhumb-line calculation is not implemented as a separate user feature. Full multimodal/party-tracking and other Stage 2 requirements are not certified complete by this course review.

## Modified files and evidence

Production: `src/course-geometry.cjs` only in this validation increment. `src/course-model.cjs`, `src/navigation.cjs`, `test/course-model.test.cjs` and `test/geodesic.test.cjs` were inspected/tested and retained unchanged from HEAD.

Tests: `test/course-geometry.test.cjs`, `test/geographic-validation.cjs`, `test/geographic-validation.test.cjs`, `test/desktop.cjs`, `test/stage1-desktop.cjs`, `test/stage2-primary-desktop.cjs`.

Refreshed Stage 2 evidence: `geographic-results.json`, `geographic-paths.json.gz`, `geographic-summary.json`, `primary-itinerary-results.json`, `primary-itinerary-paths.json.gz`, `discovery-results.json`, `discovery-desktop-results.json`, `mixed-grid-desktop-results.json`, `primary-desktop-results.json`, `suitability-desktop.json`. New `course-stage1-desktop-revalidation.json` contains the retained Stage 1 desktop checks on this increment.

This `course-validation` directory contains the latest unit/desktop/acquisition/geographic logs, the initial failing desktop log for traceability, full-desktop JSON, comparison.json, and current preservation hashes. `course-full-desktop-revalidation.txt` supersedes `course-full-desktop.txt`. `course-stage1-desktop.txt` and `course-stage2-primary-desktop.txt` contain the final successful reruns. The previous committed evidence remains recoverable at unchanged HEAD.

## Protection and next increment

Recomputed SHA-256 values match the recorded originals for the v0.3.0 MSI, worldwide mask, European mask and original gazetteer. No geographic datasets or installed application files were edited. Desktop tests used temporary USER data stores; installed USER projects/preferences were not opened or migrated. NERDS calculations continue locally without AI or SURVEYOR; the separate SURVEYOR repository was untouched.

Recommended next increment, after this review: explicit coarse-to-detailed refinement with retained comparison geometry, source/resolution provenance, and rejection of unsupported passages. Select genuinely improved geographic evidence for unresolved connections; merely densifying the present polyline is not refinement. Then proceed to the already approved constraint-aware Edit course work and presentation-only LOD in order. No next increment was started during this validation checkpoint.
