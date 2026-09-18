# FabricNest

A premium, intelligent full-stack commerce platform. Discovery starts with intent, not filters; the catalogue, cart, checkout, orders, reviews and admin are real; the AI is honest and cheap.

**A product by Goutham · [1goutham.space](https://1goutham.space)**

---

## What it is

| Layer | What's here |
|---|---|
| **Storefront** | Editorial dark UI (Next.js App Router, React Server Components, Tailwind v4, Framer Motion). Home → Shop → Discover → Product → Saved → Bag → Checkout → Orders → Account. Glass is used for navigation, search, bag, filters and the assistant only. Mobile has its own bottom navigation, bottom sheets, a full-screen search and swipeable galleries. |
| **Intelligence** | `Discover` and `Ask FabricNest`. A rules-based intent parser turns "minimal black shirt under ₹2,000" into structured filters; Gemini (free tier, optional) upgrades understanding via structured output. Retrieval is MongoDB; ranking is a transparent scoring function; every reason shown is a feature that fired. Progressive personalisation from views, saves, cart, purchases and searches. |
| **Backend** | Next.js Route Handlers with Zod validation, typed API envelope, per-route rate limiting, no raw errors to clients. JWT sessions in httpOnly cookies; roles re-read from the database on every request. |
| **Data** | MongoDB + Mongoose: `User`, `Category`, `Product` (variants, stock per colour/size, text index), `Cart`, `Wishlist` (with collections), `Checkout`, `Order`, `Review`, `UserPreference`. Indexes on every storefront query path. |
| **Payments** | Stripe Checkout Sessions with server-computed amounts. Orders are created only after a verified webhook or a server-side session retrieval. Without Stripe keys, a clearly-labelled test gateway exercises the identical order pipeline (including the failure path). |
| **Admin** | Overview analytics, products (CRUD, images, colours × sizes inventory matrix, pricing, status), orders (status transitions with history), users (roles), categories. |

Full audit of the original codebase and the migration mapping: [`docs/AUDIT.md`](docs/AUDIT.md). System design: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Run it locally

```bash
npm install
cp .env.example .env          # set MONGODB_URI and AUTH_SECRET at minimum
npm run seed -- --reset       # categories, 28 products, admin + demo users, reviews, sample orders
npm run dev                   # http://localhost:3000
```

Accounts created by the seed:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@fabricnest.app` (override with `SEED_ADMIN_EMAIL`) | `admin12345` |
| Customer | `aarav@example.com` | `password123` |

Checks:

```bash
npm run typecheck   # tsc
npm run lint        # eslint (next/core-web-vitals + typescript)
npm test            # vitest: unit tests + DB integration tests (skipped if no MongoDB)
npm run build
```

## Environment

See [`.env.example`](.env.example). Everything is optional except `MONGODB_URI` and `AUTH_SECRET`:

- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` switch checkout from the test gateway to Stripe. Point the webhook at `/api/webhooks/stripe` (`checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_*`).
- `GEMINI_API_KEY` upgrades query understanding and the assistant's one-line stylist note. Prompts are compact (never the catalogue), cached in memory for 10 minutes, and all calls are server-side with short timeouts. Without it, everything still works on the rules engine.
- `SMTP_*` sends password-reset email; otherwise reset links are printed to the server log.

## Deploy on Vercel

1. Import the repository. Framework preset: Next.js. No build flags needed.
2. Add the environment variables above (MongoDB Atlas free tier works).
3. Run the seed once against the production database: `MONGODB_URI=... npm run seed`.
4. Add the Stripe webhook endpoint (`https://<domain>/api/webhooks/stripe`) and copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

The in-memory rate limiter is per instance; for multi-region deployments, swap `src/lib/api/rate-limit.ts` for an Upstash/Redis store.

## Project layout

```
src/
  app/                  routes (App Router) and API route handlers under app/api
  components/           ui primitives · layout · commerce · intelligence · checkout · account · admin
  lib/
    auth/               jwt (jose), cookies, password, session (requireUser / requireAdmin)
    api/                typed responses, ApiError, handle(), rate limiter
    commerce/           product-query, cart, wishlist, checkout, orders, reviews, pricing, serializers
    intelligence/       vocab, intent (rules), understand (Gemini merge), discover (retrieve+rank), recommend, preferences, assistant
    models/             Mongoose schemas
    store/              zustand client stores (session, cart, wishlist, ui)
scripts/seed.ts         idempotent seed
tests/                  vitest unit + integration
docs/                   AUDIT.md, ARCHITECTURE.md
```
