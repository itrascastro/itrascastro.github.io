/*
  SISTEMA NAVIGATION IN-PLACE - Rèplica exacta de navigator-idea-3.html
  Navegació que reemplaça elements en la seva mateixa posició
*/

;(function() {
  'use strict';

  const NavigationDrillDown = {
    
    // Estat de navegació - EXACTE com l'HTML
    activePath: [], // Array d'OBJECTES que representa la ruta actual
    activeItemId: null,
    treeData: null,
    container: null,

    init() {
      this.container = document.getElementById('nav-tree');
      if (!this.container) {
        console.error('NavigationDrillDown: Container #nav-tree no trobat');
        return;
      }
      this.loadCourseStructure();
    },

    async loadCourseStructure() {
      this.container.innerHTML = `
        <div class="nav-loading">
          <p>Carregant estructura del curs...</p>
        </div>
      `;

      try {
        const structure = await window.Quadern.Discovery.loadCompleteStructure();
        
        if (structure && Object.keys(structure).length > 0) {
          this.treeData = this.transformToHierarchical(structure);
          this.render();
        } else {
          this.renderEmpty();
        }
      } catch (error) {
        console.error('NavigationDrillDown: Error carregant estructura:', error);
        this.renderError();
      }
    },

    transformToHierarchical(structure) {
      const root = {
        id: 'root',
        title: 'Estructura del Curs',
        children: []
      };

      Object.keys(structure).forEach(unitKey => {
        const unitat = structure[unitKey];
        const unitNode = {
          id: `unit-${unitat.id}`,
          title: `Unitat ${unitat.id}`,
          badge: this.calculateUnitNotes(unitat),
          badgeColor: 'green',
          children: []
        };

        if (unitat.blocs) {
          Object.keys(unitat.blocs).forEach(blocKey => {
            const bloc = unitat.blocs[blocKey];
            const blocNode = {
              id: `bloc-${bloc.id}`,
              title: `Bloc ${bloc.id}`,
              badge: this.calculateBlocNotes(bloc),
              badgeColor: 'blue',
              unitId: unitat.id,
              children: []
            };

            if (bloc.seccions) {
              Object.keys(bloc.seccions).forEach(sectionKey => {
                const seccio = bloc.seccions[sectionKey];
                const sectionNode = {
                  id: `section-${seccio.id}`,
                  title: seccio.title,
                  unitId: unitat.id,
                  blocId: bloc.id,
                  sectionId: seccio.id,
                  pageUrl: bloc.url,
                  notes: seccio.notes || []
                };

                if (sectionNode.notes.length > 0) {
                  sectionNode.badge = sectionNode.notes.length;
                  sectionNode.badgeColor = 'blue';
                }

                blocNode.children.push(sectionNode);
              });
            }

            unitNode.children.push(blocNode);
          });
        }

        root.children.push(unitNode);
      });

      return root;
    },


    // RENDERITZACIÓ PRINCIPAL
    render() {
      if (!this.container) return;
      
      const treeList = this.container.querySelector('.tree-list') || this.container;
      treeList.innerHTML = '';
      const activeUnitId = this.activePath.length > 0 ? this.activePath[0].id : null;

      this.treeData.children.forEach(unitNode => {
        if (unitNode.id === activeUnitId) {
          // VISTA EXPANDIDA
          const currentNode = this.activePath[this.activePath.length - 1];

          // 1. Renderitzar la capçalera
          const headerLi = document.createElement('li');
          headerLi.className = 'tree-header-item';
          
          const breadcrumbContainer = document.createElement('div');
          breadcrumbContainer.className = 'header-title-container';

          this.activePath.forEach((node, index) => {
            const isLast = index === this.activePath.length - 1;

            const crumbButton = document.createElement('button');
            crumbButton.className = 'breadcrumb-button';
            
            crumbButton.disabled = isLast && this.activePath.length > 1;
            
            const iconType = node.children ? (node.id.startsWith('unit') ? 'folder' : 'block') : 'file';
            const iconHtml = this.getIcon(iconType);

            crumbButton.innerHTML = `${iconHtml}<span>${node.title}</span>`;

            if (!isLast) {
              crumbButton.addEventListener('click', () => {
                this.activePath = this.activePath.slice(0, index + 1);
                this._applyFilterForActivePath();
                this.render();
              });
            } else {
              crumbButton.addEventListener('click', () => {
                if (this.activePath.length === 1) {
                  this.activePath = [];
                  // Tornar a arrel: eliminar filtre només si estem al dashboard
                  const currentView = (window.Quadern?.App?.currentView) || '';
                  if (currentView === 'dashboard' && window.Quadern?.Dashboard?.setStructureFilter) {
                    window.Quadern.Dashboard.setStructureFilter(null);
                  }
                  this.render();
                  // En editor: mostrar empty-state (sense notes a la selecció)
                  if (currentView === 'editor') {
                    try {
                      if (window.Quadern?.Editor?.showNotesForSection) {
                        window.Quadern.Editor.showNotesForSection({
                          unitId: null,
                          blocId: null,
                          sectionId: null,
                          sectionTitle: 'Totes les seccions',
                          notes: []
                        });
                      }
                    } catch(e){ /* noop */ }
                  }
                }
              });
            }
            breadcrumbContainer.appendChild(crumbButton);

            if (!isLast) {
              const separator = document.createElement('span');
              separator.className = 'breadcrumb-separator';
              separator.textContent = '›';
              breadcrumbContainer.appendChild(separator);
            }
          });

          headerLi.appendChild(breadcrumbContainer);
          treeList.appendChild(headerLi);

          // 2. Renderitzar els fills del node actual
          if (currentNode.children && currentNode.children.length > 0) {
            currentNode.children.forEach(childNode => {
              treeList.appendChild(this.createTreeItem(childNode, false));
            });
          } else {
            const emptyLi = document.createElement('li');
            emptyLi.className = 'tree-empty';
            emptyLi.textContent = 'Aquesta carpeta està buida.';
            treeList.appendChild(emptyLi);
          }
        } else {
          // VISTA COL·LAPSADA
          treeList.appendChild(this.createTreeItem(unitNode, true));
        }
      });
    },

    // CREAR ELEMENT DE LLISTA
    createTreeItem(node, isRootClick) {
      const li = document.createElement('li');
      li.className = 'tree-item';
      li.dataset.id = node.id;
      li.dataset.unitId = node.unitId || '';
      li.dataset.blocId = node.blocId || '';
      li.dataset.sectionId = node.sectionId || '';
      li.dataset.pageUrl = node.pageUrl || '';
      
      if (node.id === this.activeItemId) li.classList.add('active');

      const iconType = node.children ? (node.id.startsWith('unit') ? 'folder' : 'block') : 'file';
      const badgeHtml = node.badge ? `<span class="badge badge-${node.badgeColor}">${node.badge}</span>` : '';
      
      const chevronHtml = '';

      li.innerHTML = `${this.getIcon(iconType)}<span class="item-text">${node.title}</span>${badgeHtml}${chevronHtml}`;
      
      li.addEventListener('click', () => {
        const currentView = (window.Quadern?.App?.currentView) || '';
        if (node.children) {
          if (isRootClick) {
            this.activePath = [node]; // REEMPLAÇA, no anida
          } else {
            this.activePath.push(node); // Anida dins del mateix arbre
          }
          // En editor: mostrar notes per unitat/bloc; en dashboard: filtrar
          if (currentView === 'editor') {
            // Netejar selecció de secció prèvia
            this.activeItemId = null;
            const unitMatch = /^unit-(\d+)/.exec(node.id || '');
            if (unitMatch) {
              const uid = parseInt(unitMatch[1], 10);
              const notes = this._collectNotesForUnit(uid);
              if (window.Quadern?.Editor?.showNotesForSection) {
                window.Quadern.Editor.showNotesForSection({
                  unitId: uid,
                  blocId: null,
                  sectionId: null,
                  sectionTitle: 'Totes les seccions',
                  notes
                });
              }
            } else if (node.id && node.id.startsWith('bloc-')) {
              const bid = parseInt(String(node.id).replace('bloc-',''), 10);
              const uid = parseInt(node.unitId, 10);
              const notes = this._collectNotesForBlock(uid, bid);
              if (window.Quadern?.Editor?.showNotesForSection) {
                window.Quadern.Editor.showNotesForSection({
                  unitId: uid,
                  blocId: bid,
                  sectionId: null,
                  sectionTitle: 'Totes les seccions',
                  notes
                });
              }
            }
          } else if (currentView === 'dashboard') {
            const unitMatch = /^unit-(\d+)/.exec(node.id || '');
            if (unitMatch) {
              this._setDashboardFilter({ unitId: parseInt(unitMatch[1], 10) });
            } else if (node.id && node.id.startsWith('bloc-')) {
              this._setDashboardFilter({ unitId: parseInt(node.unitId, 10), blocId: parseInt(String(node.id).replace('bloc-',''), 10) });
            }
          }
        } else {
          this.activeItemId = node.id;
          // És una secció final - en editor: mostrar llista de notes; en dashboard: filtrar
          if (currentView === 'editor') {
            try {
              const notes = (window.Quadern?.Discovery?.getNotesForSection) 
                ? (window.Quadern.Discovery.getNotesForSection(node.unitId, node.blocId, node.sectionId) || [])
                : [];
              if (window.Quadern?.Editor?.showNotesForSection) {
                window.Quadern.Editor.showNotesForSection({
                  sectionId: node.sectionId,
                  unitId: node.unitId,
                  blocId: node.blocId,
                  sectionTitle: node.title,
                  notes
                });
              }
            } catch(e){ console.warn('NavigationTree: error mostrant notes per secció', e); }
          } else {
            this._setDashboardFilter({ unitId: parseInt(node.unitId,10), blocId: parseInt(node.blocId,10), sectionId: String(node.sectionId) });
          }
        }
        this.render();
      });
      
      return li;
    },

    _applyFilterForActivePath(){
      // Detectar nivell actual i aplicar filtre adequat (només en dashboard)
      const currentView = (window.Quadern?.App?.currentView) || '';
      if (currentView !== 'dashboard') return;
      const last = this.activePath[this.activePath.length - 1];
      if (!last) { this._setDashboardFilter(null); return; }
      const unitMatch = /^unit-(\d+)/.exec(last.id || '');
      if (unitMatch) {
        this._setDashboardFilter({ unitId: parseInt(unitMatch[1], 10) });
        return;
      }
      if (last.id && last.id.startsWith('bloc-')) {
        this._setDashboardFilter({ unitId: parseInt(last.unitId,10), blocId: parseInt(String(last.id).replace('bloc-',''),10) });
      }
    },

    _setDashboardFilter(filter){
      try {
        const dash = window.Quadern?.App?.modules?.dashboard || window.Quadern?.Dashboard;
        if (dash?.setStructureFilter) {
          dash.setStructureFilter(filter);
          // Forçar càrrega després d'un breu retard per evitar condicions de carrera
          setTimeout(()=>{
            try { dash.loadData && dash.loadData(); } catch {}
          }, 30);
        }
      } catch(e) { console.warn('NavigationDrillDown: error aplicant filtre dashboard', e); }
    },

    _collectNotesForUnit(unitId){
      try {
        const D = window.Quadern?.Discovery;
        const CS = D?.getCourseStructure?.();
        const u = CS ? CS[`unitat-${parseInt(unitId,10)}`] : null;
        if (!u) return [];
        const notes = [];
        Object.values(u.blocs||{}).forEach(b => {
          Object.values(b.seccions||{}).forEach(s => (s.notes||[]).forEach(n => notes.push(n)) );
        });
        return notes;
      } catch { return []; }
    },
    _collectNotesForBlock(unitId, blocId){
      try {
        const D = window.Quadern?.Discovery;
        const sections = D?.getSectionsForBlock?.(parseInt(unitId,10), parseInt(blocId,10)) || {};
        const notes = [];
        Object.values(sections).forEach(s => (s.notes||[]).forEach(n => notes.push(n)) );
        return notes;
      } catch { return []; }
    },

    selectSection(sectionElement) {
      const previousSelected = this.container.querySelector('.tree-item.active');
      if (previousSelected) {
        previousSelected.classList.remove('active');
      }
      sectionElement.classList.add('active');

      if (window.Quadern?.Navigation) {
        window.Quadern.Navigation.selectSection(sectionElement);
      }
    },

    getIcon(type) {
      const icons = {
        folder: `<i class="bi bi-folder item-icon" style="color: #64748b"></i>`,
        block: `<i class="bi bi-list item-icon" style="color: #64748b"></i>`,
        file: `<i class="bi bi-file-text item-icon" style="color: #9ca3af"></i>`
      };
      return icons[type] || '';
    },

    calculateUnitNotes(unitat) {
      let count = 0;
      if (unitat.blocs) {
        Object.values(unitat.blocs).forEach(bloc => {
          count += this.calculateBlocNotes(bloc);
        });
      }
      return count;
    },

    calculateBlocNotes(bloc) {
      let count = 0;
      if (bloc.seccions) {
        Object.values(bloc.seccions).forEach(seccio => {
          count += (seccio.notes || []).length;
        });
      }
      return count;
    },

    renderEmpty() {
      this.container.innerHTML = `
        <div class="nav-empty">
          <p>No s'ha trobat cap estructura del curs.</p>
        </div>
      `;
    },

    renderError() {
      this.container.innerHTML = `
        <div class="nav-error">
          <p>Error carregant l'estructura del curs.</p>
        </div>
      `;
    },

    refreshData() {
      this.loadCourseStructure();
    },

    // Obrir el tree fins a una unitat/bloc/secció i opcionalment seleccionar nota
    openTo(unitId, blocId = null, sectionId = null, selectedNoteId = null) {
      try {
        if (!this.treeData) return;
        // Construir activePath
        const uId = parseInt(unitId, 10);
        const bId = blocId != null ? parseInt(blocId, 10) : null;
        const sId = sectionId != null ? String(sectionId) : null;

        const unitNode = (this.treeData.children || []).find(n => n.id === `unit-${uId}`);
        if (!unitNode) return;
        const path = [unitNode];
        let blockNode = null;
        if (bId != null) {
          blockNode = (unitNode.children || []).find(n => n.id === `bloc-${bId}`);
          if (blockNode) path.push(blockNode);
        }
        this.activePath = path;
        this.activeItemId = sId ? `section-${sId}` : null;
        this.render();

        // Si som a l'editor, mostrar notes d'aquest àmbit
        const currentView = (window.Quadern?.App?.currentView) || '';
        if (currentView === 'editor') {
          let notes = [];
          if (sId && window.Quadern?.Discovery?.getNotesForSection) {
            notes = window.Quadern.Discovery.getNotesForSection(uId, bId, sId) || [];
            if (window.Quadern?.Editor?.showNotesForSection) {
              window.Quadern.Editor.showNotesForSection({ unitId: uId, blocId: bId, sectionId: sId, sectionTitle: '', notes });
            }
          } else if (bId != null) {
            notes = this._collectNotesForBlock(uId, bId);
            if (window.Quadern?.Editor?.showNotesForSection) {
              window.Quadern.Editor.showNotesForSection({ unitId: uId, blocId: bId, sectionId: null, sectionTitle: 'Totes les seccions', notes });
            }
          } else {
            notes = this._collectNotesForUnit(uId);
            if (window.Quadern?.Editor?.showNotesForSection) {
              window.Quadern.Editor.showNotesForSection({ unitId: uId, blocId: null, sectionId: null, sectionTitle: 'Totes les seccions', notes });
            }
          }
          // Seleccionar nota específica si s'ha demanat
          if (selectedNoteId && window.Quadern?.Editor?.selectNote) {
            setTimeout(() => {
              try {
                const sel = document.getElementById('note-select');
                if (sel) sel.value = selectedNoteId;
                window.Quadern.Editor.selectNote(selectedNoteId);
              } catch {}
            }, 30);
          }
        }
      } catch (e) { console.warn('NavigationTree: openTo error', e); }
    }
  };

  window.Quadern = window.Quadern || {};
  window.Quadern.NavigationTree = NavigationDrillDown;

})();
