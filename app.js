// ══════════════════════════════════════════════════════════════
// BomaWave v3.2 — Clean version
// ══════════════════════════════════════════════════════════════
import { supabase as sb } from './supabase.js';

const OTP_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/otp';
const SB_KEY  = 'sb_publishable_yJni7Xxl78x24V1mJvLjVg_RAWAsGOt';

// ── State ─────────────────────────────────────────────────────
let S = {
  user: null, lang: 'sw', role: null,
  pendingPhone: null, pendingData: null,
  pinBuf: '', cart: [], cartDist: null,
  page: 'dashboard', notifs: [],
  resendTimer: null, loginResendTimer: null, forgotResendTimer: null,
  realtimeCh: null, isOnline: navigator.onLine,
  store: null, stores: [],
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

function toast(msg, type='s') {
  const wrap = $('twrap');
  const el = document.createElement('div');
  const icons = {s:'✅', e:'❌', i:'ℹ️', w:'⚠️'};
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
  try {
    const res = await fetch(OTP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
        'Authorization': `Bearer ${SB_KEY}` },
      body: JSON.stringify(payload),
    });
    return res.json();
  } catch(e) { return { success: false, message: e.message }; }
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
  const fill = $('pfill');
  if(fill) fill.style.width = pct+'%';
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
    if (S.user) { saveSession(); if(window.App.renderApp) window.App.renderApp(); }
    const swBtn = $('lsw-sw');
    const enBtn = $('lsw-en');
    if(swBtn) swBtn.classList.toggle('on', lang==='sw');
    if(enBtn) enBtn.classList.toggle('on', lang==='en');
  },

  // ── Role ─────────────────────────────────────────────────
  pickRole(role) {
    S.role = role;
    const rbRet = $('rb-ret');
    const rbDist = $('rb-dist');
    if(rbRet) rbRet.classList.toggle('sel', role==='retailer');
    if(rbDist) rbDist.classList.toggle('sel', role==='distributor');
    const ckRet = $('ck-ret');
    const ckDist = $('ck-dist');
    if(ckRet) ckRet.style.display = role==='retailer'?'':'none';
    if(ckDist) ckDist.style.display = role==='distributor'?'':'none';
    const rnext = $('rnext');
    if(rnext) rnext.style.display = 'flex';
  },

  proceedFromRole() {
    if (!S.role) return;
    goStep(S.role==='retailer' ? 3 : 4);
  },

  goToRegister() { goStep(2); },
  goStep(step) { goStep(step); },

  // ── Location changes ────────────────────────────────────
  onRegionChange() {
    const r = $('reg-region')?.value;
    const dists = r ? Object.keys(LOC[r]||{}) : [];
    fillSelect('reg-district', dists, '— Wilaya —');
    fillSelect('reg-ward', [], '— Kata —');
  },
  onDistrictChange() {
    const r = $('reg-region')?.value, d = $('reg-district')?.value;
    const wards = (r&&d) ? (LOC[r]?.[d]||[]) : [];
    fillSelect('reg-ward', wards, '— Kata —');
  },
  onDRegionChange() {
    const r = $('dreg-region')?.value;
    const dists = r ? Object.keys(LOC[r]||{}) : [];
    fillSelect('dreg-district', dists, '— Wilaya —');
    fillSelect('dreg-ward', [], '— Kata —');
  },
  onDDistrictChange() {
    const r = $('dreg-region')?.value, d = $('dreg-district')?.value;
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
    const name = $('reg-name')?.value.trim();
    const rawPhone = $('reg-phone')?.value.trim();
    const pin = $('reg-pin')?.value.trim();
    const pin2 = $('reg-pin2')?.value.trim();

    if (!name) return toast('Weka jina la duka', 'e');
    const phone = normPhone(rawPhone);
    if (!phone) return toast('Namba ya simu si sahihi', 'e');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'e');
    if (pin !== pin2) return toast('PIN hazilingani', 'e');

    S.pendingData = {
      role: 'retailer',
      store_name: name, phone, pin,
      region: $('reg-region')?.value,
      district: $('reg-district')?.value,
      ward: $('reg-ward')?.value,
      street: $('reg-street')?.value,
      business_type: $('reg-btype')?.value,
    };
    S.pendingPhone = phone;

    setBusy('reg-btn', true);
    const r = await callOTP({ action:'send_otp', phone });
    setBusy('reg-btn', false, 'Endelea — Tuma OTP');

    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast('OTP imetumwa! ✅', 's');
    setText('otp-phone', phone);
    if(window.App.clearOTPBoxes) window.App.clearOTPBoxes('ob');
    if(window.App.startResendTimer) window.App.startResendTimer();
    goStep(5);
  },

  // ── Distributor registration ────────────────────────────
  async submitDDetails() {
    const name = $('dreg-name')?.value.trim();
    const rawPhone = $('dreg-phone')?.value.trim();
    const pin = $('dreg-pin')?.value.trim();
    const pin2 = $('dreg-pin2')?.value.trim();

    if (!name) return toast('Weka jina la biashara', 'e');
    const phone = normPhone(rawPhone);
    if (!phone) return toast('Namba ya simu si sahihi', 'e');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'e');
    if (pin !== pin2) return toast('PIN hazilingani', 'e');

    const checkedCats = [...document.querySelectorAll('#cat-grid input:checked')].map(i=>i.value);

    S.pendingData = {
      role: 'distributor',
      store_name: name, phone, pin,
      region: $('dreg-region')?.value,
      district: $('dreg-district')?.value,
      ward: $('dreg-ward')?.value,
      street: $('dreg-street')?.value,
      coverage_area: $('dreg-coverage')?.value,
      min_delivery_amount: parseFloat($('dreg-mindel')?.value||'0'),
      categories: checkedCats.join(','),
    };
    S.pendingPhone = phone;

    setBusy('dreg-btn', true);
    const r = await callOTP({ action:'send_otp', phone });
    setBusy('dreg-btn', false, 'Endelea — Tuma OTP');

    if (!r.success) return toast(r.message || 'Hitilafu', 'e');
    toast('OTP imetumwa! ✅', 's');
    setText('otp-phone', phone);
    if(window.App.clearOTPBoxes) window.App.clearOTPBoxes('ob');
    if(window.App.startResendTimer) window.App.startResendTimer();
    goStep(5);
  },

  // ── Registration OTP boxes ─────────────────────────────
  oi(i, el) {
    if(!el) return;
    el.value = el.value.replace(/\D/g,'').slice(-1);
    el.classList.toggle('on', !!el.value);
    if (el.value && i < 5) $(`ob${i+1}`)?.focus();
    if (i===5 && el.value && window.App.verifyRegOTP) window.App.verifyRegOTP();
  },
  ok(i, e) {
    if (e.key==='Backspace' && !$(`ob${i}`)?.value && i>0) $(`ob${i-1}`)?.focus();
  },
  clearOTPBoxes(prefix, count=6) {
    for (let i=0;i<count;i++) {
      const el=$(prefix+i); if(el){el.value='';el.classList.remove('on','err');}
    }
  },
  getOTPVal(prefix, count=6) {
    return Array.from({length:count},(_,i)=>$(prefix+i)?.value||'').join('');
  },

  startResendTimer() {
    clearInterval(S.resendTimer);
    let sec = 60;
    const timer = $('rtimer'), btn = $('rbtn');
    if(timer) timer.style.display='';
    if(btn) btn.style.display='none';
    if(timer) timer.textContent = S.lang==='sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
    S.resendTimer = setInterval(()=>{
      sec--;
      if(sec<=0){clearInterval(S.resendTimer);if(timer) timer.style.display='none';if(btn) btn.style.display='';}
      else if(timer) timer.textContent = S.lang==='sw'?`Tuma tena baada ya ${sec}s`:`Resend in ${sec}s`;
    },1000);
  },

  async resendRegOTP() {
    if (!S.pendingPhone) return;
    const r = await callOTP({ action:'send_otp', phone: S.pendingPhone });
    if (r.success) { toast('OTP imetumwa tena','s'); if(window.App.startResendTimer) window.App.startResendTimer(); }
    else toast(r.message||'Hitilafu','e');
  },

  async verifyRegOTP() {
    const code = window.App.getOTPVal('ob');
    if (code.length !== 6) return toast('Weka nambari 6 kamili','e');
    setBusy('vbtn', true);
    const r = await callOTP({ action:'verify_otp', phone: S.pendingPhone, otp_code: code });
    if (!r.success) {
      setBusy('vbtn', false, 'Thibitisha');
      for(let i=0;i<6;i++) $(`ob${i}`)?.classList.add('err');
      return toast(r.message||'Nambari si sahihi','e');
    }
    const reg = await callOTP({ action:'complete_registration', phone: S.pendingPhone, ...S.pendingData });
    setBusy('vbtn', false, 'Thibitisha');
    if (!reg.success) return toast(reg.message||'Tatizo la kuunda akaunti','e');
    toast('Akaunti imefunguliwa! 🎉','s');
    S.user = reg.user;
    saveSession();
    if(window.App.showApp) window.App.showApp();
  },

  goBack5() {
    goStep(S.role==='retailer' ? 3 : 4);
  },

  // ── Login ────────────────────────────────────────────────
  async sendLoginOTP() {
    const raw = $('lphone')?.value.trim();
    const phone = normPhone(raw);
    if (!phone) return toast('Namba ya simu si sahihi','e');
    S.pendingPhone = phone;
    setBusy('lotp-txt', false);
    const r = await callOTP({ action:'send_otp', phone });
    if (!r.success) return toast(r.message||'Hitilafu','e');
    toast('OTP imetumwa! ✅','s');
    setText('lotp-phone', phone);
    if(window.App.clearOTPBoxes) window.App.clearOTPBoxes('lb');
    if(window.App.startLoginResendTimer) window.App.startLoginResendTimer();
    goStep(9);
  },

  loi(i,el) {
    if(!el) return;
    el.value=el.value.replace(/\D/g,'').slice(-1);
    el.classList.toggle('on',!!el.value);
    if(el.value&&i<5)$(`lb${i+1}`)?.focus();
    if(i===5&&el.value && window.App.verifyLoginOTP) window.App.verifyLoginOTP();
  },
  lok(i,e) { if(e.key==='Backspace'&&!$(`lb${i}`)?.value&&i>0)$(`lb${i-1}`)?.focus(); },

  startLoginResendTimer() {
    clearInterval(S.loginResendTimer);
    let sec=60; const timer=$('lrtimer'),btn=$('lrbtn');
    if(timer) timer.style.display='';
    if(btn) btn.style.display='none';
    if(timer) timer.textContent=S.lang==='sw'?`Tuma tena baada ya ${sec}s`:`Resend in ${sec}s`;
    S.loginResendTimer=setInterval(()=>{
      sec--;
      if(sec<=0){clearInterval(S.loginResendTimer);if(timer) timer.style.display='none';if(btn) btn.style.display='';}
      else if(timer) timer.textContent=S.lang==='sw'?`Tuma tena baada ya ${sec}s`:`Resend in ${sec}s`;
    },1000);
  },
  async resendLoginOTP() {
    if(!S.pendingPhone)return;
    const r=await callOTP({action:'send_otp',phone:S.pendingPhone});
    if(r.success){toast('OTP imetumwa tena','s');if(window.App.startLoginResendTimer) window.App.startLoginResendTimer();}
    else toast(r.message||'Hitilafu','e');
  },

  async verifyLoginOTP() {
    const code=window.App.getOTPVal('lb');
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
    S.pinBuf=''; if(window.App.renderPinDots) window.App.renderPinDots();
    setText('s7h', S.lang==='sw'?'Karibu!':'Welcome!');
    setText('s7sub', r.user.store_name||'');
    goStep(7);
  },

  // ── PIN keypad ──────────────────────────────────────────
  pk(digit) {
    if(S.pinBuf.length>=4)return;
    S.pinBuf+=digit; if(window.App.renderPinDots) window.App.renderPinDots();
    if(S.pinBuf.length===4)setTimeout(()=>{ if(window.App.checkPin) window.App.checkPin(); },200);
  },
  pdel() { S.pinBuf=S.pinBuf.slice(0,-1); if(window.App.renderPinDots) window.App.renderPinDots(); },
  renderPinDots() {
    for(let i=0;i<4;i++){
      const dot=$(pd${i});
      if(dot){dot.classList.toggle('on',i<S.pinBuf.length);dot.classList.remove('err');}
    }
    setText('perr','');
  },
  checkPin() {
    if(S.pinBuf===String(S.user.pin)){
      S.user.last_login=new Date().toISOString();
      saveSession();
      if(window.App.showApp) window.App.showApp();
    } else {
      for(let i=0;i<4;i++) $(pd${i})?.classList.add('err');
      setText('perr', S.lang==='sw'?'PIN si sahihi. Jaribu tena.':'Wrong PIN. Try again.');
      setTimeout(()=>{S.pinBuf='';if(window.App.renderPinDots) window.App.renderPinDots();},900);
    }
  },

  // ── Forgot PIN ─────────────────────────────────────────
  forgotPin() { S.pinBuf=''; goStep(10); },

  async sendForgotOTP() {
    const raw=$('fphone')?.value.trim();
    const phone=normPhone(raw);
    if(!phone)return toast('Namba ya simu si sahihi','e');
    S.pendingPhone=phone;
    const r=await callOTP({action:'send_otp',phone});
    if(!r.success)return toast(r.message||'Hitilafu','e');
    toast('OTP imetumwa! ✅','s');
    setText('fotp-phone',phone);
    if(window.App.clearOTPBoxes) window.App.clearOTPBoxes('fb');
    goStep(11);
  },

  foi(i,el){
    if(!el) return;
    el.value=el.value.replace(/\D/g,'').slice(-1);
    el.classList.toggle('on',!!el.value);
    if(el.value&&i<5)$(`fb${i+1}`)?.focus();
    if(i===5&&el.value && window.App.verifyForgotOTP) window.App.verifyForgotOTP();
  },
  fok(i,e){if(e.key==='Backspace'&&!$(`fb${i}`)?.value&&i>0)$(`fb${i-1}`)?.focus();},

  async verifyForgotOTP() {
    const code=window.App.getOTPVal('fb');
    if(code.length!==6)return toast('Weka nambari 6 kamili','e');
    setBusy('fvbtn',true);
    const r=await callOTP({action:'verify_otp',phone:S.pendingPhone,otp_code:code});
    setBusy('fvbtn',false,'Thibitisha');
    if(!r.success){for(let i=0;i<6;i++)$(`fb${i}`)?.classList.add('err');return toast(r.message||'Nambari si sahihi','e');}
    if(!r.user_exists)return toast(S.lang==='sw'?'Namba hii haijasajiliwa.':'Number not registered.','e');
    S.user=r.user; goStep(12);
  },

  async resetPin() {
    const pin=$('npin')?.value.trim(), pin2=$('npin2')?.value.trim();
    if(pin.length!==4||!/^\d{4}$/.test(pin))return toast('PIN lazima iwe tarakimu 4','e');
    if(pin!==pin2)return toast('PIN hazilingani','e');
    setBusy('rpintxt',false);
    const r=await callOTP({action:'reset_pin',phone:S.pendingPhone,pin});
    if(!r.success)return toast(r.message||'Hitilafu','e');
    toast(S.lang==='sw'?'PIN imebadilishwa! ✅':'PIN updated! ✅','s');
    S.user=r.user; saveSession();
    if(window.App.showApp) window.App.showApp();
  },

  // ── Show App ────────────────────────────────────────────
  showApp() {
    const onboarding = $('onboarding');
    const appMain = $('app-main');
    if(onboarding) onboarding.style.display='none';
    if(appMain) appMain.style.display='block';
    if(window.App.renderApp) window.App.renderApp();
  },

  logout() {
    if(S.realtimeCh && sb.removeChannel) sb.removeChannel(S.realtimeCh);
    S = { user: null, lang: S.lang, role: null, pendingPhone: null, pendingData: null,
           pinBuf: '', cart: [], cartDist: null, page: 'dashboard', notifs: [],
           resendTimer: null, loginResendTimer: null, forgotResendTimer: null, realtimeCh: null,
           isOnline: navigator.onLine, store: null, stores: [] };
    clearSession();
    const onboarding = $('onboarding');
    const appMain = $('app-main');
    if(onboarding) onboarding.style.display='flex';
    if(appMain) appMain.style.display='none';
    goStep(1);
  },

  // ── Placeholder for other methods (minimal to avoid errors) ──
  renderApp() { console.log('App rendered'); },
  navTo(page) { S.page = page; if(window.App.renderApp) window.App.renderApp(); },
  toggleSidebar() { $('sidebar')?.classList.toggle('open'); $('sovl')?.classList.toggle('active'); },
  closeSidebar() { $('sidebar')?.classList.remove('open'); $('sovl')?.classList.remove('active'); },
  toggleNotif() { $('ndd')?.classList.toggle('open'); },
  clearNotifs() { S.notifs = []; if(window.App.renderNotifs) window.App.renderNotifs(); },
  renderNotifs() { const list = $('nlist'); if(list) list.innerHTML = '<div class="nde">No notifications</div>'; },
  addNotif(txt) { S.notifs.unshift({txt, time: new Date().toLocaleTimeString()}); if(window.App.renderNotifs) window.App.renderNotifs(); },
  setupRealtime() { console.log('Realtime setup'); },
  playSmsSound() {},
  toggleCart() { $('cpanel')?.classList.toggle('open'); },
  placeOrder() { toast('Order placement coming soon', 'i'); },
  addToCart(p) { console.log('Add to cart', p); },
  cartChange() {},
  updateCartUI() {},
  renderCartPanel() {},
  changeDist() {},
  filterCat() {},
  pageDashboard() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">Dashboard</span></div><div class="empty"><div class="empty-ic">🏠</div><div class="empty-t">Welcome to BomaWave</div></div></div></div>'; },
  pageMarketplace() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">Marketplace</span></div><div class="empty"><div class="empty-ic">🛒</div><div class="empty-t">Coming soon</div></div></div></div>'; },
  pageMyOrders() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">My Orders</span></div><div class="empty"><div class="empty-ic">📦</div><div class="empty-t">No orders yet</div></div></div></div>'; },
  pageOrders() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">Orders</span></div><div class="empty"><div class="empty-ic">📋</div><div class="empty-t">No orders</div></div></div></div>'; },
  pageProducts() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">Products</span></div><div class="empty"><div class="empty-ic">📦</div><div class="empty-t">No products</div></div></div></div>'; },
  pagePOS() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">POS</span></div><div class="empty"><div class="empty-ic">💰</div><div class="empty-t">POS coming soon</div></div></div></div>'; },
  pageReports() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">Reports</span></div><div class="empty"><div class="empty-ic">📊</div><div class="empty-t">No data</div></div></div></div>'; },
  pageDebts() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">Debts</span></div><div class="empty"><div class="empty-ic">💳</div><div class="empty-t">No debts</div></div></div></div>'; },
  pageInvoices() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">Invoices</span></div><div class="empty"><div class="empty-ic">📄</div><div class="empty-t">No invoices</div></div></div></div>'; },
  pageUsers() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">Users</span></div><div class="empty"><div class="empty-ic">👥</div><div class="empty-t">No users</div></div></div></div>'; },
  pageAnalytics() { const av = $('av'); if(av) av.innerHTML = '<div class="card"><div class="cp"><div class="sh"><span class="st">Analytics</span></div><div class="empty"><div class="empty-ic">📈</div><div class="empty-t">No data</div></div></div></div>'; },
  async renderPage(page) {
    const pages = {
      dashboard: () => window.App.pageDashboard(),
      marketplace: () => window.App.pageMarketplace(),
      'my-orders': () => window.App.pageMyOrders(),
      orders: () => window.App.pageOrders(),
      products: () => window.App.pageProducts(),
      pos: () => window.App.pagePOS(),
      reports: () => window.App.pageReports(),
      debts: () => window.App.pageDebts(),
      invoices: () => window.App.pageInvoices(),
      users: () => window.App.pageUsers(),
      analytics: () => window.App.pageAnalytics(),
    };
    if(pages[page]) pages[page]();
    else window.App.pageDashboard();
  },
  getNavItems(role) { return [{page:'dashboard',icon:'🏠',label:'Home'}]; },

}; // end App

// ── SVG Icons ─────────────────────────────────────────────────
function svgIcon(name) { return '🔹'; }

function statusPill(status,lang) { return `<span class="pill p-pen">${status}</span>`; }
function statusBadge(role) { return `<span class="rbadge rb-ret">${role}</span>`; }

// ── BOOT ─────────────────────────────────────────────────────
async function boot() {
  initLocDropdowns('reg-region','reg-district','reg-ward');
  initLocDropdowns('dreg-region','dreg-district','dreg-ward');
  buildCatGrid();
  goStep(1);

  if (loadSession() && S.user) {
    S.pinBuf='';
    for(let i=0;i<4;i++){const d=$(pd${i});if(d)d.classList.remove('on','err');}
    setText('s7h', S.lang==='sw'?'Karibu!':'Welcome!');
    setText('s7sub', S.user.store_name||'');
    const prog=$('pfill');
    if(prog)prog.style.width='90%';
    goStep(7);
  }
}

boot();
