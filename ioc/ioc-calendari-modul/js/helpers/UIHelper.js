/**
 * =================================================================
 * UI HELPERS - UTILITATS D'INTERFÍCIE D'USUARI
 * =================================================================
 * 
 * @file        UIHelper.js
 * @description Funcions d'utilitat per la interfície d'usuari i interaccions
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

// Classe d'utilitats d'interfície d'usuari
class UIHelper {
    
    // === MISSATGES I MODALS ===
    
    // Mostrar missatges a l'usuari
    showMessage(message, type = 'info') {
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
    showConfirmModal(message, title = 'Confirmar acció', onConfirm = null) {
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
                modalRenderer.closeModal('confirmModal');
                onConfirm();
            });
        }
        
        // Mostrar modal
        modalRenderer.openModal('confirmModal');
        return true;
    }

}

// === INSTÀNCIA GLOBAL ===
const uiHelper = new UIHelper();