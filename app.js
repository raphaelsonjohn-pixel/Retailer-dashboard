// app.js - Custom Session + Africa's Talking OTP (No Supabase Auth)
import { supabase } from './supabase.js'

// ============================================
// CONSTANTS
// ============================================
const EDGE_FUNCTION_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/send-sms-africastalking'

// ============================================
// TRANSLATIONS
// ============================================
let currentLanguage = null

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
    welcome: 'Welcome!',
    loginSuccess: 'Login successful!',
    invalidCode: 'Invalid verification code. Please try again.',
    errorSendingOTP: 'Error: Could not send verification code.',
    noPhone: 'Enter your phone number',
    noCode: 'Enter 6-digit verification code'
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
    welcome: 'Karibu!',
    loginSuccess: 'Kuingia kumefanikiwa!',
    invalidCode: 'Msimbo si sahihi. Tafadhali jaribu tena.',
    errorSendingOTP: 'Imeshindwa kutuma msimbo. Tafadhali jaribu tena.',
    noPhone: 'Weka namba yako ya simu',
    noCode: 'Weka msimbo wa tarakimu 6'
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
// SESSION MANAGEMENT (Custom - No Supabase Auth)
// ============================================
let currentUser = null
let currentRole = null
let pendingOTP = null
let pendingPhone = null

function saveSession(user) {
  localStorage.setItem('bomawave_user', JSON.stringify(user))
  currentUser = user
  currentRole = user.role
}

function loadSession() {
  const saved = localStorage.getItem('bomawave_user')
  if (saved) {
    currentUser = JSON.parse(saved)
    currentRole = currentUser.role
    return true
  }
  return false
}

function clearSession() {
  localStorage.removeItem('bomawave_user')
  currentUser = null
  currentRole = null
}

// ============================================
// OTP FUNCTIONS (Africa's Talking)
// ============================================
async function sendOTP(phoneNumber) {
  console.log('📱 Sending OTP to:', phoneNumber)
  showLoading(true, t('loading'))
  
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
      pendingPhone = phoneNumber
      console.log('✅ OTP received:', pendingOTP)
      alert(`Verification code sent to ${phoneNumber}! Check your WhatsApp/SMS.`)
      return true
    } else {
      alert(t('errorSendingOTP'))
      return false
    }
  } catch (error) {
    showLoading(false)
    console.error('Send OTP error:', error)
    alert(t('errorSendingOTP'))
    return false
  }
}

function verifyOTP(enteredCode) {
  if (enteredCode === pendingOTP) {
    return true
  } else {
    alert(t('invalidCode'))
    return false
  }
}

// ============================================
// DATABASE FUNCTIONS (Supabase - Direct)
// ============================================
async function createOrGetUser(phoneNumber, name, location, role) {
  // First, try to get existing user
  let { data: existingUser, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone', phoneNumber)
    .maybeSingle()
  
  if (selectError) {
    console.error('Select error:', selectError)
  }
  
  if (existingUser) {
    return existingUser
  }
  
  // Create new user
  const { data: newUser, error: insertError } = await supabase
    .from('profiles')
    .insert([{
      phone: phoneNumber,
      name: name,
      location: location,
      role: role,
      created_at: new Date()
    }])
    .select()
    .single()
  
  if (insertError) {
    console.error('Insert error:', insertError)
    return null
  }
  
  return newUser
}

// ============================================
// DASHBOARD NAVIGATION
// ============================================
function showDashboard() {
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
  } else if (currentRole === 'admin') {
    if (adminDashboard) adminDashboard.classList.remove('hidden')
  } else {
    if (retailerDashboard) retailerDashboard.classList.remove('hidden')
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
  
  pendingOTP = null
  pendingPhone = null
}

// ============================================
// UPDATE UI TEXT (Translation)
// ============================================
function updateUIText() {
  const phoneTitle = document.getElementById('phoneTitle')
  const phoneSubtitle = document.getElementById('phoneSubtitle')
  const sendOtpPhoneBtn = document.getElementById('sendOtpPhoneBtn')
  const otpTitle = document.getElementById('otpTitle')
  const verifyOtpBtn = document.getElementById('verifyOtpBtn')
  const nameInput = document.getElementById('signupName')
  const locationInput = document.getElementById('signupLocation')
  const retailerBtn = document.getElementById('phoneRoleRetailer')
  const distributorBtn = document.getElementById('phoneRoleDistributor')
  
  if (phoneTitle) phoneTitle.textContent = t('welcome')
  if (phoneSubtitle) phoneSubtitle.textContent = t('enterPhone')
  if (sendOtpPhoneBtn) sendOtpPhoneBtn.innerHTML = `<i class="fas fa-paper-plane"></i><span>${t('sendOTP')}</span>`
  if (otpTitle) otpTitle.textContent = t('verifyOTP')
  if (verifyOtpBtn) verifyOtpBtn.innerHTML = `<i class="fas fa-check-circle"></i><span>${t('verifyOTP')}</span>`
  if (nameInput) nameInput.placeholder = t('name')
  if (locationInput) locationInput.placeholder = t('location')
  if (retailerBtn) retailerBtn.innerHTML = `<i class="fas fa-store"></i><span>${t('retailer')}</span>`
  if (distributorBtn) distributorBtn.innerHTML = `<i class="fas fa-truck"></i><span>${t('distributor')}</span>`
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
      alert(t('noPhone'))
      return
    }
    
    const nameInput = document.getElementById('signupName')
    const locationInput = document.getElementById('signupLocation')
    const name = nameInput?.value.trim() || 'User'
    const location = locationInput?.value.trim() || ''
    
    const isRetailer = document.getElementById('phoneRoleRetailer')?.classList.contains('bg-green-600')
    const role = isRetailer ? 'retailer' : 'distributor'
    
    sessionStorage.setItem('signupName', name)
    sessionStorage.setItem('signupLocation', location)
    sessionStorage.setItem('signupRole', role)
    
    let formattedPhone = phone
    if (!phone.startsWith('+')) {
      formattedPhone = '+255' + phone.replace(/^0+/, '')
    }
    
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
      alert(t('noCode'))
      return
    }
    
    const isValid = verifyOTP(otp)
    
    if (isValid) {
      const name = sessionStorage.getItem('signupName') || 'User'
      const location = sessionStorage.getItem('signupLocation') || ''
      const role = sessionStorage.getItem('signupRole') || 'retailer'
      
      const user = await createOrGetUser(pendingPhone, name, location, role)
      
      if (user) {
        saveSession(user)
        alert(t('loginSuccess'))
        showDashboard()
      } else {
        alert('Error creating account. Please try again.')
      }
    }
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
    retailerRoleBtn.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    if (distributorRoleBtn) distributorRoleBtn.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

if (distributorRoleBtn) {
  distributorRoleBtn.addEventListener('click', () => {
    distributorRoleBtn.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    if (retailerRoleBtn) retailerRoleBtn.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

// Language selection
window.selectLanguage = function(lang) {
  currentLanguage = lang
  const languageScreen = document.getElementById('languageScreen')
  if (languageScreen) languageScreen.classList.add('hidden')
  showPhoneLogin()
  updateUIText()
}

// Logout
function handleLogout() {
  console.log('🚪 Logging out...')
  clearSession()
  showPhoneLogin()
}

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

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) modal.classList.add('hidden')
}

// ============================================
// DASHBOARD DATA FUNCTIONS (Placeholders)
// ============================================
async function loadDistributorData() {
  const container = document.getElementById('distributorProducts')
  if (container) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">Ready to add products. Your session is working!</div>'
  }
}

async function loadRetailerData() {
  const container = document.getElementById('retailerProducts')
  if (container) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">Ready to shop. Your session is working!</div>'
  }
}

// ============================================
// INITIALIZE
// ============================================
function init() {
  console.log('🚀 Initializing BomaWave app...')
  
  if (loadSession()) {
    showDashboard()
  } else {
    const languageScreen = document.getElementById('languageScreen')
    if (languageScreen) languageScreen.classList.remove('hidden')
  }
}

init()
