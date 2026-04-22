/**
 * HMS BULGARIA - ULTIMATE v7.0 (COMPLETE SYSTEM)
 * Project: qajmppuihmorlzljjltm
 */

// === 1. CONFIGURATION (REAL CREDENTIALS) ===
const SB_URL = "https://qajmppuihmorlzljjltm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFham1wcHVpaG1vcmx6bGpqbHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjE4NDgsImV4cCI6MjA5MDY5Nzg0OH0.96UsQD5ux65hifaEdAOELFJU_T8E0s9764rLVTQcRvo";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

const TG_BOT_TOKEN = "8645929996:AAHIPLMxDYh-ycxdIKbuld92yDA36EWTFQE";
const TG_GROUPS = {
    housekeeping: "-5150465403",
    maintenance: "-5236955430",
    reception: "-5270987629",
    spa: "-5292367247",
    guest_relations: "-5052426259",
    restaurant: "-5142829359"
};

let currentLang = 'bg';
let currentTab = 'dashboard';
let currentUser = null;
let selectedRoom = null;

// === 2. INITIALIZATION & AUTH ===
document.addEventListener('DOMContentLoaded', async () => {
    updateClock();
    setInterval(updateClock, 1000);
    
    // Проверка за активна сесия
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        currentUser = session.user.email;
        setupUI();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
    }
});

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('bg-BG');
    if(document.getElementById('digital-clock')) document.getElementById('digital-clock').innerText = timeStr;
    if(document.getElementById('digital-clock-mob')) document.getElementById('digital-clock-mob').innerText = timeStr.slice(0, 5);
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert("Грешка при вход: " + error.message);
    } else {
        currentUser = data.user.email;
        setupUI();
    }
}

function setupUI() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('user-email').innerText = currentUser;
    changeLanguage('bg');
    switchTab('dashboard'); // Активираме таблото веднага
}

function handleLogout() {
    _supabase.auth.signOut().then(() => location.reload());
}

// === 3. NAVIGATION & MOBILE ===
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebarIfOpen() { document.getElementById('sidebar').classList.remove('open'); }

const translations = {
    bg: { dashboard: "📊 Табло", matrix: "🏨 Матрица", maintenance: "🛠 Поддръжка", housekeeping: "🧹 Камериерки", reception: "🛎 Рецепция", guest_relations: "🤝 Guest Relations", restaurant: "🍽 Ресторант", handover: "📝 Рапорт", sop: "📚 SOP", logout: "Изход", send: "ЗАПИШИ ЗАЯВКА" },
    en: { dashboard: "📊 Dashboard", matrix: "🏨 Matrix", maintenance: "🛠 Maintenance", housekeeping: "🧹 Housekeeping", reception: "🛎 Reception", guest_relations: "🤝 Guest Relations", restaurant: "🍽 Restaurant", handover: "📝 Handover", sop: "📚 SOP", logout: "Logout", send: "SAVE REQUEST" }
};

function changeLanguage(lang) {
    currentLang = lang;
    renderNav();
}

function renderNav() {
    const nav = document.getElementById('main-nav');
    const t = translations[currentLang];
    const menu = [
        { id: 'dashboard', label: t.dashboard }, { id: 'room-matrix', label: t.matrix },
        { id: 'maintenance', label: t.maintenance }, { id: 'housekeeping', label: t.housekeeping },
        { id: 'reception', label: t.reception }, { id: 'guest_relations', label: t.guest_relations },
        { id: 'restaurant', label: t.restaurant }, { id: 'handover', label: t.handover }, { id: 'sop', label: t.sop }
    ];
    nav.innerHTML = menu.map(m => `
        <div class="nav-item ${currentTab === m.id ? 'active' : ''}" onclick="switchTab('${m.id}')">
            <span>${m.label}</span>
        </div>
    `).join('');
}

function switchTab(id) {
    currentTab = id;
    renderNav();
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

    const target = (id === 'dashboard') ? 'dashboard-section' : (id === 'room-matrix' ? 'matrix-section' : 'form-container');
    const el = document.getElementById(target);
    if(el) { el.style.display = 'block'; el.classList.add('active'); }

    if (id === 'room-matrix') renderRoomMatrix();
    else if (id !== 'dashboard') renderDynamicModule(id);
    else { updateKPIs(); initDashboardChart(); }

    closeSidebarIfOpen();
}

// === 4. INTERACTIVE ROOM MATRIX ===
async function renderRoomMatrix() {
    const { data: rooms } = await _supabase.from('rooms').select('room_number, status');
    const statusMap = Object.fromEntries(rooms?.map(r => [r.room_number, r.status]) || []);
    
    const wings = [ { id: 'apollo-grid', s: 1, e: 29 }, { id: 'helios-grid', s: 30, e: 58 } ];
    wings.forEach(w => {
        const grid = document.getElementById(w.id);
        if(!grid) return; grid.innerHTML = '';
        for (let f = 1; f <= 6; f++) {
            const row = document.createElement('div'); row.className = 'floor-row';
            row.innerHTML = `<div class="floor-label">Floor ${f}</div>`;
            for (let r = w.s; r <= w.e; r++) {
                const num = (f * 100 + r).toString();
                const box = document.createElement('div');
                box.className = `room-box ${statusMap[num] || 'clean'}`;
                box.innerText = num.slice(-2);
                box.onclick = () => { 
                    selectedRoom = num; 
                    document.getElementById('modal-room-title').innerText = "Стая " + num;
                    document.getElementById('room-status-modal').style.display = 'flex';
                };
                row.appendChild(box);
            }
            grid.appendChild(row);
        }
    });
}

async function updateRoomStatus(newStatus) {
    await _supabase.from('rooms').update({ status: newStatus }).eq('room_number', selectedRoom);
    closeModal(); renderRoomMatrix();
}

function closeModal() { document.getElementById('room-status-modal').style.display = 'none'; }

// === 5. DYNAMIC DEPARTMENT FORMS ===
function renderDynamicModule(id) {
    const container = document.getElementById('form-container');
    const today = new Date().toISOString().split('T')[0];
    let html = `<div class="card"><h2 class="luxury-title-section">${translations[currentLang][id]}</h2>`;

    if (id === 'housekeeping') {
        html += `
            <div class="grid-form">
                <div class="field"><label>Тип</label><select id="f_type" class="form-control" onchange="toggleHK(this.value)"><option value="once">Днес / Еднократно</option><option value="period">За период (Не желае почистване)</option></select></div>
<div class="field"><label>Стая</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field" id="hk_date_box"><label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                <div class="field"><label>Услуга</label><select id="f_service" class="form-control">
                    <option>Почистена стая</option><option>Мръсна стая</option><option>Не желае почистване</option><option>Минибар</option><option>Кошара</option><option>Доп. легло</option><option>Тоал. хартия</option>
                </select></div>
            </div>`;
    } else if (id === 'maintenance') {
        html += `
            <div class="grid-form">
                <div class="field"><label>Стая / Локация</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field"><label>Технически проблем</label><select id="f_service" class="form-control">
                    <option>Минибар шуми</option><option>Минибар не работи</option><option>Климатик шуми</option><option>Климатик не работи</option>
                    <option>Крушка - легло</option><option>Крушка - баня</option><option>Крушка - коридор</option><option>Сейф - батерии</option><option>Сейф - блокиран</option><option>Казанче</option>
                </select></div>
                <div class="field full"><label>Описание на повредата</label><textarea id="f_desc" class="form-control"></textarea></div>
            </div>`;
    } else if (id === 'reception') {
        html += `
            <div class="grid-form">
                <div class="field"><label>Стая</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field"><label>Услуга</label><select id="f_service" class="form-control"><option>Събуждане ⏰</option><option>Трансфер / Такси 🚕</option><option>Оплакване ⚠️</option></select></div>
                <div class="field"><label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                <div class="field"><label>Час</label><input type="time" id="f_time" class="form-control"></div>
            </div>`;
    } else if (id === 'restaurant') {
        html += `
            <div class="grid-form">
                <div class="field"><label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                <div class="field"><label>Услуга</label><select id="f_service" class="form-control"><option>Ранна закуска</option><option>Късна вечеря</option></select></div>
                <div class="field"><label>Възрастни</label><input type="number" id="f_adults" value="2" class="form-control"></div>
                <div class="field"><label>Деца</label><input type="number" id="f_kids" value="0" class="form-control"></div>
            </div>`;
    } else if (id === 'handover') {
        html += `
            <div class="grid-form">
                <div class="field"><label>Касова наличност</label><input type="number" id="f_cash" class="form-control" placeholder="0.00"></div>
                <div class="field"><label>По карта</label><input type="number" id="f_card" class="form-control" placeholder="0.00"></div>
                <div class="field"><label>Приел смяна</label><input type="text" id="f_receiver" class="form-control"></div>
                <div class="field full"><label>Важни бележки за следващата смяна</label><textarea id="f_desc" class="form-control"></textarea></div>
            </div>`;
    } else if (id === 'sop') {
        html += `<div class="sop-grid"><div class="card"><h4>VIP Стандарт</h4><p>Протокол за ВИП...</p></div><div class="card"><h4>Евакуация</h4><p>Процедура при пожар...</p></div><div class="card"><h4>Хора с увреждания</h4><p>Асистиране на гости...</p></div></div>`;
    } else if (id === 'guest_relations') {
        html += `
            <div class="grid-form">
                <div class="field"><label>Стая</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field"><label>Услуга</label><select id="f_service" class="form-control"><option>Трансфер</option><option>Екскурзия</option><option>Планиране на деня</option><option>Алергии</option></select></div>
                <div class="field full"><label>Детайли</label><textarea id="f_desc" class="form-control"></textarea></div>
            </div>`;
    }

    if(id !== 'sop') html += `<button class="btn-submit" onclick="submitTicket('${id}')">${translations[currentLang].send}</button>`;
    html += `</div>`;
    container.innerHTML = html;
}

function toggleHK(v) {
    const box = document.getElementById('hk_date_box');
    if(v==='period') box.innerHTML = `<label>Период</label><div style="display:flex;gap:5px"><input type="date" id="f_date_start" class="form-control"><input type="date" id="f_date_end" class="form-control"></div>`;
    else box.innerHTML = `<label>Дата</label><input type="date" id="f_date" class="form-control">`;
}

// === 6. DATA SUBMISSION & TELEGRAM ===
async function submitTicket(cat) {
    const room = document.getElementById('f_room')?.value || "N/A";
    const service = document.getElementById('f_service')?.value || "";
    const desc = document.getElementById('f_desc')?.value || "";
    const adults = document.getElementById('f_adults')?.value || "";
    const kids = document.getElementById('f_kids')?.value || "";
    const cash = document.getElementById('f_cash')?.value || "";
    const card = document.getElementById('f_card')?.value || "";
    
    const finalDesc = `${service} | ${desc} | A:${adults} K:${kids} | Cash:${cash} Card:${card}`;

    const { error } = await _supabase.from('tickets').insert([{
        room_id: room, category: cat, description: finalDesc,
        created_by: currentUser, status: 'new'
    }]);
    
    if(!error) { 
        alert("Заявката е записана успешно!"); 
        sendTelegram(cat, room, service, desc);
        switchTab('dashboard'); 
    } else {
        alert("Грешка при запис: " + error.message);
    }
}

async function sendTelegram(cat, room, serv, desc) {
    const msg = `🔔 *НОВА ЗАЯВКА: ${cat.toUpperCase()}*\n👤 Автор: ${currentUser}\n📍 Стая: ${room}\n🛠 ${serv}\n📝 ${desc}`;
    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage?chat_id=${TG_GROUPS[cat]}&text=${encodeURIComponent(msg)}&parse_mode=Markdown`;
    fetch(url).catch(e => console.error("Telegram Error", e));
}

// === 7. DASHBOARD DATA ===
async function updateKPIs() {
    const { count: t } = await _supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'new');
    if(document.getElementById('kpi-tickets')) document.getElementById('kpi-tickets').innerText = t || 0;
}

function initDashboardChart() {
    const canvas = document.getElementById('statsChart');
    if (!canvas) return;
new Chart(canvas.getContext('2d'), {
        type: 'line', data: { labels: ['08:00', '12:00', '16:00', '20:00'], datasets: [{ label: 'Натоварване', data: [15, 30, 20, 45], borderColor: '#c5a059', tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}