/*
  Quadern de Notes - Aplicació Principal
  Coordinador central del sistema de notes
*/

;(function() {
  'use strict';

  // Namespace principal del Quadern
  const QuadernApp = {
    // Estat de l'aplicació
    currentView: 'dashboard',
    currentNote: null,
    isEditing: false,
    
    // Cache de dades
    notesCache: null,
    statsCache: null,
    
    // Configuració
    config: {
      autosaveDelay: 2000,
      toastDuration: 3000,
      maxRecentNotes: 5
    },

    // Referències als mòduls
    modules: {
      events: null,
      navigation: null,
      dashboard: null,
      editor: null,
      search: null,
      study: null,
      importExport: null,
      components: null,
      formatters: null
    },

    // =============================
    // INICIALITZACIÓ
    // =============================

    init() {
      try {
        console.log('🟦 Quadern: Inicialitzant aplicació...');
        
        // Comprovar si estem a la pàgina del quadern
        if (!this._isQuadernPage()) {
          console.log('🟨 Quadern: No és pàgina de quadern, sortint...');
          return;
        }

        // Inicialitzar mòduls en ordre de dependència
        this._initializeModules();
        // Escoltar canvis de localStorage des d'altres pestanyes per actualitzar el footer
        this._bindStorageListener();
        
        console.log('✅ Quadern: Aplicació inicialitzada correctament');
      } catch (error) {
        console.error('❌ Quadern: Error en inicialització:', error);
      }
    },

    _isQuadernPage() {
      return document.querySelector('.quadern-layout') !== null ||
             document.querySelector('[data-page="quadern"]') !== null ||
             window.location.pathname.includes('quadern');
    },

    _initializeModules() {
      // 1. Events (base per tot)
      if (window.Quadern?.Events) {
        this.modules.events = window.Quadern.Events;
        this.modules.events.init(this);
      }

      // 2. Navigation (gestió de vistes)
      if (window.Quadern?.Navigation) {
        this.modules.navigation = window.Quadern.Navigation;
        this.modules.navigation.init(this);
      }

      // 3. Components UI
      if (window.Quadern?.Components) {
        this.modules.components = window.Quadern.Components;
        this.modules.components.init(this);
      }

      // 4. Vistes específiques
      this._initializeViews();

      // 5. Discovery - Sistema de descobriment d'estructura
      if (window.Quadern?.Discovery) {
        this.modules.discovery = window.Quadern.Discovery;
        this.modules.discovery.init(this);
      }

      // 6. Utilitats
      if (window.Quadern?.Formatters) {
        this.modules.formatters = window.Quadern.Formatters;
        this.modules.formatters.init(this);
      }

      // Inicialitzar vista per defecte
      this._initializeDefaultView();
    },

    _initializeViews() {
      // Dashboard
      if (window.Quadern?.Dashboard) {
        this.modules.dashboard = window.Quadern.Dashboard;
        this.modules.dashboard.init(this);
      }

      // Editor
      if (window.Quadern?.Editor) {
        this.modules.editor = window.Quadern.Editor;
        this.modules.editor.init(this);
      }

      // Cerca (fusionada en Dashboard amb barra de cerca)

      // Estudi (fusionat en Dashboard amb mode Estudi)

      // Import/Export
      if (window.Quadern?.ImportExport) {
        this.modules.importExport = window.Quadern.ImportExport;
        this.modules.importExport.init(this);
      }
    },

    _initializeDefaultView() {
      // Verificar que els elements HTML existeixen
      console.log('🟦 App: Verificant elements HTML...');
      const dashboardView = document.getElementById('dashboard-view');
      const navTree = document.getElementById('nav-tree');
      
      if (!dashboardView) {
        console.warn('🟨 App: No s\'ha trobat #dashboard-view');
      }
      if (!navTree) {
        console.warn('🟨 App: No s\'ha trobat #nav-tree');
      }
      
      // Carregar dades del dashboard per defecte
      if (this.modules.dashboard && dashboardView) {
        console.log('🟦 App: Carregant dades del dashboard...');
        this.modules.dashboard.loadData();
      }
      
      // Inicialitzar navegació d'arbre
      this._initializeNavTree();
      
      // Actualitzar estadístiques del peu
      this._updateFooterStats();

      // Accions ràpides del peu
      this._bindFooterActions();
      
      // Assegurar que la vista per defecte està visible
      if (this.modules.navigation) {
        this.modules.navigation.switchView('dashboard');
      }
    },

    _bindStorageListener() {
      try {
        const STORE_KEY = (window.Quadern?.Constants && window.Quadern.Constants.STORE_KEY) || null;
        if (!STORE_KEY) return;
        window.addEventListener('storage', (e) => {
          try {
            if (e && e.key === STORE_KEY) {
              // Actualitzar indicador del footer i dades del dashboard
              this._updateFooterStats();
              try { this.modules.dashboard && this.modules.dashboard.loadData(); } catch(_){}
            }
          } catch(err) {
            console.warn('Storage listener error:', err);
          }
        });
      } catch(e) { console.warn('No storage listener bound', e); }
    },

    _bindFooterActions() {
      const footer = document.querySelector('.quadern-footer');
      if (!footer) return;
      footer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-quick-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-quick-action');
        if (!action) return;
        try {
          if (this.modules?.dashboard?.handleQuickAction) {
            this.modules.dashboard.handleQuickAction(action);
          }
        } catch (err) {
          console.error('Footer quick action error:', err);
        }
      });
    },

    _initializeNavTree() {
      // Delegar a Navigation module si existeix
      if (this.modules.navigation) {
        this.modules.navigation.initializeNavTree();
      }
      
      // També carregar estructura al nav-tree principal
      this._loadCourseStructure();
    },
    
    async _loadCourseStructure() {
      const navTree = document.getElementById('nav-tree');
      if (!navTree) return;
      
      console.log('🟦 App: Carregant estructura completa del curs...');
      
      // Mostrar loader inicial
      navTree.innerHTML = `
        <div class="nav-loading">
          <div class="loading-spinner"></div>
          <p>Carregant estructura del curs...</p>
        </div>
      `;
      
      try {
        // SEMPRE carregar estructura fresca per obtenir comptadors de notes correctes
        let completeStructure = null;
        if (this.modules.discovery) {
          console.log('🟦 App: Carregant estructura fresca per actualitzar comptadors...');
          completeStructure = await this.modules.discovery.loadCompleteStructure();
          
          // Fallback al storage només si falla la càrrega fresca
          if (!completeStructure) {
            console.log('🟦 App: Fallback a estructura del storage');
            completeStructure = this.modules.discovery.loadCourseFromStorage();
          }
          
          if (!completeStructure || Object.keys(completeStructure).length === 0) {
            navTree.innerHTML = `
              <div class="nav-empty">
                <i class="bi bi-journal-text"></i>
                <p>No s'ha trobat estructura del curs</p>
                <p>Comprova la configuració del curs</p>
              </div>
            `;
            return;
          }
          
          // SISTEMA NOU: Usar NavigationTree COMPLETAMENT
          console.log('🆕 App: Inicialitzant NavigationTree NOU sistema');
          
          if (window.Quadern?.NavigationTree) {
            window.Quadern.NavigationTree.init();
            console.log('✅ App: NavigationTree inicialitzat correctament');
          } else {
            console.error('❌ App: NavigationTree no trobat');
            navTree.innerHTML = `
              <div class="nav-error">
                <i class="bi bi-exclamation-circle"></i>
                <p>Error carregant sistema de navegació nou</p>
              </div>
            `;
          }
          
          // DEBUG: Mostrar structure HTML real generada
          console.log('🏗️ App: HTML STRUCTURE generat:', navTree.innerHTML.substring(0, 1000) + '...');
          
          // VALIDACIÓ: Test manual dels selectors després de generar HTML
          setTimeout(() => {
            const allHeaders = document.querySelectorAll('.nav-unit-header, .nav-block-header');
            console.log('🔍 VALIDACIÓ: Headers trobats:', allHeaders.length);
            allHeaders.forEach((header, index) => {
              console.log(`Header ${index}:`, {
                element: header,
                classes: header.className,
                tagName: header.tagName,
                parentClasses: header.parentElement?.className,
                hasTabindex: header.hasAttribute('tabindex'),
                hasRole: header.hasAttribute('role')
              });
            });
          }, 500);
          
          // Mostrar estadístiques (Discovery ja té courseStructure assignat)
          const stats = this.modules.discovery.getStructureStats();
          if (stats) {
            console.log('📊 App: Estadístiques estructura:', stats);
          } else {
            console.warn('⚠️ App: No s\'han pogut obtenir estadístiques');
          }
          
          console.log('✅ App: Estructura completa carregada');
          // Actualitzar estadístiques del peu un cop carregada l'estructura
          this._updateFooterStats();
        } else {
          throw new Error('Discovery module no disponible');
        }
        
      } catch (error) {
        console.error('❌ App: Error carregant estructura:', error);
        navTree.innerHTML = `
          <div class="nav-error">
            <i class="bi bi-exclamation-triangle"></i>
            <p>Error carregant l'estructura</p>
            <button class="btn btn-sm btn-outline" onclick="window.Quadern.App.refreshCourseStructure()">
              <i class="bi bi-arrow-clockwise"></i> Intentar de nou
            </button>
          </div>
        `;
      }
    },
    
    _buildNavStructure(notes) {
      const structure = {};
      
      notes.forEach(note => {
        const unitKey = `U${note.unitat || '?'}`;
        const blockKey = `B${note.bloc || '?'}`;
        
        if (!structure[unitKey]) {
          structure[unitKey] = { name: unitKey, blocks: {}, noteCount: 0 };
        }
        
        if (!structure[unitKey].blocks[blockKey]) {
          structure[unitKey].blocks[blockKey] = { name: blockKey, sections: {}, noteCount: 0 };
        }
        
        const sectionKey = note.sectionTitle || note.sectionId || 'Sense títol';
        if (!structure[unitKey].blocks[blockKey].sections[sectionKey]) {
          structure[unitKey].blocks[blockKey].sections[sectionKey] = { 
            name: sectionKey, 
            notes: [],
            url: note.pageUrl
          };
        }
        
        structure[unitKey].blocks[blockKey].sections[sectionKey].notes.push(note);
        structure[unitKey].blocks[blockKey].noteCount++;
        structure[unitKey].noteCount++;
      });
      
      return structure;
    },
    
    _renderNavStructure(structure) {
      let html = '';
      
      Object.entries(structure).forEach(([unitKey, unit]) => {
        html += `
          <div class="nav-unit">
            <div class="nav-unit-header">
              <i class="bi bi-chevron-right nav-toggle"></i>
              <i class="bi bi-folder"></i>
              <span>${unit.name}</span>
              <span class="nav-count">(${unit.noteCount})</span>
            </div>
            <div class="nav-unit-content">
        `;
        
        Object.entries(unit.blocks).forEach(([blockKey, block]) => {
          html += `
            <div class="nav-block">
              <div class="nav-block-header">
                <i class="bi bi-chevron-right nav-toggle"></i>
                <i class="bi bi-folder-fill"></i>
                <span>${block.name}</span>
                <span class="nav-count">(${block.noteCount})</span>
              </div>
              <div class="nav-block-content">
          `;
          
          Object.entries(block.sections).forEach(([sectionKey, section]) => {
            html += `
              <div class="nav-section" data-url="${section.url}">
                <i class="bi bi-file-text"></i>
                <span>${section.name}</span>
                <span class="nav-count">(${section.notes.length})</span>
              </div>
            `;
          });
          
          html += `
              </div>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
      
      return html;
    },

    _renderCompleteStructure(structure) {
      console.log('🎨 App: Renderitzant estructura completa. Unitats:', Object.keys(structure).length);
      let html = '<div class="nav-tree-complete">';
      
      let isFirstUnit = true;
      Object.values(structure).forEach(unitat => {
        const hasNotes = unitat.noteCount > 0;
        const expandedClass = isFirstUnit ? ' expanded' : '';
        const unitClass = hasNotes ? `nav-unit has-notes${expandedClass}` : `nav-unit${expandedClass}`;
        isFirstUnit = false;
        
        html += `
          <div class="${unitClass}" data-unit-id="${unitat.id}">
            <div class="nav-unit-header" role="button" tabindex="0">
              <i class="bi bi-chevron-right nav-toggle" aria-hidden="true"></i>
              <i class="bi bi-folder unit-icon" aria-hidden="true"></i>
              <span class="nav-unit-title">${unitat.nom}</span>
              <div class="nav-badges">
                ${unitat.noteCount > 0 ? `<span class="note-badge">${unitat.noteCount}</span>` : ''}
              </div>
            </div>
            <div class="nav-unit-content">
        `;
        
        Object.values(unitat.blocs).forEach(bloc => {
          const blocHasNotes = bloc.noteCount > 0;
          const blockClass = blocHasNotes ? 'nav-block has-notes' : 'nav-block';
          const sectionCount = Object.keys(bloc.seccions || {}).length;
          
          html += `
            <div class="${blockClass}" data-block-id="${bloc.id}">
              <div class="nav-block-header" role="button" tabindex="0">
                <i class="bi bi-chevron-right nav-toggle" aria-hidden="true"></i>
                <i class="bi bi-folder-fill block-icon" aria-hidden="true"></i>
                <span class="nav-block-title">${bloc.nom}</span>
                <div class="nav-badges">
                  ${bloc.isLoading ? '<span class="loading-badge">⟳</span>' : ''}
                  ${sectionCount > 0 ? `<span class="section-badge">${sectionCount}</span>` : ''}
                  ${bloc.noteCount > 0 ? `<span class="note-badge">${bloc.noteCount}</span>` : ''}
                </div>
              </div>
              <div class="nav-block-content">
          `;
          
          if (bloc.isLoading) {
            html += `
              <div class="nav-loading-sections">
                <i class="bi bi-hourglass-split"></i>
                <span>Carregant seccions...</span>
              </div>
            `;
          } else if (Object.keys(bloc.seccions || {}).length === 0) {
            html += `
              <div class="nav-no-sections">
                <i class="bi bi-info-circle"></i>
                <span>Sense seccions detectades</span>
                ${bloc.url ? `<a href="${bloc.url}" target="_blank" class="nav-link-external">Veure pàgina</a>` : ''}
              </div>
            `;
          } else {
            // Ordenar seccions per ordre
            const sortedSections = Object.values(bloc.seccions).sort((a, b) => a.order - b.order);
            
            sortedSections.forEach(seccio => {
              const sectionHasNotes = seccio.notes.length > 0;
              const sectionClass = sectionHasNotes ? 'nav-section has-notes' : 'nav-section';
              
              html += `
                <div class="${sectionClass}" 
                     data-section-id="${seccio.id}" 
                     data-page-url="${seccio.pageUrl}">
                  <div class="nav-section-content">
                    <i class="bi ${sectionHasNotes ? 'bi-file-text-fill' : 'bi-file-text'} section-icon" aria-hidden="true"></i>
                    <span class="nav-section-title">${seccio.title}</span>
                    <div class="nav-section-actions">
                      ${seccio.notes.length > 0 ? `<span class="note-count">${seccio.notes.length}</span>` : ''}
                      <button class="btn-icon btn-add-note" 
                              title="Afegir nota" 
                              data-unit-id="${unitat.id}"
                              data-block-id="${bloc.id}"
                              data-section-id="${seccio.id}"
                              data-page-url="${seccio.pageUrl}">
                        <i class="bi bi-plus-circle" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            });
          }
          
          html += `
              </div>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      
      // Afegir event listeners per navegació DESPRÉS de renderitzar HTML
      setTimeout(() => {
        console.log('⚙️ App: Configurant event listeners després de renderitzar...');
        this._bindNavigationEvents();
        this._restoreNavigationState();
        this._setupStorageListener();
        
        // CRITICAL: Assegurar que navigation module també actualitzi els seus events
        if (this.modules.navigation) {
          console.log('⚙️ App: Refrescant events del navigation module...');
          this.modules.navigation._activateTreeEvents();
        }
      }, 600); // Augmentat timeout per assegurar que HTML és present
      
      return html;
    },

    _setupStorageListener() {
      console.log('👂 App: Configurant listener per canvis al storage');
      
      // Guardar estat anterior del storage per detectar canvis
      let lastNotesCount = 0;
      if (window.Quadern?.Store) {
        const state = window.Quadern.Store.load();
        lastNotesCount = Object.keys(state.notes.byId || {}).length;
      }
      
      // Verificar canvis cada 2 segons
      setInterval(() => {
        if (window.Quadern?.Store) {
          const state = window.Quadern.Store.load();
          const currentNotesCount = Object.keys(state.notes.byId || {}).length;
          
          if (currentNotesCount !== lastNotesCount) {
            console.log(`🔄 App: Detectat canvi en notes: ${lastNotesCount} → ${currentNotesCount}`);
            lastNotesCount = currentNotesCount;
            
            // Refrescar navegació amb comptadors actualitzats
            this._refreshNavigationCounts();
          }
        }
      }, 2000);
    },

    _refreshNavigationCounts() {
      console.log('🔄 App: Refrescant comptadors de navegació...');
      
      // Re-carregar estructura amb notes actualitzades
      if (this.modules.discovery) {
        // Forçar recàlcul sense cache
        this.modules.discovery.loadCompleteStructure().then(structure => {
          if (structure) {
            // Actualitzar només els badges sense re-renderitzar tot l'HTML
            this._updateNavigationBadges(structure);
          }
        });
      }
    },

    _updateNavigationBadges(structure) {
      console.log('🏷️ App: Actualitzant badges de navegació');
      
      Object.values(structure).forEach(unitat => {
        // Actualitzar badge d'unitat
        const unitElement = document.querySelector(`[data-unit-id="${unitat.id}"]`);
        if (unitElement) {
          const unitBadge = unitElement.querySelector('.note-badge');
          if (unitat.noteCount > 0) {
            if (unitBadge) {
              unitBadge.textContent = unitat.noteCount;
            } else {
              const badgesContainer = unitElement.querySelector('.nav-badges');
              if (badgesContainer) {
                badgesContainer.innerHTML += `<span class="note-badge">${unitat.noteCount}</span>`;
              }
            }
          }
        }
        
        // Actualitzar badges de blocs
        Object.values(unitat.blocs).forEach(bloc => {
          const blockElement = document.querySelector(`[data-block-id="${bloc.id}"]`);
          if (blockElement) {
            const blockBadge = blockElement.querySelector('.note-badge');
            if (bloc.noteCount > 0) {
              if (blockBadge) {
                blockBadge.textContent = bloc.noteCount;
              } else {
                const badgesContainer = blockElement.querySelector('.nav-badges');
                if (badgesContainer) {
                  badgesContainer.innerHTML += `<span class="note-badge">${bloc.noteCount}</span>`;
                }
              }
            }
          }
        });
      });
    },

    _bindNavigationEvents() {
      console.log('🟦 App: Vinculant events de navegació...');
      
      const navTree = document.getElementById('nav-tree');
      if (!navTree) {
        console.warn('🟨 App: No s\'ha trobat l\'element nav-tree');
        return;
      }
      
      // Event delegation per tots els clicks dins l'arbre de navegació  
      navTree.addEventListener('click', (e) => {
        console.log('🖱️ CLICK: Event detectat. Target:', e.target, 'Classes:', e.target.className, 'TagName:', e.target.tagName);
        
        // Debug exhaustiu de l'estructura DOM
        console.log('🔍 CLICK DEBUG EXHAUSTIU:', {
          target: e.target,
          targetTag: e.target.tagName,
          targetClasses: e.target.className,
          targetId: e.target.id,
          
          // Jerarquia ascendent completa
          parent1: e.target.parentElement,
          parent1Classes: e.target.parentElement?.className,
          parent1Tag: e.target.parentElement?.tagName,
          
          parent2: e.target.parentElement?.parentElement,
          parent2Classes: e.target.parentElement?.parentElement?.className,
          parent2Tag: e.target.parentElement?.parentElement?.tagName,
          
          parent3: e.target.parentElement?.parentElement?.parentElement,
          parent3Classes: e.target.parentElement?.parentElement?.parentElement?.className,
          parent3Tag: e.target.parentElement?.parentElement?.parentElement?.tagName,
          
          // Test manual de closest()
          closestHeader: e.target.closest('.nav-unit-header, .nav-block-header'),
          closestNavUnit: e.target.closest('.nav-unit'),
          closestNavBlock: e.target.closest('.nav-block'),
          
          // Posició del click
          clickCoords: { x: e.clientX, y: e.clientY },
          elementAtPoint: document.elementFromPoint(e.clientX, e.clientY)
        });
        
        // Gestionar clicks en headers d'unitats i blocs amb múltiples estratègies
        let header = e.target.closest('.nav-unit-header, .nav-block-header');
        
        // ESTRATÈGIA ALTERNATIVA: Si no trobem header, potser estem fent click en un element fill
        if (!header) {
          // Provar amb el target directament si té les classes correctes
          if (e.target.classList.contains('nav-unit-header') || e.target.classList.contains('nav-block-header')) {
            header = e.target;
          }
          // Provar amb parents immediats
          else if (e.target.parentElement && (e.target.parentElement.classList.contains('nav-unit-header') || e.target.parentElement.classList.contains('nav-block-header'))) {
            header = e.target.parentElement;
          }
        }
        
        if (header) {
          console.log('🖱️ App: Click en header detectat:', {
            element: header,
            className: header.className,
            isUnitHeader: header.classList.contains('nav-unit-header'),
            isBlockHeader: header.classList.contains('nav-block-header')
          });
          e.preventDefault();  // Només prevenir default per headers
          e.stopPropagation(); // Només aturar propagació per headers
          
          if (this.modules.navigation) {
            this.modules.navigation.toggleTreeItem(header);
          } else {
            console.warn('🟨 App: navigation module no disponible');
          }
          return;
        }
        
        // Gestionar clicks en seccions
        const section = e.target.closest('.nav-section');
        if (section && !e.target.closest('.btn-add-note')) {
          e.preventDefault();   // Només per seccions
          e.stopPropagation();  // Només per seccions
          
          // Comportament per defecte: obrir pàgina en nova pestanya
          const pageUrl = section.dataset.pageUrl;
          const sectionId = section.dataset.sectionId;
          
          if (pageUrl) {
            const fullUrl = `${pageUrl}#${sectionId}`;
            console.log('🧭 App: Navegant a secció:', fullUrl);
            window.open(fullUrl, '_blank');
          }
          
          // També notificar al navigation module
          if (this.modules.navigation) {
            this.modules.navigation.selectSection(section);
          }
          return;
        }
        
        // Gestionar clicks en botons d'afegir nota
        const addNoteBtn = e.target.closest('.btn-add-note');
        if (addNoteBtn) {
          e.preventDefault();   // Només per botons
          e.stopPropagation();  // Només per botons
          
          const unitId = addNoteBtn.dataset.unitId;
          const blockId = addNoteBtn.dataset.blockId;
          const sectionId = addNoteBtn.dataset.sectionId;
          const pageUrl = addNoteBtn.dataset.pageUrl;
          
          console.log('➕ App: Afegir nota per secció:', {unitId, blockId, sectionId, pageUrl});
          
          // Canviar a vista editor i crear nova nota
          if (this.switchView) {
            this.switchView('editor');
            
            // Crear nota amb context
            setTimeout(() => {
              if (this.modules.editor && this.modules.editor.createNewNoteForSection) {
                this.modules.editor.createNewNoteForSection(unitId, blockId, sectionId, pageUrl);
              }
            }, 200);
          }
          return;
        }
        
        // Si arribes aquí, és un click general - no fer res especial
        console.log('🖱️ App: Click general en navegació, deixant comportament normal');
      });
      
      // COMPARACIÓ: Event listener per keyboard
      navTree.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          console.log('⌨️ KEYBOARD: Event detectat. Key:', e.key, 'Target:', e.target, 'Classes:', e.target.className, 'TagName:', e.target.tagName);
          
          // Debug detallat del keyboard event
          console.log('🔍 KEYBOARD DEBUG:', {
            key: e.key,
            target: e.target,
            targetClasses: e.target.className,
            parentElement: e.target.parentElement,
            parentClasses: e.target.parentElement?.className,
            activeElement: document.activeElement,
            focusedClasses: document.activeElement?.className
          });
          
          // Verificar si el target és un header
          const header = e.target.closest('.nav-unit-header, .nav-block-header');
          console.log('⌨️ KEYBOARD: Header trobat:', header ? header.className : 'NO');
        }
      });
      
      // Activar events del navigation module
      if (this.modules.navigation) {
        this.modules.navigation.refreshTreeEvents();
      }
    },

    _restoreNavigationState() {
      try {
        if (!window.Quadern?.Store) return;
        
        const state = window.Quadern.Store.load();
        const { openUnits, openBlocs } = state.ui.explorer;
        
        console.log('🔄 App: Restaurant estat navegació:', { openUnits, openBlocs });
        
        // Expandir unitats obertes
        openUnits.forEach(unitId => {
          const unitElement = document.querySelector(`[data-unit-id="${unitId}"]`);
          if (unitElement && !unitElement.classList.contains('expanded')) {
            unitElement.classList.add('expanded');
            
            // Actualitzar icona
            const arrow = unitElement.querySelector('.nav-toggle');
            if (arrow) {
              arrow.style.transform = 'rotate(90deg)';
            }
            
            // Actualitzar accessibilitat
            const header = unitElement.querySelector('.nav-unit-header');
            if (header) {
              header.setAttribute('aria-expanded', 'true');
            }
          }
        });
        
        // Expandir blocs oberts
        Object.entries(openBlocs).forEach(([unitId, blocIds]) => {
          if (Array.isArray(blocIds)) {
            blocIds.forEach(blockId => {
              const blockSelector = `[data-unit-id="${unitId}"] [data-block-id="${blockId}"]`;
              const blockElement = document.querySelector(blockSelector);
              if (blockElement && !blockElement.classList.contains('expanded')) {
                blockElement.classList.add('expanded');
                
                // Actualitzar icona
                const arrow = blockElement.querySelector('.nav-toggle');
                if (arrow) {
                  arrow.style.transform = 'rotate(90deg)';
                }
                
                // Actualitzar accessibilitat
                const header = blockElement.querySelector('.nav-block-header');
                if (header) {
                  header.setAttribute('aria-expanded', 'true');
                }
              }
            });
          }
        });
        
        console.log('✅ App: Estat navegació restaurat');
        
      } catch (error) {
        console.error('❌ App: Error restaurant estat navegació:', error);
      }
    },

    _updateFooterStats() {
      // Delegar a Components module si existeix
      if (this.modules.components) {
        this.modules.components.updateFooterStats();
      }
    },

    // =============================
    // API PÚBLICA
    // =============================

    // Mètodes per canviar vista
    switchView(viewName) {
      console.log('🟦 App: switchView cridat per:', viewName);
      if (this.modules.navigation) {
        return this.modules.navigation.switchView(viewName);
      } else {
        console.error('❌ App: Navigation module no disponible');
      }
    },

    // Mètodes per gestionar notes
    selectNote(noteId) {
      if (this.modules.editor) {
        return this.modules.editor.selectNote(noteId);
      }
    },

    // Mètodes per actualitzar dades
    refreshData() {
      this.notesCache = null;
      this.statsCache = null;
      
      // Notificar tots els mòduls que les dades han canviat
      Object.values(this.modules).forEach(module => {
        if (module && typeof module.refreshData === 'function') {
          module.refreshData();
        }
      });

      // Actualitzar peu i estructura sense recàrrega
      try { this._updateFooterStats(); } catch {}
      try { if (window.Quadern?.NavigationTree?.refreshData) window.Quadern.NavigationTree.refreshData(); } catch {}
    },

    // Bridge amb el sistema de panells
    syncWithPanel() {
      this.refreshData();
      if (this.modules.dashboard) {
        this.modules.dashboard.loadData();
      }
    },

    // Mètode per debugging
    getModuleStatus() {
      const status = {};
      Object.keys(this.modules).forEach(key => {
        status[key] = this.modules[key] ? 'loaded' : 'not_loaded';
      });
      return status;
    },

    // Mètode per refrescar estructura del curs
    async refreshCourseStructure() {
      console.log('🟦 App: Refrescant estructura del curs...');
      await this._loadCourseStructure();
      this._updateFooterStats();
    }
  };

  // Exposar al namespace global
  window.Quadern = window.Quadern || {};
  window.Quadern.App = QuadernApp;

  // Auto-inicialització quan DOM estigui llest
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => QuadernApp.init());
  } else {
    QuadernApp.init();
  }

})();
