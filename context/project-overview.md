# Project Overview

This project is the Western Colleges Scheduling System.
It is a desktop application built with Electron and a PHP backend.
The app provides scheduling tools for teachers, sections, subjects, and elective assignments, and it includes auto-generation and conflict detection features.

Key components:
- `electron-main.js` — Electron app bootstrap, starts a PHP built-in server and loads the local web UI.
- `index.html` — Front-end entry point for the scheduling UI.
- `assets/` — CSS and JavaScript assets used by the UI.
- `api/` — PHP API endpoints that serve scheduling data and handle application logic.
- `package.json` — Project configuration and Electron packaging settings.
- `favicon_io/` — App icon assets used for packaging.
- `database_backup.sql` — A database backup for the app data.

The current workspace is organized as a single app root with a web UI and PHP backend in the same repository.
