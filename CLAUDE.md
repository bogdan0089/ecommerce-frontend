# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Warning:** This project uses Next.js 16 + React 19, which have breaking changes from older versions. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build
npm start        # start production server
npm run lint     # ESLint check
```

No test suite is configured.

**API URL:** hardcoded in [lib/api.ts](lib/api.ts) as `API_URL`. Change it there for local development (point to `http://localhost:8000`).

## Architecture

Next.js 16 App Router. All pages are client components (`"use client"`). No server-side rendering or API routes — the app is a pure client-side SPA talking directly to the FastAPI backend.

**Routing:** file-based under `app/` — each `page.tsx` maps to a route. Dynamic segments: `products/[id]/page.tsx`, `auth/verify/[token]/page.tsx`.

**API layer:** all backend calls go through [`lib/api.ts`](lib/api.ts). It exports typed fetch wrappers:
- public endpoints use plain `fetch()`
- protected endpoints use `authFetch()` which attaches `Authorization: Bearer <token>`
- login uses `application/x-www-form-urlencoded` (OAuth2 form); everything else is JSON
- errors are thrown as `new Error(error.detail || "fallback")`

**Auth:** JWT tokens stored in `localStorage` (`access_token`, `refresh_token`). Pages check for a token in `useEffect` on mount and redirect to `/login` if absent. Role is read from the decoded client object returned by `/client/me`.

**Cart:** stored in `localStorage` as `[{id: number, qty: number}]`. Updated on every change; totals computed client-side in `app/cart/page.tsx`.

**Styling:** primarily inline styles (no separate CSS files). Dark color scheme (`#080808` background). Tailwind CSS 4 is available but used only for a few utility classes in the root layout.

## Key files

| File | Purpose |
|------|---------|
| `lib/api.ts` | All API types and fetch functions |
| `app/layout.tsx` | Root layout, Google Fonts |
| `app/page.tsx` | Landing page |
| `app/admin/page.tsx` | Product management (superadmin/moderator only) |
| `app/profile/page.tsx` | Account stats, deposit, password change |
| `app/products/page.tsx` | Catalog with search, category, price filters |

## Backend

FastAPI backend lives in the sibling `fastapi-ecommerce-backend/` directory and runs on port 8000 via Docker Compose.
