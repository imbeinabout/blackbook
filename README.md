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

## Features

- Full agent creation and management
- Professions, skills, bonds, motivations, disorders, and conditions
- Play Mode for in‑session tracking
- Dice tray with roll history
- Notes, aliases, and character photo upload
- Import / export agents as JSON
- Offline‑friendly: works entirely in the browser

---

## Running Locally

If you already have a built version of the app, you **do not need Node.js or npm** to run it locally.  
You only need a simple static file server.

### Using Python (Recommended)

From the project root (where the `build/` folder exists):

#### Python 3

```bash
python -m http.server 8080 --directory build
````

Then open your browser to:

    http://localhost:8080

#### Python 2 (legacy)

```bash
cd build
python -m SimpleHTTPServer 8080
```

That’s it.  
No tooling, no dependencies, no dev server.

***

## Building the App (Only if Needed)

You only need this if `build/` does **not** exist yet.

```bash
npm install
npm run build
```

This generates the `build/` directory used by both GitHub Pages and the Python server above.

Once built, you can stop using npm entirely.

***

## Development Mode

If you want live reload and development tooling:

```bash
npm install
npm start
```

This runs the app at:

    http://localhost:3000

***

## Importing & Exporting Agents

*   **Export**: Use the header menu → *Export Agent*
*   **Import**: Use *Import Agent* to load a previously saved `.json` file

All files are plain JSON and fully portable.

***

## Project Structure (High‑Level)

    public/     Static HTML and assets
    src/        React + TypeScript source
    build/      Production build output (static files)

The app is a **pure static site** once built.

***

## Roadmap

This project is developed as a personal side project, with priorities and scope evolving over time.
The roadmap below reflects current direction rather than fixed commitments.

### ✅ Phase 1 — Core Blackbook (Complete)

- Full agent creation and management
- Skills, professions, bonds, weapons, armor, and gear
- Derived stats (HP, WP, SAN, Breaking Point)
- Dice roller with history
- Local storage (offline‑friendly)
- Import / export agent JSON

✅ **Status:** Shipped and stable

***

### 🚧 Phase 2 — Rule Automation (In Progress)

- SAN automation (breaking points, adaptations, disorders)
- Condition and wound tracking
- Lethality and armor interaction
- Home scenes and recovery mechanics
- Reduced manual bookkeeping during play

**Status:** Actively in progress (current focus)

***

### 🔒 Phase 3 — Handler Mode (Planned)

- Read‑only player sheet views for the Handler
- Trigger rolls and effects remotely
- Peer‑to‑peer sync (no central server)

**Status:** Planned after Phase 2 stabilization

***

### 🔒 Phase 4 — Campaign & Cloud Tools (Future)

- Case files, timelines, and investigation notes
- Optional cloud saves and multi‑device sync
- Campaign and team management

**Status:** Future exploration

***

> The project prioritizes **gameplay value, offline usability, and long‑term maintainability** over rapid feature expansion.

***

## License & Attribution

Published by arrangement with the Delta Green Partnership. The intellectual property known as Delta Green is a trademark and copyright owned by the Delta Green Partnership, who has licensed its use here. The contents of this document are ©Imbeinabout, excepting those elements that are components of the Delta Green intellectual property.

***

## Contributing

Issues and pull requests are welcome. Feel free to open an issue to request new features.

If you plan significant changes, please open an issue first to discuss scope and direction.

***

> **BLACKBOOK**
>
> Trust no one. Keep your records clean.
>  

