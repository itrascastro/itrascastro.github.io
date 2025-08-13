/**
 * =================================================================
 * WEEK VIEW - RENDERITZADOR PER A VISTA SETMANAL
 * =================================================================
 *
 * @file        WeekViewRenderer.js
 * @description Renderitzador específic per la vista setmanal del calendari
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

// Renderitzador específic per a vista setmanal
class WeekViewRenderer extends CalendarRenderer {
    constructor() {
        super();
        this.viewType = 'week';
    }
    
    // === RENDERITZACIÓ PRINCIPAL ===
    render(calendar, currentDate, outputFormat = 'DOM') {
        // Calcular inici i final de la setmana
        const weekStart = super.getWeekStart(currentDate);
        const weekEnd = super.getWeekEnd(weekStart);
        
        // Generar dades de la setmana
        const weekData = this.generateWeekData(weekStart, weekEnd, calendar);
        
        // Generar sortida segons format
        if (outputFormat === 'HTML') {
            return this.generateHTMLOutput(weekData, calendar);
        } else {
            return this.generateDOMOutput(weekData, calendar);
        }
    }
    
    // === CÀLCULS DE SETMANA (ara usa mètodes del pare) ===
    
    // Generar dades de la setmana
    generateWeekData(weekStart, weekEnd, calendar) {
        const weekData = {
            weekStart: weekStart,
            weekEnd: weekEnd,
            weekNumber: null,
            days: []
        };
        
        // Calcular número de setmana si tenim calendari
        if (calendar) {
            weekData.weekNumber = dateHelper.getCalendarWeekNumber(weekStart, calendar.startDate);
        }
        
        // Generar dades per cada dia de la setmana
        let currentDate = new Date(weekStart);
        for (let i = 0; i < 7; i++) {
            const dayData = this.generateDayData(currentDate, calendar, false);
            weekData.days.push(dayData);
            
            // Avançar al següent dia
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        
        return weekData;
    }
    
    // === GENERACIÓ DE SORTIDA DOM ===
    generateDOMOutput(weekData, calendar) {
        return this.generateCalendarGridDOM(weekData.days, calendar);
    }
    
    // === GENERACIÓ DE SORTIDA HTML ===
    // Nota: La vista setmanal no s'exporta, només la vista mensual
    generateHTMLOutput(weekData, calendar) {
        return '<!-- Vista setmanal no disponible per exportació -->';
    }
    
    // === GENERACIÓ D'ELEMENTS ESPECÍFICS ===
    
    // Generar títol de la setmana
    generateWeekTitle(weekData) {
        const startDay = weekData.weekStart.getUTCDate();
        const endDay = weekData.weekEnd.getUTCDate();
        
        // Si la setmana només està en un mes
        if (weekData.weekStart.getUTCMonth() === weekData.weekEnd.getUTCMonth()) {
            const monthYear = weekData.weekStart.toLocaleDateString('ca-ES', { 
                month: 'long', 
                year: 'numeric',
                timeZone: 'UTC'
            });
            return `${startDay} - ${endDay} de ${monthYear}`;
        } else {
            // Si la setmana travessa dos mesos
            const startMonthName = weekData.weekStart.toLocaleDateString('ca-ES', { 
                month: 'long',
                timeZone: 'UTC'
            });
            const endMonthName = weekData.weekEnd.toLocaleDateString('ca-ES', { 
                month: 'long', 
                year: 'numeric',
                timeZone: 'UTC'
            });
            return `${startDay} de ${startMonthName} - ${endDay} de ${endMonthName}`;
        }
    }
}

// === INSTÀNCIA GLOBAL ===

// Renderitzador principal per a vista setmanal
const weekRenderer = new WeekViewRenderer();