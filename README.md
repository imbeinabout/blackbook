# Blackbook
![Blackbook Logo](src/assets/blackbook-logo.png)

> **Project Status**  
> Blackbook is a hobby project built and maintained in spare time. While development is ongoing, features, priorities, and pace may change without notice. There are no promised timelines or guarantees.

**Blackbook** is a browser‑based agent dossier and character management tool for the *Delta Green* role‑playing game.  
It is designed to feel like an in‑universe terminal while remaining fast, private, and fully client‑side.

All data lives in your browser. No accounts. No backend.

---

## Live Version

The latest deployed version is available via **GitHub Pages**:

 **https://imbeinabout.github.io/blackbook/**


---

## Core Principles

- Offline-first
- Local-first data ownership
- No required accounts
- No backend services
- Mobile-friendly
- Fully portable JSON data
- Browser-native persistence
- Designed to support long-running campaigns  
  
---

## Features

### Agent Management

- Full agent creation and editing
- Profession management
- Attributes and statistics tracking
- HP, WP, SAN, and Breaking Point tracking
- Bonds and motivations
- Disorders and sanity adaptations
- Aliases and personal details
- Character photo support
- Notes and record keeping
  
### Skills & Advancement

- Complete skill tracking
- Skill advancement
- Special training 
- Personal pursuits
- Home scene support
  
### Operational Tracking

- Weapons management
- Armor management
- Gear inventory
- Conditions tracking
- Wound and ailment tracking
- Recovery and rest tracking
  
### Play Mode

- Dedicated Play Mode
- Session-focused stat adjustments
- Dice rolling
- Roll history
- Lethality support
- Reduced bookkeeping during play

### Data Ownership

- Browser-based persistence
- Works completely offline
- JSON import/export
- Fully portable agent records
  
### Event Architecture (v0.2)

Blackbook now maintains a persistent event history for agent activity. The current agent remains the source of truth, while events provide a persistent audit trail that lays the foundation for future campaign and synchronization systems.

---

## Importing & Exporting Agents

*   **Export**: Use the header menu → *Export Agent*
*   **Import**: Use *Import Agent* to load a previously saved `.json` file

All files are plain JSON and fully portable.

---

## Running Locally

If you already have a built version of the app, you **do not need Node.js or npm** to run it locally.  
You only need a simple static file server.

### Using Python (Recommended)

From the project root (where the `build/` folder exists):

#### Python 3

```bash
mkdir -p local/blackbook
cp -r build/* local/blackbook/
cd local
python -m http.server 8080
````

Then open your browser to:

    http://localhost:8080/blackbook/

#### Python 2 (legacy)

```bash
mkdir -p local/blackbook
cp -r build/* local/blackbook/
cd local
python -m SimpleHTTPServer 8080
```

#### Windows Note
If `cp` is not recognized use:  
  
```bat
xcopy build\* local\blackbook\ /E /I
```

#### Troubleshooting  
If the page is blank, make sure the URL ends with `/blackbook/`.

>That’s it.  
>No tooling, no dependencies, no dev server.

---

## Building the App

You only need this if `build/` does **not** exist yet.

```bash
npm install
npm run build
```

This generates the `build/` directory used by both GitHub Pages and the Python server above.

Once built, you can stop using npm entirely.

---

## Development

If you want live reload and development tooling:

```bash
npm install
npm start
```

This runs the app at:

    http://localhost:3000

---

## Project Structure (High‑Level)

    public/     Static HTML and assets
    src/        React + TypeScript source
    build/      Production build output (static files)

The app is a **pure static site** once built.

---

## Roadmap

The roadmap reflects current direction and priorities rather than guaranteed deliverables.

### ✅ v0.1 — Core Agent Management

- Agent dossiers
- Skills and professions
- Inventory systems
- Derived statistics
- Offline storage
- Import/export

**Status:** Complete

---

### ✅ v0.2 — Event Architecture

- Persistent agent event system
- Comprehensive event coverage
- Audit history foundation
- Future synchronization support
- Timeline groundwork

**Status:** Complete

---

### 🚧 v0.3 — Agent History & Timeline

Current focus:

- Event timeline visualization
- Agent history browsing
- Filtering and searching historical activity
- Improved narrative record keeping

**Status:** In Progress

---

### 🔒 v0.4 — PWA Foundation

Planned focus:

- Installable application
- Improved mobile support
- Enhanced offline experience
- Better device integration

---

### 🔒 v0.5 — Campaign Framework

Planned focus:

- Case management
- Operations tracking
- Shared campaign records
- Investigation support tools

---

### 🔒 v0.6 — Handler Mode Alpha

Planned focus:

- Handler oversight tools
- Agent monitoring
- Event-driven campaign support

---

### 🔒 v0.7 — Agent Connections

Planned focus:

- Relationship tracking
- Bond visualization
- Agent network features

---

### 🔒 v0.8 — WebRTC Live Sync

Planned focus:

- Peer-to-peer synchronization
- No mandatory server infrastructure
- Local-first multiplayer support

---

### 🔒 v0.9 — Campaign Operations

Planned focus:

- Large campaign support
- Stress testing
- Advanced campaign tooling

---

### 🎯 v1.0 — Blackbook Platform

Target vision:

A complete offline-first Delta Green campaign platform that supports long-running investigations, campaign management, agent tracking, and handler workflows while preserving full ownership of user data.

---

> The project prioritizes **gameplay value, offline usability, and long‑term maintainability** over rapid feature expansion.

---

## License & Attribution

Published by arrangement with the Delta Green Partnership. The intellectual property known as Delta Green is a trademark and copyright owned by the Delta Green Partnership, who has licensed its use here. The contents of this document are ©Imbeinabout, excepting those elements that are components of the Delta Green intellectual property.

---

## Contributing

Issues and pull requests are welcome. Feel free to open an issue to request new features.

If you plan significant changes, please open an issue first to discuss scope and direction.

---

> **BLACKBOOK**
>
> Trust no one. Keep your records clean.
>  

