/**
 * =================================================================
 * REPLICA HELPER - UTILITATS COMUNES PER SERVEIS DE REPLICACIÓ
 * =================================================================
 * 
 * @file        ReplicaHelper.js
 * @description Utilitats pures compartides per evitar duplicació de codi idèntic
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-08-12
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
 * @license     MIT
 * 
 * Aquest fitxer conté NOMÉS funcions de utilitat pures que són 100% idèntiques
 * entre diferents serveis de replicació, evitant el risc de inconsistències
 * quan es modifiquen en el futur.
 * 
 * =================================================================
 */

// CLASSE HELPER AMB UTILITATS PURES PER REPLICACIÓ
class ReplicaHelper {
    
    /**
     * Agrupa esdeveniments per dia en un Map
     * FUNCIÓ PURA: No depèn de cap lògica de negoci específica
     * @param {Array<CalendariIOC_Event>} events - Llista d'esdeveniments
     * @returns {Map<string, Array<CalendariIOC_Event>>} Map amb data com a clau i array d'esdeveniments com a valor
     */
    groupEventsByDay(events) {
        const groups = new Map();
        events.forEach(event => {
            if (!groups.has(event.date)) {
                groups.set(event.date, []);
            }
            groups.get(event.date).push(event);
        });
        
        // PUNT ÚNIC DE CONTROL: Si en el futur es necessita ordenar per prioritat o altre criteri,
        // es fa aquí UNA VEGADA i s'aplica consistentment a tots els serveis
        // Exemple futur: groups.forEach(dayEvents => dayEvents.sort((a, b) => (b.priority || 0) - (a.priority || 0)));
        
        return groups;
    }
}

// === INSTÀNCIA GLOBAL ===
const replicaHelper = new ReplicaHelper();