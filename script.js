/**
 * HMS BULGARIA - ENTERPRISE CORE v3.0 (FULL VERSION)
 * Wings: Apollo (01-29) | Helios (30-58)
 */

// === 1. КОНФИГУРАЦИЯ (ТВОИТЕ ДАННИ) ===
const SB_URL = "https://qajmppuihmorlzljjltm.supabase.co";
const SB_KEY = "sb_publishable_XPsK25mBIL5bvmVtuz-U2Ww_FDS-SLQ5";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

const TG_BOT_TOKEN = "8645929996:AAHIPLMxDYh-ycxdIKbuld92yDA36EWTFQE";
const TG_GROUPS = {
    housekeeping: "-5150465403",
    maintenance: "-5236955430",
    reception: "-5270987629",
    spa: "-5292367247",
    guest_relations: "-5052426259",
    restaurant: "-5142829359",
    incidents: "-5270987629"
};

// Симулация на SOP данни
const SOP_DATA = [
    { id: 1, title: "Действие при пожар", cat: "Security", icon: "🔥" },
    { id: 2, title: "Стандарт за почистване (HK)", cat: "Housekeeping", icon: "🧹" },
    { id: 3, title: "Регистрация на VIP гост", cat: "Reception", icon: "👑" },
    { id: 4, title: "Профилактика на климатик", cat: "Maintenance", icon: "❄️" }
];

let currentTab = 'dashboard';

// === 2. ИНИЦИАЛИЗАЦИЯ И AUTH ===
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

    if (error) {
        showNotification("Грешка при вход: " + error.message, "danger");
    } else {
        setupUI(data.user.email);
    }
}

async function handleLogout() {
    await _supabase.auth.signOut();
    location.reload();
}

function setupUI(email) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('user-email').innerText = email;
    updateKPIs();
    initDashboardChart();
}

// === 3. НАВИГАЦИЯ ===
function switchTab(tabId) {
    currentTab = tabId;
    
    // Скриване на всички секции
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    // Показване на съответната секция
    if (tabId === 'dashboard') {
        document.getElementById('dashboard-section').style.display = 'block';
        updateKPIs();
    } else if (tabId === 'room-matrix') {
        document.getElementById('matrix-section').style.display = 'block';
        renderRoomMatrix();
    } else if (tabId === 'reports') {
        document.getElementById('reports-section').style.display = 'block';
    } else {
        document.getElementById('form-container').style.display = 'block';
        renderDynamicModule(tabId);
    }

    // Визуално активиране на менюто
    const activeItem = Array.from(document.querySelectorAll('.nav-item'))
        .find(item => item.getAttribute('onclick')?.includes(tabId));
    if (activeItem) activeItem.classList.add('active');
}

// === 4. МАТРИЦА НА СТАИТЕ (APOLLO & HELIOS) ===
async function renderRoomMatrix() {
    const apolloGrid = document.getElementById('apollo-grid');
    const heliosGrid = document.getElementById('helios-grid');
    apolloGrid.innerHTML = '<p style="color:gray; padding:20px;">Зареждане...</p>';
    heliosGrid.innerHTML = '<p style="color:gray; padding:20px;">Зареждане...</p>';

    // Вземаме статусите от Supabase
    const { data: roomsData, error } = await _supabase.from('rooms').select('room_number, status');
    if (error) return console.error("Database Error:", error);
    
    const statusMap = Object.fromEntries(roomsData.map(r => [r.room_number, r.status]));
    
    apolloGrid.innerHTML = '';
    heliosGrid.innerHTML = '';

    for (let f = 1; f <= 6; f++) {
        // Apollo Row (01-29)
        const aRow = document.createElement('div');
        aRow.className = 'floor-row';
        aRow.innerHTML = `<div class="floor-label">Етаж ${f}</div>`;
        for (let r = 1; r <= 29; r++) {
            const num = (f * 100 + r).toString();
            aRow.appendChild(createRoomBox(num, statusMap[num]));
        }
        apolloGrid.appendChild(aRow);

        // Helios Row (30-58)
        const hRow = document.createElement('div');
        hRow.className = 'floor-row';
        hRow.innerHTML = `<div class="floor-label">Етаж ${f}</div>`;
        for (let r = 30; r <= 58; r++) {
            const num = (f * 100 + r).toString();
            hRow.appendChild(createRoomBox(num, statusMap[num]));
        }
        heliosGrid.appendChild(hRow);
    }
}

function createRoomBox(num, status) {
    const div = document.createElement('div');
    div.className = `room-box ${status || 'clean'}`;
    div.innerText = num.slice(-2); // Показваме само 01, 02 и т.н.
    div.title = `Стая ${num} - ${status || 'clean'}`;
    div.onclick = () => alert(`Стая ${num}\nСтатус: ${status || 'clean'}`);
    return div;
}

// === 5. ТИКЕТИ И ТЕЛЕГРАМ ===
async function submitTicket(category) {
    const room = document.getElementById('f-room').value;
    const desc = document.getElementById('f-desc').value;
    const priority = document.getElementById('f-priority').value;

    if (!room || !desc) return showNotification("Попълнете всички полета", "warning");

    const { error } = await _supabase.from('tickets').insert([{
        room_id: room,
        category: category,
        description: desc,
        priority: priority,
        status: 'new'
    }]);

    if (!error) {
        showNotification("Сигналът е изпратен успешно!", "success");
        sendTelegramAlert(category, room, desc, priority);
        switchTab('dashboard');
    } else {
        showNotification("Грешка при запис: " + error.message, "danger");
    }
}

async function sendTelegramAlert(cat, room, desc, priority) {
    const chatId = TG_GROUPS[cat] || TG_GROUPS['reception'];
    const emoji = priority === 'Urgent' ? "🚨" : "🔔";
    const message = `${emoji} *НОВ СИГНАЛ: ${cat.toUpperCase()}*\n📍 Стая: ${room}\n⚠️ Приоритет: ${priority}\n📝 Описание: ${desc}`;

    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;
    
    try {
        fetch(url);
    } catch (e) {
        console.error("Telegram Notification Failed", e);
    }
}

// === 6. РАПОРТНА КНИГА (HANDOVER) ===
async function saveHandover() {
    const note = document.getElementById('h-text').value;
    const userEmail = document.getElementById('user-email').innerText;

    if (!note) return showNotification("Моля, въведете текст", "warning");

    const { error } = await _supabase.from('handovers').insert([{
        note: note,
        user_email: userEmail
    }]);
if (!error) {
        showNotification("Рапортът е запазен!", "success");
        document.getElementById('h-text').value = '';
    } else {
        showNotification("Грешка: " + error.message, "danger");
    }
}

// === 7. ДИНАМИЧНИ МОДУЛИ ===
function renderDynamicModule(type) {
    const container = document.getElementById('form-container');
    
    if (type === 'handover') {
        container.innerHTML = `
            <div class="card">
                <h2>📝 Рапортна книга</h2>
                <textarea id="h-text" placeholder="Запишете важното за следващата смяна..." style="width:100%; height:150px; margin:20px 0; padding:15px; border-radius:12px; border:1px solid #ddd;"></textarea>
                <button class="btn-submit" onclick="saveHandover()">ЗАПИШИ В ДНЕВНИКА</button>
            </div>`;
    } else if (type === 'sop') {
        let sopHtml = `<h2>📚 Стандартни процедури (SOP)</h2><div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:20px;">`;
        SOP_DATA.forEach(sop => {
            sopHtml += `
                <div class="card" style="margin:0; padding:20px; cursor:pointer;" onclick="alert('Отваряне на документ: ${sop.title}')">
                    <div style="font-size:1.5rem; margin-bottom:10px;">${sop.icon}</div>
                    <strong>${sop.title}</strong><br><small style="color:gray;">${sop.cat}</small>
                </div>`;
        });
        sopHtml += `</div>`;
        container.innerHTML = sopHtml;
    } else {
        container.innerHTML = `
            <div class="card">
                <h2>Нов сигнал: ${type.toUpperCase()}</h2>
                <div class="grid-form" style="display:grid; gap:20px; margin-top:20px;">
                    <div class="field"><label>Стая / Локация</label><input type="text" id="f-room" placeholder="напр. 205"></div>
                    <div class="field"><label>Приоритет</label><select id="f-priority"><option value="Normal">Normal</option><option value="Urgent">Urgent 🔥</option></select></div>
                    <div class="field" style="grid-column: span 2;"><label>Описание</label><textarea id="f-desc" style="height:100px;"></textarea></div>
                </div>
                <button class="btn-submit" onclick="submitTicket('${type}')">ИЗПРАТИ СИГНАЛ</button>
            </div>`;
    }
}

// === 8. HELPERS И UI ===
function showNotification(msg, type) {
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.style = `position:fixed; top:20px; right:20px; padding:15px 25px; border-radius:12px; color:white; font-weight:bold; z-index:10000; background:${type === 'danger' ? '#d32f2f' : '#2e7d32'}; box-shadow: 0 5px 15px rgba(0,0,0,0.2); animation: slideIn 0.3s;`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function updateKPIs() {
    const { count: tickets } = await _supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'new');
    const { count: incidents } = await _supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'active');
    
    if(document.getElementById('kpi-tickets')) document.getElementById('kpi-tickets').innerText = tickets || 0;
    if(document.getElementById('kpi-incidents')) document.getElementById('kpi-incidents').innerText = incidents || 0;
}

function initDashboardChart() {
    const ctx = document.getElementById('statsChart')?.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['08:00', '12:00', '16:00', '20:00', '00:00'],
            datasets: [{
                label: 'Натоварване',
                data: [5, 18, 25, 12, 5],
                borderColor: '#c5a059',
                backgroundColor: 'rgba(197, 160, 89, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { display: false }, x: { grid: { display: false } } }
        }
    });
}