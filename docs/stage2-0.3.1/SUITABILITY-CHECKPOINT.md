# Stage 2 local checkpoint: vessel suitability, 2026-10-16

The USER clarification supplements Revision A. Geographic routing always checks connectivity. Vessel suitability is a separate per-USER ON/BYPASS preference, default BYPASS. Both modes are non-blocking during BETA. ON reports supplied endpoint depth, air-clearance, length and beam exceedances separately from unknown route-wide evidence. It does not certify suitability or change geometry, distances, durations or ETA.

Implemented in src/suitability.cjs, src/passage.cjs, main/worker IPC, and Global preferences / per-leg display. Every leg retains geographicStatus separately from suitability. The route snapshots the advisory policy; the live preference remains USER configuration, outside expedition project settings. Reused geometry receives a fresh advisory assessment.

Validation: node --test test/*.test.cjs: 26 PASS, zero failures. node test/suitability-desktop.cjs: four workflow groups PASS, no renderer errors; fresh BYPASS, CANCEL, persistent ON after restart, actual worker advisory display, switching back to BYPASS without losing the route. Isolated NERDS_DATA_DIR; no production data used. Explicit land access and missing inland connectivity remain unresolved in both modes.

Evidence: suitability-desktop.json. Stage 1 branch and reports preserved. Stage 2 remains IN PROGRESS: this is not the final review checkpoint. No remote Git operations, installer build or Stage 3 work performed for this checkpoint.
