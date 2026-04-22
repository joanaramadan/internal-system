/**
 * HMS BULGARIA - ENTERPRISE CORE v5.0
 * Configured for Apollo & Helios
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

let currentLang = 'bg';
let currentTab = 'dashboard';
let currentUser = null;
let selectedRoom = null;

// === 2. INITIALIZATION ===
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
    const now = new Date();
    document.getElementById('digital-clock').innerText = now.toLocaleTimeString('bg-BG');
}

function setupUI() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('user-email').innerText = currentUser;
    changeLanguage('bg');
    updateKPIs();
    initDashboardChart();
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Грешка: " + error.message);
    } else {
        currentUser = data.user.email;
        setupUI();
    }
}

function handleLogout() {
    _supabase.auth.signOut();
    location.reload();
}

// === 3. LANGUAGE & NAVIGATION ===
const translations = {
    bg: {
        dashboard: "📊 Табло", matrix: "🏨 Матрица", maintenance: "🛠 Поддръжка", 
        housekeeping: "🧹 Камериерки", reception: "🛎 Рецепция", guest_relations: "🤝 Връзка с гости",
        restaurant: "🍽 Ресторант", handover: "📝 Рапортна книга", sop: "📚 SOP Стандарти",
        logout: "Изход", search: "Търсене на стая или гост...", send: "ЗАПИШИ ЗАЯВКА"
    },
    en: {
        dashboard: "📊 Dashboard", matrix: "🏨 Matrix", maintenance: "🛠 Maintenance", 
        housekeeping: "🧹 Housekeeping", reception: "🛎 Reception", guest_relations: "🤝 Guest Relations",
        restaurant: "🍽 Restaurant", handover: "📝 Handover", sop: "📚 SOP Standards",
        logout: "Logout", search: "Search room or guest...", send: "SAVE REQUEST"
    }
};

function changeLanguage(lang) {
    currentLang = lang;
    renderNav();
    switchTab(currentTab);
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
            row.innerHTML = `<div class="floor-label">Floor ${f}</div>`;
            for (let r = wing.start; r <= wing.end; r++) {
                const num = (f * 100 + r).toString();
                const box = document.createElement('div');
                box.className = `room-box ${statusMap[num] || 'clean'}`;
                box.innerText = num.slice(-2);
                box.onclick = () => openModal(num);
                row.appendChild(box);
            }
            grid.appendChild(row);
        }
    });
}

function openModal(num) {
    selectedRoom = num;
    document.getElementById('modal-room-title').innerText = "Стая " + num;
    document.getElementById('room-status-modal').style.display = 'flex';
}

function closeModal() { document.getElementById('room-status-modal').style.display = 'none'; }

async function updateRoomStatus(newStatus) {
    const { error } = await _supabase.from('rooms').update({ status: newStatus }).eq('room_number', selectedRoom);
    if (!error) {
        renderRoomMatrix();
        closeModal();
    }
}

// === 5. DYNAMIC MODULES & FORMS ===
function renderDynamicModule(id) {
    const container = document.getElementById('form-container');
    const t = translations[currentLang];
    let html = `<div class="card"><h2 class="luxury-title-section">${translations[currentLang][id]}</h2>`;

    switch(id) {
        case 'housekeeping':
            html += `
                <div class="grid-form">
                    <div class="field"><label>Стая</label><input type="text" id="f_room" class="form-control"></div>
                    <div class="field"><label>Услуга</label>
                        <select id="f_service" class="form-control">
                            <option>Почистена стая</option><option>Мръсна стая</option>
                            <option>Не желае почистване (Период)</option><option>Зареждане Минибар</option>
                            <option>Кошара / Доп. легло</option><option>Тоал. хартия</option>
                        </select>
                    </div>
                    <div class="field"><label>От Дата</label><input type="date" id="f_date_start" class="form-control"></div>
                    <div class="field"><label>До Дата</label><input type="date" id="f_date_end" class="form-control"></div>
                </div>`;
            break;
        case 'maintenance':
            html += `
                <div class="grid-form">
                    <div class="field"><label>Стая / Локация</label><input type="text" id="f_room" class="form-control"></div>
                    <div class="field"><label>Проблем</label>