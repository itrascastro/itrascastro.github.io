/**
 * =================================================================
 * MODALS - GESTIÓ CENTRALITZADA DE MODALS
 * =================================================================
 * 
 * @file        ModalRenderer.js
 * @description Gestió de modals i formularis de l'aplicació
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

// Classe per gestionar tots els modals de l'aplicació
class ModalRenderer {
    
    // === FUNCIONS BÀSIQUES DE MODAL ===
    
    // Obrir modal
    openModal(modalId) {
        document.getElementById(modalId)?.classList.add('show');
    }
    
    // Tancar modal
    closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove('show');
    }
    
    // === MODALS ESPECÍFICS ===
    
    // Modal de creació de nou calendari
    openNewCalendarModal() {
        document.getElementById('setupModalTitle').textContent = 'Nou Calendari';
        document.getElementById('studyType').value = '';
        document.getElementById('dynamicFields').innerHTML = '';
        document.getElementById('namePreview').style.display = 'none';
        document.getElementById('saveCalendarBtn').textContent = 'Crear Calendari';
        document.getElementById('deleteCalendarBtn').style.display = 'none';
        
        // Afegir event listener per canvis de tipus
        this.setupStudyTypeListener();
        
        this.openModal('calendarSetupModal');
    }
    
    // Configurar listener per tipus d'estudi
    setupStudyTypeListener() {
        const studyTypeSelect = document.getElementById('studyType');
        const dynamicFields = document.getElementById('dynamicFields');
        const namePreview = document.getElementById('namePreview');
        const generatedName = document.getElementById('generatedName');
        
        studyTypeSelect.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            dynamicFields.innerHTML = '';
            namePreview.style.display = 'none';
            
            if (selectedType === 'FP') {
                dynamicFields.innerHTML = `
                    <div class="form-group">
                        <label for="cicleCode">Cicle Formatiu (ex: DAM, DAW, ASIX)</label>
                        <input type="text" id="cicleCode" name="cicleCode" placeholder="DAM">
                    </div>
                    <div class="form-group">
                        <label for="moduleCode">Codi del Mòdul (ex: M07B0)</label>
                        <input type="text" id="moduleCode" name="moduleCode" placeholder="M07B0">
                    </div>
                `;
                this.setupFPNamePreview();
                
            } else if (selectedType === 'BTX') {
                dynamicFields.innerHTML = `
                    <div class="form-group">
                        <label for="subjectCode">Assignatura (ex: FISICA, QUIMICA)</label>
                        <input type="text" id="subjectCode" name="subjectCode" placeholder="">
                    </div>
                `;
                this.setupBTXNamePreview();
                
            } else if (selectedType === 'Altre') {
                dynamicFields.innerHTML = `
                    <div class="form-group">
                        <label for="calendarName">Nom del calendari</label>
                        <input type="text" id="calendarName" name="calendarName" placeholder="">
                    </div>
                    <div class="form-group">
                        <label for="startDate">Data d'inici</label>
                        <input type="date" id="startDate" name="startDate">
                    </div>
                    <div class="form-group">
                        <label for="endDate">Data de fi</label>
                        <input type="date" id="endDate" name="endDate">
                    </div>
                `;
                this.setupAltreNamePreview();
            }
        });
    }
    
    // Preview del nom per FP
    setupFPNamePreview() {
        const cicleInput = document.getElementById('cicleCode');
        const moduleInput = document.getElementById('moduleCode');
        const updatePreview = () => {
            const cicle = cicleInput.value.trim().toUpperCase();
            const module = moduleInput.value.trim().toUpperCase();
            if (cicle && module) {
                document.getElementById('generatedName').textContent = `FP_${cicle}_${module}_25S1`;
                document.getElementById('namePreview').style.display = 'block';
            } else {
                document.getElementById('namePreview').style.display = 'none';
            }
        };
        cicleInput.addEventListener('input', updatePreview);
        moduleInput.addEventListener('input', updatePreview);
    }
    
    // Preview del nom per BTX
    setupBTXNamePreview() {
        const subjectInput = document.getElementById('subjectCode');
        const updatePreview = () => {
            const subject = subjectInput.value.trim().toUpperCase();
            if (subject) {
                document.getElementById('generatedName').textContent = `BTX_${subject}_25S1`;
                document.getElementById('namePreview').style.display = 'block';
            } else {
                document.getElementById('namePreview').style.display = 'none';
            }
        };
        subjectInput.addEventListener('input', updatePreview);
    }
    
    // Preview del nom per Altre
    setupAltreNamePreview() {
        const nameInput = document.getElementById('calendarName');
        const updatePreview = () => {
            const name = nameInput.value.trim();
            if (name) {
                document.getElementById('generatedName').textContent = name;
                document.getElementById('namePreview').style.display = 'block';
            } else {
                document.getElementById('namePreview').style.display = 'none';
            }
        };
        nameInput.addEventListener('input', updatePreview);
    }
    
    // Generar ID per tipus "Altre"
    generateAltreId(name, timestamp) {
        const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_');
        return `${cleanName}_${timestamp}`;
    }
    
    // Modal d'accions de calendari
    openCalendarActionsModal(calendarId) {
        appStateManager.setSelectedCalendarId(calendarId);
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) return;
        
        // Mostrar botó "Importar ICS" només per calendaris tipus "Altre"
        const importIcsBtn = document.getElementById('importIcsBtn');
        if (calendar.type === 'Altre') {
            importIcsBtn.style.display = 'block';
        } else {
            importIcsBtn.style.display = 'none';
        }
        
        const button = document.querySelector(`[data-calendar-id="${calendarId}"] .actions-menu`);
        const modal = document.getElementById('calendarActionsModal');
        const content = modal.querySelector('.calendar-actions-content');
        
        // Obtenir posició del botó
        const buttonRect = button.getBoundingClientRect();
        
        // Posicionar el modal com dropdown
        content.style.right = `${window.innerWidth - buttonRect.right}px`;
        content.style.top = `${buttonRect.bottom + 2}px`;
        
        // Afegir esdeveniment per tancar al fer clic fora
        const closeOnOutsideClick = (e) => {
            if (!content.contains(e.target) && !button.contains(e.target)) {
                this.closeModal('calendarActionsModal');
                document.removeEventListener('click', closeOnOutsideClick);
                modal.removeEventListener('mouseleave', closeOnMouseLeave);
            }
        };
        
        // Afegir esdeveniment per tancar al treure el ratolí
        const closeOnMouseLeave = (e) => {
            if (!content.contains(e.relatedTarget) && !button.contains(e.relatedTarget)) {
                this.closeModal('calendarActionsModal');
                modal.removeEventListener('mouseleave', closeOnMouseLeave);
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeOnOutsideClick);
            modal.addEventListener('mouseleave', closeOnMouseLeave);
        }, 50);
        
        this.openModal('calendarActionsModal');
    }
    
    // Modal de selector de colors
    openColorPickerModal(categoryId, colorDotElement) {
        appStateManager.setSelectedCategoryId(categoryId);
        
        // Buscar la categoria per obtenir el seu color actual
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        // FASE 3: Accés directe sense CategoryService
        const category = calendar.findCategoryById(categoryId) || 
                         appStateManager.categoryTemplates.find(t => t.id === categoryId);
        if (!category) return;
        
        const modal = document.getElementById('colorPickerModal');
        const content = modal.querySelector('.color-picker-content');
        const grid = document.getElementById('colorPickerGrid');
        
        // Generar la graella de colors
        grid.innerHTML = colorCategoryHelper.colors.map(color => `
            <div class="color-option ${color === category.color ? 'selected' : ''}" 
                 style="background-color: ${color};" 
                 data-color="${color}" 
                 data-action="select-color"></div>
        `).join('');
        
        // Obtenir posició del color dot
        const buttonRect = colorDotElement.getBoundingClientRect();
        
        // Posicionar el modal com dropdown
        content.style.left = `${buttonRect.left}px`;
        content.style.top = `${buttonRect.bottom + 2}px`;
        
        // Afegir esdeveniment per tancar al fer clic fora
        const closeOnOutsideClick = (e) => {
            if (!content.contains(e.target) && !colorDotElement.contains(e.target)) {
                this.closeModal('colorPickerModal');
                document.removeEventListener('click', closeOnOutsideClick);
                modal.removeEventListener('mouseleave', closeOnMouseLeave);
            }
        };
        
        // Afegir esdeveniment per tancar al treure el ratolí
        const closeOnMouseLeave = (e) => {
            if (!content.contains(e.relatedTarget) && !colorDotElement.contains(e.relatedTarget)) {
                this.closeModal('colorPickerModal');
                modal.removeEventListener('mouseleave', closeOnMouseLeave);
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeOnOutsideClick);
            modal.addEventListener('mouseleave', closeOnMouseLeave);
        }, 50);
        
        this.openModal('colorPickerModal');
    }
    
    // Modal d'esdeveniments
    openEventModal(event = null, date = null) {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;

        const modal = document.getElementById('eventModal');
        const title = document.getElementById('eventModalTitle');
        const deleteBtn = document.getElementById('deleteEventBtn');
        
        console.log('[Modal] Cridant populateCategorySelect...');
        eventManager.populateCategorySelect();
        console.log('[Modal] populateCategorySelect completada');

        if (event && !event.isSystemEvent) {
            appStateManager.editingEventId = event.id;
            title.textContent = 'Editar Esdeveniment';
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.date;
            // FASE 3: Usar mètode directe per obtenir categoryId
            document.getElementById('eventCategory').value = event.getCategory()?.id || '';
            document.getElementById('eventDescription').value = event.description || '';
            deleteBtn.style.display = 'inline-block';
        } else {
            appStateManager.editingEventId = null;
            title.textContent = 'Nou Esdeveniment';
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventDate').value = date;
            document.getElementById('eventCategory').value = '';
            document.getElementById('eventDescription').value = '';
            deleteBtn.style.display = 'none';
        }

        this.openModal('eventModal');
    }
    
    // === FUNCIONS AUXILIARS ===
    
    // Seleccionar color de categoria
    selectCategoryColor(newColor) {
        const selectedCategoryId = appStateManager.getSelectedCategoryId();
        if (!selectedCategoryId) return;
        
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        // Actualitzar en catàleg global
        const templateIndex = appStateManager.categoryTemplates.findIndex(t => t.id === selectedCategoryId);
        if (templateIndex > -1) {
            appStateManager.categoryTemplates[templateIndex].color = newColor;
        }
        
        // Actualitzar en TOTS els calendaris que tinguin aquesta categoria
        Object.values(appStateManager.calendars).forEach(cal => {
            const calendarCategory = cal.categories.find(c => c.id === selectedCategoryId);
            if (calendarCategory) {
                calendarCategory.color = newColor;
                
                // Si és categoria de sistema, persistir color per a futures càrregues
                if (calendarCategory.isSystem) {
                    appStateManager.appState.systemCategoryColors[selectedCategoryId] = newColor;
                }
            }
        });
        
        this.closeModal('colorPickerModal');
        storageManager.saveToStorage();
        panelsRenderer.renderCategories();
        viewManager.renderCurrentView(); // Re-renderitzar per mostrar canvis en esdeveniments
        
        appStateManager.clearSelectedCategoryId();
    }
}

// === INSTÀNCIA GLOBAL ===
const modalRenderer = new ModalRenderer();