// =================================================================
// THEME MANAGER - GESTIÓ DE TEMES CLAR/FOSC
// =================================================================

// === GESTIÓ DE TEMES ===

// Alternar entre tema clar i fosc
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    document.getElementById('theme-toggle').textContent = isDarkMode ? 'Canviar a Mode Clar' : 'Canviar a Mode Fosc';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

// Carregar tema guardat des de localStorage
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        document.getElementById('theme-toggle').textContent = 'Canviar a Mode Clar';
    } else {
        body.classList.remove('dark-mode');
        document.getElementById('theme-toggle').textContent = 'Canviar a Mode Fosc';
    }
}

// === INICIALITZACIÓ ===
function initializeThemeManager() {
    console.log('[ThemeManager] Gestor de temes inicialitzat');
}