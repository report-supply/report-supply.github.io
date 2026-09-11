# KSA Supplier Watch

A single-page supplier information directory for KSA. The homepage lists every supplier; there are no Good/Fraud navigation tabs. `/good/` and `/fraud/` are kept only as redirect stubs so old links still land on the directory.

## Current behavior
- All suppliers are listed on `/index.html`, one per card, full-width on mobile.
- The whole card is clickable and opens the supplier detail modal — not just the name.
- Statuses: `UNKNOWN`, `DECENT`, `HIGH REPUTATION`, and `100% FRAUD`.
- A supplier needs at least **5 total votes** before it can be marked `HIGH REPUTATION` or `100% FRAUD`. Below that floor — or whenever neither side has a clear lead — the status is `UNKNOWN`. (Previously a single vote could trigger a verdict; this floor fixes that.)
- `100% FRAUD` appears when dislikes are at least 30% higher than likes (and the vote floor is met).
- `HIGH REPUTATION` appears when likes are at least 40% higher than dislikes (and the vote floor is met).
- The `UNKNOWN` tag is its own clickable button — tapping it opens a popup explaining why the supplier has no verdict yet and links to the submit page.
- A sticky bottom bar ("Want to report more suppliers? Submit") links to `/submit/`.
- The footer copyright is clickable and opens a small popup with the maintainer's photo and info.
- A welcome popup appears once per browser session, with the whole page blurred behind it.
- Supplier detail data lives in `supplier-extra-info/data.json`.
- Extra fields: office photo, Google Maps location, phone number, WhatsApp channel/group link.
- Empty photo fields show `Photo is not available at the moment <try submit?>`; empty map fields show `I will add Location later`.
- Copyright year updates automatically.
- Dark/light theme remains available.
- Design uses a modern, low-radius visual style (Space Grotesk headings, IBM Plex Sans body).

## Supplier data
`suppliers-info.txt` remains the main supplier list and supports:
`Name | Info | BaseLikes | BaseDislikes`

## Cloudflare KV voting
The frontend uses `/api/votes` and `/api/vote` when the configured `SUPPLY_KV` binding is available. If the API is unavailable, voting falls back to browser local storage.
