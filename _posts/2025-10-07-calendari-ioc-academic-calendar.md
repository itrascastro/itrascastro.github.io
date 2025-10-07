---
layout: post
title:  "Calendari IOC - Building a Modular Academic Calendar Planner"
description: "Create, replicate, and export IOC academic calendars with a lightweight JavaScript SPA that runs entirely in the browser"
date:   2025-10-07 08:00:00 +0200
tags: [ calendar, education, javascript, spa, ioc ]
comments: true
author: itrascastro
---

Calendari IOC is the academic planner we use at the Institut Obert de Catalunya to keep module teams aligned. Instead of rewriting spreadsheets every term, the app lets coordinators configure an IOC study plan, drag assignments onto a visual timetable, reconcile conflicts, and export polished calendars for students. It is a single-page application that runs entirely in the browser, so your data never leaves your device unless you decide to export it.

## Try It Online Today

The latest build is live at [https://itrascastro.github.io/ioc/calendari-ioc/](https://itrascastro.github.io/ioc/calendari-ioc/). Open it in any modern browser and Calendari IOC will:

- Bootstrap with the official IOC presets and themes.
- Persist every calendar, category, and UI preference to `localStorage` so you can close the tab and resume later.
- Offer a full experience without requiring a login or backend service.

Because it is a static deployment you can also install it on any intranet simply by copying the published files.

## Who It Serves

Calendari IOC is built for teachers, heads of department, and course coordinators who need to orchestrate overlapping modules, exams, and tutoring sessions. The interface is multilingual by design (Catalan labels in UI, English-ready data), and the workflow assumes you are planning for real IOC semesters with evaluation periods, modular assignments, and shared milestones.

## Why I Built It

During the 2024-2025 academic year I found myself coordinating several FP modules. The spreadsheets we used could not cope with late calendar changes, and copying dates between groups caused endless inconsistencies. I wanted a planner that embraced IOC terminology, respected evaluation periods, and empowered teachers who are not necessarily technical. That constraint—"must run anywhere without installation"—pushed me toward a static, zero-backend SPA with opinionated defaults.

## Key Workflows

1. **Configure a study in minutes**: The onboarding wizard guides you through selecting the study type (FP, BTX, or a custom plan). Behind the scenes `StudyTypeDiscoveryService` loads curated JSON describing semesters, evaluation phases, and recommended milestones, so the generated calendar already speaks IOC terminology.
2. **Plan modules visually**: The main board gives you month, week, day, semester, compact, and global views. Drag-and-drop repositions events instantly, color coding comes from reusable categories, and the event modal stores descriptions, due dates, and category context.
3. **Keep categories under control**: Create unlimited categories, tweak names or colors with the dedicated color picker, and reuse templates that respect IOC contrast guidelines so exported calendars remain accessible.
4. **Resolve conflicts with the pending panel**: When an event cannot be placed (for example after a replication) it is queued in the "Unplaced Events" tray. From there you can drag it back into the calendar once you free space.
5. **Clone and synchronize calendars**: Replica mode copies milestones from one calendar to another, calculates available ranges, and surfaces warnings before overwriting. It is ideal for duplicating an FP module across parallel groups while keeping their timelines coordinated.
6. **Share and import safely**: The calendar actions menu exports HTML (full and compact versions), ICS, or JSON. Colleagues can import JSON back into the interface, and ICS files slide neatly into institutional calendars.
7. **Switch themes and stay focused**: A one-click theme toggle swaps between light and dark palettes, updating logos and ensuring contrast compliance so long planning sessions stay comfortable on the eyes.

## Power Features We Care About

- Centralized modals for setup, event editing, replication, confirmation, and color picking keep the surface consistent across views.
- `CalendarManager`, `EventManager`, and `CategoryManager` coordinate state via `AppStateManager`, which serializes cleanly for exports and restores objects through `CalendariIOC_DataRehydrator`.
- A dedicated `ErrorManager` prevents silent failures and routes validation messages through the UI helper so teachers always know what happened.
- The drag-and-drop helper provides snap-to-slot behaviour, keyboard focus management, and prevents accidental drops outside the timetable.

## For Developers and Contributors

Even though the hosted version is ready to use, the project is intentionally simple to hack on:

```bash
git clone https://github.com/itrascastro/calendari-ioc.git
cd calendari-ioc
npm install
npm run serve
```

`npm run serve` launches `python3 -m http.server` on port 8000 so relative `fetch` calls succeed. Open `http://localhost:8000` and you will see the same experience as the production build. When you modify scripts or configuration JSON, reload and `Bootstrap.initializeAsync()` will rebuild the calendars with your new logic.

Quality checks rely on Cypress end-to-end suites:

- `npm run test:open` for interactive debugging.
- `npm run test:headless` for CI-friendly validation covering creation, editing, replication, import/export, theming, and pending-event flows.

## Architecture in Detail

When I started Calendari IOC I deliberately avoided frameworks so the tool could live inside the IOC firewall without extra build steps. The result is a modular vanilla-JS architecture that still feels maintainable.

### Bootstrapping the app
`index.html` is responsible for loading the entire dependency graph. Once the DOM is ready, `Bootstrap.initializeAsync()` wires together discovery services, managers, renderers, and the global action dispatcher. The boot sequence:

1. Loads study presets via `StudyTypeDiscoveryService` (using `fetch` against the `config/` directory).
2. Rehydrates any calendars stored in `localStorage` using `CalendariIOC_DataRehydrator`.
3. Creates instances of `CalendarManager`, `EventManager`, `CategoryManager`, `ReplicaManager`, and `ViewManager`.
4. Renders the default monthly view and binds every UI control through data-action attributes.

### Managers and application state
All business logic sits in manager classes under `js/managers/`. `AppStateManager` is the single source of truth: it keeps calendars, categories, UI preferences, and pending events in memory, serializes them to `localStorage`, and exposes getters/setters for the rest of the system. Managers subscribe to state changes and expose intent-based methods (`addCalendar`, `duplicateEvent`, `executeReplication`) that the UI layer can call.

### Configuration and domain model
Every IOC study type ships as JSON (`config/fp.json`, `config/btx.json`, etc.) coupled with system-level presets in `config/sys/`. These files define semesters, evaluation milestones, suggested categories, and palette choices. At runtime they are materialized into domain objects (`CalendariIOC_Calendar`, `CalendariIOC_Event`, `CalendariIOC_Category`) so behaviour such as validation or replication can live alongside the data.

### UI rendering and helpers
The UI layer is broken into dedicated renderers for each view (`MonthViewRenderer`, `WeekViewRenderer`, `SemesterViewRenderer`, `CompactViewRenderer`, `GlobalViewRenderer`). Helper modules keep the DOM manipulation safe and reusable: `UIHelper` batches DOM updates, `ColorContrastHelper` enforces accessible palettes, `DragDropHelper` adds snapping and keyboard support, while `ModalRenderer` centralizes the modals used across the app.

### Persistence, replication, and data safety
- **Persistence**: `StorageManager` syncs `AppStateManager` with `localStorage`, running light migrations when the schema evolves.
- **Replication**: `ReplicaServiceFactory` decides which replica strategy to use (estudis vs generic) and ensures collisions end up in the "Unplaced Events" tray instead of silently overwriting items.
- **Import & Export**: Dedicated exporters generate ICS, HTML, compact HTML, and JSON with the same styling you see on screen; the JSON importer can rebuild a calendar on any other machine in one click.
- **Error handling**: `ErrorManager` wraps operations in `try/catch`, translating meaningful messages into toasts or modal warnings so the user never loses context.

### Styling and accessibility
CSS is organized into layers (`variables`, `base`, `layout`, `components`, `calendar`, `themes`). Theme toggling swaps logos and color variables, and the layout uses Flexbox plus CSS Grid to stay responsive on tablets and desktops alike. Focus states, aria-labels, and contrast helpers were tuned specifically for long planning sessions with real teachers.

### Testing and delivery
Every critical workflow is covered by Cypress specs under `cypress/e2e/`. They automate calendar creation, replication, category management, theme switching, and import/export flows. Because the project is static, continuous delivery is as simple as copying the compiled assets to GitHub Pages or an internal web server.

## Roadmap

We are already exploring the next major upgrades:

- Enable weekday-respecting replication so weekend-intensive modules stay aligned after cloning.
- Add linting and unit tests around the managers to complement the Cypress regression suite.
- Offer an optional shared workspace (IndexedDB or lightweight backend) for teams that prefer collaborative editing over file exchange.

Until then, Calendari IOC is battle-tested for the current academic year. Launch it from the public URL, export the calendar formats you need, and keep your team working from the same source of truth.
