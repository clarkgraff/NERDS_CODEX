# NERDS v0.1.0

**Navigation & Expedition Research Discovery Surveyor** — Faire Wind & Song.

A Windows desktop application with a bundled offline CesiumJS globe. The installer target is an x64 `.msi`; the installed application runs as `NERDS.exe`. Electron supplies the desktop runtime, so users do not need Node.js or Python to run the installed application.

## Development

Use the existing Node.js installation. In PowerShell, use `npm.cmd`:

```powershell
npm.cmd ci
npm.cmd run setup:desktop
npm.cmd start
npm.cmd test
npm.cmd run test:desktop
npm.cmd run package
```

The desktop test additionally requires `playwright-core` (tested with 1.62.1), available via `NODE_PATH` from an existing workspace runtime or installed separately as a development test tool. It reuses Electron and does not download a separate browser. The initial build reused the workspace's bundled copy to minimize downloads.

The installer is written to `dist/NERDS-0.1.0-x64.msi`. Development builds are unsigned. Signing and distribution are separate future work. No auto-updater, online mapping provider, inference server, or model downloader is included.

## Interface

- **WAYPOINTS:** add by city name, edit names/coordinates, reorder, remove, select, or place a map pin. The first waypoint is the starting location and the last is the destination; changing either selector reorders the itinerary.
- **Offline lookup:** a bundled 15-city starter list, including Amsterdam → Emden → Hamburg → Kiel → Gdansk. These are approximate city centres, not port entrances. Unknown cities require a map pin or coordinates. A comprehensive gazetteer is future work.
- **Geography:** GLOBE and Web MERCATOR views use the bundled low-resolution Cesium Natural Earth II basemap and ellipsoid terrain. There are no online tiles or detailed marine charts.
- **MISSION:** ROUTE PLOT is functional as a geographic demonstration. MUSIC, CUISINE, CULTURE, HISTORY, ARCHITECTURE, and TBD are explicit placeholders.
- **ROUTE PLOT:** departure date/time (the computer's local time), speed preference, and transport mode are saved. Right-click the map to select BY-SEA, BY-ROAD, or BY-AIR.
- **Field notes:** select a waypoint and enter research notes; changes save locally.
- **Photographs:** index JPEG, TIFF, PNG, or WebP source files and available EXIF/GPS metadata. GPS locations appear as amber markers. Non-geotagged images still appear in the index. Originals remain in place; unavailable/removable media retain their references. JPEG/PNG/WebP previews are supported when the source remains accessible.
- **Archive:** open an indexed external-service image, supply its source URL and reuse permission, and explicitly confirm retention. NERDS copies it to the configured archive, records SHA-256 and provenance, and does not automatically duplicate production media.
- **4nR-AI:** the assistant panel accepts a loopback OpenAI-compatible API base URL. Test `/models`, then send a short test prompt to `/chat/completions`. Run your preferred inference server separately. API authentication and remote/LAN inference are not implemented in this version.
- **Export expedition:** writes an explicit JSON export of the itinerary and indexed media metadata. This export includes original source paths. Export is not a full database backup or an import/migration tool.

**Dashed connections show geographic waypoint order. They can cross land and are not calculated marine routes.** Preferences do not calculate passage times, fuel use, sailing suitability, weather, currents, tides, sea state, clearance, or vessel performance. Those require a separate numerical routing engine and validated datasets.

## Storage

Default database: Electron's per-user NERDS application-data directory, in `data/nerds.sqlite`. The app's **Settings** panel displays the exact paths and lets you choose database, cache, and archive directories. Planned AI-CACHE and AI-ARCHIVE volumes are not required.

Changing the database folder takes effect on the next launch and opens that folder's database. It does not move the old database. To back up or relocate a complete database, close NERDS first and copy the data directory. `NERDS_DATA_DIR` overrides the database folder for development and isolated tests.

SQLite stores the itinerary, notes, preferences, media/source references and metadata. Separate `research` and `acquisitions` tables reserve structured research and Store & Forward provenance. The complete acquisition scheduler, provider integrations, checksummed download pipeline, production timecode matching, and BRONTO-STOR integration are not implemented.

The renderer can only load local application resources. An internal server binds only to 127.0.0.1 on a random port and uses a per-launch unguessable resource path. It is hosted inside NERDS; no separate server setup or browser window is required. Network access to the local inference API is an explicit main-process operation. No external geographic service is a runtime dependency. Cesium's bundled codecs and embedded workers require generated JavaScript, WebAssembly, and blob scripts; the renderer remains sandboxed, without Node access, remote scripts, or remote fetches.

## Architecture

- `src/main.cjs`: desktop lifecycle, loopback resource server, constrained IPC, file dialogs, EXIF import, local inference adapter, manual permitted-image archiving.
- `src/preload.cjs`: narrow bridge into a sandboxed, context-isolated renderer.
- `src/core.cjs`: validation, offline gazetteer lookup, SQLite persistence, local endpoint validation.
- `src/public/`: desktop interface and Cesium visualization.
- `assets/cities.json`: small hand-entered demonstration gazetteer; values are approximate WGS84 city centres.
- `test/`: core tests and actual Electron end-to-end tests. The AI test uses a local mock, not a real model. Photo tests use synthetic EXIF/GPS fixtures.

Credentials, local databases, caches, research archives, production media, model weights, dependency directories, and installers are excluded from Git. See `DEVELOPMENT-BRIEF.md` for the supplied requirements.

## Implementation references

- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Cesium Viewer options](https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html)
- [electron-builder MSI packaging](https://www.electron.build/msi.html)

Bundled dependencies retain their respective licenses and attribution. Cesium's credit display is preserved. The local map is an orientation aid, not a navigational chart.
