# Data provenance and updating

All bundled geographic data is an orientation/planning source, not a navigational chart.

| Dataset | Coverage / resolution | Source and license | Offline |
|---|---|---|---|
| Place index | 236,427 populated places (>500 residents or administrative seats), plus Natural Earth named places | GeoNames cities500, countryInfo and admin1CodesASCII; CC BY 4.0. Natural Earth names: public domain. | Bundled SQLite, 116,207,616 bytes; compressed Git input 48,817,552 bytes |
| Coastlines / routing mask | Natural Earth 1:10m; routing 0.025° Europe, 0.1° globally | Natural Earth public domain | Bundled; no depth claims |
| Roads | Natural Earth 1:10m roads; not a routing network | Natural Earth public domain | Bundled GeoJSON; regional zoom |
| National borders | Natural Earth 1:10m administrative boundary lines | Natural Earth public domain | Bundled |
| Time zones | Reference polygons with nominal UTC offsets, not live legal/DST boundaries | Natural Earth public domain | Bundled; project clocks use runtime IANA data |
| Optional online places | OpenStreetMap source features, accuracy not certified | OpenStreetMap contributors, ODbL; Nominatim public service policy | Explicit searches only; results cached locally |
| Imported hints/environment | User-supplied coordinates, resolution, valid time and coverage | Source and license required; file SHA-256 retained | Explicit imported snapshots |

Snapshot inputs were acquired 14 October 2026 (Pacific time). `assets/gazetteer-manifest.json` records the acquisition/build time, input hashes and raw database SHA-256. Names and aliases are indexed with SQLite FTS5; search is case/diacritic-insensitive and alphabetically disambiguated. Source identifiers remain on waypoints after manual override.

GeoNames: https://download.geonames.org/export/dump/ ; https://www.geonames.org/export/ ; https://creativecommons.org/licenses/by/4.0/

Natural Earth files: https://github.com/nvkelso/natural-earth-vector/tree/master/geojson — `ne_10m_roads.geojson`, `ne_10m_admin_0_boundary_lines_land.geojson`, `ne_10m_time_zones.geojson`, `ne_10m_geography_regions_points.geojson`. Terms: https://www.naturalearthdata.com/about/terms-of-use/ . Raw layer checksums are recorded in `docs/layer-checksums.json`.

## Reproducible restoration and deliberate updates

Normal builds run `npm run prepare:data` to restore and verify the checked-in compressed database without downloading geography. To update, download GeoNames `cities500.zip`, `countryInfo.txt`, `admin1CodesASCII.txt` and Natural Earth named-place GeoJSON (as `places.geojson`) to `work/downloads`, inspect source licenses/coverage, then run `python scripts/build-gazetteer.py`. Review the new manifest, commit the compressed artifact and run worldwide lookup and desktop tests. The rebuild script regenerates the complete index; it does not mutate users' saved coordinates.

Review gazetteer and base-layer releases quarterly, and update deliberately after testing; no automatic download scheduler ships. Preserve source attribution and hashes. For roads/borders/timezones replace the corresponding `assets/layers/` file and regenerate checksums after source review. Existing project coordinates and imported evidence should be explicitly refreshed, not silently re-geocoded.

Nominatim calls occur only from Search online (never autocomplete), use a descriptive User-Agent, enforce 1.1 seconds between uncached calls, cache results and permit a replacement HTTPS endpoint in Settings. See https://operations.osmfoundation.org/policies/nominatim/ . No bulk queries are performed.

No bathymetry or official chart corpus is bundled. Those are independent future data layers; coarse coastline avoidance cannot establish clearance. No NOAA bulk download occurred. No Cameron Beccario Earth code is reused: the current renderer uses Cesium labelled environmental points; gridded/vector-field interpolation and particle animation are deferred rather than simulated.
