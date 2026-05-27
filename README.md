# UI Review Tool

A focused React app for running UI review passes against screenshots or screen targets.

## Features

- Readiness score built from checklist progress and open findings.
- Category tabs for accessibility, responsive layout, interaction, content, and performance.
- Desktop, tablet, and mobile review frames.
- Screenshot upload with local preview.
- Finding queue with severity filtering, search, status toggles, and JSON export.

## Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Verification

```bash
npm run build
npm audit
```
