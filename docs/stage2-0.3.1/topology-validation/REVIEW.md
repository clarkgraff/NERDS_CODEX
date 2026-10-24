# NERDS Stage 2 — water-area topology review

Issued 19 October 2026, America/Los_Angeles. **Validated bounded engineering checkpoint; USER acceptance pending. Full Stage 2 and worldwide geographic coverage remain incomplete. All new work is uncommitted.**

## 1. Repository and authority

Workspace: `C:\Users\Clark\Documents\Codex\2026-10-13\ar\outputs\NERDS_CODEX`. Branch: `codex/stage2-v031`. Starting and current HEAD: `d72b1d4410b97a1cb15a60d4cbb00b3e64d78d2b` — NERDS Stage 2 - validated mapped-waterway refinement and coarse course preservation. Previous course checkpoint: `6b5ac615f7a692f9229bdd031d7b37f517bb0aae`. Origin remains `https://github.com/clarkgraff/NERDS_CODEX.git`. Package version remains 0.3.0; no release version or installed application was changed.

The working tree contains three modified tracked files plus new topology source, acquisition/preparation/diagnostic scripts, tests, six additive regional datasets and this evidence directory. `changed-files.json` provides every deliverable path, size and SHA-256; `FILE-INVENTORY.md` lists each path and purpose. Git diff statistics alone omit untracked deliverables. No current-increment commit, push, pull, merge, rebase, branch change, MSI build, installation, SURVEYOR modification or new architectural-feature implementation was performed.

The complete local `20261018_4nR-MOS_SIOP_Master_Scope_v1.0_RevA.docx` was read, including authority, conflict register and appendices A–E (1,618 paragraphs including table text). The original is preserved. Shared README, changelog, approval register, standard directive, coordination protocol, interface control, both applications' status/interface registers, worksheet template and proposal directory were read. The later BY-WATER amendment was also read. Latest inspected shared tree: `6aff582fc942344cde94818189f70aad0ca2779b`. No master binary was present in that shared tree. `controlling-documents.json` records local paths and digests.

The 19 October direct USER instruction makes SIOP Revision A controlling. The shared register still describes final approval as pending; this documentary mismatch is disclosed, not silently edited. The explicit development sequence still gates major new features on topology review. The v3.3 ship-operational workbook was supplied and located; no workbook calculations or vessel-specific values were adopted during topology work.

## 2. Implemented functions

`src/water-area-route.cjs` adds a dataset-driven combined graph of existing mapped source edges and conservative water-area cells. `src/course-refinement.cjs` invokes it when the approved mapped-waterway candidate cannot be calculated. Ordinary coarse PLOT ROUTE is unchanged. Explicit REFINE retains the original coarse snapshot independently, attempts each leg separately and selects only supported candidates.

Polygon preparation joins source member endpoints only when coordinates are exactly equal and unambiguous. Open/ambiguous rings, degenerate rings, missing members, self-intersections and uncontained/ambiguous holes are rejected rather than snapped or repaired. Lake Ontario's individually valid inner rings touch/overlap; exact set subtraction of their union preserves all exclusions without inventing water or moving source vertices. Relation member ways are not also accepted as independent filled outer polygons. Valid water features are unioned, all known holes subtracted and the result clipped to documented regional coverage.

A cell is usable only if its entire square, expanded by a 0.000001° guard, is covered by retained water geometry. An independent exclusion mask marks any cell touching an island/hole. Eight-neighbour traversal disallows diagonal corner cutting. Narrow passages may therefore remain disconnected at this conservative resolution. Sampling more densely is not described as higher source accuracy: OSM vector evidence is the new geographic input; raster resolutions below are derived working resolutions, not positional-accuracy guarantees.

Existing source nodes attach to an area cell only through a geodesic segment screened wholly within source-covered water cells. Source edges retain their original IDs and exact endpoints; the new topology search rejects edges intersecting known exclusion cells. Water areas are not joined merely because bounding boxes overlap or polygon boundaries touch. There is no proximity-only bridge. The new hole check applies to this new combined search; unchanged approved source-only routing is not newly certified against every polygon in the world.

Automatic anchor-to-water candidates are bounded to 3 NM for source/area attachments and remain separately labelled unverified city connectors, excluded from passage accounting. Explicit area access stays at its actual coordinates and must pass cell/segment screening. The existing source-access tolerance and coarse-ocean access policy are retained; original successful course attachments cannot silently change during refinement.

The search uses economical spherical distance estimates for ordering, bounded to 250,000 visited nodes. Final distances always sum WGS84 ellipsoidal geodesics over canonical course vertices. Canonical endpoint ordering makes equivalent forward/reverse calculations share the same selected path. Detailed evidence is reversed with geometry. No optimal-route guarantee is claimed for this bounded search.

Ocean assembly requires source/area sections and a screened ocean-grid section to share identical portal coordinates. Every middle-grid point and segment must be water-supported; fabricated grid IDs, changed manifests, discontinuous assemblies and unsupported geometry are rejected. A known Brest–Bordeaux source/ocean control passes in both directions, with 171 vertices. It verifies this assembly mechanism, **not a new Beagle, Amazon-mouth or Don connection**. Coverage diagnostics find zero usable-cell overlap with the worldwide ocean grid in all six new areas; Don has 22 cells overlapping the European grid, which does not establish a connected Rostov passage.

Candidates that would change a successful attachment, exceed the existing 1.5 × coarse NM + 1 NM detour guard, break a previously successful adjacent attachment or ignore a manual constraint are not silently selected. Unsupported legs remain UNRESOLVED, successful legs survive, and unknown travel time prevents fictitious downstream ETA. Vessel suitability remains a separate ON/BYPASS advisory policy.

## 3. Geographic sources, provenance and integrity

New source: OpenStreetMap `natural=water` ways and multipolygon relations, acquired through bounded Overpass requests. Licence: ODbL 1.0, attribution OpenStreetMap contributors; source and attribution URL `https://www.openstreetmap.org/copyright`. Polygon semantics were checked against OSM Waterways and Multipolygon documentation. Natural Earth and previously approved OSM/flowline packages remain unchanged. No bathymetric clearance, current charts, lock restrictions, bridge clearance or weather data were introduced.

| Package | Derived cell resolution | Accepted features | Rejected | Water cells | OSM base timestamp |
|---|---:|---:|---:|---:|---|
| breves | 0.001° | 59 | 0 | 52438 | 2026-10-18T07:11:36Z |
| alter | 0.002° | 104 | 3 | 36192 | 2026-10-18T07:12:36Z |
| ontario | 0.005° | 16609 | 0 | 87644 | 2026-10-18T07:13:41Z |
| don | 0.002° | 1445 | 0 | 789 | 2026-10-18T14:59:21Z |
| ushuaia | 0.002° | 424 | 0 | 21 | 2026-10-18T14:52:06Z |
| magellan | 0.002° | 158 | 0 | 50 | 2026-10-18T14:53:06Z |

Together these contain 18,799 accepted features, with three rejected Alter features: `way/1546908572`, `way/1546908573`, `way/1546908574`, each open/ambiguous and left unrepaired. Full source IDs, tags, URLs, exact queries, extents and limitations are in `assets/water-areas/manifest.json`. Six packages are bounded development coverage, **not worldwide coverage**. Southern queries return mainly inland lakes/ponds and do not describe the required open coastal straits. An OSM waterway centreline or water polygon is geographic evidence, not certified navigability.

Runtime deliverables: per-region `.bin.gz` water mask, `-exclusions.bin.gz` island mask, `.geojson.gz` retained geometry, plus manifest. Runtime verifies mask/exclusion hashes; unit tests additionally verify retained geometry and available raw acquisition digests. Raw provider responses remain ignored under `work/topology/`; completed data are reused, responses with provider error remarks rejected, and new responses are adopted via temporary-file replacement. The bounded acquisition script is a development tool, not an integrated automatic worldwide updater. Initial acquisition and preparation logs are retained under `acquisition/`; Don eventually succeeded after 502/timeout failures, Magellan succeeded on retry, and Gironde-control failed twice with HTTP 502 and is not adopted.

Manifest region-identity digest: `28a17e6e5f018f6bf3122aee6293b02d54965fd6bf595bee8fef7bac6177f042`. Total additive dataset footprint: 11,236,994 bytes. Development preprocessing uses Shapely 2.1.2/GEOS and NumPy; the application runtime reads generated masks locally and does not require Python, AI, SURVEYOR or Overpass. No master datasets were replaced.

### breves

- acquisitionSHA256: `bed38e3407d52eb1a154831799f447f1c7a0ea91c1e3f3fd3678f14052b75be8`
- maskSHA256: `9f97abde4ebd604e6699c151d4b2b3fa4bf0e370594f11a0ef6445ddf9079283`
- exclusionSHA256: `b39baf3680395529dbca438c14ba51ae0706826607da9dbcffacf62edd1d69fe`
- geometrySHA256: `1997a0b67e0f90dd54b7f314deadaa18f707ff5fa09b547e7050ce79cf55d088`

### alter

- acquisitionSHA256: `9d47c478b8ef4727e7606a2ecd56172b072c18419ba0ff6d3d8117fea50b477b`
- maskSHA256: `8eb1fd9b4d25b978a7f163ac7ae5228c7d88bc22e886eb7e6aaa96bd3396011e`
- exclusionSHA256: `92f00bd155ec325849c10167c07822694f3025868cfca7d262957c9ab65540f5`
- geometrySHA256: `088651f9a29e45d046fb714b2f787c8ab690b94b328694ccc8f61158476b30d7`

### ontario

- acquisitionSHA256: `fea29ac5dcc9edfdea92d422e0e300f0490f05b9b36a634b632d59ddd6ed42b5`
- maskSHA256: `618113f2ad0ca27e6849aefcffb17b15337160448c7d4ece7e10540f1ee78c41`
- exclusionSHA256: `4da823f9dd020d2ca18555d11128f02b8740194d865e9372487c9169b8f6244f`
- geometrySHA256: `bb6893ad2078e6828ee661e663d1eae5f88371a7cf17e214ec6f2ab270657ed0`

### don

- acquisitionSHA256: `eba2e58979615aa25888eca8f1dd397c263123614acacfef2d019624d0eefe02`
- maskSHA256: `4ce5238d3c5d0124d86c4c3e29e8feb9444f4d3337b03b401f513c635983ce28`
- exclusionSHA256: `9b8cbf110e659685c42e0930501477fe3ac07b9cfabe726bb2e2114725f56a07`
- geometrySHA256: `0d0f5241e0a5e754b848602d21fcd804a23ee48c0f36198cc73cc18e25b9bfd3`

### ushuaia

- acquisitionSHA256: `f7e7754a46056c35b37ddf9c382675b2351a9a1cee1638586f84039a2edcb843`
- maskSHA256: `071b93719f88e5db843cfa14d5cc2f147a2801f71b1361fc9ce05fc0c94c54c3`
- exclusionSHA256: `2e33e64271c1467923500fbe9818fb54b60b62eb2896a8f28a4f210669596ef6`
- geometrySHA256: `5e5048db2c716f9dbb77438c41642503952272d7d515eb80ad619671571d2636`

### magellan

- acquisitionSHA256: `1d58aa3bac120f25ca8086a263b294fa94c0e12ad0bd66571e6d28708ad8f985`
- maskSHA256: `5dbbcbb275af58ccc0619d932ab2cb0c636f5dbf413faff3e888def829cf99c2`
- exclusionSHA256: `68ef0eef39a42dbf39b8b3a0f81589358fa53e4db4b1a35725f733b657a5d570`
- geometrySHA256: `085582a4e0aae0cabfd8a4bb7b1c0b541a05de5d15e17064b4c4b7d689c96146`

## 4. Before/after geometry and accounting

| Course/context | Approved refined baseline | Current topology result |
|---|---|---|
| Belém → Breves | UNRESOLVED | PASS; 460 vertices; 164.064838860 NM; 27.344139810 h reference / 16.406483886 h operating nominal |
| Breves → Belém | UNRESOLVED | PASS; reverse-direction suite; same geographic criteria |
| Santarém → Alter do Chão | UNRESOLVED | PASS; 154 vertices; 21.681310789 NM; 3.613551798 h reference / 2.168131079 h operating nominal |
| Alter do Chão → Santarém | UNRESOLVED | PASS; exact reversed geometry unit and desktop checks |
| Macapá → Belém → Breves | Incomplete itinerary | PASS both directions; forward 625.408389212 NM; 104.234731535 h reference / 62.540838921 h operating nominal |
| Explicit interior Lake Ontario control | Not certified by earlier checkpoint | Connected area path, 569 vertices; exact reverse tested; does not substitute for the Toronto fixture |
| Brest → Bordeaux source/ocean control | Approved passage | New assembly validator control PASS; existing 171-vertex course, no claimed coverage gain |

Reference and operating figures above use the unchanged regression assumptions (6 and 10 knots respectively). They do not implement the new SIOP operational-mode BYPASS feature. Times are nominal, with no tides, locks, waiting or forecast effects. Geometry-derived WGS84 distances exclude anchor connectors. Complete per-leg/cumulative totals and UTC ETAs are retained in geographic result/path archives.

Exactly eight of 159 repeated-context evaluations improve:

| Evaluation | Before | After |
|---|---|---|
| Macapá → Belém → Breves | full forward | UNRESOLVED | PASS |
| Macapá → Belém → Breves | full reverse | UNRESOLVED | PASS |
| Belém → Breves | isolated | UNRESOLVED | PASS |
| Breves → Belém | isolated | UNRESOLVED | PASS |
| Santarém → Alter do Chão | full forward | UNRESOLVED | PASS |
| Santarém → Alter do Chão | full reverse | UNRESOLVED | PASS |
| Santarém → Alter do Chão | isolated | UNRESOLVED | PASS |
| Alter do Chão → Santarém | isolated | UNRESOLVED | PASS |

These are two newly supported bidirectional leg pairs and their itinerary contexts, not eight unique waterways. No previous PASS became FAIL or UNRESOLVED. Every ordinary coarse classification remains unchanged. A separate direct Macapá–Breves probe remains unresolved; the passing ordered itinerary via Belém must not be generalized into universal Amazon connectivity.

## 5. Validation results and acceptance criteria

| Suite | Approved checkpoint | Actual current result |
|---|---|---|
| Node unit/regression | 53 PASS | **59 PASS, 0 FAIL, 0 skipped** |
| Python acquisition/polygon | 2 PASS | **5 PASS** |
| Coarse geography | 115 PASS / 44 UNRESOLVED | **115 PASS / 0 FAIL / 44 UNRESOLVED / 0 DEFERRED** |
| Explicit refined geography | 119 PASS / 40 UNRESOLVED | **127 PASS / 0 FAIL / 32 UNRESOLVED / 0 DEFERRED** |
| Existing desktop | 38 + 5 groups | **43 retained + 5 topology = 48 passing groups** |
| Primary itinerary and unrestricted Hamburg–Kiel | 4 PASS | **4 PASS** |
| Mandatory remote discovery | 5 PASS | **5 PASS** |
| Independent retained-polygon audit | New | **998 unique directed area edges checked; 0 failures** |
| Protected asset hashes | Preserved | **10/10 match** |

Geographic PASS requires all requested legs, continuous compatible attachments, supported geometry, mandatory waypoint order, matching WGS84 accounting and complete nominal ETA. FAIL denotes invariant violations or unexpected exceptions. UNRESOLVED means at least one requested connection/transfer/duration is unsupported. DEFERRED means not executed and is never PASS. Fault-isolation tests can demonstrate correct error handling while their geographic itineraries remain UNRESOLVED. Geographic runners intentionally exit 1 while unresolved cases remain; zero FAIL is not complete geographic acceptance.

Six added Node tests cover disconnected areas/corner cuts/island exclusions; dataset/geometry/raw hashes; actual Alter refinement/reversal/coarse preservation; independent-leg accounting and missing ETA; Lake Ontario interior routing; and source-to-ocean portal/evidence tampering. Three added Python tests cover open/ambiguous/self-intersecting rings, exact joins without snapping, and overlapping-hole exclusion. The two existing acquisition/resume tests exercise the existing acquisition utility; the new water-area script has actual provider/retry evidence and source hash checks, but its new atomic-rename failure path has not been separately fault-injected. An early new test incorrectly compared two separately generated route IDs/timestamps; it was corrected to compare refinement against its actual supplied coarse snapshot. Its failed log remains historical; final 59-test results supersede it.

All seven existing desktop runners passed: general application 14, Stage 1 7, primary 6, mixed-grid 3, remote-discovery 4, suitability 4, prior refinement 5. New topology desktop tests add five groups: explicit refinement/coarse/identity preservation; Cesium coordinate and geodesic-arc correspondence; overlay accounting invariance; save/restart source and geometry persistence; reverse itinerary/no renderer errors. All use isolated temporary data directories. The new test compares every rendered polyline coordinate with canonical WGS84 vertices to 1e-9 degrees. This is a Cesium entity-coordinate check, not pixel-level proof of arbitrary USER PATH behaviour; USER PATH is not implemented in this increment.

The primary itinerary preserves Hamburg → Cuxhaven → Kiel → Copenhagen, passes both canal entrance gates in order, and reverses the identical geometry. Per-leg reverse distance deltas are at most 7.11e-14 NM in the primary/unrestricted comparisons. Remote tests retain all five required query forms including Antarctic ECAMP; no discovery code changed.

The independent audit uses GEOS `covers` against retained water polygons including holes, rather than the production raster validator. Geodesic edges are sampled at intervals no greater than 20 m. All 998 unique directed AREA edges used in the geographic run pass; this is a finite linear approximation, not a universal mathematical proof or vessel clearance. The final rerun's canonical geometries and classifications exactly match the audited run. Ocean control and mutation rejection are separate checks.

## 6. Exact validation commands

Run from `C:\Users\Clark\Documents\Codex\2026-10-13\ar\outputs\NERDS_CODEX`. `node` is the existing local Node runtime. Python executable: `C:\Users\Clark\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`. PowerShell environment assignments below apply only to each test process group.

```powershell
node --test test/*.test.cjs
& 'C:\Users\Clark\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest discover -s test -p '*_test.py'
$env:NERDS_REPORT_DIR='docs/stage2-0.3.1/topology-validation/coarse'
node test/stage2-geographic.cjs
$env:NERDS_TEST_REFINE='1'
$env:NERDS_REPORT_DIR='docs/stage2-0.3.1/topology-validation/final-refined'
node test/stage2-geographic.cjs
$env:NERDS_REPORT_DIR='docs/stage2-0.3.1/topology-validation/final-primary'
node test/stage2-primary-itinerary.cjs
$env:NERDS_REPORT_DIR='docs/stage2-0.3.1/topology-validation'
node test/stage2-discovery.cjs
node scripts/diagnose-water-areas.cjs
& 'C:\Users\Clark\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/audit-water-area-geometry.py
$env:NODE_PATH='C:\Users\Clark\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:NERDS_DESKTOP_REPORT='docs/stage2-0.3.1/topology-validation/stage1-desktop.json'
node test/desktop.cjs
node test/stage1-desktop.cjs
node test/stage2-primary-desktop.cjs
node test/stage2-mixed-grid-desktop.cjs
node test/stage2-discovery-desktop.cjs
node test/suitability-desktop.cjs
node test/refinement-desktop.cjs
node test/water-area-desktop.cjs
git diff --check
```

The coarse run was executed without NERDS_TEST_REFINE set; clear it before reproducing coarse results in a reused shell. General desktop writes `test-results/desktop.json`; that result was copied into this review directory. Existing runners' screenshots in test-results are incidental; approved historical evidence directories were not overwritten. Final authoritative logs: `node-tests-complete.txt`, `python-tests-final.txt`, `final-refined-log.txt`, `coarse-geographic.txt`, `final-primary-log.txt`, `discovery-log.txt`, seven existing desktop logs and `water-area-desktop-final-log.txt`. Diagnostic scripts target the initial topology refined directory; equality against final geometry is recorded in `validation-summary.json`.

## 7. Performance, limitations and unresolved geography

Final geographic run: median 182.192 ms and maximum 10655.725 ms per evaluation, including coarse calculation and explicit refinement where requested. Node suite: approximately 20.5 seconds. A process snapshot during the final suite observed roughly 4.18 GB working set; this is not a measured peak or a performance guarantee. Detailed paths and evidence retained for 159 evaluations contribute to memory. No comparative battery/power benchmark, installation footprint, arbitrary-region latency SLA or general cancellation benchmark was performed. Visual inspection of water-area-desktop.png also shows the generalized base layer does not depict these detailed inland water polygons and labels overlap at the captured overview scale. Coordinate correspondence passes; detailed-water background rendering and label decluttering are not certified. The existing header still uses the historical Discovery Surveyor wording. These presentation/specification gaps were not changed during this topology increment.

| Region/issue | Actual findings and remaining gap |
|---|---|
| Breves / lower Amazon | Area evidence connects Belém–Breves and the Macapá–Belém–Breves itinerary. Direct Macapá–Breves remains unresolved in a supplementary probe. The declared Amazon-estuary/Manaus fixtures still lack complete accepted access/transition evidence. |
| Alter do Chão | Santarém–Alter passes with actual mapped water geometry; three incomplete rings remain rejected. This does not certify other tributaries. |
| Great Lakes–St Lawrence | Interior Lake Ontario is connected. The Toronto city fixture has no accepted attachment within the existing guard. A supplementary coordinate near a conservative cell boundary is rejected by segment screening even though its containing cell is water; interior cell-centre controls pass. Full Kingston/Toronto/Montréal connectivity remains unresolved; no fixture was moved to gain acceptance. |
| Southern South America | Natural-water polygon extraction provides small inland water bodies, not complete open-sea Beagle/Magellan/Chilean channels. No speculative closure of coastlines or sea corridors. Source coastline/ocean geometry and verified transitions are still needed. |
| Rostov / Don | Acquisition succeeded; only 789 conservative water cells survive at this resolution. Twenty-two overlap the European grid, but the required source-connected passage is not established. Narrow-channel loss, incomplete coverage and attachment topology need further evaluation; no vessel prohibition is inferred. |
| Land routes | No adopted connected road engine; unchanged UNRESOLVED. Valhalla remains a future evaluation. |
| Geographic generalisation | Algorithm uses dataset geometry rather than named endpoints; acquisition script still contains six bounded development regions. No region/tile/basin manager, automatic worldwide downloads or arbitrary-region end-to-end acceptance is delivered. |

All 32 unresolved evaluations are listed below. They include repeated directions/contexts and deliberate fault-isolation itineraries, not 32 unique geographic problems:

- Montevideo → Stanley → Ushuaia → Punta Arenas → Concepción | full forward
- Montevideo → Stanley → Ushuaia → Punta Arenas → Concepción | full reverse
- Stanley → Ushuaia | isolated
- Ushuaia → Stanley | isolated
- Ushuaia → Punta Arenas | isolated
- Punta Arenas → Ushuaia | isolated
- Punta Arenas → Concepción | isolated
- Concepción → Punta Arenas | isolated
- Atlantic → Amazon estuary → Manaus | full forward
- Atlantic → Amazon estuary → Manaus | full reverse
- Amazon estuary → Manaus | isolated
- Manaus → Amazon estuary | isolated
- Kingston Mills → Toronto | full forward
- Kingston Mills → Toronto | full reverse
- Kingston Mills → Toronto | isolated
- Toronto → Kingston Mills | isolated
- Toronto → Montréal | full forward
- Toronto → Montréal | full reverse
- Toronto → Montréal | isolated
- Montréal → Toronto | isolated
- Odesa → Sevastopol → Rostov-on-Don | full forward
- Odesa → Sevastopol → Rostov-on-Don | full reverse
- Sevastopol → Rostov-on-Don | isolated
- Rostov-on-Don → Sevastopol | isolated
- Odesa → Istanbul → Tel Aviv (land) | full forward
- Odesa → Istanbul → Tel Aviv (land) | full reverse
- Odesa → Istanbul | isolated
- Istanbul → Odesa | isolated
- Istanbul → Tel Aviv | isolated
- Tel Aviv → Istanbul | isolated
- Successful three-waypoint route plus failing new leg
- Failures in middle with later successful leg

## 8. SIOP reconciliation and next increment — assessment only

| Requirement / affected modules | Current classification | Gap / proposed dependency |
|---|---|---|
| Independent deterministic routing; navigation.cjs, passage.cjs | PRESENT / TESTED | No AI or SURVEYOR dependency introduced. |
| Canonical WGS84 geometry; course-model.cjs, public/app.js | PRESENT / TESTED for existing routes | New desktop coordinate check supports current renderer; unrestricted USER PATH pipeline remains unimplemented. |
| Separate USER PATH; core.cjs, course-model.cjs, public/app.js | NEW / PARTIAL foundations | Existing stable waypoints and manual constraints are retained, but no separate path revision model, drag-label editor or undo/redo stack. |
| Four preserved route stages; passage.cjs, course-refinement.cjs, core.cjs | CONFLICT / PARTIAL | Current coarse means water-aware geography; new Stage 1 means unrestricted path. Existing coarse snapshot must be migrated explicitly, never relabelled as equivalent. |
| Three primary BY-WAY modes; public UI, passage.cjs | CONFLICT / PARTIAL | Existing four-mode logic includes top-level RIB. RIB transfer derivation and conditional stage availability need controlled follow-on work. |
| Operational BYPASS; navigation.cjs, vessel data | NEW / CONFLICT | Current dual 6/10-kn estimates differ from the new operational BYPASS semantics. Keep separate from suitability/preference bypass; workbook now available. |
| Multiple versioned ship profiles; main.cjs, core.cjs, public/app.js | PARTIAL | Existing reusable vessel profiles and persistence already exist. Extend identity/version snapshots and nullable engineering data; do not rebuild the functioning profile editor wholesale. |
| Integrated road routing | NEW / DEFERRED | Evaluate Valhalla packaging and licensed OSM tiles before adoption; no invented road geometry. |
| Worldwide automatic data update manager | NEW / PARTIAL acquisition tools | Current scripts/provenance/cache are development foundations, not the required managed runtime lifecycle. |
| Weather stage | NEW / DEFERRED | Existing display layers do not constitute weather-aware numerical routing. |
| Undo/redo, label offsets, presentation LOD | NEW / DEFERRED | Do not affect authoritative calculations; separate UI acceptance needed. |
| Project save/restart and coarse/refined persistence | PRESENT / TESTED | Arbitrary four-stage variants, autosave/crash recovery and profile revisions require additional tests and schema work. |
| SURVEYOR boundary and future API | PRESENT boundary / DEFERRED API | Shared registers describe proposed messages only. No API or shared writable database implemented. |

After USER acceptance, recommend a bounded **USER PATH and versioned course-variant foundation** increment: retain itinerary IDs and all existing route evidence; explicitly map old coarse/refined meanings; add input revisions/invalidation and persistence migration; then stage UI and path interactions in a separate tested increment. Complexity: high across core/course-model/passage/renderer and save/open compatibility. Required tests: old-project migration, stable IDs/order, unrestricted land/ocean/polar path, immutable historical variants, cache invalidation and restart. Do not implement until authorised.

Subsequent sequence: (1) path interaction/undo/label controls and canonical render tests; (2) BY-WAY/stage controls and versioned ship operational snapshots using the supplied workbook; (3) generic region/tile/basin data management with atomic updates/rollback and offline tests; (4) evaluated road engine integration; (5) evidence-backed navigable/weather-stage extensions and presentation LOD. Each needs its own approval and acceptance boundary. Existing reusable profile, geodesic, coarse-preservation and discovery functions should be extended rather than recreated. Further geographic acquisitions should follow coverage gaps/regions rather than another list of destination-specific patches.

## 9. Preservation, publication and acceptance recommendation

`preservation-verification.json` confirms ten protected asset hashes, including the original v0.3.0 MSI, original geographic masks/gazetteer/waterways/discovery evidence and the approved mapped-refinement package/manifest. Tests did not open or migrate existing USER projects and did not modify installed applications. Isolated desktop directories are recorded in each result. No data was removed; ignored raw acquisitions remain available.

**Recommendation: ready for USER review and acceptance as a bounded water-area topology engineering checkpoint, with the 32 unresolved evaluations and stated limitations explicitly open. Not ready for full Stage 2 acceptance, worldwide-coverage acceptance, vessel navigation certification or release.** The evidence supports accepting the implemented conservative graph/refinement improvements, not closing the broader requirements.

Current source and datasets remain uncommitted. Per the latest instruction, no shared documentation commit is made either. The complete local worksheet is `20261019_NERDS_V001.md`; publication is pending further direction and no GitHub worksheet URL/commit is claimed. No change to the shared master or another application's status has been made. USER approval is required before committing this increment or beginning new features.
