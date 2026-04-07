// app.js - Firebase Auth + Supabase DB (Njia Mseto)
import { supabase } from './supabase.js'

// ============================================
// STATE
// ============================================
let currentLanguage = null
let currentRole = 'retailer'
let currentUser = null
let confirmationResult = null
let currentPhone = ''

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
    retailer: 'Retailer',
    distributor: 'Distributor',
    logout: 'Logout',
    name: 'Full Name',
    location: 'Location',
    phone: 'Phone Number',
    welcome: 'Welcome!'
  },
  sw: {
    enterPhone: 'Weka namba yako ya simu',
    sendOTP: 'Tuma Msimbo wa Kuthibitisha',
    verifyOTP: 'Thibitisha Msimbo',
    enterCode: 'Weka msimbo wa tarakimu 6',
    loading: 'Inapakia...',
    retailer: 'Muuzaji',
    distributor: 'Msambazaji',
    logout: 'Toka',
    name: 'Jina Kamili',
    location: 'Eneo',
    phone: 'Namba ya Simu',
    welcome: 'Karibu!'
  }
}

function t(key) { 
  return translations[currentLanguage]?.[key] || translations.en[key] || key 
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

// ============================================
// FIREBASE PHONE AUTH
// ============================================

async function sendOTP(phoneNumber) {
  console.log('📱 Sending OTP via Firebase to:', phoneNumber)
  showLoading(true, 'Sending verification code...')
  
  try {
    const auth = window.firebaseAuth
    const RecaptchaVerifier = window.RecaptchaVerifier
    const signInWithPhoneNumber = window.signInWithPhoneNumber
    
    if (!auth) {
      throw new Error('Firebase auth not initialized. Check your configuration.')
    }
    
    // Setup reCAPTCHA
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => console.log('reCAPTCHA resolved')
      })
    }
    
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
    window.confirmationResult = confirmation
    console.log('✅ OTP sent successfully')
    showLoading(false)
    alert(`Verification code sent to ${phoneNumber}!`)
    return true
    
  } catch (error) {
    showLoading(false)
    console.error('❌ Firebase error:', error)
    
    if (error.code === 'auth/invalid-phone-number') {
      alert('Invalid phone number format. Use +255XXXXXXXXX')
    } else if (error.code === 'auth/too-many-requests') {
      alert('Too many requests. Please try again later.')
    } else {
      alert('Error: ' + error.message)
    }
    return false
  }
}

async function verifyOTP(code) {
  showLoading(true, 'Verifying code...')
  
  try {
    const confirmation = window.confirmationResult
    if (!confirmation) {
      throw new Error('No OTP pending. Please request a new code.')
    }
    
    const result = await confirmation.confirm(code)
    const firebaseUser = result.user
    console.log('✅ Firebase user verified:', firebaseUser.uid, firebaseUser.phoneNumber)
    
    // Handle Supabase profile
    await handleSupabaseUser(firebaseUser)
    showLoading(false)
    return true
    
  } catch (error) {
    showLoading(false)
    console.error('❌ Verification error:', error)
    
    if (error.code === 'auth/invalid-verification-code') {
      alert('Invalid verification code. Please try again.')
    } else {
      alert('Error: ' + error.message)
    }
    return false
  }
}

// ============================================
// SUPABASE PROFILE HANDLING
// ============================================

async function handleSupabaseUser(firebaseUser) {
  console.log('📦 Checking Supabase profile for UID:', firebaseUser.uid)
  
  const name = sessionStorage.getItem('signupName') || 'User'
  const location = sessionStorage.getItem('signupLocation') || ''
  const role = sessionStorage.getItem('signupRole') || currentRole
  const phoneNumber = firebaseUser.phoneNumber
  
  // Check if user exists in Supabase profiles
  let { data: existingProfile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', firebaseUser.uid)
    .maybeSingle()
  
  if (error) {
    console.error('Supabase query error:', error)
  }
  
  if (!existingProfile) {
    console.log('📦 Creating new Supabase profile...')
    
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: firebaseUser.uid,
        phone: phoneNumber,
        name: name,
        location: location,
        role: role
      }])
      .select()
      .single()
    
    if (insertError) {
      console.error('Profile creation error:', insertError)
      alert('Error creating profile: ' + insertError.message)
      return false
    }
    
    currentUser = newProfile
    currentRole = newProfile.role
  } else {
    console.log('📦 Existing profile found')
    currentUser = existingProfile
    currentRole = existingProfile.role
  }
  
  // Update role display on dashboards
  updateDashboardEmail()
  forceRedirectToDashboard()
  return true
}

function updateDashboardEmail() {
  const adminEmail = document.getElementById('adminEmail')
  const distributorEmail = document.getElementById('distributorEmail')
  const retailerEmail = document.getElementById('retailerEmail')
  
  const displayText = currentUser?.phone || currentUser?.email || 'User'
  
  if (adminEmail) adminEmail.textContent = displayText
  if (distributorEmail) distributorEmail.textContent = displayText
  if (retailerEmail) retailerEmail.textContent = displayText
}

// ============================================
// DASHBOARD NAVIGATION
// ============================================

function forceRedirectToDashboard() {
  console.log('🎯 Showing dashboard for role:', currentRole)
  
  // Hide all screens
  const languageScreen = document.getElementById('languageScreen')
  const loginSection = document.getElementById('loginSection')
  const phoneLoginSection = document.getElementById('phoneLoginSection')
  const phoneStep = document.getElementById('phoneStep')
  const otpStep = document.getElementById('otpStep')
  const distributorDashboard = document.getElementById('distributorDashboard')
  const retailerDashboard = document.getElementById('retailerDashboard')
  const adminDashboard = document.getElementById('adminDashboard')
  
  if (languageScreen) languageScreen.classList.add('hidden')
  if (loginSection) loginSection.classList.add('hidden')
  if (phoneLoginSection) phoneLoginSection.classList.add('hidden')
  if (phoneStep) phoneStep.classList.add('hidden')
  if (otpStep) otpStep.classList.add('hidden')
  
  // Show appropriate dashboard
  if (currentRole === 'distributor') {
    if (distributorDashboard) distributorDashboard.classList.remove('hidden')
    loadDistributorData()
  } else if (currentRole === 'admin') {
    if (adminDashboard) adminDashboard.classList.remove('hidden')
    loadAdminData()
  } else {
    if (retailerDashboard) retailerDashboard.classList.remove('hidden')
    loadRetailerData()
  }
  
  showLoading(false)
}

function showPhoneLogin() {
  const languageScreen = document.getElementById('languageScreen')
  const loginSection = document.getElementById('loginSection')
  const phoneLoginSection = document.getElementById('phoneLoginSection')
  const distributorDashboard = document.getElementById('distributorDashboard')
  const retailerDashboard = document.getElementById('retailerDashboard')
  const adminDashboard = document.getElementById('adminDashboard')
  const phoneStep = document.getElementById('phoneStep')
  const otpStep = document.getElementById('otpStep')
  const otpCode = document.getElementById('otpCode')
  const phoneNumber = document.getElementById('phoneNumber')
  
  if (languageScreen) languageScreen.classList.add('hidden')
  if (loginSection) loginSection.classList.add('hidden')
  if (phoneLoginSection) phoneLoginSection.classList.remove('hidden')
  if (distributorDashboard) distributorDashboard.classList.add('hidden')
  if (retailerDashboard) retailerDashboard.classList.add('hidden')
  if (adminDashboard) adminDashboard.classList.add('hidden')
  if (phoneStep) phoneStep.classList.remove('hidden')
  if (otpStep) otpStep.classList.add('hidden')
  if (otpCode) otpCode.value = ''
  if (phoneNumber) phoneNumber.value = ''
  
  // Reset Firebase confirmation
  window.confirmationResult = null
  currentPhone = ''
}

// ============================================
// DATA LOADING FUNCTIONS
// ============================================

async function loadDistributorData() {
  console.log('Loading distributor data...')
  const productsContainer = document.getElementById('distributorProducts')
  if (productsContainer) {
    productsContainer.innerHTML = '<div class="text-gray-500 text-center py-8">No products yet. Add your first product!</div>'
  }
  
  const ordersContainer = document.getElementById('distributorOrders')
  if (ordersContainer) {
    ordersContainer.innerHTML = '<div class="text-gray-500 text-center py-8">No orders yet</div>'
  }
  
  const alertsContainer = document.getElementById('stockAlerts')
  if (alertsContainer) {
    alertsContainer.innerHTML = '<div class="text-green-600 text-center py-8">✅ No low stock alerts</div>'
  }
}

async function loadRetailerData() {
  console.log('Loading retailer data...')
  const productsContainer = document.getElementById('retailerProducts')
  if (productsContainer) {
    productsContainer.innerHTML = '<div class="text-gray-500 text-center py-8">No products available</div>'
  }
  
  const ordersContainer = document.getElementById('retailerOrders')
  if (ordersContainer) {
    ordersContainer.innerHTML = '<div class="text-gray-500 text-center py-8">No orders yet</div>'
  }
  
  const cartContainer = document.getElementById('cartItems')
  if (cartContainer) {
    cartContainer.innerHTML = '<div class="text-gray-500 text-center py-4">Your cart is empty</div>'
  }
  const cartCount = document.getElementById('cartCount')
  if (cartCount) cartCount.textContent = '0'
  const cartTotal = document.getElementById('cartTotal')
  if (cartTotal) cartTotal.textContent = '0'
}

async function loadAdminData() {
  console.log('Loading admin data...')
  const pendingContainer = document.getElementById('pendingDistributors')
  if (pendingContainer) {
    pendingContainer.innerHTML = '<div class="text-gray-500 text-center py-4">No pending approvals</div>'
  }
  
  const ordersContainer = document.getElementById('adminOrders')
  if (ordersContainer) {
    ordersContainer.innerHTML = '<div class="text-gray-500 text-center py-4">No orders yet</div>'
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

// Send OTP button
const sendOtpBtn = document.getElementById('sendOtpPhoneBtn')
if (sendOtpBtn) {
  sendOtpBtn.addEventListener('click', async () => {
    const phoneInput = document.getElementById('phoneNumber')
    const phone = phoneInput?.value.trim()
    
    if (!phone) {
      alert('Enter your phone number')
      return
    }
    
    const nameInput = document.getElementById('signupName')
    const locationInput = document.getElementById('signupLocation')
    const name = nameInput?.value.trim() || 'User'
    const location = locationInput?.value.trim() || ''
    
    sessionStorage.setItem('signupName', name)
    sessionStorage.setItem('signupLocation', location)
    sessionStorage.setItem('signupRole', currentRole)
    
    let formattedPhone = phone
    if (!phone.startsWith('+')) {
      formattedPhone = '+255' + phone.replace(/^0+/, '')
    }
    currentPhone = formattedPhone
    
    const success = await sendOTP(formattedPhone)
    if (success) {
      const phoneStep = document.getElementById('phoneStep')
      const otpStep = document.getElementById('otpStep')
      if (phoneStep) phoneStep.classList.add('hidden')
      if (otpStep) otpStep.classList.remove('hidden')
    }
  })
}

// Verify OTP button
const verifyBtn = document.getElementById('verifyOtpBtn')
if (verifyBtn) {
  verifyBtn.addEventListener('click', async () => {
    const otpInput = document.getElementById('otpCode')
    const otp = otpInput?.value.trim()
    
    if (!otp || otp.length !== 6) {
      alert('Enter 6-digit verification code')
      return
    }
    
    await verifyOTP(otp)
  })
}

// Back button
const backBtn = document.getElementById('backToPhoneBtn')
if (backBtn) {
  backBtn.addEventListener('click', () => {
    const phoneStep = document.getElementById('phoneStep')
    const otpStep = document.getElementById('otpStep')
    const otpCode = document.getElementById('otpCode')
    
    if (phoneStep) phoneStep.classList.remove('hidden')
    if (otpStep) otpStep.classList.add('hidden')
    if (otpCode) otpCode.value = ''
  })
}

// Role selection
const retailerRoleBtn = document.getElementById('phoneRoleRetailer')
const distributorRoleBtn = document.getElementById('phoneRoleDistributor')

if (retailerRoleBtn) {
  retailerRoleBtn.addEventListener('click', () => {
    currentRole = 'retailer'
    retailerRoleBtn.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    if (distributorRoleBtn) distributorRoleBtn.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

if (distributorRoleBtn) {
  distributorRoleBtn.addEventListener('click', () => {
    currentRole = 'distributor'
    distributorRoleBtn.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    if (retailerRoleBtn) retailerRoleBtn.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
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
  
  if (phoneTitle) phoneTitle.textContent = t('welcome')
  if (phoneSubtitle) phoneSubtitle.textContent = t('enterPhone')
  if (sendOtpPhoneBtn) sendOtpPhoneBtn.innerHTML = `<i class="fas fa-paper-plane"></i><span>${t('sendOTP')}</span>`
  if (otpTitle) otpTitle.textContent = t('verifyOTP')
  if (verifyOtpBtn) verifyOtpBtn.innerHTML = `<i class="fas fa-check-circle"></i><span>${t('verifyOTP')}</span>`
  
  const retailerBtn = document.getElementById('phoneRoleRetailer')
  const distributorBtn = document.getElementById('phoneRoleDistributor')
  if (retailerBtn) retailerBtn.innerHTML = `<i class="fas fa-store"></i><span>${t('retailer')}</span>`
  if (distributorBtn) distributorBtn.innerHTML = `<i class="fas fa-truck"></i><span>${t('distributor')}</span>`
  
  // Update signup labels
  const nameInput = document.getElementById('signupName')
  const locationInput = document.getElementById('signupLocation')
  if (nameInput) nameInput.placeholder = t('name')
  if (locationInput) locationInput.placeholder = t('location')
}

// ============================================
// LOGOUT
// ============================================
async function handleLogout() {
  console.log('🚪 Logging out...')
  
  // Sign out from Firebase
  if (window.firebaseAuth) {
    try {
      await window.firebaseAuth.signOut()
    } catch (e) {
      console.log('Firebase sign out error:', e)
    }
  }
  
  // Sign out from Supabase
  try {
    await supabase.auth.signOut()
  } catch (e) {
    console.log('Supabase sign out error:', e)
  }
  
  // Reset state
  sessionStorage.clear()
  window.confirmationResult = null
  currentUser = null
  currentRole = 'retailer'
  currentPhone = ''
  
  showPhoneLogin()
}

// Logout buttons
const logoutBtn = document.getElementById('logoutBtn')
const logoutBtn2 = document.getElementById('logoutBtn2')
const adminLogoutBtn = document.getElementById('adminLogoutBtn')

if (logoutBtn) logoutBtn.addEventListener('click', handleLogout)
if (logoutBtn2) logoutBtn2.addEventListener('click', handleLogout)
if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', handleLogout)

// Cart modal
const showCartBtn = document.getElementById('showCartBtn')
if (showCartBtn) {
  showCartBtn.addEventListener('click', () => {
    const cartModal = document.getElementById('cartModal')
    if (cartModal) cartModal.classList.remove('hidden')
  })
}

// Close modal function
window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) modal.classList.add('hidden')
}

// ============================================
// CHECK EXISTING SESSION
// ============================================
async function checkExistingSession() {
  // Check Firebase session first
  if (window.firebaseAuth) {
    const user = window.firebaseAuth.currentUser
    if (user) {
      console.log('✅ Existing Firebase session found:', user.uid)
      await handleSupabaseUser(user)
      return true
    }
  }
  
  // Check Supabase session
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    console.log('✅ Existing Supabase session found:', session.user.id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
    if (profile) {
      currentUser = profile
      currentRole = profile.role
      forceRedirectToDashboard()
      return true
    }
  }
  
  return false
}

// ============================================
// INITIALIZE
// ============================================
async function init() {
  console.log('🚀 Initializing BomaWave app...')
  
  // Check for existing session
  const hasSession = await checkExistingSession()
  if (!hasSession) {
    const languageScreen = document.getElementById('languageScreen')
    if (languageScreen) languageScreen.classList.remove('hidden')
  }
}

init()
