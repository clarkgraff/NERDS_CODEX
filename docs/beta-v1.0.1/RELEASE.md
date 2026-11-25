# NERDS Beta v1.0.1 — executable delivery

Built from the existing codex/beta-v1.0.0 working tree, preserving checkpoint 9ebe3a48627e67fbb0ab8bf51e81cff08b079f2f and unrelated historical records. New changes remain local. No installed application was replaced.

## Implemented
- Local OSM Denmark/Sweden coastlines and flowlines converted into a hash-verified 0.002-degree water-area package. Directed coastlines classify water/land; holes and exclusions remain blocked. Spatial edge indexing removes the previous preparation bottleneck. Original PBFs are untouched.
- CHEKOV compares supported detailed geography against coarse routing, preserves the original geometry/evidence, and rejects coarse segments that contradict prepared land exclusions. Ocean transitions use connected boundary portals rather than an immediate coarse-grid attachment inside a narrow passage.
- Exact operator water coordinates are retained on the selected grid; a coarser global mask no longer forces an offshore displacement. Named reference, operator coordinate, actual marine endpoint and remaining transfer are distinct. Unresolved transfers remain visible and excluded from vessel passage accounting.
- GEBCO regional research-context sampling, bounds 9–16 E / 53–60 N, native 15-arcsecond grid, SHA-256 verified. Samples do not establish charted clearance or safe navigation. GEBCO's terms exclude navigation/safety-at-sea use: https://www.gebco.net/data-products/gridded-bathymetry/terms-of-use
- Per-leg project/session diagnostics appended to route-diagnostics/legs.jsonl without truncating historical records.
- Curve-preserving de Casteljau insertion, independent CTRL tangent movement, undo/redo, saved endpoint controls, original-course comparison and magenta USER PATH preservation.
- WAYPOINT LABELS now updates the current preference object after state replacement and persists through project reopen; marker coordinates and calculated geometry are unchanged by the toggle.
- Operator-supplied logo converted to multi-size Windows icon and installer bitmap assets. Executable resource branding verified visually.

## Verification
- Full Node suite: 122 PASS / 0 FAIL. The final land-exclusion guard subsequently passed four affected endpoint/coastal tests.
- Actual packaged executable: Bézier double-click, CTRL-drag (opposite unchanged and selected handle moved), undo/redo, recalculation preservation, save/reopen, restart, label OFF persistence, exact marker/polyline positions in Globe/Mercator/Tilted, and visible access gaps.
- Offshore/manual-water Oresund–Halmstad regression preserves exact endpoints, forward/reverse geometry and WGS84 distance.
- Protected operator projects: all 20 match prior SHA-256 and byte-size evidence. Tests use isolated temporary application data and project files.
- Final packaged marine checks: 9 calculated geometries, 2 unresolved routes. The final portable executable launched successfully, reported Beta v1.0.1 and rendered Cesium. Evidence is retained in this directory and work/beta101; delivery.json records the executable checksum.

## Remaining limitations
- Named destinations still require unresolved city-to-water transfers: Helsingborg approximately 0.383 NM, Halmstad 0.963 NM, Aarhus 1.770 NM, Gothenburg 14.422 NM. These are not represented as verified navigable connections.
- Gothenburg–Oslo and Kiel–Szczecin remain unresolved with current integrated coverage. The newly extracted Skagerrak source is retained separately but is not adopted into this release.
- GEBCO integration is regional research context, not global chart validation. Tide, vertical-datum uncertainty, bridges, channel clearance, current restrictions and reliable under-keel clearance remain unresolved.
- NOAA ENC, Netherlands/Germany S-57, EMODnet archives and Baltic port packages are inventoried but not operational chart/clearance adapters. Some downloaded geographic feature responses are empty. Disk presence is not integration.
- This delivery is a portable executable and matching unpacked application, not an installed upgrade or a newly validated MSI. Installer branding assets are prepared; installed Beta remains untouched. Executables are unsigned.

