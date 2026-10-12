# MASK merch MVP implementation note

This App Router implementation maps the product plan onto the repository's existing Next.js 16, React 19 and Mongoose stack. It retains the MASK shell and assets, adopts the main site's Cabin/black/red/white visual language, and uses CSS Modules for new UI. Public catalogue pages can render explicit placeholder seed data without MongoDB; order, payment and admin mutations always require MongoDB.

## Architecture

### Frontend art direction

The redesign was referenced against the live https://kgpmask.com homepage and the neighbouring MASK-Next reference repository, not a replacement app scaffold. It keeps Cabin, MASK red (#E43332), black/white contrast, the circular society logo, navigation underlines, poster-led imagery and the solid red footer. The store remains explicitly unofficial.

Repeated rounded panels, pill filters/actions, decorative gradient backgrounds, floating card hover transforms and boxed product facts were replaced with open image/caption layouts, compact ruled sections, underline filters and restrained near-square controls. The homepage now features actual catalogue artwork, with a staggered desktop collection and a compact red ordering-information band; catalogue thumbnails preserve the complete artwork rather than cropping it. Product pages retain the sliding/swipe gallery, separate fit/size/price controls, material/GSM and full-width size charts. Checkout, receipts, policies and admin views use the same simpler geometry without changes to payment or campaign logic. Mobile navigation keeps its slide-out behaviour, adds Escape dismissal and makes closed-menu links inert. Focus outlines and reduced-motion support remain explicit.

Verification: Prettier, ESLint, TypeScript, 17 focused unit/component tests and the production build passed. Production route/session verification passed all 35 checks, including all six artwork-folder products and images, signed-in checkout/orders, administrator pages, and denial of ordinary users at admin boundaries. Desktop homepage and narrow-screen product previews were inspected in headless Edge. No auth, database, payment or fulfilment contracts were changed for this redesign.

- Auth.js Google JWT sessions gate checkout and order history. `ADMIN_EMAILS` is a server-only allow-list checked again in every admin page and route.
- Mongoose models cover users, admins, products, variants, campaigns, carts, orders, payments and audit logs. Order lines contain immutable product, variant and price snapshots; money is integer paise.
- Checkout accepts only variant IDs and quantities, then reloads prices, active products and open campaigns from MongoDB before calculating the total.
- Payment proofs pass MIME signature/size validation into a private storage abstraction. MongoDB GridFS is supported for production, while the filesystem adapter is development-only and refuses production use.
- Admin verification uses conditional updates inside a MongoDB transaction. A repeated verification cannot increment MOQ twice. Refund recording is similarly conditional and idempotent.
- The current vendor accepts one piece per design, so catalogue and schema defaults use MOQ 1. Existing internal MOQ statuses remain compatible with stored orders, but the storefront describes made-to-order production without a five-piece requirement. Campaign MOQ is paid quantity across every variant of a design. Campaign decisions advance affected orders to confirmed or refund pending. Multi-campaign orders are confirmed only after every campaign has resolved successfully; one failed campaign makes the whole order refund pending (full-order refund assumption). Run `npx tsx scripts/single-piece-campaigns.ts` once for an existing database to lower draft/open campaigns to 1 without changing their statuses or payment counts.
- Vendor CSV groups confirmed pieces by design, garment type, size and SKU. Pickup CSV and order search support Gymkhana fulfilment.

## Production notes

Use a MongoDB replica set because payment/campaign mutations use transactions. Set `PAYMENT_PROOF_STORAGE=mongodb` in production; local proof storage intentionally fails closed. Replace seeded art, prices, garment specifications, dates, artist permissions, UPI data, contact details and policy copy before launch.
