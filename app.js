/**
 * BomaWave — Polished MVP Controller
 * Fixed: Registration, Login, Realtime, Stock Edit, Lang Switch
 * Bilingual SW/EN | Supabase Realtime
 */

import { supabase } from './supabase.js';

// ═══════════════════════════════════════════
//  TRANSLATIONS
// ═══════════════════════════════════════════

const T = {
  sw: {
    step1_label:'Hatua 2', step1_title:'Wewe ni nani?',
    role_retailer:'Duka (Retailer)', role_retailer_desc:'Naagiza bidhaa kwa duka langu',
    role_dist:'Msambazaji', role_dist_desc:'Nasambaza bidhaa kwa maduka',
    back:'← Rudi Nyuma', tab_register:'Akaunti Mpya', tab_login:'Ingia',
    step3_label:'Hatua 3', step3_title:'Tengeneza Akaunti',
    lbl_store:'Jina la Duka', lbl_user:'Username', lbl_phone:'Simu',
    lbl_loc:'Eneo', lbl_coverage:'Maeneo ya Usambazaji',
    lbl_cats:'Aina za Bidhaa', lbl_pass:'Nywila', lbl_pass2:'Thibitisha Nywila',
    btn_register:'Kamilisha', btn_loading:'Subiri...',
    step4_label:'Ingia', step4_title:'Karibu Tena!',
    lbl_login_user:'Username', lbl_login_pass:'Nywila', btn_login:'Ingia',
    lbl_logout:'Toka',
    nav_marketplace:'Soko la Bidhaa', nav_my_orders:'Maagizo Yangu',
    nav_dashboard:'Dashibodi', nav_orders:'Maagizo Yaliyoingia',
    nav_products:'Bidhaa Zangu', nav_inventory:'Hifadhi (Stoki)',
    nav_retailers:'Maduka Yangu',
    topbar_marketplace:'Soko la Bidhaa', topbar_sub_market:'Agiza bidhaa kutoka kwa wasambazaji',
    topbar_my_orders:'Maagizo Yangu', topbar_sub_orders:'Historia ya maagizo yako',
    topbar_dashboard:'Dashibodi', topbar_sub_dash:'Muhtasari wa biashara yako leo',
    topbar_orders:'Maagizo Yaliyoingia', topbar_sub_inord:'Maagizo mapya kutoka kwa maduka',
    topbar_products:'Bidhaa Zangu', topbar_sub_prod:'Simamia bidhaa unazouza',
    topbar_inventory:'Hifadhi (Stoki)', topbar_sub_inv:'Angalia stoki iliyobaki',
    topbar_retailers:'Maduka Yangu', topbar_sub_ret:'Maduka yanayonunua kwako',
    notif_title:'Arifa', notif_empty:'Hakuna arifa',
    notif_new_order:'Agizo Jipya!', notif_order_conf:'Agizo Limethibitishwa',
    notif_order_del:'Bidhaa Zimefikia',
    stat_orders_today:'Maagizo Leo', stat_pending:'Yanasubiri',
    stat_revenue:'Mapato Leo', stat_retailers:'Maduka Yaliyonunua',
    stat_total_orders:'Maagizo Yote', stat_total_spent:'Jumla Niliyotumia',
    stat_active_dist:'Wasambazaji', stat_pending_orders:'Yanasubiri',
    all_categories:'Zote', add_to_cart:'Ongeza',
    out_of_stock:'Haipatikani', low_stock:'Inakwisha', in_stock:'Inapatikana',
    unit:'Kitengo', price:'Bei', search_products:'Tafuta bidhaa...',
    cart_title:'Agizo Lako', cart_sub:'bidhaa zimeongezwa',
    cart_total:'Jumla', place_order:'Tuma Agizo', cart_loading:'Inatuma...',
    cart_empty:'Bado hujachagua bidhaa',
    cart_payment:'💡 Malipo yanafanywa moja kwa moja na Msambazaji baada ya kuthibitishwa.',
    order_id:'Namba ya Agizo', retailer:'Duka', distributor:'Msambazaji',
    items:'Bidhaa', total:'Jumla', status:'Hali', date:'Tarehe', action:'Hatua',
    confirm:'Thibitisha', deliver:'Tuma Bidhaa', cancel:'Ghairi',
    pending:'Inasubiri', confirmed:'Imethibitishwa', delivered:'Imefikia', cancelled:'Imeghairiwa',
    no_orders:'Hakuna maagizo bado', no_orders_sub:'Maagizo mapya yataonekana hapa',
    add_product:'Weka Bidhaa Sokoni', product_name:'Jina la Bidhaa',
    product_category:'Aina', product_price:'Bei (TZS)',
    product_unit:'Kitengo', product_qty:'Stoki',
    product_desc:'Maelezo (si lazima)', btn_add_product:'Weka Sokoni',
    no_products:'Bado hujaweka bidhaa', no_products_sub:'Anza kuweka bidhaa kwa kubonyeza kitufe hapo juu',
    success_title:'Agizo Limetumwa!',
    success_sub:'Msambazaji ataliangalia hivi karibuni na akuthibitishie.',
    success_new:'Agizo Jipya',
    err_pass_match:'❌ Nywila hazifanani.', err_username:'❌ Username tayari lipo.',
    err_login:'❌ Username au nywila si sahihi.', err_generic:'❌ Kosa limetokea. Jaribu tena.',
    err_no_products:'⚠️ Hakuna bidhaa za kuagiza bado.', err_cart_empty:'⚠️ Chagua bidhaa kwanza.',
    toast_order_placed:'✅ Agizo limetumwa!', toast_order_confirmed:'✅ Agizo limethibitishwa.',
    toast_order_delivered:'📦 Bidhaa zimetumwa.', toast_product_added:'✅ Bidhaa imewekwa sokoni.',
    toast_new_order:'🔔 Agizo jipya limeingia!', toast_stock_updated:'✅ Stoki imesasishwa.',
    total_orders:'Maagizo', total_spent:'Jumla (TZS)', last_order:'Agizo la Mwisho',
    no_retailers:'Hakuna maduka bado', no_retailers_sub:'Maduka yanayonunua kwako yataonekana hapa',
    cat_beverages:'🥤 Vinywaji', cat_flour:'🌾 Unga na Nafaka',
    cat_oil:'🫙 Mafuta', cat_sugar:'🍬 Sukari na Chumvi',
    cat_soap:'🧼 Sabuni', cat_personal:'🧴 Usafi wa Mwili',
    cat_dairy:'🧈 Maziwa', cat_other:'📦 Nyingine',
    update_stock:'Sasisha Stoki', stock_qty:'Stoki Iliyobaki',
    view_all:'Angalia Zote →', go_market:'Nenda Sokoni',
  },

  en: {
    step1_label:'Step 2', step1_title:'Who are you?',
    role_retailer:'Shop (Retailer)', role_retailer_desc:'I order goods for my shop',
    role_dist:'Distributor', role_dist_desc:'I supply goods to shops',
    back:'← Go Back', tab_register:'New Account', tab_login:'Sign In',
    step3_label:'Step 3', step3_title:'Create Account',
    lbl_store:'Store / Business Name', lbl_user:'Username', lbl_phone:'Phone',
    lbl_loc:'Location', lbl_coverage:'Coverage Area',
    lbl_cats:'Product Categories', lbl_pass:'Password', lbl_pass2:'Confirm Password',
    btn_register:'Create Account', btn_loading:'Please wait...',
    step4_label:'Sign In', step4_title:'Welcome Back!',
    lbl_login_user:'Username', lbl_login_pass:'Password', btn_login:'Sign In',
    lbl_logout:'Sign Out',
    nav_marketplace:'Marketplace', nav_my_orders:'My Orders',
    nav_dashboard:'Dashboard', nav_orders:'Incoming Orders',
    nav_products:'My Products', nav_inventory:'Inventory',
    nav_retailers:'My Retailers',
    topbar_marketplace:'Marketplace', topbar_sub_market:'Order goods from distributors',
    topbar_my_orders:'My Orders', topbar_sub_orders:'Your order history',
    topbar_dashboard:'Dashboard', topbar_sub_dash:"Today's business overview",
    topbar_orders:'Incoming Orders', topbar_sub_inord:'New orders from shops',
    topbar_products:'My Products', topbar_sub_prod:'Manage your listed products',
    topbar_inventory:'Inventory', topbar_sub_inv:'Track remaining stock',
    topbar_retailers:'My Retailers', topbar_sub_ret:'Shops that buy from you',
    notif_title:'Notifications', notif_empty:'No notifications',
    notif_new_order:'New Order!', notif_order_conf:'Order Confirmed',
    notif_order_del:'Order Delivered',
    stat_orders_today:'Orders Today', stat_pending:'Pending',
    stat_revenue:"Today's Revenue", stat_retailers:'Active Retailers',
    stat_total_orders:'Total Orders', stat_total_spent:'Total Spent',
    stat_active_dist:'Distributors', stat_pending_orders:'Pending',
    all_categories:'All', add_to_cart:'Add',
    out_of_stock:'Out of Stock', low_stock:'Low Stock', in_stock:'In Stock',
    unit:'Unit', price:'Price', search_products:'Search products...',
    cart_title:'Your Order', cart_sub:'items added',
    cart_total:'Total', place_order:'Place Order', cart_loading:'Sending...',
    cart_empty:'No items selected yet',
    cart_payment:'💡 Payment is made directly to the distributor after confirmation.',
    order_id:'Order ID', retailer:'Shop', distributor:'Distributor',
    items:'Items', total:'Total', status:'Status', date:'Date', action:'Action',
    confirm:'Confirm', deliver:'Mark Delivered', cancel:'Cancel',
    pending:'Pending', confirmed:'Confirmed', delivered:'Delivered', cancelled:'Cancelled',
    no_orders:'No orders yet', no_orders_sub:'New orders will appear here',
    add_product:'List a Product', product_name:'Product Name',
    product_category:'Category', product_price:'Price (TZS)',
    product_unit:'Selling Unit', product_qty:'Stock Quantity',
    product_desc:'Description (optional)', btn_add_product:'List Product',
    no_products:'No products listed yet', no_products_sub:'Add your first product using the form above',
    success_title:'Order Placed!',
    success_sub:'The distributor will review and confirm your order shortly.',
    success_new:'New Order',
    err_pass_match:'❌ Passwords do not match.', err_username:'❌ Username already taken.',
    err_login:'❌ Incorrect username or password.', err_generic:'❌ Something went wrong. Try again.',
    err_no_products:'⚠️ No products available yet.', err_cart_empty:'⚠️ Select at least one product.',
    toast_order_placed:'✅ Order placed!', toast_order_confirmed:'✅ Order confirmed.',
    toast_order_delivered:'📦 Order delivered.', toast_product_added:'✅ Product listed.',
    toast_new_order:'🔔 New order received!', toast_stock_updated:'✅ Stock updated.',
    total_orders:'Orders', total_spent:'Total (TZS)', last_order:'Last Order',
    no_retailers:'No retailers yet', no_retailers_sub:'Shops that order from you will appear here',
    cat_beverages:'🥤 Beverages', cat_flour:'🌾 Flour & Grains',
    cat_oil:'🫙 Cooking Oil', cat_sugar:'🍬 Sugar & Salt',
    cat_soap:'🧼 Soap & Detergents', cat_personal:'🧴 Personal Care',
    cat_dairy:'🧈 Dairy', cat_other:'📦 Other',
    update_stock:'Update Stock', stock_qty:'Stock Remaining',
    view_all:'View All →', go_market:'Go to Marketplace',
  }
};

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════

const State = {
  lang: 'sw',
  role: '',
  authMode: 'register',
  user: null,
  cart: {},
  activePage: '',
  realtimeSub: null,
  notifications: [],
  notifOpen: false,
};

// ═══════════════════════════════════════════
//  CATEGORIES
// ═══════════════════════════════════════════

const CATEGORIES = [
  { key:'beverages', icon:'🥤' }, { key:'flour', icon:'🌾' },
  { key:'oil', icon:'🫙' }, { key:'sugar', icon:'🍬' },
  { key:'soap', icon:'🧼' }, { key:'personal', icon:'🧴' },
  { key:'dairy', icon:'🧈' }, { key:'other', icon:'📦' },
];

// ═══════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════

const t  = (k) => T[State.lang][k] || T.sw[k] || k;
const el = (id) => document.getElementById(id);
const fmt = (n) => `TZS ${Number(n).toLocaleString('en-TZ')}`;

function setHtml(id, html)   { const e = el(id); if (e) e.innerHTML = html; }
function setText(id, text)   { const e = el(id); if (e) e.innerText = text; }
function show(id) { const e = el(id); if (e) e.style.display = ''; }
function hide(id) { const e = el(id); if (e) e.style.display = 'none'; }

function catLabel(k) { return T[State.lang][`cat_${k}`] || T.sw[`cat_${k}`] || k; }
function catIcon(k)  { return CATEGORIES.find(x => x.key === k)?.icon || '📦'; }

function showToast(msg, type = 'success') {
  const wrap = el('toast-container');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.textContent = msg;
  wrap.appendChild(div);
  setTimeout(() => div.remove(), 4500);
}

function setLoading(btnId, spanId, loading) {
  const btn = el(btnId); const span = el(spanId);
  if (!btn || !span) return;
  btn.disabled = loading;
  span.innerHTML = loading ? '<span class="spinner"></span>' : span.dataset.label || span.innerText;
}

function genRef() { return 'BW-' + Date.now().toString(36).toUpperCase().slice(-6); }

function loader() {
  return `<div style="text-align:center;padding:3.5rem;color:var(--muted)"><span class="spinner dark" style="width:26px;height:26px"></span></div>`;
}

// ═══════════════════════════════════════════
//  APP OBJECT
// ═══════════════════════════════════════════

export const App = {

  // ── LANGUAGE ────────────────────────────

  setLang(lang) {
    State.lang = lang;
    this.applyTranslations();
    this.goStep(2);
  },

  switchLang(lang) {
    State.lang = lang;
    // Update sidebar buttons
    el('sb-lang-sw')?.classList.toggle('active', lang === 'sw');
    el('sb-lang-en')?.classList.toggle('active', lang === 'en');
    // Re-render current page
    if (State.activePage) this.navigate(State.activePage);
  },

  applyTranslations() {
    const L = State.lang;
    const placeholders = {
      'reg-name':  L === 'sw' ? 'mfano: Mama Fatuma Duka' : 'e.g. Grace Mini Market',
      'reg-user':  L === 'sw' ? 'jina lako la kipekee' : 'your unique username',
      'reg-phone': '+255 7XX XXX XXX',
      'reg-loc':   L === 'sw' ? 'mfano: Kariakoo, DSM' : 'e.g. Kariakoo, DSM',
      'reg-pass':  L === 'sw' ? 'angalau herufi 6' : 'at least 6 characters',
      'reg-pass2': L === 'sw' ? 'rudia nywila' : 'repeat password',
      'login-user':L === 'sw' ? 'jina la mtumiaji' : 'your username',
      'login-pass':L === 'sw' ? 'nywila yako' : 'your password',
    };
    Object.entries(placeholders).forEach(([id, ph]) => {
      const e = el(id); if (e) e.placeholder = ph;
    });

    const textMap = {
      's2-label': 'step1_label', 's2-title': 'step1_title',
      'role-retailer-name': 'role_retailer', 'role-retailer-desc': 'role_retailer_desc',
      'role-dist-name': 'role_dist', 'role-dist-desc': 'role_dist_desc',
      's2-back': 'back', 'tab-register': 'tab_register', 'tab-login': 'tab_login',
      's3-label': 'step3_label', 's3-title': 'step3_title',
      'lbl-store': 'lbl_store', 'lbl-user': 'lbl_user', 'lbl-phone': 'lbl_phone',
      'lbl-loc': 'lbl_loc', 'lbl-coverage': 'lbl_coverage', 'lbl-cats': 'lbl_cats',
      'lbl-pass': 'lbl_pass', 'lbl-pass2': 'lbl_pass2',
      's4-label': 'step4_label', 's4-title': 'step4_title',
      'lbl-login-user': 'lbl_login_user', 'lbl-login-pass': 'lbl_login_pass',
      'lbl-logout': 'lbl_logout', 'notif-header': 'notif_title',
      'notif-empty-msg': 'notif_empty',
      'cart-title': 'cart_title', 'cart-total-lbl': 'cart_total',
      'cart-payment-note': 'cart_payment', 'cart-empty-msg': 'cart_empty',
    };
    Object.entries(textMap).forEach(([id, key]) => setText(id, t(key)));
    el('reg-submit-text') && (el('reg-submit-text').innerText = t('btn_register'));
    el('login-submit-text') && (el('login-submit-text').innerText = t('btn_login'));
    el('place-order-text') && (el('place-order-text').innerText = t('place_order'));

    this.buildCatGrid();
  },

  buildCatGrid() {
    const grid = el('cat-grid');
    if (!grid) return;
    grid.innerHTML = CATEGORIES.map(c => `
      <label class="cat-check" id="cat-label-${c.key}" for="cat-cb-${c.key}">
        <input type="checkbox" id="cat-cb-${c.key}" value="${c.key}"
          onchange="App.onCatChange('${c.key}')" style="display:none" />
        <span class="cat-icon">${c.icon}</span>
        <span>${catLabel(c.key).replace(/^[^ ]+ /, '')}</span>
      </label>
    `).join('');
  },

  onCatChange(key) {
    const inp = el(`cat-cb-${key}`);
    const lbl = el(`cat-label-${key}`);
    if (!inp || !lbl) return;
    lbl.classList.toggle('checked', inp.checked);
  },

  getSelectedCats() {
    return CATEGORIES.filter(c => {
      const inp = el(`cat-cb-${c.key}`);
      return inp && inp.checked;
    }).map(c => c.key);
  },

  // ── STEP NAV ────────────────────────────

  goStep(n) {
    for (let i = 1; i <= 4; i++) el(`step-${i}`)?.classList.remove('active');
    el(`step-${n}`)?.classList.add('active');
    const pct = { 1: 25, 2: 50, 3: 85, 4: 70 }[n] || 25;
    const pf = el('progress-fill');
    if (pf) pf.style.width = pct + '%';
  },

  pickRole(role) {
    State.role = role;
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
    const selectedCard = el(`role-btn-${role}`);
    if (selectedCard) selectedCard.classList.add('selected');
    ['retailer', 'distributor'].forEach(r => {
      const check = el(`check-${r}`);
      const arrow = el(`arrow-${r}`);
      if (check) check.style.display = r === role ? 'inline' : 'none';
      if (arrow) arrow.style.display = r === role ? 'none' : 'inline';
    });
    const nextBtn = el('role-next-btn');
    if (nextBtn) nextBtn.style.display = '';
    const nextText = el('role-next-text');
    if (nextText) nextText.innerText = State.lang === 'sw' ? 'Endelea →' : 'Continue →';
  },

  proceedFromRole() {
    if (!State.role) return;
    const distExtra = el('dist-extra');
    if (distExtra) distExtra.style.display = State.role === 'distributor' ? 'flex' : 'none';
    this.buildCatGrid();
    this.goStep(State.authMode === 'login' ? 4 : 3);
  },

  selectRole(role) { this.pickRole(role); },

  setAuthMode(mode) {
    State.authMode = mode;
    el('tab-register')?.classList.toggle('active', mode === 'register');
    el('tab-login')?.classList.toggle('active', mode === 'login');
  },

  // ── AUTH ────────────────────────────────

  async handleRegister(e) {
    e.preventDefault();

    const pass  = el('reg-pass').value;
    const pass2 = el('reg-pass2').value;
    const username = el('reg-user').value.trim().toLowerCase();

    if (pass !== pass2) { showToast(t('err_pass_match'), 'error'); return; }
    if (pass.length < 6) {
      showToast(State.lang === 'sw' ? '❌ Nywila lazima iwe herufi 6+' : '❌ Password must be 6+ characters', 'error');
      return;
    }

    if (!username) { showToast(State.lang === 'sw' ? '❌ Weka username' : '❌ Enter a username', 'error'); return; }

    const payload = {
      username,
      password:      pass,
      store_name:    el('reg-name').value.trim(),
      phone_number:  el('reg-phone').value.trim() || null,
      location:      el('reg-loc').value.trim(),
      role:          State.role,
      coverage_area: el('reg-coverage')?.value.trim() || null,
      lang:          State.lang,
      is_approved:   true,
    };

    const regBtn = el('reg-submit');
    const regSpan = el('reg-submit-text');
    if (regBtn) regBtn.disabled = true;
    if (regSpan) regSpan.innerHTML = '<span class="spinner"></span>';

    try {
      // Check if username already exists first
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        showToast(t('err_username'), 'error');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Register error:', error);
        if (error.code === '23505') showToast(t('err_username'), 'error');
        else showToast(`${t('err_generic')} (${error.message})`, 'error');
        return;
      }

      State.user = data;
      this._saveSession();
      this.launchApp();

    } catch (err) {
      console.error('Register catch:', err);
      showToast(t('err_generic'), 'error');
    } finally {
      if (regBtn) regBtn.disabled = false;
      if (regSpan) regSpan.innerText = t('btn_register');
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const username = el('login-user').value.trim().toLowerCase();
    const password = el('login-pass').value;

    if (!username || !password) {
      showToast(State.lang === 'sw' ? '❌ Jaza nafasi zote' : '❌ Fill in all fields', 'error');
      return;
    }

    const loginBtn = el('login-submit');
    const loginSpan = el('login-submit-text');
    if (loginBtn) loginBtn.disabled = true;
    if (loginSpan) loginSpan.innerHTML = '<span class="spinner"></span>';

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        console.error('Login error:', error);
        showToast(t('err_generic'), 'error');
        return;
      }

      if (!data) {
        showToast(t('err_login'), 'error');
        return;
      }

      State.user = data;
      State.lang = data.lang || State.lang;
      this._saveSession();
      this.launchApp();

    } catch (err) {
      console.error('Login catch:', err);
      showToast(t('err_generic'), 'error');
    } finally {
      if (loginBtn) loginBtn.disabled = false;
      if (loginSpan) loginSpan.innerText = t('btn_login');
    }
  },

  // ── SESSION PERSISTENCE ─────────────────

  _saveSession() {
    try {
      localStorage.setItem('bw_session', JSON.stringify({
        user: State.user,
        lang: State.lang,
      }));
    } catch(e) {}
  },

  _clearSession() {
    try { localStorage.removeItem('bw_session'); } catch(e) {}
  },

  _restoreSession() {
    try {
      const raw = localStorage.getItem('bw_session');
      if (!raw) return false;
      const { user, lang } = JSON.parse(raw);
      if (!user || !user.id) return false;
      State.user = user;
      State.lang = lang || 'sw';
      return true;
    } catch(e) {
      return false;
    }
  },

  logout() {
    if (State.realtimeSub) {
      supabase.removeChannel(State.realtimeSub);
      State.realtimeSub = null;
    }
    this._clearSession();
    State.user = null; State.cart = {};
    State.notifications = []; State.activePage = '';
    el('app-main').style.display = 'none';
    el('onboarding').style.display = 'flex';
    el('cart-fab').style.display = 'none';
    this.goStep(1);
  },

  // ── LAUNCH ──────────────────────────────

  launchApp() {
    el('onboarding').style.display = 'none';
    el('app-main').style.display = '';

    const u = State.user;
    setText('sb-name', u.store_name);
    el('sb-avatar').innerText = u.store_name.charAt(0).toUpperCase();

    const badge = el('sb-role-badge');
    if (badge) {
      badge.className = `role-badge badge-${u.role}`;
      badge.innerText = u.role === 'retailer'
        ? (State.lang === 'sw' ? 'Duka' : 'Retailer')
        : (State.lang === 'sw' ? 'Msambazaji' : 'Distributor');
    }

    // Sync lang buttons
    el('sb-lang-sw')?.classList.toggle('active', State.lang === 'sw');
    el('sb-lang-en')?.classList.toggle('active', State.lang === 'en');

    this.buildSidebar();
    this.setupRealtime();

    this.navigate(u.role === 'retailer' ? 'marketplace' : 'dashboard');
  },

  buildSidebar() {
    const u = State.user;
    const items = u.role === 'retailer'
      ? [
          { id: 'marketplace', icon: '🛍️', label: t('nav_marketplace') },
          { id: 'my_orders',   icon: '📦', label: t('nav_my_orders') },
        ]
      : [
          { id: 'dashboard', icon: '📊', label: t('nav_dashboard'), badge: true },
          { id: 'orders',    icon: '📋', label: t('nav_orders'),    badge: true },
          { id: 'products',  icon: '🏷️', label: t('nav_products') },
          { id: 'inventory', icon: '📦', label: t('nav_inventory') },
          { id: 'retailers', icon: '🏪', label: t('nav_retailers') },
        ];

    el('sidebar-nav').innerHTML = items.map(item => `
      <button class="nav-item" id="nav-${item.id}" onclick="App.navigate('${item.id}')">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
        ${item.badge ? `<span class="nav-badge" id="badge-${item.id}" style="display:none">0</span>` : ''}
      </button>
    `).join('');
  },

  navigate(page) {
    State.activePage = page;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    el(`nav-${page}`)?.classList.add('active');

    const pageMap = {
      marketplace: { title: 'topbar_marketplace', sub: 'topbar_sub_market', icon: '🛍️' },
      my_orders:   { title: 'topbar_my_orders',   sub: 'topbar_sub_orders', icon: '📦' },
      dashboard:   { title: 'topbar_dashboard',   sub: 'topbar_sub_dash',   icon: '📊' },
      orders:      { title: 'topbar_orders',       sub: 'topbar_sub_inord',  icon: '📋' },
      products:    { title: 'topbar_products',     sub: 'topbar_sub_prod',   icon: '🏷️' },
      inventory:   { title: 'topbar_inventory',    sub: 'topbar_sub_inv',    icon: '📦' },
      retailers:   { title: 'topbar_retailers',    sub: 'topbar_sub_ret',    icon: '🏪' },
    };

    const info = pageMap[page] || pageMap.dashboard;
    setText('topbar-title', t(info.title));
    setText('topbar-sub', t(info.sub));
    const iconEl = el('topbar-icon');
    if (iconEl) iconEl.innerText = info.icon;

    // Cart FAB
    const fab = el('cart-fab');
    if (fab) fab.style.display = page === 'marketplace' ? 'flex' : 'none';

    const renders = {
      marketplace: () => this.renderMarketplace(),
      my_orders:   () => this.renderMyOrders(),
      dashboard:   () => this.renderDashboard(),
      orders:      () => this.renderDistOrders(),
      products:    () => this.renderProducts(),
      inventory:   () => this.renderInventory(),
      retailers:   () => this.renderRetailers(),
    };

    renders[page]?.();
  },

  // ── REALTIME ────────────────────────────

  setupRealtime() {
    if (State.realtimeSub) supabase.removeChannel(State.realtimeSub);
    const u = State.user;

    const channel = supabase
      .channel(`bw-${u.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        if (u.role === 'distributor' && payload.new.distributor_id === u.id) {
          this.addNotif({ icon: '🛍️', title: t('notif_new_order'), text: payload.new.order_ref });
          showToast(t('toast_new_order'), 'info');
          if (['orders', 'dashboard'].includes(State.activePage)) this.navigate(State.activePage);
          this.updateOrderBadge();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        if (u.role === 'retailer' && payload.new.retailer_id === u.id) {
          const st = payload.new.status;
          if (st === 'confirmed') {
            showToast(t('toast_order_confirmed'), 'success');
            this.addNotif({ icon: '✅', title: t('notif_order_conf'), text: payload.new.order_ref });
          } else if (st === 'delivered') {
            showToast(t('toast_order_delivered'), 'success');
            this.addNotif({ icon: '📦', title: t('notif_order_del'), text: payload.new.order_ref });
          }
          if (State.activePage === 'my_orders') this.renderMyOrders();
        }
      })
      .subscribe();

    State.realtimeSub = channel;
  },

  addNotif(n) {
    const now = new Date().toLocaleTimeString(State.lang === 'sw' ? 'sw-TZ' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
    State.notifications.unshift({ ...n, time: now });
    const dot = el('notif-dot');
    if (dot) { dot.style.display = 'flex'; dot.innerText = Math.min(State.notifications.length, 99); }
    this.renderNotifList();
  },

  renderNotifList() {
    const list = el('notif-list');
    if (!list) return;
    if (!State.notifications.length) {
      list.innerHTML = `<div class="notif-empty">${t('notif_empty')}</div>`;
      return;
    }
    list.innerHTML = State.notifications.slice(0, 10).map((n, i) => `
      <div class="notif-item ${i === 0 ? 'unread' : ''}">
        <span class="notif-icon">${n.icon}</span>
        <div>
          <div class="notif-text">${n.title} — ${n.text}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>
    `).join('');
  },

  toggleNotif() {
    State.notifOpen = !State.notifOpen;
    el('notif-dropdown')?.classList.toggle('open', State.notifOpen);
    if (State.notifOpen) { const dot = el('notif-dot'); if (dot) dot.style.display = 'none'; }
  },

  clearNotifs() {
    State.notifications = [];
    this.renderNotifList();
    const dot = el('notif-dot');
    if (dot) dot.style.display = 'none';
  },

  async updateOrderBadge() {
    const { count } = await supabase
      .from('orders').select('*', { count: 'exact', head: true })
      .eq('distributor_id', State.user.id).eq('status', 'pending');

    const n = count || 0;
    ['badge-dashboard', 'badge-orders'].forEach(id => {
      const b = el(id);
      if (b) { b.innerText = n; b.style.display = n > 0 ? 'inline-flex' : 'none'; }
    });
  },

  // ── MARKETPLACE ─────────────────────────

  async renderMarketplace() {
    setHtml('app-view', `
      <div>
        <div style="display:flex;gap:0.75rem;align-items:center;margin-bottom:1rem;flex-wrap:wrap">
          <div class="search-wrap" style="flex:1;min-width:200px;max-width:320px">
            <span class="search-icon">🔍</span>
            <input class="form-input" id="market-search" placeholder="${t('search_products')}"
              oninput="App.filterProducts()" style="padding-left:2.2rem" />
          </div>
        </div>
        <div class="filter-pills" id="cat-filters"></div>
        <div class="product-grid" id="product-list">${loader()}</div>
      </div>
    `);

    const { data: products, error } = await supabase
      .from('products').select('*').gt('stock_qty', 0)
      .order('created_at', { ascending: false });

    if (error) { console.error(error); showToast(t('err_generic'), 'error'); return; }

    App._allProducts = products || [];
    App._activeFilter = 'all';

    const cats = [...new Set((products || []).map(p => p.category))].filter(Boolean);
    const filtersEl = el('cat-filters');
    if (filtersEl) {
      filtersEl.innerHTML = [
        `<button class="filter-pill active" id="pill-all" onclick="App.setFilter('all')">${t('all_categories')}</button>`,
        ...cats.map(c => `<button class="filter-pill" id="pill-${c}" onclick="App.setFilter('${c}')">${catLabel(c)}</button>`)
      ].join('');
    }

    this.renderProductCards(App._allProducts);
  },

  setFilter(cat) {
    App._activeFilter = cat;
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    el(`pill-${cat}`)?.classList.add('active');
    this.filterProducts();
  },

  filterProducts() {
    const search = el('market-search')?.value.toLowerCase() || '';
    const cat = App._activeFilter || 'all';
    let filtered = App._allProducts || [];
    if (cat !== 'all') filtered = filtered.filter(p => p.category === cat);
    if (search) filtered = filtered.filter(p => p.product_name.toLowerCase().includes(search));
    this.renderProductCards(filtered);
  },

  renderProductCards(products) {
    const list = el('product-list');
    if (!list) return;

    if (!products || !products.length) {
      list.innerHTML = `<div style="grid-column:1/-1" class="empty-state">
        <div class="empty-icon">🏪</div>
        <div class="empty-title">${t('err_no_products')}</div>
        <div class="empty-sub">${State.lang === 'sw' ? 'Wasambazaji bado hawajakuweka bidhaa' : 'Distributors have not listed products yet'}</div>
      </div>`;
      return;
    }

    list.innerHTML = products.map(p => {
      const qty = State.cart[p.id]?.qty || 0;
      const stockClass = p.stock_qty <= 0 ? 'stock-out' : p.stock_qty < 10 ? 'stock-low' : 'stock-ok';
      const stockText  = p.stock_qty <= 0 ? t('out_of_stock') : p.stock_qty < 10 ? t('low_stock') : t('in_stock');

      return `
        <div class="product-card ${qty > 0 ? 'in-cart' : ''}" id="pcard-${p.id}">
          <span class="stock-badge ${stockClass}">${stockText}</span>
          <span class="product-emoji">${catIcon(p.category)}</span>
          <div class="product-category">${catLabel(p.category)}</div>
          <div class="product-name">${p.product_name}</div>
          <div class="product-unit">${t('unit')}: ${p.selling_unit || '—'}</div>
          <div class="product-footer">
            <span class="product-price">${fmt(p.price)}</span>
            ${p.stock_qty <= 0
              ? `<span style="font-size:0.68rem;color:var(--red);font-weight:700">${t('out_of_stock')}</span>`
              : qty === 0
              ? `<button class="add-btn" onclick="App.addToCart(${JSON.stringify(p).replace(/"/g,"'")})" title="${t('add_to_cart')}">+</button>`
              : `<div class="qty-control">
                  <button class="qty-btn" onclick="App.changeQty('${p.id}',-1)">−</button>
                  <span class="qty-num">${qty}</span>
                  <button class="qty-btn" onclick="App.changeQty('${p.id}',1)">+</button>
                </div>`
            }
          </div>
        </div>`;
    }).join('');
  },

  // ── CART ────────────────────────────────

  addToCart(product) {
    const p = typeof product === 'string' ? JSON.parse(product) : product;
    if (!State.cart[p.id]) State.cart[p.id] = { product: p, qty: 0 };
    State.cart[p.id].qty++;
    this.updateCartUI();
    this.filterProducts();
  },

  changeQty(id, delta) {
    if (!State.cart[id]) return;
    State.cart[id].qty = Math.max(0, State.cart[id].qty + delta);
    if (State.cart[id].qty === 0) delete State.cart[id];
    this.updateCartUI();
    this.filterProducts();
  },

  updateCartUI() {
    const items = Object.values(State.cart);
    const count = items.reduce((s, x) => s + x.qty, 0);
    const total = items.reduce((s, x) => s + x.product.price * x.qty, 0);

    setText('cart-count', count);
    setText('cart-subtitle', `${count} ${t('cart_sub')}`);
    setText('cart-total', fmt(total));

    const list = el('cart-items-list');
    if (!list) return;

    if (!items.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-sub">${t('cart_empty')}</div></div>`;
      return;
    }

    list.innerHTML = items.map(({ product: p, qty }) => `
      <div class="cart-item">
        <span class="cart-item-emoji">${catIcon(p.category)}</span>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.product_name}</div>
          <div class="cart-item-price">${fmt(p.price)} × ${qty} = ${fmt(p.price * qty)}</div>
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="App.changeQty('${p.id}',-1)">−</button>
          <span class="qty-num">${qty}</span>
          <button class="qty-btn" onclick="App.changeQty('${p.id}',1)">+</button>
        </div>
      </div>
    `).join('');
  },

  toggleCart() {
    el('cart-panel')?.classList.toggle('open');
    this.updateCartUI();
  },

  async placeOrder() {
    const items = Object.values(State.cart);
    if (!items.length) { showToast(t('err_cart_empty'), 'error'); return; }

    const btn = el('place-order-btn');
    const span = el('place-order-text');
    if (btn) btn.disabled = true;
    if (span) span.innerHTML = '<span class="spinner"></span>';

    const byDist = {};
    items.forEach(({ product: p, qty }) => {
      if (!byDist[p.distributor_id]) byDist[p.distributor_id] = [];
      byDist[p.distributor_id].push({ product: p, qty });
    });

    let hasError = false;

    for (const [distId, distItems] of Object.entries(byDist)) {
      const total = distItems.reduce((s, x) => s + x.product.price * x.qty, 0);
      const ref = genRef();

      const { data: order, error: oErr } = await supabase
        .from('orders')
        .insert([{
          order_ref: ref, retailer_id: State.user.id,
          distributor_id: distId, total_price: total, status: 'pending',
          items_count: distItems.reduce((s, x) => s + x.qty, 0),
        }])
        .select().single();

      if (oErr) { console.error(oErr); hasError = true; continue; }

      await supabase.from('order_items').insert(
        distItems.map(({ product: p, qty }) => ({
          order_id: order.id, product_id: p.id, product_name: p.product_name,
          qty, unit_price: p.price, subtotal: p.price * qty,
        }))
      );

      for (const { product: p, qty } of distItems) {
        await supabase.from('products')
          .update({ stock_qty: Math.max(0, p.stock_qty - qty) })
          .eq('id', p.id);
      }
    }

    if (btn) btn.disabled = false;
    if (span) span.innerText = t('place_order');

    if (hasError) { showToast(t('err_generic'), 'error'); return; }

    State.cart = {};
    el('cart-panel')?.classList.remove('open');
    this.renderSuccessScreen();
    showToast(t('toast_order_placed'), 'success');
  },

  renderSuccessScreen() {
    const ref = genRef();
    setHtml('app-view', `
      <div class="success-screen">
        <div class="success-ring">✅</div>
        <div class="success-title">${t('success_title')}</div>
        <div class="success-sub">${t('success_sub')}</div>
        <div class="success-ref">${ref}</div>
        <button class="btn-primary" style="max-width:220px" onclick="App.navigate('my_orders')">
          ${State.lang === 'sw' ? 'Angalia Maagizo' : 'View My Orders'}
        </button>
        <button class="btn-ghost" style="margin-top:0.5rem" onclick="App.navigate('marketplace')">
          ${State.lang === 'sw' ? '← Rudi Sokoni' : '← Back to Marketplace'}
        </button>
      </div>
    `);
  },

  // ── MY ORDERS ───────────────────────────

  async renderMyOrders() {
    setHtml('app-view', loader());

    const { data, error } = await supabase
      .from('orders')
      .select('*, distributor:profiles!orders_distributor_id_fkey(store_name, phone_number, location)')
      .eq('retailer_id', State.user.id)
      .order('created_at', { ascending: false });

    if (error || !data || !data.length) {
      setHtml('app-view', `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <div class="empty-title">${t('no_orders')}</div>
          <div class="empty-sub">${t('no_orders_sub')}</div>
          <button class="btn-primary" style="max-width:200px;margin-top:1.5rem" onclick="App.navigate('marketplace')">
            ${t('go_market')}
          </button>
        </div>`);
      return;
    }

    const totalSpent = data.reduce((s, o) => s + Number(o.total_price), 0);
    const pending    = data.filter(o => o.status === 'pending').length;
    const delivered  = data.filter(o => o.status === 'delivered').length;

    setHtml('app-view', `
      <div class="stats-row" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card green">
          <div class="stat-icon">📦</div>
          <div class="stat-label">${t('stat_total_orders')}</div>
          <div class="stat-value">${data.length}</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon">⏳</div>
          <div class="stat-label">${t('stat_pending_orders')}</div>
          <div class="stat-value">${pending}</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">💰</div>
          <div class="stat-label">${t('stat_total_spent')}</div>
          <div class="stat-value" style="font-size:1.2rem">${fmt(totalSpent)}</div>
        </div>
      </div>
      <div class="card" style="margin-top:1rem">
        <table class="orders-table">
          <thead><tr>
            <th>${t('order_id')}</th>
            <th>${t('distributor')}</th>
            <th>${t('items')}</th>
            <th>${t('total')}</th>
            <th>${t('status')}</th>
            <th>${t('date')}</th>
          </tr></thead>
          <tbody>${data.map(o => `
            <tr>
              <td><span style="font-family:monospace;font-size:0.78rem;color:var(--muted)">${o.order_ref}</span></td>
              <td>
                <div style="font-weight:700;font-size:0.82rem">${o.distributor?.store_name || '—'}</div>
                ${o.distributor?.phone_number ? `<div style="font-size:0.72rem;color:var(--muted)">${o.distributor.phone_number}</div>` : ''}
              </td>
              <td style="font-weight:700">${o.items_count || '—'}</td>
              <td><strong style="color:var(--green-mid)">${fmt(o.total_price)}</strong></td>
              <td>${this.statusPill(o.status)}</td>
              <td style="color:var(--muted);font-size:0.78rem">${new Date(o.created_at).toLocaleDateString(State.lang === 'sw' ? 'sw-TZ' : 'en-GB')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `);
  },

  // ── DASHBOARD ───────────────────────────

  async renderDashboard() {
    setHtml('app-view', loader());

    const today = new Date(); today.setHours(0,0,0,0);

    const [{ data: orders }, { data: products }, { data: allOrders }] = await Promise.all([
      supabase.from('orders').select('*').eq('distributor_id', State.user.id).gte('created_at', today.toISOString()),
      supabase.from('products').select('*').eq('distributor_id', State.user.id),
      supabase.from('orders').select('retailer_id').eq('distributor_id', State.user.id),
    ]);

    const todayOrders = orders || [];
    const pending = todayOrders.filter(o => o.status === 'pending').length;
    const revenue = todayOrders.filter(o => o.status !== 'cancelled').reduce((s,o) => s + Number(o.total_price), 0);
    const uniqueRet = new Set((allOrders || []).map(r => r.retailer_id)).size;
    const lowStock = (products || []).filter(p => p.stock_qty > 0 && p.stock_qty < 10).length;
    const outStock = (products || []).filter(p => p.stock_qty === 0).length;

    this.updateOrderBadge();

    setHtml('app-view', `
      <div class="stats-row">
        <div class="stat-card green">
          <div class="stat-icon">📋</div>
          <div class="stat-label">${t('stat_orders_today')}</div>
          <div class="stat-value">${todayOrders.length}</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon">⏳</div>
          <div class="stat-label">${t('stat_pending')}</div>
          <div class="stat-value">${pending}</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">💰</div>
          <div class="stat-label">${t('stat_revenue')}</div>
          <div class="stat-value" style="font-size:1.1rem">${fmt(revenue)}</div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon">🏪</div>
          <div class="stat-label">${t('stat_retailers')}</div>
          <div class="stat-value">${uniqueRet}</div>
        </div>
      </div>

      ${lowStock > 0 || outStock > 0 ? `
        <div class="alert alert-warn" style="margin-bottom:1rem">
          ⚠️ ${State.lang === 'sw'
            ? `Bidhaa ${outStock} zimekwisha stoki. Bidhaa ${lowStock} zinakwisha.`
            : `${outStock} products out of stock. ${lowStock} running low.`}
          <button onclick="App.navigate('inventory')" style="margin-left:auto;font-weight:700;background:none;border:none;color:var(--amber);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:0.8rem">
            ${State.lang === 'sw' ? 'Angalia Stoki →' : 'Check Inventory →'}
          </button>
        </div>` : ''}

      <div class="section-header">
        <span class="section-title">${State.lang === 'sw' ? 'Maagizo ya Leo' : "Today's Orders"}</span>
        <button class="section-action" onclick="App.navigate('orders')">${t('view_all')}</button>
      </div>

      ${!todayOrders.length
        ? `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">${t('no_orders')}</div><div class="empty-sub">${t('no_orders_sub')}</div></div>`
        : `<div class="card">
            <table class="orders-table">
              <thead><tr>
                <th>${t('order_id')}</th>
                <th>${t('items')}</th>
                <th>${t('total')}</th>
                <th>${t('status')}</th>
                <th>${t('action')}</th>
              </tr></thead>
              <tbody>${this.buildOrderRows(todayOrders.slice(0, 6))}</tbody>
            </table>
           </div>`
      }
    `);
  },

  // ── DIST ORDERS ─────────────────────────

  async renderDistOrders() {
    setHtml('app-view', loader());

    const { data, error } = await supabase
      .from('orders')
      .select('*, retailer:profiles!orders_retailer_id_fkey(store_name, location, phone_number)')
      .eq('distributor_id', State.user.id)
      .order('created_at', { ascending: false });

    if (error || !data || !data.length) {
      setHtml('app-view', `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">${t('no_orders')}</div><div class="empty-sub">${t('no_orders_sub')}</div></div>`);
      this.updateOrderBadge();
      return;
    }

    setHtml('app-view', `
      <div class="card">
        <table class="orders-table">
          <thead><tr>
            <th>${t('retailer')}</th>
            <th>${t('order_id')}</th>
            <th>${t('items')}</th>
            <th>${t('total')}</th>
            <th>${t('status')}</th>
            <th>${t('date')}</th>
            <th>${t('action')}</th>
          </tr></thead>
          <tbody>${data.map(o => `
            <tr id="order-row-${o.id}">
              <td>
                <div style="font-weight:700;font-size:0.82rem">${o.retailer?.store_name || '—'}</div>
                <div style="font-size:0.72rem;color:var(--muted)">📍 ${o.retailer?.location || ''}</div>
                ${o.retailer?.phone_number ? `<div style="font-size:0.72rem;color:var(--muted)">📞 ${o.retailer.phone_number}</div>` : ''}
              </td>
              <td><span style="font-family:monospace;font-size:0.75rem;color:var(--muted)">${o.order_ref}</span></td>
              <td style="font-weight:700">${o.items_count || '—'}</td>
              <td><strong style="color:var(--green-mid)">${fmt(o.total_price)}</strong></td>
              <td id="status-${o.id}">${this.statusPill(o.status)}</td>
              <td style="color:var(--muted);font-size:0.75rem">${new Date(o.created_at).toLocaleDateString(State.lang === 'sw' ? 'sw-TZ' : 'en-GB')}</td>
              <td id="actions-${o.id}">${this.actionButtons(o)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `);

    this.updateOrderBadge();
  },

  buildOrderRows(orders) {
    return orders.map(o => `
      <tr id="order-row-${o.id}">
        <td><span style="font-family:monospace;font-size:0.75rem;color:var(--muted)">${o.order_ref}</span></td>
        <td style="font-weight:700">${o.items_count || '—'}</td>
        <td><strong style="color:var(--green-mid)">${fmt(o.total_price)}</strong></td>
        <td id="status-${o.id}">${this.statusPill(o.status)}</td>
        <td id="actions-${o.id}">${this.actionButtons(o)}</td>
      </tr>
    `).join('');
  },

  statusPill(status) {
    const map = {
      pending:   ['status-pending',   '⏳', t('pending')],
      confirmed: ['status-confirmed', '✅', t('confirmed')],
      delivered: ['status-delivered', '📦', t('delivered')],
      cancelled: ['status-cancelled', '✕',  t('cancelled')],
    };
    const [cls, icon, label] = map[status] || map.pending;
    return `<span class="status-pill ${cls}">${icon} ${label}</span>`;
  },

  actionButtons(order) {
    if (State.user.role !== 'distributor') return '';
    if (order.status === 'pending')
      return `<div style="display:flex;gap:5px">
        <button class="action-btn confirm" onclick="App.updateOrderStatus('${order.id}','confirmed')">${t('confirm')}</button>
        <button class="action-btn cancel" onclick="App.updateOrderStatus('${order.id}','cancelled')">${t('cancel')}</button>
      </div>`;
    if (order.status === 'confirmed')
      return `<button class="action-btn deliver" onclick="App.updateOrderStatus('${order.id}','delivered')">${t('deliver')}</button>`;
    return `<span style="font-size:0.72rem;color:var(--muted)">—</span>`;
  },

  async updateOrderStatus(orderId, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) { showToast(t('err_generic'), 'error'); return; }

    const msg = status === 'confirmed' ? t('toast_order_confirmed') : status === 'delivered' ? t('toast_order_delivered') : '✅ Done';
    showToast(msg, 'success');

    const sc = el(`status-${orderId}`);
    const ac = el(`actions-${orderId}`);
    if (sc) sc.innerHTML = this.statusPill(status);
    if (ac) ac.innerHTML = this.actionButtons({ id: orderId, status });

    this.updateOrderBadge();
    if (State.activePage === 'dashboard') this.renderDashboard();
  },

  // ── PRODUCTS ────────────────────────────

  async renderProducts() {
    setHtml('app-view', `
      <div style="display:grid;grid-template-columns:320px 1fr;gap:1.5rem;align-items:start">
        <div class="card card-pad">
          <div class="section-title" style="margin-bottom:1.1rem">${t('add_product')}</div>
          <form class="dist-form" onsubmit="App.addProduct(event)">
            <div class="form-group">
              <label class="form-label">${t('product_name')}</label>
              <input class="form-input" id="p-name" required placeholder="${State.lang === 'sw' ? 'mfano: Coca Cola 500ml' : 'e.g. Coca Cola 500ml'}" />
            </div>
            <div class="form-group">
              <label class="form-label">${t('product_category')}</label>
              <select class="form-input" id="p-category" required>
                <option value="">${State.lang === 'sw' ? '— Chagua Aina —' : '— Select Category —'}</option>
                ${CATEGORIES.map(c => `<option value="${c.key}">${catLabel(c.key)}</option>`).join('')}
              </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
              <div class="form-group">
                <label class="form-label">${t('product_price')}</label>
                <input class="form-input" id="p-price" type="number" min="1" required placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">${t('product_qty')}</label>
                <input class="form-input" id="p-qty" type="number" min="0" required placeholder="0" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">${t('product_unit')}</label>
              <input class="form-input" id="p-unit" placeholder="${State.lang === 'sw' ? 'mfano: Krate, Mfuko, Karton' : 'e.g. Crate (24), Bag, Carton'}" />
            </div>
            <div class="form-group">
              <label class="form-label">${t('product_desc')}</label>
              <input class="form-input" id="p-desc" placeholder="${State.lang === 'sw' ? 'Maelezo mafupi...' : 'Short description...'}" />
            </div>
            <button type="submit" class="btn-primary" id="add-product-btn">
              <span id="add-product-text">${t('btn_add_product')}</span>
            </button>
          </form>
        </div>
        <div>
          <div class="section-title" style="margin-bottom:0.875rem">
            ${State.lang === 'sw' ? 'Bidhaa Zilizowekwa Sokoni' : 'Listed Products'}
          </div>
          <div id="my-products-list">${loader()}</div>
        </div>
      </div>
    `);

    this.loadMyProducts();
  },

  async loadMyProducts() {
    const { data } = await supabase
      .from('products').select('*')
      .eq('distributor_id', State.user.id)
      .order('created_at', { ascending: false });

    const list = el('my-products-list');
    if (!list) return;

    if (!data || !data.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">🏷️</div><div class="empty-title">${t('no_products')}</div><div class="empty-sub">${t('no_products_sub')}</div></div>`;
      return;
    }

    list.innerHTML = `<div class="inventory-grid">` + data.map(p => `
      <div class="inventory-card">
        <span class="inv-icon">${catIcon(p.category)}</span>
        <div style="flex:1;min-width:0">
          <div class="inv-name">${p.product_name}</div>
          <div class="inv-meta">${fmt(p.price)} · ${p.selling_unit || '—'}</div>
          <div class="inv-meta">${catLabel(p.category)}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div class="inv-stock">${p.stock_qty}</div>
          <div class="inv-stock-label">${State.lang === 'sw' ? 'stoki' : 'in stock'}</div>
        </div>
      </div>
    `).join('') + `</div>`;
  },

  async addProduct(e) {
    e.preventDefault();
    const payload = {
      distributor_id: State.user.id,
      product_name:   el('p-name').value.trim(),
      category:       el('p-category').value,
      price:          Number(el('p-price').value),
      stock_qty:      Number(el('p-qty').value),
      selling_unit:   el('p-unit').value.trim() || null,
      description:    el('p-desc').value.trim() || null,
    };

    const btn = el('add-product-btn'); const span = el('add-product-text');
    if (btn) btn.disabled = true;
    if (span) span.innerHTML = '<span class="spinner"></span>';

    const { error } = await supabase.from('products').insert([payload]);

    if (btn) btn.disabled = false;
    if (span) span.innerText = t('btn_add_product');

    if (error) { showToast(t('err_generic'), 'error'); console.error(error); return; }

    showToast(t('toast_product_added'), 'success');
    e.target.reset();
    this.loadMyProducts();
  },

  // ── INVENTORY ───────────────────────────

  async renderInventory() {
    setHtml('app-view', loader());

    const { data } = await supabase
      .from('products').select('*')
      .eq('distributor_id', State.user.id)
      .order('stock_qty', { ascending: true });

    if (!data || !data.length) {
      setHtml('app-view', `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">${t('no_products')}</div><div class="empty-sub">${t('no_products_sub')}</div></div>`);
      return;
    }

    const outCount = data.filter(p => p.stock_qty === 0).length;
    const lowCount = data.filter(p => p.stock_qty > 0 && p.stock_qty < 10).length;

    setHtml('app-view', `
      ${outCount || lowCount ? `
        <div class="alert alert-warn" style="margin-bottom:1rem">
          ⚠️ ${State.lang === 'sw'
            ? `${outCount} zimekwisha · ${lowCount} zinakwisha`
            : `${outCount} out of stock · ${lowCount} running low`}
        </div>` : `
        <div class="alert alert-success" style="margin-bottom:1rem">
          ✅ ${State.lang === 'sw' ? 'Stoki zote ziko sawa.' : 'All stock levels are healthy.'}
        </div>`}
      <div class="card">
        <table class="orders-table">
          <thead><tr>
            <th>${t('product_name')}</th>
            <th>${t('product_category')}</th>
            <th>${t('product_price')}</th>
            <th>${t('product_unit')}</th>
            <th>${t('stock_qty')}</th>
            <th>${t('update_stock')}</th>
            <th>${t('status')}</th>
          </tr></thead>
          <tbody>
            ${data.map(p => `
              <tr>
                <td><strong>${catIcon(p.category)} ${p.product_name}</strong></td>
                <td>${catLabel(p.category)}</td>
                <td style="color:var(--green-mid);font-weight:700">${fmt(p.price)}</td>
                <td style="color:var(--muted)">${p.selling_unit || '—'}</td>
                <td><strong style="font-size:1rem">${p.stock_qty}</strong></td>
                <td>
                  <div class="stock-edit">
                    <input type="number" id="stock-input-${p.id}" value="${p.stock_qty}" min="0" step="1" />
                    <button class="stock-edit-btn" onclick="App.updateStock('${p.id}')">
                      ${State.lang === 'sw' ? 'Weka' : 'Set'}
                    </button>
                  </div>
                </td>
                <td>${p.stock_qty === 0
                  ? `<span class="status-pill status-cancelled">✕ ${t('out_of_stock')}</span>`
                  : p.stock_qty < 10
                  ? `<span class="status-pill status-pending">⚠ ${t('low_stock')}</span>`
                  : `<span class="status-pill status-delivered">✓ ${t('in_stock')}</span>`
                }</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `);
  },

  async updateStock(productId) {
    const input = el(`stock-input-${productId}`);
    if (!input) return;
    const newQty = parseInt(input.value, 10);
    if (isNaN(newQty) || newQty < 0) { showToast(State.lang === 'sw' ? '❌ Idadi si sahihi' : '❌ Invalid quantity', 'error'); return; }

    const { error } = await supabase.from('products').update({ stock_qty: newQty }).eq('id', productId);
    if (error) { showToast(t('err_generic'), 'error'); return; }
    showToast(t('toast_stock_updated'), 'success');
    this.renderInventory();
  },

  // ── RETAILERS ───────────────────────────

  async renderRetailers() {
    setHtml('app-view', loader());

    const { data: orders } = await supabase
      .from('orders')
      .select('*, retailer:profiles!orders_retailer_id_fkey(id, store_name, location, phone_number)')
      .eq('distributor_id', State.user.id);

    if (!orders || !orders.length) {
      setHtml('app-view', `<div class="empty-state"><div class="empty-icon">🏪</div><div class="empty-title">${t('no_retailers')}</div><div class="empty-sub">${t('no_retailers_sub')}</div></div>`);
      return;
    }

    const map = {};
    orders.forEach(o => {
      const r = o.retailer; if (!r) return;
      if (!map[r.id]) map[r.id] = { ...r, totalOrders: 0, totalSpent: 0, lastOrder: o.created_at };
      map[r.id].totalOrders++;
      map[r.id].totalSpent += Number(o.total_price);
      if (new Date(o.created_at) > new Date(map[r.id].lastOrder)) map[r.id].lastOrder = o.created_at;
    });

    const retailers = Object.values(map).sort((a,b) => b.totalSpent - a.totalSpent);

    setHtml('app-view', `
      <div class="retailer-grid">
        ${retailers.map(r => `
          <div class="retailer-card">
            <div class="retailer-card-head">
              <div class="retailer-avatar">🏪</div>
              <div>
                <div class="retailer-card-name">${r.store_name}</div>
                <div class="retailer-card-loc">📍 ${r.location || '—'}</div>
                ${r.phone_number ? `<div class="retailer-card-loc">📞 ${r.phone_number}</div>` : ''}
              </div>
            </div>
            <div class="retailer-stats">
              <div class="r-stat">
                <div class="r-stat-val">${r.totalOrders}</div>
                <div class="r-stat-lbl">${t('total_orders')}</div>
              </div>
              <div class="r-stat">
                <div class="r-stat-val" style="font-size:0.72rem">${fmt(r.totalSpent)}</div>
                <div class="r-stat-lbl">${t('total_spent')}</div>
              </div>
              <div class="r-stat">
                <div class="r-stat-val" style="font-size:0.7rem">${new Date(r.lastOrder).toLocaleDateString(State.lang === 'sw' ? 'sw-TZ' : 'en-GB')}</div>
                <div class="r-stat-lbl">${t('last_order')}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `);
  },
};

// ── GLOBAL EVENTS ──────────────────────────

window.App = App;

// ── AUTO-RESTORE SESSION ON LOAD ───────────
document.addEventListener('DOMContentLoaded', () => {
  if (App._restoreSession()) {
    App.launchApp();
  }
});

document.addEventListener('click', (e) => {
  if (!el('notif-bell')?.contains(e.target) && !el('notif-dropdown')?.contains(e.target)) {
    State.notifOpen = false;
    el('notif-dropdown')?.classList.remove('open');
  }
});
