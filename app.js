// BomaWave v5.0 — Subscription + Full Features
import { supabase as sb } from './supabase.js';

const OTP_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/smooth-function';
const SB_KEY  = 'sb_publishable_yJni7Xxl78x24V1mJvLjVg_RAWAsGOt';

// ── Subscription Feature Gates ────────────────────────────────
const PLANS = {
  retailer: {
    free:    { label:'Free',    price:0,     features:['dashboard','pos','marketplace','reports_today','orders'] },
    premium: { label:'Premium', price:12000, features:['dashboard','pos','marketplace','reports_today','reports_week','reports_month','receipts','invoices','whatsapp','offline_pos','multi_store','supervisor','debts','top_selling','orders'] },
    pro:     { label:'Pro',     price:20000, features:['dashboard','pos','marketplace','reports_today','reports_week','reports_month','reports_year','receipts','invoices','whatsapp','offline_pos','multi_store','multi_store_unlimited','supervisor','supervisors_unlimited','debts','debts_unlimited','top_selling','stock_alerts','advanced_analytics','trend_charts','orders'] },
  },
  distributor: {
    free:    { label:'Free',    price:0,     features:['dashboard','pos','marketplace','reports_today','orders'] },
    premium: { label:'Premium', price:20000, features:['dashboard','pos','marketplace','reports_today','reports_week','reports_month','orders','receipts','invoices','whatsapp','offline_pos','multi_store','supervisor','debts','top_selling'] },
    pro:     { label:'Pro',     price:35000, features:['dashboard','pos','marketplace','reports_today','reports_week','reports_month','reports_year','orders','receipts','invoices','whatsapp','offline_pos','multi_store','multi_store_unlimited','supervisor','supervisors_unlimited','debts','debts_unlimited','top_selling','stock_alerts','advanced_analytics','trend_charts'] },
  },
};
const DEBT_LIMITS = { free: 0, premium: 15, pro: Infinity };

function getPlan() {
  const sub = S.subscription;
  if (!sub) return 'free';
  if (sub.status === 'trial') return 'pro';
  return sub.plan || 'free';
}

function can(feature) {
  const role = S.user?.role || 'retailer';
  const plan = getPlan();
  const roleKey = role === 'admin' ? 'retailer' : role;
  return (PLANS[roleKey]?.[plan]?.features || []).includes(feature);
}

function isTrial() { return S.subscription?.status === 'trial'; }

function trialDaysLeft() {
  if (!S.subscription?.trial_ends_at) return 0;
  return Math.max(0, Math.ceil((new Date(S.subscription.trial_ends_at) - new Date()) / 864e5));
}

async function loadSubscription() {
  if (!S.user) return;
  const {data} = await sb.from('subscriptions').select('*').eq('user_id', S.user.id).maybeSingle();
  if (!data) {
    const {data:ns} = await sb.from('subscriptions').insert([{
      user_id:S.user.id, plan:'free', status:'trial',
      trial_ends_at: new Date(Date.now()+14*864e5).toISOString(),
      current_period_end: new Date(Date.now()+14*864e5).toISOString(),
    }]).select().single();
    S.subscription = ns;
  } else {
    if (data.status==='trial' && new Date(data.trial_ends_at) < new Date()) {
      await sb.from('subscriptions').update({status:'active',plan:'free'}).eq('id',data.id);
      S.subscription = {...data, status:'active', plan:'free'};
    } else {
      S.subscription = data;
    }
  }
}

function planBadgeHtml() {
  const plan=getPlan(), trial=isTrial();
  const lbl={free:'Free',premium:'Premium',pro:'Pro'};
  const c=trial?'var(--amber)':'rgba(255,255,255,.65)';
  return '<span style="font-size:.62rem;font-weight:800;color:'+c+';background:rgba(255,255,255,.1);padding:2px 8px;border-radius:20px">'+(trial?'Pro Trial':lbl[plan]||'Free')+'</span>';
}

function lockedPageHTML(feature) {
  const plan=getPlan(), role=S.user?.role||'retailer';
  const np=plan==='free'?'Premium':'Pro';
  const price=(role==='distributor')?(plan==='free'?'TZS 20,000':'TZS 35,000'):(plan==='free'?'TZS 12,000':'TZS 20,000');
  return '<div class="locked-page"><div class="locked-page-icon">'+ic('lock')+'</div><div class="locked-page-title">'+(S.lang==='sw'?'Inahitaji '+np:'Requires '+np)+'</div><div class="locked-page-sub">'+(S.lang==='sw'?'Panda hadi '+np+' ili ufikia feature hii':'Upgrade to '+np+' to access this feature')+'</div><div class="locked-page-price">'+price+' / '+(S.lang==='sw'?'mwezi':'month')+'</div><button class="btn btn-p" style="max-width:220px;margin:0 auto" onclick="App.navTo('subscription')">'+(S.lang==='sw'?'Panda Plan':'Upgrade')+' '+ic('arrow-right')+'</button><button class="btn btn-s" style="max-width:220px;margin:.5rem auto" onclick="App.navTo('dashboard')">'+(S.lang==='sw'?'Rudi':'Go Home')+'</button></div>';
}

function getFeatureList(planKey, role) {
  const roleKey=role==='admin'?'retailer':role;
  const feats=PLANS[roleKey]?.[planKey]?.features||[];
  const all=[
    {id:'dashboard',name:S.lang==='sw'?'Dashibodi':'Dashboard'},
    {id:'pos',name:'POS (Online)'},
    {id:'marketplace',name:'Marketplace'},
    {id:'reports_today',name:S.lang==='sw'?'Ripoti za Leo':'Today Reports'},
    {id:'reports_week',name:S.lang==='sw'?'Ripoti Wiki/Mwezi':'Week/Month Reports'},
    {id:'reports_year',name:S.lang==='sw'?'Ripoti Mwaka':'Year Reports'},
    {id:'debts',name:'Madeni ('+(planKey==='premium'?'Limit 15':planKey==='pro'?'Unlimited':'Hakuna')+')'},
    {id:'receipts',name:S.lang==='sw'?'Risiti / Ankara':'Receipts / Invoices'},
    {id:'whatsapp',name:'WhatsApp Sharing'},
    {id:'offline_pos',name:'Offline POS'},
    {id:'multi_store',name:'Maduka ('+(planKey==='pro'?'Unlimited':'3 max')+')'},
    {id:'supervisor',name:'Msimamizi ('+(planKey==='pro'?'Unlimited':'1')+')'},
    {id:'top_selling',name:S.lang==='sw'?'Bidhaa Zinazoongoza':'Top Selling Products'},
    {id:'stock_alerts',name:'Stock Alerts + Reorder (Pro)'},
    {id:'advanced_analytics',name:S.lang==='sw'?'Takwimu za Kina (Pro)':'Advanced Analytics (Pro)'},
  ];
  return all.map(f=>({...f,available:feats.includes(f.id)||feats.includes(f.id+'_unlimited')||feats.some(ff=>ff.startsWith(f.id))}));
}

function showSaleSuccess(amount) {
  const cols=['#16a34a','#22c55e','#4ade80','#86efac'];
  for(let i=0;i<12;i++){
    const el=document.createElement('div');
    el.style.cssText='position:fixed;width:8px;height:8px;border-radius:50%;background:'+cols[i%4]+';top:50%;left:50%;z-index:9999;pointer-events:none;animation:confetti-pop .8s ease forwards';
    const ang=(i/12)*360,dist=60+Math.random()*60;
    el.style.setProperty('--dx',Math.cos(ang*Math.PI/180)*dist+'px');
    el.style.setProperty('--dy',Math.sin(ang*Math.PI/180)*dist+'px');
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),900);
  }
}

// Feature gates per plan

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
  supervisorOf: null,
  subscription: null,
  quickProds: [],
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
  localStorage.setItem('bw_v4', JSON.stringify({ user: S.user, lang: S.lang, storeId: S.store?.id }));
}
function loadSession() {
  try {
    const d = JSON.parse(localStorage.getItem('bw_v4') || localStorage.getItem('bw_v3') || 'null');
    if (d?.user) { S.user = d.user; S.lang = d.lang || 'sw'; return true; }
  } catch {}
  return false;
}
function clearSession() { localStorage.removeItem('bw_v4'); localStorage.removeItem('bw_v3'); }

// ── OTP API call + Dev Mode ──────────────────────────────────
function showDevOTP(otp) {
  document.getElementById('dev-otp-banner')?.remove();
  const b = document.createElement('div');
  b.id = 'dev-otp-banner';
  b.innerHTML = '<div class="dev-otp-inner">'
    + '<div><div class="dev-otp-label">' + (S.lang==='sw'?'SMS haikufika — OTP:':'SMS failed — OTP:') + '</div>'
    + '<div class="dev-otp-code">' + otp + '</div></div>'
    + '<div class="dev-otp-actions">'
    + '<button class="dev-otp-btn" onclick="fillDevOTP('' + otp + '')">Jaza OTP</button>'
    + '<button class="dev-otp-close" onclick="document.getElementById('dev-otp-banner').remove()">X</button>'
    + '</div></div>';
  document.body.appendChild(b);
  setTimeout(() => b.classList.add('show'), 10);
}

function fillDevOTP(otp) {
  for (const p of ['ob','lb','fb']) {
    if ($(p+'0')) {
      otp.split('').forEach((d, i) => {
        const el = $(p+i); if (el) { el.value=d; el.classList.add('on'); }
      });
      setTimeout(() => {
        if (p==='ob') App.verifyRegOTP();
        else if (p==='lb') App.verifyLoginOTP();
        else App.verifyForgotOTP();
      }, 400);
      document.getElementById('dev-otp-banner')?.remove();
      break;
    }
  }
}

async function callOTP(payload) {
  const res = await fetch(OTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_KEY}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.success && data.dev_otp && data.sms_failed) showDevOTP(data.dev_otp);
  return data;
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
  const el = $('s'+n);
  if (el) {
    el.classList.add('active');
    // Animate step entrance
    el.style.opacity='0'; el.style.transform='translateY(12px)';
    requestAnimationFrame(()=>{
      el.style.transition='opacity .3s ease,transform .3s cubic-bezier(.34,1.4,.64,1)';
      el.style.opacity='1'; el.style.transform='translateY(0)';
    });
  }
  const pct = STEP_MAX[n] || 10;
  const pf = $('pfill'); if(pf) pf.style.width = pct+'%';
  const pp = $('ppct'); if(pp) pp.textContent = pct+'%';
  const pl = $('plbl'); if(pl) { const name = STEP_NAMES[S.lang]?.[n]||'Hatua '+n; pl.textContent=name; }
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
  goStep(n) { goStep(n); },


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
    // Show checkmarks with animation
    const ckRet = $('ck-ret'), ckDist = $('ck-dist');
    if (ckRet) ckRet.classList.toggle('show', role==='retailer');
    if (ckDist) ckDist.classList.toggle('show', role==='distributor');
    $('rnext').style.display = 'flex';
    // Animate button entrance
    const btn = $('rnext');
    if (btn) {
      btn.style.opacity = '0'; btn.style.transform = 'translateY(8px)';
      requestAnimationFrame(() => {
        btn.style.transition = 'opacity .3s ease, transform .3s cubic-bezier(.34,1.4,.64,1)';
        btn.style.opacity = '1'; btn.style.transform = 'translateY(0)';
      });
    }
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
    setBusy('lotp-btn', false);
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
    setText('sbav',av);
    const storeLine=S.store?S.store.store_name:u.store_name;
    setText('sbn',storeLine||'—');
    // Update plan badge
    const plan=getPlan();
    const planData=(u.role==='distributor'?DIST_PLANS:PLANS)[plan]||PLANS.free;
    const pb=$('plan-badge');
    const pnb=$('plan-name-badge');
    const pul=$('plan-upgrade-link');
    if(pb){
      pb.style.background=plan==='free'?'rgba(255,255,255,.08)':plan==='trial'?'rgba(217,119,6,.15)':plan==='premium'?'rgba(34,197,94,.15)':'rgba(99,102,241,.15)';
      pb.style.borderColor=plan==='free'?'rgba(255,255,255,.1)':plan==='trial'?'rgba(217,119,6,.3)':plan==='premium'?'rgba(34,197,94,.3)':'rgba(99,102,241,.3)';
    }
    if(pnb)pnb.textContent=planData.name+(plan==='trial'?' (Trial)':'');
    if(pul)pul.style.display=plan==='pro'?'none':'';
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

    // Scroll to top on page change
    window.scrollTo({top:0,behavior:'smooth'});
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
      supervisor:()=>App.pageSupervisor(),
      'supervisor-dash':()=>App.pageSupervisorDash(),
      subscription:()=>App.pageSubscription(),
      plans:()=>App.pagePlans(),
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
        <div class="sc g stat-anim"><div class="sic">${svgIcon('revenue')}</div><div class="sl">${S.lang==='sw'?'Mapato Leo':'Today Revenue'}</div><div class="sv" id="dash-rev">TZS 0</div></div>
        <div class="sc g stat-anim"><div class="sic">${svgIcon('profit')}</div><div class="sl">${t('profit')}</div><div class="sv" id="dash-profit">TZS 0</div></div>
        <div class="sc a stat-anim"><div class="sic">${svgIcon('pkg')}</div><div class="sl">${S.lang==='sw'?'Yanasubiri':'Pending'}</div><div class="sv">${pending}</div></div>
        <div class="sc b stat-anim"><div class="sic">${svgIcon('orders')}</div><div class="sl">${S.lang==='sw'?'Zimetolewa':'Delivered'}</div><div class="sv">${delivered}</div></div>
      </div>`;
    // Count-up animation
    function animCount(el, target) {
      if (!el) return;
      const dur=800, start=Date.now();
      const tick=()=>{const p=Math.min((Date.now()-start)/dur,1),e=1-Math.pow(1-p,3);el.textContent='TZS '+Math.floor(target*e).toLocaleString();if(p<1)requestAnimationFrame(tick);};
      requestAnimationFrame(tick);
    }
    setTimeout(()=>{animCount($('dash-rev'),todayRev);animCount($('dash-profit'),todayProfit);},300);
    view.innerHTML += `

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
    if (qty<=10 && can('stock_alerts')) {
      await sb.from('stock_alerts').upsert([{product_id:id,distributor_id:S.user.id,alert_type:qty===0?'out_of_stock':'low_stock',threshold:10,is_read:false}],{onConflict:'product_id'});
    } else {
      await sb.from('stock_alerts').delete().eq('product_id',id);
    }
    toast(S.lang==='sw'?'Stok imehifadhiwa':'Stock updated','s');
    App.pageProducts();
  },

  async reorderProduct(id, name) {
    const modal = document.createElement('div');
    modal.className = 'upgrade-overlay';
    modal.innerHTML = '<div class="upgrade-modal">'
      + '<div class="upgrade-title">' + ic('refresh') + ' ' + (S.lang==='sw'?'Ununua Tena':'Reorder') + '</div>'
      + '<div class="upgrade-feature">' + name + '</div>'
      + '<div class="fg" style="margin:1rem 0">'
      + '<label class="fl">' + (S.lang==='sw'?'Idadi ya Kuongeza':'Quantity to Add') + '</label>'
      + '<input class="fi" id="reorder-qty" type="number" min="1" value="50" style="font-size:1.2rem;text-align:center"/>'
      + '</div>'
      + '<div class="upgrade-actions">'
      + '<button class="btn btn-s" onclick="this.closest('.upgrade-overlay').remove()">' + (S.lang==='sw'?'Funga':'Cancel') + '</button>'
      + '<button class="btn btn-p" onclick="App.confirmReorder('' + id + '');this.closest('.upgrade-overlay').remove()">'
      + ic('check') + ' ' + (S.lang==='sw'?'Ongeza Stok':'Add Stock') + '</button>'
      + '</div></div>';
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));
  },

  async confirmReorder(id) {
    const qty = parseInt(document.getElementById('reorder-qty')?.value || '0');
    if (!qty) return toast(S.lang==='sw'?'Weka idadi':'Enter quantity', 'e');
    const {data:p} = await sb.from('products').select('stock_qty').eq('id',id).single();
    const newQty = (p?.stock_qty || 0) + qty;
    await sb.from('products').update({stock_qty: newQty}).eq('id', id);
    await sb.from('stock_alerts').delete().eq('product_id', id);
    toast(S.lang==='sw'?'Stok imeongezwa! Mpya: '+newQty:'Stock updated! New qty: '+newQty, 's');
    App.pageProducts();
  },

  async deleteProduct(id) {
    if(!confirm(S.lang==='sw'?'Una uhakika wa kufuta bidhaa hii?':'Delete this product?'))return;
    await sb.from('products').delete().eq('id',id);
    toast(S.lang==='sw'?'Bidhaa imefutwa':'Product deleted','s');
    App.pageProducts();
  },

  // ── POS ───────────────────────────────────────────────
  async pagePOS() {
    const uid = S.user.id;
    const sid = S.store?.id;

    // Load today's data — online + offline
    let onlineSales = [], onlineExps = [];
    if (S.isOnline) {
      let sq = sb.from('sales').select('*').eq('user_id', uid).gte('sale_date', today()).order('created_at', {ascending:false});
      let eq = sb.from('expenses').select('*').eq('user_id', uid).gte('expense_date', today()).order('created_at', {ascending:false});
      if (sid) { sq = sq.eq('store_id', sid); eq = eq.eq('store_id', sid); }
      const [{data:s},{data:e}] = await Promise.all([sq, eq]);
      onlineSales = s||[]; onlineExps = e||[];
    }

    // Offline pending records
    const offS = (await posDbGetAll('sales')).filter(s=>!s.synced&&s.user_id===uid);
    const offE = (await posDbGetAll('expenses')).filter(e=>!e.synced&&e.user_id===uid);

    const allSales = [...offS.map(s=>({...s,_off:true})), ...onlineSales];
    const allExps  = [...offE.map(e=>({...e,_off:true})), ...onlineExps];

    // Summary stats
    const todayRev    = allSales.reduce((s,r) => s+(r.revenue||r.selling_price*r.qty||0), 0);
    const todayProfit = allSales.reduce((s,r) => s+(r.profit||(r.selling_price-r.buying_price)*r.qty||0), 0);
    const todayExp    = allExps.reduce((s,e)  => s+(e.amount||0), 0);
    const netProfit   = todayProfit - todayExp;
    const margin      = todayRev > 0 ? Math.round(todayProfit/todayRev*100) : 0;

    const view = $('av');
    view.innerHTML = `
      ${!S.isOnline ? `<div class="offline-banner">⚡ ${S.lang==='sw'?'Nje ya mtandao — data inashikiliwa hapa':'Offline — data saved locally, will sync when online'}</div>` : ''}

      <!-- POS Summary Stats -->
      <div class="sr" style="margin-bottom:1.1rem">
        <div class="sc g"><div class="sic">${svgIcon('revenue')}</div><div class="sl">${S.lang==='sw'?'Mapato Leo':'Revenue'}</div><div class="sv" id="pos-rev">TZS 0</div></div>
        <div class="sc g"><div class="sic">${svgIcon('profit')}</div><div class="sl">${S.lang==='sw'?'Faida':'Profit'}</div><div class="sv" id="pos-profit">TZS 0</div></div>
        <div class="sc r"><div class="sic">${svgIcon('expense')}</div><div class="sl">${S.lang==='sw'?'Matumizi':'Expenses'}</div><div class="sv" id="pos-exp">TZS 0</div></div>
        <div class="sc ${netProfit>=0?'g':'r'}"><div class="sic">${svgIcon('chart')}</div><div class="sl">${S.lang==='sw'?'Faida Halisi':'Net'}</div><div class="sv" id="pos-net">TZS 0</div></div>
      </div>

      <!-- Margin pill -->
      <div style="display:flex;gap:.75rem;align-items:center;margin-bottom:1.1rem;flex-wrap:wrap">
        <span style="background:${margin>=20?'var(--g100)':margin>=10?'var(--ambl)':'var(--redl)'};color:${margin>=20?'var(--g900)':margin>=10?'var(--amber)':'var(--red)'};padding:6px 16px;border-radius:20px;font-size:.82rem;font-weight:800">
          📊 Margin: ${margin}%
        </span>
        <span style="font-size:.82rem;color:var(--s500)">${allSales.length} ${S.lang==='sw'?'mauzo leo':'sales today'}</span>
        ${offS.length+offE.length>0?`<span style="background:var(--ambl);color:var(--amber);padding:5px 12px;border-radius:20px;font-size:.75rem;font-weight:700;cursor:pointer" onclick="syncOfflineData()">⚡ ${offS.length+offE.length} ${S.lang==='sw'?'offline — sync':'offline — tap to sync'}</span>`:''}
      </div>

      <!-- Tabs -->
      <div class="ptabs" id="pos-tabs">
        <button class="ptab on" onclick="App.posTab('sales',this)">
          ${svgIcon('pos')} <span>${S.lang==='sw'?'Mauzo':'Sales'}</span>
        </button>
        <button class="ptab" onclick="App.posTab('expenses',this)">
          ${svgIcon('expense')} <span>${S.lang==='sw'?'Matumizi':'Expenses'}</span>
        </button>
        <button class="ptab" onclick="App.posTab('history',this)">
          ${svgIcon('chart')} <span>${S.lang==='sw'?'Historia':'History'}</span>
        </button>
      </div>

      <!-- TAB 1: SALES FORM -->
      <div id="pos-sales">
        <div class="pform">
          <div class="pftitle">🛒 ${S.lang==='sw'?'Rekodi Mauzo':'Record Sale'}</div>
          <div style="display:flex;flex-direction:column;gap:.875rem">
            <div class="fg">
              <label class="fl">${S.lang==='sw'?'Jina la Bidhaa':'Product Name'} *</label>
              <input class="fi" id="s-prod" style="font-size:1rem" placeholder="${S.lang==='sw'?'Jina la bidhaa':'Product name'}" oninput="App.posCalc()"/>
            </div>
            <div class="fg">
              <label class="fl">${S.lang==='sw'?'Aina ya Bidhaa':'Category'}</label>
              <select class="fi" id="s-cat" style="font-size:1rem">
                ${CATS.map(c=>`<option value="${c.id}">${CAT_ICONS[c.id]} ${S.lang==='sw'?c.sw:c.en}</option>`).join('')}
              </select>
            </div>
            <div class="pos-3grid">
              <div class="fg">
                <label class="fl">${S.lang==='sw'?'Idadi':'Qty'} *</label>
                <input class="fi pos-big-input" id="s-qty" type="number" min="1" value="1" oninput="App.posCalc()"/>
              </div>
              <div class="fg">
                <label class="fl">${S.lang==='sw'?'Bei Kununua':'Buy Price'}</label>
                <input class="fi pos-big-input" id="s-buy" type="number" min="0" placeholder="0" oninput="App.posCalc()"/>
              </div>
              <div class="fg">
                <label class="fl">${S.lang==='sw'?'Bei Kuuza':'Sell Price'} *</label>
                <input class="fi pos-big-input" id="s-sell" type="number" min="0" placeholder="0" style="border-color:var(--g400)!important" oninput="App.posCalc()"/>
              </div>
            </div>
            <!-- Live Calculator -->
            <div id="pos-calc" class="pos-calc-card" style="display:none">
              <div style="font-size:.72rem;font-weight:800;color:var(--g700);text-transform:uppercase;letter-spacing:1px;margin-bottom:.65rem">📊 ${S.lang==='sw'?'Hesabu ya Haraka':'Quick Calc'}</div>
              <div class="pos-calc-row"><span>${S.lang==='sw'?'Mapato':'Revenue'}</span><strong id="calc-rev" style="color:var(--g700)">TZS 0</strong></div>
              <div class="pos-calc-row"><span>${S.lang==='sw'?'Faida':'Profit'}</span><strong id="calc-profit" style="color:var(--g600)">TZS 0</strong></div>
              <div class="pos-calc-row"><span>${S.lang==='sw'?'Margin':'Margin %'}</span><strong id="calc-margin" style="color:var(--b700)">0%</strong></div>
            </div>
            <button class="pos-rec-btn green" onclick="App.recordSale()">
              <span id="rec-sale-txt">✓ ${S.lang==='sw'?'Rekodi Mauzo':'Record Sale'}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 2: EXPENSES FORM -->
      <div id="pos-expenses" style="display:none">
        <div class="pform" style="border-color:var(--redl)">
          <div class="pftitle">💸 ${S.lang==='sw'?'Rekodi Matumizi':'Record Expense'}</div>
          <div style="display:flex;flex-direction:column;gap:.875rem">
            <div class="fg">
              <label class="fl">${S.lang==='sw'?'Aina ya Matumizi':'Category'}</label>
              <select class="fi" id="e-cat" style="font-size:1rem">
                <option value="rent">${S.lang==='sw'?'Kodi':'Rent'}</option>
                <option value="transport">${S.lang==='sw'?'Usafiri':'Transport'}</option>
                <option value="salary">${S.lang==='sw'?'Mshahara':'Salary'}</option>
                <option value="utilities">${S.lang==='sw'?'Umeme / Maji':'Utilities'}</option>
                <option value="stock">${S.lang==='sw'?'Kununua Stok':'Stock Purchase'}</option>
                <option value="other">${S.lang==='sw'?'Nyingine':'Other'}</option>
              </select>
            </div>
            <div class="fg">
              <label class="fl">${S.lang==='sw'?'Kiasi':'Amount'} *</label>
              <input class="fi pos-big-input" id="e-amt" type="number" min="0" placeholder="0"/>
            </div>
            <div class="fg">
              <label class="fl">${S.lang==='sw'?'Maelezo':'Description'} *</label>
              <input class="fi" id="e-desc" style="font-size:1rem" placeholder="${S.lang==='sw'?'mfano: Kodi ya mwezi':'e.g. Monthly rent'}"/>
            </div>
            <button class="pos-rec-btn red" onclick="App.recordExpense()">
              <span id="rec-exp-txt">✓ ${S.lang==='sw'?'Rekodi Matumizi':'Record Expense'}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 3: HISTORY -->
      <div id="pos-history" style="display:none">
        <div class="card" style="margin-bottom:1rem"><div class="cp">
          <div class="sh">
            <span class="st">💰 ${S.lang==='sw'?'Mauzo ya Leo':'Today Sales'} (${allSales.length})</span>
            ${offS.length>0?`<span style="background:var(--ambl);color:var(--amber);font-size:.7rem;font-weight:700;padding:3px 10px;border-radius:20px">⚡ ${offS.length} offline</span>`:''}
          </div>
          <div class="tw"><table class="dt">
            <thead><tr>
              <th>${S.lang==='sw'?'BIDHAA':'PRODUCT'}</th>
              <th>QTY</th>
              <th>${S.lang==='sw'?'MAPATO':'REVENUE'}</th>
              <th>${S.lang==='sw'?'FAIDA':'PROFIT'}</th>
              <th>${S.lang==='sw'?'WAKATI':'TIME'}</th>
            </tr></thead>
            <tbody>
              ${allSales.map((s,i) => `
                <tr class="dt-row${s._off?' offline-tr':''}">
                  <td><strong>${s.product_name}</strong>${s._off?` <span style="font-size:.65rem;background:var(--ambl);color:var(--amber);padding:1px 6px;border-radius:8px">⚡</span>`:''}</td>
                  <td style="font-size:1.05rem;font-weight:800;text-align:center">${s.qty}</td>
                  <td style="color:var(--g700);font-weight:800">${fmt(s.revenue||s.selling_price*s.qty||0)}</td>
                  <td style="color:${(s.profit||(s.selling_price-s.buying_price)*s.qty||0)<0?'var(--red)':'var(--g600)'};font-weight:700">
                    ${(s.profit||(s.selling_price-s.buying_price)*s.qty||0)<0?'❌ ':''} ${fmt(Math.abs(s.profit||(s.selling_price-s.buying_price)*s.qty||0))}
                  </td>
                  <td style="color:var(--s500);font-size:.78rem">${s.created_at?.slice(11,16)||'—'}</td>
                </tr>`).join('') || `<tr><td colspan="5"><div class="empty"><div class="empty-ic">💰</div><div class="empty-s">${S.lang==='sw'?'Hakuna mauzo leo':'No sales today'}</div></div></td></tr>`}
            </tbody>
          </table></div>
        </div></div>

        <div class="card"><div class="cp">
          <div class="sh">
            <span class="st">💸 ${S.lang==='sw'?'Matumizi ya Leo':'Today Expenses'}</span>
          </div>
          <div class="tw"><table class="dt">
            <thead><tr>
              <th>${S.lang==='sw'?'AINA':'CATEGORY'}</th>
              <th>${S.lang==='sw'?'MAELEZO':'DESCRIPTION'}</th>
              <th>${S.lang==='sw'?'KIASI':'AMOUNT'}</th>
            </tr></thead>
            <tbody>
              ${allExps.map(e => `
                <tr class="dt-row${e._off?' offline-tr':''}">
                  <td><span class="pill p-pen">${e.category}</span></td>
                  <td>${e.description}</td>
                  <td style="color:var(--red);font-weight:800">${fmt(e.amount)}</td>
                </tr>`).join('') || `<tr><td colspan="3"><div class="empty"><div class="empty-ic">💸</div><div class="empty-s">${S.lang==='sw'?'Hakuna matumizi leo':'No expenses today'}</div></div></td></tr>`}
            </tbody>
          </table></div>
        </div></div>
      </div>`;

    // Animate stat counts after render
    setTimeout(() => {
      animateCount($('pos-rev'),    todayRev,    'TZS ');
      animateCount($('pos-profit'), todayProfit, 'TZS ');
      animateCount($('pos-exp'),    todayExp,    'TZS ');
      animateCount($('pos-net'),    netProfit,   'TZS ');
    }, 300);
  },

  posTab(tab, btn) {
    document.querySelectorAll('.ptab').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    ['pos-sales','pos-expenses','pos-history'].forEach(id => {
      const el = $(id);
      if (el) el.style.display = 'none';
    });
    const active = $(`pos-${tab}`);
    if (active) {
      active.style.display = '';
      // Animate tab content entry
      active.style.opacity = '0';
      active.style.transform = 'translateY(10px)';
      requestAnimationFrame(() => {
        active.style.transition = 'opacity .3s ease, transform .3s ease';
        active.style.opacity = '1';
        active.style.transform = 'translateY(0)';
      });
    }
  },

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
      const margin = sell > 0 ? Math.round((sell-buy)/sell*100) : 0;
      setText('calc-rev',    fmt(rev));
      setText('calc-profit', fmt(profit));
      setText('calc-margin', `${margin}%`);
      $('calc-margin').style.color = margin >= 20 ? 'var(--g700)' : margin >= 10 ? 'var(--amber)' : 'var(--red)';
    } else {
      calc.style.display = 'none';
    }
  },

  async recordSale() {
    const prod = $('s-prod')?.value.trim();
    const cat  = $('s-cat')?.value;
    const qty  = parseInt($('s-qty')?.value || '1');
    const buy  = parseFloat($('s-buy')?.value || '0');
    const sell = parseFloat($('s-sell')?.value || '0');
    if (!prod || !sell || qty < 1)
      return toast(S.lang==='sw' ? 'Jaza jina la bidhaa na bei ya kuuza' : 'Fill product name and selling price', 'e');
    const data = {
      user_id: S.user.id, product_name: prod, category: cat,
      qty, buying_price: buy, selling_price: sell,
      sale_date: today(), store_id: S.store?.id || null,
    };
    setBusy('rec-sale-txt', true);
    if (S.isOnline) {
      const {error} = await sb.from('sales').insert([data]);
      if (error) {
        if(canAccess('offline_pos')){ await posDbAdd('sales', data); toast(S.lang==='sw' ? '⚡ Imehifadhiwa offline' : '⚡ Saved offline', 'w'); }
        else toast(S.lang==='sw'?'Hitilafu ya kuhifadhi':'Save error','e');
      } else {
        toast(S.lang==='sw' ? '✅ Mauzo yamerekodiwa!' : '✅ Sale recorded!', 's');
      }
    } else {
      if(canAccess('offline_pos')){ await posDbAdd('sales', data); toast(S.lang==='sw' ? '⚡ Imehifadhiwa offline' : '⚡ Saved offline', 'w'); }
      else { toast(S.lang==='sw'?'Unahitaji mtandao. Upgrade kwa Offline POS':'Need internet. Upgrade for Offline POS','w'); return; }
    }
    setBusy('rec-sale-txt', false, `✓ ${S.lang==='sw' ? 'Rekodi Mauzo' : 'Record Sale'}`);
    // Clear form
    if($('s-prod')) $('s-prod').value = '';
    if($('s-qty'))  $('s-qty').value  = '1';
    if($('s-buy'))  $('s-buy').value  = '';
    if($('s-sell')) $('s-sell').value = '';
    if($('pos-calc')) $('pos-calc').style.display = 'none';
    App.pagePOS();
  },

  async recordExpense() {
    const cat  = $('e-cat')?.value;
    const desc = $('e-desc')?.value.trim();
    const amt  = parseFloat($('e-amt')?.value || '0');
    if (!desc || !amt)
      return toast(S.lang==='sw' ? 'Jaza maelezo na kiasi' : 'Fill description and amount', 'e');
    const data = {
      user_id: S.user.id, category: cat, description: desc,
      amount: amt, expense_date: today(), store_id: S.store?.id || null,
    };
    setBusy('rec-exp-txt', true);
    if (S.isOnline) {
      const {error} = await sb.from('expenses').insert([data]);
      if (error) { await posDbAdd('expenses', data); toast('⚡ Saved offline', 'w'); }
      else toast(S.lang==='sw' ? '✅ Matumizi yamerekodiwa!' : '✅ Expense recorded!', 's');
    } else {
      await posDbAdd('expenses', data);
      toast(S.lang==='sw' ? '⚡ Imehifadhiwa offline' : '⚡ Saved offline', 'w');
    }
    setBusy('rec-exp-txt', false, `✓ ${S.lang==='sw' ? 'Rekodi Matumizi' : 'Record Expense'}`);
    if($('e-amt'))  $('e-amt').value  = '';
    if($('e-desc')) $('e-desc').value = '';
    App.pagePOS();
  },

  // ── ADVANCED REPORTS ──────────────────────────────────
  async pageReports() {
    const view = $('av');
    view.innerHTML = `
      <div class="rep-period-tabs">
        <button class="pertab on" onclick="App.loadReports('today',this)">${S.lang==='sw'?'Leo':'Today'}</button>
        <button class="pertab" onclick="App.loadReports('week',this)">${S.lang==='sw'?'Wiki':'Week'}</button>
        <button class="pertab" onclick="App.loadReports('month',this)">${S.lang==='sw'?'Mwezi':'Month'}</button>
        <button class="pertab" onclick="App.loadReports('year',this)">${S.lang==='sw'?'Mwaka':'Year'}</button>
      </div>
      <div id="rep-body"><div class="page-loading"><span class="spin d"></span></div></div>`;
    await App.loadReports('today', view.querySelector('.pertab'));
  },

  async loadReports(period, btn) {
    document.querySelectorAll('.pertab').forEach(b => b.classList.remove('on'));
    if (btn) btn.classList.add('on');
    // Gate check
    if(period==='week'&&!canAccess('reports_week')){showUpgradeModal('reports_week');return;}
    if(period==='month'&&!canAccess('reports_month')){showUpgradeModal('reports_month');return;}
    if(period==='year'&&!canAccess('reports_year')){showUpgradeModal('reports_year');return;}

    const days = {today:0, week:7, month:30, year:365}[period] || 0;
    const startDate = days === 0 ? today() : new Date(Date.now()-days*864e5).toISOString().slice(0,10);
    const uid  = S.user.id;
    const sid  = S.store?.id;

    // Build queries
    let sq = sb.from('sales').select('*').eq('user_id', uid).gte('sale_date', startDate);
    let eq = sb.from('expenses').select('*').eq('user_id', uid).gte('expense_date', startDate);
    if (sid) { sq = sq.eq('store_id', sid); eq = eq.eq('store_id', sid); }

    const [{data:sales},{data:exps}] = await Promise.all([sq, eq]);
    const allS = sales || [], allE = exps || [];

    // Core metrics
    const rev     = allS.reduce((s,r) => s+(r.revenue||r.selling_price*r.qty||0), 0);
    const cost    = allS.reduce((s,r) => s+(r.buying_price*r.qty||0), 0);
    const profit  = allS.reduce((s,r) => s+(r.profit||(r.selling_price-r.buying_price)*r.qty||0), 0);
    const expT    = allE.reduce((s,e) => s+(e.amount||0), 0);
    const net     = profit - expT;
    const margin  = rev > 0 ? (profit/rev*100).toFixed(1) : 0;
    const txCount = allS.length;
    const avgSale = txCount > 0 ? rev/txCount : 0;

    // Category breakdown
    const byCat = {};
    allS.forEach(s => {
      const cat = s.category || 'other';
      if (!byCat[cat]) byCat[cat] = {rev:0, profit:0, qty:0, count:0};
      byCat[cat].rev    += s.revenue || s.selling_price*s.qty || 0;
      byCat[cat].profit += s.profit  || (s.selling_price-s.buying_price)*s.qty || 0;
      byCat[cat].qty    += s.qty || 0;
      byCat[cat].count  += 1;
    });

    // Top products (by revenue)
    const byProd = {};
    allS.forEach(s => {
      if (!byProd[s.product_name]) byProd[s.product_name] = {rev:0, qty:0, profit:0};
      byProd[s.product_name].rev    += s.revenue || s.selling_price*s.qty || 0;
      byProd[s.product_name].qty    += s.qty || 0;
      byProd[s.product_name].profit += s.profit || (s.selling_price-s.buying_price)*s.qty || 0;
    });
    const topProds = Object.entries(byProd).sort((a,b)=>b[1].rev-a[1].rev).slice(0,5);
    const maxProdRev = Math.max(...topProds.map(([,v])=>v.rev), 1);

    // Expense breakdown
    const byExp = {};
    allE.forEach(e => { byExp[e.category] = (byExp[e.category]||0) + e.amount; });
    const maxExpVal = Math.max(...Object.values(byExp), 1);

    // Daily trend (last 7 days for week, last 30 for month)
    const trendDays = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 12;
    const trend = {};
    allS.forEach(s => {
      const d = s.sale_date || s.created_at?.slice(0,10);
      if (d) trend[d] = (trend[d]||0) + (s.revenue||s.selling_price*s.qty||0);
    });

    // Per-store breakdown (if multiple stores)
    const storeBreakdown = {};
    if (S.stores.length > 1) {
      allS.forEach(s => {
        const sname = S.stores.find(st=>st.id===s.store_id)?.store_name || 'Duka Kuu';
        if (!storeBreakdown[sname]) storeBreakdown[sname] = {rev:0, profit:0};
        storeBreakdown[sname].rev    += s.revenue||s.selling_price*s.qty||0;
        storeBreakdown[sname].profit += s.profit||(s.selling_price-s.buying_price)*s.qty||0;
      });
    }
    const maxCatRev = Math.max(...Object.values(byCat).map(v=>v.rev), 1);

    $('rep-body').innerHTML = `
      <!-- KPI Cards -->
      <div class="rep-kpis">
        <div class="rep-kpi green">
          <div class="rep-kpi-label">${S.lang==='sw'?'Jumla Mapato':'Total Revenue'}</div>
          <div class="rep-kpi-val">${fmt(rev)}</div>
          <div class="rep-kpi-sub">${txCount} ${S.lang==='sw'?'mauzo':'transactions'}</div>
        </div>
        <div class="rep-kpi ${profit>=0?'green':'red'}">
          <div class="rep-kpi-label">${S.lang==='sw'?'Faida Ghafi':'Gross Profit'}</div>
          <div class="rep-kpi-val">${fmt(profit)}</div>
          <div class="rep-kpi-sub">Margin: ${margin}%</div>
        </div>
        <div class="rep-kpi red">
          <div class="rep-kpi-label">${S.lang==='sw'?'Matumizi':'Expenses'}</div>
          <div class="rep-kpi-val">${fmt(expT)}</div>
          <div class="rep-kpi-sub">${Object.keys(byExp).length} ${S.lang==='sw'?'aina':'categories'}</div>
        </div>
        <div class="rep-kpi ${net>=0?'green':'red'}">
          <div class="rep-kpi-label">${S.lang==='sw'?'Faida Halisi':'Net Profit'}</div>
          <div class="rep-kpi-val">${fmt(net)}</div>
          <div class="rep-kpi-sub">${S.lang==='sw'?'Baada ya matumizi':'After expenses'}</div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="rsec" style="margin-bottom:1rem">
        <div class="rsec-t">📊 ${S.lang==='sw'?'Muhtasari wa Fedha':'Financial Summary'}</div>
        <div class="rrow"><span class="rl">${S.lang==='sw'?'Jumla Mauzo (TX)':'Total Transactions'}</span><span class="rv">${txCount}</span></div>
        <div class="rrow"><span class="rl">${S.lang==='sw'?'Wastani kwa Mauzo':'Avg per Sale'}</span><span class="rv">${fmt(avgSale)}</span></div>
        <div class="rrow"><span class="rl">${S.lang==='sw'?'Gharama ya Bidhaa':'Cost of Goods'}</span><span class="rv r">${fmt(cost)}</span></div>
        <div class="rrow"><span class="rl">${S.lang==='sw'?'Faida Ghafi':'Gross Profit'}</span><span class="rv ${profit>=0?'g':'r'}">${fmt(profit)}</span></div>
        <div class="rrow"><span class="rl">${S.lang==='sw'?'Matumizi':'Expenses'}</span><span class="rv r">${fmt(expT)}</span></div>
        <div class="rrow div">
          <span class="rl" style="font-weight:800;font-size:.95rem">${S.lang==='sw'?'Faida Halisi':'Net Profit'}</span>
          <span class="rv ${net>=0?'g':'r'}" style="font-size:1.1rem;font-weight:800">${fmt(net)}</span>
        </div>
      </div>

      <!-- Top Products Bar Chart (Premium+) -->
      <div class="rsec" style="margin-bottom:1rem">
        <div class="rsec-t">🏆 ${S.lang==='sw'?'Bidhaa Zinazoongoza':'Top Products'}</div>
        ${topProds.length ? topProds.map(([name,v], i) => {
          // Red if cost >= revenue (selling at loss)
          const isLoss = v.profit < 0;
          const pct = Math.round(v.rev/maxProdRev*100);
          return `<div class="top-prod-row">
            <div class="top-prod-rank">${i+1}</div>
            <div class="top-prod-info">
              <div class="top-prod-name">${name}</div>
              <div class="top-prod-bar-wrap">
                <div class="top-prod-bar" style="width:${pct}%;background:${isLoss?'var(--red)':'linear-gradient(90deg,var(--g700),var(--g500))'}"></div>
              </div>
              <div class="top-prod-meta">
                <span>${fmt(v.rev)}</span>
                <span style="color:${isLoss?'var(--red)':'var(--g700)'};font-weight:700">${isLoss?'❌ Hasara':fmt(v.profit)+' faida'}</span>
                <span style="color:var(--s500)">Qty: ${v.qty}</span>
              </div>
            </div>
          </div>`;
        }).join('') : `<div style="color:var(--s500);text-align:center;padding:1rem">${S.lang==='sw'?'Hakuna data':'No data'}</div>`}
      </div>

      <!-- Category Breakdown -->
      <div class="rsec" style="margin-bottom:1rem">
        <div class="rsec-t">📦 ${S.lang==='sw'?'Mauzo kwa Aina':'Sales by Category'}</div>
        ${Object.entries(byCat).sort((a,b)=>b[1].rev-a[1].rev).map(([cat,v]) => {
          const catMargin = v.rev > 0 ? Math.round(v.profit/v.rev*100) : 0;
          const isLoss = v.profit < 0;
          return `<div class="cat-bar-row" style="margin-bottom:.75rem">
            <div class="cat-bar-label">${CAT_ICONS[cat]||'📦'} ${cat}</div>
            <div>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" style="width:${Math.round(v.rev/maxCatRev*100)}%;background:${isLoss?'var(--red)':''}"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:.72rem;margin-top:.2rem">
                <span style="color:var(--s500)">${fmt(v.rev)}</span>
                <span style="color:${isLoss?'var(--red)':catMargin>=15?'var(--g700)':'var(--s500)'}">
                  ${isLoss?'❌ Hasara':`Faida: ${fmt(v.profit)}`}
                </span>
              </div>
            </div>
          </div>`;
        }).join('') || `<div style="color:var(--s500);text-align:center;padding:1rem">${S.lang==='sw'?'Hakuna data':'No data'}</div>`}
      </div>

      <!-- Expense Breakdown -->
      ${expT > 0 ? `<div class="rsec" style="margin-bottom:1rem">
        <div class="rsec-t">💸 ${S.lang==='sw'?'Matumizi kwa Aina':'Expenses by Category'}</div>
        ${Object.entries(byExp).sort((a,b)=>b[1]-a[1]).map(([cat,val]) => `
          <div class="cat-bar-row" style="margin-bottom:.65rem">
            <div class="cat-bar-label" style="color:var(--red)">${cat}</div>
            <div>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" style="width:${Math.round(val/maxExpVal*100)}%;background:linear-gradient(90deg,var(--red),#f87171)"></div>
              </div>
              <div style="font-size:.75rem;color:var(--red);font-weight:700;margin-top:.2rem">${fmt(val)}</div>
            </div>
          </div>`).join('')}
      </div>` : ''}

      <!-- Multi-Store Breakdown -->
      ${S.stores.length > 1 && Object.keys(storeBreakdown).length > 0 ? `
      <div class="rsec" style="margin-bottom:1rem">
        <div class="rsec-t">🏪 ${S.lang==='sw'?'Ufanisi kwa Duka':'Performance by Store'}</div>
        ${Object.entries(storeBreakdown).sort((a,b)=>b[1].rev-a[1].rev).map(([name,v]) => {
          const isLoss = v.profit < 0;
          return `<div class="rrow">
            <span class="rl">🏪 ${name}</span>
            <div style="text-align:right">
              <div style="font-weight:800">${fmt(v.rev)}</div>
              <div style="font-size:.75rem;color:${isLoss?'var(--red)':'var(--g700)'}">${isLoss?'❌ Hasara':fmt(v.profit)+' faida'}</div>
            </div>
          </div>`;
        }).join('')}
      </div>` : ''}

      <!-- Daily trend for week/month -->
      ${period !== 'today' && Object.keys(trend).length > 0 ? `
      <div class="rsec">
        <div class="rsec-t">📈 ${S.lang==='sw'?'Mwelekeo wa Mauzo':'Sales Trend'}</div>
        <div class="trend-wrap">
          ${Object.entries(trend).sort().slice(-14).map(([date,val]) => {
            const maxT = Math.max(...Object.values(trend), 1);
            const h = Math.max(8, Math.round(val/maxT*80));
            return `<div class="trend-col">
              <div class="trend-bar" style="height:${h}px" title="${date}: ${fmt(val)}"></div>
              <div class="trend-label">${date.slice(5)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}
    `;
  },

  // ── DEBTS ─────────────────────────────────────────────
  // ── SUBSCRIPTION PAGE ────────────────────────────────
  async pageSubscription() {
    const plan = getPlan(), role = S.user?.role || 'retailer';
    const roleKey = role === 'admin' ? 'retailer' : role;
    const plans = PLANS[roleKey];
    const trial = isTrial(), daysLeft = trialDaysLeft();
    const curLabel = trial ? 'Pro Trial' : {free:'Free',premium:'Premium',pro:'Pro'}[plan] || 'Free';
    const curPrice = trial
      ? (S.lang==='sw' ? 'Siku '+daysLeft+' zimebaki' : daysLeft+' days remaining')
      : plan==='free' ? (S.lang==='sw'?'Bila malipo':'Free forever')
      : fmt(plans[plan]?.price) + '/' + (S.lang==='sw'?'mwezi':'month');

    let html = (trial
      ? '<div class="trial-banner big">'+ic('crown')+' <strong>Pro Trial</strong> — '+(S.lang==='sw'?'Siku '+daysLeft+' zimebaki. Furahia features zote za Pro.':daysLeft+' days remaining. Enjoy all Pro features.')+'</div>'
      : '')
      + '<div class="sub-current">'
      + '<div class="sub-cur-label">'+(S.lang==='sw'?'Mpango Wako wa Sasa':'Your Current Plan')+'</div>'
      + '<div class="sub-cur-plan">'+curLabel+'</div>'
      + '<div class="sub-cur-price">'+curPrice+'</div>'
      + '</div><div class="sub-plans">';

    for (const [key, p] of Object.entries(plans)) {
      const isCur = plan===key || (trial&&key==='pro');
      html += '<div class="sub-plan-card'+(isCur?' current':'')+(key==='pro'?' popular':'')+ '">'
        + (key==='pro' ? '<div class="sub-popular-badge">'+ic('crown')+' '+(S.lang==='sw'?'Maarufu':'Popular')+'</div>' : '')
        + '<div class="sub-plan-name">'+p.label+'</div>'
        + '<div class="sub-plan-price">'+(p.price===0?(S.lang==='sw'?'Bila malipo':'Free'):fmt(p.price))+'<span>'+(p.price>0?'/'+(S.lang==='sw'?'mwezi':'month'):'')+'</span></div>'
        + '<div class="sub-plan-features">'
        + getFeatureList(key, role).map(f =>
            '<div class="sub-feat"><span class="sub-feat-icon '+(f.available?'yes':'no')+'">'+(f.available?ic('check'):ic('x'))+'</span>'+f.name+'</div>'
          ).join('')
        + '</div>'
        + '<button class="sub-plan-btn'+(isCur?' current-btn':key==='pro'?' pro-btn':'')+'" '
        + 'onclick="'+(isCur?'':key==='free'?'App.downgradePlan()':'App.requestUpgrade(''+key+'')')+'">'
        + (isCur?(S.lang==='sw'?'Mpango Wako':'Current Plan'):key==='free'?(S.lang==='sw'?'Shuka':'Downgrade'):(S.lang==='sw'?'Panda '+p.label:'Upgrade to '+p.label))
        + '</button></div>';
    }

    html += '</div><div class="sub-coming-soon">'+ic('info')
      + ' <strong>'+(S.lang==='sw'?'Malipo yanakuja hivi karibuni':'Payments coming soon')+'</strong> — '
      + (S.lang==='sw'?'Kwa sasa mipango yote iko wazi bila malipo. Utaarifiwa ukifika wakati wa malipo.':'All plans are accessible for free. You will be notified when billing begins.')
      + '</div>';

    $('av').innerHTML = html;
    staggerCards('.sub-plan-card', 100);
  },

  async requestUpgrade(plan) {
    await sb.from('subscriptions').upsert([{
      user_id: S.user.id,
      plan,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now()+30*864e5).toISOString(),
    }], {onConflict:'user_id'});
    S.subscription = {...S.subscription, plan, status:'active'};
    toast(S.lang==='sw'?'Umepanda hadi '+plan.toUpperCase()+'! Hongera!':'Upgraded to '+plan.toUpperCase()+'!', 's');
    App.renderApp();
    App.pageSubscription();
  },

  async downgradePlan() {
    if (!confirm(S.lang==='sw'?'Una uhakika wa kushuka hadi Free?':'Downgrade to Free?')) return;
    await sb.from('subscriptions').update({plan:'free',status:'active'}).eq('user_id',S.user.id);
    S.subscription = {...S.subscription, plan:'free', status:'active'};
    toast(S.lang==='sw'?'Umeshuka hadi Free':'Downgraded to Free','i');
    App.renderApp();
    App.pageSubscription();
  },

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



  quickReorder(id, name) {
    toast(`${S.lang==='sw'?'Unakwenda Marketplace kuagiza':'Going to Marketplace to order'} ${name}`, 'i');
    setTimeout(() => App.navTo('marketplace'), 800);
  },

  startTypewriter() {
    const el = document.getElementById('tw-text');
    if (!el) return;
    const texts = S.lang==='sw'
      ? [`Habari, ${S.user.store_name||''}!`, 'Biashara yako leo?', 'BomaWave iko nawe.']
      : [`Welcome, ${S.user.store_name||''}!`, 'How is business today?', 'BomaWave has you covered.'];
    let idx = 0, charIdx = 0, deleting = false;
    clearInterval(S._twTimer);
    S._twTimer = setInterval(() => {
      const text = texts[idx];
      if (!deleting) {
        el.textContent = text.slice(0, ++charIdx);
        if (charIdx === text.length) { deleting = true; setTimeout(() => {}, 2000); }
      } else {
        el.textContent = text.slice(0, --charIdx);
        if (charIdx === 0) { deleting = false; idx = (idx+1) % texts.length; }
      }
    }, deleting ? 40 : 80);
  },

  // ── PLANS PAGE ───────────────────────────────────────────
  async pagePlans() {
    const plan = getPlan();
    const isRetailer = S.user.role !== 'distributor';
    const prices = isRetailer
      ? {premium:12000, pro:20000}
      : {premium:20000, pro:35000};

    const features = {
      free: [
        {f:'Dashboard (Basic)',yes:true},
        {f:'POS (Online)',yes:true},
        {f:'Marketplace',yes:true},
        {f:S.lang==='sw'?'Ripoti — Leo tu':'Reports — Today Only',yes:true},
        {f:'Top Selling Products',yes:false},
        {f:'Debt Management',yes:false},
        {f:'Invoices & Receipts',yes:false},
        {f:'Offline POS',yes:false},
        {f:'Multi-Store',yes:false},
        {f:'Supervisor/Boss',yes:false},
        {f:'Stock Alerts',yes:false},
        {f:'Advanced Analytics',yes:false},
      ],
      premium: [
        {f:'Dashboard (Full)',yes:true},
        {f:'POS (Online + Offline)',yes:true},
        {f:'Marketplace',yes:true},
        {f:S.lang==='sw'?'Ripoti — Wiki + Mwezi + Charts':'Reports — Week + Month + Charts',yes:true},
        {f:'Top Selling Products',yes:true},
        {f:`Debt Management (15 ${S.lang==='sw'?'limit':'limit'})`,yes:true},
        {f:'Invoices & Receipts',yes:true},
        {f:'Offline POS',yes:true},
        {f:'Multi-Store (3)',yes:true},
        {f:'Supervisor (1)',yes:true},
        {f:'Stock Alerts',yes:false},
        {f:'Advanced Analytics',yes:false},
      ],
      pro: [
        {f:'Dashboard (Full)',yes:true},
        {f:'POS (Online + Offline)',yes:true},
        {f:'Marketplace',yes:true},
        {f:S.lang==='sw'?'Ripoti — Yote + Mwaka':'Reports — All + Annual',yes:true},
        {f:'Top Selling Products',yes:true},
        {f:'Debt Management (Unlimited)',yes:true},
        {f:'Invoices & Receipts',yes:true},
        {f:'Offline POS',yes:true},
        {f:'Multi-Store (Unlimited)',yes:true},
        {f:'Supervisors (Unlimited)',yes:true},
        {f:'Stock Alerts + Reorder',yes:true},
        {f:'Advanced Analytics + Trends',yes:true},
      ],
    };

    const fIcon = (yes) => yes
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g700)" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    // Trial days remaining
    const expires = S.user.plan_expires_at ? new Date(S.user.plan_expires_at) : null;
    const daysLeft = expires ? Math.max(0, Math.ceil((expires-new Date())/864e5)) : 0;

    $('av').innerHTML = `
      ${plan==='trial'?`<div class="upgrade-banner" style="margin-bottom:1.25rem">
        <div style="width:42px;height:42px;border-radius:10px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">${svgIcon('star')}</div>
        <div class="upgrade-banner-text">
          <div class="upgrade-banner-title">${S.lang==='sw'?`Majaribio ya Pro — Siku ${daysLeft} zimebaki`:`Pro Trial — ${daysLeft} days remaining`}</div>
          <div class="upgrade-banner-sub">${S.lang==='sw'?'Unafurahia Pro zote. Chagua plan baada ya majaribio.':'Enjoying all Pro features. Choose a plan after trial.'}</div>
        </div>
      </div>`:''}

      <div style="margin-bottom:1.25rem">
        <div class="page-title">${S.lang==='sw'?'Chagua Plan':'Choose Your Plan'}</div>
        <div style="font-size:.88rem;color:var(--s500);margin-top:.25rem">${S.lang==='sw'?'Lipa kupitia USSD — Selcom/M-Pesa itawashwa hivi karibuni':'Pay via USSD — Selcom/M-Pesa coming soon'}</div>
      </div>

      <div class="plan-cards-wrap">
        <!-- FREE -->
        <div class="plan-card${plan==='free'?' active':''}">
          ${plan==='free'?`<div style="position:absolute;top:1rem;left:1rem;background:var(--g100);color:var(--g700);font-size:.65rem;font-weight:800;padding:3px 10px;border-radius:20px">PLANI YAKO</div>`:''}
          <div style="padding-top:${plan==='free'?'1.5rem':'0'}">
            <div class="plan-name-h">Free</div>
            <div class="plan-price-h">TZS 0 <span>/ mwezi</span></div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:.1rem;margin:.75rem 0">
            ${features.free.map(f=>`<div class="plan-feat ${f.yes?'yes':'no'}">${fIcon(f.yes)} ${f.f}</div>`).join('')}
          </div>
          <button class="plan-cta-btn free" onclick="App.navTo('dashboard')">${plan==='free'?S.lang==='sw'?'Plani ya Sasa':'Current Plan':S.lang==='sw'?'Chagua Bure':'Use Free'}</button>
        </div>

        <!-- PREMIUM -->
        <div class="plan-card popular${plan==='premium'?' active':''}">
          ${plan==='premium'?`<div style="position:absolute;top:1rem;left:1rem;background:var(--g100);color:var(--g700);font-size:.65rem;font-weight:800;padding:3px 10px;border-radius:20px">PLANI YAKO</div>`:''}
          <div style="padding-top:${plan==='premium'?'1.5rem':'0'}">
            <div class="plan-name-h">Premium</div>
            <div class="plan-price-h">${fmt(prices.premium)} <span>/ mwezi</span></div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:.1rem;margin:.75rem 0">
            ${features.premium.map(f=>`<div class="plan-feat ${f.yes?'yes':'no'}">${fIcon(f.yes)} ${f.f}</div>`).join('')}
          </div>
          <button class="plan-cta-btn premium" onclick="App.showPaymentModal('premium',${prices.premium})">${plan==='premium'?S.lang==='sw'?'Plani ya Sasa':'Current Plan':S.lang==='sw'?'Panda Premium':'Get Premium'}</button>
        </div>

        <!-- PRO -->
        <div class="plan-card${plan==='pro'?' active':''}">
          ${plan==='pro'?`<div style="position:absolute;top:1rem;left:1rem;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:.65rem;font-weight:800;padding:3px 10px;border-radius:20px">PLANI YAKO</div>`:''}
          <div style="padding-top:${plan==='pro'?'1.5rem':'0'}">
            <div class="plan-name-h">Pro</div>
            <div class="plan-price-h" style="color:#4f46e5">${fmt(prices.pro)} <span>/ mwezi</span></div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:.1rem;margin:.75rem 0">
            ${features.pro.map(f=>`<div class="plan-feat ${f.yes?'yes':'no'}">${fIcon(f.yes)} ${f.f}</div>`).join('')}
          </div>
          <button class="plan-cta-btn pro" onclick="App.showPaymentModal('pro',${prices.pro})">${plan==='pro'?S.lang==='sw'?'Plani ya Sasa':'Current Plan':S.lang==='sw'?'Panda Pro':'Get Pro'}</button>
        </div>
      </div>

      <div class="alert al-i" style="margin-top:1rem">
        ${svgIcon('upgrade')} ${S.lang==='sw'?'Malipo ya subscription yatawashwa hivi karibuni kupitia Selcom USSD na M-Pesa. Kwa sasa, wasiliana nasi kupitia WhatsApp.':'Subscription payments coming soon via Selcom USSD and M-Pesa. For now, contact us via WhatsApp.'}
      </div>
    `;
  },

  showPaymentModal(planId, amount) {
    const modal = document.createElement('div');
    modal.id = 'pay-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:1rem;padding:1.75rem;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.2);animation:popIn .3s cubic-bezier(.34,1.4,.64,1)">
        <div style="font-size:1.1rem;font-weight:800;margin-bottom:.25rem">${S.lang==='sw'?'Lipa Subscription':'Pay Subscription'}</div>
        <div style="font-size:.85rem;color:var(--s500);margin-bottom:1.25rem">${S.lang==='sw'?'Malipo ya USSD — Hivi karibuni':'USSD Payment — Coming Soon'}</div>
        <div style="background:var(--g50);border:1.5px solid var(--g100);border-radius:.75rem;padding:1rem;margin-bottom:1rem">
          <div style="font-size:.75rem;color:var(--s500);margin-bottom:.25rem">Kiasi cha Kulipa</div>
          <div style="font-size:1.6rem;font-weight:900;color:var(--g700)">${fmt(amount)}</div>
          <div style="font-size:.75rem;color:var(--s500);margin-top:.25rem">kwa mwezi mmoja</div>
        </div>
        <div class="alert al-w" style="margin-bottom:1rem">
          ${svgIcon('upgrade')} ${S.lang==='sw'?'Mfumo wa malipo utawashwa hivi karibuni. Wasiliana nasi sasa:':'Payment system coming soon. Contact us now:'}
          <br><strong>+255696230657 (WhatsApp)</strong>
        </div>
        <div style="display:flex;gap:.75rem">
          <button onclick="document.getElementById('pay-modal').remove()" style="flex:1;padding:.875rem;border-radius:.65rem;border:1.5px solid var(--s200);background:#fff;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;font-weight:700">Rudi</button>
          <button onclick="window.open('https://wa.me/255696230657?text=Nataka+kulipia+plan+ya+${planId}+TZS+${amount}+kwa+akaunti+yangu+BomaWave','_blank');document.getElementById('pay-modal').remove()" style="flex:1;padding:.875rem;border-radius:.65rem;border:none;background:#25d366;color:#fff;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;font-weight:700">WhatsApp</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
  },

  // ══════════════════════════════════════════════════════════
  //  SUPERVISOR / BOSS FEATURE
  // ══════════════════════════════════════════════════════════
  async pageSupervisor() {
    if(!canAccess('supervisor'))return;
    // Load existing supervisors for this business
    const {data:sups} = await sb.from('supervisors')
      .select('*').eq('business_id', S.user.id).eq('is_active', true);

    $('av').innerHTML = `
      <div class="sup-hero">
        <div class="sup-hero-icon">👔</div>
        <div>
          <div class="sup-hero-title">${S.lang==='sw'?'Wasimamizi wa Biashara':'Business Supervisors'}</div>
          <div class="sup-hero-sub">${S.lang==='sw'?'Mtu anayeweza kuona ufanisi wako bila ya kuingiliana na data':'Someone who can view your business performance remotely'}</div>
        </div>
      </div>

      <!-- Add new supervisor -->
      <div class="card anim-card" style="margin-bottom:1rem"><div class="cp">
        <div class="page-title">➕ ${S.lang==='sw'?'Ongeza Msimamizi':'Add Supervisor'}</div>
        <div style="display:flex;flex-direction:column;gap:.875rem;margin-top:.875rem">
          <div class="fg">
            <label class="fl">${S.lang==='sw'?'Jina la Msimamizi':'Supervisor Name'} *</label>
            <input class="fi" id="sup-name" placeholder="${S.lang==='sw'?'mfano: Baba John':'e.g. John Smith'}"/>
          </div>
          <div class="fg">
            <label class="fl">${S.lang==='sw'?'Namba ya Simu':'Phone Number'} *</label>
            <div class="iw">
              <div class="pfx"><span class="pfx-flag">🇹🇿</span><span class="pfx-code">+255</span></div>
              <input class="fi fi-phone" id="sup-phone" type="tel" inputmode="numeric" maxlength="9"
                placeholder="712 345 678" oninput="this.value=this.value.replace(/\D/g,'').slice(0,9)"/>
            </div>
          </div>
          <div class="fg">
            <label class="fl">${S.lang==='sw'?'Kiwango cha Ufikiaji':'Access Level'}</label>
            <select class="fi" id="sup-access">
              <option value="read">${S.lang==='sw'?'Kuona tu (Read Only)':'View Only (Read Only)'}</option>
              <option value="full">${S.lang==='sw'?'Kamili (Kuona + Kutuma)':'Full Access'}</option>
            </select>
          </div>
          <div class="alert al-i" style="margin:0">
            ℹ️ ${S.lang==='sw'?'Msimamizi atapata namba ya siri kupitia SMS ili aingie kwenye dashibodi yake':'Supervisor will receive a PIN via SMS to access their dashboard'}
          </div>
          <button class="btn btn-p" onclick="App.addSupervisor()">
            <span id="add-sup-txt">+ ${S.lang==='sw'?'Ongeza Msimamizi':'Add Supervisor'}</span>
          </button>
        </div>
      </div></div>

      <!-- Existing supervisors -->
      <div class="page-title" style="margin-bottom:.875rem">
        ${S.lang==='sw'?'Wasimamizi Waliopo':'Current Supervisors'} (${(sups||[]).length})
      </div>
      ${(sups||[]).length === 0
        ? `<div class="empty"><div class="empty-ic">👔</div>
           <div class="empty-t">${S.lang==='sw'?'Hakuna msimamizi bado':'No supervisors yet'}</div>
           <div class="empty-s">${S.lang==='sw'?'Ongeza msimamizi ili awaeza kukuangalia biashara yako':'Add a supervisor so they can monitor your business'}</div>
           </div>`
        : (sups||[]).map(sup => `
          <div class="sup-card anim-card">
            <div class="sup-avatar">${sup.name[0].toUpperCase()}</div>
            <div class="sup-info">
              <div class="sup-name">${sup.name}</div>
              <div class="sup-phone">${sup.phone_number}</div>
              <div class="sup-access">${sup.access_level === 'full'
                ? `<span style="color:var(--g700)">✅ ${S.lang==='sw'?'Ufikiaji Kamili':'Full Access'}</span>`
                : `<span style="color:var(--b700)">👁 ${S.lang==='sw'?'Kuona Tu':'View Only'}</span>`}
              </div>
            </div>
            <button class="bsm r" onclick="App.removeSupervisor('${sup.id}')">
              ${S.lang==='sw'?'Ondoa':'Remove'}
            </button>
          </div>`).join('')}
    `;
    staggerCards('.anim-card', 80);
  },

  async addSupervisor() {
    const name  = $('sup-name')?.value.trim();
    const rawPh = $('sup-phone')?.value.trim();
    const access = $('sup-access')?.value || 'read';
    if (!name) return toast(S.lang==='sw'?'Weka jina la msimamizi':'Enter supervisor name','e');
    const phone = normPhone(rawPh);
    if (!phone) return toast(S.lang==='sw'?'Namba si sahihi':'Invalid phone number','e');

    setBusy('add-sup-txt', true);

    // Check if phone already registered — link to their profile
    const {data:existing} = await sb.from('profiles').select('id,store_name')
      .eq('phone_number', phone).maybeSingle();

    const {error} = await sb.from('supervisors').insert([{
      business_id:   S.user.id,
      supervisor_id: existing?.id || null,
      phone_number:  phone,
      name,
      access_level:  access,
      is_active:     true,
    }]);

    setBusy('add-sup-txt', false, `+ ${S.lang==='sw'?'Ongeza Msimamizi':'Add Supervisor'}`);
    if (error) return toast(S.lang==='sw'?'Hitilafu ya kuongeza':'Error adding supervisor','e');

    // Send SMS notification to supervisor
    if (S.isOnline) {
      try {
        const msg = S.lang==='sw'
          ? `Umewekwa msimamizi wa biashara ya ${S.user.store_name} kwenye BomaWave. Ingia kwa: ${window.location.origin}`
          : `You have been added as supervisor for ${S.user.store_name} on BomaWave. Login at: ${window.location.origin}`;
        await fetch(OTP_URL, {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':`Bearer ${SB_KEY}`},
          body: JSON.stringify({action:'send_otp', phone, _notif: msg})
        });
      } catch(e) {}
    }

    toast(S.lang==='sw'?'✅ Msimamizi ameongezwa!':'Supervisor added!','s');
    App.pageSupervisor();
  },

  async removeSupervisor(supId) {
    if (!confirm(S.lang==='sw'?'Ondoa msimamizi huyu?':'Remove this supervisor?')) return;
    await sb.from('supervisors').update({is_active:false}).eq('id', supId);
    toast(S.lang==='sw'?'Msimamizi ameondolewa':'Supervisor removed','s');
    App.pageSupervisor();
  },

  // Supervisor Dashboard — what the boss sees
  async pageSupervisorDash() {
    // Find which business this supervisor monitors
    const {data:supRecord} = await sb.from('supervisors')
      .select('*,profiles!business_id(id,store_name,role,region,district)')
      .eq('phone_number', S.user.phone_number)
      .eq('is_active', true)
      .maybeSingle();

    if (!supRecord) {
      $('av').innerHTML = `<div class="empty"><div class="empty-ic">👔</div>
        <div class="empty-t">${S.lang==='sw'?'Huna biashara unayoangalia':'No business assigned to supervise'}</div></div>`;
      return;
    }

    const bizId   = supRecord.business_id;
    const bizName = supRecord.profiles?.store_name || 'Biashara';
    const period  = 30;
    const startDate = new Date(Date.now()-period*864e5).toISOString().slice(0,10);

    const [{data:sales},{data:exps},{data:orders},{data:debts}] = await Promise.all([
      sb.from('sales').select('revenue,profit,sale_date,product_name,qty').eq('user_id',bizId).gte('sale_date',startDate),
      sb.from('expenses').select('amount,category,expense_date').eq('user_id',bizId).gte('expense_date',startDate),
      sb.from('orders').select('total_price,status').or(`retailer_id.eq.${bizId},distributor_id.eq.${bizId}`),
      sb.from('debts').select('amount,amount_paid,status').eq('user_id',bizId),
    ]);

    const rev30    = (sales||[]).reduce((s,r)=>s+(r.revenue||0),0);
    const profit30 = (sales||[]).reduce((s,r)=>s+(r.profit||0),0);
    const exp30    = (exps||[]).reduce((s,e)=>s+(e.amount||0),0);
    const net30    = profit30 - exp30;
    const totDebt  = (debts||[]).filter(d=>d.status!=='paid').reduce((s,d)=>s+(d.amount-d.amount_paid||0),0);
    const margin   = rev30 > 0 ? (profit30/rev30*100).toFixed(1) : 0;

    // Top 5 products
    const byProd = {};
    (sales||[]).forEach(s=>{
      byProd[s.product_name] = (byProd[s.product_name]||0)+(s.revenue||0);
    });
    const topP = Object.entries(byProd).sort((a,b)=>b[1]-a[1]).slice(0,5);

    $('av').innerHTML = `
      <div class="sup-dash-header">
        <div class="sup-dash-biz">
          <div class="sup-dash-avatar">${bizName[0]}</div>
          <div>
            <div class="sup-dash-name">${bizName}</div>
            <div class="sup-dash-role">👔 ${S.lang==='sw'?'Dashibodi ya Msimamizi':'Supervisor Dashboard'} · ${period}d</div>
          </div>
        </div>
        <span class="pill p-del">${S.lang==='sw'?'Mtazamo tu':'View Only'}</span>
      </div>

      <div class="sr">
        <div class="sc g anim-card"><div class="sic">${svgIcon('revenue')}</div><div class="sl">${S.lang==='sw'?'Mapato':'Revenue'}</div><div class="sv" id="sdrev">TZS 0</div></div>
        <div class="sc ${profit30>=0?'g':'r'} anim-card"><div class="sic">${svgIcon('profit')}</div><div class="sl">${S.lang==='sw'?'Faida':'Profit'}</div><div class="sv" id="sdpro">TZS 0</div></div>
        <div class="sc r anim-card"><div class="sic">${svgIcon('expense')}</div><div class="sl">${S.lang==='sw'?'Matumizi':'Expenses'}</div><div class="sv" id="sdexp">TZS 0</div></div>
        <div class="sc ${net30>=0?'g':'r'} anim-card"><div class="sic">${svgIcon('chart')}</div><div class="sl">Net</div><div class="sv" id="sdnet">TZS 0</div></div>
      </div>

      <!-- Key metrics -->
      <div class="rsec anim-card" style="margin-bottom:1rem">
        <div class="rsec-t">📊 ${S.lang==='sw'?'Viashiria Muhimu':'Key Metrics'} (${period} days)</div>
        <div class="rrow"><span class="rl">Profit Margin</span><span class="rv ${margin>=15?'g':margin>=5?'a':'r'}">${margin}%</span></div>
        <div class="rrow"><span class="rl">${S.lang==='sw'?'Madeni Yanayobaki':'Outstanding Debts'}</span><span class="rv ${totDebt>0?'r':'g'}">${fmt(totDebt)}</span></div>
        <div class="rrow"><span class="rl">${S.lang==='sw'?'Jumla Maagizo':'Total Orders'}</span><span class="rv">${(orders||[]).length}</span></div>
        <div class="rrow div">
          <span class="rl" style="font-weight:800">Net Profit</span>
          <span class="rv ${net30>=0?'g':'r'}" style="font-size:1.1rem;font-weight:800">${fmt(net30)}</span>
        </div>
      </div>

      <!-- Top products -->
      <div class="rsec anim-card">
        <div class="rsec-t">🏆 ${S.lang==='sw'?'Bidhaa Zinazoongoza':'Top Products'}</div>
        ${topP.length ? topP.map(([name,rev],i) => `
          <div class="rrow">
            <span class="rl"><strong>${i+1}.</strong> ${name}</span>
            <span class="rv g">${fmt(rev)}</span>
          </div>`).join('')
        : `<div style="color:var(--s500);text-align:center;padding:.875rem">${S.lang==='sw'?'Hakuna data':'No data'}</div>`}
      </div>
    `;
    staggerCards('.anim-card', 80);
    setTimeout(() => {
      animateCount($('sdrev'), rev30, 'TZS ');
      animateCount($('sdpro'), profit30, 'TZS ');
      animateCount($('sdexp'), exp30, 'TZS ');
      animateCount($('sdnet'), net30, 'TZS ');
    }, 300);
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
    lock:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    star:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    upgrade:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="6" x2="12" y2="18"/></svg>`,
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
const _extraCSS=document.createElement('style');_extraCSS.textContent=`
/* ════════════════════════════════════════════
   BOMAWAVE v4 — ANIMATION & UI SYSTEM
   ════════════════════════════════════════════ */

/* ── Page entry animations ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideLeft{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes popIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes ripple{0%{transform:scale(0);opacity:.6}100%{transform:scale(4);opacity:0}}

/* ── Page container ── */
#av{animation:fadeUp .32s cubic-bezier(.4,0,.2,1)}

/* ── Stat cards staggered ── */
.sc{
  opacity:0;
  animation:fadeUp .4s cubic-bezier(.34,1.4,.64,1) forwards;
  transition:transform .2s,box-shadow .2s;
}
.sc:nth-child(1){animation-delay:.04s}
.sc:nth-child(2){animation-delay:.1s}
.sc:nth-child(3){animation-delay:.16s}
.sc:nth-child(4){animation-delay:.22s}
.sc:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(34,197,94,.18)!important}
.sc.g{box-shadow:0 4px 16px rgba(34,197,94,.12)}
.sc.b{box-shadow:0 4px 16px rgba(37,99,235,.08)}
.sc.a{box-shadow:0 4px 16px rgba(217,119,6,.08)}
.sc.r{box-shadow:0 4px 16px rgba(220,38,38,.08)}

/* ── Stat value pop ── */
.sv{
  animation:countUp .5s cubic-bezier(.34,1.56,.64,1) .3s both;
  letter-spacing:-.5px;
}

/* ── Cards ── */
.card{
  transition:transform .2s,box-shadow .2s,border-color .2s;
  border:1px solid #e8f8ee!important;
}
.card:hover{
  transform:translateY(-2px);
  box-shadow:0 8px 28px rgba(34,197,94,.12)!important;
  border-color:var(--g400)!important;
}

/* ── Anim card ── */
.anim-card{
  opacity:0;
  animation:fadeUp .38s cubic-bezier(.4,0,.2,1) forwards;
}
.anim-card:nth-child(1){animation-delay:.05s}
.anim-card:nth-child(2){animation-delay:.12s}
.anim-card:nth-child(3){animation-delay:.19s}
.anim-card:nth-child(4){animation-delay:.26s}

/* ── Table rows ── */
.dt tr{transition:background .12s}
.dt tr:hover td{background:#f0fdf4!important}
.dt-row{animation:slideRight .3s ease forwards;opacity:0}
.dt-row:nth-child(1){animation-delay:.03s}
.dt-row:nth-child(2){animation-delay:.06s}
.dt-row:nth-child(3){animation-delay:.09s}
.dt-row:nth-child(4){animation-delay:.12s}
.dt-row:nth-child(5){animation-delay:.15s}
.dt-row:nth-child(6){animation-delay:.18s}
.dt-row:nth-child(n+7){animation-delay:.2s}

/* ── Buttons ── */
.btn-p{
  transition:all .2s cubic-bezier(.34,1.56,.64,1)!important;
  position:relative;overflow:hidden;
}
.btn-p::after{
  content:'';position:absolute;inset:0;
  background:rgba(255,255,255,.15);
  opacity:0;transition:opacity .2s;
}
.btn-p:hover:not(:disabled)::after{opacity:1}
.btn-p:active{transform:scale(.97)!important}
.bsm{transition:all .15s;position:relative}
.bsm:hover{transform:translateY(-1px)}
.bsm.g:hover{box-shadow:0 4px 12px rgba(22,163,74,.35)}
.bsm.b:hover{box-shadow:0 4px 12px rgba(37,99,235,.3)}

/* ── Bottom nav ── */
.bni{transition:all .2s cubic-bezier(.34,1.56,.64,1)}
.bni.on{color:var(--g700)}
.bni.on svg{color:var(--g700);filter:drop-shadow(0 0 4px rgba(34,197,94,.4))}
.bni:active{transform:scale(.88)}

/* ── Sidebar nav ── */
.ni{transition:all .18s cubic-bezier(.4,0,.2,1)}
.ni:hover{transform:translateX(3px)}
.ni.on{
  background:rgba(74,222,128,.18)!important;
  border-left:3px solid var(--g500)!important;
  color:#fff!important;
}
.ni.on .nic svg{filter:drop-shadow(0 0 5px rgba(74,222,128,.6))}

/* ── POS tabs ── */
.pos-tab,.ptab{transition:all .2s}
.pos-tab.on,.ptab.on{
  background:#fff!important;
  color:var(--g700)!important;
  box-shadow:0 2px 12px rgba(34,197,94,.15)!important;
}

/* ── Product cards ── */
.pcard{
  transition:all .22s cubic-bezier(.4,0,.2,1);
  animation:fadeUp .35s ease forwards;opacity:0;
}
.pcard:hover{
  transform:translateY(-4px) scale(1.01);
  box-shadow:0 10px 32px rgba(34,197,94,.18);
  border-color:var(--g600)!important;
}
.pcard:nth-child(1){animation-delay:.04s}
.pcard:nth-child(2){animation-delay:.08s}
.pcard:nth-child(3){animation-delay:.12s}
.pcard:nth-child(4){animation-delay:.16s}
.pcard:nth-child(5){animation-delay:.2s}
.pcard:nth-child(n+6){animation-delay:.24s}

/* ── Add to cart button ── */
.adbtn{transition:all .18s cubic-bezier(.34,1.56,.64,1)}
.adbtn:hover{transform:scale(1.15);box-shadow:0 4px 14px rgba(22,163,74,.4)}
.adbtn:active{transform:scale(.9)}

/* ── Cart panel ── */
.cpanel{transition:transform .3s cubic-bezier(.4,0,.2,1)}
.cpi{animation:slideLeft .25s ease forwards}

/* ── Toast ── */
.toast{animation:slideLeft .28s cubic-bezier(.34,1.4,.64,1)}

/* ── Store pick cards ── */
.store-pick-card{transition:all .2s cubic-bezier(.34,1.4,.64,1)}
.store-pick-card:hover{transform:translateX(4px);border-color:var(--g600)!important}
.store-card{transition:all .2s cubic-bezier(.4,0,.2,1)}
.store-card:hover{transform:translateX(3px)}

/* ── Reports bar charts animate ── */
.cat-bar-fill{transition:width 1s cubic-bezier(.4,0,.2,1) .2s}
.cat-bar-fill-init{width:0!important}

/* ── Debt cards ── */
.debt-card{
  animation:fadeUp .35s ease forwards;opacity:0;
  transition:transform .2s,box-shadow .2s;
}
.debt-card:hover{transform:translateX(3px)}
.debt-bar{transition:width .8s cubic-bezier(.4,0,.2,1)}

/* ── POS calc ── */
#pos-calc{animation:popIn .2s ease}

/* ── OTP boxes ── */
.ob{transition:all .15s cubic-bezier(.34,1.56,.64,1)}
.ob.on{transform:scale(1.05);border-color:var(--g600)}
.ob.err{animation:shake .3s ease}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}

/* ── PIN keys ── */
.pk{transition:all .12s cubic-bezier(.34,1.56,.64,1)}
.pk:active{transform:scale(.88);background:var(--g100)}

/* ── PIN dots ── */
.pd{transition:all .18s cubic-bezier(.34,1.56,.64,1)}
.pd.on{transform:scale(1.15);background:var(--g700)}

/* ── Role cards ── */
.rc{transition:all .2s cubic-bezier(.34,1.4,.64,1)}
.rc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.1)}

/* ── Lang buttons ── */
.lang-btn{transition:all .2s cubic-bezier(.34,1.4,.64,1)}
.lang-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.1)}

/* ── Page loading skeleton ── */
.page-loading{
  display:flex;align-items:center;justify-content:center;
  gap:.75rem;height:240px;color:var(--s500);font-size:.95rem;
}

/* ── Skeleton shimmer ── */
.skeleton{
  background:linear-gradient(90deg,#f0f7f0 25%,#e0f5e0 50%,#f0f7f0 75%);
  background-size:200% 100%;
  animation:shimmer 1.5s infinite;
  border-radius:.5rem;
}

/* ── Topbar icon ── */
.tbic{background:var(--g50)!important;transition:all .2s}
.tbic svg{color:var(--g700)}

/* ── Notification dot bounce ── */
.ndot{animation:bounce 2s infinite}

/* ── Sync badge ── */
.sync-pill{animation:pulse 2s infinite}

/* ── Green scrollbar ── */
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-thumb{background:var(--g400);border-radius:3px}
::-webkit-scrollbar-track{background:var(--g50)}

/* ── Ripple on buttons ── */
.btn-p,.pos-record-btn{overflow:hidden;position:relative}

/* ── Mobile POS inputs large ── */
#s-qty,#s-buy,#s-sell,#e-amt{
  font-size:1.25rem!important;font-weight:800!important;text-align:center!important;
}

/* ── Green inputs ── */
.fi{
  border-color:#bbf7d0!important;
  background:#f8fff9!important;
  transition:all .2s!important;
}
.fi:focus{
  border-color:var(--g600)!important;
  background:#fff!important;
  box-shadow:0 0 0 3px rgba(34,197,94,.15)!important;
}

/* ── Category chips ── */
.cat-chip{transition:all .15s;cursor:pointer}
.cat-chip:hover{border-color:var(--g600);background:var(--g50);transform:scale(1.02)}
.cat-chip.on{border-color:var(--g700);background:var(--g100);color:var(--g900)}

/* ── Report bars ── */
.cat-bar-row{display:grid;grid-template-columns:110px 1fr 90px;gap:.5rem;align-items:center;margin-bottom:.65rem;font-size:.88rem}
.cat-bar-track{height:8px;background:var(--g100);border-radius:4px;overflow:hidden}
.cat-bar-fill{height:100%;background:linear-gradient(90deg,var(--g700),var(--g500));border-radius:4px;transition:width 1s cubic-bezier(.4,0,.2,1) .3s}
.cat-bar-val{text-align:right;color:var(--g700);font-weight:700}
.cat-bar-label{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ── Primary store checkbox ── */
.primary-check{background:var(--g50)!important;border-color:var(--g100)!important}
.primary-check input{accent-color:var(--g700)}

/* ── Offline banner ── */
.offline-banner{animation:pulse 2s infinite}

/* ── Mobile responsive ── */
@media(max-width:768px){
  .rep-grid{display:flex;flex-direction:column}
  .pos-3col{grid-template-columns:1fr 1fr}
  .cat-bar-row{grid-template-columns:80px 1fr 70px}
  .action-bar{flex-direction:column}
}
@media(max-width:480px){
  .pos-3col{grid-template-columns:1fr}
  .pos-3grid{grid-template-columns:1fr}
}

/* ── Supervisor Feature ── */
.sup-hero{display:flex;align-items:center;gap:1rem;background:linear-gradient(135deg,var(--g700),var(--g600));border-radius:var(--rl);padding:1.25rem;margin-bottom:1.25rem;color:#fff}
.sup-hero-icon{font-size:2.5rem;flex-shrink:0}
.sup-hero-title{font-size:1.05rem;font-weight:800;margin-bottom:.25rem}
.sup-hero-sub{font-size:.78rem;color:rgba(255,255,255,.8);line-height:1.5}
.sup-card{display:flex;align-items:center;gap:.875rem;background:#fff;border:1.5px solid var(--g100);border-radius:var(--rl);padding:1rem;margin-bottom:.75rem;transition:all .2s}
.sup-card:hover{border-color:var(--g400);box-shadow:0 4px 16px rgba(34,197,94,.12)}
.sup-avatar{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--g600),var(--g500));color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;flex-shrink:0}
.sup-info{flex:1}
.sup-name{font-size:.95rem;font-weight:800;color:var(--s900)}
.sup-phone{font-size:.8rem;color:var(--s500);margin:.1rem 0}
.sup-access{font-size:.78rem;margin-top:.2rem}
/* Supervisor Dashboard */
.sup-dash-header{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,var(--g900),var(--g700));border-radius:var(--rl);padding:1.1rem 1.25rem;margin-bottom:1.1rem;color:#fff}
.sup-dash-biz{display:flex;align-items:center;gap:.875rem}
.sup-dash-avatar{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;flex-shrink:0}
.sup-dash-name{font-size:1rem;font-weight:800}
.sup-dash-role{font-size:.75rem;color:rgba(255,255,255,.75);margin-top:.15rem}
/* Reports KPI cards */
.rep-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;margin-bottom:1.1rem}
.rep-kpi{background:#fff;border-radius:var(--rl);padding:1rem;border:1.5px solid var(--g100);animation:fadeUp .4s ease forwards;opacity:0}
.rep-kpi:nth-child(1){animation-delay:.05s}.rep-kpi:nth-child(2){animation-delay:.1s}
.rep-kpi:nth-child(3){animation-delay:.15s}.rep-kpi:nth-child(4){animation-delay:.2s}
.rep-kpi.green{border-left:4px solid var(--g600)}
.rep-kpi.red{border-left:4px solid var(--red)}
.rep-kpi.blue{border-left:4px solid var(--b700)}
.rep-kpi-label{font-size:.68rem;font-weight:700;color:var(--s500);text-transform:uppercase;letter-spacing:.75px;margin-bottom:.35rem}
.rep-kpi-val{font-size:1.3rem;font-weight:800;color:var(--s900);letter-spacing:-.5px;line-height:1}
.rep-kpi-sub{font-size:.72rem;color:var(--s500);margin-top:.25rem}
/* Top products */
.top-prod-row{display:flex;align-items:flex-start;gap:.75rem;margin-bottom:.875rem}
.top-prod-rank{width:24px;height:24px;border-radius:50%;background:var(--g100);color:var(--g700);font-size:.78rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.15rem}
.top-prod-info{flex:1}
.top-prod-name{font-size:.9rem;font-weight:700;margin-bottom:.3rem}
.top-prod-bar-wrap{height:7px;background:var(--g100);border-radius:4px;overflow:hidden;margin-bottom:.25rem}
.top-prod-bar{height:100%;border-radius:4px;transition:width 1s cubic-bezier(.4,0,.2,1) .3s}
.top-prod-meta{display:flex;gap:.875rem;font-size:.75rem;flex-wrap:wrap}
/* Trend chart */
.trend-wrap{display:flex;align-items:flex-end;gap:4px;height:100px;padding:.5rem 0;overflow-x:auto}
.trend-col{display:flex;flex-direction:column;align-items:center;gap:.25rem;min-width:28px}
.trend-bar{background:linear-gradient(to top,var(--g700),var(--g500));border-radius:3px 3px 0 0;width:20px;transition:height .8s cubic-bezier(.4,0,.2,1);cursor:pointer}
.trend-bar:hover{background:linear-gradient(to top,var(--g900),var(--g600))}
.trend-label{font-size:.55rem;color:var(--s500);white-space:nowrap}
/* Period tabs */
.rep-period-tabs{display:flex;gap:.35rem;margin-bottom:1.1rem;flex-wrap:wrap}
@media(max-width:768px){
  .rep-kpis{grid-template-columns:repeat(2,1fr)}
  .top-prod-meta{gap:.5rem}
}


/* ── POS Specific Styles ── */
.pos-3grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.65rem}
.pos-big-input{font-size:1.2rem!important;font-weight:800!important;text-align:center!important;padding:.9rem!important}
.pos-calc-card{background:linear-gradient(135deg,var(--g50),#f0fff4);border:1.5px solid var(--g100);border-radius:.75rem;padding:1rem 1.1rem;margin:.25rem 0}
.pos-calc-row{display:flex;justify-content:space-between;align-items:center;padding:.3rem 0;font-size:.92rem;border-bottom:1px solid var(--g100)}
.pos-calc-row:last-child{border-bottom:none}
.pos-rec-btn{width:100%;padding:1.1rem;border:none;border-radius:.875rem;font-family:'DM Sans',sans-serif;font-size:1.05rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;transition:all .2s;min-height:56px;letter-spacing:.3px;margin-top:.25rem}
.pos-rec-btn.green{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;box-shadow:0 6px 20px rgba(34,197,94,.35)}
.pos-rec-btn.green:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(34,197,94,.45)}
.pos-rec-btn.red{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;box-shadow:0 6px 20px rgba(220,38,38,.25)}
.pos-rec-btn.red:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(220,38,38,.35)}
.pos-rec-btn:active{transform:scale(.97)!important}
.offline-banner{background:linear-gradient(135deg,var(--ambl),#fef9c3);border:1.5px solid #fde68a;border-radius:.75rem;padding:.8rem 1.1rem;margin-bottom:1rem;font-size:.9rem;font-weight:700;color:var(--amber);display:flex;align-items:center;gap:.5rem}
.offline-tr{background:#fffbeb!important}
@media(max-width:640px){.pos-3grid{grid-template-columns:1fr 1fr}}
@media(max-width:420px){.pos-3grid{grid-template-columns:1fr}}


/* ── Subscription + Trial + Locked ── */
@keyframes confetti-pop{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}
#dev-otp-banner{position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1d4ed8,#2563eb);transform:translateY(-100%);transition:transform .4s cubic-bezier(.34,1.4,.64,1);box-shadow:0 4px 20px rgba(0,0,0,.3)}
#dev-otp-banner.show{transform:translateY(0)}
.dev-otp-inner{display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.25rem;gap:1rem;flex-wrap:wrap}
.dev-otp-label{font-size:.72rem;font-weight:700;color:rgba(255,255,255,.8);margin-bottom:.2rem}
.dev-otp-code{font-size:1.8rem;font-weight:900;letter-spacing:6px;font-family:monospace;color:#fff}
.dev-otp-actions{display:flex;gap:.4rem}
.dev-otp-btn{background:rgba(255,255,255,.9);border:none;color:#1d4ed8;padding:.5rem 1rem;border-radius:.5rem;font-size:.82rem;font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif}
.dev-otp-close{background:rgba(255,255,255,.15);border:none;color:#fff;width:32px;height:32px;border-radius:.4rem;cursor:pointer}
.sub-current{background:linear-gradient(135deg,var(--g700),var(--g600));border-radius:var(--rl);padding:1.25rem 1.5rem;margin-bottom:1.5rem;color:#fff;text-align:center}
.sub-cur-label{font-size:.68rem;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:1px;margin-bottom:.3rem}
.sub-cur-plan{font-size:1.6rem;font-weight:900;margin-bottom:.2rem}
.sub-cur-price{font-size:.88rem;opacity:.85}
.sub-plans{display:flex;flex-direction:column;gap:.875rem;margin-bottom:1.5rem}
.sub-plan-card{background:#fff;border:2px solid var(--s200);border-radius:var(--rl);padding:1.25rem;position:relative;transition:all .2s;animation:fadeUp .3s ease forwards;opacity:0}
.sub-plan-card.current{border-color:var(--g600);box-shadow:0 4px 20px rgba(34,197,94,.15)}
.sub-plan-card.popular{border-color:var(--amber)}
.sub-popular-badge{display:inline-flex;align-items:center;gap:.3rem;background:var(--amber);color:#fff;font-size:.65rem;font-weight:800;padding:3px 12px;border-radius:20px;margin-bottom:.65rem}
.sub-plan-name{font-size:.78rem;font-weight:800;color:var(--s500);text-transform:uppercase;letter-spacing:.75px;margin-bottom:.3rem}
.sub-plan-price{font-size:1.45rem;font-weight:900;color:var(--s900);margin-bottom:.875rem;line-height:1}
.sub-plan-price span{font-size:.72rem;color:var(--s500);font-weight:600}
.sub-plan-features{margin-bottom:.875rem}
.sub-feat{display:flex;align-items:flex-start;gap:.4rem;font-size:.75rem;color:var(--s700);margin-bottom:.3rem;line-height:1.4}
.sub-feat-icon{flex-shrink:0}.sub-feat-icon.yes{color:var(--g700)}.sub-feat-icon.no{color:var(--s300)}
.sub-plan-btn{width:100%;padding:.75rem;border-radius:.65rem;border:2px solid var(--s300);background:#fff;font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:800;cursor:pointer;transition:all .2s;color:var(--s700)}
.sub-plan-btn:hover:not(.current-btn){border-color:var(--g600);color:var(--g700)}
.sub-plan-btn.current-btn{background:var(--g50);border-color:var(--g600);color:var(--g700);cursor:default}
.sub-plan-btn.pro-btn{background:linear-gradient(135deg,#16a34a,#22c55e);border:none;color:#fff;box-shadow:0 4px 14px rgba(34,197,94,.3)}
.sub-coming-soon{background:var(--b50);border:1px solid var(--b100);border-radius:var(--rl);padding:1rem 1.25rem;font-size:.85rem;color:var(--b900);line-height:1.6;display:flex;gap:.5rem}
.trial-banner{background:linear-gradient(135deg,#d97706,#f59e0b);border-radius:var(--rl);padding:.875rem 1.25rem;margin-bottom:1rem;color:#fff;display:flex;align-items:center;justify-content:space-between;font-size:.9rem;font-weight:700}
.trial-banner.big{padding:1.1rem 1.5rem;margin-bottom:1.25rem}
.locked-page{text-align:center;padding:4rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:.875rem}
.locked-page-icon{color:var(--amber)}
.locked-page-title{font-size:1.2rem;font-weight:800}
.locked-page-sub{font-size:.9rem;color:var(--s500);max-width:280px;line-height:1.6}
.locked-page-price{font-size:1.4rem;font-weight:900;color:var(--g700)}
.ni-lock{margin-left:auto;opacity:.5;display:flex;align-items:center}
.limit-badge{background:var(--ambl);color:var(--amber);font-size:.68rem;font-weight:800;padding:2px 8px;border-radius:20px;margin-left:.4rem}

`;document.head.appendChild(_extraCSS);
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
