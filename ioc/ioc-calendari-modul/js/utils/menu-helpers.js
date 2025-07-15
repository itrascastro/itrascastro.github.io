// =================================================================
// MENU HELPERS - UTILITATS PER MENÚS CONTEXTUALS
// =================================================================

// === GESTIÓ DE MENÚS D'ACCIONS ===

// Alternar menú d'accions (menú contextual kebab)
function toggleActionsMenu(target) {
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

// === INICIALITZACIÓ ===
function initializeMenuHelpers() {
    console.log('[MenuHelpers] Utilitats de menús inicialitzades');
}