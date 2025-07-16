/**
 * =================================================================
 * THEME MANAGER - GESTIÓ DE TEMES CLAR/FOSC
 * =================================================================
 * 
 * @file        theme-manager.js
 * @description Gestió automàtica de temes segons preferències del sistema
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-16
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * =================================================================
 */

// === GESTIÓ DE TEMES ===

// Alternar entre tema clar i fosc
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    document.getElementById('theme-toggle').textContent = isDarkMode ? 'Canviar a Mode Clar' : 'Canviar a Mode Fosc';
    // No guardar a localStorage - sempre tornar al tema del sistema en recarregar
}

// Detectar preferència de tema del sistema
function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Carregar tema sempre segons el sistema
function loadSavedTheme() {
    const systemTheme = getSystemTheme();
    const body = document.body;
    
    // Sempre començar amb el tema del sistema
    if (systemTheme === 'dark') {
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