// app.js - BomaWave FMCG Platform
// Harvard CS50 Style - Clean, Modular, Well-Documented
// Author: BomaWave Engineering
// Version: 2.0 (Google Login Integration)

import { supabase } from './supabase.js'

// ============================================
// GLOBAL STATE MANAGEMENT
// ============================================

const State = {
  language: null,
  user: null,
  role: null,
  retailerId: null,
  distributorId: null,
  cart: [],
  currentView: null
}

// ============================================
// TRANSLATIONS DATABASE
// ============================================

const I18n = {
  en: {
    loading: 'Loading...',
    loginTitle: 'BomaWave',
    loginSubtitle: 'Sign in to continue',
    googleBtn: 'Continue with Google',
    magicLinkBtn: 'Send Magic Link',
    nameLabel: 'Full Name',
    emailLabel: 'Email Address',
    phoneLabel: 'Phone Number',
    locationLabel: 'Location',
    roleLabel: 'I am a:',
    retailer: 'Retailer',
    distributor: 'Distributor',
    pendingApproval: 'Your account is pending admin approval',
    noProducts: 'No products found',
    noOrders: 'No orders yet',
    emptyCart: 'Your cart is empty',
    orderPlaced: 'Order placed successfully',
    orderNumber: 'Order #',
    total: 'Total',
    checkout: 'Place Order',
    addToCart: 'Add to Cart',
    stock: 'Stock',
    price: 'Price',
    minOrder: 'Min Order',
    deliveryAddress: 'Delivery Address',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    mobileMoney: 'Mobile Money',
    orderStatus: 'Order Status',
    pending: 'pending',
    confirmed: 'confirmed',
    shipped: 'shipped',
    delivered: 'delivered',
    lowStockAlert: 'Low Stock Alert',
    unitsLeft: 'units left',
    restock: 'Restock',
    addProduct: 'Add Product',
    productName: 'Product Name',
    productNameSw: 'Product Name (Swahili)',
    priceTZS: 'Price (TZS)',
    quantity: 'Quantity',
    category: 'Category',
    approve: 'Approve',
    reject: 'Reject',
    pendingApprovals: 'Pending Approvals',
    companyName: 'Company Name',
    products: 'Products',
    orders: 'Orders',
    myOrders: 'My Orders',
    cart: 'Cart',
    logout: 'Logout',
    reports: 'Reports'
  },
  sw: {
    loading: 'Inapakia...',
    loginTitle: 'BomaWave',
    loginSubtitle: 'Ingia kuendelea',
    googleBtn: 'Endelea na Google',
    magicLinkBtn: 'Tuma Kiungo',
    nameLabel: 'Jina Kamili',
    emailLabel: 'Barua Pepe',
    phoneLabel: 'Nambari ya Simu',
    locationLabel: 'Eneo',
    roleLabel: 'Mimi ni:',
    retailer: 'Muuzaji',
    distributor: 'Msambazaji',
    pendingApproval: 'Akaunti yako inasubiri idhini',
    noProducts: 'Hakuna bidhaa',
    noOrders: 'Hakuna maagizo',
    emptyCart: 'Rukwama yako ni tupu',
    orderPlaced: 'Agizo limewekwa',
    orderNumber: 'Agizo #',
    total: 'Jumla',
    checkout: 'Weka Agizo',
    addToCart: 'Ingiza Rukwama',
    stock: 'Kiasi',
    price: 'Bei',
    minOrder: 'Kiwango cha Chini',
    deliveryAddress: 'Anwani ya Utoaji',
    paymentMethod: 'Njia ya Malipo',
    cash: 'Pesa Taslimu',
    card: 'Kadi',
    mobileMoney: 'M-Pesa',
    orderStatus: 'Hali ya Agizo',
    pending: 'inasubiri',
    confirmed: 'imethibitishwa',
    shipped: 'imesafirishwa',
    delivered: 'imewasilishwa',
    lowStockAlert: 'Tahadhari ya Upungufu',
    unitsLeft: 'zimebaki',
    restock: 'Jaza tena',
    addProduct: 'Ongeza Bidhaa',
    productName: 'Jina la Bidhaa',
    productNameSw: 'Jina la Bidhaa (Kiswahili)',
    priceTZS: 'Bei (TZS)',
    quantity: 'Kiasi',
    category: 'Aina',
    approve: 'Idhinisha',
    reject: 'Kataa',
    pendingApprovals: 'Maombi Yanayosubiri',
    companyName: 'Jina la Kampuni',
    products: 'Bidhaa',
    orders: 'Maagizo',
    myOrders: 'Maagizo Yangu',
    cart: 'Rukwama',
    logout: 'Toka',
    reports: 'Ripoti'
  }
}

function t(key) {
  return I18n[State.language]?.[key] || I18n.en[key] || key
}

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

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) modal.classList.add('hidden')
}

window.closeModal = closeModal

function formatMoney(amount) {
  return new Intl.NumberFormat('en-TZ').format(amount)
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

// ============================================
// LANGUAGE SELECTION
// ============================================

window.selectLanguage = (lang) => {
  State.language = lang
  const languageScreen = document.getElementById('languageScreen')
  const loginSection = document.getElementById('loginSection')
  
  if (languageScreen) languageScreen.classList.add('hidden')
  if (loginSection) loginSection.classList.remove('hidden')
  
  updateUIText()
}

function updateUIText() {
  const elements = ['loginTitle', 'loginSubtitle', 'googleBtnText', 'magicLinkBtn']
  elements.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.textContent = t(id === 'googleBtnText' ? 'googleBtn' : id === 'magicLinkBtn' ? 'magicLinkBtn' : id)
  })
  
  const nameLabel = document.getElementById('name')?.previousElementSibling
  const emailLabel = document.getElementById('email')?.previousElementSibling
  const phoneLabel = document.getElementById('phone')?.previousElementSibling
  const locationLabel = document.getElementById('location')?.previousElementSibling
  const roleLabel = document.getElementById('roleLabel')
  
  if (nameLabel) nameLabel.textContent = t('nameLabel')
  if (emailLabel) emailLabel.textContent = t('emailLabel')
  if (phoneLabel) phoneLabel.textContent = t('phoneLabel')
  if (locationLabel) locationLabel.textContent = t('locationLabel')
  if (roleLabel) roleLabel.textContent = t('roleLabel')
  
  const retailerBtn = document.getElementById('roleRetailer')
  const distributorBtn = document.getElementById('roleDistributor')
  if (retailerBtn) retailerBtn.textContent = t('retailer')
  if (distributorBtn) distributorBtn.textContent = t('distributor')
}

// ============================================
// ROLE SELECTION
// ============================================

let selectedRole = 'retailer'

const roleRetailer = document.getElementById('roleRetailer')
const roleDistributor = document.getElementById('roleDistributor')

if (roleRetailer) {
  roleRetailer.addEventListener('click', () => {
    selectedRole = 'retailer'
    roleRetailer.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    roleDistributor.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

if (roleDistributor) {
  roleDistributor.addEventListener('click', () => {
    selectedRole = 'distributor'
    roleDistributor.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    roleRetailer.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

// ============================================
// GOOGLE LOGIN (Primary Authentication)
// ============================================

async function signInWithGoogle() {
  showLoading(true, 'Connecting to Google...')
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  })
  
  if (error) {
    console.error('Google sign in error:', error)
    showLoading(false)
    alert('Error signing in with Google: ' + error.message)
  } else {
    // Redirect to Google
    window.location.href = data.url
  }
}

// Handle Google OAuth redirect callback
async function handleGoogleCallback() {
  const hash = window.location.hash
  const urlParams = new URLSearchParams(window.location.search)
  
  // Check if we're returning from Google OAuth
  if (hash && hash.includes('access_token')) {
    showLoading(true, 'Completing sign in...')
    
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      showLoading(false)
      return
    }
    
    if (data.session) {
      console.log('Google sign in successful:', data.session.user.email)
      await handleUserSignIn(data.session.user)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    showLoading(false)
  }
}

// ============================================
// MAGIC LINK (Fallback Authentication)
// ============================================

const magicLinkBtn = document.getElementById('magicLinkBtn')
if (magicLinkBtn) {
  magicLinkBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value
    if (!email) {
      alert('Please enter your email address')
      return
    }
    
    const name = document.getElementById('name').value
    const phone = document.getElementById('phone').value
    const location = document.getElementById('location').value
    
    showLoading(true, 'Sending magic link...')
    
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: name || email.split('@')[0],
          role: selectedRole,
          phone: phone || '',
          location: location || ''
        }
      }
    })
    
    showLoading(false)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`Magic link sent to ${email}! Check your inbox.`)
    }
  })
}

// ============================================
// USER SESSION MANAGEMENT
// ============================================

async function handleUserSignIn(user) {
  State.user = user
  console.log('Handling user sign in:', user.email)
  
  showLoading(true, 'Loading your dashboard...')
  
  // Get or create profile
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
        role: metadata.role || selectedRole || 'retailer',
        name: metadata.name || user.email.split('@')[0],
        phone: metadata.phone || '',
        location: metadata.location || ''
      }])
      .select()
      .single()
    profile = newProfile
  }
  
  State.role = profile.role
  
  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single()
  
  // Hide login screens
  const languageScreen = document.getElementById('languageScreen')
  const loginSection = document.getElementById('loginSection')
  if (languageScreen) languageScreen.classList.add('hidden')
  if (loginSection) loginSection.classList.add('hidden')
  
  // Show appropriate dashboard
  if (adminCheck) {
    await showAdminDashboard()
  } else if (State.role === 'distributor') {
    await showDistributorDashboard()
  } else {
    await showRetailerDashboard()
  }
  
  showLoading(false)
}

async function checkExistingSession() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    console.log('Existing session found:', session.user.email)
    await handleUserSignIn(session.user)
  } else {
    // Show language selection
    const languageScreen = document.getElementById('languageScreen')
    if (languageScreen) languageScreen.classList.remove('hidden')
  }
}

// ============================================
// ADMIN DASHBOARD
// ============================================

async function showAdminDashboard() {
  const adminDashboard = document.getElementById('adminDashboard')
  const distributorDashboard = document.getElementById('distributorDashboard')
  const retailerDashboard = document.getElementById('retailerDashboard')
  
  if (adminDashboard) adminDashboard.classList.remove('hidden')
  if (distributorDashboard) distributorDashboard.classList.add('hidden')
  if (retailerDashboard) retailerDashboard.classList.add('hidden')
  
  const emailSpan = document.getElementById('adminEmail')
  if (emailSpan && State.user) emailSpan.textContent = State.user.email
  
  await loadPendingDistributors()
  await loadAdminOrders()
}

async function loadPendingDistributors() {
  const { data: distributors } = await supabase
    .from('distributors')
    .select('*, profiles(name, email, location)')
    .eq('is_approved', false)
  
  const container = document.getElementById('pendingDistributors')
  if (!container) return
  
  if (!distributors?.length) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">✅ No pending approvals</div>'
    return
  }
  
  container.innerHTML = ''
  for (const dist of distributors) {
    container.innerHTML += `
      <div class="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition">
        <div>
          <p class="font-bold text-gray-800">${dist.company_name}</p>
          <p class="text-sm text-gray-500">${dist.profiles?.email}</p>
          <p class="text-sm text-gray-500">📍 ${dist.profiles?.location || 'Location not set'}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="window.approveDistributor('${dist.id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Approve</button>
          <button onclick="window.rejectDistributor('${dist.id}')" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Reject</button>
        </div>
      </div>
    `
  }
}

window.approveDistributor = async (id) => {
  await supabase.from('distributors').update({ is_approved: true, approved_at: new Date() }).eq('id', id)
  await loadPendingDistributors()
  alert('Distributor approved successfully!')
}

window.rejectDistributor = async (id) => {
  await supabase.from('distributors').delete().eq('id', id)
  await loadPendingDistributors()
  alert('Distributor rejected')
}

async function loadAdminOrders() {
  const { data: orders } = await supabase
    .from('orders')
    .select('*, retailers(store_name)')
    .order('created_at', { ascending: false })
    .limit(50)
  
  const container = document.getElementById('adminOrders')
  if (!container) return
  
  if (!orders?.length) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">📭 No orders yet</div>'
    return
  }
  
  container.innerHTML = ''
  for (const order of orders) {
    container.innerHTML += `
      <div class="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-bold text-gray-800">Order #${order.order_number}</p>
            <p class="text-sm text-gray-500">Store: ${order.retailers?.store_name || 'Unknown'}</p>
            <p class="text-sm text-gray-500">Total: ${formatMoney(order.total_amount)} TZS</p>
          </div>
          <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}">${order.status}</span>
        </div>
        <p class="text-xs text-gray-400 mt-2">${new Date(order.created_at).toLocaleString()}</p>
      </div>
    `
  }
}

// ============================================
// DISTRIBUTOR DASHBOARD
// ============================================

async function showDistributorDashboard() {
  const adminDashboard = document.getElementById('adminDashboard')
  const distributorDashboard = document.getElementById('distributorDashboard')
  const retailerDashboard = document.getElementById('retailerDashboard')
  
  if (adminDashboard) adminDashboard.classList.add('hidden')
  if (distributorDashboard) distributorDashboard.classList.remove('hidden')
  if (retailerDashboard) retailerDashboard.classList.add('hidden')
  
  const emailSpan = document.getElementById('distributorEmail')
  if (emailSpan && State.user) emailSpan.textContent = State.user.email
  
  await loadDistributorData()
  setupDistributorTabs()
}

async function loadDistributorData() {
  let { data: distributor } = await supabase
    .from('distributors')
    .select('*')
    .eq('user_id', State.user.id)
    .single()
  
  if (!distributor) {
    const { data: newDistributor } = await supabase
      .from('distributors')
      .insert([{
        user_id: State.user.id,
        company_name: State.user.user_metadata?.name || 'My Company',
        phone: State.user.user_metadata?.phone || '',
        address: State.user.user_metadata?.location || '',
        is_approved: false
      }])
      .select()
      .single()
    distributor = newDistributor
  }
  
  if (!distributor.is_approved) {
    const productsContainer = document.getElementById('distributorProducts')
    if (productsContainer) {
      productsContainer.innerHTML = `
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div class="text-5xl mb-4">⏳</div>
          <p class="text-yellow-800 text-lg font-medium">${t('pendingApproval')}</p>
          <p class="text-yellow-600 text-sm mt-2">You will be notified once approved</p>
        </div>
      `
    }
    return
  }
  
  State.distributorId = distributor.id
  await loadDistributorProducts()
  await loadDistributorOrders()
  await loadStockAlerts()
}

async function loadDistributorProducts() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('distributor_id', State.distributorId)
    .order('created_at', { ascending: false })
  
  const container = document.getElementById('distributorProducts')
  if (!container) return
  
  if (!products?.length) {
    container.innerHTML = `<div class="text-gray-500 text-center py-12">${t('noProducts')}</div>`
    return
  }
  
  container.innerHTML = ''
  for (const product of products) {
    container.innerHTML += `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
        <h4 class="font-bold text-gray-800">${product.product_name}</h4>
        ${product.product_name_sw ? `<p class="text-sm text-gray-500">${product.product_name_sw}</p>` : ''}
        <p class="text-green-600 font-bold text-xl mt-2">${formatMoney(product.price)} TZS</p>
        <p class="text-sm text-gray-500 mt-1">${t('stock')}: ${product.stock_quantity}</p>
        <p class="text-sm text-gray-500">${t('minOrder')}: ${product.min_order_quantity}</p>
        <div class="flex gap-2 mt-3">
          <button onclick="window.updateStock('${product.id}')" class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">Update Stock</button>
          <button onclick="window.deleteProduct('${product.id}')" class="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    `
  }
}

const addProductBtn = document.getElementById('addProductBtn')
if (addProductBtn) {
  addProductBtn.addEventListener('click', async () => {
    const name = document.getElementById('productName')?.value
    const nameSw = document.getElementById('productNameSw')?.value
    const price = parseFloat(document.getElementById('productPrice')?.value)
    const stock = parseInt(document.getElementById('productStock')?.value)
    const minOrder = parseInt(document.getElementById('minOrderQty')?.value)
    const category = document.getElementById('productCategory')?.value
    
    if (!name || !price) {
      alert('Product name and price are required')
      return
    }
    
    showLoading(true, 'Adding product...')
    
    await supabase.from('products').insert([{
      distributor_id: State.distributorId,
      product_name: name,
      product_name_sw: nameSw,
      price: price,
      stock_quantity: stock || 0,
      min_order_quantity: minOrder || 1,
      category: category || 'General'
    }])
    
    ;['productName', 'productNameSw', 'productPrice', 'productStock', 'productCategory'].forEach(id => {
      const el = document.getElementById(id)
      if (el) el.value = ''
    })
    
    await loadDistributorProducts()
    showLoading(false)
    alert('Product added successfully!')
  })
}

window.updateStock = async (productId) => {
  const newStock = prompt('Enter new stock quantity:')
  if (newStock !== null) {
    await supabase.from('products').update({ stock_quantity: parseInt(newStock) }).eq('id', productId)
    await loadDistributorProducts()
    await loadStockAlerts()
  }
}

window.deleteProduct = async (productId) => {
  if (confirm('Are you sure you want to delete this product?')) {
    await supabase.from('products').delete().eq('id', productId)
    await loadDistributorProducts()
  }
}

async function loadDistributorOrders() {
  const { data: products } = await supabase.from('products').select('id').eq('distributor_id', State.distributorId)
  const container = document.getElementById('distributorOrders')
  if (!container) return
  
  if (!products?.length) {
    container.innerHTML = `<div class="text-gray-500 text-center py-12">${t('noOrders')}</div>`
    return
  }
  
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*, orders(*, retailers(store_name))')
    .in('product_id', products.map(p => p.id))
    .order('order_id', { ascending: false })
  
  const ordersMap = new Map()
  orderItems?.forEach(item => {
    if (!ordersMap.has(item.order_id)) {
      ordersMap.set(item.order_id, { order: item.orders, items: [] })
    }
    ordersMap.get(item.order_id).items.push(item)
  })
  
  if (ordersMap.size === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center py-12">${t('noOrders')}</div>`
    return
  }
  
  container.innerHTML = ''
  for (const [_, data] of ordersMap) {
    const order = data.order
    container.innerHTML += `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-bold text-gray-800">${t('orderNumber')}${order.order_number}</p>
            <p class="text-sm text-gray-500">Store: ${order.retailers?.store_name || 'Unknown'}</p>
            <p class="text-sm text-gray-500">Total: ${formatMoney(order.total_amount)} TZS</p>
          </div>
          <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}">${order.status}</span>
        </div>
        <div class="flex gap-2 mt-3">
          <button onclick="window.updateOrderStatus('${order.id}', 'confirmed')" class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">Confirm</button>
          <button onclick="window.updateOrderStatus('${order.id}', 'shipped')" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">Ship</button>
          <button onclick="window.updateOrderStatus('${order.id}', 'delivered')" class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">Deliver</button>
        </div>
      </div>
    `
  }
}

window.updateOrderStatus = async (orderId, status) => {
  await supabase.from('orders').update({ status }).eq('id', orderId)
  await loadDistributorOrders()
}

async function loadStockAlerts() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('distributor_id', State.distributorId)
    .lt('stock_quantity', 10)
  
  const container = document.getElementById('stockAlerts')
  if (!container) return
  
  if (!products?.length) {
    container.innerHTML = '<div class="text-green-600 text-center py-12">✅ No low stock alerts</div>'
    return
  }
  
  container.innerHTML = ''
  for (const product of products) {
    container.innerHTML += `
      <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div class="flex justify-between items-center">
          <div>
            <p class="font-bold text-yellow-800">⚠️ ${t('lowStockAlert')}</p>
            <p class="text-yellow-700">${product.product_name}: ${product.stock_quantity} ${t('unitsLeft')}</p>
          </div>
          <button onclick="window.restockProduct('${product.id}')" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">${t('restock')}</button>
        </div>
      </div>
    `
  }
}

window.restockProduct = async (productId) => {
  const addStock = prompt('How many units to add?')
  if (addStock) {
    const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', productId).single()
    await supabase.from('products').update({ stock_quantity: product.stock_quantity + parseInt(addStock) }).eq('id', productId)
    await loadDistributorProducts()
    await loadStockAlerts()
  }
}

// ============================================
// RETAILER DASHBOARD
// ============================================

async function showRetailerDashboard() {
  const adminDashboard = document.getElementById('adminDashboard')
  const distributorDashboard = document.getElementById('distributorDashboard')
  const retailerDashboard = document.getElementById('retailerDashboard')
  
  if (adminDashboard) adminDashboard.classList.add('hidden')
  if (distributorDashboard) distributorDashboard.classList.add('hidden')
  if (retailerDashboard) retailerDashboard.classList.remove('hidden')
  
  const emailSpan = document.getElementById('retailerEmail')
  if (emailSpan && State.user) emailSpan.textContent = State.user.email
  
  await loadRetailerData()
  setupRetailerTabs()
}

async function loadRetailerData() {
  let { data: retailer } = await supabase
    .from('retailers')
    .select('*')
    .eq('user_id', State.user.id)
    .single()
  
  if (!retailer) {
    const { data: newRetailer } = await supabase
      .from('retailers')
      .insert([{
        user_id: State.user.id,
        store_name: State.user.user_metadata?.name || 'My Store',
        location: State.user.user_metadata?.location || '',
        phone: State.user.user_metadata?.phone || ''
      }])
      .select()
      .single()
    retailer = newRetailer
  }
  
  State.retailerId = retailer.id
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
    container.innerHTML = `<div class="text-gray-500 text-center py-12">${t('noProducts')}</div>`
    return
  }
  
  // Populate categories
  const categories = [...new Set(products.map(p => p.category).filter(c => c))]
  const categoryFilter = document.getElementById('categoryFilter')
  if (categoryFilter) {
    categoryFilter.innerHTML = '<option value="all">All Categories</option>'
    categories.forEach(cat => {
      categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`
    })
  }
  
  container.innerHTML = ''
  for (const product of products) {
    container.innerHTML += `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
        <h4 class="font-bold text-gray-800">${product.product_name}</h4>
        ${product.product_name_sw ? `<p class="text-sm text-gray-500">${product.product_name_sw}</p>` : ''}
        <p class="text-green-600 font-bold text-xl mt-2">${formatMoney(product.price)} TZS</p>
        <p class="text-sm text-gray-500">${t('stock')}: ${product.stock_quantity}</p>
        <div class="flex gap-2 mt-3">
          <input type="number" id="qty_${product.id}" value="${product.min_order_quantity}" min="${product.min_order_quantity}" max="${product.stock_quantity}" class="w-20 px-2 py-2 border border-gray-300 rounded-lg text-center">
          <button onclick="window.addToCart('${product.id}')" class="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">${t('addToCart')}</button>
        </div>
      </div>
    `
  }
  
  // Search functionality
  const searchInput = document.getElementById('searchProducts')
  if (searchInput) {
    searchInput.addEventListener('input', () => filterProducts(products))
  }
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => filterProducts(products))
  }
}

function filterProducts(products) {
  const searchTerm = document.getElementById('searchProducts')?.value.toLowerCase() || ''
  const category = document.getElementById('categoryFilter')?.value || 'all'
  const cards = document.querySelectorAll('#retailerProducts > div')
  
  cards.forEach((card, index) => {
    const product = products[index]
    if (!product) return
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm) ||
                         (product.product_name_sw || '').toLowerCase().includes(searchTerm)
    const matchesCategory = category === 'all' || product.category === category
    card.style.display = matchesSearch && matchesCategory ? 'block' : 'none'
  })
}

window.addToCart = async (productId) => {
  const qtyInput = document.getElementById(`qty_${productId}`)
  const quantity = parseInt(qtyInput?.value || 1)
  
  const { data: existing } = await supabase
    .from('cart')
    .select('*')
    .eq('retailer_id', State.retailerId)
    .eq('product_id', productId)
    .single()
  
  if (existing) {
    await supabase.from('cart').update({ quantity: existing.quantity + quantity }).eq('id', existing.id)
  } else {
    await supabase.from('cart').insert([{ retailer_id: State.retailerId, product_id: productId, quantity }])
  }
  
  await loadCart()
}

async function loadCart() {
  const { data: items } = await supabase
    .from('cart')
    .select('*, products(*)')
    .eq('retailer_id', State.retailerId)
  
  State.cart = items || []
  
  const cartCount = document.getElementById('cartCount')
  if (cartCount) cartCount.textContent = State.cart.reduce((sum, i) => sum + i.quantity, 0)
  
  const container = document.getElementById('cartItems')
  if (!container) return
  
  if (!State.cart.length) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('emptyCart')}</div>`
    document.getElementById('cartTotal').textContent = '0'
    return
  }
  
  let total = 0
  container.innerHTML = ''
  for (const item of State.cart) {
    const itemTotal = item.products.price * item.quantity
    total += itemTotal
    container.innerHTML += `
      <div class="flex justify-between items-center border-b border-gray-100 pb-3">
        <div>
          <p class="font-medium text-gray-800">${item.products.product_name}</p>
          <p class="text-sm text-gray-500">${item.quantity} x ${formatMoney(item.products.price)} TZS</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-bold text-gray-800">${formatMoney(itemTotal)} TZS</span>
          <button onclick="window.removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700">Remove</button>
        </div>
      </div>
    `
  }
  
  document.getElementById('cartTotal').textContent = formatMoney(total)
  
  const minOrderAmount = 50000
  const warning = document.getElementById('minOrderWarning')
  if (warning) {
    if (total < minOrderAmount) {
      warning.innerHTML = `⚠️ Minimum order is ${formatMoney(minOrderAmount)} TZS`
      warning.className = 'text-sm text-yellow-600'
    } else {
      warning.innerHTML = '✅ Ready to place order'
      warning.className = 'text-sm text-green-600'
    }
  }
}

window.removeFromCart = async (cartId) => {
  await supabase.from('cart').delete().eq('id', cartId)
  await loadCart()
}

const checkoutBtn = document.getElementById('checkoutBtn')
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', async () => {
    if (!State.cart.length) {
      alert(t('emptyCart'))
      return
    }
    
    const address = document.getElementById('deliveryAddress')?.value
    if (!address) {
      alert('Please enter delivery address')
      return
    }
    
    showLoading(true, 'Placing order...')
    
    const total = State.cart.reduce((sum, i) => sum + (i.products.price * i.quantity), 0)
    const orderNumber = 'ORD-' + Date.now()
    
    const { data: order } = await supabase
      .from('orders')
      .insert([{
        retailer_id: State.retailerId,
        order_number: orderNumber,
        total_amount: total,
        delivery_address: address,
        payment_method: document.getElementById('paymentMethod')?.value || 'cash'
      }])
      .select()
      .single()
    
    const orderItems = State.cart.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.products.price,
      total_price: item.products.price * item.quantity
    }))
    await supabase.from('order_items').insert(orderItems)
    
    for (const item of State.cart) {
      await supabase
        .from('products')
        .update({ stock_quantity: item.products.stock_quantity - item.quantity })
        .eq('id', item.product_id)
    }
    
    await supabase.from('cart').delete().eq('retailer_id', State.retailerId)
    
    showLoading(false)
    alert(`${t('orderPlaced')} ${orderNumber}`)
    closeModal('cartModal')
    await loadCart()
    await loadAvailableProducts()
    await loadRetailerOrders()
  })
}

async function loadRetailerOrders() {
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('retailer_id', State.retailerId)
    .order('created_at', { ascending: false })
  
  const container = document.getElementById('retailerOrders')
  if (!container) return
  
  if (!orders?.length) {
    container.innerHTML = `<div class="text-gray-500 text-center py-12">${t('noOrders')}</div>`
    return
  }
  
  container.innerHTML = ''
  for (const order of orders) {
    container.innerHTML += `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition" onclick='showOrderStatus(${JSON.stringify(order).replace(/'/g, "\\'")})'>
        <div class="flex justify-between items-start">
          <div>
            <p class="font-bold text-gray-800">${t('orderNumber')}${order.order_number}</p>
            <p class="text-sm text-gray-500">${formatMoney(order.total_amount)} TZS</p>
          </div>
          <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}">${order.status}</span>
        </div>
        <p class="text-xs text-gray-400 mt-2">${new Date(order.created_at).toLocaleDateString()}</p>
      </div>
    `
  }
}

function showOrderStatus(order) {
  const modal = document.getElementById('orderStatusModal')
  const content = document.getElementById('orderStatusContent')
  if (!modal || !content) return
  
  content.innerHTML = `
    <div class="space-y-3">
      <p class="font-bold text-gray-800">${t('orderNumber')}${order.order_number}</p>
      <p>${t('orderStatus')}: <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}">${order.status}</span></p>
      <p>${t('total')}: <span class="font-bold text-green-600">${formatMoney(order.total_amount)} TZS</span></p>
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

function setupDistributorTabs() {
  const tabs = document.querySelectorAll('.tab-distributor')
  const contents = document.querySelectorAll('.tab-content-distributor')
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab
      tabs.forEach(t => t.classList.remove('border-green-600', 'text-green-600'))
      tab.classList.add('border-green-600', 'text-green-600')
      contents.forEach(c => c.classList.add('hidden'))
      const activeTab = document.getElementById(tabId)
      if (activeTab) activeTab.classList.remove('hidden')
    })
  })
  
  // Activate first tab
  if (tabs[0]) {
    tabs[0].classList.add('border-green-600', 'text-green-600')
  }
}

function setupRetailerTabs() {
  const tabs = document.querySelectorAll('.tab-retailer')
  const contents = document.querySelectorAll('.tab-content-retailer')
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab
      tabs.forEach(t => t.classList.remove('border-green-600', 'text-green-600'))
      tab.classList.add('border-green-600', 'text-green-600')
      contents.forEach(c => c.classList.add('hidden'))
      const activeTab = document.getElementById(tabId)
      if (activeTab) activeTab.classList.remove('hidden')
    })
  })
  
  // Activate first tab
  if (tabs[0]) {
    tabs[0].classList.add('border-green-600', 'text-green-600')
  }
}

// ============================================
// LOGOUT HANDLERS
// ============================================

async function handleLogout() {
  await supabase.auth.signOut()
  window.location.reload()
}

document.getElementById('logoutBtn')?.addEventListener('click', handleLogout)
document.getElementById('logoutBtn2')?.addEventListener('click', handleLogout)
document.getElementById('adminLogoutBtn')?.addEventListener('click', handleLogout)

// Cart modal trigger
document.getElementById('showCartBtn')?.addEventListener('click', () => {
  document.getElementById('cartModal')?.classList.remove('hidden')
})

// Google Sign In button
document.getElementById('googleSignInBtn')?.addEventListener('click', signInWithGoogle)

// Make functions global for HTML onclick
window.addToCart = addToCart
window.removeFromCart = removeFromCart
window.updateStock = updateStock
window.deleteProduct = deleteProduct
window.updateOrderStatus = updateOrderStatus
window.restockProduct = restockProduct
window.approveDistributor = approveDistributor
window.rejectDistributor = rejectDistributor
window.showOrderStatus = showOrderStatus

// ============================================
// AUTH STATE LISTENER
// ============================================

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', event)
  
  if (event === 'SIGNED_IN' && session) {
    await handleUserSignIn(session.user)
  } else if (event === 'SIGNED_OUT') {
    State.user = null
    State.role = null
    State.cart = []
  }
})

// ============================================
// INITIALIZE APPLICATION
// ============================================

async function init() {
  console.log('Initializing BomaWave Platform...')
  
  // Handle Google OAuth callback
  await handleGoogleCallback()
  
  // Check for existing session
  await checkExistingSession()
}

// Start the application
init()
