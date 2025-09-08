/**
 * =================================================================
 * STUDY TYPE DISCOVERY SERVICE - Descobriment Dinàmic de Tipus d'Estudi
 * =================================================================
 * 
 * @file        StudyTypeDiscoveryService.js
 * @description Servei per descobrir automàticament els tipus d'estudi
 *              disponibles basant-se en la convenció de noms de fitxers.
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0
 * @date        2025-08-10
 * @project     Calendari IOC
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
        await this.initializationPromise;
        this.initializationPromise = null;
    }

    async initializeWithFeedback() {
        console.log('[Discovery] Inicialitzant sistema de descobriment...');
        await this.initialize();
        console.log(`[Discovery] Descobriment completat: ${this.studyTypes.length} tipus d'estudi carregats`);
    }


    async _performInitialization() {
        // Carregar llista d'estudis disponibles
        const availableStudies = await this._loadAvailableStudies();
        const studyConfigFiles = availableStudies.map(study => `${study}.json`);
        const systemConfigFiles = ['sys/common.json', 'sys/categories.json'];

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

    async _loadAvailableStudies() {
        try {
            const response = await fetch('config/available-studies.json', {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new CalendariIOCException('111', `StudyTypeDiscoveryService._loadAvailableStudies - available-studies.json: HTTP ${response.status}`);
                } else {
                    throw new CalendariIOCException('109', `StudyTypeDiscoveryService._loadAvailableStudies - available-studies.json: HTTP ${response.status}`);
                }
            }

            const availableStudies = await response.json();
            console.log(`[Discovery] Estudis disponibles descoberts: ${availableStudies.join(', ')}`);
            return availableStudies;
            
        } catch (error) {
            if (error instanceof CalendariIOCException) {
                throw error; // Re-llançar CalendariIOCException sense modificar
            } else if (error.name === 'SyntaxError') {
                throw new CalendariIOCException('110', `StudyTypeDiscoveryService._loadAvailableStudies - JSON parsing error: ${error.message}`);
            } else {
                throw new CalendariIOCException('109', `StudyTypeDiscoveryService._loadAvailableStudies: ${error.message}`);
            }
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
                    if (response.status === 404) {
                        throw new CalendariIOCException('111', `StudyTypeDiscoveryService._loadStudyConfig - ${configFile}: HTTP ${response.status}`);
                    } else {
                        throw new CalendariIOCException('109', `StudyTypeDiscoveryService._loadStudyConfig - ${configFile}: HTTP ${response.status}`);
                    }
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
                    // Després de tots els intents, llançar CalendariIOCException
                    if (error instanceof CalendariIOCException) {
                        throw error; // Re-llançar CalendariIOCException sense modificar
                    } else if (error.name === 'SyntaxError') {
                        throw new CalendariIOCException('110', `StudyTypeDiscoveryService._loadStudyConfig - ${configFile} JSON parsing error: ${error.message}`);
                    } else {
                        throw new CalendariIOCException('109', `StudyTypeDiscoveryService._loadStudyConfig - ${configFile}: ${error.message}`);
                    }
                } else {
                    // Intent fallit, però fem retry silenciós (només debug)
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
                    if (response.status === 404) {
                        throw new CalendariIOCException('111', `StudyTypeDiscoveryService._loadSystemConfig - ${configFile}: HTTP ${response.status}`);
                    } else {
                        throw new CalendariIOCException('109', `StudyTypeDiscoveryService._loadSystemConfig - ${configFile}: HTTP ${response.status}`);
                    }
                }

                const configData = await response.json();
                // Mapatge específic per fitxers del sistema
                let configKey;
                if (configFile === 'sys/common.json') {
                    configKey = 'COMMON';
                } else if (configFile === 'sys/categories.json') {
                    configKey = 'SYS-CATEGORIES';
                } else {
                    configKey = configFile.replace('.json', '').toUpperCase();
                }
                this.configs.set(configKey, configData);
                return;
                
            } catch (error) {
                if (attempt === retries) {
                    // Després de tots els intents, llançar CalendariIOCException per fitxers del sistema
                    if (error instanceof CalendariIOCException) {
                        throw error; // Re-llançar CalendariIOCException sense modificar
                    } else if (error.name === 'SyntaxError') {
                        throw new CalendariIOCException('110', `StudyTypeDiscoveryService._loadSystemConfig - ${configFile} JSON parsing error: ${error.message}`);
                    } else {
                        throw new CalendariIOCException('109', `StudyTypeDiscoveryService._loadSystemConfig - ${configFile}: ${error.message}`);
                    }
                } else {
                    // Retry silenciós
                    await this._delay(500 * attempt);
                }
            }
        }
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


    isReady() {
        return this.isInitialized;
    }

    getAvailableTypes() {
        return this.studyTypes.map(type => type.id);
    }
}

const studyTypeDiscovery = new StudyTypeDiscoveryService();