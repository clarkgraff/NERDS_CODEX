# NERDS v0.4.3 — Consolidated Development Master
**Status:** Approved development requirements; Priority 1 demonstration gate active  
**Date:** 2026-10-27  
**Repository:** `clarkgraff/NERDS_CODEX`  
**Baseline:** Verified v0.4.2 Development Test; preserve local v0.4.2 checkpoint  
**Authority:** Approved SIOP and subsequent explicit user decisions. Do not amend SIOP autonomously.

## Mandatory execution order
1. **P1: WORLDWIDE MAP RESOLUTION AND CARTOGRAPHY — FIRST. STOP FOR USER REVIEW.**
2. P2: Geographic acquisition, waterway topology and routing.
3. P3: Waypoint management, location selection and route interaction.
4. P4: Global preferences, UI readability and project paths.
5. P5: Location contacts, scheduling and optional Microsoft 365.
6. P6: Regression, installer, release reporting.

## P1 — Mapping: requirements and review gate
NERDS uses CesiumJS. **Retain CesiumJS** with globe, Mercator and tilted views, camera controls, layers, waypoints, routes and diagnostics. Current worldwide display uses mostly Natural Earth 1:10 million geometry; the current relief option changes globe lighting but supplies no elevation model. Correct source detail, not merely drawing resolution or colours. The user currently has to consult Google Maps to see rivers and junctions clearly. Make NERDS independently usable at local and regional scales.

Provide progressive zoom-dependent geographic detail: global generalised geography; continental waterbodies; regional rivers, tributaries, islands, roads, settlements and boundaries; local shorelines, riverbanks, canal segments and junctions. Use genuine higher-resolution sources, actual water polygons and DEM/terrain data for relief. Use tiling, spatial indexing and caching rather than globally loading highest resolution. Retain attribution, dataset provenance, resolution, licensing and offline-storage permissions. Do not cache providers' tiles in breach of terms.

**STYLE A — SIMPLIFIED NERDS:** preserve overall familiar look but improve muted/light land colours, contrast, waterways, coastlines, label hierarchy, route-line visibility, local detail and readability.  
**STYLE B — DETAILED TERRAIN:** lighter desaturated land palette (pale grey-green, restrained cream); clearly legible waters, finer rivers/canals/islands, real elevation and subtle hillshading, roads and settlements where source permits, progressively detailed labelled features. Both styles preserve all NERDS geographic overlays and remain independent of route calculation.

**Mandatory first demonstration:** render both styles over New Orleans → Baton Rouge using the *same camera extent, projection and zoom*; show Mississippi riverbanks/meanders, Lake Pontchartrain, surrounding waterways, roads, place names and terrain. Include source names, actual available resolution, caching/licensing status and screenshots or operational demonstration. **STOP and await approval before Priority 2.**

## Twenty numbered requirements
### 001 — Sisimiut (Greenland) shoreline access
Investigate the observed ~3.2 NM orange dotted unresolved connector with offshore separation disabled. Examine shoreline/harbour data, graph endpoint snapping, component connectivity and distance accounting. A completed route must reach legitimate mapped water access; no arbitrary offset or invented connection.

### 002 — Iqaluit/Frobisher Bay access
Investigate `ACCESS_TOO_DISTANT`, diagnostic guard, water-access coordinates, coastal coverage and connectivity. Retest the Northern Canada → Greenland → Iceland itinerary without altering the original saved project.

### 003 — LEFT PANEL LOCATION-card Contacts, Schedule, Details
Add expandable tabs to each LOCATION/WAYPOINT card in the LEFT PANEL, **not** the RIGHT PANEL. Leave RIGHT PANEL FIELD NOTES unchanged. Persistent contact database with user-defined categories, including docks, fuel, harbourmaster, customs, immigration, port agents, medical, pharmacy, chandlers, repair, provisioning, transport and accommodation. Records: organisation, person, role, category, address, region/country/postcode, phones, email, web, coordinates, hours and notes. Contacts can link to multiple waypoint records without duplication. Search/edit/import/export; offline-first; do not delete a contact merely on waypoint deletion. 
SCHEDULE: calculated vs planned vs confirmed arrival/departure, local appointments and time-zone correctness; recalculation cannot silently overwrite confirmed commitments. DETAILS: existing place metadata, coordinates and verified water-access point.
OPTIONAL Microsoft Graph integration for shared contacts and FWaS expedition/production calendars. Proposed `fw@fwas.us` is **not** assumed provisioned. Authenticate via supported OAuth and least-privilege permissions; no passwords in code. Publish prepared arrivals/departures **only with user approval**. Event update/cancel, remote IDs, duplicate prevention, conflicts, offline queue, CSV/vCard where supported; local operation must not depend on connectivity. Distinguish live authenticated tests from mocked tests.

### 004 — Lower Don → Sea of Azov
Resolve continuous connected water route via Rostov-on-Don, Don delta and Taganrog Bay. Manual intermediate user pins indicate deficient automatic junction discovery; general graph correction, not regional special case.

### 005 — Volga–Don Canal
Recognise Volga, connecting canal reaches, locks/basins, Tsimlyansk Reservoir, Don and Sea of Azov as traversable connected geographic graph when supported by verified data. Locks are connections, not automatically disconnected gaps. Regress using DON_RIVER_TRANSIT where available.

### 006 — Search-result markers on GLOBE-DISPLAY
On location-name search (offline or SEARCH ONLINE), overlay all matching results *within the existing visible viewport* as **simultaneously blinking bright green** markers; do not pan, rotate, centre or alter zoom. Markers and list items share exact geographic record IDs. **Double left-click** marker to SELECT its corresponding search result (no insertion); **right-click** → Add Selected Place; single-click must not select/add. On zoom-out while search active offer **SEARCH THIS AREA**; only after user accepts, rerun current query for expanded visible region without camera movement. Nonvisible matches remain in LEFT PANEL. Provide nonblinking highlight alternative. Do not regress successful SEARCH ONLINE behaviour.

### 007 — Map-pin crosshair
On `+ Place a map pin`, activate precision crosshair cursor and visible placement state over globe. Single click places pin at true WGS84 pick coordinate; ESC cancels, cursor restores after placement. Preserve navigation otherwise.

### 008 — Persistent waypoint selection and globe synchronisation
Selected LEFT PANEL card gets complementary-colour steady highlight; corresponding globe waypoint receives same-colour **blinking double-circle** marker. Never move globe camera merely on selection. Track by stable waypoint ID, **not queue number**. Selection persists through dragging, moving and renumbering until explicitly selecting another, deleting selected, or loading another project. Distinguish from green search-result markers.

### 009 — Shoreline access vs long dotted connectors
Correct inconsistent dotted endpoint lengths (including wide rivers/reservoir shores) caused by distant network vertices, different render/routing geometry, poor topology or source resolution. Snap to genuine closest *connected* water-access geometry; report actual unresolved separation; no fabricated corridor, fixed offset or misleading completed distance.

### 010 — Direct waypoint queue renumbering
Double-left-click number in upper-left of waypoint card; editable integer 1..N; ENTER moves waypoint to requested position, shifts intermediates, sequential renumber without duplicates, updates globe labels, marks plotted route stale, preserves selection by ID. ESC cancels; invalid number changes nothing. Retain drag-and-drop and Up/Down controls.

### 011 — Worldwide progressive high-resolution geography
Improve actual waterbody boundaries and widths, tributaries, islands, canal reaches/locks, reservoirs, estuaries, coastlines, and matching Cesium rendering. Source detail increases with zoom. Acquire/cache only relevant areas legally; avoid huge global downloads or memory loading; routing graph and displayed geography must align. Worldwide regression **12 systems**: Mississippi, Elbe, Nile, Volga (incl. Volga–Don), Congo, Mekong, Yellow River, Fraser, Great Lakes, St Lawrence, Amazon, **Paraná–Paraguay**. Paraná–Paraguay is an FWaS priority: Río de la Plata/Buenos Aires, Paraná Delta, Rosario, Santa Fe, Corrientes, confluence, Paraguay River and Asunción. Report actual data quality for each.

### 012 — Route preferences and defaults
Consolidate separate 'Soft Coastal Separation' checkbox/Custom distance into a single ROUTE PREFERENCE dropdown: **SHORTEST ROUTE (default)**; **OFFSHORE PREFERRED**; **CUSTOM OFFSHORE DISTANCE** (only then show preferred nautical-mile field). Initial default speed **6 kn**, distance **0 NM**, primary button **PLOT ROUTE**. The offshore preference is soft and must not create artificial terminal gaps. Existing project overrides remain unchanged after upgrades.

### 013 — Cartographic colour/readability and elevation
The uniform green land obscures geography at regional/local zoom. Implement the two P1 approved Cesium map styles above with light land, readable water channels, subtle actual terrain, roads/settlements, route legibility and zoom-dependent detail; allow map style choice via MAP LAYERS, separate from interface text palettes. New Orleans–Baton Rouge comparison is mandatory before continuing.

### 014 — Small-community discovery / upper Mississippi
No arbitrary population cutoff for valid towns/villages/settlements; improve search and disambiguation around Brainerd/upstream; retain online search and offline reuse. Distinguish 'place not found' from 'place found but water link missing'.

### 015 — Selective leg annotations
All leg distance/duration/ETA text annotations on GLOBE-DISPLAY **hidden by default**. Selecting waypoint in LEFT PANEL shows only its **incoming leg** text; all others stay hidden. First waypoint has no incoming leg. Preserve route, waypoint pins/numbers and left-card data. Correct selection association after reorder.

### 016 — Six interface colour palettes
SETTINGS → GLOBAL PREFERENCES → INTERFACE COLOUR SCHEME: ORIGINAL TEAL (default), ARCTIC BLUE, NAUTICAL IVORY, HIGH CONTRAST, SLATE & COPPER, CHARTROOM GREEN. Preview and apply instantly, globally persist across restarts/upgrades. Coordinate text, borders, controls, selection and tooltip colours while maintaining legibility. Geographic map palette is a separate MAP LAYERS choice.

### 017 — Global tooltips
SETTINGS → GLOBAL PREFERENCES → TOOL TIPS: ON **default**, OFF user selectable and persistent. Explain essentially every relevant control/field/icon/menu/status and map tool; ~500ms hover, keyboard focus, on-screen placement, style-aware text. Explanations describe action, not repeat label. Turning OFF must never suppress mandatory warnings, errors, progress or confirmations.

### 018 — Mekong/Tonlé Sap coverage
Fix regional shortcomings in Cambodia/Viet Nam: Mekong delta and branches, Cần Thơ, Ho Chi Minh City approaches, Phnom Penh, Longveak, Kratié, Tonlé Sap River and Lake. Data is visibly sparse; endpoint snapping and graph connectivity fail; user-added pins sometimes establish routing. ON/OFF coastal preference was tested with no observed difference. Regress with existing MEKONG_RIVER and TONLE_SAP_RIVER project copies if available. Persist validated acquisitions.

### 019 — User-definable PROJECTS folder
Default actual Windows Documents Known Folder → `NERDS\PROJECTS` (normally `C:\Users\<USERNAME>\Documents\NERDS\PROJECTS`; do not hardcode Clark or assume Documents isn't redirected). SETTINGS → GLOBAL PREFERENCES → PROJECTS DIRECTORY with BROWSE/create/write-check; Save/Open default here. Persist custom paths across upgrades. Offer **copy** of previous projects, preserving originals and never overwriting same-name files. Support local, external and accessible network paths. Projects folder is protected user data.

### 020 — Map-pin proximity and inconsistent leg connectivity
Instrument waypoint coords, snapped access coords, snap distance, source dataset/resolution, connected-component IDs, search boundary, candidate nodes, termination reason. User should not have to repeatedly place nearby pins to discover a real existing channel. Add **INSPECT CONNECTION** for unresolved legs with intelligible differentiators: coverage missing, disconnected topology, wrong snap, search exhaustion. Expand searches intelligently without inventing water edges.

## Additional approved route workflow — REVERSE ROUTE / ORIGINAL ROUTE
LEFT PANEL button initially **REVERSE ROUTE**. Ensure current project successfully SAVED first; if dirty/never saved, prompt Save Project/name/path with Cancel; no reversal if save fails. Store original waypoint order/IDs as a recoverable reference. Toggle reverses entire user waypoint sequence, renumbers, recomputes distances, duration and ETA in new direction, updates globe; button becomes **ORIGINAL ROUTE**. Toggling back restores stored original definition, **not reverse current mutated list**, and recalculates. Preserve all cards/contacts; changes while reversed must not silently overwrite original or confirmed appointments. Support Save As separate reversed project. Undo/recovery safe.

## Cross-cutting architecture and tests
Separate itinerary waypoint records from automatically generated geographic routing nodes. Route calculations use real geographic coordinates and valid known water network, not arbitrary line drawing. A water polygon is evidence of surface water, not automatically a valid graph connection; do not mark unverifiable passage complete. Computed voyage distances exclude genuinely unresolved geographic connectors and report them separately.

Use validated data provenance, resolution, attribution and licenses. Offline-first acquisition should record missing areas, fetch allowed sources on demand when online, validate/index/cache for future offline use; avoid re-downloading. Differentiate data missing vs not indexed vs not rendered vs disconnected graph vs no local access vs search-limit failure.

Preserve the v0.4.2 progress indicator for long operations (genuine progress when measurable, indeterminate otherwise; no invented percentages), original app project persistence, viewport behaviour, UI functionality, saved project regression fixtures and all existing passing tests.

Test source logic and **installed app** (UHD and normal desktop): map style switch, geographic LOD and offline caching, 12 regional corridors, 001/002/004/005/009/018/020 endpoint cases, city label right-click insertion, search marker double-click, simultaneous blinking, search-area expansion, crosshair pin, drag-and-drop, renumbering, persistent selection, reverse-save-toggle, selective leg text, new global preferences, project folders, contact DB, Microsoft 365 mocks/live distinction. Report PASSED/FAILED/DEFERRED accurately and identify geographic gaps. Do not modify user's original projects; use isolated verified copies.

## MSI and delivery rules
**ONE APPLICATION. ONE INSTALLED DEVELOPMENT TEST VERSION. ONE UPGRADE PATH.** v0.4.3 replaces v0.4.2 using existing verified major-upgrade identity and machine-wide elevation handling; do not side-by-side. Preserve original .nerds projects, project paths, settings, geographic databases/acquired data/caches, contacts and schedules. Use rollback-safe operations and isolated test copies. Test fresh installation, upgrade, app launch, project open/save/reopen and integrity. Report MSI absolute path, SHA-256, size, installed version, ProductCode, UpgradeCode, branch, commit, working tree, all tests and unresolved issues.

## User review and source-control policy
**CURRENTLY AUTHORISED: PRIORITY 1 ONLY.** Finish both New Orleans–Baton Rouge map demonstrations, supply source/resolution/offline-cache analysis and **STOP FOR USER APPROVAL**. Do not advance Priority 2 through 6 without approval. The other requirements are archived scope for later phases.

Do not alter SIOP autonomously. Do not delete user data, replace CesiumJS, fabricate waterways, create regional-specific shortcuts, push local CODEX commits to GitHub, or undertake unrelated refactoring without authorisation. This specification file may be archived in GitHub as explicitly requested by the user; that is not authorisation to push application code.

**MAP RESOLUTION FIRST. GEOGRAPHIC ACCURACY THROUGHOUT. ONE INSTALLED DEVELOPMENT TEST. ENGINEER, DO NOT PRAY.**
