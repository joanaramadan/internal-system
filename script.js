/**
 * HMS BULGARIA - ENTERPRISE LOGIC v3.0
 * Wings: Apollo (01-29) & Helios (30-58)
 */

// === 1. КОНФИГУРАЦИЯ И СЪСТОЯНИЕ ===
const SB_URL = "https://your-project.supabase.co";
const SB_KEY = "your-anon-key";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let currentTab = 'dashboard';
let currentLang = 'bg';

// Примерни данни за SOP (в реална среда идват от БД)
const SOP_DATABASE = [
    { id: 1, title: "Протокол при Пожар", cat: "Security", content: "1. Запазете самообладание..." },
    { id: 2, title: "Почистване на ВИП стая", cat: "HK", content: "Специално внимание към терасата..." },
    { id: 3, title: "Работа с IncoPOS", cat: "IT", content: "При грешка в касовия апарат..." }
];

// === 2. ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        setupUI(session.user.email);
    } else {
        document.getElementById('login-screen').style.display = 'flex';
    }
    
    // Търсене в реално време (hotelkit style)
    document.getElementById('global-search').addEventListener('input', (e) => {
        handleGlobalSearch(e.target.value);
    });
});

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showNotification("Грешка при вход!", "danger");
    } else {
        setupUI(data.user.email);
    }
}

function setupUI(email) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('user-email').innerText = email;
    updateKPIs();
    initDashboardChart();
    // Стартираме цикъл за проверка на ескалации (Hot SOS style)
    setInterval(checkEscalations, 60000); 
}

// === 3. НАВИГАЦИЯ И МОДУЛИ ===
function switchTab(tabId) {
    currentTab = tabId;
    
    // Скриване на всички секции
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    // Показване на правилната секция
    if (tabId === 'dashboard') {
        document.getElementById('dashboard-section').style.display = 'block';
    } else if (tabId === 'room-matrix') {
        document.getElementById('matrix-section').style.display = 'block';
        renderRoomMatrix();
    } else if (tabId === 'reports') {
        document.getElementById('reports-section').style.display = 'block';
    } else {
        document.getElementById('form-container').style.display = 'block';
        renderDynamicModule(tabId);
    }

    // Маркиране на активно меню
    const activeItem = Array.from(document.querySelectorAll('.nav-item'))
        .find(item => item.getAttribute('onclick')?.includes(tabId));
    if (activeItem) activeItem.classList.add('active');
}

// === 4. МОДУЛ: ROOM MATRIX (HotelTime Style) ===
function renderRoomMatrix() {
    const apolloGrid = document.getElementById('apollo-grid');
    const heliosGrid = document.getElementById('helios-grid');
    
    apolloGrid.innerHTML = '';
    heliosGrid.innerHTML = '';

    const floors = [1, 2, 3, 4, 5, 6];

    floors.forEach(floor => {
        // APOLLO (01-29)
        const aRow = document.createElement('div');
        aRow.className = 'floor-row';
        aRow.innerHTML = `<div class="floor-label">Етаж ${floor}</div>`;
        for (let i = 1; i <= 29; i++) {
            aRow.appendChild(createRoomElement(floor * 100 + i));
        }
        apolloGrid.appendChild(aRow);

        // HELIOS (30-58)
        const hRow = document.createElement('div');
        hRow.className = 'floor-row';
        hRow.innerHTML = `<div class="floor-label">Етаж ${floor}</div>`;
        for (let i = 30; i <= 58; i++) {
            hRow.appendChild(createRoomElement(floor * 100 + i));
        }
        heliosGrid.appendChild(hRow);
    });
}

function createRoomElement(roomNum) {
    const div = document.createElement('div');
    div.className = 'room-box';
    
    // Симулация на статуси (В реална БД ще правим fetch)
    const statuses = ['clean', 'dirty', 'process', 'ooo'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    div.classList.add(randomStatus);
    div.innerText = roomNum.toString().slice(-2); // Показваме само суфикса за красота
    div.title = `Стая ${roomNum}`;
    
    div.onclick = () => openRoomAction(roomNum);
    return div;
}

// === 5. МОДУЛ: ДИНАМИЧНИ ФОРМИ И SOP ===
function renderDynamicModule(type) {
    const container = document.getElementById('form-container');
    
    if (type === 'sop') {
        container.innerHTML = `<h2>📚 SOP Наръчник</h2><div class="grid-form" id="sop-list"></div>`;
        const list = document.getElementById('sop-list');
        SOP_DATABASE.forEach(sop => {
            list.innerHTML += `
                <div class="card" style="margin:10px; cursor:pointer;" onclick="alert('${sop.content}')">
                    <strong>${sop.title}</strong><br><small>${sop.cat}</small>
                </div>`;
        });
    } else if (type === 'handover') {
        container.innerHTML = `
            <div class="card">
                <h2>📝 Рапортна книга</h2>
                <textarea id="h-text" placeholder="Важна информация за следващата смяна..." style="width:100%; height:150px; padding:15px; border-radius:8px; border:1px solid #ddd;"></textarea>
                <button class="btn-submit" style="margin-top:15px;" onclick="saveHandover()">ЗАПИШИ РАПОРТ</button>
            </div>
        `;
    } else {
        // Стандартна форма за сигнали (Maintenance / HK)
        container.innerHTML = `
            <div class="card">
                <h2>Нов сигнал: ${type.toUpperCase()}</h2>
                <div class="grid-form">
                    <div class="field"><label>Стая</label><input type="text" id="f-room" placeholder="напр. 302"></div>
                    <div class="field"><label>Приоритет</label>
                        <select id="f-priority">
                            <option value="Normal">Нормален</option>
                            <option value="Urgent">Спешен (Hot SOS)</option>
                        </select>
                    </div>
                    <div class="field full"><label>Описание</label><textarea id="f-desc"></textarea></div>
                </div>
                <button class="btn-submit" onclick="submitTicket('${type}')">ИЗПРАТИ СИГНАЛ</button>
            </div>
        `;
    }
}

// === 6. АВТОМАТИЗАЦИИ И ДАННИ ===
async function submitTicket(category) {
    const room = document.getElementById('f-room').value;
    const desc = document.getElementById('f-desc').value;
    const priority = document.getElementById('f-priority').value;

    const { error } = await _supabase.from('tickets').insert([{
       room_id: room,
        category: category,
        description: desc,
        priority: priority,
        status: 'new',
        created_at: new Date()
    }]);

    if (!error) {
        showNotification("Сигналът е приет!", "success");
        if (priority === 'Urgent') sendUrgentAlert(room, desc); // Hot SOS Ескалация
        switchTab('dashboard');
        updateKPIs();
    }
}

async function updateKPIs() {
    const { count: tickets } = await _supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'new');
    const { count: incidents } = await _supabase.from('incidents').select('*', { count: 'exact', head: true });
    
    document.getElementById('kpi-tickets').innerText = tickets || 0;
    document.getElementById('kpi-incidents').innerText = incidents || 0;
}

// === 7. ФУНКЦИИ ЗА ЛУКСОЗЕН ОПИТ (UX) ===
function showNotification(msg, type) {
    const toast = document.createElement('div');
    toast.style = `position:fixed; top:20px; right:20px; background:white; padding:15px 25px; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.1); border-left:5px solid ${type === 'danger' ? '#d32f2f' : '#2e7d32'}; z-index:9999; animation: slideIn 0.3s forwards;`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function handleGlobalSearch(val) {
    // Търсене в стаи или SOP (проста имплементация)
    console.log("Searching for:", val);
}

function initDashboardChart() {
    const ctx = document.getElementById('statsChart')?.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
            datasets: [{
                label: 'Натоварване на екипа',
                data: [10, 25, 45, 30, 20, 15],
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

// Hot SOS Logic: Проверка за забавени задачи
async function checkEscalations() {
    const now = new Date();
    // Тук бихме проверили задачи на повече от 30 мин, които са още със статус 'new'
    console.log("Hot SOS: Проверка за ескалации...");
}

async function handleLogout() {
    await _supabase.auth.signOut();
    location.reload();
}