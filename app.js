// app.js - Simple Phone/Email + Password Authentication (NO OTP)
import { supabase } from './supabase.js'

// ============================================
// STATE
// ============================================
let currentLanguage = null
let currentUser = null
let currentRole = 'retailer'

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  en: {
    phone: 'Phone Number',
    email: 'Email Address',
    password: 'Password',
    signup: 'Sign Up',
    login: 'Login',
    logout: 'Logout',
    loading: 'Loading...',
    retailer: 'Retailer',
    distributor: 'Distributor',
    name: 'Full Name',
    location: 'Location',
    welcome: 'Welcome!',
    loginSuccess: 'Login successful!',
    signupSuccess: 'Account created! Please login.',
    error: 'Error: ',
    noPhoneEmail: 'Enter phone number or email',
    noPassword: 'Enter password',
    noName: 'Enter your name'
  },
  sw: {
    phone: 'Namba ya Simu',
    email: 'Barua Pepe',
    password: 'Nenosiri',
    signup: 'Jiunge',
    login: 'Ingia',
    logout: 'Toka',
    loading: 'Inapakia...',
    retailer: 'Muuzaji',
    distributor: 'Msambazaji',
    name: 'Jina Kamili',
    location: 'Eneo',
    welcome: 'Karibu!',
    loginSuccess: 'Kuingia kumefanikiwa!',
    signupSuccess: 'Akaunti imeundwa! Tafadhali ingia.',
    error: 'Hitilafu: ',
    noPhoneEmail: 'Weka namba ya simu au barua pepe',
    noPassword: 'Weka nenosiri',
    noName: 'Weka jina lako'
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
// AUTHENTICATION (Phone/Email + Password)
// ============================================

// Sign Up
async function signUp(identifier, password, name, location, role) {
  showLoading(true, 'Creating account...')
  
  // Determine if identifier is phone or email
  const isEmail = identifier.includes('@')
  let formattedIdentifier = identifier
  
  if (!isEmail && !identifier.startsWith('+')) {
    formattedIdentifier = '+255' + identifier.replace(/^0+/, '')
  }
  
  const signUpData = isEmail 
    ? { email: formattedIdentifier, password }
    : { phone: formattedIdentifier, password }
  
  const { data, error } = await supabase.auth.signUp({
    ...signUpData,
    options: {
      data: { name, location, role }
    }
  })
  
  showLoading(false)
  
  if (error) {
    alert(t('error') + error.message)
    return false
  }
  
  if (data.user) {
    alert(t('signupSuccess'))
    return true
  }
  return false
}

// Login
async function login(identifier, password) {
  showLoading(true, 'Logging in...')
  
  const isEmail = identifier.includes('@')
  let formattedIdentifier = identifier
  
  if (!isEmail && !identifier.startsWith('+')) {
    formattedIdentifier = '+255' + identifier.replace(/^0+/, '')
  }
  
  const loginData = isEmail 
    ? { email: formattedIdentifier, password }
    : { phone: formattedIdentifier, password }
  
  const { data, error } = await supabase.auth.signInWithPassword(loginData)
  
  showLoading(false)
  
  if (error) {
    alert(t('error') + error.message)
    return false
  }
  
  if (data.session) {
    await loadUserData(data.user)
    alert(t('loginSuccess'))
    return true
  }
  return false
}

// Logout
async function logout() {
  await supabase.auth.signOut()
  currentUser = null
  currentRole = 'retailer'
  showLoginScreen()
}

// ============================================
// LOAD USER DATA & DASHBOARD
// ============================================
async function loadUserData(user) {
  showLoading(true, t('loading'))
  
  // Get profile from profiles table
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  
  if (!profile) {
    // Create profile if not exists
    const metadata = user.user_metadata || {}
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        phone: user.phone || metadata.phone,
        email: user.email,
        name: metadata.name || 'User',
        location: metadata.location || '',
        role: metadata.role || 'retailer'
      }])
      .select()
      .single()
    profile = newProfile
  }
  
  currentUser = profile
  currentRole = profile.role
  
  // Hide login screens
  document.getElementById('languageScreen')?.classList.add('hidden')
  document.getElementById('authSection')?.classList.add('hidden')
  
  // Show dashboard
  if (currentRole === 'distributor') {
    document.getElementById('distributorDashboard')?.classList.remove('hidden')
    loadDistributorData()
  } else if (currentRole === 'admin') {
    document.getElementById('adminDashboard')?.classList.remove('hidden')
  } else {
    document.getElementById('retailerDashboard')?.classList.remove('hidden')
    loadRetailerData()
  }
  
  showLoading(false)
}

// ============================================
// UI SCREENS
// ============================================
function showLoginScreen() {
  document.getElementById('languageScreen')?.classList.add('hidden')
  document.getElementById('authSection')?.classList.remove('hidden')
  document.getElementById('distributorDashboard')?.classList.add('hidden')
  document.getElementById('retailerDashboard')?.classList.add('hidden')
  document.getElementById('adminDashboard')?.classList.add('hidden')
  
  // Clear forms
  document.getElementById('loginIdentifier').value = ''
  document.getElementById('loginPassword').value = ''
  document.getElementById('signupIdentifier').value = ''
  document.getElementById('signupPassword').value = ''
  document.getElementById('signupName').value = ''
  document.getElementById('signupLocation').value = ''
}

// ============================================
// DASHBOARD DATA FUNCTIONS
// ============================================
async function loadDistributorData() {
  const container = document.getElementById('distributorProducts')
  if (container) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">Ready to add products. Your dashboard is working!</div>'
  }
}

async function loadRetailerData() {
  const container = document.getElementById('retailerProducts')
  if (container) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">Ready to shop. Your dashboard is working!</div>'
  }
}

// ============================================
// UPDATE UI TEXT
// ============================================
function updateUIText() {
  const elements = ['loginTitle', 'signupTitle', 'loginBtn', 'signupBtn']
  elements.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.textContent = t(id === 'loginBtn' ? 'login' : id === 'signupBtn' ? 'signup' : id)
  })
}

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('loginBtn')?.addEventListener('click', async () => {
  const identifier = document.getElementById('loginIdentifier').value.trim()
  const password = document.getElementById('loginPassword').value
  
  if (!identifier) {
    alert(t('noPhoneEmail'))
    return
  }
  if (!password) {
    alert(t('noPassword'))
    return
  }
  
  await login(identifier, password)
})

document.getElementById('signupBtn')?.addEventListener('click', async () => {
  const identifier = document.getElementById('signupIdentifier').value.trim()
  const password = document.getElementById('signupPassword').value
  const name = document.getElementById('signupName').value.trim()
  const location = document.getElementById('signupLocation').value.trim()
  const role = document.getElementById('signupRole').value
  
  if (!identifier) {
    alert(t('noPhoneEmail'))
    return
  }
  if (!password) {
    alert(t('noPassword'))
    return
  }
  if (!name) {
    alert(t('noName'))
    return
  }
  
  await signUp(identifier, password, name, location, role)
})

// Toggle between Login and Sign Up
document.getElementById('showSignup')?.addEventListener('click', () => {
  document.getElementById('loginForm').classList.add('hidden')
  document.getElementById('signupForm').classList.remove('hidden')
})

document.getElementById('showLogin')?.addEventListener('click', () => {
  document.getElementById('signupForm').classList.add('hidden')
  document.getElementById('loginForm').classList.remove('hidden')
})

// Role selection for signup
document.getElementById('signupRoleRetailer')?.addEventListener('click', () => {
  document.getElementById('signupRole').value = 'retailer'
  document.getElementById('signupRoleRetailer').className = 'flex-1 py-2 bg-green-600 text-white rounded-lg'
  document.getElementById('signupRoleDistributor').className = 'flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg'
})

document.getElementById('signupRoleDistributor')?.addEventListener('click', () => {
  document.getElementById('signupRole').value = 'distributor'
  document.getElementById('signupRoleDistributor').className = 'flex-1 py-2 bg-green-600 text-white rounded-lg'
  document.getElementById('signupRoleRetailer').className = 'flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg'
})

// Language selection
window.selectLanguage = function(lang) {
  currentLanguage = lang
  document.getElementById('languageScreen').classList.add('hidden')
  showLoginScreen()
  updateUIText()
}

// Logout handlers
document.getElementById('logoutBtn')?.addEventListener('click', logout)
document.getElementById('logoutBtn2')?.addEventListener('click', logout)
document.getElementById('adminLogoutBtn')?.addEventListener('click', logout)

// Cart modal
document.getElementById('showCartBtn')?.addEventListener('click', () => {
  document.getElementById('cartModal')?.classList.remove('hidden')
})

window.closeModal = function(modalId) {
  document.getElementById(modalId)?.classList.add('hidden')
}

// ============================================
// CHECK EXISTING SESSION
// ============================================
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    await loadUserData(session.user)
    return true
  }
  return false
}

// ============================================
// INITIALIZE
// ============================================
async function init() {
  const hasSession = await checkSession()
  if (!hasSession) {
    document.getElementById('languageScreen')?.classList.remove('hidden')
  }
}

init()
