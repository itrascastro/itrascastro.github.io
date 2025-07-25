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
            throw new Error('SemesterConfig requereix un calendarType. No es pot usar sense especificar tipus.');
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
            let specificConfig = { systemEvents: [] };
            
            if (type === 'FP') {
                specificConfig = await this.loadJSON('config/fp-semestre.json');
            } else if (type === 'BTX') {
                specificConfig = await this.loadJSON('config/btx-semestre.json');
            } else if (type === 'Altre') {
                // Tipus "Altre" no carrega configuració específica
                return this.getEmptyConfiguration();
            }
            
            // Fusionar configuracions
            return this.mergeConfigurations(commonConfig, specificConfig);
            
        } catch (error) {
            console.error(`[SemesterConfig] Error carregant configuració per tipus ${type}:`, error);
            throw new Error(`No es pot carregar la configuració per tipus ${type}: ${error.message}`);
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
                console.error(`[SemesterConfig] Error carregant ${filePath}: ${response.status}`);
                return { systemEvents: [] };
            }
        } catch (error) {
            console.error(`[SemesterConfig] Error parsejant ${filePath}:`, error);
            return { systemEvents: [] };
        }
    }
    
    // Configuració buida per tipus "Altre"
    getEmptyConfiguration() {
        return {
            semester: null, // Es definirà dinàmicament
            defaultCategories: [], // Sense categories del sistema
            systemEvents: [] // Sense esdeveniments del sistema
        };
    }
    
    // Fusionar configuració comuna amb específica
    mergeConfigurations(commonConfig, specificConfig) {
        const mergedEvents = [
            ...(commonConfig.systemEvents || []),
            ...(specificConfig.systemEvents || [])
        ];
        
        // Generar IDs automàticament
        const eventsWithIds = this.generateEventIds(mergedEvents);
        
        return {
            semester: specificConfig.semester || commonConfig.semester,
            defaultCategories: this.getSystemCategories(),
            systemEvents: eventsWithIds
        };
    }
    
    // Generar IDs automàtics per esdeveniments
    generateEventIds(events) {
        return events.map((event, index) => ({
            ...event,
            id: `SYS_EVENT_${index + 1}`
        }));
    }
    
    // Categories del sistema (sempre iguals)
    getSystemCategories() {
        return [
            {
                "id": "SYS_CAT_1",
                "name": "IOC_GENERIC",
                "color": "#3b82f6",
                "isSystem": true
            },
            {
                "id": "SYS_CAT_2",
                "name": "FESTIU",
                "color": "#f43f5e",
                "isSystem": true
            },
            {
                "id": "SYS_CAT_3",
                "name": "PAF",
                "color": "#8b5cf6",
                "isSystem": true
            }
        ];
    }
    
    // === GETTERS PER ACCEDIR A LA CONFIGURACIÓ ===
    
    // Validar que la configuració està carregada
    _ensureInitialized() {
        if (!this.data) {
            throw new Error('SemesterConfig no està inicialitzat. Crideu initialize() primer.');
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
    
    // Mostrar informació de la configuració carregada
    logConfigInfo() {
        
        const semester = this.getSemester();
        console.log(`[SemesterConfig] Semestre: ${semester.code}`);
        console.log(`[SemesterConfig] Període: ${semester.startDate} → ${semester.endDate}`);
        console.log(`[SemesterConfig] Events sistema: ${this.getSystemEvents().length}`);
        console.log(`[SemesterConfig] Categories per defecte: ${this.getDefaultCategories().length}`);
    }
    
}

// === INSTÀNCIA GLOBAL ===
// Nota: semesterConfig global ja no s'usa, cada calendari crea la seva instància específica