/**
 * =================================================================
 * EVENT MODEL - CLASSE PER ESDEVENIMENTS
 * =================================================================
 * 
 * @file        Event.js
 * @description Model de dades per esdeveniments amb referència directa a Category
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
 * =================================================================
 */

/**
 * Classe Event - Representa un esdeveniment amb referència directa a Category
 * 
 * Aquesta classe implementa el Model B (Grafo d'Objectes en Memòria) amb
 * referència directa a la instància de Category per accés instantani.
 * El mètode toJSON() trenca la circularitat serialitzant només el categoryId.
 */
class CalendariIOC_Event {
    /**
     * Constructor d'Event
     * @param {Object} data - Dades de l'esdeveniment
     * @param {string} data.id - Identificador únic de l'esdeveniment
     * @param {string} data.title - Títol de l'esdeveniment
     * @param {string} data.date - Data en format 'YYYY-MM-DD'
     * @param {string} [data.description=''] - Descripció de l'esdeveniment
     * @param {boolean} [data.isSystemEvent=false] - Si és esdeveniment del sistema
     * @param {Category} data.category - INSTÀNCIA completa de Category (no ID)
     */
    constructor(data) {
        if (!data || !data.id || !data.title || !data.date) {
            throw new CalendariIOCException('1302', 'CalendariIOC_Event.constructor', false);
        }

        this.id = data.id;
        this.title = data.title;
        this.date = data.date;
        this.description = data.description || '';
        this.isSystemEvent = data.isSystemEvent || false;
        
        // REFERÈNCIA DIRECTA A INSTÀNCIA (no categoryId)
        // Això permet accés instantani: event.getCategory().name
        this._category = data.category || null;
    }

    /**
     * Obtenir la categoria associada
     * @returns {Category|null} Instància de Category o null
     */
    getCategory() {
        return this._category;
    }

    /**
     * Establir nova categoria
     * @param {Category} category - Nova instància de Category
     */
    setCategory(category) {
        if (category && !(category instanceof CalendariIOC_Category)) {
            throw new CalendariIOCException('1303', 'CalendariIOC_Event.setCategory', false);
        }
        this._category = category;
    }

    /**
     * Obtenir color de la categoria amb fallback
     * @returns {string} Color hex de la categoria o color per defecte
     */
    getCategoryColor() {
        return this._category ? this._category.color : '#808080';
    }

    /**
     * Obtenir nom de la categoria amb fallback
     * @returns {string} Nom de la categoria o text per defecte
     */
    getCategoryName() {
        return this._category ? this._category.name : 'Sense categoria';
    }

    /**
     * Verificar si l'esdeveniment té categoria
     * @returns {boolean} True si té categoria assignada
     */
    hasCategory() {
        return this._category !== null;
    }

    /**
     * Verificar si la categoria és del sistema
     * @returns {boolean} True si la categoria és del sistema
     */
    isSystemCategory() {
        return this._category ? this._category.isSystem : false;
    }

    /**
     * Serialització JSON controlada - TRENCA CIRCULARITAT
     * 
     * Aquest és el mètode clau per solucionar el problema de referències circulars.
     * En lloc de serialitzar la instància completa de Category (que crearia 
     * circularitat), serialitza només el categoryId.
     * 
     * @returns {Object} Objecte serialitzable per JSON
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            date: this.date,
            description: this.description,
            isSystemEvent: this.isSystemEvent,
            categoryId: this._category ? this._category.id : null // NOMÉS ID, NO INSTÀNCIA
        };
    }

    /**
     * Comparar si dos esdeveniments són iguals
     * @param {Event} other - Altre esdeveniment a comparar
     * @returns {boolean} True si tenen el mateix ID
     */
    equals(other) {
        return other instanceof CalendariIOC_Event && this.id === other.id;
    }

    /**
     * Representació en string per debugging
     * @returns {string} Descripció llegible de l'esdeveniment
     */
    toString() {
        const categoryName = this.getCategoryName();
        return `CalendariIOC_Event(${this.id}: "${this.title}" on ${this.date}, category: ${categoryName})`;
    }
}

// Exportar la classe per ús global amb namespace propi
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendariIOC_Event;
} else {
    window.CalendariModels = window.CalendariModels || {};
    window.CalendariModels.Event = CalendariIOC_Event;
}