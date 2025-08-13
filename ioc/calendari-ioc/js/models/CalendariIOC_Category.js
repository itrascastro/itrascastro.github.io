/**
 * =================================================================
 * CATEGORY MODEL - CLASSE PER CATEGORIES D'ESDEVENIMENTS
 * =================================================================
 * 
 * @file        Category.js
 * @description Model de dades per categories amb serialització controlada
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
 * Classe CalendariIOC_Category - Representa una categoria d'esdeveniments
 * 
 * Aquesta és la classe més simple del model, sense dependències externes.
 * Encapsula les propietats d'una categoria i proporciona serialització neta.
 */
class CalendariIOC_Category {
    /**
     * Constructor de Category
     * @param {Object} data - Dades de la categoria
     * @param {string} data.id - Identificador únic de la categoria
     * @param {string} data.name - Nom de la categoria
     * @param {string} data.color - Color de la categoria (hex)
     * @param {boolean} [data.isSystem=false] - Si és categoria del sistema
     */
    constructor(data) {
        if (!data || !data.id || !data.name || !data.color) {
            throw new CalendariIOCException('1301', 'CalendariIOC_Category.constructor', false);
        }

        this.id = data.id;
        this.name = data.name;
        this.color = data.color;
        this.isSystem = data.isSystem || false;
    }

    /**
     * Serialització JSON controlada
     * 
     * Com que Category no té referències circulars, la serialització
     * és directa. Retorna totes les propietats de la categoria.
     * 
     * @returns {Object} Objecte serialitzable per JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            isSystem: this.isSystem
        };
    }

    /**
     * Comparar si dues categories són iguals
     * @param {CalendariIOC_Category} other - Altra categoria a comparar
     * @returns {boolean} True si tenen el mateix ID
     */
    equals(other) {
        return other instanceof CalendariIOC_Category && this.id === other.id;
    }

    /**
     * Representació en string per debugging
     * @returns {string} Descripció llegible de la categoria
     */
    toString() {
        return `CalendariIOC_Category(${this.id}: "${this.name}", ${this.color})`;
    }
}

// Exportar la classe per ús global amb namespace propi
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendariIOC_Category;
} else {
    window.CalendariModels = window.CalendariModels || {};
    window.CalendariModels.Category = CalendariIOC_Category;
}