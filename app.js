import { supabase } from './supabase.js'

// ============================================
// STATE
// ============================================
let currentRole = 'retailer'
let currentPhone = ''

// ============================================
// UI HELPERS
// ============================================
function hideAllScreens() {
  const screens = [
    'languageScreen',
    'phoneLoginSection',
    'distributorDashboard',
    'retailerDashboard'
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
// DASHBOARD
// ============================================
function goToDashboard(role, user) {
  hideAllScreens()

  if (role === 'distributor') {
    document.getElementById('distributorDashboard')?.classList.remove('hidden')
    document.getElementById('distributorEmail').textContent = user.phone || ''
  } else {
    document.getElementById('retailerDashboard')?.classList.remove('hidden')
    document.getElementById('retailerEmail').textContent = user.phone || ''
  }
}

// ============================================
// AUTH CHECK (CRITICAL)
// ============================================
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      goToDashboard(profile.role, profile)
    }
  } else {
    document.getElementById('languageScreen')?.classList.remove('hidden')
  }
}

// ============================================
// SEND OTP (REAL)
// ============================================
async function sendOTP(phone) {
  showLoading(true, 'Sending OTP...')

  const { error } = await supabase.auth.signInWithOtp({
    phone: phone
  })

  showLoading(false)

  if (error) {
    alert(error.message)
    return false
  }

  return true
}

// ============================================
// VERIFY OTP (REAL)
// ============================================
async function verifyOTP() {
  const otp = document.getElementById('otpCode').value.trim()

  if (!otp || otp.length !== 6) {
    alert('Enter valid 6-digit code')
    return
  }

  showLoading(true, 'Verifying...')

  const { data, error } = await supabase.auth.verifyOtp({
    phone: currentPhone,
    token: otp,
    type: 'sms'
  })

  if (error) {
    showLoading(false)
    alert(error.message)
    return
  }

  const user = data.user

  // Check if profile exists
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If not → create one
  if (!profile) {
    const name = document.getElementById('signupName').value || 'User'
    const location = document.getElementById('signupLocation').value || ''

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        phone: currentPhone,
        name,
        location,
        role: currentRole
      }])
      .select()
      .single()

    if (insertError) {
      showLoading(false)
      alert(insertError.message)
      return
    }

    profile = newProfile
  }

  showLoading(false)

  goToDashboard(profile.role, profile)
}

// ============================================
// EVENTS
// ============================================

// Language select
window.selectLanguage = function () {
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

  if (!phone.startsWith('+')) {
    phone = '+255' + phone.replace(/^0+/, '')
  }

  currentPhone = phone

  const ok = await sendOTP(phone)

  if (ok) {
    document.getElementById('phoneStep').classList.add('hidden')
    document.getElementById('otpStep').classList.remove('hidden')
  }
})

// Verify OTP
document.getElementById('verifyOtpBtn')?.addEventListener('click', verifyOTP)

// Back
document.getElementById('backToPhoneBtn')?.addEventListener('click', () => {
  document.getElementById('otpStep').classList.add('hidden')
  document.getElementById('phoneStep').classList.remove('hidden')
})

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await supabase.auth.signOut()
  location.reload()
})

document.getElementById('logoutBtn2')?.addEventListener('click', async () => {
  await supabase.auth.signOut()
  location.reload()
})

// INIT
window.addEventListener('load', checkAuth)
