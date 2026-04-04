// ================== APP.JS ==================

function renderCart(){
  cartEl.innerHTML=''
  cart.forEach(c=>{
    cart.innerHTML += `<div>${c.name} - ${c.price}</div>`
  })
}

checkout.onclick = async ()=>{
  const total = cart.reduce((s,c)=>s+c.price,0)

  const { data: retailer } = await supabase.from('retailers').select('*').eq('user_id', currentUser.id).single()

  await supabase.from('orders').insert({
    retailer_id: retailer.id,
    total_amount: total,
    status: 'pending'
  })

  cart = []
  renderCart()
  alert('Order placed')
}

viewOrders.onclick = async ()=>{
  ordersSection.classList.remove('hidden')

  const { data } = await supabase.from('orders').select('*')
  orders.innerHTML = ''

  data.forEach(o=>{
    orders.innerHTML += `<div class="bg-white p-2 mt-2">Order ${o.id} - ${o.status}</div>`
  })
}

add.onclick = async ()=>{
  const { data: dist } = await supabase.from('distributors').select('*').eq('user_id', currentUser.id).single()

  await supabase.from('products').insert({
    distributor_id: dist.id,
    product_name: pname.value,
    price: pprice.value
  })

  loadProducts()
}

logout.onclick = ()=> supabase.auth.signOut()

init()


-- ================== SQL ==================
create table if not exists profiles (
  id uuid primary key,
  name text,
  role text,
  location text,
  completed boolean default false
);

create table if not exists distributors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique,
  company_name text,
  is_approved boolean default false
);

create table if not exists retailers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  distributor_id uuid,
  product_name text,
  price numeric
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  retailer_id uuid,
  total_amount numeric,
  status text
);

create table if not exists admin_users (
  id uuid primary key
);
tener('click', () => supabase.auth.signOut())
