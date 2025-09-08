/**
 * =================================================================
 * REPLICA SERVICE BASE - CLASSE BASE PER SERVEIS DE REPLICACIÓ
 * =================================================================
 * 
 * @file        ReplicaService.js
 * @description Classe base per serveis de replicació amb mètodes comuns
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

// CLASSE BASE PER SERVEIS DE REPLICACIÓ
class ReplicaService {
    
    // Càlcul de confiança proporcional (mètode comú)
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
    
    // Anàlisi de l'espai útil (modificat per suportar tipus de calendari)
    analyzeWorkableSpace(calendar) {
        console.log(`[Espai Útil] Analitzant espai útil per: ${calendar.name} (tipus: ${calendar.type})`);
        
        const espaiUtil = [];
        
        // Determinar data de fi segons tipus de calendari
        let dataFiAvaluacions;
        if (calendar.type === 'Altre') {
            // Per calendaris "Altre": usar endDate directament
            dataFiAvaluacions = calendar.endDate;
            console.log(`[Espai Útil] Calendari tipus "Altre": usant endDate directament: ${dataFiAvaluacions}`);
        } else {
            // Per calendaris d'estudi: usar findPAF1 (serà implementat a EstudiReplicaService)
            dataFiAvaluacions = this.findPAF1 ? this.findPAF1(calendar) : calendar.endDate;
        }
        
        // Esdeveniments que ocupen l'espai (sistema IOC, festius, etc.)
        const occupiedBySystem = new Set(
            calendar.events
                .filter(e => e.isSystemEvent)
                .map(e => e.date)
        );
        
        console.log(`[Espai Útil] Període: ${calendar.startDate} → ${dataFiAvaluacions}`);
        console.log(`[Espai Útil] Dies ocupats pel sistema: ${occupiedBySystem.size}`);
        
        // Iterar dia a dia
        let currentDate = dateHelper.parseUTC(calendar.startDate);
        const endDate = dateHelper.parseUTC(dataFiAvaluacions);
        
        while (currentDate <= endDate) {
            const dateStr = dateHelper.toUTCString(currentDate);
            
            // Determinar si el dia és vàlid segons tipus de calendari
            let isValidDay;
            if (calendar.type === 'Altre') {
                // Per calendaris "Altre": tots els dies excepte els ocupats pel sistema
                isValidDay = !occupiedBySystem.has(dateStr);
            } else {
                // Per calendaris d'estudi: només dies laborals que no estan ocupats pel sistema
                isValidDay = dateHelper.isWeekday(dateStr) && !occupiedBySystem.has(dateStr);
            }
            
            if (isValidDay) {
                espaiUtil.push(dateStr);
            }
            
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        
        console.log(`[Espai Útil] Espai útil construït: ${espaiUtil.length} dies disponibles`);
        
        return espaiUtil;
    }
    
    // === GESTIÓ DE CATEGORIES EN REPLICACIÓ ===
    
    /**
     * Obtenir mapa de categories necessàries per la replicació
     * Les categories són globals i ja existeixen al catàleg, no cal crear-ne de noves
     * @param {Array} professorEvents - Esdeveniments del professor a replicar
     * @param {Object} targetCalendar - Calendari destí (no utilitzat, les categories són globals)
     * @returns {Map} Map de categoryId → categoria original del catàleg global
     */
    replicateRequiredCategories(professorEvents) {
        const categoryMap = new Map();
        
        // Obtenir categories úniques dels esdeveniments i referenciar-les del catàleg global
        professorEvents.forEach((event) => {
            const category = event.getCategory();
            
            if (category && !category.isSystem) {
                // Les categories són globals - usar la mateixa instància original
                categoryMap.set(category.id, category);
            }
        });
        
        return categoryMap;
    }
    
    /**
     * @abstract
     * Mètode de replicació que ha de ser implementat per les subclasses
     * @param {Object} sourceCalendar - Calendari origen
     * @param {Object} targetCalendar - Calendari destí
     * @returns {Object} Resultat de la replicació amb events ubicats i no ubicats
     */
    replicate(sourceCalendar, targetCalendar) {
        // Mètode virtual - implementar a la subclasse
    }
}