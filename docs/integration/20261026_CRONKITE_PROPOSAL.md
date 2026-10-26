# CRONKITE — proposed SURVEYOR specialist and NERDS interface

Date: 26 October 2026
Status: USER-approved requirement; service and integration NOT IMPLEMENTED.
Authority: attached 26 October CRONKITE directive, supplementing SIOP v1.0 Revision A. This is a proposed interface addition, not an amendment silently applied to the governing master.

## Specialist register

CRONKITE — Geographic News & Current Affairs Intelligence, named for Walter Cronkite — is the proposed seventh SURVEYOR specialist alongside CHEKOV (weather, navigation, currents), EMERSON (music), BOURDAIN (cuisine), CHAKOTAY (culture/history/language), GOODALL (biology/ecology/oceanography), and HADID (architecture/engineering).

NERDS owns geographic selection, conventional discovery, routing, calculations and presentation. SURVEYOR owns optional deeper AI research and specialist orchestration. No CRONKITE AI runtime, news provider, authentication or research subsystem is introduced in NERDS. The SURVEYOR repository has not been modified.

## Proposed interaction and contract

Future path: RIGHT-CLICK → DISCOVER GEOGRAPHIC LOCATION → LOCAL NEWS / CRONKITE.

Existing integration point: src/public/app.js globe contextmenu handler and src/public/index.html #context. Current handler offers transport modes only. Future geographic selection must pick the clicked globe position, not the camera centre or nearest populated location; sky clicks must not create coordinates. Hover remains lightweight place-name or latitude/longitude identification. No active news button is added before a capability-aware interface exists.

Proposed request fields (not a deployed API):
- schemaVersion, requestId, specialist=CRONKITE;
- position {latitude, longitude, crs: EPSG:4326}; optional place identity and source provenance;
- area: explicitly selected radius with units or WGS84 geographic boundary;
- topics, interests, languages, regional publications;
- timeframe with explicit timezone, start and end;
- preferred/excluded publishers and topics, with preference origin and consent metadata.

Validate finite coordinates and latitude/longitude bounds. Never silently substitute another place. Request transmission requires an explicit USER research action and an available SURVEYOR connection. No unsolicited request on hover, ordinary map movement or startup.

Proposed response: requestId, status, researchedAt, coverage and limitations, findings[]. Each finding carries title, publisher, original source URL, language, publication timestamp, separate event date (nullable/uncertain), concise summary, geographic relevance and evidence. Distinguish local reporting from international coverage, uncertainty from verified evidence, and conflicting accounts from agreement. Preserve article identity/canonical links for deduplication without erasing independent conflicting reports. Treat source text as untrusted content, not executable UI or instructions.

Status vocabulary must distinguish available results, no results, unavailable/offline, incomplete coverage and error. Never generate placeholder news presented as research. NERDS routing and offline projects remain functional without SURVEYOR, CRONKITE or internet access.

## Preferences feasibility review

Public documentation reviewed 26 October 2026:
- Google News supports following interests and managing personalisation: https://support.google.com/googlenews/answer/9010862?hl=en-001
- MSN documents account-based interests/favourites: https://support.microsoft.com/en-us/msn/msn-feedback-frequently-asked-questions
- MSN describes personalised content ranking: https://support.microsoft.com/en-us/msn/partner-hub/how-msn-ranks-content

These establish preference capabilities, not a verified third-party profile-import API. Supported programmatic import is UNRESOLVED. Browser-associated feed settings are not assumed accessible. No private account or browser data was accessed. No authentication or provider implementation was attempted.

Design manual preferences as provider-independent records: topics, locations, languages, publishers, exclusions/deprioritisations, origin and updatedAt. Manual preferences must work without any linked account. A future USER-controlled import needs an explicitly documented format, preview/selection, provenance and consent; exported product fields must be verified before promising compatibility. Keep independently significant local developments separate from personalised-interest scoring so preferences do not silently erase relevant coverage.

## Future acceptance requirements

1. Clicked WGS84 position and provenance survive request/response correlation.
2. Optional capability unavailable/offline state leaves routing functional.
3. Manual preferences work with no Microsoft/Google account.
4. Sourced results distinguish event/publication dates, languages, local/international coverage and conflicting reporting.
5. Duplicate handling preserves evidence; no fictitious results.
6. Hover performs no news research; no private settings access without consent.
7. No embedded AI runtime or SURVEYOR repository modifications.

These are proposed acceptance cases, not passing implemented-service tests.

## Delivery checkpoint

Branch codex/stage2-v031; HEAD 8a809de451ee7ef1f6146340d4e4ab7d8cde1858. Existing geography changes remain uncommitted and preserved. package.json currently declares 0.3.0, not 0.4.0. No v0.4.0 installer or release smoke test has been completed. The detailed previously authorised v0.4.0 delivery specification has been requested to reconcile vector globe, terrain, interactions and packaging expectations. CRONKITE registration must not delay the authorised build once that scope is available.

Existing validation evidence in docs/stage2-0.3.1/memory-spherical: 76 Node tests passed; final focused standalone/coastline tests 7 passed; Python water-area 3 passed; acquisition 2 passed; source Electron canonical-course 5 checks passed, no renderer errors. These are existing geography results, not CRONKITE or packaged-release acceptance. Polar-cap topology and live alternative-provider acquisition remain unresolved. No source commit, push or MSI was made for this addition.
