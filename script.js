
/**
 * HMS BULGARIA - ENTERPRISE CORE v5.5 (ULTIMATE)
 * Wings: Apollo (01-29) | Helios (30-58)
 */

// === 1. CONFIGURATION ===
const SB_URL = "https://qajmppuihmorlzljjltm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFham1wcHVpaG1vcmx6bGpqbHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjE4NDgsImV4cCI6MjA5MDY5Nzg0OH0.96UsQD5ux65hifaEdAOELFJU_T8E0s9764rLVTQcRvo";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

const TG_TOKEN = "8645929996:AAHIPLMxDYh-ycxdIKbuld92yDA36EWTFQE";
const TG_GROUPS = {
    housekeeping: "-5150465403", maintenance: "-5236955430",
    reception: "-5270987629", spa: "-5292367247",
    guest_relations: "-5052426259", restaurant: "-5142829359"
};

const translations = {
    bg: {
        dashboard: "📊 Табло", matrix: "🏨 Матрица", maintenance: "🛠 Поддръжка", 
        housekeeping: "🧹 Камериерки", reception: "🛎 Рецепция", guest_relations: "🤝 Връзка с гости",
        restaurant: "🍽 Ресторант", handover: "📝 Рапортна книга", sop: "📚 SOP Стандарти",
        logout: "Изход", search: "Търсене на стая или гост...", send: "ЗАПИШИ ЗАЯВКА",
        adults: "Възрастни", kids: "Деца", room: "Стая", service: "Услуга", date: "Дата", time: "Час"
    },
    en: {
        dashboard: "📊 Dashboard", matrix: "🏨 Matrix", maintenance: "🛠 Maintenance", 
        housekeeping: "🧹 Housekeeping", reception: "🛎 Reception", guest_relations: "🤝 Guest Relations",
        restaurant: "🍽 Restaurant", handover: "📝 Handover", sop: "📚 SOP Standards",
        logout: "Logout", search: "Search room or guest...", send: "SAVE REQUEST",
        adults: "Adults", kids: "Kids", room: "Room", service: "Service", date: "Date", time: "Time"
    }
};

let currentLang = 'bg';
let currentTab = 'dashboard';
let currentUser = null;
let selectedRoom = null;

// === 2. INITIALIZATION & SESSION ===
document.addEventListener('DOMContentLoaded', async () => {
    updateClock();
    setInterval(updateClock, 1000);
    
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        currentUser = session.user.email;
        setupUI();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
    }
});

function updateClock() {
    const el = document.getElementById('digital-clock');
    if (el) el.innerText = new Date().toLocaleTimeString('bg-BG');
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Грешка: " + error.message);
    else {
        currentUser = data.user.email;
        setupUI();
    }
}

function setupUI() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('user-email').innerText = currentUser;
    changeLanguage('bg');
    switchTab('dashboard');
}

function handleLogout() {
    _supabase.auth.signOut().then(() => location.reload());
}

// === 3. NAVIGATION ===
function changeLanguage(lang) {
    currentLang = lang;
    renderNav();
}

function renderNav() {
    const nav = document.getElementById('main-nav');
    const t = translations[currentLang];
    const items = [
        { id: 'dashboard', label: t.dashboard }, { id: 'room-matrix', label: t.matrix },
        { id: 'maintenance', label: t.maintenance }, { id: 'housekeeping', label: t.housekeeping },
        { id: 'reception', label: t.reception }, { id: 'guest_relations', label: t.guest_relations },
        { id: 'restaurant', label: t.restaurant }, { id: 'handover', label: t.handover },
        { id: 'sop', label: t.sop }
    ];
    nav.innerHTML = items.map(i => `
        <div class="nav-item ${currentTab === i.id ? 'active' : ''}" onclick="switchTab('${i.id}')">
            <span>${i.label}</span>
        </div>
    `).join('');
}

function switchTab(id) {
    currentTab = id;
    renderNav();
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');

    if (id === 'dashboard') {
        document.getElementById('dashboard-section').style.display = 'block';
        updateKPIs();
        initDashboardChart();
    } else if (id === 'room-matrix') {
        document.getElementById('matrix-section').style.display = 'block';
        renderRoomMatrix();
    } else {
        document.getElementById('form-container').style.display = 'block';
        renderDynamicModule(id);
    }
}

// === 4. ROOM MATRIX LOGIC ===
async function renderRoomMatrix() {
    const { data: rooms } = await _supabase.from('rooms').select('room_number, status');
    const statusMap = Object.fromEntries(rooms.map(r => [r.room_number, r.status]));
    
    const wings = [
        { id: 'apollo-grid', start: 1, end: 29 }, { id: 'helios-grid', start: 30, end: 58 }
    ];

    wings.forEach(wing => {
        const grid = document.getElementById(wing.id);
        grid.innerHTML = '';
        for (let f = 1; f <= 6; f++) {
            const row = document.createElement('div');
            row.className = 'floor-row';
            row.innerHTML = `<div class="floor-label">ЕТАЖ ${f}</div>`;
            for (let r = wing.start; r <= wing.end; r++) {
                const num = (f * 100 + r).toString();
                const box = document.createElement('div');
                box.className = `room-box ${statusMap[num] || 'clean'}`;
                box.innerText = num.slice(-2);
                box.onclick = () => openRoomModal(num);
                row.appendChild(box);
            }
            grid.appendChild(row);
        }
    });
}

function openRoomModal(num) {
    selectedRoom = num;
    document.getElementById('modal-room-title').innerText = "СТАЯ " + num;
    document.getElementById('room-status-modal').style.display = 'flex';
}

function closeModal() { document.getElementById('room-status-modal').style.display = 'none'; }

async function updateRoomStatus(newStatus) {
    const { error } = await _supabase.from('rooms').update({ status: newStatus }).eq('room_number', selectedRoom);
    if (!error) { renderRoomMatrix(); closeModal(); }
}

// === 5. SPECIALIZED DEPARTMENT FORMS ===
function renderDynamicModule(id) {
    const container = document.getElementById('form-container');
    const t = translations[currentLang];
    const today = new Date().toISOString().split('T')[0];
    let html = `<div class="card"><h2 class="luxury-title-section">${translations[currentLang][id]}</h2>`;

    switch(id) {
        case 'housekeeping':
            html += `
                <div class="grid-form">
                    <div class="field"><label>Тип</label>
                        <select class="form-control" id="hk_type" onchange="toggleHKDate(this.value)">
                            <option value="once">Еднократна заявка</option>
<option value="period">Период (Не желае почистване)</option>
                        </select>
                    </div>
                    <div class="field"><label>${t.room}</label><input type="text" id="f_room" class="form-control"></div>
                    <div class="field" id="hk_date_box"><label>${t.date}</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                    <div class="field"><label>${t.service}</label>
                        <select id="f_service" class="form-control">
                            <option>Почистена стая</option><option>Мръсна стая</option>
                            <option>Зареждане Минибар</option><option>Кошара</option>
                            <option>Допълнително легло</option><option>Тоал. хартия</option>
                        </select>
                    </div>
                </div>`;
            break;
        case 'maintenance':
            html += `
                <div class="grid-form">
                    <div class="field"><label>Стая / Локация</label><input type="text" id="f_room" class="form-control"></div>
                    <div class="field"><label>Технически проблем</label>
                        <select id="f_service" class="form-control">
                            <option>Минибар - шуми / не работи</option>
                            <option>Климатик - шуми / не работи</option>
                            <option>Крушка - баня / стая / коридор</option>
                            <option>Сейф - блокиран / батерии</option>
                            <option>Казанче тоалетна</option>
                        </select>
                    </div>
                    <div class="field full"><label>Описание</label><textarea id="f_desc" class="form-control"></textarea></div>
                </div>`;
            break;
        case 'reception':
            html += `
                <div class="grid-form">
                    <div class="field"><label>${t.room}</label><input type="text" id="f_room" class="form-control"></div>
                    <div class="field"><label>Тип заявка</label>
                        <select id="f_service" class="form-control">
                            <option>Събуждане ⏰</option><option>Трансфер / Такси 🚕</option><option>Оплакване</option>
                        </select>
                    </div>
                    <div class="field"><label>${t.date}</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                    <div class="field"><label>${t.time}</label><input type="time" id="f_time" class="form-control"></div>
                </div>`;
            break;
        case 'restaurant':
            html += `
                <div class="grid-form">
                    <div class="field"><label>${t.date}</label><input type="date" id="f_date" class="form-control"></div>
                    <div class="field"><label>Услуга</label>
                        <select id="f_service" class="form-control">
                            <option>Ранна закуска</option><option>Късна вечеря</option>
                        </select>
                    </div>
                    <div class="field"><label>${t.adults}</label>
                        <div class="counter-group">
                            <button class="counter-btn" onclick="adj('adults', -1)">-</button>
                            <span id="val_adults" class="counter-val">2</span>
                            <button class="counter-btn" onclick="adj('adults', 1)">+</button>
                        </div>
                    </div>
                    <div class="field"><label>${t.kids}</label>
                        <div class="counter-group">
                            <button class="counter-btn" onclick="adj('kids', -1)">-</button>
                            <span id="val_kids" class="counter-val">0</span>
                            <button class="counter-btn" onclick="adj('kids', 1)">+</button>
                        </div>
                    </div>
                </div>`;
            break;
        case 'guest_relations':
            html += `
                <div class="grid-form">
                    <div class="field"><label>${t.room}</label><input type="text" id="f_room" class="form-control"></div>
                    <div class="field"><label>Планиране</label>
                        <select id="f_service" class="form-control">
                            <option>Екскурзия</option><option>Трансфер</option><option>Алергии</option>
                        </select>
                    </div>
                    <div class="field full"><label>Детайли</label><textarea id="f_desc" class="form-control"></textarea></div>
                </div>`;
            break;
        case 'handover':
            html += `
                <div class="grid-form">
                    <div class="field"><label>Касова наличност</label><input type="number" id="f_cash" class="form-control"></div>
                    <div class="field"><label>По карта</label><input type="number" id="f_card" class="form-control"></div>
                    <div class="field"><label>Приел смяната</label><input type="text" id="f_receiver" class="form-control"></div>
                    <div class="field full"><label>Бележки за следващата смяна</label><textarea id="f_desc" class="form-control"></textarea></div>
                </div>`;
            break;
        case 'sop':
            html = renderSOPs();
            break;
    }

    if (id !== 'sop') html += `<button class="btn-submit" onclick="submitTicket('${id}')">${t.send}</button>`;
    html += `</div>`;
    container.innerHTML = html;
}

// === 6. DATA HANDLING ===
function toggleHKDate(val) {
    const box = document.getElementById('hk_date_box');
    if (val === 'period') box.innerHTML = `<label>Период</label><div style="display:flex; gap:5px;"><input type="date" id="f_date_start" class="form-control"><input type="date" id="f_date_end" class="form-control"></div>`;
    else box.innerHTML = `<label>Дата</label><input type="date" id="f_date" class="form-control">`;
}

function adj(id, delta) {
    const el = document.getElementById('val_' + id);
    let v = parseInt(el.innerText) + delta;
    if (v >= 0) el.innerText = v;
}

async function submitTicket(cat) {
    const room = document.getElementById('f_room')?.value || "N/A";
    const service = document.getElementById('f_service')?.value || "";
    const desc = document.getElementById('f_desc')?.value || "";
    const adults = document.getElementById('val_adults')?.innerText || null;
    const kids = document.getElementById('val_kids')?.innerText || null;
    
    const { error } = await _supabase.from('tickets').insert([{
        room_id: room, category: cat,
        description: `${service} | ${desc} | A:${adults} K:${kids}`,
        created_by: currentUser, status: 'new'
    }]);

if (!error) {
        sendTelegram(cat, room, service, desc);
        alert("Записано!");
        switchTab('dashboard');
    }
}

async function sendTelegram(cat, room, service, desc) {
    const msg = `🔔 *НОВА ЗАЯВКА: ${cat.toUpperCase()}*\n👤 Автор: ${currentUser}\n📍 Стая: ${room}\n🛠 ${service}\n📝 ${desc}`;
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${TG_GROUPS[cat]}&text=${encodeURIComponent(msg)}&parse_mode=Markdown`;
    fetch(url);
}

function renderSOPs() {
    return `<div class="sop-grid">
        <div class="sop-card"><h4>VIP Стандарт</h4><p>Протокол за посрещане...</p></div>
        <div class="sop-card"><h4>Евакуация</h4><p>Процедура при пожар...</p></div>
        <div class="sop-card"><h4>Увреждания</h4><p>Асистиране на гости...</p></div>
    </div>`;
}

// === 7. DASHBOARD & KPIs ===
async function updateKPIs() {
    const { count: t } = await _supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'new');
    document.getElementById('kpi-tickets').innerText = t || 0;
}

function initDashboardChart() {
    const ctx = document.getElementById('statsChart')?.getContext('2d');
    if (ctx) new Chart(ctx, {
        type: 'line', data: { labels: ['08:00', '12:00', '16:00', '20:00'], datasets: [{ label: 'Задачи', data: [8, 22, 14, 28], borderColor: '#c5a059', tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}