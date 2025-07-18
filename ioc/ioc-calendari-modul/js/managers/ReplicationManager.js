/**
 * =================================================================
 * REPLICATION MANAGER - GESTIÓ DE REPLICACIÓ I ESDEVENIMENTS NO UBICATS
 * =================================================================
 * 
 * @file        ReplicationManager.js
 * @description Gestió de replicació de calendaris i esdeveniments no ubicats
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

// Variable global per emmagatzemar l'ID del calendari origen
let currentSourceCalendarId = null;

// Classe per gestionar la replicació de calendaris i esdeveniments no ubicats
class ReplicationManager {
    constructor() {
        this.managerType = 'replication';
    }
    
    // === GESTIÓ DE REPLICACIÓ ===
    
    // Obrir modal de replicació
    openReplicationModal(sourceCalendarId) {
        const sourceCalendar = appStateManager.calendars[sourceCalendarId];
        if (!sourceCalendar) {
            uiHelper.showMessage('Calendari origen no trobat', 'error');
            return;
        }

        // Obtenir llista de calendaris objectiu (tots excepte l'origen)
        const availableTargets = Object.entries(appStateManager.calendars)
            .filter(([id, _]) => id !== sourceCalendarId)
            .map(([id, calendar]) => ({ id, calendar }));

        if (availableTargets.length === 0) {
            uiHelper.showMessage('Necessites almenys 2 calendaris per fer una replicació', 'warning');
            return;
        }

        // Guardar ID del calendari origen per usar en executeReplication
        currentSourceCalendarId = sourceCalendarId;

        // Poblar modal estàtic amb contingut dinàmic
        document.getElementById('sourceCalendarName').textContent = sourceCalendar.name;
        
        // Poblar select de calendaris destí
        this.populateTargetCalendarSelect(availableTargets);
        
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
    }
    
    // Executar replicació
    executeReplication() {
        const sourceCalendarId = currentSourceCalendarId;
        const targetCalendarId = document.getElementById('targetCalendarSelect').value;
        
        if (!sourceCalendarId) {
            uiHelper.showMessage('Error: No s\'ha seleccionat calendari origen', 'error');
            return;
        }
        
        if (!targetCalendarId) {
            uiHelper.showMessage('Selecciona un calendari destí', 'error');
            return;
        }

        const sourceCalendar = appStateManager.calendars[sourceCalendarId];
        const targetCalendar = appStateManager.calendars[targetCalendarId];

        if (!sourceCalendar || !targetCalendar) {
            uiHelper.showMessage('Error accedint als calendaris', 'error');
            return;
        }

        try {
            console.log(`[Replicació] Iniciant replicació: ${sourceCalendar.name} → ${targetCalendar.name}`);
            
            // Executar replicació usant el motor
            const result = replicationEngine.replicate(sourceCalendar, targetCalendar);
            
            // Aplicar esdeveniments replicats al calendari destí
            result.placed.forEach(placedItem => {
                const newEvent = {
                    ...placedItem.event,
                    id: idHelper.generateNextEventId(targetCalendarId),
                    date: placedItem.newDate
                };
                targetCalendar.events.push(newEvent);
            });

            // Guardar esdeveniments no ubicats globalment
            if (result.unplaced.length > 0) {
                appStateManager.unplacedEvents = result.unplaced;
                console.log(`[Replicació] ${result.unplaced.length} events no ubicats guardats per gestió manual`);
            }

            // Canviar al calendari destí
            appStateManager.currentCalendarId = targetCalendarId;
            appStateManager.currentDate = dateHelper.parseUTC(targetCalendar.startDate);
            
            // Persistir canvis
            storageManager.saveToStorage();
            calendarManager.updateUI();
            modalRenderer.closeModal('replicationModal');
            
            // Netejar variable global
            currentSourceCalendarId = null;
            
            const message = `Replicació completada: ${result.placed.length} events ubicats` + 
                           (result.unplaced.length > 0 ? `, ${result.unplaced.length} pendents` : '');
            uiHelper.showMessage(message, 'success');

            // Actualitzar UI per mostrar esdeveniments no ubicats
            calendarManager.updateUI();

        } catch (error) {
            console.error('[Replicació] Error:', error);
            uiHelper.showMessage('Error durant la replicació: ' + error.message, 'error');
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
    
    // Tancar panel d'esdeveniments no ubicats
    closeUnplacedEventsPanel() {
        const panel = document.getElementById('unplacedEventsSection');
        if (panel) {
            panel.remove();
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
        if (!DateValidationService.validateReplicationWithMessage(targetDate, calendar)) {
            return;
        }
        
        // Crear nou esdeveniment al calendari
        const newEvent = {
            ...unplacedItem.event,
            id: idHelper.generateNextEventId(appStateManager.currentCalendarId),
            date: targetDate,
            isReplicated: true,
            replicatedFrom: unplacedItem.event.date
        };
        
        calendar.events.push(newEvent);
        
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
        
        uiHelper.showMessage(`Event "${newEvent.title}" col·locat correctament`, 'success');
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
                
                uiHelper.showMessage('Event descartat', 'info');
            }
        );
    }
    
    // === GESTIÓ D'ARXIUS ===
}

// === INSTÀNCIA GLOBAL ===
const replicationManager = new ReplicationManager();