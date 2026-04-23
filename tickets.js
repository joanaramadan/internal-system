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

// Calls the server-side Edge Function. The bot token never touches the browser.
async function sendTelegram(cat, room, serv, desc) {
    try {
        await fetch(TG_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SB_KEY}`
            },
            body: JSON.stringify({
                category: cat,
                room: room,
                service: serv,
                desc: desc,
                user: currentUser
            })
        });
    } catch (e) {
        console.error("Telegram Error", e);
    }
}