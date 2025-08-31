/*
  Quadern de Notes - Sistema d'Esdeveniments
  Gestió centralitzada d'esdeveniments globals
*/

;(function() {
  'use strict';

  const Events = {
    app: null,
    listeners: {},

    // =============================
    // SISTEMA EMIT/ON
    // =============================

    emit(event, data) {
      console.log(`📡 Events: emit ${event}`, data);
      if (this.listeners[event]) {
        this.listeners[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`❌ Events: Error en listener ${event}:`, error);
          }
        });
      }
    },

    on(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
      console.log(`👂 Events: listener registrat per ${event}`);
    },

    off(event, callback) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      }
    },

    // =============================
    // INICIALITZACIÓ
    // =============================

    init(app) {
      this.app = app;
      console.log('🟦 Events: Inicialitzant sistema d\'esdeveniments...');
      
      this._bindGlobalEvents();
      this._bindKeyboardShortcuts();
      this._bindScrollEvents();
      
      console.log('✅ Events: Sistema d\'esdeveniments inicialitzat');
    },

    // =============================
    // ESDEVENIMENTS GLOBALS
    // =============================

    _bindGlobalEvents() {
      // Event delegation per a tots els clics
      document.addEventListener('click', (e) => this._handleGlobalClick(e));
      
      // Cerca global
      const globalSearch = document.getElementById('global-search-input');
      if (globalSearch) {
        globalSearch.addEventListener('input', (e) => {
          if (e.target.value.length > 2) {
            this._performGlobalSearch(e.target.value);
          }
        });
      }

      // Canvis de hash per navegació
      window.addEventListener('hashchange', () => this._handleHashChange());
    },

    _handleGlobalClick(e) {
      // Navegació de vistes
      const viewBtn = e.target.closest('.view-btn');
      if (viewBtn) {
        e.preventDefault();
        const view = viewBtn.dataset.view;
        console.log('🎯 Events: Click en view button:', view);
        this._switchView(view);
        return;
      }

      // Accions ràpides del dashboard
      const actionBtn = e.target.closest('.action-btn');
      if (actionBtn) {
        e.preventDefault();
        const action = actionBtn.dataset.action;
        this._handleQuickAction(action);
        return;
      }

      // Botons d'exportació
      const exportBtn = e.target.closest('.export-btn');
      if (exportBtn) {
        e.preventDefault();
        const format = exportBtn.dataset.format;
        this._exportNotes(format);
        return;
      }

      // Navegació en arbre
      const treeHeader = e.target.closest('.tree-item-header');
      if (treeHeader && treeHeader.querySelector('.tree-arrow')) {
        e.preventDefault();
        this._toggleTreeItem(treeHeader);
        return;
      }

      // Selecció de secció per l'editor
      if (treeHeader && !treeHeader.querySelector('.tree-arrow')) {
        e.preventDefault();
        this._selectSection(treeHeader);
        return;
      }

      // Eliminat: click sobre targetes/preview de nota (la targeta no és clicable)

      // Controls UI globals
      this._handleUIControls(e);
    },

    _handleUIControls(e) {
      // Tornar a dalt
      if (e.target.closest('#back-to-top')) {
        e.preventDefault();
        this._scrollToTop();
        return;
      }

      // Tancar modal
      if (e.target.closest('.modal-close, .modal-backdrop')) {
        e.preventDefault();
        this._closeModal();
        return;
      }

      // Tancar toast
      if (e.target.closest('.toast-close')) {
        e.preventDefault();
        this._hideToast();
        return;
      }

      // Toggle theme
      if (e.target.closest('#theme-toggle')) {
        e.preventDefault();
        this._toggleTheme();
        return;
      }
    },

    // =============================
    // DRECERES DE TECLAT
    // =============================

    _bindKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S: Guardar nota actual
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          this._saveCurrentNote();
          return;
        }

        // Ctrl/Cmd + N: Nova nota
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
          e.preventDefault();
          this._createNewNote();
          return;
        }

        // Ctrl/Cmd + F: Cerca
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault();
          this._focusSearch();
          return;
        }

        // Escape: Tancar modals/panels
        if (e.key === 'Escape') {
          this._handleEscape();
          return;
        }

        // Navegació amb fletxes (quan no s'està editant)
        if (!this._isEditing()) {
          this._handleNavigationKeys(e);
        }
      });
    },

    _isEditing() {
      const activeElement = document.activeElement;
      return activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );
    },

    _handleNavigationKeys(e) {
      switch(e.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          if (!e.ctrlKey && !e.metaKey) {
            const views = ['dashboard', 'editor', 'search', 'import-export', 'study'];
            const viewIndex = parseInt(e.key) - 1;
            if (views[viewIndex]) {
              e.preventDefault();
              this._switchView(views[viewIndex]);
            }
          }
          break;
      }
    },

    // =============================
    // SCROLL EVENTS
    // =============================

    _bindScrollEvents() {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            this._handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      });
    },

    _handleScroll() {
      // Mostrar/ocultar botó "tornar a dalt"
      const backToTop = document.getElementById('back-to-top');
      if (backToTop) {
        const show = window.scrollY > 300;
        backToTop.style.display = show ? 'block' : 'none';
      }

      // Actualitzar navegació activa (si s'escau)
      this._updateActiveSection();
    },

    // =============================
    // DELEGACIÓ D'ACCIONS
    // =============================

    _switchView(view) {
      console.log('🎯 Events: Delegant switchView a app:', view);
      if (this.app && this.app.switchView) {
        this.app.switchView(view);
      } else {
        console.error('❌ Events: app.switchView no disponible');
      }
    },

    _handleQuickAction(action) {
      if (this.app.modules.dashboard && this.app.modules.dashboard.handleQuickAction) {
        this.app.modules.dashboard.handleQuickAction(action);
      }
    },

    _exportNotes(format) {
      if (this.app.modules.formatters && this.app.modules.formatters.export) {
        this.app.modules.formatters.export(format);
      }
    },

    _toggleTreeItem(header) {
      if (this.app.modules.navigation && this.app.modules.navigation.toggleTreeItem) {
        this.app.modules.navigation.toggleTreeItem(header);
      }
    },

    _selectSection(header) {
      if (this.app.modules.navigation && this.app.modules.navigation.selectSection) {
        this.app.modules.navigation.selectSection(header);
      }
    },

    _selectNote(noteId) {
      // Si estem al dashboard, anar a l'editor
      if (this.app.currentView === 'dashboard') {
        this._switchView('editor');
        setTimeout(() => {
          if (this.app.modules.editor && this.app.modules.editor.selectNote) {
            this.app.modules.editor.selectNote(noteId);
          }
        }, 100);
      } else if (this.app.modules.editor && this.app.modules.editor.selectNote) {
        this.app.modules.editor.selectNote(noteId);
      }
    },

    _performGlobalSearch(query) {
      if (this.app.modules.search && this.app.modules.search.performGlobalSearch) {
        this.app.modules.search.performGlobalSearch(query);
      }
    },

    _scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    _closeModal() {
      if (this.app.modules.components && this.app.modules.components.closeModal) {
        this.app.modules.components.closeModal();
      }
    },

    _hideToast() {
      if (this.app.modules.components && this.app.modules.components.hideToast) {
        this.app.modules.components.hideToast();
      }
    },

    _toggleTheme() {
      document.body.classList.toggle('dark-theme');
      localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    },

    _saveCurrentNote() {
      if (this.app.modules.editor && this.app.modules.editor.saveCurrentNote) {
        this.app.modules.editor.saveCurrentNote();
      }
    },

    _createNewNote() {
      this._switchView('editor');
      setTimeout(() => {
        if (this.app.modules.editor && this.app.modules.editor.createNewNote) {
          this.app.modules.editor.createNewNote();
        }
      }, 100);
    },

    _focusSearch() {
      const searchInput = document.getElementById('global-search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },

    _handleEscape() {
      // Tancar modals oberts
      const modal = document.querySelector('.modal.show, .qnp-panel[style*="display: block"]');
      if (modal) {
        this._closeModal();
        return;
      }

      // Netejar cerca activa
      const searchInput = document.getElementById('global-search-input');
      if (searchInput && searchInput.value) {
        searchInput.value = '';
        searchInput.blur();
        return;
      }
    },

    _handleHashChange() {
      // Gestionar canvis de hash per navegació directa
      const hash = window.location.hash.slice(1);
      if (hash && ['dashboard', 'editor', 'search', 'import-export', 'study'].includes(hash)) {
        this._switchView(hash);
      }
    },

    _updateActiveSection() {
      // Actualitzar secció activa basada en scroll (implementar si cal)
    }
  };

  // Exposar al namespace
  window.Quadern = window.Quadern || {};
  window.Quadern.Events = Events;

})();
