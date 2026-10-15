# Optional external layer exchange, version 1

NERDS never opens a SURVEYOR database or requires its process. A user explicitly imports JSON in Map layers. The importer validates metadata and point coordinates, computes SHA-256 of the supplied file and stores a project snapshot on DONE; CANCEL/X discards the pending import. External research source URLs are references, never executable instructions.

Input is `{ "layers": [ ... ] }` or a single layer. Each layer requires:

- `schemaVersion: 1`, stable `id`, `name`, `source`, `license`, `kind`, and `points`.
- `kind`: MUSIC, CUISINE, CULTURE, HISTORY, ARCHITECTURE, WIND, CURRENT, WAVES, WEATHER or TIDE.
- `coverage` and `resolution` describe supplied data; omitted values display as unknown/supplied-points-only.
- Environmental kinds require `dataType` observation/analysis/forecast, an ISO timestamp `validAt` with zone, and `units`. This is a valid-time marker, not an assertion of current accuracy. `importedAt` is generated on import.
- Optional `timeWindow` carries a source-declared research relevance window, e.g. `{ "startUTC": "2026-10-15T00:00:00Z", "endUTC": "2026-10-16T00:00:00Z" }`. It is retained metadata; no temporal clipping or routing inference is performed.
- Points require numeric WGS84 `lat`/`lon`; optional `label`, `value`, `direction` (degrees supplied by source), `waypointId`, `routeId` and `source` reference the originating finding. Values/directions are displayed as supplied, not interpolated into a forecast grid.

Limit: 100 layers, 10,000 points per layer, 20 MB import file. Unsupported versions/kinds and malformed environmental metadata are rejected. No plugin code, scripts or remote media are executed.

Example (illustrative only; not included in new projects):

```json
{"schemaVersion":1,"id":"finding-123","name":"Referenced music finding","kind":"MUSIC","source":"https://example.org/finding/123","license":"Permission supplied by owner","coverage":"One referenced point","resolution":"Source coordinates","points":[{"lat":52.37,"lon":4.89,"label":"Source finding","waypointId":"stable-project-waypoint-id","routeId":null}]}
```

Export expedition → JSON writes the version 2 NERDS project snapshot. `state.projectId`, `waypoints[].id`, lat/lon/provenance, `departureUTC`, `timeZone`, `route.id`, `route.selectedId`, route leg UTC arrivals, and `externalLayers` are available to a separate consumer. It contains media path references rather than originals. `route.alternatives` preserves candidate geometry; connectors are explicitly excluded from passage accounting. A consumer must check `format: NERDS` and `schemaVersion: 2`, handle unknown optional fields, and must not treat preliminary geometry as navigational approval.

This is a file boundary only. No SURVEYOR runtime integration, shared database or local API service is delivered. Route-generated IDs identify one calculation; stable waypoint IDs identify itinerary locations across recalculation.
