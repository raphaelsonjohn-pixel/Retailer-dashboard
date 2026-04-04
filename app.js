// app.js - Phone OTP Version (WhatsApp)
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
let currentStep = 'phone' // 'phone' or 'otp'

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  en: {
    welcome: 'Welcome',
    enterPhone: 'Enter your phone number',
    sendOTP: 'Send Verification Code',
    verifyOTP: 'Verify Code',
    enterCode: 'Enter 6-digit code',
    resendCode: 'Resend code',
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
    logout: 'Logout',
    name: 'Full Name',
    location: 'Location',
    phone: 'Phone Number',
    storeName: 'Store Name',
    companyName: 'Company Name',
    role: 'I am a:',
    retailer: 'Retailer',
    distributor: 'Distributor',
    signup: 'Sign Up'
  },
  sw: {
    welcome: 'Karibu',
    enterPhone: 'Weka namba yako ya simu',
    sendOTP: 'Tuma Msimbo wa Kuthibitisha',
    verifyOTP: 'Thibitisha Msimbo',
    enterCode: 'Weka msimbo wa tarakimu 6',
    resendCode: 'Tuma tena msimbo',
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
    logout: 'Toka',
    name: 'Jina Kamili',
    location: 'Eneo',
    phone: 'Namba ya Simu',
    storeName: 'Jina la Duka',
    companyName: 'Jina la Kampuni',
    role: 'Mimi ni:',
    retailer: 'Muuzaji',
    distributor: 'Msambazaji',
    signup: 'Jiunge'
  }
}

function t(key) { return translations[currentLanguage]?.[key] || translations.en[key] || key }

// ============================================
// UI ELEMENTS
// ============================================
let selectedRole = 'retailer'
let currentPhone = ''

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Send OTP to phone via WhatsApp
async function sendOTP(phoneNumber) {
  showLoading(true, 'Sending verification code...')
  
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber,
  })
  
  showLoading(false)
  
  if (error) {
    console.error('Send OTP error:', error)
    alert('Error: ' + error.message)
    return false
  }
  
  alert(`Verification code sent to ${phoneNumber} via WhatsApp!`)
  return true
}

// Verify OTP and login
async function verifyOTP(phoneNumber, otpCode) {
  showLoading(true, 'Verifying...')
  
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: otpCode,
    type: 'sms',
  })
  
  showLoading(false)
  
  if (error) {
    console.error('Verify OTP error:', error)
    alert('Error: ' + error.message)
    return null
  }
  
  return data.session
}

// ============================================
// SESSION CHECK
// ============================================
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    console.log('Session found:', session.user)
    await loadUserData(session.user)
    return true
  }
  return false
}

// ============================================
// LOAD USER DATA
// ============================================
async function loadUserData(user) {
  currentUser = user
  showLoading(true, 'Loading dashboard...')
  
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
        email: user.email || `${user.phone}@temp.com`,
        role: metadata.role || selectedRole,
        name: metadata.name || 'User',
        phone: user.phone,
        location: metadata.location || ''
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
  
  // Hide login screens
  document.getElementById('languageScreen')?.classList.add('hidden')
  document.getElementById('loginSection')?.classList.add('hidden')
  document.getElementById('phoneLoginSection')?.classList.add('hidden')
  
  if (adminCheck) {
    await showAdminDashboard()
  } else if (currentRole === 'distributor') {
    await showDistributorDashboard()
  } else {
    await showRetailerDashboard()
  }
  
  showLoading(false)
}

// ============================================
// LOGIN SCREEN WITH PHONE
// ============================================
function showPhoneLogin() {
  document.getElementById('languageScreen')?.classList.add('hidden')
  document.getElementById('loginSection')?.classList.add('hidden')
  document.getElementById('phoneLoginSection')?.classList.remove('hidden')
  document.getElementById('distributorDashboard')?.classList.add('hidden')
  document.getElementById('retailerDashboard')?.classList.add('hidden')
  document.getElementById('adminDashboard')?.classList.add('hidden')
  
  currentStep = 'phone'
  document.getElementById('phoneStep').classList.remove('hidden')
  document.getElementById('otpStep').classList.add('hidden')
}

// Send OTP button handler
document.getElementById('sendOtpPhoneBtn')?.addEventListener('click', async () => {
  const phone = document.getElementById('phoneNumber').value.trim()
  if (!phone) {
    alert('Enter your phone number')
    return
  }
  
  // Format phone number to E.164 format
  let formattedPhone = phone
  if (!phone.startsWith('+')) {
    formattedPhone = '+255' + phone.replace(/^0+/, '')
  }
  
  currentPhone = formattedPhone
  const success = await sendOTP(formattedPhone)
  
  if (success) {
    currentStep = 'otp'
    document.getElementById('phoneStep').classList.add('hidden')
    document.getElementById('otpStep').classList.remove('hidden')
  }
})

// Verify OTP button handler
document.getElementById('verifyOtpBtn')?.addEventListener('click', async () => {
  const otp = document.getElementById('otpCode').value.trim()
  if (!otp || otp.length !== 6) {
    alert('Enter 6-digit verification code')
    return
  }
  
  const session = await verifyOTP(currentPhone, otp)
  if (session) {
    await loadUserData(session.user)
  }
})

// ============================================
// LANGUAGE SELECTION
// ============================================
window.selectLanguage = function(lang) {
  currentLanguage = lang
  document.getElementById('languageScreen').classList.add('hidden')
  showPhoneLogin()
  updateUIText()
}

function updateUIText() {
  const elements = ['phoneTitle', 'phoneSubtitle', 'sendOtpPhoneBtn', 'otpTitle', 'verifyOtpBtn']
  elements.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.textContent = t(id === 'sendOtpPhoneBtn' ? 'sendOTP' : id === 'verifyOtpBtn' ? 'verifyOTP' : id)
  })
}

// ============================================
// DASHBOARD FUNCTIONS (Keep your existing dashboard code)
// ============================================
async function showAdminDashboard() {
  document.getElementById('adminDashboard')?.classList.remove('hidden')
  document.getElementById('adminEmail').textContent = currentUser?.phone || 'Admin'
  await loadPendingDistributors()
  await loadAdminOrders()
}

async function showDistributorDashboard() {
  document.getElementById('distributorDashboard')?.classList.remove('hidden')
  document.getElementById('distributorEmail').textContent = currentUser?.phone || 'Distributor'
  await loadDistributorData()
}

async function showRetailerDashboard() {
  document.getElementById('retailerDashboard')?.classList.remove('hidden')
  document.getElementById('retailerEmail').textContent = currentUser?.phone || 'Retailer'
  await loadRetailerData()
}

// Add these functions to your existing code (keep your existing implementations)
async function loadPendingDistributors() { /* keep existing */ }
async function loadAdminOrders() { /* keep existing */ }
async function loadDistributorData() { /* keep existing */ }
async function loadDistributorProducts() { /* keep existing */ }
async function loadDistributorOrders() { /* keep existing */ }
async function loadStockAlerts() { /* keep existing */ }
async function loadRetailerData() { /* keep existing */ }
async function loadAvailableProducts() { /* keep existing */ }
async function loadCart() { /* keep existing */ }
async function loadRetailerOrders() { /* keep existing */ }

function showLoading(show, msg) { /* keep existing */ }
function formatMoney(amount) { /* keep existing */ }

// Logout
async function logout() {
  await supabase.auth.signOut()
  location.reload()
}

document.getElementById('logoutBtn')?.addEventListener('click', logout)
document.getElementById('logoutBtn2')?.addEventListener('click', logout)
document.getElementById('adminLogoutBtn')?.addEventListener('click', logout)

// ============================================
// INITIALIZE
// ============================================
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    await loadUserData(session.user)
  } else if (event === 'SIGNED_OUT') {
    showPhoneLogin()
  }
})

async function init() {
  const hasSession = await checkSession()
  if (!hasSession) {
    document.getElementById('languageScreen')?.classList.remove('hidden')
  }
}

init()
