/**
 * =================================================================
 * DRAG & DROP HELPERS - UTILITATS PER ARROSSEGAR I SOLTAR
 * =================================================================
 * 
 * @file        DragDropHelper.js
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

// Classe d'utilitats per drag & drop
class DragDropHelper {
    
    // === CONFIGURACIÓ DE DRAG & DROP ===
    
    // Configurar drag & drop per un contenidor de calendari
    setupDragAndDrop(container, calendar) {
        // Fer esdeveniments draggables
        container.querySelectorAll('.event.is-user-event[draggable="true"]').forEach(eventEl => {
            const eventId = eventEl.dataset.eventId;
            const eventData = appStateManager.findEventById(eventId);
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

}

// === INSTÀNCIA GLOBAL ===
const dragDropHelper = new DragDropHelper();