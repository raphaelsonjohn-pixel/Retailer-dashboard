// app.js - FIXED PERSISTENT LOGIN
import { supabase } from './supabase.js'

// ============================================
// CONSTANTS
// ============================================
const APP_URL = window.location.origin

// ============================================
// STATE
// ============================================
let currentLanguage = null
let currentUser = null
let currentRole = null
let currentRetailerId = null
let currentDistributorId = null
let cart = []

// ============================================
// CHECK SESSION FIRST - BEFORE ANYTHING ELSE
// ============================================
async function checkSessionAndRedirect() {
  console.log('🔍 Checking for existing session...')
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    console.log('✅ Session found! User:', session.user.email)
    // User is already logged in - load dashboard directly
    await loadUserData(session.user)
    return true
  } else {
    console.log('❌ No session found')
    return false
  }
}

// ============================================
// HANDLE MAGIC LINK REDIRECT
// ============================================
async function handleMagicLinkRedirect() {
  const hash = window.location.hash
  console.log('🔍 Checking URL hash:', hash)
  
  if (hash && hash.includes('access_token')) {
    console.log('🎯 Magic link detected! Processing...')
    
    // Show loading
    showLoading(true, 'Completing login...')
    
    // Clear the hash from URL
    window.history.replaceState({}, document.title, window.location.pathname)
    
    // Wait for Supabase to process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Get the session
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      showLoading(false)
      return false
    }
    
    if (data?.session) {
      console.log('✅ Session found! Loading dashboard...')
      await loadUserData(data.session.user)
      showLoading(false)
      return true
    } else {
      console.log('❌ No session found after magic link')
      showLoading(false)
      return false
    }
  }
  return false
}

// ============================================
// LOAD USER DATA & DASHBOARD
// ============================================
async function loadUserData(user) {
  currentUser = user
  console.log('📱 Loading user data for:', user.email)
  
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
        role: metadata.role || 'retailer',
        name: metadata.name || user.email.split('@')[0],
        phone: metadata.phone || '',
        location: metadata.location || ''
      }])
      .select()
      .single()
    profile = newProfile
  }
  
  currentRole = profile.role
  
  // Hide ALL screens first
  document.getElementById('languageScreen')?.classList.add('hidden')
  document.getElementById('loginSection')?.classList.add('hidden')
  document.getElementById('distributorDashboard')?.classList.add('hidden')
  document.getElementById('retailerDashboard')?.classList.add('hidden')
  document.getElementById('adminDashboard')?.classList.add('hidden')
  
  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single()
  
  // Show appropriate dashboard
  if (adminCheck) {
    console.log('👑 Showing Admin Dashboard')
    await showAdminDashboard()
  } else if (currentRole === 'distributor') {
    console.log('📦 Showing Distributor Dashboard')
    await showDistributorDashboard()
  } else {
    console.log('🏪 Showing Retailer Dashboard')
    await showRetailerDashboard()
  }
  
  showLoading(false)
}

// ============================================
// SHOW LOGIN SCREEN (ONLY WHEN NOT LOGGED IN)
// ============================================
function showLoginScreen() {
  console.log('📱 Showing login screen')
  
  document.getElementById('languageScreen')?.classList.remove('hidden')
  document.getElementById('loginSection')?.classList.add('hidden')
  document.getElementById('distributorDashboard')?.classList.add('hidden')
  document.getElementById('retailerDashboard')?.classList.add('hidden')
  document.getElementById('adminDashboard')?.classList.add('hidden')
}

// ============================================
// LANGUAGE SELECTION
// ============================================
window.selectLanguage = function(lang) {
  currentLanguage = lang
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

// ============================================
// SEND MAGIC LINK
// ============================================
const sendOtpBtn = document.getElementById('sendOtpBtn')
if (sendOtpBtn) {
  sendOtpBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim()
    if (!email) {
      alert('Please enter your email address')
      return
    }
    
    const name = document.getElementById('name').value.trim()
    const phone = document.getElementById('phone').value.trim()
    const location = document.getElementById('location').value.trim()
    
    showLoading(true, 'Sending login link...')
    
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: APP_URL,
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
      console.error('Send link error:', error)
      alert('Error: ' + error.message)
    } else {
      alert(`✓ Login link sent to ${email}!\n\nCheck your inbox (and spam folder).`)
    }
  })
}

// ============================================
// ROLE SELECTION
// ============================================
let selectedRole = 'retailer'

const roleRetailerBtn = document.getElementById('roleRetailerBtn')
const roleDistributorBtn = document.getElementById('roleDistributorBtn')

if (roleRetailerBtn) {
  roleRetailerBtn.addEventListener('click', () => {
    selectedRole = 'retailer'
    roleRetailerBtn.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    roleDistributorBtn.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

if (roleDistributorBtn) {
  roleDistributorBtn.addEventListener('click', () => {
    selectedRole = 'distributor'
    roleDistributorBtn.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    roleRetailerBtn.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

// ============================================
// AUTH STATE LISTENER
// ============================================
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🔄 Auth event:', event)
  
  if (event === 'SIGNED_IN' && session) {
    console.log('✅ User signed in:', session.user.email)
    await loadUserData(session.user)
  } else if (event === 'SIGNED_OUT') {
    console.log('❌ User signed out')
    showLoginScreen()
  }
})

// ============================================
// INITIALIZE APP
// ============================================
async function init() {
  console.log('🚀 Initializing BomaWave Platform...')
  
  // First, handle magic link redirect
  const handled = await handleMagicLinkRedirect()
  
  // If no magic link was processed, check for existing session
  if (!handled) {
    const hasSession = await checkSessionAndRedirect()
    if (!hasSession) {
      showLoginScreen()
    }
  }
}

// Start the app
init()

// ============================================
// TRANSLATIONS (Fupi kwa ajili ya space)
// ============================================
const I18N = {
  en: {
    loading: 'Loading...',
    loginTitle: 'BomaWave',
    loginSubtitle: 'Sign in to continue',
    sendLink: 'Send Login Link',
    pendingApproval: 'Your account is pending admin approval.',
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
    products: 'Products',
    orders: 'Orders',
    myOrders: 'My Orders',
    cart: 'Cart',
    logout: 'Logout'
  },
  sw: {
    loading: 'Inapakia...',
    loginTitle: 'BomaWave',
    loginSubtitle: 'Ingia kuendelea',
    sendLink: 'Tuma Kiungo cha Kuingia',
    pendingApproval: 'Akaunti yako inasubiri idhini.',
    noProducts: 'Hakuna bidhaa.',
    noOrders: 'Hakuna maagizo.',
    emptyCart: 'Rukwama yako ni tupu.',
    orderPlaced: 'Agizo limewekwa!',
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
    products: 'Bidhaa',
    orders: 'Maagizo',
    myOrders: 'Maagizo Yangu',
    cart: 'Rukwama',
    logout: 'Toka'
  }
}

function t(key) {
  return I18N[currentLanguage]?.[key] || I18N.en[key] || key
}

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
// DASHBOARD FUNCTIONS (Simplified for now)
// ============================================

async function showAdminDashboard() {
  document.getElementById('adminDashboard')?.classList.remove('hidden')
  const emailSpan = document.getElementById('adminEmail')
  if (emailSpan && currentUser) emailSpan.textContent = currentUser.email
}

async function showDistributorDashboard() {
  document.getElementById('distributorDashboard')?.classList.remove('hidden')
  const emailSpan = document.getElementById('distributorEmail')
  if (emailSpan && currentUser) emailSpan.textContent = currentUser.email
}

async function showRetailerDashboard() {
  document.getElementById('retailerDashboard')?.classList.remove('hidden')
  const emailSpan = document.getElementById('retailerEmail')
  if (emailSpan && currentUser) emailSpan.textContent = currentUser.email
}

// Logout handlers
document.getElementById('logoutBtn')?.addEventListener('click', () => supabase.auth.signOut())
document.getElementById('logoutBtn2')?.addEventListener('click', () => supabase.auth.signOut())
document.getElementById('adminLogoutBtn')?.addEventListener('click', () => supabase.auth.signOut())
