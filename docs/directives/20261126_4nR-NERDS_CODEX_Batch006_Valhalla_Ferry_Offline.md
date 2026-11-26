# 4nR-NERDS — CODEX DEVELOPMENT DIRECTIVE
## Batch 006: Valhalla, Ferry-Derived Maritime Connectivity, Independent Layers and Offline Geographic Acquisition

**Date:** 26 November 2026
**Status:** Approved requirements; implementation pending
**Repo:** C:\DATA_DRIVE\GITHUB\NERDS_CODEX
**Governing amendment:** docs/scope/20261126_4nR-NERDS_Scope_Amendment_RevE.md
**Prior SCOPE:** Rev D and all preceding approved requirements remain intact.

## I. Mandatory preservation and priority

1. Inspect current Beta v1.0.1 source, repository status, the existing Valhalla 3.9.1 installation, Docker graph files, locally acquired OSM, the Cesium imagery stack, marine chart data and CRONKITE waypoint receiver. Do not overwrite any uncommitted work.
2. P0: operational offline OSM road maps + actual BY LAND routing via existing Valhalla.
3. P1: independent FERRY ROUTES overlay, readable ferry terminal names, ferry-route/terminal evidence available to PLOT ROUTE, and correction of harbour endpoint gaps.
4. P2: local high-resolution imagery acquisition, tile preparation, coverage indexing, OFFLINE satellite viewing; integrate CHEKOV geographic sourcing and CRONKITE area-of-interest triggers without runtime dependencies.
5. P3: separate map-label and interface-font controls, accessible in SETTINGS → GLOBAL PREFERENCES → FONTS & LABELS.
6. Maintain existing MARINE CHARTS ON/OFF default OFF and user-evaluated route viability. Automated chart-based vessel clearance must not delay this batch. Optional vessel assessment defaults OFF and does not change routes without explicit user selection.
7. Preserve every original saved project, approved UI control, previous routing improvements, all existing test cases, Git history and historical SCOPE. No destructive consolidation or force pushes.

## II. Actual road routing

1. Restore visible georeferenced OSM road map detail in Cesium at appropriate scales, without depending on Internet.
2. Validate the existing Valhalla 3.9.1 Docker/service instance and graphs. Connect the NERDS BY LAND route request to this service (configurable local endpoint, diagnostics, lifecycle).
3. Render decoded road-following geometry, road distance and journey duration. Preserve original waypoint coordinates and mark missing last-mile connectors as unresolved.
4. Incoming travel mode describes how the current waypoint is reached. An inland starting waypoint followed by a waypoint on water defaults the second waypoint's incoming mode to BY LAND; allow deliberate user override.
5. Regression: Bordeaux→Toulouse where previously verified and at least one separately mapped region. Test cold start, absence of Internet, graph missing and disconnected endpoints.

## III. Ferry routes as both visible features and routing evidence

1. FERRY ROUTES ON/OFF is an independent MAP LAYERS toggle. Map geometry, terminal markers and terminal names must remain visible in SATELLITE and CARTOGRAPHIC + SATELLITE modes, and compatible other map modes.
2. Extract ferry route geometries, service names, terminal names, ferry terminals, harbour features and source IDs from locally acquired OSM. Do not fabricate missing route names or geometry.
3. Use vector/text overlay labels for terminal names, with readable halo/background on satellite imagery; left-click a terminal to inspect its coordinates, linked ferry services and evidence.
4. Use ferry terminal-to-terminal geometry as supplemental maritime route evidence: distance follows mapped path, expressed in nautical miles. Calculate an indicative vessel travel duration from selected speed (6 kn default). Present any published ferry crossing time separately as source-specific ferry information; never substitute ferry time for voyage duration.
5. Ferry geometry may be generalized and does not establish certified navigation. Combine it with harbour topology, connected waterways and available chart metadata; preserve uncertainty and do not automatically move user waypoints or guarantee vessel access.
6. Use ferry-derived evidence to improve candidate port access at Rønne (Bornholm), Karlskrona, Stralsund and other endpoints. Report unresolved offshore gaps accurately where a genuinely connected approach is not established.
7. Ensure the BY SEA expedition route and mapped ferry service lines have distinct styles. Ferry overlay visibility must not alter the plotted route.

## IV. Offline imagery and data acquisition (not running yet)

1. INVENTORY FIRST: report all already downloaded sources and processing state. Reuse available NOAA ENCs, OSM country/regional extracts, any locally cached imagery and existing Valhalla graphs.
2. Confirm the six failed Batch 001 datasets and whether Batch 001B recovery succeeded: GEBCO 2026, GEBCO TID, GSHHG, OSM water polygons, HydroRIVERS and South America OSM. Resume only genuinely incomplete, needed assets.
3. New data acquisition: legal, locally retainable georeferenced satellite/aerial imagery covering the expedition's actual regions, beginning with tested Baltic and European coastal waypoints and harbour approaches. Start with a geographic coverage/resolution/licence/storage manifest before download.
4. For every asset record source, licensing/offline use, attribution, coverage, imagery date, actual pixel size, checksum, transfer status, original archive path and processed tile path. Do not treat Esri or other live online imagery as a local offline dataset.
5. Store raw data outside the Git repo under the established geographic data library. Prepare Cesium-compatible tiled imagery and local coverage metadata with robust no-network tests.
6. CHEKOV/SURVEYOR may research and catalogue sources; CRONKITE may flag additional acquisition targets. Neither becomes an Internet dependency of NERDS.
7. Bandwidth is not a practical download-size constraint on Frontier Fibre. Do enforce legal rights, available disk capacity, geographic coverage and processing/integrity verification.
8. Do not launch a bulk dataset download until recording exact datasets/URLs, sizes when known, rights and destinations in a reviewable acquisition manifest.

## V. Font settings

1. Implement independently configurable INTERFACE FONTS and MAP LABELS in SETTINGS → GLOBAL PREFERENCES → FONTS & LABELS.
2. User controls include font family, scale/size, weight, colour, map-text outline/halo, optional translucent backing, density and categories. Persist across map modes and restarts.
3. Ferry terminal/route labels must respond to these controls. Document raster base-map labels which cannot be restyled and draw NERDS-owned text separately.

## VI. Tests and deliverables

1. Execute focused and full regression tests including existing CHEKOV, CRONKITE, waypoint reorder, route persistence and previously corrected routing cases.
2. Test road routing and ferry overlays without Internet; demonstrate terminal name visibility and route details in at least two backgrounds.
3. Demonstrate Rønne and Karlskrona ferry-derived access assessment with unchanged original waypoints, defensible measured distance and transparent unresolved gaps.
4. Confirm at least one genuinely offline high-resolution satellite imagery dataset and usable Cesium local tile presentation, without external tile requests.
5. Record all created/modified files, datasets sourced or reused, tests passed/failed, remaining restrictions and screenshots of actual executable operation.
6. Amend the authoritative scope additively, without changing original master SCOPE documents.
7. Keep the verified local source intact, establish a safe backup and prepare a properly branded MSI once implementation and regression gates pass; do not represent an unbuilt installer or unpushed branch as delivered.

**FINAL RULE:** User-controlled, evidence-driven, offline-first routing. Do not fabricate geographic connectivity, silently change waypoints, or remove existing NERDS functionality.
