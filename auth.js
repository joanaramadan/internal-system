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

    // Refresh dashboard list periodically. Scheduled Telegram notifications
    // are now sent by the `process-scheduled` Edge Function (pg_cron),
    // so the browser no longer needs to fire them.
    setInterval(() => { if (currentUser) renderTodayRequests(); }, 60 * 1000);
});

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
    renderTodayRequests();
}

function handleLogout() {
    _supabase.auth.signOut().then(() => location.reload());
}