/**
 * =================================================================
 * DRAG & DROP HELPERS - UTILITATS PER ARROSSEGAR I SOLTAR
 * =================================================================
 * 
 * @file        drag-drop-helpers.js
 * @description Funcions d'utilitat per funcionalitat de drag & drop d'esdeveniments
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

// === CONFIGURACIÓ DE DRAG & DROP ===

// Configurar drag & drop per un contenidor de calendari
function setupDragAndDrop(container, calendar) {
    // Fer esdeveniments draggables
    container.querySelectorAll('.event.is-user-event[draggable="true"]').forEach(eventEl => {
        const eventData = JSON.parse((eventEl.dataset.event || '{}').replace(/&quot;/g, '"'));
        const dayCell = eventEl.closest('.day-cell');
        const dateStr = dayCell?.dataset.date;
        
        if (eventData.id && dateStr) {
            eventManager.makeEventDraggable(eventEl, eventData, dateStr);
        }
    });
    
    // Fer dies droppables
    container.querySelectorAll('.day-cell[data-date]').forEach(dayEl => {
        const dateStr = dayEl.dataset.date;
        if (dateStr) {
            eventManager.makeDayDroppable(dayEl, dateStr);
        }
    });
}

// === INICIALITZACIÓ ===
function initializeDragDropHelpers() {
    console.log('[DragDropHelpers] Utilitats de drag & drop inicialitzades');
}