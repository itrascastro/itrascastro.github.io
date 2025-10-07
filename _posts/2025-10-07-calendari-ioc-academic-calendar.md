---
layout: post
title:  "Calendari IOC - Building a Modular Academic Calendar Planner"
description: "Create, replicate, and export IOC academic calendars with a lightweight JavaScript SPA that runs entirely in the browser"
date:   2025-10-07 08:00:00 +0200
tags: [ calendar, education, javascript, spa, ioc ]
comments: true
author: itrascastro
---

Calendari IOC started as a way to give IOC teachers and coordinators a calendar that speaks their language. Rather than juggling spreadsheets or rewriting dates every semester, the application lets you assemble an academic plan in the browser, persist it locally, and share it in the formats colleagues already expect. Everything runs client-side, so there is no backend to maintain.

## What the App Delivers

1. **IOC-aware calendar setup**: Pick a study type (FP, BTX, or custom) and the setup wizard generates module names, evaluation periods, and milestones straight from curated JSON configuration shipped with the app.
2. **Multi-calendar management**: Store as many scenarios as you need, switch between them instantly, and keep an "unplaced events" tray for busy weeks where conflicts pile up.
3. **Rich editing experience**: Drag events across the timetable, color-code categories, duplicate milestones, and keep notes for each item without ever leaving the page.
4. **Replication with guardrails**: The replica workflow copies events from one calendar to another, calculating available slots and warning about collisions so modules stay in sync.
5. **Exports that travel well**: Download your plan as HTML, JSON, or ICS, or hand the file to a colleague who can import it back into Calendari IOC with a single click.

## Getting Started Locally

The repository is lightweight by design: static assets plus Cypress for end-to-end checks.

```bash
git clone https://github.com/itrascastro/calendari-ioc.git
cd calendari-ioc
npm install
npm run serve
```

The `serve` script launches `python3 -m http.server` on port 8000 so the app can fetch its JSON configuration. Open `http://localhost:8000` and the bootstrap process will load calendar presets, restore any data saved in `localStorage`, and render the default monthly view.

Want to verify everything still works after a change? Run `npm run test:headless` to execute the Cypress suite that covers calendar creation, replication, imports, exports, and theming.

## Under the Hood

- **No framework, just ES modules**: Scripts are loaded in `index.html` in a carefully curated order. Bootstrapping hinges on classes like `CalendarManager`, `EventManager`, and `ViewManager`, all orchestrated by `Bootstrap.initializeAsync()`.
- **State that survives semesters**: `AppStateManager` persists calendars, categories, and UI preferences to `localStorage`, while `CalendariIOC_DataRehydrator` upgrades the JSON payload back into rich domain objects on reload.
- **Config-driven discovery**: `StudyTypeDiscoveryService` reads `config/*.json` to populate module names, evaluation milestones, and color templates, making it easy to tweak academic models without touching the core code.
- **Focused UI helpers**: Renderers for each view (global, semester, month, week, day) live under `js/ui/`, sharing helpers that deal with DOM batching, color contrast, and drag-and-drop interactions.
- **Resilient replication**: `ReplicaService` and its adapters (`EstudiReplicaService`, `GenericReplicaService`) compute available ranges and queue overflow events in the pending panel so nothing disappears when calendars become dense.

## Why It Matters for IOC Teams

Calendari IOC is meant for the messy reality of academic planning. Modules run in overlapping blocks, there are unexpected holidays, and coordinators must explain the rationale behind each change. By keeping data local and exportable, the tool respects privacy while still giving teams collaboration options. The dark/light themes and accessible color-contrast helpers make the interface comfortable during long planning sessions.

## Roadmap Ideas

The codebase already hints at improvements we plan to tackle next:

- Activate weekday-respecting replication so weekend events do not drift when copying between groups.
- Introduce linting and unit tests alongside the Cypress suite to catch regressions earlier.
- Add an optional backend bridge for teams that want shared storage without manual file exchange.

In the meantime, the current build is production-ready as a static deployment. Drop it on GitHub Pages or any static host, invite your fellow teachers, and start shaping the semester together.
