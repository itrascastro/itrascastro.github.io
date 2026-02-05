/**
 * =================================================================
 * GENERIC REPLICA SERVICE - SERVEI DE REPLICACIÓ PER CALENDARIS GENÈRICS
 * =================================================================
 * 
 * @file        GenericReplicaService.js
 * @description Servei optimitzat per replicació de calendaris tipus "Altre" amb preservació d'agrupacions
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

// CLASSE DE SERVEI DE REPLICACIÓ PER CALENDARIS GENÈRICS: Optimitzat per calendaris "Altre"
class GenericReplicaService extends ReplicaService {
    
    // Funció principal de replicació optimitzada per calendaris "Altre"
    replicate(sourceCalendar, targetCalendar, respectWeekdays = true) {
        console.log(`[GENERIC_REPLICA_SERVICE] Iniciant replicació per calendaris tipus "ALTRE"...`);
        
        try {
            // Filtrar esdeveniments del professor
            const professorEvents = sourceCalendar.events
                .filter(event => !event.isSystemEvent)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            console.log(`[GENERIC_REPLICA_SERVICE] Events del professor a replicar: ${professorEvents.length}`);
            
            if (professorEvents.length === 0) {
                console.log(`[GENERIC_REPLICA_SERVICE] No hi ha events del professor per replicar`);
                return { placed: [], unplaced: [] };
            }
            
            // REPLICAR CATEGORIES NECESSÀRIES PRIMER
            const categoryMap = this.replicateRequiredCategories(professorEvents);
            console.log(`[GENERIC_REPLICA_SERVICE] Categories replicades: ${categoryMap.size}`);
            
            // Construir espais útils
            const espaiUtilOrigen = this.analyzeWorkableSpace(sourceCalendar);
            const espaiUtilDesti = this.analyzeWorkableSpace(targetCalendar);
            
            console.log(`[GENERIC_REPLICA_SERVICE] Espai Origen: ${espaiUtilOrigen.length} dies útils`);
            console.log(`[GENERIC_REPLICA_SERVICE] Espai Destí: ${espaiUtilDesti.length} dies útils`);
            
            if (espaiUtilDesti.length === 0) {
                console.log(`[GENERIC_REPLICA_SERVICE] Calendari destí sense espai útil disponible`);
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
            
            // Decidir estratègia segons comparació d'espais
            if (espaiUtilDesti.length > espaiUtilOrigen.length) {
                console.log(`[GENERIC_REPLICA_SERVICE] Espai destí major: aplicant expansió per grups`);
                return this.executeExpansionReplication(professorEvents, espaiUtilOrigen, espaiUtilDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays);
            }
            
            if (espaiUtilDesti.length === espaiUtilOrigen.length) {
                console.log(`[GENERIC_REPLICA_SERVICE] Espai destí igual: aplicant còpia directa 1:1`);
                return this.executeDirectMapping(professorEvents, espaiUtilOrigen, espaiUtilDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays);
            }
            
            console.log(`[GENERIC_REPLICA_SERVICE] Espai destí menor: aplicant compressió per grups`);
            return this.executeCompressionReplication(professorEvents, espaiUtilOrigen, espaiUtilDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays);
            
        } catch (error) {
            console.error(`[GENERIC_REPLICA_SERVICE] Error durant la replicació:`, error);
            console.error(`[GENERIC_REPLICA_SERVICE] Stack trace:`, error.stack);
            throw new CalendariIOCException('207', 'GenericReplicaService.replicate');
        }
    }
    
    // Estratègia per espai destí igual o superior - sempre mapeo directe 1:1
    executeDirectMapping(professorEvents, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays = true) {
        console.log(`[GENERIC_REPLICA_SERVICE] Executant còpia directa 1:1...`);
        
        // Agrupar esdeveniments per dia
        const eventsByDay = replicaHelper.groupEventsByDay(professorEvents);
        
        // Sempre usar mapeo directe independentment de la mida del destí
        const isSameTimeline = espaiOrigen.length === espaiDesti.length &&
            espaiOrigen.every((date, index) => date === espaiDesti[index]);
        const useWeekdays = respectWeekdays && !isSameTimeline;
        console.log(`[GENERIC_REPLICA_SERVICE] Mapeo directe: ${useWeekdays ? 'respectant dies setmana' : 'per ordre cronològic'}`);
        return this.mapDirectly(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar, useWeekdays);
    }
    
    // Estratègia per espai destí menor (compressió)
    executeCompressionReplication(professorEvents, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays) {
        console.log(`[GENERIC_REPLICA_SERVICE] Executant compressió per grups...`);
        
        // Agrupar esdeveniments per dia
        const eventsByDay = replicaHelper.groupEventsByDay(professorEvents);
        
        // Calcular factor de compressió
        const factorCompressio = espaiDesti.length / espaiOrigen.length;
        console.log(`[GENERIC_REPLICA_SERVICE] Factor de compressió: ${factorCompressio.toFixed(3)}`);
        
        // Mapear grups comprimits
        return this.compressGroups(eventsByDay, espaiOrigen, espaiDesti, factorCompressio, sourceCalendar, categoryMap, targetCalendar, respectWeekdays);
    }
    
    // Estratègia per espai destí major (expansió)
    executeExpansionReplication(professorEvents, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays) {
        console.log(`[GENERIC_REPLICA_SERVICE] Executant expansió per grups...`);
        
        // Agrupar esdeveniments per dia
        const eventsByDay = replicaHelper.groupEventsByDay(professorEvents);
        
        return this.expandGroups(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays);
    }
    
    // Còpia directa dia a dia amb opció de respectar dies de la setmana
    mapDirectly(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays = true) {
        const placedEvents = [];
        const unplacedEvents = [];
        
        if (respectWeekdays) {
            return this.mapWithWeekdayRespect(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar);
        }
        
        // Mapeo original per índex per retrocompatibilitat
        for (const [originalDate, dayEvents] of eventsByDay) {
            const indexOrigen = espaiOrigen.indexOf(originalDate);
            
            if (indexOrigen === -1) {
                console.log(`[GENERIC_REPLICA_SERVICE] Dia ${originalDate} no està en espai útil d'origen`);
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
            
            // Mateixa posició en destí
            const newDate = espaiDesti[indexOrigen];
            if (!newDate) {
                console.log(`[GENERIC_REPLICA_SERVICE] Sense data destí per grup ${originalDate}`);
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
                        reason: "Sense data destí disponible"
                    });
                });
                continue;
            }
            
            console.log(`[GENERIC_REPLICA_SERVICE] Grup ${originalDate} (${dayEvents.length} events) → ${newDate} (ordre cronològic)`);
            
            // Replicar tots els esdeveniments del grup al mateix dia destí
            dayEvents.forEach(event => {
                // FASE 3: Crear instància CalendariIOC_Event directament
                const originalCategory = event.getCategory();
                const targetCategory = categoryMap.get(originalCategory?.id);
                
                const replicatedEvent = new CalendariIOC_Event({
                    id: idHelper.generateNextEventId(targetCalendar.id),
                    title: event.title,
                    date: newDate,
                    description: event.description || '',
                    isSystemEvent: event.isSystemEvent || false,
                    category: targetCategory, // Usar categoria del mapa
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
        
        console.log(`[GENERIC_REPLICA_SERVICE] Còpia per ordre cronològic completada: ${placedEvents.length} esdeveniments, ${unplacedEvents.length} no ubicats`);
        
        return { 
            placed: placedEvents, 
            unplaced: unplacedEvents
        };
    }
    
    // Mapeo respectant dies de la setmana amb algoritme de distàncies
    mapWithWeekdayRespect(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar) {
        const placedEvents = [];
        const unplacedEvents = [];
        const allEvents = [];
        
        // Recollir tots els esdeveniments amb les seves dates originals
        for (const [originalDate, dayEvents] of eventsByDay) {
            dayEvents.forEach(event => {
                allEvents.push({ originalDate, event });
            });
        }
        
        // Ordenar per data original
        allEvents.sort((a, b) => new Date(a.originalDate) - new Date(b.originalDate));
        
        if (allEvents.length === 0) {
            return { placed: [], unplaced: [] };
        }
        
        // Trobar primer dia coincident en destí
        const firstEventDate = allEvents[0].originalDate;
        const firstEventDay = new Date(firstEventDate).getDay();
        
        const firstTargetIndex = espaiDesti.findIndex(date => {
            return new Date(date).getDay() === firstEventDay;
        });
        
        if (firstTargetIndex === -1) {
            console.log(`[GENERIC_REPLICA_SERVICE] No es troba dia coincident per ${firstEventDate}; fent fallback a mapeo cronològic`);
            return this.mapDirectly(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar, false);
        }
        
        const baseTargetDate = new Date(espaiDesti[firstTargetIndex]);
        const baseOriginalDate = new Date(firstEventDate);
        
        console.log(`[GENERIC_REPLICA_SERVICE] Base de mapeo: ${firstEventDate} → ${espaiDesti[firstTargetIndex]} (respectant dies setmana)`);
        
        // Aplicar distàncies a tots els esdeveniments
        allEvents.forEach(({originalDate, event}) => {
            // Calcular distància en dies des de l'esdeveniment base
            const originalDateObj = new Date(originalDate);
            const daysDiff = Math.round((originalDateObj - baseOriginalDate) / (1000 * 60 * 60 * 24));
            
            // Aplicar mateixa distància en destí
            const targetDateObj = new Date(baseTargetDate);
            targetDateObj.setDate(targetDateObj.getDate() + daysDiff);
            const targetDateStr = targetDateObj.toISOString().split('T')[0];
            
            // Verificar que la data destí està dins de l'espai útil
            if (espaiDesti.includes(targetDateStr)) {
                // FASE 3: Crear instància CalendariIOC_Event directament
                const originalCategory = event.getCategory();
                const targetCategory = categoryMap.get(originalCategory?.id);
                
                const replicatedEvent = new CalendariIOC_Event({
                    id: idHelper.generateNextEventId(targetCalendar.id),
                    title: event.title,
                    date: targetDateStr,
                    description: event.description || '',
                    isSystemEvent: event.isSystemEvent || false,
                    category: targetCategory, // Usar categoria del mapa
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
                
                console.log(`[GENERIC_REPLICA_SERVICE] "${event.title}": ${originalDate} → ${targetDateStr} (distància: ${daysDiff} dies)`);
            } else {
                console.log(`[GENERIC_REPLICA_SERVICE] Data ${targetDateStr} fora de l'espai útil per esdeveniment "${event.title}"`);
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
                    reason: "Data calculada fora de l'espai útil de destí"
                });
            }
        });
        
        console.log(`[GENERIC_REPLICA_SERVICE] Mapeo respectant dies setmana completat: ${placedEvents.length} esdeveniments ubicats, ${unplacedEvents.length} no ubicats`);
        
        return { 
            placed: placedEvents, 
            unplaced: unplacedEvents
        };
    }
    
    // Expansió de grups (espai destí major)
    expandGroups(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays) {
        const placedEvents = [];
        const unplacedEvents = [];
        const usedDates = new Set();
        const factorExpansio = espaiDesti.length / espaiOrigen.length;
        
        console.log(`[GENERIC_REPLICA_SERVICE] Factor d'expansió: ${factorExpansio.toFixed(3)}`);
        
        for (const [originalDate, dayEvents] of eventsByDay) {
            const indexOrigen = espaiOrigen.indexOf(originalDate);
            
            if (indexOrigen === -1) {
                console.log(`[GENERIC_REPLICA_SERVICE] Dia ${originalDate} no està en espai útil d'origen`);
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
            
            // Calcular posició expandida
            const indexExpandit = Math.round(indexOrigen * factorExpansio);
            let indexFinal = Math.min(indexExpandit, espaiDesti.length - 1);
            
            if (respectWeekdays) {
                const originalWeekday = new Date(originalDate).getDay();
                indexFinal = this.findNearestWeekdaySlot(espaiDesti, indexFinal, originalWeekday, usedDates);
                
                if (indexFinal === -1) {
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
                            reason: "Sense dia de setmana compatible en expansió"
                        });
                    });
                    continue;
                }
            }
            
            const newDate = espaiDesti[indexFinal];
            if (respectWeekdays) {
                usedDates.add(newDate);
            }
            
            console.log(`[GENERIC_REPLICA_SERVICE] Grup ${originalDate} (${dayEvents.length} events) → ${newDate} (expansió)`);
            
            // Replicar tots els esdeveniments del grup al mateix dia destí
            dayEvents.forEach(event => {
                // FASE 3: Crear instància CalendariIOC_Event directament
                const originalCategory = event.getCategory();
                const targetCategory = categoryMap.get(originalCategory?.id);
                
                const replicatedEvent = new CalendariIOC_Event({
                    id: idHelper.generateNextEventId(targetCalendar.id),
                    title: event.title,
                    date: newDate,
                    description: event.description || '',
                    isSystemEvent: event.isSystemEvent || false,
                    category: targetCategory, // Usar categoria del mapa
                    isReplicated: true,
                    replicatedFrom: event.date
                });
                
                placedEvents.push({
                    event: replicatedEvent,
                    newDate: newDate,
                    sourceCalendar: sourceCalendar,
                    originalDate: event.date,
                    confidence: this.calculateProportionalConfidence(indexOrigen, indexExpandit, indexFinal, factorExpansio)
                });
            });
        }
        
        console.log(`[GENERIC_REPLICA_SERVICE] Expansió completada: ${placedEvents.length} esdeveniments, ${unplacedEvents.length} no ubicats`);
        
        return { 
            placed: placedEvents, 
            unplaced: unplacedEvents
        };
    }
    
    // Compressió de grups (espai destí menor)
    compressGroups(eventsByDay, espaiOrigen, espaiDesti, factorCompressio, sourceCalendar, categoryMap, targetCalendar, respectWeekdays) {
        const placedEvents = [];
        const unplacedEvents = [];
        const usedDates = new Set(); // Per evitar col·lisions de dates
        
        for (const [originalDate, dayEvents] of eventsByDay) {
            const indexOrigen = espaiOrigen.indexOf(originalDate);
            
            if (indexOrigen === -1) {
                console.log(`[GENERIC_REPLICA_SERVICE] Dia ${originalDate} no està en espai útil d'origen`);
                dayEvents.forEach(event => {
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
                    
                    unplacedEvents.push({
                        event: unplacedEvent,
                        sourceCalendar,
                        reason: "Dia no està en espai útil d'origen"
                    });
                });
                continue;
            }
            
            // Calcular posició comprimida
            const indexComprimit = Math.round(indexOrigen * factorCompressio);
            let indexFinal = Math.min(indexComprimit, espaiDesti.length - 1);
            
            if (respectWeekdays) {
                const originalWeekday = new Date(originalDate).getDay();
                indexFinal = this.findNearestWeekdaySlot(espaiDesti, indexFinal, originalWeekday, usedDates);
                
                if (indexFinal === -1) {
                    console.log(`[GENERIC_REPLICA_SERVICE] No hi ha espai compatible per grup ${originalDate}`);
                    dayEvents.forEach(event => {
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
                        
                        unplacedEvents.push({
                            event: unplacedEvent,
                            sourceCalendar,
                            reason: "Sense dia de setmana compatible en compressió"
                        });
                    });
                    continue;
                }
            } else {
                // Buscar data lliure si ja està ocupada
                while (usedDates.has(espaiDesti[indexFinal]) && indexFinal < espaiDesti.length - 1) {
                    indexFinal++;
                }
                
                if (indexFinal >= espaiDesti.length) {
                    console.log(`[GENERIC_REPLICA_SERVICE] No hi ha espai per grup ${originalDate}`);
                    dayEvents.forEach(event => {
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
                        
                        unplacedEvents.push({
                            event: unplacedEvent,
                            sourceCalendar,
                            reason: "Sense espai disponible en compressió"
                        });
                    });
                    continue;
                }
            }
            
            const newDate = espaiDesti[indexFinal];
            usedDates.add(newDate);
            
            console.log(`[GENERIC_REPLICA_SERVICE] Grup ${originalDate} (${dayEvents.length} events) → ${newDate} (compressió)`);
            
            // Replicar tots els esdeveniments del grup al mateix dia destí
            dayEvents.forEach(event => {
                // FASE 3: Crear instància CalendariIOC_Event directament
                const originalCategory = event.getCategory();
                const targetCategory = categoryMap.get(originalCategory?.id);
                
                const replicatedEvent = new CalendariIOC_Event({
                    id: idHelper.generateNextEventId(targetCalendar.id),
                    title: event.title,
                    date: newDate,
                    description: event.description || '',
                    isSystemEvent: event.isSystemEvent || false,
                    category: targetCategory, // Usar categoria del mapa
                    isReplicated: true,
                    replicatedFrom: event.date
                });
                
                placedEvents.push({
                    event: replicatedEvent,
                    newDate: newDate,
                    sourceCalendar: sourceCalendar,
                    originalDate: event.date,
                    confidence: this.calculateProportionalConfidence(indexOrigen, indexComprimit, indexFinal, factorCompressio)
                });
            });
        }
        
        console.log(`[GENERIC_REPLICA_SERVICE] Compressió completada: ${placedEvents.length} ubicats, ${unplacedEvents.length} no ubicats`);
        
        return { placed: placedEvents, unplaced: unplacedEvents };
    }
    
    // Cerca radial de data lliure amb el mateix dia de la setmana
    findNearestWeekdaySlot(espaiDesti, indexIdeal, weekday, usedDates) {
        if (!espaiDesti.length) return -1;
        
        let index = indexIdeal;
        if (index >= espaiDesti.length) index = espaiDesti.length - 1;
        if (index < 0) index = 0;
        
        const isValid = (idx) => {
            const dateStr = espaiDesti[idx];
            if (!dateStr) return false;
            if (usedDates.has(dateStr)) return false;
            return new Date(dateStr).getDay() === weekday;
        };
        
        if (isValid(index)) return index;
        
        let radius = 1;
        while (true) {
            const back = index - radius;
            const forward = index + radius;
            
            if (back >= 0 && isValid(back)) return back;
            if (forward < espaiDesti.length && isValid(forward)) return forward;
            
            if (back < 0 && forward >= espaiDesti.length) return -1;
            
            radius++;
            if (radius > espaiDesti.length) return -1;
        }
    }
}
