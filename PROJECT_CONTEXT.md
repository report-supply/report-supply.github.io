# KSA Supplier Watch — Updated Project Context

The site is a **single supplier directory**. The root homepage is the only primary browsing experience. `/good/` and `/fraud/` exist only as redirect stubs to `/index.html`.

## UI requirements implemented
- Removed the Good / Bad / Fraud / Submit navbar (and never reintroduced).
- Root page lists all suppliers; every card is fully clickable, not just the name.
- Status tag is right aligned, separated from the name.
- Sticky bottom bar: "Want to report more suppliers? Submit" → `/submit/`.
- Footer copyright is clickable → maintainer info popup with photo.
- Welcome popup on first load per session, full-page blur behind it.
- Modern, lower-border-radius visual design (Space Grotesk + IBM Plex Sans).

## Status rules (updated)
- `UNKNOWN`: default when there are fewer than 5 total votes, or neither side has a clear voting advantage. Replaces the old default label "REPORT". The `UNKNOWN` tag is a separate clickable button that opens a popup encouraging the visitor to submit information.
- `DECENT`: likes are higher than dislikes (vote floor met).
- `HIGH REPUTATION`: likes are at least 40% higher than dislikes (vote floor met).
- `100% FRAUD`: dislikes are at least 30% higher than likes (vote floor met).
- The 5-vote floor fixes a bug where a single like/dislike could trigger `HIGH REPUTATION`/`100% FRAUD` outright.

## Supplier Extra Info
The folder `supplier-extra-info/` contains `data.json` and a README. Each supplier ID has fields for:
- `photo`
- `mapLocation`
- `phoneNumber`
- `whatsappLink`

Empty values are displayed as placeholders.

## Data
`suppliers-info.txt` remains the source of supplier names, descriptions and base votes.

## Voting
`shared.js` attempts Cloudflare KV API voting first and falls back to local storage when the API is unavailable.
