# Approved Priority 1 checkpoint — 28 October 2026

User approved Detailed Terrain with Simplified NERDS lightness. This combination is now the default; existing explicit map-style selections are retained. Source-rendered geometry and real elevation-derived hillshading remain independent of route coordinates and accounting. Online display acquisition remains opt-in; cached detail is reused offline and missing display tiles retain the overview.

Evidence: combo/compare-terrain.png; combo/preview-tests.json; offline-restart.json; worldwide-display.json. Full Node suite: 85 passing tests. Final cache/default focused suite: 5 passing tests. Offline restart: 87 detail tiles, zero downloads and zero gaps. The comparison uses USER PATH, not a calculated connected-water route. Terrain is hillshaded imagery, not a raised elevation mesh. Polar areas beyond Web Mercator retain the baseline. Source resolution and completeness vary.

Sources: OpenFreeMap OpenMapTiles/OpenStreetMap vectors (20261025 build); Tilezen/Mapzen Terrarium elevation. Provider permissions: https://openfreemap.org/ (bounded offline downloads, maximum four concurrent requests, 3000 tiles/50 MB); https://registry.opendata.aws/terrain-tiles/ ; attribution https://github.com/tilezen/joerd/blob/master/docs/attribution.md . Source URL, ETag, acquisition time and SHA-256 are retained per cached tile. Display tiles are not routing evidence.

No installed application or original USER project was modified by the preview. No GitHub operations. Priority 2 authorised separately after visual approval.
