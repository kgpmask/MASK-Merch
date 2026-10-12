# MASK merch MVP implementation note

This App Router implementation maps the product plan onto the repository's existing Next.js 16, React 19 and Mongoose stack. It retains the MASK shell and assets, adopts the main site's Cabin/black/red/white visual language, and uses CSS Modules for new UI. Public catalogue pages can render explicit placeholder seed data without MongoDB; order, payment and admin mutations always require MongoDB.

## Architecture

### Back-name personalization

Every design requires "Name to be displayed on the back", with no additional charge currently. Names are trimmed and Unicode-normalized; validation is shared with the server and currently allows up to 30 characters. This limit is defined in `src/lib/store/personalization.ts` and should be confirmed with the vendor. A cart line's identity includes both variant and exact name, so different names never merge. Quantity applies the same name to every piece on that line. Checkout persists the name in saved cart items and immutable order item snapshots, and displays it in review, receipts and admin orders. Vendor CSV adds `Name on Back` and groups different names separately; pickup CSV includes names in item descriptions. Existing unnamed orders remain readable; unnamed legacy cart items must be re-added with a name before checkout. No test orders have been reset or deleted.

### Behaviour-preserving hygiene pass

- Removed the unreferenced legacy `Button.jsx`, its CSS Module, the empty `page.module.css`, and the inactive `.eslintrc.json` (ESLint uses `eslint.config.mjs`). Removed the unused `OrderView` type and obsolete store-page CSS selectors; merged duplicate filter declarations without changing their effective styles.
- Removed unused direct dependencies `react-icons`, `lint-staged`, and `@vitejs/plugin-react`; updated the lockfile through npm. Existing Husky commands are unchanged.
- Shared payment-proof fields and multipart transport between checkout and order detail. Kept each page's headings, hints, button labels, validation, error messages and success behaviour unchanged. No payment/status/security rules were removed.
- Indexed catalogue campaign/variant lookups once per request, preserving product order, variant order, first matching campaign and omission of products without campaigns.
- Enabled TypeScript `noUnusedLocals`/`noUnusedParameters`. Retained seed fallbacks, campaign state guards, legacy JSON compatibility and the one-time MOQ migration because they still support persisted data and required workflows. No tests or artwork assets were deleted.
- Verification: formatting, lint, type-check, all 39 tests, production build and all 35 production route/auth checks passed. Local environment variables and receiving-account QR remain Git-ignored.

### Admin order operations

The admin dashboard exposes actionable queues for submitted payments, paid orders awaiting confirmation, pending refunds and ready orders, plus recent activity and verified/refund values. The paginated order register searches name, email or order number and links to a protected full review page containing customer data, immutable line-item and price snapshots, personalization, payment evidence, the private proof image, refund data and audit history.

Admins can verify or reject submitted payments, manually confirm a verified order, mark it ready and collected, cancel eligible orders, and record a completed refund. Actions remain constrained to valid transitions: submitted payments must be reviewed before cancellation, unpaid cancellations become `cancelled`, and paid cancellations become `refund_pending`. Cancellation and confirmation require reasons and are conditional/idempotent; cancelling paid work decrements campaign paid counts once. A cancellation never sends or claims a refund—the authorised account holder must send it before recording its UTR, amount, time and operator.

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
