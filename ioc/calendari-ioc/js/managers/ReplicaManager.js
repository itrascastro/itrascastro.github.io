/**
 * =================================================================
 * REPLICA MANAGER - GESTIÓ DE REPLICACIÓ I ESDEVENIMENTS NO UBICATS
 * =================================================================
 * 
 * @file        ReplicaManager.js
 * @description Gestió de replicació de calendaris i esdeveniments no ubicats
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

// Classe per gestionar la replicació de calendaris i esdeveniments no ubicats
class ReplicaManager {
    constructor() {
        this.currentSourceCalendarId = null;
    }
    
    // === GESTIÓ DE REPLICACIÓ ===
    
    // Obrir modal de replicació
    openReplicationModal(sourceCalendarId) {
        const sourceCalendar = appStateManager.calendars[sourceCalendarId];
        if (!sourceCalendar) {
            throw new CalendariIOCException('701', 'ReplicaManager.openReplicationModal');
        }

        // Obtenir llista de calendaris objectiu (tots excepte l'origen)
        const availableTargets = Object.entries(appStateManager.calendars)
            .filter(([id, _]) => id !== sourceCalendarId)
            .map(([id, calendar]) => ({ id, calendar }));

        if (availableTargets.length === 0) {
            uiHelper.showMessage('Necessites almenys 2 calendaris per fer una replicació', 'warning');
            return;
        }

        // Desar ID del calendari origen per usar en executeReplication
        this.currentSourceCalendarId = sourceCalendarId;

        // Poblar modal estàtic amb contingut dinàmic
        document.getElementById('sourceCalendarName').textContent = sourceCalendar.name;
        
        // Poblar select de calendaris destí
        this.populateTargetCalendarSelect(availableTargets);
        
        // Configurar visibilitat de l'opció dies de la setmana
        this.configureWeekdayOption(sourceCalendar, availableTargets);
        
        // Obrir modal
        modalRenderer.openModal('replicationModal');
    }
    
    // Poblar selector de calendaris destí
    populateTargetCalendarSelect(availableTargets) {
        const select = document.getElementById('targetCalendarSelect');
        if (!select) return;

        select.innerHTML = '<option value="" disabled selected>Selecciona el calendari destí</option>';
        
        availableTargets.forEach(({ id, calendar }) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = calendar.name;
            select.appendChild(option);
        });
        
        // Afegir event listener per actualitzar visibilitat de l'opció dies setmana
        select.addEventListener('change', () => {
            const sourceCalendar = appStateManager.calendars[this.currentSourceCalendarId];
            const selectedTargetId = select.value;
            
            if (sourceCalendar && selectedTargetId) {
                const targetCalendar = appStateManager.calendars[selectedTargetId];
                if (targetCalendar) {
                    this.updateWeekdayOptionVisibility(sourceCalendar, targetCalendar);
                }
            } else {
                // Si no hi ha selecció vàlida, ocultar l'opció
                this.hideWeekdayOption();
            }
        });
    }
    
    // Configurar visibilitat inicial de l'opció dies de la setmana
    configureWeekdayOption(sourceCalendar, availableTargets) {
        // Inicialment sempre ocultar l'opció - només es mostrarà després de seleccionar destí
        const weekdayOption = document.getElementById('respectWeekdays')?.parentElement;
        if (weekdayOption) {
            weekdayOption.style.display = 'none';
        }
    }
    
    // Actualitzar visibilitat quan canvia el calendari destí
    updateWeekdayOptionVisibility(sourceCalendar, targetCalendar) {
        const canRespectWeekdays = this.canRespectWeekdays(sourceCalendar, targetCalendar);
        
        const weekdayOption = document.getElementById('respectWeekdays')?.parentElement;
        if (weekdayOption) {
            weekdayOption.style.display = canRespectWeekdays ? 'block' : 'none';
        }
    }
    
    // Ocultar opció dies de la setmana
    hideWeekdayOption() {
        const weekdayOption = document.getElementById('respectWeekdays')?.parentElement;
        if (weekdayOption) {
            weekdayOption.style.display = 'none';
        }
    }
    
    // Determinar si es pot respectar els dies de la setmana (només compatibilitat, no espai)
    canRespectWeekdays(sourceCalendar, targetCalendar) {
        const replicaService = ReplicaServiceFactory.getService(sourceCalendar, targetCalendar);
        
        // Determinar quín mètode d'anàlisi usar segons el tipus de servei
        let espaiOrigen, espaiDesti;
        if (replicaService instanceof EstudiReplicaService) {
            espaiOrigen = replicaService.analyzeWorkableSpaceEstudi(sourceCalendar);
            espaiDesti = replicaService.analyzeWorkableSpaceEstudi(targetCalendar);
        } else {
            espaiOrigen = replicaService.analyzeWorkableSpace(sourceCalendar);
            espaiDesti = replicaService.analyzeWorkableSpace(targetCalendar);
        }
        
        // NOMÉS verificar compatibilitat de dies de setmana, no espai
        return this.verifyWeekdayCompatibility(espaiOrigen, espaiDesti);
    }
    
    // Verificar compatibilitat de dies de setmana (independent de l'espai disponible)
    verifyWeekdayCompatibility(espaiOrigen, espaiDesti) {
        if (espaiOrigen.length === 0 || espaiDesti.length === 0) return false;
        
        // Obtenir tots els dies de setmana usats en origen
        const originWeekdays = new Set(
            espaiOrigen.map(date => new Date(date).getDay())
        );
        
        // Obtenir tots els dies de setmana disponibles en destí
        const targetWeekdays = new Set(
            espaiDesti.map(date => new Date(date).getDay())
        );
        
        // Verificar si hi ha almenys un dia de setmana en comú
        for (const originDay of originWeekdays) {
            if (targetWeekdays.has(originDay)) {
                console.log(`[REPLICA_MANAGER] Compatibilitat dies setmana: Dia ${originDay} disponible en ambdós calendaris`);
                return true;
            }
        }
        
        console.log(`[REPLICA_MANAGER] Sense compatibilitat dies setmana entre calendaris`);
        return false;
    }
    
    // Executar replicació
    executeReplication() {
        const sourceCalendarId = this.currentSourceCalendarId;
        const targetCalendarId = document.getElementById('targetCalendarSelect').value;
        const respectWeekdays = document.getElementById('respectWeekdays').checked;
        
        if (!sourceCalendarId) {
            throw new CalendariIOCException('702', 'ReplicaManager.executeReplication');
        }
        
        if (!targetCalendarId) {
            throw new CalendariIOCException('703', 'ReplicaManager.executeReplication', false);
        }

        const sourceCalendar = appStateManager.calendars[sourceCalendarId];
        const targetCalendar = appStateManager.calendars[targetCalendarId];

        if (!sourceCalendar || !targetCalendar) {
            throw new CalendariIOCException('704', 'ReplicaManager.executeReplication');
        }

        try {
            console.log(`[Replicació] Iniciant replicació: ${sourceCalendar.name} → ${targetCalendar.name}`);
            
            // Seleccionar servei de replicació adequat mitjançant Factory
            const replicaService = ReplicaServiceFactory.getService(sourceCalendar, targetCalendar);
            
            // Executar replicació usant el servei seleccionat amb opcions d'usuari
            const result = replicaService.replicate(sourceCalendar, targetCalendar, respectWeekdays);
            
            // FASE 3: Aplicar esdeveniments replicats (ja són instàncies CalendariIOC_Event)
            result.placed.forEach(placedItem => {
                targetCalendar.addEvent(placedItem.event); // Usar mètode controlat
            });

            // Desar esdeveniments no ubicats globalment
            if (result.unplaced.length > 0) {
                appStateManager.unplacedEvents = result.unplaced;
                console.log(`[Replicació] ${result.unplaced.length} esdeveniments no ubicats desats per gestió manual`);
            }

            // Canviar al calendari destí amb gestió de persistència de navegació
            appStateManager.currentCalendarId = targetCalendarId;
            
            /**
             * Gestió de lastVisitedMonths després de replicació
             * Aplica la mateixa lògica que CalendarManager.switchCalendar()
             * per mantenir consistència en el comportament de navegació
             */
            let targetDate;
            
            if (appStateManager.lastVisitedMonths[targetCalendarId]) {
                // Recuperar últim mes visitat del calendari destí
                targetDate = dateHelper.parseUTC(appStateManager.lastVisitedMonths[targetCalendarId]);
                
                // Validació de rang: verificar que estigui dins del calendari destí
                const calendarStart = dateHelper.parseUTC(targetCalendar.startDate);
                const calendarEnd = dateHelper.parseUTC(targetCalendar.endDate);
                
                if (targetDate < calendarStart || targetDate > calendarEnd) {
                    // Fallback: usar primer mes del calendari destí
                    targetDate = dateHelper.createUTC(calendarStart.getUTCFullYear(), calendarStart.getUTCMonth(), 1);
                }
            } else {
                // Primera vegada: usar primer mes del calendari destí
                const calendarStart = dateHelper.parseUTC(targetCalendar.startDate);
                targetDate = dateHelper.createUTC(calendarStart.getUTCFullYear(), calendarStart.getUTCMonth(), 1);
            }
            
            appStateManager.currentDate = targetDate;
            
            // Persistir canvis
            storageManager.saveToStorage();
            modalRenderer.closeModal('replicationModal');
            
            // Netejar propietat de classe
            this.currentSourceCalendarId = null;
            
            const message = `Replicació completada: ${result.placed.length} events ubicats` + 
                           (result.unplaced.length > 0 ? `, ${result.unplaced.length} pendents` : '');
            uiHelper.showMessage(message, 'success');

            // Actualitzar UI per mostrar esdeveniments no ubicats
            calendarManager.updateUI();

        } catch (error) {
            if (error instanceof CalendariIOCException) {
                throw error;
            } else {
                throw new CalendariIOCException('705', 'ReplicaManager.executeReplication');
            }
        }
    }
    
    // === GESTIÓ D'ESDEVENIMENTS NO UBICATS ===
    
    // Mostrar panel d'esdeveniments no ubicats
    showUnplacedEventsPanel() {
        if (!appStateManager.unplacedEvents || appStateManager.unplacedEvents.length === 0) {
            this.hideUnplacedEventsPanel();
            return;
        }

        // Buscar si ja existeix la secció al sidebar
        let existingSection = document.getElementById('unplacedEventsSection');
        if (existingSection) {
            existingSection.remove();
        }
        
        const sectionHTML = `
            <div class="sidebar-section" id="unplacedEventsSection">
                <h2>Events Pendents de Col·locar</h2>
                
                <div class="unplaced-events-list">
                    ${appStateManager.unplacedEvents.map((item, index) => 
                        panelsRenderer.generateUnplacedEventHTML(item, index)
                    ).join('')}
                </div>
            </div>
        `;

        // Inserir al sidebar al principi (abans de totes les seccions)
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.insertAdjacentHTML('afterbegin', sectionHTML);
            
            // Configurar drag & drop per esdeveniments no ubicats
            this.setupUnplacedEventsDragDrop();
        }
    }
    
    // Amagar panel d'esdeveniments no ubicats
    hideUnplacedEventsPanel() {
        const panel = document.getElementById('unplacedEventsSection');
        if (panel) {
            panel.remove();
        }
    }
    
    // Configurar drag & drop per esdeveniments no ubicats
    setupUnplacedEventsDragDrop() {
        const unplacedEventElements = document.querySelectorAll('.unplaced-event-item[draggable="true"]');
        
        unplacedEventElements.forEach(eventEl => {
            eventEl.addEventListener('dragstart', (e) => {
                const eventIndex = eventEl.dataset.eventIndex;
                const unplacedItem = appStateManager.unplacedEvents[eventIndex];
                
                if (unplacedItem) {
                    appStateManager.draggedEvent = unplacedItem.event;
                    appStateManager.draggedFromDate = 'unplaced';
                    eventEl.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        ...unplacedItem.event,
                        isUnplacedEvent: true,
                        unplacedIndex: eventIndex
                    }));
                }
            });
            
            eventEl.addEventListener('dragend', (e) => {
                eventEl.classList.remove('dragging');
                appStateManager.cleanupDragState();
            });
        });
    }
    
    // Col·locar esdeveniment no ubicat
    placeUnplacedEvent(eventIndex, targetDate) {
        const unplacedItem = appStateManager.unplacedEvents[eventIndex];
        const calendar = appStateManager.getCurrentCalendar();
        
        if (!unplacedItem || !calendar) return;
        
        // Validar data objectiu per replicació (només dies laborables)
        dateValidationService.validateReplicationDate(targetDate, calendar);
        
        // FASE 3: Crear nou esdeveniment com a instància de classe
        const originalCategory = unplacedItem.event.getCategory();
        const categoryId = originalCategory?.id;
        let category = calendar.findCategoryById(categoryId);
        
        // Si la categoria no existeix al calendari destí, buscar-la al catàleg global
        if (!category && categoryId) {
            const categoryTemplate = appStateManager.categoryTemplates.find(t => t.id === categoryId);
            
            if (categoryTemplate) {
                // Crear nova instància de categoria per al calendari destí
                category = new CalendariIOC_Category({
                    id: categoryTemplate.id,
                    name: categoryTemplate.name,
                    color: categoryTemplate.color,
                    isSystem: false
                });
                calendar.addCategory(category);
                console.log(`[ReplicaManager] Categoria "${categoryTemplate.name}" afegida al calendari destí des del catàleg global`);
            }
        }
        
        const newEvent = new CalendariIOC_Event({
            id: idHelper.generateNextEventId(appStateManager.currentCalendarId),
            title: unplacedItem.event.title,
            date: targetDate,
            description: unplacedItem.event.description || '',
            isSystemEvent: unplacedItem.event.isSystemEvent || false,
            category: category, // Referència directa
            isReplicated: true,
            replicatedFrom: unplacedItem.event.date
        });
        
        calendar.addEvent(newEvent); // Usar mètode controlat
        
        // Eliminar d'esdeveniments no ubicats
        appStateManager.unplacedEvents.splice(eventIndex, 1);
        
        // Persistir i actualitzar
        storageManager.saveToStorage();
        viewManager.renderCurrentView();
        
        // Actualitzar UI
        panelsRenderer.renderUnplacedEvents();
        
        if (appStateManager.unplacedEvents.length === 0) {
            uiHelper.showMessage('Tots els events han estat col·locats', 'success');
        }
        
        uiHelper.showMessage(`Esdeveniment "${newEvent.title}" col·locat correctament`, 'success');
    }
    
    // Descartar esdeveniment no ubicat
    dismissUnplacedEvent(eventIndex) {
        const unplacedItem = appStateManager.unplacedEvents[eventIndex];
        
        if (!unplacedItem) return;
        
        uiHelper.showConfirmModal(
            `Estàs segur que vols descartar l'event "${unplacedItem.event.title}"?\\n\\nAquesta acció no es pot desfer.`,
            'Descartar event',
            () => {
                // Eliminar d'esdeveniments no ubicats
                appStateManager.unplacedEvents.splice(eventIndex, 1);
                
                // Persistir canvis
                storageManager.saveToStorage();
                
                // Actualitzar UI
                panelsRenderer.renderUnplacedEvents();
                
                if (appStateManager.unplacedEvents.length === 0) {
                    uiHelper.showMessage('Tots els events han estat gestionats', 'success');
                }
                
                uiHelper.showMessage('Esdeveniment descartat', 'info');
            }
        );
    }
    
}

// === INSTÀNCIA GLOBAL ===
const replicaManager = new ReplicaManager();