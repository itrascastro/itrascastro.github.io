/**
 * =================================================================
 * STORAGE - GESTIÓ DE PERSISTÈNCIA DE DADES
 * =================================================================
 * 
 * @file        StorageManager.js
 * @description Funcions per desar i carregar dades des de localStorage
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

// === CLASSE STORAGEMANAGER ===

class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'calendari-ioc-data';
    }

    // Desar estat a localStorage
    saveToStorage() {
        try {
            // FASE 2 FIX: Usar toJSON() de les classes per serialització controlada
            const stateToSave = { 
                ...appStateManager.appState, 
                currentDate: dateHelper.toUTCString(appStateManager.currentDate) 
            };
            
            // Les classes ja tenen toJSON() implementat, JSON.stringify les usarà automàticament
            const jsonData = JSON.stringify(stateToSave);
            localStorage.setItem(this.STORAGE_KEY, jsonData);
            
            console.log('[Storage] Estat desat correctament');
            return true;
            
        } catch (error) {
            console.error('[Storage] Error durant serialització:', error);
            if (error.name === 'QuotaExceededError') {
                throw new CalendariIOCException('302', 'StorageManager.saveToStorage');
            }
            throw new CalendariIOCException('999', 'StorageManager.saveToStorage');
        }
    }

    // Carregar estat des de localStorage
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
        
            if (!data) {
                console.log('[Storage] No hi ha dades guardades');
                return false;
            }
        
            const loadedState = JSON.parse(data);
        
            // FASE 2: Rehidratar estat JSON pla a grafo d'objectes amb instàncies
            console.log('[Storage] Iniciant rehidratació d\'objectes...');
            let rehydratedState;
            try {
                rehydratedState = CalendariIOC_DataRehydrator.rehydrateState(loadedState);
            } catch (error) {
                // Si és error d'estructura incompatible (415) des de localStorage, convertir a 416
                if (error instanceof CalendariIOCException && error.codiCausa === '415') {
                    throw new CalendariIOCException('416', 'StorageManager.loadFromStorage');
                }
                throw error;
            }
            
            appStateManager.appState = { 
                ...rehydratedState, 
                currentDate: dateHelper.parseUTC(loadedState.currentDate.split('T')[0]) 
            };
            
            // Verificar integritat del grafo rehidratat
            if (CalendariIOC_DataRehydrator.verifyIntegrity(rehydratedState)) {
                console.log('[Storage] Grafo d\'objectes rehidratat correctament');
            } else {
                console.warn('[Storage] Problemes detectats en la integritat del grafo');
            }
        
            if (!appStateManager.categoryTemplates) {
                appStateManager.categoryTemplates = [];
            }
        
            if (!appStateManager.unplacedEvents) {
                appStateManager.unplacedEvents = [];
            }
        
            if (!appStateManager.lastVisitedMonths) {
                appStateManager.lastVisitedMonths = {};
            }
        
            if (!appStateManager.appState.systemCategoryColors) {
                appStateManager.appState.systemCategoryColors = {};
                
                Object.values(appStateManager.calendars).forEach(calendar => {
                    calendar.categories.forEach(category => {
                        if (category.isSystem && category.color) {
                            appStateManager.appState.systemCategoryColors[category.id] = category.color;
                        }
                    });
                });
                
                console.log('[Migration] systemCategoryColors inicialitzat amb colors existents');
            }
        
            appStateManager.migrateCategoryTemplates();
        
            console.log('[Storage] Estat carregat correctament');
            console.log(`[Storage] Calendaris: ${Object.keys(appStateManager.calendars).length}`);
            console.log(`[Storage] Categories: ${appStateManager.categoryTemplates.length}`);
            console.log(`[Storage] Events no ubicats: ${appStateManager.unplacedEvents.length}`);
        
            return true;
        
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new CalendariIOCException('303', 'StorageManager.loadFromStorage');
            }
            throw new CalendariIOCException('999', 'StorageManager.loadFromStorage');
        }
    }

    // Netejar localStorage
    clearStorage() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('[Storage] localStorage netejat');
            return true;
        } catch (error) {
            if (error instanceof DOMException) {
                throw new CalendariIOCException('301', 'StorageManager.clearStorage');
            }
            throw new CalendariIOCException('999', 'StorageManager.clearStorage');
        }
    }


    // Obtenir informació de l'emmagatzematge
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
        
            if (!data) {
                return {
                    exists: false,
                    size: 0,
                    sizeFormatted: '0 B'
                };
            }
        
            const sizeInBytes = new Blob([data]).size;
            const sizeFormatted = this.formatBytes(sizeInBytes);
        
            return {
                exists: true,
                size: sizeInBytes,
                sizeFormatted: sizeFormatted,
                lastModified: new Date().toISOString()
            };
        } catch (error) {
            if (error instanceof DOMException) {
                throw new CalendariIOCException('301', 'StorageManager.getStorageInfo');
            }
            throw new CalendariIOCException('999', 'StorageManager.getStorageInfo');
        }
    }

    // Exportar estat com a JSON
    exportState() {
        try {
            const exportData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                data: {
                    ...appStateManager.appState,
                    currentDate: dateHelper.toUTCString(appStateManager.currentDate)
                }
            };
        
            return JSON.stringify(exportData);
        } catch (error) {
            throw new CalendariIOCException('304', 'StorageManager.exportState');
        }
    }

    // Importar estat des de JSON
    importState(jsonData) {
        // Parsing JSON - pot generar SyntaxError
        let importData;
        try {
            importData = JSON.parse(jsonData);
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new CalendariIOCException('303', 'StorageManager.importState');
            }
            throw new CalendariIOCException('999', 'StorageManager.importState');
        }
        
        // Validació de negocio - estructura requerida
        if (!importData.data || !importData.version) {
            throw new CalendariIOCException('609', 'StorageManager.importState');
        }
        
        // Operacions tècniques que poden fallar
        try {
            // Restaurar estat
            appStateManager.appState = {
                ...importData.data,
                currentDate: dateHelper.parseUTC(importData.data.currentDate.split('T')[0])
            };
            
            // Desar estat importat
            this.saveToStorage();
            
        } catch (error) {
            throw new CalendariIOCException('999', 'StorageManager.importState');
        }
        
        console.log('[Storage] Estat importat correctament');
        return true;
    }

    // Verificar si localStorage està disponible
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            if (error instanceof DOMException) {
                throw new CalendariIOCException('301', 'StorageManager.isStorageAvailable');
            } else if (error.name === 'QuotaExceededError') {
                throw new CalendariIOCException('302', 'StorageManager.isStorageAvailable');
            }
            throw new CalendariIOCException('999', 'StorageManager.isStorageAvailable');
        }
    }

    // Inicialitzar sistema de persistència
    initializeStorage() {
        // isStorageAvailable() llançarà CalendariIOCException si localStorage no està disponible
        this.isStorageAvailable();
        
        console.log('[Storage] Sistema de persistència inicialitzat');
        return true;
    }

    // === NETEJA COMPLETA ===
    
    // Netejar tota l'aplicació amb confirmació
    clearAll() {
        uiHelper.showConfirmModal(
            "Estàs segur que vols netejar totes les dades?\n\nAixò eliminarà tots els calendaris, categories i configuracions.\n\nAquesta acció no es pot desfer.",
            'Netejar tot',
            () => {
                // Netejar localStorage
                this.clearStorage();
                
                // Resetjar estat de l'aplicació
                appStateManager.resetAppState();
                
                // Netejar consola del navegador
                console.clear();
                
                // Refrescar interfície d'usuari
                calendarManager.updateUI();
                
                // Mostrar confirmació
                uiHelper.showMessage('Aplicació netejada correctament', 'success');
                
                console.log('[Storage] Neteja completa realitzada');
            }
        );
    }

    // Formatear bytes en format llegible (mètode privat)
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// === INSTÀNCIA GLOBAL ===

// Crear instància global de StorageManager
const storageManager = new StorageManager();