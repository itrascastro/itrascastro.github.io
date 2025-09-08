/**
 * =================================================================
 * DATE VALIDATION SERVICE - SERVEI CENTRALITZAT PER VALIDACIÓ DE DATES
 * =================================================================
 * 
 * @file        DateValidationService.js
 * @description Servei per validació de dates dins del rang del calendari acadèmic
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
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

// Servei per centralitzar tota la lògica de validació de dates
class DateValidationService {
    
    // === VALIDACIONS BÀSIQUES ===
    
    // Verificar si una data està dins del rang del calendari
    isDateInCalendarRange(dateStr, calendar) {
        if (!dateStr || !calendar) return false;
        
        return dateStr >= calendar.startDate && dateStr <= calendar.endDate;
    }
    
    // Verificar si una data és vàlida per esdeveniments (professors - qualsevol dia)
    isValidEventDate(dateStr, calendar) {
        if (!dateStr || !calendar) return false;
        
        // Els professors poden crear/moure events a qualsevol dia dins del calendari
        return this.isDateInCalendarRange(dateStr, calendar);
    }
    
    // Verificar si una data és vàlida per replicació (només dies laborables)
    isValidReplicationDate(dateStr, calendar) {
        if (!dateStr || !calendar) return false;
        
        // Ha d'estar dins del rang del calendari
        if (!this.isDateInCalendarRange(dateStr, calendar)) {
            return false;
        }
        
        // Ha de ser un dia laborable (no cap de setmana)
        return dateHelper.isWeekday(dateStr);
    }
    
    // Verificar si una data és un dia laborable
    isWeekday(dateStr) {
        if (!dateStr) return false;
        
        return dateHelper.isWeekday(dateStr);
    }
    
    // === VALIDACIONS AMB EXCEPCIONS ===
    
    // Validar data per canvi de vista (llança excepció si no és vàlida)
    validateViewDate(dateStr, calendar) {
        if (!dateStr) {
            throw new CalendariIOCException('501', 'DateValidationService.validateViewDate');
        }
        
        if (!calendar) {
            throw new CalendariIOCException('502', 'DateValidationService.validateViewDate');
        }
        
        if (!this.isDateInCalendarRange(dateStr, calendar)) {
            throw new CalendariIOCException('503', 'DateValidationService.validateViewDate');
        }
        
        return true;
    }
    
    // Validar data per esdeveniment (llança excepció si no és vàlida)
    validateEventDate(dateStr, calendar) {
        if (!dateStr) {
            throw new CalendariIOCException('501', 'DateValidationService.validateEventDate', false);
        }
        
        if (!calendar) {
            throw new CalendariIOCException('502', 'DateValidationService.validateEventDate');
        }
        
        if (!this.isDateInCalendarRange(dateStr, calendar)) {
            throw new CalendariIOCException('504', 'DateValidationService.validateEventDate', false);
        }
        
        return true;
    }
    
    // Validar data per replicació (llança excepció si no és vàlida)
    validateReplicationDate(dateStr, calendar) {
        if (!dateStr) {
            throw new CalendariIOCException('501', 'DateValidationService.validateReplicationDate');
        }
        
        if (!calendar) {
            throw new CalendariIOCException('502', 'DateValidationService.validateReplicationDate');
        }
        
        if (!this.isDateInCalendarRange(dateStr, calendar)) {
            throw new CalendariIOCException('504', 'DateValidationService.validateReplicationDate');
        }
        
        if (calendar.type !== 'Altre' && !this.isWeekday(dateStr)) {
            throw new CalendariIOCException('505', 'DateValidationService.validateReplicationDate');
        }
        
        return true;
    }
    
    // === UTILITATS DE RANG ===
    
    // Verificar si una setmana té dies dins del calendari
    isWeekInCalendarRange(weekStart, weekEnd, calendar) {
        if (!weekStart || !weekEnd || !calendar) return false;
        
        const startStr = dateHelper.toUTCString(weekStart);
        const endStr = dateHelper.toUTCString(weekEnd);
        
        // La setmana és vàlida si té algun dia dins del rang
        return startStr <= calendar.endDate && endStr >= calendar.startDate;
    }
    
    // Verificar si un mes té dies dins del calendari
    isMonthInCalendarRange(monthDate, calendar) {
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
    validateDateWithMessage(dateStr, calendar, context = 'Data') {
        try {
            this.validateViewDate(dateStr, calendar);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    
    // === UTILITATS DE MOVIMENT D'EVENTS ===
    
    // Verificar si un esdeveniment es pot moure a una nova data
    isValidEventMove(event, newDateStr, calendar) {
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
    getDateDebugInfo(dateStr, calendar) {
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

// === INSTÀNCIA GLOBAL ===
const dateValidationService = new DateValidationService();