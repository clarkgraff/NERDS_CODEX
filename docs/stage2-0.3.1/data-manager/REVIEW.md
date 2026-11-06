# Geographic data manager and USER PATH foundation

25 October 2026 — implements the 24 October continuation directive under SIOP v1.0 Revision A.

Branch: `codex/stage2-v031`. Parent approved topology checkpoint: `a91e18819e55ac63cca4876e41e287db04796429`. This document and its accompanying files form the new local development checkpoint; its commit SHA is reported in the chat after commit.

## Implemented and integrated

- Arbitrary WGS84 itinerary coverage planning, including dateline wrapping, configurable tile size and explicit coverage budgets. This is a bounded discovery corridor, not a guarantee that every possible detour or polar passage is covered.
- Explicit online acquisition through an OpenStreetMap Overpass adapter, with bounded retries, timeouts and response sizes. Source timestamps, attribution, licensing, SHA-256 and acquisition attempts are retained. Empty or incomplete evidence never proves a route.
- Persistent content-addressed source cache, versioned inventories, offline reuse, corruption rejection, interrupted-job recovery and rollback to verified source versions. Recovery retries incomplete requests; it does not resume partial response bytes.
- Generic polygon preparation reuses the approved ring/hole algorithm in an isolated cache directory. Original bundled assets are unchanged. Prepared packages include masks, exclusions, source geometries, accepted/rejected feature records and exact mapped waterway vertices.
- Prepared packages are verified and discovered by the runtime topology loader during explicit refinement. Dynamic waterway vertices join only at identical coordinates; waterway/area and overlapping-area transitions require supported geographic segments. Open coastline ways are retained as raw evidence but never closed into invented ocean polygons.
- Multiple prepared resolutions can coexist; the finest active resolution per source tile is selected. Failed catalogue registration leaves the previous catalogue intact. Rollback removes superseded packages from active discovery without deleting retained files.
- Coverage inspection distinguishes missing source, validated source, prepared/indexable geometry, intersecting bundled water-area packages and connectivity still awaiting route verification. An intersecting package does not imply complete tile coverage.
- USER PATH has persistent identity, ordered waypoint identities, content revisions and prior revision snapshots. Course variants remain separate. Path edits invalidate stale active routes, while newly calculated routes identify their matching path revision and survive a combined save.
- Direct WGS84 geodesic COARSE calculations are unrestricted intent geometry, explicitly not water connectivity. BY-SEA defaults to 6 knots under BYPASS. The desktop API archives these results and settings independently of existing legacy routing calculations.

## Validation

- Complete Node.js unit/regression suite: **66 PASS, 0 FAIL, 0 skipped**, 21.38 seconds in the recorded run. See `node-tests.txt`.
- New isolated desktop acceptance: **4 PASS**. See `desktop.json` and `desktop-log.txt`. No installed application or real USER project was used.
- Synthetic end-to-end test proves first acquisition, source validation, polygon preparation, actual runtime area-to-river routing, exact reverse geometry, offline restart/reuse, finer-resolution selection, failed-registration preservation and rollback.
- Existing unit tests also exercise island exclusions, invalid geometry, source-to-ocean transitions, WGS84 accounting, independent legs and historical route preservation. The full historical geographic itinerary campaign was not rerun; **no new worldwide PASS/UNRESOLVED totals are claimed**.
- Initial broader validation exposed stale-route invalidation rejecting freshly calculated results. Matching path revisions fixed this. A direct-engine return-visit fixture also reused a place ID; its legacy calculation remains supported without inventing persistent waypoint identities. Saved USER PATHs still require unique waypoint IDs.
- The initial failure log and initial focused logs remain preserved. The final complete-suite log is authoritative for this checkpoint.

Commands, from repository root (PowerShell):

```powershell
$env:NERDS_PREPARATION_PYTHON='C:\Users\Clark\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
node --test test/*.test.cjs
$env:NODE_PATH='C:\Users\Clark\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node test/geographic-manager-desktop.cjs
```

The preparation test requires development Python with Shapely; missing dependencies are a test failure, not a skipped PASS.

## Development entry point

`node scripts/geographic-cache.cjs request.json` accepts `cacheDirectory`, arbitrary `points` (`lat`, `lon`), optional `coverage` (`degrees`, `maxTiles`), explicit `online`, `prepare`, `python`, `resolution` and `recover`. It processes the bounded coverage sequentially, retains per-tile errors, and registers verified prepared packages. Online defaults to false. Use the application's configured data directory plus `geography` to make prepared results available to its next refinement worker.

Preparation is development tooling, not an installed-app promise: the Python processor is not bundled into an MSI. The existing waypoint editor and map-pin tool have not been replaced.

## Limitations and next dependency

This is a tested integration foundation, not worldwide navigable coverage or Stage 2 completion. The live Overpass service was not contacted in these tests; transport and provider responses were controlled fixtures. Real service availability, throttling and large-region performance remain unverified. Supported-provider availability does not guarantee data exists at a requested location.

The selected corridor can miss long detours. Dense polar geometry and automatic adaptive refinement need further evaluation. Preparation rejects oversized cell budgets rather than allocating unbounded grids. Finer cached resolution is supported; automatic adaptive subdivision and a hierarchical routing search are not yet implemented. Finest available raster resolution cannot exceed the source's actual geographic accuracy.

Ocean routing still uses the approved Natural Earth coarse masks. Arbitrarily downloaded coastline lines do not yet form a validated global ocean/coast package. Mapped line source conflicts are rejected instead of silently choosing a version. USER-facing source management/preparation controls, background scheduling, atomic multi-package acquisition and general update policy remain incomplete.

Recommended next increment: validate an extensible coastline/ocean source-preparation contract and bounded adaptive coverage expansion, then expose the acquisition/preparation lifecycle in the approved interface. Preserve separate geographic connectivity and future vessel suitability decisions.

## Registered subsequent feature

Optional Geographic & Maritime Discovery for map pins remains planned: a USER toggle; jurisdiction, EEZ, protected/restricted-area identification; source and effective date; explicit unknowns; preservation of USER-assigned names. No such discovery interface or operational-mode feature is implemented in this checkpoint.

No GitHub operations, branch changes, MSI packaging, Stage 3 work or SURVEYOR changes were performed. Approved geographic datasets and historical topology evidence remain unchanged.
