/**
 * HMS Bulgaria - Enterprise Logic v2.8 (Full Multilingual)
 */
// === КОНФИГУРАЦИЯ ===
const SB_URL = "https://qajmppuihmorlzljjltm.supabase.co";
const SB_KEY = "sb_publishable_XPsK25mBIL5bvmVtuzU2Ww_FDS-SLQ5"; 
const TG_TOKEN = "8645929996:AAHIPLMxDYh-ycxdIKbuld92yDA36EWTFQE";

// Вместо променливата _supabase, използвай директно това:
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// === 1. РЕЧНИК С ПРЕВОДИ ===
const translations = {
    bg: {
        dashboard: "📊 Табло",
        maintenance: "🛠 Техническа поддръжка",
        housekeeping: "🧹 Камериерки",
        reception: "🛎 Рецепция",
        active_tasks: "Активни задачи",
        urgent_incidents: "Спешни инциденти",
        welcome: "Служител:",
        send_btn: "ИЗПРАТИ ЗАЯВКА",
        room: "Стая",
        priority: "Приоритет",
        desc: "Описание",
        logout: "🏃 Изход"
    },
    en: {
        dashboard: "📊 Dashboard",
        maintenance: "🛠 Maintenance",
        housekeeping: "🧹 Housekeeping",
        reception: "🛎 Reception",
        active_tasks: "Active Tasks",
        urgent_incidents: "Urgent Incidents",
        welcome: "User:",
        send_btn: "SEND REQUEST",
        room: "Room",
        priority: "Priority",
        desc: "Description",
        logout: "🏃 Logout"
    }
};

// === 2. КОНФИГУРАЦИЯ ===
const SB_URL = "https://qajmppuihmorlzljjltm.supabase.co";
const SB_KEY = window.env?.SB_KEY || ""; 
const TG_TOKEN = window.env?.TG_TOKEN || "";

const _supabase = supabase.createClient(SB_URL, SB_KEY);

const TG_GROUPS = {
    housekeeping: "-5150465403",
    maintenance: "-5236955430",
    reception: "-5270987629",
    incidents: "-5270987629"
};

let currentTab = 'maintenance';
let currentLang = 'bg';

// === 3. ИНИЦИАЛИЗАЦИЯ И AUTH ===
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        setupUI(session.user.email);
    } else {
        document.getElementById('login-screen').style.display = 'flex';
    }
});

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) alert("Грешка: " + error.message);
    else setupUI(data.user.email);
}

function setupUI(email) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('user-email').innerText = email;
    changeLang('bg'); // Стартираме с български по подразбиране
    updateKPIs();
}

// === 4. ПРЕВОД И ЕЗИЦИ ===
function changeLang(lang) {
    currentLang = lang;
    const t = translations[lang];

    // Обновяване на менюто (използваме индекси според подредбата в HTML)
    const items = document.querySelectorAll('.nav-item');
    items[0].innerHTML = t.dashboard;
    items[1].innerHTML = t.maintenance;
    items[2].innerHTML = t.housekeeping;
    items[3].innerHTML = t.reception;
    if(items[8]) items[8].innerHTML = t.logout;

    // Обновяване на Таблото
    const h3Elements = document.querySelectorAll('.kpi-card h3');
    if(h3Elements[0]) h3Elements[0].innerText = t.active_tasks;
    if(h3Elements[1]) h3Elements[1].innerText = t.urgent_incidents;

    renderForm();
}

// === 5. ИНТЕРФЕЙС И ФОРМИ ===
function switchTab(tabId) {
    currentTab = tabId;
    const dash = document.getElementById('dashboard-section');
    const form = document.getElementById('form-container');

    if (tabId === 'dashboard') {
        dash.style.display = 'block';
        form.style.display = 'none';
    } else {
        dash.style.display = 'none';
        form.style.display = 'block';
        renderForm();
    }

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

async function renderForm() {
    const container = document.getElementById('form-container');
    const t = translations[currentLang];

    if (currentTab === 'incidents') {
        container.innerHTML = `<div class="card"><h3>🚑 Incident Report</h3><button class="btn-submit danger" onclick="submitIncident()">SEND EMERGENCY</button></div>`;
    } else {
        container.innerHTML = `
            <div class="card">
                <h3>🛠 ${currentTab.toUpperCase()}</h3>
                <div class="grid-form">
                    <div class="field"><label>${t.room}</label><select id="f_room"></select></div>
                    <div class="field"><label>${t.priority}</label>
                        <select id="f_priority"><option value="Normal">Normal</option><option value="Urgent">Urgent</option></select>
                    </div>
                    <div class="field full"><label>${t.desc}</label><textarea id="f_desc"></textarea></div>
                </div>
                <button class="btn-submit" onclick="submitTicket()">${t.send_btn}</button>
            </div>`;
    }
    await loadRooms();
}

// === 6. БАЗА ДАННИ И ТЕЛЕГРАМ ===
async function loadRooms() {
    const { data: rooms } = await _supabase.from('rooms').select('room_number').order('room_number');
    const select = document.getElementById('f_room');
    if (select && rooms) select.innerHTML = rooms.map(r => `<option value="${r.room_number}">${r.room_number}</option>`).join('');
}

async function submitTicket() {
    const room = document.getElementById('f_room').value;
    const { error } = await _supabase.from('tickets').insert([{
        room_id: room, category: currentTab, description: { text: document.getElementById('f_desc').value }, status: 'new'
    }]);

    if (!error) {
        alert("Success!");
        switchTab('dashboard');
        updateKPIs();
    }
}

async function updateKPIs() {
    const { count: tickets } = await _supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'new');
    const { count: incidents } = await _supabase.from('incidents').select('*', { count: 'exact', head: true });
    
    document.getElementById('kpi-active').innerText = tickets || 0;
    document.getElementById('kpi-incidents').innerText = incidents || 0;
  }
