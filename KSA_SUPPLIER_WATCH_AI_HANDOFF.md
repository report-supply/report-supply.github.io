# KSA Supplier Watch — Full Project Context & AI Handoff

> **2026-09 amendment (read first):** The project owner has since asked for the default status
> label to be `UNKNOWN` instead of `REPORT`, with a minimum-vote floor (5 total votes) before a
> supplier can be marked `HIGH REPUTATION` or `100% FRAUD` — this fixes a bug where a single vote
> triggered a verdict. `UNKNOWN` is now its own clickable status button that opens a popup asking
> the visitor to submit info. The homepage cards are now fully clickable (not just the name), a
> sticky "Submit" bar was added, the footer copyright opens a maintainer-info popup, a one-per-session
> welcome popup was added, and the visual design was refreshed (lower border-radius, Space Grotesk +
> IBM Plex Sans). See README.md and PROJECT_CONTEXT.md for the current source of truth; treat any
> conflicting statements below about the status system as superseded.


> **Purpose:** This document is a handoff specification for another AI/developer working on the KSA Supplier Watch website. Read the entire file before changing the project.
>
> **Important:** The project is a static supplier-directory website hosted/deployed through Cloudflare. The next major task is to finish the Cloudflare backend for globally shared Like/Dislike voting with IP-based vote restrictions.

---

## 1. Project Overview

**Project name:** KSA Supplier Watch

**Primary purpose:**  
A public supplier information directory for suppliers in KSA. Visitors should be able to browse the complete supplier list, open an individual supplier, view available extra information, and vote Like/Dislike based on their experience.

The website is **not supposed to be divided into separate Good, Bad, or Fraud browsing sections anymore**.

The homepage should be the central supplier directory.

### Current branding

- Page title: `KSA Supplier Information`
- Subtitle: `Community supplier directory`
- Author/copyright: `Muaz`
- Copyright format:
  `©YYYY - All Rights Reserved by Muaz.`
- The year is generated dynamically from the current year.
- Warning/danger-style visual identity is retained.
- Light/dark theme is supported.

---

# 2. Current User Experience

The root page `/index.html` is the main and primary user experience.

It contains:

1. Header / website branding
2. Light/dark theme button
3. Supplier count
4. Search field
5. Complete supplier list
6. Like/Dislike buttons for each supplier
7. Supplier status tag
8. Supplier information modal
9. Copyright footer

### Removed navigation

The following old navigation concepts should **not** return:

- GOOD
- BAD
- FRAUD
- SUBMIT as a primary navbar item
- Category navigation between Good/Fraud lists

The website should primarily show **all suppliers**.

The old `/good/` and `/fraud/` routes currently redirect to the root supplier directory so old links do not expose the previous category UI.

---

# 3. Supplier List

Supplier data is currently stored in:

```text
suppliers-info.txt
```

Format:

```text
Name | Info | BaseLikes | BaseDislikes
```

Example:

```text
Skywalk | Good company, but paying late due to company issues. | 4 | 2
Moosa Abdul Kareem | Good company, but paying late due to company issues. | 43 | 1
```

### Rules

- Lines beginning with `#` are comments.
- Blank lines are ignored.
- `Name` is required.
- `Info` is optional.
- `BaseLikes` is optional and represents starting/migrated likes.
- `BaseDislikes` is optional and represents starting/migrated dislikes.
- Real visitor votes must be added on top of these base values.
- Do **not** store a calculated status in `suppliers-info.txt`.
- Status must always be calculated dynamically from current vote totals.

The current project contains approximately 111 supplier records.

---

# 4. Supplier IDs

Supplier IDs are currently generated from the order in `suppliers-info.txt`.

The first valid supplier gets:

```text
id = 0
```

The next:

```text
id = 1
```

and so on.

The displayed number is `id + 1`, padded to two digits.

Example:

```text
01
02
03
```

### Important

Do not casually reorder suppliers in `suppliers-info.txt`, because the generated numeric ID is also used by:

```text
supplier-extra-info/data.json
```

and by the voting system.

If a permanent/production-grade identifier system is introduced later, migrate carefully so existing votes and extra information are not assigned to the wrong supplier.

---

# 5. Supplier Name UI

Every supplier name must be clickable.

Current implementation:

```html
<button class="supplier-name" onclick="showInfo(SUPPLIER_ID)">
    Supplier Name
</button>
```

Clicking the name opens the supplier information modal.

The supplier name should remain visually separate from the status tag.

---

# 6. Status System

The old status labels have been replaced.

Do **not** reintroduce:

- GOOD
- BAD
- FRAUD
- UNVERIFIED

The current status labels are:

```text
REPORT
DECENT
HIGH REPUTATION
100% FRAUD
```

The status tag is positioned on the **right side of the supplier card**, not beside the supplier name.

---

## 6.1 Status calculation

Current logic in `shared.js`:

```javascript
function classify(id) {
  const {likes,dislikes}=getVotes(id);

  if (likes===0 && dislikes===0) return 'report';

  if (likes > dislikes && likes >= dislikes*1.40) return 'high';

  if (likes > dislikes) return 'decent';

  if (dislikes > likes && dislikes >= likes*1.30) return 'fraud';

  return 'report';
}
```

Status labels:

```javascript
function statusLabel(id) {
  switch(classify(id)) {
    case 'high': return 'HIGH REPUTATION';
    case 'decent': return 'DECENT';
    case 'fraud': return '100% FRAUD';
    default: return 'REPORT';
  }
}
```

### Meaning

#### REPORT

Default state when:

- There are no votes, or
- Neither side has enough advantage to qualify for another status.

#### DECENT

Shown when:

```text
likes > dislikes
```

but the Like advantage does not reach the High Reputation threshold.

#### HIGH REPUTATION

Shown when:

```text
likes >= dislikes × 1.40
```

and likes are greater than dislikes.

Example:

```text
Likes: 14
Dislikes: 10
```

14 is 40% higher than 10, so:

```text
HIGH REPUTATION
```

#### 100% FRAUD

Shown when:

```text
dislikes >= likes × 1.30
```

and dislikes are greater than likes.

Example:

```text
Likes: 10
Dislikes: 13
```

13 is 30% higher than 10, so:

```text
100% FRAUD
```

### Important naming note

`100% FRAUD` is a UI label based on community voting sentiment. It does **not** mean the website has independently verified fraud.

Do not change the threshold logic casually without checking with the project owner.

---

# 7. Voting System

Visitors can vote:

```text
Like
Dislike
```

Each supplier has independent voting.

The frontend currently attempts to use the Cloudflare API first.

Endpoints:

```text
GET  /api/votes
POST /api/vote
```

If the Cloudflare API is unavailable, the current frontend falls back to browser `localStorage`.

---

# 8. REQUIRED NEXT STEP: CLOUDFLARE GLOBAL VOTING

## Critical requirement

The project owner explicitly wants:

> **Cloudflare storage to store Like/Dislike data globally and prevent repeated voting per IP address.**

The final production system should not rely on browser localStorage as the authoritative voting database.

LocalStorage may remain only as a UI convenience/fallback if desired, but it must not be considered secure vote enforcement.

---

# 9. Cloudflare Infrastructure

The intended Cloudflare infrastructure is:

### Worker

```text
report-supply-github-io
```

### Worker domain

```text
https://report-supply-github-io.ksa-official-report.workers.dev
```

### KV namespace

Binding:

```text
SUPPLY_KV
```

Namespace ID:

```text
19813bfbd7ef491eb8a887bb0aa948f7
```

---

# 10. Cloudflare API Files

Current API files:

```text
functions/
└── api/
    ├── vote.js
    └── votes.js
```

### `functions/api/votes.js`

Purpose:

```text
GET /api/votes
```

It returns the aggregate vote object stored in KV under:

```text
votes:all
```

Expected structure:

```json
{
  "25": {
    "likes": 10,
    "dislikes": 3
  }
}
```

---

# 11. Current Vote API Data Model

The current intended KV model is:

### Aggregate votes

```text
votes:all
```

Example:

```json
{
  "0": {
    "likes": 12,
    "dislikes": 2
  },
  "1": {
    "likes": 4,
    "dislikes": 8
  }
}
```

### Per-IP vote record

The current implementation hashes the connecting IP:

```text
SHA-256(IP)
```

and uses a key like:

```text
vote:<supplierId>:<hashedIP>
```

Example:

```text
vote:25:<sha256-hash>
```

The stored value is:

```json
{
  "vote": "like"
}
```

The raw IP address should **not** be stored.

---

# 12. IP-Based Voting Requirement

This is a major requirement and must remain in future changes.

The server should determine the visitor IP using Cloudflare's edge-provided header:

```text
CF-Connecting-IP
```

Do not trust an arbitrary client-supplied IP field.

The client must not be able to send:

```json
{
  "ip": "some-other-ip"
}
```

and bypass the restriction.

The server should derive the voter identity itself.

Current approach:

```javascript
const rawIP =
  request.headers.get("CF-Connecting-IP") ||
  request.headers.get("x-real-ip") ||
  "unknown";

const voterKey = await sha256(rawIP);
```

The raw IP is not stored.

---

# 13. What "One Vote Per IP" Should Mean

The intended rule is:

> A visitor/IP should have only one active vote per supplier.

That means:

```text
Supplier A + IP 1 = one active vote
Supplier B + IP 1 = another independent vote
Supplier A + IP 2 = independent vote
```

For the same supplier:

```text
IP 1 → Like
```

Then clicking Like again can remove the vote.

The current implementation behaves as a toggle:

```text
No vote
   ↓
Like
   ↓
click Like again
   ↓
No vote
```

And:

```text
Like
   ↓
click Dislike
   ↓
Dislike
```

The old Like must be removed before the new Dislike is added.

This behavior should be preserved unless intentionally redesigned.

---

# 14. Important Cloudflare KV Limitation

Cloudflare KV is eventually consistent and does not provide an atomic read-modify-write counter.

The current implementation does:

1. Read the per-IP vote.
2. Read `votes:all`.
3. Modify the object.
4. Write the per-IP record.
5. Write `votes:all`.

This can produce lost updates if many users vote at exactly the same time.

For a small/low-volume site, KV may be acceptable.

For a high-volume production voting system, consider:

- Durable Objects
- D1 with transactional updates

Do not claim KV provides atomic counters.

---

# 15. Recommended Future Cloudflare Architecture

If staying with KV:

```text
Browser
   │
   ├── GET /api/votes
   │       │
   │       └── Cloudflare Worker → SUPPLY_KV
   │
   └── POST /api/vote
           │
           ├── read CF-Connecting-IP
           ├── hash IP
           ├── check vote:<supplier>:<hash>
           ├── update aggregate vote
           ├── save voter record
           └── return current vote totals
```

The server must be the authority for whether a vote is allowed.

---

# 16. Frontend Vote Loading

`shared.js` loads cloud votes using:

```javascript
fetch('/api/votes', {
    headers: {'Accept':'application/json'},
    cache:'no-store'
});
```

The result is stored in:

```javascript
cloudVotes
```

and:

```javascript
cloudVotesLoaded
```

The vote calculation combines:

```text
BaseLikes
+
Cloud Likes
+
Local fallback votes (only when cloud data is unavailable)
```

Same concept for dislikes.

---

# 17. Frontend Vote Submission

Current endpoint:

```text
POST /api/vote
```

Body:

```json
{
  "supplier": 25,
  "vote": "like"
}
```

or:

```json
{
  "supplier": 25,
  "vote": "dislike"
}
```

The server must validate:

- supplier is an integer
- supplier is valid
- vote is exactly `like` or `dislike`

The server returns the updated vote state.

---

# 18. Supplier Extra Information

A separate directory was created:

```text
supplier-extra-info/
```

Current files:

```text
supplier-extra-info/
├── README.md
└── data.json
```

This folder exists specifically so supplier metadata does not have to be mixed into the main supplier list.

---

# 19. Extra Info Data Format

`data.json` uses the supplier's numeric ID.

Example:

```json
{
  "25": {
    "supplierName": "Explore the Future",
    "photo": "",
    "mapLocation": "",
    "phoneNumber": "",
    "whatsappLink": ""
  }
}
```

Fields:

```text
supplierName
photo
mapLocation
phoneNumber
whatsappLink
```

### Field meanings

#### photo

Supply office photo URL.

Example:

```json
"photo": "https://example.com/office.jpg"
```

#### mapLocation

Google Maps URL.

Example:

```json
"mapLocation": "https://maps.google.com/..."
```

#### phoneNumber

Supplier phone number.

Example:

```json
"phoneNumber": "+966..."
```

#### whatsappLink

WhatsApp channel/group URL.

Example:

```json
"whatsappLink": "https://chat.whatsapp.com/..."
```

---

# 20. Empty Extra Information

When information is unavailable, leave the field empty:

```json
"photo": "",
"mapLocation": "",
"phoneNumber": "",
"whatsappLink": ""
```

The frontend displays placeholders.

### Photo placeholder

```text
Photo is not available at the moment <try submit?>
```

The `<try submit?>` text links to:

```text
/submit/index.html
```

### Map placeholder

```text
I will add Location later
```

### Phone placeholder

```text
Not available at the moment
```

### WhatsApp placeholder

```text
Not available at the moment
```

---

# 21. Supplier Detail Modal

Clicking a supplier name opens a modal.

The modal currently includes:

```text
SUPPLIER INFORMATION

Supplier Name

Supply Office Photo
[photo or placeholder]

Google Map Location
[value/link or placeholder]

Phone Number
[value/link or placeholder]

WhatsApp Channel / Group
[value/link or placeholder]

Community report
[existing supplier info if available]

Likes / Dislikes

Community disclaimer
```

The modal can be closed by:

- Close button
- Clicking backdrop
- Pressing Escape

---

# 22. Search

The homepage has a supplier search field.

Search currently checks:

```text
supplier name
supplier info
```

The visible supplier count updates according to the filtered results.

Search is client-side.

---

# 23. Current Important Files

Project structure:

```text
report-supply.github.io-main/
│
├── index.html
├── shared.js
├── style.css
├── theme.js
├── suppliers-info.txt
├── README.md
├── PROJECT_CONTEXT.md
├── CLOUDFLARE_KV_SETUP.md
├── wrangler.jsonc
├── .cloudflareignore
├── .gitignore
│
├── supplier-extra-info/
│   ├── README.md
│   └── data.json
│
├── functions/
│   └── api/
│       ├── vote.js
│       └── votes.js
│
├── submit/
│   └── index.html
│
├── good/
│   └── index.html
│
├── fraud/
│   └── index.html
│
└── shared.js.localstorage-backup
```

---

# 24. File Responsibilities

## `index.html`

Main website.

Responsible for:

- Header
- Theme button
- Search
- Supplier list
- Status display
- Like/dislike buttons
- Supplier information modal
- Footer

---

## `shared.js`

Core application logic.

Responsible for:

- Loading supplier data
- Parsing `suppliers-info.txt`
- Loading `supplier-extra-info/data.json`
- Loading Cloudflare votes
- Local vote fallback
- Combining base + cloud vote totals
- Sending votes
- Supplier status classification
- Status labels
- Supplier extra-info access
- HTML escaping

Do not duplicate this logic unnecessarily inside individual pages.

---

## `style.css`

Shared visual styling.

Responsible for:

- Layout
- Supplier cards
- Status tags
- Buttons
- Modal
- Search
- Responsive behavior
- Light/dark themes
- Placeholder styling

---

## `theme.js`

Light/dark theme functionality.

---

## `suppliers-info.txt`

Main supplier source data.

Do not put calculated status here.

---

## `supplier-extra-info/data.json`

Optional supplier metadata.

Do not mix voting data into this file.

---

## `functions/api/votes.js`

Cloudflare API for reading aggregate votes.

---

## `functions/api/vote.js`

Cloudflare API for creating/removing/changing a visitor vote.

---

## `submit/index.html`

Existing supplier/report submission page.

It is no longer a primary navbar destination, but the photo placeholder may link to it with:

```text
<try submit?>
```

---

# 25. Important Existing Supplier Notes

Some supplier entries already have information in `suppliers-info.txt`.

Examples include:

```text
Sahara Gen. Contracting | Payment issues
MMGC Supplier | Unpaid: 4 months
Whitepaper | Unpaid: 3 months
Craft Innovation Cont. | Unpaid: 10 months
Altayar Nahdat Cont. Co. | Unpaid: 4 months
JVR Global Co. | Fraud reported
Smartech | Payment issues
Alkaabi | Unpaid: 10 months
Amaziy Global Ltd. Co. | Salary issues
Middle East Cont. Co. | Unpaid: 8 months
Sinohydro | Salary issues
MEG Mubadala East Gen. Cont. Co. | Salary issues
Expert Arabia | Unpaid: 6 months
Innovative Solutions | Salary issues
Msquare | Unpaid: 8 months
ASB Shamukh Al Barzco | Unpaid: 6 months
Saqco Arabia (Khobar) | Non-payment
Zuwa Group | Delayed payments
EMARABIA Global | Unpaid: 4 months
Al Waseet Adhbi | Unpaid: 5 months (Anabeeb)
```

These are community/site data and should not be presented as independently verified facts.

Two existing positive-but-late examples:

```text
Skywalk | Good company, but paying late due to company issues. | 4 | 2
Moosa Abdul Kareem | Good company, but paying late due to company issues. | 43 | 1
```

---

# 26. Important Safety/Accuracy Principle

The website is based on community reports and voting.

Do not silently convert:

```text
community vote
```

into:

```text
verified legal fact
```

The `100% FRAUD` label is the requested UI classification based on the voting threshold, not a legal determination.

Keep the existing disclaimer in supplier details.

---

# 27. Known Configuration Problem

The current `wrangler.jsonc` in the project is still a placeholder-style configuration:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "WORKER-NAME",
  "main": "src/index.ts",
  "compatibility_date": "2025-02-04",
  "observability": {
    "enabled": true
  },
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "19813bfbd7ef491eb8a887bb0aa948f7",
      "preview_id": "<ID_OF_PREVIEW_KV_NAMESPACE_FOR_LOCAL_DEVELOPMENT>"
    }
  ]
}
```

However, the application code expects:

```text
SUPPLY_KV
```

not:

```text
KV
```

This needs to be reconciled before production deployment.

The intended binding name is:

```text
SUPPLY_KV
```

---

# 28. Cloudflare Deployment Goal

The final deployment should make these work:

```text
GET  /api/votes
POST /api/vote
```

and the Worker must have access to:

```text
SUPPLY_KV
```

The static website and Functions need to be deployed in a way that allows the browser to call:

```text
/api/votes
/api/vote
```

without requiring a separate public backend domain.

---

# 29. IP Voting Security Checklist

Before declaring the voting system finished, verify all of these:

- [ ] Server receives IP from Cloudflare edge.
- [ ] Client cannot choose its own IP identity.
- [ ] Raw IP is not persisted in KV.
- [ ] IP is hashed before being used as the voter key.
- [ ] Vote identity is scoped to supplier ID.
- [ ] One active vote per IP per supplier.
- [ ] Like → Like can remove the vote.
- [ ] Dislike → Dislike can remove the vote.
- [ ] Like → Dislike changes the vote rather than creating two votes.
- [ ] Dislike → Like changes the vote.
- [ ] Aggregate counts are updated consistently.
- [ ] Invalid supplier IDs are rejected.
- [ ] Invalid vote values are rejected.
- [ ] Vote API responses are not cached.
- [ ] Browser cannot directly modify aggregate counts.
- [ ] Base votes are kept separate from visitor votes.
- [ ] Concurrent voting limitations of KV are understood.
- [ ] If traffic becomes significant, migrate counter updates to Durable Objects or D1.

---

# 30. Do Not Break These Requirements

When modifying the project, do **not**:

1. Restore the old Good/Bad/Fraud navbar.
2. Put the status tag beside the supplier name.
3. Store calculated statuses inside `suppliers-info.txt`.
4. Mix extra supplier metadata into the voting database.
5. Allow the browser to submit an arbitrary IP address.
6. Store raw visitor IP addresses unnecessarily.
7. Make localStorage the authoritative global vote database.
8. Remove supplier names or reorder supplier records without considering IDs.
9. Remove the supplier detail modal.
10. Remove the extra-info fields.
11. Change the requested status thresholds without approval.
12. Treat `100% FRAUD` as a legally verified determination.
13. Claim Cloudflare KV counters are atomic.

---

# 31. Desired Final Architecture

The clean architecture should be:

```text
                    ┌─────────────────────────┐
                    │       Cloudflare        │
                    │                         │
                    │  Static Site + Worker   │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┴──────────────────┐
             │                                      │
             ▼                                      ▼
      Static website                          API Functions
      ┌──────────────┐                     ┌─────────────────┐
      │ index.html   │                     │ /api/votes      │
      │ shared.js    │◄────────────────────│ /api/vote       │
      │ style.css    │                     └────────┬────────┘
      │ theme.js     │                              │
      └──────┬───────┘                              ▼
             │                               ┌─────────────┐
             │                               │ SUPPLY_KV   │
             ▼                               └─────────────┘
      ┌────────────────────┐
      │ suppliers-info.txt │
      └────────────────────┘

      ┌────────────────────────────┐
      │ supplier-extra-info/       │
      │ data.json                  │
      │ photo                      │
      │ mapLocation                │
      │ phoneNumber                │
      │ whatsappLink               │
      └────────────────────────────┘
```

---

# 32. Future Improvement: Stable Supplier IDs

The current project derives IDs from list order.

A better long-term format would be something like:

```json
{
  "id": "skywalk",
  "name": "Skywalk",
  ...
}
```

or:

```text
SUP-001
SUP-002
```

This would prevent accidental ID changes if the supplier list is reordered.

However, **do not perform this migration casually** because the current KV vote keys and `supplier-extra-info/data.json` depend on the existing IDs.

---

# 33. AI Instructions

When another AI takes over this project:

### First

Inspect:

```text
index.html
shared.js
style.css
suppliers-info.txt
supplier-extra-info/data.json
functions/api/vote.js
functions/api/votes.js
wrangler.jsonc
CLOUDFLARE_KV_SETUP.md
```

### Then

Understand the current architecture before editing.

### For Cloudflare voting work

Treat this requirement as mandatory:

> **Like/Dislike data must be globally stored using Cloudflare infrastructure, and a visitor must not be able to repeatedly vote for the same supplier from the same IP.**

Use Cloudflare's server-side request information to identify the visitor.

Do not trust client-provided IP data.

### For UI work

Preserve:

```text
All suppliers on homepage
Clickable supplier names
Right-aligned status tags
REPORT
DECENT
HIGH REPUTATION
100% FRAUD
Supplier detail modal
Supplier Extra Info folder
```

---

# 34. Current Status

### UI

Mostly implemented.

### Supplier directory

Implemented.

### Clickable supplier names

Implemented.

### Status system

Implemented.

### Extra supplier information

Implemented.

### Supplier photo placeholder

Implemented.

### Map placeholder

Implemented.

### Phone field

Implemented.

### WhatsApp field

Implemented.

### Cloudflare API files

Present.

### Cloudflare KV binding

**Needs final configuration/reconciliation.**

### Global IP-based voting

**Implementation exists, but must be tested and hardened before being considered production-ready.**

### Atomic/concurrent vote safety

**Not guaranteed by KV.**

---

# 35. Final Priority

The next AI/developer should prioritize:

## Priority 1 — Cloudflare KV

Make sure the actual deployed Worker/Pages Function has:

```text
SUPPLY_KV
```

bound to:

```text
19813bfbd7ef491eb8a887bb0aa948f7
```

and verify:

```text
GET /api/votes
POST /api/vote
```

work in production.

## Priority 2 — IP restriction

Verify that:

```text
same IP + same supplier
```

cannot create multiple simultaneous votes.

The voter may toggle/change their existing vote, but must not be able to inflate the aggregate count repeatedly.

## Priority 3 — Data consistency

Make sure:

```text
BaseLikes + CloudLikes
BaseDislikes + CloudDislikes
```

are calculated correctly.

## Priority 4 — Concurrency

If the site receives enough traffic that simultaneous votes become a concern, replace the KV read-modify-write counter with:

```text
Durable Objects
```

or a transactional:

```text
D1
```

implementation.

---

# 36. Short Handoff Summary

This is a **KSA supplier directory**.

The homepage lists every supplier.

Supplier names are clickable.

Each supplier has Like/Dislike voting.

The status is calculated automatically:

```text
REPORT
DECENT
HIGH REPUTATION
100% FRAUD
```

based on voting ratios.

Supplier metadata is separated into:

```text
supplier-extra-info/data.json
```

with:

```text
photo
mapLocation
phoneNumber
whatsappLink
```

The site uses Cloudflare Functions:

```text
/api/votes
/api/vote
```

and the intended KV binding is:

```text
SUPPLY_KV
```

The most important unfinished production requirement is:

> **Use Cloudflare storage as the authoritative global voting system and enforce one active vote per IP address per supplier, without storing raw IP addresses.**

Do not restore the old Good/Bad/Fraud navigation system.
