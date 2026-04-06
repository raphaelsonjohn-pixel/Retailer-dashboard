// ============================================
// BomaWave AUTH FLOW (FINAL STABLE VERSION)
// ============================================

// EDGE FUNCTION
const EDGE_FUNCTION_URL = 'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/send-sms-africastalking'

// ============================================
// STATE
// ============================================
let currentLanguage = 'en'
let currentRole = 'retailer'
let currentPhone = ''
let pendingOTP = null

// ============================================
// SAFE DOM HELPER (IMPORTANT FIX)
// ============================================
function el(id) {
  return document.getElementById(id)
}

// ============================================
// SESSION MANAGEMENT
// ============================================
function saveSession(user) {
  localStorage.setItem('bomaUser', JSON.stringify(user))
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('bomaUser'))
  } catch {
    return null
  }
}

function clearSession() {
  localStorage.removeItem('bomaUser')
}

// ============================================
// UI CONTROL
// ============================================
function hideAllScreens() {
  const screens = [
    'languageScreen',
    'phoneLoginSection',
    'distributorDashboard',
    'retailerDashboard',
    'adminDashboard'
  ]

  screens.forEach(id => el(id)?.classList.add('hidden'))
}

function showLoading(show, message = 'Loading...') {
  if (!el('loadingOverlay')) return

  if (show) {
    el('loadingMessage').textContent = message
    el('loadingOverlay').classList.remove('hidden')
    el('loadingOverlay').classList.add('flex')
  } else {
    el('loadingOverlay').classList.add('hidden')
    el('loadingOverlay').classList.remove('flex')
  }
}

// ============================================
// DASHBOARD NAVIGATION
// ============================================
function goToDashboard(role, user = null) {
  console.log('➡️ Redirect:', role)

  if (user) saveSession(user)

  hideAllScreens()

  if (role === 'distributor') {
    el('distributorDashboard')?.classList.remove('hidden')
    if (user) el('distributorEmail').textContent = user.phone
  } else {
    el('retailerDashboard')?.classList.remove('hidden')
    if (user) el('retailerEmail').textContent = user.phone
  }
}

// ============================================
// RESET LOGIN FLOW
// ============================================
function showLogin() {
  clearSession()

  hideAllScreens()

  el('languageScreen')?.classList.remove('hidden')

  // Reset steps
  el('phoneStep')?.classList.remove('hidden')
  el('otpStep')?.classList.add('hidden')

  if (el('otpCode')) el('otpCode').value = ''
  if (el('phoneNumber')) el('phoneNumber').value = ''
}

// ============================================
// CHECK SESSION ON LOAD
// ============================================
function checkAuth() {
  const user = getSession()

  if (user && user.phone && user.role) {
    console.log('✅ Session restored')
    goToDashboard(user.role, user)
  } else {
    console.log('❌ No session')
    el('languageScreen')?.classList.remove('hidden')
  }
}

// ============================================
// SEND OTP
// ============================================
async function sendOTP(phone) {
  showLoading(true, 'Sending code...')

  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })

    const data = await res.json()

    showLoading(false)

    if (data.success) {
      pendingOTP = String(data.otp)
      currentPhone = phone

      console.log('OTP:', pendingOTP)

      alert('OTP sent. Check simulator.')
      return true
    } else {
      alert(data.error || 'Failed to send OTP')
      return false
    }

  } catch (err) {
    showLoading(false)
    alert('Network error')
    return false
  }
}

// ============================================
// EVENTS SETUP (SAFE BINDING)
// ============================================
function setupEvents() {

  // Language
  window.selectLanguage = function (lang) {
    currentLanguage = lang
    el('languageScreen')?.classList.add('hidden')
    el('phoneLoginSection')?.classList.remove('hidden')
  }

  // Role
  el('phoneRoleRetailer')?.addEventListener('click', () => {
    currentRole = 'retailer'
  })

  el('phoneRoleDistributor')?.addEventListener('click', () => {
    currentRole = 'distributor'
  })

  // SEND OTP
  el('sendOtpPhoneBtn')?.addEventListener('click', async () => {
    let phone = el('phoneNumber')?.value.trim()

    if (!phone) {
      alert('Enter phone number')
      return
    }

    if (!phone.startsWith('+')) {
      phone = '+255' + phone.replace(/^0+/, '')
    }

    const ok = await sendOTP(phone)

    if (ok) {
      el('phoneStep')?.classList.add('hidden')
      el('otpStep')?.classList.remove('hidden')
    }
  })

  // VERIFY OTP
  el('verifyOtpBtn')?.addEventListener('click', () => {
    const otp = el('otpCode')?.value.trim()

    if (!otp || otp.length !== 6) {
      alert('Enter valid 6-digit code')
      return
    }

    if (otp !== pendingOTP) {
      alert('Invalid OTP')
      return
    }

    const name = el('signupName')?.value || 'User'
    const location = el('signupLocation')?.value || ''

    const user = {
      phone: currentPhone,
      name,
      location,
      role: currentRole
    }

    alert('Login successful')

    goToDashboard(currentRole, user)
  })

  // BACK
  el('backToPhoneBtn')?.addEventListener('click', () => {
    el('otpStep')?.classList.add('hidden')
    el('phoneStep')?.classList.remove('hidden')
  })

  // LOGOUT
  el('logoutBtn')?.addEventListener('click', showLogin)
  el('logoutBtn2')?.addEventListener('click', showLogin)
  el('adminLogoutBtn')?.addEventListener('click', showLogin)
}

// ============================================
// INIT
// ============================================
window.addEventListener('load', () => {
  setupEvents()
  checkAuth()
})
