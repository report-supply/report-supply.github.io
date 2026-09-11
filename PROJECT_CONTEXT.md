# KSA Supplier Watch — Updated Project Context

The site is now a **single supplier directory**. The root homepage is the only primary browsing experience.

## UI requirements implemented
- Removed the Good / Bad / Fraud / Submit navbar.
- Removed the sticky submit navbar.
- Root page lists all suppliers.
- Supplier names are clickable and open the supplier detail modal.
- Status tag is right aligned, separated from the name.
- Old Good/Fraud URLs redirect to the root list so stale links do not show the old category UI.

## Status rules
- `REPORT`: default when there is no clear voting advantage.
- `DECENT`: likes are higher than dislikes.
- `HIGH REPUTATION`: likes are at least 40% higher than dislikes.
- `100% FRAUD`: dislikes are at least 30% higher than likes.

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
