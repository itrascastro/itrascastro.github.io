// =================================================================
// UI HELPERS - UTILITATS D'INTERFÍCIE D'USUARI
// =================================================================

// === MISSATGES I MODALS ===

// Mostrar missatges a l'usuari
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: ${type === 'warning' ? '#000' : '#fff'};
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Modal de confirmació personalitzat
function showConfirmModal(message, title = 'Confirmar acció', onConfirm = null) {
    const modal = document.getElementById('confirmModal');
    const titleElement = document.getElementById('confirmModalTitle');
    const messageElement = document.getElementById('confirmModalMessage');
    const confirmBtn = document.getElementById('confirmModalConfirmBtn');
    
    if (!modal || !titleElement || !messageElement || !confirmBtn) return false;
    
    // Configurar contingut
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    // Netejar event listeners previs
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Configurar nou event listener
    if (onConfirm) {
        newConfirmBtn.addEventListener('click', () => {
            closeModal('confirmModal');
            onConfirm();
        });
    }
    
    // Mostrar modal
    openModal('confirmModal');
    return true;
}

// === HELPERS DE RENDERITZAT ===

// Crear HTML d'un sol esdeveniment
function createSingleEventHTML(event, calendar) {
    return monthRenderer.generateEventHTML(event, calendar, 'DOM');
}

// Crear HTML d'una cel·la de dia
function createDayCellHTML(date, isOutOfMonth, calendar) {
    const dayData = monthRenderer.generateDayData(date, calendar, isOutOfMonth);
    return monthRenderer.generateDayCellHTML(dayData, calendar, 'DOM');
}

// === INICIALITZACIÓ ===
function initializeUIHelpers() {
    console.log('[UIHelpers] Utilitats d\'interfície inicialitzades');
}