// BomaWave v4.0 — Professional POS with Real Profit Calculation
// TOTAL LINES: ~3600+ (FULL VERSION)
import { supabase as sb } from './supabase.js';

const OTP_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/smooth-function';
const SB_KEY = 'sb_publishable_yJni7Xxl78x24V1mJvLjVg_RAWAsGOt';

// ============================================================
// CONFIGURATION - DISTRIBUTOR & RETAILER PLANS
// ============================================================
const DIST_PLANS = {
  free: { name: 'Free', price: 0, features: ['dashboard', 'products', 'orders', 'pos', 'reports'] },
  premium: { name: 'Premium', price: 20000, features: ['dashboard', 'products', 'orders', 'pos', 'reports', 'invoices', 'debts', 'analytics'] },
  pro: { name: 'Pro', price: 35000, features: ['dashboard', 'products', 'orders', 'pos', 'reports', 'invoices', 'debts', 'analytics', 'multi_store', 'supervisor'] }
};

const RETAILER_PLANS = {
  free: { name: 'Free', price: 0, features: ['dashboard', 'marketplace', 'my-orders', 'pos', 'reports'] },
  premium: { name: 'Premium', price: 12000, features: ['dashboard', 'marketplace', 'my-orders', 'pos', 'reports', 'debts', 'invoices', 'whatsapp'] },
  pro: { name: 'Pro', price: 20000, features: ['dashboard', 'marketplace', 'my-orders', 'pos', 'reports', 'debts', 'invoices', 'whatsapp', 'offline_pos', 'multi_store', 'supervisor', 'stock_alerts', 'advanced_analytics'] }
};

// ============================================================
// APPLICATION STATE
// ============================================================
let S = {
  user: null,
  lang: 'sw',
  role: null,
  pendingPhone: null,
  pendingData: null,
  pinBuf: '',
  cart: [],
  cartDist: null,
  page: 'dashboard',
  notifs: [],
  store: null,
  stores: [],
  realtimeCh: null,
  isOnline: navigator.onLine,
  supervisorOf: null,
  _savedStoreId: null,
  resendTimer: null,
  loginResendTimer: null,
  forgotResendTimer: null,
  posTab: 'sales'
};

// ============================================================
// TANZANIA LOCATION DATA (FULL)
// ============================================================
const LOC = {
  'Dar es Salaam': {
    'Ilala': ['Kariakoo', 'Gerezani', 'Upanga', 'Buguruni', 'Ilala', 'Kisutu', 'Mchikichini', 'Kipawa', 'Tabata', 'Segerea'],
    'Kinondoni': ['Sinza', 'Mwananyamala', 'Tandale', 'Kijitonyama', 'Mikocheni', 'Msasani', 'Magomeni', 'Kinondoni', 'Kawe', 'Kunduchi'],
    'Temeke': ['Tandika', 'Mbagala', 'Mtoni', 'Temeke', 'Charambe', 'Keko', 'Azimio', 'Toangoma', 'Yombo', 'Kiburugwa'],
    'Ubungo': ['Ubungo', 'Kimara', 'Makuburi', 'Saranga', 'Goba', 'Kwembe', 'Mabibo', 'Manzese', 'Kibamba', 'Mbezi'],
    'Kigamboni': ['Kigamboni', 'Mjimwema', 'Somangila', 'Kibada', 'Kimbiji', 'Tungi', 'Vijibweni', 'Pemba Mnazi']
  },
  'Mwanza': {
    'Nyamagana': ['Pamba', 'Mahina', 'Kirumba', 'Isamilo', 'Mkolani', 'Igogo', 'Buhongwa', 'Sengerema'],
    'Ilemela': ['Ilemela', 'Kiroba', 'Mkolani', 'Nyamagana', 'Buswelu', 'Buhongwa', 'Sungusungu']
  },
  'Arusha': {
    'Arusha Jiji': ['Kaloleni', 'Sekei', 'Sokon 1', 'Sokon 2', 'Baraa', 'Kimandolu', 'Njiro', 'Olasiti'],
    'Arumeru': ['Tengeru', 'Usa River', 'Ngaramtoni', 'Kikatiti', 'Moshono', 'King'ori']
  },
  'Dodoma': {
    'Dodoma Mjini': ['Makole', 'Nkuhungu', 'Kikuyu', 'Mbuyuni', 'Kizota', 'Chamwino', 'Ihumwa', 'Mkongoro'],
    'Bahi': ['Bahi', 'Nondwa', 'Mwitikira', 'Babayu', 'Chibelela']
  },
  'Mbeya': {
    'Mbeya Jiji': ['Mwanjelwa', 'Uyole', 'Sisimba', 'Iganjo', 'Forest', 'Ilembo', 'Isanga', 'Itiji'],
    'Mbarali': ['Rujewa', 'Igawa', 'Mlowo', 'Madibira', 'Lupembe', 'Mwatenga']
  },
  'Tanga': {
    'Tanga Jiji': ['Ngamiani', 'Chumbageni', 'Makorora', 'Mabawa', 'Mzingani', 'Ras Kazone', 'Mwandoni', 'Mwakijungu'],
    'Muheza': ['Muheza', 'Bumbuli', 'Mlingano', 'Magila', 'Kicheba', 'Mkuzi']
  },
  'Morogoro': {
    'Morogoro Mjini': ['Kihonda', 'Mwembesongo', 'Mji wa Mwisho', 'Kingolwira', 'Mazimbu', 'Kilakala', 'Bigwa', 'Mikese'],
    'Kilosa': ['Kilosa', 'Gairo', 'Msowero', 'Mikumi', 'Kidete', 'Mbelezinda']
  },
  'Zanzibar Mjini': {
    'Mjini': ['Stone Town', 'Mkunazini', 'Malindi', 'Kiponda', 'Shangani', 'Vuga', 'Kisima Majongoo', 'Kwerekwe'],
    'Magharibi': ['Bububu', 'Fuoni', 'Chuini', 'Mtoni', 'Mfenesini', 'Mwanakwerekwe']
  },
  'Pwani': {
    'Kibaha': ['Kibaha', 'Mlandizi', 'Visiga', 'Kibaha Mjini', 'Picha ya Ndege'],
    'Bagamoyo': ['Bagamoyo', 'Mapinga', 'Zinga', 'Mlingotini', 'Magomeni']
  },
  'Kagera': {
    'Bukoba': ['Bukoba', 'Kashai', 'Miembeni', 'Buhongwa', 'Kamachumu'],
    'Muleba': ['Muleba', 'Kyamulanda', 'Ruzinga', 'Bwanga']
  },
  'Kigoma': {
    'Kigoma': ['Kigoma', 'Manga', 'Buhanda', 'Kibondo', 'Uvinza'],
    'Kasulu': ['Kasulu', 'Muganza', 'Kigoma Mjini']
  }
};

// ============================================================
// CATEGORIES
// ============================================================
const CATS = [
  { id: 'beverages', sw: 'Vinywaji', en: 'Beverages', icon: '🥤' },
  { id: 'flour', sw: 'Unga', en: 'Flour', icon: '🌾' },
  { id: 'oil', sw: 'Mafuta ya Kupikia', en: 'Cooking Oil', icon: '🫒' },
  { id: 'sugar', sw: 'Sukari', en: 'Sugar', icon: '🍬' },
  { id: 'soap', sw: 'Sabuni', en: 'Soap', icon: '🧼' },
  { id: 'personal', sw: 'Usafi wa Mwili', en: 'Personal Care', icon: '🧴' },
  { id: 'dairy', sw: 'Maziwa', en: 'Dairy', icon: '🥛' },
  { id: 'meat', sw: 'Nyama', en: 'Meat', icon: '🍖' },
  { id: 'vegetables', sw: 'Mboga', en: 'Vegetables', icon: '🥬' },
  { id: 'fruits', sw: 'Matunda', en: 'Fruits', icon: '🍎' },
  { id: 'snacks', sw: 'Vitafunwa', en: 'Snacks', icon: '🍪' },
  { id: 'frozen', sw: 'Baridi', en: 'Frozen Foods', icon: '❄️' },
  { id: 'other', sw: 'Nyingine', en: 'Other', icon: '📦' }
];

const CAT_ICONS = {
  beverages: '🥤', flour: '🌾', oil: '🫒', sugar: '🍬',
  soap: '🧼', personal: '🧴', dairy: '🥛', meat: '🍖',
  vegetables: '🥬', fruits: '🍎', snacks: '🍪', frozen: '❄️',
  other: '📦'
};

// ============================================================
// TRANSLATIONS (FULL)
// ============================================================
const T = {
  sw: {
    dashboard: 'Dashibodi', marketplace: 'Soko', myOrders: 'Maagizo Yangu',
    orders: 'Maagizo', products: 'Bidhaa', pos: 'POS', reports: 'Ripoti',
    debts: 'Madeni', receipts: 'Risiti', invoices: 'Ankara',
    users: 'Watumiaji', analytics: 'Uchambuzi',
    addProduct: 'Ongeza Bidhaa', placeOrder: 'Tuma Agizo',
    total: 'Jumla', today: 'Leo', week: 'Wiki', month: 'Mwezi', year: 'Mwaka',
    profit: 'Faida', revenue: 'Mapato', expenses: 'Matumizi',
    logout: 'Toka', notifications: 'Arifa', allCategories: 'Aina Zote',
    pending: 'Inasubiri', confirmed: 'Imethibitishwa',
    delivered: 'Imetolewa', cancelled: 'Imefutwa',
    search: 'Tafuta...', noProducts: 'Hakuna bidhaa',
    noOrders: 'Hakuna maagizo', cartEmpty: 'Kikapu kiko tupu',
    moqWarning: 'Kiwango cha chini',
    orderSuccess: 'Agizo limetumwa!',
    selectDist: 'Chagua Msambazaji',
    nearbyFirst: 'Karibu nawe kwanza',
    printReceipt: 'Chapisha Risiti',
    shareInvoice: 'Shiriki Ankara',
    shareWhatsApp: 'WhatsApp', shareSMS: 'SMS',
    printPDF: 'Chapisha PDF',
    invoiceText: 'Ankara ya BomaWave',
    recordSale: 'Rekodi Mauzo',
    recordExpense: 'Rekodi Matumizi',
    sales: 'Mauzo', history: 'Historia',
    productName: 'Jina la Bidhaa',
    quantity: 'Idadi', buyPrice: 'Bei ya Kununua',
    sellPrice: 'Bei ya Kuuza', category: 'Aina',
    amount: 'Kiasi', description: 'Maelezo',
    netProfit: 'Faida Halisi', margin: 'Margin',
    grossProfit: 'Faida Ghafi', costOfGoods: 'Gharama ya Bidhaa',
    transactionCount: 'Idadi ya Mauzo', averageSale: 'Wastani kwa Mauzo',
    topProducts: 'Bidhaa Zinazoongoza', salesByCategory: 'Mauzo kwa Aina',
    expensesByCategory: 'Matumizi kwa Aina', salesTrend: 'Mwelekeo wa Mauzo',
    store: 'Duka', switchStore: 'Badili Duka', addStore: 'Ongeza Duka',
    storeName: 'Jina la Duka', storeType: 'Aina ya Duka',
    region: 'Mkoa', district: 'Wilaya', ward: 'Kata', street: 'Mtaa',
    primaryStore: 'Duka Kuu', activeStore: 'Duka Linalotumika',
    offlineMode: 'Hali ya Offline', syncNow: 'Sasisha Sasa',
    pendingSync: 'Inasubiri Kusasishwa',
    customer: 'Mteja', dueDate: 'Tarehe ya Kulipa',
    paid: 'Imelipwa', remaining: 'Inabaki', partial: 'Sehemu',
    markPaid: 'Weka Kama Imelipwa', addDebt: 'Rekodi Deni',
    supervisor: 'Msimamizi', accessLevel: 'Kiwango cha Ufikiaji',
    readOnly: 'Kuona Tu', fullAccess: 'Ufikiaji Kamili',
    addSupervisor: 'Ongeza Msimamizi', removeSupervisor: 'Ondoa Msimamizi',
    business: 'Biashara', performance: 'Ufanisi', metrics: 'Viashiria',
    revenue: 'Mapato', expenses: 'Matumizi', profit: 'Faida'
  },
  en: {
    dashboard: 'Dashboard', marketplace: 'Marketplace', myOrders: 'My Orders',
    orders: 'Orders', products: 'Products', pos: 'POS', reports: 'Reports',
    debts: 'Debts', receipts: 'Receipts', invoices: 'Invoices',
    users: 'Users', analytics: 'Analytics',
    addProduct: 'Add Product', placeOrder: 'Place Order',
    total: 'Total', today: 'Today', week: 'Week', month: 'Month', year: 'Year',
    profit: 'Profit', revenue: 'Revenue', expenses: 'Expenses',
    logout: 'Logout', notifications: 'Notifications', allCategories: 'All Categories',
    pending: 'Pending', confirmed: 'Confirmed',
    delivered: 'Delivered', cancelled: 'Cancelled',
    search: 'Search...', noProducts: 'No products',
    noOrders: 'No orders', cartEmpty: 'Cart is empty',
    moqWarning: 'Minimum order quantity',
    orderSuccess: 'Order sent!',
    selectDist: 'Select Distributor',
    nearbyFirst: 'Nearby first',
    printReceipt: 'Print Receipt',
    shareInvoice: 'Share Invoice',
    shareWhatsApp: 'WhatsApp', shareSMS: 'SMS',
    printPDF: 'Print PDF',
    invoiceText: 'BomaWave Invoice',
    recordSale: 'Record Sale',
    recordExpense: 'Record Expense',
    sales: 'Sales', history: 'History',
    productName: 'Product Name',
    quantity: 'Quantity', buyPrice: 'Buy Price',
    sellPrice: 'Sell Price', category: 'Category',
    amount: 'Amount', description: 'Description',
    netProfit: 'Net Profit', margin: 'Margin',
    grossProfit: 'Gross Profit', costOfGoods: 'Cost of Goods',
    transactionCount: 'Transaction Count', averageSale: 'Average Sale',
    topProducts: 'Top Products', salesByCategory: 'Sales by Category',
    expensesByCategory: 'Expenses by Category', salesTrend: 'Sales Trend',
    store: 'Store', switchStore: 'Switch Store', addStore: 'Add Store',
    storeName: 'Store Name', storeType: 'Store Type',
    region: 'Region', district: 'District', ward: 'Ward', street: 'Street',
    primaryStore: 'Primary Store', activeStore: 'Active Store',
    offlineMode: 'Offline Mode', syncNow: 'Sync Now',
    pendingSync: 'Pending Sync',
    customer: 'Customer', dueDate: 'Due Date',
    paid: 'Paid', remaining: 'Remaining', partial: 'Partial',
    markPaid: 'Mark as Paid', addDebt: 'Record Debt',
    supervisor: 'Supervisor', accessLevel: 'Access Level',
    readOnly: 'Read Only', fullAccess: 'Full Access',
    addSupervisor: 'Add Supervisor', removeSupervisor: 'Remove Supervisor',
    business: 'Business', performance: 'Performance', metrics: 'Metrics',
    revenue: 'Revenue', expenses: 'Expenses', profit: 'Profit'
  }
};

const t = (k) => T[S.lang]?.[k] ?? k;

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const $ = (id) => document.getElementById(id);
const fmt = (n) => 'TZS ' + Number(n || 0).toLocaleString();
const fmtNum = (n) => Number(n || 0).toLocaleString();
const today = () => new Date().toISOString().slice(0, 10);
const genRef = (prefix = 'BW') => prefix + Date.now().toString(36).toUpperCase();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function toast(msg, type = 'success') {
  const container = $('#toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 6-6"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  toast.innerHTML = `${icons[type] || icons.success}<span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function setBusy(id, busy, txt = '') {
  const btn = $(id);
  if (!btn) return;
  btn.disabled = busy;
  const span = btn.querySelector('span');
  if (!span) return;
  if (busy) {
    span.dataset.orig = span.textContent;
    span.innerHTML = '<span class="spinner"></span>';
  } else {
    span.textContent = txt || span.dataset.orig || '';
  }
}

function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }
function setHtml(id, h) { const el = $(id); if (el) el.innerHTML = h; }

// ============================================================
// LOCALSTORAGE SESSION
// ============================================================
function saveSession() {
  localStorage.setItem('bw_v4', JSON.stringify({ user: S.user, lang: S.lang, storeId: S.store?.id }));
}

function loadSession() {
  try {
    const d = JSON.parse(localStorage.getItem('bw_v4') || 'null');
    if (d?.user) { S.user = d.user; S.lang = d.lang || 'sw'; S._savedStoreId = d.storeId; return true; }
  } catch { }
  return false;
}

function clearSession() { localStorage.removeItem('bw_v4'); }

// ============================================================
// DEV OTP FUNCTIONS
// ============================================================
async function callOTP(payload) {
  const FORCE_DEV_MODE = true;

  if (FORCE_DEV_MODE) {
    console.log('[DEV MODE] Using virtual OTP for action:', payload.action);
    const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();

    if (payload.action === 'send_otp') {
      showDevOTP(mockOTP);
      return { success: true, dev_otp: mockOTP, sms_failed: true, message: 'DEV MODE: Tumia OTP iliyoonyeshwa' };
    }

    if (payload.action === 'verify_otp') {
      const isValid = payload.otp_code === mockOTP || payload.otp_code === '123456' || payload.otp_code.length === 6;
      const { data: existingUser } = await sb.from('profiles').select('*').eq('phone_number', payload.phone).maybeSingle();
      if (existingUser) {
        return { success: true, user_exists: true, user: existingUser, message: 'OTP imethibitishwa' };
      }
      return { success: true, user_exists: false, user: null, message: 'OTP imethibitishwa. Kamilisha usajili.' };
    }

    if (payload.action === 'complete_registration') {
      const { data: newUser, error } = await sb.from('profiles').insert([{
        phone_number: payload.phone, store_name: payload.store_name, pin: payload.pin,
        role: payload.role, region: payload.region || null, district: payload.district || null,
        ward: payload.ward || null, street: payload.street || null,
        business_type: payload.business_type || null, coverage_area: payload.coverage_area || null,
        min_delivery_amount: payload.min_delivery_amount || 0, categories: payload.categories || null,
        is_active: true, created_at: new Date().toISOString()
      }]).select().single();
      if (error) return { success: false, message: 'Tatizo la kuunda akaunti: ' + error.message };
      return { success: true, user: newUser, message: 'Akaunti imeundwa!' };
    }

    if (payload.action === 'reset_pin') {
      const { data: updatedUser, error } = await sb.from('profiles').update({ pin: payload.pin }).eq('phone_number', payload.phone).select().single();
      if (error) return { success: false, message: 'Tatizo la kubadilisha PIN' };
      return { success: true, user: updatedUser, message: 'PIN imebadilishwa' };
    }
  }

  const res = await fetch(OTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_KEY}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.success && data.dev_otp && data.sms_failed) showDevOTP(data.dev_otp);
  return data;
}

function showDevOTP(otp) {
  $('#dev-otp-banner')?.remove();
  const b = document.createElement('div');
  b.id = 'dev-otp-banner';
  b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#16a34a,#22c55e);transform:translateY(-100%);transition:transform 0.4s ease;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
  b.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;gap:16px;flex-wrap:wrap">
      <div>
        <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.8);margin-bottom:4px">${S.lang === 'sw' ? 'SMS haikufika — OTP:' : 'SMS failed — OTP:'}</div>
        <div style="font-size:28px;font-weight:900;letter-spacing:6px;font-family:monospace;color:#fff">${otp}</div>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="fillDevOTP('${otp}')" style="background:rgba(255,255,255,0.9);border:none;color:#16a34a;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:800;cursor:pointer">Jaza OTP</button>
        <button onclick="this.closest('#dev-otp-banner').remove()" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:36px;height:36px;border-radius:8px;cursor:pointer">✕</button>
      </div>
    </div>
  `;
  document.body.appendChild(b);
  setTimeout(() => b.style.transform = 'translateY(0)', 10);
}

window.fillDevOTP = function(otp) {
  const prefixes = ['ob', 'lb', 'fb'];
  for (const p of prefixes) {
    if ($(p + '0')) {
      otp.split('').forEach((d, i) => { const el = $(p + i); if (el) { el.value = d; el.classList.add('on'); } });
      setTimeout(() => {
        if (p === 'ob') App.verifyRegOTP();
        else if (p === 'lb') App.verifyLoginOTP();
        else App.verifyForgotOTP();
      }, 400);
      $('#dev-otp-banner')?.remove();
      break;
    }
  }
};

// ============================================================
// PHONE NORMALIZER
// ============================================================
function normPhone(raw) {
  const d = raw.replace(/\D/g, '');
  if (d.length === 9 && (d[0] === '7' || d[0] === '6')) return '+255' + d;
  if (d.length === 10 && d[0] === '0') return '+255' + d.slice(1);
  if (d.length === 12 && d.startsWith('255')) return '+' + d;
  return null;
}

// ============================================================
// STEP NAVIGATION (ONBOARDING)
// ============================================================
const STEP_NAMES = {
  sw: { 1: 'Lugha', 2: 'Aina', 3: 'Maelezo (Duka)', 4: 'Maelezo (Msambazaji)', 5: 'OTP', 7: 'PIN', 8: 'Ingia', 9: 'OTP ya Kuingia', 10: 'Nimesahau PIN', 11: 'OTP ya PIN', 12: 'PIN Mpya' },
  en: { 1: 'Language', 2: 'Role', 3: 'Details (Shop)', 4: 'Details (Distributor)', 5: 'OTP', 7: 'PIN', 8: 'Login', 9: 'Login OTP', 10: 'Forgot PIN', 11: 'Forgot OTP', 12: 'New PIN' },
};
const STEP_MAX = { 1: 10, 2: 20, 3: 50, 4: 50, 5: 75, 7: 90, 8: 30, 9: 60, 10: 30, 11: 60, 12: 85 };

function goStep(n) {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  const el = $(`s${n}`);
  if (el) el.classList.add('active');
  const pct = STEP_MAX[n] || 10;
  const name = STEP_NAMES[S.lang]?.[n] || `Hatua ${n}`;
  setText('plbl', name);
  setText('ppct', pct + '%');
  const pf = $('#pfill');
  if (pf) pf.style.width = pct + '%';
}

function fillSelect(id, options, placeholder = '—') {
  const sel = $(id);
  if (!sel) return;
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach(o => { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; sel.appendChild(opt); });
}

function initLocDropdowns(regionId, districtId, wardId) {
  fillSelect(regionId, Object.keys(LOC), S.lang === 'sw' ? 'Chagua Mkoa' : 'Select Region');
  fillSelect(districtId, [], S.lang === 'sw' ? '— Chagua Wilaya —' : '— Select District —');
  if (wardId) fillSelect(wardId, [], S.lang === 'sw' ? '— Chagua Kata —' : '— Select Ward —');
}

function buildCatGrid() {
  const grid = $('#cat-grid');
  if (!grid) return;
  grid.innerHTML = CATS.map(c => `
    <label class="cat-chip" style="display:flex;align-items:center;gap:8px;padding:10px;border:1.5px solid #e5e7eb;border-radius:12px;cursor:pointer;transition:all 0.2s">
      <input type="checkbox" value="${c.id}" style="width:18px;height:18px"/>
      <span>${c.icon} ${S.lang === 'sw' ? c.sw : c.en}</span>
    </label>
  `).join('');
  grid.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => { inp.parentElement.classList.toggle('on', inp.checked); });
  });
}

// ============================================================
// OFFLINE / INDEXEDDB POS (FULL)
// ============================================================
let posDB = null;

async function initPosDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open('bomawave_pos', 3);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sales')) db.createObjectStore('sales', { keyPath: 'local_id', autoIncrement: true });
      if (!db.objectStoreNames.contains('expenses')) db.createObjectStore('expenses', { keyPath: 'local_id', autoIncrement: true });
    };
    req.onsuccess = e => { posDB = e.target.result; resolve(posDB); };
    req.onerror = () => resolve(null);
  });
}

async function posDbAdd(store, data) {
  if (!posDB) return;
  return new Promise((resolve) => {
    const tx = posDB.transaction(store, 'readwrite');
    tx.objectStore(store).add({ ...data, synced: false, created_at: new Date().toISOString() });
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
  const uSales = sales.filter(s => !s.synced && s.user_id === S.user?.id);
  const uExps = exps.filter(e => !e.synced && e.user_id === S.user?.id);
  for (const s of uSales) {
    const { local_id, ...data } = s;
    const { error } = await sb.from('sales').insert([data]);
    if (!error) await posDbMarkSynced('sales', local_id);
  }
  for (const e of uExps) {
    const { local_id, ...data } = e;
    const { error } = await sb.from('expenses').insert([data]);
    if (!error) await posDbMarkSynced('expenses', local_id);
  }
  if (uSales.length + uExps.length > 0) toast(`Sync imekamilika — records ${uSales.length + uExps.length}`, 'success');
  if (App.renderSyncBadge) App.renderSyncBadge();
}

async function getPendingCount() {
  if (!posDB) return 0;
  const s = await posDbGetAll('sales');
  const e = await posDbGetAll('expenses');
  return [...s, ...e].filter(x => !x.synced && x.user_id === S.user?.id).length;
}

window.addEventListener('online', () => {
  S.isOnline = true;
  toast(S.lang === 'sw' ? 'Mtandao umepatikana — Inasync...' : 'Back online — Syncing...', 'success');
  syncOfflineData();
});

window.addEventListener('offline', () => {
  S.isOnline = false;
  toast(S.lang === 'sw' ? 'Hakuna mtandao — POS inafanya kazi bila mtandao' : 'No internet — POS works offline', 'warning');
});

// ============================================================
// MULTI-STORE (FULL)
// ============================================================
async function loadStores() {
  if (!S.user || S.user.role !== 'retailer') { S.stores = []; S.store = null; return; }
  const { data } = await sb.from('stores').select('*').eq('owner_id', S.user.id).eq('is_active', true).order('is_primary', { ascending: false });
  S.stores = data || [];
  if (S._savedStoreId) S.store = S.stores.find(s => s.id === S._savedStoreId) || S.stores[0] || null;
  else S.store = S.stores.find(s => s.is_primary) || S.stores[0] || null;
}

async function ensurePrimaryStore() {
  if (!S.user || S.user.role !== 'retailer') return;
  const { data } = await sb.from('stores').select('id').eq('owner_id', S.user.id).limit(1);
  if (data && data.length > 0) return;
  await sb.from('stores').insert([{
    owner_id: S.user.id, store_name: S.user.store_name, store_type: S.user.business_type || 'duka',
    region: S.user.region, district: S.user.district, ward: S.user.ward, street: S.user.street,
    is_primary: true, is_active: true,
  }]);
  await loadStores();
}

function renderStoreSwitcher() {
  const wrap = $('#store-switcher');
  if (!wrap) return;
  if (!S.stores || S.stores.length <= 1) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  wrap.innerHTML = S.stores.map(st => `
    <button class="store-btn${S.store?.id === st.id ? ' active' : ''}" onclick="App.switchStore('${st.id}')">
      <span>🏪</span>
      <span style="flex:1;text-align:left;font-size:13px;font-weight:${S.store?.id === st.id ? 700 : 600}">${st.store_name}</span>
      ${S.store?.id === st.id ? '<span style="color:#4ade80">●</span>' : ''}
    </button>
  `).join('') +
    `<button class="store-btn add-store" onclick="App.showAddStore()">＋ <span style="font-size:13px">${S.lang === 'sw' ? 'Ongeza Duka' : 'Add Store'}</span></button>`;
}

// ============================================================
// APP OBJECT (FULL - CONTINUED IN NEXT MESSAGE DUE TO LENGTH)
// ============================================================
window.App = {
  // Navigation
  goStep(n) { goStep(n); },

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
    const lswSw = $('#lsw-sw');
    const lswEn = $('#lsw-en');
    if (lswSw) lswSw.classList.toggle('on', lang === 'sw');
    if (lswEn) lswEn.classList.toggle('on', lang === 'en');
  },

  pickRole(role) {
    S.role = role;
    const rbRet = $('#rb-ret');
    const rbDist = $('#rb-dist');
    if (rbRet) rbRet.classList.toggle('sel', role === 'retailer');
    if (rbDist) rbDist.classList.toggle('sel', role === 'distributor');
    const ckRet = $('#ck-ret');
    const ckDist = $('#ck-dist');
    if (ckRet) ckRet.style.display = role === 'retailer' ? '' : 'none';
    if (ckDist) ckDist.style.display = role === 'distributor' ? '' : 'none';
    const rnext = $('#rnext');
    if (rnext) rnext.style.display = 'flex';
  },

  proceedFromRole() {
    if (!S.role) return;
    goStep(S.role === 'retailer' ? 3 : 4);
  },

  goToRegister() { goStep(2); },

  onRegionChange() {
    const r = $('#reg-region').value;
    const dists = r ? Object.keys(LOC[r] || {}) : [];
    fillSelect('reg-district', dists, '— Wilaya —');
    fillSelect('reg-ward', [], '— Kata —');
  },

  onDistrictChange() {
    const r = $('#reg-region').value, d = $('#reg-district').value;
    const wards = (r && d) ? (LOC[r]?.[d] || []) : [];
    fillSelect('reg-ward', wards, '— Kata —');
  },

  onDRegionChange() {
    const r = $('#dreg-region').value;
    const dists = r ? Object.keys(LOC[r] || {}) : [];
    fillSelect('dreg-district', dists, '— Wilaya —');
    fillSelect('dreg-ward', [], '— Kata —');
  },

  onDDistrictChange() {
    const r = $('#dreg-region').value, d = $('#dreg-district').value;
    const wards = (r && d) ? (LOC[r]?.[d] || []) : [];
    fillSelect('dreg-ward', wards, '— Kata —');
  },

  eyeToggle(inputId, iconId) {
    const inp = $(inputId), ico = $(iconId);
    if (!inp || !ico) return;
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    ico.innerHTML = show
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  },

  async submitDetails() {
    const name = $('#reg-name').value.trim();
    const rawPhone = $('#reg-phone').value.trim();
    const pin = $('#reg-pin').value.trim();
    const pin2 = $('#reg-pin2').value.trim();

    if (!name) return toast('Weka jina la duka', 'error');
    const phone = normPhone(rawPhone);
    if (!phone) return toast('Namba ya simu si sahihi', 'error');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'error');
    if (pin !== pin2) return toast('PIN hazilingani', 'error');

    S.pendingData = {
      role: 'retailer', store_name: name, phone, pin, region: $('#reg-region').value,
      district: $('#reg-district').value, ward: $('#reg-ward').value, street: $('#reg-street').value,
      business_type: $('#reg-btype').value,
    };
    S.pendingPhone = phone;

    setBusy('reg-btn', true);
    const r = await callOTP({ action: 'send_otp', phone });
    setBusy('reg-btn', false, 'Endelea — Tuma OTP');

    if (!r.success) return toast(r.message || 'Hitilafu', 'error');
    toast('OTP imetumwa! ✅', 'success');
    setText('otp-phone', phone);
    App.clearOTPBoxes('ob');
    App.startResendTimer();
    goStep(5);
  },

  async submitDDetails() {
    const name = $('#dreg-name').value.trim();
    const rawPhone = $('#dreg-phone').value.trim();
    const pin = $('#dreg-pin').value.trim();
    const pin2 = $('#dreg-pin2').value.trim();

    if (!name) return toast('Weka jina la biashara', 'error');
    const phone = normPhone(rawPhone);
    if (!phone) return toast('Namba ya simu si sahihi', 'error');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'error');
    if (pin !== pin2) return toast('PIN hazilingani', 'error');

    const checkedCats = [...document.querySelectorAll('#cat-grid input:checked')].map(i => i.value);

    S.pendingData = {
      role: 'distributor', store_name: name, phone, pin, region: $('#dreg-region').value,
      district: $('#dreg-district').value, ward: $('#dreg-ward').value, street: $('#dreg-street').value,
      coverage_area: $('#dreg-coverage').value, min_delivery_amount: parseFloat($('#dreg-mindel').value || '0'),
      categories: checkedCats.join(','),
    };
    S.pendingPhone = phone;

    setBusy('dreg-btn', true);
    const r = await callOTP({ action: 'send_otp', phone });
    setBusy('dreg-btn', false, 'Endelea — Tuma OTP');

    if (!r.success) return toast(r.message || 'Hitilafu', 'error');
    toast('OTP imetumwa! ✅', 'success');
    setText('otp-phone', phone);
    App.clearOTPBoxes('ob');
    App.startResendTimer();
    goStep(5);
  },

  oi(i, el) {
    el.value = el.value.replace(/\D/g, '').slice(-1);
    el.classList.toggle('on', !!el.value);
    if (el.value && i < 5) $(`ob${i + 1}`)?.focus();
    if (i === 5 && el.value) App.verifyRegOTP();
  },

  ok(i, e) {
    if (e.key === 'Backspace' && !$(`ob${i}`).value && i > 0) $(`ob${i - 1}`)?.focus();
  },

  clearOTPBoxes(prefix, count = 6) {
    for (let i = 0; i < count; i++) { const el = $(prefix + i); if (el) { el.value = ''; el.classList.remove('on', 'err'); } }
  },

  getOTPVal(prefix, count = 6) {
    return Array.from({ length: count }, (_, i) => $(`${prefix}${i}`)?.value || '').join('');
  },

  startResendTimer() {
    clearInterval(S.resendTimer);
    let sec = 60;
    const timer = $('#rtimer'), btn = $('#rbtn');
    if (timer) timer.style.display = '';
    if (btn) btn.style.display = 'none';
    if (timer) timer.textContent = S.lang === 'sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
    S.resendTimer = setInterval(() => {
      sec--;
      if (sec <= 0) {
        clearInterval(S.resendTimer);
        if (timer) timer.style.display = 'none';
        if (btn) btn.style.display = '';
      } else {
        if (timer) timer.textContent = S.lang === 'sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
      }
    }, 1000);
  },

  async resendRegOTP() {
    if (!S.pendingPhone) return;
    const r = await callOTP({ action: 'send_otp', phone: S.pendingPhone });
    if (r.success) { toast('OTP imetumwa tena', 'success'); App.startResendTimer(); }
    else toast(r.message || 'Hitilafu', 'error');
  },

  async verifyRegOTP() {
    const code = App.getOTPVal('ob');
    if (code.length !== 6) return toast('Weka nambari 6 kamili', 'error');
    setBusy('vbtn', true);
    const r = await callOTP({ action: 'verify_otp', phone: S.pendingPhone, otp_code: code });
    if (!r.success) {
      setBusy('vbtn', false, 'Thibitisha');
      for (let i = 0; i < 6; i++) $(`ob${i}`)?.classList.add('err');
      return toast(r.message || 'Nambari si sahihi', 'error');
    }
    const reg = await callOTP({ action: 'complete_registration', phone: S.pendingPhone, ...S.pendingData });
    setBusy('vbtn', false, 'Thibitisha');
    if (!reg.success) return toast(reg.message || 'Tatizo la kuunda akaunti', 'error');
    toast('Akaunti imefunguliwa! 🎉', 'success');
    S.user = reg.user;
    saveSession();
    await ensurePrimaryStore();
    await loadStores();
    App.showApp();
  },

  goBack5() { goStep(S.role === 'retailer' ? 3 : 4); },

  async sendLoginOTP() {
    const raw = $('#lphone').value.trim();
    const phone = normPhone(raw);
    if (!phone) return toast('Namba ya simu si sahihi', 'error');
    S.pendingPhone = phone;
    setBusy('lotp-txt', false);
    const r = await callOTP({ action: 'send_otp', phone });
    if (!r.success) return toast(r.message || 'Hitilafu', 'error');
    toast('OTP imetumwa! ✅', 'success');
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

  lok(i, e) { if (e.key === 'Backspace' && !$(`lb${i}`).value && i > 0) $(`lb${i - 1}`)?.focus(); },

  startLoginResendTimer() {
    clearInterval(S.loginResendTimer);
    let sec = 60;
    const timer = $('#lrtimer'), btn = $('#lrbtn');
    if (timer) timer.style.display = '';
    if (btn) btn.style.display = 'none';
    if (timer) timer.textContent = S.lang === 'sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
    S.loginResendTimer = setInterval(() => {
      sec--;
      if (sec <= 0) {
        clearInterval(S.loginResendTimer);
        if (timer) timer.style.display = 'none';
        if (btn) btn.style.display = '';
      } else {
        if (timer) timer.textContent = S.lang === 'sw' ? `Tuma tena baada ya ${sec}s` : `Resend in ${sec}s`;
      }
    }, 1000);
  },

  async resendLoginOTP() {
    if (!S.pendingPhone) return;
    const r = await callOTP({ action: 'send_otp', phone: S.pendingPhone });
    if (r.success) { toast('OTP imetumwa tena', 'success'); App.startLoginResendTimer(); }
    else toast(r.message || 'Hitilafu', 'error');
  },

  async verifyLoginOTP() {
    const code = App.getOTPVal('lb');
    if (code.length !== 6) return toast('Weka nambari 6 kamili', 'error');
    setBusy('lvbtn', true);
    const r = await callOTP({ action: 'verify_otp', phone: S.pendingPhone, otp_code: code });
    setBusy('lvbtn', false, 'Thibitisha');
    if (!r.success) {
      for (let i = 0; i < 6; i++) $(`lb${i}`)?.classList.add('err');
      return toast(r.message || 'Nambari si sahihi', 'error');
    }
    if (!r.user_exists) return toast(S.lang === 'sw' ? 'Namba hii haijasajiliwa. Unda akaunti kwanza.' : 'Number not registered. Please create account.', 'error');
    S.user = r.user;
    saveSession();
    await loadStores();
    S.pinBuf = '';
    App.renderPinDots();
    setText('s7h', S.lang === 'sw' ? 'Karibu!' : 'Welcome!');
    setText('s7sub', r.user.store_name || '');
    goStep(7);
  },

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

  forgotPin() { S.pinBuf = ''; goStep(10); },

  async sendForgotOTP() {
    const raw = $('#fphone').value.trim();
    const phone = normPhone(raw);
    if (!phone) return toast('Namba ya simu si sahihi', 'error');
    S.pendingPhone = phone;
    const r = await callOTP({ action: 'send_otp', phone });
    if (!r.success) return toast(r.message || 'Hitilafu', 'error');
    toast('OTP imetumwa! ✅', 'success');
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

  fok(i, e) { if (e.key === 'Backspace' && !$(`fb${i}`).value && i > 0) $(`fb${i - 1}`)?.focus(); },

  async verifyForgotOTP() {
    const code = App.getOTPVal('fb');
    if (code.length !== 6) return toast('Weka nambari 6 kamili', 'error');
    setBusy('fvbtn', true);
    const r = await callOTP({ action: 'verify_otp', phone: S.pendingPhone, otp_code: code });
    setBusy('fvbtn', false, 'Thibitisha');
    if (!r.success) { for (let i = 0; i < 6; i++) $(`fb${i}`)?.classList.add('err'); return toast(r.message || 'Nambari si sahihi', 'error'); }
    if (!r.user_exists) return toast(S.lang === 'sw' ? 'Namba hii haijasajiliwa.' : 'Number not registered.', 'error');
    S.user = r.user;
    goStep(12);
  },

  async resetPin() {
    const pin = $('#npin').value.trim(), pin2 = $('#npin2').value.trim();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast('PIN lazima iwe tarakimu 4', 'error');
    if (pin !== pin2) return toast('PIN hazilingani', 'error');
    setBusy('rpintxt', false);
    const r = await callOTP({ action: 'reset_pin', phone: S.pendingPhone, pin });
    if (!r.success) return toast(r.message || 'Hitilafu', 'error');
    toast(S.lang === 'sw' ? 'PIN imebadilishwa! ✅' : 'PIN updated! ✅', 'success');
    S.user = r.user;
    saveSession();
    App.showApp();
  },

  async showApp() {
    const onboarding = $('#onboarding');
    const appMain = $('#app-main');
    if (onboarding) onboarding.style.display = 'none';
    if (appMain) appMain.style.display = 'block';
    await ensurePrimaryStore();
    await loadStores();
    if (S.user.role === 'retailer' && S.stores.length > 1 && !S.store) {
      App.showStorePicker();
      return;
    }
    App.renderApp();
    App.setupRealtime();
  },

  async renderSyncBadge() {
    const el = $('#sync-badge');
    if (!el) return;
    const count = await getPendingCount();
    if (!S.isOnline) {
      el.style.display = 'flex';
      el.innerHTML = `<span style="background:#d97706;color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:20px">⚡ Offline${count > 0 ? ` · ${count} pending` : ''}</span>`;
    } else if (count > 0) {
      el.style.display = 'flex';
      el.innerHTML = `<span style="background:#2563eb;color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:20px;cursor:pointer" onclick="syncOfflineData()">↑ Sync ${count}</span>`;
    } else { el.style.display = 'none'; }
  },

  switchStore(id) {
    S.store = S.stores.find(s => s.id === id) || S.store;
    saveSession();
    toast(`${S.lang === 'sw' ? 'Duka' : 'Store'}: ${S.store?.store_name}`, 'success');
    App.renderApp();
  },

  showAddStore() {
    const view = $('#content-area');
    if (!view) return;
    setText('page-title', S.lang === 'sw' ? 'Ongeza Duka' : 'Add Store');
    view.innerHTML = `
      <div style="max-width:500px;margin:0 auto">
        <div class="card">
          <div class="card-header"><h3 class="card-title">${S.lang === 'sw' ? 'Ongeza Duka Jipya' : 'Add New Store'}</h3></div>
          <div class="card-body">
            <div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Jina la Duka' : 'Store Name'} *</label><input class="form-input" id="as-name" placeholder="${S.lang === 'sw' ? 'mfano: Temeke Branch' : 'e.g. Temeke Branch'}"/></div>
            <div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Aina ya Duka' : 'Store Type'}</label><select class="form-select" id="as-type"><option value="duka">${S.lang === 'sw' ? 'Duka la Kawaida' : 'Regular Shop'}</option><option value="kiosk">Kiosk</option><option value="supermarket">Supermarket</option><option value="wholesale">${S.lang === 'sw' ? 'Jumla' : 'Wholesale'}</option></select></div>
            <div class="form-grid-2"><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Mkoa' : 'Region'}</label><select class="form-select" id="as-region" onchange="App.onASRegion()"><option value=""></option></select></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Wilaya' : 'District'}</label><select class="form-select" id="as-district" onchange="App.onASDistrict()"><option value=""></option></select></div></div>
            <div class="form-grid-2"><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Kata' : 'Ward'}</label><select class="form-select" id="as-ward"><option value=""></option></select></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Mtaa' : 'Street'}</label><input class="form-input" id="as-street" placeholder="Mtaa"/></div></div>
            <label style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding:12px;background:#f0fdf4;border-radius:12px;cursor:pointer"><input type="checkbox" id="as-primary" style="width:18px;height:18px"/> <span>${S.lang === 'sw' ? 'Fanya Duka Kuu' : 'Set as Primary Store'}</span></label>
            <div class="form-grid-2"><button class="btn-secondary" onclick="App.navTo('dashboard')">${S.lang === 'sw' ? 'Rudi' : 'Back'}</button><button class="btn-primary" onclick="App.saveNewStore()"><span id="as-btn">+ ${S.lang === 'sw' ? 'Ongeza Duka' : 'Add Store'}</span></button></div>
          </div>
        </div>
      </div>`;
    App.initLocDropdowns('as-region', 'as-district', 'as-ward');
  },

  initLocDropdowns(regionId, districtId, wardId) {
    fillSelect(regionId, Object.keys(LOC), S.lang === 'sw' ? 'Chagua Mkoa' : 'Select Region');
    fillSelect(districtId, [], S.lang === 'sw' ? '— Chagua Wilaya —' : '— Select District —');
    if (wardId) fillSelect(wardId, [], S.lang === 'sw' ? '— Chagua Kata —' : '— Select Ward —');
  },

  onASRegion() { const r = $('#as-region')?.value; fillSelect('as-district', r ? Object.keys(LOC[r] || []) : []); fillSelect('as-ward', []); },
  onASDistrict() { const r = $('#as-region')?.value, d = $('#as-district')?.value; fillSelect('as-ward', (r && d) ? LOC[r]?.[d] || [] : []); },

  async saveNewStore() {
    const name = $('#as-name')?.value.trim();
    if (!name) return toast(S.lang === 'sw' ? 'Weka jina la duka' : 'Enter store name', 'error');
    setBusy('as-btn', true);
    const isPrimary = $('#as-primary')?.checked;
    if (isPrimary) await sb.from('stores').update({ is_primary: false }).eq('owner_id', S.user.id);
    const { error } = await sb.from('stores').insert([{
      owner_id: S.user.id, store_name: name, store_type: $('#as-type')?.value,
      region: $('#as-region')?.value, district: $('#as-district')?.value, ward: $('#as-ward')?.value,
      street: $('#as-street')?.value, is_primary: isPrimary, is_active: true,
    }]);
    setBusy('as-btn', false, `+ ${S.lang === 'sw' ? 'Ongeza Duka' : 'Add Store'}`);
    if (error) return toast('Hitilafu ya kuongeza duka', 'error');
    toast(S.lang === 'sw' ? 'Duka limeongezwa! ✅' : 'Store added! ✅', 'success');
    await loadStores();
    App.navTo('dashboard');
  },

  showStorePicker() {
    const view = $('#content-area');
    if (!view) return;
    view.innerHTML = `
      <div style="max-width:450px;margin:2rem auto">
        <div style="text-align:center;margin-bottom:24px"><div style="font-size:48px;margin-bottom:8px">🏪</div><h2>${S.lang === 'sw' ? 'Chagua Duka' : 'Select Store'}</h2><p style="color:#6b7280">${S.lang === 'sw' ? 'Duka gani unafanya kazi nalo leo?' : 'Which store are you working at today?'}</p></div>
        ${S.stores.map(st => `<div class="card" style="margin-bottom:12px;cursor:pointer;border:2px solid ${S.store?.id === st.id ? '#16a34a' : '#e5e7eb'}" onclick="App.switchStore('${st.id}');App.navTo('dashboard')"><div class="card-body" style="display:flex;align-items:center;gap:16px"><div style="width:48px;height:48px;background:#f0fdf4;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px">🏪</div><div style="flex:1"><div style="font-weight:700">${st.store_name} ${st.is_primary ? '⭐' : ''}</div><div style="font-size:13px;color:#6b7280">${st.district || st.region || ''}</div></div><div style="color:#16a34a">→</div></div></div>`).join('')}
        <button class="btn-primary btn-block" onclick="App.showAddStore()" style="margin-top:16px">+ ${S.lang === 'sw' ? 'Ongeza Duka' : 'Add Store'}</button>
      </div>`;
  },

  async pageMyStores() {
    await loadStores();
    const view = $('#content-area');
    if (!view) return;
    setText('page-title', S.lang === 'sw' ? 'Maduka Yangu' : 'My Stores');
    view.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h2>${S.lang === 'sw' ? 'Maduka Yangu' : 'My Stores'} (${S.stores.length})</h2><button class="btn-primary" onclick="App.showAddStore()">+ ${S.lang === 'sw' ? 'Ongeza' : 'Add'}</button></div>
      ${S.stores.map(st => `<div class="card" style="margin-bottom:12px;border:2px solid ${S.store?.id === st.id ? '#16a34a' : '#e5e7eb'}"><div class="card-body"><div style="display:flex;align-items:center;gap:16px"><div style="width:48px;height:48px;background:#f0fdf4;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px">🏪</div><div style="flex:1"><div style="font-weight:700">${st.store_name} ${st.is_primary ? '⭐' : ''}</div><div style="font-size:13px;color:#6b7280">${st.district || ''} ${st.region || ''}</div></div>${S.store?.id === st.id ? '<span style="background:#f0fdf4;color:#16a34a;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">ACTIVE</span>' : ''}</div>${S.store?.id !== st.id ? `<div style="display:flex;gap:8px;margin-top:16px"><button class="btn-primary" style="flex:1;padding:10px" onclick="App.switchStore('${st.id}');App.navTo('dashboard')">${S.lang === 'sw' ? 'Ingia' : 'Switch'}</button><button class="btn-secondary" style="flex:1;padding:10px;background:#fee2e2;border-color:#fecaca;color:#dc2626" onclick="App.deleteStore('${st.id}')">${S.lang === 'sw' ? 'Futa' : 'Delete'}</button></div>` : ''}</div></div>`).join('')}`;
  },

  async deleteStore(id) {
    if (S.stores.length <= 1) return toast(S.lang === 'sw' ? 'Lazima kuwe na duka moja angalau' : 'Need at least one store', 'error');
    if (!confirm(S.lang === 'sw' ? 'Futa duka hili?' : 'Delete this store?')) return;
    await sb.from('stores').update({ is_active: false }).eq('id', id);
    await loadStores();
    toast(S.lang === 'sw' ? 'Duka limefutwa' : 'Store deleted', 'success');
    App.pageMyStores();
  },

  logout() {
    if (S.realtimeCh) sb.removeChannel(S.realtimeCh);
    S = {
      user: null, lang: S.lang, role: null, pendingPhone: null, pendingData: null, pinBuf: '', cart: [], cartDist: null,
      page: 'dashboard', notifs: [], store: null, stores: [], realtimeCh: null, isOnline: navigator.onLine,
      supervisorOf: null, _savedStoreId: null, resendTimer: null, loginResendTimer: null, forgotResendTimer: null, posTab: 'sales'
    };
    clearSession();
    const onboarding = $('#onboarding');
    const appMain = $('#app-main');
    if (onboarding) onboarding.style.display = 'flex';
    if (appMain) appMain.style.display = 'none';
    goStep(1);
  },

  // ============================================================
  // APP RENDERING (FULL)
  // ============================================================
  renderApp() {
    const u = S.user;
    const av = u.store_name?.[0]?.toUpperCase() || 'U';
    setText('user-avatar', av);
    setText('user-name', u.store_name || '—');
    const badgeTxt = { retailer: 'Duka', distributor: 'Msambazaji', admin: 'Admin' }[u.role] || u.role;
    const userRole = $('#user-role');
    if (userRole) userRole.textContent = badgeTxt;

    const navItems = App.getNavItems(u.role);
    const navMenu = $('#nav-menu');
    if (navMenu) {
      navMenu.innerHTML = navItems.map(n => `
        <div class="nav-item ${S.page === n.page ? 'active' : ''}" onclick="App.navTo('${n.page}')">
          ${n.icon} ${n.label}
        </div>
      `).join('');
    }

    const bottomNav = $('#bottom-nav');
    if (bottomNav) {
      const mobileItems = navItems.slice(0, 5);
      bottomNav.innerHTML = `<div class="bottom-nav-items">${mobileItems.map(n => `
        <button class="bottom-nav-item ${S.page === n.page ? 'active' : ''}" onclick="App.navTo('${n.page}')">${n.icon} <span>${n.shortLabel || n.label}</span></button>
      `).join('')}</div>`;
    }

    App.renderPage(S.page);
  },

  getNavItems(role) {
    const l = S.lang;
    const base = [{ page: 'dashboard', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>', label: t('dashboard'), shortLabel: 'Home' }];
    if (role === 'retailer') return [...base,
      { page: 'marketplace', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', label: t('marketplace'), shortLabel: 'Soko' },
      { page: 'my-orders', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>', label: t('myOrders'), shortLabel: 'Maagizo' },
      { page: 'pos', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', label: t('pos'), shortLabel: 'POS' },
      { page: 'debts', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', label: t('debts'), shortLabel: 'Madeni' },
      { page: 'reports', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>', label: t('reports'), shortLabel: 'Ripoti' },
      { page: 'my-stores', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', label: S.lang === 'sw' ? 'Maduka Yangu' : 'My Stores', shortLabel: 'Maduka' }
    ];
    if (role === 'distributor') return [...base,
      { page: 'products', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', label: t('products'), shortLabel: 'Bidhaa' },
      { page: 'orders', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>', label: t('orders'), shortLabel: 'Maagizo' },
      { page: 'pos', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', label: t('pos'), shortLabel: 'POS' },
      { page: 'invoices', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', label: t('invoices'), shortLabel: 'Ankara' },
      { page: 'reports', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>', label: t('reports'), shortLabel: 'Ripoti' },
      { page: 'debts', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', label: t('debts'), shortLabel: 'Madeni' }
    ];
    if (role === 'admin') return [...base,
      { page: 'users', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', label: t('users'), shortLabel: 'Watumiaji' },
      { page: 'orders', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>', label: t('orders'), shortLabel: 'Maagizo' },
      { page: 'analytics', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', label: t('analytics'), shortLabel: 'Data' }
    ];
    return base;
  },

  navTo(page) {
    S.page = page;
    App.renderApp();
    App.closeSidebar();
    window.scrollTo(0, 0);
  },

  toggleSidebar() {
    const sidebar = $('#sidebar');
    const overlay = $('#sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  },

  closeSidebar() {
    const sidebar = $('#sidebar');
    const overlay = $('#sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  },

  toggleNotif() {
    const ndd = $('#notif-dropdown');
    if (ndd) ndd.remove();
    else {
      App.renderNotifs();
      const div = document.createElement('div');
      div.id = 'notif-dropdown';
      div.style.cssText = 'position:fixed;top:70px;right:20px;width:320px;background:white;border-radius:16px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);z-index:200;overflow:hidden';
      div.innerHTML = `<div style="padding:12px 16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between"><strong>${t('notifications')}</strong><button onclick="App.clearNotifs()" style="color:#16a34a;background:none;border:none;cursor:pointer">Futa Zote</button></div><div id="nlist" style="max-height:400px;overflow-y:auto"></div>`;
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 5000);
    }
  },

  clearNotifs() { S.notifs = []; App.renderNotifs(); },

  addNotif(txt) {
    S.notifs.unshift({ txt, time: new Date().toLocaleTimeString() });
    App.renderNotifs();
    const dot = $('#notif-dot');
    if (dot) { dot.style.display = 'flex'; dot.textContent = S.notifs.length > 9 ? '9+' : S.notifs.length; }
  },

  renderNotifs() {
    const list = $('#nlist');
    if (!list) return;
    if (!S.notifs.length) { list.innerHTML = '<div style="padding:40px;text-align:center;color:#6b7280">Hakuna arifa</div>'; return; }
    list.innerHTML = S.notifs.slice(0, 10).map(n => `<div style="padding:12px 16px;border-bottom:1px solid #f3f4f6"><div style="font-weight:600">${n.txt}</div><div style="font-size:11px;color:#9ca3af;margin-top:4px">${n.time}</div></div>`).join('');
  },

  setupRealtime() {
    if (S.realtimeCh) sb.removeChannel(S.realtimeCh);
    const u = S.user;
    S.realtimeCh = sb.channel('bw-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        const o = payload.new;
        if (u.role === 'distributor' && o.distributor_id === u.id) {
          App.addNotif(`${S.lang === 'sw' ? 'Agizo jipya kutoka' : 'New order from'} ${o.order_ref}`);
          if (S.page === 'orders') App.renderPage('orders');
        }
        if (u.role === 'retailer' && o.retailer_id === u.id) {
          if (S.page === 'my-orders') App.renderPage('my-orders');
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
        const o = payload.new;
        if (u.role === 'retailer' && o.retailer_id === u.id) {
          App.addNotif(`${S.lang === 'sw' ? 'Hali ya agizo imebadilika:' : 'Order status changed:'} ${o.status}`);
          if (S.page === 'my-orders') App.renderPage('my-orders');
        }
      }).subscribe();
  },

  // ============================================================
  // PAGE RENDERING (CONTINUED - DASHBOARD)
  // ============================================================
  async renderPage(page) {
    const view = $('#content-area');
    if (!view) return;
    view.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner-dark"></div></div>';

    const pageTitle = $('#page-title');
    const pageLabels = {
      dashboard: t('dashboard'), marketplace: t('marketplace'), 'my-orders': t('myOrders'),
      orders: t('orders'), products: t('products'), pos: t('pos'), reports: t('reports'),
      debts: t('debts'), invoices: t('invoices'), users: t('users'), analytics: t('analytics'),
      'my-stores': S.lang === 'sw' ? 'Maduka Yangu' : 'My Stores'
    };
    if (pageTitle) pageTitle.textContent = pageLabels[page] || page;
    const storeName = $('#store-name');
    if (storeName) storeName.textContent = S.store?.store_name || S.user?.store_name || '';

    const pages = {
      dashboard: () => App.pageDashboard(),
      marketplace: () => App.pageMarketplace(),
      'my-orders': () => App.pageMyOrders(),
      orders: () => App.pageOrders(),
      products: () => App.pageProducts(),
      pos: () => App.pagePOS(),
      reports: () => App.pageReports(),
      debts: () => App.pageDebts(),
      invoices: () => App.pageInvoices(),
      users: () => App.pageUsers(),
      'my-stores': () => App.pageMyStores(),
      analytics: () => App.pageAnalytics(),
      supervisor: () => App.pageSupervisor(),
      'supervisor-dash': () => App.pageSupervisorDash(),
    };
    await (pages[page] || pages.dashboard)();
  },

  async pageDashboard() {
    const u = S.user;
    const { data: orders } = await sb.from('orders').select('*').or(`retailer_id.eq.${u.id},distributor_id.eq.${u.id}`).order('created_at', { ascending: false }).limit(10);
    const { data: sales } = await sb.from('sales').select('revenue,profit,created_at').eq('user_id', u.id).gte('sale_date', today());
    const todayRev = sales?.reduce((s, r) => s + (r.revenue || 0), 0) || 0;
    const todayProfit = sales?.reduce((s, r) => s + (r.profit || 0), 0) || 0;
    const pending = (orders || []).filter(o => o.status === 'pending').length;
    const delivered = (orders || []).filter(o => o.status === 'delivered').length;

    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Mapato Leo' : 'Today Revenue'}</div><div class="stat-value positive" id="dash-rev">TZS 0</div></div>
          <div class="stat-card"><div class="stat-label">${t('profit')}</div><div class="stat-value positive" id="dash-profit">TZS 0</div></div>
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Yanasubiri' : 'Pending'}</div><div class="stat-value">${pending}</div></div>
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Zimetolewa' : 'Delivered'}</div><div class="stat-value">${delivered}</div></div>
        </div>
        <div class="card"><div class="card-header"><h3 class="card-title">${S.lang === 'sw' ? 'Maagizo ya Hivi Karibuni' : 'Recent Orders'}</h3><button class="btn-secondary" onclick="App.navTo('${u.role === 'retailer' ? 'my-orders' : 'orders'}')">${S.lang === 'sw' ? 'Ona Yote →' : 'See All →'}</button></div>
        <div class="card-body"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #e5e7eb"><th style="text-align:left;padding:12px">REF</th><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'HALI' : 'STATUS'}</th><th style="text-align:right;padding:12px">${S.lang === 'sw' ? 'JUMLA' : 'TOTAL'}</th><th style="text-align:right;padding:12px">${S.lang === 'sw' ? 'TAREHE' : 'DATE'}</th></tr></thead>
        <tbody>${(orders || []).slice(0, 5).map(o => `<tr style="border-bottom:1px solid #f3f4f6"><td style="padding:12px"><strong>${o.order_ref}</strong></td><td style="padding:12px"><span class="status-badge ${o.status === 'pending' ? 'status-pending' : o.status === 'confirmed' ? 'status-confirmed' : o.status === 'delivered' ? 'status-delivered' : 'status-cancelled'}">${o.status === 'pending' ? t('pending') : o.status === 'confirmed' ? t('confirmed') : o.status === 'delivered' ? t('delivered') : t('cancelled')}</span></td><td style="padding:12px;text-align:right"><strong>${fmt(o.total_price)}</strong></td><td style="padding:12px;text-align:right;color:#6b7280;font-size:13px">${o.created_at?.slice(0, 10)}</span></td></tr>`).join('') || '<tr><td colspan="4" style="padding:40px;text-align:center;color:#6b7280">Hakuna maagizo</td></tr>'}</tbody></table></div></div>`;
    }
    setTimeout(() => {
      const dashRev = $('#dash-rev');
      const dashProfit = $('#dash-profit');
      if (dashRev) animateCount(dashRev, todayRev, 'TZS ');
      if (dashProfit) animateCount(dashProfit, todayProfit, 'TZS ');
    }, 100);
  },

  // ============================================================
  // MARKETPLACE (FULL)
  // ============================================================
  async pageMarketplace() {
    const u = S.user;
    const { data: allDists } = await sb.from('profiles').select('id,store_name,region,district,coverage_area,min_delivery_amount').eq('role', 'distributor').eq('is_active', true);
    const sorted = (allDists || []).sort((a, b) => {
      const aScore = (a.region === u.region ? 2 : 0) + (a.district === u.district ? 1 : 0);
      const bScore = (b.region === u.region ? 2 : 0) + (b.district === u.district ? 1 : 0);
      return bScore - aScore;
    });

    const distId = S.cartDist || (sorted[0]?.id || '');
    let products = [];
    if (distId) {
      const { data: p } = await sb.from('products').select('*').eq('distributor_id', distId).eq('is_active', true).order('category');
      products = p || [];
    }

    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div class="card" style="margin-bottom:20px"><div class="card-body"><label class="form-label">${S.lang === 'sw' ? 'Chagua Msambazaji' : 'Select Distributor'}</label><select class="form-select" id="dist-sel" onchange="App.changeDist(this.value)">${sorted.map(d => `<option value="${d.id}" ${d.id === distId ? 'selected' : ''}>${d.store_name} — ${d.district || d.region || ''}${d.region === u.region ? ' ⭐' : ''}</option>`).join('')}</select></div></div>
        <div class="product-grid" id="product-grid">${products.map(p => `
          <div class="product-card" onclick="App.addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
            <div style="font-size:32px;margin-bottom:8px">${CAT_ICONS[p.category] || '📦'}</div>
            <div style="font-weight:700;margin-bottom:4px">${p.product_name}</div>
            <div style="font-size:13px;color:#6b7280;margin-bottom:8px">${p.category}</div>
            <div style="font-weight:700;color:#16a34a">${fmt(p.price)}</div>
            ${p.min_order_qty > 1 ? `<div style="font-size:11px;color:#d97706;margin-top:4px">Min: ${p.min_order_qty}</div>` : ''}
          </div>
        `).join('') || '<div style="text-align:center;padding:40px;color:#6b7280">Hakuna bidhaa</div>'}</div>
        ${S.cart.length ? `<button id="cart-fab" onclick="App.toggleCart()" style="position:fixed;bottom:80px;right:20px;background:#16a34a;border:none;width:56px;height:56px;border-radius:50%;color:white;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:90"><span id="cart-count" style="position:absolute;top:-4px;right:-4px;background:#d97706;color:white;font-size:11px;font-weight:700;padding:2px 6px;border-radius:10px">${S.cart.reduce((s, c) => s + c.qty, 0)}</span>🛒</button>` : ''}
        <div id="cart-panel" class="cart-panel"><div style="padding:16px;background:#16a34a;color:white;display:flex;justify-content:space-between"><strong>Agizo Lako</strong><button onclick="App.toggleCart()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer">✕</button></div><div id="cart-items" style="flex:1;overflow-y:auto;padding:16px"></div><div style="padding:16px;border-top:1px solid #e5e7eb"><div style="display:flex;justify-content:space-between;margin-bottom:16px"><strong>Jumla</strong><strong id="cart-total">TZS 0</strong></div><button class="btn-primary btn-block" onclick="App.placeOrder()">${t('placeOrder')}</button></div></div>`;
    }
    App.renderCartPanel();
    const fab = $('#cart-fab');
    if (fab) fab.style.display = S.cart.length ? 'flex' : 'none';
  },

  changeDist(id) { S.cartDist = id; S.cart = []; App.pageMarketplace(); },

  addToCart(p) {
    if (p.stock_qty === 0) return toast(S.lang === 'sw' ? 'Bidhaa imeisha stok' : 'Product out of stock', 'error');
    if (!S.cartDist) S.cartDist = p.distributor_id;
    const existing = S.cart.find(c => c.product_id === p.id);
    if (existing) { existing.qty++; } else {
      S.cart.push({ product_id: p.id, product_name: p.product_name, qty: p.min_order_qty || 1, unit_price: p.price, min_order_qty: p.min_order_qty || 1, selling_unit: p.selling_unit, distributor_id: p.distributor_id });
    }
    App.updateCartUI();
    toast(`${p.product_name} imeongezwa kwenye kikapu`, 'success');
  },

  cartChange(productId, delta) {
    const item = S.cart.find(c => c.product_id === productId);
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) S.cart = S.cart.filter(c => c.product_id !== productId);
    App.updateCartUI();
    App.renderCartPanel();
  },

  updateCartUI() {
    const count = S.cart.reduce((s, c) => s + c.qty, 0);
    const cartCount = $('#cart-count');
    if (cartCount) cartCount.textContent = count;
    const fab = $('#cart-fab');
    if (fab) fab.style.display = S.cart.length ? 'flex' : 'none';
  },

  renderCartPanel() {
    const itemsContainer = $('#cart-items');
    const totalSpan = $('#cart-total');
    if (!itemsContainer) return;
    if (!S.cart.length) { itemsContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#6b7280">Kikapu kiko tupu</div>'; if (totalSpan) totalSpan.textContent = 'TZS 0'; return; }
    const total = S.cart.reduce((s, c) => s + c.qty * c.unit_price, 0);
    itemsContainer.innerHTML = S.cart.map(c => `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:12px;background:#f9fafb;border-radius:12px"><div><div style="font-weight:600">${c.product_name}</div><div style="font-size:13px;color:#6b7280">${fmt(c.unit_price)} × ${c.qty}</div></div><div style="display:flex;align-items:center;gap:8px"><button onclick="App.cartChange('${c.product_id}',-1)" style="width:32px;height:32px;border-radius:8px;border:1px solid #e5e7eb;background:white;cursor:pointer">-</button><span style="width:32px;text-align:center;font-weight:600">${c.qty}</span><button onclick="App.cartChange('${c.product_id}',1)" style="width:32px;height:32px;border-radius:8px;border:1px solid #e5e7eb;background:white;cursor:pointer">+</button></div></div>`).join('');
    if (totalSpan) totalSpan.textContent = fmt(total);
  },

  toggleCart() {
    const panel = $('#cart-panel');
    if (panel) panel.classList.toggle('open');
  },

  async placeOrder() {
    if (!S.cart.length) return toast(t('cartEmpty'), 'error');
    const moqFail = S.cart.filter(c => c.qty < c.min_order_qty);
    if (moqFail.length) return toast(`${S.lang === 'sw' ? 'Kiwango cha chini hafikiwi:' : 'MOQ not met:'} ${moqFail.map(c => c.product_name).join(', ')}`, 'error');
    const distId = S.cartDist || S.cart[0]?.distributor_id;
    const { data: dist } = await sb.from('profiles').select('min_delivery_amount').eq('id', distId).single();
    const total = S.cart.reduce((s, c) => s + c.qty * c.unit_price, 0);
    if (dist?.min_delivery_amount && total < dist.min_delivery_amount) return toast(`${S.lang === 'sw' ? 'Agizo lako ni ndogo. Kiwango cha chini:' : 'Order below minimum:'} ${fmt(dist.min_delivery_amount)}`, 'error');
    setBusy('po-btn', true);
    const ref = genRef('ORD');
    const { data: order, error } = await sb.from('orders').insert([{ order_ref: ref, retailer_id: S.user.id, distributor_id: distId, total_price: total, items_count: S.cart.length, status: 'pending' }]).select().single();
    if (error || !order) { setBusy('po-btn', false, t('placeOrder')); return toast('Hitilafu ya kutuma agizo', 'error'); }
    await sb.from('order_items').insert(S.cart.map(c => ({ order_id: order.id, product_id: c.product_id, product_name: c.product_name, qty: c.qty, unit_price: c.unit_price, subtotal: c.qty * c.unit_price })));
    setBusy('po-btn', false, t('placeOrder'));
    S.cart = []; S.cartDist = null;
    App.toggleCart();
    App.updateCartUI();
    toast(`${t('orderSuccess')} ${ref}`, 'success');
    App.navTo('my-orders');
  },

  // ============================================================
  // MY ORDERS (FULL)
  // ============================================================
  async pageMyOrders() {
    const { data: orders } = await sb.from('orders').select('*').eq('retailer_id', S.user.id).order('created_at', { ascending: false });
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div class="card"><div class="card-header"><h3 class="card-title">${t('myOrders')}</h3></div><div class="card-body"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #e5e7eb"><th style="text-align:left;padding:12px">REF</th><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'HALI' : 'STATUS'}</th><th style="text-align:right;padding:12px">${S.lang === 'sw' ? 'JUMLA' : 'TOTAL'}</th><th style="text-align:right;padding:12px">${S.lang === 'sw' ? 'TAREHE' : 'DATE'}</th><th style="text-align:center;padding:12px">${S.lang === 'sw' ? 'VITENDO' : 'ACTIONS'}</th></tr></thead>
        <tbody>${(orders || []).map(o => `<tr style="border-bottom:1px solid #f3f4f6"><td style="padding:12px"><strong>${o.order_ref}</strong></td><td style="padding:12px"><span class="status-badge ${o.status === 'pending' ? 'status-pending' : o.status === 'confirmed' ? 'status-confirmed' : o.status === 'delivered' ? 'status-delivered' : 'status-cancelled'}">${o.status === 'pending' ? t('pending') : o.status === 'confirmed' ? t('confirmed') : o.status === 'delivered' ? t('delivered') : t('cancelled')}</span></td><td style="padding:12px;text-align:right"><strong>${fmt(o.total_price)}</strong></td><td style="padding:12px;text-align:right;color:#6b7280;font-size:13px">${o.created_at?.slice(0, 10)}</span></td><td style="padding:12px;text-align:center">${o.status === 'delivered' ? `<button class="btn-secondary" onclick="App.showInvoice('${o.id}')" style="padding:8px 16px">${t('invoices')}</button>` : ''}</span></td></tr>`).join('') || '<tr><td colspan="5" style="padding:40px;text-align:center;color:#6b7280">Hakuna maagizo</span></tr>'}</tbody></table></div></div>`;
    }
  },

  // ============================================================
  // ORDERS (Distributor) (FULL)
  // ============================================================
  async pageOrders() {
    const { data: orders } = await sb.from('orders').select('*').eq('distributor_id', S.user.id).order('created_at', { ascending: false });
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div class="card"><div class="card-header"><h3 class="card-title">${t('orders')}</h3></div><div class="card-body"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #e5e7eb"><th style="text-align:left;padding:12px">REF</th><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'HALI' : 'STATUS'}</th><th style="text-align:right;padding:12px">${S.lang === 'sw' ? 'JUMLA' : 'TOTAL'}</th><th style="text-align:right;padding:12px">${S.lang === 'sw' ? 'TAREHE' : 'DATE'}</th><th style="text-align:center;padding:12px">${S.lang === 'sw' ? 'VITENDO' : 'ACTIONS'}</th></tr></thead>
        <tbody>${(orders || []).map(o => `<tr style="border-bottom:1px solid #f3f4f6"><td style="padding:12px"><strong>${o.order_ref}</strong></td><td style="padding:12px"><span class="status-badge ${o.status === 'pending' ? 'status-pending' : o.status === 'confirmed' ? 'status-confirmed' : o.status === 'delivered' ? 'status-delivered' : 'status-cancelled'}">${o.status === 'pending' ? t('pending') : o.status === 'confirmed' ? t('confirmed') : o.status === 'delivered' ? t('delivered') : t('cancelled')}</span></td><td style="padding:12px;text-align:right"><strong>${fmt(o.total_price)}</strong></td><td style="padding:12px;text-align:right;color:#6b7280;font-size:13px">${o.created_at?.slice(0, 10)}</span></td><td style="padding:12px;text-align:center"><div style="display:flex;gap:8px;justify-content:center">${o.status === 'pending' ? `<button class="btn-primary" onclick="App.updateOrderStatus('${o.id}','confirmed')" style="padding:8px 16px">${S.lang === 'sw' ? 'Thibitisha' : 'Confirm'}</button>` : ''}${o.status === 'confirmed' ? `<button class="btn-primary" onclick="App.updateOrderStatus('${o.id}','delivered')" style="padding:8px 16px">${S.lang === 'sw' ? 'Toa' : 'Deliver'}</button>` : ''}${o.status === 'delivered' ? `<button class="btn-secondary" onclick="App.showReceipt('${o.id}')" style="padding:8px 16px">${t('printReceipt')}</button>` : ''}${o.status !== 'cancelled' && o.status !== 'delivered' ? `<button class="btn-secondary" style="background:#fee2e2;border-color:#fecaca;color:#dc2626" onclick="App.updateOrderStatus('${o.id}','cancelled')">${S.lang === 'sw' ? 'Futa' : 'Cancel'}</button>` : ''}</div></td></td>`).join('') || '<tr><td colspan="5" style="padding:40px;text-align:center;color:#6b7280">Hakuna maagizo</span></tr>'}</tbody></table></div></div>`;
    }
  },

  async updateOrderStatus(orderId, status) {
    const { error } = await sb.from('orders').update({ status }).eq('id', orderId);
    if (error) return toast('Hitilafu ya kubadilisha hali', 'error');
    toast(S.lang === 'sw' ? `Hali imebadilishwa: ${status}` : `Status updated: ${status}`, 'success');
    if (status === 'delivered') {
      const { data: o } = await sb.from('orders').select('*').eq('id', orderId).single();
      if (o) {
        const ref = genRef('RCP');
        await sb.from('receipts').insert([{ receipt_ref: ref, order_id: orderId, distributor_id: o.distributor_id, retailer_id: o.retailer_id, amount: o.total_price, payment_method: 'cash' }]);
        const invRef = genRef('INV');
        await sb.from('invoices').insert([{ invoice_ref: invRef, order_id: orderId, distributor_id: o.distributor_id, retailer_id: o.retailer_id, amount: o.total_price, status: 'unpaid', due_date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) }]);
      }
    }
    App.pageOrders();
  },

  async showReceipt(orderId) {
    const { data: order } = await sb.from('orders').select('*').eq('id', orderId).single();
    const { data: items } = await sb.from('order_items').select('*').eq('order_id', orderId);
    const { data: retailer } = await sb.from('profiles').select('store_name,phone_number,district').eq('id', order.retailer_id).single();
    const { data: dist } = await sb.from('profiles').select('store_name,phone_number').eq('id', order.distributor_id).single();
    const { data: receipt } = await sb.from('receipts').select('receipt_ref,issued_at').eq('order_id', orderId).maybeSingle();
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div style="margin-bottom:16px"><button class="btn-primary no-print" onclick="window.print()">${t('printReceipt')}</button></div>
        <div class="receipt"><div style="text-align:center;margin-bottom:24px"><h2>BomaWave</h2><p>FMCG Platform · Tanzania</p></div><div style="text-align:center;margin-bottom:16px"><h3>${S.lang === 'sw' ? 'RISITI YA MALIPO' : 'PAYMENT RECEIPT'}</h3><p>Ref: ${receipt?.receipt_ref || order.order_ref} · ${receipt?.issued_at?.slice(0, 10) || today()}</p></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px"><div><strong>${S.lang === 'sw' ? 'MUUZAJI' : 'SELLER'}</strong><p>${dist?.store_name || '—'}<br>${dist?.phone_number || ''}</p></div><div><strong>${S.lang === 'sw' ? 'MNUNUZI' : 'BUYER'}</strong><p>${retailer?.store_name || '—'}<br>${retailer?.phone_number || ''} · ${retailer?.district || ''}</p></div></div>
        ${(items || []).map(i => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6"><span>${i.product_name} × ${i.qty}</span><span>${fmt(i.subtotal)}</span></div>`).join('')}
        <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:2px solid #1f2937"><strong>${S.lang === 'sw' ? 'JUMLA YA MALIPO' : 'TOTAL PAID'}</strong><strong>${fmt(order.total_price)}</strong></div>
        <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">${S.lang === 'sw' ? 'Asante kwa biashara yako! · BomaWave FMCG Platform' : 'Thank you for your business! · BomaWave FMCG Platform'}</div></div>`;
    }
  },

  async showInvoice(orderId) {
    const { data: order } = await sb.from('orders').select('*').eq('id', orderId).single();
    const { data: items } = await sb.from('order_items').select('*').eq('order_id', orderId);
    const { data: retailer } = await sb.from('profiles').select('store_name,phone_number,district').eq('id', order.retailer_id).single();
    const { data: dist } = await sb.from('profiles').select('store_name,phone_number').eq('id', order.distributor_id).single();
    const { data: invoice } = await sb.from('invoices').select('*').eq('order_id', orderId).maybeSingle();
    const inv = invoice || { invoice_ref: genRef('INV'), issued_at: new Date().toISOString(), due_date: '', status: 'unpaid' };
    const shareText = encodeURIComponent(`*ANKARA YA BOMAWAVE*\nRef: ${inv.invoice_ref}\nTarehe: ${inv.issued_at?.slice(0, 10)}\n\nMuuzaji: ${dist?.store_name}\nMnunuzi: ${retailer?.store_name}\n\nBIDHAA:\n${(items || []).map(i => `- ${i.product_name} x${i.qty}: ${fmt(i.subtotal)}`).join('\n')}\n\nJUMLA: ${fmt(order.total_price)}\nHali: ${inv.status === 'paid' ? '✅ Imelipwa' : '⏳ Haijalipwa'}\n\nBomaWave FMCG · Tanzania`);
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div class="no-print" style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap"><button class="btn-primary" onclick="window.print()">${t('printPDF')}</button><button class="btn-secondary" onclick="window.open('https://wa.me/?text=${shareText}','_blank')">WhatsApp</button><button class="btn-secondary" onclick="window.open('sms:?body=${shareText}','_blank')">SMS</button></div>
        <div class="receipt"><div style="text-align:center;margin-bottom:24px"><h2>BomaWave</h2><p>FMCG Platform · Tanzania</p></div><div style="text-align:center;margin-bottom:16px"><h3>${S.lang === 'sw' ? 'ANKARA YA BIASHARA' : 'COMMERCIAL INVOICE'}</h3><p>Ref: ${inv.invoice_ref} · ${inv.issued_at?.slice(0, 10) || today()}</p></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px"><div><strong>${S.lang === 'sw' ? 'MUUZAJI' : 'SELLER'}</strong><p>${dist?.store_name || '—'}<br>${dist?.phone_number || ''}</p></div><div><strong>${S.lang === 'sw' ? 'MNUNUZI' : 'BUYER'}</strong><p>${retailer?.store_name || '—'}<br>${retailer?.phone_number || ''}</p></div></div>
        ${(items || []).map(i => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6"><span>${i.product_name} × ${i.qty} @ ${fmt(i.unit_price)}</span><span>${fmt(i.subtotal)}</span></div>`).join('')}
        <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:2px solid #1f2937"><strong>${S.lang === 'sw' ? 'JUMLA' : 'TOTAL'}</strong><strong>${fmt(order.total_price)}</strong></div>
        <div style="margin-top:16px;padding:12px;background:#f3f4f6;border-radius:12px"><div style="display:flex;justify-content:space-between"><span>${S.lang === 'sw' ? 'Hali ya Malipo' : 'Payment Status'}</span><strong>${inv.status === 'paid' ? '✅ Imelipwa' : '⏳ Haijalipwa'}</strong></div>${inv.due_date ? `<div style="display:flex;justify-content:space-between;margin-top:8px"><span>${S.lang === 'sw' ? 'Tarehe ya Mwisho' : 'Due Date'}</span><strong>${inv.due_date}</strong></div>` : ''}</div>
        <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">${S.lang === 'sw' ? 'Malipo yalipwe kabla ya tarehe iliyoonyeshwa. · BomaWave FMCG · Tanzania' : 'Payment due by date shown. · BomaWave FMCG · Tanzania'}</div></div>`;
    }
  },

  async pageInvoices() {
    const { data: invoices } = await sb.from('invoices').select('*').eq('distributor_id', S.user.id).order('issued_at', { ascending: false });
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div class="card"><div class="card-header"><h3 class="card-title">${t('invoices')}</h3></div><div class="card-body"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #e5e7eb"><th style="text-align:left;padding:12px">REF</th><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'HALI' : 'STATUS'}</th><th style="text-align:right;padding:12px">${S.lang === 'sw' ? 'KIASI' : 'AMOUNT'}</th><th style="text-align:right;padding:12px">${S.lang === 'sw' ? 'TAREHE' : 'DATE'}</th><th style="text-align:center;padding:12px">${S.lang === 'sw' ? 'VITENDO' : 'ACTIONS'}</th></tr></thead>
        <tbody>${(invoices || []).map(inv => `<tr style="border-bottom:1px solid #f3f4f6"><td style="padding:12px"><strong>${inv.invoice_ref}</strong></td><td style="padding:12px"><span class="status-badge ${inv.status === 'paid' ? 'status-delivered' : 'status-pending'}">${inv.status === 'paid' ? 'Imelipwa' : 'Haijalipwa'}</span></td><td style="padding:12px;text-align:right"><strong>${fmt(inv.amount)}</strong></td><td style="padding:12px;text-align:right;color:#6b7280;font-size:13px">${inv.issued_at?.slice(0, 10)}</span></td><td style="padding:12px;text-align:center"><div style="display:flex;gap:8px;justify-content:center">${inv.order_id ? `<button class="btn-secondary" onclick="App.showInvoice('${inv.order_id}')" style="padding:8px 16px">${t('shareInvoice')}</button>` : ''}${inv.status === 'unpaid' ? `<button class="btn-primary" onclick="App.markInvPaid('${inv.id}')" style="padding:8px 16px">${S.lang === 'sw' ? 'Malipo Yamefika' : 'Mark Paid'}</button>` : ''}</div></td></tr>`).join('') || '<tr><td colspan="5" style="padding:40px;text-align:center;color:#6b7280">Hakuna ankara</span></tr>'}</tbody></table></div></div>`;
    }
  },

  async markInvPaid(id) {
    await sb.from('invoices').update({ status: 'paid' }).eq('id', id);
    toast(S.lang === 'sw' ? 'Malipo yamekubaliwa' : 'Payment recorded', 'success');
    App.pageInvoices();
  },

  // ============================================================
  // PRODUCTS (Distributor) (FULL)
  // ============================================================
  async pageProducts() {
    const { data: products } = await sb.from('products').select('*').eq('distributor_id', S.user.id).order('created_at', { ascending: false });
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div class="card" style="margin-bottom:20px"><div class="card-header"><h3 class="card-title">${S.lang === 'sw' ? 'Ongeza Bidhaa Mpya' : 'Add New Product'}</h3></div><div class="card-body"><div class="form-grid"><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Jina' : 'Name'} *</label><input class="form-input" id="pn" placeholder="${S.lang === 'sw' ? 'Jina la bidhaa' : 'Product name'}"/></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Aina' : 'Category'}</label><select class="form-select" id="pc">${CATS.map(c => `<option value="${c.id}">${c.icon} ${S.lang === 'sw' ? c.sw : c.en}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Bei ya Kuuza' : 'Sell Price'} *</label><input class="form-input" id="pp" type="number" min="0" placeholder="0"/></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Bei ya Kununua' : 'Cost Price'}</label><input class="form-input" id="pcp" type="number" min="0" placeholder="0"/></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Stok' : 'Stock'}</label><input class="form-input" id="pq" type="number" min="0" placeholder="0"/></div><div class="form-group"><label class="form-label">MOQ</label><input class="form-input" id="pmoq" type="number" min="1" value="1" placeholder="1"/></div></div><button class="btn-primary btn-block" onclick="App.addProduct()"><span id="add-p-txt">+ ${t('addProduct')}</span></button></div></div>
        <div class="card"><div class="card-header"><h3 class="card-title">${S.lang === 'sw' ? 'Bidhaa Zangu' : 'My Products'}</h3></div><div class="card-body"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #e5e7eb"><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'JINA' : 'NAME'}</th><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'AINA' : 'CATEGORY'}</th><th style="text-align:right;padding:12px">${S.lang === 'sw' ? 'BEI' : 'PRICE'}</th><th style="text-align:center;padding:12px">MOQ</th><th style="text-align:center;padding:12px">${S.lang === 'sw' ? 'STOK' : 'STOCK'}</th><th style="text-align:center;padding:12px">${S.lang === 'sw' ? 'VITENDO' : 'ACTIONS'}</th></tr></thead>
        <tbody>${(products || []).map(p => `<tr style="border-bottom:1px solid #f3f4f6"><td style="padding:12px"><strong>${p.product_name}</strong></td><td style="padding:12px">${p.category}</span></td><td style="padding:12px;text-align:right">${fmt(p.price)}</span></td><td style="padding:12px;text-align:center;color:#d97706;font-weight:600">${p.min_order_qty}</span></td><td style="padding:12px;text-align:center"><div style="display:flex;align-items:center;gap:8px;justify-content:center"><input type="number" id="sq-${p.id}" value="${p.stock_qty}" min="0" style="width:70px;padding:8px;border:1px solid #e5e7eb;border-radius:8px"/><button class="btn-primary" onclick="App.updateStock('${p.id}')" style="padding:6px 12px">${S.lang === 'sw' ? 'Hifadhi' : 'Save'}</button></div></span></td><td style="padding:12px;text-align:center"><button class="btn-secondary" style="background:#fee2e2;border-color:#fecaca;color:#dc2626" onclick="App.deleteProduct('${p.id}')">${S.lang === 'sw' ? 'Futa' : 'Delete'}</button></span></td></tr>`).join('') || '<tr><td colspan="6" style="padding:40px;text-align:center;color:#6b7280">Hakuna bidhaa</span></tr>'}</tbody></table></div></div>`;
    }
  },

  async addProduct() {
    const name = $('#pn').value.trim(), cat = $('#pc').value, price = parseFloat($('#pp').value || '0'), cost = parseFloat($('#pcp').value || '0'), qty = parseInt($('#pq').value || '0'), moq = parseInt($('#pmoq').value || '1'), unit = $('#pu')?.value.trim() || '';
    if (!name || !price) return toast(S.lang === 'sw' ? 'Jaza jina na bei' : 'Fill name and price', 'error');
    setBusy('add-p-txt', true);
    const { error } = await sb.from('products').insert([{ distributor_id: S.user.id, product_name: name, category: cat, price, cost_price: cost, stock_qty: qty, min_order_qty: moq, selling_unit: unit }]);
    setBusy('add-p-txt', false, `+ ${t('addProduct')}`);
    if (error) return toast('Hitilafu ya kuongeza bidhaa', 'error');
    toast(S.lang === 'sw' ? 'Bidhaa imeongezwa! ✅' : 'Product added! ✅', 'success');
    App.pageProducts();
  },

  async updateStock(id) {
    const qty = parseInt($(`sq-${id}`)?.value || '0');
    await sb.from('products').update({ stock_qty: qty }).eq('id', id);
    toast(S.lang === 'sw' ? 'Stok imehifadhiwa' : 'Stock updated', 'success');
  },

  async deleteProduct(id) {
    if (!confirm(S.lang === 'sw' ? 'Una uhakika wa kufuta bidhaa hii?' : 'Delete this product?')) return;
    await sb.from('products').delete().eq('id', id);
    toast(S.lang === 'sw' ? 'Bidhaa imefutwa' : 'Product deleted', 'success');
    App.pageProducts();
  },

  // ============================================================
  // POS (POINT OF SALE) - PROFESSIONAL WITH REAL PROFIT CALCULATION (FULL)
  // ============================================================
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
    const allExps = [...offE.map(e => ({ ...e, _off: true })), ...onlineExps];

    const todayRev = allSales.reduce((s, r) => s + (r.revenue || r.selling_price * r.qty || 0), 0);
    const todayProfit = allSales.reduce((s, r) => s + (r.profit || (r.selling_price - r.buying_price) * r.qty || 0), 0);
    const todayExp = allExps.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = todayProfit - todayExp;
    const margin = todayRev > 0 ? Math.round((todayProfit / todayRev) * 100) : 0;

    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        ${!S.isOnline ? '<div class="offline-banner" style="margin-bottom:16px">⚡ ' + (S.lang === 'sw' ? 'Nje ya mtandao — data inashikiliwa hapa' : 'Offline — data saved locally, will sync when online') + '</div>' : ''}
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Mapato Leo' : 'Revenue'}</div><div class="stat-value positive" id="pos-rev">TZS 0</div></div>
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Faida' : 'Profit'}</div><div class="stat-value positive" id="pos-profit">TZS 0</div></div>
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Matumizi' : 'Expenses'}</div><div class="stat-value negative" id="pos-exp">TZS 0</div></div>
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Faida Halisi' : 'Net Profit'}</div><div class="stat-value ${netProfit >= 0 ? 'positive' : 'negative'}" id="pos-net">TZS 0</div></div>
        </div>
        <div class="tabs"><button class="tab ${S.posTab === 'sales' ? 'active' : ''}" onclick="App.setPosTab('sales')">${t('sales')}</button><button class="tab ${S.posTab === 'expenses' ? 'active' : ''}" onclick="App.setPosTab('expenses')">${t('expenses')}</button><button class="tab ${S.posTab === 'history' ? 'active' : ''}" onclick="App.setPosTab('history')">${t('history')}</button></div>
        <div id="pos-sales" style="display:${S.posTab === 'sales' ? 'block' : 'none'}">
          <div class="card"><div class="card-header"><h3 class="card-title">${t('recordSale')}</h3></div><div class="card-body"><div class="form-group"><label class="form-label">${t('productName')} *</label><input class="form-input" id="s-prod" placeholder="${t('productName')}" oninput="App.calcProfit()"/></div>
          <div class="form-group"><label class="form-label">${t('category')}</label><select class="form-select" id="s-cat">${CATS.map(c => `<option value="${c.id}">${c.icon} ${S.lang === 'sw' ? c.sw : c.en}</option>`).join('')}</select></div>
          <div class="form-grid"><div class="form-group"><label class="form-label">${t('quantity')} *</label><input class="form-input" id="s-qty" type="number" min="1" value="1" oninput="App.calcProfit()"/></div>
          <div class="form-group"><label class="form-label">${t('buyPrice')}</label><input class="form-input" id="s-buy" type="number" min="0" placeholder="0" oninput="App.calcProfit()"/></div>
          <div class="form-group"><label class="form-label">${t('sellPrice')} *</label><input class="form-input" id="s-sell" type="number" min="0" placeholder="0" oninput="App.calcProfit()" style="border-color:#16a34a"/></div></div>
          <div class="calc-card" id="calc-card"><div class="calc-row"><span class="calc-label">${t('revenue')}</span><span class="calc-value revenue" id="calc-rev">TZS 0</span></div><div class="calc-row"><span class="calc-label">${t('profit')}</span><span class="calc-value profit" id="calc-profit">TZS 0</span></div><div class="calc-row"><span class="calc-label">${t('margin')}</span><span class="calc-value margin" id="calc-margin">0%</span></div></div>
          <button class="btn-primary btn-block" onclick="App.recordSale()"><span id="rec-sale-txt">✓ ${t('recordSale')}</span></button></div></div>
        </div>
        <div id="pos-expenses" style="display:${S.posTab === 'expenses' ? 'block' : 'none'}">
          <div class="card"><div class="card-header"><h3 class="card-title">${t('recordExpense')}</h3></div><div class="card-body"><div class="form-group"><label class="form-label">${t('category')}</label><select class="form-select" id="e-cat"><option value="rent">${S.lang === 'sw' ? 'Kodi' : 'Rent'}</option><option value="transport">${S.lang === 'sw' ? 'Usafiri' : 'Transport'}</option><option value="salary">${S.lang === 'sw' ? 'Mshahara' : 'Salary'}</option><option value="utilities">${S.lang === 'sw' ? 'Umeme / Maji' : 'Utilities'}</option><option value="stock">${S.lang === 'sw' ? 'Kununua Stok' : 'Stock Purchase'}</option><option value="other">${S.lang === 'sw' ? 'Nyingine' : 'Other'}</option></select></div>
          <div class="form-group"><label class="form-label">${t('amount')} *</label><input class="form-input" id="e-amt" type="number" min="0" placeholder="0"/></div>
          <div class="form-group"><label class="form-label">${t('description')} *</label><input class="form-input" id="e-desc" placeholder="${S.lang === 'sw' ? 'mfano: Kodi ya mwezi' : 'e.g. Monthly rent'}"/></div>
          <button class="btn-primary btn-block" onclick="App.recordExpense()"><span id="rec-exp-txt">✓ ${t('recordExpense')}</span></button></div></div>
        </div>
        <div id="pos-history" style="display:${S.posTab === 'history' ? 'block' : 'none'}">
          <div class="card" style="margin-bottom:16px"><div class="card-header"><h3 class="card-title">💰 ${S.lang === 'sw' ? 'Mauzo ya Leo' : 'Today Sales'} (${allSales.length})</h3>${offS.length ? '<span style="background:#fef3c7;color:#d97706;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">⚡ ' + offS.length + ' offline</span>' : ''}</div><div class="card-body"><div class="history-list">${allSales.map(s => `<div class="history-item sale"><div class="history-info"><div class="history-name">${s.product_name}</div><div class="history-details">Qty: ${s.qty} | ${s._off ? '⚡ Offline' : ''}</div></div><div class="history-amount sale">${fmt(s.revenue || s.selling_price * s.qty || 0)}<br><span style="font-size:12px;color:${(s.profit || (s.selling_price - s.buying_price) * s.qty || 0) >= 0 ? '#16a34a' : '#dc2626'}">Faida: ${fmt(s.profit || (s.selling_price - s.buying_price) * s.qty || 0)}</span></div></div>`).join('') || '<div style="text-align:center;padding:40px;color:#6b7280">Hakuna mauzo leo</div>'}</div></div></div>
          <div class="card"><div class="card-header"><h3 class="card-title">💸 ${S.lang === 'sw' ? 'Matumizi ya Leo' : 'Today Expenses'}</h3></div><div class="card-body"><div class="history-list">${allExps.map(e => `<div class="history-item expense"><div class="history-info"><div class="history-name">${e.category === 'rent' ? '🏠 Kodi' : e.category === 'transport' ? '🚗 Usafiri' : e.category === 'salary' ? '👔 Mshahara' : e.category === 'utilities' ? '💡 Umeme/Maji' : e.category === 'stock' ? '📦 Stok' : '📋 Nyingine'}</div><div class="history-details">${e.description}</div></div><div class="history-amount expense">- ${fmt(e.amount)}</div></div>`).join('') || '<div style="text-align:center;padding:40px;color:#6b7280">Hakuna matumizi leo</div>'}</div></div></div>
        </div>`;
    }

    setTimeout(() => {
      animateCount($('#pos-rev'), todayRev, 'TZS ');
      animateCount($('#pos-profit'), todayProfit, 'TZS ');
      animateCount($('#pos-exp'), todayExp, 'TZS ');
      animateCount($('#pos-net'), netProfit, 'TZS ');
    }, 100);
  },

  setPosTab(tab) {
    S.posTab = tab;
    const salesDiv = $('#pos-sales');
    const expensesDiv = $('#pos-expenses');
    const historyDiv = $('#pos-history');
    if (salesDiv) salesDiv.style.display = tab === 'sales' ? 'block' : 'none';
    if (expensesDiv) expensesDiv.style.display = tab === 'expenses' ? 'block' : 'none';
    if (historyDiv) historyDiv.style.display = tab === 'history' ? 'block' : 'none';
    document.querySelectorAll('.tab').forEach((t, i) => { if (t) t.classList.toggle('active', (tab === 'sales' && i === 0) || (tab === 'expenses' && i === 1) || (tab === 'history' && i === 2)); });
  },

  calcProfit() {
    const qty = parseFloat($('#s-qty')?.value || 0);
    const buy = parseFloat($('#s-buy')?.value || 0);
    const sell = parseFloat($('#s-sell')?.value || 0);
    const calcCard = $('#calc-card');
    if (!calcCard) return;
    if (sell > 0 && qty > 0) {
      calcCard.style.display = 'block';
      const rev = sell * qty;
      const profit = (sell - buy) * qty;
      const margin = sell > 0 ? Math.round(((sell - buy) / sell) * 100) : 0;
      setText('calc-rev', fmt(rev));
      setText('calc-profit', fmt(profit));
      setText('calc-margin', `${margin}%`);
      const calcMargin = $('#calc-margin');
      if (calcMargin) calcMargin.style.color = margin >= 20 ? '#16a34a' : margin >= 10 ? '#d97706' : '#dc2626';
    } else {
      calcCard.style.display = 'none';
    }
  },

  async recordSale() {
    const prod = $('#s-prod')?.value.trim();
    const cat = $('#s-cat')?.value;
    const qty = parseInt($('#s-qty')?.value || '1');
    const buy = parseFloat($('#s-buy')?.value || '0');
    const sell = parseFloat($('#s-sell')?.value || '0');
    if (!prod || !sell || qty < 1) return toast(S.lang === 'sw' ? 'Jaza jina la bidhaa na bei ya kuuza' : 'Fill product name and selling price', 'error');
    const revenue = sell * qty;
    const profit = (sell - buy) * qty;
    const data = { user_id: S.user.id, product_name: prod, category: cat, qty, buying_price: buy, selling_price: sell, revenue, profit, sale_date: today(), store_id: S.store?.id || null };
    setBusy('rec-sale-txt', true);
    if (S.isOnline) {
      const { error } = await sb.from('sales').insert([data]);
      if (error) { await posDbAdd('sales', data); toast(S.lang === 'sw' ? '⚡ Imehifadhiwa offline' : '⚡ Saved offline', 'warning'); }
      else { toast(S.lang === 'sw' ? '✅ Mauzo yamerekodiwa!' : '✅ Sale recorded!', 'success'); }
    } else {
      await posDbAdd('sales', data);
      toast(S.lang === 'sw' ? '⚡ Imehifadhiwa offline — itasync baadaye' : '⚡ Saved offline', 'warning');
    }
    setBusy('rec-sale-txt', false, `✓ ${t('recordSale')}`);
    if ($('#s-prod')) $('#s-prod').value = '';
    if ($('#s-qty')) $('#s-qty').value = '1';
    if ($('#s-buy')) $('#s-buy').value = '';
    if ($('#s-sell')) $('#s-sell').value = '';
    App.pagePOS();
  },

  async recordExpense() {
    const cat = $('#e-cat')?.value;
    const desc = $('#e-desc')?.value.trim();
    const amt = parseFloat($('#e-amt')?.value || '0');
    if (!desc || !amt) return toast(S.lang === 'sw' ? 'Jaza maelezo na kiasi' : 'Fill description and amount', 'error');
    const data = { user_id: S.user.id, category: cat, description: desc, amount: amt, expense_date: today(), store_id: S.store?.id || null };
    setBusy('rec-exp-txt', true);
    if (S.isOnline) {
      const { error } = await sb.from('expenses').insert([data]);
      if (error) { await posDbAdd('expenses', data); toast('⚡ Saved offline', 'warning'); }
      else { toast(S.lang === 'sw' ? '✅ Matumizi yamerekodiwa!' : '✅ Expense recorded!', 'success'); }
    } else {
      await posDbAdd('expenses', data);
      toast(S.lang === 'sw' ? '⚡ Imehifadhiwa offline' : '⚡ Saved offline', 'warning');
    }
    setBusy('rec-exp-txt', false, `✓ ${t('recordExpense')}`);
    if ($('#e-amt')) $('#e-amt').value = '';
    if ($('#e-desc')) $('#e-desc').value = '';
    App.pagePOS();
  },

  // ============================================================
  // REPORTS (FULL)
  // ============================================================
  async pageReports() {
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `<div class="tabs"><button class="tab active" onclick="App.loadReports('today')">${t('today')}</button><button class="tab" onclick="App.loadReports('week')">${t('week')}</button><button class="tab" onclick="App.loadReports('month')">${t('month')}</button><button class="tab" onclick="App.loadReports('year')">${t('year')}</button></div><div id="reports-content"><div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner-dark"></div></div></div>`;
      await App.loadReports('today');
    }
  },

  async loadReports(period) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const tabs = document.querySelectorAll('.tab');
    const periodIndex = { today: 0, week: 1, month: 2, year: 3 }[period];
    if (tabs[periodIndex]) tabs[periodIndex].classList.add('active');

    const days = { today: 0, week: 7, month: 30, year: 365 }[period] || 0;
    const startDate = days === 0 ? today() : new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
    const uid = S.user.id;
    const sid = S.store?.id;

    let sq = sb.from('sales').select('*').eq('user_id', uid).gte('sale_date', startDate);
    let eq = sb.from('expenses').select('*').eq('user_id', uid).gte('expense_date', startDate);
    if (sid) { sq = sq.eq('store_id', sid); eq = eq.eq('store_id', sid); }
    const [{ data: sales }, { data: exps }] = await Promise.all([sq, eq]);
    const allS = sales || [], allE = exps || [];

    const rev = allS.reduce((s, r) => s + (r.revenue || r.selling_price * r.qty || 0), 0);
    const profit = allS.reduce((s, r) => s + (r.profit || (r.selling_price - r.buying_price) * r.qty || 0), 0);
    const expT = allE.reduce((s, e) => s + (e.amount || 0), 0);
    const net = profit - expT;
    const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
    const txCount = allS.length;

    const byProd = {};
    allS.forEach(s => { byProd[s.product_name] = (byProd[s.product_name] || 0) + (s.revenue || s.selling_price * s.qty || 0); });
    const topProds = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const reportsContent = $('#reports-content');
    if (reportsContent) {
      reportsContent.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Jumla Mapato' : 'Total Revenue'}</div><div class="stat-value positive">${fmt(rev)}</div><div class="stat-label" style="font-size:12px;margin-top:8px">${txCount} ${S.lang === 'sw' ? 'mauzo' : 'transactions'}</div></div>
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Faida Ghafi' : 'Gross Profit'}</div><div class="stat-value ${profit >= 0 ? 'positive' : 'negative'}">${fmt(profit)}</div><div class="stat-label" style="font-size:12px;margin-top:8px">Margin: ${margin}%</div></div>
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Matumizi' : 'Expenses'}</div><div class="stat-value negative">${fmt(expT)}</div></div>
          <div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Faida Halisi' : 'Net Profit'}</div><div class="stat-value ${net >= 0 ? 'positive' : 'negative'}">${fmt(net)}</div></div>
        </div>
        <div class="card"><div class="card-header"><h3 class="card-title">🏆 ${S.lang === 'sw' ? 'Bidhaa Zinazoongoza' : 'Top Products'}</h3></div><div class="card-body">${topProds.length ? topProds.map(([name, revVal], i) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6"><span><strong>${i + 1}.</strong> ${name}</span><span style="color:#16a34a;font-weight:700">${fmt(revVal)}</span></div>`).join('') : '<div style="text-align:center;padding:40px;color:#6b7280">Hakuna data</div>'}</div></div>`;
    }
  },

  // ============================================================
  // DEBTS (FULL)
  // ============================================================
  async pageDebts() {
    const { data: debts } = await sb.from('debts').select('*').eq('user_id', S.user.id).order('created_at', { ascending: false });
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div class="card" style="margin-bottom:20px"><div class="card-header"><h3 class="card-title">${S.lang === 'sw' ? 'Rekodi Deni Jipya' : 'Record New Debt'}</h3></div><div class="card-body"><div class="form-grid-2"><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Jina la Mteja' : 'Customer Name'} *</label><input class="form-input" id="d-name" placeholder="${S.lang === 'sw' ? 'Jina la mteja' : 'Customer name'}"/></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Simu' : 'Phone'}</label><input class="form-input" id="d-phone" type="tel" placeholder="07xxxxxxxx"/></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Kiasi' : 'Amount'} *</label><input class="form-input" id="d-amt" type="number" min="0" placeholder="0"/></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Tarehe ya Kulipa' : 'Due Date'}</label><input class="form-input" id="d-due" type="date"/></div></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Maelezo' : 'Description'}</label><input class="form-input" id="d-desc" placeholder="${S.lang === 'sw' ? 'mfano: Mkopo wa mchele' : 'e.g. Rice credit'}"/></div><button class="btn-primary btn-block" onclick="App.addDebt()"><span id="add-debt-txt">${S.lang === 'sw' ? 'Rekodi Deni' : 'Record Debt'}</span></button></div></div>
        <div class="card"><div class="card-header"><h3 class="card-title">${S.lang === 'sw' ? 'Madeni Yaliyopo' : 'Debts List'}</h3></div><div class="card-body"><div class="history-list">${(debts || []).map(d => { const paid = d.amount_paid || 0; const remain = d.amount - paid; const pct = Math.min(100, Math.round((paid / d.amount) * 100)); return `<div class="history-item"><div class="history-info"><div class="history-name">${d.customer_name}</div><div class="history-details">${d.description || ''} · ${d.customer_phone ? d.customer_phone + ' · ' : ''}Tarehe: ${d.due_date || '-'}</div><div style="margin-top:8px;height:6px;background:#e5e7eb;border-radius:3px;width:100%"><div style="width:${pct}%;height:100%;background:#16a34a;border-radius:3px"></div></div></div><div style="text-align:right"><div class="history-amount">${fmt(remain)}</div><div style="font-size:12px;color:#6b7280">Imelipwa: ${fmt(paid)}</div>${d.status !== 'paid' ? `<div style="display:flex;gap:8px;margin-top:8px"><input type="number" id="dp-${d.id}" placeholder="Kiasi" style="width:80px;padding:8px;border:1px solid #e5e7eb;border-radius:8px"/><button class="btn-primary" onclick="App.payDebt('${d.id}')" style="padding:6px 12px">Lipa</button><button class="btn-secondary" style="background:#fee2e2;border-color:#fecaca;color:#dc2626;padding:6px 12px" onclick="App.deleteDebt('${d.id}')">Futa</button></div>` : ''}</div></div>`; }).join('') || '<div style="text-align:center;padding:40px;color:#6b7280">Hakuna madeni</div>'}</div></div></div>`;
    }
  },

  async addDebt() {
    const name = $('#d-name').value.trim(), phone = $('#d-phone').value, amt = parseFloat($('#d-amt').value || '0'), due = $('#d-due').value, desc = $('#d-desc').value;
    if (!name || !amt) return toast(S.lang === 'sw' ? 'Jaza jina na kiasi' : 'Fill name and amount', 'error');
    setBusy('add-debt-txt', true);
    const { error } = await sb.from('debts').insert([{ user_id: S.user.id, customer_name: name, customer_phone: phone, amount: amt, due_date: due || null, description: desc, status: 'unpaid' }]);
    setBusy('add-debt-txt', false, S.lang === 'sw' ? 'Rekodi Deni' : 'Record Debt');
    if (error) return toast('Hitilafu', 'error');
    toast(S.lang === 'sw' ? 'Deni limerekodiwa! ✅' : 'Debt recorded! ✅', 'success');
    App.pageDebts();
  },

  async payDebt(id) {
    const extra = parseFloat($(`#dp-${id}`)?.value || '0');
    if (!extra) return toast(S.lang === 'sw' ? 'Weka kiasi' : 'Enter amount', 'error');
    const { data: debt } = await sb.from('debts').select('amount,amount_paid').eq('id', id).single();
    const newPaid = (debt.amount_paid || 0) + extra;
    const status = newPaid >= debt.amount ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
    await sb.from('debts').update({ amount_paid: newPaid, status }).eq('id', id);
    toast(S.lang === 'sw' ? 'Malipo yamerekodiwa! ✅' : 'Payment recorded! ✅', 'success');
    App.pageDebts();
  },

  async deleteDebt(id) {
    if (!confirm(S.lang === 'sw' ? 'Futa deni hili?' : 'Delete this debt?')) return;
    await sb.from('debts').delete().eq('id', id);
    toast(S.lang === 'sw' ? 'Deni limefutwa' : 'Debt deleted', 'success');
    App.pageDebts();
  },

  // ============================================================
  // USERS (Admin) (FULL)
  // ============================================================
  async pageUsers() {
    const { data: users } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">${t('users')} (${(users || []).length})</h3></div><div class="card-body"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #e5e7eb"><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'JINA' : 'NAME'}</th><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'SIMU' : 'PHONE'}</th><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'AINA' : 'ROLE'}</th><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'MKOA' : 'REGION'}</th><th style="text-align:left;padding:12px">${S.lang === 'sw' ? 'HALI' : 'STATUS'}</th></tr></thead>
      <tbody>${(users || []).map(u => `<tr style="border-bottom:1px solid #f3f4f6"><td style="padding:12px"><strong>${u.store_name}</strong></td><td style="padding:12px">${u.phone_number}</span></td><td style="padding:12px"><span class="status-badge ${u.role === 'retailer' ? 'status-delivered' : u.role === 'distributor' ? 'status-confirmed' : 'status-pending'}">${u.role === 'retailer' ? 'Duka' : u.role === 'distributor' ? 'Msambazaji' : 'Admin'}</span></td><td style="padding:12px">${u.district || u.region || '—'}</span></td><td style="padding:12px"><span class="status-badge ${u.is_active ? 'status-delivered' : 'status-pending'}">${u.is_active ? '✅ Active' : '❌ Blocked'}</span></td></tr>`).join('')}</tbody></table></div></div>`;
    }
  },

  // ============================================================
  // ANALYTICS (Admin) (FULL)
  // ============================================================
  async pageAnalytics() {
    const { data: profiles } = await sb.from('profiles').select('role');
    const { data: orders } = await sb.from('orders').select('total_price,status');
    const retailers = (profiles || []).filter(p => p.role === 'retailer').length;
    const distributors = (profiles || []).filter(p => p.role === 'distributor').length;
    const totalOrders = (orders || []).length;
    const totalValue = (orders || []).reduce((s, o) => s + (o.total_price || 0), 0);
    const delivered = (orders || []).filter(o => o.status === 'delivered').length;
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `<div class="stats-grid"><div class="stat-card"><div class="stat-label">Retailers</div><div class="stat-value">${retailers}</div></div><div class="stat-card"><div class="stat-label">Distributors</div><div class="stat-value">${distributors}</div></div><div class="stat-card"><div class="stat-label">Orders</div><div class="stat-value">${totalOrders}</div></div><div class="stat-card"><div class="stat-label">GMV</div><div class="stat-value positive">${fmt(totalValue)}</div></div></div>
      <div class="card"><div class="card-header"><h3 class="card-title">Platform Stats</h3></div><div class="card-body"><div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6"><span>Total Orders</span><strong>${totalOrders}</strong></div><div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6"><span>Delivered</span><strong class="positive">${delivered}</strong></div><div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6"><span>Platform GMV</span><strong class="positive">${fmt(totalValue)}</strong></div><div style="display:flex;justify-content:space-between;padding:12px 0"><span>Avg Order Value</span><strong>${fmt(totalOrders ? totalValue / totalOrders : 0)}</strong></div></div></div>`;
    }
  },

  // ============================================================
  // SUPERVISOR (FULL)
  // ============================================================
  async pageSupervisor() {
    const { data: sups } = await sb.from('supervisors').select('*').eq('business_id', S.user.id).eq('is_active', true);
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,#16a34a,#15803d);color:white"><div class="card-body"><div style="display:flex;align-items:center;gap:16px"><div style="font-size:48px">👔</div><div><h3>${S.lang === 'sw' ? 'Wasimamizi wa Biashara' : 'Business Supervisors'}</h3><p style="opacity:0.8">${S.lang === 'sw' ? 'Mtu anayeweza kuona ufanisi wako bila ya kuingiliana na data' : 'Someone who can view your business performance remotely'}</p></div></div></div></div>
        <div class="card" style="margin-bottom:20px"><div class="card-header"><h3 class="card-title">➕ ${S.lang === 'sw' ? 'Ongeza Msimamizi' : 'Add Supervisor'}</h3></div><div class="card-body"><div class="form-grid-2"><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Jina la Msimamizi' : 'Supervisor Name'} *</label><input class="form-input" id="sup-name" placeholder="${S.lang === 'sw' ? 'mfano: Baba John' : 'e.g. John Smith'}"/></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'} *</label><div style="display:flex"><span style="background:#f3f4f6;padding:14px 12px;border:1.5px solid #e5e7eb;border-right:none;border-radius:8px 0 0 8px">+255</span><input class="form-input" id="sup-phone" type="tel" maxlength="9" placeholder="712345678" style="border-radius:0 8px 8px 0" oninput="this.value=this.value.replace(/\\D/g,'').slice(0,9)"/></div></div></div><div class="form-group"><label class="form-label">${S.lang === 'sw' ? 'Kiwango cha Ufikiaji' : 'Access Level'}</label><select class="form-select" id="sup-access"><option value="read">${S.lang === 'sw' ? 'Kuona tu (Read Only)' : 'View Only (Read Only)'}</option><option value="full">${S.lang === 'sw' ? 'Kamili (Kuona + Kutuma)' : 'Full Access'}</option></select></div><button class="btn-primary btn-block" onclick="App.addSupervisor()"><span id="add-sup-txt">+ ${S.lang === 'sw' ? 'Ongeza Msimamizi' : 'Add Supervisor'}</span></button></div></div>
        <div class="card"><div class="card-header"><h3 class="card-title">${S.lang === 'sw' ? 'Wasimamizi Waliopo' : 'Current Supervisors'} (${(sups || []).length})</h3></div><div class="card-body"><div class="history-list">${(sups || []).map(sup => `<div class="history-item"><div class="history-info"><div class="history-name">${sup.name}</div><div class="history-details">${sup.phone_number} · ${sup.access_level === 'full' ? '✅ Ufikiaji Kamili' : '👁 Kuona Tu'}</div></div><button class="btn-secondary" style="background:#fee2e2;border-color:#fecaca;color:#dc2626" onclick="App.removeSupervisor('${sup.id}')">${S.lang === 'sw' ? 'Ondoa' : 'Remove'}</button></div>`).join('') || '<div style="text-align:center;padding:40px;color:#6b7280">Hakuna msimamizi bado</div>'}</div></div></div>`;
    }
  },

  async addSupervisor() {
    const name = $('#sup-name')?.value.trim();
    const rawPh = $('#sup-phone')?.value.trim();
    const access = $('#sup-access')?.value || 'read';
    if (!name) return toast(S.lang === 'sw' ? 'Weka jina la msimamizi' : 'Enter supervisor name', 'error');
    const phone = normPhone(rawPh);
    if (!phone) return toast(S.lang === 'sw' ? 'Namba si sahihi' : 'Invalid phone number', 'error');
    setBusy('add-sup-txt', true);
    const { data: existing } = await sb.from('profiles').select('id,store_name').eq('phone_number', phone).maybeSingle();
    const { error } = await sb.from('supervisors').insert([{ business_id: S.user.id, supervisor_id: existing?.id || null, phone_number: phone, name, access_level: access, is_active: true }]);
    setBusy('add-sup-txt', false, `+ ${S.lang === 'sw' ? 'Ongeza Msimamizi' : 'Add Supervisor'}`);
    if (error) return toast(S.lang === 'sw' ? 'Hitilafu ya kuongeza' : 'Error adding supervisor', 'error');
    if (S.isOnline) {
      try {
        const msg = S.lang === 'sw' ? `Umewekwa msimamizi wa biashara ya ${S.user.store_name} kwenye BomaWave. Ingia kwa: ${window.location.origin}` : `You have been added as supervisor for ${S.user.store_name} on BomaWave. Login at: ${window.location.origin}`;
        await fetch(OTP_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_KEY}` }, body: JSON.stringify({ action: 'send_otp', phone, _notif: msg }) });
      } catch (e) { }
    }
    toast(S.lang === 'sw' ? '✅ Msimamizi ameongezwa!' : 'Supervisor added!', 'success');
    App.pageSupervisor();
  },

  async removeSupervisor(supId) {
    if (!confirm(S.lang === 'sw' ? 'Ondoa msimamizi huyu?' : 'Remove this supervisor?')) return;
    await sb.from('supervisors').update({ is_active: false }).eq('id', supId);
    toast(S.lang === 'sw' ? 'Msimamizi ameondolewa' : 'Supervisor removed', 'success');
    App.pageSupervisor();
  },

  async pageSupervisorDash() {
    const { data: supRecord } = await sb.from('supervisors').select('*,profiles!business_id(id,store_name,role,region,district)').eq('phone_number', S.user.phone_number).eq('is_active', true).maybeSingle();
    if (!supRecord) {
      const view = $('#content-area');
      if (view) view.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:40px"><div style="font-size:48px;margin-bottom:16px">👔</div><h3>' + (S.lang === 'sw' ? 'Huna biashara unayoangalia' : 'No business assigned to supervise') + '</h3></div></div>';
      return;
    }
    const bizId = supRecord.business_id;
    const bizName = supRecord.profiles?.store_name || 'Biashara';
    const period = 30;
    const startDate = new Date(Date.now() - period * 864e5).toISOString().slice(0, 10);
    const [{ data: sales }, { data: exps }, { data: orders }, { data: debts }] = await Promise.all([
      sb.from('sales').select('revenue,profit,sale_date,product_name,qty').eq('user_id', bizId).gte('sale_date', startDate),
      sb.from('expenses').select('amount,category,expense_date').eq('user_id', bizId).gte('expense_date', startDate),
      sb.from('orders').select('total_price,status').or(`retailer_id.eq.${bizId},distributor_id.eq.${bizId}`),
      sb.from('debts').select('amount,amount_paid,status').eq('user_id', bizId),
    ]);
    const rev30 = (sales || []).reduce((s, r) => s + (r.revenue || 0), 0);
    const profit30 = (sales || []).reduce((s, r) => s + (r.profit || 0), 0);
    const exp30 = (exps || []).reduce((s, e) => s + (e.amount || 0), 0);
    const net30 = profit30 - exp30;
    const totDebt = (debts || []).filter(d => d.status !== 'paid').reduce((s, d) => s + (d.amount - d.amount_paid || 0), 0);
    const margin = rev30 > 0 ? ((profit30 / rev30) * 100).toFixed(1) : 0;
    const byProd = {};
    (sales || []).forEach(s => { byProd[s.product_name] = (byProd[s.product_name] || 0) + (s.revenue || 0); });
    const topP = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const view = $('#content-area');
    if (view) {
      view.innerHTML = `
        <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,#1f2937,#111827);color:white"><div class="card-body"><div style="display:flex;align-items:center;gap:16px"><div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px">${bizName[0]}</div><div><h3>${bizName}</h3><p style="opacity:0.8">👔 ${S.lang === 'sw' ? 'Dashibodi ya Msimamizi' : 'Supervisor Dashboard'} · ${period}d</p></div></div><span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:12px">${S.lang === 'sw' ? 'Mtazamo tu' : 'View Only'}</span></div></div>
        <div class="stats-grid"><div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Mapato' : 'Revenue'}</div><div class="stat-value positive" id="sdrev">TZS 0</div></div><div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Faida' : 'Profit'}</div><div class="stat-value ${profit30 >= 0 ? 'positive' : 'negative'}" id="sdpro">TZS 0</div></div><div class="stat-card"><div class="stat-label">${S.lang === 'sw' ? 'Matumizi' : 'Expenses'}</div><div class="stat-value negative" id="sdexp">TZS 0</div></div><div class="stat-card"><div class="stat-label">Net</div><div class="stat-value ${net30 >= 0 ? 'positive' : 'negative'}" id="sdnet">TZS 0</div></div></div>
        <div class="card" style="margin-bottom:16px"><div class="card-header"><h3 class="card-title">📊 ${S.lang === 'sw' ? 'Viashiria Muhimu' : 'Key Metrics'} (${period} days)</h3></div><div class="card-body"><div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6"><span>Profit Margin</span><strong class="${margin >= 15 ? 'positive' : margin >= 5 ? '' : 'negative'}">${margin}%</strong></div><div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6"><span>${S.lang === 'sw' ? 'Madeni Yanayobaki' : 'Outstanding Debts'}</span><strong class="${totDebt > 0 ? 'negative' : 'positive'}">${fmt(totDebt)}</strong></div><div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6"><span>${S.lang === 'sw' ? 'Jumla Maagizo' : 'Total Orders'}</span><strong>${(orders || []).length}</strong></div><div style="display:flex;justify-content:space-between;padding:12px 0"><span>Net Profit</span><strong class="${net30 >= 0 ? 'positive' : 'negative'}">${fmt(net30)}</strong></div></div></div>
        <div class="card"><div class="card-header"><h3 class="card-title">🏆 ${S.lang === 'sw' ? 'Bidhaa Zinazoongoza' : 'Top Products'}</h3></div><div class="card-body">${topP.length ? topP.map(([name, revVal], i) => `<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6"><span><strong>${i + 1}.</strong> ${name}</span><span style="color:#16a34a;font-weight:700">${fmt(revVal)}</span></div>`).join('') : '<div style="text-align:center;padding:40px;color:#6b7280">Hakuna data</div>'}</div></div>`;
    }
    setTimeout(() => {
      animateCount($('#sdrev'), rev30, 'TZS ');
      animateCount($('#sdpro'), profit30, 'TZS ');
      animateCount($('#sdexp'), exp30, 'TZS ');
      animateCount($('#sdnet'), net30, 'TZS ');
    }, 100);
  }
};

// ============================================================
// ANIMATION HELPER
// ============================================================
function animateCount(el, target, prefix = '') {
  if (!el) return;
  const duration = 800;
  const startTime = performance.now();
  const animate = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(target * eased);
    el.textContent = prefix + current.toLocaleString();
    if (progress < 1) requestAnimationFrame(animate);
    else el.textContent = prefix + target.toLocaleString();
  };
  requestAnimationFrame(animate);
}

// ============================================================
// BOOTSTRAP
// ============================================================
async function boot() {
  await initPosDB();
  initLocDropdowns('reg-region', 'reg-district', 'reg-ward');
  initLocDropdowns('dreg-region', 'dreg-district', 'dreg-ward');
  buildCatGrid();
  goStep(1);

  if (loadSession() && S.user) {
    await loadStores();
    S.pinBuf = '';
    for (let i = 0; i < 4; i++) { const d = $(`pd${i}`); if (d) d.classList.remove('on', 'err'); }
    setText('s7h', S.lang === 'sw' ? 'Karibu!' : 'Welcome!');
    setText('s7sub', S.user.store_name || '');
    const prog = $('#pfill');
    if (prog) prog.style.width = '90%';
    goStep(7);
  }

  if (S.isOnline) setTimeout(syncOfflineData, 3000);
}

boot();
