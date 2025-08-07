/**
 * =================================================================
 * EVENT MANAGER - GESTIÓ D'ESDEVENIMENTS
 * =================================================================
 * 
 * @file        EventManager.js
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
    // === GESTIÓ D'ESDEVENIMENTS ===
    
    // Desar esdeveniment (crear o editar)
    saveEvent() {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;

        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const categoryId = document.getElementById('eventCategory').value;
        const description = document.getElementById('eventDescription').value.trim();

        this.validateEventData(title, date, categoryId, calendar);

        // Auto-afegir categoria del catàleg al calendari si no existeix
        this.ensureCategoryExists(calendar, categoryId);

        // FASE 2: Buscar instància de Category en lloc de treballar amb categoryId
        const category = calendar.findCategoryById(categoryId);
        if (!category) {
            throw new CalendariIOCException('603', 'EventManager.saveEvent', false);
        }

        const eventData = {
            title,
            date,
            category, // REFERÈNCIA DIRECTA A INSTÀNCIA
            description,
            isSystemEvent: false
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

        uiHelper.showConfirmModal(
            "Estàs segur que vols eliminar aquest event?",
            'Eliminar event',
            () => {
                // FASE 3: Usar mètode controlat de la classe Calendar
                calendar.removeEvent(appStateManager.editingEventId);
                storageManager.saveToStorage();
                viewManager.renderCurrentView();
                modalRenderer.closeModal('eventModal');
                uiHelper.showMessage('Esdeveniment eliminat correctament', 'success');
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
        this.isValidEventMove(event, newDate, calendar);
        
        // FASE 3: Modificar instància directament (preserva classe)
        event.date = newDate;
        
        // Persistir i re-renderitzar
        storageManager.saveToStorage();
        viewManager.renderCurrentView();
        
        uiHelper.showMessage(`Esdeveniment "${event.title}" mogut correctament`, 'success');
    }
    
    // === VALIDACIONS ===
    
    // Validar dades d'esdeveniment
    validateEventData(title, date, categoryId, calendar) {
        if (!title) {
            throw new CalendariIOCException('601', 'EventManager.validateEventData', false);
        }
        if (!date) {
            throw new CalendariIOCException('602', 'EventManager.validateEventData', false);
        }
        if (!categoryId) {
            throw new CalendariIOCException('603', 'EventManager.validateEventData', false);
        }

        if (date < calendar.startDate || date > calendar.endDate) {
            throw new CalendariIOCException('604', 'EventManager.validateEventData', false);
        }
        
        return true;
    }
    
    // Validar moviment d'esdeveniment
    isValidEventMove(event, targetDate, calendar) {
        // Només esdeveniments d'usuari es poden moure
        if (event.isSystemEvent) {
            throw new CalendariIOCException('605', 'EventManager.isValidEventMove', false);
        }
        
        // Validar data utilitzant el servei centralitzat
        dateValidationService.validateEventDate(targetDate, calendar);
        return true;
    }
    
    // === CATEGORIES ===
    
    // Assegurar que la categoria existeix al calendari
    ensureCategoryExists(calendar, categoryId) {
        // FASE 2: Verificar amb findCategoryById() i afegir com a instància
        const categoryExists = calendar.findCategoryById(categoryId);
        if (!categoryExists) {
            const templateCategory = appStateManager.categoryTemplates.find(template => template.id === categoryId);
            if (templateCategory) {
                const categoryInstance = new CalendariIOC_Category({ ...templateCategory });
                calendar.addCategory(categoryInstance);
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
        // FASE 3: Obtenir categories disponibles directament (sense servei intermedi)
        const allCategories = this.getAvailableCategories(calendar);
        
        if (allCategories.length === 0) {
            throw new CalendariIOCException('606', 'EventManager.populateCategorySelect', false);
        }
        
        allCategories.forEach((cat, index) => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
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
        if (!dateValidationService.isDateInCalendarRange(dateStr, calendar)) return;
        
        dayElement.addEventListener('dragover', (e) => {
            if (!appStateManager.draggedEvent) return;
            
            let isValid = false;
            
            // Validar segons el tipus d'esdeveniment
            if (appStateManager.draggedFromDate === 'unplaced') {
                // Esdeveniment no ubicat (de replicació): només dies laborables
                isValid = dateValidationService.isValidReplicationDate(dateStr, calendar);
            } else {
                // Esdeveniment normal: usar validació estàndard
                try {
                    this.isValidEventMove(appStateManager.draggedEvent, dateStr, calendar);
                    isValid = true;
                } catch (error) {
                    isValid = false;
                }
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
                        replicaManager.placeUnplacedEvent(eventData.unplacedIndex, dateStr);
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
        // FASE 2: Trobar instància d'Event i actualitzar propietats mantenint integritat
        const event = calendar.findEventById(appStateManager.editingEventId);
        if (event) {
            event.title = eventData.title;
            event.date = eventData.date;
            event.description = eventData.description;
            event.setCategory(eventData.category); // Usar mètode controlat
        }
    }
    
    // Crear nou esdeveniment
    createNewEvent(calendar, eventData) {
        // FASE 2: Crear instància CalendariIOC_Event amb referència directa
        const newEvent = new CalendariIOC_Event({
            id: idHelper.generateNextEventId(calendar.id),
            ...eventData
        });
        calendar.addEvent(newEvent); // Usar mètode controlat
    }
    
    // Completar desament d'esdeveniment
    completeEventSave() {
        storageManager.saveToStorage();
        viewManager.renderCurrentView();
        panelsRenderer.renderCategories(); // Re-renderitzar per mostrar nova categoria si s'ha afegit
        modalRenderer.closeModal('eventModal');
        uiHelper.showMessage('Esdeveniment desat correctament', 'success');
    }
    
    // === CATEGORIES DISPONIBLES ===
    
    // FASE 3: Migrat des de CategoryService - Obtenir categories disponibles per al selector
    getAvailableCategories(calendar) {
        if (!calendar) return [];
        
        // Categories del calendari (exclou sistema)
        const calendarCategories = calendar.categories.filter(c => !c.isSystem);
        
        // Categories del catàleg global
        const templateCategories = appStateManager.categoryTemplates || [];
        
        // Combinar i evitar duplicats
        const allCategories = [...calendarCategories];
        templateCategories.forEach(template => {
            if (!allCategories.find(c => c.id === template.id)) {
                allCategories.push(template);
            }
        });
        
        return allCategories;
    }
}

// === INSTÀNCIA GLOBAL ===
const eventManager = new EventManager();