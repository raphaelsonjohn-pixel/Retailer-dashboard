// BomaWave v5.0 — Multi-Store + POS Offline + Distributor POS
import { supabase as sb } from './supabase.js';

const OTP_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/smooth-function';
const SB_KEY  = 'sb_publishable_yJni7Xxl78x24V1mJvLjVg_RAWAsGOt';

const DIST_PLANS = {
  free:    { name: 'Free',    price: 0     },
  premium: { name: 'Premium', price: 20000 },
  pro:     { name: 'Pro',     price: 35000 },
};
const RETAILER_PLANS = {
  free:    { name: 'Free',    price: 0     },
  premium: { name: 'Premium', price: 12000 },
  pro:     { name: 'Pro',     price: 20000 },
};

// ── State ─────────────────────────────────────────────────────
let S = {
  user: null, lang: 'sw', role: null,
  pendingPhone: null, pendingData: null,
  pinBuf: '', cart: [], cartDist: null,
  page: 'dashboard', notifs: [],
  store: null, stores: [],
  realtimeCh: null,
  isOnline: navigator.onLine,
  supervisorOf: null,
  _savedStoreId: null,
  resendTimer: null,
  loginResendTimer: null,
  forgotResendTimer: null,
  // POS live state (preserved across tab switches)
  _posTab: 'sales',
  _posSaleForm: { prod: '', cat: 'beverages', qty: 1, buy: '', sell: '' },
  _posExpForm:  { cat: 'rent', amt: '', desc: '' },
};

// ── Tanzania Location Data ─────────────────────────────────────
const LOC = {
  'Dar es Salaam': {
    'Ilala':      ['Kariakoo','Gerezani','Upanga','Buguruni','Ilala','Kisutu'],
    'Kinondoni':  ['Sinza','Mwananyamala','Tandale','Kijitonyama','Mikocheni','Msasani'],
    'Temeke':     ['Tandika','Mbagala','Mtoni','Temeke','Charambe'],
    'Ubungo':     ['Ubungo','Kimara','Makuburi','Saranga'],
    'Kigamboni':  ['Kigamboni','Mjimwema','Somangila'],
  },
  'Mwanza':   { 'Nyamagana': ['Pamba','Mahina','Kirumba','Isamilo'], 'Ilemela': ['Ilemela','Kiroba','Mkolani'] },
  'Arusha':   { 'Arusha Jiji': ['Kaloleni','Sekei','Sokon 1','Sokon 2'], 'Arumeru': ['Tengeru','Usa River'] },
  'Dodoma':   { 'Dodoma Mjini': ['Makole','Nkuhungu','Kikuyu'], 'Bahi': ['Bahi','Nondwa'] },
  'Mbeya':    { 'Mbeya Jiji': ['Mwanjelwa','Uyole','Sisimba'], 'Mbarali': ['Rujewa','Igawa'] },
  'Tanga':    { 'Tanga Jiji': ['Ngamiani','Chumbageni','Makorora'], 'Muheza': ['Muheza','Bumbuli'] },
  'Morogoro': { 'Morogoro Mjini': ['Kihonda','Mwembesongo','Mji wa Mwisho'], 'Kilosa': ['Kilosa','Gairo'] },
  'Zanzibar Mjini': { 'Mjini': ['Stone Town','Mkunazini','Malindi'], 'Magharibi': ['Bububu','Fuoni'] },
};

const CATS = [
  {id:'beverages', sw:'Vinywaji',         en:'Beverages'},
  {id:'flour',     sw:'Unga',             en:'Flour'},
  {id:'oil',       sw:'Mafuta ya Kupikia',en:'Cooking Oil'},
  {id:'sugar',     sw:'Sukari',           en:'Sugar'},
  {id:'soap',      sw:'Sabuni',           en:'Soap'},
  {id:'personal',  sw:'Usafi wa Mwili',   en:'Personal Care'},
  {id:'dairy',     sw:'Maziwa',           en:'Dairy'},
  {id:'other',     sw:'Nyingine',         en:'Other'},
];
const CAT_ICONS = { beverages:'', flour:'', oil:'', sugar:'', soap:'', personal:'', dairy:'', other:'' };

// ── Translations ───────────────────────────────────────────────
const T = {
  sw: {
    dashboard:'Dashibodi', marketplace:'Soko', myOrders:'Maagizo Yangu',
    orders:'Maagizo', products:'Bidhaa', pos:'POS', reports:'Ripoti',
    debts:'Madeni', receipts:'Risiti', invoices:'Ankara',
    users:'Watumiaji', analytics:'Uchambuzi',
    addProduct:'Ongeza Bidhaa', placeOrder:'Tuma Agizo',
    total:'Jumla', today:'Leo', week:'Wiki', month:'Mwezi',
    profit:'Faida', revenue:'Mapato', expenses:'Matumizi',
    logout:'Toka', notifications:'Arifa', allCategories:'Aina Zote',
    pending:'Inasubiri', confirmed:'Imethibitishwa',
    delivered:'Imetolewa', cancelled:'Imefutwa',
    search:'Tafuta...', noProducts:'Hakuna bidhaa',
    noOrders:'Hakuna maagizo', cartEmpty:'Kikapu kiko tupu',
    orderSuccess:'Agizo limetumwa!', selectDist:'Chagua Msambazaji',
    printReceipt:'Chapisha Risiti (PDF)', shareInvoice:'Shiriki Ankara',
    shareWhatsApp:'WhatsApp', shareSMS:'SMS', printPDF:'Chapisha PDF',
    invoiceText:'Ankara ya BomaWave',
    recordSale:'Rekodi Mauzo', recordExpense:'Rekodi Matumizi',
    history:'Historia', sales:'Mauzo',
  },
  en: {
    dashboard:'Dashboard', marketplace:'Marketplace', myOrders:'My Orders',
    orders:'Orders', products:'Products', pos:'POS', reports:'Reports',
    debts:'Debts', receipts:'Receipts', invoices:'Invoices',
    users:'Users', analytics:'Analytics',
    addProduct:'Add Product', placeOrder:'Place Order',
    total:'Total', today:'Today', week:'Week', month:'Month',
    profit:'Profit', revenue:'Revenue', expenses:'Expenses',
    logout:'Logout', notifications:'Notifications', allCategories:'All Categories',
    pending:'Pending', confirmed:'Confirmed',
    delivered:'Delivered', cancelled:'Cancelled',
    search:'Search...', noProducts:'No products',
    noOrders:'No orders', cartEmpty:'Cart is empty',
    orderSuccess:'Order sent!', selectDist:'Select Distributor',
    printReceipt:'Print Receipt (PDF)', shareInvoice:'Share Invoice',
    shareWhatsApp:'WhatsApp', shareSMS:'SMS', printPDF:'Print PDF',
    invoiceText:'BomaWave Invoice',
    recordSale:'Record Sale', recordExpense:'Record Expense',
    history:'History', sales:'Sales',
  },
};
const t = (k) => T[S.lang]?.[k] ?? k;

// ── Helpers ────────────────────────────────────────────────────
const $  = (id) => document.getElementById(id);
const fmt    = (n) => 'TZS ' + Number(n || 0).toLocaleString();
const today  = () => new Date().toISOString().slice(0, 10);
const genRef = (prefix = 'BW') => prefix + Date.now().toString(36).toUpperCase();

function toast(msg, type = 's') {
  const wrap = $('twrap');
  if (!wrap) return;
  const el = document.createElement('div');
  const classMap = { s: 'success', e: 'error', i: 'info', w: 'warning' };
  const iconMap = {
    s: '<polyline points="20 6 9 17 4 12"/>',
    e: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    i: '<line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/><circle cx="12" cy="12" r="10"/>',
    w: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  };
  el.className = `toast ${classMap[type] || 'info'}`;
  el.innerHTML = `<span class="toast-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">${iconMap[type] || iconMap.i}</svg></span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 4100);
}

function setBusy(id, busy, txt = '') {
  const btn = $(id);
  if (!btn) return;
  btn.disabled = busy;
  const span = btn.querySelector('span') || btn;
  if (busy) {
    span.dataset.orig = span.textContent;
    span.innerHTML = `<span class="spin"></span>`;
  } else {
    span.textContent = txt || span.dataset.orig || '';
  }
}

function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }
function setHtml(id, h)   { const el = $(id); if (el) el.innerHTML = h; }

// ── LocalStorage session ───────────────────────────────────────
function saveSession() {
  localStorage.setItem('bw_v5', JSON.stringify({ user: S.user, lang: S.lang, storeId: S.store?.id }));
}
function loadSession() {
  try {
    const d = JSON.parse(
      localStorage.getItem('bw_v5') ||
      localStorage.getItem('bw_v4') ||
      localStorage.getItem('bw_v3') || 'null'
    );
    if (d?.user) {
      // Reject dev-user IDs — they are fake IDs that break Supabase queries.
      // A real Supabase UUID looks like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const isRealUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.user.id || '');
      if (!isRealUUID) {
        console.warn('BomaWave: Clearing stale dev session (ID:', d.user.id, ')');
        clearSession();
        return false;
      }
      S.user = d.user; S.lang = d.lang || 'sw'; S._savedStoreId = d.storeId;
      return true;
    }
  } catch {}
  return false;
}
function clearSession() {
  ['bw_v5','bw_v4','bw_v3'].forEach(k => localStorage.removeItem(k));
}

// ── OTP API call + Dev Banner ──────────────────────────────────
// When AfricasTalking fails on Tanzania routes, server returns dev_otp
// in the response. The banner slides in from top showing the code
// so developer can test without waiting for SMS.
async function callOTP(payload) {
  const res = await fetch(OTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_KEY}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  // Show dev OTP banner if server sends back the code
  if (data.dev_otp || data.otp_code) {
    showDevOTPBanner(data.dev_otp || data.otp_code);
  } else if (payload.action === 'verify_otp' || payload.action === 'complete_registration') {
    hideDevOTPBanner();
  }
  return data;
}

// ── Dev OTP banner ─────────────────────────────────────────────
function showDevOTPBanner(code) {
  let banner = document.getElementById('dev-otp-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'dev-otp-banner';
    Object.assign(banner.style, {
      position: 'fixed', top: '0', left: '0', right: '0', zIndex: '9999',
      background: 'linear-gradient(135deg,#1e40af,#2563eb)',
      transform: 'translateY(-100%)',
      transition: 'transform .4s cubic-bezier(.34,1.4,.64,1)',
      boxShadow: '0 6px 32px rgba(37,99,235,.4)',
      fontFamily: "'DM Sans',sans-serif",
    });
    document.body.appendChild(banner);
  }
  const codeStr = String(code);
  banner.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.25rem 1rem;gap:.875rem;flex-wrap:wrap">
      <div>
        <div style="font-size:.62rem;font-weight:800;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:.3rem">
          Dev Mode — SMS Haikufika (AfricasTalking TZ route)
        </div>
        <div style="display:flex;align-items:center;gap:.75rem">
          <div style="font-size:2.2rem;font-weight:900;letter-spacing:10px;color:#fff;font-variant-numeric:tabular-nums">
            ${codeStr}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
        <button onclick="window.devOtpAutofill('${codeStr}')" style="
          background:rgba(255,255,255,.95);border:none;color:#1e40af;
          padding:.6rem 1.1rem;border-radius:.6rem;font-size:.88rem;
          font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif;
          display:flex;align-items:center;gap:.35rem;min-height:40px;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Jaza &amp; Ingia
        </button>
        <button onclick="navigator.clipboard?.writeText('${codeStr}')" style="
          background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.25);
          color:#fff;padding:.55rem .875rem;border-radius:.6rem;font-size:.82rem;
          font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;min-height:40px;
        ">
          Nakili
        </button>
        <button onclick="window.hideDevOTPBanner()" style="
          background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.15);
          color:rgba(255,255,255,.65);width:36px;height:36px;border-radius:.55rem;
          cursor:pointer;display:flex;align-items:center;justify-content:center;
          min-height:36px;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  // Slide in after paint
  requestAnimationFrame(() => requestAnimationFrame(() => {
    banner.style.transform = 'translateY(0)';
  }));
}

function hideDevOTPBanner() {
  const b = document.getElementById('dev-otp-banner');
  if (b) { b.style.transform = 'translateY(-110%)'; setTimeout(() => b.remove(), 450); }
}
window.hideDevOTPBanner = hideDevOTPBanner;

// Auto-fill OTP boxes from the banner button
window.devOtpAutofill = function(code) {
  const digits = String(code).split('');
  // Try each prefix in order — only fill if the boxes exist in the DOM
  const prefixes = ['ob', 'lb', 'fb'];
  let prefixUsed = null;
  for (const p of prefixes) {
    if (document.getElementById(`${p}0`)) { prefixUsed = p; break; }
  }
  if (!prefixUsed) return;
  digits.forEach((d, i) => {
    const el = document.getElementById(`${prefixUsed}${i}`);
    if (el) { el.value = d; el.classList.add('on'); }
  });
  hideDevOTPBanner();
  // Auto-submit after short visual delay
  setTimeout(() => {
    if (prefixUsed === 'ob') App.verifyRegOTP?.();
    else if (prefixUsed === 'lb') App.verifyLoginOTP?.();
    else if (prefixUsed === 'fb') App.verifyForgotOTP?.();
  }, 250);
};

// ── Phone normalizer ───────────────────────────────────────────
function normPhone(raw) {
  const d = raw.replace(/\D/g, '');
  if (d.length === 9  && (d[0] === '7' || d[0] === '6')) return '+255' + d;
  if (d.length === 10 && d[0] === '0')                   return '+255' + d.slice(1);
  if (d.length === 12 && d.startsWith('255'))             return '+' + d;
  return null;
}

// ── Step navigation ────────────────────────────────────────────
const STEP_NAMES = {
  sw: { 1:'Lugha', 2:'Aina', 3:'Maelezo (Duka)', 4:'Maelezo (Msambazaji)',
        5:'OTP', 7:'PIN', 8:'Ingia', 9:'OTP ya Kuingia', 10:'Nimesahau PIN', 11:'OTP ya PIN', 12:'PIN Mpya' },
  en: { 1:'Language', 2:'Role', 3:'Details (Shop)', 4:'Details (Distributor)',
        5:'OTP', 7:'PIN', 8:'Login', 9:'Login OTP', 10:'Forgot PIN', 11:'Forgot OTP', 12:'New PIN' },
};
const STEP_MAX = { 1:10, 2:20, 3:50, 4:50, 5:75, 7:90, 8:30, 9:60, 10:30, 11:60, 12:85 };

function goStep(n) {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  const el = $(`s${n}`);
  if (el) el.classList.add('active');
  const pct  = STEP_MAX[n] || 10;
  const name = STEP_NAMES[S.lang]?.[n] || `Step ${n}`;
  setText('plbl', name);
  setText('ppct',  pct + '%');
  const fill = $('pfill');
  if (fill) fill.style.width = pct + '%';
}

// ── Location helpers ───────────────────────────────────────────
function fillSelect(id, options, placeholder = '—') {
  const sel = $(id);
  if (!sel) return;
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o; opt.textContent = o; sel.appendChild(opt);
  });
}

function initLocDropdowns(regionId, districtId, wardId) {
  fillSelect(regionId,   Object.keys(LOC), S.lang === 'sw' ? 'Chagua Mkoa'   : 'Select Region');
  fillSelect(districtId, [],               S.lang === 'sw' ? '— Wilaya —'    : '— District —');
  if (wardId) fillSelect(wardId, [],       S.lang === 'sw' ? '— Kata —'      : '— Ward —');
}

// ── Category grid ──────────────────────────────────────────────
function buildCatGrid() {
  const grid = $('cat-grid');
  if (!grid) return;
  grid.innerHTML = CATS.map(c => `
    <label class="cat-chip" id="chip-${c.id}">
      <input type="checkbox" value="${c.id}"/>
      ${CAT_ICONS[c.id]} ${S.lang === 'sw' ? c.sw : c.en}
    </label>`).join('');
  grid.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => inp.parentElement.classList.toggle('on', inp.checked));
  });
}

// ══════════════════════════════════════════════════════════════
//  OFFLINE / IndexedDB POS
// ══════════════════════════════════════════════════════════════
let posDB = null;

async function initPosDB() {
  return new Promise(resolve => {
    const req = indexedDB.open('bomawave_pos', 2);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sales'))
        db.createObjectStore('sales',    { keyPath: 'local_id', autoIncrement: true });
      if (!db.objectStoreNames.contains('expenses'))
        db.createObjectStore('expenses', { keyPath: 'local_id', autoIncrement: true });
    };
    req.onsuccess = e => { posDB = e.target.result; resolve(posDB); };
    req.onerror   = () => resolve(null);
  });
}

async function posDbAdd(store, data) {
  if (!posDB) return;
  return new Promise(resolve => {
    const tx = posDB.transaction(store, 'readwrite');
    tx.objectStore(store).add({ ...data, synced: false, created_at: new Date().toISOString() });
    tx.oncomplete = resolve;
  });
}

async function posDbGetAll(store) {
  if (!posDB) return [];
  return new Promise(resolve => {
    const tx  = posDB.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => resolve([]);
  });
}

async function posDbMarkSynced(store, key) {
  if (!posDB) return;
  return new Promise(resolve => {
    const tx  = posDB.transaction(store, 'readwrite');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => {
      const rec = req.result;
      if (rec) { rec.synced = true; tx.objectStore(store).put(rec); }
      resolve();
    };
    req.onerror = resolve;
  });
}

async function syncOfflineData() {
  if (!S.isOnline || !posDB) return;
  const sales = await posDbGetAll('sales');
  const exps  = await posDbGetAll('expenses');
  const uS = sales.filter(s => !s.synced);
  const uE = exps.filter(e => !e.synced);

  const isValidUUID = id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

  for (const s of uS) {
    const { local_id, synced, created_at, _off, ...data } = s;

    // Skip records with invalid/dev user IDs — they will never sync
    if (!isValidUUID(data.user_id)) {
      await posDbMarkSynced('sales', local_id); // mark as synced so we stop retrying
      continue;
    }

    // Only send columns that definitely exist in Supabase sales table
    const safeData = {
      user_id:       data.user_id,
      product_name:  data.product_name,
      category:      data.category,
      qty:           data.qty,
      buying_price:  data.buying_price,
      selling_price: data.selling_price,
      sale_date:     data.sale_date,
      store_id:      data.store_id || null,
    };

    const { error } = await sb.from('sales').insert([safeData]);
    if (!error) await posDbMarkSynced('sales', local_id);
    else console.warn('Sync sale error:', error.message);
  }

  for (const e of uE) {
    const { local_id, synced, created_at, _off, ...data } = e;

    if (!isValidUUID(data.user_id)) {
      await posDbMarkSynced('expenses', local_id);
      continue;
    }

    const safeData = {
      user_id:      data.user_id,
      category:     data.category,
      description:  data.description,
      amount:       data.amount,
      expense_date: data.expense_date,
      store_id:     data.store_id || null,
    };

    const { error } = await sb.from('expenses').insert([safeData]);
    if (!error) await posDbMarkSynced('expenses', local_id);
    else console.warn('Sync expense error:', error.message);
  }

  const total = uS.length + uE.length;
  if (total > 0) toast(`Sync imekamilika — records ${total}`, 's');
  App.renderSyncBadge?.();
}

async function getPendingCount() {
  if (!posDB) return 0;
  const s = await posDbGetAll('sales');
  const e = await posDbGetAll('expenses');
  return [...s, ...e].filter(x => !x.synced).length;
}

window.addEventListener('online',  () => {
  S.isOnline = true;
  toast(S.lang === 'sw' ? 'Mtandao umepatikana — Inasync...' : 'Back online — Syncing...', 's');
  syncOfflineData();
});
window.addEventListener('offline', () => {
  S.isOnline = false;
  toast(S.lang === 'sw' ? 'Hakuna mtandao — POS inafanya kazi bila mtandao' : 'No internet — POS works offline', 'w');
});

// ══════════════════════════════════════════════════════════════
//  MULTI-STORE
// ══════════════════════════════════════════════════════════════
async function loadStores() {
  if (!S.user || S.user.role !== 'retailer') { S.stores = []; S.store = null; return; }
  const { data } = await sb.from('stores')
    .select('*').eq('owner_id', S.user.id).eq('is_active', true)
    .order('is_primary', { ascending: false });
  S.stores = data || [];
  if (S._savedStoreId) S.store = S.stores.find(s => s.id === S._savedStoreId) || S.stores[0] || null;
  else S.store = S.stores.find(s => s.is_primary) || S.stores[0] || null;
}

async function ensurePrimaryStore() {
  if (!S.user || S.user.role !== 'retailer') return;
  const { data } = await sb.from('stores').select('id').eq('owner_id', S.user.id).limit(1);
  if (data && data.length > 0) return;
  await sb.from('stores').insert([{
    owner_id: S.user.id, store_name: S.user.store_name,
    store_type: S.user.business_type || 'duka',
    region: S.user.region, district: S.user.district,
    ward: S.user.ward, street: S.user.street,
    is_primary: true, is_active: true,
  }]);
  await loadStores();
}

function renderStoreSwitcher() {
  const wrap = $('store-switcher');
  if (!wrap) return;
  if (!S.stores || S.stores.length <= 1) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  wrap.innerHTML = S.stores.map(st => `
    <button class="store-btn${S.store?.id === st.id ? ' active' : ''}" onclick="App.switchStore('${st.id}')">
      <span></span>
      <span style="flex:1;text-align:left;font-size:.78rem;font-weight:${S.store?.id === st.id ? 800 : 600}">${st.store_name}</span>
      ${S.store?.id === st.id ? '<span style="color:var(--g400)">●</span>' : ''}
    </button>`).join('') +
    `<button class="store-btn add-store" onclick="App.showAddStore()">＋ <span style="font-size:.78rem">${S.lang === 'sw' ? 'Ongeza Duka' : 'Add Store'}</span></button>`;
}

// ══════════════════════════════════════════════════════════════
//  FAB LISTENER — RELIABLE MOBILE FIX
//  Uses touchstart (not touchend), cloneNode trick, retry fallback
//  openCart/closeCart exposed on window for HTML onclick access
// ══════════════════════════════════════════════════════════════
function attachFABListener() {
  const fab = $('cfab');
  if (!fab) {
    // Element not ready yet — retry after short delay
    setTimeout(attachFABListener, 300);
    return;
  }

  // cloneNode(true) removes ALL previously attached listeners
  // This prevents double-firing if showApp() is called more than once
  const newFab = fab.cloneNode(true);
  fab.parentNode.replaceChild(newFab, fab);

  const handleTap = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.openCart();
    return false;
  };

  // touchstart fires immediately when finger touches screen
  // (touchend has ~300ms delay on iOS/Android)
  newFab.addEventListener('touchstart', handleTap, { passive: false });
  newFab.addEventListener('click', handleTap);

  // Make absolutely sure it's clickable
  newFab.style.pointerEvents = 'auto';
  newFab.style.cursor = 'pointer';
}

// Expose on window so HTML onclick="openCart()" works too
window.openCart = function() {
  const panel = $('cpanel');
  const overlay = $('cart-overlay');
  if (panel)   panel.classList.add('open');
  if (overlay) overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
};

window.closeCart = function() {
  const panel = $('cpanel');
  const overlay = $('cart-overlay');
  if (panel)   panel.classList.remove('open');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
};

// ══════════════════════════════════════════════════════════════
//  PUBLIC App OBJECT
// ══════════════════════════════════════════════════════════════
window.App = {

  // expose goStep so HTML onclick="App.goStep(n)" works
  goStep,

  // ── PIN strength dots (must live here, NOT in inline script, because
  //    type="module" loads after HTML inline scripts execute, so if a user
  //    types into the PIN field before the module finishes loading the
  //    inline window.App._pinStrength gets overwritten by this object.
  //    Defining it here guarantees it's always present on window.App.) ──
  _pinStrength(inputId, dotsId) {
    const val = document.getElementById(inputId)?.value || '';
    document.querySelectorAll(`#${dotsId} .pin-dot-m`).forEach((d, i) => {
      d.classList.toggle('on', i < val.length);
    });
  },

  // ── Language ─────────────────────────────────────────────
  setLang(lang) {
    S.lang = lang;
    initLocDropdowns('reg-region', 'reg-district', 'reg-ward');
    initLocDropdowns('dreg-region', 'dreg-district', 'dreg-ward');
    buildCatGrid();
    goStep(2);
  },

  switchLang(lang) {
    S.lang = lang;
    if (S.user) { saveSession(); App.renderApp(); }
    $('lsw-sw')?.classList.toggle('on', lang === 'sw');
    $('lsw-en')?.classList.toggle('on', lang === 'en');
  },

  // ── Role ─────────────────────────────────────────────────
  pickRole(role) {
    S.role = role;
    $('rb-ret')?.classList.toggle('sel', role === 'retailer');
    $('rb-dist')?.classList.toggle('sel', role === 'distributor');
    const cr = $('ck-ret'), cd = $('ck-dist');
    if (cr) cr.style.display = role === 'retailer'    ? '' : 'none';
    if (cd) cd.style.display = role === 'distributor' ? '' : 'none';
    const rn = $('rnext');
    if (rn) rn.style.display = 'flex';
  },

  proceedFromRole() { if (!S.role) return; goStep(S.role === 'retailer' ? 3 : 4); },
  goToRegister()    { goStep(2); },

  // ── Location changes ──────────────────────────────────────
  onRegionChange() {
    const r = $('reg-region')?.value;
    fillSelect('reg-district', r ? Object.keys(LOC[r] || {}) : [], '— Wilaya —');
    fillSelect('reg-ward', [], '— Kata —');
  },
  onDistrictChange() {
    const r = $('reg-region')?.value, d = $('reg-district')?.value;
    fillSelect('reg-ward', (r && d) ? (LOC[r]?.[d] || []) : [], '— Kata —');
  },
  onDRegionChange() {
    const r = $('dreg-region')?.value;
    fillSelect('dreg-district', r ? Object.keys(LOC[r] || {}) : [], '— Wilaya —');
    fillSelect('dreg-ward', [], '— Kata —');
  },
  onDDistrictChange() {
    const r = $('dreg-region')?.value, d = $('dreg-district')?.value;
    fillSelect('dreg-ward', (r && d) ? (LOC[r]?.[d] || []) : [], '— Kata —');
  },

  onASRegion() {
    const r = $('as-region')?.value;
    fillSelect('as-district', r ? Object.keys(LOC[r] || {}) : [], '— Wilaya —');
    fillSelect('as-ward', [], '— Kata —');
  },
  onASDistrict() {
    const r = $('as-region')?.value, d = $('as-district')?.value;
    fillSelect('as-ward', (r && d) ? (LOC[r]?.[d] || []) : [], '— Kata —');
  },

  // ── Eye toggle ────────────────────────────────────────────
  eyeToggle(inputId, iconId) {
    const inp = $(inputId), ico = $(iconId);
    if (!inp || !ico) return;
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    ico.innerHTML = show
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  },

  // ── Retailer registration ─────────────────────────────────
  async submitDetails() {
    const name     = $('reg-name')?.value.trim();
    const rawPhone = $('reg-phone')?.value.trim();
    const pin      = $('reg-pin')?.value.trim();
    const pin2     = $('reg-pin2')?.value.trim();
    if (!name) return toast('Weka jina la duka', 'e');
    const phone = normPhone(rawPhone);
    if (!phone) return toast('Namba ya simu si sahihi', 'e');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'e');
    if (pin !== pin2) return toast('PIN hazilingani', 'e');
    S.pendingData = {
      role: 'retailer', store_name: name, phone, pin,
      region: $('reg-region')?.value, district: $('reg-district')?.value,
      ward: $('reg-ward')?.value, street: $('reg-street')?.value,
      business_type: $('reg-btype')?.value,
    };
    S.pendingPhone = phone;
    setBusy('reg-btn', true);
    const r = await callOTP({ action: 'send_otp', phone });
    setBusy('reg-btn', false, 'Endelea — Tuma OTP');
    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast('OTP imetumwa!', 's');
    setText('otp-phone', phone);
    App.clearOTPBoxes('ob');
    App.startResendTimer();
    goStep(5);
  },

  // ── Distributor registration ──────────────────────────────
  async submitDDetails() {
    const name     = $('dreg-name')?.value.trim();
    const rawPhone = $('dreg-phone')?.value.trim();
    const pin      = $('dreg-pin')?.value.trim();
    const pin2     = $('dreg-pin2')?.value.trim();
    if (!name) return toast('Weka jina la biashara', 'e');
    const phone = normPhone(rawPhone);
    if (!phone) return toast('Namba ya simu si sahihi', 'e');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'e');
    if (pin !== pin2) return toast('PIN hazilingani', 'e');
    const checkedCats = [...document.querySelectorAll('#cat-grid input:checked')].map(i => i.value);
    S.pendingData = {
      role: 'distributor', store_name: name, phone, pin,
      region: $('dreg-region')?.value, district: $('dreg-district')?.value,
      ward: $('dreg-ward')?.value, street: $('dreg-street')?.value,
      coverage_area: $('dreg-coverage')?.value,
      min_delivery_amount: parseFloat($('dreg-mindel')?.value || '0'),
      categories: checkedCats.join(','),
    };
    S.pendingPhone = phone;
    setBusy('dreg-btn', true);
    const r = await callOTP({ action: 'send_otp', phone });
    setBusy('dreg-btn', false, 'Endelea — Tuma OTP');
    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast('OTP imetumwa!', 's');
    setText('otp-phone', phone);
    App.clearOTPBoxes('ob');
    App.startResendTimer();
    goStep(5);
  },

  // ── OTP helpers ───────────────────────────────────────────
  oi(i, el) {
    el.value = el.value.replace(/\D/g, '').slice(-1);
    el.classList.toggle('on', !!el.value);
    if (el.value && i < 5) $(`ob${i + 1}`)?.focus();
    if (i === 5 && el.value) App.verifyRegOTP();
  },
  ok(i, e) { if (e.key === 'Backspace' && !$(`ob${i}`)?.value && i > 0) $(`ob${i - 1}`)?.focus(); },
  clearOTPBoxes(prefix, count = 6) {
    for (let i = 0; i < count; i++) {
      const el = $(`${prefix}${i}`);
      if (el) { el.value = ''; el.classList.remove('on', 'err'); }
    }
  },
  getOTPVal(prefix, count = 6) {
    return Array.from({ length: count }, (_, i) => $(`${prefix}${i}`)?.value || '').join('');
  },

  startResendTimer() {
    clearInterval(S.resendTimer);
    let sec = 60;
    const timer = $('rtimer'), btn = $('rbtn');
    if (timer) timer.style.display = '';
    if (btn)   btn.style.display   = 'none';
    if (timer) timer.textContent = S.lang === 'sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
    S.resendTimer = setInterval(() => {
      sec--;
      if (sec <= 0) {
        clearInterval(S.resendTimer);
        if (timer) timer.style.display = 'none';
        if (btn)   btn.style.display   = '';
      } else {
        if (timer) timer.textContent = S.lang === 'sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
      }
    }, 1000);
  },

  async resendRegOTP() {
    if (!S.pendingPhone) return;
    const r = await callOTP({ action: 'send_otp', phone: S.pendingPhone });
    if (r.success) { toast('OTP imetumwa tena', 's'); App.startResendTimer(); }
    else toast(r.message || 'Hitilafu', 'e');
  },

  async verifyRegOTP() {
    const code = App.getOTPVal('ob');
    if (code.length !== 6) return toast('Weka nambari 6 kamili', 'e');
    setBusy('vbtn', true);
    const r = await callOTP({ action: 'verify_otp', phone: S.pendingPhone, otp_code: code });
    if (!r.success) {
      setBusy('vbtn', false, 'Thibitisha');
      for (let i = 0; i < 6; i++) $(`ob${i}`)?.classList.add('err');
      return toast(r.message || 'Nambari si sahihi', 'e');
    }
    const reg = await callOTP({ action: 'complete_registration', phone: S.pendingPhone, ...S.pendingData });
    setBusy('vbtn', false, 'Thibitisha');
    if (!reg.success) return toast(reg.message || 'Tatizo la kuunda akaunti', 'e');
    toast('Akaunti imefunguliwa! ', 's');
    S.user = reg.user;
    saveSession();
    await ensurePrimaryStore();
    await loadStores();
    App.showApp();
  },

  goBack5() { goStep(S.role === 'retailer' ? 3 : 4); },

  // ── Login ─────────────────────────────────────────────────
  async sendLoginOTP() {
    const raw   = $('lphone')?.value.trim();
    const phone = normPhone(raw);
    if (!phone) return toast('Namba ya simu si sahihi', 'e');
    S.pendingPhone = phone;
    const r = await callOTP({ action: 'send_otp', phone });
    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast('OTP imetumwa!', 's');
    setText('lotp-phone', phone);
    App.clearOTPBoxes('lb');
    App.startLoginResendTimer();
    goStep(9);
  },

  loi(i, el) {
    el.value = el.value.replace(/\D/g, '').slice(-1);
    el.classList.toggle('on', !!el.value);
    if (el.value && i < 5) $(`lb${i + 1}`)?.focus();
    if (i === 5 && el.value) App.verifyLoginOTP();
  },
  lok(i, e) { if (e.key === 'Backspace' && !$(`lb${i}`)?.value && i > 0) $(`lb${i - 1}`)?.focus(); },

  startLoginResendTimer() {
    clearInterval(S.loginResendTimer);
    let sec = 60;
    const timer = $('lrtimer'), btn = $('lrbtn');
    if (timer) timer.style.display = ''; if (btn) btn.style.display = 'none';
    if (timer) timer.textContent = S.lang === 'sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
    S.loginResendTimer = setInterval(() => {
      sec--;
      if (sec <= 0) { clearInterval(S.loginResendTimer); if (timer) timer.style.display = 'none'; if (btn) btn.style.display = ''; }
      else if (timer) timer.textContent = S.lang === 'sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
    }, 1000);
  },

  async resendLoginOTP() {
    if (!S.pendingPhone) return;
    const r = await callOTP({ action: 'send_otp', phone: S.pendingPhone });
    if (r.success) { toast('OTP imetumwa tena', 's'); App.startLoginResendTimer(); }
    else toast(r.message || 'Hitilafu', 'e');
  },

  async verifyLoginOTP() {
    const code = App.getOTPVal('lb');
    if (code.length !== 6) return toast('Weka nambari 6 kamili', 'e');
    setBusy('lvbtn', true);
    const r = await callOTP({ action: 'verify_otp', phone: S.pendingPhone, otp_code: code });
    setBusy('lvbtn', false, 'Thibitisha');
    if (!r.success) {
      for (let i = 0; i < 6; i++) $(`lb${i}`)?.classList.add('err');
      return toast(r.message || 'Nambari si sahihi', 'e');
    }
    if (!r.user_exists)
      return toast(S.lang === 'sw' ? 'Namba hii haijasajiliwa. Unda akaunti kwanza.' : 'Number not registered. Please create account.', 'e');
    S.user = r.user;
    saveSession();
    await loadStores();
    S.pinBuf = '';
    App.renderPinDots();
    setText('s7h',   S.lang === 'sw' ? 'Karibu!' : 'Welcome!');
    setText('s7sub', r.user.store_name || '');
    goStep(7);
  },

  // ── PIN keypad ────────────────────────────────────────────
  pk(digit) {
    if (S.pinBuf.length >= 4) return;
    S.pinBuf += digit;
    App.renderPinDots();
    if (S.pinBuf.length === 4) setTimeout(() => App.checkPin(), 200);
  },
  pdel() { S.pinBuf = S.pinBuf.slice(0, -1); App.renderPinDots(); },
  renderPinDots() {
    for (let i = 0; i < 4; i++) {
      const dot = $(`pd${i}`);
      if (dot) { dot.classList.toggle('on', i < S.pinBuf.length); dot.classList.remove('err'); }
    }
    setText('perr', '');
  },
  checkPin() {
    if (S.pinBuf === String(S.user.pin)) {
      S.user.last_login = new Date().toISOString();
      saveSession();
      App.showApp();
    } else {
      for (let i = 0; i < 4; i++) $(`pd${i}`)?.classList.add('err');
      setText('perr', S.lang === 'sw' ? 'PIN si sahihi. Jaribu tena.' : 'Wrong PIN. Try again.');
      setTimeout(() => { S.pinBuf = ''; App.renderPinDots(); }, 900);
    }
  },

  // ── Forgot PIN ────────────────────────────────────────────
  forgotPin() { S.pinBuf = ''; goStep(10); },

  async sendForgotOTP() {
    const raw   = $('fphone')?.value.trim();
    const phone = normPhone(raw);
    if (!phone) return toast('Namba ya simu si sahihi', 'e');
    S.pendingPhone = phone;
    const r = await callOTP({ action: 'send_otp', phone });
    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast('OTP imetumwa!', 's');
    setText('fotp-phone', phone);
    App.clearOTPBoxes('fb');
    goStep(11);
  },

  foi(i, el) {
    el.value = el.value.replace(/\D/g, '').slice(-1);
    el.classList.toggle('on', !!el.value);
    if (el.value && i < 5) $(`fb${i + 1}`)?.focus();
    if (i === 5 && el.value) App.verifyForgotOTP();
  },
  fok(i, e) { if (e.key === 'Backspace' && !$(`fb${i}`)?.value && i > 0) $(`fb${i - 1}`)?.focus(); },

  async verifyForgotOTP() {
    const code = App.getOTPVal('fb');
    if (code.length !== 6) return toast('Weka nambari 6 kamili', 'e');
    setBusy('fvbtn', true);
    const r = await callOTP({ action: 'verify_otp', phone: S.pendingPhone, otp_code: code });
    setBusy('fvbtn', false, 'Thibitisha');
    if (!r.success) {
      for (let i = 0; i < 6; i++) $(`fb${i}`)?.classList.add('err');
      return toast(r.message || 'Nambari si sahihi', 'e');
    }
    if (!r.user_exists) return toast(S.lang === 'sw' ? 'Namba hii haijasajiliwa.' : 'Number not registered.', 'e');
    S.user = r.user;
    goStep(12);
  },

  async resetPin() {
    const pin  = $('npin')?.value.trim();
    const pin2 = $('npin2')?.value.trim();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'e');
    if (pin !== pin2) return toast('PIN hazilingani', 'e');
    setBusy('rpintxt', true);
    const r = await callOTP({ action: 'reset_pin', phone: S.pendingPhone, pin });
    setBusy('rpintxt', false, S.lang === 'sw' ? 'Hifadhi PIN Mpya' : 'Save New PIN');
    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast(S.lang === 'sw' ? 'PIN imebadilishwa!' : 'PIN updated!', 's');
    S.user = r.user;
    saveSession();
    App.showApp();
  },

  // ── Show App ──────────────────────────────────────────────
  async showApp() {
    // Remove onboarding from DOM entirely so it cannot block any touches
    const ob = $('onboarding');
    if (ob) ob.remove();

    const am = $('app-main');
    if (am) am.style.display = 'block';

    // Attach FAB listener using the reliable pattern:
    // 1. cloneNode removes ALL stale listeners
    // 2. touchstart fires immediately (touchend has 300ms delay)
    // 3. pointerEvents explicitly set
    // 4. retry fallback in case element not ready
    attachFABListener();

    await ensurePrimaryStore();
    await loadStores();
    if (S.user.role === 'retailer' && S.stores.length > 1 && !S.store) {
      App.showStorePicker(); return;
    }
    App.renderApp();
    App.setupRealtime();
  },

  // ── Sync badge ────────────────────────────────────────────
  async renderSyncBadge() {
    const el = $('sync-badge');
    if (!el) return;
    const count = await getPendingCount();
    if (!S.isOnline) {
      el.style.display = 'flex';
      el.innerHTML = `<span class="sync-pill sync-offline">Offline${count > 0 ? ` · ${count} pending` : ''}</span>`;
    } else if (count > 0) {
      el.style.display = 'flex';
      el.innerHTML = `<span class="sync-pill sync-pending" onclick="syncOfflineData()">↑ Sync ${count}</span>`;
    } else {
      el.style.display = 'none';
    }
  },

  switchStore(id) {
    S.store = S.stores.find(s => s.id === id) || S.store;
    saveSession();
    toast(`${S.lang === 'sw' ? 'Duka' : 'Store'}: ${S.store?.store_name}`, 's');
    App.renderApp();
  },

  showAddStore() {
    const view = $('av');
    setText('tbt', S.lang === 'sw' ? 'Ongeza Duka' : 'Add Store');
    view.innerHTML = `
      <div style="max-width:480px;margin:0 auto">
        <div class="card"><div class="cp">
          <div class="page-title">${S.lang === 'sw' ? 'Ongeza Duka Jipya' : 'Add New Store'}</div>
          <div style="display:flex;flex-direction:column;gap:.875rem">
            <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Jina la Duka' : 'Store Name'} *</label>
              <input class="fi" id="as-name" placeholder="${S.lang === 'sw' ? 'mfano: Temeke Branch' : 'e.g. Temeke Branch'}"/></div>
            <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Aina ya Duka' : 'Store Type'}</label>
              <select class="fi" id="as-type">
                <option value="duka">${S.lang === 'sw' ? 'Duka la Kawaida' : 'Regular Shop'}</option>
                <option value="kiosk">Kiosk</option>
                <option value="supermarket">Supermarket</option>
                <option value="wholesale">${S.lang === 'sw' ? 'Jumla' : 'Wholesale'}</option>
              </select></div>
            <div class="fr">
              <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Mkoa' : 'Region'}</label>
                <select class="fi" id="as-region" onchange="App.onASRegion()"><option value=""></option></select></div>
              <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Wilaya' : 'District'}</label>
                <select class="fi" id="as-district" onchange="App.onASDistrict()"><option value=""></option></select></div>
            </div>
            <div class="fr">
              <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Kata' : 'Ward'}</label>
                <select class="fi" id="as-ward"><option value=""></option></select></div>
              <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Mtaa' : 'Street'}</label>
                <input class="fi" id="as-street" placeholder="Mtaa"/></div>
            </div>
            <label class="primary-check">
              <input type="checkbox" id="as-primary"/>
              <span>${S.lang === 'sw' ? 'Fanya Duka Kuu' : 'Set as Primary Store'}</span>
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-top:.25rem">
              <button class="btn btn-secondary" onclick="App.navTo('dashboard')">${S.lang === 'sw' ? 'Rudi' : 'Back'}</button>
              <button class="btn btn-primary" onclick="App.saveNewStore()">
                <span id="as-btn">+ ${S.lang === 'sw' ? 'Ongeza Duka' : 'Add Store'}</span>
              </button>
            </div>
          </div>
        </div></div>
      </div>`;
    // FIX: use correct function name
    initLocDropdowns('as-region', 'as-district', 'as-ward');
  },

  async saveNewStore() {
    const name = $('as-name')?.value.trim();
    if (!name) return toast(S.lang === 'sw' ? 'Weka jina la duka' : 'Enter store name', 'e');
    setBusy('as-btn', true);
    const isPrimary = $('as-primary')?.checked;
    if (isPrimary) await sb.from('stores').update({ is_primary: false }).eq('owner_id', S.user.id);
    const { error } = await sb.from('stores').insert([{
      owner_id: S.user.id, store_name: name,
      store_type: $('as-type')?.value, region: $('as-region')?.value,
      district: $('as-district')?.value, ward: $('as-ward')?.value,
      street: $('as-street')?.value, is_primary: isPrimary, is_active: true,
    }]);
    setBusy('as-btn', false, `+ ${S.lang === 'sw' ? 'Ongeza Duka' : 'Add Store'}`);
    if (error) return toast('Hitilafu ya kuongeza duka', 'e');
    toast(S.lang === 'sw' ? 'Duka limeongezwa!' : 'Store added!', 's');
    await loadStores();
    renderStoreSwitcher();
    App.navTo('dashboard');
  },

  showStorePicker() {
    const view = $('av');
    if (!view) return;
    view.innerHTML = `
      <div style="max-width:420px;margin:2rem auto">
        <div style="text-align:center;margin-bottom:1.5rem">
          <div style="font-size:2rem"></div>
          <div style="font-size:1.25rem;font-weight:800;margin-top:.5rem">${S.lang === 'sw' ? 'Chagua Duka' : 'Select Store'}</div>
          <div style="font-size:.9rem;color:var(--s500);margin-top:.25rem">${S.lang === 'sw' ? 'Duka gani unafanya kazi nalo leo?' : 'Which store are you working at today?'}</div>
        </div>
        ${S.stores.map(st => `
          <div class="card" style="margin-bottom:.875rem;cursor:pointer;border:2px solid ${S.store?.id === st.id ? 'var(--g600)' : 'var(--s200)'}" onclick="App.switchStore('${st.id}');App.navTo('dashboard')">
            <div class="cp" style="display:flex;align-items:center;gap:1rem">
              <div style="width:52px;height:52px;border-radius:12px;background:var(--g100);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0"></div>
              <div style="flex:1">
                <div style="font-size:1.05rem;font-weight:800">${st.store_name} ${st.is_primary ? '' : ''}</div>
                <div style="font-size:.85rem;color:var(--s500)">${st.district || st.region || ''}</div>
              </div>
              <div style="color:var(--g700);font-size:1.3rem">→</div>
            </div>
          </div>`).join('')}
        <button class="btn btn-primary" style="margin-top:.75rem" onclick="App.showAddStore()">+ ${S.lang === 'sw' ? 'Ongeza Duka' : 'Add Store'}</button>
      </div>`;
  },

  async pageMyStores() {
    await loadStores();
    const view = $('av');
    view.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
        <span style="font-size:1.1rem;font-weight:800">${S.lang === 'sw' ? 'Maduka Yangu' : 'My Stores'} (${S.stores.length})</span>
        <button class="btn btn-primary" style="width:auto;padding:.65rem 1.25rem" onclick="App.showAddStore()">+ ${S.lang === 'sw' ? 'Ongeza' : 'Add'}</button>
      </div>
      ${S.stores.map(st => `
        <div class="card" style="margin-bottom:.875rem;border:2px solid ${S.store?.id === st.id ? 'var(--g600)' : 'var(--s200)'}">
          <div class="cp">
            <div style="display:flex;align-items:center;gap:1rem">
              <div style="width:48px;height:48px;border-radius:12px;background:var(--g100);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0"></div>
              <div style="flex:1">
                <div style="font-size:1rem;font-weight:800">${st.store_name} ${st.is_primary ? '' : ''}</div>
                <div style="font-size:.85rem;color:var(--s500)">${st.district || ''} ${st.region || ''}</div>
              </div>
              ${S.store?.id === st.id ? `<span class="active-badge">ACTIVE</span>` : ''}
            </div>
            ${S.store?.id !== st.id ? `<div style="display:flex;gap:.5rem;margin-top:.875rem">
              <button class="btn-sm btn-sm-blue" onclick="App.switchStore('${st.id}');App.navTo('dashboard')">${S.lang === 'sw' ? 'Ingia' : 'Switch'}</button>
              <button class="btn-sm btn-sm-red" onclick="App.deleteStore('${st.id}')">${S.lang === 'sw' ? 'Futa' : 'Delete'}</button>
            </div>` : ''}
          </div>
        </div>`).join('')}`;
  },

  async deleteStore(id) {
    if (S.stores.length <= 1) return toast(S.lang === 'sw' ? 'Lazima kuwe na duka moja angalau' : 'Need at least one store', 'e');
    if (!confirm(S.lang === 'sw' ? 'Futa duka hili?' : 'Delete this store?')) return;
    await sb.from('stores').update({ is_active: false }).eq('id', id);
    await loadStores();
    toast(S.lang === 'sw' ? 'Duka limefutwa' : 'Store deleted', 's');
    App.pageMyStores();
  },

  logout() {
    if (S.realtimeCh) sb.removeChannel(S.realtimeCh);
    S = {
      user: null, lang: S.lang, role: null, pendingPhone: null, pendingData: null,
      pinBuf: '', cart: [], cartDist: null, page: 'dashboard', notifs: [],
      store: null, stores: [], realtimeCh: null, isOnline: navigator.onLine,
      supervisorOf: null, _savedStoreId: null,
      resendTimer: null, loginResendTimer: null, forgotResendTimer: null,
      _posTab: 'sales',
      _posSaleForm: { prod: '', cat: 'beverages', qty: 1, buy: '', sell: '' },
      _posExpForm:  { cat: 'rent', amt: '', desc: '' },
    };
    clearSession();
    // Onboarding was removed from DOM in showApp() — reload page to get it back
    window.location.reload();
  },

  // ══════════════════════════════════════════════════════════
  //  APP RENDERING
  // ══════════════════════════════════════════════════════════
  renderApp() {
    const u  = S.user;
    const av = u.store_name?.[0]?.toUpperCase() || 'U';
    setText('sbav', av);
    setText('sbn',  u.store_name || '—');
    const badgeClass = { retailer: 'rb-ret', distributor: 'rb-dist', admin: 'rb-adm' }[u.role] || 'rb-ret';
    const badgeTxt   = { retailer: 'Duka', distributor: 'Msambazaji', admin: 'Admin' }[u.role] || u.role;
    const bb = $('sbb');
    if (bb) { bb.className = `rbadge ${badgeClass}`; bb.textContent = badgeTxt; }

    const navItems = App.getNavItems(u.role);
    const nav = $('sbnav');
    if (nav) {
      nav.innerHTML = navItems.map(n => `
        <button class="ni${S.page === n.page ? ' on' : ''}" onclick="App.navTo('${n.page}')">
          <span class="nic">${n.icon}</span>${n.label}
        </button>`).join('');
    }

    const mobileNav = navItems.slice(0, 5);
    const bn = $('bn');
    if (bn) {
      bn.innerHTML = mobileNav.map(n => `
        <button class="bni${S.page === n.page ? ' on' : ''}" onclick="App.navTo('${n.page}')">
          ${n.icon}<span class="bni-lbl">${n.shortLabel || n.label}</span>
        </button>`).join('');
    }

    $('lsw-sw')?.classList.toggle('on', S.lang === 'sw');
    $('lsw-en')?.classList.toggle('on', S.lang === 'en');

    renderStoreSwitcher();
    App.renderPage(S.page);
    App.renderSyncBadge();
  },

  getNavItems(role) {
    const base = [{ page: 'dashboard', icon: svgIcon('grid'), label: t('dashboard'), shortLabel: 'Home' }];
    // POS is available to BOTH retailer and distributor
    if (role === 'retailer') return [...base,
      { page: 'marketplace', icon: svgIcon('store'),   label: t('marketplace'), shortLabel: 'Soko' },
      { page: 'my-orders',  icon: svgIcon('pkg'),     label: t('myOrders'),    shortLabel: 'Maagizo' },
      { page: 'pos',        icon: svgIcon('pos'),     label: t('pos'),         shortLabel: 'POS' },
      { page: 'debts',      icon: svgIcon('debt'),    label: t('debts'),       shortLabel: 'Madeni' },
      { page: 'reports',    icon: svgIcon('chart'),   label: t('reports'),     shortLabel: 'Ripoti' },
      { page: 'my-stores',  icon: svgIcon('store'),   label: S.lang === 'sw' ? 'Maduka Yangu' : 'My Stores', shortLabel: 'Maduka' },
    ];
    if (role === 'distributor') return [...base,
      { page: 'products',  icon: svgIcon('pkg'),     label: t('products'),   shortLabel: 'Bidhaa' },
      { page: 'orders',    icon: svgIcon('orders'),  label: t('orders'),     shortLabel: 'Maagizo' },
      { page: 'pos',       icon: svgIcon('pos'),     label: t('pos'),        shortLabel: 'POS' },    // ← ADDED for distributor
      { page: 'invoices',  icon: svgIcon('invoice'), label: t('invoices'),   shortLabel: 'Ankara' },
      { page: 'reports',   icon: svgIcon('chart'),   label: t('reports'),    shortLabel: 'Ripoti' },
    ];
    if (role === 'admin') return [...base,
      { page: 'users',     icon: svgIcon('users'),    label: t('users'),     shortLabel: 'Watumiaji' },
      { page: 'orders',    icon: svgIcon('orders'),   label: t('orders'),    shortLabel: 'Maagizo' },
      { page: 'analytics', icon: svgIcon('analytics'),label: t('analytics'), shortLabel: 'Data' },
    ];
    return base;
  },

  navTo(page) {
    S.page = page;
    App.renderApp();
    App.closeSidebar();
    window.scrollTo(0, 0);
  },

  toggleSidebar() { $('sidebar')?.classList.toggle('open'); $('sovl')?.classList.toggle('active'); },
  closeSidebar()  { $('sidebar')?.classList.remove('open'); $('sovl')?.classList.remove('active'); },
  toggleNotif()   { $('ndd')?.classList.toggle('open'); },
  clearNotifs()   { S.notifs = []; App.renderNotifs(); },

  addNotif(txt) {
    S.notifs.unshift({ txt, time: new Date().toLocaleTimeString() });
    App.renderNotifs();
    App.playSmsSound('new_order');
  },

  renderNotifs() {
    const list = $('nlist'), dot = $('ndot');
    const count = S.notifs.length;
    if (dot) { dot.style.display = count ? 'flex' : 'none'; dot.textContent = count > 9 ? '9+' : count; }
    if (!list) return;
    if (!count) { list.innerHTML = `<div class="nde">${S.lang === 'sw' ? 'Hakuna arifa' : 'No notifications'}</div>`; return; }
    list.innerHTML = S.notifs.slice(0, 10).map(n => `
      <div class="ndi">
        <div class="ndt">${n.txt}</div>
        <div class="ndtime">${n.time}</div>
      </div>`).join('');
  },

  setupRealtime() {
    if (S.realtimeCh) sb.removeChannel(S.realtimeCh);
    const u = S.user;
    S.realtimeCh = sb.channel('bw-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        const o = payload.new;
        if (u.role === 'distributor' && o.distributor_id === u.id) {
          App.addNotif(`${S.lang === 'sw' ? 'Agizo jipya:' : 'New order:'} ${o.order_ref}`);
          if (S.page === 'orders') App.renderPage('orders');
        }
        if (u.role === 'retailer' && o.retailer_id === u.id) {
          if (S.page === 'my-orders') App.renderPage('my-orders');
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
        const o = payload.new;
        if (u.role === 'retailer' && o.retailer_id === u.id) {
          App.addNotif(`${S.lang === 'sw' ? 'Hali ya agizo:' : 'Order status:'} ${o.status}`);
          if (S.page === 'my-orders') App.renderPage('my-orders');
        }
      }).subscribe();
  },

  playSmsSound(type) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const patterns = {
        new_order: [[800, .1, 0], [600, .1, .15]],
        confirmed: [[500, .08, 0], [700, .08, .12], [900, .1, .24]],
        delivered: [[400, .08, 0], [600, .1, .12], [800, .12, .26], [1000, .1, .42]],
      };
      (patterns[type] || patterns.new_order).forEach(([freq, dur, delay]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.frequency.value = freq;
        o.start(ac.currentTime + delay); o.stop(ac.currentTime + delay + dur);
        g.gain.setValueAtTime(.3, ac.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + delay + dur);
      });
    } catch {}
  },

  // ══════════════════════════════════════════════════════════
  //  PAGE RENDERING
  // ══════════════════════════════════════════════════════════
  async renderPage(page) {
    const view = $('av');
    if (!view) return;
    view.innerHTML = `<div class="page-loading"><span class="spin spin-dark"></span> Inapakia...</div>`;

    const tbic = $('tbic'), icons = {
      dashboard: svgIcon('grid'), marketplace: svgIcon('store'),
      'my-orders': svgIcon('pkg'), orders: svgIcon('orders'), products: svgIcon('pkg'),
      pos: svgIcon('pos'), reports: svgIcon('chart'), debts: svgIcon('debt'),
      invoices: svgIcon('invoice'), users: svgIcon('users'), analytics: svgIcon('analytics'),
    };
    if (tbic) tbic.innerHTML = icons[page] || svgIcon('grid');

    const pageLabels = {
      dashboard: t('dashboard'), marketplace: t('marketplace'),
      'my-orders': t('myOrders'), orders: t('orders'), products: t('products'),
      pos: t('pos'), reports: t('reports'), debts: t('debts'),
      invoices: t('invoices'), users: t('users'), analytics: t('analytics'),
    };
    setText('tbt', pageLabels[page] || page);
    setText('tbs', S.user?.store_name || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const pages = {
      dashboard:       () => App.pageDashboard(),
      marketplace:     () => App.pageMarketplace(),
      'my-orders':     () => App.pageMyOrders(),
      orders:          () => App.pageOrders(),
      products:        () => App.pageProducts(),
      pos:             () => App.pagePOS(),
      reports:         () => App.pageReports(),
      debts:           () => App.pageDebts(),
      invoices:        () => App.pageInvoices(),
      users:           () => App.pageUsers(),
      'my-stores':     () => App.pageMyStores(),
      analytics:       () => App.pageAnalytics(),
      supervisor:      () => App.pageSupervisor(),
      'supervisor-dash': () => App.pageSupervisorDash(),
    };
    await (pages[page] || pages.dashboard)();
  },

  // ── DASHBOARD ─────────────────────────────────────────────
  async pageDashboard() {
    const u = S.user;
    const [{ data: orders }, { data: sales }] = await Promise.all([
      sb.from('orders').select('*').or(`retailer_id.eq.${u.id},distributor_id.eq.${u.id}`)
        .order('created_at', { ascending: false }).limit(10),
      sb.from('sales').select('revenue,profit,selling_price,buying_price,qty,created_at')
        .eq('user_id', u.id).gte('sale_date', today()),
    ]);

    const todayRev    = (sales || []).reduce((s, r) => s + (r.revenue || r.selling_price * r.qty || 0), 0);
    const todayProfit = (sales || []).reduce((s, r) => s + (r.profit  || (r.selling_price - r.buying_price) * r.qty || 0), 0);
    const pending     = (orders || []).filter(o => o.status === 'pending').length;
    const delivered   = (orders || []).filter(o => o.status === 'delivered').length;

    const view = $('av');
    view.innerHTML = `
      <div class="sr">
        <div class="sc green"><div class="sic">${svgIcon('revenue')}</div><div class="sl">${S.lang === 'sw' ? 'Mapato Leo' : 'Today Revenue'}</div><div class="sv" id="dash-rev">TZS 0</div></div>
        <div class="sc green"><div class="sic">${svgIcon('profit')}</div><div class="sl">${t('profit')}</div><div class="sv" id="dash-profit">TZS 0</div></div>
        <div class="sc amber"><div class="sic">${svgIcon('pkg')}</div><div class="sl">${S.lang === 'sw' ? 'Yanasubiri' : 'Pending'}</div><div class="sv">${pending}</div></div>
        <div class="sc blue"><div class="sic">${svgIcon('orders')}</div><div class="sl">${S.lang === 'sw' ? 'Zimetolewa' : 'Delivered'}</div><div class="sv">${delivered}</div></div>
      </div>
      <div class="card">
        <div class="cp">
          <div class="sh">
            <span class="st">${S.lang === 'sw' ? 'Maagizo ya Hivi Karibuni' : 'Recent Orders'}</span>
            <button class="sa" onclick="App.navTo('${u.role === 'retailer' ? 'my-orders' : 'orders'}')">${S.lang === 'sw' ? 'Ona Yote →' : 'See All →'}</button>
          </div>
          <div class="tw"><table class="dt">
            <thead><tr><th>REF</th><th>HALI</th><th>JUMLA</th><th>TAREHE</th></tr></thead>
            <tbody>${(orders || []).slice(0, 5).map(o => `
              <tr class="dt-row">
                <td><strong style="color:var(--g700)">${o.order_ref}</strong></td>
                <td>${statusPill(o.status, S.lang)}</td>
                <td style="font-weight:700">${fmt(o.total_price)}</td>
                <td style="color:var(--s500);font-size:.75rem">${o.created_at?.slice(0, 10)}</td>
              </tr>`).join('') || `<tr><td colspan="4"><div class="empty"><div class="empty-ic"></div><div class="empty-s">${t('noOrders')}</div></div></td></tr>`}
            </tbody>
          </table></div>
        </div>
      </div>`;

    setTimeout(() => {
      animateCount($('dash-rev'),    todayRev,    'TZS ');
      animateCount($('dash-profit'), todayProfit, 'TZS ');
    }, 300);
  },

  // ── MARKETPLACE ───────────────────────────────────────────
  async pageMarketplace() {
    const u = S.user;
    const { data: allDists } = await sb.from('profiles')
      .select('id,store_name,region,district,coverage_area,min_delivery_amount')
      .eq('role', 'distributor').eq('is_active', true);

    const sorted = (allDists || []).sort((a, b) => {
      const aScore = (a.region === u.region ? 2 : 0) + (a.district === u.district ? 1 : 0);
      const bScore = (b.region === u.region ? 2 : 0) + (b.district === u.district ? 1 : 0);
      return bScore - aScore;
    });

    if (!sorted.length) {
      $('av').innerHTML = `<div class="empty"><div class="empty-ic"></div><div class="empty-t">${S.lang === 'sw' ? 'Hakuna wasambazaji' : 'No distributors found'}</div></div>`;
      return;
    }

    const distId = S.cartDist || sorted[0]?.id || '';
    let products = [];
    if (distId) {
      const { data: p } = await sb.from('products').select('*')
        .eq('distributor_id', distId).eq('is_active', true).order('category');
      products = p || [];
    }

    const cats = ['all', ...new Set(products.map(p => p.category))];

    const renderProducts = (catFilter = 'all') => {
      const filtered = catFilter === 'all' ? products : products.filter(p => p.category === catFilter);
      if (!filtered.length) return `<div class="empty" style="grid-column:1/-1"><div class="empty-ic"></div><div class="empty-s">${t('noProducts')}</div></div>`;
      return filtered.map(p => {
        const ci = S.cart.find(c => c.product_id === p.id);
        const inCart = !!ci;
        const stock = p.stock_qty > 10 ? 'ok' : p.stock_qty > 0 ? 'low' : 'out';
        const stockTxt = stock === 'ok' ? 'Stok' : stock === 'low' ? `Onyo: ${p.stock_qty} imebaki` : 'Hakuna';
        return `<div class="pcard${inCart ? ' in' : ''}" id="pc-${p.id}">
          <span class="sbadge s-${stock}">${stockTxt}</span>
          <div class="pcat-wrap">${CAT_ICONS[p.category] || ''}</div>
          <div class="pcategory">${p.category}</div>
          <div class="pname">${p.product_name}</div>
          <div class="punit">${p.selling_unit || ''}</div>
          ${p.min_order_qty > 1 ? `<div class="pmoq">Min: ${p.min_order_qty} ${p.selling_unit || 'pc'}</div>` : ''}
          <div class="pfoot">
            <span class="pprice">${fmt(p.price)}</span>
            ${stock === 'out'
              ? `<span style="font-size:.7rem;color:var(--red)">${S.lang === 'sw' ? 'Haipo' : 'Out'}</span>`
              : inCart
                ? `<div class="qc">
                    <button class="qb" onclick="App.cartChange('${p.id}',-1)">−</button>
                    <span class="qn">${ci.qty}</span>
                    <button class="qb" onclick="App.cartChange('${p.id}',1)">+</button>
                   </div>`
                : `<button class="adbtn" onclick="App.addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">+</button>`}
          </div>
        </div>`;
      }).join('');
    };

    const sel = sorted.find(d => d.id === distId);
    const minDel = sel?.min_delivery_amount || 0;
    const distOpts = sorted.map(d =>
      `<option value="${d.id}"${d.id === distId ? ' selected' : ''}>${d.store_name} — ${d.district || d.region || ''}${d.region === u.region ? ' ' : ''}</option>`
    ).join('');

    const view = $('av');
    view.innerHTML = `
      <div class="card" style="margin-bottom:1rem">
        <div class="cp">
          <div class="fg" style="margin-bottom:.75rem">
            <label class="fl">${S.lang === 'sw' ? 'Chagua Msambazaji' : 'Select Distributor'}</label>
            <select class="fi" id="dist-sel" onchange="App.changeDist(this.value)">${distOpts}</select>
          </div>
          ${minDel > 0 ? `<div class="alert al-w" style="margin:0">Onyo: ${S.lang === 'sw' ? 'Kiwango cha chini:' : 'Minimum order:'} <strong>${fmt(minDel)}</strong></div>` : ''}
        </div>
      </div>
      <div class="fps" id="cat-filter">
        ${cats.map(c => `<button class="fp${c === 'all' ? ' on' : ''}" onclick="App.filterCat('${c}',this)">
          ${c === 'all' ? t('allCategories') : CAT_ICONS[c] + ' ' + (S.lang === 'sw' ? CATS.find(x => x.id === c)?.sw || c : CATS.find(x => x.id === c)?.en || c)}
        </button>`).join('')}
      </div>
      <div class="pgrid" id="pgrid">${renderProducts('all')}</div>`;

    const fab = $('cfab');
    if (fab) fab.style.display = S.cart.length ? 'flex' : 'none';
    App.renderCartPanel();
  },

  changeDist(id) { S.cartDist = id; S.cart = []; App.pageMarketplace(); },

  filterCat(cat, btn) {
    document.querySelectorAll('.fp').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const grid = $('pgrid');
    if (!grid) return;
    // Re-render only the grid, not the whole page
    const u = S.user;
    const distId = S.cartDist;
    // We already have products from memory via marketplace — re-fetch inline
    const doFilter = async () => {
      if (!distId) return;
      const { data: p } = await sb.from('products').select('*')
        .eq('distributor_id', distId).eq('is_active', true).order('category');
      const products = p || [];
      const filtered = cat === 'all' ? products : products.filter(prod => prod.category === cat);
      grid.innerHTML = filtered.map(prod => {
        const ci = S.cart.find(c => c.product_id === prod.id);
        const inCart = !!ci;
        const stock = prod.stock_qty > 10 ? 'ok' : prod.stock_qty > 0 ? 'low' : 'out';
        const stockTxt = stock === 'ok' ? 'Stok' : stock === 'low' ? `Onyo: ${prod.stock_qty} imebaki` : 'Hakuna';
        return `<div class="pcard${inCart ? ' in' : ''}" id="pc-${prod.id}">
          <span class="sbadge s-${stock}">${stockTxt}</span>
          <div class="pcat-wrap">${CAT_ICONS[prod.category] || ''}</div>
          <div class="pcategory">${prod.category}</div>
          <div class="pname">${prod.product_name}</div>
          <div class="punit">${prod.selling_unit || ''}</div>
          ${prod.min_order_qty > 1 ? `<div class="pmoq">Min: ${prod.min_order_qty}</div>` : ''}
          <div class="pfoot">
            <span class="pprice">${fmt(prod.price)}</span>
            ${stock === 'out'
              ? `<span style="font-size:.7rem;color:var(--red)">Out</span>`
              : inCart
                ? `<div class="qc"><button class="qb" onclick="App.cartChange('${prod.id}',-1)">−</button><span class="qn">${ci.qty}</span><button class="qb" onclick="App.cartChange('${prod.id}',1)">+</button></div>`
                : `<button class="adbtn" onclick="App.addToCart(${JSON.stringify(prod).replace(/"/g, '&quot;')})">+</button>`}
          </div>
        </div>`;
      }).join('') || `<div class="empty" style="grid-column:1/-1"><div class="empty-s">${t('noProducts')}</div></div>`;
    };
    doFilter();
  },

  addToCart(p) {
    if (p.stock_qty === 0) return;
    if (!S.cartDist) S.cartDist = p.distributor_id;
    const existing = S.cart.find(c => c.product_id === p.id);
    if (existing) { existing.qty++; }
    else {
      S.cart.push({
        product_id: p.id, product_name: p.product_name,
        qty: p.min_order_qty || 1, unit_price: p.price,
        min_order_qty: p.min_order_qty || 1, selling_unit: p.selling_unit,
        distributor_id: p.distributor_id,
      });
    }
    // FIX: update only the specific product card in-place, no full page reload
    App._updateProductCard(p.id);
    App.updateCartUI();
  },

  // FIX: In-place cart quantity update — no full page rebuild
  cartChange(productId, delta) {
    const item = S.cart.find(c => c.product_id === productId);
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) S.cart = S.cart.filter(c => c.product_id !== productId);
    App._updateProductCard(productId);
    App.updateCartUI();
  },

  _updateProductCard(productId) {
    const card = document.getElementById(`pc-${productId}`);
    if (!card) return;
    const ci = S.cart.find(c => c.product_id === productId);
    const footer = card.querySelector('.pfoot');
    if (!footer) return;
    const priceSpan = footer.querySelector('.pprice');
    const priceHtml = priceSpan ? priceSpan.outerHTML : '';
    if (ci) {
      card.classList.add('in');
      const existingQc = footer.querySelector('.qc, .adbtn');
      if (existingQc) {
        existingQc.outerHTML = `<div class="qc">
          <button class="qb" onclick="App.cartChange('${productId}',-1)">−</button>
          <span class="qn">${ci.qty}</span>
          <button class="qb" onclick="App.cartChange('${productId}',1)">+</button>
        </div>`;
      }
    } else {
      card.classList.remove('in');
      const existingQc = footer.querySelector('.qc, .adbtn');
      if (existingQc) existingQc.outerHTML = `<button class="adbtn" onclick="App.addToCart(JSON.parse(this.dataset.p))" data-p=''>+</button>`;
      // Reload this card properly — minimal approach
      const pgrid = $('pgrid');
      if (pgrid) {
        // just re-render the whole grid only when item removed (rare)
        App.pageMarketplace();
      }
    }
  },

  updateCartUI() {
    const count = S.cart.reduce((s, c) => s + c.qty, 0);
    const fab = $('cfab'), cc = $('cc');
    if (fab) {
      // Show FAB whenever cart has items, on any screen size
      fab.style.display = S.cart.length ? 'flex' : 'none';
    }
    if (cc) cc.textContent = count;
    App.renderCartPanel();
  },

  renderCartPanel() {
    const list  = $('cplist'), total = $('ct-val');
    if (!list) return;
    if (!S.cart.length) {
      list.innerHTML = `<div class="empty">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <div class="empty-s">${t('cartEmpty')}</div>
      </div>`;
      if (total) total.textContent = 'TZS 0';
      return;
    }
    const sum = S.cart.reduce((s, c) => s + c.qty * c.unit_price, 0);
    list.innerHTML = S.cart.map(c => {
      const moqWarn = c.qty < c.min_order_qty;
      return `<div class="cpi">
        <div class="cpi-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <div style="flex:1;min-width:0">
          <div class="cpi-name">${c.product_name}</div>
          <div class="cpi-price">${fmt(c.qty * c.unit_price)}</div>
          ${moqWarn ? `<div class="cpi-moq">Min: ${c.min_order_qty}</div>` : ''}
        </div>
        <div class="qc">
          <button class="qb" onclick="App.cartChange('${c.product_id}',-1)">−</button>
          <span class="qn">${c.qty}</span>
          <button class="qb" onclick="App.cartChange('${c.product_id}',1)">+</button>
        </div>
      </div>`;
    }).join('');
    if (total) total.textContent = fmt(sum);
  },

  toggleCart() {
    const panel = $('cpanel');
    if (!panel) return;
    panel.classList.contains('open') ? window.closeCart() : window.openCart();
  },

  async placeOrder() {
    if (!S.cart.length) return toast(t('cartEmpty'), 'e');

    // Guard: reject dev-user sessions
    if (!S.user?.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(S.user.id)) {
      toast(S.lang === 'sw' ? 'Tafadhali ingia tena' : 'Please log in again', 'e');
      setTimeout(() => App.logout(), 1500);
      return;
    }

    // MOQ check
    const moqFail = S.cart.filter(c => c.qty < c.min_order_qty);
    if (moqFail.length) {
      toast(`${S.lang === 'sw' ? 'Kiwango cha chini hafikiwi:' : 'MOQ not met:'} ${moqFail.map(c => c.product_name).join(', ')}`, 'e');
      return;
    }

    // Minimum delivery check
    const distId = S.cartDist || S.cart[0]?.distributor_id;
    if (!distId) return toast(S.lang === 'sw' ? 'Hakuna msambazaji' : 'No distributor selected', 'e');

    const total = S.cart.reduce((s, c) => s + c.qty * c.unit_price, 0);
    const { data: dist } = await sb.from('profiles').select('min_delivery_amount').eq('id', distId).single();
    if (dist?.min_delivery_amount && total < dist.min_delivery_amount) {
      toast(`${S.lang === 'sw' ? 'Agizo dogo. Kiwango cha chini:' : 'Below minimum:'} ${fmt(dist.min_delivery_amount)}`, 'e');
      return;
    }

    // Disable button and show spinner
    const btn = $('po-btn'), txt = $('po-txt');
    if (btn) btn.disabled = true;
    if (txt) txt.innerHTML = '<span class="spin"></span>';

    try {
      // Step 1: Insert order
      const ref = genRef('ORD');
      const { data: order, error: oErr } = await sb.from('orders').insert([{
        order_ref:      ref,
        retailer_id:    S.user.id,
        distributor_id: distId,
        total_price:    total,
        items_count:    S.cart.length,
        status:         'pending',
      }]).select().single();

      if (oErr || !order) {
        console.error('orders insert error:', oErr);
        throw new Error(oErr?.message || (S.lang === 'sw' ? 'Hitilafu ya kutuma agizo' : 'Failed to place order'));
      }

      // Step 2: Insert order items
      const { error: iErr } = await sb.from('order_items').insert(
        S.cart.map(c => ({
          order_id:     order.id,
          product_id:   c.product_id,
          product_name: c.product_name,
          qty:          c.qty,
          unit_price:   c.unit_price,
          subtotal:     c.qty * c.unit_price,
        }))
      );
      if (iErr) console.warn('order_items insert warning:', iErr.message);

      // Success — clear cart, close panel, show toast, navigate
      S.cart = [];
      S.cartDist = null;
      window.closeCart();
      App.updateCartUI();

      const successMsg = S.lang === 'sw'
        ? `Agizo limetumwa! Namba: ${ref}`
        : `Order sent! Ref: ${ref}`;
      toast(successMsg, 's');

      // Navigate to my orders after short delay so toast is visible
      setTimeout(() => App.navTo('my-orders'), 800);

    } catch (err) {
      console.error('placeOrder failed:', err);
      toast(err.message || (S.lang === 'sw' ? 'Hitilafu — jaribu tena' : 'Error — please try again'), 'e');
    } finally {
      if (btn) btn.disabled = false;
      if (txt) txt.textContent = t('placeOrder');
    }
  },

  // ── MY ORDERS (Retailer) ──────────────────────────────────
  async pageMyOrders() {
    const { data: orders } = await sb.from('orders')
      .select('*').eq('retailer_id', S.user.id)
      .order('created_at', { ascending: false });
    const view = $('av');
    view.innerHTML = `
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('myOrders')}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr><th>REF</th><th>HALI</th><th>BIDHAA</th><th>JUMLA</th><th>TAREHE</th><th>VITENDO</th></tr></thead>
          <tbody>${(orders || []).map(o => `
            <tr class="dt-row">
              <td><strong style="color:var(--g700)">${o.order_ref}</strong></td>
              <td>${statusPill(o.status, S.lang)}</td>
              <td>${o.items_count}</td>
              <td><strong>${fmt(o.total_price)}</strong></td>
              <td style="color:var(--s500);font-size:.75rem">${o.created_at?.slice(0, 10)}</td>
              <td>${o.status === 'delivered' ? `<button class="btn-sm btn-sm-blue" onclick="App.showInvoice('${o.id}')">${t('invoices')}</button>` : ''}</td>
            </tr>`).join('') || `<tr><td colspan="6"><div class="empty"><div class="empty-ic"></div><div class="empty-s">${t('noOrders')}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  // ── ORDERS (Distributor) ──────────────────────────────────
  async pageOrders() {
    const { data: orders } = await sb.from('orders')
      .select('*').eq('distributor_id', S.user.id)
      .order('created_at', { ascending: false });
    const view = $('av');
    view.innerHTML = `
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('orders')}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr><th>REF</th><th>HALI</th><th>JUMLA</th><th>TAREHE</th><th>VITENDO</th></tr></thead>
          <tbody>${(orders || []).map(o => `
            <tr class="dt-row">
              <td><strong style="color:var(--g700)">${o.order_ref}</strong></td>
              <td>${statusPill(o.status, S.lang)}</td>
              <td><strong>${fmt(o.total_price)}</strong></td>
              <td style="color:var(--s500);font-size:.75rem">${o.created_at?.slice(0, 10)}</td>
              <td style="display:flex;gap:.3rem;flex-wrap:wrap">
                ${o.status === 'pending'   ? `<button class="btn-sm btn-sm-blue" onclick="App.updateOrderStatus('${o.id}','confirmed')">${S.lang === 'sw' ? 'Thibitisha' : 'Confirm'}</button>` : ''}
                ${o.status === 'confirmed' ? `<button class="btn-sm btn-sm-green" onclick="App.updateOrderStatus('${o.id}','delivered')">${S.lang === 'sw' ? 'Toa' : 'Deliver'}</button>` : ''}
                ${o.status === 'delivered' ? `<button class="btn-sm btn-sm-green" onclick="App.showReceipt('${o.id}')">${t('printReceipt')}</button>` : ''}
                ${o.status !== 'cancelled' && o.status !== 'delivered' ? `<button class="btn-sm btn-sm-red" onclick="App.updateOrderStatus('${o.id}','cancelled')">${S.lang === 'sw' ? 'Futa' : 'Cancel'}</button>` : ''}
              </td>
            </tr>`).join('') || `<tr><td colspan="5"><div class="empty"><div class="empty-ic"></div><div class="empty-s">${t('noOrders')}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  async updateOrderStatus(orderId, status) {
    const { error } = await sb.from('orders').update({ status }).eq('id', orderId);
    if (error) return toast('Hitilafu ya kubadilisha hali', 'e');
    toast(S.lang === 'sw' ? `Hali: ${status}` : `Status: ${status}`, 's');
    if (status === 'delivered') {
      const { data: o } = await sb.from('orders').select('*').eq('id', orderId).single();
      if (o) {
        await sb.from('receipts').insert([{
          receipt_ref: genRef('RCP'), order_id: orderId,
          distributor_id: o.distributor_id, retailer_id: o.retailer_id,
          amount: o.total_price, payment_method: 'cash',
        }]);
        await sb.from('invoices').insert([{
          invoice_ref: genRef('INV'), order_id: orderId,
          distributor_id: o.distributor_id, retailer_id: o.retailer_id,
          amount: o.total_price, status: 'unpaid',
          due_date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
        }]);
      }
    }
    App.pageOrders();
  },

  async showReceipt(orderId) {
    const [{ data: order }, { data: items }, { data: receipt }] = await Promise.all([
      sb.from('orders').select('*').eq('id', orderId).single(),
      sb.from('order_items').select('*').eq('order_id', orderId),
      sb.from('receipts').select('receipt_ref,issued_at').eq('order_id', orderId).maybeSingle(),
    ]);
    const [{ data: retailer }, { data: dist }] = await Promise.all([
      sb.from('profiles').select('store_name,phone_number,district').eq('id', order.retailer_id).single(),
      sb.from('profiles').select('store_name,phone_number').eq('id', order.distributor_id).single(),
    ]);
    const view = $('av');
    view.innerHTML = `
      <div class="no-print" style="display:flex;gap:.65rem;margin-bottom:1rem">
        <button class="share-btn share-btn-blue" onclick="window.print()">${svgIcon('print')} ${t('printReceipt')}</button>
      </div>
      <div class="receipt" id="print-area">
        <div class="receipt-logo"><img src="logo.jpg" onerror="this.style.display='none'"/>
          <div><div class="receipt-logo-name">BomaWave</div><div style="font-size:.65rem;color:var(--s500)">FMCG Platform · Tanzania</div></div>
        </div>
        <div class="receipt-title">${S.lang === 'sw' ? 'RISITI YA MALIPO' : 'PAYMENT RECEIPT'}</div>
        <div class="receipt-ref">Ref: ${receipt?.receipt_ref || order.order_ref} · ${receipt?.issued_at?.slice(0, 10) || today()}</div>
        <div class="receipt-parties">
          <div><div class="rp-lbl">MUUZAJI</div><div class="rp-name">${dist?.store_name || '—'}</div><div class="rp-info">${dist?.phone_number || ''}</div></div>
          <div><div class="rp-lbl">MNUNUZI</div><div class="rp-name">${retailer?.store_name || '—'}</div><div class="rp-info">${retailer?.phone_number || ''}</div></div>
        </div>
        <div>${(items || []).map(i => `<div class="ri"><div><div class="ri-name">${i.product_name}</div><div class="ri-qty">Qty: ${i.qty}</div></div><div class="ri-price">${fmt(i.subtotal)}</div></div>`).join('')}</div>
        <div class="rtotal"><span class="rtl">JUMLA YA MALIPO</span><span class="rtv">${fmt(order.total_price)}</span></div>
        <div class="rfoot">Asante kwa biashara yako! · BomaWave FMCG Platform</div>
      </div>`;
  },

  async showInvoice(orderId) {
    const [{ data: order }, { data: items }, { data: invoice }] = await Promise.all([
      sb.from('orders').select('*').eq('id', orderId).single(),
      sb.from('order_items').select('*').eq('order_id', orderId),
      sb.from('invoices').select('*').eq('order_id', orderId).maybeSingle(),
    ]);
    const [{ data: retailer }, { data: dist }] = await Promise.all([
      sb.from('profiles').select('store_name,phone_number,district').eq('id', order.retailer_id).single(),
      sb.from('profiles').select('store_name,phone_number').eq('id', order.distributor_id).single(),
    ]);
    const inv = invoice || { invoice_ref: genRef('INV'), issued_at: new Date().toISOString(), due_date: '', status: 'unpaid' };
    const shareText = encodeURIComponent(
      `*ANKARA YA BOMAWAVE*\nRef: ${inv.invoice_ref}\n\nMuuzaji: ${dist?.store_name}\nMnunuzi: ${retailer?.store_name}\n\n` +
      (items || []).map(i => `- ${i.product_name} x${i.qty}: ${fmt(i.subtotal)}`).join('\n') +
      `\n\nJUMLA: ${fmt(order.total_price)}\nBomaWave FMCG · Tanzania`
    );
    const view = $('av');
    view.innerHTML = `
      <div class="no-print" style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">
        <button class="share-btn share-btn-blue" onclick="window.print()">${svgIcon('print')} ${t('printPDF')}</button>
        <button class="share-btn share-btn-whatsapp" onclick="window.open('https://wa.me/?text=${shareText}','_blank')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button class="share-btn share-btn-sms" onclick="window.open('sms:?body=${shareText}','_blank')">${svgIcon('sms')} SMS</button>
      </div>
      <div class="receipt" id="print-area">
        <div class="receipt-logo"><img src="logo.jpg" onerror="this.style.display='none'"/>
          <div><div class="receipt-logo-name">BomaWave</div></div>
        </div>
        <div class="receipt-title">ANKARA YA BIASHARA</div>
        <div class="receipt-ref">Ref: ${inv.invoice_ref} · ${inv.issued_at?.slice(0, 10) || today()}</div>
        <div class="receipt-parties">
          <div><div class="rp-lbl">MUUZAJI</div><div class="rp-name">${dist?.store_name || '—'}</div><div class="rp-info">${dist?.phone_number || ''}</div></div>
          <div><div class="rp-lbl">MNUNUZI</div><div class="rp-name">${retailer?.store_name || '—'}</div><div class="rp-info">${retailer?.phone_number || ''}</div></div>
        </div>
        <div>${(items || []).map(i => `<div class="ri"><div><div class="ri-name">${i.product_name}</div><div class="ri-qty">× ${i.qty} @ ${fmt(i.unit_price)}</div></div><div class="ri-price">${fmt(i.subtotal)}</div></div>`).join('')}</div>
        <div class="rtotal"><span class="rtl">JUMLA</span><span class="rtv">${fmt(order.total_price)}</span></div>
        <div style="margin-top:.75rem;padding:.65rem;background:var(--s100);border-radius:.5rem;font-size:.75rem">
          <div style="display:flex;justify-content:space-between"><span>Hali ya Malipo</span><strong>${inv.status === 'paid' ? 'Imelipwa' : '⏳ Haijalipwa'}</strong></div>
          ${inv.due_date ? `<div style="display:flex;justify-content:space-between"><span>Tarehe ya Mwisho</span><strong>${inv.due_date}</strong></div>` : ''}
        </div>
        <div class="rfoot">Malipo yalipwe kabla ya tarehe iliyoonyeshwa. · BomaWave FMCG · Tanzania</div>
      </div>`;
  },

  async pageInvoices() {
    const { data: invoices } = await sb.from('invoices')
      .select('*').eq('distributor_id', S.user.id)
      .order('issued_at', { ascending: false });
    const view = $('av');
    view.innerHTML = `
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('invoices')}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr><th>REF</th><th>HALI</th><th>KIASI</th><th>TAREHE</th><th>VITENDO</th></tr></thead>
          <tbody>${(invoices || []).map(inv => `
            <tr class="dt-row">
              <td><strong style="color:var(--g700)">${inv.invoice_ref}</strong></td>
              <td><span class="pill ${inv.status === 'paid' ? 'p-paid' : 'p-unp'}">${inv.status === 'paid' ? 'Imelipwa' : 'Haijalipwa'}</span></td>
              <td><strong>${fmt(inv.amount)}</strong></td>
              <td style="color:var(--s500);font-size:.75rem">${inv.issued_at?.slice(0, 10)}</td>
              <td style="display:flex;gap:.3rem;flex-wrap:wrap">
                ${inv.order_id ? `<button class="btn-sm btn-sm-blue" onclick="App.showInvoice('${inv.order_id}')">${t('shareInvoice')}</button>` : ''}
                ${inv.status === 'unpaid' ? `<button class="btn-sm btn-sm-green" onclick="App.markInvPaid('${inv.id}')">${S.lang === 'sw' ? 'Malipo Yamefika' : 'Mark Paid'}</button>` : ''}
              </td>
            </tr>`).join('') || `<tr><td colspan="5"><div class="empty"><div class="empty-ic"></div><div class="empty-s">${S.lang === 'sw' ? 'Hakuna ankara' : 'No invoices'}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  async markInvPaid(id) {
    await sb.from('invoices').update({ status: 'paid' }).eq('id', id);
    toast(S.lang === 'sw' ? 'Malipo yamekubaliwa' : 'Payment recorded', 's');
    App.pageInvoices();
  },

  // ── PRODUCTS (Distributor) ────────────────────────────────
  async pageProducts() {
    const { data: products } = await sb.from('products')
      .select('*').eq('distributor_id', S.user.id).order('created_at', { ascending: false });
    const view = $('av');
    view.innerHTML = `
      <div class="card" style="margin-bottom:1rem"><div class="cp">
        <div class="sh"><span class="st">${S.lang === 'sw' ? 'Ongeza Bidhaa Mpya' : 'Add New Product'}</span></div>
        <div class="fr" style="margin-bottom:.75rem">
          <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Jina' : 'Name'} *</label>
            <input class="fi" id="pn" placeholder="${S.lang === 'sw' ? 'Jina la bidhaa' : 'Product name'}"/></div>
          <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Aina' : 'Category'}</label>
            <select class="fi" id="pc">${CATS.map(c => `<option value="${c.id}">${CAT_ICONS[c.id]} ${S.lang === 'sw' ? c.sw : c.en}</option>`).join('')}</select></div>
        </div>
        <div class="fr3" style="margin-bottom:.75rem">
          <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Bei Kuuza' : 'Sell Price'} *</label>
            <input class="fi" id="pp" type="number" min="0" placeholder="0"/></div>
          <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Bei Kununua' : 'Cost Price'}</label>
            <input class="fi" id="pcp" type="number" min="0" placeholder="0"/></div>
          <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Stok' : 'Stock'}</label>
            <input class="fi" id="pq" type="number" min="0" placeholder="0"/></div>
        </div>
        <div class="fr" style="margin-bottom:.75rem">
          <div class="fg"><label class="fl">MOQ</label><input class="fi" id="pmoq" type="number" min="1" value="1"/></div>
          <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Kipimo' : 'Unit'}</label><input class="fi" id="pu" placeholder="Krate (24)"/></div>
        </div>
        <button class="btn btn-primary" onclick="App.addProduct()" style="max-width:240px">
          <span id="add-p-txt">+ ${t('addProduct')}</span>
        </button>
      </div></div>
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${S.lang === 'sw' ? 'Bidhaa Zangu' : 'My Products'}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr><th>JINA</th><th>AINA</th><th>BEI</th><th>MOQ</th><th>STOK</th><th>VITENDO</th></tr></thead>
          <tbody>${(products || []).map(p => `
            <tr class="dt-row">
              <td><strong>${p.product_name}</strong></td>
              <td>${CAT_ICONS[p.category] || ''} ${p.category}</td>
              <td><strong style="color:var(--g700)">${fmt(p.price)}</strong></td>
              <td style="color:var(--amber);font-weight:700">${p.min_order_qty}</td>
              <td><div class="sedit"><input type="number" id="sq-${p.id}" value="${p.stock_qty}" min="0" style="width:60px"/>
                <button class="btn-sm btn-sm-green" onclick="App.updateStock('${p.id}')">${S.lang === 'sw' ? 'Hifadhi' : 'Save'}</button></div></td>
              <td><button class="btn-sm btn-sm-red" onclick="App.deleteProduct('${p.id}')">${S.lang === 'sw' ? 'Futa' : 'Delete'}</button></td>
            </tr>`).join('') || `<tr><td colspan="6"><div class="empty"><div class="empty-ic"></div><div class="empty-s">${t('noProducts')}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  async addProduct() {
    const name = $('pn')?.value.trim(), cat = $('pc')?.value,
      price = parseFloat($('pp')?.value || '0'), cost = parseFloat($('pcp')?.value || '0'),
      qty = parseInt($('pq')?.value || '0'), moq = parseInt($('pmoq')?.value || '1'),
      unit = $('pu')?.value.trim();
    if (!name || !price) return toast(S.lang === 'sw' ? 'Jaza jina na bei' : 'Fill name and price', 'e');

    // Guard: user must have a real UUID before attempting any Supabase insert
    if (!S.user?.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(S.user.id)) {
      toast(S.lang === 'sw' ? 'Tafadhali ingia tena — session yako imekwisha' : 'Please log in again — session expired', 'e');
      setTimeout(() => App.logout(), 1500);
      return;
    }

    setBusy('add-p-txt', true);
    const { error } = await sb.from('products').insert([{
      distributor_id: S.user.id, product_name: name, category: cat,
      price, cost_price: cost, stock_qty: qty, min_order_qty: moq, selling_unit: unit,
      is_active: true,
    }]);
    setBusy('add-p-txt', false, `+ ${t('addProduct')}`);
    if (error) {
      console.error('addProduct error:', error);
      // Show specific error: RLS violation, FK violation, or network error
      const msg = error.code === '42501'
        ? (S.lang === 'sw' ? 'Ruhusa imekataliwa. Angalia Supabase RLS policies.' : 'Permission denied. Check Supabase RLS policies.')
        : error.code === '23503'
        ? (S.lang === 'sw' ? 'ID yako haipo kwenye profiles table.' : 'Your ID not found in profiles table.')
        : error.message || 'Hitilafu ya kuongeza bidhaa';
      return toast(msg, 'e');
    }
    toast(S.lang === 'sw' ? 'Bidhaa imeongezwa!' : 'Product added!', 's');
    App.pageProducts();
  },

  async updateStock(id) {
    const qty = parseInt($(`sq-${id}`)?.value || '0');
    await sb.from('products').update({ stock_qty: qty }).eq('id', id);
    toast(S.lang === 'sw' ? 'Stok imehifadhiwa' : 'Stock updated', 's');
  },

  async deleteProduct(id) {
    if (!confirm(S.lang === 'sw' ? 'Una uhakika wa kufuta bidhaa hii?' : 'Delete this product?')) return;
    await sb.from('products').delete().eq('id', id);
    toast(S.lang === 'sw' ? 'Bidhaa imefutwa' : 'Product deleted', 's');
    App.pageProducts();
  },

  // ══════════════════════════════════════════════════════════
  //  POS — COMPLETE REDESIGN
  //  Available to BOTH retailer and distributor
  //  - Connected Sales + Expenses + History tabs
  //  - Live profit calculator
  //  - Preserved form state across tab switches
  //  - Fixed margin formula: (sell-buy)/sell*100
  //  - Stores revenue, profit, margin explicitly
  // ══════════════════════════════════════════════════════════
  async pagePOS() {
    const uid = S.user.id;
    const sid = S.store?.id;

    let onlineSales = [], onlineExps = [];
    if (S.isOnline) {
      let sq = sb.from('sales').select('*').eq('user_id', uid).gte('sale_date', today()).order('created_at', { ascending: false });
      let eq = sb.from('expenses').select('*').eq('user_id', uid).gte('expense_date', today()).order('created_at', { ascending: false });
      if (sid) { sq = sq.eq('store_id', sid); eq = eq.eq('store_id', sid); }
      const [{ data: s }, { data: e }] = await Promise.all([sq, eq]);
      onlineSales = s || []; onlineExps = e || [];
    }

    const offS = (await posDbGetAll('sales')).filter(s => !s.synced && s.user_id === uid);
    const offE = (await posDbGetAll('expenses')).filter(e => !e.synced && e.user_id === uid);
    const allSales = [...offS.map(s => ({ ...s, _off: true })), ...onlineSales];
    const allExps  = [...offE.map(e => ({ ...e, _off: true })), ...onlineExps];

    // ── FIX: correct aggregation — use stored fields first, then fallbacks
    const todayRev    = allSales.reduce((s, r) => s + (r.revenue  || r.selling_price * r.qty  || 0), 0);
    const todayProfit = allSales.reduce((s, r) => s + (r.profit   || (r.selling_price - r.buying_price) * r.qty || 0), 0);
    const todayExp    = allExps.reduce( (s, e) => s + (e.amount   || 0), 0);
    const netProfit   = todayProfit - todayExp;
    // FIX: margin from revenue — correct formula
    const margin      = todayRev > 0 ? Math.round(todayProfit / todayRev * 100) : 0;
    const txCount     = allSales.length;

    const marginColor = margin >= 25 ? 'var(--g700)' : margin >= 10 ? 'var(--amber)' : 'var(--red)';
    const marginBg    = margin >= 25 ? 'var(--g100)'  : margin >= 10 ? 'var(--ambl)'  : 'var(--redl)';

    const view = $('av');
    view.innerHTML = `
      ${!S.isOnline ? `<div class="offline-banner">${S.lang === 'sw' ? 'Nje ya mtandao — data inashikiliwa hapa' : 'Offline — data saved locally'}</div>` : ''}

      <!-- ── LIVE PROFIT DASHBOARD ── -->
      <div class="pos-dash">
        <div class="pos-live-row">
          <div class="pos-kpi kpi-green">
            <div class="pos-kpi-label">${S.lang === 'sw' ? 'Mapato Leo' : 'Revenue'}</div>
            <div class="pos-kpi-val" id="pos-rev">TZS 0</div>
            <div class="pos-kpi-sub">${txCount} ${S.lang === 'sw' ? 'mauzo' : 'sales'}</div>
          </div>
          <div class="pos-kpi ${todayProfit >= 0 ? 'kpi-green' : 'kpi-red'}">
            <div class="pos-kpi-label">${S.lang === 'sw' ? 'Faida Ghafi' : 'Gross Profit'}</div>
            <div class="pos-kpi-val" id="pos-profit">TZS 0</div>
            <div class="pos-kpi-sub" style="color:${marginColor};font-weight:800">Margin ${margin}%</div>
          </div>
          <div class="pos-kpi kpi-red">
            <div class="pos-kpi-label">${S.lang === 'sw' ? 'Matumizi' : 'Expenses'}</div>
            <div class="pos-kpi-val" id="pos-exp">TZS 0</div>
            <div class="pos-kpi-sub">${allExps.length} ${S.lang === 'sw' ? 'rekodi' : 'entries'}</div>
          </div>
          <div class="pos-kpi ${netProfit >= 0 ? 'kpi-green' : 'kpi-red'}">
            <div class="pos-kpi-label">${S.lang === 'sw' ? 'Faida Halisi' : 'Net Profit'}</div>
            <div class="pos-kpi-val" id="pos-net" style="color:${netProfit < 0 ? 'var(--red)' : 'inherit'}">TZS 0</div>
            <div class="pos-kpi-sub">${S.lang === 'sw' ? 'Baada ya matumizi' : 'After expenses'}</div>
          </div>
        </div>

        <!-- Margin bar -->
        <div class="pos-margin-bar">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem">
            <span style="font-size:.72rem;font-weight:700;color:var(--s500);text-transform:uppercase;letter-spacing:.5px">${S.lang === 'sw' ? 'Margin ya Faida' : 'Profit Margin'}</span>
            <span style="font-size:.88rem;font-weight:900;color:${marginColor}">${margin}%</span>
          </div>
          <div style="height:8px;background:var(--s100);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${Math.min(margin, 100)}%;background:${marginColor};border-radius:4px;transition:width 1s cubic-bezier(.4,0,.2,1) .3s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--s400);margin-top:.2rem">
            <span>0%</span><span style="color:var(--amber)">10%</span><span style="color:var(--g700)">25%+</span><span>100%</span>
          </div>
        </div>

        ${offS.length + offE.length > 0 ? `
        <div class="offline-pill-wrap">
          <span class="offline-pill" onclick="syncOfflineData()">${offS.length + offE.length} offline — ${S.lang === 'sw' ? 'bonyeza kusync' : 'tap to sync'}</span>
        </div>` : ''}
      </div>

      <!-- ── TABS ── -->
      <div class="pos-tabs-bar" id="pos-tabs-bar">
        <button class="pos-tab-btn${S._posTab === 'sales'    ? ' active' : ''}" onclick="App.posTab('sales',this)">
          ${svgIcon('pos')} <span>${S.lang === 'sw' ? 'Mauzo' : 'Sales'}</span>
        </button>
        <button class="pos-tab-btn${S._posTab === 'expenses' ? ' active' : ''}" onclick="App.posTab('expenses',this)">
          ${svgIcon('expense')} <span>${S.lang === 'sw' ? 'Matumizi' : 'Expenses'}</span>
        </button>
        <button class="pos-tab-btn${S._posTab === 'history'  ? ' active' : ''}" onclick="App.posTab('history',this)">
          ${svgIcon('chart')} <span>${S.lang === 'sw' ? 'Historia' : 'History'}</span>
        </button>
      </div>

      <!-- ══ TAB: SALES ══ -->
      <div id="pos-tab-sales" class="pos-tab-content${S._posTab === 'sales' ? ' active' : ''}">
        <div class="pos-form-wrap">
          <div class="pos-form-title">
            ${svgIcon('pos')}
            <span>${S.lang === 'sw' ? 'Rekodi Mauzo' : 'Record Sale'}</span>
          </div>

          <div class="pos-field-group">
            <label class="pos-label">${S.lang === 'sw' ? 'Jina la Bidhaa' : 'Product Name'} *</label>
            <input class="pos-input" id="s-prod" placeholder="${S.lang === 'sw' ? 'mfano: Coca Cola 500ml' : 'e.g. Coca Cola 500ml'}"
              value="${S._posSaleForm.prod}" oninput="App.posSaveForm();App.posCalc()"/>
          </div>

          <div class="pos-field-group">
            <label class="pos-label">${S.lang === 'sw' ? 'Aina ya Bidhaa' : 'Category'}</label>
            <select class="pos-input pos-select" id="s-cat" onchange="App.posSaveForm()">
              ${CATS.map(c => `<option value="${c.id}"${S._posSaleForm.cat === c.id ? ' selected' : ''}>${CAT_ICONS[c.id]} ${S.lang === 'sw' ? c.sw : c.en}</option>`).join('')}
            </select>
          </div>

          <!-- 3-column big inputs -->
          <div class="pos-3col">
            <div class="pos-field-group">
              <label class="pos-label">${S.lang === 'sw' ? 'Idadi' : 'Qty'} *</label>
              <input class="pos-input pos-big" id="s-qty" type="number" min="1" value="${S._posSaleForm.qty || 1}"
                oninput="App.posSaveForm();App.posCalc()"/>
            </div>
            <div class="pos-field-group">
              <label class="pos-label">${S.lang === 'sw' ? 'Bei Kununua' : 'Buy Price'}</label>
              <input class="pos-input pos-big" id="s-buy" type="number" min="0" placeholder="0" value="${S._posSaleForm.buy}"
                oninput="App.posSaveForm();App.posCalc()"/>
            </div>
            <div class="pos-field-group">
              <label class="pos-label">${S.lang === 'sw' ? 'Bei Kuuza' : 'Sell Price'} *</label>
              <input class="pos-input pos-big pos-sell-input" id="s-sell" type="number" min="0" placeholder="0" value="${S._posSaleForm.sell}"
                oninput="App.posSaveForm();App.posCalc()"/>
            </div>
          </div>

          <!-- ── LIVE CALCULATOR ── -->
          <div id="pos-calc" class="pos-calc-box" style="display:none">
            <div class="pos-calc-title">${S.lang === 'sw' ? 'Hesabu ya Haraka' : 'Live Calculator'}</div>
            <div class="pos-calc-grid">
              <div class="pos-calc-item">
                <span>${S.lang === 'sw' ? 'Mapato' : 'Revenue'}</span>
                <strong id="calc-rev" style="color:var(--g700)">TZS 0</strong>
              </div>
              <div class="pos-calc-divider"></div>
              <div class="pos-calc-item">
                <span>${S.lang === 'sw' ? 'Faida' : 'Profit'}</span>
                <strong id="calc-profit" style="color:var(--g600)">TZS 0</strong>
              </div>
              <div class="pos-calc-divider"></div>
              <div class="pos-calc-item">
                <span>Margin</span>
                <strong id="calc-margin" style="color:var(--b700)">0%</strong>
              </div>
            </div>
          </div>

          <button class="pos-rec-btn rec-blue" onclick="App.recordSale()">
            <span id="rec-sale-txt">${S.lang === 'sw' ? 'Rekodi Mauzo' : 'Record Sale'}</span>
          </button>
        </div>
      </div>

      <!-- ══ TAB: EXPENSES ══ -->
      <div id="pos-tab-expenses" class="pos-tab-content${S._posTab === 'expenses' ? ' active' : ''}">
        <div class="pos-form-wrap" style="border-color:var(--redl)">
          <div class="pos-form-title" style="color:var(--red)">
            ${svgIcon('expense')}
            <span>${S.lang === 'sw' ? 'Rekodi Matumizi' : 'Record Expense'}</span>
          </div>

          <div class="pos-field-group">
            <label class="pos-label">${S.lang === 'sw' ? 'Aina ya Matumizi' : 'Expense Category'}</label>
            <select class="pos-input pos-select" id="e-cat" onchange="App.posSaveExpForm()">
              <option value="rent"${S._posExpForm.cat === 'rent' ? ' selected' : ''}>${S.lang === 'sw' ? ' Kodi' : ' Rent'}</option>
              <option value="transport"${S._posExpForm.cat === 'transport' ? ' selected' : ''}>${S.lang === 'sw' ? ' Usafiri' : ' Transport'}</option>
              <option value="salary"${S._posExpForm.cat === 'salary' ? ' selected' : ''}>${S.lang === 'sw' ? ' Mshahara' : ' Salary'}</option>
              <option value="utilities"${S._posExpForm.cat === 'utilities' ? ' selected' : ''}>${S.lang === 'sw' ? ' Umeme/Maji' : ' Utilities'}</option>
              <option value="stock"${S._posExpForm.cat === 'stock' ? ' selected' : ''}>${S.lang === 'sw' ? ' Kununua Stok' : ' Stock Purchase'}</option>
              <option value="other"${S._posExpForm.cat === 'other' ? ' selected' : ''}>${S.lang === 'sw' ? ' Nyingine' : ' Other'}</option>
            </select>
          </div>

          <div class="pos-field-group">
            <label class="pos-label">${S.lang === 'sw' ? 'Kiasi' : 'Amount'} *</label>
            <input class="pos-input pos-big" id="e-amt" type="number" min="0" placeholder="0"
              value="${S._posExpForm.amt}" oninput="App.posSaveExpForm()" style="border-color:var(--red)!important"/>
          </div>

          <div class="pos-field-group">
            <label class="pos-label">${S.lang === 'sw' ? 'Maelezo' : 'Description'} *</label>
            <input class="pos-input" id="e-desc" placeholder="${S.lang === 'sw' ? 'mfano: Kodi ya mwezi wa Aprili' : 'e.g. April monthly rent'}"
              value="${S._posExpForm.desc}" oninput="App.posSaveExpForm()"/>
          </div>

          <!-- Net impact preview -->
          <div class="pos-exp-preview">
            <div style="font-size:.72rem;font-weight:700;color:var(--s500);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.4rem">${S.lang === 'sw' ? 'Athari kwa Faida Halisi' : 'Impact on Net Profit'}</div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:.9rem;color:var(--s700)">${S.lang === 'sw' ? 'Faida Halisi Baada ya Matumizi Haya' : 'Net after this expense'}</span>
              <strong id="exp-impact" style="font-size:1.1rem;color:${netProfit >= 0 ? 'var(--g700)' : 'var(--red)'}">${fmt(netProfit)}</strong>
            </div>
          </div>

          <button class="pos-rec-btn rec-red" onclick="App.recordExpense()">
            <span id="rec-exp-txt">${S.lang === 'sw' ? 'Rekodi Matumizi' : 'Record Expense'}</span>
          </button>
        </div>
      </div>

      <!-- ══ TAB: HISTORY ══ -->
      <div id="pos-tab-history" class="pos-tab-content${S._posTab === 'history' ? ' active' : ''}">

        <!-- Summary banner -->
        <div class="pos-history-summary">
          <div class="pos-hist-item green">
            <div class="pos-hist-lbl">${S.lang === 'sw' ? 'Mapato' : 'Revenue'}</div>
            <div class="pos-hist-val">${fmt(todayRev)}</div>
          </div>
          <div class="pos-hist-sep">−</div>
          <div class="pos-hist-item red">
            <div class="pos-hist-lbl">${S.lang === 'sw' ? 'Matumizi' : 'Expenses'}</div>
            <div class="pos-hist-val">${fmt(todayExp)}</div>
          </div>
          <div class="pos-hist-sep">=</div>
          <div class="pos-hist-item ${netProfit >= 0 ? 'green' : 'red'}">
            <div class="pos-hist-lbl">${S.lang === 'sw' ? 'Faida Halisi' : 'Net'}</div>
            <div class="pos-hist-val" style="color:${netProfit < 0 ? 'var(--red)' : 'inherit'}">${fmt(netProfit)}</div>
          </div>
        </div>

        <!-- Sales list -->
        <div class="card" style="margin-bottom:1rem"><div class="cp">
          <div class="sh">
            <span class="st">${S.lang === 'sw' ? 'Mauzo Leo' : "Today's Sales"} (${allSales.length})</span>
            ${offS.length > 0 ? `<span class="offline-pill">${offS.length} offline</span>` : ''}
          </div>
          ${allSales.length ? `
          <div style="display:flex;flex-direction:column;gap:.5rem">
            ${allSales.map(s => {
              const rev    = s.revenue  || s.selling_price * s.qty  || 0;
              const profit = s.profit   || (s.selling_price - s.buying_price) * s.qty || 0;
              // FIX: correct margin formula
              const m      = s.selling_price > 0 ? Math.round((s.selling_price - s.buying_price) / s.selling_price * 100) : 0;
              const isLoss = profit < 0;
              return `<div class="pos-hist-card${s._off ? ' offline-card' : ''}">
                <div class="pos-hist-card-left">
                  <div class="pos-hist-prod">${s.product_name}${s._off ? ' <span class="offline-tag"></span>' : ''}</div>
                  <div class="pos-hist-meta">${s.qty} × ${fmt(s.selling_price)} · ${s.created_at?.slice(11, 16) || '—'}</div>
                </div>
                <div class="pos-hist-card-right">
                  <div class="pos-hist-rev">${fmt(rev)}</div>
                  <div class="pos-hist-profit" style="color:${isLoss ? 'var(--red)' : 'var(--g700)'}">
                    ${isLoss ? '▼' : '▲'} ${fmt(Math.abs(profit))} (${m}%)
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>` : `<div class="empty"><div class="empty-ic"></div><div class="empty-s">${S.lang === 'sw' ? 'Hakuna mauzo leo' : 'No sales today'}</div></div>`}
        </div></div>

        <!-- Expenses list -->
        <div class="card"><div class="cp">
          <div class="sh">
            <span class="st">${S.lang === 'sw' ? 'Matumizi Leo' : "Today's Expenses"} (${allExps.length})</span>
          </div>
          ${allExps.length ? `
          <div style="display:flex;flex-direction:column;gap:.5rem">
            ${allExps.map(e => `
              <div class="pos-hist-card" style="border-left-color:var(--red)">
                <div class="pos-hist-card-left">
                  <div class="pos-hist-prod">${e.description}</div>
                  <div class="pos-hist-meta"><span class="pill p-pen" style="font-size:.62rem">${e.category}</span> · ${e.expense_date || e.created_at?.slice(0, 10) || '—'}</div>
                </div>
                <div class="pos-hist-card-right">
                  <div class="pos-hist-rev" style="color:var(--red)">− ${fmt(e.amount)}</div>
                </div>
              </div>`).join('')}
          </div>` : `<div class="empty"><div class="empty-ic"></div><div class="empty-s">${S.lang === 'sw' ? 'Hakuna matumizi leo' : 'No expenses today'}</div></div>`}
        </div></div>
      </div>`;

    // Animate KPI numbers
    setTimeout(() => {
      animateCount($('pos-rev'),    todayRev,    'TZS ');
      animateCount($('pos-profit'), todayProfit, 'TZS ');
      animateCount($('pos-exp'),    todayExp,    'TZS ');
      animateCount($('pos-net'),    netProfit,   'TZS ');
    }, 300);

    // Restore live calc if form had values
    App.posCalc();
  },

  // Tab switching — preserves form values via S._posTab
  posTab(tab, btn) {
    S._posTab = tab;
    document.querySelectorAll('.pos-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.pos-tab-content').forEach(el => el.classList.remove('active'));
    const active = $(`pos-tab-${tab}`);
    if (active) {
      active.classList.add('active');
      active.style.opacity = '0';
      active.style.transform = 'translateY(8px)';
      requestAnimationFrame(() => {
        active.style.transition = 'opacity .25s ease, transform .25s ease';
        active.style.opacity = '1';
        active.style.transform = 'translateY(0)';
      });
    }
  },

  // Save form state to S so switching tabs preserves input
  posSaveForm() {
    S._posSaleForm = {
      prod: $('s-prod')?.value || '',
      cat:  $('s-cat')?.value  || 'beverages',
      qty:  $('s-qty')?.value  || 1,
      buy:  $('s-buy')?.value  || '',
      sell: $('s-sell')?.value || '',
    };
  },
  posSaveExpForm() {
    S._posExpForm = {
      cat:  $('e-cat')?.value  || 'rent',
      amt:  $('e-amt')?.value  || '',
      desc: $('e-desc')?.value || '',
    };
    // Update impact preview live
    const amt = parseFloat($('e-amt')?.value || '0');
    const impactEl = $('exp-impact');
    if (impactEl) {
      const allExpsTotal = parseFloat(impactEl.dataset.base || '0') + amt;
      // We compute current netProfit from DOM is complex — just show amt deducted
      impactEl.textContent = `−${fmt(amt)}`;
      impactEl.style.color = 'var(--red)';
    }
  },

  // FIX: live calculator — correct margin formula (sell-buy)/sell*100
  posCalc() {
    const qty  = parseFloat($('s-qty')?.value  || 0);
    const buy  = parseFloat($('s-buy')?.value  || 0);
    const sell = parseFloat($('s-sell')?.value || 0);
    const calc = $('pos-calc');
    if (!calc) return;
    if (sell > 0 && qty > 0) {
      calc.style.display = '';
      const rev    = sell * qty;
      const profit = (sell - buy) * qty;
      // FIX: (sell - buy) / sell * 100, NOT / rev
      const margin = sell > 0 ? Math.round((sell - buy) / sell * 100) : 0;
      const mColor = margin >= 25 ? 'var(--g700)' : margin >= 10 ? 'var(--amber)' : 'var(--red)';
      const revEl  = $('calc-rev'), proEl = $('calc-profit'), marEl = $('calc-margin');
      if (revEl)  revEl.textContent  = fmt(rev);
      if (proEl)  proEl.textContent  = fmt(profit);
      if (proEl)  proEl.style.color  = profit >= 0 ? 'var(--g600)' : 'var(--red)';
      if (marEl)  marEl.textContent  = `${margin}%`;
      if (marEl)  marEl.style.color  = mColor;
    } else {
      calc.style.display = 'none';
    }
  },

  async recordSale() {
    const prod = $('s-prod')?.value.trim();
    const cat  = $('s-cat')?.value;
    const qty  = parseInt($('s-qty')?.value   || '1');
    const buy  = parseFloat($('s-buy')?.value || '0');
    const sell = parseFloat($('s-sell')?.value || '0');
    if (!prod || !sell || qty < 1)
      return toast(S.lang === 'sw' ? 'Jaza jina la bidhaa na bei ya kuuza' : 'Fill product name and selling price', 'e');

    // Guard: if user has a dev ID, save offline only (don't attempt Supabase)
    const hasRealId = S.user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(S.user.id);

    // Compute values — margin stored only in IndexedDB, not sent to Supabase
    const revenue = sell * qty;
    const profit  = (sell - buy) * qty;
    const margin  = sell > 0 ? Math.round((sell - buy) / sell * 100) : 0;

    // data object used for IndexedDB (includes all fields for local display)
    const data = {
      user_id: S.user.id, product_name: prod, category: cat,
      qty, buying_price: buy, selling_price: sell,
      revenue, profit, margin,
      sale_date: today(), store_id: S.store?.id || null,
    };

    // Supabase-safe object — only the core columns every sales table has
    // profit, revenue, margin are NOT sent — they may not exist in schema
    const supabaseData = {
      user_id:       S.user.id,
      product_name:  prod,
      category:      cat,
      qty,
      buying_price:  buy,
      selling_price: sell,
      sale_date:     today(),
      store_id:      S.store?.id || null,
    };

    setBusy('rec-sale-txt', true);
    if (S.isOnline && hasRealId) {
      const { error } = await sb.from('sales').insert([supabaseData]);
      if (error) {
        await posDbAdd('sales', data);
        toast(S.lang === 'sw' ? 'Imehifadhiwa offline' : 'Saved offline', 'w');
        console.warn('recordSale error:', error.message);
      } else {
        toast(S.lang === 'sw' ? 'Mauzo yamerekodiwa!' : 'Sale recorded!', 's');
      }
    } else {
      await posDbAdd('sales', data);
      toast(S.lang === 'sw' ? 'Imehifadhiwa offline — itasync baadaye' : 'Saved offline', 'w');
    }
    setBusy('rec-sale-txt', false, `${S.lang === 'sw' ? 'Rekodi Mauzo' : 'Record Sale'}`);

    // Clear form + state
    S._posSaleForm = { prod: '', cat: 'beverages', qty: 1, buy: '', sell: '' };
    if ($('s-prod'))  $('s-prod').value  = '';
    if ($('s-qty'))   $('s-qty').value   = '1';
    if ($('s-buy'))   $('s-buy').value   = '';
    if ($('s-sell'))  $('s-sell').value  = '';
    if ($('pos-calc')) $('pos-calc').style.display = 'none';

    // Refresh POS page to update history + KPIs
    App.pagePOS();
  },

  async recordExpense() {
    const cat  = $('e-cat')?.value;
    const desc = $('e-desc')?.value.trim();
    const amt  = parseFloat($('e-amt')?.value || '0');
    if (!desc || !amt)
      return toast(S.lang === 'sw' ? 'Jaza maelezo na kiasi' : 'Fill description and amount', 'e');

    const data = {
      user_id: S.user.id, category: cat, description: desc,
      amount: amt, expense_date: today(), store_id: S.store?.id || null,
    };

    setBusy('rec-exp-txt', true);
    if (S.isOnline) {
      const { error } = await sb.from('expenses').insert([data]);
      if (error) { await posDbAdd('expenses', data); toast('Saved offline', 'w'); }
      else toast(S.lang === 'sw' ? 'Matumizi yamerekodiwa!' : 'Expense recorded!', 's');
    } else {
      await posDbAdd('expenses', data);
      toast(S.lang === 'sw' ? 'Imehifadhiwa offline' : 'Saved offline', 'w');
    }
    setBusy('rec-exp-txt', false, `${S.lang === 'sw' ? 'Rekodi Matumizi' : 'Record Expense'}`);

    S._posExpForm = { cat: 'rent', amt: '', desc: '' };
    if ($('e-amt'))  $('e-amt').value  = '';
    if ($('e-desc')) $('e-desc').value = '';

    App.pagePOS();
  },

  // ── REPORTS ──────────────────────────────────────────────
  async pageReports() {
    const view = $('av');
    view.innerHTML = `
      <div class="rep-period-tabs">
        <button class="pertab on" onclick="App.loadReports('today',this)">${S.lang === 'sw' ? 'Leo' : 'Today'}</button>
        <button class="pertab" onclick="App.loadReports('week',this)">${S.lang === 'sw' ? 'Wiki' : 'Week'}</button>
        <button class="pertab" onclick="App.loadReports('month',this)">${S.lang === 'sw' ? 'Mwezi' : 'Month'}</button>
        <button class="pertab" onclick="App.loadReports('year',this)">${S.lang === 'sw' ? 'Mwaka' : 'Year'}</button>
      </div>
      <div id="rep-body"><div class="page-loading"><span class="spin spin-dark"></span></div></div>`;
    await App.loadReports('today', view.querySelector('.pertab'));
  },

  async loadReports(period, btn) {
    document.querySelectorAll('.pertab').forEach(b => b.classList.remove('on'));
    if (btn) btn.classList.add('on');
    const days      = { today: 0, week: 7, month: 30, year: 365 }[period] || 0;
    const startDate = days === 0 ? today() : new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
    const uid = S.user.id, sid = S.store?.id;
    let sq = sb.from('sales').select('*').eq('user_id', uid).gte('sale_date', startDate);
    let eq = sb.from('expenses').select('*').eq('user_id', uid).gte('expense_date', startDate);
    if (sid) { sq = sq.eq('store_id', sid); eq = eq.eq('store_id', sid); }
    const [{ data: sales }, { data: exps }] = await Promise.all([sq, eq]);
    const allS = sales || [], allE = exps || [];
    const rev     = allS.reduce((s, r) => s + (r.revenue  || r.selling_price * r.qty || 0), 0);
    const cost    = allS.reduce((s, r) => s + (r.buying_price * r.qty || 0), 0);
    const profit  = allS.reduce((s, r) => s + (r.profit   || (r.selling_price - r.buying_price) * r.qty || 0), 0);
    const expT    = allE.reduce( (s, e) => s + (e.amount   || 0), 0);
    const net     = profit - expT;
    // FIX: correct margin formula
    const margin  = rev > 0 ? (profit / rev * 100).toFixed(1) : 0;
    const txCount = allS.length;
    const avgSale = txCount > 0 ? rev / txCount : 0;

    const byCat = {};
    allS.forEach(s => {
      const cat = s.category || 'other';
      if (!byCat[cat]) byCat[cat] = { rev: 0, profit: 0, qty: 0 };
      byCat[cat].rev    += s.revenue  || s.selling_price * s.qty || 0;
      byCat[cat].profit += s.profit   || (s.selling_price - s.buying_price) * s.qty || 0;
      byCat[cat].qty    += s.qty || 0;
    });

    const byProd = {};
    allS.forEach(s => {
      if (!byProd[s.product_name]) byProd[s.product_name] = { rev: 0, qty: 0, profit: 0 };
      byProd[s.product_name].rev    += s.revenue  || s.selling_price * s.qty || 0;
      byProd[s.product_name].qty    += s.qty || 0;
      byProd[s.product_name].profit += s.profit   || (s.selling_price - s.buying_price) * s.qty || 0;
    });
    const topProds   = Object.entries(byProd).sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);
    const maxProdRev = Math.max(...topProds.map(([, v]) => v.rev), 1);
    const byExp      = {};
    allE.forEach(e => { byExp[e.category] = (byExp[e.category] || 0) + e.amount; });
    const maxExpVal  = Math.max(...Object.values(byExp), 1);
    const trend      = {};
    allS.forEach(s => { const d = s.sale_date || s.created_at?.slice(0, 10); if (d) trend[d] = (trend[d] || 0) + (s.revenue || s.selling_price * s.qty || 0); });
    const maxCatRev  = Math.max(...Object.values(byCat).map(v => v.rev), 1);

    $('rep-body').innerHTML = `
      <div class="rep-kpis">
        <div class="rep-kpi green"><div class="rep-kpi-label">${S.lang === 'sw' ? 'Jumla Mapato' : 'Total Revenue'}</div><div class="rep-kpi-val">${fmt(rev)}</div><div class="rep-kpi-sub">${txCount} ${S.lang === 'sw' ? 'mauzo' : 'transactions'}</div></div>
        <div class="rep-kpi ${profit >= 0 ? 'green' : 'red'}"><div class="rep-kpi-label">${S.lang === 'sw' ? 'Faida Ghafi' : 'Gross Profit'}</div><div class="rep-kpi-val">${fmt(profit)}</div><div class="rep-kpi-sub">Margin: ${margin}%</div></div>
        <div class="rep-kpi red"><div class="rep-kpi-label">${S.lang === 'sw' ? 'Matumizi' : 'Expenses'}</div><div class="rep-kpi-val">${fmt(expT)}</div><div class="rep-kpi-sub">${Object.keys(byExp).length} ${S.lang === 'sw' ? 'aina' : 'categories'}</div></div>
        <div class="rep-kpi ${net >= 0 ? 'green' : 'red'}"><div class="rep-kpi-label">${S.lang === 'sw' ? 'Faida Halisi' : 'Net Profit'}</div><div class="rep-kpi-val">${fmt(net)}</div><div class="rep-kpi-sub">${S.lang === 'sw' ? 'Baada ya matumizi' : 'After expenses'}</div></div>
      </div>
      <div class="rsec" style="margin-bottom:1rem">
        <div class="rsec-t">${S.lang === 'sw' ? 'Muhtasari wa Fedha' : 'Financial Summary'}</div>
        <div class="rrow"><span class="rl">${S.lang === 'sw' ? 'Jumla TX' : 'Total Transactions'}</span><span class="rv">${txCount}</span></div>
        <div class="rrow"><span class="rl">${S.lang === 'sw' ? 'Wastani kwa Mauzo' : 'Avg per Sale'}</span><span class="rv">${fmt(avgSale)}</span></div>
        <div class="rrow"><span class="rl">${S.lang === 'sw' ? 'Gharama ya Bidhaa' : 'Cost of Goods'}</span><span class="rv r">${fmt(cost)}</span></div>
        <div class="rrow"><span class="rl">Gross Profit</span><span class="rv ${profit >= 0 ? 'g' : 'r'}">${fmt(profit)}</span></div>
        <div class="rrow"><span class="rl">${S.lang === 'sw' ? 'Matumizi' : 'Expenses'}</span><span class="rv r">${fmt(expT)}</span></div>
        <div class="rrow div"><span class="rl" style="font-weight:800">Net Profit</span><span class="rv ${net >= 0 ? 'g' : 'r'}" style="font-size:1.1rem;font-weight:800">${fmt(net)}</span></div>
      </div>
      <div class="rsec" style="margin-bottom:1rem">
        <div class="rsec-t">${S.lang === 'sw' ? 'Bidhaa Zinazoongoza' : 'Top Products'}</div>
        ${topProds.length ? topProds.map(([name, v], i) => {
          const isLoss = v.profit < 0;
          return `<div class="top-prod-row">
            <div class="top-prod-rank">${i + 1}</div>
            <div class="top-prod-info">
              <div class="top-prod-name">${name}</div>
              <div class="top-prod-bar-wrap"><div class="top-prod-bar" style="width:${Math.round(v.rev / maxProdRev * 100)}%;background:${isLoss ? 'var(--red)' : 'linear-gradient(90deg,var(--g700),var(--g500))'}"></div></div>
              <div class="top-prod-meta">
                <span>${fmt(v.rev)}</span>
                <span style="color:${isLoss ? 'var(--red)' : 'var(--g700)'}; font-weight:700">${isLoss ? 'Hasara' : fmt(v.profit) + ' faida'}</span>
                <span style="color:var(--s500)">Qty: ${v.qty}</span>
              </div>
            </div>
          </div>`;
        }).join('') : `<div style="color:var(--s500);text-align:center;padding:1rem">${S.lang === 'sw' ? 'Hakuna data' : 'No data'}</div>`}
      </div>
      <div class="rsec" style="margin-bottom:1rem">
        <div class="rsec-t"> ${S.lang === 'sw' ? 'Mauzo kwa Aina' : 'Sales by Category'}</div>
        ${Object.entries(byCat).sort((a, b) => b[1].rev - a[1].rev).map(([cat, v]) => {
          const catMargin = v.rev > 0 ? Math.round(v.profit / v.rev * 100) : 0;
          const isLoss = v.profit < 0;
          return `<div class="cat-bar-row" style="margin-bottom:.75rem">
            <div class="cat-bar-label">${CAT_ICONS[cat] || ''} ${cat}</div>
            <div>
              <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${Math.round(v.rev / maxCatRev * 100)}%;${isLoss ? 'background:var(--red)' : ''}"></div></div>
              <div style="display:flex;justify-content:space-between;font-size:.72rem;margin-top:.2rem">
                <span style="color:var(--s500)">${fmt(v.rev)}</span>
                <span style="color:${isLoss ? 'var(--red)' : catMargin >= 15 ? 'var(--g700)' : 'var(--s500)'}">
                  ${isLoss ? 'Hasara' : `Faida: ${fmt(v.profit)}`}
                </span>
              </div>
            </div>
          </div>`;
        }).join('') || `<div style="color:var(--s500);text-align:center;padding:1rem">${S.lang === 'sw' ? 'Hakuna data' : 'No data'}</div>`}
      </div>
      ${expT > 0 ? `<div class="rsec" style="margin-bottom:1rem">
        <div class="rsec-t">${S.lang === 'sw' ? 'Matumizi kwa Aina' : 'Expenses by Category'}</div>
        ${Object.entries(byExp).sort((a, b) => b[1] - a[1]).map(([cat, val]) => `
          <div class="cat-bar-row" style="margin-bottom:.65rem">
            <div class="cat-bar-label" style="color:var(--red)">${cat}</div>
            <div>
              <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${Math.round(val / maxExpVal * 100)}%;background:linear-gradient(90deg,var(--red),#f87171)"></div></div>
              <div style="font-size:.75rem;color:var(--red);font-weight:700;margin-top:.2rem">${fmt(val)}</div>
            </div>
          </div>`).join('')}
      </div>` : ''}
      ${period !== 'today' && Object.keys(trend).length > 0 ? `
      <div class="rsec">
        <div class="rsec-t">${S.lang === 'sw' ? 'Mwelekeo wa Mauzo' : 'Sales Trend'}</div>
        <div class="trend-wrap">
          ${Object.entries(trend).sort().slice(-14).map(([date, val]) => {
            const maxT = Math.max(...Object.values(trend), 1);
            const h = Math.max(8, Math.round(val / maxT * 80));
            return `<div class="trend-col">
              <div class="trend-bar" style="height:${h}px" title="${date}: ${fmt(val)}"></div>
              <div class="trend-label">${date.slice(5)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}`;
  },

  // ── DEBTS ─────────────────────────────────────────────────
  async pageDebts() {
    const { data: debts } = await sb.from('debts').select('*').eq('user_id', S.user.id)
      .order('created_at', { ascending: false });
    const view = $('av');
    view.innerHTML = `
      <div class="card" style="margin-bottom:1rem"><div class="cp">
        <div class="page-title">${S.lang === 'sw' ? 'Rekodi Deni Jipya' : 'Record New Debt'}</div>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          <div class="fr">
            <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Jina la Mteja' : 'Customer Name'} *</label>
              <input class="fi" id="d-name" placeholder="${S.lang === 'sw' ? 'Jina la mteja' : 'Customer name'}"/></div>
            <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Simu' : 'Phone'}</label>
              <input class="fi" id="d-phone" type="tel" placeholder="07xxxxxxxx"/></div>
          </div>
          <div class="fr">
            <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Kiasi' : 'Amount'} *</label>
              <input class="fi" id="d-amt" type="number" min="0" placeholder="0"/></div>
            <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Tarehe ya Kulipa' : 'Due Date'}</label>
              <input class="fi" id="d-due" type="date"/></div>
          </div>
          <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Maelezo' : 'Description'}</label>
            <input class="fi" id="d-desc" placeholder="${S.lang === 'sw' ? 'mfano: Mkopo wa mchele' : 'e.g. Rice credit'}"/></div>
          <button class="btn btn-primary" onclick="App.addDebt()" style="max-width:200px">
            <span id="add-debt-txt">${S.lang === 'sw' ? 'Rekodi Deni' : 'Record Debt'}</span>
          </button>
        </div>
      </div></div>
      <div id="debts-list">
        ${(debts || []).map(d => {
          const paid = d.amount_paid || 0;
          const remain = d.amount - paid;
          const pct = Math.min(100, Math.round(paid / d.amount * 100));
          return `<div class="debt-card card">
            <div class="cp">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
                <div><div style="font-weight:800">${d.customer_name}</div><div style="font-size:.75rem;color:var(--s500)">${d.customer_phone || ''}</div></div>
                <span class="pill ${d.status === 'paid' ? 'p-paid' : d.status === 'partial' ? 'p-par' : 'p-unp'}">${d.status}</span>
              </div>
              <div class="debt-progress"><div class="debt-bar" style="width:${pct}%"></div></div>
              <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.5rem">
                <span style="color:var(--s500)">${S.lang === 'sw' ? 'Kilicholipwa' : 'Paid'}: <strong style="color:var(--g700)">${fmt(paid)}</strong></span>
                <span style="color:var(--s500)">${S.lang === 'sw' ? 'Kinachobaki' : 'Remaining'}: <strong style="color:var(--red)">${fmt(remain)}</strong></span>
              </div>
              ${d.status !== 'paid' ? `<div style="display:flex;gap:.4rem;flex-wrap:wrap">
                <input class="fi" id="dp-${d.id}" type="number" min="0" placeholder="${S.lang === 'sw' ? 'Kiasi' : 'Amount'}" style="max-width:120px;padding:.4rem .6rem;font-size:.85rem"/>
                <button class="btn-sm btn-sm-green" onclick="App.payDebt('${d.id}')">${S.lang === 'sw' ? 'Rekodi Malipo' : 'Record Payment'}</button>
                <button class="btn-sm btn-sm-red" onclick="App.deleteDebt('${d.id}')">${S.lang === 'sw' ? 'Futa' : 'Delete'}</button>
              </div>` : ''}
            </div>
          </div>`;
        }).join('') || `<div class="empty"><div class="empty-ic"></div><div class="empty-t">${S.lang === 'sw' ? 'Hakuna madeni' : 'No debts'}</div></div>`}
      </div>`;
  },

  async addDebt() {
    const name = $('d-name')?.value.trim(), phone = $('d-phone')?.value,
      amt = parseFloat($('d-amt')?.value || '0'), due = $('d-due')?.value, desc = $('d-desc')?.value;
    if (!name || !amt) return toast(S.lang === 'sw' ? 'Jaza jina na kiasi' : 'Fill name and amount', 'e');
    setBusy('add-debt-txt', true);
    const { error } = await sb.from('debts').insert([{
      user_id: S.user.id, customer_name: name, customer_phone: phone,
      amount: amt, due_date: due || null, description: desc, status: 'unpaid',
    }]);
    setBusy('add-debt-txt', false, S.lang === 'sw' ? 'Rekodi Deni' : 'Record Debt');
    if (error) return toast('Hitilafu', 'e');
    toast(S.lang === 'sw' ? 'Deni limerekodiwa!' : 'Debt recorded!', 's');
    App.pageDebts();
  },

  async payDebt(id) {
    const extra = parseFloat($(`dp-${id}`)?.value || '0');
    if (!extra) return toast(S.lang === 'sw' ? 'Weka kiasi' : 'Enter amount', 'e');
    const { data: debt } = await sb.from('debts').select('amount,amount_paid').eq('id', id).single();
    const newPaid = (debt.amount_paid || 0) + extra;
    const status  = newPaid >= debt.amount ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
    await sb.from('debts').update({ amount_paid: newPaid, status }).eq('id', id);
    toast(S.lang === 'sw' ? 'Malipo yamerekodiwa!' : 'Payment recorded!', 's');
    App.pageDebts();
  },

  async deleteDebt(id) {
    if (!confirm(S.lang === 'sw' ? 'Futa deni hili?' : 'Delete this debt?')) return;
    await sb.from('debts').delete().eq('id', id);
    toast(S.lang === 'sw' ? 'Deni limefutwa' : 'Debt deleted', 's');
    App.pageDebts();
  },

  // ── USERS (Admin) ─────────────────────────────────────────
  async pageUsers() {
    const { data: users } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    const view = $('av');
    view.innerHTML = `
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('users')}</span><span style="font-size:.75rem;color:var(--s500)">${(users || []).length} users</span></div>
        <div class="tw"><table class="dt">
          <thead><tr><th>JINA</th><th>SIMU</th><th>AINA</th><th>MKOA</th><th>HALI</th></tr></thead>
          <tbody>${(users || []).map(u => `
            <tr class="dt-row">
              <td><strong>${u.store_name}</strong></td>
              <td style="font-size:.8rem">${u.phone_number}</td>
              <td>${statusBadge(u.role)}</td>
              <td style="font-size:.78rem">${u.district || u.region || '—'}</td>
              <td><span class="pill ${u.is_active ? 'p-del' : 'p-can'}">${u.is_active ? 'Active' : 'Blocked'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div></div>`;
  },

  async pageAnalytics() {
    const [{ data: profiles }, { data: orders }] = await Promise.all([
      sb.from('profiles').select('role'),
      sb.from('orders').select('total_price,status'),
    ]);
    const retailers    = (profiles || []).filter(p => p.role === 'retailer').length;
    const distributors = (profiles || []).filter(p => p.role === 'distributor').length;
    const totalOrders  = (orders || []).length;
    const totalValue   = (orders || []).reduce((s, o) => s + (o.total_price || 0), 0);
    const delivered    = (orders || []).filter(o => o.status === 'delivered').length;
    const view = $('av');
    view.innerHTML = `
      <div class="sr">
        <div class="sc green"><div class="sic">${svgIcon('users')}</div><div class="sl">Retailers</div><div class="sv">${retailers}</div></div>
        <div class="sc blue"><div class="sic">${svgIcon('orders')}</div><div class="sl">Distributors</div><div class="sv">${distributors}</div></div>
        <div class="sc amber"><div class="sic">${svgIcon('pkg')}</div><div class="sl">Orders</div><div class="sv">${totalOrders}</div></div>
        <div class="sc green"><div class="sic">${svgIcon('revenue')}</div><div class="sl">GMV</div><div class="sv">${fmt(totalValue)}</div></div>
      </div>
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">Platform Stats</span></div>
        <div class="rrow"><span class="rl">Total Orders</span><span class="rv">${totalOrders}</span></div>
        <div class="rrow"><span class="rl">Delivered</span><span class="rv g">${delivered}</span></div>
        <div class="rrow"><span class="rl">Platform GMV</span><span class="rv g">${fmt(totalValue)}</span></div>
        <div class="rrow"><span class="rl">Avg Order Value</span><span class="rv">${fmt(totalOrders ? totalValue / totalOrders : 0)}</span></div>
      </div></div>`;
  },

  async pageSupervisor() {
    const { data: sups } = await sb.from('supervisors')
      .select('*').eq('business_id', S.user.id).eq('is_active', true);
    $('av').innerHTML = `
      <div class="sup-hero">
        <div class="sup-hero-icon"></div>
        <div>
          <div class="sup-hero-title">${S.lang === 'sw' ? 'Wasimamizi wa Biashara' : 'Business Supervisors'}</div>
          <div class="sup-hero-sub">${S.lang === 'sw' ? 'Mtu anayeweza kuona ufanisi wako bila kuingiliana na data' : 'View-only access to your business performance'}</div>
        </div>
      </div>
      <div class="card" style="margin-bottom:1rem"><div class="cp">
        <div class="page-title">${S.lang === 'sw' ? 'Ongeza Msimamizi' : 'Add Supervisor'}</div>
        <div style="display:flex;flex-direction:column;gap:.875rem;margin-top:.875rem">
          <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Jina la Msimamizi' : 'Supervisor Name'} *</label>
            <input class="fi" id="sup-name" placeholder="${S.lang === 'sw' ? 'mfano: Baba John' : 'e.g. John Smith'}"/></div>
          <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'} *</label>
            <div class="iw"><div class="pfx"><span class="pfx-flag">TZ</span><span class="pfx-code">+255</span></div>
              <input class="fi fi-phone" id="sup-phone" type="tel" inputmode="numeric" maxlength="9" placeholder="712 345 678" oninput="this.value=this.value.replace(/\D/g,'').slice(0,9)"/></div></div>
          <div class="fg"><label class="fl">${S.lang === 'sw' ? 'Kiwango cha Ufikiaji' : 'Access Level'}</label>
            <select class="fi" id="sup-access">
              <option value="read">${S.lang === 'sw' ? 'Kuona tu' : 'View Only'}</option>
              <option value="full">${S.lang === 'sw' ? 'Kamili' : 'Full Access'}</option>
            </select></div>
          <div class="alert al-i">ℹ️ ${S.lang === 'sw' ? 'Msimamizi atapata PIN kupitia SMS' : 'Supervisor will receive a PIN via SMS'}</div>
          <button class="btn btn-primary" onclick="App.addSupervisor()">
            <span id="add-sup-txt">+ ${S.lang === 'sw' ? 'Ongeza Msimamizi' : 'Add Supervisor'}</span>
          </button>
        </div>
      </div></div>
      <div class="page-title">${S.lang === 'sw' ? 'Wasimamizi Waliopo' : 'Current Supervisors'} (${(sups || []).length})</div>
      ${(sups || []).length === 0
        ? `<div class="empty"><div class="empty-ic"></div><div class="empty-t">${S.lang === 'sw' ? 'Hakuna msimamizi bado' : 'No supervisors yet'}</div></div>`
        : (sups || []).map(sup => `
          <div class="sup-card">
            <div class="sup-avatar">${sup.name[0].toUpperCase()}</div>
            <div class="sup-info">
              <div class="sup-name">${sup.name}</div>
              <div class="sup-phone">${sup.phone_number}</div>
              <div class="sup-access">${sup.access_level === 'full' ? `${S.lang === 'sw' ? 'Ufikiaji Kamili' : 'Full Access'}` : `${S.lang === 'sw' ? 'Kuona Tu' : 'View Only'}`}</div>
            </div>
            <button class="btn-sm btn-sm-red" onclick="App.removeSupervisor('${sup.id}')">${S.lang === 'sw' ? 'Ondoa' : 'Remove'}</button>
          </div>`).join('')}`;
  },

  async addSupervisor() {
    const name   = $('sup-name')?.value.trim();
    const rawPh  = $('sup-phone')?.value.trim();
    const access = $('sup-access')?.value || 'read';
    if (!name) return toast(S.lang === 'sw' ? 'Weka jina la msimamizi' : 'Enter supervisor name', 'e');
    const phone = normPhone(rawPh);
    if (!phone) return toast(S.lang === 'sw' ? 'Namba si sahihi' : 'Invalid phone number', 'e');
    setBusy('add-sup-txt', true);
    const { data: existing } = await sb.from('profiles').select('id,store_name').eq('phone_number', phone).maybeSingle();
    const { error } = await sb.from('supervisors').insert([{
      business_id: S.user.id, supervisor_id: existing?.id || null,
      phone_number: phone, name, access_level: access, is_active: true,
    }]);
    setBusy('add-sup-txt', false, `+ ${S.lang === 'sw' ? 'Ongeza Msimamizi' : 'Add Supervisor'}`);
    if (error) return toast(S.lang === 'sw' ? 'Hitilafu ya kuongeza' : 'Error adding supervisor', 'e');
    toast(S.lang === 'sw' ? 'Msimamizi ameongezwa!' : 'Supervisor added!', 's');
    App.pageSupervisor();
  },

  async removeSupervisor(supId) {
    if (!confirm(S.lang === 'sw' ? 'Ondoa msimamizi huyu?' : 'Remove this supervisor?')) return;
    await sb.from('supervisors').update({ is_active: false }).eq('id', supId);
    toast(S.lang === 'sw' ? 'Msimamizi ameondolewa' : 'Supervisor removed', 's');
    App.pageSupervisor();
  },

  async pageSupervisorDash() {
    const { data: supRecord } = await sb.from('supervisors')
      .select('*,profiles!business_id(id,store_name,role,region,district)')
      .eq('phone_number', S.user.phone_number).eq('is_active', true).maybeSingle();
    if (!supRecord) {
      $('av').innerHTML = `<div class="empty"><div class="empty-ic"></div><div class="empty-t">${S.lang === 'sw' ? 'Huna biashara unayoangalia' : 'No business assigned'}</div></div>`;
      return;
    }
    const bizId = supRecord.business_id, bizName = supRecord.profiles?.store_name || 'Biashara';
    const startDate = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const [{ data: sales }, { data: exps }, { data: orders }, { data: debts }] = await Promise.all([
      sb.from('sales').select('revenue,profit,sale_date,product_name,qty').eq('user_id', bizId).gte('sale_date', startDate),
      sb.from('expenses').select('amount,category,expense_date').eq('user_id', bizId).gte('expense_date', startDate),
      sb.from('orders').select('total_price,status').or(`retailer_id.eq.${bizId},distributor_id.eq.${bizId}`),
      sb.from('debts').select('amount,amount_paid,status').eq('user_id', bizId),
    ]);
    const rev30    = (sales || []).reduce((s, r) => s + (r.revenue || 0), 0);
    const profit30 = (sales || []).reduce((s, r) => s + (r.profit  || 0), 0);
    const exp30    = (exps  || []).reduce((s, e) => s + (e.amount   || 0), 0);
    const net30    = profit30 - exp30;
    const totDebt  = (debts || []).filter(d => d.status !== 'paid').reduce((s, d) => s + (d.amount - (d.amount_paid || 0)), 0);
    const margin   = rev30 > 0 ? (profit30 / rev30 * 100).toFixed(1) : 0;
    const byProd   = {};
    (sales || []).forEach(s => { byProd[s.product_name] = (byProd[s.product_name] || 0) + (s.revenue || 0); });
    const topP = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 5);
    $('av').innerHTML = `
      <div class="sup-dash-header">
        <div class="sup-dash-biz"><div class="sup-dash-avatar">${bizName[0]}</div>
          <div><div class="sup-dash-name">${bizName}</div><div class="sup-dash-role"> Supervisor Dashboard · 30d</div></div></div>
        <span class="pill p-del">View Only</span>
      </div>
      <div class="sr">
        <div class="sc green"><div class="sic">${svgIcon('revenue')}</div><div class="sl">Mapato</div><div class="sv" id="sdrev">TZS 0</div></div>
        <div class="sc ${profit30 >= 0 ? 'g' : 'r'}"><div class="sic">${svgIcon('profit')}</div><div class="sl">Faida</div><div class="sv" id="sdpro">TZS 0</div></div>
        <div class="sc red"><div class="sic">${svgIcon('expense')}</div><div class="sl">Matumizi</div><div class="sv" id="sdexp">TZS 0</div></div>
        <div class="sc ${net30 >= 0 ? 'g' : 'r'}"><div class="sic">${svgIcon('chart')}</div><div class="sl">Net</div><div class="sv" id="sdnet">TZS 0</div></div>
      </div>
      <div class="rsec">
        <div class="rsec-t">Viashiria Muhimu (30 days)</div>
        <div class="rrow"><span class="rl">Profit Margin</span><span class="rv ${margin >= 15 ? 'g' : margin >= 5 ? 'a' : 'r'}">${margin}%</span></div>
        <div class="rrow"><span class="rl">Outstanding Debts</span><span class="rv ${totDebt > 0 ? 'r' : 'g'}">${fmt(totDebt)}</span></div>
        <div class="rrow"><span class="rl">Total Orders</span><span class="rv">${(orders || []).length}</span></div>
        <div class="rrow div"><span class="rl" style="font-weight:800">Net Profit</span><span class="rv ${net30 >= 0 ? 'g' : 'r'}" style="font-size:1.1rem;font-weight:800">${fmt(net30)}</span></div>
      </div>
      <div class="rsec">
        <div class="rsec-t">Top Products</div>
        ${topP.length ? topP.map(([name, rev], i) => `<div class="rrow"><span class="rl"><strong>${i + 1}.</strong> ${name}</span><span class="rv g">${fmt(rev)}</span></div>`).join('') : `<div style="color:var(--s500);text-align:center;padding:.875rem">No data</div>`}
      </div>`;
    setTimeout(() => {
      animateCount($('sdrev'), rev30, 'TZS ');
      animateCount($('sdpro'), profit30, 'TZS ');
      animateCount($('sdexp'), exp30, 'TZS ');
      animateCount($('sdnet'), net30, 'TZS ');
    }, 300);
  },

}; // end App

// ── SVG Icons ──────────────────────────────────────────────────
function svgIcon(name) {
  const icons = {
    grid:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    store:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    pkg:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    orders:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    chart:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
    pos:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    debt:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    invoice:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    receipt:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="16" y1="8" x2="8" y2="8"/><line x1="16" y1="12" x2="8" y2="12"/><line x1="12" y1="16" x2="8" y2="16"/></svg>`,
    users:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    analytics:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    revenue:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    profit:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    expense:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    print:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    sms:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  };
  return icons[name] || '';
}

// ── Status helpers ─────────────────────────────────────────────
function statusPill(status, lang) {
  const map = {
    pending:   { cls: 'pill-amber', sw: 'Inasubiri',      en: 'Pending' },
    confirmed: { cls: 'pill-blue',  sw: 'Imethibitishwa', en: 'Confirmed' },
    delivered: { cls: 'pill-green', sw: 'Imetolewa',      en: 'Delivered' },
    cancelled: { cls: 'pill-red',   sw: 'Imefutwa',       en: 'Cancelled' },
  };
  const s = map[status] || { cls: 'pill-amber', sw: status, en: status };
  return `<span class="pill ${s.cls}">${lang === 'sw' ? s.sw : s.en}</span>`;
}

function statusBadge(role) {
  const map = {
    retailer:    { cls: 'rb-ret',  label: 'Duka' },
    distributor: { cls: 'rb-dist', label: 'Msambazaji' },
    admin:       { cls: 'rb-adm',  label: 'Admin' },
  };
  const r = map[role] || { cls: 'rb-ret', label: role };
  return `<span class="rbadge ${r.cls}">${r.label}</span>`;
}

function animateCount(el, target, prefix = '') {
  if (!el) return;
  const duration  = 800;
  const startTime = performance.now();
  const animate   = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = prefix + Math.floor(target * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(animate);
    else el.textContent = prefix + target.toLocaleString();
  };
  requestAnimationFrame(animate);
}

function staggerCards(selector, delayMs = 80) {
  document.querySelectorAll(selector).forEach((card, idx) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px)';
    setTimeout(() => {
      card.style.transition = 'opacity .3s cubic-bezier(.34,1.4,.64,1), transform .3s cubic-bezier(.34,1.4,.64,1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, idx * delayMs);
  });
}

// ── Inject POS + store-switcher styles ───────────────────────
const _posCSS = document.createElement('style');
_posCSS.textContent = `
/* ════════════════════════════════
   POS COMPLETE REDESIGN — v5
   ════════════════════════════════ */

/* ── Live Dashboard ── */
.pos-live-dash{background:#fff;border:1.5px solid var(--g100);border-radius:1rem;padding:1rem 1.1rem;margin-bottom:1.25rem;box-shadow:0 4px 16px rgba(34,197,94,.06);}
.pos-live-row{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:.875rem;}
@media(max-width:640px){.pos-live-row{grid-template-columns:repeat(2,1fr);}}
.pos-kpi{background:var(--g50);border-radius:.75rem;padding:.75rem .875rem;border:1.5px solid var(--g100);transition:transform .2s;}
.pos-kpi.kpi-green{border-color:var(--g200);background:linear-gradient(135deg,#f0fdf4,#fff);}
.pos-kpi.kpi-red{border-color:#fecaca;background:linear-gradient(135deg,#fff5f5,#fff);}
.pos-kpi-label{font-size:.62rem;font-weight:700;color:var(--s500);text-transform:uppercase;letter-spacing:.75px;margin-bottom:.25rem;}
.pos-kpi-val{font-size:1rem;font-weight:900;color:var(--s900);letter-spacing:-.5px;line-height:1.2;}
.pos-kpi-sub{font-size:.62rem;color:var(--s500);margin-top:.2rem;}
@media(max-width:480px){.pos-kpi-val{font-size:.9rem;}}

/* ── Margin bar ── */
.pos-margin-bar{background:var(--s50);border-radius:.65rem;padding:.75rem .875rem;border:1px solid var(--s100);}

/* ── Offline pill ── */
.offline-pill-wrap{margin-top:.65rem;display:flex;justify-content:flex-start;}
.offline-pill{background:var(--ambl);color:var(--amber);font-size:.72rem;font-weight:700;padding:4px 12px;border-radius:20px;cursor:pointer;display:inline-flex;align-items:center;gap:.3rem;border:1px solid #fde68a;}

/* ── Tabs bar ── */
.pos-tabs-bar{display:flex;gap:.35rem;background:var(--s100);padding:5px;border-radius:.875rem;border:1px solid var(--s200);margin-bottom:1.1rem;}
.pos-tab-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.8rem .5rem;border:none;background:none;border-radius:.65rem;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:700;color:var(--s500);transition:all .2s;min-height:48px;white-space:nowrap;}
.pos-tab-btn.active{background:#fff;color:var(--g700);box-shadow:0 2px 10px rgba(22,163,74,.15);}
.pos-tab-btn svg{flex-shrink:0;}
@media(max-width:360px){.pos-tab-btn span{display:none;}.pos-tab-btn{padding:.7rem;}}

/* ── Tab content ── */
.pos-tab-content{display:none;}
.pos-tab-content.active{display:block;}

/* ── Form wrapper ── */
.pos-form-wrap{background:#fff;border:2px solid var(--g100);border-radius:1rem;padding:1.25rem;margin-bottom:1rem;}
.pos-form-title{display:flex;align-items:center;gap:.6rem;font-size:1rem;font-weight:800;color:var(--s900);margin-bottom:1.1rem;}

/* ── Field groups ── */
.pos-field-group{display:flex;flex-direction:column;gap:.35rem;margin-bottom:.875rem;}
.pos-label{font-size:.75rem;font-weight:700;color:var(--g700);text-transform:uppercase;letter-spacing:.75px;}

/* ── Inputs ── */
.pos-input{width:100%;padding:.9rem 1rem;border:1.5px solid var(--g100);border-radius:.65rem;font-family:'DM Sans',sans-serif;font-size:1rem;color:var(--s900);background:#f8fff9;outline:none;transition:all .2s;-webkit-appearance:none;font-weight:600;}
.pos-input:focus{border-color:var(--g600);background:#fff;box-shadow:0 0 0 3px rgba(22,163,74,.12);}
.pos-big{font-size:1.25rem!important;font-weight:800!important;text-align:center!important;padding:1rem!important;letter-spacing:-.5px;}
.pos-sell-input{border-color:var(--g400)!important;background:linear-gradient(135deg,#f0fdf4,#fff)!important;}
.pos-select{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2316a34a' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 1rem center;background-color:#f8fff9;padding-right:2.5rem;}

/* ── 3-column grid ── */
.pos-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.65rem;margin-bottom:.875rem;}
@media(max-width:480px){.pos-3col{grid-template-columns:1fr;}}

/* ── Live calculator ── */
.pos-calc-box{background:linear-gradient(135deg,#f0fdf4,#f8fffa);border:1.5px solid var(--g200);border-radius:.875rem;padding:.875rem 1rem;margin-bottom:1rem;}
.pos-calc-title{font-size:.72rem;font-weight:800;color:var(--g700);text-transform:uppercase;letter-spacing:.75px;margin-bottom:.75rem;}
.pos-calc-grid{display:flex;align-items:center;gap:.5rem;}
.pos-calc-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:.2rem;}
.pos-calc-item span{font-size:.65rem;font-weight:600;color:var(--s500);text-transform:uppercase;letter-spacing:.5px;}
.pos-calc-item strong{font-size:1rem;font-weight:900;}
.pos-calc-divider{width:1px;height:32px;background:var(--g200);flex-shrink:0;}
@media(max-width:360px){.pos-calc-item strong{font-size:.88rem;}}

/* ── Record buttons ── */
.pos-rec-btn{width:100%;padding:1.1rem;border:none;border-radius:.875rem;font-family:'DM Sans',sans-serif;font-size:1.05rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;transition:all .2s;min-height:56px;letter-spacing:.3px;}
.rec-blue{background:linear-gradient(135deg,var(--b700,#1d4ed8),var(--b500,#3b82f6));color:#fff;box-shadow:0 6px 20px rgba(37,99,235,.35);}
.rec-blue:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(37,99,235,.45);}
.rec-red{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;box-shadow:0 6px 20px rgba(220,38,38,.25);}
.rec-red:hover{transform:translateY(-2px);}
.pos-rec-btn:active{transform:scale(.97)!important;}

/* ── Expense preview box ── */
.pos-exp-preview{background:var(--s50);border:1px solid var(--s200);border-radius:.65rem;padding:.75rem 1rem;margin-bottom:1rem;}

/* ── History summary banner ── */
.pos-history-summary{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center;gap:.5rem;background:linear-gradient(135deg,var(--g50),#f0fff4);border:1.5px solid var(--g100);border-radius:1rem;padding:1rem 1.1rem;margin-bottom:1.1rem;}
.pos-hist-item{text-align:center;}
.pos-hist-item.green .pos-hist-val{color:var(--g700);}
.pos-hist-item.red .pos-hist-val{color:var(--red);}
.pos-hist-lbl{font-size:.62rem;font-weight:700;color:var(--s500);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.25rem;}
.pos-hist-val{font-size:1.05rem;font-weight:900;color:var(--s900);}
.pos-hist-sep{font-size:1.25rem;font-weight:300;color:var(--s300);text-align:center;}
@media(max-width:400px){.pos-hist-val{font-size:.88rem;}.pos-history-summary{grid-template-columns:1fr auto 1fr auto 1fr;gap:.25rem;padding:.75rem;}}

/* ── History cards ── */
.pos-hist-card{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;padding:.875rem;background:#fff;border:1.5px solid var(--g100);border-left:4px solid var(--g500);border-radius:.75rem;transition:all .15s;}
.pos-hist-card:hover{border-left-color:var(--g700);box-shadow:0 2px 10px rgba(22,163,74,.1);}
.pos-hist-card.offline-card{border-left-color:var(--amber);background:var(--ambl);}
.pos-hist-card-left{flex:1;min-width:0;}
.pos-hist-prod{font-size:.92rem;font-weight:800;color:var(--s900);margin-bottom:.2rem;}
.pos-hist-meta{font-size:.75rem;color:var(--s500);}
.pos-hist-card-right{text-align:right;flex-shrink:0;}
.pos-hist-rev{font-size:.95rem;font-weight:900;color:var(--g700);}
.pos-hist-profit{font-size:.78rem;font-weight:700;margin-top:.15rem;}
.offline-tag{font-size:.65rem;background:var(--ambl);color:var(--amber);padding:1px 5px;border-radius:8px;}
.offline-card{background:var(--ambl)!important;}

/* ── Offline banner ── */
.offline-banner{background:linear-gradient(135deg,var(--ambl),#fef9c3);border:1.5px solid #fde68a;border-radius:.875rem;padding:.8rem 1.1rem;margin-bottom:1rem;font-size:.9rem;font-weight:700;color:#92400e;display:flex;align-items:center;gap:.5rem;}

/* ── Store switcher ── */
#store-switcher{display:none;flex-direction:column;padding:.5rem .6rem;border-bottom:1px solid rgba(255,255,255,.06);}
.store-btn{display:flex;align-items:center;gap:.5rem;padding:.45rem .6rem;border-radius:.4rem;border:none;background:none;cursor:pointer;color:rgba(255,255,255,.6);font-family:'DM Sans',sans-serif;transition:all .15s;width:100%;text-align:left;}
.store-btn:hover{background:rgba(255,255,255,.08);color:#fff;}
.store-btn.active{background:rgba(22,163,74,.15);color:#4ade80;}
.store-btn.add-store{color:rgba(255,255,255,.3);font-size:.75rem;margin-top:.25rem;border-top:1px solid rgba(255,255,255,.06);padding-top:.5rem;}

/* ── Debt card ── */
.debt-card{margin-bottom:.875rem!important;}
.debt-progress{height:5px;background:var(--s100);border-radius:3px;margin:.5rem 0;overflow:hidden;}
.debt-bar{height:100%;background:linear-gradient(90deg,var(--g700),var(--g500));border-radius:3px;transition:width .8s ease;}

/* ── Active badge ── */
.active-badge{background:var(--g100);color:var(--g700);font-size:.62rem;font-weight:800;padding:3px 10px;border-radius:20px;}
.primary-check{display:flex;align-items:center;gap:.65rem;cursor:pointer;padding:.65rem;background:var(--g50);border-radius:.65rem;border:1.5px solid var(--g100);}
.primary-check input{width:18px;height:18px;accent-color:var(--g700);}

/* ── Sync badge ── */
#sync-badge{display:none;align-items:center;}
.sync-pill{font-size:.7rem;font-weight:700;padding:4px 10px;border-radius:20px;display:inline-flex;align-items:center;gap:.25rem;}
.sync-pill.offline{background:var(--ambl);color:var(--amber);}
.sync-pill.sync{background:var(--b700);color:#fff;cursor:pointer;}

/* ── Spinner ── */
.spin{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:_rot .7s linear infinite;}
.spin spin-dark{border-color:rgba(22,163,74,.2);border-top-color:var(--g700);}
@keyframes _rot{to{transform:rotate(360deg)}}

/* ── Global font boosts ── */
.fi{font-size:1rem!important;}
.fl{font-size:.77rem!important;}
.dt td{font-size:.9rem!important;padding:.875rem 1rem!important;}
.dt th{font-size:.71rem!important;}
.sv{font-size:1.05rem!important;letter-spacing:-1px;}
.bni-lbl{font-size:.7rem!important;}
.ni{font-size:.9rem!important;padding:.7rem .75rem!important;}
.btn{font-size:1rem!important;min-height:52px!important;}
.bsm{font-size:.8rem!important;padding:.5rem .95rem!important;min-height:36px;}

/* ── Stat card improvements ── */
.sc{transition:transform .2s,box-shadow .2s;}
.sc:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(34,197,94,.12);}

@media print{#app-main>aside,.topbar,.bn,.cfab,.no-print,#twrap{display:none!important;}.main-content{margin-left:0;}.pc{padding:0;}}
`;
document.head.appendChild(_posCSS);

// ── BOOT ──────────────────────────────────────────────────────
async function boot() {
  await initPosDB();
  initLocDropdowns('reg-region',  'reg-district',  'reg-ward');
  initLocDropdowns('dreg-region', 'dreg-district', 'dreg-ward');
  buildCatGrid();
  goStep(1);

  // ── Clean stale IndexedDB records with dev-user IDs ──────────
  // They will never sync — mark synced so we stop retrying them
  if (posDB) {
    const isUUID = id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
    const [allS, allE] = await Promise.all([posDbGetAll('sales'), posDbGetAll('expenses')]);
    for (const r of allS) { if (!isUUID(r.user_id)) await posDbMarkSynced('sales', r.local_id); }
    for (const r of allE) { if (!isUUID(r.user_id)) await posDbMarkSynced('expenses', r.local_id); }
  }

  // Inject store-switcher slot into sidebar
  const sbnav = $('sbnav');
  if (sbnav && !$('store-switcher')) {
    const div = document.createElement('div');
    div.id = 'store-switcher';
    sbnav.parentNode.insertBefore(div, sbnav);
  }

  // Inject sync badge into topbar
  const tbr = document.querySelector('.tbr');
  if (tbr && !$('sync-badge')) {
    const span = document.createElement('span');
    span.id = 'sync-badge';
    tbr.insertBefore(span, tbr.firstChild);
  }

  // Restore session — loadSession() validates UUID and clears dev sessions
  if (loadSession() && S.user) {
    await loadStores();
    S.pinBuf = '';
    for (let i = 0; i < 4; i++) {
      const d = $(`pd${i}`);
      if (d) d.classList.remove('on', 'err');
    }
    setText('s7h',   S.lang === 'sw' ? 'Karibu!' : 'Welcome!');
    setText('s7sub', S.user.store_name || '');
    const prog = $('pfill');
    if (prog) prog.style.width = '90%';
    goStep(7);
  }

  if (S.isOnline) setTimeout(syncOfflineData, 3000);
}

// ── Expose cart functions on window for HTML onclick reliability ───
// HTML-generated onclick="App.addToCart(...)" works via window.App,
// but also expose directly so onclick="addToCart(...)" works too.
window.addToCart   = (p)            => App.addToCart(p);
window.cartChange  = (id, delta)    => App.cartChange(id, delta);
window.filterCat   = (cat, btn)     => App.filterCat(cat, btn);
window.changeDist  = (id)           => App.changeDist(id);
window.placeOrder  = ()             => App.placeOrder();

boot();
