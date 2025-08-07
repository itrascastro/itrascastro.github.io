/**
 * =================================================================
 * COLOR CATEGORY HELPER - UTILITATS PER COLORS DE CATEGORIES
 * =================================================================
 * 
 * @file        ColorCategoryHelper.js
 * @description Helper per gestionar colors de categories d'esdeveniments
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-27
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * =================================================================
 */

// Classe helper per gestionar colors de categories
class ColorCategoryHelper {
    constructor() {
        // Paleta de colors per categories
        this.colors = [
            '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795',
            '#3182ce', '#553c9a', '#805ad5', '#d53f8c', '#f56565',
            '#fd7f28', '#ecc94b', '#48bb78', '#4fd1c7', '#63b3ed',
            '#b794f6', '#f687b3', '#fc8181', '#fbb6ce', '#c6f6d5'
        ];
    }
    
    // === GENERACIÓ DE COLORS ===
    
    // Obtenir tots els colors actualment usats
    getUsedColors() {
        const usedColors = [];
        
        // Colors de categories de sistema
        Object.values(appStateManager.appState.systemCategoryColors).forEach(color => {
            if (color) usedColors.push(color);
        });
        
        // Colors de categories dels calendaris
        Object.values(appStateManager.appState.calendars).forEach(calendar => {
            if (calendar.categories) {
                calendar.categories.forEach(category => {
                    if (category.color) usedColors.push(category.color);
                });
            }
        });
        
        // Colors de plantilles de categories
        appStateManager.appState.categoryTemplates.forEach(template => {
            if (template.color) usedColors.push(template.color);
        });
        
        // Eliminar duplicats i retornar
        return [...new Set(usedColors)];
    }
    
    // Generar color aleatori evitant duplicats
    generateRandomColor() {
        const usedColors = this.getUsedColors();
        const availableColors = this.colors.filter(color => !usedColors.includes(color));
        
        if (availableColors.length > 0) {
            // Retornar color disponible
            return availableColors[Math.floor(Math.random() * availableColors.length)];
        } else {
            // Fallback: si tots els colors estan usats, retornar aleatori de la paleta
            return this.colors[Math.floor(Math.random() * this.colors.length)];
        }
    }
    
    // === GESTIÓ DE COLORS DE CATEGORIES DE SISTEMA ===
    
    // Assignar color a categoria de sistema amb persistència
    assignSystemCategoryColor(categoryId) {
        // Verificar si ja té color assignat
        const savedColor = appStateManager.appState.systemCategoryColors[categoryId];
        
        if (savedColor) {
            // Retornar color desat
            return savedColor;
        }
        
        // Primera vegada: generar color aleatori
        const newColor = this.generateRandomColor();
        
        // Guardar per a futures càrregues
        appStateManager.appState.systemCategoryColors[categoryId] = newColor;
        
        // Persistir canvis
        storageManager.saveToStorage();
        
        console.log(`[ColorCategoryHelper] Color assignat a ${categoryId}: ${newColor}`);
        
        return newColor;
    }
}

// === INSTÀNCIA GLOBAL ===
const colorCategoryHelper = new ColorCategoryHelper();