// =================================================================
// DATE UTILS - UTILITATS DE DATA PER CALENDARI IOC
// =================================================================

// Funcions d'utilitats de data completament independents
// Totes les funcions mantenen consistència UTC

function createUTCDate(year, month, day) {
    return new Date(Date.UTC(year, month, day));
}

function dateToUTCString(date) {
    return date.toISOString().split('T')[0];
}

function parseUTCDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return createUTCDate(year, month - 1, day);
}

function formatDateForDisplay(date) {
    return date.toLocaleDateString('ca-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        timeZone: 'UTC'
    });
}

function getMonthName(date) {
    return date.toLocaleDateString('ca-ES', { 
        month: 'long', 
        year: 'numeric',
        timeZone: 'UTC'
    });
}

function getDayHeaders() {
    return ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];
}

function isWeekdayStr(dateStr) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function getCalendarWeekNumber(date, calendarStartDateStr) {
    const calendarStartDate = parseUTCDate(calendarStartDateStr);
    const targetDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    
    // Si la fecha objetivo es anterior al inicio del calendario, no mostrar número de semana
    if (targetDate < calendarStartDate) {
        return null;
    }
    
    const getMonday = (d) => {
        const day = d.getUTCDay();
        const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setUTCDate(diff));
    };
    
    const startOfWeek1 = getMonday(new Date(calendarStartDate.getTime()));
    const targetWeekMonday = getMonday(new Date(targetDate.getTime()));
    
    startOfWeek1.setUTCHours(0, 0, 0, 0);
    targetWeekMonday.setUTCHours(0, 0, 0, 0);
    
    const diff = targetWeekMonday.getTime() - startOfWeek1.getTime();
    const diffWeeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    
    const weekNumber = diffWeeks + 1;
    
    // Solo devolver números de semana positivos
    return weekNumber > 0 ? weekNumber : null;
}

// Funcions auxiliars adicionals
function addMonths(date, monthsToAdd) {
    const result = new Date(date.getTime());
    result.setUTCMonth(result.getUTCMonth() + monthsToAdd);
    return result;
}

function getFirstDayOfMonth(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getLastDayOfMonth(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function isSameMonth(date1, date2) {
    return date1.getUTCFullYear() === date2.getUTCFullYear() && 
           date1.getUTCMonth() === date2.getUTCMonth();
}

function truncateText(text, maxLength = 30) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}