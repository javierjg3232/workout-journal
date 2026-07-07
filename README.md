# Workout Journal

A React Native (Expo) workout journal. Log exercises with sets, reps, and optional weight, add notes, and watch your calendar fill up — with a yearly workout count and a streak that respects your planned rest days.

## Features

- **Home calendar** — days you worked out are highlighted; tap one to open that entry, tap an empty past day to backfill it.
- **Year tracker** — total workouts logged this year.
- **Smart streak** — set how many rest days per week you take (Settings); the streak survives up to that many skipped days in any rolling week and warns you when it's at risk.
- **Journal entries** — pick from ~35 built-in exercises grouped by muscle group, or add your own custom ones. Track sets × reps, optional weight (lb/kg), and free-form notes. Entries can be edited, reordered, and deleted.
- **Cloud sync** — email/password accounts via Supabase; your data follows you across devices.

## Setup

### 1. Create the Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the tables, row-level security policies, and seeds the built-in exercise list.
3. (Recommended for v1) Under **Authentication → Sign In / Providers → Email**, turn off **Confirm email** so new accounts can sign in immediately. If you leave it on, the app will tell users to check their inbox.

### 2. Configure the app

```bash
cp .env.example .env
```

Fill in the two values from your Supabase dashboard (**Project Settings → API**):

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

### 3. Run it

```bash
npm install
npx expo start
```

Scan the QR code with the [Expo Go](https://expo.dev/go) app on your phone, or press `i` / `a` for the iOS/Android simulator, or `w` for the browser.

## Tests

The streak and year-count logic lives in [`src/lib/stats.ts`](src/lib/stats.ts) and is covered by unit tests:

```bash
npm test
```

## Project structure

```
src/
  app/                 Expo Router screens
    (auth)/            sign-in, sign-up
    (app)/             home (calendar + stats), settings
      entry/[date]/    entry detail view + create/edit screen
  components/          button, card, exercise picker modal
  context/auth.tsx     Supabase session provider
  lib/                 supabase client, data access, streak logic, theme
supabase/schema.sql    tables, RLS policies, seed exercises
```

## Streak rule

Configure your planned rest days per week (0–6) in Settings. Within a streak, every rolling 7-day window may contain at most that many days without a workout. The streak is measured in calendar days from the oldest to the newest workout of the unbroken run, and a day that isn't over yet never hurts you — the home screen just warns you when today's workout is needed to keep the streak alive.
