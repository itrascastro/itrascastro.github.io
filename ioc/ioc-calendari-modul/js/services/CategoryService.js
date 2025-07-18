/**
 * =================================================================
 * CATEGORY SERVICE - SERVEI CENTRALITZAT PER GESTIÓ DE CATEGORIES
 * =================================================================
 * 
 * @file        category-service.js
 * @description Servei per gestió centralitzada de categories i plantilles
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

// Servei per centralitzar tota la lògica de gestió de categories
class CategoryService {
    
    // === CERCA DE CATEGORIES ===
    
    // Trobar categoria per ID (cerca primer al calendari, després al catàleg global)
    static findCategoryById(categoryId, calendar) {
        if (!categoryId) return null;
        
        // Buscar primer a les categories del calendari
        const calendarCategory = calendar?.categories?.find(c => c.id === categoryId);
        if (calendarCategory) return calendarCategory;
        
        // Si no es trova, buscar al catàleg global
        const templateCategory = appStateManager.categoryTemplates?.find(t => t.id === categoryId);
        return templateCategory || null;
    }
    
    // Obtenir color d'una categoria
    static getCategoryColor(categoryId, calendar) {
        const category = this.findCategoryById(categoryId, calendar);
        return category ? category.color : '#888'; // Color per defecte
    }
    
    // Obtenir nom d'una categoria
    static getCategoryName(categoryId, calendar) {
        const category = this.findCategoryById(categoryId, calendar);
        return category ? category.name : 'Categoria desconeguda';
    }
    
    // === CATEGORIES DISPONIBLES ===
    
    // Obtenir categories disponibles per al selector (exclou categories de sistema)
    static getAvailableCategories(calendar) {
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
    
    // Obtenir totes les categories (inclou sistema)
    static getAllCategories(calendar) {
        if (!calendar) return [];
        
        return calendar.categories || [];
    }
    
    // === VALIDACIONS ===
    
    // Verificar si una categoria existeix
    static categoryExists(categoryId, calendar) {
        return this.findCategoryById(categoryId, calendar) !== null;
    }
    
    // Verificar si una categoria és del sistema
    static isSystemCategory(categoryId, calendar) {
        const category = this.findCategoryById(categoryId, calendar);
        return category ? category.isSystem === true : false;
    }
    
    // === UTILITATS ===
    
    // Obtenir estadístiques de categories
    static getCategoryStats(calendar) {
        if (!calendar) return { total: 0, system: 0, user: 0 };
        
        const total = calendar.categories.length;
        const system = calendar.categories.filter(c => c.isSystem).length;
        const user = total - system;
        
        return { total, system, user };
    }
}