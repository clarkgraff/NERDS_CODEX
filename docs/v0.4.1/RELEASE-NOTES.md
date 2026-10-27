# NERDS v0.4.1 corrective development test

26 October 2026. Side-by-side product: NERDS Development Test 0.4.1; default data: %APPDATA%/NERDS-Development-Test-0.4.1. Existing 0.3.0 and 0.4.0 installations remain separate. Existing projects can be opened through File; use copies when evaluating changes. No automatic migration or modification of older databases is performed.

Implemented corrections:
- Removed obsolete Stage 1 disabling of mission objective and preference controls.
- Soft coastal separation explicitly OFF by default; optional penalties do not exclude access endpoints.
- Normal BY-SEA calculation attempts validated mapped-water topology after grid/source access failure. Prepared cached geography is registered before recovery. No widened access guard or invented shoreline connection.
- Open-water simplification tests the final geodesic first, retaining obstruction safeguards and canonical direction. WGS84 accounting follows final course vertices.
- Distinct unrestricted USER coarse snapshot and visual-only comparison, separate from pre-refinement BY-WAY geometry. Coarse measurement has a direct-course display action. BY-WAY/NAVIGABLE controls labelled explicitly.
- Independent resizable panels, double-click reset and persisted widths.
- City labels ON/OFF, minimum/maximum population sliders, explicit unknown-population policy, separate screen-space exclusion, waypoint and other feature label controls.
- EDIT USER PATH marker dragging preserves identity/order, changes WGS84 coordinates and revision, clears obsolete access, invalidates active routes and retains historical variants.
- Explicit bounded offline coverage preparation/recalculation and optional USER-triggered online acquisition. Connector records explicitly distinguish provisional unspecified transfers from vessel passages.

Material limitations:
- Missing geographic evidence remains UNRESOLVED. This is not certification that every reported Brazil/island/Great Lakes fixture now routes successfully. No destination-specific geometry was fabricated.
- Live provider availability remains unresolved; online recovery may fail without acquiring usable evidence. The seed gazetteer is installed; the separate 3 GB expanded discovery database remains excluded.
- Terrain hillshading is still unavailable. Road routing and weather routing remain unavailable; per-destination mixed-mode selectors and CRONKITE are registered future work, not implemented.
- Direct coarse path display is intent geometry, not water connectivity. Provisional shoreline transfers have no asserted RIB suitability or duration.
- Installer is unsigned. No installed production data is automatically migrated.

Future requirement retained: destination card 01 START; subsequent destination BY-WAY selector defines the inbound leg, default BY-SEA, with BY-AIR/BY-LAND choices; reorder reconnects by itinerary order. Deferred to a subsequent increment.

Validation: complete Node suite 79 PASS / 0 FAIL. The prior refinement fixtures explicitly disable new recovery when testing historical unrecovered baseline behaviour; a separate normal BY-SEA test verifies mapped-water recovery. Installed-application results are recorded in ui-tests.json and end-to-end.json. MSI installation returned 0 and installed ProductVersion is 0.4.1.0. No pushes, repository changes outside NERDS_CODEX or Stage 3 work.
