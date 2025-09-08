// =================================================================
// CALENDAR STYLES - ESTILS CSS PER A EXPORTACIÓ HTML
// =================================================================

// Estils CSS específics per calendaris HTML exportats
const calendarCssStyles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.4;
        color: #333;
        background-color: #f8f9fa;
    }
    
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }
    
    .calendar-header {
        text-align: center;
        margin-bottom: 30px;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .calendar-header h1 {
        font-size: 2em;
        color: #4f5d95;
        margin-bottom: 10px;
    }
    
    .period {
        font-size: 1.1em;
        color: #6c757d;
    }
    
    .legend {
        background: white;
        padding: 20px;
        margin-bottom: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .legend h3 {
        margin-bottom: 15px;
        color: #4f5d95;
    }
    
    .legend-items {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    
    .month-section {
        background: white;
        margin-bottom: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        overflow: hidden;
        break-inside: avoid;
    }
    
    .month-header {
        background: #4f5d95;
        color: white;
        padding: 15px 20px;
        font-size: 1.3em;
        font-weight: bold;
        text-align: center;
    }
    
    .month-grid,
    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        width: 100%;
    }
    
    .day-header {
        background: #e9ecef;
        padding: 10px 5px;
        text-align: center;
        font-weight: bold;
        color: #495057;
        font-size: 0.9em;
        border-bottom: 1px solid #dee2e6;
    }
    
    .day-cell {
        min-height: 120px;
        padding: 8px;
        border-right: 1px solid #dee2e6;
        border-bottom: 1px solid #dee2e6;
        position: relative;
        background: white;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
    
    .day-cell.out-of-month {
        background: #f8f9fa;
        color: #adb5bd;
    }
    
    .day-number {
        font-weight: bold;
        margin-bottom: 5px;
    }
    
    .week-number,
    .week-pill {
        position: absolute;
        top: 5px;
        right: 5px;
        background: #6c757d;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 0.7em;
        font-weight: bold;
    }
    
    .event-item {
        font-size: 0.75em;
        padding: 2px 6px;
        margin-bottom: 2px;
        border-radius: 3px;
        color: white;
        font-weight: 500;
        line-height: 1.2;
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
    }
    
    .event-item.system {
        font-style: italic;
    }
    
    .calendar-footer {
        text-align: center;
        margin-top: 30px;
        padding: 15px;
        color: #6c757d;
        font-size: 0.9em;
        background: white;
        border-radius: 8px;
    }
    
    /* Print styles */
    @media print {
        body { background: white; }
        .container { max-width: none; }
        .month-section { 
            break-inside: avoid; 
            margin-bottom: 20px;
            box-shadow: none;
            border: 1px solid #ddd;
        }
        .day-cell { min-height: 80px; }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .container { padding: 10px; }
        .day-cell { min-height: 80px; font-size: 0.9em; }
        .legend-items { flex-direction: column; }
    }
`;