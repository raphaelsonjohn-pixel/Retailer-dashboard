/**
 * BomaWave — Full MVP Controller
 * Bilingual (Swahili / English) | Supabase Realtime | No Payment Integration
 */

import { supabase } from './supabase.js';

// ═══════════════════════════════════════════════════════
//  TRANSLATIONS
// ═══════════════════════════════════════════════════════

const T = {
  sw: {
    // Onboarding
    step1_label:        'Hatua 2',
    step1_title:        'Wewe ni nani?',
    role_retailer:      'Duka (Retailer)',
    role_retailer_desc: 'Naagiza bidhaa kwa duka langu',
    role_dist:          'Msambazaji (Distributor)',
    role_dist_desc:     'Nasambaza bidhaa kwa maduka',
    back:               '← Rudi Nyuma',
    tab_register:       'Akaunti Mpya',
    tab_login:          'Ingia',

    step3_label:   'Hatua 3',
    step3_title:   'Tengeneza Akaunti',
    lbl_store:     'Jina la Duka / Biashara',
    lbl_user:      'Jina la Mtumiaji',
    lbl_phone:     'Namba ya Simu',
    lbl_loc:       'Eneo la Biashara',
    lbl_coverage:  'Maeneo ya Usambazaji',
    lbl_cats:      'Aina za Bidhaa Unazosambaza',
    lbl_pass:      'Nywila',
    lbl_pass2:     'Thibitisha Nywila',
    btn_register:  'Kamilisha',
    btn_loading:   'Subiri...',

    step4_label:      'Ingia',
    step4_title:      'Karibu Tena!',
    lbl_login_user:   'Jina la Mtumiaji',
    lbl_login_pass:   'Nywila',
    btn_login:        'Ingia',

    lbl_logout: 'Toka',

    // Nav
    nav_marketplace:  'Soko la Bidhaa',
    nav_my_orders:    'Maagizo Yangu',
    nav_dashboard:    'Dashibodi',
    nav_orders:       'Maagizo Yaliyoingia',
    nav_products:     'Bidhaa Zangu',
    nav_inventory:    'Hifadhi (Stoki)',
    nav_retailers:    'Maduka Yangu',

    // Topbar
    topbar_marketplace: 'Soko la Bidhaa',
    topbar_sub_market:  'Agiza bidhaa kutoka kwa wasambazaji',
    topbar_my_orders:   'Maagizo Yangu',
    topbar_sub_orders:  'Historia ya maagizo yako',
    topbar_dashboard:   'Dashibodi',
    topbar_sub_dash:    'Muhtasari wa biashara yako leo',
    topbar_orders:      'Maagizo Yaliyoingia',
    topbar_sub_inord:   'Maagizo mapya kutoka kwa maduka',
    topbar_products:    'Bidhaa Zangu',
    topbar_sub_prod:    'Simamia bidhaa unazouza',
    topbar_inventory:   'Hifadhi (Stoki)',
    topbar_sub_inv:     'Angalia stoki iliyobaki',
    topbar_retailers:   'Maduka Yangu',
    topbar_sub_ret:     'Maduka yanayonunua kwako',

    // Notifications
    notif_title:        'Arifa',
    notif_empty:        'Hakuna arifa',
    notif_new_order:    'Agizo Jipya!',
    notif_order_conf:   'Agizo Limethibitishwa',
    notif_order_del:    'Bidhaa Zimefikia',

    // Stats
    stat_orders_today:   "Maagizo Leo",
    stat_pending:        "Yanasubiri",
    stat_revenue:        "Mapato Leo",
    stat_retailers:      "Maduka Yaliyonunua",
    stat_total_orders:   "Maagizo Yote",
    stat_total_spent:    "Jumla Niliyotumia",
    stat_active_dist:    "Wasambazaji",
    stat_pending_orders: "Yanasubiri",

    // Products
    all_categories: 'Zote',
    add_to_cart:    'Ongeza',
    out_of_stock:   'Haipatikani',
    low_stock:      'Inakwisha',
    in_stock:       'Inapatikana',
    unit:           'Kitengo',
    price:          'Bei',
    search_products: 'Tafuta bidhaa...',

    // Cart
    cart_title:     'Agizo Lako',
    cart_sub:       'bidhaa zimeongezwa',
    cart_total:     'Jumla',
    place_order:    'Tuma Agizo',
    cart_loading:   'Inatuma...',
    cart_empty:     'Bado hujachagua bidhaa',
    cart_payment:   '💡 Malipo yanafanywa moja kwa moja na Msambazaji baada ya kuthibitishwa.',

    // Orders
    order_id:       'Namba ya Agizo',
    retailer:       'Duka',
    distributor:    'Msambazaji',
    items:          'Bidhaa',
    total:          'Jumla',
    status:         'Hali',
    date:           'Tarehe',
    action:         'Hatua',
    confirm:        'Thibitisha',
    deliver:        'Tuma Bidhaa',
    cancel:         'Ghairi',
    pending:        'Inasubiri',
    confirmed:      'Imethibitishwa',
    delivered:      'Imefikia',
    cancelled:      'Imeghairiwa',
    no_orders:      'Hakuna maagizo bado',
    no_orders_sub:  'Maagizo mapya yataonekana hapa',

    // Product form (distributor)
    add_product:        'Weka Bidhaa Sokoni',
    product_name:       'Jina la Bidhaa',
    product_category:   'Aina ya Bidhaa',
    product_price:      'Bei (TZS)',
    product_unit:       'Kitengo cha Uuzaji',
    product_qty:        'Idadi ya Stoki',
    product_desc:       'Maelezo (si lazima)',
    btn_add_product:    'Weka Sokoni',
    product_added:      '✅ Bidhaa imewekwa sokoni!',

    // Inventory
    no_products:     'Bado hujaweka bidhaa',
    no_products_sub: 'Anza kuweka bidhaa kwa kubonyeza kitufe hapo juu',

    // Success
    success_title:   'Agizo Limetumwa!',
    success_sub:     'Msambazaji ataliangalia hivi karibuni na akuthibitishie.',
    success_new:     'Agizo Jipya',

    // Waiting
    waiting_title:   'Akaunti Inapitiwa',
    waiting_sub:     'Akaunti yako ya Msambazaji inasubiri ipitiwe. Tutakuarifiwa hivi karibuni.',

    // Errors
    err_pass_match:  '❌ Nywila hazifanani. Jaribu tena.',
    err_username:    '❌ Jina la mtumiaji tayari lipo. Tumia lingine.',
    err_login:       '❌ Jina la mtumiaji au nywila si sahihi.',
    err_generic:     '❌ Kosa fulani limetokea. Jaribu tena.',
    err_no_products: '⚠️ Hakuna bidhaa za kuagiza bado.',
    err_cart_empty:  '⚠️ Chagua bidhaa kwanza.',

    // Toast
    toast_order_placed:   '✅ Agizo limetumwa!',
    toast_order_confirmed:'✅ Agizo limethibitishwa.',
    toast_order_delivered:'📦 Bidhaa zimetumwa.',
    toast_product_added:  '✅ Bidhaa imewekwa sokoni.',
    toast_new_order:      '🔔 Agizo jipya limeingia!',

    // Retailers page
    total_orders:   'Maagizo Yote',
    total_spent:    'Jumla (TZS)',
    last_order:     'Agizo la Mwisho',
    no_retailers:   'Hakuna maduka bado',
    no_retailers_sub: 'Maduka yanayonunua kwako yataonekana hapa',

    // Categories
    cat_beverages:    '🥤 Vinywaji',
    cat_flour:        '🌾 Unga na Nafaka',
    cat_oil:          '🫙 Mafuta ya Kupikia',
    cat_sugar:        '🍬 Sukari na Chumvi',
    cat_soap:         '🧼 Sabuni na Dawa za Kuosha',
    cat_personal:     '🧴 Usafi wa Mwili',
    cat_dairy:        '🧈 Bidhaa za Maziwa',
    cat_tobacco:      '🚬 Sigara na Tumbaku',
    cat_other:        '📦 Nyingine',
  },

  en: {
    step1_label:        'Step 2',
    step1_title:        'Who are you?',
    role_retailer:      'Shop (Retailer)',
    role_retailer_desc: 'I order goods for my shop',
    role_dist:          'Distributor (Wholesaler)',
    role_dist_desc:     'I supply goods to shops',
    back:               '← Go Back',
    tab_register:       'New Account',
    tab_login:          'Sign In',

    step3_label:   'Step 3',
    step3_title:   'Create Account',
    lbl_store:     'Store / Business Name',
    lbl_user:      'Username',
    lbl_phone:     'Phone Number',
    lbl_loc:       'Business Location',
    lbl_coverage:  'Coverage / Supply Area',
    lbl_cats:      'Product Categories You Supply',
    lbl_pass:      'Password',
    lbl_pass2:     'Confirm Password',
    btn_register:  'Create Account',
    btn_loading:   'Please wait...',

    step4_label:    'Sign In',
    step4_title:    'Welcome Back!',
    lbl_login_user: 'Username',
    lbl_login_pass: 'Password',
    btn_login:      'Sign In',

    lbl_logout: 'Sign Out',

    nav_marketplace:  'Marketplace',
    nav_my_orders:    'My Orders',
    nav_dashboard:    'Dashboard',
    nav_orders:       'Incoming Orders',
    nav_products:     'My Products',
    nav_inventory:    'Inventory',
    nav_retailers:    'My Retailers',

    topbar_marketplace: 'Marketplace',
    topbar_sub_market:  'Order goods from distributors',
    topbar_my_orders:   'My Orders',
    topbar_sub_orders:  'Your order history',
    topbar_dashboard:   'Dashboard',
    topbar_sub_dash:    "Today's business summary",
    topbar_orders:      'Incoming Orders',
    topbar_sub_inord:   'New orders from shops',
    topbar_products:    'My Products',
    topbar_sub_prod:    'Manage your listed products',
    topbar_inventory:   'Inventory',
    topbar_sub_inv:     'Track remaining stock',
    topbar_retailers:   'My Retailers',
    topbar_sub_ret:     'Shops that buy from you',

    notif_title:     'Notifications',
    notif_empty:     'No notifications',
    notif_new_order: 'New Order!',
    notif_order_conf:'Order Confirmed',
    notif_order_del: 'Order Delivered',

    stat_orders_today:   'Orders Today',
    stat_pending:        'Pending',
    stat_revenue:        "Today's Revenue",
    stat_retailers:      'Active Retailers',
    stat_total_orders:   'Total Orders',
    stat_total_spent:    'Total Spent',
    stat_active_dist:    'Distributors',
    stat_pending_orders: 'Pending',

    all_categories:  'All',
    add_to_cart:     'Add',
    out_of_stock:    'Out of Stock',
    low_stock:       'Low Stock',
    in_stock:        'In Stock',
    unit:            'Unit',
    price:           'Price',
    search_products: 'Search products...',

    cart_title:   'Your Order',
    cart_sub:     'items added',
    cart_total:   'Total',
    place_order:  'Place Order',
    cart_loading: 'Sending...',
    cart_empty:   'No items selected yet',
    cart_payment: '💡 Payment is made directly to the distributor after confirmation.',

    order_id:    'Order ID',
    retailer:    'Shop',
    distributor: 'Distributor',
    items:       'Items',
    total:       'Total',
    status:      'Status',
    date:        'Date',
    action:      'Action',
    confirm:     'Confirm',
    deliver:     'Mark Delivered',
    cancel:      'Cancel',
    pending:     'Pending',
    confirmed:   'Confirmed',
    delivered:   'Delivered',
    cancelled:   'Cancelled',
    no_orders:   'No orders yet',
    no_orders_sub: 'New orders will appear here',

    add_product:       'List a Product',
    product_name:      'Product Name',
    product_category:  'Category',
    product_price:     'Price (TZS)',
    product_unit:      'Selling Unit',
    product_qty:       'Stock Quantity',
    product_desc:      'Description (optional)',
    btn_add_product:   'List Product',
    product_added:     '✅ Product listed on marketplace!',

    no_products:     'No products listed yet',
    no_products_sub: 'Add your first product using the form above',

    success_title: 'Order Placed!',
    success_sub:   'The distributor will review and confirm your order shortly.',
    success_new:   'New Order',

    waiting_title: 'Account Under Review',
    waiting_sub:   'Your distributor account is pending approval. You will be notified shortly.',

    err_pass_match: '❌ Passwords do not match. Please try again.',
    err_username:   '❌ Username already taken. Please choose another.',
    err_login:      '❌ Incorrect username or password.',
    err_generic:    '❌ Something went wrong. Please try again.',
    err_no_products:'⚠️ No products available to order yet.',
    err_cart_empty: '⚠️ Please select at least one product.',

    toast_order_placed:    '✅ Order placed successfully!',
    toast_order_confirmed: '✅ Order confirmed.',
    toast_order_delivered: '📦 Order marked as delivered.',
    toast_product_added:   '✅ Product listed on marketplace.',
    toast_new_order:       '🔔 New order received!',

    total_orders:    'Total Orders',
    total_spent:     'Total (TZS)',
    last_order:      'Last Order',
    no_retailers:    'No retailers yet',
    no_retailers_sub:'Shops that order from you will appear here',

    cat_beverages: '🥤 Beverages',
    cat_flour:     '🌾 Flour & Grains',
    cat_oil:       '🫙 Cooking Oil',
    cat_sugar:     '🍬 Sugar & Salt',
    cat_soap:      '🧼 Soap & Detergents',
    cat_personal:  '🧴 Personal Care',
    cat_dairy:     '🧈 Dairy Products',
    cat_tobacco:   '🚬 Tobacco',
    cat_other:     '📦 Other',
  }
};

// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════

const State = {
  lang:       'sw',
  role:       '',
  authMode:   'register',   // 'register' | 'login'
  user:       null,
  cart:       {},           // { productId: { product, qty } }
  activePage: '',
  realtimeSub: null,
  notifications: [],
  notifOpen:  false,
};

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

const t = (key) => T[State.lang][key] || T['sw'][key] || key;

const fmt = (n) => `TZS ${Number(n).toLocaleString('en-TZ')}`;

const el = (id) => document.getElementById(id);

function setHtml(id, html) {
  const e = el(id);
  if (e) e.innerHTML = html;
}

function setText(id, text) {
  const e = el(id);
  if (e) e.innerText = text;
}

function show(id)   { const e = el(id); if (e) e.style.display = ''; }
function hide(id)   { const e = el(id); if (e) e.style.display = 'none'; }

function showToast(msg, type = 'success') {
  const wrap = el('toast-container');
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.innerHTML = `<span>${msg}</span>`;
  wrap.appendChild(div);
  setTimeout(() => div.remove(), 4200);
}

function setLoading(btnId, textId, loading, text) {
  const btn = el(btnId);
  const span = el(textId);
  if (!btn || !span) return;
  btn.disabled = loading;
  span.innerHTML = loading ? `<span class="spinner"></span>` : text;
}

function genId() {
  return 'BW-' + Date.now().toString(36).toUpperCase();
}

// ═══════════════════════════════════════════════════════
//  CATEGORIES
// ═══════════════════════════════════════════════════════

const CATEGORIES = [
  { key: 'beverages', icon: '🥤' },
  { key: 'flour',     icon: '🌾' },
  { key: 'oil',       icon: '🫙' },
  { key: 'sugar',     icon: '🍬' },
  { key: 'soap',      icon: '🧼' },
  { key: 'personal',  icon: '🧴' },
  { key: 'dairy',     icon: '🧈' },
  { key: 'tobacco',   icon: '🚬' },
  { key: 'other',     icon: '📦' },
];

function catLabel(key) {
  return t(`cat_${key}`);
}

// ═══════════════════════════════════════════════════════
//  APP CONTROLLER
// ═══════════════════════════════════════════════════════

export const App = {

  // ── ONBOARDING ──────────────────────────────────────

  setLang(lang) {
    State.lang = lang;
    this.applyTranslations();
    this.goStep(2);
  },

  applyTranslations() {
    const l = State.lang;
    // Step 2
    setText('s2-label',           t('step1_label'));
    setText('s2-title',           t('step1_title'));
    setText('role-retailer-name', t('role_retailer'));
    setText('role-retailer-desc', t('role_retailer_desc'));
    setText('role-dist-name',     t('role_dist'));
    setText('role-dist-desc',     t('role_dist_desc'));
    setText('s2-back',            t('back'));
    setText('tab-register',       t('tab_register'));
    setText('tab-login',          t('tab_login'));

    // Step 3
    setText('s3-label',    t('step3_label'));
    setText('s3-title',    t('step3_title'));
    setText('lbl-store',   t('lbl_store'));
    setText('lbl-user',    t('lbl_user'));
    setText('lbl-phone',   t('lbl_phone'));
    setText('lbl-loc',     t('lbl_loc'));
    setText('lbl-coverage',t('lbl_coverage'));
    setText('lbl-cats',    t('lbl_cats'));
    setText('lbl-pass',    t('lbl_pass'));
    setText('lbl-pass2',   t('lbl_pass2'));
    setText('reg-submit-text', t('btn_register'));

    // Distributor placeholders for reg-coverage
    const cov = el('reg-coverage');
    if (cov) cov.placeholder = l === 'sw' ? 'mfano: Kariakoo, Ilala, Kinondoni' : 'e.g. Kariakoo, Ilala, Kinondoni';

    // Step 4
    setText('s4-label',        t('step4_label'));
    setText('s4-title',        t('step4_title'));
    setText('lbl-login-user',  t('lbl_login_user'));
    setText('lbl-login-pass',  t('lbl_login_pass'));
    setText('login-submit-text', t('btn_login'));

    // Logout
    setText('lbl-logout', t('lbl_logout'));

    // Notifications
    setText('notif-header',    t('notif_title'));
    setText('notif-empty-msg', t('notif_empty'));

    // Cart
    setText('cart-title',       t('cart_title'));
    setText('cart-total-lbl',   t('cart_total'));
    setText('place-order-text', t('place_order'));
    setText('cart-payment-note',t('cart_payment'));

    // Placeholders
    const setP = (id, text) => { const e = el(id); if (e) e.placeholder = text; };
    setP('reg-name',  l === 'sw' ? 'mfano: Mama Fatuma Duka' : 'e.g. Grace Mini Market');
    setP('reg-user',  l === 'sw' ? 'jina lako la kipekee'   : 'your unique username');
    setP('reg-phone', l === 'sw' ? '+255 7XX XXX XXX'       : '+255 7XX XXX XXX');
    setP('reg-loc',   l === 'sw' ? 'mfano: Kariakoo, DSM'   : 'e.g. Kariakoo, DSM');
    setP('reg-pass',  l === 'sw' ? 'angalau herufi 6'       : 'at least 6 characters');
    setP('reg-pass2', l === 'sw' ? 'rudia nywila'           : 'repeat password');
    setP('login-user', l === 'sw' ? 'jina la mtumiaji'      : 'your username');
    setP('login-pass', l === 'sw' ? 'nywila yako'           : 'your password');

    // Build category checkboxes
    this.buildCatGrid();
  },

  buildCatGrid() {
    const grid = el('cat-grid');
    if (!grid) return;
    grid.innerHTML = CATEGORIES.map(c => `
      <label class="cat-check" id="cat-${c.key}" onclick="App.toggleCat('${c.key}')">
        <input type="checkbox" value="${c.key}" />
        <span class="cat-icon">${c.icon}</span>
        <span>${catLabel(c.key).replace(/^[^ ]+ /, '')}</span>
      </label>
    `).join('');
  },

  toggleCat(key) {
    const el2 = el(`cat-${key}`);
    if (!el2) return;
    el2.classList.toggle('checked');
    const inp = el2.querySelector('input');
    if (inp) inp.checked = el2.classList.contains('checked');
  },

  getSelectedCats() {
    return CATEGORIES
      .filter(c => el(`cat-${c.key}`)?.classList.contains('checked'))
      .map(c => c.key);
  },

  goStep(n) {
    for (let i = 1; i <= 4; i++) {
      el(`step-${i}`)?.classList.remove('active');
      const dot = el(`dot-${i}`);
      if (dot) dot.classList.remove('active');
    }
    el(`step-${n}`)?.classList.add('active');
    el(`dot-${n}`)?.classList.add('active');
  },

  selectRole(role) {
    State.role = role;
    const distExtra = el('dist-extra');
    if (distExtra) distExtra.style.display = role === 'distributor' ? 'flex' : 'none';
    const page = State.authMode === 'login' ? 4 : 3;
    this.goStep(page);
  },

  setAuthMode(mode) {
    State.authMode = mode;
    el('tab-register')?.classList.toggle('active', mode === 'register');
    el('tab-login')?.classList.toggle('active', mode === 'login');
  },

  // ── AUTH ────────────────────────────────────────────

  async handleRegister(e) {
    e.preventDefault();
    const pass  = el('reg-pass').value;
    const pass2 = el('reg-pass2').value;

    if (pass !== pass2) {
      showToast(t('err_pass_match'), 'error');
      return;
    }

    if (pass.length < 6) {
      showToast(State.lang === 'sw' ? '❌ Nywila lazima iwe herufi 6 au zaidi.' : '❌ Password must be at least 6 characters.', 'error');
      return;
    }

    const cats = this.getSelectedCats();

    const payload = {
      username:      el('reg-user').value.trim().toLowerCase(),
      password:      pass,
      store_name:    el('reg-name').value.trim(),
      phone_number:  el('reg-phone').value.trim(),
      location:      el('reg-loc').value.trim(),
      role:          State.role,
      coverage_area: el('reg-coverage')?.value.trim() || null,
      // categories column removed - database doesn't have this column
      lang:          State.lang,
      is_approved:   true,
    };

    // Save categories to localStorage if needed later
    if (cats.length && State.role === 'distributor') {
      localStorage.setItem('dist_categories', JSON.stringify(cats));
    }

    setLoading('reg-submit', 'reg-submit-text', true, '');

    const { data, error } = await supabase
      .from('profiles')
      .insert([payload])
      .select()
      .single();

    setLoading('reg-submit', 'reg-submit-text', false, t('btn_register'));

    if (error) {
      if (error.code === '23505') showToast(t('err_username'), 'error');
      else showToast(t('err_generic'), 'error');
      console.error(error);
      return;
    }

    State.user = data;
    this.launchApp();
  },

  async handleLogin(e) {
    e.preventDefault();
    const username = el('login-user').value.trim().toLowerCase();
    const password = el('login-pass').value;

    setLoading('login-submit', 'login-submit-text', true, '');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    setLoading('login-submit', 'login-submit-text', false, t('btn_login'));

    if (error || !data) {
      showToast(t('err_login'), 'error');
      return;
    }

    State.user = data;
    State.lang  = data.lang || State.lang;
    this.launchApp();
  },

  logout() {
    // Cleanup realtime
    if (State.realtimeSub) {
      supabase.removeChannel(State.realtimeSub);
      State.realtimeSub = null;
    }
    State.user = null;
    State.cart = {};
    State.notifications = [];
    el('app-main').style.display = 'none';
    el('onboarding').style.display = 'flex';
    hide('cart-fab');
    this.goStep(1);
  },

  // ── LAUNCH ──────────────────────────────────────────

  launchApp() {
    el('onboarding').style.display = 'none';
    el('app-main').style.display = '';

    const u = State.user;
    // Sidebar user info
    setText('sb-name', u.store_name);
    el('sb-avatar').innerText = u.store_name.charAt(0).toUpperCase();

    const badge = el('sb-role-badge');
    if (u.role === 'retailer') {
      badge.className = 'user-role-badge badge-retailer';
      badge.innerText = State.lang === 'sw' ? 'Duka' : 'Retailer';
    } else {
      badge.className = 'user-role-badge badge-distributor';
      badge.innerText = State.lang === 'sw' ? 'Msambazaji' : 'Distributor';
    }

    this.buildSidebar();
    this.setupRealtime();

    const firstPage = u.role === 'retailer' ? 'marketplace' : 'dashboard';
    this.navigate(firstPage);
  },

  buildSidebar() {
    const u = State.user;
    const nav = el('sidebar-nav');

    const items = u.role === 'retailer'
      ? [
          { id: 'marketplace', icon: '🛍️', label: t('nav_marketplace') },
          { id: 'my_orders',   icon: '📦', label: t('nav_my_orders') },
        ]
      : [
          { id: 'dashboard',  icon: '📊', label: t('nav_dashboard'), badge: true },
          { id: 'orders',     icon: '📋', label: t('nav_orders'),    badge: true },
          { id: 'products',   icon: '🏷️', label: t('nav_products') },
          { id: 'inventory',  icon: '📦', label: t('nav_inventory') },
          { id: 'retailers',  icon: '🏪', label: t('nav_retailers') },
        ];

    nav.innerHTML = items.map(item => `
      <button class="nav-item" id="nav-${item.id}" onclick="App.navigate('${item.id}')">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
        ${item.badge ? `<span class="nav-badge" id="badge-${item.id}" style="display:none">0</span>` : ''}
      </button>
    `).join('');
  },

  navigate(page) {
    State.activePage = page;

    // Active nav
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    el(`nav-${page}`)?.classList.add('active');

    // Topbar
    const titleMap = {
      marketplace: ['topbar_marketplace', 'topbar_sub_market'],
      my_orders:   ['topbar_my_orders',   'topbar_sub_orders'],
      dashboard:   ['topbar_dashboard',   'topbar_sub_dash'],
      orders:      ['topbar_orders',      'topbar_sub_inord'],
      products:    ['topbar_products',    'topbar_sub_prod'],
      inventory:   ['topbar_inventory',   'topbar_sub_inv'],
      retailers:   ['topbar_retailers',   'topbar_sub_ret'],
    };

    const [titleKey, subKey] = titleMap[page] || ['topbar_dashboard', 'topbar_sub_dash'];
    setText('topbar-title', t(titleKey));
    setText('topbar-sub',   t(subKey));

    // Cart FAB — only on marketplace
    if (page === 'marketplace') {
      el('cart-fab').style.display = 'flex';
      this.updateCartUI();
    } else {
      el('cart-fab').style.display = 'none';
    }

    // Render page
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

  // ── REALTIME ────────────────────────────────────────

  setupRealtime() {
    if (State.realtimeSub) supabase.removeChannel(State.realtimeSub);

    const u = State.user;

    // Listen to orders table
    const channel = supabase
      .channel(`orders-${u.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (u.role === 'distributor' && payload.new.distributor_id === u.id) {
            this.addNotification({
              icon: '🛍️',
              title: t('notif_new_order'),
              text: payload.new.order_ref,
              time: new Date().toLocaleTimeString(State.lang === 'sw' ? 'sw-TZ' : 'en-GB', { hour: '2-digit', minute: '2-digit' }),
            });
            showToast(t('toast_new_order'), 'info');
            // Refresh if on orders/dashboard page
            if (['orders', 'dashboard'].includes(State.activePage)) {
              this.navigate(State.activePage);
            }
            // Update badge
            this.updateOrderBadge();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (u.role === 'retailer' && payload.new.retailer_id === u.id) {
            const statusMsg = payload.new.status === 'confirmed'
              ? t('toast_order_confirmed')
              : payload.new.status === 'delivered'
              ? t('toast_order_delivered')
              : null;
            if (statusMsg) {
              showToast(statusMsg, 'success');
              this.addNotification({
                icon: payload.new.status === 'delivered' ? '📦' : '✅',
                title: payload.new.status === 'delivered' ? t('notif_order_del') : t('notif_order_conf'),
                text: payload.new.order_ref,
                time: new Date().toLocaleTimeString(State.lang === 'sw' ? 'sw-TZ' : 'en-GB', { hour: '2-digit', minute: '2-digit' }),
              });
            }
            if (State.activePage === 'my_orders') this.renderMyOrders();
          }
        }
      )
      .subscribe();

    State.realtimeSub = channel;
  },

  addNotification(notif) {
    State.notifications.unshift(notif);
    const dot = el('notif-dot');
    if (dot) {
      dot.style.display = 'flex';
      dot.innerText = State.notifications.length;
    }
    this.renderNotifList();
  },

  renderNotifList() {
    const list = el('notif-list');
    if (!list) return;
    if (State.notifications.length === 0) {
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
    if (State.notifOpen) {
      // Clear badge
      const dot = el('notif-dot');
      if (dot) dot.style.display = 'none';
    }
  },

  async updateOrderBadge() {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('distributor_id', State.user.id)
      .eq('status', 'pending');

    const n = count || 0;
    ['badge-dashboard', 'badge-orders'].forEach(id => {
      const b = el(id);
      if (b) {
        b.innerText = n;
        b.style.display = n > 0 ? 'inline-flex' : 'none';
      }
    });
  },

  // ── RETAILER: MARKETPLACE ───────────────────────────

  async renderMarketplace() {
    setHtml('app-view', `
      <div>
        <div style="margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center">
          <input class="form-input" id="market-search" placeholder="${t('search_products')}"
            style="max-width:280px" oninput="App.filterProducts()" />
        </div>
        <div class="filter-pills" id="cat-filters"></div>
        <div class="product-grid" id="product-list">
          <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)">
            <span class="spinner" style="border-color:rgba(22,163,74,0.3);border-top-color:var(--green);width:28px;height:28px"></span>
          </div>
        </div>
      </div>
    `);

    // Build category filters
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .gt('stock_qty', 0)
      .order('created_at', { ascending: false });

    App._allProducts = products || [];
    App._activeFilter = 'all';

    // Build filter pills
    const cats = [...new Set((products || []).map(p => p.category))].filter(Boolean);
    const filtersEl = el('cat-filters');
    if (filtersEl) {
      filtersEl.innerHTML = [
        `<button class="filter-pill active" id="pill-all" onclick="App.setFilter('all')">${t('all_categories')}</button>`,
        ...cats.map(c => {
          const catObj = CATEGORIES.find(x => x.key === c);
          const label = catObj ? catLabel(c) : c;
          return `<button class="filter-pill" id="pill-${c}" onclick="App.setFilter('${c}')">${label}</button>`;
        })
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
    const cat    = App._activeFilter || 'all';
    let filtered = App._allProducts || [];
    if (cat !== 'all') filtered = filtered.filter(p => p.category === cat);
    if (search) filtered = filtered.filter(p => p.product_name.toLowerCase().includes(search));
    this.renderProductCards(filtered);
  },

  renderProductCards(products) {
    const list = el('product-list');
    if (!list) return;

    if (!products || products.length === 0) {
      list.innerHTML = `
        <div style="grid-column:1/-1" class="empty-state">
          <div class="empty-icon">🏪</div>
          <div class="empty-title">${t('err_no_products')}</div>
          <div class="empty-sub">${State.lang === 'sw' ? 'Wasambazaji bado hawajakuweka bidhaa' : 'Distributors have not listed any products yet'}</div>
        </div>`;
      return;
    }

    const catIcon = (c) => CATEGORIES.find(x => x.key === c)?.icon || '📦';

    list.innerHTML = products.map(p => {
      const qty   = State.cart[p.id]?.qty || 0;
      const inCart = qty > 0;
      const stockClass = p.stock_qty <= 0 ? 'stock-out' : p.stock_qty < 10 ? 'stock-low' : 'stock-ok';
      const stockText  = p.stock_qty <= 0 ? t('out_of_stock') : p.stock_qty < 10 ? t('low_stock') : t('in_stock');

      return `
        <div class="product-card ${inCart ? 'in-cart' : ''}" id="pcard-${p.id}">
          <span class="stock-badge ${stockClass}">${stockText}</span>
          <span class="product-emoji">${catIcon(p.category)}</span>
          <div class="product-category">${catLabel(p.category)}</div>
          <div class="product-name">${p.product_name}</div>
          <div class="product-unit">${t('unit')}: ${p.selling_unit || '—'}</div>
          <div class="product-footer">
            <span class="product-price">${fmt(p.price)}</span>
            ${p.stock_qty <= 0
              ? `<span style="font-size:0.72rem;color:var(--red);font-weight:700">${t('out_of_stock')}</span>`
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

  // ── CART ────────────────────────────────────────────

  addToCart(product) {
    const p = typeof product === 'string' ? JSON.parse(product) : product;
    if (!State.cart[p.id]) {
      State.cart[p.id] = { product: p, qty: 0 };
    }
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

    // FAB badge
    setText('cart-count', count);
    el('cart-fab').style.display = count > 0 || State.activePage === 'marketplace' ? 'flex' : 'none';

    // Cart subtitle
    setText('cart-subtitle', `${count} ${t('cart_sub')}`);

    // Total
    setText('cart-total', fmt(total));

    // Items list
    const list = el('cart-items-list');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-title">${t('cart_empty')}</div></div>`;
      return;
    }

    const catIcon = (c) => CATEGORIES.find(x => x.key === c)?.icon || '📦';

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
    if (items.length === 0) { showToast(t('err_cart_empty'), 'error'); return; }

    // Group by distributor
    const byDist = {};
    items.forEach(({ product: p, qty }) => {
      if (!byDist[p.distributor_id]) byDist[p.distributor_id] = [];
      byDist[p.distributor_id].push({ product: p, qty });
    });

    setLoading('place-order-btn', 'place-order-text', true, '');

    let hasError = false;

    for (const [distId, distItems] of Object.entries(byDist)) {
      const total = distItems.reduce((s, x) => s + x.product.price * x.qty, 0);
      const ref   = genId();

      const { data: order, error: oErr } = await supabase
        .from('orders')
        .insert([{
          order_ref:      ref,
          retailer_id:    State.user.id,
          distributor_id: distId,
          total_price:    total,
          status:         'pending',
          items_count:    distItems.reduce((s, x) => s + x.qty, 0),
        }])
        .select()
        .single();

      if (oErr) { hasError = true; continue; }

      // Insert order items
      const orderItems = distItems.map(({ product: p, qty }) => ({
        order_id:     order.id,
        product_id:   p.id,
        product_name: p.product_name,
        qty,
        unit_price:   p.price,
        subtotal:     p.price * qty,
      }));

      await supabase.from('order_items').insert(orderItems);

      // Deduct stock
      for (const { product: p, qty } of distItems) {
        await supabase
          .from('products')
          .update({ stock_qty: Math.max(0, p.stock_qty - qty) })
          .eq('id', p.id);
      }
    }

    setLoading('place-order-btn', 'place-order-text', false, t('place_order'));

    if (hasError) { showToast(t('err_generic'), 'error'); return; }

    // Clear cart
    State.cart = {};
    el('cart-panel')?.classList.remove('open');

    // Show success
    this.renderSuccessScreen();
    showToast(t('toast_order_placed'), 'success');
  },

  renderSuccessScreen() {
    const ref = genId();
    setHtml('app-view', `
      <div class="success-screen">
        <div class="success-icon-wrap">✅</div>
        <div class="success-title">${t('success_title')}</div>
        <div class="success-sub">${t('success_sub')}</div>
        <div class="success-order-id">${ref}</div>
        <button class="btn-primary" style="max-width:240px" onclick="App.navigate('marketplace')">
          ${State.lang === 'sw' ? 'Rudi Sokoni' : 'Back to Marketplace'}
        </button>
      </div>
    `);
  },

  // ── RETAILER: MY ORDERS ──────────────────────────────

  async renderMyOrders() {
    setHtml('app-view', `<div style="text-align:center;padding:3rem;color:var(--muted)"><span class="spinner" style="border-color:rgba(22,163,74,0.3);border-top-color:var(--green);width:28px;height:28px"></span></div>`);

    const { data, error } = await supabase
      .from('orders')
      .select(`*, distributor:profiles!orders_distributor_id_fkey(store_name)`)
      .eq('retailer_id', State.user.id)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      setHtml('app-view', `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <div class="empty-title">${t('no_orders')}</div>
          <div class="empty-sub">${t('no_orders_sub')}</div>
          <button class="btn-primary" style="max-width:200px;margin-top:1.5rem" onclick="App.navigate('marketplace')">
            ${State.lang === 'sw' ? 'Nenda Sokoni' : 'Go to Marketplace'}
          </button>
        </div>`);
      return;
    }

    const totalSpent = data.reduce((s, o) => s + Number(o.total_price), 0);
    const pending    = data.filter(o => o.status === 'pending').length;

    setHtml('app-view', `
      <div class="stats-row" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card green">
          <div class="stat-label">${t('stat_total_orders')}</div>
          <div class="stat-value">${data.length}</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-label">${t('stat_pending_orders')}</div>
          <div class="stat-value" style="color:var(--amber)">${pending}</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-label">${t('stat_total_spent')}</div>
          <div class="stat-value" style="font-size:1.2rem">${fmt(totalSpent)}</div>
        </div>
      </div>
      <div class="card" style="margin-top:1.5rem">
        <table class="orders-table">
          <thead>
            <tr>
              <th>${t('order_id')}</th>
              <th>${t('distributor')}</th>
              <th>${t('items')}</th>
              <th>${t('total')}</th>
              <th>${t('status')}</th>
              <th>${t('date')}</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(o => `
              <tr>
                <td><span style="font-family:monospace;font-size:0.8rem;color:var(--muted)">${o.order_ref}</span></td>
                <td><strong>${o.distributor?.store_name || '—'}</strong></td>
                <td>${o.items_count || '—'}</td>
                <td><strong style="color:var(--green)">${fmt(o.total_price)}</strong></td>
                <td>${this.statusPill(o.status)}</td>
                <td style="color:var(--muted);font-size:0.8rem">${new Date(o.created_at).toLocaleDateString(State.lang === 'sw' ? 'sw-TZ' : 'en-GB')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `);
  },

  // ── DISTRIBUTOR: DASHBOARD ──────────────────────────

  async renderDashboard() {
    setHtml('app-view', `<div style="text-align:center;padding:3rem;color:var(--muted)"><span class="spinner" style="border-color:rgba(22,163,74,0.3);border-top-color:var(--green);width:28px;height:28px"></span></div>`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [{ data: orders }, { data: products }, { data: retailers }] = await Promise.all([
      supabase.from('orders').select('*').eq('distributor_id', State.user.id).gte('created_at', today.toISOString()),
      supabase.from('products').select('*').eq('distributor_id', State.user.id),
      supabase.from('orders').select('retailer_id').eq('distributor_id', State.user.id),
    ]);

    const todayOrders = orders || [];
    const pending     = todayOrders.filter(o => o.status === 'pending').length;
    const revenue     = todayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_price), 0);
    const uniqueRet   = new Set((retailers || []).map(r => r.retailer_id)).size;

    // Update badges
    this.updateOrderBadge();

    setHtml('app-view', `
      <div class="stats-row">
        <div class="stat-card green">
          <div class="stat-label">${t('stat_orders_today')}</div>
          <div class="stat-value">${todayOrders.length}</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-label">${t('stat_pending')}</div>
          <div class="stat-value" style="color:var(--amber)">${pending}</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-label">${t('stat_revenue')}</div>
          <div class="stat-value" style="font-size:1.2rem">${fmt(revenue)}</div>
        </div>
        <div class="stat-card red">
          <div class="stat-label">${t('stat_retailers')}</div>
          <div class="stat-value">${uniqueRet}</div>
        </div>
      </div>

      <div class="section-header" style="margin-top:1rem">
        <span class="section-title">${t('nav_orders')}</span>
        <button class="section-action" onclick="App.navigate('orders')">${State.lang === 'sw' ? 'Angalia Zote →' : 'View All →'}</button>
      </div>

      ${todayOrders.length === 0
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
              <tbody id="dash-orders-body"></tbody>
            </table>
          </div>`
      }
    `);

    if (todayOrders.length > 0) {
      this.renderOrderRows('dash-orders-body', todayOrders.slice(0, 5));
    }
  },

  // ── DISTRIBUTOR: INCOMING ORDERS ────────────────────

  async renderDistOrders() {
    setHtml('app-view', `<div style="text-align:center;padding:3rem;color:var(--muted)"><span class="spinner" style="border-color:rgba(22,163,74,0.3);border-top-color:var(--green);width:28px;height:28px"></span></div>`);

    const { data, error } = await supabase
      .from('orders')
      .select(`*, retailer:profiles!orders_retailer_id_fkey(store_name, location, phone_number)`)
      .eq('distributor_id', State.user.id)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      setHtml('app-view', `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">${t('no_orders')}</div><div class="empty-sub">${t('no_orders_sub')}</div></div>`);
      return;
    }

    setHtml('app-view', `
      <div class="card">
        <table class="orders-table">
          <thead>
            <tr>
              <th>${t('retailer')}</th>
              <th>${t('order_id')}</th>
              <th>${t('items')}</th>
              <th>${t('total')}</th>
              <th>${t('status')}</th>
              <th>${t('date')}</th>
              <th>${t('action')}</th>
            </tr>
          </thead>
          <tbody id="dist-orders-body"></tbody>
        </table>
      </div>
    `);

    this.renderOrderRowsFull('dist-orders-body', data);
    this.updateOrderBadge();
  },

  renderOrderRows(tbodyId, orders) {
    const tbody = el(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><span style="font-family:monospace;font-size:0.8rem;color:var(--muted)">${o.order_ref}</span></td>
        <td>${o.items_count || '—'}</td>
        <td><strong style="color:var(--green)">${fmt(o.total_price)}</strong></td>
        <td>${this.statusPill(o.status)}</td>
        <td>${this.actionButtons(o)}</td>
      </tr>
    `).join('');
  },

  renderOrderRowsFull(tbodyId, orders) {
    const tbody = el(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = orders.map(o => `
      <tr id="order-row-${o.id}">
        <td>
          <div style="font-weight:700;font-size:0.875rem">${o.retailer?.store_name || '—'}</div>
          <div style="font-size:0.75rem;color:var(--muted)">📍 ${o.retailer?.location || ''}</div>
          ${o.retailer?.phone_number ? `<div style="font-size:0.75rem;color:var(--muted)">📞 ${o.retailer.phone_number}</div>` : ''}
        </td>
        <td><span style="font-family:monospace;font-size:0.78rem;color:var(--muted)">${o.order_ref}</span></td>
        <td>${o.items_count || '—'}</td>
        <td><strong style="color:var(--green)">${fmt(o.total_price)}</strong></td>
        <td id="status-${o.id}">${this.statusPill(o.status)}</td>
        <td style="color:var(--muted);font-size:0.78rem">${new Date(o.created_at).toLocaleDateString(State.lang === 'sw' ? 'sw-TZ' : 'en-GB')}</td>
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
    const [cls, icon, label] = map[status] || map['pending'];
    return `<span class="status-pill ${cls}">${icon} ${label}</span>`;
  },

  actionButtons(order) {
    if (State.user.role !== 'distributor') return '';
    if (order.status === 'pending')
      return `<div style="display:flex;gap:6px">
        <button class="action-btn confirm" onclick="App.updateOrderStatus('${order.id}','confirmed')">${t('confirm')}</button>
        <button class="action-btn cancel" onclick="App.updateOrderStatus('${order.id}','cancelled')">${t('cancel')}</button>
      </div>`;
    if (order.status === 'confirmed')
      return `<button class="action-btn deliver" onclick="App.updateOrderStatus('${order.id}','delivered')">${t('deliver')}</button>`;
    return `<span style="font-size:0.75rem;color:var(--muted)">—</span>`;
  },

  async updateOrderStatus(orderId, status) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) { showToast(t('err_generic'), 'error'); return; }

    const msg = status === 'confirmed' ? t('toast_order_confirmed') : status === 'delivered' ? t('toast_order_delivered') : '✅ Done';
    showToast(msg, 'success');

    // Update row in place
    const statusCell = el(`status-${orderId}`);
    const actionsCell = el(`actions-${orderId}`);
    if (statusCell)  statusCell.innerHTML  = this.statusPill(status);
    if (actionsCell) actionsCell.innerHTML = this.actionButtons({ id: orderId, status });

    this.updateOrderBadge();
    if (State.activePage === 'dashboard') this.renderDashboard();
  },

  // ── DISTRIBUTOR: PRODUCTS ───────────────────────────

  async renderProducts() {
    setHtml('app-view', `
      <div style="display:grid;grid-template-columns:340px 1fr;gap:1.5rem;align-items:start">
        <div class="card card-pad">
          <div class="section-title" style="margin-bottom:1.25rem">${t('add_product')}</div>
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
              <input class="form-input" id="p-unit" placeholder="${State.lang === 'sw' ? 'mfano: Krate (24), Mfuko, Karton' : 'e.g. Crate (24), Bag, Carton'}" />
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
          <div class="section-title" style="margin-bottom:1rem">${State.lang === 'sw' ? 'Bidhaa Zilizowekwa Sokoni' : 'Listed Products'}</div>
          <div id="my-products-list">
            <div style="text-align:center;padding:2rem;color:var(--muted)"><span class="spinner" style="border-color:rgba(22,163,74,0.3);border-top-color:var(--green);width:24px;height:24px"></span></div>
          </div>
        </div>
      </div>
    `);

    this.loadMyProducts();
  },

  async loadMyProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('distributor_id', State.user.id)
      .order('created_at', { ascending: false });

    const list = el('my-products-list');
    if (!list) return;

    if (!data || data.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">🏷️</div><div class="empty-title">${t('no_products')}</div><div class="empty-sub">${t('no_products_sub')}</div></div>`;
      return;
    }

    const catIcon = (c) => CATEGORIES.find(x => x.key === c)?.icon || '📦';

    list.innerHTML = `<div class="inventory-grid">` + data.map(p => `
      <div class="inventory-card">
        <span class="inv-icon">${catIcon(p.category)}</span>
        <div style="flex:1;min-width:0">
          <div class="inv-name">${p.product_name}</div>
          <div class="inv-meta">${fmt(p.price)} · ${p.selling_unit || '—'}</div>
          <div class="inv-meta" style="margin-top:2px">${catLabel(p.category)}</div>
        </div>
        <div style="text-align:right">
          <div class="inv-stock ${p.stock_qty < 10 ? 'style="color:var(--amber)"' : ''}">${p.stock_qty}</div>
          <div style="font-size:0.65rem;color:var(--muted);margin-top:2px">${State.lang === 'sw' ? 'stoki' : 'in stock'}</div>
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

    setLoading('add-product-btn', 'add-product-text', true, '');

    const { error } = await supabase.from('products').insert([payload]);

    setLoading('add-product-btn', 'add-product-text', false, t('btn_add_product'));

    if (error) { showToast(t('err_generic'), 'error'); return; }

    showToast(t('toast_product_added'), 'success');
    e.target.reset();
    this.loadMyProducts();
  },

  // ── DISTRIBUTOR: INVENTORY ──────────────────────────

  async renderInventory() {
    setHtml('app-view', `<div style="text-align:center;padding:3rem;color:var(--muted)"><span class="spinner" style="border-color:rgba(22,163,74,0.3);border-top-color:var(--green);width:28px;height:28px"></span></div>`);

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('distributor_id', State.user.id)
      .order('stock_qty', { ascending: true });

    if (!data || data.length === 0) {
      setHtml('app-view', `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">${t('no_products')}</div><div class="empty-sub">${t('no_products_sub')}</div></div>`);
      return;
    }

    const catIcon = (c) => CATEGORIES.find(x => x.key === c)?.icon || '📦';

    setHtml('app-view', `
      <div class="card">
        <table class="orders-table">
          <thead>
            <tr>
              <th>${t('product_name')}</th>
              <th>${t('product_category')}</th>
              <th>${t('product_price')}</th>
              <th>${t('product_unit')}</th>
              <th>${t('product_qty')}</th>
              <th>${t('status')}</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(p => `
              <tr>
                <td><strong>${catIcon(p.category)} ${p.product_name}</strong></td>
                <td>${catLabel(p.category)}</td>
                <td style="color:var(--green);font-weight:700">${fmt(p.price)}</td>
                <td style="color:var(--muted)">${p.selling_unit || '—'}</td>
                <td><strong>${p.stock_qty}</strong></td>
                <td>${p.stock_qty <= 0
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

  // ── DISTRIBUTOR: RETAILERS ──────────────────────────

  async renderRetailers() {
    setHtml('app-view', `<div style="text-align:center;padding:3rem;color:var(--muted)"><span class="spinner" style="border-color:rgba(22,163,74,0.3);border-top-color:var(--green);width:28px;height:28px"></span></div>`);

    const { data: orders } = await supabase
      .from('orders')
      .select(`*, retailer:profiles!orders_retailer_id_fkey(id, store_name, location, phone_number)`)
      .eq('distributor_id', State.user.id);

    if (!orders || orders.length === 0) {
      setHtml('app-view', `<div class="empty-state"><div class="empty-icon">🏪</div><div class="empty-title">${t('no_retailers')}</div><div class="empty-sub">${t('no_retailers_sub')}</div></div>`);
      return;
    }

    // Aggregate by retailer
    const map = {};
    orders.forEach(o => {
      const r = o.retailer;
      if (!r) return;
      if (!map[r.id]) {
        map[r.id] = { ...r, totalOrders: 0, totalSpent: 0, lastOrder: o.created_at };
      }
      map[r.id].totalOrders++;
      map[r.id].totalSpent += Number(o.total_price);
      if (new Date(o.created_at) > new Date(map[r.id].lastOrder)) map[r.id].lastOrder = o.created_at;
    });

    const retailers = Object.values(map);

    setHtml('app-view', `
      <div class="retailer-grid">
        ${retailers.map(r => `
          <div class="retailer-card">
            <div class="retailer-card-header">
              <div class="retailer-avatar">🏪</div>
              <div>
                <div class="retailer-card-name">${r.store_name}</div>
                <div class="retailer-card-loc">📍 ${r.location || '—'}</div>
                ${r.phone_number ? `<div class="retailer-card-loc">📞 ${r.phone_number}</div>` : ''}
              </div>
            </div>
            <div class="retailer-stats-row">
              <div class="r-stat">
                <div class="r-stat-val">${r.totalOrders}</div>
                <div class="r-stat-lbl">${t('total_orders')}</div>
              </div>
              <div class="r-stat">
                <div class="r-stat-val" style="font-size:0.78rem">${fmt(r.totalSpent)}</div>
                <div class="r-stat-lbl">${t('total_spent')}</div>
              </div>
              <div class="r-stat">
                <div class="r-stat-val" style="font-size:0.72rem">${new Date(r.lastOrder).toLocaleDateString(State.lang === 'sw' ? 'sw-TZ' : 'en-GB')}</div>
                <div class="r-stat-lbl">${t('last_order')}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `);
  },
};

// ═══════════════════════════════════════════════════════
//  GLOBAL BINDINGS
// ═══════════════════════════════════════════════════════

window.App = App;

// Close notif dropdown on outside click
document.addEventListener('click', (e) => {
  if (!el('notif-bell')?.contains(e.target) && !el('notif-dropdown')?.contains(e.target)) {
    State.notifOpen = false;
    el('notif-dropdown')?.classList.remove('open');
  }
});
