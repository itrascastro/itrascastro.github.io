/**
 * =================================================================
 * CALENDAR MANAGER - GESTIÓ DE CALENDARIS
 * =================================================================
 *
 * @file        CalendarManager.js
 * @description Gestió de calendaris, configuració i operacions CRUD
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     2.0.0
 * @date        2025-08-09
 * @project     Calendari Mòdul IOC
 * @license     MIT
 *
 * =================================================================
 */
class CalendarManager {
    async addCalendar() {
        try {
            const selectedType = document.getElementById('studyType').value;
            if (!selectedType) {
                throw new CalendariIOCException('401', 'Cal seleccionar un tipus de calendari.', false);
            }

            let calendarData;
            if (selectedType === 'ALTRE') {
                calendarData = this._createGenericCalendar();
            } else {
                calendarData = await this._createStudyCalendar(selectedType);
            }

            if (!calendarData) return;

            if (this.calendarExists(calendarData.id)) {
                throw new CalendariIOCException('402', `El calendari amb ID "${calendarData.id}" ja existeix.`, false);
            }

            this.createCalendarData(calendarData);
            
            viewManager.changeView('month');
            storageManager.saveToStorage();
            this.updateUI();
            modalRenderer.closeModal('calendarSetupModal');
            uiHelper.showMessage('Calendari creat correctament', 'success');
            
        } catch (error) {
            errorManager.handleError(error);
        }
    }

    async _createStudyCalendar(typeId) {
        const userIdentifier = document.getElementById('studyIdentifier').value.trim();
        if (!userIdentifier) {
            throw new CalendariIOCException('405', 'L\'identificador del calendari és obligatori.', false);
        }

        // Verificar que StudyTypeDiscovery estigui inicialitzat
        if (!studyTypeDiscovery.isReady()) {
            console.warn('[CalendarManager] StudyTypeDiscovery no està llest, intentant reinicialitzar...');
            try {
                await studyTypeDiscovery.initialize();
            } catch (error) {
                throw new CalendariIOCException('503', 'El sistema de descobriment de tipus d\'estudi no està disponible. Si us plau, recarregueu la pàgina.', false);
            }
        }

        // En mode fallback, redirigir a calendari genèric
        if (studyTypeDiscovery.isInFallbackMode()) {
            console.warn('[CalendarManager] Mode fallback actiu, creant calendari genèric en lloc de tipus estudi');
            return this._createFallbackCalendar(typeId, userIdentifier);
        }

        // Obtenir configuracions amb validació robusta
        const specificConfigData = studyTypeDiscovery.getConfig(typeId);
        const commonConfigData = studyTypeDiscovery.getConfig('COMMON');
        const systemCategoriesData = studyTypeDiscovery.getConfig('SYS-CATEGORIES');

        // Validació detallada de configuracions
        if (!specificConfigData) {
            throw new CalendariIOCException('503', `No s'ha trobat la configuració específica per al tipus "${typeId}". Possibles tipus disponibles: ${studyTypeDiscovery.getAvailableTypes().join(', ')}`, false);
        }

        if (!commonConfigData) {
            console.warn('[CalendarManager] Configuració comuna no disponible, continuant sense esdeveniments del sistema');
        }

        if (!systemCategoriesData) {
            console.warn('[CalendarManager] Categories del sistema no disponibles, utilitzant categories per defecte');
        }

        try {
            const config = new SemesterConfig(specificConfigData, commonConfigData, systemCategoriesData);
            
            const semesterCode = config.getSemesterCode();
            const calendarId = `${typeId}_${userIdentifier.toUpperCase()}_${semesterCode}`;
            
            return {
                id: calendarId,
                name: calendarId,
                startDate: config.getStartDate(),
                endDate: config.getEndDate(),
                type: typeId,
                paf1Date: config.getSemester()?.paf1Date || null,
                config: config
            };
        } catch (error) {
            console.error('[CalendarManager] Error creant configuració de semestre:', error);
            throw new CalendariIOCException('503', `Error processant la configuració per al tipus "${typeId}": ${error.message}`, false);
        }
    }

    _createFallbackCalendar(typeId, userIdentifier) {
        console.info(`[CalendarManager] Creant calendari fallback per tipus ${typeId}`);
        
        // Dates per defecte (semestre acadèmic estàndard)
        const currentYear = new Date().getFullYear();
        const startDate = `${currentYear}-09-01`;
        const endDate = `${currentYear + 1}-06-30`;
        
        const timestamp = Date.now();
        const calendarId = `${typeId}_${userIdentifier.toUpperCase()}_FALLBACK_${timestamp}`;
        
        return {
            id: calendarId,
            name: `${typeId} ${userIdentifier} (Mode Simple)`,
            startDate: startDate,
            endDate: endDate,
            type: typeId,
            paf1Date: null,
            config: null,
            fallback: true
        };
    }

    _createGenericCalendar() {
        const name = document.getElementById('calendarName').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!name || !startDate || !endDate) {
            throw new CalendariIOCException('406', 'Tots els camps són obligatoris per a un calendari genèric.', false);
        }
        if (startDate >= endDate) {
            throw new CalendariIOCException('407', 'La data d\'inici ha de ser anterior a la data de fi.', false);
        }

        const timestamp = Date.now();
        const calendarId = `ALTRE_${name.toUpperCase().replace(/\s+/g, '_')}_${timestamp}`;

        return {
            id: calendarId,
            name: name,
            startDate,
            endDate,
            type: 'ALTRE',
            paf1Date: null,
            config: null
        };
    }
    
    deleteCalendar(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) return;

        uiHelper.showConfirmModal(
            `Estàs segur que vols eliminar el calendari "${calendar.name}"? Aquesta acció no es pot desfer.`, 
            'Eliminar calendari',
            () => {
                delete appStateManager.calendars[calendarId];
                if (appStateManager.lastVisitedMonths[calendarId]) {
                    delete appStateManager.lastVisitedMonths[calendarId];
                }
                if (appStateManager.currentCalendarId === calendarId) {
                    const remainingIds = Object.keys(appStateManager.calendars);
                    appStateManager.currentCalendarId = remainingIds.length > 0 ? remainingIds[0] : null;
                }
                storageManager.saveToStorage();
                this.updateUI();
                uiHelper.showMessage('Calendari eliminat correctament', 'success');
            }
        );
    }
    
    switchCalendar(calendarId) {
        if (!calendarId || !appStateManager.calendars[calendarId]) return;
        
        const currentCalendar = appStateManager.getCurrentCalendar();
        if (currentCalendar && appStateManager.currentDate) {
            appStateManager.lastVisitedMonths[currentCalendar.id] = dateHelper.toUTCString(appStateManager.currentDate);
        }
        
        appStateManager.currentCalendarId = calendarId;
        
        const newCalendar = appStateManager.calendars[calendarId];
        let targetDate;
        
        if (appStateManager.lastVisitedMonths[calendarId]) {
            targetDate = dateHelper.parseUTC(appStateManager.lastVisitedMonths[calendarId]);
            const calendarStart = dateHelper.parseUTC(newCalendar.startDate);
            const calendarEnd = dateHelper.parseUTC(newCalendar.endDate);
            if (targetDate < calendarStart || targetDate > calendarEnd) {
                targetDate = calendarStart;
            }
        } else {
            targetDate = dateHelper.parseUTC(newCalendar.startDate);
        }
        
        appStateManager.currentDate = targetDate;
        viewManager.changeView('month');
        storageManager.saveToStorage();
        this.updateUI();
    }
    
    calendarExists(calendarId) {
        return !!appStateManager.calendars[calendarId];
    }
    
    createCalendarData({ id, name, startDate, endDate, type, paf1Date = null, config = null }) {
        const calendar = new CalendariIOC_Calendar({
            id, name, startDate, endDate, type, paf1Date,
            code: config ? config.getSemesterCode() : null,
            eventCounter: 0,
            categoryCounter: 0
        });
        
        if (config) {
            const categoryMap = new Map();
            config.getDefaultCategories().forEach(catData => {
                if (catData.isSystem && !catData.color) {
                    catData.color = colorCategoryHelper.assignSystemCategoryColor(catData.id);
                }
                const category = new CalendariIOC_Category(catData);
                calendar.addCategory(category);
                categoryMap.set(category.id, category);
            });

            config.getSystemEvents().forEach(eventData => {
                if (eventData.date >= startDate && eventData.date <= endDate) {
                    const category = categoryMap.get(eventData.categoryId);
                    const event = new CalendariIOC_Event({ ...eventData, category });
                    calendar.addEvent(event);
                }
            });
        }
        
        appStateManager.calendars[id] = calendar;
        appStateManager.currentCalendarId = id;
        appStateManager.currentDate = dateHelper.parseUTC(startDate);
    }
    
    updateNavigationControls(calendar) {
        const prevBtn = document.querySelector('.nav-arrow[data-direction="-1"]');
        const nextBtn = document.querySelector('.nav-arrow[data-direction="1"]');
        if (!prevBtn || !nextBtn || !calendar) return;
        
        const calendarStart = dateHelper.parseUTC(calendar.startDate);
        const calendarEnd = dateHelper.parseUTC(calendar.endDate);
        
        const prevMonthEnd = dateHelper.createUTC(appStateManager.currentDate.getUTCFullYear(), appStateManager.currentDate.getUTCMonth(), 0);
        prevBtn.disabled = prevMonthEnd < calendarStart;
        
        const nextMonthStart = dateHelper.createUTC(appStateManager.currentDate.getUTCFullYear(), appStateManager.currentDate.getUTCMonth() + 1, 1);
        nextBtn.disabled = nextMonthStart > calendarEnd;
    }
    
    _processIcsImport(calendar, icsData) {
        // Aquest mètode necessitarà carregar la configuració de app-settings per al nom de la categoria.
        // De moment, mantenim el hardcoding fins a tenir un sistema de configuració global.
        const importCategoryName = 'ICS_IMPORTAT';
        try {
            let importCategory = calendar.categories.find(cat => cat.name === importCategoryName);
            if (!importCategory) {
                importCategory = new CalendariIOC_Category({
                    id: idHelper.generateNextCategoryId(calendar.id),
                    name: importCategoryName,
                    color: colorCategoryHelper.generateRandomColor(),
                    isSystem: false
                });
                calendar.addCategory(importCategory);
            }
            
            icsData.events.forEach(icsEvent => {
                const eventId = idHelper.generateNextEventId(calendar.id);
                const newEvent = new CalendariIOC_Event({
                    id: eventId,
                    title: icsEvent.title,
                    date: icsEvent.date,
                    category: importCategory,
                    description: icsEvent.description,
                    isSystemEvent: false
                });
                calendar.addEvent(newEvent);
            });
            
            storageManager.saveToStorage();
            this.updateUI();
            uiHelper.showMessage(`${icsData.totalEvents} esdeveniments importats correctament`, 'success');
        } catch (error) {
            errorManager.handleError(new CalendariIOCException('410', 'Error processant dades ICS.'));
        }
    }

    importIcsToCalendar(calendarId, icsContent = null) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) throw new CalendariIOCException('408', 'Calendari no trobat.');
        if (calendar.type !== 'ALTRE') throw new CalendariIOCException('409', 'La importació ICS només està disponible per a calendaris de tipus "Altre".');
        
        const processCallback = (icsData) => this._processIcsImport(calendar, icsData);
        icsImporter.importIcsFile(processCallback, calendar, icsContent);
    }
    
    _processLoadedCalendar(calendarData) {
        try {
            if (!calendarData.id || !calendarData.name || !calendarData.startDate || !calendarData.endDate) {
                throw new CalendariIOCException('411', 'El fitxer de calendari no té el format correcte.');
            }
            if (this.calendarExists(calendarData.id)) {
                throw new CalendariIOCException('412', `Ja existeix un calendari amb l\'ID "${calendarData.id}".`);
            }
            
            const rehydratedState = CalendariIOC_DataRehydrator.rehydrateState({ calendars: { [calendarData.id]: calendarData } });
            const calendarInstance = rehydratedState.calendars[calendarData.id];
            
            if (!calendarInstance) throw new CalendariIOCException('414', 'Error en rehidratar les dades del calendari.');
            
            appStateManager.calendars[calendarData.id] = calendarInstance;
            appStateManager.currentCalendarId = calendarData.id;
            appStateManager.currentDate = dateHelper.parseUTC(calendarData.startDate);
            
            viewManager.changeView('month');
            storageManager.saveToStorage();
            this.updateUI();
            uiHelper.showMessage(`Calendari "${calendarData.name}" carregat correctament`, 'success');
        } catch (error) {
            errorManager.handleError(error);
        }
    }
    
    loadCalendarFile(jsonData = null) {
        if (jsonData) {
            this._processLoadedCalendar(jsonData);
            return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        this._processLoadedCalendar(JSON.parse(ev.target.result));
                    } catch (err) {
                        errorManager.handleError(new CalendariIOCException('414', 'El fitxer JSON no és vàlid.'));
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    updateUI() {
        panelsRenderer.renderSavedCalendars();
        panelsRenderer.renderCategories();
        panelsRenderer.renderUnplacedEvents();
        viewManager.renderCurrentView();
    }
}

const calendarManager = new CalendarManager();
