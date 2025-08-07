/**
 * =================================================================
 * VIEW MANAGER - GESTIÓ CENTRALITZADA DE VISTES DEL CALENDARI
 * =================================================================
 * 
 * @file        ViewManager.js
 * @description Gestió de vistes del calendari amb persistència de navegació i 
 *              neteja automàtica de listeners específics per vista
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
 * CARACTERÍSTIQUES PRINCIPALS:
 * - Gestió de múltiples vistes: global, mensual, setmanal, diària, semestral
 * - Coordinació amb AppStateManager per persistència de navegació (lastVisitedMonths)
 * - Sistema de neteja automàtica de scroll listeners per evitar interferències
 * - Renderització dinàmica segons la vista activa
 * - Navegació intel·ligent dins dels rangs de cada calendari
 * 
 * =================================================================
 */

class ViewManager {
    /**
     * Constructor del gestor de vistes
     * Inicialitza el sistema de vistes amb tracking de listeners per neteja automàtica
     */
    constructor() {
        this.currentView = 'month';
        this.availableViews = ['global', 'semester', 'month', 'week', 'day'];
        
        // Registre de renderitzadors
        this.renderers = {
            global: null,  // S'assignarà quan es carreguin els renderitzadors
            month: null,
            day: null,
            week: null,
            semester: null
        };
        
        /**
         * Tracking de scroll listeners específics per vista semestral
         * @type {Function|null} semesterScrollListener
         * @description Manté referència al listener actiu per poder-lo netejar
         *              adequadament quan es canvia de vista, evitant interferències
         */
        this.semesterScrollListener = null;
    }
    
    // === INICIALITZACIÓ ===
    
    // Registrar renderitzadors (cridat després de carregar els scripts)
    initializeRenderers() {
        this.renderers.global = globalRenderer;
        this.renderers.month = monthRenderer;
        this.renderers.day = dayRenderer;
        this.renderers.week = weekRenderer;
        this.renderers.semester = semesterRenderer;
        
        console.log('[ViewManager] Renderitzadors inicialitzats');
    }
    
    // === GESTIÓ DE VISTES ===
    
    /**
     * Canviar la vista activa del calendari
     * @param {string} viewType Tipus de vista: 'global', 'month', 'week', 'day', 'semester'
     * @returns {boolean} True si el canvi s'ha realitzat correctament
     * @description Gestiona el canvi entre vistes amb persistència automàtica del mes visitat
     *              i neteja de listeners específics per evitar interferències
     */
    changeView(viewType) {
        // Persistència de navegació: si estem sortint de vista mensual, guardar la data actual
        if (this.currentView === 'month' && viewType !== 'month') {
            const calendar = appStateManager.getCurrentCalendar();
            if (calendar && appStateManager.currentDate) {
                appStateManager.lastVisitedMonths[calendar.id] = dateHelper.toUTCString(appStateManager.currentDate);
            }
        }
        
        // Neteja automàtica de listeners específics de la vista anterior
        this.removeScrollListeners();
        
        // Actualitzar estat
        this.currentView = viewType;
        
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
        // Parsejar la data i actualitzar data actual
        const targetDate = dateHelper.parseUTC(dateStr);
        
        // Verificar que la data està dins del rang del calendari
        const calendar = appStateManager.getCurrentCalendar();
        
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
        // Parsejar la data i actualitzar data actual
        const targetDate = dateHelper.parseUTC(dateStr);
        
        // Verificar que la data està dins del rang del calendari
        const calendar = appStateManager.getCurrentCalendar();
        
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
            case 'global':
                this.renderGlobalView(calendar);
                break;
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
    
    // Renderitzar vista global
    renderGlobalView(calendar) {
        const gridWrapper = document.getElementById('calendar-grid-wrapper');
        const periodDisplay = document.getElementById('current-period-display');
        
        const globalHTML = this.renderers.global.render(calendar, 'DOM');
        gridWrapper.innerHTML = globalHTML;
        
        // Actualitzar títol del període amb rang complet del calendari
        const startDate = dateHelper.parseUTC(calendar.startDate);
        const endDate = dateHelper.parseUTC(calendar.endDate);
        const periodTitle = `${calendar.name} (${this.renderers.global.formatDateRange(startDate, endDate)})`;
        periodDisplay.textContent = periodTitle;
        
        // Actualitzar navegació (desactivar botons)
        this.updateNavigationButtons();
    }
    
    // Renderitzar vista mensual
    renderMonthView(calendar) {
        const gridWrapper = document.getElementById('calendar-grid-wrapper');
        const periodDisplay = document.getElementById('current-period-display');
        
        calendarManager.updateNavigationControls(calendar);
        
        // Utilitzar currentDate - AppStateManager gestiona l'últim mes visitat
        const dateToRender = appStateManager.currentDate;
        
        const monthHTML = this.renderers.month.render(calendar, dateToRender, 'DOM');
        periodDisplay.textContent = dateHelper.getMonthName(dateToRender);
        gridWrapper.innerHTML = monthHTML;
        
        // Mantenir currentDate actualitzat per compatibilitat amb altres components
        appStateManager.currentDate = dateToRender;
        
        dragDropHelper.setupDragAndDrop(gridWrapper, calendar);
    }
    
    // Renderitzar vista diària
    renderDayView(calendar) {
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
            case 'global':
                newDate = this.navigateGlobal(direction, calendarStart, calendarEnd);
                break;
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
            storageManager.saveToStorage(); // Persistir canvis de navegació
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
    
    // Navegació específica per vista global
    navigateGlobal(direction, calendarStart, calendarEnd) {
        // Per a vista global, la navegació està desactivada
        // ja que es mostra tot el calendari acadèmic
        console.log('[ViewManager] Navegació global: vista completa del calendari');
        return null; // No navegar en vista global
    }
    
    // Navegació específica per semestres
    navigateSemester(direction, calendarStart, calendarEnd) {
        // Per a vista semestral, la navegació està limitada al semestre actual
        // ja que cada calendari representa exactament un semestre
        console.log('[ViewManager] Navegació semestral: un calendari = un semestre');
        return null; // No navegar fora del semestre actual
    }
    
    /**
     * Navegació específica per mesos amb persistència automàtica
     * @param {number} direction Direcció de navegació: 1 (següent) o -1 (anterior)
     * @param {Date} calendarStart Data d'inici del calendari
     * @param {Date} calendarEnd Data de fi del calendari
     * @returns {Date|null} Nova data si la navegació és vàlida, null altrament
     * @description Navega entre mesos validant que estiguin dins del rang del calendari
     *              i actualitza automàticament el sistema lastVisitedMonths
     */
    navigateMonth(direction, calendarStart, calendarEnd) {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return null;
        
        let newDate = dateHelper.createUTC(
            appStateManager.currentDate.getUTCFullYear(), 
            appStateManager.currentDate.getUTCMonth() + direction, 
            1
        );
        
        const newDateEnd = dateHelper.createUTC(newDate.getUTCFullYear(), newDate.getUTCMonth() + 1, 0);
        
        if (newDate <= calendarEnd && newDateEnd >= calendarStart) {
            // Si és el primer mes del calendari, usar data d'inici real
            const isFirstMonth = newDate.getUTCFullYear() === calendarStart.getUTCFullYear() && 
                                newDate.getUTCMonth() === calendarStart.getUTCMonth();
            
            if (isFirstMonth) {
                newDate = calendarStart;
            }
            
            // Persistència automàtica: guardar el nou mes com a últim visitat
            appStateManager.lastVisitedMonths[calendar.id] = dateHelper.toUTCString(newDate);
            return newDate;
        }
        
        return null;
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
            case 'global':
                this.updateGlobalNavigationButtons(prevBtn, nextBtn, calendarStart, calendarEnd);
                break;
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
    
    // Actualitzar navegació per vista global
    updateGlobalNavigationButtons(prevBtn, nextBtn, calendarStart, calendarEnd) {
        // Per a vista global, desactivar navegació ja que es veu tot el calendari
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        prevBtn.title = 'Vista global: es mostra tot el calendari acadèmic';
        nextBtn.title = 'Vista global: es mostra tot el calendari acadèmic';
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
            const eventId = eventEl.dataset.eventId;
            const eventData = appStateManager.findEventById(eventId);
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
                try {
                    eventManager.isValidEventMove(appStateManager.draggedEvent, dateStr, calendar);
                    isValid = true;
                } catch (error) {
                    isValid = false;
                }
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
                    const eventDataStr = e.dataTransfer.getData('text/plain');
                    const eventData = JSON.parse(eventDataStr);
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
    
    /**
     * Configurar scroll listener per vista semestral
     * @param {HTMLElement} gridWrapper Element contenidor del calendari
     * @param {HTMLElement} periodDisplay Element que mostra el títol del període
     * @param {Object} calendar Objecte calendari actual
     * @param {string} semesterName Nom del semestre per mostrar
     * @description Configura un listener de scroll que actualitza dinàmicament el títol
     *              del període mostrant el mes més visible. Inclou neteja automàtica
     *              de listeners anteriors per evitar múltiples listeners actius
     */
    setupSemesterScrollListener(gridWrapper, periodDisplay, calendar, semesterName) {
        // Neteja de listeners anteriors per evitar conflictes
        this.removeScrollListeners();
        
        // Crear nou listener amb funcionalitat de detecció de mes visible
        this.semesterScrollListener = () => {
            const currentMonth = this.getCurrentVisibleMonth(gridWrapper, calendar);
            if (currentMonth) {
                periodDisplay.textContent = `${semesterName} - ${currentMonth}`;
            } else {
                periodDisplay.textContent = semesterName;
            }
        };
        
        // Registrar listener al contenidor
        gridWrapper.addEventListener('scroll', this.semesterScrollListener);
        
        // Execució inicial per establir el mes visible
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
    
    /**
     * Netejar scroll listeners actius
     * @description Elimina tots els scroll listeners registrats per evitar interferències
     *              entre vistes. És cridat automàticament en canvis de vista i abans
     *              de configurar nous listeners en vista semestral
     */
    removeScrollListeners() {
        if (this.semesterScrollListener) {
            const gridWrapper = document.getElementById('calendar-grid-wrapper');
            if (gridWrapper) {
                gridWrapper.removeEventListener('scroll', this.semesterScrollListener);
            }
            this.semesterScrollListener = null;
        }
    }
    
    // Obtenir informació sobre l'estat actual
    getViewInfo() {
        return {
            currentView: this.currentView,
            availableViews: this.availableViews,
            hasRenderer: this.renderers[this.currentView] !== null
        };
    }
    
    // === NAVEGACIÓ DES DE VISTA GLOBAL ===
    
    // Gestionar click en nom de mes des de vista global
    handleGlobalMonthClick(dateStr) {
        if (!dateStr) return;
        
        const monthDate = dateHelper.parseUTC(dateStr);
        if (!monthDate) return;
        
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        const calendarStart = dateHelper.parseUTC(calendar.startDate);
        
        // Si és el primer mes del calendari, usar data d'inici real
        const isFirstMonth = monthDate.getUTCFullYear() === calendarStart.getUTCFullYear() && 
                            monthDate.getUTCMonth() === calendarStart.getUTCMonth();
        
        appStateManager.currentDate = isFirstMonth ? calendarStart : monthDate;
        
        // Actualitzar lastVisitedMonths per consistència
        appStateManager.lastVisitedMonths[calendar.id] = dateHelper.toUTCString(appStateManager.currentDate);
        
        // Persistir canvis al storage
        storageManager.saveToStorage();
        
        this.changeView('month');
    }
}

// === INSTÀNCIA GLOBAL ===

// Gestor de vistes
const viewManager = new ViewManager();