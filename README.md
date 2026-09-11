# KSA Supplier Watch

A single-page supplier information directory for KSA. The homepage lists every supplier; there are no Good/Fraud navigation tabs.

## Current behavior
- All suppliers are listed on `/index.html`.
- Supplier names are clickable and open a detail modal.
- The status tag is right-aligned and never placed beside the supplier name.
- Statuses: `REPORT`, `DECENT`, `HIGH REPUTATION`, and `100% FRAUD`.
- `100% FRAUD` appears when dislikes are at least 30% higher than likes.
- `DECENT` appears when likes are higher than dislikes.
- `HIGH REPUTATION` appears when likes are at least 40% higher than dislikes.
- With no clear advantage, the status remains `REPORT`.
- Supplier detail data lives in `supplier-extra-info/data.json`.
- Extra fields: office photo, Google Maps location, phone number, WhatsApp channel/group link.
- Empty photo fields show `Photo is not available at the moment <try submit?>`; empty map fields show `I will add Location later`.
- Copyright year updates automatically.
- Dark/light theme remains available.

## Supplier data
`suppliers-info.txt` remains the main supplier list and supports:
`Name | Info | BaseLikes | BaseDislikes`

## Cloudflare KV voting
The frontend uses `/api/votes` and `/api/vote` when the configured `SUPPLY_KV` binding is available. If the API is unavailable, voting falls back to browser local storage.
