// app.js - Complete FMCG Platform with English/Swahili & Real-time Notifications
import { supabase } from './supabase.js'

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  en: {
    loginTitle: 'Karibu - FMCG Platform',
    nameLabel: 'Name',
    emailLabel: 'Email',
    phoneLabel: 'Phone (optional)',
    locationLabel: 'Location',
    roleLabel: 'I am a:',
    retailer: 'Retailer',
    distributor: 'Distributor',
    sendLink: 'Send Login Link',
    loading: 'Loading...',
    addProduct: 'Add Product',
    productName: 'Product Name (English)',
    productNameSw: 'Jina la Bidhaa (Kiswahili)',
    price: 'Price (TZS)',
    quantity: 'Quantity',
    minOrderQty: 'Minimum Order Quantity',
    category: 'Category',
    search: 'Search products...',
    allCategories: 'All Categories',
    addToCart: 'Add to Cart',
    cart: 'Cart',
    checkout: 'Checkout',
    total: 'Total',
    minOrderWarning: 'Minimum order met',
    orderPlaced: 'Order placed successfully!',
    orderNumber: 'Order #',
    noProducts: 'No products available',
    noOrders: 'No orders yet',
    emptyCart: 'Your cart is empty',
    deliveryAddress: 'Delivery address...',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    mobileMoney: 'Mobile Money',
    myOrders: 'My Orders',
    products: 'Products',
    orders: 'Orders',
    alerts: 'Alerts',
    newOrder: 'New Order!',
    from: 'from',
    orderStatus: 'Order Status',
    pending: 'pending',
    confirmed: 'confirmed',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled'
  },
  sw: {
    loginTitle: 'Karibu - Jukwaa la FMCG',
    nameLabel: 'Jina',
    emailLabel: 'Barua pepe',
    phoneLabel: 'Nambari ya simu (si lazima)',
    locationLabel: 'Eneo',
    roleLabel: 'Mimi ni:',
    retailer: 'Muuzaji',
    distributor: 'Msambazaji',
    sendLink: 'Tuma Kiungo cha Kuingia',
    loading: 'Inapakia...',
    addProduct: 'Ongeza Bidhaa',
    productName: 'Jina la Bidhaa (Kiingereza)',
    productNameSw: 'Jina la Bidhaa (Kiswahili)',
    price: 'Bei (TZS)',
    quantity: 'Kiasi',
    minOrderQty: 'Kiwango cha chini cha Kuagiza',
    category: 'Aina',
    search: 'Tafuta bidhaa...',
    allCategories: 'Aina zote',
    addToCart: 'Ingiza Rukwama',
    cart: 'Rukwama',
    checkout: 'Maliza',
    total: 'Jumla',
    minOrderWarning: 'Kiwango cha chini kimefikia',
    orderPlaced: 'Agizo limewekwa kikamilifu!',
    orderNumber: 'Agizo #',
    noProducts: 'Hakuna bidhaa zinazopatikana',
    noOrders: 'Hakuna maagizo bado',
    emptyCart: 'Rukwama yako ni tupu',
    deliveryAddress: 'Anwani ya utoaji...',
    paymentMethod: 'Njia ya Malipo',
    cash: 'Pesa taslimu',
    card: 'Kadi',
    mobileMoney: 'M-Pesa / Tigo Pesa',
    myOrders: 'Maagizo Yangu',
    products: 'Bidhaa',
    orders: 'Maagizo',
    alerts: 'Tahadhari',
    newOrder: 'Agizo Jipya!',
    from: 'kutoka kwa',
    orderStatus: 'Hali ya Agizo',
    pending: 'inasubiri',
    confirmed: 'imethibitishwa',
    processing: 'inachakatwa',
    shipped: 'imesafirishwa',
    delivered: 'imewasilishwa',
    cancelled: 'imeghairiwa'
  }
};

let currentLanguage = 'en';
let currentUser = null;
let currentRole = null;
let currentRetailerId = null;
let currentDistributorId = null;
let cart = [];
let notificationSubscription = null;

// ============================================
// DOM Elements
// ============================================
const loginSection = document.getElementById('loginSection');
const distributorDashboard = document.getElementById('distributorDashboard');
const retailerDashboard = document.getElementById('retailerDashboard');
const loading = document.getElementById('loading');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const locationInput = document.getElementById('location');
const sendOtpBtn = document.getElementById('sendOtp');
const roleRetailer = document.getElementById('roleRetailer');
const roleDistributor = document.getElementById('roleDistributor');

let selectedRole = 'retailer';

// ============================================
// Language Functions
// ============================================
window.switchLanguage = (lang) => {
  currentLanguage = lang;
  updateUIText();
  // Refresh current view to show translated content
  if (currentRole === 'distributor') {
    loadDistributorProducts();
    loadDistributorOrders();
  } else if (currentRole === 'retailer') {
    loadAvailableProducts();
    loadRetailerOrders();
  }
};

function t(key) {
  return translations[currentLanguage][key] || key;
}

function updateUIText() {
  // Update all elements with data-i18n attribute or specific IDs
  const elements = {
    loginTitle: t('loginTitle'),
    nameLabel: t('nameLabel'),
    emailLabel: t('emailLabel'),
    phoneLabel: t('phoneLabel'),
    locationLabel: t('locationLabel'),
    roleLabel: t('roleLabel'),
    sendLink: t('sendLink')
  };
  
  for (const [id, text] of Object.entries(elements)) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = text;
  }
  
  if (roleRetailer) roleRetailer.innerHTML = `🏪 ${t('retailer')}`;
  if (roleDistributor) roleDistributor.innerHTML = `📦 ${t('distributor')}`;
  if (sendOtpBtn) sendOtpBtn.innerHTML = `📧 ${t('sendLink')}`;
  
  // Update dashboard titles
  const distributorTitle = document.getElementById('distributorTitle');
  if (distributorTitle) distributorTitle.innerHTML = `📦 ${t('distributor')}`;
  
  const retailerTitle = document.getElementById('retailerTitle');
  if (retailerTitle) retailerTitle.innerHTML = `🏪 ${t('retailer')}`;
  
  // Update tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    const tabId = btn.dataset.tab;
    if (tabId === 'productsTab') btn.innerHTML = `📦 ${t('products')}`;
    if (tabId === 'ordersTab') btn.innerHTML = `🛒 ${t('orders')}`;
    if (tabId === 'alertsTab') btn.innerHTML = `⚠️ ${t('alerts')}`;
    if (tabId === 'browseTab') btn.innerHTML = `🛍️ ${t('products')}`;
    if (tabId === 'retailerOrdersTab') btn.innerHTML = `📦 ${t('myOrders')}`;
  });
  
  // Update add product form
  const addProductTitle = document.getElementById('addProductTitle');
  if (addProductTitle) addProductTitle.innerHTML = `➕ ${t('addProduct')}`;
  
  const productNameInput = document.getElementById('productName');
  if (productNameInput) productNameInput.placeholder = t('productName');
  
  const productNameSwInput = document.getElementById('productNameSw');
  if (productNameSwInput) productNameSwInput.placeholder = t('productNameSw');
  
  const productPriceInput = document.getElementById('productPrice');
  if (productPriceInput) productPriceInput.placeholder = t('price');
  
  const productStockInput = document.getElementById('productStock');
  if (productStockInput) productStockInput.placeholder = t('quantity');
  
  const minOrderQtyInput = document.getElementById('minOrderQty');
  if (minOrderQtyInput) minOrderQtyInput.placeholder = t('minOrderQty');
  
  const productCategoryInput = document.getElementById('productCategory');
  if (productCategoryInput) productCategoryInput.placeholder = t('category');
  
  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn) addProductBtn.innerHTML = `➕ ${t('addProduct')}`;
  
  // Update search
  const searchInput = document.getElementById('searchProducts');
  if (searchInput) searchInput.placeholder = t('search');
  
  // Update cart modal
  const cartTitle = document.getElementById('cartTitle');
  if (cartTitle) cartTitle.innerHTML = `🛒 ${t('cart')}`;
  
  const totalLabel = document.getElementById('totalLabel');
  if (totalLabel) totalLabel.innerHTML = `${t('total')}:`;
  
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.innerHTML = `✅ ${t('checkout')}`;
  
  const deliveryAddress = document.getElementById('deliveryAddress');
  if (deliveryAddress) deliveryAddress.placeholder = t('deliveryAddress');
  
  const paymentMethod = document.getElementById('paymentMethod');
  if (paymentMethod) {
    paymentMethod.options[0].text = `💵 ${t('cash')}`;
    paymentMethod.options[1].text = `💳 ${t('card')}`;
    paymentMethod.options[2].text = `📱 ${t('mobileMoney')}`;
  }
}

// ============================================
// Role Selection
// ============================================
if (roleRetailer) {
  roleRetailer.addEventListener('click', () => {
    selectedRole = 'retailer';
    roleRetailer.classList.add('active');
    roleDistributor.classList.remove('active');
  });
}

if (roleDistributor) {
  roleDistributor.addEventListener('click', () => {
    selectedRole = 'distributor';
    roleDistributor.classList.add('active');
    roleRetailer.classList.remove('active');
  });
}

// ============================================
// Authentication
// ============================================
if (sendOtpBtn) {
  sendOtpBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) {
      alert(currentLanguage === 'en' ? 'Enter your email' : 'Weka barua pepe yako');
      return;
    }
    
    const name = nameInput.value.trim() || email.split('@')[0];
    const phone = phoneInput.value.trim();
    const location = locationInput.value.trim();
    
    showLoading(true);
    
    // First check if user exists, if not create profile
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    if (!existingUser) {
      // Sign up the user
      const { error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: Math.random().toString(36).slice(-8),
        options: {
          data: {
            name: name,
            role: selectedRole,
            phone: phone,
            location: location
          }
        }
      });
      
      if (signUpError && !signUpError.message.includes('already registered')) {
        alert('Error: ' + signUpError.message);
        showLoading(false);
        return;
      }
    }
    
    // Send magic link
    const redirectUrl = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
          role: selectedRole,
          phone: phone,
          location: location
        }
      }
    });
    
    showLoading(false);
    
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert(currentLanguage === 'en' 
        ? 'Check your email for the login link!' 
        : 'Angalia barua pepe yako kwa kiungo cha kuingia!');
    }
  });
}

// ============================================
// Auth State Handler
// ============================================
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    await loadUserData(session.user);
  } else if (event === 'SIGNED_OUT') {
    location.reload();
  }
});

async function loadUserData(user) {
  currentUser = user;
  showLoading(true);
  
  // Get or create profile
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (!profile) {
    const userMeta = user.user_metadata;
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        role: userMeta.role || 'retailer',
        name: userMeta.name || user.email.split('@')[0],
        phone: userMeta.phone || '',
        location: userMeta.location || '',
        language: currentLanguage
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      showLoading(false);
      return;
    }
    profile = newProfile;
  }
  
  currentRole = profile.role;
  
  if (currentRole === 'distributor') {
    await loadDistributorData(user.id);
  } else {
    await loadRetailerData(user.id);
  }
  
  showLoading(false);
}

// ============================================
// Notification System
// ============================================
let notificationSound = null;

function playNotificationSound() {
  try {
    // Create a simple beep using Web Audio API (works without external files)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  } catch(e) {
    console.log('Sound not supported:', e);
  }
}

function showNotification(title, message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification-toast notification-${type}`;
  
  const icon = type === 'order' ? '🛒' : (type === 'stock' ? '⚠️' : '🔔');
  
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${icon}</div>
      <div class="notification-text">
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">✕</button>
    </div>
  `;
  
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    left: 20px;
    max-width: 400px;
    margin: 0 auto;
    background: ${type === 'order' ? '#10b981' : (type === 'stock' ? '#f59e0b' : '#2563eb')};
    color: white;
    padding: 16px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    cursor: pointer;
  `;
  
  // Add click handler to open orders tab
  notification.onclick = (e) => {
    if (e.target.classList.contains('notification-close')) return;
    notification.remove();
    if (type === 'order' && currentRole === 'distributor') {
      // Switch to orders tab
      const ordersTab = document.querySelector('#distributorDashboard .tab-btn[data-tab="ordersTab"]');
      if (ordersTab) ordersTab.click();
    }
  };
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) notification.remove();
  }, 5000);
}

// Add CSS for notifications
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .notification-toast {
    animation: slideInRight 0.3s ease;
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .notification-icon {
    font-size: 24px;
  }
  
  .notification-text {
    flex: 1;
  }
  
  .notification-text strong {
    display: block;
    margin-bottom: 4px;
  }
  
  .notification-text p {
    margin: 0;
    font-size: 14px;
    opacity: 0.9;
  }
  
  .notification-close {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .notification-close:hover {
    background: rgba(255,255,255,0.3);
  }
`;
document.head.appendChild(notificationStyle);

// Subscribe to new orders for distributors
async function subscribeToNewOrders() {
  if (currentRole !== 'distributor') return;
  
  // Unsubscribe from previous subscription
  if (notificationSubscription) {
    await supabase.removeChannel(notificationSubscription);
  }
  
  // Get distributor's product IDs
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('distributor_id', currentDistributorId);
  
  if (!products || products.length === 0) return;
  
  const productIds = products.map(p => p.id);
  
  // Create a channel for real-time notifications
  notificationSubscription = supabase
    .channel('new-orders-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_items',
        filter: `product_id=in.(${productIds.join(',')})`
      },
      async (payload) => {
        // New order detected!
        const { data: order } = await supabase
          .from('orders')
          .select('*, retailers(store_name, user_id)')
          .eq('id', payload.new.order_id)
          .single();
        
        if (order) {
          // Get retailer name
          const retailerName = order.retailers?.store_name || t('retailer');
          
          // Show notification
          showNotification(
            `🛒 ${t('newOrder')}`,
            `${t('from')} ${retailerName} - ${t('orderNumber')}${order.order_number} - ${formatMoney(order.total_amount)} TZS`,
            'order'
          );
          
          // Play sound
          playNotificationSound();
          
          // Update orders count badge if exists
          const ordersTab = document.querySelector('#distributorDashboard .tab-btn[data-tab="ordersTab"]');
          if (ordersTab) {
            const existingBadge = ordersTab.querySelector('.notification-badge');
            if (existingBadge) {
              const count = parseInt(existingBadge.textContent) + 1;
              existingBadge.textContent = count;
            } else {
          const badge = document.createElement('span');
              badge.className = 'notification-badge';
              badge.textContent = '1';
              badge.style.cssText = `
                background: #ef4444;
                color: white;
                border-radius: 50%;
                padding: 2px 6px;
                font-size: 10px;
                margin-left: 4px;
              `;
              ordersTab.appendChild(badge);
            }
          }
          
          // Refresh orders list
          await loadDistributorOrders();
        }
      }
    )
    .subscribe();
}

// ============================================
// Distributor Functions
// ============================================
async function loadDistributorData(userId) {
  // Get distributor record
  let { data: distributor, error } = await supabase
    .from('distributors')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!distributor) {
    const { data: newDistributor, error: insertError } = await supabase
      .from('distributors')
      .insert([{
        user_id: userId,
        company_name: currentUser.user_metadata?.name || 'My Company',
        phone: currentUser.user_metadata?.phone || '',
        address: currentUser.user_metadata?.location || '',
        min_order_amount: 0
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating distributor:', insertError);
      return;
    }
    distributor = newDistributor;
  }
  
  currentDistributorId = distributor.id;
  
  // Show distributor dashboard
  loginSection.classList.add('hidden');
  retailerDashboard.classList.add('hidden');
  distributorDashboard.classList.remove('hidden');
  
  await loadDistributorProducts();
  await loadDistributorOrders();
  await loadStockAlerts();
  await subscribeToNewOrders(); // Start real-time notifications
  setupDistributorTabs();
}

async function loadDistributorProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('distributor_id', currentDistributorId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading products:', error);
    return;
  }
  
  const container = document.getElementById('distributorProducts');
  if (!container) return;
  
  if (!products || products.length === 0) {
    container.innerHTML = `<p>${t('noProducts')}</p>`;
    return;
  }
  
  container.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <h4>${product.product_name}</h4>
      ${product.product_name_sw ? `<p><small>${product.product_name_sw}</small></p>` : ''}
      <div class="price">${formatMoney(product.price)} TZS</div>
      <div class="stock">${t('quantity')}: ${product.stock_quantity}</div>
      <div class="stock">${t('minOrderQty')}: ${product.min_order_quantity}</div>
      <div class="actions">
        <button onclick="window.editProduct(${product.id})">✏️ ${t('products')}</button>
        <button onclick="window.updateStock(${product.id})">📦 ${t('quantity')}</button>
        <button onclick="window.deleteProduct(${product.id})" class="danger">🗑️ ${t('products')}</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function loadDistributorOrders() {
  // Get all orders for products from this distributor
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('distributor_id', currentDistributorId);
  
  if (!products || products.length === 0) {
    const container = document.getElementById('distributorOrders');
    if (container) container.innerHTML = `<p>${t('noOrders')}</p>`;
    return;
  }
  
  const productIds = products.map(p => p.id);
  
  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select('*, orders(*, retailers(store_name)), products(*)')
    .in('product_id', productIds)
    .order('order_id', { ascending: false });
  
  if (error) {
    console.error('Error loading orders:', error);
    return;
  }
  
  const ordersMap = new Map();
  orderItems?.forEach(item => {
    if (!ordersMap.has(item.order_id)) {
      ordersMap.set(item.order_id, {
        id: item.order_id,
        order: item.orders,
        items: []
      });
    }
    ordersMap.get(item.order_id).items.push(item);
  });
  
  const container = document.getElementById('distributorOrders');
  if (!container) return;
  
  if (ordersMap.size === 0) {
    container.innerHTML = `<p>${t('noOrders')}</p>`;
    return;
  }
  
  container.innerHTML = '';
  for (const [orderId, data] of ordersMap) {
    const order = data.order;
    const items = data.items;
    const retailerName = order.retailers?.store_name || 'Retailer';
    
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <div class="order-header">
        <strong>${t('orderNumber')}${order.order_number}</strong>
        <span class="status status-${order.status}">${t(order.status)}</span>
      </div>
      <div>${t('from')}: ${retailerName}</div>
      <div>${t('products')}: ${items.length}</div>
      <div>${t('total')}: ${formatMoney(order.total_amount)} TZS</div>
      <div>${new Date(order.order_date).toLocaleDateString()}</div>
      <div class="actions" style="margin-top: 12px;">
        <button onclick="window.updateOrderStatus(${order.id}, 'confirmed')">✅ ${t('confirmed')}</button>
        <button onclick="window.updateOrderStatus(${order.id}, 'processing')">⚙️ ${t('processing')}</button>
        <button onclick="window.updateOrderStatus(${order.id}, 'shipped')">🚚 ${t('shipped')}</button>
        <button onclick="window.updateOrderStatus(${order.id}, 'delivered')">📦 ${t('delivered')}</button>
      </div>
    `;
    container.appendChild(card);
  }
}

async function loadStockAlerts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('distributor_id', currentDistributorId)
    .lt('stock_quantity', supabase.rpc ? 5 : 10); // Simple check
  
  const container = document.getElementById('stockAlerts');
  if (!container) return;
  
  if (!products || products.length === 0) {
    container.innerHTML = '<p>✅ No stock alerts</p>';
    return;
  }
  
  container.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'alert-card';
    card.innerHTML = `
      <strong>⚠️ Low Stock Alert</strong><br>
      ${product.product_name}: Only ${product.stock_quantity} units left<br>
      <button onclick="window.restockProduct(${product.id})">🔄 Re-order Stock</button>
    `;
    container.appendChild(card);
  });
}

// ============================================
// Retailer Functions
// ============================================
async function loadRetailerData(userId) {
  // Get retailer record
  let { data: retailer, error } = await supabase
    .from('retailers')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!retailer) {
    const { data: newRetailer, error: insertError } = await supabase
      .from('retailers')
      .insert([{
        user_id: userId,
        store_name: currentUser.user_metadata?.name || 'My Store',
        location: currentUser.user_metadata?.location || '',
        phone: currentUser.user_metadata?.phone || ''
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating retailer:', insertError);
      return;
    }
    retailer = newRetailer;
  }
  
  currentRetailerId = retailer.id;
  
  // Show retailer dashboard
  loginSection.classList.add('hidden');
  distributorDashboard.classList.add('hidden');
  retailerDashboard.classList.remove('hidden');
  
  await loadAvailableProducts();
  await loadRetailerOrders();
  await loadCart();
  setupRetailerTabs();
}

async function loadAvailableProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*, distributors(company_name)')
    .eq('is_available', true)
    .gt('stock_quantity', 0);
  
  if (error) {
    console.error('Error loading products:', error);
    return;
  }
  
  const container = document.getElementById('retailerProducts');
  if (!container) return;
  
  if (!products || products.length === 0) {
    container.innerHTML = `<p>${t('noProducts')}</p>`;
    return;
  }
  
  container.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <h4>${product.product_name}</h4>
      ${product.product_name_sw ? `<p><small>${product.product_name_sw}</small></p>` : ''}
      <div class="price">${formatMoney(product.price)} TZS</div>
      <div class="stock">In Stock: ${product.stock_quantity}</div>
      <div>${t('minOrderQty')}: ${product.min_order_quantity}</div>
      <div class="actions">
        <input type="number" id="qty_${product.id}" value="${product.min_order_quantity}" min="${product.min_order_quantity}" max="${product.stock_quantity}">
        <button onclick="window.addToCart(${product.id})">🛒 ${t('addToCart')}</button>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Setup search and filter
  setupSearchAndFilter(products);
}

function setupSearchAndFilter(products) {
  const searchInput = document.getElementById('searchProducts');
  const categoryFilter = document.getElementById('categoryFilter');
  
  if (!searchInput || !categoryFilter) return;
  
  // Populate categories
  const categories = [...new Set(products.map(p => p.category).filter(c => c))];
  categoryFilter.innerHTML = `<option value="all">${t('allCategories')}</option>`;
  categories.forEach(cat => {
    categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
  
  const filterProducts = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    
    const cards = document.querySelectorAll('#retailerProducts .product-card');
    cards.forEach((card, index) => {
      const product = products[index];
      if (!product) return;
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm) ||
                           (product.product_name_sw || '').toLowerCase().includes(searchTerm);
      const matchesCategory = category === 'all' || product.category === category;
      card.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
    });
  };
  
  searchInput.addEventListener('input', filterProducts);
  categoryFilter.addEventListener('change', filterProducts);
}

async function loadCart() {
  const { data: cartItems, error } = await supabase
    .from('cart')
    .select('*, products(*)')
    .eq('retailer_id', currentRetailerId);
  
  if (error) {
    console.error('Error loading cart:', error);
    return;
  }
  
  cart = cartItems || [];
  updateCartCount();
  
  const container = document.getElementById('cartItems');
  if (!container) return;
  
  if (!cartItems || cartItems.length === 0) {
    container.innerHTML = `<p>${t('emptyCart')}</p>`;
    document.getElementById('cartTotal').innerText = '0';
    return;
  }
  
  let total = 0;
  container.innerHTML = '';
  
  cartItems.forEach(item => {
    const itemTotal = item.products.price * item.quantity;
    total += itemTotal;
    
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>
        <strong>${item.products.product_name}</strong><br>
        ${item.quantity} x ${formatMoney(item.products.price)} TZS
      </div>
      <div>
        ${formatMoney(itemTotal)} TZS
        <button onclick="window.removeFromCart(${item.id})" style="margin-left: 8px;">🗑️</button>
      </div>
    `;
    container.appendChild(div);
  });
  
  document.getElementById('cartTotal').innerText = formatMoney(total);
  
  // Check minimum order
  const minOrderAmount = 50000;
  const warningEl = document.getElementById('minOrderWarning');
  if (warningEl) {
    if (total < minOrderAmount) {
      warningEl.innerHTML = `⚠️ Minimum order is ${formatMoney(minOrderAmount)} TZS`;
    } else {
      warningEl.innerHTML = `✅ ${t('minOrderWarning')}`;
    }
  }
}

async function loadRetailerOrders() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('retailer_id', currentRetailerId)
    .order('order_date', { ascending: false });
  
  if (error) {
    console.error('Error loading orders:', error);
    return;
  }
  
  const container = document.getElementById('retailerOrders');
  if (!container) return;
  
  if (!orders || orders.length === 0) {
    container.innerHTML = `<p>${t('noOrders')}</p>`;
    return;
  }
  
  container.innerHTML = '';
  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.onclick = () => showOrderStatus(order);
    card.innerHTML = `
      <div class="order-header">
        <strong>${t('orderNumber')}${order.order_number}</strong>
        <span class="status status-${order.status}">${t(order.status)}</span>
      </div>
      <div>${t('products')}: ${order.order_items.length}</div>
      <div>${t('total')}: ${formatMoney(order.total_amount)} TZS</div>
      <div>${new Date(order.order_date).toLocaleDateString()}</div>
      <div>Delivery: ${order.delivery_status || 'pending'}</div>
    `;
    container.appendChild(card);
  });
}

// ============================================
// Cart & Order Functions
// ============================================
window.addToCart = async (productId) => {
  const quantityInput = document.getElementById(`qty_${productId}`);
  const quantity = parseInt(quantityInput.value);
  
  if (quantity < 1) {
    alert('Quantity must be at least 1');
    return;
  }
  
  // Check if already in cart
  const { data: existing } = await supabase
    .from('cart')
    .select('*')
    .eq('retailer_id', currentRetailerId)
    .eq('product_id', productId)
    .single();
  
  if (existing) {
    const { error } = await supabase
      .from('cart')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);
    
    if (error) alert('Error: ' + error.message);
  } else {
    const { error } = await supabase
      .from('cart')
      .insert([{
        retailer_id: currentRetailerId,
        product_id: productId,
        quantity: quantity
      }]);
    
    if (error) alert('Error: ' + error.message);
  }
  
  await loadCart();
  alert('Added to cart!');
};

window.removeFromCart = async (cartId) => {
  const { error } = await supabase
    .from('cart')
    .delete()
    .eq('id', cartId);
  
  if (error) {
    alert('Error: ' + error.message);
  } else {
    await loadCart();
  }
};

window.checkout = async () => {
  if (!cart || cart.length === 0) {
    alert(t('emptyCart'));
    return;
  }
  
  const totalAmount = cart.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);
  const deliveryAddress = document.getElementById('deliveryAddress')?.value;
  const paymentMethod = document.getElementById('paymentMethod')?.value;
  
  if (!deliveryAddress) {
    alert(t('deliveryAddress'));
    return;
  }
  
  showLoading(true);
  
  // Create order
  const orderNumber = 'ORD-' + Date.now();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      retailer_id: currentRetailerId,
      order_number: orderNumber,
      total_amount: totalAmount,
      status: 'pending',
      payment_method: paymentMethod,
      delivery_address: deliveryAddress
    }])
    .select()
    .single();
  
  if (orderError) {
    showLoading(false);
    alert('Error: ' + orderError.message);
    return;
  }
  
  // Create order items
  const orderItems = cart.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.products.price,
    total_price: item.products.price * item.quantity
  }));
  
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
  
  if (itemsError) {
    showLoading(false);
    alert('Error: ' + itemsError.message);
    return;
  }
  
  // Clear cart
  await supabase
    .from('cart')
    .delete()
    .eq('retailer_id', currentRetailerId);
  
  // Update product stock
  for (const item of cart) {
    await supabase
      .from('products')
      .update({ stock_quantity: item.products.stock_quantity - item.quantity })
      .eq('id', item.product_id);
  }
  
  showLoading(false);
  alert(`${t('orderPlaced')} ${t('orderNumber')}${orderNumber}`);
  closeModal('cartModal');
  await loadCart();
  await loadAvailableProducts();
  await loadRetailerOrders();
};

// ============================================
// Distributor Product Management
// ============================================
const addProductBtn = document.getElementById('addProductBtn');
if (addProductBtn) {
  addProductBtn.addEventListener('click', async () => {
    const name = document.getElementById('productName')?.value;
    const nameSw = document.getElementById('productNameSw')?.value;
    const price = parseFloat(document.getElementById('productPrice')?.value);
    const stock = parseInt(document.getElementById('productStock')?.value);
    const minOrderQty = parseInt(document.getElementById('minOrderQty')?.value);
    const category = document.getElementById('productCategory')?.value;
    
    if (!name || !price) {
      alert('Product name and price are required');
      return;
    }
    
    showLoading(true);
    
    const { error } = await supabase
      .from('products')
      .insert([{
        distributor_id: currentDistributorId,
        product_name: name,
        product_name_sw: nameSw,
        price: price,
        stock_quantity: stock || 0,
        min_order_quantity: minOrderQty || 1,
        category: category || 'General'
      }]);
    
    showLoading(false);
    
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Product added!');
      if (document.getElementById('productName')) document.getElementById('productName').value = '';
      if (document.getElementById('productNameSw')) document.getElementById('productNameSw').value = '';
      if (document.getElementById('productPrice')) document.getElementById('productPrice').value = '';
      if (document.getElementById('productStock')) document.getElementById('productStock').value = '';
      if (document.getElementById('productCategory')) document.getElementById('productCategory').value = '';
      await loadDistributorProducts();
    }
  });
}

window.editProduct = async (productId) => {
  const newPrice = prompt('Enter new price (TZS):');
  if (newPrice) {
    const { error } = await supabase
      .from('products')
      .update({ price: parseFloat(newPrice) })
      .eq('id', productId);
    
    if (error) alert('Error: ' + error.message);
    else await loadDistributorProducts();
  }
};

window.updateStock = async (productId) => {
  const newStock = prompt('Enter new stock quantity:');
  if (newStock !== null) {
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: parseInt(newStock) })
      .eq('id', productId);
    
    if (error) alert('Error: ' + error.message);
    else await loadDistributorProducts();
  }
};

window.restockProduct = async (productId) => {
  const addStock = prompt('How many units to add?');
  if (addStock) {
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();
    
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: product.stock_quantity + parseInt(addStock) })
      .eq('id', productId);
    
    if (error) alert('Error: ' + error.message);
    else {
      await loadDistributorProducts();
      await loadStockAlerts();
    }
  }
};

window.deleteProduct = async (productId) => {
  if (confirm('Delete this product? This cannot be undone.')) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) alert('Error: ' + error.message);
    else await loadDistributorProducts();
  }
};

window.updateOrderStatus = async (orderId, status) => {
  const { error } = await supabase
    .from('orders')
    .update({ status: status })
    .eq('id', orderId);
  
  if (error) alert('Error: ' + error.message);
  else {
    await loadDistributorOrders();
    
    // Add delivery update
    await supabase
      .from('delivery_updates')
      .insert([{
        order_id: orderId,
        status: status,
        notes: `Order status updated to ${status}`
      }]);
    
    // Show confirmation
    showNotification(`Order Updated`, `Status changed to ${status}`, 'info');
  }
};

// ============================================
// Helper Functions
// ============================================
function formatMoney(amount) {
  return new Intl.NumberFormat('en-TZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function showLoading(show) {
  if (loading) {
    if (show) {
      loading.classList.remove('hidden');
    } else {
      loading.classList.add('hidden');
    }
  }
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCount = document.getElementById('cartCount');
  if (cartCount) cartCount.innerText = count;
}

function showOrderStatus(order) {
  const modal = document.getElementById('orderStatusModal');
  const content = document.getElementById('orderStatusContent');
  
  if (!modal || !content) return;
  
  content.innerHTML = `
    <div style="padding: 16px;">
      <p><strong>${t('orderNumber')}${order.order_number}</strong></p>
      <p>${t('orderStatus')}: <span class="status status-${order.status}">${t(order.status)}</span></p>
      <p>${t('total')}: ${formatMoney(order.total_amount)} TZS</p>
      <p>Payment: ${order.payment_method || 'pending'}</p>
      <p>Delivery: ${order.delivery_status || 'pending'}</p>
      <p>${new Date(order.order_date).toLocaleString()}</p>
      ${order.estimated_delivery ? `<p>Est. Delivery: ${new Date(order.estimated_delivery).toLocaleDateString()}</p>` : ''}
    </div>
  `;
  
  modal.classList.remove('hidden');
}

// ============================================
// Modal Functions
// ============================================
const showCartBtn = document.getElementById('showCartBtn');
if (showCartBtn) {
  showCartBtn.addEventListener('click', () => {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) cartModal.classList.remove('hidden');
  });
}

const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', window.checkout);
}

// Close modals
document.querySelectorAll('.close-modal, .close-status, .close-reports').forEach(btn => {
  btn?.addEventListener('click', () => {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
  });
});

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// ============================================
// Tab Functions
// ============================================
function setupDistributorTabs() {
  const tabs = document.querySelectorAll('#distributorDashboard .tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('#distributorDashboard .tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      const activeTab = document.getElementById(tabId);
      if (activeTab) activeTab.classList.remove('hidden');
      
      // Clear notification badge when orders tab is clicked
      if (tabId === 'ordersTab') {
        const badge = tab.querySelector('.notification-badge');
        if (badge) badge.remove();
      }
    });
  });
}

function setupRetailerTabs() {
  const tabs = document.querySelectorAll('#retailerDashboard .tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('#retailerDashboard .tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      const activeTab = document.getElementById(tabId);
      if (activeTab) activeTab.classList.remove('hidden');
    });
  });
}

// ============================================
// Logout
// ============================================
const logoutBtn = document.getElementById('logoutBtn');
const logoutBtn2 = document.getElementById('logoutBtn2');

async function handleLogout() {
  await supabase.auth.signOut();
}

if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (logoutBtn2) logoutBtn2.addEventListener('click', handleLogout);

// ============================================
// Reports Modal (Basic)
// ============================================
const showReportsBtn = document.getElementById('showReportsBtn');
if (showReportsBtn) {
  showReportsBtn.addEventListener('click', async () => {
    const modal = document.getElementById('reportsModal');
    if (!modal) return;
    
    // Load basic report data
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('distributor_id', currentDistributorId);
    
    const totalSales = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
    const totalOrders = orders?.length || 0;
    
    const reportContent = document.getElementById('reportContent');
    if (reportContent) {
      reportContent.innerHTML = `
        <div style="padding: 16px;">
          <p><strong>Total Orders:</strong> ${totalOrders}</p>
          <p><strong>Total Sales:</strong> ${formatMoney(totalSales)} TZS</p>
          <p><strong>Average Order:</strong> ${formatMoney(totalOrders ? totalSales / totalOrders : 0)} TZS</p>
        </div>
      `;
    }
    
    modal.classList.remove('hidden');
  });
}

// Daily/Weekly/Monthly report buttons
const dailyReportBtn = document.getElementById('dailyReportBtn');
const weeklyReportBtn = document.getElementById('weeklyReportBtn');
const monthlyReportBtn = document.getElementById('monthlyReportBtn');

if (dailyReportBtn) {
  dailyReportBtn.addEventListener('click', async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('distributor_id', currentDistributorId)
      .gte('created_at', today);
    
    const total = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
    const reportContent = document.getElementById('reportContent');
    if (reportContent) {
      reportContent.innerHTML = `<p>Daily Sales: ${formatMoney(total)} TZS</p>`;
    }
  });
}

if (weeklyReportBtn) {
  weeklyReportBtn.addEventListener('click', async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('distributor_id', currentDistributorId)
      .gte('created_at', weekAgo.toISOString());
    
    const total = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
    const reportContent = document.getElementById('reportContent');
    if (reportContent) {
      reportContent.innerHTML = `<p>Weekly Sales: ${formatMoney(total)} TZS</p>`;
    }
  });
}

if (monthlyReportBtn) {
  monthlyReportBtn.addEventListener('click', async () => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('distributor_id', currentDistributorId)
      .gte('created_at', monthAgo.toISOString());
    
    const total = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
    const reportContent = document.getElementById('reportContent');
    if (reportContent) {
      reportContent.innerHTML = `<p>Monthly Sales: ${formatMoney(total)} TZS</p>`;
    }
  });
}

// Close reports modal
const closeReportsBtn = document.querySelector('.close-reports');
if (closeReportsBtn) {
  closeReportsBtn.addEventListener('click', () => {
    const modal = document.getElementById('reportsModal');
    if (modal) modal.classList.add('hidden');
  });
}

// ============================================
// Initialize
// ============================================
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await loadUserData(session.user);
  }
}

checkSession();

// Make functions global for HTML buttons
window.addToCart = window.addToCart;
window.removeFromCart = window.removeFromCart;
window.checkout = window.checkout;
window.editProduct = window.editProduct;
window.updateStock = window.updateStock;
window.deleteProduct = window.deleteProduct;
window.updateOrderStatus = window.updateOrderStatus;
window.restockProduct = window.restockProduct;
window.switchLanguage = window.switchLanguage;
