/**
 * =================================================================
 * SEMESTER CONFIG - GESTIÓ DE LA CONFIGURACIÓ DEL SEMESTRE IOC
 * =================================================================
 * 
 * @file        semester-config.js
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
    constructor() {
        // Configuració del semestre directament inclosa
        this.data = {
            "semester": {
                "code": "24S2",
                "startDate": "2025-02-14",
                "endDate": "2025-06-27",
                "name": "Segon Semestre 2024-25",
                "description": "Configuració del semestre IOC - Febrer a Juny 2025"
            },
            "systemEvents": [
                {
                    "id": "SYS_EVENT_0",
                    "title": "Inici del semestre",
                    "date": "2025-02-14",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_1",
                    "title": "Festiu centre",
                    "date": "2025-03-03",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_2", 
                    "title": "Festa del Treball",
                    "date": "2025-05-01",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_3",
                    "title": "Orientacions PAF",
                    "date": "2025-05-14",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                },
                {
                    "id": "SYS_EVENT_4",
                    "title": "PAF1",
                    "date": "2025-05-24",
                    "categoryId": "SYS_CAT_3",
                    "isSystemEvent": true,
                    "eventType": "PAF1"
                },
                {
                    "id": "SYS_EVENT_5",
                    "title": "PAF2",
                    "date": "2025-06-07",
                    "categoryId": "SYS_CAT_3",
                    "isSystemEvent": true,
                    "eventType": "PAF2"
                },
                {
                    "id": "SYS_EVENT_6",
                    "title": "Vacances Setmana Santa (1)",
                    "date": "2025-04-12",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_7",
                    "title": "Vacances Setmana Santa (2)",
                    "date": "2025-04-13",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_8",
                    "title": "Vacances Setmana Santa (3)",
                    "date": "2025-04-14",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_9",
                    "title": "Vacances Setmana Santa (4)",
                    "date": "2025-04-15",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_10",
                    "title": "Vacances Setmana Santa (5)",
                    "date": "2025-04-16",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_11",
                    "title": "Vacances Setmana Santa (6)",
                    "date": "2025-04-17",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_12",
                    "title": "Vacances Setmana Santa (7)",
                    "date": "2025-04-18",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_13",
                    "title": "Vacances Setmana Santa (8)",
                    "date": "2025-04-19",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_14",
                    "title": "Vacances Setmana Santa (9)",
                    "date": "2025-04-20",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_15",
                    "title": "Vacances Setmana Santa (10)",
                    "date": "2025-04-21",
                    "categoryId": "SYS_CAT_1",
                    "isSystemEvent": true,
                    "eventType": "FESTIU"
                },
                {
                    "id": "SYS_EVENT_16",
                    "title": "Revisió PAF1 (1)",
                    "date": "2025-05-30",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                },
                {
                    "id": "SYS_EVENT_17",
                    "title": "Revisió PAF1 (2)",
                    "date": "2025-05-31",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                },
                {
                    "id": "SYS_EVENT_18",
                    "title": "Revisió PAF1 (3)",
                    "date": "2025-06-01",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                },
                {
                    "id": "SYS_EVENT_19",
                    "title": "Revisió PAF1 (4)",
                    "date": "2025-06-02",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                },
                {
                    "id": "SYS_EVENT_20",
                    "title": "Revisió PAF1 (5)",
                    "date": "2025-06-03",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                },
                {
                    "id": "SYS_EVENT_21",
                    "title": "Revisió PAF2 (1)",
                    "date": "2025-06-13",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                },
                {
                    "id": "SYS_EVENT_22",
                    "title": "Revisió PAF2 (2)",
                    "date": "2025-06-14",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                },
                {
                    "id": "SYS_EVENT_23",
                    "title": "Revisió PAF2 (3)",
                    "date": "2025-06-15",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                },
                {
                    "id": "SYS_EVENT_24",
                    "title": "Revisió PAF2 (4)",
                    "date": "2025-06-16",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                },
                {
                    "id": "SYS_EVENT_25",
                    "title": "Revisió PAF2 (5)",
                    "date": "2025-06-17",
                    "categoryId": "SYS_CAT_2",
                    "isSystemEvent": true,
                    "eventType": "IOC_GENERIC"
                }
            ],
            "defaultCategories": [
                {
                    "id": "SYS_CAT_1",
                    "name": "Festiu",
                    "color": "#f43f5e",
                    "isSystem": true
                },
                {
                    "id": "SYS_CAT_2",
                    "name": "IOC",
                    "color": "#3b82f6",
                    "isSystem": true
                },
                {
                    "id": "SYS_CAT_3",
                    "name": "PAF",
                    "color": "#8b5cf6",
                    "isSystem": true
                }
            ]
        };
    }
    
    // === GETTERS PER ACCEDIR A LA CONFIGURACIÓ ===
    
    // Obtenir informació del semestre
    getSemester() {
        return this.data.semester;
    }
    
    // Obtenir events del sistema
    getSystemEvents() {
        return this.data.systemEvents || [];
    }
    
    // Obtenir categories per defecte
    getDefaultCategories() {
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
const semesterConfig = new SemesterConfig();