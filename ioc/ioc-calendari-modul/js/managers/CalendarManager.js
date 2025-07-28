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
                uiHelper.showMessage("Selecciona un tipus de calendari.", 'error');
                return;
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
                uiHelper.showMessage("Ja existeix un calendari amb aquest nom.", 'error');
                return;
            }
            
            this.createCalendarData(calendarData.id, calendarData.name, calendarData.startDate, calendarData.endDate, calendarData.type, calendarData.paf1Date, calendarData.config);
            this.completeCalendarSave();
            
        } catch (error) {
            console.error('[CalendarManager] Error afegint calendari:', error);
            uiHelper.showMessage('Error creant el calendari.', 'error');
        }
    }
    
    // Processar calendari FP (asíncron)
    async processFPCalendar() {
        const cicle = document.getElementById('cicleCode').value.trim().toUpperCase();
        const module = document.getElementById('moduleCode').value.trim().toUpperCase();
        
        if (!cicle || !module) {
            uiHelper.showMessage("Els camps Cicle i Mòdul són obligatoris.", 'error');
            return null;
        }
        
        // Crear configuració específica per FP
        const fpConfig = new SemesterConfig('FP');
        await fpConfig.initialize();
        const startDate = fpConfig.getStartDate();
        const endDate = fpConfig.getEndDate();  
        const paf1Date = fpConfig.getSemester()?.paf1Date || null;
        const code = fpConfig.getSemesterCode();
        
        const calendarName = `FP_${cicle}_${module}_${code}`;
        const calendarId = calendarName;
        
        return {
            id: calendarId,
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
            uiHelper.showMessage("El camp Assignatura és obligatori.", 'error');
            return null;
        }
        
        // Crear configuració específica per BTX
        const btxConfig = new SemesterConfig('BTX');
        await btxConfig.initialize();
        const startDate = btxConfig.getStartDate();
        const endDate = btxConfig.getEndDate();
        const paf1Date = btxConfig.getSemester()?.paf1Date || null;
        const code = btxConfig.getSemesterCode();
        
        const calendarName = `BTX_${subject}_${code}`;
        const calendarId = calendarName;
        
        return {
            id: calendarId,
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
            uiHelper.showMessage("Tots els camps són obligatoris per tipus Altre.", 'error');
            return null;
        }
        
        if (startDate >= endDate) {
            uiHelper.showMessage("La data de fi ha de ser posterior a la data d'inici.", 'error');
            return null;
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
                // Fallback segur: usar primer mes del calendari
                targetDate = dateHelper.createUTC(calendarStart.getUTCFullYear(), calendarStart.getUTCMonth(), 1);
            }
        } else {
            // Primera visita: usar primer mes del calendari
            const calendarStart = dateHelper.parseUTC(newCalendar.startDate);
            targetDate = dateHelper.createUTC(calendarStart.getUTCFullYear(), calendarStart.getUTCMonth(), 1);
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
        // Usar configuració específica (obligatòria)
        const configToUse = config;
        const systemEvents = this.generateSystemEvents(startDate, endDate, type, configToUse);
        
        const calendarData = {
            id: calendarId,
            name: calendarName,
            startDate,
            endDate,
            type: type,
            code: configToUse ? configToUse.getSemesterCode() : null,
            eventCounter: 0,
            categoryCounter: 0,
            categories: configToUse ? [...configToUse.getDefaultCategories()] : [],
            events: systemEvents
        };
        
        // Afegir paf1Date només si existeix
        if (paf1Date) {
            calendarData.paf1Date = paf1Date;
        }
        
        // Assignar colors a categories de sistema sense color
        calendarData.categories.forEach(category => {
            if (category.isSystem && !category.color) {
                category.color = colorCategoryHelper.assignSystemCategoryColor(category.id);
            }
        });
        
        appStateManager.calendars[calendarId] = calendarData;
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
    
    // Completar desament del calendari
    completeCalendarSave() {
        // Sempre tornar a vista mensual quan es crea un calendari
        viewManager.changeView('month');
        
        storageManager.saveToStorage();
        this.updateUI();
        modalRenderer.closeModal('calendarSetupModal');
        uiHelper.showMessage('Calendari guardat correctament', 'success');
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
    
    // Importar esdeveniments ICS a calendari existent tipus "Altre"
    importIcsToCalendar(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) {
            uiHelper.showMessage('Calendari no trobat', 'error');
            return;
        }
        
        if (calendar.type !== 'Altre') {
            uiHelper.showMessage('La importació ICS només està disponible per calendaris tipus "Altre"', 'error');
            return;
        }
        
        icsImporter.importIcsFile((icsData) => {
            try {
                // Crear categoria "Importats" si no existeix
                let importCategory = calendar.categories.find(cat => cat.name === 'Importats');
                if (!importCategory) {
                    calendar.categoryCounter = (calendar.categoryCounter || 0) + 1;
                    importCategory = {
                        id: `${calendar.id}_C${calendar.categoryCounter}`,
                        name: 'Importats',
                        color: colorCategoryHelper.generateRandomColor(),
                        isSystem: false
                    };
                    calendar.categories.push(importCategory);
                }
                
                // Afegir esdeveniments amb IDs únics i categoria correcta
                icsData.events.forEach(icsEvent => {
                    calendar.eventCounter = (calendar.eventCounter || 0) + 1;
                    const eventId = `${calendar.id}_E${calendar.eventCounter}`;
                    
                    calendar.events.push({
                        id: eventId,
                        title: icsEvent.title,
                        date: icsEvent.date,
                        categoryId: importCategory.id,
                        description: icsEvent.description,
                        isSystemEvent: false
                    });
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
                uiHelper.showMessage('Error processant els esdeveniments: ' + error.message, 'error');
            }
        }, calendar);
    }
    
    // === CÀRREGA DE CALENDARIS ===
    
    // Carregar fitxer de calendari
    loadCalendarFile() {
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
                        
                        // Validar estructura bàsica
                        if (!calendarData.name || !calendarData.startDate || !calendarData.endDate) {
                            throw new Error('Estructura del fitxer incorrecta');
                        }

                        // Usar ID correcte del fitxer JSON
                        const calendarId = calendarData.id || calendarData.name;
                        
                        // Validar que no existeixi ja un calendari amb aquest ID
                        if (appStateManager.calendars[calendarId]) {
                            throw new Error(`Ja existeix un calendari amb ID "${calendarId}"`);
                        }
                        
                        // Validar tipus de calendari
                        const calendarType = calendarData.type || 'FP'; // Per defecte FP per compatibilitat
                        
                        // Validar codi de semestre només per calendaris FP/BTX (no per "Altre")
                        if ((calendarType === 'FP' || calendarType === 'BTX') && !calendarData.code) {
                            throw new Error('Els calendaris FP/BTX requereixen codi de semestre');
                        }
                        // Calendaris "Altre" poden tenir code: null, és correcte
                        
                        // Usar el JSON sencer amb les seves propietats
                        const calendarToLoad = {
                            ...calendarData,
                            id: calendarId,
                            type: calendarType,
                            eventCounter: calendarData.eventCounter || 0,
                            categoryCounter: calendarData.categoryCounter || 0,
                            categories: calendarData.categories || [],
                            events: calendarData.events || []
                        };
                        
                        appStateManager.calendars[calendarId] = calendarToLoad;
                        
                        // Migrar categories del fitxer carregat al catàleg
                        if (calendarData.categories) {
                            calendarData.categories
                                .filter(cat => !cat.isSystem)
                                .forEach(category => {
                                    const existsInCatalog = appStateManager.categoryTemplates.some(template => 
                                        template.id === category.id
                                    );
                                    
                                    if (!existsInCatalog) {
                                        appStateManager.categoryTemplates.push({
                                            id: category.id,
                                            name: category.name,
                                            color: category.color,
                                            isSystem: false
                                        });
                                        console.log(`[Carga] Añadida "${category.name}" al catálogo desde archivo`);
                                    }
                                });
                        }
                        
                        // Activar calendari carregat
                        appStateManager.currentCalendarId = calendarId;
                        
                        // Establir currentDate a la data d'inici real del calendari carregat
                        const calendarStart = dateHelper.parseUTC(calendarData.startDate);
                        appStateManager.currentDate = calendarStart;
                        
                        // Sempre tornar a vista mensual quan es carrega un calendari
                        viewManager.changeView('month');
                        
                        storageManager.saveToStorage();
                        this.updateUI();
                        uiHelper.showMessage(`Calendari "${calendarData.name}" carregat correctament`, 'success');
                        
                    } catch (error) {
                        uiHelper.showMessage('Error carregant el fitxer: ' + error.message, 'error');
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