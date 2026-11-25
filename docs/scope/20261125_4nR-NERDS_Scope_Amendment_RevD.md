# 4nR-NERDS — SCOPE AMENDMENT, REVISION D
## Beta Marine Charts, CRONKITE Discovery Waypoints, UI and Data Controls

**Date:** 25 November 2026
**Status:** Approved functional requirements; implementation and acceptance evidence must be verified separately.
**Application:** 4nR-NERDS
**Canonical working repository:** `C:\DATA_DRIVE\GITHUB\NERDS_CODEX`
**Document type:** Additive approved-requirements amendment; not a rewrite or replacement of the historic master.

## D0 — Authority, precedence and historical preservation

1. Preserve all original NERDS master SCOPE, SIOP, Rev B, Rev C, v0.4.3 development master and subsequent approved directives as historical documents. This amendment supersedes only direct contradictions concerning **current beta** marine-chart scope and explicitly updated UI and CRONKITE functionality.
2. Earlier exploratory descriptions of automated vessel-depth, overhead-clearance or chart-derived navigation are **not current beta acceptance requirements**. Their absence must not block the current beta.
3. Do not equate a written requirement with an implemented feature. Record test results and any incomplete implementation accurately.
4. A later-approved requirement takes precedence over an older conflicting statement; all unrelated requirements remain in force.
5. The newest local Codex source must be preserved and inspected; a remote historical branch is not proof that the most recent work was pushed.

## D1 — MARINE CHARTS: required display and user judgement

**This is a display/reference requirement, not an automated route-validity requirement.**

1. Provide a selectable **MARINE CHARTS** map display control, **OFF by default**. Clearly indicate ON/OFF state.
2. Display actual chart data in the geographically correct location, including charted features where present: depth contours, individual soundings, navigational aids, shorelines and associated hydrographic information.
3. Allow the user to pan, zoom and examine available marine-chart coverage while planning and editing a route, without breaking existing Cesium cartographic/satellite map choices, waypoints and USER PATH.
4. Display appropriate dataset attribution, chart coverage boundaries, edition/source information and data limitations where available. Never depict absent chart coverage as complete.
5. Preserve existing waypoint placement, drag/edit, route plotting and route display.
6. **Users determine whether proposed routes are viable.** NERDS must not automatically reject, redirect, alter or prohibit a route based on charted depths, bridge clearance, mast height, vessel draft or other chart-derived clearance criteria.
7. **Automated chart-aware navigation, clearance evaluation and vessel-specific chart-constrained routing are explicitly OUT OF SCOPE for this beta.** Do not add them as hidden prerequisites to chart display or beta acceptance.
8. Existing source-data/import work may parse S-57 ENC base cells and updates, including metadata for depths, soundings and bridges. Parsing or loading alone does not satisfy the marine-chart *display* requirement; verify visible chart features and interactivity in the packaged beta.
9. Retain chart-data provenance, format and licence/redistribution restrictions. Public bathymetry, OpenStreetMap waterways and charted depths are research/display inputs, not independent certification of safe passage.

**Vessel context (for records and possible later phases only):** *The Faire Wind* has draft **4.21 m** and air draft **30 m**. Neither value creates a current-beta automatic chart-clearance constraint.

## D2 — CRONKITE Discovery Waypoint Integration

**Status:** Approved functional requirement; live transport and packaging acceptance to be verified.
**Boundary:** CRONKITE discovers and transmits; NERDS receives and manages; the human user decides.

### D2.1 Waypoint reception

When NERDS receives a valid CRONKITE discovery through the CRONKITE `SEND TO NERDS` command:

1. Create a new waypoint from the supplied geographic coordinates.
2. Place the waypoint at the **TOP of the current waypoint list** regardless of existing waypoint order.
3. Identify the source as `4nR-CRONKITE`.
4. Set initial status to `AWAITING APPROVAL`.
5. Preserve the original discovery ID, event name, category, date/time, description and source references wherever supplied.

### D2.2 Visual identification

1. Pending CRONKITE waypoints must **flash yellow-orange at 1 Hz** (one complete cycle each second).
2. Display the caution indication on both the **map marker** and the **waypoint list entry**.
3. Show readable `AWAITING APPROVAL` text.
4. Distinguish yellow-orange pending discoveries from existing **red CHEKOV navigational warning `!`** markers.
5. Maintain readable colours and states in all supported interface palettes, including light and dark modes.

### D2.3 Route protection

While `AWAITING APPROVAL`:

1. The discovery may appear in the visible list but **MUST NOT participate in route calculations**.
2. It must not change route geometry or active sequencing.
3. It must not cause automatic route recalculation.
4. Its presence does not constitute navigational approval.
5. A waypoint's **display/list position**, **approval state** and **route participation** are distinct properties. This remains true after reordering, saving or reopening.

### D2.4 Context-menu functions

**APPROVE WAYPOINT**

- Change status to approved.
- Stop yellow-orange flashing and apply standard NERDS waypoint styling.
- Make the approved waypoint **eligible** for normal routing, without silently altering an existing plotted route. Route calculation must follow the normal user-controlled workflow, including explicit `PLOT ROUTE` when applicable.

**REJECT WAYPOINT**

- Remove the pending waypoint from the list and map.
- Preserve all existing approved waypoints and route geometry.

**DRAG AND DROP**

- Allow pending waypoints to be moved to any position in the visible list.
- Reordering does not imply approval and does not change route participation while pending.

### D2.5 Transfer integrity

1. Retain the original CRONKITE discovery identifier and all available provenance.
2. Detect repeated transfers of the same discovery and prevent uncontrolled duplication.
3. Validate latitude, longitude and required identity fields.
4. Reject malformed transfers safely and report failures without corrupting waypoint/route state.
5. Persist pending status and metadata across supported save/reopen/restart operations.
6. Define an inbound data contract and explicit accepted/duplicate/invalid/error outcomes before selecting a production transport mechanism.
7. Do not duplicate CRONKITE news/research/discovery engines in NERDS. Neither application's core functionality may require the other to be running.

### D2.6 Ownership boundaries

- **4nR-CRONKITE:** Event/discovery generation, selection, research metadata and initiating `SEND TO NERDS`.
- **4nR-NERDS:** Reception, validation, list insertion, map marker, source/status presentation, list movement, approval/rejection, data persistence, duplicate handling and explicit routing eligibility.

### D2.7 Acceptance tests

All of the following require evidence, not just implementation claims:

- A valid discovery appears at list position one and on the map with matching source and readable pending status.
- Both caution indications flash yellow-orange at 1 Hz and remain distinct from CHEKOV warnings.
- Pending discoveries are excluded from active routing even after drag/reorder, save/reopen and refresh.
- No automatic route modification or calculation occurs on reception, reordering or mere approval.
- Approve, reject, deduplicate and malformed-transfer paths work without damaging existing route/waypoint state.
- Persistence and all existing routing/regression tests pass.
- Live CRONKITE → NERDS transfer must be reported separately from a local simulated discovery inbox; **a working inbox does not prove the live interface is complete**.

## D3 — User interface and route presentation: retained approved controls

1. **EDIT USER PATH** when idle; **EDITING USER PATH** while active, flashing green at approximately 1 Hz. Do not add a redundant `+`.
2. **PLACE MAP PIN** when idle; **PLACING MAP PIN** while active, flashing green at approximately 1 Hz. Remove the redundant `+`.
3. **ENTER MAP COORDINATES** opens the existing coordinate dialog without a redundant `+`.
4. **ORIGINAL / REVERSE ROUTE** is a mutually exclusive route-direction toggle with the current selected state clearly highlighted yellow. Preserve original route information and existing path intent.
5. Tooltips must explain each control's purpose, effect, active state, consequences and relevant cautions; repeating its label is insufficient. User preference to disable optional tooltips must not hide safety/error messages.
6. Voyage, leg and transfer **durations** use `DD;HH;MM`, including leading zeroes and expanded day digits where required. For example 148 h 14 m renders `06;04;14`. Unresolved durations display `UNRESOLVED`, not fabricated figures.
7. CHEKOV route warnings use a **red `!`** associated with their relevant geographic position/leg and a detailed user-invoked advisory containing evidence/provenance and uncertainty. Do not confuse them with CRONKITE's pending discovery caution.
8. Maintain existing map modes, selected-waypoint visibility, USER PATH drawing, waypoint order and save/reload functionality; do not simplify unrelated controls.

## D4 — Geographic data, route integrity and integration boundaries

1. Continue work on real coastline, waterway, river, island, bathymetry and available ENC source coverage. Use appropriate source granularity and rendering detail at changing map zoom levels.
2. Protect user-specified waypoint positions and USER PATH intent; avoid arbitrary endpoint snapping, false completed routes, artificial rectangular detours and land-crossing geometry. Preserve truthful partial/unresolved endpoint gap and duration reporting.
3. The MARINE CHARTS overlay/display is independent of automatic route approval or rejection.
4. Record real source names, dates, restrictions, coverage and uncertainty. Do not silently convert research data into navigational safety declarations.
5. The geographic acquisition collection and its raw archives live outside source control under `C:\DATA_DRIVE\NERDS\GEOGRAPHIC_DATA\_INCOMING\` unless a later explicit decision authorises derived/versioned assets. Do not push multi-gigabyte source archives to GitHub.
6. Do not change approved route behaviour, overwrite user project saves, remove older regression cases or merge source data merely to make a test appear to pass.

## D5 — Development, backup, document and beta acceptance gates

1. Preserve all local Codex working source, tracked changes, untracked work, Git history, project settings and test fixtures before committing or attempting to push.
2. Back up full working content locally. Create an isolated **new backup branch** and push **without force**; do not alter the original branch, overwrite historical refs, or claim excluded files are remotely backed up.
3. Inspect all untracked files before Git staging. Observe GitHub file-size restrictions, Git LFS policy and secrets/credentials protection. Stop remote backup on unsafe files and report unresolved omissions accurately.
4. Keep this amendment and historical SCOPE documents together in the repository. This is an additive revision, not authorisation to rewrite the historical master text.
5. Current beta acceptance requires a launchable Windows application with usable **marine chart display** and all approved existing functionality; **not** automated chart-constrained navigation.
6. Deliver proper versioning, product branding/logo, copyright, previous-version installation/upgrade/uninstallation behaviour, a complete MSI, checksums and install/launch regression evidence where a beta installer is authorised.
7. Distinguish reported Codex desktop test success from independently verified packaged-build success. Publish actual test outputs and list incomplete integrations honestly.
8. Do not represent the live CRONKITE transfer as completed merely because the discovery inbox works.

**Preservation mandate:** No removal, replacement, simplification, or silent alteration of unrelated approved NERDS functionality. Original master documents and historical requirements remain intact.