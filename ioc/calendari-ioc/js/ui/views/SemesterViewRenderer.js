/**
 * =================================================================
 * SEMESTER VIEW - RENDERITZADOR PER A VISTA SEMESTRAL
 * =================================================================
 *
 * @file        SemesterViewRenderer.js
 * @description Renderitzador específic per a vista semestral
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

// Renderitzador específic per a vista semestral
class SemesterViewRenderer extends CalendarRenderer {
    constructor() {
        super();
        this.viewType = 'semester';
    }
    
    // === RENDERITZACIÓ PRINCIPAL ===
    render(calendar, currentDate, outputFormat = 'DOM') {
        if (!calendar) {
            return '<div class="no-calendar">No hi ha calendari seleccionat</div>';
        }
        
        // Generar dades de tot el semestre
        const semesterData = this.generateSemesterData(calendar);
        
        // Generar sortida segons format
        if (outputFormat === 'HTML') {
            return this.generateHTMLOutput(semesterData, calendar);
        } else {
            return this.generateDOMOutput(semesterData, calendar);
        }
    }
    
    // === GENERACIÓ DE DADES DEL SEMESTRE ===
    generateSemesterData(calendar) {
        const startDate = dateHelper.parseUTC(calendar.startDate);
        const endDate = dateHelper.parseUTC(calendar.endDate);
        
        const semesterData = {
            startDate: startDate,
            endDate: endDate,
            semesterName: this.generateSemesterName(calendar),
            days: []
        };
        
        // Calcular dia d'inici de la primera setmana
        const firstDay = new Date(startDate);
        const startDayOfWeek = firstDay.getUTCDay() === 0 ? 6 : firstDay.getUTCDay() - 1;
        
        // Afegir dies anteriors per completar la primera setmana (usa mètode del pare)
        const prevDays = this.completePeriodStartDays(firstDay, startDayOfWeek, calendar);
        semesterData.days.push(...prevDays);
        
        // Afegir tots els dies del semestre
        let currentDate = new Date(startDate);
        let monthIndex = 0;
        let currentMonth = currentDate.getUTCMonth();
        
        while (currentDate <= endDate) {
            const dayData = this.generateDayData(currentDate, calendar, false);
            
            // Detectar canvi de mes per alternar colors
            if (currentDate.getUTCMonth() !== currentMonth) {
                monthIndex++;
                currentMonth = currentDate.getUTCMonth();
            }
            
            // Afegir classe de mes alternatiu
            dayData.monthAlternate = monthIndex % 2;
            
            semesterData.days.push(dayData);
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        
        // Afegir dies posteriors per completar l'última setmana (usa mètode del pare)
        const lastDay = new Date(endDate);
        const endDayOfWeek = lastDay.getUTCDay() === 0 ? 6 : lastDay.getUTCDay() - 1;
        const nextDays = this.completePeriodEndDays(lastDay, endDayOfWeek, calendar);
        semesterData.days.push(...nextDays);
        
        return semesterData;
    }
    
    
    // === GENERACIÓ DE SORTIDA DOM ===
    generateDOMOutput(semesterData, calendar) {
        return this.generateCalendarGridDOM(semesterData.days, calendar);
    }
    
    // === GENERACIÓ DE SORTIDA HTML ===
    generateHTMLOutput(semesterData, calendar) {
        return `
            <div class="semester-section">
                <div class="semester-header">
                    <h2>${semesterData.semesterName}</h2>
                    <div class="semester-period">${super.formatDateRange(semesterData.startDate, semesterData.endDate)}</div>
                </div>
                ${this.generateCalendarGridHTML(semesterData.days, calendar)}
            </div>
        `;
    }
    
    // === UTILITATS ===
    
    // Generar nom del semestre (ara usa mètode del pare)
    generateSemesterName(calendar) {
        return this.generatePeriodName(calendar, 'semester');
    }
    
    
    // Obtenir primer dia del semestre
    getSemesterStart(calendar) {
        return dateHelper.parseUTC(calendar.startDate);
    }
    
    // Obtenir últim dia del semestre
    getSemesterEnd(calendar) {
        return dateHelper.parseUTC(calendar.endDate);
    }
}

// === INSTÀNCIA GLOBAL ===

// Renderitzador principal per a vista semestral
const semesterRenderer = new SemesterViewRenderer();