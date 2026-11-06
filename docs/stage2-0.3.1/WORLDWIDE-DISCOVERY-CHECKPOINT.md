# Stage 2 worldwide discovery and St Lawrence checkpoint

This is a development checkpoint, not Stage 2 acceptance or a release. Application/package version remains 0.3.0; no installer was built. Base local checkpoint: 393eb39, branch codex/stage2-v031.

## Implemented and verified

- Built the complete GeoNames allCountries index: 13,472,462 records, 3,148,472,320 bytes, all source feature classes, no population filter. Original names, aliases, WGS84 coordinates, feature class/code, country/region, source IDs, source modification dates and provenance remain available. The original seed database is unchanged.
- Added phrase-priority retrieval to prevent common partial matches from excluding exact remote-place aliases. Results remain explicitly selected by the USER; nothing substitutes a nearby settlement automatically.
- Added documented ECAMP/Spanish/English station names and qualified Two Harbors labels as supplemental aliases on existing source IDs. The supplement is not the worldwide gazetteer and does not replace coordinates. Sources are recorded in assets/discovery/source-aliases.json and carried into saved waypoints.
- Verified the existing approved-discovery cache persists across restarts and validates incoming coordinates/identity before replacing records.
- Acquisition now resumes HTTP ranges with If-Range validators. Changed or unverified partial content is preserved separately, never appended blindly to a newer daily dump. Completed ZIPs receive CRC verification and transfer SHA-256 metadata.
- Retained southern-channel data; completed both St Lawrence requests and Breves acquisition. Source graph now contains 22,431 unique OSM ways. Breves duplicates already acquired ways; obtaining it did not close the route gap.
- Montreal–Quebec now routes both directions using connected mapped geometry. Existing masks and original seed data were not modified.

## Executed acceptance

| Suite | Results |
|---|---|
| Geographic inventory | 159 evaluations: 113 PASS, 0 FAIL, 46 UNRESOLVED, 0 DEFERRED |
| Primary ordered Hamburg–Cuxhaven–Kiel–Copenhagen and unrestricted Hamburg–Kiel | 4 PASS, including reverse directions |
| Automated Node suite | 34 PASS, 0 FAIL |
| Acquisition interruption/version-change tests | 2 PASS |
| Mandatory remote discovery | 5 PASS, 0 FAIL; all 13 required query forms pass |
| Discovery desktop | 4 workflow groups pass, no renderer errors; main-process fetch disabled |
| Primary desktop | 5 workflow groups pass, no renderer errors |

The original discovery runner accepted any one matching query per feature. It now requires the designated canonical/alias queries and requires the Antarctic record to be classified as a scientific/research base. Optional alternate-query misses remain explicitly recorded: Adamstown is not accepted as Pitcairn Island, and the Portuguese archipelago phrase remains unmatched. Worldwide source coverage does not mean every named feature or alias on Earth is present.

The geographic gain is four Montreal–Quebec evaluations, compared with the historical 109 PASS / 50 UNRESOLVED. Existing routing fixtures are pinned to the original seed data so new hotels, administrative features or alternate place matches do not move test anchors. The previous test expecting Montreal–Quebec to fail was replaced by positive bidirectional geometry validation; missing-network handling remains tested with Kingston Mills–Toronto.

## Remaining geographic work

46 evaluations are still UNRESOLVED, not PASS. Detailed endpoint/component evidence is in connectivity-diagnostics.json.

- Toronto/Lake Ontario and Kingston Mills lack connected lake/harbour routing coverage at their endpoint anchors; St Lawrence source acquisition alone does not solve lake transfers.
- Breves, Alter do Chao and the Amazon-estuary fixture still lack complete endpoint/portal connectivity.
- Ushuaia/Punta Arenas have nearby mapped waterways in separate components, but no validated full passage to the required ocean network. River/canal/fairway acquisition does not supply complete Beagle/Magellan/Chilean-channel water geometry. These are missing connectivity, not established vessel restrictions.
- Barcelona has a discontinuous attachment between European and worldwide leg grids in mixed-grid itineraries.
- Bordeaux and Rostov-on-Don need better source connectivity and ocean transitions.
- Land routing remains unresolved without a road graph.

Multimodal mode states, full craft/personnel tracking, distance percentages, remaining map interactions/presentation and docking preparation are still incomplete; this checkpoint does not claim them implemented. Vessel validation remains separate and advisory-only in BETA. No SURVEYOR implementation was started.

## Evidence and recovery

All paths below are repository-relative:
- docs/stage2-0.3.1/geographic-results.json, geographic-paths.json.gz, geographic-summary.json
- docs/stage2-0.3.1/connectivity-diagnostics.json
- docs/stage2-0.3.1/discovery-results.json, discovery-desktop-results.json
- docs/stage2-0.3.1/primary-itinerary-results.json, primary-desktop-results.json
- docs/stage2-0.3.1/unit-test-output.txt, acquisition-test-output.txt
- docs/stage2-0.3.1/preservation-verification.json
- assets/discovery/manifest.json and assets/waterways/osm-manifest.json

The 3.15 GB generated database assets/discovery/world.sqlite and downloaded work/discovery/allCountries.zip are retained locally and intentionally ignored by Git. Preserve them when backing up the workspace. Reproduce with scripts/acquire-world-discovery.py followed by scripts/build-world-discovery.py; the manifest identifies the exact acquired archive checksum. A future daily download may contain changed data. The builder retains the previous index rather than destroying it.

SHA-256 of world.sqlite: 831d2e094ec6d7b0cf83aa39c425767d6bc0225c9c9efa81bae3485982ce55e2.

The old MSI, both original masks and the original seed database were rehashed unchanged. Desktop tests used isolated temporary USER directories, not the installed application's data. No installed application launch, production-data migration, GitHub operation, branch switch, MSI packaging or Stage 3 work occurred.
