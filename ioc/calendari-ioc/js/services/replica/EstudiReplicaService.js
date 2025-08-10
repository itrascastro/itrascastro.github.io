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
    
    // Funció principal de replicació (CÒPIA EXACTA de la lògica original)
    replicate(sourceCalendar, targetCalendar) {
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
            
            // Calcular factor de proporció
            const factorProporcio = espaiUtilDesti.length / espaiUtilOrigen.length;
            console.log(`[ESTUDI_REPLICA_SERVICE] Factor de proporció: ${factorProporcio.toFixed(3)}`);
            
            // Mapa d'ocupació del destí
            const ocupacioEspaiDesti = new Map(espaiUtilDesti.map(date => [date, 'LLIURE']));
            
            const placedEvents = [];
            const unplacedEvents = [];
            
            // Bucle principal de replicació
            professorEvents.forEach((event, index) => {
                console.log(`[ESTUDI_REPLICA_SERVICE] Processant (${index + 1}/${professorEvents.length}): "${event.title}"`);
                
                // Trobar posició en espai origen
                const indexOrigen = espaiUtilOrigen.indexOf(event.date);
                
                if (indexOrigen === -1) {
                    console.log(`[ESTUDI_REPLICA_SERVICE] Esdeveniment "${event.title}" no troba posició en espai origen`);
                    
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
                        reason: "Esdeveniment no està en espai útil d'origen" 
                    });
                    return;
                }
                
                // Calcular posició ideal en espai destí
                const indexIdeal = Math.round(indexOrigen * factorProporcio);
                
                // Per calendaris d'estudi: lògica amb cerca de slot lliure
                const indexFinal = this.findNearestFreeSlot(ocupacioEspaiDesti, indexIdeal);
                
                if (indexFinal === -1) {
                    console.log(`[ESTUDI_REPLICA_SERVICE] No es troba slot lliure per "${event.title}"`);
                    
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
                        reason: "Sense slots lliures disponibles" 
                    });
                    return;
                }
                
                // Marcar slot com ocupat
                const newDate = espaiUtilDesti[indexFinal];
                ocupacioEspaiDesti.set(newDate, 'OCUPAT');
                
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
                    confidence: this.calculateProportionalConfidence(indexOrigen, indexIdeal, indexFinal, factorProporcio)
                });
                
                console.log(`[ESTUDI_REPLICA_SERVICE] "${event.title}": ${event.date} → ${newDate} (pos ${indexOrigen + 1}→${indexFinal + 1})`);
            });
            
            console.log(`[ESTUDI_REPLICA_SERVICE] Resultat: ${placedEvents.length} ubicats, ${unplacedEvents.length} no ubicats`);
            console.log(`[ESTUDI_REPLICA_SERVICE] Replicació completada amb èxit`);
            
            return { placed: placedEvents, unplaced: unplacedEvents };
            
        } catch (error) {
            console.error(`[ESTUDI_REPLICA_SERVICE] Error durant la replicació:`, error);
            console.error(`[ESTUDI_REPLICA_SERVICE] Stack trace:`, error.stack);
            throw new CalendariIOCException('207', 'EstudiReplicaService.replicate');
        }
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
}