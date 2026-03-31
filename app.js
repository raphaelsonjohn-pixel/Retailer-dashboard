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

// ---------- 1️⃣ Send Email Magic Link ----------
sendOtpBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim()
  if (!email) return alert('Enter your email')

  // Optional: simple email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) return alert('Enter a valid email address')

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: { emailRedirectTo:'https://retailer-dashboard-gilt.vercel.app' }
  })

  if (error) return alert('Error sending login link: ' + error.message)

  alert('Check your email for the login link!')
})

// ---------- 2️⃣ Load Dashboard ----------
loadProductsBtn.addEventListener('click', async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return alert('Please login first via the email link!')

  // ---------- 2a. Save retailer if not exists ----------
  const { data: retailer } = await supabase
    .from('retailers')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!retailer) {
    const { error: insertError } = await supabase.from('retailers').insert([{
      id: user.id,
      email: user.email,
      name: nameInput.value || 'Unknown',
      location: locationInput.value || 'Not set',
      created_at: new Date()
    }])
    if (insertError) return alert('Error saving retailer: ' + insertError.message)
  }

  // ---------- 2b. Load products ----------
  const { data: products, error: productsError } = await supabase
    .from('retailer_products')
    .select('*')
    .eq('retailer_id', user.id)

  if (productsError) return alert('Error loading products: ' + productsError.message)

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
  dashboard.style.display = 'block'
})
