# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Warning:** This project uses Next.js 16 + React 19, which have breaking changes from older versions. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build
npm start        # start production server
npm run lint     # ESLint check
npx tsc --noEmit # type check
```

No test suite is configured. CI (`.github/workflows/ci.yml`) runs lint, type check and build on every push and PR to `main` and `dev`.

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Purpose | Local value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend HTTP base | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket base | `http://localhost:8000` |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key | `pk_test_...` |

All three fall back to the deployed values when unset, so a plain `npm run dev` talks to production. Set them.

`NEXT_PUBLIC_WS_URL` is deliberately separate from `NEXT_PUBLIC_API_URL`: in production nginx serves HTTP under `/api` but proxies `/ws` straight to the backend, so the two bases differ there. Locally both are `http://localhost:8000`.

## Architecture

Next.js 16 App Router. All pages are client components (`"use client"`). No server-side rendering of data and no API routes — the app is a client-side SPA talking directly to the FastAPI backend.

**Routing:** file-based under `app/` — each `page.tsx` maps to a route. Dynamic segments: `products/[id]/page.tsx`, `auth/verify/[token]/page.tsx`.

**API layer** — [`lib/api.ts`](lib/api.ts) is the only place that knows about the backend:
- types first, then transport, then one function per endpoint grouped by domain
- `authFetch<T>()` attaches `Authorization: Bearer <token>`; `publicFetch<T>()` does not
- login uses `application/x-www-form-urlencoded` (OAuth2 form); everything else is JSON
- errors are thrown as `Error(detail)`; a non-JSON response (gateway failure) surfaces the real HTTP status instead of a parse error

**Auth** — JWT in `localStorage`. [`lib/useAuth.ts`](lib/useAuth.ts) exposes `useIsLoggedIn()` via `useSyncExternalStore`, so login and logout propagate across tabs. Call `notifyAuthChange()` after `saveTokens()` or `logout()`.

**Cart** — [`lib/cart.ts`](lib/cart.ts) is the single owner of the `cart` key in `localStorage`. Read with `useCart()`, write with `writeCart()` / `clearCart()`. Never touch `localStorage.cart` directly: `writeCart` fires the event every subscriber listens to.

## Styling

Dark theme throughout, matching the landing page: `#080808` ground, white primary buttons, 2px radii, wide-tracked uppercase micro-labels.

- [`lib/theme.ts`](lib/theme.ts) holds every colour, radius, type scale and layout width. **No hex literals in page files.**
- [`components/ui.tsx`](components/ui.tsx) — `Button`, `LinkButton`, `Input`, `Textarea`, `Select`, `Field`, `Card`, `Alert`, `Badge`, `Spinner`, `PageLoader`, `StatusMark`, `EmptyState`, `StatCard`, `Tabs`, `Eyebrow`, `PageTitle`.
- [`components/nav.tsx`](components/nav.tsx) — `Wordmark`, `Nav`, `NavLink`, `CartButton`, `LogoutButton`, `Page` (top bar + centred main), `AuthShell` (centred wordmark + form).
- [`app/globals.css`](app/globals.css) — resets, placeholder/focus colours, keyframes (`spin`, `fadeUp`, `slideIn`) and the `.fade-*`, `.hover-lift`, `.product-card` helpers. Pages must not inject `<style>` tags.

Styles are still written inline, but every value comes from `lib/theme.ts`. Tailwind is installed and imported by `globals.css`; it is not used for layout.

## Conventions

- **No comments in source files.** Code is expected to read on its own; anything that needs explaining is documented here instead. The only `//` lines allowed are tooling directives (`eslint-disable-*`, `@ts-*`) — those are instructions to the linter, not prose, and removing them turns CI red.
- Never call `setState` synchronously inside a `useEffect` body — derive with `useMemo`, clamp during render, or use `useSyncExternalStore`. ESLint enforces this (`react-hooks/set-state-in-effect`).

### Decisions worth knowing

| Where | Why it looks like that |
|---|---|
| `NEXT_PUBLIC_WS_URL` separate from `NEXT_PUBLIC_API_URL` | In production nginx serves HTTP under `/api` but proxies `/ws` straight to the backend, so the two bases differ. Locally both are `http://localhost:8000`. |
| `lib/cart.ts` caches the parsed array | `useSyncExternalStore` calls `getSnapshot` on every render and bails out only on a referentially equal result. Parsing fresh JSON each time would loop forever. |
| The catalogue filters on the server, not in the browser | The page used to fetch 200 products and filter, sort and page them in memory - right only while the shop is small. `browseProducts()` sends name, category and price to `/product/catalogue` and gets back one page plus `total` and `price_ceiling`. |
| Typing is debounced 300ms | Every keystroke would otherwise be a request. The input holds `typed`; `search` trails it and is what the query is built from. |
| `busy` is derived, never set in an effect | The response is stored as `{key, page}` with the key of the query that asked for it, so `result.key !== key` means a request is in flight. Setting a loading flag in the effect body would trip `react-hooks/set-state-in-effect`. |
| `maxPrice` is `null` until dragged | `null` means "no price filter", so the slider can sit at the ceiling without pinning the query to a number, and a ceiling that changes with the category never has to be clamped back into range. |
| An AI answer replaces the grid instead of sitting above it | `/ai/search` returns the matching products, not a sentence about them. Showing them in the same grid, behind a badge and a Clear button, means the shopper acts on the result the same way as on any other listing. Pagination is hidden while it is on: the model already ordered the whole answer. |
| The AI box is hidden from signed-out visitors | The catalogue is public but `/ai/search` requires a client. Rendering the box for a guest would trade a working search for a raw 401. |
| `<img>`, not `next/image` | Product image URLs are typed in by admins, so `next/image` would need an open `remotePatterns` allowlist and would proxy arbitrary hosts. |
| Forms carry `noValidate` | It suppresses Chrome's orange bubble. `lib/formErrors.ts` then reads the same constraints back through the Constraint Validation API and renders them inline, so a rule is never written twice. |
| `old_password` is not length-checked | Accounts created before the 8-character minimum must still be able to authenticate and fix themselves. Only passwords being *set* are validated. |
| `Card` sets no inline background or border | Both come from the `.surface` class, which paints a gradient into a 1px border via two clipped backgrounds. An inline `border` would override it and kill the effect. |

## Key files

| File | Purpose |
|------|---------|
| `lib/api.ts` | All API types and fetch functions |
| `lib/theme.ts` | Design tokens |
| `lib/cart.ts` | Cart store |
| `lib/useAuth.ts` | Login state store |
| `components/ui.tsx` | Shared primitives |
| `components/nav.tsx` | Chrome and page shells |
| `app/page.tsx` | Landing page — the design reference |
| `app/admin/page.tsx` | Product/order/category management (superadmin/moderator) |
| `app/profile/page.tsx` | Account, orders, deposit, security, AI |
| `app/products/page.tsx` | Catalogue with search, category and price filters |

## Backend

FastAPI backend lives in the sibling `fastapi-ecommerce-backend/` directory and runs on port 8000 via Docker Compose. Its routers are mounted at the root (`/auth/...`, `/product/...`), with no `/api` prefix — nginx adds that in production only.
