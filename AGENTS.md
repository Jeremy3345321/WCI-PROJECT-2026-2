# AGENTS Guide

This file provides a quick reference for the project and the rules to follow when updating code.

## Key Files
- `TODO.md` — Current unresolved project concerns and cleanup decisions. Update as concerns are resolved
- `context/project-overview.md` — High-level summary of the app.
- `context/architecture.md` — Architecture and component relationships.
- `context/dependencies.md` — Runtime and development dependency details.
- `electron-main.js` — Electron entrypoint and PHP server bootstrap.
- `index.html` — Front-end UI entrypoint.
- `assets/css/style.css` — UI styles.
- `assets/js/app.js` — Main frontend application logic.
- `assets/js/data.js` — Data models and sample data handling.
- `api/*.php` — Backend API endpoint implementations.
- `package.json` — Build and packaging configuration.

## Rules for Code Changes
1. Keep code readable and maintainable.
2. Prefer small, isolated changes with clear intent.
3. Keep the architecture consistent: Electron UI -> local PHP backend.
4. Avoid duplicating application logic in multiple files.
5. Keep file and folder names descriptive and consistent.
6. Preserve or improve existing behavior unless the user explicitly asks for refactoring.
7. Validate runtime dependencies and file references after structural changes.
8. Keep the `context/` folder up to date with project knowledge.
9. Use comments sparingly, only where the code is non-obvious.
10. Keep project documentation concise and current.

## How to Use This Guide
- Always refer to `TODO.md` for current tasks and unresolved concerns.
- Use `context/*.md` to understand the overall project structure and dependencies.
- If uncertain about a change, update context docs and the TODO with the new information.
