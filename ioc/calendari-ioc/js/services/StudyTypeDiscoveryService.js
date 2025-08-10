/**
 * =================================================================
 * STUDY TYPE DISCOVERY SERVICE - Descobriment Dinàmic de Tipus d'Estudi
 * =================================================================
 * 
 * @file        StudyTypeDiscoveryService.js
 * @description Servei per descobrir automàticament els tipus d'estudi
 *              disponibles basant-se en la convenció de noms de fitxers.
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     2.0.0
 * @date        2025-08-10
 * @project     Calendari Mòdul IOC
 * @license     MIT
 * 
 * =================================================================
 */
class StudyTypeDiscoveryService {
    constructor() {
        this.studyTypes = [];
        this.configs = new Map();
        this.isInitialized = false;
        this.initializationPromise = null;
        this.fallbackMode = false;
    }

    async initialize() {
        // Singleton pattern: només una inicialització simultània
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        if (this.isInitialized) {
            return Promise.resolve();
        }

        this.initializationPromise = this._performInitialization();
        
        try {
            await this.initializationPromise;
        } catch (error) {
            console.warn('[Discovery] Inicialització fallida, activant mode fallback:', error.message);
            this._activateFallbackMode();
        } finally {
            this.initializationPromise = null;
        }

        return Promise.resolve();
    }

    async initializeWithFeedback() {
        console.log('[Discovery] Inicialitzant sistema de descobriment...');
        
        try {
            await this.initialize();
            this._reportSuccessfulDiscovery();
        } catch (error) {
            console.warn('[Discovery] Error inicialitzant discovery service, continuant amb mode fallback:', error.message);
            // Error ja gestionat internament per initialize()
        }
    }

    _reportSuccessfulDiscovery() {
        if (this.isInFallbackMode()) {
            console.warn('[Discovery] Sistema en mode fallback: només calendaris genèrics disponibles');
            this._showFallbackNotification();
        } else {
            console.log(`[Discovery] Discovery completat: ${this.studyTypes.length} tipus d'estudi descoberts`);
        }
    }

    _showFallbackNotification() {
        // Mostrar notificació visual que està en mode fallback
        setTimeout(() => {
            if (typeof uiHelper !== 'undefined' && uiHelper.showMessage) {
                uiHelper.showMessage('Sistema en mode simplificat: només calendaris genèrics disponibles', 'warning', 5000);
            }
        }, 1000);
    }

    async _performInitialization() {
        // Simulació de descobriment de fitxers (en un entorn real seria una crida API)
        const allConfigFiles = ['fp.json', 'btx.json', '_common.json', '_sys-categories.json'];
        const studyConfigFiles = allConfigFiles.filter(file => !file.startsWith('_'));
        const systemConfigFiles = allConfigFiles.filter(file => file.startsWith('_'));

        // Carregar configuracions d'estudi amb retry
        for (const configFile of studyConfigFiles) {
            await this._loadStudyConfig(configFile);
        }

        // Carregar configuracions del sistema
        for (const configFile of systemConfigFiles) {
            await this._loadSystemConfig(configFile);
        }

        this.isInitialized = true;
        
        if (this.studyTypes.length > 0) {
            console.log(`[Discovery] Descobriment completat: ${this.studyTypes.length} tipus d'estudi carregats`);
        } else {
            console.log(`[Discovery] Cap tipus d'estudi descobert, només mode genèric disponible`);
        }
    }

    async _loadStudyConfig(configFile, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(`config/${configFile}`, {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const configData = await response.json();

                if (configData.metadata && configData.metadata.displayName) {
                    const typeId = configFile.replace('.json', '').toUpperCase();
                    this.studyTypes.push({
                        id: typeId,
                        displayName: configData.metadata.displayName,
                        placeholder: configData.metadata.placeholder || `Ex: ${typeId}_Identificador`,
                        configFile: configFile
                    });
                    this.configs.set(typeId, configData);
                }
                return; // Èxit, sortir del retry loop
                
            } catch (error) {
                if (attempt === retries) {
                    // Només mostrar error després de tots els intents
                    console.warn(`[Discovery] No s'ha pogut carregar ${configFile} després de ${retries} intents: ${error.message}`);
                } else {
                    // Intent fallit, però fem retry silenciós
                    console.debug(`[Discovery] Intent ${attempt}/${retries} per ${configFile} fallit, reintentant...`);
                    await this._delay(Math.pow(2, attempt - 1) * 1000); // Exponential backoff
                }
            }
        }
    }

    async _loadSystemConfig(configFile, retries = 2) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(`config/${configFile}`, {
                    cache: 'no-cache'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const configData = await response.json();
                const configKey = configFile.replace('_', '').replace('.json', '').toUpperCase();
                this.configs.set(configKey, configData);
                return;
                
            } catch (error) {
                if (attempt === retries) {
                    // Només mostrar warning al final dels intents
                    console.warn(`[Discovery] Fitxer del sistema ${configFile} no disponible: ${error.message}`);
                } else {
                    // Retry silenciós
                    console.debug(`[Discovery] Reintentant càrrega de ${configFile}...`);
                    await this._delay(500 * attempt);
                }
            }
        }
    }

    _activateFallbackMode() {
        this.fallbackMode = true;
        this.studyTypes = []; // Només mode ALTRE disponible
        this.configs.clear();
        
        console.warn('[Discovery] Mode fallback activat: només calendaris genèrics disponibles');
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStudyTypes() {
        return this.studyTypes;
    }

    getStudyType(typeId) {
        return this.studyTypes.find(type => type.id.toUpperCase() === typeId.toUpperCase());
    }

    getConfig(typeId) {
        return this.configs.get(typeId.toUpperCase());
    }

    isInFallbackMode() {
        return this.fallbackMode;
    }

    isReady() {
        return this.isInitialized || this.fallbackMode;
    }

    getAvailableTypes() {
        if (this.fallbackMode) {
            return ['ALTRE']; // Només genèrics disponibles en fallback
        }
        return this.studyTypes.map(type => type.id);
    }
}

const studyTypeDiscovery = new StudyTypeDiscoveryService();