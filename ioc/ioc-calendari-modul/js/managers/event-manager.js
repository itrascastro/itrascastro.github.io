/**
 * =================================================================
 * EVENT MANAGER - GESTIÓ D'ESDEVENIMENTS
 * =================================================================
 * 
 * @file        event-manager.js
 * @description Gestió d'esdeveniments del calendari, creació i edició
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

// Classe per gestionar tots els esdeveniments del calendari
class EventManager {
    constructor() {
        this.managerType = 'event';
    }
    
    // === GESTIÓ D'ESDEVENIMENTS ===
    
    // Guardar esdeveniment (crear o editar)
    saveEvent() {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;

        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const categoryId = document.getElementById('eventCategory').value;
        const description = document.getElementById('eventDescription').value.trim();

        if (!this.validateEventData(title, date, categoryId, calendar)) {
            return;
        }

        // Auto-afegir categoria del catàleg al calendari si no existeix
        this.ensureCategoryExists(calendar, categoryId);

        const eventData = {
            title,
            date,
            categoryId,
            description,
            isSystemEvent: false,
            eventType: 'PROFESSOR'
        };

        if (appStateManager.editingEventId) {
            this.updateExistingEvent(calendar, eventData);
        } else {
            this.createNewEvent(calendar, eventData);
        }

        this.completeEventSave();
    }
    
    // Eliminar esdeveniment
    deleteEvent() {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar || !appStateManager.editingEventId) return;

        showConfirmModal(
            "Estàs segur que vols eliminar aquest event?",
            'Eliminar event',
            () => {
                calendar.events = calendar.events.filter(e => e.id !== appStateManager.editingEventId);
                storageManager.saveToStorage();
                viewManager.renderCurrentView();
                closeModal('eventModal');
                showMessage('Event eliminat correctament', 'success');
            }
        );
    }
    
    // Moure esdeveniment (drag & drop)
    moveEvent(eventId, newDate) {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        const event = calendar.events.find(e => e.id === eventId);
        if (!event) return;
        
        const oldDate = event.date;
        if (oldDate === newDate) return; // Cap canvi
        
        // Validacions de negoci
        if (!this.isValidEventMove(event, newDate, calendar)) {
            return;
        }
        
        // IMMUTABILITAT: Crear nou estat sense mutar l'original
        const newEvents = calendar.events.map(e => 
            e.id === eventId ? { ...e, date: newDate } : e
        );
        
        // Aplicar canvi
        calendar.events = newEvents;
        
        // Persistir i re-renderitzar
        storageManager.saveToStorage();
        viewManager.renderCurrentView();
        
        showMessage(`Event "${event.title}" mogut correctament`, 'success');
    }
    
    // === VALIDACIONS ===
    
    // Validar dades d'esdeveniment
    validateEventData(title, date, categoryId, calendar) {
        if (!title) {
            showMessage("El títol de l'event és obligatori.", 'error');
            return false;
        }
        if (!date) {
            showMessage("Has de seleccionar una data per a l'event.", 'error');
            return false;
        }
        if (!categoryId) {
            showMessage("Has de seleccionar una categoria de la llista.", 'error');
            return false;
        }

        if (date < calendar.startDate || date > calendar.endDate) {
            showMessage("La data de l'event ha d'estar dins del període del calendari actiu.", 'error');
            return false;
        }
        
        return true;
    }
    
    // Validar moviment d'esdeveniment
    isValidEventMove(event, targetDate, calendar) {
        // Només esdeveniments d'usuari es poden moure
        if (event.isSystemEvent) {
            showMessage('No es poden moure els events del sistema IOC', 'error');
            return false;
        }
        
        // Validar data utilitzant el servei centralitzat
        return DateValidationService.validateEventWithMessage(targetDate, calendar);
    }
    
    // === CATEGORIES ===
    
    // Assegurar que la categoria existeix al calendari
    ensureCategoryExists(calendar, categoryId) {
        const categoryExists = calendar.categories.some(cat => cat.id === categoryId);
        if (!categoryExists) {
            const templateCategory = appStateManager.categoryTemplates.find(template => template.id === categoryId);
            if (templateCategory) {
                calendar.categories.push({ ...templateCategory });
                console.log(`[Catàleg] Categoria "${templateCategory.name}" afegida automàticament al calendari`);
            }
        }
    }
    
    // Poblar selector de categories
    populateCategorySelect() {
        const calendar = appStateManager.getCurrentCalendar();
        const select = document.getElementById('eventCategory');
        if (!calendar || !select) return;

        select.innerHTML = '<option value="" disabled selected>Selecciona una categoria</option>';
        
        // Categories del sistema del calendari actual - NOMÉS PER INFORMACIÓ
        const systemCategories = calendar.categories.filter(cat => cat.isSystem);
        
        // PER ESDEVENIMENTS D'USUARI: Només categories del catàleg (no sistema)
        // Obtenir categories disponibles utilitzant el servei centralitzat
        const allCategories = CategoryService.getAvailableCategories(calendar);
        
        // Debug: Mostrar quantes categories tenim
        console.log(`[EventManager] Categories de sistema (no mostrades): ${systemCategories.length}`);
        console.log(`[EventManager] Categories d'usuari disponibles: ${allCategories.length}`);
        console.log(`[EventManager] Total categories al selector: ${allCategories.length}`);
        console.log(`[EventManager] Categories de sistema (ocultes):`, systemCategories.map(c => c.name));
        console.log(`[EventManager] Categories d'usuari disponibles:`, allCategories.map(c => c.name));
        
        if (allCategories.length === 0) {
            console.warn('[EventManager] No hi ha categories disponibles!');
        }
        
        allCategories.forEach((cat, index) => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name; // Només categories d'usuari, no cal indicar tipus
            select.appendChild(option);
            console.log(`[EventManager] Afegida categoria ${index + 1}: ${cat.name} (ID: ${cat.id})`);
        });
        
        console.log(`[EventManager] Select final té ${select.options.length - 1} categories (excloent placeholder)`);
    }
    
    // === DRAG & DROP ===
    
    // Fer esdeveniment arrossegable
    makeEventDraggable(eventElement, event, dateStr) {
        if (!event || event.isSystemEvent) return;
        
        eventElement.draggable = true;
        
        eventElement.addEventListener('dragstart', (e) => {
            appStateManager.draggedEvent = event;
            appStateManager.draggedFromDate = dateStr;
            eventElement.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify(event));
        });
        
        eventElement.addEventListener('dragend', (e) => {
            eventElement.classList.remove('dragging');
            appStateManager.cleanupDragState();
        });
    }
    
    // Fer dia receptiu per drop
    makeDayDroppable(dayElement, dateStr) {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        // Només permetre drop en dies dins del rang del calendari
        if (!DateValidationService.isDateInCalendarRange(dateStr, calendar)) return;
        
        dayElement.addEventListener('dragover', (e) => {
            if (!appStateManager.draggedEvent) return;
            
            let isValid = false;
            
            // Validar segons el tipus d'esdeveniment
            if (appStateManager.draggedFromDate === 'unplaced') {
                // Esdeveniment no ubicat (de replicació): només dies laborables
                isValid = DateValidationService.isValidReplicationDate(dateStr, calendar);
            } else {
                // Esdeveniment normal: usar validació estàndard
                isValid = this.isValidEventMove(appStateManager.draggedEvent, dateStr, calendar);
            }
            
            if (isValid) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                dayElement.classList.add('drop-target');
            } else {
                dayElement.classList.add('drop-invalid');
            }
        });
        
        dayElement.addEventListener('dragleave', (e) => {
            // Només netejar si realment sortim de l'element
            if (!dayElement.contains(e.relatedTarget)) {
                dayElement.classList.remove('drop-target', 'drop-invalid');
            }
        });
        
        dayElement.addEventListener('drop', (e) => {
            e.preventDefault();
            dayElement.classList.remove('drop-target', 'drop-invalid');
            
            if (appStateManager.draggedEvent) {
                if (appStateManager.draggedFromDate === 'unplaced') {
                    // Manejar esdeveniment no ubicat
                    const eventData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (eventData.isUnplacedEvent) {
                        replicationManager.placeUnplacedEvent(eventData.unplacedIndex, dateStr);
                    }
                } else if (appStateManager.draggedFromDate !== dateStr) {
                    // Manejar esdeveniment normal
                    this.moveEvent(appStateManager.draggedEvent.id, dateStr);
                }
            }
            
            appStateManager.cleanupDragState();
        });
    }
    
    // === MÈTODES AUXILIARS ===
    
    // Actualitzar esdeveniment existent
    updateExistingEvent(calendar, eventData) {
        const eventIndex = calendar.events.findIndex(e => e.id === appStateManager.editingEventId);
        if (eventIndex > -1) {
            calendar.events[eventIndex] = { ...calendar.events[eventIndex], ...eventData };
        }
    }
    
    // Crear nou esdeveniment
    createNewEvent(calendar, eventData) {
        eventData.id = generateNextEventId(appStateManager.currentCalendarId);
        calendar.events.push(eventData);
    }
    
    // Completar desament d'esdeveniment
    completeEventSave() {
        storageManager.saveToStorage();
        viewManager.renderCurrentView();
        panelsRenderer.renderCategories(); // Re-renderitzar per mostrar nova categoria si s'ha afegit
        closeModal('eventModal');
        showMessage('Event guardat correctament', 'success');
    }
}

// === INSTÀNCIA GLOBAL ===
const eventManager = new EventManager();