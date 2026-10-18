# Stage 2 geographic refinement — review checkpoint

Prepared 18 October 2026 (America/Los_Angeles). This increment is implemented and tested locally, and remains **uncommitted for review**. It does not complete the full Stage 2 geographic coverage or application backlog.

## Repository and approved checkpoint

Workspace: `C:\Users\Clark\Documents\Codex\2026-10-13\ar\outputs\NERDS_CODEX`.

Branch: `codex/stage2-v031`. HEAD and approved checkpoint commit: **`6b5ac615f7a692f9229bdd031d7b37f517bb0aae`**, message `NERDS Stage 2 - validated course geometry and WGS84 corrections`.

The approved changes matched the preceding review inventory, were committed locally, and left a clean working tree immediately after that commit. The subsequent refinement changes, acquired additive datasets and evidence are preserved separately and have not been committed. Origin remains `clarkgraff/NERDS_CODEX`. No push, pull, merge, rebase, branch change, repository restructuring, MSI build, installation, SURVEYOR modification or Stage 3 work was performed.

Revision C remains controlling over conflicting older application requirements, with the approved Stage 2 course and vessel-suitability clarifications retained. Package version remains 0.3.0 in this development tree; no new release is claimed.

## Implemented behavior

An explicit **REFINE WITH MAPPED WATERWAYS** action calculates a separate evidence-backed candidate. The original route is retained as `coarseCourse`, including successful and unresolved legs, original geometry, source evidence, timings and mandatory waypoint identities. An unchanged valid saved coarse snapshot is retained exactly; changed inputs or departure times require recalculation. Repeated ordinary PLOT ROUTE uses the original coarse cache rather than accidentally treating refined geometry as the coarse baseline.

The selected authoritative route uses refined geometry only for accepted legs. Failed or unsupported refinement attempts preserve successful coarse legs. Every attempt records REFINED, UNCHANGED or UNRESOLVED and its reason. These are refinement-action states, not substitutes for geographic PASS/FAIL/UNRESOLVED acceptance.

**SHOW ORIGINAL COARSE COURSE** displays a separate dashed geodesic overlay. Current course accounting remains authoritative; showing or hiding the original does not change distances, durations, exports or ETAs. Both geometries survive project saving and desktop restart. Their calculated subtotals and per-leg explanations are available in the interface and saved route data.

The globe's `RESEARCH MAP · NOT FOR NAVIGATION` overlay was removed as requested and its absence verified in a restarted desktop test. Existing already-running windows require a reload/restart to display the edited source; installed applications were not changed.

## Sources evaluated and adopted

The baseline Natural Earth worldwide 0.1-degree mask, European 0.025-degree mask, 1:10-million river centerlines, and existing OSM package remain unchanged. Finer sampling of those same generalized outlines was not represented as improved source information.

An additive `assets/waterways/refinement.json.gz` package contains **29,833 mapped ways**: the existing OSM coverage plus successful regional acquisitions. Its companion manifest records source URLs, ODbL attribution, original response SHA-256 digests, OSM timestamps, exact queries, observed coverage bounds, feature counts and limitations. The geometry-content digest is:

`07f6a828a3855de84fdbe5aad7baa8012a09e66c0caf140f9d012a4a5621b9e1`

Acquired regions: Bordeaux/Garonne/Gironde, Amazon estuary, Alter do Chão, southern South America, Great Lakes flowlines and Rostov. Accepted feature classes are river, canal, fairway and flowline. These are irregular WGS84 source vertices, not a fixed-resolution raster or guaranteed positional accuracy. The mapped bends and source-edge connectivity provide different geographic evidence from a generalized mask; vertex count alone is not the improvement criterion.

Source documentation: [OSM waterways](https://wiki.openstreetmap.org/wiki/Waterways), [OSM attribution and licence](https://www.openstreetmap.org/copyright), and [Natural Earth river centerlines](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/). OSM flowlines describe mapped connections through water bodies; they do not independently establish vessel clearance or navigability.

The initial Alter do Chão request received HTTP 429. A bounded later attempt succeeded with 95 ways. An initial broad Great Lakes response was incomplete and was not accepted; a narrower flowline request succeeded with 4,540 ways. Existing successful responses were reused, not downloaded over or replaced. Acquisition logs retain the failures and successful retries. Raw responses and queries remain under `work/refinement`; the normalized package and manifest make the adopted evidence available without modifying baseline datasets.

## Refinement and connection-validation rules

1. Preserve the coarse snapshot, ordered waypoint IDs, constraints and original attachments.
2. Evaluate each sea leg independently against the additive mapped source graph. Canonical endpoint ordering makes new source-route selection direction-independent; reverse the resulting geometry and directional evidence when necessary.
3. Require exact connected source vertices, existing source edge IDs and matching dataset identity/checksum. No tolerance-based joins or guessed links are introduced.
4. Prefer an available connected mapped source path for refinement. Source-to-ocean sections must meet at identical portal coordinates. Raster portions still require conservative geodesic mask screening; source waterways supply the evidence where the generalized mask cannot represent a narrow waterway.
5. Reject invalid coordinates, fabricated edges, unsupported raster crossings and discontinuous source/grid assemblies.
6. For an already successful leg, reject a candidate that changes either attachment. A mapped candidate longer than `1.5 × coarse distance + 1 NM` is also retained only as a rejected attempt, not silently selected as a different passage. This conservative detour guard is a refinement-selection policy, not evidence that the rejected waterway is impassable. Candidate failures preserve the original course.
7. Recheck adjacent attachments, preserve successful legs and explicitly mark unresolved transfers. Recalculate all authoritative distances with WGS84 ellipsoidal geodesics, then durations, cumulative subtotals and ETAs. Unknown legs/transfers continue to prevent fictitious downstream ETAs.
8. Retain manual course constraints. Constraint-aware Edit Course routing is still pending, so affected legs remain explicitly unresolved rather than ignoring those constraints.

Vessel suitability remains the separate ON/BYPASS advisory system. Missing geographic connectivity is never classified as a genuine vessel restriction.

## Original versus refined comparisons

| Case | Original | Refined |
| --- | --- | --- |
| Brest → Bordeaux | UNRESOLVED access | PASS, 286.798629369 NM, 171 vertices |
| Bordeaux → Brest | UNRESOLVED access | PASS, same distance within floating-point tolerance; reversed geometry |
| Supplementary Gironde source-anchored course | Supported raster course: 24.886129603 NM, 5 vertices | Mapped Gironde source bends: 24.916769359 NM, 28 vertices |
| Supplementary Gironde detour candidate | Supported original course | Original preserved; mapped candidate exceeds detour guard |

The supplementary Gironde endpoints are actual mapped source coordinates used as explicit test attachments. This verifies replacement of supported coarse geometry, not only resolution of a previously failed leg. Both attachments remain identical and reverse geometry matches exactly. See `gironde-comparison.json` for full original/refined/reverse points, source references, nominal timings and validation.

The 159-case suite has exactly four changed classifications: Brest–Bordeaux full forward, full reverse, isolated forward and isolated reverse change from UNRESOLVED to PASS. This is one bidirectional route pair exercised in two contexts, not four distinct newly covered waterways. No previous PASS becomes FAIL or UNRESOLVED.

## Validation results

| Validation | Approved checkpoint | This increment |
| --- | --- | --- |
| Complete Node.js unit suite | 46 PASS | **53 PASS, 0 FAIL, 0 skipped** |
| Ordinary coarse geographic suite | 115 PASS / 0 FAIL / 44 UNRESOLVED | **115 / 0 / 44**, unchanged |
| Explicit refinement geographic suite | Not present | **119 PASS / 0 FAIL / 40 UNRESOLVED / 0 DEFERRED**, 159 evaluations |
| Existing desktop acceptance | 38 passing check groups | **38 passing check groups**, retained |
| New refinement desktop acceptance | Not present | **5 passing check groups** |
| Primary itinerary/unrestricted Hamburg–Kiel | 4 PASS | **4 PASS**, including refinement-enabled directional comparisons |
| Mandatory remote discovery | 5 PASS | **5 PASS**, required query forms retained |
| Python acquisition/resume tests | 2 PASS | **2 PASS** |

The seven added Node tests cover genuine mapped refinement, detour rejection, exact snapshot retention/departure changes/coarse replots, source-package and available raw-response integrity, Bordeaux directional geometry, partial-route/constraint preservation, and rejection of fabricated source edges/land crossings. WGS84 and all prior Node tests remain in the complete suite.

Desktop checks run against isolated temporary data stores. They verify explicit refinement, project persistence/restart, separate geodesic comparison overlays, unchanged accounting when toggling the overlay, already-detailed course preservation, ordinary coarse replot behavior and removal of the globe label. The six existing runners cover all 38 prior check groups; the seventh adds five. No renderer errors were recorded.

Geographic acceptance requires connected supported geometry, mandatory waypoint order, compatible attachments and matching ellipsoidal accounting. Missing required connections remain UNRESOLVED even when fault handling behaves correctly. Geographic commands intentionally exit nonzero while unresolved cases remain. DEFERRED is never PASS.

Recorded refinement-suite timings on this machine were approximately 146 ms median and 9.53 s maximum per evaluation, including coarse calculation and refinement. These observations are not a guaranteed performance bound. Original-stage diagnostic runners and duplicate desktop wrappers were not used to overwrite historical evidence; current expanded suites were run into separate baseline/refined directories.

## Remaining geographic deficiencies

| Area | Evidence and remaining work |
| --- | --- |
| Bordeaux | New Garonne/Gironde source coverage supplies the missing source-to-ocean connection. Regression passes are geographic planning results; excluded city connectors and suitability are not certified. |
| Amazon estuary / Breves | Local source components near Macapá, Belém and Manaus lack a usable portal to the selected ocean grid. Breves and the declared estuary fixture lack a source attachment within the existing 3 NM guard. More complete channel/water-area coverage and verified topology are needed. |
| Alter do Chão | Acquisition succeeded and local source candidates exist, but their components do not establish the required connected passage/portal. Download success is not route acceptance. |
| Southern South America | Nearby Ushuaia and Punta Arenas mapped components do not reach the selected water grid. Acquired river/fairway lines do not establish complete Beagle/Magellan/Chilean channel connectivity; improved coastal/channel water-area evidence is still needed. |
| Great Lakes–St Lawrence | Flowlines improve available source coverage, but Toronto still has no accepted nearby source attachment. Kingston Mills has a source/grid portal, which alone does not establish the complete Toronto connection. Montréal–Québec remains passing; the full system is not accepted. |
| Rostov | Local source candidates exist but do not establish a source-to-grid portal. Don/estuary coverage and topology remain unresolved. |
| Land itinerary | Connected road graph remains unavailable; this increment does not implement land routing. |

`connectivity-diagnostics.json` records candidates, source components, checksums and portal classifications for all five priority regions. `comparison.json` lists every remaining unresolved evaluation and refinement rejection reason. These diagnostics distinguish lack of source coverage/attachment from missing graph-to-grid connectivity; they do not infer a vessel prohibition.

## Files and evidence

Production modifications: `src/core.cjs`, `src/geographic-route.cjs`, `src/main.cjs`, `src/passage.cjs`, `src/preload.cjs`, `src/public/app.js`, `src/public/index.html`, `src/waterway-network.cjs`. New production module: `src/course-refinement.cjs`.

New acquisition/diagnostic scripts: `scripts/acquire-refinement.py`, `scripts/prepare-refinement.cjs`, `scripts/diagnose-refinement.cjs`. New datasets: `assets/waterways/refinement.json.gz`, `assets/waterways/refinement-manifest.json`.

New tests: `test/course-refinement.test.cjs`, `test/refinement-desktop.cjs`. Existing runners updated to accept separate report directories and, where applicable, refinement mode: `test/stage2-geographic.cjs`, `test/stage2-primary-itinerary.cjs`, `test/stage2-discovery.cjs`, `test/stage2-primary-desktop.cjs`, `test/stage2-mixed-grid-desktop.cjs`, `test/stage2-discovery-desktop.cjs`, `test/suitability-desktop.cjs`.

All new evidence is under `docs/stage2-0.3.1/refinement-validation/`: baseline and refined geographic JSON/path archives; primary-itinerary reports; discovery reports; seven desktop reports; `comparison.json`; `gironde-comparison.json`; `connectivity-diagnostics.json`; `preservation-verification.json`; and command/acquisition logs. `changed-files.json` enumerates every modified/new non-ignored file with an absolute path. Raw acquisitions remain locally under `work/refinement` and are not silently added to Git.

Final unit, geographic, primary and new-desktop logs end in `-final.txt`. Earlier logs are retained for traceability, not substituted for final results. The accepted `course-validation` reports and historical Stage 1 evidence remain unchanged.

## Protection, limitations and next increment

SHA-256 checks match the protected v0.3.0 MSI, original world/Europe masks, original gazetteer, original OSM/river packages and discovery manifest. No installed application or existing USER project was opened or migrated by these tests. NERDS runs this refinement locally without AI or a SURVEYOR connection.

Remaining approved work includes the 40 geographic non-passes, broader validated water-area/coastline topology, full multimodal/party tracking requirements, constraint-aware Edit Course interactions, and presentation-only LOD. No new gazetteer architecture, Edit Course UI, LOD or Stage 3 implementation was introduced here. Earlier two-alternative preference behavior is not newly certified by baseline-BYPASS testing.

Recommended next increment after review: targeted source-water-area and channel topology work for the unresolved Amazon, southern passages, Great Lakes and Don connections, with explicit verified ocean transitions and the same immutable coarse comparison. This evidence is needed before claiming those routes work. Then continue the approved constraint-aware Edit Course increment without weakening geographic validation. Keep this refinement checkpoint uncommitted until review authorizes it.
