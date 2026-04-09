/**
 * BomaWave Full-Stack Controller
 * Import supabase from your existing config
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
        if(lang) BomaState.lang = lang;
        document.getElementById(`step-${current}`).classList.remove('step-active');
        document.getElementById(`step-${next}`).classList.add('step-active');
    },

    prevStep(current, prev) {
        document.getElementById(`step-${current}`).classList.remove('step-active');
        document.getElementById(`step-${prev}`).classList.add('step-active');
    },

    selectRole(role) {
        BomaState.role = role;
        if(role === 'distributor') {
            document.getElementById('coverage-field').classList.remove('hidden');
        } else {
            document.getElementById('coverage-field').classList.add('hidden');
        }
        this.nextStep(2, 3);
    },

    // Registration Logic
    async handleRegister(e) {
        e.preventDefault();
        const profile = {
            username: document.getElementById('reg-user').value,
            password: document.getElementById('reg-pass').value,
            store_name: document.getElementById('reg-name').value,
            phone_number: document.getElementById('reg-phone').value,
            location: document.getElementById('reg-loc').value,
            coverage_area: document.getElementById('reg-coverage').value || null,
            role: BomaState.role,
            is_approved: BomaState.role === 'retailer' // Retailers approved auto, distributors waiting admin
        };

        const { data, error } = await supabase.from('profiles').insert([profile]).select().single();
        
        if (error) {
            alert("Error: Jina hilo tayari lipo au kuna tatizo la mtandao.");
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
                <p class="text-slate-500 mt-2">Tunahakiki eneo lako la huduma (Coverage) kabla ya kukuruhusu kuanza kuuza.</p>
            </div>
        `;
    },

    async renderDashboard() {
        const view = document.getElementById('app-view');
        if(BomaState.user.role === 'retailer') {
            view.innerHTML = `
                <div class="space-y-10">
                    <section>
                        <h2 class="text-3xl font-black text-green-600 mb-6">Marketplace</h2>
                        <div id="product-list" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
                    </section>
                    <section class="bg-white p-8 rounded-[2.5rem] shadow-sm">
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
                    <div class="bg-white p-8 rounded-3xl shadow-sm border col-span-1 h-fit">
                        <h3 class="font-bold mb-6">Tuma Bidhaa Sokoni</h3>
                        <form id="stock-form" class="space-y-4">
                            <input id="s-name" placeholder="Jina la Bidhaa" class="w-full border p-3 rounded-xl">
                            <input id="s-price" type="number" placeholder="Bei (TZS)" class="w-full border p-3 rounded-xl">
                            <input id="s-qty" type="number" placeholder="Idadi (Stock)" class="w-full border p-3 rounded-xl">
                            <button type="submit" class="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">Sync Stock</button>
                        </form>
                    </div>
                    <div class="col-span-2 space-y-6">
                        <h3 class="font-bold text-xl">Oda Zinazoingia</h3>
                        <div id="incoming-orders" class="space-y-4"></div>
                    </div>
                </div>
            `;
            this.loadIncomingOrders();
        }
    },

    async loadMarketplace() {
        const { data } = await supabase.from('products').select('*, profiles(store_name, coverage_area)');
        const list = document.getElementById('product-list');
        list.innerHTML = data.map(p => `
            <div class="bg-white p-6 rounded-[2rem] border hover:border-green-500 transition shadow-sm">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${p.profiles.store_name} | ${p.profiles.coverage_area}</p>
                <h4 class="text-xl font-bold mt-1">${p.name}</h4>
                <p class="text-2xl font-black text-green-600 my-4">${Number(p.price).toLocaleString()} TZS</p>
                <button onclick="window.BomaController.placeOrder('${p.id}', '${p.name}', ${p.price}, '${p.distributor_id}')" 
                    class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Agiza Kupitia System</button>
            </div>
        `).join('');
    },

    async placeOrder(pId, pName, price, dId) {
        const { error } = await supabase.from('orders').insert([{
            retailer_id: BomaState.user.id,
            distributor_id: dId,
            product_id: pId,
            product_name: pName,
            total_price: price,
            quantity: 1
        }]);

        if (!error) {
            alert("Oda imerekodiwa rasmi kwenye System!");
            this.loadHistory();
        }
    },

    async loadHistory() {
        const { data } = await supabase.from('orders').select('*').eq('retailer_id', BomaState.user.id).order('created_at', { ascending: false });
        const history = document.getElementById('order-history');
        history.innerHTML = data.map(o => `
            <div class="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border-l-4 border-green-500">
                <div>
                    <p class="font-bold text-slate-800">${o.product_name}</p>
                    <p class="text-[10px] font-black text-slate-400 uppercase mt-1">Saa: ${new Date(o.created_at).toLocaleString('en-GB')}</p>
                </div>
                <div class="text-right">
                    <p class="font-black text-green-600">${Number(o.total_price).toLocaleString()} TZS</p>
                    <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">${o.status}</span>
                </div>
            </div>
        `).join('');
    }
};

// Global export for HTML access
window.BomaController = BomaController;

// Form Binders
document.addEventListener('submit', (e) => {
    if(e.target.id === 'reg-form') BomaController.handleRegister(e);
});
