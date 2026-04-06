// ============================================
// app.js
// ============================================
import { supabase } from './supabase.js'

// ============================================
// STATE
// ============================================
let currentRole = 'retailer'
let currentPhone = ''
let currentLanguage = 'en' // default language

// ============================================
// UI HELPERS
// ============================================
function hideAllScreens() {
  const screens = [
    'languageScreen',
    'phoneLoginSection',
    'otpStep',
    'distributorDashboard',
    'retailerDashboard'
  ]
  screens.forEach(id => document.getElementById(id)?.classList.add('hidden'))
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

function translate(text) {
  const translations = {
    en: {
      enterPhone: 'Enter phone number',
      sendOTP: 'Send OTP',
      enterOTP: 'Enter OTP',
      verifyOTP: 'Verify OTP',
      loading: 'Loading...',
    },
    sw: {
      enterPhone: 'Weka namba ya simu',
      sendOTP: 'Tuma OTP',
      enterOTP: 'Weka OTP',
      verifyOTP: 'Thibitisha OTP',
      loading: 'Inapakia...',
    }
  }
  return translations[currentLanguage][text] || text
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
// AUTH CHECK
// ============================================
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (profile) goToDashboard(profile.role, profile)
  } else {
    document.getElementById('languageScreen')?.classList.remove('hidden')
  }
}

// ============================================
// SEND OTP (via Edge Function)
// ============================================
async function sendOTP(phone) {
  showLoading(true, translate('loading'))
  try {
    const res = await fetch('https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/send-sms-africastalking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
    showLoading(false)
    return true
  } catch (error) {
    showLoading(false)
    console.error('Send OTP error:', error)
    alert(error.message)
    return false
  }
}

// ============================================
// VERIFY OTP
// ============================================
async function verifyOTP() {
  const otp = document.getElementById('otpCode').value.trim()
  if (!otp || otp.length !== 6) {
    alert('Enter valid 6-digit OTP')
    return
  }
  showLoading(true, translate('loading'))

  try {
    const { data: { user }, error } = await supabase.auth.verifyOtp({
      phone: currentPhone,
      token: otp,
      type: 'sms'
    })
    if (error) throw error

    // Get or create profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      const name = document.getElementById('signupName')?.value || 'User'
      const location = document.getElementById('signupLocation')?.value || ''
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: user.id, phone: currentPhone, name, location, role: currentRole }])
        .select()
        .single()
      if (insertError) throw insertError
      profile = newProfile
    }

    showLoading(false)
    goToDashboard(profile.role, profile)

  } catch (error) {
    showLoading(false)
    console.error('Verify OTP error:', error)
    alert(error.message)
  }
}

// ============================================
// EVENTS
// ============================================

// Language selection
window.selectLanguage = function(lang) {
  currentLanguage = lang
  document.getElementById('languageScreen')?.classList.add('hidden')
  document.getElementById('phoneLoginSection')?.classList.remove('hidden')
}

// Role select
document.getElementById('phoneRoleRetailer')?.addEventListener('click', () => currentRole = 'retailer')
document.getElementById('phoneRoleDistributor')?.addEventListener('click', () => currentRole = 'distributor')

// Send OTP
document.getElementById('sendOtpPhoneBtn')?.addEventListener('click', async () => {
  let phone = document.getElementById('phoneNumber').value.trim()
  if (!phone) { alert(translate('enterPhone')); return }
  if (!phone.startsWith('+')) phone = '+255' + phone.replace(/^0+/, '')
  currentPhone = phone
  const ok = await sendOTP(phone)
  if (ok) {
    document.getElementById('phoneStep')?.classList.add('hidden')
    document.getElementById('otpStep')?.classList.remove('hidden')
  }
})

// Verify OTP
document.getElementById('verifyOtpBtn')?.addEventListener('click', verifyOTP)

// Back button
document.getElementById('backToPhoneBtn')?.addEventListener('click', () => {
  document.getElementById('otpStep')?.classList.add('hidden')
  document.getElementById('phoneStep')?.classList.remove('hidden')
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
