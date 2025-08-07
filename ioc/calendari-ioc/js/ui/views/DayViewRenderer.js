/**
 * =================================================================
 * DAY VIEW - RENDERITZADOR PER A VISTA DIÀRIA
 * =================================================================
 * 
 * @file        DayViewRenderer.js
 * @description Renderitzador específic per la vista diària del calendari
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

// Renderitzador específic per a vista diària
class DayViewRenderer extends CalendarRenderer {
    constructor() {
        super();
        this.viewType = 'day';
    }
    
    // === RENDERITZACIÓ PRINCIPAL ===
    render(calendar, currentDate, outputFormat = 'DOM') {
        const dateStr = dateHelper.toUTCString(currentDate);
        
        // Generar dades del dia
        const dayData = this.generateDayData(currentDate, calendar, false);
        
        // Verificar si el dia està dins del rang del calendari
        const isInRange = dateValidationService.isDateInCalendarRange(dateStr, calendar);
        const isWeekday = dateValidationService.isWeekday(dateStr);
        
        // Generar sortida segons format
        if (outputFormat === 'HTML') {
            return this.generateHTMLOutput(dayData, calendar, isInRange, isWeekday);
        } else {
            return this.generateDOMOutput(dayData, calendar, isInRange, isWeekday);
        }
    }
    
    // === GENERACIÓ DE SORTIDA DOM ===
    generateDOMOutput(dayData, calendar, isInRange, isWeekday) {
        const dayName = dateHelper.getDayHeaders()[dayData.date.getUTCDay() === 0 ? 6 : dayData.date.getUTCDay() - 1];
        const monthName = dateHelper.getMonthName(dayData.date);
        
        // Generar esdeveniments
        const eventsHTML = dayData.events.length > 0 
            ? dayData.events.map(event => this.generateEventListItem(event, calendar, 'DOM')).join('')
            : '<div class="no-events">No hi ha esdeveniments programats</div>';
        
        // Botó per afegir event (només si està en rang i és dia laborable)
        const addEventBtn = (isInRange && isWeekday) 
            ? `<button class="btn btn-primary add-event-day-btn" data-action="add-event" data-date="${dayData.dateStr}">+ Afegir Esdeveniment</button>`
            : '';
        
        return `
            <div class="day-view-container">
                <div class="day-view-header">
                    <div class="day-title">
                        <h2>${dayName}, ${dayData.dayNumber} de ${monthName}</h2>
                        ${this.generateClickableWeekNumber(dayData.weekNumber, dayData.dateStr, 'badge', 'DOM')}
                    </div>
                    ${addEventBtn}
                </div>
                
                <div class="day-view-content">
                    <div class="events-list">
                        ${eventsHTML}
                    </div>
                </div>
            </div>
        `;
    }
    
    // === GENERACIÓ DE SORTIDA HTML ===
    generateHTMLOutput(dayData, calendar, isInRange, isWeekday) {
        const dayName = dateHelper.getDayHeaders()[dayData.date.getUTCDay() === 0 ? 6 : dayData.date.getUTCDay() - 1];
        const monthName = dateHelper.getMonthName(dayData.date);
        
        const eventsHTML = dayData.events.length > 0 
            ? dayData.events.map(event => this.generateEventListItem(event, calendar, 'HTML')).join('')
            : '<div class="no-events">No hi ha esdeveniments programats</div>';
        
        return `
            <div class="day-section">
                <div class="day-header">
                    <h3>${dayName}, ${dayData.dayNumber} de ${monthName}</h3>
                    ${this.generateClickableWeekNumber(dayData.weekNumber, dayData.dateStr, 'badge', 'HTML')}
                </div>
                <div class="day-events">
                    ${eventsHTML}
                </div>
            </div>
        `;
    }
    
    // === GENERACIÓ D'ESDEVENIMENTS EN LLISTA ===
    generateEventListItem(event, calendar, outputFormat = 'DOM') {
        // FASE 3: Usar mètodes directes de l'instància Event
        const color = event.getCategoryColor();
        const categoryName = event.getCategoryName();
        const isUserEvent = !event.isSystemEvent;
        
        if (outputFormat === 'HTML') {
            // Per a exportació HTML - sense interactivitat
            const systemClass = event.isSystemEvent ? ' system' : '';
            return `
                <div class="event-list-item${systemClass}">
                    <div class="event-color-bar" style="background-color: ${color};"></div>
                    <div class="event-details">
                        <div class="event-title">${event.title}</div>
                        <div class="event-category">${categoryName}</div>
                        ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                    </div>
                </div>
            `;
        } else {
            // Per a DOM - amb interactivitat
            const eventClasses = ['event-list-item', isUserEvent ? 'is-user-event' : 'is-system-event'];
            const openModalAction = isUserEvent ? `data-action="open-event-modal" data-event-id="${event.id}"` : '';
            const draggableAttr = isUserEvent ? 'draggable="true"' : '';
            
            return `
                <div class="${eventClasses.join(' ')}" ${openModalAction} ${draggableAttr}>
                    <div class="event-color-bar" style="background-color: ${color};"></div>
                    <div class="event-details">
                        <div class="event-title">${event.title}</div>
                        <div class="event-category">${categoryName}</div>
                        ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                    </div>
                    ${isUserEvent ? '<div class="event-actions">⋮</div>' : ''}
                </div>
            `;
        }
    }
}

// === INSTÀNCIA GLOBAL ===

// Renderitzador principal per a vista diària
const dayRenderer = new DayViewRenderer();