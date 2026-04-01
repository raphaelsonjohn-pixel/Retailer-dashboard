// app.js
import { supabase } from './supabase.js'

// DOM elements
const nameInput = document.getElementById('name')
const emailInput = document.getElementById('email')
const locationInput = document.getElementById('location')
const sendOtpBtn = document.getElementById('sendOtp')
const loadProductsBtn = document.getElementById('loadProducts')
const productList = document.getElementById('productList')
const dashboard = document.getElementById('dashboard')

// ---------- 0️⃣ Handle login after magic link ----------
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    console.log("User logged in:", session.user)
    await loadDashboard()
  }
})

// ---------- 1️⃣ Send Email Magic Link ----------
sendOtpBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim()
  if (!email) return alert('Enter your email')

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) return alert('Enter a valid email address')

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: "https://retailer-dashboard-gilt.vercel.app"
    }
  })

  if (error) return alert('Error sending login link: ' + error.message)

  alert('Check your email for the login link!')
})

// ---------- 2️⃣ Load Dashboard (auto after login) ----------
async function loadDashboard() {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return

  // ---------- 2a. Save retailer if not exists ----------
  const { data: retailer, error: retailerError } = await supabase
    .from('retailers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!retailer) {
    const { error: insertError } = await supabase.from('retailers').insert([{
      id: user.id,
      email: user.email,
      name: nameInput?.value || 'Unknown',
      location: locationInput?.value || 'Not set',
      created_at: new Date()
    }])

    if (insertError) {
      alert('Error saving retailer: ' + insertError.message)
      return
    }
  }

  // ---------- 2b. Load products ----------
  const { data: products, error: productsError } = await supabase
    .from('retailer_products')
    .select('*')
    .eq('retailer_id', user.id)

  if (productsError) {
    alert('Error loading products: ' + productsError.message)
    return
  }

  // ---------- 2c. Display products ----------
  productList.innerHTML = ''

  if (!products || products.length === 0) {
    productList.innerHTML = '<li>No products found</li>'
  } else {
    products.forEach(p => {
      const li = document.createElement('li')
      li.textContent = `${p.product_name} - ${p.quantity}`
      productList.appendChild(li)
    })
  }

  // ---------- 2d. Show dashboard ----------
  if (dashboard) {
    dashboard.style.display = 'block'
  }
}
