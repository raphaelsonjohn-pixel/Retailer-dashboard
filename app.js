// ===========================
// IMPORT SUPABASE CLIENT
// ===========================
import { supabase } from './supabase.js';

// ===========================
// UTILITY FUNCTIONS
// ===========================
async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

function showScreen(screenId) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(screenId).classList.remove("hidden");
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

// ===========================
// NAVIGATION / FLOW
// ===========================
window.selectLanguage = (lang) => {
  localStorage.setItem("language", lang);
  showScreen("screen-role");
};

window.selectRole = (role) => {
  localStorage.setItem("role", role);
  showScreen("screen-signup");
  document.getElementById("retailer-fields").classList.toggle("hidden", role !== "retailer");
  document.getElementById("distributor-fields").classList.toggle("hidden", role !== "distributor");
};

window.showLogin = () => showScreen("screen-login");

// ===========================
// AUTHENTICATION
// ===========================
window.signup = async () => {
  const role = localStorage.getItem("role");
  const pwHash = await hashPassword(password.value);

  // Insert user
  const { data: userData, error: userError } = await supabase.from("users").insert([{
    name: name.value,
    username: username.value,
    phone: phone.value,
    password_hash: pwHash,
    role,
    approved: role === "retailer",
    language: localStorage.getItem("language")
  }]).select().single();

  if (userError) return alert(userError.message);
  const user = userData;

  // Insert specialized profile
  if (role === "retailer") {
    await supabase.from("retailer_profiles").insert([{
      user_id: user.id,
      store_name: store_name.value,
      location: location.value
    }]);
  } else {
    await supabase.from("distributor_profiles").insert([{
      user_id: user.id,
      business_name: business_name.value,
      business_type: business_type.value,
      operating_area: operating_area.value,
      delivery_available: delivery_available.value === "true"
    }]);
  }

  saveUser(user);
  showDashboard(user);
};

window.login = async () => {
  const pwHash = await hashPassword(login_password.value);
  const { data: userData } = await supabase.from("users")
    .select("*")
    .eq("phone", login_phone.value)
    .eq("password_hash", pwHash)
    .single();

  if (!userData) return alert("Invalid credentials");

  if (userData.role === "distributor" && !userData.approved) {
    return alert("Your distributor account is pending admin approval");
  }

  saveUser(userData);
  showDashboard(userData);
};

window.logout = () => {
  localStorage.removeItem("user");
  location.reload();
};

// ===========================
// DASHBOARD
// ===========================
async function showDashboard(user) {
  showScreen("screen-dashboard");
  document.getElementById("welcome").innerText = `Welcome ${user.name}`;

  if (user.role === "distributor") {
    document.getElementById("addProductSection").classList.remove("hidden");
    loadOrders(user.id);
    document.getElementById("productList").innerHTML = ""; // retailers section hidden
  } else {
    document.getElementById("addProductSection").classList.add("hidden");
    document.getElementById("ordersList").innerHTML = ""; // distributor orders hidden
    loadProducts();
  }
}

// ===========================
// PRODUCT MANAGEMENT
// ===========================
window.addProduct = async () => {
  const user = getCurrentUser();
  const { data, error } = await supabase.from("products").insert([{
    name: product_name.value,
    price: price.value,
    min_order_quantity: moq.value,
    distributor_id: user.id
  }]);

  if (error) return alert(error.message);
  alert("Product added");
  product_name.value = price.value = moq.value = "";
};

async function loadProducts() {
  const { data: products } = await supabase.from("products").select("*");
  const productList = document.getElementById("productList");

  productList.innerHTML = products.map(p => `
    <div class="border p-3 rounded-xl">
      <p class="font-medium">${p.name}</p>
      <p>Price: ${p.price}</p>
      <p>MOQ: ${p.min_order_quantity}</p>
      <button onclick="addToCart('${p.id}','${p.name}',${p.price},${p.min_order_quantity})"
        class="mt-2 bg-primary text-white w-full py-2 rounded">Add to Cart</button>
    </div>
  `).join("");
}

// ===========================
// CART & ORDER
// ===========================
let cart = [];

window.addToCart = (id, name, price, moq) => {
  cart.push({ id, name, price, quantity: moq });
  alert(`${name} added to cart (default MOQ)`);
};

window.placeOrder = async () => {
  const user = getCurrentUser();
  if (!cart.length) return alert("Cart is empty");

  const distributor_id = cart[0].distributor_id || null; // assume all products same distributor
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const { data: order } = await supabase.from("orders").insert([{
    retailer_id: user.id,
    distributor_id,
    total_amount: total,
    status: "pending"
  }]).select().single();

  const orderItems = cart.map(i => ({
    order_id: order.id,
    product_id: i.id,
    price: i.price,
    quantity: i.quantity
  }));

  await supabase.from("order_items").insert(orderItems);
  cart = [];
  alert("Order placed successfully");
};

// ===========================
// DISTRIBUTOR ORDERS MANAGEMENT
// ===========================
async function loadOrders(distributorId) {
  const { data: orders } = await supabase.from("orders").select("*")
    .eq("distributor_id", distributorId);

  const ordersList = document.getElementById("ordersList");

  ordersList.innerHTML = orders.map(o => `
    <div class="border p-3 rounded-xl">
      <p>Order ${o.id}</p>
      <p>Status: ${o.status}</p>
      <button onclick="updateOrder('${o.id}','approved')" class="bg-green-600 text-white px-3 py-1 rounded mt-1">Approve</button>
      <button onclick="updateOrder('${o.id}','rejected')" class="bg-red-500 text-white px-3 py-1 rounded mt-1">Reject</button>
    </div>
  `).join("");
}

window.updateOrder = async (id, status) => {
  await supabase.from("orders").update({ status }).eq("id", id);
  const user = getCurrentUser();
  loadOrders(user.id);
};

// ===========================
// INITIALIZATION
// ===========================
window.addEventListener("DOMContentLoaded", () => {
  const savedUser = getCurrentUser();
  if (savedUser) showDashboard(savedUser);
});
