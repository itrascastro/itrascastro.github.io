/**
 * =================================================================
 * COMPACT VIEW - RENDERITZADOR PER A VISTA ULTRA COMPACTA
 * =================================================================
 * 
 * @file        CompactViewRenderer.js
 * @description Renderitzador específic per la vista ultra compacta del calendari
 *              amb barres verticals per mesos i setmanes
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
 * CARACTERÍSTIQUES ESPECÍFIQUES:
 * - Layout ultra compacte amb barres verticals laterals
 * - Noms de mesos en barra esquerra (text vertical)
 * - Números de setmana en barra dreta (vertical)
 * - Números de dia externs a les cel·les
 * - Maximitza aprofitament d'espai horitzontal
 * 
 * =================================================================
 */

class CompactViewRenderer extends CalendarRenderer {
    constructor() {
        super();
        this.viewType = 'compact';
    }
    
    // === RENDERITZACIÓ PRINCIPAL ===
    render(calendar, currentDate, outputFormat = 'DOM') {
        if (!calendar) return '';
        
        const calendarStart = dateHelper.parseUTC(calendar.startDate);
        const calendarEnd = dateHelper.parseUTC(calendar.endDate);
        
        // Generar dades de tots els mesos del calendari
        const compactData = this.generateCompactData(calendarStart, calendarEnd, calendar);
        
        // Generar sortida segons format
        if (outputFormat === 'HTML') {
            return this.generateHTMLOutput(compactData, calendar);
        } else {
            return this.generateDOMOutput(compactData, calendar);
        }
    }
    
    // === GENERACIÓ DE DADES COMPACTES ===
    generateCompactData(startDate, endDate, calendar) {
        const data = {
            months: [],
            allDays: [],
            weekNumbers: new Set(),
            totalWeeks: 0
        };
        
        // Iterar per tots els mesos del període
        let currentDate = dateHelper.createUTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1);
        const endMonth = dateHelper.createUTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1);
        
        while (currentDate <= endMonth) {
            const monthData = this.generateMonthDataForCompact(currentDate, calendar, startDate, endDate);
            if (monthData.days.length > 0) {
                data.months.push(monthData);
                data.allDays.push(...monthData.days);
                
                // Recopilar números de setmana
                monthData.days.forEach(day => {
                    if (day.weekNumber && !day.isOutOfMonth) {
                        data.weekNumbers.add(day.weekNumber);
                    }
                });
            }
            
            // Següent mes
            currentDate = dateHelper.createUTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 1);
        }
        
        // Convertir Set a array ordenat
        data.weekNumbers = Array.from(data.weekNumbers).sort((a, b) => a - b);
        
        // Calcular setmanes per mes i total
        this.calculateWeeksPerMonth(data);
        
        return data;
    }
    
    // Determinar a quin mes pertany una setmana basant-se en el nombre de dies
    assignWeekToMonth(week) {
        const monthDayCounts = {};
        
        // Comptar dies de cada mes en aquesta setmana
        week.forEach(day => {
            if (day && !day.isOutOfMonth) {
                const monthKey = `${day.date.getUTCFullYear()}-${day.date.getUTCMonth()}`;
                monthDayCounts[monthKey] = (monthDayCounts[monthKey] || 0) + 1;
            }
        });
        
        // Debug: mostrar dies de la setmana
        const weekDays = week.filter(d => d).map(d => d.dayNumber).join('-');
        console.log(`Setmana [${weekDays}]:`, monthDayCounts);
        
        // Trobar el mes amb més dies
        let maxCount = 0;
        let assignedMonth = null;
        
        for (const [monthKey, count] of Object.entries(monthDayCounts)) {
            if (count > maxCount) {
                maxCount = count;
                const [year, month] = monthKey.split('-').map(Number);
                assignedMonth = { year, month };
            }
        }
        
        if (assignedMonth) {
            const monthName = new Date(assignedMonth.year, assignedMonth.month).toLocaleDateString('ca-ES', {month: 'long'});
            console.log(`  -> Assignada a: ${monthName} (${maxCount} dies)`);
        }
        
        return assignedMonth;
    }
    
    // Calcular quantes setmanes ocupa cada mes i les seves posicions exactes
    calculateWeeksPerMonth(data) {
        const weekRows = this.organizeByWeeks(data.allDays);
        data.totalWeeks = weekRows.length;
        
        // Primer, determinar a quin mes pertany cada setmana
        const weekAssignments = weekRows.map(week => this.assignWeekToMonth(week));
        
        // Inicialitzar tots els mesos
        data.months.forEach(month => {
            month.weekCount = 0;
            month.startRowIndex = -1;
            month.endRowIndex = -1;
            month.assignedWeeks = [];
        });
        
        // Assignar setmanes als mesos basant-se en qui té més dies
        console.log('=== ASSIGNACIONS FINALS ===');
        weekAssignments.forEach((assignedMonth, weekIndex) => {
            if (assignedMonth) {
                // Trobar el mes corresponent en data.months
                const month = data.months.find(m => 
                    m.year === assignedMonth.year && m.month === assignedMonth.month
                );
                
                if (month) {
                    month.assignedWeeks.push(weekIndex);
                    if (month.startRowIndex === -1) {
                        month.startRowIndex = weekIndex; // Primera fila assignada
                    }
                    month.endRowIndex = weekIndex; // Última fila assignada
                    month.weekCount++;
                    
                    const monthName = new Date(month.year, month.month).toLocaleDateString('ca-ES', {month: 'long'});
                    console.log(`Setmana ${weekIndex} -> ${monthName} (startRow: ${month.startRowIndex}, count: ${month.weekCount})`);
                }
            }
        });
        
        // Limpiar assignedWeeks temporal
        data.months.forEach(month => {
            delete month.assignedWeeks;
        });
    }
    
    // Generar dades d'un mes per vista compacta
    generateMonthDataForCompact(monthStart, calendar, calendarStart, calendarEnd) {
        const year = monthStart.getUTCFullYear();
        const month = monthStart.getUTCMonth();
        const lastDayOfMonth = dateHelper.createUTC(year, month + 1, 0);
        
        const monthData = {
            year: year,
            month: month,
            monthName: dateHelper.getMonthName(monthStart),
            days: [],
            firstWeek: null,
            lastWeek: null
        };
        
        // Generar només dies del mes que estan dins del rang del calendari
        for (let day = 1; day <= lastDayOfMonth.getUTCDate(); day++) {
            const dayDate = dateHelper.createUTC(year, month, day);
            
            // Només incloure dies dins del rang del calendari
            if (dayDate >= calendarStart && dayDate <= calendarEnd) {
                const dayData = this.generateDayData(dayDate, calendar, false);
                monthData.days.push(dayData);
                
                // Tracking de setmanes del mes
                if (dayData.weekNumber) {
                    if (!monthData.firstWeek) monthData.firstWeek = dayData.weekNumber;
                    monthData.lastWeek = dayData.weekNumber;
                }
            }
        }
        
        return monthData;
    }
    
    // === GENERACIÓ DE SORTIDA DOM ===
    generateDOMOutput(compactData, calendar) {
        const headersHTML = this.generateIntegratedHeaders();
        // Usar grid unificat: la cel·la de mes s'integra com a primera columna
        // i fa span del nombre de setmanes corresponent. Això garanteix l'alineació
        // perfecta amb les files independentment de l'alçada variable de cada setmana.
        const calendarGridHTML = this.generateUnifiedGrid(compactData.allDays, calendar, compactData.months);
        
        return `
            <div class="compact-view-container">
                <div class="compact-calendar-wrapper">
                    ${headersHTML}
                    ${calendarGridHTML}
                </div>
            </div>
        `;
    }
    
    // === GENERACIÓ DE SORTIDA HTML ===
    generateHTMLOutput(compactData, calendar) {
        // Per exportació HTML - versió simplificada
        const calendarGridHTML = this.generateCompactGridHTML(compactData.allDays, calendar);
        
        return `
            <div class="compact-view-export">
                <div class="compact-months-list">
                    ${compactData.months.map(month => `<div class="month-label">${month.monthName}</div>`).join('')}
                </div>
                ${this.generateCompactHeaders()}
                ${calendarGridHTML}
                <div class="compact-weeks-list">
                    ${compactData.weekNumbers.map(week => `<div class="week-label">S${week}</div>`).join('')}
                </div>
            </div>
        `;
    }
    
    // === COMPONENTS ESPECÍFICS ===
    
    // Generar grid unificat sense headers (els headers es generen fora)
    // La primera columna és el mes; cada mes ocupa tantes files com setmanes tingui
    generateUnifiedGrid(allDays, calendar, months) {
        const weekRows = this.organizeByWeeks(allDays);
        const allElements = [];
        let currentGridRow = 1; // sense fila de headers dins del grid
        let currentMonthIndex = 0;

        weekRows.forEach((week, rowIndex) => {
            // Inserir la cel·la de mes quan comença el mes en aquesta fila
            while (
                currentMonthIndex < months.length &&
                months[currentMonthIndex].startRowIndex === rowIndex
            ) {
                const month = months[currentMonthIndex];
                const monthOnlyName = this.getMonthOnlyName(month.monthName);
                allElements.push(`
                    <div class="compact-month-cell"
                         style="grid-row: ${currentGridRow} / span ${month.weekCount};"
                         data-action="global-month-click"
                         data-date="${dateHelper.toUTCString(dateHelper.createUTC(month.year, month.month, 1))}"
                         title="Anar a ${month.monthName}">
                        ${monthOnlyName}
                    </div>
                `);
                currentMonthIndex++;
            }

            // CEL·LES DE DIA (número + cel·la) per a la setmana
            week.forEach(dayData => {
                if (!dayData) {
                    allElements.push(`<div class="compact-day-number empty"></div>`);
                    allElements.push(`<div class="compact-day-cell empty"></div>`);
                } else {
                    allElements.push(`<div class="compact-day-number">${dayData.dayNumber}</div>`);
                    const cellHTML = this.generateCompactDayCellWithoutNumber(dayData, calendar, 'DOM');
                    allElements.push(cellHTML);
                }
            });

            // NÚMERO DE SETMANA
            const firstDayOfWeek = week.find(day => day !== null);
            const weekNumber = firstDayOfWeek ? firstDayOfWeek.weekNumber : '';
            const weekNumberHTML = weekNumber
                ? `<div class="compact-week-number">S${weekNumber}</div>`
                : '<div class="compact-week-number empty"></div>';
            allElements.push(weekNumberHTML);

            currentGridRow++;
        });

        return `
            <div class="compact-unified-grid">
                ${allElements.join('')}
            </div>
        `;
    }
    
    // Generar barra de mesos vertical esquerra amb línies divisores
    generateMonthsBar(months) {
        const monthsHTML = months.map((month, index) => {
            // Extreure només el nom del mes sense any
            const monthOnlyName = this.getMonthOnlyName(month.monthName);
            // Aplicar height dinàmic basat en el nombre de setmanes
            const flexBasis = month.weekCount || 1;
            
            // Afegir border-top al primer mes i border-bottom al darrer
            const isFirst = index === 0;
            const isLast = index === months.length - 1;
            const borderStyle = `
                ${isFirst ? 'border-top: 2px solid var(--border-color);' : ''}
                ${isLast ? 'border-bottom: 2px solid var(--border-color);' : ''}
            `;
            
            return `
                <div class="compact-month-label" 
                     data-action="global-month-click" 
                     data-date="${dateHelper.toUTCString(dateHelper.createUTC(month.year, month.month, 1))}"
                     title="Anar a ${month.monthName}"
                     style="flex: ${flexBasis} 0 auto; ${borderStyle}">
                    <span class="month-text">${monthOnlyName}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="compact-months-bar">
                ${monthsHTML}
            </div>
        `;
    }
    
    // Generar grid amb posicionament absolut per mesos
    generateIntegratedGridWithMonths(allDays, calendar, months) {
        const weekRows = this.organizeByWeeks(allDays);
        
        // Generar files del calendari sense mesos
        const rowsHTML = weekRows.map((week, rowIndex) => {
            // Generar cel·les de dies
            const weekHTML = week.map(dayData => {
                if (!dayData) {
                    return `
                        <div class="compact-day-number empty"></div>
                        <div class="compact-day-cell empty"></div>
                    `;
                }
                const cellHTML = this.generateCompactDayCellWithoutNumber(dayData, calendar, 'DOM');
                return `
                    <div class="compact-day-number">${dayData.dayNumber}</div>
                    ${cellHTML}
                `;
            }).join('');
            
            // Número de setmana
            const firstDayOfWeek = week.find(day => day !== null);
            const weekNumber = firstDayOfWeek ? firstDayOfWeek.weekNumber : '';
            const weekNumberHTML = weekNumber ? `<div class="compact-week-number">S${weekNumber}</div>` : '<div class="compact-week-number empty"></div>';
            
            return `
                <div class="compact-calendar-row" data-row="${rowIndex}">
                    ${weekHTML}
                    ${weekNumberHTML}
                </div>
            `;
        }).join('');
        
        // Generar overlay de mesos amb posicionament absolut
        const monthsOverlayHTML = this.generateMonthsOverlay(months);
        
        return `
            <div class="compact-calendar-grid-container">
                <div class="compact-months-column"></div>
                <div class="compact-calendar-grid">
                    ${rowsHTML}
                </div>
                ${monthsOverlayHTML}
            </div>
        `;
    }
    
    // Generar grid integrat amb números de setmana (mètode original mantingut per compatibilitat)
    generateIntegratedGrid(allDays, calendar, weekNumbers) {
        const weekRows = this.organizeByWeeks(allDays);
        
        const rowsHTML = weekRows.map((week, weekIndex) => {
            // Generar cel·les de dies per aquesta fila
            const weekHTML = week.map(dayData => {
                if (!dayData) {
                    return `
                        <div class="compact-day-number empty"></div>
                        <div class="compact-day-cell empty"></div>
                    `;
                }
                const cellHTML = this.generateCompactDayCellWithoutNumber(dayData, calendar, 'DOM');
                return `
                    <div class="compact-day-number">${dayData.dayNumber}</div>
                    ${cellHTML}
                `;
            }).join('');
            
            // Afegir número de setmana al final de la fila - usar el número real del primer dia
            const firstDayOfWeek = week.find(day => day !== null);
            const weekNumber = firstDayOfWeek ? firstDayOfWeek.weekNumber : '';
            const weekNumberHTML = weekNumber ? `<div class="compact-week-number">S${weekNumber}</div>` : '<div class="compact-week-number empty"></div>';
            
            return `<div class="compact-integrated-row">${weekHTML}${weekNumberHTML}</div>`;
        }).join('');
        
        return `
            <div class="compact-integrated-grid">
                ${rowsHTML}
            </div>
        `;
    }
    
    // Generar barra de setmanes alineada amb files
    generateWeeksBar(weekNumbers) {
        const weeksHTML = weekNumbers.map(weekNum => `
            <div class="compact-week-label" 
                 title="Setmana ${weekNum}">
                S${weekNum}
            </div>
        `).join('');
        
        return `
            <div class="compact-weeks-bar">
                <div class="compact-weeks-header-spacer"></div>
                ${weeksHTML}
            </div>
        `;
    }
    
    // Generar headers compactes
    generateCompactHeaders() {
        const dayHeaders = dateHelper.getDayHeaders();
        const headersHTML = dayHeaders.map(day => 
            `<div class="compact-day-header">${day}</div>`
        ).join('');
        
        return `
            <div class="compact-headers-row">
                ${headersHTML}
            </div>
        `;
    }
    
    // Generar overlay de mesos amb posicionament absolut i text horitzontal
    generateMonthsOverlay(months) {
        const headerHeight = 0;  // Sense offset de headers
        const rowHeight = 13;    // Valor original que funcionava millor
        
        const monthsHTML = months.map(month => {
            const monthOnlyName = this.getMonthOnlyName(month.monthName);
            
            // Debug logging per tots els mesos
            console.log(`${monthOnlyName}: startRowIndex=${month.startRowIndex}, weekCount=${month.weekCount}`);
            
            const topPosition = month.startRowIndex * rowHeight;
            const height = month.weekCount * rowHeight - 1; // -1 per evitar solapament
            
            return `
                <div class="compact-month-overlay-label" 
                     data-action="global-month-click" 
                     data-date="${dateHelper.toUTCString(dateHelper.createUTC(month.year, month.month, 1))}"
                     title="Anar a ${month.monthName}"
                     style="
                        position: absolute;
                        top: ${topPosition}px;
                        height: ${height}px;
                        left: 0;
                        width: 60px;
                        z-index: 10;
                     ">
                    <span class="month-text">${monthOnlyName}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="compact-months-overlay">
                ${monthsHTML}
            </div>
        `;
    }
    
    // Generar headers integrats amb columna de mesos
    generateIntegratedHeaders() {
        const dayHeaders = dateHelper.getDayHeaders();
        const headersHTML = dayHeaders.map(day => 
            `<div class="compact-day-header" style="grid-column: span 2;">${day}</div>`
        ).join('');
        
        return `
            <div class="compact-headers-row">
                <div class="compact-month-header-spacer"></div>
                ${headersHTML}
                <div class="compact-week-header"></div>
            </div>
        `;
    }
    
    
    // Generar grid compacte per HTML
    generateCompactGridHTML(allDays, calendar) {
        const weekRows = this.organizeByWeeks(allDays);
        
        const rowsHTML = weekRows.map(week => {
            const weekHTML = week.map(dayData => {
                if (!dayData) {
                    return '<div class="compact-day-cell empty"></div>';
                }
                return this.generateCompactDayCell(dayData, calendar, 'HTML');
            }).join('');
            
            return `<div class="compact-week-row">${weekHTML}</div>`;
        }).join('');
        
        return `<div class="compact-calendar-grid">${rowsHTML}</div>`;
    }
    
    // Generar cel·la compacta sense número de dia (el número està en columna externa)
    generateCompactDayCellWithoutNumber(dayData, calendar, outputFormat = 'DOM') {
        const isToday = dayData.dateStr === dateHelper.toUTCString(new Date());
        const classes = ['compact-day-cell'];
        
        if (isToday) classes.push('today');
        if (dayData.events.length > 0) classes.push('has-events');
        
        // Esdeveniments del dia (versió ultra compacta)
        const eventsHTML = this.generateCompactEvents(dayData.events, calendar, outputFormat);
        
        // Verificar si el dia està dins del rang vàlid del calendari
        const isDayInRange = this.isDayInCalendarRange(dayData, calendar);
        
        // Vista compacta no permet creació d'events - eliminar botó '+'
        const addEventBtnHTML = '';
        
        if (outputFormat === 'DOM') {
            const dayClickAction = isDayInRange ? `data-action="day-click"` : '';
            
            return `
                <div class="${classes.join(' ')}" data-date="${dayData.dateStr}" ${dayClickAction}>
                    <div class="compact-events-container">${eventsHTML}</div>
                    ${addEventBtnHTML}
                </div>
            `;
        } else {
            return `
                <div class="${classes.join(' ')}" data-date="${dayData.dateStr}">
                    <div class="compact-events-container">${eventsHTML}</div>
                </div>
            `;
        }
    }
    
    // Generar esdeveniments en format ultra compacte
    generateCompactEvents(events, calendar, outputFormat = 'DOM') {
        if (events.length === 0) return '';
        
        // Mostrar tots els esdeveniments, no indicadors +N
        return events.map(event => 
            this.generateCompactEventHTML(event, calendar, outputFormat)
        ).join('');
    }
    
    // Generar HTML d'un esdeveniment compacte
    generateCompactEventHTML(event, calendar, outputFormat = 'DOM', isCompact = false) {
        const color = event.getCategoryColor();
        const isUserEvent = !event.isSystemEvent;
        // No truncar el títol - deixar que es trenqui en múltiples línies
        const title = event.title;
        
        if (outputFormat === 'HTML') {
            const systemClass = event.isSystemEvent ? ' system' : '';
            const contrastStyle = colorContrastHelper.getContrastStyle(color);
            return `<div class="compact-event${systemClass}" style="${contrastStyle}" title="${event.title}">${title}</div>`;
        } else {
            const eventClasses = ['compact-event', isUserEvent ? 'is-user-event' : 'is-system-event'];
            const openModalAction = isUserEvent ? `data-action="open-event-modal" data-event-id="${event.id}"` : '';
            const draggableAttr = isUserEvent ? 'draggable="true"' : '';
            const contrastStyle = colorContrastHelper.getContrastStyle(color);
            
            return `<div class="${eventClasses.join(' ')}" style="${contrastStyle}" ${openModalAction} ${draggableAttr} title="${event.title}">${title}</div>`;
        }
    }
    
    // === UTILITATS ===
    
    // Organitzar dies per setmanes
    organizeByWeeks(allDays) {
        console.log('=== ORGANITZANT SETMANES ===');
        const weeks = [];
        let currentWeek = new Array(7).fill(null);
        let weekStarted = false;
        
        allDays.forEach(dayData => {
            const dayOfWeek = dateHelper.parseUTC(dayData.dateStr).getUTCDay();
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Dilluns = 0
            
            if (!weekStarted && dayIndex > 0) {
                // Omplir dies anteriors de la primera setmana
                for (let i = 0; i < dayIndex; i++) {
                    currentWeek[i] = null;
                }
            }
            
            currentWeek[dayIndex] = dayData;
            weekStarted = true;
            
            // Si és diumenge o últim dia, finalitzar setmana
            if (dayIndex === 6) {
                weeks.push([...currentWeek]);
                currentWeek = new Array(7).fill(null);
            }
        });
        
        // Afegir última setmana si no està buida
        if (currentWeek.some(day => day !== null)) {
            weeks.push(currentWeek);
        }
        
        console.log(`Total setmanes organitzades: ${weeks.length}`);
        return weeks;
    }
    
    // Extreure només el nom del mes sense any
    getMonthOnlyName(monthName) {
        // Si el nom del mes conté un any (e.g. "Gener 2024"), extreure només el nom
        return monthName.split(' ')[0];
    }
}

// === INSTÀNCIA GLOBAL ===

// Renderitzador principal per a vista compacta
const compactRenderer = new CompactViewRenderer();
