/**
 * =================================================================
 * DATE VALIDATION SERVICE - SERVEI CENTRALITZAT PER VALIDACIÓ DE DATES
 * =================================================================
 * 
 * @file        date-validation-service.js
 * @description Servei per validació de dates dins del rang del calendari acadèmic
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

// Servei per centralitzar tota la lògica de validació de dates
class DateValidationService {
    
    // === VALIDACIONS BÀSIQUES ===
    
    // Verificar si una data està dins del rang del calendari
    static isDateInCalendarRange(dateStr, calendar) {
        if (!dateStr || !calendar) return false;
        
        return dateStr >= calendar.startDate && dateStr <= calendar.endDate;
    }
    
    // Verificar si una data és vàlida per esdeveniments (professors - qualsevol dia)
    static isValidEventDate(dateStr, calendar) {
        if (!dateStr || !calendar) return false;
        
        // Els professors poden crear/moure events a qualsevol dia dins del calendari
        return this.isDateInCalendarRange(dateStr, calendar);
    }
    
    // Verificar si una data és vàlida per replicació (només dies laborables)
    static isValidReplicationDate(dateStr, calendar) {
        if (!dateStr || !calendar) return false;
        
        // Ha d'estar dins del rang del calendari
        if (!this.isDateInCalendarRange(dateStr, calendar)) {
            return false;
        }
        
        // Ha de ser un dia laborable (no cap de setmana)
        return dateHelper.isWeekday(dateStr);
    }
    
    // Verificar si una data és un dia laborable
    static isWeekday(dateStr) {
        if (!dateStr) return false;
        
        return dateHelper.isWeekday(dateStr);
    }
    
    // === VALIDACIONS AMB EXCEPCIONS ===
    
    // Validar data per canvi de vista (llança excepció si no és vàlida)
    static validateViewDate(dateStr, calendar) {
        if (!dateStr) {
            throw new Error('Data no vàlida');
        }
        
        if (!calendar) {
            throw new Error('No hi ha calendari actiu');
        }
        
        if (!this.isDateInCalendarRange(dateStr, calendar)) {
            throw new Error('Data fora del rang del calendari');
        }
        
        return true;
    }
    
    // Validar data per esdeveniment (llança excepció si no és vàlida)
    static validateEventDate(dateStr, calendar) {
        if (!dateStr) {
            throw new Error('Data no vàlida');
        }
        
        if (!calendar) {
            throw new Error('No hi ha calendari actiu');
        }
        
        if (!this.isDateInCalendarRange(dateStr, calendar)) {
            throw new Error('La data ha d\'estar dins del període del calendari');
        }
        
        return true;
    }
    
    // Validar data per replicació (llança excepció si no és vàlida)
    static validateReplicationDate(dateStr, calendar) {
        if (!dateStr) {
            throw new Error('Data no vàlida');
        }
        
        if (!calendar) {
            throw new Error('No hi ha calendari actiu');
        }
        
        if (!this.isDateInCalendarRange(dateStr, calendar)) {
            throw new Error('La data ha d\'estar dins del període del calendari');
        }
        
        if (!this.isWeekday(dateStr)) {
            throw new Error('La data ha de ser un dia laborable');
        }
        
        return true;
    }
    
    // === UTILITATS DE RANG ===
    
    // Verificar si una setmana té dies dins del calendari
    static isWeekInCalendarRange(weekStart, weekEnd, calendar) {
        if (!weekStart || !weekEnd || !calendar) return false;
        
        const startStr = dateHelper.toUTCString(weekStart);
        const endStr = dateHelper.toUTCString(weekEnd);
        
        // La setmana és vàlida si té algun dia dins del rang
        return startStr <= calendar.endDate && endStr >= calendar.startDate;
    }
    
    // Verificar si un mes té dies dins del calendari
    static isMonthInCalendarRange(monthDate, calendar) {
        if (!monthDate || !calendar) return false;
        
        const monthStart = dateHelper.createUTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1);
        const monthEnd = dateHelper.createUTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0);
        
        const startStr = dateHelper.toUTCString(monthStart);
        const endStr = dateHelper.toUTCString(monthEnd);
        
        // El mes és vàlid si té algun dia dins del rang
        return startStr <= calendar.endDate && endStr >= calendar.startDate;
    }
    
    // === VALIDACIONS AMB MISSATGES ===
    
    // Validar i mostrar missatge d'error si cal
    static validateDateWithMessage(dateStr, calendar, context = 'Data') {
        try {
            this.validateViewDate(dateStr, calendar);
            return true;
        } catch (error) {
            console.warn(`[DateValidation] ${context}: ${error.message}`);
            return false;
        }
    }
    
    // Validar esdeveniment i mostrar missatge d'error si cal
    static validateEventWithMessage(dateStr, calendar) {
        try {
            this.validateEventDate(dateStr, calendar);
            return true;
        } catch (error) {
            uiHelper.showMessage(error.message, 'error');
            return false;
        }
    }
    
    // Validar replicació i mostrar missatge d'error si cal
    static validateReplicationWithMessage(dateStr, calendar) {
        try {
            this.validateReplicationDate(dateStr, calendar);
            return true;
        } catch (error) {
            uiHelper.showMessage(error.message, 'error');
            return false;
        }
    }
    
    // === UTILITATS DE MOVIMENT D'EVENTS ===
    
    // Verificar si un esdeveniment es pot moure a una nova data
    static isValidEventMove(event, newDateStr, calendar) {
        if (!event || !newDateStr || !calendar) return false;
        
        // Verificar que la nova data sigui vàlida
        if (!this.isValidEventDate(newDateStr, calendar)) {
            return false;
        }
        
        // No es pot moure a la mateixa data
        if (event.date === newDateStr) {
            return false;
        }
        
        return true;
    }
    
    // === INFORMACIÓ DE DEBUGGING ===
    
    // Obtenir informació de debug sobre una data
    static getDateDebugInfo(dateStr, calendar) {
        if (!dateStr || !calendar) return null;
        
        return {
            date: dateStr,
            inRange: this.isDateInCalendarRange(dateStr, calendar),
            isWeekday: this.isWeekday(dateStr),
            isValidEvent: this.isValidEventDate(dateStr, calendar),
            calendarStart: calendar.startDate,
            calendarEnd: calendar.endDate
        };
    }
}