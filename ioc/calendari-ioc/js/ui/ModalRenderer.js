/**
 * =================================================================
 * MODALS - GESTIÓ CENTRALITZADA DE MODALS
 * =================================================================
 * 
 * @file        ModalRenderer.js
 * @description Gestió de modals i formularis de l'aplicació
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     2.0.0
 * @date        2025-08-09
 * @project     Calendari Mòdul IOC
 * @license     MIT
 * 
 * =================================================================
 */
class ModalRenderer {
    constructor() {
        this.studyTypes = [];
    }

    async initialize() {
        await studyTypeDiscovery.initialize();
        this.studyTypes = studyTypeDiscovery.getStudyTypes();
    }

    openModal(modalId) {
        document.getElementById(modalId)?.classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove('show');
    }

    async openNewCalendarModal() {
        if (this.studyTypes.length === 0) {
            await this.initialize();
        }

        document.getElementById('setupModalTitle').textContent = 'Nou Calendari';
        this.populateStudyTypeDropdown();
        document.getElementById('dynamicFields').innerHTML = '';
        document.getElementById('namePreview').style.display = 'none';
        document.getElementById('saveCalendarBtn').textContent = 'Crear Calendari';
        document.getElementById('deleteCalendarBtn').style.display = 'none';
        
        this.setupDynamicFormListener();
        this.openModal('calendarSetupModal');
    }

    populateStudyTypeDropdown() {
        const select = document.getElementById('studyType');
        select.innerHTML = '<option value="">Selecciona tipus...</option>';

        this.studyTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.displayName;
            select.appendChild(option);
        });

        const altreOption = document.createElement('option');
        altreOption.value = 'ALTRE';
        altreOption.textContent = 'Altre (Genèric)';
        select.appendChild(altreOption);
        
        select.value = '';
    }

    setupDynamicFormListener() {
        const studyTypeSelect = document.getElementById('studyType');
        const newSelect = studyTypeSelect.cloneNode(true);
        studyTypeSelect.parentNode.replaceChild(newSelect, studyTypeSelect);

        newSelect.addEventListener('change', (e) => {
            const selectedTypeId = e.target.value;
            this.renderDynamicFields(selectedTypeId);
        });
    }

    renderDynamicFields(typeId) {
        const dynamicFields = document.getElementById('dynamicFields');
        dynamicFields.innerHTML = '';
        document.getElementById('namePreview').style.display = 'none';
        if (!typeId) return;

        if (typeId === 'ALTRE') {
            dynamicFields.innerHTML = `
                <div class="form-group">
                    <label for="calendarName">Nom del calendari</label>
                    <input type="text" id="calendarName" name="calendarName" placeholder="Ex: Calendari Personal" required>
                </div>
                <div class="form-group">
                    <label for="startDate">Data d'inici</label>
                    <input type="date" id="startDate" name="startDate" required>
                </div>
                <div class="form-group">
                    <label for="endDate">Data de fi</label>
                    <input type="date" id="endDate" name="endDate" required>
                </div>
            `;
        } else {
            const selectedType = this.studyTypes.find(t => t.id === typeId);
            if (!selectedType) return;

            dynamicFields.innerHTML = `
                <div class="form-group">
                    <label for="studyIdentifier">Identificador del Calendari</label>
                    <input type="text" id="studyIdentifier" name="studyIdentifier" placeholder="${selectedType.placeholder}" required>
                </div>
            `;
        }
    }
    
    openCalendarActionsModal(calendarId) {
        appStateManager.setSelectedCalendarId(calendarId);
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) return;
        
        const importIcsBtn = document.getElementById('importIcsBtn');
        importIcsBtn.style.display = calendar.type === 'ALTRE' ? 'block' : 'none';
        
        const button = document.querySelector(`[data-calendar-id="${calendarId}"] .actions-menu`);
        const modal = document.getElementById('calendarActionsModal');
        const content = modal.querySelector('.calendar-actions-content');
        
        const buttonRect = button.getBoundingClientRect();
        content.style.right = `${window.innerWidth - buttonRect.right}px`;
        content.style.top = `${buttonRect.bottom + 2}px`;
        
        const closeOnOutsideClick = (e) => {
            if (!content.contains(e.target) && !button.contains(e.target)) {
                this.closeModal('calendarActionsModal');
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };
        
        setTimeout(() => document.addEventListener('click', closeOnOutsideClick), 50);
        this.openModal('calendarActionsModal');
    }
    
    openColorPickerModal(categoryId, colorDotElement) {
        appStateManager.setSelectedCategoryId(categoryId);
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        const category = calendar.findCategoryById(categoryId) || appStateManager.categoryTemplates.find(t => t.id === categoryId);
        if (!category) return;
        
        const modal = document.getElementById('colorPickerModal');
        const content = modal.querySelector('.color-picker-content');
        const grid = document.getElementById('colorPickerGrid');
        
        grid.innerHTML = colorCategoryHelper.colors.map(color => `
            <div class="color-option ${color === category.color ? 'selected' : ''}" 
                 style="background-color: ${color};" 
                 data-color="${color}" 
                 data-action="select-color"></div>
        `).join('');
        
        const buttonRect = colorDotElement.getBoundingClientRect();
        content.style.left = `${buttonRect.left}px`;
        content.style.top = `${buttonRect.bottom + 2}px`;
        
        const closeOnOutsideClick = (e) => {
            if (!content.contains(e.target) && !colorDotElement.contains(e.target)) {
                this.closeModal('colorPickerModal');
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };
        
        setTimeout(() => document.addEventListener('click', closeOnOutsideClick), 50);
        this.openModal('colorPickerModal');
    }
    
    openEventModal(event = null, date = null) {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;

        const modal = document.getElementById('eventModal');
        const title = document.getElementById('eventModalTitle');
        const deleteBtn = document.getElementById('deleteEventBtn');
        
        eventManager.populateCategorySelect();

        if (event && !event.isSystemEvent) {
            appStateManager.editingEventId = event.id;
            title.textContent = 'Editar Esdeveniment';
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.date;
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
    
    selectCategoryColor(newColor) {
        const selectedCategoryId = appStateManager.getSelectedCategoryId();
        if (!selectedCategoryId) return;
        
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        const templateIndex = appStateManager.categoryTemplates.findIndex(t => t.id === selectedCategoryId);
        if (templateIndex > -1) {
            appStateManager.categoryTemplates[templateIndex].color = newColor;
        }
        
        Object.values(appStateManager.calendars).forEach(cal => {
            const calendarCategory = cal.categories.find(c => c.id === selectedCategoryId);
            if (calendarCategory) {
                calendarCategory.color = newColor;
                if (calendarCategory.isSystem) {
                    appStateManager.appState.systemCategoryColors[selectedCategoryId] = newColor;
                }
            }
        });
        
        this.closeModal('colorPickerModal');
        storageManager.saveToStorage();
        panelsRenderer.renderCategories();
        viewManager.renderCurrentView();
        appStateManager.clearSelectedCategoryId();
    }
}

const modalRenderer = new ModalRenderer();