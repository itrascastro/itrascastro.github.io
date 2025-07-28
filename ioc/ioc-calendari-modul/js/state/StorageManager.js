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
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
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
            // Preparar estat per desar (convertir dates a strings)
            const stateToSave = { 
                ...appStateManager.appState, 
                currentDate: dateHelper.toUTCString(appStateManager.currentDate) 
            };
            
            // Desar a localStorage
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
            
            console.log('[Storage] Estat guardat correctament');
            return true;
            
        } catch (error) {
            console.error('[Storage] Error guardant estat:', error);
            
            // Intentar alliberar espai si és problema de quota
            if (error.name === 'QuotaExceededError') {
                console.warn('[Storage] Quota exhaurida, intentant netejar...');
                this.clearOldData();
                
                // Tornar a intentar
                try {
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
                    console.log('[Storage] Estat guardat després de netejar');
                    return true;
                } catch (retryError) {
                    console.error('[Storage] Error persistent després de netejar:', retryError);
                    return false;
                }
            }
            
            return false;
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
        
            // Restaurar estat (convertir strings a dates)
            appStateManager.appState = { 
                ...loadedState, 
                currentDate: dateHelper.parseUTC(loadedState.currentDate.split('T')[0]) 
            };
        
            // Migració automàtica: inicialitzar catàleg si no existeix
            if (!appStateManager.categoryTemplates) {
                appStateManager.categoryTemplates = [];
            }
        
            // Migració automàtica: inicialitzar events no ubicats si no existeixen
            if (!appStateManager.unplacedEvents) {
                appStateManager.unplacedEvents = [];
            }
        
            // Migració automàtica: inicialitzar sistema de persistència de navegació
            if (!appStateManager.lastVisitedMonths) {
                appStateManager.lastVisitedMonths = {};
            }
        
            // Migració automàtica: inicialitzar colors de categories de sistema
            if (!appStateManager.appState.systemCategoryColors) {
                appStateManager.appState.systemCategoryColors = {};
                
                // Migrar colors existents de categories de sistema
                Object.values(appStateManager.calendars).forEach(calendar => {
                    calendar.categories.forEach(category => {
                        if (category.isSystem && category.color) {
                            appStateManager.appState.systemCategoryColors[category.id] = category.color;
                        }
                    });
                });
                
                console.log('[Migration] systemCategoryColors inicialitzat amb colors existents');
            }
        
            // Migrar plantilles de categories
            appStateManager.migrateCategoryTemplates();
        
            console.log('[Storage] Estat carregat correctament');
            console.log(`[Storage] Calendaris: ${Object.keys(appStateManager.calendars).length}`);
            console.log(`[Storage] Categories: ${appStateManager.categoryTemplates.length}`);
            console.log(`[Storage] Events no ubicats: ${appStateManager.unplacedEvents.length}`);
        
            return true;
        
        } catch (error) {
            console.error('[Storage] Error carregant estat:', error);
            
            // Si hi ha error de parsing, netejar dades corruptes
            if (error instanceof SyntaxError) {
                console.warn('[Storage] Dades corruptes, netejant localStorage...');
                this.clearStorage();
            }
            
            return false;
        }
    }

    // Netejar localStorage
    clearStorage() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('[Storage] localStorage netejat');
            return true;
        } catch (error) {
            console.error('[Storage] Error netejant localStorage:', error);
            return false;
        }
    }

    // Netejar dades antigues per alliberar espai
    clearOldData() {
        try {
            // Netejar altres claus relacionades que poden existir
            const keysToCheck = [
                'calendarioIOC',  // Clau antiga
                'calendari-ioc-backup',
                'calendari-ioc-temp'
            ];
            
            keysToCheck.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`[Storage] 🧹 Netejat clau antiga: ${key}`);
                }
            });
            
            return true;
        } catch (error) {
            console.error('[Storage] Error netejant dades antigues:', error);
            return false;
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
            console.error('[Storage] Error obtenint informació:', error);
            return {
                exists: false,
                size: 0,
                sizeFormatted: '0 B',
                error: error.message
            };
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
        
            return JSON.stringify(exportData, null, 2);
        
        } catch (error) {
            console.error('[Storage] Error exportant estat:', error);
            return null;
        }
    }

    // Importar estat des de JSON
    importState(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
        
            if (!importData.data || !importData.version) {
                throw new Error('Format de dades no vàlid');
            }
        
            // Restaurar estat
            appStateManager.appState = {
                ...importData.data,
                currentDate: dateHelper.parseUTC(importData.data.currentDate.split('T')[0])
            };
        
            // Desar estat importat
            this.saveToStorage();
        
            console.log('[Storage] Estat importat correctament');
            return true;
        
        } catch (error) {
            console.error('[Storage] Error important estat:', error);
            return false;
        }
    }

    // Verificar si localStorage està disponible
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('[Storage] localStorage no disponible:', error);
            return false;
        }
    }

    // Inicialitzar sistema de persistència
    initializeStorage() {
        if (!this.isStorageAvailable()) {
            console.error('[Storage] localStorage no disponible');
            return false;
        }
        
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