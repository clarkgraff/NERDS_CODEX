# NERDS 0.3.0 acceptance report

Test date: 15 October 2026 (America/Los_Angeles). Windows x64. Electron 44.7.1; electron-builder 26.15.3. All development changes were made in `outputs/NERDS_CODEX`, branch `main`, with both origin URLs verified as `https://github.com/clarkgraff/NERDS_CODEX.git` before editing/committing. The sibling NERDS checkout remained clean at `b1b08d8f325351dd4704a309f4a1b303e71c90cf`; no commands wrote or pushed to NERDS_COPILOT.

## Automated and desktop evidence

- `node --test test/*.test.cjs`: **17 passed, 0 failed**. Tests cover worldwide search, coordinates, SQLite recovery, invalid-write protection, atomic project roundtrip, vessel validation/clearances, distances, water-grid land avoidance, exports, UTC/DST/date-line handling, automatic city-anchor passages, mixed propulsion, transport modes, layer validation and online request/cache behavior.
- `node test/desktop.cjs`: **14 workflow groups passed**, zero renderer errors. Actual Electron windows, input controls, mouse dragging and local persistence were exercised. Native open/save dialogs use deterministic file paths; no production project/database is touched.
- Development and MSI-extracted application runs are recorded in `docs/verification/`. The isolated restart checks retain source coordinates, stable IDs, vessel, logo, storage, IANA zone, selected non-default route alternative, media references and imported layers.
- Live optional Nominatim lookup for `Ucluelet British Columbia Canada` returned Ucluelet, Canada, source `https://www.openstreetmap.org/relation/7845720`. The automated online test also checks request identification and response caching. Continued third-party service availability is not guaranteed.
- Representative offline places: Tokyo, Nairobi, Sydney, Lima, Lisbon and Gdańsk. Disambiguation includes country/admin region and alternate names. Lookup test budget is 2 seconds per query; the complete test suite finished below one second on this machine.
- Passage tests: Amsterdam → Emden → Hamburg → Kiel → Gdańsk and Lisbon → Casablanca, with no manually assigned access. The Kiel/Hamburg case goes around Denmark instead of drawing through mapped land. Available coastline: Natural Earth 1:10m; mask 0.025° Europe / 0.1° global. Chart depth/bridges/restrictions are unavailable and explicitly unresolved. The tests validate coarse grid screening, not safe navigation.

## Revision B acceptance register retained under Revision C

| Finding | Result | Evidence / boundary |
|---|---|---|
| AF-001 Logo | Passed | Imported test image, CANCEL discarded, DONE saved, header and restart retained. Official owner artwork remains configurable. |
| AF-002 Modes | Passed | BY-SEA default; BY-LAND/BY-AIR select and recalculate with mode-specific speeds. Land/air are direct planning estimates. |
| AF-003 Empty project | Passed | Fresh database and File New have zero waypoints, no starter selector and no route. |
| AF-004 Worldwide lookup | Passed | Six-continent representative queries, disambiguated selection, no manual water-access prerequisite; live connected fallback returned a result. Coverage is not every settlement. |
| AF-005 Alphabetisation | Passed | Search names and applicable selectors sorted; itinerary remains user-ordered. |
| AF-006 Departure/time | Passed | Creation-date UTC fallback, explicit IANA offset, 24-hour fields, zone changes preserve instant, DST ambiguity/gap and date line tests. |
| AF-007 Roads | Passed | Independent setting; generated regional tile differs from other layers. |
| AF-008 Borders | Passed | Independent setting and rendered boundary tiles. |
| AF-009 Time zones | Passed | Independent reference-polygon layer. Static offsets are not legal/DST authority. |
| AF-010 Music hints | Passed | Explicit external fixture import renders; music off removes its entity independently. |
| AF-011 Cuisine hints | Passed | Imported cuisine layer rendered with optional source metadata. |
| AF-012 Culture hints | Passed | Imported culture layer rendered with optional source metadata. |
| AF-013 All hints | Passed | All-hints controls supported research categories; environmental visibility remains independent. |
| AF-014 Vessel | Passed | DONE writes full vessel/profile; CANCEL/X discard; project/restart retains vessel and propulsion. |
| AF-015 Drag | Passed | Physical mouse drag, stable IDs, map numbering and automatic route recalculation. |
| AF-016 Project save | Passed | Save/new/open/restart, non-default alternative, complete route/layers/zone/vessel/media; atomic-write unit test. |
| AF-017 Assistant | Passed | DONE/CANCEL controls persist only committed preferences; core works without model/server. |
| AF-018 Storage | Passed | Folder/logo draft selections discarded by CANCEL/X and committed by DONE. |
| AF-019 Plot route | Passed | City anchors calculate automatic connectors and marine legs; connector lengths excluded, paired estimates and map geometry shown. |

## Revision C additions

All three creation methods are exercised: selected worldwide result, exact manual coordinates and map pin. Rename/reorder/save/close/restart preserve the three methods' IDs and exact coordinates. Waypoint source identifiers and overrides survive project validation. The full supplied Word file was copied verbatim; SHA-256 `b039817d1ebcccacd6cf29dc1cb7ffba76c1a0e8e91eacdf19e89a68c7c08406` matches the supplied source.

## Installer verification

The MSI administrative installation extracts into an isolated workspace folder and is followed by the desktop acceptance suite against that extracted `NERDS.exe`. This validates the installer payload, offline place database, assets and executable without replacing the user's existing installation. See `docs/verification/installer.json` for final MSI filename, size, SHA-256, metadata and administrative-install result.

MSI metadata: ProductName NERDS; ProductVersion 0.3.0.0 (application/package 0.3.0); Manufacturer 4nR TeK Inc.; x64/1033; retained UpgradeCode `{783B0CA6-2B2E-5B36-9790-CF364ACE0057}`. Copyright and Clark Graff authorship are present in ARPCOMMENTS and the installer notice dialog. The package is unsigned.

## Unverified or deferred requirements

- A normal interactive per-user installation, upgrade of the user's installed 0.2.0, shortcut launch and uninstall/rollback cycle were **not performed**. Administrative installation is not claimed as that full lifecycle test.
- The OS network adapter was not disabled. Offline tests deny external renderer requests and use exclusively bundled resources; an unplugged-machine test remains unverified.
- No official chart depth, bridge/canal/lock, reef/shoal, restricted-area or tidal clearance validation. These are typed unresolved constraints, not safety approvals. Bathymetry and selective chart ingestion remain staged.
- No calibrated forecast optimisation, fuel/sailing performance solver, gridded environmental interpolation or Earth-style particle animation. Imported environmental points and timestamps are implemented; numerical objectives and advanced rendering remain deferred. No Earth code is copied.
- No chartplotter/autohelm hardware interoperability, code signing or distribution upgrade certification.
- Store & Forward currently supports explicit checksummed layer snapshots and permitted-image archiving; a provider acquisition scheduler and automated dataset refresh are not implemented.

These limitations are shown/documented as such. Passing the acceptance register does not mean chart-constrained navigation or every future phase of the Word scope has been delivered.
