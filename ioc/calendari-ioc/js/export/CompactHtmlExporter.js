/**
 * =================================================================
 * COMPACT HTML EXPORTER - EXPORTACIÓ VISTA COMPACTA A HTML
 * =================================================================
 *
 * @file        CompactHtmlExporter.js
 * @description Exportador de la vista compacta a fitxer HTML autònom i imprimible
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-09-04
 * @project     Calendari IOC
 * @license     MIT
 *
 * =================================================================
 */

class CompactHtmlExporter {
    constructor() {
        this.exportType = 'compact-html';
    }

    // === EXPORTACIÓ PRINCIPAL ===
    exportCalendar(calendarId) {
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) {
            throw new CalendariIOCException('1101', 'CompactHtmlExporter.exportCalendar');
        }

        const htmlContent = this.generateHTMLCompactCalendar(calendar);
        const safeId = (calendar.id || calendar.name || 'calendari').replace(/[^a-z0-9]/gi, '_');
        this.downloadHtmlFile(htmlContent, `${safeId}_Calendari-IOC_Compacta.html`);
        uiHelper.showMessage('Vista compacta HTML exportada correctament', 'success');
    }

    // === GENERACIÓ DE HTML COMPLET ===
    generateHTMLCompactCalendar(calendar) {
        const startDate = dateHelper.parseUTC(calendar.startDate);
        const endDate = dateHelper.parseUTC(calendar.endDate);
        const current = appStateManager.currentDate || startDate;

        // Generar markup compacte amb el renderer ja existent en mode HTML
        const compactHTML = compactRenderer.render(calendar, current, 'HTML');
        const legendInline = this.generateCategoriesLegend(calendar);

        return compactCalendarHtmlTemplate
            .replace('{{CALENDAR_NAME}}', `${calendar.name} · Vista Compacta`)
            .replace('{{CALENDAR_NAME}}', `${calendar.name} · Vista Compacta`)
            .replace('{{PERIOD_TEXT}}', `${dateHelper.formatForDisplay(startDate)} - ${dateHelper.formatForDisplay(endDate)}`)
            .replace('{{COMPACT_CSS}}', compactCalendarCssStyles)
            .replace('{{LEGEND_INLINE}}', legendInline)
            .replace('{{CONTENT_HTML}}', compactHTML)
            .replace('{{GENERATION_DATE}}', new Date().toLocaleDateString('ca-ES'));
    }

    // === GENERACIÓ DE LLEGENDA DE CATEGORIES (duplicada per independència) ===
    generateCategoriesLegend(calendar) {
        const systemCategories = calendar.categories.filter(cat => cat.isSystem);

        const usedUserCategoryIds = new Set(
            calendar.events
                .map(e => e.getCategory()?.id)
                .filter(id => id && !systemCategories.some(cat => cat.id === id))
        );

        const userCategories = (appStateManager.categoryTemplates || []).filter(template =>
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

    // === DESCÀRREGA ===
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

// Instància global
const compactHtmlExporter = new CompactHtmlExporter();
