# Project Dependencies

## Runtime
- PHP 8.x (used by the app backend and started by Electron)
- Node.js 24.x (required for Electron and build tooling)
- npm 11.x (package manager for Electron dependencies)

## Development packages
- `electron` — Desktop app runtime
- `electron-builder` — Packaging and installer generation

## Front-end libraries
- Tailwind CSS via CDN
- SheetJS via CDN
- ExcelJS via CDN

## Files and environment
- `package.json` contains scripts for starting and building the app.
- `favicon_io/` contains icon assets for packaged installers.
- The current project expects PHP, Node, and npm to be on the system PATH.

## Notes
- The app uses a local PHP server rather than a separate API service.
- If PHP or Node are not on PATH, the Electron app cannot start correctly.
