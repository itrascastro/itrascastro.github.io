// =================================================================
// DRAG & DROP HELPERS - UTILITATS PER ARROSSEGAR I SOLTAR
// =================================================================

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