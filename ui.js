function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('bg-BG');
    const elDesk = document.getElementById('digital-clock');
    const elMob  = document.getElementById('digital-clock-mob');
    if (elDesk) elDesk.innerText = timeStr;
    if (elMob)  elMob.innerText  = timeStr.slice(0, 5);
}

function toggleSidebar()      { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebarIfOpen() { document.getElementById('sidebar').classList.remove('open'); }

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

function closeModal() { document.getElementById('room-status-modal').style.display = 'none'; }