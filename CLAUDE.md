# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npx expo start` — dev server (press `w` for web, `i`/`a` for simulators). `npm run web|ios|android` are shortcuts.
- `npm test` — jest unit tests (currently covering `src/lib/stats.ts`). Single file: `npx jest src/lib/__tests__/stats.test.ts`; single test: `npx jest -t "streak"`.
- `npx tsc --noEmit` — typecheck (strict mode).
- `npm run lint` — expo lint.

Requires a `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`). Without it the app still boots but shows a config banner on sign-in. Env changes need a dev-server restart.

## Architecture

Expo SDK 57 + TypeScript + expo-router (file routing under `src/app`), Supabase backend. Path alias `@/*` → `src/*`.

**Auth gating:** `src/app/_layout.tsx` switches between the `(auth)` and `(app)` route groups with `Stack.Protected`, driven by `AuthProvider` (`src/context/auth.tsx`) which subscribes to the Supabase session. No screen checks auth itself.

**Routing identity is the date, not the entry id.** One journal entry per user per day, enforced by a DB unique constraint on `(user_id, entry_date)`. Screens are `entry/[date]/index` (detail) and `entry/[date]/edit` (create *and* edit — it loads an existing entry for that date if present). Date keys are local-timezone `YYYY-MM-DD` strings produced by `src/lib/dates.ts` (parses at local noon to avoid DST edges); never use `Date.toISOString()` for date keys.

**Data layer:** all Supabase queries live in `src/lib/api.ts`; screens never import the client directly except for auth calls. `saveEntry` upserts the entry row then deletes-and-reinserts all its `entry_exercises` (sort_order = array index). There is no client cache or state library — screens refetch on focus via `useFocusEffect`.

**Streak logic** (`src/lib/stats.ts`, pure and unit-tested): a streak survives as long as every rolling 7-day window contains at most `profiles.rest_days_per_week` non-workout days; today never breaks it (reported as `atRisk` instead). Change behavior here in tandem with the tests, which document the intended semantics.

**Backend:** `supabase/schema.sql` is the source of truth — applied manually in the Supabase SQL editor, no migration tooling. Row-level security scopes everything per-user; `exercises` holds shared built-ins (`owner is null`) plus per-user customs. Profiles are auto-created by a signup trigger, with a client-side fallback in `fetchProfile`.

**Web quirks (app must work on native and web):**
- `app.json` sets `web.output: "single"` — static/SSR output crashes because the Supabase client touches `window` at import time. `src/lib/supabase.ts` also only passes AsyncStorage as auth storage on native.
- React Native's `Alert` is a silent no-op on react-native-web. Always use `showAlert`/`confirmAction` from `src/lib/alert.ts` for dialogs.

**Theming:** `useTheme()` from `src/lib/theme.ts` supplies light/dark palettes keyed off the system color scheme; components take colors from it rather than hardcoding. No UI kit — shared primitives are `src/components/button.tsx` and `card.tsx`. `react-native-calendars` needs a `key` remount to pick up theme changes (see home screen).
