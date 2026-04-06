// app.js - BomaWave with Africa's Talking OTP (FIXED NAVIGATION)
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
let currentStep = 'phone'
let selectedRole = 'retailer'
let currentPhone = ''
let pendingOTP = null

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  en: {
    enterPhone: 'Enter your phone number',
    sendOTP: 'Send Verification Code',
    verifyOTP: 'Verify Code',
    enterCode: 'Enter 6-digit code',
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
    enterPhone: 'Weka namba yako ya simu',
    sendOTP: 'Tuma Msimbo wa Kuthibitisha',
    verifyOTP: 'Thibitisha Msimbo',
    enterCode: 'Weka msimbo wa tarakimu 6',
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
// UI FUNCTIONS
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

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

async function sendOTP(phoneNumber) {
  console.log('🔵 sendOTP called with phone:', phoneNumber)
  showLoading(true, 'Sending verification code...')
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber })
    })
    
    const result = await response.json()
    showLoading(false)
    
    if (result.success) {
      pendingOTP = result.otp
      currentPhone = phoneNumber
      console.log('🔵 OTP received:', pendingOTP)
      alert(`Verification code sent to ${phoneNumber}! Check simulator.`)
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

function verifyOTP(enteredCode) {
  console.log('🔵 verifyOTP called - Entered:', enteredCode, 'Pending:', pendingOTP)
  
  if (!pendingOTP) {
    alert('No verification code pending. Please request a new code.')
    return false
  }
  
  if (enteredCode === pendingOTP) {
    console.log('🔵 OTP matched!')
    return true
  } else {
    alert('Invalid verification code. Please try again.')
    return false
  }
}

async function createOrLoginUser(phoneNumber, name, location, role) {
  console.log('🔵 createOrLoginUser called')
  showLoading(true, 'Setting up your account...')
  
  try {
    // FIRST: Check if profile exists
    let { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phoneNumber)
      .maybeSingle()
    
    if (existingProfile) {
      console.log('🔵 Profile exists, logging in...')
      currentUser = existingProfile
      currentRole = existingProfile.role
      await showDashboard()
      showLoading(false)
      return true
    }
    
    // SECOND: Check if auth user exists
    const phoneDigits = phoneNumber.replace(/[^0-9]/g, '')
    const tempEmail = `user${phoneDigits}@temp-mail.org`
    const tempPassword = 'BomaWave2024Secure!'
    
    // Try to sign in first
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: tempPassword
    })
    
    if (signInError) {
      // User doesn't exist, create new
      console.log('🔵 Creating new user...')
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: { name, role, phone: phoneNumber, location }
        }
      })
      
      if (signUpError) {
        console.error('Sign up error:', signUpError)
        showLoading(false)
        alert('Error: ' + signUpError.message)
        return false
      }
      
      if (signUpData?.user) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Create profile
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{
            id: signUpData.user.id,
            phone: phoneNumber,
            name: name,
            location: location,
            role: role
          }])
          .select()
          .single()
        
        if (newProfile) {
          currentUser = newProfile
          currentRole = newProfile.role
          await showDashboard()
          showLoading(false)
          return true
        }
      }
    } else if (signInData?.user) {
      // User exists, create profile if missing
      console.log('🔵 User exists, creating profile...')
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{
          id: signInData.user.id,
          phone: phoneNumber,
          name: name,
          location: location,
          role: role
        }])
        .select()
        .single()
      
      if (newProfile) {
        currentUser = newProfile
        currentRole = newProfile.role
        await showDashboard()
        showLoading(false)
        return true
      }
    }
    
    showLoading(false)
    return false
    
  } catch (error) {
    showLoading(false)
    console.error('Create/login error:', error)
    alert('Error: ' + error.message)
    return false
  }
}

// ============================================
// DASHBOARD NAVIGATION - FIXED
// ============================================
async function showDashboard() {
  console.log('🔵🔵🔵 showDashboard called - Role:', currentRole)
  
  // HIDE ALL SCREENS
  const languageScreen = document.getElementById('languageScreen')
  const loginSection = document.getElementById('loginSection')
  const phoneLoginSection = document.getElementById('phoneLoginSection')
  const distributorDashboard = document.getElementById('distributorDashboard')
  const retailerDashboard = document.getElementById('retailerDashboard')
  const adminDashboard = document.getElementById('adminDashboard')
  
  if (languageScreen) languageScreen.classList.add('hidden')
  if (loginSection) loginSection.classList.add('hidden')
  if (phoneLoginSection) phoneLoginSection.classList.add('hidden')
  
  // Check if admin
  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', currentUser?.id)
    .maybeSingle()
  
  // SHOW APPROPRIATE DASHBOARD
  if (adminCheck) {
    console.log('🔵 Showing Admin Dashboard')
    if (adminDashboard) adminDashboard.classList.remove('hidden')
    const adminEmail = document.getElementById('adminEmail')
    if (adminEmail) adminEmail.textContent = currentUser?.phone || 'Admin'
  } else if (currentRole === 'distributor') {
    console.log('🔵 Showing Distributor Dashboard')
    if (distributorDashboard) distributorDashboard.classList.remove('hidden')
    const distributorEmail = document.getElementById('distributorEmail')
    if (distributorEmail) distributorEmail.textContent = currentUser?.phone || 'Distributor'
    await loadDistributorData()
  } else {
    console.log('🔵 Showing Retailer Dashboard')
    if (retailerDashboard) retailerDashboard.classList.remove('hidden')
    const retailerEmail = document.getElementById('retailerEmail')
    if (retailerEmail) retailerEmail.textContent = currentUser?.phone || 'Retailer'
    await loadRetailerData()
  }
  
  showLoading(false)
}

async function loadUserData(user) {
  console.log('🔵 loadUserData called')
  currentUser = user
  
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  
  if (profile) {
    currentUser = profile
    currentRole = profile.role
  }
  
  await showDashboard()
}

// ============================================
// DASHBOARD DATA FUNCTIONS
// ============================================
async function loadDistributorData() {
  console.log('Loading distributor data...')
  await loadDistributorProducts()
  await loadDistributorOrders()
  await loadStockAlerts()
}

async function loadDistributorProducts() {
  const container = document.getElementById('distributorProducts')
  if (container) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">No products yet. Add your first product!</div>'
  }
}

async function loadDistributorOrders() {
  const container = document.getElementById('distributorOrders')
  if (container) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">No orders yet</div>'
  }
}

async function loadStockAlerts() {
  const container = document.getElementById('stockAlerts')
  if (container) {
    container.innerHTML = '<div class="text-green-600 text-center py-8">✅ No low stock alerts</div>'
  }
}

async function loadRetailerData() {
  console.log('Loading retailer data...')
  await loadAvailableProducts()
  await loadRetailerOrders()
  await loadCart()
}

async function loadAvailableProducts() {
  const container = document.getElementById('retailerProducts')
  if (container) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">No products available</div>'
  }
}

async function loadRetailerOrders() {
  const container = document.getElementById('retailerOrders')
  if (container) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">No orders yet</div>'
  }
}

async function loadCart() {
  const container = document.getElementById('cartItems')
  if (container) {
    container.innerHTML = '<div class="text-gray-500 text-center py-4">Your cart is empty</div>'
  }
  const cartCount = document.getElementById('cartCount')
  if (cartCount) cartCount.textContent = '0'
  const cartTotal = document.getElementById('cartTotal')
  if (cartTotal) cartTotal.textContent = '0'
}

// ============================================
// LOGIN SCREEN
// ============================================
function showPhoneLogin() {
  const languageScreen = document.getElementById('languageScreen')
  const loginSection = document.getElementById('loginSection')
  const phoneLoginSection = document.getElementById('phoneLoginSection')
  const distributorDashboard = document.getElementById('distributorDashboard')
  const retailerDashboard = document.getElementById('retailerDashboard')
  const adminDashboard = document.getElementById('adminDashboard')
  
  if (languageScreen) languageScreen.classList.add('hidden')
  if (loginSection) loginSection.classList.add('hidden')
  if (phoneLoginSection) phoneLoginSection.classList.remove('hidden')
  if (distributorDashboard) distributorDashboard.classList.add('hidden')
  if (retailerDashboard) retailerDashboard.classList.add('hidden')
  if (adminDashboard) adminDashboard.classList.add('hidden')
  
  currentStep = 'phone'
  pendingOTP = null
  currentPhone = ''
  const phoneStep = document.getElementById('phoneStep')
  const otpStep = document.getElementById('otpStep')
  const otpCode = document.getElementById('otpCode')
  const phoneNumber = document.getElementById('phoneNumber')
  
  if (phoneStep) phoneStep.classList.remove('hidden')
  if (otpStep) otpStep.classList.add('hidden')
  if (otpCode) otpCode.value = ''
  if (phoneNumber) phoneNumber.value = ''
}

// Send OTP button
document.getElementById('sendOtpPhoneBtn')?.addEventListener('click', async () => {
  const phoneInput = document.getElementById('phoneNumber')
  const phone = phoneInput?.value.trim()
  if (!phone) {
    alert('Enter your phone number')
    return
  }
  
  const signupName = document.getElementById('signupName')
  const signupLocation = document.getElementById('signupLocation')
  const name = signupName?.value.trim() || 'User'
  const location = signupLocation?.value.trim() || ''
  
  sessionStorage.setItem('signupName', name)
  sessionStorage.setItem('signupLocation', location)
  sessionStorage.setItem('signupRole', selectedRole)
  
  let formattedPhone = phone
  if (!phone.startsWith('+')) {
    formattedPhone = '+255' + phone.replace(/^0+/, '')
  }
  
  const success = await sendOTP(formattedPhone)
  
  if (success) {
    currentStep = 'otp'
    const phoneStep = document.getElementById('phoneStep')
    const otpStep = document.getElementById('otpStep')
    if (phoneStep) phoneStep.classList.add('hidden')
    if (otpStep) otpStep.classList.remove('hidden')
  }
})

// Verify OTP button - FIXED NAVIGATION
document.getElementById('verifyOtpBtn')?.addEventListener('click', async () => {
  const otpInput = document.getElementById('otpCode')
  const otp = otpInput?.value.trim()
  if (!otp || otp.length !== 6) {
    alert('Enter 6-digit verification code')
    return
  }
  
  const isValid = verifyOTP(otp)
  
  if (isValid) {
    const name = sessionStorage.getItem('signupName') || 'User'
    const location = sessionStorage.getItem('signupLocation') || ''
    const role = sessionStorage.getItem('signupRole') || selectedRole
    
    await createOrLoginUser(currentPhone, name, location, role)
  }
})

// Back button
document.getElementById('backToPhoneBtn')?.addEventListener('click', () => {
  currentStep = 'phone'
  const phoneStep = document.getElementById('phoneStep')
  const otpStep = document.getElementById('otpStep')
  const otpCode = document.getElementById('otpCode')
  
  if (phoneStep) phoneStep.classList.remove('hidden')
  if (otpStep) otpStep.classList.add('hidden')
  if (otpCode) otpCode.value = ''
})

// Role selection
const phoneRoleRetailer = document.getElementById('phoneRoleRetailer')
const phoneRoleDistributor = document.getElementById('phoneRoleDistributor')

if (phoneRoleRetailer) {
  phoneRoleRetailer.addEventListener('click', () => {
    selectedRole = 'retailer'
    phoneRoleRetailer.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    if (phoneRoleDistributor) phoneRoleDistributor.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

if (phoneRoleDistributor) {
  phoneRoleDistributor.addEventListener('click', () => {
    selectedRole = 'distributor'
    phoneRoleDistributor.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    if (phoneRoleRetailer) phoneRoleRetailer.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

// ============================================
// LANGUAGE SELECTION
// ============================================
window.selectLanguage = function(lang) {
  currentLanguage = lang
  const languageScreen = document.getElementById('languageScreen')
  if (languageScreen) languageScreen.classList.add('hidden')
  showPhoneLogin()
  updateUIText()
}

function updateUIText() {
  const phoneTitle = document.getElementById('phoneTitle')
  const phoneSubtitle = document.getElementById('phoneSubtitle')
  const sendOtpPhoneBtn = document.getElementById('sendOtpPhoneBtn')
  const otpTitle = document.getElementById('otpTitle')
  const verifyOtpBtn = document.getElementById('verifyOtpBtn')
  
  if (phoneTitle) phoneTitle.textContent = t('enterPhone')
  if (phoneSubtitle) phoneSubtitle.textContent = t('enterPhone')
  if (sendOtpPhoneBtn) sendOtpPhoneBtn.textContent = t('sendOTP')
  if (otpTitle) otpTitle.textContent = t('verifyOTP')
  if (verifyOtpBtn) verifyOtpBtn.textContent = t('verifyOTP')
  
  const retailerBtn = document.getElementById('phoneRoleRetailer')
  const distributorBtn = document.getElementById('phoneRoleDistributor')
  if (retailerBtn) retailerBtn.textContent = t('retailer')
  if (distributorBtn) distributorBtn.textContent = t('distributor')
}

// ============================================
// SESSION CHECK
// ============================================
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
    
    if (profile) {
      currentUser = profile
      currentRole = profile.role
      await showDashboard()
      return true
    }
  }
  return false
}

// Logout
async function logout() {
  await supabase.auth.signOut()
  sessionStorage.clear()
  pendingOTP = null
  currentPhone = ''
  showPhoneLogin()
}

// Logout handlers
const logoutBtn = document.getElementById('logoutBtn')
const logoutBtn2 = document.getElementById('logoutBtn2')
const adminLogoutBtn = document.getElementById('adminLogoutBtn')

if (logoutBtn) logoutBtn.addEventListener('click', logout)
if (logoutBtn2) logoutBtn2.addEventListener('click', logout)
if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', logout)

// Cart modal
const showCartBtn = document.getElementById('showCartBtn')
if (showCartBtn) {
  showCartBtn.addEventListener('click', () => {
    const cartModal = document.getElementById('cartModal')
    if (cartModal) cartModal.classList.remove('hidden')
  })
}

// ============================================
// INITIALIZE
// ============================================
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🔵 Auth event:', event)
  if (event === 'SIGNED_IN' && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
    if (profile) {
      currentUser = profile
      currentRole = profile.role
      await showDashboard()
    }
  } else if (event === 'SIGNED_OUT') {
    showPhoneLogin()
  }
})

async function init() {
  console.log('🔵 Initializing app...')
  const hasSession = await checkSession()
  if (!hasSession) {
    const languageScreen = document.getElementById('languageScreen')
    if (languageScreen) languageScreen.classList.remove('hidden')
  }
}

init()
