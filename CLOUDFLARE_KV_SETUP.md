# Cloudflare KV Voting Setup

The project now contains Cloudflare Pages Functions for global Like/Dislike data.

## Files added

- `functions/api/votes.js` — GET `/api/votes`
- `functions/api/vote.js` — POST `/api/vote`
- `wrangler.jsonc` — KV binding placeholder
- `shared.js.localstorage-backup` — backup of the previous frontend file

## Cloudflare binding

In the Cloudflare Workers & Pages project, bind your existing KV namespace:

- **Type:** KV Namespace
- **Variable name:** `SUPPLY_KV`
- **KV namespace:** select your existing namespace

The `wrangler.jsonc` file deliberately contains:

`REPLACE_WITH_YOUR_KV_NAMESPACE_ID`

Replace that placeholder with your KV namespace ID only if you choose to manage the binding through Wrangler configuration.

No `.env` file is required.

## API

Frontend:

- `GET /api/votes`
- `POST /api/vote`

Example POST:

```json
{
  "supplier": 25,
  "vote": "like"
}
```

The server uses Cloudflare's `CF-Connecting-IP` to derive an SHA-256 voter key. The raw IP is not stored.

## Important

Workers KV is not an atomic counter database. The implementation is suitable for normal/small traffic, but very high simultaneous voting should use a transactional primitive such as Durable Objects or D1.
