# E-Commerce Frontend

**Modern e-commerce storefront** built with Next.js 16 and TypeScript, connected to a [FastAPI backend](https://github.com/bogdan0089/fastapi-ecommerce-backend).

**Live demo:** https://bohdan-shop.duckdns.org  
**Backend repo:** https://github.com/bogdan0089/fastapi-ecommerce-backend

---

## Features

- JWT authentication (login, register, email verification, forgot/reset password)
- Product catalog with search, category filter, and price range
- Product detail page with quantity selector and add to cart
- Cart with localStorage persistence and checkout via account balance
- User profile with stats (total orders, total spent, balance), deposit form, transaction history, and password change
- Admin panel — product management with approve/reject/delete and status filtering
- Fully dark UI with smooth animations

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Registration |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password via token |
| `/auth/verify/[token]` | Email verification |
| `/products` | Product catalog |
| `/products/[id]` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Order checkout |
| `/profile` | User profile, stats, deposit, transactions |
| `/transactions` | Transaction history |
| `/admin` | Admin panel (superadmin / moderator only) |

---

## Technologies

- Next.js 16 (App Router)
- TypeScript
- JWT auth via localStorage
- Fetch API for all requests
- PM2 (production process manager)
- Nginx (reverse proxy)
- Let's Encrypt SSL

---

## How to Run

1. **Clone the repository**
```bash
git clone https://github.com/bogdan0089/ecommerce-frontend.git
cd ecommerce-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set the API URL** in `lib/api.ts`:
```ts
const API_URL = "http://localhost:8000";
```

4. **Run development server**
```bash
npm run dev
```

App available at: `http://localhost:3000`

> Requires the [FastAPI backend](https://github.com/bogdan0089/fastapi-ecommerce-backend) running on port 8000.
