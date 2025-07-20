/**
 * =================================================================
 * ICS EXPORTER - EXPORTACIÓ DE CALENDARIS A FORMAT ICS
 * =================================================================
 * 
 * @file        IcsExporter.js
 * @description Exportador de calendaris al format ICS/iCalendar estàndard
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

// Classe per exportar calendaris a format ICS (iCalendar)
class IcsExporter {
    constructor() {
        this.exportType = 'ics';
    }
    
    // === EXPORTACIÓ PRINCIPAL ===
    exportCalendar(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar || calendar.events.length === 0) {
            uiHelper.showMessage('No hi ha events per exportar', 'warning');
            return;
        }
        
        const icsContent = this.generateIcsContent(calendar);
        this.downloadIcsFile(icsContent, calendar.name);
        uiHelper.showMessage('Fitxer ICS exportat correctament', 'success');
    }
    
    // === GENERACIÓ DE CONTINGUT ICS ===
    generateIcsContent(calendar) {
        let icsContent = this.generateIcsHeader();
        
        calendar.events.forEach(event => {
            icsContent += this.generateIcsEvent(event, calendar);
        });
        
        icsContent += this.generateIcsFooter();
        
        return icsContent;
    }
    
    // === GENERACIÓ DE CAPÇALERA ICS ===
    generateIcsHeader() {
        return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:Calendari-Modul-IOC\r\nCALSCALE:GREGORIAN\r\n';
    }
    
    // === GENERACIÓ DE PEU ICS ===
    generateIcsFooter() {
        return 'END:VCALENDAR\r\n';
    }
    
    // === GENERACIÓ D'ESDEVENIMENT ICS ===
    generateIcsEvent(event, calendar) {
        // Buscar categoria utilitzant el servei centralitzat
        const category = CategoryService.findCategoryById(event.categoryId, calendar);
        const date = event.date.replace(/-/g, '');
        
        let eventContent = 'BEGIN:VEVENT\r\n';
        eventContent += `UID:${event.id}@calendari-modul-ioc\r\n`;
        eventContent += `DTSTART;VALUE=DATE:${date}\r\n`;
        eventContent += `SUMMARY:${this.escapeIcsText(event.title)}\r\n`;
        eventContent += `CATEGORIES:${category ? category.name : 'General'}\r\n`;
        
        let description = event.description || '';
        if (event.isSystemEvent) {
            description += ' [Esdeveniment institucional IOC]';
        }
        if (description) {
            eventContent += `DESCRIPTION:${this.escapeIcsText(description)}\r\n`;
        }
        
        eventContent += 'END:VEVENT\r\n';
        
        return eventContent;
    }
    
    // === ESCAPAMENT DE TEXT PER ICS ===
    escapeIcsText(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }
    
    // === DESCÀRREGA D'ARXIU ===
    downloadIcsFile(content, calendarName) {
        const blob = new Blob([content], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${calendarName.replace(/[^a-z0-9]/gi, '_')}_IOC.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// === INSTÀNCIA GLOBAL ===
const icsExporter = new IcsExporter();