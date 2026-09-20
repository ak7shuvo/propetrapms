# PETRAPMS — Frontend (Phase 1)

Runs standalone against mock data — no backend needed to try it. Built exactly against `PETRAPMS-CONTRACT.md`, so pointing it at the real backend later (built separately, Phase 2) is a one-line config change.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open **http://localhost:3000** — you'll land on the login screen. Enter any email/password (mock mode accepts anything) or click "Register your property" to create a fresh demo workspace.

## What's real vs. mock

- All UI, navigation, forms, and state updates are fully functional.
- Data lives in `lib/mock-data.ts` (in-memory, resets on page reload) — there is no real backend yet.
- `lib/api-client.ts` is the only place that knows about mock vs. real. Every page calls the same functions either way.

## Switching to the real backend (Phase 2)

Once the backend session is done and running:

```bash
# in .env.local
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:3001   # or wherever the real API runs
```

No page or component needs to change — they only ever call `lib/api-client.ts`, which matches `PETRAPMS-CONTRACT.md` route-for-route.

## Pages

- `/login`, `/register` — auth
- `/dashboard` — overview (occupancy, upcoming reservations)
- `/dashboard/rooms` — room list + add room + change status
- `/dashboard/guests` — guest list + add guest
- `/dashboard/reservations` — reservation list + create + status changes
- `/dashboard/front-desk` — arrivals (check in) / in-house (check out)
- `/dashboard/hotel` — hotel profile settings

## Design

Black sidebar, warm cream content background, deep-red accent, dark stat cards — driven by CSS custom properties defined once in `app/globals.css` (`:root`) and consumed by every component. Colors, spacing, radii, and shadows are tokens, not scattered hex values.

## Auth architecture

`lib/auth-context.tsx` (`AuthProvider`/`useAuth`) is the single source of truth for auth state, exposed as one of three explicit statuses: `loading`, `authenticated`, `unauthenticated`. It resolves once on app start and is then read — never re-derived — by every route. `app/dashboard/layout.tsx` is the one place that guards `/dashboard/*`: it renders a shell skeleton while `loading`, redirects to `/login` only once `unauthenticated` is confirmed, and otherwise mounts the real `Shell` and stays mounted across in-app navigation. See "What was fixed" in the delivery notes for why this replaced six duplicated per-page auth checks.

## Not in this phase

Billing and Reports have no pages yet — `PETRAPMS-CONTRACT.md` doesn't define those endpoints yet either. Add both there first, then build the pages, once that work starts.
