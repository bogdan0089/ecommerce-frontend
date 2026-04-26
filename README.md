# E-Commerce Frontend

**Modern e-commerce storefront** built with Next.js 16, React 19 and TypeScript.  
Connected to a [FastAPI backend](https://github.com/bogdan0089/fastapi-ecommerce-backend) — full API reference available there.

**Live demo:** https://bohdan-shop.duckdns.org  
**Backend repo:** https://github.com/bogdan0089/fastapi-ecommerce-backend

---

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Stripe.js + `@stripe/react-stripe-js` — card payment UI
- Fetch API — all API calls typed in `lib/api.ts`
- Inline styles — no CSS framework
- PM2 — production process manager
- Nginx + Let's Encrypt SSL — reverse proxy

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Registration + email verification flow |
| `/forgot-password` | Request password reset |
| `/reset-password` | Reset password via token |
| `/auth/verify/[token]` | Email verification |
| `/products` | Product catalog with search, filters, cart |
| `/products/[id]` | Product detail page |
| `/cart` | Shopping cart (localStorage) |
| `/checkout` | Order checkout |
| `/profile` | Profile with tabs: overview, orders, edit, deposit, security |
| `/transactions` | Transaction history |
| `/admin` | Admin panel (superadmin / moderator only) |

---

## Features

**Authentication**
- Register with email verification (link sent via email)
- Login with JWT access + refresh token stored in localStorage
- Forgot password / reset password via email
- Change password and delete account from profile

**Products**
- Catalog with search by name, category filter, max price slider
- Product detail page with color, price, and add to cart
- Cart stored in localStorage with quantity selector per product

**Checkout & Orders**
- Cart → create order → add products → checkout (deducts account balance)
- Order history in profile with expandable product details per order
- Remove a product from a pending order directly from profile

**Profile (5 tabs)**
- **Overview** — account info (name, email, age, role) + quick links
- **Orders** — order history with status badges; expand each order to see products and quantities
- **Edit profile** — update name, age, address
- **Deposit** — top up balance via Stripe card payment (PaymentIntent flow)
- **Security** — change password, delete account (danger zone)

**Transactions**
- Full history: deposit, purchase, refund, withdraw
- Summary totals per transaction type
- Paginated with "Load more"

**Admin panel (4 tabs, superadmin / moderator only)**
- **Products** — filter by status, create / edit / delete, approve / reject pending
- **Orders** — list all orders, complete / cancel / refund with one click
- **Categories** — create and list product categories
- **Stats** — total counts, breakdowns by status, recent clients table
- Real-time WebSocket notifications when clients checkout orders

---

## How to Run Locally

**1. Clone and install**
```bash
git clone https://github.com/bogdan0089/ecommerce-frontend.git
cd ecommerce-frontend
npm install
```

**2. Configure environment**

Create `.env.local` in the project root:
```env
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
```

**3. Set the API URL**

In `lib/api.ts`, line 1 — change to your local backend:
```ts
const API_URL = "http://localhost:8000/api";
```

**4. Run dev server**
```bash
npm run dev
```

App: `http://localhost:3000`

> Requires the [FastAPI backend](https://github.com/bogdan0089/fastapi-ecommerce-backend) running on port 8000.

---

## Project Structure

```
app/
├── page.tsx                       # Landing page
├── login/page.tsx
├── register/page.tsx
├── forgot-password/page.tsx
├── reset-password/page.tsx
├── auth/verify/[token]/page.tsx
├── products/
│   ├── page.tsx                   # Catalog: search, filter, cart
│   └── [id]/page.tsx              # Product detail
├── cart/page.tsx
├── checkout/page.tsx
├── profile/page.tsx               # Tabs: overview, orders, edit, deposit, security
├── transactions/page.tsx
└── admin/page.tsx                 # Tabs: products, orders, categories, stats
lib/
└── api.ts                         # All typed API functions + interfaces
```
