/**
 * =================================================================
 * VIEW MANAGER - GESTIÓ CENTRALITZADA DE VISTES DEL CALENDARI
 * =================================================================
 * 
 * @file        ViewManager.js
 * @description Gestió de vistes del calendari (mensual, setmanal, diària, semestral)
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

class ViewManager {
    constructor() {
        this.currentView = 'month';
        this.availableViews = ['month', 'day', 'week', 'semester'];
        
        // Registre de renderitzadors
        this.renderers = {
            month: null,  // S'assignarà quan es carreguin els renderitzadors
            day: null,
            week: null,
            semester: null
        };
    }
    
    // === INICIALITZACIÓ ===
    
    // Registrar renderitzadors (cridat després de carregar els scripts)
    initializeRenderers() {
        this.renderers.month = monthRenderer;
        this.renderers.day = dayRenderer;
        this.renderers.week = weekRenderer;
        this.renderers.semester = semesterRenderer;
        
        console.log('[ViewManager] Renderitzadors inicialitzats');
    }
    
    // === GESTIÓ DE VISTES ===
    
    // Canviar vista
    changeView(viewType) {
        if (!viewType || !this.availableViews.includes(viewType)) {
            console.warn(`[ViewManager] Vista no vàlida: ${viewType}`);
            return false;
        }
        
        // Actualitzar estat
        this.currentView = viewType;
        appStateManager.currentView = viewType;
        
        // Actualitzar atribut del body per CSS
        document.body.setAttribute('data-current-view', viewType);
        
        // Actualitzar botons actius
        this.updateViewButtons(viewType);
        
        // Re-renderitzar amb la nova vista
        this.renderCurrentView();
        
        console.log(`[ViewManager] Canviat a vista: ${viewType}`);
        return true;
    }
    
    // Obtenir vista actual
    getCurrentView() {
        return this.currentView;
    }
    
    // Verificar si una vista està disponible
    isViewAvailable(viewType) {
        return this.renderers[viewType] !== null;
    }
    
    // Canviar a vista dia d'una data específica
    changeToDateView(dateStr) {
        if (!dateStr) {
            console.warn('[ViewManager] Data no vàlida per canviar a vista dia');
            return false;
        }
        
        // Parsejar la data i actualitzar data actual
        const targetDate = dateHelper.parseUTC(dateStr);
        if (!targetDate) {
            console.warn('[ViewManager] No es pot parsejar la data:', dateStr);
            return false;
        }
        
        // Verificar que la data està dins del rang del calendari
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) {
            console.warn('[ViewManager] No hi ha calendari actiu');
            return false;
        }
        
        if (!dateValidationService.validateDateWithMessage(dateStr, calendar, 'Vista dia')) {
            return false;
        }
        
        // Actualitzar data actual
        appStateManager.currentDate = targetDate;
        
        // Canviar a vista dia
        this.changeView('day');
        
        console.log(`[ViewManager] Canviat a vista dia de: ${dateStr}`);
        return true;
    }
    
    // Canviar a vista setmanal d'una data específica
    changeToWeekView(dateStr) {
        if (!dateStr) {
            console.warn('[ViewManager] Data no vàlida per canviar a vista setmanal');
            return false;
        }
        
        // Parsejar la data i actualitzar data actual
        const targetDate = dateHelper.parseUTC(dateStr);
        if (!targetDate) {
            console.warn('[ViewManager] No es pot parsejar la data:', dateStr);
            return false;
        }
        
        // Verificar que la data està dins del rang del calendari
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) {
            console.warn('[ViewManager] No hi ha calendari actiu');
            return false;
        }
        
        if (!dateValidationService.validateDateWithMessage(dateStr, calendar, 'Vista setmanal')) {
            return false;
        }
        
        // Actualitzar data actual
        appStateManager.currentDate = targetDate;
        
        // Canviar a vista setmanal
        this.changeView('week');
        
        console.log(`[ViewManager] Canviat a vista setmanal de: ${dateStr}`);
        return true;
    }
    
    // === RENDERITZACIÓ ===
    
    // Renderitzar vista actual
    renderCurrentView() {
        const calendar = appStateManager.getCurrentCalendar();
        const gridWrapper = document.getElementById('calendar-grid-wrapper');
        const periodDisplay = document.getElementById('current-period-display');
        
        if (!calendar) {
            gridWrapper.innerHTML = `<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: var(--secondary-text-color);">Selecciona un calendari per començar.</div>`;
            periodDisplay.textContent = '...';
            return;
        }
        
        // Renderitzar segons la vista actual
        switch (this.currentView) {
            case 'day':
                this.renderDayView(calendar);
                break;
            case 'week':
                this.renderWeekView(calendar);
                break;
            case 'semester':
                this.renderSemesterView(calendar);
                break;
            case 'month':
            default:
                this.renderMonthView(calendar);
                break;
        }
    }
    
    // === RENDERITZADORS ESPECÍFICS ===
    
    // Renderitzar vista mensual
    renderMonthView(calendar) {
        const gridWrapper = document.getElementById('calendar-grid-wrapper');
        const periodDisplay = document.getElementById('current-period-display');
        
        calendarManager.updateNavigationControls(calendar);
        
        const monthHTML = this.renderers.month.render(calendar, appStateManager.currentDate, 'DOM');
        periodDisplay.textContent = dateHelper.getMonthName(appStateManager.currentDate);
        gridWrapper.innerHTML = monthHTML;
        
        dragDropHelper.setupDragAndDrop(gridWrapper, calendar);
    }
    
    // Renderitzar vista diària
    renderDayView(calendar) {
        if (!this.renderers.day) {
            console.error('[ViewManager] Renderitzador de vista diària no disponible');
            this.renderMonthView(calendar); // Fallback
            return;
        }
        
        const gridWrapper = document.getElementById('calendar-grid-wrapper');
        const periodDisplay = document.getElementById('current-period-display');
        
        const dayHTML = this.renderers.day.render(calendar, appStateManager.currentDate, 'DOM');
        gridWrapper.innerHTML = dayHTML;
        
        // Actualitzar títol del període
        const dayName = dateHelper.getDayHeaders()[appStateManager.currentDate.getUTCDay() === 0 ? 6 : appStateManager.currentDate.getUTCDay() - 1];
        periodDisplay.textContent = `${dayName}, ${appStateManager.currentDate.getUTCDate()} ${dateHelper.getMonthName(appStateManager.currentDate)}`;
        
        // Configurar drag & drop específic per vista diària
        this.setupDayViewDragDrop();
        
        // Actualitzar navegació
        this.updateNavigationButtons();
    }
    
    // Renderitzar vista setmanal
    renderWeekView(calendar) {
        if (!this.renderers.week) {
            console.error('[ViewManager] Renderitzador de vista setmanal no disponible');
            this.renderMonthView(calendar); // Fallback
            return;
        }
        
        const gridWrapper = document.getElementById('calendar-grid-wrapper');
        const periodDisplay = document.getElementById('current-period-display');
        
        const weekHTML = this.renderers.week.render(calendar, appStateManager.currentDate, 'DOM');
        gridWrapper.innerHTML = weekHTML;
        
        // Actualitzar títol del període
        const weekStart = this.renderers.week.getWeekStart(appStateManager.currentDate);
        const weekEnd = this.renderers.week.getWeekEnd(weekStart);
        const weekTitle = this.renderers.week.generateWeekTitle({ weekStart, weekEnd });
        periodDisplay.textContent = weekTitle;
        
        // Configurar drag & drop (reutilitza la lògica de la vista mensual)
        dragDropHelper.setupDragAndDrop(gridWrapper, calendar);
        
        // Actualitzar navegació
        this.updateNavigationButtons();
    }
    
    // Renderitzar vista semestral
    renderSemesterView(calendar) {
        if (!this.renderers.semester) {
            console.error('[ViewManager] Renderitzador de vista semestral no disponible');
            this.renderMonthView(calendar); // Fallback
            return;
        }
        
        const gridWrapper = document.getElementById('calendar-grid-wrapper');
        const periodDisplay = document.getElementById('current-period-display');
        
        const semesterHTML = this.renderers.semester.render(calendar, appStateManager.currentDate, 'DOM');
        gridWrapper.innerHTML = semesterHTML;
        
        // Actualitzar títol del període inicial
        const semesterName = this.renderers.semester.generateSemesterName(calendar);
        periodDisplay.textContent = semesterName;
        
        // Configurar scroll listener per actualitzar mes visible
        this.setupSemesterScrollListener(gridWrapper, periodDisplay, calendar, semesterName);
        
        // Configurar drag & drop (reutilitza la lògica de la vista mensual)
        dragDropHelper.setupDragAndDrop(gridWrapper, calendar);
        
        // Actualitzar navegació
        this.updateNavigationButtons();
    }
    
    // === NAVEGACIÓ ===
    
    // Navegar entre períodes segons la vista actual
    navigatePeriod(direction) {
        if (!appStateManager.currentCalendarId) return false;
        
        const calendar = appStateManager.getCurrentCalendar();
        const calendarStart = dateHelper.parseUTC(calendar.startDate);
        const calendarEnd = dateHelper.parseUTC(calendar.endDate);
        
        let newDate;
        
        // Navegació segons la vista actual
        switch (this.currentView) {
            case 'day':
                newDate = this.navigateDay(direction, calendarStart, calendarEnd);
                break;
            case 'week':
                newDate = this.navigateWeek(direction, calendarStart, calendarEnd);
                break;
            case 'semester':
                newDate = this.navigateSemester(direction, calendarStart, calendarEnd);
                break;
            case 'month':
            default:
                newDate = this.navigateMonth(direction, calendarStart, calendarEnd);
                break;
        }
        
        if (newDate) {
            appStateManager.currentDate = newDate;
            this.renderCurrentView();
            return true;
        }
        
        return false;
    }
    
    // Navegació específica per dies
    navigateDay(direction, calendarStart, calendarEnd) {
        const newDate = dateHelper.createUTC(
            appStateManager.currentDate.getUTCFullYear(), 
            appStateManager.currentDate.getUTCMonth(), 
            appStateManager.currentDate.getUTCDate() + direction
        );
        
        return (newDate >= calendarStart && newDate <= calendarEnd) ? newDate : null;
    }
    
    // Navegació específica per setmanes
    navigateWeek(direction, calendarStart, calendarEnd) {
        if (!this.renderers.week) {
            console.warn('[ViewManager] Renderitzador setmanal no disponible');
            return null;
        }
        
        // Obtenir inici de la setmana actual
        const currentWeekStart = this.renderers.week.getWeekStart(appStateManager.currentDate);
        
        // Calcular nova setmana (direction = 1 per següent, -1 per anterior)
        const newWeekStart = dateHelper.createUTC(
            currentWeekStart.getUTCFullYear(),
            currentWeekStart.getUTCMonth(),
            currentWeekStart.getUTCDate() + (direction * 7)
        );
        
        const newWeekEnd = this.renderers.week.getWeekEnd(newWeekStart);
        
        // Verificar que la nova setmana tingui algun dia dins del rang del calendari
        if (newWeekStart <= calendarEnd && newWeekEnd >= calendarStart) {
            // Retornar el dilluns de la nova setmana
            return newWeekStart;
        }
        
        return null;
    }
    
    // Navegació específica per semestres
    navigateSemester(direction, calendarStart, calendarEnd) {
        // Per a vista semestral, la navegació està limitada al semestre actual
        // ja que cada calendari representa exactament un semestre
        console.log('[ViewManager] Navegació semestral: un calendari = un semestre');
        return null; // No navegar fora del semestre actual
    }
    
    // Navegació específica per mesos
    navigateMonth(direction, calendarStart, calendarEnd) {
        const newDate = dateHelper.createUTC(
            appStateManager.currentDate.getUTCFullYear(), 
            appStateManager.currentDate.getUTCMonth() + direction, 
            1
        );
        
        const newDateEnd = dateHelper.createUTC(newDate.getUTCFullYear(), newDate.getUTCMonth() + 1, 0);
        
        return (newDate <= calendarEnd && newDateEnd >= calendarStart) ? newDate : null;
    }
    
    // === ACTUALITZACIÓ DE UI ===
    
    // Actualitzar botons de vista
    updateViewButtons(activeView) {
        document.querySelectorAll('.view-toggles button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeButton = document.querySelector(`[data-view="${activeView}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
    
    // Actualitzar botons de navegació
    updateNavigationButtons() {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        const prevBtn = document.querySelector('[data-direction="-1"]');
        const nextBtn = document.querySelector('[data-direction="1"]');
        
        if (!prevBtn || !nextBtn) return;
        
        const calendarStart = dateHelper.parseUTC(calendar.startDate);
        const calendarEnd = dateHelper.parseUTC(calendar.endDate);
        
        // Lògica específica per vista
        switch (this.currentView) {
            case 'day':
                this.updateDayNavigationButtons(prevBtn, nextBtn, calendarStart, calendarEnd);
                break;
            case 'week':
                this.updateWeekNavigationButtons(prevBtn, nextBtn, calendarStart, calendarEnd);
                break;
            case 'semester':
                this.updateSemesterNavigationButtons(prevBtn, nextBtn, calendarStart, calendarEnd);
                break;
            case 'month':
            default:
                calendarManager.updateNavigationControls(calendar);
                break;
        }
    }
    
    // Actualitzar navegació per vista diària
    updateDayNavigationButtons(prevBtn, nextBtn, calendarStart, calendarEnd) {
        // Dia anterior
        const prevDay = dateHelper.createUTC(
            appStateManager.currentDate.getUTCFullYear(), 
            appStateManager.currentDate.getUTCMonth(), 
            appStateManager.currentDate.getUTCDate() - 1
        );
        prevBtn.disabled = prevDay < calendarStart;
        
        // Dia següent
        const nextDay = dateHelper.createUTC(
            appStateManager.currentDate.getUTCFullYear(), 
            appStateManager.currentDate.getUTCMonth(), 
            appStateManager.currentDate.getUTCDate() + 1
        );
        nextBtn.disabled = nextDay > calendarEnd;
    }
    
    // Actualitzar navegació per vista setmanal
    updateWeekNavigationButtons(prevBtn, nextBtn, calendarStart, calendarEnd) {
        if (!this.renderers.week) return;
        
        const currentWeekStart = this.renderers.week.getWeekStart(appStateManager.currentDate);
        
        // Setmana anterior
        const prevWeekStart = dateHelper.createUTC(
            currentWeekStart.getUTCFullYear(),
            currentWeekStart.getUTCMonth(),
            currentWeekStart.getUTCDate() - 7
        );
        const prevWeekEnd = this.renderers.week.getWeekEnd(prevWeekStart);
        prevBtn.disabled = prevWeekEnd < calendarStart;
        
        // Setmana següent
        const nextWeekStart = dateHelper.createUTC(
            currentWeekStart.getUTCFullYear(),
            currentWeekStart.getUTCMonth(),
            currentWeekStart.getUTCDate() + 7
        );
        nextBtn.disabled = nextWeekStart > calendarEnd;
    }
    
    // Actualitzar navegació per vista semestral
    updateSemesterNavigationButtons(prevBtn, nextBtn, calendarStart, calendarEnd) {
        // Per a vista semestral, desactivar navegació ja que un calendari = un semestre
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        prevBtn.title = 'Canvia de calendari per veure altres semestres';
        nextBtn.title = 'Canvia de calendari per veure altres semestres';
    }
    
    // === DRAG & DROP ===
    
    // Configurar drag & drop específic per vista diària
    setupDayViewDragDrop() {
        const dayContainer = document.querySelector('.day-view-container');
        if (!dayContainer) return;
        
        // Fer esdeveniments de la llista draggables
        dayContainer.querySelectorAll('.event-list-item.is-user-event[draggable="true"]').forEach(eventEl => {
            const eventData = JSON.parse((eventEl.dataset.event || '{}').replace(/&quot;/g, '"'));
            const dateStr = dateHelper.toUTCString(appStateManager.currentDate);
            
            if (eventData.id && dateStr) {
                eventManager.makeEventDraggable(eventEl, eventData, dateStr);
            }
        });
        
        // Fer la vista de dia un drop target
        this.setupDayDropTarget(dayContainer);
    }
    
    // Configurar drop target per vista diària
    setupDayDropTarget(dayContainer) {
        dayContainer.addEventListener('dragover', (e) => {
            if (!appStateManager.draggedEvent) return;
            
            const calendar = appStateManager.getCurrentCalendar();
            if (!calendar) return;
            
            const dateStr = dateHelper.toUTCString(appStateManager.currentDate);
            let isValid = false;
            
            if (appStateManager.draggedFromDate === 'unplaced') {
                isValid = dateValidationService.isValidEventDate(dateStr, calendar);
            } else {
                isValid = eventManager.isValidEventMove(appStateManager.draggedEvent, dateStr, calendar);
            }
            
            if (isValid) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                dayContainer.classList.add('drop-target');
            } else {
                dayContainer.classList.add('drop-invalid');
            }
        });
        
        dayContainer.addEventListener('dragleave', (e) => {
            if (!dayContainer.contains(e.relatedTarget)) {
                dayContainer.classList.remove('drop-target', 'drop-invalid');
            }
        });
        
        dayContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            dayContainer.classList.remove('drop-target', 'drop-invalid');
            
            const dateStr = dateHelper.toUTCString(appStateManager.currentDate);
            
            if (appStateManager.draggedEvent) {
                if (appStateManager.draggedFromDate === 'unplaced') {
                    const eventData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (eventData.isUnplacedEvent) {
                        replicaManager.placeUnplacedEvent(eventData.unplacedIndex, dateStr);
                    }
                } else if (appStateManager.draggedFromDate !== dateStr) {
                    eventManager.moveEvent(appStateManager.draggedEvent.id, dateStr);
                }
            }
            
            appStateManager.cleanupDragState();
        });
    }
    
    
    // === SCROLL TRACKING PER VISTA SEMESTRAL ===
    
    // Configurar scroll listener per vista semestral
    setupSemesterScrollListener(gridWrapper, periodDisplay, calendar, semesterName) {
        // Netejar listeners anteriors si existeixen
        if (this.semesterScrollListener) {
            gridWrapper.removeEventListener('scroll', this.semesterScrollListener);
        }
        
        // Crear nou listener
        this.semesterScrollListener = () => {
            const currentMonth = this.getCurrentVisibleMonth(gridWrapper, calendar);
            if (currentMonth) {
                periodDisplay.textContent = `${semesterName} - ${currentMonth}`;
            } else {
                periodDisplay.textContent = semesterName;
            }
        };
        
        // Afegir listener al scroll
        gridWrapper.addEventListener('scroll', this.semesterScrollListener);
        
        // Cridar immediatament per establir el mes inicial
        setTimeout(() => this.semesterScrollListener(), 100);
    }
    
    // Calcular quin mes és més visible actualment
    getCurrentVisibleMonth(gridWrapper, calendar) {
        const containerRect = gridWrapper.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;
        
        // Obtenir dates del calendari per validació
        const calendarStart = dateHelper.parseUTC(calendar.startDate);
        const calendarEnd = dateHelper.parseUTC(calendar.endDate);
        
        // Obtenir tots els dies i agrupar per mes
        const dayElements = gridWrapper.querySelectorAll('.day-cell[data-date]');
        const monthStats = new Map();
        
        dayElements.forEach(dayEl => {
            const rect = dayEl.getBoundingClientRect();
            const dateStr = dayEl.getAttribute('data-date');
            if (dateStr) {
                const date = dateHelper.parseUTC(dateStr);
                if (date) {
                    // Només processar dies que estan dins del rang del calendari
                    if (date >= calendarStart && date <= calendarEnd) {
                        const monthKey = dateHelper.getMonthName(date);
                        const monthYear = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
                        
                        if (!monthStats.has(monthKey)) {
                            monthStats.set(monthKey, {
                                name: monthKey,
                                totalDays: 0,
                                visibleDays: 0,
                                firstDate: date,
                                monthYear: monthYear
                            });
                        }
                        
                        const stats = monthStats.get(monthKey);
                        stats.totalDays++;
                        
                        // Comprovar si el dia està visible (almenys parcialment)
                        if (rect.bottom > containerTop && rect.top < containerBottom) {
                            stats.visibleDays++;
                        }
                        
                        // Mantenir la data més antiga per ordenació cronològica
                        if (date < stats.firstDate) {
                            stats.firstDate = date;
                        }
                    }
                }
            }
        });
        
        // Convertir a array per poder ordenar
        const monthsArray = Array.from(monthStats.values());
        
        // Prioritzar segons els criteris:
        // 1. Mes del qual es veuen tots els dies
        // 2. Mes amb més dies visibles
        // 3. En cas d'igualtat, el primer cronològicament
        const fullyVisibleMonths = monthsArray.filter(m => m.visibleDays === m.totalDays && m.visibleDays > 0);
        
        if (fullyVisibleMonths.length > 0) {
            // Ordenar per data i retornar el primer
            fullyVisibleMonths.sort((a, b) => a.firstDate - b.firstDate);
            return fullyVisibleMonths[0].name;
        }
        
        // Si cap mes es veu complet, agafar el que té més dies visibles
        const partiallyVisibleMonths = monthsArray.filter(m => m.visibleDays > 0);
        if (partiallyVisibleMonths.length > 0) {
            // Ordenar per dies visibles (desc) i després per data (asc)
            partiallyVisibleMonths.sort((a, b) => {
                if (b.visibleDays !== a.visibleDays) {
                    return b.visibleDays - a.visibleDays; // Més dies visibles primer
                }
                return a.firstDate - b.firstDate; // En cas d'igualtat, més antic primer
            });
            return partiallyVisibleMonths[0].name;
        }
        
        return null;
    }
    
    // === UTILITATS ===
    
    // Obtenir informació sobre l'estat actual
    getViewInfo() {
        return {
            currentView: this.currentView,
            availableViews: this.availableViews,
            hasRenderer: this.renderers[this.currentView] !== null
        };
    }
}

// === INSTÀNCIA GLOBAL ===

// Gestor de vistes
const viewManager = new ViewManager();