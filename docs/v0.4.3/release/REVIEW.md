# NERDS v0.4.3 Development Test — 29 October 2026

## Delivery and installation
- MSI: dist/NERDS-0.4.3-x64.msi; 271,215,777 bytes.
- SHA-256: D1CF17C5326573031335A3EBD06AA5D2533CC032ACCE22C6FA350BB74AA61C96
- ProductName: NERDS Development Test; MSI ProductVersion 0.4.3.0; application version 0.4.3.
- ProductCode: {00E91494-6E9D-46A8-A307-4440F6CEE8CB}.
- UpgradeCode: {9156D92F-9DA5-530D-9BCD-D9DDAD09009B}; unchanged, ALLUSERS=1.
- In-place upgrade from 0.4.2 returned MSI exit code 0. Exactly one Development Test registration remains, version 0.4.3.0.
- Installed executable: C:/Program Files/NERDS Development Test/NERDS Development Test.exe.
- Installed app.asar source files match the current source byte-for-byte. Required Cesium, GeographicLib, vector-tile, PBF and PNG dependencies present.
- No fresh-install VM or deliberate rollback-failure test was performed. Installer is unsigned.

## Executed validation
- 88 Node tests PASS, 0 FAIL (work/v043-final-unit.txt). The historical optional-separation fixture now explicitly selects OFFSHORE PREFERRED, because new projects correctly default to SHORTEST ROUTE.
- 9 source desktop groups and 9 packaged desktop groups PASS.
- 11 actual installed desktop groups PASS: launch, stable selection/camera, incoming-leg labels, queue renumbering, reverse-save cancellation and restore, preferences, contact creation, offset-aware confirmed schedule, details display, restart persistence, keyboard-focus tooltip, UHD/normal layout (grouped in installed-desktop.json).
- Both installed map styles: 87 cached detail tiles, zero missing tiles, zero elevation gaps, zero downloads. offline-map-tests.json records actual status; packaged-simple.png and packaged-terrain.png were captured from the installed executable in the final run.
- Actual installed configuration loaded existing custom paths/logo/settings unchanged. Isolated copies of AMAZON_V1 and NORTHERN_CANADA_GREENLAND opened, saved and reopened with identical state (upgrade-project-tests.json).
- Source-compatible WGS84 plotting was exercised through BY-AIR reversal tests. Existing 101.3252879103003 NM Mississippi water-course evidence is retained in ../priority2; not rerun during packaging. Endpoint transfers remain 0.6066741769039674 and 0.49226287028363963 NM, unverified.

## Preservation
Seven original Documents/*.nerds project files, both application config files, production NERDS.exe and production app.asar retain their pre-install SHA-256 hashes (preservation-after.json). Production registration remains 0.3.0.0. Production data/cache/archive size/mtime inventory unchanged. Development Test recovery database timestamps changed on launch; stored existing fields, waypoints and media/research/acquisition counts were preserved (recovery-migration.json). This is not a claim that every file on the workstation was inventoried. Backups are retained under work/v043-preinstall-backup. Tests edited isolated copies only. No GitHub pushes or remote branch changes.

## Implemented in this increment
- Approved terrain/light-palette combination retained as default; explicit saved map preferences preserved.
- Default shortest routing and 6 kn reference speed; consolidated preference selector and conditional custom distance field; legacy saved preference values retained.
- Selection stays on stable waypoint IDs without camera motion; double-circle selected marker; incoming-leg annotation only.
- Direct number editing with bounds checks and cancellation; existing reorder controls retained.
- Saved-original reverse workflow, cancellation protection and route recalculation; original records retained in project state.
- Six selectable interface palettes, persistent tooltip/blink preferences and delayed focus/hover tooltip overlay.
- Configurable Windows Documents-based project directory, directory picker/write check, optional non-overwriting project copying; original files retained.
- Local project contact records with shared waypoint links, editing and search; LEFT PANEL CONTACTS/SCHEDULE/DETAILS; UTC-offset timestamps and independent confirmed commitments. Right-panel notes unchanged.
- Crosshair placement with single-click insertion. Viewport-filtered synchronous search markers and double-click selection; existing right-click insertion preserved.
- INSPECT CONNECTION exposes existing source/termination evidence for unresolved legs. Timeout no longer instructs users to compensate with manual pins.

## Incomplete, deferred or unverified — not accepted as complete
- Worldwide hydrographic population, endpoint corrections, live Overpass/USGS troubleshooting and NHDPlus downloads explicitly deferred by USER. No new geographic claims.
- General direct-download/local-import hydrography adapters and automatic coverage acquisition remain incomplete. Existing bounded cache/preparation architecture retained. Long-corridor coverage budget limitations remain.
- SEARCH THIS AREA expansion is not implemented. Search marker visibility updates on result rendering/redraw rather than continuously on every camera move. This interaction still needs completion and dedicated acceptance testing.
- Contacts are project-local, not a cross-project shared address book. CSV/vCard interchange, Microsoft Graph OAuth/sync/offline queue/conflict management are not implemented. No Microsoft account or live integration tested.
- Schedule UI accepts explicit-offset ISO timestamps; appointments are free text, not structured calendar events. No automatic timezone inference for appointments.
- Tooltip coverage uses existing titles/labels as fallback and does not yet provide full explanatory text for every control. All six palette combinations and every map annotation colour have not received full contrast acceptance testing.
- Project-directory copy/collision workflow implemented but not exercised in the installed acceptance run. New pin insertion, all search gestures and existing drag/drop were not independently retested in that run.
- All twelve worldwide waterway corridors were not rerun for release; prior evidence remains historical. Navigation clearance, complete worldwide water access and weather routing are not certified.

This is a functioning installed Development Test ready for USER evaluation, not completion of the entire v0.4.3 master specification.
