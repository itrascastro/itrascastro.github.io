/**
 * =================================================================
 * APP STATE - GESTIÓ CENTRALITZADA DE L'ESTAT DE L'APLICACIÓ
 * =================================================================
 * 
 * @file        AppStateManager.js
 * @description Gestió centralitzada de l'estat global de l'aplicació, incloent
 *              persistència de navegació per calendari i variables auxiliars
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0
 * @date        2025-01-16
 * @project     Calendari IOC
 * @repository  https://github.com/itrascastro/calendari-ioc
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * CARACTERÍSTIQUES PRINCIPALS:
 * - Estat centralitzat per a tots els components
 * - Sistema de persistència de navegació per calendari (lastVisitedMonths)
 * - Gestió de variables de drag & drop i selecció
 * - Validació i migració de dades d'estat
 * 
 * =================================================================
 */

// === CLASSE APPSTATEMANAGER ===

class AppStateManager {
    /**
     * Constructor del gestor d'estat centralitzat
     * Inicialitza l'estat principal de l'aplicació amb totes les propietats necessàries
     */
    constructor() {
        // Estat principal de l'aplicació
        this.appState = {
            calendars: {},
            currentCalendarId: null,
            currentDate: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
            categoryTemplates: [],  // Catàleg global de categories d'usuari
            systemCategoryColors: {}, // Colors assignats a categories de sistema
            unplacedEvents: [], // Esdeveniments no ubicats en replicació
            /**
             * Sistema de persistència de navegació per calendari
             * @type {Object.<string, string>} lastVisitedMonths
             * @description Mapeja cada ID de calendari amb l'últim mes visitat (format ISO)
             * @example { "FP_24S2_001": "2025-03-01T00:00:00.000Z" }
             * Permet que cada calendari recordi el seu últim mes visitat en vista mensual
             */
            lastVisitedMonths: {}
        };

        // Variables de drag & drop
        this.draggedEvent = null;
        this.draggedFromDate = null;

        // Variables de selección
        this.selectedCalendarId = null;
        this.selectedCategoryId = null;
        
        // Variables de edició temporal
        this._editingEventId = null;
    }

    // Obtenir el calendari actual
    getCurrentCalendar() {
        if (!this.appState.currentCalendarId || !this.appState.calendars[this.appState.currentCalendarId]) {
            this.appState.currentCalendarId = Object.keys(this.appState.calendars)[0] || null;
        }
        return this.appState.currentCalendarId ? this.appState.calendars[this.appState.currentCalendarId] : null;
    }

    // Obtenir l'ID del calendari seleccionat
    getSelectedCalendarId() {
        return this.selectedCalendarId;
    }

    // Obtenir l'ID de la categoria seleccionada
    getSelectedCategoryId() {
        return this.selectedCategoryId;
    }

    // Netejar l'estat de drag & drop
    cleanupDragState() {
        this.draggedEvent = null;
        this.draggedFromDate = null;
        
        // Netejar totes les classes de drop
        document.querySelectorAll('.drop-target, .drop-invalid').forEach(el => {
            el.classList.remove('drop-target', 'drop-invalid');
        });
    }

    // Establir el calendari seleccionat
    setSelectedCalendarId(calendarId) {
        this.selectedCalendarId = calendarId;
    }

    // Establir la categoria seleccionada
    setSelectedCategoryId(categoryId) {
        this.selectedCategoryId = categoryId;
    }

    // Netejar la selecció de categoria
    clearSelectedCategoryId() {
        this.selectedCategoryId = null;
    }

    // Resetejar l'estat de l'aplicació
    resetAppState() {
        this.appState = {
            calendars: {},
            currentCalendarId: null,
            currentDate: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
            categoryTemplates: [],
            systemCategoryColors: {},
            unplacedEvents: [],
            lastVisitedMonths: {}
        };
        
        // Resetejar variables auxiliars
        this.draggedEvent = null;
        this.draggedFromDate = null;
        this.selectedCalendarId = null;
        this.selectedCategoryId = null;
        this._editingEventId = null;
    }

    // === GETTERS I SETTERS PER A ACCÉS DIRECTE A PROPIETATS ===
    
    // Calendaris
    get calendars() {
        return this.appState.calendars;
    }
    
    set calendars(value) {
        this.appState.calendars = value;
    }
    
    // ID del calendari actual
    get currentCalendarId() {
        return this.appState.currentCalendarId;
    }
    
    set currentCalendarId(value) {
        this.appState.currentCalendarId = value;
    }
    
    // Data actual
    get currentDate() {
        return this.appState.currentDate;
    }
    
    set currentDate(value) {
        this.appState.currentDate = value;
    }
    
    // Plantilles de categories
    get categoryTemplates() {
        return this.appState.categoryTemplates;
    }
    
    set categoryTemplates(value) {
        this.appState.categoryTemplates = value;
    }
    
    // Esdeveniments no ubicats
    get unplacedEvents() {
        return this.appState.unplacedEvents;
    }
    
    set unplacedEvents(value) {
        this.appState.unplacedEvents = value;
    }
    
    // Colors de categories del sistema
    get systemCategoryColors() {
        return this.appState.systemCategoryColors;
    }
    
    set systemCategoryColors(value) {
        this.appState.systemCategoryColors = value;
    }
    
    // ID de l'esdeveniment en edició
    get editingEventId() {
        return this._editingEventId;
    }
    
    set editingEventId(value) {
        this._editingEventId = value;
    }
    
    /**
     * Últims mesos visitats per calendari
     * @returns {Object.<string, string>} Mapeig de calendarId → data ISO de l'últim mes visitat
     * @description Sistema de persistència de navegació que permet a cada calendari
     *              recordar l'últim mes visitat en vista mensual durant la sessió
     */
    get lastVisitedMonths() {
        return this.appState.lastVisitedMonths;
    }
    
    /**
     * Establir els últims mesos visitats
     * @param {Object.<string, string>} value Nou mapeig de lastVisitedMonths
     */
    set lastVisitedMonths(value) {
        this.appState.lastVisitedMonths = value;
    }
    
    // === MIGRACIONS ===
    
    // Migrar plantilles de categories des de calendaris existents
    migrateCategoryTemplates() {
        console.log('[Migració] Sincronitzant catàleg de categories...');
        
        Object.values(this.appState.calendars).forEach(calendar => {
            if (calendar.categories) {
                calendar.categories
                    .filter(cat => !cat.isSystem) // Només categories d'usuari
                    .forEach(category => {
                        // Verificar si ja existeix al catàleg
                        const existingTemplate = this.appState.categoryTemplates.find(t => t.id === category.id);
                        
                        if (!existingTemplate) {
                            // Afegir nova plantilla
                            this.appState.categoryTemplates.push({
                                id: category.id,
                                name: category.name,
                                color: category.color,
                                isSystem: false,
                                createdAt: new Date().toISOString(),
                                usageCount: 1
                            });
                        } else {
                            // Actualitzar plantilla existent
                            existingTemplate.name = category.name;
                            existingTemplate.color = category.color;
                            existingTemplate.usageCount = (existingTemplate.usageCount || 0) + 1;
                        }
                    });
            }
        });
        
        // EL CATÀLEG NOMÉS CONTÉ CATEGORIES D'USUARI
        // Les categories de sistema es mantenen només als calendaris individuals
        // NO afegim categories per defecte al catàleg global
        
        console.log(`[Migració] Catàleg sincronitzat amb ${this.appState.categoryTemplates.length} categories`);
    }
    
    // === MÈTODES DE LOOKUP PER INSTÀNCIES ===
    
    /**
     * Troba una instància d'esdeveniment per ID a través de tots els calendaris
     * @param {string} eventId - ID de l'esdeveniment a trobar
     * @returns {CalendariIOC_Event|null} Instància de l'esdeveniment o null si no es troba
     */
    findEventById(eventId) {
        if (!eventId) return null;
        
        for (const calendar of Object.values(this.appState.calendars)) {
            if (calendar.events && Array.isArray(calendar.events)) {
                const event = calendar.events.find(e => e.id === eventId);
                if (event) {
                    return event; // Retorna la instància real de CalendariIOC_Event
                }
            }
        }
        
        return null;
    }
    
    /**
     * Troba una instància de categoria per ID a través de tots els calendaris
     * @param {string} categoryId - ID de la categoria a trobar
     * @returns {CalendariIOC_Category|null} Instància de la categoria o null si no es troba
     */
    findCategoryById(categoryId) {
        if (!categoryId) return null;
        
        for (const calendar of Object.values(this.appState.calendars)) {
            if (calendar.categories && Array.isArray(calendar.categories)) {
                const category = calendar.categories.find(c => c.id === categoryId);
                if (category) {
                    return category; // Retorna la instància real de CalendariIOC_Category
                }
            }
        }
        
        return null;
    }
}

// === INSTÀNCIA GLOBAL ===

// Crear instància global de AppStateManager
const appStateManager = new AppStateManager();