# NERDS development instructions for CODEX

## Current authoritative release specification
Read [docs/v0.4.3/NERDS_v0.4.3_MASTER_DIRECTIVE.md](docs/v0.4.3/NERDS_v0.4.3_MASTER_DIRECTIVE.md) before modifying NERDS application source. This document consolidates the approved v0.4.3 scope and the geographic-resolution priority amendment.

## Current execution gate
Priority 1 only: improve geographic source resolution and demonstrate both Simplified NERDS and Detailed Terrain map styles over the New Orleans–Baton Rouge region. Stop for user review before commencing Priority 2.

## Guardrails
- Retain CesiumJS and the validated v0.4.2 baseline.
- Preserve projects, settings, geographic data and offline caches.
- Never create side-by-side Development Test installations.
- Do not push application code, modify the SIOP master or proceed past the approval gate without explicit user authorisation.
- Report actual tests and outstanding geographic/data limitations.

This file is an index; the complete requirements live in the linked master specification.
