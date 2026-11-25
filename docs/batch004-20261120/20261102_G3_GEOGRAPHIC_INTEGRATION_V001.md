# SIOP geographic-development addendum — France G1/G2 and SURVEYOR–NERDS G3
**Date:** 2 November 2026  
**Status:** Controlled evidence addendum; G1 and G2 accepted as local technical trials; G3 integration **not implemented**.  
**Related master:** `20261018_4nR-MOS_SIOP_Master_Scope_v1.0_RevA.docx` (unchanged).  
**Companion document:** `20261102_4nR-MOS_SIOP_Master_Scope_v1.0_RevA_Geographic_Addendum.docx` (generated in conversation, not included in this GitHub commit).

## 1. Architecture and source-of-authority discrepancy
On 2 November 2026, the user approved **Architecture A** for the geographic-data boundary: 4nR-SURVEYOR is to own shared geographic acquisition, cataloguing, preprocessing, indexing, persistent offline cache and prepared geographic network services, including BY-LAND road-network geometry; NERDS retains USER PATH waypoint order and identity, BY-WAY leg interpretation, final authoritative WGS84 ellipsoidal distances, speeds and ETA, project persistence and Cesium GLOBE-DISPLAY of the same canonical vertex sequence. Preserve existing NERDS/CHEKOV algorithms unless changes are explicitly approved.

The committed approval register and NERDS/SURVEYOR interface records inspected on 2 November 2026 still describe SURVEYOR principally as a research/proposal system and state that no application transport is deployed. Reconcile the newer approved architectural decision through controlled document changes; do not claim those older records already describe an implemented service. This addendum does not silently supersede the original master or its established approval gates.

## 2. G1 France PBF audit — COMPLETED
Original dataset: `C:\DATA_DRIVE\NERDS\GEOGRAPHIC_DATA\EUROPE\FRANCE\france-latest.osm.pbf`; **5,106,602,992 bytes**. Repeated local SHA-256: `1585F4DFC758D71E2F7E5426AB0A4346C1AA4B60E587D98E8ACC53AB31F9324A`. This is a locally repeated baseline, not a match independently confirmed against the publisher.

Complete PyOsmium parse:
- 528,630,296 nodes; 73,624,371 ways; 1,105,169 relations
- 12,439,459 highway-tagged ways; 1,035,777 waterways; 563,880 water areas
- 100,003 restriction relations

Evidence: `C:\DATA_DRIVE\NERDS\GEOGRAPHIC_AUDIT\FRANCE\FRANCE-G1-AUDIT-20261102-094936.json`. Original input unchanged. Other downloaded regional extracts were not thereby fully audited.

## 3. G2 France offline road-routing reference — PASSED
Engine: Valhalla scripted Docker **3.9.1**, container `4nr-g2-france-clean-v2`, locally exposed at `http://127.0.0.1:8004`. Installed under `C:\DATA_DRIVE\NERDS\GEOGRAPHIC_AUDIT\G2_FRANCE_CLEAN_V2`.

The successful rebuild reused the validated France PBF plus existing `admins.sqlite` and `timezones.sqlite`; it disabled administrative and timezone downloads and the optional remote default-speeds configuration. Reported build duration: **42 minutes**. Routing graph: **2,046 .gph tiles across levels 0, 1, 2**.

The Valhalla `/status` endpoint returned version 3.9.1. For approximate city-centre coordinates Bordeaux (44.8378, -0.5792) → Toulouse (43.6047, 1.4442), with `costing=auto`, Valhalla returned **245.903 km** and nonempty encoded route geometry. A later G3 verification repeated the result. This is a Valhalla reference length, **not** an independently validated NERDS WGS84 authoritative distance.

Evidence: `G2_FRANCE_CLEAN_V2\result.txt` and `bordeaux-toulouse.json`. Retain prior failed build attempts and successful G2 source files until controlled clean-up is approved. A working standalone routing service does not prove any NERDS integration.

## 4. G3 preparation — COMPLETED; software integration OPEN
G3 workspace: `C:\DATA_DRIVE\NERDS\GEOGRAPHIC_AUDIT\G3_SURVEYOR_NERDS`.

Prepared locally: `G3-INTEGRATION-DIRECTIVE.md`, `G3-CODEX-INSTRUCTIONS.md`, `G3-BORDEAUX-TOULOUSE.json`, `G3-STATUS.txt`, `G3-NERDS-SOURCE-INSPECTION.txt`. A separate local `G3-IMPLEMENTATION-SOURCE.txt` captured 11 files according to the user's PowerShell output but was not independently supplied to this chat for full source review.

NERDS local snapshot: **v0.4.4**; branch `codex/stage2-v031`; HEAD `3ce315c526b55584179b62811d4f0f5474418177`; **26 uncommitted git-status entries**, including new v0.4.4 files and tests. Do **not** discard, reset, clean, overwrite or commit this work without explicit authorisation.

Inspected `src/passage.cjs` contains an explicit `ROAD_NETWORK_UNAVAILABLE` rejection when `s.transport==='BY-LAND'`. Candidate integration modules—not an approved change list—include `src/main.cjs`, `src/route-worker.cjs`, `src/passage.cjs`, `src/course-model.cjs`, `src/route-accounting.cjs`, `src/core.cjs`, `src/preload.cjs` and renderer/Cesium components.

## 5. Proposed G3 interface requirements — NOT YET IMPLEMENTED
- SURVEYOR geographic service exposes configurable, versioned local interface and source-attributed road-network geometry from Valhalla; do not hardcode `localhost:8004` into production NERDS.
- Preserve stable USER PATH IDs, waypoint order, individual BY-WAY incoming-leg overrides, geographic coverage and provenance.
- Convert encoded Valhalla route shapes to ordered canonical WGS84 vertices at a documented integration boundary.
- NERDS owns route acceptance, WGS84 ellipsoidal segment summation, speed/ETA, saved course variants and Cesium rendering from **identical calculated vertices**.
- Distinguish verified routing, provisional transfers, missing coverage, no suitable edges, disconnected graph, service failure and partial multi-leg failure. Never silently replace a failed BY-LAND calculation with straight-line distance.
- Do not alter existing BY-SEA or BY-AIR logic during the French land pilot. No shared writable application database is authorised.

## 6. Remaining acceptance gates — OPEN
Implement and test the actual SURVEYOR Valhalla adapter and NERDS client against current local v0.4.4 source. Verify canonical geometry and independent WGS84 length, Cesium display correspondence, stable waypoint order, mixed-mode leg behaviour, saved project reopen, offline operation, explicit errors, reverse/multi-leg routes, regressions, dataset provenance and secure/configurable runtime. The 30-minute, 75-route stability regression was **proposed/scripted**, but no result was provided at the time of this record.

**Status summary:** France G1 source audit PASSED; France G2 standalone routing PASSED; G3 specification and source inventory PREPARED; G3 application implementation NOT VERIFIED; G3 end-to-end desktop acceptance OPEN; deployment/release NOT APPROVED.

## 7. Coordination and approval control
See `INTEGRATION/STANDARD_DEVELOPMENT_DIRECTIVE.md` v1.1, `DECISIONS/APPROVAL_REGISTER.md`, `INTEGRATION/INTERFACE_CONTROL.md`, both `APPLICATIONS/<app>/INTERFACE.md` files and `MASTER/AMENDMENTS/20261018_NERDS_V001.md`. No claim of release, implementation, application-source modification or final master approval is made by this addendum.
