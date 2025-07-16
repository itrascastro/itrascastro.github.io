/**
 * =================================================================
 * MONTH VIEW - RENDERITZADOR PER A VISTA MENSUAL
 * =================================================================
 * 
 * @file        month-view.js
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
        const firstDayOfMonth = createUTCDate(year, month, 1);
        const lastDayOfMonth = createUTCDate(year, month + 1, 0);
        const startDayOfWeek = firstDayOfMonth.getUTCDay() === 0 ? 6 : firstDayOfMonth.getUTCDay() - 1;
        
        const monthData = {
            year: year,
            month: month,
            monthName: getMonthName(currentDate),
            days: []
        };
        
        // Dies del mes anterior
        for (let i = startDayOfWeek; i > 0; i--) {
            const date = createUTCDate(year, month, 1 - i);
            monthData.days.push(this.generateDayData(date, calendar, true));
        }
        
        // Dies del mes actual
        for (let i = 1; i <= lastDayOfMonth.getUTCDate(); i++) {
            const date = createUTCDate(year, month, i);
            monthData.days.push(this.generateDayData(date, calendar, false));
        }
        
        // Dies del mes següent per completar la graella
        const totalCells = startDayOfWeek + lastDayOfMonth.getUTCDate();
        const nextMonthCells = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= nextMonthCells; i++) {
            const date = createUTCDate(year, month + 1, i);
            monthData.days.push(this.generateDayData(date, calendar, true));
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

// === FUNCIONS PÚBLIQUES DE RENDERITZAT ===

// Renderitzar calendari principal
function renderCalendar() {
    const calendar = getCurrentCalendar();
    if (!calendar) {
        document.getElementById('calendar-grid-wrapper').innerHTML = '<p style="color: var(--secondary-text-color); font-style: italic; text-align: center; padding: 20px;">Selecciona un calendari.</p>';
        return;
    }
    
    const gridWrapper = document.getElementById('calendar-grid-wrapper');
    const periodDisplay = document.getElementById('current-period-display');
    
    const monthHTML = monthRenderer.render(calendar, appState.currentDate, 'DOM');
    gridWrapper.innerHTML = monthHTML;
    periodDisplay.textContent = getMonthName(appState.currentDate);
    
    // Configurar drag & drop per a noves cel·les
    setupCalendarDragDrop();
    
    // Actualitzar navegació
    updateNavigationButtons();
}

// Actualitzar botons de navegació
function updateNavigationButtons() {
    const calendar = getCurrentCalendar();
    if (!calendar) return;
    
    const prevBtn = document.querySelector('[data-direction="-1"]');
    const nextBtn = document.querySelector('[data-direction="1"]');
    
    if (!prevBtn || !nextBtn) return;
    
    const calendarStart = parseUTCDate(calendar.startDate);
    const calendarEnd = parseUTCDate(calendar.endDate);
    
    const prevMonthEnd = createUTCDate(
        appState.currentDate.getUTCFullYear(), 
        appState.currentDate.getUTCMonth(), 
        0
    );
    prevBtn.disabled = prevMonthEnd < calendarStart;
    
    const nextMonthStart = createUTCDate(
        appState.currentDate.getUTCFullYear(), 
        appState.currentDate.getUTCMonth() + 1, 
        1
    );
    nextBtn.disabled = nextMonthStart > calendarEnd;
}

// Configurar drag & drop per a cel·les del calendari
function setupCalendarDragDrop() {
    document.querySelectorAll('.day-cell').forEach(dayElement => {
        const dateStr = dayElement.dataset.date;
        
        dayElement.addEventListener('dragover', (e) => {
            if (!draggedEvent) return;
            
            const calendar = getCurrentCalendar();
            if (!calendar) return;
            
            // Verificar si el moviment és vàlid
            let isValid = false;
            if (draggedFromDate === 'unplaced') {
                // Esdeveniment no ubicat: usar validació bàsica
                isValid = !dayElement.classList.contains('out-of-month');
            } else {
                // Esdeveniment normal: usar validació estàndard
                isValid = eventManager.isValidEventMove(draggedEvent, dateStr, calendar);
            }
            
            if (isValid) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                dayElement.classList.add('drop-target');
            } else {
                dayElement.classList.add('drop-invalid');
            }
        });
        
        dayElement.addEventListener('dragleave', (e) => {
            // Només netejar si realment sortim de l'element
            if (!dayElement.contains(e.relatedTarget)) {
                dayElement.classList.remove('drop-target', 'drop-invalid');
            }
        });
        
        dayElement.addEventListener('drop', (e) => {
            e.preventDefault();
            dayElement.classList.remove('drop-target', 'drop-invalid');
            
            if (draggedEvent) {
                if (draggedFromDate === 'unplaced') {
                    // Manejar esdeveniment no ubicat
                    const eventData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (eventData.isUnplacedEvent) {
                        placeUnplacedEvent(eventData.unplacedIndex, dateStr);
                    }
                } else if (draggedFromDate !== dateStr) {
                    // Manejar esdeveniment normal
                    eventManager.moveEvent(draggedEvent.id, dateStr);
                }
            }
            
            cleanupDragState();
        });
    });
}

// === FUNCIONS AUXILIARS ===

// Generar HTML d'esdeveniment
function generateEventHTML(event, calendar) {
    return monthRenderer.generateEventHTML(event, calendar, 'DOM');
}

// Generar cel·la de dia
function generateDayCell(date, calendar, isOutOfMonth = false) {
    const dayData = monthRenderer.generateDayData(date, calendar, isOutOfMonth);
    return monthRenderer.generateDayCellHTML(dayData, calendar, 'DOM');
}

// === INICIALITZACIÓ ===

// Inicialitzar sistema de renderitzat mensual
function initializeMonthView() {
    console.log('[MonthView] Vista mensual inicialitzada');
}