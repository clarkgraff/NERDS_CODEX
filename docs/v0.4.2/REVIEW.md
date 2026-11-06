# NERDS 0.4.2 development-test delivery — 27 October 2026

Branch: codex/stage2-v031. Baseline: 4f752fddd1565751707646e17d9d5ffdef2a6915. Local delivery commit is the commit containing this report (no remote operations).

## Delivered

Verified OSM water-area polygons, islands and holes now reach the globe renderer through a checksum-verified local endpoint. Regional packages and prepared cache coverage are used; centreline rivers are visibly references, not invented widths. Natural Earth remains generalized context. This is not worldwide high-resolution coverage.

Offline lookup runs in a reusable worker. Real asynchronous operations drive a delayed, indeterminate globe progress indicator. Displayed city labels offer Add Selected Place using their original coordinates/source record, with no automatic recalculation. PLOT ROUTE is restored. WGS84 authoritative geometry remains independent of presentation. Unverified endpoint transfer lengths are separate from vessel passage distance and suppress a claimed complete-expedition total.

The MSI uses the established 0.4.1 upgrade family and machine-wide scope. The original per-user packaging attempt was corrected after Windows skipped the machine-wide predecessor. That temporary installation was removed using Windows Installer. The final elevated MSI installation returned 0 and removed 0.4.1. Windows inventory now contains exactly one Development Test product: 0.4.2.0, installed in C:\Program Files\NERDS Development Test. Production NERDS 0.3.0 remains separately registered. The legacy 0.4.0 family is in the upgrade table but was absent during final testing.

## Preservation

The final upgrade preserved the Development Test config, SQLite database and diagnostic file byte-for-byte relative to the immediate pre-upgrade snapshot. Installed startup loaded every existing config field, including custom paths and logo. AMAZON_V1.nerds (21 waypoints) and NORTHERN_CANADA_GREENLAND.nerds (15 waypoints) retain their original SHA-256 hashes. Isolated copies both opened, saved and reopened with identical state in installed 0.4.2. Original files were not saved by these tests.

Important qualification: the separate production database in AppData/Roaming/nerds changed during this work window. Its current session references ST_LAWRENCE_RIVER.nerds rather than the earlier unsaved Pacific itinerary. Its config hash remains unchanged. The cause is not established; do not claim byte-for-byte production-session preservation. Neither state was overwritten to reconcile the difference. The earlier database backup remains in work/upgrade-backup-be818ac1-8d81-43cf-9f4a-ffb44b7c06a7. See production-settings-preservation.json and production-database-comparison.json.

## Validation

- npm test: 82 PASS, 0 FAIL, 0 skipped; NERDS_PREPARATION_PYTHON points to bundled development test runtime.
- node --test test/integration042.test.cjs after final packaging configuration change: 3 PASS.
- Installed node test/v042-upgrade.cjs: 3 PASS groups (settings, two real project copies).
- Installed node test/v042-ui.cjs: 4 PASS groups. Actual Manaus lookup 12ms; controlled 8-second delayed lookup remained responsive, displayed real pending/completed state, then cleared.
- Installed node test/v042-ui-regression.cjs: 7 PASS groups, including UHD, panels, labels, dragging, BY-AIR and restart.
- Installed node test/v042-course-regression.cjs: 5 PASS groups: offline polygon preparation, island avoidance, authoritative Cesium correspondence, save/restart and cache reuse. Maximum angular coordinate error 7.11e-15 degrees.
- node scripts/regression-v042.cjs: 10 geographic PASS, 2 UNRESOLVED, 0 FAIL across six Amazon itineraries in both directions. Atlantic/Amazon-estuary/Manaus remains unresolved. These PASS outcomes validate supported water geometry, not complete endpoint transfers.
- Hawaii Lihue/Honolulu/Hilo supported water geometry passes the existing geographic validator, but END-TO-END ACCESS IS UNRESOLVED: 303.659 NM vessel passage plus 62.482 NM unverified connector geometry. The latter is excluded; completeExpeditionNM is null. Do not present this as successful harbour-to-harbour routing.
- Initial source UI test selected a hidden same-name Portugal entity; the test was corrected to use the visible Brazilian city and passed in source and installed app.
- Initial installer scope failure fixed; final installation successful. Repair validation DEFERRED because Windows elevation was cancelled. Full machine-wide rollback-after-removal validation DEFERRED: unelevated attempt failed on administrator permission before reaching injected failure. Earlier per-user injected-failure test is not evidence of successful machine-wide rollback.
- Fresh-machine installation, absent legacy 0.4.0 upgrade, full worldwide geographic rerun: NOT TESTED in this delivery. No presumed PASS.

Installed desktop tests use NERDS_TEST_EXE=C:\Program Files\NERDS Development Test\NERDS Development Test.exe and isolated NERDS_DATA_DIR except the read-only default-settings startup check. Evidence JSON and screenshots are in this directory. Detailed MSI logs remain work/v042-elevated-install.log and work/v042-machine-install.log.

## Sources and limits

Existing OSM source provenance, license and geometry SHA-256 remain in water-area manifests; no new speculative geographic connections were introduced. OSM ODbL attribution and Natural Earth public-domain attribution remain available. Source timestamps and limitations travel with display descriptors. Seasonal JRC surface-water observations were evaluated, not incorporated as navigability evidence (https://global-surface-water.appspot.com/download and /faq). Neither seasonal observations nor missing connections establish vessel access or depth.

The installer retains the bundled offline seed gazetteer; the expanded multi-gigabyte worldwide index is not bundled. Detailed coastline/water-area coverage remains regional. Live Overpass access and a SURVEYOR acquisition bridge are not delivered. No AI runtime/SURVEYOR repository changes. Development installer is unsigned. No worldwide navigability claim.

## Installer

See installer.json for ProductCode, UpgradeCode, size and SHA-256. Artifact: dist/NERDS-0.4.2-x64.msi (271096993 bytes). Installed application reports 0.4.2. No pushes, merges, rebases or branch switches.

Ready for interactive Development Test evaluation with the above geographic and installer-test limitations, not for unrestricted navigational use.
