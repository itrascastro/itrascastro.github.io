/**
 * =================================================================
 * BOOTSTRAP.JS - INICIALITZACIÓ I COORDINACIÓ DE L'APLICACIÓ
 * =================================================================
 * 
 * @file        Bootstrap.js
 * @description Classe Bootstrap per inicialitzar l'aplicació i gestionar accions
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0
 * @date        2025-08-10
 * @project     Calendari IOC
 * @license     MIT
 * 
 * =================================================================
 */

class Bootstrap {
    constructor() {
        try {
            this.initializeAsync();
        } catch (error) {
            if (!(error instanceof CalendariIOCException)) {
                error = new CalendariIOCException('1401', 'Bootstrap.constructor');
            }
            errorManager.handleError(error);
        }
    }

    async initializeAsync() {
        console.log('[Bootstrap] Iniciant aplicació...');
        document.body.spellcheck = false;
        
        try {
            await studyTypeDiscovery.initializeWithFeedback();
        } catch (error) {
            throw new CalendariIOCException('1401', 'Bootstrap.initializeAsync - StudyTypeDiscovery');
        }
        
        this._initializeServices();
        this._displayApplicationStatus();
    }

    _initializeServices() {
        console.log('[Bootstrap] Inicialitzant serveis d\'aplicació...');
        
        document.addEventListener('click', (e) => this.handleAction(e));
        document.addEventListener('dblclick', (e) => this.handleAction(e));
        
        const newCategoryInput = document.getElementById('new-category-name');
        if (newCategoryInput) {
            newCategoryInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    categoryManager.addCategory();
                }
            });
        }
        
        viewManager.initializeRenderers();
        storageManager.loadFromStorage();
        themeHelper.loadSavedTheme();
        appStateManager.getCurrentCalendar();
        calendarManager.updateUI();
    }

    _displayApplicationStatus() {
        const studyTypesCount = studyTypeDiscovery.getStudyTypes().length;
        const categoriesCount = appStateManager.categoryTemplates.length;
        
        console.log(`[Bootstrap] Aplicació inicialitzada correctament`);
        console.log(`[Bootstrap] • Discovery: ${studyTypesCount} tipus d'estudi disponibles`);
        console.log(`[Bootstrap] • Categories: ${categoriesCount} plantilles carregades`);
    }

    // === GESTOR D'ACCIONS CENTRALITZAT ===
    async handleAction(e) {
        try {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            e.preventDefault();
            const action = target.dataset.action;
            
            switch (action) {
                case 'toggle-theme': themeHelper.toggleTheme(); break;
                case 'new-calendar': modalRenderer.openNewCalendarModal(); break;
                case 'close-modal': modalRenderer.closeModal(target.dataset.modal); break;
                case 'add-calendar': await calendarManager.addCalendar(); break;
                case 'navigate-period': viewManager.navigatePeriod(parseInt(target.dataset.direction)); break;
                case 'switch-calendar': calendarManager.switchCalendar(target.closest('.calendar-list-item').dataset.calendarId); break;
                case 'add-event': modalRenderer.openEventModal(null, target.dataset.date || target.closest('.day-cell')?.dataset.date); break;
                case 'open-event-modal': modalRenderer.openEventModal(appStateManager.findEventById(target.dataset.eventId)); break;
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
                case 'edit-calendar': modalRenderer.openCalendarEditModal(appStateManager.getSelectedCalendarId()); break;
                case 'save-calendar-edits': calendarManager.saveCalendarEdits(); break;
                case 'replicate-calendar': replicaManager.openReplicationModal(appStateManager.getSelectedCalendarId()); break;
                case 'execute-replication': replicaManager.executeReplication(); break;
                case 'change-view': viewManager.changeView(target.dataset.view); break;
                case 'day-click': viewManager.changeToDateView(target.dataset.date); break;
                case 'week-click': viewManager.changeToWeekView(target.dataset.date); break;
                case 'global-month-click': viewManager.handleGlobalMonthClick(target.dataset.date); break;
                case 'clear-all': storageManager.clearAll(); break;
                default: console.warn(`Acció no reconeguda: ${action}`);
            }
        } catch (error) {
            errorManager.handleError(error);
        }
    }

}

// === INICIALITZACIÓ ===
document.addEventListener('DOMContentLoaded', () => {
    new Bootstrap();

    // Exposar per a testing amb Cypress
    if (window.Cypress) {
        window.app = {
            CalendariIOC_Calendar, CalendariIOC_Category, CalendariIOC_Event,
            calendarManager, storageManager, appStateManager, viewManager,
            eventManager, categoryManager, replicaManager, errorManager
        };
    }
});