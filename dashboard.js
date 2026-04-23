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