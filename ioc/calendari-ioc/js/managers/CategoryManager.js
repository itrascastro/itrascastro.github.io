/**
 * =================================================================
 * CATEGORY MANAGER - GESTIÓ DE CATEGORIES
 * =================================================================
 * 
 * @file        CategoryManager.js
 * @description Gestió de categories d'esdeveniments i catàleg global
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

// Classe per gestionar totes les categories de l'aplicació
class CategoryManager {
    constructor() {
        // Colors ara gestionats per ColorCategoryHelper
    }
    
    // === GESTIÓ DE CATEGORIES ===
    
    // Afegir nova categoria
    addCategory() {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;

        const nameInput = document.getElementById('new-category-name');
        const name = nameInput.value.trim();

        this.validateCategoryName(name);

        // Verificar si ja existeix al catàleg
        if (this.categoryExistsInCatalog(name)) {
            throw new CalendariIOCException('801', 'CategoryManager.addCategory', false);
        }

        const newCategory = this.createCategory(name);
        this.addToCatalogAndCalendar(newCategory, calendar);
        this.completeCategoryAdd(nameInput);
    }
    
    // Eliminar categoria
    deleteCategory(element) {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        const categoryItem = element.closest('.category-list-item');
        const categoryId = categoryItem.dataset.categoryId;
        
        // Buscar la categoria (pot estar en calendari o només en catàleg)
        const calendarCategory = calendar.categories.find(c => c.id === categoryId);
        const templateCategory = appStateManager.categoryTemplates.find(t => t.id === categoryId);
        const category = calendarCategory || templateCategory;
        
        if (!category) return;

        this.confirmAndDeleteCategory(category, categoryId);
    }
    
    // Iniciar edició de categoria
    startEditCategory(element) {
        const categoryItem = element.closest('.category-list-item');
        if (categoryItem.classList.contains('is-editing')) return;

        // Tancar altres categories en edició
        this.closeAllEditingSessions();

        // Obrir aquesta categoria en edició
        this.openCategoryForEditing(categoryItem);
    }
    
    // Desar edició de categoria
    saveEditCategory(inputElement) {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;

        const categoryItem = inputElement.closest('.category-list-item');
        const categoryId = categoryItem.dataset.categoryId;
        const newName = inputElement.value.trim();

        // Si el nom està buit, restaurar i no fer res
        if (!newName) {
            this.restoreOriginalCategoryName(categoryItem, categoryId);
            return;
        }
        
        this.updateCategoryInCatalogAndCalendars(categoryId, newName, calendar);
        this.closeCategoryEditing(categoryItem);
        this.completeCategoryEdit();
    }
    
    // === VALIDACIONS ===
    
    // Validar nom de categoria
    validateCategoryName(name) {
        if (!name) {
            throw new CalendariIOCException('802', 'CategoryManager.validateCategoryName', false);
        }
        return true;
    }
    
    // Verificar si la categoria existeix al catàleg
    categoryExistsInCatalog(name) {
        return appStateManager.categoryTemplates.some(template => 
            template.name.toLowerCase() === name.toLowerCase()
        );
    }
    
    
    // === CREACIÓ I MANIPULACIÓ ===
    
    // Crear nova categoria
    createCategory(name) {
        // FASE 2: Crear instància CalendariIOC_Category
        return new CalendariIOC_Category({
            id: idHelper.generateNextCategoryId(appStateManager.currentCalendarId),
            name: name,
            color: colorCategoryHelper.generateRandomColor(),
            isSystem: false,
        });
    }
    
    // Afegir al catàleg i calendari
    addToCatalogAndCalendar(category, calendar) {
        // Afegir al catàleg global
        appStateManager.categoryTemplates.push(category);
        
        // FASE 2: Usar mètode controlat per afegir al calendari
        calendar.addCategory(category);
    }
    
    // Completar afegit de categoria
    completeCategoryAdd(nameInput) {
        nameInput.value = '';
        storageManager.saveToStorage();
        panelsRenderer.renderCategories();
        uiHelper.showMessage('Categoria creada i afegida al catàleg', 'success');
    }
    
    // === ELIMINACIÓ ===
    
    // Confirmar i eliminar categoria
    confirmAndDeleteCategory(category, categoryId) {
        const eventCount = this.countEventsUsingCategory(categoryId);
        const confirmationMessage = this.buildDeleteConfirmationMessage(category, eventCount);

        uiHelper.showConfirmModal(
            confirmationMessage,
            'Eliminar categoria',
            () => {
                this.executeDeleteCategory(categoryId);
            }
        );
    }
    
    // Comptar esdeveniments que usen la categoria
    countEventsUsingCategory(categoryId) {
        let totalEvents = 0;
        Object.values(appStateManager.calendars).forEach(cal => {
            // FASE 4: Usar referències directes de les classes Event
            totalEvents += cal.events.filter(e => e.getCategory()?.id === categoryId).length;
        });
        return totalEvents;
    }
    
    // Construir missatge de confirmació
    buildDeleteConfirmationMessage(category, eventCount) {
        let message = `Estàs segur que vols eliminar la categoria "${category.name}"?`;
        
        if (eventCount > 0) {
            message += `\n\nATENCIÓ: Aquesta categoria s'utilitza en ${eventCount} event(s) en tots els calendaris. Tots aquests events seran eliminats. Aquesta acció no es pot desfer.`;
        }
        
        return message;
    }
    
    // Executar eliminació de categoria
    executeDeleteCategory(categoryId) {
        // Eliminar del catàleg global
        appStateManager.categoryTemplates = appStateManager.categoryTemplates.filter(t => t.id !== categoryId);
        
        // FASE 4: Usar mètodes controlats de Calendar per eliminar esdeveniments i categories
        Object.values(appStateManager.calendars).forEach(cal => {
            // Primer, eliminar la categoria del calendari
            cal.removeCategory(categoryId);
            
            // Després, trobar i eliminar tots els esdeveniments que usaven aquesta categoria
            const eventsToDelete = cal.events.filter(e => {
                const category = e.getCategory();
                return category && category.id === categoryId;
            });
            
            eventsToDelete.forEach(event => {
                cal.removeEvent(event.id);
            });
        });

        storageManager.saveToStorage();
        calendarManager.updateUI();
        uiHelper.showMessage('Categoria eliminada del catàleg i de tots els calendaris', 'success');
    }
    
    // === EDICIÓ ===
    
    // Tancar totes les sessions d'edició
    closeAllEditingSessions() {
        document.querySelectorAll('.category-list-item.is-editing').forEach(item => {
            item.classList.remove('is-editing');
            const span = item.querySelector('.category-name');
            const input = item.querySelector('.category-input');
            span.style.display = 'inline';
            input.style.display = 'none';
        });
    }
    
    // Obrir categoria per edició
    openCategoryForEditing(categoryItem) {
        categoryItem.classList.add('is-editing');
        const span = categoryItem.querySelector('.category-name');
        const input = categoryItem.querySelector('.category-input');
        span.style.display = 'none';
        input.style.display = 'inline';
        input.focus();
        input.select();
    }
    
    // Restaurar nom original de categoria
    restoreOriginalCategoryName(categoryItem, categoryId) {
        const calendar = appStateManager.getCurrentCalendar();
        const originalCategory = calendar.categories.find(c => c.id === categoryId) || 
                               appStateManager.categoryTemplates.find(t => t.id === categoryId);
        
        const input = categoryItem.querySelector('.category-input');
        input.value = originalCategory ? originalCategory.name : '';
        this.closeCategoryEditing(categoryItem);
    }
    
    // Tancar edició de categoria
    closeCategoryEditing(categoryItem) {
        categoryItem.classList.remove('is-editing');
        const span = categoryItem.querySelector('.category-name');
        const input = categoryItem.querySelector('.category-input');
        span.style.display = 'inline';
        input.style.display = 'none';
    }
    
    // Actualitzar categoria en catàleg i calendaris
    updateCategoryInCatalogAndCalendars(categoryId, newName, calendar) {
        // Actualitzar en catàleg global
        const templateIndex = appStateManager.categoryTemplates.findIndex(t => t.id === categoryId);
        if (templateIndex > -1) {
            appStateManager.categoryTemplates[templateIndex].name = newName;
        }
        
        // Actualitzar en calendari actual si existeix
        const calendarCategory = calendar.categories.find(c => c.id === categoryId);
        if (calendarCategory) {
            calendarCategory.name = newName;
        }
    }
    
    // Completar edició de categoria
    completeCategoryEdit() {
        storageManager.saveToStorage();
        panelsRenderer.renderCategories();
        viewManager.renderCurrentView(); // Re-renderitzar per mostrar canvis en esdeveniments
        uiHelper.showMessage('Categoria actualitzada en tots els calendaris', 'success');
    }
    
    // === UTILITATS ===
    
    // Generar color aleatori (delegat al helper)
    generateRandomColor() {
        return colorCategoryHelper.generateRandomColor();
    }
}

// === INSTÀNCIA GLOBAL ===
const categoryManager = new CategoryManager();