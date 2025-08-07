/**
 * =================================================================
 * MONTH VIEW - RENDERITZADOR PER A VISTA MENSUAL
 * =================================================================
 * 
 * @file        MonthViewRenderer.js
 * @description Renderitzador específic per la vista mensual del calendari
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

// Renderitzador específic per a vista mensual
class MonthViewRenderer extends CalendarRenderer {
    constructor() {
        super();
        this.viewType = 'month';
    }
    
    // === RENDERITZACIÓ PRINCIPAL ===
    render(calendar, currentDate, outputFormat = 'DOM') {
        const year = currentDate.getUTCFullYear();
        const month = currentDate.getUTCMonth();
        
        // Calcular dies del mes
        const firstDayOfMonth = dateHelper.createUTC(year, month, 1);
        const lastDayOfMonth = dateHelper.createUTC(year, month + 1, 0);
        const startDayOfWeek = firstDayOfMonth.getUTCDay() === 0 ? 6 : firstDayOfMonth.getUTCDay() - 1;
        
        const monthData = {
            year: year,
            month: month,
            monthName: dateHelper.getMonthName(currentDate),
            days: []
        };
        
        // Dies del mes anterior (usa mètode del pare)
        const prevDays = this.completePeriodStartDays(firstDayOfMonth, startDayOfWeek, calendar);
        monthData.days.push(...prevDays);
        
        // Dies del mes actual
        for (let i = 1; i <= lastDayOfMonth.getUTCDate(); i++) {
            const date = dateHelper.createUTC(year, month, i);
            monthData.days.push(this.generateDayData(date, calendar, false));
        }
        
        // Dies del mes següent per completar la graella
        const totalCells = startDayOfWeek + lastDayOfMonth.getUTCDate();
        const nextMonthCells = (7 - (totalCells % 7)) % 7;
        if (nextMonthCells > 0) {
            const lastDayOfMonthDate = dateHelper.createUTC(year, month, lastDayOfMonth.getUTCDate());
            const lastDayOfWeek = lastDayOfMonthDate.getUTCDay() === 0 ? 6 : lastDayOfMonthDate.getUTCDay() - 1;
            const nextDays = this.completePeriodEndDays(lastDayOfMonthDate, lastDayOfWeek, calendar);
            monthData.days.push(...nextDays.slice(0, nextMonthCells));
        }
        
        // Generar sortida segons format
        if (outputFormat === 'HTML') {
            return this.generateHTMLOutput(monthData, calendar);
        } else {
            return this.generateDOMOutput(monthData, calendar);
        }
    }
    
    // === GENERACIÓ DE SORTIDA DOM ===
    generateDOMOutput(monthData, calendar) {
        return this.generateCalendarGridDOM(monthData.days, calendar);
    }
    
    // === GENERACIÓ DE SORTIDA HTML ===
    generateHTMLOutput(monthData, calendar) {
        return `
            <div class="month-section">
                <div class="month-header">${monthData.monthName}</div>
                ${this.generateCalendarGridHTML(monthData.days, calendar)}
            </div>
        `;
    }
}

// === INSTÀNCIA GLOBAL ===

// Renderitzador principal per a vista mensual
const monthRenderer = new MonthViewRenderer();
