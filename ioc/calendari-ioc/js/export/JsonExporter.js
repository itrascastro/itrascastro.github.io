/**
 * =================================================================
 * JSON EXPORTER - EXPORTACIÓ DE CALENDARIS A FORMAT JSON
 * =================================================================
 * 
 * @file        JsonExporter.js
 * @description Exportador de calendaris al format JSON nadiu de l'aplicació
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

// Classe per exportar calendaris a format JSON
class JsonExporter {
    constructor() {
        this.exportType = 'json';
    }
    
    // === EXPORTACIÓ PRINCIPAL ===
    exportCalendar(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) {
            throw new CalendariIOCException('1102', 'JsonExporter.exportCalendar');
        }
        
        const jsonContent = this.generateJsonContent(calendar);
        this.downloadJsonFile(jsonContent, calendar.name);
        uiHelper.showMessage('Calendari desat com a fitxer JSON', 'success');
    }
    
    // === GENERACIÓ DE CONTINGUT JSON ===
    generateJsonContent(calendar) {
        // FASE 3: Usar calendar.toJSON() per serialització controlada
        const calendarData = calendar.toJSON();
        const exportData = {
            ...calendarData,
            exportInfo: {
                version: '1.0',
                exportDate: new Date().toISOString(),
                exportedBy: 'Calendari-Modul-IOC',
                calendarType: calendar.type
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    // === GENERACIÓ DE CONTINGUT JSON COMPLET (AMB METADADES) ===
    generateCompleteJsonContent(calendar) {
        // FASE 3: Usar calendar.toJSON() per serialització controlada
        const calendarData = calendar.toJSON();
        const exportData = {
            calendar: calendarData,
            metadata: {
                version: '1.0',
                exportDate: new Date().toISOString(),
                exportedBy: 'Calendari-Modul-IOC',
                totalEvents: calendar.events.length,
                categories: calendar.categories.map(cat => cat.toJSON()),
                dateRange: {
                    start: calendar.startDate,
                    end: calendar.endDate
                }
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    // === EXPORTACIÓ SIMPLIFICADA (NOMÉS ESDEVENIMENTS) ===
    exportEventsOnly(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar || calendar.events.length === 0) {
            uiHelper.showMessage('No hi ha events per exportar', 'warning');
            return;
        }
        
        const eventsData = {
            calendarName: calendar.name,
            events: calendar.events.map(event => ({
                id: event.id,
                title: event.title,
                date: event.date,
                description: event.description,
                // FASE 3: Usar mètode directe per exportació JSON
                categoryId: event.getCategory()?.id || null,
                isSystemEvent: event.isSystemEvent
            })),
            exportInfo: {
                version: '1.0',
                exportDate: new Date().toISOString(),
                exportType: 'events-only'
            }
        };
        
        const jsonContent = JSON.stringify(eventsData, null, 2);
        this.downloadJsonFile(jsonContent, `${calendar.name}_events`);
        uiHelper.showMessage('Events exportats com a fitxer JSON', 'success');
    }
    
    // === DESCÀRREGA D'ARXIU ===
    downloadJsonFile(content, calendarName) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${calendarName.replace(/[^a-z0-9]/gi, '_')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// === INSTÀNCIA GLOBAL ===
const jsonExporter = new JsonExporter();