/**
 * =================================================================
 * BOOTSTRAP.JS - INICIALITZACIÓ I COORDINACIÓ DE L'APLICACIÓ
 * =================================================================
 * 
 * @file        Bootstrap.js
 * @description Classe Bootstrap per inicialitzar l'aplicació i gestionar accions
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

class Bootstrap {
    constructor() {
        try {
            // Inicialitzar aplicació
            console.log('[Sistema] Inicialitzant aplicació...');
            
            // Inicialitzar resta de l'aplicació
            viewManager.initializeRenderers();
            document.addEventListener('click', (e) => this.handleAction(e));
            document.addEventListener('dblclick', (e) => this.handleAction(e));
            storageManager.loadFromStorage();
            themeHelper.loadSavedTheme();
            appStateManager.getCurrentCalendar();
            calendarManager.updateUI();
            
            console.log(`[Sistema] Aplicació inicialitzada amb ${appStateManager.categoryTemplates.length} categories al catàleg`);
            
            // Event listener per Enter en input de nova categoria
            const newCategoryInput = document.getElementById('new-category-name');
            if (newCategoryInput) {
                newCategoryInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        categoryManager.addCategory();
                    }
                });
            }
        } catch (error) {
            console.error('[Sistema] Error inicialitzant aplicació:', error);
        }
    }

    // === GESTOR D'ACCIONS CENTRALITZAT ===
    handleAction(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        e.preventDefault();
        const action = target.dataset.action;
        
        switch (action) {
            case 'toggle-theme': themeHelper.toggleTheme(); break;
            case 'new-calendar': modalRenderer.openNewCalendarModal(); break;
            case 'close-modal': modalRenderer.closeModal(target.dataset.modal); break;
            case 'add-calendar': calendarManager.addCalendar(); break;
            case 'navigate-period': viewManager.navigatePeriod(parseInt(target.dataset.direction)); break;
            case 'switch-calendar': calendarManager.switchCalendar(target.closest('.calendar-list-item').dataset.calendarId); break;
            case 'add-event': modalRenderer.openEventModal(null, target.dataset.date || target.closest('.day-cell')?.dataset.date); break;
            case 'open-event-modal': modalRenderer.openEventModal(JSON.parse(target.dataset.event)); break;
            case 'save-event': eventManager.saveEvent(); break;
            case 'delete-event': eventManager.deleteEvent(); break;
            case 'add-category': categoryManager.addCategory(); break;
            case 'start-edit-category': categoryManager.startEditCategory(target); break;
            case 'save-edit-category': categoryManager.saveEditCategory(target); break;
            case 'delete-category': categoryManager.deleteCategory(target); break;
            case 'load-calendar-file': calendarManager.loadCalendarFile(); break;
            case 'show-unplaced-events': replicaManager.showUnplacedEventsPanel(); break;
            case 'place-unplaced-event': replicaManager.placeUnplacedEvent(target.dataset.eventIndex, target.dataset.date); break;
            case 'dismiss-unplaced-event': replicaManager.dismissUnplacedEvent(target.dataset.eventIndex); break;
            case 'toggle-actions-menu': menuHelper.toggleActionsMenu(target); break;
            case 'open-calendar-actions-modal': modalRenderer.openCalendarActionsModal(target.dataset.calendarId); break;
            case 'open-color-picker-modal': modalRenderer.openColorPickerModal(target.dataset.categoryId, target); break;
            case 'select-color': modalRenderer.selectCategoryColor(target.dataset.color); break;
            case 'save-calendar-json': jsonExporter.exportCalendar(appStateManager.getSelectedCalendarId()); break;
            case 'export-calendar-ics': icsExporter.exportCalendar(appStateManager.getSelectedCalendarId()); break;
            case 'export-calendar-html': htmlExporter.exportCalendar(appStateManager.getSelectedCalendarId()); break;
            case 'import-calendar-ics': calendarManager.importIcsToCalendar(appStateManager.getSelectedCalendarId()); break;
            case 'delete-calendar': calendarManager.deleteCalendar(appStateManager.getSelectedCalendarId()); break;
            case 'replicate-calendar': replicaManager.openReplicationModal(appStateManager.getSelectedCalendarId()); break;
            case 'execute-replication': replicaManager.executeReplication(); break;
            case 'change-view': viewManager.changeView(target.dataset.view); break;
            case 'day-click': viewManager.changeToDateView(target.dataset.date); break;
            case 'week-click': viewManager.changeToWeekView(target.dataset.date); break;
            case 'global-month-click': viewManager.handleGlobalMonthClick(target.dataset.date); break;
            case 'clear-all': storageManager.clearAll(); break;
            default: console.warn(`Acció no reconeguda: ${action}`);
        }
    }

}

// === INICIALITZACIÓ ===
document.addEventListener('DOMContentLoaded', () => {
    new Bootstrap();
});