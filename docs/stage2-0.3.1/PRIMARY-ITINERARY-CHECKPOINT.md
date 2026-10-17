# Stage 2 primary geographic acceptance checkpoint — 2026-10-16

Primary mandatory itinerary: **HAMBURG → CUXHAVEN → KIEL → COPENHAGEN**. All four are ordered USER waypoints. Hamburg → Kiel remains a separate unrestricted routing test. Brunsbüttel and Holtenau are acceptance checks, not injected router waypoints. Antarctica / Machu Picchu Antarctic Scientific Station / ECAMP remains mandatory discovery acceptance.

This is an incremental Stage 2 checkpoint, not completion of Stage 2 or release approval. Local development branch: codex/stage2-v031. Accepted Stage 1 commits d7f031b and 38f161d remain preserved; preceding Stage 2 suitability checkpoint is c76f436. The new source/data/tests/evidence are committed together after this report. No remote Git operations, MSI packaging or Stage 3 work occurred.

## Primary outcomes

| Case | Geographic acceptance |
|---|---|
| Hamburg → Cuxhaven → Kiel → Copenhagen | PASS |
| Copenhagen → Kiel → Cuxhaven → Hamburg | PASS |
| Hamburg → Kiel, unrestricted | PASS |
| Kiel → Hamburg, unrestricted | PASS |

Forward/reverse comparisons also PASS: every leg has the exact reversed vertex sequence, with distance differences below 0.000000001 NM. Comparisons have a documented 0.1 NM distance tolerance; geometric equality is separately recorded.

| Mandatory forward leg | NM | Cumulative NM | Operating duration at 10 kn | Arrival UTC |
|---|---:|---:|---|---|
| Hamburg → Cuxhaven | 57.917323 | 57.917323 | 5 h 47 m 30 s | 2026-10-15 17:47:30 |
| Cuxhaven → Kiel | 73.724362 | 131.641685 | 7 h 22 m 21 s | 2026-10-16 01:09:51 |
| Kiel → Copenhagen | 157.022780 | 288.664465 | 15 h 42 m 08 s | 2026-10-16 16:51:59 |

The regression fixture departs at **2026-10-15 12:00 UTC**. Total operating passage duration is 28.866446 hours; the 6 kn reference duration is 48.110744 hours. These are nominal movement estimates, excluding lock waiting, stops, tides and current effects. Anchor-to-water connectors remain separate and excluded; these tests do not certify city landing access or vessel suitability.

Unrestricted Hamburg → Kiel is 99.263231 NM through the canal. The longer four-waypoint itinerary retains the mandatory Cuxhaven visit instead of bypassing it.

## Before and after

The newly added primary test first returned UNRESOLVED in all four directional cases. Cuxhaven → Kiel used an approximately 509.04 NM ocean detour and the full itinerary had a discontinuous attachment at Cuxhaven. Unrestricted Hamburg → Kiel returned approximately 561.96 NM without establishing the canal passage. These unsuccessful results and full geometry are retained in primary-itinerary-before.json and primary-itinerary-before-paths.json.gz.

Acquired regional source geometry established connected Elbe/Kiel Canal paths. The routing adapter now resolves each waypoint's attachment independently for the selected network and compares connected source and ocean alternatives using those same attachments. This removes the Cuxhaven discontinuity and selects the shorter canal geometry without hardcoded city routes or forced entrance waypoints.

Kiel → Copenhagen combines source waterway approach geometry with the existing Europe ocean grid. Every source/grid transition is checked at identical portal coordinates. Remaining transitions elsewhere that cannot be connected still produce UNRESOLVED, not instantaneous movement.

## Acceptance checks

PASS requires all mandatory legs, preserved waypoint order, exact source-edge or valid grid-edge connectivity, consistent attachments, distances recomputed from geometry, cumulative NM, reference and operating durations, and UTC ETA arithmetic. The canal leg must encounter both entrance test regions in the correct direction. The test regions are approximate 1.5 NM geographic gates, never navigation coordinates or routing inputs. The [Schleswig-Holstein government description](https://www.schleswig-holstein.de/DE/landesregierung/themen/verkehr-infrastruktur/nord-ostsee-kanal) identifies Brunsbüttel and Kiel-Holtenau as the canal ends.

Grid sections reject blocked cells, non-adjacent edges and diagonal corner cutting. Source sections must reproduce actual adjacent vertices and edge IDs from the checksummed dataset. Hybrid sections must reconstruct the complete returned path and meet without gaps. Negative automated tests deliberately corrupt source edges, coordinates, waypoint IDs, distances and ETA and confirm FAIL classification.

FAIL means a returned invariant is violated. UNRESOLVED means a required connection, transfer, entrance or comparison is not established. DEFERRED means not executed and is never PASS. A drawn line alone is insufficient. These are geographic planning criteria, not hydrographic navigation clearance.

## Validation results

- Automated suite: **29 PASS, 0 FAIL** (`node --test test/*.test.cjs`).
- Primary itinerary runner: **4 PASS, 0 FAIL, 0 UNRESOLVED, 0 DEFERRED**; two direction-comparison groups PASS.
- Retained 159-evaluation geographic inventory: **109 PASS, 0 FAIL, 50 UNRESOLVED, 0 DEFERRED**, compared with Stage 1's 77 PASS / 82 UNRESOLVED. Repeated isolated/full-itinerary contexts are included; these are not 159 unique routes. Geographic runner exit 1 is intentional because UNRESOLVED remains.
- Primary Electron desktop: **5 workflow groups PASS**, zero renderer errors: ordered plotting/totals; named project/source-evidence persistence; restart recovery; reverse plotting; WORLD/FIT/FOCUS calls. This is source-Electron testing, not packaged application acceptance.
- Discovery: **0 PASS, 5 FAIL, 0 UNRESOLVED, 0 DEFERRED**. Antarctica/ECAMP, Pitcairn Island, Two Harbors Catalina, Saint Peter & Saint Paul Rocks and Devil's Island are retained. No new discovery architecture is claimed.

The original Stage 1 reports remain unchanged. Working regression expectations were strengthened where new evidence changes the result: Hamburg-related routing now requires connected source geometry rather than expecting failure, and Santarém–Macapá has dedicated positive source-network tests. Missing inland/land networks and independent-leg error isolation remain tested.

## Source changes and data

- src/waterway-network.cjs: indexed exact-vertex source graph, connected components, shortest-path search and source/grid portals. No tolerance joining of disconnected waterways.
- src/geographic-route.cjs: consistent attachments, source/ocean alternatives and hybrid geometry with source evidence.
- src/passage.cjs: routing adapter, independent suitability assessment, geometry-cache revision and source-data fingerprint.
- src/suitability.cjs: mapped access restrictions retained as advisories; unknown dimensional/seasonal source tags remain unknown.
- src/public/app.js and index.html: current development label/cache revision and corrected UTF-8 text.
- scripts/acquire-waterways.py, prepare-waterways.cjs and prepare-osm-waterways.cjs: reproducible query/conversion foundation; response errors are not silently accepted as complete data.
- assets/waterways/: compressed Natural Earth and OpenStreetMap source geometry plus acquisition/checksum/license manifests. The combined OSM snapshot contains 11,734 ways from Elbe, Thames, Amazon and Kiel/Denmark queries. This is regional coverage, not a complete worldwide network.
- New geographic validator, primary itinerary runner, desktop runner and retained discovery runner; expanded network tests.

Natural Earth river/lake centreline data is public domain. OpenStreetMap waterway data is attributed to OpenStreetMap contributors under ODbL 1.0. The manifests retain URLs, source timestamps and SHA-256 hashes. Raw acquisitions remain under the ignored work/stage2 directory. Existing masks and gazetteer are not rebuilt or replaced.

## Remaining work

The 50 unresolved geographic evaluations remain open. Great Lakes–St Lawrence, southern South American passages, several Amazon/European connections and cross-grid transitions are not all solved. One St Lawrence acquisition attempt failed HTTP 502. Broader discovery, multimodal controls/tracking, mode percentages, approved map styling/hover/context interaction, docking preparation and ROUTE SWARM adaptation remain Stage 2 work. Source waypoint access is approximate; source geography alone does not establish depth, bridge clearance, lock availability or legal access. Vessel suitability remains a separate BETA advisory with BYPASS default.

## Protection and evidence paths

All evidence is under:
`C:\Users\Clark\Documents\Codex\2026-10-13\ar\outputs\NERDS_CODEX\docs\stage2-0.3.1\`

- primary-itinerary-results.json / primary-itinerary-paths.json.gz
- primary-itinerary-before.json / primary-itinerary-before-paths.json.gz
- primary-test-output.txt
- primary-desktop-results.json / primary-desktop-output.txt
- geographic-results.json / geographic-paths.json.gz / geographic-summary.json / geographic-test-output.txt
- discovery-results.json
- unit-test-output.txt
- preservation-verification.json

Screenshot: `C:\Users\Clark\Documents\Codex\2026-10-13\ar\outputs\NERDS_CODEX\test-results\stage2-primary.png`.

Desktop tests used temporary isolated NERDS_DATA_DIR folders. The installed v0.3.0 and production USER projects/preferences were not used or modified. SHA-256 comparison confirms the existing v0.3.0 MSI, land-mask.bin, europe-mask.bin and geonames.sqlite remain identical to the Stage 1 protection baseline. New source datasets are separate additions. No installer was produced.
