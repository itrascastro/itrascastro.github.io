/**
 * =================================================================
 * CALENDAR MANAGER - GESTIÓ DE CALENDARIS
 * =================================================================
 * 
 * @file        calendar-manager.js
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
    constructor() {
        this.managerType = 'calendar';
    }
    
    // === GESTIÓ DE CALENDARIS ===
    
    // Crear o editar calendari
    saveCalendar() {
        const cicle = document.getElementById('cicleCode').value.trim().toUpperCase();
        const module = document.getElementById('moduleCode').value.trim().toUpperCase();
        
        if (!this.validateCalendarData(cicle, module)) {
            return;
        }
        
        // Usar dates fixes del IOC
        const startDate = semesterConfig.getStartDate();
        const endDate = semesterConfig.getEndDate();
        
        const calendarName = `${cicle}_${module}_${semesterConfig.getSemesterCode()}`;
        const calendarId = calendarName;
        
        if (this.calendarExists(calendarId) && appStateManager.editingCalendarId !== calendarId) {
            showMessage("Ja existeix un calendari amb aquest cicle i mòdul per aquest semestre.", 'error');
            return;
        }
        
        this.createCalendarData(calendarId, calendarName, startDate, endDate);
        this.completeCalendarSave();
    }
    
    // Eliminar calendari
    deleteCalendar(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) return;

        showConfirmModal(
            `Estàs segur que vols eliminar el calendari "${calendar.name}"?\n\nAquesta acció no es pot desfer.`,
            'Eliminar calendari',
            () => {
                delete appStateManager.calendars[calendarId];
                
                // Si era el calendari actiu, netejar selecció
                if (appStateManager.currentCalendarId === calendarId) {
                    appStateManager.currentCalendarId = null;
                }
                
                storageManager.saveToStorage();
                this.updateUI();
                showMessage('Calendari eliminat correctament', 'success');
            }
        );
    }
    
    // Canviar calendari actiu
    switchCalendar(calendarId) {
        if (!calendarId || !appStateManager.calendars[calendarId]) return;
        
        appStateManager.currentCalendarId = calendarId;
        
        const activeCalendar = appStateManager.calendars[calendarId];
        
        appStateManager.currentDate = parseUTCDate(activeCalendar.startDate);
        
        // Sempre tornar a vista mensual quan es canvia de calendari
        viewManager.changeView('month');
        
        storageManager.saveToStorage();
        this.updateUI();
    }
    
    // === VALIDACIONS ===
    
    // Validar dades del calendari
    validateCalendarData(cicle, module) {
        if (!cicle || !module) {
            showMessage("Els camps Cicle i Mòdul són obligatoris.", 'error');
            return false;
        }
        return true;
    }
    
    // Verificar si el calendari existeix
    calendarExists(calendarId) {
        return !!appStateManager.calendars[calendarId];
    }
    
    // === CREACIÓ DE CALENDARIS ===
    
    // Crear dades del calendari amb esdeveniments de sistema
    createCalendarData(calendarId, calendarName, startDate, endDate) {
        const systemEvents = this.generateSystemEvents(startDate, endDate);
        
        appStateManager.calendars[calendarId] = {
            name: calendarName,
            startDate,
            endDate,
            code: semesterConfig.getSemesterCode(),
            eventCounter: 0,
            categoryCounter: 0,
            categories: [...semesterConfig.getDefaultCategories()],
            events: systemEvents
        };
        
        appStateManager.currentCalendarId = calendarId;
        appStateManager.currentDate = parseUTCDate(startDate);
    }
    
    // Generar esdeveniments de sistema per al calendari
    generateSystemEvents(startDate, endDate) {
        const systemEvents = [];
        
        // Afegir esdeveniments puntuals
        semesterConfig.getSystemEvents().forEach(event => {
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
        closeModal('calendarSetupModal');
        showMessage('Calendari guardat correctament', 'success');
    }
    
    // === NAVEGACIÓ ===
    
    // Actualitzar controls de navegació segons el calendari
    updateNavigationControls(calendar) {
        const prevBtn = document.querySelector('.nav-arrow[data-direction="-1"]');
        const nextBtn = document.querySelector('.nav-arrow[data-direction="1"]');
        
        if (!prevBtn || !nextBtn || !calendar) return;
        
        const calendarStart = parseUTCDate(calendar.startDate);
        const calendarEnd = parseUTCDate(calendar.endDate);
        
        const prevMonthEnd = createUTCDate(
            appStateManager.currentDate.getUTCFullYear(), 
            appStateManager.currentDate.getUTCMonth(), 
            0
        );
        prevBtn.disabled = prevMonthEnd < calendarStart;
        
        const nextMonthStart = createUTCDate(
            appStateManager.currentDate.getUTCFullYear(), 
            appStateManager.currentDate.getUTCMonth() + 1, 
            1
        );
        nextBtn.disabled = nextMonthStart > calendarEnd;
    }
    
    // === CÀRREGA DE CALENDARIS ===
    
    // Carregar fitxer de calendari
    loadCalendarFile() {
        const input = document.createElement('input');
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

                        // Crear nou calendari amb ID basat en el nom
                        const calendarId = calendarData.name;
                        appStateManager.calendars[calendarId] = {
                            name: calendarData.name,
                            startDate: calendarData.startDate,
                            endDate: calendarData.endDate,
                            code: calendarData.code || semesterConfig.getSemesterCode(),
                            eventCounter: calendarData.eventCounter || 0,
                            categoryCounter: calendarData.categoryCounter || 0,
                            categories: calendarData.categories || [...semesterConfig.getDefaultCategories()],
                            events: calendarData.events || []
                        };
                        
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
                        appStateManager.currentDate = parseUTCDate(calendarData.startDate);
                        
                        // Sempre tornar a vista mensual quan es carrega un calendari
                        viewManager.changeView('month');
                        
                        storageManager.saveToStorage();
                        this.updateUI();
                        showMessage(`Calendari "${calendarData.name}" carregat correctament`, 'success');
                        
                    } catch (error) {
                        showMessage('Error carregant el fitxer: ' + error.message, 'error');
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