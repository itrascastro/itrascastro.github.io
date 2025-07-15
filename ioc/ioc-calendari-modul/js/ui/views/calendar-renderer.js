// =================================================================
// CALENDAR RENDERER - CLASSE BASE PER RENDERITZADORS DE CALENDARI
// =================================================================

// Classe base per a tots els renderitzadors de calendari
class CalendarRenderer {
    constructor() {
        this.viewType = 'base';
    }
    
    // === GENERACIÓ DE DADES DE DIA ===
    generateDayData(date, calendar, isOutOfMonth = false) {
        const dateStr = dateToUTCString(date);
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
            dayData.weekNumber = getCalendarWeekNumber(date, calendar.startDate);
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
            const truncatedTitle = truncateText(event.title, 30);
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
        const isToday = dayData.dateStr === dateToUTCString(new Date());
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
        const dayHeaders = getDayHeaders();
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
        const dayHeaders = getDayHeaders();
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

// === INICIALITZACIÓ ===

// Inicialitzar sistema de renderitzat base
function initializeCalendarRenderer() {
    console.log('[CalendarRenderer] Classe base de renderitzat inicialitzada');
}