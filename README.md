# NERDS v0.1.0

Navigation & Expedition Research Discovery Surveyor for Faire Wind & Song.

## Development status

Repository established. Application implementation is pending the packaging decision: a local browser application or a standalone desktop window. No application dependencies or model weights have been downloaded.

## Agreed architecture

- Offline-first CesiumJS geographic interface, with locally served assets and data.
- Editable, persistent waypoints with offline city lookup.
- GLOBE and MERCATOR display modes.
- ROUTE PLOT plus six selectable mission placeholders.
- Geographic demonstration connections must be labelled as such; these are not calculated marine routes.
- Replaceable local 4nR-AI inference API; numerical routing remains separate from the LLM.
- Configurable local database, cache, and archive paths; planned shipboard volumes are not assumed present.
- Photo metadata and source-file references; original production media remains on BRONTO-STOR.
- Replaceable data-source interfaces for future Store & Forward acquisition.

See DEVELOPMENT-BRIEF.md for the supplied requirements. Large datasets, media, model weights, credentials, and local configuration are excluded from version control.
