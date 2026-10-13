Yes. Codex needs the NERDS v0.1.0 development brief, including our architectural decisions, hardware configuration, software requirements & download restrictions.

Do not rely on Codex automatically knowing everything we have discussed here.

Copy the following into Codex as the initial instruction.

# NERDS v0.1.0 — Initial Development Instructions

## PROJECT

**Application:** NERDS — Navigation & Expedition Research Discovery Surveyor\
**AI:** 4nR-AI\
**Project:** Faire Wind & Song\
**Development environment:** Windows 11, GMKtec AMD Strix Halo

NERDS is an offline-first expedition research, geographic information & route-planning application powered by a locally hosted LLM called 4nR-AI.

The system must operate independently of Internet connectivity using locally stored geographic and research data. Internet connectivity is used for Store & Forward data acquisition, updating research archives and obtaining information on demand.

## 1. GITHUB

Create a new repository:

- Repository name: `NERDS`
- Visibility: PRIVATE
- Initial application version: `v0.1.0`
- Include appropriate `.gitignore`, README, dependency manifests and version control.
- Do not commit AI model weights, downloaded research archives, production media, credentials or API keys.

Verify GitHub authentication and repository ownership before creating the repository.

## 2. EXISTING DEVELOPMENT ENVIRONMENT

The following software has already been installed and verified:

- Python 3.14.7
- Git 2.55.0
- Node.js 24.21.0
- npm 11.9.0

PowerShell blocks `npm.ps1` because of its execution policy. Use `npm.cmd` instead of `npm`.

Do not reinstall existing software.

The computer is currently connected through Starlink with a 300 GB data allowance. Minimise downloads. Target less than 30 GB for the initial development environment, preferably substantially less.

Do not install Visual Studio Build Tools, Chocolatey or additional Python distributions unless a verified dependency requires them.

## 3. HARDWARE & STORAGE

The proposed shipboard configuration is:

- GMKtec AMD Strix Halo with 128 GB unified memory.
- 8 TB M.2 NVMe designated AI-CACHE.
- Areca ARC-8050T5U-6 external RAID enclosure.
- Six 20 TB HDDs configured as RAID 6.
- 80 TB usable AI-ARCHIVE.
- USB 3.2 connectivity.

The dedicated AI-CACHE and AI-ARCHIVE volumes are planned hardware. Do not assume that they are currently installed or available.

For initial development, use an appropriate existing local directory and keep storage paths configurable.

## 4. APPLICATION INTERFACE

Create a desktop-oriented interface with:

- Interactive 3D globe as the primary geographic display.
- CesiumJS as the proposed rendering engine.
- Editable WAYPOINTS column on the left.
- ADD WAYPOINT function.
- Minimum location input: city name.
- Offline geographic lookup using locally stored city information.
- Ability to add, edit, remove and select waypoints.
- Geographic markers displayed on the globe.
- Persistent storage of waypoint information.

Initial test locations:

Amsterdam → Emden → Hamburg → Kiel → Gdansk.

Support GLOBE and MERCATOR viewing modes.

Use locally hosted geographic data for offline operation. Do not make Google Maps, Google Earth or another commercial online mapping service a runtime dependency.

## 5. MISSION INTERFACE

Create the following selectable MISSION entries:

1. ROUTE PLOT
2. SURVEYOR – MUSIC
3. SURVEYOR – CUISINE
4. SURVEYOR – CULTURE
5. SURVEYOR – HISTORY
6. SURVEYOR – ARCHITECTURE
7. TBD

Each MISSION may activate a different interface and underlying workflow.

Only ROUTE PLOT needs initial functional implementation. Other MISSION interfaces may remain placeholders in v0.1.0.

## 6. ROUTE PLOT

Default transportation mode: BY-SEA.

Provide BY-ROAD and BY-AIR selections through the right-click context menu.

The initial ROUTE PLOT interface must support:

- Starting port, location name or map PIN.
- Destination name or map PIN.
- Departure date and time.
- MISSION SPEED selection:
  - BEST-TIME
  - BEST-EFFICIENCY
  - BEST-SAILING
- Plotting waypoint sequences on the globe.
- Geographic display selection.

The eventual routing system will incorporate tides, currents, wind, weather, sea state, water depth and actual vessel performance.

For v0.1.0, route plotting may be limited to a clearly labelled geographic demonstration.

Do not present straight-line waypoint connections as calculated marine routes.

The routing engine will eventually calculate alternative routes and performance profiles. These calculations must be based on appropriate numerical models and geographic/environmental data, not invented by an LLM.

## 7. 4nR-AI INTEGRATION

Prepare NERDS to communicate with a locally hosted LLM through a configurable API.

Potential local inference servers include Lemonade Server and LM Studio. Verify what is actually installed before choosing or downloading an inference system.

Separate the NERDS application from the underlying inference engine so that models and servers can be replaced without redesigning the application.

Provide a simple interface for testing the connection between NERDS and 4nR-AI.

Do not download a large language model without approval of its size and suitability.

## 8. GEOGRAPHIC RESEARCH & MEDIA

Prepare a persistent geographic research database capable of associating information with waypoints.

Initial test capabilities:

- Import one or more geotagged photographs.
- Extract available EXIF/GPS metadata.
- Display photograph locations on the globe.
- Preserve source-file references and associated metadata.
- Provide a mechanism for archiving imagery acquired from external services when licensing permits.

Prepare the data model for future integration with the existing BRONTO-STOR production media infrastructure.

Original production camera files should remain on BRONTO-STOR rather than being automatically duplicated into NERDS.

The application will eventually associate production media using GPS data, timestamps, timecode, camera identifiers and metadata.

## 9. STORE & FORWARD

NERDS must be architected for offline-first operation.

When connected, NERDS will eventually acquire geographic and research datasets, retain permitted copies, verify them, index them and make them available offline.

Use configurable data-source interfaces so external API providers can be added or replaced without modifying the central application.

The initial test does not require implementation of the complete acquisition system.

## 10. DEVELOPMENT PROCEDURE

First inspect the existing development environment, available directories, GitHub authentication and installed dependencies.

Then:

1. Establish the repository.
2. Initialise the application.
3. Implement the CesiumJS geographic interface.
4. Implement the WAYPOINTS editor and offline city lookup.
5. Implement MISSION selection.
6. Implement initial ROUTE PLOT display.
7. Establish persistent local storage.
8. Prepare and test the 4nR-AI interface.
9. Implement basic geotagged image importing and indexing.
10. Test application startup, persistence and offline functionality.

Provide a clear report of completed functions, missing dependencies, tests performed and known limitations.

**Do not expand scope or substitute design decisions without approval. Preserve the agreed NERDS architecture and request clarification where an essential design decision remains unresolved.**

That gives Codex the development context it needs without requiring it to reconstruct our entire conversation.

One additional instruction: Have Codex inspect the available development environment before downloading or installing anything. We have already confirmed Python, Git, Node.js & npm, and there is no reason to repeat that work.

The first objective is a functioning NERDS interface with an offline CesiumJS globe, editable WAYPOINTS and MISSION selection. Everything else builds on that foundation.