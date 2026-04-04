// app.js - BomaWave FMCG Platform (FULLY FIXED)
import { supabase } from './supabase.js'

// ============================================
// CONFIGURATION
// ============================================
const APP_URL = 'https://retailer-dashboard-gilt.vercel.app'

// ============================================
// STATE MANAGEMENT
// ============================================
let state = {
  language: null,
  user: null,
  role: null,
  retailerId: null,
  distributorId: null,
  cart: [],
  isAuthenticated: false
}

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  en: {
    welcome: 'Welcome',
    products: 'Products',
    orders: 'Orders',
    myOrders: 'My Orders',
    cart: 'Cart',
    logout: 'Logout',
    login: 'Login',
    email: 'Email Address',
    password: 'Password',
    sendLink: 'Send Magic Link',
    loading: 'Loading...',
    pendingApproval: 'Your account is pending approval',
    noProducts: 'No products available',
    noOrders: 'No orders yet',
    emptyCart: 'Your cart is empty',
    total: 'Total',
    checkout: 'Checkout',
    addToCart: 'Add to Cart',
    stock: 'Stock',
    price: 'Price',
    quantity: 'Quantity',
    deliveryAddress: 'Delivery Address',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    mobileMoney: 'Mobile Money',
    orderPlaced: 'Order placed successfully!',
    orderNumber: 'Order #',
    status: 'Status',
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    lowStock: 'Low Stock Alert',
    restock: 'Restock',
    addProduct: 'Add Product',
    productName: 'Product Name',
    category: 'Category',
    approve: 'Approve',
    reject: 'Reject',
    pendingApprovals: 'Pending Approvals',
    allOrders: 'All Orders',
    distributorPortal: 'Distributor Portal',
    retailerPortal: 'Retailer Portal',
    adminPortal: 'Admin Portal',
    businessName: 'Business Name',
    location: 'Location',
    phone: 'Phone Number',
    completeProfile: 'Complete Your Profile',
    saveProfile: 'Save Profile'
  },
  sw: {
    welcome: 'Karibu',
    products: 'Bidhaa',
    orders: 'Maagizo',
    myOrders: 'Maagizo Yangu',
    cart: 'Rukwama',
    logout: 'Toka',
    login: 'Ingia',
    email: 'Barua Pepe',
    password: 'Nenosiri',
    sendLink: 'Tuma Kiungo',
    loading: 'Inapakia...',
    pendingApproval: 'Akaunti yako inasubiri idhini',
    noProducts: 'Hakuna bidhaa',
    noOrders: 'Hakuna maagizo',
    emptyCart: 'Rukwama yako ni tupu',
    total: 'Jumla',
    checkout: 'Maliza',
    addToCart: 'Ingiza Rukwama',
    stock: 'Kiasi',
    price: 'Bei',
    quantity: 'Idadi',
    deliveryAddress: 'Anwani ya Utoaji',
    paymentMethod: 'Njia ya Malipo',
    cash: 'Pesa Taslimu',
    card: 'Kadi',
    mobileMoney: 'M-Pesa',
    orderPlaced: 'Agizo limewekwa!',
    orderNumber: 'Agizo #',
    status: 'Hali',
    pending: 'Inasubiri',
    confirmed: 'Imethibitishwa',
    shipped: 'Imesafirishwa',
    delivered: 'Imewasilishwa',
    lowStock: 'Tahadhari ya Upungufu',
    restock: 'Jaza tena',
    addProduct: 'Ongeza Bidhaa',
    productName: 'Jina la Bidhaa',
    category: 'Aina',
    approve: 'Idhinisha',
    reject: 'Kataa',
    pendingApprovals: 'Maombi Yanayosubiri',
    allOrders: 'Maagizo Yote',
    distributorPortal: 'Jukwaa la Msambazaji',
    retailerPortal: 'Jukwaa la Muuzaji',
    adminPortal: 'Jukwaa la Msimamizi',
    businessName: 'Jina la Biashara',
    location: 'Eneo',
    phone: 'Namba ya Simu',
    completeProfile: 'Kamilisha Profaili Yako',
    saveProfile: 'Hifadhi Profaili'
  }
}

function t(key) { return translations[state.language]?.[key] || translations.en[key] || key }

// ============================================
// UI UTILITIES
// ============================================
function showLoading(show, message = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay')
  const msgEl = document.getElementById('loadingMessage')
  if (!overlay) return
  if (show) {
    if (msgEl) msgEl.textContent = message
    overlay.classList.remove('hidden')
    overlay.classList.add('flex')
  } else {
    overlay.classList.add('hidden')
    overlay.classList.remove('flex')
  }
}

function formatMoney(amount) {
  return new Intl.NumberFormat('en-TZ').format(amount)
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.add('hidden')
}

window.closeModal = closeModal

// ============================================
// AUTHENTICATION - CRITICAL FIX
// ============================================

// Check session immediately on page load
async function checkSession() {
  console.log('🔍 Checking session...')
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Session error:', error)
    return false
  }
  
  if (session) {
    console.log('✅ Session found:', session.user.email)
    state.user = session.user
    state.isAuthenticated = true
    await loadUserData(session.user)
    return true
  }
  
  console.log('❌ No session found')
  return false
}

// Handle magic link redirect
async function handleMagicLinkRedirect() {
  const hash = window.location.hash
  console.log('🔍 Hash check:', hash)
  
  if (hash && hash.includes('access_token')) {
    console.log('🎯 Magic link detected!')
    showLoading(true, 'Completing login...')
    
    // Clear hash from URL
    window.history.replaceState({}, document.title, window.location.pathname)
    
    // Wait for Supabase to process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      showLoading(false)
      return false
    }
    
    if (session) {
      console.log('✅ Session loaded:', session.user.email)
      state.user = session.user
      state.isAuthenticated = true
      await loadUserData(session.user)
      showLoading(false)
      return true
    }
    
    showLoading(false)
  }
  return false
}

// Send magic link
async function sendMagicLink(email, name, phone, location, role) {
  showLoading(true, 'Sending login link...')
  
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: APP_URL,
      data: { name, role, phone, location }
    }
  })
  
  showLoading(false)
  
  if (error) {
    alert('Error: ' + error.message)
    return false
  }
  
  alert(`✓ Login link sent to ${email}!\n\nCheck your inbox (and spam folder).`)
  return true
}

// Logout
async function logout() {
  await supabase.auth.signOut()
  state.isAuthenticated = false
  state.user = null
  state.role = null
  showLoginScreen()
}

// ============================================
// USER DATA & DASHBOARD
// ============================================
async function loadUserData(user) {
  console.log('📱 Loading user data for:', user.email)
  showLoading(true, 'Loading dashboard...')
  
  // Get profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    const metadata = user.user_metadata || {}
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        role: metadata.role || 'retailer',
        name: metadata.name || user.email.split('@')[0],
        phone: metadata.phone || '',
        location: metadata.location || ''
      }])
      .select()
      .single()
    profile = newProfile
  }
  
  state.role = profile.role
  
  // Check if admin
  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single()
  
  // Hide all screens
  document.querySelectorAll('#languageScreen, #loginSection, #distributorDashboard, #retailerDashboard, #adminDashboard, #profileSetupScreen').forEach(el => {
    if (el) el.classList.add('hidden')
  })
  
  // Show appropriate dashboard
  if (adminCheck) {
    await showAdminDashboard()
  } else if (state.role === 'distributor') {
    await showDistributorDashboard()
  } else {
    await showRetailerDashboard()
  }
  
  showLoading(false)
}

// ============================================
// DASHBOARD DISPLAY
// ============================================
function showLoginScreen() {
  document.getElementById('languageScreen')?.classList.remove('hidden')
  document.getElementById('loginSection')?.classList.add('hidden')
  document.querySelectorAll('#distributorDashboard, #retailerDashboard, #adminDashboard').forEach(el => {
    if (el) el.classList.add('hidden')
  })
}

// Language selection
window.selectLanguage = function(lang) {
  state.language = lang
  document.getElementById('languageScreen').classList.add('hidden')
  document.getElementById('loginSection').classList.remove('hidden')
  updateUIText()
}

function updateUIText() {
  const elements = ['loginTitle', 'loginSubtitle', 'sendOtpBtn']
  elements.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.textContent = t(id === 'sendOtpBtn' ? 'sendLink' : id)
  })
}

// Role selection
let selectedRole = 'retailer'
document.getElementById('roleRetailerBtn')?.addEventListener('click', () => {
  selectedRole = 'retailer'
  document.getElementById('roleRetailerBtn').className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
  document.getElementById('roleDistributorBtn').className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
})
document.getElementById('roleDistributorBtn')?.addEventListener('click', () => {
  selectedRole = 'distributor'
  document.getElementById('roleDistributorBtn').className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
  document.getElementById('roleRetailerBtn').className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
})

// Send magic link button
document.getElementById('sendOtpBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim()
  if (!email) return alert('Enter your email')
  
  await sendMagicLink(
    email,
    document.getElementById('name').value.trim(),
    document.getElementById('phone').value.trim(),
    document.getElementById('location').value.trim(),
    selectedRole
  )
})

// ============================================
// ADMIN DASHBOARD
// ============================================
async function showAdminDashboard() {
  const dashboard = document.getElementById('adminDashboard')
  if (dashboard) dashboard.classList.remove('hidden')
  
  document.getElementById('adminEmail').textContent = state.user?.email || 'Admin'
  
  // Load pending distributors
  const { data: pending } = await supabase
    .from('distributors')
    .select('*, profiles(name, email)')
    .eq('is_approved', false)
  
  const pendingContainer = document.getElementById('pendingDistributors')
  if (pendingContainer) {
    if (!pending?.length) {
      pendingContainer.innerHTML = '<div class="text-gray-500 text-center py-4">✅ No pending approvals</div>'
    } else {
      pendingContainer.innerHTML = pending.map(d => `
        <div class="border rounded-xl p-4 flex justify-between items-center">
          <div>
            <p class="font-bold">${d.company_name}</p>
            <p class="text-sm text-gray-500">${d.profiles?.email}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="approveDistributor('${d.id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg">Approve</button>
            <button onclick="rejectDistributor('${d.id}')" class="px-4 py-2 bg-red-600 text-white rounded-lg">Reject</button>
          </div>
        </div>
      `).join('')
    }
  }
  
  // Load all orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*, retailers(store_name)')
    .order('created_at', { ascending: false })
    .limit(50)
  
  const ordersContainer = document.getElementById('adminOrders')
  if (ordersContainer) {
    if (!orders?.length) {
      ordersContainer.innerHTML = '<div class="text-gray-500 text-center py-4">📭 No orders yet</div>'
    } else {
      ordersContainer.innerHTML = orders.map(o => `
        <div class="border rounded-xl p-4">
          <div class="flex justify-between">
            <p class="font-bold">Order #${o.order_number}</p>
            <span class="text-xs text-gray-400">${new Date(o.created_at).toLocaleDateString()}</span>
          </div>
          <p class="text-sm">Store: ${o.retailers?.store_name || 'Unknown'}</p>
          <p class="text-sm">Total: ${formatMoney(o.total_amount)} TZS</p>
          <p class="text-xs">Status: ${o.status}</p>
        </div>
      `).join('')
    }
  }
}

window.approveDistributor = async (id) => {
  await supabase.from('distributors').update({ is_approved: true, approved_at: new Date() }).eq('id', id)
  await showAdminDashboard()
  alert('Distributor approved!')
}

window.rejectDistributor = async (id) => {
  await supabase.from('distributors').delete().eq('id', id)
  await showAdminDashboard()
  alert('Distributor rejected')
}

// ============================================
// DISTRIBUTOR DASHBOARD
// ============================================
async function showDistributorDashboard() {
  const dashboard = document.getElementById('distributorDashboard')
  if (dashboard) dashboard.classList.remove('hidden')
  
  document.getElementById('distributorEmail').textContent = state.user?.email || 'Distributor'
  
  // Get distributor data
  let { data: distributor } = await supabase
    .from('distributors')
    .select('*')
    .eq('user_id', state.user.id)
    .single()
  
  if (!distributor) {
    const { data: newDist } = await supabase
      .from('distributors')
      .insert([{
        user_id: state.user.id,
        company_name: state.user.user_metadata?.name || 'My Company',
        phone: state.user.user_metadata?.phone || '',
        address: state.user.user_metadata?.location || '',
        is_approved: false
      }])
      .select()
      .single()
    distributor = newDist
  }
  
  if (!distributor.is_approved) {
    document.getElementById('distributorProducts').innerHTML = `
      <div class="bg-yellow-50 rounded-xl p-8 text-center">
        <p class="text-yellow-800 text-lg">${t('pendingApproval')}</p>
        <p class="text-yellow-600 text-sm">You will be notified once approved</p>
      </div>
    `
    return
  }
  
  state.distributorId = distributor.id
  await loadDistributorProducts()
  await loadDistributorOrders()
  await loadStockAlerts()
}

async function loadDistributorProducts() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('distributor_id', state.distributorId)
    .order('created_at', { ascending: false })
  
  const container = document.getElementById('distributorProducts')
  if (!container) return
  
  if (!products?.length) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noProducts')}</div>`
    return
  }
  
  container.innerHTML = products.map(p => `
    <div class="bg-white rounded-xl shadow-sm border p-4">
      <h4 class="font-bold">${p.product_name}</h4>
      ${p.product_name_sw ? `<p class="text-sm text-gray-500">${p.product_name_sw}</p>` : ''}
      <p class="text-green-600 font-bold text-xl mt-2">${formatMoney(p.price)} TZS</p>
      <p class="text-sm text-gray-500">${t('stock')}: ${p.stock_quantity}</p>
      <div class="flex gap-2 mt-3">
        <button onclick="updateStock('${p.id}')" class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg">Update Stock</button>
        <button onclick="deleteProduct('${p.id}')" class="px-3 py-2 bg-red-600 text-white text-sm rounded-lg">Delete</button>
      </div>
    </div>
  `).join('')
}

document.getElementById('addProductBtn')?.addEventListener('click', async () => {
  const name = document.getElementById('productName')?.value
  const price = parseFloat(document.getElementById('productPrice')?.value)
  
  if (!name || !price) return alert('Product name and price required')
  
  await supabase.from('products').insert([{
    distributor_id: state.distributorId,
    product_name: name,
    product_name_sw: document.getElementById('productNameSw')?.value,
    price: price,
    stock_quantity: parseInt(document.getElementById('productStock')?.value) || 0,
    min_order_quantity: parseInt(document.getElementById('minOrderQty')?.value) || 1,
    category: document.getElementById('productCategory')?.value || 'General'
  }])
  
  ;['productName', 'productNameSw', 'productPrice', 'productStock', 'productCategory'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.value = ''
  })
  
  await loadDistributorProducts()
  alert('Product added!')
})

window.updateStock = async (productId) => {
  const newStock = prompt('Enter new stock quantity:')
  if (newStock) {
    await supabase.from('products').update({ stock_quantity: parseInt(newStock) }).eq('id', productId)
    await loadDistributorProducts()
    await loadStockAlerts()
  }
}

window.deleteProduct = async (productId) => {
  if (confirm('Delete this product?')) {
    await supabase.from('products').delete().eq('id', productId)
    await loadDistributorProducts()
  }
}

async function loadDistributorOrders() {
  const { data: products } = await supabase.from('products').select('id').eq('distributor_id', state.distributorId)
  const container = document.getElementById('distributorOrders')
  if (!container) return
  
  if (!products?.length) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noOrders')}</div>`
    return
  }
  
  const { data: items } = await supabase
    .from('order_items')
    .select('*, orders(*, retailers(store_name))')
    .in('product_id', products.map(p => p.id))
    .order('order_id', { ascending: false })
  
  const ordersMap = new Map()
  items?.forEach(item => {
    if (!ordersMap.has(item.order_id)) {
      ordersMap.set(item.order_id, { order: item.orders })
    }
  })
  
  if (ordersMap.size === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noOrders')}</div>`
    return
  }
  
  container.innerHTML = Array.from(ordersMap.values()).map(({ order }) => `
    <div class="bg-white rounded-xl border p-4">
      <div class="flex justify-between">
        <p class="font-bold">${t('orderNumber')}${order.order_number}</p>
        <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}">${order.status}</span>
      </div>
      <p class="text-sm">Store: ${order.retailers?.store_name || 'Unknown'}</p>
      <p class="text-sm">Total: ${formatMoney(order.total_amount)} TZS</p>
      <div class="flex gap-2 mt-3">
        <button onclick="updateOrderStatus('${order.id}', 'confirmed')" class="px-3 py-1 bg-green-600 text-white text-sm rounded">Confirm</button>
        <button onclick="updateOrderStatus('${order.id}', 'shipped')" class="px-3 py-1 bg-blue-600 text-white text-sm rounded">Ship</button>
        <button onclick="updateOrderStatus('${order.id}', 'delivered')" class="px-3 py-1 bg-green-600 text-white text-sm rounded">Deliver</button>
      </div>
    </div>
  `).join('')
}

window.updateOrderStatus = async (orderId, status) => {
  await supabase.from('orders').update({ status }).eq('id', orderId)
  await loadDistributorOrders()
}

async function loadStockAlerts() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('distributor_id', state.distributorId)
    .lt('stock_quantity', 10)
  
  const container = document.getElementById('stockAlerts')
  if (!container) return
  
  if (!products?.length) {
    container.innerHTML = '<div class="text-green-600 text-center py-8">✅ No low stock alerts</div>'
    return
  }
  
  container.innerHTML = products.map(p => `
    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <div class="flex justify-between items-center">
        <div>
          <p class="font-bold text-yellow-800">⚠️ ${p.product_name}</p>
          <p class="text-yellow-700">Only ${p.stock_quantity} ${t('unitsLeft')}</p>
        </div>
        <button onclick="restockProduct('${p.id}')" class="px-4 py-2 bg-yellow-600 text-white rounded-lg">${t('restock')}</button>
      </div>
    </div>
  `).join('')
}

window.restockProduct = async (productId) => {
  const add = prompt('How many units to add?')
  if (add) {
    const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', productId).single()
    await supabase.from('products').update({ stock_quantity: p.stock_quantity + parseInt(add) }).eq('id', productId)
    await loadDistributorProducts()
    await loadStockAlerts()
  }
}

// ============================================
// RETAILER DASHBOARD
// ============================================
async function showRetailerDashboard() {
  const dashboard = document.getElementById('retailerDashboard')
  if (dashboard) dashboard.classList.remove('hidden')
  
  document.getElementById('retailerEmail').textContent = state.user?.email || 'Retailer'
  
  // Get retailer data
  let { data: retailer } = await supabase
    .from('retailers')
    .select('*')
    .eq('user_id', state.user.id)
    .single()
  
  if (!retailer) {
    const { data: newRet } = await supabase
      .from('retailers')
      .insert([{
        user_id: state.user.id,
        store_name: state.user.user_metadata?.name || 'My Store',
        location: state.user.user_metadata?.location || '',
        phone: state.user.user_metadata?.phone || ''
      }])
      .select()
      .single()
    retailer = newRet
  }
  
  state.retailerId = retailer.id
  await loadAvailableProducts()
  await loadRetailerOrders()
  await loadCart()
}

async function loadAvailableProducts() {
  const { data: products } = await supabase
    .from('products')
    .select('*, distributors(company_name)')
    .eq('is_available', true)
    .gt('stock_quantity', 0)
  
  const container = document.getElementById('retailerProducts')
  if (!container) return
  
  if (!products?.length) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noProducts')}</div>`
    return
  }
  
  // Populate categories
  const categories = [...new Set(products.map(p => p.category).filter(c => c))]
  const filter = document.getElementById('categoryFilter')
  if (filter) {
    filter.innerHTML = '<option value="all">All Categories</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('')
  }
  
  container.innerHTML = products.map(p => `
    <div class="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
      <h4 class="font-bold">${p.product_name}</h4>
      ${p.product_name_sw ? `<p class="text-sm text-gray-500">${p.product_name_sw}</p>` : ''}
      <p class="text-green-600 font-bold text-xl mt-2">${formatMoney(p.price)} TZS</p>
      <p class="text-sm text-gray-500">${t('stock')}: ${p.stock_quantity}</p>
      <div class="flex gap-2 mt-3">
        <input type="number" id="qty_${p.id}" value="${p.min_order_quantity}" min="${p.min_order_quantity}" max="${p.stock_quantity}" class="w-20 px-2 py-2 border rounded-lg text-center">
        <button onclick="addToCart('${p.id}')" class="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg">${t('addToCart')}</button>
      </div>
    </div>
  `).join('')
}

window.addToCart = async (productId) => {
  const qty = parseInt(document.getElementById(`qty_${productId}`)?.value || 1)
  
  const { data: existing } = await supabase
    .from('cart')
    .select('*')
    .eq('retailer_id', state.retailerId)
    .eq('product_id', productId)
    .single()
  
  if (existing) {
    await supabase.from('cart').update({ quantity: existing.quantity + qty }).eq('id', existing.id)
  } else {
    await supabase.from('cart').insert([{ retailer_id: state.retailerId, product_id: productId, quantity: qty }])
  }
  
  await loadCart()
}

async function loadCart() {
  const { data: items } = await supabase
    .from('cart')
    .select('*, products(*)')
    .eq('retailer_id', state.retailerId)
  
  state.cart = items || []
  
  const cartCount = document.getElementById('cartCount')
  if (cartCount) cartCount.textContent = state.cart.reduce((s, i) => s + i.quantity, 0)
  
  const container = document.getElementById('cartItems')
  if (!container) return
  
  if (!state.cart.length) {
    container.innerHTML = `<div class="text-gray-500 text-center py-4">${t('emptyCart')}</div>`
    document.getElementById('cartTotal').textContent = '0'
    return
  }
  
  let total = 0
  container.innerHTML = state.cart.map(item => {
    const itemTotal = item.products.price * item.quantity
    total += itemTotal
    return `
      <div class="flex justify-between items-center border-b pb-2">
        <div>
          <p class="font-medium">${item.products.product_name}</p>
          <p class="text-sm text-gray-500">${item.quantity} x ${formatMoney(item.products.price)} TZS</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-bold">${formatMoney(itemTotal)} TZS</span>
          <button onclick="removeFromCart('${item.id}')" class="text-red-500">Remove</button>
        </div>
      </div>
    `
  }).join('')
  
  document.getElementById('cartTotal').textContent = formatMoney(total)
}

window.removeFromCart = async (cartId) => {
  await supabase.from('cart').delete().eq('id', cartId)
  await loadCart()
}

document.getElementById('checkoutBtn')?.addEventListener('click', async () => {
  if (!state.cart.length) return alert(t('emptyCart'))
  
  const address = document.getElementById('deliveryAddress')?.value
  if (!address) return alert('Enter delivery address')
  
  showLoading(true, 'Placing order...')
  
  const total = state.cart.reduce((s, i) => s + (i.products.price * i.quantity), 0)
  const orderNumber = 'ORD-' + Date.now()
  
  const { data: order } = await supabase
    .from('orders')
    .insert([{
      retailer_id: state.retailerId,
      order_number: orderNumber,
      total_amount: total,
      delivery_address: address,
      payment_method: document.getElementById('paymentMethod')?.value || 'cash'
    }])
    .select()
    .single()
  
  const items = state.cart.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.products.price,
    total_price: item.products.price * item.quantity
  }))
  await supabase.from('order_items').insert(items)
  
  for (const item of state.cart) {
    await supabase
      .from('products')
      .update({ stock_quantity: item.products.stock_quantity - item.quantity })
      .eq('id', item.product_id)
  }
  
  await supabase.from('cart').delete().eq('retailer_id', state.retailerId)
  
  showLoading(false)
  alert(`${t('orderPlaced')} ${orderNumber}`)
  closeModal('cartModal')
  await loadCart()
  await loadAvailableProducts()
  await loadRetailerOrders()
})

async function loadRetailerOrders() {
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('retailer_id', state.retailerId)
    .order('created_at', { ascending: false })
  
  const container = document.getElementById('retailerOrders')
  if (!container) return
  
  if (!orders?.length) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noOrders')}</div>`
    return
  }
  
  container.innerHTML = orders.map(o => `
    <div class="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition" onclick='showOrderStatus(${JSON.stringify(o).replace(/'/g, "\\'")})'>
      <div class="flex justify-between">
        <p class="font-bold">${t('orderNumber')}${o.order_number}</p>
        <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(o.status)}">${o.status}</span>
      </div>
      <p class="text-sm">${formatMoney(o.total_amount)} TZS</p>
      <p class="text-xs text-gray-400">${new Date(o.created_at).toLocaleDateString()}</p>
    </div>
  `).join('')
}

function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

window.showOrderStatus = function(order) {
  const modal = document.getElementById('orderStatusModal')
  const content = document.getElementById('orderStatusContent')
  if (!modal || !content) return
  
  content.innerHTML = `
    <div class="space-y-3">
      <p class="font-bold">${t('orderNumber')}${order.order_number}</p>
      <p>${t('status')}: <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}">${order.status}</span></p>
      <p>${t('total')}: ${formatMoney(order.total_amount)} TZS</p>
      <p>Payment: ${order.payment_method || 'pending'}</p>
      <p>Delivery: ${order.delivery_address || 'Not specified'}</p>
      <p class="text-xs text-gray-400">${new Date(order.created_at).toLocaleString()}</p>
    </div>
  `
  modal.classList.remove('hidden')
}

// ============================================
// TAB NAVIGATION
// ============================================
document.querySelectorAll('.distributorTabBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab
    document.querySelectorAll('.distributorTabBtn').forEach(b => b.classList.remove('border-green-600', 'text-green-600'))
    btn.classList.add('border-green-600', 'text-green-600')
    document.querySelectorAll('.distributorTabContent').forEach(c => c.classList.add('hidden'))
    document.getElementById(tabId)?.classList.remove('hidden')
  })
})

document.querySelectorAll('.retailerTabBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab
    document.querySelectorAll('.retailerTabBtn').forEach(b => b.classList.remove('border-green-600', 'text-green-600'))
    btn.classList.add('border-green-600', 'text-green-600')
    document.querySelectorAll('.retailerTabContent').forEach(c => c.classList.add('hidden'))
    document.getElementById(tabId)?.classList.remove('hidden')
  })
})

// Cart modal
document.getElementById('showCartBtn')?.addEventListener('click', () => {
  document.getElementById('cartModal')?.classList.remove('hidden')
})

// Logout handlers
document.getElementById('logoutBtn')?.addEventListener('click', logout)
document.getElementById('logoutBtn2')?.addEventListener('click', logout)
document.getElementById('adminLogoutBtn')?.addEventListener('click', logout)

// Auth state listener
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🔄 Auth event:', event)
  if (event === 'SIGNED_IN' && session) {
    state.user = session.user
    await loadUserData(session.user)
  } else if (event === 'SIGNED_OUT') {
    showLoginScreen()
  }
})

// Initialize
async function init() {
  console.log('🚀 Initializing BomaWave...')
  const handled = await handleMagicLinkRedirect()
  if (!handled) {
    await checkSession()
  }
}

init()
