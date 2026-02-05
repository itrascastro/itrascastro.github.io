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
 * @project     Calendari IOC
 * @repository  https://github.com/itrascastro/calendari-ioc
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
            const professorEvents = this.getReplicableProfessorEvents(sourceCalendar);
            
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
            return this.executeCompressionMapping(professorEvents, espaiUtilOrigen, espaiUtilDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays);
        } catch (error) {
            console.error(`[ESTUDI_REPLICA_SERVICE] Error durant la replicació:`, error);
            console.error(`[ESTUDI_REPLICA_SERVICE] Stack trace:`, error.stack);
            throw new CalendariIOCException('207', 'EstudiReplicaService.replicate');
        }
    }

    getReplicableProfessorEvents(sourceCalendar) {
        const sourceClassesStart = this.getClassesStartDate(sourceCalendar);
        return sourceCalendar.events
            .filter(event => !event.isSystemEvent)
            // Replicar a partir d'obertura d'aules; només permetre enunciats abans
            .filter(event => {
                if (!sourceClassesStart) return true;
                if (this.isCoordinationEnunciat(event)) return true;
                return event.date >= sourceClassesStart;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    // Mètode de compressió amb agrupació preservada (SEMPRE agrupar esdeveniments del mateix dia)
    executeCompressionMapping(professorEvents, espaiUtilOrigen, espaiUtilDesti, sourceCalendar, categoryMap, targetCalendar, respectWeekdays) {
        console.log(`[ESTUDI_REPLICA_SERVICE] Executant compressió amb agrupació preservada...`);
        
        // SEMPRE agrupar esdeveniments per dia primer
        const eventsByDay = replicaHelper.groupEventsByDay(professorEvents);
        
        // Calcular factor de proporció
        const factorProporcio = espaiUtilDesti.length / espaiUtilOrigen.length;
        console.log(`[ESTUDI_REPLICA_SERVICE] Factor de proporció: ${factorProporcio.toFixed(3)}`);
        
        // Mapa d'ocupació del destí
        const ocupacioEspaiDesti = new Map(espaiUtilDesti.map(date => [date, 'LLIURE']));
        const targetClassesStart = this.getClassesStartDate(targetCalendar) || targetCalendar.startDate;
        const forcedAssignments = this.buildForcedAssignments(professorEvents, eventsByDay, espaiUtilDesti, targetCalendar, targetClassesStart);
        
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
            
            // Assignació forçada per preservar patrons del primer EAC
            if (forcedAssignments.has(originalDate)) {
                let forcedDate = forcedAssignments.get(originalDate);
                if (!this.isCoordinationEnunciatGroup(dayEvents) && targetClassesStart && forcedDate < targetClassesStart) {
                    const adjusted = this.findFirstAvailableOnOrAfter(ocupacioEspaiDesti, targetClassesStart);
                    if (adjusted) {
                        forcedDate = adjusted;
                    }
                }
                const forcedIsInSpace = ocupacioEspaiDesti.has(forcedDate);
                const forcedAvailable = forcedIsInSpace ? ocupacioEspaiDesti.get(forcedDate) === 'LLIURE' : true;

                if (forcedAvailable) {
                    if (forcedIsInSpace) {
                        ocupacioEspaiDesti.set(forcedDate, 'OCUPAT');
                    }

                    console.log(`[ESTUDI_REPLICA_SERVICE] Grup ${originalDate} → ${forcedDate}: assignació forçada`);

                    dayEvents.forEach(event => {
                        const originalCategory = event.getCategory();
                        const targetCategory = categoryMap.get(originalCategory?.id);

                        const replicatedEvent = new CalendariIOC_Event({
                            id: idHelper.generateNextEventId(targetCalendar.id),
                            title: event.title,
                            date: forcedDate,
                            description: event.description || '',
                            isSystemEvent: event.isSystemEvent || false,
                            category: targetCategory,
                            isReplicated: true,
                            replicatedFrom: event.date
                        });

                        placedEvents.push({
                            event: replicatedEvent,
                            newDate: forcedDate,
                            sourceCalendar: sourceCalendar,
                            originalDate: event.date,
                            confidence: 99
                        });
                    });
                    continue;
                }
            }

            // Calcular posició ideal en espai destí per al grup
            const indexIdeal = Math.round(indexOrigen * factorProporcio);
            
            // Buscar slot lliure per a tot el grup, prioritzant mateix dia setmana
            let indexFinal = -1;
            if (respectWeekdays) {
                const weekday = new Date(originalDate).getDay();
                indexFinal = this.findNearestFreeWeekdaySlot(ocupacioEspaiDesti, indexIdeal, weekday);
            }
            
            if (indexFinal === -1) {
                indexFinal = this.findNearestFreeSlot(ocupacioEspaiDesti, indexIdeal);
            }
            
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
            let newDate = espaiUtilDesti[indexFinal];
            if (!this.isCoordinationEnunciatGroup(dayEvents) && targetClassesStart && newDate < targetClassesStart) {
                const adjusted = this.findFirstAvailableOnOrAfter(ocupacioEspaiDesti, targetClassesStart);
                if (adjusted) {
                    newDate = adjusted;
                }
            }
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

    // === REGLA ESPECIAL: PRIMER EAC ===

    buildForcedAssignments(professorEvents, eventsByDay, espaiUtilDesti, targetCalendar, targetClassesStart) {
        const forced = new Map();

        const classesStartDate = targetClassesStart || this.getClassesStartDate(targetCalendar);
        if (!classesStartDate) {
            return forced;
        }

        const firstEnunciat = this.findFirstEventDate(professorEvents, /enunciat.*coordinaci/i);
        const firstPublicacio = this.findFirstEventDate(professorEvents, /publicaci\\w*\\s+EAC/i);

        if (firstPublicacio) {
            forced.set(firstPublicacio, classesStartDate);
        }

        if (firstEnunciat) {
            if (firstEnunciat === firstPublicacio) {
                console.log('[ESTUDI_REPLICA_SERVICE] Enunciat i publicació comparteixen data; prioritzant publicació');
                return forced;
            }

            const previousAvailable = this.findPreviousAvailableDate(espaiUtilDesti, classesStartDate);
            if (previousAvailable && previousAvailable !== classesStartDate) {
                forced.set(firstEnunciat, previousAvailable);
            }
        }

        return forced;
    }

    findFirstEventDate(events, pattern) {
        for (const event of events) {
            const title = this.normalizeText(event.title || '');
            if (pattern.test(title)) {
                return event.date;
            }
        }
        return null;
    }

    getClassesStartDate(calendar) {
        const startEvent = calendar.events.find(e =>
            e.isSystemEvent &&
            typeof e.title === 'string' &&
            e.title.toLowerCase().includes("obertura d'aules de mòduls i crèdits")
        );
        if (!startEvent) return null;
        return startEvent.date;
    }

    isCoordinationEnunciat(event) {
        const title = this.normalizeText(event?.title || '');
        return title.includes('enunciat') && title.includes('coordinaci');
    }

    isCoordinationEnunciatGroup(dayEvents) {
        if (!Array.isArray(dayEvents) || dayEvents.length === 0) return false;
        return dayEvents.every(event => this.isCoordinationEnunciat(event));
    }

    normalizeText(text) {
        return (text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    findFirstAvailableOnOrAfter(ocupacioMap, startDateStr) {
        if (!startDateStr) return null;
        for (const dateStr of ocupacioMap.keys()) {
            if (dateStr >= startDateStr && ocupacioMap.get(dateStr) === 'LLIURE') {
                return dateStr;
            }
        }
        return null;
    }

    findFirstAvailableOnOrAfterInList(espaiDesti, startDateStr, usedTargetDates) {
        if (!startDateStr) return null;
        for (const dateStr of espaiDesti) {
            if (dateStr >= startDateStr && !usedTargetDates.has(dateStr)) {
                return dateStr;
            }
        }
        return null;
    }

    findPreviousAvailableDate(espaiDesti, targetDateStr) {
        if (!espaiDesti.length || !targetDateStr) return null;
        for (let i = espaiDesti.length - 1; i >= 0; i--) {
            if (espaiDesti[i] < targetDateStr) {
                return espaiDesti[i];
            }
        }
        return null;
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

    // Cerca radial de slots lliures amb el mateix dia de la setmana
    findNearestFreeWeekdaySlot(ocupacioMap, indexIdeal, weekday) {
        const dates = Array.from(ocupacioMap.keys());
        
        if (indexIdeal >= dates.length) indexIdeal = dates.length - 1;
        if (indexIdeal < 0) indexIdeal = 0;
        
        const isValid = (idx) => {
            const dateStr = dates[idx];
            if (ocupacioMap.get(dateStr) !== 'LLIURE') return false;
            return new Date(dateStr).getDay() === weekday;
        };
        
        if (isValid(indexIdeal)) {
            return indexIdeal;
        }
        
        let radiCerca = 1;
        while (true) {
            const indexEnrere = indexIdeal - radiCerca;
            const indexEndavant = indexIdeal + radiCerca;
            
            if (indexEnrere >= 0 && isValid(indexEnrere)) {
                return indexEnrere;
            }
            
            if (indexEndavant < dates.length && isValid(indexEndavant)) {
                return indexEndavant;
            }
            
            if (indexEnrere < 0 && indexEndavant >= dates.length) {
                return -1;
            }
            
            radiCerca++;
            if (radiCerca > dates.length) {
                return -1;
            }
        }
    }
    
    // Cerca la data disponible mes propera (anterior o següent)
    findNearestAvailableDate(espaiDesti, targetDateStr, usedTargetDates) {
        if (!espaiDesti.length) return null;
        
        const target = new Date(targetDateStr);
        let bestDate = null;
        let bestDiff = Infinity;
        
        for (const dateStr of espaiDesti) {
            if (usedTargetDates.has(dateStr)) continue;
            const candidate = new Date(dateStr);
            const diff = Math.abs(candidate - target);
            
            if (diff < bestDiff) {
                bestDiff = diff;
                bestDate = dateStr;
            } else if (diff === bestDiff && bestDate && candidate < new Date(bestDate)) {
                bestDate = dateStr;
            }
        }
        
        return bestDate;
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
        const ocupacioEspaiDesti = new Map(espaiDesti.map(date => [date, 'LLIURE']));
        const targetClassesStart = this.getClassesStartDate(targetCalendar) || targetCalendar.startDate;
        
        for (const [originalDate, dayEvents] of eventsByDay) {
            const indexOrigen = espaiOrigen.indexOf(originalDate);
            
            if (indexOrigen === -1) {
                console.log(`[ESTUDI_REPLICA_SERVICE] Dia ${originalDate} no està en espai útil d'origen`);
                continue;
            }
            
            // Mateixa posició en destí
            let newDate = espaiDesti[indexOrigen];
            if (!this.isCoordinationEnunciatGroup(dayEvents) && targetClassesStart && newDate < targetClassesStart) {
                const adjusted = this.findFirstAvailableOnOrAfter(ocupacioEspaiDesti, targetClassesStart);
                if (adjusted) {
                    newDate = adjusted;
                }
            }
            ocupacioEspaiDesti.set(newDate, 'OCUPAT');
            
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
        const targetClassesStart = this.getClassesStartDate(targetCalendar) || targetCalendar.startDate;
        
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
        
        let baseTargetDate;
        if (firstTargetIndex === -1) {
            const fallbackDateStr = this.findNearestAvailableDate(espaiDesti, firstOriginalDate, usedTargetDates);
            if (!fallbackDateStr) {
                console.log(`[ESTUDI_REPLICA_SERVICE] Sense dates disponibles per iniciar mapeo de ${firstOriginalDate}`);
                return { placed: [], unplaced: [] };
            }
            console.log(`[ESTUDI_REPLICA_SERVICE] No es troba dia coincident per ${firstOriginalDate} (dia ${firstOriginalDay}), usant data propera ${fallbackDateStr}`);
            baseTargetDate = new Date(fallbackDateStr);
        } else {
            baseTargetDate = new Date(espaiDesti[firstTargetIndex]);
        }
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
            let effectiveTarget = targetDateStr;
            if (!this.isCoordinationEnunciatGroup(dayEvents) && targetClassesStart && effectiveTarget < targetClassesStart) {
                const adjusted = this.findFirstAvailableOnOrAfterInList(espaiDesti, targetClassesStart, usedTargetDates);
                if (adjusted) {
                    effectiveTarget = adjusted;
                }
            }

            if (espaiDesti.includes(effectiveTarget) && !usedTargetDates.has(effectiveTarget)) {
                // Marcar data com ocupada
                usedTargetDates.add(effectiveTarget);
                
                const originalDay = new Date(originalDate).getDay();
                const targetDay = new Date(effectiveTarget).getDay();
                
                console.log(`[ESTUDI_REPLICA_SERVICE] Grup ${originalDate} (${this.getDayName(originalDay)}, ${dayEvents.length} events) → ${effectiveTarget} (${this.getDayName(targetDay)})`);
                
                // Replicar tot el grup al mateix dia destí
                dayEvents.forEach(event => {
                    const originalCategory = event.getCategory();
                    const targetCategory = categoryMap.get(originalCategory?.id);
                    
                    const replicatedEvent = new CalendariIOC_Event({
                        id: idHelper.generateNextEventId(targetCalendar.id),
                        title: event.title,
                        date: effectiveTarget,
                        description: event.description || '',
                        isSystemEvent: event.isSystemEvent || false,
                        category: targetCategory,
                        isReplicated: true,
                        replicatedFrom: originalDate
                    });
                    
                    placedEvents.push({
                        event: replicatedEvent,
                        newDate: effectiveTarget,
                        sourceCalendar: sourceCalendar,
                        originalDate: originalDate,
                        confidence: 95
                    });
                });
            } else {
                let fallbackDateStr = null;
                if (!this.isCoordinationEnunciatGroup(dayEvents) && targetClassesStart) {
                    fallbackDateStr = this.findFirstAvailableOnOrAfterInList(espaiDesti, targetClassesStart, usedTargetDates);
                } else {
                    fallbackDateStr = this.findNearestAvailableDate(espaiDesti, effectiveTarget, usedTargetDates);
                }
                if (fallbackDateStr) {
                    usedTargetDates.add(fallbackDateStr);
                    const originalDay = new Date(originalDate).getDay();
                    const targetDay = new Date(fallbackDateStr).getDay();
                    
                    console.log(`[ESTUDI_REPLICA_SERVICE] Grup ${originalDate} (${this.getDayName(originalDay)}) → ${fallbackDateStr} (${this.getDayName(targetDay)}) [fallback proper]`);
                    
                    dayEvents.forEach(event => {
                        const originalCategory = event.getCategory();
                        const targetCategory = categoryMap.get(originalCategory?.id);
                        
                        const replicatedEvent = new CalendariIOC_Event({
                            id: idHelper.generateNextEventId(targetCalendar.id),
                            title: event.title,
                            date: fallbackDateStr,
                            description: event.description || '',
                            isSystemEvent: event.isSystemEvent || false,
                            category: targetCategory,
                            isReplicated: true,
                            replicatedFrom: originalDate
                        });
                        
                        placedEvents.push({
                            event: replicatedEvent,
                            newDate: fallbackDateStr,
                            sourceCalendar: sourceCalendar,
                            originalDate: originalDate,
                            confidence: 80
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
