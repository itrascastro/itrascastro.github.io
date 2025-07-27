/**
 * =================================================================
 * ESTUDI REPLICA SERVICE - SERVEI DE REPLICACIÓ PER CALENDARIS D'ESTUDI
 * =================================================================
 * 
 * @file        EstudiReplicaService.js
 * @description Servei per replicació proporcional d'esdeveniments entre calendaris d'estudi (FP/BTX)
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

// CLASSE DE SERVEI DE REPLICACIÓ PER CALENDARIS D'ESTUDI: Implementa algoritme proporcional per FP/BTX
class EstudiReplicaService extends ReplicaService {
    
    // Funció principal de replicació (CÒPIA EXACTA de la lògica original)
    replicate(sourceCalendar, targetCalendar) {
        console.log(`[ESTUDI_REPLICA_SERVICE] Iniciant replicació...`);
        
        try {
            // Validació bàsica
            if (!sourceCalendar?.events || !targetCalendar?.startDate || !targetCalendar?.endDate) {
                throw new Error('Calendaris invàlids: manca estructura bàsica');
            }
            
            // Filtrar esdeveniments del professor
            const professorEvents = sourceCalendar.events
                .filter(event => !event.isSystemEvent)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            console.log(`[ESTUDI_REPLICA_SERVICE] Events del professor a replicar: ${professorEvents.length}`);
            
            if (professorEvents.length === 0) {
                console.log(`[ESTUDI_REPLICA_SERVICE] No hi ha events del professor per replicar`);
                return { placed: [], unplaced: [] };
            }
            
            // Construir espais útils
            const espaiUtilOrigen = this.analyzeWorkableSpaceEstudi(sourceCalendar);
            const espaiUtilDesti = this.analyzeWorkableSpaceEstudi(targetCalendar);
            
            console.log(`[ESTUDI_REPLICA_SERVICE] Espai Origen: ${espaiUtilOrigen.length} dies útils`);
            console.log(`[ESTUDI_REPLICA_SERVICE] Espai Destí: ${espaiUtilDesti.length} dies útils`);
            
            if (espaiUtilDesti.length === 0) {
                console.warn(`[ESTUDI_REPLICA_SERVICE] Calendari destí sense espai útil disponible`);
                return { 
                    placed: [], 
                    unplaced: professorEvents.map(event => ({ 
                        event: { ...event, replicationConfidence: 0 }, 
                        sourceCalendar,
                        reason: "Calendari destí sense espai útil disponible" 
                    })) 
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
                    console.warn(`[ESTUDI_REPLICA_SERVICE] Esdeveniment "${event.title}" no troba posició en espai origen`);
                    unplacedEvents.push({ 
                        event: { ...event, replicationConfidence: 0 }, 
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
                    console.warn(`[ESTUDI_REPLICA_SERVICE] No es troba slot lliure per "${event.title}"`);
                    unplacedEvents.push({ 
                        event: { ...event, replicationConfidence: 0 }, 
                        sourceCalendar,
                        reason: "Sense slots lliures disponibles" 
                    });
                    return;
                }
                
                // Marcar slot com ocupat
                const newDate = espaiUtilDesti[indexFinal];
                ocupacioEspaiDesti.set(newDate, 'OCUPAT');
                
                // Crear esdeveniment replicat
                const replicatedEvent = {
                    ...event,
                    id: idHelper.generateNextEventId(appStateManager.currentCalendarId),
                    date: newDate,
                    isReplicated: true,
                    originalDate: event.date,
                    replicationConfidence: this.calculateProportionalConfidence(indexOrigen, indexIdeal, indexFinal, factorProporcio)
                };
                
                placedEvents.push({
                    event: replicatedEvent,
                    newDate: newDate,
                    sourceCalendar: sourceCalendar,
                    originalDate: event.date,
                    confidence: replicatedEvent.replicationConfidence
                });
                
                console.log(`[ESTUDI_REPLICA_SERVICE] "${event.title}": ${event.date} → ${newDate} (pos ${indexOrigen + 1}→${indexFinal + 1})`);
            });
            
            console.log(`[ESTUDI_REPLICA_SERVICE] Resultat: ${placedEvents.length} ubicats, ${unplacedEvents.length} no ubicats`);
            
            // Validació final de seguretat per calendaris d'estudi
            const weekendEvents = placedEvents.filter(item => !dateHelper.isWeekday(item.newDate));
            if (weekendEvents.length > 0) {
                console.error(`[ESTUDI_REPLICA_SERVICE] ERROR CRÍTIC: ${weekendEvents.length} events en caps de setmana!`);
                throw new Error(`Error de disseny: ${weekendEvents.length} events generats en caps de setmana`);
            }
            
            console.log(`[ESTUDI_REPLICA_SERVICE] Replicació completada amb èxit`);
            
            return { placed: placedEvents, unplaced: unplacedEvents };
            
        } catch (error) {
            console.error(`[ESTUDI_REPLICA_SERVICE] Error en replicació:`, error);
            throw error;
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
    
    // Detectar data de fi d'avaluacions per calendaris d'estudi (CÒPIA EXACTA de la lògica original)
    findPAF1(calendar) {
        console.log(`[PAF Detection] Obtenint PAF1 del calendari: ${calendar.name} (tipus: ${calendar.type})`);
        
        // Per calendaris FP i BTX: usar paf1Date directe
        if (calendar.type === 'FP' || calendar.type === 'BTX') {
            if (calendar.paf1Date) {
                console.log(`[PAF Detection] PAF1 trobat per ${calendar.type}: ${calendar.paf1Date}`);
                return calendar.paf1Date;
            }
        }
        
        // Si no té paf1Date: buscar esdeveniments PAF
        console.log(`[PAF Detection] Buscant esdeveniments PAF en calendari tipus "${calendar.type}"`);
        
        // Buscar esdeveniments amb categoria PAF (SYS_CAT_3 o qualsevol categoria anomenada "PAF")
        const pafEvents = calendar.events.filter(event => {
            // Buscar per ID de categoria del sistema
            if (event.categoryId === 'SYS_CAT_3') return true;
            
            // Buscar per nom de categoria "PAF" en categories personalitzades
            if (calendar.categories) {
                const category = calendar.categories.find(cat => cat.id === event.categoryId);
                if (category && category.name.toUpperCase().includes('PAF')) return true;
            }
            
            // Buscar per títol que contingui "PAF1"
            if (event.title.toUpperCase().includes('PAF1')) return true;
            
            return false;
        });
        
        if (pafEvents.length > 0) {
            // Ordenar per data i obtenir el primer PAF1
            const sortedPafEvents = pafEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
            const firstPaf = sortedPafEvents.find(event => 
                event.title.toUpperCase().includes('PAF1') || event.categoryId === 'SYS_CAT_3'
            );
            
            if (firstPaf) {
                console.log(`[PAF Detection] PAF1 trobat per esdeveniments: ${firstPaf.date} ("${firstPaf.title}")`);
                return firstPaf.date;
            }
        }
        
        // Fallback: usar final de calendari
        console.warn(`[PAF Detection] PAF1 no trobat per calendari tipus "${calendar.type}". Usant final de calendari: ${calendar.endDate}`);
        return calendar.endDate;
    }
}