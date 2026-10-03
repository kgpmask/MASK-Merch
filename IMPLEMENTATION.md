# MASK merch MVP implementation note

This App Router implementation maps the product plan onto the repository's existing Next.js 16, React 19 and Mongoose stack. It retains the MASK shell and assets, adopts the main site's Cabin/black/red/white visual language, and uses CSS Modules for new UI. Public catalogue pages can render explicit placeholder seed data without MongoDB; order, payment and admin mutations always require MongoDB.

## Architecture

- Auth.js Google JWT sessions gate checkout and order history. `ADMIN_EMAILS` is a server-only allow-list checked again in every admin page and route.
- Mongoose models cover users, admins, products, variants, campaigns, carts, orders, payments and audit logs. Order lines contain immutable product, variant and price snapshots; money is integer paise.
- Checkout accepts only variant IDs and quantities, then reloads prices, active products and open campaigns from MongoDB before calculating the total.
- Payment proofs pass MIME/size validation into a private storage abstraction. The included filesystem adapter is development-only and refuses production use.
- Admin verification uses conditional updates inside a MongoDB transaction. A repeated verification cannot increment MOQ twice. Refund recording is similarly conditional and idempotent.
- Campaign MOQ is paid quantity across every variant of a design. Campaign decisions advance affected orders to confirmed or refund pending. Multi-campaign orders are confirmed only after every campaign has resolved successfully; one failed campaign makes the whole order refund pending (full-order refund assumption).
- Vendor CSV groups confirmed pieces by design, garment type, size and SKU. Pickup CSV and order search support Gymkhana fulfilment.

## Production notes

Use a MongoDB replica set because payment/campaign mutations use transactions. Implement the `ProofStorage` interface for the selected private object store before setting `NODE_ENV=production`; local proof storage intentionally fails closed. Replace seeded art, prices, garment specifications, dates, artist permissions, UPI data, contact details and policy copy before launch.
