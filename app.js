/**
 * BomaWave Full-Stack Controller
 * Fixed for 400 Bad Request Error
 */
import { supabase } from './supabase.js';

const BomaState = {
    lang: 'en',
    role: '',
    user: null
};

export const BomaController = {
    // Navigation Logic
    nextStep(current, next, lang = null) {
        if (lang) BomaState.lang = lang;
        document.getElementById(`step-${current}`).classList.remove('step-active');
        document.getElementById(`step-${next}`).classList.add('step-active');
    },

    prevStep(current, prev) {
        document.getElementById(`step-${current}`).classList.remove('step-active');
        document.getElementById(`step-${prev}`).classList.add('step-active');
    },

    selectRole(role) {
        BomaState.role = role;
        const coverageField = document.getElementById('coverage-field');
        if (role === 'distributor') {
            coverageField.classList.remove('hidden');
        } else {
            coverageField.classList.add('hidden');
        }
        this.nextStep(2, 3);
    },

    // Registration Logic - FIXED HERE
    async handleRegister(e) {
        e.preventDefault();
        
        // Tunachukua data na ku-trim nafasi (spaces)
        const username = document.getElementById('reg-user').value.trim();
        const password = document.getElementById('reg-pass').value;
        const store_name = document.getElementById('reg-name').value.trim();
        const phone_number = document.getElementById('reg-phone').value.trim();
        const location = document.getElementById('reg-loc').value.trim();
        const coverage_area = document.getElementById('reg-coverage').value.trim() || null;

        const profileData = {
            username: username,
            password: password,
            role: BomaState.role,
            store_name: store_name,
            phone_number: phone_number,
            location: location,
            coverage_area: coverage_area,
            is_approved: BomaState.role === 'retailer' // Retailers approved auto
        };

        console.log("Jaribio la kusajili:", profileData);

        const { data, error } = await supabase
            .from('profiles')
            .insert([profileData])
            .select()
            .single();
        
        if (error) {
            console.error("Supabase Error Details:", error);
            if (error.code === '23505') {
                alert("Jina la mtumiaji (Username) tayari lipo. Tumia lingine.");
            } else {
                alert("Kosa la Mtandao (400): " + error.message);
            }
            return;
        }

        BomaState.user = data;
        this.launchApp();
    },

    launchApp() {
        document.getElementById('onboarding').classList.add('hidden');
        document.getElementById('app-main').classList.remove('hidden');
        document.getElementById('ui-username').innerText = BomaState.user.store_name;
        document.getElementById('ui-role').innerText = BomaState.user.role;

        if (BomaState.user.role === 'distributor' && !BomaState.user.is_approved) {
            this.renderWaitingScreen();
        } else {
            this.renderDashboard();
        }
    },

    renderWaitingScreen() {
        document.getElementById('app-view').innerHTML = `
            <div class="text-center py-20">
                <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h2 class="text-2xl font-bold">Subiri Uhakiki wa Admin</h2>
                <p class="text-slate-500 mt-2">Akaunti yako ya Distributor inasubiri kuidhinishwa.</p>
            </div>
        `;
    },

    async renderDashboard() {
        const view = document.getElementById('app-view');
        if (BomaState.user.role === 'retailer') {
            view.innerHTML = `
                <div class="space-y-10">
                    <section>
                        <h2 class="text-3xl font-black text-green-600 mb-6 tracking-tighter italic">Marketplace</h2>
                        <div id="product-list" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
                    </section>
                    <section class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 class="font-bold text-xl mb-6">Order History (Official Ledger)</h3>
                        <div id="order-history" class="space-y-4"></div>
                    </section>
                </div>
            `;
            this.loadMarketplace();
            this.loadHistory();
        } else {
            // Distributor View
            view.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="bg-white p-8 rounded-3xl shadow-sm border h-fit">
                        <h3 class="font-bold mb-6">Tuma Bidhaa Sokoni</h3>
                        <form id="stock-form" class="space-y-4">
                            <input id="s-name" placeholder="Bidhaa (e.g. Soy Milk)" class="w-full border p-3 rounded-xl outline-none" required>
                            <input id="s-price" type="number" placeholder="Bei (TZS)" class="w-full border p-3 rounded-xl" required>
                            <input id="s-qty" type="number" placeholder="Stock Qty" class="w-full border p-3 rounded-xl" required>
                            <button type="submit" class="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">Weka Sokoni</button>
                        </form>
                    </div>
                    <div class="col-span-2">
                        <h3 class="font-bold text-xl mb-6 italic">Incoming Orders</h3>
                        <div id="incoming-orders" class="space-y-4"></div>
                    </div>
                </div>
            `;
            this.loadDistributorOrders();
            this.setupStockForm();
        }
    },

    async loadHistory() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('retailer_id', BomaState.user.id)
            .order('created_at', { ascending: false });

        if (error) return;

        const historyDiv = document.getElementById('order-history');
        if (data.length === 0) {
            historyDiv.innerHTML = `<p class="text-slate-400">Hujafanya oda yoyote bado.</p>`;
            return;
        }

        historyDiv.innerHTML = data.map(o => `
            <div class="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border-l-4 border-green-500">
                <div>
                    <p class="font-bold text-slate-800">${o.product_name}</p>
                    <p class="text-[10px] font-black text-slate-400 uppercase mt-1">Tarehe: ${new Date(o.created_at).toLocaleString('en-GB')}</p>
                </div>
                <div class="text-right">
                    <p class="font-black text-green-600">${Number(o.total_price).toLocaleString()} TZS</p>
                    <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">${o.status}</span>
                </div>
            </div>
        `).join('');
    }
};

// Global Binder
window.BomaController = BomaController;

document.addEventListener('submit', (e) => {
    if (e.target.id === 'reg-form') BomaController.handleRegister(e);
});
