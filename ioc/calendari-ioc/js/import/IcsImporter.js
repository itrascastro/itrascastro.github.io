/**
 * =================================================================
 * ICS IMPORTER - IMPORTACIÓ DE CALENDARIS DES DE FORMAT ICS
 * =================================================================
 * 
 * @file        IcsImporter.js
 * @description Importador de calendaris des de fitxers ICS/iCalendar per calendaris tipus "Altre"
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-24
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * =================================================================
 */

// Classe per importar calendaris des de fitxers ICS
class IcsImporter {
    constructor() {
        this.importType = 'ics';
    }
    
    // === IMPORTACIÓ PRINCIPAL ===
    importIcsFile(callback, existingCalendar = null, icsContent = null) {
        // Si rebem contingut directament (per testing), processar-lo
        if (icsContent) {
            try {
                const calendarData = this.parseIcsContent(icsContent, null, existingCalendar);
                callback(calendarData);
                return;
            } catch (error) {
                const icsError = new CalendariIOCException('901', 'IcsImporter.importIcs');
                errorManager.handleError(icsError);
                return;
            }
        }

        // Flux original per usuaris reals
        const input = document.createElement('input');
        input.id = 'ics-file-input';
        input.name = 'ics-file-input';
        input.type = 'file';
        input.accept = '.ics';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const icsContent = e.target.result;
                        const calendarData = this.parseIcsContent(icsContent, file.name, existingCalendar);
                        callback(calendarData);
                    } catch (error) {
                        const icsError = new CalendariIOCException('901', 'IcsImporter.importIcs');
                        errorManager.handleError(icsError);
                        return; // No continuar processant
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    // === PARSING DE CONTINGUT ICS ===
    parseIcsContent(icsContent, fileName, existingCalendar = null) {
        const lines = icsContent.split(/\r?\n/);
        const events = [];
        let currentEvent = null;
        let allDates = [];
        
        // Límits del calendari origen si existeix
        const calendarStart = existingCalendar ? new Date(existingCalendar.startDate) : null;
        const calendarEnd = existingCalendar ? new Date(existingCalendar.endDate) : null;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Manejar líneas continuation (comienzan con espacio o tab)
            while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
                i++;
                line += lines[i].trim();
            }
            
            if (line === 'BEGIN:VEVENT') {
                currentEvent = {};
            } else if (line === 'END:VEVENT' && currentEvent) {
                if (currentEvent.title && currentEvent.dtstart) {
                    const eventDays = this.generateEventDays(currentEvent);
                    
                    // Filtrar esdeveniments dins dels límits del calendari
                    const filteredEvents = eventDays.filter(event => {
                        if (!calendarStart || !calendarEnd) return true;
                        const eventDate = new Date(event.date);
                        return eventDate >= calendarStart && eventDate <= calendarEnd;
                    });
                    
                    events.push(...filteredEvents);
                    allDates.push(...filteredEvents.map(e => e.date));
                }
                currentEvent = null;
            } else if (currentEvent) {
                if (line.startsWith('SUMMARY:')) {
                    currentEvent.title = this.unescapeIcsText(line.substring(8));
                } else if (line.startsWith('DTSTART;VALUE=DATE:')) {
                    currentEvent.dtstart = {
                        type: 'date',
                        value: line.substring(19)
                    };
                } else if (line.startsWith('DTSTART:')) {
                    currentEvent.dtstart = {
                        type: 'datetime',
                        value: line.substring(8)
                    };
                } else if (line.startsWith('DTEND;VALUE=DATE:')) {
                    currentEvent.dtend = {
                        type: 'date',
                        value: line.substring(17)
                    };
                } else if (line.startsWith('DTEND:')) {
                    currentEvent.dtend = {
                        type: 'datetime',
                        value: line.substring(6)
                    };
                } else if (line.startsWith('DESCRIPTION:')) {
                    currentEvent.description = this.unescapeIcsText(line.substring(12));
                }
            }
        }
        
        if (events.length === 0) {
            throw new CalendariIOCException('902', 'IcsImporter.parseIcsContent', false);
        }
        
        // Calcular dates d'inici i fi del calendari
        allDates.sort();
        const startDate = allDates[0];
        const endDate = allDates[allDates.length - 1];
        
        // Generar nom del calendari des del nom del fitxer o nom per defecte
        const calendarName = fileName ? fileName.replace(/\.ics$/i, '').trim() : 'Calendari Importat';
        
        return {
            name: calendarName,
            startDate: startDate,
            endDate: endDate,
            events: events,
            totalEvents: events.length
        };
    }
    
    // === GENERACIÓ D'ESDEVENIMENTS PER DIES ===
    generateEventDays(eventData) {
        const events = [];
        const title = eventData.title;
        const description = eventData.description || '';
        
        // Determinar títol amb hora si és necessari
        let eventTitle = title;
        if (eventData.dtstart.type === 'datetime') {
            const startTime = this.extractTime(eventData.dtstart.value);
            if (startTime) {
                eventTitle = `[${startTime}] ${title}`;
            }
        }
        
        // Calcular dies de l'esdeveniment
        const startDate = this.parseIcsDate(eventData.dtstart.value);
        let endDate = startDate;
        
        if (eventData.dtend) {
            endDate = this.parseIcsDate(eventData.dtend.value);
            // Per esdeveniments de dia sencer, DTEND és el dia següent
            if (eventData.dtend.type === 'date') {
                const endDateObj = new Date(endDate);
                endDateObj.setDate(endDateObj.getDate() - 1);
                endDate = endDateObj.toISOString().substring(0, 10);
            }
        }
        
        // Generar esdeveniment per cada dia
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        
        while (currentDate <= lastDate) {
            events.push({
                title: eventTitle,
                date: currentDate.toISOString().substring(0, 10),
                description: description,
                categoryId: 'IMPORTATS',
                isSystemEvent: false
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return events;
    }
    
    // === UTILITATS DE PARSING ===
    parseIcsDate(dateValue) {
        // Pot ser YYYYMMDD o YYYYMMDDTHHMMSSZ
        const dateStr = dateValue.substring(0, 8);
        if (dateStr.length === 8) {
            return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        }
        throw new CalendariIOCException('903', 'IcsImporter.parseDate');
    }
    
    extractTime(dateTimeValue) {
        // Format: YYYYMMDDTHHMMSSZ o YYYYMMDDTHHMMSS
        if (dateTimeValue.length >= 15 && dateTimeValue.charAt(8) === 'T') {
            const dateStr = dateTimeValue.substring(0, 8);
            const timeStr = dateTimeValue.substring(9, 15); // HHMMSS
            const isUTC = dateTimeValue.endsWith('Z');
            
            let hours = parseInt(timeStr.substring(0, 2));
            const minutes = timeStr.substring(2, 4);
            
            if (isUTC) {
                // Convertir UTC a hora local (assumint zona horària europea +1/+2)
                // Crear data UTC i convertir a local
                const year = parseInt(dateStr.substring(0, 4));
                const month = parseInt(dateStr.substring(4, 6)) - 1;
                const day = parseInt(dateStr.substring(6, 8));
                const utcDate = new Date(Date.UTC(year, month, day, hours, parseInt(minutes.substring(0, 2))));
                
                // Obtenir hora local
                const localHours = utcDate.getHours();
                const localMinutes = utcDate.getMinutes();
                
                return `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;
            } else {
                return `${String(hours).padStart(2, '0')}:${minutes}`;
            }
        }
        return null;
    }
    
    unescapeIcsText(text) {
        return text
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\,/g, ',')
            .replace(/\\;/g, ';')
            .replace(/\\\\/g, '\\');
    }
}

// === INSTÀNCIA GLOBAL ===
const icsImporter = new IcsImporter();