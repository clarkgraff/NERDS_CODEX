> Historical v0.1.0 report. See RELEASE-NOTES-0.2.0.md for the current release and its verification.

# NERDS v0.1.0 — development report

## Delivered functions

- Standalone Windows x64 desktop application and MSI packaging.
- CesiumJS 3D globe and Web Mercator display with bundled offline Natural Earth II imagery and ellipsoid terrain.
- Persistent editable waypoints: city lookup, map pins, coordinate/name editing, selection, ordering and removal.
- Initial Amsterdam → Emden → Hamburg → Kiel → Gdansk itinerary.
- Seven mission entries; ROUTE PLOT demonstration plus clearly marked research placeholders.
- Starting/destination selectors, local departure date/time, mission-speed preference, and right-click transport mode.
- Explicitly labelled geographic connections, with no claimed marine routing or calculated performance.
- Local SQLite storage, per-waypoint field notes, JSON export and configurable database/cache/archive folders.
- Referenced-photo indexing, EXIF/GPS extraction, geographic markers, source previews and metadata display. Original files are not automatically copied.
- Explicit permitted-image archiving with source URL, permission record and SHA-256 checksum.
- Replaceable OpenAI-compatible local inference endpoint, model-list connection test and test prompt interface.

## Verification

- Five core tests passed: city lookup, coordinate validation, persistence/empty-route handling, invalid-save protection, and local API endpoint restrictions.
- Actual Electron desktop tests passed in development and against the packaged executable: local map rendering, Mercator projection, waypoint add/edit/reorder/remove and pin placement, mission selection, saved preferences/notes after restart, synthetic-photo GPS extraction, no-GPS photo indexing, archive checksum/content preservation, JSON export, and local inference adapter behavior.
- External renderer fetches were blocked during testing. Map assets were served only from the bundled local resources; Internet connectivity was not physically disabled at the operating-system level.
- Local AI tests used a deterministic loopback mock server. A real model has not been downloaded or tested.
- The Electron runtime archive passed the SHA-256 checksum distributed with its npm package.
- The final MSI was opened read-only with Windows Installer: ProductName NERDS, ProductVersion 0.1.0.0, Manufacturer Faire Wind & Song, with per-user installation configured. Its size is 157,900,800 bytes. Its SHA-256 is `92FBBE6093E7FAA80B422F8CB52214176C738623B8F414DE3C1B3205E574841C`. Windows reports the installer as unsigned.

## Environment and downloads

The existing Git, Node.js/npm and Python installations were retained. PowerShell commands used `npm.cmd`. No Visual Studio Build Tools, Chocolatey, additional Python distribution, model weights, or large geographic dataset was installed.

Electron's Windows runtime download was 157,870,284 bytes. The installed dependency directory occupies approximately 606 MB. The existing workspace Playwright installation was reused for desktop testing. These are artifact sizes, not an independent measurement of total network transfer, which included package metadata and retries.

LM Studio and Lemonade were not detected in the checked command paths, common installation locations, or Windows uninstall registry entries. No inference engine was selected or installed.

## Known limitations

- This is a geographic demonstration, not marine navigation software. It has no route solver, bathymetry, tides, currents, forecasts, vessel performance model, fuel calculation or voyage ETA.
- The basemap is low-resolution and becomes blurry at close zoom. There are no detailed harbour charts, elevation data or satellite imagery.
- Offline lookup contains 15 approximate city centres. It is not a comprehensive world gazetteer or port database.
- Research missions other than ROUTE PLOT are placeholders. Structured research/acquisition tables prepare future work; a complete Store & Forward scheduler and provider system are not implemented.
- BRONTO-STOR integration is limited to preserving original-file references and available metadata. Timecode synchronization and automatic production-media matching are future work.
- The AI adapter supports loopback OpenAI-compatible endpoints without API authentication. Actual server/model compatibility remains to be tested after the user chooses an inference system.
- Changing the database folder does not migrate existing data. It takes effect on the next launch. Close the application before manually copying its data directory.
- The MSI and executable are unsigned development artifacts. The installer has not been installed into the user's normal Windows application environment as part of testing.

See README.md for build/run commands, usage and storage behavior.
