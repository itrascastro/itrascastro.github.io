/*
  Quadern de Notes - Navegació UI
  Gestió de navegació entre vistes i navegació d'arbre
*/

;(function() {
  'use strict';

  const Navigation = {
    app: null,

    init(app) {
      this.app = app;
      console.log('🧭 Navigation: Inicialitzant navegació...');
      console.log('✅ Navigation: Navegació inicialitzada');
    },

    switchView(viewName) {
      console.log('🧭 Navigation: Canviant a vista:', viewName);
      
      // Actualitzar botons de navegació
      const viewBtns = document.querySelectorAll('.view-btn');
      viewBtns.forEach(btn => {
        const isActive = btn.dataset.view === viewName;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive.toString());
      });

      // Actualitzar contingut de vistes - usar IDs correctes
      const views = document.querySelectorAll('.view');
      views.forEach(view => {
        const isCurrentView = view.id === `${viewName}-view`;
        view.classList.toggle('active', isCurrentView);
        if (isCurrentView) {
          view.style.display = 'block';
        } else {
          view.style.display = 'none';
        }
      });

      // Actualitzar estat de l'app
      this.app.currentView = viewName;

      // Inicialitzar vista específica si és necessari
      this._initializeView(viewName);

      // Cridar onViewActivated si la vista ho suporta
      this._notifyViewActivated(viewName);

      // Actualitzar URL hash
      if (history.pushState) {
        history.pushState(null, null, `#${viewName}`);
      } else {
        window.location.hash = viewName;
      }
    },

    _initializeView(viewName) {
      switch(viewName) {
        case 'dashboard':
          if (this.app.modules.dashboard) {
            this.app.modules.dashboard.loadData();
          }
          break;
        case 'editor':
          if (this.app.modules.editor) {
            this.app.modules.editor.refreshData();
          }
          break;
      }
    },

    _notifyViewActivated(viewName) {
      // Notificar a la vista que s'ha activat
      const moduleMap = {
        'dashboard': 'dashboard',
        'editor': 'editor', 
        'search': 'search',
        'study': 'study',
        'import-export': 'importExport'
      };
      
      const moduleName = moduleMap[viewName];
      if (moduleName && this.app.modules[moduleName] && 
          typeof this.app.modules[moduleName].onViewActivated === 'function') {
        console.log(`🧭 Navigation: Notificant activació vista ${viewName}`);
        this.app.modules[moduleName].onViewActivated();
      }
    },

    initializeNavTree() {
      console.log('🧭 Navigation: Inicialitzant arbre de navegació');
      
      const navTree = document.getElementById('nav-tree');
      if (!navTree) {
        console.warn('🟨 Navigation: Element #nav-tree no trobat');
        return;
      }
      
      // Afegir event listeners per navegació jeràrquica
      this._bindTreeNavigation(navTree);
      
      // Si hi ha estructura ja carregada, activar events
      setTimeout(() => {
        this._activateTreeEvents();
      }, 500);
    },

    _bindTreeNavigation(container) {
      // Event delegation per tots els clicks dins l'arbre de navegació
      container.addEventListener('click', (e) => {
        const target = e.target.closest('[role="button"], .nav-unit-header, .nav-block-header');
        
        if (target) {
          // Determinar tipus d'element i actuar en conseqüència
          if (target.classList.contains('nav-unit-header') || target.classList.contains('nav-block-header')) {
            this.toggleTreeItem(target);
          } else if (target.classList.contains('nav-section-content')) {
            // Click en secció - no fer res aquí, es gestiona a app.js
            return;
          }
        }
      });
      
      console.log('🧭 Navigation: Event listeners vinculats a l\'arbre');
    },

    _activateTreeEvents() {
      // Activar events per elements dinàmics carregats posteriorment
      const dynamicElements = document.querySelectorAll('.nav-unit-header, .nav-block-header');
      
      dynamicElements.forEach(element => {
        if (!element.dataset.eventsAttached) {
          element.setAttribute('tabindex', '0');
          element.setAttribute('role', 'button');
          element.dataset.eventsAttached = 'true';
          
          // Suport per teclat
          element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.toggleTreeItem(element);
            }
          });
        }
      });
      
      console.log('🧭 Navigation: Events dinàmics activats');
    },

    toggleTreeItem(header) {
      console.log('🖱️ Navigation: toggleTreeItem cridat amb header:', header);
      
      const item = header.closest('.tree-item, .nav-unit, .nav-block');
      if (!item) {
        console.warn('🟨 Navigation: No s\'ha trobat l\'element contenidor per:', header);
        return;
      }
      
      console.log('🖱️ Navigation: Element trobat:', item, 'Classes actuals:', [...item.classList]);
      
      const isExpanded = item.classList.contains('expanded');
      const shouldExpand = !isExpanded;
      
      console.log(`🖱️ Navigation: ${isExpanded ? 'Col·lapsant' : 'Expandint'} element`);
      
      // FORÇAR expanded state
      if (shouldExpand) {
        item.classList.add('expanded');
      } else {
        item.classList.remove('expanded');
      }
      
      console.log('🖱️ Navigation: Classes després del toggle:', [...item.classList]);
      
      // Debug: Verificar que la classe s'ha aplicat
      console.log(`🐛 Navigation: Element ${shouldExpand ? 'expandit' : 'col·lapsat'}:`, {
        element: item,
        hasExpandedClass: item.classList.contains('expanded'),
        classList: [...item.classList]
      });
      
      // Actualitzar icona toggle
      const arrow = header.querySelector('.tree-arrow, .nav-toggle');
      if (arrow) {
        arrow.style.transform = shouldExpand ? 'rotate(90deg)' : 'rotate(0deg)';
      }
      
      // Actualitzar accessibilitat
      header.setAttribute('aria-expanded', shouldExpand.toString());
      
      // Verificar que el CSS s'aplica correctament i aplicar fallback si cal
      const content = item.querySelector('.nav-unit-content, .nav-block-content');
      if (content) {
        console.log(`🔧 Navigation: Verificant CSS del contingut. shouldExpand: ${shouldExpand}`);
        
        // Primer intentar amb només classes CSS
        content.removeAttribute('style');
        content.offsetHeight; // Força reflow
        
        // Verificar si el CSS s'aplica correctament
        const computedStyle = window.getComputedStyle(content);
        const cssWorking = shouldExpand ? 
          (computedStyle.maxHeight !== '0px' && computedStyle.opacity !== '0') :
          (computedStyle.maxHeight === '0px' && computedStyle.opacity === '0');
        
        console.log(`🔧 Navigation: CSS initial result:`, {
          expanded: item.classList.contains('expanded'),
          shouldExpand: shouldExpand,
          computedMaxHeight: computedStyle.maxHeight,
          computedOpacity: computedStyle.opacity,
          cssWorking: cssWorking
        });
        
        // FALLBACK: Si el CSS no funciona, forçar amb inline styles
        if (!cssWorking) {
          console.log('🚨 Navigation: CSS no funciona, aplicant fallback inline styles');
          if (shouldExpand) {
            content.style.maxHeight = '2000px';
            content.style.opacity = '1';
            content.style.padding = '10px 0 10px 20px';
          } else {
            content.style.maxHeight = '0px';
            content.style.opacity = '0';
            content.style.padding = '0';
          }
        }
        
        // Verificació final
        const finalStyle = window.getComputedStyle(content);
        console.log(`🔧 Navigation: CSS final result:`, {
          computedMaxHeight: finalStyle.maxHeight,
          computedOpacity: finalStyle.opacity,
          display: finalStyle.display
        });
      }
      
      // Si és una unitat que s'expandeix, col·lapsar altres unitats del mateix nivell (opcional)
      if (shouldExpand && item.classList.contains('nav-unit')) {
        const parentContainer = item.parentElement;
        if (parentContainer) {
          const otherUnits = parentContainer.querySelectorAll('.nav-unit.expanded');
          otherUnits.forEach(unit => {
            if (unit !== item) {
              unit.classList.remove('expanded');
              const otherArrow = unit.querySelector('.nav-toggle');
              if (otherArrow) {
                otherArrow.style.transform = 'rotate(0deg)';
              }
              const otherHeader = unit.querySelector('.nav-unit-header');
              if (otherHeader) {
                otherHeader.setAttribute('aria-expanded', 'false');
              }
            }
          });
        }
      }
      
      // Log per debugging
      const itemType = item.classList.contains('nav-unit') ? 'unitat' : 'bloc';
      const itemTitle = header.querySelector('.nav-unit-title, .nav-block-title')?.textContent || 'sense títol';
      console.log(`🧭 Navigation: ${shouldExpand ? 'Expandint' : 'Col·lapsant'} ${itemType}: ${itemTitle}`);
      
      // Actualitzar localStorage
      this._updateExpandedState(item, shouldExpand);
    },

    selectSection(sectionElement) {
      console.log('🧭 Navigation: Seleccionant secció');
      
      if (!sectionElement) return;
      
      // Obtenir informació de la secció
      const sectionId = sectionElement.dataset.sectionId;
      const pageUrl = sectionElement.dataset.pageUrl;
      const unitElement = sectionElement.closest('.nav-unit');
      const blockElement = sectionElement.closest('.nav-block');
      
      if (!sectionId) {
        console.warn('🟨 Navigation: Secció sense ID');
        return;
      }
      
      // Obtenir IDs d'unitat i bloc
      const unitId = unitElement?.dataset.unitId;
      const blockId = blockElement?.dataset.blockId;
      
      // Marcar com seleccionada visualment
      this._highlightSelectedSection(sectionElement);
      
      // Canviar a vista editor
      if (this.app && this.app.switchView) {
        this.app.switchView('editor');
        
        // Notificar a l'editor amb els detalls de la secció
        setTimeout(() => {
          if (this.app.modules.editor && this.app.modules.editor.selectSection) {
            this.app.modules.editor.selectSection({
              sectionId,
              pageUrl,
              unitId,
              blockId
            });
          }
        }, 200);
      }
      
      console.log(`🧭 Navigation: Secció seleccionada - ${sectionId} (U${unitId}/B${blockId})`);
    },

    _highlightSelectedSection(sectionElement) {
      // Treure highlight anterior
      const previousSelected = document.querySelector('.nav-section.selected');
      if (previousSelected) {
        previousSelected.classList.remove('selected');
      }
      
      // Afegir highlight a la nova selecció
      sectionElement.classList.add('selected');
    },

    // Mètode auxiliar per activar events després de canvis dinàmics
    refreshTreeEvents() {
      setTimeout(() => {
        this._activateTreeEvents();
      }, 100);
    },

    _updateExpandedState(item, isExpanded) {
      if (!this.app || !window.Quadern?.Store) return;
      
      try {
        const state = window.Quadern.Store.load();
        
        if (item.classList.contains('nav-unit')) {
          const unitId = parseInt(item.dataset.unitId);
          if (unitId) {
            if (isExpanded) {
              if (!state.ui.explorer.openUnits.includes(unitId)) {
                state.ui.explorer.openUnits.push(unitId);
              }
            } else {
              state.ui.explorer.openUnits = state.ui.explorer.openUnits.filter(id => id !== unitId);
            }
          }
        } else if (item.classList.contains('nav-block')) {
          const blockId = parseInt(item.dataset.blockId);
          const unitElement = item.closest('.nav-unit');
          const unitId = parseInt(unitElement?.dataset.unitId);
          
          if (unitId && blockId) {
            if (!state.ui.explorer.openBlocs[unitId]) {
              state.ui.explorer.openBlocs[unitId] = [];
            }
            
            if (isExpanded) {
              if (!state.ui.explorer.openBlocs[unitId].includes(blockId)) {
                state.ui.explorer.openBlocs[unitId].push(blockId);
              }
            } else {
              state.ui.explorer.openBlocs[unitId] = state.ui.explorer.openBlocs[unitId].filter(id => id !== blockId);
            }
          }
        }
        
        window.Quadern.Store.save(state);
        console.log('💾 Navigation: Estat UI guardat:', state.ui.explorer);
        
      } catch (error) {
        console.error('❌ Navigation: Error guardant estat:', error);
      }
    }
  };

  window.Quadern = window.Quadern || {};
  window.Quadern.Navigation = Navigation;

})();