/**
 * =================================================================
 * HTML EXPORTER - EXPORTACIÓ DE CALENDARIS A HTML
 * =================================================================
 * 
 * @file        HtmlExporter.js
 * @description Exportador de calendaris a format HTML autònom i imprimible
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
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

// Classe per exportar calendaris a format HTML
class HtmlExporter {
    constructor() {
        this.exportType = 'html';
    }
    
    // === EXPORTACIÓ PRINCIPAL ===
    exportCalendar(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) {
            throw new CalendariIOCException('1101', 'HtmlExporter.exportCalendar');
        }
        
        const htmlContent = this.generateHTMLVisualCalendar(calendar);
        this.downloadHtmlFile(htmlContent, `${calendar.id.replace(/[^a-z0-9]/gi, '_')}_Calendari-IOC.html`);
        uiHelper.showMessage('Calendari HTML exportat correctament', 'success');
    }
    
    // === GENERACIÓ DE HTML COMPLET ===
    generateHTMLVisualCalendar(calendar) {
        const startDate = dateHelper.parseUTC(calendar.startDate);
        const endDate = dateHelper.parseUTC(calendar.endDate);
        
        // Usar la plantilla i reemplaçar placeholders
        return calendarHtmlTemplate
            .replace('{{CALENDAR_NAME}}', calendar.name)
            .replace('{{CALENDAR_NAME}}', calendar.name) // Apareix dues vegades
            .replace('{{PERIOD_TEXT}}', `${dateHelper.formatForDisplay(startDate)} - ${dateHelper.formatForDisplay(endDate)}`)
            .replace('{{CALENDAR_CSS}}', calendarCssStyles)
            .replace('{{CATEGORIES_LEGEND}}', this.generateCategoriesLegend(calendar))
            .replace('{{MONTHS_HTML}}', this.generateAllMonthsHTML(calendar, startDate, endDate))
            .replace('{{GENERATION_DATE}}', new Date().toLocaleDateString('ca-ES'));
    }
    
    // === GENERACIÓ DE LLEGENDA DE CATEGORIES ===
    generateCategoriesLegend(calendar) {
        const systemCategories = calendar.categories.filter(cat => cat.isSystem);
        
        // Obtenir categories d'usuari usades en aquest calendari
        const usedUserCategoryIds = new Set(
            calendar.events
                .map(e => e.getCategory()?.id)
                .filter(id => id && !systemCategories.some(cat => cat.id === id))
        );
        
        const userCategories = appStateManager.categoryTemplates.filter(template => 
            usedUserCategoryIds.has(template.id)
        );
        
        if (userCategories.length === 0 && systemCategories.length === 0) {
            return '';
        }
        
        return `
            <div class="legend">
                <h3>Llegenda de Categories</h3>
                <div class="legend-items">
                    ${userCategories.map(cat => `
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: ${cat.color};"></div>
                            <span>${cat.name}</span>
                        </div>
                    `).join('')}
                    ${systemCategories.map(cat => `
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: ${cat.color};"></div>
                            <span>${cat.name} (Sistema)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // === GENERACIÓ DE MESOS ===
    generateAllMonthsHTML(calendar, startDate, endDate) {
        const months = [];
        const currentDate = dateHelper.createUTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1);
        const lastMonth = dateHelper.createUTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1);
        
        while (currentDate <= lastMonth) {
            months.push(this.generateMonthHTML(calendar, currentDate));
            currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
        }
        
        return months.join('');
    }
    
    generateMonthHTML(calendar, monthDate) {
        // Usar el renderitzador per generar l'HTML del mes
        return monthRenderer.render(calendar, monthDate, 'HTML');
    }
    
    // === DESCÀRREGA D'ARXIU ===
    downloadHtmlFile(content, filename) {
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// === INSTÀNCIA GLOBAL ===
const htmlExporter = new HtmlExporter();