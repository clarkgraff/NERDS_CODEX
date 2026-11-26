# 4nR-NERDS — SCOPE AMENDMENT, REVISION E
## Offline Geography, Valhalla Road Routing, Ferry-Route Intelligence, Terminal Labels and Font Controls

**Date:** 26 November 2026  
**Status:** Approved functional additions; implementation/testing pending  
**Repository:** clarkgraff/NERDS_CODEX  
**Historical baseline:** SCOPE Revision D, preserved without alteration  
**Document control:** Additive amendment only; existing requirements remain operative except where explicitly clarified below.

## E0. Governing principles

1. NERDS is OFFLINE-FIRST. Internet access is for authorised data acquisition and updates, not a prerequisite for mapping, routing, geographic inspection or use of previously acquired data.
2. Preserve existing CesiumJS architecture, Valhalla 3.9.1 work, local OpenStreetMap (OSM) extracts, projects, route geometry, USER PATH and the verified CRONKITE receiver.
3. No fake connectivity: never label straight-line substitutes, schematic ferry relations or unsupported access connectors as completed geographic routes.
4. Waypoint coordinates belong to the user. A discovered harbour/terminal/access point is a separate geographic entity; do not silently move the selected waypoint.
5. Source datasets must retain geographic coverage, provenance, date, licensing, source-resolution and known uncertainty. Download archives and large imagery assets live outside Git source control.
6. Previously approved SCOPE Revision D remains the governing requirement for MARINE CHARTS display (ON/OFF, default OFF). Automated vessel-specific chart-clearance assessment is not a current-beta acceptance dependency.

## E1. OSM road maps and Valhalla — immediate priority

1. Restore visible, detailed OSM road-map layers in the Cesium globe: roads, junctions, bridges, appropriate road labels and zoom-dependent detail, independently selectable from satellite imagery and marine charts.
2. Find and validate the existing locally deployed Valhalla 3.9.1 routing service, Docker configuration, graph tiles and previous road-routing test evidence. Do not replace Valhalla with a different routing engine.
3. Connect NERDS BY LAND requests to real Valhalla routes, with true road-following geometry, calculated distance and duration. Resolve ROAD_NETWORK_UNAVAILABLE where a working local routing service and graph coverage exist.
4. Distinguish unavailable service, missing graph coverage, no connected road route and unresolved last-mile connections. Do not substitute a direct line while claiming a road route was calculated.
5. The travel mode on a waypoint describes **how that waypoint is reached**. When a preceding starting waypoint is not on the water and the following waypoint is on the water, default the following waypoint's incoming leg to BY LAND. The user retains the ability to override that mode. Preserve the precise waypoint coordinates.
6. Local OSM road network and Valhalla graphs must remain usable without Internet.

## E2. FERRY ROUTES — independent overlay and terminal identification

1. FERRY ROUTES is an independent MAP LAYERS ON/OFF control, not coupled to CARTOGRAPHIC + SATELLITE. It must remain operational in SATELLITE and all compatible base-map styles.
2. Display available locally mapped OSM ferry-route geometry, identifiable ferry terminals and **readable terminal names** whenever FERRY ROUTES is ON.
3. Display ferry service/route names, origin and destination terminal identities where supplied by the source. When a terminal has no recorded name, use a neutral UNNAMED FERRY TERMINAL designation; never invent a name.
4. Terminal labels are geographically anchored vector/text overlays wherever font control is required. They are not solely embedded in uneditable raster map tiles.
5. Allow left-mouse-click (LMC) on a ferry terminal to inspect name, geographic coordinates, linked services and source evidence.
6. Distinguish ferry-service lines from NERDS user-plotted BY SEA routes, road routes, vessel warnings and CRONKITE pending discoveries.
7. Terminal markers, ferry-route geometry and labels must continue to display offline when matching local coverage exists.

## E3. Ferry-assisted maritime routing and harbour access

1. PLOT ROUTE shall inspect locally available ferry routes and ferry-terminal-to-terminal geographic connections as supplementary evidence for waterway connectivity and harbour access.
2. Use mapped ferry geometry to identify candidate water corridors, route graph links, harbour approaches and access points, alongside coastline/waterway/ENC information when present.
3. Ferry tracks or relations may be approximate or simplified. A ferry service is evidence of connection, not proof of vessel clearance, exact navigable geometry or unrestricted passage.
4. Do not automatically divert the user's route onto a ferry itinerary, equate a ferry service with the expedition vessel's route or change the user's selected waypoints.
5. Where an adequate connected candidate is identified, allow PLOT ROUTE to calculate the approach using supported geography. If the harbour connection remains unsupported, retain a clearly quantified unresolved gap and supporting diagnostic evidence.
6. **FERRY TERMINAL-TO-TERMINAL ROUTING INTELLIGENCE:** where mapped ferry geometry exists, calculate distance along that geometry in nautical miles, not merely a great-circle line between terminal endpoints. Mark estimates based on generalized or incomplete line geometry accordingly.
7. Estimate the expedition vessel's travel duration from routed distance and selected vessel speed (initial default 6 kn). Where source-supplied published ferry crossing time exists, show it separately, explicitly identified as a ferry-service reference, not the expedition vessel's travel time.
8. Incorporate defensible local ferry-derived connection evidence into persistent offline geographic indexes for reuse; retain source links and allow refreshing from newer approved data.
9. Establish regression cases for **Rønne (Bornholm, Denmark), Karlskrona (Sweden), and Stralsund (Germany)**, preserving the captured offshore endpoint-gap cases and existing user projects.

## E4. Satellite and aerial imagery — independently operable

1. NERDS must display already acquired imagery OFFLINE without consulting a commercial map server. Satellite imagery streaming can be an optional acquisition/reference tool only, never an operational dependency.
2. Establish locally stored, georeferenced imagery, coverage manifests, indexed display tiles and a local Cesium-compatible serving mechanism. Preserve source attribution, integrity, licensing and resolution metadata.
3. Acquire higher-resolution imagery progressively: broad geographic coverage plus highest usable legal resolution for expedition corridors, ports and identified research areas. Do not invent available resolution or assume global sub-metre coverage.
4. Frontier Fibre bandwidth is not an acquisition-size optimisation constraint. Capacity, rights, provenance, processing resources and actual source resolution remain controlling considerations.
5. CHEKOV in SURVEYOR may assist with discovery, source verification, coverage research and acquisition planning; CRONKITE may supply new areas of interest. Neither replaces the NERDS local imagery index or becomes a mandatory runtime dependency.
6. Before downloading, inventory local files and previously incomplete acquisitions to prevent duplicates. Record dataset/source URL, coverage, resolution, rights, checksums, download results, processing state and tile availability.
7. Satellite-map success in a screenshot does not by itself establish that the imagery is cached and available without Internet. Test with external connectivity disabled.

## E5. FONTS & LABELS — new global preferences

1. Provide SETTINGS → GLOBAL PREFERENCES → FONTS & LABELS with independent **INTERFACE FONTS** and **MAP LABELS** groups.
2. User controls: font family, interface scaling, map-label size, map-label weight, text colour, halo/outline, optional translucent label backing, density and category visibility.
3. Ferry terminal and ferry-route names must be covered by these map-label controls.
4. Persist settings across restart and map-style changes; maintain readable contrast on SATELLITE and CARTOGRAPHIC + SATELLITE.
5. Where labels are baked into third-party raster imagery, disclose that they cannot be separately restyled; use a controllable vector/text overlay for NERDS-owned geographic labels.

## E6. Optional vessel-specific advisory — preserve beta boundary

1. VESSEL-SPECIFIC ROUTE ASSESSMENT defaults OFF.
2. When deliberately switched ON, retain the original user-plotted route and highlight **evidence-supported** restricted sections RED without automatically modifying geometry.
3. When sufficient connected evidence exists, display up to two plausible candidate alternatives in ORANGE. LMC selects an alternative; any adoption must be explicit and reversible.
4. Unknown chart coverage, depth datum, tide or clearance is UNRESOLVED, not falsely declared SAFE or IMPASSABLE.
5. This advisory is an approved future/optional capability and MUST NOT delay road maps, Valhalla routing, marine-chart display, ferry visibility or offline imagery. Vessel-specific chart-aware automated routing remains outside the CURRENT beta gate unless separately authorised.

## E7. Acceptance and delivery

A. Road map appears offline; Valhalla returns road-following BY LAND geometry in at least two covered regions; an inland-to-water waypoint pair defaults to incoming BY LAND.
B. FERRY ROUTES shows route geometry, identifiable terminals and readable terminal names in both SATELLITE and CARTOGRAPHIC + SATELLITE modes. Toggling imagery backgrounds preserves independent overlay state.
C. A mapped ferry connection yields evidenced terminal-to-terminal geographic distance and vessel-speed travel duration. Published ferry duration is visually and semantically separate.
D. Rønne and Karlskrona harbour access are re-evaluated against local ferry connection evidence; every unresolved gap remains explicit and no fabricated connection is accepted.
E. Offline imagery actually displays with Internet disconnected; missing areas are identifiable.
F. FONTS & LABELS controls visibly affect NERDS-owned overlays and persist across restart.
G. Existing projects, chart overlays, waypoint controls and CRONKITE protections pass regression tests.
H. Document every dataset newly downloaded, reused, rejected or unavailable. Do not equate research evidence with certified navigability.
I. Update the SCOPE when changes are actually approved or built, and back up source plus documentation to GitHub after verified builds under the established source-control mandate. Preserve source history and avoid force pushes.

**END — 4nR-NERDS SCOPE Revision E.**