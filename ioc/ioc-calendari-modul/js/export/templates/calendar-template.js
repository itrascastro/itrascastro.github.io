/**
 * =================================================================
 * CALENDAR TEMPLATE - PLANTILLA HTML PER A EXPORTACIÓ
 * =================================================================
 * 
 * @file        calendar-template.js
 * @description Plantilla HTML per exportar calendaris com a pàgines web independents
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

// Plantilla base per generar calendaris HTML
const calendarHtmlTemplate = `<!DOCTYPE html>
<html lang="ca">
<!--
=================================================================
CALENDAR TEMPLATE - PLANTILLA HTML PER A EXPORTACIÓ
=================================================================

@file        Calendari-Modul-IOC.html
@description Plantilla HTML per exportar calendaris com a pàgines web independents
@author      Ismael Trascastro <itrascastro@ioc.cat>
@version     1.0.0
@date        2025-01-16
@project     Calendari Mòdul IOC
@repository  https://github.com/itrascastro/ioc-modul-calendari
@license     MIT

Aquest fitxer forma part del projecte Calendari Mòdul IOC,
una aplicació web per gestionar calendaris acadèmics.

=================================================================
-->
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