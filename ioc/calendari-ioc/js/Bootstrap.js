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
            this._lastContextMenuAt = 0;
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
        this._initializeEventListeners();
        this._displayApplicationStatus();
    }

    _initializeServices() {
        console.log('[Bootstrap] Inicialitzant serveis d\'aplicació...');
        
        viewManager.initializeRenderers();
        storageManager.loadFromStorage();
        themeHelper.loadSavedTheme();
        appStateManager.getCurrentCalendar();
        calendarManager.updateUI();
    }

    _initializeEventListeners() {
        console.log('[Bootstrap] Inicialitzant event listeners...');
        
        // Event listeners globals per accions
        document.addEventListener('click', (e) => this.handleAction(e));
        document.addEventListener('dblclick', (e) => this.handleAction(e));
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
        window.addEventListener('scroll', () => this.hideEventContextMenu(), true);
        
        // Event listener específic per camp de nova categoria
        const newCategoryInput = document.getElementById('new-category-name');
        if (newCategoryInput) {
            newCategoryInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    categoryManager.addCategory();
                }
            });
        }
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
            if (e.type === 'click' && (e.button === 2 || e.ctrlKey)) {
                return;
            }
            if (e.type === 'click' && Date.now() - this._lastContextMenuAt < 600) {
                return;
            }
            const target = e.target.closest('[data-action]');
            if (!target) return;
            if (target.classList.contains('disabled')) return;
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
                case 'export-compact-html': compactHtmlExporter.exportCalendar(appStateManager.getSelectedCalendarId()); break;
                case 'compact-zoom-inc': this.updateCompactZoom(0.1); break;
                case 'compact-zoom-dec': this.updateCompactZoom(-0.1); break;
                case 'open-compact-fullscreen': viewManager.openCompactFullscreen(); break;
                case 'import-calendar-ics': calendarManager.importIcsToCalendar(appStateManager.getSelectedCalendarId()); break;
                case 'delete-calendar': calendarManager.deleteCalendar(appStateManager.getSelectedCalendarId()); break;
                case 'edit-calendar': modalRenderer.openCalendarEditModal(appStateManager.getSelectedCalendarId()); break;
                case 'save-calendar-edits': calendarManager.saveCalendarEdits(); break;
                case 'replicate-calendar-auto': replicaManager.openReplicationModal(appStateManager.getSelectedCalendarId(), 'auto'); break;
                case 'replicate-calendar-manual': replicaManager.openReplicationModal(appStateManager.getSelectedCalendarId(), 'manual'); break;
                case 'execute-replication': replicaManager.executeReplication(); break;
                case 'copy-event': this.copyEventFromContextMenu(); break;
                case 'paste-event': this.pasteEventFromContextMenu(); break;
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

    // === CONTROL DE ZOOM COMPACT ===
    updateCompactZoom(delta) {
        const min = 0.6, max = 1.6;
        let z = appStateManager.appState.compactZoom || 1;
        z = Math.min(max, Math.max(min, Math.round((z + delta) * 10) / 10));
        appStateManager.appState.compactZoom = z;
        document.body.style.setProperty('--compact-zoom', z);
        storageManager.saveToStorage();
    }

    // === MENÚ CONTEXTUAL EVENTS ===
    handleContextMenu(e) {
        const menu = document.getElementById('eventContextMenu');
        if (!menu) return;

        const eventEl = e.target.closest('[data-event-id], [data-action="open-event-modal"]');
        const eventId = eventEl?.dataset?.eventId;
        if (eventId) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.showEventContextMenu(menu, {
                mode: 'copy',
                eventId,
                x: e.clientX,
                y: e.clientY
            });
            return;
        }

        const dayCell = e.target.closest('.day-cell, .compact-day-cell, [data-date]');
        if (dayCell?.dataset?.date) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.showEventContextMenu(menu, {
                mode: 'paste',
                date: dayCell.dataset.date,
                x: e.clientX,
                y: e.clientY
            });
            return;
        }

        this.hideEventContextMenu();
    }

    showEventContextMenu(menu, { mode, eventId, date, x, y }) {
        const copyBtn = menu.querySelector('[data-action="copy-event"]');
        const pasteBtn = menu.querySelector('[data-action="paste-event"]');

        menu.dataset.eventId = eventId || '';
        menu.dataset.date = date || '';

        if (copyBtn) {
            copyBtn.classList.toggle('disabled', mode !== 'copy');
        }
        if (pasteBtn) {
            const canPaste = !!appStateManager.copiedEvent;
            pasteBtn.classList.toggle('disabled', mode !== 'paste' || !canPaste);
        }

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.classList.add('show');
        this._lastContextMenuAt = Date.now();
    }

    handleGlobalClick(e) {
        if (e.button === 2) return;
        if (Date.now() - this._lastContextMenuAt < 600) return;
        this.hideEventContextMenu();
    }

    hideEventContextMenu() {
        const menu = document.getElementById('eventContextMenu');
        if (menu) {
            menu.classList.remove('show');
        }
    }

    copyEventFromContextMenu() {
        const menu = document.getElementById('eventContextMenu');
        const eventId = menu?.dataset?.eventId;
        if (!eventId) return;

        const event = appStateManager.findEventById(eventId);
        if (!event || event.isSystemEvent) {
            uiHelper.showMessage('Només es poden copiar events d\'usuari', 'warning');
            return;
        }

        const categoryId = event.getCategory()?.id || null;
        appStateManager.copiedEvent = {
            title: event.title,
            description: event.description || '',
            categoryId
        };

        this.hideEventContextMenu();
        uiHelper.showMessage('Event copiat', 'success');
    }

    pasteEventFromContextMenu() {
        const menu = document.getElementById('eventContextMenu');
        const dateStr = menu?.dataset?.date;
        if (!dateStr) return;

        if (!appStateManager.copiedEvent) {
            uiHelper.showMessage('No hi ha cap event copiat', 'warning');
            return;
        }

        eventManager.pasteCopiedEvent(dateStr);
        this.hideEventContextMenu();
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
