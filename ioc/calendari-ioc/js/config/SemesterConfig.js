/**
 * =================================================================
 * SEMESTER CONFIG - GESTIÓ DE LA CONFIGURACIÓ DEL SEMESTRE IOC
 * =================================================================
 * 
 * @file        SemesterConfig.js
 * @description Processa la configuració d'un semestre acadèmic.
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0
 * @date        2025-08-09
 * @project     Calendari IOC
 * @license     MIT
 * 
 * =================================================================
 */

class SemesterConfig {
    constructor(specificConfigData, commonConfigData, systemCategoriesData) {
        if (!specificConfigData || !commonConfigData || !systemCategoriesData) {
            throw new CalendariIOCException('1001', 'SemesterConfig.constructor: Falten dades de configuració.');
        }
        this.data = this.mergeConfigurations(commonConfigData, specificConfigData, systemCategoriesData);
    }
    
    mergeConfigurations(commonConfig, specificConfig, systemCategories) {
        const mergedEvents = [
            ...(commonConfig.systemEvents || []),
            ...(specificConfig.systemEvents || [])
        ];
        
        const eventsWithIds = this.generateEventIds(mergedEvents);
        const categoriesWithSystemFlag = this.addIsSystemToCategories(systemCategories);

        return {
            semester: specificConfig.semester || commonConfig.semester,
            defaultCategories: categoriesWithSystemFlag || [],
            systemEvents: eventsWithIds
        };
    }
    
    generateEventIds(events) {
        return events.map((event, index) => ({
            ...event,
            id: `SYS_EVENT_${index + 1}`,
            isSystemEvent: true
        }));
    }
    
    addIsSystemToCategories(categories) {
        return categories.map(category => ({
            ...category,
            isSystem: true
        }));
    }
    
    getSemester() {
        return this.data.semester;
    }
    
    getSystemEvents() {
        return this.data.systemEvents || [];
    }
    
    getDefaultCategories() {
        return this.data.defaultCategories || [];
    }
    
    getStartDate() {
        const semester = this.getSemester();
        return semester ? semester.startDate : null;
    }
    
    getEndDate() {
        const semester = this.getSemester();
        return semester ? semester.endDate : null;
    }
    
    getSemesterCode() {
        const semester = this.getSemester();
        return semester ? semester.code : null;
    }
}