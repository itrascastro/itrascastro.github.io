// =================================================================
// MODALS - GESTIÓ CENTRALITZADA DE MODALS
// =================================================================

// === FUNCIONS BÀSIQUES DE MODAL ===

// Obrir modal
function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('show');
}

// Tancar modal
function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('show');
}

// === MODALS ESPECÍFICS ===

// Modal de configuració de calendari
function openCalendarSetupModal() {
    appState.editingCalendarId = null;
    document.getElementById('setupModalTitle').textContent = `Nou Calendari de Mòdul ${semesterConfig.getSemesterCode()}`;
    document.getElementById('cicleCode').value = '';
    document.getElementById('moduleCode').value = '';
    document.getElementById('saveCalendarBtn').textContent = 'Crear Calendari';
    document.getElementById('deleteCalendarBtn').style.display = 'none';
    openModal('calendarSetupModal');
}

// Modal d'accions de calendari
function openCalendarActionsModal(calendarId) {
    setSelectedCalendarId(calendarId);
    const calendar = appState.calendars[calendarId];
    if (!calendar) return;
    
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
            closeModal('calendarActionsModal');
            document.removeEventListener('click', closeOnOutsideClick);
        }
    };
    
    // Afegir esdeveniment per tancar al treure el ratolí
    const closeOnMouseLeave = (e) => {
        if (!content.contains(e.relatedTarget) && !button.contains(e.relatedTarget)) {
            closeModal('calendarActionsModal');
            modal.removeEventListener('mouseleave', closeOnMouseLeave);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeOnOutsideClick);
        modal.addEventListener('mouseleave', closeOnMouseLeave);
    }, 50);
    
    openModal('calendarActionsModal');
}

// Modal de selector de colors
function openColorPickerModal(categoryId, colorDotElement) {
    setSelectedCategoryId(categoryId);
    
    // Buscar la categoria per obtenir el seu color actual
    const calendar = getCurrentCalendar();
    if (!calendar) return;
    
    const category = CategoryService.findCategoryById(categoryId, calendar);
    if (!category) return;
    
    const modal = document.getElementById('colorPickerModal');
    const content = modal.querySelector('.color-picker-content');
    const grid = document.getElementById('colorPickerGrid');
    
    // Generar la graella de colors
    grid.innerHTML = categoryManager.colors.map(color => `
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
            closeModal('colorPickerModal');
            document.removeEventListener('click', closeOnOutsideClick);
        }
    };
    
    // Afegir esdeveniment per tancar al treure el ratolí
    const closeOnMouseLeave = (e) => {
        if (!content.contains(e.relatedTarget) && !colorDotElement.contains(e.relatedTarget)) {
            closeModal('colorPickerModal');
            modal.removeEventListener('mouseleave', closeOnMouseLeave);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeOnOutsideClick);
        modal.addEventListener('mouseleave', closeOnMouseLeave);
    }, 50);
    
    openModal('colorPickerModal');
}

// Modal d'esdeveniments
function openEventModal(event = null, date = null) {
    const calendar = getCurrentCalendar();
    if (!calendar) return;

    const modal = document.getElementById('eventModal');
    const title = document.getElementById('eventModalTitle');
    const deleteBtn = document.getElementById('deleteEventBtn');
    
    console.log('[Modal] Cridant populateCategorySelect...');
    eventManager.populateCategorySelect();
    console.log('[Modal] populateCategorySelect completada');

    if (event && !event.isSystemEvent) {
        appState.editingEventId = event.id;
        title.textContent = 'Editar Event';
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventCategory').value = event.categoryId;
        document.getElementById('eventDescription').value = event.description || '';
        deleteBtn.style.display = 'inline-block';
    } else {
        appState.editingEventId = null;
        title.textContent = 'Nou Event';
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventDate').value = date;
        document.getElementById('eventCategory').value = '';
        document.getElementById('eventDescription').value = '';
        deleteBtn.style.display = 'none';
    }

    openModal('eventModal');
}

// === FUNCIONS AUXILIARS ===

// Seleccionar color de categoria
function selectCategoryColor(newColor) {
    const selectedCategoryId = getSelectedCategoryId();
    if (!selectedCategoryId) return;
    
    const calendar = getCurrentCalendar();
    if (!calendar) return;
    
    // Actualitzar en catàleg global
    const templateIndex = appState.categoryTemplates.findIndex(t => t.id === selectedCategoryId);
    if (templateIndex > -1) {
        appState.categoryTemplates[templateIndex].color = newColor;
    }
    
    // Actualitzar en TOTS els calendaris que tinguin aquesta categoria
    Object.values(appState.calendars).forEach(cal => {
        const calendarCategory = cal.categories.find(c => c.id === selectedCategoryId);
        if (calendarCategory) {
            calendarCategory.color = newColor;
        }
    });
    
    closeModal('colorPickerModal');
    saveToStorage();
    panelsRenderer.renderCategories();
    viewManager.renderCurrentView(); // Re-renderitzar per mostrar canvis en esdeveniments
    
    clearSelectedCategoryId();
}

// === FUNCIÓ populateCategorySelect MOGUDA A js/managers/event-manager.js ===
// Aquesta funció duplicada causava que només es mostressin les categories locals
// La funció correcta ara inclou categories del sistema + catàleg global

// === GESTIÓ D'ESDEVENIMENTS DE MODAL ===

// Inicialitzar esdeveniments de modal
function initializeModalEvents() {
    console.log('[Modals] Sistema de modals inicialitzat');
}