# FabricNest — Codebase audit (Phase 1–3)

Date: 2026-09-18. Audited before any change was made.

## What existed

| Area | State found |
|---|---|
| Repository layout | `Backend/` (Express 4 + Mongoose 8, CommonJS) and `my-app` (a dangling git submodule pointer with no `.gitmodules` and no content). **The frontend was not in the repository at all.** |
| Dependencies | `Backend/node_modules` (3,122 files) committed to git. Both `bcrypt` and `bcryptjs` installed; `crypto` npm shim installed although it is a Node built-in. |
| Secrets | `Backend/config/config.env` committed with a JWT secret, a Stripe **secret** key and a publishable key. Mailtrap SMTP credentials hard-coded in `utils/Sendmail.js`. |
| Auth | JWT (7d) in an httpOnly cookie, bcrypt hashing, `role` field on user, `isAuthenticated` + `authorizeRoles('admin')`, forgot/reset password via hashed token. Cookie had no `secure`/`sameSite` flags. Missing-token responses used 404. |
| Products | Schema: name, description, price, stock, category (enum of fabrics: Cotton, Synthetic, Knitted, Linen, Designer), images, ratings, embedded Review array. `APIFeatures` for keyword regex search, `_gte/_lte` filters, pagination (8 per page). |
| Cart | Per-user cart with `items[{product, quantity}]`. |
| Orders | Shipping info, order items snapshot, payment info, prices, `orderStatus` (Processing/Delivered), admin list/update/delete. |
| Payments | Stripe PaymentIntent created with the **client-supplied amount**. Publishable key served via an authenticated endpoint. No webhook, no server-side verification before order creation. |
| Admin | Admin-only routes for listing products, users, orders; delete user; update order status. No admin UI. |
| AI | None. |
| Wishlist / reviews / preferences | Not implemented (review creation was a stub referencing an undefined `user`). |

## Bugs that stop the backend from running

1. `require('../utils/CatchasyncError')` in five files, but the file is `CatchAsyncError.js`. Works on case-insensitive macOS/Windows, **crashes on Linux/Vercel**.
2. `controller/cartController.js` uses ES module `import/export` in a CommonJS project → `SyntaxError: Cannot use import statement outside a module` on `require`.
3. `productModel.js` registers the model as `'product'` (lowercase) while `Cart` and `Order` reference `'Product'` → `MissingSchemaError` on populate.
4. `productController.js` imports the Express error *middleware* as `errorHandler` and calls `new errorHandler('product not found', 404)` — wrong class.
5. `routes/orderRoute.js` exports the router twice (harmless) and `getSingleOrder` never checks that the order belongs to the requesting user (IDOR).
6. `POST /api/products/create` and `PUT /api/products/update/:id` had **no authentication**.
7. `POST /api/users/delete` was unauthenticated and read `req.params.id` from a route that has no `:id`.
8. Order totals, tax, and shipping were trusted from the client; the Stripe amount was trusted from the client.
9. `errorHandler` middleware sends nothing when `NODE_ENV` is neither `development` nor `production` (request hangs).
10. Avatar uploads saved with the original filename (overwrites, path traversal risk) and committed to git.

## Decision: preserve the domain, replace the transport

The domain model and behaviours are sound and were **preserved**:

- JWT-in-httpOnly-cookie sessions, bcrypt password hashing, role-based guards (`customer` / `admin`).
- Mongoose + MongoDB as the database.
- Product search/filter/paginate semantics (keyword, `price_gte`/`price_lte`, category, page).
- Cart per user, order snapshots of purchased items, order status lifecycle, admin order management.
- Forgot/reset-password token flow (hashed token, 30-minute expiry).
- Stripe as the payment provider.

The Express transport layer was **replaced** by Next.js Route Handlers so the whole product deploys to Vercel as a single unit, shares types between server and client, and can use Server Components for the storefront. Each Express controller has a direct equivalent:

| Express (old) | Next.js (new) |
|---|---|
| `POST /api/users/register`, `/login`, `GET /logout`, `/myprofile` | `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `GET /api/auth/me` |
| `/forgotPassword`, `/password/reset/:token`, `/ChangePassword`, `/update` | `/api/auth/forgot-password`, `/api/auth/reset-password`, `PATCH /api/account` |
| `GET /api/products`, `/:id`, `/create`, `/update/:id`, `/delete/:id`, `/admin` | `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/[id]`, `GET /api/admin/products` |
| `/api/cart` add/remove/clear | `GET /api/cart`, `POST/PATCH/DELETE /api/cart/items` |
| `/api/order/new`, `/list`, `/:id`, `/admin`, `/admin/:id` | `GET /api/orders`, `GET /api/orders/[id]`, `GET/PATCH /api/admin/orders`, `/api/admin/orders/[id]`; **orders are created only by the payment verifier / Stripe webhook** |
| `/api/payment/process`, `/stripeapi` | `POST /api/checkout/session` (Checkout Session, server-computed amount), `POST /api/webhooks/stripe`, `GET /api/checkout/verify` |
| `/api/users/admin`, `/admin/:id` | `GET /api/admin/users`, `PATCH/DELETE /api/admin/users/[id]` |
| `utils/apiFeatures.js` | `src/lib/commerce/product-query.ts` (typed, plus text index and attribute filters) |
| `middleware/isAuthenticated.js` | `src/lib/auth/session.ts` (`requireUser`, `requireAdmin`) + `src/middleware.ts` |
| `middleware/errorHandler.js` | `src/lib/api/respond.ts` (`ApiError`, `handle`) |

New entities added because the product needs them: `Category`, `Wishlist` (with collections), `Review` (verified-purchase aware), `UserPreference` (progressive personalisation signals).

## Removed from the repository

- `Backend/` in its entirety (migrated as above; nothing runnable was lost).
- Committed `node_modules`, uploaded avatar photos, and `config.env` with live keys. **The committed Stripe test keys and JWT secret should be rotated** since they are in git history.
- The dangling `my-app` submodule pointer.
