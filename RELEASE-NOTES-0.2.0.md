# NERDS v0.2.0 — release notes

© 2026 4nR TeK Inc. All rights reserved. Created by Clark Graff.

## Delivered

- Fresh databases and new projects open on a full 3D globe with zero waypoints. Existing saved data is retained.
- File menu: New, Open, Save and Save As for .nerds project files, with filename in the header and unsaved-change indicator. Local recovery remains enabled; New/Open protect unsaved edits with Save/Discard/Cancel.
- Vessel preferences, reusable profiles, optional image, metric/imperial conversions and optional displacement-monohull hull-speed estimate using waterline length.
- Drag individual waypoints before/after another waypoint, with up/down alternatives. Map numbering updates immediately. Existing route calculations automatically rerun after a drag; other geometry changes clear stale results until Calculate is pressed.
- Offline vector-derived Natural Earth coastlines, improved display resolution, Globe/Mercator/Tilted views, World/Fit/Focus controls. Fit includes all computed route points.
- Explicit water-access editing and optional unverified offshore suggestions. Dotted connectors link cities to access points.
- Experimental numerical offshore outlines avoid the bundled land mask rather than drawing city-to-city lines across land. Calculations show each leg's nautical miles/time and final totals using entered cruising speed. Supplied access limits reject known vessel-dimension mismatches.
- KML/KMZ Google Earth exports, GPX 1.1 waypoint exports, and JSON research exports. Experimental route lines are deliberately excluded from autopilot exchange.
- Installer publisher/copyright/creator information, a software-information installer page, About information, bundled third-party notices, top-right company name and website link, and official-logo import.
- Previous photo indexing, source references, field notes, manual permitted-image archiving and local inference API interface retained.

## Scope limits

This is research software, not a marine navigation system. Routing uses a 0.025-degree land grid in the European rectangle and 0.1-degree grid elsewhere, derived from 1:10-million Natural Earth polygons. It does not resolve hydrographic clearance, charted hazards, tides, bridge openings, traffic restrictions, canals or safe harbour approaches. Small disconnected pockets are excluded; some narrow passages or regional-boundary routes fail. An offshore candidate is not automatically a suitable harbour for the vessel. Accurate vessel-aware marine routing remains future work.

Three starter entries use current city-hall coordinates; Emden and Gdansk are labelled historic town halls. Remaining starter cities use approximate centres. Global city/body-of-water search remains future work.

No official 4nR TeK artwork was supplied. The company-name fallback and import control are available. Local AI requires a separately installed server and model; neither is bundled. Plotter hardware and Google Earth Pro imports have not been tested on those actual applications/devices. The Windows installer is unsigned. No installation into the user's normal Windows environment was performed.

## Verification

- 10 core/feature tests: persistence, coordinate validation, invalid-save protection, endpoint restrictions, transactional project roundtrip and rollback, vessel units and limits, known distance/time values, a water path around Denmark, XML escaping and KMZ container structure.
- Electron desktop workflow tests: empty startup, city lookup, pins, edits, drag ordering, map numbering, all three views, saved profiles, project saving/opening/cancellation, export files, photo GPS extraction, original-file retention, explicit archive copy, local mock AI and persistence after restart.
- Separate water workflow: access editor/suggestions, paths around Denmark, map entities, drag-triggered recalculation, final totals and rejection of supplied insufficient water depth.
- Renderer remote fetches are denied. Internet was not disabled at the operating-system level. Local AI was tested against a mock server, not a downloaded model.
- MSI metadata inspected read-only: NERDS 0.2.0.0, Manufacturer 4nR TeK Inc., per-user installation flags, stable UpgradeCode and creator/copyright notice present. Executable metadata also contains version, company and copyright.

The v0.1.0 installer remains available separately. This version does not erase an existing workspace; use File → New project for a blank expedition.

## Final artifact

- File: dist/NERDS-0.2.0-x64.msi
- Size: 160,333,824 bytes (approximately 160 MB).
- SHA-256: E85E0C87515DFB0AC43DE2AE204BA64AB14B57C3256DFED70FFEF7518FD37CF3
- Final packaged executable passed both desktop suites after the framing and display-resolution fixes.
- Upgrade identity matches v0.1.0; Windows installation/upgrade itself was not executed.
