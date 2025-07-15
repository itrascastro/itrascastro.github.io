// =================================================================
// ID GENERATORS - GENERADORS D'IDENTIFICADORS ÚNICS
// =================================================================

// === GENERADORS D'IDS PER ESDEVENIMENTS ===

// Generar següent ID d'esdeveniment per un calendari
function generateNextEventId(calendarId) {
    const calendar = appState.calendars[calendarId];
    if (!calendar) return null;
    calendar.eventCounter = (calendar.eventCounter || 0) + 1;
    return `${calendar.name}_E${calendar.eventCounter}`;
}

// === GENERADORS D'IDS PER CATEGORIES ===

// Generar següent ID de categoria per un calendari
function generateNextCategoryId(calendarId) {
    const calendar = appState.calendars[calendarId];
    if (!calendar) return null;
    calendar.categoryCounter = (calendar.categoryCounter || 0) + 1;
    return `${calendar.name}_C${calendar.categoryCounter}`;
}

// === INICIALITZACIÓ ===
function initializeIDGenerators() {
    console.log('[IDGenerators] Generadors d\'ID inicialitzats');
}