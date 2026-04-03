// app.js - COMPLETE FIXED VERSION (Full Dashboards)
import { supabase } from './supabase.js'

// ============================================
// FIXED: Hardcoded App URL
// ============================================
const APP_URL = 'https://retailer-dashboard-gilt.vercel.app'

// ============================================
// FIX: Handle magic link IMMEDIATELY
// ============================================
;(async function handleImmediateRedirect() {
  const hash = window.location.hash
  console.log('1. Checking URL hash:', hash)
  
  if (hash && hash.includes('access_token')) {
    console.log('2. Magic link detected! Processing...')
    
    window.history.replaceState({}, document.title, window.location.pathname)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const { data, error } = await supabase.auth.getSession()
    console.log('3. Session result:', data?.session ? 'Session found' : 'No session', error)
    
    if (data?.session) {
      console.log('4. Session found! Loading user data...')
      window.location.href = window.location.pathname + '?session=restored'
    }
  }
})()

if (window.location.search.includes('session=restored')) {
  window.history.replaceState({}, document.title, window.location.pathname)
  setTimeout(async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      window.location.reload()
    }
  }, 500)
}

// ============================================
// STATE
// ============================================
let currentLanguage = null
let currentUser = null
let currentRole = null
let currentRetailerId = null
let currentDistributorId = null
let cart = []

// Translations (Nimeweka fupi, weka yako kamili hapa)
const translations = {
  en: { loading: 'Loading...', loginTitle: 'BomaWave', nameLabel: 'Full Name', emailLabel: 'Email Address', phoneLabel: 'Phone (Optional)', locationLabel: 'Location', roleLabel: 'I am a:', sendLink: 'Send Login Link', pendingApproval: 'Pending admin approval', noProducts: 'No products', noOrders: 'No orders', emptyCart: 'Cart empty', orderPlaced: 'Order placed!', orderNumber: 'Order #', total: 'Total', checkout: 'Place Order', addToCart: 'Add to Cart', stock: 'Stock', price: 'Price', minOrder: 'Min Order', deliveryAddress: 'Delivery Address', paymentMethod: 'Payment Method', cash: 'Cash', card: 'Card', mobileMoney: 'Mobile Money', orderStatus: 'Status', pending: 'pending', confirmed: 'confirmed', processing: 'processing', shipped: 'shipped', delivered: 'delivered', cancelled: 'cancelled', lowStockAlert: 'Low Stock', unitsLeft: 'left', restock: 'Restock', addProduct: 'Add Product', productName: 'Name', productNameSw: 'Name (Sw)', priceTZS: 'Price', quantity: 'Qty', category: 'Category', reports: 'Reports', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', totalSales: 'Total Sales', totalOrders: 'Total Orders', approve: 'Approve', reject: 'Reject', pendingApprovals: 'Pending Approvals', companyName: 'Company', location: 'Location', products: 'Products', orders: 'Orders', myOrders: 'My Orders', cart: 'Cart', logout: 'Logout' },
  sw: { loading: 'Inapakia...', loginTitle: 'BomaWave', nameLabel: 'Jina Kamili', emailLabel: 'Barua Pepe', phoneLabel: 'Simu', locationLabel: 'Eneo', roleLabel: 'Mimi ni:', sendLink: 'Tuma Kiungo', pendingApproval: 'Inasubiri idhini', noProducts: 'Hakuna bidhaa', noOrders: 'Hakuna maagizo', emptyCart: 'Rukwama tupu', orderPlaced: 'Agizo limewekwa!', orderNumber: 'Agizo #', total: 'Jumla', checkout: 'Weka Agizo', addToCart: 'Ingiza', stock: 'Kiasi', price: 'Bei', minOrder: 'Kiwango cha Chini', deliveryAddress: 'Anwani', paymentMethod: 'Njia', cash: 'Pesa', card: 'Kadi', mobileMoney: 'M-Pesa', orderStatus: 'Hali', pending: 'inasubiri', confirmed: 'imethibitishwa', processing: 'inachakatwa', shipped: 'imesafirishwa', delivered: 'imewasilishwa', cancelled: 'imeghairiwa', lowStockAlert: 'Tahadhari', unitsLeft: 'zimebaki', restock: 'Jaza', addProduct: 'Ongeza', productName: 'Jina', productNameSw: 'Jina (Kiswahili)', priceTZS: 'Bei', quantity: 'Kiasi', category: 'Aina', reports: 'Ripoti', daily: 'Leo', weekly: 'Wiki', monthly: 'Mwezi', totalSales: 'Jumla ya Mauzo', totalOrders: 'Jumla ya Maagizo', approve: 'Idhinisha', reject: 'Kataa', pendingApprovals: 'Maombi', companyName: 'Kampuni', location: 'Eneo', products: 'Bidhaa', orders: 'Maagizo', myOrders: 'Maagizo Yangu', cart: 'Rukwama', logout: 'Toka' }
}

function t(key) { return translations[currentLanguage]?.[key] || translations.en[key] || key }

// ============================================
// INITIALIZE APP - Show Full HTML
// ============================================
async function initApp() {
  // Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    console.log('User logged in:', session.user.email)
    await loadUserData(session.user)
  } else {
    showLoginScreen()
  }
}

function showLoginScreen() {
  // Restore your full HTML here - For now, load the page normally
  // Since your HTML is already in the document, we just need to show/hide elements
  const languageScreen = document.getElementById('languageScreen')
  const loginSection = document.getElementById('loginSection')
  
  if (languageScreen) languageScreen.classList.remove('hidden')
  if (loginSection) loginSection.classList.add('hidden')
  
  window.selectLanguage = (lang) => {
    currentLanguage = lang
    if (languageScreen) languageScreen.classList.add('hidden')
    if (loginSection) loginSection.classList.remove('hidden')
    updateUIText()
  }
  
  const sendOtpBtn = document.getElementById('sendOtp')
  if (sendOtpBtn) {
    sendOtpBtn.onclick = async () => {
      const email = document.getElementById('email').value
      if (!email) return alert('Enter email')
      
      const name = document.getElementById('name').value
      const phone = document.getElementById('phone').value
      const location = document.getElementById('location').value
      const role = document.getElementById('roleRetailer')?.classList.contains('bg-green-600') ? 'retailer' : 'distributor'
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: APP_URL,
          data: { name, role, phone, location }
        }
      })
      
      if (error) alert('Error: ' + error.message)
      else alert('Login link sent to ' + email)
    }
  }
}

function updateUIText() {
  const elements = ['loginTitle', 'nameLabel', 'emailLabel', 'phoneLabel', 'locationLabel', 'roleLabel', 'sendLink']
  elements.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.textContent = t(id)
  })
}

// ============================================
// LOAD USER DATA & DASHBOARD
// ============================================
async function loadUserData(user) {
  currentUser = user
  console.log('Loading dashboard for:', user.email)
  
  // Get or create profile
  let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) {
    const { data: newProfile } = await supabase.from('profiles').insert([{
      id: user.id, email: user.email, role: user.user_metadata?.role || 'retailer',
      name: user.user_metadata?.name || user.email.split('@')[0],
      phone: user.user_metadata?.phone || '', location: user.user_metadata?.location || ''
    }]).select().single()
    profile = newProfile
  }

  currentRole = profile.role

  // Check if admin
  const { data: adminCheck } = await supabase.from('admin_users').select('id').eq('id', user.id).single()

  // Hide login, show appropriate dashboard
  document.getElementById('loginSection')?.classList.add('hidden')
  document.getElementById('languageScreen')?.classList.add('hidden')
  
  if (adminCheck) {
    document.getElementById('adminDashboard')?.classList.remove('hidden')
    await loadPendingDistributors()
    await loadAdminOrders()
  } else if (currentRole === 'distributor') {
    document.getElementById('distributorDashboard')?.classList.remove('hidden')
    await loadDistributorData(user.id)
  } else {
    document.getElementById('retailerDashboard')?.classList.remove('hidden')
    await loadRetailerData(user.id)
  }
}

// ============================================
// DISTRIBUTOR FUNCTIONS
// ============================================
async function loadDistributorData(userId) {
  let { data: distributor } = await supabase.from('distributors').select('*').eq('user_id', userId).single()
  if (!distributor) {
    const { data: newDistributor } = await supabase.from('distributors').insert([{
      user_id: userId, company_name: currentUser.user_metadata?.name || 'My Company',
      phone: currentUser.user_metadata?.phone || '', address: currentUser.user_metadata?.location || '',
      is_approved: false
    }]).select().single()
    distributor = newDistributor
  }

  if (!distributor.is_approved) {
    document.getElementById('distributorProducts').innerHTML = `<div class="bg-yellow-50 p-6 text-center"><p class="text-yellow-800">${t('pendingApproval')}</p></div>`
    return
  }

  currentDistributorId = distributor.id
  await loadDistributorProducts()
  await loadDistributorOrders()
  await loadStockAlerts()
}

async function loadDistributorProducts() {
  const { data: products } = await supabase.from('products').select('*').eq('distributor_id', currentDistributorId)
  const container = document.getElementById('distributorProducts')
  if (!container) return
  if (!products?.length) { container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noProducts')}</div>`; return }
  
  container.innerHTML = ''
  for (const p of products) {
    container.innerHTML += `
      <div class="bg-white rounded-xl shadow-sm border p-4">
        <h4 class="font-bold">${p.product_name}</h4>
        <p class="text-green-600 font-bold">${formatMoney(p.price)} TZS</p>
        <p class="text-sm text-gray-600">${t('stock')}: ${p.stock_quantity}</p>
        <div class="flex gap-2 mt-3">
          <button onclick="window.updateStock('${p.id}')" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">Update Stock</button>
          <button onclick="window.deleteProduct('${p.id}')" class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg">Delete</button>
        </div>
      </div>
    `
  }
}

window.updateStock = async (productId) => {
  const newStock = prompt('New stock quantity:')
  if (newStock) await supabase.from('products').update({ stock_quantity: parseInt(newStock) }).eq('id', productId)
  await loadDistributorProducts()
}

window.deleteProduct = async (productId) => {
  if (confirm('Delete product?')) await supabase.from('products').delete().eq('id', productId)
  await loadDistributorProducts()
}

async function loadDistributorOrders() {
  const { data: products } = await supabase.from('products').select('id').eq('distributor_id', currentDistributorId)
  if (!products?.length) return
  const { data: items } = await supabase.from('order_items').select('*, orders(*, retailers(store_name))').in('product_id', products.map(p => p.id))
  const container = document.getElementById('distributorOrders')
  if (!container) return
  if (!items?.length) { container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noOrders')}</div>`; return }
  
  const ordersMap = new Map()
  items.forEach(item => { if (!ordersMap.has(item.order_id)) ordersMap.set(item.order_id, { order: item.orders }) })
  container.innerHTML = ''
  for (const [_, data] of ordersMap) {
    const o = data.order
    container.innerHTML += `
      <div class="bg-white rounded-xl shadow-sm border p-4">
        <div class="flex justify-between"><strong>${t('orderNumber')}${o.order_number}</strong><span class="px-2 py-0.5 rounded-full text-xs bg-yellow-100">${o.status}</span></div>
        <p>Store: ${o.retailers?.store_name}</p>
        <p>${formatMoney(o.total_amount)} TZS</p>
        <div class="flex gap-2 mt-3">
          <button onclick="window.updateOrderStatus('${o.id}', 'confirmed')" class="px-3 py-1 bg-green-600 text-white text-sm rounded">Confirm</button>
          <button onclick="window.updateOrderStatus('${o.id}', 'shipped')" class="px-3 py-1 bg-blue-600 text-white text-sm rounded">Ship</button>
          <button onclick="window.updateOrderStatus('${o.id}', 'delivered')" class="px-3 py-1 bg-green-600 text-white text-sm rounded">Deliver</button>
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
  const { data: products } = await supabase.from('products').select('*').eq('distributor_id', currentDistributorId).lt('stock_quantity', 10)
  const container = document.getElementById('stockAlerts')
  if (!container) return
  if (!products?.length) { container.innerHTML = '<div class="text-green-600 text-center py-8">No alerts</div>'; return }
  container.innerHTML = ''
  for (const p of products) {
    container.innerHTML += `<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><p class="font-bold">⚠️ ${p.product_name}: ${p.stock_quantity} left</p><button onclick="window.restockProduct('${p.id}')" class="mt-2 px-4 py-1.5 bg-yellow-600 text-white rounded">Restock</button></div>`
  }
}

window.restockProduct = async (productId) => {
  const add = prompt('How many to add?')
  if (add) {
    const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', productId).single()
    await supabase.from('products').update({ stock_quantity: p.stock_quantity + parseInt(add) }).eq('id', productId)
    await loadDistributorProducts()
    await loadStockAlerts()
  }
}

// ============================================
// RETAILER FUNCTIONS
// ============================================
async function loadRetailerData(userId) {
  let { data: retailer } = await supabase.from('retailers').select('*').eq('user_id', userId).single()
  if (!retailer) {
    const { data: newRetailer } = await supabase.from('retailers').insert([{
      user_id: userId, store_name: currentUser.user_metadata?.name || 'My Store',
      location: currentUser.user_metadata?.location || '', phone: currentUser.user_metadata?.phone || ''
    }]).select().single()
    retailer = newRetailer
  }
  currentRetailerId = retailer.id
  await loadAvailableProducts()
  await loadRetailerOrders()
  await loadCart()
}

async function loadAvailableProducts() {
  const { data: products } = await supabase.from('products').select('*, distributors(company_name)').eq('is_available', true).gt('stock_quantity', 0)
  const container = document.getElementById('retailerProducts')
  if (!container) return
  if (!products?.length) { container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noProducts')}</div>`; return }
  
  container.innerHTML = ''
  for (const p of products) {
    container.innerHTML += `
      <div class="bg-white rounded-xl shadow-sm border p-4">
        <h4 class="font-bold">${p.product_name}</h4>
        <p class="text-green-600 font-bold">${formatMoney(p.price)} TZS</p>
        <p class="text-sm text-gray-600">${t('stock')}: ${p.stock_quantity}</p>
        <div class="flex gap-2 mt-3">
          <input type="number" id="qty_${p.id}" value="${p.min_order_quantity}" min="${p.min_order_quantity}" max="${p.stock_quantity}" class="w-20 px-2 py-1 border rounded-lg">
          <button onclick="window.addToCart('${p.id}')" class="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg">${t('addToCart')}</button>
        </div>
      </div>
    `
  }
}

window.addToCart = async (productId) => {
  const qty = parseInt(document.getElementById(`qty_${productId}`).value)
  const { data: existing } = await supabase.from('cart').select('*').eq('retailer_id', currentRetailerId).eq('product_id', productId).single()
  if (existing) await supabase.from('cart').update({ quantity: existing.quantity + qty }).eq('id', existing.id)
  else await supabase.from('cart').insert([{ retailer_id: currentRetailerId, product_id: productId, quantity: qty }])
  await loadCart()
}

async function loadCart() {
  const { data: items } = await supabase.from('cart').select('*, products(*)').eq('retailer_id', currentRetailerId)
  cart = items || []
  document.getElementById('cartCount').textContent = cart.reduce((s, i) => s + i.quantity, 0)
  const container = document.getElementById('cartItems')
  if (!container) return
  if (!cart.length) { container.innerHTML = `<div class="text-gray-500 text-center py-4">${t('emptyCart')}</div>`; document.getElementById('cartTotal').textContent = '0'; return }
  
  let total = 0
  container.innerHTML = ''
  for (const item of cart) {
    const itemTotal = item.products.price * item.quantity
    total += itemTotal
    container.innerHTML += `<div class="flex justify-between border-b pb-2"><div><strong>${item.products.product_name}</strong><br>${item.quantity} x ${formatMoney(item.products.price)}</div><div>${formatMoney(itemTotal)} <button onclick="window.removeFromCart('${item.id}')" class="text-red-500">Remove</button></div></div>`
  }
  document.getElementById('cartTotal').textContent = formatMoney(total)
}

window.removeFromCart = async (cartId) => {
  await supabase.from('cart').delete().eq('id', cartId)
  await loadCart()
}

document.getElementById('checkoutBtn')?.addEventListener('click', async () => {
  if (!cart.length) return alert(t('emptyCart'))
  const address = document.getElementById('deliveryAddress').value
  if (!address) return alert('Enter delivery address')
  
  const total = cart.reduce((s, i) => s + (i.products.price * i.quantity), 0)
  const orderNum = 'ORD-' + Date.now()
  const { data: order } = await supabase.from('orders').insert([{ retailer_id: currentRetailerId, order_number: orderNum, total_amount: total, delivery_address: address, payment_method: document.getElementById('paymentMethod').value }]).select().single()
  
  const items = cart.map(i => ({ order_id: order.id, product_id: i.product_id, quantity: i.quantity, unit_price: i.products.price, total_price: i.products.price * i.quantity }))
  await supabase.from('order_items').insert(items)
  for (const i of cart) await supabase.from('products').update({ stock_quantity: i.products.stock_quantity - i.quantity }).eq('id', i.product_id)
  await supabase.from('cart').delete().eq('retailer_id', currentRetailerId)
  
  alert(`${t('orderPlaced')} ${orderNum}`)
  closeModal('cartModal')
  await loadCart()
  await loadAvailableProducts()
  await loadRetailerOrders()
})

async function loadRetailerOrders() {
  const { data: orders } = await supabase.from('orders').select('*, order_items(*)').eq('retailer_id', currentRetailerId).order('created_at', { ascending: false })
  const container = document.getElementById('retailerOrders')
  if (!container) return
  if (!orders?.length) { container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noOrders')}</div>`; return }
  container.innerHTML = ''
  for (const o of orders) {
    container.innerHTML += `<div class="bg-white rounded-xl shadow-sm border p-4 cursor-pointer" onclick="showOrderStatus(${JSON.stringify(o).replace(/"/g, '&quot;')})"><div class="flex justify-between"><strong>${t('orderNumber')}${o.order_number}</strong><span class="px-2 py-0.5 rounded-full text-xs bg-yellow-100">${o.status}</span></div><p>${formatMoney(o.total_amount)} TZS</p><p class="text-xs text-gray-400">${new Date(o.created_at).toLocaleDateString()}</p></div>`
  }
}

function showOrderStatus(order) {
  const modal = document.getElementById('orderStatusModal')
  const content = document.getElementById('orderStatusContent')
  content.innerHTML = `<p><strong>${t('orderNumber')}${order.order_number}</strong></p><p>${t('orderStatus')}: ${order.status}</p><p>${t('total')}: ${formatMoney(order.total_amount)} TZS</p><p>Payment: ${order.payment_method}</p><p>Delivery: ${order.delivery_address}</p>`
  modal.classList.remove('hidden')
}

// ============================================
// ADMIN FUNCTIONS
// ============================================
async function loadPendingDistributors() {
  const { data: dists } = await supabase.from('distributors').select('*, profiles(name, email, location)').eq('is_approved', false)
  const container = document.getElementById('pendingDistributors')
  if (!container) return
  if (!dists?.length) { container.innerHTML = '<div class="text-gray-500 text-center py-4">No pending approvals</div>'; return }
  container.innerHTML = ''
  for (const d of dists) {
    container.innerHTML += `<div class="border rounded-lg p-4 flex justify-between"><div><p class="font-bold">${d.company_name}</p><p class="text-sm">${d.profiles?.email}</p></div><div><button onclick="window.approveDistributor('${d.id}')" class="px-4 py-2 bg-green-600 text-white rounded">Approve</button><button onclick="window.rejectDistributor('${d.id}')" class="px-4 py-2 bg-red-600 text-white rounded ml-2">Reject</button></div></div>`
  }
}

window.approveDistributor = async (id) => { await supabase.from('distributors').update({ is_approved: true }).eq('id', id); await loadPendingDistributors() }
window.rejectDistributor = async (id) => { await supabase.from('distributors').delete().eq('id', id); await loadPendingDistributors() }

async function loadAdminOrders() {
  const { data: orders } = await supabase.from('orders').select('*, retailers(store_name)').order('created_at', { ascending: false }).limit(50)
  const container = document.getElementById('adminOrders')
  if (!container) return
  if (!orders?.length) { container.innerHTML = '<div class="text-gray-500 text-center py-4">No orders</div>'; return }
  container.innerHTML = ''
  for (const o of orders) {
    container.innerHTML += `<div class="border rounded-lg p-4"><div class="flex justify-between"><strong>Order #${o.order_number}</strong><span class="text-xs">${new Date(o.created_at).toLocaleDateString()}</span></div><p>Store: ${o.retailers?.store_name}</p><p>Total: ${formatMoney(o.total_amount)} TZS</p><p>Status: ${o.status}</p></div>`
  }
}

// ============================================
// UTILITIES
// ============================================
function formatMoney(amount) { return new Intl.NumberFormat('en-TZ').format(amount) }
function closeModal(id) { document.getElementById(id).classList.add('hidden') }
window.closeModal = closeModal

// Logout handlers
document.getElementById('logoutBtn')?.addEventListener('click', () => supabase.auth.signOut())
document.getElementById('logoutBtn2')?.addEventListener('click', () => supabase.auth.signOut())
document.getElementById('adminLogoutBtn')?.addEventListener('click', () => supabase.auth.signOut())

// Cart modal
document.getElementById('showCartBtn')?.addEventListener('click', () => document.getElementById('cartModal').classList.remove('hidden'))

// Make functions global
window.addToCart = addToCart
window.removeFromCart = removeFromCart
window.updateStock = updateStock
window.deleteProduct = deleteProduct
window.updateOrderStatus = updateOrderStatus
window.restockProduct = restockProduct
window.approveDistributor = approveDistributor
window.rejectDistributor = rejectDistributor

// Auth state listener
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) await loadUserData(session.user)
  else if (event === 'SIGNED_OUT') window.location.reload()
})

// Start the app
initApp()
