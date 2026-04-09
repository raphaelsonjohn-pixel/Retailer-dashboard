/**
 * BomaWave Core Application Controller
 * High-Performance supply chain management for the East African FMCG Sector.
 * Author: BomaWave Dev Team (Harvard CS Style Architecture)
 */

// 1. STATE MANAGEMENT MODULE
const BomaState = {
    lang: 'en',
    role: null,
    user: null,
    categories: [],
    products: [],
    orders: [],
    
    translations: {
        en: {
            marketTitle: "Inventory Feed",
            orderBtn: "Place Order",
            stockLabel: "In Stock",
            authSuccess: "Access Granted",
            orderSuccess: "Order Broadcast to Distributor",
            errorGeneric: "System error occurred"
        },
        sw: {
            marketTitle: "Mlisho wa Bidhaa",
            orderBtn: "Agiza Sasa",
            stockLabel: "Stoo",
            authSuccess: "Umeingia",
            orderSuccess: "Agizo limetumwa kwa muuzaji",
            errorGeneric: "Hitilafu imetokea"
        }
    },

    get(key) { return this.translations[this.lang][key] || key; }
};

// 2. DATABASE ABSTRACTION LAYER (DAL)
const BomaDatabase = {
    
    async createProfile(profileData) {
        const { data, error } = await supabase
            .from('profiles')
            .insert([profileData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async fetchProfile(username, password) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .eq('password_hash', password) // In production, use hash comparison
            .single();
        if (error) return null;
        return data;
    },

    async syncProducts(distributorId = null) {
        let query = supabase.from('products').select('*, profiles(store_name)').eq('is_active', true);
        if (distributorId) query = query.eq('distributor_id', distributorId);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async pushProduct(product) {
        const { data, error } = await supabase.from('products').insert([product]);
        if (error) throw error;
        return data;
    },

    async submitOrder(orderData, items) {
        // Atomic transaction: Order -> Order Items -> Stock Trigger
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        
        if (orderErr) throw orderErr;

        const lineItems = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.qty,
            price_at_purchase: item.price
        }));

        const { error: itemsErr } = await supabase.from('order_items').insert(lineItems);
        if (itemsErr) throw itemsErr;

        return order;
    },

    async fetchOrders(role, userId) {
        const column = role === 'distributor' ? 'distributor_id' : 'retailer_id';
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                profiles!retailer_id(store_name, phone_number),
                order_items(*, products(name))
            `)
            .eq(column, userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async fetchCategories() {
        const { data, error } = await supabase.from('categories').select('*');
        if (error) throw error;
        return data;
    }
};

// 3. UI RENDERING MODULE
const BomaUI = {
    
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const bg = type === 'success' ? 'bg-green-600' : 'bg-red-600';
        toast.className = `${bg} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300`;
        toast.innerHTML = `
            <span class="font-bold">${message}</span>
            <button onclick="this.parentElement.remove()" class="text-white/50 hover:text-white">&times;</button>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    switchTab(tabId) {
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.remove('tab-active');
            btn.classList.add('text-slate-500');
        });
        event.target.classList.add('tab-active');
        event.target.classList.remove('text-slate-500');

        // Toggle UI logic
        const views = ['retailer-dash', 'distributor-dash', 'history-view'];
        views.forEach(v => document.getElementById(v).classList.add('hidden'));

        if (tabId === 'history') document.getElementById('history-view').classList.remove('hidden');
        else BomaController.renderRoleDash();
    },

    openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },

    renderMarketplace(products) {
        const grid = document.getElementById('market-grid');
        if (!products.length) {
            grid.innerHTML = '<div class="col-span-full py-20 text-center text-slate-400">No active inventory found</div>';
            return;
        }

        grid.innerHTML = products.map(p => `
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col group card-hover">
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-4">
                        <span class="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                            ${p.profiles?.store_name || 'Verified Supplier'}
                        </span>
                        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    <h4 class="text-xl font-bold text-slate-800">${p.name}</h4>
                    <p class="text-slate-400 text-sm mt-2 line-clamp-2">${p.description || 'FMCG Wholesale Item'}</p>
                </div>
                <div class="mt-8">
                    <div class="flex items-end justify-between mb-6">
                        <div>
                            <p class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Unit Price</p>
                            <p class="text-2xl font-black text-slate-900">${Number(p.unit_price).toLocaleString()}<span class="text-xs font-normal ml-1">TZS</span></p>
                        </div>
                        <p class="text-xs font-bold text-slate-400">Stock: ${p.stock_quantity}</p>
                    </div>
                    <button onclick="BomaController.initOrderFlow('${p.id}')" 
                        class="w-full bg-slate-900 group-hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl transition">
                        ${BomaState.get('orderBtn')}
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderDistributorOrders(orders) {
        const table = document.getElementById('distributor-order-table');
        document.getElementById('order-count').innerText = `${orders.filter(o => o.status === 'pending').length} Active Orders`;
        
        table.innerHTML = orders.map(o => `
            <tr class="group hover:bg-slate-50 transition">
                <td class="px-8 py-6">
                    <p class="font-mono text-xs text-indigo-500">#${o.id.split('-')[0]}</p>
                    <p class="text-[10px] text-slate-400 mt-1">${new Date(o.created_at).toLocaleTimeString()}</p>
                </td>
                <td class="px-8 py-6">
                    <p class="font-bold text-slate-800">${o.profiles?.store_name || 'Retailer'}</p>
                    <p class="text-xs text-slate-400">${o.profiles?.phone_number || 'No Contact'}</p>
                </td>
                <td class="px-8 py-6">
                    <p class="text-sm">${o.order_items[0]?.products?.name || 'Multiple Items'}</p>
                </td>
                <td class="px-8 py-6">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-orange-100 text-orange-600">
                        ${o.status}
                    </span>
                </td>
                <td class="px-8 py-6 text-right font-black text-slate-900">
                    ${Number(o.total_amount).toLocaleString()} TZS
                </td>
            </tr>
        `).join('');
    }
};

// 4. MAIN CONTROLLER
const BomaController = {
    
    async initLanguage(lang) {
        BomaState.lang = lang;
        document.getElementById('step-language').classList.add('hidden');
        document.getElementById('step-role').classList.remove('hidden');
    },

    setRole(role) {
        BomaState.role = role;
        document.getElementById('step-role').classList.add('hidden');
        document.getElementById('step-auth').classList.remove('hidden');
        
        if (role === 'distributor') {
            document.getElementById('distributor-fields').classList.remove('hidden');
        }
    },

    async handleRegistration(e) {
        e.preventDefault();
        const username = document.getElementById('auth-username').value;
        const password = document.getElementById('auth-password').value;
        const sName = document.getElementById('store-name').value;
        
        try {
            // Attempt login first
            let profile = await BomaDatabase.fetchProfile(username, password);
            
            // If doesn't exist, create (MVP shortcut)
            if (!profile) {
                profile = await BomaDatabase.createProfile({
                    username,
                    password_hash: password,
                    role: BomaState.role,
                    store_name: sName || username,
                    is_verified: true
                });
            }

            BomaState.user = profile;
            this.bootPlatform();
        } catch (err) {
            BomaUI.showToast(err.message, 'error');
        }
    },

    async bootPlatform() {
        document.getElementById('onboarding-overlay').classList.add('hidden');
        document.getElementById('main-interface').classList.remove('hidden');
        
        document.getElementById('nav-user-name').innerText = BomaState.user.store_name;
        document.getElementById('nav-user-role').innerText = BomaState.user.role;

        // Load Categories for Distributor
        if (BomaState.role === 'distributor') {
            const cats = await BomaDatabase.fetchCategories();
            const catSelect = document.getElementById('p-category');
            catSelect.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        this.renderRoleDash();
    },

    async renderRoleDash() {
        if (BomaState.role === 'retailer') {
            document.getElementById('retailer-dash').classList.remove('hidden');
            const prods = await BomaDatabase.syncProducts();
            BomaState.products = prods;
            BomaUI.renderMarketplace(prods);
        } else {
            document.getElementById('distributor-dash').classList.remove('hidden');
            this.syncDistributorPanel();
        }
    },

    async syncDistributorPanel() {
        const orders = await BomaDatabase.fetchOrders('distributor', BomaState.user.id);
        const prods = await BomaDatabase.syncProducts(BomaState.user.id);
        
        BomaUI.renderDistributorOrders(orders);
        
        // Render simple inventory list for distributor
        document.getElementById('dist-inventory-list').innerHTML = prods.map(p => `
            <div class="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group transition">
                <div>
                    <p class="font-bold text-slate-800">${p.name}</p>
                    <p class="text-[10px] text-slate-400">Stock level: ${p.stock_quantity}</p>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-mono text-indigo-600 font-bold">${Number(p.unit_price).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    },

    async handleProductSubmit(e) {
        e.preventDefault();
        const product = {
            distributor_id: BomaState.user.id,
            category_id: document.getElementById('p-category').value,
            name: document.getElementById('p-name').value,
            unit_price: document.getElementById('p-price').value,
            stock_quantity: document.getElementById('p-stock').value,
            description: document.getElementById('p-desc').value,
            sku: 'SKU-' + Date.now()
        };

        try {
            await BomaDatabase.pushProduct(product);
            BomaUI.showToast("Morning Stock Synced Successfully");
            e.target.reset();
            this.syncDistributorPanel();
        } catch (err) {
            BomaUI.showToast(err.message, 'error');
        }
    },

    initOrderFlow(productId) {
        const prod = BomaState.products.find(p => p.id === productId);
        const modalBody = document.getElementById('order-summary');
        modalBody.innerHTML = `
            <div class="flex justify-between font-bold"><span>Product:</span> <span>${prod.name}</span></div>
            <div class="flex justify-between"><span>Supplier:</span> <span>${prod.profiles.store_name}</span></div>
            <div class="flex justify-between border-t pt-2 mt-2"><span>Unit Price:</span> <span>${Number(prod.unit_price).toLocaleString()} TZS</span></div>
            <div class="flex justify-between text-indigo-600 text-lg font-black pt-2"><span>Total:</span> <span>${Number(prod.unit_price).toLocaleString()} TZS</span></div>
        `;
        
        document.getElementById('confirm-order-btn').onclick = () => this.executeOrder(prod);
        BomaUI.openModal('order-modal');
    },

    async executeOrder(prod) {
        try {
            const orderData = {
                retailer_id: BomaState.user.id,
                distributor_id: prod.distributor_id,
                total_amount: prod.unit_price,
                product_id: prod.id, // Linking directly for MVP
                product_name: prod.name
            };

            await BomaDatabase.submitOrder(orderData, [{ id: prod.id, qty: 1, price: prod.unit_price }]);
            BomaUI.closeModal('order-modal');
            BomaUI.showToast(BomaState.get('orderSuccess'));
            this.renderRoleDash();
        } catch (err) {
            BomaUI.showToast("Stock Depeleted or Sync Error", 'error');
        }
    }
};

// --- DOM BINDING ---
document.getElementById('auth-form').addEventListener('submit', (e) => BomaController.handleRegistration(e));
document.getElementById('product-form')?.addEventListener('submit', (e) => BomaController.handleProductSubmit(e));
