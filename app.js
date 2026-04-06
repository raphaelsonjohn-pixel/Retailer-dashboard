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
    alert('Error: Could not send verification code. Please try again.')
    return false
  }
}

function forceRedirectToDashboard() {
  console.log('🔴 FORCE REDIRECT: Redirecting to dashboard...')
  
  document.getElementById('languageScreen')?.classList.add('hidden')
  document.getElementById('loginSection')?.classList.add('hidden')
  document.getElementById('phoneLoginSection')?.classList.add('hidden')
  document.getElementById('phoneStep')?.classList.add('hidden')
  document.getElementById('otpStep')?.classList.add('hidden')
  
  if (currentRole === 'distributor') {
    document.getElementById('distributorDashboard')?.classList.remove('hidden')
  } else {
    document.getElementById('retailerDashboard')?.classList.remove('hidden')
  }
  
  showLoading(false)
}

function showPhoneLogin() {
  document.getElementById('languageScreen')?.classList.add('hidden')
  document.getElementById('loginSection')?.classList.add('hidden')
  document.getElementById('phoneLoginSection')?.classList.remove('hidden')
  document.getElementById('distributorDashboard')?.classList.add('hidden')
  document.getElementById('retailerDashboard')?.classList.add('hidden')
  document.getElementById('adminDashboard')?.classList.add('hidden')
  document.getElementById('phoneStep')?.classList.remove('hidden')
  document.getElementById('otpStep')?.classList.add('hidden')
  document.getElementById('otpCode').value = ''
  document.getElementById('phoneNumber').value = ''
  pendingOTP = null
}

// Send OTP button
document.getElementById('sendOtpPhoneBtn')?.addEventListener('click', async () => {
  const phone = document.getElementById('phoneNumber').value.trim()
  if (!phone) {
    alert('Enter your phone number')
    return
  }
  
  const name = document.getElementById('signupName')?.value.trim() || 'User'
  const location = document.getElementById('signupLocation')?.value.trim() || ''
  
  sessionStorage.setItem('signupName', name)
  sessionStorage.setItem('signupLocation', location)
  
  let formattedPhone = phone
  if (!phone.startsWith('+')) {
    formattedPhone = '+255' + phone.replace(/^0+/, '')
  }
  
  const success = await sendOTP(formattedPhone)
  if (success) {
    document.getElementById('phoneStep')?.classList.add('hidden')
    document.getElementById('otpStep')?.classList.remove('hidden')
  }
})

// Verify OTP button
document.getElementById('verifyOtpBtn')?.addEventListener('click', async () => {
  const otp = document.getElementById('otpCode').value.trim()
  if (!otp || otp.length !== 6) {
    alert('Enter 6-digit verification code')
    return
  }
  
  if (otp === pendingOTP) {
    alert('Login successful! Redirecting to dashboard...')
    forceRedirectToDashboard()
  } else {
    alert('Invalid verification code. Please try again.')
  }
})

// Back button
document.getElementById('backToPhoneBtn')?.addEventListener('click', () => {
  document.getElementById('phoneStep')?.classList.remove('hidden')
  document.getElementById('otpStep')?.classList.add('hidden')
  document.getElementById('otpCode').value = ''
})

// Role selection
document.getElementById('phoneRoleRetailer')?.addEventListener('click', () => {
  currentRole = 'retailer'
  document.getElementById('phoneRoleRetailer').className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
  document.getElementById('phoneRoleDistributor').className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
})

document.getElementById('phoneRoleDistributor')?.addEventListener('click', () => {
  currentRole = 'distributor'
  document.getElementById('phoneRoleDistributor').className = 'flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl'
  document.getElementById('phoneRoleRetailer').className = 'flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl'
})

// Language selection
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
  
  const retailerBtn = document.getElementById('phoneRoleRetailer')
  const distributorBtn = document.getElementById('phoneRoleDistributor')
  if (retailerBtn) retailerBtn.textContent = t('retailer')
  if (distributorBtn) distributorBtn.textContent = t('distributor')
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => showPhoneLogin())
document.getElementById('logoutBtn2')?.addEventListener('click', () => showPhoneLogin())
document.getElementById('adminLogoutBtn')?.addEventListener('click', () => showPhoneLogin())

// Cart modal
document.getElementById('showCartBtn')?.addEventListener('click', () => {
  document.getElementById('cartModal')?.classList.remove('hidden')
})

window.closeModal = function(modalId) {
  document.getElementById(modalId)?.classList.add('hidden')
}

// Initialize
document.getElementById('languageScreen')?.classList.remove('hidden')
