// app.js - BomaWave SIMPLIFIED VERSION (Bypass Supabase Auth)
import { supabase } from './supabase.js'

// ============================================
// CONSTANTS
// ============================================
const EDGE_FUNCTION_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/send-sms-africastalking'

// ============================================
// STATE
// ============================================
let currentLanguage = null
let currentRole = 'retailer'
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
    retailer: 'Retailer',
    distributor: 'Distributor',
    logout: 'Logout'
  },
  sw: {
    enterPhone: 'Weka namba yako ya simu',
    sendOTP: 'Tuma Msimbo wa Kuthibitisha',
    verifyOTP: 'Thibitisha Msimbo',
    enterCode: 'Weka msimbo wa tarakimu 6',
    loading: 'Inapakia...',
    retailer: 'Muuzaji',
    distributor: 'Msambazaji',
    logout: 'Toka'
  }
}

function t(key) { 
  return translations[currentLanguage]?.[key] || translations.en[key] || key 
}

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
// SEND OTP VIA EDGE FUNCTION
// ============================================
async function sendOTP(phoneNumber) {
  console.log('🔵 Sending OTP to:', phoneNumber)
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

// ============================================
// FORCE REDIRECT TO DASHBOARD
// ============================================
function forceRedirectToDashboard() {
  console.log('🔴 FORCE REDIRECT: Redirecting to dashboard...')
  
  // Hide all screens
  const languageScreen = document.getElementById('languageScreen')
  const loginSection = document.getElementById('loginSection')
  const phoneLoginSection = document.getElementById('phoneLoginSection')
  const distributorDashboard = document.getElementById('distributorDashboard')
  const retailerDashboard = document.getElementById('retailerDashboard')
  const adminDashboard = document.getElementById('adminDashboard')
  
  if (languageScreen) languageScreen.classList.add('hidden')
  if (loginSection) loginSection.classList.add('hidden')
  if (phoneLoginSection) phoneLoginSection.classList.add('hidden')
  
  // Hide OTP steps
  const phoneStep = document.getElementById('phoneStep')
  const otpStep = document.getElementById('otpStep')
  if (phoneStep) phoneStep.classList.add('hidden')
  if (otpStep) otpStep.classList.add('hidden')
  
  // Show dashboard based on role
  if (currentRole === 'distributor') {
    console.log('🔴 Showing Distributor Dashboard')
    if (distributorDashboard) distributorDashboard.classList.remove('hidden')
  } else if (currentRole === 'admin') {
    console.log('🔴 Showing Admin Dashboard')
    if (adminDashboard) adminDashboard.classList.remove('hidden')
  } else {
    console.log('🔴 Showing Retailer Dashboard')
    if (retailerDashboard) retailerDashboard.classList.remove('hidden')
  }
  
  showLoading(false)
}

// ============================================
// SHOW LOGIN SCREEN
// ============================================
function showPhoneLogin() {
  console.log('📱 Showing phone login screen')
  
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
  
  // Reset OTP step
  const phoneStep = document.getElementById('phoneStep')
  const otpStep = document.getElementById('otpStep')
  const otpCode = document.getElementById('otpCode')
  const phoneNumber = document.getElementById('phoneNumber')
  
  if (phoneStep) phoneStep.classList.remove('hidden')
  if (otpStep) otpStep.classList.add('hidden')
  if (otpCode) otpCode.value = ''
  if (phoneNumber) phoneNumber.value = ''
  
  pendingOTP = null
  currentPhone = ''
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
    
    // Get signup info
    const signupName = document.getElementById('signupName')
    const signupLocation = document.getElementById('signupLocation')
    const name = signupName?.value.trim() || 'User'
    const location = signupLocation?.value.trim() || ''
    
    // Store for later
    sessionStorage.setItem('signupName', name)
    sessionStorage.setItem('signupLocation', location)
    sessionStorage.setItem('signupRole', currentRole)
    
    // Format phone number
    let formattedPhone = phone
    if (!phone.startsWith('+')) {
      formattedPhone = '+255' + phone.replace(/^0+/, '')
    }
    
    const success = await sendOTP(formattedPhone)
    
    if (success) {
      // Switch to OTP step
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
    
    console.log('🔵 Entered OTP:', otp)
    console.log('🔵 Expected OTP:', pendingOTP)
    
    if (otp === pendingOTP) {
      console.log('✅ OTP MATCHED!')
      
      // Get role from session storage
      const role = sessionStorage.getItem('signupRole') || currentRole
      currentRole = role
      
      alert('Login successful! Redirecting to dashboard...')
      forceRedirectToDashboard()
    } else {
      alert('Invalid verification code. Please try again.')
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
const retailerBtn = document.getElementById('phoneRoleRetailer')
const distributorBtn = document.getElementById('phoneRoleDistributor')

if (retailerBtn) {
  retailerBtn.addEventListener('click', () => {
    currentRole = 'retailer'
    retailerBtn.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    if (distributorBtn) distributorBtn.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

if (distributorBtn) {
  distributorBtn.addEventListener('click', () => {
    currentRole = 'distributor'
    distributorBtn.className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
    if (retailerBtn) retailerBtn.className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
  })
}

// ============================================
// LANGUAGE SELECTION
// ============================================
window.selectLanguage = function(lang) {
  console.log('🌐 Language selected:', lang)
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
// LOGOUT
// ============================================
function handleLogout() {
  console.log('🚪 Logging out...')
  showPhoneLogin()
}

const logoutBtn = document.getElementById('logoutBtn')
const logoutBtn2 = document.getElementById('logoutBtn2')
const adminLogoutBtn = document.getElementById('adminLogoutBtn')

if (logoutBtn) logoutBtn.addEventListener('click', handleLogout)
if (logoutBtn2) logoutBtn2.addEventListener('click', handleLogout)
if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', handleLogout)

// ============================================
// CART MODAL
// ============================================
const showCartBtn = document.getElementById('showCartBtn')
if (showCartBtn) {
  showCartBtn.addEventListener('click', () => {
    const cartModal = document.getElementById('cartModal')
    if (cartModal) cartModal.classList.remove('hidden')
  })
}

// ============================================
// CLOSE MODAL FUNCTION
// ============================================
window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) modal.classList.add('hidden')
}

// ============================================
// INITIALIZE
// ============================================
async function init() {
  console.log('🚀 Initializing BomaWave app...')
  // Show language selection screen first
  const languageScreen = document.getElementById('languageScreen')
  if (languageScreen) languageScreen.classList.remove('hidden')
}

init()
