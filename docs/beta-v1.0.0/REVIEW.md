# NERDS Beta v1.0.0 corrective source checkpoint

Checkpoint prepared 16 November 2026. Test logs were recovered from the completed pre-interruption runs; they were not represented as newly rerun tests. Source syntax, Git whitespace checks and operator-project hashes were verified again on resumption.

Workspace: `C:\Users\Clark\Documents\Codex\2026-10-13\ar\outputs\NERDS_CODEX`.
Branch: `codex/beta-v1.0.0`, created with operator approval from `a1f160c96616bc815b7514884c05e0a403629b88`.
The commit containing this report is the Beta source checkpoint. Its parent is the committed v0.4.7 source. `b0e4e18` retains the v0.4.6 comparison source. Installed v0.4.7 was not changed. No MSI was built, no installation was performed and nothing was pushed.

## Requirement status

| Requirement | Implementation and evidence | Remaining limits |
|---|---|---|
| State recovery / protection | PASS: working tree preserved; source version 1.0.0; 20 central project hashes and sizes unchanged | Historical v0.4.4/v0.4.6 records deliberately remain outside this implementation commit |
| Independent CHEKOV scheduler | PASS for tested queue behavior: persistent per-leg results, viewport/FOCUS priority, cancellation, retry, deadlines and dependency conflict checks | Job completion is not proof of navigability; prospective viewport corridors use geodesic estimates until route geometry exists |
| ERROR & STATUS | PASS: persistent history, original error messages, per-leg inspection/cancel/retry, copy/export controls | History bounded to 2,000 events, 300 displayed rows; very large diagnostic payloads are summarized |
| PROJECT FILES DIRECTORY | PASS: configured directory, Windows browser, persistence, explicit copying with SHA-256/size verification, collision rejection, save/reopen | Actual MSI-upgrade preservation is NOT TESTED in this increment; upgrades remain prohibited pending authorization |
| MAP-001, MAP-007 | PASS in desktop regression: retained satellite provider survives switching and MAP LAYERS → DONE; camera preserved | Live provider availability is external |
| MAP-002 | PASS in tested display: combined mode renders transparent cartographic overlays above satellite | Missing source tiles remain missing; this is not a worldwide coverage claim |
| MAP-005 | PASS: zoom/pan/projection checks, bounded retries, controlled request-failure reporting and explicit RETRY MAP TILES recovery | Long-duration worldwide stress testing remains outstanding |
| MAP-006 | Completed source comparison: v0.4.6 refreshBasemap removed all imagery layers; later retained references could point to destroyed layers. Refresh now replaces only its own basemap | Historical installed v0.4.6 was not reinstalled |
| MAP-003, MAP-004 | PASS classification tests: 314 source ferry features, including 26 tagged Road with Ferry Route type, are independently filtered; overview, detailed and local paths updated | Visual ferry coverage depends on actual source features and zoom |
| UI-001 | PASS: existing upper-left display indicator replaced with dropdown; loading/error state shown; MARINE CHARTS disabled as unavailable | Marine rendering intentionally not implemented |
| SEARCH-001 | PASS for tested viewport ranking; globe horizon and projected screen visibility are used | Ranking operates on returned source candidates; it does not query all worldwide records spatially before the existing lookup limit |
| SEARCH-002 | PASS feature-ranking tests; uses actual feature classifications, preserves worldwide fallback | Harbour/airport/city-hall availability varies; no invented features or automatic coordinate substitutions |
| SEARCH-003 | Existing operator coordinates remain distinct from routing attachments; saved custom coordinates survive restart/reopen | Exact previously relocated wharf fixtures not supplied, so those specific observations remain UNRESOLVED |
| UI-003 | PASS list/ring synchronization and camera preservation tests | Search highlight remains separate from saved waypoint selection |
| UI-002 | PASS collapsed-header delete and undo with 167-card fixture; metadata/order retained | Undo deletion is session-local and limited to the most recent deletion |
| ROUTE-001 | PARTIAL: geometry, WGS84 distances, attachment consistency and access-gap diagnostics checked; gaps not counted as completed connections | Gothenburg, Oslo and other geographic deficiencies remain UNRESOLVED; no fabricated joins introduced |
| ROUTE-002 | PASS: edited USER PATH takes display precedence; original geometry retained separately for explicit comparison; custom geometry survives save/restart/reopen | Edited geometry remains USER_DEFINED_UNVERIFIED until supported refinement is accepted |
| Marine handoff | Reviewed summary/requirements for compatibility; bathymetry, imagery and topology remain separate | GEBCO/EMODnet rasters need a display/analysis adapter; S-57 archives need decoding; MBTiles need format/CRS validation and a tile adapter. Source audit claims were not independently rerun. No marine integration begun |

## Executed validation

- `npm test`, with `NERDS_PREPARATION_PYTHON` set to `work/beta-test-python/Scripts/python.exe`: **112 PASS, 0 FAIL**, approximately 50.8 seconds. See `beta-commit-unit.log`.
- `node test/beta-corrections.cjs`: PASS, actual Esri image tile received; repeated modes, Layers DONE, camera, viewport search/ring, 167-card delete/undo and edited-path comparison. See `beta-commit-desktop.log`.
- `node test/beta-desktop.cjs`: PASS, directory browser/copy/conflict, saved results, persistent status and edited USER PATH save/restart/reopen. See `beta-commit-persistence.log`.
- `node test/beta-imagery.cjs`: PASS, actual satellite display through GLOBE/MERCATOR/TILTED, zoom/pan, a deliberately injected transient network failure, retry and combined ordering. Fault injection is a simulated failure; imagery delivery itself was live.
- `node test/beta-viewport.cjs`: PASS, crossing segments with endpoints outside viewport, dateline, polar view and FOCUS preserving camera.
- `node test/v047-workflow.cjs`: PASS, proposal rejection preserves preliminary route and episode filtering preserves itinerary.
- `node test/beta-season-three.cjs`: original project read into isolated temporary application data; 167 waypoints / 166 legs processed in 87.1 seconds; 844 UI timer ticks. **74 calculated geometries, 92 unresolved legs**. Including unverified endpoint transfers: **6 COMPLETE jobs, 160 UNRESOLVED jobs**. This is not 166 accepted geographic routes.
- `node test/beta-geographic-regressions.cjs`: seven named-location fixtures, 17 legs, **16 calculated geometries / 1 unresolved geometry**. Endpoint transfers remain separately unresolved. Full source evidence is retained in `work/beta-geographic-regressions.json`; the review summary is included here.

The Shapely issue had two causes: missing isolated dependencies and a legacy vendored path taking precedence over the configured environment. Installed Shapely/NumPy only in the isolated environment and adjusted import precedence. The remaining reference test compared platform-dependent gzip bytes; it now compares exact decompressed mask/geometry contents. The final complete suite passed.

## Geographic findings requiring further work

- Hamburg → Cuxhaven → Kiel → Gothenburg → Oslo: first three legs produced geometry; Gothenburg → Oslo remains ACCESS_TOO_DISTANT. Gothenburg's unverified attachment is 14.422 NM. Kiel → Gothenburg calculated-water geometry is 202.164 NM, excluding that transfer.
- Rostock → Stralsund: 54.625 NM calculated-water geometry, with 0.286 / 9.230 NM endpoint gaps. The exact operator Rostock–Stralsund–Rügen itinerary/relocated wharf coordinates were not found among the central project fixtures and remain unverified.
- Helsingborg → Halmstad still produces a 285.791 NM detour and a 13.307 NM endpoint gap. The Øresund deficiency is not resolved by this checkpoint.
- Tallinn → Helsinki retains 3.053 / 10.950 NM gaps. Turku, Vaasa, Luleå, Oulu and Karlskrona also retain unverified endpoint separation. See geographic-summary.json.
- Source coverage/topology and actual harbour access require further geographic work; these results must not be presented as complete navigable voyages or vessel-suitability determinations.

## Preservation, acceptance and next action

No operator projects were moved, copied, migrated or overwritten. Explicit-copy tests used temporary fixtures. All 20 central project files match the recorded SHA-256 and size inventory. No ROAD/OCEAN geographic datasets were rebuilt. BIG BATCH 020/021 operations were not controlled or modified. SURVEYOR was not modified.

Source inventory: `changed-files.txt`. Raw acquisition files, large geographic outputs, Python environment and existing installers remain in place outside this commit.

Ready for operator review of the corrected source application, not a release-completion claim. Operator acceptance is still needed for presentation and workflow. Geographic gaps listed above, exact relocated fixtures, long-duration stress testing, marine integration and separately authorized installer/upgrade validation remain outstanding. No MSI or push is authorized by this checkpoint.
