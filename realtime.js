(function () {
    if (typeof _supabase === 'undefined') return;

    let timer = null;
    const refresh = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            try { if (typeof updateKPIs          === 'function') updateKPIs(); }          catch (e) {}
            try { if (typeof renderTodayRequests === 'function') renderTodayRequests(); } catch (e) {}
            try { if (typeof renderRoomMatrix    === 'function') renderRoomMatrix(); }    catch (e) {}
        }, 250);
    };

    _supabase
        .channel('hotel-ops-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms'   }, refresh)
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') console.log('🟢 Realtime connected');
        });
})();