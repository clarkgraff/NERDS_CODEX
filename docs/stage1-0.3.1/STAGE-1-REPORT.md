# NERDS v0.3.1 Stage 1 checkpoint — 2026-10-15

Stage 1 repairs and diagnostic runs are complete. Geographic acceptance remains incomplete. This is a review checkpoint, not a v0.3.1 release approval. No MSI was built; Stage 2, Stage 3 and ROUTE SWARM integration were not started. Work stops here pending explicit authorization.

## Repository and preserved work

Working directory: `C:\Users\Clark\Documents\Codex\2026-10-13\ar\outputs\NERDS_CODEX`.
Branch: `codex/stage1-v031`. Fetch and push origin: `https://github.com/clarkgraff/NERDS_CODEX.git`.
Baseline: `415f2d7`. Repair/source/test commit: `d7f031b` (Repair Stage 1 grid selection, isolated legs and partial passage accounting). Report/evidence are committed separately after this report is written. No Stage 1 push was performed. No merges were performed; NERDS and NERDS_COPILOT were not modified. The prototype branches were not integrated.

Existing interrupted results are retained in `interruption-snapshot/`. Baseline code was loaded with git show into an isolated runner, without checking out or overwriting working source. Package version remains 0.3.0; calculation engine identifies itself as 0.3.1-stage1.

## Corrections implemented

| Source | Correction |
|---|---|
| src/water-route.cjs | Choose a common Europe/world grid before resolving both endpoints; validate water cells/components; remove distant whole-world fallback; reject excessive access substitutions and collapsed distinct anchors; record per-leg evidence. |
| src/passage.cjs | Calculate each leg independently; retain/reuse unchanged successful geometry; represent unknown values as null; separate known subtotals from whole-voyage totals; prevent downstream absolute ETA after a gap; identify unresolved transfers when adjacent legs use different access points. |
| src/core.cjs | Persist explicitly unresolved legs with null distance while retaining validation of legacy results. |
| src/exports.cjs | Preserve partial-route metadata and valid later geometry; omit nonexistent tracks and invented timestamps. |
| src/main.cjs | Record per-leg diagnostics, with bounded log rotation; diagnostic write failures do not destroy calculations. |
| src/public/app.js | Display partial results and unknown totals/ETAs explicitly; retain previous geometry cache; show baseline BYPASS while preserving saved preferences; retain drag/map numbering and viewport controls. |

Optional preferences and coastal-separation penalties are bypassed by default for baseline testing. Diagnostic comparison runs can explicitly enable them. No new waterway dataset, port exception or gazetteer architecture was introduced. BY-LAND reports ROAD_NETWORK_UNAVAILABLE rather than presenting a straight line as a road route. BY-AIR remains a geodesic estimate.

The local access guard is max(15 NM, four grid steps): 15 NM in Europe and 24 NM worldwide. It prevents extreme substitutions; it is not a vessel-clearance or harbor-suitability rule. Search is locally bounded. Connectors from city anchors are excluded from passage distance and have not been hydrographically validated.

## Acceptance criteria and totals

- PASS: all requested legs calculate on compatible water grids with legal adjacent edges and no diagonal corner cutting (or an air geodesic); accounting is consistent; no unresolved transfer remains; nominal ETA is complete. Sea PASS means coarse offshore planning only, not verified navigability, city access, depth or clearance.
- FAIL: an unexpected exception or returned geometry/accounting invariant violation. Discovery FAIL means the required named feature was not correctly discoverable under its test identity and region.
- UNRESOLVED: at least one connection, transfer or duration is unsupported. This is a geographic non-pass even where software fault handling is correct.
- DEFERRED: not executed. Never PASS.

| Inventory | Total | PASS | FAIL | UNRESOLVED | DEFERRED |
|---|---:|---:|---:|---:|---:|
| Route evaluations | 159 | 77 | 0 | 82 | 0 |
| Remote discovery | 5 | 0 | 5 | 0 | 0 |
| Combined geographic/discovery inventory | 164 | 77 | 5 | 82 | 0 |

The 159 route evaluations contain 101 distinct input configurations, with intentional repetitions in isolated and full-itinerary contexts. They include 152 geographic evaluations (72 PASS, 80 UNRESOLVED), four preference comparisons (PASS), two preservation cases (one PASS, one UNRESOLVED), and one injected fault-isolation route (UNRESOLVED). Correct handling of an injected failure is not counted as geographic PASS.

Separately, all 24 automated tests passed and all seven isolated Electron workflow groups passed, with zero renderer errors. These software checks do not upgrade unresolved geography to PASS. No geographic failure was classified as PASS under the stated criteria.

## Baseline comparison and bidirectional coverage

The preserved baseline ran 60 full-itinerary directional evaluations: 50 returned a result and 10 threw. Returned is not equivalent to PASS. The baseline lacks the corrected acceptance guarantees.

Barcelona–Ibiza, A Coruña–Lisbon and the Gibraltar–Algiers–Marseille sequence had baseline failures; corrected coarse routing succeeds both directions. Baseline inland results included false zero distances for Santarém–Macapá, Santarém–Itaituba, Santarém–Alter do Chão and Kingston Mills–Toronto. It also returned Hamburg–Cuxhaven at about 10.6 NM after a roughly 40 NM offshore access substitution, and Montréal–Québec at about 1,132 NM via a false detour. Remote substitutions reached approximately 343 NM at Santarém, 468 NM at Itaituba, 589 NM at Manaus, 322 NM at Toronto and 196 NM at Montréal. These unsupported connections are now unresolved.

All suite itineraries ran forward and backward, together with isolated adjacent legs in both directions. `bidirectional-summary.md` provides every full-itinerary result and leg reason; `geographic-results.json` contains every individual evaluation.

| Route/group | Corrected result in both directions |
|---|---|
| Barcelona–Ibiza | PASS, approximately 157.92 NM |
| A Coruña–Lisbon | PASS, approximately 344.06 NM |
| Algiers–Marseille | PASS, approximately 397.73 NM |
| Amsterdam–Emden | PASS, approximately 141.65 NM |
| Amsterdam–London; London–Hastings | UNRESOLVED: Thames/local access missing; roughly 29 NM substitution rejected |
| Hamburg–Cuxhaven | UNRESOLVED: roughly 40 NM access substitution rejected |
| Brest–Bordeaux | UNRESOLVED: roughly 28 NM access substitution rejected |
| Amazon inland/tributary cases | UNRESOLVED: missing connected river geometry; an Atlantic-to-estuary leg can survive independently |
| Great Lakes–St Lawrence cases | UNRESOLVED: absent/removed inland water connectivity |
| Odesa–Sevastopol–Rostov | Partial: initial connection calculates; Rostov access unresolved |
| Odesa–Istanbul–Tel Aviv by land | UNRESOLVED: no road routing graph |
| Marseille–Barcelona–Ibiza–Algiers–Marseille | UNRESOLVED whole itinerary despite calculated legs: grid-dependent access transfers remain unknown |

Hastings–Brest, Ponta Delgada–Lisbon–Cádiz, Ibiza–Gibraltar, Gibraltar–Algiers, Marseille–Barcelona and Cuxhaven–Emden also calculate under coarse criteria. Full details and direction-specific values are in the generated tables and JSON.

## Southern South America

The complete Montevideo–Stanley–Ushuaia–Punta Arenas–Concepción itinerary is UNRESOLVED forward and backward. All four adjacent pairs were also run independently both ways.

| Pair | Both directions |
|---|---|
| Montevideo–Stanley | Coarse PASS, approximately 1,005.96 NM |
| Stanley–Ushuaia | UNRESOLVED |
| Ushuaia–Punta Arenas | UNRESOLVED |
| Punta Arenas–Concepción | UNRESOLVED |

Nearest world-mask access candidates are approximately 14.93 NM from Montevideo, 11.73 NM from Stanley, 51.67 NM from Ushuaia, 96.69 NM from Punta Arenas and 19.79 NM from Concepción. Ushuaia and Punta Arenas exceed the 24 NM diagnostic guard. In reverse, the later Stanley–Montevideo leg survives, with no invented absolute ETA after earlier gaps.

Baseline full itineraries returned about 3,024.57 NM forward and 3,015.20 NM reverse using distant substitutions; these are not proof of channel connectivity. Beagle Channel, Strait of Magellan and southern Chilean waterways remain unvalidated. Candidate/component evidence is in `southern-waterway-diagnostics.json`. Mask/access failures are distinguished from physical restrictions: genuine restrictions are UNVERIFIED because authoritative restriction data is not loaded. No legal or physical closure is inferred from a missing raster connection.

## Independent-leg and accounting verification

Automated and Electron tests verify that adding a failing leg preserves earlier successful geometry; later independent legs still calculate; unchanged paths can be reused; partial projects and preferences survive save/restart. Physical waypoint dragging preserves IDs and updates map numbering and recalculation.

Known leg distance and duration contribute only to calculated subtotals. An unresolved leg has null values, not zero. Whole-voyage distance/duration remain unknown while any leg or transfer is missing. Absolute ETA becomes unknown after the first duration gap even when later legs have known durations. Different-grid access discontinuities are explicit unresolved transfers. No nonexistent export geometry or fictitious downstream GPX timestamps are generated.

Residual limit: the existing whole-worker 90-second watchdog remains. Routine leg errors are isolated, but process termination/crash does not have streamed durable per-leg checkpoints. Crash durability was not verified. The full packaged-release desktop suite was not run; the seven Stage 1 source-Electron workflow groups were run.

Some Revision C test expectations were corrected deliberately: unsupported Hamburg water access is now partial, and missing road routing is unresolved. Passing these tests does not claim those geographic features exist.

## Remote discovery inventory for Stage 2

| Required feature | Existing offline behavior | Result |
|---|---|---|
| Machu Picchu Antarctic Scientific Station / ECAMP | Full station name/ECAMP absent; Machu Picchu finds Peru | FAIL |
| Pitcairn Island | Island query absent; Pitcairn finds Pennsylvania. Adamstown, Pitcairn exists by settlement query but is not the required island feature | FAIL |
| Two Harbors, Catalina Island | Two Harbors finds Minnesota; Catalina feature absent | FAIL |
| Saint Peter & Saint Paul Rocks | Required English/Portuguese feature queries absent | FAIL |
| Devil's Island, French Guiana | Required English/French feature queries absent | FAIL |

These five cases are mandatory subsequent-stage acceptance cases. They were diagnosed against existing local coverage, with feature identity/region predicates. No new online discovery or caching architecture was implemented. NERDS and 4nR-SURVEYOR must support expedition-relevant features worldwide regardless of population, remoteness or tourism significance. Population thresholds must not define the discoverable planet.

## Geographic-data deficiencies

The unchanged mask-generation script rasterizes polygon outer rings, filling inland holes as land. The world mask dilates land by one cell and removes water components smaller than 1,000 cells. These choices can erase lakes, rivers, harbors and narrow channels. The bundled roads layer is display geometry, not a routing graph. No connected navigable-waterway graph or authoritative depth, bridge, lock, tide and restriction network is bundled.

These data defects explain why routing-code repairs cannot recover the Amazon, Great Lakes–St Lawrence and narrow southern channels. The diagnostics identify raster evidence, not authoritative hydrographic truth. Coarse PASS must not be promoted to navigation clearance.

## Preservation and test execution

The v0.3.0 installed application and production USER projects/preferences were not used or modified. Electron tests used isolated temporary NERDS_DATA_DIR storage. No installer or package build ran. Hash verification confirms the existing v0.3.0 MSI, Europe mask, world mask and gazetteer are unchanged. This is protection through isolation plus hashes of the listed artifacts, not a claim that every file in the user's installation was independently hashed.

Existing MSI SHA-256: `2B190FB955A43FDFD2F010AE5844B29D17025E148E408FC28574901B8E3524DE`.

Executed runners: `node --test test/*.test.cjs`; `node test/stage1-desktop.cjs`; `node test/stage1-geographic.cjs`; `node test/stage1-baseline.cjs`; `node test/stage1-discovery.cjs`; `node test/stage1-southern-diagnostics.cjs`. Geographic runner exit 1 is intentional when any FAIL or UNRESOLVED remains; it is an acceptance gate, not an unexpected crash. Unit and Electron results are recorded separately.

## Evidence locations

All paths below are relative to this exact directory:
`C:\Users\Clark\Documents\Codex\2026-10-13\ar\outputs\NERDS_CODEX\docs\stage1-0.3.1\`

- `geographic-results.json`: all 159 route evaluations, reasons and accounting.
- `geographic-paths.json.gz`: full route geometry/evidence.
- `geographic-summary.json`: criteria, counts and full itineraries.
- `bidirectional-summary.md`: readable full-itinerary directional outcomes.
- `baseline-bidirectional.json`: 60 baseline directional runs.
- `baseline-regressions.json`: preserved earlier baseline run.
- `discovery-results.json`: five discovery failures and actual search evidence.
- `southern-waterway-diagnostics.json`: southern access/component evidence.
- `unit-test-output.txt`: 24 passing automated tests.
- `desktop-results.json` and `desktop-test-output.txt`: seven Electron workflow groups.
- `baseline-assets.json` and `preservation-verification.json`: before/after hashes.
- `interruption-snapshot\`: preserved interrupted results.

Desktop screenshot: `C:\Users\Clark\Documents\Codex\2026-10-13\ar\outputs\NERDS_CODEX\test-results\stage1-partial.png`. Test-specific runtime diagnostic directory is recorded in desktop-results.json; temporary runtime files are not a permanent production-data location. Persisted JSON reports are the checkpoint evidence.

## Recommended next actions — authorization required

1. Establish connected, source-attributed inland/coastal waterway and port-access data; repair mask generation and test narrow channels without allowing arbitrary offshore substitution. Resolve grid-to-grid access transitions.
2. Add feature-based worldwide discovery and aliases covering islands, research stations, anchorages and remote landmarks; implement explicit discovery/review/cache behavior and the five mandatory cases without population gating.
3. Resolve USER-SELECTED, DISCOVERY and DISABLED transport interactions in the approved inline checkbox presentation during Stage 2; retain independent-leg accounting guarantees.
4. Add source-backed vessel constraints and clearly distinguish unknown clearance from confirmed restriction. Re-run both directions and complete itineraries for all unresolved geography.
5. Evaluate durable leg progress for worker timeout/crash and broader automated stress testing separately. ROUTE SWARM remains unmerged until authorized.

No claim is made that the full Revision A scope or all geographic acceptance requirements are complete. Stage 1 work stops at this checkpoint.
