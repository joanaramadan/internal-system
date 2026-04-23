const SB_URL = "https://qajmppuihmorlzljjltm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFham1wcHVpaG1vcmx6bGpqbHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjE4NDgsImV4cCI6MjA5MDY5Nzg0OH0.96UsQD5ux65hifaEdAOELFJU_T8E0s9764rLVTQcRvo";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

const TG_BOT_TOKEN = "8645929996:AAHIPLMxDYh-ycxdIKbuld92yDA36EWTFQE";
const TG_GROUPS = {
    housekeeping:    "-5150465403",
    maintenance:     "-5236955430",
    reception:       "-5270987629",
    spa:             "-5292367247",
    guest_relations: "-5052426259",
    restaurant:      "-5142829359"
};

let currentLang = 'bg';
let currentTab  = 'dashboard';
let currentUser = null;
let selectedRoom = null;

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

    setInterval(processScheduledRequests, 60 * 1000);
});

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('bg-BG');
    const elDesk = document.getElementById('digital-clock');
    const elMob  = document.getElementById('digital-clock-mob');
    if (elDesk) elDesk.innerText = timeStr;
    if (elMob)  elMob.innerText  = timeStr.slice(0, 5);
}

async function handleLogin() {
    const email    = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) { alert("Грешка при вход: " + error.message); return; }
    currentUser = data.user.email;
    setupUI();
}

function setupUI() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('user-email').innerText = currentUser;
    changeLanguage('bg');
    switchTab('dashboard');
    processScheduledRequests();
}

function handleLogout() {
    _supabase.auth.signOut().then(() => location.reload());
}

function toggleSidebar()      { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebarIfOpen() { document.getElementById('sidebar').classList.remove('open'); }

const translations = {
    bg: { dashboard: "📊 Табло", matrix: "🏨 Матрица", maintenance: "🛠 Поддръжка", housekeeping: "🧹 Камериерки", reception: "🛎 Рецепция", guest_relations: "🤝 Guest Relations", restaurant: "🍽 Ресторант", handover: "📝 Предаване на смяна", sop: "📚 SOP", logout: "Изход", send: "ЗАПИШИ ЗАЯВКА" },
    en: { dashboard: "📊 Dashboard", matrix: "🏨 Matrix", maintenance: "🛠 Maintenance", housekeeping: "🧹 Housekeeping", reception: "🛎 Reception", guest_relations: "🤝 Guest Relations", restaurant: "🍽 Restaurant", handover: "📝 Shift Handover", sop: "📚 SOP", logout: "Logout", send: "SAVE REQUEST" }
};

function changeLanguage(lang) { currentLang = lang; renderNav(); }

function renderNav() {
    const nav = document.getElementById('main-nav');
    const t = translations[currentLang];
    const menu = [
        { id: 'dashboard',       label: t.dashboard },
        { id: 'room-matrix',     label: t.matrix },
        { id: 'maintenance',     label: t.maintenance },
        { id: 'housekeeping',    label: t.housekeeping },
        { id: 'reception',       label: t.reception },
        { id: 'guest_relations', label: t.guest_relations },
        { id: 'restaurant',      label: t.restaurant },
        { id: 'handover',        label: t.handover },
        { id: 'sop',             label: t.sop }
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

    document.body.className = '';
    document.body.classList.add('dept-' + id);

    document.querySelectorAll('.section').forEach(s => { s.style.display = 'none'; s.classList.remove('active'); });

    const target = (id === 'dashboard') ? 'dashboard-section'
                 : (id === 'room-matrix' ? 'matrix-section' : 'form-container');
    const el = document.getElementById(target);
    if (el) { el.style.display = 'block'; el.classList.add('active'); }

    if (id === 'room-matrix')      renderRoomMatrix();
    else if (id !== 'dashboard')   renderDynamicModule(id);
    else { updateKPIs(); initDashboardChart(); renderTodayRequests(); }

    closeSidebarIfOpen();
}

async function renderRoomMatrix() {
    const { data: rooms } = await _supabase.from('rooms').select('room_number, status');
    const statusMap = Object.fromEntries((rooms || []).map(r => [r.room_number, r.status]));

    const wings = [ { id: 'apollo-grid', s: 1, e: 29 }, { id: 'helios-grid', s: 30, e: 58 } ];
    wings.forEach(w => {
        const grid = document.getElementById(w.id);
        if (!grid) return;
        grid.innerHTML = '';
        for (let f = 1; f <= 6; f++) {
            const row = document.createElement('div');
            row.className = 'floor-row';
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
    closeModal();
    renderRoomMatrix();
}

function closeModal() { document.getElementById('room-status-modal').style.display = 'none'; }

function renderDynamicModule(id) {
    const container = document.getElementById('form-container');
    const today = new Date().toISOString().split('T')[0];
    let html = `<div class="card"><h2 class="section-title">${translations[currentLang][id]}</h2>`;

    if (id === 'housekeeping') {
        html += `
            <div class="grid-form">
                <div class="field">
                    <label>Тип</label>
                    <select id="f_type" class="form-control" onchange="toggleHK(this.value)">
                        <option value="once">Днес / Еднократно</option>
                        <option value="period">За период</option>
<option value="future">Бъдеща заявка</option>
                    </select>
                </div>
                <div class="field"><label>Стая</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field" id="hk_date_box"><label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                <div class="field">
                    <label>Услуга</label>
                    <select id="f_service" class="form-control">
                        <option>Почистена стая</option>
                        <option>Мръсна стая</option>
                        <option>Не желае почистване</option>
                        <option>Минибар</option>
                        <option>Кошара</option>
                        <option>Доп. легло</option>
                        <option>Тоал. хартия</option>
                        <option>Други</option>
                    </select>
                </div>
                <div class="field full"><label>Коментар</label><textarea id="f_comments" class="form-control" rows="3" placeholder="Допълнителни бележки..."></textarea></div>
            </div>`;
    } else if (id === 'maintenance') {
        html += `
            <div class="grid-form">
                <div class="field"><label>Стая / Локация</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field">
                    <label>Технически проблем</label>
                    <select id="f_service" class="form-control">
                        <option>Минибар шуми</option>
                        <option>Минибар не работи</option>
                        <option>Климатик шуми</option>
                        <option>Климатик не работи</option>
                        <option>Крушка - легло</option>
                        <option>Крушка - баня</option>
                        <option>Крушка - коридор</option>
                        <option>Сейф - батерии</option>
                        <option>Сейф - блокиран</option>
                        <option>Казанче</option>
                        <option>Теч</option>
                        <option>Асансьор / Lift</option>
                        <option>Други</option>
                    </select>
                </div>
                <div class="field full"><label>Описание на повредата</label><textarea id="f_desc" class="form-control" rows="3"></textarea></div>
                <div class="field full"><label>Коментар</label><textarea id="f_comments" class="form-control" rows="2" placeholder="Допълнителни бележки..."></textarea></div>
            </div>`;
    } else if (id === 'reception') {
        html += `
            <div class="grid-form">
                <div class="field">
                    <label>Тип</label>
                    <select id="f_type" class="form-control">
                        <option value="now">Сега / Днес</option>
                        <option value="future">Бъдеща заявка (събуждане и др.)</option>
                    </select>
                </div>
                <div class="field"><label>Стая</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field">
                    <label>Услуга</label>
                    <select id="f_service" class="form-control">
                        <option>Събуждане ⏰</option>
                        <option>Трансфер / Такси 🚕</option>
                        <option>Оплакване ⚠️</option>
                        <option>Други</option>
                    </select>
                </div>
                <div class="field"><label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                <div class="field"><label>Час</label><input type="time" id="f_time" class="form-control"></div>
                <div class="field full"><label>Коментар</label><textarea id="f_comments" class="form-control" rows="3" placeholder="Допълнителни бележки за гост / услуга..."></textarea></div>
            </div>`;
    } else if (id === 'restaurant') {
        html += `
            <div class="grid-form">
                <div class="field"><label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                <div class="field"><label>Услуга</label><select id="f_service" class="form-control"><option>Ранна закуска</option><option>Късна вечеря</option><option>Други</option></select></div>
                <div class="field"><label>Възрастни</label><input type="number" id="f_adults" value="2" class="form-control"></div>
                <div class="field"><label>Деца</label><input type="number" id="f_kids" value="0" class="form-control"></div>
                <div class="field full"><label>Коментар</label><textarea id="f_comments" class="form-control" rows="2"></textarea></div>
            </div>`;
    } else if (id === 'handover') {
        html += `
            <div class="grid-form">
                <div class="field">
                    <label>Касова наличност (лв)</label>
                    <div class="money-input">
                        <input type="number" inputmode="decimal" step="0.01" id="f_cash" class="form-control money" placeholder="0.00">
                        <span class="currency">лв</span>
                    </div>
                    <div class="money-chips">
                        <button type="button" class="money-chip" onclick="addMoney('f_cash', 10)">+10</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_cash', 20)">+20</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_cash', 50)">+50</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_cash', 100)">+100</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_cash', 500)">+500</button>
                        <button type="button" class="money-chip clear" onclick="clearMoney('f_cash')">Изчисти</button>
                    </div>
                </div>
                <div class="field">
                    <label>По карта (лв)</label>
                    <div class="money-input">
                        <input type="number" inputmode="decimal" step="0.01" id="f_card" class="form-control money" placeholder="0.00">
                        <span class="currency">лв</span>
                    </div>
                    <div class="money-chips">
                        <button type="button" class="money-chip" onclick="addMoney('f_card', 10)">+10</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_card', 20)">+20</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_card', 50)">+50</button>
                        <button type="button" class="money-chip" onclick="addMoney('f_card', 100)">+100</button>
<button type="button" class="money-chip" onclick="addMoney('f_card', 500)">+500</button>
                        <button type="button" class="money-chip clear" onclick="clearMoney('f_card')">Изчисти</button>
                    </div>
                </div>
                <div class="field"><label>Приел смяна</label><input type="text" id="f_receiver" class="form-control"></div>
                <div class="field full"><label>Важни бележки за следващата смяна</label><textarea id="f_desc" class="form-control" rows="4"></textarea></div>
            </div>`;
    } else if (id === 'sop') {
        html += `<div class="sop-grid"><div class="card"><h4>VIP Стандарт</h4><p>Протокол за ВИП...</p></div><div class="card"><h4>Евакуация</h4><p>Процедура при пожар...</p></div><div class="card"><h4>Хора с увреждания</h4><p>Асистиране на гости...</p></div></div>`;
    } else if (id === 'guest_relations') {
        html += `
            <div class="grid-form">
                <div class="field">
                    <label>Тип</label>
                    <select id="f_type" class="form-control">
                        <option value="now">Сега / Днес</option>
                        <option value="future">Бъдеща заявка</option>
                    </select>
                </div>
                <div class="field"><label>Стая</label><input type="text" id="f_room" class="form-control"></div>
                <div class="field">
                    <label>Услуга</label>
                    <select id="f_service" class="form-control">
                        <option>Трансфер</option>
                        <option>Екскурзия</option>
                        <option>Планиране на деня</option>
                        <option>Алергии</option>
                        <option>Други</option>
                    </select>
                </div>
                <div class="field"><label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control"></div>
                <div class="field"><label>Час</label><input type="time" id="f_time" class="form-control"></div>
                <div class="field full"><label>Детайли</label><textarea id="f_desc" class="form-control" rows="3"></textarea></div>
                <div class="field full"><label>Коментар</label><textarea id="f_comments" class="form-control" rows="2"></textarea></div>
            </div>`;
    }

    if (id !== 'sop') html += `<button class="btn-submit" onclick="submitTicket('${id}')">${translations[currentLang].send}</button>`;
    html += `</div>`;
    container.innerHTML = html;
}

function toggleHK(v) {
    const box = document.getElementById('hk_date_box');
    const today = new Date().toISOString().split('T')[0];
    if (v === 'period') {
        box.innerHTML = `<label>Период</label><div style="display:flex;gap:5px"><input type="date" id="f_date_start" class="form-control"><input type="date" id="f_date_end" class="form-control"></div>`;
    } else if (v === 'future') {
        box.innerHTML = `<label>Дата и час</label><div style="display:flex;gap:5px"><input type="date" id="f_date" value="${today}" class="form-control"><input type="time" id="f_time" class="form-control"></div>`;
    } else {
        box.innerHTML = `<label>Дата</label><input type="date" id="f_date" value="${today}" class="form-control">`;
    }
}

function addMoney(id, amount) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = parseFloat(el.value || '0') || 0;
    el.value = (current + amount).toFixed(2);
}
function clearMoney(id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
}

function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }

function buildScheduledFor(cat) {
    const type = val('f_type');
    const date = val('f_date');
    const time = val('f_time');
    const isFuture =
        (cat === 'reception'        && (type === 'future' || time)) ||
        (cat === 'guest_relations'  && (type === 'future' || time)) ||
        (cat === 'housekeeping'     &&  type === 'future' && time);
    if (!isFuture || !date) return null;
    const t = time || '09:00';
    return new Date(`${date}T${t}:00`).toISOString();
}

async function submitTicket(cat) {
    const room     = val('f_room')     || null;
    const service  = val('f_service')  || '';
    const desc     = val('f_desc')     || '';
    const comments = val('f_comments') || '';
    const adults   = val('f_adults');
    const kids     = val('f_kids');
    const cash     = val('f_cash');
    const card     = val('f_card');
    const receiver = val('f_receiver');

    const parts = [];
    if (service)  parts.push(service);
    if (desc)     parts.push(desc);
    if (adults || kids) parts.push(`A:${adults || 0} K:${kids || 0}`);
    if (cash || card)   parts.push(`Cash:${cash || 0} Card:${card || 0}`);
    if (receiver) parts.push(`Приел: ${receiver}`);
    const finalDesc = parts.join(' | ');

    const scheduledFor = buildScheduledFor(cat);

    const payload = {
        category:    cat,
        description: finalDesc,
        created_by:  currentUser,
        status:      'new',
        room_number: room,
        service:     service,
        comments:    comments,
        scheduled_for: scheduledFor,
        notified:    scheduledFor ? false : true
    };

    const { error } = await _supabase.from('tickets').insert([payload]);

    if (error) {
        console.error('Insert error:', error);
        alert("Грешка при запис: " + error.message);
        return;
    }

    alert(scheduledFor
        ? "Бъдещата заявка е записана! Ще се появи на таблото и Telegram уведомлението ще бъде изпратено около " + new Date(scheduledFor).toLocaleString('bg-BG')
        : "Заявката е записана успешно!");

    if (!scheduledFor) sendTelegram(cat, room, service, desc || comments);

    switchTab('dashboard');
}

async function sendTelegram(cat, room, serv, desc) {
    const groupId = TG_GROUPS[cat];
    if (!groupId) return;
    const msg = `🔔 *НОВА ЗАЯВКА: ${cat.toUpperCase()}*\n👤 Автор: ${currentUser}\n📍 Стая: ${room || '-'}\n🛠 ${serv || '-'}\n📝 ${desc || '-'}`;
    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage?chat_id=${groupId}&text=${encodeURIComponent(msg)}&parse_mode=Markdown`;
    fetch(url).catch(e => console.error("Telegram Error", e));
}

async function processScheduledRequests() {
    if (!currentUser) return;
    const nowIso = new Date().toISOString();
    const { data: due, error } = await _supabase
        .from('tickets')
        .select('id, category, room_number, service, description, comments, scheduled_for')
        .eq('notified', false)
        .not('scheduled_for', 'is', null)
        .lte('scheduled_for', nowIso);

    if (error) { console.error('Scheduled fetch error:', error); return; }
    if (!due || !due.length) { renderTodayRequests(); return; }
for (const t of due) {
        await sendTelegram(
            t.category,
            t.room_number,
            t.service,
            (t.description || '') + (t.comments ? ` | ${t.comments}` : '')
        );
        await _supabase.from('tickets').update({ notified: true }).eq('id', t.id);
    }
    renderTodayRequests();
}

async function updateKPIs() {
    const { count: t } = await _supabase.from('tickets')
        .select('*', { count: 'exact', head: true }).eq('status', 'new');
    const elT = document.getElementById('kpi-tickets');
    if (elT) elT.innerText = t || 0;

    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    const { count: today } = await _supabase.from('tickets')
        .select('*', { count: 'exact', head: true })
        .not('scheduled_for', 'is', null)
        .gte('scheduled_for', start.toISOString())
        .lte('scheduled_for', end.toISOString());
    const elToday = document.getElementById('kpi-today');
    if (elToday) elToday.innerText = today || 0;
}

async function renderTodayRequests() {
    const list = document.getElementById('today-requests');
    if (!list) return;
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    const { data, error } = await _supabase
        .from('tickets')
        .select('id, category, room_number, service, scheduled_for, notified, comments')
        .not('scheduled_for', 'is', null)
        .gte('scheduled_for', start.toISOString())
        .lte('scheduled_for', end.toISOString())
        .order('scheduled_for', { ascending: true });

    if (error) { console.error(error); return; }
    if (!data || !data.length) {
        list.innerHTML = `<p class="empty-state">Няма планирани заявки за днес.</p>`;
        return;
    }
    list.innerHTML = data.map(r => {
        const time = new Date(r.scheduled_for).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
        const done = r.notified ? 'done' : '';
        return `
          <div class="today-item ${done}">
            <div class="ti-time">${time}</div>
            <div class="ti-info">
              <div class="ti-cat">${r.category} · Стая ${r.room_number || '-'}</div>
              <div><strong>${r.service || ''}</strong>${r.comments ? ' — ' + r.comments : ''}</div>
            </div>
            <div>${r.notified ? '✅' : '⏳'}</div>
          </div>`;
    }).join('');
}

function initDashboardChart() {
    const canvas = document.getElementById('statsChart');
    if (!canvas) return;
    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels: ['08:00', '12:00', '16:00', '20:00'],
                datasets: [{ label: 'Натоварване', data: [15, 30, 20, 45], borderColor: '#c5a059', tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}