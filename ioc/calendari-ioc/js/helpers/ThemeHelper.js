/**
 * =================================================================
 * THEME MANAGER - GESTIÓ DE TEMES CLAR/FOSC
 * =================================================================
 * 
 * @file        ThemeHelper.js
 * @description Gestió automàtica de temes segons preferències del sistema
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-16
 * @project     Calendari IOC
 * @repository  https://github.com/itrascastro/calendari-ioc
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * =================================================================
 */

// Classe d'utilitats per gestió de temes
class ThemeHelper {
    
    // === GESTIÓ DE TEMES ===
    
    // Alternar entre tema clar i fosc
    toggleTheme() {
        const body = document.body;
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        document.getElementById('theme-toggle').textContent = isDarkMode ? 'Mode Clar' : 'Mode Fosc';
        // No guardar a localStorage - sempre tornar al tema del sistema en recarregar
    }
    
    // Detectar preferència de tema del sistema
    getSystemTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Carregar tema sempre segons el sistema
    loadSavedTheme() {
        const systemTheme = this.getSystemTheme();
        const body = document.body;
        
        // Sempre començar amb el tema del sistema
        if (systemTheme === 'dark') {
            body.classList.add('dark-mode');
            document.getElementById('theme-toggle').textContent = 'Mode Clar';
        } else {
            body.classList.remove('dark-mode');
            document.getElementById('theme-toggle').textContent = 'Mode Fosc';
        }
    }

}

// === INSTÀNCIA GLOBAL ===
const themeHelper = new ThemeHelper();