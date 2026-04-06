import { supabase } from './supabase.js';

// ============================================
// STATE
// ============================================
let currentRole = 'retailer';
let currentPhone = '';
let currentLanguage = 'en';

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
  ];
  screens.forEach(id => document.getElementById(id)?.classList.add('hidden'));
}

function showLoading(show, message = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay');
  const msg = document.getElementById('loadingMessage');
  if (!overlay) return;
  if (show) {
    msg.textContent = message;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  } else {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }
}

// ============================================
// TRANSLATION
// ============================================
const translations = {
  en: { sendOtp: 'Send OTP', enterPhone: 'Enter phone number', verifyOtp: 'Verify OTP', enterOtp: 'Enter 6-digit OTP', back: 'Back', loading: 'Loading...', retailer: 'Retailer', distributor: 'Distributor' },
  sw: { sendOtp: 'Tuma OTP', enterPhone: 'Weka namba ya simu', verifyOtp: 'Thibitisha OTP', enterOtp: 'Weka namba ya OTP yenye tarakimu 6', back: 'Rudi', loading: 'Inapakia...', retailer: 'Muuza', distributor: 'Mwagaji' }
};

function translateUI() {
  const t = translations[currentLanguage];
  document.getElementById('sendOtpPhoneBtn').textContent = t.sendOtp;
  document.getElementById('phoneNumber').placeholder = t.enterPhone;
  document.getElementById('verifyOtpBtn').textContent = t.verifyOtp;
  document.getElementById('otpCode').placeholder = t.enterOtp;
  document.getElementById('backToPhoneBtn').textContent = t.back;
  document.getElementById('phoneRoleRetailer').textContent = t.retailer;
  document.getElementById('phoneRoleDistributor').textContent = t.distributor;
}

// ============================================
// DASHBOARD
// ============================================
function goToDashboard(role, profile) {
  hideAllScreens();
  if (role === 'distributor') {
    document.getElementById('distributorDashboard')?.classList.remove('hidden');
    document.getElementById('distributorEmail').textContent = profile.phone || '';
  } else {
    document.getElementById('retailerDashboard')?.classList.remove('hidden');
    document.getElementById('retailerEmail').textContent = profile.phone || '';
  }
}

// ============================================
// SEND OTP
// ============================================
async function sendOTP(phone) {
  showLoading(true, translations[currentLanguage].loading);
  try {
    const res = await fetch('https://YOUR_EDGE_FUNCTION_URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    showLoading(false);
    return true;
  } catch (err) {
    showLoading(false);
    alert(err.message);
    return false;
  }
}

// ============================================
// VERIFY OTP
// ============================================
async function verifyOTP() {
  const otp = document.getElementById('otpCode').value.trim();
  if (!otp || otp.length !== 6) { alert('Enter valid 6-digit OTP'); return; }

  showLoading(true, translations[currentLanguage].loading);
  try {
    const res = await fetch('https://YOUR_EDGE_FUNCTION_URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentPhone, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OTP verification failed');

    // Insert profile to Supabase if not exists
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', currentPhone)
      .single();

    if (!profile) {
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert([{ phone: currentPhone, role: currentRole, name: 'User', location: '' }])
        .select()
        .single();
      if (error) { alert(error.message); showLoading(false); return; }
      profile = newProfile;
    }

    showLoading(false);
    goToDashboard(currentRole, profile);
  } catch (err) { showLoading(false); alert(err.message); }
}

// ============================================
// EVENTS
// ============================================
document.getElementById('selectEnglish')?.addEventListener('click', () => { currentLanguage = 'en'; translateUI(); hideAllScreens(); document.getElementById('phoneLoginSection')?.classList.remove('hidden'); });
document.getElementById('selectSwahili')?.addEventListener('click', () => { currentLanguage = 'sw'; translateUI(); hideAllScreens(); document.getElementById('phoneLoginSection')?.classList.remove('hidden'); });

document.getElementById('phoneRoleRetailer')?.addEventListener('click', () => currentRole = 'retailer');
document.getElementById('phoneRoleDistributor')?.addEventListener('click', () => currentRole = 'distributor');

document.getElementById('sendOtpPhoneBtn')?.addEventListener('click', async () => {
  let phone = document.getElementById('phoneNumber').value.trim();
  if (!phone) { alert('Enter phone number'); return; }
  if (!phone.startsWith('+')) phone = '+255' + phone.replace(/^0+/, '');
  currentPhone = phone;
  const ok = await sendOTP(phone);
  if (ok) { document.getElementById('phoneStep')?.classList.add('hidden'); document.getElementById('otpStep')?.classList.remove('hidden'); }
});

document.getElementById('verifyOtpBtn')?.addEventListener('click', verifyOTP);
document.getElementById('backToPhoneBtn')?.addEventListener('click', () => { document.getElementById('otpStep')?.classList.add('hidden'); document.getElementById('phoneStep')?.classList.remove('hidden'); });
document.getElementById('logoutBtn')?.addEventListener('click', () => location.reload());
document.getElementById('logoutBtn2')?.addEventListener('click', () => location.reload());

// INIT
window.addEventListener('load', translateUI);
