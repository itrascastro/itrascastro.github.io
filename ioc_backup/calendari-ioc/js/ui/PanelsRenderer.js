/**
 * =================================================================
 * PANELS RENDERER - RENDERITZADOR PER ALS PANELLS LATERALS
 * =================================================================
 * 
 * @file        PanelsRenderer.js
 * @description Renderitzador per als panells laterals (calendaris, categories, esdeveniments)
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0
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

// Renderitzador específic per als panells laterals de l'aplicació
class PanelsRenderer {
    constructor() {
        this.rendererType = 'panels';
    }
    
    // === RENDERITZACIÓ DE CALENDARIS DESATS ===
    renderSavedCalendars() {
        const container = document.getElementById('calendars-list-container');
        if (!container) return;
        
        const calendarIds = Object.keys(appStateManager.calendars);
        if (calendarIds.length === 0) {
            container.innerHTML = `<p style="color: var(--secondary-text-color); font-style: italic; text-align: center; padding: 20px 0;">Crea o carrega un calendari.</p>`;
            return;
        }
        
        container.innerHTML = calendarIds.map(id => {
            const calendar = appStateManager.calendars[id];
            const isActive = id === appStateManager.currentCalendarId;
            const startDate = dateHelper.formatForDisplay(dateHelper.parseUTC(calendar.startDate));
            const endDate = dateHelper.formatForDisplay(dateHelper.parseUTC(calendar.endDate));
            return `
                <div class="calendar-list-item ${isActive ? 'active' : ''}" data-calendar-id="${id}">
                    <div class="calendar-info" data-action="switch-calendar">
                        <div class="calendar-name">${calendar.name}</div>
                        <div class="calendar-dates">${startDate} - ${endDate}</div>
                    </div>
                    <button class="actions-menu" data-action="open-calendar-actions-modal" data-calendar-id="${id}">⋮</button>
                </div>
            `;
        }).join('');
    }
    
    // === RENDERITZACIÓ DE CATEGORIES ===
    renderCategories() {
        const container = document.getElementById('categories-list-container');
        if (!container) return;
        
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) {
            container.innerHTML = '<p style="color: var(--secondary-text-color); font-style: italic; text-align: center;">Selecciona un calendari.</p>';
            return;
        }

        // Combinar categorías del sistema + catálogo global + categorías específicas del calendari
        const systemCategories = calendar.categories.filter(cat => cat.isSystem);
        const calendarSpecificCategories = calendar.categories.filter(cat => !cat.isSystem);
        
        // Evitar duplicats entre catàleg i categories específiques del calendari
        const catalogCategories = appStateManager.categoryTemplates.filter(template => 
            !calendarSpecificCategories.some(calCat => calCat.id === template.id)
        );
        
        const allCategories = [...systemCategories, ...catalogCategories, ...calendarSpecificCategories];

        container.innerHTML = allCategories.map(cat => {
            const isSystemCat = cat.isSystem;
            
            // Solo las categorías de usuario pueden ser eliminadas
            const deleteButtonHTML = !isSystemCat ? `<button class="delete-icon" data-action="delete-category">&times;</button>` : '';
            const categoryItemClass = isSystemCat ? 'category-list-item system-category' : 'category-list-item';
            const categoryNameClass = isSystemCat ? 'category-name system' : 'category-name editable';
            const editAction = !isSystemCat ? 'data-action="start-edit-category"' : '';

            return `
                <div class="${categoryItemClass}" data-category-id="${cat.id}">
                    <div class="color-dot-wrapper">
                        <div class="color-dot" style="background-color: ${cat.color};" data-action="open-color-picker-modal" data-category-id="${cat.id}"></div>
                    </div>
                    <div class="category-name-wrapper" ${editAction}>
                        <span class="${categoryNameClass}">${cat.name} ${isSystemCat ? ' (Sistema)' : ''}</span>
                        <input class="category-input" type="text" value="${cat.name}" id="category-input-${cat.id}" name="category-${cat.id}" ${isSystemCat ? 'disabled' : ''} style="display: none;">
                    </div>
                    ${deleteButtonHTML}
                </div>
            `;
        }).join('');

        // Configurar event listeners para edición de categorías
        this.setupCategoryEditListeners(container);
    }
    
    // === RENDERITZACIÓ D'ESDEVENIMENTS NO UBICATS ===
    renderUnplacedEvents() {
        const container = document.getElementById('unplaced-events-container');
        if (!container) return;
        
        // Obtener el panel completo
        const panel = container.closest('.sidebar-section.panel-scrollable');
        
        if (!appStateManager.unplacedEvents || appStateManager.unplacedEvents.length === 0) {
            // Ocultar el panel completo cuando no hay eventos
            if (panel) {
                panel.style.display = 'none';
            }
            return;
        }

        // Mostrar el panel si hay eventos
        if (panel) {
            panel.style.display = 'flex';
        }

        container.innerHTML = appStateManager.unplacedEvents.map((item, index) => 
            this.generateUnplacedEventHTML(item, index)
        ).join('');
        
        // Configurar drag & drop para eventos no ubicados
        replicaManager.setupUnplacedEventsDragDrop();
    }
    
    // === GENERACIÓ DE HTML D'ESDEVENIMENTS NO UBICATS ===
    generateUnplacedEventHTML(item, index) {
        // Usar mètode getCategoryName() de CalendariIOC_Event
        const categoryName = item.event.getCategoryName();
        
        return `
            <div class="unplaced-event-item" draggable="true" data-event-index="${index}">
                <div class="unplaced-event-content">
                    <div class="event-title">${item.event.title}</div>
                    <div class="event-category">${categoryName}</div>
                    <div class="event-original-date">${dateHelper.formatForDisplay(dateHelper.parseUTC(item.event.date))}</div>
                </div>
                <button class="dismiss-btn" data-action="dismiss-unplaced-event" data-event-index="${index}" title="Descartar event">×</button>
            </div>
        `;
    }
    
    // === RENDERITZACIÓ COMPLETA DE TOTS ELS PANELLS ===
    renderAll() {
        this.renderSavedCalendars();
        this.renderCategories();
        this.renderUnplacedEvents();
    }
    
    // === CONFIGURACIÓ D'EVENT LISTENERS ===
    setupCategoryEditListeners(container) {
        container.querySelectorAll('.category-input').forEach(input => {
            input.addEventListener('blur', (e) => categoryManager.saveEditCategory(e.target));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    categoryManager.saveEditCategory(e.target);
                } else if (e.key === 'Escape') {
                    const categoryItem = e.target.closest('.category-list-item');
                    categoryItem.classList.remove('is-editing');
                    // Restaurar vista normal
                    const span = categoryItem.querySelector('.category-name');
                    const input = categoryItem.querySelector('.category-input');
                    span.style.display = 'inline';
                    input.style.display = 'none';
                }
            });
        });
    }
}

// === INSTÀNCIA GLOBAL ===

// Renderitzador principal per als panells laterals
const panelsRenderer = new PanelsRenderer();