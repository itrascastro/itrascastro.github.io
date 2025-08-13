/**
 * =================================================================
 * GLOBAL VIEW - RENDERITZADOR PER A VISTA GLOBAL (TOTS ELS MESOS)
 * =================================================================
 * 
 * @file        GlobalViewRenderer.js
 * @description Renderitzador específic per la vista global que mostra tots els mesos
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-20
 * @project     Calendari IOC
 * @repository  https://github.com/itrascastro/calendari-ioc
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * =================================================================
 */

// Renderitzador específic per a vista global
class GlobalViewRenderer extends CalendarRenderer {
    constructor() {
        super();
        this.viewType = 'global';
    }
    
    // === RENDERITZACIÓ PRINCIPAL ===
    render(calendar, outputFormat = 'DOM') {
        if (!calendar) return '<div>No hi ha calendari actiu</div>';
        
        // Calcular tots els mesos del calendari acadèmic
        const startDate = dateHelper.parseUTC(calendar.startDate);
        const endDate = dateHelper.parseUTC(calendar.endDate);
        const months = this.generateMonthsInRange(startDate, endDate);
        
        // Generar HTML per cada mes
        const monthsHTML = months.map(monthData => 
            this.generateMonthHTML(monthData, calendar, outputFormat)
        ).join('');
        
        if (outputFormat === 'HTML') {
            return this.generateHTMLOutput(monthsHTML, calendar);
        } else {
            return this.generateDOMOutput(monthsHTML, calendar);
        }
    }
    
    // === GENERACIÓ DE MESOS ===
    generateMonthsInRange(startDate, endDate) {
        const months = [];
        let currentMonth = dateHelper.createUTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1);
        const lastMonth = dateHelper.createUTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1);
        
        while (currentMonth <= lastMonth) {
            months.push({
                date: new Date(currentMonth),
                year: currentMonth.getUTCFullYear(),
                month: currentMonth.getUTCMonth(),
                monthName: dateHelper.getMonthName(currentMonth)
            });
            
            // Següent mes
            currentMonth = dateHelper.createUTC(
                currentMonth.getUTCFullYear(), 
                currentMonth.getUTCMonth() + 1, 
                1
            );
        }
        
        return months;
    }
    
    // === GENERACIÓ DE HTML DE MES ===
    generateMonthHTML(monthData, calendar, outputFormat = 'DOM') {
        // Generar dades dels dies del mes utilitzant MonthViewRenderer
        const year = monthData.date.getUTCFullYear();
        const month = monthData.date.getUTCMonth();
        
        // Calcular dies del mes (lògica similar a MonthViewRenderer)
        const firstDayOfMonth = dateHelper.createUTC(year, month, 1);
        const lastDayOfMonth = dateHelper.createUTC(year, month + 1, 0);
        const startDayOfWeek = firstDayOfMonth.getUTCDay() === 0 ? 6 : firstDayOfMonth.getUTCDay() - 1;
        
        const monthDays = [];
        
        // Dies del mes anterior
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const date = dateHelper.createUTC(year, month, -i);
            monthDays.push(this.generateDayData(date, calendar, true));
        }
        
        // Dies del mes actual
        for (let i = 1; i <= lastDayOfMonth.getUTCDate(); i++) {
            const date = dateHelper.createUTC(year, month, i);
            monthDays.push(this.generateDayData(date, calendar, false));
        }
        
        // Dies del mes següent per completar la graella
        const totalCells = startDayOfWeek + lastDayOfMonth.getUTCDate();
        const nextMonthCells = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= nextMonthCells; i++) {
            const date = dateHelper.createUTC(year, month + 1, i);
            monthDays.push(this.generateDayData(date, calendar, true));
        }
        
        // Generar HTML personalitzat amb colors de fons
        const modifiedHTML = this.generateCalendarGridWithColors(monthDays, calendar);
        
        // Capçalera clickable per anar a vista mensual
        const monthHeaderAction = outputFormat === 'DOM' ? 
            `data-action="global-month-click" data-date="${dateHelper.toUTCString(monthData.date)}"` : '';
        
        return `
            <div class="global-month">
                <div class="global-month-header" ${monthHeaderAction}>
                    ${monthData.monthName}
                </div>
                <div class="global-month-content">
                    ${modifiedHTML}
                </div>
            </div>
        `;
    }
    
    // === GENERACIÓ DE GRAELLA AMB COLORS ===
    generateCalendarGridWithColors(dayDataArray, calendar) {
        const dayHeaders = dateHelper.getDayHeadersShort(); // Usar inicials
        
        // Generar dies amb colors de fons
        const daysHTML = dayDataArray.map(dayData => {
            let backgroundColor = 'transparent';
            let textColor = 'inherit';
            
            // Calcular color dominant si hi ha esdeveniments
            if (dayData.events.length > 0) {
                backgroundColor = this.calculateDominantColor(dayData.events, calendar);
                textColor = this.getContrastColor(backgroundColor);
            }
            
            // Generar cel·la amb color de fons
            return this.generateDayCellWithBackground(dayData, calendar, backgroundColor, textColor);
        }).join('');
        
        return `
            <div class="calendar-grid">
                ${dayHeaders.map(day => `<div class="day-header">${day}</div>`).join('')}
                ${daysHTML}
            </div>
        `;
    }
    
    // === GENERACIÓ DE CEL·LA AMB COLOR DE FONS ===
    generateDayCellWithBackground(dayData, calendar, backgroundColor, textColor) {
        const isToday = dayData.dateStr === dateHelper.toUTCString(new Date());
        const classes = ['day-cell'];
        
        if (dayData.isOutOfMonth) classes.push('out-of-month');
        if (isToday) classes.push('today');
        
        // En vista global no mostrem números de setmana
        
        // Verificar si el dia està dins del rang vàlid del calendari
        const isDayInRange = this.isDayInCalendarRange(dayData, calendar);
        
        // Configurar acció de click per canviar a vista dia (només si està dins del rang)
        const dayClickAction = isDayInRange ? `data-action="day-click"` : '';
        
        // Aplicar colors de fons i text
        const backgroundStyle = backgroundColor !== 'transparent' ? 
            `style="background-color: ${backgroundColor};"` : '';
        const textStyle = backgroundColor !== 'transparent' ? 
            `style="color: ${textColor} !important;"` : '';
        
        return `
            <div class="${classes.join(' ')}" data-date="${dayData.dateStr}" ${dayClickAction} ${backgroundStyle}>
                <span class="day-number" ${textStyle}>${dayData.dayNumber}</span>
            </div>
        `;
    }
    
    // === LÒGICA DE COLOR DOMINANT ===
    calculateDominantColor(events, calendar) {
        if (!events.length) return 'transparent';
        
        // FASE 3: Usar mètodes directes de les instàncies Event
        
        // PRIORITAT 1: Esdeveniments de sistema sempre prevaleixen
        const systemEvents = events.filter(event => event.isSystemEvent);
        if (systemEvents.length > 0) {
            // Retornar color del primer esdeveniment de sistema
            return systemEvents[0].getCategoryColor();
        }
        
        // PRIORITAT 2: Si només hi ha un esdeveniment (i no és de sistema)
        if (events.length === 1) {
            return events[0].getCategoryColor();
        }
        
        // PRIORITAT 3: Lògica de majoria per esdeveniments d'usuari
        const categoryCount = events.reduce((acc, event) => {
            const categoryId = event.getCategory()?.id;
            if (categoryId) {
                acc[categoryId] = (acc[categoryId] || 0) + 1;
            }
            return acc;
        }, {});
        
        // Trobar categoria amb més esdeveniments
        const maxCount = Math.max(...Object.values(categoryCount));
        const dominantCategories = Object.keys(categoryCount).filter(
            categoryId => categoryCount[categoryId] === maxCount
        );
        
        // En cas d'empat, retornar color de l'esdeveniment amb categoria dominant
        const dominantCategoryId = dominantCategories.sort()[0];
        const dominantEvent = events.find(event => event.getCategory()?.id === dominantCategoryId);
        
        return dominantEvent ? dominantEvent.getCategoryColor() : '#888';
    }
    
    // === UTILITATS DE COLOR ===
    getContrastColor(backgroundColor) {
        if (!backgroundColor || backgroundColor === 'transparent') {
            return 'var(--main-text-color)';
        }
        
        return this.isColorDark(backgroundColor) ? '#ffffff' : '#000000';
    }
    
    // Determinar si un color és fosc o clar basant-se en la seva lluminositat
    isColorDark(color) {
        // Convertir color hex a RGB
        let r, g, b;
        
        if (color.charAt(0) === '#') {
            const hex = color.substring(1);
            if (hex.length === 3) {
                r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
                g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
                b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
            } else if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }
        } else if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            r = parseInt(rgb[0]);
            g = parseInt(rgb[1]);
            b = parseInt(rgb[2]);
        } else {
            // Per a noms de colors coneguts o altres formats, usar heurística
            const darkColorNames = ['black', 'darkred', 'darkgreen', 'darkblue', 'brown', 'maroon'];
            return darkColorNames.some(darkName => color.toLowerCase().includes(darkName));
        }
        
        // Calcular lluminositat relativa segons estàndard W3C
        // Formula: (0.299 * R + 0.587 * G + 0.114 * B) / 255
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Si la lluminositat és menor que 0.5, es considera fosc
        return luminance < 0.5;
    }
    
    // === GENERACIÓ DE SORTIDA ===
    generateDOMOutput(monthsHTML, calendar) {
        return `
            <div class="global-view-container">
                ${monthsHTML}
            </div>
        `;
    }
    
    generateHTMLOutput(monthsHTML) {
        return `
            <div class="global-view-export">
                <div class="global-months-grid">
                    ${monthsHTML}
                </div>
            </div>
        `;
    }
}

// === INSTÀNCIA GLOBAL ===

// Renderitzador principal per a vista global
const globalRenderer = new GlobalViewRenderer();