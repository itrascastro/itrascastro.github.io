/**
 * =================================================================
 * DATA REHYDRATOR - SISTEMA DE REHIDRATACIÓ DE GRAFO D'OBJECTES
 * =================================================================
 * 
 * @file        DataRehydrator.js
 * @description Sistema per reconstruir grafo d'objectes des de JSON pla
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
 * Classe DataRehydrator - Reconstructor de grafo d'objectes des de JSON
 * 
 * Aquesta classe implementa l'algoritme complex de rehidratació que converteix
 * JSON pla (amb IDs) en grafo d'objectes (amb instàncies i referències directes).
 * 
 * Procés:
 * 1. Crear mapa global de categories
 * 2. Instanciar totes les categories primer
 * 3. Per cada calendari: crear Events amb referències a Category
 * 4. Retornar estat completament rehidratat
 */
class CalendariIOC_DataRehydrator {
    /**
     * Rehidratar estat complet des de JSON
     * 
     * Aquest és el mètode principal que reconstrueix tot el grafo d'objectes.
     * Converteix dades JSON (amb categoryId) en instàncies amb referències directes.
     * 
     * @param {Object} jsonState - Estat deserialitzat des de JSON
     * @returns {Object} Estat amb instàncies de classes i referències directes
     * @throws {CalendariIOCException} Si hi ha errors en la rehidratació
     */
    static rehydrateState(jsonState) {
        try {
            // 0. VALIDAR ESTRUCTURA JSON ABANS DE PROCESSAR
            this.validateJSONStructure(jsonState);
            
            // 1. Crear mapa de categories global per lookup eficient
            const categoryMap = new Map();
            
            // 2. Primer, crear totes les instàncies Category i afegir-les al mapa
            // Això inclou categoryTemplates i categories de tots els calendaris
            this._createCategoryInstances(jsonState, categoryMap);
            
            // 3. Rehidratar cada calendari amb les seves categories i esdeveniments
            const rehydratedCalendars = this._rehydrateCalendars(jsonState, categoryMap);
            
            // 4. Crear array de categoryTemplates des del mapa (només no-sistema)
            const categoryTemplates = Array.from(categoryMap.values())
                .filter(cat => !cat.isSystem);
            
            // 5. Rehidratar esdeveniments no ubicats si existeixen
            const rehydratedUnplacedEvents = this._rehydrateUnplacedEvents(jsonState.unplacedEvents, categoryMap);
            
            // 6. Retornar estat completament rehidratat
            return {
                ...jsonState,
                calendars: rehydratedCalendars,
                categoryTemplates: categoryTemplates,
                unplacedEvents: rehydratedUnplacedEvents
            };
            
        } catch (error) {
            // Si és error de validació d'estructura (415), re-llançar l'original sense log excessiu
            if (error instanceof CalendariIOCException && error.codiCausa === '415') {
                throw error;
            }
            
            // Només fer log per errors tècnics reals durant rehidratació
            console.error('[CalendariIOC_DataRehydrator] Error during rehydration:', error);
            throw new CalendariIOCException('1307', 'CalendariIOC_DataRehydrator.rehydrateState', true);
        }
    }
    
    /**
     * Validar que l'estructura JSON compleix amb el format vigent
     * 
     * Verifica que el JSON tingui l'estructura esperada per la versió actual,
     * evitant errors durant la rehidratació amb JSONs incompatibles.
     * 
     * @param {Object} jsonState - Estat JSON a validar
     * @throws {CalendariIOCException} Si l'estructura no compleix amb el format vigent
     * @private
     */
    static validateJSONStructure(jsonState) {
        // Validar estructura principal
        if (!jsonState || typeof jsonState !== 'object') {
            throw new CalendariIOCException('415', 'CalendariIOC_DataRehydrator.validateJSONStructure - estructura principal', false);
        }
        
        // Validar que tingui la propietat calendars
        if (!jsonState.calendars || typeof jsonState.calendars !== 'object') {
            throw new CalendariIOCException('415', 'CalendariIOC_DataRehydrator.validateJSONStructure - propietat calendars', false);
        }
        
        // Validar cada calendari
        Object.keys(jsonState.calendars).forEach(calId => {
            const calData = jsonState.calendars[calId];
            this._validateCalendarStructure(calData, calId);
        });
        
        // Validar categoryTemplates si existeix
        if (jsonState.categoryTemplates) {
            if (!Array.isArray(jsonState.categoryTemplates)) {
                throw new CalendariIOCException('415', 'CalendariIOC_DataRehydrator.validateJSONStructure - categoryTemplates no és array', false);
            }
            
            jsonState.categoryTemplates.forEach((catData, index) => {
                this._validateCategoryStructure(catData, `categoryTemplates[${index}]`);
            });
        }
    }
    
    /**
     * Validar estructura d'un calendari individual
     * 
     * @param {Object} calData - Dades del calendari
     * @param {string} calId - ID del calendari per context d'error
     * @throws {CalendariIOCException} Si l'estructura del calendari no és vàlida
     * @private
     */
    static _validateCalendarStructure(calData, calId) {
        const requiredFields = ['id', 'name', 'startDate', 'endDate', 'type'];
        const expectedFields = [...requiredFields, 'lastEventId', 'lastCategoryId', 'code', 'paf1Date', 'categories', 'events'];
        
        // Verificar camps obligatoris
        requiredFields.forEach(field => {
            if (!calData.hasOwnProperty(field) || calData[field] === undefined || calData[field] === null) {
                throw new CalendariIOCException('415', `CalendariIOC_DataRehydrator.validateJSONStructure - calendari ${calId} manca camp ${field}`, false);
            }
        });
        
        // Verificar que tingui lastEventId i lastCategoryId (NO eventCounter/categoryCounter)
        if (!calData.hasOwnProperty('lastEventId')) {
            throw new CalendariIOCException('415', `CalendariIOC_DataRehydrator.validateJSONStructure - calendari ${calId} manca lastEventId`, false);
        }
        
        if (!calData.hasOwnProperty('lastCategoryId')) {
            throw new CalendariIOCException('415', `CalendariIOC_DataRehydrator.validateJSONStructure - calendari ${calId} manca lastCategoryId`, false);
        }
        
        // Verificar que NO tingui les propietats antigues
        if (calData.hasOwnProperty('eventCounter') || calData.hasOwnProperty('categoryCounter')) {
            throw new CalendariIOCException('415', `CalendariIOC_DataRehydrator.validateJSONStructure - calendari ${calId} conté propietats obsoletes`, false);
        }
        
        // Validar categories si existeixen
        if (calData.categories) {
            if (!Array.isArray(calData.categories)) {
                throw new CalendariIOCException('415', `CalendariIOC_DataRehydrator.validateJSONStructure - calendari ${calId} categories no és array`, false);
            }
            
            calData.categories.forEach((catData, index) => {
                this._validateCategoryStructure(catData, `calendari ${calId} categories[${index}]`);
            });
        }
        
        // Validar esdeveniments si existeixen
        if (calData.events) {
            if (!Array.isArray(calData.events)) {
                throw new CalendariIOCException('415', `CalendariIOC_DataRehydrator.validateJSONStructure - calendari ${calId} events no és array`, false);
            }
            
            calData.events.forEach((eventData, index) => {
                this._validateEventStructure(eventData, `calendari ${calId} events[${index}]`);
            });
        }
    }
    
    /**
     * Validar estructura d'una categoria
     * 
     * @param {Object} catData - Dades de la categoria
     * @param {string} context - Context per missatge d'error
     * @throws {CalendariIOCException} Si l'estructura de la categoria no és vàlida
     * @private
     */
    static _validateCategoryStructure(catData, context) {
        const requiredFields = ['id', 'name', 'color'];
        
        requiredFields.forEach(field => {
            if (!catData.hasOwnProperty(field) || catData[field] === undefined || catData[field] === null) {
                throw new CalendariIOCException('415', `CalendariIOC_DataRehydrator.validateJSONStructure - ${context} manca camp ${field}`, false);
            }
        });
        
        // Verificar que isSystem existeixi (pot ser false)
        if (!catData.hasOwnProperty('isSystem')) {
            throw new CalendariIOCException('415', `CalendariIOC_DataRehydrator.validateJSONStructure - ${context} manca camp isSystem`, false);
        }
    }
    
    /**
     * Validar estructura d'un esdeveniment (format serialitzat)
     * 
     * @param {Object} eventData - Dades de l'esdeveniment
     * @param {string} context - Context per missatge d'error
     * @throws {CalendariIOCException} Si l'estructura de l'esdeveniment no és vàlida
     * @private
     */
    static _validateEventStructure(eventData, context) {
        const requiredFields = ['id', 'title', 'date'];
        
        requiredFields.forEach(field => {
            if (!eventData.hasOwnProperty(field) || eventData[field] === undefined || eventData[field] === null) {
                throw new CalendariIOCException('415', `CalendariIOC_DataRehydrator.validateJSONStructure - ${context} manca camp ${field}`, false);
            }
        });
        
        // Verificar camps opcionals però esperats
        const expectedFields = ['description', 'isSystemEvent', 'categoryId'];
        expectedFields.forEach(field => {
            if (!eventData.hasOwnProperty(field)) {
                throw new CalendariIOCException('415', `CalendariIOC_DataRehydrator.validateJSONStructure - ${context} manca camp ${field}`, false);
            }
        });
    }
    
    /**
     * Crear totes les instàncies Category i afegir-les al mapa global
     * 
     * @param {Object} jsonState - Estat JSON
     * @param {Map} categoryMap - Mapa global de categories
     * @private
     */
    static _createCategoryInstances(jsonState, categoryMap) {
        // Afegir categoryTemplates globals
        if (jsonState.categoryTemplates) {
            jsonState.categoryTemplates.forEach(catData => {
                if (!categoryMap.has(catData.id)) {
                    const category = new CalendariIOC_Category(catData);
                    categoryMap.set(category.id, category);
                }
            });
        }
        
        // Afegir categories de tots els calendaris
        if (jsonState.calendars) {
            Object.values(jsonState.calendars).forEach(calData => {
                if (calData.categories) {
                    calData.categories.forEach(catData => {
                        if (!categoryMap.has(catData.id)) {
                            const category = new CalendariIOC_Category(catData);
                            categoryMap.set(category.id, category);
                        }
                    });
                }
            });
        }
    }
    
    /**
     * Rehidratar tots els calendaris amb instàncies Event i Category
     * 
     * @param {Object} jsonState - Estat JSON
     * @param {Map} categoryMap - Mapa global de categories
     * @returns {Object} Calendaris rehidratats
     * @private
     */
    static _rehydrateCalendars(jsonState, categoryMap) {
        const rehydratedCalendars = {};
        
        if (!jsonState.calendars) {
            return rehydratedCalendars;
        }
        
        Object.keys(jsonState.calendars).forEach(calId => {
            const calData = jsonState.calendars[calId];
            
            // Crear instància Calendar
            const calendar = new CalendariIOC_Calendar(calData);
            
            // Afegir categories del calendari (instàncies del mapa)
            if (calData.categories) {
                calData.categories.forEach(catData => {
                    const category = categoryMap.get(catData.id);
                    if (category) {
                        calendar.addCategory(category);
                    } else {
                        console.warn(`[CalendariIOC_DataRehydrator] Category ${catData.id} not found in map for calendar ${calId}`);
                    }
                });
            }
            
            // Crear esdeveniments amb referències directes a categories
            if (calData.events) {
                calData.events.forEach(eventData => {
                    const category = categoryMap.get(eventData.categoryId);
                    
                    // Crear Event amb referència directa a Category
                    const event = new CalendariIOC_Event({
                        id: eventData.id,
                        title: eventData.title,
                        date: eventData.date,
                        description: eventData.description,
                        isSystemEvent: eventData.isSystemEvent,
                        category: category // REFERÈNCIA DIRECTA A INSTÀNCIA
                    });
                    
                    calendar.addEvent(event);
                });
            }
            
            rehydratedCalendars[calId] = calendar;
        });
        
        return rehydratedCalendars;
    }
    
    /**
     * Rehidratar esdeveniments no ubicats
     * 
     * Converteix els esdeveniments no ubicats des de JSON pla a instàncies
     * CalendariIOC_Event amb referències directes a Category.
     * 
     * @param {Array} unplacedEventsData - Array d'esdeveniments no ubicats en format JSON
     * @param {Map} categoryMap - Mapa global de categories per lookup eficient
     * @returns {Array} Array d'esdeveniments no ubicats rehidratats
     * @private
     */
    static _rehydrateUnplacedEvents(unplacedEventsData, categoryMap) {
        if (!unplacedEventsData || !Array.isArray(unplacedEventsData)) {
            return [];
        }
        
        return unplacedEventsData.map(unplacedItem => {
            const eventData = unplacedItem.event;
            
            // Si l'esdeveniment ja és una instància de classe, mantenir-lo
            if (eventData instanceof CalendariIOC_Event) {
                return unplacedItem;
            }
            
            // Cercar categoria del mapa global
            let category = null;
            if (eventData.categoryId) {
                category = categoryMap.get(eventData.categoryId);
            }
            
            // Crear instància CalendariIOC_Event amb referència directa
            const rehydratedEvent = new CalendariIOC_Event({
                id: eventData.id,
                title: eventData.title,
                date: eventData.date,
                description: eventData.description,
                isSystemEvent: eventData.isSystemEvent,
                category: category // REFERÈNCIA DIRECTA A INSTÀNCIA
            });
            
            return {
                ...unplacedItem,
                event: rehydratedEvent
            };
        });
    }
    
    /**
     * Verificar integritat del grafo rehidratat
     * 
     * Mètode d'utilitat per debugging que verifica que:
     * - Tots els Events tenen Category vàlida
     * - Totes les instàncies són del tipus correcte
     * - No hi ha referències trencades
     * 
     * @param {Object} rehydratedState - Estat rehidratat
     * @returns {boolean} True si l'estat és íntegre
     */
    static verifyIntegrity(rehydratedState) {
        try {
            let totalEvents = 0;
            let totalCategories = 0;
            let eventsWithoutCategory = 0;
            
            if (rehydratedState.calendars) {
                Object.values(rehydratedState.calendars).forEach(calendar => {
                    // Verificar que Calendar és instància de classe
                    if (!(calendar instanceof CalendariIOC_Calendar)) {
                        console.error('[CalendariIOC_DataRehydrator] Calendar is not an instance of CalendariIOC_Calendar class');
                        return false;
                    }
                    
                    // Verificar categories
                    calendar.categories.forEach(category => {
                        if (!(category instanceof CalendariIOC_Category)) {
                            console.error('[CalendariIOC_DataRehydrator] Category is not an instance of CalendariIOC_Category class');
                            return false;
                        }
                        totalCategories++;
                    });
                    
                    // Verificar esdeveniments
                    calendar.events.forEach(event => {
                        if (!(event instanceof CalendariIOC_Event)) {
                            console.error('[CalendariIOC_DataRehydrator] Event is not an instance of CalendariIOC_Event class');
                            return false;
                        }
                        
                        totalEvents++;
                        
                        if (!event.hasCategory()) {
                            eventsWithoutCategory++;
                        } else if (!(event.getCategory() instanceof CalendariIOC_Category)) {
                            console.error('[CalendariIOC_DataRehydrator] Event category is not an instance of CalendariIOC_Category class');
                            return false;
                        }
                    });
                });
            }
            
            console.log(`[CalendariIOC_DataRehydrator] Integrity check: ${totalEvents} events, ${totalCategories} categories, ${eventsWithoutCategory} events without category`);
            return true;
            
        } catch (error) {
            console.error('[CalendariIOC_DataRehydrator] Error during integrity check:', error);
            return false;
        }
    }
}

// Exportar la classe per ús global amb namespace propi
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendariIOC_DataRehydrator;
} else {
    window.CalendariModels = window.CalendariModels || {};
    window.CalendariModels.DataRehydrator = CalendariIOC_DataRehydrator;
}