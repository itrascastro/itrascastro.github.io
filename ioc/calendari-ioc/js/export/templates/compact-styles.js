// =================================================================
// COMPACT CALENDAR STYLES - ESTILS CSS PER A EXPORTACIÓ HTML (VISTA COMPACTA)
// =================================================================

// Estils CSS autònoms per exportar la vista compacta a HTML
// No depenen de variables del tema ni fitxers externs
const compactCalendarCssStyles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.4;
        color: #333;
        background-color: #f8f9fa;
    }

    .container { max-width: 1200px; margin: 0 auto; padding: 12px; }

    /* Capçalera compacta (títol + període + llegenda en una sola franja) */
    .compact-header { background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); padding: 12px; margin-bottom: 10px; display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: start; }
    .compact-header .title { display: flex; flex-direction: column; gap: 6px; }
    .compact-header .title h1 { font-size: 1.4em; color: #4f5d95; line-height: 1.2; }
    .compact-header .title .period { font-size: 0.95em; color: #6c757d; }
    .compact-header .legend { background: transparent; padding: 0; margin: 0; box-shadow: none; }
    .legend h3 { display: none; }
    .legend-items { display: flex; flex-wrap: wrap; gap: 8px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.9em; }
    .legend-color { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }

    /* Disposició general (export) */
    .compact-view-export { display: block; max-width: 100%; font-size: 0.9em; }

    /* Headers integrats amb columna Mes i Set. */
    .compact-headers-row { display: grid; grid-template-columns: 60px repeat(7, 12px 1fr) 30px; gap: 0; background-color: #dee2e6; border-bottom: 1px solid #dee2e6; }
    .compact-month-header-spacer, .compact-week-header { background: #f8f9fa; padding: 6px 4px; font-weight: 700; color: #495057; font-size: 0.8em; text-align: center; }
    .compact-day-header { background: #e9ecef; padding: 6px 4px; text-align: center; font-weight: 700; color: #495057; font-size: 0.85em; grid-column: span 2; border-right: 1px solid #dee2e6; }

    /* Grid unificat: Mes | (Nº dia + cel·la)x7 | Set. */
    .compact-unified-grid { display: grid; grid-template-columns: 60px repeat(7, 12px 1fr) 30px; gap: 0; background-color: #dee2e6; }
    .compact-month-cell { background: #fff; border: 1px solid #dee2e6; display: flex; align-items: center; justify-content: center; writing-mode: horizontal-tb; text-align: center; padding: 2px 4px; font-size: 10px; font-weight: 600; color: #495057; }
    .compact-day-number { background: #f8f9fa; border: 1px solid #dee2e6; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #495057; font-size: 11px; }
    .compact-day-cell { background: #fff; border: 1px solid #dee2e6; min-height: 18px; padding: 2px; display: flex; flex-direction: column; overflow: hidden; }
    .compact-day-cell.empty { background: #f8f9fa; }
    .compact-week-number { background: #f8f9fa; border: 1px solid #dee2e6; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #495057; font-size: 11px; }

    .compact-events-container { display: flex; flex-direction: column; gap: 1px; }
    .compact-event { font-size: 9px; padding: 1px 2px; border-radius: 2px; color: white; line-height: 1.15; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; }
    .compact-event.system { font-style: italic; }

    .calendar-footer { text-align: center; margin-top: 12px; padding: 10px; color: #6c757d; font-size: 0.85em; background: white; border-radius: 8px; }

    @media print { 
        @page { size: A4; margin: 10mm; }
        body { background: white; }
        .container { max-width: none; padding: 6mm; }
        .compact-day-cell { min-height: 14px; }
        .compact-header { box-shadow: none; }
    }
`;

// Plantilla específica per a exportació compacta amb capçalera integrada
const compactCalendarHtmlTemplate = `<!DOCTYPE html>
<html lang="ca">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{CALENDAR_NAME}} - Vista Compacta</title>
    <style>{{COMPACT_CSS}}</style>
    <meta name="robots" content="noindex,nofollow">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body>
    <div class="container">
        <div class="compact-header">
            <div class="title">
                <h1>{{CALENDAR_NAME}}</h1>
                <div class="period">{{PERIOD_TEXT}}</div>
            </div>
            {{LEGEND_INLINE}}
        </div>

        <div class="months-container">
            {{CONTENT_HTML}}
        </div>

        <footer class="calendar-footer">
            <p>Generat amb l'aplicació Calendari IOC el {{GENERATION_DATE}}</p>
        </footer>
    </div>
</body>
</html>`;
