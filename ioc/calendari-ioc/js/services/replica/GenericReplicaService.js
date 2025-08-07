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
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
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
    replicate(sourceCalendar, targetCalendar) {
        console.log(`[GENERIC_REPLICA_SERVICE] Iniciant replicació per calendaris tipus "Altre"...`);
        
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
            const categoryMap = this.replicateRequiredCategories(professorEvents, targetCalendar);
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
                    unplaced: professorEvents.map(event => ({ 
                        event: event, // Mantenir instància original
                        sourceCalendar,
                        reason: "Calendari destí sense espai útil disponible" 
                    })) 
                };
            }
            
            // Decidir estratègia segons comparació d'espais
            if (espaiUtilDesti.length >= espaiUtilOrigen.length) {
                console.log(`[GENERIC_REPLICA_SERVICE] Espai destí igual o superior: aplicant còpia directa/expansió`);
                return this.executeDirectOrExpansion(professorEvents, espaiUtilOrigen, espaiUtilDesti, sourceCalendar, categoryMap, targetCalendar);
            } else {
                console.log(`[GENERIC_REPLICA_SERVICE] Espai destí menor: aplicant compressió per grups`);
                return this.executeCompressionReplication(professorEvents, espaiUtilOrigen, espaiUtilDesti, sourceCalendar, categoryMap, targetCalendar);
            }
            
        } catch (error) {
            console.error(`[GENERIC_REPLICA_SERVICE] Error durant la replicació:`, error);
            console.error(`[GENERIC_REPLICA_SERVICE] Stack trace:`, error.stack);
            throw new CalendariIOCException('207', 'GenericReplicaService.replicate');
        }
    }
    
    // Estratègia per espai destí igual o superior
    executeDirectOrExpansion(professorEvents, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar) {
        console.log(`[GENERIC_REPLICA_SERVICE] Executant còpia directa/expansió...`);
        
        // Agrupar esdeveniments per dia
        const eventsByDay = this.groupEventsByDay(professorEvents);
        
        if (espaiDesti.length === espaiOrigen.length) {
            // Còpia directa dia a dia
            console.log(`[GENERIC_REPLICA_SERVICE] Espais idèntics: còpia directa`);
            return this.mapDirectly(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar);
        } else {
            // Expansió: distribuir grups amb més espai
            console.log(`[GENERIC_REPLICA_SERVICE] Expansió: distribuint grups amb més espai`);
            return this.expandGroups(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar);
        }
    }
    
    // Estratègia per espai destí menor (compressió)
    executeCompressionReplication(professorEvents, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar) {
        console.log(`[GENERIC_REPLICA_SERVICE] Executant compressió per grups...`);
        
        // Agrupar esdeveniments per dia
        const eventsByDay = this.groupEventsByDay(professorEvents);
        
        // Calcular factor de compressió
        const factorCompressio = espaiDesti.length / espaiOrigen.length;
        console.log(`[GENERIC_REPLICA_SERVICE] Factor de compressió: ${factorCompressio.toFixed(3)}`);
        
        // Mapear grups comprimits
        return this.compressGroups(eventsByDay, espaiOrigen, espaiDesti, factorCompressio, sourceCalendar, categoryMap, targetCalendar);
    }
    
    // Agrupar esdeveniments per dia
    groupEventsByDay(events) {
        const groups = new Map();
        events.forEach(event => {
            if (!groups.has(event.date)) {
                groups.set(event.date, []);
            }
            groups.get(event.date).push(event);
        });
        
        console.log(`[GENERIC_REPLICA_SERVICE] Esdeveniments agrupats en ${groups.size} dies diferents`);
        return groups;
    }
    
    // Còpia directa dia a dia (espais idèntics)
    mapDirectly(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar) {
        const placedEvents = [];
        
        for (const [originalDate, dayEvents] of eventsByDay) {
            const indexOrigen = espaiOrigen.indexOf(originalDate);
            
            if (indexOrigen === -1) {
                console.log(`[GENERIC_REPLICA_SERVICE] Dia ${originalDate} no està en espai útil d'origen`);
                continue;
            }
            
            // Mateixa posició en destí
            const newDate = espaiDesti[indexOrigen];
            
            console.log(`[GENERIC_REPLICA_SERVICE] Grup ${originalDate} (${dayEvents.length} events) → ${newDate} (còpia directa)`);
            
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
        
        console.log(`[GENERIC_REPLICA_SERVICE] Còpia directa completada: ${placedEvents.length} esdeveniments, 0 no ubicats`);
        
        return { 
            placed: placedEvents, 
            unplaced: [] // Sempre 0 per còpia directa
        };
    }
    
    // Expansió de grups (espai destí major)
    expandGroups(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar, categoryMap, targetCalendar) {
        const placedEvents = [];
        const factorExpansio = espaiDesti.length / espaiOrigen.length;
        
        console.log(`[GENERIC_REPLICA_SERVICE] Factor d'expansió: ${factorExpansio.toFixed(3)}`);
        
        for (const [originalDate, dayEvents] of eventsByDay) {
            const indexOrigen = espaiOrigen.indexOf(originalDate);
            
            if (indexOrigen === -1) {
                console.log(`[GENERIC_REPLICA_SERVICE] Dia ${originalDate} no està en espai útil d'origen`);
                continue;
            }
            
            // Calcular posició expandida
            const indexExpandit = Math.round(indexOrigen * factorExpansio);
            const indexFinal = Math.min(indexExpandit, espaiDesti.length - 1);
            const newDate = espaiDesti[indexFinal];
            
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
        
        console.log(`[GENERIC_REPLICA_SERVICE] Expansió completada: ${placedEvents.length} esdeveniments, 0 no ubicats`);
        
        return { 
            placed: placedEvents, 
            unplaced: [] // Sempre 0 per expansió
        };
    }
    
    // Compressió de grups (espai destí menor)
    compressGroups(eventsByDay, espaiOrigen, espaiDesti, factorCompressio, sourceCalendar, categoryMap, targetCalendar) {
        const placedEvents = [];
        const unplacedEvents = [];
        const usedDates = new Set(); // Per evitar col·lisions de dates
        
        for (const [originalDate, dayEvents] of eventsByDay) {
            const indexOrigen = espaiOrigen.indexOf(originalDate);
            
            if (indexOrigen === -1) {
                console.log(`[GENERIC_REPLICA_SERVICE] Dia ${originalDate} no està en espai útil d'origen`);
                dayEvents.forEach(event => {
                    unplacedEvents.push({
                        event: event, // Mantenir instància original
                        sourceCalendar,
                        reason: "Dia no està en espai útil d'origen"
                    });
                });
                continue;
            }
            
            // Calcular posició comprimida
            const indexComprimit = Math.round(indexOrigen * factorCompressio);
            let indexFinal = Math.min(indexComprimit, espaiDesti.length - 1);
            
            // Buscar data lliure si ja està ocupada
            while (usedDates.has(espaiDesti[indexFinal]) && indexFinal < espaiDesti.length - 1) {
                indexFinal++;
            }
            
            if (indexFinal >= espaiDesti.length) {
                console.log(`[GENERIC_REPLICA_SERVICE] No hi ha espai per grup ${originalDate}`);
                dayEvents.forEach(event => {
                    unplacedEvents.push({
                        event: event, // Mantenir instància original
                        sourceCalendar,
                        reason: "Sense espai disponible en compressió"
                    });
                });
                continue;
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
}