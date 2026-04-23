const SB_URL = "https://qajmppuihmorlzljjltm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFham1wcHVpaG1vcmx6bGpqbHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjE4NDgsImV4cCI6MjA5MDY5Nzg0OH0.96UsQD5ux65hifaEdAOELFJU_T8E0s9764rLVTQcRvo";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// Telegram is now sent server-side by the `send-telegram` Edge Function.
// The bot token lives in Supabase secrets, not in this repo.
const TG_FUNCTION_URL = `${SB_URL}/functions/v1/send-telegram`;

let currentLang = 'bg';
let currentTab  = 'dashboard';
let currentUser = null;
let selectedRoom = null;

const translations = {
    bg: { dashboard: "📊 Табло", matrix: "🏨 Матрица", maintenance: "🛠 Поддръжка", housekeeping: "🧹 Камериерки", reception: "🛎 Рецепция", guest_relations: "🤝 Guest Relations", restaurant: "🍽 Ресторант", handover: "📝 Предаване на смяна", sop: "📚 SOP", logout: "Изход", send: "ЗАПИШИ ЗАЯВКА" },
    en: { dashboard: "📊 Dashboard", matrix: "🏨 Matrix", maintenance: "🛠 Maintenance", housekeeping: "🧹 Housekeeping", reception: "🛎 Reception", guest_relations: "🤝 Guest Relations", restaurant: "🍽 Restaurant", handover: "📝 Shift Handover", sop: "📚 SOP", logout: "Logout", send: "SAVE REQUEST" }
};