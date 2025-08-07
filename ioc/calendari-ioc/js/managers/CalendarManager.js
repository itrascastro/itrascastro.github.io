/**
 * =================================================================
 * CALENDAR MANAGER - GESTIÓ DE CALENDARIS
 * =================================================================
 * 
 * @file        CalendarManager.js
 * @description Gestió de calendaris, configuració i operacions CRUD
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

// Classe per gestionar tots els calendaris de l'aplicació
class CalendarManager {
    // === GESTIÓ DE CALENDARIS ===
    
    // Crear nou calendari (asíncron)
    async addCalendar() {
        try {
            const selectedType = document.getElementById('studyType').value;
            
            if (!selectedType) {
                throw new CalendariIOCException('401', 'CalendarManager.addCalendar', false);
            }
            
            let calendarData;
            
            if (selectedType === 'FP') {
                calendarData = await this.processFPCalendar();
            } else if (selectedType === 'BTX') {
                calendarData = await this.processBTXCalendar();
            } else if (selectedType === 'Altre') {
                calendarData = this.processAltreCalendar();
            }
            
            if (!calendarData) {
                return; // Error ja mostrat en les funcions específiques
            }
            
            if (this.calendarExists(calendarData.id)) {
                throw new CalendariIOCException('402', 'CalendarManager.addCalendar', false);
            }
            
            this.createCalendarData(calendarData.id, calendarData.name, calendarData.startDate, calendarData.endDate, calendarData.type, calendarData.paf1Date, calendarData.config);
            
            // Sempre tornar a vista mensual quan es crea un calendari
            viewManager.changeView('month');
            
            storageManager.saveToStorage();
            this.updateUI();
            modalRenderer.closeModal('calendarSetupModal');
            uiHelper.showMessage('Calendari creat correctament', 'success');
            
        } catch (error) {
            if (error instanceof CalendariIOCException) {
                throw error;
            }
            throw new CalendariIOCException('404', 'CalendarManager.addCalendar');
        }
    }
    
    // Processar calendari FP (asíncron)
    async processFPCalendar() {
        const cicle = document.getElementById('cicleCode').value.trim().toUpperCase();
        const module = document.getElementById('moduleCode').value.trim().toUpperCase();
        
        if (!cicle || !module) {
            throw new CalendariIOCException('405', 'CalendarManager.processFPCalendar', false);
        }
        
        // Crear configuració específica per FP
        const fpConfig = new SemesterConfig('FP');
        await fpConfig.initialize();
        const startDate = fpConfig.getStartDate();
        const endDate = fpConfig.getEndDate();  
        const paf1Date = fpConfig.getSemester()?.paf1Date || null;
        const code = fpConfig.getSemesterCode();
        
        const calendarName = `FP_${cicle}_${module}_${code}`;
        
        return {
            id: calendarName,
            name: calendarName,
            startDate,
            endDate,
            type: 'FP',
            paf1Date: paf1Date,
            config: fpConfig
        };
    }
    
    // Processar calendari BTX (asíncron)
    async processBTXCalendar() {
        const subject = document.getElementById('subjectCode').value.trim().toUpperCase();
        
        if (!subject) {
            throw new CalendariIOCException('405', 'CalendarManager.processBTXCalendar', false);
        }
        
        // Crear configuració específica per BTX
        const btxConfig = new SemesterConfig('BTX');
        await btxConfig.initialize();
        const startDate = btxConfig.getStartDate();
        const endDate = btxConfig.getEndDate();
        const paf1Date = btxConfig.getSemester()?.paf1Date || null;
        const code = btxConfig.getSemesterCode();
        
        const calendarName = `BTX_${subject}_${code}`;
        
        return {
            id: calendarName,
            name: calendarName,
            startDate,
            endDate,
            type: 'BTX',
            paf1Date: paf1Date,
            config: btxConfig
        };
    }
    
    // Processar calendari Altre
    processAltreCalendar() {
        const name = document.getElementById('calendarName').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!name || !startDate || !endDate) {
            throw new CalendariIOCException('406', 'CalendarManager.processAltreCalendar', false);
        }
        
        if (startDate >= endDate) {
            throw new CalendariIOCException('407', 'CalendarManager.processAltreCalendar', false);
        }
        
        const timestamp = Date.now();
        const calendarId = modalRenderer.generateAltreId(name, timestamp);
        
        return {
            id: calendarId,
            name: name,
            startDate,
            endDate,
            type: 'Altre',
            paf1Date: null, // Tipus "Altre" no té PAF
            config: null // Tipus "Altre" no usa configuració específica
        };
    }
    
    // Eliminar calendari
    deleteCalendar(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) return;

        uiHelper.showConfirmModal(
            `Estàs segur que vols eliminar el calendari "${calendar.name}"?\n\nAquesta acció no es pot desfer.`,
            'Eliminar calendari',
            () => {
                delete appStateManager.calendars[calendarId];
                
                // Netejar dades de navegació del calendari eliminat
                if (appStateManager.lastVisitedMonths[calendarId]) {
                    delete appStateManager.lastVisitedMonths[calendarId];
                }
                
                // Si era el calendari actiu, seleccionar el següent disponible
                if (appStateManager.currentCalendarId === calendarId) {
                    const remainingCalendars = Object.keys(appStateManager.calendars);
                    appStateManager.currentCalendarId = remainingCalendars.length > 0 ? remainingCalendars[0] : null;
                }
                
                storageManager.saveToStorage();
                this.updateUI();
                uiHelper.showMessage('Calendari eliminat correctament', 'success');
            }
        );
    }
    
    /**
     * Canviar calendari actiu amb persistència de navegació
     * @param {string} calendarId ID del calendari a activar
     * @description Gestiona el canvi entre calendaris preservant l'últim mes visitat
     *              de cada calendari i aplicant validació de dates dins del rang
     */
    switchCalendar(calendarId) {
        if (!calendarId || !appStateManager.calendars[calendarId]) return;
        
        // Persistència: guardar l'últim mes visitat del calendari actual
        const currentCalendar = appStateManager.getCurrentCalendar();
        if (currentCalendar && appStateManager.currentDate) {
            appStateManager.lastVisitedMonths[currentCalendar.id] = dateHelper.toUTCString(appStateManager.currentDate);
        }
        
        appStateManager.currentCalendarId = calendarId;
        
        // Recuperar l'últim mes visitat del nou calendari amb validació de rang
        const newCalendar = appStateManager.calendars[calendarId];
        let targetDate;
        
        if (appStateManager.lastVisitedMonths[calendarId]) {
            // Intentar recuperar l'últim mes visitat
            targetDate = dateHelper.parseUTC(appStateManager.lastVisitedMonths[calendarId]);
            
            // Validació crítica: verificar que estigui dins del rang del calendari
            const calendarStart = dateHelper.parseUTC(newCalendar.startDate);
            const calendarEnd = dateHelper.parseUTC(newCalendar.endDate);
            
            if (targetDate < calendarStart || targetDate > calendarEnd) {
                // Fallback segur: usar data d'inici real del calendari
                targetDate = calendarStart;
            }
        } else {
            // Primera visita: usar data d'inici real del calendari
            const calendarStart = dateHelper.parseUTC(newCalendar.startDate);
            targetDate = calendarStart;
        }
        
        appStateManager.currentDate = targetDate;
        
        // Sempre tornar a vista mensual quan es canvia de calendari
        viewManager.changeView('month');
        
        storageManager.saveToStorage();
        this.updateUI();
    }
    
    // === VALIDACIONS ===
    
    
    // Verificar si el calendari existeix
    calendarExists(calendarId) {
        return !!appStateManager.calendars[calendarId];
    }
    
    
    // === CREACIÓ DE CALENDARIS ===
    
    // Crear dades del calendari amb esdeveniments de sistema
    createCalendarData(calendarId, calendarName, startDate, endDate, type, paf1Date = null, config = null) {
        // FASE 2: Crear instància CalendariIOC_Calendar en lloc d'objecte literal
        const configToUse = config;
        
        const calendar = new CalendariIOC_Calendar({
            id: calendarId,
            name: calendarName,
            startDate,
            endDate,
            type: type,
            code: configToUse ? configToUse.getSemesterCode() : null,
            eventCounter: 0,
            categoryCounter: 0,
            paf1Date: paf1Date
        });
        
        // Crear mapa global de categories per lookup eficient
        const categoryMap = new Map();
        
        // Afegir categories de sistema com a instàncies CalendariIOC_Category
        if (configToUse) {
            configToUse.getDefaultCategories().forEach(catData => {
                // Assignar color si no en té
                if (catData.isSystem && !catData.color) {
                    catData.color = colorCategoryHelper.assignSystemCategoryColor(catData.id);
                }
                
                const category = new CalendariIOC_Category(catData);
                calendar.addCategory(category);
                categoryMap.set(category.id, category);
            });
        }
        
        // Generar esdeveniments de sistema amb referències directes a categories
        const systemEventsData = this.generateSystemEvents(startDate, endDate, type, configToUse);
        systemEventsData.forEach(eventData => {
            const category = categoryMap.get(eventData.categoryId);
            const event = new CalendariIOC_Event({
                ...eventData,
                category: category // REFERÈNCIA DIRECTA A INSTÀNCIA
            });
            calendar.addEvent(event);
        });
        
        appStateManager.calendars[calendarId] = calendar;
        appStateManager.currentCalendarId = calendarId;
        
        // Establir currentDate a la data d'inici real del calendari nou
        const calendarStart = dateHelper.parseUTC(startDate);
        appStateManager.currentDate = calendarStart;
    }
    
    // Generar esdeveniments de sistema per al calendari
    generateSystemEvents(startDate, endDate, type, config) {
        const systemEvents = [];
        
        // Si és tipus "Altre", no generar cap esdeveniment del sistema
        if (type === 'Altre') {
            return systemEvents;
        }
        
        // Afegir esdeveniments puntuals
        config.getSystemEvents().forEach(event => {
            if (event.date >= startDate && event.date <= endDate) {
                systemEvents.push(event);
            }
        });
        
        return systemEvents;
    }
    
    
    // === NAVEGACIÓ ===
    
    // Actualitzar controls de navegació segons el calendari
    updateNavigationControls(calendar) {
        const prevBtn = document.querySelector('.nav-arrow[data-direction="-1"]');
        const nextBtn = document.querySelector('.nav-arrow[data-direction="1"]');
        
        if (!prevBtn || !nextBtn || !calendar) return;
        
        const calendarStart = dateHelper.parseUTC(calendar.startDate);
        const calendarEnd = dateHelper.parseUTC(calendar.endDate);
        
        const prevMonthEnd = dateHelper.createUTC(
            appStateManager.currentDate.getUTCFullYear(), 
            appStateManager.currentDate.getUTCMonth(), 
            0
        );
        prevBtn.disabled = prevMonthEnd < calendarStart;
        
        const nextMonthStart = dateHelper.createUTC(
            appStateManager.currentDate.getUTCFullYear(), 
            appStateManager.currentDate.getUTCMonth() + 1, 
            1
        );
        nextBtn.disabled = nextMonthStart > calendarEnd;
    }
    
    // === IMPORTACIÓ ICS ===
    
    // Funció interna per processar les dades ICS importades
    _processIcsImport(calendar, icsData) {
        try {
            // FASE 2: Crear categoria "Importats" com a instància CalendariIOC_Category si no existeix
            let importCategory = calendar.categories.find(cat => cat.name === 'Importats');
            if (!importCategory) {
                importCategory = new CalendariIOC_Category({
                    id: idHelper.generateNextCategoryId(calendar.id),
                    name: 'Importats',
                    color: colorCategoryHelper.generateRandomColor(),
                    isSystem: false
                });
                calendar.addCategory(importCategory);
            }
            
            // Afegir esdeveniments amb IDs únics i referència directa a categoria
            icsData.events.forEach(icsEvent => {
                const eventId = idHelper.generateNextEventId(calendar.id);
                
                const newEvent = new CalendariIOC_Event({
                    id: eventId,
                    title: icsEvent.title,
                    date: icsEvent.date,
                    category: importCategory, // REFERÈNCIA DIRECTA A INSTÀNCIA
                    description: icsEvent.description,
                    isSystemEvent: false
                });
                calendar.addEvent(newEvent);
            });
            
            // Ordenar esdeveniments: primer amb hora específica, després dia complet
            calendar.events.sort((a, b) => {
                // Detectar si tenen hora específica (format [HH:MM])
                const aHasTime = /^\[\d{2}:\d{2}\]/.test(a.title);
                const bHasTime = /^\[\d{2}:\d{2}\]/.test(b.title);
                
                // Si un té hora i l'altre no, el que té hora va primer
                if (aHasTime && !bHasTime) return -1;
                if (!aHasTime && bHasTime) return 1;
                
                // Si ambdós tenen hora o cap té hora, ordenar per data
                const dateComparison = new Date(a.date) - new Date(b.date);
                if (dateComparison !== 0) return dateComparison;
                
                // Si la data és la mateixa i ambdós tenen hora, ordenar per hora
                if (aHasTime && bHasTime) {
                    const aTime = a.title.match(/^\[(\d{2}:\d{2})\]/)[1];
                    const bTime = b.title.match(/^\[(\d{2}:\d{2})\]/)[1];
                    return aTime.localeCompare(bTime);
                }
                
                // Sinó, ordenar per títol
                return a.title.localeCompare(b.title);
            });
            
            // Actualitzar dates del calendari si és necessari
            const currentStart = new Date(calendar.startDate);
            const currentEnd = new Date(calendar.endDate);
            const icsStart = new Date(icsData.startDate);
            const icsEnd = new Date(icsData.endDate);
            
            if (icsStart < currentStart) {
                calendar.startDate = icsData.startDate;
            }
            if (icsEnd > currentEnd) {
                calendar.endDate = icsData.endDate;
            }
            
            // Tancar modal d'accions
            modalRenderer.closeModal('calendarActionsModal');
            
            // Guardar i actualitzar interfície
            storageManager.saveToStorage();
            this.updateUI();
            
            uiHelper.showMessage(`${icsData.totalEvents} esdeveniments importats correctament`, 'success');
            
        } catch (error) {
            errorManager.handleError(new CalendariIOCException('410', 'CalendarManager._processIcsImport'));
        }
    }

    // Importar esdeveniments ICS a calendari existent tipus "Altre"
    importIcsToCalendar(calendarId, icsContent = null) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) {
            throw new CalendariIOCException('408', 'CalendarManager.importIcsToCalendar', false);
        }
        
        if (calendar.type !== 'Altre') {
            throw new CalendariIOCException('409', 'CalendarManager.importIcsToCalendar', false);
        }
        
        if (icsContent) {
            // Ruta testeable: processar contingut directament
            icsImporter.importIcsFile((icsData) => {
                this._processIcsImport(calendar, icsData);
            }, calendar, icsContent);
            return;
        }
        
        // Flux original per usuaris reals
        icsImporter.importIcsFile((icsData) => {
            this._processIcsImport(calendar, icsData);
        }, calendar);
    }
    
    // === CÀRREGA DE CALENDARIS ===

    // Funció interna per processar les dades del calendari
    _processLoadedCalendar(calendarData) {
        try {
            if (!calendarData.name || !calendarData.startDate || !calendarData.endDate) {
                throw new CalendariIOCException('411', 'CalendarManager._processLoadedCalendar', false);
            }

            const calendarId = calendarData.id || calendarData.name;
            
            if (appStateManager.calendars[calendarId]) {
                throw new CalendariIOCException('412', 'CalendarManager._processLoadedCalendar', false);
            }
            
            const calendarType = calendarData.type || 'FP';
            
            if ((calendarType === 'FP' || calendarType === 'BTX') && !calendarData.code) {
                throw new CalendariIOCException('413', 'CalendarManager._processLoadedCalendar', false);
            }
            
            // FASE 4 FIX: Usar DataRehydrator per crear instàncies de classe correctes
            console.log('[CalendarManager] Rehidratant calendari carregat amb DataRehydrator...');
            
            const tempState = {
                calendars: { [calendarId]: calendarData },
                categoryTemplates: calendarData.categories?.filter(cat => !cat.isSystem) || []
            };
            
            const rehydratedState = CalendariIOC_DataRehydrator.rehydrateState(tempState);
            const calendarInstance = rehydratedState.calendars[calendarId];
            
            if (!calendarInstance) {
                throw new CalendariIOCException('414', 'CalendarManager._processLoadedCalendar - rehidratació fallida', false);
            }
            
            appStateManager.calendars[calendarId] = calendarInstance;
            
            // FASE 4 FIX: Afegir categories rehidratades al catàleg global
            if (rehydratedState.categoryTemplates) {
                rehydratedState.categoryTemplates.forEach(category => {
                    const existsInCatalog = appStateManager.categoryTemplates.some(template => 
                        template.id === category.id
                    );
                    
                    if (!existsInCatalog) {
                        appStateManager.categoryTemplates.push(category); // Ja és instància de classe
                        console.log(`[Carga] Añadida "${category.name}" al catálogo desde archivo`);
                    }
                });
            }
            
            appStateManager.currentCalendarId = calendarId;
            appStateManager.currentDate = dateHelper.parseUTC(calendarData.startDate);
            viewManager.changeView('month');
            storageManager.saveToStorage();
            this.updateUI();
            uiHelper.showMessage(`Calendari "${calendarData.name}" carregat correctament`, 'success');
            
        } catch (error) {
            if (error instanceof CalendariIOCException) {
                // No fer log per errors de validació d'estructura (415) - són esperats
                if (error.codiCausa !== '415') {
                    console.error('[CalendarManager] Error durant càrrega de calendari:', error);
                    console.error('[CalendarManager] Dades rebudes:', calendarData);
                }
                errorManager.handleError(error);
            } else {
                console.error('[CalendarManager] Error inesperat durant rehidratació:', error.message);
                console.error('[CalendarManager] Dades rebudes:', calendarData);
                errorManager.handleError(new CalendariIOCException('414', 'CalendarManager._processLoadedCalendar', false));
            }
        }
    }
    
    // Carregar fitxer de calendari o processar dades directament
    loadCalendarFile(jsonData = null) {
        if (jsonData) {
            this._processLoadedCalendar(jsonData);
            return;
        }

        const input = document.createElement('input');
        input.id = 'calendar-file-input';
        input.name = 'calendar-file-input';
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const calendarData = JSON.parse(e.target.result);
                        this._processLoadedCalendar(calendarData);
                    } catch (error) {
                        errorManager.handleError(new CalendariIOCException('414', 'CalendarManager.loadCalendarFile', false));
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    // === INTERFÍCIE D'USUARI ===
    
    // Actualitzar tota la interfície
    updateUI() {
        panelsRenderer.renderSavedCalendars();
        panelsRenderer.renderCategories();
        panelsRenderer.renderUnplacedEvents();
        viewManager.renderCurrentView();
    }
}

// === INSTÀNCIA GLOBAL ===
const calendarManager = new CalendarManager();