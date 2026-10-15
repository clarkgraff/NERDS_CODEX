# NERDS v0.3.0

Navigation & Expedition Research Discovery Surveyor — © 2026 4nR TeK Inc. Created by Clark Graff.

Windows x64 expedition planning application with a bundled CesiumJS globe, worldwide offline place search, vessel preferences and preliminary water-aware routing. The MSI supplies the desktop runtime and map/search datasets; users do not need Node.js, Python, a browser, an AI model or an internet connection for core planning.

Development repository: **https://github.com/clarkgraff/NERDS_CODEX**. This release does not modify `clarkgraff/NERDS` or `clarkgraff/NERDS_COPILOT`.

## Scope and release evidence

The complete approved [Revision C Word scope](docs/scope/20261014_NERDS_Application_Scope_v0.2.1_RevC.docx) and its [amendment](docs/scope/20261014_NERDS_v0.2.1_RevC_Amendment.md) are retained. Revision C governs conflicts; the retained Revision B requirements and acceptance register are mapped in [the v0.3.0 test report](docs/TEST-REPORT-0.3.0.md). The scope document's original repository/version labels are historical; this release uses NERDS_CODEX and 0.3.0 as explicitly requested.

Read [release notes](RELEASE-NOTES-0.3.0.md), [data provenance](docs/DATA-SOURCES.md) and [optional exchange contract](docs/LAYER-EXCHANGE.md) for actual capabilities and boundaries.

## Using the application

- Fresh installations and File → New project open an empty 3D globe with **zero waypoints**. The old starter-city dataset and selector have been removed.
- Search the bundled 236,427-place index, select a result distinguished by country, region, coordinates and alternate names, then Add selected place. Search online is an explicit optional fallback. Smaller settlements may be absent offline. Results retain source IDs and provenance. GeoNames coordinates are documented place centres, not verified city halls; online municipal buildings are identified when returned by the source.
- Add exact manual coordinates or a map pin. Edit, delete, drag, or use up/down controls. IDs stay stable and map numbering follows itinerary order. Changing Start/Destination reorders the itinerary; its selectors are alphabetical, but the itinerary is not.
- PLOT ROUTE infers offshore access without requiring manual water-access fields. Teal segments follow the coarse water grid; gold dotted anchor connectors are excluded from marine distance and duration. The default is BY-SEA. BY-LAND and BY-AIR use their own nominal speeds and direct geographic estimates, not road networks or air-traffic flight plans.
- Each leg and the total compare the editable standard 6 kn reference against a calculated **nominal** case: sail 6 kn; diesel/electric 10 kn by default. Mixed leg propulsion sums segment times. Both cases show NM, duration and arrival with explicit zone/offset. Effective voyage SOG is distance divided by total time. Existing calculations update after changes to route inputs; alternatives and the selected result persist.
- Offshore Preferred uses a soft, approximate coast-distance penalty. Choose 5/10/25/50/100 NM or Custom; this does not guarantee a minimum clearance. Shortest Water is a comparison alternative. Unresolved depth, bridge, canal, restriction and hazard constraints are explicit.
- Departure defaults to creation date in UTC when a creation-location zone is unavailable. Time is 24-hour HH:mm with an IANA zone. Changing zone preserves the instant; changing local time changes the instant. Nonexistent DST times are rejected and repeated times require an earlier/later choice.
- Vessel preferences include identification, dimensions, units, independent propulsion selections, nominal speeds, hull-speed estimate/manual entry, allowances and assumptions. DONE saves the project vessel and a named reusable profile. CANCEL, Escape and X discard pending edits.
- Map layers independently enable roads, borders, time-zone reference polygons and optional externally supplied research hints. Roads become visible at regional zoom. Environmental point layers show supplied observation/analysis/forecast type, units and UTC valid time. No artificial weather data is bundled.
- GLOBE, MERCATOR and TILTED views, World, Fit and Focus remain available. Natural Earth 1:10 million coastlines provide crisp orientation graphics, not harbour detail.
- File → Save/Save As creates a named `.nerds` project. New/Open offers Save/Discard/Cancel. SQLite recovery saves locally; closing flushes pending saves. Project writes use a flushed temporary file and atomic rename. Media originals remain external references and do not travel with the project.
- Export KML/KMZ for Google Earth, GPX 1.1 research tracks/waypoints, or complete project JSON. Selected geometry, nominal times, provenance and limitations accompany exports. GPX never emits autopilot `<rte>` instructions. Device compatibility is not hardware-tested.
- Photo indexing retains source paths and available EXIF/GPS. Explicit permitted-image archiving records source, permission and checksum. The optional local 4nR-AI prototype requires a separately running loopback inference server; navigation never depends on it.
- Global preferences retain a configured company logo and storage paths. The header links to www.4nr.com. Without supplied official artwork, it displays company text. Folder changes take effect at restart and do not move existing data.

## Build and tests

Use Windows x64 and Node.js with `node:sqlite` support (Node 24 recommended). In PowerShell:

```powershell
npm.cmd ci
npm.cmd run setup:desktop
npm.cmd run prepare:data
npm.cmd test
npm.cmd run test:desktop
npm.cmd run package
```

Desktop tests additionally require `playwright-core` in the module search path (the build used the supplied workspace runtime through `NODE_PATH`). They use the actual Electron runtime, isolated `NERDS_DATA_DIR` folders and native file-dialog stubs; no browser download or production database is needed. Set `NERDS_TEST_EXECUTABLE` to the packaged `NERDS.exe` to repeat acceptance against the package. `npm run prepare:data` verifies/restores the offline SQLite index from its checked-in compressed copy. Packaging runs it automatically.

Output: `dist/NERDS-0.3.0-x64.msi`. The MSI is unsigned; no auto-updater is included. Electron, Cesium, data and dependency licenses ship with the application. Installer/About copyright names 4nR TeK Inc. and Clark Graff.

## Architecture and boundaries

NERDS and 4nR-SURVEYOR remain independent applications, databases and releases. Imported map hints are explicit snapshots with source references, not a shared writable research database. The renderer is sandboxed, context-isolated and denied remote content. A random-port loopback server supplies packaged resources. Only explicit main-process online place search or loopback AI calls use networking.

The sea graph uses Natural Earth land screening at 0.025° in Europe (-20° to 40° longitude, 40° to 70° latitude) and 0.1° globally. Diagonal corner cutting is blocked. Unresolved narrow waterways produce a detour or an error, never an automatic straight land crossing. City-to-water inference is an approximate offshore connection, **not a verified harbour or vessel-safe berth**.

Chart-constrained navigation, authoritative bathymetry/clearance, canals/locks, fuel optimisation, calibrated sailing polars and numerical forecast routing remain staged. BEST-TIME/BEST-EFFICIENCY/BEST-SAILING are saved objectives; their numerical optimisation is not delivered. Land routes are not road-network routes. Environmental rendering currently displays imported points; Earth-style particle fields, forecast-grid interpolation and automated environmental acquisition remain deferred. No bulk NOAA chart download is performed.

The installed application stores data in the per-user NERDS data folder shown in Settings. Existing data is retained. Close NERDS before copying its database directory for backup. Do not commit local databases, research archives, production media, model weights, credentials or installers to Git.
