// app.js - SIMPLIFIED DEBUG VERSION
import { supabase } from './supabase.js'

// Force redirect handling
;(async function init() {
  console.log('App starting...')
  
  // Check if we have a magic link hash
  const hash = window.location.hash
  if (hash && hash.includes('access_token')) {
    console.log('Magic link detected!')
    
    // Show loading
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">Logging you in...</div>'
    
    // Clear the hash from URL
    window.history.replaceState({}, document.title, window.location.pathname)
    
    // Get session after delay
    setTimeout(async () => {
      const { data, error } = await supabase.auth.getSession()
      console.log('Session check:', data?.session ? 'Found' : 'Not found', error)
      
      if (data?.session) {
        console.log('User:', data.session.user.email)
        // Success - show success message
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;flex-direction:column"><div style="color:#10B981;font-size:48px;">✓</div><div>Login successful! Redirecting...</div></div>'
        setTimeout(() => {
          window.location.href = window.location.pathname + '?logged_in=true'
        }, 1000)
      } else {
        console.log('No session, showing login')
        window.location.reload()
      }
    }, 2000)
  } else if (window.location.search.includes('logged_in=true')) {
    // Already logged in
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">✓ Login successful! You are now logged in.</div>'
    console.log('User is logged in')
  } else {
    // Normal flow - show login screen
    document.body.innerHTML = `
      <div style="max-width:400px;margin:50px auto;padding:20px;font-family:sans-serif">
        <h1 style="color:#10B981;text-align:center;">BomaWave</h1>
        <p style="text-align:center;color:#666;margin-bottom:20px;">FMCG Distribution Platform</p>
        <input type="email" id="email" placeholder="Email address" style="width:100%;padding:12px;margin:10px 0;border:1px solid #ddd;border-radius:8px;font-size:16px;" />
        <button id="loginBtn" style="width:100%;padding:12px;background:#10B981;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">Send Login Link</button>
        <div id="message" style="margin-top:15px;text-align:center;color:#666;"></div>
      </div>
    `
    
    document.getElementById('loginBtn').onclick = async () => {
      const email = document.getElementById('email').value
      if (!email) {
        document.getElementById('message').innerText = 'Please enter your email'
        return
      }
      
      document.getElementById('message').innerText = 'Sending login link...'
      document.getElementById('loginBtn').disabled = true
      
      const redirectUrl = window.location.origin
      console.log('Sending magic link to:', email)
      console.log('Redirect URL:', redirectUrl)
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl
        }
      })
      
      if (error) {
        console.error('Error:', error)
        document.getElementById('message').innerText = 'Error: ' + error.message
        document.getElementById('loginBtn').disabled = false
      } else {
        document.getElementById('message').innerHTML = '✓ Login link sent! Check your email (and spam folder).'
        document.getElementById('loginBtn').disabled = false
      }
    }
  }
})()
