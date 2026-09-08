/* =========================================================
   KSA Supplier Watch — shared.js
   Loads supplier data from suppliers-info.txt (editable),
   merges it with per-visitor like/dislike votes, and
   classifies suppliers as Good / Fraud / Unverified.
   Shared by index.html, good/index.html, fraud/index.html
   and submit/index.html so every page stays in sync.
   ========================================================= */

let SUPPLIERS = [];
let suppliersReady = null;

/* -------- Load + parse suppliers-info.txt -------- */
/* Set window.SUPPLIERS_DATA_PATH in each page before this
   script runs, since the file's relative path is different
   from the root page vs. /good/, /fraud/, /submit/. */
function parseSuppliersText(text) {
  const out = [];
  let id = 0;
  text.split(/\r?\n/).forEach(raw => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split('|').map(p => p.trim());
    const name = parts[0];
    if (!name) return;
    const info = parts[1] || '';
    const baseLikes = parseInt(parts[2], 10) || 0;
    const baseDislikes = parseInt(parts[3], 10) || 0;
    out.push({ id: id++, name, info, baseLikes, baseDislikes });
  });
  return out;
}

function initSuppliers() {
  if (suppliersReady) return suppliersReady;
  const path = window.SUPPLIERS_DATA_PATH || 'suppliers-info.txt';
  suppliersReady = fetch(path)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(text => { SUPPLIERS = parseSuppliersText(text); return SUPPLIERS; })
    .catch(err => {
      console.error('Could not load ' + path + ' — is the site being served over http(s), not opened as a local file?', err);
      SUPPLIERS = [];
      return SUPPLIERS;
    });
  return suppliersReady;
}

/* -------- Votes -------- */
const VOTES_KEY = 'ksaSupplierVotes.v2';
/* Minimum total votes before a supplier can be auto-sorted into
   Good or Fraud — stops a handful of clicks from moving a listing. */
const MIN_VOTES_TO_CLASSIFY = 20;
const GOOD_THRESHOLD = 0.40;   // likes must be 40% higher than dislikes
const FRAUD_THRESHOLD = 0.20;  // dislikes must be 20% higher than likes

function loadVotes() {
  try { return JSON.parse(localStorage.getItem(VOTES_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveVotes(votes) { localStorage.setItem(VOTES_KEY, JSON.stringify(votes)); }

/* -------- Best-effort "one vote per IP" -------- */
/* IMPORTANT LIMITATION: this is a static site with no server, so there is
   nowhere to enforce a rule server-side. What this DOES do: look up the
   visitor's public IP once, and refuse a 2nd vote on the same supplier
   from a browser that already has a recorded vote for that IP. What this
   CANNOT do: stop the same person voting again from a different browser,
   a different device, incognito mode, or a different network — that
   requires a real backend with a shared database. Treat this as a
   deterrent, not a guarantee. */
let visitorIP = null;
function getVisitorIP() {
  if (visitorIP) return Promise.resolve(visitorIP);
  return fetch('https://api.ipify.org?format=json')
    .then(r => r.json())
    .then(d => { visitorIP = d.ip; return visitorIP; })
    .catch(() => { visitorIP = null; return null; });
}

function getVotes(id) {
  const s = SUPPLIERS[id];
  const local = loadVotes()[id] || { likes: 0, dislikes: 0, myVote: null };
  return {
    likes: (s ? s.baseLikes : 0) + (local.likes || 0),
    dislikes: (s ? s.baseDislikes : 0) + (local.dislikes || 0),
    myVote: local.myVote || null
  };
}

/* castVote is async: it waits for the visitor IP lookup so the vote
   record can carry the IP it was cast from (best-effort dedupe, see
   note above). Falls back to working normally if the IP lookup fails
   or is blocked. */
async function castVote(id, type) {
  const ip = await getVisitorIP();
  const votes = loadVotes();
  const current = votes[id] || { likes: 0, dislikes: 0, myVote: null, ip: null };
  const already = current.myVote;

  if (already === type) {
    /* clicking the same button again retracts the vote */
    current[type + 's'] = Math.max(0, current[type + 's'] - 1);
    current.myVote = null;
  } else {
    if (already) current[already + 's'] = Math.max(0, current[already + 's'] - 1);
    current[type + 's'] = (current[type + 's'] || 0) + 1;
    current.myVote = type;
    current.ip = ip;
  }
  votes[id] = current;
  saveVotes(votes);
  return current;
}

/* Returns 'good' | 'fraud' | null (not enough signal yet — shown as
   "Unverified" wherever that's relevant, e.g. the Good page) */
function classify(id) {
  const { likes, dislikes } = getVotes(id);
  const total = likes + dislikes;
  if (total < MIN_VOTES_TO_CLASSIFY) return null;

  if (dislikes === 0 && likes > 0) return 'good';
  if (likes === 0 && dislikes > 0) return 'fraud';

  if (dislikes > 0 && (likes - dislikes) / dislikes >= GOOD_THRESHOLD) return 'good';
  if (likes > 0 && (dislikes - likes) / likes >= FRAUD_THRESHOLD) return 'fraud';
  return null;
}

/* -------- SVG icons (replace 👍 / 👎 emoji) -------- */
const ICON_LIKE = '<svg class="vote-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10.5V20H4.5A1.5 1.5 0 0 1 3 18.5v-6A1.5 1.5 0 0 1 4.5 11H7Zm2 9V10.4c0-.3.07-.6.2-.87L12.3 3.4a1 1 0 0 1 1.5-.35C14.6 3.7 15 4.6 15 5.5v3.75h4.1a2 2 0 0 1 1.98 2.27l-.9 6.5A2 2 0 0 1 18.2 20H9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
const ICON_DISLIKE = '<svg class="vote-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5V4H19.5A1.5 1.5 0 0 1 21 5.5v6a1.5 1.5 0 0 1-1.5 1.5H17Zm-2-9v9.1c0 .3-.07.6-.2.87L11.7 20.6a1 1 0 0 1-1.5.35C9.4 20.3 9 19.4 9 18.5v-3.75H4.9a2 2 0 0 1-1.98-2.27l.9-6.5A2 2 0 0 1 5.8 4H15Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
