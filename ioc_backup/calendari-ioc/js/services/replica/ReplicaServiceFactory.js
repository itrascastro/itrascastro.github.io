/**
 * =================================================================
 * REPLICA SERVICE FACTORY - FACTORY PER SELECCIÓ DE SERVEIS DE REPLICACIÓ
 * =================================================================
 * 
 * @file        ReplicaServiceFactory.js
 * @description Factory pattern per seleccionar el servei de replicació adequat segons tipus de calendaris
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

// FACTORY PER SELECCIÓ DE SERVEIS DE REPLICACIÓ
class ReplicaServiceFactory {
    
    /**
     * Selecciona el servei de replicació adequat segons els tipus de calendaris
     * @param {Object} sourceCalendar - Calendari origen
     * @param {Object} targetCalendar - Calendari destí
     * @returns {ReplicaService} Instància del servei de replicació adequat
     */
    static getService(sourceCalendar, targetCalendar) {
        // Validació bàsica
        if (!sourceCalendar || !targetCalendar) {
            throw new CalendariIOCException('1201', 'ReplicaServiceFactory.getService');
        }
        
        // Determinar tipus de replicació necessària
        const sourceType = sourceCalendar.type || 'Altre';
        const targetType = targetCalendar.type || 'Altre';
        
        console.log(`[REPLICA_FACTORY] Seleccionant servei per: ${sourceType} → ${targetType}`);
        
        // Si qualsevol dels calendaris és "Altre", usar GenericReplicaService
        if (sourceType === 'Altre' || targetType === 'Altre') {
            console.log(`[REPLICA_FACTORY] Calendari "Altre" detectat: usant GenericReplicaService`);
            return new GenericReplicaService();
        } 
        
        // Si ambdós són calendaris d'estudi (FP, BTX, etc.), usar EstudiReplicaService
        console.log(`[REPLICA_FACTORY] Calendaris d'estudi detectats: usant EstudiReplicaService`);
        return new EstudiReplicaService();
    }
    
    /**
     * Obté informació sobre el tipus de servei que es seleccionaria
     * @param {Object} sourceCalendar - Calendari origen
     * @param {Object} targetCalendar - Calendari destí
     * @returns {Object} Informació sobre el servei seleccionat
     */
    static getServiceInfo(sourceCalendar, targetCalendar) {
        const sourceType = sourceCalendar?.type || 'Altre';
        const targetType = targetCalendar?.type || 'Altre';
        
        if (sourceType === 'Altre' || targetType === 'Altre') {
            return {
                serviceType: 'GenericReplicaService',
                description: 'Servei optimitzat per calendaris genèrics amb preservació d\'agrupacions',
                features: [
                    'Suport per tots els dies de la setmana',
                    'Múltiples esdeveniments per dia',
                    'Preservació d\'agrupacions per dia',
                    'Estratègies de còpia directa, expansió i compressió'
                ]
            };
        } else {
            return {
                serviceType: 'EstudiReplicaService',
                description: 'Servei per calendaris d\'estudi amb restriccions acadèmiques',
                features: [
                    'Només dies laborables',
                    'Un esdeveniment per dia màxim',
                    'Detecció automàtica de PAF',
                    'Cerca radial de slots lliures'
                ]
            };
        }
    }
    
    /**
     * Valida si dos calendaris són compatibles per replicació
     * @param {Object} sourceCalendar - Calendari origen
     * @param {Object} targetCalendar - Calendari destí
     * @returns {Object} Resultat de validació amb detalls
     */
    static validateCompatibility(sourceCalendar, targetCalendar) {
        const validation = {
            isCompatible: true,
            warnings: [],
            recommendations: []
        };
        
        // Validació bàsica d'estructura
        if (!sourceCalendar?.events) {
            validation.isCompatible = false;
            validation.warnings.push('Calendari origen sense esdeveniments');
        }
        
        if (!targetCalendar?.startDate || !targetCalendar?.endDate) {
            validation.isCompatible = false;
            validation.warnings.push('Calendari destí sense dates vàlides');
        }
        
        // Recomanacions segons tipus
        const sourceType = sourceCalendar?.type || 'Altre';
        const targetType = targetCalendar?.type || 'Altre';
        
        if (sourceType === 'Altre' && targetType !== 'Altre') {
            validation.recommendations.push('Replicació d\'Altre a estudi pot generar esdeveniments no ubicats en caps de setmana');
        }
        
        if (sourceType !== 'Altre' && targetType === 'Altre') {
            validation.recommendations.push('Replicació d\'estudi a Altre permetrà més flexibilitat d\'ubicació');
        }
        
        if (sourceType === 'Altre' && targetType === 'Altre') {
            validation.recommendations.push('Replicació òptima: ambdós calendaris són tipus Altre');
        }
        
        return validation;
    }
}