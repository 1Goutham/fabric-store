# FabricNest — Architecture

## Request flow

```
Browser ──► Next.js (Vercel)
             ├── Server Components: read via lib/* directly (no HTTP hop)
             ├── Route Handlers /api/*: Zod → service → typed envelope { ok, data | error }
             ├── Edge middleware: cookie signature check → redirects only
             └── lib/* services ──► MongoDB (Mongoose, cached connection)
                                 ──► Stripe (server-only)
                                 ──► Gemini REST (server-only, optional, cached)
```

## Authentication and authorisation

- Passwords: bcrypt (12 rounds). Sessions: HS256 JWT (`jose`) in an `httpOnly`, `sameSite=lax`, `secure` (prod) cookie, 7 days.
- `getCurrentUser()` verifies the token **and re-reads the user from the database**. The `role` claim in the JWT is only used by the Edge middleware to redirect; every handler and admin page calls `requireAdmin()` which checks the stored role.
- Registration never accepts a role. Role changes happen only via `PATCH /api/admin/users/[id]` and an admin cannot demote or delete themself.
- Rate limits: login (8/10 min per IP+email), register (10/15 min), forgot-password (5/15 min), discover (30/min), assistant (20/min), checkout (10/10 min).

## Money

All pricing is computed in `lib/commerce/pricing.ts` on the server: subtotal from live product prices, delivery from the chosen method, 5% GST, total. The client only displays these numbers.

### Checkout pipeline

```
POST /api/checkout/session
  ├─ load cart from DB, re-price from products, verify stock per variant
  ├─ create Checkout document (server-side snapshot: items, address, pricing)
  ├─ stripe: create Checkout Session (line items in paise, metadata.checkoutId) → url
  └─ test:   url = /checkout/pay?checkout=<id>

Payment confirmation (either path)
  ├─ POST /api/webhooks/stripe   (signature verified against raw body)
  ├─ GET  /api/checkout/verify   (success page: retrieve session, payment_status === "paid")
  └─ POST /api/checkout/test-complete (test gateway only)
        └─ finalizeOrder(checkoutId, sessionId)
             ├─ idempotent on payment.sessionId (unique sparse index)
             ├─ decrement variant stock with a guarded update (stock >= qty)
             ├─ create Order (status: confirmed, timeline)
             ├─ mark Checkout completed, clear Cart
             └─ record purchase signals for personalisation
```

Failure and cancellation land on `/checkout/cancelled`, which marks the Checkout failed. Checkouts expire (TTL index) and can never be finalised after payment failed.

## Intelligence

```
USER INTENT ─► QUERY UNDERSTANDING ─► RETRIEVAL ─► FILTERING ─► RANKING ─► RESULTS
   text          intent.ts (rules)      Mongo       relax()     score()    cards + reasons
                 understand.ts (Gemini,  filter                            + honest note
                 merged & validated)
```

- **Rules parser** (`intent.ts`): price phrases (under/over/between/around/2k), categories via synonym lexicon, colours, fabrics, moods, occasions, seasons, fits, sizes (only when explicit), gender, sort, leftover keywords for the text index. Deterministic and unit-tested.
- **Model upgrade** (`understand.ts`): when `GEMINI_API_KEY` is set, one structured-output call with a JSON schema constrained to catalogue vocabulary. Output is validated with Zod and merged; rules win on price. Cached 10 minutes; 7-second timeout; falls back silently.
- **Retrieval** (`discover.ts`): a MongoDB filter from the intent. If fewer than three results, constraints are relaxed in order (keywords → colours → fits → moods → price +25% → categories) and the relaxation is reported to the user in plain language.
- **Ranking**: explicit weights (text score, category, fabric, colour, mood, occasion, season, fit, price fit, rating, sales, stock) plus a small personalisation boost. Reasons per product are the matched features.
- **Recommendations** (`recommend.ts`): `similarProducts` (category, fabric, mood, colour, price closeness), `pairsWellWith` (curated links first, then complementary categories with palette/mood matching, diversified), `recommendForUser` (profile-weighted retrieval, diversified, with reasons).
- **Personalisation** (`preferences.ts`): `UserPreference` accumulates weighted counters (view 1, save 3, cart 4, purchase 6) per category, fabric, colour, mood, fit and size; a rolling price sample; recent views and searches; optional explicit style tags. `getStyleProfile()` derives top values and a price band. `describeStyle()` turns it into human labels ("Minimal · Relaxed · Neutral palette").
- **Assistant** (`assistant.ts`): detects mode (discover, similar, outfit, choose, compare, help) from the message and page context, runs the corresponding pipeline, and returns products + reasons. The optional model writes only a one-sentence note from compact metadata of the top four products. It cannot invent products.

### Where to go next

- Embeddings: add `Product.embedding` (Gemini `text-embedding-004`), an Atlas Vector Search index, and a `semanticRetrieve()` step before ranking. The `discover()` signature already accepts candidates from any retriever.
- Learned ranking: replace `scoreProduct()` weights with a model trained on click/purchase logs; the reasons layer stays.

## Data model

| Collection | Key fields | Indexes |
|---|---|---|
| users | name, email, passwordHash (select:false), role, addresses[], reset token | email unique, role |
| categories | name, slug, description, image, order | slug unique |
| products | name, slug, description, story, price, compareAtPrice, category, categorySlug, fabric, material, fit, care[], gender, colors[], sizes[], variants[{sku,color,size,stock}], stock, images[], tags[], moods[], occasions[], seasons[], pairsWith[], rating, featured, status, salesCount, viewCount | slug unique; text(name, description, tags, material); {status, categorySlug, price}; {status, moods}; {status, createdAt}; {status, rating}; {status, salesCount}; colors.name |
| carts | user (unique), items[{product,color,size,quantity}] | user unique |
| wishlists | user (unique), collections[{name,slug}], items[{product,collectionId,addedAt}] | user unique, items.product |
| checkouts | user, items snapshot, shippingAddress, deliveryMethod, pricing, provider, providerSessionId, status, order, expiresAt | user, providerSessionId, status, TTL |
| orders | orderNumber, user, items[], shippingAddress, deliveryMethod, pricing, payment{provider,sessionId,paymentIntentId,status}, status, timeline[], paidAt, deliveredAt | orderNumber unique, {user, createdAt}, createdAt, payment.sessionId unique sparse, status |
| reviews | product, user, rating, title, body, verifiedPurchase | {product,user} unique, {product, createdAt} |
| userpreferences | user (unique), viewed[], categories/fabrics/colors/sizes/moods/fits maps, priceSamples[], styleTags[], searches[] | user unique |

Products are soft-deleted (`status: archived`) so order history stays intact. Cart lines are re-priced from products at read time. N+1 is avoided by batching product lookups (`$in`) for carts, wishlists and recommendations.

## Client state

Zustand stores: `session` (hydrated from the server-rendered user), `cart` and `wishlist` (optimistic mutations with rollback), `ui` (search overlay, assistant context, toasts). Server Components fetch through `lib/*`; client components call `/api/*` via a typed `api` client that surfaces field errors for forms.

## Performance and accessibility

- Server Components for every catalogue page; client bundles limited to interactive islands.
- `next/image` with AVIF/WebP, explicit `sizes`, blur-up reveal, and a colour-swatch fallback if a remote image fails.
- Route-level caching headers on public catalogue APIs; ISR on home/collections.
- Semantic landmarks, labelled controls, focus-trapping sheets, `aria-live` on results, visible focus rings, `prefers-reduced-motion` respected globally.
