// ============================================
// APP.JS WITH TRANSLATION
// ============================================

import { supabase } from './supabase.js'

// STATE
let currentRole = 'retailer'
let currentPhone = ''
let currentOTP = ''
let currentLang = 'en' // default

// TRANSLATION STRINGS
const translations = {
  en: {
    loading: 'Loading...',
    sendOtp: 'Sending OTP...',
    verifyOtp: 'Verifying OTP...',
    enterPhone: 'Enter phone number',
    enterOtp: 'Enter 6-digit code',
    failedSend: 'Failed to send OTP',
    failedVerify: 'Failed to verify OTP',
    user: 'User',
  },
  sw: {
    loading: 'Inapakia...',
    sendOtp: 'Kutuma OTP...',
    verifyOtp: 'Kuthibitisha OTP...',
    enterPhone: 'Weka namba ya simu',
    enterOtp: 'Weka namba ya OTP yenye tarakimu 6',
    failedSend: 'Imeshindikana kutuma OTP',
    failedVerify: 'Imeshindikana kuthibitisha OTP',
    user: 'Mtumiaji',
  }
}

// HELPER: get translated text
function t(key) {
  return translations[currentLang][key] || key
}

// UI HELPERS
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

function showLoading(show, messageKey = 'loading') {
  const overlay = document.getElementById('loadingOverlay')
  const msg = document.getElementById('loadingMessage')
  if (!overlay) return
  if (show) {
    msg.textContent = t(messageKey)
    overlay.classList.remove('hidden')
    overlay.classList.add('flex')
  } else {
    overlay.classList.add('hidden')
    overlay.classList.remove('flex')
  }
}

// DASHBOARD HANDLER
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

// AUTH CHECK ON LOAD
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      hideAllScreens()
      document.getElementById('phoneLoginSection')?.classList.remove('hidden')
      return
    }
    goToDashboard(profile.role, profile)
  } else {
    hideAllScreens()
    document.getElementById('languageScreen')?.classList.remove('hidden')
  }
}

// SEND OTP
async function sendOTP(phone) {
  showLoading(true, 'sendOtp')
  try {
    const res = await fetch(
      'https://sutrnnlbmuxggbvfwrpk.supabase.co/functions/v1/send-sms-africastalking',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      }
    )
    const data = await res.json()
    showLoading(false)
    if (!res.ok) {
      console.error('Send OTP error:', data)
      alert(t('failedSend') + ': ' + (data.error || 'Unknown error'))
      return false
    }
    currentOTP = data.otp
    return true
  } catch (err) {
    showLoading(false)
    console.error('Send OTP fetch error:', err)
    alert(t('failedSend') + ': ' + err.message)
    return false
  }
}

// VERIFY OTP
async function verifyOTP() {
  const otp = document.getElementById('otpCode').value.trim()
  if (!otp || otp.length !== 6) {
    alert(t('enterOtp'))
    return
  }

  showLoading(true, 'verifyOtp')
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: currentPhone,
      token: otp,
      type: 'sms'
    })

    if (error) {
      showLoading(false)
      console.error('OTP verify error:', error)
      alert(error.message)
      return
    }

    if (data?.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      })
    }

    const user = data.user

    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      const name = document.getElementById('signupName')?.value || t('user')
      const location = document.getElementById('signupLocation')?.value || ''
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
        console.error('Insert profile error:', insertError)
        alert(insertError.message)
        return
      }
      profile = newProfile
    } else if (profileError) {
      showLoading(false)
      console.error('Profile fetch error:', profileError)
      alert(profileError.message)
      return
    }

    showLoading(false)
    goToDashboard(profile.role, profile)
  } catch (err) {
    showLoading(false)
    console.error('OTP verify exception:', err)
    alert(t('failedVerify') + ': ' + err.message)
  }
}

// EVENTS
window.selectLanguage = function(lang) {
  currentLang = lang
  hideAllScreens()
  document.getElementById('phoneLoginSection')?.classList.remove('hidden')
}

document.getElementById('phoneRoleRetailer')?.addEventListener('click', () => { currentRole = 'retailer' })
document.getElementById('phoneRoleDistributor')?.addEventListener('click', () => { currentRole = 'distributor' })
document.getElementById('sendOtpPhoneBtn')?.addEventListener('click', async () => {
  let phone = document.getElementById('phoneNumber').value.trim()
  if (!phone) { alert(t('enterPhone')); return }
  if (!phone.startsWith('+')) { phone = '+255' + phone.replace(/^0+/, '') }
  currentPhone = phone
  const ok = await sendOTP(phone)
  if (ok) {
    document.getElementById('phoneStep').classList.add('hidden')
    document.getElementById('otpStep').classList.remove('hidden')
  }
})
document.getElementById('verifyOtpBtn')?.addEventListener('click', verifyOTP)
document.getElementById('backToPhoneBtn')?.addEventListener('click', () => {
  document.getElementById('otpStep').classList.add('hidden')
  document.getElementById('phoneStep').classList.remove('hidden')
})
document.getElementById('logoutBtn')?.addEventListener('click', async () => { await supabase.auth.signOut(); location.reload() })
document.getElementById('logoutBtn2')?.addEventListener('click', async () => { await supabase.auth.signOut(); location.reload() })

window.addEventListener('load', checkAuth)
