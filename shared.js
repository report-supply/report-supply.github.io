/* KSA Supplier Watch — shared data, votes, status and supplier extra-info. */

let SUPPLIERS = [];
let SUPPLIER_EXTRA_INFO = {};
let suppliersReady = null;
let cloudVotes = {};
let cloudVotesLoaded = false;
const VOTES_KEY = 'ksaSupplierVotes.v2';

function parseSuppliersText(text) {
  const out = []; let id = 0;
  text.split(/\r?\n/).forEach(raw => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split('|').map(p => p.trim());
    const name = parts[0]; if (!name) return;
    out.push({ id: id++, name, info: parts[1] || '', baseLikes: parseInt(parts[2],10)||0, baseDislikes: parseInt(parts[3],10)||0 });
  });
  return out;
}

function initSuppliers() {
  if (suppliersReady) return suppliersReady;
  const path = window.SUPPLIERS_DATA_PATH || 'suppliers-info.txt';
  const extraPath = window.SUPPLIER_EXTRA_INFO_PATH || 'supplier-extra-info/data.json';
  suppliersReady = Promise.all([
    fetch(path).then(r => { if (!r.ok) throw new Error('HTTP '+r.status); return r.text(); }),
    fetch(extraPath).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    loadCloudVotes()
  ]).then(([text, extra]) => {
    SUPPLIERS = parseSuppliersText(text);
    SUPPLIER_EXTRA_INFO = extra || {};
    return SUPPLIERS;
  }).catch(err => {
    console.error('Could not load supplier data:', err);
    SUPPLIERS = []; SUPPLIER_EXTRA_INFO = {}; return SUPPLIERS;
  });
  return suppliersReady;
}

function loadLocalVotes() { try { return JSON.parse(localStorage.getItem(VOTES_KEY)) || {}; } catch(e) { return {}; } }
function saveLocalVotes(v) { try { localStorage.setItem(VOTES_KEY, JSON.stringify(v)); } catch(e) {} }

async function loadCloudVotes() {
  try {
    const r = await fetch('/api/votes', {headers:{'Accept':'application/json'}, cache:'no-store'});
    if (!r.ok) throw new Error('Vote API GET '+r.status);
    cloudVotes = await r.json() || {};
    cloudVotesLoaded = true;
  } catch(e) {
    cloudVotes = {}; cloudVotesLoaded = false;
  }
  return cloudVotes;
}

function getVotes(id) {
  const s = SUPPLIERS[id];
  const local = loadLocalVotes()[id] || {likes:0,dislikes:0,myVote:null};
  const remote = cloudVotes[String(id)] || cloudVotes[id] || {likes:0,dislikes:0};
  return {
    likes: (s?s.baseLikes:0) + Number(remote.likes||0) + (cloudVotesLoaded ? 0 : Number(local.likes||0)),
    dislikes: (s?s.baseDislikes:0) + Number(remote.dislikes||0) + (cloudVotesLoaded ? 0 : Number(local.dislikes||0)),
    myVote: local.myVote || null
  };
}

async function castVote(id, type) {
  if (type !== 'like' && type !== 'dislike') return;
  try {
    const r = await fetch('/api/vote', {
      method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({supplier:Number(id), vote:type})
    });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(data.error || 'Vote failed');
    cloudVotesLoaded = true;
    cloudVotes[String(id)] = data.votes || {likes:0,dislikes:0};
    const local=loadLocalVotes();
    if (data.vote) local[id]={likes:0,dislikes:0,myVote:data.vote};
    else delete local[id];
    saveLocalVotes(local);
    return data;
  } catch(e) {
    const votes=loadLocalVotes(); const current=votes[id]||{likes:0,dislikes:0,myVote:null};
    if(current.myVote===type){ current[type+'s']=Math.max(0,(current[type+'s']||0)-1); current.myVote=null; }
    else { if(current.myVote) current[current.myVote+'s']=Math.max(0,(current[current.myVote+'s']||0)-1); current[type+'s']=(current[type+'s']||0)+1; current.myVote=type; }
    votes[id]=current; saveLocalVotes(votes); return current;
  }
}

function classify(id) {
  const {likes,dislikes}=getVotes(id);
  if (likes===0 && dislikes===0) return 'report';
  if (likes > dislikes && likes >= dislikes*1.40) return 'high';
  if (likes > dislikes) return 'decent';
  if (dislikes > likes && dislikes >= likes*1.30) return 'fraud';
  return 'report';
}

function statusLabel(id) {
  switch(classify(id)) {
    case 'high': return 'HIGH REPUTATION';
    case 'decent': return 'DECENT';
    case 'fraud': return '100% FRAUD';
    default: return 'REPORT';
  }
}

function getSupplierExtra(id) { return SUPPLIER_EXTRA_INFO[String(id)] || {}; }

const ICON_LIKE='<svg class="vote-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10.5V20H4.5A1.5 1.5 0 0 1 3 18.5v-6A1.5 1.5 0 0 1 4.5 11H7Zm2 9V10.4c0-.3.07-.6.2-.87L12.3 3.4a1 1 0 0 1 1.5-.35C14.6 3.7 15 4.6 15 5.5v3.75h4.1a2 2 0 0 1 1.98 2.27l-.9 6.5A2 2 0 0 1 18.2 20H9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
const ICON_DISLIKE='<svg class="vote-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5V4H19.5A1.5 1.5 0 0 1 21 5.5v6a1.5 1.5 0 0 1-1.5 1.5H17Zm-2-9v9.1c0 .3-.07.6-.2.87L11.7 20.6a1 1 0 0 1-1.5.35C9.4 20.3 9 19.4 9 18.5v-3.75H4.9a2 2 0 0 1-1.98-2.27l.9-6.5A2 2 0 0 1 5.8 4H15Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';

function escapeHtml(str){return String(str).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function escapeAttr(str){return escapeHtml(str).replace(/`/g,'&#096;');}

window.loadCloudflareVotes=loadCloudVotes;
window.castCloudflareVote=castVote;
