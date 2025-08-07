/**
 * =================================================================
 * SEMESTER CONFIG - GESTIÓ DE LA CONFIGURACIÓ DEL SEMESTRE IOC
 * =================================================================
 * 
 * @file        SemesterConfig.js
 * @description Configuració de semestres acadèmics del sistema IOC
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

class SemesterConfig {
    constructor(calendarType = null) {
        this.calendarType = calendarType;
        this.data = null; // S'inicialitzarà amb initialize()
        
        if (!calendarType) {
            throw new CalendariIOCException('1001', 'SemesterConfig.constructor');
        }
    }
    
    // Mètode asíncron per inicialitzar la configuració
    async initialize() {
        if (this.data) {
            return this.data; // Ja està inicialitzat
        }
        
        this.data = await this.loadConfiguration(this.calendarType);
        return this.data;
    }
    
    
    // === CÀRREGA DINÀMICA DE CONFIGURACIÓ ===
    
    // Carregar configuració segons tipus de calendari (asíncron)
    async loadConfiguration(type) {
        try {
            const commonConfig = await this.loadJSON('config/common-semestre.json');
            const systemCategories = this.addIsSystemToCategories(await this.loadJSON('config/sys-categories.json'));
            let specificConfig = { systemEvents: [] };
            
            if (type === 'FP') {
                specificConfig = await this.loadJSON('config/fp-semestre.json');
            } else if (type === 'BTX') {
                specificConfig = await this.loadJSON('config/btx-semestre.json');
            }
            
            // Fusionar configuracions
            return this.mergeConfigurations(commonConfig, specificConfig, systemCategories);
            
        } catch (error) {
            throw new CalendariIOCException('108', 'SemesterConfig.loadConfiguration');
        }
    }
    
    // Carregar fitxer JSON de configuració (asíncron)
    async loadJSON(filePath) {
        try {
            const response = await fetch(filePath);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`[SemesterConfig] Carregat ${filePath} correctament`);
                return data;
            } else {
                throw new CalendariIOCException('109', 'SemesterConfig.loadJSON');
            }
        } catch (error) {
            if (error instanceof CalendariIOCException) {
                throw error;
            }
            throw new CalendariIOCException('110', 'SemesterConfig.loadJSON');
        }
    }
    
    
    // Fusionar configuració comuna amb específica
    mergeConfigurations(commonConfig, specificConfig, systemCategories) {
        const mergedEvents = [
            ...(commonConfig.systemEvents || []),
            ...(specificConfig.systemEvents || [])
        ];
        
        // Generar IDs automàticament
        const eventsWithIds = this.generateEventIds(mergedEvents);
        
        return {
            semester: specificConfig.semester || commonConfig.semester,
            defaultCategories: systemCategories || [],
            systemEvents: eventsWithIds
        };
    }
    
    // Generar IDs automàtics per esdeveniments
    generateEventIds(events) {
        return events.map((event, index) => ({
            ...event,
            id: `SYS_EVENT_${index + 1}`,
            isSystemEvent: true
        }));
    }
    
    // Afegir propietat isSystem a categories del sistema
    addIsSystemToCategories(categories) {
        return categories.map(category => ({
            ...category,
            isSystem: true
        }));
    }
    
    // === GETTERS PER ACCEDIR A LA CONFIGURACIÓ ===
    
    // Validar que la configuració està carregada
    _ensureInitialized() {
        if (!this.data) {
            throw new CalendariIOCException('1002', 'SemesterConfig._ensureInitialized');
        }
    }
    
    // Obtenir informació del semestre
    getSemester() {
        this._ensureInitialized();
        return this.data.semester;
    }
    
    // Obtenir events del sistema
    getSystemEvents() {
        this._ensureInitialized();
        return this.data.systemEvents || [];
    }
    
    // Obtenir categories per defecte
    getDefaultCategories() {
        this._ensureInitialized();
        return this.data.defaultCategories || [];
    }
    
    // === MÈTODES D'UTILITAT ===
    
    // Obtenir data d'inici del semestre
    getStartDate() {
        const semester = this.getSemester();
        return semester ? semester.startDate : null;
    }
    
    // Obtenir data de final del semestre
    getEndDate() {
        const semester = this.getSemester();
        return semester ? semester.endDate : null;
    }
    
    // Obtenir codi del semestre
    getSemesterCode() {
        const semester = this.getSemester();
        return semester ? semester.code : null;
    }
}