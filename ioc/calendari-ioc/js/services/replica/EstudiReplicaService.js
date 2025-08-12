/**
 * =================================================================
 * ESTUDI REPLICA SERVICE - SERVEI DE REPLICACIÓ PER CALENDARIS D'ESTUDI
 * =================================================================
 * 
 * @file        EstudiReplicaService.js
 * @description Servei per replicació proporcional d'esdeveniments entre calendaris d'estudi
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

// CLASSE DE SERVEI DE REPLICACIÓ PER CALENDARIS D'ESTUDI: Implementa algoritme proporcional
class EstudiReplicaService extends ReplicaService {
    
    // Funció principal de replicació amb suport per respectar dies de setmana
    replicate(sourceCalendar, targetCalendar, respectWeekdays = true) {
        console.log(`[ESTUDI_REPLICA_SERVICE] Iniciant replicació...`);
        
        try {
            // Filtrar esdeveniments del professor
            const professorEvents = sourceCalendar.events
                .filter(event => !event.isSystemEvent)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            console.log(`[ESTUDI_REPLICA_SERVICE] Events del professor a replicar: ${professorEvents.length}`);
            
            if (professorEvents.length === 0) {
                console.log(`[ESTUDI_REPLICA_SERVICE] No hi ha events del professor per replicar`);
                return { placed: [], unplaced: [] };
            }
            
            // REPLICAR CATEGORIES NECESSÀRIES PRIMER
            const categoryMap = this.replicateRequiredCategories(professorEvents);
            console.log(`[ESTUDI_REPLICA_SERVICE] Categories replicades: ${categoryMap.size}`);
            
            // Construir espais útils
            const espaiUtilOrigen = this.analyzeWorkableSpaceEstudi(sourceCalendar);
            const espaiUtilDesti = this.analyzeWorkableSpaceEstudi(targetCalendar);
            
            console.log(`[ESTUDI_REPLICA_SERVICE] Espai Origen: ${espaiUtilOrigen.length} dies útils`);
            console.log(`[ESTUDI_REPLICA_SERVICE] Espai Destí: ${espaiUtilDesti.length} dies útils`);
            
            if (espaiUtilDesti.length === 0) {
                console.log(`[ESTUDI_REPLICA_SERVICE] Calendari destí sense espai útil disponible`);
                return { 
                    placed: [], 
                    unplaced: professorEvents.map(event => {
                        const originalCategory = event.getCategory();
                        const targetCategory = categoryMap.get(originalCategory?.id);
                        
                        const unplacedEvent = new CalendariIOC_Event({
                            id: event.id,
                            title: event.title,
                            date: event.date,
                            description: event.description || '',
                            isSystemEvent: event.isSystemEvent || false,
                            category: targetCategory || originalCategory // Mantenir referència categoria
                        });
                        
                        return { 
                            event: unplacedEvent,
                            sourceCalendar,
                            reason: "Calendari destí sense espai útil disponible" 
                        };
                    }) 
                };
            }
            
            // Decidir estratègia segons comparació d'espais i viabilitat
            if (espaiUtilDesti.length >= espaiUtilOrigen.length) {
                // Verificar si realment es pot fer mapeo directe
                const canUseDirectMapping = this.canExecuteDirectMapping(professorEvents, espaiUtilOrigen, espaiUtilDesti, respectWeekdays);
                
                if (canUseDirectMapping) {
                    console.log(`[ESTUDI_REPLICA_SERVICE] Espai suficient i compatible: aplicant mapeo directe`);
                    return this.executeDirectMapping(professorEvents, espaiUtilOrigen, espaiUtilDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays);
                }
            }
            
            // Fallback: usar compressió (lògica actual)
            console.log(`[ESTUDI_REPLICA_SERVICE] Aplicant compressió proporcional`);
            return this.executeCompressionMapping(professorEvents, espaiUtilOrigen, espaiUtilDesti, sourceCalendar, categoryMap, targetCalendar);
        } catch (error) {
            console.error(`[ESTUDI_REPLICA_SERVICE] Error durant la replicació:`, error);
            console.error(`[ESTUDI_REPLICA_SERVICE] Stack trace:`, error.stack);
            throw new CalendariIOCException('207', 'EstudiReplicaService.replicate');
        }
    }
    
    // Mètode de compressió amb agrupació preservada (SEMPRE agrupar esdeveniments del mateix dia)
    executeCompressionMapping(professorEvents, espaiUtilOrigen, espaiUtilDesti, sourceCalendar, categoryMap, targetCalendar) {
        console.log(`[ESTUDI_REPLICA_SERVICE] Executant compressió amb agrupació preservada...`);
        
        // SEMPRE agrupar esdeveniments per dia primer
        const eventsByDay = replicaHelper.groupEventsByDay(professorEvents);
        
        // Calcular factor de proporció
        const factorProporcio = espaiUtilDesti.length / espaiUtilOrigen.length;
        console.log(`[ESTUDI_REPLICA_SERVICE] Factor de proporció: ${factorProporcio.toFixed(3)}`);
        
        // Mapa d'ocupació del destí
        const ocupacioEspaiDesti = new Map(espaiUtilDesti.map(date => [date, 'LLIURE']));
        
        const placedEvents = [];
        const unplacedEvents = [];
            
        // Bucle principal per GRUPS de dies (no events individuals)
        for (const [originalDate, dayEvents] of eventsByDay) {
            console.log(`[ESTUDI_REPLICA_SERVICE] Processant grup ${originalDate} amb ${dayEvents.length} esdeveniments`);
            
            // Trobar posició en espai origen
            const indexOrigen = espaiUtilOrigen.indexOf(originalDate);
            
            if (indexOrigen === -1) {
                console.log(`[ESTUDI_REPLICA_SERVICE] Dia ${originalDate} no està en espai útil d'origen`);
                
                // Tot el grup va a events no ubicats
                dayEvents.forEach(event => {
                    const originalCategory = event.getCategory();
                    const targetCategory = categoryMap.get(originalCategory?.id);
                    
                    const unplacedEvent = new CalendariIOC_Event({
                        id: event.id,
                        title: event.title,
                        date: event.date,
                        description: event.description || '',
                        isSystemEvent: event.isSystemEvent || false,
                        category: targetCategory || originalCategory
                    });
                    
                    unplacedEvents.push({ 
                        event: unplacedEvent,
                        sourceCalendar,
                        reason: "Dia no està en espai útil d'origen" 
                    });
                });
                continue;
            }
            
            // Calcular posició ideal en espai destí per al grup
            const indexIdeal = Math.round(indexOrigen * factorProporcio);
            
            // Buscar slot lliure per a tot el grup
            const indexFinal = this.findNearestFreeSlot(ocupacioEspaiDesti, indexIdeal);
            
            if (indexFinal === -1) {
                console.log(`[ESTUDI_REPLICA_SERVICE] No es troba slot lliure per grup ${originalDate}`);
                
                // Tot el grup va a events no ubicats
                dayEvents.forEach(event => {
                    const originalCategory = event.getCategory();
                    const targetCategory = categoryMap.get(originalCategory?.id);
                    
                    const unplacedEvent = new CalendariIOC_Event({
                        id: event.id,
                        title: event.title,
                        date: event.date,
                        description: event.description || '',
                        isSystemEvent: event.isSystemEvent || false,
                        category: targetCategory || originalCategory
                    });
                    
                    unplacedEvents.push({ 
                        event: unplacedEvent,
                        sourceCalendar,
                        reason: "Sense slots lliures disponibles" 
                    });
                });
                continue;
            }
            
            // Marcar slot com ocupat per a tot el grup
            const newDate = espaiUtilDesti[indexFinal];
            ocupacioEspaiDesti.set(newDate, 'OCUPAT');
            
            console.log(`[ESTUDI_REPLICA_SERVICE] Grup ${originalDate} → ${newDate}: ${dayEvents.length} esdeveniments mantinguts junts`);
            
            // Replicar TOTS els esdeveniments del grup al mateix dia destí
            dayEvents.forEach(event => {
                const originalCategory = event.getCategory();
                const targetCategory = categoryMap.get(originalCategory?.id);
                
                const replicatedEvent = new CalendariIOC_Event({
                    id: idHelper.generateNextEventId(targetCalendar.id),
                    title: event.title,
                    date: newDate, // TOTS van al mateix dia
                    description: event.description || '',
                    isSystemEvent: event.isSystemEvent || false,
                    category: targetCategory,
                    isReplicated: true,
                    replicatedFrom: event.date
                });
                
                placedEvents.push({
                    event: replicatedEvent,
                    newDate: newDate,
                    sourceCalendar: sourceCalendar,
                    originalDate: event.date,
                    confidence: this.calculateProportionalConfidence(indexOrigen, indexIdeal, indexFinal, factorProporcio)
                });
                
                console.log(`[ESTUDI_REPLICA_SERVICE] "${event.title}": ${event.date} → ${newDate} (agrupat)`);
            });
        }
            
        console.log(`[ESTUDI_REPLICA_SERVICE] Compressió amb agrupació: ${placedEvents.length} ubicats, ${unplacedEvents.length} no ubicats`);
        
        return { placed: placedEvents, unplaced: unplacedEvents };
    }
    
    // Anàlisi de l'espai útil per calendaris d'estudi (CÒPIA EXACTA de la lògica original)
    analyzeWorkableSpaceEstudi(calendar) {
        console.log(`[Espai Útil Estudi] Analitzant espai útil per: ${calendar.name}`);
        
        const espaiUtil = [];
        const dataFiAvaluacions = this.findPAF1(calendar);
        
        // Esdeveniments que ocupen l'espai (sistema IOC, festius, etc.)
        const occupiedBySystem = new Set(
            calendar.events
                .filter(e => e.isSystemEvent)
                .map(e => e.date)
        );
        
        console.log(`[Espai Útil Estudi] Període: ${calendar.startDate} → ${dataFiAvaluacions}`);
        console.log(`[Espai Útil Estudi] Dies ocupats pel sistema: ${occupiedBySystem.size}`);
        
        // Iterar dia a dia
        let currentDate = dateHelper.parseUTC(calendar.startDate);
        const endDate = dateHelper.parseUTC(dataFiAvaluacions);
        
        while (currentDate <= endDate) {
            const dateStr = dateHelper.toUTCString(currentDate);
            
            // Per calendaris d'estudi: només dies laborals que no estan ocupats pel sistema
            const isValidDay = dateHelper.isWeekday(dateStr) && !occupiedBySystem.has(dateStr);
            
            if (isValidDay) {
                espaiUtil.push(dateStr);
            }
            
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        
        console.log(`[Espai Útil Estudi] Espai útil construït: ${espaiUtil.length} dies disponibles`);
        
        return espaiUtil;
    }
    
    // Cerca radial de slots lliures (CÒPIA EXACTA de la lògica original)
    findNearestFreeSlot(ocupacioMap, indexIdeal) {
        const dates = Array.from(ocupacioMap.keys());
        
        // Assegurar que l'índex està dins dels límits
        if (indexIdeal >= dates.length) indexIdeal = dates.length - 1;
        if (indexIdeal < 0) indexIdeal = 0;
        
        // Comprovar primer la posició ideal
        if (ocupacioMap.get(dates[indexIdeal]) === 'LLIURE') {
            return indexIdeal;
        }
        
        // Cerca radial: alternar entre endavant i enrere
        let radiCerca = 1;
        while (true) {
            const indexEnrere = indexIdeal - radiCerca;
            const indexEndavant = indexIdeal + radiCerca;
            
            // Comprovar enrere primer (preferim mantenir ordre cronològic)
            if (indexEnrere >= 0 && ocupacioMap.get(dates[indexEnrere]) === 'LLIURE') {
                return indexEnrere;
            }
            
            // Comprovar endavant
            if (indexEndavant < dates.length && ocupacioMap.get(dates[indexEndavant]) === 'LLIURE') {
                return indexEndavant;
            }
            
            // Si hem sortit dels límits per ambdós costats, no hi ha slot disponible
            if (indexEnrere < 0 && indexEndavant >= dates.length) {
                return -1;
            }
            
            radiCerca++;
            
            // Seguretat: evitar bucle infinit
            if (radiCerca > dates.length) {
                return -1;
            }
        }
    }
    
    // Detectar data de fi d'avaluacions per calendaris d'estudi
    findPAF1(calendar) {
        console.log(`[PAF Detection] Obtenint PAF1 del calendari: ${calendar.name} (tipus: ${calendar.type})`);
        
        // Usar paf1Date directe si està disponible
        if (calendar.paf1Date) {
            console.log(`[PAF Detection] PAF1 trobat per ${calendar.type}: ${calendar.paf1Date}`);
            return calendar.paf1Date;
        }
        
        // Fallback: usar final de calendari
        console.log(`[PAF Detection] PAF1 no definit per calendari tipus "${calendar.type}". Usant final de calendari: ${calendar.endDate}`);
        return calendar.endDate;
    }
    
    // === NOUS MÈTODES PER MAPEO DIRECTE ===
    
    // Verificar si es pot executar mapeo directe
    canExecuteDirectMapping(professorEvents, espaiOrigen, espaiDesti, respectWeekdays) {
        if (!respectWeekdays) return true; // Si no cal respectar, sempre es pot
        
        // Verificar que hi ha dies coincidents per mapear
        const eventsByDay = replicaHelper.groupEventsByDay(professorEvents);
        
        for (const [originalDate, dayEvents] of eventsByDay) {
            if (!espaiOrigen.includes(originalDate)) continue;
            
            const originalDay = new Date(originalDate).getDay();
            const hasMatchingDay = espaiDesti.some(date => 
                new Date(date).getDay() === originalDay
            );
            
            if (!hasMatchingDay) {
                console.log(`[ESTUDI_REPLICA_SERVICE] No es pot respectar dia ${originalDay} per data ${originalDate}`);
                return false;
            }
        }
        
        return true;
    }
    
    // Executar mapeo directe amb preservació d'agrupacions
    executeDirectMapping(professorEvents, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays) {
        console.log(`[ESTUDI_REPLICA_SERVICE] Executant mapeo directe...`);
        
        // Agrupar esdeveniments per dia
        const eventsByDay = replicaHelper.groupEventsByDay(professorEvents);
        
        if (respectWeekdays) {
            console.log(`[ESTUDI_REPLICA_SERVICE] Mapeo directe: respectant dies setmana`);
            return this.mapWithWeekdayRespect(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar);
        } else {
            console.log(`[ESTUDI_REPLICA_SERVICE] Mapeo directe: per ordre cronològic`);
            return this.mapDirectly(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar);
        }
    }
    
    // Mapeo directe per ordre cronològic
    mapDirectly(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar) {
        const placedEvents = [];
        
        for (const [originalDate, dayEvents] of eventsByDay) {
            const indexOrigen = espaiOrigen.indexOf(originalDate);
            
            if (indexOrigen === -1) {
                console.log(`[ESTUDI_REPLICA_SERVICE] Dia ${originalDate} no està en espai útil d'origen`);
                continue;
            }
            
            // Mateixa posició en destí
            const newDate = espaiDesti[indexOrigen];
            
            console.log(`[ESTUDI_REPLICA_SERVICE] Grup ${originalDate} (${dayEvents.length} events) → ${newDate} (ordre cronològic)`);
            
            // Replicar tots els esdeveniments del grup al mateix dia destí
            dayEvents.forEach(event => {
                const originalCategory = event.getCategory();
                const targetCategory = categoryMap.get(originalCategory?.id);
                
                const replicatedEvent = new CalendariIOC_Event({
                    id: idHelper.generateNextEventId(targetCalendar.id),
                    title: event.title,
                    date: newDate,
                    description: event.description || '',
                    isSystemEvent: event.isSystemEvent || false,
                    category: targetCategory,
                    isReplicated: true,
                    replicatedFrom: event.date
                });
                
                placedEvents.push({
                    event: replicatedEvent,
                    newDate: newDate,
                    sourceCalendar: sourceCalendar,
                    originalDate: event.date,
                    confidence: 99
                });
            });
        }
        
        console.log(`[ESTUDI_REPLICA_SERVICE] Mapeo directe completat: ${placedEvents.length} esdeveniments, 0 no ubicats`);
        
        return { 
            placed: placedEvents, 
            unplaced: []
        };
    }
    
    // Mapeo respectant dies de la setmana amb preservació d'agrupacions
    mapWithWeekdayRespect(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar) {
        console.log(`[ESTUDI_REPLICA_SERVICE] Executant mapeo respectant dies setmana amb agrupacions preservades`);
        
        const placedEvents = [];
        const unplacedEvents = [];
        const usedTargetDates = new Set(); // Per evitar col·lisions
        
        // Ordenar grups de dies per data
        const sortedDayGroups = Array.from(eventsByDay.entries())
            .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));
        
        if (sortedDayGroups.length === 0) {
            return { placed: [], unplaced: [] };
        }
        
        // Trobar primer dia coincident en destí per al primer grup
        const [firstOriginalDate, firstDayEvents] = sortedDayGroups[0];
        const firstOriginalDay = new Date(firstOriginalDate).getDay();
        
        const firstTargetIndex = espaiDesti.findIndex(date => {
            return new Date(date).getDay() === firstOriginalDay;
        });
        
        if (firstTargetIndex === -1) {
            console.log(`[ESTUDI_REPLICA_SERVICE] No es troba dia coincident per ${firstOriginalDate} (dia ${firstOriginalDay}), usant mapeo per índex`);
            return this.mapDirectly(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar);
        }
        
        const baseTargetDate = new Date(espaiDesti[firstTargetIndex]);
        const baseOriginalDate = new Date(firstOriginalDate);
        
        console.log(`[ESTUDI_REPLICA_SERVICE] Base de mapeo: ${firstOriginalDate} (${this.getDayName(firstOriginalDay)}) → ${espaiDesti[firstTargetIndex]} (respectant dies setmana)`);
        
        // Processar cada grup de dies
        for (const [originalDate, dayEvents] of sortedDayGroups) {
            if (!espaiOrigen.includes(originalDate)) {
                console.log(`[ESTUDI_REPLICA_SERVICE] Grup ${originalDate} no està en espai útil d'origen`);
                // Tot el grup va a no ubicats
                dayEvents.forEach(event => {
                    const originalCategory = event.getCategory();
                    const targetCategory = categoryMap.get(originalCategory?.id);
                    
                    const unplacedEvent = new CalendariIOC_Event({
                        id: event.id,
                        title: event.title,
                        date: event.date,
                        description: event.description || '',
                        isSystemEvent: event.isSystemEvent || false,
                        category: targetCategory || originalCategory
                    });
                    
                    unplacedEvents.push({ 
                        event: unplacedEvent,
                        sourceCalendar,
                        reason: "Dia no està en espai útil d'origen" 
                    });
                });
                continue;
            }
            
            // Calcular distància en dies des del primer grup
            const originalDateObj = new Date(originalDate);
            const daysDiff = Math.round((originalDateObj - baseOriginalDate) / (1000 * 60 * 60 * 24));
            
            // Aplicar mateixa distància en destí
            const targetDateObj = new Date(baseTargetDate);
            targetDateObj.setDate(targetDateObj.getDate() + daysDiff);
            const targetDateStr = targetDateObj.toISOString().split('T')[0];
            
            // Verificar que la data destí està dins de l'espai útil i no està ocupada
            if (espaiDesti.includes(targetDateStr) && !usedTargetDates.has(targetDateStr)) {
                // Marcar data com ocupada
                usedTargetDates.add(targetDateStr);
                
                const originalDay = new Date(originalDate).getDay();
                const targetDay = new Date(targetDateStr).getDay();
                
                console.log(`[ESTUDI_REPLICA_SERVICE] Grup ${originalDate} (${this.getDayName(originalDay)}, ${dayEvents.length} events) → ${targetDateStr} (${this.getDayName(targetDay)})`);
                
                // Replicar tot el grup al mateix dia destí
                dayEvents.forEach(event => {
                    const originalCategory = event.getCategory();
                    const targetCategory = categoryMap.get(originalCategory?.id);
                    
                    const replicatedEvent = new CalendariIOC_Event({
                        id: idHelper.generateNextEventId(targetCalendar.id),
                        title: event.title,
                        date: targetDateStr,
                        description: event.description || '',
                        isSystemEvent: event.isSystemEvent || false,
                        category: targetCategory,
                        isReplicated: true,
                        replicatedFrom: originalDate
                    });
                    
                    placedEvents.push({
                        event: replicatedEvent,
                        newDate: targetDateStr,
                        sourceCalendar: sourceCalendar,
                        originalDate: originalDate,
                        confidence: 95
                    });
                });
            } else {
                const reason = !espaiDesti.includes(targetDateStr) 
                    ? "Data calculada fora de l'espai útil de destí" 
                    : "Data destí ja ocupada per altre grup";
                
                console.log(`[ESTUDI_REPLICA_SERVICE] Grup ${originalDate} no es pot ubicar: ${reason}`);
                
                // Tot el grup va a no ubicats
                dayEvents.forEach(event => {
                    const originalCategory = event.getCategory();
                    const targetCategory = categoryMap.get(originalCategory?.id);
                    
                    const unplacedEvent = new CalendariIOC_Event({
                        id: event.id,
                        title: event.title,
                        date: event.date,
                        description: event.description || '',
                        isSystemEvent: event.isSystemEvent || false,
                        category: targetCategory || originalCategory
                    });
                    
                    unplacedEvents.push({ 
                        event: unplacedEvent,
                        sourceCalendar,
                        reason: reason
                    });
                });
            }
        }
        
        console.log(`[ESTUDI_REPLICA_SERVICE] Mapeo respectant dies setmana completat: ${placedEvents.length} esdeveniments ubicats, ${unplacedEvents.length} no ubicats`);
        
        return { 
            placed: placedEvents, 
            unplaced: unplacedEvents
        };
    }
    
    // Helper per obtenir nom del dia
    getDayName(dayNumber) {
        const days = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
        return days[dayNumber] || `Dia-${dayNumber}`;
    }
}