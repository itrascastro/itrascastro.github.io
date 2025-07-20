/**
 * =================================================================
 * REPLICA SERVICE - SERVEI DE REPLICACIÓ PROPORCIONAL
 * =================================================================
 * 
 * @file        ReplicaService.js
 * @description Servei per replicació proporcional d'esdeveniments entre calendaris
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

// CLASSE DE SERVEI DE REPLICACIÓ: Implementa algoritme proporcional
class ReplicaService {
    
    // Funció principal de replicació
    replicate(sourceCalendar, targetCalendar) {
        console.log(`[REPLICA_SERVICE] Iniciant replicació...`);
        
        try {
            // Validació bàsica
            if (!sourceCalendar?.events || !targetCalendar?.startDate || !targetCalendar?.endDate) {
                throw new Error('Calendaris invàlids: manca estructura bàsica');
            }
            
            // Filtrar esdeveniments del professor
            const professorEvents = sourceCalendar.events
                .filter(event => !event.isSystemEvent)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            console.log(`[REPLICA_SERVICE] Events del professor a replicar: ${professorEvents.length}`);
            
            if (professorEvents.length === 0) {
                console.log(`[REPLICA_SERVICE] No hi ha events del professor per replicar`);
                return { placed: [], unplaced: [] };
            }
            
            // Construir espais útils
            const espaiUtilOrigen = this.analyzeWorkableSpace(sourceCalendar);
            const espaiUtilDesti = this.analyzeWorkableSpace(targetCalendar);
            
            console.log(`[REPLICA_SERVICE] Espai Origen: ${espaiUtilOrigen.length} dies útils`);
            console.log(`[REPLICA_SERVICE] Espai Destí: ${espaiUtilDesti.length} dies útils`);
            
            if (espaiUtilDesti.length === 0) {
                console.warn(`[REPLICA_SERVICE] Calendari destí sense espai útil disponible`);
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
            console.log(`[REPLICA_SERVICE] Factor de proporció: ${factorProporcio.toFixed(3)}`);
            
            // Mapa d'ocupació del destí
            const ocupacioEspaiDesti = new Map(espaiUtilDesti.map(date => [date, 'LLIURE']));
            
            const placedEvents = [];
            const unplacedEvents = [];
            
            // Bucle principal de replicació
            professorEvents.forEach((event, index) => {
                console.log(`[REPLICA_SERVICE] Processant (${index + 1}/${professorEvents.length}): "${event.title}"`);
                
                // Trobar posició en espai origen
                const indexOrigen = espaiUtilOrigen.indexOf(event.date);
                
                if (indexOrigen === -1) {
                    console.warn(`[REPLICA_SERVICE] Esdeveniment "${event.title}" no troba posició en espai origen`);
                    unplacedEvents.push({ 
                        event: { ...event, replicationConfidence: 0 }, 
                        sourceCalendar,
                        reason: "Esdeveniment no està en espai útil d'origen" 
                    });
                    return;
                }
                
                // Calcular posició ideal en espai destí
                const indexIdeal = Math.round(indexOrigen * factorProporcio);
                
                // Cerca radial de slot lliure
                const indexFinal = this.findNearestFreeSlot(ocupacioEspaiDesti, indexIdeal);
                
                if (indexFinal === -1) {
                    console.warn(`[REPLICA_SERVICE] No es troba slot lliure per "${event.title}"`);
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
                
                console.log(`[REPLICA_SERVICE] "${event.title}": ${event.date} → ${newDate} (pos ${indexOrigen + 1}→${indexFinal + 1})`);
            });
            
            console.log(`[REPLICA_SERVICE] Resultat: ${placedEvents.length} ubicats, ${unplacedEvents.length} no ubicats`);
            
            // Validació final de seguretat
            const weekendEvents = placedEvents.filter(item => !dateHelper.isWeekday(item.newDate));
            if (weekendEvents.length > 0) {
                console.error(`[REPLICA_SERVICE] ERROR CRÍTIC: ${weekendEvents.length} events en caps de setmana!`);
                throw new Error(`Error de disseny: ${weekendEvents.length} events generats en caps de setmana`);
            }
            
            console.log(`[REPLICA_SERVICE] Replicació completada amb èxit`);
            
            return { placed: placedEvents, unplaced: unplacedEvents };
            
        } catch (error) {
            console.error(`[REPLICA_SERVICE] Error en replicació:`, error);
            throw error;
        }
    }
    
    // Anàlisi de l'espai útil
    analyzeWorkableSpace(calendar) {
        console.log(`[Espai Útil] Analitzant espai útil per: ${calendar.name}`);
        
        const espaiUtil = [];
        const dataFiAvalucions = this.findPAF1(calendar);
        
        // Esdeveniments que ocupen l'espai (sistema IOC, festius, etc.)
        const occupiedBySystem = new Set(
            calendar.events
                .filter(e => e.eventType === 'FESTIU' || e.isSystemEvent)
                .map(e => e.date)
        );
        
        console.log(`[Espai Útil] Període: ${calendar.startDate} → ${dataFiAvalucions}`);
        console.log(`[Espai Útil] Dies ocupats pel sistema: ${occupiedBySystem.size}`);
        
        // Iterar dia a dia
        let currentDate = dateHelper.parseUTC(calendar.startDate);
        const endDate = dateHelper.parseUTC(dataFiAvalucions);
        
        while (currentDate <= endDate) {
            const dateStr = dateHelper.toUTCString(currentDate);
            
            // Només dies laborals que no estan ocupats pel sistema
            if (dateHelper.isWeekday(dateStr) && !occupiedBySystem.has(dateStr)) {
                espaiUtil.push(dateStr);
            }
            
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        
        console.log(`[Espai Útil] Espai útil construït: ${espaiUtil.length} dies disponibles`);
        
        return espaiUtil;
    }
    
    // Cerca radial de slots lliures
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
    
    // Detectar data de fi d'avaluacions (cercar PAF1)
    findPAF1(calendar) {
        console.log(`[PAF Detection] Buscant PAF1 al calendari: ${calendar.name}`);
        
        // Cercar PAF1 en esdeveniments del calendari
        const paf1Event = calendar.events.find(event => event.eventType === 'PAF1');
        
        if (paf1Event) {
            console.log(`[PAF Detection] PAF1 trobat: ${paf1Event.date}`);
            return paf1Event.date;
        }
        
        // Fallback: cercar en configuració IOC
        const paf1Config = semesterConfig.getSystemEvents().find(event => event.eventType === 'PAF1');
        
        if (paf1Config && paf1Config.date >= calendar.startDate && paf1Config.date <= calendar.endDate) {
            console.log(`[PAF Detection] PAF1 de configuració: ${paf1Config.date}`);
            return paf1Config.date;
        }
        
        console.error('[PAF Detection] PAF1 no trobat! Usant final de calendari');
        return calendar.endDate;
    }
    
    // Càlcul de confiança proporcional
    calculateProportionalConfidence(indexOrigen, indexIdeal, indexFinal, factorProporcio) {
        let confidence = 95; // Base alta
        
        // Penalització per diferència entre ideal i final
        const diferencia = Math.abs(indexIdeal - indexFinal);
        if (diferencia > 0) {
            confidence -= Math.min(diferencia * 2, 15); // Màxim -15%
        }
        
        // Bonificació per factors de proporció "nets"
        if (Math.abs(factorProporcio - 1.0) < 0.1) {
            confidence += 3; // Replicació gairebé directa
        }
        
        // Garantir límits
        return Math.max(Math.min(confidence, 99), 70);
    }
}

// === INSTÀNCIA GLOBAL DEL SERVEI ===

// Servei de replicació
const replicaService = new ReplicaService();