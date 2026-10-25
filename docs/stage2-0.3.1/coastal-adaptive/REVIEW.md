# Coastal preparation and bounded adaptive coverage checkpoint

25 October 2026. SIOP v1.0 Revision A; branch `codex/stage2-v031`; parent `156479ed67bb8ce0d64a78cbb4bcd5bc497a55d4`. Local checkpoint SHA is supplied in the completion message.

## Implemented and verified

The existing Shapely/GEOS preparer now classifies regional coastline faces using directed source edges: land on the left, water on the right. Geographic tile boundaries delimit the classification domain; they are not fabricated coastline. Interior open endpoints, branches, intersecting lines and contradictory face classifications produce UNRESOLVED evidence. Island land remains excluded. Explicit inland water can connect to coastal water without removing surrounding land exclusions. Accepted/rejected source records, timestamps and hashes remain in prepared packages.

Adjacent tiles connect only through mutually supported overlap. Tests verify forward/reverse geometry, island exclusions, coastal-to-estuary connections and unsupported-geometry rejection. Ocean-transition validation now also checks prepared land exclusions. Existing ocean-transition regression tests pass; no new authentic ocean-route coverage is claimed.

A bounded adaptive controller selects preparation resolution from actual source features and vertex counts, expands coverage in adjacent rings when assessment remains unresolved, prepares/reuses cached data and reassesses routes. Limits cover tiles, downloads, rounds, cell counts, elapsed time and cancellation. Dateline wrapping and polar bounds are tested for coverage enumeration. HTTP 403/406/429 stop automatic acquisition retries. Source providers remain injected adapters.

The desktop exposes this lifecycle through `geographicExpand` in an isolated worker. No new interface layout was introduced. New prepared evidence invalidates the active geographic course while retaining its archived variant and the unchanged USER PATH. Prepared-package identity includes tile key, bounds, source hash, algorithm revision and resolution: identical raw bytes for neighbouring tiles no longer collide. Finer compatible prepared data is reused.

## Standalone runtime

**Built, tested and integrated:** Windows x64 onedir processor at `work/preparation-runtime/nerds-geography/nerds-geography.exe`. It retains the approved Python algorithms instead of rewriting geometry operations. It includes CPython 3.12.14, Shapely 2.1.2/GEOS and NumPy 2.3.5. The executable ran from a separate temporary directory with no Python PATH, PYTHONPATH or development working directory. Multipolygon, hole and geometry outputs matched the reference preparer byte-for-byte.

Application preparation resolves the bundled processor; developer Python remains an optional explicit reference path. The packaging configuration copies the processor directory into resources. **No MSI or packaged Electron release was built or installed.** Clean-machine packaged-app acceptance remains outstanding.

The retained runtime directory is 64,257,695 bytes. Executable SHA-256: `cc50ce492ca00e9d3c9933adfb78608ccdc33c34f82d36ff2cdcc6d594c87b3a`. `runtime-manifest.json` records every file hash. Generated binaries remain locally under ignored `work/`; source, build recipe and manifest are committed. Future build/release environments must generate or supply this directory.

Rebuild using `scripts/build-geography-runtime.ps1 -Python <build-python.exe>` with PyInstaller 6.16.0 available under `work/preparation-build/deps`, Shapely 2.1.2 under `work/topology/python-deps`, and NumPy 2.3.5 in build Python. Dependency metadata and Python licensing accompany the processor. A fully isolated/pinned build environment and release signing remain future release work.

## Validation and performance

- Complete Node.js suite: **74 PASS, 0 FAIL, 0 skipped**; 21.66 seconds. `node-tests.txt`.
- Focused coastal/runtime/adaptive suite: **8 tests**; see `focused-tests.txt` for the final run after changing executable preparation to use a real temporary working directory compatible with packaged applications.
- Desktop: **6 PASS**, using isolated temporary USER data. `desktop.json`, `desktop-log.txt`, `desktop-adaptive-result.json`. Verifies actual cached-source preparation and routing in the desktop worker, tile identity separation, course invalidation, archive retention and restart persistence.
- Recorded synthetic preparation: approximately **527 ms**. Bidirectional adjacent-tile routing: approximately **159 ms**, after graph loading. These are small-fixture measurements, not worldwide benchmarks.
- Routing-process RSS reached approximately **2.83 GB**. This is a significant unresolved limitation of loading the existing combined graph; bounded new tile preparation does not solve it. Processor peak RSS was not measured separately.
- Historical itinerary reports and protected geographic assets were not overwritten or regenerated.

Commands: set `NERDS_PREPARATION_PYTHON` to the development reference Python, then run `node --test test/*.test.cjs`. For desktop, set `NODE_PATH` to the bundled Node dependency directory and run `node test/coastal-adaptive-desktop.cjs`. Standalone preparation itself does not use that Python variable.

## Live source outcome

**UNRESOLVED.** One bounded Overpass POST returned HTTP 406. A status GET also returned HTTP 406/nginx. One bounded query GET with explicit Accept and User-Agent headers timed out at 15 seconds. There were no repeated denial retries. Evidence is in `live-acquisition.json`, `provider-status.json` and `provider-diagnostic.json`.

Status-endpoint failure makes query formatting alone an insufficient explanation. Available evidence cannot identify whether the cause is provider filtering or an intervening network policy. No authentic geographic response was obtained; live preparation, neighbouring real-source consistency and live offline reuse are **not passed**. Fixture acquisition/cache/preparation/recovery tests remain separate evidence.

Provider documentation: [Overpass resource and usage guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html); [OSM coastline direction and processing](https://osmdata.openstreetmap.de/processing/coastline.html). Public Overpass is unsuitable as NERDS' production backend under its published guidance; deployment needs an appropriate provider arrangement or dedicated service.

## Remaining requirements and next dependency

- Dateline-crossing coastline segments are explicitly unresolved pending spherical partitioning. Polar coastline classification is not verified; coverage indexing alone is not polar routing support.
- No-coastline responses do not establish new ocean polygons. The existing Natural Earth baseline remains available. Missing coastline/source coverage is never completed by arbitrary line closure.
- Adaptive resolution currently selects a bounded raster resolution per tile. A hierarchical routing graph, selective sub-tile refinement and complexity-driven frontier selection remain incomplete. Expansion can exhaust its budget before a necessary detour is found.
- A worker watchdog bounds the desktop operation, but individual synchronous routing assessment is not cooperatively cancellable. Hard termination may leave a recoverable acquisition lock/job.
- Authentic online acquisition remains blocked by the observed provider failures. Fixture success is not a worldwide geographic acceptance result.
- WEATHER routing, full navigability/vessel validation and complete worldwide BY-WAY coverage are not delivered here.

**Next dependency:** reduce the routing graph's resident memory through indexed/on-demand loading, then implement spherical coastline partitioning and validate the provider-independent acquisition contract against an accessible suitable source. Preserve strict unresolved classifications throughout.

No remote Git operations, branch changes, SURVEYOR changes, Stage 3 work or MSI build occurred.
