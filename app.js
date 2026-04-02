// app.js - Complete FMCG Platform
import { supabase } from './supabase.js'

// ============================================
// STATE
// ============================================
let currentLanguage = null
let currentUser = null
let currentRole = null
let currentRetailerId = null
let currentDistributorId = null
let cart = []
let notificationSubscription = null

// Translations
const translations = {
  en: {
    loading: 'Loading...',
    loginTitle: 'BomaWave',
    nameLabel: 'Full Name',
    emailLabel: 'Email Address',
    phoneLabel: 'Phone Number (Optional)',
    locationLabel: 'Location / Area',
    roleLabel: 'I am a:',
    sendLink: 'Send Login Link',
    pendingApproval: 'Your distributor account is pending admin approval. You will receive an email once approved.',
    noProducts: 'No products found.',
    noOrders: 'No orders yet.',
    emptyCart: 'Your cart is empty.',
    orderPlaced: 'Order placed successfully!',
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
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
    lowStockAlert: 'Low Stock Alert',
    unitsLeft: 'units left',
    restock: 'Restock',
    addProduct: 'Add Product',
    productName: 'Product Name',
    productNameSw: 'Product Name (Swahili)',
    priceTZS: 'Price (TZS)',
    quantity: 'Quantity',
    category: 'Category',
    reports: 'Reports',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    totalSales: 'Total Sales',
    totalOrders: 'Total Orders',
    approve: 'Approve',
    reject: 'Reject',
    pendingApprovals: 'Pending Approvals',
    companyName: 'Company Name',
    location: 'Location',
    products: 'Products',
    orders: 'Orders',
    myOrders: 'My Orders',
    cart: 'Cart',
    logout: 'Logout'
  },
  sw: {
    loading: 'Inapakia...',
    loginTitle: 'BomaWave',
    nameLabel: 'Jina Kamili',
    emailLabel: 'Barua Pepe',
    phoneLabel: 'Nambari ya Simu (Si Lazima)',
    locationLabel: 'Eneo',
    roleLabel: 'Mimi ni:',
    sendLink: 'Tuma Kiungo cha Kuingia',
    pendingApproval: 'Akaunti yako ya msambazaji inasubiri idhini ya msimamizi. Utapokea barua pepe baada ya kuidhinishwa.',
    noProducts: 'Hakuna bidhaa zilizopatikana.',
    noOrders: 'Hakuna maagizo bado.',
    emptyCart: 'Rukwama yako ni tupu.',
    orderPlaced: 'Agizo limewekwa kikamilifu!',
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
    mobileMoney: 'M-Pesa / Tigo Pesa',
    orderStatus: 'Hali ya Agizo',
    pending: 'inasubiri',
    confirmed: 'imethibitishwa',
    processing: 'inachakatwa',
    shipped: 'imesafirishwa',
    delivered: 'imewasilishwa',
    cancelled: 'imeghairiwa',
    lowStockAlert: 'Tahadhari ya Upungufu wa Bidhaa',
    unitsLeft: 'zimebaki',
    restock: 'Jaza tena',
    addProduct: 'Ongeza Bidhaa',
    productName: 'Jina la Bidhaa',
    productNameSw: 'Jina la Bidhaa (Kiswahili)',
    priceTZS: 'Bei (TZS)',
    quantity: 'Kiasi',
    category: 'Aina',
    reports: 'Ripoti',
    daily: 'Leo',
    weekly: 'Wiki hii',
    monthly: 'Mwezi huu',
    totalSales: 'Jumla ya Mauzo',
    totalOrders: 'Jumla ya Maagizo',
    approve: 'Idhinisha',
    reject: 'Kataa',
    pendingApprovals: 'Maombi Yanayosubiri',
    companyName: 'Jina la Kampuni',
    location: 'Eneo',
    products: 'Bidhaa',
    orders: 'Maagizo',
    myOrders: 'Maagizo Yangu',
    cart: 'Rukwama',
    logout: 'Toka'
  }
}

// ============================================
// LANGUAGE SELECTION (First Screen)
// ============================================
window.selectLanguage = (lang) => {
  currentLanguage = lang
  document.getElementById('languageScreen').classList.add('hidden')
  document.getElementById('loginSection').classList.remove('hidden')
  updateUIText()
}

function t(key) {
  return translations[currentLanguage]?.[key] || translations.en[key] || key
}

function updateUIText() {
  const elements = ['loginTitle', 'nameLabel', 'emailLabel', 'phoneLabel', 'locationLabel', 'roleLabel', 'sendLink']
  elements.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.textContent = t(id)
  })
  document.getElementById('roleRetailer').textContent = 'Retailer'
  document.getElementById('roleDistributor').textContent = 'Distributor'
}

// ============================================
// ROLE SELECTION UI
// ============================================
let selectedRole = 'retailer'
document.getElementById('roleRetailer').addEventListener('click', () => {
  selectedRole = 'retailer'
  document.getElementById('roleRetailer').className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg'
  document.getElementById('roleDistributor').className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg'
})
document.getElementById('roleDistributor').addEventListener('click', () => {
  selectedRole = 'distributor'
  document.getElementById('roleDistributor').className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg'
  document.getElementById('roleRetailer').className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg'
})

// ============================================
// AUTHENTICATION
// ============================================
document.getElementById('sendOtp').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim()
  if (!email) return alert('Enter your email')

  showLoading(true)
  
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname,
      data: {
        name: document.getElementById('name').value.trim() || email.split('@')[0],
        role: selectedRole,
        phone: document.getElementById('phone').value.trim(),
        location: document.getElementById('location').value.trim()
      }
    }
  })

  showLoading(false)
  
  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert(`Login link sent to ${email}. Check your inbox.`)
  }
})

// ============================================
// SESSION MANAGEMENT (Persistent Login)
// ============================================
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    await loadUserData(session.user)
  } else if (event === 'SIGNED_OUT') {
    resetToLogin()
  }
})

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    await loadUserData(session.user)
  }
}

async function loadUserData(user) {
  currentUser = user
  showLoading(true)

  // Get or create profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'retailer',
        name: user.user_metadata?.name || user.email.split('@')[0],
        phone: user.user_metadata?.phone || '',
        location: user.user_metadata?.location || ''
      }])
      .select()
      .single()
    profile = newProfile
  }

  currentRole = profile.role

  // Check if admin
  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (adminCheck) {
    await loadAdminDashboard()
  } else if (currentRole === 'distributor') {
    await loadDistributorData(user.id)
  } else {
    await loadRetailerData(user.id)
  }

  showLoading(false)
}

// ============================================
// ADMIN DASHBOARD
// ============================================
async function loadAdminDashboard() {
  document.getElementById('loginSection').classList.add('hidden')
  document.getElementById('distributorDashboard').classList.add('hidden')
  document.getElementById('retailerDashboard').classList.add('hidden')
  document.getElementById('adminDashboard').classList.remove('hidden')

  await loadPendingDistributors()
  await loadAdminOrders()
}

async function loadPendingDistributors() {
  const { data: distributors } = await supabase
    .from('distributors')
    .select('*, profiles(name, email, phone, location)')
    .eq('is_approved', false)

  const container = document.getElementById('pendingDistributors')
  if (!distributors || distributors.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-center py-4">No pending approvals</div>'
    return
  }

  container.innerHTML = ''
  for (const dist of distributors) {
    const card = document.createElement('div')
    card.className = 'border border-gray-200 rounded-lg p-4 flex justify-between items-center'
    card.innerHTML = `
      <div>
        <p class="font-bold">${dist.company_name}</p>
        <p class="text-sm text-gray-600">${dist.profiles?.email}</p>
        <p class="text-sm text-gray-600">${dist.profiles?.location || 'No location'}</p>
      </div>
      <div class="flex gap-2">
        <button onclick="window.approveDistributor('${dist.id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
        <button onclick="window.rejectDistributor('${dist.id}')" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
      </div>
    `
    container.appendChild(card)
  }
}

window.approveDistributor = async (distributorId) => {
  await supabase.from('distributors').update({ is_approved: true, approved_at: new Date() }).eq('id', distributorId)
  await loadPendingDistributors()
  alert('Distributor approved')
}

window.rejectDistributor = async (distributorId) => {
  await supabase.from('distributors').delete().eq('id', distributorId)
  await loadPendingDistributors()
  alert('Distributor rejected')
}

async function loadAdminOrders() {
  const { data: orders } = await supabase
    .from('orders')
    .select('*, retailers(store_name), order_items(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  const container = document.getElementById('adminOrders')
  if (!orders || orders.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-center py-4">No orders yet</div>'
    return
  }

  container.innerHTML = ''
  for (const order of orders) {
    const card = document.createElement('div')
    card.className = 'border border-gray-200 rounded-lg p-4'
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <p class="font-bold">Order #${order.order_number}</p>
          <p class="text-sm text-gray-600">Store: ${order.retailers?.store_name || 'Unknown'}</p>
          <p class="text-sm text-gray-600">Total: ${formatMoney(order.total_amount)} TZS</p>
          <p class="text-sm">Status: <span class="px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}">${order.status}</span></p>
        </div>
        <p class="text-xs text-gray-400">${new Date(order.created_at).toLocaleDateString()}</p>
      </div>
    `
    container.appendChild(card)
  }
}

// ============================================
// DISTRIBUTOR FUNCTIONS
// ============================================
async function loadDistributorData(userId) {
  let { data: distributor } = await supabase
    .from('distributors')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!distributor) {
    const { data: newDistributor } = await supabase
      .from('distributors')
      .insert([{
        user_id: userId,
        company_name: currentUser.user_metadata?.name || 'My Company',
        phone: currentUser.user_metadata?.phone || '',
        address: currentUser.user_metadata?.location || '',
        is_approved: false
      }])
      .select()
      .single()
    distributor = newDistributor
  }

  if (!distributor.is_approved) {
    document.getElementById('loginSection').classList.add('hidden')
    document.getElementById('distributorDashboard').classList.remove('hidden')
    document.getElementById('distributorProducts').innerHTML = `<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
      <p class="text-yellow-800">${t('pendingApproval')}</p>
    </div>`
    return
  }

  currentDistributorId = distributor.id
  document.getElementById('loginSection').classList.add('hidden')
  document.getElementById('retailerDashboard').classList.add('hidden')
  document.getElementById('adminDashboard').classList.add('hidden')
  document.getElementById('distributorDashboard').classList.remove('hidden')

  await loadDistributorProducts()
  await loadDistributorOrders()
  await loadStockAlerts()
  setupDistributorTabs()
}

async function loadDistributorProducts() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('distributor_id', currentDistributorId)
    .order('created_at', { ascending: false })

  const container = document.getElementById('distributorProducts')
  if (!products || products.length === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noProducts')}</div>`
    return
  }

  container.innerHTML = ''
  for (const product of products) {
    const card = document.createElement('div')
    card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 p-4'
    card.innerHTML = `
      <h4 class="font-bold text-gray-800">${product.product_name}</h4>
      ${product.product_name_sw ? `<p class="text-sm text-gray-500">${product.product_name_sw}</p>` : ''}
      <p class="text-green-600 font-bold mt-2">${formatMoney(product.price)} TZS</p>
      <p class="text-sm text-gray-600">${t('stock')}: ${product.stock_quantity}</p>
      <p class="text-sm text-gray-600">${t('minOrder')}: ${product.min_order_quantity}</p>
      <div class="flex gap-2 mt-3">
        <button onclick="window.updateStock('${product.id}')" class="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Update Stock</button>
        <button onclick="window.deleteProduct('${product.id}')" class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">Delete</button>
      </div>
    `
    container.appendChild(card)
  }
}

document.getElementById('addProductBtn').addEventListener('click', async () => {
  const name = document.getElementById('productName').value
  const nameSw = document.getElementById('productNameSw').value
  const price = parseFloat(document.getElementById('productPrice').value)
  const stock = parseInt(document.getElementById('productStock').value)
  const minOrderQty = parseInt(document.getElementById('minOrderQty').value)
  const category = document.getElementById('productCategory').value

  if (!name || !price) return alert('Product name and price required')

  await supabase.from('products').insert([{
    distributor_id: currentDistributorId,
    product_name: name,
    product_name_sw: nameSw,
    price: price,
    stock_quantity: stock || 0,
    min_order_quantity: minOrderQty || 1,
    category: category || 'General'
  }])

  document.getElementById('productName').value = ''
  document.getElementById('productNameSw').value = ''
  document.getElementById('productPrice').value = ''
  document.getElementById('productStock').value = ''
  document.getElementById('productCategory').value = ''
  await loadDistributorProducts()
})

window.updateStock = async (productId) => {
  const newStock = prompt('Enter new stock quantity:')
  if (newStock !== null) {
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
  const { data: products } = await supabase.from('products').select('id').eq('distributor_id', currentDistributorId)
  if (!products || products.length === 0) {
    document.getElementById('distributorOrders').innerHTML = `<div class="text-gray-500 text-center py-8">${t('noOrders')}</div>`
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

  const container = document.getElementById('distributorOrders')
  if (ordersMap.size === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noOrders')}</div>`
    return
  }

  container.innerHTML = ''
  for (const [_, data] of ordersMap) {
    const order = data.order
    const card = document.createElement('div')
    card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 p-4'
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <p class="font-bold">${t('orderNumber')}${order.order_number}</p>
          <p class="text-sm text-gray-600">Store: ${order.retailers?.store_name || 'Unknown'}</p>
          <p class="text-sm">${formatMoney(order.total_amount)} TZS</p>
        </div>
        <span class="px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}">${t(order.status)}</span>
      </div>
      <div class="flex gap-2 mt-3">
        <button onclick="window.updateOrderStatus('${order.id}', 'confirmed')" class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg">Confirm</button>
        <button onclick="window.updateOrderStatus('${order.id}', 'processing')" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">Process</button>
        <button onclick="window.updateOrderStatus('${order.id}', 'shipped')" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">Ship</button>
        <button onclick="window.updateOrderStatus('${order.id}', 'delivered')" class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg">Deliver</button>
      </div>
    `
    container.appendChild(card)
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
    .eq('distributor_id', currentDistributorId)
    .lt('stock_quantity', 10)

  const container = document.getElementById('stockAlerts')
  if (!products || products.length === 0) {
    container.innerHTML = '<div class="text-green-600 text-center py-8">No low stock alerts</div>'
    return
  }

  container.innerHTML = ''
  for (const product of products) {
    const card = document.createElement('div')
    card.className = 'bg-yellow-50 border border-yellow-200 rounded-lg p-4'
    card.innerHTML = `
      <p class="font-bold text-yellow-800">${t('lowStockAlert')}</p>
      <p class="text-yellow-700">${product.product_name}: ${product.stock_quantity} ${t('unitsLeft')}</p>
      <button onclick="window.restockProduct('${product.id}')" class="mt-2 px-4 py-1.5 bg-yellow-600 text-white text-sm rounded-lg">${t('restock')}</button>
    `
    container.appendChild(card)
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
// RETAILER FUNCTIONS
// ============================================
async function loadRetailerData(userId) {
  let { data: retailer } = await supabase
    .from('retailers')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!retailer) {
    const { data: newRetailer } = await supabase
      .from('retailers')
      .insert([{
        user_id: userId,
        store_name: currentUser.user_metadata?.name || 'My Store',
        location: currentUser.user_metadata?.location || '',
        phone: currentUser.user_metadata?.phone || ''
      }])
      .select()
      .single()
    retailer = newRetailer
  }

  currentRetailerId = retailer.id
  document.getElementById('loginSection').classList.add('hidden')
  document.getElementById('distributorDashboard').classList.add('hidden')
  document.getElementById('adminDashboard').classList.add('hidden')
  document.getElementById('retailerDashboard').classList.remove('hidden')

  await loadAvailableProducts()
  await loadRetailerOrders()
  await loadCart()
  setupRetailerTabs()
}

async function loadAvailableProducts() {
  const { data: products } = await supabase
    .from('products')
    .select('*, distributors(company_name)')
    .eq('is_available', true)
    .gt('stock_quantity', 0)

  const container = document.getElementById('retailerProducts')
  if (!products || products.length === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noProducts')}</div>`
    return
  }

  // Populate categories
  const categories = [...new Set(products.map(p => p.category).filter(c => c))]
  const categoryFilter = document.getElementById('categoryFilter')
  categoryFilter.innerHTML = '<option value="all">All Categories</option>'
  categories.forEach(cat => {
    categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`
  })

  container.innerHTML = ''
  for (const product of products) {
    const card = document.createElement('div')
    card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 p-4'
    card.innerHTML = `
      <h4 class="font-bold text-gray-800">${product.product_name}</h4>
      ${product.product_name_sw ? `<p class="text-sm text-gray-500">${product.product_name_sw}</p>` : ''}
      <p class="text-green-600 font-bold mt-2">${formatMoney(product.price)} TZS</p>
      <p class="text-sm text-gray-600">${t('stock')}: ${product.stock_quantity}</p>
      <div class="flex gap-2 mt-3">
        <input type="number" id="qty_${product.id}" value="${product.min_order_quantity}" min="${product.min_order_quantity}" max="${product.stock_quantity}" class="w-20 px-2 py-1 border border-gray-300 rounded-lg">
        <button onclick="window.addToCart('${product.id}')" class="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">${t('addToCart')}</button>
      </div>
    `
    container.appendChild(card)
  }

  // Search functionality
  document.getElementById('searchProducts').addEventListener('input', filterProducts)
  categoryFilter.addEventListener('change', filterProducts)

  function filterProducts() {
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase()
    const category = categoryFilter.value
    const cards = document.querySelectorAll('#retailerProducts > div')
    cards.forEach((card, index) => {
      const product = products[index]
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm) ||
                           (product.product_name_sw || '').toLowerCase().includes(searchTerm)
      const matchesCategory = category === 'all' || product.category === category
      card.style.display = matchesSearch && matchesCategory ? 'block' : 'none'
    })
  }
}

window.addToCart = async (productId) => {
  const qtyInput = document.getElementById(`qty_${productId}`)
  const quantity = parseInt(qtyInput.value)

  const { data: existing } = await supabase
    .from('cart')
    .select('*')
    .eq('retailer_id', currentRetailerId)
    .eq('product_id', productId)
    .single()

  if (existing) {
    await supabase.from('cart').update({ quantity: existing.quantity + quantity }).eq('id', existing.id)
  } else {
    await supabase.from('cart').insert([{ retailer_id: currentRetailerId, product_id: productId, quantity }])
  }

  await loadCart()
}

async function loadCart() {
  const { data: cartItems } = await supabase
    .from('cart')
    .select('*, products(*)')
    .eq('retailer_id', currentRetailerId)

  cart = cartItems || []
  document.getElementById('cartCount').textContent = cart.reduce((sum, i) => sum + i.quantity, 0)

  const container = document.getElementById('cartItems')
  if (!cart || cart.length === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center py-4">${t('emptyCart')}</div>`
    document.getElementById('cartTotal').textContent = '0'
    return
  }

  let total = 0
  container.innerHTML = ''
  for (const item of cart) {
    const itemTotal = item.products.price * item.quantity
    total += itemTotal
    const div = document.createElement('div')
    div.className = 'flex justify-between items-center border-b border-gray-100 pb-2'
    div.innerHTML = `
      <div>
        <p class="font-medium">${item.products.product_name}</p>
        <p class="text-sm text-gray-500">${item.quantity} x ${formatMoney(item.products.price)} TZS</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-bold">${formatMoney(itemTotal)} TZS</span>
        <button onclick="window.removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700">Remove</button>
      </div>
    `
    container.appendChild(div)
  }
  document.getElementById('cartTotal').textContent = formatMoney(total)

  const minOrderAmount = 50000
  const warning = document.getElementById('minOrderWarning')
  if (total < minOrderAmount) {
    warning.innerHTML = `Minimum order is ${formatMoney(minOrderAmount)} TZS`
    warning.className = 'text-sm text-yellow-600'
  } else {
    warning.innerHTML = 'Ready to place order'
    warning.className = 'text-sm text-green-600'
  }
}

window.removeFromCart = async (cartId) => {
  await supabase.from('cart').delete().eq('id', cartId)
  await loadCart()
}

document.getElementById('checkoutBtn').addEventListener('click', async () => {
  if (!cart.length) return alert(t('emptyCart'))

  const totalAmount = cart.reduce((sum, i) => sum + (i.products.price * i.quantity), 0)
  const deliveryAddress = document.getElementById('deliveryAddress').value
  if (!deliveryAddress) return alert('Enter delivery address')

  showLoading(true)

  const orderNumber = 'ORD-' + Date.now()
  const { data: order } = await supabase
    .from('orders')
    .insert([{
      retailer_id: currentRetailerId,
      order_number: orderNumber,
      total_amount: totalAmount,
      delivery_address: deliveryAddress,
      payment_method: document.getElementById('paymentMethod').value
    }])
    .select()
    .single()

  const orderItems = cart.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.products.price,
    total_price: item.products.price * item.quantity
  }))
  await supabase.from('order_items').insert(orderItems)

  // Update stock
  for (const item of cart) {
    await supabase
      .from('products')
      .update({ stock_quantity: item.products.stock_quantity - item.quantity })
      .eq('id', item.product_id)
  }

  await supabase.from('cart').delete().eq('retailer_id', currentRetailerId)

  showLoading(false)
  alert(`${t('orderPlaced')} ${t('orderNumber')}${orderNumber}`)
  closeModal('cartModal')
  await loadCart()
  await loadAvailableProducts()
  await loadRetailerOrders()
})

async function loadRetailerOrders() {
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('retailer_id', currentRetailerId)
    .order('created_at', { ascending: false })

  const container = document.getElementById('retailerOrders')
  if (!orders || orders.length === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noOrders')}</div>`
    return
  }

  container.innerHTML = ''
  for (const order of orders) {
    const card = document.createElement('div')
    card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition'
    card.onclick = () => showOrderStatus(order)
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <p class="font-bold">${t('orderNumber')}${order.order_number}</p>
          <p class="text-sm">${formatMoney(order.total_amount)} TZS</p>
        </div>
        <span class="px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}">${t(order.status)}</span>
      </div>
      <p class="text-xs text-gray-400 mt-2">${new Date(order.created_at).toLocaleDateString()}</p>
    `
    container.appendChild(card)
  }
}

function showOrderStatus(order) {
  const modal = document.getElementById('orderStatusModal')
  const content = document.getElementById('orderStatusContent')
  content.innerHTML = `
    <p class="font-bold">${t('orderNumber')}${order.order_number}</p>
    <p class="mt-2">${t('orderStatus')}: <span class="px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}">${t(order.status)}</span></p>
    <p class="mt-1">${t('total')}: ${formatMoney(order.total_amount)} TZS</p>
    <p class="mt-1">Payment: ${order.payment_method || 'pending'}</p>
    <p class="mt-1">Delivery: ${order.delivery_address || 'Not specified'}</p>
    <p class="text-xs text-gray-400 mt-2">${new Date(order.created_at).toLocaleString()}</p>
  `
  modal.classList.remove('hidden')
}

// ============================================
// REPORTS
// ============================================
document.getElementById('showReportsBtn')?.addEventListener('click', () => {
  document.getElementById('reportsModal').classList.remove('hidden')
})

document.getElementById('dailyReportBtn')?.addEventListener('click', async () => {
  const today = new Date().toISOString().split('T')[0]
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('distributor_id', currentDistributorId)
    .gte('created_at', today)
  const total = orders?.reduce((s, o) => s + o.total_amount, 0) || 0
  document.getElementById('reportContent').innerHTML = `<p class="text-center text-lg">${t('totalSales')}: ${formatMoney(total)} TZS</p>`
})

document.getElementById('weeklyReportBtn')?.addEventListener('click', async () => {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('distributor_id', currentDistributorId)
    .gte('created_at', weekAgo.toISOString())
  const total = orders?.reduce((s, o) => s + o.total_amount, 0) || 0
  document.getElementById('reportContent').innerHTML = `<p class="text-center text-lg">${t('totalSales')}: ${formatMoney(total)} TZS</p>`
})

document.getElementById('monthlyReportBtn')?.addEventListener('click', async () => {
  const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1)
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('distributor_id', currentDistributorId)
    .gte('created_at', monthAgo.toISOString())
  const total = orders?.reduce((s, o) => s + o.total_amount, 0) || 0
  document.getElementById('reportContent').innerHTML = `<p class="text-center text-lg">${t('totalSales')}: ${formatMoney(total)} TZS</p>`
})

// ============================================
// UTILITIES
// ============================================
function formatMoney(amount) {
  return new Intl.NumberFormat('en-TZ').format(amount)
}

function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function showLoading(show) {
  const loadingEl = document.getElementById('loading')
  if (show) {
    loadingEl.classList.remove('hidden')
    loadingEl.classList.add('flex')
  } else {
    loadingEl.classList.add('hidden')
    loadingEl.classList.remove('flex')
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden')
}

window.closeModal = closeModal

function resetToLogin() {
  document.getElementById('loginSection').classList.remove('hidden')
  document.getElementById('distributorDashboard').classList.add('hidden')
  document.getElementById('retailerDashboard').classList.add('hidden')
  document.getElementById('adminDashboard').classList.add('hidden')
  document.getElementById('languageScreen').classList.remove('hidden')
}

function setupDistributorTabs() {
  const tabs = document.querySelectorAll('.tab-btn-distributor')
  const contents = document.querySelectorAll('.tab-content-distributor')
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('border-green-600', 'text-green-600'))
      tab.classList.add('border-green-600', 'text-green-600')
      contents.forEach(c => c.classList.add('hidden'))
      document.getElementById(tab.dataset.tab).classList.remove('hidden')
    })
  })
}

function setupRetailerTabs() {
  const tabs = document.querySelectorAll('.tab-btn-retailer')
  const contents = document.querySelectorAll('.tab-content-retailer')
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('border-green-600', 'text-green-600'))
      tab.classList.add('border-green-600', 'text-green-600')
      contents.forEach(c => c.classList.add('hidden'))
      document.getElementById(tab.dataset.tab).classList.remove('hidden')
    })
  })
}

// Logout handlers
document.getElementById('logoutBtn')?.addEventListener('click', () => supabase.auth.signOut())
document.getElementById('logoutBtn2')?.addEventListener('click', () => supabase.auth.signOut())
document.getElementById('adminLogoutBtn')?.addEventListener('click', () => supabase.auth.signOut())

// Cart modal
document.getElementById('showCartBtn')?.addEventListener('click', () => {
  document.getElementById('cartModal').classList.remove('hidden')
})

// Make functions global
window.addToCart = addToCart
window.removeFromCart = removeFromCart
window.updateStock = updateStock
window.deleteProduct = deleteProduct
window.updateOrderStatus = updateOrderStatus
window.restockProduct = restockProduct
window.approveDistributor = approveDistributor
window.rejectDistributor = rejectDistributor

// Initialize
checkSession()
