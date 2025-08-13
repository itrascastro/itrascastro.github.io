/**
 * =================================================================
 * DATE HELPER - UTILITATS DE DATA PER CALENDARI IOC
 * =================================================================
 * 
 * @file        DateHelper.js
 * @description Classe d'utilitats per manipulació i formatatge de dates
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-17
 * @project     Calendari IOC
 * @repository  https://github.com/itrascastro/calendari-ioc
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * =================================================================
 */

// Classe d'utilitats de data completament independent
// Tots els mètodes mantenen consistència UTC
class DateHelper {
    
    // Crear data UTC amb any, mes i dia
    createUTC(year, month, day) {
        return new Date(Date.UTC(year, month, day));
    }
    
    // Convertir data a string UTC (YYYY-MM-DD)
    toUTCString(date) {
        return date.toISOString().split('T')[0];
    }
    
    // Parsejar string de data a objecte Date UTC
    parseUTC(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return this.createUTC(year, month - 1, day);
    }
    
    // Formatar data per mostrar a l'usuari
    formatForDisplay(date) {
        return date.toLocaleDateString('ca-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            timeZone: 'UTC'
        });
    }
    
    // Obtenir nom del mes amb any
    getMonthName(date) {
        return date.toLocaleDateString('ca-ES', { 
            month: 'long', 
            year: 'numeric',
            timeZone: 'UTC'
        });
    }
    
    // Obtenir capçaleres dels dies de la setmana
    getDayHeaders() {
        return ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];
    }
    
    // Obtenir inicials dels dies de la setmana per vista global
    getDayHeadersShort() {
        return ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    }
    
    // Verificar si una data (string) és un dia laborable
    isWeekday(dateStr) {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5;
    }
    
    // Calcular número de setmana del calendari
    getCalendarWeekNumber(date, calendarStartDateStr) {
        const calendarStartDate = this.parseUTC(calendarStartDateStr);
        const targetDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        
        // Si la fecha objetivo es anterior al inicio del calendario, no mostrar número de semana
        if (targetDate < calendarStartDate) {
            return null;
        }
        
        const getMonday = (d) => {
            const day = d.getUTCDay();
            const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setUTCDate(diff));
        };
        
        const startOfWeek1 = getMonday(new Date(calendarStartDate.getTime()));
        const targetWeekMonday = getMonday(new Date(targetDate.getTime()));
        
        startOfWeek1.setUTCHours(0, 0, 0, 0);
        targetWeekMonday.setUTCHours(0, 0, 0, 0);
        
        const diff = targetWeekMonday.getTime() - startOfWeek1.getTime();
        const diffWeeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
        
        const weekNumber = diffWeeks + 1;
        
        // Solo devolver números de semana positivos
        return weekNumber > 0 ? weekNumber : null;
    }
}

// === INSTÀNCIA GLOBAL ===
const dateHelper = new DateHelper();