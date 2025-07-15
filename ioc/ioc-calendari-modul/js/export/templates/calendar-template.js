// =================================================================
// CALENDAR TEMPLATE - PLANTILLA HTML PER A EXPORTACIÓ
// =================================================================

// Plantilla base per generar calendaris HTML
const calendarHtmlTemplate = `<!DOCTYPE html>
<html lang="ca">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{CALENDAR_NAME}} - Calendari Visual</title>
    <style>{{CALENDAR_CSS}}</style>
</head>
<body>
    <div class="container">
        <header class="calendar-header">
            <h1>{{CALENDAR_NAME}}</h1>
            <p class="period">{{PERIOD_TEXT}}</p>
        </header>
        
        {{CATEGORIES_LEGEND}}
        
        <div class="months-container">
            {{MONTHS_HTML}}
        </div>
        
        <footer class="calendar-footer">
            <p>Generat amb l'aplicació Calendari IOC el {{GENERATION_DATE}}</p>
        </footer>
    </div>
</body>
</html>`;

// === INICIALITZACIÓ ===
function initializeCalendarTemplate() {
    console.log('[CalendarTemplate] Template HTML inicialitzat');
}