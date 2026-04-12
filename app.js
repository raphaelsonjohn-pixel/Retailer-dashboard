/**
 * BomaWave v2.0 — Complete App Controller
 * POS · Admin · Mobile Nav · Image Upload · Location
 */
import { supabase } from './supabase.js';

// ═══════════════════════════════════════════════════════════
//  TRANSLATIONS
// ═══════════════════════════════════════════════════════════
const T = {
sw:{
  // Onboarding
  step2_eye:'Hatua 2',step2_title:'Wewe ni nani?',
  role_retailer:'Duka (Retailer)',role_retailer_desc:'Naagiza bidhaa kwa duka langu',
  role_dist:'Msambazaji',role_dist_desc:'Nasambaza bidhaa kwa maduka',
  back:'← Rudi Nyuma',tab_register:'Akaunti Mpya',tab_login:'Ingia',
  step3_eye:'Hatua 3',step3_title:'Tengeneza Akaunti',
  lbl_store:'Jina la Duka',lbl_user:'Username',lbl_phone:'Simu',
  lbl_region:'Mkoa',lbl_district:'Wilaya',lbl_ward:'Kata',lbl_street:'Mtaa',
  lbl_coverage:'Maeneo ya Usambazaji',lbl_cats:'Aina za Bidhaa',
  lbl_pass:'Nywila',lbl_pass2:'Thibitisha Nywila',
  btn_register:'Kamilisha Usajili',btn_loading:'Subiri...',
  step4_eye:'Ingia',step4_title:'Karibu Tena!',
  lbl_login_user:'Username',lbl_login_pass:'Nywila',btn_login:'Ingia',
  lbl_logout:'Toka',
  // Nav
  nav_home:'Nyumbani',nav_marketplace:'Soko',nav_records:'Kumbukumbu',
  nav_my_orders:'Maagizo Yangu',nav_dashboard:'Dashibodi',
  nav_orders:'Maagizo Yangu',nav_products:'Bidhaa Zangu',
  nav_inventory:'Hifadhi',nav_retailers:'Maduka Yangu',nav_more:'Zaidi',
  nav_users:'Watumiaji',nav_all_orders:'Maagizo Yote',nav_analytics:'Takwimu',
  // Topbar
  topbar_home:'Nyumbani',topbar_sub_home:'Muhtasari wa leo',
  topbar_marketplace:'Soko la Bidhaa',topbar_sub_market:'Agiza bidhaa kutoka kwa wasambazaji',
  topbar_records:'Kumbukumbu za Biashara',topbar_sub_records:'Mauzo, gharama, madeni na ripoti',
  topbar_my_orders:'Maagizo Yangu',topbar_sub_my_orders:'Historia ya maagizo yako',
  topbar_dashboard:'Dashibodi',topbar_sub_dash:'Muhtasari wa biashara yako leo',
  topbar_orders:'Maagizo Yaliyoingia',topbar_sub_orders:'Maagizo mapya kutoka kwa maduka',
  topbar_products:'Bidhaa Zangu',topbar_sub_products:'Simamia bidhaa unazouza',
  topbar_inventory:'Hifadhi (Stoki)',topbar_sub_inventory:'Angalia stoki iliyobaki',
  topbar_retailers:'Maduka Yangu',topbar_sub_retailers:'Maduka yanayonunua kwako',
  topbar_users:'Watumiaji Wote',topbar_sub_users:'Simamia watumiaji wa platform',
  topbar_all_orders:'Maagizo Yote',topbar_sub_all_orders:'Maagizo yote kwenye platform',
  topbar_analytics:'Takwimu za Platform',topbar_sub_analytics:'Mwelekeo na uchambuzi',
  // Notifications
  notif_title:'Arifa',notif_empty:'Hakuna arifa',
  notif_new_order:'Agizo Jipya!',notif_order_conf:'Agizo Limethibitishwa',
  notif_order_del:'Bidhaa Zimefikia',
  // Stats
  stat_orders_today:'Maagizo Leo',stat_pending:'Yanasubiri',
  stat_revenue:'Mapato Leo',stat_retailers:'Maduka Yaliyonunua',
  stat_total_orders:'Maagizo Yote',stat_total_spent:'Jumla Nililotumia',
  stat_distributors:'Wasambazaji',stat_sales_today:'Mauzo Leo',
  stat_profit_today:'Faida Leo',stat_debts:'Madeni',
  stat_total_users:'Watumiaji Wote',stat_total_revenue:'Mapato Platform',
  stat_active_dist:'Wasambazaji Hai',stat_active_ret:'Maduka Hai',
  // Marketplace
  all_categories:'Zote',add_to_cart:'Ongeza',
  out_of_stock:'Haipatikani',low_stock:'Inakwisha',in_stock:'Inapatikana',
  unit:'Kitengo',price:'Bei',search_products:'Tafuta bidhaa...',
  // Cart
  cart_title:'Agizo Lako',cart_sub:'bidhaa zimeongezwa',cart_total:'Jumla',
  place_order:'Tuma Agizo',cart_empty:'Bado hujachagua bidhaa',
  cart_payment:'Malipo yanafanywa moja kwa moja na Msambazaji baada ya kuthibitishwa.',
  // Orders
  order_id:'Namba ya Agizo',retailer:'Duka',distributor:'Msambazaji',
  items:'Bidhaa',total:'Jumla',status:'Hali',date:'Tarehe',action:'Hatua',
  confirm:'Thibitisha',deliver:'Tuma Bidhaa',cancel:'Ghairi',
  pending:'Inasubiri',confirmed:'Imethibitishwa',delivered:'Imefikia',cancelled:'Imeghairiwa',
  no_orders:'Hakuna maagizo bado',no_orders_sub:'Maagizo mapya yataonekana hapa',
  // Products
  add_product:'Weka Bidhaa Sokoni',product_name:'Jina la Bidhaa',
  product_category:'Aina',product_price:'Bei ya Kuuzia (TZS)',
  product_cost:'Bei ya Kununulia (TZS)',product_unit:'Kitengo',
  product_qty:'Stoki',product_desc:'Maelezo (si lazima)',
  product_image:'Picha ya Bidhaa',btn_add_product:'Weka Sokoni',
  no_products:'Bado hujaweka bidhaa',no_products_sub:'Ongeza bidhaa yako ya kwanza',
  // Inventory
  update_stock:'Sasisha Stoki',stock_qty:'Stoki',
  // Success
  success_title:'Agizo Limetumwa!',
  success_sub:'Msambazaji ataliangalia hivi karibuni.',
  // POS Records
  pos_sales:'Mauzo',pos_expenses:'Gharama',pos_debts:'Madeni',pos_reports:'Ripoti',
  add_sale:'Rekodi Uuzaji',sale_product:'Bidhaa Iliyouzwa',sale_qty:'Idadi',
  sale_buying_price:'Bei ya Kununulia (TZS)',sale_selling_price:'Bei ya Kuuzia (TZS)',
  sale_date:'Tarehe',sale_notes:'Maelezo (si lazima)',btn_save_sale:'Hifadhi Uuzaji',
  add_expense:'Rekodi Gharama',expense_cat:'Aina ya Gharama',
  expense_desc:'Maelezo',expense_amount:'Kiasi (TZS)',expense_date:'Tarehe',
  btn_save_expense:'Hifadhi Gharama',
  add_debt:'Rekodi Deni',debt_customer:'Jina la Mteja',debt_phone:'Simu ya Mteja',
  debt_amount:'Kiasi cha Deni (TZS)',debt_desc:'Bidhaa / Maelezo',
  debt_due:'Tarehe ya Kulipa',btn_save_debt:'Hifadhi Deni',
  btn_mark_paid:'Lipa',debt_remaining:'Kilichobaki',
  report_period:'Kipindi cha Ripoti',period_today:'Leo',period_week:'Wiki Hii',
  period_month:'Mwezi Huu',period_custom:'Kipindi Maalum',
  report_from:'Kuanzia',report_to:'Hadi',btn_generate:'Tengeneza Ripoti',
  btn_print:'Chapisha / PDF',
  report_sales_summary:'Muhtasari wa Mauzo',report_expense_summary:'Muhtasari wa Gharama',
  report_profit_summary:'Muhtasari wa Faida/Hasara',report_top_products:'Bidhaa Zinazotoka Zaidi',
  report_debts_summary:'Muhtasari wa Madeni',
  total_revenue:'Mapato Yote',total_expenses:'Gharama Zote',
  gross_profit:'Faida Ghafi',net_profit:'Faida Halisi',
  total_debts:'Madeni Yote',paid_debts:'Yaliyolipwa',unpaid_debts:'Ambayo Hayajalipwa',
  no_sales:'Hakuna mauzo bado',no_expenses:'Hakuna gharama bado',no_debts:'Hakuna madeni bado',
  product_ranking:'Nafasi',times_sold:'Mara Zilizouzwa',
  // Expense categories
  exp_rent:'Kodi ya Duka',exp_transport:'Nauli / Usafiri',exp_staff:'Mshahara',
  exp_utilities:'Umeme / Maji',exp_packaging:'Vifungashio',exp_other:'Nyingine',
  // Admin
  approve:'Ruhusu',suspend:'Simamisha',all_users:'Watumiaji Wote',
  user_type:'Aina',location:'Eneo',joined:'Alijiunga',
  platform_gmv:'Jumla ya Mauzo',platform_orders:'Maagizo Yote',
  // Errors
  err_pass_match:'Nywila hazifanani.',err_username:'Username tayari lipo.',
  err_login:'Username au nywila si sahihi.',err_generic:'Kosa limetokea. Jaribu tena.',
  err_cart_empty:'Chagua bidhaa kwanza.',err_select_location:'Chagua mkoa na wilaya kwanza.',
  // Toast
  toast_order_placed:'Agizo limetumwa!',toast_order_confirmed:'Agizo limethibitishwa.',
  toast_order_delivered:'Bidhaa zimetumwa.',toast_product_added:'Bidhaa imewekwa sokoni.',
  toast_new_order:'Agizo jipya limeingia!',toast_stock_updated:'Stoki imesasishwa.',
  toast_sale_saved:'Uuzaji umehifadhiwa.',toast_expense_saved:'Gharama imehifadhiwa.',
  toast_debt_saved:'Deni limehifadhiwa.',toast_debt_paid:'Deni limelipwa.',
  // Misc
  total_orders:'Maagizo',total_spent:'Jumla (TZS)',last_order:'Agizo la Mwisho',
  view_all:'Angalia Zote →',go_market:'Nenda Sokoni',
  cat_beverages:'Vinywaji',cat_flour:'Unga na Nafaka',cat_oil:'Mafuta',
  cat_sugar:'Sukari na Chumvi',cat_soap:'Sabuni',cat_personal:'Usafi wa Mwili',
  cat_dairy:'Maziwa',cat_other:'Nyingine',
  upload_photo:'Piga Picha / Chagua Picha',change_photo:'Badilisha Picha',
  img_uploading:'Inapakia picha...',
  // More menu
  more_menu:'Menyu Zaidi',
},
en:{
  step2_eye:'Step 2',step2_title:'Who are you?',
  role_retailer:'Shop (Retailer)',role_retailer_desc:'I order goods for my shop',
  role_dist:'Distributor',role_dist_desc:'I supply goods to shops',
  back:'← Go Back',tab_register:'New Account',tab_login:'Sign In',
  step3_eye:'Step 3',step3_title:'Create Account',
  lbl_store:'Store / Business Name',lbl_user:'Username',lbl_phone:'Phone',
  lbl_region:'Region',lbl_district:'District',lbl_ward:'Ward',lbl_street:'Street',
  lbl_coverage:'Coverage Area',lbl_cats:'Product Categories',
  lbl_pass:'Password',lbl_pass2:'Confirm Password',
  btn_register:'Create Account',btn_loading:'Please wait...',
  step4_eye:'Sign In',step4_title:'Welcome Back!',
  lbl_login_user:'Username',lbl_login_pass:'Password',btn_login:'Sign In',
  lbl_logout:'Sign Out',
  nav_home:'Home',nav_marketplace:'Marketplace',nav_records:'Records',
  nav_my_orders:'My Orders',nav_dashboard:'Dashboard',
  nav_orders:'Orders',nav_products:'My Products',
  nav_inventory:'Inventory',nav_retailers:'My Retailers',nav_more:'More',
  nav_users:'Users',nav_all_orders:'All Orders',nav_analytics:'Analytics',
  topbar_home:'Home',topbar_sub_home:"Today's overview",
  topbar_marketplace:'Marketplace',topbar_sub_market:'Order goods from distributors',
  topbar_records:'Business Records',topbar_sub_records:'Sales, expenses, debts and reports',
  topbar_my_orders:'My Orders',topbar_sub_my_orders:'Your order history',
  topbar_dashboard:'Dashboard',topbar_sub_dash:"Today's business overview",
  topbar_orders:'Incoming Orders',topbar_sub_orders:'New orders from shops',
  topbar_products:'My Products',topbar_sub_products:'Manage your listed products',
  topbar_inventory:'Inventory',topbar_sub_inventory:'Track remaining stock',
  topbar_retailers:'My Retailers',topbar_sub_retailers:'Shops that buy from you',
  topbar_users:'All Users',topbar_sub_users:'Manage platform users',
  topbar_all_orders:'All Orders',topbar_sub_all_orders:'All orders on the platform',
  topbar_analytics:'Platform Analytics',topbar_sub_analytics:'Trends and insights',
  notif_title:'Notifications',notif_empty:'No notifications',
  notif_new_order:'New Order!',notif_order_conf:'Order Confirmed',notif_order_del:'Order Delivered',
  stat_orders_today:'Orders Today',stat_pending:'Pending',
  stat_revenue:"Today's Revenue",stat_retailers:'Active Retailers',
  stat_total_orders:'Total Orders',stat_total_spent:'Total Spent',
  stat_distributors:'Distributors',stat_sales_today:'Sales Today',
  stat_profit_today:"Today's Profit",stat_debts:'Outstanding Debts',
  stat_total_users:'Total Users',stat_total_revenue:'Platform Revenue',
  stat_active_dist:'Active Distributors',stat_active_ret:'Active Retailers',
  all_categories:'All',add_to_cart:'Add',
  out_of_stock:'Out of Stock',low_stock:'Low Stock',in_stock:'In Stock',
  unit:'Unit',price:'Price',search_products:'Search products...',
  cart_title:'Your Order',cart_sub:'items added',cart_total:'Total',
  place_order:'Place Order',cart_empty:'No items selected yet',
  cart_payment:'Payment is made directly to the distributor after confirmation.',
  order_id:'Order ID',retailer:'Shop',distributor:'Distributor',
  items:'Items',total:'Total',status:'Status',date:'Date',action:'Action',
  confirm:'Confirm',deliver:'Mark Delivered',cancel:'Cancel',
  pending:'Pending',confirmed:'Confirmed',delivered:'Delivered',cancelled:'Cancelled',
  no_orders:'No orders yet',no_orders_sub:'New orders will appear here',
  add_product:'List a Product',product_name:'Product Name',
  product_category:'Category',product_price:'Selling Price (TZS)',
  product_cost:'Buying/Cost Price (TZS)',product_unit:'Selling Unit',
  product_qty:'Stock Quantity',product_desc:'Description (optional)',
  product_image:'Product Image',btn_add_product:'List Product',
  no_products:'No products listed yet',no_products_sub:'Add your first product above',
  update_stock:'Update Stock',stock_qty:'Stock',
  success_title:'Order Placed!',success_sub:'The distributor will review your order shortly.',
  pos_sales:'Sales',pos_expenses:'Expenses',pos_debts:'Debts',pos_reports:'Reports',
  add_sale:'Record a Sale',sale_product:'Product Sold',sale_qty:'Quantity',
  sale_buying_price:'Buying Price (TZS)',sale_selling_price:'Selling Price (TZS)',
  sale_date:'Date',sale_notes:'Notes (optional)',btn_save_sale:'Save Sale',
  add_expense:'Record an Expense',expense_cat:'Expense Category',
  expense_desc:'Description',expense_amount:'Amount (TZS)',expense_date:'Date',
  btn_save_expense:'Save Expense',
  add_debt:'Record a Debt',debt_customer:'Customer Name',debt_phone:'Customer Phone',
  debt_amount:'Debt Amount (TZS)',debt_desc:'Items / Description',
  debt_due:'Due Date',btn_save_debt:'Save Debt',
  btn_mark_paid:'Mark Paid',debt_remaining:'Remaining',
  report_period:'Report Period',period_today:'Today',period_week:'This Week',
  period_month:'This Month',period_custom:'Custom Range',
  report_from:'From',report_to:'To',btn_generate:'Generate Report',btn_print:'Print / Save PDF',
  report_sales_summary:'Sales Summary',report_expense_summary:'Expense Summary',
  report_profit_summary:'Profit & Loss',report_top_products:'Top Selling Products',
  report_debts_summary:'Debts Summary',
  total_revenue:'Total Revenue',total_expenses:'Total Expenses',
  gross_profit:'Gross Profit',net_profit:'Net Profit',
  total_debts:'Total Debts',paid_debts:'Paid',unpaid_debts:'Outstanding',
  no_sales:'No sales recorded yet',no_expenses:'No expenses recorded yet',no_debts:'No debts recorded yet',
  product_ranking:'Rank',times_sold:'Times Sold',
  exp_rent:'Shop Rent',exp_transport:'Transport',exp_staff:'Staff Salary',
  exp_utilities:'Utilities',exp_packaging:'Packaging',exp_other:'Other',
  approve:'Approve',suspend:'Suspend',all_users:'All Users',
  user_type:'Type',location:'Location',joined:'Joined',
  platform_gmv:'Total GMV',platform_orders:'Total Orders',
  total_orders:'Orders',total_spent:'Total (TZS)',last_order:'Last Order',
  view_all:'View All →',go_market:'Go to Marketplace',
  cat_beverages:'Beverages',cat_flour:'Flour & Grains',cat_oil:'Cooking Oil',
  cat_sugar:'Sugar & Salt',cat_soap:'Soap & Detergents',cat_personal:'Personal Care',
  cat_dairy:'Dairy',cat_other:'Other',
  upload_photo:'Take Photo / Choose Image',change_photo:'Change Photo',
  img_uploading:'Uploading image...',more_menu:'More Menu',
  err_pass_match:'Passwords do not match.',err_username:'Username already taken.',
  err_login:'Incorrect username or password.',err_generic:'Something went wrong. Try again.',
  err_cart_empty:'Please select at least one product.',err_select_location:'Please select region and district.',
  toast_order_placed:'Order placed!',toast_order_confirmed:'Order confirmed.',
  toast_order_delivered:'Order delivered.',toast_product_added:'Product listed.',
  toast_new_order:'New order received!',toast_stock_updated:'Stock updated.',
  toast_sale_saved:'Sale recorded.',toast_expense_saved:'Expense recorded.',
  toast_debt_saved:'Debt recorded.',toast_debt_paid:'Debt marked as paid.',
  platform_gmv:'Total GMV',platform_orders:'Total Orders',
  stat_total_users:'Total Users',stat_total_revenue:'Platform Revenue',
  stat_active_dist:'Active Distributors',stat_active_ret:'Active Retailers',
  approve:'Approve',suspend:'Suspend',
}};

// ═══════════════════════════════════════════════════════════
//  TANZANIA LOCATION DATA
// ═══════════════════════════════════════════════════════════
const TZ_LOCATIONS = {
  'Dar es Salaam':{ districts:{ 'Ilala':['Kariakoo','Gerezani','Kivukoni','Buguruni','Ukonga'],
    'Kinondoni':['Msasani','Mikocheni','Sinza','Mwananyamala','Kijitonyama','Magomeni'],
    'Temeke':['Temeke','Tandika','Mbagala','Mtoni','Chang\'ombe'],
    'Ubungo':['Ubungo','Kimara','Kibamba','Goba'],
    'Kigamboni':['Kigamboni','Mjimwema','Somangira']}},
  'Mwanza':{ districts:{ 'Nyamagana':['Pamba','Isamilo','Igogo','Mahina'],
    'Ilemela':['Mkolani','Igoma','Butimba','Sangabuye'],
    'Sengerema':['Sengerema','Nyampande'],
    'Kwimba':['Ngudu','Sumve']}},
  'Arusha':{ districts:{ 'Arusha City':['Kaloleni','Sekei','Themi','Kimandolu'],
    'Arumeru':['Tengeru','Usa River','Moshi Road'],
    'Meru':['Nkoaranga','Poli']}},
  'Dodoma':{ districts:{ 'Dodoma City':['Makole','Nzuguni','Kikuyu','Ipagala'],
    'Bahi':['Bahi','Mundemu'],
    'Chamwino':['Chamwino','Buigiri']}},
  'Mbeya':{ districts:{ 'Mbeya City':['Mwanjelwa','Uyole','Itiji','Ilembo'],
    'Rungwe':['Tukuyu','Mwakaleli'],
    'Chunya':['Chunya','Matundasi']}},
  'Tanga':{ districts:{ 'Tanga City':['Ngamiani','Usagara','Makorora'],
    'Muheza':['Muheza','Amani'],
    'Korogwe':['Korogwe','Bungu']}},
  'Morogoro':{ districts:{ 'Morogoro Urban':['Boma','Mwembesongo','Bigwa'],
    'Kilosa':['Kilosa','Mikumi'],
    'Mvomero':['Turiani','Mzumbe']}},
  'Zanzibar':{ districts:{ 'Mjini':['Stone Town','Ng\'ambo','Mlandege'],
    'Kaskazini A':['Mkokotoni','Donge'],
    'Kusini':['Koani','Fuoni']}},
};

// ═══════════════════════════════════════════════════════════
//  CATEGORIES
// ═══════════════════════════════════════════════════════════
const CATEGORIES = [
  {key:'beverages',icon:'🥤'},{key:'flour',icon:'🌾'},{key:'oil',icon:'🫙'},
  {key:'sugar',icon:'🍬'},{key:'soap',icon:'🧼'},{key:'personal',icon:'🧴'},
  {key:'dairy',icon:'🧈'},{key:'other',icon:'📦'},
];
const EXP_CATS = ['rent','transport','staff','utilities','packaging','other'];

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════
const State = {
  lang:'sw', role:'', authMode:'register',
  user:null, cart:{}, activePage:'', posTab:'sales',
  realtimeSub:null, notifications:[], notifOpen:false,
  reportPeriod:'today', reportFrom:'', reportTo:'',
  _allProducts:[], _activeFilter:'all',
};

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
const t  = k => T[State.lang]?.[k] ?? T.sw?.[k] ?? k;
const el = id => document.getElementById(id);
const fmt = n => `TZS ${Number(n||0).toLocaleString('en-TZ')}`;
const fmtDate = d => new Date(d).toLocaleDateString(State.lang==='sw'?'sw-TZ':'en-GB');
const genRef = () => 'BW-'+Date.now().toString(36).toUpperCase().slice(-6);
const catLabel = k => t(`cat_${k}`);
const catIcon  = k => CATEGORIES.find(x=>x.key===k)?.icon||'📦';
const today = () => new Date().toISOString().split('T')[0];

function setHtml(id,html){ const e=el(id); if(e) e.innerHTML=html; }
function setText(id,text){ const e=el(id); if(e) e.innerText=text; }

function loader(){
  return `<div style="text-align:center;padding:3rem;color:var(--muted)">
    <span class="spinner dark" style="width:24px;height:24px"></span></div>`;
}

function showToast(msg, type='success'){
  const wrap=el('toast-container'); if(!wrap) return;
  const div=document.createElement('div');
  div.className=`toast ${type}`;
  div.textContent=msg;
  wrap.appendChild(div);
  setTimeout(()=>div.remove(),4500);
}

function pill(status){
  const map={
    pending:['pill-pending','⏳'],confirmed:['pill-confirmed','✓'],
    delivered:['pill-delivered','📦'],cancelled:['pill-cancelled','✕'],
    paid:['pill-paid','✓'],unpaid:['pill-unpaid','!'],partial:['pill-partial','~'],
  };
  const [cls,icon]=map[status]||['pill-pending','?'];
  const label=t(status)||status;
  return `<span class="pill ${cls}">${icon} ${label}</span>`;
}

function dateRange(period){
  const d=new Date();
  const iso=s=>s.toISOString().split('T')[0];
  if(period==='today') return {from:iso(d),to:iso(d)};
  if(period==='week'){
    const mon=new Date(d); mon.setDate(d.getDate()-d.getDay()+1);
    return {from:iso(mon),to:iso(d)};
  }
  if(period==='month'){
    return {from:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`,to:iso(d)};
  }
  return {from:State.reportFrom||iso(d),to:State.reportTo||iso(d)};
}

// ═══════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════
export const App = {

  // ── LANGUAGE ──────────────────────────────────────────

  setLang(lang){
    State.lang=lang;
    this._applyTranslations();
    this.goStep(2);
  },

  switchLang(lang){
    State.lang=lang;
    el('sb-lang-sw')?.classList.toggle('active',lang==='sw');
    el('sb-lang-en')?.classList.toggle('active',lang==='en');
    if(State.user) this._updateLangInDB(lang);
    if(State.activePage) this.navigate(State.activePage);
  },

  async _updateLangInDB(lang){
    await supabase.from('profiles').update({lang}).eq('id',State.user.id);
    State.user.lang=lang;
    this._saveSession();
  },

  _applyTranslations(){
    const L=State.lang;
    // Step labels
    setText('s2-eye',t('step2_eye')); setText('s2-title',t('step2_title'));
    setText('role-retailer-name',t('role_retailer')); setText('role-retailer-desc',t('role_retailer_desc'));
    setText('role-dist-name',t('role_dist')); setText('role-dist-desc',t('role_dist_desc'));
    setText('s2-back',t('back'));
    setText('tab-register',t('tab_register')); setText('tab-login',t('tab_login'));
    setText('s3-eye',t('step3_eye')); setText('s3-title',t('step3_title'));
    setText('s4-eye',t('step4_eye')); setText('s4-title',t('step4_title'));
    // Form labels
    const labels={
      'lbl-store':'lbl_store','lbl-user':'lbl_user','lbl-phone':'lbl_phone',
      'lbl-region':'lbl_region','lbl-district':'lbl_district','lbl-ward':'lbl_ward',
      'lbl-street':'lbl_street','lbl-coverage':'lbl_coverage','lbl-cats':'lbl_cats',
      'lbl-pass':'lbl_pass','lbl-pass2':'lbl_pass2',
      'lbl-login-user':'lbl_login_user','lbl-login-pass':'lbl_login_pass',
      'lbl-logout':'lbl_logout','notif-header':'notif_title','notif-empty-msg':'notif_empty',
      'cart-title':'cart_title','cart-total-lbl':'cart_total',
      'cart-payment-note':'cart_payment','cart-empty-msg':'cart_empty',
    };
    Object.entries(labels).forEach(([id,key])=>setText(id,t(key)));
    const btn_reg=el('reg-submit-text'); if(btn_reg) btn_reg.innerText=t('btn_register');
    const btn_log=el('login-submit-text'); if(btn_log) btn_log.innerText=t('btn_login');
    const btn_ord=el('place-order-text'); if(btn_ord) btn_ord.innerText=t('place_order');
    const btn_nxt=el('role-next-text'); if(btn_nxt) btn_nxt.innerText=L==='sw'?'Endelea →':'Continue →';
    // Placeholders
    const ph={
      'reg-name':L==='sw'?'mfano: Mama Fatuma Duka':'e.g. Grace Mini Market',
      'reg-user':L==='sw'?'jina lako la kipekee':'your unique username',
      'reg-phone':'+255 7XX XXX XXX','reg-street':L==='sw'?'mfano: Msimbazi St':'e.g. Main Street',
      'reg-coverage':L==='sw'?'mfano: Kariakoo, Ilala':'e.g. Kariakoo, Ilala',
      'reg-pass':L==='sw'?'angalau herufi 6':'at least 6 characters',
      'reg-pass2':L==='sw'?'rudia nywila':'repeat password',
      'login-user':L==='sw'?'jina la mtumiaji':'your username',
      'login-pass':L==='sw'?'nywila yako':'your password',
    };
    Object.entries(ph).forEach(([id,v])=>{const e=el(id);if(e)e.placeholder=v;});
    this._buildCatGrid();
    this._populateRegions();
  },

  // ── LOCATION DROPDOWNS ────────────────────────────────

  _populateRegions(){
    const sel=el('reg-region'); if(!sel) return;
    const empty=State.lang==='sw'?'— Chagua Mkoa —':'— Select Region —';
    sel.innerHTML=`<option value="">${empty}</option>`+
      Object.keys(TZ_LOCATIONS).map(r=>`<option value="${r}">${r}</option>`).join('');
  },

  onRegionChange(){
    const region=el('reg-region')?.value;
    const distSel=el('reg-district'); if(!distSel) return;
    const wardSel=el('reg-ward');
    const empty=State.lang==='sw'?'— Chagua Wilaya —':'— Select District —';
    distSel.innerHTML=`<option value="">${empty}</option>`;
    if(wardSel) wardSel.innerHTML=`<option value=""></option>`;
    if(!region||!TZ_LOCATIONS[region]) return;
    Object.keys(TZ_LOCATIONS[region].districts).forEach(d=>{
      distSel.innerHTML+=`<option value="${d}">${d}</option>`;
    });
  },

  onDistrictChange(){
    const region=el('reg-region')?.value;
    const district=el('reg-district')?.value;
    const wardSel=el('reg-ward'); if(!wardSel) return;
    const empty=State.lang==='sw'?'— Chagua Kata —':'— Select Ward —';
    wardSel.innerHTML=`<option value="">${empty}</option>`;
    if(!region||!district) return;
    const wards=TZ_LOCATIONS[region]?.districts[district]||[];
    wards.forEach(w=>{ wardSel.innerHTML+=`<option value="${w}">${w}</option>`; });
  },

  // ── CATEGORY GRID ─────────────────────────────────────

  _buildCatGrid(){
    const grid=el('cat-grid'); if(!grid) return;
    grid.innerHTML=CATEGORIES.map(c=>`
      <label class="cat-check" id="cat-label-${c.key}" for="cat-cb-${c.key}">
        <input type="checkbox" id="cat-cb-${c.key}" value="${c.key}"
          onchange="App.onCatChange('${c.key}')" style="display:none"/>
        <span class="cat-icon">${c.icon}</span>
        <span>${catLabel(c.key)}</span>
      </label>`).join('');
  },

  onCatChange(key){
    const inp=el(`cat-cb-${key}`); const lbl=el(`cat-label-${key}`);
    if(inp&&lbl) lbl.classList.toggle('checked',inp.checked);
  },

  _getSelectedCats(){
    return CATEGORIES.filter(c=>el(`cat-cb-${c.key}`)?.checked).map(c=>c.key);
  },

  // ── STEP NAVIGATION ───────────────────────────────────

  goStep(n){
    for(let i=1;i<=4;i++) el(`step-${i}`)?.classList.remove('active');
    el(`step-${n}`)?.classList.add('active');
    const pct={1:25,2:50,3:85,4:70}[n]||25;
    const pf=el('prog-fill'); if(pf) pf.style.width=pct+'%';
  },

  pickRole(role){
    State.role=role;
    document.querySelectorAll('.role-card').forEach(c=>c.classList.remove('selected'));
    el(`role-btn-${role}`)?.classList.add('selected');
    ['retailer','distributor'].forEach(r=>{
      const ck=el(`check-${r}`); const ar=el(`arrow-${r}`);
      if(ck) ck.style.display=r===role?'inline':'none';
      if(ar) ar.style.display=r===role?'none':'inline';
    });
    const nb=el('role-next-btn'); if(nb) nb.style.display='';
    const nt=el('role-next-text');
    if(nt) nt.innerText=State.lang==='sw'?'Endelea →':'Continue →';
  },

  proceedFromRole(){
    if(!State.role) return;
    const de=el('dist-extra');
    if(de) de.style.display=State.role==='distributor'?'flex':'none';
    this._buildCatGrid();
    this._applyTranslations();
    this.goStep(State.authMode==='login'?4:3);
  },

  setAuthMode(mode){
    State.authMode=mode;
    el('tab-register')?.classList.toggle('active',mode==='register');
    el('tab-login')?.classList.toggle('active',mode==='login');
  },

  // ── AUTH ──────────────────────────────────────────────

  async handleRegister(e){
    e.preventDefault();
    const pass=el('reg-pass').value;
    const pass2=el('reg-pass2').value;
    const username=el('reg-user').value.trim().toLowerCase();
    if(pass!==pass2){showToast('❌ '+t('err_pass_match'),'error');return;}
    if(pass.length<6){showToast('❌ '+t('err_pass_match').replace('hazifanani','lazima iwe 6+'),'error');return;}
    const region=el('reg-region')?.value;
    const district=el('reg-district')?.value;
    if(!region||!district){showToast('⚠️ '+t('err_select_location'),'error');return;}
    const payload={
      username,password:pass,store_name:el('reg-name').value.trim(),
      phone_number:el('reg-phone').value.trim()||null,
      role:State.role,region,district,
      ward:el('reg-ward')?.value||null,
      street:el('reg-street')?.value.trim()||null,
      coverage_area:el('reg-coverage')?.value.trim()||null,
      lang:State.lang,is_approved:true,is_active:true,
    };
    const btn=el('reg-submit'); const span=el('reg-submit-text');
    if(btn) btn.disabled=true;
    if(span) span.innerHTML='<span class="spinner"></span>';
    try{
      const {data:existing}=await supabase.from('profiles').select('id').eq('username',username).maybeSingle();
      if(existing){showToast('❌ '+t('err_username'),'error');return;}
      const {data,error}=await supabase.from('profiles').insert([payload]).select().single();
      if(error){console.error(error);showToast('❌ '+t('err_generic'),'error');return;}
      State.user=data;
      this._saveSession();
      this.launchApp();
    }catch(err){console.error(err);showToast('❌ '+t('err_generic'),'error');}
    finally{if(btn)btn.disabled=false;if(span)span.innerText=t('btn_register');}
  },

  async handleLogin(e){
    e.preventDefault();
    const username=el('login-user').value.trim().toLowerCase();
    const password=el('login-pass').value;
    const btn=el('login-submit'); const span=el('login-submit-text');
    if(btn) btn.disabled=true;
    if(span) span.innerHTML='<span class="spinner"></span>';
    try{
      const {data,error}=await supabase.from('profiles').select('*')
        .eq('username',username).eq('password',password).maybeSingle();
      if(error||!data){showToast('❌ '+t('err_login'),'error');return;}
      State.user=data;
      State.lang=data.lang||State.lang;
      this._saveSession();
      this.launchApp();
    }catch(err){console.error(err);showToast('❌ '+t('err_generic'),'error');}
    finally{if(btn)btn.disabled=false;if(span)span.innerText=t('btn_login');}
  },

  logout(){
    if(State.realtimeSub){supabase.removeChannel(State.realtimeSub);State.realtimeSub=null;}
    this._clearSession();
    State.user=null;State.cart={};State.notifications=[];State.activePage='';
    el('app-main').style.display='none';
    el('onboarding').style.display='flex';
    el('cart-fab').style.display='none';
    this.goStep(1);
  },

  // ── SESSION ───────────────────────────────────────────

  _saveSession(){
    try{localStorage.setItem('bw_v2',JSON.stringify({user:State.user,lang:State.lang}));}catch(e){}
  },
  _clearSession(){try{localStorage.removeItem('bw_v2');}catch(e){}},
  _restoreSession(){
    try{
      const raw=localStorage.getItem('bw_v2'); if(!raw) return false;
      const {user,lang}=JSON.parse(raw);
      if(!user?.id) return false;
      State.user=user; State.lang=lang||'sw'; return true;
    }catch(e){return false;}
  },

  // ── LAUNCH ────────────────────────────────────────────

  launchApp(){
    const onb=el('onboarding'); const app=el('app-main');
    if(!onb||!app) return;
    onb.style.display='none'; app.style.display='block';
    const u=State.user; if(!u) return;
    const sbName=el('sb-name'); if(sbName) sbName.innerText=u.store_name||'—';
    const sbAv=el('sb-avatar'); if(sbAv) sbAv.innerText=(u.store_name||'U').charAt(0).toUpperCase();
    const badge=el('sb-role-badge');
    if(badge){
      badge.className=`role-badge badge-${u.role}`;
      badge.innerText=u.role==='retailer'?(State.lang==='sw'?'Duka':'Retailer'):
                      u.role==='distributor'?(State.lang==='sw'?'Msambazaji':'Distributor'):'Admin';
    }
    el('sb-lang-sw')?.classList.toggle('active',State.lang==='sw');
    el('sb-lang-en')?.classList.toggle('active',State.lang==='en');
    this._buildSidebar();
    this._buildBottomNav();
    setTimeout(()=>{
      this._setupRealtime();
      const fp=u.role==='retailer'?'home':u.role==='admin'?'admin_dashboard':'dashboard';
      this.navigate(fp);
    },50);
  },

  _buildSidebar(){
    const u=State.user; if(!u) return;
    const nav=el('sidebar-nav'); if(!nav) return;
    const items=u.role==='retailer'?[
      {id:'home',icon:'🏠',label:t('nav_home')},
      {id:'marketplace',icon:'🛍️',label:t('nav_marketplace')},
      {id:'records',icon:'📊',label:t('nav_records')},
      {id:'my_orders',icon:'📦',label:t('nav_my_orders')},
    ]:u.role==='admin'?[
      {id:'admin_dashboard',icon:'📊',label:t('nav_dashboard')},
      {id:'admin_users',icon:'👥',label:t('nav_users')},
      {id:'admin_orders',icon:'📋',label:t('nav_all_orders')},
      {id:'admin_analytics',icon:'📈',label:t('nav_analytics')},
    ]:[
      {id:'dashboard',icon:'📊',label:t('nav_dashboard'),badge:true},
      {id:'orders',icon:'📋',label:t('nav_orders'),badge:true},
      {id:'products',icon:'🏷️',label:t('nav_products')},
      {id:'inventory',icon:'📦',label:t('nav_inventory')},
      {id:'retailers',icon:'🏪',label:t('nav_retailers')},
      {id:'records',icon:'📈',label:t('nav_records')},
    ];
    nav.innerHTML=items.map(item=>`
      <button class="nav-item" id="nav-${item.id}" onclick="App.navigate('${item.id}')">
        <span class="nav-icon">${item.icon}</span><span>${item.label}</span>
        ${item.badge?`<span class="nav-badge" id="badge-${item.id}" style="display:none">0</span>`:''}
      </button>`).join('');
  },

  _buildBottomNav(){
    const u=State.user; const bn=el('bottom-nav'); if(!bn||!u) return;
    let items;
    if(u.role==='retailer'){
      items=[
        {id:'home',icon:'🏠',label:t('nav_home')},
        {id:'marketplace',icon:'🛍️',label:t('nav_marketplace')},
        {id:'records',icon:'📊',label:t('nav_records')},
        {id:'my_orders',icon:'📦',label:t('nav_my_orders')},
      ];
    } else if(u.role==='admin'){
      items=[
        {id:'admin_dashboard',icon:'📊',label:t('nav_dashboard')},
        {id:'admin_users',icon:'👥',label:t('nav_users')},
        {id:'admin_orders',icon:'📋',label:t('nav_all_orders')},
        {id:'admin_analytics',icon:'📈',label:t('nav_analytics')},
      ];
    } else {
      items=[
        {id:'dashboard',icon:'📊',label:t('nav_home'),badge:true},
        {id:'orders',icon:'📋',label:t('nav_orders'),badge:true},
        {id:'records',icon:'📈',label:t('nav_records')},
        {id:'dist_more',icon:'⋯',label:t('nav_more')},
      ];
    }
    bn.innerHTML=items.map(item=>`
      <button class="bn-item" id="bn-${item.id}" onclick="App.navigate('${item.id}')">
        <span class="bn-icon ${item.badge?'bn-badge':''}">
          ${item.icon}
          ${item.badge?`<span class="bn-badge-dot" id="bn-badge-${item.id}" style="display:none">0</span>`:''}
        </span>
        <span class="bn-label">${item.label}</span>
      </button>`).join('');
  },

  // ── NAVIGATION ────────────────────────────────────────

  navigate(page){
    // Distributor "More" shows a panel instead of navigating
    if(page==='dist_more'){ this._showMoreMenu(); return; }

    State.activePage=page;
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.bn-item').forEach(b=>b.classList.remove('active'));
    el(`nav-${page}`)?.classList.add('active');
    el(`bn-${page}`)?.classList.add('active');
    this.closeSidebar();

    const PM={
      home:           {title:'topbar_home',sub:'topbar_sub_home',icon:'🏠'},
      marketplace:    {title:'topbar_marketplace',sub:'topbar_sub_market',icon:'🛍️'},
      records:        {title:'topbar_records',sub:'topbar_sub_records',icon:'📊'},
      my_orders:      {title:'topbar_my_orders',sub:'topbar_sub_my_orders',icon:'📦'},
      dashboard:      {title:'topbar_dashboard',sub:'topbar_sub_dash',icon:'📊'},
      orders:         {title:'topbar_orders',sub:'topbar_sub_orders',icon:'📋'},
      products:       {title:'topbar_products',sub:'topbar_sub_products',icon:'🏷️'},
      inventory:      {title:'topbar_inventory',sub:'topbar_sub_inventory',icon:'📦'},
      retailers:      {title:'topbar_retailers',sub:'topbar_sub_retailers',icon:'🏪'},
      admin_dashboard:{title:'topbar_dashboard',sub:'topbar_sub_dash',icon:'📊'},
      admin_users:    {title:'topbar_users',sub:'topbar_sub_users',icon:'👥'},
      admin_orders:   {title:'topbar_all_orders',sub:'topbar_sub_all_orders',icon:'📋'},
      admin_analytics:{title:'topbar_analytics',sub:'topbar_sub_analytics',icon:'📈'},
    };
    const info=PM[page]||PM.dashboard;
    setText('topbar-title',t(info.title));
    setText('topbar-sub',t(info.sub));
    const ic=el('topbar-icon'); if(ic) ic.innerText=info.icon;

    const fab=el('cart-fab');
    if(fab) fab.style.display=page==='marketplace'?'flex':'none';

    const view=el('app-view'); if(!view) return;

    const renders={
      home:()=>this._renderHome(),
      marketplace:()=>this._renderMarketplace(),
      records:()=>this._renderRecords(),
      my_orders:()=>this._renderMyOrders(),
      dashboard:()=>this._renderDashboard(),
      orders:()=>this._renderDistOrders(),
      products:()=>this._renderProducts(),
      inventory:()=>this._renderInventory(),
      retailers:()=>this._renderRetailers(),
      admin_dashboard:()=>this._renderAdminDashboard(),
      admin_users:()=>this._renderAdminUsers(),
      admin_orders:()=>this._renderAdminOrders(),
      admin_analytics:()=>this._renderAdminAnalytics(),
    };
    renders[page]?.();
  },

  _showMoreMenu(){
    const existing=el('more-menu-overlay');
    if(existing){existing.remove();return;}
    const items=[
      {id:'products',icon:'🏷️',label:t('nav_products')},
      {id:'inventory',icon:'📦',label:t('nav_inventory')},
      {id:'retailers',icon:'🏪',label:t('nav_retailers')},
    ];
    const overlay=document.createElement('div');
    overlay.id='more-menu-overlay';
    overlay.style.cssText='position:fixed;inset:0;z-index:150;background:rgba(0,0,0,.4);display:flex;align-items:flex-end;';
    overlay.innerHTML=`
      <div style="width:100%;background:#fff;border-radius:1.25rem 1.25rem 0 0;padding:1rem;padding-bottom:calc(var(--bottom-nav-h) + 1rem)">
        <div style="width:40px;height:4px;background:var(--border2);border-radius:2px;margin:0 auto .875rem"></div>
        <div style="font-size:.78rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:.75rem;padding:0 .25rem">${t('more_menu')}</div>
        ${items.map(i=>`
          <button onclick="document.getElementById('more-menu-overlay').remove();App.navigate('${i.id}')"
            style="width:100%;display:flex;align-items:center;gap:.875rem;padding:.875rem .5rem;
            border:none;background:none;font-family:'DM Sans',sans-serif;font-size:.88rem;
            font-weight:600;color:var(--text);cursor:pointer;border-bottom:1px solid var(--border2);text-align:left">
            <span style="font-size:1.3rem;width:28px;text-align:center">${i.icon}</span>
            ${i.label}
          </button>`).join('')}
      </div>`;
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
    document.body.appendChild(overlay);
  },

  // ── MOBILE SIDEBAR ────────────────────────────────────

  toggleSidebar(){
    el('sidebar')?.classList.toggle('mobile-open');
    el('sidebar-overlay')?.classList.toggle('active');
  },
  closeSidebar(){
    el('sidebar')?.classList.remove('mobile-open');
    el('sidebar-overlay')?.classList.remove('active');
  },

  // ── REALTIME ──────────────────────────────────────────

  _setupRealtime(){
    if(State.realtimeSub) supabase.removeChannel(State.realtimeSub);
    const u=State.user;
    const channel=supabase.channel(`bw2-${u.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'orders'},(pl)=>{
        if(u.role==='distributor'&&pl.new.distributor_id===u.id){
          playSmsSound('new_order');
          this._addNotif({icon:'🛍️',title:t('notif_new_order'),text:pl.new.order_ref});
          showToast('🔔 '+t('toast_new_order'),'info');
          if(['orders','dashboard'].includes(State.activePage)) this.navigate(State.activePage);
          this._updateOrderBadge();
        }
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders'},(pl)=>{
        if(u.role==='retailer'&&pl.new.retailer_id===u.id){
          const st=pl.new.status;
          if(st==='confirmed'||st==='delivered'){
            const msg=st==='confirmed'?t('toast_order_confirmed'):t('toast_order_delivered');
            playSmsSound(st==='confirmed'?'confirmed':'delivered');
            showToast('✅ '+msg,'success');
            this._addNotif({icon:st==='delivered'?'📦':'✅',
              title:st==='delivered'?t('notif_order_del'):t('notif_order_conf'),text:pl.new.order_ref});
          }
          if(State.activePage==='my_orders') this._renderMyOrders();
        }
      }).subscribe();
    State.realtimeSub=channel;
  },

  _addNotif(n){
    const now=new Date().toLocaleTimeString(State.lang==='sw'?'sw-TZ':'en-GB',{hour:'2-digit',minute:'2-digit'});
    State.notifications.unshift({...n,time:now});
    const dot=el('notif-dot');
    if(dot){dot.style.display='flex';dot.innerText=Math.min(State.notifications.length,99);}
    this._renderNotifList();
  },

  _renderNotifList(){
    const list=el('notif-list'); if(!list) return;
    if(!State.notifications.length){
      list.innerHTML=`<div class="notif-empty">${t('notif_empty')}</div>`;return;
    }
    list.innerHTML=State.notifications.slice(0,10).map((n,i)=>`
      <div class="notif-item ${i===0?'unread':''}">
        <span class="notif-icon">${n.icon}</span>
        <div><div class="notif-text">${n.title} — ${n.text}</div>
        <div class="notif-time">${n.time}</div></div>
      </div>`).join('');
  },

  toggleNotif(){
    State.notifOpen=!State.notifOpen;
    el('notif-dropdown')?.classList.toggle('open',State.notifOpen);
    if(State.notifOpen){const d=el('notif-dot');if(d)d.style.display='none';}
  },

  clearNotifs(){
    State.notifications=[];this._renderNotifList();
    const d=el('notif-dot');if(d)d.style.display='none';
  },

  async _updateOrderBadge(){
    try{
      const {count}=await supabase.from('orders').select('*',{count:'exact',head:true})
        .eq('distributor_id',State.user.id).eq('status','pending');
      const n=count||0;
      ['badge-dashboard','badge-orders','bn-badge-dashboard','bn-badge-orders'].forEach(id=>{
        const b=el(id);if(b){b.innerText=n;b.style.display=n>0?'flex':'none';}
      });
    }catch(e){}
  },

  // ══════════════════════════════════════════════════════
  //  RETAILER HOME
  // ══════════════════════════════════════════════════════

  async _renderHome(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=loader();
    const uid=State.user.id;
    let orders=[],sales=[],expenses=[],debts=[];
    try{
      const tod=new Date(); tod.setHours(0,0,0,0);
      const [r1,r2,r3,r4]=await Promise.all([
        supabase.from('orders').select('*').eq('retailer_id',uid).gte('created_at',tod.toISOString()),
        supabase.from('sales').select('*').eq('user_id',uid).eq('sale_date',today()),
        supabase.from('expenses').select('*').eq('user_id',uid).eq('expense_date',today()),
        supabase.from('debts').select('*').eq('user_id',uid).neq('status','paid'),
      ]);
      orders=r1.data||[]; sales=r2.data||[];
      expenses=r3.data||[]; debts=r4.data||[];
    }catch(e){console.error(e);}
    const todaySales=sales.reduce((s,x)=>s+Number(x.revenue),0);
    const todayProfit=sales.reduce((s,x)=>s+Number(x.profit),0);
    const totalDebt=debts.reduce((s,x)=>s+(Number(x.amount)-Number(x.amount_paid)),0);
    const pendingOrders=orders.filter(o=>o.status==='pending').length;
    view.innerHTML=`
      <div class="stats-row">
        <div class="stat-card green"><div class="stat-icon">💰</div>
          <div class="stat-label">${t('stat_sales_today')}</div>
          <div class="stat-value" style="font-size:1.1rem">${fmt(todaySales)}</div></div>
        <div class="stat-card blue"><div class="stat-icon">📈</div>
          <div class="stat-label">${t('stat_profit_today')}</div>
          <div class="stat-value" style="font-size:1.1rem;color:var(--blue-dark)">${fmt(todayProfit)}</div></div>
        <div class="stat-card amber"><div class="stat-icon">⏳</div>
          <div class="stat-label">${t('stat_pending')}</div>
          <div class="stat-value">${pendingOrders}</div></div>
        <div class="stat-card red"><div class="stat-icon">📋</div>
          <div class="stat-label">${t('stat_debts')}</div>
          <div class="stat-value" style="font-size:1.1rem">${fmt(totalDebt)}</div></div>
      </div>
      <div class="section-header">
        <span class="section-title">${State.lang==='sw'?'Vitendo vya Haraka':'Quick Actions'}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem;margin-bottom:1.25rem">
        ${[
          {page:'marketplace',icon:'🛍️',label:t('nav_marketplace'),color:'var(--green-light)',tc:'var(--green-dark)'},
          {page:'records',icon:'📊',label:t('pos_sales'),color:'var(--blue-light)',tc:'var(--blue-dark)'},
          {page:'records',icon:'💸',label:t('pos_expenses'),color:'var(--amber-light)',tc:'var(--amber)'},
          {page:'records',icon:'📋',label:t('pos_debts'),color:'var(--red-light)',tc:'var(--red)'},
        ].map(a=>`
          <button onclick="App.navigate('${a.page}')"
            style="background:${a.color};border:none;border-radius:var(--radius-lg);padding:1rem;
            cursor:pointer;text-align:center;transition:all .2s;font-family:'DM Sans',sans-serif">
            <div style="font-size:1.5rem;margin-bottom:.35rem">${a.icon}</div>
            <div style="font-size:.75rem;font-weight:700;color:${a.tc}">${a.label}</div>
          </button>`).join('')}
      </div>
      ${orders.length?`
        <div class="section-header">
          <span class="section-title">${t('topbar_my_orders')}</span>
          <button class="section-action" onclick="App.navigate('my_orders')">${t('view_all')}</button>
        </div>
        <div class="card"><div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>${t('order_id')}</th><th>${t('distributor')}</th><th>${t('total')}</th><th>${t('status')}</th></tr></thead>
            <tbody>${orders.slice(0,5).map(o=>`
              <tr><td class="mono">${o.order_ref}</td>
              <td>${o.distributor_id?.toString().slice(0,8)||'—'}</td>
              <td style="color:var(--green-mid);font-weight:700">${fmt(o.total_price)}</td>
              <td>${pill(o.status)}</td></tr>`).join('')}</tbody>
          </table></div></div>`:''}`;
  },

  // ══════════════════════════════════════════════════════
  //  MARKETPLACE
  // ══════════════════════════════════════════════════════

  async _renderMarketplace(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=`
      <div>
        <div style="display:flex;gap:.65rem;align-items:center;margin-bottom:.875rem;flex-wrap:wrap">
          <div class="search-wrap" style="flex:1;min-width:180px;max-width:300px">
            <span class="search-icon">🔍</span>
            <input class="form-input" id="market-search" placeholder="${t('search_products')}"
              oninput="App._filterProducts()" style="padding-left:2.1rem"/>
          </div>
        </div>
        <div class="filter-pills" id="cat-filters"></div>
        <div class="product-grid" id="product-list">${loader()}</div>
      </div>`;
    let products=[];
    try{
      const {data,error}=await supabase.from('products').select('*').gt('stock_qty',0)
        .eq('is_active',true).order('created_at',{ascending:false});
      if(error) console.warn(error);
      products=data||[];
    }catch(e){console.error(e);}
    State._allProducts=products; State._activeFilter='all';
    const cats=[...new Set(products.map(p=>p.category))].filter(Boolean);
    const fp=el('cat-filters');
    if(fp){
      fp.innerHTML=[
        `<button class="filter-pill active" id="pill-all" onclick="App._setFilter('all')">${t('all_categories')}</button>`,
        ...cats.map(c=>`<button class="filter-pill" id="pill-${c}" onclick="App._setFilter('${c}')">${catLabel(c)}</button>`)
      ].join('');
    }
    this._renderProductCards(products);
  },

  _setFilter(cat){
    State._activeFilter=cat;
    document.querySelectorAll('.filter-pill').forEach(p=>p.classList.remove('active'));
    el(`pill-${cat}`)?.classList.add('active');
    this._filterProducts();
  },

  _filterProducts(){
    const search=el('market-search')?.value.toLowerCase()||'';
    const cat=State._activeFilter||'all';
    let f=State._allProducts||[];
    if(cat!=='all') f=f.filter(p=>p.category===cat);
    if(search) f=f.filter(p=>p.product_name.toLowerCase().includes(search));
    this._renderProductCards(f);
  },

  _renderProductCards(products){
    const list=el('product-list'); if(!list) return;
    if(!products?.length){
      list.innerHTML=`<div style="grid-column:1/-1" class="empty-state">
        <div class="empty-icon">🏪</div>
        <div class="empty-title">${t('err_no_products')||'Hakuna bidhaa bado'}</div></div>`;
      return;
    }
    list.innerHTML=products.map(p=>{
      const qty=State.cart[p.id]?.qty||0;
      const sc=p.stock_qty<=0?'stock-out':p.stock_qty<10?'stock-low':'stock-ok';
      const st=p.stock_qty<=0?t('out_of_stock'):p.stock_qty<10?t('low_stock'):t('in_stock');
      const imgHtml=p.image_url
        ?`<img src="${p.image_url}" class="product-img" alt="${p.product_name}" loading="lazy"/>`
        :`<div class="product-img-placeholder">${catIcon(p.category)}</div>`;
      return `
        <div class="product-card ${qty>0?'in-cart':''}" id="pcard-${p.id}">
          <span class="stock-badge ${sc}">${st}</span>
          ${imgHtml}
          <div class="product-category">${catLabel(p.category)}</div>
          <div class="product-name">${p.product_name}</div>
          <div class="product-unit">${t('unit')}: ${p.selling_unit||'—'}</div>
          <div class="product-footer">
            <span class="product-price">${fmt(p.price)}</span>
            ${p.stock_qty<=0
              ?`<span style="font-size:.65rem;color:var(--red);font-weight:700">${t('out_of_stock')}</span>`
              :qty===0
              ?`<button class="add-btn" onclick="App.addToCart(${JSON.stringify(p).replace(/"/g,"'")})" title="${t('add_to_cart')}">+</button>`
              :`<div class="qty-control">
                  <button class="qty-btn" onclick="App.changeQty('${p.id}',-1)">−</button>
                  <span class="qty-num">${qty}</span>
                  <button class="qty-btn" onclick="App.changeQty('${p.id}',1)">+</button>
                </div>`}
          </div>
        </div>`;
    }).join('');
  },

  // ── CART ──────────────────────────────────────────────

  addToCart(product){
    const p=typeof product==='string'?JSON.parse(product):product;
    if(!State.cart[p.id]) State.cart[p.id]={product:p,qty:0};
    State.cart[p.id].qty++;
    this._updateCartUI(); this._filterProducts();
  },

  changeQty(id,delta){
    if(!State.cart[id]) return;
    State.cart[id].qty=Math.max(0,State.cart[id].qty+delta);
    if(State.cart[id].qty===0) delete State.cart[id];
    this._updateCartUI(); this._filterProducts();
  },

  _updateCartUI(){
    const items=Object.values(State.cart);
    const count=items.reduce((s,x)=>s+x.qty,0);
    const total=items.reduce((s,x)=>s+x.product.price*x.qty,0);
    setText('cart-count',count);
    setText('cart-subtitle',`${count} ${t('cart_sub')}`);
    setText('cart-total',fmt(total));
    const list=el('cart-items-list'); if(!list) return;
    if(!items.length){
      list.innerHTML=`<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-sub">${t('cart_empty')}</div></div>`;
      return;
    }
    list.innerHTML=items.map(({product:p,qty})=>{
      const imgEl=p.image_url
        ?`<img src="${p.image_url}" class="cart-item-img" alt="${p.product_name}"/>`
        :`<div class="cart-item-emoji">${catIcon(p.category)}</div>`;
      return `<div class="cart-item">${imgEl}
        <div class="cart-item-info">
          <div class="cart-item-name">${p.product_name}</div>
          <div class="cart-item-price">${fmt(p.price)} × ${qty} = ${fmt(p.price*qty)}</div>
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="App.changeQty('${p.id}',-1)">−</button>
          <span class="qty-num">${qty}</span>
          <button class="qty-btn" onclick="App.changeQty('${p.id}',1)">+</button>
        </div></div>`;
    }).join('');
  },

  toggleCart(){el('cart-panel')?.classList.toggle('open');this._updateCartUI();},

  async placeOrder(){
    const items=Object.values(State.cart);
    if(!items.length){showToast('⚠️ '+t('err_cart_empty'),'error');return;}
    const btn=el('place-order-btn'); const span=el('place-order-text');
    if(btn) btn.disabled=true;
    if(span) span.innerHTML='<span class="spinner"></span>';
    const byDist={};
    items.forEach(({product:p,qty})=>{
      if(!byDist[p.distributor_id]) byDist[p.distributor_id]=[];
      byDist[p.distributor_id].push({product:p,qty});
    });
    let hasError=false;
    for(const [distId,distItems] of Object.entries(byDist)){
      const total=distItems.reduce((s,x)=>s+x.product.price*x.qty,0);
      const ref=genRef();
      try{
        const {data:order,error:oErr}=await supabase.from('orders').insert([{
          order_ref:ref,retailer_id:State.user.id,distributor_id:distId,
          total_price:total,status:'pending',
          items_count:distItems.reduce((s,x)=>s+x.qty,0),
        }]).select().single();
        if(oErr){hasError=true;continue;}
        await supabase.from('order_items').insert(
          distItems.map(({product:p,qty})=>({
            order_id:order.id,product_id:p.id,product_name:p.product_name,
            qty,unit_price:p.price,subtotal:p.price*qty,
          }))
        );
        for(const {product:p,qty} of distItems){
          await supabase.from('products').update({stock_qty:Math.max(0,p.stock_qty-qty)}).eq('id',p.id);
        }
      }catch(e){hasError=true;}
    }
    if(btn) btn.disabled=false;
    if(span) span.innerText=t('place_order');
    if(hasError){showToast('❌ '+t('err_generic'),'error');return;}
    State.cart={};
    el('cart-panel')?.classList.remove('open');
    const view=el('app-view'); if(!view) return;
    view.innerHTML=`
      <div class="success-screen">
        <div class="success-ring">✅</div>
        <div class="success-title">${t('success_title')}</div>
        <div class="success-sub">${t('success_sub')}</div>
        <div class="success-ref">${genRef()}</div>
        <button class="btn-primary" style="max-width:200px" onclick="App.navigate('my_orders')">
          ${State.lang==='sw'?'Angalia Maagizo':'View My Orders'}</button>
        <button class="btn-ghost" style="margin-top:.5rem" onclick="App.navigate('marketplace')">
          ${State.lang==='sw'?'← Rudi Sokoni':'← Back to Marketplace'}</button>
      </div>`;
    showToast('✅ '+t('toast_order_placed'),'success');
  },

  // ══════════════════════════════════════════════════════
  //  MY ORDERS (Retailer)
  // ══════════════════════════════════════════════════════

  async _renderMyOrders(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=loader();
    let data=[];
    try{
      const {data:rows}=await supabase.from('orders')
        .select('*,distributor:profiles!orders_distributor_id_fkey(store_name,phone_number)')
        .eq('retailer_id',State.user.id).order('created_at',{ascending:false});
      data=rows||[];
    }catch(e){console.error(e);}
    if(!data.length){
      view.innerHTML=`<div class="empty-state"><div class="empty-icon">📦</div>
        <div class="empty-title">${t('no_orders')}</div><div class="empty-sub">${t('no_orders_sub')}</div>
        <button class="btn-primary" style="max-width:180px;margin-top:1.25rem" onclick="App.navigate('marketplace')">${t('go_market')}</button>
        </div>`;return;
    }
    const ts=data.reduce((s,o)=>s+Number(o.total_price),0);
    const pend=data.filter(o=>o.status==='pending').length;
    view.innerHTML=`
      <div class="stats-row" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card green"><div class="stat-icon">📦</div>
          <div class="stat-label">${t('stat_total_orders')}</div><div class="stat-value">${data.length}</div></div>
        <div class="stat-card amber"><div class="stat-icon">⏳</div>
          <div class="stat-label">${t('stat_pending')}</div><div class="stat-value">${pend}</div></div>
        <div class="stat-card blue"><div class="stat-icon">💰</div>
          <div class="stat-label">${t('stat_total_spent')}</div>
          <div class="stat-value" style="font-size:1rem">${fmt(ts)}</div></div>
      </div>
      <div class="card"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${t('order_id')}</th><th>${t('distributor')}</th>
            <th>${t('items')}</th><th>${t('total')}</th>
            <th>${t('status')}</th><th>${t('date')}</th>
          </tr></thead>
          <tbody>${data.map(o=>`
            <tr><td class="mono">${o.order_ref}</td>
            <td><div style="font-weight:700;font-size:.8rem">${o.distributor?.store_name||'—'}</div>
              ${o.distributor?.phone_number?`<div style="font-size:.7rem;color:var(--muted)">${o.distributor.phone_number}</div>`:''}</td>
            <td style="font-weight:700">${o.items_count||'—'}</td>
            <td style="color:var(--green-mid);font-weight:700">${fmt(o.total_price)}</td>
            <td>${pill(o.status)}</td>
            <td class="mono">${fmtDate(o.created_at)}</td></tr>`).join('')}
          </tbody>
        </table></div></div>`;
  },

  // ══════════════════════════════════════════════════════
  //  POS RECORDS (Both Roles)
  // ══════════════════════════════════════════════════════

  _renderRecords(){
    const view=el('app-view'); if(!view) return;
    const tabs=['sales','expenses','debts','reports'];
    view.innerHTML=`
      <div class="pos-tabs" id="pos-tabs">
        ${tabs.map(tab=>`
          <button class="pos-tab ${State.posTab===tab?'active':''}"
            onclick="App._switchPosTab('${tab}')">${t('pos_'+tab)}</button>`).join('')}
      </div>
      <div id="pos-content"></div>`;
    this._renderPosContent();
  },

  _switchPosTab(tab){
    State.posTab=tab;
    document.querySelectorAll('.pos-tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.pos-tab').forEach((b,i)=>{
      if(['sales','expenses','debts','reports'][i]===tab) b.classList.add('active');
    });
    this._renderPosContent();
  },

  _renderPosContent(){
    const fn={
      sales:()=>this._renderSales(),
      expenses:()=>this._renderExpenses(),
      debts:()=>this._renderDebts(),
      reports:()=>this._renderReports(),
    };
    fn[State.posTab]?.();
  },

  // ── SALES ─────────────────────────────────────────────

  async _renderSales(){
    setHtml('pos-content',loader());
    let sales=[];
    try{
      const {data}=await supabase.from('sales').select('*').eq('user_id',State.user.id)
        .order('sale_date',{ascending:false}).order('created_at',{ascending:false}).limit(100);
      sales=data||[];
    }catch(e){console.error(e);}
    const todRev=sales.filter(s=>s.sale_date===today()).reduce((a,s)=>a+Number(s.revenue),0);
    const todPro=sales.filter(s=>s.sale_date===today()).reduce((a,s)=>a+Number(s.profit),0);
    setHtml('pos-content',`
      <div class="stats-row" style="grid-template-columns:repeat(2,1fr);margin-bottom:1rem">
        <div class="stat-card green"><div class="stat-icon">💰</div>
          <div class="stat-label">${t('stat_sales_today')}</div>
          <div class="stat-value" style="font-size:1rem">${fmt(todRev)}</div></div>
        <div class="stat-card blue"><div class="stat-icon">📈</div>
          <div class="stat-label">${t('stat_profit_today')}</div>
          <div class="stat-value" style="font-size:1rem;color:var(--blue-dark)">${fmt(todPro)}</div></div>
      </div>
      <div class="pos-form">
        <div class="pos-form-title">${t('add_sale')}</div>
        <div style="display:flex;flex-direction:column;gap:.65rem">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t('sale_product')}</label>
              <input class="form-input" id="sale-product" placeholder="${State.lang==='sw'?'Jina la bidhaa':'Product name'}"/>
            </div>
            <div class="form-group">
              <label class="form-label">${t('sale_qty')}</label>
              <input class="form-input" id="sale-qty" type="number" min="1" value="1"/>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t('sale_buying_price')}</label>
              <input class="form-input" id="sale-buy" type="number" min="0" placeholder="0"/>
            </div>
            <div class="form-group">
              <label class="form-label">${t('sale_selling_price')}</label>
              <input class="form-input" id="sale-sell" type="number" min="0" placeholder="0"/>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t('sale_date')}</label>
              <input class="form-input" id="sale-date" type="date" value="${today()}"/>
            </div>
            <div class="form-group">
              <label class="form-label">${t('product_category')}</label>
              <select class="form-input" id="sale-cat">
                ${CATEGORIES.map(c=>`<option value="${c.key}">${catLabel(c.key)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t('sale_notes')}</label>
            <input class="form-input" id="sale-notes" placeholder="${State.lang==='sw'?'Maelezo...':'Notes...'}"/>
          </div>
          <button class="btn-primary" onclick="App._saveSale()">
            <span id="save-sale-text">${t('btn_save_sale')}</span></button>
        </div>
      </div>
      ${!sales.length?`<div class="empty-state"><div class="empty-icon">💰</div>
        <div class="empty-title">${t('no_sales')}</div></div>`:`
      <div class="card"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${t('date')}</th><th>${t('sale_product')}</th>
            <th>${t('product_category')}</th><th>${t('sale_qty')}</th>
            <th>${t('sale_selling_price')}</th><th>${t('total_revenue')}</th>
            <th>${t('gross_profit')}</th>
          </tr></thead>
          <tbody>${sales.map(s=>`
            <tr><td class="mono">${s.sale_date}</td>
            <td style="font-weight:700">${s.product_name}</td>
            <td>${catLabel(s.category||'other')}</td>
            <td style="font-weight:700">${s.qty}</td>
            <td>${fmt(s.selling_price)}</td>
            <td style="color:var(--green-mid);font-weight:700">${fmt(s.revenue)}</td>
            <td class="${Number(s.profit)>=0?'report-value green':'report-value red'}"
              style="font-weight:700">${fmt(s.profit)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>`}`);
  },

  async _saveSale(){
    const product=el('sale-product')?.value.trim();
    const qty=parseInt(el('sale-qty')?.value||'1');
    const buy=parseFloat(el('sale-buy')?.value||'0');
    const sell=parseFloat(el('sale-sell')?.value||'0');
    const date=el('sale-date')?.value||today();
    const cat=el('sale-cat')?.value||'other';
    const notes=el('sale-notes')?.value.trim();
    if(!product||!sell){showToast('⚠️ '+(State.lang==='sw'?'Jaza bidhaa na bei':'Fill product and price'),'error');return;}
    const btn=el('save-sale-text'); if(btn) btn.innerHTML='<span class="spinner"></span>';
    try{
      const {error}=await supabase.from('sales').insert([{
        user_id:State.user.id,product_name:product,category:cat,
        qty,buying_price:buy,selling_price:sell,sale_date:date,notes:notes||null,
      }]);
      if(error) throw error;
      showToast('✅ '+t('toast_sale_saved'),'success');
      this._renderSales();
    }catch(e){console.error(e);showToast('❌ '+t('err_generic'),'error');}
    finally{if(btn)btn.innerText=t('btn_save_sale');}
  },

  // ── EXPENSES ──────────────────────────────────────────

  async _renderExpenses(){
    setHtml('pos-content',loader());
    let expenses=[];
    try{
      const {data}=await supabase.from('expenses').select('*').eq('user_id',State.user.id)
        .order('expense_date',{ascending:false}).limit(100);
      expenses=data||[];
    }catch(e){console.error(e);}
    const todExp=expenses.filter(e=>e.expense_date===today()).reduce((a,e)=>a+Number(e.amount),0);
    const totExp=expenses.reduce((a,e)=>a+Number(e.amount),0);
    setHtml('pos-content',`
      <div class="stats-row" style="grid-template-columns:repeat(2,1fr);margin-bottom:1rem">
        <div class="stat-card amber"><div class="stat-icon">💸</div>
          <div class="stat-label">${State.lang==='sw'?'Gharama Leo':'Today Expenses'}</div>
          <div class="stat-value" style="font-size:1rem">${fmt(todExp)}</div></div>
        <div class="stat-card red"><div class="stat-icon">📊</div>
          <div class="stat-label">${t('total_expenses')}</div>
          <div class="stat-value" style="font-size:1rem">${fmt(totExp)}</div></div>
      </div>
      <div class="pos-form">
        <div class="pos-form-title">${t('add_expense')}</div>
        <div style="display:flex;flex-direction:column;gap:.65rem">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t('expense_cat')}</label>
              <select class="form-input" id="exp-cat">
                ${EXP_CATS.map(c=>`<option value="${c}">${t('exp_'+c)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">${t('expense_amount')}</label>
              <input class="form-input" id="exp-amount" type="number" min="0" placeholder="0"/>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t('expense_desc')}</label>
            <input class="form-input" id="exp-desc" placeholder="${State.lang==='sw'?'Maelezo ya gharama':'Expense description'}"/>
          </div>
          <div class="form-group">
            <label class="form-label">${t('expense_date')}</label>
            <input class="form-input" id="exp-date" type="date" value="${today()}"/>
          </div>
          <button class="btn-primary" onclick="App._saveExpense()">
            <span id="save-exp-text">${t('btn_save_expense')}</span></button>
        </div>
      </div>
      ${!expenses.length?`<div class="empty-state"><div class="empty-icon">💸</div>
        <div class="empty-title">${t('no_expenses')}</div></div>`:`
      <div class="card"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${t('date')}</th><th>${t('expense_cat')}</th>
            <th>${t('expense_desc')}</th><th>${t('expense_amount')}</th>
          </tr></thead>
          <tbody>${expenses.map(e=>`
            <tr><td class="mono">${e.expense_date}</td>
            <td>${pill_simple(t('exp_'+e.category),'amber')}</td>
            <td>${e.description}</td>
            <td style="color:var(--red);font-weight:700">${fmt(e.amount)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>`}`);
  },

  async _saveExpense(){
    const cat=el('exp-cat')?.value;
    const desc=el('exp-desc')?.value.trim();
    const amount=parseFloat(el('exp-amount')?.value||'0');
    const date=el('exp-date')?.value||today();
    if(!desc||!amount){showToast('⚠️ '+(State.lang==='sw'?'Jaza maelezo na kiasi':'Fill description and amount'),'error');return;}
    const btn=el('save-exp-text'); if(btn) btn.innerHTML='<span class="spinner"></span>';
    try{
      const {error}=await supabase.from('expenses').insert([{
        user_id:State.user.id,category:cat,description:desc,amount,expense_date:date,
      }]);
      if(error) throw error;
      showToast('✅ '+t('toast_expense_saved'),'success');
      this._renderExpenses();
    }catch(e){console.error(e);showToast('❌ '+t('err_generic'),'error');}
    finally{if(btn)btn.innerText=t('btn_save_expense');}
  },

  // ── DEBTS ─────────────────────────────────────────────

  async _renderDebts(){
    setHtml('pos-content',loader());
    let debts=[];
    try{
      const {data}=await supabase.from('debts').select('*').eq('user_id',State.user.id)
        .order('debt_date',{ascending:false});
      debts=data||[];
    }catch(e){console.error(e);}
    const unpaid=debts.filter(d=>d.status!=='paid').reduce((a,d)=>a+(Number(d.amount)-Number(d.amount_paid)),0);
    setHtml('pos-content',`
      <div class="stats-row" style="grid-template-columns:repeat(2,1fr);margin-bottom:1rem">
        <div class="stat-card red"><div class="stat-icon">📋</div>
          <div class="stat-label">${t('unpaid_debts')}</div>
          <div class="stat-value" style="font-size:1rem">${fmt(unpaid)}</div></div>
        <div class="stat-card green"><div class="stat-icon">📊</div>
          <div class="stat-label">${State.lang==='sw'?'Wadeni Wote':'Total Debtors'}</div>
          <div class="stat-value">${debts.filter(d=>d.status!=='paid').length}</div></div>
      </div>
      <div class="pos-form">
        <div class="pos-form-title">${t('add_debt')}</div>
        <div style="display:flex;flex-direction:column;gap:.65rem">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t('debt_customer')}</label>
              <input class="form-input" id="debt-name" placeholder="${State.lang==='sw'?'Jina kamili':'Full name'}"/>
            </div>
            <div class="form-group">
              <label class="form-label">${t('debt_phone')}</label>
              <input class="form-input" id="debt-phone" type="tel" placeholder="+255 7XX XXX XXX"/>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t('debt_amount')}</label>
              <input class="form-input" id="debt-amount" type="number" min="0" placeholder="0"/>
            </div>
            <div class="form-group">
              <label class="form-label">${t('debt_due')}</label>
              <input class="form-input" id="debt-due" type="date"/>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t('debt_desc')}</label>
            <input class="form-input" id="debt-desc" placeholder="${State.lang==='sw'?'Bidhaa zilizopewa...':'Items given on credit...'}"/>
          </div>
          <button class="btn-primary" onclick="App._saveDebt()">
            <span id="save-debt-text">${t('btn_save_debt')}</span></button>
        </div>
      </div>
      ${!debts.length?`<div class="empty-state"><div class="empty-icon">📋</div>
        <div class="empty-title">${t('no_debts')}</div></div>`:`
      <div style="display:flex;flex-direction:column;gap:.6rem">
        ${debts.map(d=>{
          const remaining=Number(d.amount)-Number(d.amount_paid);
          const pct=Math.min(100,Math.round((Number(d.amount_paid)/Number(d.amount))*100));
          const overdue=d.due_date&&new Date(d.due_date)<new Date()&&d.status!=='paid';
          return `<div class="debt-card" style="${overdue?'border-color:var(--red)':''}">
            <div class="debt-header">
              <div>
                <div class="debt-name">${d.customer_name}${overdue?` <span style="color:var(--red);font-size:.65rem;font-weight:700">${State.lang==='sw'?'IMEPITA':'OVERDUE'}</span>`:''}</div>
                <div class="debt-meta">${d.customer_phone||''} ${d.description?'· '+d.description:''}</div>
              </div>
              ${pill(d.status)}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:.4rem">
              <span style="color:var(--muted)">${t('debt_remaining')}</span>
              <span style="font-weight:800;color:${d.status==='paid'?'var(--green-mid)':'var(--red)'}">${fmt(remaining)}</span>
            </div>
            <div class="debt-progress"><div class="debt-progress-fill" style="width:${pct}%"></div></div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem">
              <span style="font-size:.7rem;color:var(--muted)">${d.due_date?`${State.lang==='sw'?'Muda wa kulipa':'Due'}: ${fmtDate(d.due_date)}`:'—'}</span>
              ${d.status!=='paid'?`
                <div style="display:flex;gap:.4rem">
                  <input type="number" id="pay-${d.id}" placeholder="${State.lang==='sw'?'Kiasi':'Amount'}"
                    style="width:90px;padding:4px 7px;border:1.5px solid var(--border2);border-radius:5px;
                    font-family:'DM Sans',sans-serif;font-size:.75rem;outline:none"/>
                  <button class="btn-sm green" onclick="App._payDebt('${d.id}',${d.amount},${d.amount_paid})">${t('btn_mark_paid')}</button>
                </div>`:'<span style="font-size:.72rem;color:var(--green-mid);font-weight:700">Imelipwa</span>'}
            </div>
          </div>`;}).join('')}
      </div>`}`);
  },

  async _saveDebt(){
    const name=el('debt-name')?.value.trim();
    const phone=el('debt-phone')?.value.trim();
    const amount=parseFloat(el('debt-amount')?.value||'0');
    const desc=el('debt-desc')?.value.trim();
    const due=el('debt-due')?.value||null;
    if(!name||!amount){showToast('⚠️ '+(State.lang==='sw'?'Jaza jina na kiasi':'Fill name and amount'),'error');return;}
    const btn=el('save-debt-text'); if(btn) btn.innerHTML='<span class="spinner"></span>';
    try{
      const {error}=await supabase.from('debts').insert([{
        user_id:State.user.id,customer_name:name,customer_phone:phone||null,
        amount,description:desc||null,due_date:due,
      }]);
      if(error) throw error;
      showToast('✅ '+t('toast_debt_saved'),'success');
      this._renderDebts();
    }catch(e){console.error(e);showToast('❌ '+t('err_generic'),'error');}
    finally{if(btn)btn.innerText=t('btn_save_debt');}
  },

  async _payDebt(id,total,alreadyPaid){
    const inp=el(`pay-${id}`);
    const payAmount=inp?parseFloat(inp.value||'0'):Number(total)-Number(alreadyPaid);
    if(payAmount<=0){showToast('⚠️ '+(State.lang==='sw'?'Weka kiasi':'Enter amount'),'error');return;}
    const newPaid=Number(alreadyPaid)+payAmount;
    const status=newPaid>=Number(total)?'paid':newPaid>0?'partial':'unpaid';
    try{
      const {error}=await supabase.from('debts').update({amount_paid:newPaid,status}).eq('id',id);
      if(error) throw error;
      showToast('✅ '+t('toast_debt_paid'),'success');
      this._renderDebts();
    }catch(e){console.error(e);showToast('❌ '+t('err_generic'),'error');}
  },

  // ── REPORTS ───────────────────────────────────────────

  _renderReports(){
    setHtml('pos-content',`
      <div>
        <div class="section-header" style="margin-bottom:.75rem">
          <span class="section-title">${t('report_period')}</span>
        </div>
        <div class="period-tabs">
          ${['today','week','month','custom'].map(p=>`
            <button class="period-tab ${State.reportPeriod===p?'active':''}"
              onclick="App._setPeriod('${p}')">${t('period_'+p)}</button>`).join('')}
        </div>
        <div id="custom-range" style="${State.reportPeriod==='custom'?'display:flex':'display:none'};gap:.65rem;margin-bottom:.875rem;flex-wrap:wrap">
          <div class="form-group" style="flex:1;min-width:130px">
            <label class="form-label">${t('report_from')}</label>
            <input class="form-input" id="rep-from" type="date" value="${State.reportFrom||today()}"
              onchange="State.reportFrom=this.value"/>
          </div>
          <div class="form-group" style="flex:1;min-width:130px">
            <label class="form-label">${t('report_to')}</label>
            <input class="form-input" id="rep-to" type="date" value="${State.reportTo||today()}"
              onchange="State.reportTo=this.value"/>
          </div>
        </div>
        <button class="btn-primary" onclick="App._generateReport()" style="margin-bottom:1.1rem">
          ${t('btn_generate')}</button>
        <div id="report-output"></div>
      </div>`);
  },

  _setPeriod(p){
    State.reportPeriod=p;
    this._renderReports();
  },

  async _generateReport(){
    const ro=el('report-output'); if(!ro) return;
    ro.innerHTML=loader();
    const {from,to}=dateRange(State.reportPeriod);
    const uid=State.user.id;
    let sales=[],expenses=[],debts=[];
    try{
      const [r1,r2,r3]=await Promise.all([
        supabase.from('sales').select('*').eq('user_id',uid).gte('sale_date',from).lte('sale_date',to),
        supabase.from('expenses').select('*').eq('user_id',uid).gte('expense_date',from).lte('expense_date',to),
        supabase.from('debts').select('*').eq('user_id',uid),
      ]);
      sales=r1.data||[]; expenses=r2.data||[]; debts=r3.data||[];
    }catch(e){console.error(e);}

    const revenue=sales.reduce((a,s)=>a+Number(s.revenue),0);
    const cogs=sales.reduce((a,s)=>a+Number(s.buying_price)*Number(s.qty),0);
    const grossProfit=revenue-cogs;
    const totalExp=expenses.reduce((a,e)=>a+Number(e.amount),0);
    const netProfit=grossProfit-totalExp;
    const totalDebt=debts.filter(d=>d.status!=='paid').reduce((a,d)=>a+(Number(d.amount)-Number(d.amount_paid)),0);
    const paidDebt=debts.filter(d=>d.status==='paid').reduce((a,d)=>a+Number(d.amount),0);

    // Top products
    const productMap={};
    sales.forEach(s=>{
      if(!productMap[s.product_name]) productMap[s.product_name]={name:s.product_name,qty:0,revenue:0,profit:0};
      productMap[s.product_name].qty+=Number(s.qty);
      productMap[s.product_name].revenue+=Number(s.revenue);
      productMap[s.product_name].profit+=Number(s.profit);
    });
    const topProducts=Object.values(productMap).sort((a,b)=>b.revenue-a.revenue).slice(0,10);

    // Expense by category
    const expMap={};
    expenses.forEach(e=>{
      if(!expMap[e.category]) expMap[e.category]=0;
      expMap[e.category]+=Number(e.amount);
    });

    const periodLabel=`${fmtDate(from)}${from!==to?' — '+fmtDate(to):''}`;

    // Set print header
    const ph=el('print-header');
    if(ph) ph.innerHTML=`
      <div style="text-align:center;margin-bottom:1.5rem">
        <div style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700">BomaWave</div>
        <div style="font-size:.85rem;color:#666;margin-top:.25rem">${State.user.store_name} · ${t('report_period')}: ${periodLabel}</div>
        <div style="font-size:.75rem;color:#888;margin-top:.1rem">${State.lang==='sw'?'Ripoti iliyoundwa':'Report generated'}: ${new Date().toLocaleString()}</div>
      </div>`;

    ro.innerHTML=`
      <div id="printable-report">
        <!-- P&L Summary -->
        <div class="report-section">
          <div class="report-section-title">${t('report_profit_summary')} · ${periodLabel}</div>
          <div class="report-row"><span class="report-label">${t('total_revenue')}</span><span class="report-value green">${fmt(revenue)}</span></div>
          <div class="report-row"><span class="report-label">${State.lang==='sw'?'Gharama za Bidhaa (COGS)':'Cost of Goods Sold'}</span><span class="report-value red">- ${fmt(cogs)}</span></div>
          <div class="report-row"><span class="report-label">${t('gross_profit')}</span><span class="report-value ${grossProfit>=0?'green':'red'}">${fmt(grossProfit)}</span></div>
          <div class="report-row"><span class="report-label">${t('total_expenses')}</span><span class="report-value red">- ${fmt(totalExp)}</span></div>
          <div class="report-row" style="border-top:2px solid var(--border2);padding-top:.5rem;margin-top:.25rem">
            <span style="font-size:.88rem;font-weight:800">${t('net_profit')}</span>
            <span style="font-size:1rem;font-weight:800;color:${netProfit>=0?'var(--green-mid)':'var(--red)'}">${fmt(netProfit)}</span>
          </div>
        </div>

        <!-- Expense Breakdown -->
        ${Object.keys(expMap).length?`
        <div class="report-section">
          <div class="report-section-title">${t('report_expense_summary')}</div>
          ${Object.entries(expMap).map(([cat,amt])=>`
            <div class="report-row">
              <span class="report-label">${t('exp_'+cat)||cat}</span>
              <span class="report-value red">${fmt(amt)}</span>
            </div>`).join('')}
        </div>`:''}

        <!-- Top Products -->
        ${topProducts.length?`
        <div class="report-section">
          <div class="report-section-title">${t('report_top_products')}</div>
          <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>${t('product_ranking')}</th>
              <th>${t('sale_product')}</th>
              <th>${t('times_sold')}</th>
              <th>${t('total_revenue')}</th>
              <th>${t('gross_profit')}</th>
            </tr></thead>
            <tbody>${topProducts.map((p,i)=>`
              <tr>
                <td style="font-weight:800;color:${i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#b45309':'var(--muted)'}">#${i+1}</td>
                <td style="font-weight:700">${p.name}</td>
                <td>${p.qty}</td>
                <td style="color:var(--green-mid);font-weight:700">${fmt(p.revenue)}</td>
                <td class="${p.profit>=0?'report-value green':'report-value red'}" style="font-weight:700">${fmt(p.profit)}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>`:''}

        <!-- Debts Summary -->
        <div class="report-section">
          <div class="report-section-title">${t('report_debts_summary')}</div>
          <div class="report-row"><span class="report-label">${t('unpaid_debts')}</span><span class="report-value red">${fmt(totalDebt)}</span></div>
          <div class="report-row"><span class="report-label">${t('paid_debts')}</span><span class="report-value green">${fmt(paidDebt)}</span></div>
          <div class="report-row"><span class="report-label">${State.lang==='sw'?'Jumla ya Wadeni':'Total Debtors'}</span><span class="report-value">${debts.filter(d=>d.status!=='paid').length}</span></div>
        </div>
      </div>
      <button class="btn-primary" onclick="App._printReport()" style="margin-top:1rem">
        <span>🖨️</span> ${t('btn_print')}</button>`;
  },

  _printReport(){
    window.print();
  },

  // ══════════════════════════════════════════════════════
  //  DISTRIBUTOR DASHBOARD
  // ══════════════════════════════════════════════════════

  async _renderDashboard(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=loader();
    const tod=new Date(); tod.setHours(0,0,0,0);
    const uid=State.user.id;
    let todOrders=[],allOrders=[],products=[];
    try{
      const [r1,r2,r3]=await Promise.all([
        supabase.from('orders').select('*').eq('distributor_id',uid).gte('created_at',tod.toISOString()),
        supabase.from('orders').select('retailer_id').eq('distributor_id',uid),
        supabase.from('products').select('*').eq('distributor_id',uid),
      ]);
      todOrders=r1.data||[]; allOrders=r2.data||[]; products=r3.data||[];
    }catch(e){console.error(e);}
    const pending=todOrders.filter(o=>o.status==='pending').length;
    const revenue=todOrders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+Number(o.total_price),0);
    const uniqueRet=new Set(allOrders.map(r=>r.retailer_id)).size;
    const lowStock=products.filter(p=>p.stock_qty>0&&p.stock_qty<10).length;
    const outStock=products.filter(p=>p.stock_qty===0).length;
    this._updateOrderBadge();
    view.innerHTML=`
      <div class="stats-row">
        <div class="stat-card green"><div class="stat-icon">📋</div>
          <div class="stat-label">${t('stat_orders_today')}</div><div class="stat-value">${todOrders.length}</div></div>
        <div class="stat-card amber"><div class="stat-icon">⏳</div>
          <div class="stat-label">${t('stat_pending')}</div><div class="stat-value">${pending}</div></div>
        <div class="stat-card blue"><div class="stat-icon">💰</div>
          <div class="stat-label">${t('stat_revenue')}</div>
          <div class="stat-value" style="font-size:1rem;color:var(--blue-dark)">${fmt(revenue)}</div></div>
        <div class="stat-card red"><div class="stat-icon">🏪</div>
          <div class="stat-label">${t('stat_retailers')}</div><div class="stat-value">${uniqueRet}</div></div>
      </div>
      ${(lowStock||outStock)?`<div class="alert alert-warn">
        ⚠️ ${State.lang==='sw'?`Bidhaa ${outStock} zimekwisha · ${lowStock} zinakwisha`:`${outStock} out of stock · ${lowStock} running low`}
        <button onclick="App.navigate('inventory')" style="margin-left:auto;font-weight:700;background:none;border:none;color:var(--amber);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.75rem">
          ${State.lang==='sw'?'Angalia Stoki →':'Check Inventory →'}</button></div>`:''}
      <div class="section-header">
        <span class="section-title">${State.lang==='sw'?'Maagizo ya Leo':"Today's Orders"}</span>
        <button class="section-action" onclick="App.navigate('orders')">${t('view_all')}</button>
      </div>
      ${!todOrders.length?`<div class="empty-state"><div class="empty-icon">📋</div>
        <div class="empty-title">${t('no_orders')}</div><div class="empty-sub">${t('no_orders_sub')}</div></div>`:`
      <div class="card"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${t('order_id')}</th><th>${t('items')}</th>
            <th>${t('total')}</th><th>${t('status')}</th><th>${t('action')}</th>
          </tr></thead>
          <tbody>${todOrders.slice(0,6).map(o=>`
            <tr id="order-row-${o.id}">
              <td class="mono">${o.order_ref}</td>
              <td style="font-weight:700">${o.items_count||'—'}</td>
              <td style="color:var(--green-mid);font-weight:700">${fmt(o.total_price)}</td>
              <td id="status-${o.id}">${pill(o.status)}</td>
              <td id="actions-${o.id}">${this._actionButtons(o)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>`}`;
  },

  // ── DIST ORDERS ───────────────────────────────────────

  async _renderDistOrders(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=loader();
    let data=[];
    try{
      const {data:rows}=await supabase.from('orders')
        .select('*,retailer:profiles!orders_retailer_id_fkey(store_name,location,phone_number,district,ward)')
        .eq('distributor_id',State.user.id).order('created_at',{ascending:false});
      data=rows||[];
    }catch(e){console.error(e);}
    if(!data.length){
      view.innerHTML=`<div class="empty-state"><div class="empty-icon">📋</div>
        <div class="empty-title">${t('no_orders')}</div><div class="empty-sub">${t('no_orders_sub')}</div></div>`;
      this._updateOrderBadge();return;
    }
    view.innerHTML=`<div class="card"><div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>${t('retailer')}</th><th>${t('order_id')}</th>
          <th>${t('items')}</th><th>${t('total')}</th>
          <th>${t('status')}</th><th>${t('date')}</th><th>${t('action')}</th>
        </tr></thead>
        <tbody>${data.map(o=>`
          <tr id="order-row-${o.id}">
            <td><div style="font-weight:700;font-size:.8rem">${o.retailer?.store_name||'—'}</div>
              <div style="font-size:.7rem;color:var(--muted)">${[o.retailer?.ward,o.retailer?.district].filter(Boolean).join(', ')||''}</div>
              ${o.retailer?.phone_number?`<div style="font-size:.7rem;color:var(--muted)">${o.retailer.phone_number}</div>`:''}</td>
            <td class="mono">${o.order_ref}</td>
            <td style="font-weight:700">${o.items_count||'—'}</td>
            <td style="color:var(--green-mid);font-weight:700">${fmt(o.total_price)}</td>
            <td id="status-${o.id}">${pill(o.status)}</td>
            <td class="mono">${fmtDate(o.created_at)}</td>
            <td id="actions-${o.id}">${this._actionButtons(o)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div></div>`;
    this._updateOrderBadge();
  },

  _actionButtons(order){
    if(State.user.role!=='distributor') return '';
    if(order.status==='pending') return `
      <div style="display:flex;gap:4px">
        <button class="btn-sm green" onclick="App._updateOrderStatus('${order.id}','confirmed')">${t('confirm')}</button>
        <button class="btn-sm red" onclick="App._updateOrderStatus('${order.id}','cancelled')">${t('cancel')}</button>
      </div>`;
    if(order.status==='confirmed') return `
      <button class="btn-sm blue" onclick="App._updateOrderStatus('${order.id}','delivered')">${t('deliver')}</button>`;
    return `<span style="font-size:.72rem;color:var(--muted)">—</span>`;
  },

  async _updateOrderStatus(orderId,status){
    try{
      const {error}=await supabase.from('orders').update({status}).eq('id',orderId);
      if(error) throw error;
      const msg=status==='confirmed'?t('toast_order_confirmed'):status==='delivered'?t('toast_order_delivered'):'Done';
      showToast('✅ '+msg,'success');
      const sc=el(`status-${orderId}`); const ac=el(`actions-${orderId}`);
      if(sc) sc.innerHTML=pill(status);
      if(ac) ac.innerHTML=this._actionButtons({id:orderId,status});
      this._updateOrderBadge();
      if(State.activePage==='dashboard') this._renderDashboard();
    }catch(e){showToast('❌ '+t('err_generic'),'error');}
  },

  // ── PRODUCTS ──────────────────────────────────────────

  async _renderProducts(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=`
      <div style="display:grid;grid-template-columns:minmax(0,300px) 1fr;gap:1.25rem;align-items:start">
        <div class="card card-pad">
          <div class="section-title" style="margin-bottom:1rem">${t('add_product')}</div>
          <form onsubmit="App._addProduct(event)" style="display:flex;flex-direction:column;gap:.65rem">
            <div class="form-group">
              <label class="form-label">${t('product_name')}</label>
              <input class="form-input" id="p-name" required placeholder="${State.lang==='sw'?'mfano: Coca Cola 500ml':'e.g. Coca Cola 500ml'}"/>
            </div>
            <div class="form-group">
              <label class="form-label">${t('product_category')}</label>
              <select class="form-input" id="p-category" required>
                <option value="">${State.lang==='sw'?'— Chagua Aina —':'— Select Category —'}</option>
                ${CATEGORIES.map(c=>`<option value="${c.key}">${catLabel(c.key)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">${t('product_image')}</label>
              <div class="img-upload-wrap" onclick="document.getElementById('p-img-input').click()">
                <input type="file" id="p-img-input" accept="image/*" capture="environment"
                  onchange="App._previewImage(this)" style="display:none"/>
                <img id="p-img-preview" class="img-preview" alt="preview"/>
                <div id="p-img-label" style="font-size:.78rem;color:var(--muted);font-weight:600">
                  ${t('upload_photo')}</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">${t('product_price')}</label>
                <input class="form-input" id="p-price" type="number" min="1" required placeholder="0"/>
              </div>
              <div class="form-group">
                <label class="form-label">${t('product_cost')}</label>
                <input class="form-input" id="p-cost" type="number" min="0" placeholder="0"/>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">${t('product_qty')}</label>
                <input class="form-input" id="p-qty" type="number" min="0" required placeholder="0"/>
              </div>
              <div class="form-group">
                <label class="form-label">${t('product_unit')}</label>
                <input class="form-input" id="p-unit" placeholder="${State.lang==='sw'?'mfano: Krate, Mfuko':'e.g. Crate, Bag'}"/>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">${t('product_desc')}</label>
              <input class="form-input" id="p-desc" placeholder="${State.lang==='sw'?'Maelezo mafupi...':'Short description...'}"/>
            </div>
            <button type="submit" class="btn-primary" id="add-product-btn">
              <span id="add-product-text">${t('btn_add_product')}</span>
            </button>
          </form>
        </div>
        <div>
          <div class="section-title" style="margin-bottom:.875rem">
            ${State.lang==='sw'?'Bidhaa Zilizowekwa Sokoni':'Listed Products'}
          </div>
          <div id="my-products-list">${loader()}</div>
        </div>
      </div>`;
    this._loadMyProducts();
  },

  _previewImage(input){
    const file=input.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=e=>{
      const prev=el('p-img-preview'); const lbl=el('p-img-label');
      if(prev){prev.src=e.target.result;prev.style.display='block';}
      if(lbl) lbl.innerText=t('change_photo');
    };
    reader.readAsDataURL(file);
  },

  async _uploadImage(file){
    try{
      const ext=file.name.split('.').pop();
      const path=`products/${Date.now()}.${ext}`;
      const {data,error}=await supabase.storage.from('product-images').upload(path,file,{
        cacheControl:'3600',upsert:false,contentType:file.type,
      });
      if(error){console.warn('Image upload:',error.message);return null;}
      const {data:{publicUrl}}=supabase.storage.from('product-images').getPublicUrl(path);
      return publicUrl;
    }catch(e){console.error('Image upload error:',e);return null;}
  },

  async _loadMyProducts(){
    let data=[];
    try{
      const {data:rows}=await supabase.from('products').select('*')
        .eq('distributor_id',State.user.id).order('created_at',{ascending:false});
      data=rows||[];
    }catch(e){console.error(e);}
    const list=el('my-products-list'); if(!list) return;
    if(!data.length){
      list.innerHTML=`<div class="empty-state"><div class="empty-icon">🏷️</div>
        <div class="empty-title">${t('no_products')}</div>
        <div class="empty-sub">${t('no_products_sub')}</div></div>`;return;
    }
    list.innerHTML=`<div style="display:flex;flex-direction:column;gap:.6rem">
      ${data.map(p=>`
        <div class="card" style="padding:.875rem;display:flex;align-items:center;gap:.875rem">
          ${p.image_url
            ?`<img src="${p.image_url}" style="width:52px;height:52px;border-radius:.5rem;object-fit:cover;flex-shrink:0" alt="${p.product_name}"/>`
            :`<div style="width:52px;height:52px;border-radius:.5rem;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0">${catIcon(p.category)}</div>`}
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:.85rem">${p.product_name}</div>
            <div style="font-size:.72rem;color:var(--muted);margin-top:1px">${fmt(p.price)} · ${p.selling_unit||'—'} · ${catLabel(p.category)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:1.1rem;font-weight:800;color:var(--green-mid)">${p.stock_qty}</div>
            <div style="font-size:.62rem;color:var(--muted)">${State.lang==='sw'?'stoki':'stock'}</div>
          </div>
        </div>`).join('')}
    </div>`;
  },

  async _addProduct(e){
    e.preventDefault();
    const btn=el('add-product-btn'); const span=el('add-product-text');
    if(btn) btn.disabled=true;
    if(span) span.innerHTML=`<span class="spinner"></span> ${t('img_uploading')}`;
    let imageUrl=null;
    const imgInput=el('p-img-input');
    if(imgInput?.files[0]) imageUrl=await this._uploadImage(imgInput.files[0]);
    const payload={
      distributor_id:State.user.id,
      product_name:el('p-name').value.trim(),
      category:el('p-category').value,
      price:Number(el('p-price').value),
      cost_price:Number(el('p-cost').value||0),
      stock_qty:Number(el('p-qty').value),
      selling_unit:el('p-unit').value.trim()||null,
      description:el('p-desc').value.trim()||null,
      image_url:imageUrl,
    };
    try{
      const {error}=await supabase.from('products').insert([payload]);
      if(error) throw error;
      showToast('✅ '+t('toast_product_added'),'success');
      e.target.reset();
      const prev=el('p-img-preview'); if(prev){prev.src='';prev.style.display='none';}
      const lbl=el('p-img-label'); if(lbl) lbl.innerText=t('upload_photo');
      this._loadMyProducts();
    }catch(err){console.error(err);showToast('❌ '+t('err_generic'),'error');}
    finally{if(btn)btn.disabled=false;if(span)span.innerText=t('btn_add_product');}
  },

  // ── INVENTORY ─────────────────────────────────────────

  async _renderInventory(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=loader();
    let data=[];
    try{
      const {data:rows}=await supabase.from('products').select('*')
        .eq('distributor_id',State.user.id).order('stock_qty',{ascending:true});
      data=rows||[];
    }catch(e){console.error(e);}
    if(!data.length){
      view.innerHTML=`<div class="empty-state"><div class="empty-icon">📦</div>
        <div class="empty-title">${t('no_products')}</div></div>`;return;
    }
    const out=data.filter(p=>p.stock_qty===0).length;
    const low=data.filter(p=>p.stock_qty>0&&p.stock_qty<10).length;
    view.innerHTML=`
      ${out||low?`<div class="alert alert-warn">⚠️ ${State.lang==='sw'?`${out} zimekwisha · ${low} zinakwisha`:`${out} out of stock · ${low} running low`}</div>`:`
      <div class="alert alert-success">✅ ${State.lang==='sw'?'Stoki zote ziko sawa.':'All stock levels are healthy.'}</div>`}
      <div class="card"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${t('product_name')}</th><th>${t('product_category')}</th>
            <th>${t('product_price')}</th><th>${t('product_unit')}</th>
            <th>${t('stock_qty')}</th><th>${t('update_stock')}</th><th>${t('status')}</th>
          </tr></thead>
          <tbody>${data.map(p=>`
            <tr>
              <td style="display:flex;align-items:center;gap:.6rem">
                ${p.image_url?`<img src="${p.image_url}" style="width:32px;height:32px;border-radius:4px;object-fit:cover;flex-shrink:0"/>`:`<span style="font-size:1.2rem">${catIcon(p.category)}</span>`}
                <strong>${p.product_name}</strong>
              </td>
              <td>${catLabel(p.category)}</td>
              <td style="color:var(--green-mid);font-weight:700">${fmt(p.price)}</td>
              <td style="color:var(--muted)">${p.selling_unit||'—'}</td>
              <td><strong style="font-size:1rem">${p.stock_qty}</strong></td>
              <td>
                <div class="stock-edit">
                  <input type="number" id="stock-input-${p.id}" value="${p.stock_qty}" min="0" step="1"/>
                  <button class="btn-sm green" onclick="App._updateStock('${p.id}')">
                    ${State.lang==='sw'?'Weka':'Set'}</button>
                </div>
              </td>
              <td>${p.stock_qty===0?`<span class="pill pill-unpaid">✕ ${t('out_of_stock')}</span>`:
                   p.stock_qty<10?`<span class="pill pill-pending">⚠ ${t('low_stock')}</span>`:
                   `<span class="pill pill-paid">✓ ${t('in_stock')}</span>`}</td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>`;
  },

  async _updateStock(productId){
    const input=el(`stock-input-${productId}`); if(!input) return;
    const newQty=parseInt(input.value,10);
    if(isNaN(newQty)||newQty<0){showToast('⚠️ '+(State.lang==='sw'?'Idadi si sahihi':'Invalid quantity'),'error');return;}
    try{
      const {error}=await supabase.from('products').update({stock_qty:newQty}).eq('id',productId);
      if(error) throw error;
      showToast('✅ '+t('toast_stock_updated'),'success');
      this._renderInventory();
    }catch(e){showToast('❌ '+t('err_generic'),'error');}
  },

  // ── RETAILERS ─────────────────────────────────────────

  async _renderRetailers(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=loader();
    let orders=[];
    try{
      const {data:rows}=await supabase.from('orders')
        .select('*,retailer:profiles!orders_retailer_id_fkey(id,store_name,district,ward,phone_number)')
        .eq('distributor_id',State.user.id);
      orders=rows||[];
    }catch(e){console.error(e);}
    if(!orders.length){
      view.innerHTML=`<div class="empty-state"><div class="empty-icon">🏪</div>
        <div class="empty-title">${t('no_retailers')||'Hakuna maduka bado'}</div></div>`;return;
    }
    const map={};
    orders.forEach(o=>{
      const r=o.retailer; if(!r) return;
      if(!map[r.id]) map[r.id]={...r,totalOrders:0,totalSpent:0,lastOrder:o.created_at};
      map[r.id].totalOrders++;
      map[r.id].totalSpent+=Number(o.total_price);
      if(new Date(o.created_at)>new Date(map[r.id].lastOrder)) map[r.id].lastOrder=o.created_at;
    });
    const retailers=Object.values(map).sort((a,b)=>b.totalSpent-a.totalSpent);
    view.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.875rem">
      ${retailers.map(r=>`
        <div class="card card-pad">
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.875rem">
            <div style="width:40px;height:40px;border-radius:10px;background:var(--green-light);
              display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">🏪</div>
            <div>
              <div style="font-weight:800;font-size:.85rem">${r.store_name}</div>
              <div style="font-size:.72rem;color:var(--muted)">${[r.ward,r.district].filter(Boolean).join(', ')||'—'}</div>
              ${r.phone_number?`<div style="font-size:.7rem;color:var(--muted)">${r.phone_number}</div>`:''}
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem">
            <div style="background:var(--bg2);border-radius:.4rem;padding:.45rem;text-align:center;border:1px solid var(--border)">
              <div style="font-size:.88rem;font-weight:800">${r.totalOrders}</div>
              <div style="font-size:.6rem;color:var(--muted);font-weight:600">${t('total_orders')}</div>
            </div>
            <div style="background:var(--bg2);border-radius:.4rem;padding:.45rem;text-align:center;border:1px solid var(--border)">
              <div style="font-size:.7rem;font-weight:800">${fmt(r.totalSpent)}</div>
              <div style="font-size:.6rem;color:var(--muted);font-weight:600">${t('total_spent')}</div>
            </div>
            <div style="background:var(--bg2);border-radius:.4rem;padding:.45rem;text-align:center;border:1px solid var(--border)">
              <div style="font-size:.68rem;font-weight:800">${fmtDate(r.lastOrder)}</div>
              <div style="font-size:.6rem;color:var(--muted);font-weight:600">${t('last_order')}</div>
            </div>
          </div>
        </div>`).join('')}
    </div>`;
  },

  // ══════════════════════════════════════════════════════
  //  ADMIN DASHBOARD
  // ══════════════════════════════════════════════════════

  async _renderAdminDashboard(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=loader();
    let profiles=[],orders=[];
    try{
      const [r1,r2]=await Promise.all([
        supabase.from('profiles').select('*').neq('role','admin'),
        supabase.from('orders').select('*'),
      ]);
      profiles=r1.data||[]; orders=r2.data||[];
    }catch(e){console.error(e);}
    const totalUsers=profiles.length;
    const dists=profiles.filter(p=>p.role==='distributor').length;
    const rets=profiles.filter(p=>p.role==='retailer').length;
    const gmv=orders.filter(o=>o.status!=='cancelled').reduce((a,o)=>a+Number(o.total_price),0);
    const todOrders=orders.filter(o=>new Date(o.created_at).toDateString()===new Date().toDateString()).length;
    view.innerHTML=`
      <div class="stats-row">
        <div class="stat-card green"><div class="stat-icon">👥</div>
          <div class="stat-label">${t('stat_total_users')}</div><div class="stat-value">${totalUsers}</div></div>
        <div class="stat-card blue"><div class="stat-icon">🚚</div>
          <div class="stat-label">${t('stat_active_dist')}</div><div class="stat-value">${dists}</div></div>
        <div class="stat-card amber"><div class="stat-icon">🏪</div>
          <div class="stat-label">${t('stat_active_ret')}</div><div class="stat-value">${rets}</div></div>
        <div class="stat-card purple"><div class="stat-icon">💰</div>
          <div class="stat-label">${t('stat_total_revenue')}</div>
          <div class="stat-value" style="font-size:1rem;color:var(--purple)">${fmt(gmv)}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.875rem;margin-bottom:1.1rem">
        <div class="card card-pad" style="cursor:pointer" onclick="App.navigate('admin_users')">
          <div style="font-size:.82rem;font-weight:700;margin-bottom:.35rem">${t('nav_users')}</div>
          <div style="font-size:1.5rem;font-weight:800">${totalUsers}</div>
          <div style="font-size:.7rem;color:var(--green-mid);margin-top:.25rem">${t('view_all')}</div>
        </div>
        <div class="card card-pad" style="cursor:pointer" onclick="App.navigate('admin_orders')">
          <div style="font-size:.82rem;font-weight:700;margin-bottom:.35rem">${t('nav_all_orders')}</div>
          <div style="font-size:1.5rem;font-weight:800">${orders.length}</div>
          <div style="font-size:.7rem;color:var(--green-mid);margin-top:.25rem">${State.lang==='sw'?`${todOrders} leo`:`${todOrders} today`}</div>
        </div>
      </div>
      <div class="section-header"><span class="section-title">${State.lang==='sw'?'Watumiaji wa Hivi Karibuni':'Recent Users'}</span></div>
      <div class="card"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${t('lbl_store')}</th><th>${t('user_type')}</th>
            <th>${t('lbl_district')}</th><th>${t('lbl_phone')}</th>
            <th>${t('joined')}</th><th>${t('action')}</th>
          </tr></thead>
          <tbody>${profiles.slice(0,10).map(p=>`
            <tr>
              <td style="font-weight:700">${p.store_name}</td>
              <td>${p.role==='distributor'?`<span class="pill pill-confirmed">${State.lang==='sw'?'Msambazaji':'Distributor'}</span>`:
                  `<span class="pill pill-delivered">${State.lang==='sw'?'Duka':'Retailer'}</span>`}</td>
              <td style="color:var(--muted)">${p.district||'—'}</td>
              <td style="color:var(--muted)">${p.phone_number||'—'}</td>
              <td class="mono">${fmtDate(p.created_at)}</td>
              <td>
                <button class="btn-sm ${p.is_active?'red':'green'}"
                  onclick="App._toggleUser('${p.id}',${p.is_active})">
                  ${p.is_active?t('suspend'):t('approve')}</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>`;
  },

  async _renderAdminUsers(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=loader();
    let profiles=[];
    try{
      const {data:rows}=await supabase.from('profiles').select('*')
        .neq('role','admin').order('created_at',{ascending:false});
      profiles=rows||[];
    }catch(e){console.error(e);}
    view.innerHTML=`
      <div style="display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap">
        <span class="pill pill-confirmed">${profiles.filter(p=>p.role==='distributor').length} ${State.lang==='sw'?'Wasambazaji':'Distributors'}</span>
        <span class="pill pill-delivered">${profiles.filter(p=>p.role==='retailer').length} ${State.lang==='sw'?'Maduka':'Retailers'}</span>
        <span class="pill pill-pending">${profiles.filter(p=>!p.is_active).length} ${State.lang==='sw'?'Waliozuiwa':'Suspended'}</span>
      </div>
      <div class="card"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${t('lbl_store')}</th><th>${t('lbl_user')}</th>
            <th>${t('user_type')}</th><th>${t('lbl_region')}</th>
            <th>${t('lbl_district')}</th><th>${t('lbl_ward')}</th>
            <th>${t('lbl_phone')}</th><th>${t('joined')}</th><th>${t('action')}</th>
          </tr></thead>
          <tbody>${profiles.map(p=>`
            <tr style="${!p.is_active?'opacity:.5':''}">
              <td style="font-weight:700">${p.store_name}</td>
              <td class="mono">${p.username}</td>
              <td>${p.role==='distributor'?`<span class="pill pill-confirmed">Dist</span>`:
                  `<span class="pill pill-delivered">Ret</span>`}</td>
              <td style="color:var(--muted)">${p.region||'—'}</td>
              <td style="color:var(--muted)">${p.district||'—'}</td>
              <td style="color:var(--muted)">${p.ward||'—'}</td>
              <td style="color:var(--muted)">${p.phone_number||'—'}</td>
              <td class="mono">${fmtDate(p.created_at)}</td>
              <td>
                <button class="btn-sm ${p.is_active?'red':'green'}"
                  onclick="App._toggleUser('${p.id}',${p.is_active})">
                  ${p.is_active?t('suspend'):t('approve')}</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>`;
  },

  async _renderAdminOrders(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=loader();
    let orders=[];
    try{
      const {data:rows}=await supabase.from('orders')
        .select('*,retailer:profiles!orders_retailer_id_fkey(store_name,district),distributor:profiles!orders_distributor_id_fkey(store_name)')
        .order('created_at',{ascending:false}).limit(200);
      orders=rows||[];
    }catch(e){console.error(e);}
    const gmv=orders.filter(o=>o.status!=='cancelled').reduce((a,o)=>a+Number(o.total_price),0);
    view.innerHTML=`
      <div class="stats-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:1rem">
        <div class="stat-card green"><div class="stat-icon">📋</div>
          <div class="stat-label">${t('platform_orders')}</div><div class="stat-value">${orders.length}</div></div>
        <div class="stat-card blue"><div class="stat-icon">⏳</div>
          <div class="stat-label">${t('stat_pending')}</div>
          <div class="stat-value">${orders.filter(o=>o.status==='pending').length}</div></div>
        <div class="stat-card purple"><div class="stat-icon">💰</div>
          <div class="stat-label">${t('platform_gmv')}</div>
          <div class="stat-value" style="font-size:.95rem;color:var(--purple)">${fmt(gmv)}</div></div>
      </div>
      <div class="card"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${t('order_id')}</th><th>${t('retailer')}</th>
            <th>${t('distributor')}</th><th>${t('total')}</th>
            <th>${t('status')}</th><th>${t('date')}</th>
          </tr></thead>
          <tbody>${orders.map(o=>`
            <tr><td class="mono">${o.order_ref}</td>
            <td><div style="font-weight:700;font-size:.8rem">${o.retailer?.store_name||'—'}</div>
              <div style="font-size:.7rem;color:var(--muted)">${o.retailer?.district||''}</div></td>
            <td style="font-size:.8rem">${o.distributor?.store_name||'—'}</td>
            <td style="color:var(--green-mid);font-weight:700">${fmt(o.total_price)}</td>
            <td>${pill(o.status)}</td>
            <td class="mono">${fmtDate(o.created_at)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>`;
  },

  async _renderAdminAnalytics(){
    const view=el('app-view'); if(!view) return;
    view.innerHTML=loader();
    let orders=[],profiles=[];
    try{
      const [r1,r2]=await Promise.all([
        supabase.from('orders').select('*,distributor:profiles!orders_distributor_id_fkey(store_name)'),
        supabase.from('profiles').select('*').neq('role','admin'),
      ]);
      orders=r1.data||[]; profiles=r2.data||[];
    }catch(e){console.error(e);}
    // Top distributors
    const distMap={};
    orders.filter(o=>o.status!=='cancelled').forEach(o=>{
      const name=o.distributor?.store_name||o.distributor_id;
      if(!distMap[name]) distMap[name]={name,orders:0,revenue:0};
      distMap[name].orders++;
      distMap[name].revenue+=Number(o.total_price);
    });
    const topDist=Object.values(distMap).sort((a,b)=>b.revenue-a.revenue).slice(0,10);
    // Orders by status
    const byStatus={pending:0,confirmed:0,delivered:0,cancelled:0};
    orders.forEach(o=>{byStatus[o.status]=(byStatus[o.status]||0)+1;});
    // Users by region
    const byRegion={};
    profiles.forEach(p=>{
      const r=p.region||'Unknown';
      if(!byRegion[r]) byRegion[r]=0;
      byRegion[r]++;
    });
    view.innerHTML=`
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem">
        <div class="report-section">
          <div class="report-section-title">${State.lang==='sw'?'Maagizo kwa Hali':'Orders by Status'}</div>
          ${Object.entries(byStatus).map(([s,n])=>`
            <div class="report-row">
              <span class="report-label">${pill(s)}</span>
              <span class="report-value">${n} ${State.lang==='sw'?'('+Math.round(n/orders.length*100)+'%)':'('+Math.round(n/orders.length*100)+'%)'}</span>
            </div>`).join('')}
        </div>
        <div class="report-section">
          <div class="report-section-title">${State.lang==='sw'?'Watumiaji kwa Mkoa':'Users by Region'}</div>
          ${Object.entries(byRegion).sort((a,b)=>b[1]-a[1]).map(([r,n])=>`
            <div class="report-row">
              <span class="report-label">${r}</span>
              <span class="report-value">${n}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="report-section" style="margin-top:1rem">
        <div class="report-section-title">${State.lang==='sw'?'Wasambazaji Bora':'Top Distributors'}</div>
        <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>#</th><th>${State.lang==='sw'?'Msambazaji':'Distributor'}</th>
            <th>${State.lang==='sw'?'Maagizo':'Orders'}</th>
            <th>${State.lang==='sw'?'Mapato':'Revenue'}</th>
          </tr></thead>
          <tbody>${topDist.map((d,i)=>`
            <tr>
              <td style="font-weight:800;color:${i===0?'#f59e0b':i===1?'#94a3b8':'var(--muted)'}">#${i+1}</td>
              <td style="font-weight:700">${d.name}</td>
              <td>${d.orders}</td>
              <td style="color:var(--green-mid);font-weight:700">${fmt(d.revenue)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>`;
  },

  async _toggleUser(id,currentlyActive){
    try{
      const {error}=await supabase.from('profiles').update({is_active:!currentlyActive}).eq('id',id);
      if(error) throw error;
      showToast(`✅ ${currentlyActive?(State.lang==='sw'?'Mtumiaji amezuiwa':'User suspended'):(State.lang==='sw'?'Mtumiaji ameruhusiwa':'User approved')}`, 'success');
      if(State.activePage==='admin_dashboard') this._renderAdminDashboard();
      else if(State.activePage==='admin_users') this._renderAdminUsers();
    }catch(e){showToast('❌ '+t('err_generic'),'error');}
  },
};

// Helper not in App object
function pill_simple(label,color){
  const map={amber:'pill-pending',green:'pill-paid',red:'pill-unpaid',blue:'pill-confirmed'};
  return `<span class="pill ${map[color]||'pill-pending'}">${label}</span>`;
}

// ═══════════════════════════════════════════════════════════
//  NOTIFICATION SOUND — Web Audio API (no file needed)
// ═══════════════════════════════════════════════════════════

// Single AudioContext shared across all sounds
let _audioCtx = null;
function _getAudioCtx(){
  if(!_audioCtx || _audioCtx.state==='closed'){
    try{ _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
    catch(e){ _audioCtx=null; }
  }
  return _audioCtx;
}

/**
 * playSmsSound(type)
 *   'new_order'   — distributor: bright double-beep (kama SMS ya order mpya)
 *   'confirmed'   — retailer:    warm triple-tone (imani)
 *   'delivered'   — retailer:    upward chime (furaha)
 */
function playSmsSound(type='new_order'){
  const ctx=_getAudioCtx(); if(!ctx) return;
  // Resume context if suspended (browser autoplay policy)
  if(ctx.state==='suspended') ctx.resume();

  const now=ctx.currentTime;

  if(type==='new_order'){
    // Double beep: 880Hz → 1100Hz, kama Nokia SMS
    [[880,0,0.12],[1100,0.16,0.12],[880,0.32,0.12],[1100,0.48,0.14]].forEach(([freq,delay,dur])=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type='sine'; osc.frequency.setValueAtTime(freq,now+delay);
      gain.gain.setValueAtTime(0,now+delay);
      gain.gain.linearRampToValueAtTime(0.55,now+delay+0.015);
      gain.gain.exponentialRampToValueAtTime(0.001,now+delay+dur);
      osc.start(now+delay); osc.stop(now+delay+dur+0.02);
    });

  } else if(type==='confirmed'){
    // Triple ascending tone — imani / confirmed
    [[523,0,0.18],[659,0.22,0.18],[784,0.44,0.28]].forEach(([freq,delay,dur])=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type='triangle'; osc.frequency.setValueAtTime(freq,now+delay);
      gain.gain.setValueAtTime(0,now+delay);
      gain.gain.linearRampToValueAtTime(0.4,now+delay+0.02);
      gain.gain.exponentialRampToValueAtTime(0.001,now+delay+dur);
      osc.start(now+delay); osc.stop(now+delay+dur+0.02);
    });

  } else if(type==='delivered'){
    // Upward chime — bidhaa imefikia
    [[392,0,0.1],[523,0.12,0.1],[659,0.24,0.1],[784,0.36,0.22],[1047,0.52,0.35]].forEach(([freq,delay,dur])=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type='sine'; osc.frequency.setValueAtTime(freq,now+delay);
      gain.gain.setValueAtTime(0,now+delay);
      gain.gain.linearRampToValueAtTime(0.35,now+delay+0.015);
      gain.gain.exponentialRampToValueAtTime(0.001,now+delay+dur);
      osc.start(now+delay); osc.stop(now+delay+dur+0.02);
    });
  }
}

// Unlock audio on first user interaction (browser requirement)
function _unlockAudio(){
  const ctx=_getAudioCtx();
  if(ctx&&ctx.state==='suspended') ctx.resume();
  document.removeEventListener('click',_unlockAudio);
  document.removeEventListener('touchstart',_unlockAudio);
}
document.addEventListener('click',_unlockAudio,{once:true});
document.addEventListener('touchstart',_unlockAudio,{once:true});

// ═══════════════════════════════════════════════════════════
//  GLOBAL SETUP
// ═══════════════════════════════════════════════════════════
window.App=App;
window.State=State;

document.addEventListener('click',e=>{
  if(!el('notif-bell')?.contains(e.target)&&!el('notif-dropdown')?.contains(e.target)){
    State.notifOpen=false;
    el('notif-dropdown')?.classList.remove('open');
  }
});

document.addEventListener('DOMContentLoaded',()=>{
  if(App._restoreSession()){
    App.launchApp();
  }
});
