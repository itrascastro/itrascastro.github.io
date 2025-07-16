/**
 * =================================================================
 * JSON EXPORTER - EXPORTACIÓ DE CALENDARIS A FORMAT JSON
 * =================================================================
 * 
 * @file        json-exporter.js
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
        const calendar = appState.calendars[calendarId];
        if (!calendar) {
            showMessage('Calendari no trobat', 'error');
            return;
        }
        
        const jsonContent = this.generateJsonContent(calendar);
        this.downloadJsonFile(jsonContent, calendar.name);
        showMessage('Calendari guardat com a fitxer JSON', 'success');
    }
    
    // === GENERACIÓ DE CONTINGUT JSON ===
    generateJsonContent(calendar) {
        // Crear còpia del calendari per exportar
        const exportData = {
            ...calendar,
            exportInfo: {
                version: '1.0',
                exportDate: new Date().toISOString(),
                exportedBy: 'Calendari-Modul-IOC'
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    // === GENERACIÓ DE CONTINGUT JSON COMPLET (AMB METADADES) ===
    generateCompleteJsonContent(calendar) {
        const exportData = {
            calendar: calendar,
            metadata: {
                version: '1.0',
                exportDate: new Date().toISOString(),
                exportedBy: 'Calendari-Modul-IOC',
                totalEvents: calendar.events.length,
                categories: calendar.categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    color: cat.color,
                    isSystem: cat.isSystem
                })),
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
        const calendar = appState.calendars[calendarId];
        if (!calendar || calendar.events.length === 0) {
            showMessage('No hi ha events per exportar', 'warning');
            return;
        }
        
        const eventsData = {
            calendarName: calendar.name,
            events: calendar.events.map(event => ({
                id: event.id,
                title: event.title,
                date: event.date,
                description: event.description,
                categoryId: event.categoryId,
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
        showMessage('Events exportats com a fitxer JSON', 'success');
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

// === FUNCIONS PÚBLIQUES ===
function saveCalendarJSON(calendarId) {
    jsonExporter.exportCalendar(calendarId);
}

function exportCalendarEventsJSON(calendarId) {
    jsonExporter.exportEventsOnly(calendarId);
}

// === INICIALITZACIÓ ===
function initializeJsonExporter() {
    console.log('[JsonExporter] Exportador JSON inicialitzat');
}