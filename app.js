// app.js - BomaWave Professional Edition
import { supabase } from './supabase.js'

// ============================================
// APPLICATION STATE (Single Source of Truth)
// ============================================
const AppState = {
  language: 'en',
  user: null,
  role: null,
  storeId: null,
  cart: [],
  pendingOTP: null
}

// ============================================
// INTERNATIONALIZATION (i18n)
// ============================================
const I18n = {
  en: {
    roleTitle: 'I am a',
    retailer: 'Retailer', distributor: 'Distributor',
    loginTitle: 'Welcome Back', loginSubtitle: 'Sign in to continue',
    pendingApproval: 'Your account is pending admin approval',
    noProducts: 'No products available', noOrders: 'No orders yet',
    emptyCart: 'Your cart is empty', orderPlaced: 'Order placed successfully!',
    orderNumber: 'Order #', total: 'Total', checkout: 'Place Order',
    addToCart: 'Add to Cart', stock: 'Stock', price: 'Price',
    deliveryAddress: 'Delivery Address', deliveryTime: 'Delivery Time',
    logout: 'Logout', myOrders: 'My Orders', products: 'Products',
    orders: 'Orders', status: 'Status', orderDate: 'Order Date',
    totalAmount: 'Total Amount', contactPhone: 'Contact Phone'
  },
  sw: {
    roleTitle: 'Mimi ni',
    retailer: 'Muuzaji', distributor: 'Msambazaji',
    loginTitle: 'Karibu Tena', loginSubtitle: 'Ingia kuendelea',
    pendingApproval: 'Akaunti yako inasubiri idhini',
    noProducts: 'Hakuna bidhaa', noOrders: 'Hakuna maagizo',
    emptyCart: 'Rukwama yako ni tupu', orderPlaced: 'Agizo limewekwa!',
    orderNumber: 'Agizo #', total: 'Jumla', checkout: 'Weka Agizo',
    addToCart: 'Ingiza Rukwama', stock: 'Kiasi', price: 'Bei',
    deliveryAddress: 'Anwani ya Utoaji', deliveryTime: 'Muda wa Utoaji',
    logout: 'Toka', myOrders: 'Maagizo Yangu', products: 'Bidhaa',
    orders: 'Maagizo', status: 'Hali', orderDate: 'Tarehe',
    totalAmount: 'Jumla', contactPhone: 'Namba ya Simu'
  }
}

const t = (key) => I18n[AppState.language]?.[key] || I18n.en[key] || key

// ============================================
// UI UTILITIES
// ============================================
const UI = {
  loading: (show, msg = 'Loading...') => {
    const el = document.getElementById('loadingOverlay')
    const msgEl = document.getElementById('loadingMessage')
    if (!el) return
    if (show) {
      if (msgEl) msgEl.textContent = msg
      el.classList.remove('hidden')
      el.classList.add('flex')
    } else {
      el.classList.add('hidden')
      el.classList.remove('flex')
    }
  },
  
  showScreen: (screenId) => {
    const screens = ['screenLanguage', 'screenRole', 'screenLogin', 'screenRetailerSignup', 'screenDistributorSignup', 'dashboardRetailer', 'dashboardDistributor', 'dashboardAdmin']
    screens.forEach(id => document.getElementById(id)?.classList.add('hidden'))
    document.getElementById(screenId)?.classList.remove('hidden')
  },
  
  updateText: () => {
    const textElements = ['roleTitle', 'loginTitle', 'loginSubtitle']
    textElements.forEach(id => {
      const el = document.getElementById(id)
      if (el) el.textContent = t(id)
    })
    const retailerBtn = document.querySelector('#selectRetailer p:first-of-type')
    const distributorBtn = document.querySelector('#selectDistributor p:first-of-type')
    if (retailerBtn) retailerBtn.textContent = t('retailer')
    if (distributorBtn) distributorBtn.textContent = t('distributor')
  }
}

const formatMoney = (amount) => new Intl.NumberFormat('en-TZ').format(amount)
const getStatusColor = (status) => ({
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800'
}[status] || 'bg-gray-100 text-gray-800')

// ============================================
// AUTHENTICATION SERVICE
// ============================================
const Auth = {
  async login(storeName, password) {
    UI.loading(true, 'Signing in...')
    const { data: profile } = await supabase.from('profiles').select('*').eq('store_name', storeName.toLowerCase()).maybeSingle()
    if (!profile) { UI.loading(false); alert('Store not found'); return false }
    const identifier = profile.phone || profile.email
    const { data, error } = await supabase.auth.signInWithPassword({
      [identifier.includes('@') ? 'email' : 'phone']: identifier, password
    })
    UI.loading(false)
    if (error) { alert('Invalid password'); return false }
    if (data.session) { await this.loadUser(profile); return true }
    return false
  },
  
  async signUpRetailer(data) {
    UI.loading(true, 'Creating account...')
    const formattedPhone = data.phone.startsWith('+') ? data.phone : '+255' + data.phone.replace(/^0+/, '')
    const tempEmail = `${data.storeName.toLowerCase().replace(/[^a-z0-9]/g, '')}@retailer.bomawave.com`
    const { error: authError } = await supabase.auth.signUp({
      email: tempEmail, password: data.password,
      options: { data: { store_name: data.storeName.toLowerCase(), display_name: data.storeName, location: data.location, name: data.name, phone: formattedPhone, role: 'retailer', is_approved: true } }
    })
    if (authError) { UI.loading(false); alert(authError.message); return false }
    await new Promise(r => setTimeout(r, 1000))
    await supabase.from('profiles').upsert([{
      id: (await supabase.auth.getUser()).data.user?.id, store_name: data.storeName.toLowerCase(), display_name: data.storeName, location: data.location, name: data.name, phone: formattedPhone, role: 'retailer', is_approved: true
    }])
    UI.loading(false)
    alert('Account created! Please login.')
    return true
  },
  
  async signUpDistributor(data) {
    UI.loading(true, 'Submitting registration...')
    const formattedPhone = data.phone.startsWith('+') ? data.phone : '+255' + data.phone.replace(/^0+/, '')
    const tempEmail = `${data.storeName.toLowerCase().replace(/[^a-z0-9]/g, '')}@distributor.bomawave.com`
    const { error: authError } = await supabase.auth.signUp({
      email: tempEmail, password: data.password,
      options: { data: { store_name: data.storeName.toLowerCase(), display_name: data.storeName, company_name: data.companyName, location: data.location, coverage_areas: data.coverage, product_type: data.productType, vehicle: data.vehicle, name: data.name, phone: formattedPhone, role: 'distributor', is_approved: false } }
    })
    if (authError) { UI.loading(false); alert(authError.message); return false }
    await new Promise(r => setTimeout(r, 1000))
    await supabase.from('profiles').upsert([{
      id: (await supabase.auth.getUser()).data.user?.id, store_name: data.storeName.toLowerCase(), display_name: data.storeName, company_name: data.companyName, location: data.location, coverage_areas: data.coverage, product_type: data.productType, vehicle: data.vehicle, name: data.name, phone: formattedPhone, role: 'distributor', is_approved: false
    }])
    UI.loading(false)
    alert('Registration submitted for review!')
    return true
  },
  
  async loadUser(profile) {
    AppState.user = profile
    AppState.role = profile.role
    AppState.storeId = profile.id
    if (profile.role === 'admin') {
      UI.showScreen('dashboardAdmin')
      await Admin.loadData()
    } else if (profile.role === 'distributor') {
      UI.showScreen('dashboardDistributor')
      document.getElementById('distributorStoreDisplay').textContent = `Store: ${profile.display_name || profile.store_name}`
      if (!profile.is_approved) {
        document.getElementById('distributorProducts').innerHTML = `<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center"><i class="fas fa-clock text-4xl text-yellow-600 mb-3"></i><p class="text-yellow-800">${t('pendingApproval')}</p><p class="text-sm text-gray-500 mt-2">Contact: ${profile.phone || 'No phone'}</p></div>`
      } else {
        await Distributor.loadProducts()
        await Distributor.loadOrders()
        await Distributor.loadAlerts()
      }
    } else {
      UI.showScreen('dashboardRetailer')
      document.getElementById('retailerStoreDisplay').textContent = `Store: ${profile.display_name || profile.store_name}`
      await Retailer.loadProducts()
      await Retailer.loadOrders()
    }
  },
  
  async logout() {
    await supabase.auth.signOut()
    AppState.user = null; AppState.role = null; AppState.storeId = null; AppState.cart = []
    UI.showScreen('screenLogin')
  }
}

// ============================================
// RETAILER SERVICE
// ============================================
const Retailer = {
  async loadProducts() {
    const { data: products } = await supabase.from('products').select('*, profiles(store_name, display_name, phone)').eq('is_available', true).gt('stock_quantity', 0)
    const container = document.getElementById('retailerProducts')
    if (!products?.length) { container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noProducts')}</div>`; return }
    const categories = [...new Set(products.map(p => p.category).filter(c => c))]
    const filter = document.getElementById('categoryFilter')
    if (filter) filter.innerHTML = '<option value="all">All Categories</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('')
    container.innerHTML = products.map(p => `
      <div class="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition" data-category="${p.category || ''}">
        <h4 class="font-bold text-gray-800">${p.product_name}</h4>
        ${p.product_name_sw ? `<p class="text-sm text-gray-500">${p.product_name_sw}</p>` : ''}
        <p class="text-primary-600 font-bold text-xl mt-2">${formatMoney(p.price)} TZS</p>
        <p class="text-sm text-gray-500">${t('stock')}: ${p.stock_quantity}</p>
        <p class="text-xs text-gray-400">by ${p.profiles?.display_name || p.profiles?.store_name}</p>
        <div class="flex gap-2 mt-3">
          <input type="number" id="qty_${p.id}" value="1" min="1" max="${p.stock_quantity}" class="w-20 px-2 py-2 border rounded-lg text-center">
          <button onclick="Retailer.addToCart('${p.id}', '${p.product_name}', ${p.price}, ${p.stock_quantity}, '${p.distributor_id}')" class="flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">${t('addToCart')}</button>
        </div>
      </div>
    `).join('')
    const search = document.getElementById('searchProducts')
    if (search) search.oninput = () => this.filterProducts(products)
    if (filter) filter.onchange = () => this.filterProducts(products)
  },
  
  filterProducts(products) {
    const search = document.getElementById('searchProducts')?.value.toLowerCase() || ''
    const category = document.getElementById('categoryFilter')?.value || 'all'
    const cards = document.querySelectorAll('#retailerProducts .bg-white')
    cards.forEach((card, i) => {
      const p = products[i]
      if (!p) return
      const match = p.product_name.toLowerCase().includes(search) || (p.product_name_sw || '').toLowerCase().includes(search)
      const matchCat = category === 'all' || p.category === category
      card.style.display = match && matchCat ? 'block' : 'none'
    })
  },
  
  addToCart(id, name, price, maxStock, distributorId) {
    const qty = parseInt(document.getElementById(`qty_${id}`).value)
    const existing = AppState.cart.find(i => i.product_id === id)
    if (existing) existing.quantity += qty
    else AppState.cart.push({ product_id: id, name, price, quantity: qty, distributor_id: distributorId })
    this.updateCartCount()
    alert(`Added ${qty} x ${name}`)
  },
  
  updateCartCount() {
    const count = AppState.cart.reduce((s, i) => s + i.quantity, 0)
    const el = document.getElementById('cartCount')
    if (el) el.textContent = count
    this.renderCart()
  },
  
  renderCart() {
    const container = document.getElementById('cartItems')
    if (!AppState.cart.length) {
      container.innerHTML = `<div class="text-gray-500 text-center py-4">${t('emptyCart')}</div>`
      document.getElementById('cartTotal').textContent = '0'
      return
    }
    let total = 0
    container.innerHTML = AppState.cart.map(item => {
      const itemTotal = item.price * item.quantity
      total += itemTotal
      return `<div class="flex justify-between items-center border-b pb-2"><div><p class="font-medium">${item.name}</p><p class="text-sm text-gray-500">${item.quantity} x ${formatMoney(item.price)} TZS</p></div><div class="flex items-center gap-3"><span class="font-bold">${formatMoney(itemTotal)} TZS</span><button onclick="Retailer.removeFromCart('${item.product_id}')" class="text-red-500">Remove</button></div></div>`
    }).join('')
    document.getElementById('cartTotal').textContent = formatMoney(total)
  },
  
  removeFromCart(productId) {
    AppState.cart = AppState.cart.filter(i => i.product_id !== productId)
    this.updateCartCount()
  },
  
  async placeOrder() {
    if (!AppState.cart.length) { alert(t('emptyCart')); return }
    const address = document.getElementById('deliveryAddress').value
    if (!address) { alert('Enter delivery address'); return }
    const deliveryTime = document.getElementById('deliveryTime').value
    const timeLabel = document.getElementById('deliveryTime').options[document.getElementById('deliveryTime').selectedIndex]?.text
    UI.loading(true, 'Placing order...')
    const total = AppState.cart.reduce((s, i) => s + (i.price * i.quantity), 0)
    const orderNumber = 'ORD-' + Date.now()
    const { data: order, error } = await supabase.from('orders').insert([{
      retailer_id: AppState.storeId, distributor_id: AppState.cart[0]?.distributor_id, order_number: orderNumber,
      total_amount: total, delivery_address: address, delivery_time: deliveryTime, delivery_time_label: timeLabel, status: 'pending'
    }]).select().single()
    if (error) { UI.loading(false); alert(error.message); return }
    await supabase.from('order_items').insert(AppState.cart.map(item => ({
      order_id: order.id, product_id: item.product_id, quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity
    })))
    for (const item of AppState.cart) {
      const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single()
      if (p) await supabase.from('products').update({ stock_quantity: p.stock_quantity - item.quantity }).eq('id', item.product_id)
    }
    AppState.cart = []
    this.updateCartCount()
    await this.loadProducts()
    await this.loadOrders()
    UI.loading(false)
    closeModal('cartModal')
    alert(`${t('orderPlaced')} ${orderNumber}`)
  },
  
  async loadOrders() {
    const { data: orders } = await supabase.from('orders').select('*, order_items(*)').eq('retailer_id', AppState.storeId).order('created_at', { ascending: false })
    const container = document.getElementById('retailerOrders')
    if (!orders?.length) { container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noOrders')}</div>`; return }
    container.innerHTML = orders.map(o => `
      <div class="bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:shadow-md transition" onclick='window.showOrderDetails(${JSON.stringify(o).replace(/'/g, "\\'")})'>
        <div class="flex justify-between items-start"><div><p class="font-bold">${t('orderNumber')}${o.order_number}</p><p class="text-sm text-gray-500">${new Date(o.created_at).toLocaleDateString()}</p><p class="text-sm">${formatMoney(o.total_amount)} TZS</p></div><span class="px-2 py-1 rounded-full text-xs ${getStatusColor(o.status)}">${o.status}</span></div>
      </div>
    `).join('')
  }
}

// ============================================
// DISTRIBUTOR SERVICE
// ============================================
const Distributor = {
  async loadProducts() {
    const { data: products } = await supabase.from('products').select('*').eq('distributor_id', AppState.storeId).order('created_at', { ascending: false })
    const container = document.getElementById('distributorProducts')
    if (!products?.length) { container.innerHTML = '<div class="text-gray-500 text-center py-8">No products yet. Add your first product!</div>'; return }
    container.innerHTML = products.map(p => `
      <div class="bg-white rounded-xl shadow-sm border p-4">
        <h4 class="font-bold">${p.product_name}</h4>${p.product_name_sw ? `<p class="text-sm text-gray-500">${p.product_name_sw}</p>` : ''}
        <p class="text-secondary-600 font-bold text-xl mt-2">${formatMoney(p.price)} TZS</p><p class="text-sm text-gray-500">Stock: ${p.stock_quantity}</p>
        <div class="flex gap-2 mt-3"><button onclick="Distributor.updateStock('${p.id}')" class="flex-1 px-3 py-2 bg-secondary-500 text-white text-sm rounded-lg">Update Stock</button><button onclick="Distributor.deleteProduct('${p.id}')" class="px-3 py-2 bg-red-500 text-white text-sm rounded-lg">Delete</button></div>
      </div>
    `).join('')
  },
  
  async addProduct() {
    const name = document.getElementById('productName')?.value, price = parseFloat(document.getElementById('productPrice')?.value)
    if (!name || !price) { alert('Product name and price required'); return }
    UI.loading(true, 'Adding product...')
    await supabase.from('products').insert([{ distributor_id: AppState.storeId, product_name: name, product_name_sw: document.getElementById('productNameSw')?.value, price, stock_quantity: parseInt(document.getElementById('productStock')?.value) || 0, category: document.getElementById('productCategory')?.value || 'General', is_available: true }])
    UI.loading(false)
    alert('Product added!')
    ;['productName', 'productNameSw', 'productPrice', 'productStock', 'productCategory'].forEach(id => { const el = document.getElementById(id); if (el) el.value = '' })
    await this.loadProducts()
    await this.loadAlerts()
  },
  
  async updateStock(id) { const newStock = prompt('Enter new stock quantity:'); if (newStock !== null) { await supabase.from('products').update({ stock_quantity: parseInt(newStock) }).eq('id', id); await this.loadProducts(); await this.loadAlerts() } },
  async deleteProduct(id) { if (confirm('Delete this product?')) { await supabase.from('products').delete().eq('id', id); await this.loadProducts() } },
  
  async loadOrders() {
    const { data: orders } = await supabase.from('orders').select('*, order_items(*), retailers:retailer_id(display_name, store_name, phone)').eq('distributor_id', AppState.storeId).order('created_at', { ascending: false })
    const container = document.getElementById('distributorOrders')
    if (!orders?.length) { container.innerHTML = `<div class="text-gray-500 text-center py-8">${t('noOrders')}</div>`; return }
    container.innerHTML = orders.map(o => `
      <div class="bg-white rounded-xl shadow-sm border p-4">
        <div class="flex justify-between"><p class="font-bold">${t('orderNumber')}${o.order_number}</p><span class="px-2 py-1 rounded-full text-xs ${getStatusColor(o.status)}">${o.status}</span></div>
        <p class="text-sm text-gray-500">Customer: ${o.retailers?.display_name || o.retailers?.store_name}</p><p class="text-sm text-gray-500">Contact: ${o.retailers?.phone || 'N/A'}</p><p class="text-sm">${formatMoney(o.total_amount)} TZS</p>
        <div class="flex gap-2 mt-3"><button onclick="Distributor.updateOrderStatus('${o.id}', 'confirmed')" class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg">Confirm</button><button onclick="Distributor.updateOrderStatus('${o.id}', 'shipped')" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">Ship</button><button onclick="Distributor.updateOrderStatus('${o.id}', 'delivered')" class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg">Deliver</button></div>
      </div>
    `).join('')
  },
  
  async updateOrderStatus(id, status) { await supabase.from('orders').update({ status }).eq('id', id); await this.loadOrders(); alert(`Order ${status}`) },
  
  async loadAlerts() {
    const { data: products } = await supabase.from('products').select('*').eq('distributor_id', AppState.storeId).lt('stock_quantity', 10)
    const container = document.getElementById('stockAlerts')
    if (!products?.length) { container.innerHTML = '<div class="text-green-600 text-center py-8">✅ No low stock alerts</div>'; return }
    container.innerHTML = products.map(p => `<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4"><div class="flex justify-between"><div><p class="font-bold text-yellow-800">⚠️ Low Stock Alert</p><p class="text-yellow-700">${p.product_name}: Only ${p.stock_quantity} left</p></div><button onclick="Distributor.updateStock('${p.id}')" class="px-4 py-2 bg-yellow-600 text-white rounded-lg">Restock</button></div></div>`).join('')
  }
}

// ============================================
// ADMIN SERVICE
// ============================================
const Admin = {
  async loadData() {
    const { data: pending } = await supabase.from('profiles').select('*').eq('role', 'distributor').eq('is_approved', false)
    const pendingContainer = document.getElementById('pendingDistributors')
    if (!pending?.length) pendingContainer.innerHTML = '<div class="text-gray-500 text-center py-4">✅ No pending approvals</div>'
    else pendingContainer.innerHTML = pending.map(d => `
      <div class="border rounded-xl p-4 flex justify-between items-center"><div><p class="font-bold">${d.company_name || d.display_name}</p><p class="text-sm">Store: ${d.display_name}</p><p class="text-sm">Contact: ${d.phone || 'No phone'}</p><p class="text-sm">Location: ${d.location}</p><p class="text-sm">Coverage: ${d.coverage_areas}</p><p class="text-sm">Vehicle: ${d.vehicle || 'Not specified'}</p></div><div class="flex gap-2"><button onclick="Admin.approve('${d.id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg">Approve</button><button onclick="Admin.reject('${d.id}')" class="px-4 py-2 bg-red-600 text-white rounded-lg">Reject</button></div></div>
    `).join('')
    const { data: orders } = await supabase.from('orders').select('*, retailers:retailer_id(display_name), distributors:distributor_id(display_name)').order('created_at', { ascending: false }).limit(50)
    const ordersContainer = document.getElementById('adminOrders')
    if (!orders?.length) ordersContainer.innerHTML = '<div class="text-gray-500 text-center py-4">📭 No orders yet</div>'
    else ordersContainer.innerHTML = orders.map(o => `
      <div class="border rounded-xl p-4"><div class="flex justify-between"><p class="font-bold">${t('orderNumber')}${o.order_number}</p><span class="px-2 py-1 rounded-full text-xs ${getStatusColor(o.status)}">${o.status}</span></div><p class="text-sm">Retailer: ${o.retailers?.display_name || 'Unknown'}</p><p class="text-sm">Distributor: ${o.distributors?.display_name || 'Unknown'}</p><p class="text-sm">Total: ${formatMoney(o.total_amount)} TZS</p><p class="text-xs text-gray-400">${new Date(o.created_at).toLocaleString()}</p></div>
    `).join('')
  },
  
  async approve(id) { await supabase.from('profiles').update({ is_approved: true }).eq('id', id); await this.loadData(); alert('Approved!') },
  async reject(id) { await supabase.from('profiles').delete().eq('id', id); await this.loadData(); alert('Rejected') }
}

// ============================================
// GLOBAL EXPORTS & EVENT BINDINGS
// ============================================
window.app = { selectLanguage: (lang) => { AppState.language = lang; UI.showScreen('screenRole'); UI.updateText() } }
window.Retailer = Retailer
window.Distributor = Distributor
window.Admin = Admin
window.showOrderDetails = (order) => {
  const modal = document.getElementById('orderStatusModal')
  const content = document.getElementById('orderStatusContent')
  content.innerHTML = `<div class="space-y-3"><p class="font-bold">${t('orderNumber')}${order.order_number}</p><p>${t('status')}: <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}">${order.status}</span></p><p>${t('totalAmount')}: ${formatMoney(order.total_amount)} TZS</p><p>Delivery: ${order.delivery_address}</p><p>Time: ${order.delivery_time_label || order.delivery_time}</p><p class="text-xs text-gray-400">${new Date(order.created_at).toLocaleString()}</p></div>`
  modal.classList.remove('hidden')
}

// DOM Event Listeners
document.getElementById('selectRetailer')?.addEventListener('click', () => UI.showScreen('screenRetailerSignup'))
document.getElementById('selectDistributor')?.addEventListener('click', () => UI.showScreen('screenDistributorSignup'))
document.getElementById('goToSignup')?.addEventListener('click', () => UI.showScreen('screenRole'))
document.getElementById('retailerBackToLogin')?.addEventListener('click', () => UI.showScreen('screenLogin'))
document.getElementById('distributorBackToLogin')?.addEventListener('click', () => UI.showScreen('screenLogin'))
document.getElementById('loginBtn')?.addEventListener('click', async () => {
  const username = document.getElementById('loginUsername').value.trim()
  const password = document.getElementById('loginPassword').value
  if (!username || !password) { alert('Enter store name and password'); return }
  await Auth.login(username, password)
})
document.getElementById('retailerSignupBtn')?.addEventListener('click', async () => {
  const storeName = document.getElementById('retailerStoreName').value.trim()
  const location = document.getElementById('retailerLocation').value.trim()
  const name = document.getElementById('retailerName').value.trim()
  const phone = document.getElementById('retailerPhone').value.trim()
  const password = document.getElementById('retailerPassword').value
  if (!storeName || !location || !name || !phone || !password) { alert('Please fill all fields'); return }
  await Auth.signUpRetailer({ storeName, location, name, phone, password })
})
document.getElementById('distributorSignupBtn')?.addEventListener('click', async () => {
  const companyName = document.getElementById('distributorCompanyName').value.trim()
  const storeName = document.getElementById('distributorStoreName').value.trim()
  const name = document.getElementById('distributorName').value.trim()
  const productType = document.getElementById('distributorProductType').value.trim()
  const location = document.getElementById('distributorLocation').value.trim()
  const coverage = document.getElementById('distributorCoverage').value.trim()
  const vehicle = document.getElementById('distributorVehicle').value.trim()
  const phone = document.getElementById('distributorPhone').value.trim()
  const password = document.getElementById('distributorPassword').value
  if (!companyName || !storeName || !name || !productType || !location || !coverage || !phone || !password) { alert('Please fill all required fields'); return }
  await Auth.signUpDistributor({ companyName, storeName, name, productType, location, coverage, vehicle, phone, password })
})
document.getElementById('addProductBtn')?.addEventListener('click', () => Distributor.addProduct())
document.getElementById('checkoutBtn')?.addEventListener('click', () => Retailer.placeOrder())
document.getElementById('showCartBtn')?.addEventListener('click', () => { Retailer.renderCart(); document.getElementById('cartModal')?.classList.remove('hidden') })
document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout())
document.getElementById('logoutBtn2')?.addEventListener('click', () => Auth.logout())
document.getElementById('adminLogoutBtn')?.addEventListener('click', () => Auth.logout())

// Tab Navigation
document.querySelectorAll('.retailerTabBtn').forEach(btn => btn.addEventListener('click', () => {
  const tab = btn.dataset.tab
  document.querySelectorAll('.retailerTabBtn').forEach(b => b.classList.remove('border-primary-500', 'text-primary-500'))
  btn.classList.add('border-primary-500', 'text-primary-500')
  document.querySelectorAll('.retailerTabContent').forEach(c => c.classList.add('hidden'))
  document.getElementById(tab)?.classList.remove('hidden')
}))
document.querySelectorAll('.distributorTabBtn').forEach(btn => btn.addEventListener('click', () => {
  const tab = btn.dataset.tab
  document.querySelectorAll('.distributorTabBtn').forEach(b => b.classList.remove('border-secondary-500', 'text-secondary-500'))
  btn.classList.add('border-secondary-500', 'text-secondary-500')
  document.querySelectorAll('.distributorTabContent').forEach(c => c.classList.add('hidden'))
  document.getElementById(tab)?.classList.remove('hidden')
}))
if (document.querySelector('.retailerTabBtn')) document.querySelector('.retailerTabBtn').classList.add('border-primary-500', 'text-primary-500')
if (document.querySelector('.distributorTabBtn')) document.querySelector('.distributorTabBtn').classList.add('border-secondary-500', 'text-secondary-500')

// Session Check
;(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    if (profile) await Auth.loadUser(profile)
    else UI.showScreen('screenLanguage')
  } else {
    UI.showScreen('screenLanguage')
  }
})()
