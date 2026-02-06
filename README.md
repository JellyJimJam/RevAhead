# RevAhead Mileage

RevAhead Mileage is a mobile-friendly mileage logging app for foster care parents.

## Tech
- Next.js App Router + TypeScript
- Tailwind CSS
- ESLint
- Supabase Auth + Postgres (RLS scoped per user)

## Environment variables
Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase setup (Phase 1)
1. Open your Supabase project SQL Editor.
2. Run `supabase/001_phase1_foundation.sql`.
3. In **Authentication > Providers**, keep Email enabled.
4. Optionally enable magic links and/or email+password sign-in.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What Phase 1 includes
- Login page with magic link OR email+password flow
- On first login, bootstrap a `users` profile row with role `parent`
- Trips persisted in Supabase Postgres instead of localStorage
- Row Level Security policies restricting all CRUD to authenticated owner rows
- CSV export from fetched trips
