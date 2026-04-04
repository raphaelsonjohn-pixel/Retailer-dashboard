// app.js - Africa's Talking SMS OTP Version
import { supabase } from './supabase.js'

// ============================================
// CONSTANTS
// ============================================
const EDGE_FUNCTION_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/send-sms-africastalking'

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
let selectedRole = 'retailer'
let currentPhone = ''
let pendingOTP = null

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

// ============================================
// AUTHENTICATION FUNCTIONS (Using Africa's Talking)
// ============================================

// Send OTP via Africa's Talking Edge Function
async function sendOTP(phoneNumber) {
  showLoading(true, 'Sending verification code...')
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (await supabase.auth.getSession()).data.session?.access_token || ''
      },
      body: JSON.stringify({ phone: phoneNumber })
    })
    
    const result = await response.json()
    showLoading(false)
    
    if (result.success) {
      // Save OTP for verification
      pendingOTP = result.otp
      currentPhone = phoneNumber
      alert(`Verification code sent to ${phoneNumber}!`)
      return true
    } else {
      alert('Error: ' + (result.error || 'Failed to send verification code'))
      return false
    }
  } catch (error) {
    showLoading(false)
    console.error('Send OTP error:', error)
    alert('Error: Could not send verification code. Please try again.')
    return false
  }
}

// Verify OTP (local verification since we're not using Supabase Auth for OTP)
function verifyOTP(enteredCode) {
  if (enteredCode === pendingOTP) {
    return true
  } else {
    alert('Invalid verification code. Please try again.')
    return false
  }
}

// Create or sign in user after OTP verification
async function createOrSignInUser(phoneNumber, name, location, role) {
  showLoading(true, 'Setting up your account...')
  
  try {
    // Check if user already exists in profiles
    let { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phoneNumber)
      .single()
    
    if (existingProfile) {
      // User exists - create session manually
      currentUser = existingProfile
      currentRole = existingProfile.role
      await loadUserData(existingProfile)
      showLoading(false)
      return true
    }
    
    // Create new user in auth with email as phone@temp.com
    const tempEmail = `${phoneNumber.replace(/[^0-9]/g, '')}@bomawave.temp`
    const tempPassword = Math.random().toString(36).slice(-12)
    
    const { data: authUser, error: signUpError } = await supabase.auth.signUp({
      email: tempEmail,
      password: tempPassword,
      options: {
        data: {
          name: name,
          role: role,
          phone: phoneNumber,
          location: location
        }
      }
    })
    
    if (signUpError) {
      console.error('Sign up error:', signUpError)
      showLoading(false)
      alert('Error creating account: ' + signUpError.message)
      return false
    }
    
    if (authUser?.user) {
      // Profile will be created by database trigger
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.user.id)
        .single()
      
      if (newProfile) {
        currentUser = newProfile
        currentRole = newProfile.role
        await loadUserData(newProfile)
      }
    }
    
    showLoading(false)
    return true
    
  } catch (error) {
    showLoading(false)
    console.error('Create user error:', error)
    alert('Error creating account. Please try again.')
    return false
  }
}

// ============================================
// SESSION CHECK
// ============================================
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    console.log('Session found:', session.user)
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profile) {
      currentUser = profile
      currentRole = profile.role
      await loadUserData(profile)
      return true
    }
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
    profile = user
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
  pendingOTP = null
  currentPhone = ''
  document.getElementById('phoneStep').classList.remove('hidden')
  document.getElementById('otpStep').classList.add('hidden')
  document.getElementById('otpCode').value = ''
  document.getElementById('phoneNumber').value = ''
}

// Send OTP button handler
document.getElementById('sendOtpPhoneBtn')?.addEventListener('click', async () => {
  const phone = document.getElementById('phoneNumber').value.trim()
  if (!phone) {
    alert('Enter your phone number')
    return
  }
  
  // Get name, location, role from signup fields
  const name = document.getElementById('signupName')?.value.trim() || 'User'
  const location = document.getElementById('signupLocation')?.value.trim() || ''
  
  // Store signup data for later
  sessionStorage.setItem('signupName', name)
  sessionStorage.setItem('signupLocation', location)
  sessionStorage.setItem('signupRole', selectedRole)
  
  // Format phone number to E.164 format
  let formattedPhone = phone
  if (!phone.startsWith('+')) {
    formattedPhone = '+255' + phone.replace(/^0+/, '')
  }
  
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
  
  const isValid = verifyOTP(otp)
  
  if (isValid) {
    const name = sessionStorage.getItem('signupName') || 'User'
    const location = sessionStorage.getItem('signupLocation') || ''
    const role = sessionStorage.getItem('signupRole') || selectedRole
    
    await createOrSignInUser(currentPhone, name, location, role)
  }
})

// Back to phone button
document.getElementById('backToPhoneBtn')?.addEventListener('click', () => {
  currentStep = 'phone'
  document.getElementById('phoneStep').classList.remove('hidden')
  document.getElementById('otpStep').classList.add('hidden')
  document.getElementById('otpCode').value = ''
})

// Role selection in phone login
document.getElementById('phoneRoleRetailer')?.addEventListener('click', () => {
  selectedRole = 'retailer'
  document.getElementById('phoneRoleRetailer').className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
  document.getElementById('phoneRoleDistributor').className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
})

document.getElementById('phoneRoleDistributor')?.addEventListener('click', () => {
  selectedRole = 'distributor'
  document.getElementById('phoneRoleDistributor').className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
  document.getElementById('phoneRoleRetailer').className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
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
  
  // Update role buttons
  const retailerBtn = document.getElementById('phoneRoleRetailer')
  const distributorBtn = document.getElementById('phoneRoleDistributor')
  if (retailerBtn) retailerBtn.textContent = t('retailer')
  if (distributorBtn) distributorBtn.textContent = t('distributor')
  
  // Update signup labels
  const nameLabel = document.getElementById('signupName')?.previousElementSibling
  const locationLabel = document.getElementById('signupLocation')?.previousElementSibling
  if (nameLabel) nameLabel.textContent = t('name')
  if (locationLabel) locationLabel.textContent = t('location')
}

// ============================================
// DASHBOARD FUNCTIONS (Keep your existing dashboard code)
// ============================================
async function showAdminDashboard() {
  document.getElementById('adminDashboard')?.classList.remove('hidden')
  const emailSpan = document.getElementById('adminEmail')
  if (emailSpan) emailSpan.textContent = currentUser?.phone || currentUser?.email || 'Admin'
  await loadPendingDistributors()
  await loadAdminOrders()
}

async function showDistributorDashboard() {
  document.getElementById('distributorDashboard')?.classList.remove('hidden')
  const emailSpan = document.getElementById('distributorEmail')
  if (emailSpan) emailSpan.textContent = currentUser?.phone || currentUser?.email || 'Distributor'
  await loadDistributorData()
}

async function showRetailerDashboard() {
  document.getElementById('retailerDashboard')?.classList.remove('hidden')
  const emailSpan = document.getElementById('retailerEmail')
  if (emailSpan) emailSpan.textContent = currentUser?.phone || currentUser?.email || 'Retailer'
  await loadRetailerData()
}

// Placeholder functions - replace with your actual implementations
async function loadPendingDistributors() { 
  const container = document.getElementById('pendingDistributors')
  if (container) container.innerHTML = '<div class="text-gray-500 text-center py-4">Loading...</div>'
}

async function loadAdminOrders() { 
  const container = document.getElementById('adminOrders')
  if (container) container.innerHTML = '<div class="text-gray-500 text-center py-4">Loading...</div>'
}

async function loadDistributorData() { 
  await loadDistributorProducts()
  await loadDistributorOrders()
  await loadStockAlerts()
}

async function loadDistributorProducts() { 
  const container = document.getElementById('distributorProducts')
  if (container) container.innerHTML = '<div class="text-gray-500 text-center py-8">No products yet. Add your first product!</div>'
}

async function loadDistributorOrders() { 
  const container = document.getElementById('distributorOrders')
  if (container) container.innerHTML = '<div class="text-gray-500 text-center py-8">No orders yet</div>'
}

async function loadStockAlerts() { 
  const container = document.getElementById('stockAlerts')
  if (container) container.innerHTML = '<div class="text-green-600 text-center py-8">✅ No low stock alerts</div>'
}

async function loadRetailerData() { 
  await loadAvailableProducts()
  await loadRetailerOrders()
  await loadCart()
}

async function loadAvailableProducts() { 
  const container = document.getElementById('retailerProducts')
  if (container) container.innerHTML = '<div class="text-gray-500 text-center py-8">No products available</div>'
}

async function loadCart() { 
  const container = document.getElementById('cartItems')
  if (container) container.innerHTML = '<div class="text-gray-500 text-center py-4">Your cart is empty</div>'
  document.getElementById('cartCount').textContent = '0'
  document.getElementById('cartTotal').textContent = '0'
}

async function loadRetailerOrders() { 
  const container = document.getElementById('retailerOrders')
  if (container) container.innerHTML = '<div class="text-gray-500 text-center py-8">No orders yet</div>'
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

// Logout
async function logout() {
  await supabase.auth.signOut()
  pendingOTP = null
  currentPhone = ''
  location.reload()
}

// Logout handlers
document.getElementById('logoutBtn')?.addEventListener('click', logout)
document.getElementById('logoutBtn2')?.addEventListener('click', logout)
document.getElementById('adminLogoutBtn')?.addEventListener('click', logout)

// Cart modal trigger
document.getElementById('showCartBtn')?.addEventListener('click', () => {
  document.getElementById('cartModal')?.classList.remove('hidden')
})

// ============================================
// INITIALIZE
// ============================================
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (profile) {
      currentUser = profile
      currentRole = profile.role
      await loadUserData(profile)
    }
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
