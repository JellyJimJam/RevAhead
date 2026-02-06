# RevAhead Mileage

RevAhead Mileage is a mobile-friendly mileage logging app for foster care parents.

## Tech
- Next.js App Router + TypeScript
- Tailwind CSS
- ESLint
- Local persistence via `localStorage` only (no backend)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Features
- Create, edit, and delete mileage trips
- Required domain fields and validation
- Automatic total miles calculation per trip
- Summary cards for total trips, all-time miles, and monthly miles
- CSV export for reimbursement/reporting workflows
