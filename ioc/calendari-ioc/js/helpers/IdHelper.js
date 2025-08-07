/**
 * =================================================================
 * ID GENERATORS - GENERADORS D'IDENTIFICADORS ÚNICS
 * =================================================================
 * 
 * @file        IdHelper.js
 * @description Funcions per generar identificadors únics per l'aplicació
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

// Classe d'utilitats per generar identificadors únics
class IdHelper {
    
    // === GENERADORS D'IDS PER ESDEVENIMENTS ===
    
    // Generar següent ID d'esdeveniment per un calendari
    generateNextEventId(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) return null;
        calendar.lastEventId = (calendar.lastEventId || 0) + 1;
        return `${calendar.id}_E${calendar.lastEventId}`;
    }
    
    // === GENERADORS D'IDS PER CATEGORIES ===
    
    // Generar següent ID de categoria per un calendari
    generateNextCategoryId(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) return null;
        calendar.lastCategoryId = (calendar.lastCategoryId || 0) + 1;
        return `${calendar.id}_C${calendar.lastCategoryId}`;
    }

}

// === INSTÀNCIA GLOBAL ===
const idHelper = new IdHelper();