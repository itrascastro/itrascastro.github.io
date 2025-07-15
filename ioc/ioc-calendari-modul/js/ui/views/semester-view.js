// =================================================================
// SEMESTER VIEW - RENDERITZADOR PER A VISTA SEMESTRAL
// =================================================================

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
        const startDate = parseUTCDate(calendar.startDate);
        const endDate = parseUTCDate(calendar.endDate);
        
        const semesterData = {
            startDate: startDate,
            endDate: endDate,
            semesterName: this.generateSemesterName(calendar),
            days: []
        };
        
        // Calcular dia d'inici de la primera setmana
        const firstDay = new Date(startDate);
        const startDayOfWeek = firstDay.getUTCDay() === 0 ? 6 : firstDay.getUTCDay() - 1;
        
        // Afegir dies anteriors per completar la primera setmana
        for (let i = startDayOfWeek; i > 0; i--) {
            const dayDate = createUTCDate(
                firstDay.getUTCFullYear(),
                firstDay.getUTCMonth(),
                firstDay.getUTCDate() - i
            );
            semesterData.days.push(this.generateDayData(dayDate, calendar, true));
        }
        
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
        
        // Afegir dies posteriors per completar l'última setmana
        const lastDay = new Date(endDate);
        const endDayOfWeek = lastDay.getUTCDay() === 0 ? 6 : lastDay.getUTCDay() - 1;
        const daysToComplete = 6 - endDayOfWeek;
        
        for (let i = 1; i <= daysToComplete; i++) {
            const dayDate = createUTCDate(
                lastDay.getUTCFullYear(),
                lastDay.getUTCMonth(),
                lastDay.getUTCDate() + i
            );
            semesterData.days.push(this.generateDayData(dayDate, calendar, true));
        }
        
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
                    <div class="semester-period">${this.formatDateRange(semesterData.startDate, semesterData.endDate)}</div>
                </div>
                ${this.generateCalendarGridHTML(semesterData.days, calendar)}
            </div>
        `;
    }
    
    // === UTILITATS ===
    
    // Generar nom del semestre
    generateSemesterName(calendar) {
        // Usar la propietat code del calendari
        return `Semestre ${calendar.code}`;
    }
    
    // Formatar rang de dates
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
    
    // Obtenir primer dia del semestre
    getSemesterStart(calendar) {
        return parseUTCDate(calendar.startDate);
    }
    
    // Obtenir últim dia del semestre
    getSemesterEnd(calendar) {
        return parseUTCDate(calendar.endDate);
    }
}

// === INSTÀNCIA GLOBAL ===

// Renderitzador principal per a vista semestral
const semesterRenderer = new SemesterViewRenderer();

// === FUNCIONS AUXILIARS ===

// Generar HTML de mes per vista semestral
function generateSemesterMonthHTML(monthData, calendar) {
    return semesterRenderer.generateCalendarGridHTML(monthData.days, calendar);
}

// Obtenir nom del semestre
function getSemesterName(calendar) {
    return semesterRenderer.generateSemesterName(calendar);
}

// === INICIALITZACIÓ ===

// Inicialitzar sistema de renderitzat semestral
function initializeSemesterView() {
    console.log('[SemesterView] Vista semestral inicialitzada');
}