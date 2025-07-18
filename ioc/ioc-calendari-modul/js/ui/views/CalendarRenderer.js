/**
 * =================================================================
 * CALENDAR RENDERER - CLASSE BASE PER RENDERITZADORS DE CALENDARI
 * =================================================================
 * 
 * @file        CalendarRenderer.js
 * @description Classe base abstracta per tots els renderitzadors de vistes del calendari
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

// Classe base per a tots els renderitzadors de calendari
class CalendarRenderer {
    constructor() {
        this.viewType = 'base';
    }
    
    // === GENERACIÓ DE DADES DE DIA ===
    generateDayData(date, calendar, isOutOfMonth = false) {
        const dateStr = dateHelper.toUTCString(date);
        const dayData = {
            date: date,
            dateStr: dateStr,
            dayNumber: date.getUTCDate(),
            isOutOfMonth: isOutOfMonth,
            isToday: false,
            weekNumber: null,
            events: []
        };
        
        // Marcar només si està dins del calendari actiu i dins del rang de dates
        if (calendar && !isOutOfMonth && DateValidationService.isDateInCalendarRange(dateStr, calendar)) {
            dayData.weekNumber = dateHelper.getCalendarWeekNumber(date, calendar.startDate);
            dayData.events = calendar.events.filter(e => e.date === dateStr);
        }
        
        return dayData;
    }
    
    // === GENERACIÓ DE HTML D'ESDEVENIMENTS ===
    generateEventHTML(event, calendar, outputFormat = 'DOM') {
        // Cercar categoria utilitzant el servei centralitzat
        const color = CategoryService.getCategoryColor(event.categoryId, calendar);
        const isUserEvent = !event.isSystemEvent;
        
        if (outputFormat === 'HTML') {
            // Per a exportació HTML - text complet, sense interactivitat
            const systemClass = event.isSystemEvent ? ' system' : '';
            return `<div class="event-item${systemClass}" style="background-color: ${color};" title="${event.title}">${event.title}</div>`;
        } else {
            // Per a DOM - text truncat per a millor UI
            const truncatedTitle = textHelper.truncateText(event.title, 30);
            const eventClasses = ['event', isUserEvent ? 'is-user-event' : 'is-system-event'];
            const openModalAction = isUserEvent ? `data-action="open-event-modal" data-event="${JSON.stringify(event).replace(/"/g, '&quot;')}"` : '';
            const draggableAttr = isUserEvent ? 'draggable="true"' : '';
            
            return `<div class="${eventClasses.join(' ')}" style="background-color: ${color};" ${openModalAction} ${draggableAttr} title="${event.title}">${truncatedTitle}</div>`;
        }
    }
    
    // === UTILITATS ===
    
    // Verificar si un dia està dins del rang vàlid del calendari
    isDayInCalendarRange(dayData, calendar) {
        return calendar && 
               !dayData.isOutOfMonth && 
               dayData.dateStr >= calendar.startDate && 
               dayData.dateStr <= calendar.endDate;
    }
    
    // Generar número de setmana clickable (reutilitzable per totes les vistes)
    generateClickableWeekNumber(weekNumber, dateStr, format = 'pill', outputFormat = 'DOM') {
        if (!weekNumber) return '';
        
        const baseAttributes = outputFormat === 'DOM' ? 
            `data-action="week-click" data-date="${dateStr}" title="Canviar a vista setmanal"` : '';
        
        switch (format) {
            case 'pill':
                // Format petit per cel·les de dies (S4)
                return `<div class="week-pill" ${baseAttributes}>S${weekNumber}</div>`;
            case 'badge':
                // Format gran per capçaleres (Setmana 4)
                return `<span class="week-info" ${baseAttributes}>Setmana ${weekNumber}</span>`;
            case 'inline':
                // Format en línia per textos
                return `<span class="week-inline" ${baseAttributes}>setmana ${weekNumber}</span>`;
            default:
                return `<span class="week-number" ${baseAttributes}>${weekNumber}</span>`;
        }
    }
    
    // === GENERACIÓ DE HTML DE CEL·LA DE DIA ===
    generateDayCellHTML(dayData, calendar, outputFormat = 'DOM') {
        const isToday = dayData.dateStr === dateHelper.toUTCString(new Date());
        const classes = ['day-cell'];
        
        if (dayData.isOutOfMonth) classes.push('out-of-month');
        if (isToday) classes.push('today');
        if (dayData.monthAlternate !== undefined) {
            classes.push(dayData.monthAlternate === 0 ? 'month-even' : 'month-odd');
        }
        
        // Esdeveniments del dia
        const eventsHTML = dayData.events.map(event => 
            this.generateEventHTML(event, calendar, outputFormat)
        ).join('');
        
        // Número de setmana per a dies dins del calendari
        const weekPillHTML = (dayData.weekNumber && !dayData.isOutOfMonth) ? 
            this.generateClickableWeekNumber(dayData.weekNumber, dayData.dateStr, 'pill', outputFormat) : '';
        
        // Verificar si el dia està dins del rang vàlid del calendari
        const isDayInRange = this.isDayInCalendarRange(dayData, calendar);
        
        // Botó d'afegir esdeveniment només per a DOM i dies dins del calendari acadèmic
        const addEventBtnHTML = (outputFormat === 'DOM' && isDayInRange) ? 
            `<button class="add-event-btn" data-action="add-event" data-date="${dayData.dateStr}" title="Afegir event">+</button>` : '';
        
        // Configurar segons el format de sortida
        if (outputFormat === 'DOM') {
            // Afegir acció de click per canviar a vista dia (només si està dins del rang)
            const dayClickAction = isDayInRange ? `data-action="day-click"` : '';
            
            return `
                <div class="${classes.join(' ')}" data-date="${dayData.dateStr}" ${dayClickAction}>
                    <span class="day-number">${dayData.dayNumber}</span>
                    ${weekPillHTML}
                    <div class="events-container">${eventsHTML}</div>
                    ${addEventBtnHTML}
                </div>
            `;
        } else {
            // Per a exportació HTML
            return `
                <div class="${classes.join(' ')}" data-date="${dayData.dateStr}">
                    <div class="day-number">${dayData.dayNumber}</div>
                    ${weekPillHTML}
                    <div>${eventsHTML}</div>
                </div>
            `;
        }
    }
    
    // === MÈTODES COMUNS PER GRAELLES DE DIES ===
    
    // Generar graella de dies per DOM (reutilitzable per month, week i semester views)
    generateCalendarGridDOM(dayDataArray, calendar) {
        const dayHeaders = dateHelper.getDayHeaders();
        const daysHTML = dayDataArray.map(dayData => 
            this.generateDayCellHTML(dayData, calendar, 'DOM')
        ).join('');
        
        return `
            <div class="calendar-grid">
                ${dayHeaders.map(day => `<div class="day-header">${day}</div>`).join('')}
                ${daysHTML}
            </div>
        `;
    }
    
    // Generar graella de dies per HTML (utilitzat principalment per vista mensual)
    generateCalendarGridHTML(dayDataArray, calendar) {
        const dayHeaders = dateHelper.getDayHeaders();
        const daysHTML = dayDataArray.map(dayData => 
            this.generateDayCellHTML(dayData, calendar, 'HTML')
        ).join('');
        
        return `
            <div class="calendar-grid">
                ${dayHeaders.map(day => `<div class="day-header">${day}</div>`).join('')}
                ${daysHTML}
            </div>
        `;
    }
    
    // === UTILITATS DE DATA ===
    
    // Formatar rang de dates (migrat des de semester-view)
    formatDateRange(startDate, endDate) {
        const startFormatted = startDate.toLocaleDateString('ca-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
        });
        
        const endFormatted = endDate.toLocaleDateString('ca-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
        });
        
        return `${startFormatted} - ${endFormatted}`;
    }
    
    // === CÀLCULS DE SETMANA (migrat des de week-view) ===
    
    // Obtenir inici de setmana (dilluns)
    getWeekStart(date) {
        const dayOfWeek = date.getUTCDay(); // 0 = diumenge, 1 = dilluns, etc.
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustar per començar en dilluns
        
        return dateHelper.createUTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() - daysToMonday
        );
    }
    
    // Obtenir final de setmana (diumenge)
    getWeekEnd(weekStart) {
        return dateHelper.createUTC(
            weekStart.getUTCFullYear(),
            weekStart.getUTCMonth(),
            weekStart.getUTCDate() + 6
        );
    }
    
    // === UTILITATS DE COMPLETAR PERÍODES ===
    
    // Completar dies anteriors per formar setmanes completes
    completePeriodStartDays(startDate, startDayOfWeek, calendar) {
        const days = [];
        for (let i = startDayOfWeek; i > 0; i--) {
            const dayDate = dateHelper.createUTC(
                startDate.getUTCFullYear(),
                startDate.getUTCMonth(),
                startDate.getUTCDate() - i
            );
            days.push(this.generateDayData(dayDate, calendar, true));
        }
        return days;
    }
    
    // Completar dies posteriors per formar setmanes completes
    completePeriodEndDays(endDate, endDayOfWeek, calendar) {
        const days = [];
        const daysToComplete = 6 - endDayOfWeek;
        for (let i = 1; i <= daysToComplete; i++) {
            const dayDate = dateHelper.createUTC(
                endDate.getUTCFullYear(),
                endDate.getUTCMonth(),
                endDate.getUTCDate() + i
            );
            days.push(this.generateDayData(dayDate, calendar, true));
        }
        return days;
    }
    
    // === GENERACIÓ DE NOMS DE PERÍODE ===
    
    // Generar nom de període segons el tipus de vista
    generatePeriodName(calendar, viewType) {
        switch (viewType) {
            case 'semester':
                return `Semestre ${calendar.code}`;
            case 'month':
                return dateHelper.getMonthName(new Date()); // Les vistes mensuals ja gestionen això
            case 'week':
                return 'Setmana'; // Les vistes setmanals ja gestionen això
            case 'day':
                return 'Dia'; // Les vistes diàries ja gestionen això
            default:
                return calendar.name || 'Calendari';
        }
    }
    
    // === MÈTODES VIRTUALS ===
    // Aquests mètodes han de ser implementats per les classes filles
    
    render(calendar, currentDate, outputFormat = 'DOM') {
        throw new Error('El mètode render() ha de ser implementat per la classe filla');
    }
    
    generateDOMOutput(data, calendar) {
        throw new Error('El mètode generateDOMOutput() ha de ser implementat per la classe filla');
    }
    
    generateHTMLOutput(data, calendar) {
        throw new Error('El mètode generateHTMLOutput() ha de ser implementat per la classe filla');
    }
}