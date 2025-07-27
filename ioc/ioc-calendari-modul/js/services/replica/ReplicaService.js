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
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
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
            // Per calendaris d'estudi (FP/BTX): usar findPAF1 (serà implementat a EstudiReplicaService)
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
    
    // Mètode abstracte que han d'implementar les subclasses
    replicate(sourceCalendar, targetCalendar) {
        throw new Error('El mètode replicate() ha de ser implementat per la subclasse');
    }
}