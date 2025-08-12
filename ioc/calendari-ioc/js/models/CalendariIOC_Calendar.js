/**
 * =================================================================
 * CALENDAR MODEL - CLASSE PER CALENDARIS
 * =================================================================
 * 
 * @file        Calendar.js
 * @description Model de dades per calendaris amb mètodes controlats
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     2.0.0
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

/**
 * Classe Calendar - Contenidor principal per esdeveniments i categories
 * 
 * Aquesta classe encapsula un calendari complet amb arrays d'instàncies
 * Event i Category. Proporciona mètodes controlats per afegir elements
 * i utilitats per lookup intern.
 */
class CalendariIOC_Calendar {
    /**
     * Constructor de Calendar
     * @param {Object} data - Dades del calendari
     * @param {string} data.id - Identificador únic del calendari
     * @param {string} data.name - Nom del calendari
     * @param {string} data.startDate - Data d'inici en format 'YYYY-MM-DD'
     * @param {string} data.endDate - Data de fi en format 'YYYY-MM-DD'
     * @param {string} data.type - Tipus de calendari (ex: 'FP', 'BTX', 'Altre')
     * @param {string} [data.code] - Codi del semestre (opcional)
     * @param {number} [data.lastEventId=0] - Últim ID d'esdeveniment generat
     * @param {number} [data.lastCategoryId=0] - Últim ID de categoria generat
     * @param {string} [data.paf1Date] - Data PAF1 (opcional)
     */
    constructor(data) {
        if (!data || !data.id || !data.name || !data.startDate || !data.endDate || !data.type) {
            throw new CalendariIOCException('1304', 'CalendariIOC_Calendar.constructor', false);
        }

        this.id = data.id;
        this.name = data.name;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        this.type = data.type;
        this.code = data.code || null;
        this.lastEventId = data.lastEventId || 0;
        this.lastCategoryId = data.lastCategoryId || 0;
        this.paf1Date = data.paf1Date || null;
        
        // Arrays d'INSTÀNCIES (no objectes literals)
        // Aquests arrays contindran només instàncies de les classes corresponents
        this.categories = [];
        this.events = [];
    }

    /**
     * Retorna el nombre real d'esdeveniments (no de sistema)
     * @returns {number}
     */
    get eventCount() {
        return this.events.filter(event => !event.isSystemEvent).length;
    }

    /**
     * Retorna el nombre real de categories (no de sistema)
     * @returns {number}
     */
    get categoryCount() {
        return this.categories.filter(cat => !cat.isSystem).length;
    }

    /**
     * Afegir categoria amb validació de tipus
     * @param {CalendariIOC_Category} category - Instància de CalendariIOC_Category a afegir
     * @throws {Error} Si no és una instància de CalendariIOC_Category
     */
    addCategory(category) {
        if (!(category instanceof CalendariIOC_Category)) {
            throw new CalendariIOCException('1305', 'CalendariIOC_Calendar.addCategory', false);
        }
        
        // Verificar que no existeixi ja
        if (this.categories.some(cat => cat.id === category.id)) {
            console.warn(`Category ${category.id} already exists in calendar ${this.id}`);
            return;
        }
        
        this.categories.push(category);
    }

    /**
     * Afegir esdeveniment amb validació de tipus
     * @param {CalendariIOC_Event} event - Instància de CalendariIOC_Event a afegir
     * @throws {Error} Si no és una instància de CalendariIOC_Event
     */
    addEvent(event) {
        if (!(event instanceof CalendariIOC_Event)) {
            throw new CalendariIOCException('1306', 'CalendariIOC_Calendar.addEvent', false);
        }

        // SALVAGUARDA: Validar que l'ID de l'event pertany a aquest calendari
        // EXCEPCIÓ: Els esdeveniments del sistema són globals i poden tenir IDs diferents
        if (!event.isSystemEvent && !event.id.startsWith(this.id)) {
            throw new CalendariIOCException('1307', `Intent d'afegir event '${event.id}' al calendari '${this.id}'`, true);
        }
        
        // Verificar que no existeixi ja
        if (this.events.some(evt => evt.id === event.id)) {
            console.warn(`Event ${event.id} already exists in calendar ${this.id}`);
            return;
        }
        
        this.events.push(event);
    }

    /**
     * Eliminar categoria per ID
     * @param {string} categoryId - ID de la categoria a eliminar
     * @returns {boolean} True si s'ha eliminat, false si no existia
     */
    removeCategory(categoryId) {
        const initialLength = this.categories.length;
        this.categories = this.categories.filter(cat => cat.id !== categoryId);
        return this.categories.length < initialLength;
    }

    /**
     * Eliminar esdeveniment per ID
     * @param {string} eventId - ID de l'esdeveniment a eliminar
     * @returns {boolean} True si s'ha eliminat, false si no existia
     */
    removeEvent(eventId) {
        const initialLength = this.events.length;
        this.events = this.events.filter(evt => evt.id !== eventId);
        return this.events.length < initialLength;
    }

    /**
     * Trobar categoria per ID - Utilitat per lookup intern
     * @param {string} categoryId - ID de la categoria a cercar
     * @returns {CalendariIOC_Category|null} Instància de CalendariIOC_Category o null si no es troba
     */
    findCategoryById(categoryId) {
        return this.categories.find(cat => cat.id === categoryId) || null;
    }

    /**
     * Trobar esdeveniment per ID
     * @param {string} eventId - ID de l'esdeveniment a cercar
     * @returns {CalendariIOC_Event|null} Instància de CalendariIOC_Event o null si no es troba
     */
    findEventById(eventId) {
        return this.events.find(evt => evt.id === eventId) || null;
    }

    /**
     * Obtenir esdeveniments d'una data específica
     * @param {string} date - Data en format 'YYYY-MM-DD'
     * @returns {CalendariIOC_Event[]} Array d'esdeveniments de la data
     */
    getEventsForDate(date) {
        return this.events.filter(event => event.date === date);
    }

    /**
     * Obtenir categories del sistema
     * @returns {CalendariIOC_Category[]} Array de categories marcades com a sistema
     */
    getSystemCategories() {
        return this.categories.filter(cat => cat.isSystem);
    }

    /**
     * Obtenir categories d'usuari
     * @returns {CalendariIOC_Category[]} Array de categories no marcades com a sistema
     */
    getUserCategories() {
        return this.categories.filter(cat => !cat.isSystem);
    }

    /**
     * Verificar si una data està dins del rang del calendari
     * @param {string} date - Data en format 'YYYY-MM-DD'
     * @returns {boolean} True si la data està dins del rang
     */
    isDateInRange(date) {
        return date >= this.startDate && date <= this.endDate;
    }

    /**
     * Serialització JSON controlada - DELEGA SERIALITZACIÓ ALS ELEMENTS
     * 
     * Aquest mètode delega la serialització als elements del calendari.
     * Els events usaran el seu toJSON() que serialitza categoryId (no instància),
     * trencant així les referències circulars.
     * 
     * @returns {Object} Objecte serialitzable per JSON
     */
    toJSON() {
        // Recopilar totes les categories necessàries per als esdeveniments
        const eventCategoryIds = new Set();
        this.events.forEach(event => {
            if (event.hasCategory()) {
                eventCategoryIds.add(event.getCategory().id);
            }
        });
        
        // Combinar categories del calendari + categories del catàleg necessàries per als esdeveniments
        const allRequiredCategories = new Map();
        
        // Afegir categories del calendari
        this.categories.forEach(cat => {
            allRequiredCategories.set(cat.id, cat);
        });
        
        // Afegir categories del catàleg que necessiten els esdeveniments
        if (typeof appStateManager !== 'undefined' && appStateManager.categoryTemplates) {
            appStateManager.categoryTemplates.forEach(cat => {
                if (eventCategoryIds.has(cat.id) && !allRequiredCategories.has(cat.id)) {
                    // Assegurar que és una instància de CalendariIOC_Category
                    if (cat instanceof CalendariIOC_Category) {
                        allRequiredCategories.set(cat.id, cat);
                    } else {
                        // Si és un objecte JSON, crear instància
                        const categoryInstance = new CalendariIOC_Category(cat);
                        allRequiredCategories.set(cat.id, categoryInstance);
                    }
                }
            });
        }
        
        return {
            id: this.id,
            name: this.name,
            startDate: this.startDate,
            endDate: this.endDate,
            type: this.type,
            code: this.code,
            lastEventId: this.lastEventId,
            lastCategoryId: this.lastCategoryId,
            paf1Date: this.paf1Date,
            categories: Array.from(allRequiredCategories.values()).map(cat => cat.toJSON()),
            events: this.events.map(event => event.toJSON()) // Usa categoryId, no instància
        };
    }

    /**
     * Comparar si dos calendaris són iguals
     * @param {CalendariIOC_Calendar} other - Altre calendari a comparar
     * @returns {boolean} True si tenen el mateix ID
     */
    equals(other) {
        return other instanceof CalendariIOC_Calendar && this.id === other.id;
    }

    /**
     * Representació en string per debugging
     * @returns {string} Descripció llegible del calendari
     */
    toString() {
        return `CalendariIOC_Calendar(${this.id}: "${this.name}", ${this.events.length} events, ${this.categories.length} categories)`;
    }
}

// Exportar la classe per ús global amb namespace propi
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendariIOC_Calendar;
} else {
    window.CalendariModels = window.CalendariModels || {};
    window.CalendariModels.Calendar = CalendariIOC_Calendar;
}