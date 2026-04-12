// ══════════════════════════════════════════════════════════════
// BomaWave v3.0 — app.js
// Phone OTP Auth · MOQ · Receipts · Invoices · POS · Reports
// ══════════════════════════════════════════════════════════════
import { supabase as sb } from './supabase.js';
// BomaWave v3.1 — Multi-Store + POS Offline
import { supabase as sb } from './supabase.js';

const OTP_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/otp';
const SB_KEY  = 'sb_publishable_yJni7Xxl78x24V1mJvLjVg_RAWAsGOt';

// ── State ─────────────────────────────────────────────────────
let S = {
  user: null, lang: 'sw', role: null,
  pendingPhone: null, pendingData: null,
  pinBuf: '', cart: [], cartDist: null,
  page: 'dashboard', notifs: [],
  store: null,   // active store for multi-store
  stores: [],    // all stores for this user
  realtimeCh: null,
  isOnline: navigator.onLine,
};


// ── Tanzania Location Data ────────────────────────────────────
const LOC = {
  'Dar es Salaam': {
    'Ilala': ['Kariakoo','Gerezani','Upanga','Buguruni','Ilala','Kisutu'],
    'Kinondoni': ['Sinza','Mwananyamala','Tandale','Kijitonyama','Mikocheni','Msasani'],
    'Temeke': ['Tandika','Mbagala','Mtoni','Temeke','Charambe'],
    'Ubungo': ['Ubungo','Kimara','Makuburi','Saranga'],
    'Kigamboni': ['Kigamboni','Mjimwema','Somangila'],
  },
  'Mwanza': {
    'Nyamagana': ['Pamba','Mahina','Kirumba','Isamilo'],
    'Ilemela': ['Ilemela','Kiroba','Mkolani'],
  },
  'Arusha': {
    'Arusha Jiji': ['Kaloleni','Sekei','Sokon 1','Sokon 2'],
    'Arumeru': ['Tengeru','Usa River'],
  },
  'Dodoma': {
    'Dodoma Mjini': ['Makole','Nkuhungu','Kikuyu'],
    'Bahi': ['Bahi','Nondwa'],
  },
  'Mbeya': {
    'Mbeya Jiji': ['Mwanjelwa','Uyole','Sisimba'],
    'Mbarali': ['Rujewa','Igawa'],
  },
  'Tanga': {
    'Tanga Jiji': ['Ngamiani','Chumbageni','Makorora'],
    'Muheza': ['Muheza','Bumbuli'],
  },
  'Morogoro': {
    'Morogoro Mjini': ['Kihonda','Mwembesongo','Mji wa Mwisho'],
    'Kilosa': ['Kilosa','Gairo'],
  },
  'Zanzibar Mjini': {
    'Mjini': ['Stone Town','Mkunazini','Malindi'],
    'Magharibi': ['Bububu','Fuoni'],
  },
};

const CATS = [
  {id:'beverages',sw:'Vinywaji',en:'Beverages'},
  {id:'flour',sw:'Unga',en:'Flour'},
  {id:'oil',sw:'Mafuta ya Kupikia',en:'Cooking Oil'},
  {id:'sugar',sw:'Sukari',en:'Sugar'},
  {id:'soap',sw:'Sabuni',en:'Soap'},
  {id:'personal',sw:'Usafi wa Mwili',en:'Personal Care'},
  {id:'dairy',sw:'Maziwa',en:'Dairy'},
  {id:'other',sw:'Nyingine',en:'Other'},
];

const CAT_ICONS = {
  beverages:'🧃', flour:'🌾', oil:'🫙', sugar:'🍚',
  soap:'🧼', personal:'🪥', dairy:'🥛', other:'📦',
};

// ── Translations ─────────────────────────────────────────────
const T = {
  sw:{
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
    moqWarning:'Kiwango cha chini',
    orderSuccess:'Agizo limetumwa!',
    selectDist:'Chagua Msambazaji',
    nearbyFirst:'Karibu nawe kwanza',
    printReceipt:'Chapisha Risiti (PDF)',
    shareInvoice:'Shiriki Ankara',
    shareWhatsApp:'WhatsApp',
    shareSMS:'SMS',
    printPDF:'Chapisha PDF',
    invoiceText:'Ankara ya BomaWave',
  },
  en:{
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
    moqWarning:'Minimum order qty',
    orderSuccess:'Order sent!',
    selectDist:'Select Distributor',
    nearbyFirst:'Nearby first',
    printReceipt:'Print Receipt (PDF)',
    shareInvoice:'Share Invoice',
    shareWhatsApp:'WhatsApp',
    shareSMS:'SMS',
    printPDF:'Print PDF',
    invoiceText:'BomaWave Invoice',
  }
};
const t = (k) => T[S.lang]?.[k] ?? k;

// ── Helpers ──────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const fmt = (n) => 'TZS ' + Number(n||0).toLocaleString();
const fmtNum = (n) => Number(n||0).toLocaleString();
const today = () => new Date().toISOString().slice(0,10);
const genRef = (prefix='BW') => prefix + Date.now().toString(36).toUpperCase();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function toast(msg, type='s') {
  const wrap = $('twrap');
  const el = document.createElement('div');
  const icons = {s:'✅', e:'❌', i:'ℹ️'};
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 4100);
}

function setBusy(id, busy, txt='') {
  const btn = $(id);
  if (!btn) return;
  btn.disabled = busy;
  const span = btn.querySelector('span');
  if (!span) return;
  if (busy) {
    span.dataset.orig = span.textContent;
    span.innerHTML = `<span class="spin"></span>`;
  } else {
    span.textContent = txt || span.dataset.orig || '';
  }
}

function setText(id, txt) { const el=$(id); if(el) el.textContent=txt; }
function setHtml(id, h) { const el=$(id); if(el) el.innerHTML=h; }

// ── LocalStorage session ─────────────────────────────────────
function saveSession() {
  localStorage.setItem('bw_v3', JSON.stringify({ user: S.user, lang: S.lang }));
}
function loadSession() {
  try {
    const d = JSON.parse(localStorage.getItem('bw_v3') || 'null');
    if (d?.user) { S.user = d.user; S.lang = d.lang || 'sw'; return true; }
  } catch {}
  return false;
}
function clearSession() { localStorage.removeItem('bw_v3'); }

// ── OTP API call ─────────────────────────────────────────────
async function callOTP(payload) {
  const res = await fetch(OTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
      'Authorization': `Bearer ${SB_KEY}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── Phone normalizer ─────────────────────────────────────────
function normPhone(raw) {
  const d = raw.replace(/\D/g,'');
  if (d.length === 9 && (d[0]==='7'||d[0]==='6')) return '+255'+d;
  if (d.length === 10 && d[0]==='0') return '+255'+d.slice(1);
  if (d.length === 12 && d.startsWith('255')) return '+'+d;
  return null;
}

// ══════════════════════════════════════════════════════════════
//  STEP NAVIGATION
// ══════════════════════════════════════════════════════════════
const STEP_NAMES = {
  sw: { 1:'Lugha',2:'Aina',3:'Maelezo (Duka)',4:'Maelezo (Msambazaji)',
        5:'OTP',7:'PIN',8:'Ingia',9:'OTP ya Kuingia',
        10:'Nimesahau PIN',11:'OTP ya PIN',12:'PIN Mpya' },
  en: { 1:'Language',2:'Role',3:'Details (Shop)',4:'Details (Distributor)',
        5:'OTP',7:'PIN',8:'Login',9:'Login OTP',
        10:'Forgot PIN',11:'Forgot OTP',12:'New PIN' },
};
const STEP_MAX = { 1:10,2:20,3:50,4:50,5:75,7:90,8:30,9:60,10:30,11:60,12:85 };

function goStep(n) {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  const el = $(`s${n}`);
  if (el) el.classList.add('active');
  const pct = STEP_MAX[n] || 10;
  const name = STEP_NAMES[S.lang]?.[n] || `Hatua ${n}`;
  setText('plbl', name);
  setText('ppct', pct+'%');
  $('pfill').style.width = pct+'%';
}

// ── Init location dropdowns ──────────────────────────────────
function fillSelect(id, options, placeholder='—') {
  const sel = $(id);
  if (!sel) return;
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach(o => { const opt=document.createElement('option');opt.value=o;opt.textContent=o;sel.appendChild(opt); });
}

function initLocDropdowns(regionId, districtId, wardId) {
  fillSelect(regionId, Object.keys(LOC), S.lang==='sw'?'Chagua Mkoa':'Select Region');
  fillSelect(districtId, [], S.lang==='sw'?'— Chagua Wilaya —':'— Select District —');
  if (wardId) fillSelect(wardId, [], S.lang==='sw'?'— Chagua Kata —':'— Select Ward —');
}

// ── Category grid ────────────────────────────────────────────
function buildCatGrid() {
  const grid = $('cat-grid');
  if (!grid) return;
  grid.innerHTML = CATS.map(c => `
    <label class="cat-chip" id="chip-${c.id}">
      <input type="checkbox" value="${c.id}"/>
      ${CAT_ICONS[c.id]} ${S.lang==='sw'?c.sw:c.en}
    </label>`).join('');
  grid.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => {
      inp.parentElement.classList.toggle('on', inp.checked);
    });
  });
}

// ════════════════════════════════════════════════════════════
//  PUBLIC App OBJECT
// ════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
//  OFFLINE / IndexedDB POS
// ══════════════════════════════════════════════════════════════
let posDB = null;

async function initPosDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open('bomawave_pos', 2);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sales'))
        db.createObjectStore('sales', {keyPath:'local_id', autoIncrement:true});
      if (!db.objectStoreNames.contains('expenses'))
        db.createObjectStore('expenses', {keyPath:'local_id', autoIncrement:true});
    };
    req.onsuccess = e => { posDB = e.target.result; resolve(posDB); };
    req.onerror = () => resolve(null);
  });
}

async function posDbAdd(store, data) {
  if (!posDB) return;
  return new Promise((resolve) => {
    const tx = posDB.transaction(store, 'readwrite');
    tx.objectStore(store).add({...data, synced:false, created_at:new Date().toISOString()});
    tx.oncomplete = resolve;
  });
}

async function posDbGetAll(store) {
  if (!posDB) return [];
  return new Promise(resolve => {
    const tx = posDB.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

async function posDbMarkSynced(store, key) {
  if (!posDB) return;
  return new Promise(resolve => {
    const tx = posDB.transaction(store, 'readwrite');
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
  const exps = await posDbGetAll('expenses');
  const uSales = sales.filter(s => !s.synced);
  const uExps = exps.filter(e => !e.synced);
  for (const s of uSales) {
    const {local_id, ...data} = s;
    const {error} = await sb.from('sales').insert([data]);
    if (!error) await posDbMarkSynced('sales', local_id);
  }
  for (const e of uExps) {
    const {local_id, ...data} = e;
    const {error} = await sb.from('expenses').insert([data]);
    if (!error) await posDbMarkSynced('expenses', local_id);
  }
  const total = uSales.length + uExps.length;
  if (total > 0) toast(`Sync imekamilika — records ${total}`, 's');
  App.renderSyncBadge && App.renderSyncBadge();
}

async function getPendingCount() {
  if (!posDB) return 0;
  const s = await posDbGetAll('sales');
  const e = await posDbGetAll('expenses');
  return [...s,...e].filter(x => !x.synced).length;
}

window.addEventListener('online', () => {
  S.isOnline = true;
  toast(S.lang==='sw'?'Mtandao umepatikana — Inasync...':'Back online — Syncing...', 's');
  syncOfflineData();
});
window.addEventListener('offline', () => {
  S.isOnline = false;
  toast(S.lang==='sw'?'Hakuna mtandao — POS inafanya kazi bila mtandao':'No internet — POS works offline', 'w');
});

// ══════════════════════════════════════════════════════════════
//  MULTI-STORE
// ══════════════════════════════════════════════════════════════
async function loadStores() {
  if (!S.user || S.user.role !== 'retailer') { S.stores=[]; S.store=null; return; }
  const {data} = await sb.from('stores').select('*').eq('owner_id', S.user.id).eq('is_active', true).order('is_primary', {ascending:false});
  S.stores = data || [];
  if (S._savedStoreId) S.store = S.stores.find(s => s.id === S._savedStoreId) || S.stores[0] || null;
  else S.store = S.stores.find(s => s.is_primary) || S.stores[0] || null;
}

async function ensurePrimaryStore() {
  if (!S.user || S.user.role !== 'retailer') return;
  const {data} = await sb.from('stores').select('id').eq('owner_id', S.user.id).limit(1);
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
  const wrap = document.getElementById('store-switcher');
  if (!wrap) return;
  if (!S.stores || S.stores.length <= 1) { wrap.style.display='none'; return; }
  wrap.style.display = 'flex';
  wrap.innerHTML = S.stores.map(st => `
    <button class="store-btn${S.store?.id===st.id?' active':''}" onclick="App.switchStore('${st.id}')">
      <span>🏪</span>
      <span style="flex:1;text-align:left;font-size:.78rem;font-weight:${S.store?.id===st.id?800:600}">${st.store_name}</span>
      ${S.store?.id===st.id?'<span style="color:var(--g400)">●</span>':''}
    </button>`).join('') +
    `<button class="store-btn add-store" onclick="App.showAddStore()">＋ <span style="font-size:.78rem">${S.lang==='sw'?'Ongeza Duka':'Add Store'}</span></button>`;
}

window.App = {

  // ── Language ─────────────────────────────────────────────
  setLang(lang) {
    S.lang = lang;
    initLocDropdowns('reg-region','reg-district','reg-ward');
    initLocDropdowns('dreg-region','dreg-district','dreg-ward');
    buildCatGrid();
    goStep(2);
  },

  switchLang(lang) {
    S.lang = lang;
    if (S.user) { saveSession(); App.renderApp(); }
    $('lsw-sw').classList.toggle('on', lang==='sw');
    $('lsw-en').classList.toggle('on', lang==='en');
  },

  // ── Role ─────────────────────────────────────────────────
  pickRole(role) {
    S.role = role;
    $('rb-ret').classList.toggle('sel', role==='retailer');
    $('rb-dist').classList.toggle('sel', role==='distributor');
    $('ck-ret').style.display = role==='retailer'?'':'none';
    $('ck-dist').style.display = role==='distributor'?'':'none';
    $('rnext').style.display = 'flex';
  },

  proceedFromRole() {
    if (!S.role) return;
    goStep(S.role==='retailer' ? 3 : 4);
  },

  goToRegister() { goStep(2); },

  // ── Location changes ────────────────────────────────────
  onRegionChange() {
    const r = $('reg-region').value;
    const dists = r ? Object.keys(LOC[r]||{}) : [];
    fillSelect('reg-district', dists, '— Wilaya —');
    fillSelect('reg-ward', [], '— Kata —');
  },
  onDistrictChange() {
    const r = $('reg-region').value, d = $('reg-district').value;
    const wards = (r&&d) ? (LOC[r]?.[d]||[]) : [];
    fillSelect('reg-ward', wards, '— Kata —');
  },
  onDRegionChange() {
    const r = $('dreg-region').value;
    const dists = r ? Object.keys(LOC[r]||{}) : [];
    fillSelect('dreg-district', dists, '— Wilaya —');
    fillSelect('dreg-ward', [], '— Kata —');
  },
  onDDistrictChange() {
    const r = $('dreg-region').value, d = $('dreg-district').value;
    const wards = (r&&d) ? (LOC[r]?.[d]||[]) : [];
    fillSelect('dreg-ward', wards, '— Kata —');
  },

  // ── Eye toggle ──────────────────────────────────────────
  eyeToggle(inputId, iconId) {
    const inp = $(inputId), ico = $(iconId);
    if (!inp || !ico) return;
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    ico.innerHTML = show
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  },

  // ── Retailer registration ──────────────────────────────
  async submitDetails() {
    const name = $('reg-name').value.trim();
    const rawPhone = $('reg-phone').value.trim();
    const pin = $('reg-pin').value.trim();
    const pin2 = $('reg-pin2').value.trim();

    if (!name) return toast('Weka jina la duka', 'e');
    const phone = normPhone(rawPhone);
    if (!phone) return toast('Namba ya simu si sahihi', 'e');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'e');
    if (pin !== pin2) return toast('PIN hazilingani', 'e');

    S.pendingData = {
      role: 'retailer',
      store_name: name, phone, pin,
      region: $('reg-region').value,
      district: $('reg-district').value,
      ward: $('reg-ward').value,
      street: $('reg-street').value,
      business_type: $('reg-btype').value,
    };
    S.pendingPhone = phone;

    setBusy('reg-btn', true);
    const r = await callOTP({ action:'send_otp', phone });
    setBusy('reg-btn', false, 'Endelea — Tuma OTP');

    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast('OTP imetumwa! ✅', 's');
    setText('otp-phone', phone);
    App.clearOTPBoxes('ob');
    App.startResendTimer();
    goStep(5);
  },

  // ── Distributor registration ────────────────────────────
  async submitDDetails() {
    const name = $('dreg-name').value.trim();
    const rawPhone = $('dreg-phone').value.trim();
    const pin = $('dreg-pin').value.trim();
    const pin2 = $('dreg-pin2').value.trim();

    if (!name) return toast('Weka jina la biashara', 'e');
    const phone = normPhone(rawPhone);
    if (!phone) return toast('Namba ya simu si sahihi', 'e');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'e');
    if (pin !== pin2) return toast('PIN hazilingani', 'e');

    const checkedCats = [...document.querySelectorAll('#cat-grid input:checked')].map(i=>i.value);

    S.pendingData = {
      role: 'distributor',
      store_name: name, phone, pin,
      region: $('dreg-region').value,
      district: $('dreg-district').value,
      ward: $('dreg-ward').value,
      street: $('dreg-street').value,
      coverage_area: $('dreg-coverage').value,
      min_delivery_amount: parseFloat($('dreg-mindel').value||'0'),
      categories: checkedCats.join(','),
    };
    S.pendingPhone = phone;

    setBusy('dreg-btn', true);
    const r = await callOTP({ action:'send_otp', phone });
    setBusy('dreg-btn', false, 'Endelea — Tuma OTP');

    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast('OTP imetumwa! ✅', 's');
    setText('otp-phone', phone);
    App.clearOTPBoxes('ob');
    App.startResendTimer();
    goStep(5);
  },

  // ── Registration OTP boxes ─────────────────────────────
  oi(i, el) {
    el.value = el.value.replace(/\D/g,'').slice(-1);
    el.classList.toggle('on', !!el.value);
    if (el.value && i < 5) $(`ob${i+1}`)?.focus();
    if (i===5 && el.value) App.verifyRegOTP();
  },
  ok(i, e) {
    if (e.key==='Backspace' && !$(`ob${i}`).value && i>0) $(`ob${i-1}`)?.focus();
  },
  clearOTPBoxes(prefix, count=6) {
    for (let i=0;i<count;i++) {
      const el=$(prefix+i); if(el){el.value='';el.classList.remove('on','err');}
    }
  },
  getOTPVal(prefix, count=6) {
    return Array.from({length:count},(_,i)=>$(`${prefix}${i}`)?.value||'').join('');
  },

  startResendTimer() {
    clearInterval(S.resendTimer);
    let sec = 60;
    const timer = $('rtimer'), btn = $('rbtn');
    timer.style.display=''; btn.style.display='none';
    timer.textContent = S.lang==='sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
    S.resendTimer = setInterval(()=>{
      sec--;
      if(sec<=0){clearInterval(S.resendTimer);timer.style.display='none';btn.style.display='';}
      else timer.textContent = S.lang==='sw'?`Tuma tena baada ya ${sec}s`:`Resend in ${sec}s`;
    },1000);
  },

  async resendRegOTP() {
    if (!S.pendingPhone) return;
    const r = await callOTP({ action:'send_otp', phone: S.pendingPhone });
    if (r.success) { toast('OTP imetumwa tena','s'); App.startResendTimer(); }
    else toast(r.message||'Hitilafu','e');
  },

  async verifyRegOTP() {
    const code = App.getOTPVal('ob');
    if (code.length !== 6) return toast('Weka nambari 6 kamili','e');
    setBusy('vbtn', true);
    const r = await callOTP({ action:'verify_otp', phone: S.pendingPhone, otp_code: code });
    if (!r.success) {
      setBusy('vbtn', false, 'Thibitisha');
      for(let i=0;i<6;i++) $(`ob${i}`)?.classList.add('err');
      return toast(r.message||'Nambari si sahihi','e');
    }
    // OTP OK — create account
    const reg = await callOTP({ action:'complete_registration', phone: S.pendingPhone, ...S.pendingData });
    setBusy('vbtn', false, 'Thibitisha');
    if (!reg.success) return toast(reg.message||'Tatizo la kuunda akaunti','e');
    toast('Akaunti imefunguliwa! 🎉','s');
    S.user = reg.user;
    saveSession();
    await ensurePrimaryStore();
    await loadStores();
    App.showApp();
  },

  goBack5() {
    goStep(S.role==='retailer' ? 3 : 4);
  },

  // ── Login ────────────────────────────────────────────────
  async sendLoginOTP() {
    const raw = $('lphone').value.trim();
    const phone = normPhone(raw);
    if (!phone) return toast('Namba ya simu si sahihi','e');
    S.pendingPhone = phone;
    setBusy('lotp-txt', false);
    const r = await callOTP({ action:'send_otp', phone });
    if (!r.success) return toast(r.message||'Hitilafu','e');
    toast('OTP imetumwa! ✅','s');
    setText('lotp-phone', phone);
    App.clearOTPBoxes('lb');
    App.startLoginResendTimer();
    goStep(9);
  },

  loi(i,el) {
    el.value=el.value.replace(/\D/g,'').slice(-1);
    el.classList.toggle('on',!!el.value);
    if(el.value&&i<5)$(`lb${i+1}`)?.focus();
    if(i===5&&el.value)App.verifyLoginOTP();
  },
  lok(i,e) { if(e.key==='Backspace'&&!$(`lb${i}`).value&&i>0)$(`lb${i-1}`)?.focus(); },

  startLoginResendTimer() {
    clearInterval(S.loginResendTimer);
    let sec=60; const timer=$('lrtimer'),btn=$('lrbtn');
    timer.style.display='';btn.style.display='none';
    timer.textContent=S.lang==='sw'?`Tuma tena baada ya ${sec}s`:`Resend in ${sec}s`;
    S.loginResendTimer=setInterval(()=>{
      sec--;
      if(sec<=0){clearInterval(S.loginResendTimer);timer.style.display='none';btn.style.display='';}
      else timer.textContent=S.lang==='sw'?`Tuma tena baada ya ${sec}s`:`Resend in ${sec}s`;
    },1000);
  },
  async resendLoginOTP() {
    if(!S.pendingPhone)return;
    const r=await callOTP({action:'send_otp',phone:S.pendingPhone});
    if(r.success){toast('OTP imetumwa tena','s');App.startLoginResendTimer();}
    else toast(r.message||'Hitilafu','e');
  },

  async verifyLoginOTP() {
    const code=App.getOTPVal('lb');
    if(code.length!==6)return toast('Weka nambari 6 kamili','e');
    setBusy('lvbtn',true);
    const r=await callOTP({action:'verify_otp',phone:S.pendingPhone,otp_code:code});
    setBusy('lvbtn',false,'Thibitisha');
    if(!r.success){
      for(let i=0;i<6;i++)$(`lb${i}`)?.classList.add('err');
      return toast(r.message||'Nambari si sahihi','e');
    }
    if(!r.user_exists)
      return toast(S.lang==='sw'?'Namba hii haijasajiliwa. Unda akaunti kwanza.':'Number not registered. Please create account.','e');
    S.user=r.user; saveSession();
    await loadStores();
    // Show PIN screen
    S.pinBuf=''; App.renderPinDots();
    setText('s7h', S.lang==='sw'?'Karibu!':'Welcome!');
    setText('s7sub', r.user.store_name||'');
    goStep(7);
  },

  // ── PIN keypad ──────────────────────────────────────────
  pk(digit) {
    if(S.pinBuf.length>=4)return;
    S.pinBuf+=digit; App.renderPinDots();
    if(S.pinBuf.length===4)setTimeout(()=>App.checkPin(),200);
  },
  pdel() { S.pinBuf=S.pinBuf.slice(0,-1); App.renderPinDots(); },
  renderPinDots() {
    for(let i=0;i<4;i++){
      const dot=$(`pd${i}`);
      if(dot){dot.classList.toggle('on',i<S.pinBuf.length);dot.classList.remove('err');}
    }
    setText('perr','');
  },
  checkPin() {
    if(S.pinBuf===String(S.user.pin)){
      S.user.last_login=new Date().toISOString();
      saveSession();
      App.showApp();
    } else {
      for(let i=0;i<4;i++) $(`pd${i}`)?.classList.add('err');
      setText('perr', S.lang==='sw'?'PIN si sahihi. Jaribu tena.':'Wrong PIN. Try again.');
      setTimeout(()=>{S.pinBuf='';App.renderPinDots();},900);
    }
  },

  // ── Forgot PIN ─────────────────────────────────────────
  forgotPin() { S.pinBuf=''; goStep(10); },

  async sendForgotOTP() {
    const raw=$('fphone').value.trim();
    const phone=normPhone(raw);
    if(!phone)return toast('Namba ya simu si sahihi','e');
    S.pendingPhone=phone;
    const r=await callOTP({action:'send_otp',phone});
    if(!r.success)return toast(r.message||'Hitilafu','e');
    toast('OTP imetumwa! ✅','s');
    setText('fotp-phone',phone);
    App.clearOTPBoxes('fb');
    goStep(11);
  },

  foi(i,el){
    el.value=el.value.replace(/\D/g,'').slice(-1);
    el.classList.toggle('on',!!el.value);
    if(el.value&&i<5)$(`fb${i+1}`)?.focus();
    if(i===5&&el.value)App.verifyForgotOTP();
  },
  fok(i,e){if(e.key==='Backspace'&&!$(`fb${i}`).value&&i>0)$(`fb${i-1}`)?.focus();},

  async verifyForgotOTP() {
    const code=App.getOTPVal('fb');
    if(code.length!==6)return toast('Weka nambari 6 kamili','e');
    setBusy('fvbtn',true);
    const r=await callOTP({action:'verify_otp',phone:S.pendingPhone,otp_code:code});
    setBusy('fvbtn',false,'Thibitisha');
    if(!r.success){for(let i=0;i<6;i++)$(`fb${i}`)?.classList.add('err');return toast(r.message||'Nambari si sahihi','e');}
    // Check user exists with this phone
    if(!r.user_exists)return toast(S.lang==='sw'?'Namba hii haijasajiliwa.':'Number not registered.','e');
    S.user=r.user; goStep(12);
  },

  async resetPin() {
    const pin=$('npin').value.trim(), pin2=$('npin2').value.trim();
    if(pin.length!==4||!/^\d{4}$/.test(pin))return toast('PIN lazima iwe tarakimu 4','e');
    if(pin!==pin2)return toast('PIN hazilingani','e');
    setBusy('rpintxt',false);
    const r=await callOTP({action:'reset_pin',phone:S.pendingPhone,pin});
    if(!r.success)return toast(r.message||'Hitilafu','e');
    toast(S.lang==='sw'?'PIN imebadilishwa! ✅':'PIN updated! ✅','s');
    S.user=r.user; saveSession();
    App.showApp();
  },

  // ── Show App ────────────────────────────────────────────
  async showApp() {
    $('onboarding').style.display='none';
    $('app-main').style.display='block';
    await ensurePrimaryStore();
    await loadStores();
    if (S.user.role==='retailer' && S.stores.length>1 && !S.store) {
      App.showStorePicker(); return;
    }
    App.renderApp();
    App.setupRealtime();
  },


  // ── Store methods ──────────────────────────────────────
  async renderSyncBadge() {
    const el = document.getElementById('sync-badge'); if (!el) return;
    const count = await getPendingCount();
    if (!S.isOnline) {
      el.style.display='flex';
      el.innerHTML=`<span style="background:var(--amber);color:#fff;font-size:.72rem;font-weight:700;padding:4px 12px;border-radius:20px">⚡ Offline${count>0?` · ${count} pending`:''}</span>`;
    } else if (count > 0) {
      el.style.display='flex';
      el.innerHTML=`<span style="background:var(--b700);color:#fff;font-size:.72rem;font-weight:700;padding:4px 12px;border-radius:20px;cursor:pointer" onclick="syncOfflineData()">↑ Sync ${count}</span>`;
    } else { el.style.display='none'; }
  },

  switchStore(id) {
    S.store = S.stores.find(s => s.id === id) || S.store;
    saveSession();
    toast(`${S.lang==='sw'?'Duka':'Store'}: ${S.store?.store_name}`, 's');
    App.renderApp();
  },

  showAddStore() {
    const view = document.getElementById('av');
    setText('tbt', S.lang==='sw'?'Ongeza Duka':'Add Store');
    initLoc('as-region','as-district','as-ward');
    view.innerHTML = `
      <div style="max-width:480px;margin:0 auto">
        <div class="card"><div class="cp">
          <div style="font-size:1.05rem;font-weight:800;margin-bottom:1.1rem">${S.lang==='sw'?'Ongeza Duka Jipya':'Add New Store'}</div>
          <div style="display:flex;flex-direction:column;gap:.875rem">
            <div class="fg"><label class="fl">${S.lang==='sw'?'Jina la Duka':'Store Name'} *</label>
              <input class="fi" id="as-name" style="font-size:1rem" placeholder="${S.lang==='sw'?'mfano: Temeke Branch':'e.g. Temeke Branch'}"/></div>
            <div class="fg"><label class="fl">${S.lang==='sw'?'Aina ya Duka':'Store Type'}</label>
              <select class="fi" id="as-type" style="font-size:1rem">
                <option value="duka">${S.lang==='sw'?'Duka la Kawaida':'Regular Shop'}</option>
                <option value="kiosk">Kiosk</option>
                <option value="supermarket">Supermarket</option>
                <option value="wholesale">${S.lang==='sw'?'Jumla':'Wholesale'}</option>
              </select></div>
            <div class="fr">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Mkoa':'Region'}</label>
                <select class="fi" id="as-region" onchange="App.onASRegion()"><option value=""></option></select></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Wilaya':'District'}</label>
                <select class="fi" id="as-district" onchange="App.onASDistrict()"><option value=""></option></select></div>
            </div>
            <div class="fr">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Kata':'Ward'}</label>
                <select class="fi" id="as-ward"><option value=""></option></select></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Mtaa':'Street'}</label>
                <input class="fi" id="as-street" style="font-size:.95rem" placeholder="Mtaa"/></div>
            </div>
            <label style="display:flex;align-items:center;gap:.65rem;cursor:pointer;padding:.65rem;background:var(--g50);border-radius:.65rem;border:1.5px solid var(--g100)">
              <input type="checkbox" id="as-primary" style="width:18px;height:18px;accent-color:var(--g700)"/>
              <span style="font-size:.95rem;font-weight:600">${S.lang==='sw'?'Fanya Duka Kuu':'Set as Primary Store'}</span>
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-top:.25rem">
              <button class="btn btn-s" onclick="App.navTo('dashboard')" style="font-size:.95rem">${S.lang==='sw'?'Rudi':'Back'}</button>
              <button class="btn btn-p" onclick="App.saveNewStore()" style="font-size:.95rem">
                <span id="as-btn">+ ${S.lang==='sw'?'Ongeza Duka':'Add Store'}</span>
              </button>
            </div>
          </div>
        </div></div>
      </div>`;
    initLoc('as-region','as-district','as-ward');
  },

  onASRegion() { const r=document.getElementById('as-region').value; fillSelect('as-district',r?Object.keys(LOC[r]||[]):[]);fillSelect('as-ward',[]); },
  onASDistrict() { const r=document.getElementById('as-region').value,d=document.getElementById('as-district').value;fillSelect('as-ward',(r&&d)?LOC[r]?.[d]||[]:[]);},

  async saveNewStore() {
    const name = document.getElementById('as-name')?.value.trim();
    if (!name) return toast(S.lang==='sw'?'Weka jina la duka':'Enter store name', 'e');
    setBusy('as-btn', true);
    const isPrimary = document.getElementById('as-primary')?.checked;
    if (isPrimary) await sb.from('stores').update({is_primary:false}).eq('owner_id', S.user.id);
    const {error} = await sb.from('stores').insert([{
      owner_id: S.user.id,
      store_name: name,
      store_type: document.getElementById('as-type')?.value,
      region: document.getElementById('as-region')?.value,
      district: document.getElementById('as-district')?.value,
      ward: document.getElementById('as-ward')?.value,
      street: document.getElementById('as-street')?.value,
      is_primary: isPrimary, is_active: true,
    }]);
    setBusy('as-btn', false, `+ ${S.lang==='sw'?'Ongeza Duka':'Add Store'}`);
    if (error) return toast('Hitilafu ya kuongeza duka', 'e');
    toast(S.lang==='sw'?'Duka limeongezwa! ✅':'Store added! ✅', 's');
    await loadStores();
    renderStoreSwitcher();
    App.navTo('dashboard');
  },

  showStorePicker() {
    const view = document.getElementById('av');
    view.innerHTML = `
      <div style="max-width:420px;margin:2rem auto">
        <div style="text-align:center;margin-bottom:1.5rem">
          <div style="font-size:2rem">🏪</div>
          <div style="font-size:1.25rem;font-weight:800;margin-top:.5rem">${S.lang==='sw'?'Chagua Duka':'Select Store'}</div>
          <div style="font-size:.9rem;color:var(--s500);margin-top:.25rem">${S.lang==='sw'?'Duka gani unafanya kazi nalo leo?':'Which store are you working at today?'}</div>
        </div>
        ${S.stores.map(st=>`
          <div class="card" style="margin-bottom:.875rem;cursor:pointer;border:2px solid ${S.store?.id===st.id?'var(--g600)':'var(--s200)'}" onclick="App.switchStore('${st.id}');App.navTo('dashboard')">
            <div class="cp" style="display:flex;align-items:center;gap:1rem">
              <div style="width:52px;height:52px;border-radius:12px;background:var(--g100);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">🏪</div>
              <div style="flex:1">
                <div style="font-size:1.05rem;font-weight:800">${st.store_name} ${st.is_primary?'⭐':''}</div>
                <div style="font-size:.85rem;color:var(--s500)">${st.district||st.region||''}</div>
                <div style="font-size:.78rem;color:var(--s500)">${st.store_type||'duka'}</div>
              </div>
              <div style="color:var(--g700);font-size:1.3rem">→</div>
            </div>
          </div>`).join('')}
        <button class="btn btn-p" style="margin-top:.75rem;font-size:.95rem" onclick="App.showAddStore()">+ ${S.lang==='sw'?'Ongeza Duka':'Add Store'}</button>
      </div>`;
  },

  async pageMyStores() {
    await loadStores();
    const view = document.getElementById('av');
    view.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
        <span style="font-size:1.1rem;font-weight:800">${S.lang==='sw'?'Maduka Yangu':'My Stores'} (${S.stores.length})</span>
        <button class="btn btn-p" style="width:auto;padding:.65rem 1.25rem;font-size:.95rem" onclick="App.showAddStore()">+ ${S.lang==='sw'?'Ongeza':'Add'}</button>
      </div>
      ${S.stores.map(st=>`
        <div class="card" style="margin-bottom:.875rem;border:2px solid ${S.store?.id===st.id?'var(--g600)':'var(--s200)'}">
          <div class="cp">
            <div style="display:flex;align-items:center;gap:1rem">
              <div style="width:48px;height:48px;border-radius:12px;background:var(--g100);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">🏪</div>
              <div style="flex:1">
                <div style="font-size:1rem;font-weight:800">${st.store_name} ${st.is_primary?'⭐':''}</div>
                <div style="font-size:.85rem;color:var(--s500)">${st.district||''} ${st.region||''}</div>
              </div>
              ${S.store?.id===st.id?`<span style="background:var(--g100);color:var(--g700);font-size:.72rem;font-weight:800;padding:4px 12px;border-radius:20px">ACTIVE</span>`:''}
            </div>
            ${S.store?.id!==st.id?`<div style="display:flex;gap:.5rem;margin-top:.875rem">
              <button class="btn btn-p" style="font-size:.9rem;padding:.6rem 1rem" onclick="App.switchStore('${st.id}');App.navTo('dashboard')">${S.lang==='sw'?'Ingia':'Switch'}</button>
              <button class="bsm r" style="font-size:.85rem" onclick="App.deleteStore('${st.id}')">${S.lang==='sw'?'Futa':'Delete'}</button>
            </div>`:''}
          </div>
        </div>`).join('')}`;
  },

  async deleteStore(id) {
    if (S.stores.length <= 1) return toast(S.lang==='sw'?'Lazima kuwe na duka moja angalau':'Need at least one store', 'e');
    if (!confirm(S.lang==='sw'?'Futa duka hili?':'Delete this store?')) return;
    await sb.from('stores').update({is_active:false}).eq('id', id);
    await loadStores();
    toast(S.lang==='sw'?'Duka limefutwa':'Store deleted', 's');
    App.pageMyStores();
  },

  logout() {
    if(S.realtimeCh)sb.removeChannel(S.realtimeCh);
    S={user:null,lang:S.lang,role:null,pendingPhone:null,pendingData:null,
       pinBuf:'',cart:[],cartDist:null,page:'dashboard',notifs:[],
       resendTimer:null,loginResendTimer:null,forgotResendTimer:null,realtimeCh:null};
    clearSession();
    $('onboarding').style.display='flex';
    $('app-main').style.display='none';
    goStep(1);
  },

  // ══════════════════════════════════════════════════════════
  //  APP RENDERING
  // ══════════════════════════════════════════════════════════
  renderApp() {
    const u=S.user;
    // Sidebar user info
    const av=u.store_name?.[0]?.toUpperCase()||'U';
    setText('sbav',av); setText('sbn',u.store_name||'—');
    const badgeClass={retailer:'rb-ret',distributor:'rb-dist',admin:'rb-adm'}[u.role]||'rb-ret';
    const badgeTxt={retailer:'Duka',distributor:'Msambazaji',admin:'Admin'}[u.role]||u.role;
    const bb=$('sbb');
    if(bb){bb.className=`rbadge ${badgeClass}`;bb.textContent=badgeTxt;}

    // Nav items by role
    const navItems = App.getNavItems(u.role);
    const nav=$('sbnav');
    if(nav){
      nav.innerHTML=navItems.map(n=>`
        <button class="ni${S.page===n.page?' on':''}" onclick="App.navTo('${n.page}')">
          <span class="nic">${n.icon}</span>${n.label}
          ${n.badge?`<span class="nb">${n.badge}</span>`:''}
        </button>`).join('');
    }

    // Bottom nav (mobile)
    const mobileNav=navItems.slice(0,5);
    const bn=$('bn');
    if(bn){
      bn.innerHTML=mobileNav.map(n=>`
        <button class="bni${S.page===n.page?' on':''}" onclick="App.navTo('${n.page}')">
          ${n.icon}<span class="bni-lbl">${n.shortLabel||n.label}</span>
        </button>`).join('');
    }

    // Lang toggle
    $('lsw-sw')?.classList.toggle('on',S.lang==='sw');
    $('lsw-en')?.classList.toggle('on',S.lang==='en');

    // Render page
    App.renderPage(S.page);
  },

  getNavItems(role) {
    const l=S.lang;
    const base=[
      {page:'dashboard',icon:svgIcon('grid'),label:t('dashboard'),shortLabel:'Home'},
    ];
    if(role==='retailer') return [...base,
      {page:'marketplace',icon:svgIcon('store'),label:t('marketplace'),shortLabel:'Soko'},
      {page:'my-orders',icon:svgIcon('pkg'),label:t('myOrders'),shortLabel:'Maagizo'},
      {page:'pos',icon:svgIcon('pos'),label:t('pos'),shortLabel:'POS'},
      {page:'debts',icon:svgIcon('debt'),label:t('debts'),shortLabel:'Madeni'},
      {page:'reports',icon:svgIcon('chart'),label:t('reports'),shortLabel:'Ripoti'},
      {page:'my-stores',icon:svgIcon('store'),label:S.lang==='sw'?'Maduka Yangu':'My Stores',shortLabel:'Maduka'},
    ];
    if(role==='distributor') return [...base,
      {page:'products',icon:svgIcon('pkg'),label:t('products'),shortLabel:'Bidhaa'},
      {page:'orders',icon:svgIcon('orders'),label:t('orders'),shortLabel:'Maagizo'},
      {page:'invoices',icon:svgIcon('invoice'),label:t('invoices'),shortLabel:'Ankara'},
      {page:'reports',icon:svgIcon('chart'),label:t('reports'),shortLabel:'Ripoti'},
    ];
    if(role==='admin') return [...base,
      {page:'users',icon:svgIcon('users'),label:t('users'),shortLabel:'Watumiaji'},
      {page:'orders',icon:svgIcon('orders'),label:t('orders'),shortLabel:'Maagizo'},
      {page:'analytics',icon:svgIcon('analytics'),label:t('analytics'),shortLabel:'Data'},
    ];
    return base;
  },

  navTo(page) {
    S.page=page;
    App.renderApp();
    App.closeSidebar();
    window.scrollTo(0,0);
  },

  toggleSidebar() {
    $('sidebar')?.classList.toggle('open');
    $('sovl')?.classList.toggle('active');
  },
  closeSidebar() {
    $('sidebar')?.classList.remove('open');
    $('sovl')?.classList.remove('active');
  },

  toggleNotif() { $('ndd')?.classList.toggle('open'); },
  clearNotifs() { S.notifs=[]; App.renderNotifs(); },
  addNotif(txt) {
    S.notifs.unshift({txt,time:new Date().toLocaleTimeString()});
    App.renderNotifs();
    App.playSmsSound('new_order');
  },
  renderNotifs() {
    const list=$('nlist'), dot=$('ndot');
    const count=S.notifs.length;
    if(dot){dot.style.display=count?'flex':'none';dot.textContent=count>9?'9+':count;}
    if(!list)return;
    if(!count){list.innerHTML=`<div class="nde" id="ne-txt">${S.lang==='sw'?'Hakuna arifa':'No notifications'}</div>`;return;}
    list.innerHTML=S.notifs.slice(0,10).map(n=>`
      <div class="ndi unread">
        <div><div class="ndt">${n.txt}</div><div class="ndtime">${n.time}</div></div>
      </div>`).join('');
  },

  // ── Realtime ───────────────────────────────────────────
  setupRealtime() {
    if(S.realtimeCh)sb.removeChannel(S.realtimeCh);
    const u=S.user;
    S.realtimeCh=sb.channel('bw-realtime')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'orders'},payload=>{
        const o=payload.new;
        if(u.role==='distributor'&&o.distributor_id===u.id){
          App.addNotif(`${S.lang==='sw'?'Agizo jipya kutoka':'New order from'} ${o.order_ref}`);
          if(S.page==='orders')App.renderPage('orders');
        }
        if(u.role==='retailer'&&o.retailer_id===u.id){
          if(S.page==='my-orders')App.renderPage('my-orders');
        }
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders'},payload=>{
        const o=payload.new;
        if(u.role==='retailer'&&o.retailer_id===u.id){
          App.addNotif(`${S.lang==='sw'?'Hali ya agizo imebadilika:':'Order status changed:'} ${o.status}`);
          App.playSmsSound(o.status==='confirmed'?'confirmed':'delivered');
          if(S.page==='my-orders')App.renderPage('my-orders');
        }
      }).subscribe();
  },

  playSmsSound(type) {
    try {
      const ac=new (window.AudioContext||window.webkitAudioContext)();
      const patterns={
        new_order:[[800,.1,0],[600,.1,.15]],
        confirmed:[[500,.08,0],[700,.08,.12],[900,.1,.24]],
        delivered:[[400,.08,0],[600,.1,.12],[800,.12,.26],[1000,.1,.42]],
      };
      (patterns[type]||patterns.new_order).forEach(([freq,dur,delay])=>{
        const o=ac.createOscillator(),g=ac.createGain();
        o.connect(g);g.connect(ac.destination);
        o.frequency.value=freq;
        o.start(ac.currentTime+delay);o.stop(ac.currentTime+delay+dur);
        g.gain.setValueAtTime(.3,ac.currentTime+delay);
        g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+delay+dur);
      });
    } catch{}
  },

  // ══════════════════════════════════════════════════════════
  //  PAGE RENDERING
  // ══════════════════════════════════════════════════════════
  async renderPage(page) {
    const view=$('av');
    if(!view)return;
    view.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--s500)"><span class="spin d"></span></div>`;

    const tbic=$('tbic'), tbt=$('tbt'), tbs=$('tbs');
    const icons={dashboard:svgIcon('grid'),marketplace:svgIcon('store'),
      'my-orders':svgIcon('pkg'),orders:svgIcon('orders'),products:svgIcon('pkg'),
      pos:svgIcon('pos'),reports:svgIcon('chart'),debts:svgIcon('debt'),
      invoices:svgIcon('invoice'),users:svgIcon('users'),analytics:svgIcon('analytics')};
    if(tbic)tbic.innerHTML=icons[page]||svgIcon('grid');

    const pageLabels={dashboard:t('dashboard'),marketplace:t('marketplace'),
      'my-orders':t('myOrders'),orders:t('orders'),products:t('products'),
      pos:t('pos'),reports:t('reports'),debts:t('debts'),
      invoices:t('invoices'),users:t('users'),analytics:t('analytics')};
    setText('tbt', pageLabels[page]||page);
    setText('tbs', S.user?.store_name||'');

    const pages={
      dashboard:()=>App.pageDashboard(),
      marketplace:()=>App.pageMarketplace(),
      'my-orders':()=>App.pageMyOrders(),
      orders:()=>App.pageOrders(),
      products:()=>App.pageProducts(),
      pos:()=>App.pagePOS(),
      reports:()=>App.pageReports(),
      debts:()=>App.pageDebts(),
      invoices:()=>App.pageInvoices(),
      users:()=>App.pageUsers(),
      'my-stores':()=>App.pageMyStores(),
      analytics:()=>App.pageAnalytics(),
    };
    await (pages[page]||pages.dashboard)();
  },

  // ── DASHBOARD ──────────────────────────────────────────
  async pageDashboard() {
    const u=S.user;
    const {data:orders}=await sb.from('orders')
      .select('*').or(`retailer_id.eq.${u.id},distributor_id.eq.${u.id}`)
      .order('created_at',{ascending:false}).limit(10);
    const {data:sales}=await sb.from('sales').select('revenue,profit,created_at')
      .eq('user_id',u.id).gte('sale_date',today());
    const todayRev=sales?.reduce((s,r)=>s+(r.revenue||0),0)||0;
    const todayProfit=sales?.reduce((s,r)=>s+(r.profit||0),0)||0;
    const pending=(orders||[]).filter(o=>o.status==='pending').length;
    const delivered=(orders||[]).filter(o=>o.status==='delivered').length;

    const view=$('av');
    view.innerHTML=`
      <div class="sr">
        <div class="sc g"><div class="sic">${svgIcon('revenue')}</div><div class="sl">${S.lang==='sw'?'Mauzo Leo':'Today Sales'}</div><div class="sv">${fmt(todayRev)}</div></div>
        <div class="sc g"><div class="sic">${svgIcon('profit')}</div><div class="sl">${t('profit')}</div><div class="sv">${fmt(todayProfit)}</div></div>
        <div class="sc a"><div class="sic">${svgIcon('pkg')}</div><div class="sl">${S.lang==='sw'?'Yanasubiri':'Pending'}</div><div class="sv">${pending}</div></div>
        <div class="sc b"><div class="sic">${svgIcon('orders')}</div><div class="sl">${S.lang==='sw'?'Zimetolewa':'Delivered'}</div><div class="sv">${delivered}</div></div>
      </div>
      <div class="card">
        <div class="cp">
          <div class="sh"><span class="st">${S.lang==='sw'?'Maagizo ya Hivi Karibuni':'Recent Orders'}</span>
            <button class="sa" onclick="App.navTo('${u.role==='retailer'?'my-orders':'orders'}')">${S.lang==='sw'?'Ona Yote →':'See All →'}</button>
          </div>
          <div class="tw"><table class="dt">
            <thead><tr>
              <th>REF</th><th>${S.lang==='sw'?'HALI':'STATUS'}</th>
              <th>${S.lang==='sw'?'JUMLA':'TOTAL'}</th><th>${S.lang==='sw'?'TAREHE':'DATE'}</th>
            </tr></thead>
            <tbody>${(orders||[]).slice(0,5).map(o=>`
              <tr>
                <td><span style="font-size:.75rem;font-weight:700;color:var(--g700)">${o.order_ref}</span></td>
                <td>${statusPill(o.status,S.lang)}</td>
                <td style="font-weight:700">${fmt(o.total_price)}</td>
                <td style="color:var(--s500);font-size:.75rem">${o.created_at?.slice(0,10)}</td>
              </tr>`).join('')||`<tr><td colspan="4"><div class="empty"><div class="empty-ic">📦</div><div class="empty-s">${t('noOrders')}</div></div></td></tr>`}
            </tbody>
          </table></div>
        </div>
      </div>`;
  },

  // ── MARKETPLACE (Retailer) ─────────────────────────────
  async pageMarketplace() {
    const u=S.user;
    // Load distributors — filtered by location first
    const {data:allDists}=await sb.from('profiles')
      .select('id,store_name,region,district,coverage_area,min_delivery_amount')
      .eq('role','distributor').eq('is_active',true);

    // Sort: same region first, then same district
    const sorted=(allDists||[]).sort((a,b)=>{
      const aScore=(a.region===u.region?2:0)+(a.district===u.district?1:0);
      const bScore=(b.region===u.region?2:0)+(b.district===u.district?1:0);
      return bScore-aScore;
    });

    const distOpts=sorted.map(d=>`<option value="${d.id}">${d.store_name} — ${d.district||d.region||''}${d.region===u.region?' ⭐':''}</option>`).join('');

    // Load products
    const distId=S.cartDist||(sorted[0]?.id||'');
    let products=[];
    if(distId){
      const {data:p}=await sb.from('products').select('*')
        .eq('distributor_id',distId).eq('is_active',true).order('category');
      products=p||[];
    }

    let activeCat='all';
    const cats=['all',...new Set(products.map(p=>p.category))];

    const renderProducts=(catFilter='all')=>{
      const filtered=catFilter==='all'?products:products.filter(p=>p.category===catFilter);
      const cartItem=(pid)=>S.cart.find(c=>c.product_id===pid);
      return filtered.map(p=>{
        const ci=cartItem(p.id); const inCart=!!ci;
        const stock=p.stock_qty>10?'ok':p.stock_qty>0?'low':'out';
        const stockTxt=stock==='ok'?'✅ Stok':stock==='low'?`⚠️ ${p.stock_qty} imebaki`:'❌ Hakuna';
        const stockClass=`sbadge s-${stock}`;
        return `<div class="pcard${inCart?' in':''}" id="pc-${p.id}">
          <span class="${stockClass}">${stockTxt}</span>
          <div class="ppla">${CAT_ICONS[p.category]||'📦'}</div>
          <div class="pcat">${p.category}</div>
          <div class="pname">${p.product_name}</div>
          <div class="punit">${p.selling_unit||''}</div>
          ${p.min_order_qty>1?`<div class="pmoq">Min: ${p.min_order_qty} ${p.selling_unit||'pc'}</div>`:''}
          <div class="pfoot">
            <span class="pprice">${fmt(p.price)}</span>
            ${stock==='out'?`<span style="font-size:.7rem;color:var(--red)">${S.lang==='sw'?'Haipo':'Out'}</span>`
            :inCart?`<div class="qc">
              <button class="qb" onclick="App.cartChange('${p.id}',-1)">−</button>
              <span class="qn">${ci.qty}</span>
              <button class="qb" onclick="App.cartChange('${p.id}',1)">+</button>
            </div>`
            :`<button class="adbtn" onclick="App.addToCart(${JSON.stringify(p).replace(/"/g,'&quot;')})">+</button>`}
          </div>
        </div>`;
      }).join('');
    };

    const sel=sorted.find(d=>d.id===distId);
    const minDel=sel?.min_delivery_amount||0;

    const view=$('av');
    view.innerHTML=`
      <div class="card" style="margin-bottom:1rem">
        <div class="cp">
          <div class="fg" style="margin-bottom:.75rem">
            <label class="fl">${S.lang==='sw'?'Chagua Msambazaji':'Select Distributor'}</label>
            <select class="fi" id="dist-sel" onchange="App.changeDist(this.value)">
              ${distOpts}
            </select>
          </div>
          ${minDel>0?`<div class="alert al-w" style="margin:0">
            <span>⚠️</span> ${S.lang==='sw'?'Kiwango cha chini cha agizo:':'Minimum order:'} <strong>${fmt(minDel)}</strong>
          </div>`:''}
        </div>
      </div>
      <div class="fps" id="cat-filter">
        ${cats.map(c=>`<button class="fp${c==='all'?' on':''}" onclick="App.filterCat('${c}',this)">${c==='all'?t('allCategories'):CAT_ICONS[c]+' '+(S.lang==='sw'?CATS.find(x=>x.id===c)?.sw||c:CATS.find(x=>x.id===c)?.en||c)}</button>`).join('')}
      </div>
      <div class="pgrid" id="pgrid">${renderProducts('all')}</div>`;

    // Set current dist selector
    if($('dist-sel')&&distId)$('dist-sel').value=distId;

    // Update cart FAB
    const fab=$('cfab');
    if(fab){fab.style.display=S.cart.length?'flex':'none';}
    App.renderCartPanel();
  },

  changeDist(id) {
    S.cartDist=id; S.cart=[]; App.pageMarketplace();
  },

  filterCat(cat,btn) {
    document.querySelectorAll('.fp').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    // Re-render products with filter
    App.pageMarketplace().then(()=>{
      setTimeout(()=>{
        document.querySelectorAll('.fp').forEach(b=>{
          if(b.textContent.trim().startsWith(cat==='all'?t('allCategories').slice(0,5):CAT_ICONS[cat]||cat))
            b.classList.add('on');
        });
      },100);
    });
  },

  addToCart(p) {
    if(p.stock_qty===0)return;
    if(!S.cartDist)S.cartDist=p.distributor_id;
    const existing=S.cart.find(c=>c.product_id===p.id);
    if(existing){existing.qty++;} else {
      S.cart.push({product_id:p.id,product_name:p.product_name,
        qty:p.min_order_qty||1,unit_price:p.price,
        min_order_qty:p.min_order_qty||1,selling_unit:p.selling_unit,distributor_id:p.distributor_id});
    }
    App.updateCartUI();
  },

  cartChange(productId, delta) {
    const item=S.cart.find(c=>c.product_id===productId);
    if(!item)return;
    item.qty=Math.max(0,item.qty+delta);
    if(item.qty===0)S.cart=S.cart.filter(c=>c.product_id!==productId);
    App.updateCartUI();
    App.pageMarketplace();
  },

  updateCartUI() {
    const count=S.cart.reduce((s,c)=>s+c.qty,0);
    const fab=$('cfab'),cc=$('cc');
    if(fab)fab.style.display=S.cart.length?'flex':'none';
    if(cc)cc.textContent=count;
    App.renderCartPanel();
  },

  renderCartPanel() {
    const list=$('cplist'),total=$('ct-val');
    if(!list)return;
    if(!S.cart.length){
      list.innerHTML=`<div class="empty"><div class="empty-ic">🛒</div><div class="empty-s">${t('cartEmpty')}</div></div>`;
      if(total)total.textContent='TZS 0'; return;
    }
    const sum=S.cart.reduce((s,c)=>s+c.qty*c.unit_price,0);
    list.innerHTML=S.cart.map(c=>{
      const moqWarn=c.qty<c.min_order_qty;
      const sub=c.qty*c.unit_price;
      return `<div class="cpi">
        <div class="cpi-em">${CAT_ICONS['other']||'📦'}</div>
        <div style="flex:1;min-width:0">
          <div class="cpi-name">${c.product_name}</div>
          <div class="cpi-price">${fmt(sub)}</div>
          ${moqWarn?`<div class="cpi-moq">⚠️ Min: ${c.min_order_qty}</div>`:''}
        </div>
        <div class="qc">
          <button class="qb" onclick="App.cartChange('${c.product_id}',-1)">−</button>
          <span class="qn">${c.qty}</span>
          <button class="qb" onclick="App.cartChange('${c.product_id}',1)">+</button>
        </div>
      </div>`;
    }).join('');
    if(total)total.textContent=fmt(sum);
  },

  toggleCart() {
    $('cpanel')?.classList.toggle('open');
  },

  async placeOrder() {
    if(!S.cart.length)return toast(t('cartEmpty'),'e');

    // MOQ check
    const moqFail=S.cart.filter(c=>c.qty<c.min_order_qty);
    if(moqFail.length){
      toast(`${S.lang==='sw'?'Kiwango cha chini hafikiwi:':'MOQ not met:'} ${moqFail.map(c=>c.product_name).join(', ')}`,'e');
      return;
    }

    const distId=S.cartDist||S.cart[0]?.distributor_id;
    const {data:dist}=await sb.from('profiles').select('min_delivery_amount').eq('id',distId).single();
    const total=S.cart.reduce((s,c)=>s+c.qty*c.unit_price,0);

    if(dist?.min_delivery_amount&&total<dist.min_delivery_amount){
      toast(`${S.lang==='sw'?'Agizo lako ni ndogo. Kiwango cha chini:':'Order below minimum:' } ${fmt(dist.min_delivery_amount)}`,'e');
      return;
    }

    setBusy('po-btn',true);
    const ref=genRef('ORD');
    const {data:order,error}=await sb.from('orders').insert([{
      order_ref:ref, retailer_id:S.user.id, distributor_id:distId,
      total_price:total, items_count:S.cart.length, status:'pending',
    }]).select().single();

    if(error||!order){setBusy('po-btn',false,t('placeOrder'));return toast('Hitilafu ya kutuma agizo','e');}

    await sb.from('order_items').insert(S.cart.map(c=>({
      order_id:order.id, product_id:c.product_id,
      product_name:c.product_name, qty:c.qty,
      unit_price:c.unit_price, subtotal:c.qty*c.unit_price,
    })));

    setBusy('po-btn',false,t('placeOrder'));
    S.cart=[]; S.cartDist=null;
    $('cpanel')?.classList.remove('open');
    App.updateCartUI();
    toast(`${t('orderSuccess')} ${ref}`,'s');
    App.navTo('my-orders');
  },

  // ── MY ORDERS (Retailer) ──────────────────────────────
  async pageMyOrders() {
    const {data:orders}=await sb.from('orders')
      .select('*').eq('retailer_id',S.user.id)
      .order('created_at',{ascending:false});

    const view=$('av');
    view.innerHTML=`
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('myOrders')}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr>
            <th>REF</th><th>${S.lang==='sw'?'HALI':'STATUS'}</th>
            <th>${S.lang==='sw'?'BIDHAA':'ITEMS'}</th><th>${S.lang==='sw'?'JUMLA':'TOTAL'}</th>
            <th>${S.lang==='sw'?'TAREHE':'DATE'}</th><th>${S.lang==='sw'?'VITENDO':'ACTIONS'}</th>
          </tr></thead>
          <tbody>${(orders||[]).map(o=>`
            <tr>
              <td><strong style="color:var(--g700)">${o.order_ref}</strong></td>
              <td>${statusPill(o.status,S.lang)}</td>
              <td>${o.items_count}</td>
              <td><strong>${fmt(o.total_price)}</strong></td>
              <td style="color:var(--s500);font-size:.75rem">${o.created_at?.slice(0,10)}</td>
              <td>
                ${o.status==='delivered'?`<button class="bsm b" onclick="App.showInvoice('${o.id}')">${svgIcon('invoice')} ${t('invoices')}</button>`:''}
              </td>
            </tr>`).join('')||`<tr><td colspan="6"><div class="empty"><div class="empty-ic">📦</div><div class="empty-s">${t('noOrders')}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  // ── ORDERS (Distributor) ──────────────────────────────
  async pageOrders() {
    const {data:orders}=await sb.from('orders')
      .select('*').eq('distributor_id',S.user.id)
      .order('created_at',{ascending:false});

    const view=$('av');
    view.innerHTML=`
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('orders')}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr>
            <th>REF</th><th>${S.lang==='sw'?'HALI':'STATUS'}</th>
            <th>${S.lang==='sw'?'JUMLA':'TOTAL'}</th><th>${S.lang==='sw'?'TAREHE':'DATE'}</th>
            <th>${S.lang==='sw'?'VITENDO':'ACTIONS'}</th>
          </tr></thead>
          <tbody>${(orders||[]).map(o=>`
            <tr>
              <td><strong style="color:var(--g700)">${o.order_ref}</strong></td>
              <td>${statusPill(o.status,S.lang)}</td>
              <td><strong>${fmt(o.total_price)}</strong></td>
              <td style="color:var(--s500);font-size:.75rem">${o.created_at?.slice(0,10)}</td>
              <td style="display:flex;gap:.3rem;flex-wrap:wrap">
                ${o.status==='pending'?`<button class="bsm b" onclick="App.updateOrderStatus('${o.id}','confirmed')">${S.lang==='sw'?'Thibitisha':'Confirm'}</button>`:''}
                ${o.status==='confirmed'?`<button class="bsm g" onclick="App.updateOrderStatus('${o.id}','delivered')">${S.lang==='sw'?'Toa':'Deliver'}</button>`:''}
                ${o.status==='delivered'?`<button class="bsm g" onclick="App.showReceipt('${o.id}')">${svgIcon('receipt')} ${t('printReceipt')}</button>`:''}
                ${o.status!=='cancelled'&&o.status!=='delivered'?`<button class="bsm r" onclick="App.updateOrderStatus('${o.id}','cancelled')">${S.lang==='sw'?'Futa':'Cancel'}</button>`:''}
              </td>
            </tr>`).join('')||`<tr><td colspan="5"><div class="empty"><div class="empty-ic">📦</div><div class="empty-s">${t('noOrders')}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  async updateOrderStatus(orderId, status) {
    const {error}=await sb.from('orders').update({status}).eq('id',orderId);
    if(error)return toast('Hitilafu ya kubadilisha hali','e');
    toast(S.lang==='sw'?`Hali imebadilishwa: ${status}`:`Status updated: ${status}`,'s');
    // Auto-create receipt on delivery
    if(status==='delivered'){
      const {data:o}=await sb.from('orders').select('*').eq('id',orderId).single();
      if(o){
        const ref=genRef('RCP');
        await sb.from('receipts').insert([{
          receipt_ref:ref, order_id:orderId,
          distributor_id:o.distributor_id, retailer_id:o.retailer_id,
          amount:o.total_price, payment_method:'cash',
        }]);
        const invRef=genRef('INV');
        await sb.from('invoices').insert([{
          invoice_ref:invRef, order_id:orderId,
          distributor_id:o.distributor_id, retailer_id:o.retailer_id,
          amount:o.total_price, status:'unpaid',
          due_date:new Date(Date.now()+7*864e5).toISOString().slice(0,10),
        }]);
      }
    }
    App.pageOrders();
  },

  // ── RECEIPT (PDF only) ────────────────────────────────
  async showReceipt(orderId) {
    const {data:order}=await sb.from('orders').select('*').eq('id',orderId).single();
    const {data:items}=await sb.from('order_items').select('*').eq('order_id',orderId);
    const {data:retailer}=await sb.from('profiles').select('store_name,phone_number,district').eq('id',order.retailer_id).single();
    const {data:dist}=await sb.from('profiles').select('store_name,phone_number').eq('id',order.distributor_id).single();
    const {data:receipt}=await sb.from('receipts').select('receipt_ref,issued_at').eq('order_id',orderId).maybeSingle();

    const view=$('av');
    view.innerHTML=`
      <div class="no-print" style="display:flex;gap:.65rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="share-btn pdf" onclick="window.print()">
          ${svgIcon('print')} ${t('printReceipt')}
        </button>
      </div>
      <div class="receipt" id="print-area">
        <div class="receipt-logo">
          <img src="logo.jpg" onerror="this.style.display='none'"/>
          <div>
            <div class="receipt-logo-name">BomaWave</div>
            <div style="font-size:.65rem;color:var(--s500)">FMCG Platform · Tanzania</div>
          </div>
        </div>
        <div class="receipt-title">${S.lang==='sw'?'RISITI YA MALIPO':'PAYMENT RECEIPT'}</div>
        <div class="receipt-ref">Ref: ${receipt?.receipt_ref||order.order_ref} · ${receipt?.issued_at?.slice(0,10)||today()}</div>
        <div class="receipt-parties">
          <div><div class="rp-lbl">${S.lang==='sw'?'MUUZAJI':'SELLER'}</div>
            <div class="rp-name">${dist?.store_name||'—'}</div>
            <div class="rp-info">${dist?.phone_number||''}</div>
          </div>
          <div><div class="rp-lbl">${S.lang==='sw'?'MNUNUZI':'BUYER'}</div>
            <div class="rp-name">${retailer?.store_name||'—'}</div>
            <div class="rp-info">${retailer?.phone_number||''} · ${retailer?.district||''}</div>
          </div>
        </div>
        <div>${(items||[]).map(i=>`
          <div class="ri">
            <div><div class="ri-name">${i.product_name}</div><div class="ri-qty">Qty: ${i.qty}</div></div>
            <div class="ri-price">${fmt(i.subtotal)}</div>
          </div>`).join('')}
        </div>
        <div class="rtotal">
          <span class="rtl">${S.lang==='sw'?'JUMLA YA MALIPO':'TOTAL PAID'}</span>
          <span class="rtv">${fmt(order.total_price)}</span>
        </div>
        <div class="rfoot">
          ${S.lang==='sw'?'Asante kwa biashara yako! · BomaWave FMCG Platform':'Thank you for your business! · BomaWave FMCG Platform'}
        </div>
      </div>`;
  },

  // ── INVOICES (PDF + WhatsApp + SMS) ──────────────────
  async showInvoice(orderId) {
    const {data:order}=await sb.from('orders').select('*').eq('id',orderId).single();
    const {data:items}=await sb.from('order_items').select('*').eq('order_id',orderId);
    const {data:retailer}=await sb.from('profiles').select('store_name,phone_number,district').eq('id',order.retailer_id).single();
    const {data:dist}=await sb.from('profiles').select('store_name,phone_number').eq('id',order.distributor_id).single();
    const {data:invoice}=await sb.from('invoices').select('*').eq('order_id',orderId).maybeSingle();
    const inv=invoice||{invoice_ref:genRef('INV'),issued_at:new Date().toISOString(),due_date:'',status:'unpaid'};

    // Build share text
    const shareText=encodeURIComponent(
      `*ANKARA YA BOMAWAVE*\n` +
      `Ref: ${inv.invoice_ref}\n` +
      `Tarehe: ${inv.issued_at?.slice(0,10)}\n\n` +
      `Muuzaji: ${dist?.store_name}\n` +
      `Mnunuzi: ${retailer?.store_name}\n\n` +
      `BIDHAA:\n` +
      (items||[]).map(i=>`- ${i.product_name} x${i.qty}: ${fmt(i.subtotal)}`).join('\n') +
      `\n\nJUMLA: ${fmt(order.total_price)}\n` +
      `Hali: ${inv.status==='paid'?'✅ Imelipwa':'⏳ Haijalipwa'}\n\n` +
      `BomaWave FMCG · Tanzania`
    );
    const waUrl=`https://wa.me/?text=${shareText}`;
    const smsUrl=`sms:?body=${shareText}`;

    const view=$('av');
    view.innerHTML=`
      <div class="no-print share-btns" style="margin-bottom:1rem">
        <button class="share-btn pdf" onclick="window.print()">${svgIcon('print')} ${t('printPDF')}</button>
        <button class="share-btn wa" onclick="window.open('${waUrl}','_blank')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button class="share-btn sms" onclick="window.open('${smsUrl}','_blank')">${svgIcon('sms')} SMS</button>
      </div>
      <div class="receipt" id="print-area">
        <div class="receipt-logo">
          <img src="logo.jpg" onerror="this.style.display='none'"/>
          <div>
            <div class="receipt-logo-name">BomaWave</div>
            <div style="font-size:.65rem;color:var(--s500)">FMCG Platform · Tanzania</div>
          </div>
        </div>
        <div class="receipt-title">${S.lang==='sw'?'ANKARA YA BIASHARA':'COMMERCIAL INVOICE'}</div>
        <div class="receipt-ref">Ref: ${inv.invoice_ref} · ${inv.issued_at?.slice(0,10)||today()}</div>
        <div class="receipt-parties">
          <div><div class="rp-lbl">${S.lang==='sw'?'MUUZAJI':'SELLER'}</div>
            <div class="rp-name">${dist?.store_name||'—'}</div>
            <div class="rp-info">${dist?.phone_number||''}</div>
          </div>
          <div><div class="rp-lbl">${S.lang==='sw'?'MNUNUZI':'BUYER'}</div>
            <div class="rp-name">${retailer?.store_name||'—'}</div>
            <div class="rp-info">${retailer?.phone_number||''}</div>
          </div>
        </div>
        <div>${(items||[]).map(i=>`
          <div class="ri">
            <div><div class="ri-name">${i.product_name}</div><div class="ri-qty">× ${i.qty} @ ${fmt(i.unit_price)}</div></div>
            <div class="ri-price">${fmt(i.subtotal)}</div>
          </div>`).join('')}
        </div>
        <div class="rtotal">
          <span class="rtl">${S.lang==='sw'?'JUMLA':'TOTAL'}</span>
          <span class="rtv">${fmt(order.total_price)}</span>
        </div>
        <div style="margin-top:.75rem;padding:.65rem;background:var(--s100);border-radius:.5rem;font-size:.75rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:.3rem">
            <span style="color:var(--s500)">${S.lang==='sw'?'Hali ya Malipo':'Payment Status'}</span>
            <strong>${inv.status==='paid'?'✅ Imelipwa':'⏳ Haijalipwa'}</strong>
          </div>
          ${inv.due_date?`<div style="display:flex;justify-content:space-between">
            <span style="color:var(--s500)">${S.lang==='sw'?'Tarehe ya Mwisho':'Due Date'}</span>
            <strong>${inv.due_date}</strong>
          </div>`:''}
        </div>
        <div class="rfoot">
          ${S.lang==='sw'?'Malipo yalipwe kabla ya tarehe iliyoonyeshwa. · BomaWave FMCG · Tanzania':'Payment due by date shown. · BomaWave FMCG · Tanzania'}
        </div>
      </div>`;
  },

  async pageInvoices() {
    const {data:invoices}=await sb.from('invoices')
      .select('*').eq('distributor_id',S.user.id)
      .order('issued_at',{ascending:false});
    const view=$('av');
    view.innerHTML=`
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('invoices')}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr>
            <th>REF</th><th>${S.lang==='sw'?'HALI':'STATUS'}</th>
            <th>${S.lang==='sw'?'KIASI':'AMOUNT'}</th><th>${S.lang==='sw'?'TAREHE':'DATE'}</th>
            <th>${S.lang==='sw'?'VITENDO':'ACTIONS'}</th>
          </tr></thead>
          <tbody>${(invoices||[]).map(inv=>`
            <tr>
              <td><strong style="color:var(--g700)">${inv.invoice_ref}</strong></td>
              <td><span class="pill ${inv.status==='paid'?'p-paid':'p-unp'}">${inv.status==='paid'?'Imelipwa':'Haijalipwa'}</span></td>
              <td><strong>${fmt(inv.amount)}</strong></td>
              <td style="color:var(--s500);font-size:.75rem">${inv.issued_at?.slice(0,10)}</td>
              <td style="display:flex;gap:.3rem;flex-wrap:wrap">
                ${inv.order_id?`<button class="bsm b" onclick="App.showInvoice('${inv.order_id}')">${t('shareInvoice')}</button>`:''}
                ${inv.status==='unpaid'?`<button class="bsm g" onclick="App.markInvPaid('${inv.id}')">${S.lang==='sw'?'Malipo Yamefika':'Mark Paid'}</button>`:''}
              </td>
            </tr>`).join('')||`<tr><td colspan="5"><div class="empty"><div class="empty-ic">📄</div><div class="empty-s">${S.lang==='sw'?'Hakuna ankara':'No invoices'}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  async markInvPaid(id){
    await sb.from('invoices').update({status:'paid'}).eq('id',id);
    toast(S.lang==='sw'?'Malipo yamekubaliwa':'Payment recorded','s');
    App.pageInvoices();
  },

  // ── PRODUCTS (Distributor) ─────────────────────────────
  async pageProducts() {
    const {data:products}=await sb.from('products')
      .select('*').eq('distributor_id',S.user.id).order('created_at',{ascending:false});

    const view=$('av');
    view.innerHTML=`
      <div class="card" style="margin-bottom:1rem">
        <div class="cp">
          <div class="sh"><span class="st">${S.lang==='sw'?'Ongeza Bidhaa Mpya':'Add New Product'}</span></div>
          <div class="pform">
            <div class="fr" style="margin-bottom:.75rem">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Jina':'Name'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="pn" placeholder="${S.lang==='sw'?'Jina la bidhaa':'Product name'}"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Aina':'Category'}</label>
                <select class="fi" id="pc">
                  ${CATS.map(c=>`<option value="${c.id}">${CAT_ICONS[c.id]} ${S.lang==='sw'?c.sw:c.en}</option>`).join('')}
                </select></div>
            </div>
            <div class="fr3" style="margin-bottom:.75rem">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Bei ya Kuuza':'Sell Price'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="pp" type="number" min="0" placeholder="0"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Bei ya Kununua':'Cost Price'}</label>
                <input class="fi" id="pcp" type="number" min="0" placeholder="0"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Stok':'Stock'}</label>
                <input class="fi" id="pq" type="number" min="0" placeholder="0"/></div>
            </div>
            <div class="fr" style="margin-bottom:.75rem">
              <div class="fg"><label class="fl">MOQ <span style="font-size:.65rem;color:var(--s500)">(min order)</span></label>
                <input class="fi" id="pmoq" type="number" min="1" value="1" placeholder="1"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Kipimo':'Unit'}</label>
                <input class="fi" id="pu" placeholder="${S.lang==='sw'?'mfano: Krate (24)':'e.g. Crate (24)'}"/></div>
            </div>
            <button class="btn btn-p" onclick="App.addProduct()"  style="max-width:240px">
              <span id="add-p-txt">+ ${t('addProduct')}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${S.lang==='sw'?'Bidhaa Zangu':'My Products'}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr>
            <th>${S.lang==='sw'?'JINA':'NAME'}</th><th>${S.lang==='sw'?'AINA':'CATEGORY'}</th>
            <th>${S.lang==='sw'?'BEI':'PRICE'}</th><th>MOQ</th>
            <th>${S.lang==='sw'?'STOK':'STOCK'}</th><th>${S.lang==='sw'?'VITENDO':'ACTIONS'}</th>
          </tr></thead>
          <tbody>${(products||[]).map(p=>`
            <tr>
              <td><strong>${p.product_name}</strong></td>
              <td>${CAT_ICONS[p.category]||''} ${p.category}</td>
              <td><strong style="color:var(--g700)">${fmt(p.price)}</strong></td>
              <td style="color:var(--amber);font-weight:700">${p.min_order_qty}</td>
              <td>
                <div class="sedit">
                  <input type="number" id="sq-${p.id}" value="${p.stock_qty}" min="0" style="width:60px"/>
                  <button class="bsm g" onclick="App.updateStock('${p.id}')">${S.lang==='sw'?'Hifadhi':'Save'}</button>
                </div>
              </td>
              <td>
                <button class="bsm r" onclick="App.deleteProduct('${p.id}')">${S.lang==='sw'?'Futa':'Delete'}</button>
              </td>
            </tr>`).join('')||`<tr><td colspan="6"><div class="empty"><div class="empty-ic">📦</div><div class="empty-s">${t('noProducts')}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  async addProduct() {
    const name=$('pn').value.trim(),cat=$('pc').value,
      price=parseFloat($('pp').value||'0'),cost=parseFloat($('pcp').value||'0'),
      qty=parseInt($('pq').value||'0'),moq=parseInt($('pmoq').value||'1'),unit=$('pu').value.trim();
    if(!name||!price)return toast(S.lang==='sw'?'Jaza jina na bei':'Fill name and price','e');
    setBusy('add-p-txt',true);
    const {error}=await sb.from('products').insert([{
      distributor_id:S.user.id, product_name:name, category:cat,
      price, cost_price:cost, stock_qty:qty, min_order_qty:moq, selling_unit:unit,
    }]);
    setBusy('add-p-txt',false,`+ ${t('addProduct')}`);
    if(error)return toast('Hitilafu ya kuongeza bidhaa','e');
    toast(S.lang==='sw'?'Bidhaa imeongezwa! ✅':'Product added! ✅','s');
    App.pageProducts();
  },

  async updateStock(id) {
    const qty=parseInt($(`sq-${id}`)?.value||'0');
    await sb.from('products').update({stock_qty:qty}).eq('id',id);
    toast(S.lang==='sw'?'Stok imehifadhiwa':'Stock updated','s');
  },

  async deleteProduct(id) {
    if(!confirm(S.lang==='sw'?'Una uhakika wa kufuta bidhaa hii?':'Delete this product?'))return;
    await sb.from('products').delete().eq('id',id);
    toast(S.lang==='sw'?'Bidhaa imefutwa':'Product deleted','s');
    App.pageProducts();
  },

  // ── POS ───────────────────────────────────────────────
  async pagePOS() {
    const {data:sales}=await sb.from('sales').select('*').eq('user_id',S.user.id)
      .gte('sale_date',today()).order('created_at',{ascending:false});
    const {data:expenses}=await sb.from('expenses').select('*').eq('user_id',S.user.id)
      .gte('expense_date',today()).order('created_at',{ascending:false});

    const view=$('av');
    view.innerHTML=`
      <div class="ptabs" id="pos-tabs">
        <button class="ptab on" onclick="App.posTab('sales',this)">
          ${svgIcon('pos')} ${S.lang==='sw'?'Mauzo':'Sales'}
        </button>
        <button class="ptab" onclick="App.posTab('expenses',this)">
          ${svgIcon('expense')} ${S.lang==='sw'?'Matumizi':'Expenses'}
        </button>
      </div>

      <div id="pos-sales">
        <div class="pform">
          <div class="pftitle">${S.lang==='sw'?'Rekodi Mauzo':'Record Sale'}</div>
          <div style="display:flex;flex-direction:column;gap:.75rem">
            <div class="fr">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Jina la Bidhaa':'Product Name'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="s-prod" placeholder="${S.lang==='sw'?'Jina la bidhaa':'Product name'}"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Aina':'Category'}</label>
                <select class="fi" id="s-cat">
                  ${CATS.map(c=>`<option value="${c.id}">${CAT_ICONS[c.id]} ${S.lang==='sw'?c.sw:c.en}</option>`).join('')}
                </select></div>
            </div>
            <div class="fr3">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Idadi':'Qty'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="s-qty" type="number" min="1" value="1"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Bei ya Kununua':'Buying Price'}</label>
                <input class="fi" id="s-buy" type="number" min="0" placeholder="0"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Bei ya Kuuza':'Selling Price'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="s-sell" type="number" min="0" placeholder="0"/></div>
            </div>
            <button class="btn btn-p" onclick="App.recordSale()" style="max-width:200px">
              <span id="rec-sale-txt">${S.lang==='sw'?'Rekodi Mauzo':'Record Sale'}</span>
            </button>
          </div>
        </div>
        <div class="card"><div class="cp">
          <div class="sh"><span class="st">${S.lang==='sw'?'Mauzo ya Leo':'Today Sales'}</span></div>
          <div class="tw"><table class="dt">
            <thead><tr>
              <th>${S.lang==='sw'?'BIDHAA':'PRODUCT'}</th><th>${S.lang==='sw'?'IDADI':'QTY'}</th>
              <th>${S.lang==='sw'?'MAPATO':'REVENUE'}</th><th>${S.lang==='sw'?'FAIDA':'PROFIT'}</th>
              <th>${S.lang==='sw'?'TAREHE':'TIME'}</th>
            </tr></thead>
            <tbody>${(sales||[]).map(s=>`
              <tr>
                <td><strong>${s.product_name}</strong></td>
                <td style="font-size:.95rem;font-weight:800">${s.qty}</td>
                <td style="color:var(--g700);font-weight:800;font-size:.95rem">${fmt(s.revenue)}</td>
                <td style="color:var(--g600);font-weight:700">${fmt(s.profit)}</td>
                <td style="color:var(--s500);font-size:.75rem">${s.created_at?.slice(11,16)||'—'}</td>
              </tr>`).join('')||`<tr><td colspan="5"><div class="empty"><div class="empty-ic">💰</div><div class="empty-s">${S.lang==='sw'?'Hakuna mauzo leo':'No sales today'}</div></div></td></tr>`}
            </tbody>
          </table></div>
        </div></div>
      </div>

      <div id="pos-expenses" style="display:none">
        <div class="pform">
          <div class="pftitle">${S.lang==='sw'?'Rekodi Matumizi':'Record Expense'}</div>
          <div style="display:flex;flex-direction:column;gap:.75rem">
            <div class="fr">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Aina':'Category'}</label>
                <select class="fi" id="e-cat">
                  <option value="rent">${S.lang==='sw'?'Kodi':'Rent'}</option>
                  <option value="transport">${S.lang==='sw'?'Usafiri':'Transport'}</option>
                  <option value="salary">${S.lang==='sw'?'Mshahara':'Salary'}</option>
                  <option value="utilities">${S.lang==='sw'?'Umeme/Maji':'Utilities'}</option>
                  <option value="other">${S.lang==='sw'?'Nyingine':'Other'}</option>
                </select></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Kiasi':'Amount'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="e-amt" type="number" min="0" placeholder="0"/></div>
            </div>
            <div class="fg"><label class="fl">${S.lang==='sw'?'Maelezo':'Description'} <span style="color:var(--red)">*</span></label>
              <input class="fi" id="e-desc" placeholder="${S.lang==='sw'?'Maelezo ya matumizi':'Expense description'}"/></div>
            <button class="btn btn-p" onclick="App.recordExpense()" style="max-width:200px">
              <span id="rec-exp-txt">${S.lang==='sw'?'Rekodi Matumizi':'Record Expense'}</span>
            </button>
          </div>
        </div>
        <div class="card"><div class="cp">
          <div class="sh"><span class="st">${S.lang==='sw'?'Matumizi ya Leo':'Today Expenses'}</span></div>
          <div class="tw"><table class="dt">
            <thead><tr>
              <th>${S.lang==='sw'?'AINA':'CATEGORY'}</th>
              <th>${S.lang==='sw'?'MAELEZO':'DESCRIPTION'}</th>
              <th>${S.lang==='sw'?'KIASI':'AMOUNT'}</th>
            </tr></thead>
            <tbody>${(expenses||[]).map(e=>`
              <tr>
                <td><span class="pill p-pen">${e.category}</span></td>
                <td>${e.description}</td>
                <td style="color:var(--red);font-weight:800">${fmt(e.amount)}</td>
              </tr>`).join('')||`<tr><td colspan="3"><div class="empty"><div class="empty-ic">💸</div><div class="empty-s">${S.lang==='sw'?'Hakuna matumizi leo':'No expenses today'}</div></div></td></tr>`}
            </tbody>
          </table></div>
        </div></div>
      </div>`;
  },

  posTab(tab, btn) {
    document.querySelectorAll('.ptab').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    $('pos-sales').style.display=tab==='sales'?'':'none';
    $('pos-expenses').style.display=tab==='expenses'?'':'none';
  },

  async recordSale() {
    const prod=$('s-prod').value.trim(), cat=$('s-cat').value,
      qty=parseInt($('s-qty').value||'1'),
      buy=parseFloat($('s-buy').value||'0'),
      sell=parseFloat($('s-sell').value||'0');
    if(!prod||!sell||qty<1)return toast(S.lang==='sw'?'Jaza jina na bei':'Fill product and price','e');
    setBusy('rec-sale-txt',true);
    const {error}=await sb.from('sales').insert([{
      user_id:S.user.id,product_name:prod,category:cat,
      qty,buying_price:buy,selling_price:sell,sale_date:today(),
    }]);
    setBusy('rec-sale-txt',false,S.lang==='sw'?'Rekodi Mauzo':'Record Sale');
    if(error)return toast('Hitilafu','e');
    toast(S.lang==='sw'?'Mauzo yamerekodiwa! ✅':'Sale recorded! ✅','s');
    App.pagePOS();
  },

  async recordExpense() {
    const cat=$('e-cat').value,desc=$('e-desc').value.trim(),amt=parseFloat($('e-amt').value||'0');
    if(!desc||!amt)return toast(S.lang==='sw'?'Jaza maelezo na kiasi':'Fill description and amount','e');
    setBusy('rec-exp-txt',true);
    const {error}=await sb.from('expenses').insert([{
      user_id:S.user.id,category:cat,description:desc,amount:amt,expense_date:today(),
    }]);
    setBusy('rec-exp-txt',false,S.lang==='sw'?'Rekodi Matumizi':'Record Expense');
    if(error)return toast('Hitilafu','e');
    toast(S.lang==='sw'?'Matumizi yamerekodiwa! ✅':'Expense recorded! ✅','s');
    App.pagePOS();
  },

  // ── REPORTS ───────────────────────────────────────────
  async pageReports() {
    let period='today', startDate=today();
    const render=async()=>{
      if(period==='today') startDate=today();
      else if(period==='week') startDate=new Date(Date.now()-7*864e5).toISOString().slice(0,10);
      else if(period==='month') startDate=new Date(Date.now()-30*864e5).toISOString().slice(0,10);
      const {data:sales}=await sb.from('sales').select('*').eq('user_id',S.user.id).gte('sale_date',startDate);
      const {data:exps}=await sb.from('expenses').select('*').eq('user_id',S.user.id).gte('expense_date',startDate);
      const rev=sales?.reduce((s,r)=>s+(r.revenue||0),0)||0;
      const profit=sales?.reduce((s,r)=>s+(r.profit||0),0)||0;
      const expTotal=exps?.reduce((s,e)=>s+(e.amount||0),0)||0;
      const netProfit=profit-expTotal;

      // Category breakdown
      const byCat={};
      (sales||[]).forEach(s=>{byCat[s.category]=(byCat[s.category]||0)+(s.revenue||0);});

      $('rep-body').innerHTML=`
        <div class="rsec">
          <div class="rsec-t">${S.lang==='sw'?'Muhtasari wa Fedha':'Financial Summary'}</div>
          <div class="rrow"><span class="rl">${S.lang==='sw'?'Jumla ya Mauzo':'Total Revenue'}</span><span class="rv g">${fmt(rev)}</span></div>
          <div class="rrow"><span class="rl">${S.lang==='sw'?'Faida Kabla ya Matumizi':'Gross Profit'}</span><span class="rv g">${fmt(profit)}</span></div>
          <div class="rrow"><span class="rl">${S.lang==='sw'?'Jumla ya Matumizi':'Total Expenses'}</span><span class="rv r">${fmt(expTotal)}</span></div>
          <div class="rrow div"><span class="rl">${S.lang==='sw'?'Faida Halisi':'Net Profit'}</span><span class="rv ${netProfit>=0?'g':'r'}">${fmt(netProfit)}</span></div>
        </div>
        <div class="rsec">
          <div class="rsec-t">${S.lang==='sw'?'Mauzo kwa Aina':'Sales by Category'}</div>
          ${Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>`
            <div class="rrow"><span class="rl">${CAT_ICONS[cat]||''} ${cat}</span><span class="rv">${fmt(val)}</span></div>`).join('')||`<div class="rrow"><span class="rl">${S.lang==='sw'?'Hakuna data':'No data'}</span></div>`}
        </div>`;
    };

    const view=$('av');
    view.innerHTML=`
      <div class="pertabs" id="ptabs">
        <button class="pertab on" onclick="App.repPeriod('today',this)">Leo</button>
        <button class="pertab" onclick="App.repPeriod('week',this)">${S.lang==='sw'?'Wiki 1':'1 Week'}</button>
        <button class="pertab" onclick="App.repPeriod('month',this)">${S.lang==='sw'?'Mwezi 1':'1 Month'}</button>
      </div>
      <div id="rep-body"><div style="text-align:center;padding:2rem;color:var(--s500)"><span class="spin d"></span></div></div>`;

    S._repPeriod='today';
    window._repRender=render;
    await render();
  },

  repPeriod(p,btn) {
    document.querySelectorAll('.pertab').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    S._repPeriod=p;
    if(window._repRender)window._repRender();
  },

  // ── DEBTS ─────────────────────────────────────────────
  async pageDebts() {
    const {data:debts}=await sb.from('debts').select('*').eq('user_id',S.user.id)
      .order('created_at',{ascending:false});

    const view=$('av');
    view.innerHTML=`
      <div class="card" style="margin-bottom:1rem"><div class="cp">
        <div class="pftitle">${S.lang==='sw'?'Rekodi Deni Jipya':'Record New Debt'}</div>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          <div class="fr">
            <div class="fg"><label class="fl">${S.lang==='sw'?'Jina la Mteja':'Customer Name'} <span style="color:var(--red)">*</span></label>
              <input class="fi" id="d-name" placeholder="${S.lang==='sw'?'Jina la mteja':'Customer name'}"/></div>
            <div class="fg"><label class="fl">${S.lang==='sw'?'Simu':'Phone'}</label>
              <input class="fi" id="d-phone" type="tel" placeholder="07xxxxxxxx"/></div>
          </div>
          <div class="fr">
            <div class="fg"><label class="fl">${S.lang==='sw'?'Kiasi':'Amount'} <span style="color:var(--red)">*</span></label>
              <input class="fi" id="d-amt" type="number" min="0" placeholder="0"/></div>
            <div class="fg"><label class="fl">${S.lang==='sw'?'Tarehe ya Kulipa':'Due Date'}</label>
              <input class="fi" id="d-due" type="date"/></div>
          </div>
          <div class="fg"><label class="fl">${S.lang==='sw'?'Maelezo':'Description'}</label>
            <input class="fi" id="d-desc" placeholder="${S.lang==='sw'?'mfano: Mkopo wa mchele':'e.g. Rice credit'}"/></div>
          <button class="btn btn-p" onclick="App.addDebt()" style="max-width:200px">
            <span id="add-debt-txt">${S.lang==='sw'?'Rekodi Deni':'Record Debt'}</span>
          </button>
        </div>
      </div></div>
      <div id="debts-list">
        ${(debts||[]).map(d=>{
          const paid=d.amount_paid||0;
          const remain=d.amount-paid;
          const pct=Math.min(100,Math.round(paid/d.amount*100));
          return `<div class="dcard">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.25rem">
              <div>
                <div style="font-weight:800">${d.customer_name}</div>
                <div style="font-size:.75rem;color:var(--s500)">${d.customer_phone||''}</div>
              </div>
              <span class="pill ${d.status==='paid'?'p-paid':d.status==='partial'?'p-par':'p-unp'}">${d.status}</span>
            </div>
            <div class="dprog"><div class="dprogf" style="width:${pct}%"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.5rem">
              <span style="color:var(--s500)">${S.lang==='sw'?'Kilicholipwa':'Paid'}: <strong style="color:var(--g700)">${fmt(paid)}</strong></span>
              <span style="color:var(--s500)">${S.lang==='sw'?'Kinachobaki':'Remaining'}: <strong style="color:var(--red)">${fmt(remain)}</strong></span>
            </div>
            ${d.status!=='paid'?`<div style="display:flex;gap:.4rem;flex-wrap:wrap">
              <input class="fi" id="dp-${d.id}" type="number" min="0" placeholder="${S.lang==='sw'?'Kiasi':'Amount'}" style="max-width:120px;padding:.4rem .6rem;font-size:.8rem"/>
              <button class="bsm g" onclick="App.payDebt('${d.id}',${d.amount_paid||0})">${S.lang==='sw'?'Rekodi Malipo':'Record Payment'}</button>
              <button class="bsm r" onclick="App.deleteDebt('${d.id}')">${S.lang==='sw'?'Futa':'Delete'}</button>
            </div>`:''}
          </div>`;
        }).join('')||`<div class="empty"><div class="empty-ic">💳</div><div class="empty-t">${S.lang==='sw'?'Hakuna madeni':'No debts'}</div></div>`}
      </div>`;
  },

  async addDebt() {
    const name=$('d-name').value.trim(),phone=$('d-phone').value,
      amt=parseFloat($('d-amt').value||'0'),due=$('d-due').value,desc=$('d-desc').value;
    if(!name||!amt)return toast(S.lang==='sw'?'Jaza jina na kiasi':'Fill name and amount','e');
    setBusy('add-debt-txt',true);
    const {error}=await sb.from('debts').insert([{
      user_id:S.user.id,customer_name:name,customer_phone:phone,
      amount:amt,due_date:due||null,description:desc,status:'unpaid',
    }]);
    setBusy('add-debt-txt',false,S.lang==='sw'?'Rekodi Deni':'Record Debt');
    if(error)return toast('Hitilafu','e');
    toast(S.lang==='sw'?'Deni limerekodiwa! ✅':'Debt recorded! ✅','s');
    App.pageDebts();
  },

  async payDebt(id,currentPaid) {
    const extra=parseFloat($(`dp-${id}`)?.value||'0');
    if(!extra)return toast(S.lang==='sw'?'Weka kiasi':'Enter amount','e');
    const {data:debt}=await sb.from('debts').select('amount,amount_paid').eq('id',id).single();
    const newPaid=(debt.amount_paid||0)+extra;
    const status=newPaid>=debt.amount?'paid':newPaid>0?'partial':'unpaid';
    await sb.from('debts').update({amount_paid:newPaid,status}).eq('id',id);
    toast(S.lang==='sw'?'Malipo yamerekodiwa! ✅':'Payment recorded! ✅','s');
    App.pageDebts();
  },

  async deleteDebt(id) {
    if(!confirm(S.lang==='sw'?'Futa deni hili?':'Delete this debt?'))return;
    await sb.from('debts').delete().eq('id',id);
    toast(S.lang==='sw'?'Deni limefutwa':'Debt deleted','s');
    App.pageDebts();
  },

  // ── USERS (Admin) ─────────────────────────────────────
  async pageUsers() {
    const {data:users}=await sb.from('profiles').select('*').order('created_at',{ascending:false});
    const view=$('av');
    view.innerHTML=`
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('users')}</span>
          <span class="st" style="font-size:.75rem;color:var(--s500)">${(users||[]).length} ${S.lang==='sw'?'watumiaji':'users'}</span>
        </div>
        <div class="tw"><table class="dt">
          <thead><tr>
            <th>${S.lang==='sw'?'JINA':'NAME'}</th><th>${S.lang==='sw'?'SIMU':'PHONE'}</th>
            <th>${S.lang==='sw'?'AINA':'ROLE'}</th><th>${S.lang==='sw'?'MKOA':'REGION'}</th>
            <th>${S.lang==='sw'?'HALI':'STATUS'}</th>
          </tr></thead>
          <tbody>${(users||[]).map(u=>`
            <tr>
              <td><strong>${u.store_name}</strong></td>
              <td style="font-size:.8rem;color:var(--s700)">${u.phone_number}</td>
              <td>${statusBadge(u.role)}</td>
              <td style="font-size:.78rem">${u.district||u.region||'—'}</td>
              <td><span class="pill ${u.is_active?'p-del':'p-can'}">${u.is_active?'✅ Active':'❌ Blocked'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div></div>`;
  },

  // ── ANALYTICS (Admin) ─────────────────────────────────
  async pageAnalytics() {
    const {data:profiles}=await sb.from('profiles').select('role');
    const {data:orders}=await sb.from('orders').select('total_price,status');
    const retailers=(profiles||[]).filter(p=>p.role==='retailer').length;
    const distributors=(profiles||[]).filter(p=>p.role==='distributor').length;
    const totalOrders=(orders||[]).length;
    const totalValue=(orders||[]).reduce((s,o)=>s+(o.total_price||0),0);
    const delivered=(orders||[]).filter(o=>o.status==='delivered').length;

    const view=$('av');
    view.innerHTML=`
      <div class="sr">
        <div class="sc g"><div class="sic">${svgIcon('users')}</div><div class="sl">Retailers</div><div class="sv">${retailers}</div></div>
        <div class="sc b"><div class="sic">${svgIcon('orders')}</div><div class="sl">Distributors</div><div class="sv">${distributors}</div></div>
        <div class="sc a"><div class="sic">${svgIcon('pkg')}</div><div class="sl">Orders</div><div class="sv">${totalOrders}</div></div>
        <div class="sc g"><div class="sic">${svgIcon('revenue')}</div><div class="sl">GMV</div><div class="sv">${fmt(totalValue)}</div></div>
      </div>
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">Platform Stats</span></div>
        <div class="rrow"><span class="rl">Total Orders</span><span class="rv">${totalOrders}</span></div>
        <div class="rrow"><span class="rl">Delivered</span><span class="rv g">${delivered}</span></div>
        <div class="rrow"><span class="rl">Platform GMV</span><span class="rv g">${fmt(totalValue)}</span></div>
        <div class="rrow"><span class="rl">Avg Order Value</span><span class="rv">${fmt(totalOrders?totalValue/totalOrders:0)}</span></div>
      </div></div>`;
  },

}; // end App

// ── SVG Icons ─────────────────────────────────────────────────
function svgIcon(name) {
  const icons = {
    grid:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    store:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    pkg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    orders:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    chart:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
    pos:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    debt:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    invoice:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    receipt:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="16" y1="8" x2="8" y2="8"/><line x1="16" y1="12" x2="8" y2="12"/><line x1="12" y1="16" x2="8" y2="16"/></svg>`,
    users:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    analytics:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    revenue:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    profit:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    expense:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    print:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    sms:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  };
  return icons[name]||'';
}

// ── Status helpers ────────────────────────────────────────────
function statusPill(status,lang) {
  const map={
    pending:{cls:'p-pen',sw:'Inasubiri',en:'Pending'},
    confirmed:{cls:'p-con',sw:'Imethibitishwa',en:'Confirmed'},
    delivered:{cls:'p-del',sw:'Imetolewa',en:'Delivered'},
    cancelled:{cls:'p-can',sw:'Imefutwa',en:'Cancelled'},
  };
  const s=map[status]||{cls:'p-pen',sw:status,en:status};
  return `<span class="pill ${s.cls}">${lang==='sw'?s.sw:s.en}</span>`;
}

function statusBadge(role) {
  const map={retailer:{cls:'rb-ret',label:'Duka'},distributor:{cls:'rb-dist',label:'Msambazaji'},admin:{cls:'rb-adm',label:'Admin'}};
  const r=map[role]||{cls:'rb-ret',label:role};
  return `<span class="rbadge ${r.cls}">${r.label}</span>`;
}

// ── Inject styles ─────────────────────────────────────────────
const _style=document.createElement('style');
_style.textContent=`
  #store-switcher{display:none;flex-direction:column;padding:.5rem .6rem;border-bottom:1px solid rgba(255,255,255,.06);}
  .store-btn{display:flex;align-items:center;gap:.5rem;padding:.45rem .6rem;border-radius:.4rem;border:none;background:none;cursor:pointer;color:rgba(255,255,255,.6);font-family:'DM Sans',sans-serif;transition:all .15s;width:100%;text-align:left;}
  .store-btn:hover{background:rgba(255,255,255,.08);color:#fff;}
  .store-btn.active{background:rgba(22,163,74,.15);color:#4ade80;}
  .store-btn.add-store{color:rgba(255,255,255,.3);font-size:.75rem;margin-top:.25rem;border-top:1px solid rgba(255,255,255,.06);padding-top:.5rem;}
  .fi{font-size:.95rem!important;}
  .fl{font-size:.77rem!important;}
  .dt td{font-size:.9rem!important;padding:.875rem 1rem!important;}
  .dt th{font-size:.71rem!important;}
  .sv{font-size:1.6rem!important;letter-spacing:-1.5px;}
  .bni-lbl{font-size:.7rem!important;}
  .ni{font-size:.9rem!important;padding:.7rem .75rem!important;}
  #sync-badge{padding:.25rem .6rem;display:none;}
`;
document.head.appendChild(_style);

// ── BOOT ─────────────────────────────────────────────────────
async function boot() {
  await initPosDB();
  initLocDropdowns('reg-region','reg-district','reg-ward');
  initLocDropdowns('dreg-region','dreg-district','dreg-ward');
  buildCatGrid();
  goStep(1);

  // Add store-switcher div to sidebar
  const sbnav=document.getElementById('sbnav');
  if(sbnav && !document.getElementById('store-switcher')) {
    const div=document.createElement('div');
    div.id='store-switcher';
    sbnav.parentNode.insertBefore(div,sbnav);
  }

  // Add sync badge to topbar
  const tbr=document.querySelector('.tbr');
  if(tbr && !document.getElementById('sync-badge')) {
    const span=document.createElement('span');
    span.id='sync-badge';
    tbr.insertBefore(span,tbr.firstChild);
  }

  if (loadSession() && S.user) {
    await loadStores();
    S.pinBuf='';
    for(let i=0;i<4;i++){const d=document.getElementById('pd'+i);if(d)d.classList.remove('on','err');}
    setText('s7h', S.lang==='sw'?'Karibu!':'Welcome!');
    setText('s7sub', S.user.store_name||'');
    const prog=document.getElementById('pfill');
    if(prog)prog.style.width='90%';
    goStep(7);
  }

  if(S.isOnline) setTimeout(syncOfflineData, 3000);
}

boot();
const OTP_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/otp';
const SB_KEY = 'sb_publishable_yJni7Xxl78x24V1mJvLjVg_RAWAsGOt';
// ── State ────────────────────────────────────────────────────
let S = {
  user: null, lang: 'sw', role: null,
  pendingPhone: null, pendingData: null,
  pinBuf: '', cart: [], cartDist: null,
  page: 'dashboard', notifs: [], resendTimer: null,
  loginResendTimer: null, forgotResendTimer: null,
  realtimeCh: null,
};

// ── Tanzania Location Data ────────────────────────────────────
const LOC = {
  'Dar es Salaam': {
    'Ilala': ['Kariakoo','Gerezani','Upanga','Buguruni','Ilala','Kisutu'],
    'Kinondoni': ['Sinza','Mwananyamala','Tandale','Kijitonyama','Mikocheni','Msasani'],
    'Temeke': ['Tandika','Mbagala','Mtoni','Temeke','Charambe'],
    'Ubungo': ['Ubungo','Kimara','Makuburi','Saranga'],
    'Kigamboni': ['Kigamboni','Mjimwema','Somangila'],
  },
  'Mwanza': {
    'Nyamagana': ['Pamba','Mahina','Kirumba','Isamilo'],
    'Ilemela': ['Ilemela','Kiroba','Mkolani'],
  },
  'Arusha': {
    'Arusha Jiji': ['Kaloleni','Sekei','Sokon 1','Sokon 2'],
    'Arumeru': ['Tengeru','Usa River'],
  },
  'Dodoma': {
    'Dodoma Mjini': ['Makole','Nkuhungu','Kikuyu'],
    'Bahi': ['Bahi','Nondwa'],
  },
  'Mbeya': {
    'Mbeya Jiji': ['Mwanjelwa','Uyole','Sisimba'],
    'Mbarali': ['Rujewa','Igawa'],
  },
  'Tanga': {
    'Tanga Jiji': ['Ngamiani','Chumbageni','Makorora'],
    'Muheza': ['Muheza','Bumbuli'],
  },
  'Morogoro': {
    'Morogoro Mjini': ['Kihonda','Mwembesongo','Mji wa Mwisho'],
    'Kilosa': ['Kilosa','Gairo'],
  },
  'Zanzibar Mjini': {
    'Mjini': ['Stone Town','Mkunazini','Malindi'],
    'Magharibi': ['Bububu','Fuoni'],
  },
};

const CATS = [
  {id:'beverages',sw:'Vinywaji',en:'Beverages'},
  {id:'flour',sw:'Unga',en:'Flour'},
  {id:'oil',sw:'Mafuta ya Kupikia',en:'Cooking Oil'},
  {id:'sugar',sw:'Sukari',en:'Sugar'},
  {id:'soap',sw:'Sabuni',en:'Soap'},
  {id:'personal',sw:'Usafi wa Mwili',en:'Personal Care'},
  {id:'dairy',sw:'Maziwa',en:'Dairy'},
  {id:'other',sw:'Nyingine',en:'Other'},
];

const CAT_ICONS = {
  beverages:'🧃', flour:'🌾', oil:'🫙', sugar:'🍚',
  soap:'🧼', personal:'🪥', dairy:'🥛', other:'📦',
};

// ── Translations ─────────────────────────────────────────────
const T = {
  sw:{
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
    moqWarning:'Kiwango cha chini',
    orderSuccess:'Agizo limetumwa!',
    selectDist:'Chagua Msambazaji',
    nearbyFirst:'Karibu nawe kwanza',
    printReceipt:'Chapisha Risiti (PDF)',
    shareInvoice:'Shiriki Ankara',
    shareWhatsApp:'WhatsApp',
    shareSMS:'SMS',
    printPDF:'Chapisha PDF',
    invoiceText:'Ankara ya BomaWave',
  },
  en:{
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
    moqWarning:'Minimum order qty',
    orderSuccess:'Order sent!',
    selectDist:'Select Distributor',
    nearbyFirst:'Nearby first',
    printReceipt:'Print Receipt (PDF)',
    shareInvoice:'Share Invoice',
    shareWhatsApp:'WhatsApp',
    shareSMS:'SMS',
    printPDF:'Print PDF',
    invoiceText:'BomaWave Invoice',
  }
};
const t = (k) => T[S.lang]?.[k] ?? k;

// ── Helpers ──────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const fmt = (n) => 'TZS ' + Number(n||0).toLocaleString();
const fmtNum = (n) => Number(n||0).toLocaleString();
const today = () => new Date().toISOString().slice(0,10);
const genRef = (prefix='BW') => prefix + Date.now().toString(36).toUpperCase();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function toast(msg, type='s') {
  const wrap = $('twrap');
  const el = document.createElement('div');
  const icons = {s:'✅', e:'❌', i:'ℹ️'};
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 4100);
}

function setBusy(id, busy, txt='') {
  const btn = $(id);
  if (!btn) return;
  btn.disabled = busy;
  const span = btn.querySelector('span');
  if (!span) return;
  if (busy) {
    span.dataset.orig = span.textContent;
    span.innerHTML = `<span class="spin"></span>`;
  } else {
    span.textContent = txt || span.dataset.orig || '';
  }
}

function setText(id, txt) { const el=$(id); if(el) el.textContent=txt; }
function setHtml(id, h) { const el=$(id); if(el) el.innerHTML=h; }

// ── LocalStorage session ─────────────────────────────────────
function saveSession() {
  localStorage.setItem('bw_v3', JSON.stringify({ user: S.user, lang: S.lang }));
}
function loadSession() {
  try {
    const d = JSON.parse(localStorage.getItem('bw_v3') || 'null');
    if (d?.user) { S.user = d.user; S.lang = d.lang || 'sw'; return true; }
  } catch {}
  return false;
}
function clearSession() { localStorage.removeItem('bw_v3'); }

// ── OTP API call ─────────────────────────────────────────────
async function callOTP(payload) {
  const res = await fetch(OTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
      'Authorization': `Bearer ${SB_KEY}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── Phone normalizer ─────────────────────────────────────────
function normPhone(raw) {
  const d = raw.replace(/\D/g,'');
  if (d.length === 9 && (d[0]==='7'||d[0]==='6')) return '+255'+d;
  if (d.length === 10 && d[0]==='0') return '+255'+d.slice(1);
  if (d.length === 12 && d.startsWith('255')) return '+'+d;
  return null;
}

// ══════════════════════════════════════════════════════════════
//  STEP NAVIGATION
// ══════════════════════════════════════════════════════════════
const STEP_NAMES = {
  sw: { 1:'Lugha',2:'Aina',3:'Maelezo (Duka)',4:'Maelezo (Msambazaji)',
        5:'OTP',7:'PIN',8:'Ingia',9:'OTP ya Kuingia',
        10:'Nimesahau PIN',11:'OTP ya PIN',12:'PIN Mpya' },
  en: { 1:'Language',2:'Role',3:'Details (Shop)',4:'Details (Distributor)',
        5:'OTP',7:'PIN',8:'Login',9:'Login OTP',
        10:'Forgot PIN',11:'Forgot OTP',12:'New PIN' },
};
const STEP_MAX = { 1:10,2:20,3:50,4:50,5:75,7:90,8:30,9:60,10:30,11:60,12:85 };

function goStep(n) {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  const el = $(`s${n}`);
  if (el) el.classList.add('active');
  const pct = STEP_MAX[n] || 10;
  const name = STEP_NAMES[S.lang]?.[n] || `Hatua ${n}`;
  setText('plbl', name);
  setText('ppct', pct+'%');
  $('pfill').style.width = pct+'%';
}

// ── Init location dropdowns ──────────────────────────────────
function fillSelect(id, options, placeholder='—') {
  const sel = $(id);
  if (!sel) return;
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach(o => { const opt=document.createElement('option');opt.value=o;opt.textContent=o;sel.appendChild(opt); });
}

function initLocDropdowns(regionId, districtId, wardId) {
  fillSelect(regionId, Object.keys(LOC), S.lang==='sw'?'Chagua Mkoa':'Select Region');
  fillSelect(districtId, [], S.lang==='sw'?'— Chagua Wilaya —':'— Select District —');
  if (wardId) fillSelect(wardId, [], S.lang==='sw'?'— Chagua Kata —':'— Select Ward —');
}

// ── Category grid ────────────────────────────────────────────
function buildCatGrid() {
  const grid = $('cat-grid');
  if (!grid) return;
  grid.innerHTML = CATS.map(c => `
    <label class="cat-chip" id="chip-${c.id}">
      <input type="checkbox" value="${c.id}"/>
      ${CAT_ICONS[c.id]} ${S.lang==='sw'?c.sw:c.en}
    </label>`).join('');
  grid.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => {
      inp.parentElement.classList.toggle('on', inp.checked);
    });
  });
}

// ════════════════════════════════════════════════════════════
//  PUBLIC App OBJECT
// ════════════════════════════════════════════════════════════
window.App = {

  // ── Language ─────────────────────────────────────────────
  setLang(lang) {
    S.lang = lang;
    initLocDropdowns('reg-region','reg-district','reg-ward');
    initLocDropdowns('dreg-region','dreg-district','dreg-ward');
    buildCatGrid();
    goStep(2);
  },

  switchLang(lang) {
    S.lang = lang;
    if (S.user) { saveSession(); App.renderApp(); }
    $('lsw-sw').classList.toggle('on', lang==='sw');
    $('lsw-en').classList.toggle('on', lang==='en');
  },

  // ── Role ─────────────────────────────────────────────────
  pickRole(role) {
    S.role = role;
    $('rb-ret').classList.toggle('sel', role==='retailer');
    $('rb-dist').classList.toggle('sel', role==='distributor');
    $('ck-ret').style.display = role==='retailer'?'':'none';
    $('ck-dist').style.display = role==='distributor'?'':'none';
    $('rnext').style.display = 'flex';
  },

  proceedFromRole() {
    if (!S.role) return;
    goStep(S.role==='retailer' ? 3 : 4);
  },

  goToRegister() { goStep(2); },

  // ── Location changes ────────────────────────────────────
  onRegionChange() {
    const r = $('reg-region').value;
    const dists = r ? Object.keys(LOC[r]||{}) : [];
    fillSelect('reg-district', dists, '— Wilaya —');
    fillSelect('reg-ward', [], '— Kata —');
  },
  onDistrictChange() {
    const r = $('reg-region').value, d = $('reg-district').value;
    const wards = (r&&d) ? (LOC[r]?.[d]||[]) : [];
    fillSelect('reg-ward', wards, '— Kata —');
  },
  onDRegionChange() {
    const r = $('dreg-region').value;
    const dists = r ? Object.keys(LOC[r]||{}) : [];
    fillSelect('dreg-district', dists, '— Wilaya —');
    fillSelect('dreg-ward', [], '— Kata —');
  },
  onDDistrictChange() {
    const r = $('dreg-region').value, d = $('dreg-district').value;
    const wards = (r&&d) ? (LOC[r]?.[d]||[]) : [];
    fillSelect('dreg-ward', wards, '— Kata —');
  },

  // ── Eye toggle ──────────────────────────────────────────
  eyeToggle(inputId, iconId) {
    const inp = $(inputId), ico = $(iconId);
    if (!inp || !ico) return;
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    ico.innerHTML = show
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  },

  // ── Retailer registration ──────────────────────────────
  async submitDetails() {
    const name = $('reg-name').value.trim();
    const rawPhone = $('reg-phone').value.trim();
    const pin = $('reg-pin').value.trim();
    const pin2 = $('reg-pin2').value.trim();

    if (!name) return toast('Weka jina la duka', 'e');
    const phone = normPhone(rawPhone);
    if (!phone) return toast('Namba ya simu si sahihi', 'e');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'e');
    if (pin !== pin2) return toast('PIN hazilingani', 'e');

    S.pendingData = {
      role: 'retailer',
      store_name: name, phone, pin,
      region: $('reg-region').value,
      district: $('reg-district').value,
      ward: $('reg-ward').value,
      street: $('reg-street').value,
      business_type: $('reg-btype').value,
    };
    S.pendingPhone = phone;

    setBusy('reg-btn', true);
    const r = await callOTP({ action:'send_otp', phone });
    setBusy('reg-btn', false, 'Endelea — Tuma OTP');

    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast('OTP imetumwa! ✅', 's');
    setText('otp-phone', phone);
    App.clearOTPBoxes('ob');
    App.startResendTimer();
    goStep(5);
  },

  // ── Distributor registration ────────────────────────────
  async submitDDetails() {
    const name = $('dreg-name').value.trim();
    const rawPhone = $('dreg-phone').value.trim();
    const pin = $('dreg-pin').value.trim();
    const pin2 = $('dreg-pin2').value.trim();

    if (!name) return toast('Weka jina la biashara', 'e');
    const phone = normPhone(rawPhone);
    if (!phone) return toast('Namba ya simu si sahihi', 'e');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'e');
    if (pin !== pin2) return toast('PIN hazilingani', 'e');

    const checkedCats = [...document.querySelectorAll('#cat-grid input:checked')].map(i=>i.value);

    S.pendingData = {
      role: 'distributor',
      store_name: name, phone, pin,
      region: $('dreg-region').value,
      district: $('dreg-district').value,
      ward: $('dreg-ward').value,
      street: $('dreg-street').value,
      coverage_area: $('dreg-coverage').value,
      min_delivery_amount: parseFloat($('dreg-mindel').value||'0'),
      categories: checkedCats.join(','),
    };
    S.pendingPhone = phone;

    setBusy('dreg-btn', true);
    const r = await callOTP({ action:'send_otp', phone });
    setBusy('dreg-btn', false, 'Endelea — Tuma OTP');

    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast('OTP imetumwa! ✅', 's');
    setText('otp-phone', phone);
    App.clearOTPBoxes('ob');
    App.startResendTimer();
    goStep(5);
  },

  // ── Registration OTP boxes ─────────────────────────────
  oi(i, el) {
    el.value = el.value.replace(/\D/g,'').slice(-1);
    el.classList.toggle('on', !!el.value);
    if (el.value && i < 5) $(`ob${i+1}`)?.focus();
    if (i===5 && el.value) App.verifyRegOTP();
  },
  ok(i, e) {
    if (e.key==='Backspace' && !$(`ob${i}`).value && i>0) $(`ob${i-1}`)?.focus();
  },
  clearOTPBoxes(prefix, count=6) {
    for (let i=0;i<count;i++) {
      const el=$(prefix+i); if(el){el.value='';el.classList.remove('on','err');}
    }
  },
  getOTPVal(prefix, count=6) {
    return Array.from({length:count},(_,i)=>$(`${prefix}${i}`)?.value||'').join('');
  },

  startResendTimer() {
    clearInterval(S.resendTimer);
    let sec = 60;
    const timer = $('rtimer'), btn = $('rbtn');
    timer.style.display=''; btn.style.display='none';
    timer.textContent = S.lang==='sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
    S.resendTimer = setInterval(()=>{
      sec--;
      if(sec<=0){clearInterval(S.resendTimer);timer.style.display='none';btn.style.display='';}
      else timer.textContent = S.lang==='sw'?`Tuma tena baada ya ${sec}s`:`Resend in ${sec}s`;
    },1000);
  },

  async resendRegOTP() {
    if (!S.pendingPhone) return;
    const r = await callOTP({ action:'send_otp', phone: S.pendingPhone });
    if (r.success) { toast('OTP imetumwa tena','s'); App.startResendTimer(); }
    else toast(r.message||'Hitilafu','e');
  },

  async verifyRegOTP() {
    const code = App.getOTPVal('ob');
    if (code.length !== 6) return toast('Weka nambari 6 kamili','e');
    setBusy('vbtn', true);
    const r = await callOTP({ action:'verify_otp', phone: S.pendingPhone, otp_code: code });
    if (!r.success) {
      setBusy('vbtn', false, 'Thibitisha');
      for(let i=0;i<6;i++) $(`ob${i}`)?.classList.add('err');
      return toast(r.message||'Nambari si sahihi','e');
    }
    // OTP OK — create account
    const reg = await callOTP({ action:'complete_registration', phone: S.pendingPhone, ...S.pendingData });
    setBusy('vbtn', false, 'Thibitisha');
    if (!reg.success) return toast(reg.message||'Tatizo la kuunda akaunti','e');
    toast('Akaunti imefunguliwa! 🎉','s');
    S.user = reg.user;
    saveSession();
    App.showApp();
  },

  goBack5() {
    goStep(S.role==='retailer' ? 3 : 4);
  },

  // ── Login ────────────────────────────────────────────────
  async sendLoginOTP() {
    const raw = $('lphone').value.trim();
    const phone = normPhone(raw);
    if (!phone) return toast('Namba ya simu si sahihi','e');
    S.pendingPhone = phone;
    setBusy('lotp-txt', false);
    const r = await callOTP({ action:'send_otp', phone });
    if (!r.success) return toast(r.message||'Hitilafu','e');
    toast('OTP imetumwa! ✅','s');
    setText('lotp-phone', phone);
    App.clearOTPBoxes('lb');
    App.startLoginResendTimer();
    goStep(9);
  },

  loi(i,el) {
    el.value=el.value.replace(/\D/g,'').slice(-1);
    el.classList.toggle('on',!!el.value);
    if(el.value&&i<5)$(`lb${i+1}`)?.focus();
    if(i===5&&el.value)App.verifyLoginOTP();
  },
  lok(i,e) { if(e.key==='Backspace'&&!$(`lb${i}`).value&&i>0)$(`lb${i-1}`)?.focus(); },

  startLoginResendTimer() {
    clearInterval(S.loginResendTimer);
    let sec=60; const timer=$('lrtimer'),btn=$('lrbtn');
    timer.style.display='';btn.style.display='none';
    timer.textContent=S.lang==='sw'?`Tuma tena baada ya ${sec}s`:`Resend in ${sec}s`;
    S.loginResendTimer=setInterval(()=>{
      sec--;
      if(sec<=0){clearInterval(S.loginResendTimer);timer.style.display='none';btn.style.display='';}
      else timer.textContent=S.lang==='sw'?`Tuma tena baada ya ${sec}s`:`Resend in ${sec}s`;
    },1000);
  },
  async resendLoginOTP() {
    if(!S.pendingPhone)return;
    const r=await callOTP({action:'send_otp',phone:S.pendingPhone});
    if(r.success){toast('OTP imetumwa tena','s');App.startLoginResendTimer();}
    else toast(r.message||'Hitilafu','e');
  },

  async verifyLoginOTP() {
    const code=App.getOTPVal('lb');
    if(code.length!==6)return toast('Weka nambari 6 kamili','e');
    setBusy('lvbtn',true);
    const r=await callOTP({action:'verify_otp',phone:S.pendingPhone,otp_code:code});
    setBusy('lvbtn',false,'Thibitisha');
    if(!r.success){
      for(let i=0;i<6;i++)$(`lb${i}`)?.classList.add('err');
      return toast(r.message||'Nambari si sahihi','e');
    }
    if(!r.user_exists)
      return toast(S.lang==='sw'?'Namba hii haijasajiliwa. Unda akaunti kwanza.':'Number not registered. Please create account.','e');
    S.user=r.user; saveSession();
    // Show PIN screen
    S.pinBuf=''; App.renderPinDots();
    setText('s7h', S.lang==='sw'?'Karibu!':'Welcome!');
    setText('s7sub', r.user.store_name||'');
    goStep(7);
  },

  // ── PIN keypad ──────────────────────────────────────────
  pk(digit) {
    if(S.pinBuf.length>=4)return;
    S.pinBuf+=digit; App.renderPinDots();
    if(S.pinBuf.length===4)setTimeout(()=>App.checkPin(),200);
  },
  pdel() { S.pinBuf=S.pinBuf.slice(0,-1); App.renderPinDots(); },
  renderPinDots() {
    for(let i=0;i<4;i++){
      const dot=$(`pd${i}`);
      if(dot){dot.classList.toggle('on',i<S.pinBuf.length);dot.classList.remove('err');}
    }
    setText('perr','');
  },
  checkPin() {
    if(S.pinBuf===String(S.user.pin)){
      S.user.last_login=new Date().toISOString();
      saveSession();
      App.showApp();
    } else {
      for(let i=0;i<4;i++) $(`pd${i}`)?.classList.add('err');
      setText('perr', S.lang==='sw'?'PIN si sahihi. Jaribu tena.':'Wrong PIN. Try again.');
      setTimeout(()=>{S.pinBuf='';App.renderPinDots();},900);
    }
  },

  // ── Forgot PIN ─────────────────────────────────────────
  forgotPin() { S.pinBuf=''; goStep(10); },

  async sendForgotOTP() {
    const raw=$('fphone').value.trim();
    const phone=normPhone(raw);
    if(!phone)return toast('Namba ya simu si sahihi','e');
    S.pendingPhone=phone;
    const r=await callOTP({action:'send_otp',phone});
    if(!r.success)return toast(r.message||'Hitilafu','e');
    toast('OTP imetumwa! ✅','s');
    setText('fotp-phone',phone);
    App.clearOTPBoxes('fb');
    goStep(11);
  },

  foi(i,el){
    el.value=el.value.replace(/\D/g,'').slice(-1);
    el.classList.toggle('on',!!el.value);
    if(el.value&&i<5)$(`fb${i+1}`)?.focus();
    if(i===5&&el.value)App.verifyForgotOTP();
  },
  fok(i,e){if(e.key==='Backspace'&&!$(`fb${i}`).value&&i>0)$(`fb${i-1}`)?.focus();},

  async verifyForgotOTP() {
    const code=App.getOTPVal('fb');
    if(code.length!==6)return toast('Weka nambari 6 kamili','e');
    setBusy('fvbtn',true);
    const r=await callOTP({action:'verify_otp',phone:S.pendingPhone,otp_code:code});
    setBusy('fvbtn',false,'Thibitisha');
    if(!r.success){for(let i=0;i<6;i++)$(`fb${i}`)?.classList.add('err');return toast(r.message||'Nambari si sahihi','e');}
    // Check user exists with this phone
    if(!r.user_exists)return toast(S.lang==='sw'?'Namba hii haijasajiliwa.':'Number not registered.','e');
    S.user=r.user; goStep(12);
  },

  async resetPin() {
    const pin=$('npin').value.trim(), pin2=$('npin2').value.trim();
    if(pin.length!==4||!/^\d{4}$/.test(pin))return toast('PIN lazima iwe tarakimu 4','e');
    if(pin!==pin2)return toast('PIN hazilingani','e');
    setBusy('rpintxt',false);
    const r=await callOTP({action:'reset_pin',phone:S.pendingPhone,pin});
    if(!r.success)return toast(r.message||'Hitilafu','e');
    toast(S.lang==='sw'?'PIN imebadilishwa! ✅':'PIN updated! ✅','s');
    S.user=r.user; saveSession();
    App.showApp();
  },

  // ── Show App ────────────────────────────────────────────
  showApp() {
    $('onboarding').style.display='none';
    $('app-main').style.display='block';
    App.renderApp();
    App.setupRealtime();
  },

  logout() {
    if(S.realtimeCh)sb.removeChannel(S.realtimeCh);
    S={user:null,lang:S.lang,role:null,pendingPhone:null,pendingData:null,
       pinBuf:'',cart:[],cartDist:null,page:'dashboard',notifs:[],
       resendTimer:null,loginResendTimer:null,forgotResendTimer:null,realtimeCh:null};
    clearSession();
    $('onboarding').style.display='flex';
    $('app-main').style.display='none';
    goStep(1);
  },

  // ══════════════════════════════════════════════════════════
  //  APP RENDERING
  // ══════════════════════════════════════════════════════════
  renderApp() {
    const u=S.user;
    // Sidebar user info
    const av=u.store_name?.[0]?.toUpperCase()||'U';
    setText('sbav',av); setText('sbn',u.store_name||'—');
    const badgeClass={retailer:'rb-ret',distributor:'rb-dist',admin:'rb-adm'}[u.role]||'rb-ret';
    const badgeTxt={retailer:'Duka',distributor:'Msambazaji',admin:'Admin'}[u.role]||u.role;
    const bb=$('sbb');
    if(bb){bb.className=`rbadge ${badgeClass}`;bb.textContent=badgeTxt;}

    // Nav items by role
    const navItems = App.getNavItems(u.role);
    const nav=$('sbnav');
    if(nav){
      nav.innerHTML=navItems.map(n=>`
        <button class="ni${S.page===n.page?' on':''}" onclick="App.navTo('${n.page}')">
          <span class="nic">${n.icon}</span>${n.label}
          ${n.badge?`<span class="nb">${n.badge}</span>`:''}
        </button>`).join('');
    }

    // Bottom nav (mobile)
    const mobileNav=navItems.slice(0,5);
    const bn=$('bn');
    if(bn){
      bn.innerHTML=mobileNav.map(n=>`
        <button class="bni${S.page===n.page?' on':''}" onclick="App.navTo('${n.page}')">
          ${n.icon}<span class="bni-lbl">${n.shortLabel||n.label}</span>
        </button>`).join('');
    }

    // Lang toggle
    $('lsw-sw')?.classList.toggle('on',S.lang==='sw');
    $('lsw-en')?.classList.toggle('on',S.lang==='en');

    // Render page
    App.renderPage(S.page);
  },

  getNavItems(role) {
    const l=S.lang;
    const base=[
      {page:'dashboard',icon:svgIcon('grid'),label:t('dashboard'),shortLabel:'Home'},
    ];
    if(role==='retailer') return [...base,
      {page:'marketplace',icon:svgIcon('store'),label:t('marketplace'),shortLabel:'Soko'},
      {page:'my-orders',icon:svgIcon('pkg'),label:t('myOrders'),shortLabel:'Maagizo'},
      {page:'pos',icon:svgIcon('pos'),label:t('pos'),shortLabel:'POS'},
      {page:'debts',icon:svgIcon('debt'),label:t('debts'),shortLabel:'Madeni'},
      {page:'reports',icon:svgIcon('chart'),label:t('reports'),shortLabel:'Ripoti'},
    ];
    if(role==='distributor') return [...base,
      {page:'products',icon:svgIcon('pkg'),label:t('products'),shortLabel:'Bidhaa'},
      {page:'orders',icon:svgIcon('orders'),label:t('orders'),shortLabel:'Maagizo'},
      {page:'invoices',icon:svgIcon('invoice'),label:t('invoices'),shortLabel:'Ankara'},
      {page:'reports',icon:svgIcon('chart'),label:t('reports'),shortLabel:'Ripoti'},
    ];
    if(role==='admin') return [...base,
      {page:'users',icon:svgIcon('users'),label:t('users'),shortLabel:'Watumiaji'},
      {page:'orders',icon:svgIcon('orders'),label:t('orders'),shortLabel:'Maagizo'},
      {page:'analytics',icon:svgIcon('analytics'),label:t('analytics'),shortLabel:'Data'},
    ];
    return base;
  },

  navTo(page) {
    S.page=page;
    App.renderApp();
    App.closeSidebar();
    window.scrollTo(0,0);
  },

  toggleSidebar() {
    $('sidebar')?.classList.toggle('open');
    $('sovl')?.classList.toggle('active');
  },
  closeSidebar() {
    $('sidebar')?.classList.remove('open');
    $('sovl')?.classList.remove('active');
  },

  toggleNotif() { $('ndd')?.classList.toggle('open'); },
  clearNotifs() { S.notifs=[]; App.renderNotifs(); },
  addNotif(txt) {
    S.notifs.unshift({txt,time:new Date().toLocaleTimeString()});
    App.renderNotifs();
    App.playSmsSound('new_order');
  },
  renderNotifs() {
    const list=$('nlist'), dot=$('ndot');
    const count=S.notifs.length;
    if(dot){dot.style.display=count?'flex':'none';dot.textContent=count>9?'9+':count;}
    if(!list)return;
    if(!count){list.innerHTML=`<div class="nde" id="ne-txt">${S.lang==='sw'?'Hakuna arifa':'No notifications'}</div>`;return;}
    list.innerHTML=S.notifs.slice(0,10).map(n=>`
      <div class="ndi unread">
        <div><div class="ndt">${n.txt}</div><div class="ndtime">${n.time}</div></div>
      </div>`).join('');
  },

  // ── Realtime ───────────────────────────────────────────
  setupRealtime() {
    if(S.realtimeCh)sb.removeChannel(S.realtimeCh);
    const u=S.user;
    S.realtimeCh=sb.channel('bw-realtime')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'orders'},payload=>{
        const o=payload.new;
        if(u.role==='distributor'&&o.distributor_id===u.id){
          App.addNotif(`${S.lang==='sw'?'Agizo jipya kutoka':'New order from'} ${o.order_ref}`);
          if(S.page==='orders')App.renderPage('orders');
        }
        if(u.role==='retailer'&&o.retailer_id===u.id){
          if(S.page==='my-orders')App.renderPage('my-orders');
        }
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders'},payload=>{
        const o=payload.new;
        if(u.role==='retailer'&&o.retailer_id===u.id){
          App.addNotif(`${S.lang==='sw'?'Hali ya agizo imebadilika:':'Order status changed:'} ${o.status}`);
          App.playSmsSound(o.status==='confirmed'?'confirmed':'delivered');
          if(S.page==='my-orders')App.renderPage('my-orders');
        }
      }).subscribe();
  },

  playSmsSound(type) {
    try {
      const ac=new (window.AudioContext||window.webkitAudioContext)();
      const patterns={
        new_order:[[800,.1,0],[600,.1,.15]],
        confirmed:[[500,.08,0],[700,.08,.12],[900,.1,.24]],
        delivered:[[400,.08,0],[600,.1,.12],[800,.12,.26],[1000,.1,.42]],
      };
      (patterns[type]||patterns.new_order).forEach(([freq,dur,delay])=>{
        const o=ac.createOscillator(),g=ac.createGain();
        o.connect(g);g.connect(ac.destination);
        o.frequency.value=freq;
        o.start(ac.currentTime+delay);o.stop(ac.currentTime+delay+dur);
        g.gain.setValueAtTime(.3,ac.currentTime+delay);
        g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+delay+dur);
      });
    } catch{}
  },

  // ══════════════════════════════════════════════════════════
  //  PAGE RENDERING
  // ══════════════════════════════════════════════════════════
  async renderPage(page) {
    const view=$('av');
    if(!view)return;
    view.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--s500)"><span class="spin d"></span></div>`;

    const tbic=$('tbic'), tbt=$('tbt'), tbs=$('tbs');
    const icons={dashboard:svgIcon('grid'),marketplace:svgIcon('store'),
      'my-orders':svgIcon('pkg'),orders:svgIcon('orders'),products:svgIcon('pkg'),
      pos:svgIcon('pos'),reports:svgIcon('chart'),debts:svgIcon('debt'),
      invoices:svgIcon('invoice'),users:svgIcon('users'),analytics:svgIcon('analytics')};
    if(tbic)tbic.innerHTML=icons[page]||svgIcon('grid');

    const pageLabels={dashboard:t('dashboard'),marketplace:t('marketplace'),
      'my-orders':t('myOrders'),orders:t('orders'),products:t('products'),
      pos:t('pos'),reports:t('reports'),debts:t('debts'),
      invoices:t('invoices'),users:t('users'),analytics:t('analytics')};
    setText('tbt', pageLabels[page]||page);
    setText('tbs', S.user?.store_name||'');

    const pages={
      dashboard:()=>App.pageDashboard(),
      marketplace:()=>App.pageMarketplace(),
      'my-orders':()=>App.pageMyOrders(),
      orders:()=>App.pageOrders(),
      products:()=>App.pageProducts(),
      pos:()=>App.pagePOS(),
      reports:()=>App.pageReports(),
      debts:()=>App.pageDebts(),
      invoices:()=>App.pageInvoices(),
      users:()=>App.pageUsers(),
      analytics:()=>App.pageAnalytics(),
    };
    await (pages[page]||pages.dashboard)();
  },

  // ── DASHBOARD ──────────────────────────────────────────
  async pageDashboard() {
    const u=S.user;
    const {data:orders}=await sb.from('orders')
      .select('*').or(`retailer_id.eq.${u.id},distributor_id.eq.${u.id}`)
      .order('created_at',{ascending:false}).limit(10);
    const {data:sales}=await sb.from('sales').select('revenue,profit,created_at')
      .eq('user_id',u.id).gte('sale_date',today());
    const todayRev=sales?.reduce((s,r)=>s+(r.revenue||0),0)||0;
    const todayProfit=sales?.reduce((s,r)=>s+(r.profit||0),0)||0;
    const pending=(orders||[]).filter(o=>o.status==='pending').length;
    const delivered=(orders||[]).filter(o=>o.status==='delivered').length;

    const view=$('av');
    view.innerHTML=`
      <div class="sr">
        <div class="sc g"><div class="sic">${svgIcon('revenue')}</div><div class="sl">${S.lang==='sw'?'Mauzo Leo':'Today Sales'}</div><div class="sv">${fmt(todayRev)}</div></div>
        <div class="sc g"><div class="sic">${svgIcon('profit')}</div><div class="sl">${t('profit')}</div><div class="sv">${fmt(todayProfit)}</div></div>
        <div class="sc a"><div class="sic">${svgIcon('pkg')}</div><div class="sl">${S.lang==='sw'?'Yanasubiri':'Pending'}</div><div class="sv">${pending}</div></div>
        <div class="sc b"><div class="sic">${svgIcon('orders')}</div><div class="sl">${S.lang==='sw'?'Zimetolewa':'Delivered'}</div><div class="sv">${delivered}</div></div>
      </div>
      <div class="card">
        <div class="cp">
          <div class="sh"><span class="st">${S.lang==='sw'?'Maagizo ya Hivi Karibuni':'Recent Orders'}</span>
            <button class="sa" onclick="App.navTo('${u.role==='retailer'?'my-orders':'orders'}')">${S.lang==='sw'?'Ona Yote →':'See All →'}</button>
          </div>
          <div class="tw"><table class="dt">
            <thead><tr>
              <th>REF</th><th>${S.lang==='sw'?'HALI':'STATUS'}</th>
              <th>${S.lang==='sw'?'JUMLA':'TOTAL'}</th><th>${S.lang==='sw'?'TAREHE':'DATE'}</th>
            </tr></thead>
            <tbody>${(orders||[]).slice(0,5).map(o=>`
              <tr>
                <td><span style="font-size:.75rem;font-weight:700;color:var(--g700)">${o.order_ref}</span></td>
                <td>${statusPill(o.status,S.lang)}</td>
                <td style="font-weight:700">${fmt(o.total_price)}</td>
                <td style="color:var(--s500);font-size:.75rem">${o.created_at?.slice(0,10)}</td>
              </tr>`).join('')||`<tr><td colspan="4"><div class="empty"><div class="empty-ic">📦</div><div class="empty-s">${t('noOrders')}</div></div></td></tr>`}
            </tbody>
          </table></div>
        </div>
      </div>`;
  },

  // ── MARKETPLACE (Retailer) ─────────────────────────────
  async pageMarketplace() {
    const u=S.user;
    // Load distributors — filtered by location first
    const {data:allDists}=await sb.from('profiles')
      .select('id,store_name,region,district,coverage_area,min_delivery_amount')
      .eq('role','distributor').eq('is_active',true);

    // Sort: same region first, then same district
    const sorted=(allDists||[]).sort((a,b)=>{
      const aScore=(a.region===u.region?2:0)+(a.district===u.district?1:0);
      const bScore=(b.region===u.region?2:0)+(b.district===u.district?1:0);
      return bScore-aScore;
    });

    const distOpts=sorted.map(d=>`<option value="${d.id}">${d.store_name} — ${d.district||d.region||''}${d.region===u.region?' ⭐':''}</option>`).join('');

    // Load products
    const distId=S.cartDist||(sorted[0]?.id||'');
    let products=[];
    if(distId){
      const {data:p}=await sb.from('products').select('*')
        .eq('distributor_id',distId).eq('is_active',true).order('category');
      products=p||[];
    }

    let activeCat='all';
    const cats=['all',...new Set(products.map(p=>p.category))];

    const renderProducts=(catFilter='all')=>{
      const filtered=catFilter==='all'?products:products.filter(p=>p.category===catFilter);
      const cartItem=(pid)=>S.cart.find(c=>c.product_id===pid);
      return filtered.map(p=>{
        const ci=cartItem(p.id); const inCart=!!ci;
        const stock=p.stock_qty>10?'ok':p.stock_qty>0?'low':'out';
        const stockTxt=stock==='ok'?'✅ Stok':stock==='low'?`⚠️ ${p.stock_qty} imebaki`:'❌ Hakuna';
        const stockClass=`sbadge s-${stock}`;
        return `<div class="pcard${inCart?' in':''}" id="pc-${p.id}">
          <span class="${stockClass}">${stockTxt}</span>
          <div class="ppla">${CAT_ICONS[p.category]||'📦'}</div>
          <div class="pcat">${p.category}</div>
          <div class="pname">${p.product_name}</div>
          <div class="punit">${p.selling_unit||''}</div>
          ${p.min_order_qty>1?`<div class="pmoq">Min: ${p.min_order_qty} ${p.selling_unit||'pc'}</div>`:''}
          <div class="pfoot">
            <span class="pprice">${fmt(p.price)}</span>
            ${stock==='out'?`<span style="font-size:.7rem;color:var(--red)">${S.lang==='sw'?'Haipo':'Out'}</span>`
            :inCart?`<div class="qc">
              <button class="qb" onclick="App.cartChange('${p.id}',-1)">−</button>
              <span class="qn">${ci.qty}</span>
              <button class="qb" onclick="App.cartChange('${p.id}',1)">+</button>
            </div>`
            :`<button class="adbtn" onclick="App.addToCart(${JSON.stringify(p).replace(/"/g,'&quot;')})">+</button>`}
          </div>
        </div>`;
      }).join('');
    };

    const sel=sorted.find(d=>d.id===distId);
    const minDel=sel?.min_delivery_amount||0;

    const view=$('av');
    view.innerHTML=`
      <div class="card" style="margin-bottom:1rem">
        <div class="cp">
          <div class="fg" style="margin-bottom:.75rem">
            <label class="fl">${S.lang==='sw'?'Chagua Msambazaji':'Select Distributor'}</label>
            <select class="fi" id="dist-sel" onchange="App.changeDist(this.value)">
              ${distOpts}
            </select>
          </div>
          ${minDel>0?`<div class="alert al-w" style="margin:0">
            <span>⚠️</span> ${S.lang==='sw'?'Kiwango cha chini cha agizo:':'Minimum order:'} <strong>${fmt(minDel)}</strong>
          </div>`:''}
        </div>
      </div>
      <div class="fps" id="cat-filter">
        ${cats.map(c=>`<button class="fp${c==='all'?' on':''}" onclick="App.filterCat('${c}',this)">${c==='all'?t('allCategories'):CAT_ICONS[c]+' '+(S.lang==='sw'?CATS.find(x=>x.id===c)?.sw||c:CATS.find(x=>x.id===c)?.en||c)}</button>`).join('')}
      </div>
      <div class="pgrid" id="pgrid">${renderProducts('all')}</div>`;

    // Set current dist selector
    if($('dist-sel')&&distId)$('dist-sel').value=distId;

    // Update cart FAB
    const fab=$('cfab');
    if(fab){fab.style.display=S.cart.length?'flex':'none';}
    App.renderCartPanel();
  },

  changeDist(id) {
    S.cartDist=id; S.cart=[]; App.pageMarketplace();
  },

  filterCat(cat,btn) {
    document.querySelectorAll('.fp').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    // Re-render products with filter
    App.pageMarketplace().then(()=>{
      setTimeout(()=>{
        document.querySelectorAll('.fp').forEach(b=>{
          if(b.textContent.trim().startsWith(cat==='all'?t('allCategories').slice(0,5):CAT_ICONS[cat]||cat))
            b.classList.add('on');
        });
      },100);
    });
  },

  addToCart(p) {
    if(p.stock_qty===0)return;
    if(!S.cartDist)S.cartDist=p.distributor_id;
    const existing=S.cart.find(c=>c.product_id===p.id);
    if(existing){existing.qty++;} else {
      S.cart.push({product_id:p.id,product_name:p.product_name,
        qty:p.min_order_qty||1,unit_price:p.price,
        min_order_qty:p.min_order_qty||1,selling_unit:p.selling_unit,distributor_id:p.distributor_id});
    }
    App.updateCartUI();
  },

  cartChange(productId, delta) {
    const item=S.cart.find(c=>c.product_id===productId);
    if(!item)return;
    item.qty=Math.max(0,item.qty+delta);
    if(item.qty===0)S.cart=S.cart.filter(c=>c.product_id!==productId);
    App.updateCartUI();
    App.pageMarketplace();
  },

  updateCartUI() {
    const count=S.cart.reduce((s,c)=>s+c.qty,0);
    const fab=$('cfab'),cc=$('cc');
    if(fab)fab.style.display=S.cart.length?'flex':'none';
    if(cc)cc.textContent=count;
    App.renderCartPanel();
  },

  renderCartPanel() {
    const list=$('cplist'),total=$('ct-val');
    if(!list)return;
    if(!S.cart.length){
      list.innerHTML=`<div class="empty"><div class="empty-ic">🛒</div><div class="empty-s">${t('cartEmpty')}</div></div>`;
      if(total)total.textContent='TZS 0'; return;
    }
    const sum=S.cart.reduce((s,c)=>s+c.qty*c.unit_price,0);
    list.innerHTML=S.cart.map(c=>{
      const moqWarn=c.qty<c.min_order_qty;
      const sub=c.qty*c.unit_price;
      return `<div class="cpi">
        <div class="cpi-em">${CAT_ICONS['other']||'📦'}</div>
        <div style="flex:1;min-width:0">
          <div class="cpi-name">${c.product_name}</div>
          <div class="cpi-price">${fmt(sub)}</div>
          ${moqWarn?`<div class="cpi-moq">⚠️ Min: ${c.min_order_qty}</div>`:''}
        </div>
        <div class="qc">
          <button class="qb" onclick="App.cartChange('${c.product_id}',-1)">−</button>
          <span class="qn">${c.qty}</span>
          <button class="qb" onclick="App.cartChange('${c.product_id}',1)">+</button>
        </div>
      </div>`;
    }).join('');
    if(total)total.textContent=fmt(sum);
  },

  toggleCart() {
    $('cpanel')?.classList.toggle('open');
  },

  async placeOrder() {
    if(!S.cart.length)return toast(t('cartEmpty'),'e');

    // MOQ check
    const moqFail=S.cart.filter(c=>c.qty<c.min_order_qty);
    if(moqFail.length){
      toast(`${S.lang==='sw'?'Kiwango cha chini hafikiwi:':'MOQ not met:'} ${moqFail.map(c=>c.product_name).join(', ')}`,'e');
      return;
    }

    const distId=S.cartDist||S.cart[0]?.distributor_id;
    const {data:dist}=await sb.from('profiles').select('min_delivery_amount').eq('id',distId).single();
    const total=S.cart.reduce((s,c)=>s+c.qty*c.unit_price,0);

    if(dist?.min_delivery_amount&&total<dist.min_delivery_amount){
      toast(`${S.lang==='sw'?'Agizo lako ni ndogo. Kiwango cha chini:':'Order below minimum:' } ${fmt(dist.min_delivery_amount)}`,'e');
      return;
    }

    setBusy('po-btn',true);
    const ref=genRef('ORD');
    const {data:order,error}=await sb.from('orders').insert([{
      order_ref:ref, retailer_id:S.user.id, distributor_id:distId,
      total_price:total, items_count:S.cart.length, status:'pending',
    }]).select().single();

    if(error||!order){setBusy('po-btn',false,t('placeOrder'));return toast('Hitilafu ya kutuma agizo','e');}

    await sb.from('order_items').insert(S.cart.map(c=>({
      order_id:order.id, product_id:c.product_id,
      product_name:c.product_name, qty:c.qty,
      unit_price:c.unit_price, subtotal:c.qty*c.unit_price,
    })));

    setBusy('po-btn',false,t('placeOrder'));
    S.cart=[]; S.cartDist=null;
    $('cpanel')?.classList.remove('open');
    App.updateCartUI();
    toast(`${t('orderSuccess')} ${ref}`,'s');
    App.navTo('my-orders');
  },

  // ── MY ORDERS (Retailer) ──────────────────────────────
  async pageMyOrders() {
    const {data:orders}=await sb.from('orders')
      .select('*').eq('retailer_id',S.user.id)
      .order('created_at',{ascending:false});

    const view=$('av');
    view.innerHTML=`
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('myOrders')}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr>
            <th>REF</th><th>${S.lang==='sw'?'HALI':'STATUS'}</th>
            <th>${S.lang==='sw'?'BIDHAA':'ITEMS'}</th><th>${S.lang==='sw'?'JUMLA':'TOTAL'}</th>
            <th>${S.lang==='sw'?'TAREHE':'DATE'}</th><th>${S.lang==='sw'?'VITENDO':'ACTIONS'}</th>
          </tr></thead>
          <tbody>${(orders||[]).map(o=>`
            <tr>
              <td><strong style="color:var(--g700)">${o.order_ref}</strong></td>
              <td>${statusPill(o.status,S.lang)}</td>
              <td>${o.items_count}</td>
              <td><strong>${fmt(o.total_price)}</strong></td>
              <td style="color:var(--s500);font-size:.75rem">${o.created_at?.slice(0,10)}</td>
              <td>
                ${o.status==='delivered'?`<button class="bsm b" onclick="App.showInvoice('${o.id}')">${svgIcon('invoice')} ${t('invoices')}</button>`:''}
              </td>
            </tr>`).join('')||`<tr><td colspan="6"><div class="empty"><div class="empty-ic">📦</div><div class="empty-s">${t('noOrders')}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  // ── ORDERS (Distributor) ──────────────────────────────
  async pageOrders() {
    const {data:orders}=await sb.from('orders')
      .select('*').eq('distributor_id',S.user.id)
      .order('created_at',{ascending:false});

    const view=$('av');
    view.innerHTML=`
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('orders')}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr>
            <th>REF</th><th>${S.lang==='sw'?'HALI':'STATUS'}</th>
            <th>${S.lang==='sw'?'JUMLA':'TOTAL'}</th><th>${S.lang==='sw'?'TAREHE':'DATE'}</th>
            <th>${S.lang==='sw'?'VITENDO':'ACTIONS'}</th>
          </tr></thead>
          <tbody>${(orders||[]).map(o=>`
            <tr>
              <td><strong style="color:var(--g700)">${o.order_ref}</strong></td>
              <td>${statusPill(o.status,S.lang)}</td>
              <td><strong>${fmt(o.total_price)}</strong></td>
              <td style="color:var(--s500);font-size:.75rem">${o.created_at?.slice(0,10)}</td>
              <td style="display:flex;gap:.3rem;flex-wrap:wrap">
                ${o.status==='pending'?`<button class="bsm b" onclick="App.updateOrderStatus('${o.id}','confirmed')">${S.lang==='sw'?'Thibitisha':'Confirm'}</button>`:''}
                ${o.status==='confirmed'?`<button class="bsm g" onclick="App.updateOrderStatus('${o.id}','delivered')">${S.lang==='sw'?'Toa':'Deliver'}</button>`:''}
                ${o.status==='delivered'?`<button class="bsm g" onclick="App.showReceipt('${o.id}')">${svgIcon('receipt')} ${t('printReceipt')}</button>`:''}
                ${o.status!=='cancelled'&&o.status!=='delivered'?`<button class="bsm r" onclick="App.updateOrderStatus('${o.id}','cancelled')">${S.lang==='sw'?'Futa':'Cancel'}</button>`:''}
              </td>
            </tr>`).join('')||`<tr><td colspan="5"><div class="empty"><div class="empty-ic">📦</div><div class="empty-s">${t('noOrders')}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  async updateOrderStatus(orderId, status) {
    const {error}=await sb.from('orders').update({status}).eq('id',orderId);
    if(error)return toast('Hitilafu ya kubadilisha hali','e');
    toast(S.lang==='sw'?`Hali imebadilishwa: ${status}`:`Status updated: ${status}`,'s');
    // Auto-create receipt on delivery
    if(status==='delivered'){
      const {data:o}=await sb.from('orders').select('*').eq('id',orderId).single();
      if(o){
        const ref=genRef('RCP');
        await sb.from('receipts').insert([{
          receipt_ref:ref, order_id:orderId,
          distributor_id:o.distributor_id, retailer_id:o.retailer_id,
          amount:o.total_price, payment_method:'cash',
        }]);
        const invRef=genRef('INV');
        await sb.from('invoices').insert([{
          invoice_ref:invRef, order_id:orderId,
          distributor_id:o.distributor_id, retailer_id:o.retailer_id,
          amount:o.total_price, status:'unpaid',
          due_date:new Date(Date.now()+7*864e5).toISOString().slice(0,10),
        }]);
      }
    }
    App.pageOrders();
  },

  // ── RECEIPT (PDF only) ────────────────────────────────
  async showReceipt(orderId) {
    const {data:order}=await sb.from('orders').select('*').eq('id',orderId).single();
    const {data:items}=await sb.from('order_items').select('*').eq('order_id',orderId);
    const {data:retailer}=await sb.from('profiles').select('store_name,phone_number,district').eq('id',order.retailer_id).single();
    const {data:dist}=await sb.from('profiles').select('store_name,phone_number').eq('id',order.distributor_id).single();
    const {data:receipt}=await sb.from('receipts').select('receipt_ref,issued_at').eq('order_id',orderId).maybeSingle();

    const view=$('av');
    view.innerHTML=`
      <div class="no-print" style="display:flex;gap:.65rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="share-btn pdf" onclick="window.print()">
          ${svgIcon('print')} ${t('printReceipt')}
        </button>
      </div>
      <div class="receipt" id="print-area">
        <div class="receipt-logo">
          <img src="logo.jpg" onerror="this.style.display='none'"/>
          <div>
            <div class="receipt-logo-name">BomaWave</div>
            <div style="font-size:.65rem;color:var(--s500)">FMCG Platform · Tanzania</div>
          </div>
        </div>
        <div class="receipt-title">${S.lang==='sw'?'RISITI YA MALIPO':'PAYMENT RECEIPT'}</div>
        <div class="receipt-ref">Ref: ${receipt?.receipt_ref||order.order_ref} · ${receipt?.issued_at?.slice(0,10)||today()}</div>
        <div class="receipt-parties">
          <div><div class="rp-lbl">${S.lang==='sw'?'MUUZAJI':'SELLER'}</div>
            <div class="rp-name">${dist?.store_name||'—'}</div>
            <div class="rp-info">${dist?.phone_number||''}</div>
          </div>
          <div><div class="rp-lbl">${S.lang==='sw'?'MNUNUZI':'BUYER'}</div>
            <div class="rp-name">${retailer?.store_name||'—'}</div>
            <div class="rp-info">${retailer?.phone_number||''} · ${retailer?.district||''}</div>
          </div>
        </div>
        <div>${(items||[]).map(i=>`
          <div class="ri">
            <div><div class="ri-name">${i.product_name}</div><div class="ri-qty">Qty: ${i.qty}</div></div>
            <div class="ri-price">${fmt(i.subtotal)}</div>
          </div>`).join('')}
        </div>
        <div class="rtotal">
          <span class="rtl">${S.lang==='sw'?'JUMLA YA MALIPO':'TOTAL PAID'}</span>
          <span class="rtv">${fmt(order.total_price)}</span>
        </div>
        <div class="rfoot">
          ${S.lang==='sw'?'Asante kwa biashara yako! · BomaWave FMCG Platform':'Thank you for your business! · BomaWave FMCG Platform'}
        </div>
      </div>`;
  },

  // ── INVOICES (PDF + WhatsApp + SMS) ──────────────────
  async showInvoice(orderId) {
    const {data:order}=await sb.from('orders').select('*').eq('id',orderId).single();
    const {data:items}=await sb.from('order_items').select('*').eq('order_id',orderId);
    const {data:retailer}=await sb.from('profiles').select('store_name,phone_number,district').eq('id',order.retailer_id).single();
    const {data:dist}=await sb.from('profiles').select('store_name,phone_number').eq('id',order.distributor_id).single();
    const {data:invoice}=await sb.from('invoices').select('*').eq('order_id',orderId).maybeSingle();
    const inv=invoice||{invoice_ref:genRef('INV'),issued_at:new Date().toISOString(),due_date:'',status:'unpaid'};

    // Build share text
    const shareText=encodeURIComponent(
      `*ANKARA YA BOMAWAVE*\n` +
      `Ref: ${inv.invoice_ref}\n` +
      `Tarehe: ${inv.issued_at?.slice(0,10)}\n\n` +
      `Muuzaji: ${dist?.store_name}\n` +
      `Mnunuzi: ${retailer?.store_name}\n\n` +
      `BIDHAA:\n` +
      (items||[]).map(i=>`- ${i.product_name} x${i.qty}: ${fmt(i.subtotal)}`).join('\n') +
      `\n\nJUMLA: ${fmt(order.total_price)}\n` +
      `Hali: ${inv.status==='paid'?'✅ Imelipwa':'⏳ Haijalipwa'}\n\n` +
      `BomaWave FMCG · Tanzania`
    );
    const waUrl=`https://wa.me/?text=${shareText}`;
    const smsUrl=`sms:?body=${shareText}`;

    const view=$('av');
    view.innerHTML=`
      <div class="no-print share-btns" style="margin-bottom:1rem">
        <button class="share-btn pdf" onclick="window.print()">${svgIcon('print')} ${t('printPDF')}</button>
        <button class="share-btn wa" onclick="window.open('${waUrl}','_blank')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button class="share-btn sms" onclick="window.open('${smsUrl}','_blank')">${svgIcon('sms')} SMS</button>
      </div>
      <div class="receipt" id="print-area">
        <div class="receipt-logo">
          <img src="logo.jpg" onerror="this.style.display='none'"/>
          <div>
            <div class="receipt-logo-name">BomaWave</div>
            <div style="font-size:.65rem;color:var(--s500)">FMCG Platform · Tanzania</div>
          </div>
        </div>
        <div class="receipt-title">${S.lang==='sw'?'ANKARA YA BIASHARA':'COMMERCIAL INVOICE'}</div>
        <div class="receipt-ref">Ref: ${inv.invoice_ref} · ${inv.issued_at?.slice(0,10)||today()}</div>
        <div class="receipt-parties">
          <div><div class="rp-lbl">${S.lang==='sw'?'MUUZAJI':'SELLER'}</div>
            <div class="rp-name">${dist?.store_name||'—'}</div>
            <div class="rp-info">${dist?.phone_number||''}</div>
          </div>
          <div><div class="rp-lbl">${S.lang==='sw'?'MNUNUZI':'BUYER'}</div>
            <div class="rp-name">${retailer?.store_name||'—'}</div>
            <div class="rp-info">${retailer?.phone_number||''}</div>
          </div>
        </div>
        <div>${(items||[]).map(i=>`
          <div class="ri">
            <div><div class="ri-name">${i.product_name}</div><div class="ri-qty">× ${i.qty} @ ${fmt(i.unit_price)}</div></div>
            <div class="ri-price">${fmt(i.subtotal)}</div>
          </div>`).join('')}
        </div>
        <div class="rtotal">
          <span class="rtl">${S.lang==='sw'?'JUMLA':'TOTAL'}</span>
          <span class="rtv">${fmt(order.total_price)}</span>
        </div>
        <div style="margin-top:.75rem;padding:.65rem;background:var(--s100);border-radius:.5rem;font-size:.75rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:.3rem">
            <span style="color:var(--s500)">${S.lang==='sw'?'Hali ya Malipo':'Payment Status'}</span>
            <strong>${inv.status==='paid'?'✅ Imelipwa':'⏳ Haijalipwa'}</strong>
          </div>
          ${inv.due_date?`<div style="display:flex;justify-content:space-between">
            <span style="color:var(--s500)">${S.lang==='sw'?'Tarehe ya Mwisho':'Due Date'}</span>
            <strong>${inv.due_date}</strong>
          </div>`:''}
        </div>
        <div class="rfoot">
          ${S.lang==='sw'?'Malipo yalipwe kabla ya tarehe iliyoonyeshwa. · BomaWave FMCG · Tanzania':'Payment due by date shown. · BomaWave FMCG · Tanzania'}
        </div>
      </div>`;
  },

  async pageInvoices() {
    const {data:invoices}=await sb.from('invoices')
      .select('*').eq('distributor_id',S.user.id)
      .order('issued_at',{ascending:false});
    const view=$('av');
    view.innerHTML=`
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('invoices')}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr>
            <th>REF</th><th>${S.lang==='sw'?'HALI':'STATUS'}</th>
            <th>${S.lang==='sw'?'KIASI':'AMOUNT'}</th><th>${S.lang==='sw'?'TAREHE':'DATE'}</th>
            <th>${S.lang==='sw'?'VITENDO':'ACTIONS'}</th>
          </tr></thead>
          <tbody>${(invoices||[]).map(inv=>`
            <tr>
              <td><strong style="color:var(--g700)">${inv.invoice_ref}</strong></td>
              <td><span class="pill ${inv.status==='paid'?'p-paid':'p-unp'}">${inv.status==='paid'?'Imelipwa':'Haijalipwa'}</span></td>
              <td><strong>${fmt(inv.amount)}</strong></td>
              <td style="color:var(--s500);font-size:.75rem">${inv.issued_at?.slice(0,10)}</td>
              <td style="display:flex;gap:.3rem;flex-wrap:wrap">
                ${inv.order_id?`<button class="bsm b" onclick="App.showInvoice('${inv.order_id}')">${t('shareInvoice')}</button>`:''}
                ${inv.status==='unpaid'?`<button class="bsm g" onclick="App.markInvPaid('${inv.id}')">${S.lang==='sw'?'Malipo Yamefika':'Mark Paid'}</button>`:''}
              </td>
            </tr>`).join('')||`<tr><td colspan="5"><div class="empty"><div class="empty-ic">📄</div><div class="empty-s">${S.lang==='sw'?'Hakuna ankara':'No invoices'}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  async markInvPaid(id){
    await sb.from('invoices').update({status:'paid'}).eq('id',id);
    toast(S.lang==='sw'?'Malipo yamekubaliwa':'Payment recorded','s');
    App.pageInvoices();
  },

  // ── PRODUCTS (Distributor) ─────────────────────────────
  async pageProducts() {
    const {data:products}=await sb.from('products')
      .select('*').eq('distributor_id',S.user.id).order('created_at',{ascending:false});

    const view=$('av');
    view.innerHTML=`
      <div class="card" style="margin-bottom:1rem">
        <div class="cp">
          <div class="sh"><span class="st">${S.lang==='sw'?'Ongeza Bidhaa Mpya':'Add New Product'}</span></div>
          <div class="pform">
            <div class="fr" style="margin-bottom:.75rem">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Jina':'Name'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="pn" placeholder="${S.lang==='sw'?'Jina la bidhaa':'Product name'}"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Aina':'Category'}</label>
                <select class="fi" id="pc">
                  ${CATS.map(c=>`<option value="${c.id}">${CAT_ICONS[c.id]} ${S.lang==='sw'?c.sw:c.en}</option>`).join('')}
                </select></div>
            </div>
            <div class="fr3" style="margin-bottom:.75rem">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Bei ya Kuuza':'Sell Price'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="pp" type="number" min="0" placeholder="0"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Bei ya Kununua':'Cost Price'}</label>
                <input class="fi" id="pcp" type="number" min="0" placeholder="0"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Stok':'Stock'}</label>
                <input class="fi" id="pq" type="number" min="0" placeholder="0"/></div>
            </div>
            <div class="fr" style="margin-bottom:.75rem">
              <div class="fg"><label class="fl">MOQ <span style="font-size:.65rem;color:var(--s500)">(min order)</span></label>
                <input class="fi" id="pmoq" type="number" min="1" value="1" placeholder="1"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Kipimo':'Unit'}</label>
                <input class="fi" id="pu" placeholder="${S.lang==='sw'?'mfano: Krate (24)':'e.g. Crate (24)'}"/></div>
            </div>
            <button class="btn btn-p" onclick="App.addProduct()"  style="max-width:240px">
              <span id="add-p-txt">+ ${t('addProduct')}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${S.lang==='sw'?'Bidhaa Zangu':'My Products'}</span></div>
        <div class="tw"><table class="dt">
          <thead><tr>
            <th>${S.lang==='sw'?'JINA':'NAME'}</th><th>${S.lang==='sw'?'AINA':'CATEGORY'}</th>
            <th>${S.lang==='sw'?'BEI':'PRICE'}</th><th>MOQ</th>
            <th>${S.lang==='sw'?'STOK':'STOCK'}</th><th>${S.lang==='sw'?'VITENDO':'ACTIONS'}</th>
          </tr></thead>
          <tbody>${(products||[]).map(p=>`
            <tr>
              <td><strong>${p.product_name}</strong></td>
              <td>${CAT_ICONS[p.category]||''} ${p.category}</td>
              <td><strong style="color:var(--g700)">${fmt(p.price)}</strong></td>
              <td style="color:var(--amber);font-weight:700">${p.min_order_qty}</td>
              <td>
                <div class="sedit">
                  <input type="number" id="sq-${p.id}" value="${p.stock_qty}" min="0" style="width:60px"/>
                  <button class="bsm g" onclick="App.updateStock('${p.id}')">${S.lang==='sw'?'Hifadhi':'Save'}</button>
                </div>
              </td>
              <td>
                <button class="bsm r" onclick="App.deleteProduct('${p.id}')">${S.lang==='sw'?'Futa':'Delete'}</button>
              </td>
            </tr>`).join('')||`<tr><td colspan="6"><div class="empty"><div class="empty-ic">📦</div><div class="empty-s">${t('noProducts')}</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div></div>`;
  },

  async addProduct() {
    const name=$('pn').value.trim(),cat=$('pc').value,
      price=parseFloat($('pp').value||'0'),cost=parseFloat($('pcp').value||'0'),
      qty=parseInt($('pq').value||'0'),moq=parseInt($('pmoq').value||'1'),unit=$('pu').value.trim();
    if(!name||!price)return toast(S.lang==='sw'?'Jaza jina na bei':'Fill name and price','e');
    setBusy('add-p-txt',true);
    const {error}=await sb.from('products').insert([{
      distributor_id:S.user.id, product_name:name, category:cat,
      price, cost_price:cost, stock_qty:qty, min_order_qty:moq, selling_unit:unit,
    }]);
    setBusy('add-p-txt',false,`+ ${t('addProduct')}`);
    if(error)return toast('Hitilafu ya kuongeza bidhaa','e');
    toast(S.lang==='sw'?'Bidhaa imeongezwa! ✅':'Product added! ✅','s');
    App.pageProducts();
  },

  async updateStock(id) {
    const qty=parseInt($(`sq-${id}`)?.value||'0');
    await sb.from('products').update({stock_qty:qty}).eq('id',id);
    toast(S.lang==='sw'?'Stok imehifadhiwa':'Stock updated','s');
  },

  async deleteProduct(id) {
    if(!confirm(S.lang==='sw'?'Una uhakika wa kufuta bidhaa hii?':'Delete this product?'))return;
    await sb.from('products').delete().eq('id',id);
    toast(S.lang==='sw'?'Bidhaa imefutwa':'Product deleted','s');
    App.pageProducts();
  },

  // ── POS ───────────────────────────────────────────────
  async pagePOS() {
    const {data:sales}=await sb.from('sales').select('*').eq('user_id',S.user.id)
      .gte('sale_date',today()).order('created_at',{ascending:false});
    const {data:expenses}=await sb.from('expenses').select('*').eq('user_id',S.user.id)
      .gte('expense_date',today()).order('created_at',{ascending:false});

    const view=$('av');
    view.innerHTML=`
      <div class="ptabs" id="pos-tabs">
        <button class="ptab on" onclick="App.posTab('sales',this)">
          ${svgIcon('pos')} ${S.lang==='sw'?'Mauzo':'Sales'}
        </button>
        <button class="ptab" onclick="App.posTab('expenses',this)">
          ${svgIcon('expense')} ${S.lang==='sw'?'Matumizi':'Expenses'}
        </button>
      </div>

      <div id="pos-sales">
        <div class="pform">
          <div class="pftitle">${S.lang==='sw'?'Rekodi Mauzo':'Record Sale'}</div>
          <div style="display:flex;flex-direction:column;gap:.75rem">
            <div class="fr">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Jina la Bidhaa':'Product Name'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="s-prod" placeholder="${S.lang==='sw'?'Jina la bidhaa':'Product name'}"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Aina':'Category'}</label>
                <select class="fi" id="s-cat">
                  ${CATS.map(c=>`<option value="${c.id}">${CAT_ICONS[c.id]} ${S.lang==='sw'?c.sw:c.en}</option>`).join('')}
                </select></div>
            </div>
            <div class="fr3">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Idadi':'Qty'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="s-qty" type="number" min="1" value="1"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Bei ya Kununua':'Buying Price'}</label>
                <input class="fi" id="s-buy" type="number" min="0" placeholder="0"/></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Bei ya Kuuza':'Selling Price'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="s-sell" type="number" min="0" placeholder="0"/></div>
            </div>
            <button class="btn btn-p" onclick="App.recordSale()" style="max-width:200px">
              <span id="rec-sale-txt">${S.lang==='sw'?'Rekodi Mauzo':'Record Sale'}</span>
            </button>
          </div>
        </div>
        <div class="card"><div class="cp">
          <div class="sh"><span class="st">${S.lang==='sw'?'Mauzo ya Leo':'Today Sales'}</span></div>
          <div class="tw"><table class="dt">
            <thead><tr>
              <th>${S.lang==='sw'?'BIDHAA':'PRODUCT'}</th><th>${S.lang==='sw'?'IDADI':'QTY'}</th>
              <th>${S.lang==='sw'?'MAPATO':'REVENUE'}</th><th>${S.lang==='sw'?'FAIDA':'PROFIT'}</th>
              <th>${S.lang==='sw'?'TAREHE':'TIME'}</th>
            </tr></thead>
            <tbody>${(sales||[]).map(s=>`
              <tr>
                <td><strong>${s.product_name}</strong></td>
                <td style="font-size:.95rem;font-weight:800">${s.qty}</td>
                <td style="color:var(--g700);font-weight:800;font-size:.95rem">${fmt(s.revenue)}</td>
                <td style="color:var(--g600);font-weight:700">${fmt(s.profit)}</td>
                <td style="color:var(--s500);font-size:.75rem">${s.created_at?.slice(11,16)||'—'}</td>
              </tr>`).join('')||`<tr><td colspan="5"><div class="empty"><div class="empty-ic">💰</div><div class="empty-s">${S.lang==='sw'?'Hakuna mauzo leo':'No sales today'}</div></div></td></tr>`}
            </tbody>
          </table></div>
        </div></div>
      </div>

      <div id="pos-expenses" style="display:none">
        <div class="pform">
          <div class="pftitle">${S.lang==='sw'?'Rekodi Matumizi':'Record Expense'}</div>
          <div style="display:flex;flex-direction:column;gap:.75rem">
            <div class="fr">
              <div class="fg"><label class="fl">${S.lang==='sw'?'Aina':'Category'}</label>
                <select class="fi" id="e-cat">
                  <option value="rent">${S.lang==='sw'?'Kodi':'Rent'}</option>
                  <option value="transport">${S.lang==='sw'?'Usafiri':'Transport'}</option>
                  <option value="salary">${S.lang==='sw'?'Mshahara':'Salary'}</option>
                  <option value="utilities">${S.lang==='sw'?'Umeme/Maji':'Utilities'}</option>
                  <option value="other">${S.lang==='sw'?'Nyingine':'Other'}</option>
                </select></div>
              <div class="fg"><label class="fl">${S.lang==='sw'?'Kiasi':'Amount'} <span style="color:var(--red)">*</span></label>
                <input class="fi" id="e-amt" type="number" min="0" placeholder="0"/></div>
            </div>
            <div class="fg"><label class="fl">${S.lang==='sw'?'Maelezo':'Description'} <span style="color:var(--red)">*</span></label>
              <input class="fi" id="e-desc" placeholder="${S.lang==='sw'?'Maelezo ya matumizi':'Expense description'}"/></div>
            <button class="btn btn-p" onclick="App.recordExpense()" style="max-width:200px">
              <span id="rec-exp-txt">${S.lang==='sw'?'Rekodi Matumizi':'Record Expense'}</span>
            </button>
          </div>
        </div>
        <div class="card"><div class="cp">
          <div class="sh"><span class="st">${S.lang==='sw'?'Matumizi ya Leo':'Today Expenses'}</span></div>
          <div class="tw"><table class="dt">
            <thead><tr>
              <th>${S.lang==='sw'?'AINA':'CATEGORY'}</th>
              <th>${S.lang==='sw'?'MAELEZO':'DESCRIPTION'}</th>
              <th>${S.lang==='sw'?'KIASI':'AMOUNT'}</th>
            </tr></thead>
            <tbody>${(expenses||[]).map(e=>`
              <tr>
                <td><span class="pill p-pen">${e.category}</span></td>
                <td>${e.description}</td>
                <td style="color:var(--red);font-weight:800">${fmt(e.amount)}</td>
              </tr>`).join('')||`<tr><td colspan="3"><div class="empty"><div class="empty-ic">💸</div><div class="empty-s">${S.lang==='sw'?'Hakuna matumizi leo':'No expenses today'}</div></div></td></tr>`}
            </tbody>
          </table></div>
        </div></div>
      </div>`;
  },

  posTab(tab, btn) {
    document.querySelectorAll('.ptab').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    $('pos-sales').style.display=tab==='sales'?'':'none';
    $('pos-expenses').style.display=tab==='expenses'?'':'none';
  },

  async recordSale() {
    const prod=$('s-prod').value.trim(), cat=$('s-cat').value,
      qty=parseInt($('s-qty').value||'1'),
      buy=parseFloat($('s-buy').value||'0'),
      sell=parseFloat($('s-sell').value||'0');
    if(!prod||!sell||qty<1)return toast(S.lang==='sw'?'Jaza jina na bei':'Fill product and price','e');
    setBusy('rec-sale-txt',true);
    const {error}=await sb.from('sales').insert([{
      user_id:S.user.id,product_name:prod,category:cat,
      qty,buying_price:buy,selling_price:sell,sale_date:today(),
    }]);
    setBusy('rec-sale-txt',false,S.lang==='sw'?'Rekodi Mauzo':'Record Sale');
    if(error)return toast('Hitilafu','e');
    toast(S.lang==='sw'?'Mauzo yamerekodiwa! ✅':'Sale recorded! ✅','s');
    App.pagePOS();
  },

  async recordExpense() {
    const cat=$('e-cat').value,desc=$('e-desc').value.trim(),amt=parseFloat($('e-amt').value||'0');
    if(!desc||!amt)return toast(S.lang==='sw'?'Jaza maelezo na kiasi':'Fill description and amount','e');
    setBusy('rec-exp-txt',true);
    const {error}=await sb.from('expenses').insert([{
      user_id:S.user.id,category:cat,description:desc,amount:amt,expense_date:today(),
    }]);
    setBusy('rec-exp-txt',false,S.lang==='sw'?'Rekodi Matumizi':'Record Expense');
    if(error)return toast('Hitilafu','e');
    toast(S.lang==='sw'?'Matumizi yamerekodiwa! ✅':'Expense recorded! ✅','s');
    App.pagePOS();
  },

  // ── REPORTS ───────────────────────────────────────────
  async pageReports() {
    let period='today', startDate=today();
    const render=async()=>{
      if(period==='today') startDate=today();
      else if(period==='week') startDate=new Date(Date.now()-7*864e5).toISOString().slice(0,10);
      else if(period==='month') startDate=new Date(Date.now()-30*864e5).toISOString().slice(0,10);
      const {data:sales}=await sb.from('sales').select('*').eq('user_id',S.user.id).gte('sale_date',startDate);
      const {data:exps}=await sb.from('expenses').select('*').eq('user_id',S.user.id).gte('expense_date',startDate);
      const rev=sales?.reduce((s,r)=>s+(r.revenue||0),0)||0;
      const profit=sales?.reduce((s,r)=>s+(r.profit||0),0)||0;
      const expTotal=exps?.reduce((s,e)=>s+(e.amount||0),0)||0;
      const netProfit=profit-expTotal;

      // Category breakdown
      const byCat={};
      (sales||[]).forEach(s=>{byCat[s.category]=(byCat[s.category]||0)+(s.revenue||0);});

      $('rep-body').innerHTML=`
        <div class="rsec">
          <div class="rsec-t">${S.lang==='sw'?'Muhtasari wa Fedha':'Financial Summary'}</div>
          <div class="rrow"><span class="rl">${S.lang==='sw'?'Jumla ya Mauzo':'Total Revenue'}</span><span class="rv g">${fmt(rev)}</span></div>
          <div class="rrow"><span class="rl">${S.lang==='sw'?'Faida Kabla ya Matumizi':'Gross Profit'}</span><span class="rv g">${fmt(profit)}</span></div>
          <div class="rrow"><span class="rl">${S.lang==='sw'?'Jumla ya Matumizi':'Total Expenses'}</span><span class="rv r">${fmt(expTotal)}</span></div>
          <div class="rrow div"><span class="rl">${S.lang==='sw'?'Faida Halisi':'Net Profit'}</span><span class="rv ${netProfit>=0?'g':'r'}">${fmt(netProfit)}</span></div>
        </div>
        <div class="rsec">
          <div class="rsec-t">${S.lang==='sw'?'Mauzo kwa Aina':'Sales by Category'}</div>
          ${Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>`
            <div class="rrow"><span class="rl">${CAT_ICONS[cat]||''} ${cat}</span><span class="rv">${fmt(val)}</span></div>`).join('')||`<div class="rrow"><span class="rl">${S.lang==='sw'?'Hakuna data':'No data'}</span></div>`}
        </div>`;
    };

    const view=$('av');
    view.innerHTML=`
      <div class="pertabs" id="ptabs">
        <button class="pertab on" onclick="App.repPeriod('today',this)">Leo</button>
        <button class="pertab" onclick="App.repPeriod('week',this)">${S.lang==='sw'?'Wiki 1':'1 Week'}</button>
        <button class="pertab" onclick="App.repPeriod('month',this)">${S.lang==='sw'?'Mwezi 1':'1 Month'}</button>
      </div>
      <div id="rep-body"><div style="text-align:center;padding:2rem;color:var(--s500)"><span class="spin d"></span></div></div>`;

    S._repPeriod='today';
    window._repRender=render;
    await render();
  },

  repPeriod(p,btn) {
    document.querySelectorAll('.pertab').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    S._repPeriod=p;
    if(window._repRender)window._repRender();
  },

  // ── DEBTS ─────────────────────────────────────────────
  async pageDebts() {
    const {data:debts}=await sb.from('debts').select('*').eq('user_id',S.user.id)
      .order('created_at',{ascending:false});

    const view=$('av');
    view.innerHTML=`
      <div class="card" style="margin-bottom:1rem"><div class="cp">
        <div class="pftitle">${S.lang==='sw'?'Rekodi Deni Jipya':'Record New Debt'}</div>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          <div class="fr">
            <div class="fg"><label class="fl">${S.lang==='sw'?'Jina la Mteja':'Customer Name'} <span style="color:var(--red)">*</span></label>
              <input class="fi" id="d-name" placeholder="${S.lang==='sw'?'Jina la mteja':'Customer name'}"/></div>
            <div class="fg"><label class="fl">${S.lang==='sw'?'Simu':'Phone'}</label>
              <input class="fi" id="d-phone" type="tel" placeholder="07xxxxxxxx"/></div>
          </div>
          <div class="fr">
            <div class="fg"><label class="fl">${S.lang==='sw'?'Kiasi':'Amount'} <span style="color:var(--red)">*</span></label>
              <input class="fi" id="d-amt" type="number" min="0" placeholder="0"/></div>
            <div class="fg"><label class="fl">${S.lang==='sw'?'Tarehe ya Kulipa':'Due Date'}</label>
              <input class="fi" id="d-due" type="date"/></div>
          </div>
          <div class="fg"><label class="fl">${S.lang==='sw'?'Maelezo':'Description'}</label>
            <input class="fi" id="d-desc" placeholder="${S.lang==='sw'?'mfano: Mkopo wa mchele':'e.g. Rice credit'}"/></div>
          <button class="btn btn-p" onclick="App.addDebt()" style="max-width:200px">
            <span id="add-debt-txt">${S.lang==='sw'?'Rekodi Deni':'Record Debt'}</span>
          </button>
        </div>
      </div></div>
      <div id="debts-list">
        ${(debts||[]).map(d=>{
          const paid=d.amount_paid||0;
          const remain=d.amount-paid;
          const pct=Math.min(100,Math.round(paid/d.amount*100));
          return `<div class="dcard">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.25rem">
              <div>
                <div style="font-weight:800">${d.customer_name}</div>
                <div style="font-size:.75rem;color:var(--s500)">${d.customer_phone||''}</div>
              </div>
              <span class="pill ${d.status==='paid'?'p-paid':d.status==='partial'?'p-par':'p-unp'}">${d.status}</span>
            </div>
            <div class="dprog"><div class="dprogf" style="width:${pct}%"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.5rem">
              <span style="color:var(--s500)">${S.lang==='sw'?'Kilicholipwa':'Paid'}: <strong style="color:var(--g700)">${fmt(paid)}</strong></span>
              <span style="color:var(--s500)">${S.lang==='sw'?'Kinachobaki':'Remaining'}: <strong style="color:var(--red)">${fmt(remain)}</strong></span>
            </div>
            ${d.status!=='paid'?`<div style="display:flex;gap:.4rem;flex-wrap:wrap">
              <input class="fi" id="dp-${d.id}" type="number" min="0" placeholder="${S.lang==='sw'?'Kiasi':'Amount'}" style="max-width:120px;padding:.4rem .6rem;font-size:.8rem"/>
              <button class="bsm g" onclick="App.payDebt('${d.id}',${d.amount_paid||0})">${S.lang==='sw'?'Rekodi Malipo':'Record Payment'}</button>
              <button class="bsm r" onclick="App.deleteDebt('${d.id}')">${S.lang==='sw'?'Futa':'Delete'}</button>
            </div>`:''}
          </div>`;
        }).join('')||`<div class="empty"><div class="empty-ic">💳</div><div class="empty-t">${S.lang==='sw'?'Hakuna madeni':'No debts'}</div></div>`}
      </div>`;
  },

  async addDebt() {
    const name=$('d-name').value.trim(),phone=$('d-phone').value,
      amt=parseFloat($('d-amt').value||'0'),due=$('d-due').value,desc=$('d-desc').value;
    if(!name||!amt)return toast(S.lang==='sw'?'Jaza jina na kiasi':'Fill name and amount','e');
    setBusy('add-debt-txt',true);
    const {error}=await sb.from('debts').insert([{
      user_id:S.user.id,customer_name:name,customer_phone:phone,
      amount:amt,due_date:due||null,description:desc,status:'unpaid',
    }]);
    setBusy('add-debt-txt',false,S.lang==='sw'?'Rekodi Deni':'Record Debt');
    if(error)return toast('Hitilafu','e');
    toast(S.lang==='sw'?'Deni limerekodiwa! ✅':'Debt recorded! ✅','s');
    App.pageDebts();
  },

  async payDebt(id,currentPaid) {
    const extra=parseFloat($(`dp-${id}`)?.value||'0');
    if(!extra)return toast(S.lang==='sw'?'Weka kiasi':'Enter amount','e');
    const {data:debt}=await sb.from('debts').select('amount,amount_paid').eq('id',id).single();
    const newPaid=(debt.amount_paid||0)+extra;
    const status=newPaid>=debt.amount?'paid':newPaid>0?'partial':'unpaid';
    await sb.from('debts').update({amount_paid:newPaid,status}).eq('id',id);
    toast(S.lang==='sw'?'Malipo yamerekodiwa! ✅':'Payment recorded! ✅','s');
    App.pageDebts();
  },

  async deleteDebt(id) {
    if(!confirm(S.lang==='sw'?'Futa deni hili?':'Delete this debt?'))return;
    await sb.from('debts').delete().eq('id',id);
    toast(S.lang==='sw'?'Deni limefutwa':'Debt deleted','s');
    App.pageDebts();
  },

  // ── USERS (Admin) ─────────────────────────────────────
  async pageUsers() {
    const {data:users}=await sb.from('profiles').select('*').order('created_at',{ascending:false});
    const view=$('av');
    view.innerHTML=`
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">${t('users')}</span>
          <span class="st" style="font-size:.75rem;color:var(--s500)">${(users||[]).length} ${S.lang==='sw'?'watumiaji':'users'}</span>
        </div>
        <div class="tw"><table class="dt">
          <thead><tr>
            <th>${S.lang==='sw'?'JINA':'NAME'}</th><th>${S.lang==='sw'?'SIMU':'PHONE'}</th>
            <th>${S.lang==='sw'?'AINA':'ROLE'}</th><th>${S.lang==='sw'?'MKOA':'REGION'}</th>
            <th>${S.lang==='sw'?'HALI':'STATUS'}</th>
          </tr></thead>
          <tbody>${(users||[]).map(u=>`
            <tr>
              <td><strong>${u.store_name}</strong></td>
              <td style="font-size:.8rem;color:var(--s700)">${u.phone_number}</td>
              <td>${statusBadge(u.role)}</td>
              <td style="font-size:.78rem">${u.district||u.region||'—'}</td>
              <td><span class="pill ${u.is_active?'p-del':'p-can'}">${u.is_active?'✅ Active':'❌ Blocked'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div></div>`;
  },

  // ── ANALYTICS (Admin) ─────────────────────────────────
  async pageAnalytics() {
    const {data:profiles}=await sb.from('profiles').select('role');
    const {data:orders}=await sb.from('orders').select('total_price,status');
    const retailers=(profiles||[]).filter(p=>p.role==='retailer').length;
    const distributors=(profiles||[]).filter(p=>p.role==='distributor').length;
    const totalOrders=(orders||[]).length;
    const totalValue=(orders||[]).reduce((s,o)=>s+(o.total_price||0),0);
    const delivered=(orders||[]).filter(o=>o.status==='delivered').length;

    const view=$('av');
    view.innerHTML=`
      <div class="sr">
        <div class="sc g"><div class="sic">${svgIcon('users')}</div><div class="sl">Retailers</div><div class="sv">${retailers}</div></div>
        <div class="sc b"><div class="sic">${svgIcon('orders')}</div><div class="sl">Distributors</div><div class="sv">${distributors}</div></div>
        <div class="sc a"><div class="sic">${svgIcon('pkg')}</div><div class="sl">Orders</div><div class="sv">${totalOrders}</div></div>
        <div class="sc g"><div class="sic">${svgIcon('revenue')}</div><div class="sl">GMV</div><div class="sv">${fmt(totalValue)}</div></div>
      </div>
      <div class="card"><div class="cp">
        <div class="sh"><span class="st">Platform Stats</span></div>
        <div class="rrow"><span class="rl">Total Orders</span><span class="rv">${totalOrders}</span></div>
        <div class="rrow"><span class="rl">Delivered</span><span class="rv g">${delivered}</span></div>
        <div class="rrow"><span class="rl">Platform GMV</span><span class="rv g">${fmt(totalValue)}</span></div>
        <div class="rrow"><span class="rl">Avg Order Value</span><span class="rv">${fmt(totalOrders?totalValue/totalOrders:0)}</span></div>
      </div></div>`;
  },

}; // end App

// ── SVG Icons ─────────────────────────────────────────────────
function svgIcon(name) {
  const icons = {
    grid:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    store:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    pkg:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    orders:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    chart:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
    pos:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    debt:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    invoice:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    receipt:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="16" y1="8" x2="8" y2="8"/><line x1="16" y1="12" x2="8" y2="12"/><line x1="12" y1="16" x2="8" y2="16"/></svg>`,
    users:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    analytics:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    revenue:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    profit:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    expense:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    print:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    sms:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  };
  return icons[name]||'';
}

// ── Status helpers ────────────────────────────────────────────
function statusPill(status,lang) {
  const map={
    pending:{cls:'p-pen',sw:'Inasubiri',en:'Pending'},
    confirmed:{cls:'p-con',sw:'Imethibitishwa',en:'Confirmed'},
    delivered:{cls:'p-del',sw:'Imetolewa',en:'Delivered'},
    cancelled:{cls:'p-can',sw:'Imefutwa',en:'Cancelled'},
  };
  const s=map[status]||{cls:'p-pen',sw:status,en:status};
  return `<span class="pill ${s.cls}">${lang==='sw'?s.sw:s.en}</span>`;
}

function statusBadge(role) {
  const map={retailer:{cls:'rb-ret',label:'Duka'},distributor:{cls:'rb-dist',label:'Msambazaji'},admin:{cls:'rb-adm',label:'Admin'}};
  const r=map[role]||{cls:'rb-ret',label:role};
  return `<span class="rbadge ${r.cls}">${r.label}</span>`;
}

// ── BOOT ─────────────────────────────────────────────────────
async function boot() {
  // Init location dropdowns
  initLocDropdowns('reg-region','reg-district','reg-ward');
  initLocDropdowns('dreg-region','dreg-district','dreg-ward');
  buildCatGrid();
  goStep(1);

  if (loadSession()) {
    if (S.user) {
      // Session exists — show PIN screen (like WhatsApp)
      S.pinBuf='';
      $('pd0')?.classList.remove('on');$('pd1')?.classList.remove('on');
      $('pd2')?.classList.remove('on');$('pd3')?.classList.remove('on');
      setText('s7h', S.lang==='sw'?'Karibu!':'Welcome!');
      setText('s7sub', S.user.store_name||'');
      const prog=$('pfill');
      if(prog)prog.style.width='90%';
      goStep(7);
    }
  }
}

boot();
