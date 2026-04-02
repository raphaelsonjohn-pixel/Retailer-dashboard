// app.js - Complete FMCG Platform with English/Swahili
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
    // Add more translations as needed
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
  }
};

let currentLanguage = 'en';
let currentUser = null;
let currentRole = null;
let currentRetailerId = null;
let currentDistributorId = null;
let cart = [];

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
};

function updateUIText() {
  const t = translations[currentLanguage];
  if (!t) return;
  
  document.getElementById('loginTitle').innerHTML = t.loginTitle;
  document.getElementById('nameLabel').innerHTML = t.nameLabel;
  document.getElementById('emailLabel').innerHTML = t.emailLabel;
  document.getElementById('phoneLabel').innerHTML = t.phoneLabel;
  document.getElementById('locationLabel').innerHTML = t.locationLabel;
  document.getElementById('roleLabel').innerHTML = t.roleLabel;
  roleRetailer.innerHTML = `🏪 ${t.retailer}`;
  roleDistributor.innerHTML = `📦 ${t.distributor}`;
  sendOtpBtn.innerHTML = `📧 ${t.sendLink}`;
}

// ============================================
// Role Selection
// ============================================
roleRetailer.addEventListener('click', () => {
  selectedRole = 'retailer';
  roleRetailer.classList.add('active');
  roleDistributor.classList.remove('active');
});

roleDistributor.addEventListener('click', () => {
  selectedRole = 'distributor';
  roleDistributor.classList.add('active');
  roleRetailer.classList.remove('active');
});

// ============================================
// Authentication
// ============================================
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
      password: Math.random().toString(36).slice(-8), // Random password
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
    // Create profile
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
    // Create distributor record
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
    container.innerHTML = '<p>No products yet. Add your first product above!</p>';
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
      <div class="stock">Stock: ${product.stock_quantity} units</div>
      <div class="stock">Min Order: ${product.min_order_quantity}</div>
      <div class="actions">
        <button onclick="window.editProduct(${product.id})">✏️ Edit</button>
        <button onclick="window.updateStock(${product.id})">📦 Update Stock</button>
        <button onclick="window.deleteProduct(${product.id})" class="danger">🗑️ Delete</button>
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
    document.getElementById('distributorOrders').innerHTML = '<p>No orders yet</p>';
    return;
  }
  
  const productIds = products.map(p => p.id);
  
  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select('*, orders(*), products(*)')
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
  if (ordersMap.size === 0) {
    container.innerHTML = '<p>No orders yet</p>';
    return;
  }
  
  container.innerHTML = '';
  for (const [orderId, data] of ordersMap) {
    const order = data.order;
    const items = data.items;
    
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <div class="order-header">
        <strong>Order #${order.order_number}</strong>
        <span class="status status-${order.status}">${order.status}</span>
      </div>
      <div>Items: ${items.length}</div>
      <div>Total: ${formatMoney(order.total_amount)} TZS</div>
      <div>Date: ${new Date(order.order_date).toLocaleDateString()}</div>
      <div class="actions" style="margin-top: 12px;">
        <button onclick="window.updateOrderStatus(${order.id}, 'confirmed')">✅ Confirm</button>
        <button onclick="window.updateOrderStatus(${order.id}, 'processing')">⚙️ Process</button>
        <button onclick="window.updateOrderStatus(${order.id}, 'shipped')">🚚 Ship</button>
        <button onclick="window.updateOrderStatus(${order.id}, 'delivered')">📦 Delivered</button>
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
    .lt('stock_quantity', supabase.rpc('get_reorder_level'));
  
  const container = document.getElementById('stockAlerts');
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
    container.innerHTML = '<p>No products available from distributors yet.</p>';
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
      <div>Min Order: ${product.min_order_quantity}</div>
      <div class="actions">
        <input type="number" id="qty_${product.id}" value="${product.min_order_quantity}" min="${product.min_order_quantity}" max="${product.stock_quantity}">
        <button onclick="window.addToCart(${product.id})">🛒 Add to Cart</button>
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
  
  // Populate categories
  const categories = [...new Set(products.map(p => p.category).filter(c => c))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
  
  const filterProducts = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    
    const cards = document.querySelectorAll('#retailerProducts .product-card');
    cards.forEach((card, index) => {
      const product = products[index];
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
  if (!cartItems || cartItems.length === 0) {
    container.innerHTML = '<p>Your cart is empty</p>';
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
  const minOrderAmount = 50000; // TZS 50,000 minimum for demo
  if (total < minOrderAmount) {
    document.getElementById('minOrderWarning').innerHTML = `⚠️ Minimum order is ${formatMoney(minOrderAmount)} TZS`;
  } else {
    document.getElementById('minOrderWarning').innerHTML = '✅ Minimum order met';
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
  if (!orders || orders.length === 0) {
    container.innerHTML = '<p>No orders yet. Start shopping!</p>';
    return;
  }
  
  container.innerHTML = '';
  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.onclick = () => showOrderStatus(order);
    card.innerHTML = `
      <div class="order-header">
        <strong>Order #${order.order_number}</strong>
        <span class="status status-${order.status}">${order.status}</span>
      </div>
      <div>Items: ${order.order_items.length}</div>
      <div>Total: ${formatMoney(order.total_amount)} TZS</div>
      <div>Date: ${new Date(order.order_date).toLocaleDateString()}</div>
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
    alert('Your cart is empty');
    return;
  }
  
  const totalAmount = cart.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);
  const deliveryAddress = document.getElementById('deliveryAddress').value;
  const paymentMethod = document.getElementById('paymentMethod').value;
  
  if (!deliveryAddress) {
    alert('Please enter delivery address');
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
  alert(`Order placed successfully! Order #${orderNumber}`);
  closeModal('cartModal');
  await loadCart();
  await loadAvailableProducts();
  await loadRetailerOrders();
};

// ============================================
// Distributor Product Management
// ============================================
document.getElementById('addProductBtn')?.addEventListener('click', async () => {
  const name = document.getElementById('productName').value;
  const nameSw = document.getElementById('productNameSw').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const stock = parseInt(document.getElementById('productStock').value);
  const minOrderQty = parseInt(document.getElementById('minOrderQty').value);
  const category = document.getElementById('productCategory').value;
  
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
    // Clear form
    document.getElementById('productName').value = '';
    document.getElementById('productNameSw').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productCategory').value = '';
    await loadDistributorProducts();
  }
});

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
  if (show) {
    loading.classList.remove('hidden');
  } else {
    loading.classList.add('hidden');
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
  
  content.innerHTML = `
    <div style="padding: 16px;">
      <p><strong>Order #${order.order_number}</strong></p>
      <p>Status: <span class="status status-${order.status}">${order.status}</span></p>
      <p>Total: ${formatMoney(order.total_amount)} TZS</p>
      <p>Payment: ${order.payment_method || 'pending'}</p>
      <p>Delivery: ${order.delivery_status || 'pending'}</p>
      <p>Date: ${new Date(order.order_date).toLocaleString()}</p>
      ${order.estimated_delivery ? `<p>Est. Delivery: ${new Date(order.estimated_delivery).toLocaleDateString()}</p>` : ''}
    </div>
  `;
  
  modal.classList.remove('hidden');
}

// ============================================
// Modal Functions
// ============================================
document.getElementById('showCartBtn')?.addEventListener('click', () => {
  document.getElementById('cartModal').classList.remove('hidden');
});

document.getElementById('checkoutBtn')?.addEventListener('click', window.checkout);

document.querySelectorAll('.close-modal, .close-status, .close-reports').forEach(btn => {
  btn?.addEventListener('click', () => {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
  });
});

// ============================================
// Tab Functions
// ============================================
function setupDistributorTabs() {
  const tabs = document.querySelectorAll('#distributorDashboard .tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Show content
      document.querySelectorAll('#distributorDashboard .tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      document.getElementById(tabId).classList.remove('hidden');
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
      document.getElementById(tabId).classList.remove('hidden');
    });
  });
}

// ============================================
// Logout
// ============================================
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

document.getElementById('logoutBtn2')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

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
