// =================================================================
// BOOTSTRAP.JS - INICIALITZACIÓ I COORDINACIÓ DE L'APLICACIÓ CALENDARI IOC
// =================================================================

// === GESTOR D'ACCIONS CENTRALITZAT ===
function handleAction(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    e.preventDefault();
    const action = target.dataset.action;
    
    switch (action) {
        case 'toggle-theme': toggleTheme(); break;
        case 'open-calendar-setup': openCalendarSetupModal(); break;
        case 'close-modal': closeModal(target.dataset.modal); break;
        case 'save-calendar': calendarManager.saveCalendar(); break;
        case 'navigate-period': navigatePeriod(parseInt(target.dataset.direction)); break;
        case 'switch-calendar': calendarManager.switchCalendar(target.closest('.calendar-list-item').dataset.calendarId); break;
        case 'add-event': openEventModal(null, target.dataset.date || target.closest('.day-cell')?.dataset.date); break;
        case 'open-event-modal': openEventModal(JSON.parse(target.dataset.event)); break;
        case 'save-event': eventManager.saveEvent(); break;
        case 'delete-event': eventManager.deleteEvent(); break;
        case 'add-category': categoryManager.addCategory(); break;
        case 'start-edit-category': categoryManager.startEditCategory(target); break;
        case 'save-edit-category': categoryManager.saveEditCategory(target); break;
        case 'delete-category': categoryManager.deleteCategory(target); break;
        case 'load-calendar-file': calendarManager.loadCalendarFile(); break;
        case 'show-unplaced-events': replicationManager.showUnplacedEventsPanel(); break;
        case 'place-unplaced-event': replicationManager.placeUnplacedEvent(target.dataset.eventIndex, target.dataset.date); break;
        case 'dismiss-unplaced-event': replicationManager.dismissUnplacedEvent(target.dataset.eventIndex); break;
        case 'toggle-actions-menu': toggleActionsMenu(target); break;
        case 'open-calendar-actions-modal': openCalendarActionsModal(target.dataset.calendarId); break;
        case 'open-color-picker-modal': openColorPickerModal(target.dataset.categoryId, target); break;
        case 'select-color': selectCategoryColor(target.dataset.color); break;
        case 'save-calendar-json': saveCalendarJSON(getSelectedCalendarId()); break;
        case 'export-calendar-ics': exportCalendarICS(getSelectedCalendarId()); break;
        case 'export-calendar-html': exportCalendarHTML(getSelectedCalendarId()); break;
        case 'delete-calendar': calendarManager.deleteCalendar(getSelectedCalendarId()); break;
        case 'replicate-calendar': replicationManager.openReplicationModal(getSelectedCalendarId()); break;
        case 'execute-replication': replicationManager.executeReplication(); break;
        case 'change-view': viewManager.changeView(target.dataset.view); break;
        case 'day-click': viewManager.changeToDateView(target.dataset.date); break;
        case 'week-click': viewManager.changeToWeekView(target.dataset.date); break;
        default: console.warn(`Acción no reconocida: ${action}`);
    }
}

// === RENDERITZAT PRINCIPAL DEL CALENDARI ===
// Funció eliminada - usar directament viewManager.renderCurrentView()

// === NAVEGACIÓ ENTRE PERÍODES ===
function navigatePeriod(direction) {
    viewManager.navigatePeriod(direction);
}


// === INICIALITZACIÓ DE L'APLICACIÓ ===
function initializeApp() {
    try {
        // Carregar configuració del semestre primer de tot
        console.log('[Sistema] Inicialitzant aplicació...');
        const configLoaded = initializeCalendarManager();
        if (!configLoaded) {
            console.error('[Sistema] Error carregant configuració, no es pot continuar');
            return;
        }
        
        // Inicialitzar resta de l'aplicació
        initializeViewManager();
        document.addEventListener('click', handleAction);
        document.addEventListener('dblclick', handleAction);
        loadFromStorage();
        loadSavedTheme();
        getCurrentCalendar();
        calendarManager.updateUI();
        
        console.log(`[Sistema] Aplicació inicialitzada amb ${appState.categoryTemplates.length} categories al catàleg`);
        
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

document.addEventListener('DOMContentLoaded', initializeApp);