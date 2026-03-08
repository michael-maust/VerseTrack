# VerseTrack — Implementation Plan

## Overview

VerseTrack is a single-page Bible reading tracker app for a Bible study group. All users' progress is visible on the main page as animated progress bars. Logged-in users can log their reading and drill into anyone's progress via nested drawers.

## Tech Stack

- Vite + React + TypeScript
- TanStack Router
- Tailwind CSS
- shadcn/ui (Base UI variant)
- Convex (DB + Auth with email/password)
- canvas-confetti
- Netlify hosting

## File Tree

```
/
├── convex/
│   ├── auth.config.ts
│   ├── auth.ts              # Password provider (firstName, lastName)
│   ├── http.ts              # Auth HTTP routes
│   ├── mutations.ts         # markChaptersRead, unmarkChaptersRead
│   ├── queries.ts           # getAllUsersProgress, getUserReadingHistory, getBookProgress
│   └── schema.ts            # users + readingProgress tables
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn Base UI components (drawer, button, input, accordion, etc.)
│   │   ├── BookDetailDrawer.tsx
│   │   ├── LoginDrawer.tsx
│   │   ├── LogReadingDrawer.tsx
│   │   ├── ProgressBar.tsx
│   │   └── UserProgressDrawer.tsx
│   ├── data/
│   │   └── bible.ts         # 66 books, 1189 chapters (ESV)
│   ├── lib/
│   │   └── utils.ts         # cn() helper
│   ├── routes/
│   │   ├── __root.tsx       # Root layout (header, providers)
│   │   └── index.tsx        # Main progress page
│   ├── env.d.ts             # Vite env types
│   ├── index.css            # Tailwind imports + dark theme tokens
│   └── main.tsx             # ConvexAuthProvider + RouterProvider
├── .env.local               # VITE_CONVEX_URL
├── components.json          # shadcn config
├── index.html               # HTML shell (dark class on html)
├── netlify.toml             # Netlify deploy config
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Build Order

### Phase 1 — Project Scaffolding

1. **Vite + React + TS init** — `npm create vite@latest . -- --template react-ts`
2. **Install deps** — TanStack Router, Convex, Convex Auth, Tailwind, canvas-confetti
3. **Vite config** — TanStack Router plugin, Tailwind v4 plugin, `@` alias
4. **Tailwind CSS** — `@import "tailwindcss"` in index.css, dark theme custom properties
5. **shadcn/ui init** — Base UI variant, install: button, drawer, input, label, accordion
6. **TanStack Router** — `__root.tsx` layout, `index.tsx` main page, `main.tsx` entry
7. **Netlify config** — `netlify.toml` with SPA redirect

### Phase 2 — Convex Backend

1. **Convex init** — `npx convex dev --once`
2. **Schema** — `users` (firstName, lastName, email + auth fields), `readingProgress` (userId, book, chapter, dateRead) with indexes
3. **Auth** — Password provider with custom `profile()` mapping firstName/lastName, HTTP routes
4. **Queries** — `getAllUsersProgress` (aggregate per user), `getUserReadingHistory` (recent log), `getBookProgress` (chapters for a book)
5. **Mutations** — `markChaptersRead` (batch insert), `unmarkChaptersRead` (batch delete)

### Phase 3 — Bible Data

Static TS file with all 66 ESV books and chapter counts (1,189 total), organized by OT/NT.

### Phase 4 — Frontend UI

1. **Root layout + header** — VerseTrack branding, Login/Logout button
2. **Main page** — Real-time progress bar list (Convex subscription), amber→green gradient, glow, CSS transitions
3. **Login Drawer** — Sign in / Sign up toggle, firstName + lastName on signup (Base UI Drawer)
4. **User Progress Drawer** — Recent reading summary + per-book progress bars (clickable)
5. **Book Detail Drawer** — Nested Base UI drawer with chapter grid (read=filled, unread=dimmed)
6. **Log Reading Drawer** — Accordion of 66 books, chapter chip grid, local toggle state, Submit button → batch mutation → confetti

### Phase 5 — Polish

- Dark-only theme: `#111114` background, `#1a1a1f` card surfaces
- Progress bar gradient (amber→green) with subtle glow
- CSS transitions on progress bar width (700ms ease-out)
- Stagger animation on page load
- Confetti on submit via canvas-confetti

### Phase 6 — Deployment

- Netlify: connect repo, set `VITE_CONVEX_URL` env var
- Convex: set `CONVEX_AUTH_SECRET` and `SITE_URL`

## Key Design Decisions

- **One row per chapter read** in `readingProgress` — simple queries, easy aggregation
- **Local state for chapter toggling** — mutations only fire on Submit (no per-click debounce needed)
- **Nested drawers** via stacked Base UI Drawer components
- **Real-time updates** via Convex subscriptions — no polling
- **Dark-only** — forced `class="dark"` on `<html>`

## Potential Challenges

1. **Nested drawers** — Stacking Base UI drawers; need to manage z-index and backdrop
2. **Convex Auth custom fields** — `profile()` must return fields matching schema; needs validation
3. **LogReadingDrawer** — Most complex component (accordion + grids + state + diff + mutation + confetti)
4. **getAllUsersProgress performance** — Fine for small group; would need precomputed aggregates at scale
