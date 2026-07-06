# Project Architecture

## Electron + PHP hybrid
- The app is an Electron desktop shell.
- `electron-main.js` starts a local PHP server on `localhost:8080` and loads the web UI from the app root. `php -S localhost:8000 -t .`
- This makes the application behave like a desktop app while the frontend still communicates with a PHP backend.

## Front-end
- `index.html` loads the UI and references:
  - `assets/css/style.css`
  - `assets/js/app.js`
  - `assets/js/data.js`
- It also includes external libraries via CDN:
  - Tailwind CSS
  - SheetJS
  - ExcelJS

## Back-end
- The `api/` folder contains PHP scripts that expose app data and scheduling operations:
  - `auto_schedule.php`
  - `config.php`
  - `conflicts.php`
  - `electives.php`
  - `schedule.php`
  - `sections.php`
  - `stats.php`
  - `strands.php`
  - `subjects.php`
  - `teachers.php`
- These endpoints are consumed by the frontend to load and update schedules.

## Packaging
- `package.json` defines Electron packaging settings via `electron-builder`.
- `favicon_io/` contains icon assets used by packaged builds for Windows, macOS, and Linux.

## Notes
- The PHP runtime must be available on PATH to run the app from Electron and for development.
- Node and npm are required for Electron tooling, packaging, and local development.
