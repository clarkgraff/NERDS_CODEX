# NERDS 0.3.0 release notes

Release date: 15 October 2026. Development and source delivery: clarkgraff/NERDS_CODEX.

## Implemented

- Replaced the hardcoded starter cities with an attributed, indexed offline gazetteer containing 236,427 worldwide places, plus explicit cached/rate-limited online fallback.
- Empty fresh projects; search, exact map-pin and manual-coordinate creation; stable IDs, source/alternate-name preservation, edits and drag order.
- Automatic offshore connectors and preliminary water-aware paths from place anchors. Connectors are excluded from passage totals. Soft offshore preference and shortest-water alternative persist with geometry and provenance.
- Independent sail/diesel/electric vessel modes, allowances, nominal speeds, complete vessel save/reopen, reusable profiles and draft dialog semantics.
- Adjacent standard/nominal passage estimates for each leg and total, effective SOG, mixed-mode time integration, automatic recalculation and explicit UTC/IANA handling including DST ambiguity.
- Independent roads, borders, time-zone reference and external hint layers; versioned environmental point inputs with provenance, units and valid time.
- DONE/CANCEL/X behavior for vessel, global, map and assistant preferences. Configured logo persists in the header.
- Project schema 2, backward reading of schema 1, flushed atomic project writes, preserved media references and saved selected route alternatives.
- KML/KMZ route geometry and GPX research tracks with nominal UTC timestamps, source/validation information. No autopilot route output.
- Bundled Windows x64 desktop runtime and offline data; package/application version 0.3.0.

## Validation and open limits

See `docs/TEST-REPORT-0.3.0.md` for the 19-item acceptance register, automated results and installer checks. The Word specification is retained verbatim under `docs/scope/`.

This remains preliminary expedition planning. Bathymetry, official chart restrictions, verified harbour approaches/canals, forecast-driven optimisation, calibrated vessel response and Earth-style environmental animation are not implemented. Environmental import is a point-layer interface, not a forecast solver. Objective selectors retain preferences without pretending to optimise unsupported data. City halls are not automatically discovered in the offline dataset; documented centres are used with explicit provenance as Revision C permits.

The offline gazetteer does not contain every village or feature. Time-zone polygons are static reference geography; IANA rules govern project clocks. BY-LAND is a direct geographic estimate, not road routing. Official company artwork must be configured by its owner. MSI signing, physical chartplotter/autohelm interoperability and a real machine upgrade/uninstall cycle are not verified. Windows administrative installation and extracted-application testing are reported separately from an interactive per-user installation.
