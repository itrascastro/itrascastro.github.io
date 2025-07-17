/**
 * =================================================================
 * HTML EXPORTER - EXPORTACIÓ DE CALENDARIS A HTML
 * =================================================================
 * 
 * @file        html-exporter.js
 * @description Exportador de calendaris a format HTML autònom i imprimible
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

// Classe per exportar calendaris a format HTML
class HtmlExporter {
    constructor() {
        this.exportType = 'html';
    }
    
    // === EXPORTACIÓ PRINCIPAL ===
    exportCalendar(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) {
            showMessage('Calendari no trobat', 'error');
            return;
        }
        
        const htmlContent = this.generateHTMLVisualCalendar(calendar);
        this.downloadHtmlFile(htmlContent, `${calendar.name}_Calendari-Modul-IOC.html`);
        showMessage('Calendari HTML exportat correctament', 'success');
    }
    
    // === GENERACIÓ DE HTML COMPLET ===
    generateHTMLVisualCalendar(calendar) {
        const startDate = parseUTCDate(calendar.startDate);
        const endDate = parseUTCDate(calendar.endDate);
        
        // Usar la plantilla i reemplaçar placeholders
        return calendarHtmlTemplate
            .replace('{{CALENDAR_NAME}}', calendar.name)
            .replace('{{CALENDAR_NAME}}', calendar.name) // Apareix dues vegades
            .replace('{{PERIOD_TEXT}}', `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`)
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
                .map(e => e.categoryId)
                .filter(id => !systemCategories.some(cat => cat.id === id))
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
        const currentDate = createUTCDate(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1);
        const lastMonth = createUTCDate(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1);
        
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