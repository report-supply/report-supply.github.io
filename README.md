# KSA Supplier Watch — v3.1.0

## [Visit Fraud SuppliersList Site](https://report-supply.github.io)

A static, paper-style listing website for community-reported supplier salary/payment issues.

- Version: v3.1.0
- Last update: 08 September 2026
- Author: Habibullah Muaz
- WhatsApp: +966 50 089 6152
- Region: Jubail, Dammam, KSA

## 🗂 Site structure
```
/                index.html    — full supplier list, search, like/dislike voting
/good/           index.html    — Good + Unverified suppliers
/fraud/          index.html    — auto-filtered list of suppliers voted "Fraud"
/submit/         index.html    — Web3Forms report submission
/suppliers-info.txt            — EDIT THIS to change supplier names/info/vote counts
/style.css                     — shared styles for every page
/shared.js                     — shared data-loading + voting/classification logic
/theme.js                      — shared dark/light theme toggle
```
All CSS/JS files are linked with **relative paths** (`style.css`, `../style.css`, etc.) so the
site keeps working when hosted at a subpath, like a GitHub Project Page.

**This requires being served over http(s)** (GitHub Pages, any web server, `python3 -m http.server`,
VS Code Live Server, etc.). Double‑clicking `index.html` to open it as a `file://` URL will not
work, because browsers block `fetch()` of local files that way.

## ✏️ Editing the supplier list
Open **`suppliers-info.txt`** in any text editor. One supplier per line:
```
Name | Info | BaseLikes | BaseDislikes
```
- Change a **Name** or **Info** and it updates on the site the next time the page loads.
- **BaseLikes / BaseDislikes** are optional starting counts you can set by hand (e.g. if you're
  importing votes gathered elsewhere). Real visitor votes are added on top of these.
- There's no "status" column to edit — Good / Fraud / Unverified is always calculated live from
  the vote counts, so it can't get out of sync with the numbers.
- Lines starting with `#` are comments and are ignored.

## 🚀 Recent Updates & Features
* **Editable data file:** supplier data now lives in `suppliers-info.txt` instead of being hardcoded — edit the file, refresh the site.
* **Like / Dislike voting with SVG icons:** every supplier card has thumbs-up / thumbs-down buttons (custom SVG, not emoji) that recolor when active.
* **Auto-sorted Good / Fraud / Unverified:** once a supplier has at least **20** total votes, it's classified:
  - **Good** — likes are ≥40% higher than dislikes
  - **Fraud** — dislikes are ≥20% higher than likes
  - Everything else (including suppliers under the 20-vote minimum) shows as **Unverified** on the Good page rather than disappearing.
* **Redesigned header + nav bar:** a horizontally-scrollable tab bar (All Suppliers / Good / Fraud / Submit Report) with live counts.
* **Fully responsive:** single-column supplier cards, stacked toolbar, scrollable nav on phones; two-column grid on tablet/desktop.
* **Direct Web3Forms Integration** for submitting new reports without WhatsApp.
* **Synchronized Dark/Light mode** across every page.

### ⚠️ About "one vote per IP"
This is a static site with no server, so there is nowhere to truly *enforce* a one-vote-per-IP
rule — that needs a backend with a shared database (e.g. a small Cloudflare Worker + KV, or
Supabase). What's implemented instead is a **best-effort deterrent**: the site looks up the
visitor's public IP once (via ipify) and locks votes per supplier inside that browser's storage.
This stops accidental double-voting from the same device, but a determined person can still vote
again by switching browsers, using incognito mode, or clearing site data — no static site can
prevent that. If you need real enforcement, that's the one piece here that would require adding
server infrastructure.

## ⚠️ Disclaimer
Important: the site intentionally labels entries as reports/claims rather than verified fraud findings. The Good/Fraud/Unverified auto-sorting reflects community voting only, not a legal or verified finding. Verify information independently and avoid publishing private personal information.
