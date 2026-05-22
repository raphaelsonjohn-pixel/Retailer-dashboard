/* ════════════════════════════════════════════════════════════
   BOMAWAVE v6 — app.js
   Stack: Vanilla JS + Supabase + AfricasTalking + IndexedDB
   Auth: OTP once → persistent session → WebAuthn guard
   Roles: retailer | distributor | staff (manager/cashier/sales/viewer)
════════════════════════════════════════════════════════════ */

'use strict';

/* ─── SUPABASE CONFIG ─── */
const SB_URL = 'https://YOUR_PROJECT.supabase.co';
const SB_KEY = 'YOUR_ANON_KEY';
const sb = supabase.createClient(SB_URL, SB_KEY);

/* ─── AFRICASTALKING OTP ─── */
const AT_URL = 'https://YOUR_EDGE_FUNCTION.supabase.co/functions/v1/send-otp';

/* ─── SESSION KEY ─── */
const SESSION_KEY = 'bw_v6';
const BIOMETRIC_KEY = 'bw_bio_cred';

/* ─── TANZANIAN REGIONS / DISTRICTS ─── */
const LOC = {
  'Dar es Salaam':['Ilala','Kinondoni','Temeke','Ubungo','Kigamboni'],
  'Arusha':['Arusha City','Arusha Rural','Karatu','Longido','Meru','Monduli','Ngorongoro'],
  'Mwanza':['Ilemela','Kwimba','Magu','Misungwi','Nyamagana','Sengerema','Ukerewe'],
  'Dodoma':['Dodoma Urban','Bahi','Chamwino','Chemba','Kondoa','Kongwa','Mpwapwa'],
  'Mbeya':['Mbeya City','Busokelo','Chunya','Kyela','Mbarali','Mbeya Rural','Mbozi','Momba','Rungwe'],
  'Morogoro':['Morogoro Urban','Gairo','Ifakara','Kilombero','Kilosa','Malinyi','Mvomero','Ulanga'],
  'Tanga':['Tanga City','Handeni','Kilindi','Korogwe','Lushoto','Mkinga','Muheza','Pangani'],
  'Zanzibar Urban/West':["Mjini","Magharibi"],
  'Kigoma':['Kigoma Urban','Buhigwe','Kakonko','Kasulu','Kibondo','Uvinza'],
  'Kagera':['Bukoba Urban','Biharamulo','Bukoba Rural','Karagwe','Kyerwa','Missenyi','Muleba','Ngara'],
  'Kilimanjaro':['Moshi Urban','Hai','Moshi Rural','Mwanga','Rombo','Same','Siha'],
  'Pwani':['Bagamoyo','Kibaha','Kisarawe','Mafia','Mkuranga','Rufiji'],
  'Lindi':['Lindi Urban','Kilwa','Lindi Rural','Liwale','Nachingwea','Ruangwa'],
  'Mtwara':['Mtwara Urban','Masasi','Mtwara Rural','Nanyumbu','Newala','Tandahimba'],
  'Ruvuma':['Songea Urban','Mbinga','Namtumbo','Nyasa','Songea Rural','Tunduru'],
  'Iringa':['Iringa Urban','Kilolo','Mafinga','Mufindi'],
  'Singida':['Singida Urban','Ikungi','Iramba','Manyoni','Mkalama'],
  'Tabora':['Tabora Urban','Igunga','Kaliua','Nzega','Sikonge','Urambo','Uyui'],
  'Shinyanga':['Shinyanga Urban','Kahama','Kishapu','Shinyanga Rural'],
  'Geita':['Geita','Bukombe','Chato','Mbogwe','Nyang\'hwale'],
  'Simiyu':['Bariadi','Busega','Itilima','Maswa','Meatu'],
  'Njombe':['Njombe Urban','Ludewa','Makamba','Makete','Njombe Rural','Wanging\'ombe'],
  'Songwe':['Mbozi','Momba','Songwe','Vwawa'],
  'Katavi':['Mpanda Urban','Mlele','Mpanda Rural','Nsimbo'],
  'Rukwa':['Sumbawanga Urban','Kalambo','Nkasi','Sumbawanga Rural'],
  'Mara':['Musoma Urban','Bunda','Butiama','Musoma Rural','Rorya','Serengeti','Tarime'],
  'Manyara':['Babati Urban','Babati Rural','Hanang','Kiteto','Mbulu','Simanjiro'],
};

/* ─── PRODUCT CATEGORIES ─── */
const CATS = [
  {id:'all',name:'Zote',icon:'🛒'},
  {id:'unga',name:'Nafaka',icon:'🌾'},
  {id:'mafuta',name:'Mafuta',icon:'🫙'},
  {id:'sukari',name:'Sukari/Chumvi',icon:'🧂'},
  {id:'vinywaji',name:'Vinywaji',icon:'🥤'},
  {id:'usafi',name:'Usafi',icon:'🧴'},
  {id:'nyama',name:'Nyama/Samaki',icon:'🐟'},
  {id:'mboga',name:'Mboga/Matunda',icon:'🥬'},
  {id:'madawa',name:'Madawa',icon:'💊'},
  {id:'nyingine',name:'Nyingine',icon:'📦'},
];

/* ─── STAFF ROLES ─── */
const ROLES = {
  owner:   {label:'Mmiliki',    badge:'rb-owner',   icon:'👑', perms:['all']},
  manager: {label:'Meneja',     badge:'rb-manager', icon:'🎯', perms:['orders','products','staff','reports','pos','invoices']},
  cashier: {label:'Cashier',    badge:'rb-cashier', icon:'💰', perms:['pos','orders']},
  sales:   {label:'Mauzo',      badge:'rb-sales',   icon:'📦', perms:['orders','products']},
  viewer:  {label:'Mtazamaji',  badge:'rb-viewer',  icon:'👁️', perms:['reports']},
};

/* ════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════ */
const State = {
  session: null,      // loaded from localStorage
  lang: 'sw',
  role: null,         // 'retailer' | 'distributor'
  cart: [],           // retailer marketplace cart
  posCart: [],        // retailer pos cart
  dPosCart: [],       // distributor pos cart
  lastScreen: null,
  currentScreen: 'lang',
  distPeriod: '7',
  dOrdersFilter: 'all',
  staffFilter: 'all',
  invoicesFilter: 'all',
  deferredPWA: null,
  currentDoc: null,   // {type:'receipt'|'invoice', data:{}}
  pendingOtp: null,
};

/* ════════════════════════════════════════════════════════════
   INDEXEDDB — OFFLINE POS
════════════════════════════════════════════════════════════ */
let posDB = null;

function initPosDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('bomawave_pos', 2);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sales')) {
        const s = db.createObjectStore('sales', {keyPath:'id',autoIncrement:true});
        s.createIndex('synced','synced',{unique:false});
        s.createIndex('ts','ts',{unique:false});
      }
    };
    req.onsuccess = e => { posDB = e.target.result; res(); };
    req.onerror = () => rej(req.error);
  });
}

function posDbAdd(record) {
  return new Promise((res, rej) => {
    const tx = posDB.transaction('sales','readwrite');
    const req = tx.objectStore('sales').add({...record, synced:0, ts: Date.now()});
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function posDbGetAll() {
  return new Promise((res, rej) => {
    const tx = posDB.transaction('sales','readonly');
    const req = tx.objectStore('sales').getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function posDbMarkSynced(id) {
  return new Promise((res, rej) => {
    const tx = posDB.transaction('sales','readwrite');
    const store = tx.objectStore('sales');
    const get = store.get(id);
    get.onsuccess = () => {
      const rec = get.result;
      if (rec) { rec.synced = 1; store.put(rec); }
      res();
    };
    get.onerror = () => rej(get.error);
  });
}

async function syncOfflineData() {
  if (!navigator.onLine || !posDB || !State.session) return;
  try {
    const all = await posDbGetAll();
    const unsynced = all.filter(r => r.synced === 0);
    for (const rec of unsynced) {
      const {id: localId, synced, ts, ...payload} = rec;
      const {error} = await sb.from('pos_sales').insert({
        ...payload,
        user_id: State.session.user_id,
        created_at: new Date(ts).toISOString(),
      });
      if (!error) await posDbMarkSynced(localId);
    }
  } catch(e) { console.warn('Sync failed:', e); }
}

/* ════════════════════════════════════════════════════════════
   UTILITIES
════════════════════════════════════════════════════════════ */
const fmt = n => 'TZS ' + Number(n||0).toLocaleString('en-TZ');
const fmtShort = n => {
  n = Number(n||0);
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(0)+'K';
  return String(n);
};
const genRef = () => 'BW-' + Date.now().toString(36).toUpperCase();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return State.lang === 'sw' ? 'Habari ya asubuhi,' : 'Good morning,';
  if (h < 17) return State.lang === 'sw' ? 'Habari ya mchana,' : 'Good afternoon,';
  return State.lang === 'sw' ? 'Habari ya jioni,' : 'Good evening,';
}

function initials(name) {
  return (name||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

/* Haversine distance (km) */
function haversine(lat1,lon1,lat2,lon2) {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

/* ─── TOAST ─── */
let toastTimer;
function toast(msg, type='info', icon='ℹ️') {
  const el = document.getElementById('toast');
  el.className = 't-'+type;
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-msg').textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ─── ANIMATE COUNT ─── */
function animateCount(el, target, prefix='', suffix='') {
  if (!el) return;
  const start = 0, dur = 600, step = 16;
  let cur = start;
  const inc = (target - start) / (dur / step);
  const t = setInterval(() => {
    cur = Math.min(cur + inc, target);
    el.textContent = prefix + Math.round(cur).toLocaleString('en-TZ') + suffix;
    if (cur >= target) clearInterval(t);
  }, step);
}

/* ════════════════════════════════════════════════════════════
   SCREEN NAVIGATION
════════════════════════════════════════════════════════════ */
function showScreen(id) {
  const cur = document.getElementById('screen-' + State.currentScreen);
  if (cur) cur.classList.add('hidden');
  State.lastScreen = State.currentScreen;
  State.currentScreen = id;
  const next = document.getElementById('screen-' + id);
  if (next) next.classList.remove('hidden');

  // Lazy load data on screen entry
  const loaders = {
    'r-market': loadMarket,
    'r-orders': loadROrders,
    'r-pos': loadPOS,
    'r-reports': () => App.loadRRep('today', document.querySelector('#screen-r-reports .period-tab')),
    'r-cart': renderCart,
    'd-home': loadDHome,
    'd-products': loadDProducts,
    'd-orders': () => loadDOrders(State.dOrdersFilter),
    'd-reports': () => App.loadDRep('today', document.querySelector('#screen-d-reports .period-tab')),
    'd-staff': loadDStaff,
    'd-invoices': loadDInvoices,
    'd-pos': loadDPos,
    'd-boss': loadBossMode,
    'd-notifs': loadNotifs,
  };
  if (loaders[id]) loaders[id]();
}

const App = {};
App.showScreen = showScreen;
App.goBack = () => showScreen(State.lastScreen || (State.session?.role === 'distributor' ? 'd-home' : 'r-home'));

/* ════════════════════════════════════════════════════════════
   BOTTOM NAV HELPERS
════════════════════════════════════════════════════════════ */
App.rBnav = (page, btn) => {
  document.querySelectorAll('#screen-r-'+State.currentScreen.split('-')[1]+' .bnav-btn, .bnav .bnav-btn').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  App.rNav(page);
};
App.rNav = page => showScreen('r-' + page);
App.dBnav = (page, btn) => {
  if (btn) {
    btn.closest('.bnav').querySelectorAll('.bnav-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  }
  App.dNav(page);
};
App.dNav = page => showScreen('d-' + page);

/* ════════════════════════════════════════════════════════════
   MODAL
════════════════════════════════════════════════════════════ */
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('show');
}
App.closeModal = e => {
  if (e.target.id === 'modal-overlay') document.getElementById('modal-overlay').classList.remove('show');
};
function closeModal() { document.getElementById('modal-overlay').classList.remove('show'); }

/* ════════════════════════════════════════════════════════════
   ONBOARDING — LANGUAGE + ROLE + DETAILS + OTP + BIOMETRIC
════════════════════════════════════════════════════════════ */
App.setLang = lang => {
  State.lang = lang;
  document.getElementById('lc-sw').classList.toggle('sel', lang === 'sw');
  document.getElementById('lc-en').classList.toggle('sel', lang === 'en');
};

App.goStep = step => showScreen(step);

App.setRole = role => {
  State.role = role;
  document.getElementById('rc-retailer').classList.toggle('sel', role === 'retailer');
  document.getElementById('rc-dist').classList.toggle('sel', role === 'distributor');
};

/* Populate region dropdown */
function populateRegions() {
  const sel = document.getElementById('sel-region');
  sel.innerHTML = '<option value="">-- Chagua Mkoa --</option>';
  Object.keys(LOC).sort().forEach(r => {
    const o = document.createElement('option');
    o.value = r; o.textContent = r;
    sel.appendChild(o);
  });
}

App.loadDistricts = () => {
  const region = document.getElementById('sel-region').value;
  const grp = document.getElementById('district-grp');
  const sel = document.getElementById('sel-district');
  if (!region) { grp.style.display='none'; return; }
  grp.style.display='';
  sel.innerHTML = '<option value="">-- Chagua Wilaya --</option>';
  (LOC[region]||[]).forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    sel.appendChild(o);
  });
};

App.sendOtp = async () => {
  const name = document.getElementById('inp-name').value.trim();
  const biz  = document.getElementById('inp-biz').value.trim();
  const phone = document.getElementById('inp-phone').value.trim();
  const region = document.getElementById('sel-region').value;

  if (!name || !biz || !phone || !region) {
    toast(State.lang==='sw'?'Jaza sehemu zote':'Fill all fields','error','⚠️'); return;
  }

  const btn = document.getElementById('btn-send-otp');
  btn.disabled = true;
  btn.textContent = '⏳ Inatuma...';

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  State.pendingOtp = { otp, name, biz, phone, region, district: document.getElementById('sel-district').value };

  try {
    const res = await fetch(AT_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({phone, message:`BomaWave OTP yako: ${otp}. Halali dakika 10.`}),
    });
    if (!res.ok) throw new Error('AT failed');
    toast(State.lang==='sw'?'OTP imetumwa!':'OTP sent!','success','✅');
  } catch {
    // Dev fallback
    showDevBanner(otp);
    toast('Dev mode — OTP imeoneshwa chini','info','🔧');
  }

  btn.disabled = false;
  btn.textContent = State.lang==='sw' ? 'Tuma OTP →' : 'Send OTP →';
  showScreen('otp');
};

App.otpNext = idx => {
  const val = document.getElementById('otp-'+idx).value;
  if (val && idx < 5) document.getElementById('otp-'+(idx+1)).focus();
  if (idx === 5 && val) App.verifyOtp();
};

App.verifyOtp = async () => {
  const entered = [0,1,2,3,4,5].map(i => document.getElementById('otp-'+i).value).join('');
  if (entered.length < 6) { toast('Ingiza namba 6 zote','error','⚠️'); return; }

  const btn = document.getElementById('btn-verify');
  btn.disabled = true;
  btn.textContent = '⏳ Inathibitisha...';

  if (entered !== State.pendingOtp?.otp) {
    toast(State.lang==='sw'?'OTP si sahihi':'Wrong OTP','error','❌');
    btn.disabled = false;
    btn.textContent = State.lang==='sw' ? 'Thibitisha' : 'Verify';
    return;
  }

  // Create or find user in Supabase
  await registerOrLoginUser();
  btn.disabled = false;
  btn.textContent = State.lang==='sw' ? 'Thibitisha' : 'Verify';
};

async function registerOrLoginUser() {
  const {name, biz, phone, region, district, otp} = State.pendingOtp;
  const role = State.role || 'retailer';

  // Check if user exists
  let {data: existing} = await sb
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  let user;
  if (existing) {
    user = existing;
    // Update last login
    await sb.from('users').update({last_login: new Date().toISOString()}).eq('id', user.id);
  } else {
    // New user
    const {data: newUser, error} = await sb.from('users').insert({
      name, business_name: biz, phone, region, district, role,
      lang: State.lang,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    }).select().single();

    if (error) {
      toast('Hitilafu ya kuunda akaunti','error','❌');
      console.error(error);
      return;
    }
    user = newUser;
  }

  // Save session
  const session = { user_id: user.id, name: user.name, biz: user.business_name, phone: user.phone, role: user.role, region: user.region, district: user.district, lang: user.lang || 'sw' };
  State.session = session;
  State.lang = session.lang;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  dismissDev();

  // Go to biometric setup
  showScreen('biometric');
}

App.resendOtp = () => {
  [0,1,2,3,4,5].forEach(i => { document.getElementById('otp-'+i).value = ''; });
  document.getElementById('otp-0').focus();
  App.sendOtp(); // retrigger from state
};

/* ════════════════════════════════════════════════════════════
   BIOMETRIC / WEBAUTHN
════════════════════════════════════════════════════════════ */
App.setupBiometric = async () => {
  if (!window.PublicKeyCredential) {
    toast('Simu hii haisaidii biometric','info','ℹ️');
    App.skipBiometric(); return;
  }
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'BomaWave', id: location.hostname || 'localhost' },
        user: {
          id: new TextEncoder().encode(State.session.user_id),
          name: State.session.phone,
          displayName: State.session.name,
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      }
    });
    localStorage.setItem(BIOMETRIC_KEY, bufferToBase64(cred.rawId));
    toast('Biometric imewekwa!','success','🔐');
    launchApp();
  } catch (e) {
    console.warn('WebAuthn create failed:', e);
    toast('Biometric imeshindwa, ruka tu','info','ℹ️');
    launchApp();
  }
};

App.skipBiometric = () => launchApp();

App.triggerBiometric = async () => {
  const credId = localStorage.getItem(BIOMETRIC_KEY);
  if (!credId || !window.PublicKeyCredential) {
    // No biometric set — just hide guard
    hideAuthGuard(); return;
  }
  try {
    await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: base64ToBuffer(credId) }],
        userVerification: 'required',
        timeout: 60000,
      }
    });
    hideAuthGuard();
  } catch (e) {
    console.warn('Auth failed:', e);
    toast(State.lang==='sw'?'Uthibitisho umeshindwa':'Authentication failed','error','❌');
  }
};

function showAuthGuard(msg) {
  document.getElementById('ag-msg').textContent = msg || 'Thibitisha utambulisho wako';
  document.getElementById('auth-guard').classList.add('show');
}
function hideAuthGuard() {
  document.getElementById('auth-guard').classList.remove('show');
}

function bufferToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function base64ToBuffer(b64) {
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0)).buffer;
}

/* ════════════════════════════════════════════════════════════
   DEV OTP BANNER
════════════════════════════════════════════════════════════ */
function showDevBanner(otp) {
  document.getElementById('dev-otp-val').textContent = otp;
  document.getElementById('dev-banner').classList.add('show');
}
function dismissDev() { document.getElementById('dev-banner').classList.remove('show'); }
App.dismissDev = dismissDev;

/* ════════════════════════════════════════════════════════════
   PWA
════════════════════════════════════════════════════════════ */
function initPWA() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    State.deferredPWA = e;
  });
}

function tryShowPWA() {
  const dismissed = localStorage.getItem('bw_pwa_dismissed');
  if (dismissed) return;

  const ua = navigator.userAgent;
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode:standalone)').matches;

  if (isStandalone) return; // already installed

  const banner = document.getElementById('pwa-banner');
  const installBtn = document.getElementById('pwa-install-btn');

  if (isSafari || isIOS) {
    document.getElementById('pwa-title').textContent = 'Ongeza kwenye Home Screen';
    document.getElementById('pwa-sub').textContent = 'Gusa 📤 → "Add to Home Screen"';
    installBtn.textContent = '👆 Jinsi ya Kuinstall';
    installBtn.onclick = () => {
      openModal(`
        <div class="modal-title">📲 Jinsi ya Kuinstall (Safari)</div>
        <div style="font-size:14px;color:var(--text2);line-height:1.8">
          <div style="margin-bottom:12px">Fuata hatua hizi kwenye Safari:</div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;background:var(--d600);padding:10px;border-radius:8px">
            <span style="font-size:24px">1️⃣</span>
            <span>Gusa kitufe cha <strong>📤 Share</strong> chini ya skrini</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;background:var(--d600);padding:10px;border-radius:8px">
            <span style="font-size:24px">2️⃣</span>
            <span>Chagua <strong>"Add to Home Screen"</strong></span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;background:var(--d600);padding:10px;border-radius:8px">
            <span style="font-size:24px">3️⃣</span>
            <span>Gusa <strong>"Add"</strong> kwenye kona ya juu kulia</span>
          </div>
        </div>
        <button class="btn btn-primary mt-16" onclick="closeModal()">Nimeelewa ✓</button>
      `);
    };
    banner.classList.add('show');
  } else if (State.deferredPWA) {
    banner.classList.add('show');
  }
}

App.pwaInstall = async () => {
  if (State.deferredPWA) {
    State.deferredPWA.prompt();
    const {outcome} = await State.deferredPWA.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('bw_pwa_dismissed','1');
      document.getElementById('pwa-banner').classList.remove('show');
      toast('App imewekwa!','success','🎉');
    }
    State.deferredPWA = null;
  }
};

App.pwaDismiss = () => {
  document.getElementById('pwa-banner').classList.remove('show');
  localStorage.setItem('bw_pwa_dismissed','1');
};

/* ════════════════════════════════════════════════════════════
   LAUNCH APP — after auth
════════════════════════════════════════════════════════════ */
function launchApp() {
  const sess = State.session;
  if (!sess) return;

  // Subscribe to realtime notifications
  subscribeRealtime();

  if (sess.role === 'distributor') {
    // Set distributor UI
    document.getElementById('d-biz-topbar').textContent = sess.biz || 'BomaWave';
    showScreen('d-home');
    loadDHome();
    // Auth guard on dashboard
    showAuthGuard(State.lang==='sw'?'Thibitisha kuingia kwenye dashibodi':'Verify to open dashboard');
  } else {
    showScreen('r-home');
    loadRHome();
    showAuthGuard(State.lang==='sw'?'Thibitisha kuingia':'Verify to open');
  }
}

/* ════════════════════════════════════════════════════════════
   SESSION RESTORE
════════════════════════════════════════════════════════════ */
function restoreSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  try {
    State.session = JSON.parse(raw);
    State.lang = State.session.lang || 'sw';
    return true;
  } catch { return false; }
}

/* ════════════════════════════════════════════════════════════
   SUPABASE REALTIME
════════════════════════════════════════════════════════════ */
function subscribeRealtime() {
  if (!State.session) return;
  const userId = State.session.user_id;
  const role = State.session.role;

  // Distributor: listen for new orders
  if (role === 'distributor') {
    sb.channel('dist-orders-' + userId)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'orders', filter:'distributor_id=eq.'+userId }, payload => {
        showOrderNotif(payload.new);
        loadDHome();
      })
      .subscribe();
  }
  // Retailer: listen for order status updates
  if (role === 'retailer') {
    sb.channel('retailer-orders-' + userId)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'orders', filter:'retailer_id=eq.'+userId }, payload => {
        updateOrderStatus(payload.new);
        loadROrders();
      })
      .subscribe();
  }
}

function showOrderNotif(order) {
  toast(`Oda mpya: ${order.ref_number}`, 'info', '🛒');
  // Red dot on bell
  document.getElementById('d-notif-btn')?.classList.add('bnav-dot');
}

function updateOrderStatus(order) {
  const label = {confirmed:'Imethibitishwa',in_transit:'Safarini',delivered:'Imewasilishwa'}[order.status];
  if (label) toast(`Oda ${order.ref_number}: ${label}`, 'success', '📦');
}

/* ════════════════════════════════════════════════════════════
   RETAILER HOME
════════════════════════════════════════════════════════════ */
async function loadRHome() {
  const sess = State.session;
  document.getElementById('r-greet').textContent = greeting();
  document.getElementById('r-uname').textContent = sess.name || 'Mtumiaji';
  document.getElementById('r-pav').textContent = initials(sess.name);
  document.getElementById('r-pname').textContent = sess.name;
  document.getElementById('r-pphone').textContent = sess.phone;

  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const {data: sales} = await sb.from('pos_sales')
      .select('total')
      .eq('user_id', sess.user_id)
      .gte('created_at', today.toISOString());
    const total = (sales||[]).reduce((a,s)=>a+Number(s.total),0);
    animateCount(document.getElementById('r-today-sales'), total, 'TZS ');

    const {count} = await sb.from('orders')
      .select('id', {count:'exact',head:true})
      .eq('retailer_id', sess.user_id)
      .in('status',['pending','confirmed','in_transit']);
    document.getElementById('r-pending-n').textContent = count || 0;

    // Recent orders
    const {data: recent} = await sb.from('orders')
      .select('*')
      .eq('retailer_id', sess.user_id)
      .order('created_at',{ascending:false})
      .limit(3);
    renderRRecentOrders(recent || []);
  } catch(e) { console.warn(e); }
}

function renderRRecentOrders(orders) {
  const el = document.getElementById('r-recent-list');
  if (!orders.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">Hakuna maombi bado</div><div class="empty-sub">Nenda Sokoni kuagiza bidhaa</div></div>`;
    return;
  }
  el.innerHTML = orders.map(o => orderCardRetailer(o)).join('');
}

/* ════════════════════════════════════════════════════════════
   MARKETPLACE
════════════════════════════════════════════════════════════ */
let allProducts = [];

async function loadMarket() {
  const el = document.getElementById('mkt-list');
  el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';

  // Build category tabs
  const tabs = document.getElementById('cat-tabs');
  tabs.innerHTML = CATS.map(c =>
    `<button class="period-tab${c.id==='all'?' active':''}" onclick="App.setCat('${c.id}',this)">${c.icon} ${c.name}</button>`
  ).join('');

  try {
    const {data} = await sb.from('products')
      .select('*, users!distributor_id(name,business_name)')
      .eq('active', true)
      .order('name');
    allProducts = data || [];
    renderProducts(allProducts);
  } catch(e) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📡</div><div class="empty-title">Hakuna muunganiko</div><div class="empty-sub">Angalia internet yako</div></div>';
  }
}

App.setCat = (cat, btn) => {
  document.querySelectorAll('#cat-tabs .period-tab').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const filtered = cat==='all' ? allProducts : allProducts.filter(p=>p.category===cat);
  renderProducts(filtered);
};

App.filterMkt = () => {
  const q = document.getElementById('mkt-search').value.toLowerCase();
  renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(q)));
};

function renderProducts(products) {
  const el = document.getElementById('mkt-list');
  if (!products.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-title">Hakuna bidhaa</div></div>';
    return;
  }
  el.innerHTML = products.map(p => {
    const inCart = State.cart.find(c=>c.product_id===p.id);
    const qty = inCart?.qty || 0;
    return `<div class="prod-card">
      <div class="prod-img">${CATS.find(c=>c.id===p.category)?.icon||'📦'}</div>
      <div class="prod-info">
        <div class="prod-name">${p.name}</div>
        <div class="prod-dist">🚛 ${p.users?.business_name||'Msambazaji'}</div>
        <div class="prod-price">${fmt(p.price)} <span class="prod-unit">/ ${p.unit||'kipande'}</span></div>
        ${p.min_order?`<div class="text-xs dim">Min: ${p.min_order} ${p.unit||''}</div>`:''}
      </div>
      <div>
        ${qty===0
          ? `<button class="btn btn-ghost btn-xs" onclick="App.addToCart('${p.id}')">+ Ongeza</button>`
          : `<div class="qty-ctrl">
              <button class="qty-btn" onclick="App.decCart('${p.id}')">−</button>
              <span class="qty-num">${qty}</span>
              <button class="qty-btn" onclick="App.incCart('${p.id}')">+</button>
             </div>`
        }
      </div>
    </div>`;
  }).join('');
  updateCartFab();
}

App.addToCart = id => {
  const p = allProducts.find(p=>p.id===id);
  if (!p) return;
  const item = State.cart.find(c=>c.product_id===id);
  if (item) item.qty++;
  else State.cart.push({product_id:id, name:p.name, price:p.price, unit:p.unit, distributor_id:p.distributor_id, qty:1, icon:CATS.find(c=>c.id===p.category)?.icon||'📦'});
  renderProducts(allProducts);
  updateCartFab();
};
App.incCart = id => { const i=State.cart.find(c=>c.product_id===id); if(i) i.qty++; renderProducts(allProducts); updateCartFab(); };
App.decCart = id => {
  const idx = State.cart.findIndex(c=>c.product_id===id);
  if (idx<0) return;
  State.cart[idx].qty--;
  if (State.cart[idx].qty<=0) State.cart.splice(idx,1);
  renderProducts(allProducts);
  updateCartFab();
};

function updateCartFab() {
  const n = State.cart.reduce((a,c)=>a+c.qty,0);
  document.getElementById('cart-n').textContent = n||'';
  const fab = document.getElementById('cart-fab');
  if (fab) {
    document.getElementById('cart-fab-n').textContent = n;
    fab.classList.toggle('hidden', n===0);
  }
}

/* ─── CART ─── */
function renderCart() {
  const items = document.getElementById('cart-items');
  const sumBox = document.getElementById('cart-sum-box');
  if (!State.cart.length) {
    items.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-title">Kikapu chako ni tupu</div><div class="empty-sub">Rudi Sokoni kuongeza bidhaa</div></div>';
    sumBox.classList.add('hidden');
    return;
  }
  let subtotal = 0;
  items.innerHTML = State.cart.map(item => {
    const line = item.price * item.qty;
    subtotal += line;
    return `<div class="cart-row">
      <div class="cart-item-icon">${item.icon}</div>
      <div style="flex:1">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmt(item.price)} × ${item.qty} = ${fmt(line)}</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="App.decCart('${item.product_id}');renderCart()">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="App.incCart('${item.product_id}');renderCart()">+</button>
      </div>
    </div>`;
  }).join('');
  document.getElementById('cart-subtotal').textContent = fmt(subtotal);
  document.getElementById('cart-total').textContent = fmt(subtotal);
  sumBox.classList.remove('hidden');
}

App.placeOrder = async () => {
  if (!State.cart.length) { toast('Kikapu chako ni tupu','error','⚠️'); return; }
  const btn = document.getElementById('btn-place-order');
  btn.disabled = true; btn.textContent = '⏳ Inaagiza...';

  try {
    const sess = State.session;
    const ref = genRef();
    // Get retailer location
    let lat=null, lng=null;
    try {
      const pos = await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:5000}));
      lat=pos.coords.latitude; lng=pos.coords.longitude;
    } catch {}

    // Group by distributor
    const byDist = {};
    State.cart.forEach(item => {
      if (!byDist[item.distributor_id]) byDist[item.distributor_id] = [];
      byDist[item.distributor_id].push(item);
    });

    for (const [dist_id, items] of Object.entries(byDist)) {
      const total = items.reduce((a,i)=>a+i.price*i.qty, 0);
      await sb.from('orders').insert({
        ref_number: ref,
        retailer_id: sess.user_id,
        retailer_name: sess.name,
        retailer_biz: sess.biz,
        retailer_phone: sess.phone,
        retailer_region: sess.region,
        retailer_district: sess.district,
        retailer_lat: lat,
        retailer_lng: lng,
        distributor_id: dist_id,
        items: JSON.stringify(items),
        total,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    State.cart = [];
    updateCartFab();
    toast('Oda imewekwa!','success','🎉');
    // Try PWA prompt after first order
    tryShowPWA();
    showScreen('r-orders');
    loadROrders();
  } catch(e) {
    console.error(e);
    toast('Hitilafu — jaribu tena','error','❌');
  }
  btn.disabled = false; btn.textContent = '📦 Agiza Sasa';
};

/* ════════════════════════════════════════════════════════════
   RETAILER ORDERS + TRACKING
════════════════════════════════════════════════════════════ */
async function loadROrders() {
  const el = document.getElementById('r-orders-list');
  el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';
  try {
    const {data} = await sb.from('orders')
      .select('*')
      .eq('retailer_id', State.session.user_id)
      .order('created_at',{ascending:false});
    if (!data?.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">Hakuna maombi</div><div class="empty-sub">Oda zako zitaonekana hapa</div></div>`;
      return;
    }
    el.innerHTML = data.map(o => orderCardRetailer(o)).join('');
  } catch(e) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📡</div><div class="empty-title">Hakuna muunganiko</div></div>';
  }
}

function orderCardRetailer(o) {
  const items = typeof o.items === 'string' ? JSON.parse(o.items||'[]') : (o.items||[]);
  const statusMap = {pending:{label:'Inasubiri',chip:'chip-amber'},confirmed:{label:'Imethibitishwa',chip:'chip-blue'},in_transit:{label:'Safarini',chip:'chip-purple'},delivered:{label:'Imewasilishwa',chip:'chip-green'}};
  const s = statusMap[o.status] || statusMap.pending;

  // Track progress
  const steps = ['pending','confirmed','in_transit','delivered'];
  const curIdx = steps.indexOf(o.status);
  const pct = Math.max(0, (curIdx/(steps.length-1))*80);
  const stepLabels = ['Imepokelewa','Imethibitishwa','Safarini','Imewasilishwa'];
  const stepIcons = ['📋','✅','🚛','🏠'];

  const stepsHtml = steps.map((st,i)=>{
    const cls = i<curIdx?'done':i===curIdx?'active':'';
    return `<div class="track-step">
      <div class="track-dot ${cls}">${cls==='done'?'✓':stepIcons[i]}</div>
      <div class="track-lbl ${cls}">${stepLabels[i]}</div>
    </div>`;
  }).join('');

  // ETA if in transit
  let etaHtml = '';
  if (o.status==='in_transit' && o.dist_lat && o.retailer_lat) {
    const dist = haversine(o.retailer_lat, o.retailer_lng, o.dist_lat, o.dist_lng);
    const mins = Math.round(dist / 0.5); // ~30km/h in traffic
    etaHtml = `<div class="eta-bar">
      <span>🚛</span>
      <div class="eta-text">
        <div class="eta-val">${mins > 60 ? Math.round(mins/60)+'h '+mins%60+'m' : mins+' dakika'}</div>
        <div class="eta-sub">${dist.toFixed(1)} km mbali · Inafika hivi karibuni</div>
      </div>
    </div>`;
  }

  const dateStr = new Date(o.created_at).toLocaleDateString('sw-TZ', {day:'2-digit',month:'short',year:'numeric'});

  return `<div class="order-card">
    <div class="order-top">
      <div>
        <div class="order-ref">${o.ref_number}</div>
        <div class="order-meta">${dateStr} · ${items.length} bidhaa</div>
      </div>
      <div class="chip ${s.chip}">${s.label}</div>
    </div>
    <div class="track-wrap">
      <div class="track-steps">
        <div class="track-line-bg"></div>
        <div class="track-line-fill" style="width:${pct}%"></div>
        ${stepsHtml}
      </div>
    </div>
    ${etaHtml}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
      <span style="font-size:12px;color:var(--text2)">${items.map(i=>i.name+'×'+i.qty).join(', ')}</span>
      <span style="font-family:'Sora',sans-serif;font-weight:700;font-size:14px;color:var(--green)">${fmt(o.total)}</span>
    </div>
    ${o.status==='delivered'?`<button class="btn btn-secondary btn-sm mt-8 w-full" onclick="App.viewReceipt('${o.id}')">🧾 Ona Risiti</button>`:''}
  </div>`;
}

/* ════════════════════════════════════════════════════════════
   POS — RETAILER
════════════════════════════════════════════════════════════ */
let posProducts = [];

async function loadPOS() {
  const el = document.getElementById('pos-prods');
  el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';

  const offline = !navigator.onLine;
  document.getElementById('pos-offline-ind').style.display = offline ? '' : 'none';

  try {
    const {data} = await sb.from('products')
      .select('*')
      .eq('active', true)
      .order('name');
    posProducts = data || [];
  } catch {
    // Use cached if offline
    posProducts = JSON.parse(localStorage.getItem('bw_pos_cache')||'[]');
  }
  // Cache for offline
  if (navigator.onLine && posProducts.length) {
    localStorage.setItem('bw_pos_cache', JSON.stringify(posProducts));
  }
  renderPosProducts(posProducts);
}

App.posFilter = () => {
  const q = document.getElementById('pos-search').value.toLowerCase();
  renderPosProducts(posProducts.filter(p=>p.name.toLowerCase().includes(q)));
};

function renderPosProducts(prods) {
  const el = document.getElementById('pos-prods');
  el.innerHTML = prods.map(p => `<div class="pos-prod-row" onclick="App.addToPosCart('${p.id}')">
    <div class="pos-prod-icon">${CATS.find(c=>c.id===p.category)?.icon||'📦'}</div>
    <div style="flex:1">
      <div class="pos-prod-name">${p.name}</div>
      <div class="pos-prod-price">${fmt(p.price)} / ${p.unit||'kipande'}</div>
    </div>
    <button class="btn btn-ghost btn-xs">+</button>
  </div>`).join('') || '<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">Hakuna bidhaa</div></div>';
}

App.addToPosCart = id => {
  const p = posProducts.find(p=>p.id===id);
  if (!p) return;
  const item = State.posCart.find(i=>i.product_id===id);
  if (item) item.qty++;
  else State.posCart.push({product_id:id, name:p.name, price:p.price, qty:1});
  renderPosCart();
};

function renderPosCart() {
  const footer = document.getElementById('pos-footer');
  if (!State.posCart.length) { footer.style.display='none'; return; }
  footer.style.display='';
  let total = 0;
  document.getElementById('pos-cart-list').innerHTML = State.posCart.map(item => {
    total += item.price * item.qty;
    return `<div class="pos-cart-row">
      <span class="pos-cart-name">${item.name}</span>
      <div class="qty-ctrl" style="gap:6px">
        <button class="qty-btn" style="width:24px;height:24px;font-size:14px" onclick="App.decPosCart('${item.product_id}')">−</button>
        <span class="qty-num" style="font-size:13px">${item.qty}</span>
        <button class="qty-btn" style="width:24px;height:24px;font-size:14px" onclick="App.incPosCart('${item.product_id}')">+</button>
      </div>
      <span style="font-size:12px;color:var(--brand);margin-left:8px;min-width:60px;text-align:right">${fmt(item.price*item.qty)}</span>
    </div>`;
  }).join('');
  document.getElementById('pos-total').textContent = fmt(total);
}

App.incPosCart = id => { const i=State.posCart.find(i=>i.product_id===id); if(i){i.qty++;renderPosCart();} };
App.decPosCart = id => {
  const idx=State.posCart.findIndex(i=>i.product_id===id);
  if(idx<0) return;
  State.posCart[idx].qty--;
  if(State.posCart[idx].qty<=0) State.posCart.splice(idx,1);
  renderPosCart();
};
App.clearPosCart = () => { State.posCart=[]; renderPosCart(); };

App.completeSale = async () => {
  if (!State.posCart.length) return;
  const total = State.posCart.reduce((a,i)=>a+i.price*i.qty, 0);
  const sale = {
    user_id: State.session.user_id,
    ref: genRef(),
    items: JSON.stringify(State.posCart),
    total,
    created_at: new Date().toISOString(),
  };

  try {
    if (navigator.onLine) {
      await sb.from('pos_sales').insert(sale);
    } else {
      await posDbAdd(sale);
      toast('Mauzo yamehifadhiwa offline','info','📴');
    }
    toast('Mauzo yamekamilika!','success','💰');
    // Show receipt
    const items = [...State.posCart];
    State.posCart = [];
    renderPosCart();
    // PWA prompt after first sale
    tryShowPWA();
    // Show receipt
    App.showReceipt({
      type: 'pos_sale',
      ref: sale.ref,
      date: new Date(),
      seller: State.session,
      items,
      total,
    });
  } catch(e) {
    toast('Hitilafu — imehifadhiwa offline','info','📴');
    await posDbAdd(sale);
    State.posCart = []; renderPosCart();
  }
};

/* ════════════════════════════════════════════════════════════
   RETAILER REPORTS
════════════════════════════════════════════════════════════ */
App.loadRRep = async (period, btn) => {
  document.querySelectorAll('#screen-r-reports .period-tab').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const now = new Date();
  let from = new Date(now);
  if (period==='today') from.setHours(0,0,0,0);
  else if (period==='week') from.setDate(from.getDate()-7);
  else if (period==='month') from.setMonth(from.getMonth()-1);

  try {
    // Online: fetch from Supabase
    const {data:sales=[]} = await sb.from('pos_sales')
      .select('*')
      .eq('user_id', State.session.user_id)
      .gte('created_at', from.toISOString());

    const total = sales.reduce((a,s)=>a+Number(s.total),0);
    const allItems = sales.flatMap(s => {
      try { return JSON.parse(s.items||'[]'); } catch { return []; }
    });
    const byProduct = {};
    allItems.forEach(i => {
      if (!byProduct[i.name]) byProduct[i.name]={name:i.name,qty:0,rev:0};
      byProduct[i.name].qty += i.qty;
      byProduct[i.name].rev += i.price * i.qty;
    });
    const topProds = Object.values(byProduct).sort((a,b)=>b.rev-a.rev).slice(0,10);

    animateCount(document.querySelector('#r-rep-total'), total, 'TZS ');
    document.getElementById('r-rep-sub').textContent = `Miamala ${sales.length}`;
    document.getElementById('r-stat-s').textContent = sales.length;
    document.getElementById('r-stat-i').textContent = allItems.reduce((a,i)=>a+i.qty,0);
    document.getElementById('r-stat-a').textContent = sales.length ? fmt(Math.round(total/sales.length)) : 'TZS 0';

    const el = document.getElementById('r-rep-items');
    el.innerHTML = topProds.length ? topProds.map(p=>`
      <div class="rep-item-row">
        <div><div class="rep-item-name">${p.name}</div><div class="rep-item-qty">Vipande ${p.qty}</div></div>
        <div class="rep-item-amt">${fmt(p.rev)}</div>
      </div>`).join('') : '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Hakuna data</div></div>';
  } catch(e) { console.warn(e); }
};

/* ════════════════════════════════════════════════════════════
   DISTRIBUTOR HOME
════════════════════════════════════════════════════════════ */
async function loadDHome() {
  const sess = State.session;
  document.getElementById('d-greet').textContent = greeting();
  document.getElementById('d-uname').textContent = sess.name || 'Msambazaji';
  document.getElementById('d-pav').textContent = initials(sess.name);
  document.getElementById('d-pname').textContent = sess.name;
  document.getElementById('d-pphone').textContent = sess.phone;

  try {
    const days = parseInt(State.distPeriod);
    const from = new Date(); from.setDate(from.getDate()-days); from.setHours(0,0,0,0);

    const {data:orders=[]} = await sb.from('orders')
      .select('*')
      .eq('distributor_id', sess.user_id)
      .gte('created_at', from.toISOString());

    const revenue = orders.filter(o=>o.status==='delivered').reduce((a,o)=>a+Number(o.total),0);
    animateCount(document.getElementById('d-revenue'), revenue, 'TZS ');
    animateCount(document.getElementById('d-orders-n'), orders.length);

    // Staff count
    const {count:staffCount} = await sb.from('staff_members').select('id',{count:'exact',head:true}).eq('distributor_id',sess.user_id);
    animateCount(document.getElementById('d-staff-n'), staffCount||0);

    // Products count
    const {count:prodCount} = await sb.from('products').select('id',{count:'exact',head:true}).eq('distributor_id',sess.user_id);
    animateCount(document.getElementById('d-prods-n'), prodCount||0);

    // Unique retailers
    const retailers = new Set(orders.map(o=>o.retailer_id));
    animateCount(document.getElementById('d-retailers-n'), retailers.size);

    // Build graph
    buildDistGraph(orders, days);

    // Recent orders
    const recent = [...orders].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
    renderDRecentOrders(recent);

  } catch(e) { console.warn('loadDHome', e); }
}

App.setDistPeriod = (period, btn) => {
  document.querySelectorAll('.ptoggle-btn').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  State.distPeriod = period;
  loadDHome();
};

function buildDistGraph(orders, days) {
  const el = document.getElementById('d-graph');
  const delivered = orders.filter(o=>o.status==='delivered');

  // Build daily buckets
  const buckets = {};
  for (let i=days-1; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
    const key = d.toISOString().slice(0,10);
    buckets[key] = 0;
  }
  delivered.forEach(o => {
    const key = o.created_at.slice(0,10);
    if (buckets[key]!==undefined) buckets[key] += Number(o.total);
  });

  const keys = Object.keys(buckets);
  const vals = keys.map(k=>buckets[k]);
  const maxVal = Math.max(...vals, 1);
  const total = vals.reduce((a,b)=>a+b,0);

  document.getElementById('d-graph-total').textContent = fmt(total);

  const todayKey = new Date().toISOString().slice(0,10);
  const dayLabels = ['Ju','Ar','Ju','Ij','Al','Ku','Sa'];

  el.innerHTML = keys.map((k,i) => {
    const pct = (vals[i]/maxVal)*100;
    const isToday = k===todayKey;
    const dayName = dayLabels[new Date(k).getDay()];
    const shortDate = k.slice(5); // MM-DD
    const label = days <= 7 ? dayName : shortDate;

    return `<div class="gcol">
      <div class="gbar-wrap">
        <div class="gbar${isToday?' today':''}" style="height:${Math.max(pct,2)}%">
          <div class="gval">${vals[i]>0?fmtShort(vals[i]):''}</div>
        </div>
      </div>
      <div class="gday">${label}</div>
    </div>`;
  }).join('');
}

function renderDRecentOrders(orders) {
  const el = document.getElementById('d-recent-orders');
  if (!orders.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">Hakuna maombi mapya</div></div>`;
    return;
  }
  el.innerHTML = orders.map(o => distOrderCard(o, true)).join('');
}

/* ════════════════════════════════════════════════════════════
   DISTRIBUTOR ORDER CARD — includes store info
════════════════════════════════════════════════════════════ */
function distOrderCard(o, mini=false) {
  const items = typeof o.items === 'string' ? JSON.parse(o.items||'[]') : (o.items||[]);
  const statusMap = {
    pending:   {label:'Imepokelewa',chip:'chip-amber',   action:'Thibitisha',  next:'confirmed'},
    confirmed: {label:'Imethibitishwa',chip:'chip-blue', action:'Tuma',        next:'in_transit'},
    in_transit:{label:'Safarini',chip:'chip-purple',     action:'Imewasilishwa',next:'delivered'},
    delivered: {label:'Imewasilishwa',chip:'chip-green', action:null,          next:null},
  };
  const s = statusMap[o.status] || statusMap.pending;
  const dateStr = new Date(o.created_at).toLocaleDateString('sw-TZ',{day:'2-digit',month:'short'});
  const timeStr = new Date(o.created_at).toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'});

  // Store info block — jina la duka, simu, location
  const storeBlock = `<div class="store-block">
    <div class="store-row"><span class="si">🏪</span><span class="store-name-val">${o.retailer_biz||o.retailer_name||'Duka'}</span></div>
    <div class="store-row"><span class="si">📞</span><span class="st"><a href="tel:${o.retailer_phone}">${o.retailer_phone||'—'}</a></span></div>
    <div class="store-row"><span class="si">📍</span><span class="st">${[o.retailer_district,o.retailer_region].filter(Boolean).join(', ')||'Mahali haijulikani'}</span></div>
  </div>`;

  const actionBtns = s.action ? `
    <button class="btn btn-primary btn-xs" onclick="App.advanceOrder('${o.id}','${s.next}','${o.ref_number}')">
      ${s.next==='in_transit'?'🚛':'✅'} ${s.action}
    </button>` : '';

  return `<div class="dorder-card">
    <div class="dorder-top">
      <div>
        <div class="dorder-ref">${o.ref_number}</div>
        <div class="dorder-time">${dateStr} ${timeStr}</div>
      </div>
      <div class="chip ${s.chip}">${s.label}</div>
    </div>
    ${storeBlock}
    <div class="dorder-items">${items.slice(0,3).map(i=>`${i.name} ×${i.qty}`).join(' · ')}${items.length>3?` +${items.length-3} zaidi`:''}</div>
    <div style="display:flex;align-items:center;justify-content:space-between">
      <span class="dorder-total">${fmt(o.total)}</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${actionBtns}
        ${o.status==='delivered'?`<button class="btn btn-secondary btn-xs" onclick="App.viewInvoice('${o.id}')">🧾 Ankara</button>`:''}
      </div>
    </div>
  </div>`;
}

/* ─── ADVANCE ORDER STATUS ─── */
App.advanceOrder = async (id, newStatus, ref) => {
  try {
    const update = {status: newStatus, updated_at: new Date().toISOString()};
    if (newStatus === 'in_transit') {
      // Snapshot distributor GPS
      try {
        const pos = await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:5000}));
        update.dist_lat = pos.coords.latitude;
        update.dist_lng = pos.coords.longitude;
      } catch {}
    }
    await sb.from('orders').update(update).eq('id', id);
    const labels = {confirmed:'✅ Imethibitishwa',in_transit:'🚛 Safarini',delivered:'🎉 Imewasilishwa'};
    toast(`${ref} — ${labels[newStatus]||newStatus}`, 'success', '📦');
    loadDOrders(State.dOrdersFilter);
    loadDHome();
  } catch(e) { toast('Hitilafu','error','❌'); console.error(e); }
};

/* ════════════════════════════════════════════════════════════
   DISTRIBUTOR ORDERS LIST
════════════════════════════════════════════════════════════ */
async function loadDOrders(filter='all') {
  const el = document.getElementById('d-orders-list');
  el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';
  try {
    let q = sb.from('orders').select('*').eq('distributor_id', State.session.user_id).order('created_at',{ascending:false});
    if (filter !== 'all') q = q.eq('status', filter);
    const {data=[]} = await q;
    el.innerHTML = data.length ? data.map(o=>distOrderCard(o)).join('') :
      '<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">Hakuna maombi</div></div>';
  } catch { el.innerHTML = '<div class="empty-state"><div class="empty-icon">📡</div><div class="empty-title">Hakuna muunganiko</div></div>'; }
}

App.filterDOrders = (filter, btn) => {
  document.querySelectorAll('#screen-d-orders .period-tab').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  State.dOrdersFilter = filter;
  loadDOrders(filter);
};

/* ════════════════════════════════════════════════════════════
   DISTRIBUTOR PRODUCTS
════════════════════════════════════════════════════════════ */
let dProdsAll = [];

async function loadDProducts() {
  const el = document.getElementById('d-prods-list');
  el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';
  try {
    const {data=[]} = await sb.from('products').select('*').eq('distributor_id', State.session.user_id).order('name');
    dProdsAll = data;
    renderDProds(data);
  } catch { el.innerHTML = '<div class="empty-state"><div class="empty-icon">📡</div><div class="empty-title">Hakuna muunganiko</div></div>'; }
}

App.filterDProds = () => {
  const q = document.getElementById('dprod-search').value.toLowerCase();
  renderDProds(dProdsAll.filter(p=>p.name.toLowerCase().includes(q)));
};

function renderDProds(prods) {
  const el = document.getElementById('d-prods-list');
  el.innerHTML = prods.length ? prods.map(p => {
    const stockCls = p.stock <= (p.min_stock||5) ? 'stock-warn' : 'stock-ok';
    return `<div class="dprod-card">
      <div class="dprod-row">
        <div class="dprod-img">${CATS.find(c=>c.id===p.category)?.icon||'📦'}</div>
        <div style="flex:1">
          <div class="dprod-name">${p.name}</div>
          <div class="dprod-cat">${CATS.find(c=>c.id===p.category)?.name||'Nyingine'}</div>
          <div class="dprod-meta">
            <span class="brand">${fmt(p.price)}/${p.unit||'kipande'}</span>
            <span class="${stockCls}">Stok: ${p.stock||0}</span>
            ${p.min_order?`<span class="dim">Min: ${p.min_order}</span>`:''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px">
          <button class="btn btn-ghost btn-xs" onclick="App.editProduct('${p.id}')">✏️</button>
          <button class="btn btn-secondary btn-xs" onclick="App.toggleProductActive('${p.id}',${p.active})">${p.active?'🔴':'🟢'}</button>
        </div>
      </div>
    </div>`;
  }).join('') : '<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">Hakuna bidhaa</div><div class="empty-sub">Ongeza bidhaa yako ya kwanza</div></div>';
}

App.showAddProduct = () => {
  openModal(`
    <div class="modal-title">➕ Ongeza Bidhaa</div>
    <div class="form-group"><label class="form-label">Jina la Bidhaa</label><input class="input" id="mp-name" placeholder="Mfano: Unga Ndovu 2kg"></div>
    <div class="form-group"><label class="form-label">Aina</label>
      <select class="input" id="mp-cat">${CATS.filter(c=>c.id!=='all').map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label class="form-label">Bei (TZS)</label><input class="input" id="mp-price" type="number" inputmode="numeric" placeholder="0"></div>
    <div class="form-group"><label class="form-label">Kitengo</label><input class="input" id="mp-unit" placeholder="Mfano: kg, lita, kipande"></div>
    <div class="form-group"><label class="form-label">Idadi ya Stok</label><input class="input" id="mp-stock" type="number" inputmode="numeric" placeholder="0"></div>
    <div class="form-group"><label class="form-label">Agizo la Chini</label><input class="input" id="mp-min" type="number" inputmode="numeric" placeholder="1"></div>
    <div class="btn-row mt-12">
      <button class="btn btn-secondary" onclick="closeModal()">Ghairi</button>
      <button class="btn btn-primary" onclick="App.saveProduct()">Hifadhi</button>
    </div>
  `);
};

App.saveProduct = async () => {
  const name=document.getElementById('mp-name')?.value.trim();
  const cat=document.getElementById('mp-cat')?.value;
  const price=parseFloat(document.getElementById('mp-price')?.value||0);
  const unit=document.getElementById('mp-unit')?.value.trim();
  const stock=parseInt(document.getElementById('mp-stock')?.value||0);
  const min_order=parseInt(document.getElementById('mp-min')?.value||1);
  if (!name||!price) { toast('Jaza jina na bei','error','⚠️'); return; }
  try {
    await sb.from('products').insert({name,category:cat,price,unit,stock,min_order,distributor_id:State.session.user_id,active:true,created_at:new Date().toISOString()});
    toast('Bidhaa imeongezwa!','success','✅');
    closeModal();
    loadDProducts();
  } catch(e) { toast('Hitilafu','error','❌'); }
};

App.editProduct = async (id) => {
  const p = dProdsAll.find(p=>p.id===id);
  if (!p) return;
  openModal(`
    <div class="modal-title">✏️ Hariri Bidhaa</div>
    <div class="form-group"><label class="form-label">Jina</label><input class="input" id="ep-name" value="${p.name}"></div>
    <div class="form-group"><label class="form-label">Bei (TZS)</label><input class="input" id="ep-price" type="number" value="${p.price}" inputmode="numeric"></div>
    <div class="form-group"><label class="form-label">Stok</label><input class="input" id="ep-stock" type="number" value="${p.stock||0}" inputmode="numeric"></div>
    <div class="btn-row mt-12">
      <button class="btn btn-secondary" onclick="closeModal()">Ghairi</button>
      <button class="btn btn-primary" onclick="App.updateProduct('${id}')">Hifadhi</button>
    </div>
  `);
};

App.updateProduct = async (id) => {
  const name=document.getElementById('ep-name').value.trim();
  const price=parseFloat(document.getElementById('ep-price').value);
  const stock=parseInt(document.getElementById('ep-stock').value||0);
  try {
    await sb.from('products').update({name,price,stock}).eq('id',id);
    toast('Imehifadhiwa!','success','✅');
    closeModal(); loadDProducts();
  } catch { toast('Hitilafu','error','❌'); }
};

App.toggleProductActive = async (id, active) => {
  await sb.from('products').update({active:!active}).eq('id',id);
  toast(active?'Bidhaa imefichwa':'Bidhaa inaonekana sasa','success','✅');
  loadDProducts();
};

/* ════════════════════════════════════════════════════════════
   STAFF MANAGEMENT
════════════════════════════════════════════════════════════ */
let staffAll = [];

async function loadDStaff() {
  const el = document.getElementById('d-staff-list');
  el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';
  try {
    const {data=[]} = await sb.from('staff_members')
      .select('*')
      .eq('distributor_id', State.session.user_id)
      .order('created_at',{ascending:false});
    staffAll = data;
    renderStaff(staffAll);
  } catch { el.innerHTML = '<div class="empty-state"><div class="empty-icon">📡</div><div class="empty-title">Hakuna muunganiko</div></div>'; }
}

App.filterStaff = (filter, btn) => {
  document.querySelectorAll('#screen-d-staff .period-tab').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  State.staffFilter = filter;
  const filtered = filter==='all' ? staffAll : staffAll.filter(s=>s.role===filter);
  renderStaff(filtered);
};

function renderStaff(staff) {
  const el = document.getElementById('d-staff-list');
  if (!staff.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">Hakuna wafanyakazi</div><div class="empty-sub">Ongeza mfanyakazi wako wa kwanza</div></div>`;
    return;
  }
  el.innerHTML = staff.map(s => {
    const r = ROLES[s.role] || ROLES.viewer;
    return `<div class="staff-card">
      <div class="staff-av">${initials(s.name)}</div>
      <div class="staff-info">
        <div class="staff-name">${s.name}</div>
        <div><span class="role-badge ${r.badge}">${r.icon} ${r.label}</span></div>
        <div class="staff-phone">📞 ${s.phone}</div>
      </div>
      <div class="staff-actions">
        <button class="btn btn-ghost btn-xs" onclick="App.changeRole('${s.id}','${s.role}','${s.name}')">Badilisha Jukumu</button>
        <button class="btn btn-danger btn-xs" onclick="App.removeStaff('${s.id}','${s.name}')">Toa</button>
      </div>
    </div>`;
  }).join('');
}

App.showAddStaff = () => {
  openModal(`
    <div class="modal-title">👥 Ongeza Mfanyakazi</div>
    <div class="form-group"><label class="form-label">Jina Kamili</label><input class="input" id="ns-name" placeholder="Mfano: Said Juma"></div>
    <div class="form-group"><label class="form-label">Namba ya Simu</label><input class="input" id="ns-phone" type="tel" inputmode="tel" placeholder="+255 7XX XXX XXX"></div>
    <div class="form-group"><label class="form-label">Jukumu</label>
      <div id="ns-roles">
        ${Object.entries(ROLES).filter(([k])=>k!=='owner').map(([k,v])=>`
          <div class="role-option${k==='cashier'?' sel':''}" onclick="App.selectNSRole(this,'${k}')">
            <span class="role-option-icon">${v.icon}</span>
            <div class="role-option-text"><strong>${v.label}</strong><span>${roleDesc(k)}</span></div>
          </div>`).join('')}
      </div>
    </div>
    <div class="btn-row mt-12">
      <button class="btn btn-secondary" onclick="closeModal()">Ghairi</button>
      <button class="btn btn-primary" onclick="App.saveStaff()">Ongeza</button>
    </div>
  `);
};

App.selectNSRole = (el, role) => {
  document.querySelectorAll('#ns-roles .role-option').forEach(r=>r.classList.remove('sel'));
  el.classList.add('sel');
  el.dataset.role = role;
};

function roleDesc(role) {
  const descs = {manager:'Anaweza kufanya kila kitu isipokuwa kufuta akaunti',cashier:'Rekodi mauzo na angalia maombi tu',sales:'Simamia maombi na bidhaa',viewer:'Angalia ripoti tu'};
  return descs[role]||'';
}

App.saveStaff = async () => {
  const name=document.getElementById('ns-name')?.value.trim();
  const phone=document.getElementById('ns-phone')?.value.trim();
  const roleEl=document.querySelector('#ns-roles .role-option.sel');
  const role=roleEl?.dataset.role || 'cashier';
  if (!name||!phone) { toast('Jaza jina na simu','error','⚠️'); return; }
  try {
    await sb.from('staff_members').insert({
      distributor_id:State.session.user_id, name, phone, role,
      active:true, created_at:new Date().toISOString()
    });
    toast(`${name} ameongezwa!`,'success','✅');
    closeModal(); loadDStaff();
    animateCount(document.getElementById('d-staff-n'), staffAll.length+1);
  } catch(e) { toast('Hitilafu','error','❌'); }
};

App.changeRole = (staffId, currentRole, staffName) => {
  openModal(`
    <div class="modal-title">🔄 Badilisha Jukumu — ${staffName}</div>
    <div>
      ${Object.entries(ROLES).filter(([k])=>k!=='owner').map(([k,v])=>`
        <div class="role-option${k===currentRole?' sel':''}" onclick="App.selectRoleChange(this,'${staffId}','${k}')">
          <span class="role-option-icon">${v.icon}</span>
          <div class="role-option-text"><strong>${v.label}</strong><span>${roleDesc(k)}</span></div>
        </div>`).join('')}
    </div>
    <button class="btn btn-secondary mt-12" onclick="closeModal()">Ghairi</button>
  `);
};

App.selectRoleChange = async (el, staffId, role) => {
  document.querySelectorAll('#modal-content .role-option').forEach(r=>r.classList.remove('sel'));
  el.classList.add('sel');
  try {
    await sb.from('staff_members').update({role}).eq('id',staffId);
    toast(`Jukumu limebadilishwa: ${ROLES[role].label}`,'success','✅');
    closeModal(); loadDStaff();
  } catch { toast('Hitilafu','error','❌'); }
};

App.removeStaff = (staffId, name) => {
  openModal(`
    <div class="modal-title">⚠️ Toa Mfanyakazi</div>
    <p style="font-size:14px;color:var(--text2);margin-bottom:16px;line-height:1.6">
      Una uhakika unataka kumtoa <strong>${name}</strong>? Hataweza kuingia kwenye BomaWave tena.
    </p>
    <div class="btn-row">
      <button class="btn btn-secondary" onclick="closeModal()">Ghairi</button>
      <button class="btn btn-danger" onclick="App.confirmRemoveStaff('${staffId}')">Ndio, Toa</button>
    </div>
  `);
};

App.confirmRemoveStaff = async (staffId) => {
  try {
    await sb.from('staff_members').delete().eq('id',staffId);
    toast('Mfanyakazi ametolewa','success','✅');
    closeModal(); loadDStaff();
  } catch { toast('Hitilafu','error','❌'); }
};

/* ════════════════════════════════════════════════════════════
   DISTRIBUTOR INVOICES
════════════════════════════════════════════════════════════ */
async function loadDInvoices() {
  const el = document.getElementById('d-invoices-list');
  el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';
  try {
    let q = sb.from('orders').select('*').eq('distributor_id',State.session.user_id).order('created_at',{ascending:false});
    if (State.invoicesFilter === 'paid') q = q.eq('status','delivered');
    else if (State.invoicesFilter === 'pending') q = q.in('status',['pending','confirmed','in_transit']);
    const {data=[]} = await q;
    el.innerHTML = data.length ? data.map(o=>`
      <div class="card" style="cursor:pointer" onclick="App.viewInvoice('${o.id}')">
        <div class="card-header">
          <div>
            <div class="card-title">${o.ref_number}</div>
            <div class="text-xs muted">${new Date(o.created_at).toLocaleDateString('sw-TZ',{day:'2-digit',month:'short',year:'numeric'})}</div>
          </div>
          <div class="chip ${o.status==='delivered'?'chip-green':o.status==='pending'?'chip-amber':'chip-blue'}">${{delivered:'Imelipwa',pending:'Inasubiri',confirmed:'Imethibitishwa',in_transit:'Safarini'}[o.status]||o.status}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="text-sm muted">🏪 ${o.retailer_biz||o.retailer_name||'Duka'}</span>
          <span style="font-family:'Sora',sans-serif;font-weight:700;color:var(--green)">${fmt(o.total)}</span>
        </div>
      </div>
    `).join('') : '<div class="empty-state"><div class="empty-icon">🧾</div><div class="empty-title">Hakuna stakabadhi</div></div>';
  } catch { el.innerHTML = '<div class="empty-state"><div class="empty-icon">📡</div><div class="empty-title">Hakuna muunganiko</div></div>'; }
}

App.filterInvoices = (filter, btn) => {
  document.querySelectorAll('#screen-d-invoices .period-tab').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  State.invoicesFilter = filter;
  loadDInvoices();
};

/* ════════════════════════════════════════════════════════════
   DISTRIBUTOR POS
════════════════════════════════════════════════════════════ */
let dPosProds = [];

async function loadDPos() {
  const el = document.getElementById('dpos-prods');
  el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';
  const offline = !navigator.onLine;
  document.getElementById('dpos-offline-ind').style.display = offline?'':'none';
  try {
    const {data=[]} = await sb.from('products').select('*').eq('distributor_id',State.session.user_id).eq('active',true).order('name');
    dPosProds = data;
    if (navigator.onLine) localStorage.setItem('bw_dpos_cache',JSON.stringify(data));
  } catch {
    dPosProds = JSON.parse(localStorage.getItem('bw_dpos_cache')||'[]');
  }
  renderDPosProds(dPosProds);
}

App.dPosFilter = () => {
  const q=document.getElementById('dpos-search').value.toLowerCase();
  renderDPosProds(dPosProds.filter(p=>p.name.toLowerCase().includes(q)));
};

function renderDPosProds(prods) {
  const el = document.getElementById('dpos-prods');
  el.innerHTML = prods.map(p=>`<div class="pos-prod-row" onclick="App.addToDPosCart('${p.id}')">
    <div class="pos-prod-icon">${CATS.find(c=>c.id===p.category)?.icon||'📦'}</div>
    <div style="flex:1">
      <div class="pos-prod-name">${p.name}</div>
      <div class="pos-prod-price">${fmt(p.price)} / ${p.unit||'kipande'}</div>
      <div class="pos-prod-stock">Stok: ${p.stock||0}</div>
    </div>
    <button class="btn btn-ghost btn-xs">+</button>
  </div>`).join('') || '<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">Hakuna bidhaa</div></div>';
}

App.addToDPosCart = id => {
  const p=dPosProds.find(p=>p.id===id); if(!p) return;
  const i=State.dPosCart.find(i=>i.product_id===id);
  if(i) i.qty++;
  else State.dPosCart.push({product_id:id,name:p.name,price:p.price,qty:1});
  renderDPosCart();
};

function renderDPosCart() {
  const footer=document.getElementById('dpos-footer');
  if(!State.dPosCart.length){footer.style.display='none';return;}
  footer.style.display='';
  let total=0;
  document.getElementById('dpos-cart-list').innerHTML = State.dPosCart.map(i=>{
    total+=i.price*i.qty;
    return `<div class="pos-cart-row">
      <span class="pos-cart-name">${i.name}</span>
      <div class="qty-ctrl" style="gap:5px">
        <button class="qty-btn" style="width:22px;height:22px;font-size:13px" onclick="App.decDPosCart('${i.product_id}')">−</button>
        <span class="qty-num" style="font-size:12px">${i.qty}</span>
        <button class="qty-btn" style="width:22px;height:22px;font-size:13px" onclick="App.incDPosCart('${i.product_id}')">+</button>
      </div>
      <span style="font-size:12px;color:var(--brand);margin-left:6px;min-width:56px;text-align:right">${fmt(i.price*i.qty)}</span>
    </div>`;
  }).join('');
  document.getElementById('dpos-total').textContent=fmt(total);
}

App.incDPosCart = id=>{const i=State.dPosCart.find(i=>i.product_id===id);if(i){i.qty++;renderDPosCart();}};
App.decDPosCart = id=>{const idx=State.dPosCart.findIndex(i=>i.product_id===id);if(idx<0)return;State.dPosCart[idx].qty--;if(State.dPosCart[idx].qty<=0)State.dPosCart.splice(idx,1);renderDPosCart();};
App.clearDPosCart = ()=>{State.dPosCart=[];renderDPosCart();};

App.completeDSale = async () => {
  if(!State.dPosCart.length) return;
  const total=State.dPosCart.reduce((a,i)=>a+i.price*i.qty,0);
  const sale={user_id:State.session.user_id,ref:genRef(),items:JSON.stringify(State.dPosCart),total,created_at:new Date().toISOString()};
  try {
    if(navigator.onLine) await sb.from('pos_sales').insert(sale);
    else { await posDbAdd(sale); toast('Imehifadhiwa offline','info','📴'); }
    toast('Mauzo yamekamilika!','success','💰');
    const items=[...State.dPosCart]; State.dPosCart=[]; renderDPosCart();
    App.showReceipt({type:'pos_sale',ref:sale.ref,date:new Date(),seller:State.session,items,total});
  } catch { await posDbAdd(sale); State.dPosCart=[]; renderDPosCart(); toast('Imehifadhiwa offline','info','📴'); }
};

/* ════════════════════════════════════════════════════════════
   DISTRIBUTOR REPORTS
════════════════════════════════════════════════════════════ */
App.loadDRep = async (period, btn) => {
  document.querySelectorAll('#screen-d-reports .period-tab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const now=new Date(), from=new Date(now);
  if(period==='today') from.setHours(0,0,0,0);
  else if(period==='week') from.setDate(from.getDate()-7);
  else if(period==='month') from.setMonth(from.getMonth()-1);
  else if(period==='year') from.setFullYear(from.getFullYear()-1);
  try {
    const {data:orders=[]} = await sb.from('orders').select('*').eq('distributor_id',State.session.user_id).gte('created_at',from.toISOString());
    const delivered=orders.filter(o=>o.status==='delivered');
    const total=delivered.reduce((a,o)=>a+Number(o.total),0);
    const retailers=new Set(orders.map(o=>o.retailer_id));
    animateCount(document.querySelector('#d-rep-total'),total,'TZS ');
    document.getElementById('d-rep-sub').textContent=`Maombi ${orders.length} · Maduka ${retailers.size}`;
    document.getElementById('d-stat-del').textContent=delivered.length;
    document.getElementById('d-stat-pend').textContent=orders.filter(o=>o.status==='pending').length;
    document.getElementById('d-stat-ret').textContent=retailers.size;

    // Top products
    const byProd={};
    orders.forEach(o=>{
      const items=typeof o.items==='string'?JSON.parse(o.items||'[]'):(o.items||[]);
      items.forEach(i=>{
        if(!byProd[i.name]) byProd[i.name]={name:i.name,qty:0,rev:0};
        byProd[i.name].qty+=i.qty; byProd[i.name].rev+=i.price*i.qty;
      });
    });
    const topProds=Object.values(byProd).sort((a,b)=>b.rev-a.rev).slice(0,8);
    document.getElementById('d-rep-prods').innerHTML=topProds.length?topProds.map(p=>`
      <div class="rep-item-row">
        <div><div class="rep-item-name">${p.name}</div><div class="rep-item-qty">Vipande ${p.qty}</div></div>
        <div class="rep-item-amt">${fmt(p.rev)}</div>
      </div>`).join(''):
      '<div class="empty-state" style="padding:20px"><div class="empty-icon">📦</div><div class="empty-title">Hakuna data</div></div>';

    // Top retailers
    const byRet={};
    orders.forEach(o=>{
      const key=o.retailer_id;
      if(!byRet[key]) byRet[key]={name:o.retailer_biz||o.retailer_name||'Duka',orders:0,total:0};
      byRet[key].orders++; byRet[key].total+=Number(o.total);
    });
    const topRet=Object.values(byRet).sort((a,b)=>b.total-a.total).slice(0,5);
    document.getElementById('d-rep-retailers').innerHTML=topRet.length?topRet.map(r=>`
      <div class="rep-item-row">
        <div><div class="rep-item-name">${r.name}</div><div class="rep-item-qty">Maombi ${r.orders}</div></div>
        <div class="rep-item-amt">${fmt(r.total)}</div>
      </div>`).join(''):
      '<div class="empty-state" style="padding:20px"><div class="empty-icon">🏪</div><div class="empty-title">Hakuna data</div></div>';
  } catch(e){ console.warn(e); }
};

/* ════════════════════════════════════════════════════════════
   BOSS MODE
════════════════════════════════════════════════════════════ */
async function loadBossMode() {
  try {
    const today=new Date(); today.setHours(0,0,0,0);
    const {data:sales=[]} = await sb.from('pos_sales').select('*').eq('user_id',State.session.user_id).gte('created_at',today.toISOString());
    const total=sales.reduce((a,s)=>a+Number(s.total),0);
    animateCount(document.getElementById('boss-sales'),total,'TZS ');
    document.getElementById('boss-txn').textContent=sales.length;

    // Activity: last 20 transactions
    const {data:activity=[]} = await sb.from('pos_sales').select('*').eq('user_id',State.session.user_id).order('created_at',{ascending:false}).limit(20);
    document.getElementById('boss-activity').innerHTML = activity.length ? activity.map(a=>{
      const items=typeof a.items==='string'?JSON.parse(a.items||'[]'):(a.items||[]);
      const timeStr=new Date(a.created_at).toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'});
      return `<div class="activity-row">
        <div class="act-icon">💰</div>
        <div class="act-text">
          <div class="act-title">${a.ref} — ${fmt(a.total)}</div>
          <div class="act-sub">${items.map(i=>i.name+'×'+i.qty).join(', ')}</div>
        </div>
        <div class="act-time">${timeStr}</div>
      </div>`;
    }).join('') : '<div class="empty-state" style="padding:20px"><div class="empty-icon">💰</div><div class="empty-title">Hakuna miamala leo</div></div>';

    // Staff performance
    const {data:staff=[]} = await sb.from('staff_members').select('*').eq('distributor_id',State.session.user_id);
    document.getElementById('boss-staff-perf').innerHTML = staff.length ? staff.map(s=>`
      <div class="staff-card">
        <div class="staff-av">${initials(s.name)}</div>
        <div class="staff-info">
          <div class="staff-name">${s.name}</div>
          <div><span class="role-badge ${ROLES[s.role]?.badge||'rb-viewer'}">${ROLES[s.role]?.icon||'👁️'} ${ROLES[s.role]?.label||s.role}</span></div>
          <div class="staff-phone">📞 ${s.phone}</div>
        </div>
        <div style="text-align:right">
          <div class="text-xs dim">Hali</div>
          <span class="chip chip-green" style="margin-top:3px">Hai</span>
        </div>
      </div>`).join('') : '<div class="empty-state" style="padding:20px"><div class="empty-icon">👥</div><div class="empty-title">Hakuna wafanyakazi</div></div>';
  } catch(e){ console.warn(e); }
}

/* ════════════════════════════════════════════════════════════
   NOTIFICATIONS
════════════════════════════════════════════════════════════ */
async function loadNotifs() {
  const el = document.getElementById('d-notifs-list');
  el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';
  try {
    const {data=[]} = await sb.from('notifications').select('*').eq('user_id',State.session.user_id).order('created_at',{ascending:false}).limit(50);
    el.innerHTML = data.length ? data.map(n=>`
      <div class="notif-card ${n.read?'':'unread'}">
        <div class="notif-icon-wrap">${n.icon||'🔔'}</div>
        <div style="flex:1">
          <div class="notif-title">${n.title}</div>
          <div class="notif-body">${n.body}</div>
          <div class="notif-time">${new Date(n.created_at).toLocaleString('sw-TZ')}</div>
        </div>
      </div>`).join('') :
      '<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">Hakuna arifa</div></div>';
    // Remove dot
    document.getElementById('d-notif-btn')?.classList.remove('bnav-dot');
  } catch{ el.innerHTML = '<div class="empty-state"><div class="empty-icon">📡</div><div class="empty-title">Hakuna muunganiko</div></div>'; }
}

App.markAllRead = async () => {
  await sb.from('notifications').update({read:true}).eq('user_id',State.session.user_id);
  toast('Arifa zote zimesomwa','success','✅');
  loadNotifs();
};

/* ════════════════════════════════════════════════════════════
   RECEIPTS — THERMAL EFD STYLE
════════════════════════════════════════════════════════════ */
App.showReceipt = (data) => {
  State.currentDoc = {type:'receipt', data};
  document.getElementById('receipt-container').innerHTML = buildReceipt(data);
  showScreen('receipt');
};

App.viewReceipt = async (orderId) => {
  try {
    const {data:o} = await sb.from('orders').select('*').eq('id',orderId).single();
    if (!o) return;
    const items = typeof o.items==='string'?JSON.parse(o.items||'[]'):(o.items||[]);
    App.showReceipt({
      type:'order',
      ref: o.ref_number,
      date: new Date(o.created_at),
      seller: {biz: 'Msambazaji', phone: '', region: o.retailer_region},
      buyer: {biz: o.retailer_biz||o.retailer_name, phone: o.retailer_phone, district: o.retailer_district, region: o.retailer_region},
      items,
      total: o.total,
    });
  } catch(e){ toast('Hitilafu','error','❌'); }
};

function buildReceipt(d) {
  const items = d.items || [];
  const total = d.total || items.reduce((a,i)=>a+i.price*i.qty,0);
  const dateStr = (d.date||new Date()).toLocaleDateString('sw-TZ',{day:'2-digit',month:'short',year:'numeric'});
  const timeStr = (d.date||new Date()).toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'});
  const ref = d.ref || genRef();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=54x54&data=${encodeURIComponent(ref)}`;

  const sellerBiz = d.seller?.biz || 'BomaWave';
  const sellerPhone = d.seller?.phone || '';
  const sellerRegion = d.seller?.region || '';
  const buyerBiz = d.buyer?.biz || '';
  const buyerPhone = d.buyer?.phone || '';
  const buyerDistrict = d.buyer?.district || '';

  // Build items rows
  const itemRows = items.map(i => {
    const line = (i.price * i.qty).toLocaleString('en-TZ');
    const priceStr = Number(i.price).toLocaleString('en-TZ');
    // Truncate name to 16 chars to fit 80mm
    const name = i.name.length > 16 ? i.name.slice(0,15)+'.' : i.name;
    return `<tr>
      <td class="item-name">${name}</td>
      <td style="text-align:center">${i.qty}</td>
      <td style="text-align:right">${priceStr}</td>
      <td>${line}</td>
    </tr>`;
  }).join('');

  const hasBuyer = buyerBiz || buyerPhone;
  const partiesBlock = hasBuyer ? `
    <div class="th-parties">
      <div class="th-party">
        <div class="th-party-lbl">Muuzaji</div>
        <div class="th-party-name">${sellerBiz}</div>
        <div class="th-party-detail">${sellerPhone}${sellerRegion?'\n'+sellerRegion:''}</div>
      </div>
      <div class="th-party">
        <div class="th-party-lbl">Mnunuzi</div>
        <div class="th-party-name">${buyerBiz||'Mteja'}</div>
        <div class="th-party-detail">${buyerPhone}${buyerDistrict?'\n'+buyerDistrict:''}</div>
      </div>
    </div>` : '';

  return `<div class="thermal-wrap">
    <div class="th-header">
      <div style="font-size:18px;font-weight:800;letter-spacing:2px;font-family:'Sora',sans-serif">BOMAWAVE</div>
      <div class="th-biz-name">${sellerBiz}</div>
      <div class="th-biz-sub">${sellerPhone}${sellerPhone&&sellerRegion?' | ':''}${sellerRegion}</div>
      <div class="th-logo-line">****************************</div>
    </div>
    <div class="th-meta bold"><span>RISITI</span><span>${ref}</span></div>
    <div class="th-meta"><span>Tarehe:</span><span>${dateStr}</span></div>
    <div class="th-meta"><span>Saa:</span><span>${timeStr}</span></div>
    <hr class="th-dash">
    ${partiesBlock}
    <table class="th-items">
      <thead>
        <tr>
          <th>BIDHAA</th>
          <th style="text-align:center">QTY</th>
          <th style="text-align:right">BEI</th>
          <th style="text-align:right">JUMLA</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <hr class="th-dash">
    <div class="th-totals">
      <div class="th-tot-row"><span>Jumla Ndogo:</span><span>${total.toLocaleString('en-TZ')}</span></div>
      <div class="th-tot-row"><span>VAT (0%):</span><span>0</span></div>
      <div class="th-tot-row th-grand"><span>JUMLA KUU:</span><span>TZS ${total.toLocaleString('en-TZ')}</span></div>
    </div>
    <div class="th-status-line paid">✓ IMELIPWA</div>
    <div class="th-qr">
      <img src="${qrUrl}" alt="QR" onerror="this.style.display='none'">
      <div class="th-qr-text">
        <strong>Namba ya Kumbukumbu:</strong><br>${ref}<br>
        <span>Hifadhi risiti hii kwa matumizi yako</span>
      </div>
    </div>
    <div class="th-footer">
      www.bomawave.co.tz<br>
      Asante kwa biashara yako! 🙏<br>
      ****************************
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════════════════
   INVOICES — THERMAL EFD STYLE (same 80mm, more formal)
════════════════════════════════════════════════════════════ */
App.viewInvoice = async (orderId) => {
  try {
    const {data:o} = await sb.from('orders').select('*, users!distributor_id(name,business_name,phone,region)').eq('id',orderId).single();
    if (!o) return;
    const items = typeof o.items==='string'?JSON.parse(o.items||'[]'):(o.items||[]);
    State.currentDoc = {type:'invoice', data: {order:o, items}};
    document.getElementById('invoice-container').innerHTML = buildInvoice(o, items);
    showScreen('invoice');
  } catch(e){ toast('Hitilafu','error','❌'); console.error(e); }
};

function buildInvoice(o, items) {
  const total = Number(o.total);
  const dateStr = new Date(o.created_at).toLocaleDateString('sw-TZ',{day:'2-digit',month:'short',year:'numeric'});
  const timeStr = new Date(o.created_at).toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'});
  const ref = o.ref_number;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=54x54&data=${encodeURIComponent(ref)}`;

  const distBiz = o.users?.business_name || 'Msambazaji';
  const distPhone = o.users?.phone || '';
  const distRegion = o.users?.region || '';
  const retailBiz = o.retailer_biz || o.retailer_name || 'Duka';
  const retailPhone = o.retailer_phone || '';
  const retailLoc = [o.retailer_district, o.retailer_region].filter(Boolean).join(', ');

  const statusPaid = o.status === 'delivered';

  const itemRows = items.map((i,idx) => {
    const line = (i.price * i.qty).toLocaleString('en-TZ');
    const name = i.name.length > 14 ? i.name.slice(0,13)+'.' : i.name;
    return `<tr>
      <td>${idx+1}. ${name}</td>
      <td style="text-align:center">${i.qty}</td>
      <td style="text-align:right">${Number(i.price).toLocaleString('en-TZ')}</td>
      <td>${line}</td>
    </tr>`;
  }).join('');

  return `<div class="thermal-wrap">
    <div class="th-header">
      <div style="font-size:18px;font-weight:800;letter-spacing:2px;font-family:'Sora',sans-serif">BOMAWAVE</div>
      <div class="th-biz-name">${distBiz}</div>
      <div class="th-biz-sub">${distPhone}${distPhone&&distRegion?' | ':''}${distRegion}</div>
      <div class="th-logo-line">============================</div>
    </div>
    <div class="th-meta bold"><span>ANKARA No.:</span><span>${ref}</span></div>
    <div class="th-meta"><span>Tarehe:</span><span>${dateStr} ${timeStr}</span></div>
    <div class="th-meta"><span>Hali:</span><span>${statusPaid?'IMELIPWA':'INASUBIRI'}</span></div>
    <hr class="th-dash">
    <div class="th-parties">
      <div class="th-party">
        <div class="th-party-lbl">Muuzaji</div>
        <div class="th-party-name">${distBiz}</div>
        <div class="th-party-detail">${distPhone}${distRegion?'\n'+distRegion:''}</div>
      </div>
      <div class="th-party">
        <div class="th-party-lbl">Mnunuzi</div>
        <div class="th-party-name">${retailBiz}</div>
        <div class="th-party-detail">${retailPhone}${retailLoc?'\n'+retailLoc:''}</div>
      </div>
    </div>
    <hr class="th-dash">
    <table class="th-items">
      <thead>
        <tr>
          <th>BIDHAA</th>
          <th style="text-align:center">QTY</th>
          <th style="text-align:right">BEI</th>
          <th style="text-align:right">JUMLA</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <hr class="th-dash">
    <div class="th-totals">
      <div class="th-tot-row"><span>Jumla ya Bidhaa:</span><span>${total.toLocaleString('en-TZ')}</span></div>
      <div class="th-tot-row"><span>Punguzo:</span><span>0</span></div>
      <div class="th-tot-row"><span>VAT (0%):</span><span>0</span></div>
      <div class="th-tot-row th-grand"><span>JUMLA KUU:</span><span>TZS ${total.toLocaleString('en-TZ')}</span></div>
    </div>
    <div class="th-status-line ${statusPaid?'paid':'pending'}">${statusPaid?'✓ IMELIPWA KABISA':'⏳ INASUBIRI MALIPO'}</div>
    <div class="th-qr">
      <img src="${qrUrl}" alt="QR" onerror="this.style.display='none'">
      <div class="th-qr-text">
        <strong>Kumbukumbu:</strong><br>${ref}<br>
        <span>Ankara hii ni hati rasmi</span>
      </div>
    </div>
    <div class="th-footer">
      www.bomawave.co.tz<br>
      Asante kwa ushirikiano wako! 🙏<br>
      ============================
    </div>
  </div>`;
}

/* ─── Doc actions (print/share) ─── */
App.printDoc = () => {
  window.print();
};

App.shareDoc = async () => {
  if (navigator.share) {
    try {
      await navigator.share({title:'BomaWave Document', text:'Risiti/Ankara kutoka BomaWave', url:window.location.href});
    } catch {}
  } else {
    toast('Nakili URL ya ukurasa huu','info','📤');
  }
};

/* ════════════════════════════════════════════════════════════
   LOGOUT
════════════════════════════════════════════════════════════ */
App.logout = () => {
  openModal(`
    <div class="modal-title">🚪 Toka</div>
    <p style="font-size:14px;color:var(--text2);margin-bottom:16px">Una uhakika unataka kutoka?</p>
    <div class="btn-row">
      <button class="btn btn-secondary" onclick="closeModal()">Ghairi</button>
      <button class="btn btn-danger" onclick="App.confirmLogout()">Ndio, Toka</button>
    </div>
  `);
};

App.confirmLogout = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(BIOMETRIC_KEY);
  State.session = null;
  closeModal();
  location.reload();
};

/* ════════════════════════════════════════════════════════════
   INITIALISE
════════════════════════════════════════════════════════════ */
async function init() {
  await initPosDB();
  initPWA();
  populateRegions();

  // Sync offline data when back online
  window.addEventListener('online', syncOfflineData);

  // Restore session
  if (restoreSession()) {
    launchApp();
  } else {
    showScreen('lang');
  }

  // Sync any pending offline sales
  if (navigator.onLine) {
    setTimeout(syncOfflineData, 2000);
  }
}

document.addEventListener('DOMContentLoaded', init);

/* ════════════════════════════════════════════════════════════
   SERVICE WORKER REGISTRATION
════════════════════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
}

// closeModal available globally for inline onclick
window.closeModal = closeModal;
