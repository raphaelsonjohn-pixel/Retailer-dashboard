// ============================================
// BomaWave FINAL AUTH FLOW (FULL CLEAN VERSION)
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
// SESSION MANAGEMENT
// ============================================
function saveSession(user) {
  localStorage.setItem('bomaUser', JSON.stringify(user))
}

function getSession() {
  return JSON.parse(localStorage.getItem('bomaUser'))
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

  screens.forEach(id => {
    document.getElementById(id)?.classList.add('hidden')
  })
}

function showLoading(show, message = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay')
  const msg = document.getElementById('loadingMessage')

  if (!overlay) return

  if (show) {
    msg.textContent = message
    overlay.classList.remove('hidden')
    overlay.classList.add('flex')
  } else {
    overlay.classList.add('hidden')
    overlay.classList.remove('flex')
  }
}

// ============================================
// DASHBOARD NAVIGATION (CORE FIX)
// ============================================
function goToDashboard(role, user = null) {
  console.log('Redirecting to:', role)

  if (user) saveSession(user)

  hideAllScreens()

  if (role === 'distributor') {
    document.getElementById('distributorDashboard')?.classList.remove('hidden')
    document.getElementById('distributorEmail').textContent = user?.phone || ''
  } else {
    document.getElementById('retailerDashboard')?.classList.remove('hidden')
    document.getElementById('retailerEmail').textContent = user?.phone || ''
  }
}

// ============================================
// LOGIN RESET
// ============================================
function showLogin() {
  clearSession()

  hideAllScreens()

  document.getElementById('languageScreen')?.classList.remove('hidden')

  // Reset steps
  document.getElementById('phoneStep')?.classList.remove('hidden')
  document.getElementById('otpStep')?.classList.add('hidden')

  document.getElementById('otpCode').value = ''
  document.getElementById('phoneNumber').value = ''
}

// ============================================
// CHECK SESSION ON LOAD
// ============================================
function checkAuth() {
  const user = getSession()

  if (user) {
    goToDashboard(user.role, user)
  } else {
    document.getElementById('languageScreen')?.classList.remove('hidden')
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
      pendingOTP = data.otp
      currentPhone = phone

      alert('OTP sent. Check simulator.')
      return true
    } else {
      alert(data.error || 'Failed')
      return false
    }

  } catch (err) {
    showLoading(false)
    alert('Network error')
    return false
  }
}

// ============================================
// EVENTS
// ============================================

// Language select
window.selectLanguage = function (lang) {
  currentLanguage = lang

  document.getElementById('languageScreen').classList.add('hidden')
  document.getElementById('phoneLoginSection').classList.remove('hidden')
}

// Role select
document.getElementById('phoneRoleRetailer')?.addEventListener('click', () => {
  currentRole = 'retailer'
})

document.getElementById('phoneRoleDistributor')?.addEventListener('click', () => {
  currentRole = 'distributor'
})

// Send OTP
document.getElementById('sendOtpPhoneBtn')?.addEventListener('click', async () => {
  let phone = document.getElementById('phoneNumber').value.trim()

  if (!phone) {
    alert('Enter phone number')
    return
  }

  // Format Tanzanian number
  if (!phone.startsWith('+')) {
    phone = '+255' + phone.replace(/^0+/, '')
  }

  const ok = await sendOTP(phone)

  if (ok) {
    document.getElementById('phoneStep').classList.add('hidden')
    document.getElementById('otpStep').classList.remove('hidden')
  }
})

// Verify OTP
document.getElementById('verifyOtpBtn')?.addEventListener('click', () => {
  const otp = document.getElementById('otpCode').value.trim()

  if (!otp || otp.length !== 6) {
    alert('Enter valid 6-digit code')
    return
  }

  if (otp !== pendingOTP) {
    alert('Invalid OTP')
    return
  }

  const name = document.getElementById('signupName').value || 'User'
  const location = document.getElementById('signupLocation').value || ''

  const user = {
    phone: currentPhone,
    name,
    location,
    role: currentRole
  }

  alert('Login successful')

  goToDashboard(currentRole, user)
})

// Back button
document.getElementById('backToPhoneBtn')?.addEventListener('click', () => {
  document.getElementById('otpStep').classList.add('hidden')
  document.getElementById('phoneStep').classList.remove('hidden')
})

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', showLogin)
document.getElementById('logoutBtn2')?.addEventListener('click', showLogin)
document.getElementById('adminLogoutBtn')?.addEventListener('click', showLogin)

// ============================================
// INIT
// ============================================
window.addEventListener('load', () => {
  checkAuth()
})
