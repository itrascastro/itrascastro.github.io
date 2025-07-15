// =================================================================
// APP STATE - GESTIÓ CENTRALITZADA DE L'ESTAT DE L'APLICACIÓ
// =================================================================

// === ESTAT PRINCIPAL DE L'APLICACIÓ ===
let appState = {
    calendars: {},
    currentCalendarId: null,
    editingCalendarId: null,
    editingEventId: null,
    currentDate: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
    currentView: 'month',  // Vista actual: month, day, week, semester
    categoryTemplates: [],  // Catálogo global de categorías de usuario
    unplacedEvents: [] // Eventos no ubicados en replicación
};

// === VARIABLES DE DRAG & DROP ===
let draggedEvent = null;
let draggedFromDate = null;

// === VARIABLES DE SELECCIÓN ===
let selectedCalendarId = null;
let selectedCategoryId = null;

// === FUNCIONES DE GESTIÓN D'ESTAT ===

// Obtenir el calendari actual
function getCurrentCalendar() {
    if (!appState.currentCalendarId || !appState.calendars[appState.currentCalendarId]) {
        appState.currentCalendarId = Object.keys(appState.calendars)[0] || null;
    }
    return appState.currentCalendarId ? appState.calendars[appState.currentCalendarId] : null;
}

// Obtenir l'ID del calendari seleccionat
function getSelectedCalendarId() {
    return selectedCalendarId;
}

// Obtenir l'ID de la categoria seleccionada
function getSelectedCategoryId() {
    return selectedCategoryId;
}

// Netejar l'estat de drag & drop
function cleanupDragState() {
    draggedEvent = null;
    draggedFromDate = null;
    
    // Netejar totes les classes de drop
    document.querySelectorAll('.drop-target, .drop-invalid').forEach(el => {
        el.classList.remove('drop-target', 'drop-invalid');
    });
}

// Establir el calendari seleccionat
function setSelectedCalendarId(calendarId) {
    selectedCalendarId = calendarId;
}

// Establir la categoria seleccionada
function setSelectedCategoryId(categoryId) {
    selectedCategoryId = categoryId;
}

// Netejar la selecció de categoria
function clearSelectedCategoryId() {
    selectedCategoryId = null;
}

// Resetejar l'estat de l'aplicació
function resetAppState() {
    appState = {
        calendars: {},
        currentCalendarId: null,
        editingCalendarId: null,
        editingEventId: null,
        currentDate: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
        categoryTemplates: [],
        unplacedEvents: []
    };
    
    // Resetejar variables auxiliars
    draggedEvent = null;
    draggedFromDate = null;
    selectedCalendarId = null;
    selectedCategoryId = null;
}

// Obtenir informació de l'estat actual
function getStateInfo() {
    return {
        calendarsCount: Object.keys(appState.calendars).length,
        currentCalendarId: appState.currentCalendarId,
        currentDate: appState.currentDate,
        categoryTemplatesCount: appState.categoryTemplates.length,
        unplacedEventsCount: appState.unplacedEvents.length,
        hasDraggedEvent: !!draggedEvent,
        selectedCalendarId: selectedCalendarId,
        selectedCategoryId: selectedCategoryId
    };
}

// Validar l'estat de l'aplicació
function validateAppState() {
    if (!appState || typeof appState !== 'object') {
        console.error('[AppState] Estat principal no vàlid');
        return false;
    }
    
    if (!appState.calendars || typeof appState.calendars !== 'object') {
        console.error('[AppState] Calendaris no vàlids');
        return false;
    }
    
    if (!Array.isArray(appState.categoryTemplates)) {
        console.error('[AppState] Plantilles de categories no vàlides');
        return false;
    }
    
    if (!Array.isArray(appState.unplacedEvents)) {
        console.error('[AppState] Events no ubicats no vàlids');
        return false;
    }
    
    return true;
}

// Migrar plantilles de categories des de calendaris existents
function migrateCategoryTemplates() {
    console.log('[Migració] Sincronitzant catàleg de categories...');
    
    Object.values(appState.calendars).forEach(calendar => {
        if (calendar.categories) {
            calendar.categories
                .filter(cat => !cat.isSystem) // Només categories d'usuari
                .forEach(category => {
                    // Verificar si ja existeix al catàleg
                    const existingTemplate = appState.categoryTemplates.find(t => t.id === category.id);
                    
                    if (!existingTemplate) {
                        // Afegir nova plantilla
                        appState.categoryTemplates.push({
                            id: category.id,
                            name: category.name,
                            color: category.color,
                            isSystem: false,
                            createdAt: new Date().toISOString(),
                            usageCount: 1
                        });
                    } else {
                        // Actualitzar plantilla existent
                        existingTemplate.name = category.name;
                        existingTemplate.color = category.color;
                        existingTemplate.usageCount = (existingTemplate.usageCount || 0) + 1;
                    }
                });
        }
    });
    
    // EL CATÀLEG NOMÉS CONTÉ CATEGORIES D'USUARI
    // Les categories de sistema es mantenen només als calendaris individuals
    // NO afegim categories per defecte al catàleg global
    
    console.log(`[Migració] Catàleg sincronitzat amb ${appState.categoryTemplates.length} categories`);
}