# MASK Merch

Manual-UPI preorder store for Manga and Anime Society Kharagpur. See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for the architecture/spec mapping.

To add artwork, create one folder per design inside `designs/artwork/`, put all its pictures in that folder, and edit the matching folder-name entry in `designs/catalog.json` for price, garment, material, GSM and size chart. See [the design folder guide](./designs/README.md) for examples and deployment details.

## Setup

1. Install the Node version in `package.json` (Volta) and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill the server-only values.
3. Start a MongoDB replica set locally or create a MongoDB Atlas deployment.
4. In Google Cloud Console, create OAuth web credentials. Add `http://localhost:3000/api/auth/callback/google` locally and the equivalent production callback.
5. Generate `AUTH_SECRET` with `npx auth secret`.
6. Seed replaceable placeholder catalogue data with `npm run seed`.
7. Start with `npm run dev` and open `/store`.

## Commands

```text
npm run seed
npm run lint
npm run typecheck
npm test
npm run build
```

Payment proofs use private MongoDB GridFS storage when `PAYMENT_PROOF_STORAGE=mongodb`. For local development, `PAYMENT_PROOF_STORAGE=local` writes to `.private/payment-proofs`; never use that filesystem mode in production.
