# BIM2BOM Simulator (React + Vite)

This is a Vite + React app used for simulating BIM-to-BOM flows.

## Prerequisites

- Node.js 18+ (Node 20 LTS recommended)
- Git

## Get the project from Git

Open a terminal (PowerShell, CMD, or bash) and run:

```bash
git clone <REPO_URL>
```

Then `cd` into the app folder:

```bash
cd BIM2BOM/bimtobomsimulator
```

If you cloned into a different parent folder name, adjust the path accordingly.

## Install dependencies

From inside `bimtobomsimulator`:

```bash
npm install
```

## Run locally (development)

```bash
npm run dev
```

Vite will print the local URL (typically `http://localhost:5173`). Open it in your browser.

## Build for production

```bash
npm run build
```

Build output goes to `dist/`.

## Preview the production build

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Notes

- Static assets are served from `public/`.
- A sample IFC is included at `public/web-ifc/A-40-V-000_BIM2BOM.ifc`.
- If you get missing/404 errors for `web-ifc` `.wasm` files, make sure you’re running via `npm run dev` or `npm run preview` (not opening `index.html` directly from disk).
