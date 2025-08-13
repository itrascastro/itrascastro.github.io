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
 * @project     Calendari IOC
 * @repository  https://github.com/itrascastro/calendari-ioc
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
        this.downloadIcsFile(icsContent, calendar.id);
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
        return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:Calendari-IOC\r\nCALSCALE:GREGORIAN\r\n';
    }
    
    // === GENERACIÓ DE PEU ICS ===
    generateIcsFooter() {
        return 'END:VCALENDAR\r\n';
    }
    
    // === GENERACIÓ D'ESDEVENIMENT ICS ===
    generateIcsEvent(event, calendar) {
        // FASE 3: Usar referència directa a categoria
        const category = event.getCategory();
        
        // Detectar si el títol té hora entre claudàtors [HH:MM]
        const timeMatch = event.title.match(/^\[(\d{2}:\d{2})\]\s+(.+)$/);
        const hasTime = !!timeMatch;
        const eventTime = hasTime ? timeMatch[1] : null;
        const cleanTitle = hasTime ? timeMatch[2] : event.title;
        
        // Validar i formatear data correctament
        const eventDate = dateHelper.parseUTC(event.date);
        const dtstamp = this.getCurrentTimestamp();
        
        let eventContent = 'BEGIN:VEVENT\r\n';
        eventContent += `UID:${event.id}@calendari-modul-ioc\r\n`;
        
        if (hasTime) {
            // Esdeveniment amb hora específica (duració 1 hora)
            const startDateTime = this.formatDateTimeForIcs(eventDate, eventTime);
            const endDateTime = this.formatDateTimeForIcs(eventDate, eventTime, 1); // +1 hora
            eventContent += `DTSTART:${startDateTime}\r\n`;
            eventContent += `DTEND:${endDateTime}\r\n`;
        } else {
            // Esdeveniment de dia sencer
            const startDate = this.formatDateForIcs(eventDate);
            const endDate = this.formatDateForIcs(this.getNextDay(eventDate));
            eventContent += `DTSTART;VALUE=DATE:${startDate}\r\n`;
            eventContent += `DTEND;VALUE=DATE:${endDate}\r\n`;
        }
        
        eventContent += `DTSTAMP:${dtstamp}\r\n`;
        eventContent += `SUMMARY:${this.escapeIcsText(cleanTitle)}\r\n`;
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
    
    // === UTILITATS PER DATES ===
    formatDateForIcs(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    
    formatDateTimeForIcs(date, timeStr, addHours = 0) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Crear data amb hora local i deixar que JavaScript faci la conversió a UTC
        const eventDateTime = new Date(date);
        eventDateTime.setHours(hours + addHours, minutes, 0, 0); // Hora local
        
        // Obtenir components UTC (JavaScript fa la conversió automàtica)
        const year = eventDateTime.getUTCFullYear();
        const month = String(eventDateTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(eventDateTime.getUTCDate()).padStart(2, '0');
        const hour = String(eventDateTime.getUTCHours()).padStart(2, '0');
        const minute = String(eventDateTime.getUTCMinutes()).padStart(2, '0');
        const second = String(eventDateTime.getUTCSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}T${hour}${minute}${second}Z`;
    }
    
    getNextDay(date) {
        const nextDay = new Date(date);
        nextDay.setUTCDate(date.getUTCDate() + 1);
        return nextDay;
    }
    
    getCurrentTimestamp() {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hour = String(now.getUTCHours()).padStart(2, '0');
        const minute = String(now.getUTCMinutes()).padStart(2, '0');
        const second = String(now.getUTCSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hour}${minute}${second}Z`;
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
    downloadIcsFile(content, calendarId) {
        const blob = new Blob([content], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${calendarId.replace(/[^a-z0-9]/gi, '_')}_IOC.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// === INSTÀNCIA GLOBAL ===
const icsExporter = new IcsExporter();