/**
 * =================================================================
 * MENU HELPERS - UTILITATS PER MENÚS CONTEXTUALS
 * =================================================================
 * 
 * @file        MenuHelper.js
 * @description Funcions d'utilitat per gestió de menús contextuals i dropdowns
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

// Classe d'utilitats per menús contextuals
class MenuHelper {
    
    // === GESTIÓ DE MENÚS D'ACCIONS ===
    
    // Alternar menú d'accions (menú contextual)
    toggleActionsMenu(target) {
        const dropdown = target.nextElementSibling;
        const isOpen = dropdown.classList.contains('show');
        
        // Tancar tots els menús oberts
        document.querySelectorAll('.actions-dropdown').forEach(menu => {
            menu.classList.remove('show');
        });
        
        // Obrir/tancar el menú clickeat
        if (!isOpen) {
            dropdown.classList.add('show');
            
            // Tancar menú al fer clic fora
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    if (!target.contains(e.target) && !dropdown.contains(e.target)) {
                        dropdown.classList.remove('show');
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }, 0);
        }
    }

}

// === INSTÀNCIA GLOBAL ===
const menuHelper = new MenuHelper();